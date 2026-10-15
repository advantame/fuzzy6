// 5-3: writing the call. Told from the designer's side (Boss, 2026-10-15), like 5-1 and 5-2: now we
// decide in what form the LLM is to write a tool call. If it wrote its request as plain text, the app
// could hardly tell an answer from a request to a tool, and even knowing it is a request, reading which
// tool and what input out of free text is hard. So we fix a form: in this picture, the call between
// two call marks, the tool's name and input in between, as JSON a program reads easily; the model's
// makers train the LLM to write calls in this form. The call is written like any text, one token at a
// time: the call mark, then the name and the input, token by token. When the end mark comes, the
// writing is stopped there and the app receives the name and the input — the same way the end of an
// answer was stopped in 4-2. Anthropic's API reports the stop as tool_use. Writing a call does not run
// the tool: the app outside the model runs it, automatically or after asking a person, as it is set
// up to. How the marks and the name are written differs between models: the last picture sets a call
// written to gpt-oss's format (harmony) beside this picture's, where the name is the recipient and the
// input the message body.
//
// The layout is the chapter's (lib/rig.js toolUseLayout). The clip joins 5-2 (spec §6.10): its first
// frame is 5-2's last picture, drawn here as toolspec.js draws it, and the bridge folds the
// definitions at the document's head down to get_weather's and lifts the veil from the tool's place.
// The call's form (the marks, one JSON for the name and the input) is this picture's, an example: no
// common start-of-call token exists (research/tool-facts, 論点 3), so no first-token probabilities are
// drawn. The JSON is cut into tokens as o200k_base cuts it. The gpt-oss call is made to fit the format,
// not a real output.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import {
  toolUseLayout, chatScreen, screenBubbles, chatBubble, screenLinks, writePath, edgeKey,
  llmBlock, appFrame, toolBox, channel, actor, token, TOKEN, onPath, docLayout, docEntry, sweep, send, stopBadge,
  roleMark, markWidth, MARK_H, ROLE, BY, WRITER,
} from '../lib/rig.js';
import { text, measure, rr, path, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { focus, ring } from '../../../src/kit/cue.js';

const T = toolUseLayout();
const { L, ACT, SCREEN, NOTE } = T;
const TOOL = L.tool;
const DOC = L.doc;

// ——— 5-2's picture, as toolspec.js has it (its last frame is this clip's first)
const Q = 'あしたの京都の天気は？';
const REQ = 'あしたの京都の天気予報を調べたい';
const REQ_NOTE = '頼みの中身を、ふつうの言葉で表したもの（実際の形は 5-3）';
const ANS = 'あしたの京都は晴れで、最高気温は24℃の予報です。';
const RESULT = '京都　あした：晴れ　最高 24℃';
const KINDS = [['天気予報', '都市と日 → 予報'], ['検索', '言葉 → 文章'], ['計算機', '式 → 答え']];
const ROW = { x: TOOL.x + 20, y: TOOL.y + 20, w: TOOL.w - 40, h: (TOOL.h - 40 - 22) / 3, gap: 11 };
const rowBox = (i) => ({ x: ROW.x, y: ROW.y + i * (ROW.h + ROW.gap), w: ROW.w, h: ROW.h });
const glyphBox = (r) => ({ x: r.x + r.w - 124, y: r.y + 12, w: 110, h: r.h - 24 });
const DFONT = F.jp(500, 19);
const DNAME = F.jp(700, 19);
const DLH = 29;
const DTOP = DOC.y + 26;
const DX = DOC.x + 18 + 122 + 12; // where the entries' text starts (docLayout's tx)
const INDENT = 19;
const SYS = { x: DOC.x + 18, y: DTOP };
const DEFS = [
  { segs: [['使えるツール', 'head']] },
  { segs: [['get_weather', 'name'], ['：', ''], ['都市と日の天気予報を返す', 'desc']] },
  { indent: true, segs: [['入力：city（都市）、day（日）', 'input']] },
  { indent: true, segs: [['使うとき：天気を聞かれたとき', 'use']] },
  { segs: [['search_web', 'name'], ['：', ''], ['Web を検索して、関係する文章を返す', 'desc']] },
  { indent: true, segs: [['入力：query（検索の言葉）', 'input']] },
  { segs: [['calculate', 'name'], ['：', ''], ['式を計算する', 'desc']] },
  { indent: true, segs: [['入力：expression（式）', 'input']] },
  { ghost: [96, 200], label: 'ほかのツールの定義' },
  { ghost: [80, 160] },
];
const defY = (k) => DTOP + 21 + DLH * k;
const SHIFT52 = 28 + DLH * 9 + 40; // where 5-2 leaves the conversation: under ten rows of definitions
const NOTE52 = '定義と会話は説明のための例。文書の頭に置くのは、この図の約束';

// ——— this clip
// The head keeps get_weather's name and input (sentence d points at the input); the rest folds into one
// row. The conversation moves up under it, the open assistant mark a little lower, to leave room for
// this picture's caption above the call.
const KEEP = 3; // rows 0–2 of DEFS stay
const FOLDED = 'search_web、calculate などの定義（省略）';
const SHIFT_Q = 28 + DLH * KEEP + 40; // the question, under four rows
const SHIFT_A = SHIFT_Q + 28; // the open mark and the call
// the call as this picture writes it: a mark, the JSON in three rows, the end mark. The JSON is
// {"name": "get_weather", "input": {"city": "京都", "day": "あした"}}, cut as o200k_base cuts it (23
// tokens), broken into rows at its spaces.
const CALL_ROWS = [
  ['{"', 'name', '":', ' "', 'get', '_weather', '",'],
  [' "', 'input', '":', ' {"', 'city', '":', ' "', '京都', '",'],
  [' "', 'day', '":', ' "', 'あ', 'した', '"}}'],
];
const CFONT = F.mono(500, 18);
const CLH = 36;
const FORM_NOTE = 'この図の形（説明のための例）';
// gpt-oss's harmony format, the same call made to fit it (research/tool-facts「gpt-oss の実形式例」):
// the name is the recipient in the header, the input the message body. Broken into rows to fit.
const OSS = [
  [['<|start|>', 'sp'], ['assistant', 'tx'], ['<|channel|>', 'sp']],
  [['commentary ', 'tx'], ['to=functions.get_weather', 'name']],
  [['<|constrain|>', 'sp'], ['json', 'tx'], ['<|message|>', 'sp']],
  [['{"city":"京都","day":"あした"}', 'input'], ['<|call|>', 'sp']],
];
const OFONT = F.mono(500, 15);
const OSPEC = F.mono(600, 15);
const CARD = { x: 1096, y: 100, w: 408, h: 326 };

const FLY = 0.55; // a mark flying out of the app's box
const TOK = 0.42; // a token along the write channel and into its place
const EOT = 0.75; // a mark the LLM writes, the same way
const TAKE = 1.0; // the name and the input, from the call into the app's box

const span = (t, a, b, rise = 0.25, fall = 0.35) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n token times, evenly from a, the last one landing by b
const times = (n, a, b) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - TOK - a)) / Math.max(1, n - 1));

