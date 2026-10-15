import { describe, it, expect } from 'vitest';
import { normalizeDeck, orderedClips, canCutJoin, diveNeighbor } from '../src/explorer/model.js';
import { ascentTarget } from '../src/explorer/dive.js';
import { buildTimeline } from '../src/explorer/timeline.js';
import { renderScript } from '../tools/script-doc.mjs';
const clip = (id, extra = {}) => ({ id, title: id, duration: 2, setup() {}, ...extra });
const group = (id = 'group', clips = [clip('one'), clip('two', { join: 'cut', bridge: 0.5 }), clip('three')]) => ({ id, title: 'Group title', clips });
const deck = (g = group(), to = 'group') => ({ id: 'example', title: 'Example', chapters: [{ id: 'a', title: 'A',
  clips: [clip('main', { doors: [{ to, from: 1, label: 'Why?' }] }), clip('last')], dives: [g] }] });

describe('dive groups', () => {
  it('normalizes groups and standalone dives, sharing the first parent and its first door', () => {
    const d = deck(); d.chapters[0].clips[0].doors.unshift({ to: 'two', from: 0.5 });
    const model = normalizeDeck(d);
    expect(model.clips).toHaveLength(2);
    expect(model.all.map(e => e.clip.id)).toEqual(['main', 'one', 'two', 'three', 'last']);
    expect(orderedClips(d).map(c => c.id)).toEqual(model.all.map(e => e.clip.id));
    expect(model.targets.get('group')).toBe(model.ids.get('one'));
    for (const [i, entry] of model.dives.entries()) {
      expect(entry).toMatchObject({ part: i, parts: 3, index: 0, parentDoor: { to: 'two', from: 0.5 } });
      expect(entry.parent.clip.id).toBe('main');
      expect(ascentTarget(entry, [], buildTimeline)).toEqual({ id: 'main', t: 0.5 });
    }
  });
  it('moves within the group without changing the saved return location or answers', () => {
    const m = normalizeDeck(deck()), stack = [{ id: 'main', t: 1.25, answers: { q1: 1 } }];
    const first = m.targets.get('group'), next = diveNeighbor(first, 1);
    expect(diveNeighbor(next, -1)).toBe(first);
    expect(diveNeighbor(first, -1)).toBeUndefined();
    expect(diveNeighbor(m.ids.get('three'), 1)).toBeUndefined();
    for (const entry of m.dives) expect(ascentTarget(entry, stack, buildTimeline)).toEqual(stack[0]);
    expect(stack).toHaveLength(1);
  });
  it('accepts a member-only door, a one-member group, and standalone metadata', () => {
    expect(normalizeDeck(deck(group(), 'two')).dives).toHaveLength(3);
    expect(normalizeDeck(deck(group('group', [clip('one')]))).dives[0]).toMatchObject({ part: 0, parts: 1 });
    expect(normalizeDeck(deck(clip('one'), 'one')).dives[0]).toMatchObject({ group: null, part: 0, parts: 1 });
  });
  it.each([
    ['empty', () => deck(group('group', []))],
    ['non-array', () => deck({ id: 'group', title: 'Bad', clips: null })],
    ['nested', () => deck(group('group', [group('inner')]))],
    ['duplicate group/clip', () => deck(group('one'))],
    ['duplicate main/group', () => deck(group('main'), 'main')],
    ['duplicate member', () => deck(group('group', [clip('one'), clip('one')]))],
    ['duplicate groups', () => { const d = deck(); d.chapters[0].dives.push(group('group', [clip('other')])); return d; }],
    ['unreferenced', () => { const d = deck(); d.chapters[0].clips[0].doors = []; return d; }],
    ['missing title', () => deck({ ...group(), title: undefined })],
    ['bridge at first', () => deck(group('group', [clip('one', { join: 'cut', bridge: 0.5 })]))],
    ['bridge without cut', () => deck(group('group', [clip('one'), clip('two', { bridge: 0.5 })]))],
    ['parent cycle', () => { const d = deck(); d.chapters[0].clips[0].doors = []; d.chapters[0].dives[0].clips[0].doors = [{ to: 'group' }]; return d; }],
  ])('rejects %s', (_, make) => expect(() => normalizeDeck(make())).toThrow());
  it('cuts only from the ended preceding member', () => {
    const m = normalizeDeck(deck()), a = m.ids.get('one'), b = m.ids.get('two');
    expect(canCutJoin(a, b, 2, 2, 'next')).toBe(true);
    for (const [t, dir] of [[1, 'next'], [2, 'jump'], [2, 'prev']]) expect(canCutJoin(a, b, t, 2, dir)).toBe(false);
    expect(canCutJoin(m.clips[0], b, 2, 2, 'next')).toBe(false);
  });
  it('documents a group under its title with members and parent door', () => {
    const d = deck(); d.chapters[0].dives[0].clips[0] = clip('one', { duration: undefined, script: [{ id: 'a', text: 'First.' }] });
    const text = renderScript(d);
    expect(text).toContain('### 深掘り Group title `group`');
    expect(text).toContain('降り口の札は「Why?」');
    expect(text).toContain('#### 深掘り one `one`');
    expect(text.indexOf('深掘り two')).toBeLessThan(text.indexOf('深掘り three'));
  });
});
