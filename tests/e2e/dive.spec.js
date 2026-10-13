import { test, expect } from '@playwright/test';
const boot = async (page, query = '?c=sweep&sound=0') => {
  await page.goto(`/decks/demo/${query}`);
  await page.waitForFunction(() => window.__mx?.state().clip && window.__mx.state().state !== 'loading');
};
const state = page => page.evaluate(() => window.__mx.state());
const clipIs = (page, id) => expect(page.locator('.mx')).toHaveAttribute('data-clip', id);
const pauseAt = (page, t) => page.evaluate(t => { window.__mx.pause(); window.__mx.seek(t); }, t);
const enter = async page => { await pauseAt(page, 4.25); await page.keyboard.press('Enter'); await clipIs(page, 'detail'); };

test('time-only doors in still mode, DOM, state snapshots, pointer descent and exact return', async ({ page }) => {
  await boot(page, '?c=sweep&t=2.999');
  expect((await state(page)).doors).toEqual([]);
  await pauseAt(page, 3);
  expect((await state(page)).doors).toEqual([{ to: 'detail', label: '時刻で何が決まる？', by: 'zunda' }]);
  await expect(page.locator('.mx-door')).toBeVisible();
  await expect(page.locator('.mx-door')).not.toHaveAttribute('data-state');
  await pauseAt(page, 4.25);
  await page.locator('.mx-door').click();
  await clipIs(page, 'detail');
  expect(await state(page)).toMatchObject({ dive: { parent: 'sweep', depth: 1 }, index: 1, count: 7, t: 0, doors: [] });
  await expect(page.locator('.mx')).toHaveAttribute('data-dive');
  await expect(page.locator('.mx-no-dive')).toHaveText('深掘り');
  await expect(page.locator('.mx-no-chapter')).toHaveText('1');
  await expect(page.locator('.mx-no-clip')).toHaveText('1');
  await expect(page.locator('.mx-count-now')).toHaveText('02');
  await expect(page.locator('.mx-prev')).toBeEnabled();
  await expect(page.locator('.mx-next')).toBeEnabled();
  await expect(page.locator('.mx-tick[data-dive]')).toHaveAttribute('data-state', 'current');
  await expect(page.locator('.mx-crumb[data-level="back"] .mx-crumb-name')).toHaveText('Canvas clock');
  await page.locator('.mx-crumb[data-level="back"]').click();
  await clipIs(page, 'sweep');
  expect(await state(page)).toMatchObject({ t: 4.25, dive: null, indexOpen: false });
  await expect(page.locator('.mx-crumb[data-level="back"]')).toHaveCount(0);
  await expect(page.locator('.mx')).not.toHaveAttribute('data-dive');
});

for (const key of ['ArrowUp', 'ArrowDown', 'Escape', 'Backspace']) {
  test(`${key} returns from a dive and resumes the saved time`, async ({ page }) => {
    await boot(page); await enter(page);
    await page.keyboard.press(key); await clipIs(page, 'sweep');
    const s = await state(page);
    expect(s.t).toBeGreaterThanOrEqual(4.25); expect(s.t).toBeLessThan(5.25);
    expect(s.state).toBe('playing'); expect(s.dive).toBeNull();
  });
}

test('left at zero and right at the end return; internal stops stay inside the dive', async ({ page }) => {
  await boot(page, '?c=sweep&t=4');
  await page.evaluate(() => window.__mx.descend());
  await page.keyboard.press('ArrowRight'); expect((await state(page)).t).toBe(1);
  await page.keyboard.press('ArrowLeft'); expect((await state(page)).t).toBe(0);
  await page.keyboard.press('ArrowLeft'); await clipIs(page, 'sweep');
  await page.evaluate(() => window.__mx.descend());
  await pauseAt(page, 2); await page.keyboard.press('ArrowRight'); await clipIs(page, 'sweep');
  expect((await state(page)).t).toBe(4);
});

