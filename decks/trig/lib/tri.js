// The right triangle every clip of chapter 1 draws. Its corners are A (the angle θ), C (the
// right angle) and B (the top). The base A–C is green (cos), the height C–B blue (sin), the
// hypotenuse A–B ink. The usual pose puts θ at the bottom left and the right angle at the
// bottom right, the pose the cursive s, c, t are written on (lib/cursive.js).
//
// Labels are never placed by hand-tuned offsets. An angle's label goes out along the bisector,
// a side's label out from the side and a corner's name out of the corner (src/kit/place.js),
// each just far enough to keep clear
// of the triangle's lines and arcs and of anything passed as o.avoid. Every function that
// draws a label returns its box ({ x, y, w, h }), whether or not it is shown yet, so a ring
// can go round it (ringBox in src/kit/cue.js) and another label can avoid it.

import { clamp, lerp } from '../../../src/kit/ease.js';
import { text, measure, rr } from '../../../src/kit/draw.js';
import { segment, arc as arcShape, rect as rectShape, place, placeAround, grow } from '../../../src/kit/place.js';
import { C as COL, F } from './theme.js';
import { math, box as mathBox } from './math.js';

export const RAD = Math.PI / 180;

// Corners of the triangle with angle `deg` at A and base length `base`, placed by `pose`:
// { x, y } is where A goes, s scales, rot turns (radians, clockwise on screen), fx mirrors
// left–right (1 or −1; values between flip the triangle like a card turning over).
export function corners(deg, base, pose = {}) {
  const { x = 0, y = 0, s = 1, rot = 0, fx = 1 } = pose;
  const h = base * Math.tan(deg * RAD);
  const place = ([px, py]) => {
    const qx = px * fx * s;
    const qy = py * s;
    return { x: x + qx * Math.cos(rot) - qy * Math.sin(rot), y: y + qx * Math.sin(rot) + qy * Math.cos(rot) };
  };
  return { A: place([0, 0]), C: place([base, 0]), B: place([base, -h]) };
}

// Same triangle given by base length from A to C and height from C to B (A at x, y).
export function byLegs(base, height, pose = {}) {
  return corners(Math.atan2(height, base) / RAD, base, pose);
}

export const mixPose = (a, b, p) => Object.fromEntries(Object.keys({ ...a, ...b }).map((k) => [k, lerp(a[k] ?? DEF[k], b[k] ?? DEF[k], p)]));
const DEF = { x: 0, y: 0, s: 1, rot: 0, fx: 1 };

export const mixPt = (p, q, u) => ({ x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u) });
export const mixTri = (T, U, u) => ({ A: mixPt(T.A, U.A, u), B: mixPt(T.B, U.B, u), C: mixPt(T.C, U.C, u) });
export const centroid = (T) => ({ x: (T.A.x + T.B.x + T.C.x) / 3, y: (T.A.y + T.B.y + T.C.y) / 3 });
export const len = (p, q) => Math.hypot(q.x - p.x, q.y - p.y);

export const SIDES = { base: ['A', 'C'], height: ['C', 'B'], hyp: ['A', 'B'] };
export const SIDE_COLOR = { base: COL.cos, height: COL.sin, hyp: COL.ink };
// the line width of a triangle's sides, as the labels assume it
const SIDE_W = 6;
const RIGHT = 22;

export function unit(p, q) {
  const l = len(p, q) || 1;
  return { x: (q.x - p.x) / l, y: (q.y - p.y) / l };
}

// ——— the triangle —————————————————————————————————————————————————————

