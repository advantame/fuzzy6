import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { findEndings, deckEndings, formatEnding } from '../tools/narrate/endings.mjs';
import { main } from '../tools/narrate.mjs';

const context = { deckId: 'test', clipId: 'clip', defaultBy: 'metan' };
const rows = (...texts) => texts.map((text, i) => ({ id: `line-${i}`, text }));
const find = script => findEndings(script, context);
const empty = { adjacent: [], alternating: [] };
const voice = { cast: {
  metan: { name: 'めたん', speaker: '四国めたん', style: 'ノーマル' },
  zunda: { name: 'ずんだもん', speaker: 'ずんだもん', style: 'ノーマル' },
} };

describe('narration sentence endings', () => {
  it('reports both row IDs and display sentences for adjacent endings', () => {
    const result = find(rows('最初なの。', '次なの。'));
    expect(result).toEqual({ alternating: [], adjacent: [{
      deckId: 'test', clipId: 'clip',
      first: { lineId: 'line-0', by: 'metan', text: '最初なの。' },
      second: { lineId: 'line-1', by: 'metan', text: '次なの。' },
    }] });
    expect(formatEnding(result.adjacent[0])).toBe('test/clip: line-0「最初なの。」 → line-1「次なの。」');
  });

  it('splits multiple sentences in one row and keeps all overlapping pairs', () => {
    const result = find(rows('最初なの。次なの。最後なの。'));
    expect(result.adjacent.map(p => [p.first.text, p.second.text])).toEqual([
      ['最初なの。', '次なの。'], ['次なの。', '最後なの。'],
    ]);
    expect(result.adjacent.every(p => p.first.lineId === 'line-0' && p.second.lineId === 'line-0')).toBe(true);
    expect(result.alternating).toEqual([]);
  });

  it.each(['途中です。', 'そうなの？', 'そうなの！'])(
    'splits %s and reports alternating endings only', middle => {
      const result = find(rows(`最初なの。${middle}最後なの。`));
      expect(result.adjacent).toEqual([]);
      expect(result.alternating.map(p => [p.first.text, p.second.text])).toEqual([['最初なの。', '最後なの。']]);
    });

  it('uses display text, removes marks and emphasis, and handles caption line breaks', () => {
    const result = find(rows('{start}**[最初|サイショ？]な\nの。**{end}', '[次なの。|ツギダヨ]'));
    expect(result.adjacent.map(p => [p.first.text, p.second.text])).toEqual([['最初なの。', '次なの。']]);
    expect(find(rows('[最初です。|サイショナノ。]', '次なの。'))).toEqual(empty);
  });

  it.each(['なのよ。', 'なのね。', 'なの？', 'なの！', 'なの', 'ので。'])(
    'does not treat %s as an exact の。 ending', text => {
      expect(find(rows(text, '次なの。'))).toEqual(empty);
    });

  it('breaks both patterns at a speaker change, including an intervening speaker', () => {
    expect(find([{ id: 'a', text: '最初なの。' }, { id: 'b', by: 'zunda', text: '次なの。' }])).toEqual(empty);
    for (const text of ['途中なの。', '途中です。']) {
      expect(find([
        { id: 'a', text: '最初なの。' }, { id: 'b', by: 'zunda', text },
        { id: 'c', text: '最後なの。' },
      ])).toEqual(empty);
    }
  });

  it('matches explicit and default speakers and allows consecutive explicit speakers', () => {
    expect(find([{ id: 'a', text: '最初なの。' }, { id: 'b', by: 'metan', text: '次なの。' }]).adjacent).toHaveLength(1);
    expect(find(rows('最初なの。途中です。最後なの。').map(row => ({ ...row, by: 'zunda' }))).alternating).toHaveLength(1);
  });

  it('retains unterminated text as a sentence and ignores silent rows', () => {
    const result = find(rows('最初なの。', '途中', '最後なの。'));
    expect(result.adjacent).toEqual([]);
    expect(result.alternating).toHaveLength(1);
    expect(find([{ id: 'a', text: '最初なの。' }, { id: 'motion', by: 'zunda', lead: 1 },
      { id: 'b', text: '次なの。' }]).adjacent).toHaveLength(1);
    expect(find([])).toEqual(empty);
  });

  it('examines conditional rows in script order', () => {
    expect(find([{ id: 'a', text: '最初なの。', when: 'q.right' },
      { id: 'b', text: '次なの。', when: 'q.wrong' }]).adjacent).toHaveLength(1);
  });

  it('never compares across clips or decks and includes dives and playback-only speakers', () => {
    const deck = { id: 'one', voice: { cast: { zunda: { name: 'ずんだもん' }, metan: { name: 'めたん' } } },
      chapters: [{ clips: [
        { id: 'first', script: rows('最初なの。') },
        { id: 'second', script: rows('次なの。'), doors: [{ to: 'detail', label: '詳細' }] },
      ], dives: [{ id: 'detail', script: rows('詳細なの。', '最後なの。') }] }] };
    const result = deckEndings(deck);
    expect(result.adjacent).toHaveLength(1);
    expect(result.adjacent[0]).toMatchObject({ deckId: 'one', clipId: 'detail', first: { by: 'zunda' } });
    expect(deckEndings(deck, { clips: ['first', 'second'] })).toEqual(empty);
    expect(deckEndings({ id: 'two', chapters: [{ clips: [{ id: 'first', script: rows('別なの。') }] }] })).toEqual(empty);
  });
});

it('confirmation lists errors and warnings for selected clips, without writing or rejecting', async () => {
  const root = await mkdtemp(join(tmpdir(), 'narrate-endings-'));
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const deck = { id: 'test', voice, chapters: [{ clips: [
    { id: 'parent', script: rows('本線なの。', '次なの。'), doors: [{ to: 'detail', label: '詳細' }] },
  ], dives: [{ id: 'detail', script: rows('詳細なの。次なの。途中です。最後なの。') }] }] };
  try {
    await main(['test', 'detail'], { root, load: async () => deck });
    const output = log.mock.calls.map(([text]) => text).join('\n');
    expect(output).toContain('隣り合う「の。」（要修正）: 1組');
    expect(output).toContain('要修正: test/detail: line-0「詳細なの。」 → line-0「次なの。」');
    expect(output).toContain('一つおきの「の。」（注意・読んで決める）: 1組');
    expect(output).toContain('注意・読んで決める: test/detail: line-0「次なの。」 → line-0「最後なの。」');
    expect(output).not.toContain('本線なの。');
    expect(await readdir(root)).toEqual([]);
  } finally {
    log.mockRestore();
    await rm(root, { recursive: true, force: true });
  }
});
