// 3-6: β. β is the angle between A − B = (−L, 0) and C − B = (p − L, h). The angle between two
// vectors depends on the vectors alone, so both are drawn again from the origin. (−L, 0) points
// along (−1, 0), the limit of q(t) as t goes down; (p − L, h) along q(p − L). So
// β = θ(−∞, p − L), and by evenness the integral from L − p to ∞. On the circle α's arc sits at
// the left end, β's at the right.

import { clip } from '../lib/clip.js';
import { C, CORNER } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp } from '../../../src/kit/ease.js';
import { toPx, v2, arrow, seg, dot, label, wedge, arc, dirOf } from '../lib/geo.js';
import { formulaBox } from '../lib/math.js';
import { PS, H, L, P, q, tx, drawPlane, drawLine, drawGraph, area, seenArc, lineStretch } from '../lib/proof2.js';
import { names, drawTri, TRI } from '../lib/tri.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const PL = say('p − L', 'ピーマイナスエル');
const script = [
  { id: 'def', label: 'β は', text: `{b}${say('B', 'ビー')} の角 ${say('β', 'ベータ')} は、{v1}${say('A − B ＝ (−L, 0)', 'エーマイナスビー、イコール、マイナスエル、ゼロ')} と、\n{v2}${say('C − B ＝ (p − L, h)', 'シーマイナスビー、イコール、ピーマイナスエル、エイチ')} のなす角よ。` },
  { id: 'move', lead: 0.2, label: '原点から', text: 'なす角は、二つのベクトルだけで決まる。\n{mv}だから、二つを原点から描き直して測るわ。' },
  { id: 'lim', label: '(−1, 0) の向き', text: `{e}${say('(−L, 0)', 'マイナスエル、ゼロ')} の向きは、${say('t', 'ティー')} を小さくしたときの ${say('q(t)', 'キューティー')} の極限の向き。` },
  { id: 'qq', label: 'q(p − L)', text: `{q}${say('(p − L, h)', 'ピーマイナスエル、エイチ')} の向きは、${say('q(p − L)', 'キュー、ピーマイナスエル')} よ。` },
  { id: 'integ', label: 'β = θ(−∞, p − L)', text: `{th}だから ${say('β ＝ θ(−∞, p − L)', 'ベータ、イコール、シータ、マイナスムゲンダイ、ピーマイナスエル')}。\n{int}マイナス無限大から ${PL} までの広義積分になるの。` },
  { id: 'even', label: '折り返す', text: `{ev}偶関数だから、これは、{eq}${say('L − p', 'エルマイナスピー')} から無限大までの積分に等しいわ。` },
  { id: 'ends', by: 'zunda', label: '左の端と右の端', text: `単位円の上では、{al}${say('α', 'アルファ')} の弧が左の端に、\n{be}${say('β', 'ベータ')} の弧が右の端にあるのだ。` },
];

const GREEN_AREA = '#bfe6cf';
const BLUE_AREA = '#c4d3ff';

function mirrored(ctx, cx, k, fn) {
  if (Math.abs(k) < 0.002) return;
  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(k, 1);
  ctx.translate(-cx, 0);
  fn();
  ctx.restore();
}

