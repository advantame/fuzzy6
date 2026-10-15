// 1-6, exercise 3: a 3-4-5 triangle that does not sit in the usual pose. The cursive s will
// not go on; めたん says to set it down again with θ at the bottom left and the right angle at
// the bottom right. Turned and flipped, the sides read off: sin θ = 3/5, cos θ = 4/5,
// tan θ = 3/4. The names of the sides come from θ, not from which way the triangle lies.

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { seg, tw, inOutCubic, outBack, clamp } from '../../../src/kit/ease.js';
import { focus, ringBox } from '../../../src/kit/cue.js';
import { corners, mixPose, drawTri, ghostTri, angleAt, sideLabel, triBox } from '../lib/tri.js';
import { cursive } from '../lib/cursive.js';
import { row, frac } from '../lib/math.js';
import { mark } from '../lib/scene.js';
import { arrow } from '../lib/parts.js';
import { cornerMemo, tab, workLine } from '../lib/drill.js';

const DEG = (Math.atan2(3, 4) * 180) / Math.PI; // 36.87°
const BASE = 480; // 4 units of 120 px
const START = { x: 640, y: 150, s: 1, rot: -Math.PI / 2, fx: -1 };
const MID = { x: 720, y: 720, s: 1, rot: 0, fx: -1 };
const END = { x: 240, y: 720, s: 1, rot: 0, fx: 1 };

const script = [
  { id: 'q', by: 'metan', label: '三問め', text: '三問め。{tri}この三角形で、[θ|シータ] の [sin|サイン]、[cos|コサイン]、[tan|タンジェント] を求めなさい。' },
  { id: 'a1', label: '向きが違う', text: '……あれ？　{wrong}三角形の向きが違うから、{cant}筆記体が書けないのだ。' },
  { id: 'm1', by: 'metan', label: '置き直す', text: 'そういうときは、{place}[θ|シータ] が左下、直角が右下に来るように、置き直せばいいの。' },
  { id: 'a2', label: '回して裏返す', tail: 0.2, text: '{rot}回して、{flip}裏返して……{done}できたのだ。{h3}高さが 3、{b4}底辺が 4、{c5}斜辺が 5 なのだ。' },
  { id: 'a3', label: '3/5、4/5、3/4', text: 'だから、{s}[sin θ|サインシータ] は [5 分の 3|ゴブンノサン]、{c}[cos θ|コサインシータ] は [5 分の 4|ゴブンノヨン]、{t}[tan θ|タンジェントシータ] は [4 分の 3|ヨンブンノサン] なのだ！' },
  { id: 'm2', by: 'metan', label: '角から見て決まる', text: 'そのとおり。{names}[辺|ヘン]の名前は、三角形の向きではなく、{from}[角|カク] [θ|シータ] から見て決まるのよ。' },
];

export default clip({
  id: 'turn',
  title: '向きを直す',
  kicker: '演習 3',
  cast: ['metan', 'zunda'],
  script,

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    cornerMemo(ctx);
    tab(ctx, 3);

    // the pose: as given, turned, then flipped
    const turn = inOutCubic(seg(t, at('rot') - 0.1, at('flip') - 0.1));
    const flip = inOutCubic(seg(t, at('flip') - 0.1, at('done') - 0.05));
    const pose = flip > 0 ? mixPose(MID, END, flip) : mixPose(START, MID, turn);
    const T = corners(DEG, BASE, pose);
    const shown = tw(t, at('tri') - lead, 0.6);
    // once it is set down, the sides take their colours; before, all ink
    const named = tw(t, at('done'), 0.5);
    drawTri(ctx, T, { lw: 6, alpha: shown, plain: named < 0.5 });
    const theta = angleAt(ctx, T, 'A', { r: 62, label: 'θ', size: 34, alpha: shown });
    const lo = { size: 36, alpha: shown, gap: 12 };
    const h3 = sideLabel(ctx, T, 'height', '3', { ...lo, color: named > 0.5 ? C.sin : C.ink });
    const b4 = sideLabel(ctx, T, 'base', '4', { ...lo, color: named > 0.5 ? C.cos : C.ink });
    const c5 = sideLabel(ctx, T, 'hyp', '5', { ...lo, color: C.ink });

    // a1: the s will not go on — it starts and stops
    const tryS = seg(t, at('wrong') - 0.1, at('cant') + 0.2) * 0.35;
    const giveUp = 1 - tw(t, at('m1'), 0.4);
    cursive(ctx, T, 's', tryS, { lw: 7, numbers: 0, alpha: giveUp });
    mark(ctx, 820, 200, '？', tw(t, at('cant') - lead, 0.35, outBack) * giveUp);

    // m1: where it should go, as an outline
    const ghost = tw(t, at('place') - lead, 0.5) * (1 - tw(t, at('done'), 0.4));
    const E = corners(DEG, BASE, END);
    ghostTri(ctx, E, { alpha: ghost, right: ghost });
    angleAt(ctx, E, 'A', { r: 50, label: 'θ', size: 30, color: C.muted, alpha: ghost, lw: 2 });

    // a2: the three sides named in turn
    const sides = focus(t, [at('h3'), at('b4'), at('c5')], at('a2.end'), cue);
    ringBox(ctx, h3, sides.level[0], C.accent, 10);
    ringBox(ctx, b4, sides.level[1], C.accent, 10);
    ringBox(ctx, c5, sides.level[2], C.accent, 10);

    // a3: the answers, one by one
    const X = 960;
    workLine(ctx, row('sin', 'θ', '=', frac('3', '5')), X, 330, tw(t, at('s') - lead, 0.5), { size: 62 });
    workLine(ctx, row('cos', 'θ', '=', frac('4', '5')), X, 500, tw(t, at('c') - lead, 0.5), { size: 62 });
    workLine(ctx, row('tan', 'θ', '=', frac('3', '4')), X, 670, tw(t, at('t') - lead, 0.5), { size: 62 });

    // m2: from θ, the side across and the sides beside it
    const from = tw(t, at('from') - lead, 0.6);
    // from just past θ's label (by then the triangle lies as E)
    const g = { x: theta.x + theta.w + 10, y: theta.y + theta.h / 2 };
    arrow(ctx, g, { x: E.C.x - 14, y: (E.B.y + E.C.y) / 2 }, { color: C.sin, p: from });
    arrow(ctx, g, { x: (E.A.x + E.C.x) / 2 + 30, y: E.A.y - 14 }, { color: C.cos, p: clamp(from * 1.2) });
    const names = focus(t, [at('names')], at('from'), cue).level[0];
    ringBox(ctx, [triBox(E), h3, b4, c5], names, C.accent, 14);
  },
});
