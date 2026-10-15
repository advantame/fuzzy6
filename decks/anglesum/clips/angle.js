// 1-3: angles as numbers. E(s) is the point reached from (1, 0) by going counterclockwise a
// length s round the unit circle — drawn with the number line at the circle's own scale, so the
// arc to E(s) and the segment [0, s] are the same length. E(s + 2π) = E(s). The rotation angle
// from a to b is the counterclockwise arc, in [0, 2π); the angle between two vectors is the
// shorter arc, in [0, π], the smaller of θ and 2π − θ. A triangle's interior angle α is the
// angle between B − A and C − A.

import { clip } from '../lib/clip.js';
import { C, F, CORNER, SOFT } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { plane, toPx, v2, E, sub, unit, dirOf, turn, axes, arrow, seg, dot, unitCircle, unitArc, arc, wedge, label, TAU } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';
import { posed, drawTri, names } from '../lib/tri.js';

const R = String.raw;
const script = [
  { id: 'e', label: 'E(s)', text: '単位円の上を、{start}[(1, 0)|イチゼロ] から反時計回りに、{go}長さ [s|エス] だけ進んだ点を、{name}[E(s)|イーエス] と書くわ。' },
  { id: 'wrap', label: '一周で戻る', text: '{plus}[s|エス] が [2π|ニパイ] 増えると、ちょうど一周して、同じ点に戻る。\n{eq}[E(s ＋ 2π) ＝ E(s)|イーエスタスニパイ、イコール、イーエス] よ。' },
  { id: 'many', by: 'zunda', label: '2π ずつ', text: '数直線の上で {apart}[2π|ニパイ] ずつ離れた [s|エス] は、どれも、{same}単位円の[同じ点|オナジテン]に移るのだ。' },
  { id: 'rot', lead: 0.9, label: '回転角', text: '点 [a|エー] から点 [b|ビー] まで、{ccw}単位円を反時計回りに進む弧の長さを、\n{rname}[a|エー] から [b|ビー] への回転角と呼ぶわ。' },
  { id: 'rrange', label: '0 以上 2π 未満', text: '{range}0 以上、[2π|ニパイ] 未満の数よ。' },
  { id: 'between', label: 'なす角', text: '二つのベクトルのなす角は、\n{short}二つの向きの点を結ぶ、短い方の弧の長さ。' },
  { id: 'range2', label: '0 から π', text: '{pr}0 から [π|パイ] までの数になるの。' },
  { id: 'min', label: '小さい方', text: '[a|エー] から [b|ビー] への回転角を [θ|シータ] とすると、\n{minf}なす角は、[θ|シータ] と [2π − θ|ニパイマイナスシータ] の小さい方よ。' },
  { id: 'interior', lead: 0.8, label: '内角', text: '三角形の内角 [α|アルファ] は、{ab}[B − A|ビーマイナスエー] と [C − A|シーマイナスエー] のなす角。\n{bg}[β|ベータ] と [γ|ガンマ] も、頂点から出る二つの[辺|ヘン]のベクトルで定めるわ。' },
];

// the circle at the number line's scale, and the same circle drawn larger from 'rot' on
const P1 = plane(300, 300, 115);
const P2 = plane(560, 430, 250);
const LINE = { y: 650, s0: -5.5, x0: 52 };
const sx = (s) => LINE.x0 + (s - LINE.s0) * P1.k;
const S = 1.0;
const A0 = 0.5;
const B0 = 2.3;
const B1 = 4.4;
const X = 960;
const TRI = posed(0, v2(0, 0));
const PT = plane(300, 660, 210);

