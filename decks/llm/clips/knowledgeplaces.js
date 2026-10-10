// Places to keep and link knowledge, on a true-to-scale axis from 1940 to 2030: Bush's Memex
// (1945), Luhmann's slip box, hypertext, NLS, the Web, WikiWikiWeb, Wikipedia, Obsidian — and in
// 2026 Karpathy's LLM Wiki, which stresses handing the upkeep to the model. The line of events
// shows several ways of organising knowledge, not one chain of influence.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source } from '../lib/parts.js';
import { text, line, circle } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const Y = 452;
const X0 = M.l + 20;
const X1 = W - M.r - 20;
const yearX = (y) => X0 + ((y - 1940) / 90) * (X1 - X0);
// side −1 above, 1 below; level pushes the card further out
const EVENTS = [
  { year: 1945, label: '1945', title: 'Memex', note: ['Bush が構想した、個人の資料を', '蓄えて連想でたどる装置'], side: -1, level: 2, at: 0.9 },
  { year: 1965, label: '1965', title: 'ハイパーテキスト', note: ['Nelson が提唱'], side: -1, level: 1, at: 6.0 },
  { year: 1968, label: '1968', title: 'NLS の実演', note: ['Engelbart。リンクと', '遠隔の共同作業'], side: 1, level: 1, at: 6.4 },
  { year: 1991, label: '1991', title: 'Web の公開', note: ['1989 年に Berners-Lee が提案'], side: -1, level: 2, at: 6.9 },
  { year: 1995, label: '1995', title: 'WikiWikiWeb', note: ['Cunningham。誰でも', '書き直せる頁'], side: 1, level: 2, at: 7.4 },
  { year: 2001, label: '2001', title: 'Wikipedia', note: [], side: -1, level: 1, at: 7.9 },
  { year: 2020, label: '2020', title: 'Obsidian', note: ['手元の Markdown を', 'リンクとグラフで見る'], side: 1, level: 1, at: 8.6 },
  { year: 2026, label: '2026', title: 'LLM Wiki', note: ['保守を LLM に任せる'], side: -1, level: 2, at: 11.6, hot: true, left: true },
];
const SLIP = { from: 1952, to: 1997, at: 4.2 };
const UPKEEP = 11.2;

export default clip({
  id: 'knowledgeplaces',
  title: '知識の置き場',
  kicker: 'Memex から wiki へ',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '知識をためて、つなぐ場所は、昔から考えられてきた。\n1945 年、Bush は、個人の資料を蓄えて連想でたどる Memex を構想した。' },
    { at: 6.0, to: 11.0, text: 'ハイパーテキスト、Web、wiki、Wikipedia、Obsidian と、\nリンクでつながった頁は、身近なものになった。' },
    { at: 11.2, to: 18, text: 'ただ、頁を書き足し、つなぎ直す保守は、人の仕事だった。\nKarpathy は、その保守を LLM に任せる点を強調した。' },
  ],

  draw(ctx, t) {
    // ——— the axis, drawn in, with decades
    const ax = tw(t, 0.2, 1.0, inOutCubic);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    line(ctx, X0, Y, X1, Y, ax);
    for (let y = 1940; y <= 2030; y += 10) {
      const a = tw(t, 0.3 + ((y - 1940) / 90) * 0.9, 0.4);
      const x = yearX(y);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = C.ink;
      ctx.fillRect(x - 1, Y - 6, 2, 12);
      ctx.restore();
      text(ctx, `${y}`, x, Y + 34, { font: F.cond(600, 18), color: C.muted, align: 'center', alpha: a });
    }

    // ——— events
    EVENTS.forEach((e) => {
      const a = tw(t, e.at, 0.5, (p) => outBack(p, 1.6));
      if (a <= 0) return;
      const x = yearX(e.year);
      const reach = e.side < 0 ? 60 + e.level * 80 : 80 + e.level * 76;
      const ty = Y + e.side * reach;
      const fa = Math.min(1, a);
      ctx.save();
      ctx.globalAlpha = fa;
      ctx.strokeStyle = e.hot ? C.accent : C.ink2;
      ctx.lineWidth = 1.5;
      line(ctx, x, Y + e.side * 8, x, ty - e.side * (e.side < 0 ? -10 : 34), seg(a, 0, 0.8));
      ctx.fillStyle = e.hot ? C.accent : C.ink;
      circle(ctx, x, Y, (e.hot ? 10 : 7) * fa);
      ctx.fill();
      ctx.restore();
      const top = e.side < 0 ? ty - 20 - e.note.length * 24 : ty;
      const tx = e.left ? x - 10 : x + 10;
      const align = e.left ? 'right' : 'left';
      text(ctx, e.label, tx, top, { font: F.cond(700, 22), color: e.hot ? C.accent : C.ink, align, alpha: fa });
      text(ctx, e.title, tx, top + 28, { font: F.jp(700, e.hot ? 24 : 21), color: e.hot ? C.accent : C.ink, align, alpha: fa });
      e.note.forEach((n, i) => text(ctx, n, tx, top + 54 + i * 22, { font: F.jp(400, 16), color: C.ink2, align, alpha: fa }));
    });

    // ——— Luhmann's slip box: a band just below the axis, over the leader lines
    const sa = tw(t, SLIP.at, 0.6);
    if (sa > 0) {
      const x0 = yearX(SLIP.from);
      const x1 = yearX(SLIP.from + (SLIP.to - SLIP.from) * outExpo(sa));
      ctx.save();
      ctx.globalAlpha = sa;
      ctx.fillStyle = C.blueSoft;
      ctx.fillRect(x0, Y + 48, x1 - x0, 30);
      ctx.restore();
      text(ctx, 'Luhmann のツェッテルカステン　約 9 万枚のカード（1952〜1997 年ごろ）', x0 + 10, Y + 68, { font: F.jp(500, 16), color: C.ink2, alpha: sa * tw(t, SLIP.at + 0.4, 0.5) });
    }

    // ——— the upkeep was people's work
    const ua = tw(t, UPKEEP, 0.6);
    if (ua > 0) {
      const x0 = yearX(1945);
      const x1 = yearX(2020);
      ctx.save();
      ctx.globalAlpha = ua;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      const y = Y + 316;
      line(ctx, x0, y, x0 + (x1 - x0) * outExpo(ua), y);
      line(ctx, x0, y - 8, x0, y + 8);
      line(ctx, x1, y - 8, x1, y + 8);
      ctx.restore();
      text(ctx, '書き足し、つなぎ直すのは人', (x0 + x1) / 2, Y + 346, { font: F.jp(700, 21), color: C.blue, align: 'center', alpha: tw(t, UPKEEP + 0.3, 0.5) });
    }

    source(ctx, 'Bush（The Atlantic、1945 年 7 月）、CERN、Wikimedia、Obsidian、Karpathy（2026）', tw(t, 1.0, 0.6));
  },
});