export default clip({
  id: 'toolcall',
  title: '呼び出しを書く',
  kicker: '印と JSON で書く',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.9, // 5-2's definitions fold up; skipped unless the clip is joined from 5-2
  script: [
    { id: 'a', text: '次は、{form}ツール呼び出しを、\nどんな形で書かせるかを決めましょう。' },
    { id: 'b', text: '頼みを、{plain}ふつうの文章だけで書かせたら、どうなるかしら。' },
    { id: 'c', text: '{look}アプリには、{ans}それが答えなのか、{req}ツールへの頼みなのか、\n{hard}区別しにくくなるわね。' },
    { id: 'd', still: true, text: '頼みだとわかっても、{which}どのツールに{what}何を渡せばいいのかを、\n{free}自由な文章から読み取るのは大変ね。' },
    { id: 'e', text: 'そこで、{decide}ツール呼び出しを書く形を、決めておくの。' },
    { id: 'f', text: '{fig}この図では、{marks}呼び出しの印で挟んで、\n[その間に|そのあいだに]、{nm}ツールの名前と{inp}入力を書くわ。' },
    { id: 'g', still: true, text: '中身は、{easy}プログラムが読み取りやすい、\n{json}[JSON|ジェイソン] という形よ。' },
    { id: 'h', text: 'モデルを作る側は、{form2}この形で呼び出しを書けるように、\n{train}LLM を学習させておくわ。' },
    { id: 'i', lead: 1.0, text: '{same}ツール呼び出しも、ふつうの文章と同じで、\n{one}次のトークンを一つずつ選んで書いていくの。' },
    { id: 'j', tail: 1.2, text: 'まず{open}呼び出しの印を書き、続けて、\n{body}ツールの名前と入力を、トークンごとに書いていくわ。' },
    { id: 'k', text: '{fin}終わりの印が出たところで{stop}書かせるのを止めれば、\n{take}アプリが、ツールの名前と入力を受け取れるわね。' },
    { id: 'k2', still: true, text: '{like}答えの終わりの印で止めたのと、同じやり方よ。' },
    { id: 'l', text: '{api}Anthropic の API では、呼び出しで止まったことを、\n{use}[tool_use|ツールユース] という[値|あたい]で知らせてくれるわ。' },
    { id: 'm', by: 'zunda', text: '{wr}呼び出しを書いたら、{run}それだけでツールが動くのだ？' },
    { id: 'n', text: 'いいえ。{app}動かすのは、モデルの外にあるアプリよ。' },
    { id: 'n2', still: true, text: '{auto}自動で動かすか、{ask}人に確かめてから動かすかも、\n{own}アプリの側で決めておくの。' },
    { id: 'o', lead: 0.8, text: '{vary}印や名前の書き方は、モデルによって違うわ。\n{oss}[右上|みぎうえ]は、[gpt-oss|ジーピーティーオーエスエス] というモデルの形式に合わせた例よ。' },
    { id: 'o2', tail: 1.0, text: 'この形式では、{dest}ツールの名前を宛先に、{body2}入力を本文に書くの。' },
  ],

  prepare(ctx) {
    const ent = (role, s, kind = 'text') => ({ role, text: s, kind });
    // 5-1's document, laid out as 5-1 lays it out; this clip keeps its first two entries
    const E = docLayout(ctx, L, [
      ent('user', Q), { ...ent('assistant', REQ, 'call'), gap: 54 }, ent('result', RESULT, 'data'), ent('assistant', ANS),
    ], T.DOC);
    const B = screenBubbles(ctx, SCREEN, [['user', Q], ['assistant', 'あしたの京都の天気予報を\n調べたい']]);
    const defs = DEFS.map((r) => {
      let x = DX + (r.indent ? INDENT : 0);
      const segs = (r.segs ?? []).map(([s, part]) => {
        const font = part === 'name' ? DNAME : DFONT;
        const w = measure(ctx, font, s);
        const out = { s, part, font, x, w, n: Array.from(s).length };
        x += w;
        return out;
      });
      const right = r.ghost ? DX + r.ghost[0] + INDENT + r.ghost[1] : x;
      return { ...r, segs, right, n: segs.reduce((n, sg) => n + sg.n, 0) };
    });

    // the call: its band, its marks, and where each token lands
    const y0 = E[1].y + SHIFT_A;
    const band = { x: E[1].tx, y: y0, w: E[1].w, h: CALL_ROWS.length * CLH + 18 };
    const tx0 = band.x + 17;
    const base = (r) => band.y + 9 + r * CLH + 25;
    const openW = markWidth(ctx, ROLE.call.name);
    const endW = markWidth(ctx, ROLE.callEnd.name);
    const jx = tx0 + openW + 12;
    const open = { x: tx0, y: band.y + 9 + 4, w: openW };
    const toks = [];
    const rowEnd = [];
    CALL_ROWS.forEach((row, r) => {
      let x = jx;
      row.forEach((s) => {
        const w = measure(ctx, CFONT, s);
        toks.push({ s, x, w, r, y: base(r) - 9, base: base(r) });
        x += w;
      });
      rowEnd.push(x);
    });
    const last = CALL_ROWS.length - 1;
    const end = { x: rowEnd[last] + 12, y: band.y + 9 + last * CLH + 4, w: endW };
    // the name's and the input's tokens (they go to the app together)
    const nameToks = toks.filter((tk) => tk.s === 'get' || tk.s === '_weather');
    const name = { x: nameToks[0].x, w: nameToks[1].x + nameToks[1].w - nameToks[0].x, y: base(0) };
    // the template's slots (sentence f): the name's row, and the input's two rows up to the end mark
    const nameSlot = { x: jx, y: base(0) - 22, w: rowEnd[0] - jx, h: 30 };
    const inSlot = { x: jx, y: base(1) - 22, w: end.x - 12 - jx, h: CLH + 30 };
    const inputFrom = { x: jx + 60, w: 120, y: base(1) };

    // what the app receives, docked left of its box (sentence k); how it may run it (sentence n2)
    const tagW = (s, font, pad) => measure(ctx, font, s) + pad * 2;
    const RX = ACT.x - 22;
    const recv = { label: 'アプリが受け取る', name: 'get_weather', input: '京都、あした' };
    const wName = tagW(recv.name, F.mono(600, 16), 10);
    const wIn = tagW(recv.input, F.jp(700, 16), 10);
    const xIn = RX - wIn;
    const xName = xIn - 8 - wName;
    const xRecv = xName - 12;
    const ways = ['自動で動かす', '人に確かめてから動かす'];
    const wWay = ways.map((s) => tagW(s, F.jp(700, 15), 10));
    const xWay1 = RX - wWay[1];
    const xSlash = xWay1 - 10;
    const xWay0 = xSlash - measure(ctx, F.jp(500, 16), '／') - 10 - wWay[0];

    // gpt-oss's call, row by row
    const oss = OSS.map((row) => {
      let x = CARD.x + 20;
      return row.map(([s, kind]) => {
        const font = kind === 'sp' ? OSPEC : OFONT;
        const w = measure(ctx, font, s);
        const out = { s, kind, font, x, w };
        x += w;
        return out;
      });
    });
    return {
      E, B, defs, band, open, end, toks, name, nameSlot, inSlot, inputFrom,
      side: { xRecv, xName, wName, xIn, wIn, recv, ways, wWay, xWay0, xSlash, xWay1 },
      oss, qW: measure(ctx, E[0].font, Q), reqW: measure(ctx, E[1].font, REQ),
    };
  },

  draw(ctx, t, s, { at, pace }) {
    const { E, B, defs, band, open, end, toks, name, nameSlot, inSlot, inputFrom, side, oss, reqW } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (names, until) => focus(t, names.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 5-2's definitions fold to get_weather's, the conversation moves up, the veil
    // over the tool's place lifts. The first frame is 5-2's untouched.
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.55));
    const fresh = inOutCubic(seg(t, br * 0.4, br));
    const move = inOutCubic(seg(t, 0, br));
    const shiftQ = lerp(SHIFT52, SHIFT_Q, move);
    const shiftA = lerp(SHIFT52, SHIFT_A, move);

    // ——— when things happen
    const plainAt = at('plain') - lead;
    const bandOff = 1 - tw(t, plainAt, 0.5); // b: the band's colour comes off
    const plainOff = 1 - tw(t, at('e'), 0.4); // e: the plain request is taken back
    const lookAt = at('look') - lead;
    const offC = 1 - tw(t, at('d'), 0.4);
    const qBox = pop('hard') * (1 - tw(t, at('decide') - lead, 0.4));
    // e–g: the form, drawn as a template; i: it gives way to the LLM's writing
    const tplOff = 1 - tw(t, at('i'), 0.4);
    const read = at('i');
    const openAt = Math.max(at('one') - lead, read + 1.05);
    const tokAt = times(toks.length, at('body') - 0.1, at('j.done'));
    const lastTok = tokAt[tokAt.length - 1] + TOK;
    const finAt = Math.max(at('fin') - lead, lastTok);
    const stopAt = at('stop') - lead;
    const takeAt = Math.max(at('take') - lead, finAt + EOT);
    // each lands in its dock at the end of its flight
    const docked = [tw(t, takeAt + TAKE - 0.1, 0.15), tw(t, takeAt + 0.15 + TAKE - 0.1, 0.15)];
    const bandOn = tw(t, openAt + EOT - 0.05, 0.25); // the band, once the LLM has begun the call
    // o: the screen gives way to gpt-oss's call
    const scr = 1 - tw(t, at('o'), 0.5);

    // who is at work
    const [appLit] = lit(['app'], at('n.end'));
    const [ownLit] = lit(['own'], at('n2.end'));
    const actGlow = Math.max(
      span(t, lookAt, at('d') - 0.2),
      span(t, at('easy') - lead, at('json')),
      span(t, read, read + 1.0),
      span(t, stopAt, takeAt + TAKE),
      appLit, ownLit,
    );
    const llmGlow = Math.max(span(t, at('same') - lead, Math.min(stopAt, finAt + EOT)), span(t, at('train') - lead + 0.5, at('train') + 0.9));

    // ——— the chat screen (sentence c: would the app show the request as an answer?)
    const [ansLit, reqLit] = lit(['ans', 'req'], at('hard'));
    chatScreen(ctx, SCREEN, scr);
    chatBubble(ctx, B[0], { alpha: scr });
    const ghostB = pop('ans') * offC;
    if (ghostB > 0) dashedBubble(ctx, B[1], ghostB);
    if (scr > 0.001) {
      ctx.save();
      ctx.globalAlpha *= scr;
      screenLinks(ctx, T, { talk: 1, back: 1, backHot: ansLit > 0.5 });
      ctx.restore();
    }

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, L, 1, { name: '' });
    llmBlock(ctx, L, 1, { glow: llmGlow });
    channel(ctx, L.read, 1);
    channel(ctx, L.write, 1, { hot: llmGlow > 0.5 && t < stopAt });
    channel(ctx, L.call, 1, { hot: reqLit > 0.5 });
    channel(ctx, L.back, 1);
    if (ghostB > 0) {
      const b = B[1];
      qMark(ctx, b.x + b.L.w + 26, b.y + b.L.h / 2, pop('ans') * offC);
    }
    qMark(ctx, (L.call.x1 + L.call.x2) / 2, L.call.y, pop('req') * offC);

    // ——— the document: the conversation, under the head
    ctx.save();
    ctx.beginPath();
    ctx.rect(DOC.x, DOC.y, DOC.w, DOC.h);
    ctx.clip();
    ctx.save();
    ctx.translate(0, shiftQ);
    docEntry(ctx, E[0], 1, { tagAlpha: 0 });
    ctx.restore();
    // 5-2's request, in plain words on the call's band; the band's colour comes off (b), the words
    // go (e)
    if (plainOff > 0) {
      ctx.save();
      ctx.translate(0, shiftA);
      if (t <= plainAt) docEntry(ctx, E[1], plainOff, { tagAlpha: 0 });
      else plainRequest(ctx, E[1], bandOff, plainOff, 17 * bandOff);
      ctx.restore();
    }
    ctx.restore();

    // ——— the definitions at the head
    defs.forEach((r, k) => {
      if (k < KEEP) drawDef(ctx, r, defY(k), 1);
      else if (gone > 0) {
        ctx.save();
        ctx.globalAlpha *= gone;
        drawDef(ctx, r, defY(k), 1);
        ctx.restore();
      }
    });
    if (fresh > 0) text(ctx, FOLDED, DX, defY(KEEP), { font: F.jp(500, 17), color: C.muted, alpha: fresh });
    roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
    tag(ctx, DOC.x + DOC.w - 18, defY(0) - 20, 'ツールの定義', { font: F.jp(700, 14), h: 24, padX: 9, fill: C.accent, color: '#fff', align: 'right' });

    // the marks the app has written
    roleMark(ctx, E[0].x, E[0].y + 1 + shiftQ, ROLE.user, { edge: BY.app });
    roleMark(ctx, E[1].x, E[1].y + 1 + shiftA, ROLE.assistant, { edge: BY.app });

    // 5-2's note and name for the request, until its band comes off (b)
    const noteY = E[1].y + E[1].h + 8 + shiftA;
    text(ctx, REQ_NOTE, E[1].tx + 2, noteY + 18, { font: F.jp(500, 14), color: C.muted, alpha: bandOff });
    tag(ctx, E[1].tx + E[1].w - 10, E[1].y + E[1].h / 2 - 14 + shiftA, 'ツール呼び出し', { font: F.jp(700, 15), h: 28, padX: 9, fill: C.accent, color: '#fff', align: 'right', alpha: bandOff });
    // b: the band was the picture's colour; the app gets the words alone
    text(ctx, '朱の帯は、この図の色分け。アプリに届くのは、文字だけ', E[1].tx + 2, noteY + 18, { font: F.jp(500, 14), color: C.muted, alpha: tw(t, plainAt + 0.35, pace.enter) * plainOff });

    // sentence a: what 5-2 left as plain words; sentence d: free text; sentence m: the call
    const [formLit] = lit(['form'], at('a.end'));
    const [, , freeLit] = lit(['which', 'what', 'free'], at('d.end'));
    const plainRow = { x: E[1].tx + 17 * bandOff, y: E[1].y + shiftA + 9 + 22 };
    ring(ctx, E[1].tx, E[1].y + shiftA, E[1].w, E[1].h, formLit, C.accent, 10);
    ring(ctx, plainRow.x - 4, plainRow.y - 24, reqW + 8, 32, freeLit * plainOff, C.accent, 10);

    // ——— the call: first a template (e–g), then what the LLM writes (i–k)
    drawCall(ctx, t, { at, pace, pop, lit, band, open, end, toks, name, nameSlot, inSlot, tplOff, openAt, tokAt, finAt, bandOn });

    // c: the app looks at the words — an answer, or a request to a tool?
    if (lookAt < at('d') + 0.4) {
      const la = span(t, lookAt, at('d') - 0.1);
      if (la > 0) {
        const y = plainRow.y - 9;
        lookLine(ctx, [[LOOKX, ACT.y + ACT.h + 4], [LOOKX, y], [plainRow.x + reqW + 12, y]], tw(t, lookAt, 0.5, inOutCubic), la);
      }
    }
    // d: which tool, and what to pass (get_weather's input in the head)
    const [, whatLit] = lit(['which', 'what', 'free'], at('d.end'));
    const inRow = defs[2];
    ring(ctx, inRow.segs[0].x - 2, defY(2) - 17, inRow.right - inRow.segs[0].x + 4, 20, whatLit, C.accent, 8);

    // ——— the app's box, what it receives, and how it may run the tool
    actor(ctx, ACT, 1, actGlow);
    qMark(ctx, ACT.x + ACT.w - 8, ACT.y + 8, qBox, 20);
    ring(ctx, ACT.x, ACT.y, ACT.w, ACT.h, Math.max(appLit, ownLit), C.accent, 18);
    sideRows(ctx, t, { at, pace, pop, lit, side, docked });

    // ——— under the LLM: it is trained on the form (sentence h)
    tag(ctx, NOTE.x, NOTE.y[0], '呼び出しの形を学習ずみ', { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: tw(t, at('train') - lead + 0.8, pace.enter) });
    // l: Anthropic's API reports the stop
    text(ctx, 'Anthropic の API が返す値', L.llm.x + L.llm.w / 2, L.llm.y - 68, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: pop('api') });
    stopBadge(ctx, L, tw(t, at('use') - lead, 0.4, (p) => outBack(p, 1.6)), 'tool_use');
    // k: the app stops the writing (as in 4-2)
    halt(ctx, pop('stop'));

    // ——— the tool's place: the tools, and the programs inside them; 5-2's veil lifts
    toolBox(ctx, L, 1, { solid: 0, glow: 0, draw: (c) => toolRows(c) });
    const veil = 1 - move;
    if (veil > 0) {
      ctx.save();
      ctx.globalAlpha = 0.8 * veil;
      rr(ctx, TOOL.x + 4, TOOL.y + 4, TOOL.w - 8, TOOL.h - 8, 16);
      ctx.fillStyle = C.paper;
      ctx.fill();
      ctx.restore();
      tag(ctx, TOOL.x + TOOL.w / 2, TOOL.y + TOOL.h + 14, '定義だけでは、中のプログラムは渡らない', { font: F.jp(700, 16), h: 34, padX: 12, fill: '#fff', stroke: C.red, color: C.red, align: 'center', alpha: veil });
    }
    const [whichLit] = lit(['which', 'what', 'free'], at('d.end'));
    const [, runLit] = lit(['wr', 'run'], at('m.end'));
    ring(ctx, TOOL.x, TOOL.y, TOOL.w, TOOL.h, Math.max(whichLit, runLit), C.accent, 20);
    qMark(ctx, TOOL.x + TOOL.w - 8, TOOL.y + 8, pop('run') * (1 - tw(t, at('n') - lead, 0.4)), 20);
    const w0 = text(ctx, 'ツール', TOOL.x, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    text(ctx, 'の場所', TOOL.x + w0, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });

    // ——— in flight
    // i: the app has the LLM read the document, down to the open mark
    sweep(ctx, L, seg(t, read + 0.05, read + 1.0), band.y + MARK_H);
    send(ctx, L.read, seg(t, read + 0.45, read + 1.05), '', 'doc');
    // h: the form goes into the LLM
    trainFlight(ctx, seg(t, at('train') - lead, at('train') - lead + 0.9), band);
    // i–k: the LLM's call mark, tokens and end mark, along the write channel and in under the band
    const lane = { y: band.y, h: band.h };
    const po = seg(t, openAt, openAt + EOT);
    if (po > 0 && po < 1) {
      const pt = onPath(writePath(T, lane, open.x + open.w / 2, open.y + MARK_H / 2), inOutCubic(po));
      roleMark(ctx, pt.x - open.w / 2, pt.y - MARK_H / 2, ROLE.call, { edge: WRITER.call, alpha: clamp(po * 8) });
    }
    toks.forEach((tk, k) => {
      const p = seg(t, tokAt[k], tokAt[k] + TOK);
      if (p <= 0 || p >= 1) return;
      const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
      const pt = onPath(writePath(T, lane, tk.x + tk.w / 2, tk.y), inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
    });
    const pe = seg(t, finAt, finAt + EOT);
    if (pe > 0 && pe < 1) {
      const pt = onPath(writePath(T, lane, end.x + end.w / 2, end.y + MARK_H / 2), inOutCubic(pe));
      roleMark(ctx, pt.x - end.w / 2, pt.y - MARK_H / 2, ROLE.callEnd, { edge: WRITER.callEnd, alpha: clamp(pe * 8) });
    }
    // k: the app watches for the end mark (a purple dashed look from its box)
    const watch = span(t, stopAt, at('l') - lead);
    if (watch > 0) {
      const y = end.y + MARK_H / 2;
      lookLine(ctx, [[LOOKX, ACT.y + ACT.h + 4], [LOOKX, y], [end.x + end.w + 9, y]], tw(t, stopAt, 0.4, inOutCubic), watch);
    }
    // k: the name and the input go to the app's box (behind it), and come out docked at its left
    takeFlight(ctx, seg(t, takeAt, takeAt + TAKE), name, 'get_weather', F.mono(600, 16), side, 'name');
    takeFlight(ctx, seg(t, takeAt + 0.15, takeAt + 0.15 + TAKE), inputFrom, '京都、あした', F.jp(700, 16), side, 'input');
    if (t >= takeAt && t <= takeAt + 0.15 + TAKE) actor(ctx, ACT, 1, actGlow);

    // ——— the key to the edges, under the LLM
    edgeKey(ctx, T.KEY, [[BY.app, 'アプリが付ける', 1], [BY.llm, 'LLM が書く', 1]]);
    const ex = { x: L.app.x, y: L.app.y + L.app.h + 22 };
    const exW = measure(ctx, F.jp(700, 17), '例') + 20;
    example(ctx, ex.x, ex.y, 1, '');
    text(ctx, NOTE52, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: gone });
    text(ctx, '会話と呼び出しの形は説明のための例', ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: fresh });

    // ——— o: the same call, made to fit gpt-oss's format
    ossCard(ctx, t, { at, pace, pop, lit, oss });
  },
});

