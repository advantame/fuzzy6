// 5-4: writing the result in. Told from the designer's side (Boss, 2026-10-15), like 5-1 … 5-3: the app
// runs the tool with the name and the input it received (the input goes down the 入力 channel to the
// weather program, the result comes back up the 結果 channel). The result is now in the app's hand, outside
// the document, and the LLM cannot see it. So we have the app write it into the document under its
// ツールの結果 mark, matched to its call (the same number on both, a sketch of the id the API matches them
// by), and write the assistant's mark again so the LLM can go on. The app has the LLM read the document
// for the next generation (the part read before need not be computed again — chapter 9), and the LLM
// writes the answer from the forecast, then the end-of-answer mark. The app looks at what the generation
// stopped on and chooses what to do next: a call → run the tool (tool_use), the end of an answer → end
// the exchange (end_turn); a limit can stop it too. Whether the call and the result are shown on the
// screen is the designer's choice; some apps show the progress.
//
// The layout is the chapter's (lib/rig.js toolUseLayout). The clip joins 5-3 (spec §6.10): its first
// frame is 5-3's last picture, drawn here as toolcall.js draws it, and the bridge clears 5-3's notes
// (gpt-oss's card, the ways to run the tool, the stop, tool_use), folds the definitions at the head into
// one row, moves the conversation up and brings the chat screen back. The forecast, the answer and the
// numbers matching the call to its result are an example; the answer is cut into tokens as o200k_base
// cuts it, and is shown on the screen while it is written (research/tool-facts 論点 5).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import {
  toolUseLayout, chatScreen, screenBubbles, chatBubble, screenLinks, writePath, flyMark, edgeKey,
  llmBlock, appFrame, toolBox, channel, actor, token, TOKEN, tokenPlaces, onPath, docLayout, docEntry, rowAt, sweep, send, stopBadge,
  roleMark, markWidth, MARK_H, ROLE, BY, WRITER,
} from '../lib/rig.js';
import { text, measure, rr, path, circle, line } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { focus, ring } from '../../../src/kit/cue.js';

const T = toolUseLayout();
const { L, ACT, SCREEN, NOTE } = T;
const TOOL = L.tool;
const DOC = L.doc;

// ——— 5-3's picture, as toolcall.js has it (its last frame is this clip's first)
const Q = 'あしたの京都の天気は？';
const REQ = 'あしたの京都の天気予報を調べたい';
const ANS51 = 'あしたの京都は晴れで、最高気温は24℃の予報です。';
const RESULT51 = '京都　あした：晴れ　最高 24℃';
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
// the three rows of definitions 5-3 keeps at the head
const DEFS = [
  { segs: [['使えるツール', 'head']] },
  { segs: [['get_weather', 'name'], ['：', ''], ['都市と日の天気予報を返す', 'desc']] },
  { indent: true, segs: [['入力：city（都市）、day（日）', 'input']] },
];
const defY = (k) => DTOP + 21 + DLH * k;
const FOLDED53 = 'search_web、calculate などの定義（省略）';
const SHIFT_Q53 = 28 + DLH * 3 + 40;
const SHIFT_A53 = SHIFT_Q53 + 28;
const CALL_ROWS = [
  ['{"', 'name', '":', ' "', 'get', '_weather', '",'],
  [' "', 'input', '":', ' {"', 'city', '":', ' "', '京都', '",'],
  [' "', 'day', '":', ' "', 'あ', 'した', '"}}'],
];
const CFONT = F.mono(500, 18);
const CLH = 36;
const FORM_NOTE = 'この図の形（説明のための例）';
const OSS = [
  [['<|start|>', 'sp'], ['assistant', 'tx'], ['<|channel|>', 'sp']],
  [['commentary ', 'tx'], ['to=functions.get_weather', 'name']],
  [['<|constrain|>', 'sp'], ['json', 'tx'], ['<|message|>', 'sp']],
  [['{"city":"京都","day":"あした"}', 'input'], ['<|call|>', 'sp']],
];
const OFONT = F.mono(500, 15);
const OSPEC = F.mono(600, 15);
const CARD = { x: 1096, y: 100, w: 408, h: 326 };
const NOTE53 = '会話と呼び出しの形は説明のための例';

// ——— this clip
// The head folds to one row; the conversation moves up under it, the call right under the question.
const FOLDED = 'get_weather などのツールの定義（省略）';
const SHIFT_Q = 28 + 40;
const DY_A = SHIFT_Q - SHIFT_A53; // how far the call moves up
const RES = '{"天気": "晴れ", "最高気温": 24}';
// the answer, one token at a time (as o200k_base cuts it); in the document it breaks at the comma
const ANS = ['あ', 'した', 'の', '京都', 'は', '晴', 'れ', 'で', '、', '最高', '気', '温', 'は', '24', '℃', 'の', '予', '報', 'です', '。'];
const ANS_DOC = 'あしたの京都は晴れで、\n最高気温は24℃の予報です。';
const ID_NOTE = '番号は模式。API では、呼び出しの id で結果を対応づける';
const REUSE = 'ここまでの計算は使い回せる（9 章）';
const PROG = '天気予報を調べました';
const NOTE54 = '会話、呼び出し、結果は説明のための例';
// the two ways a generation stops, and what the app does next (sentences h, i), above the LLM
const PANEL = { x: 36, y: 80, w: 330, h: 182 };
const STOPS = [
  { case: '呼び出しで止まった', value: 'tool_use', hot: true, act: 'ツールを動かす' },
  { case: '答えを書き終えた', value: 'end_turn', hot: false, act: 'このやりとりを終える' },
];

