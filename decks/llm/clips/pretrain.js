// 3-6: where the numbers come from. The table, the looking back and the scoring are all made of
// numbers — the parameters, 175 billion in GPT-3's largest model — and they start out random,
// so the chances they give mean nothing. Training reads real text with what comes next hidden,
// lets the model guess, and nudges every parameter a little so that the right token's chance
// goes up: the lower its chance was, the bigger the miss. Done at every position of a great deal
// of text, this is pre-training. ずんだもん asks whether the model keeps learning while it is
// used: it does not, the parameters are fixed. The result writes continuations well, and is not
// yet a chatbot (chapter 4).
// The guesses and the parameters' values are an example; the counts are published figures.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, chip, chipWidth, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import { oddsRow, slot } from '../lib/odds.js';
import { strip } from '../lib/inside.js';
import { text, rr, line, arrow } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outCubic, outExpo } from '../../../src/kit/ease.js';
import { enter, focus, dimmed, ring } from '../../../src/kit/cue.js';
import { hash2 } from '../../../src/kit/random.js';
import { PARAMS, PARAMS_W as gridW, PARAMS_H as gridH, paramGrid, paramValue, flicker } from '../lib/params.js';

// ——— the parameters, as a grid of numbers
const GRID = { x: M.l, y: 168, ...PARAMS };

// ——— one practice step on 1-2's sentence (o200k_base tokens)
const TOKS = ['の', 'ど', 'が', 'かわ', 'いた', 'ので', '、水', 'を', '飲', 'ん', 'だ', '。'];
const AT = 8; // the position after 「を」: the answer is 飲
const TX = 700;
const TOK = { font: F.jp(500, 28), h: 48, padX: 10, gap: 6 };
const SENT_Y = 168;
const GUESS = [
  // [token, chance before the step, after]
  ['読', 0.06, 0.058],
  ['山', 0.05, 0.049],
  ['飲', 0.02, 0.03],
  ['青', 0.04, 0.039],
];
const ODDS = { chipW: 70, h: 40, barW: 330, font: F.jp(500, 22) };
const OY = 300;
const OSTEP = 52;

// ——— how much text
const DATA = [
  { name: 'GPT-3（2020 年）', n: 300e9, label: '3000 億', at: 'g3' },
  { name: 'Llama 3（2024 年）', n: 15e12, label: '15 兆超', at: 'l3' },
  { name: 'Nemotron-H-56B（2025 年）', n: 20e12, label: '20 兆', at: 'y25' },
  { name: 'Qwen3（2025 年）', n: 36e12, label: '約 36 兆', at: 'y25' },
];
const DMAX = 36e12;
const DY = 652;

