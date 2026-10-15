import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SETTINGS, collectLines, parseArgs, queryTiming, validateWav, sha256 } from '../tools/narrate/core.mjs';
import { inspectAssets } from '../tools/narrate/assets.mjs';
import { testWav, testOgg } from './fixtures/narrate-data.js';

const engine = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), request: vi.fn(), style: vi.fn() }));
vi.mock('../tools/narrate/engine.mjs', () => ({
  startSupervisedEngine: engine.start, request: engine.request, resolveStyle: engine.style, TOTAL_MS: 1800000,
}));
import { main, generate } from '../tools/narrate.mjs';
import { inspectQueries, formatInspection } from '../tools/narrate/inspect.mjs';

const tool = { word: 'ツール', kana: 'ツール', accent: 'flat', long: 2 };
const actor = { name: '四国めたん', speaker: '四国めたん', style: 'ノーマル' };
const deck = () => ({ voice: { cast: { metan: actor }, lexicon: [tool] }, chapters: [{ clips: [{ id: 'sample', script: [
  { id: 'a', text: 'ツール{point}を' }, { id: 'b', text: 'ツールを', speed: 'slow' },
] }] }] });
const m = (text, vowel, consonant = null) => ({ text, vowel, consonant, vowel_length: 0.1, consonant_length: consonant ? 0.05 : null, pitch: 5.25 });
const full = { ...SETTINGS, speedScale: 1, kana: "ツウルオ'", accent_phrases: [{
  accent: 4, moras: [m('ツ', 'u', 'ts'), m('ウ', 'u'), m('ル', 'u', 'r'), m('オ', 'o')], pause_mora: null, is_interrogative: false,
}] };
const encodeAudio = wav => {
  const master = validateWav(wav), samples48 = master.samples * 2, bytes = testOgg(samples48);
  return { bytes, sha256: sha256(bytes), master, samples48 };
};
let root, dictionary, queries, log;
beforeEach(async () => {
  vi.resetAllMocks();
  root = await mkdtemp(join(tmpdir(), 'narrate-inspect-test-'));
  dictionary = {}; queries = [];
  let next = 0;
  engine.start.mockResolvedValue({ identity: { pid: 123 }, stop: engine.stop });
  engine.style.mockResolvedValue(2);
  engine.request.mockImplementation(async (path, options) => {
    if (path === '/user_dict') return structuredClone(dictionary);
    if (path.startsWith('/user_dict_word/') && options.method === 'DELETE') { delete dictionary[path.split('/').at(-1)]; return; }
    if (path === '/user_dict_word') {
      const id = `00000000-0000-4000-8000-${String(++next).padStart(12, '0')}`;
      dictionary[id] = options.params; return id;
    }
    if (path === '/audio_query') {
      // Every full AND anchor-prefix query must see the already synchronized dictionary.
      expect(Object.values(dictionary)).toEqual([{ surface: 'ツール', pronunciation: 'ツール', accent_type: 0, word_type: 'PROPER_NOUN', priority: 5 }]);
      expect(options.identity).toEqual({ pid: 123 });
      expect(options.params).toMatchObject({ speaker: 2, core_version: '0.16.1' });
      queries.push(options.params.text);
      const q = structuredClone(full);
      if (options.params.text === 'ツール') q.accent_phrases[0].moras.pop();
      return q;
    }
    if (path === '/synthesis') return testWav(queryTiming(options.body).frames * 256);
    throw new Error(`Unexpected request: ${path}`);
  });
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(async () => { log.mockRestore(); await rm(root, { recursive: true, force: true }); });
const output = () => log.mock.calls.map(args => args.join(' ')).join('\n');

it('parses inspect/json with exactly one clip, exclusive modes, and speed overrides', () => {
  expect(parseArgs(['llm', 'timeline', '--inspect', '--json', '--speeds', '1.1,1.5'])).toMatchObject({ inspect: true, json: true, speeds: ['1.1', '1.5'] });
  for (const flag of ['--generate', '--encode', '--prune', '--dry-run']) expect(() => parseArgs(['llm', 'timeline', '--inspect', flag])).toThrow('同時');
  for (const args of [['llm', '--inspect'], ['llm', 'a', 'b', '--inspect'], ['llm', '--json']]) expect(() => parseArgs(args)).toThrow();
});

it('prints a human-readable table of post-long moras, raw pitch/length, accents and sentence speeds', async () => {
  await main(['test', 'sample', '--inspect'], { root, load: async () => deck() });
  expect(output()).toContain('sample/a\tmetan (四国めたん / ノーマル)\t話速=1.3');
  expect(output()).toContain('sample/b\tmetan (四国めたん / ノーマル)\t話速=1.1');
  expect(output()).toContain("読み（カナ）: ツウルオ'");
  expect(output()).toContain('1\t4\t2\tウ\t5.250000\t—\t0.200000');
  expect(output()).toContain('話速適用前');
  expect(engine.stop).toHaveBeenCalledOnce();
  expect(engine.request.mock.calls.some(([p]) => p === '/synthesis')).toBe(false);
});

it('emits parseable JSON, honors explicit speeds, and never opens/writes voice assets or manifests', async () => {
  const dir = join(root, 'decks/test/voice');
  await mkdir(dir, { recursive: true });
  // Deliberately invalid manifest and unowned audio: inspection must not consult
  // generation's asset planner, attempt recovery, or take its writer lock.
  await writeFile(join(dir, 'manifest.json'), 'leave this pending recording alone');
  await writeFile(join(dir, 'untouched.opus'), 'tiny audio sentinel');
  const before = await Promise.all(['manifest.json', 'untouched.opus'].map(file => readFile(join(dir, file))));
  await main(['test', 'sample', '--inspect', '--json', '--speeds', '1,1.5'], { root, load: async () => deck() });
  const result = JSON.parse(output());
  expect(result.map(r => [r.lineId, r.query.speedScale])).toEqual([['a', 1], ['a', 1.5], ['b', 1], ['b', 1.5]]);
  expect(result[0].query.accent_phrases[0].moras[1].vowel_length).toBe(0.2);
  expect(result[0].query.accent_phrases[0].accent).toBe(4);
  expect(result[0].query.kana).toBe(full.kana);
  expect(result[0].duration).toBeGreaterThan(result[1].duration);
  expect(queries).toEqual(['ツールを', 'ツール', 'ツールを']);
  expect(await readdir(dir)).toEqual(['manifest.json', 'untouched.opus']);
  for (const [i, file] of ['manifest.json', 'untouched.opus'].entries()) expect((await readFile(join(dir, file))).equals(before[i])).toBe(true);
  expect(await readdir(join(root, '.cache/voicevox'))).toEqual(['managed-words.json']);
  expect(engine.request.mock.calls.some(([p]) => p === '/synthesis')).toBe(false);
  expect(engine.stop).toHaveBeenCalledOnce();
});

it('dry-run lists only each sentence’s applicable lexicon without starting an engine or writing files', async () => {
  const d = deck(); d.chapters[0].clips[0].script[1].text = '[ツール|ツウル]';
  await main(['test', 'sample'], { root, load: async () => d });
  expect(output()).toContain('語彙: {"word":"ツール","kana":"ツール","accent":"flat","long":2,"type":"proper","priority":5}');
  expect(output()).toContain('語彙: なし');
  expect(engine.start).not.toHaveBeenCalled();
  expect(await readdir(root)).toEqual([]);
});

it('inspects page timing after long-vowel and speed adjustments without writing a recording', async () => {
  const d = deck();
  d.chapters[0].clips[0].script[0].text = 'ツール\n\n{point}を';
  await main(['test', 'sample', '--inspect', '--json', '--speeds', '1,1.5'], { root, load: async () => d });
  const result = JSON.parse(output());
  expect(result[0].pages).toEqual([0.555]);
  expect(result[0].pages).toEqual([result[0].anchors.point]);
  expect(result[1].pages[0]).toBeLessThan(result[0].pages[0]);
  expect(result[2].pages).toBeUndefined();
  expect(formatInspection(result[0])).toContain('字幕の替わり目（音声の頭からの秒）: 0.555000');
  expect(queries).toEqual(['ツールを', 'ツール', 'ツールを']);
  expect(await readdir(root)).toEqual(['.cache']);
  expect(engine.request.mock.calls.some(([p]) => p === '/synthesis')).toBe(false);
});

it('stops the engine on inspection failure and on early iterator exit', async () => {
  const implementation = engine.request.getMockImplementation();
  engine.request.mockImplementation(async (path, opts) => {
    if (path === '/audio_query') throw new Error('fake query failure');
    return implementation(path, opts);
  });
  await expect(main(['test', 'sample', '--inspect'], { root, load: async () => deck() })).rejects.toThrow('sample/a: fake query failure');
  expect(engine.stop).toHaveBeenCalledOnce();
  engine.request.mockImplementation(implementation); engine.stop.mockClear();
  for await (const result of inspectQueries(root, collectLines(deck()), deck().voice, null, new AbortController().signal)) {
    expect(formatInspection(result)).toContain('sample/a'); break;
  }
  expect(engine.stop).toHaveBeenCalledOnce();
});

it('checks dictionary ownership even on inspection and makes no mutations on a foreign entry', async () => {
  dictionary['00000000-0000-4000-8000-000000009999'] = { surface: 'foreign' };
  await expect(main(['test', 'sample', '--inspect'], { root, load: async () => deck() })).rejects.toThrow('控えにない');
  expect(engine.request.mock.calls.map(([p]) => p)).toEqual(['/user_dict']);
  expect(await readdir(root)).toEqual([]);
  expect(engine.stop).toHaveBeenCalledOnce();
});

it('synthesis uses post-long anchor, mouth and duration, and preserves other matching speeds', async () => {
  const d = deck(), lines = collectLines(d), dir = join(root, 'voice');
  const state = await inspectAssets(dir, lines, d.voice, ['1', '1.5']);
  await generate(root, dir, state, d.voice, new AbortController().signal, { tools: {}, encodeAudio });
  const synth = engine.request.mock.calls.filter(([p]) => p === '/synthesis');
  expect(synth).toHaveLength(4);
  const current = synth[0][1].body;
  expect(current.accent_phrases[0].moras[1].vowel_length).toBe(0.2);
  const take = state.manifest.clips.sample.a.takes['1'];
  // pre=5 frames, ts=5, u=9, long u=19, r=5, u=9 => 52/93.75.
  expect(take.anchors.point).toBe(0.555);
  expect(take.mouth).toContainEqual([0.555, 'o']);
  expect(take.duration).toBe(Math.round(queryTiming(current).duration * 1000) / 1000);
  expect(queries).toEqual(['ツールを', 'ツール', 'ツールを']);
  expect(Object.keys(state.manifest.clips.sample.a.takes)).toEqual(['1', '1.5']);
  expect((await inspectAssets(dir, lines, d.voice, ['1', '1.5'])).plan.map(p => p.status)).toEqual(['ready', 'ready', 'ready', 'ready']);
  expect(engine.stop).toHaveBeenCalledOnce();
});

it('a long-vowel match-count mismatch prevents synthesis and still closes both engine and writer', async () => {
  const implementation = engine.request.getMockImplementation();
  engine.request.mockImplementation(async (path, opts) => {
    const response = await implementation(path, opts);
    if (path === '/audio_query') response.accent_phrases[0].moras[1].text = 'イ';
    return response;
  });
  const d = deck(), lines = collectLines(d), dir = join(root, 'voice');
  const state = await inspectAssets(dir, lines, d.voice, ['1']);
  await expect(generate(root, dir, state, d.voice, new AbortController().signal, { tools: {}, encodeAudio })).rejects.toThrow('sample/a: 語彙 ツール');
  expect(engine.request.mock.calls.some(([p]) => p === '/synthesis')).toBe(false);
  expect(await readdir(dir)).toEqual(['manifest.json']);
  expect(engine.stop).toHaveBeenCalledOnce();
});

it('returns an empty JSON array without starting an engine for a clip with no speech', async () => {
  const d = deck(); d.chapters[0].clips[0].script = [];
  await main(['test', 'sample', '--inspect', '--json'], { root, load: async () => d });
  expect(JSON.parse(output())).toEqual([]);
  expect(engine.start).not.toHaveBeenCalled();
  expect(await readdir(root)).toEqual([]);
});

it('inspection accepts a dive ID through the CLI using only the mocked engine', async () => {
  const d = deck(), detail = { ...d.chapters[0].clips[0], id: 'detail' };
  d.chapters[0].clips = [{ id: 'parent', script: [{ id: 'a', lead: 1 }], doors: [{ to: 'detail', label: 'detail' }] }];
  d.chapters[0].dives = [detail];
  await main(['test', 'detail', '--inspect', '--json'], { root, load: async () => d });
  expect(JSON.parse(output()).map(r => [r.clipId, r.lineId])).toEqual([['detail', 'a'], ['detail', 'b']]);
  expect(engine.request.mock.calls.some(([path]) => path === '/synthesis')).toBe(false);
  expect(engine.stop).toHaveBeenCalledOnce();
  expect(await readdir(root)).toEqual(['.cache']);
});
