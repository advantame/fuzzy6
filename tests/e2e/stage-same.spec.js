import { test, expect } from '@playwright/test';

// The browser compares RGBA arrays locally. Only a bounded numerical summary crosses the
// protocol, so even a completely different frame cannot generate a binary assertion diff.
async function bounded(operation, label, ms = 90_000) {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label}: exceeded ${ms}ms`)), ms); }),
    ]);
  } finally { clearTimeout(timer); }
}

for (const id of ['base', 'mcpflow', 'session']) {
  test(`${id}: retained stage matches the legacy pixels`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/tests/fixtures/stage-same/', { timeout: 30_000 });
    await page.waitForFunction(() => window.ready, null, { timeout: 15_000 });
    const start = performance.now();
    const sets = [{ label: '0.1s', times: { every: 0.1 } }, { label: 'stops', times: 'stops' }];
    if (id !== 'base') {
      // Read the declared bridge rather than duplicating its length in the test.
      const bridge = await bounded(page.evaluate(async id => (await import(`/decks/llm/clips/${id}.js`)).default.bridge, id), `${id}: bridge`, 15_000);
      expect(bridge).toBeGreaterThan(0);
      expect(bridge).toBeLessThanOrEqual(3);
      const times = Array.from({ length: Math.ceil(bridge / 0.01) }, (_, i) => i * 0.01);
      times.push(bridge);
      sets.push({ label: 'bridge 0.01s', times });
    }
    let frames = 0;
    for (const { label, times } of sets) {
      const result = await bounded(page.evaluate(({ id, times }) => window.compare(id, times), { id, times }), `${id} ${label}`);
      const detail = result.error ?? result.bad?.map(({ t, n, box }) => `t=${t}: ${n} pixels [${box}]`).join('; ');
      expect(result.error, `${id} ${label}: ${detail}`).toBeUndefined();
      expect(result.frames, `${id} ${label}: no frames compared`).toBeGreaterThan(0);
      expect(result.differ, `${id} ${label}: ${detail}`).toBe(0);
      frames += result.frames;
      console.log(`${id} ${label}: ${result.frames} frames, ${result.worst} differing pixels`);
    }
    console.log(`${id}: ${frames} frames in ${((performance.now() - start) / 1000).toFixed(2)}s`);
  });
}

test('pixel comparison rejects invalid or excessive samples before drawing', async ({ page }) => {
  await page.goto('/tests/fixtures/stage-same/', { timeout: 30_000 });
  await page.waitForFunction(() => window.ready, null, { timeout: 15_000 });
  const errors = await bounded(page.evaluate(async () => {
    const inputs = [null, { every: 0 }, { every: -1 }, { every: NaN }, { every: Infinity }, { every: 1e-20 }, [], [NaN], [-1], [Infinity]];
    const errors = [];
    for (const times of inputs) {
      try { await window.compare('base', times); errors.push(false); }
      catch { errors.push(true); }
    }
    return { errors, layers: document.querySelectorAll('.mx-layer').length };
  }), 'invalid comparison samples', 15_000);
  expect(errors.errors).toEqual(Array(10).fill(true));
  expect(errors.layers).toBe(0);
});
