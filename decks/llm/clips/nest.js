// 7-8: what has been built, undone from the outside in. The chapter's picture (7-7's last) comes apart into three
// rings, an image of the structure this video has built — not a classification that every agent fits. The outer
// ring is the AI agent: the harness runs the tools and has the LLM write on, again and again (the loop goes round
// the band; the tools — the shell, the MCP server, a subagent — sit on it). Inside it, the chatbot that chapter 4
// built: the conversation put into one document for the LLM to read, the assistant's turn left for it to write
// (4-2's conversation). At the centre, the autoregressive LLM: it predicts the next token, one at a time, just
// past what is written — the tokens come out of the core into the document. ずんだもん sums it up: everything so
// far is built on an LLM that predicts the next token. The rings take 1-4's parts of the route (the LLM's
// workings, 2–4; the agent, 5–7), both done; the next part (what is talked about now, 8–11) begins with 8 章.
//
// The clip joins 7-7 (spec §6.10): its first frame is lib/harness.js final77, drawn here part by part in the same
// order (the first branch of draw) so that the bridge can clear the cards, the rules, the dialog, GitHub and the
// fence. The rings' parts live in this file: nothing joins from 7-8, and lib/harness.js is left as it was.
// In sentence a the rest moves into the rings: the frame and the tool's place give way to the outer band (the
// harness's box and its loop onto the band, the shell and the MCP server shrink into chips), the screen and the
// document into the inner band, and the LLM's block rounds into the core. The tokens are o200k_base's (4-2's reply); the conversation and
// the tools on the band are examples.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import { slot } from '../lib/odds.js';
import { chatScreen, chatBubble, screenLinks, llmBlock, appFrame, channel, loopIcon, roleMark, ROLE, TOKEN, markWidth } from '../lib/rig.js';
import { check } from '../lib/terminal.js';
import {
  T7, L7, ACT7, DOC7, DOC7_SHORT, NAME, TERM7, TOOL7, SERVER7, SCREEN7, API7, NET7, harnessBox, toolPlace, shell,
  exampleNote, mcpServer, githubBoard, serverWire, fence, prepare77, doc77, terminalLines77, filesList77,
  injectCard77, rulesCard77, noticeCard77, sandboxCard77, confirmDialog77, commentDone77, NOTE77,
} from '../lib/harness.js';
import { text, measure, rr, circle, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outCubic, outBack } from '../../../src/kit/ease.js';
import { focus, ringBox } from '../../../src/kit/cue.js';

// ——— the rings (an image of the structure) ————————————————————————————————————————————————
const RC = { x: 470, y: 440 };
const R0 = 395; // the agent
const R1 = 262; // the chatbot
const R2 = 106; // the autoregressive LLM
const RM = (R0 + R1) / 2; // the middle of the outer band
const DEG = Math.PI / 180;
const polar = (r, deg) => ({ x: RC.x + r * Math.cos(deg * DEG), y: RC.y + r * Math.sin(deg * DEG) });
const FILL_OUT = C.panel;
const FILL_IN = '#f9f7f1';

// on the outer band: the harness's box (7-7's, scaled), its loop, the tools
const HB = { x: RC.x, y: RC.y - RM, s: 0.6 };
const LOOP_REST = [140, 222]; // the loop's arc at rest, in degrees (clockwise from the right)
const TOOLS = [['シェル', -35], ['MCP サーバー', 0], ['サブエージェント', 40]];
const TOOL_TAG = { font: F.jp(700, 14), h: 28, padX: 10 };
// in the inner band: the screen (right of the core) and the document (above it)
const MS = { x: RC.x + 120, y: RC.y - 60, w: 128, h: 120 };
const MD = { x: RC.x - 110, y: RC.y - 230, w: 220, h: 107 };
const VW = 300; // the document is drawn at VW wide and scaled to MD
const K = MD.w / VW;
const CORE = { x: RC.x - R2, y: RC.y - R2, w: R2 * 2, h: R2 * 2 };

// 4-2's conversation, and its reply as o200k_base cuts it (the first tokens)
const CONV = [['user', 'おすすめの本を教えて'], ['assistant', null], ['user', '推理小説がいいな']];
const REPLY = ['それ', 'なら', '、', 'まず', '古'];
const VFONT = F.jp(500, 17);
const VROW = { x: 8, top: 8, step: 34 };
const SLOT = { w: 26, h: 24 };

// the right column: the figure's name, a row per ring, what comes next
const RX = 920;
const ROW_Y = [150, 315, 480];
const ROWS = [
  { name: 'AI エージェント', lines: ['ハーネスが、ツールを動かしながら、', 'LLM に、くり返し続きを書かせる'], band: 0 },
  { name: 'チャットボット', lines: ['会話を一本の文書にまとめ、', 'アシスタントの発言を書かせる'], band: 1 },
  { name: '自己回帰型 LLM', lines: ['書かれた文書のすぐ先の、', '次のトークンを一つずつ予測する'], band: 2 },
];
const NEXT = { label: 682, pill: 696, tag: 746 };
const NOTE78 = '会話の文と、輪の上のツールは説明のための例';
// 1-4's parts of the route, on the rings
const PARTS = [
  ['2〜4 章　LLM のしくみ', R1],
  ['5〜7 章　エージェント', R0],
];
const PILL = { font: F.jp(700, 19), h: 34, padX: 14 };
const PART_TAG = { font: F.jp(700, 15), h: 30, padX: 12 };

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
const lerpBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
const mid = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const TOK_FLY = 0.42;

