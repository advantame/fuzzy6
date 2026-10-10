// MCP on the chapter's diagram: the tool's place holds an MCP server. The harness asks it which
// tools it has (tools/list) and writes their descriptions into the document, as in 4-2; when the
// model calls one, the harness sends tools/call and writes back what the server returns. The
// server, the issue and the messages are an example; names follow the MCP specification.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, abstractTool, toolList, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge } from '../lib/rig.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const L = layout();
const TOOLS = ['create_issue', 'list_issues', 'add_comment'];
const ENTRIES = [
  { role: 'system', text: '使えるツール：create_issue（Issue を作る）、\nlist_issues（一覧を見る）、add_comment' },
  { role: 'user', text: '「ログイン画面が真っ白」という\nIssue を立てて。' },
  { role: 'assistant', kind: 'call', text: '{"name": "create_issue", "input":\n {"title": "ログイン画面が真っ白"}}' },
  { role: 'result', kind: 'data', text: 'Issue #42 を作成しました' },
  { role: 'assistant', text: 'Issue #42 を立てました。' },
];
// the messages between harness and server: [time, direction, method or result, detail]
const LOG = { x: 1110, y: 100, w: 394, h: 196 };
const T = { swap: 0.6, list: 1.6, listed: 2.5, sys: 3.0, user: 3.5, read1: 4.0, call: 5.0, send: 5.9, run: 6.6, back: 7.0, result: 7.7, read2: 8.4, answer: 9.4, fact: 11.4 };
const MSGS = [
  [T.list, '→', 'tools/list', ''],
  [T.listed, '←', 'tools:', 'create_issue, list_issues, …'],
  [T.send, '→', 'tools/call', 'create_issue {"title": …}'],
  [T.back + 0.4, '←', 'content:', '"Issue #42 を作成しました"'],
];

