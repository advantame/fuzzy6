// Recurring pieces of the LLM deck's pictures: paper, token chips, chat bubbles, tags,
// source notes, big numbers. Each draws one frame and keeps no state.

import { clamp, outExpo } from '../../../src/kit/ease.js';
import { text, measure, rr, circle, wrap } from '../../../src/kit/draw.js';
import { C, F, W, H, M } from './theme.js';

// ——— ground ————————————————————————————————————————————————————

const grids = new WeakMap();

// Paper with a faint dot grid every 40 px (the grid is optional per clip).
export function paper(ctx, grid = true) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  if (!grid) return;
  let pat = grids.get(ctx);
  if (!pat) {
    const c = document.createElement('canvas');
    c.width = c.height = 80;
    const g = c.getContext('2d');
    g.fillStyle = C.grid;
    g.beginPath();
    g.arc(40, 40, 2.6, 0, Math.PI * 2);
    g.fill();
    pat = ctx.createPattern(c, 'repeat');
    pat.setTransform(new DOMMatrix().scale(0.5));
    grids.set(ctx, pat);
  }
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
}

// ——— numbers ————————————————————————————————————————————————————

// 117000000 → '1億1700万', 2048 → '2,048'
export function jaNum(n) {
  n = Math.round(n);
  if (Math.abs(n) < 1e4) return n.toLocaleString('en-US');
  let out = '';
  for (const [u, name] of [[1e12, '兆'], [1e8, '億'], [1e4, '万']]) {
    const q = Math.floor(n / u);
    if (q) {
      out += q + name;
      n -= q * u;
    }
  }
  return n ? out + n : out;
}

// ——— labels ————————————————————————————————————————————————————

// A small rounded label. o: { font, h, padX, fill, color, stroke, alpha, align }.
// Returns its width.
export function tag(ctx, x, y, s, o = {}) {
  const font = o.font ?? F.jp(500, 18);
  const h = o.h ?? 32;
  const padX = o.padX ?? 12;
  const w = measure(ctx, font, s, o.ls ?? 0) + padX * 2;
  const a = o.alpha ?? 1;
  if (a <= 0.001) return w;
  const x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x0, y, w, h, o.r ?? h / 2);
  if (o.fill) {
    ctx.fillStyle = o.fill;
    ctx.fill();
  }
  if (o.stroke) {
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.lw ?? 1.5;
    ctx.stroke();
  }
  text(ctx, s, x0 + w / 2, y + h / 2 + 1, { font, color: o.color ?? C.ink, align: 'center', base: 'middle', ls: o.ls });
  ctx.restore();
  return w;
}

// "例" — marks numbers and pictures that illustrate a mechanism rather than report a fact.
export function example(ctx, x, y, a = 1, note = '数値は説明のための例') {
  const w = tag(ctx, x, y, '例', { font: F.jp(700, 17), h: 30, padX: 10, stroke: C.muted, color: C.muted, alpha: a });
  if (note) text(ctx, note, x + w + 10, y + 21, { font: F.jp(400, 17), color: C.muted, alpha: a });
}

// Source line at the bottom right of the stage. Clips that show ずんだもん pass `right` to keep
// the line clear of the ear that reaches into the stage's bottom right corner.
export function source(ctx, s, a = 1, right = W - M.r) {
  text(ctx, s, right, H - 34, { font: F.jp(400, 17), color: C.muted, align: 'right', alpha: a });
}

// Where the right end of a source line goes when ずんだもん is on screen.
export const SOURCE_RIGHT = W - M.r - 130;

// Mono caption in small caps style, e.g. section labels inside a picture.
export function caption(ctx, s, x, y, o = {}) {
  return text(ctx, s, x, y, { font: o.font ?? F.mono(500, 18), color: o.color ?? C.muted, ls: o.ls ?? 1.5, align: o.align, alpha: o.alpha, base: o.base });
}

// ——— token chips ——————————————————————————————————————————————————

// Width a chip would take, without drawing it.
export function chipWidth(ctx, s, o = {}) {
  const font = o.font ?? F.jp(500, 30);
  return Math.max(o.minW ?? 0, measure(ctx, font, s) + (o.padX ?? 14) * 2);
}

