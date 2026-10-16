// Standing figures for the cast (spec §7.2). The images are exported into ../figures/ and
// ignored by git (AGENTS.md), and the public build gets them through .shipinclude. Where they
// are missing (a fresh clone, CI) the speakers have no figure.

const images = import.meta.glob('../figures/*/*.png', { eager: true, query: '?url', import: 'default' });
const sizes = import.meta.glob('../figures/*/figure.json', { eager: true, import: 'default' });

const SHAPES = ['x', 'a', 'i', 'u', 'e', 'o', 'n'];

const pick = (id, part, shapes) => {
  const found = shapes.map((shape) => [shape, images[`../figures/${id}/${part}-${shape}.png`]]).filter(([, url]) => url);
  return Object.fromEntries(found);
};

function figure(id) {
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
