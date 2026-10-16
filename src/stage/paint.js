// Paint a world on a 2D context (docs/stage.md). A group applies its alpha, filter, clip, shift and scale, in
// that order, to what it holds; a leaf calls its kind: kind(ctx, props, a, env). What a kind returns about where
// it drew — a box { x, y, w, h }, or an object that holds boxes (a card's rows) — is kept, with the transform it
// was drawn in, so that a ring drawn later can find it (env.box) and a tool can read where everything is.
//   env: { t (the clip's time), v (the world's vars), box(target), out(id) (what the kind returned) }
//   target: a box, a list of them, 'id' (the box the node's kind returned, or its .box) or 'id:path' (a box
//   inside what it returned, as 'log:rows.2')

import { GROUP } from './world.js';

const isBox = (b) => b && typeof b === 'object' && ['x', 'y', 'w', 'h'].every((k) => typeof b[k] === 'number');
const same = (m, n) => m.s === n.s && m.x === n.x && m.y === n.y;

export function paint(ctx, world, t) {
  const done = new Map();
  let m = { s: 1, x: 0, y: 0 };
  const find = (target) => {
    if (target == null) return null;
    if (Array.isArray(target)) return target.map(find).filter(Boolean);
    if (isBox(target)) return target;
    if (typeof target !== 'string') return null;
    const [id, path] = target.split(':');
    const d = done.get(id);
    if (!d) throw new Error(`stage: ${id} is not drawn before what points at it`);
    let b = d.out;
    if (path) for (const k of path.split('.')) b = b?.[k];
    else if (!isBox(b)) b = b?.box;
    if (!isBox(b)) throw new Error(`stage: ${target} gives no box`);
    // into the transform of what is drawn now
    if (same(d.m, m)) return b;
    const x = (b.x * d.m.s + d.m.x - m.x) / m.s;
    const y = (b.y * d.m.s + d.m.y - m.y) / m.s;
    return { x, y, w: (b.w * d.m.s) / m.s, h: (b.h * d.m.s) / m.s };
  };
  const env = { t, v: world.vars, box: find, out: (id) => done.get(id)?.out };

  const walk = (list) => {
    for (const id of list) {
      const n = world.nodes.get(id);
      if (n.kind !== GROUP) {
        done.set(id, { out: n.kind(ctx, n.p, n.a, env), m });
        continue;
      }
      if (n.a <= 0.001) continue;
      const p = n.p;
      const outer = m;
      ctx.save();
      ctx.globalAlpha *= n.a;
      if (p.filter) ctx.filter = p.filter;
      if (p.clip) {
        ctx.beginPath();
        ctx.rect(p.clip.x, p.clip.y, p.clip.w, p.clip.h);
        ctx.clip();
      }
      if (p.dx || p.dy) {
        ctx.translate(p.dx ?? 0, p.dy ?? 0);
        m = { s: m.s, x: m.x + (p.dx ?? 0) * m.s, y: m.y + (p.dy ?? 0) * m.s };
      }
      if (p.scale !== undefined && p.scale !== 1) {
        const [ox, oy] = p.origin ?? [800, 450];
        ctx.translate(ox, oy);
        ctx.scale(p.scale, p.scale);
        ctx.translate(-ox, -oy);
        m = { s: m.s * p.scale, x: m.x + m.s * ox * (1 - p.scale), y: m.y + m.s * oy * (1 - p.scale) };
      }
      walk(n.kids);
      ctx.restore();
      done.set(id, { out: null, m: outer });
      m = outer;
    }
  };
  walk(world.top);
  return done;
}

// Where everything is, in the stage's coordinates: [{ id, kind, depth, a, box }] in paint order (box is null for
// a node whose kind tells nothing). For tools (the capture's JSON, the overlap check).
export function inspect(world, done) {
  const rows = [];
  for (const { node, depth } of world.walk()) {
    const d = done?.get(node.id);
    let box = null;
    const b = d?.out && (isBox(d.out) ? d.out : isBox(d.out.box) ? d.out.box : null);
    if (b) box = { x: b.x * d.m.s + d.m.x, y: b.y * d.m.s + d.m.y, w: b.w * d.m.s, h: b.h * d.m.s };
    rows.push({ id: node.id, kind: node.kind === GROUP ? 'group' : node.kind.name || 'kind', depth, a: node.a, box });
  }
  return rows;
}
