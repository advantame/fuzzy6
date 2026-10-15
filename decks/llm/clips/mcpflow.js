// 7-3: fetching the definitions. The GitHub MCP server is connected to this harness. First, the harness asks
// the server which tools it has (tools/list); back come each tool's name, what it does and what input it
// takes — the same as chapter 5's tool definitions. The harness puts them, with the shell's, into the
// document the LLM reads. Reading them, the LLM writes a tool call that searches the issues; the harness turns
// it into MCP's shape (tools/call) and sends it to the server, which calls GitHub's API and returns the issue
// it found; the harness writes that in as the tool's result. ずんだもん: does the LLM not need to know MCP? No:
// the LLM writes the same tool call as in chapter 5, never MCP's shape; MCP is between the harness and the
// server. #128 says the database times out from 10/7, and not why. But with many servers connected, reading
// every definition every time makes the document long; so there are harnesses that give the LLM a tool that
// searches for tools, and put only the definitions it found into the document.
//
// The tools are the official GitHub MCP server's real ones (search_issues, issue_read, add_issue_comment; the
// definitions on the card are cut from its source, the document's are put in Japanese as bash's is); the
// exchange is drawn in the lane between the harness's frame and the tool's place, which 7-3 narrows for it
// (lib/harness.js G73). JSON-RPC is shown cut short, never as a whole request; authentication and the like are
// left out, as in 7-2. The LLM's call is cut into tokens as o200k_base cuts them (an example of one
// tokenizer). The last two sentences pull back to a picture of their own (as 7-2's table does): the harness
// holds what the servers sent, apart from the document; the LLM calls a tool that searches for tools, and only
// the definition found goes into the document (after Anthropic's tool search, 2025-11-24; never fetched from
// the server again). The picture then comes back as 7-3 ends (lib/harness.js final73: 7-4's first frame).
//
// The clip joins 7-2 (spec §6.10): its first frame is 7-2's last, drawn here with lib/harness.js's functions as
// mcp.js draws them; the bridge narrows the tool's place and GitHub.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import {
  chatScreen, chatBubble, screenLinks, writePath, flyMark, llmBlock, appFrame, channel, token, TOKEN, onPath, docLayout,
  docEntry, rowAt, sweep, send, roleMark, MARK_H, ROLE, WRITER, loopIcon, jsonLine,
} from '../lib/rig.js';
import { T as T64, SYS, defY, drawDef, callLayout, drawCall, halt, NOTE_X, NOTE_Y } from '../lib/terminal.js';
import {
  G7, harnessLayout, mix7, T7, L7, ACT7, DOC7, TERM7, NET7, DOC7_SHORT, PANEL7, NAME, harnessBox, toolPlace, shell,
  exampleNote, marker, lookLine, term64Lines, mcpServer, SERVER7, plug, PLUG, mcpCard, textBar,
  G73, TERM73, SERVER73, NET73, API7, API73, PORT, LOG73, githubBoard, serverWire, mcpLog, harnessPlug, prepare73,
  final73, llmNotes73, NOTE73,
} from '../lib/harness.js';
import { text, measure, rr, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { focus, ring, ringBox } from '../../../src/kit/cue.js';
import { hash } from '../../../src/kit/random.js';

// ——— 7-2's last picture
const NOTE72 = '依頼、ログ、出力、報告、文書の中身、Issue の一覧は説明のための例';

// ——— c, d: the server's reply, as the harness holds it (in the frame, under the document cut short): the
// definitions it sent, cut from the official server's (github/github-mcp-server, fetched 2026-10-16)
const CARD = PANEL7;
const JFONT = F.mono(500, 13);
const JLH = 21;
const LIST_JSON = [
  '{"tools": [',
  '  {"name": "search_issues",',
  '   "description": "Search issues using natural-language …",',
  '   "inputSchema": {"properties": {"query": {…}, …}}},',
  '  {"name": "issue_read",',
  '   "description": "Get information about a specific issue …",',
  '   "inputSchema": {"properties": {"method": {…}, …}}},',
  '  {"name": "add_issue_comment",',
  '   "description": "Add a comment and/or reaction to …",',
  '   "inputSchema": {"properties": {"body": {…}, …}}},',
  '  …]}',
];
const TOOLS = ['search_issues', 'issue_read', 'add_issue_comment'];
const JX = CARD.x + 18;
const JY = CARD.y + 66;

// ——— n, o: the picture of their own (the harness holds the servers' definitions; the document has what it reads)
const PBF = { x: 386, y: 100, w: 760, h: 712 };
const PBB = { x: PBF.x + PBF.w - 22 - 236, y: 122, w: 236, h: 92 };
const PBD = { x: 408, y: 234, w: 492, h: 556 };
const HAND = { x: 920, y: 234, w: 204, h: 556 };
const PB_L = { app: PBF, doc: PBD };
const PB_FROM = { FROM: { x: PBB.x + 24, y: PBB.y + PBB.h - MARK_H / 2 - 6 } };
const PB_TX = PBD.x + 18 + 122 + 12;
const PB_RIGHT = PBD.x + PBD.w - 18;
const PB_ROW = 22;
const PB_DEF0 = 270; // the first definition's baseline
const PB_FONT = F.mono(600, 13);
const PB_JP = F.jp(500, 13);
// the servers and their definitions in the hand: [name, the definitions' names (null: a grey bar)]
const SERVERS = [
  ['GitHub', ['search_issues', 'issue_read', 'add_issue_comment', null, null]],
  ['チャット', [null, null, null, null]],
  ['カレンダー', [null, null, null]],
  ['データベース', [null, null, null]],
];
const EXTRA = 20; // the other definitions the document gets when all of them are read every time
const PB_CALL = [
  ['{"', 'name', '":', ' "', 'tool', '_search', '",'],
  [' "', 'input', '":', ' {"', 'query', '":'],
  [' "', 'Issue', ' を', '検索', '"}}'],
];
const PB_MONO = F.mono(500, 13);
const PB_NOTE = 'Anthropic の tool search（2025-11-24 の記事）をもとに簡単にした図。サーバーと定義の数は例';

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n times, evenly from a, the last one landing (after a flight of fly) by b
const times = (n, a, b, fly) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - fly - a)) / Math.max(1, n - 1));
const lerpBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
const TOK_FLY = 0.36;

