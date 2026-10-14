import { test, expect } from '@playwright/test';

const boot = async (page, query = '?c=script&sound=0') => {
  await page.goto(`/decks/demo/${query}`);
  await page.waitForFunction(() => window.__mx?.state().clip && window.__mx.state().state !== 'loading');
};
const state = page => page.evaluate(() => window.__mx.state());
const pauseAt = (page, t) => page.evaluate(t => { window.__mx.pause(); window.__mx.seek(t); }, t);

test('recording timeline, live stage API, subtitle persistence, marks and targets', async ({ page }) => {
  await boot(page, '?c=script&t=0');
  expect((await state(page)).duration).toBe(6.9);
  expect((await state(page)).line).toBe('a');
  expect(await page.evaluate(() => ['a', 'a.voice', 'a.end', 'a.done', 'a.next', 'band', 'b', 'spin.done'].map(window.__mx.at)))
    .toEqual([0, 0.7, 1.9, 2.1, 2.1, 1.5, 2.1, 6.9]);
  await expect(page.locator('.mx-layer')).toHaveAttribute('data-duration', '6.9');
  await expect(page.locator('.mx-layer')).toHaveAttribute('data-anchor', '1.5');
  await expect(page.locator('.mx-cue')).toHaveCount(0);
  expect(await page.locator('.mx-seek-mark').evaluateAll(nodes => nodes.map(n => [Number(n.dataset.seconds), n.dataset.kind])))
    .toEqual([[0, 'line'], [2.1, 'still'], [5.5, 'line'], [6.9, 'still']]);
  expect((await state(page)).target).toEqual({ at: 2.1, kind: 'stop' });
  await expect(page.locator('.mx-seek-target')).toHaveAttribute('data-kind', 'stop');
  await pauseAt(page, 0.7);
  await expect(page.locator('.mx-cue strong')).toHaveText('最後の 10 年');
  await pauseAt(page, 2.999);
  await expect(page.locator('.mx-cue strong')).toHaveText('最後の 10 年');
  await pauseAt(page, 3);
  await expect(page.locator('.mx-cue')).toHaveCount(1);
  await expect(page.locator('.mx-cue')).toContainText('ChatGPT');
  await pauseAt(page, 5.6);
  expect((await state(page)).line).toBe('spin');
  await expect(page.locator('.mx-cue')).toContainText('ChatGPT');
  await pauseAt(page, 6.9);
  await expect(page.locator('.mx-cue')).toContainText('ChatGPT');
  await expect(page.locator('.mx-seek-target')).toBeHidden();
  expect((await state(page)).target).toBeNull();
  await page.keyboard.press('c');
  await expect(page.locator('.mx')).toHaveAttribute('data-subs', 'off');
  await expect(page.locator('.mx-subs')).toBeHidden();
  await page.keyboard.press('c');
  await expect(page.locator('.mx')).not.toHaveAttribute('data-subs');
});

test('sound button remains in the corner and toggles without taking pointer focus', async ({ page }) => {
  await boot(page, '?c=opening&sound=0');
  const button = page.locator('.mx-sound');
  const corner = await page.locator('.mx-corner').boundingBox();
  const box = await button.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(corner.y + corner.height);
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).not.toBeFocused();
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});

test('stop navigation preserves paused playback, repeats are ignored, ended back resumes', async ({ page }) => {
  await boot(page);
  await pauseAt(page, 0);
  await page.keyboard.press('ArrowRight');
  expect((await state(page)).t).toBe(2.1);
  expect((await state(page)).state).toBe('paused');
  await page.keyboard.press('ArrowRight'); expect((await state(page)).t).toBe(5.5);
  await page.keyboard.press('ArrowLeft'); expect((await state(page)).t).toBe(2.1);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true })));
  expect((await state(page)).t).toBe(2.1);
  await pauseAt(page, 3.2); await page.keyboard.press('ArrowLeft'); expect((await state(page)).t).toBe(2.1);
  await pauseAt(page, 3.1); await page.keyboard.press('ArrowLeft'); expect((await state(page)).t).toBe(0);
  await pauseAt(page, 6.9); await page.keyboard.press('ArrowLeft');
  expect((await state(page)).t).toBeGreaterThanOrEqual(5.5);
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
  await pauseAt(page, 6.9); await page.keyboard.press('Shift+ArrowLeft');
  expect((await state(page)).t).toBe(4.9);
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'paused');
  await pauseAt(page, 0); await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.mx')).toHaveAttribute('data-clip', 'cues');
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'ended');
  expect((await state(page)).t).toBe(9);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.mx')).toHaveAttribute('data-clip', 'script');
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
});

