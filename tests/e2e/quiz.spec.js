import { test, expect } from '@playwright/test';
const boot = async (page, query = '?c=quiz&sound=0') => {
  await page.goto(`/decks/demo/${query}`);
  await page.waitForFunction(() => window.__mx?.state().clip && window.__mx.state().state !== 'loading');
};
const state = page => page.evaluate(() => window.__mx.state());
const at = (page, name) => page.evaluate(name => window.__mx.at(name), name);
const pauseAt = (page, t) => page.evaluate(t => { window.__mx.pause(); window.__mx.seek(t); }, t);
const gate = (page, id = 'q1') => expect(page.locator('.mx')).toHaveAttribute('data-ask', id);
const quiz = (page, id = 'q1') => page.locator(`.mx-quiz[data-ask="${id}"]`);

test('natural gate pauses exactly, numeric answer resumes and updates timeline without moving t', async ({ page }) => {
  await boot(page);
  await gate(page);
  const before = await state(page);
  expect(before).toMatchObject({ state: 'paused', t: await at(page, 'q1.done'), answers: { q1: { choice: null, result: null, waiting: true } } });
  await page.waitForTimeout(150);
  expect((await state(page)).t).toBe(before.t);
  await expect(quiz(page)).toHaveAttribute('data-state', 'wait');
  await page.keyboard.press('9');
  expect((await state(page)).clip).toBe('quiz');
  expect((await state(page)).ask).toBe('q1');
  await page.evaluate(() => { window.timelineEvents = []; window.__mx.on('timeline', s => window.timelineEvents.push({ t: s.t, duration: s.duration })); });
  await page.keyboard.press('1');
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('.mx')).not.toHaveAttribute('data-ask');
  const events = await page.evaluate(() => window.timelineEvents);
  expect(events).toHaveLength(1); expect(events[0].t).toBe(before.t); expect(events[0].duration).toBeLessThan(before.duration);
  await expect(quiz(page).locator('[data-picked]')).toHaveAttribute('data-key', '1');
  await expect(quiz(page).locator('[data-correct]')).toHaveAttribute('data-key', '1');
  expect(await page.evaluate(() => window.__mx.at('q1-no') === Infinity)).toBe(true);
  expect((await state(page)).answers.q1.result).toBe('right');
  await expect(quiz(page).locator('[aria-disabled="true"]')).toHaveCount(3);
});

test('click before the gate answers while preserving pause, HTML label and DOM order', async ({ page }) => {
  await boot(page); await pauseAt(page, 0.1);
  await expect(quiz(page).locator('.mx-choice-label b')).toHaveText('4');
  await expect(quiz(page).locator('[data-key="3"]')).toHaveAttribute('aria-label', '3. 4');
  const order = await page.locator('.mx-stage').evaluate(el => {
    const q = el.querySelector('.mx-quiz'), d = el.querySelector('.mx-doors');
    return { direct: q.parentElement === el, beforeDoors: !!(q.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING),
      quizZ: Number(getComputedStyle(q).zIndex), doorsZ: Number(getComputedStyle(d).zIndex) };
  });
  expect(order.direct && order.beforeDoors).toBe(true); expect(order.quizZ).toBeLessThan(order.doorsZ);
  await quiz(page).locator('[data-key="3"]').click();
  expect(await state(page)).toMatchObject({ state: 'paused', t: 0.1, answers: { q1: { choice: 2, result: 'wrong' } } });
  expect(await page.evaluate(() => document.activeElement?.classList.contains('mx-choice'))).toBe(false);
  await quiz(page).locator('[data-key="1"]').click({ force: true });
  expect((await state(page)).answers.q1.choice).toBe(2);
  await expect(page.locator('.mx-layer[data-role="current"]')).toHaveAttribute('data-q1', JSON.stringify((await state(page)).answers.q1));
});