test('returning to the final frame stops, and main-line down skips dives', async ({ page }) => {
  await boot(page); await pauseAt(page, 12);
  await expect(page.locator('.mx-door')).toBeVisible();
  await page.evaluate(() => window.__mx.descend());
  await page.evaluate(() => window.__mx.ascend());
  expect(await state(page)).toMatchObject({ clip: 'sweep', t: 12, state: 'ended' });
  await page.keyboard.press('ArrowDown'); await clipIs(page, 'dom');
});

test('auto returns after the dive hold and advances after returning to an ended parent', async ({ page }) => {
  await boot(page, '?c=sweep&sound=0&auto=1');
  await page.evaluate(() => window.__mx.setPace({ end: 0.3 }));
  await pauseAt(page, 12);
  await page.evaluate(() => window.__mx.descend());
  await page.evaluate(() => {
    window.changes = [];
    window.__mx.on('change', s => { if (window.changes.length < 10) window.changes.push({ ...s, when: performance.now() }); });
    window.__mx.seek(1.9); window.__mx.play();
  });
  await clipIs(page, 'dom');
  const changes = await page.evaluate(() => window.changes);
  expect(changes[0]).toMatchObject({ clip: 'sweep', t: 12, state: 'ended' });
  expect(changes[1].when - changes[0].when).toBeGreaterThanOrEqual(290);
  await page.evaluate(() => window.__mx.go('sweep', { t: 11.9 }));
  await clipIs(page, 'dom');
});

test('direct URL and index entry have depth zero and return to the parent from', async ({ page }) => {
  await boot(page, '?c=detail&t=1');
  expect((await state(page)).dive).toEqual({ parent: 'sweep', depth: 0 });
  await page.evaluate(() => window.__mx.ascend());
  expect(await state(page)).toMatchObject({ clip: 'sweep', t: 3 });
  await page.evaluate(() => window.__mx.descend());
  await page.keyboard.press('i');
  await expect(page.locator('.mx-index-clip[data-clip="detail"]')).toBeFocused();
  await expect(page.locator('.mx-index-clip[data-clip="detail"] canvas')).toHaveAttribute('data-drawn');
  await expect(page.locator('.mx-index-clips li[data-dive] .mx-index-no')).toHaveText('↳');
  await page.keyboard.press('Escape'); await clipIs(page, 'detail');
  expect((await state(page)).dive.depth).toBe(1);
  await page.keyboard.press('i');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('.mx-index-clip[data-clip="sweep"]')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  expect((await state(page)).dive.depth).toBe(0);
  await page.keyboard.press('Escape');
  expect(await state(page)).toMatchObject({ clip: 'sweep', t: 3 });
});

test('go, Home, End and chapter keys discard the return stack', async ({ page }) => {
  await boot(page, '?c=sweep&t=4');
  for (const key of ['Home', 'End', '2']) {
    await page.evaluate(() => window.__mx.go('sweep', { t: 4 }));
    await page.evaluate(() => window.__mx.descend());
    await page.keyboard.press(key);
    await expect.poll(async () => (await state(page)).dive).toBeNull();
    await page.evaluate(() => window.__mx.go('detail'));
    expect((await state(page)).dive.depth).toBe(0);
    await page.evaluate(() => window.__mx.ascend());
    expect((await state(page)).t).toBe(3);
  }
});

// Reuse the public fixture factory for unusual authored graphs and error cases.
async function fixture(page, mode = '') {
  await page.goto('/tests/fixtures/?t=0');
  await page.waitForFunction(() => window.__ready);
  await page.evaluate(mode => {
    window.__mx.destroy();
    const base = window.fixtureDeck.chapters[0].clips[0];
    const make = (id, doors = []) => ({ ...base, id, doors });
    const d = (to, from = 0, until) => ({ to, from, until, label: to });
    window.fixtureDeck.chapters[0].clips = [make('main', [d('one', 0), d('two', 1, 3)]), make('last')];
    window.fixtureDeck.chapters[0].dives = [make('one', [d('two')]), make('two', [d('one')])];
    if (mode === 'error') window.fixtureDeck.chapters[0].clips[0].doors[0].from = 'unknown';
    window.makeExplorer();
  }, mode);
  await page.waitForFunction(() => window.__ready && window.__mx.state().state !== 'loading');
}

