// 3-7: γ. γ is the angle between A − C = (−p, −h) and B − C = (L − p, −h). Drawn again from the
// origin, both point down, to the line y = −h. The map (x, y) ↦ (x, −y), the reflection in the
// x axis, keeps inner products and so keeps the angle; reflected, the two are (−p, h) and
// (L − p, h), with directions q(−p) and q(L − p). Since L > 0, −p < L − p and
// γ = θ(−p, L − p). On the circle γ's arc fits exactly between α's and β's.

import { clip } from '../lib/clip.js';
import { C, CORNER } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp } from '../../../src/kit/ease.js';
import { toPx, v2, arrow, seg, dot, label, wedge, arc, dirOf } from '../lib/geo.js';
import { formulaBox } from '../lib/math.js';
import { PS, H, L, P, q, drawPlane, drawLine, drawGraph, area, seenArc, lineStretch } from '../lib/proof2.js';
import { names, drawTri, TRI } from '../lib/tri.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const MP = say('−p', 'マイナスピー');
const LP = say('L − p', 'エルマイナスピー');
const script = [
  { id: 'def', label: 'γ は', text: `{g}${say('C', 'シー')} の角 ${say('γ', 'ガンマ')} は、{v1}${say('A − C ＝ (−p, −h)', 'エーマイナスシー、イコール、マイナスピー、マイナスエイチ')} と、\n{v2}${say('B − C ＝ (L − p, −h)', 'ビーマイナスシー、イコール、エルマイナスピー、マイナスエイチ')} のなす角よ。` },
  { id: 'move', label: '原点から', text: '{mv}二つを原点から描き直すと、どちらも下を向いているわ。' },
  { id: 'refl', label: '折り返し', text: `{s}${say('(x, y)', 'エックスワイ')} を ${say('(x, −y)', 'エックス、マイナスワイ')} に移す写像は、${say('x', 'エックス')} 軸についての折り返し。\n{keep}内積を変えないから、なす角も変えないわ。` },
  { id: 'up', label: '上へ', text: `{f}折り返すと、${say('(−p, h)', 'マイナスピー、エイチ')} と ${say('(L − p, h)', 'エルマイナスピー、エイチ')}。\n{qq}向きは、${say('q(−p)', 'キュー、マイナスピー')} と ${say('q(L − p)', 'キュー、エルマイナスピー')} になるの。` },
  { id: 'order', label: '−p < L − p', text: `{o}${say('L', 'エル')} は[正|セイ]だから、${MP} は ${LP} より小さい。` },
  { id: 'integ', label: 'γ = θ(−p, L − p)', text: `{th}${say('γ ＝ θ(−p, L − p)', 'ガンマ、イコール、シータ、マイナスピー、エルマイナスピー')} で、${MP} から ${LP} までの積分よ。` },
  { id: 'fit', by: 'zunda', label: 'すき間なく', text: `単位円の上では、{ft}${say('γ', 'ガンマ')} の弧が、${say('α', 'アルファ')} の弧と ${say('β', 'ベータ')} の弧のあいだに、\nすき間なくはまるのだ！` },
];

const PURPLE_AREA = '#e2cdf7';
const BLUE_AREA = '#c4d3ff';
const GREEN_AREA = '#bfe6cf';

