// 4-2: a chat is one document. The chat screen shows bubbles; what the user types there is what
// people usually call the prompt. The LLM reads one text, which the app writes from the
// conversation: every turn after a mark saying whose it is, and at the end
// an assistant mark alone, with room after it — this whole text is the context passed to the LLM
// this time (3-1), and the system prompt added later is part of it too. What the LLM writes there is the reply; it ends
// with a mark of its own, where the app stops and shows the reply as a bubble. At the head, the
// app's own instructions under a system mark. The parts and their places are those of the tool
// diagram of chapters 5–7 (lib/rig.js): the LLM on the left, the app with its document in the
// middle; the chat screen stands where the tool will. The marks are drawn generically; a real
// format (gpt-oss's) is shown at the end. The conversation is an example.
//
// Who writes what, and who acts on it (Boss, 2026-10-15): the app is a frame holding the
// document plus a box for the program that acts (ACT, in the app's colour). Every mark has an
// outer edge in the colour of its writer (rig.js BY). The role marks and the open assistant mark
// are the app's and fly out of its box; the LLM reads the open mark and writes on from it. The
// reply and its end mark are the LLM's and come along the write channel, token by token; the
// app watches for the end mark and stops the writing, and passes the reply on to the screen.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, bubbleLayout, bubble } from '../lib/parts.js';
import { layout, llmBlock, appFrame, channel, docLayout, docEntry, docEnd, rowAt, sweep, send, roleMark, markWidth, MARK_H, ROLE, BY } from '../lib/rig.js';
import { text, measure, rr, arrow, path } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

const L0 = layout();
// The app's acting box sits at the top right of its frame, by the screen; the document moves
// down to make room.
const ACT = { x: L0.app.x + L0.app.w - 22 - 200, y: L0.app.y + 22, w: 200, h: 92 };
const L = { ...L0, doc: { x: L0.app.x + 22, y: ACT.y + ACT.h + 20, w: L0.app.w - 44, h: L0.app.y + L0.app.h - 22 - (ACT.y + ACT.h + 20) } };
const SCREEN = { x: 1150, y: L0.app.y, w: W - M.r - 1150, h: 620 };
// screen ↔ the app's box
const LINK = { x1: ACT.x + ACT.w + 12, x2: SCREEN.x - 12, talk: ACT.y + ACT.h / 2 - 18, back: ACT.y + ACT.h / 2 + 18 };
// the key to the edges, under the LLM
const KEY = { x: L0.llm.x, y: 664 };

const TURNS = [
  ['user', 'おすすめの本を教えて'],
  ['assistant', 'どんなジャンルが好きですか？'],
  ['user', '推理小説がいいな'],
];
// the reply as the LLM writes it, one token at a time (as o200k_base cuts it)
const REPLY_TOKENS = ['それ', 'なら', '、', 'まず', '古', '典', 'の', '名', '作', 'から', '読む', 'の', 'がお', 'すすめ', 'です', '。'];
const REPLY = REPLY_TOKENS.join('');
const SYSTEM = 'あなたは、ていねいに答えるアシスタントです。';
const END = { name: '答えの終わり', fill: C.ink, color: C.paper };
// gpt-oss's harmony format, the start of the same conversation (one real way to write the
// marks); the marks in the app's colour
const REAL = [['<|start|>', true], ['user', true], ['<|message|>', true], ['おすすめの本を教えて', false], ['<|end|>', true]];

const FLY = 0.55; // a mark flying out of the app's box
const TOK = 0.42; // a token along the write channel
const EOT = 0.75; // the end mark along the write channel

const span = (t, a, b, rise = 0.25, fall = 0.35) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));

// A point fraction e along a polyline (even speed).
function onPath(pts, e) {
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let d = lens.reduce((a, b) => a + b, 0) * e;
  let i = 0;
  while (i < lens.length - 1 && d > lens[i]) d -= lens[i++];
  const u = lens[i] ? Math.min(1, d / lens[i]) : 0;
  return { x: lerp(pts[i][0], pts[i + 1][0], u), y: lerp(pts[i][1], pts[i + 1][1], u) };
}

