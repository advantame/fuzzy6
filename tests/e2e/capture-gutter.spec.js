import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { open } from 'node:fs/promises';
import { resolve } from 'node:path';

const exec = promisify(execFile);
test('capture defaults follow gutter, preserve clean, and honor explicit sizes', async () => {
  test.setTimeout(120_000);
  for (const [deck, clip, args, expected] of [
    ['demo', 'sweep', [], [1920, 1080]],
    ['gutter-fixture', 'sample', [], [2040, 1080]],
    ['gutter-fixture', 'sample', ['--clean'], [1920, 1080]],
    ['gutter-fixture', 'sample', ['--size', '510x270'], [510, 270]],
    ['gutter-fixture', 'sample', ['--clean', '--size', '480x270'], [480, 270]],
  ]) {
    const { stdout } = await exec(process.execPath, ['tools/capture.mjs', deck, clip, '0', ...args, '--timeout', '20'], {
      cwd: resolve(import.meta.dirname, '../..'), env: { ...process.env, FUZZY6_URL: 'http://127.0.0.1:8082' },
      timeout: 25_000, maxBuffer: 32 * 1024, killSignal: 'SIGTERM',
    });
    const file = await open(stdout.trim());
    try {
      const header = Buffer.alloc(24);
      const { bytesRead } = await file.read(header, 0, header.length, 0);
      expect(bytesRead).toBe(24);
      expect([header.readUInt32BE(16), header.readUInt32BE(20)]).toEqual(expected);
    } finally { await file.close(); }
  }
});
