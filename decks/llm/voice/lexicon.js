// Words whose reading and accent are fixed for the whole deck (spec §7.3). Only the narration
// tool reads this. Each entry records who asked for it; the notes are in ../README.md.
export default [
  // 2026-10-11, the Boss on 1-1: start low, rise at ト, stay high.
  { word: 'ChatGPT', kana: 'チャットジーピーティー', accent: 'flat' },
  // 2026-10-11, the Boss on 1-1: do not drop, and the long vowel was too weak (heard as 鶴).
  { word: 'ツール', kana: 'ツール', accent: 'flat', long: 1.4, type: 'common', priority: 8 },
  // 2026-10-14, Claude from the reading of 1-2: the engine read ジュウナリ, and with the reading
  // written as かさなり it dropped after カ. The noun is flat. Not yet heard by the Boss.
  { word: '重なり', kana: 'カサナリ', accent: 'flat', type: 'common', priority: 8 },
  // 2026-10-15, Claude from the reading of chapter 3: the engine read GPT-3 as ジーピーティー、サン
  // with a pause at the hyphen, and the reading written out in katakana broke into three
  // phrases. The scripts write [GPT-3|ジーピーティースリー]; this keeps it one flat word, like
  // ChatGPT. Not yet heard by the Boss.
  { word: 'ジーピーティースリー', kana: 'ジーピーティースリー', accent: 'flat', priority: 8 },
  // The same for the other GPT names chapter 3 reads out ([GPT-4o|…], [GPT-4|…]), which the
  // engine read head-high (ジ'ーピーティーフォーオー).
  { word: 'ジーピーティーフォーオー', kana: 'ジーピーティーフォーオー', accent: 'flat', priority: 8 },
  { word: 'ジーピーティーフォー', kana: 'ジーピーティーフォー', accent: 'flat', priority: 8 },
];
