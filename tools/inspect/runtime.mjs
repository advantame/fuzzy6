// External deadline owns the worker process group, including Chromium descendants.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export async function supervised(url, run, seconds = 540) {
  if (process.argv[2] === '--worker') {
    process.argv.splice(2, 1);
    try { await run(process.argv.slice(2)); }
    catch (error) { console.error(error.message); process.exitCode = 2; }
    return;
  }
  const child = spawn(process.execPath, ['--max-old-space-size=512', fileURLToPath(url), '--worker', ...process.argv.slice(2)], { stdio: 'inherit', detached: true });
  let stopped = false;
  const kill = signal => { try { process.kill(-child.pid, signal); } catch (e) { if (e.code !== 'ESRCH') throw e; } };
  const stop = code => {
    if (stopped) return;
    stopped = true; process.exitCode = code;
    kill('SIGTERM'); setTimeout(() => kill('SIGKILL'), 2000);
  };
  const timer = setTimeout(() => { console.error(`Tool timed out after ${seconds}s`); stop(2); }, seconds * 1000);
  process.once('SIGINT', () => stop(130)); process.once('SIGTERM', () => stop(143));
  child.once('error', error => { clearTimeout(timer); console.error(error.message); process.exitCode = 2; });
  child.once('exit', code => { clearTimeout(timer); if (!stopped) { process.exitCode = code ?? 2; kill('SIGKILL'); } });
}
export async function step(promise, ms = 15000) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Browser step timed out')), ms); })]); }
  finally { clearTimeout(timer); }
}
export const safeId = id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,99}$/.test(id);
export function output(limit = 4000, bytes = 1024 * 1024) {
  let lines = 0, used = 0;
  return message => {
    const text = String(message);
    if (++lines > limit || (used += Buffer.byteLength(text)) > bytes) throw new Error('Output limit reached; select fewer clips/times');
    console.log(text);
  };
}
