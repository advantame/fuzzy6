import { it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadDeck, ROOT } from '../tools/narrate.mjs';
import { deckIds } from '../tools/script-files.mjs';
import { renderScript } from '../tools/script-doc.mjs';

// Never hand a full document to an assertion library's diff renderer.
export function checkScript(actual, expected, id) {
  if (actual.equals(expected)) return;
  let offset = 0, line = 1;
  while (offset < Math.min(actual.length, expected.length) && actual[offset] === expected[offset]) {
    if (expected[offset] === 10) line++;
    offset++;
  }
  throw new Error(`decks/${id}/script.md: ${line} 行目 — npm run script -- ${id}`);
}

it('reports a short first-line mismatch, including missing and shorter files', () => {
  for (const [actual, expected, line] of [['a\nb', 'a\nc', 2], ['', 'a', 1], ['a', 'a\nb', 1]]) {
    try { checkScript(Buffer.from(actual), Buffer.from(expected), 'test'); }
    catch (error) {
      if (error.message !== `decks/test/script.md: ${line} 行目 — npm run script -- test`) throw error;
      continue;
    }
    throw new Error('Mismatch was not detected');
  }
});

for (const id of await deckIds(ROOT)) {
  it(`${id}: committed script matches the current narration`, async () => {
    const text = renderScript(await loadDeck(ROOT, id));
    if (!text) return;
    const actual = await readFile(join(ROOT, 'decks', id, 'script.md')).catch(error => {
      if (error.code !== 'ENOENT') throw error;
      return Buffer.alloc(0);
    });
    checkScript(actual, Buffer.from(text), id);
  }, 30_000);
}
