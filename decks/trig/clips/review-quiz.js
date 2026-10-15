// DRAFT — a sample of a question clip (spec §5.4), to see how the choices look on this deck.
// Its lines are placeholders until the review's script is agreed; not on the deck yet.

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { tw } from '../../../src/kit/ease.js';
import { drillTag } from '../lib/board.js';
import { formulaBox } from '../lib/parts.js';
import { row, frac, n, tex, choice, math, box } from '../lib/math.js';
import { workLine } from '../lib/drill.js';

const BOX1 = { x: 260, y: 520, w: 1080, h: 150 };
const BOX2 = { x: 260, y: 560, w: 1080, h: 190 };

const script = [
  {
    id: 'q1',
    label: '一問め',
    text: '一問め。{r}7.8 対 10 の、比の値はどれなのだ？',
    ask: { choices: [choice(n('0.78')), choice(n('1.28')), choice(n('7.8'))], answer: 0, box: BOX1 },
  },
  { id: 'q1-yes', when: 'q1.right', speed: 'fast', text: 'そのとおりなのだ！' },
  { id: 'q1-no', when: ['q1.wrong', 'q1.skip'], text: '答えは、0.78 なのだ。' },
  { id: 'q1-a', label: '7.8 ÷ 10', text: '比の値は、{div}前の数を後ろの数で割った値。{v}0.78 なのだ。', still: true },
  {
    id: 'q2',
    label: '二問め',
    text: '二問め。{sim}二つの三角形が相似なとき、{bc}AC 分の BC と等しいのはどれなのだ？',
    ask: {
      choices: [choice(frac('EF', 'DF')), choice(frac('DF', 'EF')), choice(frac('DE', 'DF'))],
      answer: 0,
      box: BOX2,
    },
  },
  { id: 'q2-yes', when: 'q2.right', speed: 'fast', text: '正解なのだ！' },
  { id: 'q2-no', when: ['q2.wrong', 'q2.skip'], text: '答えは、DF 分の EF なのだ。' },
  { id: 'q2-a', label: '対応する辺', text: '{pair}対応する辺どうしを、同じ順に並べるのだ。' },
];

export default clip({
  id: 'review-quiz',
  title: '確かめる問題',
  kicker: '下書き',
  cast: ['zunda'],
  script,

  draw(ctx, t, _, { at, pace }) {
    const lead = pace.cue.lead;
    const q2 = at('q2');
    const one = 1 - tw(t, q2, 0.4);
    drillTag(ctx, '問題 1', tw(t, 0, 0.5) * one);
    drillTag(ctx, '問題 2', tw(t, q2 - 0.1, 0.4));

    // 1: the ratio, then the working once the answer is out
    if (one > 0) {
      ctx.save();
      ctx.globalAlpha *= one;
      math(ctx, row('7.8', ':', '10'), 800, 330, { size: 96, align: 'center', alpha: tw(t, at('r') - lead, 0.5) });
      workLine(ctx, row(frac('7.8', '10'), '=', '0.78'), 800, 450, tw(t, at('div') - lead, 0.5), { align: 'center', size: 46 });
      ctx.restore();
    }

    // 2: the property box, and the question beneath it
    const a2 = tw(t, at('sim') - lead, 0.5);
    const sim = row('△ABC', '∽', '△DEF');
    formulaBox(ctx, sim, 800 - box(sim, 46).w / 2, 230, { title: '相似', size: 46, alpha: a2 });
    math(ctx, row(frac('BC', 'AC'), '=', tex('\\,?')), 800, 420, { size: 56, align: 'center', alpha: tw(t, at('bc') - lead, 0.5), color: C.ink });
  },
});
