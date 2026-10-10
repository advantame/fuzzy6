// Compile ahead, or assemble on the spot. Answering from search builds each answer from the
// sources at question time; a wiki is built from the sources ahead of time, and questions are
// answered from its pages (and good answers go back in). Karpathy's analogy from the gist, and
// two earlier ways of organising ahead of time. The flows are a schematic.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const LANE_A = 196;
const LANE_B = 372;
const BOX = { w: 132, h: 54 };
const COL = [250, 470, 690, 910, 1130, 1350];

export default clip({
  id: 'compile',
  title: '先に編む',
  kicker: 'その場か、前もってか',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '検索して答えるのは、問いのたびに資料から答えを組み立てるやり方。\nwiki は資料を前もって編んでおき、問いには編んだ頁で答える。' },
    { at: 6.0, to: 11.0, text: 'Karpathy はこれを、「Obsidian が IDE、\nLLM がプログラマー、wiki がコードベース」とたとえた。' },
    { at: 11.2, to: 18, text: '前もって整理する考えは、GraphRAG や DeepWiki にもある。\n資料が変われば頁も直さないと、古い説明が残る。' },
  ],

  draw(ctx, t) {
    // the two lanes are drawn a little larger than their coordinates
    ctx.save();
    ctx.translate(M.l, 100);
    ctx.scale(1.12, 1.12);
    ctx.translate(-M.l, -100);
    // ——— lane A: assembled at question time, every time
    const la = tw(t, 0.4, 0.5);
    text(ctx, 'その場で組み立てる', M.l, LANE_A - 40, { font: F.jp(700, 22), color: C.ink, alpha: la });
    text(ctx, '検索して答える', M.l + 214, LANE_A - 40, { font: F.jp(500, 18), color: C.muted, alpha: la });
    box(ctx, COL[0], LANE_A, '資料', C.panel, C.ink, tw(t, 0.6, 0.5));
    [0, 1].forEach((q) => {
      const at = 1.2 + q * 1.6;
      const y = LANE_A + q * 64 - 20;
      const a = tw(t, at, 0.5);
      tag(ctx, COL[1] - 6, y + 4, `問い ${q + 1}`, { font: F.jp(700, 15), h: 26, padX: 10, fill: C.blueSoft, color: C.blue, alpha: a });
      flowRow(ctx, t, at, [COL[1] + 76, COL[2], COL[3], COL[4]], y + 17, ['探す', '組み立てる', '答え'], q === 0);
      // the answer fades: nothing is kept
      const gone = tw(t, at + 1.6, 0.6);
      text(ctx, '残らない', COL[4] + BOX.w + 16, y + 24, { font: F.jp(700, 16), color: C.muted, alpha: gone });
    });

    // ——— lane B: built ahead, answered from the pages, answers filed back
    const lb = tw(t, 3.2, 0.5);
    text(ctx, '前もって編む', M.l, LANE_B - 40, { font: F.jp(700, 22), color: C.ink, alpha: lb });
    text(ctx, 'LLM Wiki', M.l + 140, LANE_B - 40, { font: F.sans(600, 18), color: C.muted, alpha: lb });
    box(ctx, COL[0], LANE_B, '資料', C.panel, C.ink, tw(t, 3.3, 0.5));
    const wiki = tw(t, 3.9, 0.5, (p) => outBack(p, 1.6));
    box(ctx, COL[2], LANE_B, 'wiki の頁', '#fff', C.accent, wiki, true);
    ctx.save();
    ctx.strokeStyle = C.accent;
    ctx.fillStyle = C.accent;
    ctx.lineWidth = 3;
    arrow(ctx, COL[0] + BOX.w + 10, LANE_B + BOX.h / 2, COL[2] - 12, LANE_B + BOX.h / 2, inOutCubic(seg(t, 3.5, 4.0)), 12);
    ctx.restore();
    text(ctx, '取り込むときに編む', (COL[0] + BOX.w + COL[2]) / 2, LANE_B + BOX.h / 2 - 14, { font: F.jp(700, 16), color: C.accent, align: 'center', alpha: tw(t, 3.8, 0.4) });
    [0, 1].forEach((q) => {
      const at = 4.4 + q * 0.6;
      const y = LANE_B + q * 64 - 20 + 10;
      const a = tw(t, at, 0.5);
      tag(ctx, COL[3] - 6, y + 4, `問い ${q + 1}`, { font: F.jp(700, 15), h: 26, padX: 10, fill: C.blueSoft, color: C.blue, alpha: a });
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      ctx.lineWidth = 2;
      arrow(ctx, COL[3] + 76, y + 17, COL[4] - 10, y + 17, inOutCubic(seg(t, at, at + 0.4)), 10);
      ctx.restore();
      box(ctx, COL[4], y - 10, '答え', C.ink, '#fff', tw(t, at + 0.4, 0.4), false, 40);
    });
    // answers go back into the wiki
    const back = tw(t, 5.4, 0.6);
    if (back > 0) {
      ctx.save();
      ctx.globalAlpha = back;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(COL[4] + BOX.w / 2, LANE_B + 116);
      ctx.lineTo(COL[4] + BOX.w / 2, LANE_B + 140);
      ctx.lineTo(COL[2] + BOX.w / 2, LANE_B + 140);
      ctx.lineTo(COL[2] + BOX.w / 2, LANE_B + BOX.h + 8);
      ctx.stroke();
      ctx.restore();
      text(ctx, 'よい答えは頁に戻す', (COL[2] + COL[4] + BOX.w) / 2, LANE_B + 166, { font: F.jp(700, 16), color: C.accent, align: 'center', alpha: back });
    }
    ctx.restore();

    // ——— the analogy
    const an = tw(t, 6.0, 0.6);
    if (an > 0) {
      const y = 652;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 52, (W - M.l - M.r) * outExpo(an), 2);
      text(ctx, 'Karpathy のたとえ（gist「llm-wiki.md」）', M.l, y - 16, { font: F.jp(700, 19), color: C.ink, alpha: an });
      [['Obsidian', 'IDE'], ['LLM', 'プログラマー'], ['wiki', 'コードベース']].forEach(([a, b], i) => {
        const p = tw(t, 6.4 + i * 0.5, 0.5);
        const x = M.l + i * 470;
        tag(ctx, x, y + 6, a, { font: F.sans(700, 22), h: 44, padX: 18, fill: C.ink, color: '#fff', alpha: p });
        text(ctx, '→', x + 150, y + 38, { font: F.sans(500, 26), color: C.muted, alpha: p });
        tag(ctx, x + 190, y + 6, b, { font: F.jp(700, 21), h: 44, padX: 18, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: p });
      });
    }

    // ——— earlier ways, and the catch
    const pr = tw(t, 11.2, 0.6);
    if (pr > 0) {
      const y = 780;
      [['2024 年', 'GraphRAG', '索引を作るときに、グラフと要約を作る'], ['2025 年', 'DeepWiki', 'GitHub のリポジトリを、説明の頁にまとめる']].forEach(([when, who, what], i) => {
        const a = tw(t, 11.4 + i * 0.3, 0.5);
        const x = M.l + i * 560;
        const w = text(ctx, when, x, y, { font: F.cond(700, 22), color: C.ink, alpha: a });
        const w2 = text(ctx, who, x + w + 12, y, { font: F.sans(600, 21), color: C.ink, alpha: a });
        text(ctx, what, x + w + w2 + 26, y, { font: F.jp(400, 17), color: C.ink2, alpha: a });
      });
      text(ctx, '資料が変わったら、頁も直す', W - M.r, y, { font: F.jp(700, 19), color: C.red, align: 'right', alpha: tw(t, 12.6, 0.5) });
    }

    source(ctx, 'Karpathy（2026-04-04）、Edge ほか（2024）、Cognition（2025-04-25）', tw(t, 6.0, 0.5));
  },
});

