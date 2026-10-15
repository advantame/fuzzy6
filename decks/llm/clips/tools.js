// 5-1: using a tool. Told from the designer's side (Boss, 2026-10-15), like 4-2 and 4-5: we are
// building a chatbot and are asked about tomorrow's weather in Kyoto. The LLM has only what it
// learned, and tomorrow's weather is not in it; left as it is, it writes a plausible guess (shown
// on the screen, then taken back). A program that returns the forecast exists, but the LLM can
// only write text, not run programs; so we hand the running to the app. The LLM writes a request
// in place of an answer, the app reads it, runs the program, writes the forecast into the
// document and has the LLM read it again, and the LLM answers from it. The program the app runs
// at the LLM's request is a tool; writing the request is a tool call. Anything that takes an input
// and returns a result can stand in the tool's place. The last sentence numbers the parts the
// chapter's other clips take (5-2 … 5-5), as 3-1 does.
//
// The layout is the chapter's (lib/rig.js toolUseLayout): the LLM, the app's frame with its box
// and the document, the chat screen at the top right, the tool's place at the bottom right. Who
// writes what is drawn as in 4-2: the app's marks fly out of its box with a purple edge, the LLM's
// tokens come along the write channel in its ink. The request is a plain sentence on the call's
// vermilion band (5-3 gives it its real form); the forecast sits on the result's green band.
// The question, the forecast and the answer are an example.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example } from '../lib/parts.js';
import {
  toolUseLayout, chatScreen, screenBubbles, chatBubble, screenLinks, toTool, fromTool, writePath, flyMark, edgeKey, loopIcon,
  llmBlock, appFrame, toolBox, channel, actor, token, TOKEN, tokenPlaces, onPath, docLayout, docEntry, rowAt, sweep, send, flow, working,
  roleMark, markWidth, MARK_H, ROLE, BY, WRITER,
} from '../lib/rig.js';
import { text, measure, rr, path, line } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

const T = toolUseLayout();
const { L, ACT, SCREEN, NOTE, SIDE, LOOP } = T;
const TOOL = L.tool;

const Q = 'あしたの京都の天気は？';
// what the LLM writes, one token at a time (as o200k_base cuts it)
// the guess differs from the forecast the tool returns: it has nothing behind it, right or wrong
const GUESS = ['あ', 'した', 'の', '京都', 'は', '、', 'く', 'も', 'り', 'で', '、', '最高', '気', '温', 'は', '20', '℃', 'でしょう', '。'];
// the request in plain words: what it asks for, not its real form (that is 5-3's)
const REQ = ['あ', 'した', 'の', '京都', 'の', '天', '気', '予', '報', 'を', '調', 'べ', 'たい'];
const REQ_NOTE = '頼みの中身を、ふつうの言葉で表したもの（実際の形は 5-3）';
const ANS = ['あ', 'した', 'の', '京都', 'は', '晴', 'れ', 'で', '、', '最高', '気', '温', 'は', '24', '℃', 'の', '予', '報', 'です', '。'];
const RESULT = '京都　あした：晴れ　最高 24℃';
// the tool's place, at the end: four kinds of tool, two by two
const KINDS = [['天気予報', '都市と日 → 予報'], ['検索', '言葉 → 文章'], ['計算機', '式 → 答え'], ['シェル', 'コマンド → 出力']];
const CARD = { x: TOOL.x + 20, y: TOOL.y + 20, w: (TOOL.w - 54) / 2, h: (TOOL.h - 54) / 2, gap: 14 };
const cardBox = (i) => ({ x: CARD.x + (i % 2) * (CARD.w + CARD.gap), y: CARD.y + Math.floor(i / 2) * (CARD.h + CARD.gap), w: CARD.w, h: CARD.h });
// the room the last sentence makes at the head of the document, for the tool definitions (5-2)
const HEAD = 64;
// what the LLM knew, above it (sentence b)
const KNEW = { x: L.llm.x, y: 176, w: L.llm.w + 100, h: 152 };

