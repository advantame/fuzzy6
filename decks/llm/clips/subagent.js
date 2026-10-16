// 7-6: handing work to other agents. As the research goes on, the causes narrow to three: the connection settings,
// the change of 10-06, the number of requests that day. Looking into them one by one would pile their results into
// the document again. So the harness is given a tool that calls another agent: when the LLM writes a request into a
// call of it, the harness makes a new document and runs another loop. The agent so called is made to look into it in
// its own document and to send back what it found as a short report; what goes into the first document is mostly the
// report, not the long output on the way. The three can run side by side, as none waits for another's result. An
// agent that takes over part of the work and runs in its own document is called a subagent. ずんだもん: faster and
// cheaper, then? Running them at once can end sooner, but it is not always cheaper: each subagent uses the LLM and
// tools too. Anthropic reported in 2025-06 that, in its internal research evaluation, Claude Opus 4 directing
// subagents scored 90.2% higher than Opus 4 on its own; the same article says systems of several agents use about 15
// times the tokens of a chat. Having read the three reports, the LLM takes the change of 10-06, which lowered how many
// connections the app may hold to the database at once, to be the likely cause.
//
// The layout is chapter 7's (lib/harness.js). The clip joins 7-5 (spec §6.10): its first frame is 7-5's last
// (lib/harness.js final75), and the bridge clears what 7-5 kept above the LLM, its long document and 8 章, and the two
// names in the frame. The tool's place grows down over GitHub's room in d's lead (the GitHub MCP server, the files and
// GitHub step aside; 7-7 brings them back) and holds the three small agents (lib/harness.js subAgent76): a small LLM,
// the loop the harness runs for it, and a document that starts with the harness's instructions and the request —
// not empty (research/harness-jobs-facts 7-6). They run at once and end at different times; nothing says they take a
// third of the time. Each small document's amount stands in its column on the bar's scale, never added to the first
// document's or turned into a cost; the two figures are two cards that compare different things. The reports make
// the change only the likely cause: 7-7 checks it in a test environment. Everything is an example but the figures.
// 7-6 ends on lib/harness.js final76 (7-7's first frame).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import {
  chatScreen, chatBubble, screenLinks, fromTool, flyMark, llmBlock, appFrame, channel, token, TOKEN, onPath,
  sweep, send, roleMark, MARK_H, ROLE, WRITER, loopIcon,
} from '../lib/rig.js';
import { defY, halt } from '../lib/terminal.js';
import {
  T7, L7, ACT7, DOC7, NAME, TERM7, harnessBox, toolPlace, shell, exampleNote, chipGo, mcpServer, SERVER7, API7, NET7,
  githubBoard, serverWire, marker, lookLine, recordCard75, RECORD_ALL75, rulesCard75, rulesSource75, docBar75, longDoc75,
  ch8Tag75, compactionName75, whenCard75, filesList75, NOTE75, BAR74, TOOL7, TOOL76, SUB76, prepare76, doc76, docBox76,
  candCard76, candRow76, CAND_FONT76, CANDS76, agentHead76, subAgent76, RUNS76, TOK76, TOK76_0, terminalLines76, TERM76,
  ghost76, timeline76, factCards76, NOTE76, CONCL_TOKENS76, REPORT_TOK76, RUNS_END76,
} from '../lib/harness.js';
import { text, measure } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, TAU } from '../../../src/kit/ease.js';
import { focus, ringBox, lifted } from '../../../src/kit/cue.js';

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
const lerpBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
const VIS = DOC7.y + DOC7.h - 12; // the lowest the written part may reach before the document scrolls
const TOK_FLY = 0.3;

