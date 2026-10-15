// 2-6: back to the interior angles. α is the angle between u = B − A and C − A = −w. On the unit
// circle, −w's point is half a turn on from w's; since 0 < θ₃ < π, u's point lies on that half
// turn: w to u is θ₃, u to −w is π − θ₃. That lies between 0 and π, so it is the shorter arc:
// α = π − θ₃ — the same arc drawn at A on the triangle. Likewise β = π − θ₁, γ = π − θ₂, and
// α + β + γ = 3π − (θ₁ + θ₂ + θ₃) = 3π − 2π = π.

import { clip } from '../lib/clip.js';
import { C, CORNER, SOFT } from '../lib/theme.js';
import { tw } from '../../../src/kit/ease.js';
import { ringBox } from '../../../src/kit/cue.js';
import { toPx, v2, add, scale, dirOf, arc, seg, dot, wedge, arrow, label } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';
import { T, PT, PC, DIR, theta, edgeArrows, cornerNames, dirCircle, turnOnCircle } from '../lib/proof1.js';
import { cornerAngle } from '../lib/tri.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const U_ = say('u', 'ユー');
const W_ = say('w', 'ダブリュー');
const NW = say('−w', 'マイナスダブリュー');
const T3 = say('θ₃', 'シータサン');
const PM3 = say('π − θ₃', 'パイマイナスシータサン');
const script = [
  { id: 'alpha', label: 'α は', text: `最後に、内角とつなぐわ。\n{a}${say('A', 'エー')} の内角 ${say('α', 'アルファ')} は、{u}${say('u ＝ B − A', 'ユー、イコール、ビーマイナスエー')} と、{mw}${say('C − A ＝ −w', 'シーマイナスエー、イコール、マイナスダブリュー')} のなす角よ。` },
  { id: 'anti', label: '−w は半周先', text: `単位円の上で、{nw}${NW} の向きの点は、\n${W_} の向きの点から、反時計回りにちょうど半周進んだ点。` },
  { id: 'mid', label: 'u は途中に', text: `{m}${T3} は 0 と ${say('π', 'パイ')} のあいだだから、${U_} の向きの点は、{on}その半周の途中にある。` },
  { id: 'split', label: 'θ₃ と π − θ₃', text: `{t3}${W_} から ${U_} までが ${T3}、{rest}${U_} から ${NW} までが ${PM3} よ。` },
  { id: 'short', label: 'α = π − θ₃', text: `{sh}${PM3} は 0 と ${say('π', 'パイ')} のあいだだから、これが短い方の弧。\n{eq}${say('α ＝ π − θ₃', 'アルファ、イコール、パイマイナスシータサン')} になるの。` },
  { id: 'others', label: 'β と γ', text: `同じように、{b}${say('β ＝ π − θ₁', 'ベータ、イコール、パイマイナスシータイチ')}、{g}${say('γ ＝ π − θ₂', 'ガンマ、イコール、パイマイナスシータニ')} になるわ。` },
  { id: 'sum', label: '足す', text: `{s}足すと、${say('α ＋ β ＋ γ', 'アルファタスベータタスガンマ')} は、${say('3π', 'サンパイ')} から ${say('θ', 'シータ')} の和を引いたもの。\n{two}${say('θ', 'シータ')} の和は ${say('2π', 'ニパイ')} だから……` },
  { id: 'pi', by: 'zunda', speed: 'fast', label: 'π', text: `{p}${say('3π', 'サンパイ')} ひく ${say('2π', 'ニパイ')} で、${say('π', 'パイ')} なのだ！　{done}証明 1 が、できたのだ！` },
];

const FX = 110;

