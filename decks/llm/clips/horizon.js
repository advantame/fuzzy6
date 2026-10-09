// METR's time horizon: how long a task (timed by human experts) an AI agent completes half
// the time. One model's success curve comes first; its 50% point drops onto the length axis,
// the axis stands up, and the same length becomes a point on a chart of models by date. The
// March 2025 paper's points and their 7-month doubling, then later results from METR's
// revised task suite (TH1.1), drawn as a separate series — the two are not one curve.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { text, measure, circle, line, path } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outCubic, outBack } from '../../../src/kit/ease.js';

// ——— the length axis: 1 s to 16 h on a log scale, ticks ×4 apart as on METR's charts
const LOG_TOP = Math.log10(16 * 3600);
const TICKS = [
  [1, '1 秒'], [4, '4 秒'], [15, '15 秒'], [60, '1 分'], [240, '4 分'],
  [900, '15 分'], [3600, '1 時間'], [14400, '4 時間'], [57600, '16 時間'],
];
const u = (sec) => Math.log10(sec) / LOG_TOP; // 0–1 along the axis

// first picture: the axis lies along the bottom with a success curve above it
const A = { x: 250, y: 700, len: 1240, top: 250 };
// the chart: the axis stands at the left and dates run along the bottom
const B = { x: 250, y: 760, len: 592, right: 1250, from: 2019, to: 2026.5 };
const COL = 1290; // labels for the crowded upper right
const yA = (p) => A.y - p * (A.y - A.top);
const xOf = (date) => B.x + ((date - B.from) / (B.to - B.from)) * (B.right - B.x);
const yOf = (sec) => B.y - u(sec) * B.len;
const ym = (y, m, d) => y + (m - 1) / 12 + (d - 1) / 365;

// Figure 5 of the March 2025 paper: values as printed there, model dates as on METR's chart
const PAPER = [
  { name: 'GPT-2', date: ym(2019, 2, 14), sec: 2, value: '2 秒' },
  { name: 'GPT-3', date: ym(2020, 5, 28), sec: 9, value: '9 秒' },
  { name: 'GPT-3.5', date: ym(2022, 3, 15), sec: 36, value: '36 秒' },
  { name: 'GPT-4', date: ym(2023, 3, 14), sec: 5 * 60, value: '5 分' },
  { date: ym(2023, 11, 6), sec: 8 * 60 }, // GPT-4 1106
  { date: ym(2024, 6, 20), sec: 18 * 60 }, // Claude 3.5 Sonnet
  { date: ym(2024, 9, 12), sec: 22 * 60 }, // o1-preview
  { date: ym(2024, 10, 22), sec: 28 * 60 }, // Claude 3.5 Sonnet (new)
  { date: ym(2024, 12, 5), sec: 39 * 60 }, // o1
  { name: 'Claude 3.7 Sonnet', date: ym(2025, 2, 24), sec: 59 * 60, value: '59 分' },
];
const HERO = PAPER[PAPER.length - 1];
// The revised suite (TH1.1): METR's dashboard values after its March 2026 correction
const LATER = [
  { name: 'GPT-5', date: ym(2025, 8, 7), sec: 203.01 * 60, value: '3 時間 23 分', y: 334 },
  { name: 'Claude Opus 4.5', date: ym(2025, 11, 24), sec: 292.99 * 60, value: '4 時間 53 分', y: 262 },
  { name: 'Claude Opus 4.6', date: ym(2026, 2, 5), sec: 718.81 * 60, value: '約 12 時間', y: 190 },
];
const HERO_Y = 406; // the hero's label in the column, below the later ones

// The success curve of the first picture: a logistic in log length through 50% at 59 min.
// Its steepness is illustrative (the 例 tag says so); the 59 minutes is the paper's.
const success = (lg) => 1 / (1 + Math.pow(10, 0.8 * (lg - Math.log10(HERO.sec))));

// The paper's trend, a doubling every 212 days, laid through these points (the slope is the
// paper's; the height is the mean of the points shown).
const SLOPE = Math.log10(2) / (212 / 365.25); // decades per year
const mean = (f) => PAPER.reduce((n, p) => n + f(p), 0) / PAPER.length;
const LIFT = mean((p) => Math.log10(p.sec)) - SLOPE * mean((p) => p.date);
const trendY = (date) => B.y - ((LIFT + SLOPE * date) / LOG_TOP) * B.len;

const DROP = 4.4; // the 50% point drops onto the axis
const TURN = 5.4; // the axis stands up
const CHART = 6.6; // dates run along the bottom
const TREND = 9.4;
const LATE = 11.2;

