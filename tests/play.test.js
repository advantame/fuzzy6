import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseArgs, checkResult, installMeasurement } from '../tools/play.mjs';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('play CLI bounds', () => {
  it('defaults to all narrated clips and six jobs, deduplicates explicit clips', () => {
    expect(parseArgs(['llm'])).toEqual({ deck: 'llm', clips: [], jobs: 6, timeout: 600 });
    expect(parseArgs(['llm', 'opening', '--jobs', '12', 'opening', 'core', '--timeout', '240']))
      .toEqual({ deck: 'llm', clips: ['opening', 'core'], jobs: 12, timeout: 240 });
  });
  it.each([[], ['../llm'], ['llm', '--jobs'], ['llm', '--jobs', '0'], ['llm', '--jobs', '13'],
    ['llm', '--jobs', '1.5'], ['llm', '--timeout', '0'], ['llm', '--timeout', '3601'], ['llm', '--unknown']].map(args => ({ args })))
  ('rejects invalid arguments %#', ({ args }) => expect(() => parseArgs(args)).toThrow());
});

const result = { startT: 0.02, duration: 1, wall: 0.98, stall: 0.04, t: 1, sound: 'on', end: 'ended' };
it('requires completion, sound, timing, progress and zero issues', () => {
  expect(checkResult(result, 0)).toContain('issues=0');
  for (const patch of [{ wall: 1.39 }, { stall: 1 }, { t: 0.9 }, { end: 'playing' }, { sound: 'off' }, { wall: NaN }])
    expect(() => checkResult({ ...result, ...patch }, 0)).toThrow();
  expect(() => checkResult(result, 1)).toThrow('issues=1');
});

function measurement() {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const state = { clip: 'tiny', state: 'loading', t: 0.2, head: 0.2, duration: 0.4, sound: 'on' };
  const win = { __mx: { state: () => state } };
  vi.stubGlobal('window', win);
  installMeasurement('tiny');
  return { state, result: win.__playResult };
}

it('measures in the page from first playing sample and stops its timer at ended', async () => {
  const m = measurement();
  await vi.advanceTimersByTimeAsync(80);
  m.state.state = 'playing';
  await vi.advanceTimersByTimeAsync(20);
  m.state.t = 0.3;
  await vi.advanceTimersByTimeAsync(100);
  m.state.t = 0.4; m.state.state = 'ended';
  await vi.advanceTimersByTimeAsync(100);
  const measured = await m.result;
  expect(measured.wall).toBe(0.12); // ended observed on the next 20ms sample
  expect(measured.startT).toBe(0.2);
  expect(checkResult(measured, 0)).toContain('issues=0');
  expect(vi.getTimerCount()).toBe(0);
});

it('detects a stalled clock and a late start with only small synthetic state', async () => {
  const m = measurement();
  m.state.state = 'playing';
  await vi.advanceTimersByTimeAsync(1100);
  expect((await m.result).error).toContain('stall=1.000');
  expect(vi.getTimerCount()).toBe(0);
  const late = measurement();
  late.state.state = 'playing'; late.state.t = 0.35;
  await vi.advanceTimersByTimeAsync(20);
  expect((await late.result).error).toContain('missed head');
  expect(vi.getTimerCount()).toBe(0);
});
