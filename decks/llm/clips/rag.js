// RAG on the chapter's diagram: the tool's place becomes a search over the company's documents.
// Without it the model can only guess; with it, the app searches first, by meaning, pastes what
// it found into the document, and only then lets the model answer, citing it. The question,
// the documents and the answer are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, abstractTool, searchMap, channel, docLayout, docEntry, docEnd, rowAt, sweep, send, flow } from '../lib/rig.js';
import { text, rr, line, measure } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const L = layout();
const ENTRIES = [
  { role: 'user', text: '出張の日当はいくら？' },
  {
    role: 'search',
    kind: 'data',
    font: F.jp(500, 19),
    lh: 31,
    text: '[1] 旅費規程 第 5 条：日当は 1 日 2,000 円\n[2] 出張の手引き：日当は精算のときに支払う\n[3] 2026 年 4 月の改定：宿泊費の上限を変更',
  },
  { role: 'assistant', text: '1 日 2,000 円です［1］。' },
];
const GUESS = { role: 'assistant', text: '多くの会社では、1 日 2,000〜3,000 円です。' };

const T = {
  guess: 1.0,
  swap: 3.0,
  ask: 4.3,
  search: 5.0,
  back: 6.3,
  read: 7.6,
  write: 8.7,
  cite: 10.5,
  fact: 11.4,
};