// The length axis at turn r (0 lying, 1 standing): where a length sits, and the side its
// labels go (below the axis while it lies, left of it once it stands).
function axisAt(r) {
  const a = (-Math.PI / 2) * r;
  const len = lerp(A.len, B.len, r);
  const ox = lerp(A.x, B.x, r);
  const oy = lerp(A.y, B.y, r);
  return {
    at: (sec) => [ox + Math.cos(a) * len * u(sec), oy + Math.sin(a) * len * u(sec)],
    o: [ox, oy],
    end: [ox + Math.cos(a) * len, oy + Math.sin(a) * len],
    n: [Math.sin(a), Math.cos(a)],
  };
}

const NAME = F.sans(600, 20);
const VALUE = F.cond(700, 28);

// A model's name and value on one line, on a patch of paper so the lines behind stay clear.
function pair(ctx, x, y, name, value, a) {
  if (a <= 0) return;
  const nw = measure(ctx, NAME, name);
  const vw = measure(ctx, VALUE, value);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = C.paper;
  ctx.fillRect(x - 6, y - 26, nw + vw + 22, 32);
  ctx.restore();
  text(ctx, name, x, y, { font: NAME, color: C.ink2, alpha: a });
  text(ctx, value, x + nw + 10, y, { font: VALUE, color: C.ink, alpha: a });
}

