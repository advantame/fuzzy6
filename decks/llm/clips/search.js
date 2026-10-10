// Search as a tool: instead of the app searching once before the model is asked (RAG), the
// model writes its own queries, reads what comes back, and searches again with other words
// when that is not enough. The question, the documents and the answer are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, searchMap, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge } from '../lib/rig.js';
import { text } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack } from '../../../src/kit/ease.js';

const L = layout();
const JP = F.jp(500, 19);
const ENTRIES = [
  { role: 'system', text: '使えるツール：search（社内の資料を検索する）' },
  { role: 'user', text: '出張の日当は、今年の改定で変わった？' },
  { role: 'assistant', kind: 'call', text: '{"name": "search",\n "input": {"query": "出張 日当"}}' },
  { role: 'result', kind: 'data', font: JP, lh: 31, text: '[1] 旅費規程 第 5 条：日当は 1 日 2,000 円' },
  { role: 'assistant', kind: 'call', text: '{"name": "search",\n "input": {"query": "2026 年 改定 日当"}}' },
  { role: 'result', kind: 'data', font: JP, lh: 31, text: '[4] 2026 年 4 月の改定：日当を 1 日 2,500 円に' },
  { role: 'assistant', text: '変わりました。4 月から 1 日 2,500 円です［4］。' },
];
// the two rounds: [start, query, where the query lands on the map]
const ROUNDS = [
  [1.0, '出張 日当', [0.63, 0.44]],
  [5.8, '2026 年 改定 日当', [0.28, 0.7]],
];
const R = { write: 0.9, out: 1.6, look: 2.3, back: 3.1, add: 3.8 };
const ANSWER = 10.0;

export default clip({
  id: 'search',
  title: '検索もツールに',
  kicker: '検索ツール',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: '検索を、モデルが使える**ツール**の一つにする。\n何を調べるかは、モデルが検索の言葉を書いて決める。' },
    { at: 5.8, to: 11.0, text: '足りなければ、言葉を変えてもう一度調べる。\n何回調べるかも、モデルが決める。' },
    { at: 11.2, to: 18, text: 'RAG では、アプリが質問の言葉で先に調べた。\nツールにすれば、調べるかどうかから、モデルに任せられる。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 26, gap: 16, mono: F.mono(500, 16), lhMono: 26 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    appFrame(ctx, L, base, { note: 'モデルが書いた言葉で検索する' });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base);
    channel(ctx, L.call, base);
    channel(ctx, L.back, base);

    // ——— the document, round by round
    const appear = [0.2, 0.5, ROUNDS[0][0] + R.write + 0.6, ROUNDS[0][0] + R.add, ROUNDS[1][0] + R.write + 0.6, ROUNDS[1][0] + R.add, ANSWER];
    E.forEach((e, i) => docEntry(ctx, e, tw(t, appear[i], 0.4), { chars: i === 6 ? seg(t, ANSWER, ANSWER + 1.2) : 1, hot: (i === 2 || i === 4) && t >= appear[i] && t < appear[i] + 1.0 }));
    ROUNDS.forEach(([r], k) => {
      sweep(ctx, L, seg(t, r, r + 0.8), docEnd(E, 2 + 2 * k));
      send(ctx, L.read, seg(t, r + 0.2, r + 0.8), '', 'doc');
      send(ctx, L.write, seg(t, r + R.write, r + R.write + 0.6), '呼び出し', 'call');
    });
    sweep(ctx, L, seg(t, ANSWER - 1.0, ANSWER - 0.2), docEnd(E, 6));
    send(ctx, L.read, seg(t, ANSWER - 0.8, ANSWER - 0.2), '', 'doc');

    // ——— the model
    const glow = Math.max(...ROUNDS.map(([r]) => seg(t, r + 0.7, r + 0.9) * (1 - seg(t, r + R.write + 0.6, r + R.write + 0.8))), seg(t, ANSWER - 0.3, ANSWER) * (1 - seg(t, ANSWER + 1.2, ANSWER + 1.5)));
    llmBlock(ctx, L, base, { glow });
    ROUNDS.forEach(([r]) => stopBadge(ctx, L, tw(t, r + R.write + 0.6, 0.3, (p) => outBack(p, 1.6)) * (1 - tw(t, r + R.add, 0.3)), 'tool_use'));
    stopBadge(ctx, L, tw(t, ANSWER + 1.2, 0.3, (p) => outBack(p, 1.6)), 'end_turn', false);

    // ——— the search: the query lands somewhere else the second time
    const k = t < ROUNDS[1][0] + R.out ? 0 : 1;
    const [r, , q0] = ROUNDS[k];
    const move = k === 1 ? inOutCubic(seg(t, r + R.out + 0.2, r + R.look)) : 1;
    const q = k === 1 ? [lerp(ROUNDS[0][2][0], q0[0], move), lerp(ROUNDS[0][2][1], q0[1], move)] : q0;
    toolBox(ctx, L, base, {
      solid: 1,
      label: 'ツールの位置',
      draw: (cx, b, a) => searchMap(cx, b, {
        a,
        q,
        qa: tw(t, ROUNDS[0][0] + R.out + 0.6, 0.4, (p) => outBack(p, 2)),
        qLabel: ROUNDS[k][1],
        look: k === 1 ? seg(t, r + R.look, r + R.look + 0.6) : seg(t, r + R.look, r + R.look + 0.6) * (1 - seg(t, ROUNDS[1][0] + R.out, ROUNDS[1][0] + R.out + 0.3)),
        k: 2,
      }),
      caption: '言葉が変われば、探す場所も変わる',
      captionAlpha: tw(t, ROUNDS[1][0] + R.look + 0.4, 0.5),
    });
    ROUNDS.forEach(([r0, query], i) => {
      const call = E[2 + 2 * i];
      const res = E[3 + 2 * i];
      flow(ctx, [[call.tx + 240, call.y + call.h / 2], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [L.tool.x + 40, L.call.y]], seg(t, r0 + R.out, r0 + R.look), query, 'call');
      flow(ctx, [[L.tool.x + 40, L.back.y], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [res.tx + 120, res.y + res.h / 2]], seg(t, r0 + R.back, r0 + R.add), '1 件', 'data');
    });

    // ——— who decides to search
    const f = tw(t, 11.4, 0.6);
    if (f > 0) {
      const x = L.llm.x;
      const y = L.llm.y + L.llm.h + 70;
      text(ctx, '検索を決めるのは', x, y, { font: F.jp(700, 19), color: C.ink, alpha: f });
      [['RAG', 'アプリ（先に 1 回）', C.ink2], ['検索ツール', 'モデル（必要なだけ）', C.accent]].forEach(([name, who, col], i) => {
        const a = tw(t, 11.6 + i * 0.25, 0.5);
        text(ctx, name, x, y + 44 + i * 58, { font: F.jp(700, 17), color: C.ink2, alpha: a });
        text(ctx, who, x, y + 70 + i * 58, { font: F.jp(700, 19), color: col, alpha: a });
      });
    }
    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '質問・資料・答えは説明のための例');
  },
});
