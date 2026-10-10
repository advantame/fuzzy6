// Three lessons from OpenAI's harness-engineering report (2026-02-11), each with its words:
// AGENTS.md as a short map into the detailed docs, rules checked by linters whose errors say
// how to fix them, and a failure read as a missing capability to add to the environment. The
// pictures (file names, the lint rule, the missing tool) are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { ROLE } from '../lib/rig.js';
import { text, rr, arrow, circle, measure } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const PW = 442;
const PX = [M.l, M.l + PW + 41, M.l + 2 * (PW + 41)];
const TOP = 150;
const AT = [0.6, 6.0, 11.4];
const LESSONS = [
  { title: '地図を渡す', quote: '“map, not a 1,000-page instruction manual”', note: '約 100 行の入口から、詳しい文書へ案内する' },
  { title: '直し方を添える', quote: '“inject remediation instructions into agent context”', note: 'linter やテストの文に、直し方を書いておく' },
  { title: '足りないものを足す', quote: '“what capability is missing”', note: '失敗したら、環境に足りないものを探して足す' },
];

export default clip({
  id: 'maplessons',
  title: '地図を渡す',
  kicker: '三つの教訓',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'その報告から、教訓を三つ。AGENTS.md は長い手引きにせず、\n約 100 行の地図にして、詳しい文書へ案内する。' },
    { at: 6.0, to: 11.2, text: '決まりは、linter やテストで機械的に確かめる。\nエラーの文に直し方があれば、エージェントはそれを読んで直す。' },
    { at: 11.4, to: 18, text: '失敗したら、何の能力が足りないのかを問う。\n足りないツール、文書、制約を、環境のほうに足す。' },
  ],

  draw(ctx, t) {
    ctx.save();
    ctx.translate(0, 44);
    LESSONS.forEach((l, i) => {
      const a = tw(t, AT[i], 0.5);
      if (a <= 0) return;
      const x = PX[i];
      tag(ctx, x, TOP - 30, `${i + 1}`, { font: F.cond(700, 22), h: 36, padX: 13, fill: C.accent, color: '#fff', alpha: a });
      text(ctx, l.title, x + 50, TOP - 3, { font: F.jp(700, 26), color: C.ink, alpha: a });
      const qa = tw(t, AT[i] + 3.0, 0.6);
      text(ctx, l.quote, x, 628, { font: F.sans(500, 17), color: C.ink2, alpha: qa });
      text(ctx, l.note, x, 662, { font: F.jp(700, 19), color: C.ink, alpha: qa });
    });
    mapPanel(ctx, t, PX[0]);
    lintPanel(ctx, t, PX[1]);
    missingPanel(ctx, t, PX[2]);
    ctx.restore();

    example(ctx, M.l, 818, tw(t, 1.2, 0.5), 'ファイル名、決まり、足したツールは説明のための例');
    source(ctx, 'OpenAI、Ryan Lopopolo「Harness engineering」（2026-02-11）', tw(t, 0.6, 0.5));
  },
});

