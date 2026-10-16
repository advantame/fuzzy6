// 4-1: a pre-trained model only continues. It opens on a look back at pre-training (3-6): the
// parameters, and many texts practised with what comes next hidden, until the grid settles. The
// grid fades into a black box, the LLM, which opens into a frame beside the page it writes on;
// inside the frame sit the trained parameters, beside the next token's chances.
// Given a question alone, the question goes into the LLM, is cut into tokens, and the LLM writes
// on token by token: it reads the context, the context is drawn into the parameters, they give
// the next token's chances, and the chosen token joins the context and appears on the page. The
// first three steps go slowly enough to follow, the rest quickly; what it writes is more
// questions — in a page of questions, that is what comes next. ずんだもん expected an answer.
// Then the page leaves, and a shaped text comes in: question and answer by turns, ending on
// "答え：". It goes into the LLM the same way, and the continuation is an answer, 東京です。 (three
// tokens, all slow). Last, the LLM leaves and the first page comes back beside the shaped one:
// the same model, two contexts. GPT-3's paper showed this with examples in the context; a chatbot
// keeps the shape with fixed marks: the labels turn into the role marks of 4-2.
// The model's outputs, the chances, the parameters' values and the practice texts are an
// example. The tokens are o200k_base's.

import { clip } from '../../lib/clip.js';
import { C, F, M, W } from '../../lib/theme.js';
import { tag, chip, chipWidth, example, source, SOURCE_RIGHT } from '../../lib/parts.js';
import { oddsRow, slot } from '../../lib/odds.js';
import { trainingStrip } from '../../lib/training.js';
import { ROLE } from '../../lib/rig.js';
import { PARAMS_W, PARAMS_H, paramGrid, paramValue, flicker } from '../../lib/params.js';
import { text, measure, rr, arrow } from '../../../../src/kit/draw.js';
import { tw, seg, lerp, inCubic, outCubic, inOutCubic } from '../../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../../src/kit/cue.js';

const ASK = '日本の首都はどこですか？';

// ——— the LLM: the black box the trained grid fades into, and the frame it opens into
const BOX = { x: M.l, y: 236, w: 420, h: 180 };
const FRAME = { x: M.l, y: 112, w: 780, h: 488 };
// the context inside it, as token chips, one row per line of the page. The question alone gets
// larger chips than the shaped text, which has six lines.
const CTX = { x: FRAME.x + 28, y: FRAME.y + 100 };
const L1 = { font: F.jp(500, 24), px: 24, h: 40, padX: 9, gap: 6, step: 50, nl: 14 };
const L2 = { font: F.jp(500, 19), px: 19, h: 30, padX: 6, gap: 4, step: 34, nl: 12 };
// the next token's chances, below the context
const PROB = { x: FRAME.x + 28, label: FRAME.y + 326, y: FRAME.y + 348, step: 44 };
const ODDS = { chipW: 104, h: 36, barW: 330, font: F.jp(500, 22) };
// the trained parameters, right of the chances: the context goes in, the chances come out
const PBOX = { x: FRAME.x + 584, y: FRAME.y + 340, w: 172, h: 132 };
const PCELL = { cols: 8, rows: 5, s: 15, gap: 4 };
const PARW = { x0: PBOX.x - 12, x1: PROB.x + ODDS.chipW + 18 + ODDS.barW + 14, y: PROB.y + PROB.step + ODDS.h / 2 };

// ——— the pages: what is given, and what the model writes after it. Beside the LLM they stand on
// the right; at the end the two stand side by side.
const DOC = { x: 1000, y: 150, w: W - M.r - 1000, h: 330 };
const SHP = { x: 1000, y: 150, w: W - M.r - 1000, h: 380 };
const CMP_L = { x: M.l, y: 164, w: 680, h: 380 };
const CMP_R = { x: W - M.r - 680, y: 164, w: 680, h: 380 };
const BODY = F.jp(500, 28);
const LH = 46;
const docY = (r, i) => r.y + 42 + i * LH;
const SBODY = F.jp(500, 25);
const SLH = 48;
const shpY = (r, i) => r.y + 42 + i * SLH;

// ——— between them: the context goes in (←), the chosen token comes out (→)
const ARW = { x0: FRAME.x + FRAME.w + 18, x1: DOC.x - 18, back: 290, out: 342 };

// A token that ends a line ("？\n", "。\n") is one token in o200k_base; its line break is drawn.
const isNL = (s) => s.endsWith('\n');
const shown = (s) => s.replace('\n', '');
const Q = '？\n';
const E = '。\n';

