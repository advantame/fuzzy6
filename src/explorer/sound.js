// One context per page; each explorer releases sources, fetches and decoded buffers.
let sharedContext;
let stopPageVoice;
export function createSound(voice, { context: supplied, fetch: fetcher = globalThis.fetch, warn = console.warn } = {}) {
  let context = supplied;
  let active;
  let destroyed = false;
  const cache = new Map();
  const warned = new Set();
  const waiters = new Set();
  function getContext() {
    if (!context) {
      const Constructor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!Constructor) return null;
      sharedContext ??= new Constructor();
      context = sharedContext;
    }
    return context;
  }
  function report(key) {
    if (destroyed || warned.has(key)) return;
    warned.add(key);
    warn(`Motion Explorer: unavailable narration ${key}`);
  }
  function stop() {
    if (!active) return;
    try { active.source.stop(); } catch { /* already ended */ }
    active.source.disconnect();
    active.gain.disconnect();
    active = undefined;
    if (stopPageVoice === stop) stopPageVoice = undefined;
  }
  async function load(clipId, line) {
    if (!line.take) return;
    const key = `${clipId}/${line.id}@${line.speed}`;
    if (cache.has(key)) return cache.get(key).promise;
    const entry = { clipId, controller: new AbortController() };
    cache.set(key, entry);
    entry.promise = (async () => {
      let timer;
      try {
        const url = voice?.url?.(line.take.file);
        const ctx = getContext();
        if (!url || !ctx) throw new Error('missing audio');
        const timeout = new Promise((_, reject) => {
          timer = setTimeout(() => { entry.controller.abort(); reject(new Error('audio timeout')); }, 15000);
          entry.controller.signal.addEventListener('abort', () => reject(new Error('audio cancelled')), { once: true });
        });
        const decode = async () => {
          const response = await fetcher(url, { signal: entry.controller.signal });
          if (!response.ok) throw new Error('audio fetch failed');
          // Bound bytes before accumulating a response, including missing Content-Length.
          const reader = response.body.getReader();
          const chunks = [];
          let size = 0;
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              size += value.byteLength;
              if (size > 32 * 1024 * 1024) throw new Error('audio exceeds 32 MiB');
              chunks.push(value);
            }
          } catch (error) { await reader.cancel(); throw error; }
          const bytes = new Uint8Array(size);
          let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
          return ctx.decodeAudioData(bytes.buffer);
        };
        const buffer = await Promise.race([decode(), timeout]);
        // Preserve the recorded timeline; reject this line rather than retiming it.
        // Account for floating-point rounding at the inclusive 50ms boundary.
        if (!Number.isFinite(buffer.duration) || !Number.isFinite(line.take.duration) ||
            Math.abs(buffer.duration - line.take.duration) >= 0.05 - 1e-10) throw new Error('audio duration mismatch');
        if (!destroyed && cache.get(key) === entry && !entry.controller.signal.aborted) entry.buffer = buffer;
      } catch {
        if (!entry.controller.signal.aborted || cache.get(key) === entry) report(key);
      } finally { clearTimeout(timer); }
    })();
    return entry.promise;
  }
  function prepare(entries, loadAudio = true) {
    const ids = new Set(entries.map(e => e.id));
    for (const [key, entry] of cache) if (!ids.has(entry.clipId)) {
      cache.delete(key);
      entry.controller.abort();
    }
    const keys = new Set(entries.flatMap(e => e.timeline.lines.filter(l => l.take).map(l => `${e.id}/${l.id}@${l.speed}`)));
    for (const [key, entry] of cache) if (!keys.has(key)) { cache.delete(key); entry.controller.abort(); }
    if (loadAudio) for (const entry of entries) for (const line of entry.timeline.lines) void load(entry.id, line);
  }
  async function waitFirst(clipId, timeline) {
    const line = timeline.lines.find(l => l.spoken);
    if (!line?.take) return;
    let finish;
    const timeout = new Promise(resolve => {
      const timer = setTimeout(() => { waiters.delete(finish); resolve(); }, 3000);
      finish = () => { clearTimeout(timer); waiters.delete(finish); resolve(); };
      waiters.add(finish);
    });
    try { await Promise.race([load(clipId, line), timeout]); }
    finally { finish(); }
  }
  function clock(clipId, timeline, t, dt) {
    const previousTime = t;
    // A quantized audio timestamp must not move the picture backwards or leave
    // it unchanged. Use only a floating-point step, not dt, to avoid audio drift.
    const minimumTime = t + (dt > 0 ? Number.EPSILON * Math.max(1, t) : 0);
    const ctx = context;
    if (!ctx || ctx.state !== 'running') { stop(); return Math.min(timeline.duration, Math.max(minimumTime, t + dt)); }
    if (active) {
      // Use the audio clock even after a delayed frame; never accumulate rAF drift.
      t = Math.min(active.end, Math.max(minimumTime, active.t + (ctx.currentTime - active.when)));
      if (t >= active.end) stop();
      else return t;
    } else t = Math.min(timeline.duration, Math.max(minimumTime, t + dt));
    const line = timeline.lines.find(l => l.voice <= t && t < l.end && l.take);
    const buffer = line && cache.get(`${clipId}/${line.id}@${line.speed}`)?.buffer;
    if (!buffer || t - line.voice >= buffer.duration) return t;
    // Crossing a voice boundary during ordinary playback starts at the head. A seek,
    // resume or late download keeps its explicit offset instead.
    if (previousTime < line.voice) t = line.voice;
    const offset = Math.max(0, t - line.voice);
    const remaining = Math.min(line.end - t, buffer.duration - offset);
    // Seeks and late loads near the buffer end can leave only rounding noise.
    // There is no playable audio in less than one sample; use the silent clock.
    if (remaining < 1 / buffer.sampleRate) return t;
    if (stopPageVoice && stopPageVoice !== stop) stopPageVoice();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    const when = ctx.currentTime;
    if (offset > 0) {
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(1, when + 0.02);
    }
    source.start(when, offset, remaining);
    // A shorter decoded buffer leaves a silent remainder of the recorded voice
    // interval. Keep its exact endpoint so finishing cannot restart this line.
    active = { source, gain, when, t, end: line.end };
    stopPageVoice = stop;
    return t;
  }
  return {
    prepare, waitFirst, clock, stop,
    blocked() { return getContext()?.state === 'suspended'; },
    unlock() { const ctx = getContext(); return ctx?.resume().catch(() => {}) ?? Promise.resolve(); },
    destroy() {
      destroyed = true;
      stop();
      for (const entry of cache.values()) entry.controller.abort();
      cache.clear();
      for (const finish of [...waiters]) finish();
    },
  };
}
