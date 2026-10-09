// RLHF: people compare two answers, a reward model learns to score like them, the LLM is
// tuned toward high scores. Then InstructGPT's result: a 1.3B tuned model preferred over the
// 175B GPT-3. The question, answers and scores are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { tag, example, source } from '../lib/parts.js';
import { text, rr, arrow, wrap, circle } from '../../../src/kit/draw.js';
import { tw, inOutCubic, outBack, outCubic } from '../../../src/kit/ease.js';

const QUESTION = '雨の日の過ごし方を 3 つ教えて';
const ANSWERS = [
  { id: 'A', body: '1. 本を読む\n2. 映画を見る\n3. 料理をする', score: 0.82 },
  { id: 'B', body: '雨の日にはいろいろありますが、まず雨とは空から水が落ちてくる現象で…', score: 0.21 },
];
const CARD = { y: 196, w: 400, h: 214, gap: 24 };
const FLOW = 5.6;
const FACT = 10.9;
const FACT_X = 1060;

export default clip({
  id: 'rlhf',
  title: '人の好みで磨く',
  kicker: 'RLHF',
  duration: 16.5,
  cues: [
    { at: 0.4, to: 5.4, text: '**RLHF** では、同じ質問への 2 つの応答を人が比べて、良い方を選ぶ。' },
    { at: 5.6, to: 10.7, text: '選んだ結果から、人の好みを点数にするモデルを作り、\nその点数が高くなるように LLM を調整する。' },
    { at: 10.9, to: 18, text: '2022 年の InstructGPT では、13 億パラメータの調整済みモデルが、\n1750 億の GPT-3 より好まれた。' },
  ],

  prepare(ctx) {
    return { bodies: ANSWERS.map((a) => wrap(ctx, F.jp(500, 22), a.body, CARD.w - 56)) };
  },

  draw(ctx, t, { bodies }) {
    // the question
    const qa = tw(t, 0.3, 0.5);
    text(ctx, '質問', M.l, 132, { font: F.jp(700, 20), color: C.muted, alpha: qa });
    text(ctx, QUESTION, M.l + 64, 134, { font: F.jp(700, 30), color: C.ink, alpha: qa });
    example(ctx, M.l + 560, 108, tw(t, 0.8, 0.5), '質問・応答・点数は説明のための例');

    // two answers; a person picks A
    const pick = tw(t, 2.7, 0.4);
    ANSWERS.forEach((a, i) => {
      const x = M.l + i * (CARD.w + CARD.gap);
      const p = tw(t, 0.8 + i * 0.3, 0.6, (q) => outBack(q, 1.4));
      if (p <= 0) return;
      const chosen = i === 0;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p) * (chosen ? 1 : 1 - 0.45 * pick);
      rr(ctx, x, CARD.y, CARD.w, CARD.h, 16);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = chosen && pick > 0 ? C.green : C.rule;
      ctx.lineWidth = chosen && pick > 0 ? 4 : 2;
      ctx.stroke();
      text(ctx, `応答 ${a.id}`, x + 28, CARD.y + 46, { font: F.jp(700, 22), color: C.ink2 });
      bodies[i].forEach((l, j) => text(ctx, l, x + 28, CARD.y + 92 + j * 34, { font: F.jp(500, 22), color: C.ink }));
      ctx.restore();
      if (chosen && pick > 0) {
        ctx.fillStyle = C.green;
        circle(ctx, x + CARD.w - 34, CARD.y + 34, 20 * outBack(pick, 2));
        ctx.fill();
        text(ctx, '✓', x + CARD.w - 34, CARD.y + 43, { font: F.sans(700, 24), color: '#fff', align: 'center', alpha: pick });
      }
    });
    const rank = tw(t, 3.3, 0.5);
    if (rank > 0) {
      const y = CARD.y + CARD.h + 44;
      text(ctx, '人が選ぶ', M.l, y, { font: F.jp(700, 22), color: C.ink2, alpha: rank });
      tag(ctx, M.l + 110, y - 26, 'A ＞ B', { font: F.mono(600, 20), h: 36, padX: 16, fill: C.green, color: '#fff', alpha: rank });
      text(ctx, 'これを大量に集める', M.l + 228, y, { font: F.jp(400, 21), color: C.muted, alpha: rank });
    }

    // the flow: comparisons → reward model → tuned LLM
    const f = tw(t, FLOW, 0.5);
    if (f > 0) {
      const y = 560;
      const boxes = [
        { x: M.l, w: 360, title: '報酬モデル', what: '人の好みを点数にする', at: FLOW },
        { x: M.l + 460, w: 364, title: 'LLM を調整', what: '点数が高い応答を出すように', at: FLOW + 2.0 },
      ];
      boxes.forEach((b, i) => {
        const a = tw(t, b.at, 0.5, (q) => outBack(q, 1.4));
        if (a <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.min(1, a);
        rr(ctx, b.x, y, b.w, 170, 16);
        ctx.fillStyle = i ? C.ink : C.panel;
        ctx.fill();
        ctx.restore();
        text(ctx, b.title, b.x + 28, y + 48, { font: F.jp(700, 28), color: i ? C.paper : C.ink, alpha: Math.min(1, a) });
        text(ctx, b.what, b.x + 28, y + 86, { font: F.jp(400, 20), color: i ? '#cfc9bd' : C.ink2, alpha: Math.min(1, a) });
      });
      // scores the reward model gives
      ANSWERS.forEach((a, i) => {
        const s = tw(t, FLOW + 0.8 + i * 0.3, 0.5);
        const yy = y + 124 + i * 0;
        const x = M.l + 28 + i * 160;
        text(ctx, `${a.id}`, x, yy + 6, { font: F.mono(600, 20), color: C.ink2, alpha: s });
        text(ctx, a.score.toFixed(2), x + 26, yy + 8, { font: F.cond(700, 34), color: i === 0 ? C.green : C.muted, alpha: s });
      });
      ctx.strokeStyle = C.ink;
      ctx.fillStyle = C.ink;
      ctx.lineWidth = 3;
      arrow(ctx, M.l + 372, y + 85, M.l + 450, y + 85, tw(t, FLOW + 1.6, 0.5, inOutCubic), 13);
      // from the comparison down to the reward model
      arrow(ctx, M.l + 180, CARD.y + CARD.h + 70, M.l + 180, y - 14, tw(t, FLOW - 0.2, 0.5, inOutCubic), 13);
    }

    // InstructGPT
    const fa = tw(t, FACT, 0.6);
    if (fa <= 0) return;
    ctx.fillStyle = C.rule;
    ctx.fillRect(FACT_X - 48, 150, 2, 640 * outCubic(fa));
    text(ctx, 'InstructGPT（2022）', FACT_X, 210, { font: F.sans(600, 26), color: C.ink, alpha: fa });
    const big = tw(t, FACT + 0.4, 0.7);
    text(ctx, '13 億', FACT_X, 336 + (1 - big) * 20, { font: F.cond(700, 128), color: C.accent, alpha: big, ls: -1 });
    text(ctx, 'パラメータの調整済みモデルが', FACT_X + 4, 382, { font: F.jp(500, 23), color: C.ink2, alpha: big });
    const small = tw(t, FACT + 1.0, 0.6);
    text(ctx, '1750 億', FACT_X, 478, { font: F.cond(700, 72), color: C.ink, alpha: small });
    text(ctx, 'パラメータの GPT-3 より', FACT_X + 4, 518, { font: F.jp(500, 23), color: C.ink2, alpha: small });
    const won = tw(t, FACT + 1.5, 0.5);
    text(ctx, '好まれた', FACT_X, 590, { font: F.jp(700, 40), color: C.ink, alpha: won });
    const cap = tw(t, FACT + 1.9, 0.6);
    ['人が応答を比べた評価で、', '評価に使った質問の範囲で', 'より好まれた'].forEach((l, i) =>
      text(ctx, l, FACT_X, 656 + i * 34, { font: F.jp(400, 22), color: C.muted, alpha: cap }),
    );
    source(ctx, 'Ouyang ほか（2022）', cap);
  },
});
