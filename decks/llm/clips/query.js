// Query: the same question as 8-2, asked of the wiki. The model reads index.md first, opens only
// the pages it needs, answers with those pages as its sources, and files the good answer back as
// a new page — so the next question can start from it. The index, pages and answer are an
// example; the "about 100 articles" scale is Karpathy's own report.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { mix, BASE, llmBlock, appFrame, toolBox, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge } from '../lib/rig.js';
import { WIDE, wikiFolder, pageAt, fileAt, P, LINKS, BASE_LINKS } from '../lib/wiki.js';
import { text } from '../../../src/kit/draw.js';
import { tw, seg, outBack } from '../../../src/kit/ease.js';

const L = mix(BASE, WIDE, 1);
const JP = F.jp(500, 18);
const ENTRIES = [
  { role: 'user', text: 'RAG と長い窓は、どう使い分ける？' },
  { role: 'assistant', kind: 'call', text: 'read index.md' },
  { role: 'result', kind: 'data', font: JP, lh: 29, text: '・RAG：要る断片を探して読ませる\n・コンテキスト：一度に読める長さ\n・検索、幻覚、年表 … ほか 8 頁' },
  { role: 'assistant', kind: 'call', text: 'read wiki/RAG.md\nread wiki/コンテキスト.md' },
  { role: 'result', kind: 'data', font: JP, lh: 29, text: '（2 頁の本文）' },
  { role: 'assistant', text: '資料が多ければ RAG、少なければ窓に全部。\n出典：[[RAG]] [[コンテキスト]]' },
  { role: 'assistant', kind: 'call', text: 'write  wiki/RAG と窓.md\nappend log.md' },
];
const T = { user: 0.4, read1: 1.0, call1: 1.6, out1: 2.0, back1: 2.6, res1: 3.0, read2: 3.4, call2: 4.2, out2: 4.6, back2: 5.2, res2: 5.6, read3: 6.2, answer: 7.0, call3: 9.0, out3: 9.4, page: 9.9, log: 10.3, end: 11.0 };
const OPENED = [P['RAG'], P['コンテキスト']];
const NEW_LINKS = [13, 14]; // the new page's links in LINKS
const RAG_LINKS = [9, 10, 11, 12]; // written by ingest (8-5)