const FLY = 0.55; // a mark flying out of the app's box
const TOK = 0.42; // a token along the write channel and into its place
const EOT = 0.75; // the end mark, the same way
const SEND = 0.85; // something on its way to or from the tool

const span = (t, a, b, rise = 0.25, fall = 0.35) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n token times, evenly from a, the last one landing by b
const times = (n, a, b) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - TOK - a)) / Math.max(1, n - 1));
// how much of an entry is written at time s
const upto = (list, ts) => (s) => list.reduce((u, tk, k) => (s >= ts[k] + TOK ? tk.upto : u), 0);

export default clip({
  id: 'tools',
  title: 'ツールを使う',
  kicker: 'ツールとツール呼び出し',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'チャットボットを作っていて、{ask}「あしたの京都の天気は？」と\n聞かれたとしましょう。' },
    { id: 'b', text: 'でも、{learn}学習で身に付けた知識だけでは、\n{tmr}あしたの京都の最新の予報は、確かめられないわ。' },
    { id: 'c', lead: 1.1, text: 'このまま続きを書かせると、{guess}それらしい天気を、\n{plaus}もっともらしく書いてしまうかもしれないの。' },
    { id: 'd', text: '一方で、{prog}天気の予報を返してくれるプログラムなら、\nもうあるわね。' },
    { id: 'e', still: true, text: 'でも、{only}LLM がするのは、文章の続きを書くことだけよ。\n{cant}プログラムを動かすには、別の仕組みが要るの。' },
    { id: 'f', text: 'そこで、{give}プログラムを動かす役は、アプリに任せるの。' },
    { id: 'g', lead: 1.1, text: 'LLM には、答えの代わりに、{req}「あしたの京都の天気予報を\n調べたい」という頼みを書かせるのよ。' },
    { id: 'h', text: 'アプリは、{read}その頼みを読んで{run}プログラムを動かし、\n{back}返ってきた予報を、文書に書き足すわ。' },
    { id: 'i', still: true, tail: 1.5, text: 'それを{again}もう一度 LLM に読ませれば、\n{clue}予報を手がかりにして、{ans}答えを書けるわね。' },
    { id: 'j', by: 'zunda', text: '{self}LLM が、自分で調べに行ったわけじゃないのだ？' },
    { id: 'k', text: 'ええ。{wrote}LLM は頼みを書いただけで、\n{ran}プログラムを動かしたのは、アプリよ。' },
    { id: 'l', text: 'こうして、{name}LLM から使えるようにつないだプログラムを、\n{tool}ツールと呼ぶわ。' },
    { id: 'm', still: true, text: 'こうした、{need}ツールを使うための頼みを、\n{call}ツール呼び出しと呼ぶの。' },
    { id: 'n', text: '{place}アプリから呼び出せる形につなげば、\n{any}いろいろなものを、ツールにできるの。' },
    { id: 'o', text: '天気のほかにも、{s1}検索、{s2}計算機、\n{s3}コマンドを打つシェルなどがあるわ。' },
    { id: 'p', tail: 0.8, text: 'この章では、{each}この一回のやりとりを、\n順に細かく見ていきましょう。' },
  ],

  prepare(ctx) {
    const ent = (role, s, kind = 'text') => ({ role, text: s, kind });
    const E = docLayout(ctx, L, [
      ent('user', Q), { ...ent('assistant', REQ.join(''), 'call'), gap: 54 }, ent('result', RESULT, 'data'), ent('assistant', ANS.join('')),
    ], T.DOC);
    // the guess takes the request's place, as plain text (broken at the comma, as on the screen)
    const G = docLayout(ctx, L, [ent('user', Q), ent('assistant', 'あしたの京都は、くもりで、\n最高気温は20℃でしょう。')], T.DOC)[1];
    const toks = { guess: tokenPlaces(ctx, G, GUESS), req: tokenPlaces(ctx, E[1], REQ), ans: tokenPlaces(ctx, E[3], ANS) };
    // the answer's end mark, after its last row
    const R = E[3];
    const last = rowAt(R, R.rows.length - 1);
    const end = { x: last.x + measure(ctx, R.font, R.rows[R.rows.length - 1]) + 16, y: last.y - 22, w: markWidth(ctx, ROLE.end.name) };
    // on the screen, the lines break at the comma
    const B = screenBubbles(ctx, SCREEN, [['user', Q], ['assistant', 'あしたの京都は晴れで、\n最高気温は24℃の予報です。']]);
    const guessB = screenBubbles(ctx, SCREEN, [['user', Q], ['assistant', 'あしたの京都は、くもりで、\n最高気温は20℃でしょう。']])[1];
    return { E, G, toks, end, B, guessB };
  },

  draw(ctx, t, { E, G, toks, end, B, guessB }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);
    const lit = (names, until) => focus(t, names.map(at), until - cue.fall, cue).level;

    // ——— when things happen
    // sentence a: the question comes in; the app writes it down with its mark, and the open mark
    const askAt = at('ask') - lead;
    const marks = [askAt + 0.35, askAt + 0.8];
    // sentence c: the app has the LLM read; the LLM guesses
    const read1 = at('c');
    const guessAt = times(GUESS.length, at('guess') - 0.4, at('plaus') + 1.0);
    const unguess = 1 - tw(t, at('d'), 0.45);
    // sentence g: read again; the LLM writes the request
    const read2 = at('g');
    const reqAt = times(REQ.length, at('req') - 0.1, at('req') + 2.2);
    // sentence h: the app reads the request, runs the program, writes the forecast in
    const runAt = Math.max(at('run') - lead, at('read') + 0.5);
    const workAt = runAt + SEND - 0.1;
    const backAt = Math.max(at('back') - lead, workAt + 0.7);
    const resMark = backAt + 0.25;
    const resIn = backAt + SEND - 0.05;
    // sentence i: the open mark again, the read, the answer and its end
    const open2 = at('again') - lead;
    const read3 = open2 + 0.4;
    const ansAt = times(ANS.length, Math.max(at('clue') + 0.3, read3 + 1.0), Math.max(at('ans') + 1.1, read3 + 3.0));
    const eotAt = ansAt[ansAt.length - 1] + TOK + 0.05;
    // the last sentence: room at the head, then the chapter's map
    const each = at('each') - lead;
    const hd = HEAD * inOutCubic(seg(t, each, each + 0.6));
    const mapAt = (i) => tw(t, each + 0.5 + i * pace.stagger * 3, pace.enter);

    const landedGuess = upto(toks.guess, guessAt);
    const landedReq = upto(toks.req, reqAt);
    const landedAns = upto(toks.ans, ansAt);

    // who is at work
    const ranLit = lit(['ran'], at('k.end'))[0];
    const actGlow = Math.max(
      span(t, askAt + 0.1, marks[1] + FLY),
      span(t, read1, read1 + 1.0),
      span(t, at('give') - lead, at('give') + 1.1),
      span(t, read2, read2 + 1.0),
      span(t, at('read') - lead, resIn + 0.5),
      span(t, open2, read3 + 1.0),
      span(t, ansAt[0] + TOK, eotAt + EOT),
      ranLit,
    );
    const writing = [[read1 + 0.9, guessAt[guessAt.length - 1] + TOK], [read2 + 0.9, reqAt[reqAt.length - 1] + TOK], [read3 + 0.9, eotAt + EOT]];
    const llmGlow = Math.max(...writing.map(([a, b]) => span(t, a, b)));
    const talkHot = span(t, askAt + 0.05, askAt + 0.8) > 0.5;
    const backHot = Math.max(span(t, guessAt[0] + TOK, guessAt[guessAt.length - 1] + TOK + 0.2), span(t, ansAt[0] + TOK, ansAt[ansAt.length - 1] + TOK + 0.2)) > 0.5;

    // ——— the chat screen
    const g = enter(t, at('a'), pace);
    chatScreen(ctx, SCREEN, g);
    chatBubble(ctx, B[0], { alpha: pop('ask') });
    chatBubble(ctx, guessB, { alpha: tw(t, guessAt[0] + TOK, 0.2) * unguess, chars: landedGuess(t - 0.12) });
    chatBubble(ctx, B[1], { alpha: tw(t, ansAt[0] + TOK, 0.2), chars: landedAns(t - 0.12) });
    screenLinks(ctx, T, { talk: g, back: g, talkHot, backHot });

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, L, g, { name: '' });
    llmBlock(ctx, L, g, { glow: llmGlow });
    channel(ctx, L.read, g);
    channel(ctx, L.write, g);
    // the app's own channels to the tool, once the running is handed to it (sentence f)
    const tc = tw(t, at('give') - lead + 0.3, 0.6, inOutCubic);
    // sentences l and n: what is joined to the app this way
    const joined = Math.max(lit(['name'], at('tool'))[0], lit(['place'], at('any'))[0]);
    const callHot = span(t, runAt, runAt + SEND) > 0.5 || joined > 0.5;
    const backHot2 = span(t, backAt, backAt + SEND * 0.6) > 0.5 || joined > 0.5;
    channel(ctx, L.call, tc, { hot: callHot });
    channel(ctx, L.back, tc, { hot: backHot2 });

    // ——— the document (moves down in the last sentence to make room at its head)
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.doc.x, L.doc.y, L.doc.w, L.doc.h);
    ctx.clip();
    ctx.translate(0, hd);
    docEntry(ctx, E[0], tw(t, marks[0] + FLY - 0.1, pace.enter), { tagAlpha: 0 });
    const cg = landedGuess(t);
    if (cg > 0 && unguess > 0) docEntry(ctx, G, unguess, { tagAlpha: 0, chars: cg });
    // the request: the band is the call's, the words are the LLM's
    const cr = landedReq(t);
    if (t >= reqAt[0] + TOK - 0.05) docEntry(ctx, E[1], tw(t, reqAt[0] + TOK - 0.05, 0.25), { tagAlpha: 0, chars: cr });
    // the forecast, as the app writes it in
    docEntry(ctx, E[2], tw(t, resIn, 0.3), { tagAlpha: 0, chars: seg(t, resIn, resIn + 0.35) });
    const ca = landedAns(t);
    if (ca > 0) docEntry(ctx, E[3], 1, { tagAlpha: 0, chars: ca });
    ctx.restore();

    // ——— the slot for the tool definitions (the last sentence)
    const slotA = tw(t, each + 0.35, pace.enter);
    if (slotA > 0) {
      const sy = L.doc.y + 16;
      ctx.save();
      ctx.globalAlpha = slotA;
      ctx.setLineDash([8, 6]);
      rr(ctx, L.doc.x + 14, sy, L.doc.w - 28, HEAD - 20, 10);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      text(ctx, 'ツールの定義', L.doc.x + 32, sy + (HEAD - 20) / 2 + 1, { font: F.jp(700, 18), color: C.muted, base: 'middle', alpha: slotA });
      mapTag(ctx, L.doc.x + L.doc.w - 26 - mapTagW(ctx, '5-2'), sy + (HEAD - 20) / 2 - 14, '5-2', mapAt(0));
    }

    // the marks the app has written, each edged in its colour
    const mark = (e, s0, r = ROLE[e.role], edge = BY.app, y = e.y + 1) => {
      if (t >= s0 + FLY) roleMark(ctx, e.x, y + hd, r, { edge });
    };
    mark(E[0], marks[0]);
    mark(E[1], marks[1]);
    mark(E[2], resMark);
    mark(E[3], open2);
    // the answer's end mark: the LLM's
    if (t >= eotAt + EOT) roleMark(ctx, end.x, end.y + hd, ROLE.end, { edge: WRITER.end });
    // a cursor after the open mark, while the LLM reads, until it writes
    const cursor = t >= read1 && t < guessAt[0] + TOK ? rowAt(G, 0)
      : t >= read2 && t < reqAt[0] + TOK ? rowAt(E[1], 0)
        : t >= read3 && t < ansAt[0] + TOK ? rowAt(E[3], 0) : null;
    if (cursor && Math.floor(t * 2.5) % 2 === 0) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(cursor.x, cursor.y - 24 + hd, 4, 30);
    }

    // sentence c: a plausible guess, with nothing behind it
    const plaus = tw(t, Math.max(at('plaus') - lead, guessAt[guessAt.length - 1] + TOK), pace.enter) * unguess;
    tag(ctx, G.tx, G.y + G.h + 8, '根拠のない推測', { font: F.jp(700, 16), h: 30, padX: 10, fill: '#fff', stroke: C.red, color: C.red, alpha: plaus });
    // sentence h: the app reads the request (a purple dashed look from its box)
    const look = span(t, at('read') - lead, runAt + 0.3);
    if (look > 0) {
      const x = E[1].tx + E[1].w - 20;
      ctx.save();
      ctx.globalAlpha = look;
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 6]);
      path(ctx, [[x, ACT.y + ACT.h + 4], [x, E[1].y - 6]], tw(t, at('read') - lead, 0.35, inOutCubic));
      ctx.setLineDash([]);
      ctx.restore();
    }
    // rings on the document
    const [readLit] = lit(['read'], runAt + 0.2);
    const [clue] = lit(['clue'], at('ans'));
    const [wrote] = lit(['wrote'], at('ran'));
    const band = (e, lv) => ring(ctx, e.tx - 4, e.y - 4 + hd, e.w + 8, e.h + 8, lv, C.accent, 11);
    const [need] = lit(['need'], at('call'));
    band(E[1], Math.max(readLit, wrote, need));
    band(E[2], clue);
    // under the band: what the band shows; sentence m: writing the request is a tool call
    const right = E[1].tx + E[1].w - 10;
    const noteY = E[1].y + E[1].h + 8 + hd;
    text(ctx, REQ_NOTE, E[1].tx + 2, noteY + 18, { font: F.jp(500, 14), color: C.muted, alpha: tw(t, reqAt[reqAt.length - 1] + TOK, pace.enter) });
    tag(ctx, right, E[1].y + E[1].h / 2 - 14 + hd, 'ツール呼び出し', { font: F.jp(700, 15), h: 28, padX: 9, fill: C.accent, color: '#fff', align: 'right', alpha: pop('call') });
    mapTag(ctx, E[1].tx + E[1].w - mapTagW(ctx, '5-3'), noteY, '5-3', mapAt(1));
    mapTag(ctx, E[2].tx + E[2].w - 10 - mapTagW(ctx, '5-4'), E[2].y + E[2].h / 2 - 14 + hd, '5-4', mapAt(2));

    // ——— the app's box, its loop, and what it was handed (sentence f)
    actor(ctx, ACT, g, actGlow);
    ring(ctx, ACT.x, ACT.y, ACT.w, ACT.h, ranLit, C.accent, 18);
    loopIcon(ctx, LOOP.x, LOOP.y, LOOP.r, tw(t, open2 - 0.1, 0.3), { p: tw(t, open2 - 0.1, 0.7, inOutCubic) });
    mapTag(ctx, LOOP.x - mapTagW(ctx, '5-5') / 2, LOOP.y + LOOP.r + 8, '5-5', mapAt(3), 26);

    // ——— what the LLM knew (sentence b), above it
    const knew = pop('learn') * (1 - tw(t, at('c'), 0.4));
    if (knew > 0) {
      ctx.save();
      ctx.globalAlpha = knew;
      rr(ctx, KNEW.x, KNEW.y, KNEW.w, KNEW.h, 12);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = C.rule;
      [0.82, 0.6, 0.74].forEach((w, k) => ctx.fillRect(KNEW.x + 18, KNEW.y + 56 + k * 18, (KNEW.w - 36) * w, 8));
      ctx.restore();
      text(ctx, '学習で身に付けた知識', KNEW.x + 18, KNEW.y + 34, { font: F.jp(700, 18), color: C.ink, alpha: knew });
    }
    tag(ctx, KNEW.x + 18, KNEW.y + KNEW.h - 44, 'あしたの予報：確かめられない', { font: F.jp(700, 15), h: 28, padX: 9, fill: '#fff', stroke: C.red, color: C.red, alpha: pop('tmr') * knew });

    // ——— under the LLM: what it can do, and what it cannot (sentence e)
    const [selfLit] = lit(['self'], at('j.end'));
    ring(ctx, L.llm.x, L.llm.y, L.llm.w, L.llm.h, selfLit, C.accent, 22);
    const only = pop('only');
    tag(ctx, NOTE.x, NOTE.y[0], '文章の続きを書く', { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: only });
    ring(ctx, NOTE.x - 82, NOTE.y[0], 164, 32, wrote, C.accent, 16);
    handOver(ctx, t, at, pace, lead, ranLit);

    // ——— the tool's place
    const prog = pop('prog');
    const place = tw(t, at('place') - lead, 0.6);
    const placeName = tw(t, at('any') - lead, 0.6);
    const shrink = inOutCubic(seg(t, at('any') - lead, at('any') - lead + 0.8));
    const toolLit = lit(['name'], at('tool'))[0];
    toolBox(ctx, L, prog, {
      solid: 1 - place,
      glow: Math.max(span(t, workAt, backAt + 0.1) > 0.5 ? 1 : 0, toolLit),
      draw: (c, b, a) => toolContents(c, b, a, { shrink, kinds: ['s1', 's2', 's3'].map((s) => pop(s)) }),
    });
    working(ctx, L, seg(t, workAt, backAt + 0.1));
    // the name: ツール (sentence l), then ツールの場所 (sentence n)
    const nameA = pop('tool');
    if (nameA > 0) {
      const [nameLit] = lit(['tool'], at('l.end'));
      const w = text(ctx, 'ツール', TOOL.x, TOOL.y - 16, { font: F.jp(700, 22), color: nameLit > 0.5 ? C.accent : C.ink, alpha: nameA });
      text(ctx, 'の場所', TOOL.x + w, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink, alpha: placeName });
    }

    // ——— in flight
    // the app's marks, out of its box
    flyMark(ctx, T, E[0], seg(t, marks[0], marks[0] + FLY));
    flyMark(ctx, T, E[1], seg(t, marks[1], marks[1] + FLY));
    flyMark(ctx, T, E[2], seg(t, resMark, resMark + FLY));
    flyMark(ctx, T, E[3], seg(t, open2, open2 + FLY));
    // the reads: the app hands the document over, from its head
    const readTo = (n) => E[n].y + MARK_H;
    [[read1, readTo(1)], [read2, readTo(1)], [read3, readTo(3)]].forEach(([s, bottom]) => {
      sweep(ctx, L, seg(t, s + 0.05, s + 1.0), bottom);
      send(ctx, L.read, seg(t, s + 0.45, s + 1.05), '', 'doc');
    });
    // the LLM's tokens, along the write channel and in under their row
    const write = (list, ts, e, fade = 1) => {
      list.forEach((tk, k) => {
        const p = seg(t, ts[k], ts[k] + TOK);
        if (p <= 0 || p >= 1) return;
        const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
        const pt = onPath(writePath(T, e, tk.x + w / 2, tk.y), inOutCubic(p));
        token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8) * fade);
      });
    };
    write(toks.guess, guessAt, G, unguess);
    write(toks.req, reqAt, E[1]);
    write(toks.ans, ansAt, E[3]);
    const ep = seg(t, eotAt, eotAt + EOT);
    if (ep > 0 && ep < 1) {
      const pt = onPath(writePath(T, E[3], end.x + end.w / 2, end.y + MARK_H / 2), inOutCubic(ep));
      roleMark(ctx, pt.x - end.w / 2, pt.y - MARK_H / 2, ROLE.end, { edge: WRITER.end, alpha: clamp(ep * 8) });
    }
    // to the tool and back
    flow(ctx, toTool(T, E[1]), seg(t, runAt, runAt + SEND), '京都、あした', 'call');
    flow(ctx, fromTool(T, E[2]), seg(t, backAt, backAt + SEND), '晴れ　最高 24℃', 'data');

    // ——— the key to the edges, under the LLM
    edgeKey(ctx, T.KEY, [[BY.app, 'アプリが付ける', g], [BY.llm, 'LLM が書く', tw(t, eotAt + EOT - 0.1, pace.enter)]]);

    example(ctx, L.app.x, L.app.y + L.app.h + 22, tw(t, at('f'), pace.enter), '会話と予報は説明のための例');
  },
});

