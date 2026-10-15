// Chapter 7's picture (README「2026-10-16（7 章を作り直す）」), laid out by 7-1 (clips/harness.js) for the
// chapter's eight clips. The whole chapter follows one long task, 6-4's continued: the LLM on the left; in
// the middle the harness's frame (the purple box, now named ハーネス, with the document under it); at the
// top right the chat screen; at the bottom right the tool's place, holding 6-4's shell (lib/terminal.js's
// terminal) and, from 7-3 on, the MCP servers; outside it, below, the net beyond (GitHub). The frame and the
// LLM stand where 6-6 (clips/gui.js, G66) left them; the screen is taller (the report and the request fit)
// and the tool's place lower. Every function draws one frame and keeps no state.
//
// Use, in a clip of chapter 7:
//   import { T7, L7, ACT7, DOC7, SCREEN7, TOOL7, TERM7, SERVERS7, NET7, CARD7, UNDER7, PANEL7, … } from '../lib/harness.js';
//   T7 is harnessLayout(): toolUseLayout(G7) (lib/rig.js) with the harness's wider box. Pass it where chapter 5's
//   T goes (screenLinks, toTool, fromTool, writePath, flyMark); T7.L is the layout (llm, app, doc, tool and the
//   four channels), T7.ACT the box (also ACT7), T7.LOOP the loop's place left of it, T7.FROM where marks leave it.
//   prepare: docLayout(ctx, L7, entries, { ...T7.DOC, font: TFONT, lh: 28 }); the head of the document is
//            lib/terminal.js's (SYS, defY, DEFS, DX: the document's left edge and top are 6-1's to 6-6's).
//   draw:    llmBlock(ctx, L7, a, { glow }); appFrame(ctx, L7, a, { name: '' }); harnessBox(ctx, ACT7, a, { glow });
//            chatScreen(ctx, SCREEN7, a); screenLinks(ctx, T7, { … }); channel(ctx, L7.read | write | call | back, …);
//            toolPlace(ctx, L7, a, { draw(c) { shell(c, t, a, lines); … } });   // the box and its name
//            netPlace(ctx, NET7, a, { name: 'GitHub' });  fence(ctx, box, a, 'サンドボックス');
//            exampleNote(ctx, L7, '…は説明のための例', a);  marker(ctx, box, a); paperTop(ctx, DOC7, sy, a);
//            chipGo(ctx, p, toTool(T7, band, -sy), 'grep', 'call');  lookLine(ctx, DOC7, ACT7, endMark, p, a);
//   mix7(G7, other, p) (or mix7(other, G7, p)) moves the boxes to another geometry and back, as 6-5 and 6-6 did.
//
// Where the chapter's later pieces go (7-1 only reserves the places; each clip draws its own):
//   7-2, 7-3  GitHub (the issue list) in NET7, outside the tool's place, with a line up to the tool's place
//             ("ネットの先", 6-6's outside service). The MCP servers stand in SERVERS7, under the shell.
//             7-3's log of the exchange (tools/list, tools/call) can take CARD7 (top left) or UNDER7.
//   7-4       the record file (session.jsonl, one row per entry) in CARD7, outside the frame; the bar of what
//             the document holds in UNDER7, under the LLM.
//   7-5       the window's limit as a dashed line on UNDER7's bar (as 4-5's bars have it); AGENTS.md as a card
//             in CARD7.
//   7-6       three small agents in the tool's place: SERVERS7 is 426 × 98; for more room shorten the shell
//             (terminal's rows and box) or grow the tool's place towards NET7 with mix7().
//   7-7       the rules card in PANEL7, the document shortened to DOC7_SHORT as 7-1 ends; the sandbox as
//             fence(ctx, around TERM7, a, 'サンドボックス') — 6-6's dashed fence, the same shape.
// 7-1 ends with the list of the harness's jobs in CARD7, the chapter's contents (dashed cards) in PANEL7 and
// two notes in UNDER7; 7-2's bridge clears what it does not keep. jobCards() and tocCards() draw them as 7-1
// ends, so that 7-2 can draw its first frame with the same functions.

