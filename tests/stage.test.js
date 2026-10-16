import { describe, expect, it, vi } from 'vitest';
import { World, GROUP } from '../src/stage/world.js';
import { blend } from '../src/stage/blend.js';
import { paint, inspect } from '../src/stage/paint.js';
import { stage } from '../src/stage/index.js';

const kind = (_ctx, p) => p.box;
const other = () => null;
const order = w => [...w.walk()].map(({ node }) => node.id);
function context() {
  const stack = [];
  return {
    globalAlpha: 1, filter: 'none',
    save() { stack.push([this.globalAlpha, this.filter]); },
    restore() { [this.globalAlpha, this.filter] = stack.pop(); },
    translate: vi.fn(), scale: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), clip: vi.fn(),
  };
}

describe('World', () => {
  it('adds leaves and groups in paint order, and merges props and alpha', () => {
    const w = new World().add('a', kind, { x: 1 }).group('g', { dx: 2 })
      .add('b', kind, { a: 0.4, x: 3 }, { in: 'g' });
    expect(order(w)).toEqual(['a', 'g', 'b']);
    expect(w.get('g').kind).toBe(GROUP);
    expect(w.get('b')).toMatchObject({ a: 0.4, p: { x: 3 }, parent: 'g' });
    w.set('b', { y: 4, a: 0.8 }, { bridge: 'cross' });
    expect(w.get('b')).toMatchObject({ a: 0.8, p: { x: 3, y: 4 }, bridge: 'cross' });
    expect(w.has('missing')).toBe(false);
  });
  it('places and moves before, after and in groups, or back to the top', () => {
    const w = new World().group('g').add('a', kind, {}, { in: 'g' })
      .add('c', kind, {}, { after: 'a' }).add('b', kind, {}, { before: 'c' }).add('z', kind);
    expect(w.get('g').kids).toEqual(['a', 'b', 'c']);
    w.move('c', { before: 'a' }).move('z', { after: 'a' });
    expect(w.get('g').kids).toEqual(['c', 'a', 'z', 'b']);
    w.move('b', {}).move('a', { in: 'g' });
    expect(order(w)).toEqual(['g', 'c', 'z', 'a', 'b']);
    expect(w.get('b').parent).toBe(null);
    w.move('c', { after: 'a' });
    expect(w.get('g').kids).toEqual(['z', 'a', 'c']);
  });
  it('drops a group with its descendants; clones can be edited without changing the source', () => {
    const w = new World().group('g').group('inner', {}, { in: 'g' }).add('a', kind, { x: 1 }, { in: 'inner' }).add('z', kind);
    w.vars.G = { x: 3 };
    const copy = w.clone().set('a', { x: 2 }).move('z', { in: 'g' });
    copy.vars.G = { x: 4 };
    expect(w.get('a').p.x).toBe(1);
    expect(w.top).toEqual(['g', 'z']);
    expect(w.vars.G.x).toBe(3);
    copy.drop('inner');
    expect(order(copy)).toEqual(['g', 'z']);
    expect(copy.has('a')).toBe(false);
    copy.clear();
    expect(copy.nodes.size).toBe(0); expect(copy.top).toEqual([]); expect(copy.vars).toEqual({});
    expect(w.has('a')).toBe(true);
  });
  it.each(['', 'old~', 42, null, undefined])('rejects invalid id %s', id => {
    expect(() => new World().add(id, kind)).toThrow(/bad node id/);
  });
  it('rejects duplicate ids, missing nodes and non-groups without corrupting the world', () => {
    const w = new World().add('a', kind).add('b', kind);
    expect(() => w.group('a')).toThrow(/already/);
    expect(() => w.add('bad', null)).toThrow(/kind/);
    expect(() => w.add('bad', kind, {}, { in: 'a' })).toThrow(/not a group/);
    for (const action of [() => w.get('missing'), () => w.set('missing', {}), () => w.drop('missing'), () => w.move('a', { before: 'missing' })]) expect(action).toThrow(/no node/);
    expect(order(w)).toEqual(['a', 'b']);
  });
  it('rejects cycles and ambiguous placement, and treats moving beside oneself as a no-op', () => {
    const w = new World().group('g').group('child', {}, { in: 'g' }).add('leaf', kind, {}, { in: 'child' });
    expect(() => w.move('g', { in: 'g' })).toThrow(/cycle/);
    expect(() => w.move('g', { in: 'child' })).toThrow(/cycle/);
    expect(() => w.move('g', { before: 'leaf' })).toThrow(/cycle/);
    expect(() => w.add('x', kind, {}, { before: 'g', in: 'child' })).toThrow(/placement/);
    w.move('g', { before: 'g' }).move('g', { after: 'g' });
    expect(w.top).toEqual(['g']); expect(w.get('g').kids).toEqual(['child']);
  });
});

