// The timeline 1948–2025: on a true scale the early ideas sit far apart and almost every
// event crowds into the last decade; the axis then zooms into 2017–2025 to read them.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { text, measure, line, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack } from '../../../src/kit/ease.js';

// at: position in years (month / 12); side: label above (-1) or below (+1); stem: length.
const EARLY = [
  { at: 1948.5, year: '1948', name: 'シャノン', note: '確率で英文を作る', side: -1, stem: 64 },
  { at: 1950.8, year: '1950', name: 'チューリング', note: '模倣ゲームを提案', side: 1, stem: 64 },
  { at: 1956.5, year: '1956', name: 'ダートマス会議', note: '「人工知能」を掲げた研究会', side: -1, stem: 176 },
  { at: 1966.0, year: '1966', name: 'ELIZA', note: '最初のチャットボット', side: 1, stem: 176 },
  { at: 2003.0, year: '2003', name: 'ニューラル言語モデル', note: 'ベンジオら', side: -1, stem: 64 },
  { at: 2013.0, year: '2013', name: 'word2vec', note: '単語をベクトルに', side: 1, stem: 64 },
];
const RECENT = [
  { at: 2017.45, year: '2017', name: 'Transformer', side: -1 },
  { at: 2018.6, year: '2018', name: 'GPT・BERT', side: 1 },
  { at: 2019.15, year: '2019', name: 'GPT-2', side: -1 },
  { at: 2020.4, year: '2020', name: 'GPT-3', side: 1 },
  { at: 2022.9, year: '2022', name: 'ChatGPT', side: -1, hot: true },
  { at: 2023.2, year: '2023', name: 'GPT-4・Claude・Llama', side: 1 },
  { at: 2024.75, year: '2024', name: '推論モデル・MCP', side: -1 },
  { at: 2025.15, year: '2025', name: 'コーディングエージェント', side: 1, stem: 168 },
];

const AXIS = 470;
const FULL = [1944, 2027];
const ZOOM = [2016.7, 2027.4];
const ZOOM_AT = 5.8;
const ZOOM_DUR = 2.0;