test('right lands on a gate and stays, then skips; left rewinds the question for a new answer', async ({ page }) => {
  await boot(page); await pauseAt(page, 0);
  await page.evaluate(() => { window.__mx.play(); window.__mx.nextStop(); });
  await gate(page);
  await page.waitForTimeout(1100); // beyond pace.land: gate must still be paused
  expect((await state(page)).state).toBe('paused');
  await page.keyboard.press('ArrowRight');
  await page.evaluate(() => window.__mx.pause());
  expect((await state(page)).answers.q1.result).toBe('skip');
  await expect(quiz(page).locator('[data-correct]')).toHaveAttribute('data-key', '1');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  expect((await state(page)).t).toBe(0);
  expect((await state(page)).answers.q1.result).toBeNull();
  await page.keyboard.press('1');
  expect((await state(page)).answers.q1.result).toBe('right');
});

for (const control of ['Space', 'k', '.mx-play', 'stage']) test(`${control} skips a waiting question`, async ({ page }) => {
  await boot(page); await gate(page);
  if (control === 'stage') await page.locator('.mx-stage').click({ position: { x: 100, y: 100 } });
  else if (control.startsWith('.')) await page.locator(control).click();
  else await page.keyboard.press(control);
  await expect(page.locator('.mx')).toHaveAttribute('data-state', 'playing');
  expect((await state(page)).answers.q1.result).toBe('skip');
});

test('seek skips gates; rewinding clears subsequent answers; restart and reentry clear all answers', async ({ page }) => {
  await boot(page); await pauseAt(page, 0.1);
  await page.evaluate(() => window.__mx.answer('q1', 0));
  await pauseAt(page, await at(page, 'q2'));
  await page.keyboard.press('3');
  expect((await state(page)).answers.q2.result).toBe('right');
  await pauseAt(page, await at(page, 'q2') - 0.1);
  expect((await state(page)).answers.q2.result).toBeNull(); expect((await state(page)).answers.q1.result).toBe('right');
  await pauseAt(page, await at(page, 'q2.done') + 0.1);
  expect((await state(page)).answers.q2.result).toBe('skip');
  await page.keyboard.press('r');
  expect((await state(page)).answers.q1.result).toBeNull();
  await page.evaluate(() => window.__mx.answer('q1', 0));
  await page.evaluate(() => window.__mx.go('quiz'));
  expect((await state(page)).answers.q1.result).toBeNull();
});

test('answer and timeline survive a dive and its internal navigation', async ({ page }) => {
  await boot(page); await pauseAt(page, 0.1);
  await page.evaluate(() => window.__mx.answer('q1', 0));
  const time = await at(page, 'q1.done'); await pauseAt(page, time);
  const duration = (await state(page)).duration;
  await page.evaluate(() => window.__mx.descend('motion-group'));
  await page.evaluate(() => window.__mx.next());
  await page.evaluate(() => window.__mx.ascend());
  expect(await state(page)).toMatchObject({ clip: 'quiz', duration, answers: { q1: { choice: 0, result: 'right' } } });
  expect((await state(page)).t).toBeGreaterThanOrEqual(time);
});

test('static answers use zero-based choices; thumb rendering has no answers', async ({ page }) => {
  await boot(page, '?c=quiz&t=0.2&a=q1:0,q2:2');
  expect((await state(page)).answers).toMatchObject({ q1: { choice: 0, result: 'right' }, q2: { choice: 2, result: 'right' } });
  await expect(quiz(page)).toHaveAttribute('data-state', 'right');
  await page.evaluate(() => {
    window.__mx.openIndex();
  });
  await expect(page.locator('.mx-index-clip[data-clip="quiz"] canvas')).toHaveAttribute('data-drawn');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__setTime(window.__mx.at('q2')));
  await expect(quiz(page, 'q2')).toHaveAttribute('data-state', 'right');
  await expect(quiz(page, 'q2').locator('[data-picked]')).toHaveAttribute('data-key', '3');
  await boot(page, '?c=quiz&t=0');
  await page.evaluate(() => window.__setTime(window.__mx.at('q1.done')));
  await gate(page); await expect(quiz(page)).toHaveAttribute('data-state', 'wait');
  await page.evaluate(() => window.__setTime(window.__mx.at('q1.done') + 0.1));
  await expect(quiz(page)).toHaveAttribute('data-state', 'skip');
});

