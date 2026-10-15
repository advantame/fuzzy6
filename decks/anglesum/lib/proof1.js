// The two figures proof 1 is told on, side by side: the triangle with its edge vectors u, v, w
// (left), and the unit circle with the directions of u, v, w on it (right). Both are drawn from
// the same triangle (lib/tri.js, turned a little), so every arc on the circle is exactly the
// turn it stands for at a corner of the triangle.
//
// The turn θ₁ is from u to v and happens at B, θ₂ from v to w at C, θ₃ from w to u at A; each is
// drawn in its corner's colour.

import { C, CORNER } from './theme.js';
import { plane, toPx, v2, add, sub, scale, unit, dirOf, turn, arrow, seg, dot, arc, unitCircle, label } from './geo.js';
import { posed, edges } from './tri.js';

export const POSE = 0.25;
export const T = posed(POSE);
export const PT = plane(170, 625, 200);
export const PC = plane(1150, 360, 200);
export const EDGE = edges(T);
export const DIR = { u: unit(EDGE.u), v: unit(EDGE.v), w: unit(EDGE.w) };
// each turn: from which direction to which, at which corner
export const TURN = {
  1: { from: 'u', to: 'v', at: 'B' },
  2: { from: 'v', to: 'w', at: 'C' },
  3: { from: 'w', to: 'u', at: 'A' },
};
export const theta = (i) => turn(DIR[TURN[i].from], DIR[TURN[i].to]);
const START = { u: 'A', v: 'B', w: 'C' };
const END = { u: 'B', v: 'C', w: 'A' };

// The edge vectors as arrows along the sides, with their names outside. o: { alpha: { u, v, w }
// or a number, lw, color, names }. Returns { shapes, boxes }.
export function edgeArrows(ctx, o = {}) {
  const al = (k) => (typeof o.alpha === 'object' ? (o.alpha[k] ?? 0) : (o.alpha ?? 1));
  const shapes = [];
  const boxes = {};
  const c = toPx(PT, v2((T.A.x + T.B.x + T.C.x) / 3, (T.A.y + T.B.y + T.C.y) / 3));
  for (const k of ['u', 'v', 'w']) {
    const p = toPx(PT, T[START[k]]);
    const q = toPx(PT, T[END[k]]);
    shapes.push(arrow(ctx, p, q, { color: o.color ?? C.ink, lw: o.lw ?? 5, head: 22, alpha: al(k) }));
  }
  if (o.names !== false) {
    for (const k of ['u', 'v', 'w']) {
      const p = toPx(PT, T[START[k]]);
      const q = toPx(PT, T[END[k]]);
      const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
      const d = { x: m.x - c.x, y: m.y - c.y };
      const l = Math.hypot(d.x, d.y);
      boxes[k] = label(ctx, k, m, { x: d.x / l, y: d.y / l }, shapes, { size: 42, alpha: al(k), gap: 10, fixed: true });
    }
  }
  return { shapes, boxes };
}

// The corner names. o: { alpha }.
export function cornerNames(ctx, shapes = [], o = {}) {
  const S = ['A', 'B', 'C'].map((k) => toPx(PT, T[k]));
  const cx = (S[0].x + S[1].x + S[2].x) / 3;
  const cy = (S[0].y + S[1].y + S[2].y) / 3;
  const out = {};
  ['A', 'B', 'C'].forEach((k, i) => {
    const d = { x: S[i].x - cx, y: S[i].y - cy };
    const l = Math.hypot(d.x, d.y);
    out[k] = label(ctx, k, S[i], { x: d.x / l, y: d.y / l }, shapes, { size: 38, alpha: o.alpha ?? 1, gap: 12 });
  });
  return out;
}

// The circle of directions: the unit circle with u/|u|, v/|v|, w/|w| on it.
// o: { alpha (circle), dots: { u, v, w } alphas, names }. Returns the stage points.
export function dirCircle(ctx, o = {}) {
  const Pc = o.P ?? PC;
  const O = toPx(Pc, v2(0, 0));
  const shapes = [unitCircle(ctx, Pc, { color: C.ink, lw: 2.5, alpha: o.alpha ?? 1 })];
  const pts = {};
  for (const k of ['u', 'v', 'w']) {
    pts[k] = toPx(Pc, DIR[k]);
    const a = o.dots?.[k] ?? 0;
    seg(ctx, O, pts[k], { color: C.muted, lw: 2, alpha: a * 0.8 });
    dot(ctx, pts[k], { r: 8, alpha: a });
  }
  if (o.names !== false) {
    for (const k of ['u', 'v', 'w']) {
      const a = o.dots?.[k] ?? 0;
      const d = DIR[k];
      label(ctx, String.raw`\frac{${k}}{|${k}|}`, pts[k], { x: -d.x, y: d.y }, [], { size: 30, alpha: a, gap: 4, fixed: true, from: 40 });
    }
  }
  return { O, pts, shapes };
}

// Turn i on the circle: the counterclockwise arc from one direction to the next, just outside
// the circle, with an arrowhead. o: { alpha, p, r (radius in units), lw, name }.
export function turnOnCircle(ctx, i, o = {}) {
  const tt = TURN[i];
  const a0 = dirOf(DIR[tt.from]);
  const th = theta(i);
  const Pc = o.P ?? PC;
  const r = (o.r ?? 1.12) * Pc.k;
  const O = toPx(Pc, v2(0, 0));
  const sh = arc(ctx, O, r, a0, a0 + th, { color: CORNER[tt.at], lw: o.lw ?? 5, head: 16, alpha: o.alpha ?? 1, p: o.p ?? 1 });
  if (o.name !== false) {
    const m = a0 + th / 2;
    label(ctx, String.raw`\theta_${i}`, { x: O.x + Math.cos(m) * r, y: O.y - Math.sin(m) * r }, { x: Math.cos(m), y: -Math.sin(m) }, [sh], {
      size: 34,
      color: CORNER[tt.at],
      alpha: o.alpha ?? 1,
      gap: 8,
      fixed: true,
    });
  }
  return sh;
}

// Turn i at its corner of the triangle: the incoming edge carried on past the corner (dashed),
// and the arc from that direction round to the outgoing edge. o: { alpha, r (px), ext (units) }.
export function turnAtCorner(ctx, i, o = {}) {
  const tt = TURN[i];
  const V = toPx(PT, T[tt.at]);
  const ext = o.ext ?? 0.75;
  const far = toPx(PT, add(T[tt.at], scale(DIR[tt.from], ext)));
  const a = o.alpha ?? 1;
  const s1 = seg(ctx, V, far, { color: C.muted, lw: 2.5, dash: [8, 7], alpha: a });
  const a0 = dirOf(DIR[tt.from]);
  const r = o.r ?? 58;
  const sh = arc(ctx, V, r, a0, a0 + theta(i), { color: CORNER[tt.at], lw: 4, head: 14, alpha: a, p: o.p ?? 1 });
  let box = null;
  if (o.name !== false) {
    const m = a0 + theta(i) / 2;
    box = label(ctx, String.raw`\theta_${i}`, V, { x: Math.cos(m), y: -Math.sin(m) }, [sh, s1, ...(o.avoid ?? [])], {
      size: 32,
      color: CORNER[tt.at],
      alpha: a,
      from: r,
      gap: 6,
      fixed: true,
    });
  }
  return { shapes: [s1, sh], box };
}

export { sub, dirOf };
