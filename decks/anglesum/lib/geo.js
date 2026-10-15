// Geometry drawn exactly. Points and vectors live in the plane's own coordinates (y up) and a
// `plane` — its origin on the stage and its px per unit — carries them to the stage. Angles are
// given as the plane measures them: radians, counterclockwise positive. An arc of length θ on
// the unit circle is drawn as that arc, a vector as the arrow from its start to its end.
//
// Every drawing function returns the shapes it drew (src/kit/place.js), so a label can keep
// clear of them, and draws nothing (but still returns them) when its alpha is 0.

import { clamp } from '../../../src/kit/ease.js';
import { segment, arc as arcShape, disc, placeAround, place } from '../../../src/kit/place.js';
import { C } from './theme.js';
import { tex, texSize } from './math.js';

export const TAU = Math.PI * 2;

// ——— vectors in the plane ————————————————————————————————————————————

export const v2 = (x, y) => ({ x, y });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a, k) => ({ x: a.x * k, y: a.y * k });
export const mix = (a, b, p) => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p });
export const len = (a) => Math.hypot(a.x, a.y);
export const unit = (a) => scale(a, 1 / len(a));
export const inner = (a, b) => a.x * b.x + a.y * b.y;
export const det = (a, b) => a.x * b.y - a.y * b.x;
export const mod = (x, m = TAU) => ((x % m) + m) % m;
// the direction of a vector as an angle in (−π, π]
export const dirOf = (a) => Math.atan2(a.y, a.x);
// the rotation angle from a to b: counterclockwise, in [0, 2π)
export const turn = (a, b) => mod(dirOf(b) - dirOf(a));
// the angle between a and b: the shorter arc, in [0, π]
export const between = (a, b) => {
  const t = turn(a, b);
  return Math.min(t, TAU - t);
};
export const rot = (a, th) => ({ x: a.x * Math.cos(th) - a.y * Math.sin(th), y: a.x * Math.sin(th) + a.y * Math.cos(th) });
// E(s): the point of the unit circle reached from (1, 0) by going counterclockwise a length s
export const E = (s) => ({ x: Math.cos(s), y: Math.sin(s) });

// ——— the plane on the stage ——————————————————————————————————————————

export const plane = (ox, oy, k) => ({ ox, oy, k });
export const toPx = (P, a) => ({ x: P.ox + a.x * P.k, y: P.oy - a.y * P.k });
// a direction in the plane as a unit vector on the stage (y down)
export const screenDir = (a) => {
  const l = len(a) || 1;
  return { x: a.x / l, y: -a.y / l };
};

function pen(ctx, o, color, lw) {
  ctx.strokeStyle = o.color ?? color;
  ctx.fillStyle = o.color ?? color;
  ctx.lineWidth = o.lw ?? lw;
  ctx.lineCap = o.cap ?? 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(o.dash ?? []);
}

// ——— marks on the stage (px) ———————————————————————————————————————————

// A segment from p to q (px), drawn up to o.p. o: { color, lw, dash, p, alpha }.
export function seg(ctx, p, q, o = {}) {
  const shape = segment(p, q, o.lw ?? 3);
  const prog = clamp(o.p ?? 1);
  const a = o.alpha ?? 1;
  if (a <= 0.001 || prog <= 0) return shape;
  ctx.save();
  ctx.globalAlpha *= a;
  pen(ctx, o, C.ink, 3);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + (q.x - p.x) * prog, p.y + (q.y - p.y) * prog);
  ctx.stroke();
  ctx.restore();
  return shape;
}

// A filled arrowhead with its tip at p, pointing along the stage direction d (unit).
export function head(ctx, p, d, size = 18) {
  const n = { x: -d.y, y: d.x };
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x - d.x * size + n.x * size * 0.5, p.y - d.y * size + n.y * size * 0.5);
  ctx.lineTo(p.x - d.x * size - n.x * size * 0.5, p.y - d.y * size - n.y * size * 0.5);
  ctx.closePath();
  ctx.fill();
}

