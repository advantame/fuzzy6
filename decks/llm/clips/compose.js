// 1-3: building text out of holes. 1-2 said a language model predicts what goes into a hole;
// this clip shows that filling holes again and again builds a text, and that there is more than
// one way to do it. Two lanes build the same sentence: the top one the way the LLMs in wide use
// today do, from the front, filling the hole at the end and opening the next one; the bottom one
// the way diffusion models do, from a row of holes filled a few at a time in no fixed order.
// The deck follows the first, and says so.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, chip, chipWidth } from '../lib/parts.js';
import { slot } from '../lib/odds.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, outCubic } from '../../../src/kit/ease.js';
import { enter, focus, dimmed } from '../../../src/kit/cue.js';

// the sentence both lanes build (1-2's example, finished)
const WORDS = ['のどが', 'かわいた', 'ので、', '水を', '飲んだ', '。'];
const WORD = { font: F.jp(500, 42), h: 72, padX: 16 };
const GAP = 10;
const GOAL_Y = 164; // baseline of the sentence as the goal
const LANE = { x: M.l, w: W - M.l - M.r, h: 220, y: [222, 468] };
const CHIPS_X = M.l + 300;
const HOLE_W = 124; // the front lane's hole: the next word's length is not known yet
const STEP = 0.45; // seconds between the front lane's words, after the first (at most)
const DIFF = [[3, 5], [0, 4], [1, 2]]; // the bottom lane's words, a few per step
const DSTEP = 0.7; // seconds between the bottom lane's steps (at most)
// Both lanes finish with the voice of their sentence, so the words have settled by the stop
// that follows.

export default clip({
  id: 'compose',
  title: '文章を組み立てる',
  kicker: '穴埋めを重ねる',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: '穴埋めをくり返していけば、文章を組み立てることができるわ。\n{ways}ただ、その組み立て方は、一つではないの。' },
    { id: 'b', text: 'いま広く使われている LLM は、\n文章を{ar}前から順に書いていくわ。' },
    { id: 'c', still: true, tail: 0.8, text: '{fill1}書きかけの文の後ろにある穴を埋めたら、\n{open}そのすぐ先に、また新しい穴を開けるの。' },
    { id: 'd', text: '一方で、{holes}穴だらけの下書きから始めて、\n{fills}あちこちの穴を、何か所かずつ埋めていく作り方もあるわ。' },
    { id: 'e', still: true, text: 'これは、{diff}拡散型と呼ばれる作り方の一つよ。' },
    { id: 'f', tail: 0.6, text: 'この先は、{scope}前から順に書いていく作り方の、\nしくみを見ていきましょう。' },
  ],

  prepare(ctx) {
    let x = CHIPS_X;
    const chips = WORDS.map((s) => {
      const w = chipWidth(ctx, s, WORD);
      const out = { s, x, w };
      x += w + GAP;
      return out;
    });
    return { chips };
  },

  draw(ctx, t, { chips }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    // ——— the goal: the text to be built, the frame of the whole clip
    const goal = enter(t, at('a'), pace);
    text(ctx, '組み立てる文章', M.l, GOAL_Y - 48, { font: F.jp(500, 19), color: C.muted, alpha: goal });
    text(ctx, WORDS.join(''), M.l, GOAL_Y, { font: F.jp(500, 34), color: C.ink2, alpha: goal });
    example(ctx, M.l + 170, GOAL_Y - 70, goal, '文と、埋まる順は説明のための例（実際の単位はトークン）');

    // the last sentence turns to the front lane: the other one is dimmed while it is said, and
    // the front lane keeps a mark
    const scope = focus(t, [at('scope')], at('f.end') - cue.fall, cue);
    const kept = pop('scope');

    // ——— two lanes: there is more than one way
    LANE.y.forEach((y, i) => {
      const a = enter(t, at('ways') - lead, pace, i * 2) * (i === 1 ? dimmed(0, scope.any, cue) : 1);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, LANE.x, y, LANE.w, LANE.h, 18);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.restore();
    });

    const front = LANE.y[0];
    const back = LANE.y[1];
    const chipY = (y) => y + (LANE.h - WORD.h) / 2 + 14;
    const labelY = (y) => y + 132;
    const nameY = (y) => y + 54;

    // ——— the front lane: fill the hole at the end, open the next one
    tag(ctx, M.l + 32, nameY(front), '広く使われている LLM', { font: F.jp(700, 18), h: 32, padX: 12, fill: C.ink, color: C.paper, alpha: enter(t, at('b'), pace) });
    text(ctx, '前から順に', M.l + 32, labelY(front), { font: F.jp(700, 32), color: C.ink, alpha: pop('ar') });
    tag(ctx, LANE.x + LANE.w - 24, front + 22, 'この先で追う型', { font: F.jp(700, 18), h: 34, padX: 12, fill: C.accent, color: '#fff', alpha: kept, align: 'right' });
    const open = at('open');
    const step = Math.min(STEP, (at('c.end') - open - 0.3) / (WORDS.length - 2));
    const landed = (k) => (k === 0 ? at('fill1') : open + 0.3 + step * (k - 1));
    const filled = WORDS.filter((_, k) => t >= landed(k)).length;
    chips.forEach((c, k) => {
      if (t < landed(k)) return;
      put(ctx, c, chipY(front), t - landed(k), k);
    });
    // the hole at the end: one at a time. After the first word it waits for "また穴を開ける".
    const opened = filled === 1 ? tw(t, at('open') - lead, 0.3) : 1;
    if (filled < WORDS.length) {
      const holeA = pop('ar') * opened;
      slot(ctx, chips[filled].x, chipY(front), HOLE_W, WORD.h, { alpha: holeA, lit: holeA, blink: Math.floor(t * 2.5) % 2 === 0 });
    }

    // ——— the bottom lane: a draft full of holes, filled a few at a time
    const dim = dimmed(0, scope.any, cue);
    ctx.save();
    ctx.globalAlpha = dim;
    text(ctx, '穴だらけから', M.l + 32, labelY(back), { font: F.jp(700, 32), color: C.ink, alpha: pop('holes') });
    tag(ctx, M.l + 32, nameY(back), '拡散型の一つ', { font: F.jp(700, 18), h: 32, padX: 12, fill: C.ink, color: C.paper, alpha: pop('diff') });
    const fills = at('fills');
    const dstep = Math.min(DSTEP, (at('d.end') - fills) / (DIFF.length - 1));
    chips.forEach((c, k) => {
      const on = fills + DIFF.findIndex((s) => s.includes(k)) * dstep;
      if (t >= on) put(ctx, c, chipY(back), t - on, k);
      else slot(ctx, c.x, chipY(back), c.w, WORD.h, { alpha: enter(t, at('holes') - lead, pace, k) });
    });
    ctx.restore();
  },
});

// A word that has just been put into its hole: it lands in the signal colour and settles into
// its tint. dt is the time since it landed.
function put(ctx, c, y, dt, k) {
  const flash = 1 - seg(dt, 0.1, 0.7);
  const fill = flash > 0.5 ? C.accent : flash > 0 ? C.accentSoft : C.tints[k % C.tints.length];
  chip(ctx, c.x, y, c.s, { ...WORD, fill, color: flash > 0.5 ? '#fff' : C.ink, alpha: outCubic(seg(dt, 0, 0.15)) });
}
