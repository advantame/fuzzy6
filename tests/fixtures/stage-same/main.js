// The retained clips beside the immediate ones they replaced (docs/stage.md): both drawn through the engine's
// layer at the same times, on canvases of 1600 × 900 pixels, and compared pixel by pixel. The engine is not
// running: each layer is driven by hand, as quiz.spec.js drives one.
import '@fontsource/ibm-plex-sans-jp/400.css';
import '@fontsource/ibm-plex-sans-jp/500.css';
import '@fontsource/ibm-plex-sans-jp/700.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans-condensed/500.css';
import '@fontsource/ibm-plex-sans-condensed/600.css';
import '@fontsource/ibm-plex-sans-condensed/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import deck from '/decks/llm/deck.js';
import { createLayer } from '/src/explorer/layer.js';
import { buildTimeline, mergePace } from '/src/explorer/timeline.js';
import base from '/decks/llm/clips/legacy/base.js';
import mcpflow from '/decks/llm/clips/legacy/mcpflow.js';
import session from '/decks/llm/clips/legacy/session.js';

const legacy = { base, mcpflow, session };
const current = Object.fromEntries(deck.chapters.flatMap((c) => c.clips).map((c) => [c.id, c]));
const pace = mergePace(deck.pace);
const timelineOf = (clip) => buildTimeline(clip, pace, deck.voice);
const root = document.querySelector('.mx');
const MAX_BAD = 20;

function layerOf(clip) {
  const timeline = timelineOf(clip);
  const layer = createLayer(clip, root, {
    k: 1, still: true, report: (_, error) => { throw error; }, timing: () => timeline, pace: () => pace, timelineOf,
  });
  layer.setup();
  return { layer, timeline };
}

async function fonts() {
  await Promise.all(deck.fonts.map(([font, s]) => document.fonts.load(font, s)));
}

// Draw the legacy and the current clip id at each time; count the pixels that differ.
// times: seconds, or { every } (from 0 to the duration, both ends) or 'stops'.
window.compare = async (id, times = { every: 0.1 }) => {
  await fonts();
  const a = layerOf(legacy[id]);
  const b = layerOf(current[id]);
  try {
    const d = a.timeline.duration;
    if (Math.abs(d - b.timeline.duration) > 1e-9) return { id, error: `durations differ: ${d} ${b.timeline.duration}` };
    let list = times;
    if (times === 'stops') list = a.timeline.stops.map((s) => s.at);
    else if (!Array.isArray(times)) {
      list = [];
      for (let t = 0; t < d; t += times.every) list.push(Math.round(t * 1000) / 1000);
      list.push(d);
    }
    const ca = a.layer.canvases[0];
    const cb = b.layer.canvases[0];
    const bad = [];
    let worst = 0;
    let differ = 0;
    for (const t of list) {
      a.layer.render(t);
      b.layer.render(t);
      const pa = ca.ctx.getImageData(0, 0, ca.canvas.width, ca.canvas.height).data;
      const pb = cb.ctx.getImageData(0, 0, cb.canvas.width, cb.canvas.height).data;
      if (pa.length !== pb.length) return { id, error: 'canvas sizes differ' };
      let n = 0;
      let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
      const w = ca.canvas.width;
      for (let i = 0; i < pa.length; i += 4) {
        if (pa[i] !== pb[i] || pa[i + 1] !== pb[i + 1] || pa[i + 2] !== pb[i + 2] || pa[i + 3] !== pb[i + 3]) {
          n++;
          const px = (i / 4) % w;
          const py = Math.floor(i / 4 / w);
          if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
        }
      }
      worst = Math.max(worst, n);
      if (n) differ++;
      if (n && bad.length < MAX_BAD) bad.push({ t, n, box: [x0, y0, x1, y1] });
    }
    return { id, frames: list.length, size: [ca.canvas.width, ca.canvas.height], differ, worst, bad };
  } finally {
    a.layer.dispose();
    b.layer.dispose();
  }
};

// One clip's frame as a PNG data URL (to look at a frame that differs): which 'legacy' | 'current'.
window.frame = async (id, which, t) => {
  await fonts();
  const { layer } = layerOf((which === 'legacy' ? legacy : current)[id]);
  try {
    layer.render(t);
    return layer.canvases[0].canvas.toDataURL('image/png');
  } finally {
    layer.dispose();
  }
};

window.ready = true;
