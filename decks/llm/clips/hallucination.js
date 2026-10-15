// 4-6: answers that are not facts. A fluent answer cites a court case that does not exist (the
// chat is an example, the case name made up): what the model writes is a likely continuation,
// not a checked fact. In 2023 lawyers filed such citations, made by ChatGPT, and were sanctioned.
// ずんだもん: then say "I don't know". One analysis (Kalai et al., 2025) points at scoring that
// gives points for a guess and none for "I don't know"; a table of such scoring is drawn. One
// remedy is to let the model look things up before answering — chapter 5.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT, bubbleLayout, bubble, marker } from '../lib/parts.js';
import { text, measure, rr, line, arrow } from '../../../src/kit/draw.js';
import { tw, seg, outCubic } from '../../../src/kit/ease.js';
import { enter, focus, ring } from '../../../src/kit/cue.js';

const ASK = '航空会社を訴えた判例を教えて';
const CITE = '「山田 対 東西航空」（2019 年）';
const HEAD = '代表的なものに';
const TAIL = '\nがあります。この判決では、\n航空会社の責任が広く認められました。';
const LEFT = { x: M.l, w: 720 };
const FX = 900; // the real case
const TABLE = { x: M.l, y: 600 };
const ROWS = [
  ['答えて、当たった', '1 点'],
  ['答えて、外れた', '0 点'],
  ['「わからない」と言った', '0 点'],
];

