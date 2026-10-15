// The shell in the tool's place, as 6-3 (clips/shell.js) introduces it and 6-4 (clips/agent.js) keeps
// using it: the layout of 6-1 to 6-4 (lib/rig.js toolUseLayout with a taller tool's place and a shorter
// screen), the document's pieces for a bash call (the definition at the head, the call band, the app
// seeing its end and stopping the writing), the terminal with the programs behind it (locks, checks,
// the links from the shell down to a program), and the marks 6-3 leaves on the picture (the person who
// checks, the fence of a separate place, the card of what is done about the danger, the tags under
// the LLM). Moved here from shell.js unchanged (README「2026-10-15（6-4 を作る）」); every function
// draws one frame and keeps no state.

import { C, F } from './theme.js';
import { tag } from './parts.js';
import { toolUseLayout, G5, onPath, roleMark, markWidth, MARK_H, ROLE, WRITER } from './rig.js';
import { text, measure, rr, path, circle, line, arrowHead, typed } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { ringBox } from '../../../src/kit/cue.js';

// ——— the layout: 6-1's to 6-4's (the tool's place taller, the screen shorter)
export const G6 = { ...G5, tool: { x: G5.tool.x, y: 400, w: G5.tool.w, h: 370 } };
export const T = toolUseLayout(G6);
export const { L, ACT } = T;
export const SCREEN = { ...T.SCREEN, h: 250 };
export const TOOL = L.tool;
export const DOC = L.doc;

// ——— the document: the head, and the LLM's calls
export const MFONT = F.mono(500, 15); // JSON, and a command's output
export const DX = DOC.x + 18 + 122 + 12; // where the entries' text starts (docLayout's tx)
export const SYS = { x: DOC.x + 18, y: DOC.y + 14 };
export const defY = (k) => SYS.y + 20 + k * 26;
// the one definition of the shell, at the head (6-3's c on)
export const DEFS = [
  [['bash', F.jp(700, 17)], ['：コマンドを実行して、出力を返す', F.jp(500, 17)]],
  [['入力：command（コマンド）', F.jp(500, 17)]],
];

// Lay out rows of a definition: [[[text, font], …], …] → { segs, right, n } per row (the second row of
// each definition is indented, as 6-2 has it).
export function defRows(ctx, rows) {
  return rows.map((row, k) => {
    let x = DX + (k % 2 ? 19 : 0);
    const segs = row.map(([s, font]) => {
      const w = measure(ctx, font, s);
      const out = { s, font, x, w, n: Array.from(s).length };
      x += w;
      return out;
    });
    return { segs, right: x, n: segs.reduce((n, sg) => n + sg.n, 0) };
  });
}

// One row of a definition, typed in by p (0–1).
export function drawDef(ctx, d, y, p) {
  if (p <= 0) return;
  let left = Math.round(d.n * clamp(p));
  d.segs.forEach((sg) => {
    if (left <= 0) return;
    const s = Array.from(sg.s).slice(0, left).join('');
    left -= sg.n;
    text(ctx, s, sg.x, y, { font: sg.font, color: C.ink });
  });
}

// A call band: the LLM's call mark, the JSON in rows (token by token), its end mark after the last row.
// o: { font (MFONT), hang (rows after the first start under the call mark, not after it) }
export function callLayout(ctx, band, rows, lh, o = {}) {
  const font = o.font ?? MFONT;
  const tx0 = band.x + 12;
  const openW = markWidth(ctx, ROLE.call.name);
  const endW = markWidth(ctx, ROLE.callEnd.name);
  const jx = tx0 + openW + 10;
  const top = (r) => band.y + 8 + r * lh;
  const toks = [];
  const rowEnd = [];
  rows.forEach((row, r) => {
    let x = r > 0 && o.hang ? tx0 : jx;
    row.forEach((s) => {
      const w = measure(ctx, font, s);
      toks.push({ s, x, w, y: top(r) + 14, base: top(r) + 19, row: r });
      x += w;
    });
    rowEnd.push(x);
  });
  const last = rows.length - 1;
  return { band, font, toks, open: { x: tx0, y: top(0), w: openW }, end: { x: rowEnd[last] + 8, y: top(last), w: endW } };
}

