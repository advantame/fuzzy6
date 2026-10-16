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
// the server again). The picture then comes back as 7-3 ends, as world73() lays it out: 7-4 starts from it.
//
// A retained clip (docs/stage.md; the immediate one it replaced, pixel for pixel, is clips/legacy/mcpflow.js).
// It starts from 7-2's last picture (world72: 7-2 is an immediate clip, so its picture is declared here), and the
// bridge moves it into 7-3's own: the tool's place and GitHub narrow, 7-2's note gives way to 7-3's.

import { stage } from '../lib/stage.js';
import * as K from '../lib/kinds.js';
import { C, F } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import { onPath, writePath, MARK_H, docLayout, rowAt, TOKEN, jsonLine } from '../lib/rig.js';
import { T as T64, SYS, defY, callLayout, NOTE_X, NOTE_Y } from '../lib/terminal.js';
import {
  G7, harnessLayout, T7, L7, ACT7, DOC7, TERM7, NET7, DOC7_SHORT, PANEL7, NAME, term64Lines, SERVER7, plug, PLUG,
  textBar, G73, TERM73, SERVER73, NET73, API7, API73, PORT, LOG73, prepare73, NOTE73, marker, EX_FONT, exampleNote,
} from '../lib/harness.js';
import { text, rr, circle, measure as measureOn } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
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

// n times, evenly from a, the last one landing (after a flight of fly) by b
const times = (n, a, b, fly) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - fly - a)) / Math.max(1, n - 1));
// a group's alpha as an immediate clip's alpha() gave it: untouched from 0.999
const snap = (a) => (a >= 0.999 ? 1 : a);
const TOK_FLY = 0.36;

// where the note under the frame stands (lib/harness.js exampleNote's text)
const EX = { o: { font: EX_FONT, color: C.muted } };

// The two geometries the bridge moves between: 7-2's (the tool's place and GitHub wide) and 7-3's.
const AT72 = { G: G7, term: TERM7, srv: SERVER7, net: NET7, apiX: API7.x, narrow: 0, note: NOTE72 };
const AT73 = { G: G73, term: TERM73, srv: SERVER73, net: NET73, apiX: API73.x, narrow: 1, note: NOTE73 };

export default stage({
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
    { id: 'o', still: true, tail: 2.0, rest: 'long', text: 'そこで、{finder}ツールを探すツールを用意して、\n{seek}LLM に、要るツールを探させてから、\n\n{readdef}その定義を読ませる仕組みもあるの。' },
    { id: 'back', lead: 1.5 }, // no voice: the picture of its own gives way to the main one (7-4's first frame)
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
    const jw = (s) => measureOn(ctx, JFONT, s);
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
      return { x: at.x + measureOn(ctx, R.font, before), y: at.y - 16, w: measureOn(ctx, R.font, s), h: 21 };
    };
    const n128 = inR(0, '', '#128');
    const timeout = inR(0, '#128 10/7 からデータベースが', '時間切れ');
    // n, o: the picture of their own
    const pb = prepareBack(ctx);
    // the note under the frame: where exampleNote puts its text
    const exX = L7.app.x + measureOn(ctx, F.jp(700, 17), '例') + 20 + 10;
    const exY = L7.app.y + L7.app.h + 22 + 21;
    return { s73, defs, U, U0, c, R, bashBox, ghBoxes, allBox, names, descs, inputs, flights, n128, timeout, pb, exX, exY };
  },

  // 7-2's last picture: the main picture, as it stands at 7-3's first moment, on 7-2's geometry
  from: (w, f) => picture(w, f, AT72),

  scene(w, f) {
    w.clear();
    picture(w, f, AT73);
  },
});


