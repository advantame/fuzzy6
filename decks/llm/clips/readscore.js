// How to read a score: it belongs to a combination — model, harness, test set and its version,
// settings, and who measured. DeepSeek-V4-Pro-0813 on Terminal-Bench 2.1: 87.9 in DeepSeek's
// model card (DeepSeek Harness minimal, effort max, temperature 1.0, top_p 0.95) and 54.68% when
// Vals AI ran it with Terminus 2 (89 tasks, pass@1, Daytona with time limits). The version moves
// it too: 2.1 revised 28 of the 89 tasks, and Opus 4.6 with Claude Code went from 58.0 to 70.1.
// The gap cannot all be put on the harness. DeepSeek published the harness it measured with.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const PARTS = ['モデル', 'ハーネス', '課題集と版', '設定', '測った人'];
// what each part asks, shown under it while the first cue is read
const ASKS = ['どのモデルか', '何で動かしたか', 'どの問題の何版か', '考える量、時間', '自社か、第三者か'];
const CW = 680;
const CARDS = [
  {
    x: M.l, at: 5.4, score: '87.9', who: 'DeepSeek の発表', fill: C.ink,
    rows: [
      ['モデル', 'DeepSeek-V4-Pro-0813'],
      ['ハーネス', 'DeepSeek Harness（minimal）'],
      ['課題集', 'Terminal-Bench 2.1'],
      ['設定', 'effort max、temperature 1.0、top_p 0.95'],
    ],
  },
  {
    x: M.l + CW + 48, at: 6.6, score: '54.68', who: 'Vals AI の測定', fill: C.blue,
    rows: [
      ['モデル', 'DeepSeek-V4-Pro-0813'],
      ['ハーネス', 'Terminus 2'],
      ['課題集', 'Terminal-Bench 2.1（89 題、pass@1）'],
      ['設定', '時間の制限つき（Daytona）'],
    ],
  },
];
const DIFF = new Set(['ハーネス']);
const CY = 196;
const VER = 10.0;
const END = 14.0;

