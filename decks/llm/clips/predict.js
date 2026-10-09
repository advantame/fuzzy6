// Next-token prediction: read the text, give every candidate a probability, pick one, append
// it, repeat. Candidates are real single o200k_base tokens; the probabilities are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { chip, chipWidth, example } from '../lib/parts.js';
import { text, circle, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic } from '../../../src/kit/ease.js';

const START = ['日本', 'の', '首', '都', 'は'];
// [token, o200k id, probability]; the first is picked
const STEPS = [
  [['東京', 108713, 0.78], ['東京都', 123558, 0.09], ['何', 13811, 0.04], ['京都', 62110, 0.02]],
  [['です', 15121, 0.62], ['。', 788, 0.17], ['で', 4344, 0.08], ['、', 1395, 0.06]],
  [['。', 788, 0.91], ['！', 3393, 0.03], ['ね', 28144, 0.02], ['よ', 15161, 0.01]],
];
const SENT_Y = 136;
const CHIP = { font: F.jp(500, 44), h: 70, padX: 14 };
const GAP = 8;
const P0 = 1.8; // first step
const STEP = 3.9;
const PANEL_X = 700;
const ROW0 = 392;
const ROW = 74;
const BAR_X = 930;
const BAR_W = 520;
const LOOP = { x: 360, y: 588, r: 150 };
const PHASES = ['読む', '確率を出す', '1 つ選ぶ', '末尾に足す'];