// A token chip: the token's text on a tinted, rounded box. Leading spaces show as a faint
// dot so the boundary is visible. o: { font, h, padX, fill, color, stroke, alpha, minW }.
export function chip(ctx, x, y, s, o = {}) {
  const font = o.font ?? F.jp(500, 30);
  const h = o.h ?? 56;
  const padX = o.padX ?? 14;
  const w = chipWidth(ctx, s, o);
  const a = o.alpha ?? 1;
  if (a <= 0.001) return w;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, y, w, h, o.r ?? 10);
  ctx.fillStyle = o.fill ?? C.tints[0];
  ctx.fill();
  if (o.stroke) {
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.lw ?? 2;
    ctx.stroke();
  }
  const lead = s.match(/^ +/)?.[0].length ?? 0;
  const tx = x + (w - measure(ctx, font, s)) / 2;
  if (lead) {
    const sw = measure(ctx, font, ' ');
    ctx.fillStyle = C.muted;
    for (let i = 0; i < lead; i++) {
      circle(ctx, tx + sw * (i + 0.5), y + h / 2 + 2, 2.6);
      ctx.fill();
    }
  }
  text(ctx, s, tx, y + h / 2 + (o.dy ?? 2), { font, color: o.color ?? C.ink, base: 'middle' });
  ctx.restore();
  return w;
}

// ——— chat ————————————————————————————————————————————————————————

const pxOf = (font) => parseInt(font.match(/(\d+)px/)[1], 10);

// Lay out a bubble's text once (setup time): { lines, w, h, … } for bubble().
export function bubbleLayout(ctx, s, maxW, o = {}) {
  const font = o.font ?? F.jp(500, 28);
  const size = pxOf(font);
  const lh = o.lh ?? Math.round(size * 1.5);
  const pad = o.pad ?? 22;
  const lines = wrap(ctx, font, s, maxW - pad * 2);
  const w = Math.min(maxW, Math.max(...lines.map((l) => measure(ctx, font, l))) + pad * 2);
  return { lines, w, h: pad * 2 + size * 1.2 + (lines.length - 1) * lh, font, size, lh, pad };
}

// Draw a laid-out bubble with its top-left at (x, y). o: { fill, color, stroke, alpha, chars }
// — chars (0–1) types the text in.
export function bubble(ctx, x, y, L, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, y, L.w, L.h, o.r ?? 22);
  ctx.fillStyle = o.fill ?? C.panel;
  ctx.fill();
  if (o.stroke) {
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.lw ?? 2;
    ctx.stroke();
  }
  const total = L.lines.reduce((n, l) => n + Array.from(l).length, 0);
  let left = Math.round(total * clamp(o.chars ?? 1));
  L.lines.forEach((l, i) => {
    if (left <= 0) return;
    const chars = Array.from(l);
    const s = chars.slice(0, left).join('');
    left -= chars.length;
    text(ctx, s, x + L.pad, y + L.pad + L.size * 0.62 + i * L.lh, { font: L.font, color: o.color ?? C.ink, base: 'middle' });
  });
  ctx.restore();
}

// ——— history: the year block ————————————————————————————————————————
// Every history clip opens with the same left column: a vermilion tab, the year, who, and
// what (paper or product). The right column (from x = 600) carries the clip's picture.

export const COL = 600;

export function yearBlock(ctx, t, { year, who, what = [], at = 0.1, y = 262 }) {
  const a = outExpo(clamp((t - at) / 0.8));
  if (a <= 0) return;
  ctx.fillStyle = C.accent;
  ctx.fillRect(M.l, y - 196, 72 * a, 10);
  text(ctx, year, M.l, y + (1 - a) * 28, { font: F.cond(700, 172), color: C.ink, alpha: a, ls: -2 });
  const b = outExpo(clamp((t - at - 0.25) / 0.8));
  text(ctx, who, M.l, y + 70 + (1 - b) * 16, { font: F.jp(700, 30), color: C.ink, alpha: b });
  what.forEach((s, i) => {
    const c = outExpo(clamp((t - at - 0.4 - i * 0.08) / 0.8));
    text(ctx, s, M.l, y + 116 + i * 34 + (1 - c) * 12, { font: F.jp(400, 23), color: C.muted, alpha: c });
  });
}

// ——— marks ————————————————————————————————————————————————————————

// Highlighter stroke behind text, swept left to right by p.
export function marker(ctx, x, y, w, h, p, color = C.accentSoft) {
  if (p <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp(p), h);
}

// A dot that pops in (scale overshoot handled by the caller's easing).
export function dot(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  circle(ctx, x, y, r);
  ctx.fill();
}
