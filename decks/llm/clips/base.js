// 4-1: a pre-trained model only continues. Given a question alone, it may go on with more
// questions — in a page of questions, that is what comes next. ずんだもん expected an answer.
// Shape the text as question and answer, end it on "答え：", and the likely continuation is an
// answer; GPT-3's paper showed this with examples in the prompt. A chatbot keeps the shape with
// fixed marks: the labels turn into the role marks of 4-2.
// The model's outputs are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import { slot } from '../lib/odds.js';
import { trainingStrip } from '../lib/training.js';
import { ROLE } from '../lib/rig.js';
import { text, measure, rr, arrow, typed } from '../../../src/kit/draw.js';
import { tw, seg, outCubic } from '../../../src/kit/ease.js';
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

export default clip({
  id: 'base',
  title: '続きを書くだけ',
  kicker: '事前学習だけのモデル',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: '事前学習を終えたモデルは、{cont}文章の続きを予測することを、\nたくさん学んできたわ。' },
    { id: 'b', text: 'たとえば、このモデルに、{ask}「[日本|にほん]の首都はどこですか？」\nとだけ書いた場面を考えてみましょう。' },
    { id: 'c', still: true, text: '答えではなく、{more}「アメリカの首都はどこですか？」のように、\n別の質問を続けることもあるの。' },
    { id: 'c2', text: '{fig}InstructGPT の論文にも、[GPT-3|ジーピーティースリー] が質問に、\n別の質問で続けた例が載っているわ。' },
    { id: 'd', by: 'zunda', text: '{q}質問したのに、答えてくれないのだ？' },
    { id: 'e', text: '事前学習で学んだのは、{why}書かれた文章に、\nどんな続きが来るか、ということなの。' },
    { id: 'e2', text: '{not}質問に答える形になるとは、限らないのよ。' },
    { id: 'f', still: true, text: 'たとえば、{book}問題集のような並びなら、\n質問の次に、また質問が来ることもあるわね。' },
    { id: 'g', text: '逆に、{shape}文章の形を整えてやると、続きも変わるわ。' },
    { id: 'h', text: '{qa}質問と答えの組をいくつか見せて、\n{last}最後は、新しい質問と「答え：」まで書くの。' },
    { id: 'h2', still: true, text: 'そうすると、{ans}答えの形で、続きを書きやすくなるわ。' },
    { id: 'i', text: '2020 年の [GPT-3|ジーピーティースリー] の論文では、{few}質問と答えの例を入力に入れて、\n新しい質問に続きを書かせる方法も、試しているの。' },
    { id: 'i2', text: 'このとき、{nofix}パラメータは変えていないわ。\n例は、読ませる文章の中にあるだけなの。' },
    { id: 'j', tail: 0.8, text: 'チャットボットでは、{mark}だれの発言かを、\n決まった印で区切る形式も使われているわ。' },
  ],

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    trainingStrip(ctx, { alpha: enter(t, at('a'), pace), lit: [0] });

    // ——— left: the question alone, and what the model writes after it
    const la = enter(t, at('a'), pace);
    text(ctx, '事前学習だけのモデルに、続きを書かせる', LEFT.x, LEFT.y - 18, { font: F.jp(700, 20), color: C.ink2, alpha: la });
    card(ctx, LEFT, la);
    const asked = pop('ask');
    text(ctx, ASK, LEFT.x + 28, LEFT.y + 52, { font: BODY, color: C.ink, alpha: asked });
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
    text(ctx, '形を整えた文章', RIGHT.x, RIGHT.y - 18, { font: F.jp(700, 20), color: C.ink2, alpha: ra });
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
    text(ctx, 'GPT-3 の論文（2020）：質問と答えの例を入力に入れる（few-shot）', RIGHT.x, RIGHT.y + RIGHT.h + 120, { font: F.jp(700, 18), color: C.ink2, alpha: fa });
    text(ctx, 'パラメータは変えない。例は、読ませる文章の中にあるだけ', RIGHT.x, RIGHT.y + RIGHT.h + 150, { font: F.jp(500, 17), color: C.ink2, alpha: pop('nofix') });
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