export default clip({
  id: 'hallucination',
  title: '事実でない答え',
  kicker: 'ハルシネーション',
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'LLM は、{wrong}事実でないことを、\n事実と同じ調子で書くことがあるの。' },
    { id: 'b', text: 'これを、{name}ハルシネーションと呼ぶわ。' },
    { id: 'c', text: 'たとえば、{case}実在しない判例を、\nそれらしい名前と年で書いてしまうことがあるのよ。' },
    { id: 'd', still: true, text: '{plaus}文章が自然につながっていても、\n{fact}中身が正しいとは限らないわ。' },
    { id: 'e', text: '2023 年には、米国の弁護士が、{real}AI が作った実在しない判例を、\n裁判所に出してしまったの。' },
    { id: 'f', text: '裁判所は、その後の説明も含めて、問題にしたわ。' },
    { id: 'f2', still: true, text: '{fine}弁護士 2 人と事務所に、\n合わせて 5,000 ドルを支払うよう命じたのよ。' },
    { id: 'g', by: 'zunda', text: '{q}わからないなら、「わからない」と言えばいいのだ。' },
    { id: 'h', text: 'そうよね。{score}2025 年の研究に、こんな分析があるわ。' },
    { id: 'h2', still: true, text: '{rule}正解だけに点を付けて、「わからない」は 0 点にする評価が、\n{push}当て推量を後押ししている、というものよ。' },
    { id: 'i', text: '対策の一つは、{look}資料を調べて、\nその内容も使って答えを作ることよ。' },
    { id: 'i2', text: 'ただし、{notsure}調べれば必ず正しくなる、というわけではないの。' },
    { id: 'j', tail: 0.8, text: '検索などの{tool}道具を、アプリにつなぐ方法があるわ。\n次の章では、そのしくみを見ていきましょう。' },
  ],

  prepare(ctx) {
    const ask = bubbleLayout(ctx, ASK, 560, { font: F.jp(500, 24) });
    const ans = bubbleLayout(ctx, HEAD + CITE + TAIL, LEFT.w, { font: F.jp(500, 24), lh: 38, pad: 22 });
    return { ask, ans, citeX: measure(ctx, ans.font, HEAD), citeW: measure(ctx, ans.font, CITE) };
  },

  draw(ctx, t, { ask, ans, citeX, citeW }, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (name, dur = pace.enter) => tw(t, at(name) - lead, dur);

    // ——— the chat: a fluent answer with a case that does not exist
    const g = enter(t, at('a'), pace);
    bubble(ctx, LEFT.x + LEFT.w - ask.w, 120, ask, { fill: C.blueSoft, alpha: g });
    const ay = 120 + ask.h + 20;
    const chars = seg(t, at('a') + 0.4, at('wrong') + 1.6);
    bubble(ctx, LEFT.x, ay, ans, { fill: '#fff', stroke: C.rule, lw: 2, alpha: enter(t, at('a'), pace, 1), chars });
    const cx = LEFT.x + ans.pad + citeX;
    const cy = ay + ans.pad + ans.size * 0.62;
    const caseLit = focus(t, [at('case')], at('c.end') - cue.fall, cue).level[0];
    marker(ctx, cx, cy + 16, citeW, 4, tw(t, at('case') - lead, 0.6, outCubic), C.accent);
    ring(ctx, cx - 4, cy - 22, citeW + 8, 44, caseLit, C.accent, 8);
    tag(ctx, W - M.r, 104, 'ハルシネーション', { font: F.jp(700, 20), h: 38, padX: 14, fill: C.accent, color: '#fff', align: 'right', alpha: pop('name') });
    // what it is: a likely continuation, not a checked fact
    const pa = pop('plaus');
    const ya = ay + ans.h + 22;
    tag(ctx, LEFT.x, ya, '自然な文章', { font: F.jp(700, 18), h: 36, padX: 14, fill: C.ink, color: C.paper, alpha: pa });
    const fa = pop('fact');
    if (fa > 0) {
      const x = LEFT.x + 150;
      text(ctx, '≠', x, ya + 28, { font: F.sans(700, 30), color: C.red, alpha: fa });
      tag(ctx, x + 40, ya, '正しい中身', { font: F.jp(700, 18), h: 36, padX: 14, fill: '#fff', stroke: C.red, color: C.red, alpha: fa });
      text(ctx, '記録を探しても、この判例は見つからない', x + 190, ya + 25, { font: F.jp(500, 18), color: C.ink2, alpha: fa });
      ctx.save();
      ctx.globalAlpha = fa;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 3;
      line(ctx, cx - 4, cy, cx + citeW + 4, cy, outCubic(fa));
      ctx.restore();
    }

    // ——— the real case
    const ra = pop('real');
    if (ra > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(FX - 40, 140, 2, 400 * outCubic(ra));
      text(ctx, '2023', FX, 196, { font: F.cond(700, 84), color: C.ink, alpha: ra, ls: -1 });
      text(ctx, 'Mata v. Avianca', FX + 200, 176, { font: F.sans(600, 28), color: C.ink, alpha: ra });
      text(ctx, 'ニューヨーク南部地区連邦地裁', FX + 200, 210, { font: F.jp(500, 19), color: C.muted, alpha: ra });
      ['弁護士が、ChatGPT が作った', '実在しない判例 6 件を、', '書面に引用して提出した'].forEach((l, i) =>
        text(ctx, l, FX, 270 + i * 38, { font: F.jp(500, 24), color: C.ink, alpha: tw(t, at('real') - lead + 0.2 + i * pace.stagger, pace.enter) }),
      );
    }
    const fi = pop('fine');
    text(ctx, '制裁金 5,000 ドル', FX, 420, { font: F.jp(700, 32), color: C.accent, alpha: fi });
    text(ctx, '弁護士 2 人と事務所に、合わせて（連帯で）。その後の説明も理由に', FX, 456, { font: F.jp(500, 17), color: C.muted, alpha: fi });
    text(ctx, '実在しなかった判例の一つ：Varghese v. China Southern Airlines', FX, 500, { font: F.jp(500, 17), color: C.ink2, alpha: fi });

    // ——— scoring that rewards a guess
    const sa = pop('score');
    if (sa > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, TABLE.y - 40, (W - M.l - M.r) * outCubic(sa), 2);
      text(ctx, '2025 年の研究が分析した評価：正解だけに点を付ける', TABLE.x, TABLE.y, { font: F.jp(700, 20), color: C.ink2, alpha: sa });
      ROWS.forEach(([s, p], i) => {
        const a = tw(t, at('rule') - lead + i * pace.stagger * 2, pace.enter);
        const y = TABLE.y + 26 + i * 48;
        ctx.save();
        ctx.globalAlpha = a;
        rr(ctx, TABLE.x, y, 560, 40, 8);
        ctx.fillStyle = i === 2 ? C.panel : '#fff';
        ctx.fill();
        ctx.restore();
        text(ctx, s, TABLE.x + 16, y + 28, { font: F.jp(500, 21), color: C.ink, alpha: a });
        text(ctx, p, TABLE.x + 540, y + 28, { font: F.cond(700, 24), color: i === 0 ? C.green : C.ink2, align: 'right', alpha: a });
      });
      text(ctx, '→ わからなくても、答えを書いたほうが得になる', TABLE.x, TABLE.y + 196, { font: F.jp(700, 20), color: C.accent, alpha: pop('push') });
    }
    const qa = focus(t, [at('q')], at('g.end') - cue.fall, cue).level[0];
    ring(ctx, TABLE.x - 6, TABLE.y + 26 + 2 * 48 - 6, 572, 52, qa * sa, C.accent, 10);

    // ——— one remedy: look things up before answering (chapter 5)
    const la = pop('look');
    if (la > 0) {
      const x = FX;
      const y = TABLE.y + 10;
      text(ctx, '対策の一つ', x, y, { font: F.jp(700, 20), color: C.ink2, alpha: la });
      tag(ctx, x, y + 22, '資料を調べて、その内容も使って答える', { font: F.jp(700, 20), h: 44, padX: 16, fill: C.green, color: '#fff', alpha: la });
      text(ctx, '調べれば必ず正しくなる、わけではない', x, y + 92, { font: F.jp(500, 17), color: C.ink2, alpha: pop('notsure') });
      const ta = pop('tool');
      ctx.save();
      ctx.globalAlpha = ta;
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      ctx.lineWidth = 2.5;
      arrow(ctx, x + 10, y + 112, x + 10, y + 146, outCubic(ta), 10);
      ctx.restore();
      text(ctx, '検索などの道具を、アプリにつなぐ（5 章）', x + 30, y + 146, { font: F.jp(700, 21), color: C.ink, alpha: ta });
    }

    example(ctx, LEFT.x, 836, g, '会話は説明のための例。判例名は架空');
    source(ctx, 'Mata v. Avianca, S.D.N.Y. 2023; Kalai ほか（2025）', fi, SOURCE_RIGHT);
  },
});
