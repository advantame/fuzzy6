import { describe, expect, test, vi } from 'vitest';

vi.mock('virtual:chars/decks/trig', () => ({ default: '' }));
const { toTeX, row, frac, jp, tag, shade, colored, sup, pt } = await import('../decks/trig/lib/math.js');
const { texLayout } = await import('../src/kit/tex.js');

describe('trig math nodes as TeX', () => {
  test('words are typed by their look', () => {
    expect(toTeX(row('sin θ =', frac('7.8', '10'), '≒', '38°', '18 m'))).toBe('\\sin \\theta = \\frac{7.8}{10} \\fallingdotseq 38^{\\circ} 18 \\,\\mathrm{m}');
    expect(toTeX(row('△ABC', '∽', '△DEF'))).toBe('\\triangle ABC \\backsim \\triangle DEF');
  });
  test('a fraction inside a fraction keeps its size', () => {
    expect(toTeX(frac(frac('a', 'b'), 'c'))).toBe('\\frac{\\dfrac{a}{b}}{c}');
  });
  test('ids never sit on one node twice: every named piece and every style survives MathJax', () => {
    const cases = [
      tag('yo', jp('余', '#f00', 700)),
      shade(0.5, tag('r', '0.78')),
      colored('#00f', tag('t', pt('E'))),
      tag('outer', tag('inner', 'x')),
      row(sup('sin', tag('two', '2')), 'θ'),
    ];
    for (const nd of cases) {
      const src = toTeX(nd);
      const ids = [...src.matchAll(/\\el\{([^}]+)\}/g)].map((m) => m[1]);
      expect(Object.keys(texLayout(src).groups).sort()).toEqual([...ids].sort());
    }
  });
});
