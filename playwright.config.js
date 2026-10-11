import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 30_000, globalTimeout: 600_000, retries: 0,
  outputDir: 'test-results/',
  use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 }, baseURL: 'http://127.0.0.1:8082', actionTimeout: 5000, navigationTimeout: 15000 },
  webServer: { command: 'node node_modules/vite/bin/vite.js --config tests/vite.config.js --host 127.0.0.1 --port 8082 --strictPort', url: 'http://127.0.0.1:8082', reuseExistingServer: false, timeout: 30000 },
});
