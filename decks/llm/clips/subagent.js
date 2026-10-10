// Another agent in the tool's place: the main model hands out three tasks at once; each child
// works in its own document, round after round, and returns only a short report, so the
// parent's document stays small. The tasks, reports and sizes are an example; the 2025 figures
// are Anthropic's report on its research system.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { BASE, mix, llmBlock, appFrame, toolBox, abstractTool, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge } from '../lib/rig.js';
import { text, rr, circle } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { hash } from '../../../src/kit/random.js';

const WIDE = {
  llm: BASE.llm,
  app: { x: 386, y: 100, w: 560, h: 712 },
  tool: { x: 1046, y: 150, w: 458, h: 560 },
};
const L = mix(BASE, WIDE, 1);
const ENTRIES = [
  { role: 'user', text: '競合 3 社の料金プランを調べて、\n表にまとめて。' },
  { role: 'assistant', kind: 'call', text: 'task: A 社の料金を調べて\ntask: B 社の料金を調べて\ntask: C 社の料金を調べて' },
  { role: 'result', kind: 'data', font: F.jp(500, 17), lh: 28, gap: 60, text: 'A 社：月 980 円から、3 プラン\nB 社：月 1,200 円から、2 プラン\nC 社：無料プランあり、月 1,500 円から' },
  { role: 'assistant', text: '3 社の料金を表にまとめました。' },
];
const KIDS = ['A 社', 'B 社', 'C 社'];
const T = { swap: 0.6, read: 1.6, call: 2.4, send: 3.0, work: 3.8, done: 8.4, back: 8.6, add: 9.4, read2: 9.6, answer: 10.4, fact: 11.6 };

export default clip({
  id: 'subagent',
  title: '子に任せる',
  kicker: 'サブエージェント',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'ツールの位置に、別のエージェントを置くこともできる。\n依頼を受けた子は、自分の文書を持って働き始める。' },
    { at: 5.8, to: 11.4, text: '子が返すのは、短い報告だけ。\n親の文書は、子の長い作業でふくらまない。' },
    { at: 11.6, to: 18, text: '2025 年 6 月、Anthropic は、子を並べた構成の成績が\n単独より 90.2% 高かったと報告した（社内の評価）。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 26, gap: 18, mono: F.mono(500, 16), lhMono: 26 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    const grow = inOutCubic(seg(t, T.swap, T.swap + 0.9));
    const G = mix(BASE, WIDE, grow);
    appFrame(ctx, G, base, { name: 'ハーネス', note: '親のエージェント', noteAlpha: tw(t, T.swap + 0.6, 0.5) });
    channel(ctx, G.read, base);
    channel(ctx, G.write, base);
    channel(ctx, G.call, base, { label: '依頼', labelAlpha: grow });
    channel(ctx, G.back, base, { label: '報告', labelAlpha: grow });

    // ——— the parent's document: three tasks out, three short reports back
    const appear = [0.4, T.call + 0.3, T.add, T.answer];
    E.forEach((e, i) => {
      if (grow < 1 && i > 0) return;
      docEntry(ctx, e, tw(t, appear[i], 0.4), { chars: i === 3 ? seg(t, T.answer, T.answer + 0.8) : 1 });
    });
    sweep(ctx, L, seg(t, T.read, T.read + 0.7), docEnd(E, 1));
    send(ctx, L.read, seg(t, T.read + 0.2, T.read + 0.7), '', 'doc');
    send(ctx, L.write, seg(t, T.call - 0.4, T.call + 0.3), '依頼 ×3', 'call');
    sweep(ctx, L, seg(t, T.read2, T.read2 + 0.7), docEnd(E, 3));
    send(ctx, L.read, seg(t, T.read2 + 0.2, T.read2 + 0.7), '', 'doc');
    // the parent's size, which stays small
    const pa = tw(t, T.add + 0.4, 0.5);
    text(ctx, '↑ 親の文書に入るのは、報告の 3 行だけ', E[2].tx, E[2].y + E[2].h + 36, { font: F.jp(700, 17), color: C.green, alpha: pa });

    // ——— the model
    llmBlock(ctx, L, base, { glow: seg(t, T.read + 0.6, T.read + 0.8) * (1 - seg(t, T.call + 0.3, T.call + 0.5)) + seg(t, T.read2 + 0.6, T.read2 + 0.8) * (1 - seg(t, T.answer + 0.8, T.answer + 1.0)) });
    stopBadge(ctx, L, tw(t, T.call + 0.3, 0.3, (p) => outBack(p, 1.6)) * (1 - tw(t, T.add, 0.3)), 'tool_use');
    stopBadge(ctx, L, tw(t, T.answer + 0.8, 0.3, (p) => outBack(p, 1.6)), 'end_turn', false);

    // ——— three children in the tool's place
    toolBox(ctx, G, base, {
      solid: grow,
      label: 'ツールの位置',
      labelAlpha: grow,
      draw: (cx, b, a) => {
        abstractTool(cx, b, a * (1 - seg(grow, 0, 0.4)));
        const s = a * seg(grow, 0.5, 1);
        if (s <= 0.001) return;
        text(cx, 'サブエージェント', b.x + 20, b.y + 38, { font: F.jp(700, 22), color: C.ink, alpha: s });
        text(cx, 'それぞれ自分の文書で', b.x + b.w - 20, b.y + 37, { font: F.jp(500, 15), color: C.ink2, align: 'right', alpha: s });
        KIDS.forEach((name, i) => kid(cx, b.x + 16, b.y + 58 + i * 164, b.w - 32, 150, name, i, t, s));
      },
    });
    KIDS.forEach((_, i) => {
      const ky = L.tool.y + 58 + i * 164 + 75;
      const call = E[1];
      const res = E[2];
      flow(ctx, [[call.tx + 280, call.y + 16 + i * 26], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [L.tool.x + 40, ky]], seg(t, T.send + i * 0.12, T.work + i * 0.12), KIDS[i], 'call');
      flow(ctx, [[L.tool.x + 40, ky], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [res.tx + 200, res.y + 22 + i * 28]], seg(t, T.back + i * 0.12, T.add + i * 0.12), '報告', 'data');
    });

    // ——— what Anthropic reported
    const f = tw(t, T.fact, 0.6);
    if (f > 0) {
      const x = L.llm.x;
      const y = L.llm.y + L.llm.h + 56;
      text(ctx, '2025 年 6 月 13 日　Anthropic', x, y, { font: F.jp(700, 16), color: C.ink, alpha: f });
      text(ctx, '親 Opus 4 ＋ 子 Sonnet 4', x, y + 24, { font: F.jp(500, 15), color: C.ink2, alpha: f });
      const g = tw(t, T.fact + 0.3, 0.6);
      text(ctx, '+90.2%', x, y + 76, { font: F.cond(700, 50), color: C.accent, alpha: g });
      text(ctx, '単独の Opus 4 より（社内の評価）', x, y + 100, { font: F.jp(500, 14), color: C.ink2, alpha: g });
      const h = tw(t, T.fact + 0.6, 0.6);
      text(ctx, '約 15 倍', x, y + 142, { font: F.cond(700, 34), color: C.ink, alpha: h });
      text(ctx, 'トークンの量（チャット比）', x, y + 166, { font: F.jp(500, 14), color: C.ink2, alpha: h });
    }
    text(ctx, '2025 年 7 月 24 日、Claude Code に自作の子エージェントの機能', L.tool.x, L.tool.y + L.tool.h + 40, { font: F.jp(500, 15), color: C.muted, alpha: tw(t, T.fact + 0.9, 0.5) });
    source(ctx, 'Anthropic（2025-06-13、2025-07-24）', f);
    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '依頼・報告・大きさは説明のための例');
  },
});

