// Formulas on the stage. A formula is built from small nodes and laid out at one size:
// function names (sin, cos, tan) and numbers upright, letters (θ, α, a) italic, Japanese
// words in the Japanese face, fractions stacked, roots with a drawn radical.
//
//   math(ctx, row('sin θ =', frac(jp('高さ', C.sin), '斜辺')), x, y, { size: 44 })
//
// Strings inside row/frac/sqrt are split on spaces and each piece is typed by its look:
// 'sin' → function, '0.78' or '38°' → number, '=' → operator, 'θ' → letter, '高さ' → Japanese.
// math() draws with the left end of the baseline at (x, y) and returns where it went: rect is
// the whole formula, and parts the pieces wrapped in tag('name', …), so a ring can go round
// exactly the denominator or the 2 of sin² without measuring by hand.

import { measure } from '../../../src/kit/draw.js';
import { C, F } from './theme.js';

const FN = new Set(['sin', 'cos', 'tan']);
const OPS = new Set(['=', '+', '−', '×', '÷', '≒', '≈', '<', '>', '→', ',']);

export const fn = (s, color) => ({ t: 'text', s, face: 'up', kind: 'fn', color });
export const v = (s, color) => ({ t: 'text', s, face: 'it', kind: 'var', color });
export const n = (s, color) => ({ t: 'text', s, face: 'up', kind: 'num', color });
export const op = (s, color) => ({ t: 'text', s, face: 'up', kind: 'op', color });
export const jp = (s, color, weight) => ({ t: 'text', s, face: 'jp', kind: 'jp', color, weight });
export const up = (s, color, weight) => ({ t: 'text', s, face: 'up', kind: 'up', color, weight });
export const frac = (num, den, color) => ({ t: 'frac', num: node(num), den: node(den), color });
export const sqrt = (a, color) => ({ t: 'sqrt', a: node(a), color });
export const sup = (a, s, color) => ({ t: 'sup', a: node(a), s: node(s), color });
export const paren = (...items) => row('(', ...items, ')');
export const row = (...items) => ({ t: 'row', items: items.flatMap(split) });
export const colored = (color, ...items) => ({ ...row(...items), color });
// A piece of a formula whose place math() reports under parts[name].
export const tag = (name, ...items) => ({ t: 'tag', name, a: items.length === 1 ? node(items[0]) : row(...items) });

function node(x) {
  if (typeof x !== 'string') return x;
  const items = split(x);
  return items.length === 1 ? items[0] : { t: 'row', items };
}

function split(x) {
  if (typeof x !== 'string') return [x];
  return x.split(' ').filter(Boolean).map(word);
}

function word(s) {
  if (FN.has(s)) return fn(s);
  if (OPS.has(s)) return op(s);
  if (/^[−-]?[0-9][0-9.,]*°?$/.test(s) || s === '°') return n(s);
  // Greek letters stand upright: the italic θ of this face reads as ϑ
  if (/^[α-ωθ]$/.test(s)) return { ...v(s), face: 'up' };
  if (/^[A-Za-z]$/.test(s)) return v(s);
  if (/^[()（）[\]]$/.test(s)) return up(s);
  if (/[　-鿿＀-￯]/.test(s)) return jp(s);
  return up(s);
}

const fontOf = (face, size, weight) => (face === 'it' ? F.it(400, size) : face === 'jp' ? F.jp(weight ?? 500, size) : F.sans(weight ?? 400, size));

