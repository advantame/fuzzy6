// 6-2: search as a tool. Told from the designer's side (Boss, 2026-10-15), like 6-1. Asked "has the daily
// allowance changed with this year's revision?", the app of 6-1 searches once with the question's words:
// the rule on the allowance turns up ([1]), the notice of the revision does not ([4]) — and since the app
// searches only once, it cannot look at what came back and search again. So we make the search one of the
// tools: the app writes its definition at the head of the document (search_docs, its input `query`), and
// the tool's place no longer says the app uses it directly but that the LLM asks for it. The LLM writes a
// call with words of its own ("出張 日当"); the app reads the call and runs the search, and writes what was
// found back under the search's mark. Reading it, the LLM finds nothing on the revision and asks again with
// other words ("2026年 日当の改定"): the words land elsewhere on the map, next to [4]. With both results it
// answers, citing [4]. ずんだもん asks whether search should then always be a tool: more exchanges with the
// search and the LLM tend to take longer and cost more (the order of exchanges, counted as chips, no
// seconds or yen); searching first, letting the LLM choose, or both, is the maker's choice. This form too
// is called RAG in the broad sense. Web search as a tool came to the OpenAI and Anthropic APIs in 2025 —
// a tool of its own, not the company's search.
//
// The layout is 6-1's (lib/rig.js toolUseLayout with the taller tool's place). The clip joins 6-1 (spec
// §6.10): its first frame is 6-1's last picture, drawn here as rag.js draws it, and the bridge clears
// 6-1's conversation, the name and the paper, and what the search found, keeping the card of the app's
// work (it is pointed at in sentence c). Everything in the conversation is an example: the question, the
// documents, the search words and what they find, the answer (cut into tokens as o200k_base cuts them),
// the places on the map, and the order of the exchanges (research/connect-facts 6-2).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import {
  toolUseLayout, G5, chatScreen, screenBubbles, chatBubble, screenLinks, toTool, fromTool, writePath, flyMark,
  llmBlock, appFrame, toolBox, channel, actor, token, TOKEN, tokenPlaces, onPath, docLayout, docEntry, rowAt, sweep, send, working,
  roleMark, markWidth, MARK_H, ROLE, BY, WRITER,
} from '../lib/rig.js';
import { searchLayout, searchLabels, searchPanel, PASSAGES } from '../lib/docsearch.js';
import { text, measure, rr, path, circle, line, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { focus, ring, ringBox } from '../../../src/kit/cue.js';
import { place, segment, disc } from '../../../src/kit/place.js';

// ——— the layout: 6-1's (the tool's place taller, the screen shorter)
const G6 = { ...G5, tool: { x: G5.tool.x, y: 400, w: G5.tool.w, h: 370 } };
const T = toolUseLayout(G6);
const { L, ACT } = T;
const SCREEN = { ...T.SCREEN, h: 250 };
const TOOL = L.tool;
const DOC = L.doc;
const S = searchLayout(TOOL);

// ——— 6-1's picture, as rag.js has it (its last frame is this clip's first)
const Q61 = '出張の日当はいくら？';
const FOUND61 = '［1］旅費規程 第5条\n　　出張の日当は、1日2,000円とする。\n［2］出張の手引き\n　　日当は、精算のときに支払う。\n［3］2026年4月の改定\n　　宿泊費の上限を変える。';
const MISSED = ['［4］2026年4月の改定', '出張の日当を、1日2,500円にする。'];
const ANS61 = '1日2,000円です［1］。';
const STEPS = ['質問の文のまま、資料を検索する', '見つけた文章を、文書に書き足す', 'LLM に読ませて、答えを書かせる'];
const CARD = { x: 30, y: 58, w: 346, h: 160 };
const STEP_Y = (k) => CARD.y + 66 + k * 32;
const NAME = { x: 36, y: 604 };
const NOTE61 = '質問、資料、答えは説明のための例';
const SOURCE61 = 'Lewis ほか（2020）、arXiv:2005.11401';
const FINAL61 = {
  a: 1, docs: () => 1, title: 1, kinds: 0, kindsText: '規程、手引き、改定のお知らせ など',
  query: { s: Q61, a: 1, chars: 1, dot: 1 }, found: [1, 1, 1], model: 1, caption: 1, vec: 1, near: [1, 1, 1], miss: 1, missText: MISSED,
};

// ——— this clip's conversation (an example)
const Q = '出張の日当は、今年の改定で変わった？';
const Q_SCREEN = '出張の日当は、\n今年の改定で変わった？';
// sentence b: the app sends the question's words, as they are, to the search (two lines on the chip and in
// the search's row: they are too long for one)
const Q_ROWS = ['出張の日当は、今年の改定で', '変わった？'];
const Q_CHIP = ['出張の日当は、', '今年の改定で変わった？'];
// the definition the app writes at the head (sentence d)
const DEF_NAME = 'search_docs';
const DEFS = [
  [[DEF_NAME, F.jp(700, 17)], ['：社内の資料を検索する', F.jp(500, 17)]],
  [['入力：query（検索キーワード）', F.jp(500, 17)]],
];
// the LLM's two calls, row by row, as o200k_base cuts them (19 and 23 tokens); the search words are the
// last row's tokens after its opening quote
const HEAD_ROWS = [['{"', 'name', '":', ' "', 'search', '_docs', '",'], [' "', 'input', '":', ' {"', 'query', '":']];
const CALL1 = [...HEAD_ROWS, [' "', '出', '張', ' 日', '当', '"}}']];
const CALL2 = [...HEAD_ROWS, [' "', '202', '6', '年', ' 日', '当', 'の', '改', '定', '"}}']];
const W1 = '出張 日当';
const W2 = '2026年 日当の改定';
const PRE = 14; // tokens before the search words
// what each search finds, as the app writes it in (one passage: the nearest)
const R1_TEXT = '［1］旅費規程 第5条：日当は1日2,000円';
const R2_TEXT = '［4］2026年4月の改定：日当を1日2,500円に';
// the answer (o200k_base: 19 tokens); in the document and on the screen it breaks after the comma
const ANS = ['変', 'わ', 'りました', '。', '4', '月', 'から', '、', '1', '日', '2', ',', '500', '円', 'です', '［', '4', '］', '。'];
const ANS_DOC = '変わりました。4月から、\n1日2,500円です［4］。';
const NOTE = '質問、資料、呼び出し、答えは説明のための例';
const ONE = 'この例の search_docs は、いちばん近い 1 件を返す';
// where the LLM's search words land on the map (0–1 of its width and height): the first by [1], the
// second by [4]
const Q1 = { u: 0.55, v: 0.44 };
const Q2 = { u: 0.3, v: 0.36 };

const TFONT = F.jp(500, 20); // text in this clip's document
const RFONT = F.jp(500, 16); // what the search found
const MFONT = F.mono(500, 15); // JSON
const MLH = 28; // a row of a call
const DX = DOC.x + 18 + 122 + 12; // where the entries' text starts (docLayout's tx)
const SYS = { x: DOC.x + 18, y: DOC.y + 14 };
const defY = (k) => SYS.y + 20 + k * 26;
const Q_TOP = DOC.y + 24; // the question before the head is written (a–c)

// ——— sentences i–k: the order of the exchanges, above the LLM where 6-1's card was
const FORMS = { x: 30, y: 46, w: 346 };
const FROWS = [
  { label: '先に検索する', chain: ['検索', 'LLM'] },
  { label: 'LLM に選ばせる', chain: ['LLM', '検索', 'LLM', '検索', 'LLM'] },
  { label: '組み合わせる', chain: ['検索', 'LLM', '検索', 'LLM'], opt: 2, note: '足りなければ LLM が呼び出す' },
];
const FROW_Y = (k) => FORMS.y + 50 + k * 96;
// the card's height: two rows with the brackets under them (i), then the third row (j2)
const FORMS_H = (rows) => (rows === 2 ? FROW_Y(1) + 86 : FROW_Y(2) + 66) - FORMS.y;
const LINK = { font: F.jp(700, 14), h: 28, padX: 10, gap: 18 };
// sentence l: the Web search tools, under the LLM
const WEB = { x: 30, y: 586, w: 346, h: 182 };

const FLY = 0.55; // a mark flying out of the app's box
const TOK = 0.42; // a token along the write channel and into its place
const EOT = 0.5; // a mark the LLM writes, the same way
const READ = 0.95; // the app has the LLM read the document
const GO_B = 1.0; // b: the question's words, from the app's box to the search
const STEP = 0.32; // the app sees the call's end, before it sends the words
const GO = 0.6; // the words, from the call to the search
const WORK = [0.95, 1.25]; // the search at work (the second time the words land somewhere else)
const BACK = 0.65; // what was found, from the search into its place

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n token times, evenly from a, the last one landing by b
const times = (n, a, b) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - TOK - a)) / Math.max(1, n - 1));
// a call's token times: the JSON up to the search words from a, then the words from wAt, landing by wEnd
function callTimes(nPre, nW, a, wAt, wEnd) {
  const pre = times(nPre, a, Math.max(wAt + TOK - 0.05, a + nPre * 0.07 + TOK));
  const w0 = Math.max(wAt, pre[pre.length - 1] + 0.06);
  return [...pre, ...times(nW, w0, Math.max(wEnd, w0 + nW * 0.12 + TOK))];
}
const upto = (list, ts) => (s) => list.reduce((u, tk, k) => (s >= ts[k] + TOK ? tk.upto : u), 0);

