// The LLM Wiki folder that chapter 8 puts in the tool's place (README「ツールの図」): raw
// sources on top (never rewritten), the wiki's pages and their links in the middle (written by
// the LLM), and the schema, index and log files at the bottom. The example topic is this deck's
// own sources and concepts. Every function draws one frame and keeps no state.

import { clamp, lerp } from '../../../src/kit/ease.js';
import { text, rr, circle, line, measure } from '../../../src/kit/draw.js';
import { C, F } from './theme.js';
import { BASE } from './rig.js';

// the rig with the tool's place widened for the folder (as in 7-7)
export const WIDE = {
  llm: BASE.llm,
  app: { x: 386, y: 100, w: 560, h: 712 },
  tool: { x: 1046, y: 120, w: 458, h: 620 },
};

export const RAW = ['Shannon 1948', 'Vaswani 2017', 'Brown 2020', 'Lewis 2020'];

// pages: [name, u, v] in the graph area; the last ones are added by ingest, query and lint
export const PAGES = [
  ['年表', 0.1, 0.12],
  ['幻覚', 0.37, 0.08],
  ['RAG', 0.63, 0.15],
  ['検索', 0.89, 0.1],
  ['事前学習', 0.13, 0.5],
  ['Transformer', 0.41, 0.44],
  ['コンテクスト', 0.68, 0.52],
  ['RAG と窓', 0.9, 0.42],
  ['トークン', 0.12, 0.86],
  ['アテンション', 0.4, 0.9],
  ['埋め込み', 0.66, 0.86],
  ['ELIZA', 0.9, 0.8],
];
export const P = Object.fromEntries(PAGES.map(([n], i) => [n, i]));

// links between pages: the first ones exist from the start
export const LINKS = [
  ['年表', 'Transformer'], ['年表', '幻覚'], ['幻覚', '検索'], ['検索', 'コンテクスト'],
  ['Transformer', '事前学習'], ['Transformer', 'アテンション'], ['Transformer', 'コンテクスト'],
  ['事前学習', 'トークン'], ['トークン', 'アテンション'],
  // added by ingesting Lewis 2020
  ['RAG', '検索'], ['RAG', '幻覚'], ['RAG', '年表'], ['RAG', 'コンテクスト'],
  // added when a good answer is filed back
  ['RAG と窓', 'RAG'], ['RAG と窓', 'コンテクスト'],
  // added by lint
  ['ELIZA', '年表'], ['埋め込み', '検索'], ['埋め込み', 'アテンション'],
].map(([a, b]) => [P[a], P[b]]);
export const BASE_LINKS = 9;

export const FILES = [
  ['CLAUDE.md', '決まり'],
  ['index.md', '目録'],
  ['log.md', '記録'],
];

// Areas of the folder inside the tool box b.
export function folderAreas(b) {
  return {
    raw: { x: b.x + 18, y: b.y + 92, w: b.w - 36, h: 64 },
    graph: { x: b.x + 30, y: b.y + 232, w: b.w - 60, h: 250 },
    files: { x: b.x + 18, y: b.y + b.h - 70, w: b.w - 36, h: 50 },
  };
}

// Where page i sits.
export function pageAt(b, i) {
  const g = folderAreas(b).graph;
  const [, u, v] = PAGES[i];
  return { x: g.x + u * g.w, y: g.y + v * g.h };
}

// Where raw source i and file i sit (their boxes).
export function rawAt(b, i) {
  const r = folderAreas(b).raw;
  const w = (r.w - 3 * 10) / 4;
  return { x: r.x + i * (w + 10), y: r.y, w, h: r.h };
}
export function fileAt(b, i) {
  const f = folderAreas(b).files;
  const w = (f.w - 2 * 10) / 3;
  return { x: f.x + i * (w + 10), y: f.y, w, h: f.h };
}

