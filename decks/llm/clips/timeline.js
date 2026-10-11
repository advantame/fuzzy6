// The timeline 1948–2025: on a true scale the early ideas sit far apart and almost every
// event crowds into the last decade; the axis then zooms into 2017–2025 to read them.
//
// The first clip written with a narration script (spec §6.6). No time is a number of seconds
// from the head of the clip: the axis and the dots are the ground of sentence a and come in at
// its head, the band answers "the last ten years" when the voice says it, the zoom is the
// lead of sentence b, and the labels light up as they are named.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { text, measure, line, circle, scaled } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { focus, dimmed, lifted } from '../../../src/kit/cue.js';

// at: position in years (month / 12); side: label above (-1) or below (+1); stem: length;
// flip: text on the left of the pole; cue: the anchor of the script that lights this event.
const EARLY = [
  { at: 1948.5, year: '1948', name: 'シャノン', note: '確率で英文を作る', side: -1, stem: 64, cue: 'y48' },
  { at: 1950.8, year: '1950', name: 'チューリング', note: '模倣ゲームを提案', side: 1, stem: 64 },
  { at: 1956.5, year: '1956', name: 'ダートマス会議', note: '「人工知能」を掲げた研究会', side: -1, stem: 176 },
  { at: 1966.0, year: '1966', name: 'ELIZA', note: '最初のチャットボット', side: 1, stem: 176 },
  { at: 2003.0, year: '2003', name: 'ニューラル言語モデル', note: 'ベンジオら', side: -1, stem: 64 },
  { at: 2013.0, year: '2013', name: 'word2vec', note: '単語をベクトルに', side: 1, stem: 64 },
];
const RECENT = [
  { at: 2017.45, year: '2017', name: 'Transformer', side: -1, cue: 'tf' },
  { at: 2018.6, year: '2018', name: 'GPT・BERT', side: 1, cue: 'gpt' },
  { at: 2019.15, year: '2019', name: 'GPT-2', side: -1, cue: 'gpt' },
  { at: 2020.4, year: '2020', name: 'GPT-3', side: 1, cue: 'gpt' },
  { at: 2022.9, year: '2022', name: 'ChatGPT', side: -1, hot: true, cue: 'chat' },
  { at: 2023.2, year: '2023', name: 'GPT-4・Claude・Llama', side: 1, stem: 122, flip: true },
  { at: 2024.75, year: '2024', name: '推論モデル・MCP', side: -1, cue: 'y24' },
  { at: 2025.15, year: '2025', name: 'コーディングエージェント', side: 1, stem: 168, cue: 'agent' },
];

const AXIS = 470;
const FULL = [1944, 2027];
const ZOOM = [2016.7, 2027.4];
const ZOOM_DUR = 2.0; // the zoom is content: it is the lead of sentence b
const SECOND_DOT = 1.42; // the first two dots keep their old pace: they give the reading order

