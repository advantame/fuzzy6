// OpenAI's report of building an internal beta product with no code written by hand (Ryan
// Lopopolo, "Harness engineering", 2026-02-11): about five months from the first commit in late
// August 2025, about 1,500 pull requests opened and merged, about a million lines (the product
// plus infrastructure, tools and docs), three engineers at first and seven at the time of
// writing, 3.5 PRs per engineer per day on average. People kept the intent, the priorities, the
// acceptance criteria and the judgement of results. The company's own numbers.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, circle, rr } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outExpo } from '../../../src/kit/ease.js';

const PRS = 1500;
const ROWS = 30;
const CELL = 11;
const GX = M.l;
const GY = 236;
const SX = 780;
const STATS = [
  { at: 6.0, big: '約 100 万', unit: '行', note: '書かれたコード。製品のほか、基盤、ツール、文書も含む' },
  { at: 6.6, big: '0', unit: '行', note: '人が直接書いたコード', hot: true },
  { at: 7.6, big: '3 → 7', unit: '人', note: 'Codex を動かしたエンジニア（はじめ → 記事の時点）' },
  { at: 8.4, big: '3.5', unit: '件', note: '1 人 1 日あたりの PR（平均）' },
];
const ROLES = ['意図を伝える', '優先順位を決める', '受け入れの条件を決める', '結果を判断する'];

export default clip({
  id: 'nohands',
  title: '書かずに作る',
  kicker: 'OpenAI の例',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'OpenAI は 2026 年 2 月、人がコードを 1 行も書かずに作った\n社内の製品の例を報告した。約 5 か月で、PR は約 1,500 件。' },
    { at: 6.0, to: 11.2, text: 'コードは約 100 万行で、書いたのはすべて Codex。\nはじめは 3 人で、1 人 1 日あたり平均 3.5 件の PR になった。' },
    { at: 11.4, to: 18, text: '人が受け持ったのは、意図、優先順位、受け入れの条件、結果の判断。\n数字は OpenAI 自身の報告。' },
  ],

  draw(ctx, t) {
    const ha = tw(t, 0.4, 0.5);
    text(ctx, 'OpenAI の社内の製品', M.l, 128, { font: F.jp(700, 26), color: C.ink, alpha: ha });
    text(ctx, '社内向けのベータ版。数字は同社の報告（2026 年 2 月）', M.l + 268, 127, { font: F.jp(500, 18), color: C.muted, alpha: ha });

    // ——— the pull requests, one square each, filling in over the five months
    const fill = inOutCubic(seg(t, 1.0, 5.0));
    const n = Math.round(PRS * fill);
    const ga = tw(t, 0.8, 0.5);
    // "about" once the count has landed
    const w0 = text(ctx, '約', GX, GY - 26, { font: F.jp(700, 26), color: C.accent, alpha: ga * tw(t, 5.0, 0.4) });
    const w = text(ctx, n.toLocaleString('en-US'), GX + w0 + 8, GY - 22, { font: F.cond(700, 60), color: C.accent, alpha: ga }) + w0 + 8;
    text(ctx, '件の PR を作ってマージ', GX + w + 12, GY - 26, { font: F.jp(700, 21), color: C.ink, alpha: ga });
    ctx.save();
    ctx.globalAlpha = ga * 0.5;
    ctx.fillStyle = C.rule;
    for (let i = n; i < PRS; i++) cell(ctx, i);
    ctx.globalAlpha = ga;
    ctx.fillStyle = C.accent;
    for (let i = 0; i < n; i++) cell(ctx, i);
    ctx.restore();
    // the time axis under it
    const ay = GY + ROWS * CELL + 22;
    const aw = (PRS / ROWS) * CELL - 2;
    ctx.save();
    ctx.globalAlpha = ga;
    ctx.fillStyle = C.ink2;
    ctx.fillRect(GX, ay, aw, 2);
    ctx.fillRect(GX, ay - 6, 2, 14);
    ctx.fillRect(GX + aw - 2, ay - 6, 2, 14);
    ctx.restore();
    text(ctx, '2025 年 8 月下旬、最初のコミット', GX, ay + 30, { font: F.jp(500, 17), color: C.ink2, alpha: ga });
    text(ctx, '約 5 か月', GX + aw, ay + 30, { font: F.jp(700, 17), color: C.ink, align: 'right', alpha: ga });
    text(ctx, '1 マスが PR 1 件', GX, ay + 58, { font: F.jp(400, 16), color: C.muted, alpha: ga });

    // ——— the other numbers
    STATS.forEach((s, i) => {
      const a = tw(t, s.at, 0.5);
      if (a <= 0) return;
      const y = GY - 22 + i * 112;
      const dy = (1 - a) * 12;
      const bw = text(ctx, s.big, SX, y + dy, { font: F.cond(700, 64), color: s.hot ? C.accent : C.ink, alpha: a });
      text(ctx, s.unit, SX + bw + 10, y - 4 + dy, { font: F.jp(700, 28), color: s.hot ? C.accent : C.ink, alpha: a });
      text(ctx, s.note, SX, y + 34 + dy, { font: F.jp(500, 18), color: C.ink2, alpha: a });
    });

    // ——— what the people kept
    const ra = tw(t, 11.4, 0.6);
    if (ra > 0) {
      const y = 712;
      ctx.save();
      ctx.globalAlpha = ra;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 42, (W - M.l - M.r) * outExpo(ra), 2);
      ctx.fillStyle = C.blue;
      circle(ctx, M.l + 12, y + 10, 9);
      ctx.fill();
      rr(ctx, M.l, y + 22, 24, 15, 7);
      ctx.fill();
      ctx.restore();
      text(ctx, '人が受け持ったこと', M.l + 40, y + 34, { font: F.jp(700, 22), color: C.blue, alpha: ra });
      let x = M.l + 260;
      ROLES.forEach((s, i) => {
        const bw = tag(ctx, x, y + 6, s, { font: F.jp(700, 20), h: 44, padX: 18, fill: C.blueSoft, color: C.blue, alpha: tw(t, 11.7 + i * 0.25, 0.5) });
        x += bw + 16;
      });
    }

    source(ctx, 'OpenAI、Ryan Lopopolo「Harness engineering」（2026-02-11）', ha);
  },
});

// One pull request's square: columns left to right in time, each filled from the bottom.
function cell(ctx, i) {
  const col = Math.floor(i / ROWS);
  const row = ROWS - 1 - (i % ROWS);
  ctx.fillRect(GX + col * CELL, GY + row * CELL, CELL - 2, CELL - 2);
}
