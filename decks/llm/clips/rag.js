// 6-1: search first, then answer (RAG). Told from the designer's side (Boss, 2026-10-15), like chapter 5. We
// build a chatbot that answers questions on a company's rules. Asked "how much is the daily allowance on a
// business trip?", the LLM cannot know — that company's rules may never have been in its training — and left
// as it is, it writes a plausible guess (shown on the screen, then taken back). So before the LLM is asked
// to answer, we have the app search the company's documents: the app's box sends the question's words, as
// they are, to the search (not the LLM: in this design the LLM writes no call for it); the search finds a
// few passages that may bear on the answer — one way being a search model that turns the question and the
// passages into vectors and compares how near they are (a picture of the idea, not chapter 3's token
// table; word matching, or both, also work). The app writes what was found into the document under its
// own mark, has the LLM read, and the LLM answers from it, citing the passage. That is retrieval-augmented
// generation, RAG — a name from a 2020 paper. ずんだもん asks whether that makes it right; not always: the
// passage found may be out of date (a newer notice the search missed sits in the pile), and the LLM may
// misread. And in the form built here the app searches once, with the question's words — 6-2 picks this up.
//
// The layout is the chapter's (lib/rig.js toolUseLayout), with the tool's place taller and the chat screen
// shorter (G6 below) to hold the search. The clip joins 5-5 (spec §6.10): its first frame is 5-5's last
// picture, drawn here as toolloop.js draws it, and the bridge clears 5-5's code card, rounds, years, the
// conversation in the document, the loop mark and the channels to the tool, and grows the tool's place.
// Everything in the conversation is an example: the question, the documents, the guess and the answer
// (cut into tokens as o200k_base cuts them), and the map of the search (research/connect-facts 6-1).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import {
  toolUseLayout, G5, chatScreen, screenBubbles, chatBubble, screenLinks, fromTool, writePath, flyMark, loopIcon,
  llmBlock, appFrame, toolBox, channel, actor, token, TOKEN, tokenPlaces, onPath, docLayout, docEntry, rowAt, sweep, send, working,
  roleMark, markWidth, MARK_H, ROLE, BY, WRITER,
} from '../lib/rig.js';
import { searchLayout, searchLabels, searchPanel, PASSAGES } from '../lib/docsearch.js';
import { text, measure, rr, path, circle, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring, ringBox } from '../../../src/kit/cue.js';

// ——— this clip's layout: 5-5's, with the tool's place taller (the search) and the screen shorter
const G6 = { ...G5, tool: { x: G5.tool.x, y: 400, w: G5.tool.w, h: 370 } };
const T = toolUseLayout(G6);
const { L, ACT } = T;
const SCREEN = { ...T.SCREEN, h: 250 };
const TOOL = L.tool;
const S = searchLayout(TOOL);

// ——— 5-5's picture, as toolloop.js has it (its last frame is this clip's first)
const T5 = toolUseLayout();
const L5 = T5.L;
const SCREEN5 = T5.SCREEN;
const LOOP = T5.LOOP;
const TOOL5 = L5.tool;
const DOC = L5.doc;
const KINDS = [['天気予報', '都市と日 → 予報'], ['検索', '言葉 → 文章'], ['計算機', '式 → 答え']];
const ROW = { x: TOOL5.x + 20, y: TOOL5.y + 20, w: TOOL5.w - 40, h: (TOOL5.h - 40 - 22) / 3, gap: 11 };
const rowBox = (i) => ({ x: ROW.x, y: ROW.y + i * (ROW.h + ROW.gap), w: ROW.w, h: ROW.h });
const glyphBox = (r) => ({ x: r.x + r.w - 124, y: r.y + 12, w: 110, h: r.h - 24 });
const DLH = 29;
const DTOP = DOC.y + 26;
const DX = DOC.x + 18 + 122 + 12;
const SYS = { x: DOC.x + 18, y: DTOP };
const defY = (k) => DTOP + 21 + DLH * k;
const DTOP5 = DOC.y + 12;
const FOLDED5 = 'get_weather、search_web などのツールの定義（省略）';
const Q55 = 'あしたの京都が雨なら、屋内で楽しめる所を教えて';
const Q55_SCREEN = 'あしたの京都が雨なら、\n屋内で楽しめる所を教えて';
const CALL1 = [
  ['{"', 'name', '":', ' "', 'get', '_weather', '",'],
  [' "', 'input', '":', ' {"', 'city', '":', ' "', '京都', '",'],
  [' "', 'day', '":', ' "', 'あ', 'した', '"}}'],
];
const CALL2 = [
  ['{"', 'name', '":', ' "', 'search', '_web', '",'],
  [' "', 'input', '":', ' {"', 'query', '":'],
  [' "', '京都', 'の', '雨', 'の日', 'の', '屋', '内', '観', '光', '"}}'],
];
const RES1 = '{"天気": "雨", "最高気温": 19}';
const RES2 = '{"結果": ["京都国立博物館",\n "京都水族館", "錦市場"]}';
const ANS55_DOC = 'あしたの京都は雨の予報です。\n屋内なら、京都国立博物館や\n京都水族館がおすすめです。';
const MFONT = F.mono(500, 15);
const MLH = 28;
const TFONT = F.jp(500, 20);
const CODE = { x: 30, y: 46, w: 340, h: 308 };
const CODE_LH = 23;
const CODE_Y0 = CODE.y + 62;
const CODE_X0 = CODE.x + 30;
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
const NOTE55 = '会話、呼び出し、結果は説明のための例';
const SOURCE55 = 'OpenAI（2023-06-13）、Anthropic（2024-05-30）の発表';