// The clip's world at f.t, on the geometry g (7-2's or 7-3's: the bridge moves one into the other).
function picture(w, f, g) {
  const { t, at, pace, cue, lead, pop, lit, span, s } = f;
  const { s73, defs, U, U0, c, R, bashBox, ghBoxes, allBox, names, descs, inputs, flights, n128, timeout } = s;
  w.vars.G = g.G;
  const T = harnessLayout(g.G);
  const Lx = T.L;
  const TOOL = Lx.tool;
  const SRV = g.srv;

  // n: the picture pulls back to its own; o: and comes back as the clip ends
  const pOut = inOutCubic(seg(t, at('n'), at('n') + 1.2));
  const pRet = inOutCubic(seg(t, at('back'), at('back') + 1.45));
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
    span(at('b'), at('ask') - lead + 0.35),
    span(at('e'), putAt + 1.0),
    span(markF - 0.1, readF + 0.6),
    span(endF - 0.05, at('send') - lead + 0.3),
    span(at('found') - lead + 1.2, resIn + 0.6),
  );
  const srvGlow = Math.max(
    span(at('ask') - lead + 0.8, at('c') + 0.35),
    span(at('send') - lead + 0.55, at('found') - lead + 0.45),
  );
  const llmGlow = span(readF + 0.55, endF);

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
  const linkHot = span(at('join') - lead, at('join') + 0.6) > 0.5 || (pairLit > 0.5);

  // ——— the main picture, until it pulls back
  if (mainA > 0.001) {
    w.group('main', { a: mainA, scale: lerp(1, 0.94, pOut) });
    const IN = { in: 'main' };
    // the chat screen: 6-4's report and the request
    w.add('screen', K.screen, {}, IN);
    w.add('bubble.report', K.bubble, { b: s73.Br }, IN);
    w.add('bubble.ask', K.bubble, { b: s73.Bu }, IN);
    w.add('links', K.links, { talk: 1, back: 1, talkHot: false, backHot: false }, IN);
    // the LLM, and the frame with its document (cut short while the reply is in the card)
    w.add('frame', K.frame, { docH }, IN);
    w.group('left', { a: snap(leftA) }, IN);
    w.add('llm', K.llm, { glow: Math.max(llmGlow, llmJLit) }, { in: 'left' });
    w.add('ch.read', K.chan, { c: 'read', hot: span(readF, readF + 0.85) > 0.5 }, { in: 'left' });
    w.add('ch.write', K.chan, { c: 'write', hot: llmGlow > 0.5 && t >= openF }, { in: 'left' });
    w.group('right', { a: snap(rightA) }, IN);
    w.add('ch.call', K.chan, { c: 'call', labelAlpha: 1, hot: linkHot || span(at('ask') - lead + 0.3, at('ask') - lead + 0.85) > 0.5 || span(at('send') - lead, at('send') - lead + 0.6) > 0.5 }, { in: 'right' });
    w.add('ch.back', K.chan, { c: 'back', labelAlpha: 1, hot: linkHot || span(at('c') + 0.25, at('c') + 0.75) > 0.5 || span(at('found') - lead + 0.3, at('found') - lead + 0.85) > 0.5 }, { in: 'right' });

    // the document: the head, the request (pushed down as the definitions come in), the call, the result
    w.group('doc', {}, IN);
    const D = { in: 'doc' };
    w.add('doc.sys', K.mark, { x: SYS.x, y: SYS.y + 1, role: 'system' }, D);
    defs.forEach((d, k) => w.add(`doc.def.${k}`, K.def, { d, y: defY(k), p: defP(k) }, D));
    // (the request steps aside while the names fly in, and comes back under them)
    const Uat = t >= putAt + 0.5 ? U : U0;
    const uA = t >= putAt + 0.5 ? seg(t, putAt + 0.75, putAt + 1.1) : 1 - seg(t, putAt, putAt + 0.25);
    w.add('doc.ask', K.entry, { E: Uat, o: { tagAlpha: 0, chars: 1 }, a: uA }, D);
    w.add('doc.ask.mark', K.mark, { x: Uat.x, y: Uat.y + 1, role: 'user', a: uA }, D);
    if (t >= markF + 0.5) w.add('doc.call.0.mark', K.mark, { x: DOC7.x + 18, y: c.band.y + 1, role: 'assistant' }, D);
    w.add('doc.call.0', K.call, { c, o: { bandA: tw(t, openF + 0.4, 0.25), open: t >= openF + 0.5, n: nTok, end: t >= endF } }, D);
    if (resMark >= 1) w.add('doc.res.0.mark', K.mark, { x: R.x, y: R.y + 1, role: 'result' }, D);
    const ri = tw(t, resIn, 0.3);
    if (ri > 0) w.add('doc.res.0', K.entry, { E: R, o: { tagAlpha: 0, chars: seg(t, resIn, resIn + 0.6) }, a: ri }, D);
    w.add('ring.bash', K.ringBox, { b: bashBox, level: sameLit, pad: 2 }, D);
    w.add('ring.defs', K.ringBox, { b: allBox, level: readLit, pad: 2 }, D);
    w.add('ring.search', K.ringBox, { b: ghBoxes[0], level: read2Lit, pad: 2 }, D);
    w.add('ring.call', K.ringBox, { b: c.band, level: Math.max(thatLit, same5Lit), pad: 3 }, D);
    w.add('ring.result', K.ringBox, { b: { x: R.tx, y: R.y, w: R.w, h: R.h }, level: addLit, pad: 3 }, D);
    w.add('ring.n128', K.ringBox, { b: n128, level: n128Lit, pad: 2 }, D);
    w.add('mark.timeout', K.marker, { b: timeout, a: noteLit }, D);
    w.add('timeout', K.text, { s: '時間切れ', x: timeout.x, y: rowAt(R, 0).y, o: { font: R.font, color: C.accent }, a: noteLit * ri }, D);
    // m: the cause is not written yet
    const causeA = pop('cause');
    if (causeA > 0.001) w.add('cause', K.tag, { x: R.tx + R.w - 10, y: rowAt(R, 1).y - 17, s: '原因は？', o: { font: F.jp(700, 13), h: 26, padX: 10, fill: C.accent, color: '#fff', r: 13, align: 'right' }, a: causeA }, D);
    // the reads: the harness hands the document over (f)
    w.add('sweep', K.sweepDoc, { p: seg(t, readF, readF + 0.85), bottom: c.band.y + MARK_H }, D);
    w.add('send', K.sendDoc, { p: seg(t, readF + 0.3, readF + 0.9) }, D);
    // the harness sees where the call ends, and stops the writing (g)
    const lk = span(endF - 0.05, at('mcp') - lead + 0.2);
    if (lk > 0) w.add('look', K.look, { m: c.end, p: tw(t, endF - 0.05, 0.3, inOutCubic), a: lk }, D);
    w.add('halt', K.halt, { a: span(endF, at('mcp') - lead + 0.3) }, D);

    // the harness's box and its loop
    w.group('right.box', { a: snap(rightA) }, IN);
    w.add('harness', K.harness, { glow: actGlow, names: [['アプリ', 0, 26], [NAME, 1, 0]] }, { in: 'right.box' });
    const LP = T7.LOOP;
    w.add('loop', K.loop, {}, IN);
    w.add('loop.label', K.text, { s: 'くり返す', x: LP.x - LP.r - 14, y: LP.y + 6, o: { font: F.jp(700, 16), color: C.purple, align: 'right' } }, IN);
    w.add('ring.harness', K.ringBox, { b: ACT7, level: Math.max(thisLit, resLit, pairLit), pad: 4 }, IN);

    // the tool's place: the shell and GitHub's MCP server; GitHub in the net beyond
    w.group('right.tools', { a: snap(rightA) }, IN);
    const RT = { in: 'right.tools' };
    w.add('tools', K.tools, { lines: term64Lines(() => -100), term: g.term, srv: SRV, plugColor: srvGlow > 0.5 || linkHot ? C.accent : C.ink }, RT);
    w.add('server.glow', serverGlow, { B: SRV, g: srvGlow }, RT);
    w.add('github', K.github, { box: g.net, narrow: g.narrow, scroll, found: foundA }, RT);
    w.add('wire', K.wire, { srv: SRV, x: g.apiX }, RT);
    w.add('pulse.down', pulse, { pts: [[g.apiX, SRV.y + SRV.h], [g.apiX, API7.y - PORT.h / 2]], p: down, color: C.accent }, RT);
    w.add('pulse.up', pulse, { pts: [[g.apiX, API7.y - PORT.h / 2], [g.apiX, SRV.y + SRV.h]], p: up, color: C.green }, RT);
    w.add('ring.github', K.ringBox, { b: g.net, level: apiLit, pad: 4 }, RT);
    // a: the harness's side of the connection; the lane's log
    w.add('plug', K.plug, { color: linkHot ? C.accent : C.purple, a: pop('join') }, RT);
    const rows = [tw(t, at('ask') - lead + 0.45, pace.enter), tw(t, at('c') + 0.55, pace.enter), tw(t, at('mcp') - lead + 0.4, pace.enter), tw(t, at('found') - lead + 0.65, pace.enter)];
    w.add('log', K.log, { rows, a: pop('join') }, RT);
    if (pop('join') > 0.001) {
      w.add('log.list', K.marker, { b: 'log:names.0', a: listLit * rows[0] }, RT);
      w.add('log.call', K.marker, { b: 'log:names.2', a: mcpLit * rows[2] }, RT);
      w.add('ring.log', K.ringBox, { b: 'log:box', level: Math.max(mcp2Lit, talkLit), pad: 4 }, RT);
    }
    w.add('ring.server', K.ringBox, { b: SRV, level: Math.max(ghLit, pairLit), pad: 6 }, IN);
    const qa = pop('mcp2') * (1 - tw(t, at('k'), 0.4));
    if (qa > 0.001) w.add('q', K.tag, { x: LOG73.x + LOG73.w + 4, y: LOG73.y - 16, s: '？', o: { font: F.jp(700, 16), h: 28, padX: 9, fill: C.accent, color: '#fff', r: 14, align: 'right' }, a: qa }, IN);

    // c–e: the card in the frame, with what the server sent (the harness holds it)
    w.add('reply', replyCard, { p: jsonP, names, descs, inputs, nameLit, whatLit, inputLit, ch5: pop('ch5'), a: cardIn * (1 - cardOut) }, IN);

    // under the LLM: what it writes and reads (k), and whose cut its tokens are (f)
    w.group('left.notes', { a: snap(leftA) }, IN);
    w.add('notes', K.notes, { rows: [pop('same5'), pop('nomcp'), tw(t, tok[0] + TOK_FLY, 0.5)] }, { in: 'left.notes' });
    w.add('ring.notes', K.ring, { x: NOTE_X - 120, y: NOTE_Y[0] - 2, w: 240, h: 78, level: nomcpLit, r: 10 }, IN);
    w.add('ring.llm', K.ring, { x: Lx.llm.x, y: Lx.llm.y, w: Lx.write.x1 - Lx.llm.x + 96, h: Lx.llm.h, level: same5Lit, r: 22 }, IN);

    // ——— in flight, over everything
    w.add('fly.assistant', K.flyingMark, { E: { x: DOC7.x + 18, y: c.band.y }, p: seg(t, markF, markF + 0.5), role: 'assistant' }, IN);
    w.add('fly.result', K.flyingMark, { E: R, p: resMark, role: 'result' }, IN);
    const lane = { y: c.band.y, h: c.band.h };
    const po = seg(t, openF, openF + 0.5);
    if (po > 0 && po < 1) {
      const pt = onPath(writePath(T7, lane, c.open.x + c.open.w / 2, c.open.y + MARK_H / 2), inOutCubic(po));
      w.add('fly.open', K.mark, { x: pt.x - c.open.w / 2, y: pt.y - MARK_H / 2, role: 'call', a: clamp(po * 8) }, IN);
    }
    c.toks.forEach((tk, j) => {
      const p = seg(t, tok[j], tok[j] + TOK_FLY);
      if (p <= 0 || p >= 1) return;
      const tw0 = f.measure(TOKEN.font, tk.s) + TOKEN.padX * 2;
      const pt = onPath(writePath(T7, lane, tk.x + tk.w / 2, tk.y), inOutCubic(p));
      w.add(`fly.token.${j}`, K.token, { x: pt.x - tw0 / 2, y: pt.y - TOKEN.h / 2, w: tw0, s: tk.s, a: clamp(p * 8) * clamp((1 - p) * 8) }, IN);
    });
    const pe = seg(t, finF, endF);
    if (pe > 0 && pe < 1) {
      const pt = onPath(writePath(T7, lane, c.end.x + c.end.w / 2, c.end.y + MARK_H / 2), inOutCubic(pe));
      w.add('fly.end', K.mark, { x: pt.x - c.end.w / 2, y: pt.y - MARK_H / 2, role: 'callEnd', a: clamp(pe * 8) }, IN);
    }
    // e: the names, from the card into the document
    flights.forEach((fl, k) => {
      const p = fly(k);
      if (p <= 0 || p >= 1) return;
      const q = inOutCubic(p);
      const x = lerp(fl.from.x - 6, fl.to.x - 6, q);
      const y = lerp(fl.from.y - 4, fl.to.y - 4, q) - Math.sin(Math.PI * q) * 24;
      w.add(`fly.name.${k}`, K.tag, { x, y, s: fl.s, o: { font: F.mono(600, 13), h: 24, padX: 6, fill: '#fff', stroke: C.purple, lw: 2, color: C.ink, r: 6 }, a: clamp(p * 6) * clamp((1 - p) * 6) }, IN);
    });
    // b, g: what the harness sends the server; c, h: what comes back
    const boxOut = [ACT7.x + ACT7.w - 18, ACT7.y + ACT7.h - 16];
    const toServer = [[T.lane, Lx.call.y], [Lx.call.x2, Lx.call.y], [TOOL.x + 40, Lx.call.y]];
    const fromServer = [[TOOL.x, Lx.back.y], [Lx.back.x2, Lx.back.y], [T.lane, Lx.back.y]];
    w.add('fly.list', flyChip, { pts: [boxOut, [T.lane, boxOut[1]], ...toServer], p: c1, s: 'tools/list', kind: 'call', o: { clipX: TOOL.x } }, IN);
    w.add('fly.defs', flyChip, { pts: [...fromServer, [CARD.x + CARD.w - 60, Lx.back.y]], p: c2, s: 'ツールの定義', kind: 'found', o: { clipX: TOOL.x } }, IN);
    const bandOut = [c.band.x + c.band.w - 40, c.band.y + c.band.h / 2];
    // g: the call leaves the document; out of the frame, the harness has turned it into MCP's shape
    const midX = (Lx.call.x1 + Lx.call.x2) / 2;
    if (c3b <= 0) {
      w.add('fly.call', flyChip, { pts: [bandOut, [T.lane, bandOut[1]], [T.lane, Lx.call.y], [midX, Lx.call.y]], p: c3a, s: 'search_issues', kind: 'call', o: { fadeOut: false, hold: c3a >= 1 } }, IN);
      if (c3a >= 1) {
        w.add('call.name', chipAt, { x: midX, y: Lx.call.y, s: 'search_issues', kind: 'call', a: 1 - morph }, IN);
        w.add('call.mcp', chipAt, { x: midX, y: Lx.call.y, s: 'tools/call', kind: 'call', a: morph }, IN);
      }
    } else {
      w.add('fly.mcp', flyChip, { pts: [[midX, Lx.call.y], [Lx.call.x2, Lx.call.y], [TOOL.x + 40, Lx.call.y]], p: c3b, s: 'tools/call', kind: 'call', o: { clipX: TOOL.x, fadeIn: false } }, IN);
    }
    w.add('fly.issue', flyChip, { pts: [...fromServer, [T.lane, boxOut[1]], boxOut], p: c4, s: 'Issue #128', kind: 'found', o: { clipX: TOOL.x } }, IN);

    // ——— MCP's card, above the LLM (it stays)
    w.add('mcpcard', K.mcp, { name: 1, abbr: 1, rows: [1, 1], note: 1, years: [1, 1], plugColor: C.ink, a: mainA * rightA });
    if (mainA * rightA > 0.001) {
      w.add('ring.mcp.list', K.ringBox, { b: 'mcpcard:rows.0', level: listLit, pad: 3 });
      w.add('ring.mcp.call', K.ringBox, { b: 'mcpcard:rows.1', level: mcpLit, pad: 3 });
    }
  }

  // ——— n, o: the picture of their own
  if (backA > 0.001) {
    w.group('back', { a: backA, scale: lerp(1.04, 1, pOut) });
    pullBack(w, f);
  }

  // ——— the end: 7-3's last picture, coming back (7-4 starts from it)
  if (finA > 0.001) {
    const fin = pRet < 1 ? 'fin' : null;
    if (fin) w.group(fin, { a: finA, scale: lerp(0.94, 1, pRet) });
    world73(w, f, fin);
  }

  // ——— the example's note (7-2's gives way: the bridge crosses them; the pull-back has its own)
  if (mainA > 0.001) {
    w.add('note.mark', K.exMark, { a: mainA });
    w.add('note.text', K.text, { s: g.note, x: s.exX, y: s.exY, ...EX, a: mainA }, { bridge: 'cross' });
  }
}

