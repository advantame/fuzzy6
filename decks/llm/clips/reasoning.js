// Reasoning models write a thinking passage before the answer; it is produced by the same
// next-token prediction and counted as output tokens. How much to think can be chosen (effort):
// the same question with little, some and more thinking. The question and passages are an
// example; the token counts are the passages on screen counted with o200k_base.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, source } from '../lib/parts.js';
import { text, rr, wrap, typed } from '../../../src/kit/draw.js';
import { tw, seg, outExpo } from '../../../src/kit/ease.js';

const Q = '17 × 24 は？';
const ANSWER = '408 です。';
const LEVELS = {
  low: { name: '少', think: '17 × 24 = 408。', tokens: 8 },
  mid: { name: '中', think: '17 × 24 を分けて計算する。17 × 20 = 340、17 × 4 = 68。合わせて 408。', tokens: 33 },
  high: {
    name: '多',
    think: '17 × 24 を分けて計算する。17 × 20 = 340、17 × 4 = 68。合わせて 408。別の分け方で確かめる。24 × 17 = 24 × 10 + 24 × 7 = 240 + 168 = 408。二つが一致したので、答えは 408。',
    tokens: 83,
  },
};
const ANSWER_TOKENS = 4;
// when each level is written: [start, thinking done, answer done]
const RUNS = [
  ['mid', 0.9, 3.7, 4.3],
  ['low', 6.0, 6.4, 6.8],
  ['high', 7.4, 10.0, 10.5],
];
const DOC = { x: M.l, y: 196, w: 900, h: 300 };
const FONT = F.jp(500, 24);
const LH = 38;
const MX = 1090;
const ROWS = ['low', 'mid', 'high'];