// The call as far as the LLM has written it: the band (once its mark has landed), the marks, n tokens.
export function drawCall(ctx, c, { bandA, open, n, end }) {
  const { band } = c;
  if (bandA > 0.001) {
    ctx.save();
    ctx.globalAlpha *= bandA;
    rr(ctx, band.x, band.y, band.w, band.h, 8);
    ctx.fillStyle = C.accentSoft;
    ctx.fill();
    ctx.fillStyle = C.accent;
    ctx.fillRect(band.x, band.y + 6, 4, band.h - 12);
    ctx.restore();
  }
  if (open) roleMark(ctx, c.open.x, c.open.y, ROLE.call, { edge: WRITER.call });
  c.toks.slice(0, n).forEach((tk) => text(ctx, tk.s, tk.x, tk.base, { font: c.font ?? MFONT, color: C.ink }));
  if (end) roleMark(ctx, c.end.x, c.end.y, ROLE.callEnd, { edge: WRITER.callEnd });
}

// The app sees where the call ends — purple dashes from its box down the document's right margin.
export function lookLine(ctx, m, p, a) {
  const x = DOC.x + DOC.w - 8;
  const y0 = ACT.y + ACT.h + 4;
  const y = m.y + MARK_H / 2;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 6]);
  path(ctx, [[x, y0], [x, y], [m.x + m.w + 9, y]], p);
  ctx.setLineDash([]);
  ctx.restore();
}

// The app stops the writing — the purple tag on the write channel, as in 4-2 and chapter 5.
export function halt(ctx, a) {
  if (a <= 0.001) return;
  const cx = (L.write.x1 + L.write.x2) / 2;
  const w = measure(ctx, F.jp(700, 16), '止める') + 44;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, cx - w / 2, L.write.y - 15, w, 30, 15);
  ctx.fillStyle = C.purple;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - w / 2 + 13, L.write.y - 5, 10, 10);
  ctx.restore();
  text(ctx, '止める', cx - w / 2 + 31, L.write.y + 1, { font: F.jp(700, 16), color: '#fff', base: 'middle', alpha: a });
}

// A chip on its way along a polyline (eased overall). kind 'call': a command the LLM wrote, which the app
// passes on (vermilion, as chapter 5's input); 'found': the output coming back. The chip slides into the
// tool's place and out of it under its edge (a: what is left of a chip that has arrived and waits).
export function chipFlight(ctx, p, pts, s, kind, a = null) {
  if (p <= 0 || p >= 1 || a === 0) return;
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, TOOL.x, 900);
  ctx.clip();
  ctx.globalAlpha = clamp(p * 8) * (a ?? clamp((1 - p) * 8));
  const font = kind === 'call' ? F.mono(600, 15) : F.jp(700, 16);
  tag(ctx, pt.x, pt.y - 15, s, { font, h: 30, padX: 10, fill: kind === 'call' ? C.accent : C.green, color: '#fff', align: 'center', r: 8 });
  ctx.restore();
}

// ——— the channels named for what goes along them (6-3's e) ————————————————————————————————

export function channelNames(ctx, { inName, outName, errName, inHot, outHot, ringLit }) {
  const font = F.jp(500, 16);
  const cx = (L.call.x1 + L.call.x2) / 2 - 4;
  const iy = L.call.y - 26;
  const oy = L.back.y + 42;
  text(ctx, 'コマンド', cx, iy, { font, color: inHot ? C.accent : C.muted, align: 'center', alpha: inName });
  text(ctx, '出力', cx, oy, { font: F.jp(500, 17), color: outHot ? C.accent : C.muted, align: 'center', alpha: outName });
  text(ctx, 'エラー', cx, oy + 21, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: errName });
  const wi = measure(ctx, font, 'コマンド');
  const wo = measure(ctx, F.jp(500, 15), 'エラー');
  ringBox(ctx, [{ x: cx - wi / 2, y: iy - 16, w: wi, h: 20 }], ringLit, C.accent, 2);
  ringBox(ctx, [{ x: cx - wo / 2, y: oy - 16, w: wo, h: 41 }], ringLit, C.accent, 2);
}

