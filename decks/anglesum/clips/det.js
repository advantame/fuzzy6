// 2-2: the determinant. det(x, y) = x₁y₂ − x₂y₁; its absolute value is the area of the
// parallelogram x and y span (base |x| times height). To read its sign, turn the whole figure
// until x points along the positive x axis — a rotation keeps the determinant — and then
// det = |x| times the second component of y: positive when y is on the left of x's direction,
// negative on the right. Turning y once round (another view) traces |x||y| sin θ; with θ the
// rotation angle from x to y, the turned y is |y| E(θ), so det(x, y) = |x||y| sin θ.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp, clamp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { plane, toPx, v2, add, rot, len, det, dirOf, turn, grid, axes, arrow, seg, label, TAU } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const X_ = say('x', 'エックス');
const Y_ = say('y', 'ワイ');
const script = [
  { id: 'def', label: '行列式', text: `二つのベクトル ${X_} と ${Y_} の行列式を、{f}成分を掛けて引いた、この式で定めるわ。` },
  { id: 'area', label: '面積', text: `{abs}その絶対値は、{pg}${X_} と ${Y_} が張る平行四辺形の面積に等しいの。` },
  { id: 'turn', label: '回転する', text: `符号を見るために、\n{r}${X_} が ${X_} 軸の正の向きになるように、全体を回転する。` },
  { id: 'keep', label: '値は同じ', text: `{same}回転では、行列式の値は変わらないわ。` },
  { id: 'after', label: '第 2 成分', text: `回転したあとは、{xe}${X_} の第 2 成分が 0 になる。\n{prod}だから行列式は、${X_} の長さと、${Y_} の第 2 成分の積になるの。` },
  { id: 'sign', label: '左なら正', text: `だから、{left}${Y_} が ${X_} の向きの左側にあれば正、{right}右側にあれば[負|フ]よ。` },
  { id: 'spin', by: 'zunda', label: '一回り', tail: 0.4, text: `{go}${Y_} を ${X_} の向きから反時計回りに回すと、\n{pos}半周までは正、{neg}そこから一周までは[負|フ]なのだ。` },
  { id: 'sin', label: 'sin θ', text: `${X_} から ${Y_} への回転角を ${say('θ', 'シータ')} とすると、{ye}回転したあとの ${Y_} は、\n${Y_} の長さに ${say('E(θ)', 'イーシータ')} を掛けたもの。` },
  { id: 'sin2', label: '|x||y| sin θ', text: `{f2}だから行列式は、${X_} と ${Y_} の長さと、${say('sin θ', 'サインシータ')} の積になるわ。` },
];

const P = plane(400, 500, 200);
const VX = v2(1.5, 0.4);
const VY = v2(0.5, 1.2);
const PHI = dirOf(VX);
const TH0 = turn(VX, VY);
const LX = len(VX);
const LY = len(VY);
const X = 930;
// the graph of det against the angle from x to y
const G = { x0: 960, y0: 715, w: 540, h: 90 };
const gx = (th) => G.x0 + (th / TAU) * G.w;
const gy = (d) => G.y0 - (d / (LX * LY)) * G.h;

