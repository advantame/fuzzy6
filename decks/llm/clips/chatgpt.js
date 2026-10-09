// 2022, ChatGPT: how fast it reached 100 million monthly users, set against TikTok and
// Instagram, then the first million in five days.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { COL, yearBlock, source } from '../lib/parts.js';
import { text } from '../../../src/kit/draw.js';
import { tw, outExpo, outCubic } from '../../../src/kit/ease.js';

const PX = 29; // pixels per month
const BARS = [
  { name: 'Instagram', months: 30, label: '約 2 年半', at: 4.9, dur: 1.4 },
  { name: 'TikTok', months: 9, label: '約 9 か月', at: 6.5, dur: 0.8 },
  { name: 'ChatGPT', months: 2, label: '約 2 か月', at: 7.6, dur: 0.4, hot: true },
];
const TOP = 248;
const ROW = 112;

export default clip({
  id: 'chatgpt',
  title: 'ChatGPT',
  kicker: '2022 · OpenAI',
  duration: 15,
  cues: [
    { at: 0.4, to: 4.4, text: '2022 年 11 月 30 日、OpenAI が ChatGPT を研究プレビューとして公開した。' },
    { at: 4.6, to: 9.6, text: '2 か月後の 2023 年 1 月には、月に 1 億人が使ったと推計された。\nTikTok は約 9 か月、Instagram は約 2 年半かかった。' },
    { at: 9.8, to: 16, text: '最初の 100 万人までは、**5 日**だった。' },
  ],

  draw(ctx, t) {
    yearBlock(ctx, t, { year: '2022', who: 'ChatGPT', what: ['OpenAI', '11 月 30 日公開'] });

    const h = tw(t, 4.5, 0.6);
    if (h <= 0) return;
    text(ctx, '月 1 億人に届くまで', COL, 168, { font: F.jp(700, 28), color: C.ink, alpha: h });

    // month grid: every 6 months
    for (let mo = 0; mo <= 30; mo += 6) {
      const x = COL + mo * PX;
      ctx.fillStyle = C.rule;
      ctx.globalAlpha = h;
      ctx.fillRect(x, TOP - 30, 1.5, ROW * 3 + 10);
      ctx.globalAlpha = 1;
      const lab = mo === 0 ? '公開' : mo % 12 === 0 ? `${mo / 12} 年` : mo === 6 ? '半年' : `${Math.floor(mo / 12)} 年半`;
      text(ctx, lab, x, TOP + ROW * 3 - 2, { font: F.jp(400, 18), color: C.muted, align: mo === 0 ? 'left' : 'center', alpha: h });
    }

    BARS.forEach((b, i) => {
      const y = TOP + i * ROW;
      const p = tw(t, b.at, b.dur, outExpo);
      const a = tw(t, b.at - 0.2, 0.4);
      if (a <= 0) return;
      text(ctx, b.name, COL, y + 2, { font: F.sans(600, 24), color: b.hot ? C.accent : C.ink, alpha: a });
      const w = b.months * PX * p;
      ctx.fillStyle = b.hot ? C.accent : C.ink;
      ctx.fillRect(COL, y + 16, Math.max(2, w), 44);
      const l = tw(t, b.at + b.dur * 0.7, 0.5);
      // the longest bar has no room after it: its label sits inside the bar's end
      const inside = b.months * PX + 200 > W - M.r - COL;
      text(ctx, b.label, inside ? COL + w - 16 : COL + w + 16, y + 52, {
        font: F.cond(700, 40), color: inside ? C.paper : b.hot ? C.accent : C.ink, align: inside ? 'right' : 'left', alpha: l,
      });
    });

    // first million
    const m = tw(t, 9.9, 0.7, outCubic);
    if (m > 0) {
      ctx.fillStyle = C.accent;
      ctx.globalAlpha = m;
      ctx.fillRect(COL, 690, 10, 112);
      ctx.globalAlpha = 1;
      const w = text(ctx, '5', COL + 34, 798 + (1 - m) * 20, { font: F.cond(700, 150), color: C.ink, alpha: m, ls: -2 });
      text(ctx, '日', COL + 34 + w + 8, 796, { font: F.jp(700, 48), color: C.ink, alpha: m });
      text(ctx, '最初の 100 万人まで', COL + 34 + w + 72, 750, { font: F.jp(700, 30), color: C.ink2, alpha: tw(t, 10.3, 0.6) });
      text(ctx, 'サム・アルトマン（OpenAI）の発表', COL + 34 + w + 72, 794, { font: F.jp(400, 21), color: C.muted, alpha: tw(t, 10.5, 0.6) });
    }
    source(ctx, '1 億人は UBS の推計、比較は Sensor Tower の数字（Reuters、2023 年 2 月）', tw(t, 5.0, 0.6));
  },
});
