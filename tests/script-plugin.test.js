import { afterEach, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EventEmitter } from 'node:events';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { scriptDocs } from '../tools/script-plugin.mjs';
import { main } from '../tools/script.mjs';

let root, server, browser, plugin;
afterEach(async () => {
  vi.useRealTimers();
  await browser?.close(); browser = undefined;
  await server?.close(); server = undefined;
  await plugin?.closeBundle(); plugin = undefined;
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});
async function setup() {
  root = await mkdtemp(join(tmpdir(), 'script-plugin-'));
  await mkdir(join(root, 'decks/test/parts'), { recursive: true });
  return join(root, 'decks/test');
}
const sample = text => ({ id: 'test', title: 'Test', chapters: [{ id: 'one', title: '章', clips: [
  { id: 'clip', title: 'Clip', setup() {}, script: [{ id: 'a', text }] },
] }] });
const doc = () => readFile(join(root, 'decks/test/script.md'), 'utf8');
const contains = async text => {
  await vi.waitFor(async () => expect((await doc()).includes(text)).toBe(true), { timeout: 8000, interval: 50 });
};

it('CLI selects decks, preserves mtime and leaves silent documents alone', async () => {
  const dir = await setup();
  await writeFile(join(dir, 'deck.js'), '');
  await mkdir(join(root, 'decks/silent'));
  await writeFile(join(root, 'decks/silent/deck.js'), '');
  await writeFile(join(root, 'decks/silent/script.md'), 'keep');
  const load = async (_, id) => id === 'test' ? sample('声。') : { id, chapters: [{ clips: [{ id: 'c', duration: 1, setup() {} }] }] };
  const log = vi.fn();
  await main(['test'], { root, load, log });
  expect(log.mock.calls).toEqual([['test: 書き直した']]);
  const before = (await stat(join(dir, 'script.md'))).mtimeMs;
  log.mockClear();
  await main([], { root, load, log });
  expect(log.mock.calls).toEqual([['silent: 変わらない'], ['test: 変わらない']]);
  expect((await stat(join(dir, 'script.md'))).mtimeMs).toBe(before);
  expect(await readFile(join(root, 'decks/silent/script.md'), 'utf8')).toBe('keep');
  await expect(main(['../test'], { root, load, log })).rejects.toThrow('デッキがありません');
});

it('coalesces edits during a load into one rerun and cleans up pending work', async () => {
  const dir = await setup();
  await writeFile(join(dir, 'deck.js'), '');
  const watcher = new EventEmitter();
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const load = vi.fn().mockImplementationOnce(() => pending).mockResolvedValue({ default: sample('新しい。') });
  const fake = { config: { root, server: {}, logger: { warn: vi.fn() } }, watcher,
    environments: { ssr: { logger: { error: vi.fn() }, moduleGraph: { fileToModulesMap: new Map() } } }, ssrLoadModule: load };
  plugin = scriptDocs();
  await plugin.configureServer(fake);
  await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  for (let i = 0; i < 20; i++) watcher.emit('change', join(dir, 'clip.js'));
  await new Promise(resolve => setTimeout(resolve, 350));
  expect(load).toHaveBeenCalledTimes(1);
  release({ default: sample('古い。') });
  await contains('新しい。');
  expect(load).toHaveBeenCalledTimes(2);
  watcher.emit('change', join(dir, 'script.md'));
  watcher.emit('change', join(dir, 'clip.js'));
  await plugin.closeBundle();
  await new Promise(resolve => setTimeout(resolve, 350));
  expect(load).toHaveBeenCalledTimes(2);
  expect(watcher.listenerCount('change')).toBe(0);
});

it('does not run in build, preview, watcher-free loaders or test servers', async () => {
  const p = scriptDocs();
  expect(p.apply).toBe('serve');
  expect(p.configurePreviewServer).toBeUndefined();
  for (const config of [{ server: { watch: null } }, { server: { middlewareMode: true } }, { server: {}, mode: 'test' }]) {
    // Any attempt to access the watcher/loader would throw on this stub.
    await p.configureServer({ config });
  }
});

