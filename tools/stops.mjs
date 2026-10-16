// npm run stops -- [deck] [clipId …] [--update]
// Requires dev server; FUZZY6_URL defaults to http://127.0.0.1:5175.
// No IDs: all decks including dives. --update replaces only selected clips;
// a whole-deck update also removes deleted clips. Every updated frame is captured
// twice to verify determinism. Hashes are SHA-256 of 1600x900 RGBA stage pixels.
// Comparison exits 1 on differences; errors exit 2. 540s external deadline.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { supervised, step, output } from './inspect/runtime.mjs';
import { withBrowser, openDeck, selectClips } from './inspect/browser.mjs';
import { root, deckIds, baseline, saveBaseline, inspectStops } from './inspect/stops.mjs';
await supervised(import.meta.url, async args => {
  const update = args.includes('--update');
  const positional = args.filter(a => a !== '--update');
  if (positional.some(a => a.startsWith('--'))) throw new Error('Unknown stops option');
  const [deck, ...ids] = positional, decks = await deckIds();
  if (deck && !decks.includes(deck)) throw new Error(`Unknown deck: ${deck}`);
  const log = output(), started = performance.now();
  let saved = 0, total = 0, bad = false;
  await withBrowser(async browser => {
    for (const id of deck ? [deck] : decks) {
      const page = await step(browser.newPage({ deviceScaleFactor: 1 }));
      try {
        const clips = selectClips(await openDeck(page, id), ids), old = await baseline(id);
        if (ids.length && update && old.chromium && old.chromium !== browser.version())
          throw new Error('Chromium changed: update the whole deck to avoid mixed baselines');
        const result = await inspectStops(page, clips, old, { update, repeat: update, report: log,
          onDifference: async ({ id: clipId, key, png }) => {
            if (!png || saved >= 20) return;
            saved++;
            const dir = resolve(root, 'test-results/stops');
            await mkdir(dir, { recursive: true });
            await writeFile(resolve(dir, `${id}-${clipId}-${key.replaceAll(':', '-')}.png`), png);
          } });
        if (!ids.length && !update) for (const clipId of Object.keys(old.clips ?? {})) if (!clips.some(c => c.id === clipId)) { bad = true; log(`${id}/${clipId}: baseline clip no longer exists`); }
        if (update) await saveBaseline(id, { version: 1, chromium: browser.version(), viewport: [1600,900], format: 'sha256-rgba', clips: ids.length ? { ...old.clips, ...result.actual } : result.actual });
        bad ||= result.differences.length > 0; total += result.count;
        log(`${id}: ${clips.length} clips, ${result.count} stops, ${update ? 'updated (two captures agree)' : `${result.differences.length} differences`}`);
      } finally { await step(page.close()); }
    }
  });
  log(`${total} stops in ${((performance.now()-started)/1000).toFixed(1)}s; ${saved} PNGs saved (limit 20)`);
  process.exitCode = bad ? 1 : 0;
});
