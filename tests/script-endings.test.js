import { it } from 'vitest';
import { loadDeck, ROOT } from '../tools/narrate.mjs';
import { deckIds } from '../tools/script-files.mjs';
import { deckEndings, formatEnding } from '../tools/narrate/endings.mjs';

for (const id of await deckIds(ROOT)) {
  it(`${id}: no adjacent の。 endings by the same narrator`, async () => {
    const deck = await loadDeck(ROOT, id);
    const { adjacent } = deckEndings(deck, { deckId: id });
    if (!adjacent.length) return;
    // Report locations and sentences directly, without an assertion diff of the deck.
    throw new Error(`隣り合う「の。」（要修正）: ${adjacent.length}組\n${adjacent.map(formatEnding).join('\n')}`);
  }, 30_000);
}