export default clip({
  id: 'search',
  title: '検索もツールに',
  kicker: '検索ツール',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.9, // 6-1's conversation and notes clear away; skipped unless the clip is joined from 6-1
  script: [
    { id: 'a', text: 'こんどは、社員から、{ask}「出張の日当は、\n今年の改定で変わった？」と聞かれたとしましょう。' },
    { id: 'b', tail: 0.3, text: '{words}アプリが質問の文のまま検索すると、\n{rule}日当の規程は見つかっても、\n\n{miss}改定のお知らせは見つからないかもしれないわ。' },
    { id: 'c', still: true, text: 'でも、{app}いまのアプリは、{once}最初に一度だけ検索する作りだから、\n{see}その結果を見て、{redo}調べ直すことはできないの。' },
    { id: 'd', still: true, lead: 0.7, tail: 1.0, text: 'そこで、{search}検索を、{tool}ツールの一つにしましょう。' },
    { id: 'e', lead: 1.2, tail: 3.1, text: '{what}何を調べるかは、{llm}LLM が決めるわ。\n{words2}検索キーワードを選んで、{ask2}検索のツール呼び出しを書くの。' },
    { id: 'f', lead: 0.9, tail: 3.4, text: '{read}返ってきた結果を読んで、{lack}足りなければ、\n\n{change}キーワードを変えて、\n{again}もう一度ツール呼び出しを書くこともできるわ。' },
    { id: 'g', still: true, lead: 1.3, tail: 1.2, text: '{found}改定のお知らせが見つかったら、\n{two}二つの検索結果をもとに、{ans}答えを書くわね。' },
    { id: 'h', by: 'zunda', text: '{always}じゃあ、検索は、いつもツールにすればいいのだ？' },
    { id: 'i', text: 'ただ、{more}検索や、LLM に文書を読ませる回数が増えると、\n{time}答えが出るまでの時間や、{cost}費用も増えやすいわ。' },
    { id: 'j', text: '{pre}アプリが先に検索する形にするか、\n{pick}検索キーワードやタイミングを、LLM に選ばせるか。' },
    { id: 'j2', still: true, text: '{mix}組み合わせることも含めて、{maker}アプリを作る人が選ぶのよ。' },
    { id: 'k', text: '{broad}検索をツールにする形も、広い意味では、\n{rag}[RAG|ラグ] と呼ばれることがあるわ。' },
    { id: 'l', tail: 0.6, text: '{web}Web を検索するツールも、{y25}2025 年に、\n{api}OpenAI と Anthropic の API で使えるようになったの。' },
  ],

  prepare(ctx) {
    // ——— 6-1's last picture, laid out as rag.js lays it out
    const ent = (role, s, kind = 'text') => ({ role, text: s, kind });
    const [Qd, Sd, Ad] = docLayout(ctx, L, [ent('user', Q61), ent('search', FOUND61, 'data'), ent('assistant', ANS61)], T.DOC);
    const last = rowAt(Ad, 0);
    const end = { x: last.x + measure(ctx, Ad.font, Ad.rows[0]) + 16, y: last.y - 22, w: markWidth(ctx, ROLE.end.name) };
    const B61 = screenBubbles(ctx, SCREEN, [['user', Q61], ['assistant', ANS61]]);
    const oldTag = { x: rowAt(Sd, 0).x + measure(ctx, Sd.font, Sd.rows[0]) + 14, y: rowAt(Sd, 0).y - 20 };
    const old = { Qd, Sd, Ad, end, B: B61, oldTag };
    const lab = searchLabels(ctx, S);

    // ——— this clip's document: the head, the question, two calls with what they found, the answer
    const opts = { ...T.DOC, font: TFONT, lh: 28, mono: RFONT, lhMono: 24 };
    const one = (e, y) => docLayout(ctx, L, [e], { ...opts, top: y - DOC.y })[0];
    let y = defY(1) + 28;
    const Qe = one({ role: 'user', text: Q }, y);
    y = Qe.y + Qe.h + 14;
    const call1 = callLayout(ctx, { x: DX, y, w: Qe.w, h: 3 * MLH + 16 }, CALL1);
    y = call1.band.y + call1.band.h + 10;
    const R1 = one({ role: 'search', kind: 'data', text: R1_TEXT }, y);
    y = R1.y + R1.h + 14;
    const call2 = callLayout(ctx, { x: DX, y, w: Qe.w, h: 3 * MLH + 16 }, CALL2);
    y = call2.band.y + call2.band.h + 10;
    const R2 = one({ role: 'search', kind: 'data', text: R2_TEXT }, y);
    y = R2.y + R2.h + 16;
    const A = one({ role: 'assistant', text: ANS_DOC }, y);
    if (A.y + A.h > DOC.y + DOC.h - 6) throw new Error(`search: the document overflows (${A.y + A.h})`);
    const ansToks = tokenPlaces(ctx, A, ANS);
    const aRow = rowAt(A, A.rows.length - 1);
    const aEnd = { x: aRow.x + measure(ctx, A.font, A.rows[A.rows.length - 1]) + 14, y: aRow.y - 21, w: markWidth(ctx, ROLE.end.name) };
    const B = screenBubbles(ctx, SCREEN, [['user', Q_SCREEN], ['assistant', ANS_DOC]]);
    const shift = Qe.y - Q_TOP;
    // the head's rows, and the box around them
    const defs = DEFS.map((row, k) => {
      let x = DX + (k ? 19 : 0);
      const segs = row.map(([s, font]) => {
        const w = measure(ctx, font, s);
        const out = { s, font, x, w, n: Array.from(s).length };
        x += w;
        return out;
      });
      return { segs, right: x, n: segs.reduce((n, sg) => n + sg.n, 0) };
    });
    const defBox = { x: DX - 4, y: SYS.y - 1, w: Math.max(...defs.map((d) => d.right)) - DX + 8, h: defY(1) + 6 - SYS.y + 1 };
    // the search words in each call (for rings), and the tag on [1] (sentence f)
    const wordsBox = (c) => {
      const ws = c.toks.slice(PRE + 1, c.toks.length - 1);
      const x0 = ws[0].x;
      const x1 = ws[ws.length - 1].x + ws[ws.length - 1].w;
      return { x: x0 - 3, y: ws[0].y - 14, w: x1 - x0 + 6, h: 26 };
    };
    const r1Row = rowAt(R1, 0);
    const lackTag = { x: R1.tx + R1.w - 8, y: R1.y + (R1.h - 24) / 2, after: r1Row.x + measure(ctx, R1.font, R1.rows[0]) };
    // the map: where the two searches' words land, and where their labels go (place.js keeps them off the
    // lines, the dots and the passages)
    const at = (p) => S.at(p);
    const q1 = at(Q1);
    const q2 = at(Q2);
    const idx = (n) => PASSAGES.findIndex((p) => p.n === n);
    const p1 = S.pos[idx(1)];
    const p4 = S.pos[idx(4)];
    const shapes = [segment(q1, p1, 2), segment(q2, p4, 2), disc(q1, 10), disc(q2, 10), ...S.pos.map((p) => disc(p, 7)),
      ...[1, 4].map((n) => { const w = measure(ctx, F.jp(700, 13), `［${n}］`); return { kind: 'rect', x: lab[n].x - w / 2, y: lab[n].y - 7, w, h: 14 }; })];
    const qLab = [q1, q2].map((q, k) => {
      const w = measure(ctx, F.jp(700, 13), `${k + 1} 回め`);
      return place(q, { x: -1, y: 0 }, { w, h: 14 }, shapes, { gap: 4, from: 10 + w / 2 });
    });
    // the chips of each form (sentences i–k)
    const forms = FROWS.map((row, k) => {
      let x = FORMS.x + 16;
      const chips = row.chain.map((s, i) => {
        const w = measure(ctx, LINK.font, s) + LINK.padX * 2;
        const c = { s, x, w, y: FROW_Y(k) + 24 };
        x += w + LINK.gap;
        return c;
      });
      const end = chips[chips.length - 1].x + chips[chips.length - 1].w;
      const ox = row.opt === undefined ? 0 : chips[row.opt].x - 8;
      const opt = row.opt === undefined ? null : { x: ox, x1: Math.max(end + 8, ox + 16 + measure(ctx, F.jp(500, 13), row.note)) };
      return { chips, x0: chips[0].x, x1: chips[chips.length - 1].x + chips[chips.length - 1].w, opt };
    });
    return { old, lab, Qe, call1, R1, call2, R2, A, ansToks, aEnd, B, shift, defs, defBox, words1: wordsBox(call1), words2: wordsBox(call2), lackTag, q1, q2, qLab, forms };
  },

  draw(ctx, t, s, { at, pace }) {
    const { old, lab, Qe, call1, R1, call2, R2, A, ansToks, aEnd, B, shift, defs, defBox, words1, words2, lackTag, q1, q2, qLab, forms } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (names, until) => focus(t, names.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 6-1's conversation and notes clear away. The first frame is 6-1's untouched.
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.6));
    const fresh = inOutCubic(seg(t, br * 0.6, br));

    // ——— when things happen
    // a: the question comes in, and the app writes it under the user's mark
    const askAt = at('ask') - lead;
    const userAt = askAt + 0.45;
    // b: the app sends the question's words to the search, as 6-1 does; it finds [1]–[3] and misses [4]
    const goB = at('words') - lead + 0.1;
    const inB = goB + GO_B;
    const foundB = Math.max(at('rule') - lead, inB + 0.35);
    const missB = Math.max(at('miss') - lead, foundB + 0.5);
    const reset = 1 - tw(t, at('d'), 0.5, inOutCubic);
    // d: 6-1's card leaves, the question moves down; the app writes the definition at the head
    const cardOut = 1 - tw(t, at('d'), 0.45, inOutCubic);
    const down = inOutCubic(seg(t, at('d') + 0.15, at('d') + 0.65));
    const sysAt = at('tool') - lead;
    const defIn = [seg(t, sysAt + FLY - 0.05, sysAt + FLY + 0.5), seg(t, sysAt + FLY + 0.3, sysAt + FLY + 0.8)];
    const swap = tw(t, at('tool') - lead, 0.5);
    const nameTag = tw(t, at('tool') - lead + 0.2, pace.enter);
    // the three rounds (e, f, g): the app writes the assistant's mark and has the LLM read; the LLM writes a
    // call (e, f) and the app runs the search and writes what it found in, or the LLM writes the answer (g)
    const round = (id) => {
      const st = at(id);
      const mark = st + 0.05;
      const read = mark + FLY - 0.1;
      return { st, mark, read, wrote: read + READ };
    };
    const r1 = round('e');
    r1.open = Math.max(r1.wrote, at('what') + 0.15);
    r1.tok = callTimes(PRE, CALL1[2].length - 1, r1.open + EOT - 0.2, at('words2') - 0.25, at('ask2') + 0.15);
    const r2 = round('f');
    r2.open = Math.max(r2.wrote, at('read') + 0.2);
    r2.tok = callTimes(PRE, CALL2[2].length - 1, r2.open + EOT - 0.2, at('change') - 0.25, at('again') + 0.1);
    [r1, r2].forEach((r, k) => {
      r.fin = r.tok[r.tok.length - 1] + TOK;
      r.stop = r.fin + EOT;
      r.go = r.stop + STEP;
      r.work = r.go + GO;
      r.back = r.work + WORK[k];
      r.resMark = r.back + BACK * 0.35;
      r.resIn = r.back + BACK;
      r.done = r.resIn + 0.35;
    });
    const r3 = round('g');
    const a3 = Math.max(r3.wrote, at('ans') - 0.35);
    r3.tok = times(ANS.length, a3, Math.max(at('ans') + 1.0, a3 + 1.3));
    r3.fin = r3.tok[r3.tok.length - 1] + TOK;
    r3.endIn = r3.fin + EOT;
    const landedAns = upto(ansToks, r3.tok);
    const callLanded = (c, r) => c.toks.reduce((n, _, k) => (t >= r.tok[k] + TOK ? k + 1 : n), 0);
    const c1n = callLanded(call1, r1);
    const c2n = callLanded(call2, r2);

    // ——— who is at work
    const [makerLit] = lit(['maker'], at('j2.end'));
    const actGlow = Math.max(
      span(t, userAt - 0.1, userAt + FLY),
      span(t, goB - 0.2, inB),
      span(t, sysAt - 0.1, sysAt + FLY + 0.8),
      ...[r1, r2, r3].map((r) => span(t, r.mark, r.wrote)),
      ...[r1, r2].map((r) => span(t, r.stop, r.done - 0.2)),
      span(t, r3.tok[0] + TOK, r3.endIn - 0.1),
      makerLit,
    );
    const llmGlow = Math.max(...[r1, r2].map((r) => span(t, r.wrote - 0.1, r.stop)), span(t, r3.wrote - 0.1, r3.endIn - 0.15));
    const writing = [r1, r2].some((r) => t >= r.open && t < r.stop) || (t >= r3.tok[0] && t < r3.endIn);

    // ——— the chat screen: 6-1's conversation leaves, this one comes in
    chatScreen(ctx, SCREEN, 1);
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      chatBubble(ctx, old.B[0], { alpha: 1 });
      chatBubble(ctx, old.B[1], { alpha: 1, chars: 1 });
      ctx.restore();
    }
    chatBubble(ctx, B[0], { alpha: tw(t, askAt, 0.35) });
    chatBubble(ctx, B[1], { alpha: tw(t, r3.tok[0] + TOK, 0.2), chars: landedAns(t - 0.12) });
    screenLinks(ctx, T, { talk: 1, back: 1, talkHot: span(t, askAt + 0.05, askAt + 0.8) > 0.5, backHot: span(t, r3.tok[0] + TOK, r3.fin + 0.2) > 0.5 });

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, L, 1, { name: '' });
    llmBlock(ctx, L, 1, { glow: llmGlow });
    const [llmLit] = lit(['llm'], at('words2'));
    ring(ctx, L.llm.x, L.llm.y, L.llm.w, L.llm.h, llmLit, C.accent, 22);
    channel(ctx, L.read, 1);
    channel(ctx, L.write, 1, { hot: llmGlow > 0.5 && writing });
    channel(ctx, L.call, 1, { hot: span(t, goB + 0.3, inB) > 0.5 || [r1, r2].some((r) => span(t, r.go, r.work) > 0.5) });
    channel(ctx, L.back, 1, { hot: [r1, r2].some((r) => span(t, r.back, r.back + BACK * 0.6) > 0.5) });

    // ——— the document. 6-1's conversation leaves; this one is written in.
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      drawOldDoc(ctx, old);
      ctx.restore();
    }
    // d: the head, under the app's system mark
    if (t >= sysAt + FLY) roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
    defs.forEach((d, k) => drawDef(ctx, d, defY(k), defIn[k]));
    // a: the question (it moves down when the head is written)
    const dq = -shift * (1 - down);
    if (t >= userAt + FLY) {
      ctx.save();
      ctx.translate(0, dq);
      docEntry(ctx, Qe, 1, { tagAlpha: 0, chars: tw(t, userAt + FLY - 0.05, 0.3) });
      roleMark(ctx, Qe.x, Qe.y + 1, ROLE.user, { edge: WRITER.user });
      ctx.restore();
    }
    // e, f: the assistant's mark, the call, what the search found
    const calls = [[call1, r1, c1n, R1], [call2, r2, c2n, R2]];
    calls.forEach(([c, r, n, R]) => {
      if (t >= r.mark + FLY) roleMark(ctx, DOC.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
      drawCall(ctx, c, { bandA: tw(t, r.open + EOT - 0.1, 0.25), open: t >= r.open + EOT, n, end: t >= r.fin + EOT });
      if (t >= r.resMark + FLY) roleMark(ctx, R.x, R.y + 1, ROLE.search, { edge: BY.app });
      const ri = tw(t, r.resIn - 0.05, 0.3);
      if (ri > 0) docEntry(ctx, R, ri, { tagAlpha: 0, chars: seg(t, r.resIn, r.resIn + 0.5) });
    });
    // g: the assistant's mark, the answer, its end
    if (t >= r3.mark + FLY) roleMark(ctx, A.x, A.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    const ca = landedAns(t);
    if (ca > 0) docEntry(ctx, A, 1, { tagAlpha: 0, chars: ca });
    if (t >= r3.endIn) roleMark(ctx, aEnd.x, aEnd.y, ROLE.end, { edge: WRITER.end });
    // a cursor after the assistant's mark, while the LLM reads, until it writes
    const cur = [[r1, call1.open], [r2, call2.open]].find(([r]) => t >= r.read && t < r.open + EOT);
    const cursor = cur ? { x: cur[1].x, y: cur[1].y + MARK_H - 2 } : t >= r3.read && t < r3.tok[0] + TOK ? (() => { const p = rowAt(A, 0); return { x: p.x, y: p.y + 6 }; })() : null;
    if (cursor && Math.floor(t * 2.5) % 2 === 0) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(cursor.x, cursor.y - 30, 4, 30);
    }
    // f: what is missing in the first result
    tag(ctx, lackTag.x, lackTag.y, '改定の話はない', { font: F.jp(700, 13), h: 24, padX: 8, fill: '#fff', stroke: C.red, color: C.red, align: 'right', alpha: pop('lack') });
    // rings on the document
    // the search words, once the LLM has written them
    const wordsLit = (r, until) => {
      const landed = r.tok[r.tok.length - 2] + TOK;
      return span(t, landed, Math.max(until - 0.25, landed + 0.8));
    };
    ringBox(ctx, words1, wordsLit(r1, at('e.end')), C.accent);
    ringBox(ctx, words2, wordsLit(r2, at('f.end')), C.accent);
    const [readLit] = lit(['read'], at('lack'));
    const [foundLit, twoLit] = lit(['found', 'two'], at('ans'));
    const box = (E) => ({ x: E.tx, y: E.y, w: E.w, h: E.h });
    ringBox(ctx, box(R1), Math.max(readLit, twoLit), C.accent);
    ringBox(ctx, box(R2), Math.max(foundLit, twoLit), C.accent);
    const [alwaysLit] = lit(['always'], at('h.end'));
    ringBox(ctx, defBox, alwaysLit, C.accent);

    // the reads: the app hands the document over
    [[r1, call1.band.y], [r2, call2.band.y], [r3, A.y]].forEach(([r, y]) => {
      sweep(ctx, L, seg(t, r.read + 0.05, r.read + READ), y + MARK_H);
      send(ctx, L.read, seg(t, r.read + 0.4, r.read + READ + 0.05), '', 'doc');
    });

    // ——— the app's box; it sees where each call ends, and stops the writing
    actor(ctx, ACT, 1, actGlow);
    ring(ctx, ACT.x, ACT.y, ACT.w, ACT.h, makerLit, C.accent, 18);
    [[r1, call1], [r2, call2]].forEach(([r, c]) => {
      const lk = span(t, r.stop - 0.05, r.go + 0.25);
      if (lk > 0) lookLine(ctx, c.end, tw(t, r.stop - 0.05, 0.3, inOutCubic), lk);
    });
    halt(ctx, Math.max(...[r1, r2].map((r) => span(t, r.fin + EOT - 0.05, r.go + 0.5))));

    // ——— the tool's place: the search. 6-1's search clears; b runs it again with this question; from e on,
    // it runs with the words the LLM writes
    const [ruleLit] = lit(['rule'], at('miss'));
    const [seeLit] = lit(['see'], at('redo'));
    const [searchLit, toolLit] = lit(['search', 'tool'], at('d.end'));
    const [found4Lit] = lit(['found'], at('two'));
    const move = inOutCubic(seg(t, r2.work + 0.2, r2.work + 0.75));
    toolBox(ctx, L, 1, {
      solid: 1,
      draw: (c) => {
        if (t <= 0) {
          searchPanel(c, S, lab, FINAL61);
          return;
        }
        const r = searchPanel(c, S, lab, { a: 1, docs: () => 1, title: 1, kinds: 0, query: { a: 0 }, found: [], model: 1, caption: 1, vec: 1, near: [], miss: 0 });
        // 6-1's search, clearing away
        if (gone > 0.001) {
          ctx.save();
          ctx.globalAlpha *= gone;
          lines(c, S.q, [1, 2, 3], [1, 1, 1]);
          greens(c, lab, [1, 2, 3], [1, 1, 1]);
          missMark(c, lab, 1);
          qDot(c, S.q, 1, '質問', lab.q);
          missNote(c, 1);
          queryRow(c, { s: Q61, a: 1, chars: 1, dot: 1 });
          ctx.restore();
        }
        // b: the question's words, as they are
        const nb = [0, 1, 2].map((k) => seg(t, foundB + k * 0.15, foundB + k * 0.15 + 0.4));
        const fb = [0, 1, 2].map((k) => tw(t, foundB + 0.2 + k * 0.15, pace.enter));
        const qbA = tw(t, inB + 0.25, 0.3);
        const mb = tw(t, missB, pace.enter);
        if (reset > 0.001) {
          ctx.save();
          ctx.globalAlpha *= reset;
          lines(c, S.q, [1, 2, 3], nb);
          greens(c, lab, [1, 2, 3], fb);
          missMark(c, lab, mb);
          qDot(c, S.q, qbA, '質問', lab.q);
          missNote(c, mb);
          queryRow(c, { rows: Q_ROWS, a: tw(t, inB - 0.05, 0.3), chars: seg(t, inB, inB + 0.5), dot: qbA });
          ctx.restore();
        }
        // e, f: the LLM's words. The first land by [1]; the second somewhere else, by [4]
        const l1 = seg(t, r1.work + 0.4, r1.work + 0.7);
        const l2 = seg(t, r2.work + 0.8, r2.work + 1.05);
        const d1 = tw(t, r1.work + 0.2, 0.3);
        ctx.save();
        ctx.globalAlpha *= lerp(1, 0.45, move);
        lines(c, q1, [1], [l1]);
        ctx.restore();
        lines(c, q2, [4], [l2]);
        greens(c, lab, [1, 4], [tw(t, r1.work + 0.6, pace.enter), tw(t, r2.work + 0.95, pace.enter)]);
        if (move > 0.001) hollow(c, q1, move, '1 回め', qLab[0]);
        const qm = { x: lerp(q1.x, q2.x, move), y: lerp(q1.y, q2.y, move) };
        qDot(c, qm, d1, move < 0.5 ? '1 回め' : '2 回め', move < 0.5 ? qLab[0] : qLab[1], move < 0.5 ? 1 - move * 2 : move * 2 - 1);
        queryRow(c, { s: W1, a: tw(t, r1.work - 0.05, 0.3) * (1 - tw(t, r2.work - 0.2, 0.2)), chars: seg(t, r1.work, r1.work + 0.35), dot: d1 });
        queryRow(c, { s: W2, a: tw(t, r2.work - 0.05, 0.3), chars: seg(t, r2.work, r2.work + 0.45), dot: 1 });
        text(c, ONE, S.miss.x, S.miss.y + 24, { font: F.jp(500, 13), color: C.muted, alpha: tw(t, r1.work + 0.8, pace.enter) });
        // the search's name, once it is a tool (d)
        const titleW = measure(c, F.jp(700, 21), '社内の資料の検索');
        tag(c, S.title.x + titleW + 10, S.title.y - 20, DEF_NAME, { font: F.mono(600, 13), h: 24, padX: 8, fill: C.ink, color: C.paper, r: 6, alpha: nameTag });
        // rings
        ringBox(c, r.dot[1], ruleLit, C.accent, 4);
        ringBox(c, [r.dot[1], r.dot[2], r.dot[3]], seeLit, C.accent, 6);
        ringBox(c, [r.title, r.map], searchLit, C.accent, 6);
        ringBox(c, r.dot[4], found4Lit, C.accent, 4);
      },
    });
    working(ctx, L, Math.max(seg(t, inB, foundB + 0.3), ...[r1, r2].map((r, k) => seg(t, r.work, r.work + WORK[k] - 0.1))));
    const lw = text(ctx, 'ツール', TOOL.x, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    text(ctx, 'の場所', TOOL.x + lw, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    // d: the search was the app's own (6-1); now it is a tool the LLM asks for
    const w0 = measure(ctx, F.jp(700, 22), 'の場所');
    const nx = TOOL.x + lw + w0 + 14;
    text(ctx, 'アプリが直接使う', nx, TOOL.y - 17, { font: F.jp(500, 15), color: C.muted, alpha: 1 - swap });
    const nw = text(ctx, 'LLM が呼び出すツール', nx, TOOL.y - 17, { font: F.jp(700, 15), color: C.ink, alpha: swap });
    ringBox(ctx, { x: nx, y: TOOL.y - 33, w: nw, h: 21 }, Math.max(toolLit, alwaysLit), C.accent);
    // 6-1's note on other ways to search, clearing away
    if (gone > 0.001) {
      text(ctx, 'ほかに、キーワードの一致で探す方法や、', TOOL.x, TOOL.y + TOOL.h + 28, { font: F.jp(500, 14), color: C.muted, alpha: gone });
      text(ctx, '両方を組み合わせる方法もある', TOOL.x, TOOL.y + TOOL.h + 48, { font: F.jp(500, 14), color: C.muted, alpha: gone });
    }

    // ——— above the LLM: 6-1's card of the app's work (pointed at in c, gone with d), then the forms (i–k)
    const [appLit, onceLit] = lit(['app', 'once'], at('see'));
    const ghost = tw(t, at('redo') - lead, pace.enter);
    steps(ctx, { card: cardOut, lit: [onceLit, 0, 0], once: 1, ghost, h: lerp(CARD.h, CARD.h + 34, inOutCubic(seg(t, at('redo') - lead - 0.2, at('redo') - lead + 0.2))) });
    ring(ctx, CARD.x, CARD.y, CARD.w, lerp(CARD.h, CARD.h + 34, ghost), appLit * cardOut, C.accent, 14);
    // 6-1's notes on the LLM, its name, and the paper, clearing away
    if (gone > 0.001) {
      tag(ctx, L.llm.x + L.llm.w / 2, L.llm.y - 50, '読み違えることもある', { font: F.jp(700, 16), h: 30, padX: 10, fill: '#fff', stroke: C.red, color: C.red, align: 'center', alpha: gone });
      nameBlock(ctx, { name: gone, rag: gone, paper: gone });
      source(ctx, SOURCE61, gone, SOURCE_RIGHT);
    }
    drawForms(ctx, t, { at, pop, lit, pace, forms });
    // l: the Web search tools of 2025, under the LLM, apart from the company's search
    drawWeb(ctx, { card: pop('web'), year: pop('y25'), rows: [pop('api'), tw(t, at('api') - lead + 0.3, pace.enter)] });
    source(ctx, 'OpenAI（2025-03-11）、Anthropic（2025-05-07）の発表', pop('api'), SOURCE_RIGHT);

    // ——— in flight, over everything
    // a: the question's mark (to where the question stands before the head is written)
    flyMark(ctx, T, Qe, seg(t, userAt, userAt + FLY), ROLE.user, { edge: WRITER.user, dy: -shift });
    // d: the system mark, to the head
    flyMark(ctx, T, SYS, seg(t, sysAt, sysAt + FLY), ROLE.system, { edge: WRITER.system });
    // each round: the assistant's mark out of the app's box
    [[r1, { x: DOC.x + 18, y: call1.band.y }], [r2, { x: DOC.x + 18, y: call2.band.y }], [r3, A]].forEach(([r, E]) => {
      flyMark(ctx, T, E, seg(t, r.mark, r.mark + FLY), ROLE.assistant, { edge: WRITER.assistant });
    });
    // the calls: the LLM's call mark, tokens and end mark, along the write channel and in under the band;
    // then the words to the search, what it found back into its place, and the search's mark
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
      const band = { tx: c.band.x, w: c.band.w, y: c.band.y, h: c.band.h };
      chipFlight(ctx, seg(t, r.go, r.go + GO), toTool(T, band), k ? W2 : W1, 'call');
      const bp = seg(t, r.back, r.back + BACK);
      chipFlight(ctx, bp < 1 ? bp : 0.999, fromTool(T, R, 0, R.tx + 130), '見つかった文章 1 件', 'found', bp < 1 ? null : 1 - tw(t, r.resIn - 0.05, 0.25));
      flyMark(ctx, T, R, seg(t, r.resMark, r.resMark + FLY), ROLE.search, { edge: BY.app });
    });
    // g: the answer's tokens and its end mark
    ansToks.forEach((tk, k) => {
      const p = seg(t, r3.tok[k], r3.tok[k] + TOK);
      if (p <= 0 || p >= 1) return;
      const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
      const pt = onPath(writePath(T, A, tk.x + w / 2, tk.y), inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
    });
    const pe3 = seg(t, r3.fin, r3.endIn);
    if (pe3 > 0 && pe3 < 1) {
      const pt = onPath(writePath(T, A, aEnd.x + aEnd.w / 2, aEnd.y + MARK_H / 2), inOutCubic(pe3));
      roleMark(ctx, pt.x - aEnd.w / 2, pt.y - MARK_H / 2, ROLE.end, { edge: WRITER.end, alpha: clamp(pe3 * 8) });
    }
    // b: the app sends the question's words, as they are, from its box to the search (6-1's way)
    questionFlight(ctx, seg(t, goB, goB + GO_B));

    // ——— the example's note (6-1's gives way)
    const ex = { x: L.app.x, y: L.app.y + L.app.h + 22 };
    const exW = measure(ctx, F.jp(700, 17), '例') + 20;
    example(ctx, ex.x, ex.y, 1, '');
    text(ctx, NOTE61, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: gone });
    text(ctx, NOTE, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: fresh });
  },
});

