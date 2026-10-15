// 3-7: how much the model can take at once. The text and the answer being written share one
// window of tokens; the answer is worked out from what is in it, and the answer goes into it
// too. When the text grows past the window, the original of what is left out cannot be looked
// at as it is, so the program that runs the model decides what to keep — or keeps a shorter
// summary. The window was 2,048 tokens for GPT-3 (2020); in 2026 several models take around a
// million. ずんだもん asks how much that is: 『坊っちゃん』 counted in GPT-4o's tokens is about
// 76,000, so a million is about thirteen of it, or eight of 『こころ』. Taking that much is not
// the same as using all of it equally well.
// The text, the window's place and what is kept are an example; the sizes are published figures
// and the novels were counted for this deck (research/concept-facts, Unit 9).

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import { strip } from '../lib/inside.js';
import { text, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outCubic, outExpo } from '../../../src/kit/ease.js';
import { enter, focus } from '../../../src/kit/cue.js';
import { hash } from '../../../src/kit/random.js';

// ——— the text as blocks of tokens
const DOC = { x: M.l, y: 176, cols: 34, bw: 26, bh: 16, gx: 7, gy: 14 };
const WIN = 96; // tokens the window holds
const FIRST = 64; // the text to begin with
const ANSWER = 20; // the answer written into the window
const MORE = 56; // the text that comes in later
const pos = (i) => ({ x: DOC.x + (i % DOC.cols) * (DOC.bw + DOC.gx), y: DOC.y + Math.floor(i / DOC.cols) * (DOC.bh + DOC.gy) });
const LLM = { x: 1330, y: 186, w: 170, h: 104 };

// ——— the window's size over the years (published figures)
const SIZES = [
  { name: 'GPT-3', year: '2020', n: 2048, note: '' },
  { name: 'GPT-4', year: '2023', n: 32768, note: '限定提供の版' },
  { name: 'Claude 2.1', year: '2023', n: 200000, note: '' },
  { name: 'Gemini 1.5 Pro', year: '2024', n: 1000000, note: '限定プレビュー' },
  { name: 'GPT-6 Astra', year: '2026', n: 1050000, note: '入力と出力の合計' },
];
const CH = { x: M.l, y: 536, year: 212, barX: 332, rowH: 46 };
const BAR_W = 360;

// ——— a million tokens, in novels (青空文庫, counted with o200k_base; Unit 9)
const NOVELS = [
  { name: '『坊っちゃん』', tokens: '75,597', books: 13.23, anchor: 'bo' },
  { name: '『こころ』', tokens: '126,973', books: 7.88, anchor: 'kok' },
];
const NV = { x: 1060, y: 520 };

