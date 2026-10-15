import { test, expect } from '@playwright/test';
const boot = async (page, query = '?c=quiz&t=1.5') => {
  await page.goto(`/decks/demo/${query}`);
  await page.waitForFunction(() => window.__mx?.state().clip && window.__mx.state().state !== 'loading');
};
const state = page => page.evaluate(() => window.__mx.state());
const clipIs = (page, id) => expect(page.locator('.mx')).toHaveAttribute('data-clip', id);
const enter = async page => {
  await page.evaluate(() => window.__mx.seek(window.__mx.at('q1.done')));
  await page.locator('.mx-door[data-to="motion-group"]').click();
  await clipIs(page, 'group-one');
};

test('group door, part indicator, axis/index grouping, down through group and return', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.mx-door')).toHaveAttribute('data-count', '3');
  await expect(page.locator('.mx-door-hint')).toHaveText('深掘り · 3 本');
  await enter(page);
  expect((await state(page)).dive).toEqual({ parent: 'quiz', depth: 1, group: 'motion-group', part: 1, parts: 3 });
  await expect(page.locator('.mx-no-part')).toHaveText('1/3');
  await expect(page.locator('.mx-tick[data-group="motion-group"]')).toHaveCount(3);
  await expect(page.locator('li[data-group-start] .mx-index-group')).toHaveText('三本の動き');
  await page.keyboard.press('ArrowDown'); await clipIs(page, 'group-two');
  expect((await state(page)).dive.depth).toBe(1); expect((await state(page)).t).toBe(0.4);
  await page.keyboard.press('ArrowDown'); await clipIs(page, 'group-three');
  await page.keyboard.press('ArrowDown'); await clipIs(page, 'quiz');
  expect((await state(page)).t).toBe(await page.evaluate(() => window.__mx.at('q1.done')));
});

test('up moves to previous heads, left to previous ends, and group start returns', async ({ page }) => {
  await boot(page); await enter(page);
  await page.keyboard.press('ArrowDown'); await clipIs(page, 'group-two');
  await page.keyboard.press('ArrowUp'); await clipIs(page, 'group-one');
  expect((await state(page)).t).toBe(0);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowLeft'); await clipIs(page, 'group-one');
  expect(await state(page)).toMatchObject({ t: 1, state: 'ended' });
  await page.keyboard.press('ArrowUp'); await clipIs(page, 'quiz');
});

for (const key of ['Escape', 'Backspace']) test(`${key} returns from the middle of a group`, async ({ page }) => {
  await boot(page); await enter(page);
  await page.keyboard.press('ArrowDown'); await clipIs(page, 'group-two');
  await page.keyboard.press(key); await clipIs(page, 'quiz');
  expect((await state(page)).dive).toBeNull();
});

test('auto advances through the group, cut joins play the bridge, final clip returns', async ({ page }) => {
  await boot(page, '?c=quiz&sound=0&auto=1');
  await enter(page);
  await page.evaluate(() => {
    window.groupChanges = [];
    window.__mx.on('change', s => { if (window.groupChanges.length < 10) window.groupChanges.push({ clip: s.clip, t: s.t, depth: s.dive?.depth }); });
  });
  await clipIs(page, 'quiz');
  const changes = await page.evaluate(() => window.groupChanges);
  expect(changes.slice(0, 3).map(s => s.clip)).toEqual(['group-two', 'group-three', 'quiz']);
  expect(changes[0]).toMatchObject({ t: 0, depth: 1 });
});

test('cut replaces the final layer in one step; partial next and direct entry skip the bridge', async ({ page }) => {
  await boot(page, '?c=group-one&sound=0');
  await page.evaluate(() => { window.__mx.pause(); window.__mx.seek(1); });
  const joined = await page.evaluate(async () => {
    await window.__mx.next();
    return { state: window.__mx.state(), roles: [...document.querySelectorAll('.mx-layer')].map(el => el.dataset.role) };
  });
  expect(joined.state).toMatchObject({ clip: 'group-two', t: 0, head: 0.4 });
  expect(joined.roles).toEqual(['current']);
  await page.evaluate(() => window.__mx.go('group-two'));
  expect((await state(page)).t).toBeGreaterThanOrEqual(0.4);
  await page.evaluate(async () => { await window.__mx.go('group-one'); window.__mx.pause(); window.__mx.seek(0.2); await window.__mx.next(); });
  expect((await state(page)).t).toBeGreaterThanOrEqual(0.4);
  await expect(page.locator('.mx-layer[data-role="out"]')).toHaveCount(1);
});
