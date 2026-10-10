// Lint: the model reads the whole wiki and looks for what has gone wrong — two pages that
// disagree, a page nothing links to, a concept that is mentioned but has no page — checks the
// raw source, and fixes them. Checking does not make the wiki correct by itself; people still
// read and verify. The findings and fixes are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { mix, BASE, llmBlock, appFrame, toolBox, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge } from '../lib/rig.js';
import { WIDE, wikiFolder, pageAt, rawAt, fileAt, P, LINKS, BASE_LINKS } from '../lib/wiki.js';
import { text, circle, line } from '../../../src/kit/draw.js';
import { tw, seg, outBack } from '../../../src/kit/ease.js';

const L = mix(BASE, WIDE, 1);
const ENTRIES = [
  { role: 'user', text: 'wiki を点検して。' },
  { role: 'assistant', kind: 'call', text: 'read index.md\nread wiki/*.md（11 頁）' },
  { role: 'result', kind: 'data', font: F.jp(500, 18), lh: 29, text: '（11 頁の本文）' },
  { role: 'assistant', text: '見つけたもの：\n・GPT-3 の窓が、2 頁で違う\n・ELIZA に、つながりがない\n・「埋め込み」の頁がない', lh: 32 },
  { role: 'assistant', kind: 'call', text: 'read   raw/Brown 2020\nedit   wiki/年表.md\nedit   wiki/ELIZA.md\nwrite  wiki/埋め込み.md\nappend log.md' },
  { role: 'assistant', text: '3 つ直しました。窓は 2,048 です。' },
];
const T = { user: 0.4, read1: 1.0, call1: 1.6, scan: 2.0, res1: 3.2, read2: 3.6, find: 4.4, call2: 6.8, raw: 7.2, fixConflict: 8.2, fixOrphan: 8.8, fixMissing: 9.4, log: 10.0, answer: 10.8, end: 11.4 };
const FLAGS = [
  { page: P['コンテキスト'], kind: 'conflict', at: 4.8, fix: T.fixConflict },
  { page: P['年表'], kind: 'conflict', at: 4.8, fix: T.fixConflict },
  { page: P['ELIZA'], kind: 'orphan', at: 5.4, fix: T.fixOrphan },
  { page: P['埋め込み'], kind: 'missing', at: 6.0, fix: T.fixMissing },
];
const BUILT_LINKS = [9, 10, 11, 12, 13, 14]; // from ingest and query
const LINT_LINKS = { 15: T.fixOrphan, 16: T.fixMissing, 17: T.fixMissing + 0.2 };
const CHECKS = [['食い違い', T.fixConflict], ['つながりなし', T.fixOrphan], ['頁がない', T.fixMissing]];

