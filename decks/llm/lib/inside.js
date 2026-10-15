// The flow of an autoregressive LLM, which chapter 3 walks through: the text so far
// is cut into tokens and numbered; the model turns each number into a list of numbers, rewrites
// those lists by looking at the token itself and the ones before it, and gives every token of
// the vocabulary a chance; one is picked and added to the end, and the text goes round again.
// The model's own frame holds only the middle three: cutting the text and picking a token are
// done by the program around it (research/concept-facts, K1). 3-1 (inside) draws the flow large;
// every later clip of the chapter keeps it as a strip along the top, with the stage it is about
// filled in ink, so that a clip seen on its own still says where it is and which kind of model
// it is about (README, 2026-10-15). Every function draws one frame and keeps no state.

import { clamp, lerp } from '../../../src/kit/ease.js';
import { text, measure, rr, circle, arrowHead, line } from '../../../src/kit/draw.js';
import { C, F, M } from './theme.js';

// The stages. The middle three are the model itself; the first prepares the text for it, and
// the fifth closes the loop.
export const STAGES = [
  { id: 'tok', label: 'トークンに切る', clip: '3-2' },
  { id: 'vec', label: '数の並びにする', clip: '3-3' },
  { id: 'att', label: '前を見る', clip: '3-4' },
  { id: 'prob', label: '確率を出す', clip: '3-5' },
  { id: 'pick', label: '一つ選んで足す', clip: '3-5' },
];
// After 3-3 names the list of numbers a vector, the later clips call the stage by that name.
export const VECTOR_LABEL = 'ベクトルにする';
// The text the model reads, named in 3-1 (d2): the context.
export const INPUT = 'コンテクスト';
export const TITLE = '自己回帰型 LLM の流れ';
export const INNER = [1, 2, 3]; // the stages inside the model's frame

// ——— the small pictures of the stages ————————————————————————————————————

