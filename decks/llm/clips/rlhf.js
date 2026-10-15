// 4-4: polishing by preference. For one request the model writes several answers; a person
// reads them and puts them in order. Many such orderings train a reward model that scores an
// answer as people would; the LLM is then tuned so that its answers score higher. This is RLHF.
// InstructGPT's result: the 1.3B model tuned this way was preferred to the 175B GPT-3, on the
// requests it was judged on. ずんだもん is surprised at the size gap, drawn as two squares of
// the two sizes' areas. Other ways of learning from comparisons exist. The request, answers,
// orderings and scores are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, source } from '../lib/parts.js';
import { trainingStrip } from '../lib/training.js';
import { text, rr, arrow, wrap } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outCubic, outBack, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

const ASK = '雨の日の過ごし方を、三つ教えて';
const ANSWERS = [
  { id: 'A', body: '1. 本を読む\n2. 映画を見る\n3. 料理をする', rank: 1, score: 0.82 },
  { id: 'B', body: '雨とは、空から水の粒が落ちてくる現象で、……', rank: 3, score: 0.21 },
  { id: 'C', body: '家でゆっくり過ごすのが、いいと思います。', rank: 2, score: 0.55 },
];
const CARD = { y: 172, w: 400, h: 176, gap: 26 };
const cardX = (i) => M.l + i * (CARD.w + CARD.gap);
const FLOW = { y: 420, h: 150 };
const BOX = [
  { x: M.l, w: 360, title: '比べた結果', what: '× たくさん集める' },
  { x: M.l + 470, w: 400, title: '報酬モデル', what: '人が選びそうな答えほど、高い点を付ける' },
  { x: M.l + 980, w: 428, title: 'LLM を調整', what: '点が高くなるように、パラメータを直す' },
];
const FACT = { y: 640 };