export default clip({
  id: 'rag',
  title: '調べてから答える',
  kicker: 'RAG（検索拡張生成）',
  duration: 17,
  cues: [
    { at: 0.4, to: 4.1, text: 'モデルが知っているのは、学習に使った文章だけ。\n社内の資料は知らないので、答えは推測になる。' },
    { at: 4.3, to: 11.0, text: 'そこでアプリが、先に資料を**検索**する。\n見つかった文章を文書に貼り付けてから、モデルに答えさせる。' },
    { at: 11.2, to: 18, text: 'この方法を RAG（検索拡張生成）と呼ぶ。名前は 2020 年の論文から。\n答えに、出典を添えられる。' },
  ],

  prepare(ctx) {
    const E = docLayout(ctx, L, ENTRIES, { top: 30, gap: 24 });
    const [G] = docLayout(ctx, L, [GUESS], { top: E[1].y - L.doc.y });
    return { E, G };
  },

  draw(ctx, t, { E, G }) {
    const base = tw(t, 0, 0.5);
    const swap = inOutCubic(seg(t, T.swap, T.swap + 1.0));
    appFrame(ctx, L, base, { note: 'まず検索し、それから読ませる', noteAlpha: tw(t, T.ask, 0.5) });
    // the order of things: the search comes before the model is asked
    const order = tw(t, T.ask - 0.2, 0.5);
    channel(ctx, L.call, base, { label: order > 0 ? '① 検索' : '入力', hot: t >= T.ask && t < T.search + 0.3 });
    channel(ctx, L.back, base, { label: order > 0 ? '② 資料' : '結果', hot: t >= T.back && t < T.back + 0.9 });
    channel(ctx, L.read, base, { label: order > 0 ? '③ 読ませる' : '読ませる', hot: t >= T.read && t < T.write });
    channel(ctx, L.write, base, { label: order > 0 ? '④ 答える' : '続きを書く', hot: t >= T.write && t < T.cite });

    // ——— the document
    docEntry(ctx, E[0], tw(t, 0.5, 0.4));
    // without the documents, the model guesses
    const ga = tw(t, T.guess, 0.3) * (1 - tw(t, T.swap + 0.2, 0.5));
    if (ga > 0) {
      docEntry(ctx, G, ga, { chars: seg(t, T.guess, T.guess + 1.0), color: C.ink2 });
      const strike = seg(t, T.guess + 1.3, T.guess + 1.7);
      if (strike > 0) {
        ctx.save();
        ctx.globalAlpha = ga;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        line(ctx, G.tx - 4, G.y + 13, G.tx + G.w * 0.86, G.y + 13, strike);
        ctx.restore();
        text(ctx, '資料を知らないので、推測になる', G.tx, G.y + 64, { font: F.jp(700, 19), color: C.red, alpha: ga * tw(t, T.guess + 1.6, 0.4) });
      }
    }
    docEntry(ctx, E[1], tw(t, T.back + 0.8, 0.5));
    docEntry(ctx, E[2], tw(t, T.write, 0.3), { chars: seg(t, T.write, T.write + 1.2) });
    sweep(ctx, L, seg(t, T.read, T.read + 1.0), docEnd(E, 2));
    send(ctx, L.read, seg(t, T.read + 0.3, T.read + 1.0), '', 'doc');
    send(ctx, L.write, seg(t, T.write - 0.5, T.write), '答え', 'text');
    // the citation points back to the passage it came from
    const c = tw(t, T.cite, 0.5);
    if (c > 0) {
      const r = E[1];
      ctx.save();
      ctx.globalAlpha = c;
      ctx.fillStyle = C.accentSoft;
      rr(ctx, r.tx + 4, r.y + 4, r.w - 8, 32, 6);
      ctx.fill();
      ctx.restore();
      const first = rowAt(r, 0);
      text(ctx, r.rows[0], first.x, first.y, { font: r.font, color: C.ink, alpha: c });
      text(ctx, '出典', r.tx + r.w - 12, r.y + 27, { font: F.jp(700, 17), color: C.accent, align: 'right', alpha: c });
      // …and the mark in the answer that points to it
      const a = E[2];
      const pre = measure(ctx, a.font, '1 日 2,000 円です');
      const w = measure(ctx, a.font, '［1］');
      ctx.save();
      ctx.globalAlpha = c;
      ctx.fillStyle = C.accentSoft;
      rr(ctx, a.tx + pre - 2, a.y - 3, w + 4, 34, 6);
      ctx.fill();
      ctx.restore();
      text(ctx, '［1］', a.tx + pre, a.y + 21, { font: a.font, color: C.accent, alpha: c });
      text(ctx, '。', a.tx + pre + w, a.y + 21, { font: a.font, color: C.ink, alpha: c });
    }

    // ——— the model
    llmBlock(ctx, L, base, { glow: seg(t, T.guess - 0.3, T.guess) * (1 - seg(t, T.guess + 1.0, T.guess + 1.3)) + seg(t, T.read + 1.0, T.read + 1.2) * (1 - seg(t, T.cite, T.cite + 0.3)) });

    // ——— the tool's place, now a search over the company's documents
    toolBox(ctx, L, base, {
      solid: swap,
      label: 'ツールの位置',
      labelAlpha: swap,
      draw: (cx, b, a) => {
        abstractTool(cx, b, a * (1 - swap));
        const s = a * swap;
        if (s <= 0.001) return;
        searchMap(cx, b, {
          a: s,
          dots: tw(t, T.swap + 0.4, 0.6),
          q: [0.63, 0.44],
          qa: tw(t, T.search, 0.4, (p) => outBack(p, 2)),
          look: seg(t, T.search + 0.4, T.search + 1.1),
        });
      },
      caption: '意味の近い文章を探す',
      captionAlpha: tw(t, T.search + 0.6, 0.5),
    });
    flow(ctx, [[E[0].tx + 200, E[0].y + 14], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [L.tool.x + 40, L.call.y]], seg(t, T.ask, T.search), '出張の日当', 'call');
    flow(ctx, [[L.tool.x + 40, L.back.y], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [E[1].tx + 120, E[1].y + 40]], seg(t, T.back, T.back + 0.8), '3 件', 'data');

    // ——— where the name comes from
    const f = tw(t, T.fact, 0.6);
    if (f > 0) {
      const x = L.llm.x;
      const y = L.llm.y + L.llm.h + 74;
      text(ctx, 'RAG', x, y, { font: F.cond(700, 54), color: C.accent, alpha: f });
      text(ctx, '2020 年　Lewis ほか', x, y + 38, { font: F.jp(700, 19), color: C.ink, alpha: f });
      ['Facebook AI Research、UCL、NYU', 'Wikipedia を 100 語ずつに分けた', '約 2,100 万の断片から探した'].forEach((s, i) => {
        text(ctx, s, x, y + 74 + i * 28, { font: F.jp(500, 16), color: C.ink2, alpha: tw(t, T.fact + 0.2 + i * 0.1, 0.5) });
      });
    }
    source(ctx, 'Lewis ほか（2020）', f);
    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '質問・資料・答えは説明のための例');
  },
});
