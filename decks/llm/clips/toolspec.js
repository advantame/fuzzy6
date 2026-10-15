// 5-2: the tool definitions. Told from the designer's side (Boss, 2026-10-15), like 5-1: to have the
// LLM write a tool call, something is still missing — which tools this app has, and how to ask for
// them, are not in what the LLM learned. So we have the app put a description of the tools it can
// use into the context: each tool's name, what it does, and what input it takes. One tool so
// described is a tool definition. In this example the app's maker prepares the definitions as data
// in a set form (Anthropic's API: name, description, input_schema); when they are passed on, they
// are shaped into text written the way the model saw in training (the API's provider or the chat
// template does that). With the weather, search and calculation tools laid out side by side, the LLM
// can pick the one that fits the question and ask for it. The programs inside the tools are not
// passed on with the definitions: the LLM chooses from what the definitions say, so they should say
// clearly what the tool does and when to use it. The definitions are part of the context too: the
// more of them are passed at once, the longer the document to read.
//
// The layout is the chapter's (lib/rig.js toolUseLayout). The clip joins 5-1 (spec §6.10): its
// first frame is 5-1's last picture, drawn here as tools.js draws it, and the bridge clears it to
// the question, the open assistant mark and the empty slot at the document's head, which this clip
// fills. The definitions sit at the head under a system mark: that is this picture's convention
// (where and how they go differs between models and APIs). The tools, the definitions and the
// conversation are an example.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example } from '../lib/parts.js';
import {
  toolUseLayout, chatScreen, screenBubbles, chatBubble, screenLinks, writePath, flyMark, edgeKey, loopIcon,
  llmBlock, appFrame, toolBox, channel, actor, token, TOKEN, tokenPlaces, onPath, docLayout, docEntry, rowAt, sweep, send,
  roleMark, markWidth, MARK_H, ROLE, BY, WRITER, jsonLine,
} from '../lib/rig.js';
import { text, measure, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { focus, ring } from '../../../src/kit/cue.js';

const T = toolUseLayout();
const { L, ACT, SCREEN, NOTE, SIDE, LOOP } = T;
const TOOL = L.tool;
const DOC = L.doc;

// ——— 5-1's picture, as tools.js has it (its last frame is this clip's first)
const Q = 'あしたの京都の天気は？';
const REQ = ['あ', 'した', 'の', '京都', 'の', '天', '気', '予', '報', 'を', '調', 'べ', 'たい'];
const REQ_NOTE = '頼みの中身を、ふつうの言葉で表したもの（実際の形は 5-3）';
const ANS = ['あ', 'した', 'の', '京都', 'は', '晴', 'れ', 'で', '、', '最高', '気', '温', 'は', '24', '℃', 'の', '予', '報', 'です', '。'];
const RESULT = '京都　あした：晴れ　最高 24℃';
const KINDS = [['天気予報', '都市と日 → 予報'], ['検索', '言葉 → 文章'], ['計算機', '式 → 答え'], ['シェル', 'コマンド → 出力']];
const CARD = { x: TOOL.x + 20, y: TOOL.y + 20, w: (TOOL.w - 54) / 2, h: (TOOL.h - 54) / 2, gap: 14 };
const cardBox = (i) => ({ x: CARD.x + (i % 2) * (CARD.w + CARD.gap), y: CARD.y + Math.floor(i / 2) * (CARD.h + CARD.gap), w: CARD.w, h: CARD.h });
const HEAD = 64;
const NOTE51 = '会話と予報は説明のための例';

// ——— this clip
// the tool's place: the three tools of the chapter, one row each, with the program inside
const ROW = { x: TOOL.x + 20, y: TOOL.y + 20, w: TOOL.w - 40, h: (TOOL.h - 40 - 22) / 3, gap: 11 };
const rowBox = (i) => ({ x: ROW.x, y: ROW.y + i * (ROW.h + ROW.gap), w: ROW.w, h: ROW.h });
const glyphBox = (r) => ({ x: r.x + r.w - 124, y: r.y + 12, w: 110, h: r.h - 24 });
// what the LLM learned (sentence b), above it, as in 5-1
const KNEW = { x: L.llm.x, y: 176, w: L.llm.w + 100, h: 152 };
// the definitions, as the model reads them: under a system mark at the document's head. Row k's
// baseline is DTOP + 21 + 29 × (the rows above it); rows come in one by one, some in between.
const DFONT = F.jp(500, 19);
const DNAME = F.jp(700, 19);
const DLH = 29;
const DTOP = DOC.y + 26;
const DX = DOC.x + 18 + 122 + 12; // where the entries' text starts (docLayout's tx)
const INDENT = 19;
const SYS = { x: DOC.x + 18, y: DTOP, role: 'system' };
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
const GW = [1, 2, 3]; // get_weather's rows
// the definition as the app's maker prepares it: Anthropic's API's form
const JSON_LINES = [
  '{',
  '  "name": "get_weather",',
  '  "description": "都市と日の天気予報を返す",',
  '  "input_schema": {',
  '    "type": "object",',
  '    "properties": {',
  '      "city": {"type": "string"},',
  '      "day": {"type": "string"} },',
  '    "required": ["city", "day"] }',
  '}',
];
const JFONT = F.mono(500, 15);
const JLH = 20;

const FLY = 0.55; // a mark flying out of the app's box
const TOK = 0.42; // a token along the write channel and into its place

const span = (t, a, b, rise = 0.25, fall = 0.35) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n token times, evenly from a, the last one landing by b
const times = (n, a, b) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - TOK - a)) / Math.max(1, n - 1));
// how much of an entry is written at time s
const upto = (list, ts) => (s) => list.reduce((u, tk, k) => (s >= ts[k] + TOK ? tk.upto : u), 0);

