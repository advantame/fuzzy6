// Prompt caching: an agent re-sends its whole, growing document with every request, and the
// beginning is the same as last time. The provider keeps the KV cache of that beginning and
// computes only what was added; tokens read from the cache cost a fraction of the normal input
// price. Block sizes are an example; the price ratio is Claude Sonnet 5.5's (cache read = 0.05×
// input, 2026-10-10).

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outExpo } from '../../../src/kit/ease.js';

// the document's parts, in tokens (example); each request adds the parts after its predecessor
const PARTS = [
  ['システム', 96], ['ツール', 96], ['依頼', 56],
  ['呼出', 30], ['結果', 130],
  ['呼出', 30], ['結果', 156],
  ['呼出', 30], ['結果', 100], ['答え', 62],
];
const UPTO = [3, 5, 7, 10]; // parts sent in requests 1–4
const READ = 0.05; // cache read, relative to the normal input price (Claude Sonnet 5.5)
const X0 = 230;
const PX = 1; // px per token
const ROW_Y = [206, 318, 430, 542];
const ROW_H = 52;
const SENT = [0.9, 3.0, 6.0, 8.4];
const COST_X = 1090;
const COST_W = 320;
const DATES_Y = 712;

const ends = [];
let acc = 0;
PARTS.forEach(([, n]) => ends.push((acc += n)));
const tokensAt = (k) => ends[UPTO[k] - 1];

