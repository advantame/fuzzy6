// 3-4: the angle as an integral. For a < b, the directions (a, h) and (b, h) are the points
// q(a), q(b) of the upper half circle; the arc between them within the upper half is shorter
// than π, so it is the shorter arc and its length is the angle. As t runs from a to b, q(t)
// passes along that arc once, one way, so its length is the integral of the speed:
// θ(a, b) = ∫ₐᵇ h/(t² + h²) dt — the arc and the area under the graph are the same number
// (computed, shown side by side). With b → ∞ the far direction is the limit (1, 0) and the
// integral is improper.

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp } from '../../../src/kit/ease.js';
import { toPx, v2, seg, dot, arc, label } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';
import { PS, H, q, qAngle, theta, tx, drawPlane, drawLine, drawGraph, area, seenArc, lineStretch } from '../lib/proof2.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const A_ = say('a', 'エー');
const B_ = say('b', 'ビー');
const script = [
  { id: 'set', label: 'θ(a, b)', text: `{ab}${say('a ＜ b', 'エーがビーより小さい')} として、向き ${say('(a, h)', 'エーエイチ')} と ${say('(b, h)', 'ビーエイチ')} のなす角 ${say('θ(a, b)', 'シータエービー')} を求めるわ。` },
  { id: 'pts', label: 'q(a) と q(b)', text: `二つの向きの点は、{qa}${say('q(a)', 'キューエー')} と ${say('q(b)', 'キュービー')}。どちらも上半円にあるわ。` },
  { id: 'arcin', label: '上半円の弧', text: `{in}そのあいだの上半円の弧は、長さが ${say('π', 'パイ')} より短いの。` },
  { id: 'short', label: '短い方の弧', text: '{sh}だから、その弧が短い方の弧で、なす角は、その弧の長さよ。' },
  { id: 'once', label: '一度だけ通る', text: `{go}${say('t', 'ティー')} が ${A_} から ${B_} まで動くと、${say('q(t)', 'キューティー')} は、その弧を一方向に一度だけ通る。` },
  { id: 'int', label: '速さの積分', text: `{i}だから、弧の長さは、速さを ${A_} から ${B_} まで積分した値になるわ。` },
  { id: 'eq', label: '積分表示', text: `{f}${say('θ(a, b)', 'シータエービー')} は、${A_} から ${B_} までの、${say('h/(t² ＋ h²)', 'ティーニジョウタスエイチニジョウ、ブンノ、エイチ')} の積分よ。` },
  { id: 'area', by: 'zunda', label: '面積と等しい', text: `{ar}なす角が、速さのグラフの、${A_} から ${B_} までの面積に等しいのだ。` },
  { id: 'inf', label: 'b → ∞', text: `{bi}${B_} が無限大のときは、極限の向き ${say('(1, 0)', 'イチゼロ')} とのなす角になる。` },
  { id: 'imp', label: '広義積分', text: `{im}積分は、広義積分になるわ。\n${A_} がマイナス無限大のときも、同じよ。` },
];

const A0 = -1;
const B0 = 1.8;

