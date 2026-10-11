import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectAssets, applyRecording, openWriter } from '../tools/narrate/assets.mjs';
import { ENGINE_INFO, generationHash, sha256, validateWav } from '../tools/narrate/core.mjs';
import { testWav, testOgg } from './fixtures/narrate-data.js';

const engine = vi.hoisted(() => ({ start: vi.fn(() => { throw new Error('must not start engine'); }) }));
vi.mock('../tools/narrate/engine.mjs', () => ({
  startSupervisedEngine: engine.start, request: vi.fn(), resolveStyle: vi.fn(), TOTAL_MS: 1800000,
}));
import { encode, generate } from '../tools/narrate.mjs';
const actor = { name: '四国めたん', speaker: '四国めたん', style: 'ノーマル' };
const voice = { cast: { metan: actor } };
const line = { by: 'metan', clipId: 'sample', lineId: 'a', source: 'アイ', anchors: [{ name: 'point', offset: 1 }] };
const signal = () => new AbortController().signal;
const wav = testWav(4801), info = validateWav(wav);
const encodeAudio = vi.fn(bytes => {
  const master = validateWav(bytes), samples48 = master.samples * 2;
  const output = testOgg(samples48);
  return { bytes: output, sha256: sha256(output), master, samples48 };
});
const adapters = { tools: {}, encodeAudio };
let root, dir;
beforeEach(async () => {
  vi.clearAllMocks();
  root = await mkdtemp(join(tmpdir(), 'narrate-encode-test-'));
  dir = join(root, 'voice'); await mkdir(join(dir, 'sample'), { recursive: true });
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
async function legacy(speeds = ['1']) {
  const manifest = { version: 2, engine: ENGINE_INFO, clips: {} };
  for (const speed of speeds) {
    const file = `sample/a@${speed}.wav`;
    const take = { file, sha256: sha256(wav), duration: 0.2, mouth: [[0, 'a'], [0.1, 'x']], anchors: { point: 0.1 }, generationSha256: generationHash(line, voice, speed) };
    applyRecording(manifest, { line, voice, speed, take, reading: 'アイ' });
    await writeFile(join(dir, file), wav);
  }
  await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest));
  return manifest;
}
const inspect = (lines = [line], options) => inspectAssets(dir, lines, voice, ['1'], options);
const load = async () => JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
const run = async (lines = [line], options) => {
  const state = await inspect(lines, options);
  const result = await encode(dir, state, signal(), adapters);
  expect(engine.start).not.toHaveBeenCalled();
  return result;
};

