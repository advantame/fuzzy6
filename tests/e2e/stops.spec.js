import { test } from '@playwright/test';
import { mkdir, open, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { deckIds, baseline, inspectStops } from '../../tools/inspect/stops.mjs';
import { openDeck } from '../../tools/inspect/browser.mjs';

// Atomic slots share the 20-PNG budget across parallel deck tests/workers.
async function artifact(testInfo, deck, { id, key, png }) {
  if (!png) return;
  const dir = resolve(testInfo.project.outputDir, 'stop-differences');
  await mkdir(dir, { recursive: true });
  for (let i = 0; i < 20; i++) {
    try {
      const slot = await open(resolve(dir, `${i}.slot`), 'wx');
      await slot.close();
      await writeFile(resolve(dir, `${deck}-${id}-${key.replaceAll(':', '-')}.png`), png);
      return;
    } catch (e) { if (e.code !== 'EEXIST') throw e; }
  }
}
test.describe.configure({ mode: 'parallel' });
test.use({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
for (const deck of await deckIds()) test(`${deck}: all stop stage pixels match baseline`, async ({ page, browser }, testInfo) => {
  test.setTimeout(540000);
  const expected = await baseline(deck);
  if (expected.chromium && expected.chromium !== browser.version()) throw new Error(`Stop baseline Chromium ${expected.chromium}; running ${browser.version()}. Re-capture with pinned Chromium.`);
  const clips = await openDeck(page, deck, { baseURL: testInfo.project.use.baseURL });
  const result = await inspectStops(page, clips, expected, { onDifference: value => artifact(testInfo, deck, value) });
  const removed = Object.keys(expected.clips).filter(id => !clips.some(c => c.id === id)).map(id => `${id}: baseline clip no longer exists`);
  const messages = [...result.differences, ...removed];
  if (messages.length) throw new Error(`${messages.length} stop differences\n${messages.slice(0,40).join('\n')}${messages.length > 40 ? '\nFurther differences omitted' : ''}`);
  console.log(`${deck}: ${result.count} stop hashes matched`);
});
