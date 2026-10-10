// LLM Wiki: Karpathy's pattern (April 2026) puts a folder in the tool's place. The harness lets
// the model read the raw sources and write a wiki of linked pages; the rules for how the wiki is
// kept live in a schema file the model reads first. Then the three layers, and who does what.
// The rules, files and pages are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { mix, BASE, llmBlock, appFrame, toolBox, channel, docLayout, docEntry, docEnd, sweep, send, flow } from '../lib/rig.js';
import { WIDE, wikiFolder, pageAt, rawAt, fileAt, folderAreas, P, BASE_LINKS } from '../lib/wiki.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic } from '../../../src/kit/ease.js';

const L = mix(BASE, WIDE, 1);
const ENTRIES = [
  { role: 'system', text: 'wiki の決まり（CLAUDE.md）\n・raw/ の資料は読むだけ\n・1 つの概念に 1 頁\n・資料を足したら index.md と log.md も直す', lh: 32 },
  { role: 'user', text: 'この分野の wiki を作って、育てて。' },
  { role: 'assistant', kind: 'call', text: 'read raw/Shannon 1948\nread raw/Vaswani 2017\nwrite wiki/年表.md\nwrite wiki/Transformer.md …' },
  { role: 'assistant', text: '9 頁の wiki を作りました。\nindex.md と log.md も直しました。' },
];
// the base pages appear as they are written, in this order
const ORDER = ['年表', 'トークン', '事前学習', 'Transformer', 'アテンション', 'コンテキスト', '幻覚', '検索', 'ELIZA'].map((n) => P[n]);
const BUILD = [3.6, 8.6];
const LAYERS = { raw: 6.0, wiki: 7.6, schema: 9.2 };

