import { test, expect } from '@playwright/test';

async function fixture(page, options = {}) {
  await page.goto(`/tests/fixtures/?sound=0${options.normal ? '' : '&t=0'}${options.off ? '&cast=0' : ''}`);
  await page.waitForFunction(() => window.__mx?.state().clip, null, { timeout: 5000 });
  await page.evaluate(async options => {
    window.__mx.destroy();
    const { puppet } = await import('/decks/demo/lib/puppet.js');
    const left = puppet(), right = puppet({ body: '#a6cb91' });
    if (options.fallback) {
      left.mouth = { x: left.mouth.x, a: left.mouth.a, e: left.mouth.e, o: left.mouth.o };
      right.mouth = { x: right.mouth.x, a: right.mouth.a };
      delete right.eyes;
    }
    if (options.delayed) { left.base = '/delayed-left.svg'; right.base = '/delayed-right.svg'; }
    const script = [{ id: 'a', text: 'Left.' }, { id: 'b', by: 'zunda', text: 'Right.' }, { id: 'c', text: 'Estimated speech.' }];
    const setup = () => ({ render() {} });
    const mouth = [[0, 'x'], [0.1, 'a'], [0.3, 'i'], [0.5, 'u'], [0.7, 'e'], [0.9, 'o'], [1.1, 'n'], [1.3, 'x']];
    const records = Object.fromEntries(script.slice(0, 2).map(line => [line.id, {
      by: line.by ?? 'metan', source: line.text, takes: { '1.3': { duration: 2, mouth } },
    }]));
    const first = { id: 'first', title: 'First', script, setup };
    if (options.delayed) first.cast = ['metan'];
    window.fixtureDeck = {
      id: 'cast-test', title: 'Cast', voice: { cast: {
        metan: { name: 'Left narrator', side: 'left', figure: left, credit: 'Voice left' },
        zunda: { name: 'Right narrator', side: 'right', figure: right, credit: 'Voice right' },
      }, manifest: { version: 2, clips: { first: records, second: records } }, url: () => undefined },
      credits: ['Art', 'Voice left', 'Art'],
      chapters: [{ id: 'test', title: 'Test', clips: [first,
        { ...first, id: 'second', cast: ['metan', 'zunda'] },
        { id: 'listener', title: 'Listener', duration: 8, cast: ['zunda'], setup },
        { id: 'none', title: 'None', script, cast: [], setup },
        { id: 'plain', title: 'Plain', duration: 8, setup },
        { id: 'bad', title: 'Bad', script: [{ id: 'a', text: 'Bad', by: 'missing' }], setup },
      ] }],
    };
    window.makeExplorer();
  }, options);
  if (!options.delayed) await page.waitForFunction(() => window.__mx.state().state !== 'loading', null, { timeout: 5000 });
  if (options.normal) await page.evaluate(() => window.__mx.pause());
}
const seekLine = (page, line, offset = 0) => page.evaluate(({ line, offset }) => {
  window.__mx.pause(); window.__mx.seek(window.__mx.at(`${line}.voice`) + offset);
  return window.__mx.state().cast;
}, { line, offset });
const cast = page => page.evaluate(() => window.__mx.state().cast);
const left = page => page.locator('.mx-cast[data-id="metan"]');
const right = page => page.locator('.mx-cast[data-id="zunda"]');

