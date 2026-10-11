import { constants } from 'node:fs';
import { open, lstat, mkdir, rename, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { MAX_OPUS_BYTES, MAX_TAKES, parseOggOpus } from './opus.mjs';
import { ENGINE_INFO, MAX_WAV_BYTES, narrator, generationHash, sha256, speedKey, takeStatus, validateWav } from './core.mjs';

const MAX_JSON = 8 * 1024 ** 2;
const FILE = /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*@(0\.\d+|[12](?:\.\d+)?)\.(?:wav|opus)$/;
const HASH = /^[a-f0-9]{64}$/;
export async function readOptional(path, limit = MAX_JSON) {
  let handle;
  try {
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limit) throw new Error(`ファイルの種類または容量が不正です: ${path}`);
    // Fixed-size buffer + extra byte: a concurrent writer cannot make readFile grow without bound.
    const buffer = Buffer.alloc(stat.size + 1);
    let size = 0;
    while (size < buffer.length) {
      const { bytesRead } = await handle.read(buffer, size, buffer.length - size, size);
      if (!bytesRead) break;
      size += bytesRead;
    }
    if (size > stat.size) throw new Error(`読取り中にファイルが増えました: ${path}`);
    return buffer.subarray(0, size);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  } finally { await handle?.close(); }
}