export default clip({
  id: 'mcpflow',
  title: '定義を取り寄せる',
  kicker: 'MCP のやりとり',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 1.0, // the tool's place and GitHub narrow, for the lane's log
  script: [
    { id: 'a', text: 'では、{gh}GitHub の MCP サーバーを、\n{this}このハーネスに{join}つないでみましょう。' },
    { id: 'b', text: 'ハーネスは、まず、{ask}サーバーに、\n{list}使えるツールの一覧を尋ねるわ。' },
    { id: 'c', lead: 1.1, text: 'サーバーからは、{name}ツールの名前と、{what}何をするのか、\n{input}どんな入力を受け取るのかが返ってくるわ。' },
    { id: 'd', text: '{ch5}5 章で見た、{same}ツールの定義と同じ中身ね。' },
    { id: 'e', still: true, text: 'ハーネスは、{put}それをシェルの定義といっしょに、\n{read}LLM に読ませる文書に入れるわ。' },
    { id: 'f', lead: 1.3, tail: 0.9, text: 'LLM は、{read2}その定義を読んで、\n{call}Issue を検索するツール呼び出しを書くの。' },
    { id: 'g', text: 'ハーネスは、{that}その呼び出しを、{mcp}MCP の形に直して、\n{send}サーバーに送るわ。' },
    { id: 'h', text: 'サーバーは、{api}GitHub の API を呼んで、\n{found}見つかった Issue を返してくれるわね。' },
    { id: 'i', still: true, text: 'ハーネスは、{res}それを、{tr}ツールの結果として、{add}文書に書き足すわ。' },
    { id: 'j', by: 'zunda', text: '{llm}LLM は、{mcp2}MCP のことを知らなくても、いいのだ？' },
    { id: 'k', text: 'ええ。{same5}LLM に書かせるのは、\n5 章と同じツール呼び出しで、\n\n{nomcp}MCP の形で書かせる必要はないわ。' },
    { id: 'l', text: '{talk}MCP でやりとりするのは、{pair}ハーネスとサーバーなの。' },
    { id: 'm', still: true, text: '{n128}見つかった Issue の [#128|ヒャクニジュウハチバン] には、\n{note}時間切れの知らせはあっても、\n\n{cause}原因は、まだ書かれていないわね。' },
    { id: 'n', lead: 1.3, text: 'ただ、{many}サーバーをいくつもつないで、\n{all}すべての定義を毎回読ませると、{long}文書が長くなるわ。' },
    { id: 'o', tail: 1.9, text: 'そこで、{finder}ツールを探すツールを用意して、\n{seek}LLM に、要るツールを探させてから、\n\n{readdef}その定義を読ませる仕組みもあるの。' },
  ],

  prepare(ctx) {
    const s73 = prepare73(ctx);
    const { defs, U, c, R } = s73;
    // 7-2's request, before the definitions push it down
    const U0 = docLayout(ctx, L7, [{ role: 'user', text: U.text }], { ...T64.DOC, font: F.jp(500, 20), lh: 28, top: defY(1) + 28 - DOC7.y })[0];
    // the definitions' boxes in the document
    const defBox = (k0, k1) => {
      const ds = defs.slice(k0, k1 + 1);
      const x0 = Math.min(...ds.map((d) => d.segs[0].x));
      return { x: x0 - 4, y: defY(k0) - 19, w: Math.max(...ds.map((d) => d.right)) - x0 + 8, h: defY(k1) - defY(k0) + 26 };
    };
    const bashBox = defBox(0, 1);
    const ghBoxes = [defBox(2, 3), defBox(4, 5), defBox(6, 7)];
    const allBox = defBox(0, 7);
    // the card's JSON: where its names, descriptions and inputs are
    const jw = (s) => measure(ctx, JFONT, s);
    const jrow = (r) => JY + r * JLH;
    LIST_JSON.forEach((s, r) => { if (JX + jw(s) > CARD.x + CARD.w - 14) throw new Error(`mcpflow: the card's row ${r} is too wide`); });
    const part = (r, before, s) => ({ x: JX + jw(before), y: jrow(r) - 14, w: jw(s), h: 19 });
    const names = TOOLS.map((n, k) => part(1 + k * 3, '  {"name": "', n));
    const descs = [2, 5, 8].map((r) => part(r, '   ', LIST_JSON[r].trim().replace(/,$/, '')));
    const inputs = [3, 6, 9].map((r) => part(r, '   ', LIST_JSON[r].trim().replace(/},$/, '')));
    // e: the names fly from the card to their rows in the document
    const flights = TOOLS.map((n, k) => ({ s: n, from: names[k], to: { x: defs[2 + k * 2].segs[0].x, y: defY(2 + k * 2) - 15 } }));
    // m: the words of the result the voice points at
    const inR = (row, before, s) => {
      const at = rowAt(R, row);
      return { x: at.x + measure(ctx, R.font, before), y: at.y - 16, w: measure(ctx, R.font, s), h: 21 };
    };
    const n128 = inR(0, '', '#128');
    const timeout = inR(0, '#128 10/7 からデータベースが', '時間切れ');
    // n, o: the picture of their own
    const pb = prepareBack(ctx);
    return { s73, defs, U, U0, c, R, bashBox, ghBoxes, allBox, names, descs, inputs, flights, n128, timeout, pb };
  },

  draw(ctx, t, s, { at, pace }) {
    const { s73, defs, U, U0, c, R, bashBox, ghBoxes, allBox, names, descs, inputs, flights, n128, timeout, pb } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;

    // ——— the bridge: the tool's place and GitHub narrow
    const nar = inOutCubic(seg(t, 0, at('a')));
    const T = harnessLayout(mix7(G7, G73, nar));
    const Lx = T.L;
    const TOOL = Lx.tool;
    const TERM = lerpBox(TERM7, TERM73, nar);
    const SRV = lerpBox(SERVER7, SERVER73, nar);
    const NET = lerpBox(NET7, NET73, nar);
    const apiX = lerp(API7.x, API73.x, nar);
    // n: the picture pulls back to its own; o: and comes back as the clip ends
    const pOut = inOutCubic(seg(t, at('n'), at('n') + 1.2));
    const pRet = inOutCubic(seg(t, at('o.end') + 0.15, at('o.end') + 1.6));
    const mainA = 1 - seg(pOut, 0, 0.55);
    const backA = seg(pOut, 0.45, 1) * (1 - seg(pRet, 0, 0.45));
    const finA = seg(pRet, 0.4, 1);

    // ——— when things happen
    // b: the harness asks the server for its tools
    const c1 = seg(t, at('ask') - lead, at('ask') - lead + 0.9);
    // c: the reply comes back into the card (the document cut short to make room)
    const shrink = inOutCubic(seg(t, at('c') + 0.2, at('c') + 0.7));
    const cardIn = tw(t, at('c') + 0.75, 0.4);
    const c2 = seg(t, at('c') + 0.1, at('c') + 1.05);
    const jsonP = seg(t, at('c') + 0.95, at('c') + 1.75);
    // e: the harness writes the definitions into the document
    const putAt = at('put') - lead;
    const cardOut = tw(t, putAt, 0.45, inOutCubic);
    const grow = inOutCubic(seg(t, putAt, putAt + 0.55));
    const fly = (k) => seg(t, putAt + 0.1 + k * 0.1, putAt + 0.75 + k * 0.1);
    const defP = (k) => (k < 2 ? 1 : seg(t, putAt + 0.65 + Math.floor((k - 2) / 2) * 0.1 + (k % 2) * 0.08, putAt + 1.1 + Math.floor((k - 2) / 2) * 0.1 + (k % 2) * 0.08));
    const docH = lerp(lerp(DOC7.h, DOC7_SHORT.h, shrink), DOC7.h, grow);
    // f: the harness writes the assistant's mark and has the LLM read; the LLM writes the call
    const markF = at('f') + 0.05;
    const readF = markF + 0.45;
    const openF = at('call') - 0.2;
    const tok = times(c.toks.length, openF + 0.4, at('f.end') + 0.15, TOK_FLY);
    const finF = tok[tok.length - 1] + TOK_FLY;
    const endF = finF + 0.4;
    const nTok = c.toks.reduce((n, _, k) => (t >= tok[k] + TOK_FLY ? k + 1 : n), 0);
    // g: the harness sees the end, stops the LLM, turns the call into MCP's shape and sends it
    const c3a = seg(t, at('mcp') - lead - 0.1, at('mcp') - lead + 0.45);
    const morph = seg(t, at('mcp') - lead + 0.45, at('mcp') - lead + 0.75);
    const c3b = seg(t, at('send') - lead, at('send') - lead + 0.65);
    // h: the server calls GitHub's API; the found issue comes back to the harness
    const down = seg(t, at('api') - lead, at('api') - lead + 0.4);
    const scroll = inOutCubic(seg(t, at('api') - lead + 0.35, at('api') - lead + 0.85));
    const foundA = tw(t, at('found') - lead, 0.4);
    const up = seg(t, at('found') - lead, at('found') - lead + 0.35);
    const c4 = seg(t, at('found') - lead + 0.3, at('found') - lead + 1.45);
    // i: the harness writes it in as the tool's result
    const resMark = seg(t, at('tr') - lead, at('tr') - lead + 0.5);
    const resIn = at('add') - lead;

    const actGlow = Math.max(
      span(t, at('b'), at('ask') - lead + 0.35),
      span(t, at('e'), putAt + 1.0),
      span(t, markF - 0.1, readF + 0.6),
      span(t, endF - 0.05, at('send') - lead + 0.3),
      span(t, at('found') - lead + 1.2, resIn + 0.6),
    );
    const srvGlow = Math.max(
      span(t, at('ask') - lead + 0.8, at('c') + 0.35),
      span(t, at('send') - lead + 0.55, at('found') - lead + 0.45),
    );
    const llmGlow = span(t, readF + 0.55, endF);

    // ——— the rings: what the voice points at
    const [ghLit, thisLit] = lit(['gh', 'this'], at('join'));
    const [listLit] = lit(['list'], at('b.end'));
    const [nameLit, whatLit, inputLit] = lit(['name', 'what', 'input'], at('c.end'));
    const [sameLit] = lit(['same'], at('d.end'));
    const [readLit] = lit(['read'], at('e.end'));
    const [read2Lit] = lit(['read2'], at('call'));
    const [thatLit, mcpLit] = lit(['that', 'mcp'], at('g.end'));
    const [apiLit] = lit(['api'], at('found'));
    const [resLit, , addLit] = lit(['res', 'tr', 'add'], at('i.end'));
    const [llmJLit, mcp2Lit] = lit(['llm', 'mcp2'], at('j.end'));
    const [same5Lit, nomcpLit] = lit(['same5', 'nomcp'], at('k.end'));
    const [talkLit, pairLit] = lit(['talk', 'pair'], at('l.end'));
    const [n128Lit, noteLit] = lit(['n128', 'note', 'cause'], at('m.end'));
    // k: the MCP side dims while the LLM's is pointed at; l: the other way round
    const rightA = lerp(1, cue.dim, Math.max(same5Lit, nomcpLit));
    const leftA = lerp(1, cue.dim, Math.max(talkLit, pairLit));

    // ——— the main picture (7-2's, then this clip's), until it pulls back
    if (mainA > 0.001) {
      withScene(ctx, mainA, lerp(1, 0.94, pOut), () => {
        // the chat screen: 6-4's report and the request
        chatScreen(ctx, T7.SCREEN, 1);
        chatBubble(ctx, s73.Br, { alpha: 1 });
        chatBubble(ctx, s73.Bu, { alpha: 1 });
        screenLinks(ctx, T7, { talk: 1, back: 1, talkHot: false, backHot: false });
        // the LLM, and the frame with its document
        appFrame(ctx, { ...Lx, doc: { ...DOC7, h: docH } }, 1, { name: '' });
        alpha(ctx, leftA, () => {
          llmBlock(ctx, Lx, 1, { glow: Math.max(llmGlow, llmJLit) });
          channel(ctx, Lx.read, 1, { hot: span(t, readF, readF + 0.85) > 0.5 });
          channel(ctx, Lx.write, 1, { hot: llmGlow > 0.5 && t >= openF });
        });
        const linkHot = span(t, at('join') - lead, at('join') + 0.6) > 0.5 || (pairLit > 0.5);
        alpha(ctx, rightA, () => {
          channel(ctx, Lx.call, 1, { labelAlpha: 1, hot: linkHot || span(t, at('ask') - lead + 0.3, at('ask') - lead + 0.85) > 0.5 || span(t, at('send') - lead, at('send') - lead + 0.6) > 0.5 });
          channel(ctx, Lx.back, 1, { labelAlpha: 1, hot: linkHot || span(t, at('c') + 0.25, at('c') + 0.75) > 0.5 || span(t, at('found') - lead + 0.3, at('found') - lead + 0.85) > 0.5 });
        });
        // the document: the head, the request (pushed down as the definitions come in), the call, the result
        roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
        defs.forEach((d, k) => drawDef(ctx, d, defY(k), defP(k)));
        // (the request steps aside while the names fly in, and comes back under them)
        const Uat = t >= putAt + 0.5 ? U : U0;
        const uA = t >= putAt + 0.5 ? seg(t, putAt + 0.75, putAt + 1.1) : 1 - seg(t, putAt, putAt + 0.25);
        docEntry(ctx, Uat, uA, { tagAlpha: 0, chars: 1 });
        roleMark(ctx, Uat.x, Uat.y + 1, ROLE.user, { edge: WRITER.user, alpha: uA });
        if (t >= markF + 0.5) roleMark(ctx, DOC7.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
        drawCall(ctx, c, { bandA: tw(t, openF + 0.4, 0.25), open: t >= openF + 0.5, n: nTok, end: t >= endF });
        if (resMark >= 1) roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
        const ri = tw(t, resIn, 0.3);
        if (ri > 0) docEntry(ctx, R, ri, { tagAlpha: 0, chars: seg(t, resIn, resIn + 0.6) });
        ringBox(ctx, bashBox, sameLit, C.accent, 2);
        ringBox(ctx, allBox, readLit, C.accent, 2);
        ringBox(ctx, ghBoxes[0], read2Lit, C.accent, 2);
        ringBox(ctx, c.band, Math.max(thatLit, same5Lit), C.accent, 3);
        ringBox(ctx, { x: R.tx, y: R.y, w: R.w, h: R.h }, addLit, C.accent, 3);
        ringBox(ctx, n128, n128Lit, C.accent, 2);
        marker(ctx, timeout, noteLit);
        text(ctx, '時間切れ', timeout.x, rowAt(R, 0).y, { font: R.font, color: C.accent, alpha: noteLit * ri });
        // m: the cause is not written yet
        const causeA = pop('cause');
        if (causeA > 0.001) tag(ctx, R.tx + R.w - 10, rowAt(R, 1).y - 17, '原因は？', { font: F.jp(700, 13), h: 26, padX: 10, fill: C.accent, color: '#fff', r: 13, align: 'right', alpha: causeA });
        // the reads: the harness hands the document over (f)
        sweep(ctx, L7, seg(t, readF, readF + 0.85), c.band.y + MARK_H);
        send(ctx, L7.read, seg(t, readF + 0.3, readF + 0.9), '', 'doc');
        // the harness sees where the call ends, and stops the writing (g)
        const lk = span(t, endF - 0.05, at('mcp') - lead + 0.2);
        if (lk > 0) lookLine(ctx, DOC7, ACT7, c.end, tw(t, endF - 0.05, 0.3, inOutCubic), lk);
        halt(ctx, span(t, endF, at('mcp') - lead + 0.3));

        // the harness's box and its loop
        alpha(ctx, rightA, () => {
          harnessBox(ctx, ACT7, 1, { glow: actGlow, names: [['アプリ', 0, 26], [NAME, 1, 0]] });
        });
        const LP = T7.LOOP;
        loopIcon(ctx, LP.x, LP.y, LP.r, 1, { p: 1 });
        text(ctx, 'くり返す', LP.x - LP.r - 14, LP.y + 6, { font: F.jp(700, 16), color: C.purple, align: 'right', alpha: 1 });
        ringBox(ctx, ACT7, Math.max(thisLit, resLit, pairLit), C.accent, 4);

        // the tool's place: the shell and GitHub's MCP server; GitHub in the net beyond
        alpha(ctx, rightA, () => {
          toolPlace(ctx, Lx, 1, {
            draw: (cx) => {
              shell(cx, t, 1, term64Lines(() => -100), { trim: true, box: TERM });
              mcpServer(cx, SRV, 1, { plugColor: srvGlow > 0.5 || linkHot ? C.accent : C.ink });
            },
          });
          serverGlow(ctx, SRV, srvGlow);
          githubBoard(ctx, NET, 1, { narrow: nar, scroll, found: foundA });
          serverWire(ctx, SRV, apiX, 1, 1);
          pulse(ctx, [[apiX, SRV.y + SRV.h], [apiX, API7.y - PORT.h / 2]], down, C.accent);
          pulse(ctx, [[apiX, API7.y - PORT.h / 2], [apiX, SRV.y + SRV.h]], up, C.green);
          ringBox(ctx, NET, apiLit, C.accent, 4);
          // a: the harness's side of the connection; the lane's log
          harnessPlug(ctx, pop('join'), linkHot ? C.accent : C.purple);
          const rows = [tw(t, at('ask') - lead + 0.45, pace.enter), tw(t, at('c') + 0.55, pace.enter), tw(t, at('mcp') - lead + 0.4, pace.enter), tw(t, at('found') - lead + 0.65, pace.enter)];
          const log = mcpLog(ctx, { a: pop('join'), rows });
          if (log) {
            marker(ctx, log.names[0], listLit * rows[0]);
            marker(ctx, log.names[2], mcpLit * rows[2]);
            ringBox(ctx, log.box, Math.max(mcp2Lit, talkLit), C.accent, 4);
          }
        });
        ringBox(ctx, SRV, Math.max(ghLit, pairLit), C.accent, 6);
        const qa = pop('mcp2') * (1 - tw(t, at('k'), 0.4));
        if (qa > 0.001) tag(ctx, LOG73.x + LOG73.w + 4, LOG73.y - 16, '？', { font: F.jp(700, 16), h: 28, padX: 9, fill: C.accent, color: '#fff', r: 14, align: 'right', alpha: qa });

        // c–e: the card in the frame, with what the server sent (the harness holds it)
        replyCard(ctx, cardIn * (1 - cardOut), jsonP, { names, descs, inputs, nameLit, whatLit, inputLit, ch5: pop('ch5') });

        // under the LLM: what it writes and reads (k), and whose cut its tokens are (f)
        alpha(ctx, leftA, () => llmNotes73(ctx, [pop('same5'), pop('nomcp'), tw(t, tok[0] + TOK_FLY, 0.5)]));
        ring(ctx, NOTE_X - 120, NOTE_Y[0] - 2, 240, 78, nomcpLit, C.accent, 10);
        ring(ctx, Lx.llm.x, Lx.llm.y, Lx.write.x1 - Lx.llm.x + 96, Lx.llm.h, same5Lit, C.accent, 22);

        // ——— in flight, over everything
        flyMark(ctx, T7, { x: DOC7.x + 18, y: c.band.y }, seg(t, markF, markF + 0.5), ROLE.assistant, { edge: WRITER.assistant });
        flyMark(ctx, T7, R, resMark, ROLE.result, { edge: WRITER.result });
        const po = seg(t, openF, openF + 0.5);
        if (po > 0 && po < 1) {
          const pt = onPath(writePath(T7, { y: c.band.y, h: c.band.h }, c.open.x + c.open.w / 2, c.open.y + MARK_H / 2), inOutCubic(po));
          roleMark(ctx, pt.x - c.open.w / 2, pt.y - MARK_H / 2, ROLE.call, { edge: WRITER.call, alpha: clamp(po * 8) });
        }
        c.toks.forEach((tk, j) => {
          const p = seg(t, tok[j], tok[j] + TOK_FLY);
          if (p <= 0 || p >= 1) return;
          const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
          const pt = onPath(writePath(T7, { y: c.band.y, h: c.band.h }, tk.x + tk.w / 2, tk.y), inOutCubic(p));
          token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
        });
        const pe = seg(t, finF, endF);
        if (pe > 0 && pe < 1) {
          const pt = onPath(writePath(T7, { y: c.band.y, h: c.band.h }, c.end.x + c.end.w / 2, c.end.y + MARK_H / 2), inOutCubic(pe));
          roleMark(ctx, pt.x - c.end.w / 2, pt.y - MARK_H / 2, ROLE.callEnd, { edge: WRITER.callEnd, alpha: clamp(pe * 8) });
        }
        // e: the names, from the card into the document
        flights.forEach((f, k) => {
          const p = fly(k);
          if (p <= 0 || p >= 1) return;
          const q = inOutCubic(p);
          const x = lerp(f.from.x - 6, f.to.x - 6, q);
          const y = lerp(f.from.y - 4, f.to.y - 4, q) - Math.sin(Math.PI * q) * 24;
          tag(ctx, x, y, f.s, { font: F.mono(600, 13), h: 24, padX: 6, fill: '#fff', stroke: C.purple, lw: 2, color: C.ink, r: 6, alpha: clamp(p * 6) * clamp((1 - p) * 6) });
        });
        // b, g: what the harness sends the server; c, h: what comes back
        const lane = T.lane;
        const boxOut = [ACT7.x + ACT7.w - 18, ACT7.y + ACT7.h - 16];
        const toServer = [[lane, Lx.call.y], [Lx.call.x2, Lx.call.y], [TOOL.x + 40, Lx.call.y]];
        const fromServer = [[TOOL.x, Lx.back.y], [Lx.back.x2, Lx.back.y], [lane, Lx.back.y]];
        flyChip(ctx, [boxOut, [lane, boxOut[1]], ...toServer], c1, 'tools/list', 'call', { clipX: TOOL.x });
        flyChip(ctx, [...fromServer, [CARD.x + CARD.w - 60, Lx.back.y]], c2, 'ツールの定義', 'found', { clipX: TOOL.x });
        const bandOut = [c.band.x + c.band.w - 40, c.band.y + c.band.h / 2];
        // g: the call leaves the document; out of the frame, the harness has turned it into MCP's shape
        const midX = (Lx.call.x1 + Lx.call.x2) / 2;
        if (c3b <= 0) {
          flyChip(ctx, [bandOut, [lane, bandOut[1]], [lane, Lx.call.y], [midX, Lx.call.y]], c3a, 'search_issues', 'call', { fadeOut: false, hold: c3a >= 1 });
          if (c3a >= 1) {
            chipAt(ctx, midX, Lx.call.y, 'search_issues', 'call', 1 - morph);
            chipAt(ctx, midX, Lx.call.y, 'tools/call', 'call', morph);
          }
        } else {
          flyChip(ctx, [[midX, Lx.call.y], [Lx.call.x2, Lx.call.y], [TOOL.x + 40, Lx.call.y]], c3b, 'tools/call', 'call', { clipX: TOOL.x, fadeIn: false });
        }
        flyChip(ctx, [...fromServer, [lane, boxOut[1]], boxOut], c4, 'Issue #128', 'found', { clipX: TOOL.x });
      });
    }

    // ——— MCP's card, above the LLM (it stays)
    const card = mcpCard(ctx, { a: mainA * rightA, name: 1, abbr: 1, rows: [1, 1], note: 1, years: [1, 1], plugColor: C.ink });
    if (card) {
      ringBox(ctx, card.rows[0], listLit, C.accent, 3);
      ringBox(ctx, card.rows[1], mcpLit, C.accent, 3);
    }

    // ——— n, o: the picture of their own
    if (backA > 0.001) withScene(ctx, backA, lerp(1.04, 1, pOut), () => pullBack(ctx, t, s, { at, pace, pop, lit }));

    // ——— the end: 7-3's last picture (7-4's first)
    if (finA > 0.001) withScene(ctx, 1, lerp(0.94, 1, pRet), () => final73(ctx, t, s73, finA));

    // ——— the example's note (7-2's gives way; the pull-back has its own)
    if (mainA > 0.001) {
      exampleNote(ctx, L7, '', 0, mainA);
      const exX = L7.app.x + measure(ctx, F.jp(700, 17), '例') + 20 + 10;
      const exY = L7.app.y + L7.app.h + 22 + 21;
      const nf = F.jp(400, 17);
      text(ctx, NOTE72, exX, exY, { font: nf, color: C.muted, alpha: mainA * (1 - nar) });
      text(ctx, NOTE73, exX, exY, { font: nf, color: C.muted, alpha: mainA * nar });
    }
  },
});