const FLY = 0.55; // a mark flying out of the app's box
const TOK = 0.42; // a token along the write channel and into its place
const EOT = 0.75; // a mark the LLM writes, the same way
const GO = 0.9; // the input, from the app to the tool
const WORK = 0.8; // the tool at work
const BACK = 1.0; // the result, from the tool to the app's hand
const IN = 1.0; // the result, from the app's hand into the document

const span = (t, a, b, rise = 0.25, fall = 0.35) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n token times, evenly from a, the last one landing by b
const times = (n, a, b) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - TOK - a)) / Math.max(1, n - 1));
// how much of an entry is written at time s
const upto = (list, ts) => (s) => list.reduce((u, tk, k) => (s >= ts[k] + TOK ? tk.upto : u), 0);

export default clip({
  id: 'toolresult',
  title: '結果を書き足す',
  kicker: 'ツールの実行と結果',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.9, // 5-3's notes clear away; skipped unless the clip is joined from 5-3
  script: [
    { id: 'a', tail: 1.9, text: 'アプリは、{recv}受け取った名前と入力で、{run}ツールを動かすわ。' },
    { id: 'b', still: true, text: 'でも、{back}返ってきた結果は、{hand}アプリの手元にあるだけで、\n{unseen}LLM からは見えないの。' },
    { id: 'c', text: 'そこで、アプリには、{mark}結果に[「ツールの結果」の印|ツールの結果の印]を付けて、\n{write}文書に書き足させるの。' },
    { id: 'c2', still: true, text: '{which}どの呼び出しの結果なのかも、{match}わかるようにしておくわ。' },
    { id: 'd', text: 'そして、LLM が続きを書けるように、\n{open}アシスタントの印を、また書いておくわ。' },
    { id: 'e', tail: 0.6, text: '{add}結果を加えたこの文書を、次の生成のために、\n{read}LLM に読ませるの。' },
    { id: 'f', tail: 1.0, text: 'すると LLM は、{clue}予報を手がかりにして、\n{ans}その続きに、答えを書いていくわ。' },
    { id: 'g', still: true, text: '答えを書き終えたら、こんどは、{eot}答えの終わりの印を書くの。' },
    { id: 'h', text: 'アプリは、{why}[何で|なにで]止まったのかを見て、{choose}次にすることを選ぶの。' },
    { id: 'i', still: true, text: '{s1}呼び出しで止まったら、{a1}ツールを動かす。\n{s2}答えを書き終えて止まったら、{a2}このやりとりを終えるわ。' },
    { id: 'j', by: 'zunda', text: '{call2}呼び出しや結果は、{scr}画面には出ないのだ？' },
    { id: 'k', tail: 0.8, text: '出すかどうかも、{maker}アプリを作る人が決めるわ。\n{prog}調べている途中のようすを、画面に出すアプリもあるの。' },
  ],

  prepare(ctx) {
    const ent = (role, s, kind = 'text') => ({ role, text: s, kind });
    // 5-1's document, laid out as 5-1 lays it out; this clip keeps its first two entries
    const E = docLayout(ctx, L, [
      ent('user', Q), { ...ent('assistant', REQ, 'call'), gap: 54 }, ent('result', RESULT51, 'data'), ent('assistant', ANS51),
    ], T.DOC);
    const B = screenBubbles(ctx, SCREEN, [['user', Q], ['assistant', 'あしたの京都は晴れで、\n最高気温は24℃の予報です。']]);
    const defs = DEFS.map((r) => {
      let x = DX + (r.indent ? INDENT : 0);
      const segs = r.segs.map(([s, part]) => {
        const font = part === 'name' ? DNAME : DFONT;
        const w = measure(ctx, font, s);
        const out = { s, part, font, x, w };
        x += w;
        return out;
      });
      return { ...r, segs };
    });

    // 5-3's call, where 5-3 has it (this clip moves it up by DY_A)
    const band = { x: E[1].tx, y: E[1].y + SHIFT_A53, w: E[1].w, h: CALL_ROWS.length * CLH + 18 };
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
        toks.push({ s, x, base: base(r) });
        x += measure(ctx, CFONT, s);
      });
      rowEnd.push(x);
    });
    const last = CALL_ROWS.length - 1;
    const end = { x: rowEnd[last] + 12, y: band.y + 9 + last * CLH + 4, w: endW };

    // this clip's entries, under the call as it stands after the bridge: the result, and the answer
    const bandBottom = band.y + DY_A + band.h;
    const [R, A] = docLayout(ctx, L, [
      { role: 'result', kind: 'data', text: RES, font: CFONT, gap: 50 }, { role: 'assistant', text: ANS_DOC },
    ], { ...T.DOC, top: bandBottom + 40 - DOC.y });
    const ansToks = tokenPlaces(ctx, A, ANS);
    const lastRow = rowAt(A, A.rows.length - 1);
    const aEnd = { x: lastRow.x + measure(ctx, A.font, A.rows[A.rows.length - 1]) + 16, y: lastRow.y - 22, w: markWidth(ctx, ROLE.end.name) };

    // left of the app's box: what 5-3 left there, and where the result waits in the app's hand
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
    const chipW = tagW(RES, CHIP, 10);
    const dock = { x: RX - chipW, y: SIDE_A, w: chipW };

    // gpt-oss's call, row by row (5-3's card)
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
      E, B, defs, band, open, end, toks, R, A, ansToks, aEnd, bandBottom,
      side: { xRecv, xName, wName, xIn, wIn, recv, ways, wWay, xWay0, xSlash, xWay1, RX, dock },
      oss, resW: measure(ctx, CFONT, RES),
    };
  },

  draw(ctx, t, s, { at, pace }) {
    const { E, B, defs, band, open, end, toks, R, A, ansToks, aEnd, bandBottom, side, oss, resW } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (names, until) => focus(t, names.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 5-3's notes clear away, the head folds, the conversation moves up, the screen
    // comes back. The first frame is 5-3's untouched.
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.55));
    const fresh = inOutCubic(seg(t, br * 0.4, br));
    const move = inOutCubic(seg(t, 0, br));
    const shiftQ = lerp(SHIFT_Q53, SHIFT_Q, move);
    const dyA = DY_A * move;
    const scr = fresh;

    // ——— when things happen
    // a: the input goes to the tool, the tool works, the result comes back to the app's hand
    const runAt = at('run') - lead;
    const workAt = runAt + GO - 0.1;
    const backAt = workAt + WORK;
    const inHand = t >= backAt + BACK ? 1 : 0;
    const used = 1 - tw(t, workAt, 0.4); // the name and its label, once the tool runs
    // c: the app writes the result in, under its mark
    const markAt = at('mark') - lead;
    const writeAt = Math.max(at('write') - lead, markAt + FLY);
    const resIn = tw(t, writeAt + IN - 0.1, 0.2);
    // d: the assistant's mark again; e: the read; f, g: the answer and its end
    const openAt = at('open') - lead;
    const read = at('read') - lead;
    const ansAt = times(ANS.length, Math.max(at('ans') - 0.15, read + 1.0), at('f.done'));
    const lastTok = ansAt[ansAt.length - 1] + TOK;
    const eotAt = Math.max(at('eot') - lead, lastTok + 0.05);
    const eotIn = eotAt + EOT;
    const landedAns = upto(ansToks, ansAt);
    // k: some apps show the progress on the screen
    const progAt = at('prog') - lead;

    // who is at work
    const [makerLit] = lit(['maker'], at('prog'));
    const actGlow = Math.max(
      span(t, runAt - 0.1, backAt + BACK),
      span(t, markAt, writeAt + IN),
      span(t, openAt, openAt + FLY + 0.1),
      span(t, read, read + 1.0),
      span(t, ansAt[0] + TOK, lastTok + 0.2),
      span(t, at('why') - lead, at('h.end') - 0.1),
      makerLit,
    );
    const llmGlow = span(t, read + 0.9, eotIn);
    const [s1Lit, a1Lit, s2Lit, a2Lit] = lit(['s1', 'a1', 's2', 'a2'], at('i.end'));
    const [call2Lit, scrLit] = lit(['call2', 'scr'], at('j.end'));

    // ——— the chat screen, back from under gpt-oss's card
    chatScreen(ctx, SCREEN, scr);
    ring(ctx, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, scrLit, C.accent, 20);
    chatBubble(ctx, B[0], { alpha: scr });
    // k: the answer moves down for a row of progress
    const dyB = 38 * inOutCubic(seg(t, progAt, progAt + 0.5));
    const bAns = { ...B[1], y: B[1].y + dyB };
    chatBubble(ctx, bAns, { alpha: tw(t, ansAt[0] + TOK, 0.2), chars: landedAns(t - 0.12) });
    ring(ctx, bAns.x, bAns.y, bAns.L.w, bAns.L.h, a2Lit, C.accent, 22);
    progressRow(ctx, B[1], tw(t, progAt + 0.3, pace.enter));
    if (scr > 0.001) {
      ctx.save();
      ctx.globalAlpha *= scr;
      screenLinks(ctx, T, { talk: 1, back: 1, backHot: span(t, ansAt[0] + TOK, lastTok + 0.2) > 0.5 });
      ctx.restore();
    }

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, L, 1, { name: '' });
    llmBlock(ctx, L, 1, { glow: llmGlow });
    channel(ctx, L.read, 1);
    channel(ctx, L.write, 1, { hot: llmGlow > 0.5 && t >= ansAt[0] && t < eotIn });
    channel(ctx, L.call, 1, { hot: span(t, runAt, runAt + GO) > 0.5 || a1Lit > 0.5 });
    channel(ctx, L.back, 1, { hot: span(t, backAt, backAt + BACK * 0.6) > 0.5 });

    // ——— the document: the question, under the head
    ctx.save();
    ctx.beginPath();
    ctx.rect(DOC.x, DOC.y, DOC.w, DOC.h);
    ctx.clip();
    ctx.save();
    ctx.translate(0, shiftQ);
    docEntry(ctx, E[0], 1, { tagAlpha: 0 });
    ctx.restore();
    ctx.restore();

    // the head: 5-3's three rows of definitions fold into one
    if (gone > 0) {
      ctx.save();
      ctx.globalAlpha *= gone;
      defs.forEach((r, k) => drawDef(ctx, r, defY(k)));
      ctx.restore();
    }
    text(ctx, FOLDED53, DX, defY(3), { font: F.jp(500, 17), color: C.muted, alpha: gone });
    text(ctx, FOLDED, DX, defY(0), { font: F.jp(500, 17), color: C.muted, alpha: fresh });
    roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
    tag(ctx, DOC.x + DOC.w - 18, defY(0) - 20, 'ツールの定義', { font: F.jp(700, 14), h: 24, padX: 9, fill: C.accent, color: '#fff', align: 'right', alpha: gone });

    // the marks the app has written
    roleMark(ctx, E[0].x, E[0].y + 1 + shiftQ, ROLE.user, { edge: BY.app });
    roleMark(ctx, E[1].x, E[1].y + 1 + SHIFT_A53 + dyA, ROLE.assistant, { edge: BY.app });

    // ——— the call, as the LLM wrote it in 5-3 (moved up by the bridge)
    ctx.save();
    ctx.translate(0, dyA);
    drawCall(ctx, { band, open, end, toks, gone });
    ctx.restore();
    const bandA = { ...band, y: band.y + DY_A };
    const openA = { ...open, y: open.y + DY_A };
    const endA = { ...end, y: end.y + DY_A };

    // ——— this clip's entries: the result (c), its number (c2), the assistant's mark (d), the answer (f, g)
    if (resIn > 0) docEntry(ctx, R, resIn, { tagAlpha: 0 });
    if (t >= markAt + FLY) roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
    const [whichLit, matchLit] = lit(['which', 'match'], at('c2.end'));
    const idTag = (y, a) => tag(ctx, band.x + band.w - 10, y, '#1', { font: F.mono(600, 15), h: 28, padX: 9, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'right', r: 8, alpha: a });
    const idCall = { y: openA.y };
    const idRes = { y: R.y + R.h / 2 - 14 };
    idTag(idCall.y, pop('which'));
    idTag(idRes.y, pop('match'));
    // c2: a thin line between the two numbers, until d
    const tie = tw(t, at('match') - lead + 0.1, 0.5, inOutCubic) * (1 - tw(t, at('d'), 0.4));
    if (tie > 0) {
      const x0 = band.x + band.w - 6;
      const xl = DOC.x + DOC.w - 8;
      ctx.save();
      ctx.globalAlpha = Math.min(1, tie * 3) * (1 - tw(t, at('d'), 0.4));
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      path(ctx, [[x0, idCall.y + 14], [xl, idCall.y + 14], [xl, idRes.y + 14], [x0, idRes.y + 14]], tw(t, at('match') - lead + 0.1, 0.5, inOutCubic));
      ctx.restore();
    }
    text(ctx, ID_NOTE, R.tx + 2, R.y + R.h + 28, { font: F.jp(500, 14), color: C.muted, alpha: pop('match') });
    ring(ctx, bandA.x, bandA.y, bandA.w, bandA.h, Math.max(whichLit, call2Lit), C.accent, 10);

    // the answer, as far as it has landed, and its end mark
    const ca = landedAns(t);
    if (ca > 0) docEntry(ctx, A, 1, { tagAlpha: 0, chars: ca });
    if (t >= openAt + FLY) roleMark(ctx, A.x, A.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    if (t >= eotIn) roleMark(ctx, aEnd.x, aEnd.y, ROLE.end, { edge: WRITER.end });
    // a cursor after the open mark, until the first token lands
    if (t >= openAt + FLY && t < ansAt[0] + TOK && Math.floor(t * 2.5) % 2 === 0) {
      const c = rowAt(A, 0);
      ctx.fillStyle = C.accent;
      ctx.fillRect(c.x, c.y - 24, 4, 30);
    }

    // rings on the document
    const landed = (at0) => seg(t, at0 - 0.1, at0 + 0.15);
    const [addLit] = lit(['add'], at('read'));
    const [clueLit] = lit(['clue'], at('ans'));
    const [openLit] = lit(['open'], at('d.end'));
    const [eotLit] = lit(['eot'], at('g.end'));
    ring(ctx, R.x - 6, R.y - 6, R.tx + R.w - R.x + 12, R.h + 12, addLit, C.accent, 12);
    ring(ctx, R.tx - 4, R.y - 4, R.w + 8, R.h + 8, Math.max(matchLit, clueLit, call2Lit), C.accent, 11);
    ring(ctx, A.x - 3, A.y - 2, markWidth(ctx, ROLE.assistant.name) + 6, MARK_H + 6, openLit * landed(openAt + FLY), C.accent, 10);
    ring(ctx, aEnd.x - 3, aEnd.y - 3, aEnd.w + 6, MARK_H + 6, Math.max(eotLit * landed(eotIn), s2Lit), C.accent, 10);
    ring(ctx, endA.x - 3, endA.y - 3, endA.w + 6, MARK_H + 6, s1Lit, C.accent, 10);

    // e: the part read before need not be computed again (chapter 9)
    const reuse = tw(t, read + 0.4, pace.enter) * (1 - tw(t, at('clue') - lead - 0.4, 0.3));
    if (reuse > 0) {
      const y = bandBottom + 20;
      const font = F.jp(700, 14);
      const right = DOC.x + DOC.w - 14;
      const w = measure(ctx, font, REUSE) + 18;
      ctx.save();
      ctx.globalAlpha = reuse;
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2;
      line(ctx, DOC.x + 14, y, right - w - 8, y);
      ctx.setLineDash([]);
      ctx.restore();
      tag(ctx, right, y - 13, REUSE, { font, h: 26, padX: 9, fill: C.accent, color: '#fff', align: 'right', alpha: reuse });
    }

    // ——— in flight, behind the app's box (it is drawn over them)
    // a: the input, from where 5-3 docked it, down the lane and along 入力 to the tool
    const SY = SIDE_A + 15;
    const goPts = [[side.xIn + side.wIn / 2, SY], [T.lane, SY], [T.lane, L.call.y], [L.call.x2, L.call.y], [TOOL.x, L.call.y]];
    chipFlight(ctx, seg(t, runAt, runAt + GO), goPts, '京都、あした', F.jp(700, 16), C.accent, 0, 8);
    // a: the result, along 結果 and up the lane, into the app's hand (a small chip on the way; it opens
    // into the JSON there)
    const smallW = measure(ctx, F.jp(700, 16), '結果') + 20;
    const backPts = [[TOOL.x, L.back.y], [L.back.x2, L.back.y], [T.lane, L.back.y], [T.lane, SY], [side.RX - smallW / 2, SY]];
    chipFlight(ctx, seg(t, backAt, backAt + BACK), backPts, '結果', F.jp(700, 16), C.green, 8, 0);

    // ——— the app's box, and what it holds at its left
    actor(ctx, ACT, 1, actGlow);
    ring(ctx, ACT.x, ACT.y, ACT.w, ACT.h, makerLit, C.accent, 18);
    sideRows(ctx, t, { side, gone, used, runAt });
    // a: what it received, ringed; b: the result in its hand, outside the document
    const [recvLit] = lit(['recv'], at('run'));
    ring(ctx, side.xName, SIDE_A, side.xIn + side.wIn - side.xName, 30, recvLit, C.accent, 10);
    const held = inHand * (t < writeAt ? 1 : 0);
    openChip(ctx, side, tw(t, backAt + BACK, 0.35, inOutCubic), held);
    const [backLit] = lit(['back'], at('unseen'));
    ring(ctx, side.dock.x, SIDE_A, side.dock.w, 30, backLit * held, C.accent, 10);
    text(ctx, 'アプリの手元（文書の外）', side.RX, SIDE_B + 16, { font: F.jp(700, 15), color: C.purple, align: 'right', base: 'middle', alpha: pop('hand') * (1 - tw(t, writeAt, 0.3)) });
    // c: from the app's hand, down into the document under its mark
    const resY = R.y + R.h / 2;
    const handX = side.dock.x + side.dock.w / 2;
    chipFlight(ctx, seg(t, writeAt, writeAt + IN), [[handX, SY], [rowAt(R, 0).x + resW / 2, resY]], RES, CHIP, C.green, 0, 12);
    // b: the LLM cannot see it
    unseen(ctx, tw(t, at('unseen') - lead, 0.6, inOutCubic), 1 - tw(t, at('c'), 0.4), side.dock.x - 14, SY);

    // ——— above the LLM: 5-3's stop, then this one (g, h), and the two ways to stop (h, i)
    tag(ctx, NOTE.x, NOTE.y[0], '呼び出しの形を学習ずみ', { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: gone });
    const apiA = Math.max(gone, pop('why'));
    text(ctx, 'Anthropic の API が返す値', L.llm.x + L.llm.w / 2, L.llm.y - 68, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: apiA });
    stopBadge(ctx, L, gone, 'tool_use');
    stopBadge(ctx, L, tw(t, at('why') - lead, 0.4, (p) => outBack(p, 1.6)), 'end_turn', false);
    halt(ctx, Math.max(gone, tw(t, eotIn - 0.05, pace.enter)));
    stopPanel(ctx, { card: pop('choose'), rows: [pop('s1'), pop('a1'), pop('s2'), pop('a2')], note: tw(t, at('a2') - lead + 0.6, pace.enter) });

    // ——— the tool's place: the weather program runs (a)
    toolBox(ctx, L, 1, { solid: 0, glow: 0, draw: (c) => toolRows(c) });
    const r0 = rowBox(0);
    const hit = span(t, runAt + GO * 0.8, backAt + 0.3);
    ring(ctx, r0.x, r0.y, r0.w, r0.h, hit, C.accent, 12);
    spin(ctx, glyphBox(r0).x - 24, r0.y + r0.h / 2, seg(t, workAt, backAt));
    ring(ctx, TOOL.x, TOOL.y, TOOL.w, TOOL.h, a1Lit, C.accent, 20);
    const w0 = text(ctx, 'ツール', TOOL.x, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    text(ctx, 'の場所', TOOL.x + w0, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });

    // ——— in flight, over everything
    // c, d: the app's marks, out of its box
    flyMark(ctx, T, R, seg(t, markAt, markAt + FLY), ROLE.result, { edge: WRITER.result });
    flyMark(ctx, T, A, seg(t, openAt, openAt + FLY), ROLE.assistant, { edge: WRITER.assistant });
    // e: the app has the LLM read the document, down to the new open mark
    sweep(ctx, L, seg(t, read + 0.05, read + 1.0), A.y + MARK_H);
    send(ctx, L.read, seg(t, read + 0.45, read + 1.05), '', 'doc');
    // f, g: the answer's tokens and its end mark, along the write channel and in under the answer
    ansToks.forEach((tk, k) => {
      const p = seg(t, ansAt[k], ansAt[k] + TOK);
      if (p <= 0 || p >= 1) return;
      const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
      const pt = onPath(writePath(T, A, tk.x + w / 2, tk.y), inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
    });
    const pe = seg(t, eotAt, eotIn);
    if (pe > 0 && pe < 1) {
      const pt = onPath(writePath(T, A, aEnd.x + aEnd.w / 2, aEnd.y + MARK_H / 2), inOutCubic(pe));
      roleMark(ctx, pt.x - aEnd.w / 2, pt.y - MARK_H / 2, ROLE.end, { edge: WRITER.end, alpha: clamp(pe * 8) });
    }
    // h: the app looks at what the generation stopped on
    const look = span(t, at('why') - lead, at('h.end') - 0.3);
    if (look > 0) {
      const y = aEnd.y + MARK_H / 2;
      lookLine(ctx, [[LOOKX, ACT.y + ACT.h + 4], [LOOKX, y], [aEnd.x + aEnd.w + 9, y]], tw(t, at('why') - lead, 0.5, inOutCubic), look);
    }

    // ——— the key to the edges, under the LLM, and the example's note
    edgeKey(ctx, T.KEY, [[BY.app, 'アプリが付ける', 1], [BY.llm, 'LLM が書く', 1]]);
    const ex = { x: L.app.x, y: L.app.y + L.app.h + 22 };
    const exW = measure(ctx, F.jp(700, 17), '例') + 20;
    example(ctx, ex.x, ex.y, 1, '');
    text(ctx, NOTE53, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: gone });
    text(ctx, NOTE54, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: fresh });

    // ——— 5-3's last picture: gpt-oss's call, where the screen is
    ossCard(ctx, gone, oss);
  },
});

