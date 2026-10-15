// The tool-use diagram that chapters 5–7 are drawn on (README「ツールの図」): the LLM on the
// left, the app holding the document in the middle, the tool on the right, and four channels
// between them. Chapter 4 runs the flow on it with an abstract tool; later clips put concrete
// things into the tool's place. Every function draws one frame and keeps no state.

import { clamp, lerp, inOutCubic } from '../../../src/kit/ease.js';
import { text, rr, wrap, measure, arrow, circle, line } from '../../../src/kit/draw.js';
import { C, F } from './theme.js';
import { hash } from '../../../src/kit/random.js';

// ——— geometry ————————————————————————————————————————————————————

export const BASE = {
  llm: { x: 96, y: 372, w: 170, h: 170 },
  app: { x: 386, y: 100, w: 700, h: 712 },
  tool: { x: 1206, y: 337, w: 298, h: 240 },
};

// The boxes plus what follows from them: the document inside the app, and the four channels
// (read: app → LLM, write: LLM → app, call: app → tool, back: tool → app).
export function layout(g = BASE) {
  const { llm, app, tool } = g;
  const up = llm.y + llm.h / 2 - 27;
  const down = up + 54;
  const tUp = tool.y + tool.h / 2 - 27;
  return {
    llm,
    app,
    tool,
    doc: { x: app.x + 22, y: app.y + 60, w: app.w - 44, h: app.h - 82 },
    read: { x1: app.x - 12, x2: llm.x + llm.w + 12, y: up, label: '読ませる', side: -1 },
    write: { x1: llm.x + llm.w + 12, x2: app.x - 12, y: down, label: '続きを書く', side: 1 },
    call: { x1: app.x + app.w + 12, x2: tool.x - 12, y: tUp, label: '入力', side: -1 },
    back: { x1: tool.x - 12, x2: app.x + app.w + 12, y: tUp + 54, label: '結果', side: 1 },
  };
}

const mixBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

// Layout between two geometries, for clips where the tool's place grows.
export function mix(a, b, p) {
  return layout({ llm: mixBox(a.llm, b.llm, p), app: mixBox(a.app, b.app, p), tool: mixBox(a.tool, b.tool, p) });
}

// A point fraction p along a channel.
export const along = (c, p) => ({ x: lerp(c.x1, c.x2, p), y: c.y });

// ——— the three parts ——————————————————————————————————————————————

// The model. o: { glow (0–1, it is reading or writing), note (caption below), noteAlpha }
export function llmBlock(ctx, L, a = 1, o = {}) {
  if (a <= 0.001) return;
  const b = L.llm;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, b.x, b.y, b.w, b.h, 22);
  ctx.fillStyle = C.ink;
  ctx.fill();
  if (o.glow > 0) {
    ctx.globalAlpha *= clamp(o.glow);
    rr(ctx, b.x - 7, b.y - 7, b.w + 14, b.h + 14, 28);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, 'LLM', b.x + b.w / 2, b.y + b.h / 2 + 3, { font: F.sans(700, 46), color: C.paper, align: 'center', base: 'middle', alpha: a });
  if (o.note) {
    text(ctx, o.note, b.x + b.w / 2, b.y + b.h + 44, { font: F.jp(700, 20), color: C.ink, align: 'center', alpha: a * (o.noteAlpha ?? 1) });
  }
}

// The app: a panel with its name, holding the document. o: { name, note, noteAlpha, docAlpha }
export function appFrame(ctx, L, a = 1, o = {}) {
  if (a <= 0.001) return;
  const b = L.app;
  const d = L.doc;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, b.x, b.y, b.w, b.h, 22);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.globalAlpha *= o.docAlpha ?? 1;
  rr(ctx, d.x, d.y, d.w, d.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  const w = text(ctx, o.name ?? 'アプリ', b.x + 24, b.y + 40, { font: F.jp(700, 24), color: C.ink, alpha: a });
  if (o.note) {
    text(ctx, o.note, b.x + 24 + w + 16, b.y + 39, { font: F.jp(500, 18), color: C.ink2, alpha: a * (o.noteAlpha ?? 1) });
  }
}

