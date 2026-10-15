// 3-3: the speed of q. Differentiating gives q′(t); ⟨q, q′⟩ = 0, so the velocity is tangent to
// the circle, and its length is h/(t² + h²). Another view gives the same number from the figure:
// (t, h) moves along the line at speed 1; the part of that velocity perpendicular to the
// segment from the origin is h/r (the triangle O, (t, 0), (t, h) has the same angle); carried
// to the unit circle, at distance 1 instead of r, it shrinks by 1/r, to h/r² = h/(t² + h²) —
// exactly the length of q′(t). The speed is largest at t = 0 (1/h) and goes to 0 far out.

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp } from '../../../src/kit/ease.js';
import { toPx, v2, add, scale, arrow, seg, dot, label } from '../lib/geo.js';
import { tex, formulaBox } from '../lib/math.js';
import { PS, H, f, q, tx, gy, drawPlane, drawLine, drawGraph, ray } from '../lib/proof2.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const Q_ = say('q(t)', 'キューティー');
const QD = say("q'(t)", 'キュープライムティー');
const script = [
  { id: 'diff', label: '微分する', text: `{d}${Q_} を ${say('t', 'ティー')} で微分するわ。` },
  { id: 'tan', label: '接線の向き', text: `{ip}${Q_} と ${QD} の内積を計算すると、0 になる。\n{tg}速度ベクトルは、単位円の接線の向きよ。` },
  { id: 'len', label: '速さ', text: `{l}長さを計算すると、速さは、${say('h', 'エイチ')} を ${say('t² ＋ h²', 'ティーニジョウタスエイチニジョウ')} で割った値になるの。` },
  { id: 'why', by: 'zunda', label: 'どうして', text: '{w}速さが、この形になるのは、どうしてなのだ？' },
  { id: 'alt1', label: '別の図', text: `別の図で確かめるわ。{v}点 ${say('(t, h)', 'ティーエイチ')} は、${say('x', 'エックス')} 軸の向きに速さ 1 で動く。` },
  { id: 'alt2', label: '垂直な成分', text: `{r}原点からの距離を ${say('r', 'アール')} とすると、{perp}線分に垂直な成分の大きさは、${say('h/r', 'アールブンノエイチ')} よ。` },
  { id: 'alt3', label: '1/r 倍', text: `{sh}単位円の上では、原点からの距離が 1 だから、垂直な成分は ${say('1/r', 'アールブンノイチ')} 倍になる。` },
  { id: 'alt4', label: 'h/r²', text: `{res}速さは ${say('h/r²', 'アールニジョウブンノエイチ')}、つまり、${say('h', 'エイチ')} を ${say('t² ＋ h²', 'ティーニジョウタスエイチニジョウ')} で割った値になるわ。` },
  { id: 'graph', label: 'グラフ', text: `{g}速さは、${say('t ＝ 0', 'ティーイコールゼロ')} で最大の ${say('1/h', 'エイチブンノイチ')} をとり、\n{far}${say('t', 'ティー')} の絶対値が大きくなるにつれて、0 に近づくの。` },
];

const TS = 1.8;
const RR = Math.hypot(TS, H);

