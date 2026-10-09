// Hallucination: a fluent answer cites a case that does not exist (the chat is an example),
// then the real 2023 case in which lawyers filed six such citations made by ChatGPT.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { bubbleLayout, bubble, example, tag, source, marker } from '../lib/parts.js';
import { text, measure, line } from '../../../src/kit/draw.js';
import { tw, seg, outBack, outCubic } from '../../../src/kit/ease.js';

const ASK = '航空会社を訴えた判例を教えて';
const CITE = '「山田 対 東西航空」（2019 年）';
const ANSWER_HEAD = '代表的なものに';
const ANSWER_TAIL = '\nがあります。この判決では、\n航空会社の責任が広く認められました。';
const LEFT_W = 820;
const FACT = 11.3;
const FX = 990;

export default clip({
  id: 'hallucination',
  title: '事実でない答え',
  kicker: 'ハルシネーション',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'LLM は、事実でないことも、事実と同じ調子で書くことがある。\n**ハルシネーション**と呼ばれる。' },
    { at: 5.8, to: 11.1, text: 'モデルが書くのは、もっともらしい続きで、\n確かめた事実ではない。' },
    { at: 11.3, to: 18, text: '2023 年、米国の弁護士が、ChatGPT の作った実在しない判例を\n裁判所に出し、制裁金を科された。' },
  ],

  prepare(ctx) {
    const ask = bubbleLayout(ctx, ASK, 560, { font: F.jp(500, 26) });
    const ans = bubbleLayout(ctx, ANSWER_HEAD + CITE + ANSWER_TAIL, 700, { font: F.jp(500, 27), lh: 44, pad: 26 });
    // where the citation sits inside the wrapped answer (it stays on the first line)
    const font = ans.font;
    const citeX = measure(ctx, font, ANSWER_HEAD);
    const citeW = measure(ctx, font, CITE);
    return { ask, ans, citeX, citeW };
  },

  draw(ctx, t, { ask, ans, citeX, citeW }) {
    example(ctx, M.l, 92, tw(t, 0.6, 0.5), '会話は説明のための例。判例名は架空');
    const qa = tw(t, 0.3, 0.5, (p) => outBack(p, 1.5));
    bubble(ctx, M.l + LEFT_W - ask.w, 150, ask, { fill: C.blueSoft, alpha: Math.min(1, qa) });
    const ay = 150 + ask.h + 24;
    const chars = seg(t, 0.9, 3.6);
    bubble(ctx, M.l, ay, ans, { fill: '#fff', stroke: C.rule, lw: 2, alpha: tw(t, 0.8, 0.3), chars });

    // the citation reads as confidently as the rest…
    const cx = M.l + ans.pad + citeX;
    const cy = ay + ans.pad + ans.size * 0.62;
    marker(ctx, cx, cy + 18, citeW, 4, tw(t, 4.0, 0.6, outCubic), C.ink);
    // …but checking finds nothing
    const scan = seg(t, 6.0, 7.2);
    if (scan > 0 && scan < 1) {
      ctx.fillStyle = C.accentSoft;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(cx, cy - 26, citeW * scan, 50);
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.accent;
      ctx.fillRect(cx + citeW * scan - 2, cy - 30, 4, 58);
    }
    const no = tw(t, 7.2, 0.4);
    if (no > 0) {
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 4;
      line(ctx, cx - 4, cy, cx + citeW + 4, cy, outCubic(no));
      tag(ctx, M.l, ay + ans.h + 18, '記録を探しても、見つからない', { font: F.jp(700, 20), h: 38, padX: 16, fill: C.red, color: '#fff', alpha: no });
    }
    const cap = tw(t, 8.4, 0.6);
    text(ctx, '文章はなめらか。けれど、中身は確かめられていない。', M.l, ay + ans.h + 130, { font: F.jp(500, 24), color: C.ink2, alpha: cap });

    // ——— the real case
    const f = tw(t, FACT, 0.6);
    if (f <= 0) return;
    ctx.fillStyle = C.rule;
    ctx.fillRect(FX - 40, 150, 2, 650 * outCubic(f));
    text(ctx, '2023', FX, 236, { font: F.cond(700, 104), color: C.ink, alpha: f, ls: -1 });
    text(ctx, 'Mata v. Avianca', FX, 290, { font: F.sans(600, 30), color: C.ink, alpha: tw(t, FACT + 0.2, 0.5) });
    text(ctx, 'ニューヨーク南部地区連邦地裁', FX, 326, { font: F.jp(500, 21), color: C.muted, alpha: tw(t, FACT + 0.3, 0.5) });
    ['弁護士が、ChatGPT が作った', '実在しない判例 6 件を', '書面に引用して提出した。'].forEach((l, i) =>
      text(ctx, l, FX, 402 + i * 40, { font: F.jp(500, 26), color: C.ink, alpha: tw(t, FACT + 0.6 + i * 0.15, 0.5) }),
    );
    const s = tw(t, FACT + 1.4, 0.5);
    text(ctx, '制裁金 5,000 ドル', FX, 600, { font: F.jp(700, 34), color: C.accent, alpha: s });
    text(ctx, '2023 年 6 月 22 日。その後の事実と異なる説明も理由に', FX, 638, { font: F.jp(500, 19), color: C.muted, alpha: s });
    const e = tw(t, FACT + 2.0, 0.5);
    const ex = 'Varghese v. China Southern Airlines';
    text(ctx, '実在しなかった判例の一つ', FX, 708, { font: F.jp(400, 19), color: C.muted, alpha: e });
    const ew = text(ctx, ex, FX, 742, { font: F.sans(500, 21), color: C.ink2, alpha: e });
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = e;
    line(ctx, FX - 2, 735, FX + ew + 2, 735, outCubic(tw(t, FACT + 2.4, 0.5)));
    ctx.globalAlpha = 1;
    source(ctx, 'Mata v. Avianca, Inc., S.D.N.Y. 2023', e);
  },
});