const CHIP = F.mono(600, 15); // the result while the app holds it
const SIDE_A = ACT.y + 2;
const SIDE_B = ACT.y + ACT.h - 32;
// The look from the app's box: down the document's right margin.
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

// A chip on its way along a polyline (eased overall). fin, fout: how fast it fades in at its start and
// out at its end (0: not at all — it leaves a dock, or lands in one, as the same chip).
function chipFlight(ctx, p, pts, s, font, fill, fin, fout) {
  if (p <= 0 || p >= 1) return;
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.globalAlpha = (fin ? clamp(p * fin) : 1) * (fout ? clamp((1 - p) * fout) : 1);
  tag(ctx, pt.x, pt.y - 15, s, { font, h: 30, padX: 10, fill, color: '#fff', align: 'center', r: 8 });
  ctx.restore();
}

// a: the result in the app's hand: the small chip that brought it opens leftwards into the JSON (p 0 → 1).
function openChip(ctx, side, p, a) {
  if (a <= 0.001) return;
  const small = measure(ctx, F.jp(700, 16), '結果') + 20;
  const w = lerp(small, side.dock.w, p);
  const x = side.RX - w;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, SIDE_A, w, 30, 8);
  ctx.fillStyle = C.green;
  ctx.fill();
  ctx.beginPath();
  ctx.rect(x, SIDE_A, w, 30);
  ctx.clip();
  text(ctx, '結果', side.RX - small / 2, SIDE_A + 16, { font: F.jp(700, 16), color: '#fff', align: 'center', base: 'middle', alpha: 1 - clamp(p * 3) });
  text(ctx, RES, side.RX - side.dock.w / 2, SIDE_A + 16, { font: CHIP, color: '#fff', align: 'center', base: 'middle', alpha: clamp((p - 0.4) / 0.6) });
  ctx.restore();
}

