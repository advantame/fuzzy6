import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readLexicon, kanaMoras, dictionaryParams, applyLong, lineLexicon } from '../tools/narrate/lexicon.mjs';
import { syncDictionary } from '../tools/narrate/dictionary.mjs';
import { SETTINGS, CORE_VERSION, ENGINE_INFO, generationHash, sha256, collectLines, queryTiming, anchorSeconds, checkDuration, takeStatus } from '../tools/narrate/core.mjs';
import { applyRecording } from '../tools/narrate/assets.mjs';

const tool = { word: 'ツール', kana: 'ツール', accent: 'flat', long: 2 };
const chat = { word: 'ChatGPT', kana: 'チャットジーピーティー', accent: 'flat' };
const actor = { name: '四国めたん', speaker: '四国めたん', style: 'ノーマル' };
const voice = { cast: { metan: actor } };
const line = { by: 'metan', clipId: 'sample', lineId: 'a', source: 'ツールを使う', anchors: [] };
const lexicon = readLexicon([tool]);
const mora = (text, vowel, consonant = null) => ({ text, vowel, consonant, pitch: 5,
  vowel_length: 4 / 93.75, consonant_length: consonant ? 2 / 93.75 : null });
const toolMoras = () => [mora('ツ', 'u', 'ts'), mora('ウ', 'u'), mora('ル', 'u', 'r')];
const query = moras => ({ ...SETTINGS, speedScale: 1, prePhonemeLength: 2 / 93.75,
  postPhonemeLength: 2 / 93.75, accent_phrases: [{ accent: moras.length, moras }] });

describe('deck lexicon validation and Engine mora counting', () => {
  it('normalizes defaults and maps flat/number to dictionary parameters', () => {
    expect(dictionaryParams(readLexicon([chat])[0])).toEqual({ surface: 'ChatGPT', pronunciation: chat.kana, accent_type: 0, word_type: 'PROPER_NOUN', priority: 5 });
    expect(dictionaryParams(readLexicon([{ ...tool, accent: 3, type: 'common', priority: 9 }])[0]))
      .toEqual({ surface: 'ツール', pronunciation: 'ツール', accent_type: 3, word_type: 'COMMON_NOUN', priority: 9 });
    expect(readLexicon()).toEqual([]);
    expect(() => readLexicon([tool, tool])).toThrow('重複');
    expect(() => readLexicon({})).toThrow('配列');
    expect(() => readLexicon(Array(1001).fill(tool))).toThrow('1000');
  });
  it.each([
    ['チャットジーピーティー', ['チャ', 'ッ', 'ト', 'ジ', 'ー', 'ピ', 'ー', 'ティ', 'ー']],
    ['キャット', ['キャ', 'ッ', 'ト']], ['ツール', ['ツ', 'ー', 'ル']], ['ンー', ['ン', 'ー']],
    ['イェヴョトゥテュクヮキィシェフィツォ', ['イェ', 'ヴョ', 'トゥ', 'テュ', 'クヮ', 'キィ', 'シェ', 'フィ', 'ツォ']],
    // Engine's count_mora does not simply merge all small kana with the previous kana.
    ['アィ', ['ア', 'ィ']],
  ])('counts %s like Engine 0.25.2', (kana, tokens) => {
    expect(kanaMoras(kana)).toEqual(tokens);
    expect(() => readLexicon([{ word: 'test', kana, accent: tokens.length }])).not.toThrow();
    expect(() => readLexicon([{ word: 'test', kana, accent: tokens.length + 1 }])).toThrow('accent');
  });
  it.each([
    { word: '' }, { word: 'a\nb' }, { word: 'a\0b' }, { word: 3 }, { word: 'x'.repeat(201) },
    { kana: '' }, { kana: 'つーる' }, { kana: 'ﾂｰﾙ' }, { kana: 'ツール。' }, { kana: 'アA' }, { kana: 'キャャ' },
    { kana: 'ッッ' }, { kana: 'アヮ' }, { kana: 'ア'.repeat(201) },
    { accent: 0 }, { accent: -1 }, { accent: 4 }, { accent: 1.5 }, { accent: '1' }, { accent: undefined },
    { long: 1 }, { long: 0 }, { long: 3.1 }, { long: '2' }, { long: NaN }, { long: Infinity },
    { type: 'verb' }, { type: null }, { priority: 0 }, { priority: 10 }, { priority: 1.5 }, { priority: '5' },
  ])('rejects invalid entries %j', patch => expect(() => readLexicon([{ ...tool, ...patch }])).toThrow());
  it('validates the whole deck even if the selected clip does not use the word', () => {
    expect(() => collectLines({ voice: { ...voice, lexicon: [{ ...tool, accent: 4 }] }, chapters: [] })).toThrow('accent');
  });
});

