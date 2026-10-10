// How large the KV cache gets: one token keeps a key and a value for every KV head in every
// layer. With Llama 3.1 70B's published shape that is 327,680 bytes per token, about 43 GB at
// its full 131,072-token window — against about 141 GB of weights. The sizes are arithmetic
// on the published architecture; "four people at once" is an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { chip, example, source } from '../lib/parts.js';
import { text, rr, line } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const LAYERS = 80;
const HEADS = 8;
const DIM = 128;
const BYTES = 2;
const PER_TOKEN = 2 * LAYERS * HEADS * DIM * BYTES; // 327,680
const WEIGHTS_GB = 141; // 70.6B parameters × 2 bytes

// the slab: one row per layer, eight key cells then eight value cells
const SLAB = { x: 150, y: 196, cw: 19, ch: 4, gx: 3, gy: 1, mid: 14 };
const GROW = [0.9, 3.4];
const FORMULA_AT = 3.8;
const FX = 640;
const FY = 196;
const FACTORS = [
  ['2', 'キーとバリュー'],
  ['80', '層'],
  ['8', 'ヘッド'],
  ['128', '数'],
  ['2', 'バイト'],
];
const RESULT_AT = 5.8;
const CHART_AT = 6.8;
const CX = 860;
const CW = 600;
const MAX_GB = 180;
const BARS = [
  { label: '1,000 トークン', gb: (PER_TOKEN * 1000) / 1e9, at: CHART_AT + 0.2 },
  { label: '32,768 トークン', gb: (PER_TOKEN * 32768) / 1e9, at: CHART_AT + 1.0 },
  { label: '131,072 トークン', gb: (PER_TOKEN * 131072) / 1e9, at: CHART_AT + 1.8, hot: true },
  { label: 'モデルの重み', gb: WEIGHTS_GB, at: 11.2, ink: true },
  { label: '4 人が同時に 131,072', gb: (4 * PER_TOKEN * 131072) / 1e9, at: 12.4, hot: true, ex: true },
];
const BAR_Y0 = 474;
const BAR_STEP = 62;

