// Formulas on the stage, set in TeX: src/kit/tex.js typesets them with MathJax (Computer Modern,
// as in a book) and draws them on the canvas. A formula is either TeX itself, tex(String.raw`…`),
// or built from small nodes, which are turned into TeX:
//
//   math(ctx, row('sin θ =', frac(jp('高さ', C.sin), '斜辺')), x, y, { size: 44 })
//   math(ctx, tex(String.raw`\frac{\el{num}{BC}}{AC} = \frac{EF}{DF}`), x, y, { size: 44 })
//
// Strings inside row/frac/sqrt are split on spaces and each piece is typed by its look:
// 'sin' → function, '0.78' or '38°' → number, '=' → operator, 'θ' or 'x' → letter (italic),
// 'BC' → points (italic, no space), 'm' → unit (upright), '高さ' → Japanese, set in the deck's
// Japanese face. math() draws with the left end of the baseline at (x, y) and returns where it
// went: rect is the whole formula, and parts the pieces named with tag('name', …) or, in TeX,
// \el{name}{…} — so a ring can go round exactly the denominator or the 2 of sin² without
// measuring by hand, and o.parts.name can fade, colour, move or scale that piece (src/kit/tex.js).
// shade(a, …) is a piece drawn at alpha a, for a formula that fills in as it is said; the layout
// stays put while it does.

import { drawTex, texBox, texSVG } from '../../../src/kit/tex.js';
import { C, F } from './theme.js';

const FN = new Set(['sin', 'cos', 'tan']);
const OPS = {
  '=': '=',
  '+': '+',
  '−': '-',
  '-': '-',
  '×': '\\times',
  '÷': '\\div',
  '≒': '\\fallingdotseq',
  '≈': '\\approx',
  '<': '<',
  '>': '>',
  '→': '\\to',
  ',': ',',
  ':': ':',
  '∽': '\\backsim',
};
const GREEK = { α: '\\alpha', β: '\\beta', γ: '\\gamma', θ: '\\theta', φ: '\\varphi', π: '\\pi', ω: '\\omega' };
const UNITS = new Set(['m', 'cm', 'mm', 'km']);

export const fn = (s, color) => ({ t: 'text', s, kind: 'fn', color });
export const v = (s, color) => ({ t: 'text', s, kind: 'var', color });
export const n = (s, color) => ({ t: 'text', s, kind: 'num', color });
export const op = (s, color) => ({ t: 'text', s, kind: 'op', color });
export const unit = (s, color) => ({ t: 'text', s, kind: 'unit', color });
export const jp = (s, color, weight) => ({ t: 'text', s, kind: 'jp', color, weight });
// an upright word (co, sine); bold from weight 600
export const up = (s, color, weight) => ({ t: 'text', s, kind: 'up', color, weight });
// The name of a point of a figure (A, B, …), italic as in a book. Names side by side make a
// segment's name (EF), and each letter can still be tagged on its own.
export const pt = (s, color) => ({ t: 'text', s, kind: 'pt', color });
// TeX as it is.
export const tex = (s, color) => ({ t: 'tex', s, color });
export const frac = (num, den, color) => ({ t: 'frac', num: node(num), den: node(den), color });
export const sqrt = (a, color) => ({ t: 'sqrt', a: node(a), color });
export const sup = (a, s, color) => ({ t: 'sup', a: node(a), s: node(s), color });
export const paren = (...items) => row('(', ...items, ')');
export const row = (...items) => ({ t: 'row', items: items.flatMap(split) });
export const colored = (color, ...items) => ({ ...row(...items), color });
// A piece of a formula whose place math() reports under parts[name].
export const tag = (name, ...items) => ({ t: 'tag', name, a: items.length === 1 ? node(items[0]) : row(...items) });
// A piece drawn at alpha a (0–1) that keeps its place.
export const shade = (a, ...items) => ({ t: 'shade', alpha: a, a: items.length === 1 ? node(items[0]) : row(...items) });

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
  if (s in OPS) return op(s);
  if (/^[−-]?[0-9][0-9.,]*[°%]?$/.test(s) || s === '°') return n(s);
  if (s in GREEK) return v(s);
  if (UNITS.has(s)) return unit(s);
  if (/^[A-Za-z]$/.test(s)) return v(s);
  if (/^[A-Z]+$/.test(s)) return pt(s);
  if (/^△[A-Z]+$/.test(s)) return tex(`\\triangle ${s.slice(1)}`);
  if (/^[()[\]]$/.test(s)) return up(s);
  if (/[　-鿿＀-￯]/.test(s)) return jp(s);
  return up(s);
}

// ——— to TeX ——————————————————————————————————————————————————————————

