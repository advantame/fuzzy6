import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const exec = promisify(execFile);

test('capture supports computed durations, named posters, and all stops/ground frames', async () => {
  test.setTimeout(90_000);
  const run = args => exec(process.execPath, ['tools/capture.mjs', 'demo', ...args, '--size', '480x270', '--timeout', '20'], {
    cwd: resolve(import.meta.dirname, '../..'), env: { ...process.env, FUZZY6_URL: 'http://127.0.0.1:8082' },
    timeout: 25_000, maxBuffer: 32 * 1024, killSignal: 'SIGTERM',
  });
  const stops = await run(['script', '--stops']);
  const paths = stops.stdout.trim().split('\n');
  expect(paths).toHaveLength(8);
  expect(paths.some(p => p.endsWith('-still-a_t2.1.png'))).toBe(true);
  expect(paths.some(p => p.endsWith('-ground-a_t1.png'))).toBe(true);
  expect(paths.some(p => p.endsWith('-ground-b_t3.4.png'))).toBe(true);
  expect(paths.some(p => p.endsWith('-ground-spin_t6.8.png'))).toBe(true);
  for (const path of paths) expect((await stat(path)).size).toBeGreaterThan(100);
  await run(['--posters']);
  expect(await readdir('test-output/demo/posters')).toContain('06-script.png');
  await run(['script', '--sheet', '--every', '2']);
  expect((await stat('test-output/demo/script_sheet.png')).size).toBeGreaterThan(100);
});
