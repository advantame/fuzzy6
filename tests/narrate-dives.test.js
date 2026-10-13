import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { collectClips, collectLines, ENGINE_INFO, generationHash, sha256 } from '../tools/narrate/core.mjs';
import { inspectAssets, applyRecording } from '../tools/narrate/assets.mjs';
import { normalizeDeck } from '../src/explorer/model.js';
import { testWav, testOgg } from './fixtures/narrate-data.js';

// CLI coverage uses small synthetic files only. Fail if any mode tries to start
// a real engine; codec conversion is also replaced, so no child process is used.
const engine = vi.hoisted(() => ({ start: vi.fn(() => { throw new Error('No engine in this suite'); }) }));
vi.mock('../tools/narrate/engine.mjs', () => ({
  startSupervisedEngine: engine.start, request: vi.fn(), resolveStyle: vi.fn(), TOTAL_MS: 1800000,
}));
vi.mock('../tools/narrate/opus.mjs', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, opusTools: () => ({}), encodeOpus: bytes => ({
    bytes: testOgg((bytes.length - 44) / 2 * 2),
    sha256: sha256(testOgg((bytes.length - 44) / 2 * 2)),
    master: { duration: (bytes.length - 44) / 48000, samples: (bytes.length - 44) / 2 },
    samples48: bytes.length - 44,
  }) };
});
import { main } from '../tools/narrate.mjs';
const voice = { cast: { metan: { name: 'Metan', speaker: '四国めたん', style: 'ノーマル' } } };
const c = (id, targets = [], text = 'アイ') => ({ id, setup() {},
  script: [{ id: 'a', text }], doors: targets.map(to => ({ to, label: to })) });
function deck() {
  return { voice, chapters: [
    { id: 'first', clips: [c('parent', ['detail']), c('next', ['detail'])], dives: [c('nested'), c('detail', ['nested'])] },
    { id: 'second', clips: [c('last')], dives: [c('silent', [], undefined)] },
  ] };
}
// Silent dive comes from a cross-chapter door on nested, not its declaring chapter.
function data() {
  const d = deck();
  d.chapters[0].dives[0].doors = [{ to: 'silent', label: 'silent' }];
  d.chapters[1].dives[0].script = [{ id: 'a', lead: 1 }];
  return d;
}
let root, dir, log;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'narrate-dives-'));
  dir = join(root, 'decks/test/voice');
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
  engine.start.mockClear();
});
afterEach(async () => {
  log.mockRestore();
  await rm(root, { recursive: true, force: true });
  expect(engine.start).not.toHaveBeenCalled();
});
const output = () => log.mock.calls.map(([text]) => text);
const ids = ['parent', 'detail', 'nested', 'silent', 'next', 'last'];
async function recordings(d, { wavOnly = false } = {}) {
  const manifest = { version: 2, engine: ENGINE_INFO, clips: {} };
  const wav = testWav(4800), opus = testOgg(9600);
  // Deliberately reverse the manifest order to exercise encoding order separately.
  for (const line of collectLines(d).toReversed()) {
    await mkdir(join(dir, line.clipId), { recursive: true });
    for (const speed of ['1.3', '1.5']) {
      const base = `${line.clipId}/${line.lineId}@${speed}`;
      const master = { file: `${base}.wav`, sha256: sha256(wav) };
      const take = { file: `${base}.${wavOnly ? 'wav' : 'opus'}`, sha256: sha256(wavOnly ? wav : opus),
        duration: 0.2, anchors: {}, mouth: [[0, 'a']], generationSha256: generationHash(line, d.voice, speed),
        ...(wavOnly ? {} : { master }) };
      applyRecording(manifest, { line, voice: d.voice.cast.metan, speed, take, reading: 'アイ' });
      await writeFile(join(dir, master.file), wav);
      if (!wavOnly) await writeFile(join(dir, take.file), opus);
    }
  }
  await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest));
}

