// 4-2: a chat is one document. The chat screen shows bubbles; what the user types there is what
// people usually call the prompt. The LLM reads one text, which the app writes from the
// conversation: every turn after a mark saying whose it is, and at the end
// an assistant mark alone, with room after it — this whole text is the prompt passed to the LLM
// this time (3-1), and so is the system prompt added later. What the LLM writes there is the reply; it ends
// with a mark of its own, where the app stops and shows the reply as a bubble. At the head, the
// app's own instructions under a system mark. The parts and their places are those of the tool
// diagram of chapters 5–7 (lib/rig.js): the LLM on the left, the app with its document in the
// middle; the chat screen stands where the tool will. The marks are drawn generically; a real
// format (gpt-oss's) is shown at the end. The conversation is an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, bubbleLayout, bubble, chip } from '../lib/parts.js';
import { layout, llmBlock, appFrame, channel, docLayout, docEntry, docEnd, rowAt, sweep, send } from '../lib/rig.js';
import { text, measure, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

const L = layout();
const SCREEN = { x: 1150, y: 150, w: W - M.r - 1150, h: 600 };
const TURNS = [
  ['user', 'おすすめの本を教えて'],
  ['assistant', 'どんなジャンルが好きですか？'],
  ['user', '推理小説がいいな'],
];
const REPLY = 'それなら、まず古典の名作から読むのがおすすめです。';
const SYSTEM = 'あなたは、ていねいに答えるアシスタントです。';
const END = '〈答えの終わり〉';
// gpt-oss's harmony format, the start of the same conversation (one real way to write the marks)
const REAL = '<|start|>user<|message|>おすすめの本を教えて<|end|>';

export default clip({
  id: 'template',
  title: '会話は一本の文書',
  kicker: 'チャットのしくみ',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'チャットボットの画面では、{bub}こちらの質問と、\nモデルの答えが、吹き出しで交互に並んでいるわね。' },
    { id: 'a2', still: true, text: '生成 AI を使う場面では、{pr}ユーザーが直接入力するこの文も、\nふつう、プロンプトと呼ぶわ。' },
    { id: 'b', text: 'でも、LLM が読んでいるのは、{doc}吹き出しではなく、\n一本につながった文書なの。' },
    { id: 'c', text: '画面と LLM の間で、{app}会話を受け渡すプログラムを、\nここではアプリと呼ぶわ。' },
    { id: 'c2', text: '{fmt0}会話を一本の文書に整えるのも、アプリの仕事なの。' },
    { id: 'd', text: '発言の前には、{marks}だれの発言かを表す印が付くわ。' },
    { id: 'd2', still: true, text: '{user}この例では、こちらの発言に「ユーザー」、\n{asst}モデルの発言に「アシスタント」の印を付けているの。' },
    { id: 'e', text: 'そして最後に、{open}アシスタントの発言が始まる印まで、\n書いておくの。' },
    { id: 'e2', still: true, text: 'LLM に渡すときは、{whole}こうして整えた文書の全体が、\nプロンプトになるの。' },
    { id: 'f', text: '{reply}LLM は、その先のトークンを、順に書いていくわ。' },
    { id: 'g', text: '{eot}答えが終わったことを表す印が出たら、\nアプリがそこで、書くのを止めるの。' },
    { id: 'g2', still: true, text: '{show}答えの文字は、書いている途中から、\n画面に出していくこともできるわ。' },
    { id: 'h', text: '会話には、{sys}アプリからの指示を入れることもできるわ。\nこの例では、頭に「システム」という印で置いているの。' },
    { id: 'i', by: 'zunda', text: '{q}見えないところで、指示されていたのだ？' },
    { id: 'j', text: 'そうよ。{tone}口調や、答えるときに気をつけてほしいことを、\nここで伝えるの。' },
    { id: 'j2', still: true, text: 'この指示は、{sp}システムプロンプトと呼ばれているわ。\n{part}これも、LLM に渡すプロンプトの一部なの。' },
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
    return { E, bubbles };
  },

  draw(ctx, t, { E, bubbles }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

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
    // the reply shows in its bubble as it is written
    const replyP = seg(t, at('reply') + 0.3, at('f.end'));
    const showAt = at('reply') + 0.3;
    bubbles.forEach((b, i) => {
      const a = i < 3 ? enter(t, at('a'), pace, i + 1) : tw(t, showAt, 0.2);
      bubble(ctx, b.x, b.y, b.L, { fill: b.role === 'user' ? C.blueSoft : C.panel, alpha: a, chars: i < 3 ? 1 : replyP });
    });
    const shown = focus(t, [at('show')], at('g2.end') - cue.fall, cue).level[0];
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

    // ——— the LLM and the app with its document
    const da = pop('doc');
    const aa = pop('app');
    appFrame(ctx, L, da, { name: aa > 0.5 ? 'アプリ' : '', note: '会話を一本の文書に整える', noteAlpha: pop('fmt0') });
    const writing = seg(t, at('reply') + 0.2, at('reply') + 0.5) * (1 - seg(t, at('f.end'), at('f.end') + 0.3));
    llmBlock(ctx, L, da, { glow: writing });
    const ch = tw(t, at('doc') - lead, 0.6, inOutCubic);
    channel(ctx, L.read, ch);
    channel(ctx, L.write, tw(t, at('reply') - lead, 0.6, inOutCubic));
    // screen ↔ app
    const link = tw(t, at('app') - lead, 0.6, inOutCubic);
    if (link > 0) {
      const x1 = L.app.x + L.app.w + 12;
      const x2 = SCREEN.x - 12;
      ctx.save();
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      ctx.lineWidth = 2.5;
      arrow(ctx, x2, 300, x1, 300, link, 11);
      const back = tw(t, showAt - lead, 0.5, inOutCubic);
      ctx.strokeStyle = back > 0.5 && t < at('g.end') ? C.accent : C.ink2;
      ctx.fillStyle = ctx.strokeStyle;
      arrow(ctx, x1, 360, x2, 360, back, 11);
      ctx.restore();
      text(ctx, '会話', (x1 + x2) / 2, 286, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: link });
      text(ctx, '答え', (x1 + x2) / 2, 388, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: back });
    }

    // the document: before sentence h, the turns sit where the system entry will go
    const sysA = pop('sys');
    const shift = (E[1].y - E[0].y) * (1 - inOutCubic(seg(t, at('sys') - lead, at('sys') - lead + 0.7)));
    const marks = pop('marks');
    const roles = focus(t, [at('user'), at('asst')], at('d2.end') - cue.fall, cue);
    const tone = [...focus(t, [at('q'), at('tone')], at('j.end') - cue.fall, cue).level, focus(t, [at('part')], at('j2.end') - cue.fall, cue).level[0]];
    const spA = pop('sp');
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.doc.x, L.doc.y, L.doc.w, L.doc.h);
    ctx.clip();
    E.forEach((e, i) => {
      const dy = i === 0 ? 0 : -shift;
      ctx.save();
      ctx.translate(0, dy);
      if (i === 0) {
        docEntry(ctx, e, sysA, { tagAlpha: 1 });
        tag(ctx, L.doc.x + L.doc.w - 14, e.y + e.h + 4, 'システムプロンプト', { font: F.jp(700, 14), h: 26, padX: 9, fill: C.ink2, color: '#fff', align: 'right', alpha: spA });
        if (Math.max(...tone) > 0) {
          ring(ctx, e.x - 4, e.y - 4, L.doc.w - 28, e.h + 8, Math.max(...tone), C.accent, 10);
        }
      } else if (i < 4) {
        const a = tw(t, at('fmt0') - lead + (i - 1) * 0.3, pace.enter);
        const role = e.role === 'user' ? 0 : 1;
        const dim = roles.any > 0 && roles.level[role] < 0.5;
        docEntry(ctx, e, a, { tagAlpha: marks, dim });
      } else {
        // the open assistant mark, and the reply written after it
        const open = pop('open');
        docEntry(ctx, { ...e, rows: [''] }, open, { tagAlpha: 1 });
        const rp = seg(t, at('reply') + 0.3, at('f.end'));
        if (rp > 0) docEntry(ctx, e, 1, { tagAlpha: 0, chars: rp, color: C.blue });
        // the end mark
        const ea = pop('eot');
        if (ea > 0) {
          const last = rowAt(e, e.rows.length - 1);
          const x = last.x + measure(ctx, e.font, e.rows[e.rows.length - 1]) + 10;
          chip(ctx, x, last.y - 24, END, { font: F.jp(700, 16), h: 32, padX: 10, fill: C.ink, color: C.paper, alpha: ea });
        }
        if (open > 0 && rp <= 0 && Math.floor(t * 2.5) % 2 === 0) {
          const at0 = rowAt(e, 0);
          ctx.fillStyle = C.accent;
          ctx.fillRect(at0.x, at0.y - 24, 4, 30);
        }
      }
      ctx.restore();
    });
    ctx.restore();
    // sentence e2: the whole document, up to the open mark, is the prompt as the LLM sees it
    const wa = pop('whole') * (1 - seg(t, at('reply') - lead, at('reply') + 0.3));
    if (wa > 0) {
      const top = E[1].y - shift - 10;
      const bottom = E[4].y - shift + 44;
      ring(ctx, L.doc.x + 6, top, L.doc.w - 12, bottom - top, wa, C.accent, 12);
      tag(ctx, L.doc.x + L.doc.w - 6, bottom + 10, 'LLM に渡すプロンプト', { font: F.jp(700, 16), h: 30, padX: 10, fill: C.accent, color: '#fff', align: 'right', alpha: wa });
    }
    // the read: the document goes to the LLM, and the reply comes back
    const readP = seg(t, at('reply') - lead - 0.2, at('reply') + 0.6);
    sweep(ctx, L, readP, docEnd(E, 4) - shift);
    send(ctx, L.read, seg(t, at('reply') - lead, at('reply') + 0.5), '', 'doc');
    tag(ctx, L.llm.x + L.llm.w / 2, L.llm.y + L.llm.h + 24, '文書を読んで、続きを書く', { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: pop('reply') });

    // ——— the marks as they are really written (one model's format)
    const fa = pop('fmt');
    if (fa > 0) {
      const y = L.app.y + L.app.h + 30;
      text(ctx, '印の並べ方の決まり（チャットテンプレート）の一例：gpt-oss', L.app.x, y + 2, { font: F.jp(700, 16), color: C.ink2, alpha: fa });
      text(ctx, REAL, L.app.x + 470, y + 2, { font: F.mono(500, 16), color: C.ink, alpha: fa });
    }
    example(ctx, SCREEN.x, SCREEN.y + SCREEN.h + 22, sa, '会話と印は説明のための例');
  },
});
