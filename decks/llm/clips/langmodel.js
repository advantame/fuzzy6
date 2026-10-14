// 1-2: what a language model is. Top: a model imitates how the real thing behaves and is used
// to predict — the weather model and the language model as two rows of the same shape. Below:
// what the language model imitates. Words do not come in any order; the candidates for the
// next word are bars of different lengths before they are numbers, the rules that sort them
// are stacked as the structure of language, and only then the numbers get their name.
// The dashed slot is named a hole: a language model predicts what goes into a hole in the text,
// and the next word is the case where the hole is at the end. That keeps the clip true of
// masked and diffusion models too; 1-3 (compose) shows the ways of building text from holes.
// ずんだもん's question at the end is the door to the dive (whyai).

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, chip, chipWidth } from '../lib/parts.js';
import { oddsRow, slot } from '../lib/odds.js';
import { text, rr, arrow, path } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outCubic, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

// ——— the two models: what is imitated → the model → what it predicts
const CA = { x: M.l, w: 430 };
const CM = { x: 606, w: 330 };
const CB = { x: 1016, w: W - M.r - 1016 };
const HEAD_Y = 98;
const ROW_Y = [118, 220];
const ROW_H = 84;
const CELL = F.jp(500, 30);
const TABLE_DROP = 170; // the table stands in the middle of the stage until the example needs the room

// ——— the sentence and the candidates for its next word
const WORDS = ['のどが', 'かわいた', 'ので、', '水を'];
const MESS = [3, 1, 0, 2]; // the order the words lie in before they fall into place
const TILT = [-0.06, 0.05, -0.04, 0.07];
const DROP = [26, -14, 30, -8];
const WORD = { font: F.jp(500, 38), h: 64, padX: 16 };
const SENT_Y = 372;
const ROW0 = 500;
const RSTEP = 70;
const SLOT_W = 150;
const ODDS = { chipW: SLOT_W, h: 52, barW: 380 }; // the candidates stand under the slot
const SIDE = 1290; // what the rules make of them, to the right of the numbers
const CAND = [
  { w: '飲んだ', p: 0.6, label: '60%' },
  { w: '買った', p: 0.2, label: '20%' },
  { w: '読んだ', p: 0.0001, label: '0.01%' },
];
const REST = { w: 'そのほか', p: 0.2, label: '約 20%' };

// ——— the rules, stacked
const ST = { x: M.l, y: 524, w: 290, h: 54, gap: 10 };
const LAYERS = ['文法', '言い回し', '意味'];
const DEEP = '知識・考え';
const layerY = (i) => ST.y + i * (ST.h + ST.gap);

