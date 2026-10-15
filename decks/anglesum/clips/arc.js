// 1-2: the length of an arc of the unit circle. An arc is the path of a point γ(s); its length is
// the integral of the speed |γ′(s)| over the parameter. Inscribed polygons, refined, come to the
// same number (computed here, not drawn by eye). The whole circle's length is written 2π — the
// definition of π. Reflections in the axes keep lengths, so the four quarter arcs are equal:
// half the circle is π, a quarter π/2.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, clamp, lerp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { plane, toPx, v2, E, axes, arrow, dot, unitCircle, unitArc, label, TAU } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';

const R = String.raw;
const script = [
  { id: 'curve', label: '弧', text: '単位円の弧の長さを定めるわ。{arc}弧を、パラメータ [s|エス] で動く点 [γ(s)|ガンマエス] が{g}通る曲線として表すの。' },
  { id: 'len', label: '速さの積分', text: '曲線の長さは、{vel}速度ベクトルの長さを、{int}[s|エス] について端から端まで積分した値よ。' },
  { id: 'poly', label: '折れ線', text: '同じ弧を、{p4}折れ線で近似してみるわ。' },
  { id: 'refine', label: '分点を増やす', text: '{more}分点を増やしていくと、折れ線の長さは、\n{lim}この積分の値に近づくの。' },
  { id: 'pi', label: 'π の定義', text: '{full}単位円の一周の長さを、{two}[2π|ニパイ] と書く。{def}これが、[π|パイ] の定義よ。' },
  { id: 'sym', label: '四つの弧', text: '{fold}座標軸についての折り返しは、弧の長さを変えない。\n{four}だから単位円は、長さの等しい四つの弧に分かれるわ。' },
  { id: 'half', label: '半周は π', text: '{h}半周の長さは [π|パイ]、{q}[四分の一周|ヨンブンノイッシュウ]の長さは [π/2|ニブンノパイ] になるの。' },
];

const P = plane(430, 470, 220);
const S0 = (30 * Math.PI) / 180;
const S1 = (140 * Math.PI) / 180;
const X = 990;
const chordSum = (n) => n * 2 * Math.sin((S1 - S0) / (2 * n));

