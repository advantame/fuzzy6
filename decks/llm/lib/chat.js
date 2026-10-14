// ChatGPT as the viewer knows it: a chat window with its mark, a question and an answer. The
// intro draws it where the viewer is reminded of the AI they have used (1-1), where ずんだもん
// sets it against the hole-filling (1-2), and at the head of the dive under 1-2.

import { C, F } from './theme.js';
import { tag } from './parts.js';
import { text, measure, rr } from '../../../src/kit/draw.js';
import { clamp } from '../../../src/kit/ease.js';

// The ChatGPT mark: OpenAI's Blossom, which OpenAI's help pages give as the mark of the ChatGPT
// app. The path is the one in OpenAI's own logo pack, unaltered: cdn.openai.com/brand/
// OpenAI-Logos-2025.zip (sha256 b2c4cd1e…71d2ec), OpenAI-logos(new)/SVGs/
// OpenAI-black-monoblossom.svg (sha256 7be72f1f…4aa1e00b), fetched 2026-10-14. It is drawn
// from the path so that no image has to load. OpenAI's guidelines: use it as provided, in
// black or white only, at its own proportions, with room around it, and never so as to suggest
// that OpenAI endorses the deck. Why the deck uses it: ../README.md.
const MARK_D =
  'M304.246 294.611V249.028C304.246 245.189 305.687 242.309 309.044 240.392L400.692 187.612C413.167 180.415 428.042 177.058 443.394 177.058C500.971 177.058 537.44 221.682 537.44 269.182C537.44 272.54 537.44 276.379 536.959 280.218L441.954 224.558C436.197 221.201 430.437 221.201 424.68 224.558L304.246 294.611ZM518.245 472.145V363.224C518.245 356.505 515.364 351.707 509.608 348.349L389.174 278.296L428.519 255.743C431.877 253.826 434.757 253.826 438.115 255.743L529.762 308.523C556.154 323.879 573.905 356.505 573.905 388.171C573.905 424.636 552.315 458.225 518.245 472.141V472.145ZM275.937 376.182L236.592 353.152C233.235 351.235 231.794 348.354 231.794 344.515V238.956C231.794 187.617 271.139 148.749 324.4 148.749C344.555 148.749 363.264 155.468 379.102 167.463L284.578 222.164C278.822 225.521 275.942 230.319 275.942 237.039V376.186L275.937 376.182ZM360.626 425.122L304.246 393.455V326.283L360.626 294.616L417.002 326.283V393.455L360.626 425.122ZM396.852 570.989C376.698 570.989 357.989 564.27 342.151 552.276L436.674 497.574C442.431 494.217 445.311 489.419 445.311 482.699V343.552L485.138 366.582C488.495 368.499 489.936 371.379 489.936 375.219V480.778C489.936 532.117 450.109 570.985 396.852 570.985V570.989ZM283.134 463.99L191.486 411.211C165.094 395.854 147.343 363.229 147.343 331.562C147.343 294.616 169.415 261.509 203.48 247.593V356.991C203.48 363.71 206.361 368.508 212.117 371.866L332.074 441.437L292.729 463.99C289.372 465.907 286.491 465.907 283.134 463.99ZM277.859 542.68C223.639 542.68 183.813 501.895 183.813 451.514C183.813 447.675 184.294 443.836 184.771 439.997L279.295 494.698C285.051 498.056 290.812 498.056 296.568 494.698L417.002 425.127V470.71C417.002 474.549 415.562 477.429 412.204 479.346L320.557 532.126C308.081 539.323 293.206 542.68 277.854 542.68H277.859ZM396.852 599.776C454.911 599.776 503.37 558.513 514.41 503.812C568.149 489.896 602.696 439.515 602.696 388.176C602.696 354.587 588.303 321.962 562.392 298.45C564.791 288.373 566.231 278.296 566.231 268.224C566.231 199.611 510.571 148.267 446.274 148.267C433.322 148.267 420.846 150.184 408.37 154.505C386.775 133.392 357.026 119.958 324.4 119.958C266.342 119.958 217.883 161.22 206.843 215.921C153.104 229.837 118.557 280.218 118.557 331.557C118.557 365.146 132.95 397.771 158.861 421.283C156.462 431.36 155.022 441.437 155.022 451.51C155.022 520.123 210.682 571.466 274.978 571.466C287.931 571.466 300.407 569.549 312.883 565.228C334.473 586.341 364.222 599.776 396.852 599.776Z';
// the mark inside the file's 721 × 721 square, which has a margin of its own
const MARK_BOX = { x: 118.557, y: 119.958, w: 484.139 };
let markPath = null;

