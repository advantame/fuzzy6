import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { createSound } from '../src/explorer/sound.js';

const reported = [
  ['opening/d', 15.217000000000001, 18.076000000000001],
  ['core/d', 16.890999999999998, 22.907000000000000],
  ['langmodel/b', 5.7839999999999998, 9.6349999999999998],
  ['langmodel/i', 50.409999999999997, 54.954000000000001],
  ['whyai/p2', 18.027999999999999, 20.172000000000001],
  ['whyai/z2', 20.771999999999998, 21.774999999999998],
  ['whyai/p3', 26.398000000000000, 29.992999999999999],
  ['whyai/z3', 30.593000000000000, 31.468000000000000],
  ['whyai/s2', 55.719999999999999, 59.475000000000001],
  ['whyai/s3', 60.774999999999999, 64.498000000000005],
].map(([id, voice, end]) => ({ id, voice, end, duration: end - voice }));

const manifest = JSON.parse(readFileSync(new URL('../decks/llm/voice/manifest.json', import.meta.url), 'utf8'));
// Synthetic sequential timings exercise every take, including alternative speeds,
// without importing the deck's drawing code, fonts, or Vite virtual modules.
const recordings = Object.entries(manifest.clips).flatMap(([clip, lines]) => {
  let cursor = 0;
  return Object.entries(lines).flatMap(([id, record]) => {
    const voice = cursor + 0.3;
    const takes = Object.entries(record.takes ?? {}).map(([speed, take]) => ({
      id: `${clip}/${id}@${speed}`, voice,
      end: Math.round((voice + take.duration) * 1000) / 1000,
      duration: take.duration,
    }));
    cursor = Math.max(cursor, ...takes.map(t => t.end)) + 0.8;
    return takes;
  });
});
const offsets = [
  ['equal', 0], ['short', -1 / 3000], ['long', 1 / 3000],
];

// No actual audio allocation or unbounded mock call histories. The fixture keeps
// at most four source records even if a regression starts a source every frame.
function fixture(record, delta = 0) {
  const starts = [];
  let sourceCount = 0, warnings = 0;
  const context = {
    state: 'running', currentTime: 10, destination: {},
    decodeAudioData: async () => ({ duration: record.duration + delta, sampleRate: 48000 }),
    createBufferSource() {
      sourceCount++;
      return {
        connect() {}, disconnect() {}, stop() {},
        start(when, offset, duration) { if (starts.length < 4) starts.push({ when, offset, duration }); },
      };
    },
    createGain: () => ({ connect() {}, disconnect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {} } }),
  };
  const line = { id: 'voice', voice: record.voice, end: record.end, speed: 1, spoken: true,
    take: { file: 'fixture.opus', duration: record.duration } };
  const timeline = { duration: record.end + 0.2, lines: [line] };
  const sound = createSound({ url: file => file }, {
    context, fetch: async () => new Response(new Uint8Array([0])), warn: () => warnings++,
  });
  return { sound, context, timeline, starts, counts: () => ({ sources: sourceCount, warnings }) };
}

function runFrames(f, start, dt = 1 / 60) {
  let t = start;
  // Finite even if time stalls or goes backwards. Diagnostics contain numbers only.
  const limit = Math.min(6000, Math.ceil((f.timeline.duration - start) / dt) + 30);
  for (let frame = 0; frame < limit && t < f.timeline.duration; frame++) {
    f.context.currentTime += dt;
    const next = f.sound.clock('clip', f.timeline, t, dt);
    if (!(next > t && next <= f.timeline.duration)) return { reached: false, t, next, frame, ...f.counts() };
    t = next;
  }
  return { reached: t === f.timeline.duration, ...f.counts() };
}

for (const [label, cases] of [['reported endpoints', reported], ['all manifest takes', recordings]]) {
  describe(label, () => {
    for (const [length, delta] of offsets) {
      it.each(cases)(`$id: ${length} buffer reaches duration with strictly increasing frames`, async record => {
        const f = fixture(record, delta);
        try {
          await f.sound.waitFirst('clip', f.timeline);
          expect(runFrames(f, record.voice - 1 / 120)).toEqual({ reached: true, sources: 1, warnings: 0 });
        } finally { f.sound.destroy(); }
      });
    }
  });
}

it('has real recordings to cover', () => expect(recordings.length).toBeGreaterThan(0));

