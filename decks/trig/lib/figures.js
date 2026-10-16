// Standing figures for the cast (spec §7.2), and the same art drawn on the stage (the
// opening's skit). The images are exported into ../figures/ and ignored by git (AGENTS.md),
// and the public build gets them through .shipinclude. Where they are missing (a fresh clone,
// CI) the speakers have no figure and the stage draws a plain stand-in.

const images = import.meta.glob('../figures/*/*.png', { eager: true, query: '?url', import: 'default' });
const sizes = import.meta.glob('../figures/*/figure.json', { eager: true, import: 'default' });

const SHAPES = ['x', 'a', 'i', 'u', 'e', 'o', 'n'];

const pick = (id, part, shapes) => {
  const found = shapes.map((shape) => [shape, images[`../figures/${id}/${part}-${shape}.png`]]).filter(([, url]) => url);
  return Object.fromEntries(found);
};

export function figure(id) {
  const size = sizes[`../figures/${id}/figure.json`];
  const base = images[`../figures/${id}/base.png`];
  const mouth = pick(id, 'mouth', SHAPES);
  if (!size || !base || !mouth.x || !mouth.a) return undefined;
  const eyes = pick(id, 'eyes', ['open', 'closed']);
  return { width: size.width, height: size.height, base, mouth, ...(eyes.open && eyes.closed ? { eyes } : {}) };
}

// A speaker with a figure stands on `side`; without the art the entry is a plain voice.
export const standing = (id, side) => {
  const art = figure(id);
  return art ? { side, figure: art } : {};
};

export const hasFigures = Object.keys(sizes).length > 0;

// ——— the figure as a sprite on the stage ———————————————————————————————
// The images start loading when this module is imported, long before the first frame of a
// clip that draws them. A frame drawn before an image has arrived leaves that layer out.

const sprites = new Map();

export function sprite(id) {
  if (sprites.has(id)) return sprites.get(id);
  const art = figure(id);
  let out = null;
  if (art && typeof Image !== 'undefined') {
    const load = (url) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      return img;
    };
    out = {
      width: art.width,
      height: art.height,
      base: load(art.base),
      eyes: art.eyes ? { open: load(art.eyes.open), closed: load(art.eyes.closed) } : null,
      mouth: Object.fromEntries(Object.entries(art.mouth).map(([k, url]) => [k, load(url)])),
    };
  }
  sprites.set(id, out);
  return out;
}

const ready = (img) => img && img.complete && img.naturalWidth > 0;

// The nearest mouth the art has (spec §3.4's substitutions).
const FALLBACK = { i: ['e', 'a'], e: ['a'], u: ['o', 'a'], o: ['a'], n: ['x'] };
function mouthImage(sp, shape) {
  if (sp.mouth[shape]) return sp.mouth[shape];
  for (const alt of FALLBACK[shape] ?? []) if (sp.mouth[alt]) return sp.mouth[alt];
  return sp.mouth.x;
}

// Draw figure `id` with its bottom centre at (cx, bottom), `h` px tall. Returns false when the
// art is missing, so the caller can draw its stand-in.
export function drawSprite(ctx, id, cx, bottom, h, { mouth = 'x', eyes = 'open', alpha = 1, tilt = 0 } = {}) {
  const sp = sprite(id);
  if (!sp) return false;
  if (alpha <= 0.001) return true;
  const w = (h * sp.width) / sp.height;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, bottom);
  ctx.rotate(tilt);
  const layer = (img) => ready(img) && ctx.drawImage(img, -w / 2, -h, w, h);
  layer(sp.base);
  if (sp.eyes) layer(eyes === 'closed' ? sp.eyes.closed : sp.eyes.open);
  layer(mouthImage(sp, mouth));
  ctx.restore();
  return true;
}
