// Keeping labels off the lines of a figure. A figure is described as a list of shapes —
// segments, arcs, discs, rectangles — and a label as a box of a given size. place() slides the
// box out from an anchor along a direction until it keeps a gap from every shape. The clip
// says where a label belongs (beside this side, inside this angle); how far out it must go to
// stay clear is worked out here, so a label never sits on a line however the figure is drawn.
//
// Everything is a pure function of its inputs: the same figure puts a label in the same spot,
// frame after frame, and in the first frame of a clip that joins on (spec §6.10).
//
// Points are { x, y }; rectangles { x, y, w, h } with (x, y) the top-left corner; angles are in
// radians as canvas measures them (clockwise on screen from the +x axis).

export const segment = (p, q, w = 0) => ({ kind: 'segment', p, q, w });
// the arc of radius r around c from angle a0 to a1 (the short or long way, as given)
export const arc = (c, r, a0, a1, w = 0) => ({ kind: 'arc', c, r, a0, a1, w });
export const disc = (c, r) => ({ kind: 'disc', c, r });
export const rect = (x, y, w, h) => ({ kind: 'rect', x, y, w, h });

// A rectangle centred on (x, y).
export const centred = (x, y, w, h) => ({ x: x - w / 2, y: y - h / 2, w, h });
// A rectangle grown by pad on every side.
export const grow = (b, pad) => ({ x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 });

// ——— distances ———————————————————————————————————————————————————————

function pointSegment(pt, p, q) {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const l2 = dx * dx + dy * dy;
  const u = l2 ? Math.max(0, Math.min(1, ((pt.x - p.x) * dx + (pt.y - p.y) * dy) / l2)) : 0;
  return Math.hypot(pt.x - (p.x + dx * u), pt.y - (p.y + dy * u));
}

function pointRect(pt, b) {
  const dx = Math.max(b.x - pt.x, 0, pt.x - (b.x + b.w));
  const dy = Math.max(b.y - pt.y, 0, pt.y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

function segmentsCross(p, q, r, s) {
  const d1 = cross(r, s, p);
  const d2 = cross(r, s, q);
  const d3 = cross(p, q, r);
  const d4 = cross(p, q, s);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segmentRect(p, q, b) {
  if (pointRect(p, b) === 0 || pointRect(q, b) === 0) return 0;
  const c = [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.h },
    { x: b.x, y: b.y + b.h },
  ];
  for (let i = 0; i < 4; i++) if (segmentsCross(p, q, c[i], c[(i + 1) % 4])) return 0;
  return Math.min(pointRect(p, b), pointRect(q, b), ...c.map((pt) => pointSegment(pt, p, q)));
}

// The arc as a polyline: fine enough that the chord never strays more than half a pixel.
function arcPoints(s) {
  const sweep = s.a1 - s.a0;
  const n = Math.max(2, Math.ceil(Math.abs(sweep) / (2 * Math.acos(Math.max(-1, 1 - 0.5 / Math.max(s.r, 1))))));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = s.a0 + (sweep * i) / n;
    return { x: s.c.x + Math.cos(a) * s.r, y: s.c.y + Math.sin(a) * s.r };
  });
}

// Distance from rectangle b to a shape, 0 when they touch. A stroke's half width counts as
// part of the shape.
export function distance(b, s) {
  if (s.kind === 'segment') return Math.max(0, segmentRect(s.p, s.q, b) - s.w / 2);
  if (s.kind === 'arc') {
    const pts = arcPoints(s);
    let d = Infinity;
    for (let i = 0; i < pts.length - 1 && d > 0; i++) d = Math.min(d, segmentRect(pts[i], pts[i + 1], b));
    return Math.max(0, d - s.w / 2);
  }
  if (s.kind === 'disc') return Math.max(0, pointRect(s.c, b) - s.r);
  if (s.kind === 'rect') {
    const dx = Math.max(s.x - (b.x + b.w), 0, b.x - (s.x + s.w));
    const dy = Math.max(s.y - (b.y + b.h), 0, b.y - (s.y + s.h));
    return Math.hypot(dx, dy);
  }
  throw new Error(`unknown shape ${s.kind}`);
}

// The least distance from b to any of the shapes (Infinity when there are none).
export function clearance(b, shapes) {
  let d = Infinity;
  for (const s of shapes) {
    d = Math.min(d, distance(b, s));
    if (d === 0) break;
  }
  return d;
}

// ——— placing ————————————————————————————————————————————————————————

// Slide a box of size { w, h } from `anchor` along the unit vector `dir` and stop at the first
// spot where it keeps `gap` px from every shape. The box's centre starts o.from px out and goes
// no farther than o.to. Returns { x, y } (the centre), the box, d (how far out), and fits —
// false when no spot up to o.to is clear, in which case the clearest spot is returned.
// o: { gap = 8, from = 0, to = 400, step = 2 }
export function place(anchor, dir, size, shapes, o = {}) {
  const gap = o.gap ?? 8;
  const from = o.from ?? 0;
  const to = Math.max(from, o.to ?? 400);
  const step = o.step ?? 2;
  const at = (d) => centred(anchor.x + dir.x * d, anchor.y + dir.y * d, size.w, size.h);
  const clear = (d) => clearance(at(d), shapes) >= gap;
  const result = (d, fits) => {
    const box = at(d);
    return { x: box.x + size.w / 2, y: box.y + size.h / 2, box, d, fits };
  };
  if (clear(from)) return result(from, true);
  let best = from;
  let bestC = clearance(at(from), shapes);
  for (let d = from + step; d <= to + 1e-9; d += step) {
    if (clear(d)) {
      // the first clear step: narrow the edge down between it and the step before
      let lo = d - step;
      let hi = d;
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        if (clear(mid)) hi = mid;
        else lo = mid;
      }
      return result(hi, true);
    }
    const c = clearance(at(d), shapes);
    if (c > bestC) {
      best = d;
      bestC = c;
    }
  }
  return result(best, false);
}
