import { describe, expect, test } from 'vitest';
import { segment, arc, disc, rect, distance, clearance, place, centred, grow } from '../src/kit/place.js';

const box = (x, y, w, h) => ({ x, y, w, h });

describe('distance', () => {
  test('a segment through the box touches it, one beside it does not', () => {
    expect(distance(box(0, 0, 10, 10), segment({ x: -5, y: 5 }, { x: 15, y: 5 }))).toBe(0);
    expect(distance(box(0, 0, 10, 10), segment({ x: -5, y: 20 }, { x: 15, y: 20 }))).toBeCloseTo(10);
  });
  test('a segment that crosses a corner without an end inside still touches', () => {
    expect(distance(box(0, 0, 10, 10), segment({ x: -5, y: 8 }, { x: 8, y: -5 }))).toBe(0);
  });
  test("a stroke's half width counts as part of the shape", () => {
    expect(distance(box(0, 0, 10, 10), segment({ x: -5, y: 20 }, { x: 15, y: 20 }, 6))).toBeCloseTo(7);
  });
  test('an arc is measured along its curve, not its chord', () => {
    // a quarter circle of radius 100 around the origin, from +x round to +y
    const a = arc({ x: 0, y: 0 }, 100, 0, Math.PI / 2);
    const mid = 100 * Math.SQRT1_2;
    expect(distance(centred(mid, mid, 4, 4), a)).toBeLessThan(0.6);
    // inside the arc, 30 px from the curve: the chord would pass much closer
    expect(distance(centred(mid - 21, mid - 21, 2, 2), a)).toBeGreaterThan(27);
  });
  test('discs and rectangles', () => {
    expect(distance(box(0, 0, 10, 10), disc({ x: 30, y: 5 }, 5))).toBeCloseTo(15);
    expect(distance(box(0, 0, 10, 10), rect(13, 14, 5, 5))).toBeCloseTo(5);
    expect(distance(box(0, 0, 10, 10), rect(5, 5, 20, 20))).toBe(0);
  });
  test('clearance is the least distance, and Infinity with nothing to avoid', () => {
    const b = box(0, 0, 10, 10);
    expect(clearance(b, [])).toBe(Infinity);
    expect(clearance(b, [rect(20, 0, 5, 5), rect(0, 13, 5, 5)])).toBeCloseTo(3);
  });
  test('grow pads every side', () => {
    expect(grow(box(10, 10, 20, 10), 5)).toEqual(box(5, 5, 30, 20));
  });
});

describe('place', () => {
  const floor = segment({ x: -500, y: 0 }, { x: 500, y: 0 }, 4);
  test('a label already clear stays at its anchor', () => {
    const p = place({ x: 0, y: -100 }, { x: 0, y: -1 }, { w: 40, h: 20 }, [floor]);
    expect(p).toMatchObject({ x: 0, y: -100, d: 0, fits: true });
  });
  test('a label on a line slides out until it keeps the gap', () => {
    const p = place({ x: 0, y: 0 }, { x: 0, y: -1 }, { w: 40, h: 20 }, [floor], { gap: 8 });
    expect(p.fits).toBe(true);
    // half the label (10) + half the stroke (2) + the gap (8)
    expect(p.d).toBeCloseTo(20, 1);
    expect(clearance(p.box, [floor])).toBeGreaterThanOrEqual(8);
    expect(clearance(p.box, [floor])).toBeLessThan(8.1);
  });
  test('inside a narrow angle, a label goes out along the bisector until the opening is wide enough', () => {
    const V = { x: 0, y: 0 };
    const deg = 10;
    const a = (deg * Math.PI) / 180;
    const rays = [segment(V, { x: 1000, y: 0 }), segment(V, { x: 1000 * Math.cos(a), y: -1000 * Math.sin(a) })];
    const dir = { x: Math.cos(a / 2), y: -Math.sin(a / 2) };
    const p = place(V, dir, { w: 30, h: 20 }, rays, { gap: 6, from: 40, to: 800 });
    expect(p.fits).toBe(true);
    expect(clearance(p.box, rays)).toBeGreaterThanOrEqual(6);
    // a little nearer, it would touch
    const nearer = centred(V.x + dir.x * (p.d - 3), V.y + dir.y * (p.d - 3), 30, 20);
    expect(clearance(nearer, rays)).toBeLessThan(6);
  });
  test('when nothing up to `to` is clear, the clearest spot comes back with fits false', () => {
    const walls = [segment({ x: -100, y: -10 }, { x: 100, y: -10 }), segment({ x: -100, y: 10 }, { x: 100, y: 10 })];
    const p = place({ x: 0, y: 0 }, { x: 1, y: 0 }, { w: 30, h: 30 }, walls, { to: 50 });
    expect(p.fits).toBe(false);
  });
  test('the same figure gives the same spot', () => {
    const args = [{ x: 3, y: 4 }, { x: 0.6, y: -0.8 }, { w: 50, h: 22 }, [floor, disc({ x: 10, y: -30 }, 12)], { gap: 7 }];
    expect(place(...args)).toEqual(place(...args));
  });
});
