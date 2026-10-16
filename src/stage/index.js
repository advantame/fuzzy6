// A retained clip (docs/stage.md): its scene says, for a time t, what nodes the world holds and how they look;
// the stage paints them. stage(def) returns a clip as spec §6 has it, so the engine needs nothing new for it
// beyond stage.timeline(clip) (spec §6.2), which a clip that starts from another clip's last picture uses.
//
//   export default stage({
//     id, title, script, join, bridge, …,      // spec §6
//     from: otherClip | (w, f) => { … },        // optional: start from that clip's last picture, or from a world
//                                               // built here; the bridge then moves one into the other
//     background(ctx) { … },                    // optional: painted under the world every frame
//     prepare(ctx, stage) { return s; },        // optional: layout that does not depend on time
//     scene(w, f) { … },                        // the world at f.t: w starts as a copy of `from`'s, or empty
//   });

import { World } from './world.js';
import { blend } from './blend.js';
import { paint, inspect } from './paint.js';
import { frame } from './frame.js';
import { seg, inOutCubic } from '../kit/ease.js';

const RETAINED = Symbol('retained');

export function stage(def) {
  const { from, background, prepare, scene, ...meta } = def;
  if (typeof scene !== 'function') throw new Error(`stage: ${def.id} has no scene`);
  const clip = {
    ...meta,
    setup(st) {
      const { ctx } = st.canvas({ alpha: false });
      const run = runner(clip, ctx, st, { at: st.at, duration: () => st.duration });
      let last = null;
      // tools read where everything is from the layer's element (docs/stage.md「調べる」)
      st.el.mxInspect = () => (last ? inspect(last.w, last.done) : []);
      return {
        render(t) {
          background?.(ctx);
          const w = run.world(t);
          ctx.save();
          last = { w, done: paint(ctx, w, t) };
          ctx.restore();
        },
        // where every node is, as last painted (tools read it from the layer: docs/stage.md)
        inspect: () => (last ? inspect(last.w, last.done) : []),
      };
    },
  };
  clip[RETAINED] = { def };
  return clip;
}

export const isRetained = (clip) => !!clip?.[RETAINED];

// What builds a clip's world at a time: its prepare (once), the world it starts from, its scene.
// tl: { at(name), duration() } of that clip.
function runner(clip, ctx, st, tl) {
  const { def } = clip[RETAINED];
  const s = def.prepare ? def.prepare(ctx, st) : {};
  const head = () => (def.script?.length ? tl.at(def.script[0].id) : (def.bridge ?? 0));
  // the world it starts from, rebuilt when the pace (and so the timelines) changes
  let start = null;
  let startPace = null;
  const begin = () => {
    if (!def.from) return null;
    if (start && startPace === st.pace) return start;
    if (isRetained(def.from)) {
      if (!st.timeline) throw new Error(`stage: ${def.id} starts from ${def.from.id}, and the engine gives no stage.timeline`);
      const other = st.timeline(def.from);
      const prev = runner(def.from, ctx, st, { at: other.at, duration: () => other.duration });
      start = prev.world(other.duration);
    } else {
      start = new World();
      def.from(start, frame(0, tl.at, st, s, tl.duration(), ctx));
    }
    startPace = st.pace;
    return start;
  };
  return {
    world(t) {
      const base = begin();
      const w = base ? base.clone() : new World();
      def.scene(w, frame(t, tl.at, st, s, tl.duration(), ctx));
      const h = head();
      if (base && t < h) return blend(base, w, inOutCubic(seg(t, 0, h)));
      return w;
    },
  };
}
