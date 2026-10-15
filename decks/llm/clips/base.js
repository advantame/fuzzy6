// 4-1: a pre-trained model only continues. It opens on a look back at pre-training (3-6): the
// parameters, and many texts practised with what comes next hidden, until the grid settles. Given a question alone, it may go on with more
// questions — in a page of questions, that is what comes next. ずんだもん expected an answer.
// Shape the text as question and answer, end it on "答え：", and the likely continuation is an
// answer; GPT-3's paper showed this with examples in the context. A chatbot keeps the shape with
// fixed marks: the labels turn into the role marks of 4-2.
// The model's outputs, the parameters' values and the practice texts are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, chip, chipWidth, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import { slot } from '../lib/odds.js';
import { trainingStrip } from '../lib/training.js';
import { ROLE } from '../lib/rig.js';
import { PARAMS_W, PARAMS_H, paramGrid, paramValue, flicker } from '../lib/params.js';
import { text, measure, rr, arrow, typed } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outCubic, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

const ASK = '日本の首都はどこですか？';
const MORE = ['アメリカの首都はどこですか？', 'フランスの首都はどこですか？', 'イタリアの首都は……'];
const LEFT = { x: M.l, y: 150, w: 650, h: 320 };
const RIGHT = { x: 830, y: 150, w: W - M.r - 830, h: 420 };
const BODY = F.jp(500, 28);
const LH = 46;
// the shaped text: question and answer by turns, ending on "答え："
const SHAPED = [
  ['質問', 'フランスの首都はどこですか？'],
  ['答え', 'パリです。'],
  ['質問', 'イタリアの首都はどこですか？'],
  ['答え', 'ローマです。'],
  ['質問', ASK],
  ['答え', ''],
];
const ANSWER = '東京です。';
const BOOK = { x: M.l, y: 594, w: 300, h: 196 };

// ——— sentence a: pre-training, as in 3-6. Texts it learns from (o200k_base tokens), each
// practised with what comes next hidden, the hidden place moving along
const PG = { x: M.l, y: 184 };
const TEXTS = [
  ['の', 'ど', 'が', 'かわ', 'いた', 'ので', '、水', 'を', '飲', 'ん', 'だ', '。'],
  ['駅', 'ま', 'では', '、', '歩', 'いて', '10', '分', 'です', '。'],
  ['き', 'ょう', 'は', '、', '朝', 'から', '晴', 'れて', 'いる', '。'],
  ['会', '議', 'は', '、', '午後', '3', '時', 'から', '始', 'ま', 'ります', '。'],
];
const TT = { x: 720, y: 184, step: 60 };
const TCHIP = { font: F.jp(500, 24), h: 44, padX: 9, gap: 5 };
const CAP_Y = PG.y + PARAMS_H + 64;

