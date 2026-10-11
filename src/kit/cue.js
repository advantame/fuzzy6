// Emphasis and entrances timed by the shared pace (spec §5.1). A clip with a narration script
// shows what a sentence needs up front, then points at things as the voice reaches them:
// focus() says how strongly each target is lit, dimmed() and lifted() turn that into alpha
// and scale. Everything is a pure function of t, the anchor times and the pace.
//
// Lift (scale) is for labels and marks. Do not lift a shape whose size is the quantity being
// explained (a vector, a bar, a radius): it reads as the value changing. Ring or dim instead.

import { clamp, lerp, seg, outCubic, inOutCubic, outExpo } from './ease.js';

// Entrance of the i-th of a row of elements that belong to the ground of a sentence.
// Returns eased progress 0–1.
export const enter = (t, at, pace, i = 0, ease = outExpo) =>
  ease(seg(t, at + i * pace.stagger, at + i * pace.stagger + pace.enter));

// focus(t, times, until, cue) → { level, any }
//   times  when the voice reaches each target (seconds, ascending) — stage.at('anchor')
//   until  when the last target lets go (usually the end of the sentence's voice)
//   cue    stage.pace.cue
// Target k lights up cue.lead before its time. With cue.stay 'next' it keeps the light until
// the next target takes over; with 'phrase' it lets go after cue.span seconds. level[k] is
// 0–1 for each target; any is how much anything is lit (for dimming the rest).
export function focus(t, times, until, cue) {
  const level = times.map((at, k) => {
    const on = at - cue.lead;
    const next = Math.max(on, k < times.length - 1 ? times[k + 1] - cue.lead : until);
    const off = cue.stay === 'phrase' ? Math.min(on + cue.span, next) : next;
    return outCubic(seg(t, on, on + cue.rise)) * (1 - inOutCubic(seg(t, off, off + cue.fall)));
  });
  const any = 1 - level.reduce((rest, l) => rest * (1 - l), 1);
  return { level, any };
}

// Alpha of an element while the light is on something: 1 if nothing is lit or it is the lit
// one, cue.dim if another target has the light.
export const dimmed = (self, any, cue) => lerp(1, cue.dim, clamp(any - self));

// Scale of a lit label or mark.
export const lifted = (level, cue) => 1 + (cue.scale - 1) * level;

// A rounded frame drawn around a lit region — the way to point at a quantity without
// changing its size. The frame closes in slightly as it appears.
export function ring(ctx, x, y, w, h, level, color, r = 12) {
  if (level <= 0.001) return;
  const pad = 6 + 8 * (1 - level);
  ctx.save();
  ctx.globalAlpha *= clamp(level);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - pad, y - pad, w + pad * 2, h + pad * 2, r + pad / 2);
  ctx.stroke();
  ctx.restore();
}