// ——— this clip's conversation (an example)
const Q = '出張の日当はいくら？';
// the guess, one token at a time (o200k_base: 18 tokens); on the screen and in the document it breaks after the comma
const GUESS = ['多', 'く', 'の', '会社', 'では', '、', '1', '日', '2', ',', '000', '〜', '3', ',', '000', '円', 'です', '。'];
const GUESS_DOC = '多くの会社では、\n1日2,000〜3,000円です。';
// what the search finds, as the app writes it in: three passages, each its source and its sentence
const FOUND_DOC = '［1］旅費規程 第5条\n　　出張の日当は、1日2,000円とする。\n［2］出張の手引き\n　　日当は、精算のときに支払う。\n［3］2026年4月の改定\n　　宿泊費の上限を変える。';
const MISSED = ['［4］2026年4月の改定', '出張の日当を、1日2,500円にする。'];
// the answer (o200k_base: 11 tokens)
const ANS = ['1', '日', '2', ',', '000', '円', 'です', '［', '1', '］', '。'];
const ANS_PRE = '1日2,000円です';
const CITE = '［1］';
// the app's work, summed up (sentence i) above the LLM
const STEPS = ['質問の言葉で、資料を検索する', '見つけた文章を、文書に書き足す', 'LLM に読ませて、答えを書かせる'];
const CARD = { x: 30, y: 58, w: 346, h: 160 };
const STEP_Y = (k) => CARD.y + 66 + k * 32;
// what the LLM knew (sentence b2), above it, as 5-1 has it
const KNEW = { x: L.llm.x, y: 176, w: L.llm.w + 100, h: 152 };
// the name, under the LLM (sentences i, j)
const NAME = { x: 36, y: 604 };
const NOTE = '質問、資料、答えは説明のための例';

const FLY = 0.55; // a mark flying out of the app's box
const TOK = 0.42; // a token along the write channel and into its place
const EOT = 0.5; // the end mark, the same way
const READ = 0.95; // the app has the LLM read the document
const GO = 1.0; // the question's words, from the app's box to the search
const BACK = 0.9; // what was found, from the search into the document

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n token times, evenly from a, the last one landing by b
const times = (n, a, b) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - TOK - a)) / Math.max(1, n - 1));
const upto = (list, ts) => (s) => list.reduce((u, tk, k) => (s >= ts[k] + TOK ? tk.upto : u), 0);
const lerpBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

