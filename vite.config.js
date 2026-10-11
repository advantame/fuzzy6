import { defineConfig } from 'vite';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Every decks/<id>/index.html is its own page; the root index.html lists the decks.
const root = import.meta.dirname;
const decks = readdirSync(resolve(root, 'decks'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(resolve(root, 'decks', d.name, 'index.html')))
  .map((d) => d.name);

// `import chars from 'virtual:chars/decks/llm'` gives every non-ASCII character used in the
// .js files under that directory. A deck passes them to deck.fonts (spec §6.4), so the
// Japanese glyphs its canvas text needs are loaded before the first frame, without listing
// strings by hand.
function deckChars() {
  const PREFIX = 'virtual:chars/';
  const jsFiles = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
      const p = resolve(dir, d.name);
      if (d.isDirectory()) return jsFiles(p);
      return d.name.endsWith('.js') ? [p] : [];
    });
  return {
    name: 'deck-chars',
    resolveId: (id) => (id.startsWith(PREFIX) ? '\0' + id : null),
    load(id) {
      if (!id.startsWith('\0' + PREFIX)) return null;
      const seen = new Set();
      for (const file of jsFiles(resolve(root, id.slice(PREFIX.length + 1)))) {
        this.addWatchFile(file);
        for (const ch of readFileSync(file, 'utf8')) if (ch.codePointAt(0) > 0x7e) seen.add(ch);
      }
      return `export default ${JSON.stringify([...seen].sort().join(''))};`;
    },
  };
}

export default defineConfig({
  // Relative asset paths, so dist/ works under any path (the host serves it below a prefix the app never sees).
  base: './',
  plugins: [deckChars()],
  server: { host: '127.0.0.1', port: 5175, strictPort: true },
  preview: { host: '127.0.0.1', port: 5176, strictPort: true },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        ...Object.fromEntries(decks.map((d) => [d, resolve(root, 'decks', d, 'index.html')])),
      },
    },
  },
});
