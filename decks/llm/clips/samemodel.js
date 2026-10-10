// Same model, better harness, 2026: LangChain kept GPT-5.2-Codex fixed and improved its
// deepagents-cli harness on Terminal-Bench 2.0 (89 tasks) from 52.8% to 66.5%, changing the
// prompt, tools, middleware and how the reasoning budget was spread over the task. In the
// article's comparison, always-xhigh scored 53.9%, always-high 63.6%, and xhigh → high → xhigh
// 66.5%. LangChain's own report (Vivek Trivedy, 2026-02-17).

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const TX = 470;
const TW = 900; // 100 %
const CHANGES = ['指示（プロンプト）', 'ツール', 'ミドルウェア', '考える量の配分'];
const BUDGET = [
  { label: 'いつも xhigh', v: 53.9 },
  { label: 'いつも high', v: 63.6 },
  { label: 'xhigh → high → xhigh', v: 66.5, hot: true, note: 'はじめと終わりを xhigh、途中を high' },
];

export default clip({
  id: 'samemodel',
  title: '点を上げる',
  kicker: '同じモデルで',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'LangChain は 2026 年 2 月、モデルを GPT-5.2-Codex に固定したまま、\nハーネスだけを直して点を上げた。' },
    { at: 6.0, to: 11.2, text: '端末の作業の課題集で、52.8% から 66.5% へ。\n変えたのは、指示、ツール、ミドルウェア、考える量の配分。' },
    { at: 11.4, to: 18, text: 'いつも最大まで考えさせると 53.9% で、かえって低い。\nはじめと終わりを xhigh、途中を high にした配分が、いちばん高かった。' },
  ],

  draw(ctx, t) {
    // ——— what stays the same
    const ha = tw(t, 0.4, 0.5);
    let x = M.l;
    x += tag(ctx, x, 104, 'モデル：GPT-5.2-Codex（固定）', { font: F.jp(700, 19), h: 42, padX: 18, fill: C.ink, color: C.paper, alpha: ha }) + 14;
    x += tag(ctx, x, 104, 'ハーネス：deepagents-cli', { font: F.jp(700, 19), h: 42, padX: 18, fill: '#fff', stroke: C.accent, color: C.accent, alpha: tw(t, 0.8, 0.5) }) + 22;
    text(ctx, 'Terminal-Bench 2.0（端末の作業を最後までやり遂げる 89 題）', x, 132, { font: F.jp(500, 18), color: C.muted, alpha: tw(t, 1.1, 0.5) });

    // ——— before and after
    track(ctx, 210, '直す前', 52.8, C.ink2, tw(t, 1.6, 0.5), tw(t, 1.8, 1.2, inOutCubic));
    const ca = tw(t, 3.4, 0.5);
    text(ctx, '変えたもの', M.l, 318, { font: F.jp(700, 19), color: C.ink2, alpha: ca });
    let cx = TX;
    CHANGES.forEach((s, i) => {
      const w = tag(ctx, cx, 292, s, { font: F.jp(700, 18), h: 38, padX: 15, fill: C.accentSoft, color: C.accent, alpha: tw(t, 3.6 + i * 0.3, 0.4) });
      cx += w + 12;
    });
    track(ctx, 380, '直したあと', 66.5, C.accent, tw(t, 4.8, 0.5), tw(t, 5.0, 1.2, inOutCubic), false);
    const up = tw(t, 6.4, 0.5);
    text(ctx, '+13.7 ポイント', TX + TW * 0.665 + 18, 466, { font: F.jp(700, 22), color: C.accent, alpha: up });

    // ——— spreading the reasoning
    const ra = tw(t, 11.4, 0.6);
    if (ra > 0) {
      ctx.save();
      ctx.globalAlpha = ra;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, 500, (W - M.l - M.r) * outExpo(ra), 2);
      ctx.restore();
      text(ctx, '考える量の配分（記事の比較）', M.l, 548, { font: F.jp(700, 21), color: C.ink, alpha: ra });
      BUDGET.forEach((b, i) => {
        const y = 586 + i * 66;
        const a = tw(t, 11.8 + i * 0.5, 0.5);
        text(ctx, b.label, M.l, y + 27, { font: F.mono(600, 18), color: b.hot ? C.accent : C.ink, alpha: a });
        ctx.save();
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = C.rule;
        ctx.fillRect(TX, y + 8, TW, 26);
        ctx.globalAlpha = a;
        ctx.fillStyle = b.hot ? C.accent : C.ink2;
        ctx.fillRect(TX, y + 8, TW * (b.v / 100) * tw(t, 11.9 + i * 0.5, 0.8, inOutCubic), 26);
        ctx.restore();
        text(ctx, `${b.v}%`, TX + TW * (b.v / 100) + 14, y + 30, { font: F.cond(700, 30), color: b.hot ? C.accent : C.ink, alpha: tw(t, 12.5 + i * 0.5, 0.4) });
        if (b.note) text(ctx, b.note, M.l, y + 54, { font: F.jp(500, 16), color: C.ink2, alpha: tw(t, 13.4, 0.4) });
      });
    }

    source(ctx, 'LangChain、Vivek Trivedy「Improving Deep Agents with harness engineering」（2026-02-17）', ha);
  },
});

// One score on a track from 0 to 100 %, with its label on the left and its value at the end.
function track(ctx, y, label, v, color, a, p, ticks = true) {
  if (a <= 0) return;
  text(ctx, label, M.l, y + 38, { font: F.jp(700, 24), color: C.ink, alpha: a });
  ctx.save();
  ctx.globalAlpha = a * 0.6;
  ctx.fillStyle = C.rule;
  ctx.fillRect(TX, y + 10, TW, 40);
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.fillRect(TX, y + 10, TW * (v / 100) * p, 40);
  ctx.restore();
  text(ctx, `${(v * p).toFixed(1)}%`, TX + TW * (v / 100) * p + 16, y + 48, { font: F.cond(700, 54), color, alpha: a });
  if (ticks) [0, 50, 100].forEach((k) => text(ctx, `${k}`, TX + TW * (k / 100), y + 74, { font: F.mono(500, 14), color: C.muted, align: k === 0 ? 'left' : k === 100 ? 'right' : 'center', alpha: a }));
}