describe('long vowels', () => {
  it('finds repeated words, leaves other moras/pitch unchanged, and derives timing after the patch', () => {
    const q = query([...toolMoras(), mora('オ', 'o'), ...toolMoras(), mora('エ', 'e')]);
    const original = structuredClone(q);
    applyLong(q, 'ツールをツールへ', lexicon);
    expect(q.accent_phrases[0].moras.map(m => m.vowel_length * 93.75)).toEqual([4, 8, 4, 4, 4, 8, 4, 4]);
    const before = queryTiming(original), after = queryTiming(q);
    expect(after.frames - before.frames).toBe(8);
    expect(anchorSeconds(q, 3)).toBe(0.235); // (pre 2 + ts 2 + u 4 + u 8 + r 2 + u 4) / 93.75
    expect(after.mouth).toContainEqual([0.235, 'o']);
    expect(after.mouth).toContainEqual([0.491, 'e']);
    expect(() => checkDuration(q, after.duration)).not.toThrow();
    expect(() => checkDuration(q, before.duration)).toThrow('0.02秒');
    expect(q.accent_phrases[0].moras.map(m => m.pitch)).toEqual(Array(8).fill(5));
  });
  it('handles palatalized, multiple, and consecutive long vowels including devoicing', () => {
    const q = query([mora('チャ', 'a', 'ch'), mora('ッ', 'cl'), mora('ト', 'o', 't'), mora('ジ', 'i', 'j'),
      mora('イ', 'I'), mora('ピ', 'i', 'p'), mora('イ', 'i'), mora('ティ', 'i', 't'), mora('イ', 'i')]);
    applyLong(q, 'ChatGPT', readLexicon([{ ...chat, long: 3 }]));
    expect(q.accent_phrases[0].moras.map(m => m.vowel_length * 93.75)).toEqual([4, 4, 4, 4, 12, 4, 12, 4, 12]);
    const repeated = query([mora('ツ', 'U', 'ts'), mora('ウ', 'u'), mora('ウ', 'u'), mora('ル', 'u', 'r')]);
    applyLong(repeated, 'ツール', readLexicon([{ ...tool, kana: 'ツーール' }]));
    expect(repeated.accent_phrases[0].moras.map(m => m.vowel_length * 93.75)).toEqual([4, 8, 8, 4]);
  });
  it('matches across unpaused phrase boundaries, but never through a pause', () => {
    const q = query(toolMoras().slice(0, 1));
    q.accent_phrases.push({ moras: toolMoras().slice(1), accent: 2 });
    expect(() => applyLong(q, 'ツール', lexicon)).not.toThrow();
    q.accent_phrases[0].pause_mora = { vowel_length: 0.1 };
    expect(() => applyLong(q, 'ツール', lexicon)).toThrow('一致数 0');
  });
  it.each(['ツールツール', 'ツールツールツール'])('rejects counts that differ for %s before any edit', source => {
    const q = query(toolMoras());
    expect(() => applyLong(q, source, lexicon)).toThrow('語数');
    expect(q.accent_phrases[0].moras[1].vowel_length).toBe(4 / 93.75);
  });
  it('rejects extra homophones, wrong vowels/consonants, and overlapping patches', () => {
    expect(() => applyLong(query([...toolMoras(), ...toolMoras()]), 'ツール', lexicon)).toThrow('一致数 2');
    for (const bad of [mora('イ', 'i'), mora('ウ', 'u', 'w'), mora('ウ', 'i')]) {
      expect(() => applyLong(query([toolMoras()[0], bad, toolMoras()[2]]), 'ツール', lexicon)).toThrow('一致数 0');
    }
    const q = query(toolMoras());
    expect(() => applyLong(q, 'ツールツー', readLexicon([tool, { word: 'ツー', kana: 'ツー', accent: 'flat', long: 2 }]))).toThrow();
    expect(q.accent_phrases[0].moras[1].vowel_length).toBe(4 / 93.75);
  });
  it('does not apply an absent word, including ruby that replaced the surface', () => {
    const [l] = collectLines({ voice: { ...voice, lexicon: [tool] }, chapters: [{ clips: [{ id: 'sample', script: [{ id: 'a', text: '[ツール|ツウル]' }] }] }] });
    expect(lineLexicon(l.source, lexicon)).toEqual([]);
    const q = query(toolMoras());
    applyLong(q, l.source, lexicon);
    expect(q.accent_phrases[0].moras[1].vowel_length).toBe(4 / 93.75);
  });
});

