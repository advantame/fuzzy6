// 4-5: read again every time. A chatbot seems to remember, but the LLM's parameters do not change
// while it answers: the app puts the conversation so far into every document it has the LLM
// read. Turn by turn the document grows (the third answer can use what the first turns said),
// and so does what is read each time — until it reaches the context window. Then the app leaves
// out the oldest part or keeps a summary. Memory across conversations works the same way: saved
// notes are written into the document. Drawn on the tool diagram's parts (lib/rig.js), with the
// amount read each time on the right, where the tool will stand in chapter 5.
// The conversation, the amounts and the window are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example } from '../lib/parts.js';
import { layout, llmBlock, appFrame, channel, docLayout, docEntry, sweep, send } from '../lib/rig.js';
import { text, rr, line } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

const L = layout();
const TURNS = [
  ['user', '週末、京都に行きます'],
  ['assistant', 'いいですね。何日の予定ですか？'],
  ['user', '二日です'],
  ['assistant', 'それなら、一日めは東山を歩くのはどうでしょう。'],
  ['user', 'お昼のおすすめは？'],
  ['assistant', '一日めの東山なら、湯豆腐のお店が近いですよ。'],
];
const NOTE = '（保存したメモ）辛いものが苦手';
const SUMMARY = '（ここまでの要約）京都に二日。一日めは東山';
// what is read each time, in an example unit; the window holds WIN
const READ = [1, 2.4, 4.0, 5.6];
const WIN = 5;
const CHART = { x: 1206, y: 200, w: W - M.r - 1206, h: 520 };