test('nested descent is bounded at eight and unwinds one saved location at a time', async ({ page }) => {
  await fixture(page);
  await page.evaluate(async () => {
    window.__mx.seek(1.5);
    await window.__mx.descend(); // latest open is two
    for (let i = 0; i < 10; i++) await window.__mx.descend();
  });
  expect((await state(page)).dive.depth).toBe(8);
  for (let depth = 7; depth >= 0; depth--) {
    await page.evaluate(() => window.__mx.ascend());
    const s = await state(page);
    if (depth) expect(s.dive.depth).toBe(depth);
    else expect(s).toMatchObject({ clip: 'main', t: 1.5, dive: null });
  }
  await page.evaluate(async () => { window.__mx.seek(3); await window.__mx.descend('two'); });
  await clipIs(page, 'main');
});

test('invalid timeline door is a local error and navigation remains available', async ({ page }) => {
  await fixture(page, 'error');
  await expect(page.locator('.mx-error')).toContainText('Unknown timeline name');
  expect((await state(page)).doors).toEqual([]);
  await page.keyboard.press('ArrowDown'); await clipIs(page, 'last');
  await expect(page.locator('.mx-layer[data-role="current"] .mx-error')).toHaveCount(0);
});

test('ordinary playback entrances animate once; seek removes animation state', async ({ page }) => {
  await boot(page); await pauseAt(page, 2.9);
  await page.evaluate(() => window.__mx.play());
  await expect(page.locator('.mx-door')).toHaveAttribute('data-state', 'in');
  await page.evaluate(() => { window.__mx.pause(); window.doorNode = document.querySelector('.mx-door'); window.__mx.seek(4); });
  await expect(page.locator('.mx-door')).not.toHaveAttribute('data-state');
  expect(await page.evaluate(() => window.doorNode === document.querySelector('.mx-door'))).toBe(true);
  await pauseAt(page, 2); await expect(page.locator('.mx-door')).toHaveCount(0);
});

test('opening a door preloads destination fonts and audio without entering it', async ({ page }) => {
  await page.goto('/tests/fixtures/');
  await page.waitForFunction(() => window.__mx?.state().state === 'playing');
  await page.evaluate(() => {
    window.__mx.destroy();
    window.preloadedFonts = []; window.preloadedAudio = [];
    document.fonts.load = async font => { window.preloadedFonts.push(font); return []; };
    const base = window.fixtureDeck.chapters[0].clips[0];
    window.fixtureDeck.chapters[0].clips = [
      { ...base, id: 'main', fonts: [], doors: [{ to: 'detail', from: 2, until: 3, label: 'detail' }] },
      { ...base, id: 'last', fonts: [] },
    ];
    window.fixtureDeck.chapters[0].dives = [{ ...base, id: 'detail', duration: undefined,
      script: [{ id: 'a', text: 'test' }], fonts: [['16px divefont', 'test']] }];
    window.fixtureDeck.voice = {
      cast: { narrator: { name: 'Narrator' } },
      manifest: { clips: { detail: { a: { source: 'test', takes: { '1.3': { file: 'dive.opus', duration: 2 } } } } } },
      url(file) { window.preloadedAudio.push(file); return '/tests/fixtures/tone.opus'; },
    };
    window.makeExplorer({ url: false });
  });
  await page.waitForFunction(() => window.__mx.state().state === 'playing');
  await pauseAt(page, 1);
  expect(await page.evaluate(() => window.preloadedFonts)).toEqual([]);
  expect(await page.evaluate(() => window.preloadedAudio)).toEqual([]);
  await pauseAt(page, 2);
  await expect.poll(() => page.evaluate(() => window.preloadedFonts)).toContain('16px divefont');
  await expect.poll(() => page.evaluate(() => window.preloadedAudio)).toEqual(['dive.opus']);
  await clipIs(page, 'main');
  await pauseAt(page, 3); await expect(page.locator('.mx-door')).toHaveCount(0);
});