export default clip({
  id: 'langmodel',
  title: '言語モデル',
  kicker: '言葉の並び方をまねる',
  cast: ['metan', 'zunda'],
  doors: [{ to: 'whyai', from: 'ask', label: 'なぜ AI の話になる？', by: 'zunda' }],
  script: [
    { id: 'a', text: 'ここで言う「モデル」は、{real}本物のふるまいをまねて、\n{pred}予測に使うものよ。' },
    { id: 'b', still: true, text: '天気のモデルは、{air}空気の動きをまねて、\n{tom}あしたの天気を予測するわね。' },
    { id: 'c', text: '言語モデルがまねるのは、{order}言葉の並び方よ。' },
    { id: 'd', lead: 1.7, text: '言葉は、でたらめには並ばないわ。' },
    { id: 'e', text: '「のどがかわいたので、水を」と来たら、\n次は{c1}「飲んだ」がいちばんありそう。' },
    { id: 'e2', still: true, text: '{c2}「買った」も、ありそう。\n{c3}「読んだ」は、まず来ない。' },
    {
      id: 'f',
      text: '{gr}文法、{ph}言い回し、{me}意味。いくつもの決まりが重なって、\n{split}ありそうな言葉と、ありそうにない言葉が分かれるの。',
    },
    {
      id: 'g',
      still: true,
      text: 'この決まりの重なりが、{st}**言語の構造**。言語モデルは、\nそれをまねて、{nw}文章の穴に入る言葉を予測するのよ。',
    },
    { id: 'h', text: '{notone}予測は、一つに言い切らないわ。\n天気予報が{rain}「降水確率 70%」と言うのと同じ。' },
    { id: 'i', rest: 'short', text: '{read}手がかりになる言葉を見て、{each}穴に入る候補のそれぞれに、\nありそうな度合いを{num}数字で付けるの。' },
    { id: 'i2', still: true, text: 'この数字が、{prob}**確率**よ。' },
    { id: 'j', still: true, text: '{end}穴が、書きかけの文のすぐ先にあれば、\nそれが{that}「次の言葉の予測」になるわ。' },
    { id: 'q', by: 'zunda', text: '言葉の穴埋めをする、というのはわかったのだ。\n{ask}でも、それがどうして AI の話になるのだ？' },
    { id: 'k', text: '短く言うと、言葉の並び方の中に、\n{know}人の知識や考えが入っているからよ。' },
  ],

  prepare(ctx) {
    const lay = (order) => {
      let x = M.l;
      const out = [];
      for (const i of order) {
        const w = chipWidth(ctx, WORDS[i], WORD);
        out[i] = { x, w };
        x += w + 10;
      }
      return { pos: out, end: x };
    };
    const tidy = lay([0, 1, 2, 3]);
    return { tidy: tidy.pos, mess: lay(MESS).pos, slotX: tidy.end + 4 };
  },

  draw(ctx, t, { tidy, mess, slotX }, { at, pace }) {
    const PX = slotX;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    // ——— the two models. The table moves up, out of the way, as sentence d begins.
    const d = at('d');
    ctx.save();
    ctx.translate(0, TABLE_DROP * (1 - inOutCubic(seg(t, d, d + 0.8))));

    // headers: the scheme of sentence a
    const fa = focus(t, [at('real'), at('pred')], at('a.end') - cue.fall, cue);
    const head = (s, x, i, lit) => {
      const al = enter(t, at('a'), pace, i);
      text(ctx, s, x, HEAD_Y, { font: F.jp(700, 20), color: C.ink2, alpha: al });
      if (lit > 0) text(ctx, s, x, HEAD_Y, { font: F.jp(700, 20), color: C.accent, alpha: al * lit });
    };
    head('本物のふるまい', CA.x, 0, fa.level[0]);
    head('それをまねたモデル', CM.x, 1, 0);
    head('モデルが予測するもの', CB.x, 2, fa.level[1]);

    // ——— row 1, the weather model. Its frame comes with sentence a, as the empty scheme.
    const frame1 = enter(t, at('a'), pace, 1);
    const named1 = enter(t, at('b'), pace);
    row(ctx, ROW_Y[0], frame1, {
      a: { s: '空気の動き', al: pop('air') },
      m: { s: named1 > 0.5 ? '天気のモデル' : 'モデル', al: named1 > 0.5 ? seg(named1, 0.5, 1) : 1 - seg(named1, 0, 0.5), note: '物理の法則で計算する（数値予報）', noteAl: named1 },
      b: { s: 'あしたの天気', al: pop('tom') },
    });
    // a forecast is not a single answer either
    tag(ctx, CB.x + CB.w - 18, ROW_Y[0] + 22, '降水確率 70%', { font: F.jp(700, 20), h: 40, padX: 14, fill: C.accent, color: '#fff', alpha: pop('rain'), align: 'right' });

    // ——— row 2, the language model. What it predicts stays open until sentence g says it.
    const frame2 = enter(t, at('c'), pace);
    const st = pop('st', cue.rise + 0.2);
    row(ctx, ROW_Y[1], frame2, {
      a: { s: '言葉の並び方', al: pop('order'), sub: '＝ 言語の構造', subAl: st },
      m: { s: '言語モデル', al: 1, note: '文章のデータから学ぶ', noteAl: frame2 },
      b: { s: '穴に入る言葉', al: pop('nw'), open: 1 - pop('nw') },
    });
    tag(ctx, CB.x + CB.w - 18, ROW_Y[1] + 22, 'それぞれの確率', { font: F.jp(700, 20), h: 40, padX: 14, fill: C.accent, color: '#fff', alpha: pop('prob'), align: 'right' });
    ctx.restore();

    // ——— the sentence: the words lie about, then fall into their order while the voice
    // says that they do not come in any order
    const settle = inOutCubic(seg(t, at('d.voice') + 0.1, at('d.end')));
    const read = focus(t, [at('read')], at('each'), cue);
    WORDS.forEach((s, i) => {
      const al = tw(t, d + 0.8 + MESS.indexOf(i) * 0.12, 0.4);
      if (al <= 0) return;
      const x = lerp(mess[i].x, tidy[i].x, settle);
      const y = SENT_Y + DROP[i] * (1 - settle);
      const w = tidy[i].w;
      ctx.save();
      ctx.translate(x + w / 2, y + WORD.h / 2);
      ctx.rotate(TILT[i] * (1 - settle));
      chip(ctx, -w / 2, -WORD.h / 2, s, { ...WORD, fill: C.tints[i % C.tints.length], alpha: al });
      ctx.restore();
    });
    if (read.level[0] > 0) {
      ctx.fillStyle = C.accent;
      ctx.globalAlpha = read.level[0];
      ctx.fillRect(M.l, SENT_Y + WORD.h + 8, (slotX - 14 - M.l) * tw(t, at('read') - lead, 0.6, outCubic), 6);
      ctx.globalAlpha = 1;
    }

    // ——— the next word: the slot is the question, the candidates the answers
    const e = at('e');
    const asked = enter(t, e, pace);
    slot(ctx, slotX, SENT_Y, SLOT_W, WORD.h, { alpha: asked, lit: asked, blink: Math.floor(t * 2.5) % 2 === 0 });
    // sentence g names the slot a hole; sentence j says where this one is, and what that makes
    // of the prediction
    tag(ctx, slotX + SLOT_W / 2, SENT_Y - 40, '穴', { font: F.jp(700, 20), h: 32, padX: 14, fill: C.accent, color: '#fff', align: 'center', alpha: pop('nw') });
    const endA = pop('end');
    if (endA > 0) {
      const x = slotX + SLOT_W + 22;
      const y = SENT_Y + WORD.h / 2;
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 3;
      arrow(ctx, x + 40, y, x, y, tw(t, at('end') - lead, 0.5, outCubic), 12);
      const w = text(ctx, 'すぐ先の穴', x + 54, y + 9, { font: F.jp(700, 26), color: C.accent, alpha: endA });
      text(ctx, '＝「次の言葉の予測」', x + 54 + w + 12, y + 9, { font: F.jp(700, 26), color: C.ink, alpha: pop('that') });
    }
    const prob = pop('prob');
    const titleW = text(ctx, '次に来る言葉', PX, ROW0 - 22, { font: F.jp(700, 22), color: C.ink2, alpha: asked });
    text(ctx, 'と、その確率', PX + titleW + 6, ROW0 - 22, { font: F.jp(700, 22), color: C.accent, alpha: prob });
    example(ctx, PX + 330, ROW0 - 46, asked, '候補と割合は説明のための例（実際の単位はトークン）');
    const numAt = at('num') - lead;
    const each = focus(t, [at('each')], at('num'), cue);
    CAND.forEach((c, i) => {
      const on = at(`c${i + 1}`);
      oddsRow(ctx, PX, ROW0 + i * RSTEP, c.w, {
        ...ODDS,
        p: c.p,
        alpha: tw(t, on - lead, pace.enter),
        grow: tw(t, on, 0.7, outCubic),
        hot: each.level[0] * seg(t, at('each') + i * 0.12, at('each') + i * 0.12 + 0.2) * 0.6,
        num: tw(t, numAt + i * 0.12, 0.4),
        label: c.label,
      });
    });
    oddsRow(ctx, PX, ROW0 + 3 * RSTEP, REST.w, {
      ...ODDS,
      p: REST.p,
      font: F.jp(500, 22),
      alpha: tw(t, numAt + 0.4, pace.enter) * 0.6,
      grow: tw(t, numAt + 0.4, 0.7, outCubic),
      num: tw(t, numAt + 0.6, 0.4),
      label: REST.label,
    });

    // not one answer: the whole set is the prediction
    const h = focus(t, [at('notone')], at('rain'), cue);
    ring(ctx, PX, ROW0, ODDS.chipW + 18 + ODDS.barW, 2 * RSTEP + ODDS.h, h.level[0], C.accent);

    // ——— the rules that sort the candidates, stacked
    const f = at('f');
    text(ctx, '言葉の並び方の決まり', ST.x, ST.y - 18, { font: F.jp(500, 19), color: C.muted, alpha: enter(t, f, pace) });
    LAYERS.forEach((s, i) => sheet(ctx, layerY(i), s, pop(['gr', 'ph', 'me'][i]), false));
    const know = pop('know');
    sheet(ctx, layerY(3), DEEP, know, true);

    // they sort the candidates: the arrow points at the line between likely and unlikely
    const split = tw(t, at('split') - lead, 0.7, outCubic);
    if (split > 0) {
      const cut = ROW0 + 2 * RSTEP - (RSTEP - ODDS.h) / 2;
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      ctx.lineWidth = 2.5;
      arrow(ctx, ST.x + ST.w + 40, cut, PX - 16, cut, seg(split, 0, 0.6), 12);
      const p2 = seg(split, 0.5, 1);
      const likely = ROW0 + RSTEP / 2 + ODDS.h / 2;
      const unlikely = ROW0 + 2 * RSTEP + ODDS.h / 2;
      ctx.globalAlpha = p2;
      ctx.lineWidth = 2;
      path(ctx, [[SIDE - 22, ROW0 + 6], [SIDE - 14, ROW0 + 6], [SIDE - 14, ROW0 + RSTEP + ODDS.h - 6], [SIDE - 22, ROW0 + RSTEP + ODDS.h - 6]], 1);
      ctx.globalAlpha = 1;
      text(ctx, 'ありそう', SIDE, likely + 7, { font: F.jp(700, 20), color: C.ink, alpha: p2 });
      text(ctx, 'ありそうにない', SIDE, unlikely + 7, { font: F.jp(700, 20), color: C.muted, alpha: p2 });
    }

    // the stack has a name; the last sentence adds what lies deeper in it
    if (st > 0) {
      const x = ST.x + ST.w + 16;
      const y1 = lerp(layerY(2), layerY(3), know) + ST.h;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.globalAlpha = st;
      path(ctx, [[x - 8, ST.y], [x, ST.y], [x, y1], [x - 8, y1]], st);
      ctx.globalAlpha = 1;
      text(ctx, '言語の構造', x + 14, ST.y + 34, { font: F.jp(700, 28), color: C.accent, alpha: st });
    }
  },
});

