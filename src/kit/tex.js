// Formulas written in TeX, typeset by MathJax and drawn on a canvas glyph by glyph, so that they
// look like formulas in a book (Computer Modern) and every piece of one can still be moved.
//
//   drawTex(ctx, String.raw`\frac{\el{num}{BC}}{AC} = \frac{EF}{DF}`, x, y, { size: 44 })
//
// \el{name}{…} names a piece. drawTex() reports where each named piece went (parts.name: its
// box, and the baseline and size it is set at), and o.parts.name can fade, colour, move or scale
// that piece without touching the layout: { alpha, color, dx, dy, scale } — dx, dy in px, scale
// about the piece's centre. The layout of a formula depends on its TeX only, so a formula whose
// pieces come in one by one keeps its place while they do.
//
// Japanese inside \text{…} is laid out as full-width characters at CJK em (MathJax measures
// nothing here) and drawn with o.font, which should be a face whose kana and kanji are full
// width. MathJax runs once per distinct TeX string; the result is cached.
//
// (x, y) is the left end of the baseline, as for fillText. Units inside a layout are MathJax's:
// 1000 to the em, y downwards from the baseline.

import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import 'mathjax-full/js/input/tex/base/BaseConfiguration.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/html/HtmlConfiguration.js';
import 'mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js';
import 'mathjax-full/js/input/tex/configmacros/ConfigMacrosConfiguration.js';

// the width of a Japanese character, in em of the formula
export const CJK = 0.9;

let doc = null;
let adaptor = null;
function jax() {
  if (doc) return doc;
  adaptor = liteAdaptor({ fontSize: 16, cjkCharWidth: CJK });
  RegisterHTMLHandler(adaptor);
  doc = mathjax.document('', {
    InputJax: new TeX({
      packages: ['base', 'ams', 'html', 'newcommand', 'configmacros'],
      macros: { el: ['\\cssId{#1}{#2}', 2] },
    }),
    OutputJax: new SVG({ fontCache: 'none' }),
  });
  return doc;
}

// ——— matrices: [a, b, c, d, e, f] as canvas takes them ————————————————————

const I = [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

function parseTransform(s) {
  let m = I;
  for (const [, fn, args] of s.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const a = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (fn === 'translate') m = mul(m, [1, 0, 0, 1, a[0], a[1] ?? 0]);
    else if (fn === 'scale') m = mul(m, [a[0], 0, 0, a[1] ?? a[0], 0, 0]);
    else if (fn === 'matrix') m = mul(m, a);
    else throw new Error(`tex: unknown transform ${fn}`);
  }
  return m;
}

// ——— boxes ——————————————————————————————————————————————————————————

const glyphBoxes = new Map();
// how many numbers each path command takes; MathJax draws its glyphs with these, absolute
const ARGS = { M: 2, L: 2, T: 2, Q: 4, S: 4, C: 6, H: 1, V: 1, Z: 0 };

// The box of a glyph's outline from the points of its path (control points included: a little
// generous on curves, never short).
function pathBox(d) {
  let b = glyphBoxes.get(d);
  if (b) return b;
  b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const add = (x, y) => {
    b.x0 = Math.min(b.x0, x);
    b.x1 = Math.max(b.x1, x);
    b.y0 = Math.min(b.y0, y);
    b.y1 = Math.max(b.y1, y);
  };
  let cx = 0;
  let cy = 0;
  for (const [, c, args] of d.matchAll(/([a-z])([^a-z]*)/gi)) {
    const n = ARGS[c];
    if (n === undefined) throw new Error(`tex: path command ${c} (only absolute ones are read)`);
    const ns = args.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)?.map(Number) ?? [];
    for (let j = 0; n > 0 && j + n <= ns.length; j += n) {
      if (c === 'H') cx = ns[j];
      else if (c === 'V') cy = ns[j];
      else {
        for (let q = 0; q < n; q += 2) add(ns[j + q], ns[j + q + 1]);
        cx = ns[j + n - 2];
        cy = ns[j + n - 1];
      }
      add(cx, cy);
    }
  }
  if (!Number.isFinite(b.x0)) b = { x0: 0, y0: 0, x1: 0, y1: 0 };
  glyphBoxes.set(d, b);
  return b;
}

