// The screen in the tool's place: the result is a picture of the screen, the input is a click
// at a position or some typing. The model looks at each picture and writes where to act next,
// so a screen made for people becomes a tool. The task, the form and the coordinates are an
// example; the release and the OSWorld numbers are facts.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { BASE, mix, llmBlock, appFrame, toolBox, abstractTool, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge } from '../lib/rig.js';
import { text, rr, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack } from '../../../src/kit/ease.js';

const WIDE = {
  llm: BASE.llm,
  app: { x: 386, y: 100, w: 560, h: 712 },
  tool: { x: 1046, y: 250, w: 458, h: 400 },
};
const L = mix(BASE, WIDE, 1);
const MONO = F.mono(500, 15);
const SHOT = '（画面の画像）';
const ENTRIES = [
  { role: 'user', text: '10 月 15 日 14 時で、\n会議室を予約して。' },
  { role: 'assistant', kind: 'call', text: 'computer: screenshot' },
  { role: 'result', kind: 'data', text: `       ${SHOT}` },
  { role: 'assistant', kind: 'call', text: 'computer: click (412, 236)' },
  { role: 'result', kind: 'data', text: `       ${SHOT}` },
  { role: 'assistant', kind: 'call', text: 'computer: type "10/15 14:00"' },
  { role: 'result', kind: 'data', text: `       ${SHOT}` },
  { role: 'assistant', kind: 'call', text: 'computer: click (520, 410)' },
  { role: 'result', kind: 'data', text: `       ${SHOT}` },
  { role: 'assistant', text: '予約しました（10 月 15 日 14:00）。' },
];
const R0 = 1.6;
const ROUND = 2.2;
const S = { write: 0.45, add: 0.8, out: 0.85, act: 1.15, back: 1.6, result: 2.0 };
const ANSWER = R0 + 4 * ROUND + 0.6;
const FACT = 11.4;
const at = (k, step) => R0 + k * ROUND + S[step];

// the form on the screen, relative to the screen's top-left
const SCR = { dx: 16, dy: 58, w: 426, h: 300 };
const FIELD = { x: 120, y: 92, w: 230, h: 40 };
const BUTTON = { x: 120, y: 214, w: 150, h: 44 };

