import { test, expect } from '@playwright/test';
const boot = async (page, query = '') => {
  await page.goto(`/decks/demo/${query}`);
  await page.waitForFunction(() => window.__mx?.state().clip && window.__mx.state().state !== 'loading');
};
const state = page => page.evaluate(() => window.__mx.state());
const isClip = (page, id) => expect(page.locator('.mx')).toHaveAttribute('data-clip', id);
const seek = (page, t) => page.evaluate(t => { window.__mx.pause(); window.__mx.seek(t); }, t);
test('boot, URL selection and navigation controls', async ({ page }) => {
  await boot(page); await isClip(page, 'opening');
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('.mx-prev')).toBeDisabled();
  await expect(page.locator('.mx-heading-body:not([data-out]) .mx-no')).toHaveCount(0);
  for (const [key, id] of [['ArrowDown', 'sweep'], ['PageDown', 'dom'], ['PageDown', 'quiz'], ['PageDown', 'short'], ['PageUp', 'quiz'], ['PageUp', 'dom'], ['ArrowUp', 'sweep']]) {
    await page.keyboard.press(key); await isClip(page, id);
  }
  await expect(page).toHaveURL(/c=sweep/);
  await page.locator('.mx-next').click(); await isClip(page, 'dom');
  await page.locator('.mx-prev').click(); await isClip(page, 'sweep');
  await page.keyboard.press('End'); await isClip(page, 'duet'); await expect(page.locator('.mx-next')).toBeDisabled();
  await page.keyboard.press('Home'); await isClip(page, 'opening');
  await page.keyboard.press('2'); await isClip(page, 'short');
  await page.keyboard.press('1'); await isClip(page, 'opening');
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true })));
  await isClip(page, 'opening');
  await boot(page, '?c=dom'); await isClip(page, 'dom');
  await expect(page).toHaveTitle('CSS clock — Demo');
});
test('play, pause, restart, relative seek and stage tap', async ({ page }) => {
  await boot(page, '?c=sweep');
  await page.keyboard.press('Space'); await expect(page.locator('.mx')).toHaveAttribute('data-state', 'paused');
  await seek(page, 4); await page.keyboard.press('Shift+ArrowRight'); expect((await state(page)).t).toBe(6);
  await page.keyboard.press('Shift+ArrowLeft'); expect((await state(page)).t).toBe(4);
  await page.keyboard.press('k'); await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
  await page.keyboard.press('r'); expect((await state(page)).t).toBeLessThan(1);
  await page.locator('.mx-stage').click(); await expect(page.locator('.mx')).toHaveAttribute('data-state', 'paused');
  await page.locator('.mx-play').click(); await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
  await page.keyboard.press('Space'); await expect(page.locator('.mx')).toHaveAttribute('data-state', 'paused');
});
test('seek click, drag, focus retention and keyboard slider', async ({ page }) => {
  await boot(page, '?c=sweep'); await seek(page, 0);
  await page.mouse.click(1120, 900); expect((await state(page)).t).toBeCloseTo(6, 1);
  expect(await page.locator('.mx-seek').evaluate(el => el === document.activeElement)).toBe(false);
  await page.mouse.move(1120, 900); await page.mouse.down(); await page.mouse.move(1520, 900); await page.mouse.up();
  expect((await state(page)).t).toBeCloseTo(9, 1);
  await page.keyboard.press('ArrowDown'); await isClip(page, 'dom'); await seek(page, 2);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    if (await page.locator('.mx-seek').evaluate(el => el === document.activeElement)) break;
  }
  await expect(page.locator('.mx-seek')).toBeFocused();
  await page.keyboard.press('ArrowRight'); expect((await state(page)).t).toBe(3);
  await page.keyboard.press('Shift+ArrowRight'); expect((await state(page)).t).toBe(8);
  await page.keyboard.press('ArrowLeft'); expect((await state(page)).t).toBe(7);
  await page.keyboard.press('Shift+ArrowLeft'); expect((await state(page)).t).toBe(2);
  await page.keyboard.press('End'); expect((await state(page)).t).toBe(10);
  await page.keyboard.press('Home'); expect((await state(page)).t).toBe(0);
});
test('cue markup, exclusive boundaries, overlaps and hover text', async ({ page }) => {
  await boot(page, '?c=cues&t=0');
  await expect(page.locator('.mx-cue strong')).toHaveText('strong'); await expect(page.locator('.mx-cue br')).toHaveCount(1);
  await seek(page, 2); await expect(page.locator('.mx-cue')).toHaveCount(2);
  await expect(page.locator('.mx-cue').nth(1)).toHaveText('<script> & "quotes" are text.');
  await expect(page.locator('.mx-subs script')).toHaveCount(0);
  await seek(page, 3); await expect(page.locator('.mx-cue')).toHaveCount(1);
  await seek(page, 5); await expect(page.locator('.mx-cue strong')).toHaveText('last');
  await page.mouse.move(320 + 1600 / 9 * 3.5, 900);
  await expect(page.locator('.mx-seek-hover')).toBeVisible();
  await expect(page.locator('.mx-seek-hover-time')).toHaveText('0:03');
  await expect(page.locator('.mx-seek-hover-text')).toHaveText('<script> & "quotes" are text.');
  await seek(page, 9); await expect(page.locator('.mx-cue')).toHaveCount(0);
});
test('ending and automatic hold with input cancellation', async ({ page }) => {
  await boot(page, '?c=short');
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'ended');
  expect((await state(page)).t).toBe(1.5);
  await page.keyboard.press('a'); await expect(page.locator('.mx-auto')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('r'); await isClip(page, 'short'); await isClip(page, 'cues');
  await page.evaluate(() => window.__mx.go('short'));
  await page.evaluate(() => window.__mx.seek(1.5));
  await page.keyboard.press('x');
  await page.waitForTimeout(500); await isClip(page, 'short');
  await seek(page, 0.2); await expect(page.locator('.mx')).toHaveAttribute('data-state', 'paused');
  await boot(page, '?c=short&auto=1'); await isClip(page, 'cues');
});
test('index focus, arrows, selection, restoration and canvas thumbnails', async ({ page }) => {
  await boot(page, '?c=sweep'); await page.keyboard.press('i');
  await expect(page.locator('.mx-index')).toBeVisible();
  await expect(page.locator('.mx-index-clip[data-clip="sweep"]')).toBeFocused();
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'paused');
  await expect(page.locator('.mx-index-clip[data-clip="sweep"] canvas')).toHaveAttribute('data-drawn', '');
  expect(await page.locator('.mx-index-clip[data-clip="sweep"] canvas').evaluate(el => {
    const ctx = el.getContext('2d');
    return { alpha: ctx.getImageData(0, 0, 1, 1).data[3], smoothing: ctx.imageSmoothingEnabled, quality: ctx.imageSmoothingQuality };
  })).toEqual({ alpha: 255, smoothing: true, quality: 'high' });
  await expect(page.locator('.mx-index-clip[data-clip="opening"] canvas')).not.toHaveAttribute('data-drawn');
  await page.keyboard.press('ArrowRight'); await expect(page.locator('.mx-index-clip[data-clip="cues"]')).toBeFocused();
  await page.keyboard.press('ArrowUp'); await expect(page.locator('.mx-index-clip[data-clip="short"]')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(page.locator('.mx-index-clip[data-clip="cues"]')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.locator('.mx-index')).toBeHidden(); await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
  await page.keyboard.press('k'); await page.keyboard.press('i'); await page.keyboard.press('Escape'); await expect(page.locator('.mx')).toHaveAttribute('data-state', 'paused');
  await page.locator('.mx-crumb[data-level="chapter"]').click(); await expect(page.locator('.mx-index-clip[data-clip="opening"]')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await isClip(page, 'sweep');
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing'); expect((await state(page)).t).toBeLessThan(1);
  await page.locator('.mx-crumb[data-level="deck"]').click(); await page.locator('.mx-count').click(); await expect(page.locator('.mx-index')).toBeHidden();
});
test('still APIs, clean mode and URL opt-out', async ({ page }) => {
  await boot(page, '?c=sweep&t=4&clean'); await page.waitForFunction(() => window.__ready === true);
  expect((await state(page)).t).toBe(4); await expect(page.locator('.mx')).toHaveAttribute('data-state', 'paused');
  await expect(page.locator('.mx-rail')).toBeHidden();
  const box = await page.locator('.mx-stage').boundingBox();
  for (const [key, value] of Object.entries({ x: 0, y: 0, width: 1920, height: 1080 })) expect(box[key]).toBeCloseTo(value, 2);
  await page.evaluate(() => window.__setTime(7)); await expect(page.locator('.mx-time-now')).toHaveText('0:07');
  await page.evaluate(() => window.__go('cues', 2)); await expect(page.locator('.mx-cue')).toHaveCount(2);
  await expect(page.locator('.mx-layer')).toHaveCount(1); await expect(page.locator('.mx-heading-body')).toHaveCount(1);
  expect(await page.locator('.mx-heading-body').evaluate(el => el.getAnimations().length)).toBe(0);
  await page.goto('/tests/fixtures/?c=clip-5&t=2&clean&auto=1'); await page.waitForFunction(() => window.__ready);
  await page.evaluate(() => { window.__mx.destroy(); window.makeExplorer({ url: false }); });
  await isClip(page, 'clip-0'); await expect(page.locator('.mx')).not.toHaveAttribute('data-clean');
  expect((await state(page)).auto).toBe(false); expect(await page.evaluate(() => window.__ready)).toBeUndefined();
  await expect(page).toHaveURL(/c=clip-5/);
});
for (const [width, height] of [[1920, 1080], [1760, 990], [1600, 900], [1600, 1000]]) {
  test(`geometry and backing buffer ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await boot(page, '?c=sweep&t=2');
    const k = Math.min(width / 1920, height / 1080), box = await page.locator('.mx-stage').boundingBox();
    expect(box.x).toBeCloseTo((width - 1920 * k) / 2 + 320 * k, 2);
    expect(box.y).toBeCloseTo((height - 1080 * k) / 2, 2);
    expect(box.width).toBeCloseTo(1600 * k, 2); expect(box.height).toBeCloseTo(900 * k, 2);
    const size = await page.locator('.mx-layer canvas').evaluate(el => [el.width, el.height]);
    expect(size).toEqual([Math.floor(1600 * k), Math.floor(900 * k)]);
    await page.setViewportSize({ width: 960, height: 540 });
    await expect.poll(() => page.locator('.mx-layer canvas').evaluate(el => el.width)).toBe(800);
  });
}
test('rapid navigation coalesces setups and limits layers', async ({ page }) => {
  await page.goto('/tests/fixtures/?slow'); await isClip(page, 'clip-0');
  await page.evaluate(() => {
    window.maxLayers = 0;
    new MutationObserver(() => { window.maxLayers = Math.max(window.maxLayers, document.querySelectorAll('.mx-layer').length); }).observe(document.querySelector('.mx-stage'), { childList: true });
    for (let i = 0; i < 10; i++) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
  });
  await isClip(page, 'clip-10');
  expect(await page.evaluate(() => window.setups)).toEqual([0, 10]);
  expect(await page.evaluate(() => window.maxLayers)).toBeLessThanOrEqual(2);
  await page.evaluate(async () => { for (const id of ['clip-11', 'clip-8', 'clip-7', 'clip-6']) await window.__mx.go(id); });
  expect(await page.evaluate(() => window.maxLayers)).toBeLessThanOrEqual(2);
  await expect(page.locator('.mx-heading-body')).toHaveCount(2);
});
test('setup and render errors log once and leave navigation working', async ({ page }) => {
  const errors = []; page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/tests/fixtures/?errors'); await isClip(page, 'clip-0');
  for (const [id, message] of [['clip-1', 'setup failed'], ['clip-2', 'render failed']]) {
    await page.evaluate(id => window.__mx.go(id), id);
    await expect(page.locator('.mx-layer[data-role="current"] .mx-error')).toContainText(message);
    await page.evaluate(() => { window.__mx.seek(1); window.__mx.seek(2); });
  }
  await page.evaluate(() => window.__mx.go('clip-3')); await isClip(page, 'clip-3');
  expect(errors).toHaveLength(2);
});
test('events, deterministic render, teardown and entire demo without errors', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await boot(page, '?t=0');
  await page.evaluate(() => { window.events = []; for (const name of ['change', 'state', 'time']) window.__mx.on(name, s => window.events.push([name, s.clip])); });
  for (const id of ['opening', 'sweep', 'dom', 'short', 'cues', 'script']) { await page.evaluate(id => window.__go(id, 0.5), id); await isClip(page, id); }
  expect(await page.evaluate(() => ['change', 'state', 'time'].every(name => window.events.some(e => e[0] === name)))).toBe(true);
  await page.evaluate(() => window.__go('sweep', 3));
  const same = await page.evaluate(() => {
    const canvas = document.querySelector('.mx-layer canvas'); const before = canvas.toDataURL();
    window.__setTime(8); window.__setTime(3); return before === canvas.toDataURL();
  }); expect(same).toBe(true);
  await page.evaluate(() => window.__mx.destroy()); await expect(page.locator('.mx')).toHaveCount(0);
  expect(await page.evaluate(() => window.__mx)).toBeUndefined(); expect(errors).toEqual([]);
});
test('touch swipes navigate and taps toggle playback', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await boot(page);
  const touch = (type, y = 400) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: 1000, y }] });
  await touch('touchStart', 500); await touch('touchMove', 460); await touch('touchMove', 350); await touch('touchEnd');
  await isClip(page, 'sweep');
  await touch('touchStart', 350); await touch('touchMove', 390); await touch('touchMove', 500); await touch('touchEnd');
  await isClip(page, 'opening');
  await touch('touchStart'); await touch('touchEnd'); await expect(page.locator('.mx')).toHaveAttribute('data-state', 'paused');
});
test('font failures, capped DPR buffers, transform reset and resize callback', async ({ page }) => {
  await page.goto('/tests/fixtures/?t=0'); await page.waitForFunction(() => window.__ready);
  await page.evaluate(() => {
    window.__mx.destroy();
    window.fontCalls = []; window.transforms = []; window.resizeCalls = 0;
    document.fonts.load = (font, text) => { window.fontCalls.push([font, text]); return Promise.reject(new Error('font unavailable')); };
    Object.defineProperty(window, 'devicePixelRatio', { value: 8 });
    window.fixtureDeck.fonts = [['16px deck-font', 'deck']];
    window.fixtureDeck.chapters[0].clips[0].setup = stage => {
      const { ctx } = stage.canvas();
      return { render() { window.transforms.push(ctx.getTransform().a); ctx.scale(10, 10); }, resize() { window.resizeCalls++; } };
    };
    window.makeExplorer();
  });
  await page.waitForFunction(() => window.__ready);
  await page.evaluate(() => { window.__setTime(1); window.__setTime(2); });
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('.mx-layer canvas');
    return { pixels: canvas.width * canvas.height, transforms: window.transforms, fonts: window.fontCalls };
  });
  expect(result.pixels).toBeLessThanOrEqual(4.2e6);
  expect(result.transforms.every(s => Math.abs(s - Math.sqrt(4.2e6 / 1440000)) < 0.00001)).toBe(true);
  expect(result.fonts).toEqual(expect.arrayContaining([['16px deck-font', 'deck'], ['16px fixture0', 'test'], ['16px fixture1', 'test']]));
  await page.setViewportSize({ width: 960, height: 540 });
  await expect.poll(() => page.evaluate(() => window.resizeCalls)).toBe(1);
});
test('paused and hidden clocks stop, resume clamps gaps, destruction cancels pending work', async ({ page }) => {
  await page.goto('/tests/fixtures/'); await isClip(page, 'clip-0');
  await page.evaluate(() => window.__mx.pause());
  const renders = await page.evaluate(() => window.renders.length);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.renders.length)).toBe(renders);
  await page.evaluate(() => {
    window.__mx.play();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));
  });
  const stopped = (await state(page)).t;
  await page.waitForTimeout(150); expect((await state(page)).t).toBe(stopped);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(async () => (await state(page)).t).toBeGreaterThan(stopped);
  await page.goto('/tests/fixtures/?slow'); await isClip(page, 'clip-0');
  await page.evaluate(() => { void window.__mx.go('clip-5'); window.__mx.destroy(); });
  await page.waitForTimeout(200); await expect(page.locator('.mx')).toHaveCount(0);
  expect(await page.evaluate(() => window.setups)).toEqual([0]);
});
test('still subtitles stay animation-free, and resource limits hold during cue changes', async ({ page }) => {
  await boot(page, '?c=cues&t=2');
  await page.waitForTimeout(100);
  expect(await page.locator('.mx-cue').evaluateAll(nodes => nodes.flatMap(el => el.getAnimations()).length)).toBe(0);
  await page.goto('/tests/fixtures/'); await isClip(page, 'clip-0');
  await page.evaluate(() => {
    window.__mx.destroy();
    window.fixtureDeck.chapters[0].clips[0].cues = Array.from({ length: 20 }, (_, i) => ({ at: i * 0.04, to: i * 0.04 + 0.08, text: `Cue ${i}` }));
    window.makeExplorer();
    window.maxCues = 0;
    new MutationObserver(() => { window.maxCues = Math.max(window.maxCues, document.querySelectorAll('.mx-cue').length); }).observe(document.querySelector('.mx-subs'), { childList: true });
  });
  await expect.poll(async () => (await state(page)).t).toBeGreaterThan(0.9);
  expect(await page.evaluate(() => window.maxCues)).toBeLessThanOrEqual(4);
});
test('editable fields and browser modifiers are ignored, cursor timer resets', async ({ page }) => {
  await boot(page, '?c=sweep');
  await page.keyboard.press('Control+ArrowRight'); await isClip(page, 'sweep');
  await page.evaluate(() => { const input = document.createElement('input'); document.body.append(input); input.focus(); });
  await page.keyboard.press('ArrowRight'); await isClip(page, 'sweep');
  await page.evaluate(() => document.activeElement.blur());
  await expect(page.locator('.mx')).toHaveAttribute('data-cursor-hidden', '', { timeout: 4000 });
  await page.mouse.move(1000, 400); await expect(page.locator('.mx')).not.toHaveAttribute('data-cursor-hidden');
  await page.keyboard.press('k'); await page.waitForTimeout(2600); await expect(page.locator('.mx')).not.toHaveAttribute('data-cursor-hidden');
});

test('playing subtitles enter visibly without moving existing cue nodes', async ({ page }) => {
  await boot(page, '?c=cues');
  await seek(page, 1.8);
  await expect(page.locator('.mx')).not.toHaveAttribute('data-still');
  await page.evaluate(() => window.__mx.play());
  const incoming = page.locator('.mx-cue[data-state="in"]').filter({ hasText: '<script>' });
  await expect(incoming).toHaveCount(1, { timeout: 1500 });
  await expect.poll(() => incoming.evaluate(el => Number(getComputedStyle(el).opacity)), {
    timeout: 1000,
    intervals: [50],
  }).toBeGreaterThanOrEqual(0.99);

  // Let the previous cue leave, then observe an interval with no cue boundary.
  await expect(page.locator('.mx-cue')).toHaveCount(1, { timeout: 1500 });
  await page.evaluate(() => {
    const subs = document.querySelector('.mx-subs');
    window.cueProbe = { mutations: 0, frames: 0, start: window.__mx.state().t };
    const observer = new MutationObserver(records => {
      window.cueProbe.mutations += records.length;
    });
    observer.observe(subs, { childList: true });
    window.stopCueProbe = () => observer.disconnect();
    const stop = window.__mx.on('time', () => {
      window.cueProbe.frames++;
      if (window.__mx.state().t >= window.cueProbe.start + 0.6) {
        observer.disconnect();
        stop();
        window.cueProbe.done = true;
      }
    });
  });
  try {
    await page.waitForFunction(() => window.cueProbe.done, null, { timeout: 2000 });
    const probe = await page.evaluate(() => window.cueProbe);
    expect(probe.frames).toBeGreaterThan(3);
    expect(probe.mutations).toBe(0);
    await expect(incoming).toHaveCSS('opacity', '1');
  } finally {
    await page.evaluate(() => window.stopCueProbe());
  }
});

test('unchanged chrome values stay untouched during playback and redraws', async ({ page }) => {
  await boot(page, '?c=cues');
  await seek(page, 3.1);
  // Settle the intentional seek and heading animations before observing.
  await expect(page.locator('.mx-subs')).not.toHaveAttribute('data-instant');
  await page.evaluate(() => {
    window.chromeProbe = { mutations: 0, frames: 0 };
    const observer = new MutationObserver(records => {
      window.chromeProbe.mutations += records.length;
    });
    for (const selector of ['.mx-time', '.mx-axis', '.mx-corner', '.mx-seek-marks', '.mx-subs']) {
      observer.observe(document.querySelector(selector), { childList: true, subtree: true, attributes: true, characterData: true });
    }
    observer.observe(document.querySelector('.mx-seek'), { attributes: true, attributeFilter: ['aria-valuetext'] });
    const stop = window.__mx.on('time', () => {
      window.chromeProbe.frames++;
      if (window.__mx.state().t >= 3.7) {
        window.__mx.pause();
        stop();
        window.chromeProbe.done = true;
      }
    });
    window.stopChromeProbe = () => observer.disconnect();
    window.__mx.play();
  });
  try {
    await page.waitForFunction(() => window.chromeProbe.done, null, { timeout: 2000 });
    const probe = await page.evaluate(() => window.chromeProbe);
    expect(probe.frames).toBeGreaterThan(3);
    expect(probe.mutations).toBe(0);
  } finally {
    await page.evaluate(() => window.stopChromeProbe());
  }
  const repeatedWrites = await page.evaluate(async () => {
    let mutations = 0;
    const observer = new MutationObserver(records => { mutations += records.length; });
    observer.observe(document.querySelector('.mx-seek'), { attributes: true });
    observer.observe(document.querySelector('.mx-layer[data-role="current"]'), { attributes: true });
    try {
      window.__mx.seek(window.__mx.state().t);
      await Promise.resolve();
      return mutations;
    } finally {
      observer.disconnect();
    }
  });
  expect(repeatedWrites).toBe(0);
});
