// Ingest: a new source goes into raw/, the model reads it once and works it into the wiki —
// a new page, updates to the related pages, new links — then fixes the index and appends to
// the log. Karpathy's example says one source may touch 10–15 pages; this example touches five.
// The source, pages and calls are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { mix, BASE, llmBlock, appFrame, toolBox, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge } from '../lib/rig.js';
import { WIDE, wikiFolder, pageAt, rawAt, fileAt, P, LINKS, BASE_LINKS } from '../lib/wiki.js';
import { text } from '../../../src/kit/draw.js';
import { tw, seg, outBack } from '../../../src/kit/ease.js';

const L = mix(BASE, WIDE, 1);
const ENTRIES = [
  { role: 'user', text: 'Lewis 2020 を raw/ に入れた。取り込んで。' },
  { role: 'assistant', kind: 'call', text: 'read  raw/Lewis 2020' },
  { role: 'result', kind: 'data', text: 'Retrieval-Augmented Generation …' },
  { role: 'assistant', kind: 'call', text: 'write wiki/RAG.md（新しい頁）\nedit  wiki/検索.md\nedit  wiki/幻覚.md\nedit  wiki/年表.md\nedit  wiki/コンテキスト.md\nedit  index.md\nappend log.md' },
  { role: 'assistant', text: '1 つの資料で、5 頁と索引を直しました。' },
];
const T = { raw: 0.6, user: 1.0, read: 1.6, call1: 2.2, out1: 2.6, back1: 3.2, res: 3.6, read2: 4.0, call2: 4.8, writes: 5.6, index: 10.0, log: 10.5, answer: 11.4 };
// the pages written in turn, from T.writes, 0.8 s apart
const WRITES = ['RAG', '検索', '幻覚', '年表', 'コンテキスト'].map((n) => P[n]);
const NEW_LINKS = [9, 10, 11, 12]; // RAG's links in LINKS

