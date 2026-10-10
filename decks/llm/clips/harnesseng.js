// Harness engineering. An agent reports a fix without running the tests. Corrected on the spot,
// the same mistake comes back in the next session; fixed in the harness — a line in AGENTS.md
// and a check that will not let the work end untested — it does not come back. Mitchell
// Hashimoto called this engineering the harness (My AI Adoption Journey, Step 5, 2026-02-05).
// The sessions are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { ROLE } from '../lib/rig.js';
import { text, rr, arrow, circle, measure } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const CW = 320;
const CH = 164;
const GAP = 40;
const cardX = (i) => M.l + i * (CW + GAP);
const LANE_A = 130;
const LANE_B = 410;
const RX = 1184;
// one session's rows: [role, kind, text]
const BAD = [
  ['user', 'text', '不具合を直して'],
  ['assistant', 'call', 'edit: login.ts'],
  ['result', 'data', '書き換えました'],
  ['assistant', 'text', '直しました'],
];
const GOOD = [
  ['user', 'text', '不具合を直して'],
  ['assistant', 'call', 'edit: login.ts'],
  ['assistant', 'call', 'bash: npm test'],
  ['result', 'data', 'all passed'],
  ['assistant', 'text', '直しました'],
];
const A_AT = [0.6, 2.2, 3.8];
const B_AT = [6.0, 8.8, 9.9];
const FIX = 7.3;
const DEF = 11.4;

export default clip({
  id: 'harnesseng',
  title: '周りを直す',
  kicker: 'ハーネス工学',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'エージェントが誤ったとき、その場で直して終わりにすると、\n次のセッションでも同じ誤りをする。' },
    { at: 6.0, to: 11.2, text: 'そこで、同じ誤りが二度と起きないように、ハーネスのほうを直す。\n指示のファイルに書き足し、確かめるプログラムを足す。' },
    { at: 11.4, to: 18, text: 'Mitchell Hashimoto は 2026 年 2 月、これを「ハーネス工学」と呼んだ。\n直す相手はモデルではなく、モデルの周り。' },
  ],

  draw(ctx, t) {
    // ——— lane A: corrected on the spot, every time
    lane(ctx, LANE_A, 'その場で直す', '誤りを、そのつど人が直す', tw(t, 0.4, 0.5));
    A_AT.forEach((at, i) => {
      card(ctx, t, cardX(i), LANE_A, i + 1, BAD, at, false);
      human(ctx, cardX(i), LANE_A + CH + 12, '人が指摘して、やり直させる', tw(t, at + 1.2, 0.4));
    });
    const nA = A_AT.filter((at) => t >= at + 1.0).length;
    counter(ctx, LANE_A, nA, C.red, tw(t, A_AT[0] + 1.0, 0.4));

    // ——— lane B: the harness is fixed once
    lane(ctx, LANE_B, '周りを直す', '誤りが起きない仕組みを、ハーネスに足す', tw(t, 6.0, 0.5));
    card(ctx, t, cardX(0), LANE_B, 1, BAD, B_AT[0], false);
    human(ctx, cardX(0), LANE_B + CH + 12, '人がハーネスを直す', tw(t, FIX - 0.1, 0.4));
    harnessBand(ctx, t);
    [1, 2].forEach((i) => card(ctx, t, cardX(i), LANE_B, i + 1, GOOD, B_AT[i], true));
    const nB = t >= B_AT[0] + 1.0 ? 1 : 0;
    counter(ctx, LANE_B, nB, C.ink, tw(t, B_AT[0] + 1.0, 0.4));
    text(ctx, '2 回目からは起きない', RX, LANE_B + 160, { font: F.jp(700, 19), color: C.green, alpha: tw(t, B_AT[2] + 1.1, 0.5) });

    // ——— the name
    const d = tw(t, DEF, 0.6);
    if (d > 0) {
      const y = 716;
      ctx.save();
      ctx.globalAlpha = d;
      rr(ctx, M.l, y, W - M.l - M.r, 66, 12);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      const w = text(ctx, 'ハーネス工学', M.l + 26, y + 43, { font: F.jp(700, 26), color: C.paper, alpha: d });
      text(ctx, '誤りを見つけたら、二度と起きないように周りを直す', M.l + 26 + w + 24, y + 42, { font: F.jp(500, 20), color: C.paper, alpha: d });
      text(ctx, '“the agent never makes that mistake again”', W - M.r - 26, y + 42, { font: F.sans(500, 19), color: '#bdb6a9', align: 'right', alpha: tw(t, DEF + 0.4, 0.5) });
    }

    example(ctx, M.l, 818, tw(t, 1.2, 0.5), 'セッションの中身は説明のための例');
    source(ctx, 'Mitchell Hashimoto「My AI Adoption Journey」Step 5（2026-02-05）', d);
  },
});

// A lane's title and what it means.
function lane(ctx, y, name, note, a) {
  const w = text(ctx, name, M.l, y - 20, { font: F.jp(700, 24), color: C.ink, alpha: a });
  text(ctx, note, M.l + w + 18, y - 21, { font: F.jp(500, 18), color: C.muted, alpha: a });
}