async function directory(path) {
  try {
    const stat = await lstat(path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`実ディレクトリが必要です: ${path}`);
    return true;
  } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

export function applyRecording(manifest, update) {
  const { line, voice, speed, take, reading } = update;
  const actor = narrator(line, voice);
  manifest._retired ??= {};
  const retire = (entry) => {
    for (const old of Object.values(entry.takes)) manifest._retired[old.file] = old;
    entry.takes = {};
  };
  if (manifest.engine?.name !== ENGINE_INFO.name || manifest.engine?.version !== ENGINE_INFO.version) {
    for (const clip of Object.values(manifest.clips)) for (const entry of Object.values(clip)) retire(entry);
  }
  manifest.engine = { ...ENGINE_INFO };
  manifest.version = 2;
  delete manifest.voice;
  if (!Object.hasOwn(manifest.clips, line.clipId)) manifest.clips[line.clipId] = {};
  const clip = manifest.clips[line.clipId];
  if (!Object.hasOwn(clip, line.lineId)) clip[line.lineId] = { takes: {} };
  const entry = clip[line.lineId];
  for (const [key, old] of Object.entries(entry.takes)) {
    if (entry.source !== line.source || entry.by !== line.by || entry.speaker !== actor.speaker || entry.style !== actor.style || old.generationSha256 !== generationHash(line, voice, key)) {
      manifest._retired[old.file] = old;
      delete entry.takes[key];
    }
  }
  const previous = entry.takes[speed];
  if (previous && previous.file !== take.file) manifest._retired[previous.file] = previous;
  entry.by = line.by;
  entry.speaker = actor.speaker;
  entry.style = actor.style;
  entry.source = line.source;
  entry.reading = reading;
  entry.takes[speed] = take;
  // A replacement owns these filenames now; retain a previous Opus until the
  // derivative commit replaces it (also recoverable after a master-only commit).
  const owned = new Set([take.file, take.master?.file].filter(Boolean));
  for (const file of Object.keys(manifest._retired)) {
    if (owned.has(file)) delete manifest._retired[file];
  }
}

function applyUpdate(manifest, update) {
  if (update.kind === 'prune') {
    manifest._retired ??= {};
    manifest._retired[update.take.file] = update.take;
    delete manifest.clips[update.clipId][update.lineId].takes[update.speed];
  } else if (update.kind === 'encode') {
    manifest.clips[update.clipId][update.lineId].takes[update.speed] = update.take;
    if (manifest._retired) delete manifest._retired[update.take.file];
  } else applyRecording(manifest, update);
}

function managedFiles(manifest) {
  const records = new Map();
  let count = 0;
  const addFile = (record) => {
    if (!record || !FILE.test(record.file) || !HASH.test(record.sha256)) throw new Error('manifest の音声パスまたはsha256が不正です。');
    if (records.has(record.file)) throw new Error(`manifest に重複した音声があります: ${record.file}`);
    records.set(record.file, record);
  };
  const add = (take, base, retired = false) => {
    if (++count > MAX_TAKES) throw new Error(`録りは${MAX_TAKES}件以内にしてください。`);
    if (!take || ![`${base}.wav`, `${base}.opus`].includes(take.file)) throw new Error('manifest の音声パスが不正です。');
    if (!Number.isFinite(take.duration) || take.duration < 0.15 || take.duration > 180 || !take.anchors || typeof take.anchors !== 'object' || Array.isArray(take.anchors) ||
        Object.entries(take.anchors).some(([name, at]) => !/^[a-z][a-z0-9-]*$/.test(name) || !Number.isFinite(at) || at < 0 || at > take.duration)) throw new Error('manifest の長さまたは印が不正です。');
    speedKey(base.slice(base.indexOf('@') + 1));
    addFile(take);
    if (take.file.endsWith('.opus')) {
      if (take.master?.file !== `${base}.wav`) throw new Error('manifest の master パスが不正です。');
      // An active replacement may own the same master path with a newer hash.
      // Retired metadata is historical, not authority over that replacement.
      if (!retired || !records.has(take.master.file)) addFile(take.master);
    }
  };
  for (const [clip, entries] of Object.entries(manifest.clips)) {
    for (const [line, entry] of Object.entries(entries)) {
      if (typeof entry.source !== 'string' || !entry.takes || typeof entry.takes !== 'object' || Array.isArray(entry.takes)) throw new Error('manifest の文の形式が不正です。');
      for (const [speed, take] of Object.entries(entry.takes)) {
        if (speedKey(speed) !== speed) throw new Error('manifest の話速キーが正規形ではありません。');
        add(take, `${clip}/${line}@${speed}`);
      }
    }
  }
  for (const [file, take] of Object.entries(manifest._retired ?? {})) {
    if (file !== take.file) throw new Error('retired パスが不正です。');
    add(take, file.replace(/\.(wav|opus)$/, ''), true);
  }
  return records;
}

export async function inspectAssets(voiceDir, lines, voice = {}, speeds = null, { clips = [...new Set(lines.map(l => l.clipId))], encodeSpeeds = null } = {}) {
  await directory(dirname(voiceDir));
  const present = await directory(voiceDir);
  const raw = present ? await readOptional(join(voiceDir, 'manifest.json')) : null;
  const manifest = raw ? JSON.parse(raw.toString('utf8')) : { version: 2, engine: { ...ENGINE_INFO }, clips: {} };
  if (![1, 2].includes(manifest.version) || !manifest.clips || typeof manifest.clips !== 'object' || Array.isArray(manifest.clips)) throw new Error('既存manifestの形式を確認してください。');
  if (manifest.version === 1) {
    const by = Object.keys(voice.cast ?? {})[0];
    for (const entries of Object.values(manifest.clips)) for (const entry of Object.values(entries)) {
      entry.by = by;
      entry.speaker = manifest.voice?.speaker;
      entry.style = manifest.voice?.style;
    }
    if (manifest._pending?.line) manifest._pending.line.by = by;
    manifest.version = 2;
    delete manifest.voice;
  }
  // A journal closes the asset-rename / manifest-rename crash window.
  // Dry-run resolves it only in memory; --generate persists recovery under the lock.
  const needsRecovery = Boolean(manifest._pending);
  if (manifest._pending) {
    const p = manifest._pending;
    if (!FILE.test(p.take?.file) || !HASH.test(p.take?.sha256) || (p.previousSha256 !== null && !HASH.test(p.previousSha256))) throw new Error('未完了の記録が不正です。');
    await directory(dirname(join(voiceDir, p.take.file)));
    const bytes = await readOptional(join(voiceDir, p.take.file), p.take.file.endsWith('.opus') ? MAX_OPUS_BYTES : MAX_WAV_BYTES);
    const hash = bytes ? sha256(bytes) : null;
    if (p.kind === 'prune') {
      managedFiles(manifest);
      const active = manifest.clips[p.clipId]?.[p.lineId]?.takes?.[p.speed];
      if (JSON.stringify(active) !== JSON.stringify(p.take)) throw new Error('未完了の片づけの記録が不正です。');
      // Missing Opus means the unlink completed. A WAV-only legacy take has no
      // delivery to remove. Otherwise leave the active take for a later retry.
      if (p.take.file.endsWith('.wav') || hash === null) applyUpdate(manifest, p);
      else if (hash !== p.previousSha256) throw new Error(`未完了の音声が手動変更されています: ${p.take.file}`);
    } else if (hash === p.take.sha256) {
      if (p.take.file.endsWith('.opus')) parseOggOpus(bytes); else validateWav(bytes);
      applyUpdate(manifest, p);
    } else if (hash !== p.previousSha256) throw new Error(`未完了の音声が手動変更されています: ${p.take.file}`);
    delete manifest._pending;
  }
  const records = managedFiles(manifest);
  const existing = new Map();
  const valid = new Set();
  let count = 0;
  if (present) {
    const walk = async (dir, prefix = '', depth = 0) => {
      // opendir avoids allocating an unbounded directory listing.
      const { opendir } = await import('node:fs/promises');
      for await (const item of await opendir(dir)) {
        if (++count > 10000) throw new Error('voice 内のファイル数が上限を超えました。');
        const relative = prefix + item.name;
        if (item.isSymbolicLink()) throw new Error(`voice 内のsymlinkは扱いません: ${relative}`);
        if (item.isDirectory()) {
          if (depth >= 1) throw new Error(`voice 内に予期しない階層があります: ${relative}`);
          await walk(join(dir, item.name), relative + '/', depth + 1);
        } else if (/\.(wav|opus)$/.test(item.name)) {
          const take = records.get(relative);
          if (!take) throw new Error(`manifest にない音声は上書きしません: ${relative}`);
          const isWav = item.name.endsWith('.wav');
          const bytes = await readOptional(join(dir, item.name), isWav ? MAX_WAV_BYTES : MAX_OPUS_BYTES);
          if (!bytes) continue;
          const hash = sha256(bytes);
          existing.set(relative, hash);
          if (isWav) {
            if (hash !== take.sha256) throw new Error(`sha256 が違うWAVは上書きしません: ${relative}`);
            validateWav(bytes);
            valid.add(relative);
          } else if (hash === take.sha256) {
            try {
              const info = parseOggOpus(bytes);
              if (Math.abs(info.presentationTicks / 48000 - take.duration) <= 0.000501) valid.add(relative);
            } catch { /* A damaged delivery can be rebuilt from its verified master. */ }
          }
        }
      }
    };
    await walk(voiceDir);
  }
  if (lines.length * (speeds?.length ?? 1) > MAX_TAKES) throw new Error(`一度の処理は${MAX_TAKES}録り以内にしてください。`);
  const plan = lines.flatMap((line) => (speeds ?? [speedKey(line.speed)]).map((speed) => {
    const base = `${line.clipId}/${line.lineId}@${speed}`;
    const file = `${base}.opus`, masterFile = `${base}.wav`;
    const take = manifest.clips[line.clipId]?.[line.lineId]?.takes[speed];
    const deliveryReady = take?.file === file && valid.has(file);
    const current = takeStatus(manifest, line, voice, speed, Boolean(take)) === 'ready';
    let status = takeStatus(manifest, line, voice, speed, deliveryReady);
    if (current && !deliveryReady && valid.has(masterFile)) status = 'encode';
    else if (take && !current && (existing.has(file) || existing.has(masterFile))) status = 'stale';
    return { line, speed, file, masterFile, status, previousSha256: existing.get(file) ?? null,
      previousMasterSha256: existing.get(masterFile) ?? null };
  }));
  // Only today's spoken lines have a defined deck speed. Removed/silent lines
  // have no such comparison and are retained for separate editorial review.
  const unused = lines.flatMap(line => Object.entries(manifest.clips[line.clipId]?.[line.lineId]?.takes ?? {})
    .filter(([speed]) => Number(speed) !== Number(line.speed))
    .map(([speed, take]) => ({ clipId: line.clipId, lineId: line.lineId, speed, take,
      previousSha256: existing.get(take.file) ?? null })));
  // Encoding concerns existing recordings, including all recorded speeds and lines
  // removed/changed in today's script. It must never relabel yesterday's speech.
  const encodePlan = [];
  for (const [clipId, entries] of Object.entries(manifest.clips)) {
    if (clips.length && !clips.includes(clipId)) continue;
    for (const [lineId, entry] of Object.entries(entries)) for (const [speed, take] of Object.entries(entry.takes)) {
      if (encodeSpeeds && !encodeSpeeds.includes(speed)) continue;
      const file = `${clipId}/${lineId}@${speed}.opus`;
      const master = take.master ?? { file: take.file, sha256: take.sha256 };
      encodePlan.push({ clipId, lineId, speed, take, master, file, previousSha256: existing.get(file) ?? null,
        status: take.file === file && valid.has(file) ? 'ready' : valid.has(master.file) ? 'encode' : 'no-master' });
    }
  }

  return { manifest, raw, plan, encodePlan, unused, needsRecovery };
}

// Temp files end in .wav, so the existing WAV ignore rule covers them before creation.
async function atomicWrite(path, bytes) {
  const temp = join(dirname(path), `.narrate-${randomUUID()}.wav`);
  let handle;
  try {
    handle = await open(temp, 'wx', 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close(); handle = null;
    await rename(temp, path);
  } finally {
    await handle?.close();
    await unlink(temp).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  }
}

export async function openWriter(voiceDir, state) {
  await mkdir(voiceDir, { recursive: true });
  await directory(voiceDir);
  const lockPath = join(voiceDir, '.narrate-lock');
  // No stale-lock stealing: another process may still be alive. The error names the lock.
  try { await mkdir(lockPath); } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`別の生成または未回収のロックがあります: ${lockPath}`);
    throw error;
  }
  let expected = state.raw;
  const sameManifest = async () => {
    const current = await readOptional(join(voiceDir, 'manifest.json'));
    if (current === null ? expected !== null : expected === null || !current.equals(expected)) throw new Error('生成中にmanifestが変更されたため上書きしません。');
  };
  const persist = async () => {
    await sameManifest();
    const next = Buffer.from(JSON.stringify(state.manifest, null, 2) + '\n');
    if (next.length > MAX_JSON) throw new Error('manifest の容量上限です。');
    await atomicWrite(join(voiceDir, 'manifest.json'), next);
    expected = next;
  };
  const close = async () => {
    const { rmdir } = await import('node:fs/promises');
    await rmdir(lockPath);
  };
  try { await sameManifest(); } catch (error) { await close(); throw error; }
  return {
    persist, close,
    async commit(update, bytes) {
      const target = join(voiceDir, update.take.file);
      await mkdir(dirname(target), { recursive: true });
      await directory(dirname(target));
      const unchanged = async () => {
        const current = await readOptional(target, update.take.file.endsWith('.opus') ? MAX_OPUS_BYTES : MAX_WAV_BYTES);
        if ((current ? sha256(current) : null) !== update.previousSha256) throw new Error(`生成中に音声が変更されたため上書きしません: ${update.take.file}`);
        if (update.kind === 'encode') {
          const master = await readOptional(join(voiceDir, update.take.master.file), MAX_WAV_BYTES);
          if (!master || sha256(master) !== update.take.master.sha256) throw new Error(`変換中に原本が変更されています: ${update.take.master.file}`);
        }
      };
      await unchanged();
      state.manifest._pending = update;
      await persist();
      await unchanged();
      await sameManifest();
      if (update.kind === 'prune') {
        // Keep masters, including legacy takes whose primary file is a WAV.
        if (update.take.file.endsWith('.opus'))
          await unlink(target).catch(error => { if (error.code !== 'ENOENT') throw error; });
      } else await atomicWrite(target, bytes);
      applyUpdate(state.manifest, update);
      delete state.manifest._pending;
      await persist();
    },
  };
}