// ——— this clip's pieces ————————————————————————————————————————————————

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

// One row of the head, typed in by p (0–1).
function drawDef(ctx, d, y, p) {
  if (p <= 0) return;
  let left = Math.round(d.n * clamp(p));
  d.segs.forEach((sg) => {
    if (left <= 0) return;
    const s = Array.from(sg.s).slice(0, left).join('');
    left -= sg.n;
    text(ctx, s, sg.x, y, { font: sg.font, color: C.ink });
  });
}

// The app sees where the call ends — purple dashes from its box down the document's right margin.
function lookLine(ctx, m, p, a) {
  const x = DOC.x + DOC.w - 8;
  const y0 = ACT.y + ACT.h + 4;
  const y = m.y + MARK_H / 2;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 6]);
  path(ctx, [[x, y0], [x, y], [m.x + m.w + 9, y]], p);
  ctx.setLineDash([]);
  ctx.restore();
}

// The app stops the writing — the purple tag on the write channel, as in 4-2 and chapter 5.
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

// A chip on its way along a polyline (eased overall). kind 'call': the LLM's search words, which the app
// passes on (vermilion, as chapter 5's input); 'found': what the search found. The chip slides into the
// tool's place and out of it under its edge (a: what is left of a chip that has arrived and waits).
function chipFlight(ctx, p, pts, s, kind, a = null) {
  if (p <= 0 || p >= 1 || a === 0) return;
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, TOOL.x, 900);
  ctx.clip();
  ctx.globalAlpha = clamp(p * 8) * (a ?? clamp((1 - p) * 8));
  tag(ctx, pt.x, pt.y - 15, s, { font: F.jp(700, 16), h: 30, padX: 10, fill: kind === 'call' ? C.accent : C.green, color: '#fff', align: 'center', r: 8 });
  ctx.restore();
}