// Draw fn with alpha a, scaled by sc about the stage's middle (7-2's way of pulling back).
function withScene(ctx, a, sc, fn) {
  ctx.save();
  ctx.globalAlpha *= a;
  if (sc !== 1) {
    ctx.translate(800, 450);
    ctx.scale(sc, sc);
    ctx.translate(-800, -450);
  }
  fn();
  ctx.restore();
}

// Draw fn with alpha multiplied by a (1: untouched).
function alpha(ctx, a, fn) {
  if (a >= 0.999) {
    fn();
    return;
  }
  ctx.save();
  ctx.globalAlpha *= a;
  fn();
  ctx.restore();
}

// The server at work: a vermilion outline round it (the harness's box's glow).
function serverGlow(ctx, B, g) {
  if (g <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(g);
  rr(ctx, B.x - 6, B.y - 6, B.w + 12, B.h + 12, 14);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();
}

// A signal along a short wire (the server and GitHub's API): a dot.
function pulse(ctx, pts, p, color) {
  if (p <= 0 || p >= 1) return;
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.globalAlpha *= clamp(p * 6) * clamp((1 - p) * 6);
  ctx.fillStyle = color;
  circle(ctx, pt.x, pt.y, 7);
  ctx.fill();
  ctx.restore();
}

// A chip standing at (x, y): kind 'call' (vermilion), 'found' (green).
function chipAt(ctx, x, y, s, kind, a) {
  if (a <= 0.001) return;
  const font = kind === 'call' && /^[\x20-\x7e]+$/.test(s) ? F.mono(600, 15) : F.jp(700, 16);
  tag(ctx, x, y - 15, s, { font, h: 30, padX: 10, fill: kind === 'call' ? C.accent : C.green, color: '#fff', align: 'center', r: 8, alpha: a });
}

// A chip on its way along a polyline (eased overall). o: { clipX (it slides in and out under the tool's place's
// left edge), fadeIn, fadeOut (default true), hold (it stays where it ended) }
function flyChip(ctx, pts, p, s, kind, o = {}) {
  if (p <= 0 || (p >= 1 && !o.hold)) return;
  const pt = onPath(pts, inOutCubic(clamp(p)));
  const a = (o.fadeIn === false ? 1 : clamp(p * 8)) * (o.fadeOut === false || o.hold ? 1 : clamp((1 - p) * 8));
  if (o.hold && p >= 1) return; // chipAt draws it while it waits
  ctx.save();
  if (o.clipX) {
    ctx.beginPath();
    ctx.rect(0, 0, o.clipX, 900);
    ctx.clip();
  }
  chipAt(ctx, pt.x, pt.y, s, kind, a);
  ctx.restore();
}

// c, d: the card in the harness's frame, with the definitions the server sent (cut short). p: how much of the
// JSON is in (row by row). o: { names, descs, inputs (boxes), nameLit, whatLit, inputLit, ch5 }
function replyCard(ctx, a, p, o) {
  if (a <= 0.001) return;
  const B = CARD;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, B.x, B.y, B.w, B.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'ハーネスが受け取ったツールの定義', B.x + 18, B.y + 32, { font: F.jp(700, 16), color: C.purple, alpha: a });
  text(ctx, 'tools/list の結果（抜粋）', B.x + B.w - 18, B.y + 31, { font: F.jp(500, 13), color: C.muted, align: 'right', alpha: a });
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.fillStyle = C.rule;
  ctx.fillRect(B.x + 18, B.y + 44, B.w - 36, 1.5);
  ctx.restore();
  // the marks under the parts the voice names
  o.names.forEach((b) => marker(ctx, b, o.nameLit * a));
  o.descs.forEach((b) => marker(ctx, b, o.whatLit * a));
  o.inputs.forEach((b) => marker(ctx, b, o.inputLit * a));
  const n = LIST_JSON.length;
  LIST_JSON.forEach((s, r) => {
    const ra = a * seg(p, r / n, (r + 1) / n);
    if (ra <= 0.001) return;
    jsonLine(ctx, s, JX, JY + r * JLH, { font: JFONT, alpha: ra });
  });
  text(ctx, '出典：github/github-mcp-server の定義（2026-10-16 に取得）', B.x + 18, B.y + B.h - 16, { font: F.jp(400, 11), color: C.muted, alpha: a * clamp(p * 2 - 1) });
  // d: the same as chapter 5's definitions
  if (o.ch5 > 0.001) tag(ctx, B.x + B.w - 16, JY + LIST_JSON.length * JLH - 4, '5-2 のツールの定義と同じ：名前、何をするか、入力', { font: F.jp(700, 13), h: 24, padX: 10, fill: C.ink, color: C.paper, r: 12, align: 'right', alpha: o.ch5 * a });
}

