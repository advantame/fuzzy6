// 4-1: a pre-trained model only continues. It opens on a look back at pre-training (3-6): the
// parameters, and many texts practised with what comes next hidden, until the grid settles. The
// grid fades into a black box, the LLM, which opens into a frame beside the page it writes on.
// Given a question alone, the question goes into the LLM, is cut into tokens, and the LLM writes
// on token by token: it reads the context, gives the next token's chances, and the chosen token
// joins the context and appears on the page. The first three steps go slowly enough to follow,
// the rest quickly; what it writes is more questions — in a page of questions, that is what comes
// next. ずんだもん expected an answer.
// Shape the text as question and answer, end it on "答え：", and the likely continuation is an
// answer; GPT-3's paper showed this with examples in the context. A chatbot keeps the shape with
// fixed marks: the labels turn into the role marks of 4-2. (The second half still has the old
// layout and does not fit beside the LLM yet; README, 2026-10-15.)
// The model's outputs, the chances, the parameters' values and the practice texts are an
// example. The tokens are o200k_base's.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, chip, chipWidth, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import { oddsRow, slot } from '../lib/odds.js';
import { trainingStrip } from '../lib/training.js';
import { ROLE } from '../lib/rig.js';
import { PARAMS_W, PARAMS_H, paramGrid, paramValue, flicker } from '../lib/params.js';
import { text, measure, rr, arrow, typed } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outCubic, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

const ASK = '日本の首都はどこですか？';

// ——— the LLM: the black box the trained grid fades into, and the frame it opens into
const BOX = { x: M.l, y: 236, w: 420, h: 180 };
const FRAME = { x: M.l, y: 112, w: 780, h: 488 };
// the context inside it, as token chips, one row per line of the page
const TOK = { font: F.jp(500, 24), h: 40, padX: 9, gap: 6 };
const CTX = { x: FRAME.x + 28, y: FRAME.y + 100, step: 50 };
// the next token's chances, below the context
const PROB = { x: FRAME.x + 28, label: FRAME.y + 322, y: FRAME.y + 344, step: 44 };
const ODDS = { chipW: 104, h: 36, barW: 420, font: F.jp(500, 22) };

// ——— the page: what is given, and what the model writes after it
const DOC = { x: 1000, y: 150, w: W - M.r - 1000, h: 330 };
const BODY = F.jp(500, 28);
const LH = 46;
const lineY = (i) => DOC.y + 42 + i * LH;

// ——— between them: the context goes in (←), the chosen token comes out (→)
const ARW = { x0: FRAME.x + FRAME.w + 18, x1: DOC.x - 18, back: 290, out: 342 };

// The question and what the model writes after it, cut by o200k_base. The question ends on a
// line break, so its last token is "？\n" (one token); the model writes one question per line.
const NL = '？\n';
const NLW = 14; // the line-break mark drawn after "？"
const GIVEN = ['日本', 'の', '首', '都', 'は', 'ど', 'こ', 'です', 'か', NL];
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
  [[NL, 0.86], ['？', 0.07], ['。', 0.03]],
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
  [[NL, 0.93], ['？', 0.04], ['。', 0.01]],
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
// without the chosen chip's slide.
const SLOW = 3;