// ——— the question alone. It ends on a line break, so its last token is "？\n"; the model writes
// one question per line.
const GIVEN = ['日本', 'の', '首', '都', 'は', 'ど', 'こ', 'です', 'か', Q];
// One step per token it writes: the token chosen, then two others it might have chosen. Every
// candidate is one o200k_base token; the chances are an example. The answers are among them
// (東京, ワ for ワシントン, パ for パリ) but the next question is likelier.
const STEPS = [
  [['ア', 0.31], ['東京', 0.24], ['フ', 0.11]],
  [['メリ', 0.58], ['ジ', 0.14], ['フ', 0.09]],
  [['カ', 0.93], ['の', 0.02], ['ー', 0.01]],
  [['の', 0.82], ['合', 0.06], ['で', 0.03]],
  [['首', 0.71], ['人口', 0.08], ['大', 0.04]],
  [['都', 0.97], ['相', 0.02], ['長', 0.005]],
  [['は', 0.9], ['を', 0.03], ['の', 0.02]],
  [['ど', 0.8], ['ワ', 0.07], ['何', 0.05]],
  [['こ', 0.98], ['れ', 0.01], ['う', 0.005]],
  [['です', 0.9], ['でしょう', 0.05], ['？', 0.02]],
  [['か', 0.96], ['。', 0.02], ['よ', 0.01]],
  [[Q, 0.86], ['？', 0.07], ['。', 0.03]],
  [['フ', 0.29], ['イ', 0.21], ['ド', 0.14]],
  [['ラン', 0.86], ['ィ', 0.06], ['ラ', 0.03]],
  [['ス', 0.97], ['ク', 0.01], ['ツ', 0.005]],
  [['の', 0.9], ['人', 0.03], ['で', 0.02]],
  [['首', 0.85], ['人口', 0.04], ['料理', 0.03]],
  [['都', 0.99], ['相', 0.005], ['位', 0.002]],
  [['は', 0.95], ['を', 0.02], ['の', 0.01]],
  [['ど', 0.9], ['パ', 0.04], ['何', 0.02]],
  [['こ', 0.99], ['れ', 0.004], ['う', 0.002]],
  [['です', 0.93], ['でしょう', 0.04], ['？', 0.01]],
  [['か', 0.98], ['。', 0.01], ['よ', 0.005]],
  [[Q, 0.93], ['？', 0.04], ['。', 0.01]],
  [['イ', 0.3], ['ド', 0.21], ['ロ', 0.1]],
  [['タ', 0.62], ['ギ', 0.15], ['ラン', 0.07]],
  [['リア', 0.95], ['リ', 0.03], ['ル', 0.01]],
  [['の', 0.88], ['料理', 0.05], ['人', 0.03]],
  [['首', 0.86], ['人口', 0.04], ['料理', 0.02]],
  [['都', 0.99], ['相', 0.005], ['位', 0.002]],
  [['は', 0.95], ['を', 0.02], ['の', 0.01]],
];
// The step after the last: its chances stay on screen, and the clip stops before choosing (ロ for
// ローマ).
const NEXT = [['ど', 0.78], ['ロ', 0.09], ['何', 0.05]];
// The first steps go slowly enough to follow (each in sentence c's lead), the rest quickly,
// without the context drawn into the parameters and without the chosen chip's slide.
const SLOW = 3;

// ——— the shaped text: question and answer by turns, ending on "答え："
const SHAPED = [
  ['質問', 'フランスの首都はどこですか？'],
  ['答え', 'パリです。'],
  ['質問', 'イタリアの首都はどこですか？'],
  ['答え', 'ローマです。'],
  ['質問', ASK],
  ['答え', ''],
];
// the same, cut by o200k_base (57 tokens)
const GIVEN2 = [
  '質問', '：', 'フ', 'ラン', 'ス', 'の', '首', '都', 'は', 'ど', 'こ', 'です', 'か', Q,
  '答', 'え', '：', 'パ', 'リ', 'です', E,
  '質問', '：', 'イ', 'タ', 'リア', 'の', '首', '都', 'は', 'ど', 'こ', 'です', 'か', Q,
  '答', 'え', '：', 'ロ', 'ーマ', 'です', E,
  '質問', '：', '日本', 'の', '首', '都', 'は', 'ど', 'こ', 'です', 'か', Q,
  '答', 'え', '：',
];
// what it writes after "答え："; like the examples, the answer ends on "。\n"
const STEPS2 = [
  [['東京', 0.86], ['京都', 0.04], ['日本', 0.02]],
  [['です', 0.93], ['。', 0.03], ['都', 0.01]],
  [[E, 0.95], ['。', 0.03], ['！', 0.01]],
];

const BOOK = { x: M.l, y: 628, w: 280, h: 162 };

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
    { id: 'b', lead: 0.6, text: 'たとえば、{model}このモデルに、{ask}「[日本|にほん]の首都はどこですか？」\nだけを{give}コンテクストとして与えた場面を考えてみましょう。' },
    { id: 'c', lead: 4.2, still: true, text: '答えではなく、「アメリカの首都はどこですか？」のように、\n{other}別の質問を続けることもあるの。' },
    { id: 'c2', text: '{fig}InstructGPT の論文にも、[GPT-3|ジーピーティースリー] が質問に、\n別の質問で続けた例が載っているわ。' },
    { id: 'd', by: 'zunda', text: '{q}質問したのに、答えてくれないのだ？' },
    { id: 'e', text: '事前学習で学んだのは、{why}書かれた文章に、\n{what}どんな続きが来るか、ということなの。' },
    { id: 'e2', text: '{not}質問に答える形になるとは、限らないのよ。' },
    { id: 'f', still: true, text: 'たとえば、{book}問題集のような並びなら、\n質問の次に、また質問が来ることもあるわね。' },
    { id: 'g', text: '逆に、{shape}コンテクストの形を整えてやると、続きも変わるわ。' },
    { id: 'h', text: '{qa}質問と答えの組をいくつか見せて、\n{last}最後は、新しい質問と「答え：」まで書くの。' },
    { id: 'h2', lead: 2.7, still: true, text: 'そうすると、{ans}答えの形で、続きを書きやすくなるわ。' },
    { id: 'i', lead: 1.0, text: '2020 年の [GPT-3|ジーピーティースリー] の論文では、{few}質問と答えの例を\nコンテクストに入れて、続きを書かせる方法も試しているわ。' },
    { id: 'i2', text: '{nofix}パラメータは変えずに、\n{inex}例を、コンテクストの中に置いただけなの。' },
    { id: 'j', tail: 0.8, text: 'チャットボットでは、{mark}だれの発言かを、\n決まった印で区切る形式も使われているわ。' },
  ],

  prepare(ctx) {
    const texts = TEXTS.map((toks) => toks.map((s) => chipWidth(ctx, s, TCHIP)));
    const run1 = layout(ctx, GIVEN, STEPS, L1);
    const run2 = layout(ctx, GIVEN2, STEPS2, L2);
    // the question alone: which line of the page each written token goes on
    let line = 1;
    const lines = STEPS.map((st) => {
      const l = line;
      if (isNL(st[0][0])) line++;
      return l;
    });
    return { texts, runs: [run1, run2], lines };
  },

  draw(ctx, t, s, k) {
    const { at, pace } = k;
    const P = plan(at, pace);
    trainingStrip(ctx, { alpha: enter(t, at('a'), pace), lit: [0] });
    recall(ctx, t, s.texts, P, k);
    doc(ctx, t, s, P, k);
    shaped(ctx, t, s, P, k);
    machine(ctx, t, s, P, k);
    book(ctx, t, P, k);
    notes(ctx, t, P, k);
    example(ctx, M.l, 836, enter(t, P.land - 0.35, pace), '確率と、モデルが書いた続きは説明のための例。切り方は GPT-4o のもの');
    source(ctx, 'Brown ほか（2020）', tw(t, at('few') - pace.cue.lead, pace.enter), SOURCE_RIGHT);
  },
});

