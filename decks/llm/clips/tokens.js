// 3-2: tokens. The sentence of the intro, in the intro's words, splits into the tokens GPT-4o
// actually uses (o200k_base): frequent runs of characters are one token, so a token can cross a
// word's edge (「、水」) and a word can fall into pieces (飲｜ん｜だ). The word edges stay above
// as brackets to compare. English mostly keeps one word to a token. Every token has a number;
// the list of all of them is the vocabulary, and each model has its own: GPT-4's (cl100k_base)
// has no 飲, so the character falls into two pieces of its bytes — which is also how any text at
// all can be written in tokens. What the LLM reads and writes is the row of numbers.
// Every split and number is real (js-tiktoken 1.0.21, 2026-10-15).

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, chip, chipWidth, source, SOURCE_RIGHT } from '../lib/parts.js';
import { strip, STRIP_BOTTOM } from '../lib/inside.js';
import { text, measure, rr } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outCubic } from '../../../src/kit/ease.js';
import { enter, focus, dimmed, ring } from '../../../src/kit/cue.js';

const SENT = 'のどがかわいたので、水を飲んだ。';
// [first character, characters] of each word (the intro's) and each o200k_base token
const WORDS = [[0, 3], [3, 4], [7, 3], [10, 2], [12, 3], [15, 1]];
const TOKS = [[0, 1], [1, 1], [2, 1], [3, 2], [5, 2], [7, 2], [9, 2], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1]];
const IDS = [3385, 18524, 6632, 119438, 98451, 69719, 131031, 7277, 132125, 6676, 11792, 788];
const MULTI = [3, 4, 5, 6]; // tokens of more than one character
const CROSS = 6; // 「、水」
const APART = [8, 9, 10]; // 飲｜ん｜だ

const EN = ['I', ' was', ' thirsty', ',', ' so', ' I', ' drank', ' water', '.'];
const EN_IDS = [40, 673, 170750, 11, 813, 357, 63713, 3411, 13];

// cl100k_base (GPT-4): 飲 (E9 A3 B2) is not in its vocabulary and falls into two byte tokens
const G4 = ['の', 'ど', 'が', 'か', 'わ', 'い', 'た', 'の', 'で', '、', '水', 'を', 'E9 A3', 'B2', 'ん', 'だ', '。'];
const BYTES = [12, 13];

const VOCAB = [[788, '。'], [3385, 'の'], [7277, 'を'], [131031, '、水'], [132125, '飲']];

const A = { font: F.jp(500, 40), h: 62, padX: 14, gap: 10, label: 134, brk: 150, y: 166, id: 254 };
const B = { font: F.sans(500, 32), h: 54, padX: 12, gap: 8, label: 318, y: 332, id: 412 };
const G = { font: F.jp(500, 30), mono: F.mono(500, 20), h: 52, padX: 12, gap: 8, label: 470, y: 484 };
const D = { y: 640 };
const DROP = 190; // the sentence stands lower until the English row needs the room

// x of every character of the sentence, with the characters grouped into chips
function charLayout(ctx, groups) {
  const xs = [];
  const chips = [];
  let x = M.l;
  for (const [i0, n] of groups) {
    const x0 = x;
    x += A.padX;
    for (let k = 0; k < n; k++) {
      xs[i0 + k] = x;
      x += measure(ctx, A.font, SENT[i0 + k]);
    }
    x += A.padX;
    chips.push({ x: x0, w: x - x0 });
    x += A.gap;
  }
  return { xs, chips };
}