// the shaped text: question and answer by turns, ending on "答え："
const RIGHT = { x: 830, y: 150, w: W - M.r - 830, h: 420 };
const SHAPED = [
  ['質問', 'フランスの首都はどこですか？'],
  ['答え', 'パリです。'],
  ['質問', 'イタリアの首都はどこですか？'],
  ['答え', 'ローマです。'],
  ['質問', ASK],
  ['答え', ''],
];
const ANSWER = '東京です。';
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
    { id: 'c', lead: 3.0, still: true, text: '答えではなく、「アメリカの首都はどこですか？」のように、\n{other}別の質問を続けることもあるの。' },
    { id: 'c2', text: '{fig}InstructGPT の論文にも、[GPT-3|ジーピーティースリー] が質問に、\n別の質問で続けた例が載っているわ。' },
    { id: 'd', by: 'zunda', text: '{q}質問したのに、答えてくれないのだ？' },
    { id: 'e', text: '事前学習で学んだのは、{why}書かれた文章に、\n{what}どんな続きが来るか、ということなの。' },
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
    const texts = TEXTS.map((toks) => toks.map((s) => chipWidth(ctx, s, TCHIP)));
    // the context's chips: the question's, then the ones the model writes, a row per line
    const gen = STEPS.map((st) => st[0][0]);
    let row = 0;
    let x = CTX.x;
    const chips = [...GIVEN, ...gen].map((s) => {
      const w = s === NL ? measure(ctx, TOK.font, '？') + NLW + TOK.padX * 2 : chipWidth(ctx, s, TOK);
      const c = { s, x, y: CTX.y + row * CTX.step, w };
      x += w + TOK.gap;
      if (s === NL) {
        row++;
        x = CTX.x;
      }
      return c;
    });
    const end = { x, y: CTX.y + row * CTX.step };
    // where each of the question's tokens sits while it is still one line of text
    let prefix = '';
    const joined = GIVEN.map((s) => {
      const x0 = CTX.x + TOK.padX + measure(ctx, TOK.font, prefix);
      prefix += s === NL ? '？' : s;
      return x0;
    });
    // the page: which line each written token goes on
    let line = 1;
    const lines = gen.map((s) => {
      const l = line;
      if (s === NL) line++;
      return l;
    });
    const ctxW = Math.max(...chips.map((c) => c.x + c.w)) - CTX.x;
    return { texts, chips, end, joined, lines, ctxW };
  },

  draw(ctx, t, s, k) {
    const { at, pace } = k;
    const P = plan(at, pace);
    trainingStrip(ctx, { alpha: enter(t, at('a'), pace), lit: [0] });
    recall(ctx, t, s.texts, P, k);
    page(ctx, t, s, P, k);
    machine(ctx, t, s, P, k);
    book(ctx, t, k);
    shaped(ctx, t, k);
    example(ctx, M.l, 836, enter(t, P.land - 0.35, pace), '確率と、モデルが書いた続きは説明のための例。切り方は GPT-4o のもの');
    source(ctx, 'Brown ほか（2020）', tw(t, at('few') - pace.cue.lead, pace.enter), SOURCE_RIGHT);
  },
});

// The times of the clip's motions, from the timeline and the pace.
function plan(at, pace) {
  const lead = pace.cue.lead;
  // the grid of sentence a lands on the black box at the end of sentence b's lead
  const land = at('b.voice') - pace.pre;
  // "このモデルに": the box opens into a frame
  const open = [at('model'), at('ask') - lead];
  // "コンテクストとして与えた": the question goes into the LLM, then is cut into tokens
  const move = [at('give') - lead, at('give') - lead + 0.6];
  const split = [move[1], move[1] + 0.4];
  // sentence c: the slow steps fill its lead, the quick ones run until "別の質問を"
  const c0 = at('c');
  const f0 = at('c.voice') - pace.pre;
  const f1 = at('other');
  const T = (f0 - c0) / SLOW;
  const dt = (f1 - f0) / (STEPS.length - SLOW);
  const steps = STEPS.map((_, i) => {
    const slow = i < SLOW;
    const s = slow ? c0 + i * T : f0 + (i - SLOW) * dt;
    const d = slow ? T : dt;
    const pick = s + (slow ? 0.55 : 0.5) * d;
    // a slow step's chip slides from the chances to the end of the context
    const fly = slow ? [s + 0.6 * d, s + 0.9 * d] : null;
    return { s, d, slow, pick, fly, land: slow ? fly[1] : pick };
  });
  return { land, open, move, split, f0, f1, steps };
}

