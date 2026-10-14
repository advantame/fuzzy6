// 3-3: from a number to a list of numbers. A token's number is only a name tag: on the line of
// o200k_base's numbers, 犬 and 猫 are far apart and 猫 is nearer to 水. So the LLM keeps a table
// with one row per token and takes out the row for the number — a list of numbers (12,288 of
// them in GPT-3). Training sets the rows so that tokens of near meaning tend to get near lists;
// drawn on a plane, animals gather with animals. The analogy of 2013 (king − man + woman lands
// nearest to queen) is drawn in its own box: it comes from a study of word vectors, not from an
// LLM. The clip ends where 3-4 starts: one token's list does not yet know its neighbours.
// The table's values, the list and the map are examples; the token numbers are real.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, chip, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import { strip } from '../lib/inside.js';
import { text, rr, circle, arrow, line, quadPoints, path } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outCubic, outBack } from '../../../src/kit/ease.js';
import { enter, focus, dimmed, ring } from '../../../src/kit/cue.js';
import { hash2 } from '../../../src/kit/random.js';

// ——— the numbers are name tags (o200k_base, js-tiktoken 1.0.21)
const LINE = { x0: M.l + 10, x1: W - M.r - 10, y: 232, max: 200000 };
const TAGS = [
  { s: '水', id: 8936 },
  { s: '猫', id: 48091 },
  { s: '犬', id: 129581 },
];
const lineX = (id) => lerp(LINE.x0, LINE.x1, id / LINE.max);

// ——— the table: one row per token
const TB = { x: M.l, y: 336, rowH: 33, idW: 96, cell: 21, cols: 11 };
const ROWS = [0, 1, 2, null, 8936, null, 48091, null, 129581, null, 199997];
const CAT = 6; // the row of 猫
const rowY = (i) => TB.y + 40 + i * TB.rowH;
const VEC = ['0.21', '−1.37', '0.88', '0.05', '−0.62', '1.14', '−0.33', '0.70'];
const VX = TB.x + TB.idW + TB.cols * TB.cell + 90; // the list taken out

// ——— the map, drawn on a plane
const MAP = { x: 708, y: 300, w: W - M.r - 708, h: 532 };
const GROUPS = [
  { name: '動物', cx: 880, cy: 486, r: 100, words: [['猫', 894, 488], ['犬', 952, 446], ['馬', 822, 446], ['鳥', 840, 534]] },
  { name: '食べ物', cx: 1316, cy: 474, r: 106, words: [['パン', 1250, 454], ['りんご', 1348, 512], ['寿司', 1262, 530], ['ラーメン', 1330, 420]] },
  { name: '都市', cx: 900, cy: 734, r: 88, words: [['東京', 880, 716], ['大阪', 950, 756], ['パリ', 838, 772], ['ロンドン', 916, 682]] },
];
// the study of 2013, in its own box
const INSET = { x: 1110, y: 600, w: 380, h: 216 };
const AN = { man: [1190, 784], woman: [1350, 784], king: [1216, 716], queen: [1376, 716] };
const GUESS = [1369, 724]; // king − man + woman: near queen, not on it

