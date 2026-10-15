// The app of chapter 5, renamed: in an agent, the program around the model is its harness.
// Its jobs fill the frame, each pointing back (or ahead) to the clip that shows it; then the
// equation agent = model + harness, and the 2025 renaming of Anthropic's SDK in those words.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { source } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, channel, docLayout, docEntry } from '../lib/rig.js';
import { text, rr, circle, wrap } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const L = layout();
// a session in the background, before the frame is opened up
const ENTRIES = [
  { role: 'user', text: 'テストが通るように直して。' },
  { role: 'assistant', kind: 'call', text: 'bash: pytest' },
  { role: 'result', kind: 'data', text: 'FAILED test_average' },
  { role: 'assistant', kind: 'call', text: 'bash: cat average.py' },
  { role: 'result', kind: 'data', text: 'def average(xs): …' },
];
// the harness's jobs: name, what, the clip that shows it
const JOBS = [
  ['文書を組み立てる', '指示とツールの説明書を、\n文書の頭に置く', '5-2'],
  ['ループを回す', '呼び出しがなくなるまで、\nモデルを呼び続ける', '5-5'],
  ['ツールを実行する', '呼び出しを読み取って実行し、\n結果を文書に足す', '5-4'],
  ['権限を確かめる', '消す・送るなどの操作は、\n人の承認を待つ', '7-7'],
  ['文脈を整える', 'あふれる前に、\n古い結果を消して要約する', '7-5'],
  ['記録して再開する', 'やりとりをファイルに残し、\n続きから始める', '7-4'],
];
// which part of the diagram each job is about: 'doc' | 'loop' | 'tool' | 'gate' | 'file'
const PART = ['doc', 'loop', 'tool', 'gate', 'doc', 'file'];
const FLIP = 1.2;
const CARDS = 2.6;
const TOUR = 5.9;
const STEP = 0.85;
const EQ = 11.3;

export default clip({
  id: 'harness',
  title: 'モデルの周り',
  kicker: 'ハーネス',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'エージェントでは、モデルの周りで働くこのアプリを\n**ハーネス**と呼ぶ。研究では scaffold（足場）とも呼ぶ。' },
    { at: 5.8, to: 11.1, text: 'ループを回し、ツールを動かすだけではない。\n文書を組み立て、権限を確かめ、文脈を整え、記録を残す。' },
    { at: 11.3, to: 18, text: 'エージェントは、モデルとハーネスの組み合わせ。\n2025 年 9 月、Claude Code の SDK は「Agent SDK」になった。' },
  ],

  prepare(ctx) {
    const E = docLayout(ctx, L, ENTRIES, { top: 26, gap: 16 });
    const d = L.doc;
    const gap = 16;
    const w = (d.w - gap * 3) / 2;
    const h = (d.h - gap * 4) / 3;
    const cards = JOBS.map(([name, what, ref], i) => ({
      name,
      ref,
      rows: wrap(ctx, F.jp(400, 18), what, w - 44),
      x: d.x + gap + (i % 2) * (w + gap),
      y: d.y + gap + Math.floor(i / 2) * (h + gap),
      w,
      h,
    }));
    return { E, cards };
  },

  draw(ctx, t, { E, cards }) {
    const base = tw(t, 0, 0.6);
    const flip = inOutCubic(seg(t, FLIP, FLIP + 0.8));
    const open = tw(t, CARDS - 0.3, 0.6);
    // which job is being pointed at, during the tour
    const k = t >= TOUR && t < TOUR + JOBS.length * STEP ? Math.floor((t - TOUR) / STEP) : -1;
    const lit = (part) => (k >= 0 && PART[k] === part ? 1 : 0);

    // ——— the frame, renamed
    appFrame(ctx, L, base, { name: '' });
    const hx = L.app.x + 24;
    const hy = L.app.y + 40;
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.app.x + 10, L.app.y + 8, L.app.w - 20, 46);
    ctx.clip();
    text(ctx, 'アプリ', hx, hy - 30 * flip, { font: F.jp(700, 24), color: C.ink, alpha: base * (1 - flip) });
    text(ctx, 'ハーネス', hx, hy + 30 * (1 - flip), { font: F.jp(700, 24), color: C.accent, alpha: flip });
    ctx.restore();
    text(ctx, 'モデルの周りで働くプログラム', hx + 112, hy - 1, { font: F.jp(500, 18), color: C.ink2, alpha: tw(t, FLIP + 0.7, 0.5) });

    channel(ctx, L.read, base, { hot: lit('loop') > 0 });
    channel(ctx, L.write, base, { hot: lit('loop') > 0 });
    channel(ctx, L.call, base, { hot: lit('tool') > 0 || lit('gate') > 0 });
    channel(ctx, L.back, base, { hot: lit('tool') > 0 });

    // the session behind, fading as the jobs come forward
    E.forEach((e, i) => docEntry(ctx, e, tw(t, 0.2 + i * 0.1, 0.4) * (1 - open)));

    // ——— the jobs
    cards.forEach((c, i) => {
      const a = tw(t, CARDS + i * 0.3, 0.5, (p) => outBack(p, 1.4));
      if (a <= 0) return;
      const on = k === i ? 1 : 0;
      const s = Math.min(1, a);
      ctx.save();
      ctx.globalAlpha = s;
      ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
      ctx.scale(0.92 + 0.08 * s, 0.92 + 0.08 * s);
      ctx.translate(-(c.x + c.w / 2), -(c.y + c.h / 2));
      rr(ctx, c.x, c.y, c.w, c.h, 14);
      ctx.fillStyle = on ? C.accentSoft : C.paper;
      ctx.fill();
      ctx.strokeStyle = on ? C.accent : C.rule;
      ctx.lineWidth = on ? 3 : 1.5;
      ctx.stroke();
      icon(ctx, PART[i] === 'doc' && i === 4 ? 'trim' : PART[i], c.x + 34, c.y + 40, on ? C.accent : C.ink2);
      text(ctx, c.name, c.x + 62, c.y + 48, { font: F.jp(700, 23), color: C.ink });
      c.rows.forEach((r, j) => text(ctx, r, c.x + 22, c.y + 92 + j * 28, { font: F.jp(400, 18), color: C.ink2 }));
      text(ctx, `→ ${c.ref}`, c.x + c.w - 18, c.y + c.h - 18, { font: F.mono(500, 15), color: on ? C.accent : C.muted, align: 'right' });
      ctx.restore();
    });

    // ——— the model and the tool, lit when a job is about them
    llmBlock(ctx, L, base, { glow: lit('loop') });
    toolBox(ctx, L, base, { glow: lit('tool') });
    // a gate on the way to the tool, for permissions
    const g = tw(t, TOUR + 3 * STEP - 0.1, 0.3) * (1 - tw(t, TOUR + 4 * STEP, 0.3));
    if (g > 0) {
      const x = (L.call.x1 + L.call.x2) / 2;
      ctx.save();
      ctx.globalAlpha = g;
      ctx.fillStyle = C.accent;
      circle(ctx, x, L.call.y - 72, 18);
      ctx.fill();
      ctx.restore();
      icon(ctx, 'gate', x, L.call.y - 72, '#fff', g);
    }
    // a file under the frame, for the record
    const fa = tw(t, TOUR + 5 * STEP - 0.1, 0.3) * (1 - tw(t, TOUR + 6 * STEP, 0.3));
    if (fa > 0) {
      const x = L.app.x + L.app.w - 120;
      const y = L.app.y + L.app.h + 12;
      ctx.save();
      ctx.globalAlpha = fa;
      rr(ctx, x, y, 110, 30, 6);
      ctx.fillStyle = C.accent;
      ctx.fill();
      ctx.restore();
      text(ctx, 'session.jsonl', x + 55, y + 21, { font: F.mono(600, 14), color: '#fff', align: 'center', alpha: fa });
    }

    // ——— agent = model + harness
    const q = tw(t, EQ, 0.6);
    if (q > 0) {
      const x = L.llm.x;
      const y = L.llm.y + L.llm.h + 72;
      text(ctx, 'エージェント', x, y, { font: F.jp(700, 30), color: C.ink, alpha: q });
      text(ctx, '＝ モデル', x, y + 46, { font: F.jp(700, 30), color: C.ink, alpha: tw(t, EQ + 0.25, 0.5) });
      text(ctx, '＋ ハーネス', x, y + 92, { font: F.jp(700, 30), color: C.accent, alpha: tw(t, EQ + 0.5, 0.5) });
    }
    // the SDK renamed, in the same words
    const r = tw(t, EQ + 1.0, 0.6);
    if (r > 0) {
      const x = L.tool.x;
      const y = L.tool.y + L.tool.h + 52;
      text(ctx, '2025 年 9 月 29 日', x, y, { font: F.jp(700, 18), color: C.ink, alpha: r });
      ['Claude Code SDK を', 'Claude Agent SDK に改名した'].forEach((s, i) => text(ctx, s, x, y + 30 + i * 25, { font: F.jp(500, 16), color: C.ink2, alpha: r }));
      ['「Claude Code を動かすハーネスは、', '　ほかの多くのエージェントも動かせる」'].forEach((s, i) => text(ctx, s, x, y + 96 + i * 25, { font: F.jp(500, 16), color: C.ink, alpha: tw(t, EQ + 1.3, 0.5) }));
    }
    source(ctx, 'Anthropic（2025-09-29）', r);
  },
});