// Where a run's chips go in the LLM: the given tokens, then the written ones, a row per line.
// joined: where each given token sits while its row is still one line of text.
function layout(ctx, given, steps, L) {
  const w = (s) => (isNL(s) ? measure(ctx, L.font, shown(s)) + L.nl + L.padX * 2 : chipWidth(ctx, s, L));
  let row = 0;
  let x = CTX.x;
  const chips = [...given, ...steps.map((st) => st[0][0])].map((s) => {
    const c = { s, x, y: CTX.y + row * L.step, w: w(s) };
    x += c.w + L.gap;
    if (isNL(s)) {
      row++;
      x = CTX.x;
    }
    return c;
  });
  let prefix = '';
  const joined = given.map((s) => {
    const x0 = CTX.x + L.padX + measure(ctx, L.font, prefix);
    prefix = isNL(s) ? '' : prefix + s;
    return x0;
  });
  const width = Math.max(...chips.map((c) => c.x + c.w)) - CTX.x;
  return { chips, end: { x, y: CTX.y + row * L.step }, joined, width };
}

// The times of the clip's motions, from the timeline and the pace.
function plan(at, pace) {
  const lead = pace.cue.lead;
  // the grid of sentence a lands on the black box at the end of sentence b's lead
  const land = at('b.voice') - pace.pre;
  // "このモデルに": the box opens into a frame
  const open = [at('model'), at('ask') - lead];
  // sentence c: the slow steps fill its lead, the quick ones run until "別の質問を"
  const c0 = at('c');
  const T = (at('c.voice') - pace.pre - c0) / SLOW;
  const f0 = c0 + SLOW * T;
  const f1 = at('other');
  const dt = (f1 - f0) / (STEPS.length - SLOW);
  // "コンテクストとして与えた": the question goes into the LLM, then is cut into tokens
  const m1 = at('give') - lead;
  const run1 = {
    move: [m1, m1 + 0.6],
    split: [m1 + 0.6, m1 + 1.0],
    steps: STEPS.map((_, i) => (i < SLOW ? slowStep(c0 + i * T, T) : fastStep(f0 + (i - SLOW) * dt, dt))),
    fast: [f0, f1],
    pending: true,
    // sentence g: the page leaves, and the LLM is cleared for the shaped text
    out: at('g'),
  };
  // sentence h2's lead: the shaped text goes in the same way, and its first step runs; the
  // other two run under the voice
  const m2 = at('h2');
  const run2 = {
    move: [m2, m2 + 0.6],
    split: [m2 + 0.6, m2 + 1.0],
    steps: STEPS2.map((_, i) => slowStep(m2 + 1.3 + i * T, T)),
    fast: null,
    pending: false,
    out: Infinity,
  };
  // sentence i's lead: the LLM leaves, and the two pages stand side by side
  return { land, open, runs: [run1, run2], out: at('g'), exit: at('i') };
}

// One step, as fractions of its length: the context lights up and is drawn into the
// parameters, the arrow to the chances lights, the chances come up, one is chosen (and appears on
// the page), and its chip slides to the end of the context.
const slowStep = (s, d) => ({ s, d, slow: true, pick: s + 0.74 * d, fly: [s + 0.77 * d, s + 0.95 * d], land: s + 0.95 * d });
// A quick step: the chosen token appears at once, in the context and on the page.
const fastStep = (s, d) => ({ s, d, slow: false, pick: s + 0.5 * d, land: s + 0.5 * d });

// 0 → 1 → 0: on from a (over rise), off from b (over fall).
const pulse = (t, a, b, rise = 0.08, fall = 0.25) => outCubic(seg(t, a, a + rise)) * (1 - seg(t, b, b + fall));

// How strongly a run lights the LLM's shared parts: the arrow in, the arrow out, the parameters,
// and the arrow from them to the chances.
function lights(t, run) {
  const o = { in: pulse(t, run.move[0], run.move[1]), out: 0, box: 0, arw: 0 };
  for (const st of run.steps) {
    if (!st.slow) break;
    o.out = Math.max(o.out, pulse(t, st.pick - 0.05, st.pick + 0.3));
    o.box = Math.max(o.box, pulse(t, st.s + 0.35 * st.d, st.s + 0.62 * st.d));
    o.arw = Math.max(o.arw, pulse(t, st.s + 0.45 * st.d, st.s + 0.65 * st.d));
  }
  if (run.fast) {
    // the quick steps: all of it stays lit, through the last step's chances
    const [f0, f1] = run.fast;
    o.out = Math.max(o.out, pulse(t, f0, f1, 0.1, 0.3));
    const on = pulse(t, f0, f1 + 0.2, 0.1, 0.3) * 0.8;
    o.box = Math.max(o.box, on);
    o.arw = Math.max(o.arw, on);
  }
  return o;
}