export default clip({
  id: 'embedding',
  title: '意味を数の並びに',
  kicker: '埋め込み（ベクトル）',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'トークンの番号は、{tag}名札のようなものよ。\n番号が近いからといって、意味も近いわけではないの。' },
    { id: 'b', text: '{pair}「犬」と「猫」は似た意味なのに、\n番号は、ずいぶん離れているわね。' },
    { id: 'c', text: 'そこで LLM は、{table}大きな表を一つ持っていて、\n{row}番号ごとに、決まった数の並びを取り出すの。' },
    { id: 'c2', text: 'このように、トークンを数の並びで表すことを、\n{name}埋め込みと呼ぶわ。数の並びは、ベクトルとも呼ぶの。' },
    { id: 'd', still: true, text: '数の並びの長さは、モデルによって違うわ。\n{dim}[GPT-3|ジーピーティースリー] の最大のモデルでは、[12,288|いちまんにせんにひゃくはちじゅうはち] 個の数になるの。' },
    { id: 'e', text: 'この表の数は、学習の中で決まっていくわ。\nすると、{near}意味の関係が、数の並びにも表れてくることがあるの。' },
    { id: 'f', still: true, text: '{plane}平面に描いたイメージで見てみると、{g1}動物は動物、\n{g2}食べ物は食べ物で、近くに集まるわ。' },
    { id: 'q', by: 'zunda', text: '{ask}数の並びで、意味の関係まで表せるのだ？' },
    { id: 'h', text: '{eq}英語の単語の数の並びを調べた 2013 年の研究に、\nこんな計算があるの。' },
    { id: 'i', text: '{king}「王」から{man}「男」を引いて、{woman}「女」を足すと、\n{queen}いちばん近いのは「女王」になったのよ。' },
    { id: 'j', still: true, text: '{dir}言葉の関係が、数の並びの向きにも表れていた、ということね。' },
    { id: 'k', tail: 0.6, text: 'ただし、ここまでの数の並びは、{alone}トークン一つぶんのものよ。\n{ctx}前の言葉を見ないと、意味が決まらない言葉もあるわ。' },
  ],

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    strip(ctx, { alpha: enter(t, at('a'), pace), lit: [1] });

    // ——— the line of numbers, with three tokens on it
    const g = enter(t, at('a'), pace);
    text(ctx, 'GPT-4o の切り方での番号', LINE.x0, LINE.y - 98, { font: F.jp(700, 20), color: C.ink2, alpha: g });
    ctx.save();
    ctx.globalAlpha = g;
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 2;
    line(ctx, LINE.x0, LINE.y, LINE.x1, LINE.y, tw(t, at('a'), pace.ground, inOutCubic));
    [0, 50000, 100000, 150000, 200000].forEach((n) => {
      const x = lineX(n);
      line(ctx, x, LINE.y - 6, x, LINE.y + 6);
      text(ctx, n.toLocaleString('en-US'), x, LINE.y + 28, { font: F.mono(500, 15), color: C.muted, align: n === 0 ? 'left' : n === 200000 ? 'right' : 'center' });
    });
    ctx.restore();
    const pair = focus(t, [at('pair')], at('b.end') - cue.fall, cue);
    const tagLit = focus(t, [at('tag')], at('a.end') - cue.fall, cue).level[0];
    TAGS.forEach((tk, i) => {
      const x = lineX(tk.id);
      const a = enter(t, at('a'), pace, i + 1);
      const lit = i > 0 ? pair.level[0] : 0;
      const al = a * dimmed(lit, pair.any, cue);
      ctx.save();
      ctx.globalAlpha = al;
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      line(ctx, x, LINE.y - 18, x, LINE.y);
      ctx.fillStyle = lit > 0.5 ? C.accent : C.ink;
      circle(ctx, x, LINE.y, 6);
      ctx.fill();
      ctx.restore();
      chip(ctx, x - 26, LINE.y - 72, tk.s, { font: F.jp(700, 30), h: 50, padX: 13, fill: C.tints[i], alpha: al });
      text(ctx, String(tk.id), x + 36, LINE.y - 40, { font: F.mono(600, 18), color: tagLit > 0.5 ? C.accent : C.ink2, alpha: al });
    });
    if (pair.level[0] > 0) {
      const x0 = lineX(TAGS[1].id);
      const x1 = lineX(TAGS[2].id);
      ctx.save();
      ctx.globalAlpha = pair.level[0];
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 2.5;
      arrow(ctx, (x0 + x1) / 2, LINE.y + 52, x0 + 4, LINE.y + 52, 1, 11);
      arrow(ctx, (x0 + x1) / 2, LINE.y + 52, x1 - 4, LINE.y + 52, 1, 11);
      ctx.restore();
      text(ctx, '似た意味なのに、遠い', (x0 + x1) / 2, LINE.y + 82, { font: F.jp(700, 20), color: C.accent, align: 'center', alpha: pair.level[0] });
    }

    // ——— the table, one row per token
    const ta = enter(t, at('c'), pace);
    const rowLit = tw(t, at('row') - lead, cue.rise);
    text(ctx, '番号', TB.x + TB.idW - 14, TB.y + 16, { font: F.jp(700, 18), color: C.muted, align: 'right', alpha: ta });
    text(ctx, '数の並び（表の一行）', TB.x + TB.idW, TB.y + 16, { font: F.jp(700, 18), color: C.muted, alpha: ta });
    tag(ctx, TB.x + TB.idW + 196, TB.y - 8, '＝ 埋め込み（ベクトル）', { font: F.jp(700, 17), h: 32, padX: 12, fill: C.accent, color: '#fff', alpha: pop('name') });
    ROWS.forEach((id, i) => {
      const a = tw(t, at('c') - lead + i * 0.04, pace.enter);
      if (a <= 0) return;
      const y = rowY(i);
      if (id === null) {
        text(ctx, '⋮', TB.x + TB.idW - 30, y + 18, { font: F.sans(600, 18), color: C.muted, alpha: a });
        return;
      }
      const lit = i === CAT ? rowLit : 0;
      text(ctx, String(id), TB.x + TB.idW - 14, y + 17, { font: F.mono(500, 16), color: lit > 0.5 ? C.accent : C.ink2, align: 'right', alpha: a });
      for (let c = 0; c < TB.cols; c++) {
        const v = hash2(id + 7, c);
        ctx.save();
        ctx.globalAlpha = a * (0.15 + 0.75 * v);
        ctx.fillStyle = c === TB.cols - 1 ? C.rule : v > 0.5 ? C.ink : C.blue;
        ctx.fillRect(TB.x + TB.idW + c * TB.cell, y + 4, TB.cell - 3, TB.rowH - 10);
        ctx.restore();
      }
      text(ctx, '…', TB.x + TB.idW + TB.cols * TB.cell + 4, y + 18, { font: F.sans(600, 16), color: C.muted, alpha: a });
      if (lit > 0) ring(ctx, TB.x + 6, y + 1, TB.idW + TB.cols * TB.cell + 12, TB.rowH - 4, lit, C.accent, 8);
    });
    // 猫's number finds its row
    const find = tw(t, at('row') - lead, 0.6, outCubic);
    if (find > 0 && find < 1.01) {
      ctx.save();
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      const x = lineX(TAGS[1].id);
      const pts = quadPoints(x, LINE.y + 16, x - 120, rowY(CAT) - 120, TB.x + TB.idW + 40, rowY(CAT) - 4, 30);
      ctx.globalAlpha = 1 - seg(t, at('c.end'), at('c.end') + 0.5);
      path(ctx, pts, find);
      ctx.restore();
    }
    // the row, taken out as a list of numbers
    const out = tw(t, at('row') + 0.3, pace.enter);
    const alone = focus(t, [at('alone')], at('k.end') - cue.fall, cue).level[0];
    if (out > 0) {
      const y0 = rowY(0) - 6;
      const h = VEC.length * 34 + 44;
      ctx.save();
      ctx.globalAlpha = out;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(VX + 10, y0);
      ctx.lineTo(VX, y0);
      ctx.lineTo(VX, y0 + h);
      ctx.lineTo(VX + 10, y0 + h);
      ctx.moveTo(VX + 86, y0);
      ctx.lineTo(VX + 96, y0);
      ctx.lineTo(VX + 96, y0 + h);
      ctx.lineTo(VX + 86, y0 + h);
      ctx.stroke();
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      arrow(ctx, TB.x + TB.idW + TB.cols * TB.cell + 26, rowY(CAT) + 15, VX - 10, rowY(CAT) + 15, tw(t, at('row') + 0.1, 0.4, outCubic), 11);
      ctx.restore();
      chip(ctx, VX + 22, y0 - 58, '猫', { font: F.jp(700, 26), h: 44, padX: 12, fill: C.tints[1], alpha: out });
      VEC.forEach((v, k) => {
        text(ctx, v, VX + 84, y0 + 30 + k * 34, { font: F.mono(500, 20), color: C.ink, align: 'right', alpha: tw(t, at('row') + 0.4 + k * 0.05, 0.3) });
      });
      text(ctx, '⋮', VX + 60, y0 + 30 + VEC.length * 34, { font: F.sans(600, 20), color: C.ink, align: 'center', alpha: out });
      ring(ctx, VX - 4, y0 - 4, 104, h + 8, alone, C.accent, 10);
    }
    const dim = pop('dim');
    text(ctx, 'GPT-3（最大のモデル）', VX + 48, rowY(ROWS.length - 1) + 20, { font: F.jp(700, 16), color: C.ink2, align: 'center', alpha: dim });
    text(ctx, 'では 12,288 個', VX + 48, rowY(ROWS.length - 1) + 44, { font: F.jp(700, 20), color: C.ink, align: 'center', alpha: dim });
    example(ctx, TB.x, 834, ta, '表の値と数の並びは説明のための例');

    // ——— the map
    const ma = enter(t, at('e'), pace);
    if (ma > 0) {
      ctx.save();
      ctx.globalAlpha = ma;
      rr(ctx, MAP.x, MAP.y, MAP.w, MAP.h, 18);
      ctx.fillStyle = '#efebe1';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      const iw = tag(ctx, MAP.x + 20, MAP.y + 16, 'イメージ', { font: F.jp(700, 16), h: 28, padX: 10, stroke: C.muted, color: C.muted, alpha: ma });
      text(ctx, '実際は何千もの数。近さを平面に描いた', MAP.x + 30 + iw, MAP.y + 36, { font: F.jp(500, 17), color: C.muted, alpha: ma });
    }
    // 猫's list lands on the map
    const fly = seg(t, at('near') - lead, at('near') - lead + 1.0);
    if (fly > 0) {
      const [, x, y] = GROUPS[0].words[0];
      ctx.save();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 8]);
      ctx.globalAlpha = 1 - seg(t, at('f'), at('f') + 0.5);
      const end = path(ctx, quadPoints(VX + 100, rowY(2), (VX + x) / 2 + 40, MAP.y - 10, x, y, 40), inOutCubic(fly));
      ctx.restore();
      if (end && fly < 1) {
        ctx.fillStyle = C.accent;
        circle(ctx, end.x, end.y, 8);
        ctx.fill();
      }
      if (fly >= 1) {
        ctx.fillStyle = C.accent;
        circle(ctx, x, y, 7);
        ctx.fill();
        text(ctx, '猫', x + 14, y + 9, { font: F.jp(700, 26), color: C.accent });
      }
    }
    const groupAt = [at('g1'), at('g2'), at('g2') + 0.9];
    GROUPS.forEach((gr, gi) => {
      const ga = tw(t, groupAt[gi] - lead, 0.6);
      if (ga <= 0) return;
      ctx.save();
      ctx.globalAlpha = ga * 0.5;
      ctx.fillStyle = C.tints[[0, 4, 3][gi]];
      circle(ctx, gr.cx, gr.cy, gr.r * (0.85 + 0.15 * ga));
      ctx.fill();
      ctx.restore();
      text(ctx, gr.name, gr.cx, gr.cy - gr.r - 10, { font: F.jp(700, 21), color: C.ink2, align: 'center', alpha: ga });
      gr.words.forEach(([w, x, y], wi) => {
        if (gi === 0 && wi === 0) return; // 猫 came from its list
        const p = tw(t, groupAt[gi] - lead + 0.15 + wi * 0.08, 0.5, (q) => outBack(q, 2));
        if (p <= 0) return;
        ctx.fillStyle = C.ink;
        circle(ctx, x, y, 6.5 * Math.min(1.2, p));
        ctx.fill();
        text(ctx, w, x + 13, y + 9, { font: F.jp(500, 24), color: C.ink, alpha: Math.min(1, p) });
      });
    });

    // ——— the study of 2013, in its own box
    const ia = pop('eq');
    if (ia > 0) {
      ctx.save();
      ctx.globalAlpha = ia;
      rr(ctx, INSET.x, INSET.y, INSET.w, INSET.h, 14);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      text(ctx, '英語の単語の数の並び（ミコロフら、2013）', INSET.x + 18, INSET.y + 32, { font: F.jp(700, 16), color: C.ink2, alpha: ia });
      text(ctx, 'King − Man + Woman ≈ Queen', INSET.x + 18, INSET.y + 62, { font: F.sans(600, 20), color: C.ink, alpha: pop('queen') });
    }
    const dir = focus(t, [at('dir')], at('j.end') - cue.fall, cue).level[0];
    const pts = [['king', '王', at('king')], ['man', '男', at('man')], ['woman', '女', at('woman')], ['queen', '女王', at('queen')]];
    pts.forEach(([k, name, when]) => {
      const p = tw(t, when - lead, 0.45, (q) => outBack(q, 2));
      if (p <= 0) return;
      const [x, y] = AN[k];
      ctx.fillStyle = k === 'queen' ? C.accent : C.ink;
      circle(ctx, x, y, 6.5 * Math.min(1.2, p));
      ctx.fill();
      const right = k === 'woman' || k === 'queen';
      text(ctx, name, x + (right ? 14 : -14), y + 7, { font: F.jp(700, 20), color: k === 'queen' ? C.accent : C.ink, align: right ? 'left' : 'right', alpha: Math.min(1, p) });
    });
    // the computed point: from 王, by the step from 男 to 女
    const calc = tw(t, at('woman') - lead, 0.8, inOutCubic);
    if (calc > 0) {
      ctx.save();
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      line(ctx, AN.king[0] + 8, AN.king[1], lerp(AN.king[0] + 8, GUESS[0] - 8, calc), lerp(AN.king[1], GUESS[1], calc));
      ctx.restore();
      if (calc >= 1) {
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2.5;
        line(ctx, GUESS[0] - 6, GUESS[1] - 6, GUESS[0] + 6, GUESS[1] + 6);
        line(ctx, GUESS[0] - 6, GUESS[1] + 6, GUESS[0] + 6, GUESS[1] - 6);
      }
    }
    // the two steps point the same way
    const steps = Math.max(tw(t, at('dir') - lead, 0.6, inOutCubic), 0);
    if (steps > 0) {
      ctx.save();
      ctx.lineWidth = 3 + 1.5 * dir;
      ctx.strokeStyle = C.blue;
      ctx.fillStyle = C.blue;
      arrow(ctx, AN.man[0] + 10, AN.man[1], AN.woman[0] - 12, AN.woman[1], steps, 12);
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      arrow(ctx, AN.king[0] + 10, AN.king[1], AN.queen[0] - 12, AN.queen[1], steps, 12);
      ctx.restore();
    }

    // ——— one token's list does not know its neighbours yet
    const kq = pop('ctx');
    if (kq > 0) {
      chip(ctx, TB.x, 770, 'かける', { font: F.jp(700, 22), h: 40, padX: 12, fill: '#fff', stroke: C.ink2, alpha: kq });
      text(ctx, 'の意味は？　前の言葉を見ないと決まらない（3-4）', TB.x + 102, 797, { font: F.jp(700, 19), color: C.ink2, alpha: kq });
    }
    source(ctx, '番号は o200k_base。GPT-3 は Brown ほか（2020）、王と女王は Mikolov ほか（2013）', pop('dim'), SOURCE_RIGHT);
  },
});
