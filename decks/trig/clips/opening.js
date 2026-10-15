// The opening: a skit. ずんだもん walks along a road (the scenery scrolls past, she bobs),
// stops short at a tree and wants to know how tall it is. All she can measure is the
// distance to it and the angle up to its top. She decides to use mathematics, and as she
// says "abstract", the scenery fades and leaves the right triangle on squared paper — the
// first frame of 1-1, which joins on (lib/scene.js draws it for both).
//
// She stands on the stage here, so the bar shows no figure (cast: []); her mouth follows the
// recording (lib/voice.js).

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { seg, tw, lerp, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { circle } from '../../../src/kit/draw.js';
import { scenery, drawTree, zundamon, mark, treeTriangle, treeCorners, TREE } from '../lib/scene.js';
import { protractor, cross } from '../lib/parts.js';
import { mouthAt, eyesAt } from '../lib/voice.js';

const V = 300; // px a second the road passes while she walks
const STOP = 0.45; // seconds she takes to stop
const ZX = 196; // her centre on the stage
const FADE = 2.0; // the scenery's fade once she says "abstract"

const script = [
  { id: 'walk', lead: 2.6, rest: 'short' },
  { id: 'see', label: '木がある', text: '……ん？{tree}木があるのだ。' },
  { id: 'want', label: '高さが知りたい', text: 'あの木の{height}高さが、なぜか無性に知りたいのだ。' },
  { id: 'climb', label: '登るのは無理', text: 'でも、{up}登って測るのは{no}無理なのだ。' },
  { id: 'know', label: '距離と角度だけ', text: 'わかるのは、木までの{dist}距離と、てっぺんを見上げる{ang}角度だけ……。' },
  { id: 'idea', label: '数学を使う', speed: 'fast', rest: 'short', text: '……そうだ、{math}数学を使えば、わかるはずなのだ！' },
  { id: 'abstract', label: '抽象化する', speed: 'fast', tail: 1.6, text: '{abs}抽象化して、{tri}直角三角形について考えるのだ！' },
];

export default clip({
  id: 'opening',
  title: '測れない高さ',
  numbered: false,
  cast: [],
  poster: 'idea.done',
  script,

  draw(ctx, t, _, { at, pace }) {
    const stop = at('see');
    const cruise = stop - STOP;
    // distance walked: steady, then easing to a halt at `stop`
    const walked = (u) => V * Math.min(u, cruise) + (u > cruise ? V * STOP * (seg(u, cruise, stop) - seg(u, cruise, stop) ** 2 / 2) : 0);
    const scroll = walked(t);
    const total = walked(stop + 1);
    const speed = t < cruise ? 1 : 1 - seg(t, cruise, stop);

    const abs = at('abs');
    const gone = inOutCubic(seg(t, abs, abs + FADE));
    const T = treeCorners();

    // ——— the scenery and the tree, until she abstracts them away
    scenery(ctx, scroll, 1 - gone, total);
    const treeX = TREE.A.x + TREE.base + (total - scroll);
    drawTree(ctx, treeX, TREE.A.y, TREE.A.y - T.B.y, 1 - gone);

    // ——— what she measures, drawn over the scenery
    // climbing is out: a dotted way up the trunk, crossed out
    const climbA = tw(t, at('up') - 0.1, 0.6) * (1 - tw(t, at('know'), 0.4));
    if (climbA > 0) {
      ctx.save();
      ctx.globalAlpha *= climbA;
      ctx.setLineDash([4, 12]);
      ctx.lineCap = 'round';
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(T.C.x - 40, T.C.y - 10);
      ctx.bezierCurveTo(T.C.x - 70, T.C.y - 200, T.C.x - 10, T.C.y - 360, T.B.x - 30, T.B.y + 40);
      ctx.stroke();
      ctx.setLineDash([]);
      cross(ctx, T.C.x - 50, T.C.y - 250, 46, tw(t, at('no') - 0.1, 0.35, outBack));
      ctx.restore();
    }

    // the distance: footsteps from A to the root, counted out
    const dist = at('dist');
    const steps = 18;
    const stepA = 1 - gone;
    for (let i = 0; i <= steps; i++) {
      const on = tw(t, dist - 0.1 + i * 0.055, 0.25);
      if (on <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= on * stepA;
      ctx.fillStyle = C.cos;
      circle(ctx, lerp(T.A.x, T.C.x, i / steps), T.A.y + 22, i % 3 ? 4 : 6);
      ctx.fill();
      ctx.restore();
    }
    const distLabel = tw(t, dist - 0.1 + steps * 0.055, 0.5);

    // the angle: a protractor at A, and the line of sight up to the top
    const ang = at('ang');
    const sight = tw(t, ang - 0.15, 0.7, inOutCubic);
    protractor(ctx, T.A, { r: 120, step: 10, alpha: tw(t, ang - 0.15, 0.5) * (1 - gone) });
    if (sight > 0) {
      // dashed while it is a line of sight, solid once it is the hypotenuse
      ctx.save();
      ctx.globalAlpha *= 1 - gone;
      ctx.setLineDash([14, 10]);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(T.A.x, T.A.y);
      ctx.lineTo(lerp(T.A.x, T.B.x, sight), lerp(T.A.y, T.B.y, sight));
      ctx.stroke();
      ctx.restore();
    }

    // the triangle itself, solid once the scenery fades; its labels come in as they are measured
    const heightL = tw(t, at('height') - 0.15, 0.6);
    treeTriangle(ctx, {
      sides: gone,
      labels: { dist: distLabel, ang: tw(t, ang + 0.3, 0.5), height: heightL, heightP: heightL },
      // over the leaves, the unknown height needs a white plate to be read
      patch: 1 - gone,
    });

    // ——— ずんだもん, in the foreground
    const walking = speed * (t < stop ? 1 : 0);
    const bob = Math.abs(Math.sin(t * Math.PI * 2.4)) * 14 * walking;
    const lean = 0.07 * Math.sin(Math.PI * seg(t, stop - 0.15, stop + 0.45));
    const hop = 26 * Math.sin(Math.PI * seg(t, at('math') - 0.1, at('math') + 0.35));
    zundamon(ctx, ZX, {
      bob: bob + hop,
      tilt: lean,
      alpha: 1 - inOutCubic(seg(t, abs + 0.2, abs + FADE * 0.8)),
      mouth: mouthAt('opening', script, t, at, pace, 'zunda'),
      eyes: eyesAt(3, t),
    });
    // the marks over her head
    const headY = 912 - 380 - 20;
    mark(ctx, ZX + 120, headY, '？', tw(t, at('see.voice'), 0.3) * (1 - seg(t, at('tree') - 0.1, at('tree'))));
    mark(ctx, ZX + 120, headY, '！', tw(t, at('tree') - 0.05, 0.3, outBack) * (1 - seg(t, at('want.end'), at('want.end') + 0.3)));
    mark(ctx, ZX + 120, headY - hop, '！', tw(t, at('math') - 0.1, 0.3, outBack) * (1 - seg(t, abs, abs + 0.6)), C.accent);
  },
});

