// 扉: the theorem on a card. ずんだもん reads it and laughs it off (180°, every child knows);
// she strikes out 「難解な」. めたん asks what number α, β, γ and π each are, and lays out the
// way: first define angle, step by step from the inner product, then prove it twice.

import { clip } from '../lib/clip.js';
import { C, CORNER, F } from '../lib/theme.js';
import { tw, outBack } from '../../../src/kit/ease.js';
import { ringBox } from '../../../src/kit/cue.js';
import { text, measure } from '../../../src/kit/draw.js';
import { plane, toPx, arrow } from '../lib/geo.js';
import { TRI, drawTri, cornerAngle, names } from '../lib/tri.js';
import { tex, card, pill, strike } from '../lib/math.js';

const R = String.raw;
const script = [
  { id: 'read', by: 'zunda', label: '難解な定理', text: '「難解な定理」……。{stmt}三角形の内角の和は、[π|パイ] ラジアン？' },
  { id: 'easy', by: 'zunda', speed: 'fast', label: '180°', text: '{deg}180 度のことなのだ。そんなの、{kid}小学生でも知っているのだ！' },
  { id: 'what', label: '何の数か', text: 'では、{a}[α|アルファ]、{b}[β|ベータ]、{g}[γ|ガンマ] は、それぞれ何の数かしら。{pi}[π|パイ] ラジアンは、何を測った値なの？' },
  { id: 'define', label: '角度を定める', text: '証明するには、まず、{chain}角度を数として定める必要があるわ。' },
  { id: 'two', label: '二通りに証明', text: 'そのうえで、この定理を、{proofs}二通りに証明するの。' },
];

// the card and the triangle on it
const CARD = { x: 110, y: 96, w: 900, h: 520 };
const P = plane(250, 540, 150);
const TAB = '難解な定理';
const TS = 26;
const CHAIN = ['内積', '長さ', '単位円', '弧の長さ', '角', '回転角'];

export default clip({
  id: 'opening',
  title: '難解な定理',
  numbered: false,
  script,

  draw(ctx, t, _, k) {
    const { at, pace } = k;
    const lead = pace.cue.lead;

    // the card with its title on a tab
    const cardIn = k.in('read');
    card(ctx, CARD.x, CARD.y, CARD.w, CARD.h, { stroke: C.ink, lw: 2.5, alpha: cardIn });
    const tabW = measure(ctx, F.jp(700, TS), TAB) + TS * 1.2;
    const tab = { x: CARD.x + 22, y: CARD.y - TS * 0.75, w: tabW, h: TS * 1.5 };
    if (cardIn > 0.001) {
      ctx.save();
      ctx.globalAlpha *= cardIn;
      ctx.beginPath();
      ctx.roundRect(tab.x, tab.y, tab.w, tab.h, tab.h / 2);
      ctx.fillStyle = C.ink;
      ctx.fill();
      text(ctx, TAB, tab.x + tab.w / 2, CARD.y + TS * 0.36, { font: F.jp(700, TS), color: C.white, align: 'center' });
      ctx.restore();
    }
    // ずんだもん strikes out 難解な
    const hard = { x: tab.x + TS * 0.6, y: tab.y + 4, w: measure(ctx, F.jp(700, TS), '難解な'), h: tab.h - 8 };
    strike(ctx, hard, tw(t, at('kid') - 0.05, 0.4), { color: C.accent, lw: 4 });

    // the statement
    const sIn = k.in('stmt');
    const st = tex(ctx, R`\text{三角形の内角の和は}\ \el{pi}{\pi}\ \mathrm{rad}`, CARD.x + 48, CARD.y + 108, { size: 50, alpha: sIn });
    const deg = tex(ctx, R`=180^\circ`, st.rect.x + st.rect.w + 18, CARD.y + 108, { size: 44, color: C.ink2, alpha: k.in('deg') });

    // the triangle, its angles and the sum
    const T = TRI;
    const tri = drawTri(ctx, P, T, { alpha: sIn });
    const nm = names(ctx, P, T, { alpha: sIn, size: 34 });
    const avoid = [...tri.shapes, ...Object.values(nm).map((b) => ({ kind: 'rect', ...b }))];
    const ang = {};
    for (const [i, key] of ['A', 'B', 'C'].entries()) ang[key] = cornerAngle(ctx, P, T, key, { alpha: k.in('stmt', i + 1), avoid });
    const sum = tex(ctx, R`\el{a}{\alpha}+\el{b}{\beta}+\el{g}{\gamma}=\el{pi}{\pi}`, 655, 430, {
      size: 50,
      alpha: k.in('stmt', 4),
      colors: { a: CORNER.A, b: CORNER.B, g: CORNER.C },
    });

    // what number is each? α, β, γ and π are pointed at in turn
    const q = k.lit(['a', 'b', 'g', 'pi'], 'what.end');
    const marks = [ang.A.box, ang.B.box, ang.C.box, st.parts.pi];
    marks.forEach((b, i) => {
      ringBox(ctx, b, q.level[i], C.accent, 6);
      const shown = tw(t, at(['a', 'b', 'g', 'pi'][i]) - lead, 0.35, outBack);
      if (b && shown > 0.001) text(ctx, '?', b.x + b.w + 10, b.y + 8, { font: F.jp(700, 30), color: C.accent, alpha: shown * (1 - tw(t, at('define'), 0.4)) });
    });
    ringBox(ctx, [sum.parts.a, sum.parts.b, sum.parts.g, sum.parts.pi], 0, C.accent);

    // the way: what is defined, in order
    const X = 1150;
    const Y0 = 120;
    const DY = 84;
    CHAIN.forEach((w, i) => {
      const a = k.in('chain', i);
      const y = Y0 + i * DY;
      pill(ctx, w, X, y, { align: 'center', size: 26, color: i >= 4 ? C.accent : C.ink2, alpha: a });
      if (i > 0) arrow(ctx, { x: X, y: y - DY + 26 }, { x: X, y: y - 26 }, { color: C.muted, lw: 2.5, head: 12, alpha: a });
    });
    text(ctx, '定める順', X, Y0 - 52, { font: F.jp(700, 24), color: C.muted, align: 'center', alpha: k.in('chain') });

    // and the two proofs
    const pr = [
      ['証明 1', '回転角の和'],
      ['証明 2', '角度の積分表示'],
    ];
    pr.forEach(([no, name], i) => {
      const a = k.in('proofs', i);
      const x = 160 + i * 460;
      card(ctx, x, 690, 420, 120, { stroke: C.ink, lw: 2, alpha: a });
      text(ctx, no, x + 30, 762, { font: F.jp(700, 34), color: C.accent, alpha: a });
      text(ctx, name, x + 150, 762, { font: F.jp(700, 34), color: C.ink, alpha: a });
    });
    void deg;
  },
});
