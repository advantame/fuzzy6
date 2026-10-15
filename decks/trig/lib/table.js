// A table of trigonometric ratios, one row per degree, as at the back of a textbook. Values
// are computed here and printed to four places; tan 90° has no value.

import { clamp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { C, F } from './theme.js';
import { math, row } from './math.js';
import { card } from './parts.js';

const RAD = Math.PI / 180;
export const value = (col, deg) => {
  if (col === 'tan' && deg === 90) return '—';
  const f = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[col];
  return f(deg * RAD).toFixed(4);
};
const COLOR = { sin: C.sin, cos: C.cos, tan: C.tan };

// Draw the table with its top-left at (x, y). o: { rows (degrees), cols, rowH, colW, degW,
// alpha, scroll (rows scrolled, may be fractional), show (rows visible), hi: { deg, col,
// level } (a row lit, and one cell in vermilion), find: { deg, level } (a faint row lit) }.
// Returns { w, h, rowY(deg), rowBox(deg), cell(deg, col) } — the top of a row, and the boxes of
// a row and of one cell, for rings and pointers.
export function trigTable(ctx, x, y, o = {}) {
  const rows = o.rows ?? [];
  const cols = o.cols ?? ['sin', 'cos', 'tan'];
  const rowH = o.rowH ?? 46;
  const degW = o.degW ?? 96;
  const colW = o.colW ?? 150;
  const show = o.show ?? rows.length;
  const scroll = o.scroll ?? 0;
  const a = o.alpha ?? 1;
  const w = degW + colW * cols.length;
  const headH = rowH + 6;
  const h = headH + rowH * show;
  const rowY = (deg) => y + headH + (rows.indexOf(deg) - scroll) * rowH;
  const rowBox = (deg) => ({ x, y: rowY(deg), w, h: rowH });
  const cell = (deg, col) => ({ x: x + degW + colW * cols.indexOf(col), y: rowY(deg), w: colW, h: rowH });
  const out = { w, h, rowY, rowBox, cell };
  if (a <= 0.001) return out;
  ctx.save();
  ctx.globalAlpha *= a;
  card(ctx, x, y, w, h, { r: 10 });
  // head
  text(ctx, 'θ', x + degW / 2, y + rowH * 0.7, { font: F.sans(400, 26), color: C.ink, align: 'center' });
  cols.forEach((c, i) => math(ctx, row(c, 'θ'), x + degW + colW * (i + 0.5), y + rowH * 0.7, { size: 26, color: COLOR[c], align: 'center' }));
  ctx.fillStyle = C.ink;
  ctx.fillRect(x + 10, y + headH - 2, w - 20, 2);
  // rows, clipped to the body
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y + headH, w, rowH * show);
  ctx.clip();
  rows.forEach((deg, i) => {
    const ry = y + headH + (i - scroll) * rowH;
    if (ry < y + headH - rowH || ry > y + h) return;
    const lit = o.hi && o.hi.deg === deg ? clamp(o.hi.level ?? 1) : 0;
    const found = o.find && o.find.some?.((f) => f.deg === deg && f.level > 0) ? Math.max(...o.find.filter((f) => f.deg === deg).map((f) => f.level)) : 0;
    const bg = Math.max(lit, found * 0.8);
    if (bg > 0) {
      ctx.save();
      ctx.globalAlpha *= bg;
      ctx.fillStyle = C.accentSoft;
      ctx.fillRect(x + 4, ry + 2, w - 8, rowH - 4);
      ctx.restore();
    }
    if (i % 5 === 4) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(x + 10, ry + rowH - 1, w - 20, 1);
    }
    text(ctx, `${deg}°`, x + degW - 22, ry + rowH * 0.68, { font: F.mono(500, 24), color: C.ink2, align: 'right' });
    cols.forEach((c, j) => {
      const cell = lit > 0 && o.hi.col === c ? lit : 0;
      const tx = x + degW + colW * (j + 0.5);
      text(ctx, value(c, deg), tx, ry + rowH * 0.68, { font: F.mono(cell > 0.5 ? 600 : 400, 24), color: C.ink, align: 'center' });
      if (cell > 0) text(ctx, value(c, deg), tx, ry + rowH * 0.68, { font: F.mono(600, 24), color: C.accent, align: 'center', alpha: cell });
    });
  });
  ctx.restore();
  ctx.restore();
  return out;
}