// A segment drawn up to fraction p from its first end.
function seg(ctx, p, q, prog, color, lw, alpha) {
  if (prog <= 0 || alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(lerp(p.x, q.x, clamp(prog)), lerp(p.y, q.y, clamp(prog)));
  ctx.stroke();
  ctx.restore();
}

// Draw the triangle. o: { lw, alpha, fill, base, height, hyp, right, plain } — each side
// option is { p (drawn fraction), color, alpha, lw, dash }. plain: draw every side in ink
// (before the sides have meanings, or for a ghost outline).
export function drawTri(ctx, T, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  if (o.fill) {
    ctx.fillStyle = o.fill;
    path(ctx, T);
    ctx.fill();
  }
  const rightA = o.right ?? 1;
  if (rightA > 0) rightMark(ctx, T, { alpha: rightA, color: o.rightColor ?? COL.ink2 });
  for (const side of ['base', 'height', 'hyp']) {
    const so = o[side] ?? {};
    const [p, q] = SIDES[side];
    const color = so.color ?? (o.plain ? o.plainColor ?? COL.ink : SIDE_COLOR[side]);
    if (so.dash) ctx.setLineDash(so.dash);
    seg(ctx, T[p], T[q], so.p ?? 1, color, so.lw ?? o.lw ?? 5, so.alpha ?? 1);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function path(ctx, T) {
  ctx.beginPath();
  ctx.moveTo(T.A.x, T.A.y);
  ctx.lineTo(T.C.x, T.C.y);
  ctx.lineTo(T.B.x, T.B.y);
  ctx.closePath();
}

// The inside of the triangle, tinted (to say "this shape").
export function fillTri(ctx, T, color, a = 1) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = color;
  path(ctx, T);
  ctx.fill();
  ctx.restore();
}

// A dashed outline in grey: where a triangle is going, or a copy of one.
export function ghostTri(ctx, T, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  ctx.save();
  ctx.setLineDash(o.dash ?? [10, 9]);
  drawTri(ctx, T, { plain: true, plainColor: o.color ?? COL.muted, lw: o.lw ?? 3, right: o.right ?? 0, alpha: a });
  ctx.restore();
}

// The small square at the right angle.
export function rightMark(ctx, T, o = {}) {
  const size = o.size ?? RIGHT;
  const ua = unit(T.C, T.A);
  const ub = unit(T.C, T.B);
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.strokeStyle = o.color ?? COL.ink2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(T.C.x + ua.x * size, T.C.y + ua.y * size);
  ctx.lineTo(T.C.x + (ua.x + ub.x) * size, T.C.y + (ua.y + ub.y) * size);
  ctx.lineTo(T.C.x + ub.x * size, T.C.y + ub.y * size);
  ctx.stroke();
  ctx.restore();
}

// The box round a triangle's corners, or round a point.
export function triBox(T, pad = 0) {
  const xs = [T.A.x, T.B.x, T.C.x];
  const ys = [T.A.y, T.B.y, T.C.y];
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y };
}
export const pointBox = (p, pad = 10) => ({ x: p.x - pad, y: p.y - pad, w: pad * 2, h: pad * 2 });

// The box round the right angle's square (to ring it).
export function rightBox(T, pad = 4) {
  const ua = unit(T.C, T.A);
  const ub = unit(T.C, T.B);
  const pts = [T.C, { x: T.C.x + ua.x * RIGHT, y: T.C.y + ua.y * RIGHT }, { x: T.C.x + ub.x * RIGHT, y: T.C.y + ub.y * RIGHT }, { x: T.C.x + (ua.x + ub.x) * RIGHT, y: T.C.y + (ua.y + ub.y) * RIGHT }];
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y };
}

// The triangle's lines as shapes for labels to keep clear of: the three sides and the right
// angle's square.
export function triShapes(T, w = SIDE_W) {
  const ua = unit(T.C, T.A);
  const ub = unit(T.C, T.B);
  const k = { x: T.C.x + (ua.x + ub.x) * RIGHT, y: T.C.y + (ua.y + ub.y) * RIGHT };
  return [
    segment(T.A, T.C, w),
    segment(T.C, T.B, w),
    segment(T.A, T.B, w),
    segment({ x: T.C.x + ua.x * RIGHT, y: T.C.y + ua.y * RIGHT }, k, 2),
    segment(k, { x: T.C.x + ub.x * RIGHT, y: T.C.y + ub.y * RIGHT }, 2),
  ];
}