export default clip({
  id: 'mcpflow',
  title: '説明書を取り寄せる',
  kicker: 'MCP のやりとり',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'ハーネスが MCP サーバーに、使えるツールを問い合わせる。\n返ってきた説明書は、文書の頭に書き込む。' },
    { at: 5.8, to: 11.2, text: 'モデルが呼び出しを書くと、ハーネスが tools/call で送る。\nサーバーが実行して、結果を返す。' },
    { at: 11.4, to: 18, text: 'やりとりの形が決まっているので、\nどのハーネスとどのサーバーも組み合わせられる。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 24, gap: 16, mono: F.mono(500, 16), lhMono: 26 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    const swap = inOutCubic(seg(t, T.swap, T.swap + 0.8));
    appFrame(ctx, L, base, { name: 'ハーネス', note: 'MCP クライアントとして、サーバーとやりとりする', noteAlpha: tw(t, T.swap + 0.6, 0.5) });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base);
    channel(ctx, L.call, base, { label: 'MCP', hot: (t >= T.list && t < T.list + 0.8) || (t >= T.send && t < T.run) });
    channel(ctx, L.back, base, { label: 'MCP', hot: (t >= T.listed - 0.3 && t < T.sys) || (t >= T.back && t < T.result) });

    // ——— the document
    const appear = [T.sys, T.user, T.call + 0.3, T.result, T.answer];
    E.forEach((e, i) => docEntry(ctx, e, tw(t, appear[i], 0.4), { chars: i === 4 ? seg(t, T.answer, T.answer + 0.8) : 1, hot: i === 0 && t >= T.sys && t < T.sys + 1.6 }));
    const sa = tw(t, T.sys + 0.3, 0.4) * (1 - tw(t, T.sys + 1.6, 0.4));
    text(ctx, 'サーバーから届いた説明書', E[0].tx + E[0].w, E[0].y - 8, { font: F.jp(700, 16), color: C.accent, align: 'right', alpha: sa });
    sweep(ctx, L, seg(t, T.read1, T.read1 + 0.7), docEnd(E, 2));
    send(ctx, L.read, seg(t, T.read1 + 0.2, T.read1 + 0.7), '', 'doc');
    send(ctx, L.write, seg(t, T.call - 0.3, T.call + 0.3), '呼び出し', 'call');
    sweep(ctx, L, seg(t, T.read2, T.read2 + 0.7), docEnd(E, 4));
    send(ctx, L.read, seg(t, T.read2 + 0.2, T.read2 + 0.7), '', 'doc');

    // ——— the model
    llmBlock(ctx, L, base, { glow: seg(t, T.read1 + 0.6, T.read1 + 0.8) * (1 - seg(t, T.call + 0.3, T.call + 0.5)) + seg(t, T.read2 + 0.6, T.read2 + 0.8) * (1 - seg(t, T.answer + 0.8, T.answer + 1.0)) });
    stopBadge(ctx, L, tw(t, T.call + 0.3, 0.3, (p) => outBack(p, 1.6)) * (1 - tw(t, T.result, 0.3)), 'tool_use');
    stopBadge(ctx, L, tw(t, T.answer + 0.8, 0.3, (p) => outBack(p, 1.6)), 'end_turn', false);

    // ——— the MCP server in the tool's place
    const lit = t >= T.send && t < T.result ? 0 : -1;
    toolBox(ctx, L, base, {
      solid: swap,
      label: 'ツールの位置',
      labelAlpha: swap,
      glow: t >= T.run - 0.2 && t < T.back ? 1 : 0,
      draw: (cx, b, a) => {
        abstractTool(cx, b, a * (1 - swap));
        if (swap > 0) toolList(TOOLS, lit, lit === 0 ? 1 : 0, 'MCP サーバー')(cx, b, a * swap);
      },
      caption: '例：GitHub を操作するサーバー',
      captionAlpha: tw(t, T.swap + 0.6, 0.5),
    });
    const call = E[2];
    const res = E[3];
    flow(ctx, [[L.app.x + L.app.w - 40, L.call.y], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [L.tool.x + 40, L.call.y]], seg(t, T.list, T.list + 0.7), 'tools/list', 'call');
    flow(ctx, [[L.tool.x + 40, L.back.y], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [E[0].tx + 160, E[0].y + 30]], seg(t, T.listed, T.sys), '説明書', 'data');
    flow(ctx, [[call.tx + 260, call.y + call.h / 2], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [L.tool.x + 40, L.call.y]], seg(t, T.send, T.run), 'tools/call', 'call');
    flow(ctx, [[L.tool.x + 40, L.back.y], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [res.tx + 120, res.y + res.h / 2]], seg(t, T.back, T.result), '結果', 'data');

    // ——— the messages, as a log
    const la = tw(t, T.list - 0.2, 0.5);
    if (la > 0) {
      ctx.save();
      ctx.globalAlpha = la;
      rr(ctx, LOG.x, LOG.y, LOG.w, LOG.h, 14);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      text(ctx, 'やりとり（JSON-RPC 2.0）', LOG.x + 18, LOG.y + 32, { font: F.jp(700, 17), color: C.ink2, alpha: la });
      MSGS.forEach(([at, dir, head, rest], i) => {
        const a = tw(t, at, 0.3);
        if (a <= 0) return;
        const y = LOG.y + 70 + i * 34;
        const col = dir === '→' ? C.accent : C.green;
        text(ctx, dir, LOG.x + 18, y, { font: F.mono(600, 16), color: col, alpha: a });
        const w = text(ctx, head, LOG.x + 40, y, { font: F.mono(600, 16), color: C.ink, alpha: a });
        text(ctx, rest, LOG.x + 48 + w, y, { font: F.mono(500, 14), color: C.ink2, alpha: a });
      });
    }

    // ——— what holds it together
    const f = tw(t, T.fact, 0.6);
    if (f > 0) {
      const x = L.llm.x;
      const y = L.llm.y + L.llm.h + 60;
      [
        ['2024 年 11 月 25 日', 'Anthropic が MCP を公開'],
        ['2025 年 12 月 9 日', 'Linux Foundation 傘下の\nAAIF に寄贈'],
      ].forEach(([date, what], i) => {
        const a = tw(t, T.fact + i * 0.3, 0.5);
        const yy = y + i * 92;
        text(ctx, date, x, yy, { font: F.jp(700, 18), color: C.ink, alpha: a });
        what.split('\n').forEach((s, j) => text(ctx, s, x, yy + 28 + j * 24, { font: F.jp(500, 16), color: C.ink2, alpha: a }));
      });
    }
    source(ctx, 'modelcontextprotocol.io（仕様 2024-11-05、2026-07-28）、Linux Foundation（2025-12-09）', f);
    example(ctx, M.l, 818, tw(t, 1.0, 0.5), 'サーバー・依頼・結果は説明のための例');
  },
});
