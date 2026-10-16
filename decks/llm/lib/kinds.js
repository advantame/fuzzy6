// The deck's parts as kinds of node for retained clips (docs/stage.md): kind(ctx, props, a, env). Each one calls
// the drawing function the deck already has, with the same arguments an immediate clip passes it, so that a
// retained clip draws stroke for stroke what the immediate one did. a is the node's alpha; a kind passes it to
// the function's own alpha (or withAlpha, for one that has none). Kinds return where they drew, when they know
// (a box, or the boxes the function returns), for rings and for the tools that read where things are.
//
// The chapter 7 kinds read the harness's geometry from the world's vars: v.G (G7, G73 or between them), laid out
// by harnessLayout(). A bridge moves v.G, and every part that stands on it moves with it.

import { C, F } from './theme.js';
import { tag as tagFn } from './parts.js';
import {
  chatScreen, chatBubble, screenLinks, appFrame, llmBlock, channel, roleMark, docEntry, sweep, send, loopIcon, flyMark,
  token as tokenFn, ROLE, WRITER, MARK_H, markWidth,
} from './rig.js';
import { drawDef, drawCall, halt as haltFn, llmTag } from './terminal.js';
import {
  harnessLayout, T7, L7, ACT7, DOC7, harnessBox, toolPlace, shell, exampleNote, marker as markerFn, lookLine, chipGo,
  mcpServer, githubBoard, serverWire, harnessPlug, mcpLog, llmNotes73, mcpCard, summaryDoc, sessionBracket, reportSlot,
  docBar, recordCard, resumeCard,
} from './harness.js';
import { text as textFn } from '../../../src/kit/draw.js';
import { ring as ringFn, ringBox as ringBoxFn } from '../../../src/kit/cue.js';
import { withAlpha, textBox } from '../../../src/stage/alpha.js';

const lay = (env) => harnessLayout(env.v.G).L;

// ——— any clip ———————————————————————————————————————————————————————————————————————————————————

// kit's text(): { s, x, y, o (text()'s options but alpha) }
export function text(ctx, p, a) {
  const w = textFn(ctx, p.s, p.x, p.y, { ...p.o, alpha: a });
  return textBox(p.s, p.x, p.y, p.o ?? {}, w);
}

// parts.js's tag(): { x, y, s, o }
export function tag(ctx, p, a) {
  const w = tagFn(ctx, p.x, p.y, p.s, { ...p.o, alpha: a });
  const x = p.o?.align === 'right' ? p.x - w : p.o?.align === 'center' ? p.x - w / 2 : p.x;
  return { x, y: p.y, w, h: p.o?.h ?? 32 };
}

// kit's ringBox() round a target (a box, boxes, or a node: paint.js): { b, level, color, pad }
export function ringBox(ctx, p, a, env) {
  const b = env.box(p.b);
  ringBoxFn(ctx, b, p.level * a, p.color ?? C.accent, p.pad);
  return Array.isArray(b) ? null : b;
}