// ——— labels ——————————————————————————————————————————————————————————

const CJK = /[　-鿿＀-￯]/;
let scratch = null;
const ctx0 = () => (scratch ??= document.createElement('canvas').getContext('2d'));
const fontOf = (o, size) => o.font ?? F.jp(o.weight ?? 700, size);

// The size of a label: a plain string in the Japanese face, or a math node. The height is
// that of the glyphs, not of the line, so the gap to a line looks the same above and below.
export function labelSize(s, o = {}) {
  const size = o.size ?? 32;
  if (typeof s === 'string') return { w: measure(ctx0(), fontOf(o, size), s), h: size * (CJK.test(s) ? 0.92 : 0.74) };
  const b = mathBox(s, size);
  return { w: b.w, h: b.asc + b.desc };
}

// Draw a label centred on (x, y). o: { size, color, alpha, font, weight, patch, patchAlpha }
// — patch (a colour, or true for the paper's) lays a plate under it, for a label that has to
// sit over a picture. Returns its box.
export function label(ctx, s, x, y, o = {}) {
  const size = o.size ?? 32;
  const a = o.alpha ?? 1;
  const sz = labelSize(s, o);
  const b = { x: x - sz.w / 2, y: y - sz.h / 2, w: sz.w, h: sz.h };
  if (a <= 0.001) return b;
  if (o.patch && (o.patchAlpha ?? 1) > 0.001) {
    const p = grow(b, size * 0.22);
    ctx.save();
    ctx.globalAlpha *= a * (o.patchAlpha ?? 1);
    ctx.fillStyle = o.patch === true ? COL.paper : o.patch;
    rr(ctx, p.x, p.y, p.w, p.h, size * 0.3);
    ctx.fill();
    ctx.restore();
  }
  if (typeof s === 'string') {
    text(ctx, s, x, y + size * 0.36, { font: fontOf(o, size), color: o.color ?? COL.ink, align: 'center', alpha: a });
  } else {
    const mb = mathBox(s, size);
    math(ctx, s, x, y + (mb.asc - mb.desc) / 2, { size, color: o.color ?? COL.ink, align: 'center', alpha: a });
  }
  return b;
}

// A label slid out from `anchor` along `dir` until it keeps o.gap px from every shape, then
// drawn. o: label options and { gap, from, to }. Returns its box.
export function placeLabel(ctx, s, anchor, dir, shapes, o = {}) {
  const at = place(anchor, dir, labelSize(s, o), shapes, { gap: o.gap ?? 8, from: o.from ?? 0, to: o.to ?? 400 });
  return label(ctx, s, at.x, at.y, o);
}

// ——— angles ——————————————————————————————————————————————————————————