export default clip({
  id: 'toolspec',
  title: 'ツールの定義',
  kicker: '名前・何をするか・入力',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.9, // 5-1's last picture clears; skipped unless the clip is joined from 5-1
  script: [
    { id: 'a', text: 'LLM に{call}ツール呼び出しを書かせるには、\n{miss}まだ足りないものがあるの。' },
    { id: 'b', text: 'でも、{which}このアプリにあるツールと、{how}その頼み方は、\n{learn}学習で身に付けた知識からは{nok}わからないわ。' },
    { id: 'c', text: 'そこで、{put}アプリには、{desc}使えるツールの説明を、\n{ctx}コンテクストに入れさせるの。' },
    { id: 'd', text: '説明には、{nm}ツールの名前と、{wh}何をするのか、\n{in}どんな入力を受け取るのかを書くわ。' },
    { id: 'e', still: true, text: 'こうして{one}一つのツールを説明したものを、\n{def}ツールの定義と呼ぶの。' },
    { id: 'f', lead: 0.7, text: 'この例では、{maker}アプリを作る人が、\n定義を、{data}決まった形のデータで用意するわ。' },
    { id: 'g', still: true, text: '渡すときには、{it}それを、{fmt}モデルが学習で見てきた書き方の文字に\n整えて、{into}コンテクストに入れるの。' },
    { id: 'h', lead: 0.7, tail: 2.4, still: true, text: '天気のほかに、{s2}検索や{s3}計算のツールも並べておけば、\n{llm}LLM は、{fit}質問に合うものを{pick}選んで{req}頼めるわね。' },
    { id: 'i', by: 'zunda', text: '{prog}ツールの中のプログラムは、LLM には見えないのだ？' },
    { id: 'j', still: true, text: '{nosee}定義を渡しただけでは、中のプログラムまでは見えないわ。\n{clue}LLM は、定義に書かれた説明を手がかりに選ぶの。' },
    { id: 'k', text: 'だから、{clear}何をするツールで、{when}どんなときに使うのかを、\n{write}定義にわかりやすく書いておくことが大切なのよ。' },
    { id: 'l', tail: 0.8, text: '{part}定義もコンテクストの一部だから、\n{more}一度に渡す定義を増やすほど、{long}読ませる文書も長くなるわ。' },
  ],

  prepare(ctx) {
    const ent = (role, s, kind = 'text') => ({ role, text: s, kind });
    // 5-1's document, laid out as 5-1 lays it out; this clip keeps its first two entries
    const E = docLayout(ctx, L, [
      ent('user', Q), { ...ent('assistant', REQ.join(''), 'call'), gap: 54 }, ent('result', RESULT, 'data'), ent('assistant', ANS.join('')),
    ], T.DOC);
    const R = E[3];
    const last = rowAt(R, R.rows.length - 1);
    const end = { x: last.x + measure(ctx, R.font, R.rows[R.rows.length - 1]) + 16, y: last.y - 22, w: markWidth(ctx, ROLE.end.name) };
    const B = screenBubbles(ctx, SCREEN, [['user', Q], ['assistant', 'あしたの京都は晴れで、\n最高気温は24℃の予報です。']]);
    const toks = tokenPlaces(ctx, E[1], REQ);
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
    // sentences f and g: the paper gives way down to just under the assistant mark (three rows
    // of definitions at its head by then), and the data the maker prepared takes the room below
    const shift3 = 28 + 2 * DLH + 40;
    const paperH = E[1].y + shift3 + 1 + MARK_H + 22 - DOC.y;
    const cardY = DOC.y + paperH + 20;
    const JC = { x: DOC.x, y: cardY, w: 402, h: L.app.y + L.app.h - 22 - cardY };
    const STG = { x: JC.x + JC.w + 40, y: JC.y + 66, w: DOC.x + DOC.w - (JC.x + JC.w + 40), h: 72 };
    return { E, end, B, toks, defs, paperH, JC, STG, qW: measure(ctx, E[0].font, Q) };
  },

  draw(ctx, t, { E, end, B, toks, defs, paperH, JC, STG, qW }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);
    const lit = (names, until) => focus(t, names.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 5-1's last picture clears, all but the frame, the question, the open mark
    // and the slot. The first frame is 5-1's untouched; at the head the three tools stand in rows.
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.55));
    const fresh = inOutCubic(seg(t, br * 0.4, br));

    // ——— when things happen
    const putAt = at('put') - lead;
    const descAt = at('desc') - lead;
    const s2 = at('s2') - lead;
    const s3 = at('s3') - lead;
    const moreAt = at('more') - lead;
    // the rows of the definitions: when each comes in; the ones below make way for it
    const rowStart = [descAt, descAt + 0.3, descAt + 0.6, at('when') - lead, s2, s2 + 0.3, s3, s3 + 0.3, moreAt, moreAt + 0.3];
    const grow = rowStart.map((s) => inOutCubic(seg(t, s - 0.1, s + 0.3)));
    const typed = rowStart.map((s) => seg(t, s, s + 0.45));
    const ys = [];
    let rows = 0;
    grow.forEach((g) => {
      ys.push(DTOP + 21 + DLH * rows);
      rows += g;
    });
    const blockH = Math.max(24, 28 + DLH * (rows - 1));
    // the conversation sits under the head (5-1: 64 below where it started)
    const shift = blockH + 40;
    // sentences f and g: the paper gives way, then comes back (h)
    const shortP = inOutCubic(seg(t, at('f'), at('f') + 0.6)) * (1 - inOutCubic(seg(t, at('h') + 0.15, at('h') + 0.65)));
    const paper = { ...DOC, h: lerp(DOC.h, paperH, shortP) };
    const away = 1 - seg(t, at('h'), at('h') + 0.35);
    // sentence h: the app has the LLM read; the LLM writes its request
    const read = at('llm') - lead;
    const reqAt = times(REQ.length, at('req') - 0.1, at('h.done') - 0.6);
    const landed = upto(toks, reqAt);
    const lastTok = reqAt[reqAt.length - 1] + TOK;
    // sentence l: a longer read
    const read2 = at('long') - lead;

    // who is at work
    const actGlow = Math.max(
      span(t, putAt, descAt + 1.05),
      span(t, s2, s3 + 0.75),
      span(t, read, read + 1.0),
      span(t, moreAt, moreAt + 0.75),
      span(t, read2, read2 + 1.0),
    );
    const llmGlow = Math.max(span(t, read + 0.9, lastTok), span(t, read2 + 0.9, read2 + 1.6));

    // ——— the chat screen
    chatScreen(ctx, SCREEN, 1);
    chatBubble(ctx, B[0], { alpha: 1 });
    chatBubble(ctx, B[1], { alpha: gone, chars: 1 });
    screenLinks(ctx, T, { talk: 1, back: 1 });

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, { ...L, doc: paper }, 1, { name: '' });
    llmBlock(ctx, L, 1, { glow: llmGlow });
    channel(ctx, L.read, 1);
    channel(ctx, L.write, 1);
    channel(ctx, L.call, 1);
    channel(ctx, L.back, 1);

    // ——— the document: the conversation, under the head
    ctx.save();
    ctx.beginPath();
    ctx.rect(paper.x, paper.y, paper.w, paper.h);
    ctx.clip();
    ctx.translate(0, shift);
    docEntry(ctx, E[0], 1, { tagAlpha: 0 });
    if (gone > 0) {
      docEntry(ctx, E[1], gone, { tagAlpha: 0, chars: 1 });
      docEntry(ctx, E[2], gone, { tagAlpha: 0, chars: 1 });
      docEntry(ctx, E[3], gone, { tagAlpha: 0, chars: 1 });
    }
    // sentence h: the request; the band is the call's, the words are the LLM's
    if (t >= reqAt[0] + TOK - 0.05) docEntry(ctx, E[1], tw(t, reqAt[0] + TOK - 0.05, 0.25), { tagAlpha: 0, chars: landed(t) });
    ctx.restore();

    // ——— the slot at the head (5-1), until the definitions fill it (sentence c)
    const slotA = 1 - seg(t, putAt + 0.25, putAt + 0.65);
    if (slotA > 0) {
      const sy = DOC.y + 16;
      ctx.save();
      ctx.globalAlpha = slotA;
      ctx.setLineDash([8, 6]);
      rr(ctx, DOC.x + 14, sy, DOC.w - 28, blockH + 20, 10);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      text(ctx, 'ツールの定義', DOC.x + 32, sy + (HEAD - 20) / 2 + 1, { font: F.jp(700, 18), color: C.muted, base: 'middle', alpha: slotA });
      mapTag(ctx, DOC.x + DOC.w - 26 - mapTagW(ctx, '5-2'), sy + (HEAD - 20) / 2 - 14, '5-2', gone);
    }
    // sentence miss: what is missing
    const [miss] = lit(['miss'], at('a.end'));
    ring(ctx, DOC.x + 14, DOC.y + 16, DOC.w - 28, blockH + 20, miss, C.accent, 10);

    // ——— the definitions
    // sentence h: the one that fits the question
    const [fit, pick] = lit(['fit', 'pick'], at('h.done'));
    const gwB = defBox(defs, ys, grow, GW);
    if (pick > 0) {
      ctx.save();
      ctx.globalAlpha = pick;
      rr(ctx, gwB.x - 6, gwB.y - 4, gwB.w + 12, gwB.h + 8, 8);
      ctx.fillStyle = C.accentSoft;
      ctx.fill();
      ctx.restore();
    }
    defs.forEach((r, k) => drawDef(ctx, r, ys[k], typed[k]));
    if (t >= putAt + FLY) roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
    // sentence e: one tool so described is a tool definition (on the heading's row, clear of
    // get_weather's ring)
    tag(ctx, DOC.x + DOC.w - 18, ys[0] - 20, 'ツールの定義', { font: F.jp(700, 14), h: 24, padX: 9, fill: C.accent, color: '#fff', align: 'right', alpha: pop('def') });

    // the marks the app has written, each edged in its colour (5-1's two last ones clear)
    const mark = (e, a = 1) => roleMark(ctx, e.x, e.y + 1 + shift, ROLE[e.role], { edge: BY.app, alpha: a });
    mark(E[0]);
    mark(E[1]);
    if (gone > 0) {
      mark(E[2], gone);
      mark(E[3], gone);
      roleMark(ctx, end.x, end.y + shift, ROLE.end, { edge: WRITER.end, alpha: gone });
    }
    // a cursor after the open mark, while the LLM reads, until it writes
    if (t >= read && t < reqAt[0] + TOK && Math.floor(t * 2.5) % 2 === 0) {
      const c = rowAt(E[1], 0);
      ctx.fillStyle = C.accent;
      ctx.fillRect(c.x, c.y - 24 + shift, 4, 30);
    }

    // sentence a: where the LLM is to write a tool call (5-1's band, empty)
    const ghost = pop('call') * (1 - seg(t, at('c'), at('c') + 0.4));
    if (ghost > 0) {
      ctx.save();
      ctx.globalAlpha = ghost;
      ctx.setLineDash([7, 6]);
      rr(ctx, E[1].tx, E[1].y + shift, E[1].w, E[1].h, 8);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      text(ctx, 'ツール呼び出し', E[1].tx + 18, E[1].y + shift + E[1].h / 2 + 6, { font: F.jp(700, 17), color: C.accent, alpha: ghost * 0.85 });
    }

    // the request's note and name (5-1's, clearing; the clip's own once it is written)
    const reqDone = tw(t, lastTok, pace.enter);
    const noteY = E[1].y + E[1].h + 8 + shift;
    text(ctx, REQ_NOTE, E[1].tx + 2, noteY + 18, { font: F.jp(500, 14), color: C.muted, alpha: Math.max(gone, reqDone) });
    tag(ctx, E[1].tx + E[1].w - 10, E[1].y + E[1].h / 2 - 14 + shift, 'ツール呼び出し', { font: F.jp(700, 15), h: 28, padX: 9, fill: C.accent, color: '#fff', align: 'right', alpha: Math.max(gone, reqDone) });
    mapTag(ctx, E[1].tx + E[1].w - mapTagW(ctx, '5-3'), noteY, '5-3', gone);
    mapTag(ctx, E[2].tx + E[2].w - 10 - mapTagW(ctx, '5-4'), E[2].y + E[2].h / 2 - 14 + shift, '5-4', gone);

    // ——— rings on the document
    // the context: the written part (sentences c and l)
    const [ctxLit] = lit(['ctx'], at('c.end'));
    const [partLit] = lit(['part'], at('l.end'));
    const ctxA = Math.max(ctxLit, partLit);
    if (ctxA > 0) {
      const top = DOC.y + 14;
      const bottom = t >= reqAt[0] ? noteY + 24 : E[1].y + shift + 1 + MARK_H + 8;
      ring(ctx, DOC.x + 14, top, DOC.w - 28, bottom - top, ctxA, C.accent, 12);
      tag(ctx, DOC.x + DOC.w - 8, bottom + 12, 'コンテクスト', { font: F.jp(700, 16), h: 30, padX: 10, fill: C.accent, color: '#fff', align: 'right', alpha: ctxA });
    }
    // sentence b: how to ask (the empty band); sentence h: the question
    const [, how] = lit(['which', 'how'], at('learn'));
    ring(ctx, E[1].tx, E[1].y + shift, E[1].w, E[1].h, how * ghost, C.accent, 10);
    ring(ctx, E[0].tx - 4, E[0].y + shift - 2, qW + 8, 32, fit, C.accent, 10);
    ring(ctx, B[0].x - 4, B[0].y - 4, B[0].L.w + 8, B[0].L.h + 8, fit, C.accent, 22);
    // sentence d: the three parts of a definition
    const [nm, wh, inp] = lit(['nm', 'wh', 'in'], at('d.end'));
    const segBox = (k, part) => {
      const s = defs[k].segs.find((sg) => sg.part === part);
      return { x: s.x - 2, y: ys[k] - 17, w: s.w + 4, h: 20 };
    };
    [[1, 'name', nm], [1, 'desc', wh], [2, 'input', inp]].forEach(([k, part, lv]) => {
      const b = segBox(k, part);
      ring(ctx, b.x, b.y, b.w, b.h, lv, C.accent, 8);
    });
    // sentences e, k: get_weather's definition; sentence g: the head, as it comes in from the data
    const [one] = lit(['one'], at('e.end'));
    const [clear, when, write] = lit(['clear', 'when', 'write'], at('k.end'));
    ring(ctx, gwB.x, gwB.y, gwB.w, gwB.h, Math.max(one, write), C.accent, 10);
    if (clear > 0) {
      const b = segBox(1, 'desc');
      ring(ctx, b.x, b.y, b.w, b.h, clear, C.accent, 8);
    }
    if (when > 0) {
      const b = segBox(3, 'use');
      ring(ctx, b.x, b.y, b.w, b.h, when, C.accent, 8);
    }
    const [into] = lit(['into'], at('g.end'));
    const headB = defBox(defs, ys, grow, [0, 1, 2]);
    ring(ctx, headB.x, headB.y, headB.w, headB.h, into, C.accent, 10);
    // sentence j: the LLM chooses from what the definitions say
    const [clue] = lit(['clue'], at('j.end'));
    const allB = defBox(defs, ys, grow, [0, 1, 2, 3, 4, 5, 6, 7]);
    ring(ctx, allB.x, allB.y, allB.w, allB.h, clue, C.accent, 10);

    // ——— the app's box, and 5-1's loop and note beside it, clearing
    actor(ctx, ACT, 1, actGlow);
    loopIcon(ctx, LOOP.x, LOOP.y, LOOP.r, gone, { p: 1 });
    mapTag(ctx, LOOP.x - mapTagW(ctx, '5-5') / 2, LOOP.y + LOOP.r + 8, '5-5', gone, 26);

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
    tag(ctx, KNEW.x + 18, KNEW.y + KNEW.h - 44, 'このアプリのツール：わからない', { font: F.jp(700, 14), h: 28, padX: 9, fill: '#fff', stroke: C.red, color: C.red, alpha: pop('nok') * knew });

    // ——— under the LLM, 5-1's notes, clearing
    tag(ctx, NOTE.x, NOTE.y[0], '文章の続きを書く', { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: gone });
    if (gone > 0) {
      const s = 'プログラムを動かす';
      const font = F.jp(700, 17);
      const w = measure(ctx, font, s) + 20;
      const x = lerp(NOTE.x - w / 2, LOOP.x - LOOP.r - 16 - w, 1);
      const y = lerp(NOTE.y[1], SIDE.y - 16, 1) - Math.sin(Math.PI * 1) * 40;
      tag(ctx, x, y, s, { font, h: 32, padX: 10, fill: C.purpleSoft, stroke: C.purple, color: C.purple, alpha: gone });
    }

    // ——— the tool's place: the tools, and the programs inside them
    // (the cards cross over to the rows: out from the start, in from a little later)
    const cardsOut = 1 - inOutCubic(seg(t, 0, br * 0.75));
    const rowsIn = inOutCubic(seg(t, br * 0.2, br));
    toolBox(ctx, L, 1, { solid: 0, glow: 0, draw: (c) => toolRows(c, cardsOut, rowsIn) });
    // sentence i: the programs; sentence j: they are not passed on with the definitions
    const [prog] = lit(['prog'], at('i.end'));
    if (prog > 0) [0, 1, 2].forEach((i) => {
      const g = glyphBox(rowBox(i));
      ring(ctx, g.x, g.y, g.w, g.h, prog, C.accent, 8);
    });
    const veil = pop('nosee', 0.6);
    if (veil > 0) {
      ctx.save();
      ctx.globalAlpha = 0.8 * veil;
      rr(ctx, TOOL.x + 4, TOOL.y + 4, TOOL.w - 8, TOOL.h - 8, 16);
      ctx.fillStyle = C.paper;
      ctx.fill();
      ctx.restore();
      tag(ctx, TOOL.x + TOOL.w / 2, TOOL.y + TOOL.h + 14, '定義だけでは、中のプログラムは渡らない', { font: F.jp(700, 16), h: 34, padX: 12, fill: '#fff', stroke: C.red, color: C.red, align: 'center', alpha: veil });
    }
    const [which] = lit(['which'], at('how'));
    ring(ctx, TOOL.x, TOOL.y, TOOL.w, TOOL.h, which, C.accent, 20);
    const w0 = text(ctx, 'ツール', TOOL.x, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    text(ctx, 'の場所', TOOL.x + w0, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });

    // ——— in flight
    flyMark(ctx, T, SYS, seg(t, putAt, putAt + FLY), ROLE.system);
    // the reads: the app hands the document over, from its head
    [[read, E[1].y + shift + MARK_H], [read2, E[1].y + shift + E[1].h]].forEach(([s, bottom]) => {
      sweep(ctx, L, seg(t, s + 0.05, s + 1.0), bottom);
      send(ctx, L.read, seg(t, s + 0.45, s + 1.05), '', 'doc');
    });
    // the LLM's tokens, along the write channel and in under their row
    toks.forEach((tk, k) => {
      const p = seg(t, reqAt[k], reqAt[k] + TOK);
      if (p <= 0 || p >= 1) return;
      const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
      const pt = onPath(writePath(T, E[1], tk.x + w / 2, tk.y, shift), inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
    });

    // ——— the key to the edges, under the LLM
    edgeKey(ctx, T.KEY, [[BY.app, 'アプリが付ける', 1], [BY.llm, 'LLM が書く', 1]]);
    const ex = { x: L.app.x, y: L.app.y + L.app.h + 22 };
    const exW = measure(ctx, F.jp(700, 17), '例') + 20;
    example(ctx, ex.x, ex.y, 1, '');
    text(ctx, NOTE51, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: gone });
    text(ctx, '定義と会話は説明のための例。文書の頭に置くのは、この図の約束', ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: fresh });

    // ——— sentences f and g: the definition as data, and how it becomes the text at the head
    if (away > 0) dataAndShaping(ctx, t, { at, pace, pop, lit, JC, STG, ys, away });
  },
});

