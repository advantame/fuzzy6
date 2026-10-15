// 1-8: how the three ratios hang together. ずんだもん divides sin θ by cos θ and watches the
// hypotenuses cancel: tan θ. With the hypotenuse 1, the height is sin θ and the base cos θ,
// and the theorem of Pythagoras says sin²θ + cos²θ = 1 — the squares on the legs change size
// as the angle moves but always add up to the square on the hypotenuse. Then a little
// problem: sin θ = 0.6 gives cos θ = 0.8 and tan θ = 0.75.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { seg, tw, inOutCubic, clamp, lerp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { focus, ring, ringBox } from '../../../src/kit/cue.js';
import { corners, drawTri, angleAt, sideLabel, RAD } from '../lib/tri.js';
import { math, row, frac, jp, sup, colored, tag } from '../lib/math.js';
import { definition } from '../lib/board.js';
import { workLine } from '../lib/drill.js';
import { formulaBox, strike } from '../lib/parts.js';

const R = 300; // the hypotenuse, as 1
const A0 = { x: 250, y: 560 };
const X = 820; // the column of working

const script = [
  { id: 'a', label: '気づいたこと', text: '三角比を{play}いじっていたら、気づいたことがあるのだ。' },
  { id: 'b', label: 'sin を cos で割る', text: '{div}[sin θ|サインシータ] を [cos θ|コサインシータ] で割ると、{cancel}斜辺どうしが消えて、{left}高さ割る底辺……{tan}[tan θ|タンジェントシータ] になるのだ！' },
  { id: 'm1', by: 'metan', label: 'tan は sin と cos から', text: 'そのとおり。{eq}[tan θ|タンジェントシータ] は、[sin θ|サインシータ] と [cos θ|コサインシータ] から求められるの。' },
  { id: 'c', label: '斜辺を 1 に', lead: 1.0, text: '{one}それから、斜辺を 1 にすると、{hs}高さが [sin θ|サインシータ]、{bc}底辺が [cos θ|コサインシータ] そのものになるのだ。' },
  { id: 'd', label: '三平方の定理', text: 'そこに{pyth}三平方の定理を使うと……{sum}[sin θ|サインシータ] の 2 乗と、[cos θ|コサインシータ] の 2 乗を足すと、{one2}1 になるのだ！' },
  { id: 'm2', by: 'metan', label: '2 乗の書き方', text: '式では、[sin θ|サインシータ] の 2 乗を、{sq}[sin|サイン] の右肩に 2 を書いて表すのが決まりよ。' },
  { id: 'e', label: 'ずっと 1', text: '{try}角度を変えて、確かめるのだ。……{same}正方形の大きさは変わるけど、{always}足すと、ずっと 1 なのだ！' },
  { id: 'm3', by: 'metan', label: '問題', text: 'では、{q}[sin θ|サインシータ] が [0.6|レイテンロク] のとき、[cos θ|コサインシータ] と [tan θ|タンジェントシータ] は、いくつかしら。' },
  { id: 'f', label: 'cos θ は 0.8', text: '{p1}[0.6|レイテンロク] の 2 乗は [0.36|レイテンサンロク] だから、{p2}[cos θ|コサインシータ] の 2 乗は [0.64|レイテンロクヨン] で、{p3}[cos θ|コサインシータ] は [0.8|レイテンハチ] なのだ。' },
  { id: 'g', label: 'tan θ は 0.75', text: '{p4}[tan θ|タンジェントシータ] は、[0.6|レイテンロク] 割る [0.8|レイテンハチ] で、{p5}[0.75|レイテンナナゴ] なのだ！' },
  { id: 'm4', by: 'metan', label: '一つわかれば', text: '正解よ。{all}一つの値がわかれば、残りの二つも、計算で求められるのよ。' },
];

