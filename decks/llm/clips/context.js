// Context window: text keeps arriving, the window keeps only the most recent stretch, and
// anything older falls outside where the model cannot see it. Then how large the window has
// become, on one linear scale.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source } from '../lib/parts.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outExpo, inOutCubic } from '../../../src/kit/ease.js';
import { hash } from '../../../src/kit/random.js';

const COLS = 40;
const ROWS = 6;
const BW = 28;
const BH = 18;
const GX = 6;
const GY = 16;
const DOC = { x: M.l, y: 132 };
const WINDOW = 92; // blocks the window holds
const MODELS = [
  { name: 'GPT-3', year: '2020', n: 2048 },
  { name: 'GPT-4', year: '2023', n: 32768 },
  { name: 'Claude', year: '2023', n: 100000 },
  { name: 'Claude 2.1', year: '2023', n: 200000 },
  { name: 'Gemini 1.5 Pro', year: '2024', n: 1000000 },
];
const CHART = 5.8;
const BAR_X = 430;
const BAR_W = W - M.r - BAR_X - 150;

export default clip({
  id: 'context',
  title: '読める長さ',
  kicker: 'コンテキストウィンドウ',
  duration: 16.5,
  cues: [
    { at: 0.4, to: 5.6, text: 'モデルが一度に読めるトークンの数には上限がある。\nこれを**コンテキストウィンドウ**と呼ぶ。' },
    { at: 5.8, to: 11.0, text: '2020 年の GPT-3 は 2,048 トークン。\n2024 年には 100 万トークンを読めるモデルが出た。' },
    { at: 11.2, to: 18, text: '窓の外にある文章は、モデルからは見えない。' },
  ],

  draw(ctx, t) {
    // ——— the document grows; the window holds the newest WINDOW blocks
    const count = Math.round(lerp(64, COLS * ROWS, inOutCubic(seg(t, 1.2, 9.5))));
    const shown = Math.min(count, Math.round(64 * tw(t, 0.2, 0.9)) + Math.max(0, count - 64));
    const start = Math.max(0, count - WINDOW);
    const frame = tw(t, 1.0, 0.6);
    for (let i = 0; i < shown; i++) {
      const r = Math.floor(i / COLS);
      const c = i % COLS;
      const x = DOC.x + c * (BW + GX);
      const y = DOC.y + r * (BH + GY);
      const inside = i >= start;
      // a block's width varies a little, like words in a line
      const w = BW * (0.55 + 0.45 * hash(i * 7 + 3));
      ctx.fillStyle = inside ? C.ink : C.rule;
      ctx.globalAlpha = inside ? 1 : lerp(1, 0.75, frame);
      ctx.fillRect(x, y, w, BH);
    }
    ctx.globalAlpha = 1;
    // the window outline, row by row
    if (frame > 0 && shown > 0) {
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 4;
      ctx.globalAlpha = frame;
      const last = count - 1;
      for (let r = Math.floor(start / COLS); r <= Math.floor(last / COLS); r++) {
        const c0 = r === Math.floor(start / COLS) ? start % COLS : 0;
        const c1 = r === Math.floor(last / COLS) ? last % COLS : COLS - 1;
        const x0 = DOC.x + c0 * (BW + GX) - 8;
        const x1 = DOC.x + c1 * (BW + GX) + BW + 8;
        rr(ctx, x0, DOC.y + r * (BH + GY) - 8, x1 - x0, BH + 16, 8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const lastR = Math.floor(last / COLS);
      text(ctx, 'コンテキストウィンドウ（読める範囲）', W - M.r, DOC.y + (lastR + 1) * (BH + GY) + 22, {
        font: F.jp(700, 22), color: C.accent, align: 'right', alpha: tw(t, 1.6, 0.5),
      });
    }
    const out = tw(t, 11.2, 0.6);
    if (out > 0 && start > 0) {
      ctx.save();
      ctx.globalAlpha = out;
      text(ctx, '窓の外：モデルには見えない', DOC.x, DOC.y - 22, { font: F.jp(700, 22), color: C.muted });
      ctx.restore();
    }

    // ——— window sizes, one linear scale
    const c = tw(t, CHART, 0.6);
    if (c <= 0) return;
    ctx.fillStyle = C.rule;
    ctx.fillRect(M.l, 470, (W - M.l - M.r) * c, 2);
    text(ctx, '読めるトークンの数', M.l, 520, { font: F.jp(700, 26), color: C.ink, alpha: c });
    MODELS.forEach((m, i) => {
      const y = 556 + i * 58;
      const a = tw(t, CHART + 0.3 + i * 0.45, 0.4);
      if (a <= 0) return;
      text(ctx, m.name, M.l, y + 30, { font: F.sans(600, 24), color: C.ink, alpha: a });
      text(ctx, m.year, M.l + 250, y + 30, { font: F.mono(500, 18), color: C.muted, alpha: a });
      const g = outExpo(seg(t, CHART + 0.4 + i * 0.45, CHART + 1.4 + i * 0.45));
      const w = Math.max(3, BAR_W * (m.n / 1e6) * g);
      const hot = i === MODELS.length - 1;
      ctx.fillStyle = hot ? C.accent : i === 0 ? C.accent : C.ink;
      ctx.globalAlpha = a;
      ctx.fillRect(BAR_X, y + 6, w, 32);
      ctx.globalAlpha = 1;
      text(ctx, m.n.toLocaleString('en-US'), BAR_X + w + 14, y + 33, { font: F.cond(700, 30), color: i === 0 ? C.accent : C.ink, alpha: tw(t, CHART + 1.0 + i * 0.45, 0.4) });
    });
    text(ctx, '2026 年 10 月の主要モデルも、約 100 万トークン', BAR_X + BAR_W + 14, 556 + 4 * 58 + 66, {
      font: F.jp(500, 19), color: C.muted, align: 'right', alpha: tw(t, CHART + 3.0, 0.6),
    });
    source(ctx, 'OpenAI（2020, 2023）、Anthropic（2023）、Google（2024）', tw(t, CHART + 1.0, 0.6));
  },
});
