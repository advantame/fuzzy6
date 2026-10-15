// 5-5: running until it answers. Told from the designer's side (Boss, 2026-10-15), like 5-1 … 5-4. A new
// question: "if it rains in Kyoto tomorrow, where can I have a good time indoors?" In this example the
// weather comes first, and only if it rains does a search follow — what to ask for next depends on the
// result that comes back. So we write the app's work as a loop, shown as pseudo-code in the app's colour —
// large in the app's frame under the raised paper while it is explained, then parked above the LLM (tied
// by a dashed line to the loop mark by the app's box) while it runs: have the LLM read the document; if it stopped on a
// call (tool_use), run the tool and write the result in, and have it read again; if it finished an answer
// (end_turn), leave the loop; on any other stop (a length limit …), stop and tell. Three rounds run with
// the running line lit, and the document piles up two calls and two results under their numbers (#1, #2).
// Rounds and tool runs are counted apart under the LLM ("3 周、ツールは 2 回"); a sunny forecast would
// end in two rounds with one tool run (a row of its own — the document is not rewritten). Who decides
// how many rounds: the app looks at what the LLM wrote (a call, or the end of an answer) and moves on.
// A cap on the rounds is a line the app can add. The years: OpenAI added function calling to its API
// (2023), Anthropic made its tool-use API generally available (2024).
//
// The layout is the chapter's (lib/rig.js toolUseLayout). The clip joins 5-4 (spec §6.10): its first
// frame is 5-4's last picture, drawn here as toolresult.js draws it, and the bridge clears 5-4's
// conversation and notes (the stops card, end_turn, the stop, the numbers, the key to the edges, the
// progress row) so a new conversation starts under the folded definitions. Everything in the
// conversation is an example: the forecast, the search words and results, the answer (cut into tokens
// as o200k_base cuts them), the pseudo-code and the counts (research/tool-facts 論点 6, 7).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import {
  toolUseLayout, chatScreen, screenBubbles, chatBubble, screenLinks, toTool, fromTool, writePath, flyMark, edgeKey, loopIcon,
  llmBlock, appFrame, toolBox, channel, actor, token, TOKEN, tokenPlaces, onPath, docLayout, docEntry, rowAt, sweep, send, stopBadge,
  roleMark, markWidth, MARK_H, ROLE, BY, WRITER,
} from '../lib/rig.js';
import { text, measure, rr, path, circle, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { focus, ring } from '../../../src/kit/cue.js';

const T = toolUseLayout();
const { L, ACT, SCREEN, LOOP } = T;
const TOOL = L.tool;
const DOC = L.doc;

// ——— 5-4's picture, as toolresult.js has it (its last frame is this clip's first)
const Q54 = 'あしたの京都の天気は？';
const REQ = 'あしたの京都の天気予報を調べたい';
const ANS51 = 'あしたの京都は晴れで、最高気温は24℃の予報です。';
const RESULT51 = '京都　あした：晴れ　最高 24℃';
const KINDS = [['天気予報', '都市と日 → 予報'], ['検索', '言葉 → 文章'], ['計算機', '式 → 答え']];
const ROW = { x: TOOL.x + 20, y: TOOL.y + 20, w: TOOL.w - 40, h: (TOOL.h - 40 - 22) / 3, gap: 11 };
const rowBox = (i) => ({ x: ROW.x, y: ROW.y + i * (ROW.h + ROW.gap), w: ROW.w, h: ROW.h });
const glyphBox = (r) => ({ x: r.x + r.w - 124, y: r.y + 12, w: 110, h: r.h - 24 });
const DLH = 29;
const DTOP = DOC.y + 26;
const DX = DOC.x + 18 + 122 + 12; // where the entries' text starts (docLayout's tx)
const SYS = { x: DOC.x + 18, y: DTOP };
const defY = (k) => DTOP + 21 + DLH * k;
const SHIFT_Q53 = 28 + DLH * 3 + 40;
const SHIFT_A53 = SHIFT_Q53 + 28;
const CALL_ROWS = [
  ['{"', 'name', '":', ' "', 'get', '_weather', '",'],
  [' "', 'input', '":', ' {"', 'city', '":', ' "', '京都', '",'],
  [' "', 'day', '":', ' "', 'あ', 'した', '"}}'],
];
const CFONT = F.mono(500, 18);
const CLH = 36;
const FOLDED = 'get_weather などのツールの定義（省略）';
const SHIFT_Q = 28 + 40;
const DY_A = SHIFT_Q - SHIFT_A53;
const RES54 = '{"天気": "晴れ", "最高気温": 24}';
const ANS54_DOC = 'あしたの京都は晴れで、\n最高気温は24℃の予報です。';
const ID_NOTE = '番号は模式。API では、呼び出しの id で結果を対応づける';
const PROG = '天気予報を調べました';
const NOTE54 = '会話、呼び出し、結果は説明のための例';
const PANEL = { x: 36, y: 80, w: 330, h: 182 };
const STOPS = [
  { case: '呼び出しで止まった', value: 'tool_use', hot: true, act: 'ツールを動かす' },
  { case: '答えを書き終えた', value: 'end_turn', hot: false, act: 'このやりとりを終える' },
];

// ——— this clip
// The head moves up a little and names the search tool too; a new conversation starts under it.
const DTOP5 = DOC.y + 12;
const SYS5 = { x: SYS.x, y: DTOP5 };
const FOLDED5 = 'get_weather、search_web などのツールの定義（省略）';
const Q = 'あしたの京都が雨なら、屋内で楽しめる所を教えて';
const Q_SCREEN = 'あしたの京都が雨なら、\n屋内で楽しめる所を教えて';
// the LLM's two calls, row by row, as o200k_base cuts them (23 and 24 tokens)
const CALL1 = CALL_ROWS;
const CALL2 = [
  ['{"', 'name', '":', ' "', 'search', '_web', '",'],
  [' "', 'input', '":', ' {"', 'query', '":'],
  [' "', '京都', 'の', '雨', 'の日', 'の', '屋', '内', '観', '光', '"}}'],
];
const RES1 = '{"天気": "雨", "最高気温": 19}';
const RES2 = '{"結果": ["京都国立博物館",\n "京都水族館", "錦市場"]}';
// the answer, one token at a time (as o200k_base cuts it: 30 tokens); in the document it breaks where the
// screen's bubble does
const ANS = ['あ', 'した', 'の', '京都', 'は', '雨', 'の', '予', '報', 'です', '。', '屋', '内', 'なら', '、', '京都', '国', '立', '博', '物', '館', 'や', '京都', '水', '族', '館', 'がお', 'すすめ', 'です', '。'];
const ANS_DOC = 'あしたの京都は雨の予報です。\n屋内なら、京都国立博物館や\n京都水族館がおすすめです。';
const MFONT = F.mono(500, 15); // JSON in this clip's document
const MLH = 28; // a row of a call
const TFONT = F.jp(500, 20); // text in this clip's document

// The app's work as pseudo-code, left of the LLM's top (where 5-4's card on the stops was).
const CODE = { x: 30, y: 46, w: 340, h: 308 };
// while it is explained (d–f) the card stands large in the app's frame, under the raised paper
const BIG = { s: 1.4, x: 726 - (340 * 1.4) / 2, y: 362 };
const CODE_LH = 23;
const CODE_Y0 = CODE.y + 62; // the first line's baseline
const CODE_X0 = CODE.x + 30; // the text's left edge at no indent
const INDENT = 18;
const CF = F.jp(500, 16);
const LINES = [
  { s: 'くり返す', ind: 0, head: true },
  { s: 'LLM に文書を読ませる', ind: 1 },
  { s: '呼び出しで止まったら', ind: 1, value: 'tool_use', hot: true },
  { s: 'ツールを動かして、結果を書き足す', ind: 2 },
  { s: '答えを書き終えたら', ind: 1, value: 'end_turn' },
  { s: 'くり返しを抜ける', ind: 2 },
  { s: 'それ以外で止まったら', ind: 1, note: '（長さの上限など）' },
  { s: '止めて知らせる', ind: 2 },
  { s: '周の数が上限に着いたら', ind: 1 },
  { s: '止めて知らせる', ind: 2 },
];
const lineY = (i) => CODE_Y0 + i * CODE_LH;
const lineX = (i) => CODE_X0 + LINES[i].ind * INDENT;
const BRACKET_X = CODE.x + 17;

// Under the LLM: the rounds of this example and of a sunny one, counted apart; then the years.
const TRK = { x: 36, y: 570, w: 330 };
const ROWS = [
  { y: TRK.y, label: '雨の予報なら', chips: [['天気を頼む', 'call'], ['検索を頼む', 'call'], ['答える', 'ans']] },
  { y: TRK.y + 62, label: '晴れの予報なら', chips: [['天気を頼む', 'call'], ['答える', 'ans']] },
];
const CHIP = { font: F.jp(700, 14), h: 28, padX: 10, gap: 26 };
const MULTI = ['この例では、1 周に呼び出しは一つ。', '一度に複数の呼び出しを書けるモデルもある'];
const YEARS = [
  { year: '2023', who: 'OpenAI', what: '関数呼び出しを API に追加' },
  { year: '2024', who: 'Anthropic', what: 'ツールを使う API を一般に提供' },
];
const YR = { x: 36, y: 738, h: 46 };

const FLY = 0.55; // a mark flying out of the app's box
const TOK = 0.42; // a token along the write channel and into its place
const EOT = 0.5; // a mark the LLM writes, the same way
const READ = 0.95; // the app has the LLM read the document
const GO = 0.6; // the input, from the call to the tool
const WORK = 0.45; // the tool at work
const BACK = 0.65; // the result, from the tool into its place
const STEP = 0.32; // how long the app's check of the stop is lit
const MOVE = 0.9; // g: the code card from the app's frame to its place beside the LLM

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n token times, evenly from a, the last one landing by b
const times = (n, a, b) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - TOK - a)) / Math.max(1, n - 1));

