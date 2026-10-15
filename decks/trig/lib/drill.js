// What the exercises (1-4 to 1-6, 1-10) share: めたん's sheet kept small in the top right
// corner, the tab that numbers the problem, the "example" tag, and lines of working that come
// in one by one.

import { clamp } from '../../../src/kit/ease.js';
import { rr, text } from '../../../src/kit/draw.js';
import { C, F } from './theme.js';
import { memo, MEMO_CORNER, drillTag } from './board.js';
import { math } from './math.js';

// The sheet in the corner, as 1-3 leaves it. lit: 's' | 'c' | 't' rings that panel.
export function cornerMemo(ctx, o = {}) {
  memo(ctx, { ...MEMO_CORNER, write: [1, 1, 1], frame: 1, alpha: o.alpha ?? 1, lit: o.lit ?? null });
}

// The tab: 「演習」 from 1-3 turning into 「演習 n」 as the clip begins (p), faded by a.
export function tab(ctx, n, p = 1, a = 1) {
  drillTag(ctx, '演習', (1 - clamp(p)) * a);
  drillTag(ctx, `演習 ${n}`, clamp(p) * a);
}

// 「例」: the scene and its numbers are made up for the problem.
export function example(ctx, x, y, a = 1, note = '場面と数値は例') {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, y, 40, 32, 8);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, '例', x + 20, y + 23, { font: F.jp(700, 18), color: C.muted, align: 'center' });
  text(ctx, note, x + 52, y + 23, { font: F.jp(400, 18), color: C.muted });
  ctx.restore();
}

// A line of working: a formula that fades in and rises a little as it comes. Returns what
// math() returns (its rect and tagged parts), also before it shows.
export function workLine(ctx, node, x, y, a, o = {}) {
  return math(ctx, node, x, y + (1 - clamp(a)) * 10, { size: o.size ?? 42, alpha: clamp(a), color: o.color, align: o.align });
}