// 0 → 1 → 0: on from a (over rise), off from b (over fall).
const pulse = (t, a, b, rise = 0.08, fall = 0.25) => outCubic(seg(t, a, a + rise)) * (1 - seg(t, b, b + fall));

// ——— the LLM ——————————————————————————————————————————————————————

function machine(ctx, t, { chips, end, joined, ctxW }, P, { at, pace }) {
  const cue = pace.cue;
  const la = enter(t, P.land - 0.35, pace);
  if (la <= 0) return;
  const open = inOutCubic(seg(t, P.open[0], P.open[1]));
  const r = {
    x: lerp(BOX.x, FRAME.x, open),
    y: lerp(BOX.y, FRAME.y, open),
    w: lerp(BOX.w, FRAME.w, open),
    h: lerp(BOX.h, FRAME.h, open),
  };
  ctx.save();
  rr(ctx, r.x, r.y, r.w, r.h, 22);
  if (open < 1) {
    ctx.globalAlpha = la * (1 - open);
    ctx.fillStyle = C.ink;
    ctx.fill();
  }
  if (open > 0) {
    ctx.globalAlpha = la * open;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, 'LLM', r.x + r.w / 2, r.y + r.h / 2 + 4, { font: F.sans(700, 64), color: C.paper, align: 'center', base: 'middle', alpha: la * (1 - seg(open, 0, 0.4)) });
  text(ctx, 'LLM', FRAME.x + 26, FRAME.y + 46, { font: F.sans(700, 28), color: C.ink, alpha: la * seg(open, 0.6, 1) });

  // ——— the two arrows to the page: the context goes in, the chosen token comes out
  const ar = tw(t, P.open[1] - 0.1, 0.4, outCubic);
  const inLit = pulse(t, P.move[0], P.move[1]);
  const outLit = Math.max(
    ...P.steps.filter((st) => st.slow).map((st) => pulse(t, st.pick - 0.05, st.pick + 0.3)),
    pulse(t, P.f0, P.f1, 0.1, 0.3),
  );
  pipe(ctx, ARW.x1, ARW.back, ARW.x0, ARW.back, ar, inLit);
  pipe(ctx, ARW.x0, ARW.out, ARW.x1, ARW.out, ar, outLit);

  // ——— the question comes in along the top, then is cut into tokens
  const lead = cue.lead;
  const given = tw(t, at('give') - lead, pace.enter);
  text(ctx, 'コンテクスト', CTX.x, FRAME.y + 82, { font: F.jp(700, 18), color: C.accent, alpha: given });
  text(ctx, 'トークンに切って読む', CTX.x + 124, FRAME.y + 82, { font: F.jp(500, 16), color: C.muted, alpha: tw(t, P.split[0], pace.enter) });
  const m = seg(t, P.move[0], P.move[1]);
  if (m > 0 && m < 1) {
    const e = inOutCubic(m);
    ctx.save();
    ctx.translate(lerp(DOC.x + 28, CTX.x + TOK.padX, e), lerp(lineY(0), CTX.y + TOK.h / 2 + 2, e));
    ctx.scale(lerp(1, 24 / 28, e), lerp(1, 24 / 28, e));
    // in vermilion while it passes, as the arrow it goes along
    text(ctx, ASK, 0, 0, { font: BODY, color: C.accent, base: 'middle' });
    ctx.restore();
  }
  if (m < 1) return;

  // how many of the written tokens have joined the context, and the context's glow
  const n = P.steps.filter((st) => t >= st.land).length;
  const visible = GIVEN.length + n;
  const glowAt = (i) => {
    let g = pulse(t, P.f0, P.f1 + 0.2, 0.1, 0.3) * 0.8;
    for (const st of P.steps) {
      if (!st.slow) break;
      const on = st.s + 0.15 * st.d * (i / visible);
      g = Math.max(g, pulse(t, on, st.s + 0.45 * st.d, 0.12 * st.d, 0.15 * st.d));
    }
    // the last step's glow, before its chances come up
    return Math.max(g, pulse(t, P.f1, P.f1 + 0.15, 0.05, 0.2));
  };
  const sp = inOutCubic(seg(t, P.split[0], P.split[1]));
  chips.forEach((c, i) => {
    if (i >= visible) return;
    let x = c.x;
    let o = { fill: C.tints[i % C.tints.length] };
    if (i < GIVEN.length) {
      // still one line of text while the split begins
      x = lerp(joined[i] - TOK.padX, c.x, sp);
      o.bg = sp;
      o.nl = sp;
      o.ink = sp;
    } else {
      const st = P.steps[i - GIVEN.length];
      const f = 1 - seg(t - st.land, st.slow ? 0.1 : 0.05, st.slow ? 0.6 : 0.35);
      if (f > 0.5) o = { fill: C.accent, color: '#fff' };
      else if (f > 0) o.fill = C.accentSoft;
    }
    o.lit = glowAt(i);
    token(ctx, x, c.y, c.w, c.s, o);
  });
  // the slot for the next token
  const nx = chips[visible] ?? end;
  const going = t < P.f1;
  slot(ctx, nx.x, nx.y, 40, TOK.h, { alpha: tw(t, P.split[1], pace.enter), lit: going ? 1 : 0, blink: going && Math.floor(t * 2.5) % 2 === 0 });

  // ——— the next token's chances
  text(ctx, '次に来るトークンと、その確率', PROB.x, PROB.label, { font: F.jp(700, 18), color: C.ink2, alpha: tw(t, P.steps[0].s, pace.enter) });
  const last = P.steps.length - 1;
  let k = -1;
  P.steps.forEach((st, i) => {
    if (t >= st.s) k = i;
  });
  if (k >= 0) {
    const st = P.steps[k];
    const pending = t >= P.f1;
    const cands = pending ? NEXT : STEPS[k];
    let alpha = 1;
    let grow = 1;
    let hot = 1;
    let prev = null;
    let mix = 1;
    if (pending) {
      prev = STEPS[last];
      mix = outCubic(seg(t, P.f1 + 0.1, P.f1 + 0.4));
      hot = 0;
    } else if (st.slow) {
      alpha = tw(t, st.s + 0.15 * st.d, 0.15) * (1 - seg(t, st.s + 0.9 * st.d, st.s + st.d));
      grow = outCubic(seg(t, st.s + 0.2 * st.d, st.s + 0.5 * st.d));
      hot = seg(t, st.pick - 0.05, st.pick + 0.05);
    } else {
      // the quick steps: the bars move from the last step's lengths
      prev = k > SLOW ? STEPS[k - 1] : null;
      mix = outCubic(seg(t, st.s, st.s + 0.5 * st.d));
      if (!prev) grow = mix;
    }
    cands.forEach(([w, p], i) => {
      // a slow step's chosen chip has left its row
      const gone = i === 0 && st.slow && !pending && t >= st.fly[0];
      oddsRow(ctx, PROB.x, PROB.y + i * PROB.step, gone || w === NL ? '' : w, {
        ...ODDS,
        p: prev ? lerp(prev[i][1], p, mix) : p,
        grow,
        hot: i === 0 ? hot : 0,
        alpha: alpha * la,
      });
      if (w === NL && !gone) {
        const cx = PROB.x + ODDS.chipW / 2;
        const cy = PROB.y + i * PROB.step + ODDS.h / 2;
        const white = i === 0 && hot > 0.5;
        const qw = measure(ctx, ODDS.font, '？');
        text(ctx, '？', cx - (qw + NLW) / 2, cy + 2, { font: ODDS.font, color: white ? '#fff' : C.ink, base: 'middle', alpha: alpha * la });
        nlMark(ctx, cx - (qw + NLW) / 2 + qw + 1, cy, white ? '#fff' : C.muted, alpha * la);
      }
    });
    // the chosen chip on its way to the end of the context
    if (st.slow && !pending) {
      const f = seg(t, st.fly[0], st.fly[1]);
      if (f > 0 && f < 1) {
        const to = chips[GIVEN.length + k];
        const e = inOutCubic(f);
        const x = lerp(PROB.x + (ODDS.chipW - to.w) / 2, to.x, e);
        const y = lerp(PROB.y + (ODDS.h - TOK.h) / 2, to.y, e) - Math.sin(Math.PI * e) * 30;
        token(ctx, x, y, to.w, to.s, { fill: C.accent, color: '#fff' });
      }
    }
  }

  // ——— sentence e: what pre-training taught — what comes next (the chances) after a text (the context)
  const lit = focus(t, [at('why'), at('what')], at('e.end') - cue.fall, cue).level;
  ring(ctx, CTX.x - 4, CTX.y - 4, ctxW + 8, 3 * CTX.step + TOK.h + 8, lit[0], C.accent, 10);
  ring(ctx, PROB.x - 4, PROB.y - 4, ODDS.chipW + 18 + ODDS.barW + 8, 2 * PROB.step + ODDS.h + 8, lit[1], C.accent, 10);
}

