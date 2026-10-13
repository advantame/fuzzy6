import { test, expect } from '@playwright/test';

const clipIs = (page, id) => expect(page.locator('.mx')).toHaveAttribute('data-clip', id);
const at = (page, t) => page.evaluate(t => { window.__mx.pause(); window.__mx.seek(t); }, t);
async function settle(page) {
  await expect(page.locator('.mx-layer')).toHaveCount(1);
  await page.waitForFunction(() => {
    const el = document.querySelector('.mx-layer');
    return el?.dataset.role === 'current' && getComputedStyle(el).opacity === '1' &&
      getComputedStyle(el).transform === 'none' && el.getAnimations().length === 0;
  }, null, { timeout: 3000 });
}
async function boot(page, query = '') {
  await page.goto(`/tests/fixtures/join/?sound=0${query}`);
  await page.waitForFunction(() => window.__mx?.state().clip && window.__mx.state().state !== 'loading', null, { timeout: 5000 });
  await at(page, 2);
  await settle(page);
}

// Aggregate frame/style checks and bound diagnostic storage before collecting it.
// Mutation records also catch a transient `in` that disappears before the next rAF.
async function probe(page) {
  await page.evaluate(() => {
    const stage = document.querySelector('.mx-stage');
    const roles = new Set();
    const clips = new Set();
    const result = { frames: 0, observations: 0, min: Infinity, max: 0, bad: [], roles: [], clips: [] };
    const sample = () => {
      const layers = [...stage.querySelectorAll('.mx-layer')];
      result.observations++;
      result.min = Math.min(result.min, layers.length);
      result.max = Math.max(result.max, layers.length);
      for (const el of layers) {
        roles.add(el.dataset.role); clips.add(el.dataset.clip);
        const css = getComputedStyle(el);
        if ((css.opacity !== '1' || css.transform !== 'none') && result.bad.length < 10)
          result.bad.push({ clip: el.dataset.clip, role: el.dataset.role, opacity: css.opacity, transform: css.transform });
      }
    };
    const observer = new MutationObserver(records => {
      for (const r of records) {
        if (r.type === 'attributes' && r.target.matches('.mx-layer')) {
          if (r.oldValue) roles.add(r.oldValue);
          roles.add(r.target.dataset.role);
        }
        for (const node of r.addedNodes ?? [])
          if (node.matches?.('.mx-layer')) roles.add(node.dataset.role);
      }
      sample();
    });
    observer.observe(stage, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-role'], attributeOldValue: true });
    let frame;
    let timer;
    let stopped = false;
    const stop = () => {
      if (!stopped) {
        sample(); observer.disconnect(); cancelAnimationFrame(frame); clearTimeout(timer); stopped = true;
      }
      result.roles = [...roles]; result.clips = [...clips];
      return result;
    };
    const tick = () => {
      sample(); result.frames++;
      if (result.frames < 600) frame = requestAnimationFrame(tick);
      else stop();
    };
    sample(); frame = requestAnimationFrame(tick); timer = setTimeout(stop, 5000);
    window.stopJoinProbe = stop;
  });
}
async function finish(page) {
  // Includes the full normal transition interval in a real, non-still page.
  await page.waitForTimeout(750);
  return page.evaluate(() => window.stopJoinProbe());
}
function expectCut(result, from = 'before', to = 'after') {
  expect(result.frames).toBeGreaterThan(2);
  expect(result.min).toBe(1); expect(result.max).toBe(1);
  expect(result.roles).toEqual(['current']); expect(result.bad).toEqual([]);
  expect(result.clips).toEqual([from, to]);
}
function expectFade(result) {
  expect(result.roles).toEqual(expect.arrayContaining(['in', 'out']));
  expect(result.min).toBeGreaterThanOrEqual(1); expect(result.max).toBe(2);
}

for (const action of ['ArrowDown', 'ArrowRight', 'button', 'swipe', 'next', 'nextStop', 'auto']) {
  test(`cut from the final frame across chapters: ${action}`, async ({ page }) => {
    await boot(page);
    if (action === 'auto') await page.keyboard.press('a');
    await probe(page);
    if (action.startsWith('Arrow')) await page.keyboard.press(action);
    // The ended-state button deliberately nudges forever; click its center
    // without waiting for that animation to stop. Stage animations stay enabled.
    else if (action === 'button') {
      const box = await page.locator('.mx-next').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    else if (action === 'swipe') {
      await page.locator('.mx-stage').dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 900, clientY: 600 });
      await page.locator('.mx-stage').dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientX: 900, clientY: 400 });
    } else if (action === 'auto') {
      await page.evaluate(() => { window.__mx.seek(1.9); window.__mx.play(); });
    } else await page.evaluate(action => window.__mx[action](), action);
    await clipIs(page, 'after');
    expectCut(await finish(page));
    await expect(page.locator('.mx')).toHaveAttribute('data-dir', 'next');
    await expect(page.locator('.mx')).not.toHaveAttribute('data-still');
    const events = await page.evaluate(() => window.lifecycle);
    expect(events.slice(0, 5)).toEqual([
      { id: 'before', event: 'setup' }, { id: 'before', event: 'render', t: 0 },
      { id: 'after', event: 'setup' }, { id: 'after', event: 'render', t: 0 },
      { id: 'before', event: 'dispose' },
    ]);
  });
}