// A vector: the arrow from p to q (px), its tip exactly at q, drawn up to o.p.
// o: { color, lw, head, p, alpha, dash }.
export function arrow(ctx, p, q, o = {}) {
  const shape = segment(p, q, o.lw ?? 4);
  const prog = clamp(o.p ?? 1);
  const a = o.alpha ?? 1;
  const L = Math.hypot(q.x - p.x, q.y - p.y);
  if (a <= 0.001 || prog <= 0 || L < 0.5) return shape;
  const d = { x: (q.x - p.x) / L, y: (q.y - p.y) / L };
  const hs = Math.min(o.head ?? 20, L * 0.6);
  const tip = { x: p.x + d.x * L * prog, y: p.y + d.y * L * prog };
  ctx.save();
  ctx.globalAlpha *= a;
  pen(ctx, o, C.ink, 4);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  const back = Math.min(L * prog, hs * 0.7);
  ctx.lineTo(tip.x - d.x * back, tip.y - d.y * back);
  ctx.stroke();
  ctx.setLineDash([]);
  head(ctx, tip, d, hs);
  ctx.restore();
  return shape;
}

// A point. o: { r, color, open (a ring: the point is not reached), alpha }.
export function dot(ctx, p, o = {}) {
  const r = o.r ?? 7;
  const shape = disc(p, r + 1);
  const a = o.alpha ?? 1;
  if (a <= 0.001) return shape;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, TAU);
  if (o.open) {
    ctx.fillStyle = C.paper;
    ctx.fill();
    ctx.lineWidth = o.lw ?? 3;
    ctx.strokeStyle = o.color ?? C.ink;
    ctx.stroke();
  } else {
    ctx.fillStyle = o.color ?? C.ink;
    ctx.fill();
  }
  ctx.restore();
  return shape;
}

// The arc of the circle around c (px) of radius r (px) from angle a0 to a1 — counterclockwise
// when a1 > a0, clockwise when a1 < a0 — drawn up to o.p. With o.head, an arrowhead at the end
// shows the way round (the arc stops short of the end by the head, whose tip is the end).
// o: { color, lw, dash, p, head, alpha }.
export function arc(ctx, c, r, a0, a1, o = {}) {
  const shape = arcShape(c, r, -a0, -a1, o.lw ?? 3);
  const prog = clamp(o.p ?? 1);
  const a = o.alpha ?? 1;
  if (a <= 0.001 || prog <= 0 || r <= 0 || Math.abs(a1 - a0) < 1e-6) return shape;
  const end = a0 + (a1 - a0) * prog;
  const way = a1 > a0 ? 1 : -1;
  const hs = o.head ? Math.min(typeof o.head === 'number' ? o.head : 18, r * Math.abs(end - a0) * 0.8) : 0;
  const stop = end - (way * hs * 0.7) / r;
  ctx.save();
  ctx.globalAlpha *= a;
  pen(ctx, o, C.ink, 3);
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, -a0, -stop, way > 0);
  ctx.stroke();
  if (hs > 1) {
    ctx.setLineDash([]);
    const tip = { x: c.x + Math.cos(end) * r, y: c.y - Math.sin(end) * r };
    // the tangent at the end, in the way of travel, on the stage
    const d = { x: -Math.sin(end) * way, y: -Math.cos(end) * way };
    // aim the head along the chord of its own length, so it sits on the curve
    const back = (hs * 0.9) / r;
    const from = { x: c.x + Math.cos(end - way * back) * r, y: c.y - Math.sin(end - way * back) * r };
    const L = Math.hypot(tip.x - from.x, tip.y - from.y) || 1;
    head(ctx, tip, L > 1 ? { x: (tip.x - from.x) / L, y: (tip.y - from.y) / L } : d, hs);
  }
  ctx.restore();
  return shape;
}

