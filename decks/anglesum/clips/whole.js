// 3-8: the sum. The three intervals — from −∞ to −p, −p to L − p, L − p to ∞ — share only their
// ends and together are the whole real line, so α + β + γ is the integral over all of R. The
// antiderivative is arctan(t/h), which tends to π/2 and −π/2: the integral is π. Another view: the
// integral over R is the length of the arc q(t) runs over — the upper half circle without its
// ends, once — whose length is half the circle, π.

import { clip } from '../lib/clip.js';
import { C, CORNER } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp } from '../../../src/kit/ease.js';
import { toPx, v2, dot, label, arc } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';
import { PS, H, L, P, q, tx, G, drawPlane, drawLine, drawGraph, area, seenArc, lineStretch } from '../lib/proof2.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const script = [
  {
    id: 'add',
    label: '三つを足す',
    text: `{s}三つを足すわ。積分区間は、{i1}マイナス無限大から ${say('−p', 'マイナスピー')}、\n{i2}${say('−p', 'マイナスピー')} から ${say('L − p', 'エルマイナスピー')}、{i3}${say('L − p', 'エルマイナスピー')} から無限大。`,
  },
  { id: 'join', label: '実数全体', text: '{j}隣どうしは端の一点だけを共有して、合わせると実数全体になる。' },
  { id: 'whole', label: '−∞ から ∞', text: '{w}だから、和は、マイナス無限大から無限大までの積分になるの。' },
  { id: 'anti', label: 'arctan', text: `{a}被積分関数の原始関数は、${say('arctan(t/h)', 'アークタンジェント、エイチブンノティー')} よ。` },
  { id: 'lim', label: 'π/2 と −π/2', text: `{l}${say('t', 'ティー')} を大きくすると ${say('π/2', 'ニブンノパイ')} に、{m}小さくすると ${say('−π/2', 'マイナスニブンノパイ')} に近づく。\n{v}だから、積分の値は ${say('π', 'パイ')} になるわ。` },
  { id: 'done', by: 'zunda', speed: 'fast', label: '証明 2', text: `{d}${say('α ＋ β ＋ γ ＝ π', 'アルファタスベータタスガンマ、イコール、パイ')}。{ok}証明 2 も、できたのだ！` },
  { id: 'alt1', label: '別の図', text: '同じことを、単位円の上でも確かめておくわ。' },
  { id: 'alt1b', label: '弧の長さ', text: `{arc}マイナス無限大から無限大までの積分は、\n${say('q(t)', 'キューティー')} が通る弧の長さよ。` },
  { id: 'alt2', label: '半周', text: `{half}${say('q(t)', 'キューティー')} は、両端を除いた上半円を、ちょうど一度通る。{pi}その長さは、半周の ${say('π', 'パイ')} なの。` },
];

const AREA = { A: '#c4d3ff', B: '#bfe6cf', C: '#e2cdf7' };
const PIECES = [
  ['A', -Infinity, -P],
  ['C', -P, L - P],
  ['B', L - P, Infinity],
];

export default clip({
  id: 'whole',
  title: '内角の和',
  kicker: '証明 2',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(PS, v2(0, 0));
    drawPlane(ctx, { alpha: 1 });
    drawLine(ctx, { alpha: 1 });
    drawGraph(ctx, { alpha: 1 });

    // the three pieces, as 3-7 left them; pointed at in turn
    const lit = k.lit(['i1', 'i2', 'i3'], 'add.end');
    PIECES.forEach(([c, a, b], i) => {
      const w = 8 + 4 * lit.level[i];
      lineStretch(ctx, a, b, { color: CORNER[c], lw: w });
      seenArc(ctx, a, b, { color: CORNER[c], lw: 9 + 3 * lit.level[i] });
      area(ctx, a, b, { color: AREA[c] });
    });
    // join: the two shared ends
    const jIn = k.lit(['j'], 'join.end').level[0];
    for (const x of [-P, L - P]) {
      dot(ctx, toPx(PS, v2(x, H)), { r: 9, color: C.ink, alpha: 1 });
      if (jIn > 0.001) {
        const p = toPx(PS, v2(x, H));
        ctx.save();
        ctx.globalAlpha *= jIn;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // the sum of the three integrals, then one over all of R
    const one = tw(t, at('w'), 0.5);
    tex(
      ctx,
      R`\alpha+\beta+\gamma = \el{a}{\int_{-\infty}^{-p}} f\,dt + \el{c}{\int_{-p}^{L-p}} f\,dt + \el{b}{\int_{L-p}^{\infty}} f\,dt`,
      80,
      105,
      { size: 34, alpha: k.in('s') * (1 - one), colors: { a: CORNER.A, b: CORNER.B, c: CORNER.C } },
    );
    formulaBox(ctx, R`\alpha+\beta+\gamma = \int_{-\infty}^{\infty} \frac{h}{t^2+h^2}\,dt`, 70, 105, { size: 34, alpha: one });

    // anti, lim: the antiderivative and its limits
    formulaBox(ctx, [R`\int \frac{h}{t^2+h^2}\,dt = \arctan\frac{t}{h} + C`, { src: R`\Bigl(\frac{d}{dt}\arctan\frac{t}{h} = \frac{1/h}{1+(t/h)^2} = \frac{h}{t^2+h^2}\Bigr)`, size: 26 }], 70, 560, {
      size: 34,
      alpha: k.in('a'),
      title: '原始関数',
    });
    tex(ctx, R`\lim_{t\to\infty}\arctan\frac{t}{h} = \frac{\pi}{2},\quad \lim_{t\to-\infty}\arctan\frac{t}{h} = -\frac{\pi}{2}`, 760, 100, { size: 30, alpha: k.in('l') * (1 - tw(t, at('d'), 0.4)) });
    tex(ctx, R`\int_{-\infty}^{\infty}\frac{h}{t^2+h^2}\,dt = \frac{\pi}{2} - \Bigl(-\frac{\pi}{2}\Bigr) = \pi`, 1010, 560, { size: 32, alpha: k.in('v') });

    // done: the result
    formulaBox(ctx, R`\alpha+\beta+\gamma = \pi\quad\square`, 1100, 690, { size: 44, alpha: k.in('d'), title: '証明 2' });

    // alt: q(t) runs once over the open upper half circle; its length is π
    const run = inOutCubic(span(t, at('half'), at('half') + 2.2));
    const aIn = k.in('arc');
    if (aIn > 0.001) {
      const tt = lerp(-40, 40, run);
      const Q = toPx(PS, q(tt));
      if (run > 0 && run < 1) dot(ctx, Q, { r: 11, color: C.accent });
      arc(ctx, O, PS.k * 1.1, Math.PI, Math.PI - Math.PI * run, { color: C.accent, lw: 5, alpha: aIn, head: run > 0.05 ? 16 : 0 });
    }
    dot(ctx, toPx(PS, v2(1, 0)), { r: 9, open: true, color: C.accent, alpha: k.in('half') });
    dot(ctx, toPx(PS, v2(-1, 0)), { r: 9, open: true, color: C.accent, alpha: k.in('half') });
    label(ctx, R`\pi`, toPx(PS, v2(0, 1.1)), { x: 0, y: -1 }, [], { size: 44, color: C.accent, alpha: k.in('pi'), gap: 10 });
    void G;
    void tx;
  },
});