describe('blend', () => {
  it('interpolates nested numbers, arrays, alpha and variables without mutating inputs', () => {
    const a = new World().add('n', kind, { x: 0, a: 0.2, nested: { xy: [2, 4] } });
    a.vars = { geometry: { x: 4, xy: [0, 2] }, old: 1 };
    const b = a.clone().set('n', { x: 20, a: 1, nested: { xy: [6, 8] } });
    b.vars = { geometry: { x: 8, xy: [4, 6] }, new: true };
    const c = blend(a, b, 0.25);
    expect(c.get('n')).toMatchObject({ p: { x: 5, nested: { xy: [3, 5] } }, a: 0.4 });
    expect(c.vars).toEqual({ geometry: { x: 5, xy: [1, 3] }, new: true });
    expect(a.get('n').p.x).toBe(0); expect(b.get('n').p.x).toBe(20);
  });
  it.each([
    ['seq', 0.25, 0.5, 0], ['seq', 0.75, 0, 0.5],
    ['cross', 0.25, 0.75, 0.25], ['cut', 0.9, 1, 0], ['cut', 1, 0, 1],
  ])('%s swaps incompatible props at %s', (policy, t, old, next) => {
    const a = new World().add('n', kind, { s: 'old', x: 0, a: 0.8 });
    const b = new World().add('n', kind, { s: 'new', x: 20, a: 0.6 }, { bridge: policy });
    const c = blend(a, b, t);
    expect(c.top).toEqual(['n~', 'n']);
    expect(c.get('n~').a).toBeCloseTo(0.8 * old);
    expect(c.get('n').a).toBeCloseTo(0.6 * next);
    expect(c.get('n~').p.x).toBe(0); expect(c.get('n').p.x).toBe(20);
  });
  it.each([{ flag: false }, { list: [1, 2] }, { extra: 2 }])('swaps flags, unequal arrays and added props: %j', patch => {
    const a = new World().add('n', kind, { flag: true, list: [1] });
    expect(blend(a, a.clone().set('n', patch), 0.25).has('n~')).toBe(true);
  });
  it('now replaces discrete props while interpolating numeric props, including kind changes', () => {
    const a = new World().add('n', kind, { s: 'old', x: 0 });
    const b = new World().add('n', other, { s: 'new', x: 20 }, { bridge: 'now' });
    const c = blend(a, b, 0.25);
    expect(c.has('n~')).toBe(false);
    expect(c.get('n')).toMatchObject({ kind: other, p: { s: 'new', x: 5 } });
  });
  it('swaps changed kinds', () => {
    const a = new World().add('n', kind);
    const b = new World().add('n', other);
    expect(blend(a, b, 0.25).get('n~').kind).toBe(kind);
  });
  it('keeps interpolating nested numbers beside discrete now props and variables', () => {
    const a = new World().add('n', kind, { layout: { x: 0, name: 'a', rows: [{ y: 0, flag: false }] } });
    const b = a.clone().set('n', { layout: { x: 20, name: 'b', rows: [{ y: 40, flag: true }] } }, { bridge: 'now' });
    a.vars.layout = a.get('n').p.layout;
    b.vars.layout = b.get('n').p.layout;
    const c = blend(a, b, 0.25);
    const expected = { x: 5, name: 'b', rows: [{ y: 10, flag: true }] };
    expect(c.get('n').p.layout).toEqual(expected);
    expect(c.vars.layout).toEqual(expected);
  });
  it.each([[undefined, 0.25], ['cross', 0.25], ['now', 1], ['cut', 0]])('fades new nodes with policy %s', (bridge, weight) => {
    const b = new World().add('n', kind, { a: 0.8 }, { bridge });
    expect(blend(new World(), b, 0.25).get('n').a).toBeCloseTo(0.8 * weight);
    expect(blend(new World(), b, 1).get('n').a).toBe(0.8);
  });
  it('keeps removed nodes in their former order and position while fading', () => {
    const a = new World().add('first', kind).add('keep', kind).add('old', kind, { x: 42 }).add('last', kind);
    const b = a.clone().drop('first', 'old', 'last').add('new', kind);
    const c = blend(a, b, 0.25);
    expect(c.top).toEqual(['first', 'keep', 'old', 'last', 'new']);
    expect(c.get('old')).toMatchObject({ a: 0.75, p: { x: 42 } });
  });
  it('interpolates group geometry and fades only the outermost new or removed group', () => {
    const a = new World().group('g', { dx: 0, scale: 1 }).add('keep', kind, {}, { in: 'g' });
    const b = a.clone().set('g', { dx: 20, scale: 2 }).group('new', { a: 0.8 }, { in: 'g' }).add('child', kind, { a: 0.6 }, { in: 'new' });
    const c = blend(a, b, 0.5);
    expect(c.get('g').p).toEqual({ dx: 10, scale: 1.5 });
    expect(c.get('new').a).toBe(0.4); expect(c.get('child').a).toBe(0.6);
    const gone = blend(b, a, 0.5);
    expect(gone.get('new').a).toBe(0.4); expect(gone.get('child').a).toBe(0.6);
    expect(gone.get('child').parent).toBe('new');
  });
  it('does not duplicate children moved out of a disappearing group', () => {
    const a = new World().group('g').add('child', kind, {}, { in: 'g' });
    const b = a.clone().move('child', {}).drop('g');
    expect(order(blend(a, b, 0.5))).toEqual(['g', 'child']);
    expect(blend(a, b, 0.5).get('g').kids).toEqual([]);
  });
  it('honors the swap policy for a group with a changed filter, including its children', () => {
    const a = new World().group('g', { filter: 'none', dx: 0 }).add('child', kind, { x: 0 }, { in: 'g' });
    const b = a.clone().set('g', { filter: 'grayscale(1)', dx: 20 }, { bridge: 'cross' }).set('child', { x: 10 });
    const c = blend(a, b, 0.25);
    expect(order(c)).toEqual(['g~', 'child~', 'g', 'child']);
    expect(c.get('g~')).toMatchObject({ a: 0.75, p: { filter: 'none', dx: 0 } });
    expect(c.get('g')).toMatchObject({ a: 0.25, p: { filter: 'grayscale(1)', dx: 20 } });
    expect(c.get('child').p.x).toBe(10);
    expect(c.get('child~')).toMatchObject({ a: 1, parent: 'g~', p: { x: 0 } });
  });
  it('preserves implicit immediate group clipping used by inherited scenes', () => {
    const a = new World().group('g').add('child', kind, {}, { in: 'g' });
    const clip = { x: 1, y: 2, w: 3, h: 4 };
    const b = a.clone().set('g', { clip, dy: -10 });
    const c = blend(a, b, 0.25);
    expect(order(c)).toEqual(['g', 'child']);
    expect(c.get('g').p).toEqual({ clip, dy: -10 });
  });
  it.each(['seq', 'cross', 'cut', 'now'])('can replace a group with a leaf and vice versa (%s)', bridge => {
    const a = new World().group('n').add('child', kind, {}, { in: 'n' });
    const b = new World().add('n', kind, {}, { bridge });
    const c = blend(a, b, 0.25);
    const d = blend(b, a.clone().set('n', {}, { bridge }), 0.25);
    expect(() => paint(context(), c, 0)).not.toThrow();
    expect(() => paint(context(), d, 0)).not.toThrow();
    expect(c.get('n').kind).toBe(kind);
    expect(d.get('n').kind).toBe(GROUP);
    expect(c.has('n~')).toBe(bridge !== 'now');
    expect(d.has('n~')).toBe(bridge !== 'now');
    expect(c.has('child')).toBe(false);
    expect(d.get('child').a).toBe(1);
  });
});

