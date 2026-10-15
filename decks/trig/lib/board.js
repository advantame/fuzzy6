// Two pictures that span clips, kept here so that a clip can join the one before it without
// a seam (spec §6.10):
//
// - board(): the end of 1-2 and the start of 1-3. ずんだもん's triangle on the squared paper
//   with her names for its sides, three cards of ratios, the table she wants to make, and her
//   own name for the first ratio, 「たてそこ比」. 1-3 turns the same parts into めたん's
//   definitions.
// - memo(): めたん's sheet to remember (1-3), three triangles with the cursive s, c, t and
//   the three definitions under them. It stays in the top right corner through the exercises.

import { clamp } from '../../../src/kit/ease.js';
import { rr, text } from '../../../src/kit/draw.js';
import { C, F } from './theme.js';
import { corners, drawTri, angleAt, sideLabel } from './tri.js';
import { math, row, frac, jp, tag } from './math.js';
import { cursive, LETTER_COLOR } from './cursive.js';
import { card, pill } from './parts.js';

// ——— ずんだもん's board (1-2 → 1-3) —————————————————————————————————————

export const BOARD_TRI = { deg: 38, base: 440, pose: { x: 160, y: 660 } };
export const boardCorners = (base = BOARD_TRI.base, pose = BOARD_TRI.pose) => corners(BOARD_TRI.deg, base ?? BOARD_TRI.base, pose);

// the three cards, in the order she finds them: height ÷ base, height ÷ slant, base ÷ slant
export const CARD = { x: 720, w: 470, h: 84, y: [150, 256, 362] };
export const CARD_VALUES = ['0.78', '0.62', '0.79'];
const CARD_PARTS = [
  ['height', 'base'],
  ['height', 'hyp'],
  ['base', 'hyp'],
];
const COLOR = { height: C.sin, base: C.cos, hyp: C.ink };
// her words for the sides, and めたん's
export const ZUNDA_NAMES = { height: '縦', base: '底辺', hyp: '斜め' };
export const METAN_NAMES = { height: '高さ', base: '底辺', hyp: '斜辺' };

// A white card with a ratio on it. names: the words for the sides; value: shown after '='.
// Returns what math() returns for the ratio: parts.value is the value's box.
export function ratioCard(ctx, x, y, i, o = {}) {
  const a = o.alpha ?? 1;
  const w = o.w ?? CARD.w;
  const h = CARD.h;
  const [p, q] = CARD_PARTS[i];
  const names = o.names ?? ZUNDA_NAMES;
  card(ctx, x, y, w, h, { stroke: o.lit ? C.accent : C.rule, lw: o.lit ? 3 : 2, alpha: a });
  const parts = [jp(names[p], COLOR[p]), '÷', jp(names[q], COLOR[q])];
  if (o.value !== false) parts.push('=', tag('value', o.value ?? CARD_VALUES[i]));
  return math(ctx, row(...parts), x + 30, y + h / 2 + 14, { size: 38, alpha: a });
}

// The table of ratios by angle she wants to keep: only the 38° row is filled.
const TABLE_ROWS = [20, 30, 38, 45, 60];
export function ratioTable(ctx, x, y, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const names = o.names ?? ZUNDA_NAMES;
  const colW = 200;
  const degW = 120;
  const rowH = 46;
  const w = degW + colW * 3;
  const h = rowH * (TABLE_ROWS.length + 1) + 8;
  ctx.save();
  ctx.globalAlpha *= a;
  card(ctx, x, y, w, h, { r: 12 });
  text(ctx, '角度', x + degW / 2, y + 32, { font: F.jp(700, 22), color: C.ink2, align: 'center' });
  CARD_PARTS.forEach(([p, q], i) => {
    math(ctx, row(jp(names[p], COLOR[p]), '÷', jp(names[q], COLOR[q])), x + degW + colW * (i + 0.5), y + 32, { size: 24, align: 'center' });
  });
  ctx.fillStyle = C.ink;
  ctx.fillRect(x + 10, y + rowH + 2, w - 20, 2);
  TABLE_ROWS.forEach((deg, r) => {
    const ry = y + rowH * (r + 1) + 6;
    const mine = deg === 38;
    text(ctx, `${deg}°`, x + degW / 2, ry + 30, { font: F.mono(500, 24), color: mine ? C.ink : C.muted, align: 'center' });
    CARD_VALUES.forEach((val, i) => {
      const fill = mine ? clamp(o.fill ?? 1) : 0;
      const cx = x + degW + colW * (i + 0.5);
      if (fill > 0) text(ctx, val, cx, ry + 30, { font: F.mono(500, 24), color: C.ink, align: 'center', alpha: fill });
      if (!mine) text(ctx, '？', cx, ry + 30, { font: F.jp(500, 22), color: C.rule, align: 'center' });
    });
  });
  ctx.restore();
}

// Her name for the first ratio, written by hand beside its card. p types it in; strike (0–1)
// draws めたん's line through it.
export function tatesoko(ctx, x, y, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const s = '「たてそこ比」';
  const chars = Array.from(s);
  const shown = chars.slice(0, Math.round(chars.length * clamp(o.p ?? 1))).join('');
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.rotate(-0.06);
  text(ctx, shown, 0, 0, { font: F.jp(700, 36), color: C.ink2 });
  const strike = clamp(o.strike ?? 0);
  if (strike > 0) {
    const w = 236;
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(-6 + (w + 12) * strike, -12 + 4 * strike);
    ctx.stroke();
  }
  ctx.restore();
}

