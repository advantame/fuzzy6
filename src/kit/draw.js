// Canvas helpers shared by decks. Every function takes the 2D context first and works in the
// stage's logical coordinates (1600×900, spec §6.2). Nothing here keeps state between frames.

import { clamp } from './ease.js';

// ——— text ————————————————————————————————————————————————————————

const widths = new Map();

// Width of `s` in `font` (letter spacing `ls` px included). Cached: setup-time layout calls
// this a lot and fonts do not change once loaded.
export function measure(ctx, font, s, ls = 0) {
  const key = `${font}|${ls}|${s}`;
  let w = widths.get(key);
  if (w === undefined) {
    ctx.save();
    ctx.font = font;
    ctx.letterSpacing = `${ls}px`;
    w = ctx.measureText(s).width;
    ctx.restore();
    widths.set(key, w);
  }
  return w;
}

// Draw one line of text. o: { font, color, align, base, alpha, ls }. Returns its width.
export function text(ctx, s, x, y, o = {}) {
  const a = o.alpha ?? 1;
  const font = o.font ?? ctx.font;
  const w = measure(ctx, font, s, o.ls ?? 0);
  if (a <= 0.001) return w;
  ctx.save();
  ctx.font = font;
  ctx.letterSpacing = `${o.ls ?? 0}px`;
  ctx.fillStyle = o.color ?? ctx.fillStyle;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.base ?? 'alphabetic';
  ctx.globalAlpha *= a;
  ctx.fillText(s, x, y);
  ctx.restore();
  return w;
}

// The first p (0–1) of a string, by characters (surrogate-safe).
export function typed(s, p) {
  const chars = Array.from(s);
  return chars.slice(0, Math.round(chars.length * clamp(p))).join('');
}

// Characters that may not start a line, and ones that may not end one (kinsoku).
const NO_START = new Set('、。，．,.)）」』】〕〉》！？!?：:；;ー…ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ々');
const NO_END = new Set('(（「『【〔〈《');

// Break text into lines no wider than maxW. Latin words and numbers stay whole; Japanese
// breaks between characters, respecting the kinsoku sets above. '\n' forces a break.
export function wrap(ctx, font, s, maxW, ls = 0) {
  const out = [];
  for (const para of s.split('\n')) {
    const units = para.match(/[A-Za-z0-9][A-Za-z0-9.,'’%+\-/:]*|\s+|./gu) ?? [];
    let line = '';
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      const next = line + u;
      if (line && measure(ctx, font, next.trimEnd(), ls) > maxW) {
        // pull a forbidden line-start back onto this line, push a forbidden line-end forward
        if (NO_START.has(u[0])) {
          line += u;
          continue;
        }
        let carry = '';
        while (line && NO_END.has(line[line.length - 1])) {
          carry = line[line.length - 1] + carry;
          line = line.slice(0, -1);
        }
        out.push(line.trimEnd());
        line = (carry + u).trimStart();
      } else line = next;
    }
    out.push(line.trimEnd());
  }
  return out;
}

// Reveal whatever fn draws from left to right inside the box (x, y, w, h), p in 0–1.
export function wipe(ctx, p, x, y, w, h, fn) {
  if (p <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w * clamp(p), h);
  ctx.clip();
  fn();
  ctx.restore();
}

// ——— shapes ————————————————————————————————————————————————————————

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
}

// A straight line drawn up to fraction p of its length.
export function line(ctx, x1, y1, x2, y2, p = 1) {
  if (p <= 0) return;
  p = clamp(p);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p);
  ctx.stroke();
}

// Points along a quadratic curve, for drawing it partially with path().
export function quadPoints(x1, y1, cx, cy, x2, y2, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = (1 - u) * (1 - u);
    const b = 2 * (1 - u) * u;
    const c = u * u;
    pts.push([a * x1 + b * cx + c * x2, a * y1 + b * cy + c * y2]);
  }
  return pts;
}

// Stroke a polyline up to fraction p of its total length. Returns the end point and its
// heading (radians), so an arrowhead can sit on the drawn tip.
export function path(ctx, pts, p = 1) {
  if (p <= 0 || pts.length < 2) return null;
  const lens = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(l);
    total += l;
  }
  let left = total * clamp(p);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  let end = { x: pts[0][0], y: pts[0][1], a: 0 };
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const a = Math.atan2(y1 - y0, x1 - x0);
    if (left >= lens[i - 1]) {
      ctx.lineTo(x1, y1);
      left -= lens[i - 1];
      end = { x: x1, y: y1, a };
    } else {
      const u = lens[i - 1] ? left / lens[i - 1] : 0;
      const x = x0 + (x1 - x0) * u;
      const y = y0 + (y1 - y0) * u;
      ctx.lineTo(x, y);
      end = { x, y, a };
      break;
    }
  }
  ctx.stroke();
  return end;
}

// A filled triangular arrowhead with its tip at (x, y), pointing along angle a.
export function arrowHead(ctx, x, y, a, size = 14) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(a - 0.45) * size, y - Math.sin(a - 0.45) * size);
  ctx.lineTo(x - Math.cos(a + 0.45) * size, y - Math.sin(a + 0.45) * size);
  ctx.closePath();
  ctx.fill();
}

// Line with an arrowhead, drawn up to p. The head appears once the shaft is nearly done.
export function arrow(ctx, x1, y1, x2, y2, p = 1, size = 14) {
  if (p <= 0) return;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const back = Math.min(size * 0.8, Math.hypot(x2 - x1, y2 - y1));
  const ex = x2 - Math.cos(a) * back;
  const ey = y2 - Math.sin(a) * back;
  line(ctx, x1, y1, ex, ey, clamp(p / 0.85));
  if (p > 0.85) {
    ctx.save();
    ctx.globalAlpha *= clamp((p - 0.85) / 0.15);
    arrowHead(ctx, x2, y2, a, size);
    ctx.restore();
  }
}

// Run fn with extra alpha and a vertical offset — the usual "fade up" entrance.
export function fadeUp(ctx, a, dy, fn) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.translate(0, dy);
  fn();
  ctx.restore();
}

// Run fn scaled about (cx, cy).
export function scaled(ctx, s, cx, cy, fn) {
  if (s <= 0.0001) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}