// The mark with its top-left at (x, y), `size` wide: black, or white on a dark ground.
export function mark(ctx, x, y, size, a = 1, white = false) {
  if (a <= 0.001) return;
  markPath ??= new Path2D(MARK_D);
  const k = size / MARK_BOX.w;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.translate(x - MARK_BOX.x * k, y - MARK_BOX.y * k);
  ctx.scale(k, k);
  ctx.fillStyle = white ? '#fff' : '#000';
  ctx.fill(markPath);
  ctx.restore();
}

// The mark and the name, as one label, with half the mark's width between them. Returns its
// width.
export function chatName(ctx, x, y, o = {}) {
  const size = o.size ?? 28;
  const font = F.sans(600, Math.round(size * 0.8));
  const a = o.alpha ?? 1;
  mark(ctx, x, y, size, a);
  const w = text(ctx, 'ChatGPT', x + size * 1.5, y + size * 0.8, { font, color: C.ink, alpha: a });
  return size * 1.5 + w;
}

// ——— the window
export const CARD_W = 400;
const ASK = '旅行の予定を立てて';
// the answer, in the pieces it is written in when it is shown being written ('\n' breaks the line)
const ANSWER = ['いいですね。', 'まず、', '行き先と', '\n', '日数を', '決め', 'ましょう。'];
export const ANSWER_PIECES = ANSWER.filter((s) => s !== '\n').length;
const BODY = F.jp(500, 19);
const CORE_H = 92;

// The window's height: it grows by the strip as the strip comes in (o.core 0–1).
export function cardHeight(o = {}) {
  return 210 + (CORE_H + 6) * clamp(o.core ?? 0);
}

// The window with its top-left at (x, y). o:
//   alpha     the whole window
//   scale     drawn at CARD_W × scale
//   parts     [header, question, answer] alphas (each 0–1), for bringing it in in order
//   written   pieces of the answer written so far (fractional: the newest is coming in); the
//             hole after them is the next piece. Omitted: the whole answer, no hole.
//   blink     whether the hole is lit in this frame
//   core      0–1, the strip below the window showing the LLM inside; the window opens
//             downwards to make room for it
//   coreLit   0–1, the LLM's mark as the core
export function chatCard(ctx, x, y, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const [hA, qA, aA] = o.parts ?? [1, 1, 1];
  const w = CARD_W;
  const h = cardHeight(o);
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.translate(x, y);
  ctx.scale(o.scale ?? 1, o.scale ?? 1);

  rr(ctx, 0, 0, w, h, 18);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.clip();

  // header
  chatName(ctx, 22, 16, { size: 28, alpha: hA });
  ctx.fillStyle = C.rule;
  ctx.globalAlpha = a * hA;
  ctx.fillRect(16, 58, w - 32, 2);
  ctx.globalAlpha = a;

  // the question, on the right
  const qw = measure(ctx, BODY, ASK) + 32;
  tag(ctx, w - 20 - qw, 74, ASK, { font: BODY, h: 42, padX: 16, r: 21, fill: C.panel, color: C.ink, alpha: qA });

  // the answer, from the mark, on the left
  mark(ctx, 20, 132, 24, aA);
  const written = o.written ?? Infinity;
  let px = 56;
  let py = 152;
  let k = 0;
  for (const s of ANSWER) {
    if (s === '\n') {
      px = 56;
      py += 30;
      continue;
    }
    const sw = measure(ctx, BODY, s);
    if (k < written) {
      const pa = clamp(written - k) * aA;
      text(ctx, s, px, py, { font: BODY, color: C.ink, alpha: pa });
    } else if (k === Math.ceil(written) || (k === 0 && written <= 0)) {
      // the hole: where the next piece goes
      ctx.save();
      ctx.globalAlpha = a * aA;
      rr(ctx, px, py - 21, Math.max(40, sw), 28, 6);
      ctx.fillStyle = o.blink ? C.accentSoft : '#fff';
      ctx.fill();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    px += sw;
    k += 1;
  }

  // the LLM inside
  if (o.core > 0.001) {
    const ca = clamp(o.core);
    const top = 214;
    ctx.globalAlpha = a * ca;
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(16, top);
    ctx.lineTo(w - 16, top);
    ctx.stroke();
    ctx.setLineDash([]);
    rr(ctx, 22, top + 16, 64, 64, 14);
    ctx.fillStyle = C.ink;
    ctx.fill();
    if (o.coreLit > 0) {
      ctx.globalAlpha = a * ca * clamp(o.coreLit);
      rr(ctx, 16, top + 10, 76, 76, 18);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.globalAlpha = a;
    text(ctx, 'LLM', 54, top + 49, { font: F.sans(700, 22), color: C.paper, align: 'center', base: 'middle', alpha: ca });
    tag(ctx, 108, top + 32, '中核', { font: F.jp(700, 18), h: 32, padX: 14, fill: C.accent, color: '#fff', alpha: ca * clamp(o.coreLit ?? 0) });
  }
  ctx.restore();
}
