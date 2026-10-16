// What a scene gets with the time (docs/stage.md): the time, the timeline and the pace, what prepare laid out,
// and the few ways of timing that every clip writes. All of them are pure functions of t.
//   f.t, f.at(name), f.pace, f.cue (pace.cue), f.lead (cue.lead), f.s (prepare's), f.duration, f.answer(id)
//   f.pop(name, dur = pace.enter, ease)  0 → 1 as the voice reaches name (it starts cue.lead before)
//   f.tw(time, dur, ease)                0 → 1 from a time
//   f.seg(a, b)                          0 → 1 between two times, straight
//   f.span(a, b, rise = 0.2, fall = 0.3) 0 → 1 → 0: on from a, off from b
//   f.enter(time, i = 0, ease)           the i-th of a row coming in at time (kit's enter: pace.stagger apart)
//   f.lit(names, until)                  how lit each of the targets the voice names is (kit's focus) — until
//                                        (a name or a time) is when the last lets go
//   f.measure(font, s)                   a text's width (kit's measure)
//   f.ctx                                the stage's context, for layout that measures text (a lib's layout
//                                        function); a scene never draws with it
// A time can be a number or a name of the timeline.

import { tw, seg } from '../kit/ease.js';
import { enter, focus } from '../kit/cue.js';
import { measure } from '../kit/draw.js';

export function frame(t, at, st, s, duration, ctx) {
  const pace = st.pace;
  const cue = pace.cue;
  const time = (x) => (typeof x === 'string' ? at(x) : x);
  return {
    t,
    at,
    pace,
    cue,
    lead: cue.lead,
    s,
    duration,
    answer: (id) => st.answer(id),
    pop: (name, dur = pace.enter, ease) => tw(t, at(name) - cue.lead, dur, ease),
    tw: (x, dur, ease) => tw(t, time(x), dur, ease),
    seg: (a, b) => seg(t, time(a), time(b)),
    span: (a, b, rise = 0.2, fall = 0.3) => {
      const a0 = time(a);
      const b0 = time(b);
      return seg(t, a0, a0 + rise) * (1 - seg(t, b0, b0 + fall));
    },
    enter: (x, i = 0, ease) => enter(t, time(x), pace, i, ease),
    lit: (names, until) => focus(t, names.map(at), time(until) - cue.fall, cue).level,
    measure: (font, str, ls = 0) => measure(ctx, font, str, ls),
    ctx,
  };
}