export default clip({
  id: 'speed',
  title: 'q の速さ',
  kicker: '証明 2',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    drawPlane(ctx, { alpha: 1 });
    drawLine(ctx, { alpha: 1 });
    const r = ray(ctx, TS, { alpha: 1 });
    label(ctx, R`q(t)`, r.Q, { x: -1, y: -0.15 }, [r.shape], { size: 30, color: C.accent, gap: 12, fixed: true });
    label(ctx, R`(t, h)`, r.P, { x: 0, y: -1 }, [r.shape], { size: 28, gap: 26, fixed: true });

    // the velocity of q at t, to scale (its length is h/(t² + h²) units), tangent to the circle
    const qd = v2((H * H) / RR ** 3, (-H * TS) / RR ** 3);
    const Q = r.Q;
    const tip = toPx(PS, add(q(TS), qd));
    const tgIn = k.in('tg');
    const sq = arrow(ctx, Q, tip, { color: C.accent, lw: 5, head: 16, alpha: tgIn });
    label(ctx, R`q'(t)`, tip, { x: 1, y: 0.35 }, [sq], { size: 30, color: C.accent, alpha: tgIn, gap: 8, fixed: true });
    // the right angle between the radius and the velocity
    if (tgIn > 0.001) {
      const u = q(TS);
      const n = v2(qd.x / Math.hypot(qd.x, qd.y), qd.y / Math.hypot(qd.x, qd.y));
      const s = 0.07;
      const a = toPx(PS, add(q(TS), scale(u, -s)));
      const b = toPx(PS, add(add(q(TS), scale(u, -s)), scale(n, s)));
      const c = toPx(PS, add(q(TS), scale(n, s)));
      ctx.save();
      ctx.globalAlpha *= tgIn;
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
      ctx.restore();
    }

    // the derivative and what it says
    const early = 1 - tw(t, at('alt1'), 0.5);
    formulaBox(ctx, R`q'(t) = \frac{(h^2,\ -ht)}{(t^2+h^2)^{3/2}}`, 70, 290, { size: 40, alpha: k.in('d') * early, title: '微分' });
    tex(ctx, R`\langle q(t),\ q'(t)\rangle = \frac{th^2 - h^2t}{(t^2+h^2)^2} = 0`, 80, 420, { size: 32, alpha: k.in('ip') * early });
    formulaBox(ctx, R`|q'(t)| = \frac{h}{t^2+h^2}`, 90, 620, { size: 40, alpha: k.in('l'), title: '速さ' });

    // alt1: (t, h) moves at speed 1 along the x axis
    const v1 = k.in('v');
    const Pp = r.P;
    const V = toPx(PS, v2(TS + 1, H));
    arrow(ctx, Pp, V, { color: C.x1, lw: 5, head: 18, alpha: v1 });
    tex(ctx, '1', (Pp.x + V.x) / 2, Pp.y - 14, { size: 30, color: C.x1, align: 'center', alpha: v1 * (1 - k.in('perp')) });
    // alt2: the parts of that velocity along the segment and across it
    const u = q(TS);
    const nrm = v2(u.y, -u.x); // perpendicular to the segment, the way q moves
    const along = TS / RR;
    const across = H / RR;
    const pIn = k.in('perp');
    const Aend = toPx(PS, add(v2(TS, H), scale(u, along)));
    const Nend = toPx(PS, add(v2(TS, H), scale(nrm, across)));
    arrow(ctx, Pp, Aend, { color: C.muted, lw: 3, head: 14, alpha: pIn });
    const sN = arrow(ctx, Pp, Nend, { color: C.x2, lw: 5, head: 16, alpha: pIn });
    seg(ctx, Aend, V, { color: C.muted, lw: 1.5, dash: [5, 5], alpha: pIn });
    seg(ctx, Nend, V, { color: C.muted, lw: 1.5, dash: [5, 5], alpha: pIn });
    label(ctx, R`\frac{h}{r}`, Nend, { x: 0.5, y: 1 }, [sN], { size: 30, color: C.x2, alpha: pIn, gap: 6 });
    // the triangle O, (t, 0), (t, h): sides t, h, r — the angle at (t, h) matches
    const rIn = k.in('r') * (1 - tw(t, at('graph'), 0.4));
    const O = toPx(PS, v2(0, 0));
    const F0 = toPx(PS, v2(TS, 0));
    seg(ctx, O, F0, { color: C.x2, lw: 2.5, dash: [6, 6], alpha: rIn });
    seg(ctx, F0, Pp, { color: C.x2, lw: 2.5, dash: [6, 6], alpha: rIn });
    tex(ctx, 'r', (O.x + Pp.x) / 2 - 26, (O.y + Pp.y) / 2 - 4, { size: 32, color: C.x2, alpha: rIn });
    tex(ctx, 'h', F0.x + 10, (F0.y + Pp.y) / 2 + 10, { size: 30, color: C.x2, alpha: rIn });
    tex(ctx, 't', (O.x + F0.x) / 2, O.y + 30, { size: 30, color: C.x2, alpha: rIn });
    tex(ctx, R`r = \sqrt{t^2+h^2}`, 80, 330, { size: 36, alpha: rIn });

    // alt3: the perpendicular part carried to the circle, shrunk by 1/r — it lands on q′(t)
    const sh = inOutCubic(span(t, at('sh'), at('sh') + 1.6));
    const shIn = k.in('sh');
    if (shIn > 0.001) {
      const base = { x: lerp(Pp.x, Q.x, sh), y: lerp(Pp.y, Q.y, sh) };
      const lenPx = lerp(across, across / RR, sh) * PS.k;
      const dir = { x: nrm.x, y: -nrm.y };
      arrow(ctx, base, { x: base.x + dir.x * lenPx, y: base.y + dir.y * lenPx }, { color: C.x2, lw: 5, head: 14, alpha: shIn });
    }
    tex(ctx, R`\frac{h}{r}\times\frac{1}{r} = \frac{h}{r^2}`, 80, 420, { size: 36, alpha: k.in('sh', 1) });
    tex(ctx, R`= \frac{h}{t^2+h^2} = |q'(t)|`, 100, 500, { size: 36, alpha: k.in('res') });

    // graph: the speed against t, under the line; the value at this t
    const gIn = k.in('g');
    drawGraph(ctx, { alpha: gIn });
    const gp = { x: tx(TS), y: gy(f(TS)) };
    seg(ctx, Pp, gp, { color: C.muted, lw: 1.5, dash: [4, 6], alpha: gIn });
    dot(ctx, gp, { r: 7, color: C.accent, alpha: gIn });
    tex(ctx, R`\frac{1}{h}`, tx(0) - 46, gy(f(0)) + 20, { size: 28, color: C.ink2, alpha: k.in('g', 1) });
    seg(ctx, { x: tx(0) - 8, y: gy(f(0)) }, { x: tx(0) + 8, y: gy(f(0)) }, { color: C.ink2, lw: 2, alpha: k.in('g', 1) });
  },
});
