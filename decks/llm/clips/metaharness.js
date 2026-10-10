// Searching for a harness (Meta-Harness, Lee et al., arXiv:2603.28052, 2026-03-30). A proposer
// agent (Claude Code with Opus 4.6) reads the code, scores and execution traces of past
// candidates from a filesystem and writes the next harness; the target model's weights stay
// fixed. On Terminal-Bench 2 with Haiku 4.5 the result scored 37.6%, above the hand-built
// harnesses compared (Goose 35.5, Terminus-KIRA 33.7, Terminus 2 28.3); the search and the final
// evaluation used the same 89 tasks. The candidates' scores in the loop are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { text, rr, arrow, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const PROP = { x: M.l, y: 176, w: 260, h: 150 };
const FOLD = { x: 560, y: 112, w: 480, h: 340 };
const EVAL = { x: 1244, y: 176, w: 260, h: 150 };
// one round of the loop: read (except the first), write the candidate, run it, keep the results
const ROUND = [1.4, 3.6, 5.8, 8.0];
const SCORE = [0.38, 0.55, 0.5, 0.78]; // example heights of each candidate's score bar
const BARS = [
  { name: 'Terminus 2', v: 28.3 },
  { name: 'Terminus-KIRA', v: 33.7 },
  { name: 'Goose', v: 35.5 },
  { name: 'Meta-Harness', v: 37.6, hot: true },
];
const RES = 11.4;
const BX = 420;
const BW = 640; // 100 %

export default clip({
  id: 'metaharness',
  title: '探して直す',
  kicker: 'Meta-Harness',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'ハーネスを直す作業そのものを、エージェントに任せる研究もある。\n2026 年 3 月の Meta-Harness。' },
    { at: 6.0, to: 11.2, text: '提案役のエージェントが、過去の候補のコード、点、実行の記録を\nファイルから読み、次のハーネスを書く。モデルの重みは変えない。' },
    { at: 11.4, to: 18, text: 'Haiku 4.5 では 37.6% で、比べた人の手のハーネスを上回った。\nただし、探すときと最後の評価に、同じ 89 題を使っている。' },
  ],

  draw(ctx, t) {
    // ——— the three parts
    box(ctx, PROP, '提案する', ['Claude Code', '＋ Opus 4.6'], tw(t, 0.6, 0.5), C.ink, C.paper);
    box(ctx, EVAL, '動かして測る', ['Haiku 4.5', '重みは変えない'], tw(t, 1.0, 0.5), '#fff', C.ink);
    folder(ctx, t, tw(t, 0.8, 0.5));
    // the four channels, lit by the round in progress
    const la = tw(t, 1.2, 0.5);
    const lit = (a, b, from = 0) => ROUND.slice(from).some((r) => t >= r + a && t < r + b);
    chan(ctx, PROP.x + PROP.w + 12, 226, FOLD.x - 12, 226, '次のハーネスを書く', la, lit(0.3, 0.8), -1);
    chan(ctx, FOLD.x - 12, 290, PROP.x + PROP.w + 12, 290, '過去の候補を読む', la, lit(-0.4, 0.2, 1), 1);
    chan(ctx, FOLD.x + FOLD.w + 12, 226, EVAL.x - 12, 226, '候補を動かす', la, lit(0.8, 1.2), -1);
    chan(ctx, EVAL.x - 12, 290, FOLD.x + FOLD.w + 12, 290, '点と記録を残す', la, lit(1.2, 1.7), 1);
    // the evaluator at work
    ROUND.forEach((r) => {
      const p = seg(t, r + 0.8, r + 1.3);
      if (p <= 0 || p >= 1) return;
      ctx.save();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      const a0 = p * Math.PI * 5;
      ctx.beginPath();
      ctx.arc(EVAL.x + EVAL.w - 30, EVAL.y + 30, 11, a0, a0 + Math.PI * 1.3);
      ctx.stroke();
      ctx.restore();
    });

    // ——— the result
    const ra = tw(t, RES, 0.6);
    if (ra > 0) {
      ctx.save();
      ctx.globalAlpha = ra;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, 504, (W - M.l - M.r) * outExpo(ra), 2);
      ctx.restore();
      text(ctx, 'Terminal-Bench 2 で、Haiku 4.5 を動かしたとき', M.l, 548, { font: F.jp(700, 21), color: C.ink, alpha: ra });
      text(ctx, '人の手のハーネス', M.l, 576, { font: F.jp(500, 16), color: C.muted, alpha: ra });
      BARS.forEach((b, i) => {
        const y = 590 + i * 48;
        const a = tw(t, RES + 0.2 + i * 0.25, 0.4);
        text(ctx, b.name, M.l + 16, y + 26, { font: F.sans(600, 19), color: b.hot ? C.accent : C.ink, alpha: a });
        ctx.save();
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = C.rule;
        ctx.fillRect(BX, y + 8, BW, 24);
        ctx.globalAlpha = a;
        ctx.fillStyle = b.hot ? C.accent : C.ink2;
        ctx.fillRect(BX, y + 8, BW * (b.v / 100) * tw(t, RES + 0.3 + i * 0.25, 0.7, inOutCubic), 24);
        ctx.restore();
        text(ctx, `${b.v}%`, BX + BW * (b.v / 100) + 12, y + 29, { font: F.cond(700, 28), color: b.hot ? C.accent : C.ink, alpha: a });
      });
      // the bracket over the three hand-built ones
      ctx.save();
      ctx.globalAlpha = ra;
      ctx.fillStyle = C.muted;
      ctx.fillRect(M.l, 590, 3, 140);
      ctx.restore();
      const na = tw(t, RES + 1.6, 0.5);
      const nx = 1150;
      text(ctx, '探すときと最後の評価に、', nx, 612, { font: F.jp(700, 18), color: C.red, alpha: na });
      text(ctx, '同じ 89 題を使った', nx, 640, { font: F.jp(700, 18), color: C.red, alpha: na });
      const nb = tw(t, RES + 2.2, 0.5);
      text(ctx, 'Opus 4.6 では 76.4%', nx, 698, { font: F.jp(700, 17), color: C.ink2, alpha: nb });
      text(ctx, '論文の比較では、ForgeCode の 81.8% が上', nx, 726, { font: F.jp(500, 16), color: C.ink2, alpha: nb });
    }

    example(ctx, M.l, 818, tw(t, ROUND[1] + 1.4, 0.5), '候補ごとの点の動きは説明のための例');
    source(ctx, 'Lee ほか「Meta-Harness」arXiv:2603.28052（2026-03-30）Table 7', tw(t, 0.6, 0.5));
  },
});

