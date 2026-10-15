// 1-2: an angle and one side settle the rest. ずんだもん sees more in her trick: a right
// triangle's shape is fixed by one more angle, so one side fixes the other two, and the
// ratios of its sides depend on the angle alone (0.78, 0.62, 0.79 at 38°, whether the base is
// 10 squares, 18 m or 100 m). A table by angle would save drawing. She starts to name the
// first ratio 「たてそこ比」— and 1-3 opens with めたん cutting in (it joins this clip's last
// frame, drawn by lib/board.js).

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { seg, tw, outBack, clamp } from '../../../src/kit/ease.js';
import { focus, ringBox } from '../../../src/kit/cue.js';
import { mark } from '../lib/scene.js';
import { sideLabel, fillTri, rightBox, boxes } from '../lib/tri.js';
import { board, BOARD_TRI, ratioCard, ratioTable, tatesoko, CARD, TATE } from '../lib/board.js';

const script = [
  { id: 'a', label: 'もっとすごいこと', text: '……待つのだ。{hidden}いまのやり方には、もっとすごいことが隠れているのだ。' },
  { id: 'b', label: '角で形が決まる', text: '直角三角形は、{right}直角のほかに、{one}角が一つ決まれば、{shape}形が決まるのだ。' },
  { id: 'c', label: '辺も決まる', tail: 1.2, text: '形が決まれば、あとは大きさだけ。{oneside}[辺|ヘン]が一本わかれば、{all}ほかの[辺|ヘン]の長さも、全部決まるのだ！' },
  { id: 'd', label: 'いつでも 0.78 倍', text: '{r38}38 度なら、縦の[辺|ヘン]は、いつでも底辺の [0.78|レイテンナナハチ] 倍。{m18}底辺が 18 メートルでも、{m100}100 メートルでも同じなのだ。' },
  { id: 'e', label: '斜めの辺とも', text: '{hyp}斜めの[辺|ヘン]と比べても同じなのだ。縦の[辺|ヘン]は斜めの[辺|ヘン]の{s62} [0.62|レイテンロクニ] 倍、底辺は{c79} [0.79|レイテンナナキュウ] 倍なのだ。' },
  { id: 'f', label: '表にしておく', text: 'だったら、{tbl}角度ごとに[辺|ヘン]の比を表にしておけば、{nodraw}もう三角形を描かなくていいのだ！' },
  { id: 'g', label: '名前を付ける', text: 'よし、{name}この比に名前を付けるのだ。縦割る底辺だから……{tateso}「たてそこ比」なのだ！' },
];

// side lengths for a base of `b`: [base, height, slant]
const lens = (b) => [b, b * Math.tan((38 * Math.PI) / 180), b / Math.cos((38 * Math.PI) / 180)];

export default clip({
  id: 'discover',
  title: '角と一辺で決まる',
  cast: ['zunda'],
  script,

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;

    // ——— the triangle; through sentence c it grows and shrinks, keeping its shape
    const c0 = at('oneside');
    const cEnd = at('c.done');
    const wob = seg(t, c0 + 0.3, cEnd);
    const scale = 1 + 0.32 * Math.sin(wob * Math.PI * 2) * (1 - seg(wob, 0.85, 1));
    const dim = 1 - 0.55 * tw(t, at('nodraw') - lead, 0.4) * (1 - tw(t, at('g'), 0.5));
    const bd = board(ctx, { base: BOARD_TRI.base * scale, tri: dim, other: tw(t, at('shape') - lead, 0.5) });
    const T = bd.T;

    // a: the "!" of an idea
    mark(ctx, 700, 250, '！', tw(t, at('hidden') - lead, 0.35, outBack) * (1 - tw(t, at('b'), 0.4)));

    // b: the right angle, the one angle, then the third — the shape is set
    const fb = focus(t, [at('right'), at('one'), at('shape')], at('b.end'), cue);
    ringBox(ctx, rightBox(T), fb.level[0], C.accent);
    ringBox(ctx, bd.angle, fb.level[1], C.accent);
    fillTri(ctx, T, C.accentSoft, fb.level[2] * 0.35);

    // c, d: the lengths of the sides, inside the triangle. One side is set, the other two
    // follow; then the same shape in metres.
    const nums = tw(t, c0 - lead, 0.4) * (1 - tw(t, at('e'), 0.5));
    if (nums > 0) {
      const m18 = at('m18');
      const m100 = at('m100');
      const unit = t < m18 - 0.1 ? 'マス' : 'm';
      const b = t < m18 - 0.1 ? 10 * scale : t < m100 - 0.1 ? 18 : 100;
      const [lb, lh, ls] = lens(b);
      const fmt = (v) => (unit === 'マス' ? v.toFixed(1) : String(Math.round(v)));
      const lit = (name) => tw(t, at(name) - lead, 0.3) * (1 - tw(t, at(name) + 1.2, 0.3));
      const all = tw(t, at('all') - lead, 0.4);
      // clear of the angles' labels too
      const lo = { inside: true, size: 26, avoid: boxes(bd.angle, bd.other) };
      const baseBox = sideLabel(ctx, T, 'base', `${fmt(lb)} ${unit}`, { ...lo, alpha: nums, color: C.cos });
      sideLabel(ctx, T, 'height', `${fmt(lh)} ${unit}`, { ...lo, alpha: nums * all, color: C.sin });
      sideLabel(ctx, T, 'hyp', `${fmt(ls)} ${unit}`, { ...lo, alpha: nums * all, color: C.ink2 });
      ringBox(ctx, baseBox, Math.max(lit('oneside'), lit('m18'), lit('m100')), C.accent);
    }

    // d, e: the ratios she reads off, one card each
    const cardIn = (name) => tw(t, at(name) - lead, 0.5, outBack);
    const names = ['r38', 's62', 'c79'];
    // lit while she names it, out by the end of her voice: 1-3 joins on an unlit card
    const nameLit = focus(t, [at('name')], at('g.end') - cue.fall, cue).level[0];
    const cards = names.map((n, i) => {
      const a = cardIn(n);
      return ratioCard(ctx, CARD.x + (1 - clamp(a)) * 40, CARD.y[i], i, { alpha: clamp(a), lit: i === 0 && nameLit > 0.5 });
    });
    // the 0.78 holds whatever the base: ring it while the base changes
    const hold = focus(t, [at('m18'), at('m100')], at('d.end'), cue);
    ringBox(ctx, cards[0].parts.value, Math.max(...hold.level), C.accent);

    // e: the slanting side, the one she compares with next
    ringBox(ctx, bd.names.hyp, focus(t, [at('hyp')], at('s62'), cue).level[0], C.accent);

    // f: the table she would keep, its 38° row filled from the cards
    const tbl = tw(t, at('tbl') - lead, 0.5);
    ratioTable(ctx, 720, 500, { alpha: tbl, fill: tw(t, at('tbl') + 0.4, 0.6) });

    // g: her name for the first ratio, typed in by hand
    const typed = seg(t, at('tateso') - 0.05, at('tateso') + 0.9);
    tatesoko(ctx, TATE.x, TATE.y, { p: typed, alpha: typed > 0 ? 1 : 0 });
  },
});

