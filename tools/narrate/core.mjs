import { createHash } from 'node:crypto';
import { parseLine, isName } from '../../src/explorer/script.js';
import { readCast, lineBy, clipCast } from '../../src/explorer/cast.js';
import { mergePace, lineSpeed } from '../../src/explorer/timeline.js';
import { readLexicon, lineLexicon } from './lexicon.mjs';

export const ENGINE_INFO = { name: 'VOICEVOX', version: '0.25.2' };
export const CORE_VERSION = '0.16.1';
export const SETTINGS = Object.freeze({
  pitchScale: 0, intonationScale: 1, volumeScale: 1,
  prePhonemeLength: 0.05, postPhonemeLength: 0.1,
  outputSamplingRate: 24000, outputStereo: false,
  pauseLength: null, pauseLengthScale: 1,
});
export const MAX_WAV_BYTES = 10 * 1024 ** 2;
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const millis = (seconds) => Math.round(seconds * 1000) / 1000;
export const speedKey = (value) => {
  const n = Number(value);
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(String(value)) || !Number.isFinite(n) || n < 0.5 || n > 2) {
    throw new Error('話速は 0.5〜2 の十進数にしてください。');
  }
  return String(n);
};

export function parseArgs(args) {
  const result = { generate: false, encode: false, prune: false, inspect: false, json: false, clips: [], speeds: null, help: false };
  const flags = new Set();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (flags.has(arg)) throw new Error(`引数の重複: ${arg}`);
      flags.add(arg);
      if (arg === '--generate') result.generate = true;
      else if (arg === '--encode') result.encode = true;
      else if (arg === '--prune') result.prune = true;
      else if (arg === '--inspect') result.inspect = true;
      else if (arg === '--json') result.json = true;
      else if (arg === '--dry-run') { /* explicit default */ }
      else if (arg === '--help') result.help = true;
      else if (arg === '--speeds') {
        if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('--speeds の値がありません。');
        result.speeds = args[++i].split(',').map(speedKey);
        if (result.speeds.length > 16 || new Set(result.speeds).size !== result.speeds.length) throw new Error('話速は重複のない16個以内にしてください。');
      } else throw new Error(`不明な引数: ${arg}`);
    } else {
      if (!isName(arg) || arg.length > 100) throw new Error(`不正なID: ${arg}`);
      if (!result.deck) result.deck = arg;
      else result.clips.push(arg);
    }
  }
  if (['--generate', '--encode', '--prune', '--inspect', '--dry-run'].filter(f => flags.has(f)).length > 1) throw new Error('--generate / --encode / --prune / --inspect / --dry-run は同時に指定できません。');
  if (result.json && !result.inspect) throw new Error('--json は --inspect と一緒に指定してください。');
  if (result.inspect && result.clips.length !== 1) throw new Error('--inspect はクリップを一つ指定してください。');
  if (result.prune && result.speeds) throw new Error('--prune はデッキの歩調で判断するため --speeds と同時に指定できません。');
  if (!result.deck && !result.help) throw new Error('デッキを指定してください。');
  if (new Set(result.clips).size !== result.clips.length) throw new Error('クリップ指定が重複しています。');
  return result;
}

