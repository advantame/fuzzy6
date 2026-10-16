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
const MAX_FRAMES = 20_000;

function layerOf(clip) {
  const timeline = timelineOf(clip);
  const layer = createLayer(clip, root, {
    k: 1, still: true, report: (_, error) => { throw error; }, timing: () => timeline, pace: () => pace, timelineOf,
  });
  try { layer.setup(); } catch (error) { layer.dispose(); throw error; }
  return { layer, timeline };
}

async function fonts() {
  await Promise.all(deck.fonts.map(([font, s]) => document.fonts.load(font, s)));
}

// Draw the legacy and the current clip id at each time; count the pixels that differ.
// times: seconds, or { every } (from 0 to the duration, both ends) or 'stops'.
window.compare = async (id, times = { every: 0.1 }) => {
  if (!legacy[id] || !current[id]) throw new Error(`Unknown comparison clip: ${id}`);
  const d = timelineOf(legacy[id]).duration;
  let list;
  if (times === 'stops') list = timelineOf(legacy[id]).stops.map((s) => s.at);
  else if (Array.isArray(times)) list = times;
  else {
    const every = times?.every;
    const count = Math.ceil(d / every);
    if (!Number.isFinite(every) || every <= 0 || !Number.isFinite(count) || count + 1 > MAX_FRAMES)
      throw new Error(`Comparison interval must be positive and produce at most ${MAX_FRAMES} frames`);
    // Multiplication avoids cumulative drift, and preserves exact 1/60-second samples.
    list = Array.from({ length: count }, (_, i) => i * every);
    list.push(d);
  }
  if (!list.length || list.length > MAX_FRAMES || list.some(t => !Number.isFinite(t) || t < 0 || t > d))
    throw new Error(`Comparison requires 1–${MAX_FRAMES} finite times within the clip`);
  await fonts();
  const a = layerOf(legacy[id]);
  let b;
  try {
    b = layerOf(current[id]);
    if (Math.abs(d - b.timeline.duration) > 1e-9) return { id, error: `durations differ: ${d} ${b.timeline.duration}` };
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
    b?.layer.dispose();
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