export default clip({
  id: 'rlhf',
  title: '好みで磨く',
  kicker: 'RLHF',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: '同じプロンプトに、{three}モデルが書いた答えを、いくつか並べるわ。' },
    { id: 'b', still: true, text: '人が、{read}指示に沿っているかなどを考えながら読み比べて、\n{rank}よいと思う順に並べるの。' },
    { id: 'c', text: 'この比較を{many}たくさん集めて、{rm}人が選びそうな答えほど\n高い点を付ける、別のモデルを学習させるわ。' },
    { id: 'c2', text: 'これが、{rmn}報酬モデルよ。' },
    { id: 'd', text: 'そして、{tune}報酬モデルの点が高くなるように、\n答える LLM のパラメータを調整していくわ。' },
    { id: 'e', still: true, text: 'これは、{name}人のフィードバックを使う強化学習、\n[RLHF|アールエルエイチエフ] の、一つのやり方なの。' },
    { id: 'f', text: '2022 年の InstructGPT の評価では、{small}API の利用者から\n集めたプロンプトへの答えを、人に比べてもらったわ。' },
    { id: 'f2', text: '{won}追加の学習をした 13 億パラメータのモデルが、\n{big}元の 1750 億パラメータの [GPT-3|ジーピーティースリー] より、好まれたのよ。' },
    { id: 'g', by: 'zunda', text: '{q}大きさが百倍以上も違うのに、なのだ？' },
    { id: 'h', still: true, text: 'ええ。この実験では、{fit}大きさだけでなく、指示に沿うように\n追加で学習させることが、答えの評価を大きく変えたのよ。' },
    { id: 'i', tail: 0.8, text: '比べる学習には、{other}比べた結果から直接調整する方法や、\nAI の評価を使う方法もあるわ。' },
  ],

  prepare(ctx) {
    return { bodies: ANSWERS.map((a) => wrap(ctx, F.jp(500, 22), a.body, CARD.w - 50)) };
  },

  draw(ctx, t, { bodies }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    trainingStrip(ctx, { alpha: enter(t, at('a'), pace), lit: [2] });

    // ——— the request and the model's answers
    const g = enter(t, at('a'), pace);
    const pw = text(ctx, 'プロンプト', M.l, 140, { font: F.jp(700, 18), color: C.muted, alpha: g });
    text(ctx, ASK, M.l + pw + 14, 141, { font: F.jp(700, 26), color: C.ink, alpha: g });
    const read = focus(t, [at('read')], at('rank'), cue).level[0];
    const ranked = tw(t, at('rank') - lead, 0.6);
    ANSWERS.forEach((a, i) => {
      const x = cardX(i);
      const p = tw(t, at('three') - lead + i * pace.stagger * 2, pace.enter, (q) => outBack(q, 1.4));
      if (p <= 0) return;
      const al = Math.min(1, p);
      ctx.save();
      ctx.globalAlpha = al * (a.rank === 3 ? lerp(1, 0.55, ranked) : 1);
      rr(ctx, x, CARD.y + (1 - al) * 12, CARD.w, CARD.h, 16);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = a.rank === 1 && ranked > 0.5 ? C.green : C.rule;
      ctx.lineWidth = a.rank === 1 && ranked > 0.5 ? 4 : 2;
      ctx.stroke();
      text(ctx, `答え ${a.id}`, x + 24, CARD.y + 40, { font: F.jp(700, 20), color: C.ink2 });
      bodies[i].forEach((l, j) => text(ctx, l, x + 24, CARD.y + 82 + j * 32, { font: F.jp(500, 22), color: C.ink }));
      ctx.restore();
      // the person's order
      if (ranked > 0) {
        const b = outBack(seg(ranked, 0, 1), 2);
        tag(ctx, x + CARD.w - 16, CARD.y + 14, `${a.rank} 位`, { font: F.jp(700, 20), h: 38, padX: 14, fill: a.rank === 1 ? C.green : a.rank === 2 ? C.ink2 : C.muted, color: '#fff', align: 'right', alpha: Math.min(1, b) });
      }
      ring(ctx, x, CARD.y, CARD.w, CARD.h, read * (0.6 + 0.4 * Math.sin(i)), C.accent, 16);
    });
    tag(ctx, cardX(2) + CARD.w + 16, CARD.y + 60, '人が並べる', { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.green, color: C.green, alpha: ranked });

    // ——— comparisons → reward model → tuning the LLM
    const steps = [pop('many'), pop('rm'), pop('tune')];
    BOX.forEach((b, i) => {
      const a = steps[i];
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, b.x, FLOW.y, b.w, FLOW.h, 16);
      ctx.fillStyle = i === 2 ? C.ink : i === 1 ? C.panel : '#fff';
      ctx.fill();
      if (i === 0) {
        ctx.strokeStyle = C.rule;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
      text(ctx, b.title, b.x + 24, FLOW.y + 46, { font: F.jp(700, 26), color: i === 2 ? C.paper : C.ink, alpha: a });
      text(ctx, b.what, b.x + 24, FLOW.y + 88, { font: F.jp(500, 19), color: i === 2 ? '#cfc9bd' : C.ink2, alpha: a });
      if (i > 0) {
        ctx.save();
        ctx.strokeStyle = C.ink2;
        ctx.fillStyle = C.ink2;
        ctx.lineWidth = 3;
        arrow(ctx, BOX[i - 1].x + BOX[i - 1].w + 12, FLOW.y + FLOW.h / 2, b.x - 12, FLOW.y + FLOW.h / 2, tw(t, [at('rm'), at('tune')][i - 1] - lead, 0.5, inOutCubic), 12);
        ctx.restore();
      }
    });
    // the comparison, as an order
    if (steps[0] > 0) text(ctx, 'A ＞ C ＞ B', BOX[0].x + 24, FLOW.y + 128, { font: F.mono(600, 22), color: C.green, alpha: steps[0] });
    // the reward model's scores
    if (steps[1] > 0) {
      ANSWERS.forEach((a, i) => {
        const s = tw(t, at('rm') + 0.5 + i * pace.stagger, 0.4);
        const x = BOX[1].x + 24 + i * 120;
        text(ctx, a.id, x, FLOW.y + 130, { font: F.mono(600, 18), color: C.ink2, alpha: s });
        text(ctx, a.score.toFixed(2), x + 22, FLOW.y + 132, { font: F.cond(700, 28), color: a.rank === 1 ? C.green : C.ink2, alpha: s });
      });
    }
    // the name
    const na = pop('name');
    ring(ctx, BOX[1].x, FLOW.y, BOX[1].w, FLOW.h, focus(t, [at('rmn')], at('c2.end') - cue.fall, cue).level[0], C.accent, 16);
    tag(ctx, W - M.r, 104, '人間のフィードバックによる強化学習（RLHF）', { font: F.jp(700, 18), h: 36, padX: 14, fill: C.accent, color: '#fff', align: 'right', alpha: na });

    // ——— InstructGPT: 1.3B tuned, preferred to 175B GPT-3
    const fa = pop('small');
    if (fa > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, FACT.y - 22, (W - M.l - M.r) * outCubic(fa), 2);
      text(ctx, 'InstructGPT（2022）の評価：API の利用者から集めたプロンプトへの答えを、人が比べた', M.l, FACT.y + 20, { font: F.jp(700, 20), color: C.ink, alpha: fa });
    }
    // two squares whose areas are the two sizes: 13 億 and 1750 億 (√ of the ratio ≈ 11.6)
    const big = pop('big');
    const side = 150;
    const smallSide = side / Math.sqrt(175 / 1.3);
    const sq = (x, s, a, fill, label, note) => {
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = fill;
      ctx.fillRect(x, FACT.y + 40 + side - s, s, s);
      ctx.restore();
      text(ctx, label, x + Math.max(s, 14) + 10, FACT.y + 40 + side - 30, { font: F.cond(700, 34), color: C.ink, alpha: a });
      text(ctx, note, x + Math.max(s, 14) + 10, FACT.y + 40 + side - 4, { font: F.jp(500, 17), color: C.ink2, alpha: a });
    };
    sq(M.l, smallSide, pop('won'), C.accent, '13 億', '追加の学習をしたモデル');
    sq(M.l + 330, side, big, C.ink, '1750 億', '元の GPT-3');
    const won = tw(t, at('f2.end') - 0.6, pace.enter);
    const RX = 1000;
    text(ctx, '人の評価で、13 億の方が多く好まれた', RX, FACT.y + 70, { font: F.jp(700, 20), color: C.accent, alpha: won });
    text(ctx, '評価に使ったプロンプトの範囲で', RX, FACT.y + 98, { font: F.jp(500, 16), color: C.ink2, alpha: won });
    const qa = focus(t, [at('q')], at('g.end') - cue.fall, cue).level[0];
    ring(ctx, M.l + 330, FACT.y + 40, side, side, qa, C.accent, 6);
    // what it says, and other ways
    const fit = pop('fit');
    text(ctx, '大きさだけでなく、指示に沿う追加の学習が、', RX, FACT.y + 146, { font: F.jp(700, 19), color: C.ink, alpha: fit });
    text(ctx, '答えの評価を大きく変えた（この実験で）', RX, FACT.y + 174, { font: F.jp(700, 19), color: C.ink, alpha: fit });
    const oa = pop('other');
    text(ctx, 'ほかのやり方：比べた結果から直接調整する（DPO）、', RX, FACT.y + 214, { font: F.jp(500, 16), color: C.ink2, alpha: oa });
    text(ctx, 'AI の評価を使う（RLAIF）など', RX, FACT.y + 236, { font: F.jp(500, 16), color: C.ink2, alpha: oa });

    example(ctx, M.l + 560, 112, g, 'プロンプト、答え、順位、点数は説明のための例');
    source(ctx, 'Ouyang ほか（2022）', fa, 960);
  },
});
