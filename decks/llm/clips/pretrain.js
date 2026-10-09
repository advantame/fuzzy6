// Pre-training: at every position of a text the model guesses the next token, the answer is
// revealed, and every parameter is nudged — harder when the guess was wrong. Then how much
// text this is done over. The sentence is split by o200k_base; the guesses are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { chip, chipWidth, example, source } from '../lib/parts.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, outExpo } from '../../../src/kit/ease.js';
import { hash2 } from '../../../src/kit/random.js';

const TOKENS = ['雨', 'が', '降', 'った', 'ので', '、', '試', '合', 'は', '中', '止', 'にな', 'った', '。'];
// the model's guess for each next token (index 1…13)
const GUESS = [null, 'が', '降', 'った', '。', '、', '外', '合', 'は', '中', '止', 'にな', 'った', '。'];
const FONT = F.jp(500, 38);
const ROW_Y = 196;
const H = 64;
const T0 = 1.0;
const STEP = 0.62;
const GRID = { x: M.l, y: 404, cols: 48, rows: 5, cell: 24, gap: 5 };
const DATA = 10.8;

const stepAt = (i) => T0 + (i - 1) * STEP; // when position i is guessed

export default clip({
  id: 'pretrain',
  title: '予測を練習する',
  kicker: '事前学習',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.4, text: '**事前学習**では、大量の文章の各位置で、\n次のトークンを当てる練習をさせる。' },
    { at: 5.6, to: 10.6, text: '外れた分だけ、パラメータを少しずつ直す。\nこれを、文章の全体にわたってくり返す。' },
    { at: 10.8, to: 18, text: '使う文章の量は増え続けている。\nGPT-3 は 3000 億トークン、Llama 3 は 15 兆トークン以上。' },
  ],

  prepare(ctx) {
    let x = M.l;
    const pos = TOKENS.map((s) => {
      const w = chipWidth(ctx, s, { font: FONT, padX: 14 });
      const out = { x, w };
      x += w + 10;
      return out;
    });
    return { pos };
  },

  draw(ctx, t, { pos }) {
    example(ctx, M.l, 64, tw(t, 0.5, 0.5), '予測は説明のための例');

    // ——— the sentence, one guess per position
    TOKENS.forEach((s, i) => {
      const { x, w } = pos[i];
      const a = tw(t, 0.3 + i * 0.03, 0.4);
      const shown = i === 0 || t >= stepAt(i) + 0.32;
      if (!shown) {
        // not yet seen: an empty card
        ctx.save();
        ctx.globalAlpha = a;
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = C.rule;
        ctx.lineWidth = 2;
        rr(ctx, x, ROW_Y, w, H, 10);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        if (i === TOKENS.length - 1 || t < stepAt(i)) return;
        text(ctx, '?', x + w / 2, ROW_Y + H / 2 + 2, { font: F.sans(600, 34), color: C.accent, align: 'center', base: 'middle' });
        return;
      }
      chip(ctx, x, ROW_Y, s, { font: FONT, padX: 14, h: H, fill: C.tints[i % C.tints.length], alpha: a });
    });

    // the current guess, above its position
    for (let i = 1; i < TOKENS.length; i++) {
      const at = stepAt(i);
      const vis = seg(t, at - 0.05, at + 0.1) * (1 - seg(t, at + STEP * 0.95, at + STEP * 1.2));
      if (vis <= 0) continue;
      const right = GUESS[i] === TOKENS[i];
      const judged = t >= at + 0.32;
      const { x, w } = pos[i];
      const gw = chipWidth(ctx, GUESS[i], { font: F.jp(500, 26), padX: 10 });
      const gx = x + w / 2 - gw / 2;
      chip(ctx, gx, ROW_Y - 66, GUESS[i], { font: F.jp(500, 26), padX: 10, h: 44, fill: judged ? (right ? C.greenSoft : '#ffd6d2') : C.panel, alpha: vis });
      if (judged) {
        text(ctx, right ? '○' : '×', gx + gw + 8, ROW_Y - 32, { font: F.sans(700, 24), color: right ? C.green : C.red, alpha: vis });
      }
    }
    // how far the reading has got
    const read = Math.max(0, Math.min(TOKENS.length - 1, Math.floor((t - T0) / STEP) + 1));
    if (t > T0) {
      const end = pos[Math.min(read, TOKENS.length - 1)];
      ctx.fillStyle = C.ink;
      ctx.fillRect(M.l, ROW_Y + H + 12, end.x - 10 - M.l, 4);
      text(ctx, '読んだ範囲', M.l, ROW_Y + H + 42, { font: F.jp(500, 18), color: C.muted });
    }

    // ——— the parameters, nudged after every guess (wrong guesses nudge harder)
    const ga = tw(t, 0.8, 0.6);
    if (ga > 0) {
      const g = GRID;
      text(ctx, 'パラメータ', g.x, g.y - 22, { font: F.jp(700, 22), color: C.ink2, alpha: ga });
      text(ctx, 'GPT-3 では 1750 億個', g.x + 130, g.y - 23, { font: F.jp(400, 18), color: C.muted, alpha: ga });
      let done = 0;
      for (let i = 1; i < TOKENS.length; i++) if (t >= stepAt(i) + 0.32) done = i;
      for (let r = 0; r < g.rows; r++) {
        for (let c = 0; c < g.cols; c++) {
          const id = r * g.cols + c;
          let v = 0.25 + 0.6 * hash2(id, 0);
          let flash = 0;
          for (let i = 1; i <= done; i++) {
            const wrong = GUESS[i] !== TOKENS[i];
            v += (hash2(id, i) - 0.5) * (wrong ? 0.5 : 0.08);
            // a ripple runs left to right through the grid after each judgement
            const at = stepAt(i) + 0.32 + (c / g.cols) * 0.35;
            const d = t - at;
            if (d >= 0 && d < 0.3) flash = Math.max(flash, (wrong ? 1 : 0.35) * (1 - d / 0.3));
          }
          v = Math.min(0.95, Math.max(0.08, v));
          const x = g.x + c * (g.cell + g.gap);
          const y = g.y + r * (g.cell + g.gap);
          ctx.globalAlpha = ga;
          ctx.fillStyle = C.ink;
          ctx.globalAlpha = ga * v;
          ctx.fillRect(x, y, g.cell, g.cell);
          if (flash > 0) {
            ctx.globalAlpha = ga * flash;
            ctx.fillStyle = C.accent;
            ctx.fillRect(x, y, g.cell, g.cell);
          }
          ctx.globalAlpha = 1;
        }
      }
    }

    // ——— how much text
    const d = tw(t, DATA, 0.6);
    if (d <= 0) return;
    text(ctx, '学習に使った文章の量', M.l, 640, { font: F.jp(700, 26), color: C.ink, alpha: d });
    const full = W - M.l - M.r - 240;
    const bars = [
      { name: 'GPT-3（2020）', n: 300e9, y: 700, label: '3000 億トークン' },
      { name: 'Llama 3（2024）', n: 15e12, y: 786, label: '15 兆トークン以上' },
    ];
    bars.forEach((b, i) => {
      const a = tw(t, DATA + 0.4 + i * 0.6, 0.5);
      const g = outExpo(seg(t, DATA + 0.5 + i * 0.6, DATA + 1.7 + i * 0.6));
      text(ctx, b.name, M.l, b.y - 8, { font: F.jp(500, 22), color: C.ink2, alpha: a });
      const w = Math.max(3, full * (b.n / 15e12) * g);
      ctx.fillStyle = i === 1 ? C.accent : C.ink;
      ctx.globalAlpha = a;
      ctx.fillRect(M.l + 210, b.y - 34, w, 40);
      ctx.globalAlpha = 1;
      const inside = i === 1;
      text(ctx, b.label, inside ? M.l + 210 + w - 16 : M.l + 210 + w + 14, b.y - 4, {
        font: F.cond(700, 34), color: inside ? '#fff' : C.ink, align: inside ? 'right' : 'left', alpha: tw(t, DATA + 1.0 + i * 0.6, 0.5),
      });
    });
    source(ctx, 'Brown ほか（2020）、Meta（2024）', tw(t, DATA + 0.8, 0.6));
  },
});
