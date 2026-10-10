// Between generations: the app runs the tool, writes its result into the document under its
// own mark, and has the model read the whole document again; this time the model answers.
// The tool's result is just more text in the document. The result is an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, toolList, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge, working, jsonLine } from '../lib/rig.js';
import { text, rr, measure } from '../../../src/kit/draw.js';
import { tw, seg, outBack } from '../../../src/kit/ease.js';

const L = layout();
const ENTRIES = [
  { role: 'system', text: '使えるツール：get_weather, search_web, calculate' },
  { role: 'user', text: '東京の今の気温は？' },
  { role: 'assistant', kind: 'call', text: '{"name": "get_weather", "input": {"city": "東京"}}' },
  { role: 'result', kind: 'data', text: '{"temp_c": 18, "sky": "晴れ"}', gap: 64 },
  { role: 'assistant', text: '東京は今 18℃ で、晴れています。' },
];
const RECEIVED = ['{"type": "tool_use",', ' "name": "get_weather",', ' "input": {"city": "東京"}}'];
const CARD = { x: 1110, y: 112, w: 394, h: 176 };

const SEND = 0.9;
const RUN = 1.6;
const BACK = 3.1;
const READ = 5.8;
const WRITE = 7.9;
const DONE = 10.4;
const NOTES = [
  [0, '呼び出しを読み取り、ツールを実行する'],
  [READ - 0.2, '書き足した文書を、もう一度渡す'],
  [DONE + 0.4, '答えを表示する'],
];

export default clip({
  id: 'toolresult',
  title: '結果を書き足す',
  kicker: 'ツールの実行と結果',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'アプリが呼び出しを読み取り、ツールを実行する。\n結果には印を付けて、文書に書き足す。' },
    { at: 5.8, to: 11.0, text: '書き足した文書を、もう一度**はじめから全部**、\nモデルに読ませる。' },
    { at: 11.2, to: 18, text: 'モデルは結果を読んで、答えを書く。\nモデルにとっては、ツールの結果も文書の中の文字。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 30, gap: 22 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    appFrame(ctx, L, base);
    // what the app is doing, step by step
    NOTES.forEach(([at, s], i) => {
      const next = NOTES[i + 1]?.[0] ?? Infinity;
      const a = (i === 0 ? base : tw(t, at, 0.5)) * (1 - seg(t, next - 0.3, next));
      text(ctx, s, L.app.x + 120, L.app.y + 39, { font: F.jp(500, 18), color: C.ink2, alpha: a });
    });
    channel(ctx, L.read, base, { hot: t >= READ && t < WRITE });
    channel(ctx, L.write, base, { hot: t >= WRITE - 0.2 && t < DONE });
    channel(ctx, L.call, base, { hot: t >= SEND - 0.2 && t < RUN + 0.2 });
    channel(ctx, L.back, base, { hot: t >= BACK - 0.2 && t < BACK + 0.8 });

    // ——— the document
    const shows = [0.1, 0.2, 0.3, BACK + 0.85, WRITE];
    E.forEach((e, i) => {
      if (i < 4) {
        docEntry(ctx, e, tw(t, shows[i], 0.4), { hot: i === 2 && t >= SEND - 0.3 && t < RUN + 0.3 });
      } else if (t >= BACK + 1.2) {
        // the answer's turn opens empty, then fills as the model writes
        docEntry(ctx, e, tw(t, BACK + 1.2, 0.4), { chars: seg(t, WRITE, DONE - 0.4) });
      }
    });
    const ans = E[4];
    if (t >= BACK + 1.2 && t < DONE && Math.floor(t * 2.5) % 2 === 0) {
      const p = seg(t, WRITE, DONE - 0.4);
      const shown = Array.from(ans.rows[0]).slice(0, Math.round(Array.from(ans.rows[0]).length * p)).join('');
      const w = measure(ctx, ans.font, shown);
      ctx.fillStyle = C.accent;
      ctx.fillRect(ans.tx + w + 3, ans.y + 1, 4, 26);
    }
    // the second read covers everything written so far, the result included
    sweep(ctx, L, seg(t, READ, READ + 1.6), docEnd(E, 4));
    send(ctx, L.read, seg(t, READ + 0.9, READ + 1.7), '', 'doc');
    // the result, called out at the end
    const r = E[3];
    const k = tw(t, 11.6, 0.6);
    if (k > 0) {
      ctx.save();
      ctx.globalAlpha = k;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      rr(ctx, r.tx - 5, r.y - 5, r.w + 10, r.h + 10, 11);
      ctx.stroke();
      ctx.restore();
      text(ctx, '↑ モデルが知る今の気温は、この文字だけ', r.tx, r.y + r.h + 38, { font: F.jp(700, 19), color: C.green, alpha: k });
    }

    // ——— what the app received, sent on to the tool
    const ca = base * (1 - tw(t, RUN + 0.6, 0.6));
    if (ca > 0) {
      ctx.save();
      ctx.globalAlpha = ca;
      rr(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 14);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
      text(ctx, 'アプリが受け取った呼び出し', CARD.x + 20, CARD.y + 38, { font: F.jp(700, 19), color: C.accent, alpha: ca });
      RECEIVED.forEach((s, i) => jsonLine(ctx, s, CARD.x + 20, CARD.y + 80 + i * 30, { font: F.mono(500, 17), alpha: ca }));
    }

    // ——— the model and the tool
    const glow = seg(t, READ + 1.6, READ + 1.9) * (1 - seg(t, DONE, DONE + 0.3));
    llmBlock(ctx, L, base, { glow });
    stopBadge(ctx, L, base * (1 - tw(t, READ - 0.4, 0.4)), 'tool_use');
    stopBadge(ctx, L, tw(t, DONE, 0.4, (p) => outBack(p, 1.6)), 'end_turn', false);
    const runP = seg(t, RUN, BACK);
    toolBox(ctx, L, base, { glow: runP > 0 && runP < 1 ? 1 : 0, draw: toolList(['get_weather', 'search_web', 'calculate'], 0, tw(t, SEND, 0.4) * (1 - tw(t, BACK + 0.6, 0.5))) });
    working(ctx, L, runP);
    // the input goes from the call into the tool; the result comes back to its place
    const call = E[2];
    const tc = [L.tool.x + L.tool.w / 2, L.tool.y + L.tool.h / 2];
    flow(ctx, [[call.tx + call.w - 120, call.y + call.h / 2], [L.call.x1, L.call.y], [L.call.x2, L.call.y], tc], seg(t, SEND, SEND + 0.9), '{"city": "東京"}', 'call');
    flow(ctx, [tc, [L.back.x1, L.back.y], [L.back.x2, L.back.y], [r.tx + 170, r.y + r.h / 2]], seg(t, BACK, BACK + 0.9), '{"temp_c": 18, "sky": "晴れ"}', 'data');
    const ra = tw(t, RUN, 0.4) * (1 - tw(t, BACK + 0.4, 0.4));
    text(ctx, '実行するのはアプリの側', L.tool.x + L.tool.w / 2, L.tool.y + L.tool.h + 44, { font: F.jp(700, 20), color: C.ink, align: 'center', alpha: ra });

    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '結果は説明のための例');
  },
});
