// A model's parameters, drawn as a grid of numbers: the darker a cell, the larger its value.
// 3-6 builds the grid up and trains it; 4-1 opens on the same grid to look back at
// pre-training. The values are an example. Every function draws one frame and keeps no state.

import { clamp } from '../../../src/kit/ease.js';
import { hash2 } from '../../../src/kit/random.js';
import { C } from './theme.js';

export const PARAMS = { cols: 20, rows: 8, cell: 21, gap: 4 };
export const PARAMS_W = PARAMS.cols * (PARAMS.cell + PARAMS.gap) - PARAMS.gap;
export const PARAMS_H = PARAMS.rows * (PARAMS.cell + PARAMS.gap) - PARAMS.gap;

// The value of parameter id: random to begin with. One nudge (k1, 0..1) moves it a little,
// many nudges (k2, 0..1) move it more.
export function paramValue(id, k1 = 0, k2 = 0) {
  let v = 0.2 + 0.7 * hash2(id, 1);
  v += (hash2(id, 2) - 0.5) * 0.18 * k1 + (hash2(id, 3) - 0.5) * 0.5 * k2;
  return clamp(v, 0.06, 0.95);
}

// While many nudges run, a few cells light up at a time: s is the seconds since they began.
export function flicker(id, s) {
  return 0.5 * (hash2(id, Math.floor(s * 6)) > 0.8 ? 1 : 0);
}

// cell(r, c, id) returns null to skip the cell, or { a, v, dim, flash }: its alpha, its value,
// how far it is dimmed (1 = not), and how strongly it lights up in vermilion. Alphas multiply
// the canvas's current globalAlpha.
export function paramGrid(ctx, x0, y0, cell) {
  const { cols, rows, cell: s, gap } = PARAMS;
  const base = ctx.globalAlpha;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = r * cols + c;
      const o = cell(r, c, id);
      if (!o || o.a <= 0) continue;
      const x = x0 + c * (s + gap);
      const y = y0 + r * (s + gap);
      ctx.globalAlpha = base * (o.a * o.v * (o.dim ?? 1));
      ctx.fillStyle = C.ink;
      ctx.fillRect(x, y, s, s);
      if (o.flash > 0) {
        ctx.globalAlpha = base * (o.a * o.flash);
        ctx.fillStyle = C.accent;
        ctx.fillRect(x, y, s, s);
      }
      ctx.globalAlpha = base;
    }
  }
}
