import { mergeConfig } from 'vite';
import config from '../vite.config.js';

// Concurrent deck authoring must not restart playback in a running browser test.
// The development server keeps its normal watcher; this config is only for 8082.
export default mergeConfig(config, {
  server: { host: '127.0.0.1', port: 8082, strictPort: true, watch: null, hmr: false },
});
