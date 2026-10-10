// The loop: the app's whole job, as code. Call the model; if it stopped to use a tool, run the
// tool, add the result and call it again; if it answered, stop. The model decides how many
// rounds there are. Two tool calls, then the answer. The code and the values are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, toolList, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge, working, jsonLine } from '../lib/rig.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, outBack } from '../../../src/kit/ease.js';

const B = layout();
const CODE = { x: B.doc.x, y: B.doc.y, w: B.doc.w, h: 280 };
// the document sits under the code, inside the same app
const L = { ...B, doc: { x: B.doc.x, y: CODE.y + CODE.h + 14, w: B.doc.w, h: B.doc.y + B.doc.h - (CODE.y + CODE.h + 14) } };
const LINES = [
  'messages = [question]',
  'while True:',
  '    reply = llm(messages, tools)',
  '    messages.append(reply)',
  '    if reply.stop_reason != "tool_use":',
  '        break',
  '    result = run_tool(reply.tool_call)',
  '    messages.append(result)',
  'show(reply.text)',
];
const ENTRIES = [
  { role: 'user', text: '東京と大阪、今どちらが暖かい？' },
  { role: 'assistant', kind: 'call', text: '{"name": "get_weather", "input": {"city": "東京"}}' },
  { role: 'result', kind: 'data', text: '{"temp_c": 18}' },
  { role: 'assistant', kind: 'call', text: '{"name": "get_weather", "input": {"city": "大阪"}}' },
  { role: 'result', kind: 'data', text: '{"temp_c": 21}' },
  { role: 'assistant', text: '大阪のほうが 3℃ 暖かい（21℃ と 18℃）。' },
];

// one round of the loop, from its start time r: which line runs when, and what moves
const R = [1.3, 5.4, 9.5];
const ROUND = {
  read: 0, // line 3: the model reads everything
  write: 0.75, // …and writes
  append: 1.3, // line 4
  check: 1.7, // line 5
  tool: 2.0, // line 7: input to the tool
  run: 2.6,
  back: 3.0, // result back
  add: 3.6, // line 8
};
const END = R[2] + 2.6; // the answer is written; line 5 → 6 → 9

// the line running at time t (0-based), or -1
function lineAt(t) {
  if (t < 0.6) return -1;
  if (t < R[0]) return 0;
  if (t >= END + 0.9) return 8;
  if (t >= END + 0.45) return 5;
  if (t >= END) return 4;
  let k = R.length - 1;
  while (k > 0 && t < R[k]) k--;
  const u = t - R[k];
  if (k === 2) return u < ROUND.append ? 2 : 3;
  if (u < ROUND.append) return 2;
  if (u < ROUND.check) return 3;
  if (u < ROUND.tool) return 4;
  if (u < ROUND.add) return 6;
  return 7;
}

