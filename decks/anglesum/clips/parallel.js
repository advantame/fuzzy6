// 3-9: proof 2 seen another way. Joining the origin to (−p, h) and (L − p, h) gives triangle ABC
// moved so that C is the origin and then reflected in the x axis; in it the x axis is the
// parallel to AB through C. At the origin, the angle between the negative x axis and the
// direction to A is the integral from −∞ to −p — which was α: A's interior angle and the angle
// the parallel makes with CA are alternate angles, and the rewriting by evenness is what showed
// them equal. The same for β; around the origin α, γ, β fill the half-plane above the x axis
// and sum to π. Every step of the school proof with the parallel line was an integral here.
// The opening's card comes back with 難解な restored.

import { clip } from '../lib/clip.js';
import { C, CORNER, SOFT, F } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp } from '../../../src/kit/ease.js';
import { text, measure } from '../../../src/kit/draw.js';
import { plane, toPx, v2, sub, seg, dot, label, wedge, arc, dirOf, between, turn } from '../lib/geo.js';
import { tex, formulaBox, card, strike } from '../lib/math.js';
import { PS, H, L, P, drawPlane, drawLine, lineStretch } from '../lib/proof2.js';
import { TRI } from '../lib/tri.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const script = [
  { id: 'join', label: 'もう一つの図', text: `証明 2 を、もう一つの図で見ておくわ。\n{c}原点と、{pts}${say('(−p, h)', 'マイナスピー、エイチ')}、${say('(L − p, h)', 'エルマイナスピー、エイチ')} の二点を結ぶの。` },
  { id: 'tri', by: 'zunda', lead: 0.2, label: '裏返した三角形', text: `{tr}三角形 ${say('ABC', 'エービーシー')} を、${say('C', 'シー')} が原点に来るように平行移動して、\n${say('x', 'エックス')} 軸について折り返した形なのだ。` },
  { id: 'par', label: '平行線', text: `{px}この三角形で、${say('x', 'エックス')} 軸は、${say('C', 'シー')} を通って[辺|ヘン] ${say('AB', 'エービー')} に平行な直線になっているわ。` },
  { id: 'alt', label: '原点の角', text: `{an}原点で、${say('x', 'エックス')} 軸の[負|フ]の向きと、${say('A', 'エー')} への向きのなす角は、\n{int}マイナス無限大から ${say('−p', 'マイナスピー')} までの積分。` },
  { id: 'eqa', label: '= α', text: `{e}これは、${say('α', 'アルファ')} に等しかったわね。` },
  { id: 'cuo', label: '錯角', text: `{z}${say('A', 'エー')} の内角と、平行線と[辺|ヘン] ${say('CA', 'シーエー')} が作る角は、錯角。\n{ev}偶関数で書き換えた所は、錯角が等しいことを示していたの。` },
  { id: 'sum', label: 'β も同じ', text: `{b}${say('β', 'ベータ')} も同じよ。` },
  { id: 'fill', label: '合わせて π', text: `{fl}原点のまわりで、三つの角は ${say('x', 'エックス')} 軸の上側をすき間なく埋めて、\n{pi}合わせて ${say('π', 'パイ')} になるわ。` },
  { id: 'mid', by: 'zunda', label: '中学の証明', text: '{m}平行線を引く中学の証明の、一つずつの段階が、積分の式になっていたのだ。' },
  { id: 'hard', by: 'zunda', label: '難解だった', text: '当たり前の定理なのに、{cd}ずいぶん準備がいったのだ。{h}たしかに、難解だったのだ。' },
];

// the flipped triangle: C at the origin, A and B on y = h
const A2 = v2(-P, H);
const B2 = v2(L - P, H);
const O2 = v2(0, 0);

// the school figure, small and upright, in its own plane
const PI_ = plane(1130, 835, 112);

