// The dive under 1-2: why a model of language is a subject of AI. ずんだもん asks; めたん sets
// four next-word problems, and each needs more than the one before it — grammar and wording,
// knowledge, arithmetic, the plot of a whole book. Every answer is drawn as the same bars as
// in 1-2 (a prediction is a set of chances, not one word): the detective story's bars are
// flat until the book has been read. The right column collects what each problem needed, and
// runs on, dashed, towards intelligence.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example } from '../lib/parts.js';
import { oddsRow, slot } from '../lib/odds.js';
import { text, measure, rr, circle, line, arrow } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outCubic, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, dimmed, lifted } from '../../../src/kit/cue.js';

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
const GOAL = { x: NX, y: 742, w: 200, h: 56 };
const BOOK = { w: 204, h: 52 };

export default clip({
  id: 'whyai',
  title: 'なぜ AI の話に',
  kicker: '次を当てるのに要るもの',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'ask', by: 'zunda', rest: 'short', text: 'どうして、言語モデルが AI の話になるのだ？' },
    { id: 'plan', text: '次の言葉を当てるのに何が要るかを、\n{four}四つの問題で見ていくわ。' },
    { id: 'p1', rest: 'short', text: '一問め。「わたしは毎朝、学校へ」。' },
    { id: 'z1', by: 'zunda', rest: 'short', text: '{a1}「行く」なのだ。' },
    { id: 'm1', still: true, rest: 'normal', text: 'そうね。これは、{n1}文法と言い回しを知っていれば当てやすいわ。' },
    { id: 'p2', rest: 'short', text: '二問め。「[日本|にほん]でいちばん高い山は」。' },
    { id: 'z2', by: 'zunda', rest: 'short', text: '{a2}富士山なのだ。' },
    { id: 'm2', still: true, rest: 'normal', text: 'こんどは、文法だけでは当たらない。\n{n2}知識が要るの。' },
    { id: 'p3', rest: 'short', text: '三問め。「りんごが 3 個。\nあと 4 個もらうと、ぜんぶで」。' },
    { id: 'z3', by: 'zunda', rest: 'short', text: '{a3}7 個なのだ。' },
    { id: 'm3', still: true, rest: 'normal', text: 'これは{n3}計算ね。' },
    { id: 'p4', rest: 'short', text: '最後。初めて読む推理小説の、おしまいの[一行|いちぎょう]。\n「犯人は」。' },
    { id: 'z4', by: 'zunda', rest: 'short', text: '{a4}……読んでみないと、見当もつかないのだ。' },
    { id: 'm4', still: true, tail: 1.0, text: 'そう。当てるには、{n4}手がかりや人の関係を、\n頭から追っていくことになるわ。' },
    {
      id: 's1',
      text: '次の言葉をうまく当てようとすると、{k1}文法の先に、\n{k2}知識、{k3}計算、{k4}筋を追う力がものを言ってくるわ。',
    },
    { id: 's2', still: true, text: '言葉には、{human}人が知っていることや考えたことが、\n書き込まれているからよ。' },
    { id: 's3', rest: 'short', text: 'だから、言葉の予測を突きつめていくと、\n{intel}知能に近づくかもしれない。' },
    { id: 's3b', still: true, text: 'そう期待されているから、言語モデルは {ai}AI の話になるのよ。' },
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

    // ——— the question, as a link that is not yet drawn. It makes way for the problems.
    const plan = at('plan');
    const q = enter(t, at('ask'), pace) * (1 - seg(t, plan, plan + 0.5));
    if (q > 0) {
      const y = 380;
      tag(ctx, 380, y, '言語モデル', { font: F.jp(700, 40), h: 96, padX: 36, r: 20, fill: C.ink, color: C.paper, alpha: q });
      ctx.save();
      ctx.globalAlpha = q;
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 10]);
      line(ctx, 680, y + 48, 990, y + 48, tw(t, at('ask.voice') + 0.4, 0.9, outCubic));
      ctx.restore();
      text(ctx, '？', 835, y + 30, { font: F.jp(700, 44), color: C.accent, align: 'center', alpha: q * tw(t, at('ask.voice') + 0.9, 0.4) });
      tag(ctx, 1010, y, 'AI', { font: F.sans(700, 44), h: 96, padX: 44, r: 20, stroke: C.ink2, lw: 3, color: C.ink, alpha: q * tw(t, at('ask.voice') + 0.6, 0.5) });
    }

    // ——— the frame of the four problems: headers and numbers come first
    const frame = enter(t, plan + 0.3, pace);
    const heads = [['次の言葉を当てる問題', QX], ['予測', OX], ['当てるのに要るもの', NX]];
    // the last header stands a line higher: its second line is the answer of sentence s2
    heads.forEach(([s, x], i) => text(ctx, s, x, HEAD_Y - (i === 2 ? 28 : 0), { font: F.jp(500, 19), color: C.muted, alpha: enter(t, plan + 0.3, pace, i) }));
    example(ctx, OX + 60, HEAD_Y - 22, frame, '候補と割合は例');

    // what each problem took: lit one after the other in the summary
    const sum = focus(t, [at('k1'), at('k2'), at('k3'), at('k4')], at('s1.end') - cue.fall, cue);

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
          alpha: put,
          track: 1,
          grow: shown > 0 ? grow : 0,
          hot: j === p.pick ? (i === 3 ? seg(read, 0.85, 1) : shown) : 0,
        });
      });

      // what it takes
      const lit = sum.level[i];
      const needA = pop(`n${n}`) * dimmed(lit, sum.any, cue);
      const k = lifted(lit, cue);
      ctx.save();
      ctx.translate(NX, y + 40);
      ctx.scale(k, k);
      tag(ctx, 0, -26, p.need, { font: F.jp(700, 24), h: 52, padX: 18, r: 12, fill: C.accent, color: '#fff', alpha: needA });
      ctx.restore();
    });

    // ——— the summary: each step needs more, and the steps point on towards intelligence
    const down = seg(t, at('k1') - lead, at('k4'));
    const on = tw(t, at('intel') - lead, 0.7, outCubic);
    ctx.strokeStyle = C.accent;
    ctx.fillStyle = C.accent;
    ctx.lineWidth = 3;
    line(ctx, RAIL_X, rowY(0) + 40, RAIL_X, rowY(3) + 40, down);
    if (on > 0) {
      ctx.save();
      ctx.setLineDash([9, 8]);
      line(ctx, RAIL_X, rowY(3) + 40, RAIL_X, GOAL.y + GOAL.h / 2, on);
      ctx.restore();
      if (on > 0.9) arrow(ctx, RAIL_X, GOAL.y + GOAL.h / 2, NX - 2, GOAL.y + GOAL.h / 2, 1, 12);
      ctx.save();
      ctx.globalAlpha = on;
      rr(ctx, GOAL.x + 8, GOAL.y, GOAL.w, GOAL.h, 12);
      ctx.setLineDash([9, 7]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = C.accent;
      ctx.stroke();
      ctx.restore();
      text(ctx, '知能？', GOAL.x + 8 + GOAL.w / 2, GOAL.y + 38, { font: F.jp(700, 26), color: C.accent, align: 'center', alpha: on });
    }
    tag(ctx, GOAL.x + 8 + GOAL.w, GOAL.y - 22, 'AI の話', { font: F.jp(700, 18), h: 34, padX: 12, fill: C.ink, color: C.paper, alpha: pop('ai'), align: 'right' });
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