export default clip({
  id: 'query',
  title: '目録から引く',
  kicker: 'query',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: '質問されると、モデルはまず index.md（目録）を読み、\n答えに要りそうな頁を選ぶ。' },
    { at: 5.8, to: 11.2, text: '選んだ頁だけを開き、その頁を出典にして答える。\n約 100 記事なら、凝った検索なしで回ったと Karpathy は書いた。' },
    { at: 11.4, to: 18, text: 'よい答えは、新しい頁として wiki に書き戻す。\n問いを重ねるほど、wiki が育っていく。' },
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
    const appear = [T.user, T.call1 + 0.4, T.res1, T.call2 + 0.4, T.res2, T.answer, T.call3 + 0.4];
    E.forEach((e, i) => docEntry(ctx, e, tw(t, appear[i], 0.4), { chars: i === 5 ? seg(t, T.answer, T.answer + 1.2) : 1, hot: i === 5 && t > T.end + 0.4 }));
    [[T.read1, 1], [T.read2, 3], [T.read3, 5]].forEach(([at, n]) => {
      sweep(ctx, L, seg(t, at, at + 0.6), docEnd(E, n));
      send(ctx, L.read, seg(t, at + 0.1, at + 0.6), '', 'doc');
    });
    [T.call1, T.call2, T.call3].forEach((at) => send(ctx, L.write, seg(t, at - 0.3, at + 0.2), '呼び出し', 'call'));
    send(ctx, L.write, seg(t, T.answer - 0.4, T.answer + 0.1), '答え', 'text');

    // ——— reads and writes in the folder
    const fi = fileAt(L.tool, 1);
    const fl = fileAt(L.tool, 2);
    flow(ctx, [[E[1].tx + 150, E[1].y + 16], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [fi.x + fi.w / 2, fi.y]], seg(t, T.out1, T.back1), 'read', 'call');
    flow(ctx, [[fi.x + fi.w / 2, fi.y], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [E[2].tx + 240, E[2].y + 16]], seg(t, T.back1, T.res1), '目録', 'data');
    OPENED.forEach((i, k) => {
      const p = pageAt(L.tool, i);
      flow(ctx, [[E[3].tx + 220, E[3].y + 16 + k * 26], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [p.x, p.y]], seg(t, T.out2 + k * 0.1, T.back2), 'read', 'call');
      flow(ctx, [[p.x, p.y], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [E[4].tx + 200, E[4].y + 16]], seg(t, T.back2 + k * 0.1, T.res2), '頁', 'data');
    });
    const np = pageAt(L.tool, P['RAG と窓']);
    flow(ctx, [[E[6].tx + 240, E[6].y + 16], [L.call.x1, L.call.y + 8], [L.call.x2, L.call.y + 8], [np.x, np.y]], seg(t, T.out3, T.page), 'write', 'call');
    flow(ctx, [[E[6].tx + 240, E[6].y + 42], [L.call.x1, L.call.y + 8], [L.call.x2, L.call.y + 8], [fl.x + fl.w / 2, fl.y]], seg(t, T.out3 + 0.2, T.log), 'append', 'call');

    const page = Array.from({ length: 12 }, (_, i) => (i === P['RAG'] ? 1 : i === P['RAG と窓'] ? tw(t, T.page, 0.5, (p) => outBack(p, 1.8)) : undefined));
    const pageRead = Array.from({ length: 12 }, (_, i) => (OPENED.includes(i) ? (t > T.out2 + 0.4 ? 1 : 0) : 0));
    const pageLit = Array.from({ length: 12 }, (_, i) => (i === P['RAG と窓'] ? Math.max(Math.sin(Math.PI * seg(t, T.page, T.page + 1.0)), t > T.page + 0.5 ? 0.6 : 0) : 0));
    const link = LINKS.map((_, k) => (k < BASE_LINKS || RAG_LINKS.includes(k) ? 1 : NEW_LINKS.includes(k) ? tw(t, T.page + 0.2 + NEW_LINKS.indexOf(k) * 0.2, 0.6) : 0));
    const file = [0, t > T.out1 && t < T.res1 + 0.8 ? 1 : 0, Math.sin(Math.PI * seg(t, T.log, T.log + 1.2))];
    toolBox(ctx, L, base, {
      solid: 1,
      label: 'ツールの位置',
      draw: (cx, b, a) => wikiFolder(cx, b, a, { raw: [1, 1, 1, 1], page, pageRead, pageLit, link, file, logAdd: tw(t, T.log, 0.3) * (1 - tw(t, T.log + 1.6, 0.4)) }),
    });

    // ——— the model, and how much it opened
    const glow = Math.max(...[[T.read1, T.call1], [T.read2, T.call2], [T.read3, T.call3]].map(([r, c]) => seg(t, r + 0.4, r + 0.6) * (1 - seg(t, c, c + 0.2))));
    llmBlock(ctx, L, base, { glow });
    stopBadge(ctx, L, tw(t, T.call1 + 0.2, 0.3, (p) => outBack(p, 1.6)) * (1 - tw(t, T.res2 + 0.4, 0.3)), 'tool_use');
    stopBadge(ctx, L, tw(t, T.end, 0.3, (p) => outBack(p, 1.6)), 'end_turn', false);
    const ca = tw(t, T.res2, 0.5);
    const x = L.llm.x;
    const y = L.llm.y + L.llm.h + 70;
    text(ctx, '開いた頁', x, y, { font: F.jp(700, 18), color: C.ink, alpha: ca });
    text(ctx, '2', x, y + 64, { font: F.cond(700, 64), color: C.green, alpha: ca });
    text(ctx, '／ 10 頁', x + 44, y + 60, { font: F.jp(500, 20), color: C.ink2, alpha: ca });
    text(ctx, '目録を読んでから選ぶ', x, y + 100, { font: F.jp(500, 16), color: C.muted, alpha: ca });

    example(ctx, M.l, 818, tw(t, 1.2, 0.5), '目録・頁・答えは説明のための例');
    source(ctx, 'Karpathy（X、2026-04-02／llm-wiki.md、2026-04-04）', tw(t, 5.8, 0.5));
  },
});
