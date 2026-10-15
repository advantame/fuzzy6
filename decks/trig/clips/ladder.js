// 1-5, exercise 2: a 5 m ladder against a wall at 70°. The ladder is the hypotenuse; the
// height up the wall is sin (the s goes hypotenuse → height), the distance from the wall is
// cos (the c goes hypotenuse → base). Given the hypotenuse and the angle, both other sides
// follow — ずんだもん's discovery of 1-2, now as a calculation.

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { seg, tw, inOutCubic, outBack, lerp } from '../../../src/kit/ease.js';
import { focus, ring } from '../../../src/kit/cue.js';
import { corners, drawTri, angleArc, dim, sideLabel, unit } from '../lib/tri.js';
import { cursive } from '../lib/cursive.js';
import { row, jp, colored } from '../lib/math.js';
import { trigTable } from '../lib/table.js';
import { cornerMemo, tab, example, workLine } from '../lib/drill.js';

const WALL = 700;
const GROUND = 700;
const T = corners(70, 188, { x: WALL - 188, y: GROUND });
const ROWS = Array.from({ length: 17 }, (_, i) => 62 + i);
const TABLE = { x: 1010, y: 250, show: 9 };

const script = [
  { id: 'q1', by: 'metan', label: '二問め', text: '二問め。長さ{l5} 5 メートルのはしごを、地面との角が{a70} 70 度になるように、{lean}壁に立てかけたわ。' },
  { id: 'q2', by: 'metan', label: '上の端の高さ', text: '{top}はしごの上の端は、地面からどれくらいの高さにあるかしら。' },
  { id: 'a1', label: 's の形', text: '{hyp}はしごが斜辺で、知りたいのは{h}高さ。斜辺から高さだから、{s}[s|エス] の形……{sin}[sin|サイン] なのだ！' },
  { id: 'a2', label: '5 × sin 70°', text: '{eq}高さは、5 メートルに [sin 70°|サインナナジュウド] を掛ければいいのだ。' },
  { id: 'a3', label: '約 4.7 m', text: '{look}表で見ると、[sin 70°|サインナナジュウド] は{v} [0.9397|レイテンキューサンキューナナ] だから……{ans}だいたい [4.7|ヨンテンナナ] メートルなのだ。' },
  { id: 'q3', by: 'metan', label: '根もとまで', text: '正解よ。では、{wall}壁から、はしごの根もとまでの距離は？' },
  { id: 'a4', label: 'cos で約 1.7 m', text: '斜辺から底辺だから、{c}[c|シー] の形で [cos|コサイン] なのだ。{v2}5 かける [0.3420|レイテンサンヨンニイゼロ] で、{ans2}だいたい [1.7|イッテンナナ] メートルなのだ！' },
  { id: 'm', by: 'metan', label: '残りの二辺', text: 'よくできたわね。{two}斜辺と角がわかれば、[sin|サイン] と [cos|コサイン] で、{rest}残りの二つの[辺|ヘン]が出せるのよ。' },
];

