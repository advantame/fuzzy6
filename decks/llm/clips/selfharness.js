// A harness that improves itself (Self-Harness, Zhang et al., arXiv:2606.09498; first version
// 2026-06-08, numbers from v3 of 2026-08-20). The model being run analyses its own failures,
// proposes a change, checks that nothing got worse, and rewrites its harness; its weights do not
// change. On a 64-task subset of Terminal-Bench 2.0, the held-out success rate rose for three
// open models (MiniMax M2.5 40.5 → 61.9%, Qwen3.5-35B-A3B 23.8 → 38.1%, GLM-5 42.9 → 57.1%).
// The held-out traces are hidden from the proposer, but its scores decide which changes are kept.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr, circle, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const CX = 440;
const CY = 340;
const RX = 232;
const RY = 186;
const STEPS = ['失敗を調べる', '直し方を提案する', '悪くならないか確かめる', 'ハーネスを書き換える'];
const ANG = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
// two trips round the loop: [start, seconds per step]
const LOOPS = [[2.6, 0.7], [6.2, 1.1]];
const MODELS = [
  { name: 'MiniMax M2.5', a: 40.5, b: 61.9 },
  { name: 'Qwen3.5-35B-A3B', a: 23.8, b: 38.1 },
  { name: 'GLM-5', a: 42.9, b: 57.1 },
];
const X0 = 840;
const XW = 600; // 100 %
const RES = 11.4;