export default clip({
  id: 'integral',
  title: '角の積分表示',
  kicker: '証明 2',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(PS, v2(0, 0));
    drawPlane(ctx, { alpha: 1 });
    drawLine(ctx, { alpha: 1 });

    // inf: b slides off to the right, out towards infinity
    const run = inOutCubic(span(t, at('bi') - 0.1, at('bi') + 2.2));
    const b = run <= 0 ? B0 : lerp(B0, 40, run * run);
    const bShown = Math.min(b, 4.3);

    // set: (a, h), (b, h) and the segments from the origin
    const sIn = k.in('ab');
    for (const [x, nm] of [[A0, 'a'], [bShown, 'b']]) {
      if (nm === 'b' && b > 4.3) continue;
      const p = toPx(PS, v2(x, H));
      seg(ctx, O, p, { color: C.ink2, lw: 2, alpha: sIn });
      dot(ctx, p, { r: 7, alpha: sIn });
      label(ctx, nm, p, { x: 0, y: 1 }, [], { size: 32, alpha: sIn * (nm === 'b' && b > 4.3 ? 0 : 1), gap: 16, fixed: true });
    }
    if (b > 4.3) {
      const Q = toPx(PS, q(b));
      seg(ctx, O, { x: O.x + (Q.x - O.x) * 4, y: O.y + (Q.y - O.y) * 4 }, { color: C.ink2, lw: 2, alpha: sIn });
    }
    lineStretch(ctx, A0, b > 4.3 ? Infinity : b, { color: '#ffb999', lw: 8, alpha: k.in('go') * 0.9 });

    // pts: q(a), q(b); the arc between them in the upper half (< π), the other way dashed
    const pIn = k.in('qa');
    const inIn = k.in('in');
    arc(ctx, O, PS.k, qAngle(b), qAngle(A0) - 2 * Math.PI, { color: C.ink2, lw: 3, dash: [8, 8], alpha: inIn * 0.7 * (1 - tw(t, at('go'), 0.4)) });
    const full = seenArc(ctx, A0, b, { color: C.accent, lw: 8, alpha: inIn });
    dot(ctx, toPx(PS, q(A0)), { r: 8, alpha: pIn });
    dot(ctx, toPx(PS, q(b)), { r: 8, alpha: pIn });
    label(ctx, R`q(a)`, toPx(PS, q(A0)), { x: -1, y: -0.3 }, [full], { size: 30, alpha: pIn, gap: 10, fixed: true });
    label(ctx, R`q(b)`, toPx(PS, q(bShown)), { x: 1, y: -0.2 }, [full], { size: 30, alpha: pIn * (b > 4.3 ? 0 : 1), gap: 10, fixed: true });
    const mid = (qAngle(A0) + qAngle(b)) / 2;
    label(ctx, R`\theta(a, b)`, toPx(PS, v2(Math.cos(mid), Math.sin(mid))), { x: Math.cos(mid), y: -Math.sin(mid) }, [full], {
      size: 34,
      color: C.accent,
      alpha: k.in('sh'),
      gap: 10,
      fixed: true,
    });
    tex(ctx, R`\text{上半円の中の弧} < \pi`, 1120, 330, { size: 32, alpha: inIn * (1 - tw(t, at('f'), 0.4)) });

    // once: q(t) runs from q(a) to q(b) as t runs from a to b; the area fills in step
    const go = inOutCubic(span(t, at('go'), at('go') + 2.4));
    const tt = lerp(A0, B0, go);
    const gIn = k.in('go');
    drawGraph(ctx, { alpha: gIn });
    area(ctx, A0, run > 0 ? (b > 4.3 ? Infinity : b) : tt, { color: '#ffb999', alpha: gIn });
    if (go > 0 && go < 1) {
      dot(ctx, toPx(PS, q(tt)), { r: 10, color: C.accent, alpha: gIn });
      dot(ctx, toPx(PS, v2(tt, H)), { r: 8, color: C.accent, alpha: gIn });
    }

    // int, eq: the formula
    formulaBox(ctx, R`\theta(a, b) = \int_a^b \frac{h}{t^2+h^2}\,dt`, 70, 330, { size: 42, alpha: k.in('i'), title: '角の積分表示' });

    // area: the same number, as an arc and as an area
    const arIn = k.in('ar');
    const val = theta(A0, b);
    tex(ctx, R`\text{弧の長さ} = ${val.toFixed(4)}`, 1120, 300, { size: 32, color: C.accent, alpha: arIn });
    tex(ctx, R`\text{面積} = ${val.toFixed(4)}`, tx(-0.4), 790, { size: 30, color: '#c2410c', alpha: arIn, align: 'center' });

    // inf, imp: the far end is the limit (1, 0); the integral to ∞
    dot(ctx, toPx(PS, v2(1, 0)), { r: 9, open: true, color: C.accent, alpha: k.in('bi') });
    formulaBox(ctx, [R`\theta(a, \infty) = \int_a^{\infty} \frac{h}{t^2+h^2}\,dt`, R`\qquad\ \ = \lim_{b\to\infty}\int_a^{b} \frac{h}{t^2+h^2}\,dt`], 70, 520, { size: 32, alpha: k.in('im'), title: '広義積分' });
  },
});
