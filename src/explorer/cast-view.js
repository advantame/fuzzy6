import { castAt } from './cast.js';

const attr = (el, name, value) => {
  if (value === null || value === false) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else {
    const text = value === true ? '' : String(value);
    if (el.getAttribute(name) !== text) el.setAttribute(name, text);
  }
};
export function createCastView(root, subs) {
  const nodes = new Map();
  const waits = new Set();
  let states = [];
  function make(actor) {
    const node = document.createElement('div');
    node.className = 'mx-cast';
    node.dataset.id = actor.id;
    node.dataset.side = actor.side;
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', actor.name);
    const f = actor.figure;
    node.style.setProperty('--mx-figure-ratio', f.width / f.height);
    const image = (cls, src, shape) => {
      const img = document.createElement('img');
      img.className = `mx-cast-${cls}`; img.alt = '';
      if (shape) img.dataset.shape = shape;
      img.src = src;
      node.append(img);
    };
    image('base', f.base);
    for (const [shape, src] of Object.entries(f.eyes ?? {})) image('eyes', src, shape);
    for (const [shape, src] of Object.entries(f.mouth)) image('mouth', src, shape);
    subs.before(node);
    return node;
  }
  return {
    render(clipId, timeline, t, on) {
      states = on ? castAt(clipId, timeline, t) : [];
      for (const [id, node] of nodes) if (!states.some(s => s.id === id && s.side === node.dataset.side)) {
        node.remove(); nodes.delete(id);
      }
      for (const state of states) {
        if (!nodes.has(state.id)) nodes.set(state.id, make(timeline.cast.find(a => a.id === state.id)));
        const node = nodes.get(state.id);
        attr(node, 'data-speaking', state.speaking);
        attr(node, 'data-mouth', state.mouth);
        attr(node, 'data-eyes', state.eyes);
      }
      attr(root, 'data-cast', states.length > 0);
    },
    state: () => states.map(s => ({ ...s })),
    wait() {
      // A superseding navigation releases the previous wait and its listeners.
      for (const done of [...waits]) done();
      const pending = [...nodes.values()].flatMap(n => [...n.querySelectorAll('img')]).filter(img => !img.complete);
      if (!pending.length) return Promise.resolve();
      return new Promise(resolve => {
        const controller = new AbortController();
        let left = pending.length;
        const done = () => { clearTimeout(timer); controller.abort(); waits.delete(done); resolve(); };
        const timer = setTimeout(done, 3000);
        waits.add(done);
        for (const img of pending) {
          const finish = () => { if (--left === 0) done(); };
          img.addEventListener('load', finish, { once: true, signal: controller.signal });
          img.addEventListener('error', finish, { once: true, signal: controller.signal });
        }
      });
    },
    destroy() { for (const done of [...waits]) done(); nodes.clear(); states = []; },
  };
}