// ——— the shell: a terminal at the top of the tool's place, the programs under it ——————————————

export const TERM = { x: TOOL.x + 14, y: TOOL.y + 14, w: TOOL.w - 28, h: 160 };
export const TL = { font: F.mono(500, 15), lh: 22, top: 56, rows: 5, x: TERM.x + 14 };
export const TC = { bg: '#2a2d33', head: '#a9a49a', rule: '#43474f', cmd: '#f1eee6', out: '#cfcabd', err: '#ff8f80', prompt: '#7fd39b' };
export const CHIP = { font: F.mono(600, 14), h: 26, padX: 9, r: 7 };
export const ROWS_B = [['ls', 'date', 'python3', 'rm', 'cat', 'bc'], ['find', 'grep', 'git', 'sort', 'wc', 'sed'], ['cp', 'mv', 'curl', 'ssh', 'sudo', '…']];
export const LOCKED = ['curl', 'ssh', 'sudo'];
export const B_Y = TERM.y + TERM.h + 26; // the programs' first row, under the shell
export const B_LABEL = TOOL.y + TOOL.h - 42;
export const B_KEY = TOOL.y + TOOL.h - 18;

// Where the programs stand under the shell: { posB: { name: { x, y, w } }, chipsBox }. For prepare.
export function programChips(ctx) {
  const cw = (n) => measure(ctx, CHIP.font, n) + CHIP.padX * 2;
  const posB = {};
  ROWS_B.forEach((row, r) => {
    let x = TERM.x + 2;
    row.forEach((n) => {
      posB[n] = { x, y: B_Y + r * 38, w: cw(n) };
      x += cw(n) + 8;
    });
    if (x - 8 > TERM.x + TERM.w) throw new Error(`terminal: row ${r} under the shell is too wide`);
  });
  const all = Object.values(posB);
  const cx0 = Math.min(...all.map((b) => b.x));
  const cy0 = Math.min(...all.map((b) => b.y));
  const chipsBox = { x: cx0, y: cy0, w: Math.max(...all.map((b) => b.x + b.w)) - cx0, h: Math.max(...all.map((b) => b.y + CHIP.h)) - cy0 };
  return { posB, chipsBox };
}

// The terminal: a dark board with its name, and the last few lines, scrolling up as new ones come.
// lines: [{ s, cmd (typed after the prompt) | cont (a command's next line, typed) | err, red, show, type }].
// o: { lineAlpha (the lines only, not the board) }.
// Returns helpers for rings: box(k, part, before) — where line k (or a part of it) is now — and shown(k).
export function terminal(ctx, t, a, lines, o = {}) {
  if (a <= 0.001) return null;
  const lineA = o.lineAlpha ?? 1;
  const dy = (1 - a) * -10;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, TERM.x, TERM.y + dy, TERM.w, TERM.h, 12);
  ctx.fillStyle = TC.bg;
  ctx.fill();
  ctx.fillStyle = TC.rule;
  ctx.fillRect(TERM.x + 12, TERM.y + 32 + dy, TERM.w - 24, 1.5);
  ctx.restore();
  text(ctx, 'シェル（bash）', TERM.x + 14, TERM.y + 22 + dy, { font: F.jp(700, 15), color: TC.head, alpha: a });
  const scroll = lines.reduce((sum, ln, k) => (k < TL.rows ? sum : sum + tw(t, ln.show - 0.05, 0.25, inOutCubic)), 0);
  const yOf = (k) => TERM.y + TL.top + (k - scroll) * TL.lh + dy;
  const shown = (k) => tw(t, lines[k].show, 0.15) * clamp(1 - Math.max(0, scroll - k) * 1.2);
  const pw = measure(ctx, TL.font, '$ ');
  ctx.save();
  ctx.beginPath();
  ctx.rect(TERM.x, TERM.y + 36 + dy, TERM.w, TERM.h - 40);
  ctx.clip();
  let cursor = null;
  lines.forEach((ln, k) => {
    const la = tw(t, ln.show, 0.15) * lineA;
    if (la <= 0.001) return;
    const y = yOf(k);
    if (ln.cmd || ln.cont) {
      if (ln.cmd) text(ctx, '$', TL.x, y, { font: TL.font, color: TC.prompt, alpha: a * la });
      const s = typed(ln.s, seg(t, ln.type, ln.type + Math.min(0.5, 0.1 + ln.s.length * 0.025)));
      const w = text(ctx, s, TL.x + pw, y, { font: TL.font, color: ln.red ? TC.err : TC.cmd, alpha: a * la });
      const next = lines[k + 1];
      if (!next || t < next.show) cursor = { x: TL.x + pw + w + 2, y };
    } else {
      text(ctx, ln.s, TL.x, y, { font: TL.font, color: ln.err ? TC.err : TC.out, alpha: a * la });
    }
  });
  if (cursor && Math.floor(t * 2.5) % 2 === 0) {
    ctx.globalAlpha *= a * lineA;
    ctx.fillStyle = C.accent;
    ctx.fillRect(cursor.x, cursor.y - 14, 9, 17);
  }
  ctx.restore();
  return {
    shown,
    box(k, part, before = '') {
      const ln = lines[k];
      const x0 = TL.x + (ln.cmd || ln.cont ? pw : 0) + measure(ctx, TL.font, before);
      return { x: x0, y: yOf(k) - 14, w: measure(ctx, TL.font, part ?? ln.s), h: 18 };
    },
  };
}

