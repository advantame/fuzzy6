// Small parts that several clips draw: a protractor, a pill-shaped tag, a stamp, an arrow, the
// tick that marks equal sides, a white card, a formula in a frame, a strike through a word,
// and a cross. Each one that holds text returns its box ({ x, y, w, h }), so a ring
// (ringBox in src/kit/cue.js) or a label (o.avoid in lib/tri.js) can use where it went.

import { clamp, lerp } from '../../../src/kit/ease.js';
import { rr, text, measure } from '../../../src/kit/draw.js';
import { C, F } from './theme.js';
import { math } from './math.js';
import { segment } from '../../../src/kit/place.js';
import { unit } from './tri.js';

let scratch = null;
const ctx0 = () => (scratch ??= document.createElement('canvas').getContext('2d'));

// A protractor laid with its centre on A and its flat edge along the ground, the scale on the
// upper half. o: { r, alpha, step (degrees between ticks) }.
export function protractor(ctx, A, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const r = o.r ?? 150;
  const step = o.step ?? 5;
  ctx.save();
  ctx.globalAlpha *= a * 0.9;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(A.x, A.y, r, Math.PI, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (let d = 0; d <= 180; d += step) {
    const k = d % 30 === 0 ? 0.17 : d % 10 === 0 ? 0.12 : 0.07;
    const ang = Math.PI + (d * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(A.x + Math.cos(ang) * r * (1 - k), A.y + Math.sin(ang) * r * (1 - k));
    ctx.lineTo(A.x + Math.cos(ang) * r, A.y + Math.sin(ang) * r);
    ctx.stroke();
  }
  ctx.restore();
}

// A pill with a word on it, white on colour: a name given to something (相似, 余角, 演習).
// (x, y) is its left end's middle, or its centre with o.align 'center'. o: { color, size,
// alpha, align, pad, w (the least width) }. Returns its box.
export function pill(ctx, s, x, y, o = {}) {
  const size = o.size ?? 30;
  const font = F.jp(700, size);
  const padX = o.pad ?? size * 0.8;
  const h = size * 1.9;
  const w = Math.max(o.w ?? h * 2, measure(ctx0(), font, s) + padX * 2);
  const x0 = o.align === 'center' ? x - w / 2 : x;
  const b = { x: x0, y: y - h / 2, w, h };
  const a = o.alpha ?? 1;
  if (a <= 0.001) return b;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, b.x, b.y, w, h, h / 2);
  ctx.fillStyle = o.color ?? C.accent;
  ctx.fill();
  text(ctx, s, x0 + w / 2, y + size * 0.36, { font, color: C.white, align: 'center' });
  ctx.restore();
  return b;
}

// A rubber stamp pressed at (x, y): it lands from a little larger (p 0 → 1), tilted.
export function stamp(ctx, s, x, y, p, o = {}) {
  if (p <= 0.001) return;
  const size = o.size ?? 34;
  const w = measure(ctx0(), F.jp(700, size), s) + size * 2.1;
  const h = size * 1.65;
  const k = lerp(1.6, 1, clamp(p));
  ctx.save();
  ctx.globalAlpha *= clamp(p) * (o.alpha ?? 1);
  ctx.translate(x, y);
  ctx.rotate(o.tilt ?? 0.18);
  ctx.scale(k, k);
  rr(ctx, -w / 2, -h / 2, w, h, size * 0.3);
  ctx.strokeStyle = o.color ?? C.accent;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, s, 0, size * 0.38, { font: F.jp(700, size), color: o.color ?? C.accent, align: 'center' });
  ctx.restore();
}

