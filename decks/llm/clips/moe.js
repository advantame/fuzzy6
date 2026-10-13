// Mixture of experts: a layer holds several small feed-forward "experts", and a router sends
// each token to a few of them. The picture uses Mixtral 8x7B's shape (8 experts, 2 per token);
// which experts each token gets is an example. Squares compare total and per-token parameters by
// area, as in 2-6.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { chip, chipWidth, example, source } from '../lib/parts.js';
import { text, rr, line } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const TOKENS = ['日本', 'の', '首', '都', 'は'];
const PICKS = [[1, 5], [2, 6], [1, 4], [0, 7], [3, 5]]; // example
const T0 = 1.6;
const EACH = 1.5;
const EX = { x: 560, y: 156, w: 176, h: 44, gap: 14 };
const ex = (i) => ({ x: EX.x, y: EX.y + i * (EX.h + EX.gap), cy: EX.y + i * (EX.h + EX.gap) + EX.h / 2 });
const ROUTER = { x: 420, y: EX.y + 4 * (EX.h + EX.gap) - EX.gap / 2 };
const OUT_X = 830;
const IN_X = 150;
const CHIP = { font: F.jp(500, 30), h: 50, padX: 12 };

const SQ_AT = 9.6;
const SQ_BASE = 470; // bottom of the squares
const S = 204; // side of the largest (1.6T)
const MODELS = [
  { name: 'Mixtral 8x7B', when: '2023 年 12 月', total: 46.7, active: 12.9, totalJa: '467 億', activeJa: '129 億' },
  { name: 'DeepSeek-V3', when: '2024 年 12 月', total: 671, active: 37, totalJa: '6710 億', activeJa: '370 億' },
  { name: 'DeepSeek-V4-Pro', when: '2026 年 4 月', total: 1600, active: 49, totalJa: '1.6 兆', activeJa: '490 億' },
];
const side = (b) => S * Math.sqrt(b / 1600);

