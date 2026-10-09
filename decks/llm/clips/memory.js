// Statelessness: every turn sends the whole conversation again, so what the model reads grows
// turn by turn; past the window's limit the oldest part is cut or summarised. Token counts
// and the limit are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { chip, chipWidth, example } from '../lib/parts.js';
import { text, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack } from '../../../src/kit/ease.js';

const MSG = ['質問 1', '返事 1', '質問 2', '返事 2', '質問 3'];
const TOKENS = [40, 100, 40, 200, 40]; // per message (example)
const TURNS = [
  { n: 1, send: 1, reply: '返事 1', total: 40 },
  { n: 2, send: 3, reply: '返事 2', total: 180 },
  { n: 3, send: 5, reply: '返事 3', total: 420 },
];
const ROW0 = 186;
const ROW = 140;
const FONT = F.jp(500, 22);
const LLM_X = 980;
const BAR = { x: M.l, y: 700, w: 1000, h: 44 };
const LIMIT = 600;
const MORE = 11.0; // the conversation goes on past the limit

const turnAt = (i) => 0.6 + i * 1.6;

export default clip({
  id: 'memory',
  title: '毎回読み直す',
  kicker: '会話と記憶',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.4, text: 'モデルは会話を覚えていない。\n毎回、それまでの会話を**全部**受け取って、読み直す。' },
    { at: 5.6, to: 10.8, text: 'だから、会話が長くなるほど、\n一回に読む量が増えていく。' },
    { at: 11.0, to: 18, text: 'コンテキストウィンドウを超える分は、\n古い部分を削るか、要約して詰める。' },
  ],

  prepare(ctx) {
    const widths = MSG.map((s) => chipWidth(ctx, s, { font: FONT, padX: 14 }));
    return { widths };
  },

  draw(ctx, t, { widths }) {
    example(ctx, LLM_X + 200, 92, tw(t, 0.8, 0.5), 'トークン数は説明のための例');
    text(ctx, '会話の記録を保つのは、モデルではなく、アプリやサーバーの側', M.l, 850, { font: F.jp(500, 20), color: C.ink2, alpha: tw(t, 2.0, 0.6) });
    TURNS.forEach((tr, i) => {
      const at = turnAt(i);
      const a = tw(t, at, 0.5);
      if (a <= 0) return;
      const y = ROW0 + i * ROW;
      text(ctx, `${tr.n} 回目に送るもの`, M.l, y - 18, { font: F.jp(700, 22), color: C.ink2, alpha: a });
      let x = M.l;
      for (let k = 0; k < tr.send; k++) {
        const p = tw(t, at + 0.1 + k * 0.08, 0.4, (q) => outBack(q, 1.6));
        const fresh = k === tr.send - 1; // the new question; the rest is sent again
        chip(ctx, x, y, MSG[k], {
          font: FONT, padX: 14, h: 50, alpha: Math.min(1, p),
          fill: fresh ? C.blueSoft : MSG[k].startsWith('質問') ? '#e8edfb' : '#ece8de',
          color: fresh ? C.ink : C.ink2,
        });
        x += widths[k] + 8;
      }
      if (tr.send > 1) {
        text(ctx, '前の会話も全部もう一度', M.l, y + 82, { font: F.jp(400, 18), color: C.muted, alpha: tw(t, at + 0.5, 0.4) });
      }
      text(ctx, `約 ${tr.total} トークン`, LLM_X - 36, y + 8, { font: F.cond(700, 26), color: C.ink, align: 'right', alpha: tw(t, at + 0.5, 0.4) });
      // → LLM → reply
      ctx.strokeStyle = C.ink;
      ctx.fillStyle = C.ink;
      ctx.lineWidth = 3;
      arrow(ctx, x + 12, y + 25, LLM_X - 14, y + 25, tw(t, at + 0.5, 0.4, inOutCubic), 12);
      const m = tw(t, at + 0.7, 0.4);
      if (m > 0) {
        ctx.save();
        ctx.globalAlpha = m;
        rr(ctx, LLM_X, y - 4, 130, 58, 12);
        ctx.fillStyle = C.ink;
        ctx.fill();
        ctx.restore();
        text(ctx, 'LLM', LLM_X + 65, y + 34, { font: F.sans(700, 24), color: C.paper, align: 'center', alpha: m });
        arrow(ctx, LLM_X + 144, y + 25, LLM_X + 214, y + 25, tw(t, at + 0.9, 0.3, inOutCubic), 12);
      }
      chip(ctx, LLM_X + 226, y, tr.reply, { font: FONT, padX: 14, h: 50, fill: C.accentSoft, alpha: tw(t, at + 1.1, 0.4) });
    });

    // ——— what one request holds, against the window
    const b = tw(t, 5.6, 0.6);
    if (b <= 0) return;
    text(ctx, '1 回に読む量', BAR.x, BAR.y - 22, { font: F.jp(700, 22), color: C.ink2, alpha: b });
    ctx.save();
    ctx.globalAlpha = b;
    rr(ctx, BAR.x, BAR.y, BAR.w, BAR.h, 8);
    ctx.fillStyle = '#ebe6da';
    ctx.fill();
    ctx.restore();
    const px = BAR.w / LIMIT;
    // fill follows the turns, then overflows, then the oldest part is summarised
    let fill = 0;
    TURNS.forEach((tr, i) => {
      fill = lerp(fill, tr.total, inOutCubic(seg(t, Math.max(5.6, turnAt(i) + 0.5), Math.max(6.2, turnAt(i) + 1.1))));
    });
    const over = inOutCubic(seg(t, MORE + 0.2, MORE + 1.0)); // a further turn adds 260
    const squeeze = inOutCubic(seg(t, MORE + 1.8, MORE + 2.8)); // 質問 1 + 返事 1 (140) → 要約 (40)
    const old = lerp(140, 40, squeeze);
    const total = fill + 260 * over - (140 - old) * (fill >= 420 ? 1 : 0);
    // the summarised head
    if (squeeze > 0) {
      ctx.fillStyle = C.green;
      ctx.fillRect(BAR.x, BAR.y, old * px, BAR.h);
      text(ctx, '要約', BAR.x + (old * px) / 2, BAR.y + 30, { font: F.jp(700, 18), color: '#fff', align: 'center', alpha: squeeze });
    }
    const start = squeeze > 0 ? old : 0;
    const w = Math.max(0, total - start);
    const inLimit = Math.min(w, LIMIT - start);
    ctx.fillStyle = C.ink;
    ctx.fillRect(BAR.x + start * px, BAR.y, inLimit * px, BAR.h);
    if (w > inLimit) {
      ctx.fillStyle = C.red;
      ctx.fillRect(BAR.x + LIMIT * px, BAR.y, (w - inLimit) * px, BAR.h);
      text(ctx, 'あふれる', BAR.x + LIMIT * px + 12, BAR.y + BAR.h + 32, { font: F.jp(700, 20), color: C.red });
    }
    // the limit
    ctx.fillStyle = C.accent;
    ctx.fillRect(BAR.x + LIMIT * px - 2, BAR.y - 16, 4, BAR.h + 32);
    text(ctx, 'コンテキストウィンドウの上限', BAR.x + LIMIT * px - 10, BAR.y - 22, { font: F.jp(700, 20), color: C.accent, align: 'right', alpha: b });
    text(ctx, `約 ${Math.round(total)} トークン`, BAR.x, BAR.y + BAR.h + 34, { font: F.cond(700, 28), color: C.ink, alpha: b });
  },
});