describe('Opus delivery migration and ownership', () => {
  it('migrates every recorded speed and keeps source, reading, duration, anchors and generation hashes', async () => {
    const old = await legacy(['0.9', '1', '1.1']);
    const before = await readFile(join(dir, 'manifest.json'));
    const plan = await inspect();
    expect(plan.plan[0].status).toBe('encode');
    expect(plan.encodePlan).toHaveLength(3);
    expect((await readFile(join(dir, 'manifest.json'))).equals(before)).toBe(true);
    const results = await run([{ ...line, source: '今の原稿は変更済み' }]);
    expect(results).toHaveLength(3);
    const manifest = await load();
    const record = manifest.clips.sample.a;
    expect(record.source).toBe(old.clips.sample.a.source);
    expect(record.reading).toBe('アイ');
    for (const [speed, take] of Object.entries(record.takes)) {
      const previous = old.clips.sample.a.takes[speed];
      expect(take).toEqual({ ...previous, file: `sample/a@${speed}.opus`, sha256: sha256(testOgg(9602)), master: { file: previous.file, sha256: previous.sha256 } });
      expect((await readFile(join(dir, take.master.file))).equals(wav)).toBe(true);
    }
    expect(results[0].samples48).toBe(info.samples * 2);
    expect((await inspect([{ ...line, source: '変更' }])).plan[0].status).toBe('stale');
  });
  it('reuses a matching Opus without its master or any tools, and leaves a no-op manifest byte-identical', async () => {
    await legacy(); await run();
    await rm(join(dir, 'sample/a@1.wav'));
    const before = await readFile(join(dir, 'manifest.json'));
    const state = await inspect();
    expect(state.plan[0].status).toBe('ready');
    await encode(dir, state, signal()); // no tool resolution needed
    await generate(root, dir, state, voice, signal());
    expect(engine.start).not.toHaveBeenCalled();
    expect((await readFile(join(dir, 'manifest.json'))).equals(before)).toBe(true);
  });
  it('leaves both legacy and corrupt delivery records unchanged without masters', async () => {
    await legacy();
    await rm(join(dir, 'sample/a@1.wav'));
    const before = await readFile(join(dir, 'manifest.json'));
    expect(await run()).toEqual([]);
    expect((await readFile(join(dir, 'manifest.json'))).equals(before)).toBe(true);
    await writeFile(join(dir, 'sample/a@1.wav'), wav); await run();
    await rm(join(dir, 'sample/a@1.wav'));
    await writeFile(join(dir, 'sample/a@1.opus'), 'broken');
    const damagedBefore = await readFile(join(dir, 'manifest.json'));
    expect((await inspect()).plan[0].status).toBe('missing');
    expect(await run()).toEqual([]);
    expect((await readFile(join(dir, 'manifest.json'))).equals(damagedBefore)).toBe(true);
  });
  it('rebuilds missing/corrupt deliveries, but never overwrites an unowned file', async () => {
    await legacy(); await run();
    for (const missing of [true, false]) {
      if (missing) await rm(join(dir, 'sample/a@1.opus'));
      else await writeFile(join(dir, 'sample/a@1.opus'), 'broken');
      expect(await run()).toHaveLength(1);
      expect((await inspect()).plan[0].status).toBe('ready');
    }
    await writeFile(join(dir, 'sample/unowned@1.opus'), 'unowned');
    await expect(inspect()).rejects.toThrow('manifest にない');
  });
  it('repairs a missing delivery with --generate without starting synthesis', async () => {
    await legacy();
    await generate(root, dir, await inspect(), voice, signal(), adapters);
    expect(engine.start).not.toHaveBeenCalled();
    expect((await inspect()).plan[0].status).toBe('ready');
  });
  it('respects clip and speed selection', async () => {
    await legacy(['0.9', '1']);
    expect(await run([line], { clips: ['other'] })).toHaveLength(0);
    expect(await run([line], { encodeSpeeds: ['0.9'] })).toHaveLength(1);
    const manifest = await load();
    expect(manifest.clips.sample.a.takes['0.9'].file).toMatch(/\.opus$/);
    expect(manifest.clips.sample.a.takes['1'].file).toMatch(/\.wav$/);
  });
  it('does not record a failed derivative and releases its lock', async () => {
    await legacy();
    const before = await readFile(join(dir, 'manifest.json'));
    await expect(encode(dir, await inspect(), signal(), { tools: {}, encodeAudio() { throw new Error('decoded length mismatch'); } })).rejects.toThrow('length mismatch');
    expect((await readFile(join(dir, 'manifest.json'))).equals(before)).toBe(true);
    await expect(access(join(dir, 'sample/a@1.opus'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(access(join(dir, '.narrate-lock'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('rejects changed source hashes and a concurrent delivery edit', async () => {
    await legacy();
    const state = await inspect();
    await writeFile(join(dir, 'sample/a@1.wav'), testWav(4802));
    await expect(encode(dir, state, signal(), adapters)).rejects.toThrow('原本が変更');
    await writeFile(join(dir, 'sample/a@1.wav'), wav);
    await writeFile(join(dir, 'sample/a@1.opus'), 'concurrent edit');
    await expect(encode(dir, state, signal(), adapters)).rejects.toThrow('音声が変更');
    expect(await readFile(join(dir, 'sample/a@1.opus'), 'utf8')).toBe('concurrent edit');
  });
  it.each([false, true])('recovers an Opus journal before/after rename (renamed=%s)', async renamed => {
    const manifest = await legacy();
    const old = manifest.clips.sample.a.takes['1'];
    const bytes = testOgg(9602);
    manifest._pending = { kind: 'encode', clipId: 'sample', lineId: 'a', speed: '1', previousSha256: null,
      take: { ...old, file: 'sample/a@1.opus', sha256: sha256(bytes), master: { file: old.file, sha256: old.sha256 } } };
    await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest));
    if (renamed) await writeFile(join(dir, 'sample/a@1.opus'), bytes);
    const state = await inspect();
    expect(state.needsRecovery).toBe(true);
    expect(state.plan[0].status).toBe(renamed ? 'ready' : 'encode');
    await encode(dir, state, signal(), adapters);
    expect((await load())._pending).toBeUndefined();
    expect((await inspect()).plan[0].status).toBe('ready');
  });
  it('recovers a regenerated master before the corresponding Opus commit', async () => {
    await legacy(); await run();
    const changed = { ...line, source: '変更した原稿' }, bytes = testWav(4802);
    const state = await inspect([changed]);
    const writer = await openWriter(dir, state);
    try {
      await writer.commit({ line: changed, voice, speed: '1', reading: 'ヘンコウ', previousSha256: sha256(wav),
        take: { file: 'sample/a@1.wav', sha256: sha256(bytes), duration: 0.2, mouth: [[0, 'a'], [0.1, 'x']], anchors: { point: 0.1 }, generationSha256: generationHash(changed, voice, '1') } }, bytes);
    } finally { await writer.close(); }
    const next = await inspect([changed]);
    expect(next.plan[0].status).toBe('encode'); // previous Opus is retired, not current
    await encode(dir, next, signal(), adapters);
    expect((await inspect([changed])).plan[0].status).toBe('ready');
    expect((await load())._retired['sample/a@1.opus']).toBeUndefined();
  });
});
