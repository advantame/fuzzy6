import { readdir, open, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { step } from './runtime.mjs';
import { frame } from './browser.mjs';
import { decodePNG } from './png.mjs';
export const root = resolve(import.meta.dirname, '../..');
export async function deckIds() {
  const dirs = await readdir(resolve(root, 'decks'), { withFileTypes: true });
  const ids = [];
  for (const dir of dirs) if (dir.isDirectory() && (await readdir(resolve(root, 'decks', dir.name))).includes('deck.js')) ids.push(dir.name);
  return ids.sort();
}
export const stopKey = (s, i) => `${String(i + 1).padStart(3, '0')}@${s.at.toFixed(3)}:${s.kind}:${s.line ?? 'clip'}`;
export async function baseline(deck) {
  let file;
  try {
    file = await open(resolve(root, 'tests/stops', `${deck}.json`), 'r');
    const { size } = await file.stat();
    if (size > 4 * 1024 * 1024) throw new Error('Stop baseline exceeds 4 MiB');
    const bytes = Buffer.alloc(size);
    const { bytesRead } = await file.read(bytes, 0, size, 0);
    if (bytesRead !== size) throw new Error('Truncated stop baseline');
    const data = JSON.parse(bytes.toString('utf8'));
    if (data.version !== 1 || data.format !== 'sha256-rgba' || data.viewport?.join() !== '1600,900' ||
        !data.clips || typeof data.clips !== 'object' || Array.isArray(data.clips)) throw new Error('Unsupported stop baseline format');
    return data;
  } catch (e) { if (e.code === 'ENOENT') return { version: 1, clips: {} }; throw e; }
  finally { await file?.close(); }
}
export async function saveBaseline(deck, data) {
  const path = resolve(root, 'tests/stops', `${deck}.json`);
  await mkdir(resolve(root, 'tests/stops'), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(data, null, 2) + '\n');
  await rename(temp, path);
}
export async function stagePNG(page) {
  const geometry = await step(page.evaluate(() => {
    const stage = document.querySelector('.mx-stage'), box = stage.getBoundingClientRect();
    return { width: box.width, height: box.height, dpr: devicePixelRatio,
      canvases: [...stage.querySelectorAll('.mx-layer canvas')].map(c => [c.width, c.height]) };
  }));
  if (geometry.width !== 1600 || geometry.height !== 900 || geometry.dpr !== 1 || geometry.canvases.some(([w,h]) => w !== 1600 || h !== 900)) throw new Error(`Stage must be exactly 1600x900 at DPR 1: ${JSON.stringify(geometry)}`);
  return page.locator('.mx-stage').screenshot({ timeout: 15000, animations: 'disabled' });
}
export function pixelHash(png) {
  const { width, height, pixels } = decodePNG(png);
  if (width !== 1600 || height !== 900) throw new Error('Stage screenshot has wrong dimensions');
  return createHash('sha256').update(pixels).digest('hex');
}
// Sequential frames bound image memory to one PNG and one decoded image at a time.
// onDifference owns a global artifact budget; no passing binary data to assertions.
export async function inspectStops(page, clips, expected, { update = false, onDifference = () => {}, report = () => {}, repeat = false } = {}) {
  const actual = {}, differences = [];
  let count = 0;
  const mismatch = async (id, key, want, got, png) => {
    if (differences.length >= 4000) throw new Error('Stop differences exceed 4000; narrow selection');
    const message = `${id} ${key}: expected ${want?.slice(0,12) ?? 'missing'}, actual ${got?.slice(0,12) ?? 'missing'}`;
    differences.push(message); report(message);
    await onDifference({ id, key, png });
  };
  for (const clip of clips) {
    const hashes = actual[clip.id] = {};
    for (const [i, stop] of clip.stops.entries()) {
      if (++count > 10000) throw new Error('Stop count exceeds 10000');
      const key = stopKey(stop, i);
      await frame(page, clip.id, stop.at);
      const png = await stagePNG(page), hash = pixelHash(png);
      if (repeat) {
        await frame(page, clip.id, stop.at);
        if (pixelHash(await stagePNG(page)) !== hash) throw new Error(`Non-deterministic stage: ${clip.id} ${key}`);
      }
      hashes[key] = hash;
      if (!update && expected.clips?.[clip.id]?.[key] !== hash) await mismatch(clip.id, key, expected.clips?.[clip.id]?.[key], hash, png);
    }
    if (!update) for (const [key, hash] of Object.entries(expected.clips?.[clip.id] ?? {})) if (!Object.hasOwn(hashes, key)) await mismatch(clip.id, key, hash);
  }
  return { actual, differences, count };
}