// The arc of the angle at vertex V between the rays to P and Q, drawn up to p, and its label
// inside the angle: out along the bisector, past the arc, until it clears both rays, the arc
// and o.avoid (an array of shapes). o: { r, color, lw, alpha, p, label, labelColor,
// labelAlpha, size, double, gap, avoid, sideW (the rays' line width) }. Returns the label's
// box (or null without a label).
export function angleArc(ctx, V, P, Q, o = {}) {
  const r = o.r ?? 56;
  const a0 = Math.atan2(P.y - V.y, P.x - V.x);
  const a1 = Math.atan2(Q.y - V.y, Q.x - V.x);
  let d = a1 - a0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const prog = clamp(o.p ?? 1);
  const al = o.alpha ?? 1;
  const lw = o.lw ?? 3;
  let lb = null;
  if (o.label) {
    const mid = a0 + d / 2;
    const outer = r + (o.double ? 9 : 0);
    const shapes = [
      segment(V, P, o.sideW ?? SIDE_W),
      segment(V, Q, o.sideW ?? SIDE_W),
      arcShape(V, outer, a0, a0 + d, lw),
      ...(o.avoid ?? []),
    ];
    const lo = { size: o.size ?? 34, color: o.labelColor ?? o.color ?? COL.ink, alpha: al * (o.labelAlpha ?? 1) * (prog >= 1 ? 1 : 0), font: o.font };
    const at = place(V, { x: Math.cos(mid), y: Math.sin(mid) }, labelSize(o.label, lo), shapes, { gap: o.gap ?? 6, from: outer, to: outer + 600 });
    lb = { x: at.x, y: at.y, lo };
  }
  if (al > 0.001 && prog > 0) {
    ctx.save();
    ctx.globalAlpha *= al;
    ctx.strokeStyle = o.color ?? COL.ink;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(V.x, V.y, r, a0, a0 + d * prog, d < 0);
    ctx.stroke();
    if (o.double) {
      ctx.beginPath();
      ctx.arc(V.x, V.y, r + 9, a0, a0 + d * prog, d < 0);
      ctx.stroke();
    }
    ctx.restore();
  }
  return lb ? label(ctx, o.label, lb.x, lb.y, lb.lo) : null;
}

// The arc of a corner of triangle T — 'A' (θ) or 'B' (the top) — whose label keeps clear of
// all three sides as well. o as for angleArc.
export function angleAt(ctx, T, corner, o = {}) {
  const [P, Q] = corner === 'A' ? [T.C, T.B] : corner === 'B' ? [T.A, T.C] : [T.A, T.B];
  return angleArc(ctx, T[corner], P, Q, { ...o, avoid: [...triShapes(T, o.sideW), ...(o.avoid ?? [])] });
}

// The arc of an angle as a shape for labels to keep clear of.
export function angleShape(V, P, Q, r, lw = 3) {
  const a0 = Math.atan2(P.y - V.y, P.x - V.x);
  let d = Math.atan2(Q.y - V.y, Q.x - V.x) - a0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return arcShape(V, r, a0, a0 + d, lw);
}

// ——— sides ———————————————————————————————————————————————————————————

// The side's point at `along` (0 at its first corner) and its normal pointing out of the
// triangle (into it with inside).
export function sideFrame(T, side, along = 0.5, inside = false) {
  const [p, q] = SIDES[side];
  const P = T[p];
  const Q = T[q];
  const m = { x: lerp(P.x, Q.x, along), y: lerp(P.y, Q.y, along) };
  const u = unit(P, Q);
  let nx = -u.y;
  let ny = u.x;
  const g = centroid(T);
  if (((m.x - g.x) * nx + (m.y - g.y) * ny < 0) !== inside) {
    nx = -nx;
    ny = -ny;
  }
  return { x: m.x, y: m.y, nx, ny };
}

// A point `off` px out from a side (for marks that are not labels: badges, arrows).
export function sidePoint(T, side, off = 40, along = 0.5) {
  const f = sideFrame(T, side, along, off < 0);
  const k = Math.abs(off);
  return { x: f.x + f.nx * k, y: f.y + f.ny * k, nx: f.nx, ny: f.ny };
}

// A side's label, outside the triangle (or inside with o.inside), slid out from the side
// until it clears every side, the right angle's square and o.avoid. o: label options and
// { inside, along, gap, avoid, sideW }. Returns its box.
export function sideLabel(ctx, T, side, s, o = {}) {
  const f = sideFrame(T, side, o.along ?? 0.5, !!o.inside);
  const shapes = [...triShapes(T, o.sideW), ...(o.avoid ?? [])];
  return placeLabel(ctx, s, f, { x: f.nx, y: f.ny }, shapes, { color: SIDE_COLOR[side], ...o });
}

// ——— dimension lines —————————————————————————————————————————————————

