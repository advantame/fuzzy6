import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stat } from 'node:fs/promises';
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
  expect(paths).toHaveLength(7); // zero short rest merges a.done with b.start
  expect(paths.some(p => p.endsWith('-still-a_t2.1.png'))).toBe(true);
  expect(paths.some(p => p.endsWith('-ground-a_t1.png'))).toBe(true);
  expect(paths.some(p => p.endsWith('-ground-b_t3.1.png'))).toBe(true);
  expect(paths.some(p => p.endsWith('-ground-spin_t6.5.png'))).toBe(true);
  for (const path of paths) expect((await stat(path)).size).toBeGreaterThan(100);
  const posters = await run(['--posters']);
  const ordered = posters.stdout.trim().split('\n').map(p => p.split('/').at(-1));
  expect(ordered.slice(0, 4)).toEqual(['01-opening.png', '02-sweep.png', '03-detail.png', '04-dom.png']);
  expect(ordered).toContain('07-script.png');
  await run(['detail', '--stops']);
  await run(['detail', '--sheet', '--every', '1']);
  await run(['detail', '1']);
  expect((await stat('test-output/demo/detail_sheet.png')).size).toBeGreaterThan(100);
  expect((await stat('test-output/demo/detail_t1.png')).size).toBeGreaterThan(100);
  await run(['script', '--sheet', '--every', '2']);
  expect((await stat('test-output/demo/script_sheet.png')).size).toBeGreaterThan(100);
  const bridgeStops = (await run(['cues', '--stops'])).stdout.trim().split('\n');
  expect(bridgeStops).toHaveLength(4);
  expect(bridgeStops[0].endsWith('_t0.6.png')).toBe(true);
  expect(bridgeStops.some(p => p.endsWith('_t0.png'))).toBe(false);
  await run(['cues', '0']);
  expect((await stat('test-output/demo/cues_t0.png')).size).toBeGreaterThan(100);
});