// The tool's place. Abstract by default: a dashed slot named ツール. o: { name, note, glow,
// solid (0 dashed → 1 solid), fill, draw(ctx, box, a) for concrete contents, label (small
// name above the box), caption (below) }
export function toolBox(ctx, L, a = 1, o = {}) {
  if (a <= 0.001) return;
  const b = L.tool;
  const solid = o.solid ?? 0;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, b.x, b.y, b.w, b.h, 20);
  ctx.fillStyle = o.fill ?? '#fff';
  ctx.globalAlpha *= lerp(0.55, 1, solid);
  ctx.fill();
  ctx.globalAlpha /= lerp(0.55, 1, solid);
  ctx.setLineDash(solid >= 1 ? [] : [12, 9]);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.setLineDash([]);
  if (o.glow > 0) {
    ctx.globalAlpha *= clamp(o.glow);
    rr(ctx, b.x - 7, b.y - 7, b.w + 14, b.h + 14, 26);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
  if (o.draw) o.draw(ctx, b, a);
  else abstractTool(ctx, b, a, o.name, o.note);
  if (o.label) text(ctx, o.label, b.x, b.y - 16, { font: F.jp(700, 18), color: C.muted, alpha: a * (o.labelAlpha ?? 1) });
  if (o.caption) {
    text(ctx, o.caption, b.x + b.w / 2, b.y + b.h + 44, { font: F.jp(700, 20), color: C.ink, align: 'center', alpha: a * (o.captionAlpha ?? 1) });
  }
}

// The abstract tool's contents: its name and what it does. Clips that put something concrete in
// the tool's place fade this out as the concrete contents come in.
export function abstractTool(ctx, b, a, name = 'ツール', note = '入力 → 結果') {
  if (a <= 0.001) return;
  text(ctx, name, b.x + b.w / 2, b.y + b.h / 2 - 8, { font: F.jp(700, 34), color: C.ink, align: 'center', base: 'middle', alpha: a });
  text(ctx, note, b.x + b.w / 2, b.y + b.h / 2 + 40, { font: F.jp(500, 19), color: C.ink2, align: 'center', base: 'middle', alpha: a });
}

// The search tool's contents: document chunks as dots on a map of meaning, the query as one
// more dot, and lines to its nearest chunks. o: { a (alpha of the whole), dots (alpha of the
// dots), q ([u, v] in 0–1 of the map, or null), qa, look (0–1), k (how many nearest), note }
const DOTS = Array.from({ length: 38 }, (_, i) => [0.04 + hash(i * 3 + 11) * 0.92, 0.06 + hash(i * 3 + 12) * 0.88]);

export function searchMap(ctx, b, o = {}) {
  const a = o.a ?? 1;
  if (a <= 0.001) return;
  const m = { x: b.x + 18, y: b.y + 62, w: b.w - 36, h: b.h - 80 };
  const P = (u, v) => [m.x + u * m.w, m.y + v * m.h];
  text(ctx, '検索', b.x + 20, b.y + 40, { font: F.jp(700, 26), color: C.ink, alpha: a });
  text(ctx, o.note ?? '社内の資料 1,200 件', b.x + b.w - 20, b.y + 39, { font: F.jp(500, 16), color: C.ink2, align: 'right', alpha: a });
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, m.x, m.y, m.w, m.h, 10);
  ctx.fillStyle = C.paper;
  ctx.fill();
  ctx.restore();
  const q = o.q ? P(o.q[0], o.q[1]) : null;
  const near = q
    ? DOTS.map((d, i) => [Math.hypot(P(...d)[0] - q[0], P(...d)[1] - q[1]), i]).sort((x, y) => x[0] - y[0]).slice(0, o.k ?? 3).map(([, i]) => i)
    : [];
  const look = o.look ?? 0;
  DOTS.forEach((d, i) => {
    const [x, y] = P(...d);
    const hot = near.includes(i) && look > 0;
    ctx.save();
    ctx.globalAlpha = a * (o.dots ?? 1) * (hot ? 1 : 0.55);
    ctx.fillStyle = hot ? C.green : C.ink2;
    circle(ctx, x, y, hot ? 5.5 : 4);
    ctx.fill();
    if (hot) {
      ctx.globalAlpha = a * look;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      line(ctx, q[0], q[1], x, y, look);
      circle(ctx, x, y, 11);
      ctx.stroke();
    }
    ctx.restore();
  });
  const qa = o.qa ?? 0;
  if (q && qa > 0) {
    ctx.save();
    ctx.globalAlpha = a * Math.min(1, qa);
    ctx.fillStyle = C.accent;
    circle(ctx, q[0], q[1], 8 * Math.min(1.2, qa));
    ctx.fill();
    ctx.restore();
    text(ctx, o.qLabel ?? '質問', q[0] + 14, q[1] - 12, { font: F.jp(700, 16), color: C.accent, alpha: a * Math.min(1, qa) });
  }
}