export default clip({
  id: 'toolloop',
  title: '答えるまで回す',
  kicker: 'ツール使用のループ',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.9, // 5-4's conversation and notes clear away; skipped unless the clip is joined from 5-4
  script: [
    { id: 'a', text: 'こんどは、{ask}「あしたの京都が雨なら、\n屋内で楽しめる所を[教えて」と|おしえてと]聞かれたとしましょう。' },
    { id: 'b', text: 'この例では、まず{w}天気を調べて、{rain}雨なら、\n{s}屋内の場所も検索することになるわね。' },
    { id: 'c', text: '{next}次に何を頼むかは、{res}返ってきた結果によって変わるの。' },
    { id: 'd', text: 'そこで、{code}アプリの動きを、{loop}くり返しの形に書いておくの。' },
    { id: 'e', text: '{read}LLM に文書を読ませて、{call}呼び出しで止まったら、\n{run}ツールを動かして結果を書き足し、{again}また読ませるわ。' },
    { id: 'f', still: true, tail: 0.6, text: '{fin}答えを書き終えたら、{exit}くり返しを抜けるの。' },
    { id: 'g', lead: 2.4, tail: 1.1, text: '{r1}一周めでは、{w1}LLM が天気のツールを頼んで、\n{rain1}雨の予報が返ってくるわ。' },
    { id: 'h', lead: 1.5, tail: 2.0, text: '{r2}二周めでは、{read2}それを読んだ LLM が、\n{q2}屋内の見どころを検索するよう頼むの。' },
    { id: 'i', still: true, lead: 1.5, tail: 1.8, text: '{r3}三周めで、{two}二つの結果をもとに{ans}答えを書いて、{done}終わるわ。' },
    { id: 'j', still: true, text: '{sun}晴れの予報なら、{two2}二周めで、\n検索せずに答えを書いて終わるわね。' },
    { id: 'k', by: 'zunda', text: '{who}何回まわるかは、だれが決めているのだ？' },
    { id: 'l', text: '{wrote}LLM が次の呼び出しを書くか、{fin2}答えを書き終えるかを見て、\n{app}アプリが次へ進めるの。' },
    { id: 'm', still: true, text: 'ただ、いつまでも終わらないと困るから、\n{limit}回る回数に、上限を付けておくこともできるわ。' },
    { id: 'n', text: '{y23}OpenAI は 2023 年に、関数呼び出しを API に加えたわ。' },
    { id: 'n2', text: '{y24}Anthropic も 2024 年に、\nツールを使う API を、一般に提供したの。' },
    { id: 'o', tail: 0.8, text: '次の章では、{place}このツールの場所に、\n{many}いろいろなものをつないでいきましょう。' },
  ],

  prepare(ctx) {
    // ——— 5-4's last picture, laid out as toolresult.js lays it out
    const ent = (role, s, kind = 'text') => ({ role, text: s, kind });
    const E = docLayout(ctx, L, [
      ent('user', Q54), { ...ent('assistant', REQ, 'call'), gap: 54 }, ent('result', RESULT51, 'data'), ent('assistant', ANS51),
    ], T.DOC);
    const B54 = screenBubbles(ctx, SCREEN, [['user', Q54], ['assistant', 'あしたの京都は晴れで、\n最高気温は24℃の予報です。']]);
    const band54 = { x: E[1].tx, y: E[1].y + SHIFT_A53, w: E[1].w, h: CALL_ROWS.length * CLH + 18 };
    const tx0 = band54.x + 17;
    const base = (r) => band54.y + 9 + r * CLH + 25;
    const openW = markWidth(ctx, ROLE.call.name);
    const endW = markWidth(ctx, ROLE.callEnd.name);
    const jx = tx0 + openW + 12;
    const open54 = { x: tx0, y: band54.y + 9 + 4, w: openW };
    const toks54 = [];
    const rowEnd = [];
    CALL_ROWS.forEach((row, r) => {
      let x = jx;
      row.forEach((s) => {
        toks54.push({ s, x, base: base(r) });
        x += measure(ctx, CFONT, s);
      });
      rowEnd.push(x);
    });
    const last = CALL_ROWS.length - 1;
    const end54 = { x: rowEnd[last] + 12, y: band54.y + 9 + last * CLH + 4, w: endW };
    const bandBottom = band54.y + DY_A + band54.h;
    const [R54, A54] = docLayout(ctx, L, [
      { role: 'result', kind: 'data', text: RES54, font: CFONT, gap: 50 }, { role: 'assistant', text: ANS54_DOC },
    ], { ...T.DOC, top: bandBottom + 40 - DOC.y });
    const lastRow = rowAt(A54, A54.rows.length - 1);
    const aEnd54 = { x: lastRow.x + measure(ctx, A54.font, A54.rows[A54.rows.length - 1]) + 16, y: lastRow.y - 22, w: markWidth(ctx, ROLE.end.name) };
    const old = { E, B: B54, band: band54, open: open54, end: end54, toks: toks54, R: R54, A: A54, aEnd: aEnd54 };

    // ——— this clip's document: the question, two calls with their results, the answer
    const opts = { ...T.DOC, font: TFONT, lh: 28, mono: MFONT, lhMono: 24 };
    const one = (e, y) => docLayout(ctx, L, [e], { ...opts, top: y - DOC.y })[0];
    let y = SYS5.y + MARK_H + 18;
    const Qe = one({ role: 'user', text: Q }, y);
    y = Qe.y + Qe.h + 12;
    const call1 = callLayout(ctx, { x: DX, y, w: Qe.w, h: 3 * MLH + 16 }, CALL1);
    y = call1.band.y + call1.band.h + 10;
    const R1 = one({ role: 'result', kind: 'data', text: RES1 }, y);
    y = R1.y + R1.h + 12;
    const call2 = callLayout(ctx, { x: DX, y, w: Qe.w, h: 3 * MLH + 16 }, CALL2);
    y = call2.band.y + call2.band.h + 10;
    const R2 = one({ role: 'result', kind: 'data', text: RES2 }, y);
    y = R2.y + R2.h + 14;
    const A = one({ role: 'assistant', text: ANS_DOC }, y);
    const ansToks = tokenPlaces(ctx, A, ANS);
    const aRow = rowAt(A, A.rows.length - 1);
    const aEnd = { x: aRow.x + measure(ctx, A.font, A.rows[A.rows.length - 1]) + 14, y: aRow.y - 21, w: markWidth(ctx, ROLE.end.name) };
    const B = screenBubbles(ctx, SCREEN, [['user', Q_SCREEN], ['assistant', ANS_DOC]]);

    // the rows under the LLM: each chip's place
    const chips = ROWS.map((row) => {
      let x = TRK.x;
      return row.chips.map(([s, kind]) => {
        const w = measure(ctx, CHIP.font, s) + CHIP.padX * 2;
        const c = { s, kind, x, w, y: row.y + 24 };
        x += w + CHIP.gap;
        return c;
      });
    });
    // d–f: the paper rises to just under the question, and the code is shown large in the app's frame
    const paperUp = Qe.y + Qe.h + 18 - DOC.y;
    if (A.y + A.h > DOC.y + DOC.h - 6) throw new Error(`toolloop: the document overflows (${A.y + A.h})`);
    return { old, Qe, call1, R1, call2, R2, A, ansToks, aEnd, B, chips, paperUp };
  },

  draw(ctx, t, s, { at, pace }) {
    const { old, Qe, call1, R1, call2, R2, A, ansToks, aEnd, B, chips, paperUp } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (names, until) => focus(t, names.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 5-4's conversation and notes clear away, the head moves up and names search_web too.
    // The first frame is 5-4's untouched.
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.55));
    const fresh = inOutCubic(seg(t, br * 0.4, br));
    const move = inOutCubic(seg(t, 0, br));
    const dySys = (DTOP5 - DTOP) * move;

    // ——— when things happen
    // a: the question comes in, and the app writes it under the user's mark
    const askAt = at('ask') - lead;
    const userAt = askAt + 0.45;
    // the three rounds (g, h, i): the app writes the assistant's mark and has the LLM read; the LLM writes;
    // the app looks at the stop, and (rounds 1, 2) runs the tool and writes the result in
    // d: the paper rises; g: the code card parks beside the LLM and the paper comes back down
    const up = inOutCubic(seg(t, at('d'), at('d') + 0.6));
    const park = inOutCubic(seg(t, at('g'), at('g') + MOVE));
    const round = (id, k) => {
      const st = at(id) + (k === 1 ? MOVE : 0);
      const mark = st + 0.05;
      const read = mark + FLY - 0.1;
      return { st, mark, read, wrote: read + READ };
    };
    const r1 = round('g', 1);
    r1.open = Math.max(r1.wrote, at('r1') - 0.1);
    r1.tok = times(call1.toks.length, r1.open + EOT - 0.2, Math.max(at('w1') + 1.1, r1.open + EOT + 1.4));
    const r2 = round('h', 2);
    r2.open = Math.max(r2.wrote, at('read2') + 0.35);
    r2.tok = times(call2.toks.length, r2.open + EOT - 0.2, Math.max(at('q2') + 1.0, r2.open + EOT + 1.4));
    [r1, r2].forEach((r) => {
      r.fin = r.tok[r.tok.length - 1] + TOK;
      r.stop = r.fin + EOT;
      r.go = r.stop + STEP;
      r.work = r.go + GO;
      r.back = r.work + WORK;
      r.resMark = r.back + BACK * 0.35;
      r.resIn = r.back + BACK;
      r.done = r.resIn + 0.35;
    });
    const r3 = round('i', 3);
    const a3 = Math.max(r3.wrote, at('ans') - 0.35);
    r3.tok = times(ANS.length, a3, Math.max(at('done') + 0.3, a3 + 1.6));
    r3.fin = r3.tok[r3.tok.length - 1] + TOK;
    r3.stop = r3.fin + EOT;
    r3.check = r3.stop + 0.22; // the tool_use line, passed by
    r3.exit = r3.check + STEP + 0.1;
    r3.done = r3.exit + 0.5;
    const landedAns = (time) => ansToks.reduce((u, tk, k) => (time >= r3.tok[k] + TOK ? tk.upto : u), 0);
    const callLanded = (c, r) => (time) => c.toks.reduce((n, _, k) => (time >= r.tok[k] + TOK ? k + 1 : n), 0);
    const c1n = callLanded(call1, r1)(t);
    const c2n = callLanded(call2, r2)(t);

    // ——— who is at work
    const [appLit] = lit(['app'], at('l.end'));
    const [codeLit] = lit(['code'], at('loop'));
    const actGlow = Math.max(
      span(t, userAt - 0.1, userAt + FLY),
      ...[r1, r2, r3].map((r) => span(t, r.mark, r.wrote)),
      ...[r1, r2].map((r) => span(t, r.stop, r.done - 0.2)),
      span(t, r3.stop, r3.exit + 0.3),
      codeLit,
      appLit,
    );
    const llmGlow = Math.max(...[r1, r2].map((r) => span(t, r.wrote - 0.1, r.stop)), span(t, r3.wrote - 0.1, r3.stop));
    const writing = [r1, r2].some((r) => t >= r.open && t < r.stop) || (t >= r3.tok[0] && t < r3.stop);

    // ——— the chat screen: 5-4's conversation leaves, this one comes in
    chatScreen(ctx, SCREEN, 1);
    const [placeLit] = lit(['place'], at('o.end'));
    ctx.save();
    ctx.globalAlpha *= gone;
    chatBubble(ctx, old.B[0]);
    const bAns = { ...old.B[1], y: old.B[1].y + 38 };
    chatBubble(ctx, bAns, { alpha: 1, chars: 1 });
    ctx.restore();
    progressRow(ctx, old.B[1], gone);
    chatBubble(ctx, B[0], { alpha: tw(t, askAt, 0.35) });
    chatBubble(ctx, B[1], { alpha: tw(t, r3.tok[0] + TOK, 0.2), chars: landedAns(t - 0.12) });
    screenLinks(ctx, T, { talk: 1, back: 1, talkHot: span(t, askAt, userAt + 0.3) > 0.5, backHot: span(t, r3.tok[0] + TOK, r3.fin + 0.2) > 0.5 });

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, up * (1 - park) > 0 ? { ...L, doc: { ...DOC, h: lerp(DOC.h, paperUp, up * (1 - park)) } } : L, 1, { name: '' });
    llmBlock(ctx, L, 1, { glow: llmGlow });
    const [wroteLit, fin2Lit] = lit(['wrote', 'fin2'], at('l.end'));
    ring(ctx, L.llm.x, L.llm.y, L.llm.w, L.llm.h, wroteLit, C.accent, 22);
    channel(ctx, L.read, 1);
    channel(ctx, L.write, 1, { hot: llmGlow > 0.5 && writing });
    channel(ctx, L.call, 1, { hot: [r1, r2].some((r) => span(t, r.go, r.work) > 0.5) });
    channel(ctx, L.back, 1, { hot: [r1, r2].some((r) => span(t, r.back, r.back + BACK * 0.6) > 0.5) || span(t, at('res') - lead, at('c.end')) > 0.5 });

    // ——— the document. 5-4's conversation fades; the head stays (moved up a little).
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      drawOld(ctx, old);
      ctx.restore();
    }
    text(ctx, FOLDED, DX, defY(0) + dySys, { font: F.jp(500, 17), color: C.muted, alpha: 1 - fresh });
    text(ctx, FOLDED5, DX, defY(0) + dySys, { font: F.jp(500, 17), color: C.muted, alpha: fresh });
    roleMark(ctx, SYS.x, SYS.y + 1 + dySys, ROLE.system, { edge: WRITER.system });

    // a: the question
    const qIn = t >= userAt + FLY;
    if (qIn) {
      docEntry(ctx, Qe, 1, { tagAlpha: 0, chars: tw(t, userAt + FLY - 0.05, 0.3) });
      roleMark(ctx, Qe.x, Qe.y + 1, ROLE.user, { edge: WRITER.user });
    }
    // rounds 1, 2: the assistant's mark, the call, its result; round 3: the assistant's mark, the answer
    const [read2Lit] = lit(['read2'], at('q2'));
    const [twoLit] = lit(['two'], at('ans'));
    const calls = [[call1, r1, c1n, R1, RES1], [call2, r2, c2n, R2, RES2]];
    calls.forEach(([c, r, n, R], k) => {
      if (t >= r.mark + FLY) roleMark(ctx, DOC.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
      drawCall(ctx, c, { bandA: tw(t, r.open + EOT - 0.1, 0.25), open: t >= r.open + EOT, n, end: t >= r.fin + EOT });
      idTag(ctx, c.band, c.open.y, k + 1, tw(t, r.stop - 0.1, pace.enter));
      // the result, typed in as it lands
      if (t >= r.resMark + FLY) roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
      const ri = tw(t, r.resIn - 0.05, 0.3);
      if (ri > 0) docEntry(ctx, R, ri, { tagAlpha: 0 });
      idTag(ctx, c.band, R.y + R.h / 2 - 14, k + 1, tw(t, r.resIn, pace.enter));
    });
    ring(ctx, R1.tx, R1.y, R1.w, R1.h, Math.max(read2Lit, twoLit), C.accent, 10);
    ring(ctx, R2.tx, R2.y, R2.w, R2.h, twoLit, C.accent, 10);
    if (t >= r3.mark + FLY) roleMark(ctx, A.x, A.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    const ca = landedAns(t);
    if (ca > 0) docEntry(ctx, A, 1, { tagAlpha: 0, chars: ca });
    if (t >= r3.fin + EOT) roleMark(ctx, aEnd.x, aEnd.y, ROLE.end, { edge: WRITER.end });
    // l: what the LLM wrote — the ends of its calls, the end of its answer
    [call1, call2].forEach((c) => ring(ctx, c.band.x, c.band.y, c.band.w, c.band.h, wroteLit, C.accent, 10));
    ring(ctx, aEnd.x - 3, aEnd.y - 3, aEnd.w + 6, MARK_H + 6, fin2Lit, C.accent, 10);

    // the read of each round
    [[r1, call1.band.y], [r2, call2.band.y], [r3, A.y]].forEach(([r, y]) => {
      sweep(ctx, L, seg(t, r.read + 0.05, r.read + READ), y + MARK_H);
      send(ctx, L.read, seg(t, r.read + 0.4, r.read + READ + 0.05), '', 'doc');
    });

    // ——— the app's box, its loop mark, and the line to its code
    actor(ctx, ACT, 1, actGlow);
    ring(ctx, ACT.x, ACT.y, ACT.w, ACT.h, appLit, C.accent, 18);
    const lp = tw(t, at('loop') - lead, 0.7, inOutCubic);
    loopIcon(ctx, LOOP.x, LOOP.y, LOOP.r, tw(t, at('loop') - lead, 0.3), { p: lp });
    leader(ctx, tw(t, at('g') + MOVE * 0.7, 0.6, inOutCubic));
    // l: the app looks at what the LLM wrote, and moves on
    const look = span(t, at('app') - lead, at('l.end') - 0.2);
    if (look > 0) lookLines(ctx, [call1.end, call2.end, aEnd], tw(t, at('app') - lead, 0.5, inOutCubic), look);

    // ——— the pseudo-code
    const runs = lineRuns({ r1, r2, r3 });
    const big = 1 - park;
    ctx.save();
    ctx.translate(lerp(CODE.x, BIG.x, big), lerp(CODE.y, BIG.y, big) - Math.sin(Math.PI * park) * 30);
    ctx.scale(lerp(1, BIG.s, big), lerp(1, BIG.s, big));
    ctx.translate(-CODE.x, -CODE.y);
    drawCode(ctx, t, { at, pace, pop, lit, runs, r1, r2, r3 });
    ctx.restore();

    // ——— under the LLM: the rounds, counted
    drawRounds(ctx, t, { at, pop, lit, pace, chips, r1, r2, r3 });
    // the years (n, n2)
    YEARS.forEach((yr, k) => yearRow(ctx, yr, YR.y + k * YR.h, pop(k ? 'y24' : 'y23')));
    source(ctx, 'OpenAI（2023-06-13）、Anthropic（2024-05-30）の発表', pop('y23'), SOURCE_RIGHT);

    // ——— 5-4's notes on the stops, clearing away
    if (gone > 0.001) {
      text(ctx, 'Anthropic の API が返す値', L.llm.x + L.llm.w / 2, L.llm.y - 68, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: gone });
      stopBadge(ctx, L, gone, 'end_turn', false);
      stopPanel(ctx, gone);
    }
    // the app stops the writing: 5-4's, then at each end of the LLM's writing; the answer's stays
    halt(ctx, Math.max(gone, ...[r1, r2].map((r) => span(t, r.fin + EOT - 0.05, r.go + 0.5)), tw(t, r3.fin + EOT - 0.05, pace.enter)));

    // ——— the tool's place
    toolBox(ctx, L, 1, { solid: 0, glow: 0, draw: (c) => toolRows(c) });
    const [wLit, sLit] = lit(['w', 's'], at('b.end'));
    [[0, r1, wLit], [1, r2, sLit]].forEach(([i, r, l]) => {
      const rb = rowBox(i);
      ring(ctx, rb.x, rb.y, rb.w, rb.h, Math.max(l, span(t, r.go + GO * 0.8, r.back + 0.3)), C.accent, 12);
      spin(ctx, glyphBox(rb).x - 24, rb.y + rb.h / 2, seg(t, r.work, r.back));
    });
    ring(ctx, TOOL.x, TOOL.y, TOOL.w, TOOL.h, placeLit, C.accent, 20);
    const w0 = text(ctx, 'ツール', TOOL.x, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    const w1 = text(ctx, 'の場所', TOOL.x + w0, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    // o: the next chapter connects things here
    tag(ctx, TOOL.x + w0 + w1 + 14, TOOL.y - 39, '6 章　つなぐ先', { font: F.jp(700, 15), h: 30, padX: 11, fill: C.ink, color: C.paper, alpha: pop('many') });

    // ——— in flight, over everything
    // a: the question's mark
    flyMark(ctx, T, Qe, seg(t, userAt, userAt + FLY), ROLE.user, { edge: WRITER.user });
    // each round: the assistant's mark out of the app's box
    [[r1, { x: DOC.x + 18, y: call1.band.y }], [r2, { x: DOC.x + 18, y: call2.band.y }], [r3, A]].forEach(([r, E]) => {
      flyMark(ctx, T, E, seg(t, r.mark, r.mark + FLY), ROLE.assistant, { edge: WRITER.assistant });
    });
    // the calls: the LLM's call mark, tokens and end mark, along the write channel and in under the band
    calls.forEach(([c, r, , R], k) => {
      const lane = { y: c.band.y, h: c.band.h };
      const po = seg(t, r.open, r.open + EOT);
      if (po > 0 && po < 1) {
        const pt = onPath(writePath(T, lane, c.open.x + c.open.w / 2, c.open.y + MARK_H / 2), inOutCubic(po));
        roleMark(ctx, pt.x - c.open.w / 2, pt.y - MARK_H / 2, ROLE.call, { edge: WRITER.call, alpha: clamp(po * 8) });
      }
      c.toks.forEach((tk, j) => {
        const p = seg(t, r.tok[j], r.tok[j] + TOK);
        if (p <= 0 || p >= 1) return;
        const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
        const pt = onPath(writePath(T, lane, tk.x + tk.w / 2, tk.y), inOutCubic(p));
        token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
      });
      const pe = seg(t, r.fin, r.fin + EOT);
      if (pe > 0 && pe < 1) {
        const pt = onPath(writePath(T, lane, c.end.x + c.end.w / 2, c.end.y + MARK_H / 2), inOutCubic(pe));
        roleMark(ctx, pt.x - c.end.w / 2, pt.y - MARK_H / 2, ROLE.callEnd, { edge: WRITER.callEnd, alpha: clamp(pe * 8) });
      }
      // the input to the tool, the result back into its place, and the result's mark out of the app's box
      const band = { tx: c.band.x, w: c.band.w, y: c.band.y, h: c.band.h };
      chipFlight(ctx, seg(t, r.go, r.go + GO), toTool(T, band), k ? '検索の言葉' : '京都、あした', C.accent);
      chipFlight(ctx, seg(t, r.back, r.back + BACK), fromTool(T, R, 0, R.tx + 120), k ? '見どころ 3 件' : '雨　最高 19℃', C.green);
      flyMark(ctx, T, R, seg(t, r.resMark, r.resMark + FLY), ROLE.result, { edge: WRITER.result });
    });
    // round 3: the answer's tokens and its end mark
    ansToks.forEach((tk, k) => {
      const p = seg(t, r3.tok[k], r3.tok[k] + TOK);
      if (p <= 0 || p >= 1) return;
      const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
      const pt = onPath(answerPath(tk.x + w / 2, tk.y), inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
    });
    const pe3 = seg(t, r3.fin, r3.fin + EOT);
    if (pe3 > 0 && pe3 < 1) {
      const pt = onPath(answerPath(aEnd.x + aEnd.w / 2, aEnd.y + MARK_H / 2), inOutCubic(pe3));
      roleMark(ctx, pt.x - aEnd.w / 2, pt.y - MARK_H / 2, ROLE.end, { edge: WRITER.end, alpha: clamp(pe3 * 8) });
    }

    // ——— 5-4's key to the edges clears away; the example's note stays
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      edgeKey(ctx, T.KEY, [[BY.app, 'アプリが付ける', 1], [BY.llm, 'LLM が書く', 1]]);
      ctx.restore();
    }
    const ex = { x: L.app.x, y: L.app.y + L.app.h + 22 };
    const exW = measure(ctx, F.jp(700, 17), '例') + 20;
    example(ctx, ex.x, ex.y, 1, '');
    text(ctx, NOTE54, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted });
  },
});

