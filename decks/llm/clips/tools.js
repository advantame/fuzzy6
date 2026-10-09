// Tool use as a sequence diagram: the model only writes a request in a fixed format; the
// application runs the tool and writes the result back into the conversation. The weather
// question, the tool and its result are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example } from '../lib/parts.js';
import { text, rr, arrow, measure } from '../../../src/kit/draw.js';
import { tw, inOutCubic, outBack } from '../../../src/kit/ease.js';

const LANES = [
  { x: 220, name: 'ユーザー' },
  { x: 610, name: 'アプリ' },
  { x: 1000, name: 'LLM', dark: true },
  { x: 1390, name: '天気の API', note: '道具' },
];
// from lane → to lane, label, style
const STEPS = [
  [0, 1, '東京の今の気温は？', 'ja'],
  [1, 2, '会話 ＋ 使える道具の一覧', 'ja'],
  [2, 1, 'get_weather({"city": "東京"})', 'call'],
  [1, 3, '道具を実行する', 'ja'],
  [3, 1, '{"temp_c": 18}', 'json'],
  [1, 2, '結果を会話に書き足す', 'ja'],
  [2, 1, '東京の今の気温は 18℃ です。', 'answer'],
  [1, 0, '答えを表示', 'ja'],
];
const HEAD_Y = 128;
const Y0 = 236;
const DY = 74;
const AT = 1.0;
const STEP_T = 1.25;

export default clip({
  id: 'tools',
  title: '道具を使う',
  kicker: 'ツール使用（関数呼び出し）',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'モデルは文章を書くことしかできない。\nそこで、**道具を呼ぶ依頼**を、決まった形式で書かせる。' },
    { at: 5.8, to: 11.0, text: 'アプリが依頼を読んで道具を実行し、\n結果を会話に書き足す。' },
    { at: 11.2, to: 18, text: 'モデルはその結果を読んで、答えを書く。\n2023 年 6 月、OpenAI が API に「関数呼び出し」を加えた。' },
  ],

  draw(ctx, t) {
    // lifelines
    LANES.forEach((ln, i) => {
      const a = tw(t, 0.2 + i * 0.12, 0.5, (p) => outBack(p, 1.5));
      if (a <= 0) return;
      const w = Math.max(150, measure(ctx, F.jp(700, 24), ln.name) + 48);
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      rr(ctx, ln.x - w / 2, HEAD_Y - 34, w, 60, 12);
      ctx.fillStyle = ln.dark ? C.ink : C.panel;
      ctx.fill();
      ctx.restore();
      text(ctx, ln.name, ln.x, HEAD_Y + 4, { font: F.jp(700, 24), color: ln.dark ? C.paper : C.ink, align: 'center', base: 'middle', alpha: Math.min(1, a) });
      if (ln.note) text(ctx, ln.note, ln.x, HEAD_Y - 48, { font: F.jp(500, 18), color: C.muted, align: 'center', alpha: Math.min(1, a) });
      const grow = tw(t, 0.5 + i * 0.12, 0.8, inOutCubic);
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(ln.x, HEAD_Y + 30);
      ctx.lineTo(ln.x, HEAD_Y + 30 + (Y0 + DY * STEPS.length - HEAD_Y - 60) * grow);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // messages, one after another
    STEPS.forEach(([from, to, label, kind], i) => {
      const at = AT + i * STEP_T;
      const p = tw(t, at, 0.55, inOutCubic);
      if (p <= 0) return;
      const y = Y0 + i * DY;
      const x0 = LANES[from].x;
      const x1 = LANES[to].x;
      const dir = Math.sign(x1 - x0);
      const hot = kind === 'call';
      ctx.strokeStyle = hot ? C.accent : kind === 'answer' ? C.ink : C.ink2;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = hot ? 4 : 2.5;
      arrow(ctx, x0 + dir * 8, y, x1 - dir * 8, y, p, 13);
      const la = tw(t, at + 0.25, 0.4);
      const font = kind === 'call' || kind === 'json' ? F.mono(600, 21) : F.jp(kind === 'answer' ? 700 : 500, 21);
      const cx = (x0 + x1) / 2;
      if (hot || kind === 'json') {
        const w = measure(ctx, font, label) + 28;
        ctx.save();
        ctx.globalAlpha = la;
        rr(ctx, cx - w / 2, y - 46, w, 36, 8);
        ctx.fillStyle = hot ? C.accentSoft : '#fff';
        ctx.fill();
        ctx.restore();
      }
      text(ctx, label, cx, y - 20, { font, color: hot ? C.accent : C.ink, align: 'center', alpha: la });
      text(ctx, String(i + 1), Math.min(x0, x1) - 56, y + 7, { font: F.cond(700, 22), color: C.muted, align: 'right', alpha: la });
    });

    // the point: the model only asks; the app acts
    const callY = Y0 + 2 * DY;
    const k = tw(t, AT + 2 * STEP_T + 0.9, 0.6);
    if (k > 0) {
      text(ctx, '← モデルは依頼を書くだけ', LANES[2].x + 26, callY + 8, { font: F.jp(700, 21), color: C.accent, alpha: k });
    }
    const r = tw(t, AT + 3 * STEP_T + 0.6, 0.6);
    if (r > 0) {
      text(ctx, '実行するのはアプリ →', LANES[1].x - 26, Y0 + 3 * DY + 8, { font: F.jp(700, 21), color: C.ink2, align: 'right', alpha: r });
    }
    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '質問・道具・結果は説明のための例');
  },
});