// 7-3's last picture: the frame on G73, the document with GitHub's definitions, the request, the call and its
// result; the lane's log, the harness's socket, MCP's card. 7-4 starts from this world (its ids are the chapter's).
function world73(w, f, fin) {
  const { s } = f;
  const { s73, defs, U, c, R } = s;
  const IN = { in: fin };
  w.add('screen', K.screen, {}, IN);
  w.add('bubble.report', K.bubble, { b: s73.Br }, IN);
  w.add('bubble.ask', K.bubble, { b: s73.Bu }, IN);
  w.add('links', K.links, { talk: 1, back: 1, talkHot: false, backHot: false }, IN);
  w.add('frame', K.frame, {}, IN);
  w.add('llm', K.llm, { glow: 0 }, IN);
  w.add('ch.read', K.chan, { c: 'read', hot: false }, IN);
  w.add('ch.write', K.chan, { c: 'write', hot: false }, IN);
  w.add('ch.call', K.chan, { c: 'call', labelAlpha: 1, hot: false }, IN);
  w.add('ch.back', K.chan, { c: 'back', labelAlpha: 1, hot: false }, IN);
  w.group('doc', {}, IN);
  const D = { in: 'doc' };
  w.add('doc.sys', K.mark, { x: SYS.x, y: SYS.y + 1, role: 'system' }, D);
  defs.forEach((d, k) => w.add(`doc.def.${k}`, K.def, { d, y: defY(k), p: 1 }, D));
  w.add('doc.ask', K.entry, { E: U, o: { tagAlpha: 0, chars: 1 } }, D);
  w.add('doc.ask.mark', K.mark, { x: U.x, y: U.y + 1, role: 'user' }, D);
  w.add('doc.call.0.mark', K.mark, { x: DOC7.x + 18, y: c.band.y + 1, role: 'assistant' }, D);
  w.add('doc.call.0', K.call, { c, o: { bandA: 1, open: true, n: c.toks.length, end: true } }, D);
  w.add('doc.res.0.mark', K.mark, { x: R.x, y: R.y + 1, role: 'result' }, D);
  w.add('doc.res.0', K.entry, { E: R, o: { tagAlpha: 0, chars: 1 } }, D);
  w.add('harness', K.harness, { glow: 0, names: [['アプリ', 0, 26], [NAME, 1, 0]] }, IN);
  const LP = T7.LOOP;
  w.add('loop', K.loop, {}, IN);
  w.add('loop.label', K.text, { s: 'くり返す', x: LP.x - LP.r - 14, y: LP.y + 6, o: { font: F.jp(700, 16), color: C.purple, align: 'right' } }, IN);
  w.add('tools', K.tools, { lines: term64Lines(() => -100), term: TERM73, srv: SERVER73 }, IN);
  w.add('github', K.github, { box: NET73, narrow: 1, scroll: 1, found: 1 }, IN);
  w.add('wire', K.wire, { srv: SERVER73, x: API73.x }, IN);
  w.add('plug', K.plug, {}, IN);
  w.add('log', K.log, { rows: [1, 1, 1, 1] }, IN);
  w.add('notes', K.notes, { rows: [1, 1, 1] }, IN);
  w.add('mcpcard', K.mcp, { name: 1, abbr: 1, rows: [1, 1], note: 1, years: [1, 1], plugColor: C.ink }, IN);
  w.add('note.mark', K.exMark, {}, IN);
  w.add('note.text', K.text, { s: NOTE73, x: s.exX, y: s.exY, ...EX }, IN);
}

