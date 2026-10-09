// A chat is one document: the bubbles on screen are lines of a single text, each marked with
// its role, and the model's reply is the continuation after the last assistant mark. The
// marks are drawn generically; real formats differ by model.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { bubbleLayout, bubble, tag } from '../lib/parts.js';
import { text, rr, wrap, measure, quadPoints, path, typed } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const SYSTEM = 'あなたは親切なアシスタントです。';
const TURNS = [
  ['user', 'こんにちは'],
  ['assistant', 'こんにちは。何をお手伝いしましょう？'],
  ['user', 'おすすめの本を教えて'],
];
const REPLY = 'どんなジャンルが好きですか？';
const ROLE = { system: 'システム', user: 'ユーザー', assistant: 'アシスタント' };
const CHAT = { x: M.l, y: 112, w: 600, h: 708 };
const DOC = { x: 800, y: 112, w: W - M.r - 800, h: 708 };
const DOC_AT = 5.4;
const REPLY_AT = 10.8;
const BFONT = F.jp(500, 25);
const DFONT = F.jp(500, 28);

export default clip({
  id: 'template',
  title: '会話は一本の文書',
  kicker: 'チャットのしくみ',
  duration: 16.5,
  cues: [
    { at: 0.4, to: 5.2, text: 'チャット画面の吹き出しは、裏では**一本の文書**につながっている。' },
    { at: 5.4, to: 10.6, text: '発言の前には「システム」「ユーザー」「アシスタント」という\n役割の印が付く。' },
    { at: 10.8, to: 18, text: 'モデルは、最後の「アシスタント」の印の後ろに続きを書く。\nそれが返事になる。' },
  ],

  prepare(ctx) {
    const bubbles = TURNS.map(([, s]) => bubbleLayout(ctx, s, 520, { font: BFONT, pad: 18 }));
    const reply = bubbleLayout(ctx, REPLY, 520, { font: BFONT, pad: 18 });
    // bubble positions in the chat window
    let y = CHAT.y + 150;
    const bpos = TURNS.map(([who], i) => {
      const L = bubbles[i];
      const x = who === 'user' ? CHAT.x + CHAT.w - 28 - L.w : CHAT.x + 28;
      const out = { x, y, L };
      y += L.h + 18;
      return out;
    });
    const rpos = { x: CHAT.x + 28, y, L: reply };
    // document lines: role mark, then the text wrapped beside it
    const entries = [['system', SYSTEM], ...TURNS, ['assistant', '']];
    let dy = DOC.y + 132;
    const lines = entries.map(([who, s]) => {
      const mark = measure(ctx, F.jp(700, 17), ROLE[who]) + 24;
      const textX = DOC.x + 32 + mark + 12;
      const rows = s ? wrap(ctx, DFONT, s, DOC.x + DOC.w - 32 - textX) : [''];
      const out = { who, s, y: dy, textX, rows };
      dy += Math.max(1, rows.length) * 42 + 40;
      return out;
    });
    return { bpos, rpos, lines };
  },

  draw(ctx, t, { bpos, rpos, lines }) {
    // ——— the chat window
    const c = tw(t, 0.2, 0.6);
    ctx.save();
    ctx.globalAlpha = c;
    rr(ctx, CHAT.x, CHAT.y, CHAT.w, CHAT.h, 20);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'チャット画面', CHAT.x + 28, CHAT.y + 44, { font: F.jp(700, 22), color: C.ink2 });
    // the hidden instruction, faint and dashed
    ctx.setLineDash([6, 6]);
    rr(ctx, CHAT.x + 28, CHAT.y + 66, CHAT.w - 56, 58, 10);
    ctx.strokeStyle = C.rule;
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, `見えない指示：${SYSTEM}`, CHAT.x + 46, CHAT.y + 102, { font: F.jp(400, 19), color: C.muted });
    ctx.restore();
    bpos.forEach((b, i) => {
      const a = tw(t, 0.6 + i * 0.55, 0.5, (p) => outBack(p, 1.5));
      bubble(ctx, b.x, b.y + (1 - Math.min(1, a)) * 12, b.L, { fill: TURNS[i][0] === 'user' ? C.blueSoft : C.panel, alpha: Math.min(1, a) });
    });

    // ——— the document the model actually reads
    const d = tw(t, DOC_AT, 0.6);
    if (d > 0) {
      ctx.save();
      ctx.globalAlpha = d;
      rr(ctx, DOC.x, DOC.y, DOC.w, DOC.h, 20);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      text(ctx, 'モデルが読む文書', DOC.x + 32, DOC.y + 48, { font: F.jp(700, 24), color: C.ink });
      text(ctx, '1 本のテキスト', DOC.x + 32 + 204, DOC.y + 47, { font: F.jp(400, 19), color: C.muted });
      ctx.restore();
    }
    lines.forEach((ln, i) => {
      const at = DOC_AT + 0.5 + i * 0.55;
      const a = tw(t, at, 0.5);
      if (a <= 0) return;
      tag(ctx, DOC.x + 32, ln.y - 26, ROLE[ln.who], { font: F.jp(700, 17), h: 34, padX: 12, r: 6, fill: C.accent, color: '#fff', alpha: a });
      if (ln.s) ln.rows.forEach((r, j) => text(ctx, r, ln.textX, ln.y + j * 42, { font: DFONT, color: C.ink, alpha: a }));
      // a thread from each bubble to its line
      const b = i === 0 ? null : bpos[i - 1];
      if (b) {
        const fromX = TURNS[i - 1][0] === 'user' ? b.x + b.L.w : b.x + b.L.w;
        const fromY = b.y + b.L.h / 2;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6 * (1 - seg(t, DOC_AT + 4.2, DOC_AT + 5.0));
        path(ctx, quadPoints(fromX + 8, fromY, (fromX + DOC.x) / 2, fromY, DOC.x + 24, ln.y - 9, 30), tw(t, at, 0.6, inOutCubic));
        ctx.globalAlpha = 1;
      }
    });

    // ——— the reply is the continuation after the last mark
    const last = lines[lines.length - 1];
    if (t >= DOC_AT + 0.5 + (lines.length - 1) * 0.55) {
      const p = seg(t, REPLY_AT, REPLY_AT + 1.6);
      const shown = typed(REPLY, p);
      text(ctx, shown, last.textX, last.y, { font: DFONT, color: C.accent });
      if (p < 1 && Math.floor(t * 2.5) % 2 === 0) {
        ctx.fillStyle = C.accent;
        ctx.fillRect(last.textX + measure(ctx, DFONT, shown) + 3, last.y - 24, 3, 30);
      }
      const pa = tw(t, REPLY_AT + 1.8, 0.5);
      text(ctx, '↑ モデルが書いた続き ＝ 返事', last.textX, last.y + 52, { font: F.jp(700, 21), color: C.accent, alpha: pa });
      const ra = tw(t, REPLY_AT, 0.4);
      bubble(ctx, rpos.x, rpos.y, rpos.L, { fill: C.panel, stroke: C.accent, lw: 2, alpha: ra, chars: p });
    }
    text(ctx, '印の書き方は説明のための例。実際の形式はモデルごとに異なる', DOC.x + 32, DOC.y + DOC.h - 28, {
      font: F.jp(400, 17), color: C.muted, alpha: tw(t, DOC_AT + 1.0, 0.5),
    });
  },
});
