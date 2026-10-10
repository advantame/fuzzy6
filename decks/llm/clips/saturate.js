// A test set that has been solved stops telling models apart. On SWE-bench Verified (500 real
// GitHub issues, judged by tests) the top three in Vals AI's archived results stand at 97.00,
// 96.40 and 96.20%, all run with mini-SWE-agent. OpenAI stopped reporting it on 2026-02-23: of
// the 138 tasks models failed most often, 59.4% had serious problems, and the problems and
// answers may have been seen in training. Vals dropped it from its index on 2026-08-13.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outExpo } from '../../../src/kit/ease.js';

const BASE = 640;
const TOPY = 250; // 100 %
const TOP3 = [
  { name: 'Claude Opus 5', v: 97.0 },
  { name: 'DeepSeek V4 Pro', sub: '（0813）', v: 96.4 },
  { name: 'GPT-5.6 Sol', v: 96.2 },
];
const BXS = [150, 330, 510];
const BW = 120;
const AUDIT = 138;
const BAD = 82; // 59.4 % of 138
const COLS = 23;
const CELL = 26;
const WX = 790;
const WY = 330;

export default clip({
  id: 'saturate',
  title: '満点に近い',
  kicker: 'SWE-bench Verified',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '課題集は、解かれ尽くすと差がつかなくなる。\nSWE-bench Verified では、上位のモデルが 96〜97% に並んだ。' },
    { at: 6.0, to: 11.2, text: 'OpenAI は 2026 年 2 月、この課題集の点を報告するのをやめた。\nよく失敗する 138 題を調べると、59.4% に重い問題があった。' },
    { at: 11.4, to: 18, text: 'テストの不備に加え、学習で問題と答えに触れた恐れもある。\n評価の中心は、新しい課題集に移っている。' },
  ],

  draw(ctx, t) {
    const ha = tw(t, 0.4, 0.5);
    const hw = text(ctx, 'SWE-bench Verified', M.l, 126, { font: F.sans(700, 30), color: C.ink, alpha: ha });
    text(ctx, '実際の GitHub の issue を直し、テストで成否を決める 500 題', M.l + hw + 20, 125, { font: F.jp(500, 19), color: C.ink2, alpha: ha });

    // ——— the top three, against the ceiling
    const ba = tw(t, 0.8, 0.5);
    ctx.save();
    ctx.globalAlpha = ba;
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(M.l + 40, TOPY);
    ctx.lineTo(BXS[2] + BW + 30, TOPY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.rule;
    ctx.fillRect(M.l + 40, BASE, BXS[2] + BW + 30 - M.l - 40, 2);
    ctx.restore();
    text(ctx, '100%', M.l + 30, TOPY + 6, { font: F.mono(600, 16), color: C.ink2, align: 'right', alpha: ba });
    text(ctx, '0', M.l + 30, BASE + 6, { font: F.mono(600, 16), color: C.muted, align: 'right', alpha: ba });
    TOP3.forEach((m, i) => {
      const at = 1.2 + i * 0.35;
      const a = tw(t, at, 0.4);
      if (a <= 0) return;
      const p = tw(t, at, 1.4, inOutCubic);
      const h = (BASE - TOPY) * (m.v / 100) * p;
      const x = BXS[i];
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = i === 0 ? C.accent : C.ink2;
      ctx.fillRect(x, BASE - h, BW, h);
      ctx.restore();
      text(ctx, `${(m.v * p).toFixed(1)}%`, x + BW / 2, BASE - h + 44, { font: F.cond(700, 34), color: '#fff', align: 'center', alpha: a * seg(h, 60, 90) });
      text(ctx, m.name, x + BW / 2, BASE + 32, { font: F.sans(600, 18), color: C.ink, align: 'center', alpha: a });
      if (m.sub) text(ctx, m.sub, x + BW / 2, BASE + 56, { font: F.jp(500, 15), color: C.ink2, align: 'center', alpha: a });
    });
    text(ctx, 'Vals AI の保存結果（2026-09-01 更新）。どれも mini-SWE-agent で動かした', M.l, BASE + 96, { font: F.jp(400, 16), color: C.muted, alpha: tw(t, 2.6, 0.5) });

    // ——— what OpenAI found in the tasks models kept failing
    const wa = tw(t, 6.0, 0.6);
    if (wa > 0) {
      text(ctx, 'OpenAI の調べ（2026-02-23）', WX, WY - 96, { font: F.jp(700, 22), color: C.ink, alpha: wa });
      text(ctx, 'よく失敗する 138 題を、一つずつ調べた', WX, WY - 64, { font: F.jp(500, 18), color: C.ink2, alpha: wa });
      const shown = Math.round(AUDIT * outExpo(seg(t, 6.3, 7.3)));
      const bad = Math.round(BAD * inOutCubic(seg(t, 7.6, 9.0)));
      for (let i = 0; i < shown; i++) {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        ctx.save();
        ctx.globalAlpha = wa;
        rr(ctx, WX + col * CELL, WY + row * CELL, CELL - 5, CELL - 5, 4);
        ctx.fillStyle = i < bad ? C.red : '#fff';
        ctx.fill();
        if (i >= bad) {
          ctx.strokeStyle = C.rule;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }
      const ra = tw(t, 8.6, 0.5);
      const y = WY + 6 * CELL + 64;
      const w = text(ctx, '59.4%', WX, y, { font: F.cond(700, 64), color: C.red, alpha: ra });
      text(ctx, 'に、テストや課題の重い問題', WX + w + 14, y - 6, { font: F.jp(700, 22), color: C.ink, alpha: ra });
      text(ctx, '500 題全体の割合ではない', WX, y + 34, { font: F.jp(500, 17), color: C.muted, alpha: ra });
    }

    // ——— where evaluation went next
    const na = tw(t, 11.4, 0.6);
    if (na > 0) {
      const y = 724;
      ctx.save();
      ctx.globalAlpha = na;
      ctx.fillStyle = C.rule;
      ctx.fillRect(WX, y - 36, (W - M.r - WX) * outExpo(na), 2);
      ctx.restore();
      text(ctx, '2026-08-13　Vals が総合の指標から外す', WX, y, { font: F.jp(500, 17), color: C.ink2, alpha: na });
      text(ctx, '次の課題集', WX, y + 34, { font: F.jp(700, 18), color: C.ink, alpha: tw(t, 11.8, 0.5) });
      let x = WX;
      ['SWE-bench Pro', 'Terminal-Bench', 'DeepSWE', 'Toolathlon-Verified'].forEach((s, i) => {
        const bw = tag(ctx, x, y + 46, s, { font: F.sans(600, 17), h: 36, padX: 14, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: tw(t, 12.0 + i * 0.25, 0.5) });
        x += bw + 12;
      });
    }

    source(ctx, 'Vals AI、OpenAI「Why SWE-bench Verified no longer measures frontier coding capabilities」（2026-02-23）', ha);
  },
});