export function collectLines(deck, selected = []) {
  readLexicon(deck.voice?.lexicon);
  const clips = deck.chapters.flatMap((chapter) => chapter.clips);
  const ids = new Set();
  for (const clip of clips) {
    if (!isName(clip.id) || clip.id.length > 100 || ids.has(clip.id)) throw new Error(`不正または重複したclip ID: ${clip.id}`);
    ids.add(clip.id);
  }
  for (const id of selected) if (!ids.has(id)) throw new Error(`クリップがありません: ${id}`);
  const cast = readCast(deck.voice);
  const lines = [];
  const pace = mergePace(deck.pace);
  for (const clip of clips.filter((c) => !selected.length || selected.includes(c.id))) {
    clipCast(clip, cast);
    if (clip.script === undefined) continue;
    if (!Array.isArray(clip.script)) throw new Error(`script は配列にしてください: ${clip.id}`);
    const names = new Set();
    const claim = (name) => {
      if (!isName(name) || name.length > 100 || names.has(name)) throw new Error(`文と印のIDが不正または重複: ${clip.id}/${name}`);
      names.add(name);
    };
    for (const line of clip.script) claim(line.id);
    for (const line of clip.script) {
      const requestedSpeed = lineSpeed(line, pace);
      const by = lineBy(line, cast);
      const actor = cast[by];
      if (line.text === undefined) continue;
      const speed = speedKey(requestedSpeed);
      if (typeof line.text !== 'string' || line.text.length > 2000) throw new Error(`原稿は2000文字以内: ${clip.id}/${line.id}`);
      const parsed = parseLine(line.text);
      for (const anchor of parsed.anchors) claim(anchor.name);
      if (!parsed.speech.trim()) throw new Error(`空の読み上げ: ${clip.id}/${line.id}（無音の文は text を省略）`);
      if (!actor || (actor.speaker === undefined && actor.style === undefined)) continue;
      if (![actor.speaker, actor.style].every(s => typeof s === 'string' && s.trim()))
        throw new Error(`語り手 ${by} の speaker と style が必要です。`);
      lines.push({ by, speaker: actor.speaker, style: actor.style, clipId: clip.id, lineId: line.id, source: parsed.speech, anchors: parsed.anchors, speed });
      if (lines.length > 2000) throw new Error('一度の処理は2000文以内にしてください。');
    }
  }
  return lines;
}

// Individual voices are also used by persisted in-flight recording transactions.
export const narrator = (line, voice) => voice.cast ? voice.cast[line.by] : voice;
export const generationHash = (line, voice, speed) => {
  const lexicon = lineLexicon(line.source, readLexicon(voice.lexicon));
  return sha256(JSON.stringify({
    source: line.source, anchors: line.anchors, by: line.by, voice: { speaker: narrator(line, voice).speaker, style: narrator(line, voice).style },
    engine: ENGINE_INFO, core: CORE_VERSION, settings: SETTINGS, speed: speedKey(speed), upspeak: true,
    // Omit the key entirely for legacy decks and unaffected sentences.
    ...(lexicon.length ? { lexicon } : {}),
  }));
};

export function takeStatus(manifest, line, voice, speed, exists) {
  const clip = Object.hasOwn(manifest.clips ?? {}, line.clipId) ? manifest.clips[line.clipId] : undefined;
  const entry = Object.hasOwn(clip ?? {}, line.lineId) ? clip[line.lineId] : undefined;
  const take = entry?.takes?.[speed];
  if (!exists || !take) return 'missing';
  if (entry.source !== line.source || entry.by !== line.by || entry.speaker !== narrator(line, voice).speaker || entry.style !== narrator(line, voice).style ||
      !Array.isArray(take.mouth) || !take.mouth.length ||
      manifest.engine?.version !== ENGINE_INFO.version || manifest.engine?.name !== ENGINE_INFO.name ||
      take.generationSha256 !== generationHash(line, voice, speed)) return 'stale';
  return 'ready';
}

// Engine 0.25.2 tts_engine.py: round each phoneme separately, ties to even.
// https://github.com/VOICEVOX/voicevox_engine/blob/0.25.2/voicevox_engine/tts_pipeline/tts_engine.py
export function roundEven(n) {
  const floor = Math.floor(n);
  return n - floor === 0.5 ? floor + (floor % 2) : Math.round(n);
}
export function queryTiming(query) {
  const speed = query.speedScale;
  if (!Number.isFinite(speed) || speed <= 0 || !Array.isArray(query.accent_phrases)) throw new Error('AudioQuery が不正です。');
  const frames = (length) => {
    if (!Number.isFinite(length) || length < 0 || length > 180) throw new Error('音素の長さが不正です。');
    return roundEven(length / speed * 93.75);
  };
  let total = 0;
  const mouth = [];
  const segment = (length, shape) => {
    const n = frames(length);
    if (total + n > 180 * 93.75) throw new Error('AudioQuery の長さが許容範囲外です。');
    if (n && mouth.at(-1)?.[1] !== shape) mouth.push([millis(total / 93.75), shape]);
    total += n;
  };
  const shapeOf = vowel => ({ a: 'a', i: 'i', u: 'u', e: 'e', o: 'o', n: 'n' })[vowel?.toLowerCase()] ?? 'x';
  segment(query.prePhonemeLength, 'x');
  const moras = [];
  for (const phrase of query.accent_phrases) {
    for (const mora of phrase.moras) {
      if (typeof mora.text !== 'string' || !mora.text) throw new Error('拍の読みがありません。');
      moras.push({ text: mora.text, at: total / 93.75 });
      const shape = shapeOf(mora.vowel);
      if (mora.consonant_length != null) segment(mora.consonant_length, /^(m|b|p)y?$/.test(mora.consonant) ? 'x' : shape);
      segment(mora.vowel_length, shape);
    }
    if (phrase.is_interrogative && phrase.moras.at(-1)?.pitch > 0) segment(0.15, shapeOf(phrase.moras.at(-1).vowel));
    if (phrase.pause_mora) segment((query.pauseLength ?? phrase.pause_mora.vowel_length) * (query.pauseLengthScale ?? 1), 'x');
  }
  const speechEnd = total / 93.75;
  segment(query.postPhonemeLength, 'x');
  if (!moras.length || total > 180 * 93.75) throw new Error('AudioQuery の長さが許容範囲外です。');
  return { moras, mouth, speechEnd, frames: total, duration: total / 93.75 };
}