export default clip({
  id: 'reasoning',
  title: '考えてから答える',
  kicker: '推論モデル',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: '推論モデルは、答える前に、考える文章を書く。\nこれも次の一語の予測で、出力のトークンとして数える。' },
    { at: 5.8, to: 11.0, text: '考える量は選べる。多く考えさせるほど、\n難しい問題で正しくなりやすいが、時間と値段がかかる。' },
    { at: 11.2, to: 18, text: '2025 年 1 月の DeepSeek-R1 は、考えた文章も読める推論モデルを、\n重みを公開して出した。' },
  ],

  prepare(ctx) {
    const lines = {};
    for (const [k, v] of Object.entries(LEVELS)) lines[k] = wrap(ctx, FONT, v.think, DOC.w - 60);
    return { lines };
  },

  draw(ctx, t, { lines }) {
    // ——— the question
    const qa = tw(t, 0.2, 0.5);
    tag(ctx, M.l, 118, 'ユーザー', { font: F.jp(700, 17), h: 30, padX: 12, fill: C.blue, color: '#fff', alpha: qa });
    text(ctx, Q, M.l + 110, 142, { font: F.jp(700, 30), color: C.ink, alpha: qa });

    // which run is on the page
    let run = RUNS[0];
    for (const r of RUNS) if (t >= r[1] - 0.2) run = r;
    const [key, start, thought, answered] = run;
    const lv = LEVELS[key];

    // ——— the effort switch
    const sa = tw(t, 0.5, 0.5);
    text(ctx, '考える量（effort）', DOC.x + DOC.w - 250, 142, { font: F.jp(500, 18), color: C.muted, align: 'right', alpha: sa });
    ROWS.forEach((k, i) => {
      const on = k === key;
      tag(ctx, DOC.x + DOC.w - 230 + i * 78, 116, LEVELS[k].name, { font: F.jp(700, 19), h: 34, padX: 24, fill: on ? C.accent : '#fff', stroke: on ? C.accent : C.rule, color: on ? '#fff' : C.ink2, alpha: sa });
    });

    // ——— what the model writes
    const da = tw(t, 0.7, 0.5);
    ctx.save();
    ctx.globalAlpha = da;
    rr(ctx, DOC.x, DOC.y, DOC.w, DOC.h, 14);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    text(ctx, 'モデルが書く文章', DOC.x, DOC.y - 14, { font: F.jp(700, 18), color: C.ink2, alpha: da });
    const tp = seg(t, start, thought);
    tag(ctx, DOC.x + 24, DOC.y + 22, '考える', { font: F.jp(700, 17), h: 30, padX: 12, fill: C.panel, color: C.ink2, alpha: da });
    // the thinking passage, typed in
    const all = lines[key];
    const total = all.reduce((n, l) => n + Array.from(l).length, 0);
    let left = Math.round(total * tp);
    all.forEach((l, i) => {
      if (left <= 0) return;
      const n = Array.from(l).length;
      text(ctx, typed(l, Math.min(1, left / n)), DOC.x + 30, DOC.y + 92 + i * LH, { font: FONT, color: C.ink2 });
      left -= n;
    });
    // the answer
    const ay = DOC.y + 92 + all.length * LH + 26;
    const ap = seg(t, thought + 0.05, answered);
    if (ap > 0) {
      tag(ctx, DOC.x + 24, ay - 24, '答え', { font: F.jp(700, 17), h: 30, padX: 12, fill: C.ink, color: '#fff' });
      text(ctx, typed(ANSWER, ap), DOC.x + 110, ay - 1, { font: F.jp(700, 28), color: C.ink });
    }
    // caret
    if (t < answered + 0.4 && t > start - 0.2 && Math.floor(t * 2.5) % 2 === 0) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(DOC.x + DOC.w - 40, DOC.y + 24, 4, 26);
    }

    // ——— output tokens, per effort
    const ma = tw(t, 1.0, 0.5);
    text(ctx, '出力のトークン', MX, DOC.y - 14, { font: F.jp(700, 20), color: C.ink, alpha: ma });
    text(ctx, 'o200k_base で数えた', MX + 160, DOC.y - 14, { font: F.jp(400, 16), color: C.muted, alpha: ma });
    const scale = 300 / (LEVELS.high.tokens + ANSWER_TOKENS);
    ROWS.forEach((k, i) => {
      const r = RUNS.find((x) => x[0] === k);
      const y = DOC.y + 30 + i * 96;
      const a = tw(t, r[1] - 0.2, 0.4);
      if (a <= 0) return;
      const live = k === key && t < r[3] + 0.2;
      const think = live ? Math.round(LEVELS[k].tokens * seg(t, r[1], r[2])) : LEVELS[k].tokens;
      const ans = live ? Math.round(ANSWER_TOKENS * seg(t, r[2], r[3])) : ANSWER_TOKENS;
      text(ctx, LEVELS[k].name, MX, y + 30, { font: F.jp(700, 24), color: k === key ? C.accent : C.ink, alpha: a });
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = C.ink2;
      ctx.globalAlpha = a * 0.45;
      ctx.fillRect(MX + 44, y + 8, think * scale, 30);
      ctx.globalAlpha = a;
      ctx.fillStyle = C.ink;
      ctx.fillRect(MX + 44 + think * scale, y + 8, ans * scale, 30);
      ctx.restore();
      text(ctx, `${think + ans}`, MX + 44 + (think + ans) * scale + 12, y + 34, { font: F.cond(700, 30), color: C.ink, alpha: a });
      text(ctx, `考える ${think}　答え ${ans}`, MX + 44, y + 62, { font: F.jp(400, 16), color: C.muted, alpha: a });
    });

    // ——— reasoning models so far
    const ya = tw(t, 11.2, 0.6);
    if (ya > 0) {
      const y = 660;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 44, (W - M.l - M.r) * outExpo(ya), 2);
      [
        ['2024 年 9 月', 'OpenAI o1', '考えた文章そのものは返さない'],
        ['2025 年 1 月', 'DeepSeek-R1', '重みを公開。考えた文章も読める'],
        ['2026 年 4 月', 'DeepSeek-V4', '考えない、または low・high・max'],
      ].forEach(([when, who, what], i) => {
        const a = tw(t, 11.4 + i * 0.25, 0.5);
        const x = M.l + i * 470;
        const w = text(ctx, when, x, y, { font: F.cond(700, 26), color: C.ink, alpha: a });
        text(ctx, who, x + w + 14, y, { font: F.sans(600, 22), color: i === 1 ? C.accent : C.ink, alpha: a });
        text(ctx, what, x, y + 34, { font: F.jp(400, 19), color: C.ink2, alpha: a });
      });
    }

    example(ctx, M.l, 818, tw(t, 1.2, 0.5), '問題と考える文章は例。トークン数は画面の文を o200k_base で数えた');
    source(ctx, 'OpenAI（2024）、DeepSeek-AI（2025、2026）', ya);
  },
});
