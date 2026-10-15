// 1-7: the angles of a set square. The table is all odd decimals, but ずんだもん suspects the
// set squares' angles come out exactly. 45°: a right isosceles triangle, legs 1, hypotenuse
// √2. 30° and 60°: half an equilateral triangle, hypotenuse 2, short side 1, the other √3 —
// and looked at from 30° or from 60°, height and base swap. めたん fills the table of exact
// values: drum this in too.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { seg, tw, inOutCubic, outBack, clamp, lerp } from '../../../src/kit/ease.js';
import { text, rr } from '../../../src/kit/draw.js';
import { focus, ring } from '../../../src/kit/cue.js';
import { drawTri, angleArc, sideLabel, mixTri, corners, label } from '../lib/tri.js';
import { math, row, frac, sqrt } from '../lib/math.js';
import { trigTable } from '../lib/table.js';

// the 45° triangle (legs 300 px = 1)
const T45 = corners(45, 300, { x: 150, y: 470 });
// the equilateral triangle (side 340 px = 2) and its half
const EQ = { L: { x: 150, y: 840 }, R: { x: 490, y: 840 }, top: { x: 320, y: 840 - 340 * Math.sin(Math.PI / 3) } };
const HALF = { A: EQ.L, C: { x: 320, y: 840 }, B: EQ.top }; // 60° at A
// the two ways to look at it: from 30° and from 60°
const V30 = corners(30, 170 * Math.sqrt(3), { x: 120, y: 840 });
const V60 = corners(60, 170, { x: 540, y: 840 });

const script = [
  { id: 'a', label: '半端な数', text: '{odd}表の値は、[0.7813|レイテンナナハチイチサン] みたいに、半端な数ばかりなのだ。' },
  { id: 'b', label: '三角定規の角', text: 'でも、{sq}三角定規の角なら、ぴったり求められる気がするのだ！' },
  { id: 'c', label: '45 度', text: 'まず、{p45}45 度の三角定規なのだ。{eq}直角をはさむ二辺の長さが、同じなのだ。' },
  { id: 'd', label: 'ルート 2', text: '{one}二辺を 1 にすると、斜辺は……三平方の定理で、{r2}ルート 2 なのだ。' },
  { id: 'm1', by: 'metan', label: '45° の値', text: 'そうね。だから、{s45}[sin 45°|サインヨンジュウゴド] と [cos 45°|コサインヨンジュウゴド] は、どちらも[ルート 2 分の 1|ルートニブンノイチ] で、{t45}[tan 45°|タンジェントヨンジュウゴド] は 1 になるわ。' },
  { id: 'e', label: '正三角形の半分', text: '次は、{p30}30 度と 60 度の三角定規なのだ。これは……{half}正三角形を、半分に切った形なのだ！' },
  { id: 'f', label: '2、1、ルート 3', text: '{two}斜辺を 2 にすると、{one2}いちばん短い[辺|ヘン]は、その半分の 1 で、{r3}残りの[辺|ヘン]は、三平方の定理でルート 3 なのだ。' },
  { id: 'm2', by: 'metan', label: '見る角で入れ替わる', lead: 1.2, text: 'いいわね。{look}30 度の角から見るか、60 度の角から見るかで、{swap}高さと底辺が入れ替わるから、気をつけて。' },
  { id: 'g', label: '30° と 60°', text: '{v30}30 度から見ると、高さが 1 で、底辺がルート 3。{v60}60 度から見ると、それが逆になるのだ。' },
  { id: 'm3', by: 'metan', label: 'この表も', text: 'これで、{all}三つの角の値が、すべて出せるわね。{drum}この表も、頭に叩き込みなさい。' },
  { id: 'h', label: 'また暗記', text: '{again}また暗記なのだ……。' },
];

// the exact values, row by row
const EXACT = {
  30: [frac('1', '2'), frac(sqrt('3'), '2'), frac('1', sqrt('3'))],
  45: [frac('1', sqrt('2')), frac('1', sqrt('2')), row('1')],
  60: [frac(sqrt('3'), '2'), frac('1', '2'), sqrt('3')],
};
const TBL = { x: 880, y: 150, degW: 120, colW: 170, headH: 70, rowH: 130 };