// An arrow from p towards q, drawn up to fraction o.p; the head appears near the end.
// o: { color, lw, p, alpha, head }.
export function arrow(ctx, p, q, o = {}) {
  const prog = clamp(o.p ?? 1);
  const a = o.alpha ?? 1;
  if (prog <= 0 || a <= 0.001) return;
  const u = unit(p, q);
  const e = { x: lerp(p.x, q.x, prog), y: lerp(p.y, q.y, prog) };
  const head = o.head ?? 16;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = o.color ?? C.ink;
  ctx.fillStyle = o.color ?? C.ink;
  ctx.lineWidth = o.lw ?? 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();
  if (prog > 0.9) {
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x - u.x * head - u.y * head * 0.56, e.y - u.y * head + u.x * head * 0.56);
    ctx.lineTo(e.x - u.x * head + u.y * head * 0.56, e.y - u.y * head - u.x * head * 0.56);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// The short mark across the middle of a side: sides with the same mark are equal. Returns
// the mark as a shape, for the side's label to keep clear of.
export function tick(ctx, p, q, o = {}) {
  const a = o.alpha ?? 1;
  const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  const u = unit(p, q);
  const n = { x: -u.y, y: u.x };
  const h = o.size ?? 12;
  const shape = segment({ x: m.x - n.x * h, y: m.y - n.y * h }, { x: m.x + n.x * h, y: m.y + n.y * h }, 3);
  if (a <= 0.001) return shape;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = o.color ?? C.ink2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(m.x - n.x * h, m.y - n.y * h);
  ctx.lineTo(m.x + n.x * h, m.y + n.y * h);
  ctx.stroke();
  ctx.restore();
  return shape;
}

// A white card with a thin rule round it (a ratio, a definition, a table). o: { stroke, lw,
// r, fill, alpha }.
export function card(ctx, x, y, w, h, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, y, w, h, o.r ?? 14);
  ctx.fillStyle = o.fill ?? C.white;
  ctx.fill();
  ctx.strokeStyle = o.stroke ?? C.rule;
  ctx.lineWidth = o.lw ?? 2;
  ctx.stroke();
  ctx.restore();
}

// A formula on a card framed in colour: a result to keep. (x, y) is the formula's baseline
// start, as for math(). o: { size, pad, stroke, lw, alpha }. Returns what math() returns, with
// rect grown to the card.
export function boxed(ctx, node, x, y, o = {}) {
  const size = o.size ?? 46;
  const a = o.alpha ?? 1;
  const m = math(ctx, node, x, y, { size, alpha: 0 });
  const padX = o.pad ?? 20;
  const padY = o.padY ?? size * 0.45;
  const r = { x: m.rect.x - padX, y: m.rect.y - padY, w: m.rect.w + padX * 2, h: m.rect.h + padY * 2 };
  card(ctx, r.x, r.y, r.w, r.h, { stroke: o.stroke ?? C.ink, lw: o.lw ?? 3, alpha: a });
  math(ctx, node, x, y, { size, alpha: a });
  return { ...m, rect: r };
}

// A line struck through a box, from its lower left to its upper right, drawn up to p.
export function strike(ctx, b, p, o = {}) {
  const prog = clamp(p);
  if (!b || prog <= 0 || (o.alpha ?? 1) <= 0.001) return;
  const inset = o.inset ?? 6;
  const x0 = b.x + inset;
  const y0 = b.y + b.h - inset;
  const x1 = b.x + b.w - inset;
  const y1 = b.y + inset;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.strokeStyle = o.color ?? C.accent;
  ctx.lineWidth = o.lw ?? 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(lerp(x0, x1, prog), lerp(y0, y1, prog));
  ctx.stroke();
  ctx.restore();
}

// A cross: "no". r is half its width; it grows in with p.
export function cross(ctx, cx, cy, r, p, o = {}) {
  if (p <= 0.001) return;
  const k = r * p;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.strokeStyle = o.color ?? C.accent;
  ctx.lineWidth = o.lw ?? 12;
  ctx.lineCap = o.cap ?? 'round';
  ctx.beginPath();
  ctx.moveTo(cx - k, cy - k);
  ctx.lineTo(cx + k, cy + k);
  ctx.moveTo(cx + k, cy - k);
  ctx.lineTo(cx - k, cy + k);
  ctx.stroke();
  ctx.restore();
}
