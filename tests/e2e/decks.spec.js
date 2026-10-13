import { test, expect } from '@playwright/test';

test('LLM deck clips retain finite timelines and render through the still-mode contract', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', error => { if (errors.length < 10) errors.push(error.message); });
  page.on('console', message => { if (message.type() === 'error' && errors.length < 10) errors.push(message.text()); });
  await page.goto('/decks/llm/?t=0&sound=0');
  await page.waitForFunction(() => window.__ready);
  const clips = await page.evaluate(async () => {
    const { default: deck } = await import('/decks/llm/deck.js');
    const { orderedClips } = await import('/src/explorer/model.js');
    return orderedClips(deck).map(c => ({ id: c.id, duration: c.duration, script: !!c.script }));
  });
  expect(clips.length).toBeGreaterThanOrEqual(79);
  for (const clip of clips) {
    await page.evaluate(id => window.__go(id, 0), clip.id);
    const result = await page.evaluate(() => {
      const api = window.__mx;
      const duration = api.state().duration;
      for (const t of [duration / 2, duration]) window.__setTime(t);
      return { duration, t: api.state().t, state: api.state().state,
        error: document.querySelector('.mx-error')?.textContent ?? null };
    });
    expect(result.error, clip.id).toBeNull();
    expect(result.duration, clip.id).toBeGreaterThan(0);
    expect(result.duration, clip.id).toBeLessThanOrEqual(90);
    if (!clip.script) expect(result.duration, clip.id).toBe(clip.duration);
    expect(result.t, clip.id).toBe(result.duration);
    expect(result.state, clip.id).toBe('ended');
  }
  expect(errors).toEqual([]);
});

test('home cards and cover frames use calculated durations without NaN', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.deck')).toHaveCount(2);
  expect(await page.locator('.deck-meta').allTextContents()).not.toEqual(expect.arrayContaining([expect.stringContaining('NaN')]));
  await expect.poll(() => page.locator('iframe').evaluateAll(nodes => nodes.every(iframe => iframe.contentWindow?.__ready))).toBe(true);
  const states = await page.locator('iframe').evaluateAll(nodes => nodes.map(iframe => iframe.contentWindow.__mx.state()));
  for (const state of states) expect(state.t).toBe(state.duration);
});