// 1. A thousand-page manual gives way to a short AGENTS.md that points into docs/.
function mapPanel(ctx, t, x0) {
  const at = AT[0];
  const book = tw(t, at + 0.3, 0.5);
  const recede = lerp(1, 0.28, inOutCubic(seg(t, at + 1.6, at + 2.2)));
  if (book > 0) {
    ctx.save();
    ctx.globalAlpha = book * recede;
    rr(ctx, x0 + 10, 214, 132, 300, 8);
    ctx.fillStyle = C.ink2;
    ctx.fill();
    ctx.fillStyle = C.panel;
    for (let k = 0; k < 26; k++) ctx.fillRect(x0 + 132, 222 + k * 11, 6, 2);
    ctx.restore();
    // the label stays readable once the book has receded
    const lit = (recede - 0.28) / 0.72;
    [[C.paper, lit], [C.ink2, 1 - lit]].forEach(([color, k]) => {
      text(ctx, '手引き', x0 + 76, 330, { font: F.jp(700, 24), color, align: 'center', alpha: book * k });
      text(ctx, '1,000 ページ', x0 + 76, 362, { font: F.jp(500, 18), color, align: 'center', alpha: book * k });
    });
  }
  // the map
  const m = tw(t, at + 1.8, 0.5, (p) => outBack(p, 1.6));
  if (m <= 0) return;
  const mx = x0 + 176;
  const my = 300;
  ctx.save();
  ctx.globalAlpha = Math.min(1, m);
  rr(ctx, mx, my, 116, 150, 10);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = C.rule;
  for (let k = 0; k < 7; k++) ctx.fillRect(mx + 14, my + 44 + k * 13, [70, 84, 56, 80, 64, 76, 44][k], 5);
  ctx.restore();
  text(ctx, 'AGENTS.md', mx + 58, my + 28, { font: F.mono(600, 15), color: C.ink, align: 'center', alpha: Math.min(1, m) });
  text(ctx, '約 100 行', mx + 58, my + 180, { font: F.jp(700, 17), color: C.accent, align: 'center', alpha: Math.min(1, m) });
  // pointing into the detailed docs
  const docs = ['設計.md', '決まり.md', '計画.md'];
  const dx = x0 + PW - 112;
  text(ctx, 'docs/', dx, 224, { font: F.mono(600, 15), color: C.ink2, alpha: tw(t, at + 2.4, 0.4) });
  docs.forEach((s, k) => {
    const p = tw(t, at + 2.5 + k * 0.25, 0.4);
    if (p <= 0) return;
    const y = 240 + k * 96;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.strokeStyle = C.accent;
    ctx.fillStyle = C.accent;
    ctx.lineWidth = 2;
    arrow(ctx, mx + 124, my + 75, dx - 10, y + 34, inOutCubic(p), 10);
    rr(ctx, dx, y, 112, 68, 8);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = C.rule;
    for (let r = 0; r < 3; r++) ctx.fillRect(dx + 12, y + 36 + r * 9, 84 - r * 18, 4);
    ctx.restore();
    text(ctx, s, dx + 12, y + 24, { font: F.jp(700, 14), color: C.ink, alpha: p });
  });
}

// 2. A lint error, returned as a tool result, carries how to fix it; the next edit follows it.
function lintPanel(ctx, t, x0) {
  const at = AT[1];
  const a = tw(t, at + 0.2, 0.5);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x0, 186, PW, 330, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  const rows = [
    { role: 'assistant', kind: 'call', lines: ['edit: ui/page.ts'], at: at + 0.5 },
    { role: 'result', kind: 'data', lines: ['lint: ui/ から db/ を直接呼んでいる', '直し方：service/ を通す（docs/層.md）'], at: at + 1.2, fix: 1 },
    { role: 'assistant', kind: 'call', lines: ['edit: ui/page.ts（直し方どおり）'], at: at + 2.6 },
    { role: 'result', kind: 'data', lines: ['lint: ok'], at: at + 3.3, ok: true },
  ];
  let y = 206;
  rows.forEach((r) => {
    const h = 14 + r.lines.length * 26;
    const p = tw(t, r.at, 0.4);
    if (p > 0) {
      roleTag(ctx, x0 + 16, y + 4, r.role, p);
      const bx = x0 + 120;
      const bw = PW - 120 - 16;
      ctx.save();
      ctx.globalAlpha = p;
      rr(ctx, bx, y, bw, h, 8);
      ctx.fillStyle = r.kind === 'call' ? C.accentSoft : '#eef6f0';
      ctx.fill();
      ctx.fillStyle = r.kind === 'call' ? C.accent : C.green;
      ctx.fillRect(bx, y + 5, 4, h - 10);
      if (r.fix != null) {
        // the remediation line, marked
        const mk = outExpo(seg(t, r.at + 0.6, r.at + 1.2));
        ctx.fillStyle = '#ffe9a8';
        ctx.fillRect(bx + 10, y + 7 + r.fix * 26 + 4, (bw - 20) * mk, 22);
      }
      ctx.restore();
      r.lines.forEach((s, k) => {
        const color = r.fix != null && k === 0 ? C.red : C.ink;
        const font = r.fix === k ? F.jp(700, 15) : F.mono(500, 15);
        text(ctx, s, bx + 14, y + 26 + k * 26, { font, color, alpha: p });
      });
    }
    y += h + 14;
  });
  text(ctx, 'モデルの読む文書に、直し方が入る', x0 + 16, 494, { font: F.jp(700, 17), color: C.accent, alpha: tw(t, at + 2.0, 0.5) });
}