const escape = (s) => s.replace(/[\\{}$&#^_%~]/g, (c) => (c === '\\' ? '\\backslash ' : `\\${c}`));

function number(s) {
  return s
    .replace(/^[−-]/, '-')
    .replace(/,/g, '{,}')
    .replace(/%$/, '\\%')
    .replace(/°$/, '^{\\circ}')
    .replace(/^\^/, '{}^');
}

const kindOf = (nd) => {
  if (nd.t === 'text') return nd.kind;
  if (nd.t === 'row') return nd.items.length === 1 ? kindOf(nd.items[0]) : 'row';
  if (nd.t === 'tag' || nd.t === 'shade') return kindOf(nd.a);
  if (nd.t === 'sup') return kindOf(nd.a);
  return nd.t;
};
// TeX spaces operators and function names itself; Japanese and units need a thin space added
const spaced = (a, b) => {
  const ka = kindOf(a);
  const kb = kindOf(b);
  if (ka === 'op' || kb === 'op') return false;
  if (ka === 'jp' && kb === 'jp') return false;
  if (ka === 'jp' || kb === 'jp') return true;
  return ka === 'num' && kb === 'unit';
};

// c: { n, styles, weight } — the styles of the pieces (colour, alpha, weight) go to drawTex()
// by id, so that the TeX, and with it the layout, is the same whatever their values. own: the id
// the caller is about to put round this node. MathJax puts an id on the node itself when the
// node is one piece, so an id inside it would be overwritten: a node's style joins own instead.
// An id round a piece. A piece that already has an id of its own is first made a group, so that
// both ids stay (an id round a single node replaces the node's own).
const withId = (id, body) => `\\el{${id}}{${body.startsWith('\\el{') ? `{${body}}` : body}}`;

function texOf(nd, c, own) {
  const style = (st, body) => {
    if (own) {
      c.styles[own] = { ...c.styles[own], ...st };
      return body;
    }
    const id = `_${c.n++}`;
    c.styles[id] = st;
    return withId(id, body);
  };
  let body;
  if (nd.t === 'text') {
    const { s, kind } = nd;
    if (kind === 'fn') body = `\\${s}`;
    else if (kind === 'var') body = GREEK[s] ?? s;
    else if (kind === 'num') body = number(s);
    else if (kind === 'op') body = OPS[s] ?? escape(s);
    else if (kind === 'pt') body = s;
    else if (kind === 'unit') body = `\\mathrm{${escape(s)}}`;
    else if (kind === 'jp') return style({ color: nd.color, weight: nd.weight ?? c.weight }, `\\text{${escape(s)}}`);
    else if (/^[()[\]]$/.test(s)) body = s === '[' || s === ']' ? `\\${s === '[' ? 'lbrack' : 'rbrack'}` : s;
    else body = (nd.weight ?? 400) >= 600 ? `\\mathbf{${escape(s)}}` : `\\mathrm{${escape(s)}}`;
  } else if (nd.t === 'tex') body = nd.s;
  else if (nd.t === 'row') body = nd.items.map((it, i) => (i > 0 && spaced(nd.items[i - 1], it) ? '\\,' : '') + texOf(it, c)).join(' ');
  else if (nd.t === 'frac') {
    // a fraction inside a fraction keeps the size of the outer one (TeX would set it smaller,
    // too small to read on the stage)
    const cmd = c.inFrac ? '\\dfrac' : '\\frac';
    c.inFrac = (c.inFrac ?? 0) + 1;
    body = `${cmd}{${texOf(nd.num, c)}}{${texOf(nd.den, c)}}`;
    c.inFrac -= 1;
  } else if (nd.t === 'sqrt') body = `\\sqrt{${texOf(nd.a, c)}}`;
  else if (nd.t === 'sup') body = kindOf(nd.a) === 'fn' && nd.a.t === 'text' ? `${texOf(nd.a, c)}^{${texOf(nd.s, c)}}` : `{${texOf(nd.a, c)}}^{${texOf(nd.s, c)}}`;
  else if (nd.t === 'tag') return withId(nd.name, texOf(nd.a, c, nd.name));
  else if (nd.t === 'shade') {
    const id = `_${c.n++}`;
    c.styles[id] = { alpha: nd.alpha };
    return withId(id, texOf(nd.a, c, id));
  } else throw new Error(`unknown math node ${nd.t}`);
  return nd.color ? style({ color: nd.color }, body) : body;
}

// The TeX of a formula (for a look at what a node becomes).
export const toTeX = (nd) => texOf(node(nd), { n: 0, styles: {}, weight: 500 });

// Measure without drawing: { w, asc, desc }.
export function box(nd, size = 44) {
  return texBox(toTeX(nd), size);
}

// Draw a formula. o: { size, color, alpha, align: 'left' | 'center' | 'right', weight (of its
// Japanese, 500 by default), parts (by piece name: { alpha, color, dx, dy, scale }) }. Returns
// its box (w, asc, desc), x (the left end), rect ({ x, y, w, h } on the stage) and parts (the
// rects of the named pieces, each with base and size) — also when alpha is 0, so a clip can lay
// out around what is not shown yet.
export function math(ctx, nd, x, y, o = {}) {
  const c = { n: 0, styles: {}, weight: o.weight ?? 500 };
  const src = texOf(node(nd), c);
  return drawTex(ctx, src, x, y, {
    size: o.size ?? 44,
    color: o.color ?? C.ink,
    alpha: o.alpha,
    align: o.align,
    // a piece's style from the formula and its motion from the clip, both by name
    parts: Object.fromEntries([...new Set([...Object.keys(c.styles), ...Object.keys(o.parts ?? {})])].map((k) => [k, { ...c.styles[k], ...o.parts?.[k] }])),
    font: (w, px) => F.jp(w, px),
  });
}

// How a formula reads as plain text: 7.8/10, sin θ.
function plain(nd) {
  if (nd.t === 'text') return nd.s;
  if (nd.t === 'tex') return nd.s;
  if (nd.t === 'row') return nd.items.map(plain).join(' ');
  if (nd.t === 'frac') return `${plain(nd.num)}/${plain(nd.den)}`;
  if (nd.t === 'sqrt') return `√${plain(nd.a)}`;
  if (nd.t === 'sup') return `${plain(nd.a)}^${plain(nd.s)}`;
  return plain(nd.a);
}

// A choice of a question (spec §5.4) set as a formula: { html, text }. The engine puts the
// markup in the choice's button, where it takes the button's font size and colour; text is how
// it reads (the button's aria-label, the script book). o: { text, weight (of its Japanese) }.
export function choice(nd, o = {}) {
  const c = { n: 0, styles: {}, weight: o.weight ?? 500 };
  const n0 = node(nd);
  return { html: texSVG(texOf(n0, c), { parts: c.styles, weight: c.weight }), text: o.text ?? plain(n0) };
}
