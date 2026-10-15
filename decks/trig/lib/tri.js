// The right triangle every clip of chapter 1 draws. Its corners are A (the angle θ), C (the
// right angle) and B (the top). The base A–C is green (cos), the height C–B blue (sin), the
// hypotenuse A–B ink. The usual pose puts θ at the bottom left and the right angle at the
// bottom right, the pose the cursive s, c, t are written on (lib/cursive.js).

import { clamp, lerp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { C as COL, F } from './theme.js';
import { math } from './math.js';

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

const SIDES = { base: ['A', 'C'], height: ['C', 'B'], hyp: ['A', 'B'] };
export const SIDE_COLOR = { base: COL.cos, height: COL.sin, hyp: COL.ink };

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
    ctx.beginPath();
    ctx.moveTo(T.A.x, T.A.y);
    ctx.lineTo(T.C.x, T.C.y);
    ctx.lineTo(T.B.x, T.B.y);
    ctx.closePath();
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

// The small square at the right angle.
export function rightMark(ctx, T, o = {}) {
  const size = o.size ?? 22;
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

export function unit(p, q) {
  const l = len(p, q) || 1;
  return { x: (q.x - p.x) / l, y: (q.y - p.y) / l };
}

// The arc of the angle at vertex V between the rays to P and Q, drawn up to p. o: { r,
// color, lw, alpha, label, labelColor, size, double } — label is a string or a math node.
export function angleArc(ctx, V, P, Q, o = {}) {
  const r = o.r ?? 56;
  const a0 = Math.atan2(P.y - V.y, P.x - V.x);
  let a1 = Math.atan2(Q.y - V.y, Q.x - V.x);
  let d = a1 - a0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const prog = clamp(o.p ?? 1);
  const al = o.alpha ?? 1;
  if (al <= 0.001 || prog <= 0) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.strokeStyle = o.color ?? COL.ink;
  ctx.lineWidth = o.lw ?? 3;
  ctx.beginPath();
  ctx.arc(V.x, V.y, r, a0, a0 + d * prog, d < 0);
  ctx.stroke();
  if (o.double) {
    ctx.beginPath();
    ctx.arc(V.x, V.y, r + 9, a0, a0 + d * prog, d < 0);
    ctx.stroke();
  }
  if (o.label && prog >= 1) {
    const mid = a0 + d / 2;
    const lr = o.labelR ?? r + (o.size ?? 34) * 0.95;
    const lx = V.x + Math.cos(mid) * lr;
    const ly = V.y + Math.sin(mid) * lr;
    label(ctx, o.label, lx, ly, { size: o.size ?? 34, color: o.labelColor ?? o.color ?? COL.ink, alpha: o.labelAlpha ?? 1 });
  }
  ctx.restore();
}

// A label centred on (x, y): a plain string in the Japanese face, or a math node.
export function label(ctx, s, x, y, o = {}) {
  const size = o.size ?? 32;
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  if (typeof s === 'string') {
    text(ctx, s, x, y + size * 0.36, { font: o.font ?? F.jp(o.weight ?? 700, size), color: o.color ?? COL.ink, align: 'center', alpha: a });
  } else {
    math(ctx, s, x, y + size * 0.3, { size, color: o.color ?? COL.ink, align: 'center', alpha: a });
  }
}

// Where a side's label goes: the side's midpoint pushed outwards (away from the triangle) by
// `off` px.
export function sidePoint(T, side, off = 40, along = 0.5) {
  const [p, q] = SIDES[side];
  const P = T[p];
  const Q = T[q];
  const m = { x: lerp(P.x, Q.x, along), y: lerp(P.y, Q.y, along) };
  const u = unit(P, Q);
  let nx = -u.y;
  let ny = u.x;
  const g = centroid(T);
  if ((m.x - g.x) * nx + (m.y - g.y) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: m.x + nx * off, y: m.y + ny * off, nx, ny };
}

export function sideLabel(ctx, T, side, s, o = {}) {
  const p = sidePoint(T, side, o.off ?? 40, o.along ?? 0.5);
  label(ctx, s, p.x, p.y, { color: o.color ?? SIDE_COLOR[side], ...o });
}

// A dimension line beside P–Q, pushed `off` px along the normal (nx, ny), with end ticks
// and a label in the middle on a paper-coloured patch. Drawn up to p from P.
export function dim(ctx, P, Q, n, off, s, o = {}) {
  const prog = clamp(o.p ?? 1);
  const a = o.alpha ?? 1;
  if (prog <= 0 || a <= 0.001) return;
  const p1 = { x: P.x + n.x * off, y: P.y + n.y * off };
  const p2 = { x: Q.x + n.x * off, y: Q.y + n.y * off };
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
  if (s && prog >= 1) {
    const m = mixPt(p1, p2, 0.5);
    label(ctx, s, m.x + n.x * (o.labelOff ?? 0), m.y + n.y * (o.labelOff ?? 0), { size: o.size ?? 30, color: o.labelColor ?? o.color ?? COL.ink, alpha: o.labelAlpha ?? 1, font: o.font });
  }
  ctx.restore();
}
