// 2-3: the three determinants. "Counterclockwise" means C lies left of the direction from A to
// B: det(B − A, C − A) > 0. Writing v = (C − A) − (B − A) and using that the determinant is
// bilinear and vanishes on a repeated vector, det(u, v) = det(B − A, C − A) > 0. Substituting
// w = −u − v, det(v, w) and det(w, u) both expand to det(u, v). In the figure: the
// parallelogram u and v span from B has base |u| and the height of C over AB — the triangle's
// own base and height — so its area is twice the triangle's; the same holds at C and at A.

import { clip } from '../lib/clip.js';
import { C, CORNER, SOFT } from '../lib/theme.js';
import { tw } from '../../../src/kit/ease.js';
import { ringBox } from '../../../src/kit/cue.js';
import { plane, toPx, v2, add, sub, scale, unit, inner, arrow, seg, dot, label } from '../lib/geo.js';
import { tex, formulaBox, strike } from '../lib/math.js';
import { T, EDGE } from '../lib/proof1.js';
import { drawTri, names } from '../lib/tri.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const A_ = say('A', 'エー');
const B_ = say('B', 'ビー');
const C_ = say('C', 'シー');
const U_ = say('u', 'ユー');
const V_ = say('v', 'ブイ');
const W_ = say('w', 'ダブリュー');
const BA = say('B − A', 'ビーマイナスエー');
const CA = say('C − A', 'シーマイナスエー');
const script = [
  { id: 'ccw', label: '反時計回り', text: `${A_}、${B_}、${C_} が反時計回りに並ぶとは、\n{left}${C_} が、${A_} から ${B_} への向きの左側にあること。` },
  { id: 'ccwf', label: '式で', text: `{f}式で書くと、${BA} と ${CA} の行列式が、[正|セイ]になるわ。` },
  { id: 'vdec', label: 'v を分ける', text: `{v}${V_} は、${CA} から ${BA} を引いたベクトルと書けるの。` },
  { id: 'bil', label: '双線形', text: `行列式は{lin}双線形で、{zero}同じベクトルを二つ入れると 0 になる。` },
  { id: 'so', label: 'det(u, v) > 0', text: `{eq}だから、${U_} と ${V_} の行列式は、${BA} と ${CA} の行列式に等しく、{pos}正なの。` },
  { id: 'sub', label: 'w = −u − v', text: `次に、三つを足すと 0 だから、{w}${say('w ＝ −u − v', 'ダブリュー、イコール、マイナスユー、マイナスブイ')} を代入するわ。` },
  { id: 'exp', label: '展開する', text: `{e1}${V_} と ${W_} の行列式も、{e2}${W_} と ${U_} の行列式も、\n展開すると、{left2}${U_} と ${V_} の行列式だけが残るの。` },
  { id: 'q', by: 'zunda', label: '図では', text: '三つの行列式が等しいのは、{qq}図では、どう見えるのだ？' },
  { id: 'pg', label: 'B の平行四辺形', text: `{pb}${U_} と ${V_} の行列式は、${U_} と ${V_} を、どちらも ${B_} から描いて張った平行四辺形の面積。` },
  { id: 'bh', label: '底辺と高さ', text: `{base}底辺は ${U_} の長さ、{height}高さは、${C_} から直線 ${say('AB', 'エービー')} までの距離よ。` },
  { id: 'tri', label: '三角形の 2 倍', text: `{t}三角形 ${say('ABC', 'エービーシー')} も、底辺の長さが ${U_} の長さで、高さが同じ。\n{twice}だから、平行四辺形の面積は、三角形の面積の 2 倍になるの。` },
  { id: 'all', label: 'C でも A でも', text: `{pc}${C_} でも、{pa}${A_} でも、同じように張った\n平行四辺形の面積は、三角形の 2 倍。` },
  { id: 'agree', label: '合っている', text: `{ok}三つの行列式が等しいことと、合っているわ。` },
];

const P = plane(300, 450, 118);
const X = 905;
// the parallelogram at each corner: spanned by the incoming edge (carried on past the corner)
// and the outgoing edge
const SPAN = { B: ['u', 'v'], C: ['v', 'w'], A: ['w', 'u'] };

function pg(ctx, at, a, b, o) {
  const pts = [at, add(at, a), add(at, add(a, b)), add(at, b)].map((q) => toPx(P, q));
  if ((o.alpha ?? 1) <= 0.001) return pts;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  if (o.fill) {
    ctx.fillStyle = o.fill;
    ctx.fill();
  }
  ctx.strokeStyle = o.stroke ?? C.ink2;
  ctx.lineWidth = o.lw ?? 2;
  ctx.setLineDash(o.dash ?? []);
  ctx.stroke();
  ctx.restore();
  return pts;
}