export default clip({
  id: 'llmwiki',
  title: 'LLM が編む',
  kicker: 'LLM Wiki',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '2026 年 4 月、Andrej Karpathy は、LLM に知識の wiki を\n書かせ、育てさせるやり方を紹介した（LLM Wiki）。' },
    { at: 6.0, to: 11.0, text: '元の資料は raw/ に置き、書き換えない。wiki/ の頁は LLM が書く。\n書き方の決まりは CLAUDE.md や AGENTS.md に書いておく。' },
    { at: 11.2, to: 18, text: '人は資料を選び、問いを立て、意味を考える。\n要約、相互参照、整理といった帳簿付けは、LLM が受け持つ。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 26, gap: 18, mono: F.mono(500, 17), lhMono: 28 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    appFrame(ctx, L, base, { name: 'ハーネス', note: 'Claude Code、Codex など', noteAlpha: tw(t, 0.6, 0.5) });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base);
    channel(ctx, L.call, base, { label: '読む・書く' });
    channel(ctx, L.back, base, { label: '中身' });

    // ——— the document: the rules first, then the request, then reads and writes
    const show = [0.8, 1.6, 2.6, BUILD[1] + 0.6];
    E.forEach((e, i) => docEntry(ctx, e, tw(t, show[i], 0.4), { chars: i === 2 ? seg(t, 2.6, 4.2) : i === 3 ? seg(t, show[3], show[3] + 0.8) : 1, hot: i === 0 && t > LAYERS.schema && t < LAYERS.schema + 1.6 }));
    send(ctx, L.write, seg(t, BUILD[1] + 0.1, BUILD[1] + 0.6), '答え', 'text');
    sweep(ctx, L, seg(t, 1.9, 2.5), docEnd(E, 2));
    send(ctx, L.read, seg(t, 2.0, 2.5), '', 'doc');
    send(ctx, L.write, seg(t, 2.4, 2.9), '書く', 'call');

    // ——— the folder; pages are written one by one while the model works
    const built = (i) => {
      const k = ORDER.indexOf(i);
      if (k < 0) return 0;
      return tw(t, BUILD[0] + (k / ORDER.length) * (BUILD[1] - BUILD[0]), 0.4);
    };
    const page = Array.from({ length: 12 }, (_, i) => built(i));
    const pageLit = Array.from({ length: 12 }, (_, i) => {
      const k = ORDER.indexOf(i);
      if (k < 0) return 0;
      const at = BUILD[0] + (k / ORDER.length) * (BUILD[1] - BUILD[0]);
      return Math.sin(Math.PI * seg(t, at, at + 0.8));
    });
    const link = Array.from({ length: BASE_LINKS }, (_, k) => tw(t, BUILD[0] + 0.4 + (k / BASE_LINKS) * (BUILD[1] - BUILD[0]), 0.6));
    const rawLit = t > BUILD[0] && t < BUILD[1] ? Math.floor(((t - BUILD[0]) / (BUILD[1] - BUILD[0])) * 3) : -1;
    const flash = (at) => Math.sin(Math.PI * seg(t, at, at + 1.6));
    toolBox(ctx, L, base, {
      solid: 1,
      label: 'ツールの位置',
      draw: (cx, b, a) => wikiFolder(cx, b, a, { page, pageLit, link, rawLit, file: [flash(LAYERS.schema), tw(t, BUILD[1] - 0.4, 0.3) * (1 - tw(t, BUILD[1] + 0.8, 0.4)), tw(t, BUILD[1] - 0.2, 0.3) * (1 - tw(t, BUILD[1] + 0.8, 0.4))], logAdd: tw(t, BUILD[1] - 0.2, 0.3) * (1 - tw(t, BUILD[1] + 1.2, 0.4)) }),
    });
    // the three layers, named in turn
    const A = folderAreas(L.tool);
    const ring = (x, y, w, h, p) => {
      if (p <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = p;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      rr(ctx, x, y, w, h, 12);
      ctx.stroke();
      ctx.restore();
    };
    ring(A.raw.x - 8, A.raw.y - 40, A.raw.w + 16, A.raw.h + 52, flash(LAYERS.raw));
    ring(A.graph.x - 20, A.graph.y - 60, A.graph.w + 40, A.graph.h + 96, flash(LAYERS.wiki));
    const f0 = fileAt(L.tool, 0);
    ring(f0.x - 6, f0.y - 6, f0.w + 12, f0.h + 12, flash(LAYERS.schema));
    // reads and writes travel between the document and the folder while it is built
    for (let k = 0; k < 6; k++) {
      const at = BUILD[0] + k * 0.8;
      const r = rawAt(L.tool, k % 3);
      flow(ctx, [[L.call.x1, L.call.y], [L.call.x2, L.call.y], [r.x + r.w / 2, r.y + r.h]], seg(t, at, at + 0.5), 'read', 'call');
      const pg = pageAt(L.tool, ORDER[Math.min(ORDER.length - 1, k + 2)]);
      flow(ctx, [[L.call.x1, L.call.y + 10], [L.call.x2, L.call.y + 10], [pg.x, pg.y]], seg(t, at + 0.4, at + 0.9), 'write', 'call');
    }

    // ——— the model, and who does what
    llmBlock(ctx, L, base, { glow: seg(t, 2.3, 2.5) * (1 - seg(t, BUILD[1], BUILD[1] + 0.3)) });
    const wa = tw(t, 11.2, 0.6);
    if (wa > 0) {
      const x = L.llm.x;
      const y = L.llm.y + L.llm.h + 60;
      text(ctx, '人', x, y, { font: F.jp(700, 21), color: C.blue, alpha: wa });
      ['資料を選ぶ', '問いを立てる', '意味を考える'].forEach((s, i) => text(ctx, s, x, y + 30 + i * 26, { font: F.jp(500, 17), color: C.ink2, alpha: wa }));
      const wb = tw(t, 11.8, 0.6);
      text(ctx, 'LLM', x + 148, y, { font: F.sans(700, 21), color: C.ink, alpha: wb });
      ['要約', '相互参照', '整理', '帳簿付け'].forEach((s, i) => text(ctx, s, x + 148, y + 30 + i * 26, { font: F.jp(500, 17), color: C.ink2, alpha: wb }));
    }
    const ka = tw(t, 0.6, 0.6);
    text(ctx, '2026 年 4 月 2 日', L.llm.x, L.llm.y - 108, { font: F.cond(700, 26), color: C.ink, alpha: ka });
    text(ctx, 'Karpathy の投稿', L.llm.x, L.llm.y - 80, { font: F.jp(500, 17), color: C.ink2, alpha: ka });
    text(ctx, '4 日に gist「llm-wiki.md」', L.llm.x, L.llm.y - 56, { font: F.jp(500, 17), color: C.ink2, alpha: tw(t, 1.0, 0.6) });

    example(ctx, M.l, 818, tw(t, 1.4, 0.5), '決まり・資料・頁は説明のための例');
    source(ctx, 'Karpathy（X、2026-04-02／gist、2026-04-04）', ka);
  },
});