test('skip targets and seek marks keep pointer focus out of the slider', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.__mx.setPace({ skip: 2 }));
  await pauseAt(page, 2.1);
  expect((await state(page)).target).toEqual({ at: 4.1, kind: 'skip' });
  await expect(page.locator('.mx-seek-target')).toHaveAttribute('data-kind', 'skip');
  await page.keyboard.press('ArrowRight'); expect((await state(page)).t).toBe(4.1);
  await page.locator('.mx-seek-mark[data-seconds="0"]').click();
  expect((await state(page)).t).toBe(0);
  expect(await page.evaluate(() => document.activeElement?.className)).not.toMatch(/mx-seek/);
  await page.keyboard.press('ArrowRight'); expect((await state(page)).t).toBe(2);
  await page.mouse.move(320 + 1600 * 1.2 / 6.9, 900);
  await expect(page.locator('.mx-seek-hover-text')).toContainText('1948 年');
});

test('landing holds the clock, cancels on input, and does not run a paused RAF loop', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { window.__mx.setPace({ land: 0.5 }); window.__mx.seek(0); window.__mx.nextStop(); });
  await expect(page.locator('.mx')).toHaveAttribute('data-landing', '');
  expect((await state(page)).t).toBe(2.1);
  await page.waitForTimeout(150);
  expect((await state(page)).t).toBe(2.1);
  await page.keyboard.press('x');
  await expect(page.locator('.mx')).not.toHaveAttribute('data-landing');
  await expect.poll(async () => (await state(page)).t).toBeGreaterThan(2.1);
  await page.evaluate(() => { window.__mx.seek(0); window.__mx.nextStop(); window.__mx.pause(); });
  await expect(page.locator('.mx')).not.toHaveAttribute('data-landing');
  await page.waitForTimeout(550);
  expect((await state(page)).t).toBe(2.1);
  expect((await state(page)).state).toBe('paused');
  await page.evaluate(() => { window.__mx.seek(0); window.__mx.play(); window.__mx.nextStop(); });
  await expect(page.locator('.mx')).toHaveAttribute('data-landing', '');
  await expect.poll(async () => (await state(page)).t).toBeGreaterThan(2.1);
});

test('only natural completion schedules auto advance, including previous-clip ended navigation', async ({ page }) => {
  await boot(page, '?c=short&auto=1&sound=0');
  await page.evaluate(() => window.__mx.seek(1.5));
  await page.waitForTimeout(500);
  expect((await state(page)).clip).toBe('short');
  await page.evaluate(() => window.__mx.play());
  await expect(page.locator('.mx')).toHaveAttribute('data-clip', 'cues', { timeout: 4000 });
  await page.evaluate(() => { window.__mx.seek(0); window.__mx.prevStop(); });
  await expect(page.locator('.mx')).toHaveAttribute('data-clip', 'short');
  await page.waitForTimeout(500);
  expect((await state(page)).state).toBe('ended');
  expect((await state(page)).clip).toBe('short');
});

test('horizontal touch navigates stops and index arrows stop at chapter edges', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await boot(page); await pauseAt(page, 0);
  const touch = (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: 400 }] });
  await touch('touchStart', 1000); await touch('touchMove', 960); await touch('touchMove', 850); await touch('touchEnd');
  expect((await state(page)).t).toBe(2.1);
  await touch('touchStart', 850); await touch('touchMove', 890); await touch('touchMove', 1000); await touch('touchEnd');
  expect((await state(page)).t).toBe(0);
  await page.keyboard.press('i');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.mx-index')).toBeVisible();
  await expect(page.locator('.mx-index-clip[data-clip="duet"]')).toBeFocused();
});

