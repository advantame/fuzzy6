// 3-2: q(t). For a real t, the point (t, h) moves along the line y = h; q(t) is that vector
// divided by its length — where the segment from the origin to (t, h) meets the unit circle.
// h > 0 puts q(t) on the upper half. As t increases q(t) moves clockwise, towards (1, 0) for
// large t and (−1, 0) for very negative t, never reaching either: t ↦ q(t) matches the real
// line one to one with the upper half circle without its ends.

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp, clamp } from '../../../src/kit/ease.js';
import { toPx, v2, dot, seg, wedge, label } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';
import { PS, H, q, qAngle, drawPlane, drawLine, ray } from '../lib/proof2.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const T_ = say('t', 'ティー');
const Q_ = say('q(t)', 'キューティー');
const script = [
  { id: 'pt', label: '点 (t, h)', text: `実数 ${T_} に対して、{p}点 ${say('(t, h)', 'ティーエイチ')} を考えるわ。\n{mv}${T_} を動かすと、この点は、直線 ${say('y ＝ h', 'ワイイコールエイチ')} の上を動くの。` },
  { id: 'qdef', label: 'q(t)', text: `{s}このベクトルを長さで割った単位ベクトルを、${Q_} とする。\n{x}原点と ${say('(t, h)', 'ティーエイチ')} を結ぶ線分が、単位円と交わる点よ。` },
  { id: 'up', label: '上半分', text: `{h}${say('h', 'エイチ')} は[正|セイ]だから、${Q_} の第 2 成分は[正|セイ]。{half}${Q_} は、単位円の上半分にあるわ。` },
  { id: 'run', label: '時計回り', text: `{inc}${T_} が増えると、${Q_} は時計回りに動く。\n{r}${T_} を大きくすると ${say('(1, 0)', 'イチゼロ')} に、{l}小さくすると ${say('(−1, 0)', 'マイナスイチゼロ')} に近づくの。` },
  { id: 'ends', by: 'zunda', label: '端には着かない', text: `でも、{e}${say('(1, 0)', 'イチゼロ')} と ${say('(−1, 0)', 'マイナスイチゼロ')} そのものには、着かないのだ。` },
  { id: 'bij', label: '一対一', text: `そう。{m}${T_} と ${Q_} は、実数全体と、両端を除いた上半円とを、\n一対一に対応させているわ。` },
];

export default clip({
  id: 'ray',
  title: '単位ベクトル q(t)',
  kicker: '証明 2',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(PS, v2(0, 0));
    drawPlane(ctx, { alpha: k.in('pt') });
    drawLine(ctx, { alpha: k.in('pt') });

    // up: the upper half of the circle
    const hIn = k.in('half');
    wedge(ctx, O, PS.k, 0, Math.PI, { color: '#e3ecff', alpha: hIn * 0.8 });

    // pt, run: the point (t, h) and the segment to it; q(t) on the circle
    // t: wavers while the voice says it moves, sweeps the line, runs off to the right, back
    // across to the far left, and returns
    const wob = Math.sin((t - at('mv')) * 1.4) * 1.6 * tw(t, at('mv'), 0.6) * (1 - tw(t, at('inc') - 0.6, 0.5));
    const sweep = inOutCubic(span(t, at('inc') - 0.1, at('inc') + 2.6));
    let tt = 1.2 + wob;
    if (t >= at('inc') - 0.6) tt = lerp(1.2, -4.2, inOutCubic(span(t, at('inc') - 0.6, at('inc') - 0.1)));
    if (t >= at('inc') - 0.1) tt = lerp(-4.2, 4.2, sweep);
    if (t >= at('r') - 0.1) tt = lerp(4.2, 40, inOutCubic(span(t, at('r') - 0.1, at('l') - 0.3)));
    if (t >= at('l') - 0.3) tt = lerp(40, -40, inOutCubic(span(t, at('l') - 0.3, at('l') + 1.4)));
    if (t >= at('e') + 0.6) tt = lerp(-40, 1.2, inOutCubic(span(t, at('e') + 0.6, at('e') + 1.6)));
    // the trace of q(t) over the sweep
    if (t >= at('inc') - 0.1 && t < at('r') + 0.4) {
      const end = t < at('r') - 0.1 ? tt : 4.2;
      const a0 = qAngle(-4.2);
      const a1 = qAngle(Math.min(end, 4.2));
      ctx.save();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 6;
      ctx.globalAlpha *= 0.8;
      ctx.beginPath();
      ctx.arc(O.x, O.y, PS.k, -a0, -a1, false);
      ctx.stroke();
      ctx.restore();
    }
    const showRay = k.in('p') * (t < at('bij') ? 1 : 1 - tw(t, at('bij'), 0.4));
    const visT = Math.max(-4.25, Math.min(4.25, tt));
    const r = ray(ctx, visT, { alpha: showRay, showQ: k.in('x') });
    // far out, the point is off the stage: the segment points towards it
    if (Math.abs(tt) > 4.25 && showRay > 0.001) {
      const Q = toPx(PS, q(tt));
      seg(ctx, O, { x: O.x + (Q.x - O.x) * 3.2, y: O.y + (Q.y - O.y) * 3.2 }, { color: C.ink2, lw: 2.5, alpha: showRay });
      dot(ctx, Q, { r: 8, color: C.accent, alpha: showRay });
    }
    label(ctx, R`(t, h)`, r.P, { x: 0.5, y: -1 }, [r.shape], { size: 30, alpha: showRay * (Math.abs(tt) < 4 ? 1 : 0), gap: 14, fixed: true });
    label(ctx, R`q(t)`, r.Q, { x: -0.6, y: 0.8 }, [r.shape], { size: 32, color: C.accent, alpha: showRay * k.in('x') * (Math.abs(tt) < 4 ? 1 : 0), gap: 10 });

    formulaBox(ctx, R`q(t) = \frac{(t,\ h)}{\sqrt{t^2+h^2}}`, 70, 590, { size: 42, alpha: k.in('s'), title: '単位ベクトル' });
    tex(ctx, R`h > 0\ \Rightarrow\ \frac{h}{\sqrt{t^2+h^2}} > 0`, 80, 750, { size: 34, alpha: k.in('h') });

    // ends: the two ends, open — never reached
    const eIn = k.in('r');
    dot(ctx, toPx(PS, v2(1, 0)), { r: 9, open: true, color: C.accent, alpha: eIn });
    dot(ctx, toPx(PS, v2(-1, 0)), { r: 9, open: true, color: C.accent, alpha: k.in('l') });
    const endLv = k.lit(['e'], 'ends.end').level[0];
    for (const x of [1, -1]) {
      const p = toPx(PS, v2(x, 0));
      if (endLv > 0.001) {
        ctx.save();
        ctx.globalAlpha *= endLv;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // bij: integer t matched with their points
    const mIn = k.in('m');
    for (let i = -3; i <= 3; i++) {
      const a = mIn * clamp(1 - Math.abs(i) * 0.05);
      const Pp = toPx(PS, v2(i, H));
      const Q = toPx(PS, q(i));
      seg(ctx, O, Pp, { color: C.ink2, lw: 1.5, alpha: a * 0.7 });
      dot(ctx, Pp, { r: 6, color: C.ink, alpha: a });
      dot(ctx, Q, { r: 7, color: C.accent, alpha: a });
    }
    formulaBox(ctx, R`t \in \mathbf{R}\ \longleftrightarrow\ q(t) \in \{(x, y)\in S^1 \mid y > 0\}`, 1000, 650, { size: 30, alpha: mIn, title: '一対一' });
  },
});