// One of the arrows between the LLM and the page, lit in vermilion while something passes.
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

// A token of the context. o: { fill, color, bg (0–1, the chip behind the text), nl (0–1, the
// line-break mark), ink (0–1; below 1 the text is still partly vermilion, as it came in), lit
// (0–1, a vermilion outline while the LLM reads it) }
function token(ctx, x, y, w, s, o = {}) {
  const bg = o.bg ?? 1;
  if (bg > 0) {
    ctx.save();
    ctx.globalAlpha *= bg;
    rr(ctx, x, y, w, TOK.h, 8);
    ctx.fillStyle = o.fill ?? C.tints[0];
    ctx.fill();
    ctx.restore();
  }
  const color = o.color ?? C.ink;
  const tx = x + TOK.padX;
  const ty = y + TOK.h / 2 + 2;
  const label = s === NL ? '？' : s;
  const qw = text(ctx, label, tx, ty, { font: TOK.font, color, base: 'middle' });
  const ink = o.ink ?? 1;
  if (ink < 1) text(ctx, label, tx, ty, { font: TOK.font, color: C.accent, base: 'middle', alpha: 1 - ink });
  if (s === NL) nlMark(ctx, tx + qw + 1, y + TOK.h / 2, color === C.ink ? C.muted : color, o.nl ?? 1);
  if ((o.lit ?? 0) > 0.001) {
    ctx.save();
    ctx.globalAlpha *= o.lit;
    rr(ctx, x, y, w, TOK.h, 8);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
}

// The line-break mark (↵), drawn: the fonts have no glyph for it. (x, cy) is its left middle.
function nlMark(ctx, x, cy, color, a = 1) {
  if (a <= 0.001) return;
  const w = NLW - 2;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x + w, cy - 6);
  ctx.lineTo(x + w, cy + 3);
  ctx.lineTo(x + 3, cy + 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, cy + 3);
  ctx.lineTo(x + 4, cy);
  ctx.lineTo(x + 4, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ——— the page ——————————————————————————————————————————————————————

function page(ctx, t, { lines }, P, { at, pace }) {
  const cue = pace.cue;
  const lead = cue.lead;
  const pop = (name) => tw(t, at(name) - lead, pace.enter);
  const la = enter(t, P.land - 0.35, pace);
  text(ctx, '事前学習だけのモデルに、続きを書かせる', DOC.x, DOC.y - 18, { font: F.jp(700, 20), color: C.ink2, alpha: la });
  card(ctx, DOC, la);
  text(ctx, ASK, DOC.x + 28, lineY(0), { font: BODY, color: C.ink, base: 'middle', alpha: pop('ask') });

  // each token appears as it is chosen (the → lights up); no slide from the LLM
  const rows = ['', '', ''];
  let end = { line: 1, s: '' };
  P.steps.forEach((st, i) => {
    if (t < st.pick) return;
    const tok = STEPS[i][0][0];
    const l = lines[i];
    rows[l - 1] += tok === NL ? '？' : tok;
    end = tok === NL ? { line: l + 1, s: '' } : { line: l, s: rows[l - 1] };
  });
  rows.forEach((s, i) => {
    if (s) text(ctx, s, DOC.x + 28, lineY(i + 1), { font: BODY, color: C.blue, base: 'middle' });
  });
  const x = DOC.x + 28 + measure(ctx, BODY, end.s);
  if (t >= P.steps[0].s && t < P.f1 && Math.floor(t * 2.5) % 2 === 0) {
    ctx.fillStyle = C.accent;
    ctx.fillRect(x + 3, lineY(end.line) - 17, 3, 32);
  }
  // it would go on
  text(ctx, '……', x + 4, lineY(end.line), { font: BODY, color: C.blue, base: 'middle', alpha: tw(t, P.f1 + 0.2, pace.enter) });
  tag(ctx, DOC.x + 28, DOC.y + 222, '続き：別の質問が並んだ（例）', { font: F.jp(700, 18), h: 34, padX: 12, fill: C.blueSoft, color: C.blue, alpha: tw(t, at('c.end') - 0.2, pace.enter) });
  const fig = pop('fig');
  text(ctx, 'InstructGPT の論文（2022）にも、', DOC.x + 28, DOC.y + 286, { font: F.jp(500, 16), color: C.ink2, alpha: fig });
  text(ctx, 'GPT-3 が質問に別の質問で続けた例がある', DOC.x + 28, DOC.y + 310, { font: F.jp(500, 16), color: C.ink2, alpha: fig });
  // ずんだもん expected an answer; the page is ringed while the question is asked
  const qlit = focus(t, [at('q')], at('d.end') - cue.fall, cue).level[0];
  ring(ctx, DOC.x, DOC.y, DOC.w, DOC.h, qlit, C.accent, 16);
  text(ctx, '質問に答える形になるとは限らない', DOC.x, DOC.y + DOC.h + 44, { font: F.jp(700, 20), color: C.ink, alpha: pop('not') });
}

// A page of questions: where a question is followed by more questions.
function book(ctx, t, { at, pace }) {
  const lead = pace.cue.lead;
  const ba = tw(t, at('book') - lead, pace.enter);
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
  ctx.restore();
  text(ctx, '問題集', BOOK.x + 26, BOOK.y + 36, { font: F.jp(700, 22), color: C.ink, alpha: ba });
  ['問 1　……はどこですか？', '問 2　……はどこですか？', '問 3　……はどこですか？'].forEach((s, i) => {
    text(ctx, s, BOOK.x + 26, BOOK.y + 74 + i * 32, { font: F.jp(500, 19), color: C.ink2, alpha: tw(t, at('book') - lead + 0.2 + i * pace.stagger, pace.enter) });
  });
  const ca = tw(t, at('book') + 0.6, pace.enter);
  text(ctx, 'こういう文章では、', BOOK.x + BOOK.w + 24, BOOK.y + BOOK.h / 2 - 8, { font: F.jp(700, 19), color: C.ink2, alpha: ca });
  text(ctx, '質問のあとに、また質問が来る', BOOK.x + BOOK.w + 24, BOOK.y + BOOK.h / 2 + 22, { font: F.jp(700, 19), color: C.ink2, alpha: ca });
}

// ——— the shaped text (sentences g–j). Still the layout from before the LLM frame came in: it
// does not fit beside the frame yet.
function shaped(ctx, t, { at, pace }) {
  const cue = pace.cue;
  const lead = cue.lead;
  const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);
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
  ctx.globalAlpha = a;
  rr(ctx, b.x, b.y, b.w, b.h, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