export default clip({
  id: 'det',
  title: '行列式',
  kicker: '証明 1',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(P, v2(0, 0));

    // turn: the whole figure is turned by −φ, so that x lies along the positive x axis
    const tr = inOutCubic(span(t, at('r') - 0.1, at('same') + 0.2));
    const ang = -PHI * tr;
    const x = rot(VX, ang);
    // spin: y goes once round, from the direction of x
    const spin = span(t, at('go'), at('spin.done'));
    const spinning = spin > 0 && spin < 1;
    const thNow = spinning ? TAU * inOutCubic(spin) : TH0;
    const back = spin >= 1 ? 1 : 0;
    const yBase = rot(VY, ang);
    const y = spinning ? rot(v2(LY, 0), thNow + dirOf(x)) : yBase;
    void back;

    grid(ctx, P, -1.6, 2.2, -1.6, 1.7, { alpha: k.in('def') });
    axes(ctx, P, -1.6, 2.2, -1.6, 1.7, { alpha: k.in('def') });

    // sign: the two half-planes either side of the line of x (after the turn, the x axis)
    const sIn = k.in('left');
    if (sIn > 0.001) {
      ctx.save();
      ctx.globalAlpha *= sIn * 0.45;
      ctx.fillStyle = '#e3ecff';
      ctx.fillRect(toPx(P, v2(-1.6, 0)).x, toPx(P, v2(0, 1.7)).y, P.k * 3.8, P.k * 1.7);
      ctx.restore();
      tex(ctx, R`\det > 0`, toPx(P, v2(-1.45, 1.35)).x, toPx(P, v2(0, 1.35)).y, { size: 34, color: C.A, alpha: sIn });
    }
    const rIn = k.in('right');
    if (rIn > 0.001) {
      ctx.save();
      ctx.globalAlpha *= rIn * 0.45;
      ctx.fillStyle = '#ffe3d6';
      ctx.fillRect(toPx(P, v2(-1.6, 0)).x, O.y, P.k * 3.8, P.k * 1.6);
      ctx.restore();
      tex(ctx, R`\det < 0`, toPx(P, v2(-1.45, -1.25)).x, toPx(P, v2(0, -1.25)).y, { size: 34, color: C.accent, alpha: rIn });
    }

    // area: the parallelogram x and y span, its base |x| and its height
    const pgIn = k.in('pg');
    const pts = [O, toPx(P, x), toPx(P, add(x, y)), toPx(P, y)];
    if (pgIn > 0.001) {
      ctx.save();
      ctx.globalAlpha *= pgIn;
      ctx.fillStyle = det(x, y) >= 0 ? '#d7e3ff' : '#ffd9c8';
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    // the height: from y's tip, perpendicular to the line of x
    const ux = v2(x.x / LX, x.y / LX);
    const foot = v2(ux.x * (y.x * ux.x + y.y * ux.y), ux.y * (y.x * ux.x + y.y * ux.y));
    const hIn = pgIn * (1 - tw(t, at('left'), 0.4));
    seg(ctx, toPx(P, foot), toPx(P, y), { color: C.ink2, lw: 2.5, dash: [7, 6], alpha: hIn });
    label(ctx, 'h', toPx(P, v2((foot.x + y.x) / 2, (foot.y + y.y) / 2)), { x: 1, y: 0 }, [], { size: 30, alpha: hIn, gap: 8, fixed: true, from: 4 });

    // the vectors, with their components while the definition is on
    const compIn = k.in('def') * (1 - tw(t, at('area'), 0.4));
    // x's components go along the x axis and then up; y's up the y axis and then across
    seg(ctx, O, toPx(P, v2(x.x, 0)), { color: C.x1, lw: 5, alpha: compIn });
    seg(ctx, toPx(P, v2(x.x, 0)), toPx(P, x), { color: C.x2, lw: 5, alpha: compIn });
    label(ctx, R`x_1`, toPx(P, v2(x.x / 2, 0)), { x: 0, y: 1 }, [], { size: 30, color: C.x1, alpha: compIn, gap: 8, fixed: true });
    label(ctx, R`x_2`, toPx(P, v2(x.x, x.y / 2)), { x: 1, y: 0 }, [], { size: 30, color: C.x2, alpha: compIn, gap: 8, fixed: true });
    seg(ctx, O, toPx(P, v2(0, y.y)), { color: C.x2, lw: 5, alpha: compIn });
    seg(ctx, toPx(P, v2(0, y.y)), toPx(P, y), { color: C.x1, lw: 5, alpha: compIn });
    label(ctx, R`y_2`, toPx(P, v2(0, y.y / 2)), { x: -1, y: 0 }, [], { size: 30, color: C.x2, alpha: compIn, gap: 8, fixed: true });
    label(ctx, R`y_1`, toPx(P, v2(y.x / 2, y.y)), { x: 0, y: -1 }, [], { size: 30, color: C.x1, alpha: compIn, gap: 8, fixed: true });
    const sx = arrow(ctx, O, toPx(P, x), { color: C.ink, lw: 5, alpha: k.in('def') });
    const sy = arrow(ctx, O, toPx(P, y), { color: C.ink, lw: 5, alpha: k.in('def') });
    label(ctx, 'x', toPx(P, x), { x: 0.6, y: 0.8 }, [sx, sy], { size: 38, alpha: k.in('def'), gap: 8 });
    label(ctx, 'y', toPx(P, y), { x: -0.5, y: -0.8 }, [sx, sy], { size: 38, alpha: k.in('def'), gap: 8 });

    // after: y's second component, the height above the line of x
    const y2In = k.in('prod') * (1 - tw(t, at('go'), 0.3)) + (spin >= 1 ? k.in('ye') : 0);
    seg(ctx, toPx(P, v2(y.x, 0)), toPx(P, y), { color: C.x2, lw: 6, alpha: clamp(y2In) });
    label(ctx, R`y_2`, toPx(P, v2(y.x, y.y / 2)), { x: 1, y: 0 }, [], { size: 30, color: C.x2, alpha: clamp(y2In), gap: 10, fixed: true });

    // the formulas
    const val = det(VX, VY);
    formulaBox(ctx, [{ src: R`\det(x, y) = \el{a}{x_1}\el{b}{y_2} - \el{c}{x_2}\el{d}{y_1}`, colors: { a: C.x1, d: C.x1, b: C.x2, c: C.x2 } }], X, 150, {
      size: 46,
      alpha: k.in('f'),
      title: '行列式',
    });
    formulaBox(ctx, R`|\det(x, y)| = |x|\,h = \text{平行四辺形の面積}`, X, 300, { size: 38, alpha: k.in('abs') * (1 - tw(t, at('sin'), 0.4)) });
    tex(ctx, R`\det(x, y) = ${det(x, y).toFixed(2)}`, X + 10, 400, { size: 36, color: C.ink2, alpha: k.in('abs') * (spinning ? 0.4 : 1) * (1 - tw(t, at('sin'), 0.4)) });
    tex(ctx, R`\det(Rx, Ry) = \det R\,\det(x, y) = \det(x, y)`, X + 10, 470, { size: 34, alpha: k.in('same') * (1 - tw(t, at('sin'), 0.4)) });
    tex(ctx, R`x = (|x|, 0)\ \Rightarrow\ \det(x, y) = |x|\,y_2`, X + 10, 540, { size: 36, alpha: k.in('xe') * (1 - tw(t, at('sin'), 0.4)) });
    void val;

    // spin: the graph of det as y goes round (another view)
    const gIn = k.in('go');
    if (gIn > 0.001) {
      arrow(ctx, { x: G.x0 - 10, y: G.y0 }, { x: G.x0 + G.w + 30, y: G.y0 }, { color: C.muted, lw: 2, head: 12, alpha: gIn });
      seg(ctx, { x: G.x0, y: G.y0 + G.h + 10 }, { x: G.x0, y: G.y0 - G.h - 20 }, { color: C.muted, lw: 2, alpha: gIn });
      for (const [th, s] of [[Math.PI, R`\pi`], [TAU, R`2\pi`]]) {
        seg(ctx, { x: gx(th), y: G.y0 - 6 }, { x: gx(th), y: G.y0 + 6 }, { color: C.muted, lw: 2, alpha: gIn });
        tex(ctx, s, gx(th), G.y0 + 36, { size: 26, color: C.muted, align: 'center', alpha: gIn });
      }
      tex(ctx, R`\theta`, G.x0 + G.w + 44, G.y0 + 10, { size: 28, color: C.muted, alpha: gIn });
      text(ctx, '行列式', G.x0 - 12, G.y0 - G.h - 30, { font: F.jp(700, 22), color: C.muted, alpha: gIn });
      const upto = spinning ? thNow : spin >= 1 ? TAU : 0;
      ctx.save();
      ctx.globalAlpha *= gIn;
      ctx.lineWidth = 4;
      for (let i = 0; i < 120; i++) {
        const a0 = (i / 120) * TAU;
        const a1 = ((i + 1) / 120) * TAU;
        if (a0 >= upto) break;
        const e = Math.min(a1, upto);
        ctx.strokeStyle = Math.sin((a0 + e) / 2) >= 0 ? C.A : C.accent;
        ctx.beginPath();
        ctx.moveTo(gx(a0), gy(LX * LY * Math.sin(a0)));
        ctx.lineTo(gx(e), gy(LX * LY * Math.sin(e)));
        ctx.stroke();
      }
      ctx.restore();
      tex(ctx, R`+`, gx(Math.PI / 2), gy(LX * LY) - 14, { size: 32, color: C.A, align: 'center', alpha: k.in('pos') });
      tex(ctx, R`-`, gx((3 * Math.PI) / 2), gy(-LX * LY) + 40, { size: 32, color: C.accent, align: 'center', alpha: k.in('neg') });
      // where y is now: its angle from x and the determinant there
      const cur = spinning ? thNow : TH0;
      if (spinning || spin >= 1) seg(ctx, { x: gx(cur), y: G.y0 }, { x: gx(cur), y: gy(LX * LY * Math.sin(cur)) }, { color: C.ink, lw: 2, dash: [4, 4], alpha: gIn });
    }

    // sin: y after the turn is |y| E(θ), so det = |x||y| sin θ
    const yeIn = k.in('ye');
    formulaBox(ctx, [R`y = |y|\,E(\theta) = |y|(\cos\theta,\ \sin\theta)`, { src: R`\det(x, y) = |x|\,|y|\sin\theta`, alpha: k.in('f2') }], X, 330, {
      size: 40,
      alpha: yeIn,
      parts: {},
      title: 'θ: x から y への回転角',
    });
    tex(ctx, R`\sin\theta:\ E(\theta)\ \text{の第 2 成分}`, X + 10, 480, { size: 30, color: C.ink2, alpha: k.in('ye', 1) });
  },
});
