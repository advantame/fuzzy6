// Pace: the time variables every clip shares (spec §5.1). The engine reads the first group
// to build timelines and to move between stops; clips read the second through stage.pace.
// A deck overrides part of this with deck.pace; the tuning panel (spec §8.1) edits it live.

export const PACE = {
  voice: { speed: { slow: 1.1, normal: 1.3, fast: 1.5 }, cps: 6.3 },
  pre: 0.3,
  rest: { short: 0, normal: 0.3, long: 1.0 },
  land: 1.0,
  skip: 5,
  again: 1.0,
  end: 1.5,

  enter: 0.5,
  stagger: 0.08,
  ground: 1.0,
  cue: { lead: 0.15, rise: 0.25, fall: 0.4, scale: 1.06, dim: 0.4, stay: 'next', span: 1.2 },
};

// What the tuning panel shows, in this order. `key` is a path into PACE. Numbers get a range
// (min, max, step); `options` makes a select. The voice.speed fields list the takes of the
// current clip. A line picks its speed by name (spec §6.6).
export const PACE_FIELDS = [
  { group: '声' },
  { key: 'voice.speed.normal', label: '話速（基本）', options: 'takes' },
  { key: 'voice.speed.slow', label: '話速（ゆっくり）', hint: "文に speed: 'slow' と書いたとき", options: 'takes' },
  { key: 'voice.speed.fast', label: '話速（早口）', hint: "文に speed: 'fast' と書いたとき", options: 'takes' },
  { key: 'pre', label: '声の前', hint: '絵が出てから声が始まるまで', min: 0, max: 1.5, step: 0.05 },
  { group: '間' },
  { key: 'rest.short', label: '文の間（小）', min: 0, max: 2, step: 0.05 },
  { key: 'rest.normal', label: '文の間（中）', min: 0, max: 3, step: 0.1 },
  { key: 'rest.long', label: '文の間（大）', hint: "図ができたばかりの文に rest: 'long' と書いたとき", min: 0, max: 5, step: 0.1 },
  { key: 'land', label: '着地の間', hint: '静止点へ跳んでから動き出すまで', min: 0, max: 3, step: 0.1 },
  { key: 'end', label: '終わりの間', hint: '自動で次へ進むまで', min: 0, max: 6, step: 0.5 },
  { group: '入り' },
  { key: 'enter', label: '入り', hint: '一つの要素が出る時間', min: 0.1, max: 1.5, step: 0.05 },
  { key: 'stagger', label: 'ずらし', hint: '並んだ要素の時間差', min: 0, max: 0.5, step: 0.01 },
  { key: 'ground', label: '地の上限', hint: '文の頭で地を出し切るまで', min: 0.3, max: 3, step: 0.1 },
  { group: '強調' },
  { key: 'cue.lead', label: '先回り', hint: '声より先に強調を始める', min: 0, max: 0.6, step: 0.05 },
  { key: 'cue.rise', label: '立ち上がり', min: 0.05, max: 1, step: 0.05 },
  { key: 'cue.fall', label: '引き', min: 0.05, max: 1.5, step: 0.05 },
  { key: 'cue.scale', label: '持ち上げる倍率', min: 1, max: 1.3, step: 0.01 },
  { key: 'cue.dim', label: 'ほかの薄さ', hint: '1 で薄くしない', min: 0.1, max: 1, step: 0.05 },
  { key: 'cue.stay', label: '残し方', options: [['next', '次の強調まで'], ['phrase', '決まった長さ']] },
  { key: 'cue.span', label: '強調の長さ', hint: '残し方が「決まった長さ」のとき', min: 0.3, max: 4, step: 0.1 },
  { group: '操作' },
  { key: 'skip', label: '送りの幅', hint: 'これより遠い止まりへは跳ばずに送る', min: 2, max: 10, step: 1 },
  { key: 'again', label: '戻りの境', hint: '← でいまの止まりへ戻るか、一つ前か', min: 0.3, max: 2, step: 0.1 },
];