export default clip({
  id: 'lint',
  title: '点検する',
  kicker: 'lint',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'ときどき、wiki 全体を点検させる。\n頁どうしの食い違いや、どこにもつながらない頁を探す。' },
    { at: 6.0, to: 11.2, text: '書かれているのに頁がない概念も見つける。\n見つけたものは、元の資料を確かめて直す。' },
    { at: 11.4, to: 18, text: '点検しても、正しさが自動で保証されるわけではない。\n人が読んで、確かめることは残る。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 24, gap: 14, mono: F.mono(500, 16), lhMono: 26 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    appFrame(ctx, L, base, { name: 'ハーネス' });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base);
    channel(ctx, L.call, base, { label: '読む・書く' });
    channel(ctx, L.back, base, { label: '中身' });

    // ——— the document
    const appear = [T.user, T.call1 + 0.4, T.res1, T.find, T.call2 + 0.4, T.answer];
    E.forEach((e, i) => docEntry(ctx, e, tw(t, appear[i], 0.4), { chars: i === 3 ? seg(t, T.find, T.find + 1.8) : i === 4 ? seg(t, T.call2 + 0.4, T.log) : i === 5 ? seg(t, T.answer, T.answer + 0.7) : 1 }));
    [[T.read1, 1], [T.read2, 3]].forEach(([at, n]) => {
      sweep(ctx, L, seg(t, at, at + 0.6), docEnd(E, n));
      send(ctx, L.read, seg(t, at + 0.1, at + 0.6), '', 'doc');
    });
    send(ctx, L.write, seg(t, T.call1 - 0.3, T.call1 + 0.2), '呼び出し', 'call');
    send(ctx, L.write, seg(t, T.find - 0.4, T.find + 0.1), '答え', 'text');
    send(ctx, L.write, seg(t, T.call2 - 0.3, T.call2 + 0.2), '呼び出し', 'call');
    send(ctx, L.write, seg(t, T.answer - 0.4, T.answer + 0.1), '答え', 'text');

    // ——— the folder: everything is read, three problems are flagged, then fixed
    const scan = seg(t, T.scan, T.res1);
    const pageRead = Array.from({ length: 12 }, (_, i) => {
      const k = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11].indexOf(i);
      return k < 0 ? 0 : Math.sin(Math.PI * seg(scan, k / 12, k / 12 + 0.3));
    });
    const r2 = rawAt(L.tool, 2);
    flow(ctx, [[E[1].tx + 150, E[1].y + 16], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [pageAt(L.tool, P['Transformer']).x, pageAt(L.tool, P['Transformer']).y]], seg(t, T.scan - 0.4, T.scan + 0.2), 'read', 'call');
    flow(ctx, [[E[4].tx + 220, E[4].y + 16], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [r2.x + r2.w / 2, r2.y + r2.h]], seg(t, T.raw, T.raw + 0.5), 'read', 'call');
    const fixes = [[P['年表'], T.fixConflict, 'edit'], [P['ELIZA'], T.fixOrphan, 'edit'], [P['埋め込み'], T.fixMissing, 'write']];
    fixes.forEach(([i, at, label], k) => {
      const p = pageAt(L.tool, i);
      flow(ctx, [[E[4].tx + 220, E[4].y + 42 + k * 26], [L.call.x1, L.call.y + 8], [L.call.x2, L.call.y + 8], [p.x, p.y]], seg(t, at - 0.5, at), label, 'call');
    });
    const fl = fileAt(L.tool, 2);
    flow(ctx, [[E[4].tx + 220, E[4].y + 120], [L.call.x1, L.call.y + 8], [L.call.x2, L.call.y + 8], [fl.x + fl.w / 2, fl.y]], seg(t, T.log - 0.5, T.log), 'append', 'call');
    const flags = FLAGS.map((f) => ({ page: f.page, kind: f.kind, a: tw(t, f.at, 0.4) * (1 - tw(t, f.fix, 0.4)) }));
    const pageLit = Array.from({ length: 12 }, (_, i) => {
      const fx = fixes.find(([j]) => j === i);
      return fx ? Math.max(Math.sin(Math.PI * seg(t, fx[1], fx[1] + 1.0)), t > fx[1] + 0.5 ? 0.6 : 0) : 0;
    });
    const page = Array.from({ length: 12 }, (_, i) => (i === P['RAG'] || i === P['RAG と窓'] ? 1 : i === P['埋め込み'] ? tw(t, T.fixMissing, 0.5, (p) => outBack(p, 1.8)) : undefined));
    const link = LINKS.map((_, k) => (k < BASE_LINKS || BUILT_LINKS.includes(k) ? 1 : LINT_LINKS[k] ? tw(t, LINT_LINKS[k], 0.6) : 0));
    toolBox(ctx, L, base, {
      solid: 1,
      label: 'ツールの位置',
      draw: (cx, b, a) => wikiFolder(cx, b, a, {
        raw: [1, 1, 1, 1], rawLit: t > T.raw && t < T.raw + 1.2 ? 2 : -1,
        page, pageRead, pageLit, link, flags,
        file: [0, Math.sin(Math.PI * seg(t, T.scan - 0.4, T.scan + 0.6)), Math.sin(Math.PI * seg(t, T.log, T.log + 1.2))],
        logAdd: tw(t, T.log, 0.3) * (1 - tw(t, T.log + 1.6, 0.4)),
      }),
    });

    // ——— the model, and the checklist
    const glow = Math.max(seg(t, T.read1 + 0.4, T.read1 + 0.6) * (1 - seg(t, T.call1, T.call1 + 0.2)), seg(t, T.read2 + 0.4, T.read2 + 0.6) * (1 - seg(t, T.call2, T.call2 + 0.2)));
    llmBlock(ctx, L, base, { glow });
    stopBadge(ctx, L, tw(t, T.call2 + 0.2, 0.3, (p) => outBack(p, 1.6)) * (1 - tw(t, T.answer - 0.4, 0.3)), 'tool_use');
    stopBadge(ctx, L, tw(t, T.end, 0.3, (p) => outBack(p, 1.6)), 'end_turn', false);
    const ca = tw(t, 4.8, 0.5);
    const x = L.llm.x;
    const y = L.llm.y + L.llm.h + 64;
    text(ctx, '見つけたもの', x, y, { font: F.jp(700, 18), color: C.ink, alpha: ca });
    CHECKS.forEach(([name, at], i) => {
      const a = tw(t, FLAGS[[0, 2, 3][i]].at, 0.4);
      const ok = tw(t, at, 0.4);
      mark(ctx, x + 8, y + 28 + i * 30, ok > 0.5, a);
      text(ctx, name, x + 26, y + 34 + i * 30, { font: F.jp(500, 18), color: ok > 0.5 ? C.ink2 : C.red, alpha: a });
    });
    text(ctx, '直したあとも、人が確かめる', x, y + 140, { font: F.jp(700, 16), color: C.blue, alpha: tw(t, 11.6, 0.5) });

    example(ctx, M.l, 818, tw(t, 1.2, 0.5), '見つけたものと直し方は説明のための例');
    source(ctx, 'Karpathy、llm-wiki.md（2026-04-04）の Operations', tw(t, 4.8, 0.5));
  },
});

// A checklist mark: a red ring while open, a green disc with a tick once fixed.
function mark(ctx, x, y, ok, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineWidth = 2.5;
  if (ok) {
    ctx.fillStyle = C.green;
    circle(ctx, x, y, 9);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x - 4.5, y);
    ctx.lineTo(x - 1, y + 3.5);
    ctx.lineTo(x + 5, y - 3.5);
    ctx.stroke();
  } else {
    ctx.strokeStyle = C.red;
    circle(ctx, x, y, 8);
    ctx.stroke();
  }
  ctx.restore();
}