export default clip({
  id: 'interior',
  title: '内角',
  kicker: '証明 1',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(PC, v2(0, 0));

    // the triangle, and α at A between u and C − A = −w
    const ea = edgeArrows(ctx, { alpha: 0.35, lw: 4, names: false });
    const A = toPx(PT, T.A);
    const aIn = k.in('a');
    const uDir = dirOf(DIR.u);
    const nwDir = dirOf(scale(DIR.w, -1));
    wedge(ctx, A, PT.k, uDir, nwDir, { color: SOFT.A, alpha: k.in('eq') });
    const al = arc(ctx, A, PT.k, uDir, nwDir, { color: CORNER.A, lw: 6, alpha: k.in('eq') });
    const su = arrow(ctx, A, toPx(PT, T.B), { color: C.ink, lw: 5, alpha: k.in('u') + 0.0001 });
    const sw = arrow(ctx, A, toPx(PT, T.C), { color: C.ink, lw: 5, alpha: k.in('mw') });
    seg(ctx, toPx(PT, T.B), toPx(PT, T.C), { color: C.ink, lw: 4, alpha: 0.35 });
    cornerNames(ctx, [...ea.shapes, su, sw], { alpha: 1 });
    label(ctx, 'u', toPx(PT, add(T.A, scale(DIR.u, 1.3))), { x: 0.2, y: 1 }, [su], { size: 36, alpha: k.in('u'), gap: 8, fixed: true });
    label(ctx, R`-w`, toPx(PT, add(T.A, scale(DIR.w, -0.9))), { x: -1, y: 0.1 }, [sw], { size: 36, alpha: k.in('mw'), gap: 8, fixed: true });
    cornerAngle(ctx, PT, T, 'A', { r: 46, alpha: aIn * (1 - k.in('eq')), name: true });
    label(ctx, R`\alpha`, { x: A.x + Math.cos((uDir + nwDir) / 2) * PT.k, y: A.y - Math.sin((uDir + nwDir) / 2) * PT.k }, { x: Math.cos((uDir + nwDir) / 2), y: -Math.sin((uDir + nwDir) / 2) }, [al], {
      size: 38,
      color: CORNER.A,
      alpha: k.in('eq'),
      gap: 8,
      fixed: true,
    });

    // others: β and γ at their corners
    cornerAngle(ctx, PT, T, 'B', { r: 50, alpha: k.in('b') });
    cornerAngle(ctx, PT, T, 'C', { r: 50, alpha: k.in('g') });

    // the circle with u's and w's points, and −w's half a turn on from w's
    dirCircle(ctx, { alpha: 1, dots: { u: 1, v: 0.25, w: 1 } });
    const nwIn = k.in('nw');
    const half = arc(ctx, O, PC.k * 1.24, dirOf(DIR.w), dirOf(DIR.w) + Math.PI, { color: C.muted, lw: 4, head: 16, alpha: nwIn, p: tw(t, at('nw') - 0.1, 0.8) });
    const pnw = toPx(PC, scale(DIR.w, -1));
    seg(ctx, O, pnw, { color: C.muted, lw: 2, alpha: nwIn });
    dot(ctx, pnw, { r: 8, alpha: nwIn });
    label(ctx, R`\frac{-w}{|w|}`, pnw, { x: -0.95, y: -0.3 }, [half], { size: 30, alpha: nwIn, gap: 10, fixed: true, from: 30 });
    label(ctx, R`\pi`, toPx(PC, scale({ x: Math.cos(dirOf(DIR.w) + 2.1), y: Math.sin(dirOf(DIR.w) + 2.1) }, 1.24)), { x: Math.cos(dirOf(DIR.w) + 2.1), y: -Math.sin(dirOf(DIR.w) + 2.1) }, [half], {
      size: 32,
      color: C.muted,
      alpha: nwIn * (1 - k.in('t3')),
      gap: 8,
      fixed: true,
    });

    // mid: u's point lies on that half turn
    const onLv = k.lit(['on'], 'mid.end').level[0];
    if (onLv > 0.001) {
      ctx.save();
      ctx.globalAlpha *= onLv;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 4;
      const pu = toPx(PC, DIR.u);
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    tex(ctx, R`0 < \theta_3 < \pi`, 1260, 670, { size: 36, alpha: k.in('m') * (1 - tw(t, at('others'), 0.4)) });

    // split: w → u is θ₃, u → −w is π − θ₃ (filled: the shorter arc)
    turnOnCircle(ctx, 3, { alpha: k.in('t3'), r: 1.12 });
    wedge(ctx, O, PC.k, uDir, nwDir, { color: SOFT.A, alpha: k.in('sh') * 0.7 });
    const rest = arc(ctx, O, PC.k, uDir, nwDir, { color: CORNER.A, lw: 9, alpha: k.in('rest') });
    label(ctx, R`\pi-\theta_3`, toPx(PC, { x: Math.cos((uDir + nwDir) / 2) * 0.62, y: Math.sin((uDir + nwDir) / 2) * 0.62 }), { x: 0, y: 0 }, [], {
      size: 32,
      color: CORNER.A,
      alpha: k.in('rest'),
      fixed: true,
    });
    void rest;

    // the formulas
    const row1 = tex(ctx, R`\el{a}{\alpha = \pi - \theta_3,}\quad \el{b}{\beta = \pi - \theta_1,}\quad \el{g}{\gamma = \pi - \theta_2}`, FX, 780, {
      size: 40,
      alphas: { a: k.in('eq'), b: k.in('b'), g: k.in('g') },
      colors: { a: CORNER.A, b: CORNER.B, g: CORNER.C },
    });
    const row2 = tex(ctx, R`\alpha+\beta+\gamma = 3\pi - (\theta_1+\theta_2+\theta_3) \el{x}{= 3\pi - 2\pi} \el{y}{= \pi}`, FX, 855, {
      size: 40,
      alpha: k.in('s'),
      alphas: { x: k.in('two'), y: k.in('p') },
    });
    const box = row2.parts.y;
    const done = k.in('done');
    if (box) {
      formulaBox(ctx, R`\alpha+\beta+\gamma = \pi\quad\square`, 1110, 780, { size: 44, alpha: done, title: '証明 1' });
    }
    ringBox(ctx, row2.parts.x, k.lit(['two'], 'pi')?.level?.[0] ?? 0, C.accent, 4);
    void row1;
  },
});
