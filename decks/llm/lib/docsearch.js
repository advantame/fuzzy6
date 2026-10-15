// The company's documents in the tool's place, and the search over them (chapter 6: 6-1, 6-2).
// One panel, drawn in the tool's place of the chapter's diagram (lib/rig.js toolUseLayout):
//
//   社内の資料（の検索）                         the title; 「の検索」 comes in when the app is given the search
//   [検索の言葉] ● 出張の日当はいくら？           the words the search was run with (the dot: its vector)
//   [検索用のモデル] で作るベクトル（イメージ）    the search model, and what the map is
//   ┌───────────────────────────┐
//   │  passages: paper strips, then dots          │  the map: each passage of the documents, and the
//   │  the query's dot, lines to the nearest       │  query, where the search model puts them
//   └───────────────────────────┘
//   ［4］ … 見つからなかった                       a passage the search missed (6-1's caveat)
//
// The passages sit where their vectors put them from the start, drawn as paper strips; when the
// clip explains how the search works they turn into dots on the map (a wave from left to right).
// The map is a picture of the idea (イメージ), not a measurement: the search model is not the token
// table of chapter 3 (research/connect-facts 6-1.6). Everything is a pure function of its options.
//
// Use, in a clip:
//   const S = searchLayout(box);                                // module level (box: the tool's place)
//   prepare: const lab = searchLabels(S);                        // where the labels go (place.js)
//   draw:    const r = searchPanel(ctx, S, lab, { a, docs, title, query, … });   // r: boxes to ring

import { clamp, lerp } from '../../../src/kit/ease.js';
import { text, rr, circle, line, measure } from '../../../src/kit/draw.js';
import { place, segment, disc, rect } from '../../../src/kit/place.js';
import { C, F } from './theme.js';
import { tag } from './parts.js';

// The passages, at their places on the map (0–1 of its width and height). n: the number the app
// gives a passage it found ([1]–[3]), and the one the search missed ([4]). The query lands at QUERY.
// [4] is the fourth nearest: the search keeps three.
export const QUERY = { u: 0.52, v: 0.5 };
export const PASSAGES = [
  { u: 0.6, v: 0.36, n: 1 },
  { u: 0.43, v: 0.66, n: 2 },
  { u: 0.69, v: 0.7, n: 3 },
  { u: 0.34, v: 0.28, n: 4 },
  { u: 0.08, v: 0.16 }, { u: 0.24, v: 0.1 }, { u: 0.48, v: 0.08 }, { u: 0.68, v: 0.1 }, { u: 0.82, v: 0.2 }, { u: 0.94, v: 0.12 },
  { u: 0.09, v: 0.52 }, { u: 0.24, v: 0.58 }, { u: 0.91, v: 0.5 },
  { u: 0.16, v: 0.86 }, { u: 0.37, v: 0.9 }, { u: 0.6, v: 0.92 }, { u: 0.85, v: 0.82 },
];
export const FOUND = [1, 2, 3];
export const MISSED = 4;

const STRIP = { w: 30, h: 22 };
const DOT = 4;
const HOT = 5.5;
const QDOT = 7;
const LABEL = F.jp(700, 13);
const TAG = { font: F.jp(700, 13), h: 26, padX: 9 };
const HEAD = { font: F.jp(700, 13), h: 24, padX: 9 };

// Where things go in the tool's place b.
export function searchLayout(b) {
  const map = { x: b.x + 18, y: b.y + 120, w: b.w - 36, h: 180 };
  const at = (p) => ({ x: map.x + p.u * map.w, y: map.y + p.v * map.h });
  return {
    b,
    map,
    at,
    q: at(QUERY),
    pos: PASSAGES.map(at),
    title: { x: b.x + 20, y: b.y + 38 },
    query: { x: b.x + 20, y: b.y + 50 },
    head: { x: map.x, y: b.y + 86 },
    miss: { x: map.x, y: b.y + 306, w: map.w, h: 56 },
  };
}

const indexOf = (n) => PASSAGES.findIndex((p) => p.n === n);

// Where each number's label goes, beside its dot, clear of the lines to the query, the other dots
// and strips, and the query's dot: { [n]: { x, y } (the label's centre) }, and the query's label.
export function searchLabels(ctx, S) {
  const shapes = [
    ...FOUND.map((n) => segment(S.q, S.pos[indexOf(n)], 2)),
    disc(S.q, QDOT + 2),
    ...S.pos.map((p) => rect(p.x - STRIP.w / 2, p.y - STRIP.h / 2, STRIP.w, STRIP.h)),
  ];
  const out = {};
  [...FOUND, MISSED].forEach((n) => {
    const p = S.pos[indexOf(n)];
    const w = measure(ctx, LABEL, `［${n}］`);
    out[n] = place(p, { x: 1, y: 0 }, { w, h: 14 }, shapes.filter((s) => !(s.kind === 'rect' && s.x === p.x - STRIP.w / 2 && s.y === p.y - STRIP.h / 2)), { gap: 3, from: STRIP.w / 2 + w / 2 + 2 });
  });
  const qw = measure(ctx, LABEL, '質問');
  out.q = place(S.q, { x: -1, y: 0 }, { w: qw, h: 14 }, shapes.slice(FOUND.length + 1), { gap: 3, from: QDOT + qw / 2 + 4 });
  return out;
}

