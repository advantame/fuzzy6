// 4-5: read again every time. A chatbot seems to remember, but the LLM's parameters do not change
// while it answers, and it reads only the document it is given. Told from the designer's side
// (Boss, 2026-10-15): pass on only what came in, and the LLM cannot tell what「二日」is about
// (staged on the chat screen); so have the app join the whole conversation and have it read
// from the head every time — the LLM can then answer as its continuation. The same front part
// need not be worked out again (chapter 9). Joined like this, the context grows turn by turn
// until it passes the context window; so have the app leave out old parts or summarise them,
// as its maker decides (some apps stop with an error). A new conversation starts from an empty
// document; so have the app save what is worth keeping and write it at the head of the next
// one — one way to build a memory feature.
// Drawn on the tool diagram's parts (lib/rig.js) as in 4-2: the app's box writes the marks
// (edged in its colour), the LLM's tokens come along the write channel, and the chat screen
// stands where the tool will; under it, how long each read is against the window.
// The conversation, the lengths, the window and the memo are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, bubbleLayout, bubble } from '../lib/parts.js';
import { actorLayout, actor, token, TOKEN, tokenPlaces, onPath, llmBlock, appFrame, channel, docLayout, docEntry, sweep, send, roleMark, MARK_H, ROLE, BY } from '../lib/rig.js';
import { text, measure, rr, line, arrow } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

const { ACT, L } = actorLayout();
const SCREEN = { x: 1150, y: L.app.y, w: W - M.r - 1150, h: 400 };
// screen ↔ the app's box
const LINK = { x1: ACT.x + ACT.w + 12, x2: SCREEN.x - 12, talk: ACT.y + ACT.h / 2 - 18, back: ACT.y + ACT.h / 2 + 18 };
// how long each read is, under the screen; the bars stand on y + h
const CHART = { x: SCREEN.x, y: 566, w: SCREEN.w, h: 190 };
// the saved memo, in the app's frame beside its box
const CARD = { x: L.app.x + 22, y: ACT.y, w: 300, h: ACT.h };
// the key to the edges, under the LLM
const KEY = { x: L.llm.x, y: 690 };

const Q1 = '週末、京都に行きます';
const A1 = 'いいですね。何日の予定ですか？';
const Q2 = '二日です';
// what the LLM writes, one token at a time (as o200k_base cuts it)
const BAD = ['何', 'が', '二', '日', 'です', 'か', '？'];
const A2 = ['それ', 'なら', '、一', '日', 'め', 'は', '東', '山', 'がお', 'すすめ', 'です', '。'];
const Q3 = 'お昼のおすすめは？';
const A3 = ['東', '山', 'なら', '、', '豆', '腐', '料理', 'のお', '店', 'が', '近', 'い', 'ですよ', '。'];
// ずっと話していたら: more turns, drawn as grey lines (their words do not matter here)
const MORE = [['user', 5], ['assistant', 16], ['user', 7], ['assistant', 13]];
const SUMMARY = '（要約）京都に二日。一日めは東山を歩く';
const MEMO = '週末、京都に二日行く';
const QM = 'お土産は何がいい？';
const AM = ['京都', 'のお', '土', '産', 'なら', '、', '八', 'ツ', '橋', 'は', 'どう', 'でしょう', '。'];
// how long each read is, in an example unit: three turns, then one far on; the window holds WIN
const READ = [1, 2.4, 4.5, 7.2];
const SHORT = 4.3;
const WIN = 6;

const FLY = 0.55; // a mark flying out of the app's box
const TOK = 0.5; // a token along the write channel and into its place

const span = (t, a, b, rise = 0.25, fall = 0.35) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n token times, evenly from a, the last one landing by b
const times = (n, a, b) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - TOK - a)) / Math.max(1, n - 1));
// how much of an entry is written at time s
const upto = (list, ts) => (s) => list.reduce((u, tk, k) => (s >= ts[k] + TOK ? tk.upto : u), 0);