// A filled wedge around c from angle a0 to a1 (as arc()), radius r px. o: { color, alpha }.
export function wedge(ctx, c, r, a0, a1, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = o.color ?? C.ink;
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.arc(c.x, c.y, r, -a0, -a1, a1 > a0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The angle between two directions d1, d2 (plane vectors) at the corner V (px): the shorter
// way round, a soft wedge with its arc. Returns { shapes, mid } — mid the stage direction of
// the bisector, for a label. o: { r, color, soft, alpha, lw, fill }.
export function angleMark(ctx, V, d1, d2, o = {}) {
  const r = o.r ?? 46;
  const a1 = dirOf(d1);
  const t = turn(d1, d2);
  const [s, e] = t <= Math.PI ? [a1, a1 + t] : [a1, a1 - (TAU - t)];
  const al = o.alpha ?? 1;
  if (o.fill !== false) wedge(ctx, V, r, s, e, { color: o.soft ?? C.rule, alpha: al * (o.fillAlpha ?? 1) });
  const shape = arc(ctx, V, r, s, e, { color: o.color ?? C.ink, lw: o.lw ?? 3, alpha: al });
  const m = (s + e) / 2;
  return { shapes: [shape], mid: { x: Math.cos(m), y: -Math.sin(m) }, a0: s, a1: e };
}

// ——— the plane's furniture ——————————————————————————————————————————

// Grid lines every o.step units over [x0, x1] × [y0, y1] (plane units). o: { step, alpha }.
export function grid(ctx, P, x0, x1, y0, y1, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const step = o.step ?? 0.5;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.lineWidth = 1;
  for (let i = Math.ceil(x0 / step); i * step <= x1 + 1e-9; i++) {
    const p = toPx(P, { x: i * step, y: 0 });
    ctx.strokeStyle = Math.abs((i * step) % 1) < 1e-9 ? C.gridBold : C.grid;
    ctx.beginPath();
    ctx.moveTo(p.x + 0.5, toPx(P, { x: 0, y: y1 }).y);
    ctx.lineTo(p.x + 0.5, toPx(P, { x: 0, y: y0 }).y);
    ctx.stroke();
  }
  for (let j = Math.ceil(y0 / step); j * step <= y1 + 1e-9; j++) {
    const p = toPx(P, { x: 0, y: j * step });
    ctx.strokeStyle = Math.abs((j * step) % 1) < 1e-9 ? C.gridBold : C.grid;
    ctx.beginPath();
    ctx.moveTo(toPx(P, { x: x0, y: 0 }).x, p.y + 0.5);
    ctx.lineTo(toPx(P, { x: x1, y: 0 }).x, p.y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

// The x and y axes over [x0, x1] × [y0, y1], with arrowheads and their names.
// o: { alpha, names (default true), color }. Returns their shapes.
export function axes(ctx, P, x0, x1, y0, y1, o = {}) {
  const a = o.alpha ?? 1;
  const col = o.color ?? C.muted;
  const xs = arrow(ctx, toPx(P, { x: x0, y: 0 }), toPx(P, { x: x1, y: 0 }), { color: col, lw: 2, head: 14, alpha: a });
  const ys = arrow(ctx, toPx(P, { x: 0, y: y0 }), toPx(P, { x: 0, y: y1 }), { color: col, lw: 2, head: 14, alpha: a });
  if (o.names !== false && a > 0.001) {
    const ex = toPx(P, { x: x1, y: 0 });
    const ey = toPx(P, { x: 0, y: y1 });
    tex(ctx, 'x', ex.x - 6, ex.y + 34, { size: 30, color: col, alpha: a, align: 'center' });
    tex(ctx, 'y', ey.x - 24, ey.y + 10, { size: 30, color: col, alpha: a, align: 'center' });
  }
  return [xs, ys];
}

// The unit circle of the plane. o: { color, lw, alpha, dash }. Returns its shape.
export function unitCircle(ctx, P, o = {}) {
  return arc(ctx, toPx(P, { x: 0, y: 0 }), P.k, 0, TAU, { color: o.color ?? C.ink2, lw: o.lw ?? 2.5, alpha: o.alpha, dash: o.dash, p: o.p });
}

// An arc of the unit circle of plane P from angle s0 to s1 (see arc()).
export const unitArc = (ctx, P, s0, s1, o = {}) => arc(ctx, toPx(P, { x: 0, y: 0 }), P.k, s0, s1, o);

// ——— labels ——————————————————————————————————————————————————————————

// A TeX label slid out from `anchor` (px) along the stage direction `dir` until it keeps clear
// of `shapes`; o.fixed keeps it on that line instead of letting it turn round obstacles.
// o: { size, color, gap, from, alpha, colors, fixed, spread }. Returns its box.
export function label(ctx, src, anchor, dir, shapes = [], o = {}) {
  const size = o.size ?? 34;
  const b = texSize(src, size);
  const box = { w: b.w, h: b.asc + b.desc };
  // with nothing to keep clear of, a label still sits beside its anchor, not on it
  const gap = o.gap ?? 8;
  const beside = gap + (Math.abs(dir.x) * box.w + Math.abs(dir.y) * box.h) / 2;
  const opts = { gap, from: o.from ?? (shapes.length ? 0 : beside), to: o.to ?? 300, spread: o.spread };
  const at = o.fixed ? place(anchor, dir, box, shapes, opts) : placeAround(anchor, dir, box, shapes, opts);
  tex(ctx, src, at.box.x, at.box.y + b.asc, { size, color: o.color ?? C.ink, alpha: o.alpha ?? 1, colors: o.colors });
  return at.box;
}
