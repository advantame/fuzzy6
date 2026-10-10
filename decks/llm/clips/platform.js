// Lending the loop: OpenAI's "Codex as a platform: build on the open agent harness" (Nicolas Bonamy
// and Derrick Choi, 2026-08-19) — "The reusable part is the agent loop". Three ways in: codex exec
// for one-off jobs from scripts and CI, the Codex SDK to start and resume threads from code, and
// app-server to build conversation, progress, interruption and approval into an app. The CLI, the
// core harness, app-server and the TypeScript SDK are Apache-2.0; the IDE extensions and Codex
// cloud are not open.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr, arrow, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const HB = { x: 1000, y: 160, w: W - M.r - 1000, h: 360 };
const DOORS = [
  { name: 'codex exec', font: 'mono', what: 'スクリプトや CI から、1 回きりの仕事を頼む', at: 6.0 },
  { name: 'Codex SDK', font: 'sans', what: 'コードから thread を始め、続きを頼む', at: 6.8 },
  { name: 'app-server', font: 'mono', what: '自分のアプリに、会話、進み具合、中断、承認を組み込む', at: 7.6, hot: true },
];
const DX = M.l;
const DW = 720;
const DH = 96;
const doorY = (i) => 170 + i * 120;
const OPEN = 11.4;

export default clip({
  id: 'platform',
  title: 'ループを貸す',
  kicker: 'Codex as a platform',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'OpenAI は 2026 年 8 月、Codex のハーネスを自分の製品に\n組み込む道を示した。使い回せるのは、エージェントのループ。' },
    { at: 6.0, to: 11.2, text: '入口は三つ。1 回きりの仕事は codex exec、コードからは SDK、\n対話するアプリには app-server。' },
    { at: 11.4, to: 18, text: 'CLI、中核、app-server、SDK は Apache-2.0 で公開されている。\nIDE の拡張と Codex cloud は公開していない。' },
  ],

  draw(ctx, t) {
    // ——— the harness, with its loop
    const ha = tw(t, 0.4, 0.6, (p) => outBack(p, 1.3));
    if (ha > 0) {
      const a = Math.min(1, ha);
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, HB.x, HB.y, HB.w, HB.h, 22);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, 'Codex のハーネス', HB.x + 28, HB.y + 46, { font: F.jp(700, 26), color: C.paper, alpha: a });
      loop(ctx, t, HB.x + HB.w / 2, HB.y + 200, a);
      text(ctx, 'エージェントのループ', HB.x + HB.w / 2, HB.y + 330, { font: F.jp(700, 22), color: C.accent, align: 'center', alpha: tw(t, 1.6, 0.5) });
    }
    text(ctx, '“The reusable part is the agent loop”', HB.x, HB.y + HB.h + 40, { font: F.sans(500, 19), color: C.ink2, alpha: tw(t, 2.4, 0.6) });
    text(ctx, 'Bonamy・Choi「Codex as a platform」（2026-08-19）', HB.x, HB.y + HB.h + 68, { font: F.jp(400, 16), color: C.muted, alpha: tw(t, 2.6, 0.6) });

    // ——— three ways in
    const da = tw(t, 5.8, 0.5);
    text(ctx, '入口', DX, 140, { font: F.jp(700, 22), color: C.ink, alpha: da });
    DOORS.forEach((d, i) => {
      const a = tw(t, d.at, 0.5);
      if (a <= 0) return;
      const y = doorY(i);
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, DX, y, DW, DH, 14);
      ctx.fillStyle = d.hot ? C.accentSoft : '#fff';
      ctx.fill();
      ctx.strokeStyle = d.hot ? C.accent : C.ink2;
      ctx.lineWidth = d.hot ? 3 : 2;
      ctx.stroke();
      ctx.strokeStyle = d.hot ? C.accent : C.ink2;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = d.hot ? 3 : 2.5;
      arrow(ctx, DX + DW + 14, y + DH / 2, HB.x - 14, HB.y + 120 + i * 60, inOutCubic(seg(t, d.at + 0.2, d.at + 0.7)), 12);
      ctx.restore();
      text(ctx, d.name, DX + 26, y + 42, { font: d.font === 'mono' ? F.mono(600, 24) : F.sans(700, 24), color: C.ink, alpha: a });
      text(ctx, d.what, DX + 26, y + 76, { font: F.jp(500, 18), color: C.ink2, alpha: a });
    });

    // ——— what is open
    const oa = tw(t, OPEN, 0.6);
    if (oa > 0) {
      const y = 660;
      ctx.save();
      ctx.globalAlpha = oa;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 46, (W - M.l - M.r) * outExpo(oa), 2);
      ctx.restore();
      text(ctx, 'Apache-2.0 で公開', M.l, y, { font: F.jp(700, 21), color: C.green, alpha: oa });
      let x = M.l + 210;
      ['CLI', '中核（core）', 'app-server', 'TypeScript SDK'].forEach((s, i) => {
        x += tag(ctx, x, y - 28, s, { font: F.jp(700, 18), h: 40, padX: 16, fill: C.greenSoft, color: C.green, alpha: tw(t, OPEN + 0.3 + i * 0.2, 0.4) }) + 12;
      });
      const na = tw(t, OPEN + 1.4, 0.5);
      text(ctx, '公開していない', M.l, y + 62, { font: F.jp(700, 21), color: C.ink2, alpha: na });
      x = M.l + 210;
      ['IDE の拡張', 'Codex cloud'].forEach((s, i) => {
        x += tag(ctx, x, y + 34, s, { font: F.jp(700, 18), h: 40, padX: 16, fill: C.panel, color: C.ink2, alpha: tw(t, OPEN + 1.6 + i * 0.2, 0.4) }) + 12;
      });
      text(ctx, 'Codex CLI は 2025 年 4 月からオープンソース', W - M.r, y + 62, { font: F.jp(500, 17), color: C.muted, align: 'right', alpha: tw(t, OPEN + 2.0, 0.5) });
    }

    source(ctx, 'OpenAI（2026-08-19）、developers.openai.com/codex/open-source', tw(t, 0.4, 0.5));
  },
});

// The loop inside the harness: three steps on a ring, with a dot going round.
function loop(ctx, t, cx, cy, a) {
  const R = 86;
  const steps = ['モデルを呼ぶ', 'ツールを動かす', '結果を足す'];
  ctx.save();
  ctx.globalAlpha = a * 0.9;
  ctx.strokeStyle = '#6d675d';
  ctx.fillStyle = '#6d675d';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  for (let k = 0; k < 3; k++) {
    const ang = -Math.PI / 2 + (k + 0.5) * ((Math.PI * 2) / 3);
    arrowHead(ctx, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, ang + Math.PI / 2, 11);
  }
  ctx.restore();
  // the dot runs under the labels
  const ang = -Math.PI / 2 + ((t * 0.9) % 1) * Math.PI * 2;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.arc(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  steps.forEach((s, k) => {
    const ang = -Math.PI / 2 + k * ((Math.PI * 2) / 3);
    const x = cx + Math.cos(ang) * R;
    const y = cy + Math.sin(ang) * R;
    tag(ctx, x, y - 16, s, { font: F.jp(700, 15), h: 32, padX: 12, fill: C.paper, color: C.ink, align: 'center', alpha: a * tw(t, 0.9 + k * 0.2, 0.4) });
  });
}
