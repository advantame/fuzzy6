// The one triangle both proofs are drawn on. In proof 2's coordinates it is A = (0, 0),
// B = (L, 0), C = (p, h); proof 1 draws the same triangle turned and moved (posed()). Its
// corners are named in counterclockwise order, as both proofs take them.

import { C, CORNER, SOFT } from './theme.js';
import { v2, add, sub, rot, between, toPx, seg, angleMark, label, dirOf } from './geo.js';

export const L = 2.5;
export const P0 = 0.9;
export const H0 = 1.5;
export const TRI = { A: v2(0, 0), B: v2(L, 0), C: v2(P0, H0) };

// The triangle turned by `angle` about A and moved so that A lands on `at`.
export const posed = (angle, at = v2(0, 0), T = TRI) =>
  Object.fromEntries(Object.entries(T).map(([k, q]) => [k, add(rot(sub(q, T.A), angle), at)]));

// The edge vectors of proof 1: u = B − A, v = C − B, w = A − C.
export const edges = (T) => ({ u: sub(T.B, T.A), v: sub(T.C, T.B), w: sub(T.A, T.C) });

// The interior angles: α between B − A and C − A, and so on.
export const interior = (T) => ({
  A: between(sub(T.B, T.A), sub(T.C, T.A)),
  B: between(sub(T.A, T.B), sub(T.C, T.B)),
  C: between(sub(T.A, T.C), sub(T.B, T.C)),
});

// the two sides leaving each corner
export const sides = (T) => ({
  A: [sub(T.B, T.A), sub(T.C, T.A)],
  B: [sub(T.C, T.B), sub(T.A, T.B)],
  C: [sub(T.A, T.C), sub(T.B, T.C)],
});

export const GREEK = { A: String.raw`\alpha`, B: String.raw`\beta`, C: String.raw`\gamma` };

// The outline (ink) in plane P. Returns the stage points and the sides as shapes.
// o: { lw, color, alpha, p (drawn up to) }.
export function drawTri(ctx, P, T, o = {}) {
  const A = toPx(P, T.A);
  const B = toPx(P, T.B);
  const Cc = toPx(P, T.C);
  const st = { lw: o.lw ?? 4, color: o.color ?? C.ink, alpha: o.alpha ?? 1, p: o.p ?? 1 };
  const shapes = [seg(ctx, A, B, st), seg(ctx, B, Cc, st), seg(ctx, Cc, A, st)];
  return { A, B, C: Cc, shapes };
}

// The names A, B, C just outside their corners. o: { size, alpha, avoid, color }.
export function names(ctx, P, T, o = {}) {
  const S = ['A', 'B', 'C'].map((k) => toPx(P, T[k]));
  const cx = (S[0].x + S[1].x + S[2].x) / 3;
  const cy = (S[0].y + S[1].y + S[2].y) / 3;
  const shapes = [...(o.avoid ?? [])];
  for (let i = 0; i < 3; i++) shapes.push({ kind: 'segment', p: S[i], q: S[(i + 1) % 3], w: 4 });
  const out = {};
  ['A', 'B', 'C'].forEach((k, i) => {
    const d = { x: S[i].x - cx, y: S[i].y - cy };
    const l = Math.hypot(d.x, d.y);
    out[k] = label(ctx, k, S[i], { x: d.x / l, y: d.y / l }, shapes, { size: o.size ?? 38, color: o.color ?? C.ink, alpha: o.alpha ?? 1, gap: 10 });
  });
  return out;
}

// The interior angle at corner k as a soft wedge with its arc in the corner's colour, and its
// Greek name. o: { r, alpha, name (false to leave it out), size, avoid }. Returns the name's
// box and the shapes.
export function cornerAngle(ctx, P, T, k, o = {}) {
  const V = toPx(P, T[k]);
  const [d1, d2] = sides(T)[k];
  const m = angleMark(ctx, V, d1, d2, { r: o.r ?? 52, color: CORNER[k], soft: SOFT[k], alpha: o.alpha ?? 1, lw: 3 });
  let box = null;
  if (o.name !== false) {
    const shapes = [...m.shapes, ...(o.avoid ?? [])];
    box = label(ctx, GREEK[k], V, m.mid, shapes, { size: o.size ?? 36, color: CORNER[k], alpha: o.alpha ?? 1, from: (o.r ?? 52) * 0.5, gap: 6, fixed: true });
  }
  return { box, shapes: m.shapes, mid: m.mid, a0: m.a0, a1: m.a1 };
}

// the direction (radians) from corner k to the middle of the opposite side
export const inward = (T, k) => {
  const o = { A: ['B', 'C'], B: ['C', 'A'], C: ['A', 'B'] }[k];
  return dirOf(sub(v2((T[o[0]].x + T[o[1]].x) / 2, (T[o[0]].y + T[o[1]].y) / 2), T[k]));
};