// One session as a small document. ok: the report is checked (tests ran) or flagged.
function card(ctx, t, x, y, n, rows, at, ok) {
  const a = tw(t, at, 0.5);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, CW, CH, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  text(ctx, `セッション ${n}`, x + 16, y + 25, { font: F.jp(700, 16), color: C.ink2, alpha: a });
  const step = rows.length > 4 ? 25 : 29;
  rows.forEach(([role, kind, s], i) => {
    miniRow(ctx, x + 14, y + 38 + i * step, role, kind, s, tw(t, at + 0.2 + i * 0.16, 0.3));
  });
  // the verdict on the report
  const v = tw(t, at + 1.0, 0.4, (p) => outBack(p, 1.8));
  if (v <= 0) return;
  const ry = y + 38 + (rows.length - 1) * step;
  ctx.save();
  ctx.globalAlpha = Math.min(1, v);
  if (!ok) {
    rr(ctx, x + 8, ry - 3, CW - 16, 28, 7);
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
  mark(ctx, x + CW - 26, y + 20, ok, Math.min(1, v));
  text(ctx, ok ? 'テストを通した' : 'テストを走らせていない', x + CW - 44, y + 25, { font: F.jp(700, 14), color: ok ? C.green : C.red, align: 'right', alpha: Math.min(1, v) });
}

// One row of a session card: the role mark, then the text (calls on vermilion, results on green).
function miniRow(ctx, x, y, role, kind, s, a) {
  if (a <= 0.001) return;
  const r = ROLE[role];
  const font = F.jp(700, 12);
  const w = measure(ctx, font, r.name) + 14;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, w, 21, 5);
  ctx.fillStyle = r.fill;
  ctx.fill();
  ctx.restore();
  text(ctx, r.name, x + w / 2, y + 11.5, { font, color: r.color, align: 'center', base: 'middle', alpha: a });
  const tx = x + 92;
  if (kind !== 'text') {
    ctx.save();
    ctx.globalAlpha = a;
    rr(ctx, tx, y - 1, CW - 92 - 28, 23, 6);
    ctx.fillStyle = kind === 'call' ? C.accentSoft : '#eef6f0';
    ctx.fill();
    ctx.fillStyle = kind === 'call' ? C.accent : C.green;
    ctx.fillRect(tx, y + 3, 3, 15);
    ctx.restore();
  }
  text(ctx, s, tx + (kind === 'text' ? 0 : 10), y + 16, { font: kind === 'text' ? F.jp(500, 15) : F.mono(500, 14), color: C.ink, alpha: a });
}

// A person stepping in, under a card.
function human(ctx, x, y, s, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = C.blue;
  circle(ctx, x + 10, y + 7, 6);
  ctx.fill();
  rr(ctx, x + 2, y + 15, 16, 10, 5);
  ctx.fill();
  ctx.restore();
  text(ctx, s, x + 28, y + 21, { font: F.jp(700, 16), color: C.blue, alpha: a });
}

// The count of the same mistake, in the right column.
function counter(ctx, y, n, color, a) {
  text(ctx, '同じ誤り', RX, y + 34, { font: F.jp(700, 19), color: C.ink2, alpha: a });
  const w = text(ctx, `${n}`, RX, y + 126, { font: F.cond(700, 104), color, alpha: a });
  text(ctx, '回', RX + w + 10, y + 124, { font: F.jp(700, 30), color, alpha: a });
}

// What was added to the harness: a line in AGENTS.md and a check, read by every later session.
function harnessBand(ctx, t) {
  const a = tw(t, FIX, 0.5);
  if (a <= 0) return;
  const x = cardX(1);
  const y = LANE_B + CH + 40;
  const w = cardX(2) + CW - x;
  // from the person to the band
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.blue;
  ctx.fillStyle = C.blue;
  ctx.lineWidth = 2.5;
  arrow(ctx, cardX(0) + 190, LANE_B + CH + 30, x - 12, y + 40, inOutCubic(seg(t, FIX, FIX + 0.4)), 11);
  rr(ctx, x, y, w, 84, 12);
  ctx.fillStyle = C.accentSoft;
  ctx.fill();
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'ハーネスに足したもの', x + 18, y + 24, { font: F.jp(700, 15), color: C.accent, alpha: a });
  const i1 = tw(t, FIX + 0.3, 0.4);
  const k1 = text(ctx, 'AGENTS.md', x + 18, y + 50, { font: F.mono(600, 16), color: C.ink, alpha: i1 });
  text(ctx, 'に 1 行：終える前に npm test を走らせる', x + 18 + k1 + 6, y + 50, { font: F.jp(500, 16), color: C.ink, alpha: i1 });
  const i2 = tw(t, FIX + 0.7, 0.4);
  const k2 = text(ctx, '確かめるプログラム', x + 18, y + 74, { font: F.jp(700, 16), color: C.ink, alpha: i2 });
  text(ctx, '：テストを走らせずには、終わらせない', x + 18 + k2, y + 74, { font: F.jp(500, 16), color: C.ink, alpha: i2 });
  // every later session starts inside it
  [1, 2].forEach((i) => {
    const p = tw(t, B_AT[i] - 0.2, 0.4);
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.strokeStyle = C.accent;
    ctx.fillStyle = C.accent;
    ctx.lineWidth = 2.5;
    arrow(ctx, cardX(i) + CW / 2, y - 4, cardX(i) + CW / 2, LANE_B + CH + 8, inOutCubic(p), 10);
    ctx.restore();
  });
}

// A drawn verdict: a green check, or a red cross.
function mark(ctx, x, y, ok, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = ok ? C.green : C.red;
  circle(ctx, x, y, 11);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (ok) {
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x - 1, y + 4);
    ctx.lineTo(x + 5.5, y - 4);
  } else {
    ctx.moveTo(x - 4, y - 4);
    ctx.lineTo(x + 4, y + 4);
    ctx.moveTo(x + 4, y - 4);
    ctx.lineTo(x - 4, y + 4);
  }
  ctx.stroke();
  ctx.restore();
}