// b: the question's words, as the app sends them (white, in the app's purple, as in 6-1), on two lines.
function questionFlight(ctx, p) {
  if (p <= 0 || p >= 1) return;
  const y0 = ACT.y + ACT.h - 20;
  const pts = [[ACT.x + ACT.w - 40, y0], [T.lane, y0], [T.lane, L.call.y], [L.call.x2, L.call.y], [TOOL.x + 10, L.call.y]];
  const pt = onPath(pts, inOutCubic(p));
  const font = F.jp(700, 14);
  const w = Math.max(...Q_CHIP.map((s) => measure(ctx, font, s))) + 22;
  const h = 48;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, TOOL.x, 900);
  ctx.clip();
  ctx.globalAlpha = clamp(p * 8) * clamp((1 - p) * 8);
  rr(ctx, pt.x - w / 2, pt.y - h / 2, w, h, 8);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  Q_CHIP.forEach((s, i) => text(ctx, s, pt.x - w / 2 + 11, pt.y - 4 + i * 18, { font, color: C.purple }));
  ctx.restore();
}

// ——— the search's moving parts, over a panel drawn without them (lib/docsearch.js draws the rest) ————
const IDX = (n) => PASSAGES.findIndex((p) => p.n === n);
const LABEL = F.jp(700, 13);
const QDOT = 7;

