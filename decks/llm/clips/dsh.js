// DeepSeek Harness (dsh), released 2026-08-13 as an MIT developer preview: "Everything is a
// Plugin". The model connection, the tool registry, the session log and the agent loop are
// plugins too — "There is no privileged core to patch" (docs/architecture.md). The harness's
// parts come apart onto the framework that joins them; the model connection is swapped (the
// cost study of 11-5 ran dsh with Claude Sonnet 5); presets pick a set of parts. The README
// warns: "THERE WILL BE COMPATIBILITY-BREAKING CHANGES."

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, lerp, keys, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const TILES = [
  ['モデルの接続', null],
  ['ツールの登録', 'シェル、ファイル、検索'],
  ['セッションの記録', '追記するだけの記録'],
  ['エージェントのループ', '呼び出しがなくなるまで'],
  ['文脈の圧縮', '古い結果を要約する'],
  ['サンドボックス', 'Landlock、Seatbelt など'],
  ['子のエージェント', 'Claude Code や Codex にも'],
  ['MCP', '外のツールを足す'],
];
const TW_ = 300;
const TH = 92;
const GX = (W - 4 * TW_ - 3 * 36) / 2;
const tileX = (i) => GX + (i % 4) * (TW_ + 36);
// rows: packed inside one box, then apart on either side of the bus
const ROW_IN = [212, 316];
const ROW_OUT = [160, 384];
const BUS_Y = 322;
const OPEN = 2.4;
const SWAP = 7.0;
const PRESETS = [
  ['Standard', 'シェル、ファイル、計画、圧縮、子のエージェントなど'],
  ['Minimal', '公開時は、bash と編集の 2 つだけ'],
  ['Code（PTC）', 'ツールを、コードから組み合わせる'],
  ['Creator', '部品や画面を作るのを手伝う'],
];
const PRE = 11.4;

