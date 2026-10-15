// 2-5: the sum of the turns. The rotation by θ₁ takes u's direction to v's, θ₂ v's to w's, θ₃
// w's back to u's: the three together fix a point of the circle, so they are the identity and
// their angle is 0 — θ₁ + θ₂ + θ₃ = 2kπ for some integer k. The circle alone cannot tell k. On
// the number line (another view), the turns laid end to end from s₀ (u's direction is E(s₀))
// end on one of s₀ + 2kπ; each is between 0 and π, so the sum is between 0 and 3π, and the only
// multiple of 2π there is 2π: k = 1.

import { clip } from '../lib/clip.js';
import { C, CORNER, F } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, clamp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { plane, toPx, v2, E, dirOf, arrow, seg, dot, label, TAU } from '../lib/geo.js';
import { tex, formulaBox, cross } from '../lib/math.js';
import { DIR, theta, dirCircle, turnOnCircle } from '../lib/proof1.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const U_ = say('u', 'ユー');
const V_ = say('v', 'ブイ');
const W_ = say('w', 'ダブリュー');
const SUM = say('θ₁ ＋ θ₂ ＋ θ₃', 'シータイチタスシータニタスシータサン');
const script = [
  { id: 'move', label: '三つの回転', text: `回転角 ${say('θ₁', 'シータイチ')} の回転は、{a1}${U_} の向きを ${V_} の向きに移す。\n{a2}${say('θ₂', 'シータニ')} の回転は ${V_} を ${W_} に、{a3}${say('θ₃', 'シータサン')} の回転は ${W_} を ${U_} に移すわ。` },
  { id: 'back', label: '元に戻る', text: `三つを順に合わせた回転は、{b}${U_} の向きを ${U_} の向きに戻す。\n{fix}単位円の点を一つ動かさない回転だから、回転角は 0 なの。` },
  { id: 'kpi', label: '2π の整数倍', text: `回転角は ${say('2π', 'ニパイ')} を法として足されるから、\n{s}${SUM} は ${say('2π', 'ニパイ')} の整数倍。` },
  { id: 'kk', label: '2kπ', text: `{k}整数 ${say('k', 'ケー')} を使って、${say('2kπ', 'ニケーパイ')} と書けるわ。` },
  { id: 'q', by: 'zunda', label: 'k は？', text: `単位円の上を見ているだけでは、{qq}${say('k', 'ケー')} がいくつなのかは、わからないのだ。` },
  { id: 'line', lead: 0.8, label: '数直線で', text: 'そこで、回転角を数直線の上で足すの。' },
  { id: 'line2', label: 's₀ + 2kπ', text: `{s0}${U_} の向きを ${say('E(s₀)', 'イーエスゼロ')} とすると、\n{lands}三つを順に足した先は、${say('s₀ ＋ 2kπ', 'エスゼロタス、ニケーパイ')} のどれかよ。` },
  { id: 'bound', label: '0 と 3π のあいだ', text: `{each}三つとも 0 と ${say('π', 'パイ')} のあいだだから、{sum}和は 0 と ${say('3π', 'サンパイ')} のあいだ。\n{only}その範囲にある ${say('2π', 'ニパイ')} の整数倍は、${say('2π', 'ニパイ')} だけなの。` },
  { id: 'res', by: 'zunda', label: 'k = 1', text: `{k1}だから ${say('k ＝ 1', 'ケー、イコール、イチ')}。{eq}${say('θ₁ ＋ θ₂ ＋ θ₃ ＝ 2π', 'シータイチタスシータニタスシータサン、イコール、ニパイ')} なのだ！` },
];

const PCL = plane(330, 330, 215);
const S0 = dirOf(DIR.u);
const LINE = { y: 760, s0: -0.6, x0: 70, k: 101 };
const sx = (s) => LINE.x0 + (s - LINE.s0) * LINE.k;
const X = 700;
const TH = [theta(1), theta(2), theta(3)];
const CORNERS = ['B', 'C', 'A'];