// A labelled box. Draws nothing until a > 0.
function box(ctx, x, y, s, fill, color, a, hot = false, h = BOX.h) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, a);
  rr(ctx, x, y, BOX.w, h, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = hot ? C.accent : C.ink2;
  ctx.lineWidth = hot ? 3 : 1.5;
  ctx.stroke();
  ctx.restore();
  text(ctx, s, x + BOX.w / 2, y + h / 2 + 1, { font: F.jp(700, 19), color, align: 'center', base: 'middle', alpha: Math.min(1, a) });
}

// A row of steps with arrows between them, drawn in from `at`; the answer box fades unless kept.
function flowRow(ctx, t, at, xs, y, labels, first) {
  labels.forEach((s, i) => {
    const p = tw(t, at + i * 0.35, 0.4);
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.strokeStyle = C.ink2;
    ctx.fillStyle = C.ink2;
    ctx.lineWidth = 2;
    arrow(ctx, xs[i] + (i === 0 ? 0 : BOX.w) + 10, y, xs[i + 1] - 10, y, inOutCubic(seg(t, at + i * 0.35, at + i * 0.35 + 0.3)), 10);
    ctx.restore();
    const last = i === labels.length - 1;
    const fade = last ? 1 - 0.65 * tw(t, at + 1.6, 0.6) : 1;
    box(ctx, xs[i + 1], y - 20, s, last ? C.ink : '#fff', last ? '#fff' : C.ink, p * fade, false, 40);
  });
}