import { C, F } from './theme.js';
import { tag } from './parts.js';
import { toolUseLayout, toolBox, onPath, MARK_H } from './rig.js';
import { terminal, person } from './terminal.js';
import { text, rr, path, circle, arrowHead } from '../../../src/kit/draw.js';
import { lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';

// ——— the geometry ————————————————————————————————————————————————————————————————————————————

// the LLM and the frame as 6-6 leaves them; the tool's place lower, under a taller screen
export const G7 = {
  llm: { x: 96, y: 372, w: 170, h: 170 },
  app: { x: 386, y: 100, w: 580, h: 712 },
  tool: { x: 1050, y: 396, w: 454, h: 284 },
};
export const SCREEN_H = 250;
// the harness's box: as wide as its name needs (ハーネス is longer than アプリ), its right edge where it was
export const HARNESS_W = 236;
export const NAME = 'ハーネス';
export const NAME_X = 86; // the name's left edge in the box, as rig.js's actor() has it

// toolUseLayout(g) with the box of width boxW (200 is the app's, as chapters 4 to 6 have it).
export function harnessLayout(g = G7, boxW = HARNESS_W) {
  const T = toolUseLayout(g);
  const A = T.ACT;
  const ACT = { x: A.x + A.w - boxW, y: A.y, w: boxW, h: A.h };
  const cy = ACT.y + ACT.h / 2;
  return {
    ...T,
    ACT,
    SCREEN: { ...T.SCREEN, h: SCREEN_H },
    SIDE: { x1: T.L.doc.x, x2: ACT.x - 22, y: cy },
    LOOP: { x: ACT.x - 44, y: cy, r: 22 },
    FROM: { x: ACT.x + 24, y: ACT.y + ACT.h - MARK_H / 2 - 6 },
  };
}

const mixBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
// a geometry between two (for a bridge, or a clip whose tool's place grows for a while)
export const mix7 = (a, b, p) => ({ llm: mixBox(a.llm, b.llm, p), app: mixBox(a.app, b.app, p), tool: mixBox(a.tool, b.tool, p) });

export const T7 = harnessLayout();
export const L7 = T7.L;
export const ACT7 = T7.ACT;
export const DOC7 = L7.doc; // { x: 408, y: 234, w: 536, h: 556 }
export const SCREEN7 = T7.SCREEN; // { x: 1050, y: 100, w: 454, h: 250 }
export const TOOL7 = L7.tool;
// in the tool's place: the shell at the top, the MCP servers under it (7-3 on)
export const TERM7 = { x: TOOL7.x + 14, y: TOOL7.y + 14, w: TOOL7.w - 28, h: 160 };
export const SERVERS7 = { x: TERM7.x, y: TERM7.y + TERM7.h + 14, w: TERM7.w, h: TOOL7.y + TOOL7.h - 14 - (TERM7.y + TERM7.h + 14) };
// outside the tool's place, below it: the net beyond (GitHub, 7-2 on)
export const NET7 = { x: TOOL7.x, y: TOOL7.y + TOOL7.h + 34, w: TOOL7.w, h: 118 };
// above the LLM and under it (outside the frame)
export const CARD7 = { x: 30, y: 46, w: 336, h: 300 };
export const UNDER7 = { x: 30, y: 566, w: 336, h: 250 };
// in the frame, under a shorter document: the chapter's contents as 7-1 ends; 7-7's rules
export const DOC7_SHORT = { ...DOC7, h: 192 };
export const PANEL7 = { x: DOC7.x, y: DOC7.y + DOC7_SHORT.h + 16, w: DOC7.w, h: DOC7.y + DOC7.h - (DOC7.y + DOC7_SHORT.h + 16) };

// ——— the parts ————————————————————————————————————————————————————————————————————————————————

// The harness's box (the app's, renamed in 7-1): drawn as rig.js's actor() draws the app's box — the same
// strokes, so a box named アプリ here is the app's box to the pixel. o: { glow (0–1, it is at work), names
// ([[name, alpha, dy], …] — more than one while a name gives way to another; clipped to the box), name }
export function harnessBox(ctx, B, a, o = {}) {
  if (a <= 0.001) return;
  const cy = B.y + B.h / 2;
  const glow = o.glow ?? 0;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, B.x, B.y, B.w, B.h, 18);
  ctx.fillStyle = C.purple;
  ctx.fill();
  if (glow > 0.001) {
    ctx.save();
    ctx.globalAlpha *= clamp(glow);
    rr(ctx, B.x - 7, B.y - 7, B.w + 14, B.h + 14, 24);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }
  gear(ctx, B.x + 48, cy, 24, '#fff');
  ctx.restore();
  const names = o.names ?? [[o.name ?? NAME, 1, 0]];
  const moving = names.length > 1 || names.some(([, , dy]) => dy);
  if (moving) {
    ctx.save();
    rr(ctx, B.x, B.y, B.w, B.h, 18);
    ctx.clip();
  }
  names.forEach(([s, na, dy]) => text(ctx, s, B.x + NAME_X, cy + 2 + dy, { font: F.jp(700, 32), color: '#fff', base: 'middle', alpha: a * na }));
  if (moving) ctx.restore();
}

