import { parseLine } from '../../src/explorer/script.js';
import { readCast } from '../../src/explorer/cast.js';
import { collectClips } from './core.mjs';

// One clip per call: never carry sentence history across clip boundaries.
// Silent rows contribute no sentences; conditional rows stay in script order.
// Each pair retains both row IDs, even when both sentences belong to one row.
export function findEndings(script, { deckId, clipId, defaultBy } = {}) {
  const sentences = [];
  for (const line of script) {
    const plain = parseLine(line.text).plain;
    for (const match of plain.matchAll(/[^。？！]*[。？！]|[^。？！]+$/gu)) {
      const text = match[0].trim();
      if (text) sentences.push({ lineId: line.id, by: line.by ?? defaultBy, text });
    }
  }
  const adjacent = [], alternating = [];
  const endsInNo = sentence => sentence.text.endsWith('の。');
  const pair = (first, second) => ({ deckId, clipId, first, second });
  for (let i = 1; i < sentences.length; i++) {
    const first = sentences[i - 1], second = sentences[i];
    if (first.by !== second.by || !endsInNo(second)) continue;
    if (endsInNo(first)) adjacent.push(pair(first, second));
    else if (i >= 2) {
      const earlier = sentences[i - 2];
      if (earlier.by === second.by && endsInNo(earlier)) alternating.push(pair(earlier, second));
    }
  }
  return { adjacent, alternating };
}

// Inspect scripts directly, including speakers without synthesis settings.
export function deckEndings(deck, { deckId = deck.id, clips = [] } = {}) {
  const defaultBy = Object.keys(readCast(deck.voice))[0];
  const result = { adjacent: [], alternating: [] };
  for (const clip of collectClips(deck)) {
    if (clips.length && !clips.includes(clip.id)) continue;
    const found = findEndings(clip.script ?? [], { deckId, clipId: clip.id, defaultBy });
    result.adjacent.push(...found.adjacent);
    result.alternating.push(...found.alternating);
  }
  return result;
}

export function formatEnding({ deckId, clipId, first, second }) {
  return `${deckId}/${clipId}: ${first.lineId}「${first.text}」 → ${second.lineId}「${second.text}」`;
}