// The words the search runs with: the tag, the vector's dot, the words (o.rows: two small lines).
function queryRow(ctx, o) {
  const a = o.a ?? 0;
  if (a <= 0.001) return null;
  const w = tag(ctx, S.query.x, S.query.y, '検索キーワード', { font: F.jp(700, 13), h: 26, padX: 9, fill: '#fff', stroke: C.purple, color: C.purple, alpha: a });
  const dx = S.query.x + w + 10;
  const cy = S.query.y + 13;
  const dot = o.dot ?? 0;
  if (dot > 0.001) {
    ctx.save();
    ctx.globalAlpha *= a * dot;
    ctx.fillStyle = C.accent;
    circle(ctx, dx + 6, cy, 6);
    ctx.fill();
    ctx.restore();
  }
  const tx = dx + 18;
  if (o.rows) {
    const total = o.rows.reduce((n, r) => n + Array.from(r).length, 0);
    let left = Math.round(total * clamp(o.chars ?? 1));
    o.rows.forEach((r, i) => {
      if (left <= 0) return;
      const chars = Array.from(r);
      text(ctx, chars.slice(0, left).join(''), tx, cy - 3 + i * 16, { font: F.jp(500, 14), color: C.ink, alpha: a });
      left -= chars.length;
    });
    return { x: S.query.x, y: S.query.y - 2, w: tx + Math.max(...o.rows.map((r) => measure(ctx, F.jp(500, 14), r))) - S.query.x, h: 32 };
  }
  const chars = Array.from(o.s);
  text(ctx, chars.slice(0, Math.round(chars.length * clamp(o.chars ?? 1))).join(''), tx, cy + 6, { font: F.jp(500, 17), color: C.ink, alpha: a });
  return { x: S.query.x, y: S.query.y, w: tx + measure(ctx, F.jp(500, 17), o.s) - S.query.x, h: 26 };
}