// kit's ring(): { x, y, w, h, level, color, r }
export function ring(ctx, p, a) {
  ringFn(ctx, p.x, p.y, p.w, p.h, p.level * a, p.color ?? C.accent, p.r);
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

// harness.js's highlighter under text already drawn: { b } (a box or a node); a is how strongly
export function marker(ctx, p, a, env) {
  const b = env.box(p.b);
  markerFn(ctx, b, a);
  return b;
}

// ——— the document (lib/rig.js, lib/terminal.js) ——————————————————————————————————————————————————

// a role mark: { x, y, role } (its writer's edge, rig.js's WRITER)
export function mark(ctx, p, a) {
  const w = roleMark(ctx, p.x, p.y, ROLE[p.role], { edge: WRITER[p.role], alpha: a });
  return { x: p.x, y: p.y, w, h: MARK_H };
}

// a mark the harness writes, on its way from its box: { T (default T7), E ({ x, y }), p, role, dy }
export function flyingMark(ctx, p) {
  flyMark(ctx, p.T ?? T7, p.E, p.p, ROLE[p.role], { edge: WRITER[p.role], dy: p.dy });
}

// a laid-out entry: { E, o (docEntry's options) }
export function entry(ctx, p, a) {
  docEntry(ctx, p.E, a, p.o);
  return { x: p.E.tx, y: p.E.y, w: p.E.w, h: p.E.h };
}

// one row of the definitions: { d, y, p }
export function def(ctx, p, a) {
  withAlpha(ctx, a, () => drawDef(ctx, p.d, p.y, p.p));
}

// a call as far as it is written: { c, o ({ bandA, open, n, end }) }
export function call(ctx, p, a) {
  withAlpha(ctx, a, () => drawCall(ctx, p.c, p.o));
  return p.c.band;
}

// a token on its way: { x, y, w, s }
export function token(ctx, p, a) {
  tokenFn(ctx, p.x, p.y, p.w, p.s, a);
}

// the harness hands the document over: { L (default L7), p, bottom }
export function sweepDoc(ctx, p) {
  sweep(ctx, p.L ?? L7, p.p, p.bottom);
}

// the document on its way along the read channel: { p }
export function sendDoc(ctx, p) {
  send(ctx, L7.read, p.p, '', 'doc');
}

// ——— chapter 7's picture (lib/harness.js) —————————————————————————————————————————————————————————

export function screen(ctx, p, a) {
  chatScreen(ctx, T7.SCREEN, a);
  return T7.SCREEN;
}

// { b (laid out by screenBubbles) }
export function bubble(ctx, p, a) {
  chatBubble(ctx, p.b, { alpha: a });
  return { x: p.b.x, y: p.b.y, w: p.b.L.w, h: p.b.L.h };
}

// the screen and the harness: { talk, back, talkHot, backHot }
export function links(ctx, p, a) {
  withAlpha(ctx, a, () => screenLinks(ctx, T7, p));
}

// the harness's frame with its document's paper: { docH (the paper's height, when it is not the layout's), L (a
// layout of its own, instead of the vars') }
export function frame(ctx, p, a, env) {
  const L = p.L ?? lay(env);
  appFrame(ctx, p.docH === undefined ? L : { ...L, doc: { ...DOC7, h: p.docH } }, a, { name: '' });
  return L.app;
}

// { glow, L }
export function llm(ctx, p, a, env) {
  const L = p.L ?? lay(env);
  llmBlock(ctx, L, a, { glow: p.glow });
  return L.llm;
}

// one of the four channels: { c ('read' | 'write' | 'call' | 'back'), hot, labelAlpha, L }
export function chan(ctx, p, a, env) {
  withAlpha(ctx, a, () => channel(ctx, (p.L ?? lay(env))[p.c], 1, p.labelAlpha === undefined ? { hot: p.hot } : { labelAlpha: p.labelAlpha, hot: p.hot }));
}

// the harness's box: { glow, names, B (a box of its own, instead of ACT7) }
export function harness(ctx, p, a) {
  const B = p.B ?? ACT7;
  harnessBox(ctx, B, a, { glow: p.glow, names: p.names });
  return B;
}

// its loop, left of it: { color }
export function loop(ctx, p, a) {
  const LP = T7.LOOP;
  loopIcon(ctx, LP.x, LP.y, LP.r, a, p.color ? { p: 1, color: p.color } : { p: 1 });
  return { x: LP.x - LP.r, y: LP.y - LP.r, w: LP.r * 2, h: LP.r * 2 };
}

// the tool's place with the shell and the GitHub MCP server: { lines, term (the shell's box), srv (the
// server's), plugColor }
export function tools(ctx, p, a, env) {
  const L = lay(env);
  toolPlace(ctx, L, a, {
    draw: (cx) => {
      shell(cx, env.t, 1, p.lines, { trim: true, box: p.term });
      if (p.plugColor) mcpServer(cx, p.srv, 1, { plugColor: p.plugColor });
      else mcpServer(cx, p.srv, 1);
    },
  });
  return L.tool;
}

// GitHub in the net beyond: { box, narrow, scroll, found }
export function github(ctx, p, a) {
  githubBoard(ctx, p.box, a, { narrow: p.narrow, scroll: p.scroll, found: p.found });
  return p.box;
}

// the server's line down to the API: { srv, x }
export function wire(ctx, p, a) {
  serverWire(ctx, p.srv, p.x, a, 1);
}

// the harness's socket: { color }
export function plug(ctx, p, a) {
  if (p.color) harnessPlug(ctx, a, p.color);
  else harnessPlug(ctx, a);
}

// the lane's log of the MCP exchange: { rows }
export function log(ctx, p, a) {
  return mcpLog(ctx, { a, rows: p.rows });
}

// under the LLM, as 7-3 leaves it: { rows ([a, a, a]) }
export function notes(ctx, p, a) {
  llmNotes73(ctx, a === 1 ? p.rows : p.rows.map((r) => r * a));
}

// MCP's card above the LLM: mcpCard()'s options but a
export function mcp(ctx, p, a) {
  return mcpCard(ctx, { ...p, a });
}

// the 例 under the frame
export function exMark(ctx, p, a) {
  exampleNote(ctx, L7, '', 0, a);
}

// the harness sees where the call ends: { m (the end mark, scrolled), p }
export function look(ctx, p, a) {
  lookLine(ctx, DOC7, ACT7, p.m, p.p, a);
}

// the harness stops the writing
export function halt(ctx, p, a) {
  haltFn(ctx, a);
}

// a command or what comes back, on its way: { p, pts, s, kind, fade (what is left of one that waits) }
export function chip(ctx, p) {
  chipGo(ctx, p.p, p.pts, p.s, p.kind, p.fade ?? null);
}

// a tag under the LLM: { y, s }
export function llmNote(ctx, p, a) {
  llmTag(ctx, p.y, p.s, a);
}

// ——— 7-4's: the document as a summary, the session, the bar, the record ————————————————————————————————————

// { ents, M, ghost, alpha ([…] per entry), prog ([…]) }
export function summary(ctx, p) {
  summaryDoc(ctx, p.ents, p.M, { ...(p.ghost ? { ghost: true } : {}), alpha: p.alpha && ((k) => p.alpha[k]), prog: p.prog && ((k) => p.prog[k]) });
}

// { s (prepare74's), p, tag, tail }
export function bracket(ctx, p) {
  return sessionBracket(ctx, p.s, { p: p.p, tag: p.tag, tail: p.tail });
}

// { s }
export function slot(ctx, p, a) {
  reportSlot(ctx, p.s, a);
}

// docBar()'s options but a
export function bar(ctx, p, a) {
  return docBar(ctx, { ...p, a });
}

// recordCard()'s options but a, lit as a list per row
export function record(ctx, p, a) {
  return recordCard(ctx, { ...p, a, lit: p.lit && ((k) => p.lit[k]) });
}

// resumeCard()'s options but a
export function resume(ctx, p, a) {
  const chips = resumeCard(ctx, { ...p, a });
  return { chips };
}

export { markWidth };
