// MCP, why: wiring every application to every tool takes apps × tools connections; one shared
// protocol in the middle takes apps + tools. App and tool names are generic examples.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source } from '../lib/parts.js';
import { text, rr, line } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const APPS = ['チャット', 'エディタ', 'エージェント'];
const TOOLS = ['GitHub', 'Slack', 'データベース', 'ファイル'];
const APP = { x: M.l, w: 250, h: 92, ys: [236, 436, 636] };
const TOOL = { w: 270, h: 80, ys: [196, 346, 496, 646] };
const TOOL_X = W - M.r - TOOL.w;
const HUB = { x: 760, w: 88, y: 186, h: 560 };
const SWAP = 5.8;

export default clip({
  id: 'mcp',
  title: '共通の差し込み口',
  kicker: 'MCP（2024）',
  duration: 16.5,
  cues: [
    { at: 0.4, to: 5.6, text: 'アプリとツールを一つずつつなぐと、\n組み合わせの数だけ、つなぐ作業が要る。' },
    { at: 5.8, to: 10.9, text: '2024 年 11 月、Anthropic はツールをつなぐ共通の規格 **MCP** を公開した。' },
    { at: 11.1, to: 18, text: 'ツールの側を一度 MCP に合わせれば、\n対応するどのアプリからも使える。' },
  ],

  draw(ctx, t) {
    const appMid = (i) => APP.ys[i] + APP.h / 2;
    const toolMid = (j) => TOOL.ys[j] + TOOL.h / 2;
    const swap = inOutCubic(seg(t, SWAP, SWAP + 1.0));

    // every app wired to every tool
    const wires = tw(t, 1.4, 1.6, inOutCubic) * (1 - swap);
    if (wires > 0) {
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.75;
      APPS.forEach((_, i) =>
        TOOLS.forEach((__, j) => {
          const k = (i * TOOLS.length + j) / (APPS.length * TOOLS.length);
          line(ctx, APP.x + APP.w, appMid(i), TOOL_X, toolMid(j), seg(wires, k * 0.6, k * 0.6 + 0.4));
        }),
      );
      ctx.globalAlpha = 1;
    }
    // …or each wired once, to the hub
    if (swap > 0) {
      const hubP = tw(t, SWAP + 0.3, 0.6, (q) => outBack(q, 1.4));
      ctx.save();
      ctx.globalAlpha = Math.min(1, hubP);
      rr(ctx, HUB.x, HUB.y, HUB.w, HUB.h, 16);
      ctx.fillStyle = C.accent;
      ctx.fill();
      ctx.translate(HUB.x + HUB.w / 2, HUB.y + HUB.h / 2);
      ctx.rotate(-Math.PI / 2);
      text(ctx, 'MCP', 0, 0, { font: F.sans(700, 44), color: '#fff', align: 'center', base: 'middle', ls: 6 });
      ctx.restore();
      text(ctx, 'Model Context Protocol', HUB.x + HUB.w / 2, HUB.y + HUB.h + 36, { font: F.sans(500, 19), color: C.accent, align: 'center', alpha: Math.min(1, hubP) });
      const link = tw(t, SWAP + 0.8, 1.0, inOutCubic);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 4;
      APPS.forEach((_, i) => line(ctx, APP.x + APP.w, appMid(i), HUB.x, appMid(i), seg(link, i * 0.1, i * 0.1 + 0.6)));
      TOOLS.forEach((_, j) => line(ctx, HUB.x + HUB.w, toolMid(j), TOOL_X, toolMid(j), seg(link, 0.3 + j * 0.05, 0.8 + j * 0.05)));
    }

    // boxes on both sides
    APPS.forEach((name, i) => {
      const a = tw(t, 0.3 + i * 0.12, 0.5, (q) => outBack(q, 1.5));
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      rr(ctx, APP.x, APP.ys[i], APP.w, APP.h, 14);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, name, APP.x + APP.w / 2, appMid(i) + 2, { font: F.jp(700, 26), color: C.paper, align: 'center', base: 'middle', alpha: Math.min(1, a) });
    });
    text(ctx, 'AI アプリ', APP.x, APP.ys[0] - 30, { font: F.jp(700, 22), color: C.ink2, alpha: tw(t, 0.3, 0.5) });
    TOOLS.forEach((name, j) => {
      const a = tw(t, 0.6 + j * 0.12, 0.5, (q) => outBack(q, 1.5));
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      rr(ctx, TOOL_X, TOOL.ys[j], TOOL.w, TOOL.h, 14);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.restore();
      text(ctx, name, TOOL_X + TOOL.w / 2, toolMid(j) + 2, { font: F.jp(700, 26), color: C.ink, align: 'center', base: 'middle', alpha: Math.min(1, a) });
    });
    text(ctx, 'ツール・データ', TOOL_X, TOOL.ys[0] - 30, { font: F.jp(700, 22), color: C.ink2, alpha: tw(t, 0.6, 0.5) });

    // the count
    const c1 = tw(t, 3.0, 0.5) * (1 - swap);
    const c2 = tw(t, SWAP + 1.6, 0.5);
    const cx = (APP.x + APP.w + TOOL_X) / 2;
    if (c1 > 0) text(ctx, '3 × 4 = 12 本の接続', cx, 840, { font: F.jp(700, 32), color: C.ink, align: 'center', alpha: c1 });
    if (c2 > 0) text(ctx, '3 + 4 = 7 本の接続', cx, 840, { font: F.jp(700, 32), color: C.accent, align: 'center', alpha: c2 });
    const q = tw(t, 11.4, 0.6);
    if (q > 0) {
      text(ctx, '「AI アプリのための USB-C ポート」', cx, 128, { font: F.jp(700, 26), color: C.ink, align: 'center', alpha: q });
      text(ctx, 'MCP の公式な説明より', cx, 160, { font: F.jp(400, 18), color: C.muted, align: 'center', alpha: q });
    }
    source(ctx, 'Anthropic（2024 年 11 月 25 日）', tw(t, SWAP + 0.6, 0.6));
  },
});
