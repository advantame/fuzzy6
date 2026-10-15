// 1-4: rotations. A rotation about the origin is a linear map that keeps the inner product and
// does not reflect. So it maps the unit circle onto itself, keeps the speed of a moving point and
// hence arc lengths, and keeps counterclockwise arcs counterclockwise: it moves every point of
// the circle the same length θ counterclockwise, R(E(s)) = E(s + θ). Two rotations add their
// angles; E(s + 2π) = E(s), so the angle of the two together is θ₁ + θ₂ less a multiple of 2π —
// "added modulo 2π". The number line, at the circle's scale, shows where the 2π goes.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { plane, toPx, v2, E, rot, inner, len, axes, arrow, arc, seg, dot, unitCircle, unitArc, label, TAU } from '../lib/geo.js';
import { tex, formulaBox, cross } from '../lib/math.js';

const R = String.raw;
const script = [
  { id: 'def', label: '回転', text: '原点を中心とする回転は、{lin}内積を保つ線形写像のうち、{noflip}裏返しを含まないものよ。' },
  { id: 'circle', label: '円を円に', text: '内積を保つから、{cc}回転は、単位円を単位円に移す。' },
  { id: 'vel', label: '弧の長さ', text: '{v}速度ベクトルの長さも保つから、{len}弧の長さも変えないわ。' },
  { id: 'orient', label: '向き', text: '裏返しを含まないから、{arrows}反時計回りの弧は、反時計回りの弧に移るの。' },
  { id: 'shift', label: '同じ長さ', text: 'だから回転は、{all}単位円のどの点も、\n反時計回りに同じ長さだけ進める。' },
  { id: 'name', label: '回転角', text: '{tname}その長さ [θ|シータ] を、この回転の回転角と呼ぶわ。' },
  { id: 'eq', label: 'R(E(s))', text: '式で書くと、{f}[R(E(s)) ＝ E(s ＋ θ)|アールイーエス、イコール、イーエスタスシータ] よ。' },
  { id: 'compose', label: '合わせる', text: '{t1}回転角 [θ₁|シータイチ] の回転のあとに、{t2}[θ₂|シータニ] の回転をすると、\n{to}[E(s)|イーエス] は [E(s ＋ θ₁ ＋ θ₂)|イーエスタスシータイチタスシータニ] に移るわ。' },
  { id: 'wrap', by: 'zunda', label: '2π ずれても', text: '回転角は、足し算になるのだ。\n{same}でも、[E(s ＋ 2π)|イーエスタスニパイ] は、[E(s)|イーエス] と同じ点なのだ。' },
  { id: 'sub', label: '2π を引く', text: 'そう。{minus}合わせた回転の回転角は、\n[θ₁ ＋ θ₂|シータイチタスシータニ] から、[2π|ニパイ] の整数倍を引いたもの。' },
  { id: 'sub2', label: '0 以上 2π 未満', text: '{rng}引いた結果は、0 以上 [2π|ニパイ] 未満にしておくわ。' },
  { id: 'mod', label: '法として', text: '{box}回転角は [2π|ニパイ] を法として足される、というのは、このことよ。' },
];

const P = plane(330, 345, 175);
const LINE = { y: 735, s0: -0.25, x0: 60 };
const sx = (s) => LINE.x0 + (s - LINE.s0) * P.k;
const X = 640;
const VA = v2(0.95, 0.35);
const VB = v2(0.25, 0.8);
const TH = 1.1; // the rotation shown first
const S = 0.6;
const T1 = 3.6;
const T2 = 3.4;