export default clip({
  id: 'dsh',
  title: 'すべてが部品',
  kicker: 'DeepSeek Harness',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'DeepSeek は 2026 年 8 月、自社のハーネスを MIT ライセンスで公開した。\n合言葉は「Everything is a Plugin」。' },
    { at: 6.0, to: 11.2, text: 'モデルとの接続、ツールの登録、記録、ループまでが部品で、\n差し替えられる。手を入れられない特別な中核はない、という。' },
    { at: 11.4, to: 18, text: '部品の組み合わせは、プリセットで選ぶ。\nまだ開発者向けの版で、互換性は崩れうると明記している。' },
  ],

  draw(ctx, t) {
    const open = inOutCubic(seg(t, OPEN, OPEN + 1.2));
    // ——— what it is
    const ha = tw(t, 0.4, 0.5);
    const hw = text(ctx, 'DeepSeek Harness', GX - 24, 106, { font: F.sans(700, 26), color: C.ink, alpha: ha });
    let hx = GX - 24 + hw + 16;
    ['dsh', 'MIT ライセンス', '2026-08-13 公開'].forEach((s, i) => {
      hx += tag(ctx, hx, 82, s, { font: i === 0 ? F.mono(600, 16) : F.jp(700, 16), h: 32, padX: 12, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: tw(t, 0.7 + i * 0.2, 0.4) }) + 10;
    });
    // ——— the harness as one box, which comes apart
    const boxA = tw(t, 0.4, 0.5) * (1 - open);
    if (boxA > 0) {
      ctx.save();
      ctx.globalAlpha = boxA;
      rr(ctx, GX - 24, ROW_IN[0] - 64, 4 * TW_ + 3 * 36 + 48, 2 * TH + 104 + 12, 22);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.restore();
      text(ctx, 'ハーネス', GX, ROW_IN[0] - 24, { font: F.jp(700, 24), color: C.ink, alpha: boxA });
    }
    // the bus that joins the parts
    const bus = tw(t, OPEN + 0.6, 0.6);
    if (bus > 0) {
      ctx.save();
      ctx.globalAlpha = bus;
      ctx.fillStyle = C.ink;
      rr(ctx, GX - 24, BUS_Y - 14, (4 * TW_ + 3 * 36 + 48) * outExpo(bus), 28, 14);
      ctx.fill();
      ctx.restore();
      text(ctx, '部品をつなぐ枠組み（Cordis）', W / 2, BUS_Y + 6, { font: F.jp(700, 17), color: C.paper, align: 'center', alpha: tw(t, OPEN + 1.0, 0.5) });
    }
    TILES.forEach(([name, sub], i) => {
      const a = tw(t, 0.6 + i * 0.12, 0.4);
      if (a <= 0) return;
      const r = i < 4 ? 0 : 1;
      const y = lerp(ROW_IN[r], ROW_OUT[r], open);
      const x = tileX(i);
      // its plug into the bus
      const plug = tw(t, OPEN + 0.9 + (i % 4) * 0.08, 0.4);
      if (plug > 0) {
        ctx.save();
        ctx.globalAlpha = plug;
        ctx.fillStyle = C.ink;
        const px = x + TW_ / 2 - 5;
        if (r === 0) ctx.fillRect(px, y + TH, 10, (BUS_Y - 14 - y - TH) * plug);
        else ctx.fillRect(px, BUS_Y + 14, 10, (y - BUS_Y - 14) * plug);
        ctx.restore();
      }
      const swapping = i === 0 ? seg(t, SWAP, SWAP + 0.8) : i === 3 ? seg(t, SWAP + 1.6, SWAP + 2.4) : 0;
      const flash = Math.sin(Math.PI * swapping);
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, x, y, TW_, TH, 14);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = flash > 0.01 ? C.accent : C.ink2;
      ctx.lineWidth = flash > 0.01 ? 2 + 3 * flash : 2;
      ctx.stroke();
      ctx.restore();
      text(ctx, name, x + 20, y + 38, { font: F.jp(700, 21), color: C.ink, alpha: a });
      if (i === 0) swapLine(ctx, t, x + 20, y + 70, ['DeepSeek V4', 'Claude Sonnet 5'], SWAP, a);
      else if (i === 3) swapLine(ctx, t, x + 20, y + 70, [sub, '別のループに替える'], SWAP + 1.6, a);
      else text(ctx, sub, x + 20, y + 70, { font: F.jp(500, 17), color: C.ink2, alpha: a });
    });
    // the claim, in its words
    const qa = tw(t, 9.4, 0.6);
    text(ctx, '“Everything is a Plugin”', GX, 538, { font: F.sans(600, 22), color: C.accent, alpha: tw(t, 1.6, 0.5) });
    text(ctx, '“There is no privileged core to patch”', GX + 330, 538, { font: F.sans(500, 20), color: C.ink2, alpha: qa });

    // ——— presets: which parts to use
    const pa = tw(t, PRE, 0.6);
    if (pa > 0) {
      ctx.save();
      ctx.globalAlpha = pa;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, 580, (W - M.l - M.r) * outExpo(pa), 2);
      ctx.restore();
      text(ctx, 'プリセット', M.l, 624, { font: F.jp(700, 21), color: C.ink, alpha: pa });
      PRESETS.forEach(([name, what], i) => {
        const a = tw(t, PRE + 0.3 + i * 0.25, 0.5);
        const x = M.l + 150 + (i % 2) * 640;
        const y = 600 + Math.floor(i / 2) * 60;
        const w = tag(ctx, x, y, name, { font: F.sans(700, 19), h: 40, padX: 16, fill: i === 1 ? C.accent : C.ink, color: '#fff', alpha: a });
        text(ctx, what, x + w + 14, y + 27, { font: F.jp(500, 18), color: C.ink2, alpha: a });
      });
      text(ctx, '開発者向けのプレビュー。“THERE WILL BE COMPATIBILITY-BREAKING CHANGES.”', M.l, 772, { font: F.jp(500, 17), color: C.red, alpha: tw(t, PRE + 1.6, 0.5) });
    }

    source(ctx, 'deepseek-ai/deepseek-harness の README と docs/architecture.md（公開 2026-08-13）', tw(t, 0.4, 0.5));
  },
});

// A line of text that changes from one value to the next at `at`, sliding up.
function swapLine(ctx, t, x, y, [from, to], at, a) {
  const p = inOutCubic(seg(t, at, at + 0.8));
  if (p < 1) text(ctx, from, x, y - 10 * p, { font: F.jp(500, 17), color: C.ink2, alpha: a * (1 - p) });
  if (p > 0) text(ctx, to, x, y + 10 * (1 - p), { font: F.jp(700, 17), color: C.accent, alpha: a * p });
}
