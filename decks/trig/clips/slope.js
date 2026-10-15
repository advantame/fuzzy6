// 1-10, exercise 4: from a ratio back to an angle. A road sign says 10%: 10 m up for 100 m
// across, so tan θ = 0.1; the table puts θ between 5° and 6°, a calculator says about 5.7°.
// "10%" is a ratio, not an angle. Last, ずんだもん opens the angle further: past 90° there is no
// right triangle — what is the sine of a bigger angle? (chapter 2's question)

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { seg, tw, inOutCubic, outBack, clamp, lerp } from '../../../src/kit/ease.js';
import { text } from '../../../src/kit/draw.js';
import { focus, ringBox } from '../../../src/kit/cue.js';
import { segment } from '../../../src/kit/place.js';
import { corners, drawTri, angleAt, angleArc, dim, RAD } from '../lib/tri.js';
import { cursive } from '../lib/cursive.js';
import { math, row, jp, frac, tex, shade } from '../lib/math.js';
import { trigTable } from '../lib/table.js';
import { cornerMemo, tab, example, workLine } from '../lib/drill.js';
import { mark } from '../lib/scene.js';

const PX = 9; // px a metre
const S = corners((Math.atan(0.1) * 180) / Math.PI, 100 * PX, { x: 150, y: 700 });
const ROWS = Array.from({ length: 10 }, (_, i) => i + 1);
const TABLE = { x: 1180, y: 250 };

const script = [
  { id: 'q1', by: 'metan', label: '最後の問題', text: '最後の問題よ。{sign}上り坂を知らせる標識に、[「10%」|ジュッパーセント]と書かれているのを、見たことはあるかしら。' },
  { id: 'q2', by: 'metan', label: '10 m 上がる', text: 'これは、{run}水平の距離 100 メートルに対して、{rise}10 メートル高くなる、という傾きを表しているわ。' },
  { id: 'q3', by: 'metan', label: '角度を求める', rest: 'short', text: '{ask}この上り坂の角度を求めなさい。' },
  { id: 'a1', label: 'tan θ = 0.1', text: '高さと底辺だから、{t}[t|ティー] の形なのだ。{tv}[tan θ|タンジェントシータ] は、10 割る 100 で、[0.1|レイテンイチ] なのだ。' },
  { id: 'a2', label: '表から探す', text: 'あとは、{find}[tan|タンジェント] が [0.1|レイテンイチ] になる角度を、表から探せばいいのだ。' },
  { id: 'a3', label: '6 度近く', text: '{t5}[tan 5°|タンジェントゴド] はおよそ [0.087|レイテンレイハチナナ]、{t6}[tan 6°|タンジェントロクド] はおよそ [0.105|レイテンイチレイゴ] だから……{near6}6 度近くなのだ。' },
  { id: 'a4', label: '6 度もない', text: '……え、{pct}[10%|ジュッパーセント] なのに、{small}6 度もないのだ？' },
  { id: 'm1', by: 'metan', label: '% は比', text: 'そうよ。{notang}[「10%」|ジュッパーセント]は角度ではなく、{ratio}高さを水平の距離で割った比を、百分率で表した数なの。' },
  { id: 'm2', by: 'metan', label: '約 5.7°', text: '関数電卓を使えば、{calc}比の[値|あたい]から角度も求められるわ。計算すると、{v57}およそ [5.7|ゴテンナナ] 度よ。' },
  { id: 'a5', label: '行き来できる', text: '{both}角度から比も、{back}比から角度も、求められるようになったのだ！' },
  { id: 'a6', label: '90° より大きい角', lead: 0.6, tail: 1.2, text: '……でも、{under}直角三角形の角は、90 度より小さいのだ。{more}もっと大きい角の [sin|サイン] は、どうなるのだ？' },
];

