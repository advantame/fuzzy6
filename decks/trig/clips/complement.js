// 1-9: the other angle. A right triangle has one more angle, 90° − θ. Set down with that
// angle at the bottom left (the triangle flips over), height and base swap: the sine of
// 90° − θ is the cosine of θ, and the other way round. めたん names the pair complementary
// angles (余角), and answers ずんだもん's guess: the "co" of cosine is the complement's.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { seg, tw, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { focus, ringBox } from '../../../src/kit/cue.js';
import { corners, mixPose, mixTri, drawTri, angleAt, angleArc, sideLabel, triBox, RAD } from '../lib/tri.js';
import { math, row, paren, jp, up, tag } from '../lib/math.js';
import { workLine } from '../lib/drill.js';
import { pill } from '../lib/parts.js';

const DEG = 32;
const T = corners(DEG, 380, { x: 200, y: 640 });
// flipped: the other angle at the bottom left
const H = 380 * Math.tan(DEG * RAD);
const F2 = { A: { x: 200 + H, y: 640 - 380 }, B: { x: 200, y: 640 }, C: { x: 200 + H, y: 640 } };
const X = 760;

const script = [
  { id: 'a', label: '気になったこと', text: 'そういえば、{recall}三問めで三角形を置き直したとき、気になったことがあるのだ。' },
  { id: 'b', label: 'もう一つの角', text: '直角三角形には、[θ|シータ] のほかに、{other}もう一つ角があるのだ。' },
  { id: 'c', label: '90° − θ', text: '{sum}三つの角を足すと 180 度だから、その角は、{v}90 度ひく [θ|シータ] なのだ。' },
  { id: 'd', label: '入れ替わる', text: '{flip}その角が左下に来るように置き直すと……{swap}高さと底辺が、入れ替わるのだ！' },
  { id: 'e', label: 'sin(90° − θ)', text: '{eq}だから、90 度ひく [θ|シータ] のサインは、[θ|シータ] のコサインと同じなのだ。' },
  { id: 'm1', by: 'metan', label: 'cos(90° − θ)', text: 'よく見つけたわね。{eq2}反対に、90 度ひく [θ|シータ] のコサインは、[θ|シータ] のサインと同じになるわ。' },
  { id: 'm2', by: 'metan', label: '余角', text: 'このように、{pair}足して 90 度になる二つの角を、互いの{yo}余角と呼ぶの。' },
  { id: 'f', label: 'コサインの「コ」', text: 'コサインの{co}[「コ」|コ]という音も、もしかして、そこから来ているのだ？' },
  { id: 'm3', by: 'metan', label: '余角のサイン', text: 'ええ。{abbr}コサインは、「余角のサイン」という意味の言葉を、縮めた名前なのよ。' },
  { id: 'm4', by: 'metan', label: '正弦と余弦', text: '日本語でも、{jp}サインを正弦、コサインを余弦と呼ぶわ。' },
  { id: 'm5', by: 'metan', label: '余角の正弦', text: '{yo2}余弦は、余角の正弦にあたるのよ。' },
];