export default clip({
  id: 'promptcache',
  title: '前の続きから',
  kicker: 'プロンプトキャッシュ',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'ハーネスは毎回、伸びた文書を丸ごと読ませる。\n頭の部分は、前のリクエストとまったく同じ。' },
    { at: 5.8, to: 11.0, text: '提供元は、同じ頭の KV キャッシュを取っておき、\n続きの分だけを計算する。これが**プロンプトキャッシュ**。' },
    { at: 11.2, to: 18, text: 'キャッシュから読んだ分は、安くて速い。\nClaude Sonnet 5.5 なら、通常の入力の 20 分の 1 の値段になる。' },
  ],

  draw(ctx, t) {
    const ha = tw(t, 0.2, 0.5);
    text(ctx, 'ハーネスが読ませる文書', X0, 146, { font: F.jp(700, 22), color: C.ink, alpha: ha });
    text(ctx, '入力の値段', COST_X, 146, { font: F.jp(700, 22), color: C.ink, alpha: tw(t, SENT[1] + 1.4, 0.5) });
    // legend
    const lg = tw(t, SENT[1] + 0.6, 0.5);
    legend(ctx, X0 + 250, 128, C.greenSoft, C.green, 'キャッシュから読む', lg);
    legend(ctx, X0 + 470, 128, C.accentSoft, C.accent, '新しく計算する', lg);

    UPTO.forEach((n, k) => {
      const y = ROW_Y[k];
      const at = SENT[k];
      const a = tw(t, at, 0.5);
      if (a <= 0) return;
      text(ctx, `${k + 1} 回目`, M.l, y + 33, { font: F.jp(700, 21), color: C.ink, alpha: a });
      const cached = k === 0 ? 0 : tokensAt(k - 1);
      const total = tokensAt(k);
      // the provider reads the cached part fast, then computes the rest
      const hit = seg(t, at + 0.5, at + 0.8);
      const run = seg(t, at + 0.9, at + 1.9);
      let x = X0;
      for (let i = 0; i < n; i++) {
        const [name, len] = PARTS[i];
        const w = len * PX;
        const start = ends[i] - len;
        const isCached = start < cached;
        // how far the processing has got through this part
        const reached = isCached ? hit : run;
        const p0 = isCached ? start / Math.max(1, cached) : (start - cached) / Math.max(1, total - cached);
        const p1 = isCached ? ends[i] / Math.max(1, cached) : (ends[i] - cached) / Math.max(1, total - cached);
        const fill = seg(reached, p0, p1);
        ctx.save();
        ctx.globalAlpha = a;
        rr(ctx, x, y, w - 4, ROW_H, 6);
        ctx.fillStyle = C.panel;
        ctx.fill();
        if (fill > 0) {
          ctx.save();
          ctx.clip();
          ctx.fillStyle = isCached ? C.greenSoft : C.accentSoft;
          ctx.fillRect(x, y, (w - 4) * fill, ROW_H);
          ctx.restore();
        }
        ctx.strokeStyle = fill >= 1 ? (isCached ? C.green : C.accent) : C.rule;
        ctx.lineWidth = 2;
        rr(ctx, x, y, w - 4, ROW_H, 6);
        ctx.stroke();
        ctx.restore();
        if (w >= 56) text(ctx, name, x + 10, y + 33, { font: F.jp(500, 18), color: C.ink2, alpha: a });
        x += w;
      }
      // the bracket over the part that matches the last request
      if (k > 0) {
        const b = tw(t, at + 0.3, 0.4) * (k === UPTO.length - 1 ? 1 : 1 - tw(t, SENT[k + 1], 0.4));
        if (b > 0) {
          const bx1 = X0 + cached * PX - 4;
          ctx.save();
          ctx.globalAlpha = b;
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(X0, y - 8);
          ctx.lineTo(X0, y - 14);
          ctx.lineTo(bx1, y - 14);
          ctx.lineTo(bx1, y - 8);
          ctx.stroke();
          ctx.restore();
          text(ctx, '前と同じ頭', bx1 + 10, y - 7, { font: F.jp(700, 17), color: C.green, alpha: b });
        }
      }

      // the price of this request's input, against what it would cost without the cache
      const ca = tw(t, Math.max(at + 1.9, SENT[1] + 1.4), 0.5);
      if (ca <= 0) return;
      const scale = COST_W / tokensAt(UPTO.length - 1);
      const full = total * scale;
      const cost = (cached * READ + (total - cached)) * scale;
      ctx.save();
      ctx.globalAlpha = ca;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(COST_X, y + 6, full, ROW_H - 12);
      ctx.setLineDash([]);
      const g = outExpo(seg(t, Math.max(at + 2.0, SENT[1] + 1.5), Math.max(at + 2.8, SENT[1] + 2.3)));
      ctx.fillStyle = C.green;
      ctx.fillRect(COST_X, y + 6, cached * READ * scale * g, ROW_H - 12);
      ctx.fillStyle = C.accent;
      ctx.fillRect(COST_X + cached * READ * scale * g, y + 6, (total - cached) * scale * g, ROW_H - 12);
      ctx.restore();
      const pct = Math.round((cost / full) * 100);
      text(ctx, k === 0 ? '100%' : `${pct}%`, COST_X + Math.max(full, cost) + 12, y + 35, { font: F.cond(700, 26), color: k === 0 ? C.ink2 : C.green, alpha: tw(t, Math.max(at + 2.6, SENT[1] + 2.1), 0.4) });
    });
    const na = tw(t, 11.4, 0.5);
    text(ctx, '点線は、キャッシュがない場合の値段', COST_X, ROW_Y[3] + ROW_H + 34, { font: F.jp(400, 17), color: C.muted, alpha: na });

    // ——— when providers started offering it
    const da = tw(t, 12.4, 0.6);
    if (da > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, DATES_Y - 40, (W - M.l - M.r) * outExpo(da), 2);
      [
        ['2024 年 6 月', 'Google', '指定して残す'],
        ['2024 年 8 月', 'Anthropic', '区切りを指定して残す'],
        ['2024 年 8 月', 'DeepSeek', '自動。ディスクに残す'],
        ['2024 年 10 月', 'OpenAI', '自動'],
      ].forEach(([when, who, how], i) => {
        const a = tw(t, 12.6 + i * 0.2, 0.5);
        const x = M.l + i * 352;
        const w = text(ctx, when, x, DATES_Y, { font: F.cond(700, 26), color: C.ink, alpha: a });
        text(ctx, who, x + w + 14, DATES_Y, { font: F.sans(600, 22), color: C.ink, alpha: a });
        text(ctx, how, x, DATES_Y + 32, { font: F.jp(400, 18), color: C.ink2, alpha: a });
      });
    }

    example(ctx, M.l, 818, tw(t, 1.6, 0.5), '文書の長さは例。値段は Claude Sonnet 5.5 の比率（読み出しは 20 分の 1）で、書き込みの割増しは省いた');
    source(ctx, 'Google、Anthropic、DeepSeek、OpenAI の発表と現行の文書（2026-10-10 確認）', da);
  },
});

function legend(ctx, x, y, fill, stroke, s, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y - 2, 26, 22, 4);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, s, x + 36, y + 16, { font: F.jp(500, 18), color: C.ink2, alpha: a });
}
