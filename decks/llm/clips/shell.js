// The command line in the tool's place: one tool, bash, whose input is a command and whose
// result is that command's output. Both are text, which the model writes and reads as it is,
// and behind the one tool stand all the programs on the computer. The question, commands and
// outputs are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, tag } from '../lib/parts.js';
import { BASE, mix, llmBlock, appFrame, toolBox, abstractTool, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge } from '../lib/rig.js';
import { text, measure } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const TALL = { ...BASE, tool: { x: 1206, y: 262, w: 298, h: 390 } };
const L = mix(BASE, TALL, 1);
const ENTRIES = [
  { role: 'system', text: '使えるツール：bash（コマンドを実行する）' },
  { role: 'user', text: '今日の日付と、2 の 64 乗を教えて。' },
  { role: 'assistant', kind: 'call', text: '{"name": "bash", "input": {"command":\n "date"}}' },
  { role: 'result', kind: 'data', text: 'Sat Oct 10 09:41:07 JST 2026' },
  { role: 'assistant', kind: 'call', text: '{"name": "bash", "input": {"command":\n "python3 -c \'print(2**64)\'"}}' },
  { role: 'result', kind: 'data', text: '18446744073709551616' },
  { role: 'assistant', text: '今日は 2026 年 10 月 10 日。\n2 の 64 乗は 18446744073709551616 です。' },
];
// what the terminal shows, and when each line appears
const TERM = [
  ['$ date', 0],
  ['Sat Oct 10 09:41:07 JST 2026', 0],
  ['$ python3 -c \'print(2**64)\'', 1],
  ['18446744073709551616', 1],
];
// programs behind the shell, flowed in rows above and below it
const ABOVE = ['git', 'python3', 'node', 'curl', 'grep', 'sed', 'jq'];
const BELOW = ['sqlite3', 'ffmpeg', 'docker', 'make', 'ssh', 'pandoc', '…'];
const CHIP = { font: F.mono(500, 16), h: 34, padX: 10, r: 8 };
const SWAP = 1.2;
const ROUNDS = [2.6, 5.8];
const R = { write: 0.8, out: 1.3, run: 1.8, back: 2.3, add: 2.9 };
const ANSWER = 9.6;
const MORE = 11.4;

