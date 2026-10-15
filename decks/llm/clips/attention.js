// 3-4: looking around. かける means different things after 電話, 眼鏡 and 橋, and what decides it
// comes before it. Attention lets every token weigh the tokens before it (arcs, thicker = more)
// and mix what it finds into its own list of numbers, so the same かける comes out meaning
// something different in each line. ずんだもん asks about the words after it: an autoregressive
// LLM does not look at them. The order is known from position information.
// Below, the layer: looking around, then each token's list made over on its own; the pair is
// stacked dozens of times (96 in GPT-3), the shape of the Transformer of 2017.
// The weights are an example, drawn on words rather than tokens.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, chip, chipWidth, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import { strip, icon } from '../lib/inside.js';
import { text, rr, quadPoints, path, arrow, line, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outCubic } from '../../../src/kit/ease.js';
import { enter, focus, dimmed, ring, lifted } from '../../../src/kit/cue.js';

const ROWS = [
  { obj: '電話', means: '発信する', tint: '#cfe2ff', w: [0.7, 0.1, 0.2] },
  { obj: '眼鏡', means: '身につける', tint: '#cdebd5', w: [0.75, 0.08, 0.17] },
  { obj: '橋', means: '架け渡す', tint: '#ddd5ff', w: [0.68, 0.12, 0.2] },
];
const FONT = F.jp(500, 40);
const CH = 62;
const ROW_Y = [192, 334, 476];
const ARROW_X = 670; // where the arrows to the meanings start, clear of the space after かける
const X0 = M.l + 20;
const BOX_X = 1110;

// ——— the layer, below
const LY = 648; // top of the blocks
const LH = 148;
const BLOCK = { x: 290, w: 468, gap: 24 };
const SMALL = { w: 108 };

