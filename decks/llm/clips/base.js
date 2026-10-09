// From continuing to answering: a pre-trained model writes a plausible continuation of a
// question (more questions); a tuned model answers it. Then the three stages that make the
// difference. The model outputs are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { tag, example, bubbleLayout, bubble } from '../lib/parts.js';
import { text, rr, arrow, wrap } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const Q = '日本の首都はどこですか？';
const BASE_OUT = 'アメリカの首都はどこですか？\nフランスの首都はどこですか？\nイタリアの首都は…';
const CHAT_OUT = '日本の首都は東京です。';
const COLS = [
  { x: M.l, name: '事前学習だけのモデル', kind: 'ベースモデル', out: BASE_OUT, note: '質問の続きを書いた', noteColor: C.accent, at: 0.3, outAt: 1.4 },
  { x: 840, name: '指示に従うよう調整したモデル', kind: 'チャット向け', out: CHAT_OUT, note: '質問に答えた', noteColor: C.green, at: 0.9, outAt: 3.9 },
];
const COL_W = 664;
const STAGES = [
  { n: '1', name: '事前学習', what: '大量の文章で、次を予測する' },
  { n: '2', name: '手本で学ぶ', what: '人が書いた良い応答をまねる' },
  { n: '3', name: '好みで磨く（RLHF）', what: '人が比べて選んだ応答を強める' },
];
const STRIP = 5.7;
const BOX = { y: 584, w: 420, h: 150, gap: 74 };

export default clip({
  id: 'base',
  title: '答える機械へ',
  kicker: '指示チューニングと RLHF',
  duration: 16.5,
  cues: [
    { at: 0.4, to: 5.5, text: '事前学習だけのモデルは、質問に答えるとは限らない。\nそれらしい**続き**を書く。' },
    { at: 5.7, to: 10.9, text: 'そこで、人が書いた手本の応答で学ばせ、\n人が比べて選んだ応答を強める調整を加える。' },
    { at: 11.1, to: 18, text: 'この調整で、続きを書く機械が、\n指示に答える**アシスタント**になる。' },
  ],

  prepare(ctx) {
    const q = bubbleLayout(ctx, Q, 520, { font: F.jp(500, 28) });
    const outs = COLS.map((c) => bubbleLayout(ctx, c.out, 560, { font: F.jp(500, 28) }));
    const what = STAGES.map((s) => wrap(ctx, F.jp(400, 21), s.what, BOX.w - 56));
    return { q, outs, what };
  },

  draw(ctx, t, { q, outs, what }) {
    COLS.forEach((c, i) => {
      const a = tw(t, c.at, 0.6);
      if (a <= 0) return;
      const nw = text(ctx, c.name, c.x, 138, { font: F.jp(700, 26), color: C.ink, alpha: a });
      tag(ctx, c.x + nw + 14, 112, c.kind, { font: F.jp(500, 17), h: 32, fill: i ? C.ink : C.panel, color: i ? C.paper : C.ink2, alpha: a });
      // the question, on the right like a chat
      const qa = tw(t, c.at + 0.3, 0.5, (p) => outBack(p, 1.5));
      bubble(ctx, c.x + COL_W - q.w, 172 + (1 - Math.min(1, qa)) * 12, q, { fill: C.blueSoft, alpha: Math.min(1, qa) });
      // the model's output, typed
      const L = outs[i];
      const oy = 172 + q.h + 22;
      const oa = tw(t, c.outAt - 0.2, 0.3);
      const chars = seg(t, c.outAt, c.outAt + (i ? 0.8 : 2.4));
      bubble(ctx, c.x, oy, L, { fill: i ? '#fff' : C.panel, stroke: i ? C.ink : null, lw: 2, alpha: oa, chars, color: i ? C.ink : C.ink2 });
      const na = tw(t, 4.9 + i * 0.25, 0.5);
      text(ctx, `→ ${c.note}`, c.x, oy + L.h + 40, { font: F.jp(700, 22), color: c.noteColor, alpha: na });
    });
    example(ctx, M.l, 524, tw(t, 1.0, 0.5), 'モデルの出力は説明のための例');

    // ——— the three stages
    const s = tw(t, STRIP, 0.5);
    if (s <= 0) return;
    STAGES.forEach((st, i) => {
      const x = M.l + i * (BOX.w + BOX.gap);
      const a = tw(t, STRIP + i * 0.5, 0.5, (p) => outBack(p, 1.4));
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      rr(ctx, x, BOX.y + (1 - Math.min(1, a)) * 14, BOX.w, BOX.h, 16);
      ctx.fillStyle = i === 0 ? C.panel : C.accentSoft;
      ctx.fill();
      ctx.restore();
      const al = Math.min(1, a);
      text(ctx, st.n, x + 28, BOX.y + 58, { font: F.cond(700, 44), color: i === 0 ? C.ink2 : C.accent, alpha: al });
      text(ctx, st.name, x + 66, BOX.y + 54, { font: F.jp(700, 26), color: C.ink, alpha: al });
      what[i].forEach((l, j) => text(ctx, l, x + 28, BOX.y + 100 + j * 30, { font: F.jp(400, 21), color: C.ink2, alpha: al }));
      if (i > 0) {
        ctx.strokeStyle = C.ink;
        ctx.fillStyle = C.ink;
        ctx.lineWidth = 3;
        arrow(ctx, x - BOX.gap + 14, BOX.y + BOX.h / 2, x - 12, BOX.y + BOX.h / 2, tw(t, STRIP + i * 0.5 - 0.1, 0.4, inOutCubic), 12);
      }
    });
    // the part that turns it into a chatbot
    const b = tw(t, STRIP + 2.2, 0.6);
    if (b > 0) {
      const x0 = M.l + BOX.w + BOX.gap;
      const x1 = M.l + 3 * BOX.w + 2 * BOX.gap;
      const y = BOX.y + BOX.h + 22;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.globalAlpha = b;
      ctx.beginPath();
      ctx.moveTo(x0, y - 10);
      ctx.lineTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.lineTo(x1, y - 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
      text(ctx, 'チャットボットにするための調整', (x0 + x1) / 2, y + 36, { font: F.jp(700, 22), color: C.accent, align: 'center', alpha: b });
    }
  },
});