// The chapter's map: a clip number on an ink chip.
const MAP = { font: F.mono(600, 16), padX: 9 };
const mapTagW = (ctx, s) => measure(ctx, MAP.font, s) + MAP.padX * 2;
function mapTag(ctx, x, y, s, a, h = 28) {
  tag(ctx, x, y, s, { font: MAP.font, h, padX: MAP.padX, fill: C.ink, color: C.paper, alpha: a });
}

// Under the LLM, what it cannot do (sentence e); handed to the app (sentence f), it moves to the
// app's side and loses its cross.
function handOver(ctx, t, at, pace, lead, ranLit) {
  const a = tw(t, at('cant') - lead, pace.enter);
  if (a <= 0) return;
  const s = 'プログラムを動かす';
  const font = F.jp(700, 17);
  const w = measure(ctx, font, s) + 20;
  const p = inOutCubic(seg(t, at('give') - lead, at('give') - lead + 0.9));
  const x0 = NOTE.x - w / 2;
  const y0 = NOTE.y[1];
  const x1 = LOOP.x - LOOP.r - 16 - w;
  const y1 = SIDE.y - 16;
  const x = lerp(x0, x1, p);
  const y = lerp(y0, y1, p) - Math.sin(Math.PI * p) * 40;
  const cross = 1 - seg(p, 0, 0.4);
  const edge = p < 0.5 ? C.red : C.purple;
  tag(ctx, x, y, s, { font, h: 32, padX: 10, fill: p < 0.5 ? '#fff' : C.purpleSoft, stroke: edge, color: p < 0.5 ? C.red : C.purple, alpha: a });
  if (cross > 0) {
    ctx.save();
    ctx.globalAlpha = a * cross;
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 3;
    line(ctx, x + 6, y + 17, x + w - 6, y + 17);
    ctx.restore();
  }
  ring(ctx, x, y, w, 32, ranLit, C.accent, 16);
}

