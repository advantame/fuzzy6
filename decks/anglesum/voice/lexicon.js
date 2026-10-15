// Words whose reading and accent are fixed for the whole deck (spec §7.3). Only the narration
// tool reads this. Each entry records who asked for it; the notes are in ../README.md.
export default [
  // 原稿に [偶関数|グウカンスウ] と書くと、エンジンが「グウ／カン／スウ」と三つの句に切った（2026-10-15）。
  // 「関数」と同じく「カ」で下がる形にした。最後に決めるのは、聞いたボス。
  { word: '偶関数', kana: 'グウカンスウ', accent: 3, type: 'common' },
];