export default clip({
  id: 'kvsize',
  title: '覚える量',
  kicker: 'キャッシュの大きさ',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'KV キャッシュは、トークン 1 つにつき、\n層の数だけキーとバリューを持つ。' },
    { at: 5.8, to: 11.0, text: '重みが公開されている Llama 3.1 70B なら、1 トークンで約 0.33 MB。\n読める上限の約 13 万トークンでは、約 43 GB になる。' },
    { at: 11.2, to: 18, text: 'キャッシュは、モデルの重みと同じ GPU の記憶に置く。\n長い文書を、大勢が同時に読ませるほど、記憶が要る。' },
  ],

  draw(ctx, t) {
    // ——— one token, and everything it keeps
    const ta = tw(t, 0.2, 0.5);
    chip(ctx, SLAB.x, 104, '東京', { font: F.jp(500, 34), h: 54, padX: 14, fill: C.tints[0], alpha: ta });
    text(ctx, '1 トークン分のキャッシュ', SLAB.x + 112, 140, { font: F.jp(700, 22), color: C.ink, alpha: ta });

    const rows = Math.round(LAYERS * inOutCubic(seg(t, GROW[0], GROW[1])));
    const sx = SLAB.x;
    const cellX = (c) => sx + c * (SLAB.cw + SLAB.gx) + (c >= HEADS ? SLAB.mid : 0);
    const flash = (k) => Math.sin(Math.PI * seg(t, FORMULA_AT + k * 0.35, FORMULA_AT + k * 0.35 + 0.9));
    for (let r = 0; r < rows; r++) {
      const y = SLAB.y + r * (SLAB.ch + SLAB.gy);
      for (let c = 0; c < HEADS * 2; c++) {
        const isK = c < HEADS;
        ctx.fillStyle = isK ? '#fff' : C.ink;
        ctx.fillRect(cellX(c), y, SLAB.cw, SLAB.ch);
      }
    }
    // the key cells' outline, so white reads as a column
    if (rows > 0) {
      const h = rows * (SLAB.ch + SLAB.gy) - SLAB.gy;
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1;
      ctx.strokeRect(cellX(0) - 0.5, SLAB.y - 0.5, cellX(HEADS - 1) + SLAB.cw - cellX(0) + 1, h + 1);
    }
    const slabH = LAYERS * (SLAB.ch + SLAB.gy) - SLAB.gy;
    const slabR = cellX(HEADS * 2 - 1) + SLAB.cw;
    // column heads
    const ca = tw(t, 1.0, 0.5);
    text(ctx, 'キー 8', (cellX(0) + cellX(HEADS - 1) + SLAB.cw) / 2, SLAB.y - 14, { font: F.jp(700, 18), color: C.ink, align: 'center', alpha: ca });
    text(ctx, 'バリュー 8', (cellX(HEADS) + slabR) / 2, SLAB.y - 14, { font: F.jp(700, 18), color: C.ink, align: 'center', alpha: ca });
    // the layer count, running while the slab grows, then a brace
    const la = tw(t, GROW[0], 0.4);
    text(ctx, `${Math.max(1, rows)}`, sx - 16, SLAB.y + Math.max(0, rows - 1) * (SLAB.ch + SLAB.gy) + 6, { font: F.cond(700, 22), color: C.accent, align: 'right', alpha: la * (1 - tw(t, GROW[1] + 0.2, 0.3)) });
    const bra = tw(t, GROW[1] + 0.1, 0.5);
    if (bra > 0) {
      ctx.save();
      ctx.globalAlpha = bra;
      ctx.strokeStyle = flash(1) > 0.1 ? C.accent : C.ink2;
      ctx.lineWidth = 2;
      line(ctx, sx - 14, SLAB.y, sx - 14, SLAB.y + slabH);
      line(ctx, sx - 14, SLAB.y, sx - 6, SLAB.y);
      line(ctx, sx - 14, SLAB.y + slabH, sx - 6, SLAB.y + slabH);
      ctx.restore();
      text(ctx, '80 層', sx - 24, SLAB.y + slabH / 2 + 8, { font: F.jp(700, 20), color: flash(1) > 0.1 ? C.accent : C.ink, align: 'right', alpha: bra });
    }
    // what one cell is
    const cell = tw(t, GROW[1] + 0.4, 0.5);
    text(ctx, '1 マス ＝ 128 個の数', sx, SLAB.y + slabH + 40, { font: F.jp(flash(3) > 0.1 ? 700 : 500, 19), color: flash(3) > 0.1 ? C.accent : C.ink2, alpha: cell });
    text(ctx, '1 つの数は 2 バイト（bf16）', sx, SLAB.y + slabH + 68, { font: F.jp(flash(4) > 0.1 ? 700 : 500, 19), color: flash(4) > 0.1 ? C.accent : C.ink2, alpha: cell });
    // the formula's pointers back into the slab
    if (flash(2) > 0.05) {
      ctx.save();
      ctx.globalAlpha = flash(2);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      rr(ctx, cellX(0) - 4, SLAB.y - 4, cellX(HEADS - 1) + SLAB.cw - cellX(0) + 8, slabH + 8, 6);
      ctx.stroke();
      ctx.restore();
    }
    if (flash(0) > 0.05) {
      ctx.save();
      ctx.globalAlpha = flash(0);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      rr(ctx, cellX(0) - 6, SLAB.y - 34, slabR - cellX(0) + 12, slabH + 40, 8);
      ctx.stroke();
      ctx.restore();
    }

    // ——— the formula
    let fx = FX;
    FACTORS.forEach(([n, what], k) => {
      const a = tw(t, FORMULA_AT + k * 0.35, 0.5, (p) => outBack(p, 1.6));
      if (a <= 0) return;
      const hot = flash(k) > 0.1;
      if (k > 0) {
        text(ctx, '×', fx, FY + 46, { font: F.sans(500, 40), color: C.muted, alpha: Math.min(1, a) });
        fx += 44;
      }
      const w = text(ctx, n, fx, FY + 50 + (1 - Math.min(1, a)) * 16, { font: F.cond(700, 64), color: hot ? C.accent : C.ink, alpha: Math.min(1, a) });
      text(ctx, what, fx + w / 2, FY + 84, { font: F.jp(500, 18), color: C.muted, align: 'center', alpha: Math.min(1, a) });
      fx += w + 22;
    });
    const res = tw(t, RESULT_AT, 0.6);
    if (res > 0) {
      text(ctx, '＝', FX, FY + 160, { font: F.jp(500, 40), color: C.muted, alpha: res });
      const w = text(ctx, '327,680', FX + 56, FY + 164 + (1 - res) * 14, { font: F.cond(700, 76), color: C.accent, alpha: res });
      text(ctx, 'バイト', FX + 56 + w + 12, FY + 162, { font: F.jp(700, 26), color: C.ink, alpha: res });
      text(ctx, '約 0.33 MB ／ 1 トークン', FX + 56 + w + 112, FY + 162, { font: F.jp(500, 22), color: C.ink2, alpha: tw(t, RESULT_AT + 0.4, 0.5) });
    }

    // ——— how that adds up
    const ch = tw(t, CHART_AT, 0.5);
    if (ch > 0) {
      text(ctx, '読ませたトークンの数と、キャッシュの大きさ', FX, BAR_Y0 - 30, { font: F.jp(700, 22), color: C.ink, alpha: ch });
      ctx.fillStyle = C.rule;
      ctx.fillRect(CX, BAR_Y0 - 8, 2, BARS.length * BAR_STEP);
    }
    BARS.forEach((b, i) => {
      const a = tw(t, b.at, 0.4);
      if (a <= 0) return;
      const y = BAR_Y0 + i * BAR_STEP;
      text(ctx, b.label, CX - 16, y + 30, { font: F.jp(b.ink ? 700 : 500, 20), color: b.ink ? C.ink : C.ink2, align: 'right', alpha: a });
      const g = outExpo(seg(t, b.at + 0.1, b.at + 1.0));
      const w = Math.max(2, (CW * b.gb) / MAX_GB) * g;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = b.ink ? C.ink : b.hot ? C.accent : C.ink2;
      if (b.ex) ctx.fillStyle = C.accentSoft;
      ctx.fillRect(CX + 2, y + 8, w, 34);
      if (b.ex) {
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(CX + 2, y + 8, w, 34);
      }
      ctx.restore();
      const gb = b.gb < 1 ? b.gb.toFixed(2) : Math.round(b.gb).toString();
      text(ctx, `約 ${gb} GB`, CX + 2 + w + 12, y + 34, { font: F.cond(700, 28), color: b.ink ? C.ink : b.hot ? C.accent : C.ink2, alpha: tw(t, b.at + 0.6, 0.4) });
    });
    // the weights' level, carried down so the last bar can be read against it
    const wl = tw(t, 12.4, 0.5);
    if (wl > 0) {
      const x = CX + 2 + (CW * WEIGHTS_GB) / MAX_GB;
      ctx.save();
      ctx.globalAlpha = wl;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      line(ctx, x, BAR_Y0 + 3 * BAR_STEP + 42, x, BAR_Y0 + 4 * BAR_STEP + 50);
      ctx.restore();
    }

    example(ctx, M.l, 818, tw(t, 12.6, 0.5), '「4 人が同時に」は説明のための例。大きさは公開された構成からの計算');
    source(ctx, 'Meta、Llama 3 の論文（2024）の構成から計算', tw(t, RESULT_AT, 0.6));
  },
});