export default clip({
  id: 'gui',
  title: '画面を操作する',
  kicker: 'コンピュータ操作',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'ツールの位置に、**画面**を置く。\n結果は画面の画像、入力はクリックや文字の入力。' },
    { at: 5.8, to: 11.2, text: 'モデルは画像を見て、どこを押すかを座標で書く。\n人のために作られた画面も、ツールとして使える。' },
    { at: 11.4, to: 18, text: '2024 年 10 月、Anthropic がこの使い方を公開ベータにした。\n課題集 OSWorld では、人の 72% に対し、当時は 15%。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 22, gap: 11, mono: MONO, lhMono: 24, font: F.jp(500, 21), lh: 32 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    const grow = inOutCubic(seg(t, 0.6, 1.5));
    const G = mix(BASE, WIDE, grow);
    appFrame(ctx, G, base, { note: '画像を返し、操作を実行する', noteAlpha: tw(t, 1.4, 0.5) });
    channel(ctx, G.read, base);
    channel(ctx, G.write, base);
    channel(ctx, G.call, base, { label: '操作', labelAlpha: grow });
    channel(ctx, G.back, base, { label: '画像', labelAlpha: grow });

    // ——— the document
    const appear = [0.4, ...[0, 1, 2, 3].flatMap((k) => [at(k, 'add'), at(k, 'result')]), ANSWER];
    E.forEach((e, i) => {
      const a = tw(t, appear[i], 0.35);
      if (grow < 1 && i > 0) return;
      docEntry(ctx, e, a, { chars: i === 9 ? seg(t, ANSWER, ANSWER + 1.0) : 1 });
      // a result is a picture: a small thumbnail of the screen at that moment
      if (e.role === 'result' && a > 0) thumb(ctx, e.tx + 16, e.y + 7, (i - 2) / 2, a);
    });
    for (let k = 0; k < 5; k++) {
      const r = R0 + k * ROUND;
      sweep(ctx, L, seg(t, r - 0.1, r + 0.35), docEnd(E, 1 + 2 * k));
      send(ctx, L.read, seg(t, r - 0.05, r + 0.35), '', 'doc');
      if (k < 4) send(ctx, L.write, seg(t, r + S.write - 0.1, r + S.add), '操作', 'call');
    }

    // ——— the model
    const glow = [0, 1, 2, 3, 4].reduce((g, k) => {
      const r = R0 + k * ROUND;
      const end = k === 4 ? ANSWER + 1.0 : at(k, 'add');
      return Math.max(g, seg(t, r + 0.3, r + 0.4) * (1 - seg(t, end, end + 0.15)));
    }, 0);
    llmBlock(ctx, L, base, { glow });
    [0, 1, 2, 3].forEach((k) => stopBadge(ctx, L, tw(t, at(k, 'add'), 0.2, (p) => outBack(p, 1.6)) * (1 - tw(t, at(k, 'result'), 0.2)), 'tool_use'));
    stopBadge(ctx, L, tw(t, ANSWER + 1.0, 0.3, (p) => outBack(p, 1.6)), 'end_turn', false);

    // ——— the screen in the tool's place
    toolBox(ctx, G, base, {
      solid: grow,
      label: 'ツールの位置',
      labelAlpha: grow,
      draw: (cx, b, a) => {
        abstractTool(cx, b, a * (1 - seg(grow, 0, 0.4)));
        const s = a * seg(grow, 0.5, 1);
        if (s <= 0.001) return;
        text(cx, '画面', b.x + 20, b.y + 38, { font: F.jp(700, 24), color: C.ink, alpha: s });
        text(cx, '1280 × 800', b.x + b.w - 20, b.y + 37, { font: F.mono(500, 15), color: C.muted, align: 'right', alpha: s });
        screen(cx, b.x + SCR.dx, b.y + SCR.dy, t, s);
      },
    });
    [0, 1, 2, 3].forEach((k) => {
      const call = E[1 + 2 * k];
      const res = E[2 + 2 * k];
      flow(ctx, [[call.tx + 200, call.y + call.h / 2], [L.call.x1, L.call.y], [L.call.x2, L.call.y], [L.tool.x + 30, L.call.y]], seg(t, at(k, 'out'), at(k, 'act')), ['screenshot', 'click', 'type', 'click'][k], 'call');
      flow(ctx, [[L.tool.x + 30, L.back.y], [L.back.x1, L.back.y], [L.back.x2, L.back.y], [res.tx + 120, res.y + res.h / 2]], seg(t, at(k, 'back'), at(k, 'result')), '画像', 'data');
    });

    // ——— 2024: a public beta, and how hard it still was
    const f = tw(t, FACT, 0.6);
    if (f > 0) {
      const x = L.llm.x;
      const y = L.llm.y + L.llm.h + 50;
      text(ctx, '2024 年 10 月 22 日', x, y, { font: F.jp(700, 18), color: C.ink, alpha: f });
      text(ctx, 'Anthropic が公開ベータに', x, y + 27, { font: F.jp(500, 16), color: C.ink2, alpha: f });
      text(ctx, 'OSWorld（369 課題）の成功率', x, y + 66, { font: F.jp(700, 16), color: C.ink2, alpha: tw(t, FACT + 0.3, 0.5) });
      [['人', 72.36, C.ink], ['Claude', 14.9, C.accent]].forEach(([name, v, col], i) => {
        const g = tw(t, FACT + 0.5 + i * 0.25, 0.8);
        const yy = y + 84 + i * 36;
        text(ctx, name, x, yy + 19, { font: F.jp(700, 16), color: C.ink, alpha: g });
        ctx.fillStyle = col;
        ctx.globalAlpha = g;
        ctx.fillRect(x + 64, yy + 4, 150 * (v / 100) * g, 20);
        ctx.globalAlpha = 1;
        text(ctx, `${v >= 70 ? 72 : 15}%`, x + 64 + 150 * (v / 100) * g + 8, yy + 21, { font: F.cond(700, 20), color: col, alpha: g });
      });
      ['Claude 3.5 Sonnet（新）', '画像だけ、15 操作までの条件'].forEach((s, i) => text(ctx, s, x, y + 172 + i * 19, { font: F.jp(400, 14), color: C.muted, alpha: tw(t, FACT + 1.0, 0.5) }));
    }
    source(ctx, 'Anthropic（2024-10-22）、Xie ほか（2024）', f);
    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '依頼・画面・座標は説明のための例');
  },
});