export default clip({
  id: 'memory',
  title: '毎回読み直す',
  kicker: '会話の記憶',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'チャットボットと話していると、{seem}前に話したことを、\n覚えているように見えるでしょう。' },
    { id: 'b', text: 'でも、ふつう、{fixed}答えを作るあいだは、\nLLM のパラメータを更新しないのだったわね。' },
    { id: 'c', text: '覚えているように見えるのは、{resend}前のやりとりも、\n今回の答えを作るための入力に含めているからなの。' },
    { id: 'c2', text: '{two}履歴をアプリから渡す方法も、\n{server}サーバーに保存した履歴を使う方法もあるわ。' },
    { id: 'd', text: '{t2}たとえば 2 回目は、前の質問と答えに、\n新しい質問をつないで読ませるわ。' },
    { id: 'd2', text: '{t3}3 回目も、それまでのやりとりにつなげるの。' },
    { id: 'd3', text: '前と同じ部分の計算結果は、{reuse}使い回すこともできるわ。' },
    { id: 'e', still: true, text: '省略せずに足し続けると、{grow}一度に読ませる入力は、\n長くなっていくの。' },
    { id: 'f', by: 'zunda', text: '{q}ずっと話していたら、どうなるのだ？' },
    { id: 'g', text: 'そのまま足し続ければ、\n{limit}コンテキストウィンドウの上限に届くわ。' },
    { id: 'h', text: '続けるために、{cut}古い部分を省いたり、\n{sum}要約などで短くしたりする方法があるの。' },
    { id: 'h2', still: true, text: '{app2}上限の扱いは、アプリの仕組みによって違うわ。' },
    { id: 'i', text: '会話をまたいで、{mem}保存した情報を使うメモリー機能もあるわ。' },
    { id: 'i2', tail: 0.8, text: 'たとえば、{pref}保存しておいた好みを、\n次の会話の入力に加える作り方があるの。' },
  ],

  prepare(ctx) {
    const opts = { top: 26, gap: 18, font: F.jp(500, 22), lh: 32 };
    const E = docLayout(ctx, L, TURNS.map(([role, s]) => ({ role, text: s })), opts);
    // after the summary: the note at the head, the summary, then the last turns
    const after = docLayout(ctx, L, [{ role: 'system', text: NOTE }, { role: 'system', text: SUMMARY }, ...TURNS.slice(2).map(([role, s]) => ({ role, text: s }))], opts);
    return { E, after };
  },

  draw(ctx, t, { E, after }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    // ——— when each turn is read and answered
    const t2 = at('t2');
    const t3 = at('t3');
    const t4 = at('limit');
    const turnAt = [at('resend'), t2, t3, t4]; // the reads (the fourth when the limit is reached)
    const shown = () => {
      // how many entries are in the document at time t
      if (t < at('a')) return 0;
      if (t < t2) return 2;
      if (t < t2 + 0.9) return 3;
      if (t < t3) return 4;
      if (t < t3 + 0.9) return 5;
      return 6;
    };
    const n = shown();

    // ——— the app and its document
    const g = enter(t, at('a'), pace);
    appFrame(ctx, L, g, { name: 'アプリ', note: '前のやりとりも、入力に含める', noteAlpha: pop('resend') });
    const reading = turnAt.map((x) => seg(t, x - 0.1, x + 0.9));
    const glow = Math.max(...reading.map((p) => (p > 0.3 && p < 1 ? 1 : 0)));
    llmBlock(ctx, L, g, { glow });
    channel(ctx, L.read, g);
    channel(ctx, L.write, g);
    tag(ctx, L.llm.x + L.llm.w / 2, L.llm.y + L.llm.h + 24, 'パラメータは更新しない', { font: F.jp(700, 17), h: 32, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: pop('fixed') });

    // the document: the turns so far; after the summary, the shorter one
    const cut = tw(t, at('cut') - lead, 0.6);
    const sum = tw(t, at('sum') - lead, 0.8, inOutCubic);
    const memA = pop('pref');
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.doc.x, L.doc.y, L.doc.w, L.doc.h);
    ctx.clip();
    if (sum < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - sum;
      E.forEach((e, i) => {
        if (i >= n) return;
        const a = i < 2 ? enter(t, at('a'), pace, i) : tw(t, [t2, t2 + 0.9, t3, t3 + 0.9][i - 2] - 0.2, pace.enter);
        docEntry(ctx, e, a, { dim: i < 2 && cut > 0.5 });
        if (i < 2 && cut > 0) {
          // the oldest part, crossed out
          ctx.save();
          ctx.globalAlpha *= cut;
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 3;
          line(ctx, e.tx - 6, e.y + e.h / 2, e.tx + e.w - 30, e.y + e.h / 2, outCubic(cut));
          ctx.restore();
        }
      });
      ctx.restore();
    }
    if (sum > 0) {
      after.forEach((e, i) => {
        if (i === 0) {
          docEntry(ctx, e, memA, {});
          return;
        }
        // before the note comes in, everything below it sits one entry higher
        const dy = (after[1].y - after[0].y) * (1 - memA);
        ctx.save();
        ctx.translate(0, -dy);
        docEntry(ctx, e, sum, { color: i === 1 ? C.green : C.ink });
        ctx.restore();
      });
    }
    ctx.restore();
    // every read covers the whole document
    reading.forEach((p, k) => {
      const entries = [2, 3, 5, 6][k];
      const src = sum > 0.5 ? after : E;
      const last = src[Math.min(entries, src.length) - 1];
      sweep(ctx, L, p, last ? last.y + last.h : L.doc.y + 60);
      send(ctx, L.read, seg(t, turnAt[k] + 0.1, turnAt[k] + 0.7), '', 'doc');
    });

    // ——— what is read each time, against the window
    const ca = pop('t2');
    if (ca > 0) {
      text(ctx, '1 回に読ませる量', CHART.x, CHART.y - 20, { font: F.jp(700, 19), color: C.ink2, alpha: ca });
      ctx.fillStyle = C.rule;
      ctx.globalAlpha = ca;
      ctx.fillRect(CHART.x, CHART.y + CHART.h, CHART.w, 2);
      ctx.globalAlpha = 1;
    }
    const unit = (CHART.h - 40) / 6;
    const growLit = focus(t, [at('grow')], at('e.end') - cue.fall, cue).level[0];
    READ.forEach((v, k) => {
      const a = tw(t, turnAt[k] - lead, pace.enter) * ca;
      if (a <= 0) return;
      const bw = 50;
      const x = CHART.x + 20 + k * (bw + 20);
      // the fourth read is shortened once the summary is in
      const val = k === 3 ? lerp(v, 3.0, sum) : v;
      const h = unit * val * outCubic(seg(t, turnAt[k], turnAt[k] + 0.6));
      const over = Math.max(0, val - WIN) * unit;
      ctx.globalAlpha = a;
      ctx.fillStyle = C.ink;
      ctx.fillRect(x, CHART.y + CHART.h - Math.min(h, WIN * unit), bw, Math.min(h, WIN * unit));
      if (h > WIN * unit) {
        ctx.fillStyle = C.red;
        ctx.fillRect(x, CHART.y + CHART.h - h, bw, Math.min(over, h - WIN * unit));
      }
      ctx.globalAlpha = 1;
      text(ctx, `${k + 1} 回目`, x + bw / 2, CHART.y + CHART.h + 28, { font: F.jp(500, 16), color: C.ink2, align: 'center', alpha: a });
    });
    ring(ctx, CHART.x + 10, CHART.y + CHART.h - unit * 4.2, 3 * 70, unit * 4.2, growLit, C.accent, 8);
    // the window's limit
    const la = pop('limit');
    if (la > 0) {
      const y = CHART.y + CHART.h - WIN * unit;
      ctx.save();
      ctx.globalAlpha = la;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 7]);
      line(ctx, CHART.x, y, CHART.x + CHART.w, y, outCubic(la));
      ctx.restore();
      text(ctx, 'ウィンドウの上限', CHART.x + CHART.w, y - 12, { font: F.jp(700, 17), color: C.accent, align: 'right', alpha: la });
    }
    const ha = pop('sum');
    text(ctx, '古い部分を省く／要約などで短くする', CHART.x, CHART.y + CHART.h + 66, { font: F.jp(700, 16), color: C.ink2, alpha: ha });
    text(ctx, '扱いはアプリの仕組みによる', CHART.x + CHART.w, CHART.y - 50, { font: F.jp(500, 15), color: C.ink2, align: 'right', alpha: pop('app2') });
    // where the history is kept
    const two = pop('two');
    tag(ctx, L.app.x + 18, L.app.y - 46, '履歴をアプリから渡す', { font: F.jp(700, 15), h: 30, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: two });
    tag(ctx, L.app.x + 210, L.app.y - 46, 'サーバーに保存した履歴を使う', { font: F.jp(700, 15), h: 30, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: pop('server') });
    // the same front part need not be worked out again (chapter 9)
    tag(ctx, L.llm.x - 10, L.llm.y + L.llm.h + 70, '同じ部分の計算は、使い回せる（9 章）', { font: F.jp(700, 14), h: 28, padX: 8, fill: C.panel, color: C.ink2, alpha: pop('reuse') });
    // memory across conversations
    tag(ctx, CHART.x, CHART.y + CHART.h + 82, 'メモリー：保存した情報を使う', { font: F.jp(700, 15), h: 30, padX: 10, fill: C.ink, color: C.paper, alpha: pop('mem') });

    example(ctx, L.app.x, L.app.y + L.app.h + 22, g, '会話、量、上限は説明のための例');
  },
});