export default clip({
  id: 'moe',
  title: '一部だけ使う',
  kicker: '混合エキスパート',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: '大きなモデルでも、1 トークンごとに全部の重みを使うとは限らない。\n層の中に、エキスパートと呼ぶ小さな部分を並べておく。' },
    { at: 5.8, to: 11.0, text: '**ルーター**が、トークンごとに使うエキスパートを選ぶ。\nこれを**混合エキスパート**（MoE）と呼ぶ。' },
    { at: 11.2, to: 18, text: 'DeepSeek-V3 は 6710 億のうち 370 億を、1 トークンごとに使う。\n計算は使う分で済むが、重みは全部、記憶に置いておく。' },
  ],

  prepare(ctx) {
    return { widths: TOKENS.map((s) => chipWidth(ctx, s, CHIP)) };
  },

  draw(ctx, t, { widths }) {
    // which token is passing, and how far
    const k = Math.max(0, Math.min(TOKENS.length - 1, Math.floor((t - T0) / EACH)));
    const local = t - T0 - k * EACH;
    const active = t >= T0 && t < T0 + TOKENS.length * EACH;
    // after the last token the final routing stays lit, so the last picture shows a choice
    const done = t >= T0 + TOKENS.length * EACH;
    const pick = active || done ? PICKS[k] : [];
    const route = done ? 1 : active ? seg(local, 0.35, 0.6) : 0;
    const work = done ? 0.6 : active ? Math.sin(Math.PI * seg(local, 0.55, 1.15)) : 0;

    // ——— experts
    const ea = tw(t, 0.2, 0.5);
    text(ctx, '1 つの層', EX.x, EX.y - 22, { font: F.jp(700, 20), color: C.ink, alpha: ea });
    for (let i = 0; i < 8; i++) {
      const e = ex(i);
      const a = tw(t, 0.3 + i * 0.05, 0.5);
      const on = pick.includes(i) && route > 0.5;
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, e.x, e.y, EX.w, EX.h, 10);
      ctx.fillStyle = on ? lerpColor(work) : '#fff';
      ctx.fill();
      ctx.strokeStyle = on ? C.accent : C.ink2;
      ctx.lineWidth = on ? 3 : 1.5;
      ctx.stroke();
      ctx.restore();
      text(ctx, `エキスパート ${i + 1}`, e.x + 16, e.cy + 7, { font: F.jp(500, 18), color: on ? C.ink : C.ink2, alpha: a });
      // wiring: router → expert → out
      ctx.save();
      ctx.globalAlpha = a * (on ? 1 : 0.35);
      ctx.strokeStyle = on ? C.accent : C.rule;
      ctx.lineWidth = on ? 3 : 1.5;
      line(ctx, ROUTER.x + 34, ROUTER.y, e.x, e.cy, on ? route : 1);
      line(ctx, e.x + EX.w, e.cy, OUT_X, ROUTER.y, on ? (done ? 1 : seg(local, 0.9, 1.2)) : 1);
      ctx.restore();
    }
    // the router
    const ra = tw(t, 0.6, 0.5, (p) => outBack(p, 1.6));
    if (ra > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, ra);
      ctx.translate(ROUTER.x, ROUTER.y);
      ctx.rotate(Math.PI / 4);
      const r = 30 * Math.min(1, ra);
      rr(ctx, -r, -r, r * 2, r * 2, 6);
      ctx.fillStyle = (route > 0 && route < 1) || done ? C.accent : C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, 'ルーター', ROUTER.x, ROUTER.y + 70, { font: F.jp(700, 20), color: C.ink, align: 'center', alpha: Math.min(1, ra) });
    }
    text(ctx, '次の層へ', OUT_X + 16, ROUTER.y + 7, { font: F.jp(500, 18), color: C.ink2, alpha: tw(t, 0.9, 0.5) });

    // ——— tokens: wait in line, enter the router, leave on the right
    TOKENS.forEach((s, i) => {
      const enterAt = T0 + i * EACH;
      const a = tw(t, 0.4 + i * 0.06, 0.4);
      const w = widths[i];
      if (t < enterAt) {
        // queued on the left, the next one closest to the router
        const slot = i - Math.max(0, Math.floor((t - T0) / EACH) + (t >= T0 ? 1 : 0));
        const y = ROUTER.y - CHIP.h / 2 + slot * 64;
        chip(ctx, IN_X, y, s, { ...CHIP, fill: C.tints[i % C.tints.length], alpha: a * (slot < 3 ? 1 : 0) });
        return;
      }
      const lt = t - enterAt;
      if (lt > 1.4) return;
      const into = inOutCubic(seg(lt, 0, 0.35));
      const x = lerp(IN_X, ROUTER.x - w / 2, into);
      chip(ctx, x, ROUTER.y - CHIP.h / 2, s, { ...CHIP, fill: C.tints[i % C.tints.length], alpha: 1 - seg(lt, 0.3, 0.42) });
      const out = seg(lt, 1.05, 1.4);
      if (out > 0) chip(ctx, lerp(OUT_X - w / 2, OUT_X + 40, out), ROUTER.y - CHIP.h / 2 - 50, s, { ...CHIP, fill: C.tints[i % C.tints.length], alpha: 1 - out });
    });
    // the count for the token in the router
    const ca = tw(t, T0 + 0.4, 0.4) * (1 - tw(t, T0 + TOKENS.length * EACH, 0.4));
    if (ca > 0) {
      text(ctx, '使うのは', EX.x, EX.y + 8 * (EX.h + EX.gap) + 30, { font: F.jp(500, 19), color: C.ink2, alpha: ca });
      text(ctx, '8 個のうち 2 個', EX.x + 84, EX.y + 8 * (EX.h + EX.gap) + 32, { font: F.jp(700, 23), color: C.accent, alpha: ca });
    }
    const fa = tw(t, T0 + TOKENS.length * EACH, 0.5);
    text(ctx, '図は Mixtral 8x7B の形。各層で 8 個から 2 個を選ぶ', EX.x - 140, EX.y + 8 * (EX.h + EX.gap) + 32, { font: F.jp(500, 19), color: C.ink2, alpha: fa });

    // ——— total and per-token parameters, by area
    const ha = tw(t, SQ_AT, 0.5);
    text(ctx, 'パラメータ全体と、1 トークンで使う分', 940, 150, { font: F.jp(700, 22), color: C.ink, alpha: ha });
    let x = 940;
    MODELS.forEach((m, i) => {
      const at = SQ_AT + 0.3 + i * 0.5;
      const g = tw(t, at, 0.8);
      if (g <= 0) return;
      const st = side(m.total) * g;
      const sa = side(m.active) * tw(t, at + 0.5, 0.6);
      const w = side(m.total);
      ctx.save();
      ctx.fillStyle = C.panel;
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 1.5;
      ctx.fillRect(x, SQ_BASE - st, st, st);
      ctx.strokeRect(x, SQ_BASE - st, st, st);
      ctx.fillStyle = C.accent;
      ctx.fillRect(x, SQ_BASE - sa, sa, sa);
      ctx.restore();
      const la = tw(t, at + 0.4, 0.5);
      const lx = x;
      text(ctx, m.name, lx, SQ_BASE + 34, { font: F.sans(600, 20), color: C.ink, alpha: la });
      text(ctx, m.when, lx, SQ_BASE + 60, { font: F.jp(400, 16), color: C.muted, alpha: la });
      text(ctx, `全体 ${m.totalJa}`, lx, SQ_BASE + 92, { font: F.jp(500, 18), color: C.ink2, alpha: la });
      text(ctx, `使う分 ${m.activeJa}`, lx, SQ_BASE + 120, { font: F.jp(700, 18), color: C.accent, alpha: tw(t, at + 0.8, 0.5) });
      x += Math.max(w, 140) + 28;
    });
    const na = tw(t, 12.2, 0.6);
    if (na > 0) {
      text(ctx, '計算の量は、使う分の大きさで決まる', 940, 690, { font: F.jp(700, 21), color: C.accent, alpha: na });
      text(ctx, '記憶に置く量は、全体の大きさで決まる', 940, 724, { font: F.jp(700, 21), color: C.ink, alpha: tw(t, 12.6, 0.6) });
    }

    example(ctx, M.l, 818, tw(t, T0, 0.5), 'どのエキスパートが選ばれるかは例');
    source(ctx, 'Mistral AI（2023）、DeepSeek-AI（2024、2026）', ha);
  },
});

// vermilion soft while an expert works
function lerpColor(p) {
  return p > 0.4 ? C.accentSoft : '#fff3ec';
}