export default clip({
  id: 'angle',
  title: '角の大きさ',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const zoom = inOutCubic(span(t, at('rot'), at('rot.voice')));
    const P = plane(lerp(P1.ox, P2.ox, zoom), lerp(P1.oy, P2.oy, zoom), lerp(P1.k, P2.k, zoom));
    const out = 1 - tw(t, at('interior'), 0.6);
    const O = toPx(P, v2(0, 0));

    axes(ctx, P, -1.35, 1.45, -1.3, 1.35, { alpha: k.in('e') * out, names: false });
    unitCircle(ctx, P, { alpha: k.in('e') * out, color: C.ink, lw: 2.5 });

    // the number line, at the circle's own scale
    const lineIn = k.in('e') * (1 - tw(t, at('rot'), 0.5));
    if (lineIn > 0.001) {
      arrow(ctx, { x: sx(LINE.s0), y: LINE.y }, { x: sx(7.6), y: LINE.y }, { color: C.muted, lw: 2, head: 14, alpha: lineIn });
      for (let i = -3; i <= 4; i++) {
        const x = sx((i * Math.PI) / 2);
        if (x < LINE.x0 + 4) continue;
        const major = i % 2 === 0;
        seg(ctx, { x, y: LINE.y - (major ? 12 : 7) }, { x, y: LINE.y + (major ? 12 : 7) }, { color: C.muted, lw: 2, alpha: lineIn });
        if (major) {
          const s = i === 0 ? '0' : i === 2 ? R`\pi` : i === -2 ? R`-\pi` : i === 4 ? R`2\pi` : '';
          tex(ctx, s, x, LINE.y + 50, { size: 30, color: C.muted, align: 'center', alpha: lineIn });
        }
      }
      text(ctx, 's', sx(7.6) + 10, LINE.y + 8, { font: 'italic 400 30px "KaTeX_Math"', color: C.muted, alpha: lineIn });
    }

    // e: from (1, 0), a length s counterclockwise; the same length on the line
    const go = inOutCubic(span(t, at('go') - 0.1, at('name')));
    const sNow = S * go;
    const startIn = k.in('start') * out;
    dot(ctx, toPx(P, E(0)), { r: 7, alpha: startIn });
    label(ctx, R`E(0)`, toPx(P, E(0)), { x: 1, y: 0.4 }, [], { size: 28, alpha: startIn * (1 - zoom), gap: 8, fixed: true });
    const eIn = k.in('go') * (1 - tw(t, at('rot'), 0.4));
    unitArc(ctx, P, 0, Math.max(0.001, sNow), { color: C.accent, lw: 7, alpha: eIn });
    dot(ctx, toPx(P, E(sNow)), { r: 8, color: C.accent, alpha: eIn });
    seg(ctx, { x: sx(0), y: LINE.y }, { x: sx(sNow), y: LINE.y }, { color: C.accent, lw: 7, alpha: eIn * lineIn });
    dot(ctx, { x: sx(sNow), y: LINE.y }, { r: 8, color: C.accent, alpha: eIn * lineIn });
    label(ctx, R`E(s)`, toPx(P, E(sNow)), { x: Math.cos(sNow), y: -Math.sin(sNow) }, [], { size: 34, color: C.accent, alpha: k.in('name') * eIn, gap: 12, fixed: true });
    label(ctx, 's', { x: sx(sNow), y: LINE.y }, { x: 0, y: -1 }, [], { size: 32, color: C.accent, alpha: k.in('name') * lineIn, gap: 12, fixed: true });
    formulaBox(ctx, R`E(s):\ (1,0)\ \text{から反時計回りに長さ}\ s\ \text{進んだ点}`, X - 330, 130, { size: 34, alpha: k.in('name') * (1 - tw(t, at('rot'), 0.4)), title: '定義' });

    // wrap: s + 2π lands on the same point
    const plus = inOutCubic(span(t, at('plus'), at('eq') - 0.1));
    const wIn = k.in('plus') * (1 - tw(t, at('rot'), 0.4));
    if (wIn > 0.001) {
      unitArc(ctx, P, S, S + TAU * plus, { color: C.x2, lw: 4, alpha: wIn, head: plus > 0.1 ? 14 : 0 });
      seg(ctx, { x: sx(S), y: LINE.y + 1 }, { x: sx(S + TAU * plus), y: LINE.y + 1 }, { color: C.x2, lw: 4, alpha: wIn * lineIn });
      dot(ctx, { x: sx(S + TAU * plus), y: LINE.y }, { r: 7, color: C.x2, alpha: wIn * lineIn });
    }
    tex(ctx, R`E(s+2\pi) = E(s)`, X - 300, 300, { size: 48, alpha: k.in('eq') * (1 - tw(t, at('rot'), 0.4)) });

    // many: s − 2π, s, s + 2π all go to E(s)
    const mIn = k.in('apart') * (1 - tw(t, at('rot'), 0.4));
    const target = toPx(P, E(S));
    for (const [i, s] of [S - TAU, S, S + TAU].entries()) {
      const p = { x: sx(s), y: LINE.y };
      dot(ctx, p, { r: 7, color: C.accent, alpha: mIn });
      seg(ctx, p, target, { color: C.accent, lw: 2, dash: [6, 6], alpha: k.in('same', i) * (1 - tw(t, at('rot'), 0.4)) });
      tex(ctx, [R`s-2\pi`, 's', R`s+2\pi`][i], p.x, p.y - 22, { size: 28, color: C.accent, align: 'center', alpha: mIn });
    }

    // rot: two points a, b and the counterclockwise arc from a to b
    const bAng = lerp(B0, B1, inOutCubic(span(t, at('minf'), at('minf') + 1.6)));
    const th = turn(E(A0), E(bAng));
    const rIn = k.in('ccw') * out;
    const pa = toPx(P, E(A0));
    const pb = toPx(P, E(bAng));
    const ccwArc = arc(ctx, O, P.k + 22, A0, A0 + th, { color: C.accent, lw: 4, head: 16, alpha: rIn });
    dot(ctx, pa, { r: 8, alpha: k.in('rot.voice') * out });
    dot(ctx, pb, { r: 8, alpha: k.in('rot.voice') * out });
    label(ctx, 'a', pa, { x: Math.cos(A0), y: -Math.sin(A0) }, [ccwArc], { size: 36, alpha: k.in('rot.voice') * out, gap: 10 });
    label(ctx, 'b', pb, { x: Math.cos(bAng), y: -Math.sin(bAng) }, [ccwArc], { size: 36, alpha: k.in('rot.voice') * out, gap: 10 });
    label(ctx, R`\theta`, toPx(P, E(A0 + th / 2)), { x: Math.cos(A0 + th / 2), y: -Math.sin(A0 + th / 2) }, [ccwArc], {
      size: 40,
      color: C.accent,
      alpha: k.in('rname') * out,
      from: 30,
      gap: 8,
      fixed: true,
    });
    formulaBox(ctx, R`0 \le \theta < 2\pi`, X, 150, { size: 44, alpha: k.in('range') * out, title: 'a から b への回転角' });

    // between: the shorter arc, filled in, in [0, π]
    const short = Math.min(th, TAU - th);
    const shortStart = th <= Math.PI ? A0 : bAng;
    const bIn = k.in('short') * out;
    wedge(ctx, O, P.k, shortStart, shortStart + short, { color: C.accentSoft, alpha: bIn * 0.8 });
    unitArc(ctx, P, shortStart, shortStart + short, { color: C.ink, lw: 8, alpha: bIn });
    unitArc(ctx, P, shortStart + short, shortStart + TAU, { color: C.ink, lw: 3, dash: [8, 8], alpha: bIn * 0.6 });
    formulaBox(ctx, R`0 \le \angle(a, b) \le \pi`, X, 330, { size: 44, alpha: k.in('pr') * out, title: 'なす角' });
    formulaBox(ctx, R`\angle(a, b) = \min(\theta,\ 2\pi-\theta)`, X, 510, { size: 44, alpha: k.in('minf') * out });
    tex(ctx, R`\theta = ${th.toFixed(2)},\quad \angle(a,b) = ${short.toFixed(2)}`, X + 4, 620, { size: 34, color: C.ink2, alpha: k.in('minf', 1) * out });

    // interior: α is the angle between B − A and C − A
    const iIn = k.in('interior');
    const tri = drawTri(ctx, PT, TRI, { alpha: iIn });
    names(ctx, PT, TRI, { alpha: iIn });
    const Apx = toPx(PT, TRI.A);
    const dB = unit(sub(TRI.B, TRI.A));
    const dC = unit(sub(TRI.C, TRI.A));
    const abIn = k.in('ab');
    // the unit circle around A, at the triangle's scale, and the two directions on it
    arc(ctx, Apx, PT.k, 0, TAU, { color: C.muted, lw: 2, dash: [6, 6], alpha: abIn });
    arrow(ctx, Apx, toPx(PT, dB), { color: CORNER.A, lw: 3, alpha: abIn });
    arrow(ctx, Apx, toPx(PT, dC), { color: CORNER.A, lw: 3, alpha: abIn });
    wedge(ctx, Apx, PT.k, dirOf(dB), dirOf(dC), { color: SOFT.A, alpha: abIn * 0.9 });
    const al = arc(ctx, Apx, PT.k, dirOf(dB), dirOf(dC), { color: CORNER.A, lw: 8, alpha: abIn });
    label(ctx, R`\alpha`, toPx(PT, E((dirOf(dB) + dirOf(dC)) / 2)), { x: 0.7, y: -0.7 }, [al, ...tri.shapes], { size: 40, color: CORNER.A, alpha: abIn, gap: 8 });
    formulaBox(ctx, [R`\alpha = \angle(B-A,\ C-A)`, R`\beta = \angle(C-B,\ A-B)`, R`\gamma = \angle(A-C,\ B-C)`], X, 200, {
      size: 42,
      alpha: abIn,
      title: '三角形の内角',
    });
    // bg: β and γ, from the two sides leaving their corners
    const bg = k.in('bg');
    for (const key of ['B', 'C']) {
      const V = toPx(PT, TRI[key]);
      const others = { B: ['C', 'A'], C: ['A', 'B'] }[key];
      const d1 = sub(TRI[others[0]], TRI[key]);
      const d2 = sub(TRI[others[1]], TRI[key]);
      const a0 = dirOf(d1);
      let a1 = dirOf(d2);
      if (turn(d1, d2) > Math.PI) a1 = a0 - (TAU - turn(d1, d2));
      else a1 = a0 + turn(d1, d2);
      wedge(ctx, V, 56, a0, a1, { color: SOFT[key], alpha: bg });
      const sh = arc(ctx, V, 56, a0, a1, { color: CORNER[key], lw: 3, alpha: bg });
      label(ctx, key === 'B' ? R`\beta` : R`\gamma`, V, { x: Math.cos((a0 + a1) / 2), y: -Math.sin((a0 + a1) / 2) }, [sh, ...tri.shapes], {
        size: 36,
        color: CORNER[key],
        alpha: bg,
        from: 30,
        gap: 6,
        fixed: true,
      });
    }
  },
});