export default clip({
  id: 'complement',
  title: 'もう一つの角',
  cast: ['metan', 'zunda'],
  script,

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;

    // ——— the triangle; in d it flips over its diagonal
    const flip = inOutCubic(seg(t, at('flip') - 0.1, at('flip') + 1.0));
    const P = mixTri(T, F2, flip);
    // the side C–B is the height before the flip and the base after; C–A the other way
    const swap = flip > 0.5 ? 1 : 0;
    drawTri(ctx, P, { lw: 6, height: { color: swap ? C.cos : C.sin }, base: { color: swap ? C.sin : C.cos } });
    // θ at the old A; 90° − θ at the old B
    angleAt(ctx, P, 'A', { r: 64, label: 'θ', size: 32, color: C.ink });
    const other = tw(t, at('other') - lead, 0.5);
    const named = tw(t, at('v') - lead, 0.5, outBack);
    angleAt(ctx, P, 'B', { r: 52, label: named > 0.5 ? row('90°', '−', 'θ') : '？', size: named > 0.5 ? 28 : 34, color: C.accent, alpha: other });
    // the names of the sides, as seen from the angle at the bottom left: they swap with the flip
    const nameA = 1 - Math.sin(Math.PI * flip);
    sideLabel(ctx, P, 'height', swap ? '底辺' : '高さ', { size: 28, color: swap ? C.cos : C.sin, alpha: nameA });
    sideLabel(ctx, P, 'base', swap ? '高さ' : '底辺', { size: 28, color: swap ? C.sin : C.cos, alpha: nameA });
    const sw = focus(t, [at('swap')], at('d.end'), cue).level[0];
    ringBox(ctx, triBox(P), sw, C.accent, 30);

    // a: what she recalls — 1-6's triangle, set down again, small in the top right
    const recall = tw(t, at('recall') - lead, 0.5) * (1 - tw(t, at('b'), 0.5));
    if (recall > 0) {
      const turn = inOutCubic(seg(t, at('recall') + 0.3, at('recall') + 1.6));
      const pose = mixPose({ x: 1180, y: 120, rot: -Math.PI / 2, fx: -1 }, { x: 1080, y: 330, rot: 0, fx: 1 }, turn);
      const R = corners((Math.atan2(3, 4) * 180) / Math.PI, 200, pose);
      ctx.save();
      ctx.globalAlpha *= recall;
      drawTri(ctx, R, { lw: 4, plain: turn < 0.98 });
      angleAt(ctx, R, 'A', { r: 36, label: 'θ', size: 22, sideW: 4 });
      ctx.restore();
      text(ctx, '演習 3 で', 1080, 380, { font: F.jp(700, 24), color: C.muted, alpha: recall });
    }

    // c: the angles add to 180°
    workLine(ctx, row('θ', '+', paren('90°', '−', 'θ'), '+', '90°', '=', '180°'), X, 210, tw(t, at('sum') - lead, 0.5) * (1 - tw(t, at('eq'), 0.5)), { size: 40 });

    // e, m1: the two equalities
    workLine(ctx, row('sin', paren('90°', '−', 'θ'), '=', 'cos', 'θ'), X, 300, tw(t, at('eq') - lead, 0.5), { size: 46 });
    workLine(ctx, row('cos', paren('90°', '−', 'θ'), '=', 'sin', 'θ'), X, 400, tw(t, at('eq2') - lead, 0.5), { size: 46 });

    // m2: 余角 — the two angles together
    const pair = focus(t, [at('pair')], at('m2.end'), cue).level[0];
    if (pair > 0) {
      angleArc(ctx, P.A, P.C, P.B, { r: 76, color: C.accent, alpha: pair, lw: 4 });
      angleArc(ctx, P.B, P.A, P.C, { r: 64, color: C.accent, alpha: pair, lw: 4 });
    }
    const yo = Math.min(1, tw(t, at('yo') - lead, 0.5, outBack));
    const yb = pill(ctx, '余角', X, 499, { w: 130, alpha: yo });
    text(ctx, '足して 90° になる二つの角', yb.x + yb.w + 20, 509, { font: F.jp(500, 26), color: C.ink2, alpha: yo });

    // f, m3: co + sine
    const coA = tw(t, at('co') - lead, 0.5);
    const word = math(ctx, row(tag('co', up('co', C.accent, 500)), tag('sine', up('sine', C.ink, 500))), X, 640, { size: 50, alpha: coA });
    ringBox(ctx, word.parts.co, focus(t, [at('co')], at('f.end'), cue).level[0], C.accent);
    // under each part, what it stands for
    const abbr = tw(t, at('abbr') - lead, 0.5) * (coA > 0 ? 1 : 0);
    const under = (b, s, color) => text(ctx, s, b.x + b.w / 2, b.y + b.h + 34, { font: F.jp(500, 24), color, alpha: abbr, align: 'center' });
    under(word.parts.co, '余角の', C.accent);
    under(word.parts.sine, 'サイン', C.ink2);

    // m4: 正弦 and 余弦
    const names = tw(t, at('jp') - lead, 0.5);
    const yo2 = tw(t, at('yo2') - lead, 0.4);
    const b = (s, color) => jp(s, color, 700);
    math(ctx, row(b('サイン', C.sin), '=', b('正弦', C.sin)), X, 790, { size: 34, alpha: names, color: C.sin });
    const co = math(ctx, row(b('コサイン', C.cos), '=', tag('yo', b('余', yo2 > 0.5 ? C.accent : C.cos)), b('弦', C.cos)), X + 330, 790, { size: 34, alpha: names, color: C.cos });
    const yb2 = co.parts.yo;
    ringBox(ctx, yb2, yo2 * (1 - tw(t, at('m5.end') - cue.fall, cue.fall)), C.accent);
    text(ctx, '＝ 余角の正弦', yb2.x, yb2.y + yb2.h + 40, { font: F.jp(700, 26), color: C.accent, alpha: yo2 });
  },
});
