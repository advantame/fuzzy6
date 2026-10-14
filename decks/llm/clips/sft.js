// 4-3: learning from examples. Shown a document with the marks, a model with pre-training only
// may not answer — here it writes the next turn of the conversation itself. So people write
// example conversations in this form, many of them: a request and a good answer that follows
// it. The model practises next-token prediction on them as in pre-training, with the misses
// usually counted on the answer only, and learns that after the assistant mark comes an answer
// that follows the request. This is instruction tuning (supervised fine-tuning); InstructGPT's
// labelers wrote the demonstrations. ずんだもん asks whether copying examples is enough; it is
// not, which leads to 4-4. The conversations and the split into pieces are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, chip, chipWidth, source, SOURCE_RIGHT } from '../lib/parts.js';
import { trainingStrip } from '../lib/training.js';
import { ROLE } from '../lib/rig.js';
import { text, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, outCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';
import { hash2 } from '../../../src/kit/random.js';

const ASK = '雨の日の過ごし方を、三つ教えて';
const BAD = 'わたしも知りたいです。';
const BAD2 = '晴れの日は？';
const GOOD = ['1. 本を読む', '2. 映画を見る', '3. 料理をする'];
const A = { x: M.l, y: 142, w: 640, h: 196 }; // a pre-trained model, given the marks
const S = { x: M.l, y: 410, w: 640, h: 300 }; // the examples
const T = { x: 800, y: 410, w: W - M.r - 800 }; // practising on one
const USER_PIECES = ['雨の日の', '過ごし方を、', '三つ', '教えて'];
const ANSWER_PIECES = ['1. 本を読む', '2. 映画を見る', '3. 料理をする', '〈終わり〉'];
const CHIP = { font: F.jp(500, 20), h: 40, padX: 8, gap: 7 };

export default clip({
  id: 'sft',
  title: '手本で学ぶ',
  kicker: '指示チューニング',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', still: true, text: '印で会話の形を整えても、{doc}それだけで、\n頼みに合う答えを出せるとは限らないわ。' },
    { id: 'b', text: 'そこで、{ex}頼みと、望ましい答えの手本を用意するの。\n{many}ここでは、人が書いた会話の手本で見てみましょう。' },
    { id: 'c', still: true, text: '{q}頼みと、{good}それにどう答えてほしいかを示す手本が、\n組になっているの。' },
    { id: 'd', text: 'これを使って、{next}次のトークンを予測する練習を重ねるわ。\n手本の続きが出やすくなるように、パラメータを直すのよ。' },
    { id: 'e', text: 'ここでは、頼みを手がかりにして、{only}答えの部分の予測を、\n手本と比べているわ。' },
    { id: 'f', still: true, text: 'こうして、{learn}アシスタントの番に、\n頼みに沿った答えを続けるように、学んでいくのよ。' },
    { id: 'g', text: '手本を使うこの学習は、\n{name}教師ありファインチューニング、[SFT|エスエフティー] と呼ばれるわ。' },
    { id: 'g2', text: 'なかでも、指示に沿う答えを学ばせるものを、\n{tun}指示チューニングと言うの。' },
    { id: 'h', still: true, text: '2022 年の InstructGPT では、{n}人の手本を使う学習に、\n[約 1 万 3 千件|やくいちまんさんぜんけん]の頼みを使ったの。' },
    { id: 'i', by: 'zunda', text: '{q2}手本をまねるだけで、いい答えになるのだ？' },
    { id: 'j', tail: 0.8, text: '手本で学んだあとに、{limit}答えを比べる評価も使って、\nさらに整える方法があるの。次は、それを見てみましょう。' },
  ],

  prepare(ctx) {
    const lay = (list, x0) => {
      let x = x0;
      return list.map((s) => {
        const w = chipWidth(ctx, s, CHIP);
        const out = { s, x, w };
        x += w + CHIP.gap;
        return out;
      });
    };
    return { user: lay(USER_PIECES, T.x + 132), answer: lay(ANSWER_PIECES, T.x + 132) };
  },

  draw(ctx, t, { user, answer }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    trainingStrip(ctx, { alpha: enter(t, at('a'), pace), lit: [1] });

    // ——— a pre-trained model, given the marks: it writes the next turn itself
    const aa = enter(t, at('a'), pace);
    text(ctx, '事前学習だけのモデルの場合', A.x, A.y - 16, { font: F.jp(700, 19), color: C.ink2, alpha: aa });
    card(ctx, A, aa);
    turn(ctx, A.x + 22, A.y + 26, 'user', ASK, aa);
    const bad = tw(t, at('doc') - lead, pace.enter);
    turn(ctx, A.x + 22, A.y + 80, 'assistant', BAD, bad, C.blue);
    turn(ctx, A.x + 22, A.y + 134, 'user', BAD2, tw(t, at('doc') + 0.5, pace.enter), C.blue);
    tag(ctx, A.x + A.w + 16, A.y + 128, '答えずに、相手の発言まで書いてしまう', { font: F.jp(700, 17), h: 34, padX: 12, fill: '#fff', stroke: C.red, color: C.red, alpha: tw(t, at('doc') + 1.0, pace.enter) });

    // ——— the examples: written by people, many of them
    const ea = pop('ex');
    text(ctx, '人が書いた手本の会話', S.x, S.y - 16, { font: F.jp(700, 19), color: C.ink2, alpha: ea });
    const many = pop('many');
    for (let k = 3; k >= 1; k--) {
      const a = many * (1 - k * 0.15);
      if (a <= 0) continue;
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, S.x + k * 12, S.y + k * 10, S.w, S.h, 16);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    card(ctx, S, ea);
    const qLit = focus(t, [at('q'), at('good')], at('c.end') - cue.fall, cue);
    turn(ctx, S.x + 22, S.y + 28, 'user', ASK, ea);
    GOOD.forEach((s, i) => {
      if (i === 0) turn(ctx, S.x + 22, S.y + 84, 'assistant', s, ea);
      else text(ctx, s, S.x + 22 + 136, S.y + 84 + 27 + i * 44, { font: F.jp(500, 24), color: C.ink, alpha: ea });
    });
    ring(ctx, S.x + 14, S.y + 20, S.w - 28, 48, qLit.level[0], C.blue, 10);
    ring(ctx, S.x + 14, S.y + 76, S.w - 28, 140, qLit.level[1], C.accent, 10);
    text(ctx, '× たくさん', S.x + S.w - 20, S.y + S.h - 22, { font: F.jp(700, 22), color: C.ink2, align: 'right', alpha: many });

    // ——— practising on one: the same next-token practice, misses counted on the answer
    const ta = pop('next');
    text(ctx, '次のトークンを当てる練習（事前学習と同じ）', T.x, T.y - 16, { font: F.jp(700, 19), color: C.ink2, alpha: ta });
    const rowY = [T.y + 20, T.y + 132];
    const roleTag = (role, y, a) => {
      const r = ROLE[role];
      tag(ctx, T.x, y + 4, r.name, { font: F.jp(700, 16), h: 32, padX: 9, fill: r.fill, color: r.color, alpha: a, r: 6 });
    };
    roleTag('user', rowY[0], ta);
    roleTag('assistant', rowY[1], ta);
    // a cursor runs along the pieces: what is ahead stays hidden
    const run = seg(t, at('next'), at('d.end'));
    const all = [...user, ...answer];
    const cur = Math.floor(run * all.length);
    all.forEach((c, k) => {
      const inAnswer = k >= user.length;
      const y = rowY[inAnswer ? 1 : 0];
      const hidden = run > 0 && run < 1 && k > cur;
      const a = ta * tw(t, at('next') - lead + k * 0.03, pace.enter);
      chip(ctx, c.x, y, c.s, { ...CHIP, fill: hidden ? C.panel : inAnswer ? C.accentSoft : C.blueSoft, color: hidden ? C.panel : C.ink, alpha: a });
    });
    // the misses: counted on the answer, not on the request
    const oa = pop('only');
    if (oa > 0) {
      answer.forEach((c, k) => {
        const h = (12 + 26 * hash2(k, 4)) * oa;
        ctx.globalAlpha = oa;
        ctx.fillStyle = C.red;
        ctx.fillRect(c.x + c.w / 2 - 6, rowY[1] + CHIP.h + 46 - h, 12, h);
        ctx.globalAlpha = 1;
      });
      text(ctx, '手本と比べる', answer[0].x, rowY[1] + CHIP.h + 72, { font: F.jp(700, 18), color: C.red, alpha: oa });
      text(ctx, '手がかり（比べない）', user[0].x, rowY[0] + CHIP.h + 30, { font: F.jp(700, 18), color: C.muted, alpha: oa });
    }
    // what it learns: after the assistant mark, an answer that follows the request
    const la = pop('learn');
    if (la > 0) {
      const y = 760;
      const r = ROLE.assistant;
      const w = tag(ctx, T.x, y, r.name, { font: F.jp(700, 17), h: 36, padX: 10, fill: r.fill, color: r.color, alpha: la, r: 6 });
      ctx.save();
      ctx.globalAlpha = la;
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 2.5;
      arrow(ctx, T.x + w + 10, y + 18, T.x + w + 54, y + 18, outCubic(la), 10);
      ctx.restore();
      text(ctx, '頼みに沿った答えが来る、という並び方を学ぶ', T.x + w + 64, y + 26, { font: F.jp(700, 20), color: C.ink, alpha: la });
    }
    // the name, and InstructGPT's demonstrations
    tag(ctx, W - M.r, 104, '教師ありファインチューニング（SFT）', { font: F.jp(700, 18), h: 36, padX: 14, fill: C.accent, color: '#fff', align: 'right', alpha: pop('name') });
    tag(ctx, W - M.r, 148, '指示に沿う答えを学ばせる：指示チューニング', { font: F.jp(700, 16), h: 32, padX: 12, fill: '#fff', stroke: C.accent, color: C.accent, align: 'right', alpha: pop('tun') });
    const na = pop('n');
    text(ctx, 'InstructGPT（2022）：SFT の訓練に、頼み 12,725 件（検証用は別）', S.x, S.y + S.h + 64, { font: F.jp(700, 18), color: C.ink2, alpha: na });
    const lim = pop('limit');
    text(ctx, '手本のあとに、答えを比べる評価でも整える → 4-4', S.x, S.y + S.h + 96, { font: F.jp(700, 18), color: C.accent, alpha: lim });

    example(ctx, A.x + 300, A.y - 42, aa, '会話と区切りは説明のための例');
    source(ctx, 'Ouyang ほか（2022）', na, SOURCE_RIGHT);
  },
});

function card(ctx, b, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, b.x, b.y, b.w, b.h, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// One turn of a document: the role mark and the text beside it.
function turn(ctx, x, y, role, s, a, color = C.ink) {
  if (a <= 0.001) return;
  const r = ROLE[role];
  tag(ctx, x, y, r.name, { font: F.jp(700, 16), h: 32, padX: 9, fill: r.fill, color: r.color, alpha: a, r: 6 });
  text(ctx, s, x + 136, y + 25, { font: F.jp(500, 24), color, alpha: a });
}