// A local box carried through m to a box in formula units.
function through(m, b) {
  const pts = [apply(m, b.x0, b.y0), apply(m, b.x1, b.y0), apply(m, b.x0, b.y1), apply(m, b.x1, b.y1)];
  return {
    x0: Math.min(...pts.map((p) => p[0])),
    y0: Math.min(...pts.map((p) => p[1])),
    x1: Math.max(...pts.map((p) => p[0])),
    y1: Math.max(...pts.map((p) => p[1])),
  };
}
const merge = (a, b) => (a ? { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) } : b);

// ——— layout ———————————————————————————————————————————————————————————

const layouts = new Map();
const MAX = 600;

// The layout of a TeX string: { w, asc, desc, items, groups } in formula units. items are what
// to draw (glyph outlines, rules, Japanese characters), each with its matrix, the named pieces
// it belongs to (outermost first) and its colour if TeX gave one; groups the named pieces, with
// their box and the origin and scale they are set at.
export function texLayout(src) {
  let L = layouts.get(src);
  if (L) {
    layouts.delete(src);
    layouts.set(src, L);
    return L;
  }
  const d = jax();
  const out = d.convert(src, { display: true, em: 16, ex: 8, containerWidth: 100000 });
  const svg = adaptor.firstChild(out);
  const vb = adaptor.getAttribute(svg, 'viewBox').split(/\s+/).map(Number);
  const items = [];
  const groups = {};
  const walk = (node, m, ids, fill) => {
    const kind = adaptor.kind(node);
    if (kind === '#text' || kind === '#comment') return null;
    const err = adaptor.getAttribute(node, 'data-mjx-error');
    if (err) throw new Error(`tex: ${err} in ${src}`);
    const tr = adaptor.getAttribute(node, 'transform');
    const here = tr ? mul(m, parseTransform(tr)) : m;
    const id = adaptor.getAttribute(node, 'id');
    const ids2 = id ? [...ids, id] : ids;
    const f = adaptor.getAttribute(node, 'fill');
    const fill2 = f && f !== 'currentColor' ? f : fill;
    let box = null;
    if (kind === 'path') {
      const path = adaptor.getAttribute(node, 'd');
      if (path) {
        box = through(here, pathBox(path));
        items.push({ type: 'path', d: path, m: here, ids: ids2, fill: fill2, box });
      }
    } else if (kind === 'rect') {
      if (adaptor.getAttribute(node, 'data-background')) return null;
      const r = ['x', 'y', 'width', 'height'].map((k) => Number(adaptor.getAttribute(node, k) ?? 0));
      box = through(here, { x0: r[0], y0: r[1], x1: r[0] + r[2], y1: r[1] + r[3] });
      items.push({ type: 'rect', r, m: here, ids: ids2, fill: fill2, box });
    } else if (kind === 'text') {
      // MathJax puts an empty text at the top of a piece with an id (to scroll to); skip it
      const s = adaptor.textContent(node);
      if (!s) return null;
      const em = CJK * 1000;
      // the character's em box: 0.88 above the baseline, 0.12 below (here, y runs downwards)
      box = through(here, { x0: 0, y0: -0.88 * em, x1: em * Array.from(s).length, y1: 0.12 * em });
      items.push({ type: 'text', s, m: here, ids: ids2, fill: fill2, box });
    }
    for (const c of adaptor.childNodes(node)) {
      const b = walk(c, here, ids2, fill2);
      if (b) box = merge(box, b);
    }
    if (id && box) {
      // a piece with an id is moved to its top and its content moved back down inside a
      // data-idbox group: the baseline is where that group puts its origin
      const inner = adaptor.childNodes(node).find((c) => adaptor.kind(c) === 'g' && adaptor.getAttribute(c, 'data-idbox'));
      const at = inner ? mul(here, parseTransform(adaptor.getAttribute(inner, 'transform') ?? '')) : here;
      const o = apply(at, 0, 0);
      groups[id] = { box, base: o[1], x: o[0], scale: Math.abs(at[0]) };
    }
    return box;
  };
  for (const c of adaptor.childNodes(svg)) walk(c, I, [], null);
  L = { w: vb[2], asc: -vb[1], desc: vb[3] + vb[1], items, groups };
  layouts.set(src, L);
  if (layouts.size > MAX) layouts.delete(layouts.keys().next().value);
  return L;
}