test('font wait preserves the old final frame until the new first render, with ordinary chrome changes', async ({ page }) => {
  await boot(page, '&gate');
  await probe(page);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'loading');
  await page.waitForTimeout(150);
  await expect(page.locator('.mx-layer')).toHaveAttribute('data-clip', 'before');
  await expect(page.locator('.mx-layer')).toHaveAttribute('data-seconds', '2');
  expect(await page.evaluate(() => window.lifecycle.some(e => e.event === 'dispose'))).toBe(false);
  await page.evaluate(() => {
    window.chromeAtJoin = null;
    window.__mx.on('change', () => {
      window.chromeAtJoin = {
        headings: document.querySelectorAll('.mx-heading-body').length,
        outgoing: document.querySelectorAll('.mx-heading-body[data-out]').length,
        number: document.querySelector('.mx-count-now').textContent,
      };
    });
    window.releaseFont();
  });
  await clipIs(page, 'after');
  expectCut(await finish(page));
  expect(await page.evaluate(() => window.chromeAtJoin)).toEqual({ headings: 2, outgoing: 1, number: '02' });
});

for (const action of ['midway', 'back', 'go', 'index', 'tick', 'number', 'fade', 'default']) {
  test(`ordinary transitions remain: ${action}`, async ({ page }) => {
    await boot(page, action === 'fade' ? '&join=fade' : '');
    if (action === 'default') await page.evaluate(() => { delete window.joinDeck.chapters[1].clips[0].join; });
    if (action === 'midway') await at(page, 1);
    if (action === 'back') {
      await page.evaluate(() => window.__mx.go('after', { t: 2 }));
      await settle(page);
    }
    if (action === 'index') await page.evaluate(() => window.__mx.openIndex());
    await probe(page);
    if (action === 'go') await page.evaluate(() => window.__mx.go('after'));
    else if (action === 'index') await page.locator('.mx-index-clip[data-clip="after"]').click();
    else if (action === 'tick') await page.locator('.mx-tick [data-clip="after"]').click();
    else await page.keyboard.press(action === 'back' ? 'ArrowUp' : action === 'number' ? '2' : 'ArrowDown');
    await clipIs(page, action === 'back' ? 'before' : 'after');
    expectFade(await finish(page));
  });
}

test('cut declarations on both parent and dive do not affect descent or return', async ({ page }) => {
  await boot(page, '&c=after');
  await probe(page);
  await page.evaluate(() => window.__mx.descend());
  await clipIs(page, 'detail');
  expectFade(await finish(page));
  await at(page, 2);
  await probe(page);
  await page.evaluate(() => window.__mx.next());
  await clipIs(page, 'after');
  expectFade(await finish(page));
  expect(await page.evaluate(() => window.__mx.state())).toMatchObject({ clip: 'after', t: 2, state: 'ended', dive: null });
});

test('rapid next skips a pending destination and must fade instead of joining unrelated pictures', async ({ page }) => {
  await boot(page, '&gate');
  await probe(page);
  await page.evaluate(() => { void window.__mx.next(); void window.__mx.next(); });
  await clipIs(page, 'last');
  await page.evaluate(() => window.releaseFont());
  expectFade(await finish(page));
  expect(await page.evaluate(() => window.lifecycle.filter(e => e.event === 'setup').map(e => e.id))).toEqual(['before', 'last']);
});

