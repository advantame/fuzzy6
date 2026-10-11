import { test, expect } from '@playwright/test';

const boot = async page => {
  await page.goto('/decks/demo/?c=script&t=0&tune');
  await page.waitForFunction(() => window.__ready);
};
const select = (page, tier) => page.locator(`.mx-tune-field[data-key="voice.speed.${tier}"] select`);
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('mx-tune:demo')));

test('three speed selects show recorded choices plus the current value, and follow clip changes', async ({ page }) => {
  await boot(page);
  for (const tier of ['slow', 'normal', 'fast']) await expect(select(page, tier)).toBeEnabled();
  await expect(select(page, 'slow')).toHaveValue('1.1');
  await expect(select(page, 'slow').locator('option')).toHaveText(['1.1（録りなし）', '1.3', '1.5']);
  await expect(select(page, 'normal').locator('option')).toHaveText(['1.3', '1.5']);
  await expect(select(page, 'fast')).toHaveValue('1.5');
  await select(page, 'slow').selectOption('1.5');
  await expect(select(page, 'slow')).not.toBeFocused();
  expect(await page.evaluate(() => window.__mx.pace().voice.speed)).toEqual({ slow: 1.5, normal: 1.3, fast: 1.5 });
  const saved = await stored(page);
  expect(saved.defaults.voice.speed).toEqual({ slow: 1.1, normal: 1.3, fast: 1.5 });
  expect(saved.defaults.rest.long).toBe(1);
  expect(saved.pace.voice.speed.slow).toBe(1.5);
  await page.evaluate(() => window.__go('opening', 0));
  for (const tier of ['slow', 'normal', 'fast']) {
    await expect(select(page, tier)).toBeDisabled();
    await expect(select(page, tier).locator('option')).toHaveCount(1);
    await expect(select(page, tier).locator('option')).toContainText('録りなし');
  }
  await page.evaluate(() => window.__go('script', 0));
  await expect(select(page, 'slow')).toBeEnabled();
  await page.evaluate(() => window.__mx.setPace({ voice: { speed: { normal: 1.4 } } }));
  await expect(select(page, 'normal').locator('option')).toHaveText(['1.3', '1.4（録りなし）', '1.5']);
  await expect(select(page, 'normal')).toHaveValue('1.4');
});

test('saved adjustments restore only with identical complete defaults, independent of key order', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.__mx.setPace({ pre: 0.9, voice: { speed: { normal: 1.5 } } }));
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mx-tune:demo'));
    saved.defaults = Object.fromEntries(Object.entries(saved.defaults).reverse());
    saved.defaults.voice.speed = Object.fromEntries(Object.entries(saved.defaults.voice.speed).reverse());
    localStorage.setItem('mx-tune:demo', JSON.stringify(saved));
  });
  await page.reload(); await page.waitForFunction(() => window.__ready);
  expect(await page.evaluate(() => window.__mx.pace().pre)).toBe(0.9);
  await expect(select(page, 'normal')).toHaveValue('1.5');
  await page.goto('/decks/demo/?c=script&t=0'); await page.waitForFunction(() => window.__ready);
  expect(await page.evaluate(() => window.__mx.pace().pre)).toBe(0.3);
  expect((await stored(page)).pace.pre).toBe(0.9);
});

for (const obsolete of ['legacy', 'missing-defaults', 'changed-speed', 'changed-rest', 'partial-defaults']) {
  test(`discards stored adjustments: ${obsolete}`, async ({ page }) => {
    await boot(page);
    await page.evaluate(obsolete => {
      window.__mx.setPace({ pre: 1.2 });
      let saved = JSON.parse(localStorage.getItem('mx-tune:demo'));
      if (obsolete === 'legacy') saved = { pre: 1.2, voice: { speed: 1 } };
      if (obsolete === 'missing-defaults') delete saved.defaults;
      if (obsolete === 'changed-speed') saved.defaults.voice.speed.normal = 1;
      if (obsolete === 'changed-rest') saved.defaults.rest.long = 2;
      if (obsolete === 'partial-defaults') delete saved.defaults.voice;
      localStorage.setItem('mx-tune:demo', JSON.stringify(saved));
    }, obsolete);
    await page.reload(); await page.waitForFunction(() => window.__ready);
    expect(await page.evaluate(() => window.__mx.pace().pre)).toBe(0.3);
    const fresh = await stored(page); // navigation persists the newly resolved defaults
    expect(fresh.pace).toEqual(fresh.defaults);
    expect(fresh.defaults.voice.speed.normal).toBe(1.3);
    expect(fresh.defaults.rest.long).toBe(1);
  });
}