export default clip({
  id: 'relations',
  title: '三つの比の関係',
  cast: ['metan', 'zunda'],
  script,

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;

    // ——— the angle: 38° to start; it swings in e, and settles where sin θ = 0.6
    const swing = seg(t, at('try'), at('e.end'));
    const settle = inOutCubic(seg(t, at('q') - 0.3, at('q') + 0.7));
    const deg0 = 38 + 22 * Math.sin(swing * Math.PI * 2) * (swing > 0 && swing < 1 ? 1 : 0);
    const deg = lerp(deg0, (Math.asin(0.6) * 180) / Math.PI, settle);
    // the hypotenuse becomes 1 in c
    const one = inOutCubic(seg(t, at('c'), at('c') + 1.0));
    const hyp = lerp(440 / Math.cos(38 * RAD), R, one);
    const base = hyp * Math.cos(deg * RAD);
    const T = corners(deg, base, { x: lerp(160, A0.x, one), y: lerp(600, A0.y, one) });

    // squares on the three sides (d to m3)
    const sq = tw(t, at('pyth') - lead, 0.6) * (1 - tw(t, at('q') - 0.3, 0.5));
    if (sq > 0) squares(ctx, T, sq);

    drawTri(ctx, T, { lw: 6 });
    angleAt(ctx, T, 'A', { r: 58, label: 'θ', size: 32 });
    // the names, then the values once the hypotenuse is 1
    const vals = tw(t, at('hs') - lead, 0.5);
    // in the problem the sides carry its numbers instead
    const prob = 1 - tw(t, at('q') - lead, 0.4);
    sideLabel(ctx, T, 'height', '高さ', { size: 28, alpha: 1 - vals });
    sideLabel(ctx, T, 'base', '底辺', { size: 28, alpha: 1 - one });
    sideLabel(ctx, T, 'hyp', '斜辺', { size: 28, color: C.ink, alpha: 1 - one });
    sideLabel(ctx, T, 'hyp', '1', { size: 34, color: C.ink, alpha: one * (1 - sq) * prob });
    sideLabel(ctx, T, 'height', row('sin', 'θ'), { size: 32, alpha: vals * (1 - sq) * prob });
    sideLabel(ctx, T, 'base', row('cos', 'θ'), { size: 32, alpha: tw(t, at('bc') - lead, 0.5) * (1 - sq) * prob });

    // ——— b: sin θ over cos θ, the hypotenuses cancel
    const defs = 1 - tw(t, at('c'), 0.5);
    const divA = tw(t, at('div') - lead, 0.5) * defs;
    if (divA > 0) {
      // sin θ / cos θ = (高さ/斜辺) / (底辺/斜辺), the 斜辺s struck out as they cancel
      const line = workLine(ctx, row(frac(row('sin', 'θ'), row('cos', 'θ')), tag('eq', '='), frac(frac(jp('高さ', C.sin), tag('d1', jp('斜辺'))), frac(jp('底辺', C.cos), tag('d2', jp('斜辺'))))), X, 340, divA, { size: 50 });
      const struck = seg(t, at('cancel') - 0.05, at('cancel') + 0.5);
      strike(ctx, line.parts.d1, struck, { alpha: divA });
      strike(ctx, line.parts.d2, struck, { alpha: divA });
      // = 高さ / 底辺 = tan θ, its = under the first
      const left = tw(t, at('left') - lead, 0.5) * defs;
      workLine(ctx, row('=', frac(jp('高さ', C.sin), jp('底辺', C.cos)), ...(t > at('tan') - lead ? ['=', colored(C.tan, 'tan θ')] : [])), line.parts.eq.x, 540, left, { size: 50 });
    }
    // m1: the relation, boxed
    const eq = tw(t, at('eq') - lead, 0.5) * (1 - tw(t, at('q') - 0.3, 0.5));
    const eqY = lerp(700, 220, inOutCubic(seg(t, at('c'), at('c') + 0.8)));
    formulaBox(ctx, row('tan', 'θ', '=', frac(row('sin', 'θ'), row('cos', 'θ'))), X, eqY, { size: 46, stroke: C.tan, padY: 12, alpha: eq });

    // ——— d, m2: sin²θ + cos²θ = 1
    const pyth = tw(t, at('one2') - lead, 0.5) * (1 - tw(t, at('q') - 0.3, 0.5));
    const sqNode = row(sup('sin', tag('two', '2')), 'θ', '+', sup('cos', '2'), 'θ', '=', '1');
    if (pyth > 0) {
      const m = formulaBox(ctx, sqNode, X, 460, { size: 54, padY: 18, alpha: pyth });
      const sqLit = focus(t, [at('sq')], at('m2.end'), cue).level[0];
      ringBox(ctx, m.parts.two, sqLit, C.accent);
      if (sqLit > 0 || t > at('sq')) {
        math(ctx, row(sup('sin', '2'), 'θ', jp('は'), sup(row('(', 'sin', 'θ', ')'), '2'), jp('のこと')), X, 540, { size: 30, alpha: pyth * tw(t, at('sq'), 0.5), color: C.muted });
      }
    }

    // e: the two areas laid end to end: always the length of 1
    const bar = tw(t, at('try') - lead, 0.5) * (1 - tw(t, at('q') - 0.3, 0.5));
    if (bar > 0) {
      const s2 = Math.sin(deg * RAD) ** 2;
      const L = 560;
      const by = 640;
      ctx.save();
      ctx.globalAlpha *= bar;
      ctx.fillStyle = C.sinSoft;
      ctx.fillRect(X, by, L * s2, 46);
      ctx.fillStyle = C.cosSoft;
      ctx.fillRect(X + L * s2, by, L * (1 - s2), 46);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(X, by, L, 46);
      ctx.fillStyle = C.sin;
      ctx.fillRect(X + L * s2 - 1, by, 2, 46);
      ctx.restore();
      math(ctx, sup('sin', '2'), X + (L * s2) / 2, by + 34, { size: 26, align: 'center', color: C.sin, alpha: bar * clamp(s2 * 6) });
      math(ctx, sup('cos', '2'), X + L * s2 + (L * (1 - s2)) / 2, by + 34, { size: 26, align: 'center', color: C.cos, alpha: bar * clamp((1 - s2) * 6) });
      text(ctx, '1', X + L + 20, by + 34, { font: F.sans(500, 30), color: C.ink, alpha: bar });
      const always = focus(t, [at('always')], at('e.end'), cue).level[0];
      ring(ctx, X - 6, by - 6, L + 52, 58, always, C.accent);
    }

    // ——— m3 to m4: the problem
    const q = tw(t, at('q') - lead, 0.5);
    if (q > 0) {
      const lines = [
        workLine(ctx, row('sin', 'θ', '=', '0.6'), X, 200, q, { size: 46 }),
        workLine(ctx, row(sup('0.6', '2'), '=', '0.36'), X, 300, tw(t, at('p1') - lead, 0.5), { size: 42 }),
        workLine(ctx, row(sup('cos', '2'), 'θ', '=', '1', '−', '0.36', '=', '0.64'), X, 380, tw(t, at('p2') - lead, 0.5), { size: 42 }),
        workLine(ctx, row('cos', 'θ', '=', colored(C.accent, '0.8')), X, 460, tw(t, at('p3') - lead, 0.5), { size: 42 }),
        workLine(ctx, row('tan', 'θ', '=', frac('0.6', '0.8'), '=', colored(C.accent, '0.75')), X, 570, tw(t, at('p4') - lead, 0.5), { size: 42 }),
      ];
      sideLabel(ctx, T, 'height', '0.6', { size: 32, alpha: q });
      sideLabel(ctx, T, 'base', '0.8', { size: 32, alpha: tw(t, at('p3') - lead, 0.5) });
      sideLabel(ctx, T, 'hyp', '1', { size: 34, color: C.ink, alpha: q });
      const all = focus(t, [at('all')], at('m4.end') - cue.fall, cue).level[0];
      ringBox(ctx, lines.map((l) => l.rect), all, C.accent, 16);
    }

    // a: the three definitions to play with, top right
    const play = tw(t, at('a'), 0.5) * (1 - tw(t, at('div') - lead, 0.4));
    ['s', 'c', 't'].forEach((L, i) => math(ctx, definition(L), X, 200 + i * 130, { size: 42, alpha: play }));
  },
});

// Squares on the three sides, outward: blue on the height, green on the base, an outline on
// the hypotenuse.
function squares(ctx, T, a) {
  const sq = (p, q, fill, stroke) => {
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    // outward: away from the third corner
    const g = { x: (T.A.x + T.B.x + T.C.x) / 3, y: (T.A.y + T.B.y + T.C.y) / 3 };
    let n = { x: dy, y: -dx };
    const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    if ((mid.x - g.x) * n.x + (mid.y - g.y) * n.y < 0) n = { x: -n.x, y: -n.y };
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.lineTo(q.x + n.x, q.y + n.y);
    ctx.lineTo(p.x + n.x, p.y + n.y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  ctx.save();
  ctx.globalAlpha *= a;
  sq(T.C, T.B, C.sinSoft, C.sin);
  sq(T.A, T.C, C.cosSoft, C.cos);
  sq(T.A, T.B, null, C.ink);
  ctx.restore();
}