test('pace changes preserve line section and update stage values, controls and events', async ({ page }) => {
  await boot(page, '?c=script&t=3.5&tune');
  await page.evaluate(() => { window.timelineEvents = 0; window.__mx.on('timeline', () => window.timelineEvents++); });
  const pre = page.locator('.mx-tune-field[data-key="pre"] input[type="number"]');
  await pre.fill('0.8'); await pre.dispatchEvent('input');
  expect((await state(page)).t).toBe(4.5); // b.voice + 0.5; pre grew on both a and b
  expect((await state(page)).duration).toBe(7.9);
  await expect(page.locator('.mx-layer')).toHaveAttribute('data-duration', '7.9');
  await expect(page.locator('.mx-tune-position')).toContainText('b / 声 / 4.500');
  await expect(page.locator('.mx-seek')).toHaveAttribute('aria-valuemax', '7.9');
  await page.locator('.mx-tune-field[data-key="voice.speed.normal"] select').selectOption('1.5');
  expect((await state(page)).t).toBe(4.3);
  await page.evaluate(() => window.__mx.setPace({ enter: 0.75 }));
  await expect(page.locator('.mx-layer')).toHaveAttribute('data-enter', '0.75');
  expect(await page.evaluate(() => window.timelineEvents)).toBeGreaterThanOrEqual(3);
  const copied = await page.evaluate(() => { const p = window.__mx.pace(); p.rest.long = 999; return window.__mx.pace().rest.long; });
  expect(copied).toBe(1);
  await page.reload(); await page.waitForFunction(() => window.__ready);
  expect(await page.evaluate(() => window.__mx.pace().pre)).toBe(0.8);
  await page.locator('.mx-tune-reset').click();
  expect(await page.evaluate(() => window.__mx.pace().pre)).toBe(0.3);
  await page.locator('.mx-tune-toggle').click();
  await expect(page.locator('.mx-tune')).toHaveAttribute('data-collapsed', '');
  await page.evaluate(() => localStorage.setItem('mx-tune:demo', JSON.stringify({ pre: 1.4 })));
  await boot(page, '?c=script&t=0');
  expect(await page.evaluate(() => window.__mx.pace().pre)).toBe(0.3);
  await expect(page.locator('.mx-tune')).toHaveCount(0);
});

test('changing a later interval updates layer progress even if the preserved time is identical', async ({ page }) => {
  await boot(page, '?c=script&t=1');
  await page.evaluate(() => window.__mx.setPace({ rest: { short: 1.3 } }));
  expect((await state(page)).t).toBe(1);
  expect((await state(page)).duration).toBe(8.2);
  const progress = await page.locator('.mx-layer').evaluate(el => Number(el.style.getPropertyValue('--mx-p')));
  expect(progress).toBeCloseTo(1 / 8.2);
});

test('still frames never instantiate audio, and script thumbnails use named posters', async ({ page }) => {
  await page.addInitScript(() => { window.AudioContext = class { constructor() { throw new Error('Audio in still mode'); } }; });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await boot(page, '?c=script&t=2.1');
  await page.keyboard.press('i');
  await expect(page.locator('.mx-index-clip[data-clip="script"] canvas')).toHaveAttribute('data-drawn', '');
  // The progress rectangle is filled at x=200 but not at x=1000 for poster a.done.
  expect(await page.locator('.mx-index-clip[data-clip="script"] canvas').evaluate(canvas => {
    const ctx = canvas.getContext('2d');
    return [200, 1000].map(x => ctx.getImageData(Math.floor(x / 1600 * canvas.width), Math.floor(150 / 900 * canvas.height), 1, 1).data[0]);
  })).toEqual([221, 17]);
  expect(errors).toEqual([]);
});

