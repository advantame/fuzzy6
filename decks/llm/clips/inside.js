// 3-1: what happens in an autoregressive LLM, one that writes from the front. First the loop as 1-3 left it: from
// the text so far the LLM works out the candidates for what comes next and their chances, one
// is picked and added to the end, and the next is predicted from the longer text. ずんだもん
// asks what goes on inside — but first, the text the LLM reads is named the context: what it was
// given and what it wrote, both. Then the box opens into the model's three stages, with the cutting into
// tokens before it (lib/inside.js), and the clip ends on the chapter's map: which clip takes
// which stage. The later clips keep the map as a strip.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { tag, example, chip, chipWidth } from '../lib/parts.js';
import { oddsRow, slot } from '../lib/odds.js';
import { STAGES, icon } from '../lib/inside.js';
import { text, rr, arrow, path, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, outCubic, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

// ——— the text so far, in 1-2's words
const WORDS = ['のどが', 'かわいた', 'ので、', '水を'];
const ADDED = ['飲んだ', '。'];
const WORD = { font: F.jp(500, 36), h: 60, padX: 15 };
const TEXT_Y = 176;
const SLOT_W = 130;

// ——— the LLM: a black box, then opened into its stages
const CLOSED = { x: 190, y: 386, w: 420, h: 180 };
const CARD = { w: 186, h: 168, gap: 34 };
const cardX = (i) => M.l + 20 + i * (CARD.w + CARD.gap);
// the model's own frame holds the middle three; cutting into tokens stands before it
const OPEN = { x: cardX(1) - 22, y: 340, w: 3 * CARD.w + 2 * CARD.gap + 44, h: 272 };
const CARD_Y = OPEN.y + 74;

// ——— what comes out: the candidates and their chances, as in 1-2
const BX = 1070;
const BY = 420;
const RSTEP = 62;
const ODDS = { chipW: 120, h: 46, barW: 200, font: F.jp(500, 24) };
const ROUNDS = [
  [['飲んだ', 0.6, '60%'], ['買った', 0.2, '20%'], ['読んだ', 0.0001, '0.01%']],
  [['。', 0.72, '72%'], ['、', 0.12, '12%'], ['よ', 0.04, '4%']],
];
const REST = [0.2, 0.12];
const LOOP_Y = TEXT_Y + 30; // the way back runs along the text

export default clip({
  id: 'inside',
  title: 'LLM の中',
  kicker: '自己回帰型 LLM',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'ここからは、自己回帰型 LLM の中で、\n何が起きているのかを見ていきましょう。' },
    { id: 'b', text: 'LLM は、{in}書きかけの文章をもとに、\n{out}次に来る言葉の候補と、その確率を計算するの。' },
    { id: 'c', text: '{pick}その中から一つを選んで、{add}文章の後ろに足したら、\n{again}足したところまでを手がかりに、また次を予測するのよ。' },
    { id: 'd', text: '{loop}これをくり返して、文章が少しずつ書き進められていくわ。' },
    { id: 'd2', text: '{pr}次を予測するときに LLM が読む、この文章を、\nコンテクストと呼ぶわ。' },
    { id: 'd3', still: true, text: '{wrote}LLM が書き足した部分も、コンテクストに加わるの。' },
    { id: 'e', by: 'zunda', text: '{ask}その LLM の中では、何が起きているのだ？' },
    { id: 'f', text: '{open}中をのぞくと、計算がいくつかの段階に分かれているの。' },
    { id: 'g', text: '{s1}まず、コンテクストをトークンという単位に切って、\n番号にするわ。{s2}その番号を、一つずつ、数の並びに変えるの。' },
    { id: 'h', text: '{s3}次に、自分と、それより前のトークンを参考にして、\nその数の並びを書き換えていくわ。' },
    { id: 'i', still: true, text: '{s4}最後に、書き換えた数の並びから、\n次に来るトークンの確率を出すのよ。' },
    { id: 'j', tail: 0.8, text: 'この章では、{each}この流れを、\n一つずつ順番にたどっていきましょう。' },
  ],

  prepare(ctx) {
    let x = M.l;
    const words = [...WORDS, ...ADDED].map((s) => {
      const w = chipWidth(ctx, s, WORD);
      const out = { s, x, w };
      x += w + 10;
      return out;
    });
    return { words };
  },

  draw(ctx, t, { words }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    // ——— when the two rounds land: the first word with sentence c, the second with d
    const fly1 = [at('add') - 0.1, at('add') + 0.5];
    const loop = at('loop');
    const round2 = loop + 0.2; // the second round's candidates
    const fly2 = [Math.max(round2 + 1.2, at('d.end') - 1.0), Math.max(round2 + 1.8, at('d.end') - 0.4)];
    const landed = (t >= fly1[1] ? 1 : 0) + (t >= fly2[1] ? 1 : 0);

    // ——— the text so far
    const g = enter(t, at('a'), pace);
    text(ctx, '書きかけの文章', M.l, TEXT_Y - 22, { font: F.jp(500, 19), color: C.muted, alpha: g });
    words.forEach((c, i) => {
      if (i < WORDS.length) {
        chip(ctx, c.x, TEXT_Y, c.s, { ...WORD, fill: C.tints[i % C.tints.length], alpha: enter(t, at('a'), pace, i) });
      } else if (i - WORDS.length < landed) {
        const dt = t - (i === WORDS.length ? fly1[1] : fly2[1]);
        const flash = 1 - seg(dt, 0.1, 0.8);
        chip(ctx, c.x, TEXT_Y, c.s, { ...WORD, fill: flash > 0.5 ? C.accent : flash > 0 ? C.accentSoft : C.tints[i % C.tints.length], color: flash > 0.5 ? '#fff' : C.ink });
      }
    });
    const hole = words[WORDS.length + landed];
    const holeX = hole ? hole.x : words[words.length - 1].x + words[words.length - 1].w + 10;
    slot(ctx, holeX, TEXT_Y, SLOT_W, WORD.h, { alpha: g, lit: g, blink: Math.floor(t * 2.5) % 2 === 0 });
    // sentence d2: the whole text the LLM reads is the context — what it wrote is ringed as part of it
    const by = TEXT_Y + WORD.h + 10;
    const last = words[words.length - 1];
    under(ctx, words[0].x, last.x + last.w, by, 'コンテクスト', C.accent, pop('pr'));
    const wrote = focus(t, [at('wrote')], at('d3.end') - cue.fall, cue).level[0];
    ring(ctx, words[WORDS.length].x - 4, TEXT_Y - 4, last.x + last.w - words[WORDS.length].x + 8, WORD.h + 8, wrote, C.accent, 10);
    // the text goes in again: a sweep along it
    const again = seg(t, at('again') - lead, at('again') + 0.6);
    if (again > 0 && again < 1) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(M.l, TEXT_Y + WORD.h + 8, (holeX - 10 - M.l) * outCubic(again), 5);
    }

    // ——— the LLM: closed until ずんだもん asks what is inside, then opened
    const opening = inOutCubic(seg(t, at('open') - lead, at('open') - lead + 0.9));
    const box = {
      x: lerp(CLOSED.x, OPEN.x, opening),
      y: lerp(CLOSED.y, OPEN.y, opening),
      w: lerp(CLOSED.w, OPEN.w, opening),
      h: lerp(CLOSED.h, OPEN.h, opening),
    };
    const boxA = enter(t, at('a'), pace, 1);
    if (boxA > 0) {
      ctx.save();
      ctx.globalAlpha = boxA;
      rr(ctx, box.x, box.y, box.w, box.h, 22);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.globalAlpha = boxA * (1 - opening);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, 'LLM', box.x + box.w / 2, box.y + box.h / 2 + 4, { font: F.sans(700, 64), color: C.paper, align: 'center', base: 'middle', alpha: boxA * (1 - seg(opening, 0, 0.4)) });
      text(ctx, 'LLM', OPEN.x + 28, OPEN.y + 46, { font: F.sans(700, 28), color: C.ink, alpha: boxA * seg(opening, 0.6, 1) });
      text(ctx, 'モデルの本体', OPEN.x + 96, OPEN.y + 45, { font: F.jp(500, 18), color: C.muted, alpha: boxA * seg(opening, 0.6, 1) });
    }
    // what is inside? (ずんだもん's question rings the box)
    const asked = focus(t, [at('ask')], at('e.end') - cue.fall, cue).level[0];
    ring(ctx, box.x, box.y, box.w, box.h, asked * (1 - opening), C.accent, 22);

    // the stages, lit one by one as they are named
    const named = focus(t, [at('s1'), at('s2'), at('s3'), at('s4')], at('i.end') - cue.fall, cue);
    const each = at('each');
    STAGES.slice(0, 4).forEach((st, i) => {
      const a = tw(t, at('open') - lead + 0.7 + i * pace.stagger, pace.enter) * boxA;
      if (a <= 0) return;
      const x = cardX(i);
      const lit = named.level[i];
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, x, CARD_Y + (1 - a) * 10, CARD.w, CARD.h, 16);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
      icon(ctx, st.id, x + CARD.w / 2, CARD_Y + 62, 76, a);
      text(ctx, st.label, x + CARD.w / 2, CARD_Y + 134, { font: F.jp(700, 22), color: C.ink, align: 'center', alpha: a });
      if (lit > 0) text(ctx, st.label, x + CARD.w / 2, CARD_Y + 134, { font: F.jp(700, 22), color: C.accent, align: 'center', alpha: a * lit });
      ring(ctx, x, CARD_Y, CARD.w, CARD.h, lit, C.accent, 16);
      if (i < 3) {
        ctx.fillStyle = C.ink2;
        ctx.strokeStyle = C.ink2;
        ctx.lineWidth = 2.5;
        arrow(ctx, x + CARD.w + 6, CARD_Y + CARD.h / 2, x + CARD.w + CARD.gap - 6, CARD_Y + CARD.h / 2, a, 11);
      }
      // the chapter's map: which clip takes which stage
      tag(ctx, x + CARD.w / 2, CARD_Y + CARD.h + 22, st.clip, { font: F.mono(600, 18), h: 32, padX: 12, fill: C.ink, color: C.paper, align: 'center', alpha: tw(t, each - lead + i * pace.stagger, pace.enter) });
    });
    const later = tw(t, each - lead + 5 * pace.stagger, pace.enter);
    text(ctx, '3-6  中の数の決め方（学習）', M.l, OPEN.y + OPEN.h + 104, { font: F.jp(500, 21), color: C.ink2, alpha: later });
    text(ctx, '3-7  一度に読める長さ', M.l + 380, OPEN.y + OPEN.h + 104, { font: F.jp(500, 21), color: C.ink2, alpha: later });

    // ——— into the LLM, and out of it
    ctx.strokeStyle = C.ink2;
    ctx.fillStyle = C.ink2;
    ctx.lineWidth = 3;
    const inX = 250;
    const inEnd = lerp(box.y, CARD_Y, opening) - 12;
    arrow(ctx, inX, TEXT_Y + WORD.h + 22, inX, inEnd, tw(t, at('in') - lead, 0.5, outCubic), 13);
    text(ctx, '入る', inX + 16, (TEXT_Y + WORD.h + inEnd) / 2 + 18, { font: F.jp(700, 20), color: C.ink2, alpha: pop('in') });
    const midY = box.y + box.h / 2;
    arrow(ctx, box.x + box.w + 12, midY, BX - 16, midY, tw(t, at('out') - lead, 0.5, outCubic), 13);
    // sentence i: the last stage hands its chances on
    const s4 = named.level[3];
    if (s4 > 0) {
      ctx.save();
      ctx.globalAlpha = s4;
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      arrow(ctx, box.x + box.w + 12, midY, BX - 16, midY, 1, 13);
      ctx.restore();
    }

    // ——— the candidates. The first round's give way to the second's as the loop goes round.
    const out = pop('out');
    const swap = seg(t, round2 - 0.3, round2);
    text(ctx, '次に来る言葉と、その確率', BX, BY - 26, { font: F.jp(700, 21), color: C.ink2, alpha: out });
    ROUNDS.forEach((cands, r) => {
      const ra = r === 0 ? 1 - swap : tw(t, round2, pace.enter);
      if (ra <= 0) return;
      const start = r === 0 ? at('out') : round2;
      const pickAt = r === 0 ? at('pick') : fly2[0] - 0.4;
      const gone = r === 0 ? fly1 : fly2;
      const hot = (r === 0 ? focus(t, [at('pick')], fly1[0], cue).level[0] : seg(t, pickAt, pickAt + 0.2)) * (1 - seg(t, gone[1], gone[1] + 0.4));
      cands.forEach(([w, p, label], i) => {
        const flying = i === 0 && t >= gone[0] && t < gone[1];
        oddsRow(ctx, BX, BY + i * RSTEP, flying ? '' : w, {
          ...ODDS,
          p,
          alpha: ra * tw(t, start - lead + i * pace.stagger, pace.enter),
          grow: tw(t, start + i * pace.stagger, 0.6, outCubic),
          hot: i === 0 ? hot : 0,
          num: tw(t, start + 0.3 + i * pace.stagger, 0.4),
          label,
        });
      });
      oddsRow(ctx, BX, BY + 3 * RSTEP, 'そのほか', {
        ...ODDS,
        p: REST[r],
        font: F.jp(500, 19),
        alpha: ra * 0.6 * tw(t, start - lead + 3 * pace.stagger, pace.enter),
        grow: tw(t, start + 3 * pace.stagger, 0.6, outCubic),
        num: tw(t, start + 0.3 + 3 * pace.stagger, 0.4),
        label: `約 ${Math.round(REST[r] * 100)}%`,
      });
    });

    // ——— the picked word goes to the end of the text
    [fly1, fly2].forEach(([t0, t1], r) => {
      const p = seg(t, t0, t1);
      if (p <= 0 || p >= 1) return;
      const to = words[WORDS.length + r];
      const e = inOutCubic(p);
      const x = lerp(BX, to.x, e);
      const y = lerp(BY, TEXT_Y, e) - Math.sin(Math.PI * e) * 50;
      chip(ctx, x, y, to.s, { ...WORD, fill: C.accent, color: '#fff' });
    });

    // ——— round again: from the candidates back to the end of the text
    const back = tw(t, at('add') - lead, 0.6, outCubic);
    const loopLit = Math.max(seg(t, at('add') - lead, at('add')) * (1 - seg(t, at('again'), at('again') + 0.4)), seg(t, loop - lead, loop) * (1 - seg(t, at('d.end'), at('d.end') + 0.4)));
    if (back > 0) {
      const xr = BX + ODDS.chipW + ODDS.barW + 70;
      const pts = [[xr, BY - 48], [xr, LOOP_Y], [holeX + SLOT_W + 14, LOOP_Y]];
      ctx.save();
      ctx.strokeStyle = loopLit > 0.5 ? C.accent : C.ink2;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 3;
      const end = path(ctx, pts, back);
      if (end && back > 0.95) arrowHead(ctx, end.x, end.y, end.a, 13);
      ctx.restore();
      tag(ctx, xr, LOOP_Y - 18, STAGES[4].label, { font: F.jp(700, 19), h: 36, padX: 14, fill: loopLit > 0.5 ? C.accent : '#fff', stroke: C.ink2, color: loopLit > 0.5 ? '#fff' : C.ink, align: 'right', alpha: back });
      tag(ctx, xr - 10, LOOP_Y + 26, '3-5', { font: F.mono(600, 18), h: 32, padX: 12, fill: C.ink, color: C.paper, align: 'right', alpha: tw(t, each - lead + 4 * pace.stagger, pace.enter) });
    }

    example(ctx, M.l, 830, out, '文と候補と確率は説明のための例（実際の単位はトークン）');
  },
});

// A bracket under a stretch of the text, with its name below.
function under(ctx, x0, x1, y, name, color, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x0 + 2, y - 6);
  ctx.lineTo(x0 + 2, y);
  ctx.lineTo(x1 - 2, y);
  ctx.lineTo(x1 - 2, y - 6);
  ctx.stroke();
  ctx.restore();
  text(ctx, name, (x0 + x1) / 2, y + 24, { font: F.jp(700, 18), color, align: 'center', alpha: a });
}