// Paper under a block of text, so the chart's lines do not run through it.
function patch(ctx, x, y, w, h, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = C.paper;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// A label in the right-hand column, joined to its point by a leader.
function tagged(ctx, x, y, r, ly, name, value, color, a) {
  if (a <= 0) return;
  const ang = Math.atan2(ly - 7 - y, COL - 12 - x);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = a;
  line(ctx, x + Math.cos(ang) * (r + 5), y + Math.sin(ang) * (r + 5), COL - 12, ly - 7, a);
  ctx.globalAlpha = 1;
  text(ctx, name, COL, ly, { font: NAME, color: C.ink, alpha: a });
  text(ctx, value, COL, ly + 38, { font: F.cond(700, 36), color, alpha: a });
}

export default clip({
  id: 'horizon',
  title: '任せられる長さ',
  kicker: 'タイムホライズン（METR）',
  duration: 17,
  grid: false,
  cues: [
    { at: 0.4, to: 5.8, text: '人の専門家なら何分かかる課題を、AI が半分の確率でこなせるか。\nMETR は、この長さを測った。' },
    { at: 6.0, to: 11.0, text: '2019 年の GPT-2 は 2 秒、2025 年 2 月の Claude 3.7 Sonnet は 59 分。\n約 7 か月ごとに 2 倍になってきた。' },
    { at: 11.2, to: 18, text: '改訂した課題集では、2026 年 2 月の Claude Opus 4.6 が約 12 時間。\n2024 年以降に限ると、2 倍になる間隔は 3〜4 か月。' },
  ],

  prepare() {
    const curve = [];
    for (let i = 0; i <= 120; i++) {
      const lg = (i / 120) * LOG_TOP;
      curve.push([A.x + (lg / LOG_TOP) * A.len, yA(success(lg))]);
    }
    return { curve };
  },

  draw(ctx, t, s) {
    const r = inOutCubic(seg(t, TURN, TURN + 1.2));
    const ax = axisAt(r);
    const first = 1 - seg(t, TURN - 0.5, TURN + 0.1); // the first picture leaves as the axis turns
    const heroX = A.x + u(HERO.sec) * A.len;

    // ——— first picture: one model's success rate by task length
    if (first > 0) {
      const sa = tw(t, 0.5, 0.6) * first;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.globalAlpha = sa;
      line(ctx, A.x, A.y, A.x, A.top);
      ctx.globalAlpha = 1;
      for (const [p, label] of [[0, '0%'], [0.5, '50%'], [1, '100%']]) {
        text(ctx, label, A.x - 16, yA(p) + 6, { font: F.mono(500, 18), color: C.muted, align: 'right', alpha: sa });
      }
      text(ctx, `${HERO.name} の成功率`, A.x, A.top - 44, { font: F.jp(700, 28), color: C.ink, alpha: sa });

      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.globalAlpha = tw(t, 2.0, 0.6) * first;
      line(ctx, A.x, yA(0.5), A.x + A.len, yA(0.5));
      ctx.restore();

      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 4;
      ctx.globalAlpha = first;
      path(ctx, s.curve, outCubic(seg(t, 0.8, 2.4)));
      ctx.globalAlpha = 1;

      // the drop from the crossing to the axis
      const drop = inOutCubic(seg(t, DROP, DROP + 0.6));
      if (drop > 0) {
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2;
        ctx.globalAlpha = first;
        line(ctx, heroX, yA(0.5), heroX, lerp(yA(0.5), A.y, drop));
        ctx.restore();
      }
      const la = tw(t, 2.7, 0.5) * (1 - seg(t, DROP - 0.3, DROP));
      text(ctx, '成功率が半分になる長さ', heroX + 28, yA(0.5) - 74, { font: F.jp(500, 22), color: C.ink2, alpha: la });
      text(ctx, HERO.value, heroX + 26, yA(0.5) - 14, { font: F.cond(700, 64), color: C.accent, alpha: la });
      example(ctx, M.l, 812, tw(t, 1.2, 0.5) * first, '曲線の形は模式図');
    }

    // ——— chart: faint lines at each length, dates along the bottom
    const grid = tw(t, TURN + 1.0, 0.6);
    if (grid > 0) {
      ctx.fillStyle = C.rule;
      ctx.globalAlpha = grid * 0.6;
      for (const [sec] of TICKS.slice(1)) ctx.fillRect(B.x, yOf(sec) - 0.75, B.right - B.x, 1.5);
      ctx.globalAlpha = 1;
    }
    const dates = seg(t, CHART, CHART + 0.8);
    if (dates > 0) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      line(ctx, B.x, B.y, B.right, B.y, outCubic(dates));
      for (let yr = 2019; yr <= 2026; yr++) {
        const a = tw(t, CHART + 0.1 + (yr - 2019) * 0.07, 0.4);
        ctx.globalAlpha = a;
        line(ctx, xOf(yr), B.y, xOf(yr), B.y + 10);
        ctx.globalAlpha = 1;
        text(ctx, String(yr), xOf(yr), B.y + 38, { font: F.mono(500, 18), color: C.muted, align: 'center', alpha: a });
      }
    }

    // the 16-hour ceiling of the suite
    const ceil = tw(t, LATE + 1.8, 0.6);
    if (ceil > 0) {
      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      line(ctx, B.x, yOf(57600), B.right, yOf(57600), ceil);
      ctx.restore();
      text(ctx, '16 時間を超える値は、この課題集では信頼できない', B.x + 14, yOf(57600) - 12, { font: F.jp(400, 18), color: C.ink2, alpha: ceil });
    }

    // ——— the length axis, lying, turning, standing
    const axA = tw(t, 0.2, 0.6);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    line(ctx, ax.o[0], ax.o[1], ax.end[0], ax.end[1], tw(t, 0.2, 0.9));
    TICKS.forEach(([sec, label], i) => {
      const [x, y] = ax.at(sec);
      const a = tw(t, 0.4 + i * 0.06, 0.4) * axA;
      ctx.globalAlpha = a;
      line(ctx, x, y, x + ax.n[0] * 10, y + ax.n[1] * 10);
      ctx.globalAlpha = 1;
      const font = F.jp(500, 19);
      const off = 18 + Math.abs(ax.n[0]) * (measure(ctx, font, label) / 2) + Math.abs(ax.n[1]) * 11;
      text(ctx, label, x + ax.n[0] * off, y + ax.n[1] * off, { font, color: C.muted, align: 'center', base: 'middle', alpha: a });
    });
    const axisName = '課題の長さ（人の専門家がかかる時間）';
    text(ctx, axisName, A.x + A.len / 2, A.y + 82, {
      font: F.jp(700, 22), color: C.ink, align: 'center', alpha: tw(t, 0.6, 0.6) * (1 - seg(t, TURN - 0.3, TURN + 0.2)),
    });
    text(ctx, axisName, M.l, 104, { font: F.jp(700, 22), color: C.ink, alpha: tw(t, TURN + 1.0, 0.6) });

    // ——— the paper's trend
    const tr = seg(t, TREND, TREND + 0.9);
    if (tr > 0) {
      const d0 = B.from;
      const d1 = ym(2025, 4, 1);
      ctx.save();
      ctx.setLineDash([14, 10]);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      line(ctx, xOf(d0), trendY(d0), xOf(d1), trendY(d1), outCubic(tr));
      ctx.restore();
    }

    // ——— the paper's points (the hero has been on stage since the first picture)
    let n = 0;
    for (const p of PAPER) {
      if (p === HERO) continue;
      const at = CHART + 1.2 + n++ * 0.2;
      const pop = outBack(seg(t, at, at + 0.35));
      if (pop <= 0) continue;
      ctx.fillStyle = p.name ? C.ink : C.ink2;
      circle(ctx, xOf(p.date), yOf(p.sec), (p.name ? 8 : 6.5) * pop);
      ctx.fill();
    }
    n = 0;
    for (const p of PAPER) {
      if (p === HERO) continue;
      const at = CHART + 1.2 + n++ * 0.2;
      if (p.name) pair(ctx, xOf(p.date) + 16, yOf(p.sec) + 30, p.name, p.value, tw(t, at + 0.15, 0.4));
    }
    // the 2024 models share one label
    const g = tw(t, CHART + 2.4, 0.4);
    if (g > 0) {
      const gx = xOf(ym(2024, 6, 20)) + 14;
      const gy = yOf(18 * 60) + 34;
      text(ctx, 'Claude 3.5 Sonnet、o1 など', gx, gy, { font: F.sans(600, 18), color: C.ink2, alpha: g });
      text(ctx, '18〜39 分', gx, gy + 30, { font: VALUE, color: C.ink, alpha: g });
    }

    // the hero: from the crossing, down to the axis, around with it, then out to its date
    const drop = inOutCubic(seg(t, DROP, DROP + 0.6));
    const ha = tw(t, 2.5, 0.4, (p) => outBack(p));
    let hx;
    let hy;
    if (t < TURN) {
      hx = heroX;
      hy = lerp(yA(0.5), A.y, drop);
    } else {
      [hx, hy] = ax.at(HERO.sec);
      hx = lerp(hx, xOf(HERO.date), inOutCubic(seg(t, CHART + 0.4, CHART + 1.2)));
    }
    if (ha > 0) {
      ctx.fillStyle = C.accent;
      circle(ctx, hx, hy, 10 * ha);
      ctx.fill();
    }
    tagged(ctx, hx, hy, 10, HERO_Y, HERO.name, HERO.value, C.accent, tw(t, CHART + 1.3, 0.5));

    // ——— later results from the revised suite, a separate series
    LATER.forEach((p, i) => {
      const at = LATE + 0.2 + i * 0.4;
      const pop = outBack(seg(t, at, at + 0.35));
      if (pop <= 0) return;
      const x = xOf(p.date);
      const y = yOf(p.sec);
      circle(ctx, x, y, 8 * pop);
      ctx.fillStyle = C.paper;
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.stroke();
      tagged(ctx, x, y, 8, p.y, p.name, p.value, C.blue, tw(t, at + 0.15, 0.5));
    });

    // ——— legend, top right
    const l1 = tw(t, CHART + 1.2, 0.5);
    ctx.globalAlpha = l1;
    ctx.fillStyle = C.ink;
    circle(ctx, COL + 7, 97, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    text(ctx, '2025 年 3 月の論文', COL + 24, 104, { font: F.jp(500, 18), color: C.ink2, alpha: l1 });
    const l2 = tw(t, LATE, 0.5);
    if (l2 > 0) {
      ctx.globalAlpha = l2;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      circle(ctx, COL + 7, 131, 6);
      ctx.stroke();
      ctx.globalAlpha = 1;
      text(ctx, '改訂した課題集（2026）', COL + 24, 138, { font: F.jp(500, 18), color: C.ink2, alpha: l2 });
    }

    // ——— the doubling times
    const d1 = tw(t, TREND + 0.5, 0.6);
    if (d1 > 0) {
      patch(ctx, B.x + 2, 176, 808 - B.x, 136, d1);
      const w = text(ctx, '7 か月', 300, 262 + (1 - d1) * 16, { font: F.cond(700, 104), color: C.accent, alpha: d1, ls: -1 });
      text(ctx, 'ごとに 2 倍', 300 + w + 14, 260, { font: F.jp(700, 32), color: C.ink, alpha: d1 });
      text(ctx, '2019〜2025 年の傾き（2025 年 3 月の論文）', 302, 300, { font: F.jp(400, 19), color: C.muted, alpha: tw(t, TREND + 0.8, 0.5) });
    }
    const d2 = tw(t, LATE + 2.4, 0.6);
    if (d2 > 0) {
      patch(ctx, B.x + 2, 340, 748 - B.x, 144, d2);
      text(ctx, '2024 年以降に限ると', 302, 364, { font: F.jp(500, 22), color: C.ink2, alpha: d2 });
      const w = text(ctx, '3〜4 か月', 300, 436 + (1 - d2) * 12, { font: F.cond(700, 72), color: C.ink, alpha: d2, ls: -1 });
      text(ctx, 'ごとに 2 倍', 300 + w + 12, 434, { font: F.jp(700, 26), color: C.ink, alpha: d2 });
      text(ctx, 'METR の推定は 89〜118 日（2025〜26 年）', 302, 472, { font: F.jp(400, 19), color: C.muted, alpha: tw(t, LATE + 2.7, 0.5) });
    }

    text(ctx, 'AI が動き続けられる時間ではない。課題は主にソフトウェアの作業。', M.l, 846, {
      font: F.jp(400, 18), color: C.muted, alpha: tw(t, LATE + 3.0, 0.6),
    });
    source(ctx, 'METR: Kwa ほか（2025）、Time Horizon 1.1（2026）', tw(t, CHART + 1.0, 0.6));
  },
});
