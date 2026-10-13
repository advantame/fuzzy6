import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SETTINGS, queryTiming, sha256, validateWav, collectLines } from '../tools/narrate/core.mjs';
import { inspectAssets } from '../tools/narrate/assets.mjs';

// No engine process or network requests in this suite: only the local adapter is mocked.
const engine = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), request: vi.fn(), style: vi.fn() }));
vi.mock('../tools/narrate/engine.mjs', () => ({
  startSupervisedEngine: engine.start, request: engine.request, resolveStyle: engine.style, TOTAL_MS: 1800000,
}));
import { generate, prune } from '../tools/narrate.mjs';
import { testOgg } from './fixtures/narrate-data.js';
const encodeAudio = wav => {
  const master = validateWav(wav), samples48 = master.samples * 2;
  const bytes = testOgg(samples48);
  return { bytes, sha256: sha256(bytes), master, samples48 };
};

const actor = { name: '四国めたん', speaker: '四国めたん', style: 'ノーマル' };
const voice = { cast: { metan: actor } };
const line = { by: 'metan', clipId: 'sample', lineId: 'a', source: 'アイ', anchors: [{ name: 'point', offset: 1 }] };
const mora = (text) => ({ text, vowel: text === 'ア' ? 'a' : 'i', vowel_length: 0.1, consonant_length: null, pitch: 5 });
const full = { ...SETTINGS, speedScale: 1, kana: "ア'イ", accent_phrases: [{ moras: [mora('ア'), mora('イ')] }] };
let root, voiceDir;
function wavFor(query) {
  const size = queryTiming(query).frames * 256 * 2;
  const b = Buffer.alloc(44 + size);
  b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(24000, 24); b.writeUInt32LE(48000, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(size, 40);
  b.writeInt16LE(100, 44);
  return b;
}
beforeEach(async () => {
  vi.resetAllMocks();
  root = await mkdtemp(join(tmpdir(), 'narrate-generate-test-'));
  voiceDir = join(root, 'voice');
  await mkdir(voiceDir);
  engine.start.mockResolvedValue({ identity: { pid: 123 }, stop: engine.stop });
  engine.stop.mockResolvedValue();
  engine.style.mockResolvedValue(2);
  engine.request.mockImplementation(async (path, options) => {
    if (path === '/user_dict') return {};
    if (path === '/audio_query') return structuredClone(options.params.text === 'ア' ? { ...full, accent_phrases: [{ moras: [mora('ア')] }] } : full);
    if (path === '/synthesis') return wavFor(options.body);
    throw new Error(`Unexpected request ${path}`);
  });
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
const run = async (speeds = ['1']) => {
  const state = await inspectAssets(voiceDir, [line], voice, speeds);
  await generate(root, voiceDir, state, voice, new AbortController().signal, { tools: {}, encodeAudio });
  return state;
};

describe('generation with a fake local engine', () => {
  it('synthesizes per-line deck speeds by default and preserves unused comparison takes', async () => {
    const lines = collectLines({ voice, chapters: [{ clips: [{ id: 'sample', script: [
      { id: 'a', text: 'アイ' }, { id: 'b', text: 'アイ', speed: 'slow' }, { id: 'c', text: 'アイ', speed: 'fast' },
    ] }] }] });
    const state = await inspectAssets(voiceDir, lines, voice);
    await generate(root, voiceDir, state, voice, new AbortController().signal, { tools: {}, encodeAudio });
    expect(engine.request.mock.calls.filter(([path]) => path === '/synthesis').map(([, o]) => o.body.speedScale))
      .toEqual([1.3, 1.1, 1.5]);
    engine.request.mockClear();
    const comparison = await inspectAssets(voiceDir, lines, voice, ['1.2']);
    expect(comparison.unused).toEqual([]);
    await generate(root, voiceDir, comparison, voice, new AbortController().signal, { tools: {}, encodeAudio });
    expect(engine.request.mock.calls.filter(([path]) => path === '/synthesis').map(([, o]) => o.body.speedScale))
      .toEqual([1.2, 1.2, 1.2]);
    const next = await inspectAssets(voiceDir, lines, voice);
    expect(next.plan.map(p => p.status)).toEqual(['ready', 'ready', 'ready']);
    expect(next.unused.map(p => p.speed)).toEqual(['1.2', '1.2', '1.2']);
    engine.start.mockClear();
    await generate(root, voiceDir, next, voice, new AbortController().signal, { tools: {}, encodeAudio });
    expect(engine.start).not.toHaveBeenCalled();
    expect((await inspectAssets(voiceDir, lines, voice)).unused).toHaveLength(3);
  });
  it('regenerates a pruned speed as missing even though the original master remains', async () => {
    await run(['1', '1.5']);
    const lines = [{ ...line, speed: '1.5' }];
    await prune(voiceDir, await inspectAssets(voiceDir, lines, voice), new AbortController().signal);
    const before = await readFile(join(voiceDir, 'sample/a@1.wav'));
    const state = await inspectAssets(voiceDir, lines, voice, ['1']);
    expect(state.plan[0].status).toBe('missing');
    engine.request.mockClear();
    await generate(root, voiceDir, state, voice, new AbortController().signal, { tools: {}, encodeAudio });
    expect(engine.request.mock.calls.filter(([path]) => path === '/synthesis')).toHaveLength(1);
    const next = await inspectAssets(voiceDir, lines, voice, ['1']);
    expect(next.plan[0].status).toBe('ready');
    expect(next.manifest._retired['sample/a@1.opus']).toBeUndefined();
    expect((await readFile(join(voiceDir, 'sample/a@1.wav'))).equals(before)).toBe(true);
  });
  it('uses fixed settings, full-query timing, and the specified manifest paths', async () => {
    await run(['0.9', '1']);
    const requests = engine.request.mock.calls;
    expect(requests.filter(([path]) => path === '/audio_query')).toHaveLength(2); // one full + one prefix, shared across speeds
    const synth = requests.filter(([path]) => path === '/synthesis');
    expect(synth).toHaveLength(2);
    expect(synth[0][1].body).toMatchObject({ ...SETTINGS, speedScale: 0.9 });
    expect(synth[0][1].params).toEqual({ speaker: 2, core_version: '0.16.1', enable_interrogative_upspeak: true });
    const manifest = JSON.parse(await readFile(join(voiceDir, 'manifest.json'), 'utf8'));
    expect(manifest).toMatchObject({ version: 2, engine: { name: 'VOICEVOX', version: '0.25.2' } });
    expect(manifest.voice).toBeUndefined();
    expect(manifest.clips.sample.a).toMatchObject({ by: 'metan', speaker: actor.speaker, style: actor.style });
    const record = manifest.clips.sample.a;
    expect(record.source).toBe('アイ'); expect(record.reading).toBe("ア'イ");
    expect(record.takes['1'].anchors.point).toBe(0.149);
    expect(record.takes['1'].file).toBe('sample/a@1.opus');
    expect(record.takes['1'].sha256).toBe(sha256(await readFile(join(voiceDir, 'sample/a@1.opus'))));
    expect(record.takes['1'].master).toEqual({ file: 'sample/a@1.wav', sha256: sha256(await readFile(join(voiceDir, 'sample/a@1.wav'))) });
    expect(engine.stop).toHaveBeenCalledOnce();
    await expect(access(join(voiceDir, '.narrate-lock'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('does not start an engine or rewrite a fully matching manifest', async () => {
    await run();
    const before = await readFile(join(voiceDir, 'manifest.json'));
    engine.start.mockClear(); engine.request.mockClear();
    await run();
    expect(engine.start).not.toHaveBeenCalled(); expect(engine.request).not.toHaveBeenCalled();
    expect((await readFile(join(voiceDir, 'manifest.json'))).equals(before)).toBe(true);
  });
  it('refuses synthesis on a prefix mismatch and still stops the engine', async () => {
    engine.request.mockResolvedValueOnce({});
    engine.request.mockResolvedValueOnce(structuredClone(full));
    engine.request.mockResolvedValueOnce({ accent_phrases: [{ moras: [mora('ウ')] }] });
    await expect(run()).rejects.toThrow('sample/a {point}');
    expect(engine.request.mock.calls.some(([path]) => path === '/synthesis')).toBe(false);
    expect(engine.stop).toHaveBeenCalledOnce();
    await expect(access(join(voiceDir, 'sample/a@1.wav'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(access(join(voiceDir, '.narrate-lock'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('rejects a WAV duration mismatch before saving the recording', async () => {
    engine.request.mockImplementation(async (path, options) => {
      if (path === '/user_dict') return {};
      if (path === '/synthesis') return wavFor({ ...full, speedScale: 0.5 });
      return options.params.text === 'ア' ? { ...full, accent_phrases: [{ moras: [mora('ア')] }] } : full;
    });
    await expect(run()).rejects.toThrow('0.02秒');
    await expect(access(join(voiceDir, 'sample/a@1.wav'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(engine.stop).toHaveBeenCalledOnce();
  });
  it('retains the first successful take if the next synthesis fails', async () => {
    const implementation = engine.request.getMockImplementation();
    engine.request.mockImplementation(async (path, options) => {
      if (path === '/synthesis' && options.body.speedScale === 1) throw new Error('simulated failure');
      return implementation(path, options);
    });
    await expect(run(['0.9', '1'])).rejects.toThrow('simulated failure');
    const state = await inspectAssets(voiceDir, [line], voice, ['0.9', '1']);
    expect(state.plan.map(p => p.status)).toEqual(['ready', 'missing']);
    expect(engine.stop).toHaveBeenCalledOnce();
  });
});

it('resolves engine style IDs once per narrator and records per-line mouth and identity', async () => {
  const castVoice = { cast: { metan: actor, zunda: { name: 'ずんだもん', speaker: 'ずんだもん', style: 'ノーマル' } } };
  engine.style.mockImplementation(async actor => actor.speaker === '四国めたん' ? 2 : 3);
  const lines = collectLines({ voice: castVoice, chapters: [{ clips: [{ id: 'sample', script: [
    { id: 'a', text: 'アイ' }, { id: 'b', text: 'アイ', by: 'zunda' }, { id: 'c', text: 'アイ', by: 'metan' },
  ] }] }] });
  const state = await inspectAssets(voiceDir, lines, castVoice);
  await generate(root, voiceDir, state, castVoice, new AbortController().signal, { tools: {}, encodeAudio });
  expect(engine.style.mock.calls.map(([actor]) => actor.speaker)).toEqual(['四国めたん', 'ずんだもん']);
  expect(engine.request.mock.calls.filter(([path]) => path === '/audio_query').map(([, options]) => options.params.speaker)).toEqual([2, 3, 2]);
  expect(engine.request.mock.calls.filter(([path]) => path === '/synthesis').map(([, options]) => options.params.speaker)).toEqual([2, 3, 2]);
  const manifest = JSON.parse(await readFile(join(voiceDir, 'manifest.json'), 'utf8'));
  expect(manifest.version).toBe(2);
  expect(manifest.voice).toBeUndefined();
  expect(manifest.clips.sample.b).toMatchObject({ by: 'zunda', speaker: 'ずんだもん', style: 'ノーマル' });
  for (const entry of Object.values(manifest.clips.sample)) {
    expect(entry.takes['1.3'].mouth).toEqual([[0, 'x'], [0.043, 'a'], [0.117, 'i'], [0.192, 'x']]);
  }
  expect((await inspectAssets(voiceDir, lines, castVoice)).plan.every(p => p.status === 'ready')).toBe(true);
});

it('plans and records dives in parent-first order with the fake engine', async () => {
  const make = (id, speed) => ({ id, script: [{ id: 'a', text: 'アイ', speed }] });
  const parent = { ...make('parent', 'fast'), doors: [{ to: 'detail', label: 'detail' }] };
  const deck = { voice, chapters: [{ clips: [parent, make('next')], dives: [make('detail', 'slow')] }] };
  const lines = collectLines(deck);
  const state = await inspectAssets(voiceDir, lines, voice);
  expect(state.plan.map(p => [p.line.clipId, p.speed])).toEqual([['parent', '1.5'], ['detail', '1.1'], ['next', '1.3']]);
  await generate(root, voiceDir, state, voice, new AbortController().signal, { tools: {}, encodeAudio });
  expect(Object.keys(state.manifest.clips)).toEqual(['parent', 'detail', 'next']);
  expect(state.manifest.clips.detail.a.takes['1.1'].file).toBe('detail/a@1.1.opus');
  expect((await inspectAssets(voiceDir, collectLines(deck, ['detail']), voice)).plan.map(p => p.status)).toEqual(['ready']);
});