describe('clock boundaries, seek, resume and delayed audio', () => {
  it.each(offsets)('keeps seek and resume offsets with a %s buffer, including replay after completion', async (_, delta) => {
    const record = reported[0];
    const f = fixture(record, delta);
    try {
      await f.sound.waitFirst('clip', f.timeline);
      const seek = record.voice + 0.7;
      expect(f.sound.clock('clip', f.timeline, seek, 0)).toBe(seek);
      expect(f.starts[0].offset).toBeCloseTo(0.7, 12);
      f.context.currentTime += 0.25;
      const paused = f.sound.clock('clip', f.timeline, seek, 0.1);
      f.sound.stop();
      f.context.currentTime += 5;
      expect(f.sound.clock('clip', f.timeline, paused, 0)).toBe(paused);
      expect(f.starts[1].offset).toBeCloseTo(paused - record.voice, 12);
      expect(runFrames(f, paused)).toEqual({ reached: true, sources: 2, warnings: 0 });
      // Completion must not latch the line off: an explicit backward seek replays it.
      f.sound.stop();
      f.sound.clock('clip', f.timeline, seek, 0);
      expect(f.starts[2].offset).toBeCloseTo(0.7, 12);
      expect(runFrames(f, seek)).toEqual({ reached: true, sources: 3, warnings: 0 });
    } finally { f.sound.destroy(); }
  });

  it('starts a late decoded buffer at the current voice offset', async () => {
    const record = reported[0];
    const f = fixture(record, -1 / 3000);
    let release;
    const decoded = f.context.decodeAudioData();
    const pending = new Promise(resolve => { release = resolve; });
    f.context.decodeAudioData = () => pending;
    try {
      const ready = f.sound.waitFirst('clip', f.timeline);
      let t = f.sound.clock('clip', f.timeline, record.voice + 0.5, 0.1);
      expect(f.counts().sources).toBe(0);
      release(await decoded);
      await ready;
      t = f.sound.clock('clip', f.timeline, t, 0.1);
      expect(f.starts[0].offset).toBeCloseTo(0.7, 12);
      expect(runFrames(f, t)).toEqual({ reached: true, sources: 1, warnings: 0 });
    } finally { f.sound.destroy(); }
  });

  it.each(reported)('$id: does not start sub-sample audio when seeking near the decoded end', async record => {
    const delta = -1 / 3000;
    const f = fixture(record, delta);
    try {
      await f.sound.waitFirst('clip', f.timeline);
      const seek = record.voice + record.duration + delta - 1 / 96000;
      expect(f.sound.clock('clip', f.timeline, seek, 0)).toBe(seek);
      expect(f.counts().sources).toBe(0);
      expect(runFrames(f, seek)).toEqual({ reached: true, sources: 0, warnings: 0 });
    } finally { f.sound.destroy(); }
  });

  it('preserves the recorded interval after a buffer ends 49ms early', async () => {
    const f = fixture({ voice: 1, end: 3, duration: 2 }, -0.049);
    try {
      await f.sound.waitFirst('clip', f.timeline);
      f.sound.clock('clip', f.timeline, 1, 0);
      expect(f.starts[0].duration).toBe(1.951);
      f.context.currentTime = 11.951;
      const t = f.sound.clock('clip', f.timeline, 1, 0.1);
      expect(t).toBeCloseTo(2.951, 12);
      expect(t).toBeLessThan(3);
      expect(runFrames(f, t)).toEqual({ reached: true, sources: 1, warnings: 0 });
      expect(f.timeline.lines[0].end).toBe(3);
    } finally { f.sound.destroy(); }
  });

  it.each(offsets)('ends a clip with no tail after a %s buffer', async (_, delta) => {
    const f = fixture(reported.at(-1), delta);
    f.timeline.duration = f.timeline.lines[0].end;
    try {
      await f.sound.waitFirst('clip', f.timeline);
      expect(runFrames(f, f.timeline.lines[0].voice - 1 / 120)).toEqual({ reached: true, sources: 1, warnings: 0 });
    } finally { f.sound.destroy(); }
  });

  it('progresses across quantized audio timestamps without accumulating frame-time drift', async () => {
    const f = fixture(reported[0]);
    try {
      await f.sound.waitFirst('clip', f.timeline);
      const voice = f.timeline.lines[0].voice;
      let t = f.sound.clock('clip', f.timeline, voice, 0);
      // AudioContext time need not change on every rAF. Its next update catches up.
      for (let frame = 0; frame < 8; frame++) {
        const next = f.sound.clock('clip', f.timeline, t, 0.001);
        expect(next).toBeGreaterThan(t);
        expect(next - voice).toBeLessThan(1e-12);
        t = next;
      }
      f.context.currentTime += 0.1;
      t = f.sound.clock('clip', f.timeline, t, 0.1);
      expect(t).toBeCloseTo(voice + 0.1, 12);
      expect(runFrames(f, t)).toEqual({ reached: true, sources: 1, warnings: 0 });
    } finally { f.sound.destroy(); }
  });
});
