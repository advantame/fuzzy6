// Words whose reading and accent are fixed for the whole deck (spec §7.3). Only the narration
// tool reads this. Each entry records who asked for it; the notes are in ../README.md.
export default [
  // 2026-10-11, the Boss on 1-1: start low, rise at ト, stay high.
  { word: 'ChatGPT', kana: 'チャットジーピーティー', accent: 'flat' },
  // 2026-10-11, the Boss on 1-1: do not drop, and the long vowel was too weak (heard as 鶴).
  { word: 'ツール', kana: 'ツール', accent: 'flat', long: 1.4, type: 'common', priority: 8 },
];
