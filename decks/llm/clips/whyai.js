// The dive under 1-2: how filling holes can solve problems, as ChatGPT does. ずんだもん asks;
// めたん sets four next-word problems, and each needs more than the one before it — grammar
// and wording, knowledge, arithmetic, the plot of a whole book. Every answer is drawn as the
// same bars as in 1-2 (a prediction is a set of chances, not one word): the detective story's
// bars are flat until the book has been read. The right column collects what each problem
// needed. Then the made-up bars give way to what was measured: GPT-3 at eight sizes, on
// problems of three of the kinds. The column runs on to ChatGPT, whose core this is, with
// the training to answer people on top.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example } from '../lib/parts.js';
import { oddsRow, slot } from '../lib/odds.js';
import { text, measure, rr, circle, line, arrow } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outCubic, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, dimmed, lifted } from '../../../src/kit/cue.js';
import { chatName } from '../lib/chat.js';

// each problem: the text so far, the candidates [word, chance], what it takes
const QS = [
  { say: 'わたしは毎朝、学校へ', cands: [['行く', 0.8], ['通う', 0.15], ['泳ぐ', 0.01]], pick: 0, need: '文法・言い回し' },
  { say: '日本でいちばん高い山は', cands: [['富士山', 0.9], ['北岳', 0.04], ['エベレスト', 0.03]], pick: 0, need: '知識' },
  { say: 'りんごが 3 個。あと 4 個もらうと、ぜんぶで', cands: [['7 個', 0.9], ['6 個', 0.04], ['8 個', 0.04]], pick: 0, need: '計算' },
  { say: '…… 犯人は', cands: [['執事', 0.33], ['庭師', 0.33], ['医者', 0.33]], read: [0.03, 0.92, 0.03], pick: 1, need: '話の筋' },
];

const TOP = 140;
const STEP = 146;
const rowY = (i) => TOP + i * STEP;
const HEAD_Y = 112;
const QX = 156; // the text of a problem
const SAY = F.jp(500, 30);
const OX = 940; // its candidates
const ODDS = { chipW: 132, h: 34, barW: 150, font: F.jp(500, 20) };
const NX = 1290; // what it takes
const RAIL_X = 1270;
const GOAL = { x: NX + 8, y: 734, w: 200, h: 76 };
const BOOK = { w: 204, h: 52 };

// ——— what was measured: GPT-3's eight sizes, each trained only to predict the next token,
// given a few solved examples in the prompt and no further training (few-shot). Accuracy in %,
// Brown et al. 2020, Table H.1 (p.63). Rows 2–4 of the problems get the measurement of their
// kind; the points are drawn as they are, dips included (research/chatbot-facts/).
const SIZES = [125e6, 350e6, 760e6, 1.3e9, 2.7e9, 6.7e9, 13e9, 175e9];
const MEASURED = [
  null,
  { name: 'TriviaQA（知識を問う質問）', acc: [6.96, 16.3, 26.5, 32.1, 42.3, 51.6, 57.5, 71.2] },
  { name: '2 桁までの足し算', acc: [2.0, 4.1, 3.5, 4.5, 8.9, 11.9, 55.5, 100.0] },
  { name: 'LAMBADA（前の数文から最後の語）', acc: [22.0, 40.4, 63.2, 57.0, 78.1, 79.1, 81.3, 86.4] },
];
const CH = { x: OX + 6, w: 236, top: 16, bottom: 104 }; // a chart inside a row's prediction cell
const logX = (n) => CH.x + (CH.w * (Math.log10(n) - Math.log10(SIZES[0]))) / (Math.log10(SIZES[7]) - Math.log10(SIZES[0]));