export default clip({
  id: 'special',
  title: '特別な角',
  cast: ['metan', 'zunda'],
  script,

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;

    // a: the table of 1-4, its odd decimals
    const odd = tw(t, at('a'), 0.5) * (1 - tw(t, at('sq') - lead, 0.5));
    const rows = Array.from({ length: 9 }, (_, i) => 34 + i);
    trigTable(ctx, 880, 220, { rows, alpha: odd, hi: { deg: 38, col: 'tan', level: focus(t, [at('odd')], at('a.end'), cue).level[0] } });

    // b: two set squares
    const plates = tw(t, at('sq') - lead, 0.6, outBack);
    const to45 = inOutCubic(seg(t, at('p45') - 0.2, at('p45') + 0.6));
    const to30 = inOutCubic(seg(t, at('p30') - 0.2, at('p30') + 0.6));
    if (plates > 0) {
      const P45 = mixTri(corners(45, 330, { x: 170, y: 480 }), T45, to45);
      plate(ctx, P45, clamp(plates) * (1 - 0.75 * to45) * (1 - tw(t, at('m1'), 0.6)));
      const P30 = mixTri(corners(30, 440, { x: 170, y: 840 }), { A: HALF.B, C: HALF.C, B: HALF.A }, to30);
      plate(ctx, P30, clamp(plates) * (1 - 0.75 * to30) * (1 - tw(t, at('look'), 0.4)));
    }

    // c, d: 45°, legs 1, hypotenuse √2
    const t45 = to45;
    if (t45 > 0) {
      drawTri(ctx, T45, { lw: 5, alpha: t45 });
      angleArc(ctx, T45.A, T45.C, T45.B, { r: 60, label: '45°', size: 28, alpha: t45, labelR: 104 });
      angleArc(ctx, T45.B, T45.A, T45.C, { r: 50, label: '45°', size: 24, alpha: t45, color: C.muted, labelColor: C.muted });
      const eq = focus(t, [at('eq')], at('c.end'), cue).level[0];
      tick(ctx, T45.A, T45.C, eq > 0 ? C.accent : C.ink2, t45);
      tick(ctx, T45.C, T45.B, eq > 0 ? C.accent : C.ink2, t45);
      sideLabel(ctx, T45, 'base', '1', { off: 30, size: 32, alpha: tw(t, at('one') - lead, 0.5) });
      sideLabel(ctx, T45, 'height', '1', { off: 30, size: 32, alpha: tw(t, at('one') - lead, 0.5) });
      sideLabel(ctx, T45, 'hyp', sqrt('2'), { off: 44, size: 34, color: C.ink, alpha: tw(t, at('r2') - lead, 0.5, outBack) });
    }

    // e, f: the equilateral triangle, cut in half; 2, 1, √3
    const eqA = tw(t, at('half') - lead, 0.5) * (1 - tw(t, at('look'), 0.6));
    if (eqA > 0) {
      ctx.save();
      ctx.globalAlpha *= eqA;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(EQ.L.x, EQ.L.y);
      ctx.lineTo(EQ.R.x, EQ.R.y);
      ctx.lineTo(EQ.top.x, EQ.top.y);
      ctx.closePath();
      ctx.stroke();
      // the cut
      const cut = seg(t, at('half'), at('half') + 0.6);
      ctx.strokeStyle = C.accent;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(EQ.top.x, EQ.top.y);
      ctx.lineTo(EQ.top.x, lerp(EQ.top.y, EQ.L.y, cut));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      const halfA = eqA * tw(t, at('half') + 0.5, 0.4);
      drawTri(ctx, HALF, { lw: 6, alpha: halfA });
      angleArc(ctx, HALF.A, HALF.C, HALF.B, { r: 50, label: '60°', size: 26, alpha: halfA, labelR: 88 });
      angleArc(ctx, HALF.B, HALF.A, HALF.C, { r: 50, label: '30°', size: 26, alpha: halfA, labelR: 84 });
      sideLabel(ctx, HALF, 'hyp', '2', { off: 34, size: 32, color: C.ink, alpha: eqA * tw(t, at('two') - lead, 0.5) });
      sideLabel(ctx, HALF, 'base', '1', { off: 30, size: 32, alpha: eqA * tw(t, at('one2') - lead, 0.5) });
      sideLabel(ctx, HALF, 'height', sqrt('3'), { off: 46, size: 32, color: C.sin, alpha: eqA * tw(t, at('r3') - lead, 0.5, outBack) });
    }

    // m2, g: the two ways to look at it
    const look = inOutCubic(seg(t, at('m2'), at('m2') + 1.2));
    if (look > 0) {
      // from 60°: the half as it stands; from 30°: the half flipped over its diagonal
      const from30 = mixTri({ A: HALF.B, C: HALF.C, B: HALF.A }, V30, look);
      const from60 = mixTri(HALF, V60, look);
      const g = focus(t, [at('v30'), at('v60')], at('g.end'), cue);
      for (const [U, deg, lit, labels] of [[from30, 30, g.level[0], ['1', sqrt('3')]], [from60, 60, g.level[1], [sqrt('3'), '1']]]) {
        drawTri(ctx, U, { lw: 6, plain: look < 0.5 });
        angleArc(ctx, U.A, U.C, U.B, { r: 46, label: `${deg}°`, size: 26, alpha: look, labelR: deg === 30 ? 112 : 86 });
        sideLabel(ctx, U, 'height', labels[0], { off: 40, size: 30, alpha: look });
        sideLabel(ctx, U, 'base', labels[1], { off: 30, size: 30, alpha: look });
        sideLabel(ctx, U, 'hyp', '2', { off: 34, size: 30, color: C.ink, alpha: look });
        if (lit > 0) ring(ctx, U.A.x - 20, U.B.y - 20, U.C.x - U.A.x + 90, U.A.y - U.B.y + 70, lit, C.accent);
      }
    }

    // m1 onward: the table of exact values
    const tbl = tw(t, at('m1') - lead, 0.6);
    const fill = { 45: tw(t, at('s45') - lead, 0.5), 30: tw(t, at('v30') - lead, 0.5), 60: tw(t, at('v60') - lead, 0.5) };
    const frame = tw(t, at('drum') - lead, 0.4, outBack);
    exactTable(ctx, tbl, fill, clamp(frame));
    // h: the stamp
    const stamp = tw(t, at('again') - 0.05, 0.3, outBack);
    if (stamp > 0) {
      ctx.save();
      ctx.globalAlpha *= clamp(stamp);
      ctx.translate(TBL.x + TBL.degW + TBL.colW * 3 - 30, TBL.y - 6);
      ctx.rotate(0.18);
      ctx.scale(lerp(1.6, 1, clamp(stamp)), lerp(1.6, 1, clamp(stamp)));
      rr(ctx, -70, -28, 140, 56, 10);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 4;
      ctx.stroke();
      text(ctx, '暗記', 0, 13, { font: F.jp(700, 34), color: C.accent, align: 'center' });
      ctx.restore();
    }
  },
});