// Green lines from the words' dot q to passages ns, each drawn up to p.
function lines(ctx, q, ns, ps) {
  ns.forEach((n, k) => {
    const p = ps[k] ?? 0;
    if (p <= 0.001) return;
    const d = S.pos[IDX(n)];
    ctx.save();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    line(ctx, q.x, q.y, d.x, d.y, p);
    ctx.restore();
  });
}

// The passages found: green dots with their numbers.
function greens(ctx, lab, ns, as) {
  ns.forEach((n, k) => {
    const a = as[k] ?? 0;
    if (a <= 0.001) return;
    const d = S.pos[IDX(n)];
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = C.green;
    circle(ctx, d.x, d.y, 5.5);
    ctx.fill();
    ctx.restore();
    text(ctx, `［${n}］`, lab[n].x, lab[n].y + 5, { font: LABEL, color: C.green, align: 'center', alpha: a });
  });
}

// The words' dot on the map, with its label (at the centre l).
function qDot(ctx, q, a, s, l, la = 1) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = C.accent;
  circle(ctx, q.x, q.y, QDOT * Math.min(1.15, 0.6 + a * 0.5));
  ctx.fill();
  ctx.restore();
  text(ctx, s, l.x, l.y + 5, { font: LABEL, color: C.accent, align: 'center', alpha: a * la });
}

