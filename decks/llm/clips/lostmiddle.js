// Long contexts are not used evenly. Liu et al. moved the one document holding the answer through
// 20 documents: GPT-3.5-Turbo answered best when it was first, worst in the middle — below the
// score with no documents at all. Chroma (2025) found the same model family scoring far lower on
// a whole conversation than on just its relevant part. Five measured points, joined by straight
// lines; no smoothing.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source } from '../lib/parts.js';
import { text, rr, line, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack, outExpo, keys } from '../../../src/kit/ease.js';

// Liu et al., arXiv v3 Table 6: GPT-3.5-Turbo-0613, 20 documents, NaturalQuestions-Open
const POINTS = [[1, 75.8], [5, 57.2], [10, 53.8], [15, 55.4], [20, 63.2]];
const CLOSED = 56.1;
const ORACLE = 88.3;
const STEPS = [1.3, 2.3, 3.3, 4.3, 5.3];

const STACK = { x: M.l, y: 168, w: 330, h: 17, gap: 4 };
const CH = { x: 640, y: 150, w: 820, h: 400 };
const Y0 = 40;
const Y1 = 90;
const px = (pos) => CH.x + ((pos - 1) / 19) * CH.w;
const py = (v) => CH.y + CH.h - ((v - Y0) / (Y1 - Y0)) * CH.h;
const BARS_Y = 690;

