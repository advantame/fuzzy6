// The cursive s, c and t written over a right triangle in its usual pose (θ at the bottom
// left, the right angle at the bottom right) — the classroom way to remember which sides
// make sin, cos and tan. The side the pen passes first is the denominator, the side it
// passes second the numerator:
//   s — up the hypotenuse, then down the height:   sin θ = height / hypotenuse
//   c — down the hypotenuse, then along the base:   cos θ = base / hypotenuse
//   t — along the base, then up the height:          tan θ = height / base
// The pen's path is set in the triangle's own coordinates (u along the base from A to C,
// v up from the base as a fraction of the height), so it follows the triangle anywhere.

import { clamp, seg as span } from '../../../src/kit/ease.js';
import { path, circle } from '../../../src/kit/draw.js';
import { C as COL } from './theme.js';
import { label, sidePoint } from './tri.js';

const STROKES = {
  s: [[0.02, 0.0], [0.08, 0.05], [0.33, 0.26], [0.6, 0.52], [0.82, 0.76], [0.93, 0.93], [0.97, 0.86], [0.93, 0.62], [0.93, 0.34], [0.95, 0.12], [0.9, 0.02], [0.8, 0.05]],
  c: [[0.99, 0.82], [0.96, 0.93], [0.88, 0.86], [0.66, 0.6], [0.4, 0.35], [0.16, 0.11], [0.09, 0.04], [0.18, 0.025], [0.45, 0.03], [0.72, 0.035], [0.92, 0.06]],
  t: [[0.0, 0.06], [0.06, 0.03], [0.35, 0.03], [0.66, 0.03], [0.86, 0.04], [0.93, 0.12], [0.93, 0.38], [0.93, 0.66], [0.94, 0.96]],
};
// which sides the pen passes, in order
export const ORDER = { s: ['hyp', 'height'], c: ['hyp', 'base'], t: ['base', 'height'] };
export const LETTER_COLOR = { s: COL.sin, c: COL.cos, t: COL.tan };

const at = (T, u, v) => ({
  x: T.A.x + (T.C.x - T.A.x) * u + (T.B.x - T.C.x) * v,
  y: T.A.y + (T.C.y - T.A.y) * u + (T.B.y - T.C.y) * v,
});

// Catmull–Rom through the control points, sampled into a polyline.
function smooth(pts, n = 10) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0.x, p1.x, p2.x, p3.x), f(p0.y, p1.y, p2.y, p3.y)]);
    }
  }
  const last = pts[pts.length - 1];
  out.push([last.x, last.y]);
  return out;
}

// Write `letter` over triangle T up to fraction p. o: { color, lw, alpha, numbers (alpha of
// the 1 and 2 beside the sides), off }. The numbers appear as the pen reaches each side.
export function cursive(ctx, T, letter, p, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001 || p <= 0) return;
  const color = o.color ?? LETTER_COLOR[letter];
  const lw = o.lw ?? 8;
  const main = letter === 't' ? clamp(p / 0.85) : clamp(p);
  const pts = smooth(STROKES[letter].map(([u, v]) => at(T, u, v)));
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const tip = path(ctx, pts, main);
  if (letter === 't' && p > 0.85) {
    // the cross of the t, after the main stroke
    const q = clamp((p - 0.85) / 0.15);
    const l = at(T, 0.8, 0.74);
    const r = at(T, 1.06, 0.74);
    path(ctx, [[l.x, l.y], [l.x + (r.x - l.x) * q, l.y + (r.y - l.y) * q]], 1);
  }
  // the pen tip while writing
  if (tip && p < 1) {
    circle(ctx, tip.x, tip.y, lw * 0.9);
    ctx.fill();
  }
  ctx.restore();
  const nums = o.numbers ?? 1;
  if (nums > 0) {
    ORDER[letter].forEach((side, i) => {
      const show = clamp(span(main, i === 0 ? 0.2 : 0.62, i === 0 ? 0.3 : 0.72));
      if (show <= 0) return;
      const sp = sidePoint(T, side, o.off ?? 44, side === 'hyp' ? 0.42 : 0.5);
      badge(ctx, sp.x, sp.y, String(i + 1), color, show * nums * a);
    });
  }
}

// A small numbered disc: the order the pen passes the sides.
export function badge(ctx, x, y, s, color, a = 1, r = 19) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = color;
  circle(ctx, x, y, r);
  ctx.fill();
  label(ctx, s, x, y, { size: r * 1.3, color: COL.white });
  ctx.restore();
}