export default clip({
  id: 'context',
  title: '読める長さ',
  kicker: 'コンテキストウィンドウ',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'LLM が一度に扱えるトークンの数には、{limit}上限があるわ。' },
    { id: 'b', text: 'この範囲を、{win}コンテキストウィンドウと呼ぶの。\n文章をのぞく窓のようなものね。' },
    { id: 'c', text: '答えを作るときは、\n{inside}この窓に入っている文章を、手がかりにするのよ。' },
    { id: 'd', still: true, text: '{pr}プロンプトだけでなく、{own}書いていく答えも、\nこの窓の中に入っていくわ。' },
    { id: 'e', text: '{grow}文章が長くなると、{outside}窓に入っていない元の文章は、\nそのままでは参照できないの。' },
    { id: 'f', text: 'だから、{who}どこを残し、どこを省くかを、\nLLM を使うプログラムの側で決めるのよ。' },
    { id: 'f2', still: true, text: '前の内容を、{sum}短くまとめて残す方法もあるわ。' },
    { id: 'g', text: '窓の大きさは、{g3}2020 年の [GPT-3|ジーピーティースリー] では、\n2,048 トークンだったの。' },
    { id: 'h', still: true, text: '2026 年には、{now}100 万トークン規模を扱えるモデルも、\nいくつもあるわ。' },
    { id: 'i', by: 'zunda', text: '{q}100 万トークンって、どれくらいなのだ？' },
    { id: 'j', text: '青空文庫の『坊っちゃん』を、{bo}[GPT-4o|ジーピーティーフォーオー] の切り方で数えると、\n約 7 万 6 千トークンになるの。' },
    { id: 'j2', still: true, text: '{times}100 万トークンは、その約 13 冊ぶんにあたるわ。\n{kok}『こころ』なら、約 8 冊ぶんね。' },
    { id: 'k', tail: 0.6, text: 'ただ、{good}長く読めることと、長い文章のどこでも同じように\nうまく使えることは、別の話なの。' },
  ],

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    strip(ctx, { alpha: enter(t, at('a'), pace), input: 1 , vector: true });

    // ——— the blocks: the text, the answer written after it, then more text
    const g = enter(t, at('a'), pace);
    const shown = Math.round(FIRST * tw(t, at('a'), pace.ground, outCubic));
    const ans = Math.round(ANSWER * seg(t, at('own') - lead, at('d.end')));
    const more = Math.round(MORE * inOutCubic(seg(t, at('grow') - lead, at('grow') + 1.6)));
    const total = (shown < FIRST ? shown : FIRST + ans) + more;
    const winStart = Math.max(0, total - WIN);
    const winA = pop('win');
    const kept = pop('sum'); // the summary that stands for what was left out
    text(ctx, '文章（例）', DOC.x, DOC.y - 24, { font: F.jp(700, 19), color: C.ink2, alpha: g });
    for (let i = 0; i < total; i++) {
      const p = pos(i);
      const isAnswer = i >= FIRST && i < FIRST + ans;
      const inWin = i >= winStart;
      const w = DOC.bw * (0.55 + 0.45 * hash(i * 7 + 3));
      ctx.fillStyle = isAnswer ? C.accent : C.ink;
      ctx.globalAlpha = inWin || winA <= 0 ? 1 : lerp(1, 0.18, winA);
      ctx.fillRect(p.x, p.y, w, DOC.bh);
    }
    ctx.globalAlpha = 1;
    // the window, row by row, as wide as WIN tokens from where it starts
    if (winA > 0) {
      const last = winStart + WIN - 1;
      ctx.save();
      ctx.globalAlpha = winA;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 4;
      const r0 = Math.floor(winStart / DOC.cols);
      const r1 = Math.floor(last / DOC.cols);
      for (let r = r0; r <= r1; r++) {
        const c0 = r === r0 ? winStart % DOC.cols : 0;
        const c1 = r === r1 ? last % DOC.cols : DOC.cols - 1;
        const x0 = DOC.x + c0 * (DOC.bw + DOC.gx) - 7;
        const x1 = DOC.x + c1 * (DOC.bw + DOC.gx) + DOC.bw + 7;
        rr(ctx, x0, DOC.y + r * (DOC.bh + DOC.gy) - 7, x1 - x0, DOC.bh + 14, 7);
        ctx.stroke();
      }
      ctx.restore();
      const iw = tag(ctx, DOC.x + 140, DOC.y - 48, 'イメージ', { font: F.jp(700, 15), h: 26, padX: 9, stroke: C.muted, color: C.muted, alpha: winA });
      tag(ctx, DOC.x + 150 + iw, DOC.y - 50, 'コンテキストウィンドウ', { font: F.jp(700, 18), h: 32, padX: 14, fill: C.accent, color: '#fff', alpha: winA });
    }
    // the limit, named before the window is drawn
    text(ctx, `上限：この例では ${WIN} トークン`, DOC.x + 560, DOC.y - 24, { font: F.jp(700, 18), color: C.ink2, alpha: pop('limit') });
    // into the LLM
    const inA = pop('inside');
    if (inA > 0) {
      ctx.save();
      ctx.globalAlpha = inA;
      rr(ctx, LLM.x, LLM.y, LLM.w, LLM.h, 18);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, 'LLM', LLM.x + LLM.w / 2, LLM.y + LLM.h / 2 + 2, { font: F.sans(700, 34), color: C.paper, align: 'center', base: 'middle', alpha: inA });
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 3;
      arrow(ctx, LLM.x - 76, LLM.y + LLM.h / 2, LLM.x - 10, LLM.y + LLM.h / 2, tw(t, at('inside'), 0.5, outCubic), 12);
      text(ctx, '窓の中を手がかりに', LLM.x + LLM.w / 2, LLM.y + LLM.h + 28, { font: F.jp(700, 17), color: C.accent, align: 'center', alpha: inA });
    }
    const ownA = pop('own') * (1 - seg(t, at('grow') - lead, at('grow')));
    text(ctx, '黒は、プロンプト', LLM.x + LLM.w, LLM.y + LLM.h + 58, { font: F.jp(700, 17), color: C.ink, align: 'right', alpha: pop('pr') });
    text(ctx, '赤は、書いている答え', LLM.x + LLM.w, LLM.y + LLM.h + 84, { font: F.jp(700, 17), color: C.accent, align: 'right', alpha: Math.max(ownA, pop('own') * 0.8) });
    // outside the window, and who decides
    const oa = pop('outside');
    const outLit = focus(t, [at('outside')], at('e.end') - cue.fall, cue).level[0];
    const ry = DOC.y + 5 * (DOC.bh + DOC.gy) + 8;
    text(ctx, '薄い部分：窓に入っていない元の文章は、そのままでは参照できない', DOC.x, ry + 20, { font: F.jp(700, 18), color: outLit > 0.5 ? C.accent : C.ink2, alpha: oa });
    const wa = pop('who');
    if (wa > 0) {
      const w = tag(ctx, DOC.x, ry + 42, 'LLM を使うプログラム', { font: F.jp(700, 17), h: 34, padX: 12, fill: C.ink, color: C.paper, alpha: wa });
      text(ctx, 'が、どこを残し、どこを省くかを決める', DOC.x + w + 10, ry + 66, { font: F.jp(500, 18), color: C.ink, alpha: wa });
      text(ctx, '前の内容を短くまとめて残す方法もある', DOC.x + w + 380, ry + 66, { font: F.jp(500, 18), color: C.ink2, alpha: kept });
    }

    // ——— the window's size over the years
    const ca = pop('g3');
    if (ca > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, CH.y - 48, (W - M.l - M.r) * outCubic(ca), 2);
      text(ctx, 'ウィンドウの大きさ（トークン、公称値）', CH.x, CH.y - 14, { font: F.jp(700, 19), color: C.ink2, alpha: ca });
    }
    SIZES.forEach((s, i) => {
      const when = i === 0 ? at('g3') : at('now') + (i - 1) * pace.stagger * 2;
      const a = tw(t, when - lead, pace.enter);
      if (a <= 0) return;
      const y = CH.y + 6 + i * CH.rowH;
      text(ctx, s.name, CH.x, y + 24, { font: F.sans(600, 20), color: C.ink, alpha: a });
      text(ctx, s.year, CH.x + CH.year, y + 24, { font: F.mono(500, 16), color: C.muted, align: 'right', alpha: a });
      const w = Math.max(3, BAR_W * (s.n / 1.05e6) * outExpo(seg(t, when, when + 1.0)));
      ctx.globalAlpha = a;
      ctx.fillStyle = i === 0 ? C.accent : C.ink;
      ctx.fillRect(CH.barX, y + 6, w, 24);
      ctx.globalAlpha = 1;
      const nw = text(ctx, s.n.toLocaleString('en-US'), CH.barX + w + 10, y + 26, { font: F.cond(700, 22), color: i === 0 ? C.accent : C.ink, alpha: a });
      if (s.note) text(ctx, s.note, CH.barX + w + 20 + nw, y + 25, { font: F.jp(500, 14), color: C.muted, alpha: a });
    });

    // ——— a million tokens, in novels
    const qa = pop('q');
    if (qa > 0) {
      ctx.save();
      ctx.globalAlpha = qa;
      rr(ctx, NV.x - 20, NV.y - 24, W - M.r - NV.x + 20, 300, 16);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
      text(ctx, '100 万トークンは、どれくらい？', NV.x, NV.y + 6, { font: F.jp(700, 19), color: C.ink2, alpha: qa });
    }
    const times = pop('times');
    NOVELS.forEach((nv, k) => {
      const a = pop(nv.anchor);
      if (a <= 0) return;
      const y = NV.y + 40 + k * 110;
      text(ctx, nv.name, NV.x, y + 18, { font: F.jp(700, 22), color: C.ink, alpha: a });
      text(ctx, `${nv.tokens} トークン`, NV.x + 180, y + 18, { font: F.cond(700, 22), color: C.ink2, alpha: a });
      // one book per copy that fits in a million tokens
      const n = Math.floor(nv.books);
      const show = k === 0 ? times : a;
      for (let b = 0; b < n; b++) {
        const ba = seg(show, b / (n + 2), (b + 2) / (n + 2));
        if (ba <= 0) continue;
        const bx = NV.x + b * 22;
        ctx.globalAlpha = ba;
        rr(ctx, bx, y + 34, 16, 32, 3);
        ctx.fillStyle = k === 0 ? C.tints[1] : C.tints[2];
        ctx.fill();
        ctx.strokeStyle = C.ink2;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      text(ctx, `約 ${Math.round(nv.books)} 冊ぶん`, NV.x + n * 22 + 8, y + 58, { font: F.jp(700, 19), color: C.accent, alpha: show });
    });
    text(ctx, '青空文庫の本文（ルビと注記を除く）を o200k_base で数えた', NV.x, NV.y + 262, { font: F.jp(500, 14), color: C.muted, alpha: pop('bo') });

    const ka = pop('good');
    text(ctx, '長く読めることと、どこでも同じようにうまく使えることは、別の話（8-1）', M.l, 832, { font: F.jp(700, 18), color: C.ink2, alpha: ka });
    example(ctx, M.l + 120, DOC.y - 50, g * (1 - winA), '文章と窓の位置は説明のための例');
    source(ctx, '各社の発表と公式の仕様（2026-10-14 確認）', ca, SOURCE_RIGHT);
  },
});