// A labelled block with one or two lines of notes.
function box(ctx, b, name, notes, a, fill, color) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, b.x, b.y, b.w, b.h, 18);
  ctx.fillStyle = fill;
  ctx.fill();
  if (fill === '#fff') {
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, name, b.x + b.w / 2, b.y + 58, { font: F.jp(700, 28), color, align: 'center', alpha: a });
  notes.forEach((s, i) => text(ctx, s, b.x + b.w / 2, b.y + 96 + i * 26, { font: F.jp(500, 18), color: fill === C.ink ? '#bdb6a9' : C.ink2, align: 'center', alpha: a }));
}

// A channel's arrow with its label above (side −1) or below (1); vermilion while in use.
function chan(ctx, x1, y, x2, _y, label, a, hot, side) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = hot ? C.accent : C.ink2;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = hot ? 3.5 : 2.5;
  arrow(ctx, x1, y, x2, y, 1, 11);
  ctx.restore();
  text(ctx, label, (x1 + x2) / 2, y + (side < 0 ? -16 : 30), { font: F.jp(500, 15), color: hot ? C.accent : C.muted, align: 'center', alpha: a });
}

// The filesystem the proposer reads: one row per candidate — its code, its score, its traces.
function folder(ctx, t, a) {
  if (a <= 0) return;
  const f = FOLD;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, f.x, f.y, f.w, f.h, 16);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.restore();
  text(ctx, 'ファイルに残す', f.x + 22, f.y + 38, { font: F.jp(700, 22), color: C.ink, alpha: a });
  text(ctx, 'すべての候補', f.x + f.w - 22, f.y + 37, { font: F.jp(500, 16), color: C.ink2, align: 'right', alpha: a });
  ROUND.forEach((r, k) => {
    const y = f.y + 62 + k * 66;
    const code = tw(t, r + 0.5, 0.4, (p) => outBack(p, 1.6));
    if (code <= 0) return;
    // being read in a later round
    const read = ROUND.slice(k + 1).some((q) => t >= q - 0.4 && t < q + 0.2);
    ctx.save();
    ctx.globalAlpha = Math.min(1, code);
    rr(ctx, f.x + 14, y, f.w - 28, 54, 10);
    ctx.fillStyle = '#fff';
    ctx.fill();
    if (read) {
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
    text(ctx, `候補 ${k + 1}`, f.x + 30, y + 34, { font: F.jp(700, 17), color: C.ink, alpha: Math.min(1, code) });
    tag(ctx, f.x + 108, y + 12, 'harness.py', { font: F.mono(600, 15), h: 30, padX: 10, fill: C.accentSoft, color: C.accent, alpha: Math.min(1, code) });
    // its score and traces, once it has run
    const res = tw(t, r + 1.4, 0.4);
    if (res <= 0) return;
    const sx = f.x + 250;
    ctx.save();
    ctx.globalAlpha = res;
    ctx.fillStyle = C.rule;
    ctx.fillRect(sx, y + 18, 90, 18);
    ctx.fillStyle = C.green;
    ctx.fillRect(sx, y + 18, 90 * SCORE[k] * res, 18);
    ctx.restore();
    text(ctx, '点', sx - 4, y + 33, { font: F.jp(700, 14), color: C.ink2, align: 'right', alpha: res });
    tag(ctx, f.x + f.w - 104, y + 12, '記録/', { font: F.mono(600, 15), h: 30, padX: 10, fill: '#eef6f0', color: C.green, alpha: res });
  });
}