export default clip({
  id: 'whyai',
  title: 'なぜ解けるのか',
  kicker: '次を当てるのに要るもの',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'ask', by: 'zunda', rest: 'short', text: '穴埋めだけで、どうして問題まで解けるのだ？' },
    { id: 'plan', text: '次の言葉を当てるには、何が必要なのかを、\n{four}四つの問題で確かめてみましょう。' },
    { id: 'p1', rest: 'short', text: '一問め。「わたしは毎朝、学校へ」。\n続く言葉は、何かしら。' },
    { id: 'z1', by: 'zunda', rest: 'short', text: '{a1}「行く」なのだ。' },
    { id: 'm1', still: true, text: 'そうね。これは、{n1}文法と言い回しを知っていれば当てやすいわ。' },
    { id: 'p2', rest: 'short', text: '二問め。「[日本|にほん]でいちばん高い山は」。' },
    { id: 'z2', by: 'zunda', rest: 'short', text: '{a2}富士山なのだ。' },
    { id: 'm2', still: true, text: 'こんどは、文法を知っているだけでは当てられないわ。\n{n2}知識が必要なの。' },
    { id: 'p3', rest: 'short', text: '三問め。「りんごが 3 個。\nあと 4 個もらうと、ぜんぶで」。' },
    { id: 'z3', by: 'zunda', rest: 'short', text: '{a3}7 個なのだ。' },
    { id: 'm3', still: true, text: 'これには、{n3}計算する力が要るわね。' },
    { id: 'p4', rest: 'short', text: '最後の問題は、初めて読む推理小説の、おしまいの[一行|いちぎょう]よ。\n「犯人は」。' },
    { id: 'z4', by: 'zunda', rest: 'short', text: '{a4}……読んでみないと、見当もつかないのだ。' },
    { id: 'm4', still: true, tail: 1.0, text: 'そうよね。これを当てるには、{n4}手がかりや人の関係を、\nはじめから追っていくことになるわ。' },
    {
      id: 's1',
      text: '次の言葉をうまく当てようとすると、{k1}文法だけでなく、\n{k2}知識や{k3}計算、{k4}話の筋を追う力も、ものを言ってくるの。',
    },
    { id: 's2', still: true, text: 'それは、言葉の中に、{human}人が知っていることや考えたことが、\n書き込まれているからよ。' },
    { id: 's3', text: '実際に、次の言葉の予測だけを学んだ、\n{big}大きさの違うモデルどうしを比べた研究があるの。' },
    { id: 's3a', still: true, text: 'その結果、大きいモデルほど、{v2}知識や{v3}計算、\n{v4}前の文脈を使う問題で、おおむね成績がよかったわ。' },
    { id: 's3b', still: true, text: 'こうして学んだ LLM に、{tune}人の頼みに沿って答える学習を\n重ねたものが、{ai}ChatGPT の中核になっているの。' },
    { id: 's4', text: 'ただ、{same}当てられることと、わかっていることが同じかどうかは、\n{debate}いまも議論が続いているわ。' },
    { id: 'z5', by: 'zunda', text: '「当てるだけ」の中身は、深そうなのだ。' },
  ],

  prepare(ctx) {
    return {
      sayW: QS.map((q) => measure(ctx, SAY, q.say)),
      pickW: QS.map((q) => measure(ctx, SAY, q.cands[q.pick][0]) + 32),
    };
  },

  draw(ctx, t, { sayW, pickW }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    // ——— the question, as a link that is not yet drawn: the hole-filling, and ChatGPT that
    // solves problems. It makes way for the problems.
    const plan = at('plan');
    const q = enter(t, at('ask'), pace) * (1 - seg(t, plan, plan + 0.5));
    if (q > 0) {
      const y = 380;
      tag(ctx, 380, y, '穴埋めだけ', { font: F.jp(700, 40), h: 96, padX: 36, r: 20, fill: C.ink, color: C.paper, alpha: q });
      ctx.save();
      ctx.globalAlpha = q;
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 10]);
      line(ctx, 680, y + 48, 990, y + 48, tw(t, at('ask.voice') + 0.4, 0.9, outCubic));
      ctx.restore();
      text(ctx, '？', 835, y + 30, { font: F.jp(700, 44), color: C.accent, align: 'center', alpha: q * tw(t, at('ask.voice') + 0.9, 0.4) });
      const gptA = q * tw(t, at('ask.voice') + 0.6, 0.5);
      ctx.save();
      ctx.globalAlpha = gptA;
      rr(ctx, 1010, y, 300, 96, 20);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      chatName(ctx, 1046, y + 26, { size: 44, alpha: gptA });
      text(ctx, '問題も解く', 1160, y + 136, { font: F.jp(700, 24), color: C.ink2, align: 'center', alpha: gptA });
    }

    // ——— the frame of the four problems: headers and numbers come first
    const frame = enter(t, plan + 0.3, pace);
    // the made-up predictions make way for what was measured as sentence s3 begins
    const meas = enter(t, at('s3'), pace);
    const heads = [['次の言葉を当てる問題', QX], ['予測', OX], ['当てるのに要るもの', NX]];
    // the last header stands a line higher: its second line is the answer of sentence s2
    heads.forEach(([s, x], i) => text(ctx, s, x, HEAD_Y - (i === 2 ? 28 : 0), { font: F.jp(500, 19), color: C.muted, alpha: enter(t, plan + 0.3, pace, i) * (i === 1 ? 1 - meas : 1) }));
    example(ctx, OX + 60, HEAD_Y - 22, frame * (1 - meas), '候補と割合は例');
    text(ctx, 'GPT-3 で測った正答率', OX, HEAD_Y, { font: F.jp(700, 19), color: C.ink2, alpha: meas });

    // what each problem took: lit one after the other in the summary, and again, three of
    // them, with what was measured
    const sum = focus(t, [at('k1'), at('k2'), at('k3'), at('k4')], at('s1.end') - cue.fall, cue);
    const mf = focus(t, [at('v2'), at('v3'), at('v4')], at('s3a.end') - cue.fall, cue);
    const drawn = seg(t, at('big') - lead, at('big') - lead + 1.6); // the points, small to large

    QS.forEach((p, i) => {
      const y = rowY(i);
      const n = i + 1;
      const badge = tw(t, at('four') - lead + i * pace.stagger, pace.enter);
      ctx.save();
      ctx.globalAlpha = badge;
      ctx.fillStyle = C.accent;
      circle(ctx, M.l + 22, y + 40, 20);
      ctx.fill();
      ctx.restore();
      text(ctx, String(n), M.l + 22, y + 50, { font: F.cond(700, 28), color: '#fff', align: 'center', alpha: badge });
      if (i > 0) {
        ctx.fillStyle = C.rule;
        ctx.globalAlpha = badge;
        ctx.fillRect(M.l, y - 14, W - M.l - M.r, 2);
        ctx.globalAlpha = 1;
      }

      // the problem
      const put = enter(t, at(`p${n}`), pace);
      if (put <= 0) return;
      const answered = at(`a${n}`);
      const read = i === 3 ? inOutCubic(seg(t, at('n4') - lead, at('m4.done'))) : 0; // the book being read
      let x = QX;
      if (i === 3) {
        book(ctx, x, y + 14, put, read);
        x += BOOK.w + 18;
      }
      text(ctx, p.say, x, y + 50, { font: SAY, color: C.ink, alpha: put });
      const sx = x + sayW[i] + 14;
      const known = i === 3 ? seg(read, 0.85, 1) : tw(t, answered - lead, pace.enter);
      slot(ctx, sx, y + 16, pickW[i], 48, { alpha: put * (1 - known), blink: known <= 0 && Math.floor(t * 2.5) % 2 === 0 });
      if (known > 0) tag(ctx, sx, y + 16, p.cands[p.pick][0], { font: SAY, h: 48, padX: 16, r: 10, fill: C.accent, color: '#fff', alpha: known });

      // its candidates: empty tracks until the answer, then bars
      const shown = tw(t, answered - lead, pace.enter);
      const grow = tw(t, answered, 0.7, outCubic);
      p.cands.forEach(([word, chance], j) => {
        const now = p.read ? lerp(chance, p.read[j], read) : chance;
        oddsRow(ctx, OX, y + 4 + j * 40, shown > 0 ? word : '', {
          ...ODDS,
          p: now,
          alpha: put * (MEASURED[i] ? 1 - meas : lerp(1, cue.dim, meas)),
          track: 1,
          grow: shown > 0 ? grow : 0,
          hot: j === p.pick ? (i === 3 ? seg(read, 0.85, 1) : shown) : 0,
        });
      });

      if (MEASURED[i]) chart(ctx, y, MEASURED[i], meas, drawn);

      // what it takes
      const lit = Math.max(sum.level[i], i > 0 ? mf.level[i - 1] : 0);
      const needA = pop(`n${n}`) * dimmed(lit, Math.max(sum.any, mf.any), cue);
      const k = lifted(lit, cue);
      ctx.save();
      ctx.translate(NX, y + 40);
      ctx.scale(k, k);
      tag(ctx, 0, -26, p.need, { font: F.jp(700, 24), h: 52, padX: 18, r: 12, fill: C.accent, color: '#fff', alpha: needA });
      ctx.restore();
    });

    // the measured charts share one axis: the size of the model, written under the last
    const axis = meas * seg(drawn, 0.9, 1);
    const ay = rowY(3) + CH.bottom + 24;
    text(ctx, '1.25 億', CH.x, ay, { font: F.jp(500, 15), color: C.muted, alpha: axis });
    text(ctx, '1750 億', CH.x + CH.w, ay, { font: F.jp(500, 15), color: C.muted, align: 'right', alpha: axis });
    text(ctx, '→ モデルの大きさ（対数目盛）', CH.x, ay + 24, { font: F.jp(500, 15), color: C.muted, alpha: axis });
    text(ctx, '別々の 8 モデルに、例を見せて解かせた結果', CH.x, ay + 48, { font: F.jp(400, 14), color: C.muted, alpha: axis });
    text(ctx, 'Brown ほか 2020、表 H.1', CH.x, ay + 68, { font: F.jp(400, 14), color: C.muted, alpha: axis });

    // ——— the summary: each step needs more, and what learnt them is the core of ChatGPT
    const down = seg(t, at('k1') - lead, at('k4'));
    const on = tw(t, at('ai') - lead, 0.7, outCubic);
    ctx.strokeStyle = C.accent;
    ctx.fillStyle = C.accent;
    ctx.lineWidth = 3;
    line(ctx, RAIL_X, rowY(0) + 40, RAIL_X, rowY(3) + 40, down);
    if (on > 0) {
      const gy = GOAL.y + GOAL.h / 2;
      line(ctx, RAIL_X, rowY(3) + 40, RAIL_X, gy, on);
      if (on > 0.9) arrow(ctx, RAIL_X, gy, GOAL.x - 4, gy, 1, 12);
      ctx.save();
      ctx.globalAlpha = on;
      rr(ctx, GOAL.x, GOAL.y, GOAL.w, GOAL.h, 14);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = C.ink2;
      ctx.stroke();
      ctx.restore();
      chatName(ctx, GOAL.x + 22, GOAL.y + 12, { size: 26, alpha: on });
      text(ctx, '中核は LLM', GOAL.x + 22, GOAL.y + 62, { font: F.jp(700, 18), color: C.accent, alpha: on });
    }
    tag(ctx, GOAL.x + GOAL.w, GOAL.y - 44, '＋ 頼みに沿う学習', { font: F.jp(700, 18), h: 34, padX: 12, fill: C.ink, color: C.paper, alpha: pop('tune'), align: 'right' });
    text(ctx, '＝ 人の知識と考え', NX, HEAD_Y, { font: F.jp(700, 20), color: C.accent, alpha: pop('human') });

    // ——— the caveat
    const same = pop('same');
    const cy = GOAL.y;
    let cx = QX;
    cx += tag(ctx, cx, cy, '当てられる', { font: F.jp(700, 24), h: 56, padX: 20, r: 12, fill: '#fff', stroke: C.ink2, alpha: same }) + 16;
    cx += text(ctx, '＝？', cx, cy + 38, { font: F.jp(700, 28), color: C.ink2, alpha: same }) + 16;
    cx += tag(ctx, cx, cy, 'わかっている', { font: F.jp(700, 24), h: 56, padX: 20, r: 12, fill: '#fff', stroke: C.ink2, alpha: same }) + 24;
    text(ctx, '議論が続いている', cx, cy + 36, { font: F.jp(500, 22), color: C.muted, alpha: pop('debate') });
  },
});

