// 2018–2020: GPT → GPT-2 → GPT-3, parameter counts drawn as areas, then the few-shot prompt
// from the GPT-3 paper — examples in the prompt instead of retraining.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { jaNum, source } from '../lib/parts.js';
import { text, typed, rr, line } from '../../../src/kit/draw.js';
import { tw, seg, outExpo, outCubic } from '../../../src/kit/ease.js';

// parameters; squares share one scale (area ∝ count)
const MODELS = [
  { name: 'GPT', year: '2018', n: 117e6, at: 0.6 },
  { name: 'GPT-2', year: '2019', n: 1.5e9, at: 2.4 },
  { name: 'GPT-3', year: '2020', n: 175e9, at: 5.0 },
];
const BIG = 600; // side of GPT-3's square
const BASE = 806; // squares stand on this line
const X = [M.l, M.l + 58, M.l + 182];
const side = (n) => BIG * Math.sqrt(n / MODELS[2].n);
const RIGHT = 920;
const PROMPT = [
  'Translate English to French:',
  'sea otter => loutre de mer',
  'peppermint => menthe poivrée',
  'plush girafe => girafe peluche',
  'cheese =>',
];
const FEW = 10.0;

export default clip({
  id: 'scale',
  title: '2 年で約 1500 倍',
  kicker: '2018–2020 · GPT',
  duration: 16,
  cues: [
    { at: 0.4, to: 4.8, text: '2018 年の GPT は 1 億 1700 万パラメータ。\n2019 年の GPT-2 は 15 億。' },
    { at: 5.0, to: 9.8, text: '2020 年の GPT-3 は **1750 億**。2 年で約 1500 倍になった。' },
    { at: 10.0, to: 17, text: 'GPT-3 は、例をいくつか見せるだけで、\n翻訳などの新しい課題をこなせた。' },
  ],

  draw(ctx, t) {
    MODELS.forEach((m, i) => {
      const grow = tw(t, m.at, i === 2 ? 1.8 : 0.9, outExpo);
      if (grow <= 0) return;
      const s = side(m.n) * grow;
      const x = X[i];
      ctx.fillStyle = i === 2 ? C.ink : C.ink;
      ctx.fillRect(x, BASE - s, s, s);
      const count = jaNum(m.n * Math.min(1, outCubic(seg(t, m.at, m.at + (i === 2 ? 1.6 : 0.8)))));
      const a = tw(t, m.at + 0.1, 0.5);
      if (i < 2) {
        // small squares: labels above, on a leader
        // stacked so the two labels never meet: GPT's sits higher than GPT-2's
        const top = i === 0 ? 470 : 600;
        ctx.strokeStyle = C.ink2;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = a;
        line(ctx, x + 1, BASE - side(m.n) - 8, x + 1, top + 66);
        ctx.globalAlpha = 1;
        text(ctx, m.name, x, top, { font: F.sans(700, 24), color: C.ink, alpha: a });
        text(ctx, m.year, x, top + 26, { font: F.mono(500, 17), color: C.muted, alpha: a });
        text(ctx, count, x, top + 56, { font: F.cond(700, 30), color: C.ink, alpha: a });
      } else {
        // the big one carries its label inside
        const tx = x + 36;
        const ty = BASE - s + 80;
        if (s > 260) {
          text(ctx, 'GPT-3', tx, ty, { font: F.sans(700, 40), color: C.paper, alpha: a });
          text(ctx, '2020', tx, ty + 34, { font: F.mono(500, 20), color: '#a9a39a', alpha: a });
          text(ctx, count, tx, ty + 150, { font: F.cond(700, 116), color: C.paper, alpha: a, ls: -1 });
          text(ctx, 'パラメータ', tx + 4, ty + 194, { font: F.jp(500, 24), color: '#cfc9bd', alpha: a });
        }
      }
    });

    // ×1500
    const r = tw(t, 7.0, 0.8);
    if (r > 0) {
      text(ctx, '×1500', RIGHT, 250 + (1 - r) * 20, { font: F.cond(700, 128), color: C.accent, alpha: r, ls: -2 });
      text(ctx, '2 年でパラメータが約 1500 倍', RIGHT + 6, 300, { font: F.jp(500, 24), color: C.ink2, alpha: r });
    }
    text(ctx, '正方形の面積 = パラメータの数（学習で調整される数）', M.l, BASE + 44, { font: F.jp(400, 19), color: C.muted, alpha: tw(t, 1.2, 0.8) });

    // few-shot prompt from the GPT-3 paper
    const f = tw(t, FEW, 0.6);
    if (f <= 0) return;
    const px = RIGHT;
    const py = 400;
    const pw = W - M.r - px;
    text(ctx, '例を見せて、続きを書かせる', px, py, { font: F.jp(700, 26), color: C.ink, alpha: f });
    ctx.save();
    ctx.globalAlpha = f;
    rr(ctx, px, py + 26, pw, 300, 16);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.restore();
    PROMPT.forEach((s, i) => {
      const at = FEW + 0.4 + i * 0.45;
      const shown = typed(s, seg(t, at, at + 0.4));
      const y = py + 86 + i * 52;
      const font = i === 0 ? F.mono(600, 21) : F.mono(400, 21);
      text(ctx, shown, px + 28, y, { font, color: i === 0 ? C.ink : C.ink2 });
      if (i === PROMPT.length - 1 && t > at + 0.4 && Math.floor(t * 2.5) % 2 === 0) {
        ctx.fillStyle = C.accent;
        ctx.fillRect(px + 28 + 9 * 12.6 + 6, y - 20, 3, 26);
      }
    });
    source(ctx, 'プロンプトは Brown ほか（2020）の図より', tw(t, FEW + 0.5, 0.6));
  },
});