test('quiz entrance occurs once during playback and seek removes data-in', async ({ page }) => {
  await boot(page); await pauseAt(page, await at(page, 'q2') - 0.05);
  await page.evaluate(() => window.__mx.play());
  await expect(quiz(page, 'q2')).toHaveAttribute('data-in');
  await page.evaluate(() => { window.quizNode = document.querySelector('.mx-quiz[data-ask="q2"]'); });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.quizNode === document.querySelector('.mx-quiz[data-ask="q2"]'))).toBe(true);
  await page.evaluate(() => window.__mx.seek(window.__mx.state().t));
  await expect(quiz(page, 'q2')).not.toHaveAttribute('data-in');
});

test('starting exactly at a gate skips it, and auto waits for an unanswered gate', async ({ page }) => {
  await boot(page, '?c=quiz&sound=0&auto=1'); await gate(page);
  await page.waitForTimeout(1100);
  expect(await state(page)).toMatchObject({ clip: 'quiz', state: 'paused', ask: 'q1' });
  await pauseAt(page, await at(page, 'q1.done'));
  await page.evaluate(() => window.__mx.play());
  expect((await state(page)).answers.q1.result).toBe('skip');
  await page.waitForTimeout(100);
  expect((await state(page)).state).toBe('playing');
});

test('answers are accepted only in the visible open/wait interval', async ({ page }) => {
  await boot(page); await pauseAt(page, 0.1);
  const results = await page.evaluate(() => [window.__mx.answer('missing', 0), window.__mx.answer(undefined, 0),
    window.__mx.answer('q2', 2), window.__mx.answer('q1', -1), window.__mx.answer('q1', 3), window.__mx.answer('q1', 0.5), window.__mx.answer('q1', 0), window.__mx.answer('q1', 1)]);
  expect(results).toEqual([false, false, false, false, false, false, true, false]);
});

test('a final question gate can be answered or skipped to reach ended', async ({ page }) => {
  for (const action of ['answer', 'play', 'nextStop']) {
    await page.goto('/tests/fixtures/?sound=0');
    await page.waitForFunction(() => window.__mx?.state().clip && window.__mx.state().state !== 'loading');
    await page.evaluate(() => {
      window.__mx.destroy();
      window.fixtureDeck.chapters = [{ id: 'one', clips: [{ id: 'quiz', title: 'Quiz',
        script: [{ id: 'q', text: 'a', ask: { choices: ['a', 'b'], answer: 0 } }], setup() {} }] }];
      window.makeExplorer();
    });
    await gate(page, 'q');
    await page.evaluate(action => action === 'answer' ? window.__mx.answer('q', 0) : window.__mx[action](), action);
    expect((await state(page)).state).toBe('ended');
    expect((await state(page)).answers.q.result).toBe(action === 'answer' ? 'right' : 'skip');
  }
});

test('stage.answer uses each render time, and thumbs remain unanswered even at the poster', async ({ page }) => {
  await boot(page, '?c=quiz&t=0');
  const observed = await page.evaluate(async () => {
    const { createLayer } = await import('/src/explorer/layer.js');
    const { buildTimeline, mergePace } = await import('/src/explorer/timeline.js');
    const { default: data } = await import('/decks/demo/clips/quiz.js');
    const timeline = buildTimeline(data);
    const states = [];
    const clip = { ...data, setup(stage) { return { render(t) { states.push({ t, thumb: stage.thumb, answer: stage.answer('q1') }); } }; } };
    for (const thumb of [false, true]) {
      const layer = createLayer(clip, document.querySelector('.mx'), { k: 1, still: true, thumb,
        report: (_, error) => { throw error; }, timing: () => timeline, pace: () => mergePace() });
      try { layer.setup(); for (const t of [timeline.duration, 0, timeline.at('q1.done')]) layer.render(t); }
      finally { layer.dispose(); }
    }
    return states;
  });
  expect(observed.slice(0, 3).map(s => [s.answer.result, s.answer.waiting])).toEqual([['skip', false], [null, false], [null, true]]);
  expect(observed.slice(3).every(s => s.answer.choice === null && s.answer.result === null && !s.answer.waiting)).toBe(true);
});