// 16kHz mono PCM, generated entirely in the test. No TTS or GPU process is started.
function wav(seconds = 3) {
  const count = Math.round(16000 * seconds);
  const buffer = Buffer.alloc(44 + count * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(16000, 24); buffer.writeUInt32LE(32000, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) buffer.writeInt16LE(Math.round(1500 * Math.sin(i / 16000 * Math.PI * 440)), 44 + i * 2);
  return buffer;
}
async function audioFixture(page, format = 'wav') {
  await page.goto('/tests/fixtures/?t=0'); await page.waitForFunction(() => window.__ready);
  await page.evaluate(format => {
    window.__mx.destroy();
    const clip = window.fixtureDeck.chapters[0].clips[0];
    delete clip.duration;
    clip.script = [{ id: 'a', text: '声{mark}です', tail: 0.2 }, { id: 'silent', lead: 0.4 }];
    window.fixtureDeck.pace = { pre: 0.1 };
    window.fixtureDeck.credits = ['VOICEVOX:四国めたん'];
    window.fixtureDeck.voice = { cast: { metan: { name: '四国めたん', credit: 'VOICEVOX:四国めたん' } }, url: () => format === 'opus' ? '/tests/fixtures/tone.opus' : '/test-narration.wav',
      manifest: { clips: { 'clip-0': { a: { source: '声です', takes: { '1': { duration: 3, anchors: { mark: 1 }, file: `test.${format}` } } } } } } };
    window.makeExplorer({ url: false });
  }, format);
  await page.waitForFunction(() => window.__mx.state().state !== 'loading');
}
async function probeAudio(page) {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    window.audioProbe = { contexts: 0, sources: [], gains: [] };
    window.AudioContext = class extends Native {
      constructor(...args) { super(...args); window.audioProbe.contexts++; window.audioProbe.context = this; }
      createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source), stop = source.stop.bind(source);
        const record = { stopped: false };
        source.start = (when, offset, duration) => {
          Object.assign(record, { when, offset, duration });
          window.audioProbe.sources.push(record);
          start(when, offset, duration);
        };
        source.stop = (...args) => { record.stopped = true; stop(...args); };
        return source;
      }
      createGain() { const gain = super.createGain(); window.audioProbe.gains.push(gain); return gain; }
    };
  });
}

test('Chromium decodes .opus and sends non-silent samples through the engine audio graph', async ({ page }) => {
  await probeAudio(page);
  await audioFixture(page, 'opus');
  await page.keyboard.press('k');
  await page.evaluate(() => window.__mx.play());
  await page.waitForFunction(() => window.audioProbe.sources.length > 0);
  await page.evaluate(() => {
    const probe = window.audioProbe;
    probe.analyser = probe.context.createAnalyser();
    probe.gains.at(-1).connect(probe.analyser);
  });
  await expect.poll(() => page.evaluate(() => {
    const probe = window.audioProbe;
    const samples = new Float32Array(probe.analyser.fftSize);
    probe.analyser.getFloatTimeDomainData(samples);
    return Math.max(...samples.map(Math.abs));
  })).toBeGreaterThan(0.005);
  expect(await page.evaluate(() => window.audioProbe.context.state)).toBe('running');
  expect(await page.evaluate(() => window.audioProbe.sources[0].duration)).toBeGreaterThan(2.5);
  await page.evaluate(() => window.__mx.pause());
  expect(await page.evaluate(() => window.audioProbe.sources.every(s => s.stopped))).toBe(true);
});

