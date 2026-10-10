// An agent: the shell in the loop, given a goal instead of a question. The model reads each
// output and decides the next command from it, round after round, until it can report. The
// task, commands and outputs are an example; the 2025 releases are facts.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { BASE, mix, llmBlock, appFrame, toolBox, channel, docLayout, docEntry, docEnd, rowAt, sweep, send, flow, stopBadge } from '../lib/rig.js';
import { text, rr, measure, quadPoints, path, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const L = mix(BASE, { ...BASE, tool: { x: 1206, y: 262, w: 298, h: 390 } }, 1);
const MONO = F.mono(500, 15);
const ENTRIES = [
  { role: 'user', text: 'ログを調べて、エラーが多い日と原因を教えて。' },
  { role: 'assistant', kind: 'call', text: 'bash: grep -c ERROR logs/*.log' },
  { role: 'result', kind: 'data', text: 'logs/2026-10-06.log:3\nlogs/2026-10-07.log:41\nlogs/2026-10-08.log:5' },
  { role: 'assistant', kind: 'call', text: 'bash: grep ERROR logs/2026-10-07.log | head -3' },
  { role: 'result', kind: 'data', text: 'ERROR db: timeout after 30s（3 行とも同じ）' },
  { role: 'assistant', kind: 'call', text: 'bash: grep -c "db: timeout" logs/2026-10-07.log' },
  { role: 'result', kind: 'data', text: '38' },
  { role: 'assistant', text: '10 月 7 日が 41 件で最多。うち 38 件は、\nデータベースの時間切れでした。' },
];
// the terminal: [line, round]
const TERM = [
  ['$ grep -c ERROR logs/*.log', 0],
  ['…06.log:3  …07.log:41  …08.log:5', 0],
  ['$ grep ERROR logs/2026-10-07.log', 1],
  ['ERROR db: timeout after 30s', 1],
  ['$ grep -c "db: timeout" …07.log', 2],
  ['38', 2],
];
// what each new command took from the output before it: [result entry, row, text; call entry, text]
const LINKS = [
  [2, 1, 'logs/2026-10-07.log:41', 3, '2026-10-07'],
  [4, 0, 'db: timeout', 5, 'db: timeout'],
];
const HL = { from: ['logs/2026-10-07.log:41', 'db: timeout'], to: ['2026-10-07', 'db: timeout'] };
const R0 = 1.0;
const ROUND = 3.0;
const S = { write: 0.6, add: 0.8, out: 1.1, run: 1.5, back: 1.9, result: 2.5 };
const ANSWER = R0 + 3 * ROUND + 0.8;
const FACT = 12.2;
const RELEASES = [
  ['2 月 24 日', 'Claude Code', '限定の研究プレビュー'],
  ['4 月 16 日', 'Codex CLI', 'オープンソース'],
  ['6 月 25 日', 'Gemini CLI', 'オープンソース'],
];

const at = (k, step) => R0 + k * ROUND + S[step];

export default clip({
  id: 'agent',
  title: '自分で動く',
  kicker: 'エージェント',
  duration: 17.5,
  cues: [
    { at: 0.4, to: 5.6, text: 'シェルを持たせて、目的だけを渡す。\n調べる手順は、モデルが一つずつ決めていく。' },
    { at: 5.8, to: 11.8, text: '前の出力を読んで、次のコマンドを決める。\n目的を果たすまで、ループを回し続ける。' },
    { at: 12.0, to: 18.5, text: 'こうして自分で動くものを**エージェント**と呼ぶ。\n2025 年には、端末で動くエージェントが次々に公開された。' },
  ],

  prepare(ctx) {
    const E = docLayout(ctx, L, ENTRIES, { top: 22, gap: 14, mono: MONO, lhMono: 24, font: F.jp(500, 21), lh: 32 });
    // the spans each link joins, in stage coordinates
    const span = (e, row, s) => {
      const at = rowAt(e, row);
      const line = e.rows[row];
      const i = line.indexOf(s);
      return { x: at.x + measure(ctx, e.font, line.slice(0, i)), w: measure(ctx, e.font, s), y: at.y };
    };
    const links = LINKS.map(([a, row, s, b, s2]) => ({ from: span(E[a], row, s), to: span(E[b], 0, s2) }));
    return { E, links };
  },

  draw(ctx, t, { E, links }) {
    const base = tw(t, 0, 0.5);
    appFrame(ctx, L, base, { note: '目的を果たすまで、ループを回す' });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base);
    channel(ctx, L.call, base, { label: 'コマンド' });
    channel(ctx, L.back, base, { label: '出力' });

    // ——— the document, round by round
    const appear = [0.5, at(0, 'add'), at(0, 'result'), at(1, 'add'), at(1, 'result'), at(2, 'add'), at(2, 'result'), ANSWER];
    E.forEach((e, i) => docEntry(ctx, e, tw(t, appear[i], 0.35), { chars: i === 7 ? seg(t, ANSWER, ANSWER + 1.3) : 1 }));
    for (let k = 0; k < 4; k++) {
      const r = R0 + k * ROUND;
      sweep(ctx, L, seg(t, r - 0.1, r + 0.5), docEnd(E, 1 + 2 * k));
      send(ctx, L.read, seg(t, r, r + 0.5), '', 'doc');
      if (k < 3) send(ctx, L.write, seg(t, r + S.write - 0.35, r + S.add), '呼び出し', 'call');
    }
    // the decisions: a piece of one output reappears in the next command
    links.forEach(({ from, to }, i) => {
      const p = tw(t, at(i + 1, 'add') - 0.15, 0.7, inOutCubic);
      if (p <= 0) return;
      ctx.save();
      ctx.fillStyle = C.accentSoft;
      ctx.globalAlpha = Math.min(1, p * 2);
      rr(ctx, from.x - 3, from.y - 17, from.w + 6, 23, 4);
      ctx.fill();
      rr(ctx, to.x - 3, to.y - 17, to.w + 6, 23, 4);
      ctx.fill();
      ctx.restore();
      text(ctx, HL.from[i], from.x, from.y, { font: MONO, color: C.ink });
      text(ctx, HL.to[i], to.x, to.y, { font: MONO, color: C.ink, alpha: tw(t, at(i + 1, 'add'), 0.35) });
      const x1 = from.x + from.w + 8;
      const y1 = from.y - 6;
      const x2 = to.x + to.w * 0.7;
      const y2 = to.y - 20;
      const cx = Math.max(x1, x2) + 60;
      ctx.save();
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 2.5;
      const end = path(ctx, quadPoints(x1, y1, cx, (y1 + y2) / 2, x2, y2, 30), p);
      if (end && p > 0.95) arrowHead(ctx, end.x, end.y, end.a, 11);
      ctx.restore();
    });

    // ——— the model, and the round it is on
    const round = t < R0 ? 0 : Math.min(4, Math.floor((t - R0) / ROUND) + 1);
    const glow = [0, 1, 2, 3].reduce((g, k) => Math.max(g, seg(t, R0 + k * ROUND + 0.4, R0 + k * ROUND + 0.55) * (1 - seg(t, k === 3 ? ANSWER + 1.3 : at(k, 'add'), (k === 3 ? ANSWER + 1.3 : at(k, 'add')) + 0.2))), 0);
    llmBlock(ctx, L, base, { glow });
    [0, 1, 2].forEach((k) => stopBadge(ctx, L, tw(t, at(k, 'add'), 0.25, (p) => outBack(p, 1.6)) * (1 - tw(t, at(k, 'result'), 0.25)), 'tool_use'));
    stopBadge(ctx, L, tw(t, ANSWER + 1.3, 0.3, (p) => outBack(p, 1.6)), 'end_turn', false);
    const ca = base * (1 - tw(t, FACT - 0.4, 0.4));
    if (round > 0 && ca > 0) {
      const x = L.llm.x;
      const y = L.llm.y + L.llm.h + 60;
      text(ctx, 'ループ', x, y, { font: F.jp(700, 19), color: C.ink2, alpha: ca });
      const w = text(ctx, String(round), x, y + 84, { font: F.cond(700, 92), color: C.accent, alpha: ca });
      text(ctx, '周目', x + w + 8, y + 82, { font: F.jp(700, 22), color: C.ink, alpha: ca });
    }

    // ——— the shell
    toolBox(ctx, L, base, {
      solid: 1,
      fill: C.ink,
      label: 'ツールの位置',
      draw: (cx, b, a) => {
        text(cx, 'シェル（bash）', b.x + 20, b.y + 38, { font: F.jp(700, 22), color: C.paper, alpha: a });
        cx.save();
        cx.globalAlpha = a;
        cx.fillStyle = '#3b3732';
        cx.fillRect(b.x + 16, b.y + 56, b.w - 32, 1.5);
        cx.restore();
        TERM.forEach(([line, k], i) => {
          const cmd = line.startsWith('$');
          const t0 = at(k, 'run') + (cmd ? -0.2 : 0.2);
          const la = tw(t, t0, 0.2);
          if (la <= 0) return;
          const chars = Array.from(line);
          const shown = cmd ? chars.slice(0, Math.round(chars.length * seg(t, t0, t0 + 0.35))).join('') : line;
          text(cx, shown, b.x + 18, b.y + 92 + i * 30, { font: F.mono(500, 13), color: cmd ? '#e9e5dc' : '#6fd39a', alpha: a * la });
        });
      },
    });
    [0, 1, 2].forEach((k) => {
      const call = E[1 + 2 * k];
      const res = E[2 + 2 * k];
      flow(ctx, [[call.tx + 260, call.y + call.h / 2], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [L.tool.x + 30, L.call.y]], seg(t, at(k, 'out'), at(k, 'run')), 'grep …', 'call');
      flow(ctx, [[L.tool.x + 30, L.back.y], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [res.tx + 100, res.y + res.h / 2]], seg(t, at(k, 'back'), at(k, 'result')), '出力', 'data');
    });

    // ——— 2025: agents that run in the terminal
    const f = tw(t, FACT, 0.6);
    if (f > 0) {
      const x = L.llm.x;
      const y = L.llm.y + L.llm.h + 62;
      text(ctx, '2025 年、端末で動くエージェント', x, y, { font: F.jp(700, 17), color: C.ink, alpha: f });
      RELEASES.forEach(([date, name, note], i) => {
        const a = tw(t, FACT + 0.2 + i * 0.2, 0.5);
        const yy = y + 44 + i * 62;
        text(ctx, date, x, yy, { font: F.jp(500, 16), color: C.ink2, alpha: a });
        text(ctx, name, x + 92, yy, { font: F.sans(600, 21), color: C.accent, alpha: a });
        text(ctx, note, x + 92, yy + 25, { font: F.jp(400, 15), color: C.muted, alpha: a });
      });
    }
    source(ctx, 'Anthropic（2025-02-24）、OpenAI（2025-04-16）、Google（2025-06-25）', f);
    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '依頼・コマンド・出力は説明のための例');
  },
});