export default clip({
  id: 'ingest',
  title: '取り込む',
  kicker: 'ingest',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: '新しい資料を raw/ に入れて、取り込みを頼む。\nモデルは資料を一度読み、何をどこに書くかを決める。' },
    { at: 5.8, to: 11.2, text: '新しい頁を作り、関係する頁を書き直し、リンクを足す。\nKarpathy の例では、1 つの資料で 10〜15 頁に手が入る。' },
    { at: 11.4, to: 18, text: '最後に index.md と log.md を直す。\n取り込んだ資料の中身は、関係する頁に書き込まれて残る。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 26, gap: 16, mono: F.mono(500, 16), lhMono: 26 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    appFrame(ctx, L, base, { name: 'ハーネス' });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base);
    channel(ctx, L.call, base, { label: '読む・書く' });
    channel(ctx, L.back, base, { label: '中身' });

    // ——— the document
    const appear = [T.user, T.call1 + 0.4, T.res, T.call2 + 0.4, T.answer];
    E.forEach((e, i) => docEntry(ctx, e, tw(t, appear[i], 0.4), { chars: i === 3 ? seg(t, T.call2 + 0.4, T.log + 0.2) : i === 4 ? seg(t, T.answer, T.answer + 0.8) : 1 }));
    sweep(ctx, L, seg(t, T.read, T.read + 0.6), docEnd(E, 1));
    send(ctx, L.read, seg(t, T.read + 0.1, T.read + 0.6), '', 'doc');
    send(ctx, L.write, seg(t, T.call1 - 0.3, T.call1 + 0.2), '呼び出し', 'call');
    sweep(ctx, L, seg(t, T.read2, T.read2 + 0.6), docEnd(E, 3));
    send(ctx, L.read, seg(t, T.read2 + 0.1, T.read2 + 0.6), '', 'doc');
    send(ctx, L.write, seg(t, T.call2 - 0.3, T.call2 + 0.2), '呼び出し', 'call');
    send(ctx, L.write, seg(t, T.answer - 0.4, T.answer + 0.1), '答え', 'text');

    // ——— the folder
    const r3 = rawAt(L.tool, 3);
    flow(ctx, [[E[1].tx + 200, E[1].y + 16], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [r3.x + r3.w / 2, r3.y + r3.h]], seg(t, T.out1, T.back1), 'read', 'call');
    flow(ctx, [[r3.x + r3.w / 2, r3.y + r3.h], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [E[2].tx + 200, E[2].y + 16]], seg(t, T.back1, T.res), '資料', 'data');
    const wAt = (k) => T.writes + k * 0.8;
    const page = Array.from({ length: 12 }, (_, i) => (i === P['RAG'] ? tw(t, wAt(0), 0.5, (p) => outBack(p, 1.8)) : undefined));
    const pageLit = Array.from({ length: 12 }, (_, i) => {
      const k = WRITES.indexOf(i);
      // a pulse while written, then the page stays marked as changed
      return k < 0 ? 0 : Math.max(Math.sin(Math.PI * seg(t, wAt(k), wAt(k) + 1.0)), t > wAt(k) + 0.5 ? 0.6 : 0);
    });
    const link = LINKS.map((_, k) => (k < BASE_LINKS ? 1 : NEW_LINKS.includes(k) ? tw(t, wAt(NEW_LINKS.indexOf(k) + 1), 0.6) : 0));
    WRITES.forEach((i, k) => {
      const p = pageAt(L.tool, i);
      flow(ctx, [[E[3].tx + 240, E[3].y + 16 + k * 26], [L.call.x1, L.call.y + 8], [L.call.x2, L.call.y + 8], [p.x, p.y]], seg(t, wAt(k) - 0.5, wAt(k)), k === 0 ? 'write' : 'edit', 'call');
    });
    const fi = fileAt(L.tool, 1);
    const fl = fileAt(L.tool, 2);
    flow(ctx, [[E[3].tx + 240, E[3].y + 16 + 5 * 26], [L.call.x1, L.call.y + 8], [L.call.x2, L.call.y + 8], [fi.x + fi.w / 2, fi.y]], seg(t, T.index - 0.5, T.index), 'edit', 'call');
    flow(ctx, [[E[3].tx + 240, E[3].y + 16 + 6 * 26], [L.call.x1, L.call.y + 8], [L.call.x2, L.call.y + 8], [fl.x + fl.w / 2, fl.y]], seg(t, T.log - 0.5, T.log), 'append', 'call');
    const raw = [1, 1, 1, tw(t, T.raw, 0.5, (p) => outBack(p, 1.6))];
    const rawLit = t > T.out1 && t < T.res + 0.6 ? 3 : -1;
    const fileLit = [0, Math.sin(Math.PI * seg(t, T.index, T.index + 1.2)), Math.sin(Math.PI * seg(t, T.log, T.log + 1.2))];
    toolBox(ctx, L, base, {
      solid: 1,
      label: 'ツールの位置',
      draw: (cx, b, a) => wikiFolder(cx, b, a, { raw, rawLit, page, pageLit, link, file: fileLit, logAdd: tw(t, T.log, 0.3) * (1 - tw(t, T.log + 1.6, 0.4)) }),
    });

    // ——— the model, and the count of what was touched
    const glow = Math.max(seg(t, T.read + 0.4, T.read + 0.6) * (1 - seg(t, T.call1, T.call1 + 0.2)), seg(t, T.read2 + 0.4, T.read2 + 0.6) * (1 - seg(t, T.call2 + 0.2, T.call2 + 0.4)));
    llmBlock(ctx, L, base, { glow });
    stopBadge(ctx, L, tw(t, T.call2 + 0.2, 0.3, (p) => outBack(p, 1.6)) * (1 - tw(t, T.answer - 0.4, 0.3)), 'tool_use');
    stopBadge(ctx, L, tw(t, T.answer + 0.8, 0.3, (p) => outBack(p, 1.6)), 'end_turn', false);
    const done = WRITES.filter((_, k) => t >= wAt(k)).length;
    const ca = tw(t, T.writes, 0.5);
    const x = L.llm.x;
    const y = L.llm.y + L.llm.h + 70;
    text(ctx, '1 つの資料で直した頁', x, y, { font: F.jp(700, 18), color: C.ink, alpha: ca });
    text(ctx, `${done}`, x, y + 64, { font: F.cond(700, 64), color: C.accent, alpha: ca });
    text(ctx, '頁 ＋ 索引と記録', x + 44, y + 60, { font: F.jp(500, 18), color: C.ink2, alpha: ca });
    text(ctx, 'Karpathy の例では 10〜15 頁', x, y + 100, { font: F.jp(500, 16), color: C.muted, alpha: tw(t, 6.4, 0.5) });

    example(ctx, M.l, 818, tw(t, 1.2, 0.5), '資料・頁・呼び出しは説明のための例');
    source(ctx, 'Karpathy、llm-wiki.md（2026-04-04）の Operations', tw(t, 6.4, 0.5));
  },
});
