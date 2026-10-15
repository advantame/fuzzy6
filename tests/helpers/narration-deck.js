import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer } from 'vite';

// Match tools/narrate.mjs's read-only SSR loader. Load both modules in the same
// server to check provenance by identity, not by source-text matching or JSON
// equality (an inline example can have the same values as a file).
export async function loadNarrationDeck(root, id) {
  const server = await createServer({ root, configFile: join(root, 'vite.config.js'), configLoader: 'runner',
    logLevel: 'error', server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    environments: { ssr: { optimizeDeps: { noDiscovery: true, include: [] } } },
  });
  try {
    const deck = (await server.ssrLoadModule(`/decks/${id}/deck.js`)).default;
    const exists = await access(join(root, 'decks', id, 'voice/manifest.json')).then(() => true).catch(error => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });
    const manifest = exists ? (await server.ssrLoadModule(`/decks/${id}/voice/manifest.json`)).default : undefined;
    return { deck, recordingsRequired: exists && deck.voice?.manifest === manifest };
  } finally { await server.close(); }
}
