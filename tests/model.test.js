import { describe, it, expect } from 'vitest';
import { normalizeDeck, cuesAt, cueMarkup, formatTime, clampTime, canvasScale, advanceTime, seekState } from '../src/explorer/model.js';
const clip = (id, extra = {}) => ({ id, duration: 10, setup() {}, ...extra });
const deck = chapters => ({ chapters });
describe('deck model', () => {
  it.each([undefined, {}, { gutter: undefined }, { gutter: 0 }, { gutter: 120 }, { gutter: 240 }])('normalizes frame %j', frame => {
    expect(normalizeDeck({ ...deck([{ id: 'a', clips: [clip('x')] }]), frame }).gutter).toBe(frame?.gutter ?? 0);
  });
  it.each([-1, 241, 1.5, NaN, Infinity, -Infinity, null, '120', false, {}, []])('rejects invalid gutter %j', gutter => {
    expect(() => normalizeDeck({ ...deck([{ id: 'a', clips: [clip('x')] }]), frame: { gutter } })).toThrow(/deck.frame.gutter/);
  });
  it('numbers chapters, numbered clips and all global positions', () => {
    const m = normalizeDeck(deck([{ id: 'a', clips: [clip('intro', { numbered: false }), clip('one'), clip('two')] }, { id: 'b', clips: [clip('three')] }]));
    expect(m.clips.map(c => [c.chapterNumber, c.number, c.global, c.index])).toEqual([[1, null, 1, 0], [1, 1, 2, 1], [1, 2, 3, 2], [2, 1, 4, 3]]);
    expect(m.ids.get('two').label).toBe('1-2'); expect(m.ids.get('absent')).toBeUndefined();
  });
  it.each([
    [[{ id: 'a', clips: [clip('x')] }, { id: 'a', clips: [] }], /Duplicate chapter/],
    [[{ id: 'a', clips: [clip('x'), clip('x')] }], /Duplicate clip/],
    [[{ id: 'a', clips: [clip('x', { setup: null })] }], /missing setup/],
    ...[0, -1, NaN, Infinity].map(duration => [[{ id: 'a', clips: [clip('x', { duration })] }], /duration must be positive/]),
    [[], /at least one/],
  ])('rejects invalid decks %#', (chapters, message) => expect(() => normalizeDeck(deck(chapters))).toThrow(message));
});
it('selects all overlapping cues in start order with exclusive ends', () => {
  const a = { at: 0, to: 2 }, b = { at: 1, to: 3 };
  expect(cuesAt([b, a], 0)).toEqual([a]); expect(cuesAt([b, a], 1)).toEqual([a, b]);
  expect(cuesAt([a, b], 2)).toEqual([b]); expect(cuesAt([a, b], 3)).toEqual([]);
});
it('escapes HTML before adding only strong and line breaks', () => {
  expect(cueMarkup('**<img> & "x"**\n\'ok\'')).toBe('<strong>&lt;img&gt; &amp; &quot;x&quot;</strong><br>&#39;ok&#39;');
});
it.each([[0, '0:00'], [9.9, '0:09'], [61, '1:01'], [600, '10:00']])('formats %s', (t, out) => expect(formatTime(t)).toBe(out));
it.each([[-1, 0], [5, 5], [20, 10], [NaN, 0], [Infinity, 10]])('clamps %s', (t, out) => expect(clampTime(t, 10)).toBe(out));
it('caps canvas scale by DPR, scale, and pixel budget', () => {
  expect(canvasScale(0.5, 2)).toBe(1);
  expect(canvasScale(1, 1)).toBe(1);
  expect(canvasScale(10, 10)).toBeLessThanOrEqual(2);
  expect(1600 * 900 * canvasScale(10, 10) ** 2).toBeCloseTo(4.2e6);
});
it('clamps clock gaps and defines seek states', () => {
  expect(advanceTime(1, 60, 10)).toBe(1.1); expect(advanceTime(9.99, 0.1, 10)).toBe(10);
  expect(seekState('ended', 3, 10)).toBe('paused'); expect(seekState('playing', 3, 10)).toBe('playing'); expect(seekState('paused', 10, 10)).toBe('ended');
});