// The panel. o (all 0–1 unless said):
//   a        the whole panel
//   docs     (i) => how far passage i has come in
//   title    「の検索」 added to the title
//   kinds    a muted line on what the documents are (kindsText), in the search's row until it comes in
//   query    { s (the words), a, chars, dot (its vector's colour) }
//   found    [f1, f2, f3]: the passages the search found, lit in turn (green, with their numbers)
//   model    the search model's chip; caption: what the map is
//   vec      the wave that turns strips into dots, and lays the map's ground
//   near     [n1, n2, n3]: the lines from the query to the nearest three
//   miss     the passage the search missed: its ring, its number, and its note under the map
//   missText ['［4］…', '…'] the two lines of that note
// Returns boxes to ring: { title, query, map, model, dot: { [n]: box }, miss }.
export function searchPanel(ctx, S, lab, o = {}) {
  const a = o.a ?? 1;
  const out = { dot: {} };
  if (a <= 0.001) return out;
  const { b, map } = S;
  ctx.save();
  ctx.globalAlpha *= clamp(a);

  // the title
  const tw = text(ctx, '社内の資料', S.title.x, S.title.y, { font: F.jp(700, 21), color: C.ink });
  const tw2 = text(ctx, 'の検索', S.title.x + tw, S.title.y, { font: F.jp(700, 21), color: C.ink, alpha: o.title ?? 0 });
  out.title = { x: S.title.x, y: S.title.y - 20, w: tw + tw2 * (o.title ?? 0), h: 26 };

  // what the documents are, until the search's row takes the place
  const kinds = o.kinds ?? 0;
  if (kinds > 0.001) text(ctx, o.kindsText ?? '', S.query.x, S.query.y + TAG.h / 2 + 6, { font: F.jp(500, 15), color: C.muted, alpha: kinds });

  // the words the search runs with
  const q = o.query ?? {};
  if ((q.a ?? 0) > 0.001) {
    const qa = q.a;
    const w = tag(ctx, S.query.x, S.query.y, '検索キーワード', { font: TAG.font, h: TAG.h, padX: TAG.padX, fill: '#fff', stroke: C.purple, color: C.purple, alpha: qa });
    const dx = S.query.x + w + 10;
    const cy = S.query.y + TAG.h / 2;
    const dot = q.dot ?? 0;
    if (dot > 0.001) {
      ctx.save();
      ctx.globalAlpha *= qa * dot;
      ctx.fillStyle = C.accent;
      circle(ctx, dx + 6, cy, 6);
      ctx.fill();
      ctx.restore();
    }
    const tx = dx + 18;
    const chars = Array.from(q.s ?? '');
    const s = chars.slice(0, Math.round(chars.length * clamp(q.chars ?? 1))).join('');
    text(ctx, s, tx, cy + 6, { font: F.jp(500, 17), color: C.ink, alpha: qa });
    out.query = { x: S.query.x, y: S.query.y, w: tx + measure(ctx, F.jp(500, 17), q.s ?? '') - S.query.x, h: TAG.h };
  }

  // the search model, and what the map shows
  const model = o.model ?? 0;
  if (model > 0.001) {
    const w = tag(ctx, S.head.x, S.head.y, '検索用のモデル', { font: HEAD.font, h: HEAD.h, padX: HEAD.padX, fill: C.ink2, color: '#fff', r: 6, alpha: model });
    const cw = text(ctx, 'で作るベクトル（イメージ）', S.head.x + w + 6, S.head.y + HEAD.h / 2 + 5, { font: F.jp(500, 13), color: C.muted, alpha: o.caption ?? 0 });
    out.model = { x: S.head.x, y: S.head.y, w, h: HEAD.h };
    out.head = { x: S.head.x, y: S.head.y, w: w + 6 + cw, h: HEAD.h };
  }

  // the map's ground, laid by the wave
  const vec = o.vec ?? 0;
  if (vec > 0.001) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.x - 2, map.y - 2, (map.w + 4) * clamp(vec * 1.15), map.h + 4);
    ctx.clip();
    rr(ctx, map.x, map.y, map.w, map.h, 10);
    ctx.fillStyle = C.paper;
    ctx.fill();
    ctx.restore();
  }
  out.map = { x: map.x, y: map.y, w: map.w, h: map.h };

  // the lines from the query to the nearest three (under the dots)
  const near = o.near ?? [];
  FOUND.forEach((n, k) => {
    const p = near[k] ?? 0;
    if (p <= 0.001) return;
    const d = S.pos[indexOf(n)];
    ctx.save();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    line(ctx, S.q.x, S.q.y, d.x, d.y, p);
    ctx.restore();
  });

  // the passages: strips, turning into dots as the wave passes
  const found = o.found ?? [];
  const miss = o.miss ?? 0;
  PASSAGES.forEach((p, i) => {
    const show = o.docs ? o.docs(i) : 1;
    if (show <= 0.001) return;
    const at = S.pos[i];
    const m = clamp((vec * 1.2 - p.u) / 0.2);
    const k = p.n && p.n <= 3 ? found[p.n - 1] ?? 0 : 0;
    const w = lerp(STRIP.w, (k > 0.5 ? HOT : DOT) * 2, m);
    const h = lerp(STRIP.h, (k > 0.5 ? HOT : DOT) * 2, m);
    const dy = (1 - show) * 8;
    ctx.save();
    ctx.globalAlpha *= show;
    rr(ctx, at.x - w / 2, at.y - h / 2 + dy, w, h, lerp(3, h / 2, m));
    ctx.fillStyle = k > 0.001 ? mixColor('#ffffff', C.greenSoft, k * (1 - m)) : '#fff';
    if (m > 0.001) ctx.fillStyle = k > 0.5 ? C.green : mixColor('#ffffff', C.muted, m);
    ctx.fill();
    if (m < 0.999) {
      ctx.globalAlpha *= 1 - m;
      ctx.strokeStyle = k > 0.5 ? C.green : C.muted;
      ctx.lineWidth = k > 0.5 ? 2 : 1.5;
      ctx.stroke();
      // the strip's lines of text
      ctx.fillStyle = k > 0.5 ? C.green : C.muted;
      [0.7, 0.5].forEach((f, r) => ctx.fillRect(at.x - STRIP.w / 2 + 5, at.y - STRIP.h / 2 + 6 + r * 6 + dy, (STRIP.w - 10) * f, 2.5));
    }
    ctx.restore();
    out.dot[p.n ?? `p${i}`] = { x: at.x - Math.max(w, 12) / 2, y: at.y - Math.max(h, 12) / 2, w: Math.max(w, 12), h: Math.max(h, 12) };
  });

  // the numbers of the passages found, and of the one missed
  FOUND.forEach((n, k) => {
    const la = found[k] ?? 0;
    if (la <= 0.001) return;
    text(ctx, `［${n}］`, lab[n].x, lab[n].y + 5, { font: LABEL, color: C.green, align: 'center', alpha: la });
  });
  if (miss > 0.001) {
    const d = S.pos[indexOf(MISSED)];
    ctx.save();
    ctx.globalAlpha *= miss;
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.5;
    circle(ctx, d.x, d.y, 11 + (1 - miss) * 6);
    ctx.stroke();
    ctx.restore();
    text(ctx, `［${MISSED}］`, lab[MISSED].x, lab[MISSED].y + 5, { font: LABEL, color: C.red, align: 'center', alpha: miss });
  }

  // the query's dot
  const qd = q.dot ?? 0;
  if (qd > 0.001) {
    ctx.save();
    ctx.globalAlpha *= qd;
    ctx.fillStyle = C.accent;
    circle(ctx, S.q.x, S.q.y, QDOT * Math.min(1.15, 0.6 + qd * 0.5));
    ctx.fill();
    ctx.restore();
    text(ctx, '質問', lab.q.x, lab.q.y + 5, { font: LABEL, color: C.accent, align: 'center', alpha: qd });
  }

  // the passage the search missed, under the map
  if (miss > 0.001) {
    const M = S.miss;
    const dy = (1 - miss) * 6;
    ctx.save();
    ctx.globalAlpha *= miss;
    rr(ctx, M.x, M.y + dy, M.w, M.h, 8);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    const [l1, l2] = o.missText ?? ['', ''];
    text(ctx, l1, M.x + 12, M.y + 22 + dy, { font: F.jp(700, 14), color: C.ink, alpha: miss });
    text(ctx, l2, M.x + 12, M.y + 45 + dy, { font: F.jp(500, 14), color: C.ink2, alpha: miss });
    tag(ctx, M.x + M.w - 8, M.y + 7 + dy, '見つからなかった', { font: F.jp(700, 12), h: 22, padX: 7, fill: C.red, color: '#fff', align: 'right', r: 6, alpha: miss });
    out.miss = { x: M.x, y: M.y, w: M.w, h: M.h };
  }
  ctx.restore();
  return out;
}

// '#rrggbb' a → b by p.
function mixColor(a, b, p) {
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [h(a), h(b)];
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(p)))).join(',')})`;
}