// ——— this clip's pieces ————————————————————————————————————————————————

// The way the answer's tokens take: writePath's, with the lane under the answer kept inside the app's frame
// (the answer is the last entry, near the paper's bottom).
function answerPath(x, y) {
  const w = L.write;
  const laneY = DOC.y + DOC.h + 8;
  return [[w.x1, w.y], [T.margin, w.y], [T.margin, laneY], [x, laneY], [x, y]];
}

// A call band: the LLM's call mark, the JSON in rows (token by token), its end mark after the last row.
function callLayout(ctx, band, rows) {
  const tx0 = band.x + 12;
  const openW = markWidth(ctx, ROLE.call.name);
  const endW = markWidth(ctx, ROLE.callEnd.name);
  const jx = tx0 + openW + 10;
  const top = (r) => band.y + 8 + r * MLH;
  const toks = [];
  const rowEnd = [];
  rows.forEach((row, r) => {
    let x = jx;
    row.forEach((s) => {
      const w = measure(ctx, MFONT, s);
      toks.push({ s, x, w, y: top(r) + 14, base: top(r) + 19 });
      x += w;
    });
    rowEnd.push(x);
  });
  const last = rows.length - 1;
  return { band, toks, open: { x: tx0, y: top(0), w: openW }, end: { x: rowEnd[last] + 8, y: top(last), w: endW } };
}