export default clip({
  id: 'rag',
  title: '調べてから答える',
  kicker: '検索拡張生成（RAG）',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 1.2, // 5-5's notes clear away and the tool's place grows; skipped unless the clip is joined from 5-5
  script: [
    { id: 'a', text: '会社の中で、{rules}社内の決まりに答える\n{bot}チャットボットを作るとしましょう。' },
    { id: 'b', text: '{ask}「出張の日当はいくら？」と聞かれたら、\nどうなるかしら。' },
    { id: 'b2', text: '{rule}その会社の規程が、学習に使われていなければ、\n{know}学習した知識だけでは答えられないわ。' },
    { id: 'c', lead: 1.1, text: 'このままだと、{guess}よくある金額を、\n{plaus}もっともらしく答えてしまうかもしれないの。' },
    { id: 'd', tail: 0.6, text: 'そこで、答えを書かせる前に、\n{app}アプリに、{search}社内の資料を検索させるの。' },
    { id: 'e', text: '{from}資料の中から、{rel}質問の答えに関係しそうな文章を、\n{few}いくつか探し出すわ。' },
    { id: 'f', still: true, tail: 0.6, text: 'その方法の一つが、{model}検索用のモデルで、質問と資料の文章を\n{vec}ベクトルに変えて、{near}近さを比べるやり方よ。' },
    { id: 'g', text: '{found}見つかった文章を、{add}質問と一緒に文書に書き足してから、\n{write}LLM に答えを書かせるのよ。' },
    { id: 'h', tail: 0.6, text: 'すると LLM は、{amount}資料に書かれた金額をもとに\n{ans}答えられるわね。' },
    { id: 'h2', still: true, text: '{cite}どの資料に書いてあったかも、添えられるわ。' },
    { id: 'i', text: 'このように、{s1}検索で見つけた資料を{s2}加えてから\n{s3}答えを書かせるやり方を、{name}検索拡張生成、{rag}[RAG|ラグ] と呼ぶわ。' },
    { id: 'j', still: true, text: 'この名前は、{paper}2020 年の論文で付けられたものよ。' },
    { id: 'k', by: 'zunda', text: '{doubt}資料が見つかれば、もう間違えないのだ？' },
    { id: 'l', text: 'そうとは限らないわ。{old}見つけた資料が古かったり、\n{misread}LLM が読み違えたりすることもあるの。' },
    { id: 'm', tail: 0.8, text: 'それに、いま作った形では、{app2}アプリが、\n{words}最初の質問の言葉で、{once}一度だけ検索するようにしてあるの。' },
  ],

  prepare(ctx) {
    // ——— 5-5's last picture, laid out as toolloop.js lays it out
    const opts = { ...T5.DOC, font: TFONT, lh: 28, mono: MFONT, lhMono: 24 };
    const one = (e, y) => docLayout(ctx, L5, [e], { ...opts, top: y - DOC.y })[0];
    let y = DTOP5 + MARK_H + 18;
    const Qe = one({ role: 'user', text: Q55 }, y);
    y = Qe.y + Qe.h + 12;
    const call1 = callLayout(ctx, { x: DX, y, w: Qe.w, h: 3 * MLH + 16 }, CALL1);
    y = call1.band.y + call1.band.h + 10;
    const R1 = one({ role: 'result', kind: 'data', text: RES1 }, y);
    y = R1.y + R1.h + 12;
    const call2 = callLayout(ctx, { x: DX, y, w: Qe.w, h: 3 * MLH + 16 }, CALL2);
    y = call2.band.y + call2.band.h + 10;
    const R2 = one({ role: 'result', kind: 'data', text: RES2 }, y);
    y = R2.y + R2.h + 14;
    const A5 = one({ role: 'assistant', text: ANS55_DOC }, y);
    const aRow = rowAt(A5, A5.rows.length - 1);
    const aEnd5 = { x: aRow.x + measure(ctx, A5.font, A5.rows[A5.rows.length - 1]) + 14, y: aRow.y - 21, w: markWidth(ctx, ROLE.end.name) };
    const B5 = screenBubbles(ctx, SCREEN5, [['user', Q55_SCREEN], ['assistant', ANS55_DOC]]);
    const chips = ROWS.map((row) => {
      let x = TRK.x;
      return row.chips.map(([s, kind]) => {
        const w = measure(ctx, CHIP.font, s) + CHIP.padX * 2;
        const c = { s, kind, x, w, y: row.y + 24 };
        x += w + CHIP.gap;
        return c;
      });
    });
    const old = { Qe, call1, R1, call2, R2, A: A5, aEnd: aEnd5, B: B5, chips };

    // ——— this clip's document: the question, what the search found, the answer (or first, the guess)
    const ent = (role, s, kind = 'text') => ({ role, text: s, kind });
    const [Qd, Sd, Ad] = docLayout(ctx, L, [ent('user', Q), ent('search', FOUND_DOC, 'data'), ent('assistant', ANS.join(''))], T.DOC);
    const Gd = docLayout(ctx, L, [ent('user', Q), ent('assistant', GUESS_DOC)], T.DOC)[1];
    const toks = { guess: tokenPlaces(ctx, Gd, GUESS), ans: tokenPlaces(ctx, Ad, ANS) };
    const last = rowAt(Ad, 0);
    const end = { x: last.x + measure(ctx, Ad.font, Ad.rows[0]) + 16, y: last.y - 22, w: markWidth(ctx, ROLE.end.name) };
    const B = screenBubbles(ctx, SCREEN, [['user', Q], ['assistant', ANS.join('')]]);
    const guessB = screenBubbles(ctx, SCREEN, [['user', Q], ['assistant', GUESS_DOC]])[1];
    // the citation: [1] in the answer, in the screen's bubble, and the first passage it points to
    const cite = {
      doc: { x: last.x + measure(ctx, Ad.font, ANS_PRE), y: last.y, w: citeW(ctx, Ad.font), base: 'alphabetic' },
      screen: (() => {
        const b = B[1];
        const L0 = b.L;
        return { x: b.x + L0.pad + measure(ctx, L0.font, ANS_PRE), y: b.y + L0.pad + L0.size * 0.62, w: citeW(ctx, L0.font), base: 'middle' };
      })(),
      passage: (() => {
        const r0 = rowAt(Sd, 0);
        return { x: Sd.tx + 6, y: r0.y - 18, w: Sd.w - 12, h: 54 };
      })(),
    };
    const oldTag = { x: rowAt(Sd, 0).x + measure(ctx, Sd.font, Sd.rows[0]) + 14, y: rowAt(Sd, 0).y - 20 };
    const lab = searchLabels(ctx, S);
    return { old, Qd, Sd, Ad, Gd, toks, end, B, guessB, cite, oldTag, lab };
  },

  draw(ctx, t, s, { at, pace }) {
    const { old, Qd, Sd, Ad, Gd, toks, end, B, guessB, cite, oldTag, lab } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (names, until) => focus(t, names.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 5-5's picture clears away and the tool's place grows. The first frame is 5-5's untouched.
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.45));
    const grow = inOutCubic(seg(t, br * 0.45, br));
    const fresh = inOutCubic(seg(t, br * 0.45, br * 0.75));
    const box = lerpBox(G5.tool, G6.tool, grow);
    const Lt = { ...L, tool: box };

    // ——— when things happen
    // b: the question comes in; the app writes it under the user's mark
    const askAt = at('ask') - lead;
    const userAt = askAt + 0.45;
    // c: the app writes the assistant's mark and has the LLM read; the LLM guesses
    const markC = at('c') + 0.05;
    const read1 = markC + FLY - 0.1;
    const guessAt = times(GUESS.length, Math.max(at('guess') - 0.4, read1 + READ - 0.1), Math.max(at('plaus') + 1.0, read1 + READ + 1.6));
    const unguess = 1 - tw(t, at('d'), 0.45);
    // d: the app sends the question's words to the search; e: it finds three passages
    const goAt = at('search') - lead + 0.25;
    const queryIn = goAt + GO;
    const foundAt = Math.max(at('few') - lead, queryIn + 0.5);
    // f: the search model, the wave, the nearest
    const vecAt = at('vec') - lead;
    // g: what was found comes back and goes in; the app writes the assistant's mark and has the LLM read
    const backAt = at('found') - lead + 0.1;
    const resMark = Math.max(at('add') - lead, backAt + 0.3);
    const resIn = Math.max(backAt + BACK, resMark + FLY);
    const markA = Math.max(at('write') - lead, resIn + 0.35);
    const read2 = markA + FLY - 0.1;
    // h: the answer, and its end
    const ans0 = Math.max(at('amount') + 0.5, read2 + READ);
    const ansAt = times(ANS.length, ans0, Math.max(at('ans') + 0.9, ans0 + 1.6));
    const eotAt = ansAt[ansAt.length - 1] + TOK + 0.05;

    const landedGuess = upto(toks.guess, guessAt);
    const landedAns = upto(toks.ans, ansAt);

    // who is at work
    const [appLit] = lit(['app'], at('search'));
    const [app2Lit, wordsLit, onceLit] = lit(['app2', 'words', 'once'], at('m.end'));
    const actGlow = Math.max(
      span(t, userAt - 0.1, userAt + FLY),
      span(t, markC, read1 + READ),
      appLit,
      span(t, goAt - 0.2, queryIn),
      span(t, resMark, resIn + 0.2),
      span(t, markA, read2 + READ),
      span(t, ansAt[0] + TOK, eotAt + EOT),
      app2Lit,
    );
    const writing = [[read1 + READ - 0.1, guessAt[guessAt.length - 1] + TOK], [read2 + READ - 0.1, eotAt + EOT]];
    const llmGlow = Math.max(...writing.map(([a, b]) => span(t, a, b)));
    const talkHot = span(t, askAt + 0.05, askAt + 0.8) > 0.5;
    const backHot = Math.max(span(t, guessAt[0] + TOK, guessAt[guessAt.length - 1] + TOK + 0.2), span(t, ansAt[0] + TOK, ansAt[ansAt.length - 1] + TOK + 0.2)) > 0.5;

    // ——— the chat screen: 5-5's conversation leaves, the screen gets shorter, this one comes in
    const scr = { ...SCREEN, h: lerp(SCREEN5.h, SCREEN.h, grow) };
    chatScreen(ctx, scr, 1);
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      chatBubble(ctx, old.B[0], { alpha: 1 });
      chatBubble(ctx, old.B[1], { alpha: 1, chars: 1 });
      ctx.restore();
    }
    chatBubble(ctx, B[0], { alpha: tw(t, askAt, 0.35) });
    chatBubble(ctx, guessB, { alpha: tw(t, guessAt[0] + TOK, 0.2) * unguess, chars: landedGuess(t - 0.12) });
    chatBubble(ctx, B[1], { alpha: tw(t, ansAt[0] + TOK, 0.2), chars: landedAns(t - 0.12) });
    screenLinks(ctx, T, { talk: 1, back: 1, talkHot, backHot });
    const [botLit] = lit(['bot'], at('a.end'));
    ring(ctx, scr.x, scr.y, scr.w, scr.h, botLit, C.accent, 20);
    const [doubtLit] = lit(['doubt'], at('k.end'));
    ringBox(ctx, { x: B[1].x, y: B[1].y, w: B[1].L.w, h: B[1].L.h }, doubtLit, C.accent);

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, L, 1, { name: '' });
    llmBlock(ctx, L, 1, { glow: llmGlow });
    const [misLit] = lit(['misread'], at('l.end'));
    ring(ctx, L.llm.x, L.llm.y, L.llm.w, L.llm.h, misLit, C.red, 22);
    channel(ctx, L.read, 1);
    channel(ctx, L.write, 1, { hot: llmGlow > 0.5 });
    // the channels to the tool: 5-5's leave in the bridge; the app's to the search come in with sentence d
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      channel(ctx, L5.call, 1);
      channel(ctx, L5.back, 1);
      ctx.restore();
    }
    const tc = tw(t, at('search') - lead, 0.6, inOutCubic);
    channel(ctx, L.call, tc, { hot: span(t, goAt + 0.3, queryIn) > 0.5 });
    channel(ctx, L.back, tc, { hot: span(t, backAt, backAt + BACK * 0.6) > 0.5 });

    // ——— the document. 5-5's conversation and the head with its definitions leave; this one is written in.
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      drawOldDoc(ctx, old);
      ctx.restore();
    }
    // b: the question
    if (t >= userAt + FLY) {
      docEntry(ctx, Qd, 1, { tagAlpha: 0, chars: tw(t, userAt + FLY - 0.05, 0.3) });
      roleMark(ctx, Qd.x, Qd.y + 1, ROLE.user, { edge: WRITER.user });
    }
    // c: the assistant's mark and the guess; both leave with sentence d
    if (t >= markC + FLY && unguess > 0.001) roleMark(ctx, Gd.x, Gd.y + 1, ROLE.assistant, { edge: WRITER.assistant, alpha: unguess });
    const cg = landedGuess(t);
    if (cg > 0 && unguess > 0.001) docEntry(ctx, Gd, unguess, { tagAlpha: 0, chars: cg });
    const plaus = tw(t, Math.max(at('plaus') - lead, guessAt[guessAt.length - 1] + TOK), pace.enter) * unguess;
    tag(ctx, Gd.tx, Gd.y + Gd.h + 10, '根拠のない推測', { font: F.jp(700, 16), h: 30, padX: 10, fill: '#fff', stroke: C.red, color: C.red, alpha: plaus });
    // g: what the search found, under the app's mark
    if (t >= resMark + FLY) roleMark(ctx, Sd.x, Sd.y + 1, ROLE.search, { edge: BY.app });
    const si = tw(t, resIn - 0.05, 0.25);
    if (si > 0) docEntry(ctx, Sd, si, { tagAlpha: 0, chars: seg(t, resIn, resIn + 0.7) });
    // g, h: the assistant's mark, the answer, its end
    if (t >= markA + FLY) roleMark(ctx, Ad.x, Ad.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    const ca = landedAns(t);
    if (ca > 0) docEntry(ctx, Ad, 1, { tagAlpha: 0, chars: ca });
    if (t >= eotAt + EOT) roleMark(ctx, end.x, end.y, ROLE.end, { edge: WRITER.end });
    // a cursor after the assistant's mark, while the LLM reads, until it writes
    const cursor = t >= read1 && t < guessAt[0] + TOK ? rowAt(Gd, 0) : t >= read2 && t < ansAt[0] + TOK ? rowAt(Ad, 0) : null;
    if (cursor && Math.floor(t * 2.5) % 2 === 0) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(cursor.x, cursor.y - 24, 4, 30);
    }
    // rings on the document
    const [addLit] = lit(['add'], at('write'));
    ringBox(ctx, { x: Qd.tx - 2, y: Qd.y - 4, w: measure(ctx, Qd.font, Q) + 4, h: 34 }, addLit, C.accent);
    const [amountLit] = lit(['amount'], at('ans'));
    const [citeLit] = lit(['cite'], at('h2.end'));
    const [s1Lit, s2Lit, s3Lit] = lit(['s1', 's2', 's3'], at('name'));
    ringBox(ctx, cite.passage, Math.max(amountLit, citeLit), C.accent);
    ringBox(ctx, { x: Sd.tx, y: Sd.y, w: Sd.w, h: Sd.h }, s2Lit, C.accent);
    citeMark(ctx, cite.doc, Ad.font, citeLit);
    citeMark(ctx, cite.screen, B[1].L.font, citeLit);
    ringBox(ctx, { x: Ad.tx, y: Ad.y - 4, w: end.x + end.w - Ad.tx, h: 36 }, Math.max(s3Lit, doubtLit), C.accent);
    // l: the passage found is out of date
    const [oldLit] = lit(['old'], at('misread'));
    ringBox(ctx, cite.passage, oldLit, C.red);
    tag(ctx, oldTag.x, oldTag.y, '古い規程', { font: F.jp(700, 14), h: 26, padX: 9, fill: '#fff', stroke: C.red, color: C.red, alpha: pop('old') });

    // the reads: the app hands the document over
    [[read1, Gd.y + MARK_H], [read2, Ad.y + MARK_H]].forEach(([r, bottom]) => {
      sweep(ctx, L, seg(t, r + 0.05, r + READ), bottom);
      send(ctx, L.read, seg(t, r + 0.4, r + READ + 0.05), '', 'doc');
    });

    // ——— the app's box; 5-5's loop mark and the line to its code leave
    actor(ctx, ACT, 1, actGlow);
    ring(ctx, ACT.x, ACT.y, ACT.w, ACT.h, Math.max(appLit, app2Lit), C.accent, 18);
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      loopIcon(ctx, LOOP.x, LOOP.y, LOOP.r, 1, { p: 1 });
      leader(ctx, 1);
      ctx.save();
      ctx.translate(lerp(CODE.x, CODE.x, 0), lerp(CODE.y, CODE.y, 0) - Math.sin(Math.PI * 1) * 30);
      ctx.scale(1, 1);
      ctx.translate(-CODE.x, -CODE.y);
      drawCode(ctx);
      ctx.restore();
      drawRounds(ctx, old.chips);
      YEARS.forEach((yr, k) => yearRow(ctx, yr, YR.y + k * YR.h, 1));
      source(ctx, SOURCE55, 1, SOURCE_RIGHT);
      halt(ctx, 1);
      ctx.restore();
    }

    // ——— the tool's place: 5-5's three tools leave; the company's documents come in, then the search
    const docsAt = at('rules') - lead;
    const docs = (i) => tw(t, docsAt + 0.15 + order(i) * 0.035, pace.enter);
    const [ruleLit] = lit(['rule'], at('know'));
    const [fromLit, relLit] = lit(['from', 'rel'], at('few'));
    const [foundLit] = lit(['found'], at('add'));
    const vec = seg(t, vecAt, vecAt + 1.1);
    toolBox(ctx, Lt, 1, {
      solid: tw(t, docsAt, 0.5),
      draw: (c, b) => {
        if (gone > 0.001) {
          c.save();
          c.globalAlpha *= gone;
          toolRows(c);
          c.restore();
        }
        const r = searchPanel(c, S, lab, {
          a: tw(t, docsAt, 0.4),
          docs,
          title: tw(t, at('search') - lead, 0.5),
          kinds: tw(t, docsAt + 0.4, pace.enter) * (1 - tw(t, at('search') - lead, 0.4)),
          kindsText: '規程、手引き、改定のお知らせ など',
          query: { s: Q, a: tw(t, queryIn - 0.05, 0.3), chars: seg(t, queryIn, queryIn + 0.4), dot: seg(t, vecAt + QUERY_U * 1.1 / 1.2, vecAt + QUERY_U * 1.1 / 1.2 + 0.3) },
          found: [0, 1, 2].map((k) => tw(t, foundAt + k * 0.22, pace.enter)),
          model: pop('model'),
          caption: tw(t, vecAt + 0.5, pace.enter),
          vec,
          near: [0, 1, 2].map((k) => seg(t, at('near') - lead + k * 0.15, at('near') - lead + k * 0.15 + 0.4)),
          miss: pop('old'),
          missText: MISSED,
        });
        ringBox(c, r.map, Math.max(fromLit, ruleLit), C.accent);
        ringBox(c, r.query, Math.max(relLit, wordsLit), C.accent);
        [1, 2, 3].forEach((n) => ringBox(c, r.dot[n], foundLit, C.accent, 3));
        ringBox(c, [r.title, r.query, r.map], s1Lit, C.accent, 6);
      },
    });
    working(ctx, Lt, seg(t, queryIn, foundAt));
    const lw = text(ctx, 'ツール', box.x, box.y - 16, { font: F.jp(700, 22), color: C.ink });
    text(ctx, 'の場所', box.x + lw, box.y - 16, { font: F.jp(700, 22), color: C.ink });
    if (gone > 0.001) {
      const w1 = measure(ctx, F.jp(700, 22), 'の場所');
      tag(ctx, box.x + lw + w1 + 14, box.y - 39, '6 章　つなぐ先', { font: F.jp(700, 15), h: 30, padX: 11, fill: C.ink, color: C.paper, alpha: gone });
    }
    // f: there are other ways to search
    const other = tw(t, at('f.end'), pace.enter);
    text(ctx, 'ほかに、言葉の一致で探す方法や、', TOOL.x, TOOL.y + TOOL.h + 28, { font: F.jp(500, 14), color: C.muted, alpha: other });
    text(ctx, '両方を組み合わせる方法もある', TOOL.x, TOOL.y + TOOL.h + 48, { font: F.jp(500, 14), color: C.muted, alpha: other });

    // ——— above the LLM: what it learned (b2), then the app's work (i, m)
    knowledge(ctx, enter(t, at('b2'), pace) * (1 - tw(t, at('c'), 0.4)), pop('know'));
    steps(ctx, t, {
      card: enter(t, at('i'), pace),
      lines: [pop('s1'), pop('s2'), pop('s3')],
      lit: [Math.max(s1Lit, app2Lit, onceLit), s2Lit, s3Lit],
      once: pop('once'),
    });
    // l: the LLM may misread
    tag(ctx, L.llm.x + L.llm.w / 2, L.llm.y - 50, '読み違えることもある', { font: F.jp(700, 16), h: 30, padX: 10, fill: '#fff', stroke: C.red, color: C.red, align: 'center', alpha: pop('misread') });
    // ——— under the LLM: the name, and where it comes from (i, j)
    nameBlock(ctx, { name: pop('name'), rag: pop('rag'), paper: pop('paper') });
    source(ctx, 'Lewis ほか（2020）、arXiv:2005.11401', pop('paper'), SOURCE_RIGHT);

    // ——— in flight, over everything
    flyMark(ctx, T, Qd, seg(t, userAt, userAt + FLY), ROLE.user, { edge: WRITER.user });
    flyMark(ctx, T, Gd, seg(t, markC, markC + FLY), ROLE.assistant, { edge: WRITER.assistant });
    flyMark(ctx, T, Sd, seg(t, resMark, resMark + FLY), ROLE.search, { edge: BY.app });
    flyMark(ctx, T, Ad, seg(t, markA, markA + FLY), ROLE.assistant, { edge: WRITER.assistant });
    // the LLM's tokens
    const write = (list, ts, e, fade = 1) => {
      list.forEach((tk, k) => {
        const p = seg(t, ts[k], ts[k] + TOK);
        if (p <= 0 || p >= 1) return;
        const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
        const pt = onPath(writePath(T, e, tk.x + w / 2, tk.y), inOutCubic(p));
        token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8) * fade);
      });
    };
    write(toks.guess, guessAt, Gd, unguess);
    write(toks.ans, ansAt, Ad);
    const ep = seg(t, eotAt, eotAt + EOT);
    if (ep > 0 && ep < 1) {
      const pt = onPath(writePath(T, Ad, end.x + end.w / 2, end.y + MARK_H / 2), inOutCubic(ep));
      roleMark(ctx, pt.x - end.w / 2, pt.y - MARK_H / 2, ROLE.end, { edge: WRITER.end, alpha: clamp(ep * 8) });
    }
    // d: the app sends the question's words, as they are, from its box to the search
    chipFlight(ctx, seg(t, goAt, goAt + GO), queryPath(), Q, 'app');
    // g: what the search found comes back into the document, and waits there until the app writes it in
    const backP = seg(t, backAt, backAt + BACK);
    chipFlight(ctx, backP < 1 ? backP : 0.999, fromTool(T, Sd, 0, Sd.tx + 140), '見つかった文章 3 件', 'found', backP < 1 ? 1 : 1 - tw(t, resIn - 0.05, 0.25));

    // ——— the example's note (5-5's leaves)
    const ex = { x: L.app.x, y: L.app.y + L.app.h + 22 };
    const exW = measure(ctx, F.jp(700, 17), '例') + 20;
    example(ctx, ex.x, ex.y, 1, '');
    text(ctx, NOTE55, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: gone });
    text(ctx, NOTE, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: fresh });
  },
});