export default clip({
  id: 'rotate',
  title: '回転',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(P, v2(0, 0));
    axes(ctx, P, -1.35, 1.45, -1.3, 1.35, { alpha: k.in('def'), names: false });
    unitCircle(ctx, P, { alpha: k.in('def'), color: C.ink, lw: 2.5 });

    // def: two vectors turned together; their lengths and inner product stay
    const turn1 = inOutCubic(span(t, at('lin') - 0.2, at('noflip') + 0.6)) * TH;
    const early = 1 - tw(t, at('circle') + 0.6, 0.4);
    const a = rot(VA, turn1);
    const b = rot(VB, turn1);
    arrow(ctx, O, toPx(P, VA), { color: C.muted, lw: 3, dash: [6, 6], alpha: k.in('def') * early * (turn1 > 0.02 ? 1 : 0) });
    arrow(ctx, O, toPx(P, VB), { color: C.muted, lw: 3, dash: [6, 6], alpha: k.in('def') * early * (turn1 > 0.02 ? 1 : 0) });
    const sa = arrow(ctx, O, toPx(P, a), { color: C.ink, lw: 5, alpha: k.in('def') * early });
    const sb = arrow(ctx, O, toPx(P, b), { color: C.ink, lw: 5, alpha: k.in('def') * early });
    label(ctx, turn1 > 0.02 ? R`Rx` : 'x', toPx(P, a), { x: 0.7, y: -0.2 }, [sa, sb], { size: 32, alpha: k.in('def') * early, gap: 8 });
    label(ctx, turn1 > 0.02 ? R`Ry` : 'y', toPx(P, b), { x: 0, y: -1 }, [sa, sb], { size: 32, alpha: k.in('def') * early, gap: 8 });
    const dIn = k.in('lin') * early;
    formulaBox(ctx, [R`\langle Rx, Ry\rangle = \langle x, y\rangle`, R`\det R = 1`], X, 140, {
      size: 40,
      alpha: dIn,
      title: '回転 R',
      parts: {},
    });
    tex(ctx, R`|Rx| = ${len(a).toFixed(3)},\ \ |Ry| = ${len(b).toFixed(3)},\ \ \langle Rx, Ry\rangle = ${inner(a, b).toFixed(3)}`, X + 400, 150, {
      size: 26,
      color: C.ink2,
      alpha: dIn,
    });
    // a reflection would not do: the ghost of x and y mirrored, crossed out
    const nf = k.in('noflip') * (1 - tw(t, at('circle'), 0.4));
    const ma = v2(VA.x, -VA.y);
    const mb = v2(VB.x, -VB.y);
    arrow(ctx, O, toPx(P, ma), { color: C.muted, lw: 3, alpha: nf * 0.7 });
    arrow(ctx, O, toPx(P, mb), { color: C.muted, lw: 3, alpha: nf * 0.7 });
    cross(ctx, toPx(P, v2(0.55, -0.45)).x, toPx(P, v2(0.55, -0.45)).y, 26, nf, { color: C.accent });
    text(ctx, '裏返し', toPx(P, v2(0.55, -0.45)).x + 36, toPx(P, v2(0.55, -0.45)).y + 10, { font: F.jp(700, 24), color: C.accent, alpha: nf });

    // circle: the circle onto itself — twelve marks carried round with it
    const cIn = k.in('cc') * (1 - tw(t, at('shift'), 0.4));
    const spin = inOutCubic(span(t, at('cc'), at('cc') + 1.2)) * TH;
    for (let i = 0; i < 12; i++) {
      const q = E((i * TAU) / 12 + spin);
      const p0 = toPx(P, v2(q.x * 0.93, q.y * 0.93));
      const p1 = toPx(P, v2(q.x * 1.07, q.y * 1.07));
      seg(ctx, p0, p1, { color: i === 0 ? C.accent : C.ink2, lw: i === 0 ? 4 : 2.5, alpha: cIn });
    }

    // vel: an arc and its image, the same speed at matching points, the same length
    const vIn = k.in('v') * (1 - tw(t, at('shift'), 0.4));
    const arc0 = [0.25, 1.15];
    const arcA = unitArc(ctx, P, arc0[0], arc0[1], { color: C.x1, lw: 7, alpha: vIn, head: k.in('arrows') > 0.01 ? 18 : 0 });
    const arcB = unitArc(ctx, P, arc0[0] + TH * 1.9, arc0[1] + TH * 1.9, { color: C.x2, lw: 7, alpha: vIn, head: k.in('arrows') > 0.01 ? 18 : 0 });
    for (const [off, col] of [[0, C.x1], [TH * 1.9, C.x2]]) {
      const s = 0.7 + off;
      const p = toPx(P, E(s));
      arrow(ctx, p, toPx(P, v2(Math.cos(s) - 0.6 * Math.sin(s), Math.sin(s) + 0.6 * Math.cos(s))), { color: col, lw: 3, alpha: vIn, head: 14 });
    }
    const lenIn = k.in('len') * (1 - tw(t, at('shift'), 0.4));
    label(ctx, (arc0[1] - arc0[0]).toFixed(2), toPx(P, E(0.7)), { x: Math.cos(0.7), y: -Math.sin(0.7) }, [arcA], { size: 30, color: C.x1, alpha: lenIn, from: 40, gap: 6, fixed: true });
    label(ctx, (arc0[1] - arc0[0]).toFixed(2), toPx(P, E(0.7 + TH * 1.9)), { x: Math.cos(0.7 + TH * 1.9), y: -Math.sin(0.7 + TH * 1.9) }, [arcB], {
      size: 30,
      color: C.x2,
      alpha: lenIn,
      from: 40,
      gap: 6,
      fixed: true,
    });
    formulaBox(ctx, R`|(R\circ\gamma)'(s)| = |R\,\gamma'(s)| = |\gamma'(s)|`, X, 330, { size: 40, alpha: k.in('v') * (1 - tw(t, at('compose'), 0.4)), title: '速さを保つ' });

    // shift: every point moves on by the same length θ
    const shIn = k.in('all') * (1 - tw(t, at('compose'), 0.4));
    const Th = 1.2;
    for (const [i, s] of [0.3, 2.4, 4.4].entries()) {
      const p = inOutCubic(span(t, at('all') + i * 0.25, at('all') + 0.9 + i * 0.25));
      const sh = unitArc(ctx, P, s, s + Th * p, { color: C.accent, lw: 6, alpha: shIn, head: p > 0.2 ? 16 : 0 });
      dot(ctx, toPx(P, E(s)), { r: 7, alpha: shIn });
      label(ctx, R`\theta`, toPx(P, E(s + Th / 2)), { x: Math.cos(s + Th / 2), y: -Math.sin(s + Th / 2) }, [sh], { size: 34, color: C.accent, alpha: k.in('tname') * shIn, from: 20, gap: 8, fixed: true });
    }

    // eq: R(E(s)) = E(s + θ), and on the number line, a step of θ
    const eIn = k.in('f');
    formulaBox(ctx, R`R(E(s)) = E(s+\theta)`, X, 520, { size: 46, alpha: eIn * (1 - tw(t, at('compose'), 0.4)), title: '回転角 θ の回転' });
    const lineIn = k.in('f');
    if (lineIn > 0.001) {
      arrow(ctx, { x: sx(LINE.s0), y: LINE.y }, { x: sx(8.1), y: LINE.y }, { color: C.muted, lw: 2, head: 14, alpha: lineIn });
      for (let i = 0; i <= 5; i++) {
        const x = sx((i * Math.PI) / 2);
        const major = i % 2 === 0;
        seg(ctx, { x, y: LINE.y - (major ? 12 : 7) }, { x, y: LINE.y + (major ? 12 : 7) }, { color: C.muted, lw: 2, alpha: lineIn });
        if (major) tex(ctx, ['0', R`\pi`, R`2\pi`][i / 2], x, LINE.y + 50, { size: 30, color: C.muted, align: 'center', alpha: lineIn });
      }
      text(ctx, 's', sx(8.1) + 10, LINE.y + 8, { font: 'italic 400 30px "KaTeX_Math"', color: C.muted, alpha: lineIn });
    }

    // compose: θ₁ then θ₂ from E(s); on the line, two steps
    const c1 = inOutCubic(span(t, at('t1') - 0.1, at('t2') - 0.1));
    const c2 = inOutCubic(span(t, at('t2') - 0.1, at('to')));
    const cIn2 = k.in('t1');
    unitArc(ctx, P, S, S + T1 * c1, { color: C.x1, lw: 6, alpha: cIn2, head: c1 > 0.05 ? 16 : 0 });
    // the second turn on a slightly larger circle, so the two arcs can be told apart
    const r2 = 1.12;
    arc(ctx, O, P.k * r2, S + T1, S + T1 + T2 * c2, { color: C.x2, lw: 6, alpha: cIn2 * (c2 > 0 ? 1 : 0), head: c2 > 0.05 ? 16 : 0 });
    dot(ctx, toPx(P, E(S)), { r: 8, alpha: cIn2 });
    label(ctx, R`E(s)`, toPx(P, E(S)), { x: 0.9, y: -0.45 }, [], { size: 30, alpha: cIn2, from: 62, gap: 4, fixed: true });
    const segIn = cIn2;
    seg(ctx, { x: sx(S), y: LINE.y - 3 }, { x: sx(S + T1 * c1), y: LINE.y - 3 }, { color: C.x1, lw: 6, alpha: segIn });
    seg(ctx, { x: sx(S + T1), y: LINE.y + 3 }, { x: sx(S + T1 + T2 * c2), y: LINE.y + 3 }, { color: C.x2, lw: 6, alpha: segIn * (c2 > 0 ? 1 : 0) });
    for (const [s, name, when] of [[S, 's', 't1'], [S + T1, R`s+\theta_1`, 't2'], [S + T1 + T2, R`s+\theta_1+\theta_2`, 'to']]) {
      const a2 = k.in(when);
      dot(ctx, { x: sx(s), y: LINE.y }, { r: 7, alpha: a2 });
      tex(ctx, name, sx(s), LINE.y - 24, { size: 28, align: 'center', alpha: a2 });
    }
    const end = S + T1 + T2;
    dot(ctx, toPx(P, E(end)), { r: 8, color: C.accent, alpha: k.in('to') });
    formulaBox(ctx, R`R_{\theta_2}\bigl(R_{\theta_1}(E(s))\bigr) = E(s+\theta_1+\theta_2)`, X, 150, { size: 40, alpha: k.in('to') * (1 - tw(t, at('mod'), 0.4)) });

    // same: s + θ₁ + θ₂ and that less 2π are sent to the same point
    const wIn = k.in('same');
    const back = end - TAU;
    dot(ctx, { x: sx(back), y: LINE.y }, { r: 7, color: C.accent, alpha: wIn });
    tex(ctx, R`s+\theta_1+\theta_2-2\pi`, sx(back), LINE.y + 52, { size: 26, align: 'center', color: C.accent, alpha: wIn });
    // the two numbers are 2π apart on the line, and name one point of the circle
    const by = LINE.y - 70;
    seg(ctx, { x: sx(back), y: by }, { x: sx(end), y: by }, { color: C.accent, lw: 2.5, alpha: wIn });
    seg(ctx, { x: sx(back), y: by - 10 }, { x: sx(back), y: by + 10 }, { color: C.accent, lw: 2.5, alpha: wIn });
    seg(ctx, { x: sx(end), y: by - 10 }, { x: sx(end), y: by + 10 }, { color: C.accent, lw: 2.5, alpha: wIn });
    tex(ctx, R`2\pi`, (sx(back) + sx(end)) / 2, by - 14, { size: 32, color: C.accent, align: 'center', alpha: wIn });
    label(ctx, R`E(s+\theta_1+\theta_2)`, toPx(P, E(end)), { x: -0.55, y: -0.83 }, [], { size: 30, color: C.accent, alpha: wIn, from: 75, gap: 4, fixed: true });
    tex(ctx, R`E(s+2\pi) = E(s)`, X, 300, { size: 40, alpha: wIn * (1 - tw(t, at('mod'), 0.4)) });

    // sub: the angle of the two together: θ₁ + θ₂ − 2π, in [0, 2π)
    const sIn = k.in('minus');
    const net = T1 + T2 - TAU;
    unitArc(ctx, P, S, S + net, { color: C.accent, lw: 9, alpha: sIn, head: 18 });
    tex(ctx, R`\theta_1+\theta_2 = ${(T1 + T2).toFixed(2)} \ \ge 2\pi`, X, 410, { size: 36, alpha: sIn });
    tex(ctx, R`\theta_1+\theta_2-2\pi = ${net.toFixed(2)} \in [0, 2\pi)`, X, 470, { size: 36, color: C.accent, alpha: k.in('rng') });

    // mod: the rule, in a frame
    formulaBox(ctx, R`\text{回転角} = \theta_1+\theta_2 \pmod{2\pi}`, X, 580, { size: 42, alpha: k.in('box'), title: '2π を法として足される' });
  },
});