describe('recording hashes', () => {
  it('keeps the exact pre-lexicon hash for decks/sentences without applicable entries', () => {
    const oldHash = sha256(JSON.stringify({ source: line.source, anchors: line.anchors, by: line.by,
      voice: { speaker: actor.speaker, style: actor.style }, engine: ENGINE_INFO, core: CORE_VERSION,
      settings: SETTINGS, speed: '1', upspeak: true }));
    for (const v of [voice, { ...voice, lexicon: [] }, { ...voice, lexicon: [chat] }]) expect(generationHash(line, v, '1')).toBe(oldHash);
  });
  it('marks only affected lines stale and canonicalizes defaults/order', () => {
    const a = { ...voice, lexicon: [tool, chat] }, b = { ...voice, lexicon: [{ ...tool, long: 3 }, chat] };
    const other = { ...line, lineId: 'b', source: 'ChatGPT' };
    const manifest = { version: 2, clips: {}, engine: ENGINE_INFO };
    for (const l of [line, other]) applyRecording(manifest, { line: l, voice: a, speed: '1', reading: 'カナ', take: {
      file: `sample/${l.lineId}@1.wav`, mouth: [[0, 'x']], generationSha256: generationHash(l, a, '1'),
    } });
    expect(takeStatus(manifest, line, b, '1', true)).toBe('stale');
    expect(takeStatus(manifest, other, b, '1', true)).toBe('ready');
    expect(generationHash(line, a, '1')).toBe(generationHash(line, { ...voice, lexicon: [chat, { ...tool, type: 'proper', priority: 5 }] }, '1'));
    for (const patch of [{ kana: 'ツウル' }, { accent: 1 }, { type: 'common' }, { priority: 9 }]) {
      expect(generationHash(line, { ...voice, lexicon: [{ ...tool, ...patch }] }, '1')).not.toBe(generationHash(line, a, '1'));
    }
  });
});

