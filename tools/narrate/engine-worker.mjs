// This process does no synthesis or data processing. Its independent timer and IPC
// disconnect handler remain responsive while the client is loading a deck or blocked.
import { startEngine, TOTAL_MS } from './engine.mjs';

const controller = new AbortController();
const stop = () => controller.abort(new Error('エンジン停止要求'));
const timer = setTimeout(stop, TOTAL_MS);
process.on('disconnect', stop);
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('message', (message) => { if (message.stop) stop(); });
let engine;
try {
  engine = await startEngine(process.argv[2], controller.signal);
  if (process.connected) process.send({ ready: engine.identity });
  if (!controller.signal.aborted) await new Promise((resolve) => controller.signal.addEventListener('abort', resolve, { once: true }));
} catch (error) {
  if (process.connected) process.send({ error: error.message.slice(0, 2500) });
  if (!controller.signal.aborted) process.exitCode = 1;
} finally {
  try { await engine?.stop(); } catch (error) {
    if (process.connected) process.send({ error: error.message.slice(0, 2500) });
    process.exitCode = 1;
  }
  clearTimeout(timer);
  if (process.connected) process.disconnect();
}
