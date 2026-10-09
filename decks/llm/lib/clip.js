// Every clip of this deck is a canvas on the theme's paper. clip({ …meta, prepare, draw })
// builds the spec §6 object: prepare(ctx, stage) runs once for layout that does not depend on
// time, draw(ctx, t, s) paints one frame from scratch (s = what prepare returned).

import { paper } from './parts.js';

export function clip({ prepare, draw, grid = true, ...meta }) {
  return {
    ...meta,
    setup(stage) {
      const { ctx } = stage.canvas({ alpha: false });
      const s = prepare ? prepare(ctx, stage) : {};
      return {
        render(t) {
          paper(ctx, grid);
          ctx.save();
          draw(ctx, t, s);
          ctx.restore();
        },
      };
    },
  };
}