// ——— the LLM ——————————————————————————————————————————————————————

function machine(ctx, t, { runs }, P, { at, pace }) {
  const cue = pace.cue;
  const la = enter(t, P.land - 0.35, pace);
  // sentence i: it leaves to the left
  const ex = inOutCubic(seg(t, P.exit, P.exit + 0.5));
  if (la <= 0 || ex >= 1) return;
  ctx.save();
  ctx.globalAlpha *= la * (1 - ex);
  ctx.translate(-80 * ex, 0);

  const open = inOutCubic(seg(t, P.open[0], P.open[1]));
  const r = {
    x: lerp(BOX.x, FRAME.x, open),
    y: lerp(BOX.y, FRAME.y, open),
    w: lerp(BOX.w, FRAME.w, open),
    h: lerp(BOX.h, FRAME.h, open),
  };
  ctx.save();
  rr(ctx, r.x, r.y, r.w, r.h, 22);
  const base = ctx.globalAlpha;
  if (open < 1) {
    ctx.globalAlpha = base * (1 - open);
    ctx.fillStyle = C.ink;
    ctx.fill();
  }
  if (open > 0) {
    ctx.globalAlpha = base * open;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, 'LLM', r.x + r.w / 2, r.y + r.h / 2 + 4, { font: F.sans(700, 64), color: C.paper, align: 'center', base: 'middle', alpha: 1 - seg(open, 0, 0.4) });
  const inside = seg(open, 0.6, 1);
  text(ctx, 'LLM', FRAME.x + 26, FRAME.y + 46, { font: F.sans(700, 28), color: C.ink, alpha: inside });

  // ——— what is lit: the most of either run
  const lit = runs.map((_, i) => lights(t, P.runs[i])).reduce((a, b) => ({
    in: Math.max(a.in, b.in), out: Math.max(a.out, b.out), box: Math.max(a.box, b.box), arw: Math.max(a.arw, b.arw),
  }));
  // the two arrows to the page: the context goes in, the chosen token comes out
  const ar = tw(t, P.open[1] - 0.1, 0.4, outCubic);
  pipe(ctx, ARW.x1, ARW.back, ARW.x0, ARW.back, ar, lit.in);
  pipe(ctx, ARW.x0, ARW.out, ARW.x1, ARW.out, ar, lit.out);
  // the trained parameters, which the black box held, and the arrow from them to the chances
  params(ctx, inside, lit.box);
  pipe(ctx, PARW.x0, PARW.y, PARW.x1, PARW.y, tw(t, P.open[1], 0.4, outCubic), lit.arw);

  // ——— the frame's ground: where the context and the chances go
  const lead = cue.lead;
  text(ctx, 'コンテクスト', CTX.x, FRAME.y + 82, { font: F.jp(700, 18), color: C.accent, alpha: tw(t, at('give') - lead, pace.enter) });
  text(ctx, 'トークンに切って読む', CTX.x + 124, FRAME.y + 82, { font: F.jp(500, 16), color: C.muted, alpha: tw(t, P.runs[0].split[0], pace.enter) });
  text(ctx, '次に来るトークンと、その確率', PROB.x, PROB.label, { font: F.jp(700, 18), color: C.ink2, alpha: tw(t, P.runs[0].steps[0].s, pace.enter) });

  // ——— the question alone, then the shaped text
  run(ctx, t, runs[0], P.runs[0], { given: GIVEN, steps: STEPS, next: NEXT, L: L1, copy: copy1 }, 1 - seg(t, P.out, P.out + 0.4));
  run(ctx, t, runs[1], P.runs[1], { given: GIVEN2, steps: STEPS2, next: null, L: L2, copy: copy2 }, 1);

  // ——— sentence e: what pre-training taught — what comes next (the chances) after a text (the context)
  const e = focus(t, [at('why'), at('what')], at('e.end') - cue.fall, cue).level;
  ring(ctx, CTX.x - 4, CTX.y - 4, runs[0].width + 8, 3 * L1.step + L1.h + 8, e[0], C.accent, 10);
  ring(ctx, PROB.x - 4, PROB.y - 4, ODDS.chipW + 18 + ODDS.barW + 8, 2 * PROB.step + ODDS.h + 8, e[1], C.accent, 10);
  ctx.restore();
}

// Where the given text leaves the page from, line by line, in the page's font.
const copy1 = [{ s: ASK, x: DOC.x + 28, y: docY(DOC, 0), font: BODY, px: 28, row: 0 }];
const copy2 = SHAPED.map(([who, s], i) => ({ s: `${who}：${s}`, x: SHP.x + 34, y: shpY(SHP, i), font: SBODY, px: 25, row: i }));