// The look from the app's box: down the document's right margin, clear of the head's tag and the band.
const LOOKX = DOC.x + DOC.w - 8;

function lookLine(ctx, pts, p, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 6]);
  path(ctx, pts, p);
  ctx.setLineDash([]);
  ctx.restore();
}

// A question mark on a white disc: something the app cannot tell.
function qMark(ctx, x, y, a, r = 16) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  circle(ctx, x, y, r);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  text(ctx, '？', x, y + 1, { font: F.jp(700, Math.round(r * 1.3)), color: C.red, align: 'center', base: 'middle', alpha: a });
}

// Sentence c: the request, as an answer on the screen would show it (dashed: not shown, only asked).
function dashedBubble(ctx, b, a) {
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, b.x, b.y, b.L.w, b.L.h, 22);
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
  b.L.lines.forEach((l, i) => {
    text(ctx, l, b.x + b.L.pad, b.y + b.L.pad + b.L.size * 0.62 + i * b.L.lh, { font: b.L.font, color: C.ink2, base: 'middle', alpha: 0.75 });
  });
  ctx.restore();
}

// 5-2's request while its band's colour comes off: the band at alpha `band`, the words in ink.
function plainRequest(ctx, E, band, a, dx) {
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  if (band > 0.001) {
    ctx.save();
    ctx.globalAlpha *= band;
    rr(ctx, E.tx, E.y, E.w, E.h, 8);
    ctx.fillStyle = C.accentSoft;
    ctx.fill();
    ctx.fillStyle = C.accent;
    ctx.fillRect(E.tx, E.y + 6, 4, E.h - 12);
    ctx.restore();
  }
  E.rows.forEach((r, i) => {
    text(ctx, r, E.tx + dx, E.y + E.pad + Math.round(E.lh * 0.7) + i * E.lh, { font: E.font, color: C.ink });
  });
  ctx.restore();
}

