// A bridge between two worlds (docs/stage.md): the last picture of what a clip starts from, and the clip's own
// world at the same moment. e (0–1, eased) is how far the bridge has gone. A node's bridge policy (its `bridge`
// option, read from the new world) says how it changes:
//   in both worlds: numbers in its props (and in the vars) move from the old value to the new, its alpha too.
//     A prop that cannot move (a string, a flag, a list of another length, another kind of node) swaps it:
//       'seq' (the default)  the old node goes out in the first half, the new comes in in the second
//       'cross'              the two cross at once
//       'cut'                the old one stays until the end, then the new one is there
//       'now'                no swap: what cannot move is the new value at once (numbers still move)
//   only in the new world: it fades in ('cut': at the end; 'now': it is there at once).
//   only in the old world: it fades out where it stood.

import { GROUP } from './world.js';
import { lerp, seg } from '../kit/ease.js';

const SWAP = Symbol('swap');

const plain = (x) => x !== null && typeof x === 'object' && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);

// x and y mixed at e, or SWAP if they cannot be
export function mix(x, y, e) {
  if (x === y) return y;
  if (typeof x === 'number' && typeof y === 'number') return lerp(x, y, e);
  if (Array.isArray(x) && Array.isArray(y)) {
    if (x.length !== y.length) return SWAP;
    const out = [];
    for (let i = 0; i < x.length; i++) {
      const m = mix(x[i], y[i], e);
      if (m === SWAP) return SWAP;
      out.push(m);
    }
    return out;
  }
  if (plain(x) && plain(y)) {
    const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
    const out = {};
    for (const k of keys) {
      if (!(k in x) || !(k in y)) return SWAP;
      const m = mix(x[k], y[k], e);
      if (m === SWAP) return SWAP;
      out[k] = m;
    }
    return out;
  }
  return SWAP;
}

// For 'now' and vars, a discrete value must not prevent neighboring numbers
// inside an object (or a same-length array) from moving.
function mixNow(x, y, e) {
  const m = mix(x, y, e);
  if (m !== SWAP) return m;
  if (Array.isArray(x) && Array.isArray(y) && x.length === y.length)
    return y.map((v, i) => mixNow(x[i], v, e));
  if (plain(x) && plain(y))
    return Object.fromEntries(Object.keys(y).map((k) => [k, k in x ? mixNow(x[k], y[k], e) : y[k]]));
  return y;
}

// props mixed key by key: what cannot move takes the new value, and says so
function mixProps(fp, np, e) {
  const p = {};
  let swap = false;
  for (const k of new Set([...Object.keys(fp), ...Object.keys(np)])) {
    const m = k in fp && k in np ? mix(fp[k], np[k], e) : SWAP;
    if (m === SWAP) swap = true;
    if (k in np) p[k] = m === SWAP ? mixNow(fp[k], np[k], e) : m;
  }
  return { p, swap };
}

// how much of the old and the new node shows while a node swaps
function weights(policy, e) {
  if (policy === 'cross') return [1 - e, e];
  if (policy === 'cut') return e < 1 ? [1, 0] : [0, 1];
  return [1 - seg(e, 0, 0.5), seg(e, 0.5, 1)];
}

export function blend(from, to, e) {
  const out = to.clone();
  for (const k of Object.keys(out.vars)) {
    if (!(k in from.vars)) continue;
    out.vars[k] = mixNow(from.vars[k], to.vars[k], e);
  }

  // A swapped group takes its whole subtree with it. Do not blend or fade its
  // children a second time, or restore an old child into a replacement leaf.
  const oldTaken = new Set();
  const newTaken = new Set();
  const take = (world, id, set) => {
    set.add(id);
    for (const child of world.nodes.get(id).kids ?? []) take(world, child, set);
  };

  // in both, parents before children (insertion order need not be tree order)
  for (const { node } of to.walk()) {
    const id = node.id;
    if (newTaken.has(id) || oldTaken.has(id)) continue;
    const n = out.nodes.get(id);
    const f = from.nodes.get(id);
    if (!f) continue;
    const { p, swap } = mixProps(f.p, n.p, e);
    const kindSwap = f.kind !== n.kind;
    const structureSwap = (n.kind === GROUP) !== (f.kind === GROUP);
    // Existing scenes add clipping/translation to inherited groups as they
    // start moving (session's doc). Preserve that implicit immediate policy;
    // an explicit group policy can request a subtree swap instead.
    const immediate = n.bridge === 'now' || (n.kind === GROUP && n.bridge === undefined);
    if (!structureSwap && (immediate || (!swap && !kindSwap))) {
      n.p = p;
      n.a = lerp(f.a, n.a, e);
      continue;
    }
    take(from, id, oldTaken);
    take(to, id, newTaken);
    if (n.bridge === 'now') {
      n.p = p;
      n.a = lerp(f.a, n.a, e);
      continue;
    }
    const [wo, wi] = weights(n.bridge, e);
    n.a *= wi;
    const ghost = copyGhost(from, out, id, n.parent);
    ghost.a *= wo;
    const list = n.parent === null ? out.top : out.nodes.get(n.parent).kids;
    list.splice(list.indexOf(id), 0, ghost.id);
  }

  // only in the new world: the topmost of each such part fades in
  for (const [id, n] of out.nodes) {
    if (newTaken.has(id) || id.endsWith('~')) continue;
    if (from.nodes.has(id) && !oldTaken.has(id)) continue;
    if (n.parent !== null && !from.nodes.has(n.parent)) continue;
    if (n.bridge === 'now') continue;
    n.a *= n.bridge === 'cut' ? (e < 1 ? 0 : 1) : e;
  }

  // only in the old world: put back where it stood (after the nearest earlier sibling still there), fading out
  const lists = [[null, from.top]];
  for (const [id, f] of from.nodes) if (f.kids) lists.push([id, f.kids]);
  for (const [parent, kids] of lists) {
    if (parent !== null && (oldTaken.has(parent) || !out.nodes.get(parent)?.kids)) continue;
    const list = parent === null ? out.top : out.nodes.get(parent).kids;
    let after = null;
    for (const id of kids) {
      if (oldTaken.has(id)) {
        if (out.nodes.get(id)?.parent === parent) after = id;
        continue;
      }
      if (out.nodes.has(id)) {
        if (out.nodes.get(id).parent === parent) after = id;
        continue;
      }
      const at = after === null ? 0 : list.indexOf(after) + 1;
      list.splice(at, 0, id);
      copyOld(from, out, id, parent);
      out.nodes.get(id).a *= 1 - e;
      after = id;
    }
  }
  return out;
}

// The old appearance of a replaced group owns separate ids all the way down.
function copyGhost(from, out, id, parent) {
  const f = from.nodes.get(id);
  const n = { ...f, id: `${id}~`, p: { ...f.p }, parent };
  if (f.kids) n.kids = f.kids.map((k) => `${k}~`);
  out.nodes.set(n.id, n);
  for (const k of f.kids ?? []) copyGhost(from, out, k, n.id);
  return n;
}

// a node of the old world, with what it holds that the new world does not have elsewhere
function copyOld(from, out, id, parent) {
  const f = from.nodes.get(id);
  const n = { ...f, p: { ...f.p }, parent };
  if (f.kids) n.kids = f.kids.filter((k) => !out.nodes.has(k));
  out.nodes.set(id, n);
  for (const k of n.kids ?? []) copyOld(from, out, k, id);
}
