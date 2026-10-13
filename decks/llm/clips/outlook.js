// Outlook. The rings of 7-10 (LLM inside the chatbot inside the agent) come back, and the view
// pulls out to a fourth ring — what drives harnesses from outside and gathers many threads
// (app-server, ACP, 11-8 to 11-11) — and to a dashed fifth ring for onorca.dev. The onorca.dev
// part is a placeholder: the Boss asked (2026-10-10) for it to stay an outlook, not researched yet.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import { text, circle } from '../../../src/kit/draw.js';
import { tw, seg, keys, inOutCubic, outBack } from '../../../src/kit/ease.js';

const CX = 560;
const CY = 470;
const R = [362, 300, 220, 145, 72]; // onorca.dev, gathering, agent, chatbot, LLM
const ZOOM = [[0, 1.55], [2.6, 1.55], [5.0, 1.0]];
const RINGS = [
  { name: 'エージェント', at: 0.2 },
  { name: 'チャットボット', at: 0.1 },
  { name: 'LLM', at: 0 },
];
const DEFS = [
  { name: 'onorca.dev', what: '展望', color: C.accent, dashed: true },
  { name: '束ねる仕組み', what: '外からハーネスを動かし、束ねる', color: C.blue },
  { name: 'エージェント', what: 'ハーネスが、ループで回す', color: C.ink2 },
  { name: 'チャットボット', what: '会話の形をした文書の、続きを書く', color: C.muted },
  { name: 'LLM', what: '次の一語を予測する', color: C.ink },
];
const DX = 1080;

export default clip({
  id: 'outlook',
  title: 'この先へ',
  kicker: '展望',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '次の一語を予測するモデルを、チャットボットが包み、\nハーネスがループで回して、エージェントになる。' },
    { at: 6.0, to: 11.2, text: 'ハーネスが開き、外から動かせるようになった。\nその外側に、多くのエージェントを束ねる仕組みを作れる。' },
    { at: 11.4, to: 18, text: 'この先の展望は、onorca.dev へ。' },
  ],

  draw(ctx, t) {
    const z = keys(t, ZOOM, inOutCubic);
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(z, z);
    ctx.translate(-CX, -CY);

    // the outer two rings come in as the view pulls back
    const g4 = tw(t, 4.2, 0.9, (p) => outBack(p, 1.2));
    if (g4 > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, g4);
      ctx.fillStyle = C.blueSoft;
      circle(ctx, CX, CY, R[1] * Math.min(1.03, g4));
      ctx.fill();
      ctx.restore();
    }
    const g5 = tw(t, 8.0, 1.0);
    if (g5 > 0) {
      ctx.save();
      ctx.globalAlpha = g5;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 4 / z;
      ctx.setLineDash([16 / z, 12 / z]);
      ctx.lineDashOffset = -t * 24;
      circle(ctx, CX, CY, R[0]);
      ctx.stroke();
      ctx.restore();
    }
    // the three rings of 6-10
    const fills = ['#e6e0d3', C.paper, C.ink];
    [R[2], R[3], R[4]].forEach((r, i) => {
      const g = tw(t, RINGS[i].at, 0.8, (p) => outBack(p, 1.3));
      ctx.fillStyle = fills[i];
      circle(ctx, CX, CY, r * Math.min(1.04, g));
      ctx.fill();
      ctx.strokeStyle = i === 2 ? C.ink : C.ink2;
      ctx.lineWidth = 3 / z;
      ctx.stroke();
    });
    text(ctx, 'エージェント', CX, CY - R[2] + 34, { font: F.jp(700, 22), color: C.ink, align: 'center', alpha: tw(t, 0.6, 0.5) });
    text(ctx, 'チャットボット', CX, CY - R[3] + 30, { font: F.jp(700, 18), color: C.ink, align: 'center', alpha: tw(t, 0.6, 0.5) });
    text(ctx, 'LLM', CX, CY - 4, { font: F.sans(700, 26), color: C.paper, align: 'center', alpha: tw(t, 0.4, 0.5) });
    text(ctx, '次の一語', CX, CY + 26, { font: F.jp(700, 15), color: '#bdb6a9', align: 'center', alpha: tw(t, 0.8, 0.5) });
    // the loop runs round the agent band
    const ang = -Math.PI / 2 + t * 1.2;
    ctx.save();
    ctx.globalAlpha = tw(t, 1.0, 0.5);
    ctx.fillStyle = C.accent;
    circle(ctx, CX + Math.cos(ang) * 183, CY + Math.sin(ang) * 183, 8);
    ctx.fill();
    ctx.restore();
    // the gathering ring and what it is made of
    if (g4 > 0) {
      const a = Math.min(1, g4);
      text(ctx, '束ねる仕組み', CX, CY - R[1] + 34, { font: F.jp(700, 22), color: C.blue, align: 'center', alpha: a });
      [['app-server', 2.5], ['ACP', 0.9], ['多くの thread', 0.0]].forEach(([s, k], i) => {
        const an = Math.PI * (0.15 + k * 0.33);
        tag(ctx, CX + Math.cos(an) * 260, CY + Math.sin(an) * 260 - 16, s, { font: s === '多くの thread' ? F.jp(700, 15) : F.mono(600, 15), h: 32, padX: 12, fill: '#fff', color: C.blue, align: 'center', alpha: a * tw(t, 5.2 + i * 0.3, 0.4) });
      });
    }
    if (g5 > 0) {
      text(ctx, 'onorca.dev', CX, CY - R[0] - 16, { font: F.sans(700, 30), color: C.accent, align: 'center', alpha: g5 });
    }
    ctx.restore();

    // ——— the rings, named
    DEFS.forEach((d, i) => {
      const a = tw(t, 11.6 + i * 0.25, 0.5);
      if (a <= 0) return;
      const y = 214 + i * 112;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = d.color;
      if (d.dashed) {
        for (let k = 0; k < 5; k++) ctx.fillRect(DX, y - 30 + k * 15, 8, 9);
      } else ctx.fillRect(DX, y - 30, 8, 72);
      ctx.restore();
      text(ctx, d.name, DX + 28, y, { font: d.dashed ? F.sans(700, 30) : F.jp(700, 26), color: d.dashed ? C.accent : C.ink, alpha: a });
      text(ctx, d.what, DX + 28, y + 34, { font: F.jp(400, 18), color: C.ink2, alpha: a });
    });
  },
});