// What was measured for one kind of problem, in its row's prediction cell: accuracy against
// the size of the model on a log axis, from 0 (the base line) to 100% (the dashed line). The
// points come in from small to large (p); the largest one carries its number.
function chart(ctx, y, m, a, p) {
  if (a <= 0.001) return;
  const by = y + CH.bottom;
  const ty = y + CH.top;
  const py = (v) => by - ((by - ty) * v) / 100;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = C.rule;
  ctx.fillRect(CH.x, by, CH.w, 2);
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 5]);
  line(ctx, CH.x, ty, CH.x + CH.w, ty);
  ctx.restore();
  text(ctx, m.name, CH.x, y + 12, { font: F.jp(500, 15), color: C.muted, alpha: a });
  text(ctx, '100%', CH.x + CH.w + 8, ty + 5, { font: F.jp(400, 13), color: C.muted, alpha: a * (1 - seg(p, 0.85, 1)) });
  if (p <= 0) return;
  const pts = SIZES.map((n, k) => [logX(n), py(m.acc[k])]);
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.beginPath();
  ctx.rect(CH.x - 8, ty - 12, (CH.w + 16) * p, by - ty + 24);
  ctx.clip();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach(([x, py2], k) => (k ? ctx.lineTo(x, py2) : ctx.moveTo(x, py2)));
  ctx.stroke();
  pts.forEach(([x, py2], k) => {
    ctx.fillStyle = k === 7 ? C.accent : C.ink;
    circle(ctx, x, py2, k === 7 ? 5.5 : 3.5);
    ctx.fill();
  });
  ctx.restore();
  const last = m.acc[7];
  text(ctx, `${Math.round(last)}%`, CH.x + CH.w + 10, py(last) + 8, { font: F.cond(700, 24), color: C.accent, alpha: a * seg(p, 0.9, 1) });
}

// The detective story: a closed book with a bar for how far it has been read.
function book(ctx, x, y, a, read) {
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, BOOK.w, BOOK.h, 8);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.fillStyle = C.ink2;
  ctx.fillRect(x, y, 8, BOOK.h);
  ctx.fillStyle = C.rule;
  ctx.fillRect(x + 20, y + BOOK.h - 12, BOOK.w - 32, 4);
  ctx.fillStyle = C.accent;
  ctx.fillRect(x + 20, y + BOOK.h - 12, (BOOK.w - 32) * read, 4);
  ctx.restore();
  text(ctx, '初めて読む推理小説', x + 20, y + 28, { font: F.jp(500, 19), color: C.ink2, alpha: a });
}
