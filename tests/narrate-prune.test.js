import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectAssets, openWriter } from '../tools/narrate/assets.mjs';
import { ENGINE_INFO, generationHash, sha256 } from '../tools/narrate/core.mjs';
import { testWav, testOgg } from './fixtures/narrate-data.js';

const engine = vi.hoisted(() => ({ start: vi.fn(() => { throw new Error('must not start engine'); }) }));
const fault = vi.hoisted(() => ({ file: null, after: false }));
vi.mock('node:fs/promises', async importOriginal => {
  const fs = await importOriginal();
  return { ...fs, async unlink(file) {
    if (file !== fault.file) return fs.unlink(file);
    fault.file = null; // one bounded failure, at an actual transaction boundary
    if (fault.after) await fs.unlink(file);
    throw new Error('simulated interruption');
  } };
});
vi.mock('../tools/narrate/engine.mjs', () => ({
  startSupervisedEngine: engine.start, request: vi.fn(), resolveStyle: vi.fn(), TOTAL_MS: 1800000,
}));
import { prune, encode } from '../tools/narrate.mjs';
const voice = { speaker: 'test', style: 'normal' };
const lines = [
  { clipId: 'sample', lineId: 'a', source: 'ア', anchors: [], speed: '1.3' },
  { clipId: 'sample', lineId: 'b', source: 'イ', anchors: [], speed: '1.1' },
];
const wav = testWav(4800), opus = testOgg(9600);
let root, dir;
const signal = () => new AbortController().signal;
const inspect = (speeds = null) => inspectAssets(dir, lines, voice, speeds);
const load = async () => JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
const save = m => writeFile(join(dir, 'manifest.json'), JSON.stringify(m));
beforeEach(async () => {
  vi.clearAllMocks();
  fault.file = null;
  root = await mkdtemp(join(tmpdir(), 'narrate-prune-'));
  dir = join(root, 'voice'); await mkdir(join(dir, 'sample'), { recursive: true });
  const manifest = { version: 1, engine: ENGINE_INFO, voice, clips: { sample: {} } };
  for (const line of lines) {
    const entry = manifest.clips.sample[line.lineId] = { source: line.source, reading: line.source, takes: {} };
    for (const speed of ['1.1', '1.3', '1.5']) {
      const base = `sample/${line.lineId}@${speed}`;
      entry.takes[speed] = { file: `${base}.opus`, sha256: sha256(opus), duration: 0.2, anchors: {},
        generationSha256: generationHash(line, voice, speed), master: { file: `${base}.wav`, sha256: sha256(wav) } };
      await writeFile(join(dir, `${base}.wav`), wav);
      await writeFile(join(dir, `${base}.opus`), opus);
    }
  }
  await save(manifest);
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

describe('unused takes and transactional pruning', () => {
  it('lists unused speeds against each line, independently of requested generation speeds', async () => {
    const before = await readFile(join(dir, 'manifest.json'));
    for (const speeds of [null, ['1.1', '1.3', '1.5']]) {
      const state = await inspect(speeds);
      expect(state.unused.map(t => `${t.lineId}@${t.speed}`)).toEqual(['a@1.1', 'a@1.5', 'b@1.3', 'b@1.5']);
      expect(state.encodePlan).toHaveLength(6);
    }
    expect((await readFile(join(dir, 'manifest.json'))).equals(before)).toBe(true);
    const selected = await inspectAssets(dir, [lines[0]], voice);
    expect(selected.unused.map(t => t.lineId)).toEqual(['a', 'a']);
  });
  it('removes only unused Opus, retires metadata, keeps masters, and is a byte-identical no-op twice', async () => {
    const state = await inspect();
    expect(await prune(dir, state, signal())).toHaveLength(4);
    const m = await load();
    expect(Object.keys(m.clips.sample.a.takes)).toEqual(['1.3']);
    expect(Object.keys(m.clips.sample.b.takes)).toEqual(['1.1']);
    for (const item of state.unused) {
      expect(m._retired[item.take.file]).toEqual(item.take);
      await expect(access(join(dir, item.take.file))).rejects.toMatchObject({ code: 'ENOENT' });
      expect(sha256(await readFile(join(dir, item.take.master.file)))).toBe(sha256(wav));
    }
    expect(sha256(await readFile(join(dir, 'sample/a@1.3.opus')))).toBe(sha256(opus));
    const before = await readFile(join(dir, 'manifest.json'));
    expect(await prune(dir, await inspect(), signal())).toEqual([]);
    expect(await encode(dir, await inspect(), signal())).toEqual([]); // no codec or engine needed
    expect((await readFile(join(dir, 'manifest.json'))).equals(before)).toBe(true);
    expect(engine.start).not.toHaveBeenCalled();
    expect((await inspect(['1.5'])).plan.map(p => p.status)).toEqual(['missing', 'missing']);
    await expect(access(join(dir, '.narrate-lock'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it.each([false, true])('recovers interruption before/after delivery deletion (deleted=%s)', async deleted => {
    const state = await inspect();
    fault.file = join(dir, state.unused[0].take.file); fault.after = deleted;
    await expect(prune(dir, state, signal())).rejects.toThrow('simulated interruption');
    const pending = (await load())._pending;
    expect(pending).toEqual({ kind: 'prune', ...state.unused[0] });
    await expect(access(join(dir, '.narrate-lock'))).rejects.toMatchObject({ code: 'ENOENT' });
    const before = await readFile(join(dir, 'manifest.json'));
    const recovery = await inspect();
    expect(recovery.needsRecovery).toBe(true);
    expect(recovery.unused).toHaveLength(deleted ? 3 : 4);
    expect((await readFile(join(dir, 'manifest.json'))).equals(before)).toBe(true); // dry run
    await prune(dir, recovery, signal());
    expect((await load())._pending).toBeUndefined();
    expect((await inspect()).unused).toHaveLength(0);
    expect(Object.keys((await load())._retired)).toHaveLength(4);
    expect(sha256(await readFile(join(dir, pending.take.master.file)))).toBe(sha256(wav));
  });
  it('persists completed deletion recovery even when there are no remaining unused takes', async () => {
    const state = await inspect();
    const last = state.unused.pop();
    await prune(dir, state, signal());
    const m = await load(); m._pending = { kind: 'prune', ...last }; await save(m);
    await rm(join(dir, last.take.file));
    const recovery = await inspect();
    expect(recovery.unused).toEqual([]);
    await encode(dir, recovery, signal());
    expect((await load())._pending).toBeUndefined();
    expect((await inspect()).encodePlan).toHaveLength(2);
  });
  it('uses the existing lock and refuses concurrent manifest or delivery changes', async () => {
    const state = await inspect();
    const writer = await openWriter(dir, state);
    try { await expect(prune(dir, state, signal())).rejects.toThrow('ロック'); }
    finally { await writer.close(); }
    await writeFile(join(dir, state.unused[0].take.file), 'changed');
    await expect(prune(dir, state, signal())).rejects.toThrow('音声が変更');
    expect(await readFile(join(dir, state.unused[0].take.file), 'utf8')).toBe('changed');
    await expect(access(join(dir, '.narrate-lock'))).rejects.toMatchObject({ code: 'ENOENT' });
    const next = await inspect();
    const m = await load(); m.note = 'concurrent edit'; await save(m);
    await expect(prune(dir, next, signal())).rejects.toThrow('manifestが変更');
  });
  it('retires a WAV-only take without deleting the master or reviving it via encode', async () => {
    const m = await load(), take = m.clips.sample.a.takes['1.5'];
    await rm(join(dir, take.file));
    m.clips.sample.a.takes['1.5'] = { ...take, ...take.master }; delete m.clips.sample.a.takes['1.5'].master;
    await save(m);
    await prune(dir, await inspect(), signal());
    expect(sha256(await readFile(join(dir, take.master.file)))).toBe(sha256(wav));
    expect((await load())._retired[take.master.file]).toBeDefined();
    expect(await encode(dir, await inspect(), signal())).toEqual([]);
  });
  it('keeps recordings for removed or now silent lines outside the pruning scope', async () => {
    const state = await inspectAssets(dir, [lines[0]], voice);
    await prune(dir, state, signal());
    expect(Object.keys((await load()).clips.sample.b.takes)).toEqual(['1.1', '1.3', '1.5']);
    expect(sha256(await readFile(join(dir, 'sample/b@1.5.opus')))).toBe(sha256(opus));
  });
});
