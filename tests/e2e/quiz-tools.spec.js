import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const exec = promisify(execFile);
const run = (tool, args) => exec(process.execPath, [`tools/${tool}.mjs`, 'demo', ...args, '--timeout', '40'], {
  cwd: resolve(import.meta.dirname, '../..'), env: { ...process.env, FUZZY6_URL: 'http://127.0.0.1:8082' },
  timeout: 45_000, maxBuffer: 32 * 1024, killSignal: 'SIGTERM',
});

test('capture answers affect the image and branch stops; group members can be captured', async () => {
  test.setTimeout(120_000);
  const args = ['quiz', '0.2', '--size', '480x270'];
  const first = (await run('capture', [...args, '--answers', 'q1:0,q2:2'])).stdout.trim();
  const right = await readFile(first);
  await run('capture', [...args, '--answers', 'q1:1,q2:0']);
  expect(right.equals(await readFile(first))).toBe(false);
  const stops = (await run('capture', ['quiz', '--stops', '--size', '480x270', '--answers', 'q1:0,q2:2'])).stdout;
  expect(stops).toContain('line-q1-yes'); expect(stops).not.toContain('line-q1-no');
  expect(stops).toContain('line-q2-yes'); expect(stops).not.toContain('line-q2-no');
  const member = (await run('capture', ['group-two', '--stops', '--size', '480x270'])).stdout;
  expect(member).toContain('_t0.4.png');
});

for (const mode of ['right', 'wrong', 'skip']) test(`play completes a real quiz with ${mode} answers`, async () => {
  test.setTimeout(50_000);
  const result = await run('play', ['quiz', '--answers', mode, '--jobs', '1']);
  expect(result.stdout).toContain('OK demo/quiz');
  expect(result.stdout).toContain('failed=0');
});