// The folder. s: {
//   raw: alpha per source (default 1 for the first three, 0 for Lewis 2020), rawLit: index,
//   page: alpha per page (default: the base set), pageLit: 0–1 per page (being written),
//   pageRead: 0–1 per page (being read), link: alpha per link (default: the base set),
//   flags: [{ page, kind: 'orphan' | 'conflict' | 'missing', a }],
//   file: 0–1 highlight per file, logAdd: 0–1 (a line being appended to log.md)
// }
export function wikiFolder(ctx, b, a, s = {}) {
  if (a <= 0.001) return;
  const A = folderAreas(b);
  text(ctx, 'wiki のフォルダ', b.x + 20, b.y + 40, { font: F.jp(700, 24), color: C.ink, alpha: a });

  // ——— raw sources
  text(ctx, 'raw/', A.raw.x, A.raw.y - 14, { font: F.mono(600, 17), color: C.ink, alpha: a });
  text(ctx, '元の資料。書き換えない', A.raw.x + 56, A.raw.y - 14, { font: F.jp(400, 15), color: C.muted, alpha: a });
  RAW.forEach((name, i) => {
    const ra = a * (s.raw?.[i] ?? (i < 3 ? 1 : 0));
    if (ra <= 0.001) return;
    const r = rawAt(b, i);
    const lit = s.rawLit === i ? 1 : 0;
    ctx.save();
    ctx.globalAlpha = ra;
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fillStyle = C.paper;
    ctx.fill();
    ctx.strokeStyle = lit ? C.accent : C.rule;
    ctx.lineWidth = lit ? 3 : 1.5;
    ctx.stroke();
    // a few lines of text, like a page
    ctx.fillStyle = C.rule;
    for (let k = 0; k < 3; k++) ctx.fillRect(r.x + 10, r.y + 36 + k * 8, r.w - 20 - (k === 2 ? 24 : 0), 3);
    ctx.restore();
    text(ctx, name, r.x + 10, r.y + 22, { font: F.sans(600, 14), color: C.ink2, alpha: ra });
  });

  // ——— the wiki: pages and links
  text(ctx, 'wiki/', A.raw.x, A.graph.y - 34, { font: F.mono(600, 17), color: C.ink, alpha: a });
  text(ctx, 'LLM が書いて、保つ', A.raw.x + 60, A.graph.y - 34, { font: F.jp(400, 15), color: C.muted, alpha: a });
  LINKS.forEach(([i, j], k) => {
    const la = a * (s.link?.[k] ?? (k < BASE_LINKS ? 1 : 0));
    if (la <= 0.001) return;
    const p = pageAt(b, i);
    const q = pageAt(b, j);
    ctx.save();
    ctx.globalAlpha = la;
    ctx.strokeStyle = k >= BASE_LINKS && la < 1 ? C.accent : C.ink2;
    ctx.lineWidth = 1.5;
    line(ctx, p.x, p.y, q.x, q.y, clamp(la * 1.2));
    ctx.restore();
  });
  PAGES.forEach(([name], i) => {
    const pa = a * (s.page?.[i] ?? (BASE_PAGE.has(i) ? 1 : 0));
    if (pa <= 0.001) return;
    const p = pageAt(b, i);
    const lit = s.pageLit?.[i] ?? 0;
    const read = s.pageRead?.[i] ?? 0;
    ctx.save();
    ctx.globalAlpha = pa;
    ctx.fillStyle = lit > 0.5 ? C.accent : read > 0.5 ? C.green : C.ink;
    circle(ctx, p.x, p.y, 7 + Math.max(lit, read) * 3);
    ctx.fill();
    if (Math.max(lit, read) > 0) {
      ctx.strokeStyle = lit > read ? C.accent : C.green;
      ctx.globalAlpha = pa * Math.max(lit, read);
      ctx.lineWidth = 2.5;
      circle(ctx, p.x, p.y, 16);
      ctx.stroke();
    }
    ctx.restore();
    text(ctx, name, p.x, p.y + 30, { font: F.jp(500, 15), color: lit > 0.5 ? C.accent : read > 0.5 ? C.green : C.ink2, align: 'center', alpha: pa });
  });
  (s.flags ?? []).forEach(({ page, kind, a: fa }) => {
    if (fa <= 0.001) return;
    const p = pageAt(b, page);
    const label = kind === 'orphan' ? 'つながりなし' : kind === 'conflict' ? '食い違い' : '頁がない';
    ctx.save();
    ctx.globalAlpha = a * fa;
    ctx.strokeStyle = C.red;
    ctx.setLineDash(kind === 'missing' ? [4, 4] : []);
    ctx.lineWidth = 2.5;
    circle(ctx, p.x, p.y, 20);
    ctx.stroke();
    ctx.restore();
    const w = measure(ctx, F.jp(700, 14), label) + 14;
    ctx.save();
    ctx.globalAlpha = a * fa;
    rr(ctx, p.x - w / 2, p.y - 46, w, 22, 11);
    ctx.fillStyle = C.red;
    ctx.fill();
    ctx.restore();
    text(ctx, label, p.x, p.y - 30, { font: F.jp(700, 14), color: '#fff', align: 'center', alpha: a * fa });
  });

  // ——— schema, index, log
  FILES.forEach(([name, what], i) => {
    const f = fileAt(b, i);
    const lit = s.file?.[i] ?? 0;
    ctx.save();
    ctx.globalAlpha = a;
    rr(ctx, f.x, f.y, f.w, f.h, 10);
    ctx.fillStyle = lit > 0 ? lerpHex(lit) : '#fff';
    ctx.fill();
    ctx.strokeStyle = lit > 0.5 ? C.accent : C.ink2;
    ctx.lineWidth = lit > 0.5 ? 3 : 1.5;
    ctx.stroke();
    ctx.restore();
    text(ctx, name, f.x + 12, f.y + 22, { font: F.mono(600, 15), color: C.ink, alpha: a });
    text(ctx, what, f.x + 12, f.y + 41, { font: F.jp(400, 14), color: C.muted, alpha: a });
  });
  if ((s.logAdd ?? 0) > 0) {
    const f = fileAt(b, 2);
    text(ctx, '+1 行', f.x + f.w - 10, f.y + 22, { font: F.jp(700, 14), color: C.accent, align: 'right', alpha: a * s.logAdd });
  }
}

const BASE_PAGE = new Set([P['年表'], P['幻覚'], P['検索'], P['事前学習'], P['Transformer'], P['コンテクスト'], P['トークン'], P['アテンション'], P['ELIZA']]);

// paper → soft vermilion as a file is used
function lerpHex(p) {
  return p > 0.5 ? C.accentSoft : '#fff4ee';
}