export default clip({
  id: 'template',
  title: '会話は一本の文書',
  kicker: 'チャットのしくみ',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'チャットボットの画面では、{bub}こちらの質問と、\nモデルの答えが、吹き出しで交互に並んでいるわね。' },
    { id: 'a2', still: true, text: '生成 AI を使う場面では、{pr}ユーザーが直接入力するこの文を、\nふつう、プロンプトと呼ぶわ。' },
    { id: 'b', text: 'でも、LLM が読んでいるのは、{doc}吹き出しではなく、\n一本につながった文書なの。' },
    { id: 'c', text: '画面と LLM の間で、{app}会話を受け渡すプログラムを、\nここではアプリと呼ぶわ。' },
    { id: 'c2', text: '{fmt0}会話を一本の文書に整えるのも、アプリの仕事なの。' },
    { id: 'd', text: 'アプリは、発言の前に、{marks}だれの発言かを表す印を付けるの。' },
    { id: 'd2', still: true, text: '{user}この例では、こちらの発言に「ユーザー」、\n{asst}モデルの発言に「アシスタント」の印を付けているの。' },
    { id: 'e', text: 'そして最後に、{open}アシスタントの発言が始まる印まで、\n書いておくの。' },
    { id: 'e2', still: true, text: 'LLM に渡すときは、{whole}こうして整えた文書の全体が、\nコンテクストになるの。' },
    { id: 'f', lead: 1.1, text: 'LLM は、{look}この印を読んで、{reply}その先に、\nアシスタントの発言を書いていくわ。' },
    { id: 'g', text: '{eot}答えの終わりを表す印も、LLM が書くの。' },
    { id: 'g2', text: 'アプリは、{stop}この印を見つけたら、\n{halt}LLM に書かせるのを止めるわ。' },
    { id: 'g3', still: true, text: 'アプリは、{show}LLM が書いている途中から、\n答えを画面に出していくこともあるわ。' },
    { id: 'h', text: '会話には、{sys}アプリからの指示を入れることもできるわ。\nこの例では、頭に「システム」という印で置いているの。' },
    { id: 'i', by: 'zunda', text: '{q}見えないところで、指示されていたのだ？' },
    { id: 'j', text: 'そうよ。{tone}口調や、答えるときに気をつけてほしいことを、\nここで伝えるの。' },
    { id: 'j2', still: true, text: 'この指示は、{sp}システムプロンプトと呼ばれているわ。\n{part}これも、コンテクストの一部なの。' },
    { id: 'k', tail: 0.8, text: '印の書き方は、{fmt}使うモデルに合わせる必要があるわ。\nここで描いたのは、説明のための形なの。' },
  ],

  prepare(ctx) {
    const E = docLayout(ctx, L, [{ role: 'system', text: SYSTEM }, ...TURNS.map(([role, s]) => ({ role, text: s })), { role: 'assistant', text: REPLY }], {
      top: 30, gap: 26, font: F.jp(500, 25), lh: 38,
    });
    const bubbles = [...TURNS, ['assistant', REPLY]].map(([role, s]) => ({ role, L: bubbleLayout(ctx, s, SCREEN.w - 64, { font: F.jp(500, 21), pad: 16 }) }));
    let y = SCREEN.y + 70;
    bubbles.forEach((b) => {
      b.x = b.role === 'user' ? SCREEN.x + SCREEN.w - 20 - b.L.w : SCREEN.x + 20;
      b.y = y;
      y += b.L.h + 16;
    });
    // where each token of the reply lands (its first character), and how much of the reply is
    // written once it has
    const R = E[4];
    let row = 0;
    let col = 0;
    let chars = 0;
    const total = Array.from(REPLY).length;
    const toks = REPLY_TOKENS.map((s) => {
      const n = Array.from(s).length;
      while (row < R.rows.length - 1 && col >= Array.from(R.rows[row]).length) {
        col -= Array.from(R.rows[row]).length;
        row++;
      }
      const at = rowAt(R, row);
      const x = at.x + measure(ctx, R.font, Array.from(R.rows[row]).slice(0, col).join(''));
      col += n;
      chars += n;
      return { s, x, y: at.y - 9, upto: chars / total };
    });
    // the end mark, after the reply's last row
    const last = rowAt(R, R.rows.length - 1);
    const end = { x: last.x + measure(ctx, R.font, R.rows[R.rows.length - 1]) + 16, y: last.y - 22, w: markWidth(ctx, END.name) };
    return { E, bubbles, toks, end };
  },

  draw(ctx, t, { E, bubbles, toks, end }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    // ——— when things happen
    // the app writes the marks: the three turns' (sentence d), the open one (e), the system's (h)
    const markAt = [at('sys') - lead + 0.35, ...[0, 1, 2].map((i) => at('marks') - lead + i * 0.18), at('open') - lead];
    // the LLM writes the reply, token by token, then the end mark
    const tA = at('reply') - 0.15;
    const tB = at('f.end');
    const tokAt = toks.map((_, k) => tA + (k * (tB - TOK - tA)) / (toks.length - 1));
    const landed = (time) => toks.reduce((u, tk, k) => (time >= tokAt[k] + TOK ? tk.upto : u), 0);
    const eotAt = at('eot') - lead;
    // who is at work
    const actGlow = Math.max(
      span(t, at('fmt0') - lead, at('fmt0') - lead + 1.3),
      span(t, markAt[1], markAt[3] + FLY),
      span(t, markAt[4], markAt[4] + FLY),
      span(t, at('f'), at('f') + 1.05),
      span(t, at('g2'), at('halt') + 0.6),
      span(t, at('g3'), at('g3.end') - cue.fall),
      span(t, markAt[0] - 0.2, markAt[0] + FLY),
    );
    const llmGlow = span(t, at('look') - lead, at('halt'));

    // ——— the chat screen
    const sa = enter(t, at('a'), pace);
    if (sa > 0) {
      ctx.save();
      ctx.globalAlpha = sa;
      rr(ctx, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 20);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      text(ctx, 'チャットの画面', SCREEN.x + 20, SCREEN.y + 40, { font: F.jp(700, 20), color: C.ink2, alpha: sa });
    }
    // the reply shows in its bubble as the app passes it on
    bubbles.forEach((b, i) => {
      const a = i < 3 ? enter(t, at('a'), pace, i + 1) : tw(t, tA + TOK, 0.2);
      bubble(ctx, b.x, b.y, b.L, { fill: b.role === 'user' ? C.blueSoft : C.panel, alpha: a, chars: i < 3 ? 1 : landed(t - 0.12) });
    });
    const shown = focus(t, [at('show')], at('g3.end') - cue.fall, cue).level[0];
    ring(ctx, bubbles[3].x, bubbles[3].y, bubbles[3].L.w, bubbles[3].L.h, shown, C.accent, 22);
    const bub = focus(t, [at('bub')], at('a.end') - cue.fall, cue).level[0];
    ring(ctx, SCREEN.x + 8, bubbles[0].y - 4, SCREEN.w - 16, bubbles[2].y + bubbles[2].L.h - bubbles[0].y + 8, bub, C.accent, 14);
    // sentence a2: what the user types is what people call the prompt (a key in the screen's head)
    const pa = pop('pr');
    if (pa > 0) {
      const kx = SCREEN.x + SCREEN.w - 20;
      const kw = text(ctx, 'プロンプト', kx, SCREEN.y + 40, { font: F.jp(700, 18), color: C.accent, align: 'right', alpha: pa });
      ctx.save();
      ctx.globalAlpha = pa;
      rr(ctx, kx - kw - 34, SCREEN.y + 25, 26, 18, 6);
      ctx.fillStyle = C.blueSoft;
      ctx.fill();
      ctx.restore();
    }
    const prLit = focus(t, [at('pr')], at('a2.end') - cue.fall, cue).level[0];
    [0, 2].forEach((i) => ring(ctx, bubbles[i].x - 4, bubbles[i].y - 4, bubbles[i].L.w + 8, bubbles[i].L.h + 8, prLit, C.accent, 22));

    // ——— the LLM, and the app: its frame with the document, and its box
    const da = pop('doc');
    const aa = pop('app');
    appFrame(ctx, L, da, { name: '' });
    text(ctx, '会話を一本の文書に整える', ACT.x - 22, ACT.y + ACT.h / 2 + 7, { font: F.jp(500, 19), color: C.ink2, align: 'right', alpha: pop('fmt0') });
    llmBlock(ctx, L, da, { glow: llmGlow });
    channel(ctx, L.read, tw(t, at('doc') - lead, 0.6, inOutCubic));
    channel(ctx, L.write, tw(t, at('look') - lead, 0.6, inOutCubic));
    // screen ↔ the app's box: the conversation comes in, the reply goes out
    const link = tw(t, at('app') - lead, 0.6, inOutCubic);
    if (link > 0) {
      const talkHot = span(t, at('fmt0') - lead, at('fmt0') - lead + 1.3) > 0.5;
      const back = tw(t, at('reply') - lead, 0.5, inOutCubic);
      const backHot = span(t, tA, tB + 0.3) > 0.5 || shown > 0.5;
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = ctx.fillStyle = talkHot ? C.accent : C.ink2;
      arrow(ctx, LINK.x2, LINK.talk, LINK.x1, LINK.talk, link, 11);
      ctx.strokeStyle = ctx.fillStyle = backHot ? C.accent : C.ink2;
      arrow(ctx, LINK.x1, LINK.back, LINK.x2, LINK.back, back, 11);
      ctx.restore();
      const mid = (LINK.x1 + LINK.x2) / 2;
      text(ctx, '会話', mid, LINK.talk - 12, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: link });
      text(ctx, '答え', mid, LINK.back + 27, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: back });
    }

    // the document: before sentence h, the turns sit where the system entry will go
    const sysA = tw(t, markAt[0] + FLY - 0.1, pace.enter);
    const shift = (E[1].y - E[0].y) * (1 - inOutCubic(seg(t, at('sys') - lead, at('sys') - lead + 0.7)));
    const roles = focus(t, [at('user'), at('asst')], at('d2.end') - cue.fall, cue);
    const tone = [...focus(t, [at('q'), at('tone')], at('j.end') - cue.fall, cue).level, focus(t, [at('part')], at('j2.end') - cue.fall, cue).level[0]];
    const spA = pop('sp');
    const done = (i) => t >= markAt[i] + FLY;
    const written = landed(t);
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.doc.x, L.doc.y, L.doc.w, L.doc.h);
    ctx.clip();
    E.forEach((e, i) => {
      const dy = i === 0 ? 0 : -shift;
      ctx.save();
      ctx.translate(0, dy);
      if (i === 0) {
        docEntry(ctx, e, sysA, { tagAlpha: 0 });
        tag(ctx, L.doc.x + L.doc.w - 14, e.y + e.h + 4, 'システムプロンプト', { font: F.jp(700, 14), h: 26, padX: 9, fill: C.ink2, color: '#fff', align: 'right', alpha: spA });
        if (Math.max(...tone) > 0) {
          ring(ctx, e.x - 4, e.y - 4, L.doc.w - 28, e.h + 8, Math.max(...tone), C.accent, 10);
        }
      } else if (i < 4) {
        const a = tw(t, at('fmt0') - lead + (i - 1) * 0.3, pace.enter);
        const role = e.role === 'user' ? 0 : 1;
        const dim = roles.any > 0 && roles.level[role] < 0.5;
        docEntry(ctx, e, a, { tagAlpha: 0, dim });
      } else if (written > 0) {
        // the reply, as far as the LLM has written it
        docEntry(ctx, e, 1, { tagAlpha: 0, chars: written });
      }
      ctx.restore();
    });
    ctx.restore();
    // the marks the app has written, each edged in its colour
    E.forEach((e, i) => {
      if (!done(i)) return;
      const dim = i > 0 && i < 4 && roles.any > 0 && roles.level[e.role === 'user' ? 0 : 1] < 0.5;
      roleMark(ctx, e.x, e.y + 1 - (i === 0 ? 0 : shift), ROLE[e.role], { edge: BY.app, alpha: dim ? 0.38 : 1 });
    });
    const R = E[4];
    const rY = R.y - shift;
    // sentence f: the LLM reads the open mark; a cursor waits after it until the first token
    const look = focus(t, [at('look')], at('reply') + 0.4, cue).level[0];
    ring(ctx, R.x - 3, rY - 3, markWidth(ctx, ROLE.assistant.name) + 6, MARK_H + 8, look, C.accent, 10);
    if (done(4) && written <= 0 && Math.floor(t * 2.5) % 2 === 0) {
      const at0 = rowAt(R, 0);
      ctx.fillStyle = C.accent;
      ctx.fillRect(at0.x, at0.y - 24 - shift, 4, 30);
    }
    // the end mark: written by the LLM, edged in its ink
    const ep = seg(t, eotAt, eotAt + EOT);
    if (ep >= 1) roleMark(ctx, end.x, end.y - shift, END, { edge: BY.llm });
    // sentence g2: the app finds it, and stops the writing
    const seen = focus(t, [at('stop')], at('halt') + 0.5, cue).level[0];
    ring(ctx, end.x - 3, end.y - shift - 3, end.w + 6, MARK_H + 8, seen, C.accent, 10);
    const sight = span(t, at('stop') - lead, at('g2.end'));
    if (sight > 0) {
      const p = tw(t, at('stop') - lead, 0.4, inOutCubic);
      ctx.save();
      ctx.globalAlpha = sight;
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 6]);
      // down the document's right margin, clear of the text, then across to the mark
      const x = L.doc.x + L.doc.w - 16;
      const y = end.y - shift + MARK_H / 2;
      path(ctx, [[x, ACT.y + ACT.h + 4], [x, y], [end.x + end.w + 10, y]], p);
      ctx.setLineDash([]);
      ctx.restore();
    }
    const halt = pop('halt') * (1 - tw(t, at('h') - lead, 0.4));
    if (halt > 0) {
      const cx = (L.write.x1 + L.write.x2) / 2;
      const w = measure(ctx, F.jp(700, 16), '止める') + 44;
      ctx.save();
      ctx.globalAlpha = halt;
      rr(ctx, cx - w / 2, L.write.y - 15, w, 30, 15);
      ctx.fillStyle = C.purple;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - w / 2 + 13, L.write.y - 5, 10, 10);
      ctx.restore();
      text(ctx, '止める', cx - w / 2 + 31, L.write.y + 1, { font: F.jp(700, 16), color: '#fff', base: 'middle', alpha: halt });
    }

    // sentence e2: the whole document, up to the open mark, is the context passed to the LLM
    const wa = pop('whole') * (1 - seg(t, at('f'), at('f') + 0.3));
    if (wa > 0) {
      const top = E[1].y - shift - 10;
      const bottom = E[4].y - shift + 44;
      ring(ctx, L.doc.x + 6, top, L.doc.w - 12, bottom - top, wa, C.accent, 12);
      tag(ctx, L.doc.x + L.doc.w - 6, bottom + 10, 'コンテクスト', { font: F.jp(700, 16), h: 30, padX: 10, fill: C.accent, color: '#fff', align: 'right', alpha: wa });
    }
    // the read: the app hands the document to the LLM (the lead of sentence f)
    sweep(ctx, L, seg(t, at('f') + 0.05, at('f') + 1.0), docEnd(E, 4) - shift);
    send(ctx, L.read, seg(t, at('f') + 0.45, at('f') + 1.05), '', 'doc');
    tag(ctx, L.llm.x + L.llm.w / 2, L.llm.y + L.llm.h + 24, '文書を読んで、続きを書く', { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: pop('look') });

    // ——— the app's box, over the frame
    actor(ctx, aa, actGlow);

    // ——— in flight: the app's marks out of its box, the LLM's tokens and end mark along the
    // write channel
    // the marks leave from the box's lower edge, below the note beside it
    const from = { x: ACT.x + 24, y: ACT.y + ACT.h - MARK_H / 2 - 6 };
    E.forEach((e, i) => {
      const p = seg(t, markAt[i], markAt[i] + FLY);
      if (p <= 0 || p >= 1) return;
      const q = inOutCubic(p);
      const x = lerp(from.x, e.x, q);
      const y = lerp(from.y, e.y + 1 - (i === 0 ? 0 : shift), q) + Math.sin(Math.PI * q) * 16;
      roleMark(ctx, x, y, ROLE[e.role], { edge: BY.app, alpha: clamp(p * 6) });
    });
    // along the write channel, then in under the open mark and up to the place
    const gate = [[L.write.x1, L.write.y], [L.write.x2 + 8, L.write.y], [R.tx - 14, L.write.y + 30]];
    toks.forEach((tk, k) => {
      const p = seg(t, tokAt[k], tokAt[k] + TOK);
      if (p <= 0 || p >= 1) return;
      const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
      const pt = onPath([...gate, [tk.x + w / 2, tk.y - shift]], inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
    });
    if (ep > 0 && ep < 1) {
      const pt = onPath([...gate, [end.x - 24, end.y - shift + MARK_H + 30], [end.x + end.w / 2, end.y - shift + MARK_H / 2]], inOutCubic(ep));
      roleMark(ctx, pt.x - end.w / 2, pt.y - MARK_H / 2, END, { edge: BY.llm, alpha: clamp(ep * 8) });
    }

    // ——— the key to the edges, under the LLM
    const k1 = pop('marks');
    const k2 = pop('eot');
    if (k1 > 0) {
      text(ctx, '印の外枠の色', KEY.x, KEY.y, { font: F.jp(700, 16), color: C.muted, alpha: k1 });
      const sample = { name: '印', fill: C.panel, color: C.ink2 };
      [[BY.app, 'アプリが付ける', k1], [BY.llm, 'LLM が書く', k2]].forEach(([edge, s, a], i) => {
        const y = KEY.y + 22 + i * 44;
        const w = roleMark(ctx, KEY.x + 5, y, sample, { edge, alpha: a });
        text(ctx, s, KEY.x + 5 + w + 16, y + MARK_H / 2 + 1, { font: F.jp(500, 17), color: C.ink2, base: 'middle', alpha: a });
      });
    }

    // ——— the marks as they are really written (one model's format)
    const fa = pop('fmt');
    if (fa > 0) {
      const y = L.app.y + L.app.h + 30;
      text(ctx, '印の並べ方の決まり（チャットテンプレート）の一例：gpt-oss', L.app.x, y + 2, { font: F.jp(700, 16), color: C.ink2, alpha: fa });
      let x = L.app.x + 470;
      REAL.forEach(([s, mark]) => {
        x += text(ctx, s, x, y + 2, { font: F.mono(mark ? 600 : 500, 16), color: mark ? C.purple : C.ink, alpha: fa });
      });
    }
    example(ctx, SCREEN.x, SCREEN.y + SCREEN.h + 22, sa, '会話と印は説明のための例');
  },
});

