// The figure proof 2 is told on: the plane with A at the origin, B = (L, 0), C = (p, h); the
// unit circle; the line y = h through C; and, below, the graph of the speed h/(t² + h²). The
// graph's t axis has the plane's own scale and lies under the line: the point (t, h) of the line
// and the value of the speed at t are on one vertical. A stretch [a, b] of the line, the arc of
// the unit circle it is seen under, and the area under the graph over [a, b] are drawn in one
// colour — three pictures of the same number θ(a, b).
//
// q(t) = (t, h)/√(t² + h²) runs clockwise over the upper half circle as t increases: its angle
// is atan2(h, t), from π (t → −∞) down to 0 (t → ∞).

import { C } from './theme.js';
import { clamp } from '../../../src/kit/ease.js';
import { plane, toPx, v2, arrow, seg, dot, arc, label, grid, axes, unitCircle } from './geo.js';
import { tex } from './math.js';
import { TRI, L, P0, H0 } from './tri.js';

export { L, TRI };
export const H = H0;
export const P = P0;
export const PS = plane(800, 470, 180);
// the graph: baseline and vertical scale
export const G = { y0: 862, ky: 270 };
export const T_MIN = -4.4;
export const T_MAX = 4.4;

export const f = (t) => H / (t * t + H * H);
export const F = (t) => (t === Infinity ? Math.PI / 2 : t === -Infinity ? -Math.PI / 2 : Math.atan(t / H));
// θ(a, b) for a < b, either end possibly infinite
export const theta = (a, b) => F(b) - F(a);
export const q = (t) => (t === Infinity ? v2(1, 0) : t === -Infinity ? v2(-1, 0) : v2(t / Math.hypot(t, H), H / Math.hypot(t, H)));
export const qAngle = (t) => (t === Infinity ? 0 : t === -Infinity ? Math.PI : Math.atan2(H, t));

export const tx = (t, Pl = PS) => Pl.ox + t * Pl.k;
export const gy = (v) => G.y0 - v * G.ky;
const clampT = (t) => Math.max(T_MIN, Math.min(T_MAX, t));

// The plane: grid, axes and the unit circle. o: { alpha, grid }.
export function drawPlane(ctx, o = {}) {
  const a = o.alpha ?? 1;
  if (o.grid !== false) grid(ctx, PS, -4.3, 4.3, -0.9, 2.5, { alpha: a * 0.8, step: 0.5 });
  axes(ctx, PS, -4.3, 4.3, -1.15, 2.45, { alpha: a, names: false });
  return [unitCircle(ctx, PS, { color: C.ink, lw: 2.5, alpha: a * (o.circle ?? 1) })];
}

// The line y = h, end to end, with its t marks. o: { alpha, ticks }.
export function drawLine(ctx, o = {}) {
  const a = o.alpha ?? 1;
  const y = toPx(PS, v2(0, H)).y;
  seg(ctx, { x: 30, y }, { x: 1570, y }, { color: C.ink2, lw: 2.5, alpha: a });
  if (o.ticks !== false && a > 0.001) {
    for (let i = -4; i <= 4; i++) {
      const x = tx(i);
      seg(ctx, { x, y: y - 7 }, { x, y: y + 7 }, { color: C.ink2, lw: 2, alpha: a });
      tex(ctx, String(i).replace('-', '−'), x, y - 16, { size: 22, color: C.muted, align: 'center', alpha: a });
    }
    tex(ctx, 't', 1565, y - 16, { size: 26, color: C.muted, alpha: a });
  }
  tex(ctx, String.raw`y = h`, 40, y + 36, { size: 28, color: C.ink2, alpha: a });
}

// A stretch [a, b] of the line (either end may be ±∞: it runs off the stage with an arrowhead).
export function lineStretch(ctx, a, b, o = {}) {
  const y = toPx(PS, v2(0, H)).y;
  const x0 = a === -Infinity ? 30 : tx(a);
  const x1 = b === Infinity ? 1570 : tx(b);
  const al = o.alpha ?? 1;
  seg(ctx, { x: x0, y }, { x: x1, y }, { color: o.color, lw: o.lw ?? 8, alpha: al, cap: 'butt' });
  if (b === Infinity) arrow(ctx, { x: x1 - 40, y }, { x: x1 + 18, y }, { color: o.color, lw: o.lw ?? 8, head: 22, alpha: al });
  if (a === -Infinity) arrow(ctx, { x: x0 + 40, y }, { x: x0 - 18, y }, { color: o.color, lw: o.lw ?? 8, head: 22, alpha: al });
}

