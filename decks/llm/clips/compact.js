// Keeping a long session inside the window: the document's entries stack up to the window's
// limit; the harness first clears old tool results, then folds the earlier part into a summary.
// Rules that must survive go in a file read at the start of every session. The session and the
// sizes are an example; the release dates are facts.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, toolList, channel, ROLE } from '../lib/rig.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic } from '../../../src/kit/ease.js';

const L = layout();
// [kind, label, height]; kind is a ROLE name, or 'pin' for the instruction file
const BLOCKS = [
  ['pin', 'CLAUDE.md：決まりと手順', 46],
  ['user', 'ログインの不具合を直して', 34],
  ['call', 'grep -rn "login" src/', 30],
  ['result', '検索結果 38 行', 64],
  ['call', 'read login.ts', 30],
  ['result', 'ファイル 240 行', 96],
  ['assistant', '期限切れの見落としを見つけた', 34],
  ['call', 'npm test', 30],
  ['result', 'テストの出力 180 行', 88],
  ['call', 'read session.ts', 30],
  ['result', 'ファイル 310 行', 104],
  ['call', 'edit session.ts', 30],
  ['result', '1 か所を書き換えた', 30],
  ['call', 'npm test', 30],
  ['result', 'テストの出力 172 行', 84],
];
const GAP = 6;
const PLACE = 26; // a cleared result keeps a one-line placeholder
const CLEARED = [3, 5, 8];
const FOLD = [1, 10]; // entries folded into the summary, inclusive
const SUMMARY_H = 72;
const appearAt = (i) => (i === 0 ? 0.4 : i <= 10 ? 0.6 + i * 0.42 : 7.1 + (i - 11) * 0.42);
const CLEAR = 5.9;
const COMPACT = 9.3;
const FACT = 11.6;