// rig.js's gear, stroke for stroke
function gear(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i / 8) * Math.PI * 2);
    ctx.fillRect(-r * 0.17, -r, r * 0.34, r * 0.4);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.moveTo(r * 0.3, 0);
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();
}

// The tool's place: a solid box with its name above (6-6's way). o: toolBox's (draw, glow), nameAlpha
export function toolPlace(ctx, L, a = 1, o = {}) {
  toolBox(ctx, L, a, { solid: 1, ...o });
  const b = L.tool;
  const na = a * (o.nameAlpha ?? 1);
  const lw = text(ctx, 'ツール', b.x, b.y - 16, { font: F.jp(700, 22), color: C.ink, alpha: na });
  text(ctx, 'の場所', b.x + lw, b.y - 16, { font: F.jp(700, 22), color: C.ink, alpha: na });
}

// The shell in the tool's place: lib/terminal.js's terminal on TERM7 (or o.box).
export const shell = (ctx, t, a, lines, o = {}) => terminal(ctx, t, a, lines, { box: TERM7, ...o });

// The net beyond the tool's place: a plain panel with a name and a note (7-2 on draws GitHub in it).
// o: { name, note (default 外のサービス（ネットの先）), draw(ctx, box, a) }
export function netPlace(ctx, B, a, o = {}) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, B.x, B.y, B.w, B.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();
  if (o.name) text(ctx, o.name, B.x + 16, B.y + 30, { font: F.jp(700, 18), color: C.ink, alpha: a });
  text(ctx, o.note ?? '外のサービス（ネットの先）', B.x + B.w - 16, B.y + 29, { font: F.jp(500, 13), color: C.muted, align: 'right', alpha: a });
  if (o.draw) o.draw(ctx, B, a);
}

// A dashed fence round a box, with its name on the top edge at the right — 6-6's 切り離した環境, the shape
// 7-7's sandbox takes. o: { pad (room between the box and the fence), gap ({ x, y, w, h }: where the line breaks,
// e.g. round the tool's place's name) }
export function fence(ctx, B, a, label, o = {}) {
  if (a <= 0.001) return;
  const pad = (o.pad ?? 7) + (1 - a) * 10;
  ctx.save();
  if (o.gap) {
    ctx.beginPath();
    ctx.rect(0, 0, 1600, 900);
    ctx.rect(o.gap.x, o.gap.y, o.gap.w, o.gap.h);
    ctx.clip('evenodd');
  }
  ctx.globalAlpha *= a;
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 7]);
  rr(ctx, B.x - pad, B.y - pad, B.w + pad * 2, B.h + pad * 2, 22);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  if (label) tag(ctx, B.x + B.w - 16, B.y - (o.pad ?? 7) - 13, label, { font: F.jp(700, 14), h: 26, padX: 10, fill: C.paper, stroke: C.ink2, color: C.ink2, r: 13, align: 'right', alpha: a });
}