// The arc of the unit circle that [a, b] is seen under: from q(a) clockwise to q(b).
export function seenArc(ctx, a, b, o = {}) {
  return arc(ctx, toPx(PS, v2(0, 0)), PS.k * (o.r ?? 1), qAngle(a), qAngle(b), { color: o.color, lw: o.lw ?? 8, alpha: o.alpha ?? 1, head: o.head, p: o.p });
}

// The graph's axes and the curve of the speed. o: { alpha }.
export function drawGraph(ctx, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  arrow(ctx, { x: 30, y: G.y0 }, { x: 1575, y: G.y0 }, { color: C.muted, lw: 2, head: 12, alpha: a });
  for (let i = -4; i <= 4; i++) seg(ctx, { x: tx(i), y: G.y0 - 5 }, { x: tx(i), y: G.y0 + 5 }, { color: C.muted, lw: 2, alpha: a });
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 300; i++) {
    const t = T_MIN + ((T_MAX - T_MIN) * i) / 300;
    const p = { x: tx(t), y: gy(f(t)) };
    if (i) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();
  tex(ctx, String.raw`\frac{h}{t^2+h^2}`, tx(-2.7), gy(f(-2.7)) - 16, { size: 26, color: C.ink2, alpha: a * (o.name ?? 1) });
}

// The area under the curve over [a, b] (ends may be infinite: the shading runs to the edge and
// fades there, since the area goes on). o: { color, alpha }.
export function area(ctx, a, b, o = {}) {
  const al = o.alpha ?? 1;
  if (al <= 0.001) return;
  const t0 = clampT(a === -Infinity ? T_MIN : a);
  const t1 = clampT(b === Infinity ? T_MAX : b);
  if (t1 <= t0) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const grad = ctx.createLinearGradient(tx(T_MIN), 0, tx(T_MAX), 0);
  const fadeL = a === -Infinity ? 0.12 : 0;
  const fadeR = b === Infinity ? 0.12 : 0;
  grad.addColorStop(0, fadeL ? 'rgba(0,0,0,0)' : o.color);
  grad.addColorStop(Math.min(0.49, fadeL + 0.0001), o.color);
  grad.addColorStop(Math.max(0.51, 1 - fadeR - 0.0001), o.color);
  grad.addColorStop(1, fadeR ? 'rgba(0,0,0,0)' : o.color);
  ctx.fillStyle = o.color;
  ctx.beginPath();
  ctx.moveTo(tx(t0), G.y0);
  for (let i = 0; i <= 120; i++) {
    const t = t0 + ((t1 - t0) * i) / 120;
    ctx.lineTo(tx(t), gy(f(t)));
  }
  ctx.lineTo(tx(t1), G.y0);
  ctx.closePath();
  if (fadeL || fadeR) {
    // fade only the ends that run to infinity
    const g2 = ctx.createLinearGradient(tx(t0), 0, tx(t1), 0);
    g2.addColorStop(0, a === -Infinity ? 'rgba(255,255,255,0)' : o.color);
    g2.addColorStop(a === -Infinity ? 0.25 : 0, o.color);
    g2.addColorStop(b === Infinity ? 0.75 : 1, o.color);
    g2.addColorStop(1, b === Infinity ? 'rgba(255,255,255,0)' : o.color);
    ctx.fillStyle = g2;
  }
  ctx.fill();
  ctx.restore();
  void grad;
}

// The point (t, h) on the line, the segment from the origin to it, and q(t) on the circle.
export function ray(ctx, t, o = {}) {
  const O = toPx(PS, v2(0, 0));
  const Pp = toPx(PS, v2(t, H));
  const Q = toPx(PS, q(t));
  const a = o.alpha ?? 1;
  const s = seg(ctx, O, Pp, { color: o.color ?? C.ink2, lw: o.lw ?? 2.5, alpha: a, dash: o.dash });
  dot(ctx, Pp, { r: 7, color: o.color ?? C.ink, alpha: a });
  dot(ctx, Q, { r: 8, color: o.qColor ?? C.accent, alpha: a * (o.showQ ?? 1) });
  return { O, P: Pp, Q, shape: s };
}

export { clamp, label };
