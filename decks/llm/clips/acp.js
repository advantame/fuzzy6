// Joining editors and harnesses: the Agent Client Protocol (ACP), published by Zed on 2025-08-27
// with Google's Gemini CLI team — JSON-RPC 2.0, newline-delimited over a child process's stdio for
// local agents. Gemini CLI was the first integration; Claude Code joins through an adapter around
// the Claude Agent SDK (Zed beta 2025-09-03); Codex through an adapter that runs app-server and
// translates (2025-10-16); DeepSeek Harness has an acp profile for automation. MCP joins the
// harness to tools; ACP joins the editor to the harness.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr, arrow, line } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const ED = { x: M.l, y: 230, w: 230, h: 260 };
const AX = 560;
const AW = 560;
const TL = { x: 1290, y: 230, w: W - M.r - 1290, h: 260 };
const AGENTS = [
  { name: 'Gemini CLI', how: '最初の対応', when: '2025-08', at: 1.6 },
  { name: 'Claude Code', how: 'アダプターを挟む', when: '2025-09', at: 6.0 },
  { name: 'Codex', how: 'アダプター → app-server', when: '2025-10', at: 6.8, hot: true },
  { name: 'DeepSeek Harness', how: 'acp プロファイル（自動化向け）', when: '', at: 11.4, script: true },
];
const rowY = (i) => 166 + i * 110;
const METHODS = ['session/new', 'session/prompt', 'session/update', 'session/request_permission', 'session/cancel'];

