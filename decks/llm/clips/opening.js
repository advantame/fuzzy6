// Opening: the abbreviation unfolds into its words, the deck's subtitle is written one token
// at a time (the real o200k_base split), and the six chapters appear as a route.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { text, measure, line, circle, wipe } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outExpo, outCubic, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { rr } from '../../../src/kit/draw.js';

const WORDS = ['Large', 'Language', 'Model'];
// "次の一語から、エージェントまで" in o200k_base (GPT-4o's tokenizer): 11 tokens
const SUB = ['次', 'の', '一', '語', 'から', '、', 'エ', 'ージ', 'ェ', 'ント', 'まで'];
const ROUTE = [
  ['1', '歴史', '1948 年から'],
  ['2', '基本概念', 'トークン、予測、注意'],
  ['3', 'チャットボット', '会話のしくみ'],
  ['4', 'ツール', '書いて、動かす'],
  ['5', 'つなぐ先', 'RAG、シェル、画面'],
  ['6', 'ハーネス', 'MCP、セッション'],
];

const BIG = 330; // "LLM" before it unfolds
const Y0 = 540; // its baseline
const Y1 = 296; // baseline of the unfolded words
const SUB_AT = 4.9;
const SUB_STEP = 0.2;
const ROUTE_AT = 8.3;
const ROUTE_Y = 668;