// The 例 under the frame, with what is an example (cross-fade two of them by drawing both).
export const EX_FONT = F.jp(400, 17);
export function exampleNote(ctx, L, s, a, markA = 1) {
  const x = L.app.x;
  const y = L.app.y + L.app.h + 22;
  const w = tag(ctx, x, y, '例', { font: F.jp(700, 17), h: 30, padX: 10, stroke: C.muted, color: C.muted, alpha: markA });
  if (s) text(ctx, s, x + w + 10, y + 21, { font: EX_FONT, color: C.muted, alpha: a });
}

// A highlighter under a piece of text that is already drawn (multiplied, so the text stays dark).
export function marker(ctx, b, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha *= clamp(a);
  rr(ctx, b.x - 3, b.y - 1, b.w + 6, b.h + 2, 4);
  ctx.fillStyle = C.accentSoft;
  ctx.fill();
  ctx.restore();
}

// The top of the paper, where the scrolled part goes on (6-4 to 6-6).
export function paperTop(ctx, D, sy, a) {
  const g = ctx.createLinearGradient(0, D.y, 0, D.y + 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalAlpha = clamp(sy / 30) * a;
  ctx.fillStyle = g;
  ctx.fillRect(D.x + 4, D.y + 2, D.w - 8, 30);
  ctx.restore();
}

// The harness sees where the LLM's call ends: purple dashes from its box down the document's right margin
// to the mark m ({ x, y, w }, already scrolled).
export function lookLine(ctx, D, B, m, p, a) {
  const x = D.x + D.w - 8;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 6]);
  path(ctx, [[x, B.y + B.h + 4], [x, m.y + MARK_H / 2], [m.x + m.w + 9, m.y + MARK_H / 2]], p);
  ctx.setLineDash([]);
  ctx.restore();
}

// A chip on its way along a polyline (eased overall): kind 'call', a command or a call the LLM wrote, passed on
// by the harness (vermilion); 'found', what comes back (green). It slides into the tool's place and out of it
// under its edge (clipX: the tool's place's left edge; a: what is left of a chip that has arrived and waits).
export function chipGo(ctx, p, pts, s, kind, a = null, clipX = TOOL7.x) {
  if (p <= 0 || p >= 1 || a === 0) return;
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, clipX, 900);
  ctx.clip();
  ctx.globalAlpha = clamp(p * 8) * (a ?? clamp((1 - p) * 8));
  const font = kind === 'call' ? F.mono(600, 15) : F.jp(700, 16);
  tag(ctx, pt.x, pt.y - 15, s, { font, h: 30, padX: 10, fill: kind === 'call' ? C.accent : C.green, color: '#fff', align: 'center', r: 8 });
  ctx.restore();
}

// A closed outline through the corners pts, each rounded by up to r (6-4's agent frame).
export function framePath(ctx, pts, r) {
  const n = pts.length;
  const d = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  const first = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  for (let i = 0; i < n; i++) {
    const o = pts[(i - 1 + n) % n];
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const rr0 = Math.min(r, d(o, p) / 2, d(p, q) / 2);
    if (rr0 < 0.5) ctx.lineTo(p[0], p[1]);
    else ctx.arcTo(p[0], p[1], q[0], q[1], rr0);
  }
  ctx.closePath();
}
export const perimeter = (pts) => pts.reduce((n, p, i) => n + Math.hypot(pts[(i + 1) % pts.length][0] - p[0], pts[(i + 1) % pts.length][1] - p[1]), 0);