// Layout: every node becomes { w, asc, desc, draw(ctx, x, y, color) }.
function layout(nd, size, inherited) {
  const color = nd.color ?? inherited;
  if (nd.t === 'text') {
    const font = fontOf(nd.face, size, nd.weight);
    const w = measure(ctx0(), font, nd.s);
    return {
      w,
      asc: size * 0.74,
      desc: size * 0.22,
      kind: nd.kind,
      s: nd.s,
      draw(ctx, x, y) {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(nd.s, x, y);
      },
    };
  }
  if (nd.t === 'row') {
    const boxes = nd.items.map((it) => layout(it, size, color));
    const gaps = boxes.map((b, i) => (i === 0 ? 0 : gap(boxes[i - 1], b, size)));
    const w = boxes.reduce((s, b, i) => s + b.w + gaps[i], 0);
    return {
      w,
      asc: Math.max(size * 0.74, ...boxes.map((b) => b.asc)),
      desc: Math.max(size * 0.22, ...boxes.map((b) => b.desc)),
      kind: boxes.length === 1 ? boxes[0].kind : 'row',
      draw(ctx, x, y) {
        let cx = x;
        boxes.forEach((b, i) => {
          cx += gaps[i];
          b.draw(ctx, cx, y);
          cx += b.w;
        });
      },
      parts(x, y, out) {
        let cx = x;
        boxes.forEach((b, i) => {
          cx += gaps[i];
          b.parts?.(cx, y, out);
          cx += b.w;
        });
      },
    };
  }
  if (nd.t === 'tag') {
    const b = layout(nd.a, size, color);
    return {
      ...b,
      parts(x, y, out) {
        out[nd.name] = { x, y: y - b.asc, w: b.w, h: b.asc + b.desc };
        b.parts?.(x, y, out);
      },
    };
  }
  if (nd.t === 'frac') {
    const s2 = size * 0.86;
    const a = layout(nd.num, s2, color);
    const b = layout(nd.den, s2, color);
    const pad = size * 0.14;
    const w = Math.max(a.w, b.w) + pad * 2;
    const axis = size * 0.3; // the bar sits this far above the baseline
    const g = size * 0.14;
    return {
      w,
      asc: axis + g + a.desc + a.asc,
      desc: -axis + g + b.asc + b.desc,
      kind: 'frac',
      draw(ctx, x, y) {
        const bar = y - axis;
        a.draw(ctx, x + (w - a.w) / 2, bar - g - a.desc);
        b.draw(ctx, x + (w - b.w) / 2, bar + g + b.asc);
        ctx.fillStyle = color;
        ctx.fillRect(x, bar - Math.max(1.5, size * 0.035), w, Math.max(3, size * 0.07));
      },
      parts(x, y, out) {
        const bar = y - axis;
        a.parts?.(x + (w - a.w) / 2, bar - g - a.desc, out);
        b.parts?.(x + (w - b.w) / 2, bar + g + b.asc, out);
      },
    };
  }
  if (nd.t === 'sqrt') {
    const a = layout(nd.a, size, color);
    const lw = Math.max(2, size * 0.06);
    const hook = size * 0.5;
    const top = a.asc + size * 0.12;
    return {
      w: hook + a.w + size * 0.08,
      asc: top + lw,
      desc: a.desc,
      kind: 'sqrt',
      draw(ctx, x, y) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.3);
        ctx.lineTo(x + hook * 0.28, y - size * 0.4);
        ctx.lineTo(x + hook * 0.6, y + a.desc * 0.6);
        ctx.lineTo(x + hook, y - top);
        ctx.lineTo(x + hook + a.w + size * 0.08, y - top);
        ctx.stroke();
        a.draw(ctx, x + hook + size * 0.02, y);
      },
      parts(x, y, out) {
        a.parts?.(x + hook + size * 0.02, y, out);
      },
    };
  }
  if (nd.t === 'sup') {
    const a = layout(nd.a, size, color);
    const s = layout(nd.s, size * 0.6, color);
    const raise = size * 0.42;
    return {
      w: a.w + s.w + size * 0.04,
      asc: Math.max(a.asc, raise + s.asc),
      desc: a.desc,
      kind: a.kind,
      draw(ctx, x, y) {
        a.draw(ctx, x, y);
        s.draw(ctx, x + a.w + size * 0.04, y - raise);
      },
      parts(x, y, out) {
        a.parts?.(x, y, out);
        s.parts?.(x + a.w + size * 0.04, y - raise, out);
      },
    };
  }
  throw new Error(`unknown math node ${nd.t}`);
}

// Space between two neighbours: a little after a function name, more around operators.
function gap(a, b, size) {
  if (a.kind === 'op' || b.kind === 'op') return size * 0.3;
  if (a.kind === 'fn') return size * 0.18;
  if (b.s === ')' || a.s === '(') return size * 0.04;
  if (a.kind === 'jp' && b.kind === 'jp') return size * 0.04;
  return size * 0.12;
}

let scratch = null;
function ctx0() {
  if (!scratch) scratch = document.createElement('canvas').getContext('2d');
  return scratch;
}

// Measure without drawing: { w, asc, desc }.
export function box(nd, size = 44) {
  return layout(nd, size, C.ink);
}

// Draw a formula. o: { size, color, alpha, align: 'left' | 'center' | 'right' }. Returns its
// box (w, asc, desc), x (the left end), rect ({ x, y, w, h } on the stage) and parts (the rects
// of the tagged pieces) — also when alpha is 0, so a clip can lay out around what is not shown
// yet.
export function math(ctx, nd, x, y, o = {}) {
  const size = o.size ?? 44;
  const b = layout(nd, size, o.color ?? C.ink);
  const a = o.alpha ?? 1;
  const x0 = o.align === 'center' ? x - b.w / 2 : o.align === 'right' ? x - b.w : x;
  const parts = {};
  b.parts?.(x0, y, parts);
  const out = { ...b, x: x0, rect: { x: x0, y: y - b.asc, w: b.w, h: b.asc + b.desc }, parts };
  if (a <= 0.001) return out;
  ctx.save();
  ctx.globalAlpha *= a;
  b.draw(ctx, x0, y);
  ctx.restore();
  return out;
}
