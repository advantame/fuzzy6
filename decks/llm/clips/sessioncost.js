// What one piece of agent work costs. Each of 30 requests uses the whole document, which grows
// from 10,000 to 97,000 tokens; summed, the input grows roughly with the square of the number of
// requests. With prompt caching the repeated beginning is read at a twentieth of the input price
// and only the new part is written (1.25×), so the input costs about an eighth. The session is an
// example; the prices are Claude Sonnet 5.5's list prices on 2026-10-10 (input $2, cache write
// $2.50, cache read $0.10 per million tokens). Reads still grow quadratically, only cheaper.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { text } from '../../../src/kit/draw.js';
import { tw, seg, outExpo, inOutCubic } from '../../../src/kit/ease.js';

const N = 30;
const BASE = 10000;
const STEP = 3000;
const DOCS = Array.from({ length: N }, (_, k) => BASE + STEP * k);
const TOTAL = DOCS.reduce((a, b) => a + b, 0); // 1,605,000
const READS = TOTAL - DOCS[N - 1]; // every request but the last is read again by the next
const WRITES = BASE + STEP * (N - 1);
const PRICE = { input: 2, write: 2.5, read: 0.1 }; // USD per million tokens
const DOLLARS = { none: (TOTAL * PRICE.input) / 1e6, read: (READS * PRICE.read) / 1e6, write: (WRITES * PRICE.write) / 1e6 };

const CH = { x: 250, y: 150, w: 870, h: 420 };
const BW = 24;
const GAP = (CH.w - N * BW) / (N - 1);
const bx = (k) => CH.x + k * (BW + GAP);
const bh = (n) => (CH.h * n) / 100000;
const GROW = [0.8, 5.0];
const SPLIT = [7.6, 9.8];
const PX = 1200;

