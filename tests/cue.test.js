import { describe, expect, test } from 'vitest';
import { focus, dimmed, lifted, enter } from '../src/kit/cue.js';

const cue = { lead: 0.15, rise: 0.25, fall: 0.4, scale: 1.06, dim: 0.4, stay: 'next', span: 1.2 };

describe('focus', () => {
  test('nothing is lit before the first target and after the last lets go', () => {
    const before = focus(0.5, [1, 3], 5, cue);
    expect(before.level).toEqual([0, 0]);
    expect(before.any).toBe(0);
    const after = focus(5.5, [1, 3], 5, cue);
    expect(after.level).toEqual([0, 0]);
  });
  test('a target lights up cue.lead early and hands over to the next', () => {
    expect(focus(1 - 0.15 + 0.25, [1, 3], 5, cue).level).toEqual([1, 0]);
    const handover = focus(3 - 0.15 + 0.1, [1, 3], 5, cue);
    expect(handover.level[0]).toBeGreaterThan(0);
    expect(handover.level[0]).toBeLessThan(1);
    expect(handover.level[1]).toBeGreaterThan(0);
    expect(handover.any).toBeGreaterThan(Math.max(...handover.level) - 1e-9);
    expect(focus(4, [1, 3], 5, cue).level).toEqual([0, 1]);
  });
  test("'phrase' lets go after cue.span, but never later than the next target", () => {
    const phrase = { ...cue, stay: 'phrase' };
    expect(focus(1 - 0.15 + 1.2 + 0.4, [1, 6], 9, phrase).level[0]).toBe(0);
    expect(focus(2 - 0.15, [1, 1.5], 9, { ...phrase, span: 4 }).level[0]).toBe(0);
  });
  test('an until earlier than the target does not produce a negative span', () => {
    const { level, any } = focus(2, [1], 0, cue);
    expect(level[0]).toBe(0);
    expect(Number.isFinite(any)).toBe(true);
  });
});

describe('dimmed, lifted, enter', () => {
  test('the lit one stays, the others fade to cue.dim, nothing fades when nothing is lit', () => {
    expect(dimmed(1, 1, cue)).toBe(1);
    expect(dimmed(0, 1, cue)).toBeCloseTo(0.4);
    expect(dimmed(0, 0, cue)).toBe(1);
  });
  test('lift follows the level', () => {
    expect(lifted(0, cue)).toBe(1);
    expect(lifted(1, cue)).toBeCloseTo(1.06);
  });
  test('entrances are staggered by the pace', () => {
    const pace = { enter: 0.5, stagger: 0.1 };
    expect(enter(0.99, 1, pace)).toBe(0);
    expect(enter(1.5, 1, pace)).toBe(1);
    expect(enter(1.2, 1, pace, 2)).toBe(0);
    expect(enter(1.7, 1, pace, 2)).toBe(1);
  });
});