export default clip({
  id: 'parallel',
  title: '平行線の証明',
  kicker: '証明 2',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(PS, O2);
    drawPlane(ctx, { alpha: 1, grid: true });
    drawLine(ctx, { alpha: 1 });
    // what 3-8 left: the three stretches of the line, faint
    lineStretch(ctx, -Infinity, -P, { color: CORNER.A, lw: 6, alpha: 0.35 });
    lineStretch(ctx, -P, L - P, { color: CORNER.C, lw: 6, alpha: 0.35 });
    lineStretch(ctx, L - P, Infinity, { color: CORNER.B, lw: 6, alpha: 0.35 });

    // join: the origin to (−p, h) and (L − p, h)
    const jIn = k.in('c');
    const pA = toPx(PS, A2);
    const pB = toPx(PS, B2);
    seg(ctx, O, pA, { color: C.ink, lw: 4, alpha: jIn, p: tw(t, at('pts') - 0.15, 0.5) });
    seg(ctx, O, pB, { color: C.ink, lw: 4, alpha: jIn, p: tw(t, at('pts'), 0.5) });
    seg(ctx, pA, pB, { color: C.ink, lw: 4, alpha: k.in('pts', 3) });

    // tri: triangle ABC (a ghost) moved so that C is at the origin, then reflected in the x axis
    const mv = inOutCubic(span(t, at('tri'), at('tr') + 0.9));
    const fl = lerp(1, -1, inOutCubic(span(t, at('tr') + 0.9, at('tr') + 2.0)));
    const ghost = k.in('tri') * (1 - tw(t, at('par'), 0.5));
    const place = (pt) => {
      const m = sub(pt, v2(P * mv, H * mv));
      return toPx(PS, v2(m.x, m.y * fl));
    };
    if (ghost > 0.001) {
      const g = ['A', 'B', 'C'].map((c) => place(TRI[c]));
      ctx.save();
      ctx.globalAlpha *= ghost;
      ctx.fillStyle = 'rgba(138,63,209,0.08)';
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      g.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ['A', 'B', 'C'].forEach((c, i) => tex(ctx, c, g[i].x + 10, g[i].y - 10, { size: 30, color: C.accent, alpha: ghost }));
    }
    // the names, once it has landed
    const nIn = k.in('par');
    tex(ctx, 'A', pA.x - 34, pA.y - 12, { size: 34, alpha: nIn });
    tex(ctx, 'B', pB.x + 10, pB.y - 12, { size: 34, alpha: nIn });
    tex(ctx, 'C', O.x - 34, O.y + 34, { size: 34, alpha: nIn });

    // par: the x axis is the parallel to AB through C
    const pIn = k.in('px');
    seg(ctx, toPx(PS, v2(-4.3, 0)), toPx(PS, v2(4.3, 0)), { color: C.accent, lw: 3, alpha: pIn });
    for (const [y, x] of [[0, 3.3], [H, 3.3]]) {
      const p = toPx(PS, v2(x, y));
      ctx.save();
      ctx.globalAlpha *= pIn;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      for (const dx of [0, 12]) {
        ctx.beginPath();
        ctx.moveTo(p.x + dx - 8, p.y - 9);
        ctx.lineTo(p.x + dx + 2, p.y);
        ctx.lineTo(p.x + dx - 8, p.y + 9);
        ctx.stroke();
      }
      ctx.restore();
    }

    // alt, eqa: at the origin, from the negative x axis to A — the integral from −∞ to −p, = α
    const aIn = k.in('an');
    const toA = dirOf(A2);
    wedge(ctx, O, 70, toA, Math.PI, { color: SOFT.A, alpha: aIn });
    const aArc = arc(ctx, O, 70, toA, Math.PI, { color: CORNER.A, lw: 3, alpha: aIn });
    label(ctx, R`\alpha`, O, { x: Math.cos((toA + Math.PI) / 2), y: -Math.sin((toA + Math.PI) / 2) }, [aArc], { size: 32, color: CORNER.A, alpha: k.in('e'), from: 70, gap: 4, fixed: true });
    formulaBox(ctx, R`\int_{-\infty}^{-p} \frac{h}{t^2+h^2}\,dt\ \el{e}{= \alpha}`, 70, 105, { size: 32, alpha: k.in('int'), alphas: { e: k.in('e') } });

    // cuo: α at A too, between A → B and A → C; the two are alternate angles
    const zIn = k.in('z');
    const a1 = dirOf(v2(1, 0));
    const a2 = dirOf(sub(O2, A2));
    wedge(ctx, pA, 70, a2, a1, { color: SOFT.A, alpha: zIn });
    const zArc = arc(ctx, pA, 70, a2, a1, { color: CORNER.A, lw: 3, alpha: zIn });
    label(ctx, R`\alpha`, pA, { x: Math.cos((a1 + a2) / 2), y: -Math.sin((a1 + a2) / 2) }, [zArc], { size: 32, color: CORNER.A, alpha: zIn, from: 70, gap: 4, fixed: true });
    // the Z: the two parallels and the transversal from A to C
    seg(ctx, pA, O, { color: CORNER.A, lw: 6, alpha: zIn * 0.6 });
    formulaBox(ctx, R`\int_p^{\infty} f\,dt = \int_{-\infty}^{-p} f\,dt\quad(\text{3-5 の書き換え})`, 760, 105, { size: 30, alpha: k.in('ev'), title: '錯角が等しい' });

    // sum: β the same; at the origin α, γ, β fill the upper half-plane
    const bIn = k.in('b');
    const toB = dirOf(B2);
    wedge(ctx, O, 70, 0, toB, { color: SOFT.B, alpha: bIn });
    const bArc = arc(ctx, O, 70, 0, toB, { color: CORNER.B, lw: 3, alpha: bIn });
    label(ctx, R`\beta`, O, { x: Math.cos(toB / 2), y: -Math.sin(toB / 2) }, [bArc], { size: 32, color: CORNER.B, alpha: bIn, from: 70, gap: 4, fixed: true });
    const b1 = dirOf(sub(O2, B2));
    wedge(ctx, pB, 70, b1, -Math.PI, { color: SOFT.B, alpha: bIn });
    const bArc2 = arc(ctx, pB, 70, b1, -Math.PI, { color: CORNER.B, lw: 3, alpha: bIn });
    label(ctx, R`\beta`, pB, { x: Math.cos((b1 - Math.PI) / 2), y: -Math.sin((b1 - Math.PI) / 2) }, [bArc2], { size: 32, color: CORNER.B, alpha: bIn, from: 70, gap: 4, fixed: true });
    const fIn = k.in('fl');
    wedge(ctx, O, 70, toB, toA, { color: SOFT.C, alpha: fIn });
    const gArc = arc(ctx, O, 70, toB, toA, { color: CORNER.C, lw: 3, alpha: fIn });
    label(ctx, R`\gamma`, O, { x: Math.cos((toA + toB) / 2), y: -Math.sin((toA + toB) / 2) }, [gArc], { size: 32, color: CORNER.C, alpha: fIn, from: 70, gap: 4, fixed: true });
    const piIn = k.in('pi');
    arc(ctx, O, 104, 0, Math.PI, { color: C.accent, lw: 4, alpha: piIn });
    label(ctx, R`\pi`, toPx(PS, v2(-0.62, 0.62)), { x: -0.7, y: -0.7 }, [], { size: 40, color: C.accent, alpha: piIn });
    void between;
    void turn;

    // mid: the school figure, upright: the parallel to AB through C, alternate angles at C
    const mIn = k.in('m');
    if (mIn > 0.001) {
      const tp = (pt) => toPx(PI_, pt);
      const sA = tp(TRI.A);
      const sB = tp(TRI.B);
      const sC = tp(TRI.C);
      card(ctx, PI_.ox - 150, PI_.oy - 250, 570, 290, { alpha: mIn, stroke: C.ink, lw: 2 });
      text(ctx, '中学の証明', PI_.ox - 130, PI_.oy - 216, { font: F.jp(700, 22), color: C.muted, alpha: mIn });
      seg(ctx, sA, sB, { color: C.ink, lw: 3, alpha: mIn });
      seg(ctx, sB, sC, { color: C.ink, lw: 3, alpha: mIn });
      seg(ctx, sC, sA, { color: C.ink, lw: 3, alpha: mIn });
      seg(ctx, tp(v2(-1.3, H)), tp(v2(3.6, H)), { color: C.accent, lw: 2.5, alpha: mIn });
      const ca = dirOf(sub(TRI.A, TRI.C));
      const cb = dirOf(sub(TRI.B, TRI.C));
      const fan = (c, r, s0, s1, col, soft) => {
        wedge(ctx, c, r, s0, s1, { color: soft, alpha: mIn });
        arc(ctx, c, r, s0, s1, { color: col, lw: 2.5, alpha: mIn });
      };
      fan(sC, 40, -Math.PI, ca, CORNER.A, SOFT.A);
      fan(sC, 40, ca, cb, CORNER.C, SOFT.C);
      fan(sC, 40, cb, 0, CORNER.B, SOFT.B);
      fan(sA, 40, 0, dirOf(sub(TRI.C, TRI.A)), CORNER.A, SOFT.A);
      fan(sB, 40, dirOf(sub(TRI.C, TRI.B)), Math.PI, CORNER.B, SOFT.B);
      tex(ctx, 'A', sA.x - 26, sA.y + 8, { size: 24, alpha: mIn });
      tex(ctx, 'B', sB.x + 8, sB.y + 8, { size: 24, alpha: mIn });
      tex(ctx, 'C', sC.x - 8, sC.y - 12, { size: 24, alpha: mIn });
    }

    // hard: the opening's card, with 難解な back
    const cIn = k.in('cd');
    if (cIn > 0.001) {
      const X0 = 70;
      const Y0 = 600;
      card(ctx, X0, Y0, 560, 150, { stroke: C.ink, lw: 2.5, alpha: cIn });
      const TS = 24;
      const tabW = measure(ctx, F.jp(700, TS), '難解な定理') + TS * 1.2;
      ctx.save();
      ctx.globalAlpha *= cIn;
      ctx.beginPath();
      ctx.roundRect(X0 + 22, Y0 - TS * 0.75, tabW, TS * 1.5, TS * 0.75);
      ctx.fillStyle = C.ink;
      ctx.fill();
      text(ctx, '難解な定理', X0 + 22 + tabW / 2, Y0 + TS * 0.36, { font: F.jp(700, TS), color: C.white, align: 'center' });
      ctx.restore();
      const hardBox = { x: X0 + 22 + TS * 0.6, y: Y0 - TS * 0.75 + 4, w: measure(ctx, F.jp(700, TS), '難解な'), h: TS * 1.5 - 8 };
      strike(ctx, hardBox, 1 - tw(t, at('h') - 0.1, 0.5), { color: C.accent, lw: 4, alpha: cIn });
      tex(ctx, R`\text{三角形の内角の和は}\ \pi\ \mathrm{rad}`, X0 + 30, Y0 + 70, { size: 36, alpha: cIn });
      tex(ctx, R`\alpha+\beta+\gamma = \pi`, X0 + 30, Y0 + 125, { size: 36, alpha: cIn });
    }
  },
});