// Contents for toolBox's draw: the slot's name over a list of tool names, one of which may be
// lit (on: 0–1) and the rest dimmed by the same amount.
export function toolList(names, lit = -1, on = 0, title = 'ツール') {
  return (ctx, b, a) => {
    text(ctx, title, b.x + b.w / 2, b.y + 50, { font: F.jp(700, 26), color: C.ink, align: 'center', alpha: a });
    names.forEach((name, i) => {
      const y = b.y + 98 + i * 44;
      if (i === lit && on > 0) {
        ctx.save();
        ctx.globalAlpha = a * on;
        rr(ctx, b.x + 30, y - 25, b.w - 60, 36, 8);
        ctx.fillStyle = C.accentSoft;
        ctx.fill();
        ctx.restore();
      }
      text(ctx, name, b.x + b.w / 2, y, { font: F.mono(500, 19), color: C.ink, align: 'center', alpha: a * (lit < 0 || i === lit ? 1 : lerp(1, 0.45, on)) });
    });
  };
}

// One channel's arrow, drawn up to p, with its label above (side −1) or below (side 1).
// o: { color, label (false hides it), labelAlpha, hot }
export function channel(ctx, c, p = 1, o = {}) {
  if (p <= 0) return;
  ctx.save();
  ctx.strokeStyle = o.hot ? C.accent : (o.color ?? C.ink2);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = o.hot ? 3.5 : 2.5;
  arrow(ctx, c.x1, c.y, c.x2, c.y, p, 12);
  ctx.restore();
  if (o.label === false) return;
  text(ctx, o.label ?? c.label, (c.x1 + c.x2) / 2, c.y + (c.side < 0 ? -26 : 42), {
    font: F.jp(500, 17), color: o.hot ? C.accent : C.muted, align: 'center', alpha: (o.labelAlpha ?? 1) * clamp(p * 2 - 1),
  });
}

// ——— the document ————————————————————————————————————————————————

// Role marks. The model reads them as part of the text; their spelling here is generic.
export const ROLE = {
  system: { name: 'システム', fill: C.panel, color: C.ink2 },
  user: { name: 'ユーザー', fill: C.blueSoft, color: C.blue },
  assistant: { name: 'アシスタント', fill: C.ink, color: C.paper },
  result: { name: 'ツールの結果', fill: C.green, color: '#fff' },
  search: { name: '検索結果', fill: C.green, color: '#fff' },
};

const TAG = { font: F.jp(700, 15), h: 28, padX: 9 };

// Who writes a mark into the document, as the colour of its outer edge (4-2): the app's
// marks carry the colour of its box, the ones the model writes the ink of the LLM's.
export const BY = { app: C.purple, llm: C.ink };

// The width of a mark named `name`.
export const markWidth = (ctx, name) => measure(ctx, TAG.font, name) + TAG.padX * 2;
export const MARK_H = TAG.h;