export default clip({
  id: 'nest',
  title: '次の一語の上に',
  kicker: 'まとめ',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 1.0, // 7-7's cards, rules, dialog, GitHub and fence clear
  script: [
    { id: 'a', tail: 1.4, rest: 'short', text: 'ここで、{built}組み立ててきたものを、\n外側から順に、{unravel}ほどいてみましょう。' },
    { id: 'b', rest: 'short', text: '{fig}この図の{outer}いちばん外側は、{agent}AI エージェントよ。' },
    { id: 'c', tail: 0.8, text: '{harn}ハーネスが、{tools}ツールを動かしながら、\n{llm3}LLM に、{loop}[くり返し続きを|くり返し、続きを]書かせているわ。' },
    { id: 'd', rest: 'short', text: '{inner}その内側にあるのは、{ch4}4 章で組み立てた、\n{bot}チャットボットの仕組みよ。' },
    { id: 'e', tail: 0.5, text: '{conv}会話を、{doc5}LLM に読ませる一本の文書にまとめて、\n{asst}アシスタントの発言を書かせる仕組みだったわね。' },
    { id: 'f', still: true, tail: 0.4, text: '{core}中心にあるのは、{ar}自己回帰型 LLM。\n\n{seen}書かれた文書のすぐ先の、{tok}次のトークンを、\n{one}一つずつ予測していくわ。' },
    { id: 'g', by: 'zunda', text: '{all}ここまでの仕組みは、ぜんぶ、\n{pred}次のトークンを予測する LLM の{base}上に、組み立ててきたのだ！' },
    { id: 'h', still: true, tail: 0.4, text: 'ええ。ここまでで、{llm8}LLM の仕組みと、\n{agent8}その上にエージェントを組み立てる話は、{done}ひととおりよ。' },
    { id: 'i', tail: 0.6, text: '{next9}次の章からは、いま話題になっていることを見ていくわ。\n\n{first}まずは、長い文書を読ませると何が起きるか、からよ。' },
  ],

  prepare(ctx) {
    const s = prepare77(ctx);
    // the document's rows, in the document's own (unscaled) units
    const rows = [...CONV, ['assistant', 'reply']].map(([role, str], k) => {
      const y = VROW.top + k * VROW.step;
      const mw = markWidth(ctx, ROLE[role].name);
      return { role, s: str, y, mw, tx: VROW.x + mw + 8 };
    });
    // where each token of the reply lands (its left edge), and where the hole stands after n of them
    const R = rows[3];
    let x = R.tx;
    const toks = REPLY.map((str) => {
      const w = measure(ctx, VFONT, str);
      const out = { s: str, x, w };
      x += w;
      return out;
    });
    const holeX = (n) => (n <= 0 ? R.tx : toks[n - 1].x + toks[n - 1].w) + 3;
    if (holeX(REPLY.length) + SLOT.w > VW - 4) throw new Error(`nest: the reply's hole does not fit (${holeX(REPLY.length) + SLOT.w})`);
    const vh = R.y + 28 + 8;
    if (vh * K > MD.h + 0.5) throw new Error(`nest: the document is ${vh * K} tall`);
    // the tool chips on the outer band
    const chips = TOOLS.map(([str, deg]) => {
      const w = measure(ctx, TOOL_TAG.font, str) + TOOL_TAG.padX * 2;
      const c = polar(RM, deg);
      const b = { x: c.x - w / 2, y: c.y - TOOL_TAG.h / 2, w, h: TOOL_TAG.h };
      // inside the band, corners and all
      [[b.x, b.y], [b.x + w, b.y], [b.x, b.y + b.h], [b.x + w, b.y + b.h]].forEach(([px, py]) => {
        const d = Math.hypot(px - RC.x, py - RC.y);
        if (d < R1 + 2 || d > R0 - 2) throw new Error(`nest: the chip ${str} leaves the outer band (${d.toFixed(1)})`);
      });
      return { s: str, deg, ...b };
    });
    return { ...s, rows, toks, holeX, chips };
  },

  draw(ctx, t, s, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;
    const head = at('a');

    // ——— the bridge: 7-7's cards, rules, dialog, GitHub and fence clear
    const clear = inOutCubic(seg(t, 0, head * 0.7));
    const keep = 1 - clear;
    // ——— a: the picture comes apart into the rings, from the outside in
    const u0 = at('unravel') - lead;
    const pO = inOutCubic(seg(t, u0, u0 + 1.4));
    const pI = inOutCubic(seg(t, u0 + 0.3, u0 + 1.7));
    const pC = inOutCubic(seg(t, u0 + 0.6, u0 + 2.0));
    const [builtLit] = lit(['built'], at('unravel') - 0.1);

    // ——— where the light is (what the voice points at)
    const [, , agentLit] = lit(['fig', 'outer', 'agent'], at('b.end'));
    const [harnLit, toolsLit, llm3Lit] = lit(['harn', 'tools', 'llm3'], at('loop'));
    const [, ch4Lit, botLit] = lit(['inner', 'ch4', 'bot'], at('d.end'));
    const [convLit, doc5Lit] = lit(['conv', 'doc5'], at('asst'));
    const [, , seenLit] = lit(['core', 'ar', 'seen'], at('tok'));
    const [allLit, predLit] = lit(['all', 'pred'], at('base'));
    const [llm8Lit, agent8Lit] = lit(['llm8', 'agent8'], at('done'));
    // the bands in focus: the others dim
    const fO = span(t, at('outer') - lead, at('c.done'), cue.rise, cue.fall);
    const fI = span(t, at('inner') - lead, at('e.done'), cue.rise, cue.fall);
    const fC = span(t, at('core') - lead, at('f.end') - 0.1, cue.rise, cue.fall); // let go before the still
    const f8I = span(t, at('llm8') - lead, at('agent8') - lead, cue.rise, cue.fall);
    const f8O = span(t, at('agent8') - lead, at('h.end') - 0.1, cue.rise, cue.fall);
    const dimTo = (others) => lerp(1, cue.dim, clamp(others));
    const aOuter = dimTo(Math.max(fI, fC, f8I));
    const aScreen = dimTo(Math.max(fO, fC, f8O));
    const aDoc = dimTo(Math.max(fO, f8O));
    const aCore = dimTo(f8O);

    // ——— the loop goes round the band (c), lighting what it passes
    const l0 = at('loop') - lead;
    const l1 = at('c.done');
    const turns = 2;
    const rot = turns * 360 * inOutCubic(seg(t, l0, l1));
    const headDeg = LOOP_REST[1] + rot;
    const passing = (deg) => {
      if (t < l0 || t > l1 + 0.3) return 0;
      const d = Math.abs((((headDeg - deg) % 360) + 540) % 360 - 180);
      return clamp(1 - d / 22);
    };

    // ——— the tokens: e writes the first; f the next, slowly, then one at a time
    const tokAt = [at('asst') + 0.55, at('tok') - 0.05, at('one') - 0.1, at('one') + 0.45, at('one') + 1.0];
    const tokDur = [TOK_FLY, 0.75, TOK_FLY, TOK_FLY, TOK_FLY];
    const landed = (k) => t >= tokAt[k] + tokDur[k];
    const nTok = REPLY.reduce((n, _, k) => (landed(k) ? k + 1 : n), 0);
    const readP = seg(t, at('doc5') - lead, at('doc5') - lead + 0.8);
    const coreGlow = Math.max(
      span(t, at('doc5') - lead + 0.6, at('e.done'), 0.25, 0.4),
      span(t, at('tok') - 0.4, at('f.end') - 0.4, 0.25, 0.4),
      llm3Lit,
      passing(270) * 0.9,
    );

    // ————————————————————————————————————————————————————————————————————————————————————————
    // 7-7's picture, as it ends (final77), with what the bridge clears
    const pre = pO <= 0;
    if (pre) {
      chatScreen(ctx, T7.SCREEN, 1);
      chatBubble(ctx, s.BuUp, { alpha: 1 });
      withAlpha(ctx, keep, () => {
        confirmDialog77(ctx, s, { a: 1, body: 1, pressed: 1, tap: 0 });
        check(ctx, s.BuUp.x - 14, s.BuUp.y + s.BuUp.L.h / 2, 10, 1);
      });
      screenLinks(ctx, T7, { talk: 1, back: 1, talkHot: false, backHot: false });
      appFrame(ctx, { ...L7, doc: { ...DOC7, h: DOC7_SHORT.h } }, 1, { name: '' });
      llmBlock(ctx, L7, 1, { glow: 0 });
      channel(ctx, L7.read, 1, { hot: false });
      channel(ctx, L7.write, 1, { hot: false });
      channel(ctx, L7.call, 1, { labelAlpha: 1, hot: false });
      channel(ctx, L7.back, 1, { labelAlpha: 1, hot: false });
      oldDoc(ctx, s);
      withAlpha(ctx, keep, () => rulesCard77(ctx, { a: 1, head: 1, tiers: [1, 1, 1], rows: [[1, 1, 1], [1], [1]], ok: [[0, 1, 1], [1], [0]], ask: 1 }));
      harnessBox(ctx, ACT7, 1, { glow: 0, names: [['アプリ', 0, 26], [NAME, 1, 0]] });
      smallLoop(ctx, 1);
      toolPlace(ctx, L7, 1, {
        draw: (cx) => {
          shell(cx, t, 1, terminalLines77(() => -100), { trim: true });
          mcpServer(cx, SERVER7, 1);
          withAlpha(cx, keep, () => filesList77(cx, { a: 1 }));
        },
      });
      withAlpha(ctx, keep, () => {
        fence(ctx, TERM7, 1, 'サンドボックス');
        githubBoard(ctx, NET7, 1, { narrow: 0, scroll: 1, found: 0 });
        commentDone77(ctx, NET7, 1);
        serverWire(ctx, SERVER7, API7.x, 1, 1);
        injectCard77(ctx, { a: 1, name: 1, note: 1, rows: [1, 1, 1], caveat: 1 });
        noticeCard77(ctx, { a: 1 });
        sandboxCard77(ctx, { a: 1, name: 1, rows: [1, 1], note: 1, source: 1 });
      });
      exampleNote(ctx, L7, NOTE77, keep, keep);
      // a: what has been built
      ringBox(ctx, [L7.llm, L7.app, SCREEN7, TOOL7], builtLit, C.accent, 4);
      return;
    }

    // ————————————————————————————————————————————————————————————————————————————————————————
    // a →: the frame, the channels and the tool's place give way; the rings come in, outside first
    const gone = 1 - seg(pO, 0, 0.55);
    withAlpha(ctx, gone, () => {
      screenLinks(ctx, T7, { talk: 1, back: 1, talkHot: false, backHot: false });
      appFrame(ctx, { ...L7, doc: { ...DOC7, h: DOC7_SHORT.h } }, 1, { name: '', docAlpha: 0 });
      channel(ctx, L7.read, 1, { hot: false });
      channel(ctx, L7.write, 1, { hot: false });
      channel(ctx, L7.call, 1, { labelAlpha: 1, hot: false });
      channel(ctx, L7.back, 1, { labelAlpha: 1, hot: false });
      toolPlace(ctx, L7, 1, { draw: () => {} });
    });
    ringFill(ctx, R0, R1, pO, FILL_OUT);
    ringFill(ctx, R1, 0, pI, FILL_IN);

    // s7, s8: the circles light (the whole, the inner disc, the outer ring), and the ripple from the core outwards
    const ripple = seg(t, at('base') - lead, at('base') - lead + 1.1);
    const at8 = (r) => (ripple > 0 && ripple < 1 ? clamp(1 - Math.abs(lerp(R2, R0 + 20, outCubic(ripple)) - r) / 70) : 0);
    circleLight(ctx, R0, Math.max(allLit, agent8Lit, at8(R0)));
    circleLight(ctx, R1, Math.max(llm8Lit, at8(R1)));
    if (ripple > 0 && ripple < 1) {
      ctx.save();
      ctx.globalAlpha *= (1 - ripple) * 0.8;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 5;
      circle(ctx, RC.x, RC.y, lerp(R2, R0 + 20, outCubic(ripple)));
      ctx.stroke();
      ctx.restore();
    }

    // ——— the outer band: the loop, the harness's box, the tools
    withAlpha(ctx, aOuter, () => {
      bandLoop(ctx, seg(pO, 0.55, 1), rot);
      // the harness's box moves onto the band, smaller
      const src = mid(ACT7);
      const sc = lerp(1, HB.s, pO);
      ctx.save();
      ctx.translate(lerp(src.x, HB.x, pO), lerp(src.y, HB.y, pO));
      ctx.scale(sc, sc);
      ctx.translate(-src.x, -src.y);
      harnessBox(ctx, ACT7, 1, { glow: passing(270), names: [['アプリ', 0, 26], [NAME, 1, 0]] });
      smallLoop(ctx, 1 - seg(pO, 0, 0.5));
      ctx.restore();
      ringBox(ctx, hbBox(), harnLit, C.accent, 6);
      // the shell and the MCP server shrink into chips; a subagent joins them
      morph(ctx, TERM7, s.chips[0], pO, (cx) => shell(cx, t, 1, terminalLines77(() => -100), { trim: true }));
      morph(ctx, SERVER7, s.chips[1], pO, (cx) => mcpServer(cx, SERVER7, 1));
      const toolHot = (k) => Math.max(toolsLit * seg(t, at('tools') - lead + k * 0.18, at('tools') - lead + k * 0.18 + 0.2), passing(s.chips[k].deg));
      s.chips.forEach((c, k) => {
        const a = k === 2 ? tw(t, u0 + 0.9, 0.5, (p) => outBack(p, 1.6)) : seg(pO, 0.55, 1);
        toolChip(ctx, c, a, toolHot(k));
      });
    });

    // ——— the inner band: the screen and the document
    // the screen: 7-7's comes in small
    const SB = lerpBox(SCREEN7, MS, pI);
    const oldA = 1 - seg(pI, 0.1, 0.55);
    withAlpha(ctx, aScreen, () => {
      panel(ctx, SB, lerp(20, 12, pI), C.rule);
      if (oldA > 0.001) {
        toBox(ctx, SCREEN7, SB, () => {
          text(ctx, 'チャットの画面', SCREEN7.x + 20, SCREEN7.y + 40, { font: F.jp(700, 20), color: C.ink2, alpha: oldA });
          chatBubble(ctx, s.BuUp, { alpha: oldA });
        });
      }
      toBox(ctx, MS, SB, () => miniScreen(ctx, seg(pI, 0.45, 0.85), { reply: nTok / REPLY.length }));
      ringBox(ctx, MS, Math.max(ch4Lit, convLit), C.accent, 4);
    });
    // the document: 7-7's paper comes in small; 4-2's conversation is written into it in e
    const DB = lerpBox(DOC7_SHORT, MD, pI);
    withAlpha(ctx, aDoc, () => {
      panel(ctx, DB, lerp(14, 10, pI), C.rule, lerp(0, 1.5, pI));
      if (oldA > 0.001) toBox(ctx, DOC7_SHORT, DB, () => withAlpha(ctx, oldA, () => oldDoc(ctx, s)));
      const rowT = (k) => at('conv') - lead + 0.35 + k * 0.3;
      toBox(ctx, MD, DB, () => miniDoc(ctx, s, t, {
        bars: seg(pI, 0.45, 0.85),
        rows: [0, 1, 2].map((k) => seg(t, rowT(k), rowT(k) + 0.35)),
        asst: tw(t, at('asst') - lead, 0.35),
        n: nTok,
        hole: tw(t, at('seen') - lead, 0.3),
        holeLit: Math.max(seenLit, span(t, at('tok') - 0.3, at('f.end') - 0.35)),
        read: readP,
      }));
      // the conversation goes into the document: from the screen's bubbles to the rows
      [0, 1, 2].forEach((k) => flyBubble(ctx, k, seg(t, rowT(k) - 0.45, rowT(k) + 0.05), CONV[k][0]));
      ringBox(ctx, MD, Math.max(ch4Lit, doc5Lit, seenLit), C.accent, 4);
    });

    // ——— the core: the LLM's block rounds into it
    withAlpha(ctx, aCore, () => {
      coreBlock(ctx, pC, { glow: coreGlow, name: pop('ar'), hot: Math.max(predLit, at8(R2)) });
    });
    // the tokens it writes, out of the core into the document
    REPLY.forEach((_, k) => token78(ctx, s, k, seg(t, tokAt[k], tokAt[k] + tokDur[k]), k === 1));

    // ——— the names: on the circles, in the core (above), and in the column
    const nameA = [pop('agent'), pop('bot')];
    withAlpha(ctx, aOuter, () => pillOn(ctx, RC.y - R0, 'AI エージェント', nameA[0], agentLit));
    withAlpha(ctx, Math.min(aScreen, aDoc), () => pillOn(ctx, RC.y - R1, 'チャットボット', nameA[1], botLit));
    // 8: 1-4's parts of the route
    const doneA = tw(t, at('done') - lead, 0.4);
    PARTS.forEach(([str, r], k) => {
      const a = pop(k === 0 ? 'llm8' : 'agent8');
      partPill(ctx, RC.y + r, str, a, doneA);
    });

    // ——— the right column
    header(ctx, pop('fig'));
    const rowName = [pop('agent'), pop('bot'), pop('ar')];
    const rowText = [pop('harn'), pop('conv'), pop('seen')];
    const rowDim = [aOuter, Math.min(aScreen, aDoc), aCore];
    ROWS.forEach((r, k) => withAlpha(ctx, rowDim[k], () => row(ctx, k, rowName[k], rowText[k])));
    // 9: what comes next
    nextBlock(ctx, pop('next9'), pop('first'));

    // ——— the example's note (7-7's gives way)
    note78(ctx, seg(pO, 0.6, 1));
  },
});

