// A prediction drawn as rows: a candidate word on a chip and a bar for how likely it is. 1-2
// introduces the picture without numbers and names the numbers afterwards; its dive asks four
// questions on the same rows. Every function draws one frame and keeps no state.

import { clamp } from '../../../src/kit/ease.js';
import { text, rr } from '../../../src/kit/draw.js';
import { C, F } from './theme.js';

// One candidate. (x, y) is the top-left of the chip. o: { chipW, h, barW, font, p (0–1 of
// barW), grow (0–1), alpha, hot (the bar and chip in the signal colour), track (0–1, a faint
// full-width track behind the bar), num (alpha of the number), label (the number as text) }
export function oddsRow(ctx, x, y, word, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const h = o.h ?? 52;
  const chipW = o.chipW ?? 150;
  const barW = o.barW ?? 400;
  const font = o.font ?? F.jp(500, 28);
  const hot = clamp(o.hot ?? 0);
  const bx = x + chipW + 18;
  const bh = Math.round(h * 0.54);
  const by = y + (h - bh) / 2;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, x, y, chipW, h, 10);
  ctx.fillStyle = C.panel;
  ctx.fill();
  if (hot > 0) {
    ctx.save();
    ctx.globalAlpha *= hot;
    ctx.fillStyle = C.accent;
    ctx.fill();
    ctx.restore();
  }
  if (word) {
    text(ctx, word, x + chipW / 2, y + h / 2 + 2, { font, color: C.ink, align: 'center', base: 'middle' });
    if (hot > 0) text(ctx, word, x + chipW / 2, y + h / 2 + 2, { font, color: '#fff', align: 'center', base: 'middle', alpha: hot });
  }
  if (o.track > 0) {
    ctx.save();
    ctx.globalAlpha *= clamp(o.track);
    ctx.fillStyle = C.rule;
    ctx.fillRect(bx, by + bh / 2 - 2, barW, 4);
    ctx.restore();
  }
  const w = Math.max(3, barW * clamp(o.p ?? 0) * clamp(o.grow ?? 1));
  ctx.fillStyle = C.ink;
  ctx.fillRect(bx, by, w, bh);
  if (hot > 0) {
    ctx.save();
    ctx.globalAlpha *= hot;
    ctx.fillStyle = C.accent;
    ctx.fillRect(bx, by, w, bh);
    ctx.restore();
  }
  if (o.num > 0 && o.label) {
    text(ctx, o.label, bx + w + 12, y + h / 2 + 2, { font: o.numFont ?? F.cond(700, Math.round(h * 0.6)), color: C.ink2, base: 'middle', alpha: o.num });
  }
  ctx.restore();
}

// The slot at the end of a sentence where the next word goes: a dashed box with a caret.
// o: { alpha, lit (0–1, the signal colour), blink (true shows the caret) }
export function slot(ctx, x, y, w, h, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const lit = clamp(o.lit ?? 0);
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, x, y, w, h, 10);
  ctx.setLineDash([9, 7]);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = C.ink2;
  ctx.stroke();
  if (lit > 0) {
    ctx.globalAlpha *= lit;
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }
  ctx.restore();
  if (o.blink) {
    ctx.save();
    ctx.globalAlpha *= clamp(a);
    ctx.fillStyle = C.accent;
    ctx.fillRect(x + 14, y + 10, 4, h - 20);
    ctx.restore();
  }
}
