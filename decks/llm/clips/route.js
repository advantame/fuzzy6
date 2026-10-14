// 1-3: the way ahead. The eleven chapters as a route, grouped in three parts, under the name
// the chapter has been reading: 言語モデル is done, 大規模 is still open and is handed to the
// history chapter, where the clip ends.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import { text, measure, line, circle, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outExpo, outCubic, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { focus, dimmed } from '../../../src/kit/cue.js';

// [number, name, the anchor of the script that lights it]
const ROUTE = [
  ['1', 'はじめに'],
  ['2', '歴史', 's2'],
  ['3', '基本概念', 's3'],
  ['4', 'チャットボット', 's4'],
  ['5', 'ツール', 's5'],
  ['6', 'つなぐ先', 's5'],
  ['7', 'ハーネス', 's7'],
  ['8', '知識を育てる', 's8'],
  ['9', '計算と値段', 's9'],
  ['10', '鍛えて測る', 's10'],
  ['11', '開いたハーネス', 's10'],
];
// [first, last, name, the anchor that lights it] over the route
const PARTS = [
  [1, 3, 'LLM のしくみ', 'p1'],
  [4, 6, 'エージェント', 'p2'],
  [7, 10, 'いまの話題', 'p3'],
];

const ROUTE_Y = 580;
const SPAN = W - M.l - M.r;
const stationX = (i) => M.l + i * (SPAN / ROUTE.length) + 10;

const JA = ['大規模', '言語モデル'];
const EN = ['Large', 'Language Model'];
const JA_FONT = F.jp(700, 100);
const NAME_Y = 296;
const NAME_GAP = 30;

