import { describe, it, expect } from 'vitest';
import { buildTimeline, mergePace } from '../src/explorer/timeline.js';
import { castAt, eyesAt, mouthShape } from '../src/explorer/cast.js';

const figure = { width: 240, height: 300, base: 'base.svg', eyes: { open: 'open.svg', closed: 'closed.svg' }, mouth: { x: 'x.svg', a: 'a.svg', e: 'e.svg', o: 'o.svg' } };
const voice = { cast: {
  metan: { name: 'Metan', side: 'left', figure, speaker: 'Metan', style: 'normal' },
  zunda: { name: 'Zunda', side: 'right', figure },
  off: { name: 'Offscreen' },
} };
const script = [{ id: 'a', text: 'abc' }, { id: 'b', text: 'def', by: 'zunda' }, { id: 'c', by: 'off', lead: 1 }];
const clip = { id: 'duet', script };
const timeline = (c = clip, v = voice) => buildTimeline(c, mergePace(), v);

describe('cast and narration identities', () => {
  it('defaults to the first narrator, selects explicit by and ignores silent lines for figures', () => {
    const t = timeline();
    expect(t.lines.map(l => l.by)).toEqual(['metan', 'zunda', 'off']);
    expect(t.cues.map(c => c.by)).toEqual(['metan', 'zunda']);
    expect(t.cast.map(a => a.id)).toEqual(['metan', 'zunda']);
  });
  it('uses explicit clip.cast, including listeners, empty casts and unscripted clips', () => {
    expect(timeline({ ...clip, script: [script[0]], cast: ['zunda'] }).cast.map(a => a.id)).toEqual(['zunda']);
    expect(timeline({ ...clip, cast: [] }).cast).toEqual([]);
    expect(timeline({ duration: 2 }).cast).toEqual([]);
    expect(timeline({ duration: 2, cast: ['metan', 'off'] }).cast.map(a => a.id)).toEqual(['metan']);
  });
  it.each(['absent', 'constructor', '', null, 1])('rejects explicit invalid by on spoken and silent lines: %s', by => {
    for (const text of ['hello', undefined]) expect(() => timeline({ script: [{ id: 'a', by, text }] })).toThrow('by');
  });
  it.each([['absent'], ['metan', 'metan'], null, 'metan'].map(cast => [cast]))('rejects invalid clip.cast: %j', cast => {
    expect(() => timeline({ ...clip, cast })).toThrow('cast');
  });
  it('rejects side collisions only when both figures appear in the clip', () => {
    const v = structuredClone(voice); v.cast.zunda.side = 'left';
    expect(() => timeline(clip, v)).toThrow('same side');
    expect(timeline({ ...clip, cast: ['metan'] }, v).cast).toHaveLength(1);
  });
  it.each([
    v => { v.speaker = 'old'; }, v => { v.style = 'old'; },
    v => { delete v.cast; }, v => { v.cast = {}; },
    v => { v.cast['Bad-ID'] = v.cast.off; }, v => { delete v.cast.metan.name; },
    v => { delete v.cast.metan.side; }, v => { v.cast.metan.side = 'top'; },
    v => { delete v.cast.metan.figure.mouth.x; }, v => { delete v.cast.metan.figure.mouth.a; },
    v => { v.cast.metan.figure.width = 0; }, v => { delete v.cast.metan.figure.base; },
    v => { delete v.cast.metan.figure.eyes.closed; },
  ])('rejects malformed voice/figures', change => {
    const v = structuredClone(voice); change(v);
    expect(() => timeline(clip, v)).toThrow();
  });
  it('keeps voice-less scripts usable, but rejects an explicit by without a cast', () => {
    expect(buildTimeline({ script: [{ id: 'a', text: 'abc' }] }).lines[0].by).toBeUndefined();
    expect(() => buildTimeline({ script: [{ id: 'a', text: 'abc', by: 'metan' }] })).toThrow();
  });
  it('reads v1 as the first narrator and rejects mismatching v2 identities', () => {
    const v = structuredClone(voice);
    const record = { source: 'abc', takes: { '1.3': { duration: 4, anchors: {} } } };
    v.manifest = { version: 1, clips: { duet: { a: record } } };
    expect(timeline(clip, v).lines[0].take).toBe(record.takes['1.3']);
    expect(timeline({ ...clip, script: [{ ...script[0], by: 'zunda' }] }, v).lines[0].take).toBeUndefined();
    Object.assign(record, { by: 'metan', speaker: 'Metan', style: 'normal' });
    expect(timeline(clip, v).lines[0].take).toBe(record.takes['1.3']);
    for (const patch of [{ by: 'zunda' }, { speaker: 'changed' }, { style: 'changed' }]) {
      const bad = structuredClone(v); Object.assign(bad.manifest.clips.duet.a, patch);
      expect(timeline(clip, bad).lines[0].take).toBeUndefined();
    }
  });
});