// ——— helpers ————————————————————————————————————————————————————————————————————————————————

// Draw fn (laid out in box `from`) into box `to`: the screen's and the document's contents ride with their boxes.
function toBox(ctx, from, to, fn) {
  ctx.save();
  ctx.translate(to.x, to.y);
  ctx.scale(to.w / from.w, to.h / from.h);
  ctx.translate(-from.x, -from.y);
  fn();
  ctx.restore();
}

function withAlpha(ctx, a, fn) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  fn();
  ctx.restore();
}

// 7-7's document as it ends: scrolled to the comment on #128, on the shortened paper.
function oldDoc(ctx, s) {
  const rounds = s.rounds.map((r) => ({ bandA: 1, open: true, n: r.c.toks.length, end: true, mark: true, chars: 1 }));
  doc77(ctx, s, { sy: s.bottom[s.bottom.length - 1] - (DOC7.y + DOC7_SHORT.h - 12), docH: DOC7_SHORT.h, rounds });
}

// 7-7's small loop by the harness's box, with its word.
function smallLoop(ctx, a) {
  if (a <= 0.001) return;
  const LP = T7.LOOP;
  loopIcon(ctx, LP.x, LP.y, LP.r, a, { p: 1 });
  text(ctx, 'くり返す', LP.x - LP.r - 14, LP.y + 6, { font: F.jp(700, 16), color: C.purple, align: 'right', alpha: a });
}

