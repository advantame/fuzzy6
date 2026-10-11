import { test, expect } from '@playwright/test';

const boot = async (page, query = '') => {
  await page.goto(`/decks/gutter-fixture/?t=0${query}`);
  await page.waitForFunction(() => window.__ready);
};
const rect = (page, name) => page.locator(`.mx-${name}`).evaluate(el => [el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight]);
const scale = page => page.locator('.mx').evaluate(el => Number(el.style.getPropertyValue('--mx-k')));

test('default geometry and absent gutter remain unchanged', async ({ page }) => {
  await page.goto('/tests/fixtures/?t=0');
  await page.waitForFunction(() => window.__ready);
  expect(await rect(page, 'frame')).toEqual([0, 0, 1920, 1080]);
  expect(await rect(page, 'bar')).toEqual([320, 900, 1600, 180]);
  expect((await rect(page, 'seek'))[2]).toBe(1600);
  expect(await scale(page)).toBe(1);
  await expect(page.locator('.mx-gutter')).toHaveCount(0);
  expect(await page.locator('.mx').evaluate(el => [el.style.getPropertyValue('--mx-gutter'), el.hasAttribute('data-gutter')])).toEqual(['0px', false]);
});

test('gutter extends only frame and bar; scaling and seek use their own widths', async ({ page }) => {
  await boot(page);
  expect(await rect(page, 'frame')).toEqual([0, 0, 2040, 1080]);
  expect(await rect(page, 'bar')).toEqual([320, 900, 1720, 180]);
  expect((await rect(page, 'seek'))[2]).toBe(1600);
  expect(await rect(page, 'gutter')).toEqual([1920, 0, 120, 900]);
  expect(await rect(page, 'stage')).toEqual([320, 0, 1600, 900]);
  expect(await rect(page, 'rail')).toEqual([0, 0, 320, 900]);
  expect(await rect(page, 'corner')).toEqual([0, 900, 320, 180]);
  expect(await page.locator('.mx').evaluate(el => [el.style.getPropertyValue('--mx-gutter'), el.hasAttribute('data-gutter')])).toEqual(['120px', true]);
  expect(await page.locator('.mx-gutter').evaluate(el => [el.previousElementSibling.className, el.nextElementSibling.className])).toEqual(['mx-bar', 'mx-index']);
  await page.evaluate(() => window.__mx.openIndex());
  expect(await rect(page, 'index')).toEqual([320, 0, 1600, 900]);
  await page.evaluate(() => window.__mx.closeIndex());
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 2400, height: 1080 }, { width: 1020, height: 600 }]) {
    await page.setViewportSize(viewport);
    const k = Math.min(viewport.width / 2040, viewport.height / 1080);
    await expect.poll(() => scale(page)).toBeCloseTo(k, 6);
    const box = await page.locator('.mx-frame').boundingBox();
    expect(box.x).toBeCloseTo((viewport.width - 2040 * k) / 2, 3);
    expect(box.y).toBeCloseTo((viewport.height - 1080 * k) / 2, 3);
    const seek = await page.locator('.mx-seek').boundingBox();
    for (const fraction of [0.25, 0.5, 0.75]) {
      await page.mouse.click(seek.x + seek.width * fraction, seek.y + seek.height / 2);
      expect(await page.evaluate(() => window.__mx.state().t)).toBeCloseTo(12 * fraction, 2);
    }
  }
});

test('clean mode excludes gutter and fits the stage', async ({ page }) => {
  await boot(page, '&clean');
  await expect(page.locator('.mx-gutter')).toBeHidden();
  expect(await rect(page, 'frame')).toEqual([0, 0, 1600, 900]);
  expect(await rect(page, 'stage')).toEqual([0, 0, 1600, 900]);
  expect(await scale(page)).toBeCloseTo(1.2, 6);
});

test('tuning panel reserves room beside the wider frame', async ({ page }) => {
  await boot(page, '&tune');
  const side = await page.locator('.mx-tune').evaluate(el => el.offsetWidth);
  expect(side).toBeGreaterThan(0);
  expect(await scale(page)).toBeCloseTo((1920 - side) / 2040, 6);
});

test('invalid gutter fails before mounting an explorer', async ({ page }) => {
  await page.goto('/tests/fixtures/?t=0');
  await page.waitForFunction(() => window.__ready);
  const result = await page.evaluate(() => {
    window.__mx.destroy();
    window.fixtureDeck.frame = { gutter: '120' };
    try { window.makeExplorer(); } catch (error) { return [error.message, document.querySelectorAll('.mx').length]; }
  });
  expect(result).toEqual(['deck.frame.gutter must be an integer from 0 to 240', 0]);
});
