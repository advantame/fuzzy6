// 3-5: from the last list of numbers to the next token. The list at the last position gives
// every token of the vocabulary a score; the scores are turned into chances that add up to
// 100%, and nearly all of them are close to 0. One token is drawn as in a lottery, so the most
// likely one is not always the one taken: three draws give 飲, 飲, 買. ずんだもん connects this
// with answers that change from one try to the next; the spread is set by the temperature. The
// drawn token goes to the end and the round starts again, once per token, until the token that
// means "the end" is drawn (or the length limit is reached).
// The tokens are o200k_base's; the scores, chances and draws are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, chip, chipWidth, example } from '../lib/parts.js';
import { slot } from '../lib/odds.js';
import { strip } from '../lib/inside.js';
import { text, measure, rr, arrow, arrowHead, line } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outCubic } from '../../../src/kit/ease.js';
import { enter, focus, dimmed, ring } from '../../../src/kit/cue.js';
import { hash2 } from '../../../src/kit/random.js';

// ——— the text so far, in o200k_base tokens, and what gets added round by round
const TEXT = ['の', 'ど', 'が', 'かわ', 'いた', 'ので', '、水', 'を'];
const ADDS = ['飲', 'ん', 'だ', '。'];
const END = '〈終わり〉';
const TOK = { font: F.jp(500, 32), h: 54, padX: 12, gap: 8 };
const ROW_Y = 150;

// ——— every token of the vocabulary, drawn as 200 columns over the numbers 0–200,000
const PANEL = { x: M.l, y: 330, w: 790, h: 250 };
const NCOL = 200;
const CANDS = [
  { s: '飲', id: 132125, p: 0.61 },
  { s: '買', id: 61563, p: 0.18 },
  { s: '持', id: 17592, p: 0.06 },
  { s: '入', id: 8130, p: 0.03 },
  { s: '探', id: 53404, p: 0.01 },
];
const REST = 0.11;
const colOf = (id) => Math.floor((id / 200000) * NCOL);

// ——— the lottery
const LOT = { x: 960, y: 372, w: W - M.r - 960, h: 52 };
const DRAWS = [0.3, 0.52, 0.7]; // where the three draws land: 飲, 飲, 買
const LOW = [0.9, 0.07, 0.01, 0.01, 0, 0.01]; // the same chances at a low temperature
const HIGH = [0.34, 0.18, 0.1, 0.08, 0.05, 0.25]; // and at a high one