describe('figures are functions of clip time', () => {
  it.each([['i', 'e'], ['u', 'o'], ['n', 'x'], ['e', 'e'], ['a', 'a'], ['x', 'x']])('substitutes %s with %s', (shape, expected) => {
    expect(mouthShape(shape, figure.mouth)).toBe(expected);
  });
  it.each(['i', 'e', 'u', 'o'])('falls back to a for %s with the minimum images', shape => {
    expect(mouthShape(shape, { x: 'x', a: 'a' })).toBe('a');
  });
  it('uses recorded mouth intervals and exclusive voice end, including silent audio files', () => {
    const v = structuredClone(voice);
    v.manifest = { clips: { duet: { a: { source: 'abc', takes: { '1.3': {
      duration: 1, mouth: [[0, 'x'], [0.1, 'i'], [0.2, 'u'], [0.3, 'n']],
    } } } } } };
    const t = timeline(clip, v), at = t.at('a.voice');
    for (const [offset, shape] of [[0, 'x'], [0.1, 'e'], [0.2, 'o'], [0.3, 'x']]) {
      const [left, right] = castAt(clip.id, t, at + offset);
      expect(left).toMatchObject({ speaking: true, mouth: shape });
      expect(right).toMatchObject({ speaking: false, mouth: 'x' });
    }
    expect(castAt(clip.id, t, t.at('a.end'))[0]).toMatchObject({ speaking: false, mouth: 'x' });
  });
  it('alternates every 0.14 seconds for estimates and old recordings', () => {
    for (const recorded of [false, true]) {
      const v = structuredClone(voice);
      if (recorded) v.manifest = { clips: { duet: { a: { source: 'abc', takes: { '1.3': { duration: 2 } } } } } };
      const t = timeline(clip, v), at = t.at('a.voice');
      expect([0, 0.139, 0.14, 0.28].map(offset => castAt(clip.id, t, at + offset)[0].mouth)).toEqual(['a', 'a', 'x', 'a']);
    }
  });
  it('has reproducible independent 2–6 second blinks, lasting 0.12 seconds', () => {
    const closed = [], other = [];
    for (let tick = 0; tick <= 9000; tick++) {
      const t = tick / 100;
      if (eyesAt('duet', 'metan', t) === 'closed') closed.push(tick);
      if (eyesAt('duet', 'zunda', t) === 'closed') other.push(tick);
    }
    expect(closed.length).toBeGreaterThan(100);
    expect(closed).not.toEqual(other);
    const heads = closed.filter((tick, i) => i === 0 || tick !== closed[i - 1] + 1);
    expect(heads[0]).toBeGreaterThanOrEqual(200);
    for (let i = 1; i < heads.length; i++) expect(heads[i] - heads[i - 1]).toBeGreaterThanOrEqual(200);
    for (let i = 1; i < heads.length; i++) expect(heads[i] - heads[i - 1]).toBeLessThanOrEqual(600);
    for (const tick of heads.slice(0, -1)) expect(closed.filter(n => n >= tick && n < tick + 20)).toHaveLength(12);
    for (const tick of closed.reverse()) expect(eyesAt('duet', 'metan', tick / 100)).toBe('closed');
  });
});
