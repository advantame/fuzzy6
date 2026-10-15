import { describe, expect, test } from 'vitest';
import { texLayout, texBox, CJK } from '../src/kit/tex.js';

describe('texLayout', () => {
  test('a named piece on the baseline reports its box, its origin and baseline 0', () => {
    const L = texLayout(String.raw`a = \el{r}{0.78}`);
    const r = L.groups.r;
    expect(r.base).toBeCloseTo(0);
    expect(r.scale).toBe(1);
    expect(r.box.x0).toBeGreaterThanOrEqual(r.x);
    // the digits stand on the baseline: their box ends at it, give or take the dot
    expect(r.box.y1).toBeLessThan(50);
    expect(r.box.y0).toBeLessThan(-600);
  });
  test('a numerator sits above the baseline and a denominator below, a superscript smaller', () => {
    const L = texLayout(String.raw`\frac{\el{n}{EF}}{\el{d}{DF}} + {2}^{\el{s}{2}}`);
    expect(L.groups.n.base).toBeLessThan(0);
    expect(L.groups.d.base).toBeGreaterThan(0);
    expect(L.groups.s.scale).toBeCloseTo(0.707, 3);
    expect(L.asc).toBeGreaterThan(1000);
    expect(L.desc).toBeGreaterThan(500);
  });
  test('Japanese in \\text is laid out full width at CJK em, one item per character', () => {
    const L = texLayout(String.raw`\el{j}{\text{高さ}}`);
    const chars = L.items.filter((it) => it.type === 'text');
    expect(chars.map((c) => c.s)).toEqual(['高', 'さ']);
    expect(L.groups.j.box.x1 - L.groups.j.box.x0).toBeCloseTo(2 * CJK * 1000, 0);
  });
  test('the same TeX gives the same layout, and a mistake in it is an error that names it', () => {
    expect(texLayout('x^2')).toBe(texLayout('x^2'));
    expect(() => texLayout(String.raw`\frac{a`)).toThrow(/Missing close brace.*\\frac\{a/);
  });
  test('texBox scales the layout to px', () => {
    const L = texLayout('x');
    expect(texBox('x', 50)).toEqual({ w: (L.w * 50) / 1000, asc: (L.asc * 50) / 1000, desc: (L.desc * 50) / 1000 });
  });
});