test('destroying a pending cut disposes only the old layer and never sets up the destination', async ({ page }) => {
  await boot(page, '&gate');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'loading');
  await page.evaluate(() => { window.__mx.destroy(); window.releaseFont(); });
  await expect(page.locator('.mx')).toHaveCount(0);
  expect(await page.evaluate(() => window.lifecycle)).toEqual([
    { id: 'before', event: 'setup' }, { id: 'before', event: 'render', t: 0 }, { id: 'before', event: 'dispose' },
  ]);
});

test('invalid join fails at creation before mounting any explorer', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    window.__mx.destroy();
    window.joinDeck.chapters[1].clips[0].join = 'unknown';
    try { window.makeJoinExplorer(); return null; } catch (error) { return error.message; }
  });
  expect(result).toBe("Clip after: join must be 'fade' or 'cut'");
  await expect(page.locator('.mx')).toHaveCount(0);
});

test('all listed decks have identical cut endpoints and instant still-mode navigation', async ({ page }) => {
  test.setTimeout(120_000);
  // page.evaluate has no per-call timeout; each browser operation also gets an
  // external Playwright step deadline, including imports and engine promises.
  const operation = (name, run) => test.step(name, run, { timeout: 15_000 });
  await page.goto('/', { timeout: 15_000 });
  const pairs = await operation('read the home page deck registry', () => page.evaluate(async () => {
    const { DECKS } = await import('/src/home/main.js');
    return DECKS.flatMap(({ deck, href }) => {
      const clips = deck.chapters.flatMap(chapter => chapter.clips);
      // A first clip has no incoming main-line join. Dives are never included.
      return clips.flatMap((clip, i) => i > 0 && clip.join === 'cut'
        ? [{ deck: deck.id, href, from: clips[i - 1].id, to: clip.id }] : []);
    });
  }));
  expect(pairs.length, 'no main-line cut pairs found').toBeGreaterThan(0);
  for (const { deck, href, from, to } of pairs) {
    const label = `${deck}: ${from} → ${to}`;
    await test.step(label, async () => {
      await page.goto(`/${href}?${new URLSearchParams({ c: from, t: '0', sound: '0' })}`, { timeout: 15_000 });
      await page.waitForFunction(() => window.__ready, null, { timeout: 5000 });
      const equal = await operation(`${label}: compare canvas pixels`, () => page.evaluate(async () => {
        // Hash one bounded canvas buffer at a time; only dimensions and hashes
        // survive navigation. Image bytes never reach Playwright assertions.
        const fingerprint = async canvas => {
          const { width, height } = canvas;
          const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
          const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', pixels));
          return `${width}x${height}:${Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')}`;
        };
        // Verify the comparator on a tiny mismatch before using deck canvases.
        const tiny = document.createElement('canvas'); tiny.width = tiny.height = 1;
        const blank = await fingerprint(tiny);
        if (blank !== await fingerprint(tiny)) throw new Error('unstable canvas fingerprint');
        tiny.getContext('2d').fillRect(0, 0, 1, 1);
        if (blank === await fingerprint(tiny)) throw new Error('canvas mismatch was not detected');
        const snapshot = async () => {
          if (document.querySelector('.mx-layer .mx-error')) throw new Error('clip render failed');
          const canvases = [...document.querySelectorAll('.mx-layer canvas')];
          if (!canvases.length) throw new Error('join endpoint has no canvas');
          const hashes = [];
          for (const canvas of canvases) hashes.push(await fingerprint(canvas));
          return hashes;
        };
        const { duration } = window.__mx.state();
        if (!Number.isFinite(duration) || duration <= 0) throw new Error('invalid endpoint duration');
        window.__setTime(duration);
        const before = await snapshot();
        await window.__mx.next();
        const after = await snapshot();
        return before.length === after.length && before.every((hash, i) => hash === after[i]);
      }));
      expect(equal, label).toBe(true);
      await expect(page.locator('.mx')).toHaveAttribute('data-clip', to, { timeout: 5000 });
      await expect(page.locator('.mx-layer')).toHaveCount(1, { timeout: 5000 });
      await expect(page.locator('.mx-layer')).toHaveAttribute('data-role', 'current', { timeout: 5000 });
      const instant = await operation(`${label}: check still-mode state`, () => page.evaluate(() =>
        window.__mx.state().t === 0 && window.__mx.state().state === 'paused' &&
        document.querySelector('.mx-layer').getAnimations().length === 0));
      expect(instant, label).toBe(true);
    });
  }
});