// The call as far as the LLM has written it: the band (once its mark has landed), the marks, n tokens.
function drawCall(ctx, c, { bandA, open, n, end }) {
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
  c.toks.slice(0, n).forEach((tk) => text(ctx, tk.s, tk.x, tk.base, { font: MFONT, color: C.ink }));
  if (end) roleMark(ctx, c.end.x, c.end.y, ROLE.callEnd, { edge: WRITER.callEnd });
}

// The number that ties a call to its result (as 5-4 has it), at the band's right.
function idTag(ctx, band, y, k, a) {
  tag(ctx, band.x + band.w - 10, y, `#${k}`, { font: F.mono(600, 15), h: 28, padX: 9, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'right', r: 8, alpha: a });
}

// A small chip on its way along a polyline (eased overall), fading in and out at its ends.
function chipFlight(ctx, p, pts, s, fill) {
  if (p <= 0 || p >= 1) return;
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.globalAlpha = clamp(p * 8) * clamp((1 - p) * 8);
  tag(ctx, pt.x, pt.y - 15, s, { font: F.jp(700, 16), h: 30, padX: 10, fill, color: '#fff', align: 'center', r: 8 });
  ctx.restore();
}

// From the code card to the app's loop mark: a dashed line in the app's colour, drawn up to p.
function leader(ctx, p) {
  if (p <= 0) return;
  const y = CODE.y + 26;
  ctx.save();
  ctx.globalAlpha = clamp(p * 3);
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  path(ctx, [[CODE.x + CODE.w, y], [LOOP.x, y], [LOOP.x, LOOP.y - LOOP.r - 10]], p);
  ctx.setLineDash([]);
  ctx.restore();
}