export default clip({
  id: 'once',
  title: '回転角の和',
  kicker: '証明 1',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;

    // move: the three rotations, one after another, on the circle
    dirCircle(ctx, { P: PCL, alpha: k.in('move'), dots: { u: k.in('move'), v: k.in('move'), w: k.in('move') } });
    for (const i of [1, 2, 3]) turnOnCircle(ctx, i, { P: PCL, alpha: k.in(`a${i}`), p: tw(t, at(`a${i}`) - 0.15, 0.7), r: 1.12 });

    // back: a point carried by the three in turn, returning to u's direction
    const run = clamp((t - at('b') + 0.2) / 2.4);
    const bIn = k.in('b') * (1 - tw(t, at('kpi'), 0.4));
    if (bIn > 0.001) {
      const s = S0 + TAU * inOutCubic(run);
      dot(ctx, toPx(PCL, E(s)), { r: 11, color: C.accent, alpha: bIn });
    }
    const fixIn = k.in('fix');
    formulaBox(ctx, [R`R_{\theta_3}R_{\theta_2}R_{\theta_1}\Bigl(\frac{u}{|u|}\Bigr) = \frac{u}{|u|}`, { src: R`\Rightarrow\ R_{\theta_3}R_{\theta_2}R_{\theta_1} = \mathrm{id}\quad(\text{回転角 } 0)`, alpha: fixIn }], X, 120, {
      size: 38,
      alpha: k.in('b'),
    });

    // kpi: the sum is a multiple of 2π
    tex(ctx, R`\theta_1+\theta_2+\theta_3 \equiv 0 \pmod{2\pi}`, X + 10, 330, { size: 40, alpha: k.in('s') });
    formulaBox(ctx, R`\theta_1+\theta_2+\theta_3 = 2k\pi\quad(k\ \text{は整数})`, X, 420, { size: 40, alpha: k.in('k') });
    const qIn = k.in('qq') * (1 - tw(t, at('k1'), 0.3));
    text(ctx, 'k = ?', X + 640, 425, { font: F.jp(700, 40), color: C.accent, alpha: qIn });

    // line: the number line, s₀ and the numbers E sends to u's direction
    const lIn = k.in('line');
    if (lIn > 0.001) {
      arrow(ctx, { x: sx(LINE.s0), y: LINE.y }, { x: sx(13.6), y: LINE.y }, { color: C.muted, lw: 2, head: 14, alpha: lIn });
      for (let i = 0; i <= 8; i++) {
        const x = sx((i * Math.PI) / 2);
        const major = i % 2 === 0;
        seg(ctx, { x, y: LINE.y - (major ? 11 : 6) }, { x, y: LINE.y + (major ? 11 : 6) }, { color: C.muted, lw: 2, alpha: lIn });
        if (major) tex(ctx, ['0', R`\pi`, R`2\pi`, R`3\pi`, R`4\pi`][i / 2], x, LINE.y + 46, { size: 26, color: C.muted, align: 'center', alpha: lIn });
      }
      text(ctx, 's', sx(13.6) + 8, LINE.y + 8, { font: 'italic 400 28px "KaTeX_Math"', color: C.muted, alpha: lIn });
    }
    // s₀ + 2πk, the numbers whose point is u's direction
    const s0In = k.in('s0');
    const marks = [S0, S0 + TAU, S0 + 2 * TAU];
    marks.forEach((s, i) => {
      dot(ctx, { x: sx(s), y: LINE.y }, { r: 8, color: C.ink, alpha: s0In });
      tex(ctx, [R`s_0`, R`s_0+2\pi`, R`s_0+4\pi`][i], sx(s), LINE.y - 58, { size: 28, align: 'center', alpha: s0In });
    });
    text(ctx, 'E で u/|u| に移る点', sx(S0 + TAU) - 120, LINE.y - 100, { font: F.jp(500, 22), color: C.ink2, alpha: s0In * (1 - tw(t, at('bound'), 0.4)) });
    // the turns laid end to end from s₀
    let acc = S0;
    TH.forEach((th, i) => {
      const p = inOutCubic(span(t, at('lands') + i * 0.5, at('lands') + 0.5 + i * 0.5));
      const y = LINE.y - 26 - i * 0;
      seg(ctx, { x: sx(acc), y }, { x: sx(acc + th * p), y }, { color: CORNER[CORNERS[i]], lw: 7, alpha: k.in('lands'), cap: 'butt' });
      if (p > 0.6) tex(ctx, R`\theta_${i + 1}`, sx(acc + th / 2), y - 14, { size: 26, color: CORNER[CORNERS[i]], align: 'center', alpha: k.in('lands') });
      acc += th;
    });

    // bound: the sum lies strictly between 0 and 3π after s₀
    const bdIn = k.in('sum');
    if (bdIn > 0.001) {
      ctx.save();
      ctx.globalAlpha *= bdIn * 0.5;
      ctx.fillStyle = C.accentSoft;
      ctx.fillRect(sx(S0), LINE.y - 18, sx(S0 + 3 * Math.PI) - sx(S0), 36);
      ctx.restore();
      dot(ctx, { x: sx(S0 + 3 * Math.PI), y: LINE.y }, { r: 8, open: true, color: C.accent, alpha: bdIn });
      tex(ctx, R`s_0+3\pi`, sx(S0 + 3 * Math.PI), LINE.y + 82, { size: 26, color: C.accent, align: 'center', alpha: bdIn });
    }
    tex(ctx, R`0 < \theta_i < \pi\ \Rightarrow\ 0 < \theta_1+\theta_2+\theta_3 < 3\pi`, X + 10, 540, { size: 36, alpha: k.in('each') });
    const only = k.in('only');
    cross(ctx, sx(S0), LINE.y, 15, only, { lw: 5 });
    cross(ctx, sx(S0 + 2 * TAU), LINE.y, 15, only, { lw: 5 });
    if (only > 0.001) {
      ctx.save();
      ctx.globalAlpha *= only;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx(S0 + TAU), LINE.y, 17, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // res: k = 1, and the three arcs make exactly one turn
    const rIn = k.in('k1');
    tex(ctx, R`k = 1`, X + 640, 425, { size: 44, color: C.accent, alpha: rIn });
    formulaBox(ctx, R`\theta_1+\theta_2+\theta_3 = 2\pi`, X + 20, 622, { size: 44, alpha: k.in('eq') });
    const ring = k.lit(['eq'], k.fade('res.end')).level[0];
    if (ring > 0.001) {
      for (const i of [1, 2, 3]) turnOnCircle(ctx, i, { P: PCL, alpha: ring, r: 1.12, lw: 9, name: false });
    }
    void label;
  },
});
