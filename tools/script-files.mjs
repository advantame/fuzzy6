import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderScript } from './script-doc.mjs';

export async function deckIds(root) {
  const entries = await readdir(join(root, 'decks'), { withFileTypes: true });
  const result = [];
  for (const entry of entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    if ((await readdir(join(root, 'decks', entry.name))).includes('deck.js')) result.push(entry.name);
  }
  return result;
}

export async function writeScript(root, id, deck) {
  const content = renderScript(deck);
  if (!content) return false;
  const file = join(root, 'decks', id, 'script.md');
  const old = await readFile(file, 'utf8').catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (old === content) return false;
  await writeFile(file, content);
  return true;
}

export const shortError = error => String(error?.message ?? error).slice(0, 180).replace(/[\r\n\x1b]/g, ' ');