export default clip({
  id: 'acp',
  title: 'エディタとつなぐ',
  kicker: 'ACP',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'MCP がツールとの差し込み口なら、ACP はエディタとの差し込み口。\nZed が Gemini CLI のチームと作り、2025 年 8 月に公開した。' },
    { at: 6.0, to: 11.2, text: 'Claude Code と Codex は、間に入るアダプターでつながる。\nCodex のアダプターは、裏で app-server を動かしている。' },
    { at: 11.4, to: 18, text: 'DeepSeek Harness にも、ACP で話す自動化向けの形がある。\n口がそろえば、エディタとハーネスを組み替えられる。' },
  ],

  draw(ctx, t) {
    // ——— the editor
    const ea = tw(t, 0.4, 0.5);
    block(ctx, ED, 'エディタ', ea, C.blue);
    tag(ctx, ED.x + ED.w / 2, ED.y + 120, 'Zed', { font: F.sans(700, 20), h: 40, padX: 18, fill: '#fff', color: C.blue, align: 'center', alpha: ea });
    text(ctx, 'ACP に対応した', ED.x + ED.w / 2, ED.y + 196, { font: F.jp(500, 16), color: '#d9e2ff', align: 'center', alpha: ea });
    text(ctx, 'ほかのエディタも', ED.x + ED.w / 2, ED.y + 220, { font: F.jp(500, 16), color: '#d9e2ff', align: 'center', alpha: ea });

    // ——— the tools, on the other side
    const ta = tw(t, 0.8, 0.5);
    block(ctx, TL, 'ツール', ta, C.ink2);
    text(ctx, 'ファイル、シェル、', TL.x + TL.w / 2, TL.y + 130, { font: F.jp(500, 16), color: C.paper, align: 'center', alpha: ta });
    text(ctx, 'MCP サーバー', TL.x + TL.w / 2, TL.y + 154, { font: F.jp(500, 16), color: C.paper, align: 'center', alpha: ta });

    // ——— the agents in the middle
    text(ctx, 'エージェント（ハーネス）', AX, 144, { font: F.jp(700, 20), color: C.ink, alpha: tw(t, 1.2, 0.5) });
    AGENTS.forEach((g, i) => {
      const a = tw(t, g.at, 0.5);
      if (a <= 0) return;
      const y = rowY(i);
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, AX, y, AW, 72, 12);
      ctx.fillStyle = g.hot ? C.accentSoft : '#fff';
      ctx.fill();
      ctx.strokeStyle = g.hot ? C.accent : C.rule;
      ctx.lineWidth = g.hot ? 2.5 : 1.5;
      ctx.stroke();
      ctx.restore();
      text(ctx, g.name, AX + 20, y + 44, { font: F.sans(700, 21), color: C.ink, alpha: a });
      text(ctx, g.how, AX + 230, y + 44, { font: F.jp(500, 17), color: C.ink2, alpha: a });
      if (g.when) text(ctx, g.when, AX + AW - 18, y + 44, { font: F.cond(700, 18), color: C.muted, align: 'right', alpha: a });
      const sw = g.script ? tag(ctx, ED.x, y + 18, 'スクリプトなど', { font: F.jp(700, 17), h: 36, padX: 14, fill: '#fff', stroke: C.blue, color: C.blue, alpha: a }) : 0;
      // ACP from the editor, MCP on to the tools
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = C.blue;
      ctx.fillStyle = C.blue;
      ctx.lineWidth = 2;
      if (g.script) {
        // automation: driven by a script rather than an editor
        ctx.setLineDash([7, 6]);
        arrow(ctx, ED.x + sw + 12, y + 36, AX - 12, y + 36, inOutCubic(seg(t, g.at, g.at + 0.5)), 10);
        ctx.setLineDash([]);
      } else arrow(ctx, ED.x + ED.w + 12, ED.y + ED.h / 2, AX - 12, y + 36, inOutCubic(seg(t, g.at, g.at + 0.5)), 10);
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      arrow(ctx, AX + AW + 12, y + 36, TL.x - 12, TL.y + TL.h / 2, inOutCubic(seg(t, g.at + 0.3, g.at + 0.8)), 10);
      ctx.restore();
    });
    // the two protocols, named on their wires
    tag(ctx, (ED.x + ED.w + AX) / 2, 112, 'ACP', { font: F.sans(700, 22), h: 40, padX: 18, fill: C.blue, color: '#fff', align: 'center', alpha: tw(t, 1.0, 0.5) });
    text(ctx, 'JSON-RPC 2.0、stdio', (ED.x + ED.w + AX) / 2, 176, { font: F.jp(500, 15), color: C.ink2, align: 'center', alpha: tw(t, 1.4, 0.5) });
    tag(ctx, (AX + AW + TL.x) / 2, 112, 'MCP', { font: F.sans(700, 22), h: 40, padX: 18, fill: C.ink2, color: '#fff', align: 'center', alpha: tw(t, 1.0, 0.5) });
    // Codex's adapter, unfolded
    const cx = tw(t, 7.6, 0.5);
    if (cx > 0) {
      const y = rowY(2) + 72;
      text(ctx, 'ACP → アダプター → app-server → Codex のハーネス', AX + 20, y + 24, { font: F.jp(700, 16), color: C.accent, alpha: cx });
    }

    // ——— what ACP standardises
    const ma = tw(t, 12.6, 0.6);
    if (ma > 0) {
      const y = 650;
      ctx.save();
      ctx.globalAlpha = ma;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 30, (W - M.l - M.r) * outExpo(ma), 2);
      ctx.restore();
      text(ctx, 'ACP が決めるやりとり', M.l, y + 30, { font: F.jp(700, 19), color: C.ink, alpha: ma });
      let x = M.l + 220;
      METHODS.forEach((s, i) => {
        x += tag(ctx, x, y + 6, s, { font: F.mono(600, 16), h: 36, padX: 12, fill: '#fff', stroke: C.blue, color: C.blue, alpha: tw(t, 12.8 + i * 0.15, 0.4) }) + 10;
      });
      text(ctx, 'モデルの重みやツールの中身までは決めない', M.l, y + 84, { font: F.jp(500, 16), color: C.muted, alpha: tw(t, 13.8, 0.5) });
    }

    source(ctx, 'Zed（2025-08-27、09-03、10-16）、agentclientprotocol の仕様、codex-acp、deepseek-harness の acp', ea);
  },
});

// A coloured block with a title.
function block(ctx, b, name, a, fill) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, b.x, b.y, b.w, b.h, 20);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  text(ctx, name, b.x + b.w / 2, b.y + 56, { font: F.jp(700, 26), color: '#fff', align: 'center', alpha: a });
}
