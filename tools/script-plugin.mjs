import { relative, resolve } from 'node:path';
import { deckIds, writeScript, shortError } from './script-files.mjs';

export function scriptDocs() {
  let stop;
  return {
    name: 'script-docs',
    apply: 'serve',
    async configureServer(server) {
      // Also excludes the narration/CLI SSR loader, Vitest and the e2e config.
      if (server.config.server.watch === null || server.config.server.middlewareMode || server.config.mode === 'test') return;
      const root = server.config.root;
      const states = new Map();
      let closed = false;
      const active = new Set();
      // Vite logs a full SSR stack before rejecting. Only silence our own
      // evaluation reports; the catch below emits one bounded warning instead.
      const logger = server.environments.ssr.logger;
      const originalError = logger.error;
      const quietError = (message, ...args) => {
        if ([...active].some(id => message.includes(`Error when evaluating SSR module /decks/${id}/deck.js:`))) return;
        originalError.call(logger, message, ...args);
      };
      logger.error = quietError;
      const warn = (id, error) => server.config.logger.warn(`[script-doc] ${id}: ${shortError(error)}`);
      const run = id => {
        const state = states.get(id);
        if (closed || state.running) return;
        state.dirty = false;
        state.running = (async () => {
          active.add(id);
          try {
            // Invalidate SSR dependencies explicitly, including add/unlink and
            // failed loads. Browser modules and their HMR behavior are untouched.
            const graph = server.environments.ssr.moduleGraph;
            const prefix = resolve(root, 'decks', id) + '/';
            const seen = new Set();
            for (const [file, modules] of graph.fileToModulesMap) {
              if (file.startsWith(prefix)) for (const mod of modules) graph.invalidateModule(mod, seen);
            }
            const deck = (await server.ssrLoadModule(`/decks/${id}/deck.js`)).default;
            if (!closed) await writeScript(root, id, deck);
          } catch (error) { if (!closed) warn(id, error); }
          finally { active.delete(id); }
        })().finally(() => {
          state.running = null;
          if (!closed && state.dirty) schedule(id);
        });
      };
      const schedule = (id, delay = 300) => {
        if (closed) return;
        if (!states.has(id)) states.set(id, { timer: null, running: null, dirty: false });
        const state = states.get(id);
        state.dirty = true;
        clearTimeout(state.timer);
        if (!state.running) state.timer = setTimeout(() => run(id), delay);
      };
      const changed = file => {
        const match = relative(root, file).replaceAll('\\', '/').match(/^decks\/([^/]+)\/.+\.(?:js|json|mjs)$/);
        if (match) schedule(match[1]);
      };
      for (const event of ['change', 'add', 'unlink']) server.watcher.on(event, changed);
      stop = async () => {
        closed = true;
        for (const event of ['change', 'add', 'unlink']) server.watcher.off(event, changed);
        for (const state of states.values()) clearTimeout(state.timer);
        await Promise.allSettled([...states.values()].map(s => s.running));
        if (logger.error === quietError) logger.error = originalError;
      };
      try { for (const id of await deckIds(root)) schedule(id, 0); }
      catch (error) { warn('decks', error); }
    },
    async closeBundle() { await stop?.(); },
  };
}