export default clip({
  id: 'base',
  title: '続きを書くだけ',
  kicker: '事前学習だけのモデル',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: '事前学習を終えたモデルは、{cont}文章の続きを予測することを、\n{many}たくさん学んできたわ。' },
    { id: 'b', lead: 0.6, text: 'たとえば、このモデルに、{ask}「[日本|にほん]の首都はどこですか？」\nだけをコンテクストとして与えた場面を考えてみましょう。' },
    { id: 'c', still: true, text: '答えではなく、{more}「アメリカの首都はどこですか？」のように、\n別の質問を続けることもあるの。' },
    { id: 'c2', text: '{fig}InstructGPT の論文にも、[GPT-3|ジーピーティースリー] が質問に、\n別の質問で続けた例が載っているわ。' },
    { id: 'd', by: 'zunda', text: '{q}質問したのに、答えてくれないのだ？' },
    { id: 'e', text: '事前学習で学んだのは、{why}書かれた文章に、\nどんな続きが来るか、ということなの。' },
    { id: 'e2', text: '{not}質問に答える形になるとは、限らないのよ。' },
    { id: 'f', still: true, text: 'たとえば、{book}問題集のような並びなら、\n質問の次に、また質問が来ることもあるわね。' },
    { id: 'g', text: '逆に、{shape}コンテクストの形を整えてやると、続きも変わるわ。' },
    { id: 'h', text: '{qa}質問と答えの組をいくつか見せて、\n{last}最後は、新しい質問と「答え：」まで書くの。' },
    { id: 'h2', still: true, text: 'そうすると、{ans}答えの形で、続きを書きやすくなるわ。' },
    { id: 'i', text: '2020 年の [GPT-3|ジーピーティースリー] の論文では、{few}質問と答えの例を\nコンテクストに入れて、続きを書かせる方法も試しているの。' },
    { id: 'i2', text: 'このとき、{nofix}パラメータは変えていないわ。\n例は、コンテクストの中にあるだけなの。' },
    { id: 'j', tail: 0.8, text: 'チャットボットでは、{mark}だれの発言かを、\n決まった印で区切る形式も使われているわ。' },
  ],

  prepare(ctx) {
    return { texts: TEXTS.map((toks) => toks.map((s) => chipWidth(ctx, s, TCHIP))) };
  },

  draw(ctx, t, { texts }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    trainingStrip(ctx, { alpha: enter(t, at('a'), pace), lit: [0] });
    recall(ctx, t, texts, { at, pace });

    // ——— left: the question alone, and what the model writes after it
    // the card comes in as the grid of sentence a lands on it and fades
    const la = enter(t, land(at, pace) - 0.35, pace);
    text(ctx, '事前学習だけのモデルに、続きを書かせる', LEFT.x, LEFT.y - 18, { font: F.jp(700, 20), color: C.ink2, alpha: la });
    card(ctx, LEFT, la);
    const asked = pop('ask');
    const aw = text(ctx, ASK, LEFT.x + 28, LEFT.y + 52, { font: BODY, color: C.ink, alpha: asked });
    tag(ctx, LEFT.x + 28 + aw + 14, LEFT.y + 26, 'コンテクスト', { font: F.jp(700, 16), h: 30, padX: 10, stroke: C.accent, color: C.accent, alpha: asked });
    const more = seg(t, at('more') - lead, at('c.end'));
    const nChars = MORE.join('').length;
    let left = Math.round(nChars * more);
    MORE.forEach((s, i) => {
      const n = Math.min(left, s.length);
      left -= n;
      if (n <= 0) return;
      text(ctx, typed(s, n / s.length), LEFT.x + 28, LEFT.y + 52 + (i + 1) * LH, { font: BODY, color: C.blue });
    });
    if (more > 0 && more < 1 && Math.floor(t * 2.5) % 2 === 0) {
      // the caret after the text being written
      const i = Math.min(MORE.length - 1, MORE.findIndex((_, k) => MORE.slice(0, k + 1).join('').length >= Math.round(nChars * more)));
      const s = MORE[Math.max(0, i)];
      const done = Math.round(nChars * more) - MORE.slice(0, Math.max(0, i)).join('').length;
      const cx = LEFT.x + 28 + measure(ctx, BODY, typed(s, done / s.length)) + 3;
      ctx.fillStyle = C.accent;
      ctx.fillRect(cx, LEFT.y + 52 + (i + 1) * LH - 26, 3, 32);
    }
    tag(ctx, LEFT.x + 28, LEFT.y + 226, '続き：別の質問が並んだ（例）', { font: F.jp(700, 18), h: 34, padX: 12, fill: C.blueSoft, color: C.blue, alpha: tw(t, at('c.end') - 0.2, pace.enter) });
    text(ctx, 'InstructGPT の論文（2022）にも、GPT-3 が質問に別の質問で続けた例がある', LEFT.x + 28, LEFT.y + 296, { font: F.jp(500, 16), color: C.ink2, alpha: pop('fig') });
    // ずんだもん expected an answer; the left card is ringed while the question is asked
    const qlit = focus(t, [at('q')], at('d.end') - cue.fall, cue).level[0];
    ring(ctx, LEFT.x, LEFT.y, LEFT.w, LEFT.h, qlit, C.accent, 16);
    // what it is doing: the likely continuation
    text(ctx, '学んだのは、書かれた文章に、どんな続きが来るか', LEFT.x, LEFT.y + LEFT.h + 36, { font: F.jp(700, 19), color: C.ink, alpha: pop('why') });
    text(ctx, '質問に答える形になるとは限らない', LEFT.x, LEFT.y + LEFT.h + 66, { font: F.jp(700, 19), color: C.ink, alpha: pop('not') });

    // a page of questions: where a question is followed by more questions
    const ba = pop('book');
    if (ba > 0) {
      ctx.save();
      ctx.globalAlpha = ba;
      rr(ctx, BOOK.x, BOOK.y, BOOK.w, BOOK.h, 8);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = C.ink2;
      ctx.fillRect(BOOK.x, BOOK.y, 8, BOOK.h);
      ctx.restore();
      text(ctx, '問題集', BOOK.x + 26, BOOK.y + 36, { font: F.jp(700, 22), color: C.ink, alpha: ba });
      ['問 1　……はどこですか？', '問 2　……はどこですか？', '問 3　……はどこですか？'].forEach((s, i) => {
        text(ctx, s, BOOK.x + 26, BOOK.y + 82 + i * 38, { font: F.jp(500, 19), color: C.ink2, alpha: tw(t, at('book') - lead + 0.2 + i * pace.stagger, pace.enter) });
      });
      const ca = tw(t, at('book') + 0.6, pace.enter);
      text(ctx, 'こういう文章では、', BOOK.x + BOOK.w + 24, BOOK.y + BOOK.h / 2 - 8, { font: F.jp(700, 19), color: C.ink2, alpha: ca });
      text(ctx, '質問のあとに、また質問が来る', BOOK.x + BOOK.w + 24, BOOK.y + BOOK.h / 2 + 22, { font: F.jp(700, 19), color: C.ink2, alpha: ca });
    }

    // ——— right: the text shaped as question and answer
    const ra = pop('shape');
    text(ctx, '形を整えたコンテクスト', RIGHT.x, RIGHT.y - 18, { font: F.jp(700, 20), color: C.ink2, alpha: ra });
    card(ctx, RIGHT, ra);
    const marks = tw(t, at('mark') - lead, 0.8);
    const qaA = pop('qa');
    SHAPED.forEach(([who, s], i) => {
      const a = i < 4 ? tw(t, at('qa') - lead + i * pace.stagger * 2, pace.enter) : i === 4 ? qaA : pop('last');
      if (a <= 0) return;
      const y = RIGHT.y + 38 + i * 56;
      // the label: 質問／答え, turning into the role marks of 4-2
      const role = ROLE[who === '質問' ? 'user' : 'assistant'];
      const lw = tag(ctx, RIGHT.x + 24, y, `${who}：`, { font: F.jp(700, 20), h: 36, padX: 10, fill: who === '質問' ? '#eef2ff' : C.panel, color: C.ink2, alpha: a * (1 - marks), r: 6 });
      tag(ctx, RIGHT.x + 24, y, role.name, { font: F.jp(700, 17), h: 36, padX: 10, fill: role.fill, color: role.color, alpha: a * marks, r: 6 });
      const tx = RIGHT.x + 24 + Math.max(lw, 136) + 12;
      text(ctx, s, tx, y + 27, { font: F.jp(500, 25), color: C.ink, alpha: a });
      if (i === 5) {
        const ans = seg(t, at('ans') - lead, at('ans') + 0.8);
        if (ans < 1) slot(ctx, tx, y - 4, 150, 44, { alpha: a * (1 - ans), lit: a, blink: Math.floor(t * 2.5) % 2 === 0 });
        if (ans > 0) text(ctx, typed(ANSWER, ans), tx, y + 27, { font: F.jp(700, 25), color: C.blue });
      }
    });
    const lastLit = focus(t, [at('last')], at('h.end') - cue.fall, cue).level[0];
    ring(ctx, RIGHT.x + 18, RIGHT.y + 38 + 5 * 56 - 6, 150, 48, lastLit, C.accent, 10);
    tag(ctx, RIGHT.x + 24, RIGHT.y + RIGHT.h - 56 + 70, '続きは、答えになった', { font: F.jp(700, 18), h: 34, padX: 12, fill: C.blueSoft, color: C.blue, alpha: tw(t, at('ans') + 0.8, pace.enter) });
    // GPT-3's paper: examples in the text, then the problem
    const fa = pop('few');
    text(ctx, 'GPT-3 の論文（2020）：質問と答えの例をコンテクストに入れる（few-shot）', RIGHT.x, RIGHT.y + RIGHT.h + 120, { font: F.jp(700, 18), color: C.ink2, alpha: fa });
    text(ctx, 'パラメータは変えない。例は、コンテクストの中にあるだけ', RIGHT.x, RIGHT.y + RIGHT.h + 150, { font: F.jp(500, 17), color: C.ink2, alpha: pop('nofix') });
    // the marks
    const ma = pop('mark');
    if (ma > 0) {
      ctx.save();
      ctx.globalAlpha = ma;
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 2.5;
      arrow(ctx, RIGHT.x - 10, RIGHT.y + RIGHT.h + 196, RIGHT.x + 60, RIGHT.y + RIGHT.h + 196, outCubic(ma), 10);
      ctx.restore();
      text(ctx, 'チャットボットでは、決まった印で区切る（4-2）', RIGHT.x + 76, RIGHT.y + RIGHT.h + 203, { font: F.jp(700, 19), color: C.accent, alpha: ma });
    }

    example(ctx, LEFT.x, 836, la, 'モデルが書いた続きは説明のための例');
    source(ctx, 'Brown ほか（2020）', fa, SOURCE_RIGHT);
  },
});