export default clip({
  id: 'equal',
  title: '三つの行列式',
  kicker: '証明 1',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const early = 1 - tw(t, at('q'), 0.4);

    // ccw: the line AB and the half-plane to the left of A → B
    const lIn = k.in('left') * early;
    const dAB = unit(sub(T.B, T.A));
    const nAB = v2(-dAB.y, dAB.x);
    if (lIn > 0.001) {
      const far = 20;
      const q = [add(T.A, scale(dAB, -far)), add(T.A, scale(dAB, far)), add(add(T.A, scale(dAB, far)), scale(nAB, far)), add(add(T.A, scale(dAB, -far)), scale(nAB, far))].map((p) => toPx(P, p));
      ctx.save();
      ctx.globalAlpha *= lIn * 0.5;
      ctx.beginPath();
      q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = '#e3ecff';
      ctx.fill();
      ctx.restore();
      seg(ctx, toPx(P, add(T.A, scale(dAB, -2.2))), toPx(P, add(T.A, scale(dAB, 5.4))), { color: C.muted, lw: 2, dash: [8, 7], alpha: lIn });
      tex(ctx, R`\text{左側}`, toPx(P, add(T.A, scale(nAB, 2.0))).x - 30, toPx(P, add(T.A, scale(nAB, 2.0))).y, { size: 30, color: C.A, alpha: lIn });
    }

    const tri = drawTri(ctx, P, T, { alpha: k.in('ccw'), lw: 3.5 });
    dot(ctx, toPx(P, T.C), { r: 8, color: C.accent, alpha: k.lit(['left'], 'ccw.end').level[0] });

    // ccwf, vdec: B − A and C − A from A; v is their difference
    const vIn = k.in('v') * early;
    const sBA = arrow(ctx, toPx(P, T.A), toPx(P, T.B), { color: C.x1, lw: 4, alpha: vIn });
    const sCA = arrow(ctx, toPx(P, T.A), toPx(P, T.C), { color: C.x2, lw: 4, alpha: vIn });
    const sV = arrow(ctx, toPx(P, T.B), toPx(P, T.C), { color: C.ink, lw: 5, alpha: vIn });
    label(ctx, R`B-A`, toPx(P, add(T.A, scale(sub(T.B, T.A), 0.55))), { x: 0.3, y: 1 }, [sBA, sCA, sV, ...tri.shapes], { size: 28, color: C.x1, alpha: vIn, gap: 8 });
    label(ctx, R`C-A`, toPx(P, add(T.A, scale(sub(T.C, T.A), 0.5))), { x: -1, y: 0 }, [sBA, sCA, sV, ...tri.shapes], { size: 28, color: C.x2, alpha: vIn, gap: 8 });
    label(ctx, 'v', toPx(P, add(T.B, scale(EDGE.v, 0.5))), { x: 0.6, y: -0.8 }, [sBA, sCA, sV, ...tri.shapes], { size: 34, alpha: vIn, gap: 8 });

    // the algebra
    const fIn = k.in('f') * early;
    formulaBox(ctx, R`\det(B-A,\ C-A) > 0`, X, 120, { size: 40, alpha: fIn, title: '反時計回り' });
    tex(ctx, R`v = C - B = (C-A) - (B-A)`, X + 10, 245, { size: 38, alpha: k.in('v') * early });
    tex(ctx, R`\det(x, y+z) = \det(x,y)+\det(x,z),\quad \det(x, x) = 0`, X + 10, 315, { size: 30, alpha: k.in('lin') * early, alphas: {} });
    tex(ctx, R`\det(u, v) = \det\bigl(B-A,\ (C-A)-(B-A)\bigr)`, X + 10, 385, { size: 30, alpha: k.in('eq') * early });
    const so = tex(ctx, R`= \det(B-A,\ C-A) - \el{z}{\det(B-A,\ B-A)}`, X + 100, 432, { size: 30, alpha: k.in('eq', 1) * early });
    strike(ctx, so.parts.z, tw(t, at('eq') + 0.6, 0.4), { alpha: early });
    tex(ctx, R`= \det(B-A,\ C-A) > 0`, X + 100, 479, { size: 30, alpha: k.in('pos') * early, color: C.ink });

    // sub, exp: w = −u − v and the two expansions
    const wIn = k.in('w');
    tex(ctx, R`w = -u - v`, X + 10, 550, { size: 36, alpha: wIn * early });
    const e1 = tex(ctx, R`\det(v, w) = -\det(v, u) - \el{z}{\det(v, v)} = \det(u, v)`, X + 10, 610, { size: 30, alpha: k.in('e1') * early });
    const e2 = tex(ctx, R`\det(w, u) = -\el{z}{\det(u, u)} - \det(v, u) = \det(u, v)`, X + 10, 665, { size: 30, alpha: k.in('e2') * early });
    strike(ctx, e1.parts.z, tw(t, at('e1') + 0.6, 0.4), { alpha: early });
    strike(ctx, e2.parts.z, tw(t, at('e2') + 0.6, 0.4), { alpha: early });

    // the three results, kept
    const keep = k.in('left2');
    formulaBox(ctx, R`\det(u, v) = \det(v, w) = \det(w, u) > 0`, X, 760, { size: 36, alpha: keep });

    // q: the three parallelograms, outlined
    const qIn = k.in('qq');
    for (const c of ['B', 'C', 'A']) {
      const [a, b] = SPAN[c];
      pg(ctx, T[c], EDGE[a], EDGE[b], { alpha: qIn * 0.6, dash: [6, 6], stroke: CORNER[c] });
    }

    // pg: the one at B, filled; u carried on from B, and v
    const pB = k.in('pb');
    pg(ctx, T.B, EDGE.u, EDGE.v, { alpha: pB, fill: SOFT.B, stroke: CORNER.B, lw: 2.5 });
    const su = arrow(ctx, toPx(P, T.B), toPx(P, add(T.B, EDGE.u)), { color: C.ink, lw: 4, alpha: pB });
    const sv = arrow(ctx, toPx(P, T.B), toPx(P, T.C), { color: C.ink, lw: 4, alpha: pB });
    label(ctx, 'u', toPx(P, add(T.B, scale(EDGE.u, 0.5))), { x: 0.3, y: 1 }, [su, sv], { size: 32, alpha: pB, gap: 8, fixed: true });

    // tri: the triangle shares the base length and the height
    const tIn = k.in('t');
    if (tIn > 0.001) {
      ctx.save();
      ctx.globalAlpha *= tIn * 0.8;
      ctx.beginPath();
      [T.A, T.B, T.C].map((q) => toPx(P, q)).forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = '#efe7d6';
      ctx.fill();
      ctx.restore();
      drawTri(ctx, P, T, { alpha: 1, lw: 3.5 });
    }
    // bh: the base |u| and the height of C over the line AB
    const hFoot = add(T.A, scale(dAB, inner(sub(T.C, T.A), dAB)));
    const hIn = k.in('height');
    seg(ctx, toPx(P, T.C), toPx(P, hFoot), { color: C.accent, lw: 3, dash: [7, 6], alpha: hIn });
    label(ctx, 'h', toPx(P, add(hFoot, scale(sub(T.C, hFoot), 0.5))), { x: -1, y: 0 }, [], { size: 30, color: C.accent, alpha: hIn, gap: 8, fixed: true });
    // the base: the side of the parallelogram from B to B + u, and the triangle's AB
    const baseLv = k.lit(['base'], 'bh.end').level[0];
    const bB = toPx(P, T.B);
    const bBu = toPx(P, add(T.B, EDGE.u));
    ringBox(ctx, { x: Math.min(bB.x, bBu.x), y: Math.min(bB.y, bBu.y), w: Math.abs(bBu.x - bB.x), h: Math.abs(bBu.y - bB.y) }, baseLv, C.accent, 10);

    formulaBox(ctx, R`\text{平行四辺形} = |u|\,h = 2\times\triangle ABC`, X, 120, { size: 36, alpha: k.in('twice') * (1 - early) });

    // all: the parallelograms at C and A, each twice the triangle too
    const pC = k.in('pc');
    const pA = k.in('pa');
    pg(ctx, T.C, EDGE.v, EDGE.w, { alpha: pC, fill: SOFT.C, stroke: CORNER.C, lw: 2.5 });
    pg(ctx, T.A, EDGE.w, EDGE.u, { alpha: pA, fill: SOFT.A, stroke: CORNER.A, lw: 2.5 });
    if (pC > 0.001 || pA > 0.001) {
      ctx.save();
      ctx.globalAlpha *= Math.max(pC, pA) * 0.8;
      ctx.beginPath();
      [T.A, T.B, T.C].map((q) => toPx(P, q)).forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = '#efe7d6';
      ctx.fill();
      ctx.restore();
      drawTri(ctx, P, T, { alpha: 1, lw: 3.5 });
    }
    // the area of each, in its own colour
    const c2 = (corner, p, a) => {
      const [u1, v1] = SPAN[corner];
      const mid = add(T[corner], scale(add(EDGE[u1], EDGE[v1]), 0.5));
      const m = toPx(P, mid);
      tex(ctx, R`2\,\triangle ABC`, m.x, m.y + 10, { size: 26, color: CORNER[corner], align: 'center', alpha: a });
    };
    c2('B', null, k.in('twice'));
    c2('C', null, pC);
    c2('A', null, pA);
    names(ctx, P, T, { alpha: k.in('ccw'), size: 34 });
    const ag = k.lit(['ok'], k.fade('agree.end')).level[0];
    ringBox(ctx, { x: X - 20, y: 715, w: 650, h: 70 }, ag, C.accent, 4);
  },
});
