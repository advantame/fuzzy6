import { spawn, fork } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdir, readFile, readdir, readlink, realpath, rmdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { CORE_VERSION, MAX_WAV_BYTES } from './core.mjs';

export const ENGINE = '/home/apm/apps/voicevox-engine-0.25.2/run';
const HOST = '127.0.0.1';
const PORT = 8083;
export const TOTAL_MS = 30 * 60_000;

export async function processIdentity(pid) {
  try {
    const [stat, executable] = await Promise.all([readFile(`/proc/${pid}/stat`, 'utf8'), realpath(`/proc/${pid}/exe`)]);
    return { pid, startTicks: stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19], executable };
  } catch (error) { if (['ENOENT', 'ESRCH'].includes(error.code)) return null; throw error; }
}
export async function ownsPort(pid) {
  try {
    const names = await readdir(`/proc/${pid}/fd`);
    const sockets = new Set();
    for (const name of names) {
      const link = await readlink(`/proc/${pid}/fd/${name}`).catch(() => '');
      const match = /^socket:\[(\d+)\]$/.exec(link);
      if (match) sockets.add(match[1]);
    }
    const table = await readFile('/proc/net/tcp', 'utf8');
    const endpoint = `0100007F:${PORT.toString(16).toUpperCase().padStart(4, '0')}`;
    return table.split('\n').some((line) => {
      const fields = line.trim().split(/\s+/);
      return fields[1] === endpoint && fields[3] === '0A' && sockets.has(fields[9]);
    });
  } catch (error) { if (['ENOENT', 'ESRCH'].includes(error.code)) return false; throw error; }
}
export async function request(path, { signal, params = {}, body, bytes = false, method = 'GET', identity } = {}) {
  if (identity) {
    const current = await processIdentity(identity.pid);
    if (current?.startTicks !== identity.startTicks || current?.executable !== ENGINE || !await ownsPort(identity.pid)) throw new Error('今回起動したエンジンの所有関係が変わりました。');
  }
  const url = new URL(path, `http://${HOST}:${PORT}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    method, redirect: 'error', signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(120_000)]),
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error(`VOICEVOX ${path}: HTTP ${response.status}`); }
  if (response.status === 204) { await response.body?.cancel(); return undefined; }
  const chunks = [];
  let length = 0;
  const limit = bytes ? MAX_WAV_BYTES : 2 * 1024 ** 2;
  for await (const chunk of response.body) {
    if (length + chunk.length > limit) throw new Error(`VOICEVOX ${path}: 応答容量の上限です。`);
    chunks.push(chunk); length += chunk.length;
  }
  const buffer = Buffer.concat(chunks, length);
  return bytes ? buffer : JSON.parse(buffer.toString('utf8'));
}

export async function startEngine(root, signal) {
  const dir = join(root, '.cache/voicevox');
  await mkdir(dir, { recursive: true });
  const lock = join(dir, '.engine-lock');
  try { await mkdir(lock); } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`別のエンジンまたは未回収のロックがあります: ${lock}`);
    throw error;
  }
  let engine;
  try { engine = await startUnlockedEngine(root, signal); }
  catch (error) { await rmdir(lock); throw error; }
  let stopped = false;
  return { identity: engine.identity, stop: async () => {
    if (stopped) return;
    await engine.stop();
    await rmdir(lock);
    stopped = true;
  } };
}

async function startUnlockedEngine(root, signal) {
  await access(ENGINE, constants.X_OK);
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', (error) => reject(new Error(`127.0.0.1:${PORT}を使用できません。既存プロセスは停止しません: ${error.code}`)));
    server.listen({ host: HOST, port: PORT, exclusive: true }, () => server.close(resolve));
  });
  const mem = await readFile('/proc/meminfo', 'utf8');
  const available = Number(/^MemAvailable:\s+(\d+)/m.exec(mem)?.[1]);
  if (!(available >= 16 * 1024 ** 2)) throw new Error('利用可能メモリが16GiB未満です。');
  const cache = join(root, '.cache/voicevox');
  for (const part of ['data/voicevox-engine', 'config', 'cache']) await mkdir(join(cache, part), { recursive: true });
  signal.throwIfAborted();
  const child = spawn('/usr/bin/prlimit', [
    '--as=4294967296:4294967296', '--core=0:0', '--cpu=1800:1800', '--nofile=256:256',
    ENGINE, '--host', HOST, '--port', String(PORT), '--cpu_num_threads', '4',
  ], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CUDA_VISIBLE_DEVICES: '', OMP_NUM_THREADS: '4', OPENBLAS_NUM_THREADS: '4',
      MALLOC_ARENA_MAX: '2', WEB_CONCURRENCY: '1', XDG_DATA_HOME: join(cache, 'data'),
      XDG_CONFIG_HOME: join(cache, 'config'), XDG_CACHE_HOME: join(cache, 'cache') },
  });
  let exited = false, description = '', identity;
  // Keep only the first 16KiB; discard before accumulation, never write an unbounded log.
  const logs = Buffer.alloc(16384);
  let used = 0;
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => {
    const length = Math.min(chunk.length, logs.length - used);
    chunk.copy(logs, used, 0, length); used += length;
  });
  child.on('error', (error) => { exited = true; description = error.message; });
  child.on('exit', (code, sig) => { exited = true; description = `exit=${code}, signal=${sig}`; });
  async function stop() {
    if (exited) return;
    const same = async () => {
      const current = await processIdentity(child.pid);
      return current && current.startTicks === identity?.startTicks && [ENGINE, '/usr/bin/prlimit'].includes(current.executable);
    };
    if (!await same()) throw new Error(`PID ${child.pid} の所有関係を確認できず停止できません。`);
    child.kill('SIGTERM');
    for (let i = 0; i < 30 && !exited; i++) await delay(100);
    if (!exited && await same()) child.kill('SIGKILL');
    for (let i = 0; i < 30 && !exited; i++) await delay(100);
    if (!exited) throw new Error(`PID ${child.pid} の終了を確認できません。`);
  }
  try {
    identity = child.pid ? await processIdentity(child.pid) : null;
    if (!identity) throw new Error(`エンジンを起動できません: ${description}`);
    const startup = AbortSignal.any([signal, AbortSignal.timeout(120_000)]);
    while (true) {
      startup.throwIfAborted();
      if (exited) throw new Error(`エンジンが終了しました (${description})。4GiB上限は変更しません。\n${logs.subarray(0, Math.min(used, 2000)).toString()}`);
      const current = await processIdentity(child.pid);
      if (current?.executable === ENGINE && current.startTicks === identity.startTicks && await ownsPort(child.pid)) {
        const version = await request('/version', { signal: startup, identity: current });
        if (version !== '0.25.2') throw new Error(`Engine version が一致しません: ${version}`);
        return { identity: current, stop };
      }
      await delay(250, undefined, { signal: startup });
    }
  } catch (error) { await stop(); throw error; }
}

// A separate, idle Node supervisor enforces wall time even if Vite/the client stalls.
// Only one engine is spawned, no restart, no cancellable workers, no GPU flags.
export async function startSupervisedEngine(root, signal) {
  const child = fork(new URL('./engine-worker.mjs', import.meta.url), [root], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
  let exited = false;
  const done = new Promise((resolve) => {
    child.once('exit', (code) => { exited = true; resolve(code); });
    child.once('error', () => { exited = true; resolve(1); });
  });
  const stop = async () => {
    if (!exited && child.connected) child.send({ stop: true }, () => {});
    // Worker owns engine cleanup; never kill the supervisor before it reaps the engine.
    let timer;
    const result = await Promise.race([done, new Promise((resolve) => { timer = setTimeout(() => resolve('timeout'), 10_000); })]);
    clearTimeout(timer);
    if (result === 'timeout') throw new Error(`エンジン監督PID ${child.pid}の終了待ちが期限に達しました。`);
    if (result !== 0) throw new Error('エンジンの監督処理が異常終了しました。');
  };
  try {
    const identity = await new Promise((resolve, reject) => {
      const abort = () => reject(signal.reason);
      signal.addEventListener('abort', abort, { once: true });
      const cleanup = () => signal.removeEventListener('abort', abort);
      child.on('message', (message) => {
        if (message.ready) { cleanup(); resolve(message.ready); }
        if (message.error) { cleanup(); reject(new Error(message.error)); }
      });
      done.then(() => { cleanup(); reject(new Error('エンジンの監督処理が終了しました。')); });
      if (signal.aborted) abort();
    });
    return { identity, stop };
  } catch (error) { try { await stop(); } catch { /* original startup error */ } throw error; }
}

export async function resolveStyle(voice, options) {
  const versions = await request('/core_versions', options);
  if (!Array.isArray(versions) || !versions.includes(CORE_VERSION)) throw new Error(`Core ${CORE_VERSION} がありません。`);
  const speakers = await request('/speakers', { ...options, params: { core_version: CORE_VERSION } });
  const matches = speakers.filter((s) => s.name === voice.speaker).flatMap((s) => s.styles.filter((style) => style.name === voice.style && (!style.type || style.type === 'talk')));
  if (matches.length !== 1 || !Number.isInteger(matches[0].id)) throw new Error('話者とスタイルを一意に選べません。');
  return matches[0].id;
}
