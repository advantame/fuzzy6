#!/usr/bin/env node
/**
 * Real-time sound/clock/frame integration check, for engine playback changes.
 * Requires the dev server at http://127.0.0.1:5175 (npm run dev).
 * npm run play -- <deck> [clipId ...] [--jobs N] [--timeout seconds]
 * --answers right|wrong|skip chooses quiz answers (default right).
 * FUZZY6_URL overrides the default server http://127.0.0.1:5175.
 * Omit clips to play every narrated clip, including dives. --jobs defaults to 6,
 * accepts 1–12. --timeout bounds the entire run (default 600, maximum 3600).
 * Normal-mode pages are 960x540, with Chromium autoplay enabled. Each page polls
 * __mx.state() every 20ms and measures performance.now() from playing to ended.
 * Pass: |elapsed - (duration - startT)| <= 0.4s, stalls < 1s, sound on,
 * exact final time, no page errors/console warnings/errors. Does not judge audio
 * pronunciation, picture quality, or replace the all-recordings decode tests.
 * A separate supervisor terminates the worker's process group on timeout/signal
 * (including Chromium descendants); the worker always closes its browser.
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { loadDeck, ROOT } from './narrate.mjs';
import { deckIds, shortError } from './script-files.mjs';
import { normalizeDeck } from '../src/explorer/model.js';

export function parseArgs(args) {
  let jobs = 6, timeout = 600, answers = 'right';
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--answers') {
      answers = args[++i];
      if (!['right', 'wrong', 'skip'].includes(answers)) throw new Error('Invalid --answers');
    } else if (arg === '--jobs' || arg === '--timeout') {
      const value = Number(args[++i]);
      if (!Number.isInteger(value) || value < 1 || value > (arg === '--jobs' ? 12 : 3600))
        throw new Error(`${arg}: expected integer 1–${arg === '--jobs' ? 12 : 3600}`);
      if (arg === '--jobs') jobs = value;
      else timeout = value;
    } else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg.slice(0, 80)}`);
    else positional.push(arg);
  }
  if (!positional.length || positional.some(id => !/^[a-z0-9][a-z0-9-]*$/.test(id)))
    throw new Error('Usage: play <deck> [clipId ...] [--jobs 1–12] [--timeout seconds]');
  return { deck: positional[0], clips: [...new Set(positional.slice(1))], jobs, timeout, answers };
}

async function step(promise, ms = 15000) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Browser operation timeout (${ms}ms)`)), ms);
    })]);
  } finally { clearTimeout(timer); }
}

// Runs as an init script, before the app starts, so slow Node round trips cannot
// omit the first part of playback. Retains scalars only, never a polling history.
export function installMeasurement(input) {
  const { clipId, questions = [], answers = 'right' } = typeof input === 'string' ? { clipId: input } : input;
  window.__playResult = new Promise(resolve => {
    const boot = performance.now();
    let start, last, stall = 0;
    const finish = result => { clearInterval(timer); resolve(result); };
    const timer = setInterval(() => {
      const now = performance.now();
      let s = window.__mx?.state();
      // Answer when the UI opens, before the gate, so the measurement remains
      // continuous. Skip uses play only at the gate, never seek.
      if (s?.clip === clipId) {
        for (const q of questions) {
          if (answers !== 'skip') window.__mx.answer(q.id, answers === 'right' ? q.answer : q.wrong);
        }
        if (answers === 'skip' && s.ask) window.__mx.play();
        s = window.__mx.state();
      }
      if (!start) {
        if (now - boot > 30000) return finish({ error: 'playing timeout' });
        if (s?.state !== 'playing') return;
        if (s.clip !== clipId || !(s.duration > 0 && s.duration <= 180))
          return finish({ error: `unexpected clip=${s.clip} duration=${s.duration}` });
        if (s.t < s.head || s.t > s.head + 0.1)
          return finish({ error: `missed head=${s.head} startT=${s.t}` });
        start = { at: now, t: s.t, duration: s.duration };
        last = { at: now, t: s.t };
      }
      if (s.clip !== clipId || s.sound !== 'on')
        return finish({ error: `clip=${s.clip} sound=${s.sound} duration=${s.duration}` });
      start.duration = s.duration;
      if (s.t < last.t) return finish({ error: `backwards t=${s.t} previous=${last.t}` });
      // Count the interval through the first progress sample, too. Otherwise a
      // long blocked event loop could hide its stall by advancing on that sample.
      stall = Math.max(stall, (now - last.at) / 1000);
      if (s.t > last.t + 1e-3) last = { at: now, t: s.t };
      if (s.state === 'ended') return finish({ startT: start.t, duration: start.duration,
        wall: (now - start.at) / 1000, stall, t: s.t, sound: s.sound, end: s.state });
      if (stall >= 1) return finish({ error: `stall=${stall.toFixed(3)} t=${s.t}` });
      if (s.state !== 'playing') return finish({ error: `state=${s.state} t=${s.t}` });
      if (now - start.at > (start.duration - start.t + 5) * 1000)
        finish({ error: `ended timeout t=${s.t} duration=${start.duration}` });
    }, 20);
  });
}

export function checkResult(result, issues) {
  if (result.error) throw new Error(result.error);
  const span = result.duration - result.startT;
  const diff = result.wall - span;
  if (![span, diff, result.stall].every(Number.isFinite) || span <= 0 ||
      result.end !== 'ended' || result.t !== result.duration || result.sound !== 'on' ||
      Math.abs(diff) > 0.4 || result.stall >= 1 || issues)
    throw new Error(`end=${result.end} t=${result.t} diff=${diff.toFixed(3)} stall=${result.stall} issues=${issues} sound=${result.sound}`);
  return `duration=${result.duration.toFixed(3)} span=${span.toFixed(3)} wall=${result.wall.toFixed(3)} diff=${diff.toFixed(3)} stall=${result.stall.toFixed(3)} issues=0`;
}

async function playClip(browser, deck, clip, questions, answers) {
  let page, issues = 0;
  const messages = [];
  const report = message => { issues++; if (messages.length < 3) messages.push(shortError(message)); };
  try {
    page = await step(browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 }));
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    page.on('pageerror', report);
    page.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') report(message.text());
    });
    await step(page.addInitScript(installMeasurement, { clipId: clip, questions, answers }));
    await page.goto(`${process.env.FUZZY6_URL ?? 'http://127.0.0.1:5175'}/decks/${deck}/?c=${clip}`);
    await page.waitForFunction(() => window.__mx?.state().clip && window.__mx.state().state !== 'loading');
    if (await step(page.evaluate(() => window.__mx.state().auto))) await page.keyboard.press('a');
    const result = await step(page.evaluate(() => window.__playResult), 215000);
    return { ok: true, message: `OK ${deck}/${clip} ${checkResult(result, issues)}` };
  } catch (error) {
    return { ok: false, message: `NG ${deck}/${clip} ${shortError(error)}${messages.length ? ` | ${messages.join(' | ')}` : ''}` };
  } finally { if (page) await step(page.close()); }
}

async function worker(options) {
  let browser, closing, interrupted = false;
  const close = () => browser ? (closing ??= step(browser.close())) : Promise.resolve();
  const interrupt = () => { interrupted = true; process.exitCode = 130; void close().catch(() => {}); };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  const began = performance.now();
  try {
    if (!(await deckIds(ROOT)).includes(options.deck)) throw new Error(`Unknown deck: ${options.deck}`);
    const deck = await loadDeck(ROOT, options.deck);
    const entries = normalizeDeck(deck).all;
    const narrated = entries.filter(e => e.clip.script?.some(l => l.text !== undefined)).map(e => e.clip.id);
    const clips = options.clips.length ? options.clips : narrated;
    for (const clip of clips) if (!narrated.includes(clip)) throw new Error(`Unknown or unnarrated clip: ${options.deck}/${clip}`);
    if (!clips.length) throw new Error(`${options.deck}: no narrated clips`);
    if (interrupted) throw new Error('Playback interrupted');
    browser = await chromium.launch({ timeout: 15000, args: ['--autoplay-policy=no-user-gesture-required'] });
    if (interrupted) throw new Error('Playback interrupted');
    let next = 0, failures = 0;
    // A finite work queue; no retry or replacement job after any timeout.
    const workers = Array.from({ length: Math.min(options.jobs, clips.length) }, async () => {
      while (!interrupted && next < clips.length) {
        const id = clips[next++];
        const questions = (entries.find(e => e.clip.id === id).clip.script ?? []).filter(s => s.ask).map(s => ({
          id: s.id, answer: s.ask.answer, wrong: s.ask.choices.findIndex((_, i) => i !== s.ask.answer),
        }));
        const result = await playClip(browser, options.deck, id, questions, options.answers);
        if (!result.ok) failures++;
        console.log(result.message);
      }
    });
    const settled = await Promise.allSettled(workers);
    for (const result of settled) if (result.status === 'rejected') throw result.reason;
    console.log(`${clips.length} clips, jobs=${options.jobs}, failed=${failures}, elapsed=${((performance.now() - began) / 1000).toFixed(1)}s`);
    if (failures) process.exitCode = 1;
  } finally {
    await close();
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
}

function supervise(options, args) {
  const child = spawn(process.execPath, ['--max-old-space-size=512', fileURLToPath(import.meta.url), '--worker', ...args],
    { detached: true, stdio: 'inherit' });
  let stopped = false;
  const kill = signal => {
    if (!child.pid) return;
    try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  };
  const stop = code => {
    if (stopped) return;
    stopped = true;
    process.exitCode = code;
    kill('SIGTERM');
    // Remains live after child exit so orphaned browser descendants are stopped.
    setTimeout(() => kill('SIGKILL'), 2000);
  };
  const timer = setTimeout(() => { console.error(`Playback timeout (${options.timeout}s)`); stop(2); }, options.timeout * 1000);
  const sigint = () => stop(130), sigterm = () => stop(143);
  process.once('SIGINT', sigint);
  process.once('SIGTERM', sigterm);
  const cleanup = () => { clearTimeout(timer); process.removeListener('SIGINT', sigint); process.removeListener('SIGTERM', sigterm); };
  child.once('error', error => { cleanup(); console.error(shortError(error)); process.exitCode = 1; });
  child.once('exit', code => {
    cleanup();
    if (!stopped) { process.exitCode = code ?? 1; kill('SIGKILL'); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const isWorker = args[0] === '--worker';
  if (isWorker) args.shift();
  try {
    const options = parseArgs(args);
    if (isWorker) await worker(options);
    else supervise(options, args);
  } catch (error) { console.error(shortError(error)); process.exitCode = 1; }
}