// l: the app looks at the ends the LLM wrote — purple dashes down the document's right margin.
function lookLines(ctx, marks, p, a) {
  const x = DOC.x + DOC.w - 8;
  const yMax = Math.max(...marks.map((m) => m.y + MARK_H / 2));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 6]);
  const y0 = ACT.y + ACT.h + 4;
  path(ctx, [[x, y0], [x, yMax]], p);
  marks.forEach((m) => {
    const y = m.y + MARK_H / 2;
    const q = clamp((p * (yMax - y0) - (y - y0)) / 30);
    if (q > 0) path(ctx, [[x, y], [m.x + m.w + 9, y]], q);
  });
  ctx.setLineDash([]);
  ctx.restore();
}

// When each line of the code runs: [line, from, to] for the three rounds.
function lineRuns({ r1, r2, r3 }) {
  const out = [];
  [r1, r2].forEach((r) => {
    out.push([1, r.mark, r.stop], [2, r.stop, r.go], [3, r.go, r.done], [0, r.done, r.done + 0.45]);
  });
  out.push([1, r3.mark, r3.stop], [2, r3.stop, r3.check], [4, r3.check, r3.exit], [5, r3.exit, r3.done]);
  return out;
}

function drawCode(ctx, t, { at, pace, pop, lit, runs, r1, r2, r3 }) {
  const card = pop('code');
  if (card <= 0.001) return;
  const cue = pace.cue;
  ctx.save();
  ctx.globalAlpha = card;
  rr(ctx, CODE.x, CODE.y, CODE.w, CODE.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'アプリの動き', CODE.x + 16, CODE.y + 28, { font: F.jp(700, 17), color: C.purple, alpha: card });
  tag(ctx, CODE.x + CODE.w - 14, CODE.y + 11, '擬似コード', { font: F.jp(700, 13), h: 24, padX: 9, fill: '#fff', stroke: C.muted, color: C.muted, align: 'right', alpha: card });

  // each line comes in as the voice reaches it; the cap (m) is added later
  const shown = [
    pop('loop'), pop('read'), pop('call'), pop('run'), pop('fin'), pop('exit'),
    tw(t, at('f.end') + 0.05, pace.enter), tw(t, at('f.end') + 0.2, pace.enter),
    pop('limit'), tw(t, at('limit') - leadOf(pace) + 0.25, pace.enter),
  ];
  // which line is lit: explained (e, f, l, m), or running (g, h, i)
  const told = focus(t, ['read', 'call', 'run', 'again'].map(at), at('e.end') - cue.fall, cue).level;
  const toldF = focus(t, ['fin', 'exit'].map(at), at('f.end') - cue.fall, cue).level;
  const [appLit] = lit(['app'], at('l.end'));
  const [limitLit] = lit(['limit'], at('m.end'));
  const level = LINES.map((_, i) => {
    let v = 0;
    runs.forEach(([k, a, b]) => {
      if (k === i) v = Math.max(v, span(t, a, b, 0.12, 0.15));
    });
    if (i === 1) v = Math.max(v, told[0], told[3]);
    if (i === 2) v = Math.max(v, told[1], appLit);
    if (i === 3) v = Math.max(v, told[2]);
    if (i === 4) v = Math.max(v, toldF[0], appLit);
    if (i === 5) v = Math.max(v, toldF[1]);
    if (i >= 8) v = Math.max(v, limitLit);
    return v;
  });
  LINES.forEach((ln, i) => {
    const a = shown[i] * card;
    if (a <= 0.001) return;
    const y = lineY(i);
    if (level[i] > 0.001) {
      ctx.save();
      ctx.globalAlpha = a * level[i];
      rr(ctx, CODE.x + 8, y - 17, CODE.w - 16, CODE_LH, 5);
      ctx.fillStyle = C.accentSoft;
      ctx.fill();
      ctx.fillStyle = C.accent;
      ctx.fillRect(CODE.x + 8, y - 17, 4, CODE_LH);
      ctx.restore();
    }
    const x = lineX(i) + (1 - shown[i]) * 10;
    const w = text(ctx, ln.s, x, y, { font: ln.head ? F.jp(700, 16) : CF, color: ln.head ? C.purple : C.ink, alpha: a });
    if (ln.value) {
      tag(ctx, x + w + 8, y - 16, ln.value, { font: F.mono(600, 13), h: 22, padX: 8, fill: ln.hot ? C.accent : C.ink2, color: '#fff', alpha: a });
    }
    if (ln.note) text(ctx, ln.note, x + w + 2, y, { font: F.jp(500, 12), color: C.muted, alpha: a });
  });
  // the loop: a bracket from the body's last line back up to its first, in the app's colour
  const bp = tw(t, at('again') - leadOf(pace), 0.6, inOutCubic);
  let yb = lineY(1);
  for (let i = 2; i < LINES.length; i++) if (shown[i] > 0) yb = Math.max(yb, lerp(lineY(i - 1), lineY(i), shown[i]));
  const yTop = lineY(1) - 6;
  const yBot = yb + 4;
  if (bp > 0) {
    ctx.save();
    ctx.globalAlpha = card * clamp(bp * 3);
    ctx.strokeStyle = ctx.fillStyle = C.purple;
    ctx.lineWidth = 2.5;
    const pts = [[lineX(1) - 10, yBot], [BRACKET_X, yBot], [BRACKET_X, yTop], [lineX(1) - 8, yTop]];
    const end = path(ctx, pts, bp);
    if (end && bp > 0.9) arrowHead(ctx, end.x, end.y, 0, 9);
    ctx.restore();
  }
  // a dot runs up the bracket each time the loop goes round (e's「また読ませる」, and after rounds 1, 2)
  const dots = [at('again') - leadOf(pace) + 0.6, r1.done, r2.done];
  dots.forEach((d0) => {
    const p = seg(t, d0, d0 + 0.45);
    if (p <= 0 || p >= 1) return;
    const pts = [[BRACKET_X, yBot], [BRACKET_X, yTop]];
    const pt = onPath(pts, inOutCubic(p));
    ctx.save();
    ctx.globalAlpha = card * clamp(p * 6) * clamp((1 - p) * 6);
    ctx.fillStyle = C.accent;
    circle(ctx, pt.x, pt.y, 5);
    ctx.fill();
    ctx.restore();
  });
  // the values the code reads are the API's
  text(ctx, 'tool_use、end_turn は Anthropic の API の値', CODE.x + CODE.w - 14, CODE.y + CODE.h - 10, { font: F.jp(500, 12), color: C.muted, align: 'right', alpha: card * pop('call') });
}