// The size of a formula at `size` px: { w, asc, desc }.
export function texBox(src, size = 44) {
  const L = texLayout(src);
  const k = size / 1000;
  return { w: L.w * k, asc: L.asc * k, desc: L.desc * k };
}

// ——— drawing ———————————————————————————————————————————————————————————

const paths = new Map();
const path2d = (d) => {
  let p = paths.get(d);
  if (!p) {
    p = new Path2D(d);
    paths.set(d, p);
  }
  return p;
};

const rectOf = (b, x0, y, k) => ({ x: x0 + b.x0 * k, y: y + b.y0 * k, w: (b.x1 - b.x0) * k, h: (b.y1 - b.y0) * k });

// Draw a formula. o: { size, color, alpha, align: 'left' | 'center' | 'right', parts (by
// piece name: { alpha, color, weight, dx, dy, scale }), font: (weight, px) → the canvas font
// for Japanese }. Returns { w, asc, desc, x (the left end), rect, parts } — parts.name is the
// piece's box with ox and base (where its baseline starts) and size (the px it is set at). It returns the same
// when alpha is 0, without drawing, so a clip can lay out around what is not shown yet.
export function drawTex(ctx, src, x, y, o = {}) {
  const size = o.size ?? 44;
  const k = size / 1000;
  const L = texLayout(src);
  const x0 = o.align === 'center' ? x - (L.w * k) / 2 : o.align === 'right' ? x - L.w * k : x;
  const parts = {};
  for (const [id, g] of Object.entries(L.groups)) {
    if (id.startsWith('_')) continue;
    parts[id] = { ...rectOf(g.box, x0, y, k), ox: x0 + g.x * k, base: y + g.base * k, size: size * g.scale };
  }
  const out = { w: L.w * k, asc: L.asc * k, desc: L.desc * k, x: x0, rect: { x: x0, y: y - L.asc * k, w: L.w * k, h: (L.asc + L.desc) * k }, parts };
  const a = o.alpha ?? 1;
  if (a <= 0.001) return out;
  const P = o.parts ?? {};
  const font = o.font ?? ((w, px) => `${w} ${px}px sans-serif`);
  ctx.save();
  ctx.globalAlpha *= a;
  for (const it of L.items) {
    let alpha = 1;
    let color = it.fill ?? o.color ?? '#000';
    let weight = 500;
    let move = I;
    for (const id of it.ids) {
      const p = P[id];
      if (!p) continue;
      if (p.alpha != null) alpha *= p.alpha;
      if (p.color) color = p.color;
      if (p.weight) weight = p.weight;
      if (p.dx || p.dy || (p.scale != null && p.scale !== 1)) {
        const g = L.groups[id];
        const cx = (g.box.x0 + g.box.x1) / 2;
        const cy = (g.box.y0 + g.box.y1) / 2;
        const s = p.scale ?? 1;
        move = mul(move, [s, 0, 0, s, cx - s * cx + (p.dx ?? 0) / k, cy - s * cy + (p.dy ?? 0) / k]);
      }
    }
    if (alpha <= 0.001) continue;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, alpha);
    ctx.translate(x0, y);
    ctx.scale(k, k);
    if (move !== I) ctx.transform(...move);
    ctx.transform(...it.m);
    ctx.fillStyle = color;
    if (it.type === 'path') ctx.fill(path2d(it.d));
    else if (it.type === 'rect') ctx.fillRect(...it.r);
    else {
      ctx.font = font(weight, CJK * 1000);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(it.s, 0, 0);
    }
    ctx.restore();
  }
  ctx.restore();
  return out;
}
