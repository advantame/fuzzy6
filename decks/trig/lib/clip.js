// Every clip of this deck is a canvas on squared paper. clip({ …meta, prepare, draw }) builds
// the spec §6 object: prepare(ctx, stage) runs once for layout that does not depend on time,
// draw(ctx, t, s, k) paints one frame from scratch (s = what prepare returned).
//
// k.at('name') is a time of the narration's timeline and k.pace the shared pace. Both can
// change while the clip is on screen, so draw reads them every frame. k.answer('q1') is the
// state of a question at the time drawn (spec §5.4): { choice, result, waiting }.

import { C, W, H, SQ } from './theme.js';

export function clip({ prepare, draw, ...meta }) {
  return {
    ...meta,
    setup(stage) {
      const { ctx } = stage.canvas({ alpha: false });
      const s = prepare ? prepare(ctx, stage) : {};
      const k = {
        at: (name) => stage.at(name),
        answer: (id) => stage.answer(id),
        get pace() {
          return stage.pace;
        },
        get duration() {
          return stage.duration;
        },
      };
      return {
        render(t) {
          paper(ctx);
          ctx.save();
          draw(ctx, t, s, k);
          ctx.restore();
        },
      };
    },
  };
}

// Squared paper: the stage itself is the sheet the clips draw and measure on.
export function paper(ctx) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 1;
  for (let x = SQ, i = 1; x < W; x += SQ, i++) {
    ctx.strokeStyle = i % 5 ? C.grid : C.gridBold;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = SQ, i = 1; y < H; y += SQ, i++) {
    ctx.strokeStyle = i % 5 ? C.grid : C.gridBold;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
}
