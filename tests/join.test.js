import { describe, it, expect } from 'vitest';
import { normalizeDeck, canCutJoin } from '../src/explorer/model.js';

const clip = (id, join) => ({ id, join, duration: 2, setup() {} });
const deck = join => ({ chapters: [
  { id: 'a', clips: [clip('a')] },
  { id: 'b', clips: [clip('b', join)] },
] });

describe('join contract', () => {
  it.each([undefined, 'fade', 'cut'])('accepts %s', join => {
    expect(normalizeDeck(deck(join)).clips).toHaveLength(2);
  });
  it.each(['', 'CUT', 'dissolve', null, false, 0, {}, []])('rejects invalid join %j', join => {
    expect(() => normalizeDeck(deck(join))).toThrow("Clip b: join must be 'fade' or 'cut'");
    const d = deck();
    d.chapters[0].clips[0].doors = [{ to: 'detail', from: 0, label: 'Detail' }];
    d.chapters[0].dives = [clip('detail', join)];
    expect(() => normalizeDeck(d)).toThrow("Clip detail: join must be 'fade' or 'cut'");
  });
  it('cuts only from the immediately preceding main-line end, including across chapters', () => {
    const [from, to] = normalizeDeck(deck('cut')).clips;
    expect(canCutJoin(from, to, 2, 2, 'next')).toBe(true);
    for (const dir of ['prev', 'jump']) expect(canCutJoin(from, to, 2, 2, dir)).toBe(false);
    for (const t of [0, 1, 1.999, 2.001]) expect(canCutJoin(from, to, t, 2, 'next')).toBe(false);
    expect(canCutJoin(null, to, 2, 2, 'next')).toBe(false);
    expect(canCutJoin(from, { ...to, index: 2 }, 2, 2, 'next')).toBe(false);
    expect(canCutJoin(to, from, 2, 2, 'next')).toBe(false);
    expect(canCutJoin({ ...from, dive: true }, to, 2, 2, 'next')).toBe(false);
    expect(canCutJoin(from, { ...to, dive: true }, 2, 2, 'next')).toBe(false);
    for (const join of [undefined, 'fade']) {
      const [a, b] = normalizeDeck(deck(join)).clips;
      expect(canCutJoin(a, b, 2, 2, 'next')).toBe(false);
    }
  });
});
