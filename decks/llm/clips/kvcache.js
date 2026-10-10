// KV cache: writing one token at a time, a model without a cache would recompute every earlier
// token at each step. Instead each token's key and value are computed once and kept; the new
// token's query compares itself with every stored key and takes in the values. The sentence is
// the one from 2-2; the attention weights are an example; the token counts are arithmetic.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { chip, chipWidth, example } from '../lib/parts.js';
import { text, rr, quadPoints, path } from '../../../src/kit/draw.js';
import { tw, seg, lerp, keys, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const PROMPT = ['日本', 'の', '首', '都', 'は'];
const OUT = ['東京', 'です', '。'];
const CHIP = { font: F.jp(500, 42), h: 68, padX: 16 };
const GAP = 10;
const ROW_X = 250;
const ROW_Y = 140;
const BOX = 46;
const V_Y = 300;
const K_Y = 372;
const Q_Y = 560;
// the example weights each query gives the keys it compares with
const WEIGHTS = [
  [0.12, 0.04, 0.3, 0.42, 0.12],
  [0.06, 0.02, 0.1, 0.12, 0.2, 0.5],
  [0.04, 0.02, 0.04, 0.04, 0.16, 0.3, 0.4],
];

// without the cache: every step recomputes everything written so far
const A = [1.3, 2.6, 3.9];
const RESET = 5.3;
// with the cache: the prompt at once, then one new token per step
const PREFILL = 6.0;
const STEP = [7.0, 11.4, 13.4]; // when each step's query asks
const TRAY = 11.0;
const LONG = 15.2;

// the counting panel
const PX = 1110;
const SQ = 30;
const SQ_GAP = 7;
const ROWS_NO = [256, 300, 344];
const ROWS_YES = [456, 500, 544];

export default clip({
  id: 'kvcache',
  title: '覚えておく',
  kicker: 'KV キャッシュ',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.2, text: '1 語書くたびに、前の文章を全部計算し直していたら、\n長くなるほど遅くなる。' },
    { at: 5.4, to: 10.8, text: '各トークンは層ごとに、**キー**（見出し）と**バリュー**（中身）を作る。\n新しいトークンは、全部の見出しと見比べて、中身を集める。' },
    { at: 11.0, to: 18, text: '前のトークンのキーとバリューは、取っておいて使い回す。\nこれが **KV キャッシュ**。計算するのは、新しい 1 つの分だけ。' },
  ],

  prepare(ctx) {
    let x = ROW_X;
    const cols = [...PROMPT, ...OUT].map((s) => {
      const w = chipWidth(ctx, s, CHIP);
      const c = { s, x, w, c: x + w / 2 };
      x += w + GAP;
      return c;
    });
    return { cols };
  },

  draw(ctx, t, { cols }) {
    example(ctx, M.l, 818, tw(t, PREFILL + 1.2, 0.5), '線の太さ（参考にする度合い）は例。図は 1 層分');

    // ——— row labels
    const lab = (s, sub, y, at) => {
      const a = tw(t, at, 0.5);
      text(ctx, s, M.l, y, { font: F.jp(700, 23), color: C.ink, alpha: a });
      text(ctx, sub, M.l, y + 28, { font: F.jp(400, 18), color: C.muted, alpha: a });
    };
    lab('バリュー', '中身', V_Y + 18, PREFILL + 0.2);
    lab('キー', '見出し', K_Y + 18, PREFILL + 0.3);
    lab('クエリ', '問い', Q_Y + 18, STEP[0] - 0.1);

    // ——— the cache tray around the stored keys and values; it widens as pairs are added
    const tray = tw(t, TRAY, 0.6);
    if (tray > 0) {
      const edge = (i) => cols[i].x + cols[i].w;
      const x0 = cols[0].x - 14;
      const x1 = keys(t, [[STEP[1] - 0.5, edge(4)], [STEP[1] - 0.2, edge(5)], [STEP[2] - 0.5, edge(5)], [STEP[2] - 0.2, edge(6)]]) + 14;
      ctx.save();
      ctx.globalAlpha = tray;
      rr(ctx, x0, V_Y - 18, x1 - x0, K_Y + BOX - V_Y + 36, 14);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      text(ctx, 'KV キャッシュ（取っておく）', x0, V_Y - 34, { font: F.jp(700, 22), color: C.accent, alpha: tray });
    }

    // ——— keys and values: the prompt's at once, then one new pair per step
    const born = [PREFILL, PREFILL, PREFILL, PREFILL, PREFILL, STEP[1] - 0.4, STEP[2] - 0.4];
    cols.slice(0, 7).forEach((c, i) => {
      if (t < RESET) return;
      const pop = tw(t, born[i] + (i < 5 ? i * 0.04 : 0), 0.5, (p) => outBack(p, 1.8));
      if (pop <= 0) return;
      const k = Math.min(1, pop);
      kv(ctx, c.c, V_Y, 'V', k, C.ink, C.paper);
      kv(ctx, c.c, K_Y, 'K', k, '#fff', C.ink);
    });

    // ——— the queries asking, the values answering, the new token flying up
    STEP.forEach((at, j) => {
      const qi = 4 + j;
      const q = cols[qi];
      // the last query stays, so the final picture shows it comparing with the whole cache
      const on = tw(t, at - 0.2, 0.3) * (j === STEP.length - 1 ? 1 : 1 - tw(t, at + 2.0, 0.3));
      if (on <= 0) return;
      // the query
      kv(ctx, q.c, Q_Y, 'Q', on, C.accent, '#fff');
      // compare with every stored key
      const look = inOutCubic(seg(t, at + 0.1, at + 0.8));
      WEIGHTS[j].forEach((w, k) => {
        const kc = cols[k].c;
        const y0 = Q_Y;
        const y1 = K_Y + BOX;
        const sag = 30 + Math.abs(q.c - kc) * 0.1;
        ctx.save();
        ctx.globalAlpha = on * (0.3 + w * 0.7);
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 1.5 + w * 12;
        ctx.lineCap = 'round';
        path(ctx, quadPoints(q.c, y0, (q.c + kc) / 2, (y0 + y1) / 2 + sag, kc, y1 + 2, 30), look);
        ctx.restore();
      });
      // the values light up by how much each is used
      const take = Math.sin(Math.PI * seg(t, at + 0.8, at + 1.5));
      if (take > 0) {
        WEIGHTS[j].forEach((w, k) => {
          ctx.save();
          ctx.globalAlpha = take * Math.min(1, w * 2.4);
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 4;
          rr(ctx, cols[k].c - BOX / 2 - 6, V_Y - 6, BOX + 12, BOX + 12, 10);
          ctx.stroke();
          ctx.restore();
        });
      }
    });

    // ——— the sentence
    PROMPT.forEach((s, i) => {
      const c = cols[i];
      const a = tw(t, 0.2 + i * 0.06, 0.5);
      chip(ctx, c.x, ROW_Y, s, { ...CHIP, fill: C.tints[i % C.tints.length], alpha: a, stroke: flashA(t, i) > 0.05 || flashB(t, i) > 0.05 ? C.accent : null, lw: 4 });
    });
    OUT.forEach((s, j) => {
      const c = cols[5 + j];
      // first pass (no cache): lands at A[j] + 1.0, gone at the reset
      const landA = A[j] + 1.0;
      const goneA = 1 - tw(t, RESET - 0.4, 0.4);
      // second pass (with the cache): flies from the query
      const flyB = seg(t, STEP[j] + 1.5, STEP[j] + 2.0);
      const tint = C.tints[(5 + j) % C.tints.length];
      if (t < RESET) {
        const pop = tw(t, A[j] + 0.6, 0.4, (p) => outBack(p, 1.8));
        if (pop <= 0) return;
        const fresh = t < landA + 0.3;
        ctx.save();
        ctx.translate(c.c, ROW_Y + CHIP.h / 2);
        ctx.scale(Math.min(1.06, pop), Math.min(1.06, pop));
        ctx.translate(-c.c, -(ROW_Y + CHIP.h / 2));
        chip(ctx, c.x, ROW_Y, s, { ...CHIP, fill: fresh ? C.accent : tint, color: fresh ? '#fff' : C.ink, alpha: goneA * Math.min(1, pop), stroke: flashA(t, 5 + j) > 0.05 ? C.accent : null, lw: 4 });
        ctx.restore();
        return;
      }
      if (flyB <= 0) return;
      const e = inOutCubic(flyB);
      const q = cols[4 + j];
      const x = lerp(q.x, c.x, e);
      const y = lerp(Q_Y, ROW_Y, e) - Math.sin(Math.PI * e) * 40;
      chip(ctx, x, y, s, { ...CHIP, fill: flyB < 1 ? C.accent : tint, color: flyB < 1 ? '#fff' : C.ink, stroke: flashB(t, 5 + j) > 0.05 ? C.accent : null, lw: 4 });
    });
    // what the first pass is doing
    const redo = t < RESET ? Math.max(...A.map((a) => Math.sin(Math.PI * seg(t, a, a + 0.9)))) : 0;
    text(ctx, '全部を計算し直す', ROW_X, ROW_Y + CHIP.h + 42, { font: F.jp(700, 23), color: C.accent, alpha: redo });
    text(ctx, '文書は全部を一度に読む', ROW_X, ROW_Y + CHIP.h + 42, { font: F.jp(700, 23), color: C.accent, alpha: Math.sin(Math.PI * seg(t, PREFILL - 0.1, PREFILL + 1.0)) });

    // ——— counting what is computed
    const ha = tw(t, 0.9, 0.5);
    text(ctx, '1 語書くたびに計算するトークン', PX, 172, { font: F.jp(700, 22), color: C.ink, alpha: ha });
    text(ctx, 'キャッシュなし', PX, 234, { font: F.jp(700, 20), color: C.ink2, alpha: ha });
    text(ctx, 'キャッシュあり', PX, 434, { font: F.jp(700, 20), color: C.accent, alpha: tw(t, PREFILL, 0.5) });
    const counts = (rows, ns, ats, color) => {
      rows.forEach((y, j) => {
        const n = ns[j];
        const at = ats[j];
        if (t < at) return;
        text(ctx, `${j + 1} 語目`, PX, y + 22, { font: F.jp(500, 18), color: C.muted, alpha: tw(t, at, 0.3) });
        for (let i = 0; i < n; i++) {
          const p = tw(t, at + i * 0.04, 0.35, (u) => outBack(u, 2));
          if (p <= 0) continue;
          ctx.save();
          ctx.globalAlpha = Math.min(1, p);
          ctx.fillStyle = color;
          const s = SQ * Math.min(1.1, p);
          rr(ctx, PX + 80 + i * (SQ + SQ_GAP) + (SQ - s) / 2, y + (SQ - s) / 2, s, s, 5);
          ctx.fill();
          ctx.restore();
        }
      });
    };
    counts(ROWS_NO, [5, 6, 7], A, C.ink2);
    counts(ROWS_YES, [5, 1, 1], [PREFILL, STEP[1] - 0.4, STEP[2] - 0.4], C.accent);
    const sum = (s, y, at, color) => {
      const a = tw(t, at, 0.5);
      const w = text(ctx, s, W - M.r, y, { font: F.cond(700, 50), color, align: 'right', alpha: a });
      text(ctx, '計', W - M.r - w - 10, y, { font: F.jp(500, 19), color: C.muted, align: 'right', alpha: a });
    };
    sum('18', 238, A[2] + 0.9, C.ink2);
    sum('7', 438, STEP[2] - 0.1, C.accent);

    // ——— and at a realistic length
    const l = tw(t, LONG, 0.6);
    if (l > 0) {
      const y = 660;
      ctx.fillStyle = C.rule;
      ctx.fillRect(PX, y - 44, (W - M.r - PX) * outExpo(l), 2);
      text(ctx, '1,000 トークンの文書に、100 語を書き足すと', PX, y, { font: F.jp(500, 19), color: C.ink2, alpha: l });
      const m = tw(t, LONG + 0.3, 0.6);
      text(ctx, 'なし', PX, y + 56, { font: F.jp(500, 19), color: C.muted, alpha: m });
      text(ctx, '104,950', PX + 50, y + 58, { font: F.cond(700, 44), color: C.ink2, alpha: m });
      text(ctx, 'あり', PX + 236, y + 56, { font: F.jp(500, 19), color: C.muted, alpha: m });
      text(ctx, '1,099', PX + 286, y + 58, { font: F.cond(700, 44), color: C.accent, alpha: m });
    }
  },
});

// One key, value or query: a small rounded box with its letter.
function kv(ctx, cx, y, letter, a, fill, color) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, a);
  const s = BOX * Math.min(1.08, a);
  rr(ctx, cx - s / 2, y + (BOX - s) / 2, s, s, 8);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = fill === C.accent ? C.accent : C.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, letter, cx, y + BOX / 2 + 1, { font: F.mono(600, 22), color, align: 'center', base: 'middle', alpha: Math.min(1, a) });
}

// how strongly token i is being recomputed in the first pass (no cache)
function flashA(t, i) {
  if (t >= RESET) return 0;
  let v = 0;
  A.forEach((a, j) => {
    if (i < 5 + j) v = Math.max(v, Math.sin(Math.PI * seg(t, a + i * 0.05, a + i * 0.05 + 0.5)));
  });
  return v;
}

// how strongly token i is being computed in the second pass (prompt at once, then one each)
function flashB(t, i) {
  if (t < RESET) return 0;
  const at = i < 5 ? PREFILL : STEP[i - 4] - 0.4;
  return Math.sin(Math.PI * seg(t, at, at + 0.6));
}