export default clip({
  id: 'selfharness',
  title: '自分で直す',
  kicker: 'Self-Harness',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'ハーネスを、動かすモデル自身に直させる研究もある。\n2026 年 6 月の Self-Harness。' },
    { at: 6.0, to: 11.2, text: 'モデルが自分の失敗を調べ、直し方を提案し、\n前より悪くならないかを確かめてから、ハーネスを書き換える。' },
    { at: 11.4, to: 18, text: '三つの公開モデルで、取り分けた課題の成功率が上がった。\nただし、その点は、変更を採るかどうかの判断にも使っている。' },
  ],

  draw(ctx, t) {
    // ——— the loop, run by the model on itself
    const ca = tw(t, 0.6, 0.5);
    ctx.save();
    ctx.globalAlpha = ca;
    rr(ctx, CX - 92, CY - 54, 184, 108, 18);
    ctx.fillStyle = C.ink;
    ctx.fill();
    ctx.restore();
    text(ctx, '同じモデル', CX, CY - 4, { font: F.jp(700, 26), color: C.paper, align: 'center', alpha: ca });
    text(ctx, '重みは変えない', CX, CY + 28, { font: F.jp(500, 16), color: '#bdb6a9', align: 'center', alpha: ca });
    // where the token is, and which step it lights
    let pos = -1;
    for (const [at, per] of LOOPS) {
      const p = (t - at) / per;
      if (p >= 0 && p < 4) pos = p;
    }
    if (pos >= 0) {
      const ang = ANG[0] + (pos / 4) * Math.PI * 2;
      ctx.save();
      ctx.fillStyle = C.accent;
      circle(ctx, CX + Math.cos(ang) * RX, CY + Math.sin(ang) * RY, 9);
      ctx.fill();
      ctx.restore();
    }
    STEPS.forEach((s, i) => {
      const a = tw(t, 1.2 + i * 0.3, 0.4);
      // the arc to the next step
      arc(ctx, i, a);
      const hot = pos >= 0 && Math.floor(pos) === i;
      const x = CX + Math.cos(ANG[i]) * RX;
      const y = CY + Math.sin(ANG[i]) * RY;
      const font = F.jp(700, 19);
      tag(ctx, x, y - 22, s, { font, h: 44, padX: 18, fill: hot ? C.accent : '#fff', stroke: hot ? null : C.ink2, color: hot ? '#fff' : C.ink, align: 'center', alpha: a });
    });

    // ——— held-out success rates, before and after
    const ra = tw(t, RES, 0.6);
    if (ra > 0) {
      text(ctx, '取り分けた課題での成功率', X0 - 20, 146, { font: F.jp(700, 23), color: C.ink, alpha: ra });
      text(ctx, 'Terminal-Bench 2.0 の 64 題から。著者の評価', X0 - 20, 174, { font: F.jp(500, 16), color: C.muted, alpha: ra });
      MODELS.forEach((m, i) => {
        const y = 250 + i * 104;
        const a = tw(t, RES + 0.3 + i * 0.35, 0.5);
        if (a <= 0) return;
        text(ctx, m.name, X0 - 20, y - 26, { font: F.sans(600, 20), color: C.ink, alpha: a });
        const xa = X0 + XW * (m.a / 100);
        const xb = lerp(xa, X0 + XW * (m.b / 100), tw(t, RES + 0.5 + i * 0.35, 0.8, inOutCubic));
        ctx.save();
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = C.rule;
        ctx.fillRect(X0, y - 1, XW, 2);
        ctx.globalAlpha = a;
        ctx.fillStyle = C.accent;
        ctx.fillRect(xa, y - 3, xb - xa, 6);
        ctx.strokeStyle = C.ink2;
        ctx.lineWidth = 3;
        ctx.fillStyle = C.paper;
        circle(ctx, xa, y, 9);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.accent;
        circle(ctx, xb, y, 11);
        ctx.fill();
        ctx.restore();
        text(ctx, `${m.a}`, xa - 16, y + 9, { font: F.cond(700, 26), color: C.ink2, align: 'right', alpha: a });
        text(ctx, `${m.b}%`, xb + 18, y + 11, { font: F.cond(700, 32), color: C.accent, alpha: tw(t, RES + 1.2 + i * 0.35, 0.4) });
      });
      const ty = 250 + 3 * 104 - 52;
      [0, 50, 100].forEach((k) => text(ctx, `${k}%`, X0 + XW * (k / 100), ty, { font: F.mono(500, 14), color: C.muted, align: k === 0 ? 'left' : k === 100 ? 'right' : 'center', alpha: ra }));
      text(ctx, '○ はじめ　● 最後', X0 - 20, ty + 40, { font: F.jp(500, 16), color: C.ink2, alpha: ra });
      text(ctx, 'その課題の点は、変更を採るかどうかの判断にも使った', X0 - 20, ty + 76, { font: F.jp(700, 18), color: C.red, alpha: tw(t, RES + 2.0, 0.5) });
    }

    // ——— who does the fixing
    const wa = tw(t, 13.0, 0.6);
    if (wa > 0) {
      const y = 700;
      ctx.save();
      ctx.globalAlpha = wa;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 34, (W - M.l - M.r) * outExpo(wa), 2);
      ctx.restore();
      text(ctx, '直す役', M.l, y + 28, { font: F.jp(700, 20), color: C.ink2, alpha: wa });
      let x = M.l + 90;
      x += tag(ctx, x, y, 'Meta-Harness：別の強いエージェント', { font: F.jp(700, 19), h: 44, padX: 18, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: wa }) + 16;
      tag(ctx, x, y, 'Self-Harness：動かすモデル自身', { font: F.jp(700, 19), h: 44, padX: 18, fill: C.accent, color: '#fff', alpha: tw(t, 13.3, 0.5) });
    }

    source(ctx, 'Zhang ほか「Self-Harness」arXiv:2606.09498 v3（2026-08-20）Table 1', tw(t, 0.6, 0.5));
  },
});

// The arc of the ellipse from step i to the next, with its arrowhead, clear of the labels.
function arc(ctx, i, a) {
  if (a <= 0) return;
  const gap = [0.44, 0.24, 0.64, 0.24]; // kept clear around each label (top, right, bottom, left)
  const a0 = ANG[i] + gap[i];
  const a1 = ANG[i] + Math.PI / 2 - gap[(i + 1) % 4];
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.ink2;
  ctx.fillStyle = C.ink2;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX, RY, 0, a0, a1);
  ctx.stroke();
  // the tangent of the ellipse at a1
  const dir = Math.atan2(RY * Math.cos(a1), -RX * Math.sin(a1));
  arrowHead(ctx, CX + Math.cos(a1) * RX, CY + Math.sin(a1) * RY, dir, 12);
  ctx.restore();
}
