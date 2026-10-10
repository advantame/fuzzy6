// The log is the source of truth (dsh docs/architecture.md): a session's events are appended to a
// log that is never rewritten, and the document the model reads is derived from it every time
// (deriveMessages()). Compaction appends an event and changes the derived document; the earlier
// events stay in the log. "Model-visible means logged." Stored as JSONL (session.vN.jsonl). The
// session is an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { ROLE } from '../lib/rig.js';
import { text, rr, arrow, measure } from '../../../src/kit/draw.js';
import { tw, seg, keys, inOutCubic, outExpo } from '../../../src/kit/ease.js';

const LOG = { x: M.l, y: 112, w: 560, h: 520 };
const DOC = { x: 830, y: 112, w: W - M.r - 830, h: 520 };
// [kind, text, when it is appended]
const EVENTS = [
  ['入力', 'ログインの不具合を直して', 0.9],
  ['呼び出し', 'bash: npm test', 1.6],
  ['結果', '2 failed', 2.3],
  ['呼び出し', 'edit: login.ts', 3.0],
  ['結果', '書き換えました', 3.7],
  ['圧縮', '1〜5 を要約した', 6.2],
  ['返答', '直しました。テストも通ります', 8.8],
];
const KIND = {
  入力: { fill: C.blueSoft, color: C.blue },
  呼び出し: { fill: C.accentSoft, color: C.accent },
  結果: { fill: '#eef6f0', color: C.green },
  圧縮: { fill: C.ink, color: C.paper },
  返答: { fill: C.panel, color: C.ink },
};
// the derived document's rows: [role, kind, text, from event, until (compaction) or null]
const ROWS = [
  ['user', 'text', 'ログインの不具合を直して', 0, 6.5],
  ['assistant', 'call', 'bash: npm test', 1, 6.5],
  ['result', 'data', '2 failed', 2, 6.5],
  ['assistant', 'call', 'edit: login.ts', 3, 6.5],
  ['result', 'data', '書き換えました', 4, 6.5],
];
const SUMMARY = ['system', 'text', 'これまでの要約：テストが 2 件落ち、login.ts を直した'];
const FINAL = ['assistant', 'text', '直しました。テストも通ります'];
const END = 11.4;