// b: the LLM cannot see what is in the app's hand — a dashed look from the LLM, crossed out.
function unseen(ctx, p, a, x2, y) {
  if (p <= 0 || a <= 0.001) return;
  const x1 = NOTE.x;
  const y1 = L.llm.y - 12;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  path(ctx, [[x1, y1], [x1, y], [x2, y]], p);
  ctx.setLineDash([]);
  ctx.restore();
  const k = clamp((p - 0.7) / 0.3);
  if (k <= 0) return;
  const cx = (x1 + L.app.x) / 2; // left of the app's frame
  ctx.save();
  ctx.globalAlpha = a * k;
  ctx.fillStyle = C.paper;
  circle(ctx, cx, y, 24);
  ctx.fill();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 4;
  line(ctx, cx - 10, y - 10, cx + 10, y + 10);
  line(ctx, cx + 10, y - 10, cx - 10, y + 10);
  ctx.restore();
  text(ctx, 'LLM からは見えない', cx, y + 52, { font: F.jp(700, 17), color: C.red, align: 'center', alpha: a * k });
}

// One row of the definitions at the head (as toolcall.js draws it).
function drawDef(ctx, r, y) {
  r.segs.forEach((sg) => text(ctx, sg.s, sg.x, y, { font: sg.font, color: sg.part === 'head' ? C.ink2 : C.ink }));
}