test('real WAV clock stays synchronized across delayed frames, seeks, pause and tab visibility', async ({ page }) => {
  await page.route('**/test-narration.wav', route => route.fulfill({ contentType: 'audio/wav', body: wav() }));
  await probeAudio(page);
  await audioFixture(page);
  await page.keyboard.press('k'); // unlocks if blocked, toggles if already playing
  await page.evaluate(() => window.__mx.play());
  await page.waitForFunction(() => window.audioProbe.sources.length > 0);
  await expect(page.locator('.mx-credit')).toHaveText('VOICEVOX:四国めたん');
  await page.evaluate(() => {
    window.syncProbe = { samples: 0, max: 0 };
    window.offSync = window.__mx.on('time', s => {
      const source = window.audioProbe.sources.at(-1), ctx = window.audioProbe.context;
      if (!source || source.stopped || ctx.currentTime - source.when < 0.1) return;
      const expected = window.__mx.at('a.voice') + source.offset + ctx.currentTime - source.when;
      if (expected < window.__mx.at('a.end')) {
        window.syncProbe.samples++;
        window.syncProbe.max = Math.max(window.syncProbe.max, Math.abs(s.t - expected));
      }
    });
  });
  await page.waitForTimeout(180);
  // Deliberately delay the main thread for a finite 250ms; the audio clock continues.
  await page.evaluate(() => { const until = performance.now() + 250; while (performance.now() < until) {} });
  await page.waitForTimeout(120);
  const sync = await page.evaluate(() => window.syncProbe);
  expect(sync.samples).toBeGreaterThan(3); expect(sync.max).toBeLessThanOrEqual(0.05);
  await page.evaluate(() => { window.offSync(); window.__mx.seek(1.4); });
  await page.waitForFunction(() => window.audioProbe.sources.length >= 2);
  const seekSource = await page.evaluate(() => window.audioProbe.sources.at(-1));
  expect(seekSource.offset).toBeCloseTo(1.3, 1);
  await page.evaluate(() => window.__mx.pause());
  expect(await page.evaluate(() => window.audioProbe.sources.every(s => s.stopped))).toBe(true);
  const paused = (await state(page)).t;
  await page.waitForTimeout(100); expect((await state(page)).t).toBe(paused);
  await page.evaluate(() => window.__mx.play());
  await page.waitForFunction(() => !window.audioProbe.sources.at(-1).stopped);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => window.audioProbe.sources.every(s => s.stopped))).toBe(true);
  const hidden = (await state(page)).t;
  await page.waitForTimeout(100); expect((await state(page)).t).toBe(hidden);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => !window.audioProbe.sources.at(-1).stopped);
  await page.keyboard.press('m');
  await expect(page.locator('.mx-sound')).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => window.audioProbe.sources.every(s => s.stopped))).toBe(true);
  expect(await page.evaluate(() => window.audioProbe.contexts)).toBe(1);
  await page.evaluate(() => window.__mx.destroy());
  expect(await page.evaluate(() => window.audioProbe.sources.every(s => s.stopped))).toBe(true);
});

test('autoplay blocking waits for any gesture, and M starts silent playback', async ({ page }) => {
  // Deterministic policy fixture: Chromium launch policies otherwise vary by runner.
  await page.addInitScript(() => {
    window.AudioContext = class {
      state = 'suspended';
      resume() { this.state = 'running'; return Promise.resolve(); }
    };
  });
  await boot(page, '?c=script');
  await expect(page.locator('.mx')).toHaveAttribute('data-sound', 'blocked');
  await expect(page.locator('.mx-unlock')).toHaveText('音声つきで再生');
  expect((await state(page)).t).toBe(0);
  await page.locator('.mx-unlock').click();
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('.mx-unlock')).toHaveCount(0);
  await page.reload(); await page.waitForFunction(() => window.__mx?.state().sound === 'blocked');
  await page.keyboard.press('m');
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('.mx')).toHaveAttribute('data-sound', 'off');
  await boot(page, '?c=opening');
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
});

test('invalid script errors stay local to the clip and unknown stage names are reported once', async ({ page }) => {
  await page.goto('/tests/fixtures/?t=0'); await page.waitForFunction(() => window.__ready);
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.evaluate(() => {
    window.__mx.destroy();
    const clip = window.fixtureDeck.chapters[0].clips[0];
    delete clip.duration; clip.script = [{ id: 'a', text: '{a}duplicate' }];
    window.makeExplorer();
  });
  await page.waitForFunction(() => window.__ready);
  await expect(page.locator('.mx-error')).toContainText('duplicate timeline name');
  await page.evaluate(() => { window.__mx.seek(0.2); window.__mx.seek(0.4); });
  expect(errors).toHaveLength(1);
  await page.evaluate(() => window.__go('clip-1', 1));
  await expect(page.locator('.mx-error')).toHaveCount(0);
});
