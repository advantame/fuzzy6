// What a default costs (Weinberger & Hozez, "Prompt-Induced Waste in Coding Agents",
// arXiv:2608.01347 v6, 2026-09-10, §6.1 Table 3). dsh 0.1.0rc7 running Claude Sonnet 5, five tasks,
// five arms, three runs each. The configuration reasoned hard even on ordinary requests (the
// authors' reading of the traffic); choosing the effort per request cut the mean billed cost per
// run by 74.7%, and all three measures together by 82.2%. Every arm solved 15 of 15. Easy tasks
// only, and not a comparison with other harnesses.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const ARMS = [
  { name: '既定のまま', id: 'baseline', note: '', usd: 0.2753, cut: null, at: 1.2 },
  { name: '方針を足す', id: 'policy', note: '指示に、むだを減らす方針を書き足す', usd: 0.2114, cut: 23.2, at: 6.0 },
  { name: '依頼を直す', id: 'rewrite', note: '入力の文を補正する', usd: 0.2109, cut: 23.4, at: 6.5 },
  { name: '考える量を選ぶ', id: 'effort', note: '依頼に合わせて low〜high を選ぶ', usd: 0.0696, cut: 74.7, at: 7.4, hot: true },
  { name: '三つとも', id: 'full', note: '', usd: 0.049, cut: 82.2, at: 11.4, hot: true },
];
const BX = 470;
const BW = 760; // $0.30
const TOP = 210;
const ROW = 92;

export default clip({
  id: 'defaults',
  title: '既定で変わる',
  kicker: '費用の実験',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'ハーネスの既定の設定は、費用を大きく左右する。\n2026 年の実験は、dsh で Claude Sonnet 5 を動かして測った。' },
    { at: 6.0, to: 11.2, text: '既定では、ふつうの依頼にも強く考えさせていた。考える量を\n依頼に合わせて選ぶだけで、1 回の費用が 74.7% 減った。' },
    { at: 11.4, to: 18, text: '三つの工夫を合わせると 82.2% 減。どれも 15 回すべて成功した。\nただし易しい 5 課題での結果で、どこでも同じ割合とは限らない。' },
  ],

  draw(ctx, t) {
    // ——— the setup
    const ha = tw(t, 0.4, 0.5);
    let x = M.l;
    x += tag(ctx, x, 104, 'dsh 0.1.0rc7', { font: F.mono(600, 18), h: 40, padX: 16, fill: '#fff', stroke: C.accent, color: C.accent, alpha: ha }) + 12;
    x += tag(ctx, x, 104, 'Claude Sonnet 5（固定）', { font: F.jp(700, 18), h: 40, padX: 16, fill: C.ink, color: C.paper, alpha: tw(t, 0.6, 0.5) }) + 20;
    text(ctx, '5 課題 × 5 条件 × 3 回 ＝ 75 回。1 回あたりの請求額の平均', x, 131, { font: F.jp(500, 18), color: C.ink2, alpha: tw(t, 0.9, 0.5) });

    // ——— one bar per arm, on a scale to $0.30
    ARMS.forEach((r, i) => {
      const a = tw(t, r.at, 0.5);
      if (a <= 0) return;
      const y = TOP + i * ROW;
      text(ctx, r.name, M.l, y + 30, { font: F.jp(700, 23), color: r.hot ? C.accent : C.ink, alpha: a });
      text(ctx, r.id, M.l + 190, y + 29, { font: F.mono(500, 15), color: C.muted, alpha: a });
      if (r.note) text(ctx, r.note, M.l, y + 58, { font: F.jp(500, 15), color: C.ink2, alpha: a });
      const p = tw(t, r.at + 0.1, 0.8, inOutCubic);
      const w = BW * (r.usd / 0.3) * p;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = C.rule;
      ctx.globalAlpha = a * 0.5;
      ctx.fillRect(BX, y + 8, BW, 34);
      ctx.globalAlpha = a;
      ctx.fillStyle = i === 0 ? C.ink2 : r.hot ? C.accent : C.ink2;
      ctx.fillRect(BX, y + 8, w, 34);
      ctx.restore();
      const vw = text(ctx, `$${(r.usd * p).toFixed(4)}`, BX + w + 14, y + 36, { font: F.cond(700, 30), color: r.hot ? C.accent : C.ink, alpha: a });
      if (r.cut != null) text(ctx, `−${r.cut}%`, BX + w + 14 + vw + 14, y + 35, { font: F.cond(700, 24), color: r.hot ? C.accent : C.ink2, alpha: tw(t, r.at + 0.8, 0.4) });
      // all runs succeeded
      const sa = tw(t, r.at + 0.9, 0.4, (q) => outBack(q, 1.6));
      tag(ctx, W - M.r, y + 8, '15/15 成功', { font: F.jp(700, 16), h: 34, padX: 12, fill: C.greenSoft, color: C.green, align: 'right', alpha: Math.min(1, sa) });
    });
    // what the default was doing
    const da = tw(t, 2.6, 0.5);
    text(ctx, '既定では、ふつうの依頼にも強い推論をかけていた（著者の見立て）', BX, TOP + 72, { font: F.jp(700, 17), color: C.red, alpha: da });

    // ——— the limits
    const la = tw(t, 13.2, 0.6);
    if (la > 0) {
      const y = TOP + 5 * ROW + 30;
      ctx.save();
      ctx.globalAlpha = la;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 30, (W - M.l - M.r) * outExpo(la), 2);
      ctx.restore();
      text(ctx, 'どれも成功した易しい 5 課題での結果。DeepSeek のモデルの測定でも、ほかのハーネスとの比較でもない', M.l, y + 4, { font: F.jp(500, 18), color: C.ink2, alpha: la });
    }

    source(ctx, 'Weinberger・Hozez、arXiv:2608.01347 v6（2026-09-10）§6.1、表 3', ha);
  },
});