export default clip({
  id: 'tokens',
  title: 'トークンに切る',
  kicker: 'トークン化',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'はじめの章では「言葉」と呼んできたけれど、\nLLM が実際に扱う単位は、{tok}トークンというものよ。' },
    { id: 'b', text: 'はじめの章の文を、{cut}[GPT-4o|ジーピーティーフォーオー] の切り方で切ってみると、\n{n12}12 個のトークンに分かれるわ。' },
    { id: 'c', by: 'zunda', text: '{q}言葉の切れ目とは、ずいぶん違うのだ。' },
    { id: 'd', text: 'この切り方では、{freq}文章によく出てくる文字の並びを、\nまとめて一つのトークンにしてあるの。' },
    { id: 'e', still: true, text: 'だから、{cross}[「、水」|「てん、みず」]のように言葉の切れ目をまたいだり、\n{apart}「飲んだ」のように、一つの言葉が分かれたりするのよ。' },
    { id: 'f', text: '英語では、{en}よく使う単語なら、前の空白も含めて、\n一つのトークンになることがよくあるの。' },
    { id: 'g', text: 'トークンには、{id}一つ一つに番号が付いているわ。' },
    { id: 'h', still: true, text: '[GPT-4o|ジーピーティーフォーオー] の切り方では、{vocab}トークンは全部で約 20 万種類あって、\nこの一覧のことを、{name}語彙と呼ぶの。' },
    { id: 'i', text: '切り方と語彙は、{model}モデルごとに決まっているのよ。\n{gpt4}[GPT-4|ジーピーティーフォー] の切り方だと、同じ文が 17 個のトークンになるわ。' },
    { id: 'j', text: 'こちらの語彙には、[「飲」|「のむ」]という字がないので、\n{byte}文字を表すもっと細かい単位で、二つに割っているの。' },
    { id: 'k', still: true, text: 'こうして細かく分ければ、{any}語彙にない文字も、\nトークンの並びで表せるわ。' },
    { id: 'l', tail: 0.6, text: 'そして、LLM が実際に読んだり書いたりしているのは、\n{seq}この番号の並びなのよ。' },
  ],

  prepare(ctx) {
    const word = charLayout(ctx, WORDS);
    const tok = charLayout(ctx, TOKS);
    const row = (list, o) => {
      let x = M.l;
      return list.map((s) => {
        const w = chipWidth(ctx, s, o);
        const out = { s, x, w };
        x += w + o.gap;
        return out;
      });
    };
    const en = row(EN, B);
    const g4 = row(G4, { ...G, font: G.font }).map((c, i) => (BYTES.includes(i) ? { ...c, w: chipWidth(ctx, c.s, { ...G, font: G.mono }) } : c));
    // re-flow the GPT-4 row with the byte chips' widths
    let x = M.l;
    g4.forEach((c) => {
      c.x = x;
      x += c.w + G.gap;
    });
    const charW = Array.from(SENT).map((ch) => measure(ctx, A.font, ch));
    return { word, tok, en, g4, charW };
  },

  draw(ctx, t, { word, tok, en, g4, charW }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    strip(ctx, { alpha: enter(t, at('a'), pace), lit: [0] });

    // ——— the sentence: the intro's words, then GPT-4o's tokens. It stands in the middle of the
    // stage until the English row comes in.
    const rise = inOutCubic(seg(t, at('f'), at('f') + 0.8));
    ctx.save();
    ctx.translate(0, DROP * (1 - rise));
    const split = inOutCubic(seg(t, at('cut') - lead, at('cut') - lead + 0.9));
    const xs = word.xs.map((x, i) => lerp(x, tok.xs[i], split));
    const g = enter(t, at('a'), pace);
    const labelA = split < 0.5 ? 'はじめの章の文（言葉で区切ったもの）' : 'GPT-4o の切り方（o200k_base）';
    text(ctx, labelA, M.l, A.label, { font: F.jp(700, 20), color: C.ink2, alpha: g * (split < 0.5 ? 1 - split * 2 : split * 2 - 1) });
    tag(ctx, W - M.r, A.label - 26, '12 トークン', { font: F.jp(700, 21), h: 36, padX: 14, fill: C.accent, color: '#fff', align: 'right', alpha: pop('n12') });

    // what is lit: sentence d the tokens of several characters, sentence e the crossing token and
    // the word in pieces, sentence l the numbers
    const fd = focus(t, [at('freq')], at('d.end') - cue.fall, cue);
    const fe = focus(t, [at('cross'), at('apart')], at('e.end') - cue.fall, cue);
    const litTok = (k) => Math.max(MULTI.includes(k) ? fd.level[0] : 0, k === CROSS ? fe.level[0] : 0, APART.includes(k) ? fe.level[1] : 0);
    const any = Math.max(fd.any, fe.any);
    const span = (_, i0, n) => ({ x: xs[i0] - A.padX, w: xs[i0 + n - 1] + charW[i0 + n - 1] - xs[i0] + A.padX * 2 });
    // chip grounds: the words fade out as the tokens come in
    WORDS.forEach(([i0, n], k) => {
      const s = span(word, i0, n);
      chipGround(ctx, s.x, A.y, s.w, A.h, C.tints[k % C.tints.length], g * (1 - split));
    });
    TOKS.forEach(([i0, n], k) => {
      const s = span(tok, i0, n);
      const a = split * dimmed(litTok(k), any, cue);
      chipGround(ctx, s.x, A.y, s.w, A.h, C.tints[k % C.tints.length], a);
    });
    Array.from(SENT).forEach((ch, i) => {
      const k = TOKS.findIndex(([i0, n]) => i >= i0 && i < i0 + n);
      const lit = litTok(k);
      const a = g * (split > 0 ? lerp(1, dimmed(lit, any, cue), split) : 1);
      text(ctx, ch, xs[i], A.y + A.h / 2 + 2, { font: A.font, color: C.ink, base: 'middle', alpha: a });
      if (lit > 0) text(ctx, ch, xs[i], A.y + A.h / 2 + 2, { font: A.font, color: C.accent, base: 'middle', alpha: a * lit });
    });
    ring(ctx, span(tok, 9, 2).x, A.y, span(tok, 9, 2).w, A.h, fe.level[0], C.accent);
    const ap = span(tok, 12, 1);
    const apEnd = span(tok, 14, 1);
    ring(ctx, ap.x, A.y, apEnd.x + apEnd.w - ap.x, A.h, fe.level[1], C.accent);

    // the words' edges, kept above the tokens as brackets once ずんだもん compares them
    const brk = pop('q');
    if (brk > 0) {
      ctx.save();
      ctx.globalAlpha = brk;
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      WORDS.forEach(([i0, n], k) => {
        const x0 = xs[i0] - 2;
        const x1 = xs[i0 + n - 1] + charW[i0 + n - 1] + 2;
        const lit = (k === 2 || k === 3) && fe.level[0] > 0 ? fe.level[0] : k === 4 ? fe.level[1] : 0;
        ctx.strokeStyle = lit > 0.5 ? C.accent : C.muted;
        ctx.beginPath();
        ctx.moveTo(x0 + 3, A.brk + 7);
        ctx.lineTo(x0 + 3, A.brk);
        ctx.lineTo(x1 - 3, A.brk);
        ctx.lineTo(x1 - 3, A.brk + 7);
        ctx.stroke();
      });
      ctx.restore();
      text(ctx, '上の線は、言葉の切れ目', M.l + 400, A.label, { font: F.jp(500, 18), color: C.muted, alpha: brk });
    }
    // the numbers
    const seq = focus(t, [at('seq')], at('l.end') - cue.fall, cue).level[0];
    TOKS.forEach(([i0, n], k) => {
      const s = span(tok, i0, n);
      const a = tw(t, at('id') - lead + k * 0.04, 0.4);
      text(ctx, String(IDS[k]), s.x + s.w / 2, A.id, { font: F.mono(500, 16), color: seq > 0.5 ? C.accent : C.ink2, align: 'center', alpha: a });
    });
    const idRow = { x: M.l - 4, w: tok.chips[11].x + tok.chips[11].w - M.l + 8 };
    ring(ctx, idRow.x, A.id - 18, idRow.w, 26, seq, C.accent, 8);
    tag(ctx, idRow.x + idRow.w + 26, A.id - 22, 'LLM が読み書きするもの', { font: F.jp(700, 18), h: 34, padX: 14, fill: C.ink, color: C.paper, alpha: pop('seq') });
    ctx.restore();

    // ——— English
    const enA = pop('en');
    text(ctx, '英語（同じ GPT-4o の切り方）', M.l, B.label, { font: F.jp(700, 20), color: C.ink2, alpha: enA });
    tag(ctx, W - M.r, B.label - 26, '9 トークン', { font: F.jp(700, 21), h: 36, padX: 14, fill: C.ink, color: C.paper, align: 'right', alpha: tw(t, at('en') + 0.5, pace.enter) });
    en.forEach((c, k) => {
      chip(ctx, c.x, B.y, c.s, { ...B, fill: C.tints[k % C.tints.length], alpha: tw(t, at('en') - lead + k * pace.stagger, pace.enter) });
      text(ctx, String(EN_IDS[k]), c.x + c.w / 2, B.id, { font: F.mono(500, 16), color: C.ink2, align: 'center', alpha: tw(t, at('id') - lead + 0.3 + k * 0.04, 0.4) });
    });

    // ——— GPT-4's way of cutting the same sentence
    const gm = pop('model');
    text(ctx, 'GPT-4 の切り方（cl100k_base）', M.l, G.label, { font: F.jp(700, 20), color: C.ink2, alpha: gm });
    tag(ctx, W - M.r, G.label - 26, '17 トークン', { font: F.jp(700, 21), h: 36, padX: 14, fill: C.ink, color: C.paper, align: 'right', alpha: tw(t, at('gpt4') + 0.5, pace.enter) });
    const bl = focus(t, [at('byte')], at('j.end') - cue.fall, cue).level[0];
    g4.forEach((c, k) => {
      const isByte = BYTES.includes(k);
      const a = tw(t, at('gpt4') - lead + k * 0.05, pace.enter);
      chip(ctx, c.x, G.y, c.s, { ...G, font: isByte ? G.mono : G.font, fill: isByte ? '#fff' : C.tints[k % C.tints.length], stroke: isByte ? C.ink2 : null, lw: 2, alpha: a });
    });
    const b0 = g4[BYTES[0]];
    const b1 = g4[BYTES[1]];
    ring(ctx, b0.x, G.y, b1.x + b1.w - b0.x, G.h, bl, C.accent);
    const ba = tw(t, at('byte') - lead, pace.enter);
    if (ba > 0) {
      ctx.save();
      ctx.globalAlpha = ba;
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      const y = G.y + G.h + 10;
      ctx.beginPath();
      ctx.moveTo(b0.x + 4, y);
      ctx.lineTo(b0.x + 4, y + 8);
      ctx.lineTo(b1.x + b1.w - 4, y + 8);
      ctx.lineTo(b1.x + b1.w - 4, y);
      ctx.stroke();
      ctx.restore();
      const mid = (b0.x + b1.x + b1.w) / 2;
      text(ctx, '「飲」を表す 3 つのバイト（E9 A3 B2）を、二つのトークンに', mid - 40, y + 38, { font: F.jp(500, 18), color: C.ink2, alpha: ba });
    }

    // ——— the vocabulary
    const v = pop('vocab');
    if (v > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, D.y, (W - M.l - M.r) * outCubic(v), 2);
    }
    const named = pop('name');
    text(ctx, 'GPT-4o の切り方で使うトークンの一覧', M.l, D.y + 44, { font: F.jp(700, 20), color: C.ink2, alpha: v });
    tag(ctx, M.l + 390, D.y + 18, '語彙', { font: F.jp(700, 22), h: 38, padX: 16, fill: C.accent, color: '#fff', alpha: named });
    const nw = text(ctx, '約 20 万', M.l, D.y + 150, { font: F.cond(700, 104), color: C.ink, alpha: v, ls: -1 });
    text(ctx, '種類', M.l + nw + 14, D.y + 148, { font: F.jp(700, 30), color: C.ink, alpha: v });
    text(ctx, '語彙にない文字は、バイトに割って表す。だから、どんな文章もトークンの並びにできる', M.l, D.y + 196, { font: F.jp(500, 19), color: C.ink2, alpha: pop('any') });
    const tx = 1060;
    text(ctx, '番号', tx + 110, D.y + 44, { font: F.jp(700, 18), color: C.muted, align: 'right', alpha: v });
    text(ctx, 'トークン', tx + 150, D.y + 44, { font: F.jp(700, 18), color: C.muted, alpha: v });
    VOCAB.forEach(([id, s], i) => {
      const a = tw(t, at('vocab') - lead + 0.2 + i * pace.stagger, pace.enter);
      const y = D.y + 82 + i * 30;
      text(ctx, String(id), tx + 110, y, { font: F.mono(500, 19), color: C.ink2, align: 'right', alpha: a });
      text(ctx, s, tx + 150, y, { font: F.jp(500, 21), color: C.ink, alpha: a });
    });
    text(ctx, '⋮', tx + 160, D.y + 82 + 5 * 30 - 4, { font: F.sans(600, 20), color: C.muted, alpha: v });

    source(ctx, '分割と番号は o200k_base と cl100k_base（js-tiktoken 1.0.21）で求めた', tw(t, at('cut'), 0.6), SOURCE_RIGHT);
  },
});

function chipGround(ctx, x, y, w, h, fill, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}
