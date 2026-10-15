// 見積もりの文を失敗にするのは、decks/<id>/voice/manifest.json があり、
// deck.voice.manifest がその JSON モジュールから来る、配布音声のあるデッキだけ。
// deck.js に記録を内蔵する見本では見積もりを許すが、時計の単調増加・完走は
// 同じように検証する。デッキ名・クリップ名・文の id による例外は設けない。
import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ROOT } from '../tools/narrate.mjs';
import { deckIds } from '../tools/script-files.mjs';
import { normalizeDeck } from '../src/explorer/model.js';
import { buildTimeline, mergePace } from '../src/explorer/timeline.js';
import { checkClock } from './helpers/narration-clock.js';
import { loadNarrationDeck } from './helpers/narration-deck.js';

const offsets = [['equal', 0], ['short', -1 / 3000], ['long', 1 / 3000]];

// Same read-only Vite SSR loading as script-freshness.test.js: resolves glob,
// JSON, fonts and virtual:chars without running clip.setup or writing scripts.
for (const id of await deckIds(ROOT)) {
  const { deck, recordingsRequired } = await loadNarrationDeck(ROOT, id);
  describe(`${id}: actual narration timelines`, () => {
    for (const { clip } of normalizeDeck(deck).all.filter(e => e.clip.script !== undefined)) {
      for (const [label, delta] of offsets) {
        it(`${clip.id}: ${label} decoded length`, async () => {
          const timeline = buildTimeline(clip, mergePace(deck.pace), deck.voice);
          await checkClock(`${id}/${clip.id}`, timeline, { delta, recordingsRequired });
        });
      }
    }
  });
}

function fixture() {
  const clip = { id: 'tiny', join: 'cut', bridge: 0.2, script: [
    { id: 'a', text: 'a', lead: 0.1, tail: 0.1, still: true, rest: 'short' },
    { id: 'silent', lead: 0.1, rest: 'long' },
    { id: 'b', text: 'b', tail: 0.1 },
  ] };
  const voice = { cast: { narrator: { name: 'Narrator' } }, manifest: { clips: { tiny: Object.fromEntries(['a', 'b'].map(id => [id,
    { source: id, takes: { '1.3': { file: `${id}.opus`, duration: 0.12 } } },
  ])) } } };
  return { clip, voice, timeline: () => buildTimeline(clip, mergePace({ pre: 0.05 }), voice) };
}

describe('clock check detects small local faults', () => {
  it.each(offsets)('passes a bridge, lead, tail, rests, still and silent line: %s', async (_, delta) => {
    await checkClock('fixture/tiny', fixture().timeline(), { delta });
  });
  it('rejects a clock stuck at the first voice end', async () => {
    const timeline = fixture().timeline();
    await expect(checkClock('fixture/tiny', timeline, { wrapClock: clock => (...args) =>
      Math.min(timeline.lines[0].end, clock(...args)) })).rejects.toThrow('fixture/tiny: clock');
  });
  it('bounds a clock that advances by epsilon but never reaches duration', async () => {
    await expect(checkClock('fixture/tiny', fixture().timeline(), { wrapClock: () => (_id, _timeline, t) =>
      t + Number.EPSILON })).rejects.toThrow('fixture/tiny: incomplete');
  });
  it('rejects a skipped source even when every frame advances to duration', async () => {
    const timeline = fixture().timeline();
    const first = timeline.lines[0];
    await expect(checkClock('fixture/tiny', timeline, { wrapClock: clock => (id, tl, t, dt) =>
      t < first.voice && t + dt >= first.voice ? first.end : clock(id, tl, t, dt) }))
      .rejects.toThrow('fixture/tiny/a: starts=0 expected=1');
  });
  it.each(['missing', 'stale'])('identifies a %s line in a deck importing its distributed manifest', async kind => {
    await withDeckFixture(kind, true, true, async ({ deck, recordingsRequired }) => {
      expect(recordingsRequired).toBe(true);
      const timeline = buildTimeline(deck.chapters[0].clips[0], mergePace(deck.pace), deck.voice);
      await expect(checkClock('fixture/tiny', timeline, { recordingsRequired }))
        .rejects.toThrow('fixture/tiny/b: estimated narration');
    });
  });
  it.each([false, true])('allows inline estimates and still checks the clock (manifest file present=%s)', async filePresent => {
    await withDeckFixture('missing', false, filePresent, async ({ deck, recordingsRequired }) => {
      expect(recordingsRequired).toBe(false);
      const timeline = buildTimeline(deck.chapters[0].clips[0], mergePace(deck.pace), deck.voice);
      expect(timeline.lines.at(-1).take === undefined).toBe(true);
      await checkClock('fixture/tiny', timeline, { recordingsRequired });
      await expect(checkClock('fixture/tiny', timeline, { recordingsRequired, wrapClock: () => (_id, _tl, t) => t }))
        .rejects.toThrow('fixture/tiny: clock');
    });
  });
});

// Small, disposable on-disk decks exercise the same classification as real decks.
// Inline and imported versions have identical data, so file presence/equality
// alone cannot accidentally enable the strict check. Repository assets stay read-only.
async function withDeckFixture(kind, imported, filePresent, check) {
  const root = await mkdtemp(join(tmpdir(), 'narration-clock-'));
  try {
    const { clip, voice } = fixture();
    if (kind === 'missing') delete voice.manifest.clips.tiny.b;
    else voice.manifest.clips.tiny.b.source = 'old';
    await mkdir(join(root, 'decks/fixture/voice'), { recursive: true });
    await writeFile(join(root, 'vite.config.js'), 'export default {};');
    if (filePresent) await writeFile(join(root, 'decks/fixture/voice/manifest.json'), JSON.stringify(voice.manifest));
    const deck = { id: 'fixture', pace: { pre: 0.05 }, voice, chapters: [{ id: 'one', clips: [clip] }] };
    const source = imported
      ? `import manifest from './voice/manifest.json'; const deck = ${JSON.stringify(deck)}; deck.voice.manifest = manifest; export default deck;`
      : `export default ${JSON.stringify(deck)};`;
    await writeFile(join(root, 'decks/fixture/deck.js'), source);
    await check(await loadNarrationDeck(root, 'fixture'));
  } finally { await rm(root, { recursive: true, force: true }); }
}
