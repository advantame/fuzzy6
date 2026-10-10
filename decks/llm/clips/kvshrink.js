// Shrinking the KV cache. With one key/value pair per query head the cache is large; groups of
// heads can share a pair (GQA: Llama 3.1 70B has 64 query heads and 8 pairs), or all heads one
// (MQA). DeepSeek-V2's MLA caches one small compressed vector per token and expands it into
// every head's key and value when needed. Bytes per token are arithmetic on published configs
// (the all-heads figure is the same shape with 64 pairs, a calculation).

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { text, rr, line, arrow } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outExpo } from '../../../src/kit/ease.js';

const N = 64;
const G = 8;
const QX0 = 300;
const QS = 14;
const Q_Y = 176;
const KV_Y = 318;
const KV_H = 34;
const GHOST_Y = 456;
const qx = (i) => QX0 + i * QS;
const MID = (qx(0) + qx(N - 1)) / 2;

const T = { pairs: 0.8, gqa: 3.0, mqa: 5.8, mla: 8.0, bars: 1.6 };
const BAR = { x: 700, y: 586, step: 58, w: 620 };
const MB = (b) => b / 1e6;
const SIZES = [
  { name: 'ヘッドごとに 1 組', who: 'Llama 3.1 70B の形で計算', bytes: 2 * 80 * 64 * 128 * 2, at: T.bars },
  { name: '8 組を分け合う（GQA）', who: 'Llama 3.1 70B', bytes: 2 * 80 * 8 * 128 * 2, at: T.gqa + 1.4 },
  { name: '圧縮して覚える（MLA）', who: 'DeepSeek-V3', bytes: 576 * 61 * 2, at: T.mla + 2.2, hot: true },
];