test('saved defaults include deck overrides and are invalidated when those change', async ({ page }) => {
  await page.goto('/tests/fixtures/?t=0&tune'); await page.waitForFunction(() => window.__ready);
  await page.evaluate(() => {
    window.__mx.destroy();
    window.fixtureDeck.pace = { voice: { speed: { slow: 1.2 } }, rest: { long: 1.4 } };
    window.makeExplorer();
  });
  await page.waitForFunction(() => window.__ready);
  await page.evaluate(() => window.__mx.setPace({ pre: 0.8 }));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mx-tune:fixture')).defaults.rest.long)).toBe(1.4);
  await page.evaluate(() => { window.__mx.destroy(); window.makeExplorer(); });
  await page.waitForFunction(() => window.__ready);
  expect(await page.evaluate(() => window.__mx.pace().pre)).toBe(0.8);
  await page.evaluate(() => {
    window.__mx.destroy(); window.fixtureDeck.pace.voice.speed.slow = 1.1; window.makeExplorer();
  });
  await page.waitForFunction(() => window.__ready);
  expect(await page.evaluate(() => window.__mx.pace().pre)).toBe(0.3);
  const fresh = await page.evaluate(() => JSON.parse(localStorage.getItem('mx-tune:fixture')));
  expect(fresh.pace).toEqual(fresh.defaults);
  expect(fresh.defaults.voice.speed.slow).toBe(1.1);
  expect(fresh.defaults.rest.long).toBe(1.4);
});

test('changing a speed tier selects recordings only for lines that use that tier', async ({ page }) => {
  await page.goto('/tests/fixtures/?t=0&tune'); await page.waitForFunction(() => window.__ready);
  await page.evaluate(() => {
    window.__mx.destroy();
    const clip = window.fixtureDeck.chapters[0].clips[0];
    delete clip.duration;
    clip.script = [{ id: 'a', text: '例', speed: 'slow' }, { id: 'b', text: '例' }, { id: 'c', text: '例', speed: 'fast' }];
    const takes = { '1.1': { duration: 1, anchors: {}, file: 'slow.opus' },
      '1.3': { duration: 0.8, anchors: {}, file: 'normal.opus' }, '1.5': { duration: 0.6, anchors: {}, file: 'fast.opus' } };
    window.fixtureDeck.voice = { manifest: { clips: { 'clip-0': Object.fromEntries(clip.script.map(l => [l.id, { source: '例', takes }])) } } };
    window.makeExplorer();
  });
  await page.waitForFunction(() => window.__ready);
  const lengths = () => page.evaluate(() => ['a', 'b', 'c'].map(id =>
    Math.round((window.__mx.at(`${id}.end`) - window.__mx.at(`${id}.voice`)) * 1000) / 1000));
  expect(await lengths()).toEqual([1, 0.8, 0.6]);
  await select(page, 'slow').selectOption('1.5');
  expect(await lengths()).toEqual([0.6, 0.8, 0.6]);
  await page.locator('.mx-tune-reset').click();
  expect(await lengths()).toEqual([1, 0.8, 0.6]);
});

test('a line speed error stays within its clip and navigation still works', async ({ page }) => {
  await page.goto('/tests/fixtures/?t=0'); await page.waitForFunction(() => window.__ready);
  await page.evaluate(() => {
    window.__mx.destroy();
    const clip = window.fixtureDeck.chapters[0].clips[0];
    delete clip.duration;
    clip.script = [{ id: 'a', text: '例', speed: 1.3 }];
    window.makeExplorer();
  });
  await page.waitForFunction(() => window.__ready);
  await expect(page.locator('.mx-error')).toContainText('Invalid line speed');
  await page.evaluate(() => window.__go('clip-1', 0));
  await expect(page.locator('.mx-error')).toHaveCount(0);
});