describe('paint and inspect', () => {
  it('resolves id:path and boxes between nested transforms and the ring coordinate system', () => {
    const ctx = context(); const found = [];
    const box = { x: 1, y: 2, w: 3, h: 4 };
    const result = { box, rows: [{ ...box, x: 2 }] };
    const source = () => result;
    const ring = (_ctx, _p, _a, env) => { found.push(env.box('source'), env.box('source:rows.0'), env.out('source')); };
    const w = new World().group('g', { dx: 10, dy: 20, scale: 2, origin: [0, 0] })
      .group('inner', { dx: 3, dy: 4, scale: 3, origin: [0, 0] }, { in: 'g' })
      .add('source', source, {}, { in: 'inner' })
      .group('ring-group', { dx: 4, dy: 8, scale: 2, origin: [0, 0] })
      .add('ring', ring, {}, { in: 'ring-group' });
    const done = paint(ctx, w, 12);
    expect(found).toEqual([{ x: 9, y: 16, w: 9, h: 12 }, { x: 12, y: 16, w: 9, h: 12 }, result]);
    expect(inspect(w, done).find(r => r.id === 'source')).toEqual({ id: 'source', kind: 'source', depth: 2, a: 1, box: { x: 22, y: 40, w: 18, h: 24 } });
    expect(inspect(w, done).map(r => r.id)).toEqual(order(w));
  });
  it('applies alpha, filter and clipping before shift and scale, then restores state', () => {
    const ctx = context(); const seen = [];
    ctx.clip.mockImplementation(() => seen.push(['clip', ctx.globalAlpha, ctx.filter, ctx.translate.mock.calls.length]));
    const leaf = (c, p, a, env) => seen.push(['leaf', c.globalAlpha, a, env.t, env.v.x]);
    const w = new World().group('g', { a: 0.5, filter: 'grayscale(1)', clip: { x: 1, y: 2, w: 3, h: 4 }, dx: 10, scale: 2 })
      .add('n', leaf, { a: 0.3 }, { in: 'g' }).group('hidden', { a: 0.001 }).add('skip', leaf, {}, { in: 'hidden' });
    w.vars.x = 7;
    paint(ctx, w, 4);
    expect(seen).toEqual([['clip', 0.5, 'grayscale(1)', 0], ['leaf', 0.5, 0.3, 4, 7]]);
    expect(ctx.translate.mock.calls).toEqual([[10, 0], [800, 450], [-800, -450]]);
    expect(ctx.globalAlpha).toBe(1); expect(ctx.filter).toBe('none');
  });
  it('accepts literal boxes and lists, and reports absent or non-box targets briefly', () => {
    const ctx = context(); const b = { x: 0, y: 1, w: 2, h: 3 };
    const probe = (_c, _p, _a, env) => {
      expect(env.box([null, 'n', b])).toEqual([b, b]);
      expect(env.box(42)).toBe(null);
      expect(() => env.box('later')).toThrow(/not drawn before/);
      expect(() => env.box('n:missing')).toThrow(/no box/);
    };
    paint(ctx, new World().add('n', kind, { box: b }).add('probe', probe), 0);
  });
  it('reports empty inspection before the first render, then the most recent frame', () => {
    const clip = stage({ id: 'test', duration: 1, scene(w, f) { w.add('n', kind, { box: { x: f.t, y: 2, w: 3, h: 4 } }); } });
    const layer = clip.setup({ canvas: () => ({ ctx: context() }), at: () => 0, duration: 1, pace: { cue: {} } });
    expect(layer.inspect()).toEqual([]);
    layer.render(0.2); expect(layer.inspect()[0].box.x).toBe(0.2);
    layer.render(0.7); expect(layer.inspect()[0].box.x).toBe(0.7);
  });
});