const leadOf = (pace) => pace.cue.lead;

// Under the LLM: the rounds of the rainy example as they run (b, c plan them; g–i run them), then the
// sunny one (j); each row counts its rounds and its tool runs apart.
function drawRounds(ctx, t, { at, pop, lit, pace, chips, r1, r2, r3 }) {
  const cue = pace.cue;
  const [resLit] = lit(['res'], at('c.end'));
  const [nextLit] = lit(['next'], at('res'));
  const [whoLit] = lit(['who'], at('k.end'));
  // the rainy row
  const rowA = ROWS[0];
  const la = pop('rain');
  text(ctx, rowA.label, TRK.x, rowA.y + 14, { font: F.jp(700, 14), color: C.ink2, alpha: la });
  ring(ctx, TRK.x - 2, rowA.y - 2, measure(ctx, F.jp(700, 14), rowA.label) + 4, 22, resLit, C.accent, 8);
  const rounds = [r1, r2, r3].reduce((n, r, k) => (t >= at(`r${k + 1}`) - cue.lead ? k + 1 : n), 0);
  const runsN = [r1, r2].reduce((n, r) => (t >= r.work ? n + 1 : n), 0);
  const bump = Math.max(...[1, 2, 3].map((k) => span(t, at(`r${k}`) - cue.lead, at(`r${k}`) + 0.4)), ...[r1, r2].map((r) => span(t, r.work, r.work + 0.5)));
  if (rounds > 0) {
    const s = runsN > 0 ? `${rounds} 周、ツールは ${runsN} 回` : `${rounds} 周`;
    text(ctx, s, TRK.x + TRK.w, rowA.y + 15, { font: F.jp(700, 16), color: bump > 0.5 ? C.accent : C.ink, align: 'right' });
  }
  const plan = [pop('w'), pop('s'), 0];
  const done = [r1.stop, r2.stop, r3.stop];
  const active = [r1, r2, r3].map((r, k) => span(t, at(`r${k + 1}`) - cue.lead, (k < 2 ? r.done : r3.done) - 0.1));
  const solids = done.map((d) => tw(t, d - 0.1, 0.3));
  const shownA = solids.map((solid, k) => (k < 2 ? Math.max(plan[k], solid) : Math.max(solid, tw(t, at('r3') - cue.lead, pace.enter))));
  if (shownA[0] > 0.001) arrowBetween(ctx, chips[0][0], chips[0][1], Math.max(pop('rain'), solids[1]));
  arrowBetween(ctx, chips[0][1], chips[0][2], shownA[2]);
  chips[0].forEach((c, k) => {
    const solid = solids[k];
    const a = shownA[k];
    if (a <= 0.001) return;
    drawChip(ctx, c, a, solid);
    ring(ctx, c.x, c.y, c.w, CHIP.h, Math.max(active[k], k === 1 ? nextLit : 0), C.accent, 10);
  });
  // c: what comes second waits on the result
  qBadge(ctx, chips[0][1].x + chips[0][1].w + 16, chips[0][1].y + CHIP.h / 2, pop('next') * (1 - tw(t, r2.stop - 0.1, 0.3)));

  // the sunny row (j)
  const rowB = ROWS[1];
  const lb = pop('sun');
  text(ctx, rowB.label, TRK.x, rowB.y + 14, { font: F.jp(700, 14), color: C.ink2, alpha: lb });
  const cb = [lb, pop('two2')];
  chips[1].forEach((c, k) => {
    if (cb[k] <= 0.001) return;
    if (k > 0) arrowBetween(ctx, chips[1][k - 1], c, cb[k]);
    drawChip(ctx, c, cb[k], 1);
  });
  text(ctx, '2 周、ツールは 1 回', TRK.x + TRK.w, rowB.y + 15, { font: F.jp(700, 16), color: C.ink, align: 'right', alpha: tw(t, at('two2') - cue.lead + 0.3, pace.enter) });
  // k: how many rounds — the two counts
  const cw = measure(ctx, F.jp(700, 16), '3 周、ツールは 2 回');
  [rowA.y, rowB.y].forEach((y) => ring(ctx, TRK.x + TRK.w - cw, y - 1, cw, 22, whoLit, C.accent, 8));
  // one call to a round in this example; some models write several at once
  const ma = tw(t, r3.exit, pace.enter);
  MULTI.forEach((s, i) => text(ctx, s, TRK.x, TRK.y + 136 + i * 17, { font: F.jp(500, 13), color: C.muted, alpha: ma }));
}