// The whole board as 1-2 leaves it. o: { base (the base's length, to grow and shrink the
// triangle in place), tri (alpha), other (alpha of the 52°), angle (θ's label), metan,
// nameMix (see sideNames) }. Returns { T, angle, other, names } — the triangle and the boxes of
// its labels.
export function board(ctx, o = {}) {
  const T = boardCorners(o.base);
  const a = o.tri ?? 1;
  drawTri(ctx, T, { lw: 6, alpha: a });
  const angle = angleAt(ctx, T, 'A', { r: 70, label: o.angle ?? '38°', size: 32, alpha: a });
  const other = angleAt(ctx, T, 'B', { r: 54, label: '52°', size: 26, alpha: a * (o.other ?? 1), color: C.muted, labelColor: C.muted });
  const names = sideNames(ctx, T, a, o.metan ?? 0, o.nameMix ?? {});
  return { T, angle, other, names };
}

// The names on the sides. m (0–1) cross-fades from her words to めたん's; o.height, o.base,
// o.hyp set the cross-fade side by side. Returns the boxes of the names shown, by side.
export function sideNames(ctx, T, a = 1, m = 0, o = {}) {
  const z = { height: '縦の辺', base: '底辺', hyp: '斜めの辺' };
  const mt = { height: '高さ', base: '底辺', hyp: '斜辺' };
  const out = {};
  for (const side of ['height', 'base', 'hyp']) {
    const lo = { size: 30, gap: 12 };
    const am = clamp(o[side] ?? m);
    if (z[side] === mt[side]) {
      out[side] = sideLabel(ctx, T, side, z[side], { ...lo, alpha: a });
      continue;
    }
    const zb = sideLabel(ctx, T, side, z[side], { ...lo, alpha: a * (1 - am) });
    const mb = sideLabel(ctx, T, side, mt[side], { ...lo, alpha: a * am });
    out[side] = am > 0.5 ? mb : zb;
  }
  return out;
}

// ——— めたん's sheet to remember: the cursive s, c, t (1-3) ——————————————————

const LETTERS = ['s', 'c', 't'];
const FN = { s: 'sin', c: 'cos', t: 'tan' };
const DEF = { s: ['height', 'hyp'], c: ['base', 'hyp'], t: ['height', 'base'] };

// Panel i of the sheet in stage coordinates at full size.
export function memoPanel(i) {
  const x = 120 + i * 470;
  return { x, T: corners(38, 330, { x: x + 34, y: 470 }), fx: x + 205, fy: 640 };
}

// A definition, e.g. sin θ = 高さ / 斜辺, with its parts coloured. The numerator and the
// denominator are tagged 'num' and 'den' (math() reports their boxes).
export function definition(letter, names = METAN_NAMES) {
  const [p, q] = DEF[letter];
  return row(FN[letter], 'θ', '=', frac(tag('num', jp(names[p], COLOR[p])), tag('den', jp(names[q], COLOR[q]))));
}

// Draw the sheet. o: { x, y, s (placement of the whole sheet), alpha, write: [ps, pc, pt]
// (each letter's stroke), defs (alpha of the definitions), frame (alpha of the vermilion
// frame), lit: letter or null, numbers }.
export function memo(ctx, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(o.x ?? 0, o.y ?? 0);
  ctx.scale(o.s ?? 1, o.s ?? 1);
  card(ctx, 90, 150, 1420, 570, { r: 26, stroke: C.accent, lw: 6, alpha: o.frame ?? 0 });
  LETTERS.forEach((L, i) => {
    const P = memoPanel(i);
    const lit = o.lit === L ? 1 : 0;
    drawTri(ctx, P.T, { lw: 5, alpha: 1 });
    angleAt(ctx, P.T, 'A', { r: 58, label: 'θ', size: 30 });
    cursive(ctx, P.T, L, (o.write ?? [1, 1, 1])[i], { lw: 9, numbers: o.numbers ?? 1 });
    math(ctx, definition(L), P.fx, P.fy, { size: 44, align: 'center', alpha: o.defs ?? 1 });
    if (lit > 0) {
      ctx.save();
      ctx.strokeStyle = LETTER_COLOR[L];
      ctx.lineWidth = 5;
      rr(ctx, P.x, 170, 440, 530, 20);
      ctx.stroke();
      ctx.restore();
    }
  });
  ctx.restore();
}

// Where the sheet sits during the exercises: small, in the top right corner.
export const MEMO_CORNER = { x: 1160, y: 4, s: 0.27 };


// The tab in the top left that marks the exercises: 「演習」, then 「演習 1」 and so on.
export function drillTag(ctx, s, a = 1) {
  pill(ctx, s, 64, 73, { size: 30, w: s.length > 2 ? 170 : 124, alpha: a });
}

// A definition on a white card (1-3): the card that held a ratio becomes its definition.
export const DEF_SLOT = { x: 720, w: 500, h: 124, y: [126, 272, 418] };
export function defCard(ctx, j, letter, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const x = o.x ?? DEF_SLOT.x;
  const y = o.y ?? DEF_SLOT.y[j];
  ctx.save();
  ctx.globalAlpha *= a;
  card(ctx, x, y, DEF_SLOT.w, DEF_SLOT.h, { r: 16, stroke: o.lit ? LETTER_COLOR[letter] : C.rule, lw: o.lit ? 4 : 2 });
  math(ctx, definition(letter), x + 34, y + DEF_SLOT.h / 2 + 16, { size: 46 });
  if (o.name) text(ctx, o.name, x + DEF_SLOT.w - 26, y + 40, { font: F.jp(700, 24), color: LETTER_COLOR[letter], align: 'right' });
  ctx.restore();
}