// Compare mora tokens, not kana characters (キ vs キャ must fail). Accent and
// devoicing marks in query.kana, and inferred phrase pauses, do not change reading.
export function prefixMoraCount(full, prefix) {
  const a = full.accent_phrases.flatMap((p) => p.moras.map((m) => m.text));
  const b = prefix.accent_phrases.flatMap((p) => p.moras.map((m) => m.text));
  if (!b.length || b.length > a.length || b.some((text, i) => text !== a[i])) {
    throw new Error('印より前の読みが全文の読みの頭と一致しません。印を句の切れ目へ動かすか、[表記|よみ] で固定してください。');
  }
  return b.length;
}
export function anchorSeconds(query, count) {
  const timing = queryTiming(query);
  if (!Number.isInteger(count) || count < 0 || count > timing.moras.length) throw new Error('印の拍位置が不正です。');
  return millis(timing.moras[count]?.at ?? timing.speechEnd);
}
export function checkDuration(query, duration) {
  const expected = queryTiming(query).duration;
  // A few ulps must not turn exactly 0.020 seconds into a passing comparison.
  if (!Number.isFinite(duration) || Math.abs(expected - duration) >= 0.02 - 1e-10) throw new Error(`音声長と拍の合計が0.02秒以上違います: WAV=${duration.toFixed(6)}, query=${expected.toFixed(6)}`);
}

export function validateWav(bytes) {
  if (bytes.length < 44 || bytes.length > MAX_WAV_BYTES || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') throw new Error('WAVの形式または容量が不正です。');
  if (bytes.readUInt32LE(4) + 8 !== bytes.length) throw new Error('WAVのRIFF長が一致しません。');
  let format, data;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const kind = bytes.toString('ascii', offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + length > bytes.length) throw new Error('WAVチャンクが途中で切れています。');
    if (kind === 'fmt ') {
      if (length < 16 || format) throw new Error('WAVのfmtチャンクが不正です。');
      format = [bytes.readUInt16LE(start), bytes.readUInt16LE(start + 2), bytes.readUInt32LE(start + 4), bytes.readUInt32LE(start + 8), bytes.readUInt16LE(start + 12), bytes.readUInt16LE(start + 14)];
    }
    if (kind === 'data') {
      if (data) throw new Error('複数のdataチャンクがあります。');
      data = bytes.subarray(start, start + length);
    }
    offset = start + length + length % 2;
  }
  if (offset !== bytes.length || !format || format.join() !== '1,1,24000,48000,2,16' || !data || data.length % 2) throw new Error('音声は24kHz・PCM16・monoである必要があります。');
  const duration = data.length / 48000;
  if (duration < 0.15 || duration > 180) throw new Error('音声長が許容範囲外です。');
  let peak = 0;
  for (let i = 0; i < data.length; i += 2) {
    const sample = data.readInt16LE(i);
    if (sample === -32768 || sample === 32767) throw new Error('音声に飽和したサンプルがあります。');
    peak = Math.max(peak, Math.abs(sample));
  }
  if (!peak) throw new Error('音声が全区間無音です。');
  return { duration, samples: data.length / 2, sha256: sha256(bytes) };
}