// A token on its way from the LLM: the ink of the LLM, like the edge of the marks it writes.
const TOKEN = { font: F.jp(700, 17), h: 28, padX: 8 };

function token(ctx, x, y, w, s, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, y, w, TOKEN.h, 7);
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.restore();
  text(ctx, s, x + w / 2, y + TOKEN.h / 2 + 1, { font: TOKEN.font, color: '#fff', align: 'center', base: 'middle', alpha: a });
}

// The app's box: the program that acts, in the app's colour, with a gear. glow: it is at work.
function actor(ctx, a, glow) {
  if (a <= 0.001) return;
  const cy = ACT.y + ACT.h / 2;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, ACT.x, ACT.y, ACT.w, ACT.h, 18);
  ctx.fillStyle = C.purple;
  ctx.fill();
  if (glow > 0.001) {
    ctx.save();
    ctx.globalAlpha *= clamp(glow);
    rr(ctx, ACT.x - 7, ACT.y - 7, ACT.w + 14, ACT.h + 14, 24);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }
  gear(ctx, ACT.x + 48, cy, 24, '#fff');
  ctx.restore();
  text(ctx, 'アプリ', ACT.x + 86, cy + 2, { font: F.jp(700, 32), color: '#fff', base: 'middle', alpha: a });
}

function gear(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i / 8) * Math.PI * 2);
    ctx.fillRect(-r * 0.17, -r, r * 0.34, r * 0.4);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.moveTo(r * 0.3, 0);
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();
}