// One model as a row: what it imitates, the model, what it predicts. o.a / o.m / o.b:
// { s, al, note, noteAl, sub, subAl, open (alpha of a "？" while the cell is still open) }
function row(ctx, y, frame, o) {
  if (frame <= 0) return;
  const cell = (c, d, dashed) => {
    ctx.save();
    ctx.globalAlpha = frame;
    rr(ctx, c.x, y, c.w, ROW_H, 14);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    if (dashed) ctx.setLineDash([9, 7]);
    ctx.stroke();
    ctx.restore();
    text(ctx, d.s, c.x + 26, y + ROW_H / 2 + lerp(11, -4, d.subAl ?? 0), { font: CELL, color: C.ink, alpha: frame * d.al });
    if (d.sub) text(ctx, d.sub, c.x + 26, y + ROW_H - 12, { font: F.jp(700, 18), color: C.accent, alpha: frame * (d.subAl ?? 0) });
    if (d.open > 0) text(ctx, '？', c.x + 26, y + ROW_H / 2 + 11, { font: CELL, color: C.muted, alpha: frame * d.open });
  };
  cell(CA, o.a);
  cell(CB, o.b, o.b.open > 0.5);
  ctx.save();
  ctx.globalAlpha = frame;
  rr(ctx, CM.x, y, CM.w, ROW_H, 14);
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.fillStyle = C.ink2;
  ctx.lineWidth = 2.5;
  arrow(ctx, CA.x + CA.w + 10, y + ROW_H / 2, CM.x - 10, y + ROW_H / 2, 1, 12);
  arrow(ctx, CM.x + CM.w + 10, y + ROW_H / 2, CB.x - 10, y + ROW_H / 2, 1, 12);
  ctx.restore();
  const cx = CM.x + CM.w / 2;
  text(ctx, o.m.s, cx, y + (o.m.note ? 38 : 52), { font: F.jp(700, 28), color: C.paper, align: 'center', alpha: frame * o.m.al });
  if (o.m.note) text(ctx, o.m.note, cx, y + 66, { font: F.jp(400, 17), color: '#cfc9bd', align: 'center', alpha: frame * (o.m.noteAl ?? 1) });
}

// One rule of the stack. The deeper one, named last, is in the signal colour.
function sheet(ctx, y, s, a, deep) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, ST.x, y + (1 - a) * 10, ST.w, ST.h, 12);
  ctx.fillStyle = deep ? C.accent : '#fff';
  ctx.fill();
  if (!deep) {
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, s, ST.x + ST.w / 2, y + ST.h / 2 + 9, { font: F.jp(700, 24), color: deep ? '#fff' : C.ink, align: 'center', alpha: a });
}
