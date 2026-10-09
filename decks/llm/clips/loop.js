// The agent loop: think → use a tool → look at the result, around and around until the goal
// is met, with each lap written into a log. The task and the steps are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example } from '../lib/parts.js';
import { text, circle, arrowHead, arrow, rr } from '../../../src/kit/draw.js';
import { tw, inOutCubic, outBack } from '../../../src/kit/ease.js';

const LOOP = { x: 360, y: 506, r: 196 };
const NODES = [
  { name: '考える', a: -90 },
  { name: '道具を使う', a: 30 },
  { name: '結果を見る', a: 150 },
];
const LAPS = [
  { think: 'まず失敗を確かめる', tool: 'テストを実行', result: '2 件失敗', tone: 'bad' },
  { think: '原因を探す', tool: 'ファイルを読む', result: '計算の誤りを発見', tone: 'ok' },
  { think: '誤りを直す', tool: 'ファイルを編集', result: '保存した', tone: 'ok' },
  { think: 'もう一度確かめる', tool: 'テストを実行', result: 'すべて成功', tone: 'good' },
];
const S0 = 1.2;
const LAP = 2.4;
const DONE = S0 + LAPS.length * LAP + 0.2;
const LOG_X = 800;
const ROW0 = 210;
const ROW = 118;
const rad = (d) => (d * Math.PI) / 180;

export default clip({
  id: 'loop',
  title: '動いて確かめる',
  kicker: 'エージェントのループ',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.4, text: 'エージェントは、道具を使うやりとりを**ループ**にしたもの。' },
    { at: 5.6, to: 11.0, text: '結果を見て、次に何をするかをモデル自身が決める。\n目的を果たすまで、これをくり返す。' },
    { at: 11.2, to: 18, text: '2022 年の研究 ReAct は、考えることと動くことを\n交互にくり返すやり方を提案した。' },
  ],

  draw(ctx, t) {
    tag(ctx, M.l, 92, '目的：落ちているテストを直す', { font: F.jp(700, 24), h: 48, padX: 22, fill: C.ink, color: C.paper, alpha: tw(t, 0.3, 0.5) });
    example(ctx, M.l, 818, tw(t, 0.8, 0.5), '作業の中身は説明のための例');

    // where the agent is: lap and position around the loop
    const k = Math.floor((t - S0) / LAP);
    const lap = Math.max(0, Math.min(LAPS.length - 1, k));
    const u = t < S0 ? 0 : t >= DONE - 0.2 ? 0 : ((t - S0) % LAP) / LAP; // 0 → 1 around
    const node = t < S0 ? -1 : t >= DONE - 0.2 ? 0 : Math.floor(u * 3);

    // the ring
    const ring = tw(t, 0.5, 0.8, inOutCubic);
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(LOOP.x, LOOP.y, LOOP.r, rad(-90), rad(-90) + Math.PI * 2 * ring);
    ctx.stroke();
    if (ring >= 1) {
      ctx.fillStyle = C.rule;
      for (const d of [-30, 90, 210]) {
        const a = rad(d);
        arrowHead(ctx, LOOP.x + Math.cos(a) * LOOP.r, LOOP.y + Math.sin(a) * LOOP.r, a + Math.PI / 2, 22);
      }
    }
    // the travelling agent
    if (t >= S0 && t < DONE - 0.2) {
      const a = rad(-90 + 360 * u);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(LOOP.x, LOOP.y, LOOP.r, rad(-90), a);
      ctx.stroke();
      ctx.fillStyle = C.accent;
      circle(ctx, LOOP.x + Math.cos(a) * LOOP.r, LOOP.y + Math.sin(a) * LOOP.r, 13);
      ctx.fill();
    }
    NODES.forEach((n, i) => {
      const p = tw(t, 0.6 + i * 0.2, 0.5, (q) => outBack(q, 1.8));
      if (p <= 0) return;
      const a = rad(n.a);
      const x = LOOP.x + Math.cos(a) * LOOP.r;
      const y = LOOP.y + Math.sin(a) * LOOP.r;
      const on = node === i;
      ctx.fillStyle = on ? C.accent : C.paper;
      ctx.strokeStyle = on ? C.accent : C.ink;
      ctx.lineWidth = 4;
      circle(ctx, x, y, 22 * Math.min(1.15, p));
      ctx.fill();
      ctx.stroke();
      const lx = x + (i === 0 ? 0 : i === 1 ? 40 : -40);
      const ly = y + (i === 0 ? -42 : 52);
      text(ctx, n.name, lx, ly, { font: F.jp(700, 26), color: on ? C.accent : C.ink, align: i === 0 ? 'center' : i === 1 ? 'left' : 'right', alpha: Math.min(1, p) });
    });
    if (t >= S0) {
      const lapsShown = t >= DONE - 0.2 ? LAPS.length : lap + 1;
      text(ctx, `${lapsShown}`, LOOP.x, LOOP.y + 26, { font: F.cond(700, 96), color: C.ink, align: 'center' });
      text(ctx, '周目', LOOP.x, LOOP.y + 64, { font: F.jp(500, 22), color: C.muted, align: 'center' });
    }

    // the log
    const la = tw(t, S0 - 0.3, 0.5);
    text(ctx, '作業の記録', LOG_X, ROW0 - 64, { font: F.jp(700, 24), color: C.ink2, alpha: la });
    LAPS.forEach((l, i) => {
      const s = S0 + i * LAP;
      const y = ROW0 + i * ROW;
      const a0 = tw(t, s, 0.4);
      if (a0 <= 0) return;
      text(ctx, String(i + 1), LOG_X, y + 34, { font: F.cond(700, 40), color: C.accent, alpha: a0 });
      text(ctx, l.think, LOG_X + 54, y + 4, { font: F.jp(500, 21), color: C.muted, alpha: a0 });
      const a1 = tw(t, s + LAP / 3, 0.4);
      const tw1 = tag(ctx, LOG_X + 54, y + 18, l.tool, { font: F.jp(700, 21), h: 40, padX: 14, r: 8, fill: C.panel, color: C.ink, alpha: a1 });
      const a2 = tw(t, s + (2 * LAP) / 3, 0.4);
      if (a2 > 0) {
        ctx.strokeStyle = C.ink2;
        ctx.fillStyle = C.ink2;
        ctx.lineWidth = 2;
        arrow(ctx, LOG_X + 54 + tw1 + 12, y + 38, LOG_X + 54 + tw1 + 52, y + 38, a2, 10);
        const col = l.tone === 'bad' ? C.red : l.tone === 'good' ? C.green : C.ink;
        text(ctx, l.result, LOG_X + 54 + tw1 + 64, y + 46, { font: F.jp(700, 24), color: col, alpha: a2 });
      }
    });
    // done: the loop exits with a report
    const d = tw(t, DONE, 0.6);
    if (d > 0) {
      const y = ROW0 + LAPS.length * ROW + 18;
      ctx.save();
      ctx.globalAlpha = d;
      rr(ctx, LOG_X, y, W - M.r - LOG_X, 64, 12);
      ctx.fillStyle = C.greenSoft;
      ctx.fill();
      ctx.restore();
      text(ctx, '報告：テストが通るように直しました', LOG_X + 24, y + 42, { font: F.jp(700, 24), color: C.green, alpha: d });
    }
  },
});
