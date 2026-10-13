#!/usr/bin/env node
/**
 * Requires npm run dev. FUZZY6_URL defaults to http://127.0.0.1:5175.
 * npm run capture -- <deck> <clipId> <t> [t ...] [--clean] [--size WxH]
 *   -> test-output/<deck>/<clipId>_t<t>.png
 * npm run capture -- <deck> --posters [--clean] [--size WxH]
 *   -> test-output/<deck>/posters/<NN>-<clipId>.png
 * npm run capture -- <deck> <clipId> --sheet [--every S] [--cols N] [--clean]
 *   -> test-output/<deck>/<clipId>_sheet.png (480px tiles, up to 60 frames)
 * npm run capture -- <deck> <clipId> --stops [--clean] [--size WxH]
 *   -> test-output/<deck>/<clipId>_stops/ (head onward; stops and line.start + pace.ground)
 * --timeout seconds bounds the entire run (default 240). A separate supervisor
 * terminates the worker and its browser process group if graceful cleanup stalls.
 * Viewports are limited to 8 million pixels; sheet image data to 64 MiB.
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const argv = process.argv.slice(2);
const takeFlag = name => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
const takeValue = (name, fallback) => { const i = argv.indexOf(name); if (i < 0) return fallback; const value = argv[i + 1]; if (!value || value.startsWith('--')) throw new Error(`Missing ${name} value`); argv.splice(i, 2); return value; };
const worker = takeFlag('--worker');
const seconds = Number(takeValue('--timeout', '240'));
if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 3600) throw new Error('--timeout must be in (0, 3600] seconds');
if (!worker) {
  const child = spawn(process.execPath, ['--max-old-space-size=512', fileURLToPath(import.meta.url), '--worker', ...process.argv.slice(2)], { stdio: 'inherit', detached: true });
  let stopped = false;
  const kill = signal => { try { process.kill(-child.pid, signal); } catch (e) { if (e.code !== 'ESRCH') throw e; } };
  const stop = code => {
    if (stopped) return; stopped = true; process.exitCode = code;
    kill('SIGTERM'); setTimeout(() => kill('SIGKILL'), 2000);
  };
  const deadline = setTimeout(() => { console.error(`Capture timed out after ${seconds}s`); stop(2); }, seconds * 1000);
  process.on('SIGINT', () => stop(130)); process.on('SIGTERM', () => stop(143));
  child.on('error', error => { console.error(error.message); clearTimeout(deadline); process.exitCode = 1; });
  child.on('exit', code => {
    clearTimeout(deadline);
    if (!stopped) { process.exitCode = code ?? 1; kill('SIGKILL'); }
    // Keep the escalation timer alive after a timeout to reap any browser descendants.
  });
} else {
  await capture();
}
async function capture() {
  const clean = takeFlag('--clean'), posters = takeFlag('--posters'), sheet = takeFlag('--sheet'), stops = takeFlag('--stops');
  const explicitSize = takeValue('--size', null);
  const size = String(explicitSize ?? '1920x1080').split('x').map(Number);
  const every = Number(takeValue('--every', '1')), cols = Number(takeValue('--cols', '4'));
  const [deck, clipId, ...timesRaw] = argv;
  const safeId = value => /^[a-z0-9][a-z0-9-]*$/.test(value ?? '');
  if (!safeId(deck) || (!posters && !safeId(clipId))) throw new Error('Usage: capture <deck> <clipId> <t...> | <deck> --posters | <deck> <clipId> --sheet');
  if (posters && (sheet || stops || clipId)) throw new Error('--posters accepts only a deck');
  if (stops && sheet) throw new Error('--stops and --sheet are exclusive');
  if (size.length !== 2 || !size.every(n => Number.isInteger(n) && n > 0 && n <= 8192) || size[0] * size[1] > 8e6) throw new Error('Invalid or excessive viewport size');
  if (!Number.isFinite(every) || every <= 0 || !Number.isInteger(cols) || cols < 1 || cols > 12) throw new Error('Invalid --every or --cols');
  const times = timesRaw.map(Number);
  if (times.length > 60 || times.some(t => !Number.isFinite(t) || t < 0) || (!sheet && !posters && !stops && !times.length) || ((sheet || stops) && times.length)) throw new Error('Provide 1–60 finite nonnegative times, or --sheet/--posters');
  const root = resolve(import.meta.dirname, '..', 'test-output', deck);
  await mkdir(root, { recursive: true });
  let browser, closing, interrupted = false;
  const close = () => {
    if (!browser) return Promise.resolve();
    return closing ??= step(browser.close());
  };
  const interrupt = () => {
    interrupted = true; process.exitCode = 130;
    void close().catch(() => {});
  };
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  // evaluate() has no native timeout, so race it against an independently timed rejection.
  const step = async promise => {
    let timer;
    try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Browser step timed out')), 15000); })]); }
    finally { clearTimeout(timer); }
  };
  try {
    browser = await chromium.launch({ timeout: 15000 });
    if (interrupted) throw new Error('Capture interrupted');
    const page = await step(browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1 }));
    page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(15000);
    const errors = [];
    page.on('pageerror', error => { if (errors.length < 10) errors.push(error.message.slice(0, 300)); });
    page.on('console', msg => { if (msg.type() === 'error' && errors.length < 10) errors.push(msg.text().slice(0, 300)); });
    const url = new URL(`/decks/${deck}/`, process.env.FUZZY6_URL ?? 'http://127.0.0.1:5175');
    url.searchParams.set('t', times[0] ?? 0);
    if (clipId) url.searchParams.set('c', clipId);
    if (clean) url.searchParams.set('clean', '');
    await page.goto(url.href);
    await page.waitForFunction(() => window.__ready === true);
    if (explicitSize === null && !clean) {
      const gutter = await step(page.evaluate(async deck => {
        const { default: data } = await import(`/decks/${deck}/deck.js`);
        const { normalizeDeck } = await import('/src/explorer/model.js');
        return normalizeDeck(data).gutter;
      }, deck));
      size[0] = 1920 + gutter;
      await step(page.setViewportSize({ width: size[0], height: size[1] }));
      // Flush resize before taking frames (also updates the canvas backing size).
      await step(page.evaluate(() => window.dispatchEvent(new Event('resize'))));
    }
    if (clipId && await step(page.evaluate(() => window.__mx.state().clip)) !== clipId) throw new Error(`Unknown clip: ${clipId}`);
    const screenshot = async path => { await page.screenshot({ path, timeout: 15000 }); console.log(path); };
    if (posters) {
      const entries = await step(page.evaluate(async deck => {
        const { default: data } = await import(`/decks/${deck}/deck.js`);
        const { buildTimeline, mergePace, posterTime } = await import('/src/explorer/timeline.js');
        const { normalizeDeck } = await import('/src/explorer/model.js');
        return normalizeDeck(data).all.map(({ clip }) => ({ id: clip.id, t: posterTime(clip, buildTimeline(clip, mergePace(data.pace), data.voice)) }));
      }, deck));
      await mkdir(resolve(root, 'posters'), { recursive: true });
      for (const [i, entry] of entries.entries()) {
        if (!safeId(entry.id)) throw new Error(`Unsafe clip id: ${entry.id}`);
        await step(page.evaluate(({ id, t }) => window.__go(id, t), entry));
        await screenshot(resolve(root, 'posters', `${String(i + 1).padStart(Math.max(2, String(entries.length).length), '0')}-${entry.id}.png`));
      }
    } else if (stops) {
      const entries = await step(page.evaluate(async ({ deck, clipId }) => {
        const { default: data } = await import(`/decks/${deck}/deck.js`);
        const clip = data.chapters.flatMap(c => [...c.clips, ...(c.dives ?? [])]).find(c => c.id === clipId);
        const { buildTimeline } = await import('/src/explorer/timeline.js');
        const pace = window.__mx.pace();
        const timeline = buildTimeline(clip, pace, data.voice);
        return [
          ...timeline.stops.map(s => ({ t: s.at, label: `${s.kind}-${s.line ?? 'clip'}` })),
          ...timeline.lines.map(l => ({ t: Math.min(timeline.duration, l.start + pace.ground), label: `ground-${l.id}` })),
        ].sort((a, b) => a.t - b.t);
      }, { deck, clipId }));
      if (entries.length > 300) throw new Error('Stops exceed 300 frames');
      const directory = resolve(root, `${clipId}_stops`);
      await mkdir(directory, { recursive: true });
      for (const [i, entry] of entries.entries()) {
        await step(page.evaluate(t => window.__setTime(t), entry.t));
        await screenshot(resolve(directory, `${String(i + 1).padStart(3, '0')}-${entry.label}_t${entry.t}.png`));
      }
    } else if (sheet) {
      const duration = await step(page.evaluate(() => window.__mx.state().duration));
      const count = Math.ceil(duration / every) + 1;
      if (!Number.isFinite(count) || count > 60) throw new Error('Sheet exceeds 60 frames; increase --every');
      const images = []; let bytes = 0;
      for (let i = 0; i < count; i++) {
        const t = Math.min(i * every, duration);
        await step(page.evaluate(t => window.__setTime(t), t));
        const buffer = await page.screenshot({ timeout: 15000 });
        if (bytes + buffer.length > 48 * 1024 * 1024) throw new Error('Sheet exceeds 64 MiB encoded image budget');
        bytes += buffer.length; images.push({ t, src: `data:image/png;base64,${buffer.toString('base64')}` });
      }
      const tileH = Math.round(480 * size[1] / size[0]), rows = Math.ceil(images.length / cols);
      if (cols * 480 * rows * (tileH + 32) > 32e6) throw new Error('Contact sheet exceeds 32 million pixels');
      await step(page.setViewportSize({ width: cols * 480, height: rows * (tileH + 32) }));
      await page.setContent(`<html><head><style>body{margin:0;background:#151515;color:#fff;font:16px monospace;display:grid;grid-template-columns:repeat(${cols},480px)}figure{margin:0}img{display:block;width:480px;height:${tileH}px}figcaption{height:32px;line-height:32px;padding-left:12px}</style></head><body></body></html>`);
      await step(page.evaluate(async images => {
        window.__mx?.destroy();
        for (const { t, src } of images) {
          const figure = document.createElement('figure'), image = document.createElement('img'), caption = document.createElement('figcaption');
          image.src = src; caption.textContent = `${t.toFixed(2)} s`; figure.append(image, caption); document.body.append(figure);
          await image.decode();
        }
      }, images));
      await screenshot(resolve(root, `${clipId}_sheet.png`));
    } else {
      for (const t of times) {
        await step(page.evaluate(t => window.__setTime(t), t));
        await screenshot(resolve(root, `${clipId}_t${t}.png`));
      }
    }
    if (errors.length) throw new Error(errors.join('\n'));
  } finally {
    await close(); process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
  }
}
