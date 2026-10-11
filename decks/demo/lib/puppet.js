// A plain puppet: the figure contract (spec §7.2) with no artwork behind it. Every image is
// an inline SVG on the same 240×240 canvas, so the layers stack without any alignment.

const image = (body) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">${body}</svg>`)}`;

export function puppet({ body = '#d9d4c7', ink = '#191714' } = {}) {
  const stroke = `stroke="${ink}" stroke-width="6" stroke-linecap="round" fill="none"`;
  return {
    width: 240,
    height: 240,
    base: image(
      `<path d="M22 240c0-50 42-74 98-74s98 24 98 74z" fill="${body}"/>` +
      `<circle cx="120" cy="100" r="76" fill="${body}"/>`),
    eyes: {
      open: image(`<circle cx="92" cy="90" r="10" fill="${ink}"/><circle cx="148" cy="90" r="10" fill="${ink}"/>`),
      closed: image(`<path d="M80 92h24M136 92h24" ${stroke}/>`),
    },
    mouth: {
      x: image(`<path d="M104 132h32" ${stroke}/>`),
      n: image(`<path d="M110 132h20" ${stroke}/>`),
      a: image(`<ellipse cx="120" cy="134" rx="19" ry="17" fill="${ink}"/>`),
      i: image(`<rect x="98" y="127" width="44" height="11" rx="5.5" fill="${ink}"/>`),
      u: image(`<ellipse cx="120" cy="133" rx="8" ry="9" fill="${ink}"/>`),
      e: image(`<ellipse cx="120" cy="133" rx="21" ry="10" fill="${ink}"/>`),
      o: image(`<ellipse cx="120" cy="134" rx="12" ry="15" fill="${ink}"/>`),
    },
  };
}