// One run of the LLM: the given text comes in and is cut into tokens, then the steps.
// R: its layout (prepare); S: its times (plan); D: its data.
function run(ctx, t, R, S, D, alpha) {
  if (alpha <= 0 || t < S.move[0]) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const { L } = D;
  const m = seg(t, S.move[0], S.move[1]);
  if (m < 1) {
    // in vermilion while it passes, as the arrow it goes along
    const e = inOutCubic(m);
    for (const c of D.copy) {
      ctx.save();
      ctx.translate(lerp(c.x, CTX.x + L.padX, e), lerp(c.y, CTX.y + c.row * L.step + L.h / 2 + 2, e));
      const k = lerp(1, L.px / c.px, e);
      ctx.scale(k, k);
      text(ctx, c.s, 0, 0, { font: c.font, color: C.accent, base: 'middle' });
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  const G = D.given.length;
  const n = S.steps.filter((st) => t >= st.land).length;
  const visible = G + n;
  // the context lights up, left to right, at the head of each slow step; the quick steps keep it lit
  const glowAt = (i) => {
    let g = S.fast ? Math.max(pulse(t, S.fast[0], S.fast[1] + 0.2, 0.1, 0.3) * 0.8, pulse(t, S.fast[1], S.fast[1] + 0.15, 0.05, 0.2)) : 0;
    for (const st of S.steps) {
      if (!st.slow) break;
      const on = st.s + 0.1 * st.d * (i / visible);
      g = Math.max(g, pulse(t, on, st.s + 0.45 * st.d, 0.08 * st.d, 0.1 * st.d));
    }
    return g;
  };
  const sp = inOutCubic(seg(t, S.split[0], S.split[1]));
  R.chips.forEach((c, i) => {
    if (i >= visible) return;
    let x = c.x;
    let o = { fill: C.tints[i % C.tints.length] };
    if (i < G) {
      // still one line of text while the split begins
      x = lerp(R.joined[i] - L.padX, c.x, sp);
      o.bg = sp;
      o.nl = sp;
      o.ink = sp;
    } else {
      const st = S.steps[i - G];
      const f = 1 - seg(t - st.land, st.slow ? 0.1 : 0.05, st.slow ? 0.6 : 0.35);
      if (f > 0.5) o = { fill: C.accent, color: '#fff' };
      else if (f > 0) o.fill = C.accentSoft;
    }
    o.lit = glowAt(i);
    token(ctx, x, c.y, c.w, c.s, L, o);
  });
  // the slot for the next token, while there is one to come
  const going = S.pending ? t < S.fast[1] : n < S.steps.length;
  if (S.pending || going) {
    const nx = R.chips[visible] ?? R.end;
    slot(ctx, nx.x, nx.y, Math.round(L.h), L.h, { alpha: tw(t, S.split[1], 0.5), lit: going ? 1 : 0, blink: going && Math.floor(t * 2.5) % 2 === 0 });
  }

  // ——— the steps
  let k = -1;
  S.steps.forEach((st, i) => {
    if (t >= st.s) k = i;
  });
  if (k >= 0) {
    const st = S.steps[k];
    const last = S.steps.length - 1;
    const pending = S.pending && t >= S.fast[1];
    const final = !S.pending && k === last;
    const cands = pending ? D.next : D.steps[k];
    let a = 1;
    let grow = 1;
    let hot = 1;
    let prev = null;
    let mix = 1;
    let gone = false;
    if (pending) {
      prev = D.steps[last];
      mix = outCubic(seg(t, S.fast[1] + 0.1, S.fast[1] + 0.4));
      hot = 0;
    } else if (st.slow) {
      a = tw(t, st.s + 0.5 * st.d, 0.12) * (final ? 1 : 1 - seg(t, st.s + 0.93 * st.d, st.s + st.d));
      grow = outCubic(seg(t, st.s + 0.52 * st.d, st.s + 0.7 * st.d));
      hot = seg(t, st.pick - 0.05, st.pick + 0.05) * (final ? 1 - seg(t, st.land, st.land + 0.4) : 1);
      // the chosen chip has left its row (the last one comes back once it has landed)
      gone = t >= st.fly[0] && !(final && t >= st.land);
    } else {
      // the quick steps: the bars move from the last step's lengths
      prev = k > SLOW ? D.steps[k - 1] : null;
      mix = outCubic(seg(t, st.s, st.s + 0.5 * st.d));
      if (!prev) grow = mix;
    }
    cands.forEach(([w, p], i) => {
      const y = PROB.y + i * PROB.step;
      const empty = (i === 0 && gone) || isNL(w);
      oddsRow(ctx, PROB.x, y, empty ? '' : w, { ...ODDS, p: prev ? lerp(prev[i][1], p, mix) : p, grow, hot: i === 0 ? hot : 0, alpha: a });
      if (isNL(w) && !(i === 0 && gone)) {
        const white = i === 0 && hot > 0.5;
        const lw = measure(ctx, ODDS.font, shown(w));
        const x = PROB.x + (ODDS.chipW - lw - 14) / 2;
        text(ctx, shown(w), x, y + ODDS.h / 2 + 2, { font: ODDS.font, color: white ? '#fff' : C.ink, base: 'middle', alpha: a });
        nlMark(ctx, x + lw + 1, y + ODDS.h / 2, white ? '#fff' : C.muted, a, 14);
      }
    });

    // the context drawn into the parameters, chip by chip (the slow steps only)
    if (st.slow && !pending) {
      const G0 = G + k;
      const cx = PBOX.x + PBOX.w / 2;
      const cy = PBOX.y + PBOX.h / 2;
      for (let i = 0; i < G0; i++) {
        const c = R.chips[i];
        const a0 = st.s + 0.15 * st.d + 0.1 * st.d * (i / G0);
        const p = seg(t, a0, a0 + 0.23 * st.d);
        if (p <= 0 || p >= 1) continue;
        const e = inCubic(p);
        const sc = lerp(1, 0.2, e);
        ctx.save();
        ctx.translate(lerp(c.x + c.w / 2, cx, e), lerp(c.y + L.h / 2, cy, e));
        ctx.scale(sc, sc);
        ctx.globalAlpha *= 1 - seg(p, 0.75, 1);
        token(ctx, -c.w / 2, -L.h / 2, c.w, c.s, L, { fill: C.accentSoft, color: C.accent });
        ctx.restore();
      }
    }

    // the chosen chip on its way to the end of the context
    if (st.slow && !pending) {
      const f = seg(t, st.fly[0], st.fly[1]);
      if (f > 0 && f < 1) {
        const to = R.chips[G + k];
        const e = inOutCubic(f);
        const x = lerp(PROB.x + (ODDS.chipW - to.w) / 2, to.x, e);
        const y = lerp(PROB.y + (ODDS.h - L.h) / 2, to.y, e) - Math.sin(Math.PI * e) * 30;
        token(ctx, x, y, to.w, to.s, L, { fill: C.accent, color: '#fff' });
      }
    }
  }
  ctx.restore();
}

// The trained parameters inside the LLM: the corner of sentence a's grid, as it settled. They do
// not change while it writes; the frame lights up while it computes.
function params(ctx, a, lit) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  text(ctx, 'パラメータで計算', PBOX.x, PROB.label, { font: F.jp(700, 18), color: C.ink2 });
  rr(ctx, PBOX.x, PBOX.y, PBOX.w, PBOX.h, 12);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.stroke();
  const { cols, rows, s, gap } = PCELL;
  const x0 = PBOX.x + (PBOX.w - (cols * (s + gap) - gap)) / 2;
  const y0 = PBOX.y + (PBOX.h - (rows * (s + gap) - gap)) / 2;
  const b = ctx.globalAlpha;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.globalAlpha = b * paramValue(r * 20 + c, 0, 1);
      ctx.fillStyle = C.ink;
      ctx.fillRect(x0 + c * (s + gap), y0 + r * (s + gap), s, s);
    }
  }
  ctx.globalAlpha = b;
  if (lit > 0.001) {
    ctx.globalAlpha = b * lit;
    rr(ctx, PBOX.x, PBOX.y, PBOX.w, PBOX.h, 12);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

// One of the arrows of the LLM, lit in vermilion while something passes.
function pipe(ctx, x0, y0, x1, y1, p, lit) {
  if (p <= 0) return;
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.ink2;
  ctx.fillStyle = C.ink2;
  arrow(ctx, x0, y0, x1, y1, p, 13);
  if (lit > 0) {
    ctx.globalAlpha *= lit;
    ctx.lineWidth = 5;
    ctx.strokeStyle = C.accent;
    ctx.fillStyle = C.accent;
    arrow(ctx, x0, y0, x1, y1, p, 15);
  }
  ctx.restore();
}

// A token of the context, in layout L. o: { fill, color, bg (0–1, the chip behind the text), nl
// (0–1, the line-break mark), ink (0–1; below 1 the text is still partly vermilion, as it came
// in), lit (0–1, a vermilion outline while the LLM reads it) }
function token(ctx, x, y, w, s, L, o = {}) {
  const bg = o.bg ?? 1;
  if (bg > 0) {
    ctx.save();
    ctx.globalAlpha *= bg;
    rr(ctx, x, y, w, L.h, 8);
    ctx.fillStyle = o.fill ?? C.tints[0];
    ctx.fill();
    ctx.restore();
  }
  const color = o.color ?? C.ink;
  const tx = x + L.padX;
  const ty = y + L.h / 2 + 2;
  const label = shown(s);
  const lw = text(ctx, label, tx, ty, { font: L.font, color, base: 'middle' });
  const ink = o.ink ?? 1;
  if (ink < 1) text(ctx, label, tx, ty, { font: L.font, color: C.accent, base: 'middle', alpha: 1 - ink });
  if (isNL(s)) nlMark(ctx, tx + lw + 1, y + L.h / 2, color === C.ink ? C.muted : color, o.nl ?? 1, L.nl);
  if ((o.lit ?? 0) > 0.001) {
    ctx.save();
    ctx.globalAlpha *= o.lit;
    rr(ctx, x, y, w, L.h, 8);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
}

// The line-break mark (↵), drawn: the fonts have no glyph for it. (x, cy) is its left middle;
// size is its width.
function nlMark(ctx, x, cy, color, a = 1, size = 14) {
  if (a <= 0.001) return;
  const u = size / 14;
  const w = size - 2;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8 * u;
  ctx.beginPath();
  ctx.moveTo(x + w, cy - 6 * u);
  ctx.lineTo(x + w, cy + 3 * u);
  ctx.lineTo(x + 3 * u, cy + 3 * u);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, cy + 3 * u);
  ctx.lineTo(x + 4 * u, cy);
  ctx.lineTo(x + 4 * u, cy + 6 * u);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ——— the pages ——————————————————————————————————————————————————————

// The page of the question alone. Beside the LLM until sentence g, when it leaves to the right;
// back on the left in sentence i's lead, beside the shaped one.
function doc(ctx, t, { lines }, P, { at, pace }) {
  const cue = pace.cue;
  const lead = cue.lead;
  const pop = (name) => tw(t, at(name) - lead, pace.enter);
  let r;
  let a;
  const back = t >= P.exit;
  if (!back) {
    const out = inOutCubic(seg(t, P.out, P.out + 0.5));
    r = { ...DOC, x: DOC.x + 80 * out };
    a = enter(t, P.land - 0.35, pace) * (1 - out);
  } else {
    const b = outCubic(seg(t, P.exit + 0.4, P.exit + 1.0));
    r = { ...CMP_L, x: CMP_L.x - 80 * (1 - b) };
    a = b;
    // over both pages: the same model
    text(ctx, '事前学習だけのモデルに、続きを書かせる', M.l, 120, { font: F.jp(700, 21), color: C.ink, alpha: b });
  }
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  text(ctx, back ? '質問だけのコンテクスト' : '事前学習だけのモデルに、続きを書かせる', r.x, r.y - (back ? 14 : 18), { font: F.jp(700, back ? 18 : 20), color: C.ink2 });
  card(ctx, r, 1);
  text(ctx, ASK, r.x + 28, docY(r, 0), { font: BODY, color: C.ink, base: 'middle', alpha: pop('ask') });

  // each token appears as it is chosen (the → lights up); no slide from the LLM
  const S = P.runs[0];
  const rows = ['', '', ''];
  let end = { line: 1, s: '' };
  S.steps.forEach((st, i) => {
    if (t < st.pick) return;
    const tok = STEPS[i][0][0];
    const l = lines[i];
    rows[l - 1] += shown(tok);
    end = isNL(tok) ? { line: l + 1, s: '' } : { line: l, s: rows[l - 1] };
  });
  rows.forEach((s, i) => {
    if (s) text(ctx, s, r.x + 28, docY(r, i + 1), { font: BODY, color: C.blue, base: 'middle' });
  });
  const x = r.x + 28 + measure(ctx, BODY, end.s);
  if (t >= S.steps[0].s && t < S.fast[1] && Math.floor(t * 2.5) % 2 === 0) {
    ctx.fillStyle = C.accent;
    ctx.fillRect(x + 3, docY(r, end.line) - 17, 3, 32);
  }
  // it would go on
  text(ctx, '……', x + 4, docY(r, end.line), { font: BODY, color: C.blue, base: 'middle', alpha: tw(t, S.fast[1] + 0.2, pace.enter) });
  tag(ctx, r.x + 28, r.y + 222, '続き：別の質問が並んだ（例）', { font: F.jp(700, 18), h: 34, padX: 12, fill: C.blueSoft, color: C.blue, alpha: tw(t, at('c.end') - 0.2, pace.enter) });
  const fig = pop('fig');
  text(ctx, 'InstructGPT の論文（2022）にも、', r.x + 28, r.y + 286, { font: F.jp(500, 16), color: C.ink2, alpha: fig });
  text(ctx, 'GPT-3 が質問に別の質問で続けた例がある', r.x + 28, r.y + 310, { font: F.jp(500, 16), color: C.ink2, alpha: fig });
  // ずんだもん expected an answer; the page is ringed while the question is asked
  const qlit = focus(t, [at('q')], at('d.end') - cue.fall, cue).level[0];
  ring(ctx, r.x, r.y, r.w, r.h, qlit, C.accent, 16);
  if (!back) text(ctx, '質問に答える形になるとは限らない', r.x, r.y + r.h + 44, { font: F.jp(700, 20), color: C.ink, alpha: pop('not') });
  ctx.restore();
}

// The shaped text: in from the right in sentence g, beside the LLM; in sentence i's lead it
// moves to the right half, beside the page of the question alone.
function shaped(ctx, t, { runs }, P, { at, pace }) {
  const cue = pace.cue;
  const lead = cue.lead;
  const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);
  const ra = pop('shape');
  if (ra <= 0.001) return;
  const cmp = inOutCubic(seg(t, P.exit + 0.2, P.exit + 1.0));
  const r = {
    x: lerp(SHP.x, CMP_R.x, cmp) + 80 * (1 - ra),
    y: lerp(SHP.y, CMP_R.y, cmp),
    w: lerp(SHP.w, CMP_R.w, cmp),
    h: lerp(SHP.h, CMP_R.h, cmp),
  };
  ctx.save();
  ctx.globalAlpha *= ra;
  text(ctx, '形を整えたコンテクスト', r.x, r.y - lerp(18, 14, cmp), { font: F.jp(700, lerp(20, 18, cmp)), color: C.ink2 });
  card(ctx, r, 1);
  const marks = tw(t, at('mark') - lead, 0.8);
  // the text column: wider once the role marks may come in
  const tx = r.x + 24 + lerp(80, 136, cmp) + 12;
  SHAPED.forEach(([who, s], i) => {
    // the examples with "質問と答えの組", the new question and "答え：" with "最後は"
    const a = i < 4 ? tw(t, at('qa') - lead + i * pace.stagger * 2, pace.enter) : tw(t, at('last') - lead + (i - 4) * pace.stagger * 2, pace.enter);
    if (a <= 0) return;
    const cy = shpY(r, i);
    // the label: 質問／答え, turning into the role marks of 4-2
    const role = ROLE[who === '質問' ? 'user' : 'assistant'];
    tag(ctx, r.x + 24, cy - 18, `${who}：`, { font: F.jp(700, 20), h: 36, padX: 10, fill: who === '質問' ? '#eef2ff' : C.panel, color: C.ink2, alpha: a * (1 - marks), r: 6 });
    tag(ctx, r.x + 24, cy - 18, role.name, { font: F.jp(700, 17), h: 36, padX: 10, fill: role.fill, color: role.color, alpha: a * marks, r: 6 });
    text(ctx, s, tx, cy + 1, { font: SBODY, color: C.ink, base: 'middle', alpha: a });
  });
  // the answer, token by token as it is chosen
  const S = P.runs[1];
  let ans = '';
  S.steps.forEach((st, i) => {
    if (t >= st.pick) ans += shown(STEPS2[i][0][0]);
  });
  const cy = shpY(r, 5);
  if (ans) text(ctx, ans, tx, cy + 1, { font: F.jp(700, 25), color: C.blue, base: 'middle' });
  const writing = t >= S.steps[0].s && t < S.steps[S.steps.length - 1].pick;
  if (writing && Math.floor(t * 2.5) % 2 === 0) {
    ctx.fillStyle = C.accent;
    ctx.fillRect(tx + measure(ctx, F.jp(700, 25), ans) + 3, cy - 15, 3, 30);
  }
  const lastLit = focus(t, [at('last')], at('h.end') - cue.fall, cue).level[0];
  ring(ctx, r.x + 18, cy - 24, 92, 48, lastLit, C.accent, 10);
  tag(ctx, r.x + 24, r.y + 320, '続きは、答えになった', { font: F.jp(700, 18), h: 34, padX: 12, fill: C.blueSoft, color: C.blue, alpha: tw(t, at('h2.end') - 0.2, pace.enter) });
  // sentence i2: the examples are only in the context
  const inex = focus(t, [at('inex')], at('i2.end') - cue.fall, cue).level[0];
  ring(ctx, r.x + 16, shpY(r, 0) - 24, r.w - 32, 3 * SLH + 48, inex, C.accent, 12);
  ctx.restore();
}

// Below the two pages: GPT-3's paper, the parameters, the marks.
function notes(ctx, t, P, { at, pace }) {
  const lead = pace.cue.lead;
  const pop = (name) => tw(t, at(name) - lead, pace.enter);
  const y = CMP_R.y + CMP_R.h;
  text(ctx, 'GPT-3 の論文（2020）：質問と答えの例をコンテクストに入れる（few-shot）', CMP_R.x, y + 48, { font: F.jp(700, 18), color: C.ink2, alpha: pop('few') });
  text(ctx, 'パラメータは変えない。例は、コンテクストの中にあるだけ', CMP_R.x, y + 80, { font: F.jp(500, 17), color: C.ink2, alpha: pop('nofix') });
  const ma = pop('mark');
  if (ma > 0) {
    ctx.save();
    ctx.globalAlpha = ma;
    ctx.strokeStyle = C.accent;
    ctx.fillStyle = C.accent;
    ctx.lineWidth = 2.5;
    arrow(ctx, CMP_R.x - 10, y + 124, CMP_R.x + 60, y + 124, outCubic(ma), 10);
    ctx.restore();
    text(ctx, 'チャットボットでは、決まった印で区切る（4-2）', CMP_R.x + 76, y + 131, { font: F.jp(700, 19), color: C.accent, alpha: ma });
  }
}

// A page of questions: where a question is followed by more questions. It leaves with the page.
function book(ctx, t, P, { at, pace }) {
  const lead = pace.cue.lead;
  const ba = tw(t, at('book') - lead, pace.enter) * (1 - seg(t, P.out, P.out + 0.4));
  if (ba <= 0) return;
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
  text(ctx, '問題集', BOOK.x + 26, BOOK.y + 36, { font: F.jp(700, 22), color: C.ink });
  ['問 1　……はどこですか？', '問 2　……はどこですか？', '問 3　……はどこですか？'].forEach((s, i) => {
    text(ctx, s, BOOK.x + 26, BOOK.y + 74 + i * 32, { font: F.jp(500, 19), color: C.ink2, alpha: tw(t, at('book') - lead + 0.2 + i * pace.stagger, pace.enter) });
  });
  const ca = tw(t, at('book') + 0.6, pace.enter);
  text(ctx, 'こういう文章では、', BOOK.x + BOOK.w + 24, BOOK.y + BOOK.h / 2 - 8, { font: F.jp(700, 19), color: C.ink2, alpha: ca });
  text(ctx, '質問のあとに、また質問が来る', BOOK.x + BOOK.w + 24, BOOK.y + BOOK.h / 2 + 22, { font: F.jp(700, 19), color: C.ink2, alpha: ca });
  ctx.restore();
}

// Sentence a: pre-training, looked back on. The first text is practised position by position
// while the voice says "predicting what comes next"; at "a great deal" more texts come in and
// many cells change at once; the grid settles before the voice ends. Then the scene clears, and
// the trained grid moves onto the black box — "this model" of sentence b — and fades into it.
function recall(ctx, t, texts, P, { at, pace }) {
  const lead = pace.cue.lead;
  const a0 = at('a');
  // when each text is practised: the first one slowly, the rest quickly, one after another
  const s0 = at('cont') - lead;
  const many = at('many') - lead;
  const runs = TEXTS.map((_, i) => (i === 0 ? [s0, many - 0.1] : [many + 0.1 + (i - 1) * 0.12, many + 0.75 + (i - 1) * 0.12]));
  const settle = runs[runs.length - 1][1];

  // the parameters: random at first, drifting as the practice goes on, still once it is done
  const go = at('a.done');
  const end = P.land;
  const gone = 1 - seg(t, end - 0.35, end + 0.15);
  if (gone > 0) {
    const k2 = seg(t, s0, settle);
    const m = inOutCubic(seg(t, go, end));
    ctx.save();
    ctx.globalAlpha = gone;
    // it lands just inside the box's rounded edge
    const IN = 14;
    ctx.translate(lerp(PG.x, BOX.x + IN, m), lerp(PG.y, BOX.y + IN, m));
    ctx.scale(lerp(1, (BOX.w - 2 * IN) / PARAMS_W, m), lerp(1, (BOX.h - 2 * IN) / PARAMS_H, m));
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
  ctx.globalAlpha *= a;
  rr(ctx, b.x, b.y, b.w, b.h, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