// 5-3's call as the LLM wrote it: the band, the marks, the JSON. 5-3's notes on it (this picture's form,
// JSON, and the stop as in 4-2) fade with `gone`.
function drawCall(ctx, { band, open, end, toks, gone }) {
  ctx.save();
  ctx.globalAlpha = 1;
  rr(ctx, band.x, band.y, band.w, band.h, 8);
  ctx.fillStyle = C.accentSoft;
  ctx.fill();
  ctx.fillStyle = C.accent;
  ctx.fillRect(band.x, band.y + 6, 4, band.h - 12);
  ctx.restore();
  text(ctx, FORM_NOTE, band.x + band.w, band.y - 9, { font: F.jp(500, 14), color: C.muted, align: 'right', alpha: gone });
  tag(ctx, band.x + band.w - 10, open.y, 'JSON', { font: F.mono(600, 14), h: 28, padX: 10, fill: '#fff', stroke: C.accent, color: C.accent, align: 'right', alpha: gone });
  roleMark(ctx, open.x, open.y, ROLE.call, { edge: WRITER.call });
  toks.forEach((tk) => text(ctx, tk.s, tk.x, tk.base, { font: CFONT, color: C.ink }));
  roleMark(ctx, end.x, end.y, ROLE.callEnd, { edge: WRITER.callEnd });
  if (gone > 0.001) {
    const font = F.jp(500, 15);
    const tail = 'で止めたのと同じ';
    const right = band.x + band.w;
    const cy = band.y + band.h + 24;
    const w1 = measure(ctx, font, tail);
    const mw = miniMark(ctx, 0, 0, ROLE.end.name, 0);
    const x0 = right - w1 - 6 - mw - 6 - measure(ctx, font, '4-2 で、');
    const w0 = text(ctx, '4-2 で、', x0, cy, { font, color: C.muted, base: 'middle', alpha: gone });
    miniMark(ctx, x0 + w0 + 6, cy - 11, ROLE.end.name, gone);
    text(ctx, tail, right, cy, { font, color: C.muted, align: 'right', base: 'middle', alpha: gone });
  }
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

// Left of the app's box, as 5-3 leaves it: what it received (the input leaves for the tool in a, the
// name and its label once the tool runs), and the two ways it may run the tool (gone in the bridge).
function sideRows(ctx, t, { side, gone, used, runAt }) {
  text(ctx, side.recv.label, side.xRecv, SIDE_A + 16, { font: F.jp(500, 15), color: C.muted, align: 'right', base: 'middle', alpha: used });
  tag(ctx, side.xName, SIDE_A, side.recv.name, { font: F.mono(600, 16), h: 30, padX: 10, fill: C.accent, color: '#fff', r: 8, alpha: used });
  tag(ctx, side.xIn, SIDE_A, side.recv.input, { font: F.jp(700, 16), h: 30, padX: 10, fill: C.accent, color: '#fff', r: 8, alpha: t < runAt ? 1 : 0 });
  const way = (x, i) => tag(ctx, x, SIDE_B, side.ways[i], { font: F.jp(700, 15), h: 30, padX: 10, fill: C.purpleSoft, stroke: C.purple, color: C.purple, lw: 2, alpha: gone });
  way(side.xWay0, 0);
  text(ctx, '／', side.xSlash, SIDE_B + 16, { font: F.jp(500, 16), color: C.muted, align: 'right', base: 'middle', alpha: gone });
  way(side.xWay1, 1);
}

// The app stops the writing — the purple tag on the write channel, as in 4-2 and 5-3.
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

// h, i: the two ways this example stops, each with the value Anthropic's API reports and what the app
// does next; a limit can stop it too.
function stopPanel(ctx, { card, rows, note }) {
  if (card <= 0.001) return;
  const P = PANEL;
  ctx.save();
  ctx.globalAlpha = card;
  rr(ctx, P.x, P.y, P.w, P.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  const x = P.x + 18;
  text(ctx, '止まった理由 → アプリが次にすること', x, P.y + 27, { font: F.jp(700, 14), color: C.muted, alpha: card });
  STOPS.forEach((st, i) => {
    const y = P.y + 58 + i * 58;
    const ca = rows[i * 2];
    const w = text(ctx, st.case, x, y, { font: F.jp(700, 16), color: C.ink, alpha: ca });
    tag(ctx, x + w + 10, y - 18, st.value, { font: F.mono(600, 13), h: 24, padX: 9, fill: st.hot ? C.accent : C.ink2, color: '#fff', alpha: ca });
    text(ctx, `→ ${st.act}`, x + 14, y + 26, { font: F.jp(700, 16), color: C.purple, alpha: rows[i * 2 + 1] });
  });
  text(ctx, 'ほかに、長さの上限などで止まることもある', x, P.y + P.h - 13, { font: F.jp(500, 13), color: C.muted, alpha: note });
}

// The tool's place as 5-3 leaves it: the chapter's three tools in rows, each with its program.
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

// A program at work: a ring turning beside it while p runs.
function spin(ctx, cx, cy, p) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.globalAlpha = clamp(p * 8) * clamp((1 - p) * 8);
  const a0 = p * Math.PI * 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 11, a0, a0 + Math.PI * 1.3);
  ctx.stroke();
  ctx.restore();
}