export default clip({
  id: 'lostmiddle',
  title: '真ん中を見落とす',
  kicker: '長い文脈の弱さ',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '長い文脈が入っても、全部を同じように使えるとは限らない。\n正解の資料を 20 本のどこに置くかで、成績が変わった。' },
    { at: 6.0, to: 11.2, text: '真ん中に置くと 53.8%。資料を渡さずに答えたとき（56.1%）より低い。\n2023 年の GPT-3.5-Turbo での測定。' },
    { at: 11.4, to: 18, text: '2025 年の測定でも、関係のない会話が増えるほど成績が落ちた。\n入る長さと、使いこなせる長さは、同じではない。' },
  ],

  draw(ctx, t) {
    // ——— twenty documents; the one with the answer moves down
    const sa = tw(t, 0.2, 0.5);
    text(ctx, '20 本の資料', STACK.x, STACK.y - 26, { font: F.jp(700, 22), color: C.ink, alpha: sa });
    text(ctx, '正解は 1 本だけ', STACK.x + 140, STACK.y - 26, { font: F.jp(500, 18), color: C.green, alpha: sa });
    const gold = keys(t, [[0, 1], ...STEPS.flatMap((at, i) => [[at - 0.5, i === 0 ? 1 : POINTS[i - 1][0]], [at, POINTS[i][0]]])], inOutCubic);
    for (let i = 0; i < 20; i++) {
      const y = STACK.y + i * (STACK.h + STACK.gap);
      const a = tw(t, 0.2 + i * 0.02, 0.4);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = C.rule;
      rr(ctx, STACK.x + 34, y, STACK.w - 34, STACK.h, 4);
      ctx.fill();
      ctx.restore();
      text(ctx, `${i + 1}`, STACK.x + 22, y + 14, { font: F.cond(600, 15), color: C.muted, align: 'right', alpha: a });
    }
    // the answer's document, sliding to its position
    const gy = STACK.y + (gold - 1) * (STACK.h + STACK.gap);
    ctx.save();
    ctx.globalAlpha = sa;
    ctx.fillStyle = C.green;
    rr(ctx, STACK.x + 34, gy, STACK.w - 34, STACK.h, 4);
    ctx.fill();
    ctx.restore();
    text(ctx, '正解の資料', STACK.x + STACK.w + 12, gy + 14, { font: F.jp(700, 16), color: C.green, alpha: sa });

    // ——— the chart
    const ca = tw(t, 0.6, 0.5);
    text(ctx, '正答率', CH.x, CH.y - 26, { font: F.jp(700, 22), color: C.ink, alpha: ca });
    ctx.save();
    ctx.globalAlpha = ca;
    [40, 50, 60, 70, 80, 90].forEach((v) => {
      ctx.fillStyle = v === 40 ? C.rule : C.grid;
      ctx.fillRect(CH.x, py(v), CH.w, v === 40 ? 2 : 1);
      text(ctx, `${v}%`, CH.x - 14, py(v) + 6, { font: F.cond(600, 18), color: C.muted, align: 'right' });
    });
    [1, 5, 10, 15, 20].forEach((p) => text(ctx, `${p}`, px(p), CH.y + CH.h + 28, { font: F.cond(600, 19), color: C.muted, align: 'center' }));
    ctx.restore();
    text(ctx, '正解の資料の位置（何本目か）', CH.x + CH.w, CH.y + CH.h + 58, { font: F.jp(500, 17), color: C.muted, align: 'right', alpha: ca });

    // with no documents, and with only the right one
    const ba = tw(t, 6.0, 0.6);
    if (ba > 0) {
      ctx.save();
      ctx.globalAlpha = ba;
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 7]);
      line(ctx, CH.x, py(CLOSED), CH.x + CH.w, py(CLOSED), outExpo(ba));
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = C.green;
      line(ctx, CH.x, py(ORACLE), CH.x + CH.w, py(ORACLE), outExpo(tw(t, 7.0, 0.6)));
      ctx.restore();
      text(ctx, `資料を渡さないとき ${CLOSED}%`, CH.x + 12, py(CLOSED) + 28, { font: F.jp(700, 17), color: C.ink2, alpha: ba });
      text(ctx, `正解の資料 1 本だけなら ${ORACLE}%`, CH.x + CH.w, py(ORACLE) - 12, { font: F.jp(500, 16), color: C.green, align: 'right', alpha: tw(t, 7.0, 0.6) });
    }
    // the measured points, joined as they arrive
    ctx.save();
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3.5;
    for (let i = 1; i < POINTS.length; i++) {
      const p = seg(t, STEPS[i] - 0.05, STEPS[i] + 0.35);
      if (p <= 0) continue;
      line(ctx, px(POINTS[i - 1][0]), py(POINTS[i - 1][1]), px(POINTS[i][0]), py(POINTS[i][1]), p);
    }
    ctx.restore();
    POINTS.forEach(([pos, v], i) => {
      const a = tw(t, STEPS[i], 0.4, (u) => outBack(u, 2));
      if (a <= 0) return;
      const mid = pos === 10;
      ctx.save();
      ctx.fillStyle = C.accent;
      circle(ctx, px(pos), py(v), 8 * Math.min(1.2, a));
      ctx.fill();
      if (mid && ba > 0) {
        ctx.globalAlpha = ba;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 3;
        circle(ctx, px(pos), py(v), 20);
        ctx.stroke();
      }
      ctx.restore();
      const first = pos === 1;
      text(ctx, `${v}%`, px(pos) + (first ? 16 : 0), py(v) - (mid ? 30 : first ? 4 : 20), { font: F.cond(700, mid ? 32 : 26), color: C.accent, align: first ? 'left' : 'center', alpha: Math.min(1, a) });
    });
    text(ctx, 'GPT-3.5-Turbo（2023 年 6 月版）、20 本の資料、2,655 問', CH.x, CH.y + CH.h + 58, { font: F.jp(400, 16), color: C.muted, alpha: ca });

    // ——— 2025: the whole conversation versus only its relevant part
    const ra = tw(t, 11.4, 0.6);
    if (ra > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, BARS_Y - 58, (W - M.l - M.r) * outExpo(ra), 2);
      text(ctx, '2025 年　Claude Sonnet 4、会話の質問 306 問（Chroma）', M.l, BARS_Y - 22, { font: F.jp(700, 19), color: C.ink, alpha: ra });
      [
        ['関係する部分だけ（約 300 トークン）', 0.89, C.ink],
        ['会話の全部（約 11 万 3,000 トークン）', 0.38, C.accent],
      ].forEach(([label, v, color], i) => {
        const y = BARS_Y + i * 46;
        const a = tw(t, 11.7 + i * 0.4, 0.5);
        text(ctx, label, M.l + 470, y + 24, { font: F.jp(500, 18), color: C.ink2, align: 'right', alpha: a });
        const w = 560 * v * outExpo(seg(t, 11.8 + i * 0.4, 12.6 + i * 0.4));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = color;
        ctx.fillRect(M.l + 490, y + 4, w, 28);
        ctx.restore();
        text(ctx, v.toFixed(2), M.l + 490 + w + 12, y + 28, { font: F.cond(700, 28), color, alpha: a });
      });
    }

    source(ctx, 'Liu ほか（TACL 2024、arXiv v3 表 6）、Chroma（2025-07-14）', ca);
  },
});
