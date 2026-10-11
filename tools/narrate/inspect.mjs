import { CORE_VERSION, SETTINGS, narrator, queryTiming, speedKey } from './core.mjs';
import { readLexicon, lineLexicon, applyLong } from './lexicon.mjs';
import { syncDictionary } from './dictionary.mjs';
import { request, startSupervisedEngine, resolveStyle } from './engine.mjs';

export async function queryLine(line, lexicon, params, options) {
  try {
    const query = await request('/audio_query', { ...options, method: 'POST', params: { ...params, text: line.source } });
    if (typeof query.kana !== 'string' || query.kana.length > 10000) throw new Error('AudioQuery に読みがありません。');
    return applyLong(query, line.source, lexicon);
  } catch (error) { throw new Error(`${line.clipId}/${line.lineId}: ${error.message}`); }
}

// Yield one query at a time: JSON/table output must not accumulate a whole deck.
// No asset inspection/writer, encoding or synthesis on this path.
export async function* inspectQueries(root, lines, voice, speeds, signal) {
  const lexicon = readLexicon(voice?.lexicon);
  if (lines.length * (speeds?.length ?? 1) > 2000) throw new Error('一度の処理は2000件以内にしてください。');
  if (!lines.length) return;
  const engine = await startSupervisedEngine(root, signal);
  try {
    const options = { signal, identity: engine.identity };
    await syncDictionary(root, lexicon, request, options);
    const styles = new Map();
    for (const line of lines) {
      signal.throwIfAborted();
      const actor = narrator(line, voice);
      if (!styles.has(line.by)) styles.set(line.by, await resolveStyle(actor, options));
      const query = await queryLine(line, lexicon, { speaker: styles.get(line.by), core_version: CORE_VERSION }, options);
      for (const speed of speeds ?? [line.speed]) {
        const current = { ...query, ...SETTINGS, speedScale: Number(speedKey(speed)) };
        const timing = queryTiming(current);
        yield { clipId: line.clipId, lineId: line.lineId, by: line.by, speaker: actor.speaker, style: actor.style,
          source: line.source, lexicon: lineLexicon(line.source, lexicon),
          duration: timing.duration, query: current };
      }
    }
  } finally { await engine.stop(); }
}

export function formatInspection(result) {
  const { query } = result;
  const n = value => value == null ? '—' : value.toFixed(6);
  const rows = [
    `${result.clipId}/${result.lineId}\t${result.by} (${result.speaker} / ${result.style})\t話速=${query.speedScale}`,
    `読み（カナ）: ${query.kana}`,
    '長さは long 適用後・話速適用前の秒。高さは Engine の pitch 値。',
    '句\taccent（下がり目の直前の拍）\t拍番号\t拍\t高さ\t子音の長さ\t母音の長さ',
  ];
  query.accent_phrases.forEach((phrase, i) => {
    phrase.moras.forEach((mora, j) => rows.push(`${i + 1}\t${phrase.accent}\t${j + 1}\t${mora.text}\t${n(mora.pitch)}\t${n(mora.consonant_length)}\t${n(mora.vowel_length)}`));
    if (phrase.pause_mora) rows.push(`${i + 1}\t—\t—\t間\t—\t—\t${n(phrase.pause_mora.vowel_length)}`);
  });
  rows.push(`話速適用後の長さ（前後の無音・疑問上昇を含む）: ${n(result.duration)}秒`);
  return rows.join('\n');
}
