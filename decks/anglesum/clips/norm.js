// 1-1: the stage is R² with its inner product. The inner product is the sum of the products of
// components, drawn as the components themselves; the length is the square root of a vector's
// inner product with itself (Pythagoras' form, drawn as the right triangle). The unit circle is
// every point at length 1. Dividing a non-zero vector by its length keeps its direction and puts
// its tip on the unit circle: vectors of one direction land on one point, of another on another.

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, clamp, lerp } from '../../../src/kit/ease.js';
import { ringBox } from '../../../src/kit/cue.js';
import { plane, toPx, v2, scale, len, grid, axes, arrow, seg, dot, unitCircle, label } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';

const R = String.raw;
const script = [
  { id: 'ip', label: '内積', text: '舞台は、実数の組の平面 [R²|アールツー] よ。{a}二つのベクトルの内積を、{sum}成分どうしの積の和で定めるわ。' },
  { id: 'norm', label: '長さ', text: 'ベクトルの長さは、{self}自分自身との内積の平方根。{pyth}成分で書くと、三平方の定理と同じ形になるの。' },
  { id: 'circle', label: '単位円', text: '{pts}原点からの長さが 1 の点を、すべて集める。{name}この集合を、単位円 [S¹|エスワン] と呼ぶわ。' },
  { id: 'normalize', label: '長さで割る', text: '0 でないベクトルを、{div}その長さで割る。{one}向きはそのままで、長さが 1 になるの。' },
  { id: 'tip', by: 'zunda', label: '円の上の一点', text: '原点から描けば、その先端は、{pt}単位円の上の一点になるのだ。' },
  { id: 'same', label: '同じ向き', text: '{along}長さが違っても、向きが同じベクトルは、同じ点に移る。{diff}向きが違えば、違う点に移るわ。' },
  { id: 'dir', label: '向きは点', text: 'だから、ベクトルの向きは、{pts2}単位円の上の点で表せる。{here}角度は、この円の上で測るのよ。' },
];

const P = plane(430, 470, 220);
const A = v2(1.6, 1.2); // |a| = 2
const B = v2(-0.7, 1.3);
const X = 990; // the formulas' left edge