// A dimension line beside P–Q, pushed `off` px along the normal n, with end ticks, drawn up to
// p from P. Its label sits beyond the line, out along n just far enough to clear it and
// o.avoid. o: { p, alpha, color, size, labelColor, labelAlpha, font, gap, avoid, patch (alpha
// of a white plate under the label) }. Returns
// { box, line, shapes } — the label's box, the line, and the line with its end ticks, as
// shapes for other labels to avoid.
export function dim(ctx, P, Q, n, off, s, o = {}) {
  const prog = clamp(o.p ?? 1);
  const a = o.alpha ?? 1;
  const p1 = { x: P.x + n.x * off, y: P.y + n.y * off };
  const p2 = { x: Q.x + n.x * off, y: Q.y + n.y * off };
  const line = segment(p1, p2, 2);
  const tick = (pt) => segment({ x: pt.x - n.x * 10, y: pt.y - n.y * 10 }, { x: pt.x + n.x * 10, y: pt.y + n.y * 10 }, 2);
  const m = mixPt(p1, p2, 0.5);
  const lo = { size: o.size ?? 30, color: o.labelColor ?? o.color ?? COL.ink, alpha: a * (o.labelAlpha ?? 1) * (prog >= 1 ? 1 : 0), font: o.font, patch: COL.white, patchAlpha: o.patch ?? 0 };
  const shapes = [line, tick(p1), tick(p2)];
  const at = s ? place(m, n, labelSize(s, lo), [...shapes, ...(o.avoid ?? [])], { gap: o.gap ?? 10, to: 400 }) : null;
  if (prog > 0 && a > 0.001) {
    const e = mixPt(p1, p2, prog);
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.strokeStyle = o.color ?? COL.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(e.x, e.y);
    for (const [pt, show] of [[p1, true], [e, prog >= 1]]) {
      if (!show) continue;
      ctx.moveTo(pt.x - n.x * 10, pt.y - n.y * 10);
      ctx.lineTo(pt.x + n.x * 10, pt.y + n.y * 10);
    }
    ctx.stroke();
    ctx.restore();
  }
  return { box: at ? label(ctx, s, at.x, at.y, lo) : null, line, shapes };
}

// ——— corners —————————————————————————————————————————————————————————

const OTHERS = { A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B'] };

// The name of a corner of T ('A', 'B' or 'C'; the name drawn is s, so a second triangle can
// call its corners D, E, F) outside the triangle: out from the corner, away from both sides,
// and round the right angle's square and anything in o.avoid (placeAround in
// src/kit/place.js). Other words nearby (o.text, their boxes) are kept farther off than lines
// (o.textGap), so that a name sits nearer its corner than to any word and is read as the
// corner's, not as one more of a row of numbers. Upright capitals in dark ink unless o.font or
// o.color says otherwise. o: label options and { gap, avoid, text, textGap, sideW }. Returns
// its box.
export function vertexLabel(ctx, T, corner, s, o = {}) {
  const V = T[corner];
  const [p, q] = OTHERS[corner];
  const u = unit(T[p], V);
  const w = unit(T[q], V);
  const out = unit({ x: 0, y: 0 }, { x: u.x + w.x, y: u.y + w.y });
  const size = o.size ?? 36;
  const gap = o.gap ?? 6;
  const lo = { size, font: F.sans(600, size), color: COL.ink2, ...o };
  const words = (o.text ?? []).filter(Boolean).map((b) => grow(b, Math.max(0, (o.textGap ?? size * 0.8) - gap)));
  const shapes = [...triShapes(T, o.sideW), ...(o.avoid ?? []), ...boxes(...words)];
  const at = placeAround(V, out, labelSize(s, lo), shapes, { gap, to: 200 });
  return label(ctx, s, at.x, at.y, lo);
}

// Shapes for a list of boxes (labels drawn earlier that a new one must avoid).
export const boxes = (...bs) => bs.filter(Boolean).map((b) => rectShape(b.x, b.y, b.w, b.h));
