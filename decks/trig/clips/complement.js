// 1-9: the other angle. A right triangle has one more angle, 90° − θ. Set down with that
// angle at the bottom left (the triangle flips over), height and base swap: the sine of
// 90° − θ is the cosine of θ, and the other way round. めたん names the pair complementary
// angles (余角), and answers ずんだもん's guess: the "co" of cosine is the complement's.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { seg, tw, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { text, rr } from '../../../src/kit/draw.js';
import { focus, ring } from '../../../src/kit/cue.js';
import { corners, mixPt, mixPose, drawTri, angleArc, rightMark, label, sidePoint, RAD } from '../lib/tri.js';
import { row, paren, box } from '../lib/math.js';
import { workLine } from '../lib/drill.js';

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
    const P = { A: mixPt(T.A, F2.A, flip), B: mixPt(T.B, F2.B, flip), C: mixPt(T.C, F2.C, flip) };
    // the side C–B is the height before the flip and the base after; C–A the other way
    const swap = flip > 0.5 ? 1 : 0;
    side(ctx, P.C, P.B, swap ? C.cos : C.sin);
    side(ctx, P.A, P.C, swap ? C.sin : C.cos);
    side(ctx, P.A, P.B, C.ink);
    rightMark(ctx, P);
    // θ at the old A; 90° − θ at the old B
    angleArc(ctx, P.A, P.C, P.B, { r: 64, label: 'θ', size: 32, color: C.ink });
    const other = tw(t, at('other') - lead, 0.5);
    const named = tw(t, at('v') - lead, 0.5, outBack);
    angleArc(ctx, P.B, P.A, P.C, { r: 52, label: named > 0.5 ? row('90°', '−', 'θ') : '？', size: named > 0.5 ? 28 : 34, labelR: named > 0.5 ? 120 : 86, color: C.accent, alpha: other });
    // the names of the sides, as seen from the angle at the bottom left
    const tag = (s, side, color) => {
      const sp = sidePoint(P, side, side === 'base' ? 34 : 56);
      label(ctx, s, sp.x, sp.y, { size: 28, color, alpha: 1 - Math.sin(Math.PI * flip) });
    };
    // before the flip, base = A–C, height = C–B; after, the reverse
    if (!swap) {
      tag('高さ', 'height', C.sin);
      tag('底辺', 'base', C.cos);
    } else {
      // after the flip the bottom left corner is the old B: name the sides by where they are
      const pt1 = mixPt(P.B, P.C, 0.5);
      const pt2 = mixPt(P.C, P.A, 0.5);
      label(ctx, '底辺', pt1.x, pt1.y + 36, { size: 28, color: C.cos, alpha: 1 - Math.sin(Math.PI * flip) });
      label(ctx, '高さ', pt2.x + 56, pt2.y, { size: 28, color: C.sin, alpha: 1 - Math.sin(Math.PI * flip) });
    }
    const sw = focus(t, [at('swap')], at('d.end'), cue).level[0];
    ring(ctx, 170, 240, 310, 440, sw, C.accent);

    // a: what she recalls — 1-6's triangle, set down again, small in the top right
    const recall = tw(t, at('recall') - lead, 0.5) * (1 - tw(t, at('b'), 0.5));
    if (recall > 0) {
      const turn = inOutCubic(seg(t, at('recall') + 0.3, at('recall') + 1.6));
      const pose = mixPose({ x: 1180, y: 120, rot: -Math.PI / 2, fx: -1 }, { x: 1080, y: 330, rot: 0, fx: 1 }, turn);
      const R = corners((Math.atan2(3, 4) * 180) / Math.PI, 200, pose);
      ctx.save();
      ctx.globalAlpha *= recall;
      drawTri(ctx, R, { lw: 4, plain: turn < 0.98 });
      angleArc(ctx, R.A, R.C, R.B, { r: 36, label: 'θ', size: 22 });
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
    const yo = tw(t, at('yo') - lead, 0.5, outBack);
    if (yo > 0) {
      ctx.save();
      ctx.globalAlpha *= Math.min(1, yo);
      rr(ctx, X, 470, 130, 58, 29);
      ctx.fillStyle = C.accent;
      ctx.fill();
      text(ctx, '余角', X + 65, 510, { font: F.jp(700, 30), color: C.white, align: 'center' });
      text(ctx, '足して 90° になる二つの角', X + 150, 510, { font: F.jp(500, 26), color: C.ink2 });
      ctx.restore();
    }

    // f, m3: co + sine
    const coA = tw(t, at('co') - lead, 0.5);
    if (coA > 0) {
      const y = 640;
      const wCo = box(row('co'), 50).w;
      text(ctx, 'co', X, y, { font: F.sans(500, 50), color: C.accent, alpha: coA });
      text(ctx, 'sine', X + wCo + 4, y, { font: F.sans(500, 50), color: C.ink, alpha: coA });
      ring(ctx, X - 8, y - 46, wCo + 16, 60, focus(t, [at('co')], at('f.end'), cue).level[0], C.accent);
      const abbr = tw(t, at('abbr') - lead, 0.5);
      const wSine = box(row('sine'), 50).w;
      text(ctx, '余角の', X + wCo / 2, y + 46, { font: F.jp(500, 24), color: C.accent, alpha: abbr, align: 'center' });
      text(ctx, 'サイン', X + wCo + 4 + wSine / 2 + 10, y + 46, { font: F.jp(500, 24), color: C.ink2, alpha: abbr, align: 'center' });
    }

    // m4: 正弦 and 余弦
    const jp = tw(t, at('jp') - lead, 0.5);
    if (jp > 0) {
      const y = 790;
      text(ctx, 'サイン ＝ 正弦', X, y, { font: F.jp(700, 34), color: C.sin, alpha: jp });
      const x2 = X + 330;
      text(ctx, 'コサイン ＝ ', x2, y, { font: F.jp(700, 34), color: C.cos, alpha: jp });
      const w = box({ t: 'text', s: 'コサイン ＝ ', face: 'jp', kind: 'jp' }, 34).w;
      const yo2 = tw(t, at('yo2') - lead, 0.4);
      text(ctx, '余', x2 + w, y, { font: F.jp(700, 34), color: yo2 > 0.5 ? C.accent : C.cos, alpha: jp });
      text(ctx, '弦', x2 + w + 36, y, { font: F.jp(700, 34), color: C.cos, alpha: jp });
      ring(ctx, x2 + w - 6, y - 36, 46, 48, yo2 * (1 - tw(t, at('m5.end') - cue.fall, cue.fall)), C.accent);
      text(ctx, '＝ 余角の正弦', x2 + w, y + 48, { font: F.jp(700, 26), color: C.accent, alpha: yo2 });
    }
  },
});

function side(ctx, p, q, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(q.x, q.y);
  ctx.stroke();
  ctx.restore();
}