export default clip({
  id: 'slope',
  title: '坂道の角度',
  kicker: '演習 4',
  cast: ['metan', 'zunda'],
  script,

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const away = 1 - tw(t, at('a6'), 0.6);
    const tLit = focus(t, [at('t')], at('a1.end'), cue).level[0];
    cornerMemo(ctx, { lit: tLit > 0.5 ? 't' : null, alpha: away });
    tab(ctx, 4, 1, away);

    // the sign, then the slope it stands for
    const signA = tw(t, at('sign') - lead, 0.5, outBack);
    const toCorner = inOutCubic(seg(t, at('run') - 0.4, at('run') + 0.4));
    sign(ctx, lerp(560, 230, toCorner), lerp(420, 300, toCorner), lerp(130, 70, toCorner), clamp(signA) * away);
    example(ctx, 330, 270, tw(t, at('run'), 0.5) * away, '数値は例');

    const run = seg(t, at('run') - 0.1, at('run') + 0.7);
    const rise = seg(t, at('rise') - 0.1, at('rise') + 0.5);
    ctx.save();
    ctx.globalAlpha *= away;
    drawTri(ctx, S, { lw: 5, base: { p: run }, height: { p: rise }, hyp: { p: seg(t, at('ask') - 0.2, at('ask') + 0.5) }, right: rise, alpha: tw(t, at('run') - 0.2, 0.3) });
    dim(ctx, S.A, S.C, { x: 0, y: 1 }, 40, '水平に 100 m', { p: run, size: 28, color: C.cos, labelColor: C.cos });
    dim(ctx, S.C, S.B, { x: 1, y: 0 }, 40, '10 m', { p: rise, size: 28, color: C.sin, labelColor: C.sin });
    const v57 = tw(t, at('v57') - lead, 0.5, outBack);
    const angle = angleAt(ctx, S, 'A', { r: 300, label: v57 > 0.5 ? '約 5.7°' : 'θ', size: 30, alpha: tw(t, at('ask') - lead, 0.5), color: v57 > 0.5 ? C.accent : C.ink });
    cursive(ctx, S, 't', seg(t, at('t') - 0.1, at('t') + 1.1), { lw: 6, numbers: 0, alpha: 1 - 0.8 * tw(t, at('a1.end'), 0.6) });
    ringBox(ctx, angle, focus(t, [at('small')], at('a4.end'), cue).level[0], C.accent, 10);

    // the working
    workLine(ctx, row('tan', 'θ', '=', frac('10', '100'), '=', '0.1'), 150, 450, tw(t, at('tv') - lead, 0.5), { size: 42 });
    // m2: how a calculator does it
    text(ctx, '角度は、関数電卓の tan⁻¹ で（角度の単位は「度」に設定）', 150, 524, { font: F.jp(500, 22), color: C.muted, alpha: tw(t, at('calc') - lead, 0.5) });
    // m1: what each number is
    const notang = tw(t, at('notang') - lead, 0.5);
    if (notang > 0) {
      // 10% = 高さ / 水平の距離 × 100, the ratio coming in after the 10%; and beside it, which
      // one is the angle
      const r = tw(t, at('ratio') - lead, 0.5);
      const pct = math(ctx, row(tex('\\mathbf{10\\%}'), shade(r, '='), shade(r, frac(jp('高さ', C.sin), jp('水平の距離', C.cos))), shade(r, '×'), shade(r, '100')), 150, 600, { size: 38, alpha: notang });
      math(ctx, row('θ', '=', jp('角度')), pct.x + pct.w + 56, 600, { size: 34, color: C.ink2, alpha: notang });
    }
    // a5: both ways
    const both = tw(t, at('both') - lead, 0.5);
    const back = tw(t, at('back') - lead, 0.5);
    if (both > 0) {
      text(ctx, '角度 → 比', 760, 452, { font: F.jp(700, 32), color: C.ink, alpha: both });
      text(ctx, '比 → 角度', 760, 500, { font: F.jp(700, 32), color: C.accent, alpha: back });
    }
    ctx.restore();

    // the table, searched from the top for 0.1
    const tbl = tw(t, at('find') - lead, 0.6) * away;
    const search = seg(t, at('find'), at('t5'));
    const hi5 = focus(t, [at('t5'), at('t6')], at('a3.end'), cue);
    const tb = trigTable(ctx, TABLE.x, TABLE.y, { rows: ROWS, cols: ['tan'], colW: 170, degW: 96, alpha: tbl, hi: { deg: hi5.level[1] > hi5.level[0] ? 6 : 5, col: 'tan', level: Math.max(...hi5.level) } });
    if (tbl > 0 && search > 0 && search < 1) {
      const r1 = tb.rowBox(1);
      const y = lerp(r1.y, tb.rowBox(5).y, search) + r1.h / 2;
      text(ctx, '0.1 →', TABLE.x - 16, y + 9, { font: F.sans(600, 26), color: C.accent, align: 'right', alpha: tbl });
    }
    const near = tw(t, at('near6') - lead, 0.5) * away;
    if (near > 0) {
      // left of the table, where the search pointer was: the right of the stage is too narrow
      const r6 = tb.rowBox(6);
      text(ctx, '0.1 はこのあいだ', r6.x - 18, r6.y + 8, { font: F.jp(700, 24), color: C.accent, align: 'right', alpha: near });
      ringBox(ctx, [tb.rowBox(5), r6], near, C.accent, 0);
    }

    // ——— a6: open the angle past 90°
    const open = tw(t, at('a6'), 0.6);
    if (open > 0) {
      const O = { x: 640, y: 720 };
      const R = 340;
      const phi = lerp(20, 125, inOutCubic(seg(t, at('under') - 0.3, at('more') + 1.2)));
      const rad = phi * RAD;
      const tip = { x: O.x + Math.cos(rad) * R, y: O.y - Math.sin(rad) * R };
      ctx.save();
      ctx.globalAlpha *= open;
      ctx.fillStyle = C.ink2;
      ctx.fillRect(O.x - 400, O.y, 800, 3);
      const ground = { x: O.x + 400, y: O.y };
      if (phi < 89.5) {
        const T = corners(phi, R * Math.cos(rad), { x: O.x, y: O.y });
        drawTri(ctx, T, { lw: 6 });
      } else {
        // no right triangle any more: the hypotenuse alone, dashed
        ctx.setLineDash([14, 10]);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(O.x, O.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      angleArc(ctx, O, ground, tip, { r: 70, label: `${Math.round(phi)}°`, size: 30, avoid: [segment({ x: O.x - 400, y: O.y }, ground, 3)] });
      ctx.restore();
      mark(ctx, tip.x - 40, tip.y - 50, '？', tw(t, at('more') + 0.4, 0.4, outBack) * open);
    }
  },
});

// The warning sign for a steep climb: a yellow diamond with a slope and the percentage.
function sign(ctx, x, y, r, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r, 0);
  ctx.closePath();
  ctx.fillStyle = '#f5c400';
  ctx.fill();
  ctx.lineWidth = r * 0.07;
  ctx.strokeStyle = '#151412';
  ctx.stroke();
  ctx.fillStyle = '#151412';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.3);
  ctx.lineTo(r * 0.5, r * 0.3);
  ctx.lineTo(r * 0.5, -r * 0.12);
  ctx.closePath();
  ctx.fill();
  // a road sign's lettering, not a formula: in the sans face
  text(ctx, '10%', 0, -r * 0.22, { font: F.cond(700, r * 0.36), color: '#151412', align: 'center' });
  ctx.restore();
}
