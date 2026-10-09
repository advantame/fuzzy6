import { W, H, canvasScale } from './model.js';
export function createLayer(clip, root, { k, still, thumb = false, report }) {
  const el = document.createElement('div');
  el.className = 'mx-layer';
  el.dataset.clip = clip.id;
  const canvases = [];
  let instance;
  let failed = false;
  let disposed = false;
  let scale = canvasScale(k, devicePixelRatio);
  let lastTime;
  function fail(error) {
    if (failed) return;
    failed = true;
    report(clip.id, error);
    const card = document.createElement('div');
    card.className = 'mx-error';
    const id = document.createElement('strong');
    const message = document.createElement('span');
    id.textContent = clip.id;
    message.textContent = error?.message ?? String(error);
    card.append(id, message);
    el.replaceChildren(card);
  }
  function size() {
    for (const { canvas } of canvases) {
      canvas.width = Math.max(1, Math.floor(W * scale));
      canvas.height = Math.max(1, Math.floor(H * scale));
    }
  }
  const stage = {
    W,
    H,
    el,
    still,
    thumb,
    theme: name => getComputedStyle(root).getPropertyValue(name).trim(),
    canvas(opts = {}) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: opts.alpha ?? true });
      const item = { canvas, ctx };
      canvases.push(item);
      el.append(canvas);
      size();
      return item;
    },
  };
  return {
    el,
    canvases,
    setup() {
      try {
        instance = clip.setup(stage);
      } catch (e) {
        fail(e);
      }
    },
    render(t) {
      if (failed || disposed) return;
      if (lastTime !== t) {
        el.style.setProperty('--mx-t', t);
        el.style.setProperty('--mx-p', t / clip.duration);
        lastTime = t;
      }
      try {
        for (const { ctx } of canvases) ctx.setTransform(scale, 0, 0, scale, 0, 0);
        instance?.render?.(t);
      } catch (e) {
        fail(e);
      }
    },
    resize(k) {
      scale = canvasScale(k, devicePixelRatio);
      size();
      if (!failed) {
        try {
          instance?.resize?.();
        } catch (e) {
          fail(e);
        }
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        instance?.dispose?.();
      } catch (e) {
        report(clip.id, e);
      }
      el.remove();
      for (const { canvas } of canvases) {
        canvas.width = 0;
        canvas.height = 0;
      }
    },
  };
}