// 3. A failure; what is missing; a tool added to the environment; the check passes.
function missingPanel(ctx, t, x0) {
  const at = AT[2];
  const f = tw(t, at + 0.2, 0.5);
  if (f <= 0) return;
  mark(ctx, x0 + 14, 214, false, f);
  text(ctx, '画面の動きを確かめられない', x0 + 36, 220, { font: F.jp(700, 19), color: C.red, alpha: f });
  const q = tw(t, at + 0.8, 0.5);
  ctx.save();
  ctx.globalAlpha = q;
  rr(ctx, x0, 250, PW, 52, 26);
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.restore();
  text(ctx, '何の能力が足りないのか？', x0 + PW / 2, 283, { font: F.jp(700, 20), color: C.paper, align: 'center', alpha: q });
  const slots = [['ツール', 'ブラウザで画面を見るツール'], ['文書', ''], ['制約', '']];
  slots.forEach(([kind, what], k) => {
    const p = tw(t, at + 1.3 + k * 0.2, 0.4);
    if (p <= 0) return;
    const y = 326 + k * 62;
    const filled = what ? tw(t, at + 2.2, 0.5, (s) => outBack(s, 1.6)) : 0;
    ctx.save();
    ctx.globalAlpha = p;
    rr(ctx, x0, y, PW, 48, 10);
    ctx.fillStyle = filled > 0 ? C.accentSoft : '#fff';
    ctx.globalAlpha = p * (filled > 0 ? Math.min(1, filled) : 0.6);
    ctx.fill();
    ctx.globalAlpha = p;
    ctx.setLineDash(filled > 0 ? [] : [8, 7]);
    ctx.strokeStyle = filled > 0 ? C.accent : C.ink2;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    text(ctx, kind, x0 + 18, y + 31, { font: F.jp(700, 18), color: C.ink, alpha: p });
    if (what) text(ctx, what, x0 + 88, y + 31, { font: F.jp(500, 18), color: C.ink, alpha: Math.min(1, filled) });
  });
  const ok = tw(t, at + 3.0, 0.5);
  mark(ctx, x0 + 14, 534, true, ok);
  text(ctx, '次からは、画面を見て確かめられる', x0 + 36, 540, { font: F.jp(700, 19), color: C.green, alpha: ok });
}

// A role mark, as in the document of the tool diagram.
function roleTag(ctx, x, y, role, a) {
  const r = ROLE[role];
  const font = F.jp(700, 13);
  const w = measure(ctx, font, r.name) + 16;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, w, 24, 6);
  ctx.fillStyle = r.fill;
  ctx.fill();
  ctx.restore();
  text(ctx, r.name, x + w / 2, y + 13, { font, color: r.color, align: 'center', base: 'middle', alpha: a });
}

// A drawn verdict: a green check, or a red cross.
function mark(ctx, x, y, ok, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = ok ? C.green : C.red;
  circle(ctx, x, y, 11);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (ok) {
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x - 1, y + 4);
    ctx.lineTo(x + 5.5, y - 4);
  } else {
    ctx.moveTo(x - 4, y - 4);
    ctx.lineTo(x + 4, y + 4);
    ctx.moveTo(x + 4, y - 4);
    ctx.lineTo(x - 4, y + 4);
  }
  ctx.stroke();
  ctx.restore();
}