export default clip({
  id: 'timeline',
  title: '言語モデルの年表',
  kicker: '1948–2025',
  script: [
    {
      id: 'a',
      label: '1948 年から',
      still: true,
      text: '最初の手がかりは{y48} 1948 年。\n{but}けれど出来事の多くは、{band}最後の 10 年に集まっている。',
    },
    {
      id: 'b',
      label: '2017 年へ拡大',
      lead: ZOOM_DUR,
      still: true,
      text: '{tf}2017 年の Transformer から、{gpt}GPT、{chat}ChatGPT へと一気に進んだ。',
    },
    {
      id: 'c',
      label: '2024 年から',
      text: '{y24}2024 年からは、考えてから答えるモデルや、\n{agent}ツールを使って動くエージェントが加わった。',
    },
  ],

  draw(ctx, t, _, { at, pace }) {
    const a = at('a');
    const b = at('b');
    const cue = pace.cue;

    const z = inOutCubic(seg(t, b, b + ZOOM_DUR));
    const lo = lerp(FULL[0], ZOOM[0], z);
    const hi = lerp(FULL[1], ZOOM[1], z);
    const span = W - M.l - M.r;
    const X = (yr) => M.l + ((yr - lo) / (hi - lo)) * span;
    const pxYear = span / (hi - lo);

    // axis and year ticks (yearly ticks fade in as they get room)
    const grow = tw(t, a + 0.2, 1.0, inOutCubic);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    line(ctx, M.l, AXIS, W - M.r, AXIS, grow);
    for (let y = Math.ceil(lo); y <= Math.floor(hi); y++) {
      const x = X(y);
      if (x < M.l || x > W - M.r) continue;
      const decade = y % 10 === 0;
      const al = (decade ? 1 : Math.min(1, Math.max(0, (pxYear - 24) / 40))) * seg(grow, (x - M.l) / span - 0.02, (x - M.l) / span + 0.02);
      if (al <= 0) continue;
      ctx.fillStyle = C.ink;
      ctx.globalAlpha = al;
      ctx.fillRect(x - 1, AXIS - (decade ? 10 : 6), 2, decade ? 20 : 12);
      ctx.globalAlpha = 1;
      if (decade || pxYear > 60)
        text(ctx, String(y), x, AXIS + 36, { font: F.mono(500, 17), color: C.muted, align: 'center', alpha: al * (decade ? 1 : 0.85) });
    }

    // the crowded decade: the answer of sentence a, shown when the voice names it
    const band = tw(t, at('band') - cue.lead, pace.enter + 0.2) * (1 - seg(t, b, b + 0.6));
    if (band > 0) {
      const x0 = X(2017);
      const x1 = X(2025.4);
      ctx.fillStyle = C.accent;
      ctx.globalAlpha = band;
      ctx.fillRect(x0 - 6, AXIS - 7, x1 - x0 + 12, 14);
      text(ctx, '2017–2025', (x0 + x1) / 2, AXIS - 34, { font: F.mono(600, 20), color: C.accent, align: 'center' });
      ctx.globalAlpha = 1;
    }

    // early events: the ground of sentence a. The first two arrive one after the other, the
    // rest follow at the shared stagger. The zoom pushes them off the left edge.
    const first = focus(t, [at('y48')], at('but'), cue);
    const dotAt = (i) => a + (i < 2 ? 1.0 + i * (SECOND_DOT - 1.0) : SECOND_DOT + (i - 1) * pace.stagger);
    EARLY.forEach((e, i) => {
      const pop = tw(t, dotAt(i), pace.enter, (p) => outBack(p, 2));
      const x = X(e.at);
      const gone = 1 - seg(t, b, b + 0.9);
      const al = Math.min(1, pop) * gone * (x < M.l - 4 ? 0 : 1);
      if (al <= 0) return;
      const lit = e.cue ? first.level[0] : 0;
      ctx.globalAlpha = al;
      dot(ctx, x, 8 * pop, lit, false);
      label(ctx, x, e, al, tw(t, dotAt(i) + 0.1, pace.enter + 0.1), { lit, scale: lifted(lit, cue) });
      ctx.globalAlpha = 1;
    });

    // the recent cluster: dots from the start, labels once the axis has zoomed in. Sentences
    // b and c light the labels they name and dim the others while the voice is on them. The
    // light is gone by the end of the voice, so each still is the whole figure again.
    const fb = focus(t, [at('tf'), at('gpt'), at('chat')], at('b.end') - cue.fall, cue);
    const fc = focus(t, [at('y24'), at('agent')], at('c.end') - cue.fall, cue);
    const level = { tf: fb.level[0], gpt: fb.level[1], chat: fb.level[2], y24: fc.level[0], agent: fc.level[1] };
    const any = Math.max(fb.any, fc.any);
    RECENT.forEach((e, i) => {
      const x = X(e.at);
      const dotA = tw(t, dotAt(EARLY.length) + i * pace.stagger * 0.6, 0.4);
      if (dotA <= 0) return;
      const lit = e.cue ? level[e.cue] : 0;
      const vis = dimmed(lit, any, cue);
      ctx.globalAlpha = Math.min(1, dotA) * vis;
      dot(ctx, x, lerp(4.5, e.hot ? 11 : 8, z), lit, e.hot);
      ctx.globalAlpha = 1;
      const la = tw(t, b + ZOOM_DUR - 0.3 + i * pace.stagger, pace.enter);
      if (la > 0) label(ctx, x, e, la * vis, la, { hot: e.hot, lit, scale: lifted(lit, cue) });
    });

    // where the zoomed axis came from
    const back = tw(t, b + ZOOM_DUR - 0.2, 0.6);
    if (back > 0) text(ctx, '← 1948 年から', M.l, AXIS - 22, { font: F.jp(500, 19), color: C.muted, alpha: back });
  },
});

// A dot on the axis. A lit dot turns to the signal colour and grows a little.
function dot(ctx, x, r, lit, hot) {
  ctx.fillStyle = hot ? C.accent : C.ink;
  circle(ctx, x, AXIS, r + 3 * lit);
  ctx.fill();
  if (lit > 0 && !hot) {
    ctx.save();
    ctx.globalAlpha *= lit;
    ctx.fillStyle = C.accent;
    circle(ctx, x, AXIS, r + 3 * lit);
    ctx.fill();
    ctx.restore();
  }
}

// A label on a flag pole: the pole rises from the axis along the label's edge, with the
// year, the name and an optional note beside it. o.lit (0–1) turns the pole and the year to
// the signal colour; o.scale lifts the whole label about its foot on the axis.
function label(ctx, x, e, a, grow, o = {}) {
  const { hot = false, lit = 0, scale = 1 } = o;
  const side = e.side;
  const stem = (e.stem ?? 64) * grow;
  const lines = [
    [e.year, F.cond(700, 38), C.ink, true],
    [e.name, F.jp(700, 23), C.ink, false],
    ...(e.note ? [[e.note, F.jp(400, 19), C.muted, false]] : []),
  ];
  const base = [32, 62, 89].slice(0, lines.length);
  const blockH = base[lines.length - 1] + 8;
  const top = side < 0 ? AXIS - 16 - stem - blockH : AXIS + 16 + stem;
  const w = Math.max(...lines.map(([str, f]) => measure(ctx, f, str)));
  const right = e.flip || x + w + 14 > W - M.r;
  const signal = hot ? 1 : lit;
  ctx.save();
  ctx.globalAlpha *= a;
  scaled(ctx, scale, x, AXIS, () => {
    const pole = (color, alpha) => {
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 + lit;
      line(ctx, x, AXIS + side * 12, x, side < 0 ? top : top + blockH, 1);
      ctx.restore();
    };
    pole(C.ink2, 1 - signal);
    pole(C.accent, signal);
    lines.forEach(([str, f, col, isYear], i) => {
      const tx = right ? x - 10 : x + 10;
      const align = right ? 'right' : 'left';
      text(ctx, str, tx, top + base[i], { font: f, color: col, align });
      if (isYear && signal > 0) text(ctx, str, tx, top + base[i], { font: f, color: C.accent, align, alpha: signal });
    });
  });
  ctx.restore();
}