// The booking form as it looks at time t: the cursor travels and clicks, the date is typed,
// the booking is confirmed. Drawn with its top-left at (x, y).
function screen(ctx, x, y, t, a) {
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, SCR.w, SCR.h, 10);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = C.panel;
  ctx.fillRect(x + 1, y + 1, SCR.w - 2, 34);
  ctx.restore();
  text(ctx, '会議室の予約', x + 16, y + 24, { font: F.jp(700, 16), color: C.ink, alpha: a });
  // fields
  const fx = x + FIELD.x;
  const fy = y + FIELD.y;
  text(ctx, '日時', x + 24, fy + 26, { font: F.jp(500, 16), color: C.ink2, alpha: a });
  const focus = t >= at(1, 'act') + 0.4;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, fx, fy, FIELD.w, FIELD.h, 6);
  ctx.strokeStyle = focus ? C.blue : C.rule;
  ctx.lineWidth = focus ? 2.5 : 1.5;
  ctx.stroke();
  ctx.restore();
  const typed = seg(t, at(2, 'act'), at(2, 'act') + 0.5);
  if (typed > 0) {
    const s = '10/15 14:00';
    text(ctx, s.slice(0, Math.round(s.length * typed)), fx + 12, fy + 27, { font: F.mono(500, 17), color: C.ink, alpha: a });
  }
  text(ctx, '部屋', x + 24, fy + 86, { font: F.jp(500, 16), color: C.ink2, alpha: a });
  text(ctx, '第 2 会議室　▾', fx + 12, fy + 87, { font: F.jp(500, 16), color: C.ink, alpha: a });
  // the button
  const bx = x + BUTTON.x;
  const by = y + BUTTON.y;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, bx, by, BUTTON.w, BUTTON.h, 8);
  ctx.fillStyle = C.blue;
  ctx.fill();
  ctx.restore();
  text(ctx, '予約する', bx + BUTTON.w / 2, by + 28, { font: F.jp(700, 17), color: '#fff', align: 'center', alpha: a });
  // done
  const done = tw(t, at(3, 'act') + 0.35, 0.4);
  if (done > 0) {
    ctx.save();
    ctx.globalAlpha = a * done;
    rr(ctx, x + 24, y + SCR.h - 34, SCR.w - 48, 28, 6);
    ctx.fillStyle = C.greenSoft;
    ctx.fill();
    ctx.restore();
    text(ctx, '✓ 予約しました', x + 36, y + SCR.h - 14, { font: F.jp(700, 15), color: C.green, alpha: a * done });
  }
  // a flash for each screenshot
  [0, 1, 2, 3].forEach((k) => {
    const p = seg(t, at(k, 'back') - 0.15, at(k, 'back') + 0.15);
    if (p > 0 && p < 1) {
      ctx.save();
      ctx.globalAlpha = a * 0.55 * Math.sin(Math.PI * p);
      ctx.fillStyle = '#fff';
      rr(ctx, x, y, SCR.w, SCR.h, 10);
      ctx.fill();
      ctx.restore();
    }
  });
  // the cursor: rests, travels to the field, then to the button, clicking each time
  const p0 = [x + 330, y + 70];
  const p1 = [fx + 60, fy + 22];
  const p2 = [bx + 70, by + 24];
  const m1 = inOutCubic(seg(t, at(1, 'act') - 0.1, at(1, 'act') + 0.35));
  const m2 = inOutCubic(seg(t, at(3, 'act') - 0.1, at(3, 'act') + 0.35));
  const cx = m2 > 0 ? lerp(p1[0], p2[0], m2) : lerp(p0[0], p1[0], m1);
  const cy = m2 > 0 ? lerp(p1[1], p2[1], m2) : lerp(p0[1], p1[1], m1);
  [at(1, 'act') + 0.35, at(3, 'act') + 0.35].forEach((c) => {
    const r = seg(t, c, c + 0.45);
    if (r > 0 && r < 1) {
      ctx.save();
      ctx.globalAlpha = a * (1 - r);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      circle(ctx, cx, cy, 6 + r * 22);
      ctx.stroke();
      ctx.restore();
    }
  });
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 22);
  ctx.lineTo(6, 17);
  ctx.lineTo(10, 26);
  ctx.lineTo(14, 24);
  ctx.lineTo(10, 15);
  ctx.lineTo(17, 15);
  ctx.closePath();
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// A thumbnail of the screen after round k: the form, filled in as far as it got.
function thumb(ctx, x, y, k, a) {
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, 44, 30, 3);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = C.panel;
  ctx.fillRect(x + 1, y + 1, 42, 5);
  ctx.strokeStyle = k >= 1 ? C.blue : C.rule;
  ctx.strokeRect(x + 14, y + 10, 24, 5);
  if (k >= 2) {
    ctx.fillStyle = C.ink;
    ctx.fillRect(x + 16, y + 11.5, 14, 2);
  }
  ctx.fillStyle = C.blue;
  ctx.fillRect(x + 14, y + 20, 12, 5);
  if (k >= 3) {
    ctx.fillStyle = C.green;
    ctx.fillRect(x + 4, y + 26, 36, 2.5);
  }
  ctx.restore();
}
