// How it can go wrong. Paraphrasing a paraphrase loses detail (the sentences are an example);
// an experiment that kept searching its own written answers saw the answers converge (Druck &
// Smith 2026: the share of rounds where every answer named the same entities rose from 1.98% to
// 77.23% — not an error rate); and handing over the organising may also hand over the
// understanding (a concern raised on Hacker News). Then what helps.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { text, typed } from '../../../src/kit/draw.js';
import { tw, seg, outExpo } from '../../../src/kit/ease.js';

// each generation rewrites the one before; [text, the detail dropped at this step]
const GENS = [
  ['GPT-3 は 2020 年に、3000 億トークンで学習した。窓は 2,048。', null],
  ['GPT-3 は 2020 年に、大量の文章で学習した。窓は 2,048。', '3000 億トークン'],
  ['GPT-3 は、大量の文章で学習した。', '2020 年、窓の長さ'],
  ['GPT-3 は、大きなモデルだ。', '何で学習したか'],
];
const GX = M.l;
const GY = 196;
const GSTEP = 74;
const CH = { x: 980, y: 180, w: 520, h: 300 };
const FIXES = ['出典をたどれるようにする', '古い記述を直す', '人が読んで確かめる'];

export default clip({
  id: 'drift',
  title: '崩れ方',
  kicker: '批判と対策',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '批判もある。要約の要約を重ねると、細部が落ちていかないか。\n小さな誤りが、積み重ならないか。' },
    { at: 6.0, to: 11.2, text: '自分で書いた資料を繰り返し検索させた 2026 年の実験では、\n回答が同じものにそろう割合が、2% から 77% に増えた。' },
    { at: 11.4, to: 18, text: '整理を任せると、自分で理解する機会も減る、という声もある。\n出典をたどれるようにし、人が読んで確かめることが要る。' },
  ],

  draw(ctx, t) {
    // ——— a paraphrase of a paraphrase
    const ha = tw(t, 0.4, 0.5);
    text(ctx, '言い換えの言い換え', GX, GY - 50, { font: F.jp(700, 22), color: C.ink, alpha: ha });
    GENS.forEach(([s, lost], i) => {
      const at = 0.8 + i * 1.1;
      const a = tw(t, at, 0.4);
      if (a <= 0) return;
      const y = GY + i * GSTEP;
      tag(ctx, GX, y - 24, i === 0 ? '元の資料' : `${i} 回目`, { font: F.jp(700, 15), h: 28, padX: 10, fill: i === 0 ? C.green : C.panel, color: i === 0 ? '#fff' : C.ink2, alpha: a });
      text(ctx, typed(s, seg(t, at, at + 0.6)), GX + 110, y - 3, { font: F.jp(500, 21), color: i === 0 ? C.ink : C.ink2, alpha: a });
      if (lost) text(ctx, `落ちたもの：${lost}`, GX + 110, y + 24, { font: F.jp(500, 16), color: C.red, alpha: tw(t, at + 0.6, 0.4) });
    });

    // ——— answers converging when the system reads what it wrote
    const ca = tw(t, 6.0, 0.6);
    if (ca > 0) {
      text(ctx, '自分の書いた資料を、繰り返し検索すると', CH.x, CH.y - 34, { font: F.jp(700, 21), color: C.ink, alpha: ca });
      text(ctx, '同じ回の回答が、すべて同じものにそろった割合', CH.x, CH.y - 8, { font: F.jp(500, 16), color: C.muted, alpha: ca });
      const bars = [['はじめ', 1.98], ['くり返したあと', 77.23]];
      bars.forEach(([label, v], i) => {
        const x = CH.x + 40 + i * 240;
        const h = (CH.h - 40) * (v / 100) * outExpo(seg(t, 6.4 + i * 0.8, 7.4 + i * 0.8));
        const a = tw(t, 6.3 + i * 0.8, 0.4);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = i === 0 ? C.ink2 : C.accent;
        ctx.fillRect(x, CH.y + CH.h - h, 120, Math.max(2, h));
        ctx.restore();
        text(ctx, `${v}%`, x + 60, CH.y + CH.h - h - 14, { font: F.cond(700, i === 0 ? 30 : 44), color: i === 0 ? C.ink2 : C.accent, align: 'center', alpha: tw(t, 6.9 + i * 0.8, 0.4) });
        text(ctx, label, x + 60, CH.y + CH.h + 30, { font: F.jp(500, 18), color: C.ink2, align: 'center', alpha: a });
      });
      ctx.save();
      ctx.globalAlpha = ca;
      ctx.fillStyle = C.rule;
      ctx.fillRect(CH.x, CH.y + CH.h, CH.w - 40, 2);
      ctx.restore();
      text(ctx, 'GPT-5.2 Chat、101 問。誤りの割合ではない', CH.x, CH.y + CH.h + 64, { font: F.jp(400, 16), color: C.muted, alpha: tw(t, 8.6, 0.5) });
    }

    // ——— the concern about understanding
    const qa = tw(t, 11.4, 0.6);
    if (qa > 0) {
      const y = 600;
      ctx.save();
      ctx.globalAlpha = qa;
      ctx.fillStyle = C.blue;
      ctx.fillRect(GX, y - 30, 6, 64);
      ctx.restore();
      text(ctx, '整理を任せると、自分で理解を組み立てる機会まで減らさないか', GX + 24, y, { font: F.jp(700, 22), color: C.ink, alpha: qa });
      text(ctx, 'Hacker News の LLM Wiki のスレッドで出た声（2026 年 4 月）', GX + 24, y + 30, { font: F.jp(400, 16), color: C.muted, alpha: qa });
    }
    // ——— what helps
    const fa = tw(t, 12.6, 0.6);
    if (fa > 0) {
      const y = 718;
      text(ctx, '対策', GX, y + 24, { font: F.jp(700, 20), color: C.green, alpha: fa });
      let x = GX + 70;
      FIXES.forEach((s, i) => {
        const w = tag(ctx, x, y, s, { font: F.jp(700, 19), h: 40, padX: 16, fill: C.greenSoft, color: C.green, alpha: tw(t, 12.8 + i * 0.25, 0.5) });
        x += w + 16;
      });
    }

    example(ctx, M.l, 818, tw(t, 1.2, 0.5), '言い換えの文は説明のための例');
    source(ctx, 'Druck・Smith、arXiv:2608.22118（2026-08-22）表 3、Hacker News（2026-04-05）', ca);
  },
});
