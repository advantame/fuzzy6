// Wikis and memory. The same shape became products — DeepWiki a year before LLM Wiki, then
// GBrain, AutoWiki, OpenWiki — while memory features keep what a person prefers and decided.
// mem0 drew the line; the two are not exclusive. Both are written outside the window and read
// back when needed (Anthropic's long-running harness keeps a progress file and a feature list),
// and deciding what to keep is the harness's job.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, outExpo } from '../../../src/kit/ease.js';

const WIKIS = [
  ['2025 年 4 月', 'DeepWiki', 'Cognition。GitHub のリポジトリを、説明の頁に'],
  ['2026 年 3 月以前', 'AutoWiki', 'Factory。ソースから作り、変更に合わせて直す'],
  ['2026 年 4 月', 'GBrain', 'Garry Tan。個人の知識の wiki'],
  ['2026 年 7 月', 'OpenWiki', 'LangChain。リポジトリの wiki を作って保つ'],
];
const MEMS = [
  ['2023 年 10 月', 'MemGPT', '窓と外の記憶のあいだで、情報を出し入れ'],
  ['2024 年 2 月', 'ChatGPT のメモリー', '好みや事実を覚える（試験提供）'],
  ['2025 年 4 月', 'ChatGPT', '過去の会話も参照する'],
  ['2025 年 9 月', 'Claude の memory tool', 'ファイルに書いて、次に読む（API、ベータ）'],
];
const LX = M.l;
const RX = 830;
const TOP = 214;
const STEP = 82;

export default clip({
  id: 'wikimemory',
  title: 'wiki と記憶',
  kicker: 'エージェント wiki',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '同じ形は、各社の製品にもなった。\nコードの wiki を作る DeepWiki は、2025 年 4 月から先にあった。' },
    { at: 6.0, to: 11.2, text: 'mem0 は、wiki は「資料に何があるか」、記憶は\n「その人が何を好み、何を決めたか」を持つ、と分けた。' },
    { at: 11.4, to: 18, text: 'どちらも、窓の外に書いて残し、要るときに読み戻す。\n何をどう残すかを決めるのは、ハーネスの仕事。' },
  ],

  draw(ctx, t) {
    // ——— wikis: what the material contains
    const wa = tw(t, 0.4, 0.5);
    text(ctx, 'wiki', LX, TOP - 74, { font: F.sans(700, 30), color: C.accent, alpha: wa });
    text(ctx, '資料に何があるか', LX + 80, TOP - 76, { font: F.jp(700, 22), color: C.ink, alpha: wa });
    WIKIS.forEach(([when, who, what], i) => row(ctx, t, LX, TOP + i * STEP, when, who, what, 0.8 + i * 0.5, C.accent));

    // ——— memory: who the person is and what they decided
    const ma = tw(t, 6.0, 0.5);
    text(ctx, '記憶', RX, TOP - 74, { font: F.jp(700, 30), color: C.blue, alpha: ma });
    text(ctx, 'その人が何を好み、何を決めたか', RX + 80, TOP - 76, { font: F.jp(700, 22), color: C.ink, alpha: ma });
    MEMS.forEach(([when, who, what], i) => row(ctx, t, RX, TOP + i * STEP, when, who, what, 6.4 + i * 0.4, C.blue));
    // mem0's line, in its own words
    const qa = tw(t, 8.2, 0.6);
    text(ctx, '“what does this body of material contain”', LX, TOP + 4 * STEP + 6, { font: F.sans(500, 19), color: C.ink2, alpha: qa });
    text(ctx, '“what a specific person prefers, what they decided last week”', RX, TOP + 4 * STEP + 6, { font: F.sans(500, 19), color: C.ink2, alpha: qa });
    text(ctx, 'mem0「The State of Agent Wikis」（2026-07-21）。両者は重なることもある', LX, TOP + 4 * STEP + 36, { font: F.jp(400, 16), color: C.muted, alpha: qa });

    // ——— both live outside the window and are read back
    const ba = tw(t, 11.4, 0.6);
    if (ba > 0) {
      const y = 640;
      ctx.save();
      ctx.globalAlpha = ba;
      rr(ctx, LX, y, W - M.l - M.r, 120, 16);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.restore();
      text(ctx, '窓の外に書いて、要るときに読み戻す', LX + 28, y + 44, { font: F.jp(700, 24), color: C.ink, alpha: ba });
      text(ctx, 'Anthropic の長く走るハーネスの例（2025-11-26）', LX + 28, y + 80, { font: F.jp(500, 17), color: C.ink2, alpha: ba });
      let x = LX + 600;
      ['claude-progress.txt', 'feature_list.json', 'git の履歴'].forEach((s, i) => {
        const w = tag(ctx, x, y + 38, s, { font: i < 2 ? F.mono(600, 18) : F.jp(700, 18), h: 40, padX: 16, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: tw(t, 11.8 + i * 0.25, 0.5) });
        x += w + 16;
      });
      text(ctx, '“each new session begins with no memory of what came before.”', LX + 600, y + 104, { font: F.sans(500, 16), color: C.muted, alpha: tw(t, 12.6, 0.5) });
    }

    source(ctx, 'Cognition、Factory、LangChain、OpenAI、Anthropic、Packer ほか（2023）', wa);
  },
});

// One dated line: when, who, what.
function row(ctx, t, x, y, when, who, what, at, color) {
  const a = tw(t, at, 0.5);
  if (a <= 0) return;
  const dy = (1 - outExpo(Math.min(1, a))) * 10;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.fillRect(x, y - 24 + dy, 4, 54);
  ctx.restore();
  const w = text(ctx, when, x + 18, y + dy, { font: F.cond(700, 22), color: C.ink, alpha: a });
  text(ctx, who, x + 18 + Math.max(w, 132) + 12, y + dy, { font: F.sans(700, 22), color: C.ink, alpha: a });
  text(ctx, what, x + 18, y + 29 + dy, { font: F.jp(400, 17), color: C.ink2, alpha: a });
}