export default clip({
  id: 'readscore',
  title: '点の読み方',
  kicker: '何で測ったか',
  duration: 18,
  cues: [
    { at: 0.4, to: 5.2, text: '点数は、モデルだけの値ではない。ハーネス、課題集とその版、\n設定、測った人まで含めた、組み合わせの値。' },
    { at: 5.4, to: 9.8, text: '同じ DeepSeek-V4-Pro でも、DeepSeek の発表では 87.9%、\nVals AI が別のハーネスで測ると 54.68%。' },
    { at: 10.0, to: 13.8, text: '課題集の版でも変わる。89 題のうち 28 題を直した版では、\n同じ組み合わせが 58.0% から 70.1% になった。' },
    { at: 14.0, to: 19, text: '差のすべてを、ハーネスのせいにはできない。\nDeepSeek は、点を測るのに使ったハーネスを公開した。' },
  ],

  draw(ctx, t) {
    // ——— a score is a combination
    let x = M.l;
    text(ctx, '点', x, 132, { font: F.jp(700, 30), color: C.accent, alpha: tw(t, 0.4, 0.4) });
    x += 44;
    text(ctx, '＝', x, 130, { font: F.jp(700, 24), color: C.muted, alpha: tw(t, 0.6, 0.4) });
    x += 40;
    PARTS.forEach((s, i) => {
      const a = tw(t, 0.8 + i * 0.35, 0.4, (p) => outBack(p, 1.6));
      const w = tag(ctx, x, 100, s, { font: F.jp(700, 21), h: 44, padX: 18, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: Math.min(1, a) });
      text(ctx, ASKS[i], x + w / 2, 170, { font: F.jp(500, 15), color: C.ink2, align: 'center', alpha: tw(t, 2.6 + i * 0.4, 0.5) });
      x += w + 10;
      if (i < PARTS.length - 1) {
        text(ctx, '×', x + 4, 130, { font: F.sans(500, 24), color: C.muted, alpha: Math.min(1, a) });
        x += 34;
      }
    });

    // ——— the same model, two scores
    CARDS.forEach((c) => card(ctx, t, c));
    const ga = tw(t, 8.4, 0.5);
    text(ctx, '違うのはハーネス。設定や時間の制限も、同じとは限らない', M.l, CY + 330, { font: F.jp(500, 17), color: C.ink2, alpha: ga });

    // ——— the version of the test set
    const va = tw(t, VER, 0.5);
    if (va > 0) {
      const y = 590;
      ctx.save();
      ctx.globalAlpha = va;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 34, (W - M.l - M.r) * outExpo(va), 2);
      ctx.restore();
      text(ctx, '課題集の版で', M.l, y + 8, { font: F.jp(700, 22), color: C.ink, alpha: va });
      text(ctx, 'Claude Opus 4.6 ＋ Claude Code。2.1 は 89 題のうち 28 題を直した版', M.l + 150, y + 7, { font: F.jp(500, 17), color: C.ink2, alpha: va });
      [['2.0', 58.0], ['2.1', 70.1]].forEach(([v, s], i) => {
        const by = y + 34 + i * 50;
        const a = tw(t, VER + 0.3 + i * 0.5, 0.4);
        text(ctx, `Terminal-Bench ${v}`, M.l, by + 27, { font: F.sans(600, 19), color: C.ink, alpha: a });
        const bw = 620 * (s / 100) * tw(t, VER + 0.4 + i * 0.5, 0.8, inOutCubic);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = C.rule;
        ctx.fillRect(M.l + 200, by + 8, 620, 26);
        ctx.fillStyle = i ? C.accent : C.ink2;
        ctx.fillRect(M.l + 200, by + 8, bw, 26);
        ctx.restore();
        text(ctx, `${s.toFixed(1)}%`, M.l + 200 + bw + 12, by + 30, { font: F.cond(700, 28), color: i ? C.accent : C.ink, alpha: a });
      });
    }

    // ——— the harness behind the first number is public
    const ea = tw(t, END, 0.6, (p) => outBack(p, 1.3));
    if (ea > 0) {
      const b = { x: 1080, y: 610, w: W - M.r - 1080, h: 128 };
      ctx.save();
      ctx.globalAlpha = Math.min(1, ea);
      rr(ctx, b.x, b.y, b.w, b.h, 16);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, '2026-08-13', b.x + 24, b.y + 38, { font: F.cond(700, 22), color: C.accent, alpha: Math.min(1, ea) });
      text(ctx, 'DeepSeek Harness を公開', b.x + 24, b.y + 76, { font: F.jp(700, 25), color: C.paper, alpha: Math.min(1, ea) });
      text(ctx, 'minimal の構成も、誰でも動かせる', b.x + 24, b.y + 108, { font: F.jp(500, 17), color: '#bdb6a9', alpha: Math.min(1, ea) });
    }

    source(ctx, 'DeepSeek-V4-Pro-0813 モデルカード、Vals AI（2026-09-28 更新）、tbench.ai（Terminal-Bench 2.1）', tw(t, 5.4, 0.5));
  },
});

// One score with the combination it belongs to; rows that differ between the two are marked.
function card(ctx, t, c) {
  const a = tw(t, c.at, 0.5);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, c.x, CY, CW, 296, 18);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  tag(ctx, c.x + 22, CY + 22, c.who, { font: F.jp(700, 19), h: 40, padX: 16, fill: c.fill, color: '#fff', alpha: a });
  text(ctx, c.score, c.x + CW - 60, CY + 76, { font: F.cond(700, 72), color: c.fill === C.ink ? C.ink : C.blue, align: 'right', alpha: a });
  text(ctx, '%', c.x + CW - 24, CY + 74, { font: F.cond(700, 34), color: c.fill === C.ink ? C.ink : C.blue, align: 'right', alpha: a });
  c.rows.forEach(([k, v], i) => {
    const y = CY + 120 + i * 42;
    const ra = tw(t, c.at + 0.3 + i * 0.15, 0.4);
    const diff = DIFF.has(k);
    const mark = diff ? tw(t, 8.0, 0.5) : 0;
    if (mark > 0) {
      ctx.save();
      ctx.globalAlpha = ra * mark;
      rr(ctx, c.x + 14, y - 4, CW - 28, 38, 8);
      ctx.fillStyle = C.accentSoft;
      ctx.fill();
      ctx.restore();
    }
    text(ctx, k, c.x + 28, y + 22, { font: F.jp(700, 17), color: C.muted, alpha: ra });
    text(ctx, v, c.x + 130, y + 22, { font: F.jp(500, 19), color: diff && mark > 0.5 ? C.accent : C.ink, alpha: ra });
  });
}