// One mark with its top-left at (x, y). r: a ROLE entry, or any { name, fill, color }.
// o: { alpha, edge (the writer's colour; no edge when absent) }. Returns its width.
export function roleMark(ctx, x, y, r, o = {}) {
  const w = markWidth(ctx, r.name);
  const a = o.alpha ?? 1;
  if (a <= 0.001) return w;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  if (o.edge) {
    rr(ctx, x - 4.5, y - 4.5, w + 9, TAG.h + 9, 9);
    ctx.strokeStyle = o.edge;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  rr(ctx, x, y, w, TAG.h, 6);
  ctx.fillStyle = r.fill;
  ctx.fill();
  text(ctx, r.name, x + w / 2, y + TAG.h / 2 + 1, { font: TAG.font, color: r.color, align: 'center', base: 'middle' });
  ctx.restore();
  return w;
}

// Lay out entries once, in prepare: [{ role?, text, kind: 'text' | 'call' | 'data' }] →
// the same entries with x, y, rows and height. kind 'call' is the model's request (drawn on
// vermilion), 'data' is mono text such as a tool's result. o: { top, gap, tagW, font, mono }
export function docLayout(ctx, L, entries, o = {}) {
  const d = L.doc;
  const tagW = o.tagW ?? 122;
  const x = d.x + 18;
  const tx = x + tagW + 12;
  let y = d.y + (o.top ?? 24);
  return entries.map((e) => {
    const kind = e.kind ?? 'text';
    const font = e.font ?? (kind === 'text' ? (o.font ?? F.jp(500, 22)) : (o.mono ?? F.mono(500, 19)));
    const lh = e.lh ?? (kind === 'text' ? (o.lh ?? 34) : (o.lhMono ?? 30));
    const pad = kind === 'text' ? 0 : 9;
    const maxW = d.x + d.w - 18 - tx - pad * 2;
    const rows = wrap(ctx, font, e.text, maxW);
    const h = Math.max(TAG.h, rows.length * lh + pad * 2 - (kind === 'text' ? lh - 28 : 0));
    const out = { ...e, kind, x, tx, y, rows, h, font, lh, pad, w: d.x + d.w - 18 - tx };
    y += h + (e.gap ?? o.gap ?? 16);
    return out;
  });
}

// Where the next entry would start (the document's written bottom), after the first n.
export const docEnd = (E, n = E.length) => (n <= 0 ? null : E[n - 1].y + E[n - 1].h);

// Where row r of a laid-out entry sits: its text's left edge and baseline.
export function rowAt(E, r = 0) {
  if (E.kind === 'text') return { x: E.tx, y: E.y + 21 + r * E.lh };
  return { x: E.tx + E.pad + 8, y: E.y + E.pad + Math.round(E.lh * 0.7) + r * E.lh };
}

// Draw one laid-out entry. o: { chars (0–1, typed in), tagAlpha, edge (the mark's writer, see
// BY), hot (outline the block), dim, color }
export function docEntry(ctx, E, a = 1, o = {}) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a) * (o.dim ? 0.38 : 1);
  if (E.role) roleMark(ctx, E.x, E.y + 1, ROLE[E.role], { alpha: o.tagAlpha ?? 1, edge: o.edge });
  if (E.kind !== 'text') {
    const call = E.kind === 'call';
    rr(ctx, E.tx, E.y, E.w, E.h, 8);
    ctx.fillStyle = call ? C.accentSoft : '#eef6f0';
    ctx.fill();
    ctx.fillStyle = call ? C.accent : C.green;
    ctx.fillRect(E.tx, E.y + 6, 4, E.h - 12);
    if (o.hot) {
      rr(ctx, E.tx - 4, E.y - 4, E.w + 8, E.h + 8, 11);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  // the rows, typed in by o.chars
  const total = E.rows.reduce((n, r) => n + Array.from(r).length, 0);
  let left = Math.round(total * clamp(o.chars ?? 1));
  E.rows.forEach((r, i) => {
    if (left <= 0) return;
    const chars = Array.from(r);
    const at = rowAt(E, i);
    text(ctx, chars.slice(0, left).join(''), at.x, at.y, { font: E.font, color: o.color ?? C.ink });
    left -= chars.length;
  });
  ctx.restore();
}

// The app hands the whole document to the model: a band sweeps down the written part
// (from the top of the paper to `bottom`) as p runs 0 → 1, and fades after.
export function sweep(ctx, L, p, bottom) {
  if (p <= 0 || p >= 1) return;
  const d = L.doc;
  const y = lerp(d.y + 8, bottom + 8, inOutCubic(Math.min(1, p / 0.8)));
  const fade = 1 - clamp((p - 0.8) / 0.2);
  ctx.save();
  ctx.globalAlpha = 0.5 * fade;
  ctx.fillStyle = C.accentSoft;
  ctx.fillRect(d.x + 8, d.y + 8, d.w - 16, y - d.y - 8);
  ctx.globalAlpha = fade;
  ctx.fillStyle = C.accent;
  ctx.fillRect(d.x + 8, y - 2, d.w - 16, 3);
  ctx.restore();
}

// ——— things in flight ————————————————————————————————————————————————

// A chip travelling from (x0, y0) to (x1, y1) as p runs 0 → 1; lift > 0 arcs it upward.
// kind: 'doc' (the whole document), 'call', 'data', 'text'. Draws only in flight (0 < p < 1).
export function packet(ctx, x0, y0, x1, y1, p, label, kind = 'text', lift = 0) {
  if (p <= 0 || p >= 1) return;
  const e = inOutCubic(p);
  const x = lerp(x0, x1, e);
  const y = lerp(y0, y1, e) - Math.sin(Math.PI * e) * lift;
  const a = clamp(p * 6) * clamp((1 - p) * 6);
  ctx.save();
  ctx.globalAlpha *= a;
  if (kind === 'doc') {
    // a small stack of paper
    for (let i = 2; i >= 0; i--) {
      rr(ctx, x - 20 + i * 4, y - 24 + i * 4, 36, 44, 5);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = C.rule;
    for (let r = 0; r < 4; r++) ctx.fillRect(x - 6, y - 6 + r * 7, r === 3 ? 12 : 20, 3);
  } else {
    const font = kind === 'text' ? F.jp(700, 19) : F.mono(600, 17);
    const w = measure(ctx, font, label) + 24;
    rr(ctx, x - w / 2, y - 18, w, 36, 8);
    ctx.fillStyle = kind === 'call' ? C.accent : kind === 'data' ? C.green : C.ink;
    ctx.fill();
    text(ctx, label, x, y + 1, { font, color: '#fff', align: 'center', base: 'middle' });
  }
  ctx.restore();
}

// A chip travelling along a polyline [[x, y], …] as p runs 0 → 1 (even speed, eased overall):
// e.g. from an entry in the document, along a channel, into the tool.
export function flow(ctx, pts, p, label, kind = 'text') {
  if (p <= 0 || p >= 1) return;
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let d = lens.reduce((a, b) => a + b, 0) * inOutCubic(p);
  let i = 0;
  while (i < lens.length - 1 && d > lens[i]) d -= lens[i++];
  const u = lens[i] ? Math.min(1, d / lens[i]) : 0;
  const x = lerp(pts[i][0], pts[i + 1][0], u);
  const y = lerp(pts[i][1], pts[i + 1][1], u);
  // packet() at a fixed point: p = 0.5 keeps it fully visible; fade the ends here
  ctx.save();
  ctx.globalAlpha *= clamp(p * 8) * clamp((1 - p) * 8);
  packet(ctx, x, y, x, y, 0.5, label, kind);
  ctx.restore();
}

// Along a channel: packet(ctx, …) with the channel's ends.
export function send(ctx, c, p, label, kind) {
  packet(ctx, c.x1, c.y, c.x2, c.y, p, label, kind);
}

// A badge above the model when generation stops, naming why as the API reports it
// (Anthropic's stop_reason). hot: vermilion for a tool call, grey for the end of the turn.
export function stopBadge(ctx, L, a, reason, hot = true) {
  if (a <= 0.001) return;
  const b = L.llm;
  const font = F.mono(600, 16);
  const s = `stop_reason: "${reason}"`;
  const w = measure(ctx, font, s) + 26;
  const cx = Math.max(b.x + b.w / 2, 24 + w / 2);
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, cx - w / 2, b.y - 54, w, 34, 17);
  ctx.fillStyle = hot ? C.accent : C.ink2;
  ctx.fill();
  text(ctx, s, cx, b.y - 36, { font, color: '#fff', align: 'center', base: 'middle' });
  ctx.restore();
}

// A tool at work: a ring turning inside its box while p runs.
export function working(ctx, L, p) {
  if (p <= 0 || p >= 1) return;
  const b = L.tool;
  const cx = b.x + b.w - 30;
  const cy = b.y + 30;
  ctx.save();
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.globalAlpha = clamp(p * 8) * clamp((1 - p) * 8);
  const a0 = p * Math.PI * 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, a0, a0 + Math.PI * 1.3);
  ctx.stroke();
  ctx.restore();
}

