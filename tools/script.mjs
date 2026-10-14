import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadDeck, ROOT } from './narrate.mjs';
import { deckIds, writeScript, shortError } from './script-files.mjs';

export async function main(args = process.argv.slice(2), { root = ROOT, load = loadDeck, log = console.log } = {}) {
  const available = await deckIds(root);
  const ids = args.length ? [...new Set(args)] : available;
  for (const id of ids) if (!available.includes(id)) throw new Error(`デッキがありません: ${id}`);
  for (const id of ids) {
    const changed = await writeScript(root, id, await load(root, id));
    log(`${id}: ${changed ? '書き直した' : '変わらない'}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(shortError(error)); process.exitCode = 1; });
}