export default clip({
  id: 'timeline',
  title: '言語モデルの年表',
  kicker: '1948–2025',
  duration: 15.5,
  cues: [
    { at: 0.4, to: 5.6, text: '最初の手がかりは 1948 年。\nけれど出来事の多くは、最後の 10 年に集まっている。' },
    { at: 5.8, to: 10.8, text: '2017 年の Transformer から、GPT、ChatGPT へと一気に進んだ。' },
    { at: 11.0, to: 17, text: '2024 年からは、考えてから答えるモデルや、\nツールを使って動くエージェントが加わった。' },
  ],

  draw(ctx, t) {
    const z = inOutCubic(seg(t, ZOOM_AT, ZOOM_AT + ZOOM_DUR));
    const lo = lerp(FULL[0], ZOOM[0], z);
    const hi = lerp(FULL[1], ZOOM[1], z);
    const span = W - M.l - M.r;
    const X = (yr) => M.l + ((yr - lo) / (hi - lo)) * span;
    const pxYear = span / (hi - lo);

    // axis and year ticks (yearly ticks fade in as they get room)
    const grow = tw(t, 0.2, 1.2, inOutCubic);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    line(ctx, M.l, AXIS, W - M.r, AXIS, grow);
    for (let y = Math.ceil(lo); y <= Math.floor(hi); y++) {
      const x = X(y);
      if (x < M.l || x > W - M.r) continue;
      const decade = y % 10 === 0;
      const a = (decade ? 1 : Math.min(1, Math.max(0, (pxYear - 24) / 40))) * seg(grow, (x - M.l) / span - 0.02, (x - M.l) / span + 0.02);
      if (a <= 0) continue;
      ctx.fillStyle = C.ink;
      ctx.globalAlpha = a;
      ctx.fillRect(x - 1, AXIS - (decade ? 10 : 6), 2, decade ? 20 : 12);
      ctx.globalAlpha = 1;
      if (decade || pxYear > 60)
        text(ctx, String(y), x, AXIS + 36, { font: F.mono(500, 17), color: C.muted, align: 'center', alpha: a * (decade ? 1 : 0.85) });
    }

    // the crowded decade, marked before the zoom
    const band = tw(t, 3.9, 0.7) * (1 - seg(t, ZOOM_AT, ZOOM_AT + 0.6));
    if (band > 0) {
      const x0 = X(2017);
      const x1 = X(2025.4);
      ctx.fillStyle = C.accent;
      ctx.globalAlpha = band;
      ctx.fillRect(x0 - 6, AXIS - 7, x1 - x0 + 12, 14);
      text(ctx, '2017–2025', (x0 + x1) / 2, AXIS - 34, { font: F.mono(600, 20), color: C.accent, align: 'center' });
      ctx.globalAlpha = 1;
    }

    // early events: labelled on the full scale, pushed off the left edge by the zoom
    EARLY.forEach((e, i) => {
      const pop = tw(t, 1.0 + i * 0.42, 0.55, (p) => outBack(p, 2));
      const x = X(e.at);
      const gone = 1 - seg(t, ZOOM_AT, ZOOM_AT + 0.9);
      const a = Math.min(1, pop) * gone * (x < M.l - 4 ? 0 : 1);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      ctx.fillStyle = C.ink;
      circle(ctx, x, AXIS, 8 * pop);
      ctx.fill();
      label(ctx, x, e, a, tw(t, 1.1 + i * 0.42, 0.6));
      ctx.globalAlpha = 1;
    });

    // the recent cluster: dots from the start, labels once the axis has zoomed in
    RECENT.forEach((e, i) => {
      const x = X(e.at);
      const dotA = tw(t, 3.4 + i * 0.05, 0.4);
      if (dotA <= 0) return;
      ctx.fillStyle = e.hot ? C.accent : C.ink;
      circle(ctx, x, AXIS, lerp(4.5, e.hot ? 11 : 8, z));
      ctx.fill();
      const at = ZOOM_AT + ZOOM_DUR + 0.1 + i * 0.36;
      const a = tw(t, at, 0.5);
      if (a > 0) label(ctx, x, e, a, a, e.hot);
    });

    // where the zoomed axis came from
    const back = tw(t, ZOOM_AT + ZOOM_DUR - 0.2, 0.6);
    if (back > 0) text(ctx, '← 1948 年から', M.l, AXIS - 22, { font: F.jp(500, 19), color: C.muted, alpha: back });
  },
});

// A label on a flag pole: the pole rises from the axis along the label's edge, with the
// year, the name and an optional note beside it.
function label(ctx, x, e, a, grow, hot = false) {
  const side = e.side;
  const stem = (e.stem ?? 64) * grow;
  const lines = [
    [e.year, F.cond(700, 38), hot ? C.accent : C.ink],
    [e.name, F.jp(700, 23), C.ink],
    ...(e.note ? [[e.note, F.jp(400, 19), C.muted]] : []),
  ];
  const base = [32, 62, 89].slice(0, lines.length);
  const blockH = base[lines.length - 1] + 8;
  const top = side < 0 ? AXIS - 16 - stem - blockH : AXIS + 16 + stem;
  const w = Math.max(...lines.map(([str, f]) => measure(ctx, f, str)));
  const right = x + w + 14 > W - M.r;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = hot ? C.accent : C.ink2;
  ctx.lineWidth = 1.5;
  line(ctx, x, AXIS + side * 12, x, side < 0 ? top : top + blockH, 1);
  lines.forEach(([str, f, col], i) => {
    text(ctx, str, right ? x - 10 : x + 10, top + base[i], { font: f, color: col, align: right ? 'right' : 'left' });
  });
  ctx.restore();
}
