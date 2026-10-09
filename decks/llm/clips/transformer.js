// 2017, the Transformer: the older way reads a sentence one word after another; the
// Transformer looks at every word against every other at once — so it trains in parallel.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { COL, yearBlock, chip, chipWidth } from '../lib/parts.js';
import { text, wipe, quadPoints, path, arrowHead, rr } from '../../../src/kit/draw.js';
import { tw, seg, outBack, outCubic, inOutCubic } from '../../../src/kit/ease.js';

const WORDS = ['The', 'cat', 'sat', 'on', 'the', 'mat'];
const FONT = F.sans(500, 26);
const ROW_A = 352; // chip tops
const ROW_B = 650;
const A_AT = 4.7;
const STEP = 0.42;
const B_AT = 8.0;

export default clip({
  id: 'transformer',
  title: '全部を一度に見る',
  kicker: '2017 · Transformer',
  duration: 16.5,
  cues: [
    { at: 0.4, to: 4.6, text: '2017 年、Google を中心とする研究者 8 人が\n論文「Attention Is All You Need」を発表した。' },
    { at: 4.8, to: 10.6, text: 'それまでの主流（RNN）は、単語を 1 つずつ順に処理した。\nTransformer は、**すべての単語を一度に**見比べる。' },
    { at: 10.8, to: 18, text: '並べて計算できるので、大きく育てられるようになった。\nGPT の T は、Transformer の T。' },
  ],

  prepare(ctx) {
    const gap = 18;
    let x = COL;
    const pos = WORDS.map((w) => {
      const cw = chipWidth(ctx, w, { font: FONT, padX: 18 });
      const out = { x, w: cw, c: x + cw / 2 };
      x += cw + gap;
      return out;
    });
    return { pos };
  },

  draw(ctx, t, { pos }) {
    yearBlock(ctx, t, { year: '2017', who: 'Transformer', what: ['Google を中心とする 8 人', 'NIPS 2017'] });

    wipe(ctx, tw(t, 0.5, 1.1, outCubic), COL, 120, W - M.r - COL, 80, () => {
      text(ctx, 'Attention Is All You Need', COL, 178, { font: F.sans(600, 54), color: C.ink, ls: -0.5 });
    });
    text(ctx, 'Vaswani · Shazeer · Parmar · Uszkoreit · Jones · Gomez · Kaiser · Polosukhin', COL, 216, {
      font: F.sans(400, 19), color: C.muted, alpha: tw(t, 1.3, 0.8),
    });

    // ——— before: one word at a time
    const a = tw(t, A_AT, 0.5);
    if (a > 0) {
      const lw = text(ctx, 'それまで（RNN）', COL, ROW_A - 34, { font: F.jp(700, 24), color: C.ink, alpha: a });
      text(ctx, '1 語ずつ順に読む', COL + lw + 16, ROW_A - 35, { font: F.jp(400, 22), color: C.muted, alpha: a });
      const read = (t - A_AT - 0.6) / STEP; // how many words have been read
      pos.forEach((p, i) => {
        const pop = tw(t, A_AT + 0.15 + i * 0.05, 0.4);
        const done = read >= i + 1;
        const now = read >= i && read < i + 1;
        chip(ctx, p.x, ROW_A, WORDS[i], { font: FONT, padX: 18, h: 52, alpha: pop, fill: done || now ? C.ink : C.panel, color: done || now ? C.paper : C.ink });
        if (now) {
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 4;
          rr(ctx, p.x - 6, ROW_A - 6, p.w + 12, 64, 14);
          ctx.stroke();
        }
        // the state handed from word to word
        if (i > 0 && read >= i) {
          const q = outCubic(seg(read, i, i + 0.6));
          const x0 = pos[i - 1].x + pos[i - 1].w + 2;
          const x1 = p.x - 2;
          ctx.strokeStyle = C.ink;
          ctx.fillStyle = C.ink;
          ctx.lineWidth = 2;
          const end = path(ctx, [[x0, ROW_A + 26], [x0 + (x1 - x0) * q, ROW_A + 26]], 1);
          if (q > 0.9 && end) arrowHead(ctx, end.x, end.y, 0, 9);
        }
      });
      const steps = Math.max(0, Math.min(6, Math.ceil(read)));
      if (steps > 0) {
        text(ctx, `${steps}`, W - M.r - 96, ROW_A + 40, { font: F.cond(700, 48), color: C.ink, align: 'right' });
        text(ctx, 'ステップ', W - M.r, ROW_A + 38, { font: F.jp(500, 22), color: C.ink2, align: 'right' });
      }
    }

    // ——— Transformer: every word against every other, at once
    const b = tw(t, B_AT, 0.5);
    if (b > 0) {
      const lw = text(ctx, 'Transformer', COL, 480, { font: F.sans(700, 26), color: C.ink, alpha: b });
      text(ctx, '全部の語を一度に見比べる', COL + lw + 16, 479, { font: F.jp(400, 22), color: C.muted, alpha: b });
      const arcs = tw(t, B_AT + 0.7, 1.0, inOutCubic);
      if (arcs > 0) {
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.85;
        for (let i = 0; i < pos.length; i++) {
          for (let j = i + 1; j < pos.length; j++) {
            const d = pos[j].c - pos[i].c;
            const h = Math.min(118, 26 + d * 0.28);
            path(ctx, quadPoints(pos[i].c, ROW_B - 4, (pos[i].c + pos[j].c) / 2, ROW_B - 4 - h * 2, pos[j].c, ROW_B - 4, 32), arcs);
          }
        }
        ctx.globalAlpha = 1;
      }
      const lit = seg(t, B_AT + 0.6, B_AT + 0.7);
      pos.forEach((p, i) => {
        const pop = tw(t, B_AT + 0.15 + i * 0.05, 0.5, (q) => outBack(q, 1.6));
        chip(ctx, p.x, ROW_B, WORDS[i], { font: FONT, padX: 18, h: 52, alpha: Math.min(1, pop), fill: lit ? C.accent : C.panel, color: lit ? '#fff' : C.ink });
      });
      if (lit) {
        text(ctx, '1', W - M.r - 96, ROW_B + 40, { font: F.cond(700, 48), color: C.accent, align: 'right' });
        text(ctx, 'ステップ', W - M.r, ROW_B + 38, { font: F.jp(500, 22), color: C.ink2, align: 'right' });
      }
    }

    // ——— the T in GPT
    const g = tw(t, 11.0, 0.7);
    if (g > 0) {
      let x = COL;
      x += text(ctx, 'GPT', x, 800, { font: F.sans(700, 30), color: C.ink, alpha: g });
      x += text(ctx, '  =  Generative Pre-trained ', x, 800, { font: F.sans(400, 28), color: C.ink2, alpha: g });
      text(ctx, 'Transformer', x, 800, { font: F.sans(700, 28), color: C.accent, alpha: g });
    }
  },
});