export default clip({
  id: 'memory',
  title: '毎回読み直す',
  kicker: '会話の記憶',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'チャットボットと話すときは、{seem}「二日です」のように、\n相手が前の話を覚えているつもりで、返事をするわね。' },
    { id: 'b', text: 'でも、{fixed}答えを作るあいだ、パラメータは変わらないし、\n{only}LLM が読めるのは、渡された文書だけだったわね。' },
    { id: 'b2', text: 'だから、{naive}届いた発言だけを、そのまま渡すと、\n{lost}LLM には、何が二日なのか、わからないの。' },
    { id: 'b3', by: 'zunda', text: '{huh}何日か聞いてきたのは、そっちなのだ！' },
    { id: 'c', text: 'そこで、アプリには、{all}それまでのやりとりも全部つないで、\n{again}毎回、頭から読ませるの。' },
    { id: 'c1', text: '{prev}前の話が書いてあれば、{fit}LLM は、\nその続きとして答えを書けるわね。' },
    { id: 'd', text: '{t3}3 回目も、それまでのやりとりに、\n新しい発言をつないで、頭から読ませるわ。' },
    { id: 'd2', text: '同じところを毎回計算し直さないように、\n{reuse}前の計算結果を、とっておいて使い回す工夫もあるわ。' },
    { id: 'e', still: true, text: 'でも、こうして足し続けると、{grow}読ませる文書は、\n回ごとに長くなっていくの。' },
    { id: 'f', by: 'zunda', text: '{q}ずっと話していたら、どうなるのだ？' },
    { id: 'g', text: 'いつかは、{limit}コンテクストウィンドウの上限を超えて、\n{over}全部は読ませられなくなるわ。' },
    { id: 'h', text: 'そこで、{cut}古い部分を省かせたり、\n{sum}要約して短くさせたりして、ウィンドウに収めるの。' },
    { id: 'h2', still: true, text: 'どう収めるかは、{app2}アプリを作る人が決めるの。\n{err}収めずに、エラーで止めるアプリもあるわ。' },
    { id: 'i', text: '新しい会話を始めると、{fresh}文書は一から作り直すから、\n前の会話のことは、もう書かれていないわ。' },
    { id: 'i2', text: 'そこで、{mem}覚えておきたいことを保存させておいて、\n{pref}次の会話の文書の頭に、書き足させるの。' },
    { id: 'i3', text: 'すると、{use}新しい会話でも、\n京都の旅行の話だとわかって答えられるわね。' },
    { id: 'i4', still: true, tail: 0.8, text: '{name}メモリー機能は、たとえばこうして作れるの。' },
  ],

  prepare(ctx) {
    const opts = { top: 26, gap: 18, font: F.jp(500, 24), lh: 36 };
    const ent = (role, s) => ({ role, text: s });
    // only what came in (sentence b2)
    const EN = docLayout(ctx, L, [ent('user', Q2), ent('assistant', BAD.join(''))], opts);
    // the whole conversation, then more of it (sentence f)
    const EF = docLayout(ctx, L, [
      ent('user', Q1), ent('assistant', A1), ent('user', Q2), ent('assistant', A2.join('')),
      ent('user', Q3), ent('assistant', A3.join('')), ...MORE.map(([role, n]) => ({ role, text: 'あ'.repeat(n), more: true })),
    ], opts);
    // the summary takes the place of the four oldest entries; the rest move up by `lift`
    const sum = docLayout(ctx, L, [ent('system', SUMMARY)], opts)[0];
    const lift = EF[4].y - (sum.y + sum.h + 18);
    // the next conversation, with the saved memo at its head
    const EM = docLayout(ctx, L, [ent('system', `（保存したメモ）${MEMO}`), ent('user', QM), ent('assistant', AM.join(''))], opts);
    const toks = {
      bad: tokenPlaces(ctx, EN[1], BAD),
      a2: tokenPlaces(ctx, EF[3], A2),
      a3: tokenPlaces(ctx, EF[5], A3),
      am: tokenPlaces(ctx, EM[2], AM),
    };
    // the screen: one bubble per slot, top to bottom (the wrong answer shares the right one's)
    const bl = (s) => bubbleLayout(ctx, s, SCREEN.w - 64, { font: F.jp(500, 21), pad: 16 });
    const slots = [
      ['user', Q1], ['assistant', A1], ['user', Q2], ['assistant', A2.join('')], ['user', Q3], ['assistant', A3.join('')],
      ...MORE.map(([role, n]) => [role, 'あ'.repeat(Math.round(n * 0.6)), true]),
    ];
    const place = (list) => {
      let y = SCREEN.y + 62;
      return list.map(([role, s, more]) => {
        const b = { role, L: bl(s), more };
        b.x = role === 'user' ? SCREEN.x + SCREEN.w - 20 - b.L.w : SCREEN.x + 20;
        b.y = y;
        y += b.L.h + 14;
        return b;
      });
    };
    const B = place(slots);
    const bad = { ...B[3], L: bl(BAD.join('')) };
    const BM = place([['user', QM], ['assistant', AM.join('')]]);
    return { EN, EF, sum, lift, EM, toks, B, bad, BM };
  },

  draw(ctx, t, { EN, EF, sum, lift, EM, toks, B, bad, BM }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);
    const lit = (names, until) => focus(t, names.map(at), until - cue.fall, cue).level;

    // ——— when things happen
    // sentence b2: the app writes only what came in, and passes it on; the LLM writes
    const n0 = at('naive') - lead;
    const nMarks = [n0, n0 + 0.3];
    const nRead = n0 + 0.3 + FLY;
    const badAt = times(BAD.length, Math.max(at('lost') - 0.1, nRead + 0.9), Math.max(at('b2.end'), at('lost') + 1.6));
    const rewind = 1 - tw(t, at('c') - lead, 0.5);
    // sentence c: the whole conversation, read from the head; c1: the LLM answers
    const fMarks = [0, 1, 2, 3].map((i) => at('all') - lead + i * 0.28);
    const fRead = at('again') - 0.1;
    const a2At = times(A2.length, Math.max(at('fit') - 0.15, fRead + 1.0), Math.max(at('c1.end') + 0.2, at('fit') + 2.4));
    // sentence d: the third turn
    const q3In = at('d') - lead;
    const t3Marks = [at('t3') - lead + 0.25, at('t3') - lead + 0.55];
    const t3Read = t3Marks[1] + FLY;
    const a3At = times(A3.length, t3Read + 0.95, Math.max(at('d.end') + 0.6, t3Read + 3.6));
    // sentence f: more turns, quickly
    const moreAt = MORE.map((_, k) => at('f') - lead + 0.15 + k * 0.38);
    // sentence h: the oldest part crossed out, then summed up
    const cut = tw(t, at('cut') - lead, 0.9);
    const sumP = tw(t, at('sum') - lead, 0.8, inOutCubic);
    const sumMark = at('sum') - lead - 0.2;
    // sentence i: a new conversation
    const old = 1 - tw(t, at('i') - lead, 0.5);
    const mIn = at('fresh') - lead;
    const mMarks = [mIn + 0.45, mIn + 0.75];
    const memP = tw(t, at('pref') - lead, 0.8, inOutCubic);
    const mRead = at('use') - lead;
    const amAt = times(AM.length, mRead + 1.0, Math.max(at('i3.end') + 0.3, mRead + 3.2));
    const lastLand = (ts) => ts[ts.length - 1] + TOK;

    // who is at work
    const app2 = lit(['app2'], at('h2.end'))[0];
    const actGlow = Math.max(
      span(t, n0 - 0.1, nRead + 0.9),
      span(t, at('all') - lead, fRead + 1.0),
      span(t, at('t3') - lead, t3Read + 0.9),
      span(t, moreAt[0], moreAt[3] + FLY),
      span(t, at('cut') - lead, at('sum') + 0.6),
      app2,
      span(t, mIn, mMarks[1] + FLY),
      span(t, at('pref') - lead, at('pref') + 0.6),
      span(t, mRead, mRead + 0.9),
    );
    const writing = [[nRead + 0.5, lastLand(badAt)], [fRead + 0.6, lastLand(a2At)], [t3Read + 0.5, lastLand(a3At)], [mRead + 0.6, lastLand(amAt)]];
    const llmGlow = Math.max(...writing.map(([a, b]) => span(t, a, b)));
    const backHot = Math.max(...[badAt, a2At, a3At, amAt].map((ts) => span(t, ts[0] + TOK, lastLand(ts) + 0.2))) > 0.5;
    const talkHot = Math.max(span(t, n0 - 0.5, n0 + 0.3), span(t, q3In, q3In + 0.8), span(t, mIn - 0.2, mIn + 0.6)) > 0.5;

    // ——— the chat screen
    const g = enter(t, at('a'), pace);
    if (g > 0) {
      ctx.save();
      ctx.globalAlpha = g;
      rr(ctx, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 20);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      text(ctx, 'チャットの画面', SCREEN.x + 20, SCREEN.y + 40, { font: F.jp(700, 20), color: C.ink2, alpha: g });
    }
    tag(ctx, SCREEN.x + SCREEN.w - 18, SCREEN.y + 20, '新しい会話', { font: F.jp(700, 15), h: 28, padX: 10, fill: C.ink2, color: '#fff', align: 'right', alpha: pop('fresh') });
    // when each slot comes up, and how far the screen has scrolled to keep the newest in view
    const bubIn = [at('a'), at('a') + 0.15, at('seem') - lead, a2At[0] + TOK, q3In, a3At[0] + TOK, ...moreAt.map((s) => s + 0.1)];
    const bottom = SCREEN.y + SCREEN.h - 16;
    const scroll = B.reduce((m, b, i) => Math.max(m, tw(t, bubIn[i], 0.45, inOutCubic) * Math.max(0, b.y + b.L.h - bottom)), 0);
    const landedA2 = upto(toks.a2, a2At);
    const landedA3 = upto(toks.a3, a3At);
    const landedBad = upto(toks.bad, badAt);
    const landedAM = upto(toks.am, amAt);
    ctx.save();
    ctx.beginPath();
    ctx.rect(SCREEN.x + 2, SCREEN.y + 54, SCREEN.w - 4, SCREEN.h - 58);
    ctx.clip();
    ctx.translate(0, -scroll);
    const bubAlpha = (i) => (i < 2 ? enter(t, at('a'), pace, i + 1) : tw(t, bubIn[i], 0.25)) * old;
    const bubChars = [1, 1, 1, landedA2(t - 0.12), 1, landedA3(t - 0.12)];
    B.forEach((b, i) => {
      const a = bubAlpha(i);
      if (a <= 0) return;
      const fill = b.role === 'user' ? C.blueSoft : C.panel;
      if (b.more) {
        moreBubble(ctx, b, fill, a);
        return;
      }
      bubble(ctx, b.x, b.y, b.L, { fill, alpha: a, chars: bubChars[i] });
    });
    // the answer to「二日です」alone, until sentence c takes it back
    bubble(ctx, bad.x, bad.y, bad.L, { fill: C.panel, alpha: tw(t, badAt[0] + TOK, 0.25) * rewind, chars: landedBad(t - 0.12) });
    // rings: sentence a (the user answers the question), b3 (the question it forgot)
    const seem = lit(['seem'], at('a.end'))[0];
    const huh = lit(['huh'], at('b3.end'))[0] * rewind;
    [[1, Math.max(seem, huh)], [2, seem]].forEach(([i, lv]) => ring(ctx, B[i].x - 4, B[i].y - 4, B[i].L.w + 8, B[i].L.h + 8, lv, C.accent, 24));
    ring(ctx, bad.x - 4, bad.y - 4, bad.L.w + 8, bad.L.h + 8, huh, C.accent, 24);
    ctx.restore();
    // what has scrolled up fades under the screen's head
    if (scroll > 0) {
      const top = SCREEN.y + 54;
      const fade = ctx.createLinearGradient(0, top, 0, top + 30);
      fade.addColorStop(0, '#fff');
      fade.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fade;
      ctx.fillRect(SCREEN.x + 2, top, SCREEN.w - 4, 30);
    }
    // the next conversation
    BM.forEach((b, i) => {
      const a = i === 0 ? tw(t, mIn, 0.25) : tw(t, amAt[0] + TOK, 0.25);
      bubble(ctx, b.x, b.y, b.L, { fill: b.role === 'user' ? C.blueSoft : C.panel, alpha: a, chars: i === 0 ? 1 : landedAM(t - 0.12) });
    });

    // ——— the LLM, and the app: its frame with the document, and its box
    appFrame(ctx, L, g, { name: '' });
    llmBlock(ctx, L, g, { glow: llmGlow });
    const onlyHot = span(t, at('only') - lead, at('b.end')) > 0.5;
    channel(ctx, L.read, g, { hot: onlyHot });
    channel(ctx, L.write, g);
    tag(ctx, L.llm.x + L.llm.w / 2, L.llm.y + L.llm.h + 24, 'パラメータは変わらない', { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: pop('fixed') });
    tag(ctx, L.llm.x + L.llm.w / 2, L.llm.y + L.llm.h + 66, '渡された文書だけを読む', { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: pop('only') });
    // screen ↔ the app's box: what the user says comes in, the answer goes out
    if (g > 0) {
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = ctx.fillStyle = talkHot ? C.accent : C.ink2;
      arrow(ctx, LINK.x2, LINK.talk, LINK.x1, LINK.talk, g, 11);
      ctx.strokeStyle = ctx.fillStyle = backHot ? C.accent : C.ink2;
      arrow(ctx, LINK.x1, LINK.back, LINK.x2, LINK.back, g, 11);
      ctx.restore();
      const mid = (LINK.x1 + LINK.x2) / 2;
      text(ctx, '会話', mid, LINK.talk - 12, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: g });
      text(ctx, '答え', mid, LINK.back + 27, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: g });
    }
    text(ctx, 'やりとりを全部つないで渡す', ACT.x - 22, ACT.y + ACT.h / 2 + 7, { font: F.jp(500, 19), color: C.ink2, align: 'right', alpha: pop('all') * old });

    // the document
    const landed = (marks, i) => t >= marks[i] + FLY;
    const textIn = (marks, i) => tw(t, marks[i] + FLY - 0.1, pace.enter);
    const sumDy = -lift * sumP;
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.doc.x, L.doc.y, L.doc.w, L.doc.h);
    ctx.clip();
    // sentence b2: only what came in
    if (rewind > 0) {
      if (landed(nMarks, 0)) docEntry(ctx, EN[0], textIn(nMarks, 0) * rewind, { tagAlpha: 0 });
      const c = landedBad(t);
      if (c > 0) docEntry(ctx, EN[1], rewind, { tagAlpha: 0, chars: c });
    }
    // sentence c on: the whole conversation
    if (old > 0) {
      const entryA = [0, 1, 2].map((i) => textIn(fMarks, i));
      EF.forEach((e, i) => {
        const dy = i < 4 ? 0 : sumDy;
        ctx.save();
        ctx.translate(0, dy);
        ctx.globalAlpha = old * (i < 4 ? 1 - sumP : 1);
        if (i < 3) docEntry(ctx, e, entryA[i], { tagAlpha: 0 });
        else if (i === 3) docEntry(ctx, e, 1, { tagAlpha: 0, chars: landedA2(t) });
        else if (i === 4) docEntry(ctx, e, textIn(t3Marks, 0), { tagAlpha: 0 });
        else if (i === 5) docEntry(ctx, e, 1, { tagAlpha: 0, chars: landedA3(t) });
        else moreLine(ctx, e, tw(t, moreAt[i - 6] + FLY - 0.1, pace.enter));
        // sentence h: the oldest part, crossed out
        if (i < 4 && cut > 0 && t >= fMarks[0]) {
          ctx.globalAlpha *= clamp(cut * 3);
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 3;
          e.rows.forEach((r, k) => {
            const y = e.y + 14 + k * e.lh;
            const w = measure(ctx, e.font, r);
            line(ctx, e.tx - 6, y, e.tx + w + 6, y, outCubic(seg(cut, i * 0.12, i * 0.12 + 0.6)));
          });
        }
        ctx.restore();
      });
      // the summary in their place
      docEntry(ctx, sum, sumP * old, { tagAlpha: 0, color: C.green });
    }
    // sentence i on: the next conversation; the memo comes in at its head
    const mDy = (EM[1].y - EM[0].y) * (1 - memP);
    if (t >= mMarks[0] + FLY - 0.1) {
      ctx.save();
      ctx.translate(0, -mDy);
      docEntry(ctx, EM[1], textIn(mMarks, 0), { tagAlpha: 0 });
      const c = landedAM(t);
      if (c > 0) docEntry(ctx, EM[2], 1, { tagAlpha: 0, chars: c });
      ctx.restore();
    }
    ctx.restore();
    // the memo, on its way from the card to the head of the document
    if (memP > 0) {
      const from = { x: CARD.x + 14 - EM[0].x, y: CARD.y + CARD.h + 8 - EM[0].y };
      ctx.save();
      ctx.translate(from.x * (1 - memP), from.y * (1 - memP));
      docEntry(ctx, EM[0], clamp(memP * 4), { edge: BY.app });
      ctx.restore();
    }

    // the marks the app has written, each edged in its colour
    const mark = (e, a, dy = 0) => {
      if (a > 0) roleMark(ctx, e.x, e.y + 1 + dy, ROLE[e.role], { edge: BY.app, alpha: a });
    };
    nMarks.forEach((s, i) => landed(nMarks, i) && mark(EN[i], rewind));
    fMarks.forEach((s, i) => landed(fMarks, i) && mark(EF[i], old * (1 - sumP)));
    t3Marks.forEach((s, i) => landed(t3Marks, i) && mark(EF[4 + i], old, sumDy));
    moreAt.forEach((s, k) => t >= s + FLY && mark(EF[6 + k], old, sumDy));
    if (t >= sumMark + FLY) mark(sum, old);
    mMarks.forEach((s, i) => landed(mMarks, i) && mark(EM[1 + i], 1, -mDy));

    // sentence c1: the earlier turns are written down; d2: and they were read last time too
    const prev = lit(['prev'], at('fit') + 0.4)[0];
    const reuse = lit(['reuse'], at('d2.end'))[0];
    const span4 = (n) => EF[n - 1].y + EF[n - 1].h - EF[0].y;
    ring(ctx, L.doc.x + 6, EF[0].y - 8, L.doc.w - 12, span4(3) + 16, prev, C.accent, 12);
    ring(ctx, L.doc.x + 6, EF[0].y - 8, L.doc.w - 12, span4(4) + 16, reuse, C.accent, 12);
    tag(ctx, L.doc.x + L.doc.w - 14, EF[3].y + EF[3].h + 14, '前の計算を使い回せる（9 章）', { font: F.jp(700, 15), h: 28, padX: 9, fill: C.accent, color: '#fff', align: 'right', alpha: pop('reuse') * (1 - tw(t, at('e') - lead, 0.4)) });
    // sentence i3: the memo is what lets it answer
    const use = lit(['use'], at('i3.end'))[0];
    ring(ctx, EM[0].x - 4, EM[0].y - 5, L.doc.w - 28, EM[0].h + 10, use, C.accent, 10);

    // the reads: the app hands the document over, from its head
    sweep(ctx, L, seg(t, nRead, nRead + 0.9), EN[1].y + MARK_H);
    send(ctx, L.read, seg(t, nRead + 0.35, nRead + 0.95), '', 'doc');
    sweep(ctx, L, seg(t, fRead, fRead + 1.0), EF[3].y + MARK_H);
    send(ctx, L.read, seg(t, fRead + 0.4, fRead + 1.0), '', 'doc');
    sweep(ctx, L, seg(t, t3Read, t3Read + 0.9), EF[5].y + MARK_H);
    send(ctx, L.read, seg(t, t3Read + 0.35, t3Read + 0.95), '', 'doc');
    sweep(ctx, L, seg(t, mRead, mRead + 1.0), EM[2].y + MARK_H);
    send(ctx, L.read, seg(t, mRead + 0.4, mRead + 1.0), '', 'doc');

    // ——— the memo the app keeps (sentence i2)
    const ca = pop('mem');
    if (ca > 0) {
      ctx.save();
      ctx.globalAlpha = ca;
      rr(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 14);
      ctx.fillStyle = C.purpleSoft;
      ctx.fill();
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      text(ctx, '保存したメモ', CARD.x + 16, CARD.y + 32, { font: F.jp(700, 16), color: C.purple, alpha: ca });
      text(ctx, MEMO, CARD.x + 16, CARD.y + 68, { font: F.jp(500, 21), color: C.ink, alpha: ca });
    }
    tag(ctx, CARD.x + CARD.w + 14, CARD.y + CARD.h / 2 - 15, 'メモリー機能', { font: F.jp(700, 16), h: 30, padX: 10, fill: C.ink, color: '#fff', alpha: pop('name') });

    // ——— the app's box, over the frame
    actor(ctx, ACT, g, actGlow);

    // ——— in flight: the app's marks out of its box, the LLM's tokens along the write channel
    const from = { x: ACT.x + 24, y: ACT.y + ACT.h - MARK_H / 2 - 6 };
    const fly = (e, s0, a = 1, dy = 0) => {
      const p = seg(t, s0, s0 + FLY);
      if (p <= 0 || p >= 1 || a <= 0) return;
      const q = inOutCubic(p);
      roleMark(ctx, lerp(from.x, e.x, q), lerp(from.y, e.y + 1 + dy, q) + Math.sin(Math.PI * q) * 16, ROLE[e.role], { edge: BY.app, alpha: clamp(p * 6) * a });
    };
    nMarks.forEach((s, i) => fly(EN[i], s));
    fMarks.forEach((s, i) => fly(EF[i], s));
    t3Marks.forEach((s, i) => fly(EF[4 + i], s));
    moreAt.forEach((s, k) => fly(EF[6 + k], s));
    mMarks.forEach((s, i) => fly(EM[1 + i], s, 1, -(EM[1].y - EM[0].y)));
    // the summary's mark comes out of the box too
    fly(sum, sumMark);
    // tokens: down the frame's margin, along a lane under the entry, and up into place
    const margin = L.write.x2 - 2;
    const fromLLM = [L.write.x1, L.write.y];
    const write = (list, ts, E, dy = 0) => {
      const laneY = E.y + dy + E.h + 22;
      list.forEach((tk, k) => {
        const p = seg(t, ts[k], ts[k] + TOK);
        if (p <= 0 || p >= 1) return;
        const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
        const x = tk.x + w / 2;
        const pt = onPath([fromLLM, [margin, L.write.y], [margin, laneY], [x, laneY], [x, tk.y + dy]], inOutCubic(p));
        token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
      });
    };
    write(toks.bad, badAt, EN[1]);
    write(toks.a2, a2At, EF[3]);
    write(toks.a3, a3At, EF[5]);
    write(toks.am, amAt, EM[2]);

    // ——— how long each read is, against the window
    const cg = enter(t, at('e'), pace) * old;
    if (cg > 0) {
      text(ctx, '1 回ごとのコンテクストの長さ', CHART.x, CHART.y - 18, { font: F.jp(700, 18), color: C.ink2, alpha: cg });
      ctx.save();
      ctx.globalAlpha = cg;
      ctx.fillStyle = C.rule;
      ctx.fillRect(CHART.x, CHART.y + CHART.h, CHART.w, 2);
      ctx.restore();
    }
    const unit = (CHART.h - 14) / 7.4;
    const limitY = CHART.y + CHART.h - WIN * unit;
    const bw = 46;
    const barX = [0, 1, 2, 3].map((k) => CHART.x + 14 + k * 66 + (k === 3 ? 34 : 0));
    const grow = lit(['grow'], at('e.end'))[0];
    const over = pop('over');
    READ.forEach((v, k) => {
      const s0 = k < 3 ? at('grow') - lead + k * 0.25 : at('f') - lead + 0.15;
      const a = tw(t, s0, pace.enter) * cg;
      if (a <= 0) return;
      const val = k === 3 ? lerp(v, SHORT, sumP) : v;
      const h = unit * val * outCubic(seg(t, s0, s0 + (k === 3 ? 1.6 : 0.6)));
      const x = barX[k];
      const base = CHART.y + CHART.h;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = C.ink;
      ctx.fillRect(x, base - h, bw, h);
      // what passes the window
      if (h > WIN * unit && over > 0) {
        ctx.globalAlpha = a * over;
        ctx.fillStyle = C.red;
        ctx.fillRect(x, base - h, bw, h - WIN * unit);
      }
      ctx.restore();
      text(ctx, k < 3 ? `${k + 1} 回目` : '…', x + bw / 2, base + 24, { font: F.jp(500, 15), color: C.ink2, align: 'center', alpha: a });
    });
    ring(ctx, barX[0] - 8, CHART.y + CHART.h - unit * READ[2] - 10, barX[2] + bw - barX[0] + 16, unit * READ[2] + 18, grow, C.accent, 8);
    // the window's limit
    const la = pop('limit') * cg;
    if (la > 0) {
      ctx.save();
      ctx.globalAlpha = la;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 7]);
      line(ctx, CHART.x, limitY, CHART.x + CHART.w, limitY, outCubic(la));
      ctx.restore();
      text(ctx, 'ウィンドウの上限', CHART.x, limitY - 10, { font: F.jp(700, 16), color: C.accent, alpha: la });
    }
    // what the app may do at the limit (sentences h and h2)
    const ways = [['上限での扱い：', 'cut'], ['省く', 'cut'], ['／要約する', 'sum'], ['／エラーで止める', 'err']];
    let wx = CHART.x;
    ways.forEach(([s, name], i) => {
      wx += text(ctx, s, wx, CHART.y + CHART.h + 54, { font: F.jp(i ? 700 : 500, 15), color: i ? C.ink : C.ink2, alpha: pop(name) * cg });
    });

    // ——— the key to the edges, under the LLM
    const ka = enter(t, at('a'), pace);
    if (ka > 0) {
      text(ctx, '印の外枠の色', KEY.x, KEY.y, { font: F.jp(700, 16), color: C.muted, alpha: ka });
      const w = roleMark(ctx, KEY.x + 5, KEY.y + 22, { name: '印', fill: C.panel, color: C.ink2 }, { edge: BY.app, alpha: ka });
      text(ctx, 'アプリが付ける', KEY.x + 5 + w + 16, KEY.y + 22 + MARK_H / 2 + 1, { font: F.jp(500, 17), color: C.ink2, base: 'middle', alpha: ka });
    }

    example(ctx, L.app.x, L.app.y + L.app.h + 22, g, '会話、長さ、上限、メモは説明のための例');
  },
});

// A turn of the fast-forward in the document: its words as a grey line.
function moreLine(ctx, e, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, e.tx, e.y + 8, measure(ctx, e.font, e.rows[0]), 12, 6);
  ctx.fillStyle = C.rule;
  ctx.fill();
  ctx.restore();
}

// …and on the screen: a bubble with grey lines for words.
function moreBubble(ctx, b, fill, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, b.x, b.y, b.L.w, b.L.h, 22);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  b.L.lines.forEach((l, i) => {
    rr(ctx, b.x + b.L.pad, b.y + b.L.pad + b.L.size * 0.62 - 6 + i * b.L.lh, measure(ctx, b.L.font, l), 12, 6);
    ctx.fill();
  });
  ctx.restore();
}