// A round as a chip: dashed and grey while it is only planned, solid once the LLM has written it.
function drawChip(ctx, c, a, solid) {
  const call = c.kind === 'call';
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, c.x, c.y, c.w, CHIP.h, 8);
  ctx.fillStyle = '#fff';
  ctx.fill();
  if (solid > 0.001) {
    ctx.save();
    ctx.globalAlpha *= solid;
    ctx.fillStyle = call ? C.accentSoft : C.panel;
    ctx.fill();
    ctx.restore();
  }
  ctx.setLineDash(solid >= 0.999 ? [] : [5, 4]);
  ctx.strokeStyle = solid > 0.5 ? (call ? C.accent : C.ink2) : C.muted;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  text(ctx, c.s, c.x + c.w / 2, c.y + CHIP.h / 2 + 1, { font: CHIP.font, color: solid > 0.5 ? C.ink : C.muted, align: 'center', base: 'middle', alpha: a });
}

function arrowBetween(ctx, a, b, p) {
  if (p <= 0.001) return;
  const y = b.y + CHIP.h / 2;
  const x1 = a.x + a.w + 5;
  const x2 = b.x - 5;
  ctx.save();
  ctx.globalAlpha *= clamp(p);
  ctx.strokeStyle = ctx.fillStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 6, y);
  ctx.stroke();
  arrowHead(ctx, x2, y, 0, 8);
  ctx.restore();
}

