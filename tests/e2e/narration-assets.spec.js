import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { deckIds } from '../../tools/script-files.mjs';
import { decodeTakes } from '../helpers/decode-takes.js';

const root = resolve(import.meta.dirname, '../..');
async function emptyPage(page) {
  // Same origin as the self-hosted 8082 app, without starting an explorer,
  // home-page cover iframes, or playback. Asset URLs still come from the deck.
  await page.route('**/__audio-check', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Audio check</title>' }));
  await page.goto('/__audio-check');
}

test('decode check rejects corrupt bytes and incorrect recorded duration', async ({ page }) => {
  await emptyPage(page);
  const valid = [{ id: 'fixture/tone@1', url: '/tests/fixtures/tone.opus', duration: 3 }];
  expect((await page.evaluate(decodeTakes, valid)).count).toBe(1);
  await expect(page.evaluate(decodeTakes, [{ ...valid[0], duration: 3.01 }])).rejects.toThrow('fixture/tone@1: duration=3.01');
  await page.route('**/tests/fixtures/tone.opus', route => route.fulfill({ contentType: 'audio/ogg', body: Buffer.from([0, 1, 2, 3]) }));
  await expect(page.evaluate(decodeTakes, valid)).rejects.toThrow('fixture/tone@1: decode failed');
  await page.unroute('**/tests/fixtures/tone.opus');
});

for (const id of await deckIds(root)) {
  const manifest = await readFile(resolve(root, 'decks', id, 'voice/manifest.json'), 'utf8').then(JSON.parse).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  // demo has only inline, deliberately silent contract examples, no manifest
  // file or distributed audio. Every disk manifest is checked, even unused takes.
  if (!manifest) continue;
  const takes = Object.entries(manifest.clips).flatMap(([clip, lines]) =>
    Object.entries(lines).flatMap(([line, record]) => Object.entries(record.takes ?? {}).map(([speed, take]) =>
      ({ id: `${id}/${clip}/${line}@${speed}`, file: take.file, duration: take.duration }))));
  test(`${id}: fetch and decode all ${takes.length} manifest takes`, async ({ page }) => {
    test.setTimeout(45_000);
    expect(takes.length).toBeGreaterThan(0);
    await emptyPage(page);
    const entries = await page.evaluate(async ({ id, takes }) => {
      const { default: deck } = await import(`/decks/${id}/deck.js`);
      return takes.map(take => ({ ...take, url: deck.voice?.url?.(take.file) }));
    }, { id, takes });
    const result = await page.evaluate(decodeTakes, entries);
    expect(result.count).toBe(takes.length);
    console.log(`${id}: decoded=${result.count} maxDelta=${result.maxDelta.toFixed(9)}s`);
  });
}