// ——— this clip's pieces ————————————————————————————————————————————————

const QUERY_U = 0.52;

// The documents come in roughly left to right, top to bottom.
const ORDER = PASSAGES.map((p, i) => [p.u + p.v * 0.6, i]).sort((x, y) => x[0] - y[0]).map(([, i]) => i);
const order = (i) => ORDER.indexOf(i);

// From the app's box to the search: out of the box's right side, down the lane by the frame's edge, along
// the input channel to the tool's place (where the chip fades; the words then appear in the search's row).
function queryPath() {
  const y0 = ACT.y + ACT.h - 20;
  return [[ACT.x + ACT.w - 40, y0], [T.lane, y0], [T.lane, L.call.y], [L.call.x2, L.call.y], [TOOL.x + 10, L.call.y]];
}

// A chip on its way along a polyline (eased overall), fading in and out at its ends. kind 'app': the
// question's words as the app sends them (white, in the app's purple); 'found': what the search found.
// The chip slides into the tool's place and out of it under its edge (a = how much is left of a chip that
// has arrived and waits; it does not fade at its far end then).
function chipFlight(ctx, p, pts, s, kind, a = null) {
  if (p <= 0 || p >= 1 || a === 0) return;
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, TOOL.x, 900);
  ctx.clip();
  ctx.globalAlpha = clamp(p * 8) * (a ?? clamp((1 - p) * 8));
  if (kind === 'app') tag(ctx, pt.x, pt.y - 15, s, { font: F.jp(700, 16), h: 30, padX: 11, fill: '#fff', stroke: C.purple, lw: 2.5, color: C.purple, align: 'center', r: 8 });
  else tag(ctx, pt.x, pt.y - 15, s, { font: F.jp(700, 16), h: 30, padX: 10, fill: C.green, color: '#fff', align: 'center', r: 8 });
  ctx.restore();
}