export default clip({
  id: 'ladder',
  title: 'はしご',
  kicker: '演習 2',
  cast: ['metan', 'zunda'],
  script,

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const sLit = focus(t, [at('s')], at('a1.end'), cue).level[0];
    const cLit = focus(t, [at('c')], at('a4.end'), cue).level[0];
    cornerMemo(ctx, { lit: sLit > 0.5 ? 's' : cLit > 0.5 ? 'c' : null });
    tab(ctx, 2);

    // the scene: ground, wall, ladder (the ladder slides into place as it is leaned)
    const ground = tw(t, at('q1'), 0.6);
    ctx.save();
    ctx.globalAlpha *= ground;
    ctx.fillStyle = C.ink2;
    ctx.fillRect(330, GROUND, 520, 4);
    ctx.fillStyle = '#e9e2d4';
    ctx.fillRect(WALL, 110, 46, GROUND - 110);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.5;
    for (let y = 120; y < GROUND; y += 24) {
      ctx.beginPath();
      ctx.moveTo(WALL + 46, y);
      ctx.lineTo(WALL + 22, y + 20);
      ctx.stroke();
    }
    ctx.fillStyle = C.ink2;
    ctx.fillRect(WALL, 110, 4, GROUND - 110);
    ctx.restore();
    example(ctx, 120, 120, ground);

    const lean = inOutCubic(seg(t, at('l5') - 0.2, at('lean') + 0.6));
    const ang = lerp(84, 70, lean);
    const foot = { x: WALL - 550 * Math.cos((ang * Math.PI) / 180), y: GROUND };
    const top = { x: WALL, y: GROUND - 550 * Math.sin((ang * Math.PI) / 180) };
    ladder(ctx, foot, top, ground);

    // the triangle in it: the base along the ground, the height up the wall
    const tri = tw(t, at('top') - lead, 0.6);
    drawTri(ctx, T, { lw: 5, alpha: tri, hyp: { alpha: 0 } });
    angleArc(ctx, T.A, T.C, T.B, { r: 80, label: '70°', size: 32, alpha: tw(t, at('a70') - lead, 0.5) });
    sideLabel(ctx, T, 'hyp', '5 m', { off: 52, size: 34, alpha: tw(t, at('l5') - lead, 0.5), color: C.ink });

    // the height: a question, then the answer
    const ans = tw(t, at('ans') - lead, 0.5, outBack);
    dim(ctx, T.C, T.B, { x: 1, y: 0 }, 86, ans > 0.5 ? '約 4.7 m' : '？', { alpha: tri, size: 36, labelOff: ans > 0.5 ? 96 : 40, color: C.sin, labelColor: ans > 0.5 ? C.accent : C.sin });
    // the base: asked in q3
    const ans2 = tw(t, at('ans2') - lead, 0.5, outBack);
    dim(ctx, T.A, T.C, { x: 0, y: 1 }, 48, ans2 > 0.5 ? '約 1.7 m' : '？', { alpha: tw(t, at('wall') - lead, 0.5), size: 34, labelOff: 30, color: C.cos, labelColor: ans2 > 0.5 ? C.accent : C.cos });

    // her reading: hypotenuse and height, the s
    const parts = focus(t, [at('hyp'), at('h')], at('s'), cue);
    const u = unit(T.A, T.B);
    ring(ctx, (T.A.x + T.B.x) / 2 - 80 - u.y * 0, (T.A.y + T.B.y) / 2 - 40, 120, 80, parts.level[0], C.accent);
    ring(ctx, T.C.x + 40, (T.B.y + T.C.y) / 2 - 40, 120, 80, parts.level[1], C.accent);
    cursive(ctx, T, 's', seg(t, at('s') - 0.1, at('s') + 1.1), { lw: 7, numbers: 0, alpha: 1 - 0.8 * tw(t, at('a1.end'), 0.6) });
    cursive(ctx, T, 'c', seg(t, at('c') - 0.1, at('c') + 1.1), { lw: 7, numbers: 0, alpha: 1 - 0.8 * tw(t, at('a4.end'), 0.6) });

    // the working, on the left
    const sin70 = row('sin', '70°');
    const cos70 = row('cos', '70°');
    workLine(ctx, row(jp('高さ', C.sin), '=', '5', '×', sin70), 80, 330, tw(t, at('eq') - lead, 0.5), { size: 38 });
    workLine(ctx, row('=', '5', '×', '0.9397', '≒', colored(C.accent, '4.7')), 150, 400, tw(t, at('ans') - lead, 0.5), { size: 38 });
    workLine(ctx, row(jp('底辺', C.cos), '=', '5', '×', cos70), 80, 520, tw(t, at('c') - lead, 0.5), { size: 38 });
    workLine(ctx, row('=', '5', '×', '0.3420', '≒', colored(C.accent, '1.7')), 150, 590, tw(t, at('ans2') - lead, 0.5), { size: 38 });

    // the table at 70°: sin, then cos
    const look = tw(t, at('look') - lead, 0.6);
    const sinLit = tw(t, at('v') - lead, cue.rise) * (1 - tw(t, at('q3'), 0.4));
    const cosLit = tw(t, at('v2') - lead, cue.rise) * (1 - tw(t, at('m'), 0.4));
    trigTable(ctx, TABLE.x, TABLE.y, {
      rows: ROWS, show: TABLE.show, scroll: ROWS.indexOf(70) - 4, alpha: look,
      hi: { deg: 70, col: cosLit > 0 ? 'cos' : 'sin', level: Math.max(sinLit, cosLit) },
    });

    // m: the hypotenuse and the angle settle both other sides
    const two = focus(t, [at('two'), at('rest')], at('m.end') - cue.fall, cue);
    ring(ctx, 60, 280, 430, 150, two.level[1], C.sin);
    ring(ctx, 60, 470, 430, 150, two.level[1], C.cos);
    ring(ctx, T.A.x - 30, T.A.y - 110, 150, 120, two.level[0], C.accent);
  },
});

// A ladder from foot to top: two rails and the rungs between them.
function ladder(ctx, foot, top, a) {
  if (a <= 0.001) return;
  const u = unit(foot, top);
  const n = { x: -u.y, y: u.x };
  const w = 16;
  const len = Math.hypot(top.x - foot.x, top.y - foot.y);
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = '#9a7650';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(foot.x + n.x * w * s, foot.y + n.y * w * s);
    ctx.lineTo(top.x + n.x * w * s, top.y + n.y * w * s);
    ctx.stroke();
  }
  ctx.lineWidth = 5;
  for (let d = 36; d < len - 10; d += 44) {
    const p = { x: foot.x + u.x * d, y: foot.y + u.y * d };
    ctx.beginPath();
    ctx.moveTo(p.x - n.x * w, p.y - n.y * w);
    ctx.lineTo(p.x + n.x * w, p.y + n.y * w);
    ctx.stroke();
  }
  ctx.restore();
}