it('real Vite reloads JS/JSON/add/unlink, retains output on error, and writing Markdown never reloads a browser', async () => {
  const dir = await setup();
  await writeFile(join(dir, 'text.js'), 'export default "初め。";');
  await writeFile(join(dir, 'suffix.json'), '"末尾。"');
  const source = `import text from './text.js';
import suffix from './suffix.json';
const parts = import.meta.glob('./parts/*.mjs', { eager: true, import: 'default' });
export default { id: 'test', title: 'Test', chapters: [{ id: 'one', title: '章', clips: [
  { id: 'clip', title: 'Clip', setup() {}, script: [{ id: 'a', text: text + suffix + Object.values(parts).join('') }] }
] }] };`;
  await writeFile(join(dir, 'deck.js'), source);
  await writeFile(join(root, 'index.html'), '<html><body>Watch test<script type="module">window.ready = true;</script></body></html>');
  server = await createServer({ root, configFile: false, plugins: [scriptDocs()], logLevel: 'silent',
    server: { host: '127.0.0.1', port: 8080, strictPort: true },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  const warning = vi.spyOn(server.config.logger, 'warn');
  const error = vi.spyOn(server.config.logger, 'error');
  await server.listen();
  await contains('初め。末尾。');
  browser = await chromium.launch({ timeout: 10_000 });
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(10_000);
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await page.goto('http://127.0.0.1:8080/');
  await page.waitForFunction(() => window.ready);
  const baseline = navigations;
  const before = (await stat(join(dir, 'script.md'))).mtimeMs;
  await writeFile(join(dir, 'text.js'), 'export default "初め。"; // same output');
  await new Promise(resolve => setTimeout(resolve, 700));
  expect((await stat(join(dir, 'script.md'))).mtimeMs).toBe(before);
  await writeFile(join(dir, 'text.js'), 'export default "変更。";');
  await contains('変更。末尾。');
  await writeFile(join(dir, 'suffix.json'), '"別の末尾。"');
  await contains('変更。別の末尾。');
  await writeFile(join(dir, 'parts/new.mjs'), 'export default "追加。";');
  await contains('変更。別の末尾。追加。');
  await rm(join(dir, 'parts/new.mjs'));
  await vi.waitFor(async () => expect((await doc()).includes('追加。')).toBe(false), { timeout: 8000 });
  const saved = Buffer.from(await doc());
  await writeFile(join(dir, 'deck.js'), 'throw new Error("broken\\nsecond line");');
  await vi.waitFor(() => expect(warning).toHaveBeenCalledTimes(1), { timeout: 8000 });
  expect(warning.mock.calls[0][0]).toBe('[script-doc] test: broken second line');
  expect(error).not.toHaveBeenCalled();
  expect(saved.equals(Buffer.from(await doc()))).toBe(true);
  warning.mockClear();
  await writeFile(join(dir, 'deck.js'), 'export default { unfinished:');
  await vi.waitFor(() => expect(warning).toHaveBeenCalledTimes(1), { timeout: 8000 });
  expect(warning.mock.calls[0][0].includes('\n')).toBe(false);
  expect(warning.mock.calls[0][0].length).toBeLessThan(210);
  expect(error).not.toHaveBeenCalled();
  expect(saved.equals(Buffer.from(await doc()))).toBe(true);
  await writeFile(join(dir, 'deck.js'), source.replace('title: \'Test\'', 'title: \'Recovered\''));
  await contains('# Recovered の原稿');
  await writeFile(join(dir, 'script.md'), 'manual change\n');
  await new Promise(resolve => setTimeout(resolve, 700));
  expect(await doc()).toBe('manual change\n');
  expect(navigations).toBe(baseline);
  expect(server.environments.client.moduleGraph.getModulesByFile(join(dir, 'script.md'))).toBeUndefined();
}, 40_000);