export default clip({
  id: 'gamma',
  title: 'γ',
  kicker: '証明 2',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;
    const O = toPx(PS, v2(0, 0));
    drawPlane(ctx, { alpha: 1 });
    drawLine(ctx, { alpha: 1 });
    drawTri(ctx, PS, TRI, { alpha: 0.5, lw: 3 });
    names(ctx, PS, TRI, { alpha: 0.8, size: 32 });

    // the line y = −h, while the two vectors point at it
    const below = k.in('mv') * (1 - tw(t, at('f'), 0.5));
    seg(ctx, toPx(PS, v2(-4.4, -H)), toPx(PS, v2(4.4, -H)), { color: C.ink2, lw: 2, dash: [8, 7], alpha: below * 0.8 });

    // def, move, refl: from C, to the origin, then turned over the x axis
    const mv = inOutCubic(span(t, at('mv'), at('mv') + 1.3));
    const fl = lerp(1, -1, inOutCubic(span(t, at('s') + 0.2, at('keep'))));
    const Cp = toPx(PS, v2(P, H));
    const base = { x: lerp(Cp.x, O.x, mv), y: lerp(Cp.y, O.y, mv) };
    const dA = v2(-P, -H * fl);
    const dB = v2(L - P, -H * fl);
    const keepIn = 1 - tw(t, at('th'), 0.5);
    const gIn = k.in('g') * keepIn;
    const a0 = dirOf(dA);
    let a1 = dirOf(dB);
    const sweep = ((a1 - a0 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    a1 = a0 + sweep;
    if (Math.abs(fl) > 0.05) {
      wedge(ctx, base, 50, a0, a1, { color: '#ecdffa', alpha: gIn });
      const ga = arc(ctx, base, 50, a0, a1, { color: CORNER.C, lw: 3, alpha: gIn });
      label(ctx, R`\gamma`, base, { x: Math.cos((a0 + a1) / 2), y: -Math.sin((a0 + a1) / 2) }, [ga], { size: 32, color: CORNER.C, alpha: gIn, from: 50, gap: 4, fixed: true });
    }
    const toPxFrom = (b, d) => ({ x: b.x + d.x * PS.k, y: b.y - d.y * PS.k });
    arrow(ctx, base, toPxFrom(base, dA), { color: CORNER.C, lw: 5, alpha: k.in('v1') * keepIn });
    arrow(ctx, base, toPxFrom(base, dB), { color: CORNER.C, lw: 5, alpha: k.in('v2') * keepIn });
    formulaBox(ctx, R`S(x, y) = (x, -y):\quad \langle Sx', Sy'\rangle = \langle x', y'\rangle`, 70, 105, { size: 32, alpha: k.in('keep') * (1 - tw(t, at('th'), 0.4)), title: 'x 軸についての折り返し' });

    // up: the reflected pair ends on y = h at −p and L − p; their directions on the circle
    const qIn = k.in('qq');
    for (const x of [-P, L - P]) {
      dot(ctx, toPx(PS, v2(x, H)), { r: 7, color: CORNER.C, alpha: k.in('f') });
      dot(ctx, toPx(PS, q(x)), { r: 8, color: CORNER.C, alpha: qIn });
    }
    label(ctx, R`(-p, h)`, toPx(PS, v2(-P, H)), { x: -0.3, y: 1 }, [], { size: 26, color: CORNER.C, alpha: k.in('f') * keepIn, gap: 30 });
    label(ctx, R`(L-p, h)`, toPx(PS, v2(L - P, H)), { x: 0.3, y: 1 }, [], { size: 26, color: CORNER.C, alpha: k.in('f') * keepIn, gap: 30 });

    // integ: the stretch [−p, L − p], its arc and its area
    const show = k.in('th');
    lineStretch(ctx, -P, L - P, { color: CORNER.C, lw: 8, alpha: show });
    seenArc(ctx, -P, L - P, { color: CORNER.C, lw: 9, alpha: show });
    drawGraph(ctx, { alpha: show });
    area(ctx, -P, L - P, { color: PURPLE_AREA, alpha: show });
    formulaBox(ctx, R`\gamma = \theta(-p,\ L-p) = \int_{-p}^{L-p} \frac{h}{t^2+h^2}\,dt`, 70, 105, { size: 32, alpha: show, title: 'γ' });
    formulaBox(ctx, R`L > 0\ \Rightarrow\ -p < L-p`, 900, 105, { size: 32, alpha: k.in('o') });

    // fit: α's and β's stretches beside it — no gap, no overlap
    const fIn = k.in('ft');
    lineStretch(ctx, -Infinity, -P, { color: CORNER.A, lw: 8, alpha: fIn });
    lineStretch(ctx, L - P, Infinity, { color: CORNER.B, lw: 8, alpha: fIn });
    seenArc(ctx, -Infinity, -P, { color: CORNER.A, lw: 9, alpha: fIn });
    seenArc(ctx, L - P, Infinity, { color: CORNER.B, lw: 9, alpha: fIn });
    area(ctx, -Infinity, -P, { color: BLUE_AREA, alpha: fIn });
    area(ctx, L - P, Infinity, { color: GREEN_AREA, alpha: fIn });
  },
});