export default clip({
  id: 'predict',
  title: '次を確率で選ぶ',
  kicker: '次トークン予測',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'モデルは、それまでの文章を読んで、\n次に来るトークンの**確率**を計算する。' },
    { at: 5.8, to: 10.8, text: '1 つを選んで文末に足し、また次を予測する。\nこのくり返しで文章ができていく。' },
    { at: 11.0, to: 18, text: '確率は語彙のすべて、約 20 万種類に付く。\nいちばん高いものを選ぶとは限らない。' },
  ],

  prepare(ctx) {
    const widths = (list) => list.map((s) => chipWidth(ctx, s, CHIP));
    return { startW: widths(START), pickW: widths(STEPS.map((s) => s[0][0])) };
  },

  draw(ctx, t, { startW, pickW }) {
    // which step, and which phase of it, is running
    const k = Math.max(0, Math.min(STEPS.length - 1, Math.floor((t - P0) / STEP)));
    const local = t - P0 - k * STEP;
    const phase = t < P0 ? -1 : local < 0.5 ? 0 : local < 1.6 ? 1 : local < 2.3 ? 2 : local < 3.3 ? 3 : k === STEPS.length - 1 ? 2 : 0;

    // ——— the sentence, growing token by token
    let x = M.l;
    START.forEach((s, i) => {
      const a = tw(t, 0.3 + i * 0.08, 0.5);
      chip(ctx, x, SENT_Y, s, { ...CHIP, fill: C.tints[i % C.tints.length], alpha: a });
      x += startW[i] + GAP;
    });
    let caretX = x;
    STEPS.forEach((st, j) => {
      const fly = seg(t, P0 + j * STEP + 2.3, P0 + j * STEP + 2.9);
      if (fly >= 1) {
        const flash = 1 - seg(t, P0 + j * STEP + 2.9, P0 + j * STEP + 3.8);
        chip(ctx, x, SENT_Y, st[0][0], { ...CHIP, fill: flash > 0.02 ? mix(flash) : C.tints[(START.length + j) % C.tints.length], color: flash > 0.5 ? '#fff' : C.ink });
        x += pickW[j] + GAP;
        caretX = x;
      }
    });
    if (t < P0 + (STEPS.length - 1) * STEP + 3.0 && Math.floor(t * 2.5) % 2 === 0) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(caretX + 2, SENT_Y + 8, 4, CHIP.h - 16);
    }

    // ——— the loop: read → score → pick → append
    const la = tw(t, 0.9, 0.6);
    if (la > 0) {
      ctx.save();
      ctx.globalAlpha = la;
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(LOOP.x, LOOP.y, LOOP.r, 0, Math.PI * 2);
      ctx.stroke();
      // arrowheads between the nodes, clockwise
      ctx.fillStyle = C.rule;
      for (let i = 0; i < 4; i++) {
        const ang = -Math.PI / 2 + (i + 0.5) * (Math.PI / 2);
        arrowHead(ctx, LOOP.x + Math.cos(ang) * LOOP.r, LOOP.y + Math.sin(ang) * LOOP.r, ang + Math.PI / 2, 16);
      }
      PHASES.forEach((name, i) => {
        const ang = -Math.PI / 2 + i * (Math.PI / 2);
        const nx = LOOP.x + Math.cos(ang) * LOOP.r;
        const ny = LOOP.y + Math.sin(ang) * LOOP.r;
        const on = phase === i;
        ctx.fillStyle = on ? C.accent : C.paper;
        ctx.strokeStyle = on ? C.accent : C.ink;
        ctx.lineWidth = 3;
        circle(ctx, nx, ny, on ? 16 : 11);
        ctx.fill();
        ctx.stroke();
        const lx = nx + (i === 1 ? 30 : i === 3 ? -30 : 0);
        const ly = ny + (i === 0 ? -30 : i === 2 ? 46 : 8);
        text(ctx, name, lx, ly, { font: F.jp(on ? 700 : 500, 24), color: on ? C.accent : C.ink2, align: i === 1 ? 'left' : i === 3 ? 'right' : 'center' });
      });
      if (t >= P0) {
        text(ctx, `${k + 1}`, LOOP.x, LOOP.y + 22, { font: F.cond(700, 72), color: C.ink, align: 'center' });
        text(ctx, '回目', LOOP.x, LOOP.y + 54, { font: F.jp(500, 20), color: C.muted, align: 'center' });
      }
      ctx.restore();
    }

    // ——— the probabilities for the current step
    if (t < P0) return;
    const st = STEPS[k];
    const show = tw(t, P0 + k * STEP + 0.4, 0.4) * (k === STEPS.length - 1 ? 1 : 1 - seg(local, 3.3, 3.8));
    if (show <= 0) return;
    ctx.save();
    ctx.globalAlpha = show;
    text(ctx, '次のトークンの確率', PANEL_X, 330, { font: F.jp(700, 26), color: C.ink });
    example(ctx, PANEL_X + 250, 306, 1, '確率は説明のための例');
    const grow = inOutCubic(seg(local, 0.5, 1.2));
    const pick = seg(local, 1.6, 1.9);
    st.forEach(([s, id, p], r) => {
      const y = ROW0 + r * ROW;
      const chosen = r === 0;
      const flying = chosen ? seg(local, 2.3, 2.9) : 0;
      if (!(chosen && flying > 0 && local < 3.3 && k < STEPS.length)) {
        chip(ctx, PANEL_X, y, s, { font: F.jp(500, 32), h: 54, padX: 14, minW: 110, fill: chosen && pick > 0 ? C.accent : C.panel, color: chosen && pick > 0.5 ? '#fff' : C.ink });
      }
      text(ctx, `#${id}`, PANEL_X + 124, y + 36, { font: F.mono(400, 15), color: C.muted });
      ctx.fillStyle = chosen && pick > 0 ? C.accent : C.ink;
      const w = BAR_W * p * grow;
      ctx.fillRect(BAR_X, y + 12, Math.max(2, w), 30);
      text(ctx, `${Math.round(p * 100)}%`, BAR_X + w + 12, y + 39, { font: F.cond(700, 30), color: chosen ? C.accent : C.ink2, alpha: grow });
    });
    text(ctx, 'その他 約 20 万種類', PANEL_X, ROW0 + 4 * ROW + 34, { font: F.jp(500, 22), color: C.muted, alpha: grow });
    const rest = 1 - st.reduce((n, [, , p]) => n + p, 0);
    ctx.fillStyle = C.rule;
    ctx.fillRect(BAR_X, ROW0 + 4 * ROW + 12, BAR_W * rest * grow, 30);
    ctx.restore();

    // the picked token flying up to the end of the sentence
    const fly = seg(local, 2.3, 2.9);
    if (fly > 0 && fly < 1) {
      let ex = M.l;
      startW.forEach((w) => (ex += w + GAP));
      for (let j = 0; j < k; j++) ex += pickW[j] + GAP;
      const e = inOutCubic(fly);
      const fx = lerp(PANEL_X, ex, e);
      const fy = lerp(ROW0, SENT_Y, e) - Math.sin(Math.PI * e) * 40;
      chip(ctx, fx, fy, st[0][0], { ...CHIP, fill: C.accent, color: '#fff' });
    }
  },
});

// vermilion fading back to the chip tint as a token settles
function mix(f) {
  return f > 0.5 ? C.accent : C.accentSoft;
}

