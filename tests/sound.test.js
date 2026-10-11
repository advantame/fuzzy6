import { afterEach, describe, it, expect, vi } from 'vitest';
import { createSound } from '../src/explorer/sound.js';

function fixture(options = {}) {
  const sources = [], gains = [];
  const context = {
    state: 'running', currentTime: 10, destination: {},
    resume: vi.fn(async () => { context.state = 'running'; }),
    decodeAudioData: vi.fn(async () => ({ duration: 2 })),
    createBufferSource() {
      const source = { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      sources.push(source); return source;
    },
    createGain() {
      const gain = { connect: vi.fn(), disconnect: vi.fn(), gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() } };
      gains.push(gain); return gain;
    },
  };
  const fetch = vi.fn(async () => new Response(new Uint8Array([1, 2])));
  const warn = vi.fn();
  const sound = createSound({ url: file => file }, { context, fetch, warn, ...options });
  const line = { id: 'a', spoken: true, voice: 1, end: 3, take: { file: 'a.opus', duration: 2 }, speed: 1 };
  const timeline = { duration: 4, lines: [line] };
  return { sound, context, sources, gains, fetch, warn, timeline };
}
afterEach(() => vi.useRealTimers());
describe('audio clock and ownership', () => {
  it.each([1.949, 1.95, 2.05, 2.051, NaN])('silences a mismatched decoded duration (%s), warns once, and preserves the timeline', async duration => {
    const f = fixture();
    f.context.decodeAudioData.mockResolvedValue({ duration });
    try {
      await f.sound.waitFirst('clip', f.timeline);
      await f.sound.waitFirst('clip', f.timeline);
      expect(f.sound.clock('clip', f.timeline, 1, 0.1)).toBe(1.1);
      expect(f.sources).toHaveLength(0);
      expect(f.warn).toHaveBeenCalledOnce();
      expect(f.timeline.duration).toBe(4);
      expect(f.timeline.lines[0].end).toBe(3);
    } finally { f.sound.destroy(); }
  });
  it.each([1.951, 2.049])('accepts a decoded duration within 50ms (%s)', async duration => {
    const f = fixture();
    f.context.decodeAudioData.mockResolvedValue({ duration });
    try {
      await f.sound.waitFirst('clip', f.timeline);
      f.sound.clock('clip', f.timeline, 1, 0);
      expect(f.sources).toHaveLength(1);
      expect(f.warn).not.toHaveBeenCalled();
      expect(f.fetch.mock.calls[0][0]).toBe('a.opus');
    } finally { f.sound.destroy(); }
  });
  it('locks visual time to audio, including long rAF gaps; stops at the recorded end', async () => {
    const f = fixture();
    try {
      f.sound.prepare([{ id: 'clip', timeline: f.timeline }]);
      await f.sound.waitFirst('clip', f.timeline);
      expect(f.sound.clock('clip', f.timeline, 0.9, 0.1)).toBe(1);
      expect(f.sources[0].start).toHaveBeenCalledWith(10, 0, 2);
      f.context.currentTime = 11.2;
      expect(f.sound.clock('clip', f.timeline, 1, 0.1)).toBeCloseTo(2.2);
      f.context.currentTime = 15;
      expect(f.sound.clock('clip', f.timeline, 2.2, 0.1)).toBe(3);
      expect(f.sources[0].stop).toHaveBeenCalledOnce();
      expect(f.sound.clock('clip', f.timeline, 3, 0.1)).toBe(3.1);
    } finally { f.sound.destroy(); }
  });
  it('starts ordinary boundary crossings at the audio head instead of dropping the first frame', async () => {
    const f = fixture();
    try {
      await f.sound.waitFirst('clip', f.timeline);
      expect(f.sound.clock('clip', f.timeline, 0.98, 0.04)).toBe(1);
      expect(f.sources[0].start).toHaveBeenCalledWith(10, 0, 2);
    } finally { f.sound.destroy(); }
  });
  it('evicts old clips while muted without fetching new neighbors', async () => {
    const f = fixture();
    try {
      await f.sound.waitFirst('a', f.timeline);
      f.sound.prepare([{ id: 'b', timeline: f.timeline }], false);
      expect(f.fetch).toHaveBeenCalledTimes(1);
      await f.sound.waitFirst('a', f.timeline);
      expect(f.fetch).toHaveBeenCalledTimes(2);
    } finally { f.sound.destroy(); }
  });
  it('starts a seek with its audio offset and 20ms gain ramp, and owns only one source', async () => {
    const f = fixture();
    try {
      await f.sound.waitFirst('clip', f.timeline);
      f.sound.clock('clip', f.timeline, 1.5, 0);
      expect(f.sources[0].start).toHaveBeenCalledWith(10, 0.5, 1.5);
      expect(f.gains[0].gain.setValueAtTime).toHaveBeenCalledWith(0, 10);
      expect(f.gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 10.02);
      f.sound.stop();
      f.sound.clock('clip', f.timeline, 2, 0);
      expect(f.sources[0].disconnect).toHaveBeenCalledOnce();
      expect(f.sources[1].start).toHaveBeenCalledWith(10, 1, 1);
    } finally { f.sound.destroy(); }
    expect(f.sources[1].stop).toHaveBeenCalledOnce();
  });
  it('missing files, fetch/decode failures warn once and retain the silent timeline', async () => {
    for (const mode of ['missing', 'fetch', 'decode']) {
      const f = fixture();
      if (mode === 'missing') f.timeline.lines[0].take.file = undefined;
      if (mode === 'fetch') f.fetch.mockRejectedValue(new Error('offline'));
      if (mode === 'decode') f.context.decodeAudioData.mockRejectedValue(new Error('invalid WAV'));
      try {
        await f.sound.waitFirst('clip', f.timeline);
        await f.sound.waitFirst('clip', f.timeline);
        expect(f.warn).toHaveBeenCalledOnce();
        expect(f.sound.clock('clip', f.timeline, 1, 0.1)).toBe(1.1);
        expect(f.sources).toHaveLength(0);
        expect(f.timeline.duration).toBe(4);
      } finally { f.sound.destroy(); }
    }
  });
  it('prunes buffers outside the supplied current/adjacent set, including obsolete takes', async () => {
    const f = fixture();
    try {
      for (const id of ['a', 'b', 'c']) await f.sound.waitFirst(id, f.timeline);
      expect(f.fetch).toHaveBeenCalledTimes(3);
      f.sound.prepare(['b', 'c', 'd'].map(id => ({ id, timeline: f.timeline })));
      await f.sound.waitFirst('d', f.timeline);
      f.sound.prepare(['a', 'b', 'c'].map(id => ({ id, timeline: f.timeline })));
      await f.sound.waitFirst('a', f.timeline);
      expect(f.fetch).toHaveBeenCalledTimes(5); // a was evicted, b/c reused
      const faster = { ...f.timeline, lines: [{ ...f.timeline.lines[0], speed: 1.2 }] };
      f.sound.prepare([{ id: 'a', timeline: faster }]);
      await f.sound.waitFirst('a', faster);
      expect(f.fetch).toHaveBeenCalledTimes(6);
    } finally { f.sound.destroy(); }
  });
  it('waits at most three seconds initially and aborts a load after fifteen seconds', async () => {
    vi.useFakeTimers();
    let signal;
    const f = fixture({ fetch: vi.fn((url, opts) => { signal = opts.signal; return new Promise(() => {}); }) });
    try {
      let done = false;
      const wait = f.sound.waitFirst('clip', f.timeline).then(() => { done = true; });
      await vi.advanceTimersByTimeAsync(2999); expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(1); await wait; expect(done).toBe(true);
      expect(signal.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(12000);
      expect(signal.aborted).toBe(true); expect(f.warn).toHaveBeenCalledOnce();
    } finally { f.sound.destroy(); }
    expect(vi.getTimerCount()).toBe(0);
  });
  it('cancels pending loads and first-line waits on destruction without warning', async () => {
    vi.useFakeTimers();
    let signal;
    const f = fixture({ fetch: vi.fn((url, opts) => { signal = opts.signal; return new Promise(() => {}); }) });
    const wait = f.sound.waitFirst('clip', f.timeline);
    f.sound.destroy();
    await wait;
    expect(signal.aborted).toBe(true);
    expect(f.warn).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('does not fetch estimates, resumes a blocked context, and uses the silent clock when suspended', async () => {
    const f = fixture();
    try {
      const estimated = { ...f.timeline, lines: [{ ...f.timeline.lines[0], take: undefined }] };
      await f.sound.waitFirst('clip', estimated);
      expect(f.fetch).not.toHaveBeenCalled();
      f.context.state = 'suspended';
      expect(f.sound.blocked()).toBe(true);
      expect(f.sound.clock('clip', f.timeline, 1, 0.1)).toBe(1.1);
      await f.sound.unlock();
      expect(f.sound.blocked()).toBe(false);
    } finally { f.sound.destroy(); }
  });
});
