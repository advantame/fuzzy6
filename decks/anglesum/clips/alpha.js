// 3-5: α. α is the angle between B − A = (L, 0) and C − A = (p, h). (L, 0) points along (1, 0),
// the limit of q(t) as t grows; (p, h) points along q(p). So α = θ(p, ∞), the improper integral
// from p. The integrand is even — its graph is symmetric about the vertical axis — so with
// t = −s the integral from p to ∞ equals the one from −∞ to −p. On the circle (another view):
// α's arc reflected in the y axis, the same length.

import { clip } from '../lib/clip.js';
import { C, CORNER, SOFT } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp } from '../../../src/kit/ease.js';
import { toPx, v2, arrow, seg, dot, label } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';
import { PS, H, L, P, q, qAngle, tx, G, drawPlane, drawLine, drawGraph, area, seenArc, lineStretch } from '../lib/proof2.js';
import { cornerAngle, names, drawTri, TRI } from '../lib/tri.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const script = [
  { id: 'def', label: 'α は', text: `{a}${say('A', 'エー')} の角 ${say('α', 'アルファ')} は、{v1}${say('B − A ＝ (L, 0)', 'ビーマイナスエー、イコール、エルゼロ')} と、{v2}${say('C − A ＝ (p, h)', 'シーマイナスエー、イコール、ピーエイチ')} のなす角よ。` },
  { id: 'lim', label: '(1, 0) の向き', text: `{e1}${say('(L, 0)', 'エルゼロ')} の向きは ${say('(1, 0)', 'イチゼロ')}。\n{lm}これは、${say('t', 'ティー')} を大きくしたときの ${say('q(t)', 'キューティー')} の極限の向き。` },
  { id: 'qp', label: 'q(p)', text: `{qq}${say('(p, h)', 'ピーエイチ')} の向きは、${say('q(p)', 'キューピー')} よ。` },
  { id: 'integ', label: 'α = θ(p, ∞)', text: `{th}だから ${say('α ＝ θ(p, ∞)', 'アルファ、イコール、シータ、ピー、ムゲンダイ')}。{int}${say('p', 'ピー')} から無限大までの広義積分になるの。` },
  { id: 'even', label: '偶関数', text: `{ev}被積分関数は、${say('t', 'ティー')} を ${say('−t', 'マイナスティー')} に替えても同じ値をとる偶関数。\n{sym}グラフは縦軸について対称よ。` },
  { id: 'sub', label: '置き換え', text: `{s}${say('t ＝ −s', 'ティー、イコール、マイナスエス')} と置き換えると、{eq}${say('p', 'ピー')} から無限大までの積分は、\nマイナス無限大から ${say('−p', 'マイナスピー')} までの積分に等しくなるわ。` },
  { id: 'refl', by: 'zunda', label: '折り返し', text: `{r}単位円の上では、${say('α', 'アルファ')} の弧を、${say('y', 'ワイ')} 軸について折り返した弧なのだ。{keep}長さは変わらないのだ。` },
];

const BLUE_AREA = '#c4d3ff';

