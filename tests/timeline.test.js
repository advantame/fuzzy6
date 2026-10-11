import { describe, it, expect } from 'vitest';
import { PACE } from '../src/explorer/pace.js';
import { parseLine } from '../src/explorer/script.js';
import { buildTimeline, mergePace, nextTarget, previousTarget, preservePosition, positionAt, posterTime, takeSpeeds } from '../src/explorer/timeline.js';
import { normalizeDeck } from '../src/explorer/model.js';

const clip = { id: 'test', script: [
  { id: 'a', text: 'a{mark}bcd', lead: 0.5, tail: 0.4, still: true },
  { id: 'silent', lead: 1, tail: 0.2, rest: 0.25 },
  { id: 'b', text: '**end**', rest: 99 },
] };
const voice = { cast: { metan: { name: 'Metan' } }, manifest: { clips: { test: {
  a: { source: 'abcd', takes: {
    '1.3': { duration: 2, anchors: { mark: 0.6 }, file: 'a.wav' },
    '1.5': { duration: 1.5, anchors: { mark: 0.4 }, file: 'fast.wav' },
  } },
  b: { source: 'end', takes: { '1.3': { duration: 1, anchors: {}, file: 'b.wav' } } },
} } } };
const pace = mergePace();
const timeline = () => buildTimeline(clip, pace, voice);

