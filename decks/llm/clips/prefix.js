// Cache hits need an identical beginning. A clock at the top of the prompt changes the very
// first tokens every time, so nothing after them can come from the cache; the same clock at the
// end leaves the beginning intact. Hence harnesses keep the stable parts first and only append.
// The documents and percentages are an example; the remark is Manus's (2025).

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, outExpo } from '../../../src/kit/ease.js';

const X0 = 230;
const ROW_H = 50;
// [label, width]; a part whose label starts with '時刻' is the clock
const TOP_PREV = [['時刻 10:42', 120], ['システム', 96], ['ツール', 96], ['依頼', 56], ['呼出', 30], ['結果', 130]];
const TOP_NOW = [['時刻 10:43', 120], ['システム', 96], ['ツール', 96], ['依頼', 56], ['呼出', 30], ['結果', 130], ['呼出', 30], ['結果', 120]];
const BOT_PREV = [['システム', 96], ['ツール', 96], ['依頼', 56], ['時刻 10:42', 120], ['呼出', 30], ['結果', 130]];
const BOT_NOW = [['システム', 96], ['ツール', 96], ['依頼', 56], ['時刻 10:42', 120], ['呼出', 30], ['結果', 130], ['時刻 10:43', 120], ['呼出', 30], ['結果', 120]];
const Y = { topHead: 150, top1: 182, top2: 252, botHead: 410, bot1: 442, bot2: 512 };
const T = { top: 0.6, compareTop: 2.0, bot: 5.8, compareBot: 7.0, rule: 11.4 };
const COST_X = 1250;

export default clip({
  id: 'prefix',
  title: '頭を変えない',
  kicker: 'キャッシュの当たり外れ',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'キャッシュが使えるのは、頭からまったく同じ部分だけ。\n1 トークンでも違えば、そこから後ろは計算し直しになる。' },
    { at: 5.8, to: 11.2, text: '先頭に今の時刻を書くと、毎回すべてが外れる。\n変わらないものを頭に置き、変わるものは後ろに足す。' },
    { at: 11.4, to: 18, text: 'だからハーネスは、前を書き換えずに追記していく。\nManus は、キャッシュの当たる率を最も大事な指標と呼んだ。' },
  ],

  draw(ctx, t) {
    // ——— a clock at the top
    const ha = tw(t, T.top, 0.5);
    text(ctx, '先頭に時刻を書いた場合', M.l, Y.topHead, { font: F.jp(700, 22), color: C.ink, alpha: ha });
    row(ctx, t, M.l, Y.top1, '前の回', TOP_PREV, () => 'prev', ha);
    const ta = tw(t, T.top + 0.5, 0.5);
    // compare part by part from the left: the very first part differs
    const cmpTop = seg(t, T.compareTop, T.compareTop + 1.2);
    row(ctx, t, M.l, Y.top2, '今回', TOP_NOW, (i) => (cmpTop <= 0 ? 'idle' : i === 0 ? 'diff' : seg(cmpTop, 0.2 + i * 0.08, 0.3 + i * 0.08) > 0 ? 'new' : 'idle'), ta);
    const miss = tw(t, T.compareTop + 0.3, 0.4);
    if (miss > 0) {
      text(ctx, '× ここで違う', X0, Y.top2 + ROW_H + 30, { font: F.jp(700, 19), color: C.red, alpha: miss });
      text(ctx, 'ここから後ろは、全部を計算し直す', X0 + 150, Y.top2 + ROW_H + 30, { font: F.jp(500, 19), color: C.ink2, alpha: tw(t, T.compareTop + 1.0, 0.4) });
      tag(ctx, M.l + 270, Y.topHead - 24, '外れる', { font: F.jp(700, 17), h: 30, padX: 12, fill: C.red, color: '#fff', alpha: miss });
    }
    cost(ctx, t, Y.top2, 1, T.compareTop + 1.3);

    // ——— the same clock at the end
    const hb = tw(t, T.bot, 0.5);
    text(ctx, '時刻を後ろに書いた場合', M.l, Y.botHead, { font: F.jp(700, 22), color: C.ink, alpha: hb });
    row(ctx, t, M.l, Y.bot1, '前の回', BOT_PREV, () => 'prev', hb);
    const ba = tw(t, T.bot + 0.5, 0.5);
    const cmpBot = seg(t, T.compareBot, T.compareBot + 1.4);
    row(ctx, t, M.l, Y.bot2, '今回', BOT_NOW, (i) => {
      if (cmpBot <= 0) return 'idle';
      const reached = seg(cmpBot, i * 0.08, 0.1 + i * 0.08) > 0;
      if (!reached) return 'idle';
      return i < BOT_PREV.length ? 'hit' : 'new';
    }, ba);
    const hit = tw(t, T.compareBot + 1.2, 0.4);
    if (hit > 0) {
      const w = BOT_PREV.reduce((n, [, pw]) => n + pw, 0);
      text(ctx, '前と同じ頭は、キャッシュから読む', X0, Y.bot2 + ROW_H + 30, { font: F.jp(700, 19), color: C.green, alpha: hit });
      text(ctx, '後ろに足した分だけ計算する', X0 + w + 4, Y.bot2 + ROW_H + 30, { font: F.jp(500, 19), color: C.ink2, alpha: hit });
      tag(ctx, M.l + 270, Y.botHead - 24, '当たる', { font: F.jp(700, 17), h: 30, padX: 12, fill: C.green, color: '#fff', alpha: hit });
    }
    const cached = BOT_PREV.reduce((n, [, w]) => n + w, 0);
    const total = BOT_NOW.reduce((n, [, w]) => n + w, 0);
    cost(ctx, t, Y.bot2, (cached * 0.05 + (total - cached)) / total, T.compareBot + 1.5);

    // ——— the rule
    const ra = tw(t, T.rule, 0.6);
    if (ra > 0) {
      const y = 664;
      ctx.fillStyle = C.ink;
      ctx.globalAlpha = ra;
      ctx.fillRect(M.l, y - 34, 8, 96);
      ctx.globalAlpha = 1;
      text(ctx, '変わらないものを頭に。変わるものは後ろに足す。前を書き換えない。', M.l + 30, y, { font: F.jp(700, 26), color: C.ink, alpha: ra });
      text(ctx, '外れる例：先頭の時刻、ツールの並べ替え、途中の書き換え（要約で縮めたときなど）', M.l + 30, y + 44, { font: F.jp(500, 19), color: C.ink2, alpha: tw(t, T.rule + 0.4, 0.5) });
    }

    example(ctx, M.l, 818, tw(t, 1.2, 0.5), '文書と割合は説明のための例（Claude Sonnet 5.5 の比率、読み出しは 20 分の 1 で計算）');
    source(ctx, 'Manus（2025 年 7 月）、Anthropic と OpenAI の文書', ra);
  },
});