export default clip({
  id: 'route',
  title: 'この先の道筋',
  kicker: '11 章',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', still: true, text: 'ここで、この先の話の道筋を、ひととおり見ておきましょう。' },
    { id: 'b', text: '{p1}前半では、LLM のしくみを扱うわ。\n{s2}歴史と{s3}基本の考え方から始めて、{s4}チャットボットまで進むの。' },
    { id: 'c', text: '{p2}中ほどでは、LLM に{s5}ツールを持たせて、\n{s7}エージェントを組み立てていくわ。' },
    { id: 'd', still: true, text: '{p3}後半では、いま話題になっていることを取り上げるの。\n{s8}知識の持たせ方、{s9}計算と値段、それから{s10}ハーネスの鍛え方よ。' },
    { id: 'e', text: 'LLM という名前の残り半分、{large}「大規模」が何を意味するのかは、\n{hist}歴史をたどる中で見えてくるわ。' },
    { id: 'f', tail: 0.6, text: '{go}それでは、歴史から始めましょう。\n次の言葉を当てるという考えは、どこから生まれたのかしら。' },
  ],

  prepare(ctx) {
    const w0 = measure(ctx, JA_FONT, JA[0]);
    return { w0, w1: measure(ctx, JA_FONT, JA[1]), x1: M.l + w0 + NAME_GAP };
  },

  draw(ctx, t, { w0, w1, x1 }, { at, pace }) {
    const cue = pace.cue;
    const a = at('a');

    // ——— the name: one half read, one half still open
    const name = tw(t, a + 0.1, 0.8);
    const large = tw(t, at('large') - cue.lead, cue.rise, outCubic);
    text(ctx, EN[0], M.l + 4, NAME_Y - 118, { font: F.cond(700, 44), color: C.muted, alpha: name });
    text(ctx, EN[1], x1 + 4, NAME_Y - 118, { font: F.cond(700, 44), color: C.muted, alpha: name });
    text(ctx, JA[0], M.l, NAME_Y + (1 - name) * 24, { font: JA_FONT, color: C.ink, alpha: name });
    text(ctx, JA[0], M.l, NAME_Y, { font: JA_FONT, color: C.accent, alpha: large });
    text(ctx, JA[1], x1, NAME_Y + (1 - name) * 24, { font: JA_FONT, color: C.ink, alpha: name });
    const under = tw(t, a + 0.5, 0.7, outCubic);
    ctx.fillStyle = C.ink;
    ctx.fillRect(x1, NAME_Y + 24, w1 * under, 6);
    tag(ctx, x1 + w1, NAME_Y + 44, 'ここまでで見た', { font: F.jp(700, 19), h: 36, padX: 14, fill: C.ink, color: C.paper, alpha: under, align: 'right' });
    if (under > 0) {
      ctx.save();
      ctx.strokeStyle = large > 0.5 ? C.accent : C.ink2;
      ctx.lineWidth = 5;
      ctx.setLineDash([14, 10]);
      line(ctx, M.l, NAME_Y + 27, M.l + w0, NAME_Y + 27, under);
      ctx.restore();
    }
    tag(ctx, M.l, NAME_Y + 44, 'これから', { font: F.jp(700, 19), h: 36, padX: 14, fill: '#fff', stroke: C.ink2, color: C.ink2, alpha: under * (1 - large) });
    tag(ctx, M.l, NAME_Y + 44, '歴史の章で', { font: F.jp(700, 19), h: 36, padX: 14, fill: C.accent, color: '#fff', alpha: tw(t, at('hist') - cue.lead, pace.enter) });

    // ——— the route: the ground of the whole clip
    const draw = tw(t, a + 0.2, pace.ground, inOutCubic);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    line(ctx, M.l, ROUTE_Y, W - M.r, ROUTE_Y, draw);
    if (draw > 0.98) {
      ctx.fillStyle = C.ink;
      arrowHead(ctx, W - M.r + 4, ROUTE_Y, 0, 20);
    }

    // sentences b–d light the part and the stations they name, and dim the rest
    const names = ['p1', 's2', 's3', 's4', 'p2', 's5', 's7', 'p3', 's8', 's9', 's10'];
    const ends = { b: ['p1', 's2', 's3', 's4'], c: ['p2', 's5', 's7'], d: ['p3', 's8', 's9', 's10'] };
    const level = {};
    let any = 0;
    for (const [id, list] of Object.entries(ends)) {
      const f = focus(t, list.map((n) => at(n)), at(`${id}.end`) - cue.fall, cue);
      // a part stays lit while its stations are named
      const part = Math.max(...f.level);
      list.forEach((n, i) => (level[n] = i === 0 ? part : f.level[i]));
      any = Math.max(any, f.any);
    }
    names.forEach((n) => (level[n] ??= 0));
    const hist = tw(t, at('hist') - cue.lead, cue.rise, outCubic); // 歴史 keeps its mark to the end
    const go = at('go');

    ROUTE.forEach(([n, label, anchor], i) => {
      const x = stationX(i);
      const on = a + 0.2 + pace.ground * inverseInOut(i / ROUTE.length);
      const pop = tw(t, on, pace.enter, (p) => outBack(p, 2.2));
      if (pop <= 0) return;
      const here = i === 0;
      const lit = Math.max(anchor ? level[anchor] : 0, i === 1 ? hist : 0);
      const vis = here ? 1 : dimmed(lit, any, cue);
      ctx.globalAlpha = vis;
      ctx.fillStyle = here || lit > 0.5 ? C.accent : C.ink;
      circle(ctx, x, ROUTE_Y, (here ? 14 : 10 + 3 * lit) * pop);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (here) {
        const ring = seg((t - (on + 0.6)) % 1.8, 0, 1.2);
        if (t > on + 0.6 && t < go && ring < 1) {
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 1 - ring;
          circle(ctx, x, ROUTE_Y, 14 + 30 * outCubic(ring));
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      const al = tw(t, on + 0.1, 0.6) * vis;
      text(ctx, n, x - 10, ROUTE_Y + 58, { font: F.cond(700, 30), color: C.accent, alpha: al });
      text(ctx, label, x - 10, ROUTE_Y + 92, { font: F.jp(700, 16), color: C.ink, alpha: al });
      if (here) text(ctx, 'いまここ', x - 10, ROUTE_Y - 34, { font: F.jp(700, 17), color: C.accent, alpha: al });
    });

    // the three parts, bracketed below the names
    PARTS.forEach(([i0, i1, label, anchor], k) => {
      const al = tw(t, a + 0.2 + pace.ground + k * pace.stagger, pace.enter);
      if (al <= 0) return;
      const lit = level[anchor];
      const vis = dimmed(lit, any, cue);
      const x0 = stationX(i0) - 10;
      const x1b = stationX(i1) + 96;
      const y = ROUTE_Y + 126;
      ctx.save();
      ctx.globalAlpha = al * vis;
      ctx.fillStyle = lit > 0.5 ? C.accent : C.muted;
      ctx.fillRect(x0, y, (x1b - x0) * outExpo(al), 3);
      ctx.fillRect(x0, y - 10, 3, 10);
      ctx.fillRect(x1b - 3, y - 10, 3, 10);
      ctx.restore();
      text(ctx, label, x0, y + 38, { font: F.jp(700, 24), color: C.ink, alpha: al * vis });
      if (lit > 0) text(ctx, label, x0, y + 38, { font: F.jp(700, 24), color: C.accent, alpha: al * lit });
    });

    // ——— the open half of the name is handed to the history chapter
    if (hist > 0) {
      const x = stationX(1);
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 3;
      const p = tw(t, at('hist') - cue.lead, 0.7, outCubic);
      line(ctx, x, NAME_Y + 96, x, ROUTE_Y - 34, p);
      if (p > 0.9) arrowHead(ctx, x, ROUTE_Y - 20, Math.PI / 2, 14);
    }
    // and the next step is taken
    const step = tw(t, go, 0.8, inOutCubic);
    if (step > 0) {
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 6;
      line(ctx, stationX(0), ROUTE_Y, lerp(stationX(0), stationX(1), step), ROUTE_Y);
      const ring = seg((t - go - 0.8) % 1.8, 0, 1.2);
      if (t > go + 0.8 && ring < 1) {
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 1 - ring;
        circle(ctx, stationX(1), ROUTE_Y, 13 + 30 * outCubic(ring));
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  },
});

// time fraction at which an inOutCubic sweep reaches position u (so stations pop as the
// line passes them)
function inverseInOut(u) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inOutCubic(mid) < u) lo = mid;
    else hi = mid;
  }
  return lo;
}