// One child agent, drawn small: its own model, its own document filling up, its own tool, and
// how much it read. Works from T.work to T.done; i staggers the three.
function kid(ctx, x, y, w, h, name, i, t, a) {
  const work = seg(t, T.work + i * 0.2, T.done - 0.3 + i * 0.1);
  const on = work > 0 && work < 1;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, w, h, 12);
  ctx.fillStyle = C.panel;
  ctx.fill();
  if (on) {
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, `子：${name}`, x + 14, y + 26, { font: F.jp(700, 16), color: C.ink, alpha: a });
  // the child's model
  const pulse = on ? 0.5 + 0.5 * Math.sin(t * 9 + i) : 0;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x + 14, y + 44, 60, 60, 10);
  ctx.fillStyle = C.ink;
  ctx.fill();
  if (pulse > 0) {
    ctx.strokeStyle = C.accent;
    ctx.globalAlpha = a * pulse;
    ctx.lineWidth = 3;
    rr(ctx, x + 10, y + 40, 68, 68, 13);
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, 'LLM', x + 44, y + 80, { font: F.sans(700, 17), color: C.paper, align: 'center', alpha: a });
  // its document, filling with its own rounds
  const dx = x + 90;
  const dw = w - 236;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, dx, y + 36, dw, h - 48, 6);
  ctx.fillStyle = '#fff';
  ctx.fill();
  const lines = Math.floor(work * 14);
  for (let k = 0; k < lines; k++) {
    const row = k % 7;
    const col = Math.floor(k / 7);
    const lw = (dw / 2 - 18) * (0.45 + 0.5 * hash(i * 31 + k * 7));
    ctx.fillStyle = k % 2 === 0 ? C.accentSoft : '#d8eedf';
    ctx.fillRect(dx + 8 + col * (dw / 2), y + 44 + row * 13, lw, 8);
  }
  ctx.restore();
  // its tool
  const tx = x + w - 92;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, tx, y + 50, 80, 32, 8);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = on && Math.floor(t * 4 + i) % 2 === 0 ? C.accent : C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'search', tx + 40, y + 71, { font: F.mono(500, 14), color: C.ink, align: 'center', alpha: a });
  // how much it read
  const k = Math.round(work * 18);
  text(ctx, `${(k * 1000).toLocaleString('en-US')} トークン`, x + w - 12, y + 116, { font: F.cond(700, 16), color: C.ink2, align: 'right', alpha: a * (work > 0 ? 1 : 0) });
  if (work >= 1) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = C.green;
    circle(ctx, x + w - 18, y + 18, 8);
    ctx.fill();
    ctx.restore();
  }
}