// The width「［1］」takes before「。」: the browser closes up the bracket next to the full stop.
const citeW = (ctx, font) => measure(ctx, font, ANS_PRE + CITE + '。') - measure(ctx, font, ANS_PRE) - measure(ctx, font, '。');

// h2: the citation, in vermilion on a soft ground (c: where「［1］」is drawn, its baseline and width).
function citeMark(ctx, c, font, level) {
  if (level <= 0.001) return;
  const top = c.base === 'middle' ? c.y - 15 : c.y - 23;
  ctx.save();
  ctx.globalAlpha *= level;
  rr(ctx, c.x - 2, top, c.w + 4, 30, 6);
  ctx.fillStyle = C.accentSoft;
  ctx.fill();
  ctx.restore();
  text(ctx, CITE, c.x, c.y, { font, color: C.accent, base: c.base, alpha: level });
}

// b2: what the LLM learned, above it (as 5-1 has it), and what is not in it.
function knowledge(ctx, a, no) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, KNEW.x, KNEW.y, KNEW.w, KNEW.h, 12);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = C.rule;
  [0.82, 0.6, 0.74].forEach((w, k) => ctx.fillRect(KNEW.x + 18, KNEW.y + 56 + k * 18, (KNEW.w - 36) * w, 8));
  ctx.restore();
  text(ctx, '学習で身に付けた知識', KNEW.x + 18, KNEW.y + 34, { font: F.jp(700, 18), color: C.ink, alpha: a });
  tag(ctx, KNEW.x + 18, KNEW.y + KNEW.h - 44, 'この会社の日当：わからない', { font: F.jp(700, 15), h: 28, padX: 9, fill: '#fff', stroke: C.red, color: C.red, alpha: a * no });
}