describe('timeline', () => {
  it('uses each line speed for its take and keeps line.speed as the recorded speed', () => {
    const script = [undefined, 'normal', 'slow', 'fast'].map((speed, i) => ({ id: `l${i}`, text: 'abc', speed }));
    const takes = Object.fromEntries([1, 1.2, 1.4, 1.6].map(speed => [speed, { duration: 3 / speed, anchors: {}, file: `${speed}.opus` }]));
    const recordings = { cast: { metan: { name: 'Metan' } }, manifest: { clips: { sample: Object.fromEntries(script.map(l => [l.id, { source: 'abc', takes }])) } } };
    const t = buildTimeline({ id: 'sample', script }, pace, recordings);
    expect(t.lines.map(l => l.speed)).toEqual([1.2, 1.2, 1, 1.4]); // all ties choose slower
    expect(t.lines.map(l => l.take.file)).toEqual(['1.2.opus', '1.2.opus', '1.opus', '1.4.opus']);
  });
  it.each(['slow', 'normal', 'fast'])('estimates %s speech and anchors using its own pace', speed => {
    const t = buildTimeline({ script: [{ id: 'a', speed, text: 'abc{half}def' }] }, pace);
    const round = n => Math.round(n * 1000) / 1000;
    expect(t.at('a.end')).toBe(round(pace.pre + 6 / pace.voice.cps / pace.voice.speed[speed]));
    expect(t.at('half')).toBe(round(pace.pre + 3 / pace.voice.cps / pace.voice.speed[speed]));
    expect(t.lines[0].take).toBeUndefined();
    const silent = buildTimeline({ script: [{ id: 'a', speed, lead: 1, tail: 0.2 }] });
    expect(silent.duration).toBe(1.2);
  });
  it.each([1.3, 'quick', '', null, false, {}])('rejects invalid spoken and silent line speed %j', speed => {
    for (const text of ['abc', undefined])
      expect(() => buildTimeline({ script: [{ id: 'a', text, speed }] })).toThrow('Invalid line speed');
  });
  it('builds every boundary, named anchor, caption and stop from the recording', () => {
    const t = timeline();
    expect(t.lines.map(({ start, voice, end, done, next }) => [start, voice, end, done, next]))
      .toEqual([[0, 0.8, 2.8, 3.2, 4.2], [4.2, 5.2, 5.2, 5.4, 5.65], [5.65, 5.95, 6.95, 6.95, 6.95]]);
    expect(t.duration).toBe(6.95);
    expect(['a', 'a.start', 'a.voice', 'a.end', 'a.done', 'a.next', 'mark', 'b.next'].map(t.at))
      .toEqual([0, 0, 0.8, 2.8, 3.2, 4.2, 1.4, 6.95]);
    expect(t.cues).toEqual([{ by: 'metan', at: 0.8, to: 5.95, text: 'abcd' }, { by: 'metan', at: 5.95, to: Infinity, text: '**end**' }]);
    expect(t.stops.map(s => [s.at, s.kind, s.line])).toEqual([[0, 'line', 'a'], [3.2, 'still', 'a'], [4.2, 'line', 'silent'], [5.65, 'line', 'b'], [6.95, 'still', 'b']]);
    expect(() => t.at('absent')).toThrow(/Unknown/);
    expect(posterTime({ poster: 'a.done' }, t)).toBe(3.2);
    expect(posterTime({}, t)).toBe(t.duration);
  });
  it('selects nearest speed, with slower take winning a tie, without changing pitch or timing scale', () => {
    const t = buildTimeline(clip, mergePace({ voice: { speed: { normal: 1.45 } } }), voice);
    expect(t.lines[0].take.file).toBe('fast.wav');
    expect(t.at('a.end') - t.at('a.voice')).toBeCloseTo(1.5);
    expect(t.at('mark')).toBe(1.2);
    expect(takeSpeeds(clip, voice)).toEqual([1.3, 1.5]);
    const tie = structuredClone(voice);
    tie.manifest.clips.test.a.takes['2'] = tie.manifest.clips.test.a.takes['1.5'];
    delete tie.manifest.clips.test.a.takes['1.5'];
    expect(buildTimeline(clip, mergePace({ voice: { speed: { normal: 1.65 } } }), tie).lines[0].speed).toBe(1.3);
  });
  it('estimates missing/stale records using parsed speech code points and rounds milliseconds', () => {
    const text = '😀 {hit}[表記|abc]**日本**\n語';
    const c = { id: 'test', script: [{ id: 'a', text }] };
    const parsed = parseLine(text);
    const p = mergePace({ voice: { cps: 4, speed: { normal: 1.2 } } });
    const t = buildTimeline(c, p, voice);
    expect(t.lines[0].take).toBeUndefined();
    expect(t.at('a.end')).toBe(1.758);
    expect(t.at('hit')).toBe(0.508);
    expect(t.cues[0].text).toBe(parsed.caption);
    expect(buildTimeline(c, p).duration).toBe(t.duration);
  });
  it('uses default rest based on explicit still, numeric rest, and ignores final rest', () => {
    const t = buildTimeline({ script: [{ id: 'a', lead: 1 }, { id: 'b', lead: 1, rest: 'short' }, { id: 'c', lead: 1, rest: 100 }] });
    expect(t.lines.map(l => l.start)).toEqual([0, 1.8, 3.1]);
    expect(t.duration).toBe(4.1);
  });
  it('merges nearby stops at a strict 50ms boundary, preserving the still point', () => {
    const make = rest => buildTimeline({ script: [{ id: 'a', lead: 1, still: true, rest }, { id: 'b', lead: 1 }] });
    expect(make(0.049).stops.map(s => [s.at, s.kind])).toEqual([[0, 'line'], [1, 'still'], [2.049, 'still']]);
    expect(make(0.05).stops.map(s => s.at)).toEqual([0, 1, 1.05, 2.05]);
    expect(buildTimeline({ duration: 1, marks: [{ at: 0.03 }, { at: 0.06 }] }).stops.map(s => s.at)).toEqual([0, 1]);
    expect(buildTimeline({ script: [{ id: 'a' }] }).stops).toEqual([{ at: 0, kind: 'still', line: 'a', label: '' }]);
  });
  it('keeps legacy duration/cues and uses explicit marks instead of cue heads', () => {
    const cues = [{ at: 1, to: 9, text: 'one' }];
    expect(buildTimeline({ duration: 9, cues }).cues).toBe(cues);
    expect(buildTimeline({ duration: 9, cues }).stops.map(s => s.at)).toEqual([0, 1, 9]);
    const t = buildTimeline({ duration: 9, cues, marks: [{ at: 4, label: 'mark' }] });
    expect(t.stops).toEqual([{ at: 0, kind: 'line', line: null, label: '' }, { at: 4, kind: 'line', line: null, label: 'mark' }, { at: 9, kind: 'still', line: null, label: '' }]);
    expect(() => t.at('a')).toThrow();
  });
  it.each([
    { script: [] },
    { script: [{ id: 'A' }] },
    { script: [{ id: 'a', text: '{a}x' }] },
    { script: [{ id: 'a', text: '{b}x' }, { id: 'b' }] },
    { script: [{ id: 'a' }, { id: 'a' }] },
    { script: [{ id: 'a', text: '{b}x' }, { id: 'c', text: '{b}y' }] },
    { script: [{ id: 'a', lead: -1 }] },
    { script: [{ id: 'a', rest: 'absent' }] },
    { script: [{ id: 'a', lead: 91 }] },
    { script: [{ id: 'a' }], duration: 3 },
    { script: [{ id: 'a' }], cues: [] },
  ])('rejects invalid script %#', c => expect(() => buildTimeline(c)).toThrow());
  it('normalizes script-only clips without requiring a literal duration', () => {
    expect(normalizeDeck({ chapters: [{ id: 'one', clips: [{ ...clip, setup() {} }] }] }).clips).toHaveLength(1);
  });
});