export default clip({
  id: 'pretrain',
  title: '予測を練習する',
  kicker: '事前学習',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'では、確率を出すための計算は、{how}どうやって決まったのかしら。' },
    { id: 'b', text: 'ここまでに見た、{t1}埋め込みの表や、{t2}前を見る計算、\n{t3}確率を出す計算には、たくさんの数が使われているの。' },
    { id: 'c', still: true, text: '計算のしかたを決める、この数を、{param}パラメータと呼ぶわ。\n[GPT-3|ジーピーティースリー] の最大のモデルには、{count}1750 億個あるのよ。' },
    { id: 'd', text: '{rand}はじめは、多くのパラメータを、乱数で決めておくの。\nまだ、文章の続きを予測するようには、学んでいないわ。' },
    { id: 'e', text: 'そこで、{text}たくさんの文章を読ませて、\n{guess}先を隠したまま、次のトークンを当てさせるのよ。' },
    { id: 'f', text: 'たとえば、この文では、\n{ans}「水を」の次に、[「飲」|「のむ」]の字が続いているわね。' },
    { id: 'g', text: '{low}モデルが[「飲」|「のむ」]の字に付けた確率が低いほど、\n外れが大きかったと考えるの。' },
    { id: 'h', text: '{many}いろいろな位置での外れをまとめて、\n{nudge}それが小さくなるように、パラメータを少しずつ調整するわ。' },
    { id: 'h2', still: true, text: 'どう変えると外れが減るかは、{grad}計算で求められるのよ。' },
    { id: 'i', text: '{every}これを、たくさんの文章で、何度もくり返すの。\n学習のあいだも、先の答えは見せないようにしているわ。' },
    { id: 'j', text: '大量の文章でこの練習をして、モデルの土台を作る段階を、\n{pre}事前学習と呼ぶのよ。' },
    { id: 'k', text: '使われる文章の量は、{g3}2020 年の [GPT-3|ジーピーティースリー] で 3000 億トークン、\n{l3}2024 年の [Llama 3|ラマスリー] では、15 兆トークンを超えたわ。' },
    { id: 'k2', still: true, text: '{y25}2025 年には、20 兆や 36 兆トークンで学習したモデルも、\n公表されているの。' },
    { id: 'l', by: 'zunda', text: '{q}使っているうちに、どんどん覚えていったりはしないのだ？' },
    { id: 'm', text: 'ふつうに答えを作るあいだは、{fix}パラメータは変わらないわ。\nでも、会話や保存した情報を、答えの手がかりにはできるの。' },
    { id: 'm2', text: 'パラメータを変える{more}追加の学習は、また別の仕組みよ。' },
    { id: 'n', text: 'こうして、{base}文章の続きを予測する力が育つわ。' },
    { id: 'n2', tail: 0.6, text: '相手の指示に沿って答える力を整えるために、\n{yet}さらに学習を重ねるのよ。それは、次の章で見ていきましょう。' },
  ],

  prepare(ctx) {
    let x = TX;
    const toks = TOKS.map((s) => {
      const w = chipWidth(ctx, s, TOK);
      const out = { s, x, w };
      x += w + TOK.gap;
      return out;
    });
    return { toks };
  },

  draw(ctx, t, { toks }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    strip(ctx, { alpha: enter(t, at('a'), pace), lit: [1, 2, 3] , vector: true });

    // ——— the parameters
    const named = focus(t, [at('t1'), at('t2'), at('t3')], at('b.end') - cue.fall, cue);
    const ga = Math.max(tw(t, at('t1') - lead, pace.enter), 0);
    const nudge = at('nudge');
    const every = at('every');
    text(ctx, 'パラメータ（学習で決まる数）', GRID.x, GRID.y - 18, { font: F.jp(700, 20), color: C.ink2, alpha: pop('param') });
    // sentence a asks where the numbers come from: the grid stands empty until b fills it
    const ask = enter(t, at('a'), pace) * (1 - ga);
    if (ask > 0) {
      ctx.save();
      ctx.globalAlpha = ask;
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1.5;
      for (let r = 0; r < GRID.rows; r++) {
        for (let c = 0; c < GRID.cols; c++) ctx.strokeRect(GRID.x + c * (GRID.cell + GRID.gap) + 0.5, GRID.y + r * (GRID.cell + GRID.gap) + 0.5, GRID.cell - 1, GRID.cell - 1);
      }
      ctx.restore();
      text(ctx, '？', GRID.x + gridW / 2, GRID.y + gridH / 2 + 30, { font: F.jp(700, 84), color: C.muted, align: 'center', alpha: ask });
    }
    if (ga > 0) {
      const k1 = seg(t, nudge, nudge + 0.4);
      const k2 = seg(t, every, every + 3);
      paramGrid(ctx, GRID.x, GRID.y, (r, c, id) => {
        // the grid fills in part by part as sentence b names them
        const part = c < 7 ? 0 : c < 14 ? 1 : 2;
        const a = tw(t, at(['t1', 't2', 't3'][part]) - lead + (r + c % 7) * 0.012, pace.enter);
        if (a <= 0) return null;
        // a ripple runs through the grid with each nudge
        const d1 = t - (nudge + (c / GRID.cols) * 0.4);
        let flash = d1 >= 0 && d1 < 0.35 ? 1 - d1 / 0.35 : 0;
        if (t >= every && t < every + 3) flash = Math.max(flash, flicker(id, t - every));
        // random to begin with; each nudge moves it a little, many nudges move it more
        return { a, v: paramValue(id, k1, k2), dim: dimmed(named.level[part], named.any, cue), flash };
      });
      ['埋め込みの表', '前を見る計算', '確率を出す計算'].forEach((s, part) => {
        const x = GRID.x + part * 7 * (GRID.cell + GRID.gap);
        const w = (part === 2 ? 6 : 7) * (GRID.cell + GRID.gap) - GRID.gap;
        const a = tw(t, at(['t1', 't2', 't3'][part]) - lead, pace.enter);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = named.level[part] > 0.5 ? C.accent : C.muted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, GRID.y + gridH + 8);
        ctx.lineTo(x, GRID.y + gridH + 14);
        ctx.lineTo(x + w, GRID.y + gridH + 14);
        ctx.lineTo(x + w, GRID.y + gridH + 8);
        ctx.stroke();
        ctx.restore();
        text(ctx, s, x + w / 2, GRID.y + gridH + 38, { font: F.jp(700, 16), color: named.level[part] > 0.5 ? C.accent : C.ink2, align: 'center', alpha: a });
      });
    }
    const big = pop('count');
    const bw = text(ctx, '1750 億', GRID.x, GRID.y + gridH + 128, { font: F.cond(700, 76), color: C.ink, alpha: big, ls: -1 });
    text(ctx, '個（GPT-3 のいちばん大きなモデル）', GRID.x + bw + 10, GRID.y + gridH + 126, { font: F.jp(700, 19), color: C.ink2, alpha: big });
    tag(ctx, GRID.x + gridW - 4, GRID.y - 44, 'はじめは、乱数', { font: F.jp(700, 17), h: 32, padX: 12, fill: '#fff', stroke: C.ink2, color: C.ink2, align: 'right', alpha: pop('rand') * (1 - tw(t, at('fix') - lead, pace.enter)) });
    const fix = focus(t, [at('fix')], at('m.end') - cue.fall, cue).level[0];
    ring(ctx, GRID.x, GRID.y, gridW, gridH, fix, C.accent, 8);

    // ——— practice on a sentence: what comes next is hidden
    const pa = enter(t, at('text') - lead, pace);
    text(ctx, '学習に使う文章の一つ（GPT-4o の切り方）', TX, SENT_Y - 18, { font: F.jp(700, 19), color: C.ink2, alpha: pa });
    const reveal = pop('ans');
    const sweep = seg(t, every, every + 3); // sentence i: the hidden position moves along
    const cur = sweep > 0 ? Math.min(TOKS.length - 1, 1 + Math.floor(sweep * (TOKS.length - 1))) : AT;
    toks.forEach((c, k) => {
      // after sentence h's first words every position's answer is in view: the misses are worked out together
      const together = t >= at('many') - lead && t < every;
      const hidden = k >= cur && !together && !(k === AT && sweep === 0 && reveal > 0.5 && t < every);
      const a = pa * tw(t, at('text') - lead + k * 0.03, pace.enter);
      if (k === cur && t >= at('guess') - lead) {
        slot(ctx, c.x, SENT_Y, c.w, TOK.h, { alpha: a * (1 - (k === AT && sweep === 0 ? reveal : 0)), lit: 1 });
        if (k === AT && sweep === 0) chip(ctx, c.x, SENT_Y, c.s, { ...TOK, fill: C.green, color: '#fff', alpha: a * reveal });
        return;
      }
      chip(ctx, c.x, SENT_Y, c.s, { ...TOK, fill: hidden && t >= at('guess') - lead ? C.panel : C.tints[k % C.tints.length], color: hidden && t >= at('guess') - lead ? C.panel : C.ink, alpha: a });
    });
    // sentence h: the misses at many positions are put together
    const manyA = pop('many') * (1 - seg(t, every - 0.2, every));
    if (manyA > 0) {
      const shrink = lerp(1, 0.75, inOutCubic(seg(t, nudge, nudge + 0.8)));
      toks.forEach((c, k) => {
        if (k === 0) return;
        const h = (8 + 22 * hash2(k, 9)) * shrink;
        const a = manyA * tw(t, at('many') - lead + k * 0.04, 0.3);
        ctx.globalAlpha = a;
        ctx.fillStyle = C.red;
        ctx.fillRect(c.x + c.w / 2 - 5, SENT_Y + TOK.h + 40 - h, 10, h);
        ctx.globalAlpha = 1;
      });
      text(ctx, '位置ごとの外れ（例）', W - M.r, SENT_Y + TOK.h + 64, { font: F.jp(700, 15), color: C.red, align: 'right', alpha: manyA });
    }
    if (t >= at('guess') - lead && sweep === 0 && t < at('many') - lead) text(ctx, '隠す', toks[AT].x + toks[AT].w / 2, SENT_Y + TOK.h + 24, { font: F.jp(700, 16), color: C.accent, align: 'center', alpha: pop('guess') * (1 - reveal) });
    if (sweep > 0 && sweep < 1) text(ctx, 'あらゆる位置で', toks[cur].x + toks[cur].w / 2, SENT_Y + TOK.h + 24, { font: F.jp(700, 16), color: C.accent, align: 'center' });

    // the model's guess for the hidden token, before and after the nudge
    const oa = pop('guess');
    const after = inOutCubic(seg(t, nudge, nudge + 0.8));
    const lowLit = focus(t, [at('low')], at('g.end') - cue.fall, cue).level[0];
    if (oa > 0) {
      text(ctx, 'モデルの予測（「水を」の次）', TX, OY - 22, { font: F.jp(700, 19), color: C.ink2, alpha: oa });
      GUESS.forEach(([s, p0, p1], i) => {
        const p = lerp(p0, p1, after);
        const right = s === '飲';
        oddsRow(ctx, TX, OY + i * OSTEP, s, {
          ...ODDS,
          p: p / 0.1,
          alpha: oa * (right ? 1 : dimmed(0, Math.max(lowLit, reveal * 0.6), cue)),
          grow: tw(t, at('guess') + i * pace.stagger, 0.5, outCubic),
          hot: right ? reveal : 0,
          num: tw(t, at('guess') + 0.3 + i * pace.stagger, 0.4),
          label: `${(p * 100).toFixed(1)}%`,
        });
      });
      text(ctx, 'そのほか 約 20 万種類', TX, OY + 4 * OSTEP + 24, { font: F.jp(500, 17), color: C.muted, alpha: oa });
    }
    // how big the miss was
    const ma = pop('low');
    if (ma > 0) {
      const x = TX + 560;
      const y = OY + 2 * OSTEP;
      text(ctx, '正解の確率が低いほど', x, y - 8, { font: F.jp(700, 17), color: C.ink2, alpha: ma });
      text(ctx, '外れが大きい', x, y + 18, { font: F.jp(700, 22), color: C.red, alpha: ma });
      tag(ctx, x, y + 34, '→ 外れが小さくなるように直す', { font: F.jp(700, 16), h: 30, padX: 10, fill: C.accent, color: '#fff', alpha: pop('nudge') });
    }
    ring(ctx, TX - 4, OY + 2 * OSTEP - 4, ODDS.chipW + 18 + ODDS.barW + 70, ODDS.h + 8, lowLit, C.accent, 10);
    // the nudge travels back into the parameters
    const back = tw(t, nudge - lead, 0.6, outCubic) * (1 - seg(t, at('h.end'), at('h.end') + 0.5));
    if (back > 0) {
      ctx.save();
      ctx.globalAlpha = back;
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 3;
      arrow(ctx, TX - 20, OY + 2 * OSTEP + 20, GRID.x + gridW + 20, GRID.y + gridH / 2, back, 12);
      ctx.restore();
    }
    tag(ctx, W - M.r, 104, '事前学習', { font: F.jp(700, 22), h: 40, padX: 16, fill: C.accent, color: '#fff', align: 'right', alpha: pop('pre') });

    // ——— how much text
    const da = pop('g3');
    if (da > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, DY - 54, (W - M.l - M.r) * outCubic(da), 2);
      text(ctx, '事前学習に使った文章の量（トークン）', M.l, DY - 18, { font: F.jp(700, 20), color: C.ink2, alpha: da });
    }
    const full = 470;
    DATA.forEach((d, i) => {
      const when = at(d.at) + (d.at === 'y25' && i === 3 ? 0.5 : 0);
      const a = tw(t, when - lead, pace.enter);
      if (a <= 0) return;
      const y = DY + 6 + i * 42;
      text(ctx, d.name, M.l, y + 24, { font: F.jp(500, 18), color: C.ink2, alpha: a });
      const w = Math.max(3, full * (d.n / DMAX) * outExpo(seg(t, when, when + 1.2)));
      ctx.globalAlpha = a;
      ctx.fillStyle = i === 0 ? C.accent : C.ink;
      ctx.fillRect(M.l + 260, y + 2, w, 30);
      ctx.globalAlpha = 1;
      text(ctx, d.label, M.l + 260 + w + 12, y + 27, { font: F.cond(700, 24), color: C.ink, alpha: a });
    });
    text(ctx, '各社が公表した量。切り方も数え方も、そろってはいない', M.l, DY + 6 + 4 * 42 + 14, { font: F.jp(500, 15), color: C.muted, alpha: pop('y25') });

    // ——— using it, and what comes next
    const RX = 960;
    const ua = pop('fix');
    if (ua > 0) {
      text(ctx, '使うとき', RX, DY - 18, { font: F.jp(700, 20), color: C.ink2, alpha: ua });
      tag(ctx, RX, DY + 2, '答えを作るあいだ、パラメータは変わらない', { font: F.jp(700, 18), h: 36, padX: 14, fill: C.ink, color: C.paper, alpha: ua });
      text(ctx, '会話や保存した情報は、手がかりにできる', RX + 4, DY + 68, { font: F.jp(500, 18), color: C.ink, alpha: tw(t, at('m.voice') + 2.0, pace.enter) });
      text(ctx, 'パラメータを変えるのは、追加の学習', RX + 4, DY + 100, { font: F.jp(500, 18), color: C.ink, alpha: pop('more') });
    }
    const na = pop('base');
    if (na > 0) {
      const y = DY + 128;
      const w1 = tag(ctx, RX, y, '続きを予測する力', { font: F.jp(700, 18), h: 36, padX: 14, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: na });
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      ctx.lineWidth = 2.5;
      const ya = pop('yet');
      arrow(ctx, RX + w1 + 8, y + 18, RX + w1 + 44, y + 18, ya, 10);
      tag(ctx, RX + w1 + 52, y, '指示に沿って答える学習（4 章）', { font: F.jp(700, 18), h: 36, padX: 14, fill: C.accent, color: '#fff', alpha: ya });
    }
    example(ctx, TX, OY + 4 * OSTEP + 44, oa, '予測とパラメータの値は説明のための例');
    source(ctx, 'Brown ほか（2020）、Meta（2024）、NVIDIA と Qwen（2025）', da, SOURCE_RIGHT);
  },
});