// The tool's place: first the weather program, then (sentence n) a slot for anything that takes
// an input and returns a result, the program becoming one card of four.
function toolContents(ctx, b, a, { shrink, kinds }) {
  const c0 = cardBox(0);
  // the weather program: the whole box, shrinking into the first card
  const box = { x: lerp(b.x + 20, c0.x, shrink), y: lerp(b.y + 20, c0.y, shrink), w: lerp(b.w - 40, c0.w, shrink), h: lerp(b.h - 40, c0.h, shrink) };
  if (shrink > 0) {
    ctx.save();
    ctx.globalAlpha = a * shrink;
    rr(ctx, box.x, box.y, box.w, box.h, 12);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
  const big = 1 - shrink;
  text(ctx, '天気予報のプログラム', b.x + b.w / 2, b.y + b.h / 2 + 14, { font: F.jp(700, 26), color: C.ink, align: 'center', alpha: a * big });
  text(ctx, '都市と日 → 予報', b.x + b.w / 2, b.y + b.h / 2 + 54, { font: F.jp(500, 19), color: C.ink2, align: 'center', alpha: a * big });
  KINDS.forEach(([name, what], i) => {
    const k = i === 0 ? clamp((shrink - 0.6) / 0.4) : kinds[i - 1];
    if (k <= 0) return;
    const r = cardBox(i);
    if (i > 0) {
      ctx.save();
      ctx.globalAlpha = a * k;
      rr(ctx, r.x, r.y + (1 - k) * 8, r.w, r.h, 12);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    const dy = i > 0 ? (1 - k) * 8 : 0;
    text(ctx, name, r.x + 14, r.y + r.h / 2 - 4 + dy, { font: F.jp(700, 20), color: C.ink, alpha: a * k });
    text(ctx, what, r.x + 14, r.y + r.h / 2 + 26 + dy, { font: F.jp(500, 15), color: C.ink2, alpha: a * k });
  });
}