export default clip({
  id: 'norm',
  title: '長さと単位円',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(P, v2(0, 0));

    grid(ctx, P, -1.8, 2.3, -1.7, 1.9, { alpha: k.in('ip') });
    axes(ctx, P, -1.8, 2.3, -1.7, 1.9, { alpha: k.in('ip') });

    // ip: a and b with their components; the formula pairs the components up
    const showA = k.in('a');
    const fadeB = 1 - tw(t, at('norm'), 0.5) + tw(t, at('diff') - 0.3, 0.5);
    const comps = (v, name, alpha) => {
      const foot = toPx(P, v2(v.x, 0));
      const tip = toPx(P, v);
      const s1 = seg(ctx, O, foot, { color: C.x1, lw: 5, alpha });
      const s2 = seg(ctx, foot, tip, { color: C.x2, lw: 5, alpha });
      return [s1, s2, foot, tip];
    };
    const ca = comps(A, 'a', showA * (1 - tw(t, at('circle'), 0.5)));
    const cb = comps(B, 'b', showA * Math.min(1, fadeB) * (1 - tw(t, at('circle'), 0.5)));
    const shapes = [ca[0], ca[1], cb[0], cb[1]];

    // the vector a: from 'normalize' it shrinks to length 1 along its own ray
    const shrink = inOutCubic(span(t, at('div'), at('one')));
    const aLen = lerp(1, 0.5, shrink);
    const aShown = scale(A, aLen);
    const ghost = shrink > 0 ? 0.35 : 0;
    arrow(ctx, O, toPx(P, A), { color: C.ink, lw: 3, dash: [8, 8], alpha: ghost * showA });
    shapes.push(arrow(ctx, O, toPx(P, aShown), { color: C.ink, lw: 5, alpha: showA }));
    const bAlpha = showA * Math.min(1, fadeB);
    const bNorm = inOutCubic(span(t, at('diff'), at('diff') + 0.9));
    const bShown = scale(B, lerp(1, 1 / len(B), bNorm));
    shapes.push(arrow(ctx, O, toPx(P, bShown), { color: C.ink, lw: 5, alpha: bAlpha }));
    const la = label(ctx, R`a`, toPx(P, scale(aShown, 0.62)), { x: 0.6, y: 0.8 }, shapes, { size: 40, alpha: showA, fixed: true, gap: 10 });
    label(ctx, R`b`, toPx(P, scale(bShown, 0.6)), { x: -0.9, y: -0.4 }, shapes, { size: 40, alpha: bAlpha, fixed: true, gap: 10 });
    const compLabels = 1 - tw(t, at('circle'), 0.5);
    label(ctx, R`a_1`, toPx(P, v2(A.x / 2, 0)), { x: 0, y: 1 }, shapes, { size: 32, color: C.x1, alpha: showA * compLabels, fixed: true });
    label(ctx, R`a_2`, toPx(P, v2(A.x, A.y / 2)), { x: 1, y: 0 }, shapes, { size: 32, color: C.x2, alpha: showA * compLabels, fixed: true });
    label(ctx, R`b_1`, toPx(P, v2(B.x / 2, 0)), { x: 0, y: 1 }, shapes, { size: 32, color: C.x1, alpha: bAlpha * compLabels, fixed: true });
    label(ctx, R`b_2`, toPx(P, v2(B.x, B.y / 2)), { x: -1, y: 0 }, shapes, { size: 32, color: C.x2, alpha: bAlpha * compLabels, fixed: true });
    void la;

    const cols = { a1: C.x1, b1: C.x1, a2: C.x2, b2: C.x2 };
    formulaBox(ctx, [
      { src: R`\langle a, b\rangle = \el{a1}{a_1}\el{b1}{b_1} + \el{a2}{a_2}\el{b2}{b_2}`, colors: cols },
      { src: R`= (1.6)(-0.7) + (1.2)(1.3) = 0.44`, size: 34, alpha: k.in('sum', 1) * 0.9, colors: {} },
    ], X, 150, { size: 46, alpha: k.in('sum'), title: '内積' });

    // norm: the right triangle under a and its length
    const nIn = k.in('self');
    formulaBox(ctx, [
      { src: R`|a| = \sqrt{\langle a, a\rangle} = \sqrt{\el{a1}{a_1}^2+\el{a2}{a_2}^2}`, colors: cols },
      { src: R`= \sqrt{1.6^2+1.2^2} = 2`, size: 34, alpha: k.in('pyth', 1) },
    ], X, 380, { size: 46, alpha: nIn, title: '長さ' });
    const pyth = k.lit(['pyth'], 'norm.end').level[0];
    ringBox(ctx, [{ x: O.x, y: toPx(P, A).y, w: toPx(P, A).x - O.x, h: O.y - toPx(P, A).y }], pyth * (1 - shrink), C.accent, 8);

    // circle: every point at length 1
    const cIn = k.in('pts');
    unitCircle(ctx, P, { alpha: cIn, lw: 3, color: C.ink, p: tw(t, at('pts') - 0.15, 1.2) });
    for (const ang of [3.7, 5.3]) {
      const q = toPx(P, v2(Math.cos(ang), Math.sin(ang)));
      const sh = seg(ctx, O, q, { color: C.muted, lw: 2, alpha: cIn * (1 - tw(t, at('normalize'), 0.4)) });
      label(ctx, '1', toPx(P, v2(Math.cos(ang) * 0.55, Math.sin(ang) * 0.55)), { x: Math.sin(ang), y: Math.cos(ang) }, [sh], {
        size: 30,
        color: C.muted,
        alpha: cIn * (1 - tw(t, at('normalize'), 0.4)),
        fixed: true,
      });
    }
    formulaBox(ctx, R`S^1 = \{(x, y)\in\mathbf{R}^2 \mid x^2+y^2 = 1\}`, X, 610, { size: 38, alpha: k.in('name'), title: '単位円' });
    label(ctx, R`S^1`, toPx(P, v2(-0.78, -0.78)), { x: -0.7, y: 0.7 }, [], { size: 38, alpha: k.in('name'), fixed: true, gap: 4 });

    // normalize: a / |a| and its length
    const nz = k.in('div');
    tex(ctx, R`\frac{a}{|a|}`, X + 20, 800, { size: 46, alpha: nz * (1 - tw(t, at('same'), 0.4)) });
    tex(ctx, R`\left|\frac{a}{|a|}\right| = \frac{|a|}{|a|} = 1`, X + 120, 800, { size: 40, alpha: k.in('one') * (1 - tw(t, at('same'), 0.4)) });

    // tip: the end of a / |a| is a point of S¹
    const tipAt = toPx(P, scale(A, 0.5));
    const tipIn = tw(t, at('pt') - 0.15, 0.3);
    dot(ctx, tipAt, { r: 9, color: C.accent, alpha: tipIn });

    // same: shorter and longer vectors along a's ray, all sent to the same point
    const sIn = k.in('along');
    const send = inOutCubic(span(t, at('along') + 0.3, at('along') + 1.3));
    for (const [i, l0] of [0.25, 0.75].entries()) {
      const l = lerp(l0, 0.5, send);
      arrow(ctx, O, toPx(P, scale(A, l)), { color: C.ink2, lw: 4, alpha: sIn * (1 - tw(t, at('dir'), 0.5)) * (i === 0 ? 1 : 0.85) });
    }
    // diff: b goes to its own point
    const bPt = toPx(P, scale(B, 1 / len(B)));
    dot(ctx, bPt, { r: 9, color: C.accent, alpha: tw(t, at('diff') + 0.8, 0.3) });

    // dir: the two directions as two points; the circle is where angles are measured
    const here = k.lit(['here'], k.fade('dir.end')).level[0];
    if (here > 0.001) unitCircle(ctx, P, { color: C.accent, lw: 5, alpha: here * 0.8 });
    const pts = k.lit(['pts2'], k.fade('dir.end')).level[0];
    for (const p of [tipAt, bPt]) {
      if (pts > 0.001) {
        ctx.save();
        ctx.globalAlpha *= pts;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
    void clamp;
  },
});
