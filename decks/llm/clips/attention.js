// Attention: the same word "かける" means different things next to 電話, 眼鏡 and 橋. Each
// かける looks at the other words (arcs, thicker = more), takes in what it finds, and comes
// out meaning something different. Shown word by word; the weights are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { chip, chipWidth, example } from '../lib/parts.js';
import { text, rr, quadPoints, path, arrow } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, lerp } from '../../../src/kit/ease.js';

const ROWS = [
  { obj: '電話', means: '発信する', tint: '#cfe2ff', w: [0.74, 0.16] },
  { obj: '眼鏡', means: '身につける', tint: '#cdebd5', w: [0.78, 0.12] },
  { obj: '橋', means: '架け渡す', tint: '#ddd5ff', w: [0.71, 0.19] },
];
const FONT = F.jp(500, 44);
const H = 72;
const TOP = 274;
const STEP = 206;
const ARCS = 5.6;
const MEAN = 8.2;
const BOX_X = 1080;

export default clip({
  id: 'attention',
  title: '周りを見て決める',
  kicker: 'アテンション（注意）',
  duration: 16.5,
  cues: [
    { at: 0.4, to: 5.4, text: '同じ「かける」でも、意味は周りの語で決まる。' },
    { at: 5.6, to: 10.8, text: '**アテンション**は、各トークンが文中のどのトークンを\nどれだけ参考にするかを計算する。' },
    { at: 11.0, to: 18, text: '参考にした語の情報を取り込んで、\nトークンの表す意味が、文脈に合わせて変わる。' },
  ],

  prepare(ctx) {
    const rows = ROWS.map((r) => {
      const words = [r.obj, 'を', 'かける'];
      let x = M.l + 40;
      const pos = words.map((s) => {
        const w = chipWidth(ctx, s, { font: FONT, padX: 20 });
        const out = { s, x, w, c: x + w / 2 };
        x += w + 16;
        return out;
      });
      return { ...r, pos };
    });
    return { rows };
  },

  draw(ctx, t, { rows }) {
    example(ctx, M.l, 818, tw(t, 0.6, 0.5), '語の単位で示した例。線の太さは参考にする度合い');

    rows.forEach((r, i) => {
      const y = TOP + i * STEP;
      const pop = tw(t, 0.5 + i * 0.35, 0.6, (p) => outBack(p, 1.6));
      if (pop <= 0) return;
      const [obj, wo, kakeru] = r.pos;

      // arcs from かける to the words it looks at
      const arcs = tw(t, ARCS + i * 0.35, 0.9, inOutCubic);
      if (arcs > 0) {
        [obj, wo].forEach((target, k) => {
          const weight = r.w[k];
          const x0 = kakeru.c;
          const x1 = target.c;
          const h = 40 + Math.abs(x1 - x0) * 0.26;
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 2 + weight * 16;
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.35 + weight * 0.65;
          path(ctx, quadPoints(x0, y - 4, (x0 + x1) / 2, y - 4 - h * 2, x1, y - 4, 36), arcs);
          ctx.globalAlpha = 1;
          ctx.lineCap = 'butt';
        });
      }

      // the meaning taken in: かける takes on its row's colour
      const took = tw(t, MEAN + 1.4 + i * 0.25, 0.7);
      chip(ctx, obj.x, y, obj.s, { font: FONT, h: H, padX: 20, fill: C.panel, alpha: Math.min(1, pop) });
      chip(ctx, wo.x, y, wo.s, { font: FONT, h: H, padX: 20, fill: C.panel, alpha: Math.min(1, pop) });
      const same = tw(t, 2.2, 0.5) * (1 - took);
      chip(ctx, kakeru.x, y, kakeru.s, {
        font: FONT, h: H, padX: 20, alpha: Math.min(1, pop),
        fill: took > 0.5 ? r.tint : C.paper, stroke: same > 0.05 ? C.accent : took > 0.5 ? null : C.ink, lw: 3,
      });

      // → what it means here
      const m = tw(t, MEAN + i * 0.35, 0.6);
      if (m > 0) {
        ctx.strokeStyle = C.ink;
        ctx.fillStyle = C.ink;
        ctx.lineWidth = 3;
        arrow(ctx, kakeru.x + kakeru.w + 28, y + H / 2, BOX_X - 24, y + H / 2, inOutCubic(m), 14);
        const bw = W - M.r - BOX_X;
        ctx.save();
        ctx.globalAlpha = m;
        rr(ctx, BOX_X + lerp(20, 0, m), y - 6, bw, H + 12, 14);
        ctx.fillStyle = took > 0.5 ? r.tint : C.panel;
        ctx.fill();
        ctx.restore();
        text(ctx, '「かける」の意味', BOX_X + 26, y + 26, { font: F.jp(500, 18), color: C.muted, alpha: m });
        text(ctx, r.means, BOX_X + 26, y + 64, { font: F.jp(700, 34), color: C.ink, alpha: m });
      }
    });

    // the three are the same word at the start
    const s = tw(t, 2.2, 0.5) * (1 - seg(t, ARCS - 0.4, ARCS));
    if (s > 0) {
      const x = rows[0].pos[2].c;
      text(ctx, 'どれも同じ「かける」', x, TOP - 98, { font: F.jp(700, 24), color: C.accent, align: 'center', alpha: s });
    }
  },
});
