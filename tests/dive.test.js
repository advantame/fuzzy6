import { describe, it, expect } from 'vitest';
import { normalizeDeck } from '../src/explorer/model.js';
import { buildTimeline, mergePace } from '../src/explorer/timeline.js';
import { doorsAt, descentTarget, ascentTarget } from '../src/explorer/dive.js';
const clip = (id, doors = []) => ({ id, duration: 10, doors, setup() {} });
const door = (to, from = 0, extra = {}) => ({ to, from, label: to, ...extra });
const deck = (clips, dives) => ({ chapters: [{ id: 'a', clips, dives }] });

describe('dive model', () => {
  it('keeps main numbering, chooses the first referring parent, and orders nested dives', () => {
    const m = normalizeDeck(deck([clip('a', [door('d')]), clip('b', [door('d')])],
      [clip('e'), clip('d', [door('e')])]));
    expect(m.clips.map(e => [e.clip.id, e.index, e.number])).toEqual([['a', 0, 1], ['b', 1, 2]]);
    expect(m.all.map(e => e.clip.id)).toEqual(['a', 'd', 'e', 'b']);
    expect(m.ids.get('d').parent.clip.id).toBe('a');
    expect(m.ids.get('e').parent.clip.id).toBe('d');
    expect(m.dives.map(e => [e.index, e.number, e.global])).toEqual([[0, null, null], [0, null, null]]);
    expect(m.all.map(e => e.indexRow)).toEqual([0, 1, 2, 3]);
  });
  it('places cross-chapter references next to their parent', () => {
    const m = normalizeDeck({ chapters: [
      { id: 'a', clips: [clip('a', [door('d')])] },
      { id: 'b', clips: [clip('b')], dives: [clip('d')] },
    ] });
    expect(m.all.map(e => [e.clip.id, e.indexChapter.id])).toEqual([['a', 'a'], ['d', 'a'], ['b', 'b']]);
  });
  it.each([
    [deck([clip('a')], [clip('a')]), /Duplicate clip/],
    [deck([clip('a', [door('missing')])], []), /not a dive/],
    [deck([clip('a', [door('a')])], []), /not a dive/],
    [deck([clip('a')], [clip('d')]), /Unreferenced/],
    [deck([clip('a')], [clip('d', [door('e')]), clip('e', [door('d')])]), /parent cycle/],
  ])('rejects invalid graph %#', (data, error) => expect(() => normalizeDeck(data)).toThrow(error));
  it('allows self/repeated descent when the canonical parent reaches the main line', () => {
    const m = normalizeDeck(deck([clip('a', [door('d')])], [clip('d', [door('d')])]));
    expect(m.ids.get('d').parent.clip.id).toBe('a');
  });
});

describe('door times and destinations', () => {
  it('uses inclusive from, exclusive until, stable time order and latest-open Enter target', () => {
    const timeline = buildTimeline(clip('a', [door('late', 4), door('early', 2, { until: 5 }), door('default', undefined)]));
    expect(doorsAt(timeline.doors, 1).map(d => d.to)).toEqual(['default']);
    expect(doorsAt(timeline.doors, 2).map(d => d.to)).toEqual(['default', 'early']);
    expect(doorsAt(timeline.doors, 5).map(d => d.to)).toEqual(['default', 'late']);
    expect(doorsAt(timeline.doors, 10).map(d => d.to)).toEqual(['default', 'late']);
    expect(descentTarget(timeline.doors, 4).to).toBe('late');
    expect(descentTarget(timeline.doors, 4, 'early').to).toBe('early');
    expect(descentTarget(timeline.doors, 5, 'early')).toBeUndefined();
  });
  it('resolves line, anchor and suffix names again when pace changes', () => {
    const c = { script: [{ id: 'a', text: 'one {ask}two', tail: 1 }], doors: [door('d', 'ask', { until: 'a.done' })] };
    const before = buildTimeline(c), after = buildTimeline(c, mergePace({ pre: 1 }));
    expect(before.doors[0].from).toBe(before.at('ask'));
    expect(before.doors[0].until).toBe(before.duration);
    expect(after.doors[0].from).toBeGreaterThan(before.doors[0].from);
    expect(doorsAt(before.doors, before.duration)).toEqual([]);
  });
  it.each([
    [door('d', 'missing')], [door('d', 0, { until: 'missing' })],
    [door('d', 3, { until: 2 })], [door('d', NaN)], [door('d', -1)],
    Array.from({ length: 4 }, () => door('d')),
  ])('rejects clip-local door errors %#', (...doors) => {
    expect(() => buildTimeline(clip('a', doors))).toThrow();
  });
  it('returns saved time, otherwise the canonical parent door time, without changing the stack', () => {
    const m = normalizeDeck(deck([clip('a', [door('d', 3)])], [clip('d')]));
    const entry = m.ids.get('d'), stack = [{ id: 'a', t: 10 }];
    expect(ascentTarget(entry, stack, buildTimeline)).toEqual({ id: 'a', t: 10 });
    expect(stack).toHaveLength(1);
    expect(ascentTarget(entry, [], buildTimeline)).toEqual({ id: 'a', t: 3 });
    expect(ascentTarget(m.clips[0], stack, buildTimeline)).toBeNull();
  });
});
