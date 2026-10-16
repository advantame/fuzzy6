// fn drawn with the context's alpha multiplied by a (untouched at 1): for a kind whose drawing function takes no
// alpha of its own, so that a bridge can still fade it.
export function withAlpha(ctx, a, fn) {
  if (a >= 1) return fn();
  if (a <= 0.001) return undefined;
  ctx.save();
  ctx.globalAlpha *= a;
  const out = fn();
  ctx.restore();
  return out;
}

// About where a line of text drawn by kit's text() stands (for inspection: its width is measured, its height
// is the font's size).
export function textBox(s, x, y, o, w) {
  const size = Number(/(\d+(?:\.\d+)?)px/.exec(o.font ?? '')?.[1] ?? 16);
  const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  const top = o.base === 'middle' ? y - size / 2 : o.base === 'top' ? y : y - size * 0.8;
  return { x: x0, y: top, w, h: size };
}
