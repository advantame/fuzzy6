import { describe, it, expect } from 'vitest';
import { normalizeDeck, orderedClips } from '../src/explorer/model.js';
import { buildTimeline, mergePace, nextTarget, previousTarget, preservePosition, roundTime } from '../src/explorer/timeline.js';
import { collectLines, generationHash } from '../tools/narrate/core.mjs';

const clip = { id: 'sample', join: 'cut', bridge: 0.6, duration: 4, setup() {} };
const deck = c => ({ chapters: [{ id: 'one', clips: [c] }] });
const pace = mergePace();

describe('bridge validation shared by playback and tools', () => {
  it.each([0, -1, 3.001, NaN, Infinity, '1', null, false, {}])('rejects %j', bridge => {
    const c = { ...clip, bridge };
    for (const read of [normalizeDeck, orderedClips]) expect(() => read(deck(c))).toThrow('bridge');
    expect(() => buildTimeline(c)).toThrow('bridge');
  });
  it.each([undefined, 'fade'])('requires an explicit cut join (%s)', join => {
    expect(() => normalizeDeck(deck({ ...clip, join }))).toThrow('bridge');
  });
  it('rejects dives and a duration shorter than the bridge', () => {
    const d = { chapters: [{ id: 'one', clips: [{ ...clip, id: 'parent', doors: [{ to: clip.id, from: 1 }] }], dives: [clip] }] };
    for (const read of [normalizeDeck, orderedClips]) expect(() => read(d)).toThrow('bridge');
    expect(() => normalizeDeck(deck({ ...clip, duration: 0.5 }))).toThrow('duration');
  });
  it.each([0.001, 0.6, 3])('accepts %s and retains old clips without a bridge', bridge => {
    expect(normalizeDeck(deck({ ...clip, bridge })).clips).toHaveLength(1);
    expect(buildTimeline({ ...clip, bridge: undefined }).head).toBe(0);
    expect(buildTimeline({ ...clip, bridge: undefined }).stops.map(s => s.at)).toEqual([0, 4]);
  });
});

describe('bridge timeline', () => {
  const script = [{ id: 'a', text: 'a{hit}bc', lead: 0.4, tail: 0.2, still: true }, { id: 'b', lead: 1 }];
  const c = { id: 'sample', join: 'cut', script };
  const voice = { cast: { metan: { name: 'Metan', speaker: '四国めたん', style: 'ノーマル' } }, manifest: { clips: { sample: {
    a: { source: 'abc', takes: { '1.3': { duration: 1.25, anchors: { hit: 0.3 }, file: 'a.opus' } } },
  } } } };
  it.each([undefined, voice])('shifts speech, anchors, stops and duration, retaining recordings', recording => {
    const before = buildTimeline(c, pace, recording);
    const after = buildTimeline({ ...c, bridge: 0.6 }, pace, recording);
    expect(after.head).toBe(0.6);
    expect(after.duration).toBe(roundTime(before.duration + 0.6));
    for (const name of ['a', 'a.voice', 'a.end', 'a.done', 'a.next', 'hit', 'b', 'b.done'])
      expect(after.at(name), name).toBe(roundTime(before.at(name) + 0.6));
    expect(after.stops.map(s => s.at)).toEqual(before.stops.map(s => roundTime(s.at + 0.6)));
    expect(after.lines[0].take).toBe(before.lines[0].take);
    expect(after.cues[0].at).toBe(roundTime(before.cues[0].at + 0.6));
    const changed = buildTimeline({ ...c, bridge: 0.6 }, mergePace({ pre: 0.7, rest: { long: 2 } }), recording);
    expect(preservePosition(after, changed, 0.123456)).toBe(0.123456);
    expect(preservePosition(after, changed, after.at('a.voice') + 0.1)).toBe(roundTime(changed.at('a.voice') + 0.1));
  });
  it('keeps non-script cues absolute, filters marks before head and keeps head when merging', () => {
    const cues = [{ at: 0, to: 2, text: 'one' }, { at: 2, to: 4, text: 'two' }];
    const t = buildTimeline({ ...clip, cues });
    expect(t.cues).toBe(cues);
    expect(t.stops.map(s => s.at)).toEqual([0.6, 2, 4]);
    expect(buildTimeline({ ...clip, cues, marks: [{ at: 0.5999 }, { at: 3 }] }).stops.map(s => s.at)).toEqual([0.6, 3, 4]);
    expect(buildTimeline({ ...c, bridge: 0.6, script: [{ id: 'a', lead: 0.02 }] }).stops[0].at).toBe(0.6);
  });
  it('goes directly to the head or previous clip from anywhere inside the bridge', () => {
    const t = buildTimeline({ ...clip, bridge: 3 });
    const p = mergePace({ skip: 0.1 });
    for (const seconds of [0, 1, 2.99, 2.999999]) {
      expect(nextTarget(t, seconds, p)).toEqual({ at: 3, kind: 'stop' });
      expect(previousTarget(t, seconds, p)).toBeNull();
    }
    expect(previousTarget(t, 3, p)).toBeNull();
  });
  it('counts the bridge toward the 90-second limit', () => {
    expect(() => buildTimeline({ ...c, bridge: 1, script: [{ id: 'a', lead: 90 }] })).toThrow('90');
  });
  it('leaves narration inputs, hashes and manifest untouched', () => {
    const d = { ...deck(c), voice };
    const saved = JSON.stringify(voice.manifest);
    const before = collectLines(d);
    const after = collectLines({ ...deck({ ...c, bridge: 0.6 }), voice });
    expect(after).toEqual(before);
    expect(generationHash(after[0], voice, 1.3)).toBe(generationHash(before[0], voice, 1.3));
    expect(JSON.stringify(voice.manifest)).toBe(saved);
  });
});