export default clip({
  id: 'toolloop',
  title: '答えるまで回す',
  kicker: 'ツール使用のループ',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.2, text: 'アプリは、モデルが呼び出しを書くたびにツールを実行し、\nまた読ませる。これを**ループ**で回す。' },
    { at: 5.4, to: 11.4, text: '何回ツールを呼ぶかは、モデルが決める。\n呼び出しを書かずに答えたら、ループを抜ける。' },
    { at: 11.6, to: 18, text: '2023 年 6 月、OpenAI が API に「関数呼び出し」を加えた。\nこのループが、エージェントの骨組みになる。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 18, gap: 11, font: F.jp(500, 20), lh: 30, mono: F.mono(500, 15), lhMono: 24 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    appFrame(ctx, B, base, { docAlpha: 0 });
    // the document's paper, below the code
    ctx.save();
    ctx.globalAlpha = base;
    rr(ctx, L.doc.x, L.doc.y, L.doc.w, L.doc.h, 14);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();

    // ——— the code, with the running line lit
    const cur = lineAt(t);
    ctx.save();
    ctx.globalAlpha = base;
    rr(ctx, CODE.x, CODE.y, CODE.w, CODE.h, 14);
    ctx.fillStyle = C.ink;
    ctx.fill();
    ctx.restore();
    text(ctx, 'アプリのコード', CODE.x + 20, CODE.y + 32, { font: F.jp(700, 17), color: '#bdb6a9', alpha: base });
    const round = t < R[0] ? 0 : t < R[1] ? 1 : t < R[2] ? 2 : 3;
    if (round > 0) {
      text(ctx, `${round} 周目`, CODE.x + CODE.w - 20, CODE.y + 33, { font: F.jp(700, 20), color: C.accent, align: 'right' });
    }
    LINES.forEach((s, i) => {
      const y = CODE.y + 64 + i * 24.5;
      const on = i === cur;
      if (on) {
        ctx.fillStyle = 'rgba(255, 90, 31, 0.28)';
        ctx.fillRect(CODE.x + 8, y - 18, CODE.w - 16, 24);
        ctx.fillStyle = C.accent;
        ctx.fillRect(CODE.x + 8, y - 18, 4, 24);
      }
      text(ctx, String(i + 1), CODE.x + 34, y, { font: F.mono(500, 16), color: '#6f6a62', align: 'right', alpha: base });
      text(ctx, s, CODE.x + 52, y, { font: F.mono(on ? 600 : 500, 17), color: on ? '#fff' : '#d9d3c7', alpha: base });
    });
    channel(ctx, B.read, base);
    channel(ctx, B.write, base);
    channel(ctx, B.call, base);
    channel(ctx, B.back, base);

    // ——— the document, growing round by round
    const appear = [0.7, R[0] + ROUND.append, R[0] + ROUND.add, R[1] + ROUND.append, R[1] + ROUND.add, R[2] + ROUND.append];
    E.forEach((e, i) => {
      const a = tw(t, appear[i], 0.4);
      docEntry(ctx, e, a, { chars: i === 5 ? seg(t, appear[i], END - 0.1) : 1 });
    });
    R.forEach((r, k) => {
      const shown = 1 + 2 * k; // entries the model reads in this round
      sweep(ctx, L, seg(t, r + ROUND.read, r + ROUND.read + 0.8), docEnd(E, shown));
      send(ctx, B.read, seg(t, r + 0.25, r + 0.8), '', 'doc');
      send(ctx, B.write, seg(t, r + ROUND.write, r + ROUND.append), k === 2 ? '答え' : '呼び出し', k === 2 ? 'text' : 'call');
      if (k === 2) return;
      const call = E[1 + 2 * k];
      const res = E[2 + 2 * k];
      const tc = [B.tool.x + B.tool.w / 2, B.tool.y + B.tool.h / 2];
      flow(ctx, [[call.tx + call.w - 140, call.y + call.h / 2], [B.call.x1, B.call.y], [B.call.x2, B.call.y], tc], seg(t, r + ROUND.tool, r + ROUND.run), k === 0 ? '"東京"' : '"大阪"', 'call');
      flow(ctx, [tc, [B.back.x1, B.back.y], [B.back.x2, B.back.y], [res.tx + 90, res.y + res.h / 2]], seg(t, r + ROUND.back, r + ROUND.add), k === 0 ? '18' : '21', 'data');
    });

    // ——— the model and the tool
    const reading = R.reduce((g, r, k) => Math.max(g, seg(t, r + 0.7, r + 0.85) * (1 - seg(t, r + ROUND.append, r + ROUND.append + 0.2)), k === 2 ? seg(t, r + 0.7, r + 0.85) * (1 - seg(t, END, END + 0.3)) : 0), 0);
    llmBlock(ctx, B, base, { glow: reading });
    R.slice(0, 2).forEach((r) => stopBadge(ctx, B, tw(t, r + ROUND.check, 0.3, (p) => outBack(p, 1.6)) * (1 - tw(t, r + ROUND.add, 0.3)), 'tool_use'));
    stopBadge(ctx, B, tw(t, END, 0.3, (p) => outBack(p, 1.6)), 'end_turn', false);
    const runs = R.slice(0, 2).map((r) => seg(t, r + ROUND.run - 0.2, r + ROUND.back));
    const running = runs.some((p) => p > 0 && p < 1);
    toolBox(ctx, B, base, { glow: running ? 1 : 0, draw: toolList(['get_weather', 'search_web', 'calculate'], 0, running ? 1 : 0) });
    runs.forEach((p) => working(ctx, B, p));

    // ——— the count, at the end
    const f = tw(t, END + 1.2, 0.6);
    ['ツールを 2 回呼び、', '3 回目に答えた。'].forEach((s, i) => text(ctx, s, B.llm.x, B.llm.y + B.llm.h + 70 + i * 32, { font: F.jp(700, 21), color: C.ink, alpha: f }));
    text(ctx, '回数はモデルが決めた', B.llm.x, B.llm.y + B.llm.h + 146, { font: F.jp(500, 19), color: C.ink2, alpha: tw(t, END + 1.6, 0.6) });
    source(ctx, 'OpenAI（2023 年 6 月 13 日）', tw(t, 11.8, 0.6));
    example(ctx, M.l, 818, tw(t, 1.0, 0.5), 'コードと値は説明のための例');
  },
});
