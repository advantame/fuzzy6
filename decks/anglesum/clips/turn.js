// 2-4: the rotation angles θ₁ (u to v), θ₂ (v to w), θ₃ (w to u). On the unit circle θ₁ is the
// counterclockwise arc from u's point to v's; on the triangle, the angle at B from u carried on
// past B round to v — the same arc, drawn on a unit circle centred at B at the same scale.
// det(u, v) = |u||v| sin θ₁ is positive, so sin θ₁ > 0 and 0 < θ₁ < π; likewise θ₂ and θ₃:
// on the circle, each next point lies within the half turn after the one before.

import { clip } from '../lib/clip.js';
import { C, CORNER, SOFT } from '../lib/theme.js';
import { tw } from '../../../src/kit/ease.js';
import { toPx, v2, add, dirOf, arc, seg, dot, wedge, label } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';
import { T, PT, PC, DIR, TURN, theta, edgeArrows, cornerNames, dirCircle, turnOnCircle, turnAtCorner } from '../lib/proof1.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const U_ = say('u', 'ユー');
const V_ = say('v', 'ブイ');
const W_ = say('w', 'ダブリュー');
const T1 = say('θ₁', 'シータイチ');
const T2 = say('θ₂', 'シータニ');
const T3 = say('θ₃', 'シータサン');
const script = [
  { id: 'def', label: 'θ₁, θ₂, θ₃', text: `${U_} から ${V_}、${V_} から ${W_}、${W_} から ${U_} への、\n反時計回りの回転角を、{t1}${T1}、{t2}${T2}、{t3}${T3} とするわ。` },
  { id: 'circ', label: '単位円の上で', text: `単位円の上では、{c}${T1} は、${U_} の向きの点から ${V_} の向きの点まで、\n反時計回りに進む弧の長さよ。` },
  { id: 'tri', label: '三角形の上で', text: `三角形の上では、{at}${T1} は、${say('B', 'ビー')} で、{ext}${U_} を延ばした向きから、{to}${V_} の向きまでの角になるの。` },
  { id: 'sinpos', label: 'sin θ₁ > 0', text: `{f}${U_} と ${V_} の行列式は、${U_} と ${V_} の長さと、${say('sin θ₁', 'サインシータイチ')} の積。\n{pos}行列式は正だから、${say('sin θ₁', 'サインシータイチ')} も[正|セイ]になる。` },
  { id: 'range', label: '0 < θ₁ < π', text: `{r}だから ${T1} は、0 と ${say('π', 'パイ')} のあいだにあるわ。` },
  { id: 'all', label: '三つとも', text: `{a}${T2} と ${T3} も同じ。三つとも、0 より大きく、${say('π', 'パイ')} より小さいの。` },
  { id: 'half', by: 'zunda', label: '半周より手前', text: `単位円の上では、{h}${V_} の向きの点は、${U_} の向きの点から、\n半周より手前にあるのだ。{others}ほかの二つも同じなのだ。` },
];

const FX = 120;

export default clip({
  id: 'turn',
  title: '回転角 θ',
  kicker: '証明 1',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;

    // half: the half turn after u's point, shaded; v's point lies inside; then the other two
    const O = toPx(PC, v2(0, 0));
    const halves = [
      ['u', 'B', k.in('h') * (1 - tw(t, at('others'), 0.4))],
      ['v', 'C', k.in('others') * (1 - tw(t, k.fade('half.end') - 0.6, 0.4))],
      ['w', 'A', k.in('others', 3) * (1 - tw(t, k.fade('half.end') - 0.6, 0.4))],
    ];
    for (const [d, c, a] of halves) {
      if (a <= 0.001) continue;
      const s = dirOf(DIR[d]);
      wedge(ctx, O, PC.k * 0.96, s, s + Math.PI, { color: SOFT[c], alpha: a * 0.85 });
      seg(ctx, O, toPx(PC, DIR[d]), { color: CORNER[c], lw: 2, alpha: a });
      seg(ctx, O, toPx(PC, { x: -DIR[d].x, y: -DIR[d].y }), { color: CORNER[c], lw: 2, dash: [6, 6], alpha: a });
    }
    // the two figures
    const ea = edgeArrows(ctx, { alpha: 1, lw: 4 });
    cornerNames(ctx, ea.shapes, { alpha: 1 });
    dirCircle(ctx, { alpha: 1, dots: { u: 1, v: 1, w: 1 } });

    // def: the three arcs on the circle, in the colours of B, C, A
    const lit = k.lit(['c'], 'tri.end').level[0];
    for (const i of [1, 2, 3]) {
      const dim = i === 1 ? 1 : 1 - lit * 0.6;
      turnOnCircle(ctx, i, { alpha: k.in(`t${i}`) * dim, p: tw(t, at(`t${i}`) - 0.15, 0.6), lw: i === 1 ? 5 + 3 * lit : 5 });
    }

    // tri: θ₁ at B — u carried on past B, the unit circle around B at the triangle's scale (the
    // same as the circle's), and the arc from u's direction to v's on it
    const B = toPx(PT, T.B);
    const tIn = k.in('at');
    arc(ctx, B, PT.k, 0, Math.PI * 2, { color: C.muted, lw: 1.5, dash: [5, 6], alpha: tIn * 0.8 });
    const extIn = k.in('ext');
    seg(ctx, B, toPx(PT, add(T.B, DIR.u)), { color: C.muted, lw: 3, dash: [9, 7], alpha: extIn });
    dot(ctx, toPx(PT, add(T.B, DIR.u)), { r: 6, alpha: extIn });
    dot(ctx, toPx(PT, add(T.B, DIR.v)), { r: 6, alpha: k.in('to') });
    const a0 = dirOf(DIR.u);
    const sh = arc(ctx, B, PT.k, a0, a0 + theta(1), { color: CORNER.B, lw: 6, head: 16, alpha: k.in('to'), p: tw(t, at('to') - 0.15, 0.6) });
    label(ctx, R`\theta_1`, { x: B.x + Math.cos(a0 + theta(1) / 2) * PT.k, y: B.y - Math.sin(a0 + theta(1) / 2) * PT.k }, { x: Math.cos(a0 + theta(1) / 2), y: -Math.sin(a0 + theta(1) / 2) }, [sh], {
      size: 34,
      color: CORNER.B,
      alpha: k.in('to'),
      gap: 8,
      fixed: true,
    });

    // sinpos, range: the determinant and the sine
    formulaBox(ctx, R`\det(u, v) = |u|\,|v|\sin\theta_1`, FX, 815, { size: 40, alpha: k.in('f') });
    tex(ctx, R`> 0\ \Rightarrow\ \sin\theta_1 > 0`, FX + 520, 815, { size: 40, alpha: k.in('pos') });
    formulaBox(ctx, R`0 < \theta_1 < \pi`, FX + 980, 815, { size: 40, alpha: k.in('r') * (1 - tw(t, at('a'), 0.3)) });
    formulaBox(ctx, R`0 < \theta_1,\ \theta_2,\ \theta_3 < \pi`, FX + 980, 815, { size: 40, alpha: k.in('a') });

    // all: the turns at C and at A, on the triangle
    turnAtCorner(ctx, 2, { alpha: k.in('a'), r: 54, ext: 0.55 });
    turnAtCorner(ctx, 3, { alpha: k.in('a', 1), r: 54, ext: 0.55 });

    void TURN;
  },
});
