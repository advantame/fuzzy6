// 2-1: proof 1 begins. A, B, C counterclockwise and not on one line; the edge vectors
// u = B − A, v = C − B, w = A − C. Their sum: each corner comes once with plus and once with
// minus, so u + v + w = 0 — the arrows chain from A back to A. Drawn from the origin and divided
// by their lengths, the three directions are three points of the unit circle; the proof studies
// the arcs between them.

import { clip } from '../lib/clip.js';
import { C, CORNER } from '../lib/theme.js';
import { seg as span, tw, inOutCubic, lerp } from '../../../src/kit/ease.js';
import { ringBox } from '../../../src/kit/cue.js';
import { toPx, v2, arrow, dot, arc, scale } from '../lib/geo.js';
import { tex, formulaBox, strike } from '../lib/math.js';
import { T, PT, PC, EDGE, DIR, edgeArrows, cornerNames, dirCircle, turnOnCircle } from '../lib/proof1.js';

const R = String.raw;
const say = (s, y) => `[${s}|${y}]`;
const script = [
  { id: 'pts', label: '三点', text: `証明 1 を始めるわ。\n{abc}${say('A', 'エー')}、${say('B', 'ビー')}、${say('C', 'シー')} を、反時計回りに並ぶ、一直線上にない三点とするの。` },
  {
    id: 'def',
    label: '辺ベクトル',
    text: `[辺|ヘン]ベクトルを、{u}${say('u ＝ B − A', 'ユー、イコール、ビーマイナスエー')}、{v}${say('v ＝ C − B', 'ブイ、イコール、シーマイナスビー')}、\n{w}${say('w ＝ A − C', 'ダブリュー、イコール、エーマイナスシー')} と定める。`,
  },
  { id: 'cancel', label: '打ち消しあう', text: `三つを足すと、{c}${say('A', 'エー')}、${say('B', 'ビー')}、${say('C', 'シー')} がそれぞれ、\nプラスとマイナスで一回ずつ出て、{gone}打ち消しあうわ。` },
  { id: 'zero', label: 'u + v + w = 0', text: `{z}だから、${say('u ＋ v ＋ w ＝ 0', 'ユータスブイタスダブリュー、イコール、ゼロ')} よ。` },
  { id: 'chain', by: 'zunda', label: 'A に戻る', text: `図では、{cu}${say('u', 'ユー')} の終点から ${say('v', 'ブイ')} が、{cv}${say('v', 'ブイ')} の終点から ${say('w', 'ダブリュー')} が出て、\n{cw}${say('A', 'エー')} に戻ってくるのだ。` },
  { id: 'move', lead: 1.4, label: '原点から', text: '三つを原点から描き直して、{norm}長さで割る。\n{pts3}三つの向きは、単位円の上の三点になるわ。' },
  { id: 'study', label: '三点のあいだ', text: '{arcs}この証明では、この三点のあいだの弧を調べていくの。' },
];

const FX = 130; // the formulas' left edge
const START = { u: 'A', v: 'B', w: 'C' };

export default clip({
  id: 'edges',
  title: '辺ベクトル',
  kicker: '証明 1',
  script,

  draw(ctx, t, _, k) {
    const { at } = k;

    // pts: the three corners, named in counterclockwise order
    const corners = ['A', 'B', 'C'].map((key, i) => {
      const p = toPx(PT, T[key]);
      dot(ctx, p, { r: 7, alpha: k.in('abc', i) });
      return p;
    });
    const cen = { x: (corners[0].x + corners[1].x + corners[2].x) / 3, y: (corners[0].y + corners[1].y + corners[2].y) / 3 };
    arc(ctx, cen, 44, -0.6, 3.6, { color: C.muted, lw: 3, head: 14, alpha: k.in('abc', 3) * (1 - tw(t, at('def'), 0.4)) });

    // def: the edges as vectors
    const ea = edgeArrows(ctx, { alpha: { u: k.in('u'), v: k.in('v'), w: k.in('w') } });
    cornerNames(ctx, ea.shapes, { alpha: k.in('abc') });
    const defs = tex(ctx, R`\el{u}{u = B - A,}\quad \el{v}{v = C - B,}\quad \el{w}{w = A - C}`, FX, 720, {
      size: 44,
      alphas: { u: k.in('u'), v: k.in('v'), w: k.in('w') },
    });

    // cancel: the sum, each corner with plus and minus
    const cIn = k.in('c');
    const sum = tex(
      ctx,
      R`u+v+w = (\el{b1}{B} - \el{a1}{A}) + (\el{c1}{C} - \el{b2}{B}) + (\el{a2}{A} - \el{c2}{C})\el{eq}{\ = 0}`,
      FX,
      820,
      { size: 44, alpha: cIn, alphas: { eq: k.in('z') }, colors: { a1: CORNER.A, a2: CORNER.A, b1: CORNER.B, b2: CORNER.B, c1: CORNER.C, c2: CORNER.C } },
    );
    const gone = (i) => tw(t, at('gone') - 0.3 + i * 0.25, 0.35);
    [['a1', 'a2'], ['b1', 'b2'], ['c1', 'c2']].forEach((pair, i) => {
      for (const id of pair) {
        const b = sum.parts[id];
        if (b) strike(ctx, { x: b.x - 4, y: b.y - 6, w: b.w + 14, h: b.h + 8 }, gone(i), { color: C.accent, lw: 3 });
      }
    });
    const z = k.lit(['z'], 'zero.end').level[0];
    ringBox(ctx, sum.parts.eq, z, C.accent, 6);
    void defs;

    // chain: the arrows one after another, from A back to A
    const ch = k.lit(['cu', 'cv', 'cw'], 'chain.end');
    ['u', 'v', 'w'].forEach((key, i) => {
      const lv = ch.level[i];
      if (lv <= 0.001) return;
      const ends = { u: ['A', 'B'], v: ['B', 'C'], w: ['C', 'A'] }[key];
      arrow(ctx, toPx(PT, T[ends[0]]), toPx(PT, T[ends[1]]), { color: C.accent, lw: 7, head: 24, alpha: lv });
    });

    // move: copies of u, v, w carried to the centre of the circle, then divided by their lengths
    const mv = inOutCubic(span(t, at('move'), at('move.voice')));
    const nz = inOutCubic(span(t, at('norm') - 0.1, at('pts3')));
    const C0 = toPx(PC, v2(0, 0));
    const circ = dirCircle(ctx, {
      alpha: k.in('move'),
      dots: { u: k.in('pts3'), v: k.in('pts3', 1), w: k.in('pts3', 2) },
    });
    if (mv > 0.001 && nz < 0.999) {
      for (const key of ['u', 'v', 'w']) {
        const tail0 = toPx(PT, T[START[key]]);
        const tail = { x: lerp(tail0.x, C0.x, mv), y: lerp(tail0.y, C0.y, mv) };
        const full = scale(EDGE[key], PT.k);
        const one = scale(DIR[key], PC.k);
        const d = { x: lerp(full.x, one.x, nz), y: lerp(full.y, one.y, nz) };
        arrow(ctx, tail, { x: tail.x + d.x, y: tail.y - d.y }, { color: C.ink2, lw: 4, head: 18, alpha: Math.min(1, mv * 3) * (1 - tw(t, at('pts3') + 0.4, 0.4)) });
      }
    }

    // study: the arcs between the three points, still unnamed
    for (const i of [1, 2, 3]) turnOnCircle(ctx, i, { alpha: k.in('arcs', i - 1) * 0.55, name: false, r: 1.12 });
    void circ;
  },
});