// Where the first words landed, once the second have moved on.
function hollow(ctx, q, a, s, l) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  circle(ctx, q.x, q.y, QDOT - 1);
  ctx.stroke();
  ctx.restore();
  text(ctx, s, l.x, l.y + 5, { font: LABEL, color: C.accent, align: 'center', alpha: a * 0.8 });
}

// The passage the search missed ([4]): its ring and number, as 6-1 draws them.
function missMark(ctx, lab, a) {
  if (a <= 0.001) return;
  const d = S.pos[IDX(4)];
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2.5;
  circle(ctx, d.x, d.y, 11 + (1 - a) * 6);
  ctx.stroke();
  ctx.restore();
  text(ctx, '［4］', lab[4].x, lab[4].y + 5, { font: LABEL, color: C.red, align: 'center', alpha: a });
}

// …and its note under the map.
function missNote(ctx, a) {
  if (a <= 0.001) return;
  const M = S.miss;
  const dy = (1 - a) * 6;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, M.x, M.y + dy, M.w, M.h, 8);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, MISSED[0], M.x + 12, M.y + 22 + dy, { font: F.jp(700, 14), color: C.ink, alpha: a });
  text(ctx, MISSED[1], M.x + 12, M.y + 45 + dy, { font: F.jp(500, 14), color: C.ink2, alpha: a });
  tag(ctx, M.x + M.w - 8, M.y + 7 + dy, '見つからなかった', { font: F.jp(700, 12), h: 22, padX: 7, fill: C.red, color: '#fff', align: 'right', r: 6, alpha: a });
}

// ——— 6-1's card of the app's work, and what it cannot do (c) ————————————————————————

function steps(ctx, { card, lit, once, ghost = 0, h = CARD.h }) {
  if (card <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = card;
  rr(ctx, CARD.x, CARD.y, CARD.w, h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'アプリの動き（この例）', CARD.x + 16, CARD.y + 30, { font: F.jp(700, 17), color: C.purple, alpha: card });
  STEPS.forEach((s, k) => {
    const a = card;
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
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = C.purple;
    circle(ctx, CARD.x + 30, y - 6, 11);
    ctx.fill();
    ctx.restore();
    text(ctx, String(k + 1), CARD.x + 30, y - 5, { font: F.sans(700, 14), color: '#fff', align: 'center', base: 'middle', alpha: a });
    const w = text(ctx, s, CARD.x + 50, y, { font: F.jp(500, 15), color: C.ink, alpha: a });
    if (k === 0) tag(ctx, CARD.x + 50 + w + 10, y - 19, '1 回だけ', { font: F.jp(700, 13), h: 24, padX: 8, fill: C.purple, color: '#fff', r: 6, alpha: a * once });
  });
  // c: the step this design does not have — look at the result and search again
  if (ghost > 0.001) {
    const a = card * ghost;
    const y = STEP_Y(3) + (1 - ghost) * 6;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    circle(ctx, CARD.x + 30, y - 6, 10);
    ctx.stroke();
    line(ctx, CARD.x + 25, y - 11, CARD.x + 35, y - 1);
    line(ctx, CARD.x + 35, y - 11, CARD.x + 25, y - 1);
    ctx.restore();
    const w = text(ctx, '結果を見て、調べ直す', CARD.x + 50, y, { font: F.jp(500, 15), color: C.muted, alpha: a });
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    line(ctx, CARD.x + 48, y - 5, CARD.x + 52 + w, y - 5);
    ctx.restore();
    tag(ctx, CARD.x + 50 + w + 10, y - 19, 'この作りにはない', { font: F.jp(700, 13), h: 24, padX: 8, fill: '#fff', stroke: C.red, color: C.red, r: 6, alpha: a });
  }
}

// 6-1's name and paper, under the LLM.
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

// 6-1's document: the question, what the search found, the answer with its end, and the note on [1].
function drawOldDoc(ctx, o) {
  docEntry(ctx, o.Qd, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.Qd.x, o.Qd.y + 1, ROLE.user, { edge: WRITER.user });
  roleMark(ctx, o.Sd.x, o.Sd.y + 1, ROLE.search, { edge: BY.app });
  docEntry(ctx, o.Sd, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.Ad.x, o.Ad.y + 1, ROLE.assistant, { edge: WRITER.assistant });
  docEntry(ctx, o.Ad, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.end.x, o.end.y, ROLE.end, { edge: WRITER.end });
  tag(ctx, o.oldTag.x, o.oldTag.y, '古い規程', { font: F.jp(700, 14), h: 26, padX: 9, fill: '#fff', stroke: C.red, color: C.red, alpha: 1 });
}

// ——— i–k: the order of the exchanges in each form, as chips ————————————————————————

function linkChip(ctx, c, a) {
  if (a <= 0.001) return;
  const llm = c.s === 'LLM';
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, c.x, c.y, c.w, LINK.h, 7);
  ctx.fillStyle = llm ? C.ink : '#fff';
  ctx.fill();
  if (!llm) {
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, c.s, c.x + c.w / 2, c.y + LINK.h / 2 + 1, { font: LINK.font, color: llm ? '#fff' : C.ink, align: 'center', base: 'middle', alpha: a });
}