test('two figures, exact mouth intervals, cue by, credits, ratio, DOM layers and subtitle room', async ({ page }) => {
  await fixture(page);
  await expect(page.locator('.mx-cast')).toHaveCount(2);
  await expect(page.locator('.mx')).toHaveAttribute('data-cast');
  await expect(page.locator('.mx-credit')).toHaveText(['Voice left', 'Voice right', 'Art']);
  await expect(left(page)).toHaveAttribute('aria-label', 'Left narrator');
  expect(await left(page).evaluate(n => n.style.getPropertyValue('--mx-figure-ratio'))).toBe('1');
  expect(await left(page).evaluate(n => [...n.children].map(x => x.className)))
    .toEqual(['mx-cast-base', 'mx-cast-eyes', 'mx-cast-eyes', ...Array(7).fill('mx-cast-mouth')]);
  expect(await page.locator('.mx-bar').evaluate(n => [...n.children].filter(x => x.matches('.mx-cast,.mx-subs')).map(x => x.className)))
    .toEqual(['mx-cast', 'mx-cast', 'mx-subs']);
  const room = await page.locator('.mx-subs').boundingBox();
  expect(room.width).toBe(1216);
  for (const line of ['a', 'b']) for (const [offset, shape] of [[0, 'x'], [0.1, 'a'], [0.3, 'i'], [0.5, 'u'], [0.7, 'e'], [0.9, 'o'], [1.1, 'n'], [1.3, 'x']]) {
    const states = await seekLine(page, line, offset);
    const active = line === 'a' ? left(page) : right(page), listener = line === 'a' ? right(page) : left(page);
    await expect(active).toHaveAttribute('data-speaking');
    await expect(active).toHaveAttribute('data-mouth', shape);
    await expect(listener).not.toHaveAttribute('data-speaking');
    await expect(listener).toHaveAttribute('data-mouth', 'x');
    await expect(active.locator(`.mx-cast-mouth[data-shape="${shape}"]`)).toBeVisible();
    expect(states.filter(s => s.speaking)).toHaveLength(1);
    await expect(page.locator('.mx-cue')).toHaveAttribute('data-by', line === 'a' ? 'metan' : 'zunda');
  }
  await page.evaluate(() => window.__mx.seek(window.__mx.at('b.end')));
  expect((await cast(page)).every(s => !s.speaking && s.mouth === 'x')).toBe(true);
});

test('mouth substitutes, estimated speech and figures without eyes', async ({ page }) => {
  await fixture(page, { fallback: true });
  for (const [offset, l, r] of [[0.3, 'e', 'a'], [0.5, 'o', 'a'], [0.7, 'e', 'a'], [0.9, 'o', 'a'], [1.1, 'x', 'x']]) {
    await seekLine(page, 'a', offset); await expect(left(page)).toHaveAttribute('data-mouth', l);
    await seekLine(page, 'b', offset); await expect(right(page)).toHaveAttribute('data-mouth', r);
  }
  await page.evaluate(() => { delete window.fixtureDeck.voice.manifest.clips.first.a.takes['1.3'].mouth; });
  for (const [offset, shape] of [[0, 'a'], [0.14, 'x'], [0.28, 'a']]) {
    await seekLine(page, 'a', offset); await expect(left(page)).toHaveAttribute('data-mouth', shape);
  }
  await expect(right(page)).not.toHaveAttribute('data-eyes');
  expect((await cast(page))[1].eyes).toBeNull();
  for (const [offset, shape] of [[0, 'a'], [0.14, 'x'], [0.28, 'a']]) {
    await seekLine(page, 'c', offset); await expect(left(page)).toHaveAttribute('data-mouth', shape);
  }
});

test('unchanged frames do not write attributes and shared figures survive navigation', async ({ page }) => {
  await fixture(page);
  await seekLine(page, 'a', 0.3);
  const unchanged = await page.evaluate(async () => {
    window.leftNode = document.querySelector('.mx-cast[data-id="metan"]');
    window.rightNode = document.querySelector('.mx-cast[data-id="zunda"]');
    const mutations = [];
    const observer = new MutationObserver(list => { mutations.push(...list.map(m => m.attributeName)); });
    observer.observe(window.leftNode, { attributes: true, subtree: true, childList: true });
    const t = window.__mx.state().t;
    for (let i = 0; i < 5; i++) window.__setTime(t);
    await Promise.resolve(); observer.disconnect();
    return mutations;
  });
  expect(unchanged).toEqual([]);
  await page.evaluate(() => window.__go('second', 0.6));
  expect(await page.evaluate(() => window.leftNode === document.querySelector('.mx-cast[data-id="metan"]') && window.rightNode === document.querySelector('.mx-cast[data-id="zunda"]'))).toBe(true);
  await page.evaluate(() => window.__go('listener', 2));
  expect((await cast(page)).map(s => s.id)).toEqual(['zunda']);
  expect(await page.evaluate(() => window.rightNode === document.querySelector('.mx-cast[data-id="zunda"]'))).toBe(true);
  await expect(right(page)).not.toHaveAttribute('data-speaking');
  expect((await page.locator('.mx-subs').boundingBox()).width).toBe(1216);
  for (const id of ['none', 'plain']) {
    await page.evaluate(id => window.__go(id, 0), id);
    await expect(page.locator('.mx-cast')).toHaveCount(0);
    await expect(page.locator('.mx')).not.toHaveAttribute('data-cast');
    expect((await page.locator('.mx-subs').boundingBox()).width).toBe(1408);
  }
});

