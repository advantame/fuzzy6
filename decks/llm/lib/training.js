// The three stages of training a chatbot's LLM, as a strip along the top of the chapter 4 clips
// about training (4-1, 4-3, 4-4): pre-training, learning from examples, polishing by
// preference. The stage a clip is about is filled in ink, as in chapter 3's strip
// (lib/inside.js). Every function draws one frame and keeps no state.

import { clamp } from '../../../src/kit/ease.js';
import { text, measure, rr, line, arrowHead } from '../../../src/kit/draw.js';
import { C, F, M } from './theme.js';

export const TRAINING = ['事前学習', '手本で学ぶ', '好みで磨く'];
const TITLE = 'チャットボットの LLM ができるまで（InstructGPT などの流れ）';
const S = { y: 34, h: 40, font: F.jp(700, 17), padX: 16, gap: 34 };

// o: { alpha, lit: [indices to fill in ink] }
export function trainingStrip(ctx, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const lit = new Set(o.lit ?? []);
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  text(ctx, TITLE, M.l, S.y - 14, { font: F.jp(500, 15), color: C.muted });
  let x = M.l;
  const mid = S.y + S.h / 2;
  TRAINING.forEach((s, i) => {
    const w = measure(ctx, S.font, s) + S.padX * 2;
    rr(ctx, x, S.y, w, S.h, 10);
    ctx.fillStyle = lit.has(i) ? C.ink : '#fff';
    ctx.fill();
    if (!lit.has(i)) {
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    text(ctx, s, x + w / 2, mid + 1, { font: S.font, color: lit.has(i) ? C.paper : C.ink2, align: 'center', base: 'middle' });
    x += w;
    if (i < TRAINING.length - 1) {
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      ctx.lineWidth = 2;
      line(ctx, x + 5, mid, x + S.gap - 7, mid);
      arrowHead(ctx, x + S.gap - 4, mid, 0, 9);
      x += S.gap;
    }
  });
  ctx.restore();
}
