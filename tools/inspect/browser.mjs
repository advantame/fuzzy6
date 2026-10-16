import { chromium } from '@playwright/test';
import { step, safeId } from './runtime.mjs';
export async function withBrowser(run) {
  const browser = await chromium.launch({ timeout: 15000 });
  try { return await run(browser); } finally { await step(browser.close()); }
}
export async function openDeck(page, deck, { clean = true, baseURL = process.env.FUZZY6_URL ?? 'http://127.0.0.1:5175' } = {}) {
  if (!safeId(deck)) throw new Error('Invalid deck ID');
  page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(15000);
  await step(page.setViewportSize(clean ? { width: 1600, height: 900 } : { width: 2160, height: 1080 }));
  await page.goto(new URL(`/decks/${deck}/?t=0${clean ? '&clean' : ''}`, baseURL).href);
  await page.waitForFunction(() => window.__ready === true);
  const data = await step(page.evaluate(async deck => {
    const { default: data } = await import(/* @vite-ignore */ `/decks/${deck}/deck.js`);
    const { normalizeDeck } = await import('/src/explorer/model.js');
    const { buildTimeline, mergePace } = await import('/src/explorer/timeline.js');
    const model = normalizeDeck(data);
    if (model.all.length > 500) throw new Error('Deck exceeds 500 clips');
    return { gutter: model.gutter, clips: model.all.map(({ clip, chapter, dive }) => {
      const tl = buildTimeline(clip, mergePace(data.pace), data.voice);
      if (tl.stops.length > 300) throw new Error('Clip exceeds 300 stops');
      return { id: clip.id, chapter: chapter.id, dive, duration: tl.duration, stops: tl.stops };
    }) };
  }, deck));
  if (!clean) {
    await step(page.setViewportSize({ width: 1920 + data.gutter, height: 1080 }));
    await step(page.evaluate(() => window.dispatchEvent(new Event('resize'))));
  }
  return data.clips;
}
export function selectClips(clips, ids) {
  if (ids.length > 500 || new Set(ids).size !== ids.length) throw new Error('Invalid clip selection');
  for (const id of ids) if (!safeId(id) || !clips.some(c => c.id === id)) throw new Error(`Unknown clip: ${id}`);
  return clips.filter(c => !ids.length || ids.includes(c.id));
}
export async function frame(page, id, t) {
  await step(page.evaluate(async ({ id, t }) => {
    if (window.__mx.state().clip !== id) await window.__go(id, t);
    else window.__setTime(t);
    const error = document.querySelector('.mx-error');
    if (error) throw new Error(error.textContent.slice(0, 300));
  }, { id, t }));
}