export default clip({
  id: 'beta',
  title: 'β',
  kicker: '証明 2',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(PS, v2(0, 0));
    drawPlane(ctx, { alpha: 1 });
    drawLine(ctx, { alpha: 1 });
    drawTri(ctx, PS, TRI, { alpha: 0.5, lw: 3 });
    names(ctx, PS, TRI, { alpha: 0.8, size: 32 });

    // def, move: β at B between A − B and C − B; both carried to the origin
    const mv = inOutCubic(span(t, at('mv'), at('mv') + 1.3));
    const base = { x: lerp(toPx(PS, v2(L, 0)).x, O.x, mv), y: O.y };
    const dA = v2(-L, 0);
    const dC = v2(P - L, H);
    const keep = 1 - tw(t, at('th'), 0.5);
    const bIn = k.in('b') * keep;
    const a0 = dirOf(dC);
    const a1 = dirOf(dA);
    wedge(ctx, base, 56, a0, a1, { color: '#d3efdd', alpha: bIn });
    const bArc = arc(ctx, base, 56, a0, a1, { color: CORNER.B, lw: 3, alpha: bIn });
    label(ctx, R`\beta`, base, { x: Math.cos((a0 + a1) / 2), y: -Math.sin((a0 + a1) / 2) }, [bArc], { size: 32, color: CORNER.B, alpha: bIn, from: 56, gap: 4, fixed: true });
    const toPxFrom = (b, d) => ({ x: b.x + d.x * PS.k, y: b.y - d.y * PS.k });
    arrow(ctx, base, toPxFrom(base, dA), { color: CORNER.B, lw: 5, alpha: k.in('v1') * keep });
    arrow(ctx, base, toPxFrom(base, dC), { color: CORNER.B, lw: 5, alpha: k.in('v2') * keep });

    // lim: (−1, 0), the limit of q(t) as t goes down
    const lim = inOutCubic(span(t, at('e'), at('e') + 2.2));
    const lIn = k.in('e') * (1 - tw(t, at('q'), 0.4));
    const tt = lerp(P - L, -60, lim * lim);
    if (lIn > 0.001) {
      const Q = toPx(PS, q(tt));
      seg(ctx, O, { x: O.x + (Q.x - O.x) * 4.5, y: O.y + (Q.y - O.y) * 4.5 }, { color: C.ink2, lw: 2, alpha: lIn });
      dot(ctx, Q, { r: 9, color: C.accent, alpha: lIn });
    }
    dot(ctx, toPx(PS, v2(-1, 0)), { r: 9, open: true, color: CORNER.B, alpha: k.in('e') });
    label(ctx, R`(-1, 0)`, toPx(PS, v2(-1, 0)), { x: -0.6, y: 1 }, [], { size: 28, alpha: k.in('e') });
    // qq: q(p − L)
    const qIn = k.in('q');
    seg(ctx, O, toPx(PS, v2(P - L, H)), { color: C.ink2, lw: 2, alpha: qIn });
    dot(ctx, toPx(PS, q(P - L)), { r: 8, color: CORNER.B, alpha: qIn });
    label(ctx, R`q(p-L)`, toPx(PS, q(P - L)), { x: -1, y: -0.3 }, [], { size: 28, color: CORNER.B, alpha: qIn });

    // integ, even: the stretch (−∞, p − L], its arc and area; then turned over to [L − p, ∞)
    const show = k.in('th');
    const flip = lerp(1, -1, inOutCubic(span(t, at('eq'), at('eq') + 1.4)));
    mirrored(ctx, O.x, flip, () => {
      lineStretch(ctx, -Infinity, P - L, { color: CORNER.B, lw: 8, alpha: show });
      seenArc(ctx, -Infinity, P - L, { color: CORNER.B, lw: 9, alpha: show });
    });
    if (flip < 0.999 && show > 0.001) {
      lineStretch(ctx, -Infinity, P - L, { color: CORNER.B, lw: 4, alpha: 0.3 });
      seenArc(ctx, -Infinity, P - L, { color: CORNER.B, lw: 4, alpha: 0.3 });
    }
    const gIn = k.in('int');
    drawGraph(ctx, { alpha: gIn });
    mirrored(ctx, tx(0), flip, () => area(ctx, -Infinity, P - L, { color: GREEN_AREA, alpha: gIn }));
    if (flip < 0.999 && gIn > 0.001) area(ctx, -Infinity, P - L, { color: GREEN_AREA, alpha: 0.35 });

    // ends: α's stretch at the left end too (from 3-5), so the two ends are side by side
    const aIn = k.in('al');
    lineStretch(ctx, -Infinity, -P, { color: CORNER.A, lw: 8, alpha: aIn });
    seenArc(ctx, -Infinity, -P, { color: CORNER.A, lw: 9, alpha: aIn });
    area(ctx, -Infinity, -P, { color: BLUE_AREA, alpha: aIn });
    const be = k.lit(['be'], k.fade('ends.end')).level[0];
    if (be > 0.001) seenArc(ctx, L - P, Infinity, { color: C.accent, lw: 4, alpha: be, r: 1.08 });

    // the formulas
    formulaBox(ctx, R`\beta = \theta(-\infty,\ p-L) = \int_{-\infty}^{p-L} \frac{h}{t^2+h^2}\,dt`, 70, 105, { size: 32, alpha: k.in('th'), title: 'β' });
    formulaBox(ctx, R`\int_{-\infty}^{p-L} f(t)\,dt = \int_{L-p}^{\infty} f(s)\,ds\quad(t = -s)`, 760, 105, { size: 32, alpha: k.in('eq') });
  },
});