// ——— the long task (an example, README「例の仕事」) ———————————————————————————————————————————————

// 6-4's report (clips/agent.js REPORT_SCREEN), as the chat screen shows it
export const REPORT64 = '10月7日が41件で最も多く、うち38件は\nデータベースの時間切れでした。\n理由は、ログからはまだ不明です。';
// 7-1: what the user asks, on the screen and in the document
export const ASK7_SCREEN = '時間切れの原因を突き止めて、直す変更を作って。\nわかったことは、GitHub の Issue に書いておいて';
export const ASK7_DOC = '時間切れの原因を突き止めて、\n直す変更を作って。わかったことは、\nGitHub の Issue に書いておいて';
// 6-4's terminal as it ends: its three commands (two over two lines) and their output
export const TERM64 = [
  ['grep -c ERROR logs/*.log', 'cmd'], ['logs/2026-10-06.log:3'], ['logs/2026-10-07.log:41'], ['logs/2026-10-08.log:5'],
  ['grep ERROR logs/2026-10-07.log', 'cmd'], ['| head -3', 'cont'],
  ['ERROR db: timeout after 30s'], ['ERROR db: timeout after 30s'], ['ERROR db: timeout after 30s'],
  ["grep -c 'db: timeout'", 'cmd'], ['logs/2026-10-07.log', 'cont'], ['38'],
];
// terminal lines for TERM64, the k-th shown (and typed) at when(k)
export const term64Lines = (when) => TERM64.map(([s, kind], k) => ({ s, cmd: kind === 'cmd', cont: kind === 'cont', show: when(k), type: when(k) + 0.02 }));

// ——— 7-1's lists: the harness's jobs so far (top left), the chapter's contents (in the frame) ————————————

// [title, the clips that showed it, icon]
// (research/harness-jobs-facts 7-1: the loop is not shown as one that always gets the job done; which operations
// need the user's word is for whoever builds the harness to decide)
export const JOBS = [
  ['LLM に読ませる文書をまとめる', '4-2、5-2', 'doc'],
  ['ツールを動かし、結果を書き足す', '5-4', 'tool'],
  ['返事を書くまで、くり返す', '5-5', 'loop'],
  ['確認が要る操作は、ユーザーに確認', '6-3、6-6', 'ask'],
];
export const JOB = { x: CARD7.x, w: CARD7.w, head: CARD7.y + 26, top: CARD7.y + 42, h: 56, step: 64 };
export const jobBox = (k) => ({ x: JOB.x, y: JOB.top + k * JOB.step, w: JOB.w, h: JOB.h });

// The jobs list. o: { head ([[text, alpha], …]: the heading, cross-faded while it is renamed), cards ([alpha, …]),
// lit ([0–1, …]: a card the voice points at, its icon in vermilion) }
export function jobCards(ctx, o) {
  (o.head ?? []).forEach(([s, a]) => text(ctx, s, JOB.x + 2, JOB.head, { font: F.jp(700, 17), color: C.ink2, alpha: a }));
  JOBS.forEach(([title, refs, icon], k) => {
    const a = o.cards?.[k] ?? 0;
    if (a <= 0.001) return;
    const b = jobBox(k);
    const lit = o.lit?.[k] ?? 0;
    const dy = (1 - a) * 8;
    ctx.save();
    ctx.globalAlpha *= clamp(a);
    rr(ctx, b.x, b.y + dy, b.w, b.h, 12);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = C.purple;
    ctx.fillRect(b.x, b.y + dy + 10, 4, b.h - 20);
    ctx.restore();
    jobIcon(ctx, icon, b.x + 30, b.y + dy + b.h / 2, lit > 0.5 ? C.accent : C.purple, a);
    text(ctx, title, b.x + 56, b.y + dy + 25, { font: F.jp(700, 16), color: C.ink, alpha: a });
    text(ctx, `→ ${refs}`, b.x + 56, b.y + dy + 45, { font: F.mono(500, 13), color: C.muted, alpha: a });
  });
}