export default clip({
  id: 'eventlog',
  title: '記録が正本',
  kicker: '見たものは記録に',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'dsh は、セッションの出来事を、追記するだけの記録に残す。\nモデルに読ませる文書は、毎回この記録から組み立てる。' },
    { at: 6.0, to: 11.2, text: '要約で文書を縮めても、記録には「要約した」という出来事が\n足されるだけ。元のやりとりは消えない。' },
    { at: 11.4, to: 18, text: '合言葉は「Model-visible means logged」。モデルが見たものは、\nすべて記録にある。再開も、あとからの点検もしやすい。' },
  ],

  draw(ctx, t) {
    // ——— the log
    const la = tw(t, 0.4, 0.5);
    panel(ctx, LOG, C.panel, la);
    text(ctx, '記録', LOG.x + 22, LOG.y + 40, { font: F.jp(700, 24), color: C.ink, alpha: la });
    text(ctx, '追記するだけ', LOG.x + 84, LOG.y + 39, { font: F.jp(500, 17), color: C.ink2, alpha: la });
    text(ctx, 'session.vN.jsonl', LOG.x + LOG.w - 22, LOG.y + 39, { font: F.mono(500, 16), color: C.ink2, align: 'right', alpha: la });
    const kept = tw(t, 7.6, 0.5) * (1 - tw(t, 10.6, 0.6));
    EVENTS.forEach(([kind, s, at], i) => {
      const a = tw(t, at, 0.35);
      if (a <= 0) return;
      const y = LOG.y + 64 + i * 62;
      const dy = (1 - a) * 12;
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, LOG.x + 16, y + dy, LOG.w - 32, 50, 10);
      ctx.fillStyle = '#fff';
      ctx.fill();
      if (i < 5 && kept > 0) {
        ctx.globalAlpha = a * kept;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
      text(ctx, `${i + 1}`, LOG.x + 40, y + 32 + dy, { font: F.mono(600, 17), color: C.muted, align: 'center', alpha: a });
      const k = KIND[kind];
      const w = tag(ctx, LOG.x + 62, y + 11 + dy, kind, { font: F.jp(700, 15), h: 28, padX: 10, fill: k.fill, color: k.color, alpha: a });
      text(ctx, s, LOG.x + 62 + w + 14, y + 31 + dy, { font: kind === '呼び出し' || kind === '結果' ? F.mono(500, 17) : F.jp(500, 18), color: C.ink, alpha: a });
    });
    text(ctx, '1〜5 の元のやりとりは、記録に残っている', LOG.x + 4, LOG.y + LOG.h + 30, { font: F.jp(700, 17), color: C.green, alpha: kept });

    // ——— derived each time
    const aa = tw(t, 1.0, 0.5);
    const pulse = EVENTS.some(([, , at]) => t >= at && t < at + 0.5);
    // aimed at the middle of the document, which shrinks
    const ay = DOC.y + keys(t, [[6.5, DOC.h], [7.3, 190]]) / 2;
    ctx.save();
    ctx.globalAlpha = aa;
    ctx.strokeStyle = pulse ? C.accent : C.ink2;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = pulse ? 3.5 : 2.5;
    arrow(ctx, LOG.x + LOG.w + 16, ay, DOC.x - 16, ay, 1, 12);
    ctx.restore();
    text(ctx, 'deriveMessages()', (LOG.x + LOG.w + DOC.x) / 2, ay - 18, { font: F.mono(600, 15), color: pulse ? C.accent : C.ink2, align: 'center', alpha: aa });
    text(ctx, '毎回組み立てる', (LOG.x + LOG.w + DOC.x) / 2, ay + 34, { font: F.jp(500, 15), color: C.muted, align: 'center', alpha: aa });

    // ——— the document the model reads
    const da = tw(t, 1.0, 0.5);
    // the document shrinks when it is summarised; the log does not
    const dh = keys(t, [[6.5, DOC.h], [7.3, 190]]);
    panel(ctx, { ...DOC, h: dh }, '#fff', da, true);
    text(ctx, '文書は縮んでも、記録は短くならない', DOC.x + 4, DOC.y + 190 + 34, { font: F.jp(700, 18), color: C.accent, alpha: tw(t, 7.6, 0.5) });
    text(ctx, 'モデルに読ませる文書', DOC.x + 22, DOC.y + 40, { font: F.jp(700, 22), color: C.ink, alpha: da });
    const shrink = inOutCubic(seg(t, 6.5, 7.2));
    ctx.save();
    rr(ctx, DOC.x, DOC.y, DOC.w, dh, 18);
    ctx.clip();
    ROWS.forEach(([role, kind, s, from], i) => {
      const a = tw(t, EVENTS[from][2] + 0.3, 0.35) * (1 - shrink);
      docRow(ctx, DOC.x + 18, DOC.y + 66 + i * 46, role, kind, s, a);
    });
    ctx.restore();
    const sa = tw(t, 6.9, 0.5);
    docRow(ctx, DOC.x + 18, DOC.y + 66, ...SUMMARY, sa);
    docRow(ctx, DOC.x + 18, DOC.y + 66 + 46, ...FINAL, tw(t, 9.1, 0.4));
    text(ctx, '要約したあとの文書', DOC.x + DOC.w - 22, DOC.y + 39, { font: F.jp(700, 16), color: C.accent, align: 'right', alpha: sa });

    // ——— the rule
    const ea = tw(t, END, 0.6);
    if (ea > 0) {
      const y = 690;
      ctx.save();
      ctx.globalAlpha = ea;
      rr(ctx, M.l, y, W - M.l - M.r, 64, 12);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, '“Model-visible means logged.”', M.l + 26, y + 41, { font: F.sans(600, 24), color: C.paper, alpha: ea });
      text(ctx, 'モデルが見たものは、すべて記録にある', W - M.r - 26, y + 41, { font: F.jp(700, 21), color: C.paper, align: 'right', alpha: ea });
      text(ctx, 'ステップはモデルへの 1 回の依頼とそのツール。ターンは、入力を受けて落ち着くまで（0 回以上のステップ）', M.l, y + 98, { font: F.jp(500, 17), color: C.ink2, alpha: tw(t, END + 0.8, 0.5) });
    }

    example(ctx, M.l, 818, tw(t, 1.4, 0.5), 'セッションの中身は説明のための例');
    source(ctx, 'deepseek-harness docs/architecture.md（2026-10-09 の版）', la);
  },
});

// A panel; paper ones get a hairline.
function panel(ctx, b, fill, a, line = false) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, b.x, b.y, b.w, b.h, 18);
  ctx.fillStyle = fill;
  ctx.fill();
  if (line) {
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

// One row of the derived document, in the role marks of the tool diagram.
function docRow(ctx, x, y, role, kind, s, a) {
  if (a <= 0.001) return;
  const r = ROLE[role];
  const font = F.jp(700, 14);
  const w = measure(ctx, font, r.name) + 16;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y + 4, w, 26, 6);
  ctx.fillStyle = r.fill;
  ctx.fill();
  ctx.restore();
  text(ctx, r.name, x + w / 2, y + 18, { font, color: r.color, align: 'center', base: 'middle', alpha: a });
  const tx = x + 118;
  if (kind !== 'text') {
    ctx.save();
    ctx.globalAlpha = a;
    rr(ctx, tx, y, DOC.w - 18 - 118 - 18, 34, 8);
    ctx.fillStyle = kind === 'call' ? C.accentSoft : '#eef6f0';
    ctx.fill();
    ctx.fillStyle = kind === 'call' ? C.accent : C.green;
    ctx.fillRect(tx, y + 5, 4, 24);
    ctx.restore();
  }
  text(ctx, s, tx + (kind === 'text' ? 0 : 14), y + 24, { font: kind === 'text' ? F.jp(500, 18) : F.mono(500, 17), color: C.ink, alpha: a });
}