export default clip({
  id: 'subagent',
  title: '子に任せる',
  kicker: 'サブエージェント',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.8, // what 7-5 kept above the LLM, its long document and 8 章, the names in the frame clear away
  script: [
    { id: 'a', text: '調べを進めると、{cands}原因の候補は、{three}三つにしぼれたわ。' },
    { id: 'b', still: true, text: '{c1}接続の設定、{c2}10 月 6 日の変更、{c3}その日のアクセスの数よ。' },
    { id: 'c', text: '{one}一つずつ調べると、{each}それぞれの結果が、\n{pile}また文書に積もっていくわね。' },
    { id: 'd', lead: 0.8, tail: 0.4, still: true, text: 'そこで、{harn}ハーネスに、{tool}別のエージェントを呼ぶツールを\n{give}持たせましょう。' },
    { id: 'e', lead: 1.0, text: '{llm}LLM が{call}そのツールの呼び出しに{ask}依頼を書くと、\n{harn2}ハーネスは、{newdoc}新しい文書を作って、{loop}別のくり返しを回すわ。' },
    { id: 'f', tail: 0.6, text: '{called}呼ばれたエージェントには、{own}自分の文書で調べて、\nわかったことを{short}短い報告にまとめて{ret}返させましょう。' },
    { id: 'g', still: true, text: '{add}もとの文書に書き足すのは、\n{long}途中の長い出力ではなく、{center}報告が中心よ。' },
    { id: 'h', text: '{three2}三つの調べものは、{wait}互いの結果を待たずに調べられるから、\n{para}並べて同時に進められるわね。' },
    { id: 'i', still: true, text: 'このように、{part}仕事の一部を任されて、{owndoc}自分の文書で動く\nエージェントを、{name}サブエージェントと呼ぶわ。' },
    { id: 'j', by: 'zunda', text: '任せれば、{fast}速くて{cheap}安くなるのだ？' },
    { id: 'k', text: '{early}同時に進めれば、早く終わることはあるわ。\nでも、{cheap2}安くなるとは限らないわね。' },
    { id: 'k2', text: '{each2}それぞれのサブエージェントも、\n{llm2}LLM と{tools}ツールを使って調べるからよ。' },
    { id: 'l', text: 'Anthropic は 2025 年 6 月、{inner}社内の調べものの評価で、\n{opus}[Claude Opus 4|クロードオーパスフォー] にサブエージェントを指示させる仕組みが、\n\n{solo}[Opus 4|オーパスフォー] だけで調べるより、\n{num}90.2% 高い成績だったと報告したわ。' },
    { id: 'm', still: true, text: '同じ記事では、\n{multi}複数のエージェントを使う仕組みは、\n\n{chat}ふつうのチャットの{x15}約 15 倍のトークンを使う、\nとも説明しているわ。' },
    { id: 'n', lead: 0.8, tail: 1.0, text: '{read3}三つの報告を読んだ LLM は、\n{oct6}10 月 6 日に、アプリがデータベースに\n\n{limit}同時につなげる数の上限を下げた変更が、\n{likely}原因らしいと考えたわ。' },
  ],

  prepare(ctx) {
    return prepare76(ctx);
  },

  draw(ctx, t, s, { at, pace }) {
    const { s73 } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;

    // ——— the bridge: what 7-5 kept above the LLM, its long document and 8 章, the names in the frame clear away
    const nar = inOutCubic(seg(t, 0, at('a')));
    const old = 1 - nar;

    // ——— a, b: the three leads, out of the summary into a card above the LLM (it gives way to the figures, l)
    const candOut = tw(t, at('l') - 0.3, 0.4);
    const cardA = tw(t, at('three') - lead, pace.enter) * (1 - candOut);
    const slotA = [0, 1, 2].map((k) => tw(t, at('three') - lead + 0.1 + k * pace.stagger, pace.enter));
    const flyC = [0, 1, 2].map((k) => seg(t, at(`c${k + 1}`) - lead - 0.1, at(`c${k + 1}`) - lead + 0.5));

    // ——— c: one by one, each result would pile up in the document again (dashed: what is not done)
    const g0 = [at('one') - lead, at('each') - lead, at('each') - lead + 0.7];
    const gp = g0.map((g) => seg(t, g, g + 0.7));
    const ghostA = 1 - tw(t, at('d'), 0.4);
    const candHot = g0.map((g) => span(t, g, g + 0.6) * ghostA);

    // ——— d: the tool's place grows down (the server, the files and GitHub step aside); the definition; the room
    const room = inOutCubic(seg(t, at('d'), at('d') + 0.8));
    const away = 1 - room;
    const toolNow = lerpBox(TOOL7, TOOL76, room);
    const shift = seg(t, at('tool') - lead - 0.3, at('tool') - lead + 0.15);
    const defP = [seg(t, at('tool') - lead + 0.1, at('tool') - lead + 0.6), seg(t, at('tool') - lead + 0.5, at('tool') - lead + 0.9)];
    const headA = pop('give');
    const slotRoom = pop('give') * (1 - tw(t, at('newdoc') - lead, 0.4));

    // ——— e: the harness hands the document over; the LLM writes three calls; the harness stops it
    const readE = at('e') + 0.35;
    const w0 = Math.max(at('e.voice') - 0.15, readE + 0.7);
    const wEnd = Math.max(w0 + 2.4, at('harn2') - lead - 0.6);
    const order = s.calls.flatMap((c, k) => [[k, 'open'], ...c.toks.map((_, j) => [k, j]), [k, 'end']]);
    const dt = (wEnd - w0) / (order.length - 1);
    const W = s.calls.map(() => ({ tok: [] }));
    order.forEach(([k, j], i) => {
      const when = w0 + i * dt;
      if (j === 'open') W[k].open = when;
      else if (j === 'end') W[k].end = when;
      else W[k].tok[j] = when;
    });
    const stopAt = W[2].end + TOK_FLY + 0.05;
    const landed = (k, j) => t >= W[k].tok[j] + TOK_FLY;
    // the requests go out, the documents are made, the loops start together
    const askGo = [0, 1, 2].map((k) => seg(t, at('newdoc') - lead - 0.8 + k * 0.18, at('newdoc') - lead - 0.1 + k * 0.18));
    const colA = [0, 1, 2].map((k) => tw(t, at('newdoc') - lead + k * 0.12, pace.enter));
    const askIn = [0, 1, 2].map((k) => tw(t, at('newdoc') - lead + 0.35 + k * 0.12, 0.3));
    const loopA = [0, 1, 2].map((k) => tw(t, at('loop') - lead + k * 0.08, pace.enter));
    const S = at('loop') - lead + 0.35;

    // ——— f: the small agents run at once, and end at different times (RUNS_END76's shares)
    const Fend = at('ret') - lead + 0.15;
    const unit = (Fend - S) / RUNS_END76[2][1];
    const FIN = RUNS_END76.map(([, e]) => S + e * unit);
    const R0 = [0, 1, 2].map((k) => S + 0.25 + 0.1 * k);
    const rounds = [0, 1, 2].map((k) => RUNS76[k] * clamp((t - R0[k]) / (FIN[k] - 0.55 - R0[k])));
    const rep = FIN.map((f) => seg(t, f - 0.5, f - 0.1));
    const done = FIN.map((f) => tw(t, f, 0.3));
    const kidGlow = [0, 1, 2].map((k) => {
      const r = rounds[k];
      const writing = (r > 0 && r < RUNS76[k] && r % 1 < 0.45) || (rep[k] > 0 && rep[k] < 1);
      return writing ? 1 : 0;
    });
    const spin = [0, 1, 2].map((k) => (t > S && t < FIN[k] ? TAU * RUNS76[k] * inOutCubic(clamp((t - S) / (FIN[k] - S))) : 0));
    const tokens = [0, 1, 2].map((k) => TOK76_0 + (TOK76[k] - TOK76_0) * clamp((rounds[k] + 0.2 * rep[k]) / (RUNS76[k] + 0.2)));
    const shellAt = (j) => S + 0.3 + j * ((FIN[0] - S - 0.6) / (TERM76.length - 1));
    // the reports come back; the harness writes them in as the tool's results
    const backP = FIN.map((f) => seg(t, f + 0.05, f + 0.85));
    const resIn = FIN.map((f) => f + 0.85);
    const repLit = FIN.map((f) => span(t, f - 0.1, f + 0.4));

    // ——— n: the harness hands the document over; the LLM writes the likely cause
    const readN = at('n') + 0.1;
    const cMark = Math.max(readN + 0.75, at('oct6') - lead - 0.3);
    const c0 = cMark + 0.45;
    const cEnd = Math.max(c0 + 1.6, at('likely') - lead + 0.5);
    const nC = CONCL_TOKENS76.length;
    const cTokAt = (j) => c0 + (j * (cEnd - c0)) / (nC - 1);
    const upto = s.ctoks.reduce((u, tk, j) => (t >= cTokAt(j) + TOK_FLY ? tk.upto : u), 0);

    // ——— the document scrolls when what comes next would pass its foot
    const need = [
      [at('tool') - lead + 0.15, s.asstY76 + MARK_H], // (d: the assistant's mark kept in sight as the rest moves down)
      ...s.calls.map((c, k) => [W[k].open, c.band.y + c.band.h]),
      ...s.reps.map((R, k) => [resIn[k] - 0.3, R.y + R.h]),
      [cMark, s.CE.y + s.CE.h],
    ];
    const scrollY = (tt) => {
      let n = 0;
      let sy = 0;
      need.forEach(([when, bottom]) => {
        const to = Math.max(n, bottom - VIS);
        if (to > n) sy += (to - n) * inOutCubic(seg(tt, when - 0.5, when - 0.05));
        n = to;
      });
      return tt >= need[need.length - 1][0] - 0.05 ? n : sy;
    };
    const sy = scrollY(t);

    // ——— who is at work
    const actGlow = Math.max(
      span(t, readE - 0.1, readE + 0.5),
      span(t, stopAt - 0.05, at('loop') - lead + 0.3),
      ...resIn.map((r) => span(t, r - 0.5, r + 0.2)),
      span(t, readN - 0.1, readN + 0.5),
      span(t, cMark - 0.15, cMark + 0.4),
    );
    const llmGlow = Math.max(span(t, readE + 0.45, stopAt), span(t, readN + 0.5, cEnd + TOK_FLY));
    const writing = (t >= w0 && t < stopAt) || (t >= c0 && t < cEnd + TOK_FLY);

    // ——— the rings: what the voice points at
    const [candsLit, threeLit] = lit(['cands', 'three'], at('a.end'));
    const cLit = lit(['c1', 'c2', 'c3'], at('b.end'));
    const [, , pileLit] = lit(['one', 'each', 'pile'], at('c.end'));
    const [harnLit, toolLit, giveLit] = lit(['harn', 'tool', 'give'], at('d.end'));
    const [, callLit, askLit, harn2Lit, newdocLit, loopLit] = lit(['llm', 'call', 'ask', 'harn2', 'newdoc', 'loop'], at('e.end'));
    const [calledLit, ownLit, shortLit] = lit(['called', 'own', 'short'], at('ret'));
    const [addLit, longLit, centerLit] = lit(['add', 'long', 'center'], at('g.end'));
    const [three2Lit, , paraLit] = lit(['three2', 'wait', 'para'], at('h.end'));
    const [partLit, owndocLit, nameLit] = lit(['part', 'owndoc', 'name'], at('i.end'));
    const [fastLit, cheapLit] = lit(['fast', 'cheap'], at('j.end'));
    const [earlyLit, cheap2Lit] = lit(['early', 'cheap2'], at('k.end'));
    const [each2Lit, llm2Lit, toolsLit] = lit(['each2', 'llm2', 'tools'], at('k2.end'));
    const fact1Lit = lit(['inner', 'opus', 'solo', 'num'], at('l.end'));
    const fact2Lit = lit(['multi', 'chat', 'x15'], at('m.end'));
    const [read3Lit, oct6Lit, limitLit, likelyLit] = lit(['read3', 'oct6', 'limit', 'likely'], at('n.end'));

    // ——— the chat screen (6-4's report and the request)
    chatScreen(ctx, T7.SCREEN, 1);
    chatBubble(ctx, s73.Br, { alpha: 1 });
    chatBubble(ctx, s73.Bu, { alpha: 1 });
    screenLinks(ctx, T7, { talk: 1, back: 1, talkHot: false, backHot: false });

    // ——— the LLM, the frame and the channels
    appFrame(ctx, L7, 1, { name: '' });
    llmBlock(ctx, L7, 1, { glow: llmGlow });
    const readHot = span(t, readE, readE + 0.55) > 0.5 || span(t, readN, readN + 0.6) > 0.5;
    channel(ctx, L7.read, 1, { hot: readHot });
    channel(ctx, L7.write, 1, { hot: llmGlow > 0.5 && writing });
    channel(ctx, L7.call, 1, { labelAlpha: 1, hot: askGo.some((p) => p > 0.05 && p < 0.95) });
    channel(ctx, L7.back, 1, { labelAlpha: 1, hot: backP.some((p) => p > 0.05 && p < 0.95) });

    // ——— the document: the definition (d); the calls (e); the reports (f); the likely cause (n)
    const callsNow = s.calls.map((c, k) => ({
      bandA: tw(t, W[k].open + 0.2, 0.25),
      open: t >= W[k].open + TOK_FLY,
      n: c.toks.reduce((n, _, j) => (landed(k, j) ? j + 1 : n), 0),
      end: t >= W[k].end + TOK_FLY,
    }));
    const repsNow = s.reps.map((R, k) => ({ mark: t >= resIn[k], chars: seg(t, resIn[k], resIn[k] + 0.5) }));
    doc76(ctx, s, { def: defP, shift, sy, calls: callsNow, reps: repsNow, concl: { mark: t >= cMark + 0.45, upto } });
    // the reads: the harness hands the document over (e, n)
    const written = (bottom) => Math.min(VIS, bottom - sy);
    sweep(ctx, L7, seg(t, readE, readE + 0.55), written(s.asstY76 + MARK_H));
    send(ctx, L7.read, seg(t, readE + 0.1, readE + 0.6), '', 'doc');
    const lastRep = s.reps[2];
    sweep(ctx, L7, seg(t, readN, readN + 0.6), written(lastRep.y + lastRep.h));
    send(ctx, L7.read, seg(t, readN + 0.1, readN + 0.65), '', 'doc');
    // e: the harness sees where the last call ends, and stops the writing
    const lk = span(t, stopAt - 0.05, at('harn2') - lead + 0.2);
    if (lk > 0) lookLine(ctx, DOC7, ACT7, docBox76(s.calls[2].end, sy), tw(t, stopAt - 0.05, 0.3, inOutCubic), lk);
    halt(ctx, span(t, stopAt, at('harn2') - lead + 0.3));
    // a: the leads, in the summary
    s.candRows.forEach((b) => marker(ctx, b, candsLit));
    // c: the document would grow again
    if (pileLit > 0.001) ringBox(ctx, { x: DOC7.x + 10, y: DOC7.y + 8, w: DOC7.w - 20, h: DOC7.h - 16 }, pileLit, C.accent, 2);
    // d: the definition
    const defRight = Math.max(...s.defs76.map((d) => d.right));
    const defBox = { x: s.defs76[0].segs[0].x, y: defY(s.defs.length) - 18, w: defRight - s.defs76[0].segs[0].x, h: 2 * 26 + 2 };
    ringBox(ctx, docBox76(defBox, sy), toolLit, C.accent, 4);
    // e: the call, the requests in it
    ringBox(ctx, docBox76(s.calls[0].band, sy), callLit, C.accent, 3);
    s.calls.forEach((c, k) => {
      const ts = c.toks.filter((tk, j) => tk.row === 1 && j >= 13 && landed(k, j));
      if (!ts.length) return;
      const x0 = ts[0].x;
      const b = { x: x0, y: ts[0].base - 15 - sy, w: ts[ts.length - 1].x + ts[ts.length - 1].w - x0, h: 19 };
      marker(ctx, b, askLit);
    });
    // g: the reports in the document; n: read, the second one, the change in it, the likely cause
    const repBoxes = s.reps.map((R) => docBox76({ x: R.tx, y: R.y, w: R.w, h: R.h }, sy));
    ringBox(ctx, repBoxes, Math.max(centerLit, read3Lit), C.accent, 3);
    ringBox(ctx, repBoxes[1], oct6Lit, C.accent, 4);
    marker(ctx, docBox76(s.change, sy), limitLit);
    marker(ctx, docBox76(s.likely, sy), likelyLit * (upto > 0.66 ? 1 : 0));
    if (addLit > 0.001) ringBox(ctx, { x: DOC7.x + 10, y: DOC7.y + 8, w: DOC7.w - 20, h: DOC7.h - 16 }, addLit, C.accent, 2);

    // ——— the harness's box and its loop; the names 7-5 left in the frame (bridge)
    harnessBox(ctx, ACT7, 1, { glow: actGlow, names: [['アプリ', 0, 26], [NAME, 1, 0]] });
    ringBox(ctx, ACT7, Math.max(harnLit, harn2Lit), C.accent, 4);
    const LP = T7.LOOP;
    loopIcon(ctx, LP.x, LP.y, LP.r, 1, { p: 1 });
    text(ctx, 'くり返す', LP.x - LP.r - 14, LP.y + 6, { font: F.jp(700, 16), color: C.purple, align: 'right', alpha: 1 });
    compactionName75(ctx, old);
    whenCard75(ctx, { a: old, rows: [1, 1] });

    // ——— the tool's place: the shell; the GitHub MCP server and the files step aside; the agents' room (d on)
    let cols = [];
    let head = null;
    toolPlace(ctx, { ...L7, tool: toolNow }, 1, {
      draw: (cx) => {
        shell(cx, t, 1, terminalLines76(shellAt), { trim: true });
        mcpServer(cx, SERVER7, away);
        filesList75(cx, { a: away });
        head = agentHead76(cx, { a: headA, slot: slotRoom, name: pop('name'), lift: lifted(nameLit, cue) });
        cols = [0, 1, 2].map((k) => subAgent76(cx, k, {
          a: colA[k], doc: 1, ask: askIn[k], llm: loopA[k], loop: loopA[k], spin: spin[k], glow: Math.max(kidGlow[k], llm2Lit),
          rounds: rounds[k], report: rep[k], lit: repLit[k], tokens: tokens[k], tokA: colA[k], done: done[k],
        }));
      },
    });
    githubBoard(ctx, NET7, away, { narrow: 0, scroll: 1, found: 0 });
    serverWire(ctx, SERVER7, API7.x, away, 1);
    // d: the room; e–k: the agents, their documents, their loops, their reports, their amounts
    ringBox(ctx, { x: SUB76.x, y: SUB76.y + 26, w: SUB76.w, h: SUB76.h - 26 }, giveLit, C.accent, 6);
    cols.forEach((b, k) => {
      ringBox(ctx, b.col, Math.max(calledLit, three2Lit, each2Lit), C.accent, -1);
      ringBox(ctx, b.doc, Math.max(newdocLit, ownLit, longLit, owndocLit), C.accent, 0);
      ringBox(ctx, b.loop, loopLit, C.accent, 3);
      ringBox(ctx, b.head, partLit, C.accent, 3);
      if (b.report) ringBox(ctx, b.report, shortLit * rep[k], C.accent, 2);
      ringBox(ctx, b.amount, Math.max(cheapLit, cheap2Lit), C.accent, 3);
    });
    ringBox(ctx, TERM7, toolsLit, C.accent, 5);

    // ——— above the LLM: what 7-5 kept there (bridge); the leads (a–k); Anthropic's two figures (l, m)
    recordCard75(ctx, { a: old, rows: RECORD_ALL75.length, strip: 1 });
    rulesCard75(ctx, { a: old, rules: [1, 1], note: 1, names: [1, 1] });
    rulesSource75(ctx, old);
    const cand = candCard76(ctx, { a: cardA, slots: slotA, texts: flyC.map((p) => (p >= 1 ? 1 : 0)), hot: candHot });
    ringBox(ctx, cand.box, threeLit, C.accent, 4);
    cand.rows.forEach((b, k) => ringBox(ctx, b, cLit[k], C.accent, 4));
    const facts = factCards76(ctx, {
      a1: tw(t, at('l') + 0.1, pace.enter), rows1: [pop('inner'), pop('opus'), pop('solo'), pop('num')],
      a2: tw(t, at('m'), pace.enter), rows2: [pop('multi'), pop('chat'), pop('x15')],
    });
    facts.rows1.forEach((b, i) => ringBox(ctx, b, fact1Lit[i], C.accent, 4));
    facts.rows2.forEach((b, i) => ringBox(ctx, b, fact2Lit[i], C.accent, 4));

    // ——— under the LLM: what the document holds (the calls and the reports add little); one by one (c); the times (h)
    const callTok = s.calls.reduce((n, c, k) => n + c.toks.reduce((m, _, j) => m + (landed(k, j) ? 1 : 0), 0), 0)
      + s.ctoks.reduce((n, _, j) => n + (t >= cTokAt(j) + TOK_FLY ? 1 : 0), 0);
    const repTok = REPORT_TOK76.reduce((n, v, k) => n + (t >= resIn[k] ? v : 0), 0);
    const bar = docBar75(ctx, {
      a: 1, vals: [12000, callTok, repTok, 80],
      rows: [1, tw(t, W[0].open, 0.4), tw(t, resIn[0], 0.4), 1], slots: [0, 2, 3, 1], track: 1, limit: 1,
      lit: [0, 0, centerLit, 0],
    });
    const ghost = ghost76(ctx, { a: ghostA, p: gp, from: 12080 });
    if (ghost && pileLit > 0.001) ringBox(ctx, ghost.all, pileLit, C.accent, 3);
    const barAll = { x: BAR74.x, y: BAR74.head - 20, w: BAR74.w, h: BAR74.legend + 3 * BAR74.step + 6 - (BAR74.head - 20) };
    if (bar) ringBox(ctx, barAll, Math.max(cheapLit, cheap2Lit), C.accent, 4);
    const tl = timeline76(ctx, { a: pop('wait'), p: seg(t, at('wait') - lead, at('wait') - lead + 0.9), runs: RUNS_END76 });
    if (tl) ringBox(ctx, tl.box, Math.max(paraLit, fastLit, earlyLit), C.accent, 3);
    // j: ずんだもん's two questions
    const qOff = 1 - tw(t, at('k'), 0.4);
    const qOpt = { font: F.jp(700, 16), h: 28, padX: 9, fill: C.accent, color: '#fff', r: 14, align: 'right' };
    if (tl) tag(ctx, tl.box.x + tl.box.w + 36, tl.bars[1].y - 8, '？', { ...qOpt, alpha: pop('fast') * qOff });
    tag(ctx, BAR74.x + BAR74.w, BAR74.legend + 2 * BAR74.step - 18, '？', { ...qOpt, alpha: pop('cheap') * qOff });

    // ——— 7-5's last pieces under the LLM, clearing in the bridge
    longDoc75(ctx, { a: old, well: 1 });
    ch8Tag75(ctx, old);

    // ——— in flight, over everything
    // b: the leads, from the summary into the card
    s.cands.forEach((b, k) => {
      const p = flyC[k];
      if (p <= 0 || p >= 1) return;
      const q = inOutCubic(p);
      const R = candRow76(k);
      const x = lerp(b.x, R.x + 42, q);
      const y = lerp(b.y + 11, R.y + 17, q) - Math.sin(Math.PI * q) * 30;
      tag(ctx, x - 6, y - 15, CANDS76[k][0], { font: CAND_FONT76, h: 30, padX: 6, fill: '#fff', stroke: C.ink2, color: C.ink, r: 8, alpha: clamp(p * 8) });
    });
    // e: the LLM writes the three calls, token by token (down the frame's margin to the row, and in: the way stays
    // on the paper wherever the document has scrolled to)
    const wc = L7.write;
    const inRow = (x, y) => [[wc.x1, wc.y], [T7.margin, wc.y], [T7.margin, y], [x, y]];
    s.calls.forEach((c, k) => {
      const po = seg(t, W[k].open, W[k].open + TOK_FLY);
      if (po > 0 && po < 1) {
        const pt = onPath(inRow(c.open.x + c.open.w / 2, c.open.y + MARK_H / 2 - sy), inOutCubic(po));
        roleMark(ctx, pt.x - c.open.w / 2, pt.y - MARK_H / 2, ROLE.call, { edge: WRITER.call, alpha: clamp(po * 8) });
      }
      c.toks.forEach((tk, j) => {
        const p = seg(t, W[k].tok[j], W[k].tok[j] + TOK_FLY);
        if (p <= 0 || p >= 1) return;
        const label = tk.s.replace(/^ /, '');
        if (!label) return;
        const w = measure(ctx, TOKEN.font, label) + TOKEN.padX * 2;
        const pt = onPath(inRow(tk.x + tk.w / 2, tk.y - sy), inOutCubic(p));
        token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, label, clamp(p * 8) * clamp((1 - p) * 8));
      });
      const pe = seg(t, W[k].end, W[k].end + TOK_FLY);
      if (pe > 0 && pe < 1) {
        const pt = onPath(inRow(c.end.x + c.end.w / 2, c.end.y + MARK_H / 2 - sy), inOutCubic(pe));
        roleMark(ctx, pt.x - c.end.w / 2, pt.y - MARK_H / 2, ROLE.callEnd, { edge: WRITER.callEnd, alpha: clamp(pe * 8) });
      }
    });
    // e: the requests, out of the calls (from the empty end of each band's last row) to the tool's place
    s.calls.forEach((c, k) => {
      const y = c.end.y + MARK_H / 2 - sy;
      const x = c.band.x + c.band.w - 40;
      chipGo(ctx, askGo[k], [[x, y], [T7.lane, y], [T7.lane, L7.call.y], [L7.call.x2, L7.call.y], [L7.tool.x, L7.call.y]], '依頼', 'call');
    });
    // f: the reports, out of the tool's place into the document; the harness writes each one's mark
    s.reps.forEach((R, k) => {
      chipGo(ctx, backP[k], fromTool(T7, R, -sy, R.tx + 90), '報告', 'found');
      flyMark(ctx, T7, R, seg(t, resIn[k] - 0.45, resIn[k]), ROLE.result, { edge: WRITER.result, dy: -sy });
    });
    // n: the assistant's mark, and the likely cause, token by token
    flyMark(ctx, T7, s.CE, seg(t, cMark, cMark + 0.45), ROLE.assistant, { edge: WRITER.assistant, dy: -sy });
    s.ctoks.forEach((tk, j) => {
      const p = seg(t, cTokAt(j), cTokAt(j) + TOK_FLY);
      if (p <= 0 || p >= 1) return;
      const label = tk.s.replace(/^ /, '');
      if (!label) return;
      const w = measure(ctx, TOKEN.font, label) + TOKEN.padX * 2;
      const pt = onPath(inRow(tk.x + w / 2, tk.y - sy), inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, label, clamp(p * 8) * clamp((1 - p) * 8));
    });

    // ——— the example's note (7-5's gives way)
    exampleNote(ctx, L7, '', 0, 1);
    const exX = L7.app.x + measure(ctx, F.jp(700, 17), '例') + 20 + 10;
    const exY = L7.app.y + L7.app.h + 22 + 21;
    const nf = F.jp(400, 17);
    text(ctx, NOTE75, exX, exY, { font: nf, color: C.muted, alpha: 1 - seg(nar, 0, 0.5) });
    text(ctx, NOTE76, exX, exY, { font: nf, color: C.muted, alpha: seg(nar, 0.5, 1) });
  },
});