export default clip({
  id: 'shell',
  title: 'コマンドを打つ',
  kicker: 'CLI（コマンドライン）',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'ツールの位置に、コンピュータの**シェル**を置く。\n入力はコマンド、結果はその出力。' },
    { at: 5.8, to: 11.2, text: 'コマンドも出力も文字なので、\nモデルはそのまま書けて、そのまま読める。' },
    { at: 11.4, to: 18, text: 'ツールは一つでも、その先には、\nコンピュータにある何千ものプログラムがある。' },
  ],

  prepare(ctx) {
    const flowRows = (names, y0) => {
      let x = L.tool.x;
      let y = y0;
      return names.map((name) => {
        const w = measure(ctx, CHIP.font, name) + CHIP.padX * 2;
        if (x + w > L.tool.x + L.tool.w) {
          x = L.tool.x;
          y += 44;
        }
        const out = { name, x, y };
        x += w + 8;
        return out;
      });
    };
    const programs = [...flowRows(ABOVE, 136), ...flowRows(BELOW, L.tool.y + L.tool.h + 22)];
    return { E: docLayout(ctx, L, ENTRIES, { top: 24, gap: 14, mono: F.mono(500, 16), lhMono: 26 }), programs };
  },

  draw(ctx, t, { E, programs }) {
    const base = tw(t, 0, 0.5);
    const grow = inOutCubic(seg(t, SWAP, SWAP + 1.0));
    const G = mix(BASE, TALL, grow);
    appFrame(ctx, G, base, { note: 'コマンドを実行して、出力を返す', noteAlpha: tw(t, SWAP + 0.8, 0.5) });
    channel(ctx, G.read, base);
    channel(ctx, G.write, base);
    channel(ctx, G.call, base, { label: 'コマンド', labelAlpha: grow });
    channel(ctx, G.back, base, { label: '出力', labelAlpha: grow });

    // ——— the document
    const appear = [0.5, 0.8, ROUNDS[0] + R.write + 0.6, ROUNDS[0] + R.add, ROUNDS[1] + R.write + 0.6, ROUNDS[1] + R.add, ANSWER];
    E.forEach((e, i) => docEntry(ctx, e, tw(t, appear[i], 0.4), { chars: i === 6 ? seg(t, ANSWER, ANSWER + 1.2) : 1 }));
    ROUNDS.forEach((r, k) => {
      sweep(ctx, L, seg(t, r, r + 0.7), docEnd(E, 2 + 2 * k));
      send(ctx, L.read, seg(t, r + 0.15, r + 0.7), '', 'doc');
      send(ctx, L.write, seg(t, r + R.write, r + R.write + 0.6), '呼び出し', 'call');
    });
    sweep(ctx, L, seg(t, ANSWER - 0.9, ANSWER - 0.2), docEnd(E, 6));
    send(ctx, L.read, seg(t, ANSWER - 0.75, ANSWER - 0.2), '', 'doc');

    // ——— the model
    const glow = Math.max(...ROUNDS.map((r) => seg(t, r + 0.6, r + 0.8) * (1 - seg(t, r + R.write + 0.6, r + R.write + 0.8))), seg(t, ANSWER - 0.3, ANSWER) * (1 - seg(t, ANSWER + 1.2, ANSWER + 1.5)));
    llmBlock(ctx, L, base, { glow });
    ROUNDS.forEach((r) => stopBadge(ctx, L, tw(t, r + R.write + 0.6, 0.3, (p) => outBack(p, 1.6)) * (1 - tw(t, r + R.add, 0.3)), 'tool_use'));
    stopBadge(ctx, L, tw(t, ANSWER + 1.2, 0.3, (p) => outBack(p, 1.6)), 'end_turn', false);

    // ——— the shell in the tool's place
    toolBox(ctx, G, base, {
      solid: grow,
      fill: grow > 0.5 ? C.ink : '#fff',
      label: 'ツールの位置',
      labelAlpha: grow,
      draw: (cx, b, a) => {
        abstractTool(cx, b, a * (1 - seg(grow, 0, 0.4)));
        const s = a * seg(grow, 0.5, 1);
        if (s <= 0.001) return;
        text(cx, 'シェル（bash）', b.x + 20, b.y + 38, { font: F.jp(700, 22), color: C.paper, alpha: s });
        cx.save();
        cx.globalAlpha = s;
        cx.fillStyle = '#3b3732';
        cx.fillRect(b.x + 16, b.y + 56, b.w - 32, 1.5);
        cx.restore();
        TERM.forEach(([line, k], i) => {
          const at = ROUNDS[k] + (line.startsWith('$') ? R.run - 0.2 : R.run + 0.25);
          const typed = line.startsWith('$') ? seg(t, at, at + 0.4) : 1;
          const la = tw(t, at, 0.2);
          if (la <= 0) return;
          const shown = Array.from(line).slice(0, Math.round(Array.from(line).length * typed)).join('');
          text(cx, shown, b.x + 20, b.y + 94 + i * 30, { font: F.mono(500, 15), color: line.startsWith('$') ? '#e9e5dc' : '#6fd39a', alpha: s * la });
        });
        const cur = t < ROUNDS[0] + R.run - 0.2 ? 0 : t < ROUNDS[1] + R.run - 0.2 ? 2 : 4;
        if (Math.floor(t * 2.5) % 2 === 0) {
          cx.fillStyle = C.accent;
          cx.globalAlpha = s;
          cx.fillRect(b.x + 20, b.y + 80 + cur * 30, 10, 18);
          cx.globalAlpha = 1;
        }
      },
    });
    ROUNDS.forEach((r, k) => {
      const call = E[2 + 2 * k];
      const res = E[3 + 2 * k];
      flow(ctx, [[call.tx + 220, call.y + call.h / 2], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [L.tool.x + 30, L.call.y]], seg(t, r + R.out, r + R.run), k === 0 ? 'date' : 'python3 …', 'call');
      flow(ctx, [[L.tool.x + 30, L.back.y], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [res.tx + 120, res.y + res.h / 2]], seg(t, r + R.back, r + R.add), '出力', 'data');
    });

    // ——— behind the one tool, every program on the computer
    programs.forEach((p, i) => {
      const a = tw(t, MORE + 0.15 + i * 0.06, 0.4, (q) => outBack(q, 1.6));
      tag(ctx, p.x, p.y, p.name, { ...CHIP, fill: C.panel, color: C.ink, alpha: Math.min(1, a) });
    });
    text(ctx, 'その先のプログラム', L.tool.x, 118, { font: F.jp(700, 18), color: C.muted, alpha: tw(t, MORE, 0.5) });

    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '質問・コマンド・出力は説明のための例');
  },
});