// The call. e: an empty dashed band; f: the marks and two slots (the name, the input); g: the slots
// become the JSON (all as a template, in grey); h: the band is ringed. i: the template gives way, and
// the LLM writes: its call mark, the tokens, the end mark (drawn as they land). From then on the band
// is the call's vermilion.
function drawCall(ctx, t, o) {
  const { at, pace, pop, lit, band, open, end, toks, name, nameSlot, inSlot, tplOff, openAt, tokAt, finAt, bandOn } = o;
  const lead = pace.cue.lead;
  // the band
  const outline = pop('decide') * (1 - bandOn);
  if (outline > 0) {
    ctx.save();
    ctx.globalAlpha = outline;
    ctx.setLineDash([8, 6]);
    rr(ctx, band.x, band.y, band.w, band.h, 8);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  if (bandOn > 0) {
    ctx.save();
    ctx.globalAlpha = bandOn;
    rr(ctx, band.x, band.y, band.w, band.h, 8);
    ctx.fillStyle = C.accentSoft;
    ctx.fill();
    ctx.fillStyle = C.accent;
    ctx.fillRect(band.x, band.y + 6, 4, band.h - 12);
    ctx.restore();
  }
  // f: this picture's form (the caption above the band)
  text(ctx, FORM_NOTE, band.x + band.w, band.y - 9, { font: F.jp(500, 14), color: C.muted, align: 'right', alpha: pop('fig') });
  // f: the template's marks, and slots for the name and the input
  const gm = pop('marks') * tplOff;
  if (gm > 0) {
    roleMark(ctx, open.x, open.y, ROLE.call, { edge: WRITER.call, alpha: gm * 0.4 });
    roleMark(ctx, end.x, end.y, ROLE.callEnd, { edge: WRITER.callEnd, alpha: gm * 0.4 });
  }
  const toJson = tw(t, at('json') - lead, 0.4);
  const slotN = pop('nm') * (1 - toJson) * tplOff;
  const slotI = pop('inp') * (1 - toJson) * tplOff;
  slot(ctx, nameSlot, 'ツールの名前', slotN);
  slot(ctx, inSlot, '入力', slotI);
  // g: the JSON, as a template
  const gj = toJson * tplOff;
  if (gj > 0) {
    toks.forEach((tk) => text(ctx, tk.s, tk.x, tk.base, { font: CFONT, color: C.muted, alpha: gj * 0.75 }));
  }
  tag(ctx, band.x + band.w - 10, open.y, 'JSON', { font: F.mono(600, 14), h: 28, padX: 10, fill: '#fff', stroke: C.accent, color: C.accent, align: 'right', alpha: toJson });
  // g: a program reads it easily (the app's look); h: this form, which the LLM is trained on
  const easy = span(t, at('easy') - lead, at('g.end') - 0.45);
  if (easy > 0) lookLine(ctx, [[LOOKX, ACT.y + ACT.h + 4], [LOOKX, open.y + MARK_H / 2], [band.x + band.w + 2, open.y + MARK_H / 2]], tw(t, at('easy') - lead, 0.5, inOutCubic), easy);
  const [form2] = lit(['form2', 'train'], at('h.end'));
  ring(ctx, band.x, band.y, band.w, band.h, form2, C.accent, 10);

  // the LLM's writing, as far as it has landed
  if (t >= openAt + EOT) roleMark(ctx, open.x, open.y, ROLE.call, { edge: WRITER.call });
  toks.forEach((tk, k) => {
    if (t >= tokAt[k] + TOK) text(ctx, tk.s, tk.x, tk.base, { font: CFONT, color: C.ink });
  });
  if (t >= finAt + EOT) roleMark(ctx, end.x, end.y, ROLE.callEnd, { edge: WRITER.callEnd });
  // a cursor where the LLM is to write, after the read, until the call mark lands
  if (t >= at('i') + 1.0 && t < openAt + EOT && Math.floor(t * 2.5) % 2 === 0) {
    ctx.fillStyle = C.accent;
    ctx.fillRect(open.x, open.y - 1, 4, 30);
  }
  // j: the call mark; k: the end mark; k2: as with the end of an answer; o: the marks and the name
  const [openLit] = lit(['open', 'body'], at('j.end'));
  // (the end mark's ring waits for the mark to land)
  const [finLit0] = lit(['fin', 'stop', 'take'], at('take'));
  const finLit = finLit0 * seg(t, finAt + EOT - 0.1, finAt + EOT + 0.15);
  const [likeLit] = lit(['like'], at('k2.end'));
  const [vary] = lit(['vary', 'oss'], at('oss'));
  ring(ctx, open.x - 3, open.y - 3, open.w + 6, MARK_H + 6, Math.max(openLit, vary), C.accent, 10);
  ring(ctx, end.x - 3, end.y - 3, end.w + 6, MARK_H + 6, Math.max(finLit, likeLit, vary), C.accent, 10);
  ring(ctx, name.x - 4, name.y - 22, name.w + 8, 30, vary, C.accent, 8);
  // k2: the same stop as at the end of an answer (4-2)
  const la = pop('like');
  if (la > 0) {
    const font = F.jp(500, 15);
    const tail = 'で止めたのと同じ';
    const right = band.x + band.w;
    const cy = band.y + band.h + 24;
    const w1 = measure(ctx, font, tail);
    const mw = miniMark(ctx, 0, 0, ROLE.end.name, 0);
    const x0 = right - w1 - 6 - mw - 6 - measure(ctx, font, '4-2 で、');
    const w0 = text(ctx, '4-2 で、', x0, cy, { font, color: C.muted, base: 'middle', alpha: la });
    miniMark(ctx, x0 + w0 + 6, cy - 11, ROLE.end.name, la);
    text(ctx, tail, right, cy, { font, color: C.muted, align: 'right', base: 'middle', alpha: la });
  }
  // m: the call that has been written
  const [wr] = lit(['wr', 'run'], at('m.end'));
  ring(ctx, band.x, band.y, band.w, band.h, wr, C.accent, 10);
}

// A small copy of a mark the LLM writes, for a note (ink, with its ink edge). Returns its width.
function miniMark(ctx, x, y, s, a) {
  const font = F.jp(700, 12);
  const w = measure(ctx, font, s) + 14;
  if (a <= 0.001) return w;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, x - 3, y - 3, w + 6, 28, 7);
  ctx.strokeStyle = BY.llm;
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, x, y, w, 22, 5);
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.restore();
  text(ctx, s, x + w / 2, y + 12, { font, color: C.paper, align: 'center', base: 'middle', alpha: a });
  return w;
}