// 5-1's map: a clip number on an ink chip (as tools.js draws it).
const MAP = { font: F.mono(600, 16), padX: 9 };
const mapTagW = (ctx, s) => measure(ctx, MAP.font, s) + MAP.padX * 2;
function mapTag(ctx, x, y, s, a, h = 28) {
  tag(ctx, x, y, s, { font: MAP.font, h, padX: MAP.padX, fill: C.ink, color: C.paper, alpha: a });
}

// The box around some rows of the definitions (their text, as far as they have come in), tight
// enough that a ring around it (ring() pads it by 6) stays clear of the rows above and below. A
// box that takes in the heading's row runs to the text column's right end, past its tag.
function defBox(defs, ys, grow, ks) {
  const shown = ks.filter((k) => grow[k] > 0.01);
  const list = shown.length ? shown : [ks[0]];
  const top = ys[list[0]] - 17;
  const bottom = ys[list[list.length - 1]] + 3;
  const right = list[0] === 0 ? DOC.x + DOC.w - 16 : Math.max(...list.map((k) => defs[k].right)) + 2;
  return { x: DX - 2, y: top, w: right - DX + 2, h: bottom - top };
}

// One row of the definitions, typed in by p (0–1). Ghost rows are bars: more definitions.
function drawDef(ctx, r, y, p) {
  if (p <= 0) return;
  if (r.ghost) {
    ctx.save();
    ctx.globalAlpha = clamp(p * 2);
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

// The tool's place: 5-1's four cards (as tools.js draws them), giving way in the bridge to the
// chapter's three tools in rows, each with its program inside.
function toolRows(ctx, gone, fresh) {
  KINDS.forEach(([name, what], i) => {
    const card = (r, a, dy0, dy1) => {
      if (a <= 0.001) return;
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, r.x, r.y, r.w, r.h, 12);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      text(ctx, name, r.x + 14, r.y + r.h / 2 + dy0, { font: F.jp(700, 20), color: C.ink, alpha: a });
      text(ctx, what, r.x + 14, r.y + r.h / 2 + dy1, { font: F.jp(500, 15), color: C.ink2, alpha: a });
    };
    card(cardBox(i), gone, -4, 26);
    if (i > 2 || fresh <= 0) return;
    const r0 = rowBox(i);
    const r = { ...r0, y: r0.y + (1 - fresh) * 8 };
    card(r, fresh, -6, 20);
    program(ctx, glyphBox(r), fresh, i);
  });
}

// A program, drawn as a few lines of code on a dark panel.
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

// Sentences f and g: the maker's data (Anthropic's API's form) in the room the paper gives up,
// a stage that shapes it into text written the way the model saw in training, and the way up into
// the head of the document.
function dataAndShaping(ctx, t, { at, pace, pop, lit, JC, STG, ys, away }) {
  const card = pop('maker') * away;
  if (card <= 0) return;
  const [it] = lit(['it'], at('fmt'));
  ctx.save();
  ctx.globalAlpha = card;
  rr(ctx, JC.x, JC.y, JC.w, JC.h, 14);
  ctx.fillStyle = '#fbfaf7';
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = C.rule;
  ctx.fillRect(JC.x + 16, JC.y + 60, JC.w - 32, 1.5);
  ctx.restore();
  text(ctx, 'アプリを作る人が用意する定義のデータ', JC.x + 18, JC.y + 28, { font: F.jp(700, 16), color: C.ink, alpha: card });
  const data = at('data') - pace.cue.lead;
  text(ctx, 'Anthropic の API に渡す形（JSON）', JC.x + 18, JC.y + 49, { font: F.jp(500, 14), color: C.muted, alpha: tw(t, data, pace.enter) * away });
  JSON_LINES.forEach((s, i) => {
    jsonLine(ctx, s, JC.x + 18, JC.y + 84 + i * JLH, { font: JFONT, alpha: tw(t, data + i * 0.04, 0.35) * away });
  });
  ring(ctx, JC.x, JC.y, JC.w, JC.h, it * away, C.accent, 14);

  // the stage that shapes it
  const fmt = pop('fmt') * away;
  const a1 = tw(t, at('fmt') - pace.cue.lead, 0.4, inOutCubic);
  const cy = STG.y + STG.h / 2;
  ctx.save();
  ctx.globalAlpha = away;
  ctx.strokeStyle = ctx.fillStyle = C.ink2;
  ctx.lineWidth = 2.5;
  arrow(ctx, JC.x + JC.w + 6, cy, STG.x - 6, cy, a1, 11);
  ctx.restore();
  if (fmt > 0) {
    ctx.save();
    ctx.globalAlpha = fmt;
    rr(ctx, STG.x, STG.y, STG.w, STG.h, 14);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    const cx = STG.x + STG.w / 2;
    text(ctx, 'モデルに合う書き方の', cx, STG.y + 31, { font: F.jp(700, 16), color: C.ink, align: 'center', alpha: fmt });
    text(ctx, '文字に整える', cx, STG.y + 55, { font: F.jp(700, 16), color: C.ink, align: 'center', alpha: fmt });
    const na = tw(t, at('fmt') - pace.cue.lead + 0.3, pace.enter) * away;
    text(ctx, '整えるのは、API の提供元や', cx, STG.y + STG.h + 26, { font: F.jp(500, 14), color: C.muted, align: 'center', alpha: na });
    text(ctx, 'チャットテンプレート', cx, STG.y + STG.h + 46, { font: F.jp(500, 14), color: C.muted, align: 'center', alpha: na });
  }
  // up into the head of the document
  const a2 = tw(t, at('into') - pace.cue.lead, 0.5, inOutCubic);
  if (a2 > 0) {
    const x = STG.x + STG.w / 2;
    ctx.save();
    ctx.globalAlpha = away;
    ctx.strokeStyle = ctx.fillStyle = C.ink2;
    ctx.lineWidth = 2.5;
    arrow(ctx, x, STG.y - 6, x, ys[2] + 16, a2, 11);
    ctx.restore();
  }
}