// ——— this clip's own kinds ———————————————————————————————————————————————————————————————————————————

// The server at work: a vermilion outline round it (the harness's box's glow). { B, g }
function serverGlow(ctx, p) {
  if (p.g <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(p.g);
  rr(ctx, p.B.x - 6, p.B.y - 6, p.B.w + 12, p.B.h + 12, 14);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();
}

// A signal along a short wire (the server and GitHub's API): a dot. { pts, p, color }
function pulse(ctx, { pts, p, color }) {
  if (p <= 0 || p >= 1) return;
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.globalAlpha *= clamp(p * 6) * clamp((1 - p) * 6);
  ctx.fillStyle = color;
  circle(ctx, pt.x, pt.y, 7);
  ctx.fill();
  ctx.restore();
}

// A chip standing at (x, y): kind 'call' (vermilion), 'found' (green). { x, y, s, kind }
function chipAt(ctx, { x, y, s, kind }, a) {
  drawChip(ctx, x, y, s, kind, a);
}
function drawChip(ctx, x, y, s, kind, a) {
  if (a <= 0.001) return;
  const font = kind === 'call' && /^[\x20-\x7e]+$/.test(s) ? F.mono(600, 15) : F.jp(700, 16);
  tag(ctx, x, y - 15, s, { font, h: 30, padX: 10, fill: kind === 'call' ? C.accent : C.green, color: '#fff', align: 'center', r: 8, alpha: a });
}

// A chip on its way along a polyline (eased overall). { pts, p, s, kind, o: { clipX (it slides in and out under
// the tool's place's left edge), fadeIn, fadeOut (default true), hold (it stays where it ended) } }
function flyChip(ctx, { pts, p, s, kind, o = {} }) {
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
  drawChip(ctx, pt.x, pt.y, s, kind, a);
  ctx.restore();
}

// c, d: the card in the harness's frame, with the definitions the server sent (cut short). { p (how much of the
// JSON is in, row by row), names, descs, inputs (boxes), nameLit, whatLit, inputLit, ch5 }
function replyCard(ctx, o, a) {
  if (a <= 0.001) return;
  const B = CARD;
  const p = o.p;
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
  return B;
}

// ——— n, o: the picture of their own ———————————————————————————————————————————————————————————————————————

function prepareBack(ctx) {
  // the hand: each server's definitions, a group under its name
  let y = HAND.y + 78;
  const groups = SERVERS.map(([name, rows], k) => {
    const head = y;
    const items = rows.map((n, r) => ({ n, y: head + 18 + r * 18, w: n ? measureOn(ctx, F.mono(500, 12), n) : 40 + hash(k * 11 + r) * 50 }));
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
function pullBack(w, f) {
  const { t, at, pace, lead, pop, lit, span, s } = f;
  const { groups, sv: SVB } = s.pb;
  const IN = { in: 'back' };
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
  const toksO = PB_CALL.flat();
  const tokO = times(toksO.length, openO + 0.25, Math.min(sAt + 1.2, at('readdef') - lead - 1.1), 0.28);
  const finO = tokO[tokO.length - 1] + 0.28;
  const endO = finO + 0.3;
  const nTokO = toksO.reduce((n, _, j) => (t >= tokO[j] + 0.28 ? j + 1 : n), 0);
  const askHand = seg(t, endO + 0.05, endO + 0.5);
  const scan = seg(t, endO + 0.45, endO + 0.9);
  const hit = tw(t, endO + 0.5, 0.25);
  const rAt = at('readdef') - lead;
  const back = seg(t, rAt, rAt + 0.7);
  const resIn = tw(t, rAt + 0.5, 0.3);
  const readO = seg(t, rAt + 0.8, rAt + 1.5);
  const [longLit] = lit(['long'], at('n.end'));
  const [finderLit, , readdefLit] = lit(['finder', 'seek', 'readdef'], at('o.end'));

  // ——— the LLM; the harness's frame with its box, the document and the hand; the servers
  w.add('pb.llm', K.llm, { L: L7, glow: Math.max(span(at('all') - lead + 1.4, at('long') + 0.4), span(rAt + 1.25, rAt + 1.7), span(sAt + 0.25, endO)) }, IN);
  w.add('pb.read', K.chan, { L: L7, c: 'read', hot: readN > 0 && readN < 1 || (readO > 0 && readO < 1) }, IN);
  w.add('pb.write', K.chan, { L: L7, c: 'write', hot: t >= openO && t < endO }, IN);
  w.add('pb.frame', K.frame, { L: PB_L }, IN);
  w.add('pb.harness', K.harness, { B: PBB, glow: Math.max(span(allAt - 0.1, allAt + 0.9), span(fAt, fAt + 0.9), span(endO, rAt + 0.8)) }, IN);
  w.add('pb.title', K.text, { s: 'LLM に読ませる文書', x: PBD.x + 2, y: PBD.y - 14, o: { font: F.jp(700, 16), color: C.ink2 } }, IN);

  // the document's rows: bash, the tool that searches (o), GitHub's three, the others (n)
  const rows = [
    { n: 'bash', desc: 'コマンドを実行する', share: 1, a: 1 },
    { n: 'tool_search', desc: 'ツールを探す（例）', share: tsIn, a: tsIn, ts: true },
    { n: 'search_issues', desc: 'Issue を検索する', share: 1 - collapse, a: 1 - collapse },
    { n: 'issue_read', desc: 'Issue の中身を読む', share: 1 - collapse, a: 1 - collapse },
    { n: 'add_issue_comment', desc: 'コメントを書く', share: 1 - collapse, a: 1 - collapse },
    ...Array.from({ length: EXTRA }, (_, r) => ({ w: 46 + hash(r * 7 + 3) * 60, d: 90 + hash(r * 5 + 1) * 120, share: extraIn(r) * (1 - collapse), a: extraIn(r) * (1 - collapse) })),
  ];
  w.group('pb.doc', { clip: { x: PBD.x, y: PBD.y + 2, w: PBD.w, h: PBD.h - 4 } }, IN);
  const D = { in: 'pb.doc' };
  w.add('pb.sys', K.mark, { x: PBD.x + 18, y: PBD.y + 14, role: 'system' }, D);
  let y = PB_DEF0;
  const rowY = [];
  rows.forEach((r, k) => {
    rowY.push(y);
    if (r.a > 0.001) {
      if (r.n) {
        w.add(`pb.def.${k}`, K.text, { s: r.n, x: PB_TX, y, o: { font: PB_FONT, color: C.ink }, a: r.a }, D);
        w.add(`pb.def.${k}.what`, K.text, { s: '：' + r.desc, x: PB_TX + f.measure(PB_FONT, r.n), y, o: { font: PB_JP, color: C.ink }, a: r.a }, D);
      } else {
        w.add(`pb.def.${k}`, bar, { x: PB_TX, y: y - 5, w: r.w, color: C.ink2, h: 8, a: r.a }, D);
        w.add(`pb.def.${k}.what`, bar, { x: PB_TX + r.w + 10, y: y - 5, w: r.d, color: C.rule, h: 8, a: r.a }, D);
      }
    }
    y += PB_ROW * r.share;
  });
  const defEnd = y;
  // the request, the call and its result that were there (n), then o's call and the definition found
  const uy = defEnd + 10;
  w.add('pb.ask.mark', K.mark, { x: PBD.x + 18, y: uy, role: 'user' }, D);
  w.add('pb.ask.0', bar, { x: PB_TX, y: uy + 12, w: 250, color: C.blueSoft, h: 10 }, D);
  w.add('pb.ask.1', bar, { x: PB_TX, y: uy + 32, w: 180, color: C.blueSoft, h: 10 }, D);
  const oldA = 1 - collapse;
  const cy = uy + 52;
  if (oldA > 0.001) {
    w.group('pb.old', { a: oldA }, D);
    const O = { in: 'pb.old' };
    w.add('pb.old.mark', K.mark, { x: PBD.x + 18, y: cy, role: 'assistant' }, O);
    w.add('pb.old.call', band, { x: PB_TX, y: cy, w: PB_RIGHT - PB_TX, h: 44, fill: C.accentSoft, stripe: C.accent }, O);
    w.add('pb.old.name', K.text, { s: 'search_issues', x: PB_TX + 14, y: cy + 27, o: { font: PB_MONO, color: C.ink } }, O);
    w.add('pb.old.input', bar, { x: PB_TX + 14 + f.measure(PB_MONO, 'search_issues') + 10, y: cy + 22, w: 120, color: C.rule, h: 8 }, O);
    w.add('pb.old.res.mark', K.mark, { x: PBD.x + 18, y: cy + 56, role: 'result' }, O);
    w.add('pb.old.res', band, { x: PB_TX, y: cy + 56, w: PB_RIGHT - PB_TX, h: 36, fill: '#eef6f0', stripe: C.green }, O);
    w.add('pb.old.res.row', bar, { x: PB_TX + 14, y: cy + 74, w: 200, color: C.greenSoft, h: 8 }, O);
  }
  // o: the LLM's call to the tool that searches, and what the harness writes back
  const oc = callLayout(f.ctx, { x: PB_TX, y: cy, w: PB_RIGHT - PB_TX, h: PB_CALL.length * 26 + 16 }, PB_CALL, 26, { hang: true, font: PB_MONO });
  oc.font = PB_MONO;
  if (t >= markO + 0.35) w.add('pb.call.mark', K.mark, { x: PBD.x + 18, y: oc.band.y + 1, role: 'assistant' }, D);
  w.add('pb.call', K.call, { c: oc, o: { bandA: tw(t, openO + 0.25, 0.2), open: t >= openO + 0.3, n: nTokO, end: t >= endO } }, D);
  const ry = oc.band.y + oc.band.h + 10;
  if (resIn > 0.001) {
    w.group('pb.res', { a: resIn }, D);
    const Rr = { in: 'pb.res' };
    w.add('pb.res.mark', K.mark, { x: PBD.x + 18, y: ry + 1, role: 'result' }, Rr);
    w.add('pb.res.band', band, { x: PB_TX, y: ry, w: PB_RIGHT - PB_TX, h: 60, fill: '#eef6f0', stripe: C.green }, Rr);
    w.add('pb.res.name', K.text, { s: 'search_issues', x: PB_TX + 14, y: ry + 24, o: { font: PB_FONT, color: C.ink } }, Rr);
    w.add('pb.res.what', K.text, { s: '：Issue を検索する', x: PB_TX + 14 + f.measure(PB_FONT, 'search_issues'), y: ry + 24, o: { font: PB_JP, color: C.ink } }, Rr);
    w.add('pb.res.input', K.text, { s: '入力：query（検索する内容）ほか', x: PB_TX + 14, y: ry + 46, o: { font: PB_JP, color: C.ink } }, Rr);
  }
  // the paper's foot: the rest goes on below
  if (defEnd + 10 > PBD.y + PBD.h - 40) w.add('pb.foot', foot, {}, IN);
  // n: how long the definitions make it; o: the tool that searches, the definition found
  const defsBox = { x: PB_TX - 4, y: PB_DEF0 - 17, w: PB_RIGHT - PB_TX + 8, h: Math.min(defEnd, PBD.y + PBD.h - 16) - PB_DEF0 + 8 };
  w.add('pb.ring.defs', K.ringBox, { b: defsBox, level: longLit, pad: 2 }, IN);
  const longA = pop('long') * (1 - collapse);
  w.add('pb.long.0', K.text, { s: '定義だけで、', x: PBD.x + 18, y: PBD.y + PBD.h - 44, o: { font: F.jp(700, 14), color: C.accent }, a: longA }, IN);
  w.add('pb.long.1', K.text, { s: 'ここまで長くなる', x: PBD.x + 18, y: PBD.y + PBD.h - 24, o: { font: F.jp(700, 14), color: C.accent }, a: longA }, IN);
  w.add('pb.finder', K.marker, { b: { x: PB_TX, y: rowY[1] - 14, w: f.measure(PB_FONT, 'tool_search') + f.measure(PB_JP, '：ツールを探す（例）'), h: 18 }, a: finderLit * tsIn }, IN);
  w.add('pb.ring.found', K.ringBox, { b: { x: PB_TX, y: ry, w: PB_RIGHT - PB_TX, h: 60 }, level: readdefLit * resIn, pad: 3 }, IN);
  w.add('pb.sweep.n', K.sweepDoc, { L: { doc: PBD }, p: readN, bottom: PBD.y + PBD.h - 30 }, IN);
  w.add('pb.send.n', K.sendDoc, { p: seg(t, allAt + 1.1, at('long') + 0.3) }, IN);
  w.add('pb.sweep.o', K.sweepDoc, { L: { doc: PBD }, p: readO, bottom: ry + 60 }, IN);
  w.add('pb.send.o', K.sendDoc, { p: seg(t, rAt + 1.0, rAt + 1.6) }, IN);

  // ——— the hand: what the servers sent, kept by the harness (apart from the document)
  w.add('pb.hand', hand, {}, IN);
  groups.forEach((g, j) => {
    const ga = svDef(j);
    if (ga <= 0.001) return;
    w.add(`pb.hand.${j}`, K.text, { s: g.name, x: HAND.x + 14, y: g.head, o: { font: F.jp(700, 12), color: C.ink2 }, a: ga }, IN);
    g.items.forEach((it, r) => {
      const ia = ga * seg(ga, r / g.items.length * 0.6, r / g.items.length * 0.6 + 0.4);
      if (j === 0 && r === 0 && hit > 0.001) w.add('pb.hit', hitRow, { y: it.y, a: hit }, IN);
      if (it.n) w.add(`pb.hand.${j}.${r}`, K.text, { s: it.n, x: HAND.x + 22, y: it.y, o: { font: F.mono(500, 12), color: C.ink }, a: ia }, IN);
      else w.add(`pb.hand.${j}.${r}`, bar, { x: HAND.x + 22, y: it.y - 4, w: it.w, color: C.rule, h: 7, a: ia }, IN);
    });
  });
  // o: the harness searches what it holds (not the servers)
  if (scan > 0 && scan < 1) w.add('pb.scan', scanLine, { y: lerp(HAND.y + 52, groups[groups.length - 1].items.slice(-1)[0].y + 8, inOutCubic(scan)), a: clamp(scan * 6) * clamp((1 - scan) * 6) }, IN);

  // the servers, outside the frame, joined to it
  w.add('pb.servers', K.text, { s: 'つないだ MCP サーバー', x: SVB[0].x, y: SVB[0].y - 14, o: { font: F.jp(700, 15), color: C.ink2 } }, IN);
  [0, 1, 2, 3].forEach((j) => {
    if (sv[j] <= 0.001) return;
    w.add(`pb.server.${j}`, server, { B: SVB[j], name: SERVERS[j][0], a: sv[j] }, IN);
  });

  // ——— in flight
  [1, 2, 3].forEach((j) => {
    const p = seg(t, at('many') - lead + (j - 1) * 0.22 + 0.1, at('many') - lead + (j - 1) * 0.22 + 0.7);
    const B = SVB[j];
    w.add(`pb.fly.defs.${j}`, flyChip, { pts: [[B.x - 10, B.y + B.h / 2], [HAND.x + HAND.w - 40, groups[j].cy]], p, s: '定義', kind: 'found' }, IN);
  });
  w.add('pb.fly.assistant', K.flyingMark, { T: PB_FROM, E: { x: PBD.x + 18, y: oc.band.y }, p: seg(t, markO, markO + 0.35), role: 'assistant' }, IN);
  const lane = { y: oc.band.y, h: oc.band.h };
  const po = seg(t, openO, openO + 0.35);
  if (po > 0 && po < 1) {
    const pt = onPath(writePath(T7, lane, oc.open.x + oc.open.w / 2, oc.open.y + MARK_H / 2), inOutCubic(po));
    w.add('pb.fly.open', K.mark, { x: pt.x - oc.open.w / 2, y: pt.y - MARK_H / 2, role: 'call', a: clamp(po * 8) }, IN);
  }
  oc.toks.forEach((tk, j) => {
    const p = seg(t, tokO[j], tokO[j] + 0.28);
    if (p <= 0 || p >= 1) return;
    const tw0 = f.measure(TOKEN.font, tk.s) + TOKEN.padX * 2;
    const pt = onPath(writePath(T7, lane, tk.x + tk.w / 2, tk.y), inOutCubic(p));
    w.add(`pb.fly.token.${j}`, K.token, { x: pt.x - tw0 / 2, y: pt.y - TOKEN.h / 2, w: tw0, s: tk.s, a: clamp(p * 8) * clamp((1 - p) * 8) }, IN);
  });
  const pe = seg(t, finO, endO);
  if (pe > 0 && pe < 1) {
    const pt = onPath(writePath(T7, lane, oc.end.x + oc.end.w / 2, oc.end.y + MARK_H / 2), inOutCubic(pe));
    w.add('pb.fly.end', K.mark, { x: pt.x - oc.end.w / 2, y: pt.y - MARK_H / 2, role: 'callEnd', a: clamp(pe * 8) }, IN);
  }
  const bandMid = oc.band.y + oc.band.h / 2;
  w.add('pb.fly.ask', flyChip, { pts: [[PB_RIGHT - 40, bandMid], [HAND.x + 60, bandMid], [HAND.x + 60, groups[0].items[0].y - 4]], p: askHand, s: 'Issue を検索', kind: 'call' }, IN);
  w.add('pb.fly.found', flyChip, { pts: [[HAND.x + 60, groups[0].items[0].y - 4], [PB_RIGHT - 60, groups[0].items[0].y - 4], [PB_RIGHT - 60, ry + 30], [PB_TX + 120, ry + 30]], p: back, s: 'search_issues', kind: 'found' }, IN);
  w.add('pb.fly.result', K.flyingMark, { T: PB_FROM, E: { x: PBD.x + 18, y: ry }, p: seg(t, rAt + 0.2, rAt + 0.6), role: 'result' }, IN);

  w.add('pb.note', pbNote, {}, IN);
}

// A bar standing for a row of text. { x, y, w, color, h }
function bar(ctx, p, a) {
  textBar(ctx, p.x, p.y, p.w, a, p.color, p.h);
  return { x: p.x, y: p.y - p.h / 2, w: p.w, h: p.h };
}

// A band in the document: its tint and the stripe of its colour on the left. { x, y, w, h, fill, stripe }
function band(ctx, p) {
  rr(ctx, p.x, p.y, p.w, p.h, 8);
  ctx.fillStyle = p.fill;
  ctx.fill();
  ctx.fillStyle = p.stripe;
  ctx.fillRect(p.x, p.y + 6, 4, p.h - 12);
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

// the paper's foot, where the rest goes on below
function foot(ctx) {
  const g = ctx.createLinearGradient(0, PBD.y + PBD.h - 60, 0, PBD.y + PBD.h - 4);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(PBD.x + 4, PBD.y + PBD.h - 60, PBD.w - 8, 56);
  ctx.restore();
}

// the hand's card, apart from the document
function hand(ctx) {
  rr(ctx, HAND.x, HAND.y, HAND.w, HAND.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'ハーネスの手元', HAND.x + 14, HAND.y + 26, { font: F.jp(700, 15), color: C.purple });
  text(ctx, '受け取った定義', HAND.x + 14, HAND.y + 44, { font: F.jp(500, 12), color: C.muted });
  return HAND;
}

// the row of the hand the search finds. { y }
function hitRow(ctx, p, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, HAND.x + 8, p.y - 13, HAND.w - 16, 18, 5);
  ctx.fillStyle = C.greenSoft;
  ctx.fill();
  ctx.restore();
}

// the harness searching what it holds. { y }
function scanLine(ctx, p, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = C.accent;
  ctx.fillRect(HAND.x + 8, p.y, HAND.w - 16, 3);
  ctx.restore();
}

// one MCP server outside the frame, joined to it. { B, name }
function server(ctx, { B, name }, a) {
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
  text(ctx, name, B.x + 30, B.y + 28, { font: F.jp(700, 16), color: C.ink, alpha: a });
  text(ctx, 'の MCP サーバー', B.x + 30, B.y + 48, { font: F.jp(500, 12), color: C.muted, alpha: a });
  plug(ctx, B.x, cyj, a, C.ink);
  return B;
}

// the pull-back's own note under its frame
function pbNote(ctx) {
  exampleNote(ctx, PB_L, PB_NOTE, 1, 1);
}
