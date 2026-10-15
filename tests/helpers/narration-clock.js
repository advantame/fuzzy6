import { createSound } from '../../src/explorer/sound.js';

export function requireRecordings(id, timeline) {
  for (const line of timeline.lines) {
    if (line.spoken && !line.take) throw new Error(`${id}/${line.id}: estimated narration (missing/stale take)`);
  }
}

// No PCM allocation or per-frame mock history. Each source retains only its line
// index; counters are bounded by the number of lines even when the clock breaks.
export async function checkClock(id, timeline, { delta = 0, wrapClock = clock => clock, recordingsRequired = true } = {}) {
  if (recordingsRequired) requireRecordings(id, timeline);
  const starts = new Uint32Array(timeline.lines.length);
  let warnings = 0;
  const context = {
    state: 'running', currentTime: 10, destination: {},
    async decodeAudioData(bytes) {
      const index = new Uint32Array(bytes)[0];
      return { index, duration: timeline.lines[index].take.duration + delta, sampleRate: 48000 };
    },
    createBufferSource() {
      return { connect() {}, disconnect() {}, stop() {},
        start() { starts[this.buffer.index]++; },
      };
    },
    createGain: () => ({ connect() {}, disconnect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {} } }),
  };
  // Use a distinct tiny payload per line, including takes sharing a file.
  const lines = timeline.lines.map((line, index) => ({ ...line,
    take: line.take && { ...line.take, file: String(index) },
  }));
  const simulated = { ...timeline, lines };
  const sound = createSound({ url: file => file }, {
    context, warn: () => warnings++,
    fetch: async index => new Response(new Uint32Array([Number(index)])),
  });
  try {
    sound.prepare([{ id, timeline: simulated }]);
    await Promise.all(lines.filter(l => l.take).map(line => sound.waitFirst(id, { lines: [line] })));
    const clock = wrapClock(sound.clock);
    const dt = 1 / 60;
    // Crossing each voice boundary can discard at most two frame fractions.
    // The finite frame budget also catches epsilon-only progress near an end.
    const limit = Math.ceil(timeline.duration / dt) + lines.length * 3 + 60;
    let t = 0; // Includes the bridge, whose end is timeline.head.
    for (let frame = 0; frame < limit && t < timeline.duration; frame++) {
      context.currentTime += dt;
      const next = clock(id, simulated, t, dt);
      if (!(next > t && next <= timeline.duration))
        throw new Error(`${id}: clock frame=${frame} t=${t} next=${next} duration=${timeline.duration}`);
      t = next;
    }
    if (t !== timeline.duration) throw new Error(`${id}: incomplete t=${t} duration=${timeline.duration} frames=${limit}`);
    for (const [index, line] of lines.entries()) {
      const expected = line.spoken && line.take ? 1 : 0;
      if (starts[index] !== expected) throw new Error(`${id}/${line.id}: starts=${starts[index]} expected=${expected}`);
    }
    if (warnings) throw new Error(`${id}: warnings=${warnings}`);
  } finally { sound.destroy(); }
}
