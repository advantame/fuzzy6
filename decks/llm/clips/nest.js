// Closing: three nested rings. The camera starts on the agent's loop, zooms into the chatbot,
// then into the core — predicting the next word, the same motif as the opening — and pulls
// back to show how each layer sits on the one inside it.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import { text, circle, rr } from '../../../src/kit/draw.js';
import { tw, seg, keys, inOutCubic, outBack } from '../../../src/kit/ease.js';

const CX = 560;
const CY = 450;
const R = [360, 240, 120]; // agent, chatbot, LLM
const ZOOM = [[0, 1], [5.2, 1], [6.6, 1.5], [10.0, 1.5], [11.4, 2.55], [12.9, 2.55], [14.3, 1]];
const CORE = ['次', 'の', '一', '語'];
const DEFS = [
  { name: 'エージェント', what: '道具を使うチャットボットを、ループで動かす', ring: 0 },
  { name: 'チャットボット', what: '会話の形をした文書の、続きを書く', ring: 1 },
  { name: 'LLM', what: '次の一語（トークン）を予測する', ring: 2 },
];
const DEF_X = 1010;
const DEF_Y = [258, 446, 634];

export default clip({
  id: 'nest',
  title: '次の一語の上に',
  kicker: 'まとめ',
  duration: 16,
  cues: [
    { at: 0.4, to: 5.0, text: 'エージェントは、道具を使うチャットボットを\nループで動かしたもの。' },
    { at: 5.2, to: 10.0, text: 'チャットボットは、会話の形をした文書の\n続きを書く LLM。' },
    { at: 10.2, to: 17, text: 'そして LLM がしているのは、**次の一語の予測**。\nすべては、その上に組み立てられている。' },
  ],

  draw(ctx, t) {
    const z = keys(t, ZOOM, inOutCubic);
    const back = seg(t, 12.9, 14.3); // pulling back at the end
    // which layer is in focus
    const focus = t < 5.4 ? 0 : t < 10.2 ? 1 : 2;
    const lit = (i) => (back > 0.5 ? 1 : i === focus ? 1 : 0.35);

    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(z, z);
    ctx.translate(-CX, -CY);

    // rings, outside in
    const fills = ['#e6e0d3', C.paper, C.ink];
    R.forEach((r, i) => {
      const g = tw(t, 0.1 + i * 0.15, 0.8, (p) => outBack(p, 1.3));
      ctx.fillStyle = fills[i];
      circle(ctx, CX, CY, r * Math.min(1.05, g));
      ctx.fill();
      ctx.strokeStyle = i === 2 ? C.ink : C.ink2;
      ctx.lineWidth = 3 / z;
      ctx.stroke();
    });

    // the agent's loop runs around the outer band
    const la = lit(0);
    const ang = -Math.PI / 2 + t * 1.25;
    ctx.save();
    ctx.globalAlpha = la;
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 8 / Math.sqrt(z);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(CX, CY, 300, ang - 1.4, ang);
    ctx.stroke();
    ctx.fillStyle = C.accent;
    circle(ctx, CX + Math.cos(ang) * 300, CY + Math.sin(ang) * 300, 12);
    ctx.fill();
    ctx.restore();
    text(ctx, 'エージェント', CX, CY - 318, { font: F.jp(700, 30), color: C.ink, align: 'center', alpha: la });
    ['検索', '実行', '編集'].forEach((s, i) => {
      const a = (-Math.PI / 2) + (i + 1) * (Math.PI / 2);
      tag(ctx, CX + Math.cos(a) * 300, CY + Math.sin(a) * 300 - 18, s, { font: F.jp(700, 18), h: 36, padX: 12, fill: '#fff', color: C.ink2, align: 'center', alpha: la * tw(t, 0.8 + i * 0.15, 0.4) });
    });

    // the chatbot band: two small bubbles
    const ca = lit(1);
    text(ctx, 'チャットボット', CX, CY - 186, { font: F.jp(700, 26), color: C.ink, align: 'center', alpha: ca });
    [[-150, 30, C.blueSoft], [150, 30, C.panel]].forEach(([dx, dy, fill], i) => {
      ctx.save();
      ctx.globalAlpha = ca;
      rr(ctx, CX + dx - 44, CY + dy - 26, 88, 52, 16);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.fillStyle = C.ink2;
      const w = 52 * seg(t, 1.2 + i * 0.4, 2.0 + i * 0.4);
      ctx.fillRect(CX + dx - 26, CY + dy - 8, w, 5);
      ctx.fillRect(CX + dx - 26, CY + dy + 4, w * 0.6, 5);
      ctx.restore();
    });

    // the core
    const ka = lit(2);
    text(ctx, 'LLM', CX, CY - 22, { font: F.sans(700, 44), color: C.paper, align: 'center', alpha: ka });
    // the next word, token by token (as in the opening)
    let x = CX - 64;
    CORE.forEach((s, i) => {
      const at = 10.8 + i * 0.3;
      const flash = 1 - seg(t, at + 0.15, at + 0.8);
      const a = tw(t, at, 0.25) * ka;
      if (a <= 0) {
        x += 32;
        return;
      }
      if (flash > 0) {
        ctx.save();
        ctx.globalAlpha = flash;
        rr(ctx, x - 2, CY + 4, 34, 40, 6);
        ctx.fillStyle = C.accent;
        ctx.fill();
        ctx.restore();
      }
      text(ctx, s, x + 15, CY + 36, { font: F.jp(700, 28), color: C.paper, align: 'center', alpha: a });
      x += 32;
    });
    if (t < 10.8) text(ctx, '次の一語', CX, CY + 36, { font: F.jp(700, 28), color: C.paper, align: 'center', alpha: ka * tw(t, 0.6, 0.6) });
    ctx.restore();

    // definitions, once the view has pulled back
    DEFS.forEach((d, i) => {
      const a = tw(t, 13.6 + i * 0.25, 0.6);
      if (a <= 0) return;
      const y = DEF_Y[i];
      ctx.fillStyle = [C.accent, C.ink2, C.ink][i];
      ctx.globalAlpha = a;
      ctx.fillRect(DEF_X, y - 30, 8, 72);
      ctx.globalAlpha = 1;
      text(ctx, d.name, DEF_X + 28, y, { font: F.jp(700, 32), color: C.ink, alpha: a });
      text(ctx, d.what, DEF_X + 28, y + 38, { font: F.jp(400, 21), color: C.ink2, alpha: a });
    });
  },
});