// k: a row on the screen saying what the app did (the lookup, now done), where the answer was
// (it moves down), and what it is.
function progressRow(ctx, b, a) {
  if (a <= 0.001) return;
  const y = b.y + 16;
  const x = SCREEN.x + 24;
  ctx.save();
  ctx.globalAlpha = a;
  // the lookup is done by now (the answer is below it): a check, not a spinner
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 2, y);
  ctx.lineTo(x + 7, y + 5);
  ctx.lineTo(x + 16, y - 6);
  ctx.stroke();
  ctx.restore();
  text(ctx, PROG, x + 28, y + 1, { font: F.jp(500, 17), color: C.ink2, base: 'middle', alpha: a });
  text(ctx, '途中のようすを画面に出すアプリの例', SCREEN.x + SCREEN.w, SCREEN.y + SCREEN.h + 28, { font: F.jp(500, 14), color: C.muted, align: 'right', alpha: a });
}

// 5-3's card: the call made to fit gpt-oss's format, where the screen is; it fades with f.
function ossCard(ctx, f, oss) {
  if (f <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = f;
  rr(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 18);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  const x = CARD.x + 20;
  text(ctx, 'gpt-oss の形式に合わせた例', x, CARD.y + 34, { font: F.jp(700, 18), color: C.ink, alpha: f });
  text(ctx, '説明のために作ったもので、実際の出力ではない', x, CARD.y + 58, { font: F.jp(500, 14), color: C.muted, alpha: f });
  const rowY = [CARD.y + 98, CARD.y + 130, CARD.y + 190, CARD.y + 222];
  oss.forEach((row, r) => {
    row.forEach((sg) => {
      const k = sg.kind === 'name' ? 0 : sg.kind === 'input' ? 1 : -1;
      if (k >= 0) {
        ctx.save();
        ctx.globalAlpha = f;
        rr(ctx, sg.x - 3, rowY[r] - 17, sg.w + 6, 24, 5);
        ctx.fillStyle = C.accentSoft;
        ctx.fill();
        ctx.restore();
        tag(ctx, sg.x - 3, rowY[r] + 12, k === 0 ? 'ツールの名前：宛先に書く' : '入力：本文に書く', { font: F.jp(700, 14), h: 24, padX: 8, fill: '#fff', stroke: C.accent, color: C.accent, alpha: f });
      }
      text(ctx, sg.s, sg.x, rowY[r], { font: sg.font, color: sg.kind === 'sp' ? C.purple : C.ink, alpha: f });
    });
  });
  const ky = CARD.y + 290;
  const kw = text(ctx, '<|…|>', x, ky, { font: OSPEC, color: C.purple, alpha: f });
  text(ctx, '：形式で決まった特別なトークン', x + kw + 4, ky, { font: F.jp(500, 14), color: C.muted, alpha: f });
  text(ctx, '改行は、見やすくするために入れた', x, ky + 22, { font: F.jp(500, 14), color: C.muted, alpha: f });
  source(ctx, 'OpenAI harmony の形式（gpt-oss）', f, SOURCE_RIGHT);
}