export default clip({
  id: 'sessioncost',
  title: '仕事の値段',
  kicker: 'セッションの費用',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'エージェントの 1 回の仕事は、何十回ものリクエストでできている。\nそのたびに、伸びた文書を全部読ませる。' },
    { at: 5.8, to: 11.0, text: '読ませた量を足し合わせると、回数の 2 乗に近い速さで増える。\nそのほとんどは、前と同じ頭の部分。' },
    { at: 11.2, to: 18, text: 'キャッシュに当たれば、入力の値段は 8 分の 1 ほどになる。\n長く働くエージェントの値段は、キャッシュで大きく変わる。' },
  ],

  draw(ctx, t) {
    // ——— axes
    const aa = tw(t, 0.2, 0.5);
    text(ctx, '1 回のリクエストで読ませるトークン', CH.x, CH.y - 24, { font: F.jp(700, 22), color: C.ink, alpha: aa });
    ctx.save();
    ctx.globalAlpha = aa;
    ctx.fillStyle = C.rule;
    ctx.fillRect(CH.x - 12, CH.y + CH.h, CH.w + 24, 2);
    [0, 50000, 100000].forEach((v) => {
      const y = CH.y + CH.h - bh(v);
      ctx.fillStyle = C.grid;
      if (v) ctx.fillRect(CH.x - 12, y, CH.w + 24, 1);
      text(ctx, v ? `${v / 10000} 万` : '0', CH.x - 22, y + 7, { font: F.cond(600, 20), color: C.muted, align: 'right' });
    });
    ctx.restore();
    text(ctx, 'リクエストの回数', CH.x + CH.w, CH.y + CH.h + 62, { font: F.jp(500, 18), color: C.muted, align: 'right', alpha: aa });
    [1, 10, 20, 30].forEach((k) => text(ctx, `${k}`, bx(k - 1) + BW / 2, CH.y + CH.h + 28, { font: F.cond(600, 20), color: C.muted, align: 'center', alpha: aa }));

    // ——— the bars: each request's whole document; later, what of it came from the cache
    const shown = Math.floor(N * seg(t, GROW[0], GROW[1]));
    const split = seg(t, SPLIT[0], SPLIT[1]);
    for (let k = 0; k < N; k++) {
      const pop = tw(t, GROW[0] + (k / N) * (GROW[1] - GROW[0]), 0.4);
      if (pop <= 0) continue;
      const h = bh(DOCS[k]) * pop;
      const x = bx(k);
      const y = CH.y + CH.h - h;
      const cached = k === 0 ? 0 : bh(DOCS[k - 1]) * pop;
      const turn = seg(split, (k / N) * 0.75, (k / N) * 0.75 + 0.25);
      ctx.fillStyle = C.accent;
      ctx.fillRect(x, y, BW, h);
      if (turn > 0) {
        ctx.fillStyle = C.green;
        ctx.fillRect(x, CH.y + CH.h - cached * turn, BW, cached * turn);
      }
    }
    const la = tw(t, SPLIT[1] - 0.6, 0.5);
    if (la > 0) {
      legend(ctx, CH.x + 20, CH.y + 18, C.green, 'キャッシュから読む（入力の 20 分の 1）', la);
      legend(ctx, CH.x + 20, CH.y + 52, C.accent, '新しく書き込む（入力の 1.25 倍）', la);
    }
    // the number of requests while growing
    if (t < GROW[1] + 0.5 && shown > 0) text(ctx, `${shown} 回目`, bx(shown - 1) + BW / 2, CH.y + CH.h - bh(DOCS[shown - 1]) - 14, { font: F.jp(700, 18), color: C.accent, align: 'center', alpha: 1 - seg(t, GROW[1], GROW[1] + 0.5) });

    // ——— the sum, as it grows
    const sa = tw(t, 5.8, 0.5);
    text(ctx, '読ませたトークンの合計', PX, CH.y + 10, { font: F.jp(700, 21), color: C.ink, alpha: sa });
    [[10, '23.5 万'], [20, '77 万'], [30, '160.5 万']].forEach(([k, n], i) => {
      const a = tw(t, 6.1 + i * 0.5, 0.5);
      const y = CH.y + 64 + i * 56;
      text(ctx, `${k} 回で`, PX, y, { font: F.jp(500, 19), color: C.ink2, alpha: a });
      text(ctx, n, W - M.r, y + 4, { font: F.cond(700, i === 2 ? 40 : 32), color: i === 2 ? C.ink : C.ink2, align: 'right', alpha: a });
    });
    text(ctx, '回数が 2 倍で、合計は 3 倍以上', PX, CH.y + 64 + 3 * 56 - 6, { font: F.jp(500, 18), color: C.muted, alpha: tw(t, 7.8, 0.5) });

    // ——— the input price, with and without the cache
    const pa = tw(t, 11.2, 0.5);
    if (pa > 0) {
      const y0 = CH.y + 300;
      text(ctx, '入力の値段', PX, y0, { font: F.jp(700, 21), color: C.ink, alpha: pa });
      text(ctx, 'Claude Sonnet 5.5', PX + 120, y0, { font: F.sans(500, 17), color: C.muted, alpha: pa });
      const full = W - M.r - PX;
      const g = outExpo(seg(t, 11.4, 12.4));
      ctx.save();
      ctx.globalAlpha = pa;
      ctx.fillStyle = C.accent;
      ctx.fillRect(PX, y0 + 20, full * g, 34);
      ctx.restore();
      text(ctx, `キャッシュなし　${DOLLARS.none.toFixed(2)} ドル`, PX, y0 + 80, { font: F.jp(500, 19), color: C.ink2, alpha: pa });
      const h = outExpo(seg(t, 12.0, 13.0));
      const wr = (full * DOLLARS.read) / DOLLARS.none;
      const ww = (full * DOLLARS.write) / DOLLARS.none;
      ctx.save();
      ctx.globalAlpha = tw(t, 12.0, 0.4);
      ctx.fillStyle = C.green;
      ctx.fillRect(PX, y0 + 104, wr * h, 34);
      ctx.fillStyle = C.accent;
      ctx.fillRect(PX + wr * h, y0 + 104, ww * h, 34);
      ctx.restore();
      const withCache = DOLLARS.read + DOLLARS.write;
      text(ctx, `キャッシュあり　${withCache.toFixed(2)} ドル`, PX, y0 + 164, { font: F.jp(700, 19), color: C.green, alpha: tw(t, 12.6, 0.4) });
      text(ctx, `内訳：読み出し ${DOLLARS.read.toFixed(2)} ＋ 書き込み ${DOLLARS.write.toFixed(2)}`, PX, y0 + 194, { font: F.jp(400, 17), color: C.muted, alpha: tw(t, 12.8, 0.4) });
    }

    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '仕事の長さは例。毎回、前の文書の全部がキャッシュに当たるとして計算し、出力の分は含めない');
    source(ctx, 'Anthropic の料金表（2026-10-10 確認）', pa);
  },
});

function legend(ctx, x, y, color, s, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.fillRect(x, y - 15, 22, 18);
  ctx.restore();
  text(ctx, s, x + 32, y, { font: F.jp(500, 18), color: C.ink2, alpha: a });
}