// A small round "?" badge.
function qBadge(ctx, x, y, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = C.accent;
  circle(ctx, x, y, 11);
  ctx.fill();
  ctx.restore();
  text(ctx, '？', x, y + 1, { font: F.jp(700, 14), color: '#fff', align: 'center', base: 'middle', alpha: a });
}

// One year: the year, who, and what they did.
function yearRow(ctx, yr, y, a) {
  if (a <= 0.001) return;
  const dy = (1 - a) * 8;
  text(ctx, yr.year, YR.x, y + 30 + dy, { font: F.cond(700, 30), color: C.ink, alpha: a });
  text(ctx, yr.who, YR.x + 76, y + 14 + dy, { font: F.jp(700, 15), color: C.ink, alpha: a });
  text(ctx, yr.what, YR.x + 76, y + 34 + dy, { font: F.jp(500, 14), color: C.ink2, alpha: a });
}

// ——— 5-4's last picture (as toolresult.js draws it) ——————————————————————————

// The conversation in the document, the numbers, and the note on them.
function drawOld(ctx, o) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(DOC.x, DOC.y, DOC.w, DOC.h);
  ctx.clip();
  ctx.save();
  ctx.translate(0, SHIFT_Q);
  docEntry(ctx, o.E[0], 1, { tagAlpha: 0 });
  ctx.restore();
  ctx.restore();
  roleMark(ctx, o.E[0].x, o.E[0].y + 1 + SHIFT_Q, ROLE.user, { edge: BY.app });
  roleMark(ctx, o.E[1].x, o.E[1].y + 1 + SHIFT_A53 + DY_A, ROLE.assistant, { edge: BY.app });
  ctx.save();
  ctx.translate(0, DY_A);
  const { band, open, end, toks } = o;
  rr(ctx, band.x, band.y, band.w, band.h, 8);
  ctx.fillStyle = C.accentSoft;
  ctx.fill();
  ctx.fillStyle = C.accent;
  ctx.fillRect(band.x, band.y + 6, 4, band.h - 12);
  roleMark(ctx, open.x, open.y, ROLE.call, { edge: WRITER.call });
  toks.forEach((tk) => text(ctx, tk.s, tk.x, tk.base, { font: CFONT, color: C.ink }));
  roleMark(ctx, end.x, end.y, ROLE.callEnd, { edge: WRITER.callEnd });
  ctx.restore();
  const R = o.R;
  docEntry(ctx, R, 1, { tagAlpha: 0 });
  roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
  const idTag54 = (y) => tag(ctx, band.x + band.w - 10, y, '#1', { font: F.mono(600, 15), h: 28, padX: 9, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'right', r: 8, alpha: 1 });
  idTag54(open.y + DY_A);
  idTag54(R.y + R.h / 2 - 14);
  text(ctx, ID_NOTE, R.tx + 2, R.y + R.h + 28, { font: F.jp(500, 14), color: C.muted, alpha: 1 });
  docEntry(ctx, o.A, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.A.x, o.A.y + 1, ROLE.assistant, { edge: WRITER.assistant });
  roleMark(ctx, o.aEnd.x, o.aEnd.y, ROLE.end, { edge: WRITER.end });
}

// The app stops the writing — the purple tag on the write channel, as in 4-2, 5-3 and 5-4.
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

// 5-4's card on the two ways its example stops.
function stopPanel(ctx, a) {
  if (a <= 0.001) return;
  const P = PANEL;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, P.x, P.y, P.w, P.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  const x = P.x + 18;
  text(ctx, '止まった理由 → アプリが次にすること', x, P.y + 27, { font: F.jp(700, 14), color: C.muted, alpha: a });
  STOPS.forEach((st, i) => {
    const y = P.y + 58 + i * 58;
    const w = text(ctx, st.case, x, y, { font: F.jp(700, 16), color: C.ink, alpha: a });
    tag(ctx, x + w + 10, y - 18, st.value, { font: F.mono(600, 13), h: 24, padX: 9, fill: st.hot ? C.accent : C.ink2, color: '#fff', alpha: a });
    text(ctx, `→ ${st.act}`, x + 14, y + 26, { font: F.jp(700, 16), color: C.purple, alpha: a });
  });
  text(ctx, 'ほかに、長さの上限などで止まることもある', x, P.y + P.h - 13, { font: F.jp(500, 13), color: C.muted, alpha: a });
}

// The tool's place as 5-3 and 5-4 leave it: the chapter's three tools in rows, each with its program.
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
const GLYPH = [
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
  GLYPH[i].forEach(([indent, w], k) => {
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

// 5-4's row on the screen saying what the app did, and the note under the screen.
function progressRow(ctx, b, a) {
  if (a <= 0.001) return;
  const y = b.y + 16;
  const x = SCREEN.x + 24;
  ctx.save();
  ctx.globalAlpha = a;
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