export default clip({
  id: 'opening',
  title: 'LLM',
  kicker: 'Large Language Model',
  numbered: false,
  duration: 12,
  cues: [
    { at: 0.5, to: 4.5, text: 'LLM は Large Language Model、**大規模言語モデル**の略。' },
    { at: 4.7, to: 8.0, text: 'LLM がしていることは、文章の**次の一語**を予測すること。' },
    { at: 8.2, to: 12, text: 'この束は六章。歴史と基本概念から、ツールを使うエージェントまで進む。' },
  ],

  prepare(ctx) {
    // the unfolded title is as large as fits between the margins
    const em = (s) => measure(ctx, F.cond(700, 100), s) / 100;
    const gapEm = 0.26;
    const size = Math.min(160, Math.floor((W - M.l - M.r) / (WORDS.reduce((n, w) => n + em(w), 0) + gapEm * 2)));
    let x = M.l;
    const words = WORDS.map((w, i) => {
      const from = M.l + measure(ctx, F.cond(700, BIG), 'LLM'.slice(0, i));
      const out = { w, from, to: x, initial: measure(ctx, F.cond(700, size), w[0]), full: measure(ctx, F.cond(700, size), w) };
      x += out.full + gapEm * size;
      return out;
    });
    let sx = M.l;
    const sub = SUB.map((s) => {
      const w = measure(ctx, F.jp(500, 40), s);
      const out = { s, x: sx, w };
      sx += w;
      return out;
    });
    return { size, words, sub, subEnd: sx };
  },

  draw(ctx, t, { size, words, sub, subEnd }) {
    // ——— the abbreviation and its words: first the capitals travel to where their words
    // will start, then the rest of each word opens out of its capital (no overlaps)
    const unfold = tw(t, 1.6, 1.0, inOutCubic);
    const reveal = tw(t, 2.5, 1.1, outCubic);
    words.forEach((wd, i) => {
      const rise = tw(t, 0.15 + i * 0.12, 0.9);
      if (rise <= 0) return;
      const k = lerp(BIG / size, 1, unfold);
      const x = lerp(wd.from, wd.to, unfold);
      const y = lerp(Y0, Y1, unfold) + (1 - rise) * 70;
      ctx.save();
      ctx.globalAlpha = rise;
      ctx.translate(x, y);
      ctx.scale(k, k);
      ctx.beginPath();
      ctx.rect(-4, -size * 1.1, wd.initial + (wd.full - wd.initial) * reveal + 8, size * 1.4);
      ctx.clip();
      text(ctx, wd.w, 0, 0, { font: F.cond(700, size), color: C.ink });
      ctx.restore();
    });
    // initials stay marked in vermilion once the words are out
    const mark = tw(t, 3.0, 0.8);
    if (mark > 0) {
      ctx.fillStyle = C.accent;
      words.forEach((wd, i) => {
        const p = seg(mark, i * 0.15, i * 0.15 + 0.7);
        ctx.fillRect(wd.to, Y1 + 22, wd.initial * outExpo(p), 8);
      });
    }

    // ——— Japanese name
    wipe(ctx, tw(t, 3.0, 1.0, outCubic), M.l, Y1 + 40, 900, 100, () => {
      text(ctx, '大規模言語モデル', M.l, Y1 + 104, { font: F.jp(700, 60), color: C.ink });
    });

    // ——— the subtitle, one token at a time; each token flashes as a chip as it lands
    const subY = Y1 + 186;
    sub.forEach((tk, i) => {
      const at = SUB_AT + i * SUB_STEP;
      if (t < at) return;
      const flash = 1 - seg(t, at + 0.15, at + 0.9);
      if (flash > 0) {
        ctx.save();
        ctx.globalAlpha = flash;
        rr(ctx, tk.x - 2, subY - 40, tk.w + 4, 54, 8);
        ctx.fillStyle = C.tints[i % C.tints.length];
        ctx.fill();
        ctx.restore();
      }
      text(ctx, tk.s, tk.x, subY, { font: F.jp(500, 40), color: C.ink2, alpha: tw(t, at, 0.25) });
    });
    // caret while writing
    const lastAt = SUB_AT + (SUB.length - 1) * SUB_STEP;
    if (t > SUB_AT - 0.6 && t < lastAt + 1.2 && Math.floor(t * 2.5) % 2 === 0) {
      const done = sub.filter((_, i) => t >= SUB_AT + i * SUB_STEP);
      const cx = done.length ? done[done.length - 1].x + done[done.length - 1].w + 6 : sub[0].x;
      ctx.fillStyle = C.accent;
      ctx.fillRect(cx, subY - 38, 4, 48);
    }

    // ——— the route through the chapters
    const draw = tw(t, ROUTE_AT, 1.6, inOutCubic);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    line(ctx, M.l, ROUTE_Y, W - M.r, ROUTE_Y, draw);
    const span = W - M.l - M.r;
    ROUTE.forEach(([n, name, note], i) => {
      const x = M.l + i * (span / ROUTE.length);
      const at = ROUTE_AT + 1.6 * inverseInOut(i / ROUTE.length) + 0.05;
      const pop = tw(t, at, 0.5, (p) => outBack(p, 2.2));
      if (pop <= 0) return;
      const here = i === 0;
      ctx.fillStyle = here ? C.accent : C.ink;
      circle(ctx, x + 10, ROUTE_Y, (here ? 14 : 10) * pop);
      ctx.fill();
      if (here) {
        const ring = seg((t - (at + 0.6)) % 1.8, 0, 1.2);
        if (t > at + 0.6 && ring < 1) {
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 1 - ring;
          circle(ctx, x + 10, ROUTE_Y, 14 + 30 * outCubic(ring));
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      const a = tw(t, at + 0.1, 0.6);
      const dy = (1 - a) * 14;
      const lw = text(ctx, n, x, ROUTE_Y + 64 + dy, { font: F.cond(700, 30), color: C.accent, alpha: a });
      text(ctx, name, x + lw + 8, ROUTE_Y + 64 + dy, { font: F.jp(700, 26), color: C.ink, alpha: a });
      text(ctx, note, x, ROUTE_Y + 100 + dy, { font: F.jp(400, 19), color: C.muted, alpha: a });
    });
    // arrowhead at the far end
    if (draw > 0.98) {
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.moveTo(W - M.r + 4, ROUTE_Y);
      ctx.lineTo(W - M.r - 14, ROUTE_Y - 9);
      ctx.lineTo(W - M.r - 14, ROUTE_Y + 9);
      ctx.closePath();
      ctx.fill();
    }
  },
});

// time fraction at which an inOutCubic sweep reaches position u (so stations pop as the
// line passes them)
function inverseInOut(u) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inOutCubic(mid) < u) lo = mid;
    else hi = mid;
  }
  return lo;
}