// [the clips, title, the question that brings it]
export const TOC = [
  ['7-2・7-3', '外のサービスにつなぐ', 'Issue に書きこむには？'],
  ['7-4', '記録を残す', '途中で止まったら？'],
  ['7-5', '窓に収める', '文書が長くなりすぎたら？'],
  ['7-6', '子に任せる', '調べものが増えたら？'],
  ['7-7', '操作の決まり', '元に戻せない操作は？'],
];
export const TOCL = { x: PANEL7.x, w: PANEL7.w, head: PANEL7.y + 26, top: PANEL7.y + 42, h: 52, step: 60, num: 116 };
export const tocBox = (k) => ({ x: TOCL.x, y: TOCL.top + k * TOCL.step, w: TOCL.w, h: TOCL.h });

// The chapter's contents: jobs the harness does not do yet, as dashed cards. o: { head, cards ([alpha, …]) }
export function tocCards(ctx, o) {
  const ha = o.head ?? 0;
  if (ha > 0.001) text(ctx, 'この章で、ハーネスに足していく仕事', TOCL.x + 2, TOCL.head, { font: F.jp(700, 17), color: C.ink2, alpha: ha });
  TOC.forEach(([num, title, q], k) => {
    const a = o.cards?.[k] ?? 0;
    if (a <= 0.001) return;
    const b = tocBox(k);
    const dy = (1 - a) * 8;
    ctx.save();
    ctx.globalAlpha *= clamp(a);
    rr(ctx, b.x, b.y + dy, b.w, b.h, 12);
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    text(ctx, num, b.x + 16, b.y + dy + 32, { font: F.mono(600, 15), color: C.purple, alpha: a });
    const tx = b.x + TOCL.num;
    const w = text(ctx, title, tx, b.y + dy + 33, { font: F.jp(700, 18), color: C.ink, alpha: a });
    text(ctx, q, tx + w + 16, b.y + dy + 32, { font: F.jp(500, 14), color: C.muted, alpha: a });
  });
}

// Small line icons for the jobs, centred on (x, y).
export function jobIcon(ctx, kind, x, y, color, a = 1) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.translate(x, y);
  ctx.beginPath();
  if (kind === 'doc') {
    ctx.rect(-9, -12, 18, 24);
    ctx.moveTo(-4, -5);
    ctx.lineTo(4, -5);
    ctx.moveTo(-4, 1);
    ctx.lineTo(4, 1);
    ctx.moveTo(-4, 7);
    ctx.lineTo(2, 7);
    ctx.stroke();
  } else if (kind === 'tool') {
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    for (let i = 0; i < 6; i++) {
      const r = (i * Math.PI) / 3;
      ctx.moveTo(Math.cos(r) * 8.5, Math.sin(r) * 8.5);
      ctx.lineTo(Math.cos(r) * 12.5, Math.sin(r) * 12.5);
    }
    ctx.stroke();
  } else if (kind === 'loop') {
    ctx.arc(0, 0, 11, -Math.PI * 0.35, Math.PI * 1.45);
    ctx.stroke();
    const e = Math.PI * 1.45;
    arrowHead(ctx, Math.cos(e) * 11, Math.sin(e) * 11, e + Math.PI / 2, 9);
  } else if (kind === 'ask') {
    circle(ctx, 0, 0, 13);
    ctx.stroke();
    person(ctx, 0, 0, color, 0.8);
  }
  ctx.restore();
}

// A grey bar standing for text whose words do not matter here (the document's entries, in 7-1's summary).
export function textBar(ctx, x, y, w, a, color = C.rule, h = 10) {
  if (a <= 0.001 || w <= 0.5) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, x, y - h / 2, w, h, h / 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

