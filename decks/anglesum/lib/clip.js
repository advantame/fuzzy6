// Every clip of this deck is a canvas on plain paper. clip({ …meta, prepare, draw }) builds the
// spec §6 object: prepare(ctx, stage) runs once for layout that does not depend on time,
// draw(ctx, t, s, k) paints one frame from scratch (s = what prepare returned).
//
// k.at('name') is a time of the narration's timeline and k.pace the shared pace. Both can
// change while the clip is on screen, so draw reads them every frame. k.in(name, i) is the
// usual entrance of the i-th element that comes in with the voice at `name`; k.lit(names,
// until) how strongly each of several things is pointed at, one after another (src/kit/cue.js).

import { C, W, H } from './theme.js';
import { enter, focus } from '../../../src/kit/cue.js';

export function clip({ prepare, draw, ...meta }) {
  return {
    ...meta,
    setup(stage) {
      const { ctx } = stage.canvas({ alpha: false });
      const s = prepare ? prepare(ctx, stage) : {};
      let now = 0;
      const k = {
        at: (name) => stage.at(name),
        get pace() {
          return stage.pace;
        },
        get duration() {
          return stage.duration;
        },
        // the entrance of an element shown as the voice reaches `name` (a little ahead of it)
        in: (name, i = 0) => enter(now, stage.at(name) - stage.pace.cue.lead, stage.pace, i),
        // pointing at targets in turn: names of anchors, lit until `until` (a time name or
        // seconds). k.fade(name) is a time to let go by when the light must be off at `name`
        // (a still at the end of the last sentence: spec §6.8, AGENTS.md).
        lit: (names, until) =>
          focus(now, names.map((n) => stage.at(n)), typeof until === 'number' ? until : stage.at(until), stage.pace.cue),
        fade: (name) => stage.at(name) - stage.pace.cue.fall,
      };
      return {
        render(t) {
          now = t;
          ctx.fillStyle = C.paper;
          ctx.fillRect(0, 0, W, H);
          ctx.save();
          draw(ctx, t, s, k);
          ctx.restore();
        },
      };
    },
  };
}
