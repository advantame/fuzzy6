// Formulas and the small parts around them. Formulas are TeX, typeset by MathJax and drawn on
// the canvas glyph by glyph (src/kit/tex.js), so they look as in a book and every piece named
// with \el{name}{…} can be coloured, faded or moved on its own:
//
//   tex(ctx, String.raw`\el{u}{u}+\el{v}{v}+\el{w}{w}=0`, x, y, { size: 44, colors: { u: C.A } })
//
// Colours and fades are given per piece when drawing, not written into the TeX, so a formula is
// laid out once and keeps its place while its pieces come in one by one.

import { drawTex, texBox } from '../../../src/kit/tex.js';
import { clamp, lerp } from '../../../src/kit/ease.js';
import { rr, text, measure } from '../../../src/kit/draw.js';
import { C, F } from './theme.js';

let scratch = null;
const ctx0 = () => (scratch ??= document.createElement('canvas').getContext('2d'));

// Draw a formula with (x, y) the left end of its baseline (o.align 'center' / 'right' move it).
// o: drawTex's options, and colors / alphas: { piece: value } as a shorthand for o.parts.
// Returns drawTex's report: { w, asc, desc, x, rect, parts } — also when alpha is 0.
export function tex(ctx, src, x, y, o = {}) {
  const parts = { ...(o.parts ?? {}) };
  for (const [k, c] of Object.entries(o.colors ?? {})) parts[k] = { ...(parts[k] ?? {}), color: c };
  for (const [k, a] of Object.entries(o.alphas ?? {})) parts[k] = { ...(parts[k] ?? {}), alpha: a };
  return drawTex(ctx, src, x, y, { color: C.ink, font: F.plain, ...o, parts });
}

// The size of a formula at `size` px: { w, asc, desc }.
export const texSize = (src, size = 44) => texBox(src, size);

// A white card with a thin rule round it. o: { stroke, lw, r, fill, alpha }.
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

// A formula worth keeping — a definition, a step of the proof, a result — on a white card
// framed in ink, with an optional title on a tab across the top edge. (x, y) is the first line's
// baseline start; each later line goes below the last. lines: TeX strings, or { src, size,
// colors, alphas, parts, alpha } for one line. o: { title, size, gap, pad, padY, stroke, lw,
// alpha, align: 'left' | 'center' }. Returns { rect, card, lines, parts } — also when alpha is
// 0, so a clip can measure it before showing it.
export function formulaBox(ctx, lines, x, y, o = {}) {
  const size = o.size ?? 44;
  const a = o.alpha ?? 1;
  const items = (Array.isArray(lines) ? lines : [lines]).map((l) => (typeof l === 'string' ? { src: l, size } : { size, ...l }));
  const lead = o.gap ?? size * 0.45;
  const boxes = items.map((it) => texBox(it.src, it.size));
  const bases = [];
  boxes.forEach((b, i) => bases.push(i === 0 ? y : bases[i - 1] + boxes[i - 1].desc + lead + b.asc));
  const wide = Math.max(...boxes.map((b) => b.w));
  const left = (i) => (o.align === 'center' ? x + (wide - boxes[i].w) / 2 : x);
  const inner = union(boxes.map((b, i) => ({ x: left(i), y: bases[i] - b.asc, w: b.w, h: b.asc + b.desc })));

  const stroke = o.stroke ?? C.ink;
  const ts = o.titleSize ?? 24;
  const tab = o.title ? { h: ts * 1.5, w: measure(ctx0(), F.jp(700, ts), o.title) + ts * 1.2 } : null;
  const padX = o.pad ?? 22;
  const padY = o.padY ?? size * 0.42;
  const padTop = tab ? Math.max(padY, tab.h / 2 + ts * 0.6) : padY;
  const card0 = { x: inner.x - padX, y: inner.y - padTop, w: inner.w + padX * 2, h: inner.h + padTop + padY };
  const tabBox = tab ? { x: card0.x + 20, y: card0.y - tab.h / 2, w: tab.w, h: tab.h } : null;

  card(ctx, card0.x, card0.y, card0.w, card0.h, { stroke, lw: o.lw ?? 2.5, alpha: a });
  if (tab && a > 0.001) {
    ctx.save();
    ctx.globalAlpha *= a;
    rr(ctx, tabBox.x, tabBox.y, tabBox.w, tabBox.h, tab.h / 2);
    ctx.fillStyle = stroke;
    ctx.fill();
    text(ctx, o.title, tabBox.x + tabBox.w / 2, card0.y + ts * 0.36, { font: F.jp(700, ts), color: C.white, align: 'center' });
    ctx.restore();
  }
  const drawn = items.map((it, i) => tex(ctx, it.src, left(i), bases[i], { ...it, alpha: a * (it.alpha ?? 1) }));
  return {
    rect: union([card0, tabBox].filter(Boolean)),
    card: card0,
    lines: drawn,
    parts: Object.assign({}, ...drawn.map((m) => m.parts)),
  };
}

export function union(rs) {
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
}

// A pill with a word on it, white on colour: a name given to something (定義, 別の図). (x, y)
// is its left end's middle, or its centre with o.align 'center'. o: { color, size, alpha,
// align }. Returns its box.
export function pill(ctx, s, x, y, o = {}) {
  const size = o.size ?? 24;
  const font = F.jp(700, size);
  const padX = size * 0.75;
  const h = size * 1.75;
  const w = measure(ctx0(), font, s) + padX * 2;
  const x0 = o.align === 'center' ? x - w / 2 : x;
  const b = { x: x0, y: y - h / 2, w, h };
  const a = o.alpha ?? 1;
  if (a <= 0.001) return b;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, b.x, b.y, w, h, h / 2);
  ctx.fillStyle = o.color ?? C.ink;
  ctx.fill();
  text(ctx, s, x0 + w / 2, y + size * 0.36, { font, color: C.white, align: 'center' });
  ctx.restore();
  return b;
}

// A line struck through a box, along its middle, drawn up to p.
export function strike(ctx, b, p, o = {}) {
  const prog = clamp(p);
  if (!b || prog <= 0 || (o.alpha ?? 1) <= 0.001) return;
  const y = b.y + b.h * 0.55;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.strokeStyle = o.color ?? C.accent;
  ctx.lineWidth = o.lw ?? 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(b.x - 4, y);
  ctx.lineTo(lerp(b.x - 4, b.x + b.w + 4, prog), y);
  ctx.stroke();
  ctx.restore();
}

// A cross: "not this one". r is half its width; it grows in with p.
export function cross(ctx, cx, cy, r, p, o = {}) {
  if (p <= 0.001) return;
  const k = r * clamp(p);
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.strokeStyle = o.color ?? C.accent;
  ctx.lineWidth = o.lw ?? 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - k, cy - k);
  ctx.lineTo(cx + k, cy + k);
  ctx.moveTo(cx + k, cy - k);
  ctx.lineTo(cx - k, cy + k);
  ctx.stroke();
  ctx.restore();
}

// A short note in Japanese (with Computer Modern numbers), left-aligned at (x, y) baseline.
export function note(ctx, s, x, y, o = {}) {
  return text(ctx, s, x, y, { font: F.jp(o.weight ?? 500, o.size ?? 26), color: o.color ?? C.ink2, align: o.align, alpha: o.alpha });
}
