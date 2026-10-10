// The smallest configuration. dsh's Minimal preset at release (0.1.0-rc.5, 2026-08-13) kept two
// tools — a persistent bash and str_replace_editor — a one-line persona, no runtime context and
// no compaction. DeepSeek-V4-Pro-0813's model card measured its coding-agent benchmarks with
// "DeepSeek Harness minimal". Earlier small harnesses: Anthropic's two tools for 49% on SWE-bench
// Verified (2025-01-06) and mini-SWE-agent (2025-07), which SWE-bench uses to compare models.
// The Standard tool list shows the main ones only.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const STANDARD = ['シェル', 'ファイルを読む', 'ファイルを書く', '編集', '検索', 'ジョブ', 'スキル', '目標', '計画', '圧縮', '子のエージェント', '人に質問'];
const KEEP = { 0: 0, 3: 1 }; // shell and edit stay
const GW = 190;
const GH = 60;
const GAP = 14;
const GX = M.l;
const GY = 168;
const cellX = (i) => GX + (i % 4) * (GW + GAP);
const cellY = (i) => GY + Math.floor(i / 4) * (GH + GAP);
const KW = 380;
const KH = 120;
const KX = (k) => GX + k * (KW + 22);
const KY = 196;
const CUT = 2.2;
const PX = 960;
const PW = W - M.r - PX;
const PREV = 11.4;
const PRECEDENTS = [
  { when: '2025 年 1 月', who: 'Anthropic', what: ['bash と str_replace_editor の 2 つで', 'SWE-bench Verified 49%'] },
  { when: '2025 年 7 月', who: 'mini-SWE-agent', what: ['bash を中心に、エージェントの', 'クラスは約 100 行'] },
  { when: '2026 年 8 月', who: 'DeepSeek', what: ['自社のモデルのコーディングの', '点を、minimal で測った'], hot: true },
];