// One request's document as a strip of parts. state(i) → 'prev' | 'idle' | 'hit' | 'new' | 'diff'.
function row(ctx, t, lx, y, label, parts, state, a) {
  if (a <= 0) return;
  text(ctx, label, lx, y + 32, { font: F.jp(500, 19), color: C.ink2, alpha: a });
  let x = X0;
  parts.forEach(([name, w], i) => {
    const s = state(i);
    const clock = name.startsWith('時刻');
    ctx.save();
    ctx.globalAlpha = a;
    rr(ctx, x, y, w - 4, ROW_H, 6);
    ctx.fillStyle = s === 'hit' ? C.greenSoft : s === 'new' || s === 'diff' ? C.accentSoft : s === 'prev' ? '#ece7dc' : C.panel;
    ctx.fill();
    ctx.strokeStyle = s === 'hit' ? C.green : s === 'diff' ? C.red : s === 'new' ? C.accent : clock ? C.ink2 : C.rule;
    ctx.lineWidth = s === 'diff' ? 3.5 : 2;
    ctx.stroke();
    ctx.restore();
    if (w >= 56) text(ctx, name, x + 10, y + 32, { font: clock ? F.mono(600, 17) : F.jp(500, 18), color: s === 'diff' ? C.red : s === 'prev' ? C.muted : C.ink2, alpha: a });
    x += w;
  });
}

// The input price of "this time", relative to computing everything.
function cost(ctx, t, y, frac, at) {
  const a = tw(t, at, 0.5);
  if (a <= 0) return;
  const w = 180;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(COST_X, y + 8, w, ROW_H - 16);
  ctx.setLineDash([]);
  ctx.fillStyle = frac >= 1 ? C.accent : C.green;
  ctx.fillRect(COST_X, y + 8, w * frac * outExpo(seg(t, at, at + 0.8)), ROW_H - 16);
  ctx.restore();
  text(ctx, `${Math.round(frac * 100)}%`, COST_X + w + 14, y + 35, { font: F.cond(700, 30), color: frac >= 1 ? C.accent : C.green, alpha: a });
  text(ctx, '入力の値段', COST_X, y - 8, { font: F.jp(500, 16), color: C.muted, alpha: a });
}