export default clip({
  id: 'kvshrink',
  title: '小さく覚える',
  kicker: 'GQA と MLA',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'クエリのヘッドごとにキーとバリューを持つと、キャッシュは大きい。\nいくつかのヘッドで 1 組を分け合えば、その分だけ小さくなる。' },
    { at: 5.8, to: 11.0, text: 'DeepSeek-V2（2024 年）は、キーとバリューを\n小さなベクトルに圧縮して覚え、使うときに戻す（MLA）。' },
    { at: 11.2, to: 18, text: '6710 億パラメータの DeepSeek-V3 でも、1 トークンで約 0.07 MB。\n小さく覚える工夫が、長い文脈を扱いやすくしてきた。' },
  ],

  draw(ctx, t) {
    const p1 = inOutCubic(seg(t, T.gqa, T.gqa + 1.2));
    const p2 = inOutCubic(seg(t, T.mqa, T.mqa + 1.2));
    const p3 = inOutCubic(seg(t, T.mla, T.mla + 1.0));

    // ——— query heads
    const qa = tw(t, 0.2, 0.5);
    text(ctx, 'クエリのヘッド', M.l, Q_Y + 8, { font: F.jp(700, 21), color: C.ink, alpha: qa });
    text(ctx, '64', M.l + 154, Q_Y + 10, { font: F.cond(700, 30), color: C.ink, alpha: qa });
    for (let i = 0; i < N; i++) {
      const a = tw(t, 0.2 + i * 0.008, 0.4);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(qx(i), Q_Y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ——— key/value pairs: 64 → 8 → 1, then one compressed vector
    const boxX = (i) => lerp(lerp(qx(i), (qx(Math.floor(i / G) * G) + qx(Math.floor(i / G) * G + G - 1)) / 2, p1), MID, p2);
    const boxW = lerp(lerp(10, 70, p1), 130, p2);
    const pa = tw(t, T.pairs, 0.5);
    if (pa > 0) {
      // lines from each query to the pair it reads
      ctx.save();
      ctx.globalAlpha = pa * (1 - p3) * 0.6;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < N; i++) line(ctx, qx(i), Q_Y + 6, boxX(i), KV_Y - 2, tw(t, T.pairs + 0.2, 0.6));
      ctx.restore();
      for (let i = 0; i < N; i++) {
        const x = boxX(i) - boxW / 2;
        ctx.save();
        ctx.globalAlpha = pa * (1 - p3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, KV_Y, boxW, KV_H / 2);
        ctx.fillStyle = C.ink;
        ctx.fillRect(x, KV_Y + KV_H / 2, boxW, KV_H / 2);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, KV_Y, boxW, KV_H);
        ctx.restore();
      }
    }
    // the count of pairs
    const n = p2 > 0.5 ? 1 : p1 > 0.5 ? 8 : 64;
    const label = p3 > 0.5 ? null : n === 64 ? 'ヘッドごとに 1 組' : n === 8 ? '8 個のヘッドで 1 組（GQA、2023 年）' : '全部で 1 組（MQA、2019 年）';
    text(ctx, 'キーとバリュー', M.l, KV_Y + 14, { font: F.jp(700, 21), color: C.ink, alpha: pa });
    text(ctx, p3 > 0.5 ? '—' : `${n}`, M.l + 154, KV_Y + 16, { font: F.cond(700, 30), color: n === 64 ? C.ink : C.accent, alpha: pa * (1 - p3) });
    text(ctx, '組', M.l + 154 + (n === 64 ? 34 : 18), KV_Y + 14, { font: F.jp(500, 18), color: C.ink2, alpha: pa * (1 - p3) });
    if (label) {
      const flip = Math.min(seg(t, T.gqa + 0.6, T.gqa + 1.0) + (t < T.gqa ? 1 : 0), 1) * (1 - seg(t, T.mqa, T.mqa + 0.3)) + seg(t, T.mqa + 0.6, T.mqa + 1.0) * (1 - seg(t, T.mla, T.mla + 0.3));
      text(ctx, label, M.l, KV_Y + 66, { font: F.jp(500, 19), color: C.ink2, alpha: pa * (t < T.gqa ? 1 : flip) });
    }

    // ——— MLA: one small vector per token, expanded into every head's pair when used
    if (p3 > 0) {
      const lw = lerp(130, 84, p3);
      ctx.save();
      ctx.globalAlpha = p3;
      rr(ctx, MID - lw / 2, KV_Y + 4, lw, KV_H - 8, 8);
      ctx.fillStyle = C.accent;
      ctx.fill();
      ctx.restore();
      text(ctx, '圧縮したベクトル', MID + 62, KV_Y + 24, { font: F.jp(700, 20), color: C.accent, alpha: p3 });
      text(ctx, 'キャッシュには、圧縮したベクトルと', M.l, KV_Y + 66, { font: F.jp(500, 19), color: C.ink2, alpha: tw(t, T.mla + 0.6, 0.5) });
      text(ctx, '位置のための小さなキーを置く（MLA、2024 年）', M.l, KV_Y + 94, { font: F.jp(500, 19), color: C.ink2, alpha: tw(t, T.mla + 0.6, 0.5) });
      // the expansion
      const ex = tw(t, T.mla + 1.0, 0.8, inOutCubic);
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      ctx.lineWidth = 2;
      arrow(ctx, MID, KV_Y + KV_H + 6, MID, GHOST_Y - 12, ex, 12);
      for (let i = 0; i < N; i++) {
        const a = ex * tw(t, T.mla + 1.2 + Math.abs(i - N / 2) * 0.01, 0.4);
        if (a <= 0) continue;
        ctx.save();
        ctx.globalAlpha = a * 0.8;
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 1;
        ctx.strokeRect(qx(i) - 5, GHOST_Y, 10, KV_H);
        ctx.restore();
      }
      text(ctx, '使うときに、ヘッドごとのキーとバリューに戻す', qx(N - 1) + 5, GHOST_Y + KV_H + 28, { font: F.jp(500, 18), color: C.muted, align: 'right', alpha: tw(t, T.mla + 1.4, 0.5) });
    }

    // ——— bytes per token
    const ba = tw(t, T.bars, 0.5);
    text(ctx, '1 トークンあたりのキャッシュ（bf16）', M.l, BAR.y - 26, { font: F.jp(700, 21), color: C.ink, alpha: ba });
    ctx.fillStyle = C.rule;
    ctx.globalAlpha = ba;
    ctx.fillRect(BAR.x, BAR.y - 6, 2, SIZES.length * BAR.step);
    ctx.globalAlpha = 1;
    const max = SIZES[0].bytes;
    SIZES.forEach((s, i) => {
      const a = tw(t, s.at, 0.4);
      if (a <= 0) return;
      const y = BAR.y + i * BAR.step;
      text(ctx, s.name, M.l, y + 24, { font: F.jp(700, 20), color: s.hot ? C.accent : C.ink, alpha: a });
      text(ctx, s.who, BAR.x - 18, y + 24, { font: F.jp(400, 17), color: C.muted, align: 'right', alpha: a });
      const g = outExpo(seg(t, s.at + 0.1, s.at + 1.0));
      const w = Math.max(3, (BAR.w * s.bytes) / max) * g;
      ctx.fillStyle = s.hot ? C.accent : i === 0 ? C.rule : C.ink;
      ctx.globalAlpha = a;
      ctx.fillRect(BAR.x + 2, y + 2, w, 30);
      ctx.globalAlpha = 1;
      text(ctx, `約 ${MB(s.bytes) < 0.1 ? MB(s.bytes).toFixed(2) : MB(s.bytes).toFixed(MB(s.bytes) < 1 ? 2 : 1)} MB`, BAR.x + 2 + w + 12, y + 28, { font: F.cond(700, 28), color: s.hot ? C.accent : C.ink, alpha: tw(t, s.at + 0.6, 0.4) });
    });
    const note = tw(t, 11.4, 0.6);
    text(ctx, 'DeepSeek-V3 は 6710 億パラメータ。Llama 3.1 70B の約 10 倍の大きさ', M.l, BAR.y + SIZES.length * BAR.step + 18, { font: F.jp(500, 18), color: C.ink2, alpha: note });
    text(ctx, '2026 年の DeepSeek-V4 は、100 万トークンで V3.2 の約 1 割のキャッシュと発表', M.l, BAR.y + SIZES.length * BAR.step + 46, { font: F.jp(500, 18), color: C.ink2, alpha: tw(t, 11.8, 0.6) });

    example(ctx, M.l, 818, 0, null);
    source(ctx, 'Shazeer（2019）、Ainslie ほか（2023）、DeepSeek-AI（2024、2026）', tw(t, T.mla, 0.6));
  },
});
