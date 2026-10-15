// 1-2: an angle and one side settle the rest. ずんだもん sees more in her trick: a right
// triangle's shape is fixed by one more angle, so one side fixes the other two, and the
// ratios of its sides depend on the angle alone (0.78, 0.62, 0.79 at 38°, whether the base is
// 10 squares, 18 m or 100 m). A table by angle would save drawing. She starts to name the
// first ratio 「たてそこ比」— and 1-3 opens with めたん cutting in (it joins this clip's last
// frame, drawn by lib/board.js).

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { seg, tw, outBack, clamp } from '../../../src/kit/ease.js';
import { focus, ring } from '../../../src/kit/cue.js';
import { mark } from '../lib/scene.js';
import { drawTri, sideLabel, sidePoint, corners, angleArc } from '../lib/tri.js';
import { board, boardCorners, BOARD_TRI, ratioCard, ratioTable, tatesoko, CARD, sideNames } from '../lib/board.js';

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
    let T;
    if (scale === 1) T = board(ctx, { tri: dim, other: tw(t, at('shape') - lead, 0.5) });
    else {
      T = corners(BOARD_TRI.deg, BOARD_TRI.base * scale, BOARD_TRI.pose);
      drawTri(ctx, T, { lw: 6, alpha: dim });
      angleArc(ctx, T.A, T.C, T.B, { r: 70, label: '38°', size: 32, alpha: dim });
      angleArc(ctx, T.B, T.A, T.C, { r: 54, label: '52°', size: 26, color: C.muted, labelColor: C.muted, alpha: dim });
      sideNames(ctx, T, dim);
    }

    // a: the "!" of an idea
    mark(ctx, 700, 250, '！', tw(t, at('hidden') - lead, 0.35, outBack) * (1 - tw(t, at('b'), 0.4)));

    // b: the right angle, the one angle, then the third — the shape is set
    const fb = focus(t, [at('right'), at('one'), at('shape')], at('b.end'), cue);
    const T0 = boardCorners();
    ring(ctx, T0.C.x - 40, T0.C.y - 40, 52, 52, fb.level[0], C.accent);
    ring(ctx, T0.A.x + 40, T0.A.y - 50, 110, 46, fb.level[1], C.accent);
    if (fb.level[2] > 0) {
      ctx.save();
      ctx.globalAlpha *= fb.level[2] * 0.35;
      ctx.fillStyle = C.accentSoft;
      ctx.beginPath();
      ctx.moveTo(T0.A.x, T0.A.y);
      ctx.lineTo(T0.C.x, T0.C.y);
      ctx.lineTo(T0.B.x, T0.B.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

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
      sideLabel(ctx, T, 'base', `${fmt(lb)} ${unit}`, { off: -30, size: 26, alpha: nums, color: C.cos });
      sideLabel(ctx, T, 'height', `${fmt(lh)} ${unit}`, { off: -66, size: 26, alpha: nums * all, color: C.sin });
      sideLabel(ctx, T, 'hyp', `${fmt(ls)} ${unit}`, { off: -40, size: 26, alpha: nums * all, color: C.ink2 });
      const one = Math.max(lit('oneside'), lit('m18'), lit('m100'));
      ring(ctx, (T.A.x + T.C.x) / 2 - 62, T.A.y - 52, 124, 40, one, C.accent);
    }

    // d, e: the ratios she reads off, one card each
    const cardIn = (name) => tw(t, at(name) - lead, 0.5, outBack);
    const names = ['r38', 's62', 'c79'];
    // lit while she names it, out by the end of her voice: 1-3 joins on an unlit card
    const nameLit = focus(t, [at('name')], at('g.end') - cue.fall, cue).level[0];
    names.forEach((n, i) => {
      const a = cardIn(n);
      if (a <= 0) return;
      ratioCard(ctx, CARD.x + (1 - clamp(a)) * 40, CARD.y[i], i, { alpha: clamp(a), lit: i === 0 && nameLit > 0.5 });
    });
    // the 0.78 holds whatever the base: ring the card while the base changes
    const hold = focus(t, [at('m18'), at('m100')], at('d.end'), cue);
    ring(ctx, CARD.x + 290, CARD.y[0] + 14, 150, 56, Math.max(...hold.level), C.accent);

    // e: the slanting side, the one she compares with next
    const slant = focus(t, [at('hyp')], at('s62'), cue).level[0];
    if (slant > 0) {
      const sp = sidePoint(T0, 'hyp', 48);
      ring(ctx, sp.x - 74, sp.y - 26, 148, 52, slant, C.accent);
    }

    // f: the table she would keep, its 38° row filled from the cards
    const tbl = tw(t, at('tbl') - lead, 0.5);
    ratioTable(ctx, 720, 500, { alpha: tbl, fill: tw(t, at('tbl') + 0.4, 0.6) });

    // g: her name for the first ratio, typed in by hand
    const typed = seg(t, at('tateso') - 0.05, at('tateso') + 0.9);
    tatesoko(ctx, 1214, 206, { p: typed, alpha: typed > 0 ? 1 : 0 });
  },
});