// i, m: the app's work in this design, as three steps on a card in the app's colour.
function steps(ctx, t, { card, lines, lit, once }) {
  if (card <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = card;
  rr(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'アプリの動き（この例）', CARD.x + 16, CARD.y + 30, { font: F.jp(700, 17), color: C.purple, alpha: card });
  STEPS.forEach((s, k) => {
    const a = card * lines[k];
    if (a <= 0.001) return;
    const y = STEP_Y(k);
    const lv = lit[k];
    if (lv > 0.001) {
      ctx.save();
      ctx.globalAlpha = a * lv;
      rr(ctx, CARD.x + 8, y - 21, CARD.w - 16, 30, 6);
      ctx.fillStyle = C.accentSoft;
      ctx.fill();
      ctx.restore();
    }
    const dx = (1 - lines[k]) * 10;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = C.purple;
    circle(ctx, CARD.x + 30 + dx, y - 6, 11);
    ctx.fill();
    ctx.restore();
    text(ctx, String(k + 1), CARD.x + 30 + dx, y - 5, { font: F.sans(700, 14), color: '#fff', align: 'center', base: 'middle', alpha: a });
    const w = text(ctx, s, CARD.x + 50 + dx, y, { font: F.jp(500, 15), color: C.ink, alpha: a });
    if (k === 0) tag(ctx, CARD.x + 50 + w + 10, y - 19, '1 回だけ', { font: F.jp(700, 13), h: 24, padX: 8, fill: C.purple, color: '#fff', r: 6, alpha: a * once });
  });
}

// i, j: the name, and the paper it comes from.
function nameBlock(ctx, { name, rag, paper }) {
  const { x, y } = NAME;
  text(ctx, '検索拡張生成', x, y + (1 - name) * 8, { font: F.jp(700, 22), color: C.ink, alpha: name });
  const w = text(ctx, 'RAG', x, y + 56 + (1 - rag) * 8, { font: F.cond(700, 50), color: C.accent, alpha: rag });
  text(ctx, 'Retrieval-Augmented', x + w + 14, y + 34, { font: F.sans(500, 15), color: C.ink2, alpha: rag });
  text(ctx, 'Generation', x + w + 14, y + 53, { font: F.sans(500, 15), color: C.ink2, alpha: rag });
  if (paper <= 0.001) return;
  const dy = (1 - paper) * 8;
  text(ctx, '2020 年　Lewis ほかの論文', x, y + 98 + dy, { font: F.jp(700, 16), color: C.ink, alpha: paper });
  text(ctx, 'Retrieval-Augmented Generation for', x, y + 120 + dy, { font: F.sans(500, 13), color: C.ink2, alpha: paper });
  text(ctx, 'Knowledge-Intensive NLP Tasks', x, y + 138 + dy, { font: F.sans(500, 13), color: C.ink2, alpha: paper });
  text(ctx, '検索と生成を組み合わせる研究は、それより前からある', x, y + 164 + dy, { font: F.jp(500, 12), color: C.muted, alpha: paper });
}

// ——— 5-5's last picture (as toolloop.js draws it) ——————————————————————————

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

function drawCall(ctx, c) {
  const { band } = c;
  ctx.save();
  ctx.globalAlpha *= 1;
  rr(ctx, band.x, band.y, band.w, band.h, 8);
  ctx.fillStyle = C.accentSoft;
  ctx.fill();
  ctx.fillStyle = C.accent;
  ctx.fillRect(band.x, band.y + 6, 4, band.h - 12);
  ctx.restore();
  roleMark(ctx, c.open.x, c.open.y, ROLE.call, { edge: WRITER.call });
  c.toks.forEach((tk) => text(ctx, tk.s, tk.x, tk.base, { font: MFONT, color: C.ink }));
  roleMark(ctx, c.end.x, c.end.y, ROLE.callEnd, { edge: WRITER.callEnd });
}

function idTag(ctx, band, y, k, a) {
  tag(ctx, band.x + band.w - 10, y, `#${k}`, { font: F.mono(600, 15), h: 28, padX: 9, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'right', r: 8, alpha: a });
}

// The head with its folded definitions, and the conversation: the question, two calls with their results,
// the answer with its end.
function drawOldDoc(ctx, o) {
  text(ctx, FOLDED5, DX, defY(0) + (DTOP5 - DTOP), { font: F.jp(500, 17), color: C.muted, alpha: 1 });
  roleMark(ctx, SYS.x, SYS.y + 1 + (DTOP5 - DTOP), ROLE.system, { edge: WRITER.system });
  docEntry(ctx, o.Qe, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.Qe.x, o.Qe.y + 1, ROLE.user, { edge: WRITER.user });
  [[o.call1, o.R1], [o.call2, o.R2]].forEach(([c, R], k) => {
    roleMark(ctx, DOC.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    drawCall(ctx, c);
    idTag(ctx, c.band, c.open.y, k + 1, 1);
    roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
    docEntry(ctx, R, 1, { tagAlpha: 0 });
    idTag(ctx, c.band, R.y + R.h / 2 - 14, k + 1, 1);
  });
  roleMark(ctx, o.A.x, o.A.y + 1, ROLE.assistant, { edge: WRITER.assistant });
  docEntry(ctx, o.A, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.aEnd.x, o.aEnd.y, ROLE.end, { edge: WRITER.end });
}

// From the code card to the app's loop mark: a dashed line in the app's colour, drawn up to p.
function leader(ctx, p) {
  if (p <= 0) return;
  const y = CODE.y + 26;
  ctx.save();
  ctx.globalAlpha *= clamp(p * 3);
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  path(ctx, [[CODE.x + CODE.w, y], [LOOP.x, y], [LOOP.x, LOOP.y - LOOP.r - 10]], p);
  ctx.setLineDash([]);
  ctx.restore();
}

// The app's work as pseudo-code, every line in, nothing lit.
function drawCode(ctx) {
  const card = 1;
  ctx.save();
  ctx.globalAlpha *= card;
  rr(ctx, CODE.x, CODE.y, CODE.w, CODE.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'アプリの動き', CODE.x + 16, CODE.y + 28, { font: F.jp(700, 17), color: C.purple, alpha: card });
  tag(ctx, CODE.x + CODE.w - 14, CODE.y + 11, '擬似コード', { font: F.jp(700, 13), h: 24, padX: 9, fill: '#fff', stroke: C.muted, color: C.muted, align: 'right', alpha: card });
  LINES.forEach((ln, i) => {
    const y = lineY(i);
    const x = lineX(i);
    const w = text(ctx, ln.s, x, y, { font: ln.head ? F.jp(700, 16) : CF, color: ln.head ? C.purple : C.ink, alpha: card });
    if (ln.value) {
      tag(ctx, x + w + 8, y - 16, ln.value, { font: F.mono(600, 13), h: 22, padX: 8, fill: ln.hot ? C.accent : C.ink2, color: '#fff', alpha: card });
    }
    if (ln.note) text(ctx, ln.note, x + w + 2, y, { font: F.jp(500, 12), color: C.muted, alpha: card });
  });
  const yTop = lineY(1) - 6;
  const yBot = lineY(LINES.length - 1) + 4;
  ctx.save();
  ctx.globalAlpha *= card;
  ctx.strokeStyle = ctx.fillStyle = C.purple;
  ctx.lineWidth = 2.5;
  const pts = [[lineX(1) - 10, yBot], [BRACKET_X, yBot], [BRACKET_X, yTop], [lineX(1) - 8, yTop]];
  const end = path(ctx, pts, 1);
  if (end) arrowHead(ctx, end.x, end.y, 0, 9);
  ctx.restore();
  text(ctx, 'tool_use、end_turn は Anthropic の API の値', CODE.x + CODE.w - 14, CODE.y + CODE.h - 10, { font: F.jp(500, 12), color: C.muted, align: 'right', alpha: card });
}

// Under the LLM: the rounds of the rainy example and of the sunny one, counted.
function drawRounds(ctx, chips) {
  const rowA = ROWS[0];
  text(ctx, rowA.label, TRK.x, rowA.y + 14, { font: F.jp(700, 14), color: C.ink2, alpha: 1 });
  text(ctx, '3 周、ツールは 2 回', TRK.x + TRK.w, rowA.y + 15, { font: F.jp(700, 16), color: C.ink, align: 'right' });
  arrowBetween(ctx, chips[0][0], chips[0][1], 1);
  arrowBetween(ctx, chips[0][1], chips[0][2], 1);
  chips[0].forEach((c) => drawChip(ctx, c, 1, 1));
  const rowB = ROWS[1];
  text(ctx, rowB.label, TRK.x, rowB.y + 14, { font: F.jp(700, 14), color: C.ink2, alpha: 1 });
  chips[1].forEach((c, k) => {
    if (k > 0) arrowBetween(ctx, chips[1][k - 1], c, 1);
    drawChip(ctx, c, 1, 1);
  });
  text(ctx, '2 周、ツールは 1 回', TRK.x + TRK.w, rowB.y + 15, { font: F.jp(700, 16), color: C.ink, align: 'right', alpha: 1 });
  MULTI.forEach((s, i) => text(ctx, s, TRK.x, TRK.y + 136 + i * 17, { font: F.jp(500, 13), color: C.muted, alpha: 1 }));
}

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

function yearRow(ctx, yr, y, a) {
  if (a <= 0.001) return;
  const dy = (1 - a) * 8;
  text(ctx, yr.year, YR.x, y + 30 + dy, { font: F.cond(700, 30), color: C.ink, alpha: a });
  text(ctx, yr.who, YR.x + 76, y + 14 + dy, { font: F.jp(700, 15), color: C.ink, alpha: a });
  text(ctx, yr.what, YR.x + 76, y + 34 + dy, { font: F.jp(500, 14), color: C.ink2, alpha: a });
}

// The app stops the writing — the purple tag on the write channel.
function halt(ctx, a) {
  if (a <= 0.001) return;
  const cx = (L5.write.x1 + L5.write.x2) / 2;
  const w = measure(ctx, F.jp(700, 16), '止める') + 44;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, cx - w / 2, L5.write.y - 15, w, 30, 15);
  ctx.fillStyle = C.purple;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - w / 2 + 13, L5.write.y - 5, 10, 10);
  ctx.restore();
  text(ctx, '止める', cx - w / 2 + 31, L5.write.y + 1, { font: F.jp(700, 16), color: '#fff', base: 'middle', alpha: a });
}

// The tool's place as 5-5 leaves it: the chapter's three tools in rows, each with its program.
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
