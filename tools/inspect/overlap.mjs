// DOM-free box contract: {kind:'text'|'rect', x,y,w,h,alpha,text?,paint?,edge?,order?}.
// Units are logical stage pixels. edge is the unclipped rectangular border.
// A future retained stage can supply this same array directly.
export const MAX_BOXES = 2000;
const right = b => b.x + b.w, bottom = b => b.y + b.h;
const contains = (a,b) => a.x <= b.x && a.y <= b.y && right(a) >= right(b) && bottom(a) >= bottom(b);
const intersection = (a,b) => ({ w: Math.min(right(a),right(b))-Math.max(a.x,b.x), h: Math.min(bottom(a),bottom(b))-Math.max(a.y,b.y) });
const same = (a,b) => ['x','y','w','h'].every(k => Math.abs(a[k]-b[k]) < 0.25);
// A small port/tab is deliberately centred on a larger panel's straight border.
// Merely being small or touching the border is not enough to suppress a collision.
const attachment = (small, panel) => {
  if (small.w > 64 || small.h > 32 || small.w*small.h > panel.w*panel.h*.05) return false;
  const cx=small.x+small.w/2, cy=small.y+small.h/2;
  return ([panel.x,right(panel)].some(x=>Math.abs(cx-x)<.25) && small.y>panel.y && bottom(small)<bottom(panel)) ||
    ([panel.y,bottom(panel)].some(y=>Math.abs(cy-y)<.25) && small.x>panel.x && right(small)<right(panel));
};
export function detectOverlap(input, { limit = 200, width = 1600, height = 900 } = {}) {
  if (!Array.isArray(input) || input.length > MAX_BOXES) throw new Error(`Boxes exceed ${MAX_BOXES}`);
  if (!Number.isInteger(limit) || limit < 1 || limit > 2000) throw new Error('Invalid overlap report limit');
  for (const b of input) if (!['text','rect'].includes(b.kind) || !['x','y','w','h','alpha'].every(k => Number.isFinite(b[k])) || b.w < 0 || b.h < 0) throw new Error('Invalid box');
  const boxes = input.filter(b => b.alpha >= 0.5 && b.w > 0 && b.h > 0).filter((b, i, all) =>
    // Later opaque rectangular paint hides the earlier element completely.
    !all.slice(i+1).some(c => c.kind === 'rect' && c.paint === 'fill' && c.alpha >= 0.999 && !c.rounded && contains(c,b)));
  const found = [];
  const reported = new Set();
  let comparisons = 0;
  let total = 0;
  const add = (kind,a,b) => {
    // Fill and stroke of the same border should produce a single diagnostic.
    const key = JSON.stringify([kind,a.kind,a.text,a.x,a.y,a.w,a.h,b?.kind,b?.text,b?.x,b?.y,b?.w,b?.h]);
    if (reported.has(key)) return;
    // Bound both diagnostics and their deduplication storage before accumulation.
    if (reported.size < limit) reported.add(key);
    total++; if (found.length < limit) found.push({ kind, a, ...(b ? { b } : {}) });
  };
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    if (a.x < -0.01 || a.y < -0.01 || right(a) > width+0.01 || bottom(a) > height+0.01) add('outside',a);
    for (let j = i+1; j < boxes.length; j++) {
      const b = boxes[j], overlap = intersection(a,b);
      if (a.kind === 'text' && b.kind === 'text') {
        if (a.text === b.text && same(a,b)) continue;
        if (overlap.w >= 2 && overlap.h >= 2) add('text-text',a,b);
      } else if (a.kind === 'rect' && b.kind === 'rect') {
        if (a.paint === 'fill' && b.paint === 'fill' && overlap.w > 0 && overlap.h > 0 && !contains(a,b) && !contains(b,a) && !attachment(a,b) && !attachment(b,a)) add('rect-rect',a,b);
      } else {
        const text = a.kind === 'text' ? a : b, rect = a.kind === 'rect' ? a : b, edge = rect.edge ?? rect;
        // Small, enclosing labels/rings deliberately sit close to their own text.
        if (contains(edge,text) && edge.w <= text.w+40 && edge.h <= text.h+24) continue;
        // The stage-sized background is not a label/frame; outside handles its edge.
        if (edge.x <= 0 && edge.y <= 0 && right(edge) >= width && bottom(edge) >= height) continue;
        const visible = intersection(text, rect);
        if (visible.w < -2 || visible.h < -2) continue;
        const near = (v,lo,hi) => v >= lo-2 && v <= hi+2;
        const vertical = Math.min(bottom(text),bottom(edge)) >= Math.max(text.y,edge.y) &&
          [edge.x,right(edge)].some(x => near(x,text.x,right(text)) && near(x,rect.x,right(rect)));
        const horizontal = Math.min(right(text),right(edge)) >= Math.max(text.x,edge.x) &&
          [edge.y,bottom(edge)].some(y => near(y,text.y,bottom(text)) && near(y,rect.y,bottom(rect)));
        if (vertical || horizontal) {
          // A later tab hides the panel border beneath its own lettering.
          const covered = boxes.some(tab => {
            if (++comparisons > 4_000_000) throw new Error('Overlap comparison budget exceeded');
            return tab.kind === 'rect' && tab.paint === 'fill' && tab.alpha >= .999 &&
              (tab.order ?? input.indexOf(tab)) > (rect.order ?? input.indexOf(rect)) &&
              contains(tab,text) && attachment(tab,edge);
          });
          if (!covered) add('text-edge',text,rect);
        }
      }
    }
  }
  return { found, total, truncated: total > found.length };
}
