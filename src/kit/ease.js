// Timing helpers for clips drawn as pure functions of time (spec §6.1).
// seg(t, a, b) is the workhorse: 0 before a, 1 after b, linear in between.

export const TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, p) => a + (b - a) * p;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const seg = (t, a, b) => (b <= a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a)));

export const smooth = (p) => p * p * (3 - 2 * p);
export const inCubic = (p) => p * p * p;
export const outCubic = (p) => 1 - Math.pow(1 - p, 3);
export const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const outQuart = (p) => 1 - Math.pow(1 - p, 4);
export const outExpo = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const inOutExpo = (p) =>
  p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2;
export const outBack = (p, s = 1.6) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);

// Eased progress between two times: tw(t, 1.2, 0.6) runs from 1.2 s for 0.6 s.
export const tw = (t, at, dur, ease = outExpo) => ease(seg(t, at, at + dur));

// A value that steps through keyframes [[time, value], …] with easing between them.
export function keys(t, frames, ease = inOutCubic) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i];
    if (t < t1) {
      const [t0, v0] = frames[i - 1];
      return lerp(v0, v1, ease(seg(t, t0, t1)));
    }
  }
  return frames[frames.length - 1][1];
}

// Envelope that rises at `at` and falls at `to`: 0 → 1 → 0, eased both ways.
export const window_ = (t, at, to, rise = 0.4, fall = 0.3) =>
  outCubic(seg(t, at, at + rise)) * (1 - inCubic(seg(t, to - fall, to)));