test('URL disabling and setCast hide and restore the current state', async ({ page }) => {
  await fixture(page, { off: true });
  expect(await cast(page)).toEqual([]);
  await expect(page.locator('.mx')).not.toHaveAttribute('data-cast');
  await seekLine(page, 'b', 0.5);
  await page.evaluate(() => window.__mx.setCast(true));
  await expect(right(page)).toHaveAttribute('data-mouth', 'u');
  await expect(right(page)).toHaveAttribute('data-speaking');
  await page.evaluate(() => window.__mx.setCast(false));
  expect(await cast(page)).toEqual([]);
  await expect(page.locator('.mx-cast')).toHaveCount(0);
  await page.evaluate(() => window.__go('second', 0));
  expect(await cast(page)).toEqual([]);
});

test('blink and mouth are identical under backwards seeking, normal mode and still mode', async ({ page }) => {
  await fixture(page, { normal: true });
  const samples = await page.evaluate(async () => {
    const { eyesAt } = await import('/src/explorer/cast.js');
    const blink = Array.from({ length: 700 }, (_, i) => i / 100).find(t => eyesAt('first', 'metan', t) === 'closed');
    const times = [0, 0.6, blink, window.__mx.at('b.voice') + 0.5, 0.6, blink];
    return times.map(t => { window.__mx.seek(t); return { t, cast: window.__mx.state().cast }; });
  });
  expect(samples[2].cast[0].eyes).toBe('closed');
  expect(samples[4].cast).toEqual(samples[1].cast);
  expect(samples[5].cast).toEqual(samples[2].cast);
  await fixture(page);
  for (const sample of samples) {
    await page.evaluate(t => window.__setTime(t), sample.t);
    expect(await cast(page)).toEqual(sample.cast);
  }
});

test('normal playback changes the speaking mouth and keeps figures and captions visible', async ({ page }) => {
  await page.goto('/decks/demo/?c=duet&sound=0');
  await page.waitForFunction(() => window.__mx?.state().state === 'playing', null, { timeout: 5000 });
  await expect(left(page)).toHaveAttribute('data-speaking');
  await expect.poll(() => left(page).evaluate(n => Number(getComputedStyle(n).opacity))).toBe(1);
  await expect.poll(() => page.locator('.mx-cue[data-state="in"]').evaluate(n => Number(getComputedStyle(n).opacity))).toBe(1);
  await expect(right(page)).toHaveAttribute('data-speaking', '', { timeout: 7000 });
  await expect(left(page)).not.toHaveAttribute('data-speaking');
  const images = await right(page).locator('img').evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth > 0));
  expect(images).toBe(true);
});

test('errors render a clip error while navigation remains available', async ({ page }) => {
  await fixture(page);
  await page.evaluate(() => window.__go('bad', 0));
  await expect(page.locator('.mx-error')).toContainText('Unknown narrator');
  expect(await cast(page)).toEqual([]);
  await page.evaluate(() => window.__go('first', 0));
  await expect(page.locator('.mx-error')).toHaveCount(0);
  await expect(page.locator('.mx-cast')).toHaveCount(2);
});

test('still readiness and __go wait for figure images, with a three-second ceiling', async ({ page }) => {
  const pending = new Map();
  await page.route('**/delayed-*.svg', route => { pending.set(new URL(route.request().url()).pathname, route); });
  try {
    await fixture(page, { delayed: true });
    await expect.poll(() => pending.has('/delayed-left.svg')).toBe(true);
    expect(await page.evaluate(() => window.__ready)).toBe(false);
    await pending.get('/delayed-left.svg').fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"/>' });
    pending.delete('/delayed-left.svg');
    await page.waitForFunction(() => window.__ready, null, { timeout: 4000 });
    await page.evaluate(() => { window.goDone = false; window.__go('second', 0).then(() => { window.goDone = true; }); });
    await expect.poll(() => pending.has('/delayed-right.svg')).toBe(true);
    expect(await page.evaluate(() => window.goDone)).toBe(false);
    // Leave the right image stalled; the engine must finish without waiting forever.
    await expect.poll(() => page.evaluate(() => window.goDone), { timeout: 4000 }).toBe(true);
    await expect(page.locator('.mx-cast')).toHaveCount(2);
  } finally { for (const route of pending.values()) await route.abort().catch(() => {}); }
});
