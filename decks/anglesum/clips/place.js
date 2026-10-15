// 3-1: proof 2 begins. Translations and rotations keep the inner product, so they keep angles:
// the triangle of proof 1 may be moved until A is the origin and B lies on the positive x axis.
// A rotation keeps the counterclockwise order, so C lands in the upper half-plane:
// A = (0, 0), B = (L, 0), C = (p, h) with L > 0, h > 0. p is any real number; p < 0 makes α
// obtuse, p > L makes β obtuse.

import { clip } from '../lib/clip.js';
import { C, CORNER } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp, keys } from '../../../src/kit/ease.js';
import { plane, toPx, v2, seg, dot, label } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';
import { posed, drawTri, names, cornerAngle } from '../lib/tri.js';
import { PS, L, H, P, drawPlane } from '../lib/proof2.js';
import { POSE, PT } from '../lib/proof1.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const script = [
  { id: 'move', label: '動かしてよい', text: '証明 2 を始めるわ。\n{inv}平行移動と回転は、内積を変えないから、なす角も変えない。' },
  { id: 'put', lead: 1.8, label: 'A を原点に', text: `{go}だから、三角形を動かして、${say('A', 'エー')} を原点に、${say('B', 'ビー')} を ${say('x', 'エックス')} 軸の正の部分に置いてよいの。` },
  { id: 'up', label: 'C は上に', text: `回転は、反時計回りの並びも変えない。\n{c}だから ${say('C', 'シー')} は、上半平面に来るわ。` },
  {
    id: 'coords',
    label: '座標',
    text: `{a}${say('A ＝ (0, 0)', 'エー、イコール、ゼロゼロ')}、{b}${say('B ＝ (L, 0)', 'ビー、イコール、エルゼロ')}、{cc}${say('C ＝ (p, h)', 'シー、イコール、ピーエイチ')} と書けて、\n{pos}${say('L', 'エル')} と ${say('h', 'エイチ')} は[正|セイ]よ。`,
  },
  { id: 'p', label: 'p は実数', tail: 1.3, text: `{pp}${say('p', 'ピー')} は、どんな実数でもいい。\n{neg}${say('p', 'ピー')} が[負|フ]なら ${say('α', 'アルファ')} が、{big}${say('p', 'ピー')} が ${say('L', 'エル')} より大きければ ${say('β', 'ベータ')} が、鈍角になるのよ。` },
];

const FX = 70;

export default clip({
  id: 'place',
  title: '座標の設定',
  kicker: '証明 2',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;

    // put: from proof 1's pose to A at the origin, B on the x axis
    const mv = inOutCubic(span(t, at('put'), at('put.voice')));
    const Pl = plane(lerp(PT.ox, PS.ox, mv), lerp(PT.oy, PS.oy, mv), lerp(PT.k, PS.k, mv));
    // p: C slides along y = h to make α, then β, obtuse, and comes back
    const p = keys(t, [
      [at('neg') - 0.2, P],
      [at('neg') + 0.9, -0.9],
      [at('big') - 0.2, -0.9],
      [at('big') + 1.0, 3.4],
      [at('p.end'), 3.4],
      [at('p.end') + 1.1, P],
    ]);
    const T = posed(POSE * (1 - mv), v2(0, 0), { A: v2(0, 0), B: v2(L, 0), C: v2(p, H) });

    drawPlane(ctx, { alpha: k.in('put.voice'), circle: 0 });

    // up: the upper half-plane
    const cIn = k.in('c');
    if (cIn > 0.001) {
      ctx.save();
      ctx.globalAlpha *= cIn * 0.35;
      ctx.fillStyle = '#e3ecff';
      ctx.fillRect(0, 0, 1600, PS.oy);
      ctx.restore();
      tex(ctx, R`y > 0`, 1420, 120, { size: 34, color: C.A, alpha: cIn });
    }

    const tri = drawTri(ctx, Pl, T, { alpha: k.in('move') });
    const nm = names(ctx, Pl, T, { alpha: k.in('move') });
    const avoid = [...tri.shapes, ...Object.values(nm).map((b) => ({ kind: 'rect', ...b }))];
    for (const c of ['A', 'B', 'C']) cornerAngle(ctx, Pl, T, c, { alpha: k.in('inv'), avoid, r: 44 });

    // coords: the coordinates, and L, h, p on the figure
    const O = toPx(PS, v2(0, 0));
    const B = toPx(PS, v2(L, 0));
    const Cp = toPx(PS, v2(p, H));
    const foot = toPx(PS, v2(p, 0));
    const lIn = k.in('pos');
    seg(ctx, { x: O.x, y: O.y + 46 }, { x: B.x, y: B.y + 46 }, { color: C.ink2, lw: 2, alpha: lIn });
    seg(ctx, { x: O.x, y: O.y + 36 }, { x: O.x, y: O.y + 56 }, { color: C.ink2, lw: 2, alpha: lIn });
    seg(ctx, { x: B.x, y: B.y + 36 }, { x: B.x, y: B.y + 56 }, { color: C.ink2, lw: 2, alpha: lIn });
    tex(ctx, 'L', (O.x + B.x) / 2, O.y + 88, { size: 34, align: 'center', alpha: lIn });
    seg(ctx, foot, Cp, { color: C.ink2, lw: 2, dash: [7, 6], alpha: lIn });
    label(ctx, 'h', { x: foot.x, y: (foot.y + Cp.y) / 2 }, { x: p < L / 2 ? -1 : 1, y: 0 }, [], { size: 32, alpha: lIn, gap: 8, fixed: true });
    dot(ctx, foot, { r: 5, color: C.ink2, alpha: k.in('cc') });
    label(ctx, 'p', foot, { x: 0.3, y: 1 }, [], { size: 30, color: C.ink2, alpha: k.in('cc'), gap: 22, fixed: true });

    formulaBox(
      ctx,
      [
        { src: R`A = (0, 0)`, alpha: k.in('a') },
        { src: R`B = (L, 0)`, alpha: k.in('b') },
        { src: R`C = (p, h)`, alpha: k.in('cc') },
        { src: R`L > 0,\ \ h > 0,\ \ p\in\mathbf{R}`, alpha: k.in('pos'), size: 36 },
      ],
      FX + 20,
      300,
      { size: 42, alpha: k.in('a'), title: '座標' },
    );
    tex(ctx, R`p = ${p.toFixed(2)}`, FX + 30, 640, { size: 36, color: C.ink2, alpha: k.in('pp') });
    const obtuse = (c) => {
      const T0 = { A: v2(0, 0), B: v2(L, 0), C: v2(p, H) };
      const d1 = c === 'A' ? v2(L, 0) : v2(-L, 0);
      const d2 = c === 'A' ? v2(p, H) : v2(p - L, H);
      void T0;
      return Math.acos((d1.x * d2.x + d1.y * d2.y) / (Math.hypot(d1.x, d1.y) * Math.hypot(d2.x, d2.y))) > Math.PI / 2;
    };
    tex(ctx, R`\alpha > \frac{\pi}{2}`, FX + 30, 720, { size: 36, color: CORNER.A, alpha: k.in('neg') * (obtuse('A') ? 1 : 0) });
    tex(ctx, R`\beta > \frac{\pi}{2}`, FX + 30, 720, { size: 36, color: CORNER.B, alpha: k.in('big') * (obtuse('B') ? 1 : 0) });
    void tw;
  },
});
