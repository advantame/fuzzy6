import { CORE_VERSION, SETTINGS, narrator, queryTiming, speedKey, prefixMoraCount, anchorSeconds } from './core.mjs';
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

// Prefix queries locate moras; seconds always come from the complete, post-long query.
// Share requests for an anchor and a page boundary at the same speech offset.
export async function queryPositions(line, query, params, options) {
  const counts = new Map();
  const countAt = async (offset, label) => {
    if (counts.has(offset)) return counts.get(offset);
    const prefix = Array.from(line.source).slice(0, offset).join('');
    let count;
    try {
      if (!prefix) count = 0;
      else if (prefix === line.source) count = query.accent_phrases.reduce((n, p) => n + p.moras.length, 0);
      else count = prefixMoraCount(query, await request('/audio_query', {
        ...options, method: 'POST', params: { ...params, text: prefix },
      }));
    } catch (error) { throw new Error(`${line.clipId}/${line.lineId} ${label}: ${error.message}`); }
    counts.set(offset, count);
    return count;
  };
  const anchors = {};
  for (const anchor of line.anchors) anchors[anchor.name] = await countAt(anchor.offset, `{${anchor.name}}`);
  const pages = [];
  for (const [i, offset] of (line.pages ?? []).entries()) pages.push(await countAt(offset, `page ${i + 2}`));
  return { anchors, pages };
}

export function positionSeconds(query, counts) {
  return {
    anchors: Object.fromEntries(Object.entries(counts.anchors).map(([name, count]) => [name, anchorSeconds(query, count)])),
    ...(counts.pages.length ? { pages: counts.pages.map(count => anchorSeconds(query, count)) } : {}),
  };
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
      const params = { speaker: styles.get(line.by), core_version: CORE_VERSION };
      const query = await queryLine(line, lexicon, params, options);
      const counts = await queryPositions(line, query, params, options);
      for (const speed of speeds ?? [line.speed]) {
        const current = { ...query, ...SETTINGS, speedScale: Number(speedKey(speed)) };
        const timing = queryTiming(current);
        yield { clipId: line.clipId, lineId: line.lineId, by: line.by, speaker: actor.speaker, style: actor.style,
          source: line.source, lexicon: lineLexicon(line.source, lexicon),
          duration: timing.duration, ...positionSeconds(current, counts), query: current };
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
  if (result.pages?.length) rows.push(`字幕の替わり目（音声の頭からの秒）: ${result.pages.map(n).join(', ')}`);
  return rows.join('\n');
}