// A program, as a chip (drawn at scale sc about its top-left). o: { a, lit, lock, red, ok }
export function progChip(ctx, x, y, w, sc, name, o) {
  if (o.a <= 0.001) return;
  const lock = o.lock ?? 0;
  const red = o.red ?? 0;
  const lit = (o.lit ?? 0) * (1 - lock);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.globalAlpha *= clamp(o.a);
  rr(ctx, 0, 0, w, CHIP.h, CHIP.r);
  ctx.fillStyle = blend(blend(blend('#ffffff', C.accentSoft, lit), C.panel, lock), '#fde4df', red);
  ctx.fill();
  ctx.strokeStyle = blend(blend(blend(C.ink2, C.accent, lit), C.rule, lock), C.red, red);
  ctx.lineWidth = 1.5 + lit + red;
  ctx.stroke();
  text(ctx, name, w / 2, CHIP.h / 2 + 1, { font: CHIP.font, color: blend(blend(C.ink, C.muted, lock), C.red, red), align: 'center', base: 'middle' });
  // the badge at the top right: a lock (not allowed), or a check (allowed to run)
  if (lock > 0.001) padlock(ctx, w - 1, 1, 8.5, lock);
  if ((o.ok ?? 0) > 0.001) check(ctx, w - 1, 1, 8.5, o.ok);
  ctx.restore();
}

// A small lock in a dark disc, centred at (x, y).
export function padlock(ctx, x, y, r, a) {
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.fillStyle = C.ink2;
  circle(ctx, x, y, r * Math.min(1, 0.6 + a * 0.5));
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y - 1.2, r * 0.3, Math.PI, 0);
  ctx.stroke();
  ctx.fillRect(x - r * 0.45, y - 1, r * 0.9, r * 0.7);
  ctx.restore();
}

// A check in a green disc, centred at (x, y).
export function check(ctx, x, y, r, a) {
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.fillStyle = C.green;
  circle(ctx, x, y, r * Math.min(1, 0.6 + a * 0.5));
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.4, y);
  ctx.lineTo(x - r * 0.1, y + r * 0.32);
  ctx.lineTo(x + r * 0.42, y - r * 0.3);
  ctx.stroke();
  ctx.restore();
}

// From the shell down to the program it runs.
export function shellLink(ctx, b, a, color) {
  if (a <= 0.001) return;
  const x = b.x + b.w / 2;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  line(ctx, x, TERM.y + TERM.h + 2, x, b.y - 9);
  arrowHead(ctx, x, b.y - 3, Math.PI / 2, 9);
  ctx.restore();
}