describe('owned dictionary synchronization', () => {
  let root, ledger, dictionary, request, next;
  const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'narrate-dictionary-test-'));
    ledger = join(root, '.cache/voicevox/managed-words.json');
    dictionary = {}; next = 10;
    request = vi.fn(async (path, options) => {
      if (path === '/user_dict') return structuredClone(dictionary);
      if (options.method === 'DELETE') { delete dictionary[path.split('/').at(-1)]; return; }
      if (path === '/user_dict_word') { const uuid = id(next++); dictionary[uuid] = options.params; return uuid; }
      throw new Error('unexpected request');
    });
  });
  afterEach(async () => { await rm(root, { recursive: true, force: true }); });
  const options = { signal: new AbortController().signal, identity: { pid: 123 } };
  const seed = async uuids => {
    await mkdir(join(root, '.cache/voicevox'), { recursive: true });
    await writeFile(ledger, JSON.stringify({ version: 1, uuids }));
  };
  it('deletes only remembered existing UUIDs, registers query parameters, and repeats without leftovers', async () => {
    dictionary[id(1)] = { surface: 'old' };
    await seed([id(1), id(2)]); // missing old UUID must not be deleted again
    const entries = readLexicon([tool, chat]);
    await syncDictionary(root, entries, request, options);
    expect(request.mock.calls.map(([path]) => path)).toEqual(['/user_dict', `/user_dict_word/${id(1)}`, '/user_dict_word', '/user_dict_word']);
    for (const [, opt] of request.mock.calls.slice(2)) { expect(opt.method).toBe('POST'); expect(opt.body).toBeUndefined(); expect(opt.identity).toEqual(options.identity); }
    const first = Object.values(dictionary);
    expect(first).toEqual(entries.map(dictionaryParams));
    request.mockClear();
    await syncDictionary(root, entries, request, options);
    expect(Object.values(dictionary)).toEqual(first);
    expect(Object.keys(dictionary)).toHaveLength(2);
    expect(request.mock.calls.filter(([, opt]) => opt.method === 'DELETE').map(([path]) => path)).toEqual([`/user_dict_word/${id(10)}`, `/user_dict_word/${id(11)}`]);
    expect(JSON.parse(await readFile(ledger, 'utf8')).uuids).toEqual(Object.keys(dictionary));
  });
  it('an unknown UUID prevents ALL deletion/registration and leaves the ledger byte-for-byte intact', async () => {
    dictionary[id(1)] = { surface: 'known' }; dictionary[id(2)] = { surface: 'someone else' };
    await seed([id(1)]);
    const before = await readFile(ledger), previous = structuredClone(dictionary);
    await expect(syncDictionary(root, lexicon, request, options)).rejects.toThrow('控えにない');
    expect(request.mock.calls.map(([path]) => path)).toEqual(['/user_dict']);
    expect(dictionary).toEqual(previous);
    expect((await readFile(ledger)).equals(before)).toBe(true);
  });
  it('protects foreign dictionaries without a ledger even on decks without a lexicon', async () => {
    dictionary[id(1)] = { surface: 'foreign' };
    await expect(syncDictionary(root, [], request, options)).rejects.toThrow('控えにない');
    expect(request).toHaveBeenCalledOnce();
    expect(await readdir(root)).toEqual([]);
  });
  it('removes old words on a deck without vocabulary', async () => {
    await syncDictionary(root, lexicon, request, options);
    await syncDictionary(root, [], request, options);
    expect(dictionary).toEqual({});
    expect(JSON.parse(await readFile(ledger, 'utf8')).uuids).toEqual([]);
  });
  it('retains successful UUIDs when a later registration fails and recovers on the next run', async () => {
    const impl = request.getMockImplementation();
    request.mockImplementation(async (path, opts) => {
      if (path === '/user_dict_word' && next === 11) throw new Error('registration failed');
      return impl(path, opts);
    });
    await expect(syncDictionary(root, readLexicon([tool, chat]), request, options)).rejects.toThrow('registration failed');
    expect(JSON.parse(await readFile(ledger, 'utf8')).uuids).toEqual([id(10)]);
    request.mockImplementation(impl);
    await syncDictionary(root, lexicon, request, options);
    expect(Object.values(dictionary)).toEqual(lexicon.map(dictionaryParams));
  });
  it('fails closed after a registration whose UUID was never saved', async () => {
    await seed([]);
    dictionary[id(1)] = dictionaryParams(lexicon[0]);
    await expect(syncDictionary(root, lexicon, request, options)).rejects.toThrow('控えにない');
    expect(request).toHaveBeenCalledOnce();
  });
  it('rejects malformed ownership data before any request', async () => {
    await seed(['../foreign']);
    await expect(syncDictionary(root, lexicon, request, options)).rejects.toThrow('UUID');
    expect(request).not.toHaveBeenCalled();
  });
});
