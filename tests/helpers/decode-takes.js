// Serialized by page.evaluate: no Node dependencies or captured outer values.
export async function decodeTakes(entries) {
  // VOICEVOX uses 256-sample frames at 24 kHz (1/93.75 s). Millisecond
  // manifest rounding therefore loses at most 1/3000 s. opus.mjs verifies the
  // exact 48 kHz sample count after pre-skip/end trimming. Request that same
  // rate here to avoid an additional browser resampling rounding error.
  const tolerance = 1 / 3000 + 1e-9;
  const context = new AudioContext({ sampleRate: 48000 });
  let count = 0, maxDelta = 0;
  const bounded = async promise => {
    let timer;
    try {
      return await Promise.race([promise, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), 5000);
      })]);
    } finally { clearTimeout(timer); }
  };
  try {
    if (entries.length > 2000) throw new Error(`takes=${entries.length} limit=2000`);
    // Decode serially and discard each buffer; never accumulate PCM for a deck.
    for (const { id, url, duration } of entries) {
      if (!url) throw new Error(`${id}: missing voice.url`);
      if (!(Number.isFinite(duration) && duration > 0 && duration <= 180)) throw new Error(`${id}: duration=${duration}`);
      const controller = new AbortController();
      let reader;
      try {
        await bounded((async () => {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error(`fetch status=${response.status}`);
          reader = response.body.getReader();
          // Same 2 MiB cap as tools/narrate/opus.mjs; enforce before accumulating.
          const chunks = [];
          let size = 0;
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 2 * 1024 ** 2) throw new Error(`bytes>${2 * 1024 ** 2}`);
            chunks.push(value);
          }
          const bytes = new Uint8Array(size);
          let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
          let buffer;
          try { buffer = await context.decodeAudioData(bytes.buffer); }
          catch { throw new Error('decode failed'); }
          const delta = Math.abs(buffer.duration - duration);
          if (!Number.isFinite(delta) || delta > tolerance)
            throw new Error(`duration=${duration} decoded=${buffer.duration} delta=${delta}`);
          maxDelta = Math.max(maxDelta, delta);
          count++;
        })());
      } catch (error) {
        throw new Error(`${id}: ${String(error.message).slice(0, 160)}`);
      } finally {
        controller.abort();
        if (reader) await bounded(reader.cancel()).catch(() => {});
      }
    }
    return { count, maxDelta };
  } finally { await bounded(context.close()); }
}