function linkArrow(ctx, a, b, p) {
  if (p <= 0.001) return;
  const y = b.y + LINK.h / 2;
  const x1 = a.x + a.w + 4;
  const x2 = b.x - 4;
  ctx.save();
  ctx.globalAlpha *= clamp(p);
  ctx.strokeStyle = ctx.fillStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 5, y);
  ctx.stroke();
  arrowHead(ctx, x2, y, 0, 7);
  ctx.restore();
}

// The order of the exchanges in each form (i–k), as chips: the search and the LLM, left to right.
function drawForms(ctx, t, { at, pop, lit, pace, forms }) {
  const cue = pace.cue;
  const card = tw(t, at('i'), pace.enter);
  if (card <= 0.001) return;
  const rowA = [card, card, pop('mix')];
  const H = lerp(FORMS_H(2), FORMS_H(3), tw(t, at('mix') - cue.lead - 0.2, 0.4, inOutCubic));
  ctx.save();
  ctx.globalAlpha = card;
  rr(ctx, FORMS.x, FORMS.y, FORMS.w, H, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'やりとりの順（この例）', FORMS.x + 16, FORMS.y + 30, { font: F.jp(700, 16), color: C.ink2, alpha: card });
  const [moreLit] = lit(['more'], at('time'));
  const [preLit, pickLit] = lit(['pre', 'pick'], at('j.end'));
  const [mixLit] = lit(['mix'], at('maker'));
  const [broadLit] = lit(['broad'], at('rag'));
  const rowLit = [preLit, Math.max(moreLit, pickLit, broadLit), mixLit];
  const time = tw(t, at('time') - cue.lead, 0.6, inOutCubic);
  const cost = pop('cost');
  FROWS.forEach((row, k) => {
    const a = rowA[k];
    if (a <= 0.001) return;
    const f = forms[k];
    const y = FROW_Y(k);
    const dy = k === 2 ? (1 - a) * 8 : 0;
    const lw = text(ctx, row.label, FORMS.x + 16, y + 15 + dy, { font: F.jp(700, 15), color: C.ink, alpha: a });
    // k: this form too is called RAG, in the broad sense
    if (k === 1) tag(ctx, FORMS.x + 16 + lw + 10, y - 3, '広い意味で RAG', { font: F.jp(700, 13), h: 24, padX: 8, fill: '#fff', stroke: C.accent, color: C.accent, r: 6, alpha: pop('rag') });
    ctx.save();
    ctx.translate(0, dy);
    // the part the LLM asks for only when what was found is not enough
    if (f.opt) {
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      rr(ctx, f.opt.x, y - 4, f.opt.x1 - f.opt.x, f.chips[0].y + LINK.h + 6 - (y - 4), 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      text(ctx, row.note, f.opt.x + 8, y + 13, { font: F.jp(500, 13), color: C.muted, alpha: a });
    }
    f.chips.forEach((c, i) => {
      if (i > 0) linkArrow(ctx, f.chips[i - 1], c, a);
      linkChip(ctx, c, a);
    });
    ctx.restore();
    ringBox(ctx, { x: FORMS.x + 10, y: y - (f.opt ? 5 : 1) + dy, w: Math.max(f.opt ? f.opt.x1 : f.x1, FORMS.x + 16 + lw) - FORMS.x - 6, h: f.opt ? 63 : 58 }, rowLit[k], C.accent, 2);
    // i: how long the exchanges take, and what they cost (no seconds, no yen)
    if (k < 2 && time > 0.001) {
      const by = y + 62;
      ctx.save();
      ctx.globalAlpha = card;
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      path(ctx, [[f.x0, by - 6], [f.x0, by], [f.x1, by], [f.x1, by - 6]], time);
      ctx.restore();
      const cx = (f.x0 + f.x1) / 2;
      const font = F.jp(500, 13);
      const w1 = measure(ctx, font, '時間');
      const w2 = measure(ctx, font, '・費用');
      const x0 = cx - (w1 + w2 * cost) / 2;
      text(ctx, '時間', x0, by + 17, { font, color: C.ink2, alpha: clamp(time * 2 - 1) });
      text(ctx, '・費用', x0 + w1, by + 17, { font, color: C.ink2, alpha: cost });
    }
  });
}

// ——— l: the Web search tools of 2025 ———————————————————————————————————————————

function drawWeb(ctx, { card, year, rows }) {
  if (card <= 0.001) return;
  const { x, y, w, h } = WEB;
  const dy = (1 - card) * 8;
  ctx.save();
  ctx.globalAlpha = card;
  ctx.translate(0, dy);
  rr(ctx, x, y, w, h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  // a globe
  const gx = x + 28;
  const gy = y + 28;
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.8;
  circle(ctx, gx, gy, 11);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(gx, gy, 4.5, 11, 0, 0, Math.PI * 2);
  ctx.stroke();
  line(ctx, gx - 11, gy, gx + 11, gy);
  ctx.restore();
  text(ctx, 'Web を検索するツール', x + 48, y + 34 + dy, { font: F.jp(700, 17), color: C.ink, alpha: card });
  text(ctx, '公開された Web を調べる（社内の資料の検索とは別）', x + 16, y + 62 + dy, { font: F.jp(500, 12), color: C.muted, alpha: card });
  text(ctx, '2025', x + 16, y + 126 + dy, { font: F.cond(700, 40), color: C.ink, alpha: card * year });
  [['OpenAI', '3 月', 'Responses API で、プレビュー'], ['Anthropic', '5 月', 'Messages API で、提供を開始']].forEach(([who, month, what], k) => {
    const a = card * (rows[k] ?? 0);
    if (a <= 0.001) return;
    const ry = y + 96 + k * 48 + dy + (1 - (rows[k] ?? 0)) * 6;
    const ww = text(ctx, who, x + 108, ry, { font: F.jp(700, 15), color: C.ink, alpha: a });
    text(ctx, month, x + 108 + ww + 10, ry, { font: F.jp(700, 15), color: C.ink2, alpha: a });
    text(ctx, what, x + 108, ry + 21, { font: F.jp(500, 13), color: C.ink2, alpha: a });
  });
}
