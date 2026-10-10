// Same model, two harnesses: the SWE-agent paper ran GPT-4 Turbo on SWE-bench Lite with only a
// shell, and with an interface of its own commands for finding, reading and editing files. The
// harness alone moved the result from 11% to 18%. Comparing models therefore means fixing the
// harness. Numbers from Yang et al. 2024 (v3, Table 1).

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source } from '../lib/parts.js';
import { text, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const PANELS = [
  { x: M.l, label: 'シェルだけ', tools: ['bash'], notes: ['コマンドを 1 つ実行する'], score: 11, at: 1.2 },
  {
    x: 832,
    label: 'SWE-agent',
    tools: ['search_dir', 'open', 'scroll_down', 'edit'],
    notes: ['ファイルを探す', '開いて 100 行を表示', '続きを表示', '直す（構文を確かめる）'],
    score: 18,
    at: 3.4,
  },
];
const PW = 672;
const TOP = 132;
const SCORE = 6.0;
const FAIR = 11.4;
const AXIS = 30; // % at the end of the bar's track

export default clip({
  id: 'scaffold',
  title: 'ハーネスで変わる',
  kicker: '同じモデル、違うハーネス',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: '同じモデルに、違うハーネスを付けて比べた研究がある。\n2024 年の SWE-agent の論文。' },
    { at: 5.8, to: 11.2, text: 'シェルだけを渡すと 11%。ファイルを探す、開く、直すための\n専用のツールをそろえたハーネスでは 18%。' },
    { at: 11.4, to: 18, text: 'モデルの力を比べるときは、ハーネスをそろえる。\n評価されるのは、いつもモデルとハーネスの組み合わせ。' },
  ],

  draw(ctx, t) {
    PANELS.forEach((p, i) => {
      const a = tw(t, p.at - 0.9, 0.6);
      if (a <= 0) return;
      // the panel and its name
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, p.x, TOP, PW, 470, 20);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.restore();
      text(ctx, p.label, p.x + 28, TOP + 46, { font: F.jp(700, 28), color: i === 1 ? C.accent : C.ink, alpha: a });
      text(ctx, 'ハーネス', p.x + PW - 28, TOP + 44, { font: F.jp(500, 18), color: C.muted, align: 'right', alpha: a });
      // the same model in both
      const mx = p.x + 28;
      const my = TOP + 92;
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, mx, my, 196, 140, 18);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, 'GPT-4', mx + 98, my + 64, { font: F.sans(700, 30), color: C.paper, align: 'center', alpha: a });
      text(ctx, 'Turbo', mx + 98, my + 98, { font: F.sans(600, 22), color: '#bdb6a9', align: 'center', alpha: a });
      text(ctx, '同じモデル', mx + 98, my + 176, { font: F.jp(700, 18), color: C.ink2, align: 'center', alpha: tw(t, p.at - 0.4, 0.5) });
      // its tools
      const tx = p.x + 300;
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = a;
      arrow(ctx, mx + 210, my + 70, tx - 14, my + 70, tw(t, p.at - 0.3, 0.5, inOutCubic), 11);
      ctx.globalAlpha = 1;
      if (i === 0) {
        ['ファイルを読むのも、探すのも、', '直すのも、すべてシェルのコマンドで'].forEach((line, j) => {
          text(ctx, line, tx + 4, TOP + 210 + j * 28, { font: F.jp(400, 17), color: C.ink2, alpha: tw(t, p.at + 0.5, 0.5) });
        });
      }
      p.tools.forEach((name, j) => {
        const ta = tw(t, p.at + j * 0.28, 0.45, (q) => outBack(q, 1.5));
        if (ta <= 0) return;
        const y = TOP + 92 + j * 74;
        ctx.save();
        ctx.globalAlpha = Math.min(1, ta);
        rr(ctx, tx, y, PW - 328, 62, 12);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = C.rule;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
        text(ctx, name, tx + 18, y + 27, { font: F.mono(600, 19), color: C.ink, alpha: Math.min(1, ta) });
        text(ctx, p.notes[j], tx + 18, y + 51, { font: F.jp(400, 16), color: C.ink2, alpha: Math.min(1, ta) });
      });
      // the score, on a track from 0 to 30 %
      const s = tw(t, SCORE + i * 0.6, 1.0, inOutCubic);
      const by = TOP + 500;
      text(ctx, 'SWE-bench Lite で解けた割合', p.x, by + 4, { font: F.jp(700, 18), color: C.ink2, alpha: tw(t, SCORE - 0.3, 0.5) });
      ctx.fillStyle = C.rule;
      ctx.globalAlpha = tw(t, SCORE - 0.3, 0.5);
      ctx.fillRect(p.x, by + 24, PW - 214, 14);
      ctx.globalAlpha = 1;
      if (s > 0) {
        ctx.fillStyle = i === 1 ? C.accent : C.ink;
        ctx.fillRect(p.x, by + 24, (PW - 214) * (p.score / AXIS) * s, 14);
        text(ctx, `${Math.round(p.score * s)}%`, p.x + PW, by + 50, { font: F.cond(700, 88), color: i === 1 ? C.accent : C.ink, align: 'right' });
      }
      text(ctx, `0`, p.x, by + 62, { font: F.mono(500, 14), color: C.muted, alpha: tw(t, SCORE - 0.3, 0.5) });
      text(ctx, `${AXIS}%`, p.x + PW - 214, by + 62, { font: F.mono(500, 14), color: C.muted, align: 'right', alpha: tw(t, SCORE - 0.3, 0.5) });
    });
    // the condition the two numbers share
    text(ctx, 'SWE-bench Lite の 300 件、gpt-4-1106-preview、1 回で直せた割合', M.l, TOP + 590, { font: F.jp(400, 17), color: C.muted, alpha: tw(t, SCORE + 0.8, 0.5) });

    // ——— comparing models means fixing the harness
    const f = tw(t, FAIR, 0.6);
    if (f > 0) {
      const y = 792;
      ctx.save();
      ctx.globalAlpha = f;
      rr(ctx, M.l, y - 40, W - M.l - M.r, 64, 12);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, 'モデルを比べるときは、ハーネスをそろえる', M.l + 26, y + 2, { font: F.jp(700, 24), color: C.paper, alpha: f });
      text(ctx, '例：SWE-bench の「Bash Only」表は、全モデルを mini-SWE-agent で動かす', W - M.r - 26, y + 1, { font: F.jp(500, 17), color: '#bdb6a9', align: 'right', alpha: tw(t, FAIR + 0.3, 0.5) });
    }
    source(ctx, 'Yang ほか（2024）SWE-agent, Table 1；swebench.com', tw(t, SCORE, 0.6));
  },
});