describe('narration includes dives', () => {
  it('matches capture/model order for nested, shared and cross-chapter dives', () => {
    const d = data();
    expect(collectClips(d).map(c => c.id)).toEqual(ids);
    expect(collectClips(d).map(c => c.id)).toEqual(normalizeDeck(d).all.map(e => e.clip.id));
    expect(collectLines(d).map(l => l.clipId)).toEqual(ids.filter(id => id !== 'silent'));
    expect(collectLines(d, ['next', 'detail']).map(l => l.clipId)).toEqual(['detail', 'next']);
    expect(collectLines(d, ['silent'])).toEqual([]);
    expect(() => collectLines(d, ['absent'])).toThrow('クリップがありません');
  });
  it('accepts draft scripts without setup or duration and keeps decks without dives in order', () => {
    const d = data();
    for (const chapter of d.chapters) for (const clip of [...chapter.clips, ...chapter.dives]) delete clip.setup;
    expect(collectLines(d, ['detail']).map(l => l.clipId)).toEqual(['detail']);
    expect(collectLines({ voice, chapters: [{ clips: [c('a'), c('b')] }] }).map(l => l.clipId)).toEqual(['a', 'b']);
  });
  it('checks IDs across the main line and dives before filtering', () => {
    const d = data(); d.chapters[0].dives[1].id = 'parent';
    expect(() => collectLines(d, ['last'])).toThrow('重複したclip ID');
    d.chapters[0].dives[1].id = '../detail';
    expect(() => collectLines(d)).toThrow('不正または重複');
  });
  it('dry-run lists and selects dives without writing any files', async () => {
    const d = data();
    await main(['test'], { root, load: async () => d });
    expect(output().filter(s => s.includes('/a\t')).map(s => s.split('/')[0])).toEqual(ids.filter(id => id !== 'silent'));
    log.mockClear();
    await main(['test', 'detail'], { root, load: async () => d });
    expect(output().filter(s => s.includes('/a\t'))).toHaveLength(1);
    expect(output().join('\n')).toContain('detail/a\t');
    expect(await readdir(root)).toEqual([]);
  });
  it('compares dive scripts with ready, stale and missing recordings', async () => {
    const d = data(); await recordings(d);
    const detail = d.chapters[0].dives[1];
    detail.script[0].text = 'アウ';
    detail.script.push({ id: 'b', text: 'イ' });
    const state = await inspectAssets(dir, collectLines(d), d.voice);
    expect(state.plan.map(p => [p.line.clipId, p.line.lineId, p.status])).toEqual([
      ['parent', 'a', 'ready'], ['detail', 'a', 'stale'], ['detail', 'b', 'missing'],
      ['nested', 'a', 'ready'], ['next', 'a', 'ready'], ['last', 'a', 'ready'],
    ]);
  });
  it('encode follows parent-first order and accepts a dive ID while preserving other recordings', async () => {
    const d = data(); await recordings(d, { wavOnly: true });
    await main(['test', 'detail', '--encode'], { root, load: async () => d });
    let m = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
    expect(m.clips.detail.a.takes['1.3'].file).toBe('detail/a@1.3.opus');
    expect(m.clips.parent.a.takes['1.3'].file).toBe('parent/a@1.3.wav');
    log.mockClear();
    await main(['test', '--encode'], { root, load: async () => d });
    expect(output().filter(s => /\t(?:ready|encode)$/.test(s)).map(s => s.split('/')[0]))
      .toEqual(ids.filter(id => id !== 'silent').flatMap(id => [id, id]));
    m = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
    expect(m.clips.nested.a.takes['1.3'].file).toBe('nested/a@1.3.opus');
  });
  it('prune selects dive recordings and retains the main line and all masters', async () => {
    const d = data(); await recordings(d);
    await main(['test', 'detail', '--prune'], { root, load: async () => d });
    const m = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
    expect(Object.keys(m.clips.detail.a.takes)).toEqual(['1.3']);
    expect(Object.keys(m.clips.parent.a.takes)).toEqual(['1.3', '1.5']);
    expect(await readdir(join(dir, 'detail'))).toEqual(['a@1.3.opus', 'a@1.3.wav', 'a@1.5.wav']);
    log.mockClear();
    await main(['test', '--prune'], { root, load: async () => d });
    expect(output().filter(s => s.includes('使っていない録り')).map(s => s.split('/')[0]))
      .toEqual(['parent', 'nested', 'next', 'last']);
  });
});

it('encoding keeps old speech on silent dives in deck order and removed clips after the deck', async () => {
  const d = data();
  d.chapters[1].dives[0].script = [{ id: 'a', text: 'アイ' }];
  d.chapters[1].clips.push(c('removed'));
  await recordings(d, { wavOnly: true });
  d.chapters[1].dives[0].script = [{ id: 'a', lead: 1 }];
  d.chapters[1].clips.pop();
  await main(['test', '--encode'], { root, load: async () => d });
  expect(output().filter(s => /\tencode$/.test(s)).map(s => s.split('/')[0]))
    .toEqual([...ids, 'removed'].flatMap(id => [id, id]));
  const m = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
  expect(m.clips.silent.a.source).toBe('アイ');
  expect(m.clips.silent.a.takes['1.3'].file).toBe('silent/a@1.3.opus');
  expect(m.clips.removed.a.takes['1.3'].file).toBe('removed/a@1.3.opus');
});