export default clip({
  id: 'arc',
  title: '弧の長さ',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(P, v2(0, 0));
    axes(ctx, P, -1.6, 1.7, -1.6, 1.6, { alpha: k.in('curve') });
    unitCircle(ctx, P, { alpha: k.in('curve') * 0.6 });

    // the arc PQ and the point γ(s) running along it
    const gone = 1 - tw(t, at('pi'), 0.5);
    const arcIn = k.in('arc');
    const sh = unitArc(ctx, P, S0, S1, { color: C.ink, lw: 6, alpha: arcIn * gone, p: tw(t, at('arc') - 0.1, 0.8) });
    dot(ctx, toPx(P, E(S0)), { alpha: arcIn * gone });
    dot(ctx, toPx(P, E(S1)), { alpha: arcIn * gone });
    label(ctx, R`\gamma(s_0)`, toPx(P, E(S0)), { x: 1, y: 0.2 }, [sh], { size: 32, alpha: arcIn * gone, gap: 10 });
    label(ctx, R`\gamma(s_1)`, toPx(P, E(S1)), { x: -1, y: -0.2 }, [sh], { size: 32, alpha: arcIn * gone, gap: 10 });
    const run = clamp((t - at('g')) / 3.2);
    const settle = 0.42;
    const s = lerp(S0, S1, tw(t, at('vel') - 0.6, 0.6) > 0 ? lerp(run % 1, settle, tw(t, at('vel') - 0.6, 0.6)) : run % 1);
    const gIn = k.in('g') * (1 - tw(t, at('poly'), 0.4));
    const g = toPx(P, E(s));
    dot(ctx, g, { r: 9, color: C.accent, alpha: gIn });
    label(ctx, R`\gamma(s)`, g, { x: Math.cos(s), y: -Math.sin(s) }, [sh], { size: 34, color: C.accent, alpha: gIn, gap: 14, fixed: true });

    // len: the velocity at γ(s) — tangent, of length |γ′(s)| = 1 unit, drawn to scale
    const vIn = k.in('vel') * (1 - tw(t, at('poly'), 0.4));
    const tip = toPx(P, v2(Math.cos(s) - Math.sin(s), Math.sin(s) + Math.cos(s)));
    const vs = arrow(ctx, g, tip, { color: C.accent, lw: 4, alpha: vIn });
    label(ctx, R`\gamma'(s)`, tip, { x: -0.4, y: -1 }, [vs, sh], { size: 32, color: C.accent, alpha: vIn, gap: 8 });
    formulaBox(ctx, R`L = \int_{s_0}^{s_1} |\gamma'(s)|\,ds`, X, 170, { size: 48, alpha: k.in('int'), title: '弧の長さ' });

    // poly: inscribed polygons with more and more corners; their lengths, computed
    const pIn = k.in('p4') * gone;
    const steps = [4, 8, 16, 32];
    const stage = at('p4') + 0.2 > t ? 0 : Math.min(3, Math.floor(clamp((t - at('more')) / Math.max(0.6, at('lim') - at('more'))) * 3.999));
    const n = steps[stage];
    if (pIn > 0.001) {
      ctx.save();
      ctx.globalAlpha *= pIn;
      ctx.strokeStyle = C.x2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const q = toPx(P, E(lerp(S0, S1, i / n)));
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i <= n; i++) dot(ctx, toPx(P, E(lerp(S0, S1, i / n))), { r: 4.5, color: C.x2, alpha: pIn });
    }
    // the table: number of pieces and the polygon's length
    const TX = X + 20;
    const TY = 360;
    text(ctx, '分点の数', TX, TY, { font: F.jp(700, 26), color: C.muted, alpha: pIn });
    text(ctx, '折れ線の長さ', TX + 200, TY, { font: F.jp(700, 26), color: C.muted, alpha: pIn });
    steps.forEach((m, i) => {
      const a = pIn * (i <= stage ? 1 : 0) * (i === stage ? 1 : 0.55);
      tex(ctx, String(m), TX + 50, TY + 52 + i * 48, { size: 34, alpha: a, align: 'center', color: i === stage ? C.x2 : C.ink2 });
      tex(ctx, chordSum(m).toFixed(5), TX + 200, TY + 52 + i * 48, { size: 34, alpha: a, color: i === stage ? C.x2 : C.ink2 });
    });
    const limIn = k.in('lim') * gone;
    tex(ctx, R`\int_{s_0}^{s_1}|\gamma'(s)|\,ds = ${(S1 - S0).toFixed(5)}\ldots`, TX, TY + 270, { size: 34, alpha: limIn, color: C.ink });

    // pi: the whole circle, and its length is named 2π
    const full = tw(t, at('full') - 0.1, 1.4, inOutCubic);
    const fullOn = k.in('full') * (1 - tw(t, at('fold'), 0.4));
    const fs = unitArc(ctx, P, 0, TAU * 0.9999, { color: C.accent, lw: 6, alpha: fullOn, p: full });
    label(ctx, R`2\pi`, toPx(P, E(-0.75)), { x: 0.7, y: 0.7 }, [fs], { size: 46, color: C.accent, alpha: k.in('two') * (1 - tw(t, at('fold'), 0.4)), gap: 10, fixed: true });
    formulaBox(ctx, R`\pi = \frac{1}{2}\times\bigl(S^1\ \text{の一周の長さ}\bigr)`, X, 760, { size: 40, alpha: k.in('def'), title: 'π の定義' });

    // sym: the first quarter, reflected in the y axis and then in the x axis
    const qIn = k.in('fold');
    const flipY = inOutCubic(span(t, at('fold') + 0.2, at('fold') + 1.2));
    const flipX = inOutCubic(span(t, at('four') - 0.6, at('four') + 0.4));
    const quarter = (sx, sy, color, alpha) => {
      if (alpha <= 0.001) return;
      ctx.save();
      ctx.translate(O.x, O.y);
      ctx.scale(sx, sy);
      ctx.translate(-O.x, -O.y);
      unitArc(ctx, P, 0, Math.PI / 2, { color, lw: 7, alpha });
      ctx.restore();
    };
    const qa = qIn * (1 - tw(t, at('h') - 0.2, 0.4));
    quarter(1, 1, C.accent, qa);
    quarter(lerp(1, -1, flipY), 1, C.x1, qa * (flipY > 0 ? 1 : 0));
    quarter(1, lerp(1, -1, flipX), C.x2, qa * (flipX > 0 ? 1 : 0));
    quarter(lerp(1, -1, flipY), lerp(1, -1, flipX), C.muted, qa * (flipX > 0 ? 1 : 0));
    // the same length on each of the four
    const eq = k.in('four') * (1 - tw(t, at('h') - 0.2, 0.4));
    for (const [cx, cy] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
      const m = toPx(P, v2(cx * Math.SQRT1_2 * 1.17, cy * Math.SQRT1_2 * 1.17));
      tex(ctx, R`\ell`, m.x, m.y + 12, { size: 38, alpha: eq, align: 'center', color: C.ink2 });
    }
    tex(ctx, R`4\ell = 2\pi`, X + 20, 410, { size: 44, alpha: k.in('four', 1) });
    tex(ctx, R`\text{半周} = 2\ell = \pi`, X + 20, 480, { size: 44, alpha: k.in('h', 1) });
    tex(ctx, R`\text{四分の一周} = \ell = \frac{\pi}{2}`, X + 20, 570, { size: 44, alpha: k.in('q', 1) });

    // half: the upper half is π, the first quarter π/2
    const hIn = k.in('h');
    const hs = unitArc(ctx, P, 0, Math.PI, { color: C.accent, lw: 7, alpha: hIn * (1 - tw(t, at('q') - 0.1, 0.3)) + 0.0001 });
    label(ctx, R`\pi`, toPx(P, E((3 * Math.PI) / 4)), { x: -0.7, y: -0.7 }, [hs], { size: 52, color: C.accent, alpha: hIn, gap: 12, fixed: true });
    const qq = k.in('q');
    const qs = unitArc(ctx, P, 0, Math.PI / 2, { color: C.x2, lw: 8, alpha: qq });
    label(ctx, R`\frac{\pi}{2}`, toPx(P, E(Math.PI / 4)), { x: 0.7, y: -0.7 }, [qs], { size: 42, color: C.x2, alpha: qq, gap: 10, fixed: true });
    if (hIn > 0.001) unitArc(ctx, P, 0, Math.PI, { color: C.accent, lw: 4, alpha: hIn * 0.6 });
  },
});