// a mirror about the vertical line x = cx, part way: 1 is as drawn, −1 reflected
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
  id: 'alpha',
  title: 'α',
  kicker: '証明 2',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(PS, v2(0, 0));
    drawPlane(ctx, { alpha: 1 });
    drawLine(ctx, { alpha: 1 });
    const tri = drawTri(ctx, PS, TRI, { alpha: 0.5, lw: 3 });
    names(ctx, PS, TRI, { alpha: 0.8, size: 32 });

    // def: α at A, between B − A and C − A
    const early = 1 - tw(t, at('th'), 0.5);
    cornerAngle(ctx, PS, TRI, 'A', { r: 60, alpha: k.in('a') * early, avoid: tri.shapes });
    arrow(ctx, O, toPx(PS, v2(L, 0)), { color: CORNER.A, lw: 5, alpha: k.in('v1') * early });
    arrow(ctx, O, toPx(PS, v2(P, H)), { color: CORNER.A, lw: 5, alpha: k.in('v2') * early });

    // lim: (1, 0), the limit of q(t) as t grows
    const lim = inOutCubic(span(t, at('lm'), at('lm') + 2.2));
    const lIn = k.in('lm') * (1 - tw(t, at('qq'), 0.4));
    const tt = lerp(P, 60, lim * lim);
    if (lIn > 0.001) {
      const Q = toPx(PS, q(tt));
      seg(ctx, O, { x: O.x + (Q.x - O.x) * 4.5, y: O.y + (Q.y - O.y) * 4.5 }, { color: C.ink2, lw: 2, alpha: lIn });
      dot(ctx, Q, { r: 9, color: C.accent, alpha: lIn });
    }
    dot(ctx, toPx(PS, v2(1, 0)), { r: 9, open: true, color: CORNER.A, alpha: k.in('e1') });
    label(ctx, R`(1, 0)`, toPx(PS, v2(1, 0)), { x: 0.6, y: 1 }, [], { size: 28, alpha: k.in('e1') });
    // qp: q(p)
    const qIn = k.in('qq');
    seg(ctx, O, toPx(PS, v2(P, H)), { color: C.ink2, lw: 2, alpha: qIn });
    dot(ctx, toPx(PS, q(P)), { r: 8, color: CORNER.A, alpha: qIn });
    label(ctx, R`q(p)`, toPx(PS, q(P)), { x: -1, y: -0.5 }, [], { size: 28, color: CORNER.A, alpha: qIn });

    // integ: the stretch [p, ∞), its arc, its area — all α
    const show = k.in('th');
    // refl: the stretch and the arc reflected in the y axis
    const flip = lerp(1, -1, inOutCubic(span(t, at('r'), at('r') + 1.4)));
    mirrored(ctx, O.x, flip, () => {
      lineStretch(ctx, P, Infinity, { color: CORNER.A, lw: 8, alpha: show });
      seenArc(ctx, P, Infinity, { color: CORNER.A, lw: 9, alpha: show });
    });
    if (flip < 0.999 && show > 0.001) {
      // the original, faint, while the copy turns over
      lineStretch(ctx, P, Infinity, { color: CORNER.A, lw: 4, alpha: 0.3 });
      seenArc(ctx, P, Infinity, { color: CORNER.A, lw: 4, alpha: 0.3 });
    }
    const gIn = k.in('int');
    drawGraph(ctx, { alpha: gIn });
    // sub: the area turned over the vertical axis onto (−∞, −p]
    const aflip = lerp(1, -1, inOutCubic(span(t, at('eq'), at('eq') + 1.4)));
    mirrored(ctx, tx(0), aflip, () => area(ctx, P, Infinity, { color: BLUE_AREA, alpha: gIn }));
    if (aflip < 0.999 && gIn > 0.001) area(ctx, P, Infinity, { color: BLUE_AREA, alpha: 0.35 });
    // even: the axis of symmetry
    const evIn = k.in('sym');
    seg(ctx, { x: tx(0), y: G.y0 + 10 }, { x: tx(0), y: G.y0 - 200 }, { color: C.accent, lw: 2.5, dash: [8, 6], alpha: evIn });
    for (const x of [P, -P]) {
      seg(ctx, { x: tx(x), y: G.y0 + 12 }, { x: tx(x), y: G.y0 - 12 }, { color: C.ink, lw: 2, alpha: k.in('s') });
      tex(ctx, x > 0 ? 'p' : R`-p`, tx(x), G.y0 + 34, { size: 26, align: 'center', alpha: k.in('s') });
    }

    // the formulas
    formulaBox(ctx, R`\alpha = \theta(p, \infty) = \int_p^{\infty} \frac{h}{t^2+h^2}\,dt`, 70, 335, { size: 36, alpha: k.in('th'), title: 'α' });
    tex(ctx, R`f(t) = \frac{h}{t^2+h^2},\quad f(-t) = f(t)`, 80, 455, { size: 32, alpha: k.in('ev') });
    formulaBox(ctx, R`\int_p^{\infty} f(t)\,dt = \int_{-\infty}^{-p} f(s)\,ds`, 70, 560, { size: 36, alpha: k.in('eq') });
    tex(ctx, R`(t = -s\ \text{と置き換える})`, 90, 650, { size: 28, color: C.ink2, alpha: k.in('s') });
    void SOFT;
    void qAngle;
  },
});