// ——— n, o: the picture of their own ———————————————————————————————————————————————————————————————————————

function prepareBack(ctx) {
  // the hand: each server's definitions, a group under its name
  let y = HAND.y + 78;
  const groups = SERVERS.map(([name, rows], k) => {
    const head = y;
    const items = rows.map((n, r) => ({ n, y: head + 18 + r * 18, w: n ? measure(ctx, F.mono(500, 12), n) : 40 + hash(k * 11 + r) * 50 }));
    y = head + 18 + rows.length * 18 + 16;
    return { name, head, items, cy: (head - 14 + items[items.length - 1].y + 4) / 2 };
  });
  // the servers outside the frame, each level with its group
  const sv = groups.map((g) => ({ x: 1214, y: g.cy - 30, w: 290, h: 60 }));
  return { groups, sv };
}

// n, o's own picture: the LLM, the harness's frame with the document it has the LLM read and, apart from it,
// what it holds (the definitions the servers sent), the servers outside. The document's rows go one under the
// other; a row's share (0–1) of its height lets definitions come in (n) and leave (o).
function pullBack(ctx, t, s, k) {
  const { at, pace, pop, lit } = k;
  const cue = pace.cue;
  const lead = cue.lead;
  const { groups, sv: SVB } = s.pb;
  const SV = (j) => SVB[j];
  // n: more servers; all their definitions into the document; it gets long
  const sv = [1, ...[1, 2, 3].map((j) => tw(t, at('many') - lead + (j - 1) * 0.22, pace.enter))];
  const svDef = (j) => (j === 0 ? 1 : seg(t, at('many') - lead + (j - 1) * 0.22 + 0.15, at('many') - lead + (j - 1) * 0.22 + 0.75));
  const allAt = at('all') - lead;
  const extraIn = (r) => seg(t, allAt + r * 0.035, allAt + r * 0.035 + 0.3);
  const readN = seg(t, allAt + 0.8, at('long') + 0.2);
  // o: the definitions leave the document; the tool that searches; the LLM's search; the definition found
  const fAt = at('finder') - lead;
  const collapse = inOutCubic(seg(t, fAt, fAt + 0.6));
  const tsIn = seg(t, fAt + 0.35, fAt + 0.85);
  const sAt = at('seek') - lead;
  const markO = sAt - 0.1;
  const openO = markO + 0.35;
  const callO = callRows(ctx);
  const tokO = times(callO.toks.length, openO + 0.25, Math.min(sAt + 1.2, at('readdef') - lead - 1.1), 0.28);
  const finO = tokO[tokO.length - 1] + 0.28;
  const endO = finO + 0.3;
  const nTokO = callO.toks.reduce((n, _, j) => (t >= tokO[j] + 0.28 ? j + 1 : n), 0);
  const askHand = seg(t, endO + 0.05, endO + 0.5);
  const scan = seg(t, endO + 0.45, endO + 0.9);
  const hit = tw(t, endO + 0.5, 0.25);
  const rAt = at('readdef') - lead;
  const back = seg(t, rAt, rAt + 0.7);
  const resIn = tw(t, rAt + 0.55, 0.3);
  const readO = seg(t, rAt + 0.9, rAt + 1.7);
  const [longLit] = lit(['long'], at('n.end'));
  const [finderLit, , readdefLit] = lit(['finder', 'seek', 'readdef'], at('o.end'));

  // ——— the LLM; the harness's frame with its box, the document and the hand; the servers
  llmBlock(ctx, L7, 1, { glow: Math.max(span(t, at('all') - lead + 1.4, at('long') + 0.4), span(t, rAt + 1.4, rAt + 2.0), span(t, sAt + 0.25, endO)) });
  channel(ctx, L7.read, 1, { hot: readN > 0 && readN < 1 || (readO > 0 && readO < 1) });
  channel(ctx, L7.write, 1, { hot: t >= openO && t < endO });
  appFrame(ctx, PB_L, 1, { name: '' });
  harnessBox(ctx, PBB, 1, { glow: Math.max(span(t, allAt - 0.1, allAt + 0.9), span(t, fAt, fAt + 0.9), span(t, endO, rAt + 0.8)) });
  text(ctx, 'LLM に読ませる文書', PBD.x + 2, PBD.y - 14, { font: F.jp(700, 16), color: C.ink2 });

  // the document's rows: bash, the tool that searches (o), GitHub's three, the others (n)
  const rows = [
    { n: 'bash', desc: 'コマンドを実行する', share: 1, a: 1 },
    { n: 'tool_search', desc: 'ツールを探す（例）', share: tsIn, a: tsIn, ts: true },
    { n: 'search_issues', desc: 'Issue を検索する', share: 1 - collapse, a: 1 - collapse },
    { n: 'issue_read', desc: 'Issue の中身を読む', share: 1 - collapse, a: 1 - collapse },
    { n: 'add_issue_comment', desc: 'コメントを書く', share: 1 - collapse, a: 1 - collapse },
    ...Array.from({ length: EXTRA }, (_, r) => ({ w: 46 + hash(r * 7 + 3) * 60, d: 90 + hash(r * 5 + 1) * 120, share: extraIn(r) * (1 - collapse), a: extraIn(r) * (1 - collapse) })),
  ];
  ctx.save();
  ctx.beginPath();
  ctx.rect(PBD.x, PBD.y + 2, PBD.w, PBD.h - 4);
  ctx.clip();
  roleMark(ctx, PBD.x + 18, PBD.y + 14, ROLE.system, { edge: WRITER.system });
  let y = PB_DEF0;
  const rowY = [];
  rows.forEach((r) => {
    rowY.push(y);
    if (r.a > 0.001) {
      if (r.n) {
        const w = text(ctx, r.n, PB_TX, y, { font: PB_FONT, color: C.ink, alpha: r.a });
        text(ctx, '：' + r.desc, PB_TX + w, y, { font: PB_JP, color: C.ink, alpha: r.a });
      } else {
        textBar(ctx, PB_TX, y - 5, r.w, r.a, C.ink2, 8);
        textBar(ctx, PB_TX + r.w + 10, y - 5, r.d, r.a, C.rule, 8);
      }
    }
    y += PB_ROW * r.share;
  });
  const defEnd = y;
  // the request, the call and its result that were there (n), then o's call and the definition found
  const uy = defEnd + 10;
  roleMark(ctx, PBD.x + 18, uy, ROLE.user, { edge: WRITER.user });
  textBar(ctx, PB_TX, uy + 12, 250, 1, C.blueSoft, 10);
  textBar(ctx, PB_TX, uy + 32, 180, 1, C.blueSoft, 10);
  const oldA = 1 - collapse;
  const cy = uy + 52;
  if (oldA > 0.001) {
    ctx.save();
    ctx.globalAlpha *= oldA;
    roleMark(ctx, PBD.x + 18, cy, ROLE.assistant, { edge: WRITER.assistant });
    band(ctx, PB_TX, cy, PB_RIGHT - PB_TX, 44, C.accentSoft, C.accent);
    text(ctx, 'search_issues', PB_TX + 14, cy + 27, { font: PB_MONO, color: C.ink });
    textBar(ctx, PB_TX + 14 + measure(ctx, PB_MONO, 'search_issues') + 10, cy + 22, 120, 1, C.rule, 8);
    roleMark(ctx, PBD.x + 18, cy + 56, ROLE.result, { edge: WRITER.result });
    band(ctx, PB_TX, cy + 56, PB_RIGHT - PB_TX, 36, '#eef6f0', C.green);
    textBar(ctx, PB_TX + 14, cy + 74, 200, 1, C.greenSoft, 8);
    ctx.restore();
  }
  // o: the LLM's call to the tool that searches, and what the harness writes back
  const oc = callO.place(cy);
  if (t >= markO + 0.35) roleMark(ctx, PBD.x + 18, oc.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
  drawCall(ctx, oc, { bandA: tw(t, openO + 0.25, 0.2), open: t >= openO + 0.3, n: nTokO, end: t >= endO });
  const ry = oc.band.y + oc.band.h + 10;
  if (resIn > 0.001) {
    ctx.save();
    ctx.globalAlpha *= resIn;
    roleMark(ctx, PBD.x + 18, ry + 1, ROLE.result, { edge: WRITER.result });
    band(ctx, PB_TX, ry, PB_RIGHT - PB_TX, 60, '#eef6f0', C.green);
    const w = text(ctx, 'search_issues', PB_TX + 14, ry + 24, { font: PB_FONT, color: C.ink });
    text(ctx, '：Issue を検索する', PB_TX + 14 + w, ry + 24, { font: PB_JP, color: C.ink });
    text(ctx, '入力：query（検索する内容）ほか', PB_TX + 14, ry + 46, { font: PB_JP, color: C.ink });
    ctx.restore();
  }
  ctx.restore();
  // the paper's foot: the rest goes on below
  if (defEnd + 10 > PBD.y + PBD.h - 40) {
    const g = ctx.createLinearGradient(0, PBD.y + PBD.h - 60, 0, PBD.y + PBD.h - 4);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(PBD.x + 4, PBD.y + PBD.h - 60, PBD.w - 8, 56);
    ctx.restore();
  }
  // n: how long the definitions make it; o: the tool that searches, the definition found
  const defsBox = { x: PB_TX - 4, y: PB_DEF0 - 17, w: PB_RIGHT - PB_TX + 8, h: Math.min(defEnd, PBD.y + PBD.h - 16) - PB_DEF0 + 8 };
  ringBox(ctx, defsBox, longLit, C.accent, 2);
  const longA = pop('long') * (1 - collapse);
  text(ctx, '定義だけで、', PBD.x + 18, PBD.y + PBD.h - 44, { font: F.jp(700, 14), color: C.accent, alpha: longA });
  text(ctx, 'ここまで長くなる', PBD.x + 18, PBD.y + PBD.h - 24, { font: F.jp(700, 14), color: C.accent, alpha: longA });
  marker(ctx, { x: PB_TX, y: rowY[1] - 14, w: measure(ctx, PB_FONT, 'tool_search') + measure(ctx, PB_JP, '：ツールを探す（例）'), h: 18 }, finderLit * tsIn);
  ringBox(ctx, { x: PB_TX, y: ry, w: PB_RIGHT - PB_TX, h: 60 }, readdefLit * resIn, C.accent, 3);
  sweep(ctx, { doc: PBD }, readN, PBD.y + PBD.h - 30);
  send(ctx, L7.read, seg(t, allAt + 1.1, at('long') + 0.3), '', 'doc');
  sweep(ctx, { doc: PBD }, readO, ry + 60);
  send(ctx, L7.read, seg(t, rAt + 1.2, rAt + 1.8), '', 'doc');

  // ——— the hand: what the servers sent, kept by the harness (apart from the document)
  rr(ctx, HAND.x, HAND.y, HAND.w, HAND.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'ハーネスの手元', HAND.x + 14, HAND.y + 26, { font: F.jp(700, 15), color: C.purple });
  text(ctx, '受け取った定義', HAND.x + 14, HAND.y + 44, { font: F.jp(500, 12), color: C.muted });
  groups.forEach((g, j) => {
    const ga = svDef(j);
    if (ga <= 0.001) return;
    text(ctx, g.name, HAND.x + 14, g.head, { font: F.jp(700, 12), color: C.ink2, alpha: ga });
    g.items.forEach((it, r) => {
      const ia = ga * seg(ga, r / g.items.length * 0.6, r / g.items.length * 0.6 + 0.4);
      if (j === 0 && r === 0 && hit > 0.001) {
        ctx.save();
        ctx.globalAlpha *= hit;
        rr(ctx, HAND.x + 8, it.y - 13, HAND.w - 16, 18, 5);
        ctx.fillStyle = C.greenSoft;
        ctx.fill();
        ctx.restore();
      }
      if (it.n) text(ctx, it.n, HAND.x + 22, it.y, { font: F.mono(500, 12), color: C.ink, alpha: ia });
      else textBar(ctx, HAND.x + 22, it.y - 4, it.w, ia, C.rule, 7);
    });
  });
  // o: the harness searches what it holds (not the servers)
  if (scan > 0 && scan < 1) {
    const sy = lerp(HAND.y + 52, groups[groups.length - 1].items.slice(-1)[0].y + 8, inOutCubic(scan));
    ctx.save();
    ctx.globalAlpha *= clamp(scan * 6) * clamp((1 - scan) * 6);
    ctx.fillStyle = C.accent;
    ctx.fillRect(HAND.x + 8, sy, HAND.w - 16, 3);
    ctx.restore();
  }

  // the servers, outside the frame, joined to it
  text(ctx, 'つないだ MCP サーバー', SV(0).x, SV(0).y - 14, { font: F.jp(700, 15), color: C.ink2 });
  [0, 1, 2, 3].forEach((j) => {
    const a = sv[j];
    if (a <= 0.001) return;
    const B = SV(j);
    const cyj = B.y + B.h / 2;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PBF.x + PBF.w, cyj);
    ctx.lineTo(B.x - PLUG.w / 2, cyj);
    ctx.stroke();
    ctx.restore();
    rr(ctx, B.x, B.y, B.w, B.h, 10);
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
    text(ctx, SERVERS[j][0], B.x + 30, B.y + 28, { font: F.jp(700, 16), color: C.ink, alpha: a });
    text(ctx, 'の MCP サーバー', B.x + 30, B.y + 48, { font: F.jp(500, 12), color: C.muted, alpha: a });
    plug(ctx, B.x, cyj, a, C.ink);
  });

  // ——— in flight
  [1, 2, 3].forEach((j) => {
    const p = seg(t, at('many') - lead + (j - 1) * 0.22 + 0.1, at('many') - lead + (j - 1) * 0.22 + 0.7);
    const B = SV(j);
    flyChip(ctx, [[B.x - 10, B.y + B.h / 2], [HAND.x + HAND.w - 40, groups[j].cy]], p, '定義', 'found');
  });
  flyMark(ctx, PB_FROM, { x: PBD.x + 18, y: oc.band.y }, seg(t, markO, markO + 0.35), ROLE.assistant, { edge: WRITER.assistant });
  const po = seg(t, openO, openO + 0.35);
  if (po > 0 && po < 1) {
    const pt = onPath(writePath(T7, { y: oc.band.y, h: oc.band.h }, oc.open.x + oc.open.w / 2, oc.open.y + MARK_H / 2), inOutCubic(po));
    roleMark(ctx, pt.x - oc.open.w / 2, pt.y - MARK_H / 2, ROLE.call, { edge: WRITER.call, alpha: clamp(po * 8) });
  }
  oc.toks.forEach((tk, j) => {
    const p = seg(t, tokO[j], tokO[j] + 0.28);
    if (p <= 0 || p >= 1) return;
    const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
    const pt = onPath(writePath(T7, { y: oc.band.y, h: oc.band.h }, tk.x + tk.w / 2, tk.y), inOutCubic(p));
    token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
  });
  const pe = seg(t, finO, endO);
  if (pe > 0 && pe < 1) {
    const pt = onPath(writePath(T7, { y: oc.band.y, h: oc.band.h }, oc.end.x + oc.end.w / 2, oc.end.y + MARK_H / 2), inOutCubic(pe));
    roleMark(ctx, pt.x - oc.end.w / 2, pt.y - MARK_H / 2, ROLE.callEnd, { edge: WRITER.callEnd, alpha: clamp(pe * 8) });
  }
  const bandMid = oc.band.y + oc.band.h / 2;
  flyChip(ctx, [[PB_RIGHT - 40, bandMid], [HAND.x + 60, bandMid], [HAND.x + 60, groups[0].items[0].y - 4]], askHand, 'Issue を検索', 'call');
  flyChip(ctx, [[HAND.x + 60, groups[0].items[0].y - 4], [PB_RIGHT - 60, groups[0].items[0].y - 4], [PB_RIGHT - 60, ry + 30], [PB_TX + 120, ry + 30]], back, 'search_issues', 'found');
  flyMark(ctx, PB_FROM, { x: PBD.x + 18, y: ry }, seg(t, rAt + 0.2, rAt + 0.6), ROLE.result, { edge: WRITER.result });

  exampleNote(ctx, PB_L, PB_NOTE, 1, 1);
}

// The call band of the picture's own, laid out where it goes (its top at y).
function callRows(ctx) {
  return {
    toks: PB_CALL.flat(),
    place(y) {
      const c = callLayout(ctx, { x: PB_TX, y, w: PB_RIGHT - PB_TX, h: PB_CALL.length * 26 + 16 }, PB_CALL, 26, { hang: true, font: PB_MONO });
      c.font = PB_MONO;
      return c;
    },
  };
}

// A band in the document: its tint and the stripe of its colour on the left.
function band(ctx, x, y, w, h, fill, stripe) {
  rr(ctx, x, y, w, h, 8);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = stripe;
  ctx.fillRect(x, y + 6, 4, h - 12);
}
