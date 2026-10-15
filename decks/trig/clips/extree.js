// 1-4, exercise 1: the tree again, with tan. ずんだもん picks tan from the t of the sheet
// (height and base), writes height = 18 × tan 38°, めたん gives tan 38° = 0.7813 from the
// table, and the answer, 14.06 m, is the 14 m she measured on the squared paper — whose 0.78
// was tan 38° all along. Joined from 1-3, whose sheet stays in the corner.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { seg, tw, inOutCubic, outBack, lerp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { focus, ringBox } from '../../../src/kit/cue.js';
import { treeTriangle } from '../lib/scene.js';
import { cursive } from '../lib/cursive.js';
import { label, triBox } from '../lib/tri.js';
import { row, jp, colored } from '../lib/math.js';
import { trigTable } from '../lib/table.js';
import { cornerMemo, tab, example, workLine } from '../lib/drill.js';

const POSE = { x: 120, y: 600, s: 480 / 700 };
const ROWS = Array.from({ length: 17 }, (_, i) => 30 + i);
const TABLE = { x: 1010, y: 250, show: 9 };

const script = [
  { id: 'q', by: 'metan', label: '一問め', text: '一問め。さっきの{tree}木の高さを、三角比を使って求めなさい。' },
  { id: 'a1', label: 'わかっていること', text: 'わかっているのは、{b18}底辺の 18 メートルと、{a38}38 度の角。{want}知りたいのは高さなのだ。' },
  { id: 'a2', label: 't の形', text: '{pair}高さと底辺だから、{t}[t|ティー] の形……{tan}[tan|タンジェント] なのだ！' },
  { id: 'a3', label: '18 × tan 38°', text: '高さを底辺で割ると{eq1} [tan 38°|タンジェントサンジュウハチド] だから、高さは、{eq2}18 メートルに [tan 38°|タンジェントサンジュウハチド] を掛ければいいのだ。' },
  { id: 'm1', by: 'metan', label: 'tan 38° の値', text: 'そうね。[tan 38°|タンジェントサンジュウハチド] は、{look}表や関数電卓で調べると、{v}[0.7813|レイテンナナハチイチサン] よ。' },
  { id: 'a4', label: '14.06 m', text: '18 かける [0.7813|レイテンナナハチイチサン] で、{ans}[14.06|ジュウヨンテンレイロク] メートル。{same}方眼紙で測ったのと、ほとんど同じなのだ！' },
  { id: 'm2', by: 'metan', label: '0.78 は tan 38°', text: 'あなたが方眼紙で測った{grid} [0.78|レイテンナナハチ] は、{tanv}[tan 38°|タンジェントサンジュウハチド] の値だったのよ。' },
];

export default clip({
  id: 'extree',
  title: '木の高さ',
  kicker: '演習 1',
  join: 'cut',
  cast: ['metan', 'zunda'],
  script,

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const tanLit = focus(t, [at('t')], at('a2.end'), cue).level[0];
    cornerMemo(ctx, { lit: tanLit > 0.5 ? 't' : null });
    tab(ctx, 1, tw(t, 0, 0.6));

    // the tree's triangle, back from 1-1
    const tree = tw(t, at('tree') - lead, 0.6);
    const ans = at('ans');
    const done = tw(t, ans - lead, 0.5, outBack);
    const { T, box } = treeTriangle(ctx, {
      pose: POSE,
      alpha: tree,
      height: done > 0.5 ? '約 14.06 m' : '？',
      heightColor: done > 0.5 ? C.accent : C.sin,
      heightSize: 36,
    });
    example(ctx, 120, 120, tree);
    const facts = focus(t, [at('b18'), at('a38'), at('want')], at('a1.end'), cue);
    ringBox(ctx, box.dist, facts.level[0], C.accent);
    ringBox(ctx, box.ang, facts.level[1], C.accent);
    ringBox(ctx, box.height, Math.max(facts.level[2], done * (1 - tw(t, at('a4.end'), cue.fall))), C.accent);

    // the t, written over the triangle: base first, then up the height
    const pair = focus(t, [at('pair')], at('t'), cue).level[0];
    if (pair > 0) {
      const b = triBox(T, 10);
      ctx.save();
      ctx.globalAlpha *= pair;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    }
    cursive(ctx, T, 't', seg(t, at('t') - 0.1, at('t') + 1.1), { lw: 8, numbers: 0, alpha: 1 - 0.8 * tw(t, at('a2.end'), 0.6) });

    // the working
    const tan38 = () => row('tan', '38°');
    workLine(ctx, row(jp('高さ', C.sin), '÷', '18', '=', tan38()), 120, 760, tw(t, at('eq1') - lead, 0.5));
    const second = tw(t, at('eq2') - lead, 0.5);
    const third = tw(t, ans - lead, 0.5);
    workLine(ctx, row(jp('高さ', C.sin), '=', '18', '×', tan38(), ...(third > 0 ? ['=', '18', '×', '0.7813', '≒', colored(C.accent, '14.06')] : [])), 120, 840, second);

    // the table, scrolled to 38°; its tan cell lit as めたん reads it
    const look = tw(t, at('look') - lead, 0.6);
    const scroll = lerp(ROWS.indexOf(38) - 4 - 4, ROWS.indexOf(38) - 4, inOutCubic(seg(t, at('look'), at('look') + 1.0)));
    const v = tw(t, at('v') - lead, cue.rise);
    const back = focus(t, [at('tanv')], at('m2.end') - cue.fall, cue).level[0];
    const tb = trigTable(ctx, TABLE.x, TABLE.y, { rows: ROWS, show: TABLE.show, scroll, alpha: look, hi: { deg: 38, col: 'tan', level: Math.max(v * (1 - tw(t, at('a4.end'), 0.4)), back) } });

    // what she measured on the paper, under the answer; joined to the table at the end
    const same = tw(t, at('same') - lead, 0.5);
    const h = box.height;
    text(ctx, '方眼紙では 約 14 m', h.x, h.y + h.h + 36, { font: F.jp(500, 24), color: C.muted, alpha: same });
    const grid = tw(t, at('grid') - lead, 0.5);
    if (grid > 0) {
      const g = label(ctx, '方眼紙の 0.78', 850, 548, { size: 26, alpha: grid });
      ringBox(ctx, g, grid, C.accent);
      const c = tb.cell(38, 'tan');
      const from = { x: g.x + g.w + 14, y: g.y + g.h / 2 };
      const to = { x: c.x + 24, y: c.y + c.h / 2 };
      const p = inOutCubic(seg(t, at('tanv') - lead, at('tanv') + 0.6));
      ctx.save();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(lerp(from.x, to.x, p), lerp(from.y, to.y, p));
      ctx.stroke();
      ctx.restore();
    }
  },
});