export default clip({
  id: 'minimal',
  title: '最小の構成',
  kicker: 'Minimal',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'dsh の Minimal は、公開のとき、ツールを二つだけ持っていた。\n続けて使えるシェルと、文字列を置き換える編集のツール。' },
    { at: 6.0, to: 11.2, text: '指示は 1 行で、圧縮もしない。DeepSeek は自社のモデルの\nコーディングの点を、この構成で測ったと書いている。' },
    { at: 11.4, to: 18, text: '同じ二つのツールで、Anthropic は 2025 年 1 月に 49% を出した。\n小さなハーネスにそろえると、モデルどうしを比べやすい。' },
  ],

  draw(ctx, t) {
    // ——— from the standard set down to two tools
    const cut = inOutCubic(seg(t, CUT, CUT + 1.2));
    const ha = tw(t, 0.4, 0.5);
    // the heading changes once the old one is gone
    text(ctx, 'Standard の主なツール', GX, GY - 30, { font: F.jp(700, 22), color: C.ink, alpha: ha * (1 - seg(t, CUT, CUT + 0.4)) });
    text(ctx, 'Minimal（公開のとき）', GX, GY - 30, { font: F.jp(700, 22), color: C.accent, alpha: tw(t, CUT + 0.6, 0.5) });
    STANDARD.forEach((s, i) => {
      const a = tw(t, 0.6 + i * 0.06, 0.4);
      if (a <= 0) return;
      const k = KEEP[i];
      if (k == null) {
        const fade = 1 - inOutCubic(seg(t, CUT, CUT + 0.6));
        if (fade <= 0) return;
        tile(ctx, cellX(i), cellY(i), GW, GH, s, a * fade, false);
        return;
      }
      const x = lerp(cellX(i), KX(k), cut);
      const y = lerp(cellY(i), KY, cut);
      const w = lerp(GW, KW, cut);
      const h = lerp(GH, KH, cut);
      tile(ctx, x, y, w, h, cut > 0.5 ? ['bash', 'str_replace_editor'][k] : s, a, cut > 0.5);
    });
    // what the two do
    [['シェルの状態が続く（cd や変数が残る）'], ['文字列を置き換えて、ファイルを直す']].forEach(([s], k) => {
      text(ctx, s, KX(k) + 22, KY + 92, { font: F.jp(500, 16), color: C.ink2, alpha: tw(t, CUT + 1.4 + k * 0.3, 0.5) });
    });
    text(ctx, 'ツールは 2 つ', GX, KY + KH + 54, { font: F.jp(700, 24), color: C.ink, alpha: tw(t, CUT + 2.2, 0.5) });

    // ——— the instructions: many lines, then one
    const pa = tw(t, 1.0, 0.5);
    const shrink = inOutCubic(seg(t, 6.0, 6.9));
    const ph = lerp(300, 130, shrink);
    ctx.save();
    ctx.globalAlpha = pa;
    rr(ctx, PX, GY - 4, PW, ph, 14);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = C.rule;
    const lines = Math.round(lerp(13, 0, shrink));
    for (let k = 0; k < lines; k++) ctx.fillRect(PX + 22, GY + 52 + k * 18, (PW - 44) * (0.55 + 0.45 * (((k * 41) % 10) / 10)), 6);
    ctx.restore();
    text(ctx, '指示', PX + 22, GY + 30, { font: F.jp(700, 19), color: C.ink, alpha: pa });
    text(ctx, 'Standard：長い指示と、実行時の文脈', PX + 80, GY + 29, { font: F.jp(500, 16), color: C.ink2, alpha: pa * (1 - seg(t, 6.0, 6.3)) });
    text(ctx, 'Minimal：1 行だけ', PX + 80, GY + 29, { font: F.jp(500, 16), color: C.accent, alpha: tw(t, 6.4, 0.4) });
    text(ctx, '“You are a helpful software engineer assistant.”', PX + 22, GY + 82, { font: F.sans(500, 18), color: C.ink, alpha: tw(t, 6.7, 0.5) });
    let fx = PX;
    ['圧縮しない', '実行時の文脈を足さない'].forEach((s, i) => {
      fx += tag(ctx, fx, GY + 150, s, { font: F.jp(700, 17), h: 36, padX: 14, fill: C.ink, color: C.paper, alpha: tw(t, 7.3 + i * 0.3, 0.5) }) + 12;
    });
    const ma = tw(t, 8.4, 0.5);
    text(ctx, 'DeepSeek-V4-Pro-0813 のモデルカード', PX, GY + 236, { font: F.jp(700, 18), color: C.ink, alpha: ma });
    text(ctx, 'コーディングのエージェント課題は、minimal、', PX, GY + 266, { font: F.jp(500, 17), color: C.ink2, alpha: ma });
    text(ctx, 'effort max、temperature 1.0、top_p 0.95 で測った', PX, GY + 292, { font: F.jp(500, 17), color: C.ink2, alpha: ma });

    // ——— small harnesses before it
    const va = tw(t, PREV, 0.6);
    if (va > 0) {
      const y = 560;
      ctx.save();
      ctx.globalAlpha = va;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 34, (W - M.l - M.r) * outExpo(va), 2);
      ctx.restore();
      text(ctx, '小さなハーネスの前例', M.l, y + 4, { font: F.jp(700, 21), color: C.ink, alpha: va });
      PRECEDENTS.forEach((p, i) => {
        const a = tw(t, PREV + 0.3 + i * 0.35, 0.5);
        const x = M.l + i * 480;
        const yy = y + 28;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = p.hot ? C.accent : C.ink2;
        ctx.fillRect(x, yy, 4, 120);
        ctx.restore();
        const w = text(ctx, p.when, x + 18, yy + 26, { font: F.cond(700, 22), color: C.ink, alpha: a });
        text(ctx, p.who, x + 18 + w + 12, yy + 26, { font: F.sans(700, 21), color: p.hot ? C.accent : C.ink, alpha: a });
        p.what.forEach((s, k) => text(ctx, s, x + 18, yy + 62 + k * 28, { font: F.jp(500, 18), color: C.ink2, alpha: a }));
      });
      text(ctx, 'SWE-bench の「Bash Only」表は、モデルを比べるために全モデルを mini-SWE-agent で動かす', M.l, y + 196, { font: F.jp(400, 16), color: C.muted, alpha: tw(t, PREV + 1.6, 0.5) });
    }

    source(ctx, 'deepseek-harness 0.1.0-rc.5 の Minimal、モデルカード、Anthropic（2025-01-06）、mini-SWE-agent', ha);
  },
});

// A tool tile; the two kept ones become larger, mono-named and outlined in vermilion.
function tile(ctx, x, y, w, h, s, a, kept) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, w, h, 12);
  ctx.fillStyle = kept ? C.accentSoft : '#fff';
  ctx.fill();
  ctx.strokeStyle = kept ? C.accent : C.rule;
  ctx.lineWidth = kept ? 3 : 1.5;
  ctx.stroke();
  ctx.restore();
  if (kept) text(ctx, s, x + 22, y + 46, { font: F.mono(600, 26), color: C.ink, alpha: a });
  else text(ctx, s, x + w / 2, y + h / 2 + 7, { font: F.jp(700, 18), color: C.ink, align: 'center', alpha: a });
}
