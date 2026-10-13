import { test, expect } from '@playwright/test';

async function boot(page, query = '') {
  await page.goto(`/tests/fixtures/join/?sound=0&bridge=0.6${query}`);
  await page.waitForFunction(() => window.__mx?.state().state !== 'loading' && window.__mx?.state().clip, null, { timeout: 5000 });
}
async function firstTime(page) {
  await expect(page.locator('.mx')).toHaveAttribute('data-clip', 'after');
  return page.evaluate(() => window.lifecycle.find(e => e.id === 'after' && e.event === 'render').t);
}
async function stop(page, t) {
  await page.evaluate(t => { window.__mx.pause(); window.__mx.seek(t); }, t);
}

for (const action of ['next', 'nextStop', 'ArrowDown', 'ArrowRight', 'auto']) {
  test(`bridge plays from zero on a sequential join: ${action}`, async ({ page }) => {
    await boot(page);
    await stop(page, 2);
    if (action === 'auto') {
      await page.keyboard.press('a');
      await page.evaluate(() => { window.__mx.seek(1.9); window.__mx.play(); });
    } else if (action.startsWith('Arrow')) await page.keyboard.press(action);
    else await page.evaluate(action => window.__mx[action](), action);
    expect(await firstTime(page)).toBe(0);
    await page.waitForFunction(() => window.__mx.state().clip === 'after' && window.__mx.state().t >= 0.6, null, { timeout: 3000 });
    const s = await page.evaluate(() => window.__mx.state());
    expect(s.head).toBe(0.6);
    expect(s.stops[0].at).toBe(0.6);
    expect(s.stops.every(stop => stop.at >= s.head)).toBe(true);
    expect(await page.locator('.mx-seek-mark').first().getAttribute('data-seconds')).toBe('0.6');
  });
}

for (const action of ['up', 'index', 'midway', 'go', 'chapter', 'url']) {
  test(`ordinary entry starts at head: ${action}`, async ({ page }) => {
    await boot(page, action === 'up' ? '&c=last' : action === 'url' ? '&c=after' : '');
    if (action === 'up') await page.keyboard.press('ArrowUp');
    else if (action === 'index') {
      await page.keyboard.press('i');
      await page.locator('.mx-index-clip[data-clip="after"]').click();
    } else if (action === 'midway') {
      await stop(page, 0.5);
      await page.keyboard.press('ArrowDown');
    } else if (action === 'go') await page.evaluate(() => window.__mx.go('after'));
    else if (action === 'chapter') await page.keyboard.press('2');
    expect(await firstTime(page)).toBe(0.6);
  });
}

test('explicit positions, bridge arrows, restart and slider Home', async ({ page }) => {
  await boot(page, '&c=after&t=0.2');
  expect(await firstTime(page)).toBe(0.2);
  await page.evaluate(() => window.__mx.go('after', { t: 0 }));
  expect(await page.evaluate(() => window.__mx.state().t)).toBe(0);
  await page.evaluate(() => window.__mx.setPace({ skip: 0.01 }));
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => window.__mx.state().t)).toBe(0.6);
  await stop(page, 0.599);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.mx')).toHaveAttribute('data-clip', 'before');
  expect(await page.evaluate(() => window.__mx.state())).toMatchObject({ t: 2, state: 'ended', head: 0 });
  await page.evaluate(() => window.__mx.go('after', { t: 0.1 }));
  await page.keyboard.press('r');
  await page.evaluate(() => window.__mx.pause());
  const restarted = await page.evaluate(() => window.__mx.state().t);
  expect(restarted).toBeGreaterThanOrEqual(0.6);
  expect(restarted).toBeLessThan(0.85);
  await stop(page, 0.2);
  await page.locator('.mx-seek').focus();
  await page.keyboard.press('Home');
  expect(await page.evaluate(() => window.__mx.state().t)).toBe(0.6);
});

test('script head, voice-free bridge and pace edits retain the current bridge position', async ({ page }) => {
  await boot(page, '&c=after&script&t=0.234');
  const result = await page.evaluate(() => {
    window.__mx.setPace({ pre: 0.9, rest: { normal: 2 } });
    return { state: window.__mx.state(), start: window.__mx.at('a') };
  });
  expect(result.start).toBe(0.6);
  expect(result.state).toMatchObject({ head: 0.6, t: 0.234, line: null, duration: 2 });
  await page.evaluate(() => window.__mx.go('after'));
  expect(await page.evaluate(() => window.__mx.state())).toMatchObject({ t: 0.6, line: 'a' });
});

test('navigation rechecks the source during font waits before deciding to enter the bridge', async ({ page }) => {
  await boot(page, '&gate');
  await stop(page, 2);
  await page.evaluate(() => { void window.__mx.next(); });
  await page.waitForFunction(() => !!window.releaseFont, null, { timeout: 3000 });
  await page.evaluate(() => { window.__mx.seek(0.5); window.releaseFont([]); });
  expect(await firstTime(page)).toBe(0.6);
});

test('clips without a bridge retain a zero head', async ({ page }) => {
  await page.goto('/tests/fixtures/join/?sound=0&c=after&t=0');
  await page.waitForFunction(() => window.__ready, null, { timeout: 5000 });
  await page.evaluate(() => window.__mx.go('after'));
  expect(await page.evaluate(() => window.__mx.state())).toMatchObject({ head: 0, t: 0 });
});