// The harness's box as it sits on the band.
function hbBox() {
  const w = ACT7.w * HB.s;
  const h = ACT7.h * HB.s;
  return { x: HB.x - w / 2, y: HB.y - h / 2, w, h };
}

// A white panel (the screen, the document), its box between two places.
function panel(ctx, B, r, stroke, lw = 2) {
  ctx.save();
  rr(ctx, B.x, B.y, B.w, B.h, r);
  ctx.fillStyle = '#fff';
  ctx.fill();
  if (lw > 0.01) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.restore();
}

// One ring: its fill (the band between r and rIn, or the whole disc when rIn is 0) and its circle, drawn round
// from the top as p runs 0 → 1.
function ringFill(ctx, r, rIn, p, fill) {
  if (p <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(p * 1.4);
  ctx.beginPath();
  ctx.arc(RC.x, RC.y, r, 0, Math.PI * 2);
  if (rIn > 0) {
    ctx.moveTo(RC.x + rIn, RC.y);
    ctx.arc(RC.x, RC.y, rIn, 0, Math.PI * 2, true);
  }
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(RC.x, RC.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
  ctx.stroke();
  ctx.restore();
}

// A circle the voice points at: drawn over in the signal colour.
function circleLight(ctx, r, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 5;
  circle(ctx, RC.x, RC.y, r);
  ctx.stroke();
  ctx.restore();
}

// The harness's loop on the outer band: a purple arc with its head, at rest on the left, turned by rot degrees.
function bandLoop(ctx, a, rot) {
  if (a <= 0.001) return;
  const a0 = (LOOP_REST[0] + rot) * DEG;
  const a1 = (LOOP_REST[1] + rot) * DEG;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.strokeStyle = ctx.fillStyle = C.purple;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(RC.x, RC.y, RM, a0, a1 - 0.06);
  ctx.stroke();
  arrowHead(ctx, RC.x + Math.cos(a1) * RM, RC.y + Math.sin(a1) * RM, a1 + Math.PI / 2, 22);
  ctx.restore();
}

// A part of 7-7's picture shrinking into a chip on the band: drawn scaled about its centre on the way, and gone by
// the time the chip comes in.
function morph(ctx, src, dst, p, draw) {
  const a = 1 - seg(p, 0.35, 0.75);
  if (a <= 0.001) return;
  const c0 = mid(src);
  const c1 = mid(dst);
  const sc = lerp(1, dst.w / src.w, p);
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(lerp(c0.x, c1.x, p), lerp(c0.y, c1.y, p));
  ctx.scale(sc, sc);
  ctx.translate(-c0.x, -c0.y);
  draw(ctx);
  ctx.restore();
}

function toolChip(ctx, c, a, hot) {
  if (a <= 0.001) return;
  tag(ctx, c.x, c.y, c.s, { ...TOOL_TAG, fill: '#fff', stroke: hot > 0.5 ? C.accent : C.ink2, lw: hot > 0.5 ? 2.5 : 1.5, color: C.ink, r: 8, alpha: clamp(a) });
}

// The chat screen, small: its name and four bubbles (the last is the reply, as long as what has been written).
function miniScreen(ctx, a, o = {}) {
  if (a <= 0.001) return;
  const B = MS;
  text(ctx, 'チャットの画面', B.x + 10, B.y + 19, { font: F.jp(700, 11), color: C.ink2, alpha: a });
  const rows = [['user', 64], ['assistant', 78], ['user', 54], ['assistant', 82 * clamp(o.reply ?? 0)]];
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rows.forEach(([role, w], k) => {
    if (w < 1) return;
    const y = B.y + 30 + k * 22;
    const x = role === 'user' ? B.x + B.w - 10 - w : B.x + 10;
    rr(ctx, x, y, w, 16, 8);
    ctx.fillStyle = role === 'user' ? C.blueSoft : C.panel;
    ctx.fill();
    ctx.fillStyle = role === 'user' ? '#9db0ee' : C.rule;
    ctx.fillRect(x + 8, y + 6.5, Math.max(0, w - 16), 3);
  });
  ctx.restore();
}

// From the screen's bubble k to its row in the document (e: the conversation goes into one document).
function flyBubble(ctx, k, p, role) {
  if (p <= 0 || p >= 1) return;
  const w = [64, 78, 54][k];
  const y0 = MS.y + 30 + k * 22;
  const x0 = role === 'user' ? MS.x + MS.w - 10 - w : MS.x + 10;
  const x1 = MD.x + VROW.x * K;
  const y1 = MD.y + (VROW.top + k * VROW.step) * K;
  const q = inOutCubic(p);
  const x = lerp(x0, x1, q);
  const y = lerp(y0, y1, q) - Math.sin(Math.PI * q) * 70;
  ctx.save();
  ctx.globalAlpha *= clamp(p * 6) * clamp((1 - p) * 6);
  rr(ctx, x, y, lerp(w, 50, q), 16, 8);
  ctx.fillStyle = role === 'user' ? C.blueSoft : C.panel;
  ctx.fill();
  ctx.strokeStyle = role === 'user' ? C.blue : C.ink2;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// The document, small: 4-2's conversation with its marks, then the reply as the LLM writes it, and the hole just
// past what is written. o: { bars (the rows before anything is written), rows ([0–1] ×3), asst, n, hole, holeLit,
// read (0–1: the document handed over) }
function miniDoc(ctx, s, t, o) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(MD.x, MD.y, MD.w, MD.h);
  ctx.clip();
  ctx.translate(MD.x, MD.y);
  ctx.scale(K, K);
  s.rows.forEach((r, k) => {
    const w = k < 3 ? o.rows[k] : o.asst;
    // before: a faint row
    const barA = (o.bars ?? 0) * (1 - clamp(w * 2));
    if (barA > 0.001) {
      ctx.save();
      ctx.globalAlpha *= barA;
      ctx.fillStyle = C.rule;
      rr(ctx, VROW.x, r.y + 9, k === 3 ? 60 : [200, 240, 170][k], 10, 5);
      ctx.fill();
      ctx.restore();
    }
    if (w <= 0.001) return;
    roleMark(ctx, VROW.x, r.y, ROLE[r.role], { alpha: w });
    if (k === 3) return;
    if (r.s) text(ctx, r.s, r.tx, r.y + 20, { font: VFONT, color: C.ink, alpha: w });
    else {
      ctx.save();
      ctx.globalAlpha *= w;
      ctx.fillStyle = C.rule;
      rr(ctx, r.tx, r.y + 9, VW - 12 - r.tx, 10, 5);
      ctx.fill();
      ctx.restore();
    }
  });
  // the reply, as far as it is written
  const R = s.rows[3];
  s.toks.slice(0, o.n).forEach((tk) => text(ctx, tk.s, tk.x, R.y + 20, { font: VFONT, color: C.ink }));
  // the hole just past it
  if ((o.hole ?? 0) > 0.001) {
    slot(ctx, s.holeX(o.n), R.y + 2, SLOT.w, SLOT.h, { alpha: o.hole, lit: o.holeLit ?? 0, blink: Math.floor(t * 2.5) % 2 === 0 });
  }
  ctx.restore();
  // e: the document handed over to the LLM (a band down what is written)
  const p = o.read ?? 0;
  if (p > 0 && p < 1) {
    const bottom = MD.y + (R.y + 28) * K;
    const y = lerp(MD.y + 4, bottom, inOutCubic(Math.min(1, p / 0.8)));
    const fade = 1 - clamp((p - 0.8) / 0.2);
    ctx.save();
    ctx.globalAlpha *= 0.5 * fade;
    ctx.fillStyle = C.accentSoft;
    ctx.fillRect(MD.x + 4, MD.y + 4, MD.w - 8, y - MD.y - 4);
    ctx.globalAlpha = fade;
    ctx.fillStyle = C.accent;
    ctx.fillRect(MD.x + 4, y - 1.5, MD.w - 8, 3);
    ctx.restore();
  }
}

// A token of the reply on its way out of the core into the document (p 0 → 1). big: the one f follows slowly.
function token78(ctx, s, k, p, big) {
  if (p <= 0 || p >= 1) return;
  const tk = s.toks[k];
  const R = s.rows[3];
  const x1 = MD.x + (tk.x + tk.w / 2) * K;
  const y1 = MD.y + (R.y + 14) * K;
  const x0 = RC.x + (x1 - RC.x) * 0.25;
  const y0 = RC.y - 78;
  const q = inOutCubic(p);
  const x = lerp(x0, x1, q);
  const y = lerp(y0, y1, q) - Math.sin(Math.PI * q) * (big ? 26 : 14);
  const sc = lerp(big ? 1.25 : 1, K, q);
  const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
  ctx.save();
  ctx.globalAlpha *= clamp(p * 8) * clamp((1 - p) * 8);
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  rr(ctx, -w / 2 - 2, -TOKEN.h / 2 - 2, w + 4, TOKEN.h + 4, 9);
  ctx.fillStyle = C.paper;
  ctx.fill();
  rr(ctx, -w / 2, -TOKEN.h / 2, w, TOKEN.h, 7);
  ctx.fillStyle = C.ink;
  ctx.fill();
  text(ctx, tk.s, 0, 1, { font: TOKEN.font, color: '#fff', align: 'center', base: 'middle' });
  ctx.restore();
}

// The LLM's block rounding into the core (p 0 → 1). o: { glow, name (自己回帰型, 0–1), hot (a ring round it) }
function coreBlock(ctx, p, o = {}) {
  const B = lerpBox(L7.llm, CORE, p);
  const r = lerp(22, B.w / 2, p);
  ctx.save();
  rr(ctx, B.x, B.y, B.w, B.h, r);
  ctx.fillStyle = C.ink;
  ctx.fill();
  const glow = Math.max(o.glow ?? 0, o.hot ?? 0);
  if (glow > 0.001) {
    ctx.globalAlpha *= clamp(glow);
    rr(ctx, B.x - 8, B.y - 8, B.w + 16, B.h + 16, r + 8);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.restore();
  const name = clamp(o.name ?? 0);
  const cx = B.x + B.w / 2;
  const cy = B.y + B.h / 2;
  text(ctx, 'LLM', cx, cy + 3 + 20 * outCubic(name), { font: F.sans(700, lerp(46, 50, p)), color: C.paper, align: 'center', base: 'middle' });
  text(ctx, '自己回帰型', cx, cy - 30 + 6 * (1 - name), { font: F.jp(700, 21), color: C.paper, align: 'center', base: 'middle', alpha: name });
}

// A name on the top of a circle.
function pillOn(ctx, y, s, a, hot = 0) {
  if (a <= 0.001) return;
  tag(ctx, RC.x, y - PILL.h / 2, s, { ...PILL, fill: '#fff', stroke: hot > 0.5 ? C.accent : C.ink2, lw: hot > 0.5 ? 3 : 2, color: C.ink, align: 'center', alpha: clamp(a) });
}

// 8: a part of 1-4's route, on the bottom of its circle, checked once it is done.
function partPill(ctx, y, s, a, done) {
  if (a <= 0.001) return;
  const w = tag(ctx, RC.x, y - PART_TAG.h / 2, s, { ...PART_TAG, fill: C.ink2, color: '#fff', align: 'center', alpha: clamp(a) });
  check(ctx, RC.x + w / 2 + 4, y, 11, clamp(a) * done);
}

// The figure's name, above the column.
function header(ctx, a) {
  if (a <= 0.001) return;
  const w = text(ctx, 'ここまで組み立てた仕組み', RX, 92, { font: F.jp(700, 26), color: C.ink, alpha: a });
  tag(ctx, RX + w + 14, 92 - 23, '構成のイメージ', { font: F.jp(700, 14), h: 28, padX: 10, stroke: C.muted, color: C.muted, alpha: a });
}

// A row of the column: a small ring with its band filled, the name, what it does.
function row(ctx, k, nameA, textA) {
  if (nameA <= 0.001) return;
  const r = ROWS[k];
  const y = ROW_Y[k];
  const cx = RX + 26;
  const cy = y + 26;
  const radii = [25, 17, 7];
  ctx.save();
  ctx.globalAlpha *= clamp(nameA);
  ctx.beginPath();
  ctx.arc(cx, cy, radii[r.band], 0, Math.PI * 2);
  if (r.band < 2) {
    ctx.moveTo(cx + radii[r.band + 1], cy);
    ctx.arc(cx, cy, radii[r.band + 1], 0, Math.PI * 2, true);
  }
  ctx.fillStyle = C.ink2;
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.5;
  radii.forEach((rr0) => {
    circle(ctx, cx, cy, rr0);
    ctx.stroke();
  });
  ctx.restore();
  text(ctx, r.name, RX + 68, y + 37, { font: F.jp(700, 28), color: C.ink, alpha: nameA });
  r.lines.forEach((ln, i) => text(ctx, ln, RX + 68, y + 78 + i * 28, { font: F.jp(500, 19), color: C.ink2, alpha: textA }));
}

// 9: the next part of the route (not begun), and the chapter it starts with.
function nextBlock(ctx, a, chA) {
  if (a <= 0.001) return;
  text(ctx, '次の章から', RX, NEXT.label, { font: F.jp(700, 16), color: C.muted, alpha: a });
  const w = measure(ctx, PART_TAG.font, '8〜11 章　いまの話題') + PART_TAG.padX * 2;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, RX, NEXT.pill, w, PART_TAG.h, PART_TAG.h / 2);
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  text(ctx, '8〜11 章　いまの話題', RX + w / 2, NEXT.pill + PART_TAG.h / 2 + 1, { font: PART_TAG.font, color: C.ink2, align: 'center', base: 'middle', alpha: a });
  const tx = RX + w + 46;
  if (chA > 0.001) {
    ctx.save();
    ctx.globalAlpha *= clamp(chA);
    ctx.strokeStyle = ctx.fillStyle = C.ink2;
    ctx.lineWidth = 2;
    const y = NEXT.pill + PART_TAG.h / 2;
    ctx.beginPath();
    ctx.moveTo(RX + w + 10, y);
    ctx.lineTo(tx - 12, y);
    ctx.stroke();
    arrowHead(ctx, tx - 8, y, 0, 10);
    ctx.restore();
  }
  tag(ctx, tx, NEXT.pill, '8 章　知識を育てる', { font: F.jp(700, 15), h: 30, padX: 11, fill: C.ink, color: C.paper, alpha: tw(chA, 0, 1, (p) => outBack(p, 1.4)) });
}

// The 例 for this picture, under the column.
function note78(ctx, a) {
  if (a <= 0.001) return;
  const y = 820;
  const w = tag(ctx, RX, y, '例', { font: F.jp(700, 17), h: 30, padX: 10, stroke: C.muted, color: C.muted, alpha: a });
  text(ctx, NOTE78, RX + w + 10, y + 21, { font: F.jp(400, 17), color: C.muted, alpha: a });
}
