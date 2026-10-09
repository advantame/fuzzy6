// A coding agent at work: search, read, run the tests (fail), edit, run again (pass), shown
// in an editor with its terminal, beside the list of tool calls. Then SWE-bench. The code and
// the steps are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source } from '../lib/parts.js';
import { text, rr, circle, typed } from '../../../src/kit/draw.js';
import { tw, seg } from '../../../src/kit/ease.js';

const ED = { x: M.l, y: 110, w: 900, h: 690 };
const CODE = [
  'def average(xs):',
  '    return sum(xs) / len(xs) + 1',
];
const FIXED = '    return sum(xs) / len(xs)';
const TEST = 'assert average([2, 4]) == 3';
// tool calls: [time, verb, object, result, tone]
const CALLS = [
  [1.2, '検索', '"average"', '2 件', 'ok'],
  [2.3, '読む', 'average.py', '', 'ok'],
  [3.4, '実行', 'pytest', '失敗', 'bad'],
  [6.0, '編集', 'average.py 2 行目', '', 'ok'],
  [8.0, '実行', 'pytest', '成功', 'good'],
];
const LIST_X = 1080;
const FACT = 11.2;
const MONO = F.mono(500, 24);

export default clip({
  id: 'coding',
  title: 'コードを直す',
  kicker: 'コーディングエージェント',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.4, text: 'コーディングエージェントは、ファイルを読み、\nコードを書き換え、テストを実行する。' },
    { at: 5.6, to: 11.0, text: 'テストが失敗すれば、その出力を読んで、また直す。' },
    { at: 11.2, to: 18, text: '実在する GitHub の課題 2,294 件を集めた SWE-bench（2023）は、\n能力を測る試験として広く使われた。' },
  ],

  draw(ctx, t) {
    // ——— editor
    const e = tw(t, 0.2, 0.6);
    ctx.save();
    ctx.globalAlpha = e;
    rr(ctx, ED.x, ED.y, ED.w, ED.h, 16);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.stroke();
    // tabs
    rr(ctx, ED.x + 20, ED.y + 18, 190, 44, 8);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.restore();
    text(ctx, 'average.py', ED.x + 40, ED.y + 48, { font: F.mono(600, 20), color: C.ink, alpha: e });
    text(ctx, 'test_average.py', ED.x + 236, ED.y + 48, { font: F.mono(400, 20), color: C.muted, alpha: e });

    // code (line 2 is the bug; after the edit it shows as a diff)
    const reading = seg(t, 2.3, 3.0) * (1 - seg(t, 3.3, 3.6));
    if (reading > 0) {
      ctx.fillStyle = C.accentSoft;
      ctx.globalAlpha = reading;
      ctx.fillRect(ED.x + 20, ED.y + 96, ED.w - 40, 96);
      ctx.globalAlpha = 1;
    }
    const edited = t >= 6.3;
    const codeA = tw(t, 0.5, 0.5);
    text(ctx, '1', ED.x + 36, ED.y + 132, { font: MONO, color: C.muted, alpha: codeA });
    text(ctx, CODE[0], ED.x + 80, ED.y + 132, { font: MONO, color: C.ink, alpha: codeA });
    if (!edited) {
      text(ctx, '2', ED.x + 36, ED.y + 176, { font: MONO, color: C.muted, alpha: codeA });
      text(ctx, CODE[1], ED.x + 80, ED.y + 176, { font: MONO, color: C.ink, alpha: codeA });
    } else {
      const d = tw(t, 6.3, 0.4);
      ctx.save();
      ctx.globalAlpha = d;
      ctx.fillStyle = '#ffe1dd';
      ctx.fillRect(ED.x + 20, ED.y + 150, ED.w - 40, 40);
      ctx.fillStyle = C.greenSoft;
      ctx.fillRect(ED.x + 20, ED.y + 194, ED.w - 40, 40);
      ctx.restore();
      text(ctx, '-', ED.x + 36, ED.y + 176, { font: MONO, color: C.red, alpha: d });
      text(ctx, CODE[1], ED.x + 80, ED.y + 176, { font: MONO, color: C.red, alpha: d });
      text(ctx, '+', ED.x + 36, ED.y + 220, { font: MONO, color: C.green, alpha: d });
      text(ctx, typed(FIXED, seg(t, 6.5, 7.3)), ED.x + 80, ED.y + 220, { font: MONO, color: C.green });
    }
    text(ctx, `# test: ${TEST}`, ED.x + 80, ED.y + 290, { font: F.mono(400, 21), color: C.muted, alpha: tw(t, 0.9, 0.5) });

    // terminal
    const ty = ED.y + ED.h - 300;
    ctx.save();
    ctx.globalAlpha = e;
    rr(ctx, ED.x + 20, ty, ED.w - 40, 280, 12);
    ctx.fillStyle = C.ink;
    ctx.fill();
    ctx.restore();
    text(ctx, 'ターミナル', ED.x + 44, ty + 38, { font: F.jp(500, 18), color: '#8f8a80', alpha: e });
    const lines = [];
    if (t >= 3.6) lines.push(['$ pytest', '#e9e5dc']);
    if (t >= 4.1) lines.push(['FAILED test_average - assert 4.0 == 3', '#ff7b6e']);
    if (t >= 8.2) lines.push(['$ pytest', '#e9e5dc']);
    if (t >= 8.7) lines.push(['1 passed', '#6fd39a']);
    lines.slice(-4).forEach(([s, col], i) => text(ctx, s, ED.x + 44, ty + 92 + i * 44, { font: F.mono(500, 22), color: col }));

    // ——— tool calls
    const la = tw(t, 0.8, 0.5);
    text(ctx, '道具の呼び出し', LIST_X, 140, { font: F.jp(700, 24), color: C.ink2, alpha: la });
    CALLS.forEach(([at, verb, obj, result, tone], i) => {
      const a = tw(t, at, 0.4);
      if (a <= 0) return;
      const y = 196 + i * 70;
      const col = tone === 'bad' ? C.red : tone === 'good' ? C.green : C.ink;
      ctx.fillStyle = col;
      ctx.globalAlpha = a;
      circle(ctx, LIST_X + 10, y - 8, 7);
      ctx.fill();
      if (i < CALLS.length - 1 && t >= CALLS[i + 1][0]) {
        ctx.fillStyle = C.rule;
        ctx.fillRect(LIST_X + 9, y + 4, 2, 52);
      }
      ctx.globalAlpha = 1;
      const vw = text(ctx, verb, LIST_X + 32, y, { font: F.jp(700, 23), color: C.ink, alpha: a });
      text(ctx, obj, LIST_X + 32 + vw + 12, y, { font: F.mono(500, 19), color: C.ink2, alpha: a });
      if (result) text(ctx, `→ ${result}`, W - M.r, y, { font: F.jp(700, 22), color: col, align: 'right', alpha: tw(t, at + 0.6, 0.4) });
    });

    // ——— SWE-bench
    const f = tw(t, FACT, 0.6);
    if (f > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(LIST_X, 560, (W - M.r - LIST_X) * f, 2);
      text(ctx, 'SWE-bench（2023）', LIST_X, 612, { font: F.sans(700, 28), color: C.ink, alpha: f });
      const n = tw(t, FACT + 0.3, 0.6);
      const w = text(ctx, '2,294', LIST_X, 714, { font: F.cond(700, 96), color: C.accent, alpha: n, ls: -1 });
      text(ctx, '件', LIST_X + w + 8, 712, { font: F.jp(700, 34), color: C.accent, alpha: n });
      text(ctx, '実在する GitHub の課題と修正', LIST_X, 760, { font: F.jp(500, 21), color: C.ink2, alpha: tw(t, FACT + 0.6, 0.5) });
      text(ctx, '12 の Python リポジトリから', LIST_X, 792, { font: F.jp(500, 21), color: C.ink2, alpha: tw(t, FACT + 0.7, 0.5) });
      source(ctx, 'Jimenez ほか（2023）', f);
    }
    example(ctx, ED.x + 20, ED.y + ED.h + 14, tw(t, 0.8, 0.5), 'コードと手順は説明のための例');
  },
});