// Under the programs: the key to the lock and the check.
export function keyRow(ctx, x, y, lockA, okA) {
  if (lockA > 0.001) {
    padlock(ctx, x + 8, y - 5, 8.5, lockA);
    text(ctx, '実行を許されていない', x + 22, y, { font: F.jp(500, 13), color: C.ink2, alpha: lockA });
  }
  if (okA > 0.001) {
    const x2 = x + 22 + measure(ctx, F.jp(500, 13), '実行を許されていない') + 18;
    check(ctx, x2 + 8, y - 5, 8.5, okA);
    text(ctx, '実行できる', x2 + 22, y, { font: F.jp(500, 13), color: C.ink2, alpha: okA });
  }
}

// A person checks before the command runs — a badge on the way to the shell.
export function gate(ctx, x, y, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  circle(ctx, x, y, 16 * Math.min(1, 0.6 + a * 0.5));
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  person(ctx, x, y, C.purple);
  ctx.restore();
}

export function person(ctx, x, y, color, s = 1) {
  ctx.fillStyle = color;
  circle(ctx, x, y - 4.5 * s, 3.8 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y + 8.5 * s, 7 * s, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
}

// The shell runs in a place apart — a dashed fence round the tool's place.
export const SANDBOX = { x: TOOL.x - 6, y: TOOL.y - 7, w: TOOL.w + 12, h: TOOL.h + 14 };

export function sandbox(ctx, a) {
  if (a <= 0.001) return;
  const b = SANDBOX;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 7]);
  rr(ctx, b.x, b.y, b.w, b.h, 26);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  text(ctx, 'ふだんの環境と分けた場所', b.x + 4, b.y + b.h + 24, { font: F.jp(700, 15), color: C.ink2, alpha: a });
}

// ——— above and under the LLM ———————————————————————————————————————————————————————————

export const CARE = { x: 30, y: 46, w: 346, h: 168 }; // 6-3's l: what is done about the danger
export const NOTE_X = L.llm.x + L.llm.w / 2;
export const NOTE_Y = [L.llm.y + L.llm.h + 24, L.llm.y + L.llm.h + 66, L.llm.y + L.llm.h + 108];

// Under the LLM: what it does with the shell (6-3's f), and what it learned (6-3's h2).
export function llmTag(ctx, y, s, a) {
  tag(ctx, NOTE_X, y, s, { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: a });
}

// 6-3's l: what is done about the danger (chapter 7).
export function careCard(ctx, { card, rows, ch7 }) {
  if (card <= 0.001) return;
  const b = CARE;
  ctx.save();
  ctx.globalAlpha *= card;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  const tw0 = text(ctx, '危なさへの手当て', b.x + 16, b.y + 32, { font: F.jp(700, 17), color: C.ink2, alpha: card });
  tag(ctx, b.x + 16 + tw0 + 14, b.y + 12, '7 章　ハーネス', { font: F.jp(700, 15), h: 30, padX: 11, fill: C.ink, color: C.paper, alpha: ch7 });
  const ROWS = ['使えるファイルや操作を絞る', '実行の前に、人に確かめる', 'ふだんの環境と分けた場所で動かす'];
  ROWS.forEach((s, k) => {
    const a = rows[k] * card;
    if (a <= 0.001) return;
    const y = b.y + 74 + k * 36 + (1 - rows[k]) * 6;
    const ix = b.x + 30;
    ctx.save();
    ctx.globalAlpha *= a;
    if (k === 0) padlock(ctx, ix, y - 6, 10, 1);
    if (k === 1) {
      circle(ctx, ix, y - 6, 11);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2;
      ctx.stroke();
      person(ctx, ix, y - 6, C.purple, 0.7);
    }
    if (k === 2) {
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      rr(ctx, ix - 11, y - 16, 22, 20, 5);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    text(ctx, s, b.x + 52, y, { font: F.jp(500, 15), color: C.ink, alpha: a });
  });
}

// '#rrggbb' a → b by p.
export function blend(a, b, p) {
  if (p <= 0.001) return a;
  if (p >= 0.999) return b;
  const hex = (s) => (s.startsWith('rgb') ? s.match(/\d+/g).map(Number) : [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)));
  const [x, y] = [hex(a), hex(b)];
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(p)))).join(',')})`;
}
