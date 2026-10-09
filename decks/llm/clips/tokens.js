// Tokens: a Japanese and an English sentence split by a real tokenizer (o200k_base, used by
// GPT-4o), with each token's number — the numbers are what the model actually reads.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { caption, source } from '../lib/parts.js';
import { text, measure, rr } from '../../../src/kit/draw.js';
import { tw, lerp, outCubic } from '../../../src/kit/ease.js';

// js-tiktoken 1.0.21, o200k_base (2026-10-10)
const ROWS = [
  {
    label: '日本語', count: '20 文字 → 17 トークン', y: 180, at: 0.3, font: F.jp(500, 40), pad: 10,
    toks: ['大', '規', '模', '言', '語', 'モデル', 'は', '、', '次', 'の', '一', '語', 'を', '予', '測', 'する', '。'],
    ids: [1640, 73407, 22801, 17765, 40909, 187451, 5205, 1395, 11445, 3385, 2432, 40909, 7277, 35940, 134925, 39065, 788],
  },
  {
    label: '英語', count: '39 文字 → 7 トークン', y: 420, at: 5.4, font: F.sans(500, 38), pad: 12,
    toks: ['Language', ' models', ' predict', ' the', ' next', ' token', '.'],
    ids: [17238, 7015, 17946, 290, 2613, 6602, 13],
  },
];
const GAP = 10;
const H = 64;
const VOCAB = 10.8;
const TABLE = [[788, '。'], [3385, 'の'], [5205, 'は'], [40909, '語'], [187451, 'モデル']];

export default clip({
  id: 'tokens',
  title: 'トークンに切る',
  kicker: 'トークン化',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.2, text: 'LLM は文章を、**トークン**という単位に切って扱う。' },
    { at: 5.4, to: 10.6, text: 'この例では、英語は 1 語が 1 トークン。\n日本語は 20 文字が 17 トークンになった。' },
    { at: 10.8, to: 18, text: 'トークンには番号が振られている。\nモデルが実際に読み書きするのは、この番号の列だ。' },
  ],

  prepare(ctx) {
    const rows = ROWS.map((r) => {
      let packed = M.l;
      let gapped = M.l;
      const toks = r.toks.map((s, i) => {
        const tw0 = measure(ctx, r.font, s);
        const out = { s, id: r.ids[i], tw: tw0, packed, gapped };
        packed += tw0;
        gapped += tw0 + r.pad * 2 + GAP;
        return out;
      });
      return { ...r, toks };
    });
    return { rows };
  },

  draw(ctx, t, { rows }) {
    rows.forEach((r, ri) => {
      const a = tw(t, r.at, 0.6);
      if (a <= 0) return;
      caption(ctx, r.label, M.l, r.y - 26, { font: F.jp(700, 22), color: C.ink2, ls: 0, alpha: a });
      const split = r.at + 0.9;
      r.toks.forEach((tk, i) => {
        const s = tw(t, split + i * 0.05, 0.7);
        const x = lerp(tk.packed, tk.gapped + r.pad, s);
        // the chip grows around its text as the sentence splits
        if (s > 0) {
          ctx.save();
          ctx.globalAlpha = s;
          rr(ctx, x - r.pad * s, r.y, tk.tw + r.pad * 2 * s, H, 10);
          ctx.fillStyle = C.tints[i % C.tints.length];
          ctx.fill();
          ctx.restore();
        }
        // a leading space shows as a small dot
        const lead = tk.s.startsWith(' ');
        if (lead && s > 0) {
          ctx.fillStyle = C.muted;
          ctx.globalAlpha = s;
          ctx.beginPath();
          ctx.arc(x + measure(ctx, r.font, ' ') / 2, r.y + H / 2 + 4, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        text(ctx, tk.s, x, r.y + H / 2 + 2, { font: r.font, color: C.ink, base: 'middle', alpha: a });
        const id = tw(t, split + 1.0 + i * 0.04, 0.4);
        const cx = x + tk.tw / 2;
        text(ctx, String(tk.id), cx, r.y + H + 30 + (1 - id) * 8, { font: F.mono(500, 16), color: C.muted, align: 'center', alpha: id });
      });
      text(ctx, r.count, W - M.r, r.y - 26, { font: F.jp(700, 24), color: C.accent, align: 'right', alpha: tw(t, split + 1.4, 0.5) });
      // the two 語 in the Japanese row are one token with one number
      if (ri === 0) {
        const same = tw(t, VOCAB + 1.8, 0.5);
        if (same > 0) {
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 3;
          ctx.globalAlpha = same;
          for (const i of [4, 11]) {
            const tk = r.toks[i];
            rr(ctx, tk.gapped - 3, r.y - 3, tk.tw + r.pad * 2 + 6, H + 6, 12);
            ctx.stroke();
          }
          const x0 = r.toks[4].gapped + (r.toks[4].tw + r.pad * 2) / 2;
          const x1 = r.toks[11].gapped + (r.toks[11].tw + r.pad * 2) / 2;
          const yb = r.y + H + 46;
          ctx.beginPath();
          ctx.moveTo(x0, yb - 8);
          ctx.lineTo(x0, yb);
          ctx.lineTo(x1, yb);
          ctx.lineTo(x1, yb - 8);
          ctx.stroke();
          ctx.globalAlpha = 1;
          text(ctx, '同じトークンは同じ番号', (x0 + x1) / 2, yb + 30, { font: F.jp(700, 20), color: C.accent, align: 'center', alpha: same });
        }
      }
    });

    // the vocabulary: every token has its number
    const v = tw(t, VOCAB, 0.6);
    if (v <= 0) return;
    ctx.fillStyle = C.rule;
    ctx.fillRect(M.l, 600, (W - M.l - M.r) * outCubic(v), 2);
    caption(ctx, '語彙', M.l, 652, { font: F.jp(700, 22), color: C.ink2, ls: 0, alpha: v });
    const nw = text(ctx, '約 20 万', M.l, 770, { font: F.cond(700, 112), color: C.ink, alpha: v, ls: -1 });
    text(ctx, '種類のトークン', M.l + nw + 16, 768, { font: F.jp(700, 30), color: C.ink, alpha: v });
    text(ctx, 'GPT-4o のトークナイザ o200k_base', M.l, 812, { font: F.jp(400, 20), color: C.muted, alpha: v });

    const tx = 1010;
    caption(ctx, '番号', tx, 652, { font: F.jp(700, 20), color: C.ink2, ls: 0, alpha: v });
    caption(ctx, 'トークン', tx + 180, 652, { font: F.jp(700, 20), color: C.ink2, ls: 0, alpha: v });
    TABLE.forEach(([id, s], i) => {
      const a = tw(t, VOCAB + 0.4 + i * 0.12, 0.4);
      const y = 690 + i * 34;
      text(ctx, String(id), tx + 140, y, { font: F.mono(500, 20), color: C.ink2, align: 'right', alpha: a });
      text(ctx, s, tx + 180, y, { font: F.jp(500, 22), color: C.ink, alpha: a });
    });
    source(ctx, '分割と番号は o200k_base（js-tiktoken）で求めた', tw(t, 1.4, 0.6));
  },
});
