// Every clip of this deck is a canvas on the theme's paper. clip({ …meta, prepare, draw })
// builds the spec §6 object: prepare(ctx, stage) runs once for layout that does not depend on
// time, draw(ctx, t, s, k) paints one frame from scratch (s = what prepare returned).
//
// k is for clips with a narration script (spec §6.6): k.at('name') is a time of the timeline
// and k.pace the shared pace. Both can change while the clip is on screen, so draw reads them
// every frame and never keeps a time in a variable outside itself.

import { paper } from './parts.js';

export function clip({ prepare, draw, grid = true, ...meta }) {
  return {
    ...meta,
    setup(stage) {
      const { ctx } = stage.canvas({ alpha: false });
      const s = prepare ? prepare(ctx, stage) : {};
      const k = {
        at: (name) => stage.at(name),
        get pace() {
          return stage.pace;
        },
        get duration() {
          return stage.duration;
        },
      };
      return {
        render(t) {
          paper(ctx, grid);
          ctx.save();
          draw(ctx, t, s, k);
          ctx.restore();
        },
      };
    },
  };
}