// When the grid of sentence a lands on the left card: the end of sentence b's lead.
const land = (at, pace) => at('b.voice') - pace.pre;

// Sentence a: pre-training, looked back on. The first text is practised position by position
// while the voice says "predicting what comes next"; at "a great deal" more texts come in and
// many cells change at once; the grid settles before the voice ends. Then the scene clears, and
// the trained grid moves onto the left card — "this model" of sentence b — and fades into it.
function recall(ctx, t, texts, { at, pace }) {
  const lead = pace.cue.lead;
  const a0 = at('a');
  // when each text is practised: the first one slowly, the rest quickly, one after another
  const s0 = at('cont') - lead;
  const many = at('many') - lead;
  const runs = TEXTS.map((_, i) => (i === 0 ? [s0, many - 0.1] : [many + 0.1 + (i - 1) * 0.12, many + 0.75 + (i - 1) * 0.12]));
  const settle = runs[runs.length - 1][1];

  // the parameters: random at first, drifting as the practice goes on, still once it is done
  const go = at('a.done');
  const end = land(at, pace);
  const gone = 1 - seg(t, end - 0.35, end + 0.15);
  if (gone > 0) {
    const k2 = seg(t, s0, settle);
    const m = inOutCubic(seg(t, go, end));
    ctx.save();
    ctx.globalAlpha = gone;
    // it lands just inside the card's rounded edge
    const IN = 14;
    ctx.translate(lerp(PG.x, LEFT.x + IN, m), lerp(PG.y, LEFT.y + IN, m));
    ctx.scale(lerp(1, (LEFT.w - 2 * IN) / PARAMS_W, m), lerp(1, (LEFT.h - 2 * IN) / PARAMS_H, m));
    paramGrid(ctx, 0, 0, (r, c, id) => {
      const a = tw(t, a0 + (r + c) * 0.01, pace.enter);
      if (a <= 0) return null;
      // as in 3-6's sentence i: while the practice runs, a few cells light up at a time
      const flash = t >= s0 && t < settle ? flicker(id, t - s0) : 0;
      return { a, v: paramValue(id, 0, k2), flash };
    });
    ctx.restore();
  }

  const out = 1 - seg(t, go, at('b'));
  if (out <= 0) return;
  ctx.save();
  ctx.globalAlpha = out;

  text(ctx, '事前学習：先を隠して、次のトークンを当てる練習（3-6）', PG.x, 124, { font: F.jp(700, 22), color: C.ink, alpha: enter(t, a0, pace) });
  text(ctx, 'モデルのパラメータ（値は例）', PG.x, PG.y - 16, { font: F.jp(700, 18), color: C.ink2, alpha: enter(t, a0, pace, 1) });
  text(ctx, '学習に使う文章（GPT-4o の切り方）', TT.x, TT.y - 16, { font: F.jp(700, 18), color: C.ink2, alpha: enter(t, a0, pace, 1) });

  // what the guesses do to the parameters
  const fix = tw(t, s0, pace.enter);
  if (fix > 0) {
    const y = PG.y + PARAMS_H / 2;
    ctx.save();
    ctx.globalAlpha *= fix;
    ctx.strokeStyle = C.accent;
    ctx.fillStyle = C.accent;
    ctx.lineWidth = 3;
    arrow(ctx, TT.x - 18, y, PG.x + PARAMS_W + 18, y, outCubic(fix), 12);
    ctx.restore();
  }
  text(ctx, '外れが小さくなるように、少しずつ直す', PG.x, CAP_Y, { font: F.jp(700, 18), color: C.accent, alpha: fix });

  // the texts
  texts.forEach((ws, i) => {
    const [r0, r1] = runs[i];
    const a = i === 0 ? enter(t, a0, pace, 2) : tw(t, r0 - 0.25, pace.enter);
    if (a <= 0) return;
    const p = seg(t, r0, r1);
    const cur = p > 0 && p < 1 ? 1 + Math.floor(p * (ws.length - 1)) : -1;
    let x = TT.x;
    const y = TT.y + i * TT.step;
    ws.forEach((w, k) => {
      if (k === cur) slot(ctx, x, y, w, TCHIP.h, { alpha: a, lit: 1 });
      else {
        const hidden = cur >= 0 && k > cur;
        chip(ctx, x, y, TEXTS[i][k], { ...TCHIP, fill: hidden ? C.panel : C.tints[k % C.tints.length], color: hidden ? C.panel : C.ink, alpha: a });
      }
      x += w + TCHIP.gap;
    });
  });
  text(ctx, 'たくさんの文章で、何度もくり返す', TT.x, CAP_Y, { font: F.jp(700, 18), color: C.ink2, alpha: tw(t, many, pace.enter) });
  ctx.restore();
}

function card(ctx, b, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, b.x, b.y, b.w, b.h, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