// Small line icons for the jobs, centred on (x, y).
function icon(ctx, kind, x, y, color, a = 1) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.translate(x, y);
  ctx.beginPath();
  if (kind === 'doc') {
    ctx.rect(-9, -12, 18, 24);
    ctx.moveTo(-4, -5);
    ctx.lineTo(4, -5);
    ctx.moveTo(-4, 1);
    ctx.lineTo(4, 1);
    ctx.moveTo(-4, 7);
    ctx.lineTo(2, 7);
  } else if (kind === 'loop') {
    ctx.arc(0, 0, 11, -Math.PI * 0.35, Math.PI * 1.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7, -12);
    ctx.lineTo(12, -5);
    ctx.lineTo(4, -4);
  } else if (kind === 'tool') {
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    for (let i = 0; i < 6; i++) {
      const r = (i * Math.PI) / 3;
      ctx.moveTo(Math.cos(r) * 8, Math.sin(r) * 8);
      ctx.lineTo(Math.cos(r) * 12, Math.sin(r) * 12);
    }
  } else if (kind === 'gate') {
    ctx.rect(-8, -2, 16, 12);
    ctx.moveTo(-5, -2);
    ctx.arc(0, -4, 5, Math.PI, 0);
    ctx.lineTo(5, -2);
  } else if (kind === 'trim') {
    ctx.moveTo(-11, -8);
    ctx.lineTo(11, -8);
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.moveTo(-3, 8);
    ctx.lineTo(3, 8);
  } else if (kind === 'file') {
    ctx.moveTo(-9, -12);
    ctx.lineTo(4, -12);
    ctx.lineTo(9, -7);
    ctx.lineTo(9, 12);
    ctx.lineTo(-9, 12);
    ctx.closePath();
    ctx.moveTo(-4, 4);
    ctx.lineTo(0, 8);
    ctx.lineTo(4, 4);
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 8);
  }
  ctx.stroke();
  ctx.restore();
}