// Draw the picture of stage `id` centred on (cx, cy), about `s` wide. `ink` is the colour of
// its lines; on a dark ground pass the paper colour.
export function icon(ctx, id, cx, cy, s, a = 1, ink = C.ink2) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  const u = s / 60;
  if (id === 'tok') {
    // a line of text cut into chips
    const ws = [16, 24, 12];
    let x = cx - (ws.reduce((n, w) => n + w, 0) + 2 * 5) * u / 2;
    ws.forEach((w, i) => {
      rr(ctx, x, cy - 9 * u, w * u, 18 * u, 4 * u);
      ctx.fillStyle = C.tints[i];
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5 * u;
      ctx.stroke();
      x += (w + 5) * u;
    });
  } else if (id === 'vec') {
    // a column of numbers, as bars of different lengths inside brackets
    const ls = [0.6, 1, 0.35, 0.8];
    const h = 34 * u;
    const top = cy - h / 2;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.moveTo(cx - 14 * u, top);
    ctx.lineTo(cx - 18 * u, top);
    ctx.lineTo(cx - 18 * u, top + h);
    ctx.lineTo(cx - 14 * u, top + h);
    ctx.moveTo(cx + 14 * u, top);
    ctx.lineTo(cx + 18 * u, top);
    ctx.lineTo(cx + 18 * u, top + h);
    ctx.lineTo(cx + 14 * u, top + h);
    ctx.stroke();
    ctx.fillStyle = ink;
    ls.forEach((l, i) => ctx.fillRect(cx - 11 * u, top + (4 + i * 8) * u, 22 * u * l, 4 * u));
  } else if (id === 'att') {
    // three tokens; the last looks back at the other two, harder at the first
    const xs = [-20, 0, 20].map((d) => cx + d * u);
    const y = cy + 8 * u;
    ctx.strokeStyle = C.accent;
    ctx.lineCap = 'round';
    [[0, 4], [1, 1.8]].forEach(([k, w]) => {
      ctx.lineWidth = w * u;
      ctx.beginPath();
      ctx.moveTo(xs[2], y - 4 * u);
      ctx.quadraticCurveTo((xs[2] + xs[k]) / 2, y - (k === 0 ? 30 : 18) * u, xs[k], y - 4 * u);
      ctx.stroke();
    });
    ctx.lineCap = 'butt';
    ctx.fillStyle = ink;
    xs.forEach((x) => {
      circle(ctx, x, y, 4.5 * u);
      ctx.fill();
    });
  } else if (id === 'prob') {
    // bars of different lengths, the first the longest
    const ls = [1, 0.45, 0.2];
    ls.forEach((l, i) => {
      ctx.fillStyle = i === 0 ? C.accent : ink;
      ctx.fillRect(cx - 20 * u, cy - 15 * u + i * 11 * u, 40 * u * l, 7 * u);
    });
  } else if (id === 'pick') {
    // one chip going to the end of the line
    ctx.fillStyle = C.accent;
    rr(ctx, cx - 4 * u, cy - 9 * u, 18 * u, 18 * u, 4 * u);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2 * u;
    ctx.setLineDash([3 * u, 3 * u]);
    rr(ctx, cx - 24 * u, cy - 9 * u, 16 * u, 18 * u, 4 * u);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

// ——— the strip along the top of 3-2 to 3-7 ——————————————————————————————

const S = { y: 34, h: 40, font: F.jp(700, 17), padX: 14, gap: 30, frame: 8 };

const labels = (vector) => STAGES.map((st) => (vector && st.id === 'vec' ? VECTOR_LABEL : st.label));

function stripLayout(ctx, names) {
  const w = (s) => measure(ctx, S.font, s) + S.padX * 2;
  let x = M.l;
  const input = { x, w: w(INPUT) };
  x += input.w + S.gap;
  const llmLabel = measure(ctx, F.sans(700, 17), 'LLM');
  const frame = { y: S.y - S.frame, h: S.h + S.frame * 2 };
  const stages = STAGES.map((st, i) => {
    if (i === INNER[0]) {
      frame.x = x;
      x += S.frame + llmLabel + 12;
    }
    if (i === INNER[INNER.length - 1] + 1) {
      frame.w = x - S.gap + S.frame - frame.x;
      x += S.frame;
    }
    const out = { x, w: w(names[i]) };
    x += out.w + S.gap;
    return out;
  });
  return { input, frame, stages, llmLabel, end: x - S.gap };
}

// o: { alpha, lit: [stage indices to fill in ink], input (0–1, fill the input in ink),
//      title (alpha of the title), vector (call the second stage by its name, from 3-4 on) }
export function strip(ctx, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const names = labels(o.vector);
  const L = stripLayout(ctx, names);
  const lit = new Set(o.lit ?? []);
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  text(ctx, TITLE, M.l, S.y - 14, { font: F.jp(500, 15), color: C.muted, alpha: o.title ?? 1 });
  // the model's frame around the middle three stages
  rr(ctx, L.frame.x, L.frame.y, L.frame.w, L.frame.h, 12);
  ctx.fillStyle = C.panel;
  ctx.fill();
  text(ctx, 'LLM', L.frame.x + S.frame + 4, S.y + S.h / 2 + 1, { font: F.sans(700, 17), color: C.ink, base: 'middle' });
  pill(ctx, L.input.x, L.input.w, INPUT, o.input ?? 0);
  names.forEach((s, i) => pill(ctx, L.stages[i].x, L.stages[i].w, s, lit.has(i) ? 1 : 0));
  // arrows between the pills
  ctx.fillStyle = C.ink2;
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  const mid = S.y + S.h / 2;
  const step = (x0, x1) => {
    line(ctx, x0 + 4, mid, x1 - 5, mid);
    arrowHead(ctx, x1 - 3, mid, 0, 9);
  };
  step(L.input.x + L.input.w, L.stages[0].x);
  step(L.stages[0].x + L.stages[0].w, L.frame.x); // into the model
  for (let i = 1; i < 4; i++) step(L.stages[i].x + L.stages[i].w, L.stages[i + 1].x);
  // round again: from the last stage back to the text, under the strip
  const last = L.stages[4];
  const yb = S.y + S.h + S.frame + 9;
  const xr = last.x + last.w / 2;
  const xl = L.input.x + L.input.w / 2;
  ctx.strokeStyle = C.muted;
  ctx.fillStyle = C.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(xr, S.y + S.h + 2);
  ctx.lineTo(xr, yb);
  ctx.lineTo(xl, yb);
  ctx.lineTo(xl, S.y + S.h + 6);
  ctx.stroke();
  arrowHead(ctx, xl, S.y + S.h + 2, -Math.PI / 2, 8);
  text(ctx, 'くり返す', lerp(xl, xr, 0.5), yb + 5, { font: F.jp(500, 13), color: C.muted, align: 'center', base: 'middle' });
  ctx.restore();
}

// The strip's height, for laying out what goes below it.
export const STRIP_BOTTOM = S.y + S.h + S.frame + 16;

function pill(ctx, x, w, s, lit) {
  rr(ctx, x, S.y, w, S.h, 10);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, s, x + w / 2, S.y + S.h / 2 + 1, { font: S.font, color: C.ink2, align: 'center', base: 'middle' });
  if (lit > 0.001) {
    ctx.save();
    ctx.globalAlpha *= clamp(lit);
    rr(ctx, x, S.y, w, S.h, 10);
    ctx.fillStyle = C.ink;
    ctx.fill();
    text(ctx, s, x + w / 2, S.y + S.h / 2 + 1, { font: S.font, color: C.paper, align: 'center', base: 'middle' });
    ctx.restore();
  }
}