export default clip({
  id: 'attention',
  title: '前を見て決める',
  kicker: 'アテンション',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: '「かける」という言葉は、{tel}電話をかける、{gl}眼鏡をかける、\n{br}橋をかける、のように、いろいろな意味で使われるわね。' },
    { id: 'b', text: 'この三つでは、{before}前にある言葉が、\n意味を見分ける手がかりになるの。' },
    { id: 'c', text: 'ここで見る LLM にも、{att}前の言葉を参考にする、\nアテンションという計算があるわ。' },
    { id: 'd', text: 'トークンの一つ一つが、{look}自分と、それより前のトークンを、\n{weight}どれだけ参考にするかを、数で決めるのよ。' },
    { id: 'e', text: 'たとえば「かける」は、{w1}「電話」を強く参考にするわ。' },
    { id: 'e2', text: '{take}参考にする度合いに応じて、\nそれぞれの情報を、自分の数の並びに混ぜ込むの。' },
    { id: 'f', still: true, text: 'こうして、{mean}同じ「かける」でも、前の言葉に応じて、\n数の並びが変わっていくのよ。' },
    { id: 'g', by: 'zunda', text: '{ask}後ろにある言葉は、見ないのだ？' },
    { id: 'h', text: '自己回帰型 LLM では、{ahead}自分より後ろのトークンは、\n見ないように作られているの。' },
    { id: 'h2', text: '書いている途中では、{none}後ろは、まだ書かれていないものね。' },
    { id: 'i', still: true, text: '並び順もわかるように、{pos}トークンの位置の情報も、\n計算に使われているわ。' },
    { id: 'j', text: 'LLM の中では、{layer}この前を見る計算のあとに、\n{ffn}トークンごとに数の並びを作り変える計算が続くの。' },
    { id: 'k', text: '大きく分けると、この二つを{block}[一組|ひとくみ]にして、{stack}何十段も重ねるわ。\n[GPT-3|ジーピーティースリー] の最大のモデルでは、{n96}96 段あるのよ。' },
    { id: 'l', tail: 0.6, text: 'この形は、{tf}2017 年の Transformer で示されたものよ。\nいまの LLM の多くも、この考え方を受け継いでいるわ。' },
  ],

  prepare(ctx) {
    const rows = ROWS.map((r) => {
      const words = [r.obj, 'を', 'かける'];
      let x = X0;
      const pos = words.map((s) => {
        const w = chipWidth(ctx, s, { font: FONT, padX: 18 });
        const out = { s, x, w, c: x + w / 2 };
        x += w + 14;
        return out;
      });
      return { ...r, pos, end: x };
    });
    return { rows };
  },

  draw(ctx, t, { rows }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    strip(ctx, { alpha: enter(t, at('a'), pace), lit: [2] });

    const before = focus(t, [at('before')], at('b.end') - cue.fall, cue).level[0];
    const w1 = focus(t, [at('w1'), at('take')], at('e2.end') - cue.fall, cue);
    const e1 = Math.max(...w1.level);
    const mean = tw(t, at('mean') - lead, 0.7);
    const took = (i) => tw(t, (i === 0 ? at('take') : at('mean')) + i * 0.15, 0.6);
    const ahead = focus(t, [at('ahead')], at('h2.end') - cue.fall, cue).level[0];
    const posA = pop('pos');

    // the term, once named
    tag(ctx, W - M.r, 126, 'アテンション', { font: F.jp(700, 22), h: 40, padX: 16, fill: C.accent, color: '#fff', align: 'right', alpha: pop('att') });

    rows.forEach((r, i) => {
      const y = ROW_Y[i];
      const a = tw(t, at(['tel', 'gl', 'br'][i]) - lead, pace.enter);
      if (a <= 0) return;
      const [obj, wo, kakeru] = r.pos;
      // sentence e is about the first line: the others step back
      const rowA = a * (i === 0 ? 1 : dimmed(0, e1, cue));
      ctx.save();
      ctx.globalAlpha = rowA;

      // arcs from かける back to the words before it, thicker for more weight
      const arcs = tw(t, at('look') - lead + i * 0.12, 0.8, inOutCubic);
      const thick = tw(t, at('weight') - lead, 0.6);
      if (arcs > 0) {
        [obj, wo].forEach((target, k) => {
          const weight = lerp(0.3, r.w[k], thick);
          const x0 = kakeru.c;
          const x1 = target.c;
          const h = arcH(x0, x1);
          const hot = i === 0 && k === 0 ? w1.level[0] : 0;
          ctx.save();
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 2 + weight * 14 + hot * 3;
          ctx.lineCap = 'round';
          ctx.globalAlpha *= 0.35 + weight * 0.65;
          path(ctx, quadPoints(x0, y - 6, (x0 + x1) / 2, y - 6 - h * 2, x1, y - 6, 36), arcs);
          ctx.restore();
          if (i === 0) {
            // the long arc's weight above its top, the short one's beside it
            const ly = k === 0 ? y - 6 - h - 10 : y - 12;
            text(ctx, r.w[k].toFixed(2), (x0 + x1) / 2, ly, { font: F.mono(600, k === 0 ? 17 : 15), color: C.accent, align: 'center', alpha: thick });
          }
        });
        // and at itself
        const self = r.w[2] ?? 0.2;
        ctx.save();
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2 + lerp(0.3, self, thick) * 14;
        ctx.globalAlpha *= (0.35 + self * 0.65) * seg(arcs, 0.5, 1);
        ctx.beginPath();
        ctx.arc(kakeru.c + 26, y - 14, 13, Math.PI * 0.85, Math.PI * 2.25);
        ctx.stroke();
        ctx.restore();
        if (i === 0) text(ctx, `自分 ${self.toFixed(2)}`, kakeru.c + 26, y - 40, { font: F.mono(600, 15), color: C.accent, align: 'center', alpha: thick });
        // what 電話 holds runs along the arc into かける
        if (i === 0) {
          const run = seg(t, at('take') - lead, at('take') + 0.7);
          if (run > 0 && run < 1) {
            const h = arcH(obj.c, kakeru.c);
            const pts = quadPoints(obj.c, y - 6, (obj.c + kakeru.c) / 2, y - 6 - h * 2, kakeru.c, y - 6, 36);
            const p = pts[Math.round(inOutCubic(run) * 36)];
            ctx.fillStyle = r.tint;
            ctx.strokeStyle = C.ink2;
            ctx.lineWidth = 2;
            circle(ctx, p[0], p[1], 11);
            ctx.fill();
            ctx.stroke();
          }
        }
      }

      // the words
      const objLit = Math.max(before, i === 0 ? w1.level[0] : 0);
      ctx.save();
      const k = lifted(objLit, cue);
      ctx.translate(obj.c, y + CH / 2);
      ctx.scale(k, k);
      chip(ctx, obj.x - obj.c, -CH / 2, obj.s, { font: FONT, h: CH, padX: 18, fill: C.panel, color: objLit > 0.5 ? C.accent : C.ink });
      ctx.restore();
      chip(ctx, wo.x, y, wo.s, { font: FONT, h: CH, padX: 18, fill: C.panel });
      const tk = took(i);
      chip(ctx, kakeru.x, y, kakeru.s, { font: FONT, h: CH, padX: 18, fill: tk > 0.5 ? r.tint : '#fff', stroke: C.ink, lw: 3 });

      // position numbers
      if (posA > 0) {
        r.pos.forEach((p, n) => text(ctx, String(n + 1), p.c, y + CH + 22, { font: F.mono(600, 16), color: C.ink2, align: 'center', alpha: posA }));
      }

      // what かける means here
      if (mean > 0) {
        ctx.strokeStyle = C.ink2;
        ctx.fillStyle = C.ink2;
        ctx.lineWidth = 2.5;
        arrow(ctx, ARROW_X, y + CH / 2, BOX_X - 20, y + CH / 2, inOutCubic(tw(t, at('mean') - lead + i * 0.12, 0.6)), 12);
        const m = tw(t, at('mean') - lead + 0.3 + i * 0.12, 0.6);
        const bw = W - M.r - BOX_X;
        ctx.save();
        ctx.globalAlpha *= m;
        rr(ctx, BOX_X + lerp(16, 0, m), y - 6, bw, CH + 12, 14);
        ctx.fillStyle = r.tint;
        ctx.fill();
        ctx.restore();
        text(ctx, '「かける」の数の並びが表す意味（イメージ）', BOX_X + 22, y + 20, { font: F.jp(500, 16), color: C.ink2, alpha: m });
        text(ctx, r.means, BOX_X + 22, y + 58, { font: F.jp(700, 30), color: C.ink, alpha: m });
      }
      ctx.restore();

      // ずんだもん's question: after かける there is nothing yet, and it is not looked at
      if (i === 0) {
        const ga = pop('ask');
        if (ga > 0) {
          const x = r.end + 6;
          ctx.save();
          ctx.globalAlpha = ga;
          ctx.setLineDash([8, 7]);
          ctx.strokeStyle = C.muted;
          ctx.lineWidth = 2;
          rr(ctx, x, y - 2, 96, CH + 4, 10);
          ctx.stroke();
          ctx.restore();
          text(ctx, '後ろ', x + 48, y + CH / 2 + 7, { font: F.jp(700, 20), color: C.muted, align: 'center', alpha: ga });
          const no = Math.max(ahead, tw(t, at('ahead') - lead, pace.enter));
          if (no > 0) {
            const cx = x + 48;
            const cy = y - 34;
            ctx.save();
            ctx.globalAlpha = no;
            ctx.strokeStyle = C.red;
            ctx.lineWidth = 4;
            line(ctx, cx - 11, cy - 11, cx + 11, cy + 11);
            line(ctx, cx - 11, cy + 11, cx + 11, cy - 11);
            ctx.restore();
            text(ctx, '見ない', cx + 20, cy + 7, { font: F.jp(700, 18), color: C.red, alpha: no });
          }
          text(ctx, 'まだ書かれていない', x + 48, y + CH + 26, { font: F.jp(500, 16), color: C.muted, align: 'center', alpha: pop('none') });
        }
      }
    });
    if (posA > 0) text(ctx, '位置', X0 - 12, ROW_Y[2] + CH + 22, { font: F.jp(700, 15), color: C.ink2, align: 'right', alpha: posA });
    example(ctx, M.l, 584, tw(t, at('look'), 0.5), '語の単位で描いた例。線の太さは参考にする度合い（数は例）');

    // ——— the layer: looking around, then each token on its own; stacked
    const la = enter(t, at('j'), pace);
    if (la > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, LY - 22, (W - M.l - M.r) * outCubic(la), 2);
    }
    const lit = focus(t, [at('layer'), at('ffn')], at('j.end') - cue.fall, cue);
    // the lists going in
    const inA = la;
    text(ctx, '数の並び', M.l, LY + 22, { font: F.jp(700, 19), color: C.ink2, alpha: inA });
    for (let k = 0; k < 3; k++) icon(ctx, 'vec', M.l + 30 + k * 52, LY + 96, 70, inA);
    ctx.strokeStyle = C.ink2;
    ctx.fillStyle = C.ink2;
    ctx.lineWidth = 2.5;
    arrow(ctx, M.l + 170, LY + LH / 2, BLOCK.x - 10, LY + LH / 2, inA, 11);
    // block 1, its two parts
    const b1 = { x: BLOCK.x, y: LY, w: BLOCK.w, h: LH };
    const blockA = Math.max(tw(t, at('layer') - lead, pace.enter), 0);
    const half = (BLOCK.w - 36) / 2;
    sub(ctx, b1.x + 12, LY + 40, half, LH - 54, '前を見る', 'アテンション', 'att', blockA, lit.level[0]);
    sub(ctx, b1.x + 24 + half, LY + 40, half, LH - 54, 'トークンごとに', '作り変える', 'vec', pop('ffn'), lit.level[1]);
    const bracket = pop('block');
    if (bracket > 0) {
      ctx.save();
      ctx.globalAlpha = bracket;
      rr(ctx, b1.x, b1.y, b1.w, b1.h, 16);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      text(ctx, '1 段', b1.x + 14, LY + 26, { font: F.jp(700, 19), color: C.ink, alpha: bracket });
    }
    // the stack
    const st = tw(t, at('stack') - lead, 0.9);
    const smallX = (k) => b1.x + b1.w + BLOCK.gap + k * (SMALL.w + BLOCK.gap);
    const labels = ['2 段', '3 段', '…', '96 段'];
    labels.forEach((s, k) => {
      const a = seg(st, k * 0.18, k * 0.18 + 0.4);
      if (a <= 0) return;
      const x = smallX(k);
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      ctx.lineWidth = 2.5;
      arrow(ctx, x - BLOCK.gap + 4, LY + LH / 2, x - 6, LY + LH / 2, a, 10);
      if (s === '…') {
        text(ctx, '⋯', x + SMALL.w / 2, LY + LH / 2 + 10, { font: F.sans(700, 34), color: C.ink2, align: 'center', alpha: a });
        return;
      }
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, x, LY, SMALL.w, LH, 14);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      icon(ctx, 'att', x + SMALL.w / 2, LY + 58, 46, a);
      icon(ctx, 'vec', x + SMALL.w / 2, LY + 108, 46, a);
      const lab = s === '96 段' ? tw(t, at('n96') - lead, pace.enter) : a;
      const name = s !== '96 段' ? s : lab > 0.5 ? '96 段' : '最後の段';
      text(ctx, name, x + SMALL.w / 2, LY + 26, { font: F.jp(700, 18), color: s === '96 段' && lab > 0.5 ? C.accent : C.ink, align: 'center', alpha: a });
    });
    const endX = smallX(3) + SMALL.w;
    const outA = seg(st, 0.8, 1);
    ctx.strokeStyle = C.ink2;
    ctx.fillStyle = C.ink2;
    arrow(ctx, endX + 8, LY + LH / 2, endX + 60, LY + LH / 2, outA, 10);
    text(ctx, '確率へ', endX + 66, LY + LH / 2 + 7, { font: F.jp(700, 19), color: C.ink2, alpha: outA });
    text(ctx, 'GPT-3（最大）は 96 段', smallX(3) + SMALL.w / 2, LY + LH + 30, { font: F.jp(700, 19), color: C.accent, align: 'center', alpha: pop('n96') });
    tag(ctx, b1.x, LY + LH + 12, 'Transformer（2017 年）の形', { font: F.jp(700, 18), h: 34, padX: 14, fill: C.ink, color: C.paper, alpha: pop('tf') });
    source(ctx, 'GPT-3 は Brown ほか（2020）、Transformer は Vaswani ほか（2017）', pop('n96'), SOURCE_RIGHT);
  },
});

// Half the height of an arc between two words: low enough to stay clear of the line above.
const arcH = (x0, x1) => 18 + Math.abs(x1 - x0) * 0.1;

// One part of a layer: a panel with its picture and two lines of name.
function sub(ctx, x, y, w, h, name1, name2, kind, a, lit) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, y, w, h, 12);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  icon(ctx, kind, x + 46, y + h / 2, 60, a);
  text(ctx, name1, x + 84, y + h / 2 - 6, { font: F.jp(700, 18), color: lit > 0.5 ? C.accent : C.ink, alpha: a });
  text(ctx, name2, x + 84, y + h / 2 + 22, { font: F.jp(500, 17), color: C.ink2, alpha: a });
  ring(ctx, x, y, w, h, lit, C.accent, 12);
}