// Dashed link with a cross in its middle: "these two are not connected".
export function noLink(ctx, x1, y, x2, a, label) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  line(ctx, x1, y, x2, y);
  ctx.setLineDash([]);
  const cx = (x1 + x2) / 2;
  ctx.fillStyle = C.paper;
  circle(ctx, cx, y, 26);
  ctx.fill();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 4;
  line(ctx, cx - 11, y - 11, cx + 11, y + 11);
  line(ctx, cx + 11, y - 11, cx - 11, y + 11);
  ctx.restore();
  if (label) text(ctx, label, cx, y + 64, { font: F.jp(700, 22), color: C.ink2, align: 'center', alpha: a });
}

// ——— code and JSON ———————————————————————————————————————————————————

const JSON_RE = /("(?:[^"\\]|\\.)*")(\s*:)?|([{}[\],:])|([^"{}[\],:]+)/g;

// One line of JSON-ish text with quiet syntax colours: keys grey, values ink, punctuation
// muted. Returns the line's width. o: { font, alpha, key, value, punct }
export function jsonLine(ctx, s, x, y, o = {}) {
  const font = o.font ?? F.mono(500, 18);
  let cx = x;
  for (const m of s.matchAll(JSON_RE)) {
    const [all, str, colon, punct] = m;
    let color = o.value ?? C.ink;
    if (str && colon) color = o.key ?? C.ink2;
    else if (punct) color = o.punct ?? C.muted;
    cx += text(ctx, all, cx, y, { font, color, alpha: o.alpha ?? 1 });
  }
  return cx - x;
}
