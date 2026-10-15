// 1-1: too big to measure, so draw it small. Joined from the opening's last frame (the tree's
// triangle on squared paper), ずんだもん moves it aside, recalls that triangles with the same
// angles are similar, and draws one on the paper with a 10-square base and a 38° angle. She
// counts about 7.8 squares up: the height is 0.78 of the base, so the tree is about 14 m.
//
// One square of her drawing is one square of the stage's paper (40 px), so the counting
// happens on the grid the viewer sees.
//
// The corners are named so that the names say which corner matches which: the tree's triangle
// is ABC (A where the angle is measured, B the top, C the right angle) and her drawing DEF,
// D, E, F answering to A, B, C. Each of her corners is named as she draws it.

import { clip } from '../lib/clip.js';
import { C, F, SQ } from '../lib/theme.js';
import { seg, tw, lerp, inOutCubic, outBack, clamp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { focus, ringBox, enter } from '../../../src/kit/cue.js';
import { rect, segment } from '../../../src/kit/place.js';
import { treeTriangle, TREE } from '../lib/scene.js';
import { corners, mixPose, drawTri, ghostTri, angleArc, angleAt, angleShape, placeLabel, label, vertexLabel, triShapes, RAD } from '../lib/tri.js';
import { math, row, frac, tag } from '../lib/math.js';
import { protractor, pill } from '../lib/parts.js';

const BIG0 = { x: TREE.A.x, y: TREE.A.y, s: 1 };
const BIG1 = { x: 120, y: 600, s: 0.6 };
// her drawing: A on a grid crossing, a base of 10 squares
const SMALL = { x: 800, y: 680, base: 10 * SQ };
const H78 = SMALL.base * Math.tan(38 * RAD); // 7.81 squares
// how long she takes to draw the two other sides (the hypotenuse is the first 0.55 of it),
// and the protractor's radius
const DRAW = 1.4;
const HYP = 0.55;
const PROT = 150;

const script = [
  { id: 'a', label: '18 m と 38°', text: '木までの距離は{d18} 18 メートルで、見上げる角度は{d38} 38 度。知りたいのは、{ask}この縦の[辺|ヘン]の長さなのだ。' },
  { id: 'b', label: '小さく描く', lead: 1.0, text: '大きすぎて測れないなら、同じ形の、{small}小さい三角形を描けばいいのだ。' },
  { id: 'c', label: '相似', text: '{same}角度が同じなら、形も同じになる。中学でやった、{sim}相似なのだ。' },
  { id: 'd', label: '方眼紙に描く', tail: 0.8, text: '方眼紙に、{base}底辺を 10 マスにして、{deg}38 度の角をはかって{draw}描くのだ。' },
  { id: 'e', label: '7.8 マス', text: '縦の[辺|ヘン]のマスを{count}数えると……{n78}だいたい [7.8|ナナテンハチ] マスなのだ。' },
  { id: 'f', label: '0.78 倍', text: 'つまり、縦の[辺|ヘン]は、{ratio}底辺のだいたい [0.78|レイテンナナハチ] 倍になっているのだ。' },
  { id: 'g', label: '木も 0.78 倍', text: '形が同じなら、{big}大きい三角形でも、縦の[辺|ヘン]は底辺の [0.78|レイテンナナハチ] 倍。{mul}木の高さは、18 メートルの [0.78|レイテンナナハチ] 倍で……' },
  { id: 'h', label: '約 14 m', speed: 'fast', text: '{ans}だいたい 14 メートルなのだ！　{yay}登らずに、わかったのだ！' },
];

export default clip({
  id: 'small',
  title: '小さく描く',
  join: 'cut',
  cast: ['zunda'],
  script,

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const b = at('b');
    const move = inOutCubic(seg(t, b, b + 1.0));
    const pose = mixPose(BIG0, BIG1, move);

    // ——— the tree's triangle, moved aside; its height is the question until the end
    const ans = at('ans');
    const answer = tw(t, ans - cue.lead, 0.5, outBack);
    const lit = focus(t, [at('d18'), at('d38'), at('ask')], at('a.end'), cue);
    const bigLit = tw(t, at('big') - cue.lead, cue.rise) * (1 - tw(t, at('g.end'), cue.fall));
    const { T, box } = treeTriangle(ctx, {
      pose,
      height: answer > 0.5 ? '約 14 m' : '？',
      heightColor: answer > 0.5 ? C.accent : C.sin,
      heightSize: lerp(40, 34, move),
      // the names are ground: in with the first sentence, after the cut from the opening
      names: enter(t, at('a'), pace),
    });
    // the three facts, pointed at as she names them
    const k = Math.max(0.6, pose.s);
    ringBox(ctx, box.dist, lit.level[0], C.accent);
    ringBox(ctx, box.ang, lit.level[1], C.accent);
    ringBox(ctx, box.height, Math.max(lit.level[2], bigLit, answer * (1 - tw(t, at('h.end') - cue.fall, cue.fall))), C.accent);

    // ——— the plan: a copy of the big triangle shrinks onto the paper
    const smallT = corners(38, SMALL.base, { x: SMALL.x, y: SMALL.y });
    const ghostGo = inOutCubic(seg(t, at('small') - 0.2, at('small') + 0.8));
    const drawn = seg(t, at('draw'), at('draw') + DRAW);
    if (ghostGo > 0) {
      const G = corners(38, TREE.base, mixPose(BIG1, { x: SMALL.x, y: SMALL.y, s: SMALL.base / TREE.base }, ghostGo));
      ghostTri(ctx, G, { alpha: 1 - 0.85 * clamp(drawn * 1.5) });
    }

    // similar: the same angle marked twice, and the word
    const same = tw(t, at('same') - cue.lead, 0.5);
    if (same > 0) {
      angleArc(ctx, T.A, T.C, T.B, { r: 46 * k, double: true, color: C.accent, alpha: same * (1 - tw(t, at('d'), 0.4)) });
      angleArc(ctx, smallT.A, smallT.C, smallT.B, { r: 46, double: true, color: C.accent, alpha: same * (1 - tw(t, at('d'), 0.4)) });
    }
    pill(ctx, '相似', 670, 588, { align: 'center', alpha: tw(t, at('sim') - cue.lead, 0.5, outBack) * (1 - tw(t, at('d'), 0.5)) });

    // ——— her drawing, in the order she draws it
    // the base, counted out square by square
    const base = at('base');
    const baseP = seg(t, base - 0.1, base + 1.1);
    const baseCount = Math.floor(baseP * 10 + 1e-6);
    drawTri(ctx, smallT, { lw: 5, right: tw(t, at('draw') + 1.2, 0.3), base: { p: baseP }, hyp: { p: seg(drawn, 0, HYP) }, height: { p: seg(drawn, HYP, 1) } });
    const nums = [];
    for (let i = 1; i <= 10; i++) {
      const on = clamp((baseP * 10 - (i - 1)) * 2);
      nums.push(label(ctx, String(i), SMALL.x + (i - 0.5) * SQ, SMALL.y + 30 - 18 * 0.36, { size: 18, font: F.mono(500, 18), color: C.cos, alpha: on * (1 - tw(t, at('g'), 0.5) * 0.6) }));
    }
    if (baseCount >= 10) text(ctx, '10 マス', SMALL.x + SMALL.base / 2, SMALL.y + 64, { font: F.jp(700, 26), color: C.cos, align: 'center', alpha: tw(t, base + 1.1, 0.3) });

    // the 38° from a protractor
    const deg = at('deg');
    const prot = tw(t, deg - 0.2, 0.4) * (1 - tw(t, at('draw') + 0.8, 0.4));
    protractor(ctx, smallT.A, { r: PROT, alpha: prot });
    const markA = tw(t, deg + 0.3, 0.3);
    if (markA > 0) {
      const r = PROT;
      const mx = smallT.A.x + Math.cos(-38 * RAD) * r;
      const my = smallT.A.y + Math.sin(-38 * RAD) * r;
      ctx.save();
      ctx.globalAlpha *= markA * (1 - tw(t, at('e'), 0.4));
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(mx, my, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const deg38 = angleAt(ctx, smallT, 'A', { r: 64, label: '38°', size: 28, alpha: tw(t, deg + 0.3, 0.4) });

    // the height, counted up the right side: seven whole squares and most of the eighth
    const count = at('count');
    const n78 = at('n78');
    for (let i = 1; i <= 8; i++) {
      const on = tw(t, count + (i - 1) * 0.16, 0.2);
      if (on <= 0) continue;
      const y1 = SMALL.y - i * SQ;
      const part = i === 8 ? (H78 - 7 * SQ) / SQ : 1;
      ctx.save();
      ctx.globalAlpha *= on * 0.55 * (1 - tw(t, at('g'), 0.5) * 0.7);
      ctx.fillStyle = C.sinSoft;
      ctx.fillRect(smallT.C.x + 4, y1 + SQ * (1 - part), SQ - 8, SQ * part - 2);
      ctx.restore();
      if (i < 8) text(ctx, String(i), smallT.C.x + SQ / 2, y1 + SQ * 0.68, { font: F.mono(500, 18), color: C.sin, align: 'center', alpha: on * (1 - tw(t, at('g'), 0.5) * 0.6) });
    }
    // beside the column of counted squares
    const column = rect(smallT.C.x, smallT.B.y, SQ, smallT.C.y - smallT.B.y);
    const v78 = tw(t, n78 - cue.lead, 0.4, outBack);
    const n78box = placeLabel(ctx, '約 7.8 マス', { x: smallT.C.x, y: (smallT.B.y + smallT.C.y) / 2 }, { x: 1, y: 0 }, [column, ...triShapes(smallT)], { size: 28, color: C.sin, alpha: clamp(v78), gap: 14 });

    // her corners' names, each as she draws the corner: D where she starts the base, F where
    // the base ends, E where the slanted side meets the height. They keep clear of the counted
    // squares, the numbers and the protractor's edge.
    const avoid = [column, segment({ x: smallT.A.x - PROT, y: smallT.A.y }, { x: smallT.A.x + PROT, y: smallT.A.y }, 2), angleShape(smallT.A, smallT.C, smallT.B, 64)];
    const words = [...nums, deg38, n78box];
    vertexLabel(ctx, smallT, 'A', 'D', { avoid, text: words, alpha: tw(t, base - 0.1, 0.3) });
    vertexLabel(ctx, smallT, 'C', 'F', { avoid, text: words, alpha: tw(t, base + 1.1, 0.3) });
    vertexLabel(ctx, smallT, 'B', 'E', { avoid, text: words, alpha: tw(t, at('draw') + DRAW * HYP, 0.3) });

    // 7.8 / 10 = 0.78, under her drawing
    const ratio = tw(t, at('ratio') - cue.lead, 0.5);
    const rLit = focus(t, [at('ratio')], at('f.end'), cue).level[0];
    const mine = math(ctx, row(frac('7.8', '10'), '=', tag('r', '0.78')), SMALL.x + SMALL.base / 2, 820, { size: 44, align: 'center', alpha: ratio });
    ringBox(ctx, mine.parts.r, rLit, C.accent);

    // the same 0.78 carried over to the tree: 18 × 0.78
    const mul = tw(t, at('mul') - cue.lead, 0.5);
    const carry = inOutCubic(seg(t, at('mul') - 0.2, at('mul') + 0.6));
    const tree = math(ctx, row('18', '×', tag('r', '0.78'), ...(answer > 0 ? ['≒', '14'] : [])), 300, 820, { size: 44, align: 'center', alpha: mul });
    if (carry > 0 && carry < 1) {
      // a chip with 0.78 travels from her formula to the tree's
      const from = mine.parts.r;
      const to = tree.parts.r;
      const x = lerp(from.x + from.w / 2, to.x + to.w / 2, carry);
      const y = lerp(from.y + from.h / 2, to.y + to.h / 2, carry) - Math.sin(Math.PI * carry) * 120;
      text(ctx, '0.78', x, y + 15, { font: F.sans(500, 40), color: C.accent, align: 'center' });
    }
  },
});
