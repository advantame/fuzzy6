// The world a retained clip describes at one time (docs/stage.md): named nodes in paint order.
// A leaf is drawn by its kind, kind(ctx, props, a, env); a group holds other nodes and gives them an alpha, a
// clip, a shift, a scale or a filter. vars are values many kinds read (a layout's geometry): a bridge moves them
// as it moves the nodes' props. A world is plain data; the clip's scene builds a new one for every frame.

export const GROUP = 'group';

export class World {
  constructor() {
    this.nodes = new Map();
    this.top = [];
    this.vars = {};
  }

  // A leaf. props.a is the node's alpha (default 1); the rest goes to its kind. o: { in (a group's id), before,
  // after (a sibling's id), bridge ('seq' | 'cross' | 'cut': how a bridge changes it, docs/stage.md) }
  add(id, kind, props = {}, o = {}) {
    if (typeof kind !== 'function') throw new Error(`stage: node ${id} has no kind`);
    return this.#put(id, kind, props, o);
  }

  // A group. props: { a, clip ({ x, y, w, h }), dx, dy, scale, origin ([x, y], default the stage's middle),
  // filter (a CSS filter) }. Its nodes go in with add(…, { in: id }).
  group(id, props = {}, o = {}) {
    return this.#put(id, GROUP, props, o);
  }

  #put(id, kind, props, o) {
    if (this.nodes.has(id)) throw new Error(`stage: node ${id} is already there`);
    if (typeof id !== 'string' || !id || id.endsWith('~')) throw new Error(`stage: bad node id ${id}`); // ~ marks a bridge's old copy
    const { a = 1, ...p } = props;
    const node = { id, kind, p, a, parent: null, bridge: o.bridge };
    if (kind === GROUP) node.kids = [];
    const { list, parent, index } = this.#place(o);
    node.parent = parent;
    list.splice(index, 0, id);
    this.nodes.set(id, node);
    return this;
  }

  // where a node goes: the end of the top or of a group, or beside a sibling
  #place(o) {
    if (['in', 'before', 'after'].filter((k) => o[k] !== undefined).length > 1)
      throw new Error('stage: choose one placement: in, before or after');
    const near = o.before ?? o.after;
    if (near !== undefined) {
      const n = this.#need(near);
      const list = this.#list(n.parent);
      const i = list.indexOf(near);
      return { list, parent: n.parent, index: o.before !== undefined ? i : i + 1 };
    }
    const parent = o.in ?? null;
    if (parent !== null && this.#need(parent).kind !== GROUP) throw new Error(`stage: ${parent} is not a group`);
    const list = this.#list(parent);
    return { list, parent, index: list.length };
  }

  #list(parent) {
    return parent === null ? this.top : this.nodes.get(parent).kids;
  }

  #need(id) {
    const n = this.nodes.get(id);
    if (!n) throw new Error(`stage: no node ${id}`);
    return n;
  }

  has(id) {
    return this.nodes.has(id);
  }

  get(id) {
    return this.#need(id);
  }

  // Change a node: patch.a is its alpha, the rest is merged into its props. o: { bridge } as add's.
  set(id, patch, o = {}) {
    const n = this.#need(id);
    const { a, ...p } = patch;
    if (a !== undefined) n.a = a;
    if (Object.keys(p).length) n.p = { ...n.p, ...p };
    if (o.bridge !== undefined) n.bridge = o.bridge;
    return this;
  }

  // Take nodes out (a group with what it holds). A bridge fades out what the clip it starts from had.
  drop(...ids) {
    for (const id of ids) {
      const n = this.#need(id);
      const list = this.#list(n.parent);
      list.splice(list.indexOf(id), 1);
      this.#forget(n);
    }
    return this;
  }

  #forget(n) {
    this.nodes.delete(n.id);
    for (const k of n.kids ?? []) this.#forget(this.nodes.get(k));
  }

  // Put a node somewhere else (o as add's).
  move(id, o = {}) {
    const n = this.#need(id);
    // Validate before detaching: failed moves must leave the world intact.
    const { list, parent, index } = this.#place(o);
    for (let p = parent; p !== null; p = this.#need(p).parent)
      if (p === id) throw new Error(`stage: moving ${id} there would create a cycle`);
    if (o.before === id || o.after === id) return this;
    const from = this.#list(n.parent);
    const oldIndex = from.indexOf(id);
    from.splice(oldIndex, 1);
    n.parent = parent;
    list.splice(index - (from === list && oldIndex < index ? 1 : 0), 0, id);
    return this;
  }

  // Empty it (a scene that builds its world anew from the world it starts from).
  clear() {
    this.nodes.clear();
    this.top = [];
    this.vars = {};
    return this;
  }

  // A copy to change: nodes and their props are copied one level deep (the values in props are not changed in
  // place, only replaced).
  clone() {
    const w = new World();
    for (const [id, n] of this.nodes) w.nodes.set(id, { ...n, p: { ...n.p }, ...(n.kids ? { kids: [...n.kids] } : {}) });
    w.top = [...this.top];
    w.vars = { ...this.vars };
    return w;
  }

  // The nodes in paint order, with their depth (for inspection).
  *walk(list = this.top, depth = 0) {
    for (const id of list) {
      const n = this.nodes.get(id);
      yield { node: n, depth };
      if (n.kids) yield* this.walk(n.kids, depth + 1);
    }
  }
}