function exactTable(ctx, a, fill, frame) {
  if (a <= 0.001) return;
  const { x, y, degW, colW, headH, rowH } = TBL;
  const w = degW + colW * 3;
  const h = headH + rowH * 3;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, y, w, h, 14);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.strokeStyle = frame > 0 ? C.accent : C.rule;
  ctx.lineWidth = frame > 0 ? 3 + 3 * frame : 2;
  ctx.stroke();
  text(ctx, 'θ', x + degW / 2, y + 46, { font: F.sans(400, 30), color: C.ink, align: 'center' });
  ['sin', 'cos', 'tan'].forEach((c, i) => math(ctx, row(c, 'θ'), x + degW + colW * (i + 0.5), y + 46, { size: 30, color: { sin: C.sin, cos: C.cos, tan: C.tan }[c], align: 'center' }));
  ctx.fillStyle = C.ink;
  ctx.fillRect(x + 12, y + headH - 2, w - 24, 2);
  [30, 45, 60].forEach((deg, r) => {
    const ry = y + headH + rowH * r;
    label(ctx, `${deg}°`, x + degW / 2, ry + rowH / 2, { size: 30, font: F.mono(500, 30), color: C.ink2 });
    const f = fill[deg];
    EXACT[deg].forEach((nd, i) => math(ctx, nd, x + degW + colW * (i + 0.5), ry + rowH / 2 + 14, { size: 40, align: 'center', alpha: f }));
  });
  ctx.restore();
}

// A set square: a translucent plate with a hole in it.
function plate(ctx, T, a) {
  if (a <= 0.001) return;
  const g = { x: (T.A.x + T.B.x + T.C.x) / 3, y: (T.A.y + T.B.y + T.C.y) / 3 };
  const inner = ['A', 'B', 'C'].map((k) => ({ x: g.x + (T[k].x - g.x) * 0.42, y: g.y + (T[k].y - g.y) * 0.42 }));
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.beginPath();
  ctx.moveTo(T.A.x, T.A.y);
  ctx.lineTo(T.C.x, T.C.y);
  ctx.lineTo(T.B.x, T.B.y);
  ctx.closePath();
  ctx.moveTo(inner[0].x, inner[0].y);
  ctx.lineTo(inner[1].x, inner[1].y);
  ctx.lineTo(inner[2].x, inner[2].y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(120, 170, 210, 0.22)';
  ctx.fill('evenodd');
  ctx.strokeStyle = '#6f97b8';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

// A small mark across the middle of a side: sides with the same mark are equal.
function tick(ctx, p, q, color, a) {
  const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  const l = Math.hypot(q.x - p.x, q.y - p.y);
  const n = { x: -(q.y - p.y) / l, y: (q.x - p.x) / l };
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(m.x - n.x * 12, m.y - n.y * 12);
  ctx.lineTo(m.x + n.x * 12, m.y + n.y * 12);
  ctx.stroke();
  ctx.restore();
}