describe('pace and position', () => {
  it.each([0, -1, Infinity, NaN, '1.3', null, {}, []])('rejects invalid speed values %j in every tier', value => {
    for (const tier of ['slow', 'normal', 'fast'])
      expect(() => mergePace({ voice: { speed: { [tier]: value } } })).toThrow(`voice.speed.${tier}`);
  });
  it('rejects the old scalar shape even when followed by a valid patch', () => {
    expect(() => mergePace({ voice: { speed: 1.3 } }, { voice: { speed: { normal: 1.5 } } })).toThrow('voice.speed');
    expect(mergePace({ voice: { speed: { slow: 1.2 } } }).voice.speed).toEqual({ slow: 1.2, normal: 1.3, fast: 1.5 });
  });
  it('deeply merges defaults, deck and live values without mutation or unknown keys', () => {
    const deck = { rest: { long: 3 }, voice: { cps: 7 } };
    const p = mergePace(deck, { rest: { short: 0.4 }, cue: { stay: 'phrase' }, unknown: 1 });
    expect(p.rest).toEqual({ short: 0.4, normal: 0.8, long: 3 });
    expect(p.voice).toEqual({ speed: { slow: 1.1, normal: 1.3, fast: 1.5 }, cps: 7 });
    expect(p.cue.stay).toBe('phrase'); expect(p.unknown).toBeUndefined();
    p.rest.long = 9;
    expect(deck.rest.long).toBe(3); expect(PACE.rest.long).toBe(1);
    expect(() => mergePace({ voice: { speed: 0 } })).toThrow();
    expect(() => mergePace({ skip: Infinity })).toThrow();
  });
  it.each([
    [0.2, 'lead', 0.2, 0.2],
    [0.6, 'pre', 0.1, 0.6],
    [1.3, 'voice', 0.5, 1.8],
    [3, 'tail', 0.2, 3.5],
    [4, 'rest', 0.8, 4],
    [4.7, 'lead', 0.5, 4.5],
  ])('preserves section seconds at t=%s and clamps shortened sections', (t, section, offset, result) => {
    const before = timeline();
    const after = buildTimeline(clip, mergePace({ pre: 0.8, rest: { long: 0.3 } }), voice);
    expect(positionAt(before, t).section).toBe(section);
    expect(positionAt(before, t).offset).toBeCloseTo(offset);
    expect(preservePosition(before, after, t)).toBe(result);
  });
  it('preserves the final picture and clamps a shortened voice section', () => {
    const before = timeline();
    const after = buildTimeline(clip, mergePace({ voice: { speed: { normal: 1.5 } } }), voice);
    expect(preservePosition(before, after, before.duration)).toBe(after.duration);
    expect(preservePosition(before, after, 2.7)).toBe(after.at('a.end'));
  });
});

describe('stop targets', () => {
  const t = buildTimeline({ duration: 20, marks: [{ at: 2 }, { at: 12 }] });
  it.each([[0, 2, 'stop'], [1.95, 2, 'stop'], [1.951, 6.951, 'skip'], [2, 7, 'skip'], [8, 12, 'stop'], [19.97, 20, 'stop']])('next at %s', (time, at, kind) => expect(nextTarget(t, time, pace)).toEqual({ at, kind }));
  it('next from the end leaves the clip', () => expect(nextTarget(t, 20, pace)).toBeNull());
  it.each([[3.001, 2, 'stop'], [3, 0, 'stop'], [11.95, 6.95, 'skip'], [14, 12, 'stop'], [20, 15, 'skip']])('previous at %s', (time, at, kind) => expect(previousTarget(t, time, pace)).toEqual({ at, kind }));
  it('previous near the first stop leaves the clip; beyond again goes back to zero', () => {
    expect(previousTarget(t, 1, pace)).toBeNull();
    expect(previousTarget(t, 1.001, pace)).toEqual({ at: 0, kind: 'stop' });
  });
});