export default clip({
  id: 'predict',
  title: '次を確率で選ぶ',
  kicker: '次トークン予測',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: '書き換えを重ねたベクトルのうち、{last}いちばん後ろの\nトークンのものから、次のトークンを予測するの。' },
    { id: 'b', text: '{all}語彙のすべてのトークンに、{score}点数を付けるわ。\n[GPT-4o|ジーピーティーフォーオー] の切り方なら、およそ 20 万種類よ。' },
    { id: 'b2', text: 'その点数を、{prob}全部を足すと 100% になる確率に直すの。' },
    { id: 'c', still: true, text: '{few}この例では、いくつかの候補に、高い確率が集まっているわ。\n残りのほとんどは、0 に近いの。' },
    { id: 'd', text: '選び方の一つが、{pick}確率に応じて、\nくじを引くように一つを選ぶ方法よ。' },
    { id: 'e', still: true, text: 'この方法なら、{notop}いつも確率のいちばん高いものが、\n選ばれるとは限らないわ。' },
    { id: 'f', by: 'zunda', text: '{ask}同じことを聞いても、答えが毎回少し変わるのは、\nそのためなのだ？' },
    { id: 'g', still: true, text: 'ええ、理由の一つはそれよ。選び方のばらつきは、\n{temp}温度と呼ばれる設定で、{tlo}小さくも{thi}大きくもできるの。' },
    { id: 'h', text: '{add}選んだトークンを後ろに足したら、\n{again}そこまでを手がかりに、また次の一つを選ぶわ。' },
    { id: 'i', text: 'この基本の手順では、{hundred}100 トークン書くなら、\n一つ選んで足すことを、100 回くり返すの。' },
    { id: 'j', text: 'そして、{end}終わりを表す特別なトークンが選ばれると、\nそれを受け取ったプログラムが、そこで書くのを止めるのよ。' },
    { id: 'k', tail: 0.6, text: '{max}決めておいた長さの上限に届いたときも、そこで止まるわ。' },
  ],

  prepare(ctx) {
    let x = M.l;
    const lay = (s) => {
      const w = chipWidth(ctx, s, TOK);
      const out = { s, x, w };
      x += w + TOK.gap;
      return out;
    };
    const text0 = TEXT.map(lay);
    const adds = ADDS.map(lay);
    const end = lay(END);
    // one score per column, and the chance it ends up with
    const cand = new Map(CANDS.map((c) => [colOf(c.id), c]));
    const cols = Array.from({ length: NCOL }, (_, k) => {
      const c = cand.get(k);
      const score = c ? 0.55 + c.p * 0.6 : (hash2(k, 3) - 0.55) * 0.9;
      const p = c ? c.p : 0.0006 + 0.002 * hash2(k, 5);
      return { score, p, c };
    });
    return { text0, adds, end, cols };
  },

  draw(ctx, t, { text0, adds, end, cols }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    strip(ctx, { alpha: enter(t, at('a'), pace), lit: [3, 4] , vector: true });

    // ——— rounds: each added token lands at its time
    const add0 = at('add');
    const step = Math.min(0.9, (at('i.end') - add0 - 0.6) / ADDS.length);
    const landAt = (k) => add0 + 0.5 + k * step;
    const landed = ADDS.filter((_, k) => t >= landAt(k)).length;
    const endAt = at('end') + 0.2;
    const ended = t >= endAt;

    // ——— the text so far
    const g = enter(t, at('a'), pace);
    text(ctx, '書きかけの文章（GPT-4o の切り方）', M.l, ROW_Y - 18, { font: F.jp(700, 19), color: C.ink2, alpha: g });
    const last = focus(t, [at('last')], at('a.end') - cue.fall, cue).level[0];
    text0.forEach((c, k) => chip(ctx, c.x, ROW_Y, c.s, { ...TOK, fill: C.tints[k % C.tints.length], alpha: enter(t, at('a'), pace, k) * dimmed(k === TEXT.length - 1 ? last : 0, last, cue) }));
    adds.forEach((c, k) => {
      if (k >= landed) return;
      const dt = t - landAt(k);
      const flash = 1 - seg(dt, 0.1, 0.6);
      chip(ctx, c.x, ROW_Y, c.s, { ...TOK, fill: flash > 0.5 ? C.accent : C.tints[(TEXT.length + k) % C.tints.length], color: flash > 0.5 ? '#fff' : C.ink });
    });
    if (ended) chip(ctx, end.x, ROW_Y, END, { ...TOK, font: F.jp(700, 24), fill: C.ink, color: C.paper, alpha: tw(t, endAt, 0.3) });
    const hole = ended ? null : landed < ADDS.length ? adds[landed] : end;
    if (hole) slot(ctx, hole.x, ROW_Y, 90, TOK.h, { alpha: g, lit: g, blink: Math.floor(t * 2.5) % 2 === 0 });
    const lastTok = text0[TEXT.length - 1];
    ring(ctx, lastTok.x, ROW_Y, lastTok.w, TOK.h, last, C.accent, 10);
    // from the last position down to the scores
    const down = tw(t, at('last') - lead, 0.6, outCubic);
    ctx.strokeStyle = C.ink2;
    ctx.fillStyle = C.ink2;
    ctx.lineWidth = 2.5;
    arrow(ctx, lastTok.x + lastTok.w / 2, ROW_Y + TOK.h + 12, lastTok.x + lastTok.w / 2, PANEL.y - 54, down, 11);
    text(ctx, 'いちばん後ろの位置のベクトルから', lastTok.x + lastTok.w / 2 + 16, ROW_Y + TOK.h + 46, { font: F.jp(500, 18), color: C.ink2, alpha: down });

    // rounds and stop
    const roundA = tw(t, add0, pace.enter);
    const n = Math.min(landed + (ended ? 1 : 0) + 1, ADDS.length + 1);
    text(ctx, `${n} 回目`, W - M.r, ROW_Y - 18, { font: F.jp(700, 22), color: C.ink, align: 'right', alpha: roundA });
    const hund = pop('hundred');
    text(ctx, '基本の手順では、1 回で 1 トークン', W - M.r, ROW_Y + TOK.h + 34, { font: F.jp(700, 19), color: C.accent, align: 'right', alpha: hund });
    tag(ctx, end.x + chipWidth(ctx, END, { ...TOK, font: F.jp(700, 24) }) + 14, ROW_Y + 10, 'ここで止まる', { font: F.jp(700, 18), h: 34, padX: 12, fill: C.accent, color: '#fff', alpha: tw(t, endAt + 0.3, pace.enter) });

    // ——— every token's score, then its chance
    const pa = enter(t, at('all') - lead, pace);
    const toProb = inOutCubic(seg(t, at('prob') - lead, at('prob') - lead + 1.0));
    const scored = tw(t, at('score') - lead, 0.8);
    const few = focus(t, [at('few')], at('c.end') - cue.fall, cue).level[0];
    if (pa > 0) {
      ctx.save();
      ctx.globalAlpha = pa;
      rr(ctx, PANEL.x, PANEL.y - 40, PANEL.w, PANEL.h + 74, 16);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
      text(ctx, '語彙のすべてのトークン（約 20 万種類）', PANEL.x + 20, PANEL.y - 10, { font: F.jp(700, 19), color: C.ink2, alpha: pa });
      const label = toProb < 0.5 ? '点数' : '確率';
      tag(ctx, PANEL.x + PANEL.w - 20, PANEL.y - 32, label, { font: F.jp(700, 18), h: 32, padX: 12, fill: toProb < 0.5 ? C.ink : C.accent, color: '#fff', align: 'right', alpha: scored });
      const base = PANEL.y + PANEL.h - 16;
      const mid = PANEL.y + PANEL.h * 0.55;
      const colW = (PANEL.w - 40) / NCOL;
      // the axis
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 2;
      line(ctx, PANEL.x + 20, lerp(mid, base, toProb), PANEL.x + PANEL.w - 20, lerp(mid, base, toProb));
      cols.forEach((c, k) => {
        const x = PANEL.x + 20 + k * colW;
        const sh = c.score * 120 * scored; // a score above or below the middle line
        const ph = (c.p / 0.61) * (PANEL.h - 50); // a chance above the base
        const y0 = lerp(mid, base, toProb);
        const h = lerp(sh, ph, toProb);
        const hot = c.c ? 1 : 0;
        ctx.fillStyle = hot && toProb > 0.5 ? C.accent : C.ink;
        ctx.globalAlpha = (hot ? 1 : lerp(0.75, 0.55, toProb)) * dimmed(hot, few * toProb, cue) * pa;
        ctx.fillRect(x, h >= 0 ? y0 - Math.max(1, h) : y0, Math.max(1.2, colW - 1.2), Math.max(1, Math.abs(h)));
      });
      ctx.globalAlpha = 1;
      // the few that are likely
      CANDS.forEach((c, i) => {
        const x = PANEL.x + 20 + colOf(c.id) * colW;
        const a = tw(t, at('few') - lead + i * pace.stagger, pace.enter);
        const y = base - (c.p / 0.61) * (PANEL.h - 50);
        if (i < 3) {
          text(ctx, c.s, x + 2, y - 30, { font: F.jp(700, 22), color: C.ink, align: 'center', alpha: a });
          text(ctx, `${Math.round(c.p * 100)}%`, x + 2, y - 8, { font: F.cond(700, 19), color: C.accent, align: 'center', alpha: a });
        }
      });
      text(ctx, '全部を足すと 100%', PANEL.x + 20, PANEL.y + PANEL.h + 22, { font: F.jp(700, 18), color: C.accent, alpha: pop('prob') });
      text(ctx, 'この例では、残りのほとんどが 0 に近い', PANEL.x + PANEL.w - 20, PANEL.y + PANEL.h + 22, { font: F.jp(500, 17), color: C.ink2, align: 'right', alpha: pop('few') });
    }

    // ——— the lottery
    const la = pop('pick');
    const segs = [...CANDS.map((c) => c.p), REST];
    const names = [...CANDS.map((c) => c.s), 'そのほか'];
    if (la > 0) {
      text(ctx, '選び方の一つ：確率に応じてくじを引く', LOT.x, LOT.y - 48, { font: F.jp(700, 20), color: C.ink2, alpha: la });
      lotteryBar(ctx, LOT.x, LOT.y, LOT.w, LOT.h, segs, names, la);
      // three draws: 飲, 飲, 買
      const drawAt = [at('pick') + 0.4, at('notop') - 0.2, at('notop') + 0.6];
      DRAWS.forEach((u, k) => {
        const p = tw(t, drawAt[k], 0.35, outCubic);
        if (p <= 0) return;
        const x = LOT.x + u * LOT.w;
        const y = LOT.y - 6 - (1 - p) * 30;
        ctx.fillStyle = k === 2 ? C.blue : C.accent;
        ctx.globalAlpha = p;
        arrowHead(ctx, x, y, Math.PI / 2, 16);
        ctx.globalAlpha = 1;
        const got = u < 0.61 ? '飲' : '買';
        const ry = LOT.y + LOT.h + 42 + k * 36;
        text(ctx, `${k + 1} 回目`, LOT.x, ry, { font: F.jp(500, 19), color: C.ink2, alpha: p });
        chip(ctx, LOT.x + 80, ry - 25, got, { font: F.jp(700, 22), h: 34, padX: 10, fill: k === 2 ? C.blueSoft : C.accentSoft, alpha: p });
        text(ctx, got === '飲' ? '→ 水を飲んだ。' : '→ 水を買った。', LOT.x + 132, ry, { font: F.jp(500, 19), color: C.ink, alpha: p });
      });
      const notop = focus(t, [at('notop')], at('e.end') - cue.fall, cue).level[0];
      text(ctx, '← いちばん高いものとは限らない', LOT.x + 300, LOT.y + LOT.h + 42 + 2 * 36, { font: F.jp(700, 17), color: C.blue, alpha: tw(t, at('notop') + 0.6, pace.enter) * (0.6 + 0.4 * notop) });
    }

    // ——— the temperature
    const ta = pop('temp');
    if (ta > 0) {
      const y0 = 650;
      text(ctx, '温度', LOT.x, y0 - 14, { font: F.jp(700, 20), color: C.ink2, alpha: ta });
      const lo = tw(t, at('tlo') - lead, pace.enter);
      const hi = tw(t, at('thi') - lead, pace.enter);
      text(ctx, '低い', LOT.x, y0 + 30, { font: F.jp(700, 18), color: C.ink, alpha: lo });
      lotteryBar(ctx, LOT.x + 60, y0 + 8, LOT.w - 60, 34, LOW, names, lo, true);
      text(ctx, 'ばらつきが小さい', LOT.x + 60, y0 + 64, { font: F.jp(500, 16), color: C.ink2, alpha: lo });
      text(ctx, '高い', LOT.x, y0 + 114, { font: F.jp(700, 18), color: C.ink, alpha: hi });
      lotteryBar(ctx, LOT.x + 60, y0 + 92, LOT.w - 60, 34, HIGH, names, hi, true);
      text(ctx, 'ばらつきが大きい', LOT.x + 60, y0 + 148, { font: F.jp(500, 16), color: C.ink2, alpha: hi });
    }

    // ——— when it stops
    const sa = pop('end');
    if (sa > 0) {
      const y0 = 690;
      text(ctx, '書くのをやめるとき', M.l, y0 - 14, { font: F.jp(700, 20), color: C.ink2, alpha: sa });
      chip(ctx, M.l, y0 + 4, END, { font: F.jp(700, 20), h: 36, padX: 12, fill: C.ink, color: C.paper, alpha: sa });
      text(ctx, 'を表す特別なトークンが選ばれたとき', M.l + 130, y0 + 30, { font: F.jp(500, 20), color: C.ink, alpha: sa });
      text(ctx, '印の形はモデルごとに違う（o200k_base の例：<|endoftext|>）', M.l, y0 + 52 + 14, { font: F.jp(500, 15), color: C.muted, alpha: sa });
      const ma = pop('max');
      text(ctx, '決めておいた長さの上限に届いたとき', M.l, y0 + 104, { font: F.jp(500, 20), color: C.ink, alpha: ma });
    }
    example(ctx, M.l, 834, pa, 'トークンは o200k_base のもの。点数、確率、くじの結果は説明のための例');
  },
});

// A bar cut into segments by chance, each named. small: no names on the thin segments.
function lotteryBar(ctx, x, y, w, h, segs, names, a, small = false) {
  if (a <= 0.001) return;
  let left = x;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  segs.forEach((p, i) => {
    const sw = w * p;
    if (sw <= 0) return;
    rr(ctx, left + 1, y, Math.max(1, sw - 2), h, 6);
    ctx.fillStyle = i === segs.length - 1 ? C.rule : i === 0 ? C.accentSoft : C.tints[(i + 2) % C.tints.length];
    ctx.fill();
    const name = measure(ctx, F.jp(700, small ? 16 : 20), names[i]) + 8 < sw ? names[i] : names[i] === 'そのほか' && sw > 24 ? '他' : '';
    if (name) text(ctx, name, left + sw / 2, y + h / 2 + 2, { font: F.jp(700, small ? 16 : 20), color: C.ink, align: 'center', base: 'middle' });
    left += sw;
  });
  ctx.restore();
}