// A dashed slot with its name in grey.
function slot(ctx, b, s, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.setLineDash([6, 5]);
  rr(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  text(ctx, s, b.x + b.w / 2, b.y + b.h / 2 + 1, { font: F.jp(700, 17), color: C.muted, align: 'center', base: 'middle', alpha: a });
}

// h: a small copy of the form flies into the LLM.
function trainFlight(ctx, p, band) {
  if (p <= 0 || p >= 1) return;
  const e = inOutCubic(p);
  const b = L.llm;
  const s = lerp(0.8, 0.16, e);
  const cx = lerp(band.x + band.w / 2, b.x + b.w / 2, e);
  const cy = lerp(band.y + band.h / 2, b.y + b.h / 2, e) - Math.sin(Math.PI * e) * 60;
  const w = band.w * s;
  const h = band.h * s;
  ctx.save();
  ctx.globalAlpha = clamp(p * 5) * clamp((1 - p) * 4);
  rr(ctx, cx - w / 2, cy - h / 2, w, h, 8 * s);
  ctx.fillStyle = C.accentSoft;
  ctx.fill();
  ctx.setLineDash([8 * s, 6 * s]);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.accent;
  ctx.fillRect(cx - w / 2 + 17 * s, cy - h / 2 + 13 * s, 78 * s, 28 * s);
  ctx.fillStyle = C.rule;
  [[0, 0.55], [1, 0.62], [2, 0.42]].forEach(([r, f]) => ctx.fillRect(cx - w / 2 + 107 * s, cy - h / 2 + (20 + r * 36) * s, (w - 130 * s) * f, 12 * s));
  ctx.restore();
}

// k: a chip from the call to the app's box: along the band, up the lane, then left behind the box
// (drawn over by it) and out at its left, into its dock.
function takeFlight(ctx, p, from, s, font, side, which) {
  if (p <= 0 || p >= 1) return;
  const dockX = which === 'name' ? side.xName + side.wName / 2 : side.xIn + side.wIn / 2;
  const y0 = from.y - 9;
  const pts = [[from.x + from.w / 2, y0], [T.lane, y0], [T.lane, SIDE_A + 15], [dockX, SIDE_A + 15]];
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.globalAlpha = clamp(p * 8) * clamp((1 - p) * 10);
  tag(ctx, pt.x, pt.y - 15, s, { font, h: 30, padX: 10, fill: C.accent, color: '#fff', align: 'center', r: 8 });
  ctx.restore();
}


// Left of the app's box: what it receives (k), and the two ways it may run the tool (n2).
const SIDE_A = ACT.y + 2;
const SIDE_B = ACT.y + ACT.h - 32;
function sideRows(ctx, t, { at, pace, pop, lit, side, docked }) {
  if (docked[0] > 0) {
    text(ctx, side.recv.label, side.xRecv, SIDE_A + 16, { font: F.jp(500, 15), color: C.muted, align: 'right', base: 'middle', alpha: docked[0] });
    tag(ctx, side.xName, SIDE_A, side.recv.name, { font: F.mono(600, 16), h: 30, padX: 10, fill: C.accent, color: '#fff', r: 8, alpha: docked[0] });
    tag(ctx, side.xIn, SIDE_A, side.recv.input, { font: F.jp(700, 16), h: 30, padX: 10, fill: C.accent, color: '#fff', r: 8, alpha: docked[1] });
  }
  const [autoLit, askLit] = lit(['auto', 'ask'], at('own'));
  const way = (x, i, a, lv) => {
    tag(ctx, x, SIDE_B, side.ways[i], { font: F.jp(700, 15), h: 30, padX: 10, fill: C.purpleSoft, stroke: C.purple, color: C.purple, lw: 2, alpha: a });
    ring(ctx, x, SIDE_B, side.wWay[i], 30, lv, C.accent, 15);
  };
  const a0 = pop('auto');
  const a1 = pop('ask');
  way(side.xWay0, 0, a0, autoLit);
  text(ctx, '／', side.xSlash, SIDE_B + 16, { font: F.jp(500, 16), color: C.muted, align: 'right', base: 'middle', alpha: a1 });
  way(side.xWay1, 1, a1, askLit);
}

// k: the app stops the writing — the purple tag on the write channel, as in 4-2.
function halt(ctx, a) {
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

// One row of 5-2's definitions (as toolspec.js draws it), typed in by p.
function drawDef(ctx, r, y, p) {
  if (p <= 0) return;
  if (r.ghost) {
    ctx.save();
    ctx.globalAlpha = clamp(p * 2) * ctx.globalAlpha;
    ctx.fillStyle = C.rule;
    const [a, b] = r.ghost;
    rr(ctx, DX, y - 14, a * p, 12, 4);
    ctx.fill();
    if (p > 0.4) {
      rr(ctx, DX + a + INDENT, y - 14, b * clamp((p - 0.4) / 0.6), 12, 4);
      ctx.fill();
    }
    ctx.restore();
    if (r.label) text(ctx, r.label, DOC.x + DOC.w - 18, y, { font: F.jp(500, 15), color: C.muted, align: 'right', alpha: p });
    return;
  }
  let left = Math.round(r.n * clamp(p));
  r.segs.forEach((sg) => {
    if (left <= 0) return;
    const s = Array.from(sg.s).slice(0, left).join('');
    left -= sg.n;
    text(ctx, s, sg.x, y, { font: sg.font, color: sg.part === 'head' ? C.ink2 : C.ink });
  });
}

// The tool's place as 5-2 leaves it: the chapter's three tools in rows, each with its program.
function toolRows(ctx) {
  KINDS.forEach(([name, what], i) => {
    const r = rowBox(i);
    ctx.save();
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    text(ctx, name, r.x + 14, r.y + r.h / 2 - 6, { font: F.jp(700, 20), color: C.ink });
    text(ctx, what, r.x + 14, r.y + r.h / 2 + 20, { font: F.jp(500, 15), color: C.ink2 });
    program(ctx, glyphBox(r), 1, i);
  });
}

// A program, drawn as a few lines of code on a dark panel (as toolspec.js draws it).
const CODE = [
  [[0, 0.55], [1, 0.62], [1, 0.4], [0, 0.25]],
  [[0, 0.5], [1, 0.7], [2, 0.38], [1, 0.3]],
  [[0, 0.45], [1, 0.58], [1, 0.66], [0, 0.2]],
];
function program(ctx, g, a, i) {
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, g.x, g.y, g.w, g.h, 7);
  ctx.fillStyle = C.ink2;
  ctx.fill();
  CODE[i].forEach(([indent, w], k) => {
    ctx.fillStyle = C.tints[(k + i) % C.tints.length];
    rr(ctx, g.x + 10 + indent * 10, g.y + 8 + k * 9.5, (g.w - 20 - indent * 10) * w, 4.5, 2);
    ctx.fill();
  });
  ctx.restore();
}

// Sentences o and o2: the call made to fit gpt-oss's format, in its own card where the screen was.
// The special tokens are purple (the format's own marks; not who writes them, so the card says so);
// the name, in the recipient, and the input, in the body, on the call's vermilion.
function ossCard(ctx, t, { at, pace, pop, lit, oss }) {
  const a = tw(t, at('o') + 0.25, pace.enter);
  if (a <= 0) return;
  const lead = pace.cue.lead;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 18);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  const x = CARD.x + 20;
  text(ctx, 'gpt-oss の形式に合わせた例', x, CARD.y + 34, { font: F.jp(700, 18), color: C.ink, alpha: a });
  text(ctx, '説明のために作ったもので、実際の出力ではない', x, CARD.y + 58, { font: F.jp(500, 14), color: C.muted, alpha: a });
  const rowY = [CARD.y + 98, CARD.y + 130, CARD.y + 190, CARD.y + 222];
  const code = at('oss') - lead;
  const [dest, body] = lit(['dest', 'body2'], at('o2.end'));
  const hi = [pop('dest'), pop('body2')];
  oss.forEach((row, r) => {
    const ra = tw(t, code + r * pace.stagger * 2, pace.enter);
    if (ra <= 0) return;
    row.forEach((sg) => {
      const k = sg.kind === 'name' ? 0 : sg.kind === 'input' ? 1 : -1;
      if (k >= 0 && hi[k] > 0) {
        ctx.save();
        ctx.globalAlpha = hi[k] * ra;
        rr(ctx, sg.x - 3, rowY[r] - 17, sg.w + 6, 24, 5);
        ctx.fillStyle = C.accentSoft;
        ctx.fill();
        ctx.restore();
        ring(ctx, sg.x - 3, rowY[r] - 17, sg.w + 6, 24, [dest, body][k], C.accent, 6);
        tag(ctx, sg.x - 3, rowY[r] + 12, k === 0 ? 'ツールの名前：宛先に書く' : '入力：本文に書く', { font: F.jp(700, 14), h: 24, padX: 8, fill: '#fff', stroke: C.accent, color: C.accent, alpha: hi[k] * ra });
      }
      text(ctx, sg.s, sg.x, rowY[r], { font: sg.font, color: sg.kind === 'sp' ? C.purple : C.ink, alpha: ra });
    });
  });
  const ka = tw(t, code + 0.5, pace.enter);
  const ky = CARD.y + 290;
  const kw = text(ctx, '<|…|>', x, ky, { font: OSPEC, color: C.purple, alpha: ka });
  text(ctx, '：形式で決まった特別なトークン', x + kw + 4, ky, { font: F.jp(500, 14), color: C.muted, alpha: ka });
  text(ctx, '改行は、見やすくするために入れた', x, ky + 22, { font: F.jp(500, 14), color: C.muted, alpha: ka });
  source(ctx, 'OpenAI harmony の形式（gpt-oss）', a, SOURCE_RIGHT);
}