export default clip({
  id: 'compact',
  title: '窓に収める',
  kicker: 'コンパクション',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'セッションが長くなると、文書が\nコンテクストウィンドウに入りきらなくなる。' },
    { at: 5.8, to: 11.4, text: 'そこでハーネスは、古いツールの結果を消したり、\nそれまでの流れを**要約**したりして、窓に収める。' },
    { at: 11.6, to: 18, text: '変わらない決まりや手順は、CLAUDE.md や AGENTS.md に書き、\nセッションの始めに読ませる。' },
  ],

  draw(ctx, t) {
    const base = tw(t, 0, 0.5);
    appFrame(ctx, L, base, { name: 'ハーネス', note: 'セッションの文書を、窓に収める', noteAlpha: tw(t, CLEAR - 0.2, 0.5) });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base);
    channel(ctx, L.call, base);
    channel(ctx, L.back, base);
    llmBlock(ctx, L, base, { glow: t < COMPACT + 1.5 ? 0.6 : 0 });
    toolBox(ctx, L, base, { draw: toolList(['bash', 'read', 'edit']) });

    // ——— the stack of entries against the window's limit
    const d = L.doc;
    const x = d.x + 18;
    const w = d.w - 200;
    const limit = d.y + d.h - 34;
    const clear = inOutCubic(seg(t, CLEAR, CLEAR + 1.0));
    const fold = inOutCubic(seg(t, COMPACT, COMPACT + 1.1));
    // positions before folding; the folded range then shrinks toward its top as the summary grows
    let y = d.y + 16;
    let foldTop = 0;
    const placed = BLOCKS.map(([kind, label, h0], i) => {
      const a = tw(t, appearAt(i), 0.3);
      let h = h0 * Math.min(1, a * 1.4);
      if (CLEARED.includes(i) && a > 0) h = lerp(h, PLACE, clear);
      if (i === FOLD[0]) foldTop = y;
      const out = { kind, label, y, h, a, cleared: CLEARED.includes(i) ? clear : 0, fold: i >= FOLD[0] && i <= FOLD[1] };
      y += a > 0 ? h + GAP : 0;
      return out;
    });
    const foldEnd = placed[FOLD[1]].y + placed[FOLD[1]].h + GAP;
    const shift = (foldEnd - foldTop) - lerp(foldEnd - foldTop, SUMMARY_H + GAP, fold);
    placed.forEach((b, i) => {
      if (b.fold) {
        b.y = foldTop + (b.y - foldTop) * (1 - fold);
        b.h *= 1 - fold;
        b.a *= 1 - fold;
      } else if (i > FOLD[1]) b.y -= shift;
    });
    y -= placed.some((b, i) => i > FOLD[1] && b.a > 0) || fold > 0 ? shift : 0;
    const bottom = y;
    ctx.save();
    ctx.beginPath();
    ctx.rect(d.x, d.y, d.w, d.h);
    ctx.clip();
    placed.forEach((b) => {
      if (b.a <= 0.01 || b.h < 2) return;
      block(ctx, x, b.y, w, b.h, b, b.a);
    });
    // the summary that replaces the folded part
    if (fold > 0) {
      const sy = foldTop;
      ctx.save();
      ctx.globalAlpha = fold;
      rr(ctx, x, sy, w, SUMMARY_H, 8);
      ctx.fillStyle = C.accentSoft;
      ctx.fill();
      ctx.fillStyle = C.accent;
      ctx.fillRect(x, sy + 8, 4, SUMMARY_H - 16);
      ctx.restore();
      tag(ctx, x + 14, sy + 10, '要約', { font: F.jp(700, 14), h: 24, padX: 8, r: 5, fill: C.accent, color: '#fff', alpha: fold });
      text(ctx, 'ここまで：原因の 1 つめは直した。', x + 74, sy + 28, { font: F.jp(500, 16), color: C.ink, alpha: fold });
      text(ctx, '2 つめは session.ts にある。', x + 74, sy + 54, { font: F.jp(500, 16), color: C.ink, alpha: fold });
    }
    ctx.restore();

    // the limit, red while the stack presses against it
    const over = bottom > limit - 4 ? 1 : 0;
    ctx.save();
    ctx.globalAlpha = base;
    ctx.strokeStyle = over ? C.red : C.accent;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.moveTo(d.x + 10, limit);
    ctx.lineTo(d.x + d.w - 10, limit);
    ctx.stroke();
    ctx.restore();
    text(ctx, over ? 'あふれそう' : 'コンテクストウィンドウの上限', d.x + d.w - 18, limit + 24, { font: F.jp(700, 16), color: over ? C.red : C.accent, align: 'right', alpha: base });

    // the pinned file, called out at the end
    const pa = tw(t, FACT - 0.2, 0.5);
    if (pa > 0) {
      const p = placed[0];
      ctx.save();
      ctx.globalAlpha = pa;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      rr(ctx, x - 4, p.y - 4, w + 8, p.h + 8, 10);
      ctx.stroke();
      ctx.restore();
    }

    // ——— the three ways, listed as they happen
    const lx = L.tool.x;
    const ly = L.tool.y + L.tool.h + 50;
    text(ctx, '窓に収める方法', lx, ly, { font: F.jp(700, 18), color: C.ink, alpha: tw(t, CLEAR, 0.5) });
    [
      ['①', '古いツールの結果を消す', '中身を［省略］に置き換える', CLEAR, C.ink2],
      ['②', 'それまでを要約する', '要点だけを残して続ける', COMPACT, C.accent],
      ['③', '決まりはファイルに書く', 'セッションの始めに読む', FACT - 0.2, C.blue],
    ].forEach(([n, head, sub, at, col], i) => {
      const a = tw(t, at, 0.5);
      const yy = ly + 38 + i * 56;
      text(ctx, n, lx, yy, { font: F.jp(700, 18), color: col, alpha: a });
      text(ctx, head, lx + 28, yy, { font: F.jp(700, 18), color: col, alpha: a });
      text(ctx, sub, lx + 28, yy + 24, { font: F.jp(400, 15), color: C.ink2, alpha: a });
    });

    // ——— when these became features
    const f = tw(t, FACT, 0.6);
    if (f > 0) {
      const fx = L.llm.x;
      const fy = L.llm.y + L.llm.h + 56;
      [
        ['2025 年 8 月', 'AGENTS.md を共通の形式に'],
        ['2025 年 9 月 29 日', 'Claude API に結果の消去と\nメモのツール（公開ベータ）'],
        ['2025 年 12 月 11 日', 'OpenAI の API に要約の機能'],
      ].forEach(([date, what], i) => {
        const a = tw(t, FACT + i * 0.25, 0.5);
        const yy = fy + [0, 58, 140][i];
        text(ctx, date, fx, yy, { font: F.jp(700, 16), color: C.ink, alpha: a });
        what.split('\n').forEach((s, j) => text(ctx, s, fx, yy + 24 + j * 22, { font: F.jp(500, 15), color: C.ink2, alpha: a }));
      });
    }
    source(ctx, 'agents.md、Anthropic（2025-09-29）、OpenAI（2025-12-11）', f);
    example(ctx, M.l, 818, tw(t, 1.0, 0.5), 'セッションと大きさは説明のための例');
  },
});

// One entry of the stack: a tinted bar with its mark and a short label, or a placeholder once
// its content has been cleared.
function block(ctx, x, y, w, h, b, a) {
  const { kind, label, cleared } = b;
  const pin = kind === 'pin';
  const role = pin ? null : ROLE[kind === 'call' ? 'assistant' : kind];
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, y, w, h, 7);
  ctx.fillStyle = pin ? C.blueSoft : kind === 'result' ? (cleared > 0.5 ? '#f0eee8' : '#e3f1e7') : kind === 'call' ? C.accentSoft : '#f4f2ec';
  ctx.fill();
  if (h > 20) {
    if (pin) text(ctx, label, x + 14, y + h / 2 + 6, { font: F.mono(600, 16), color: C.blue });
    else {
      tag(ctx, x + 10, y + (Math.min(h, 34) - 24) / 2, role.name, { font: F.jp(700, 12), h: 22, padX: 7, r: 5, fill: role.fill, color: role.color });
      const s = kind === 'result' && cleared > 0.5 ? '［古いツールの結果を省略］' : label;
      text(ctx, s, x + 120, y + Math.min(h, 34) / 2 + 6, { font: kind === 'call' || (kind === 'result' && cleared <= 0.5) ? F.mono(500, 14) : F.jp(500, 15), color: cleared > 0.5 ? C.muted : C.ink });
    }
  }
  ctx.restore();
}
