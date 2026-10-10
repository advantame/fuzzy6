// What an agent may do: reading is allowed outright, deleting and sending wait for a person
// (who allows one and refuses the other), and running code happens inside a sandbox. The
// actions are an example of common practice.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { tag, example } from '../lib/parts.js';
import { text, rr, arrow, circle } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const CARD = { x: M.l, w: 360, h: 80 };
const OUT_X = 560;
// row top, row height, action, kind, appears at
const ROWS = [
  { y: 168, h: 80, act: 'ファイルを読む', kind: 'allow', at: 1.0 },
  { y: 296, h: 128, act: 'ファイルを削除する', kind: 'ask-yes', at: 5.8, q: 'ファイルを削除してよいですか？' },
  { y: 464, h: 128, act: '外部にデータを送る', kind: 'ask-no', at: 7.8, q: '外部にデータを送ってよいですか？' },
  { y: 632, h: 150, act: 'テストを実行する', kind: 'sandbox', at: 11.2 },
];

export default clip({
  id: 'safety',
  title: '任せる範囲',
  kicker: '権限・承認・サンドボックス',
  duration: 16.5,
  cues: [
    { at: 0.4, to: 5.6, text: 'エージェントは実際に操作する。\nだからハーネスが、操作の前に権限を確かめる。' },
    { at: 5.8, to: 11.0, text: '読むだけの操作は許し、消す・送るといった操作は\n人の**承認**を待つ。' },
    { at: 11.2, to: 18, text: '隔離した環境（**サンドボックス**）で動かせば、\n失敗しても外には影響しない。' },
  ],

  draw(ctx, t) {
    text(ctx, 'エージェントがしようとしている操作', CARD.x, 128, { font: F.jp(700, 22), color: C.ink2, alpha: tw(t, 0.4, 0.5) });
    example(ctx, OUT_X, 104, tw(t, 0.8, 0.5), '操作と判断は説明のための例');

    ROWS.forEach((r) => {
      const a = tw(t, r.at, 0.5, (q) => outBack(q, 1.5));
      if (a <= 0) return;
      const cy = r.y + r.h / 2;
      // the action card
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      rr(ctx, CARD.x, cy - CARD.h / 2, CARD.w, CARD.h, 14);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, r.act, CARD.x + 28, cy + 9, { font: F.jp(700, 26), color: C.paper, alpha: Math.min(1, a) });
      ctx.strokeStyle = C.ink;
      ctx.fillStyle = C.ink;
      ctx.lineWidth = 3;
      arrow(ctx, CARD.x + CARD.w + 14, cy, OUT_X - 16, cy, tw(t, r.at + 0.3, 0.5, inOutCubic), 13);
      const o = tw(t, r.at + 0.6, 0.5);
      if (o <= 0) return;

      if (r.kind === 'allow') {
        tag(ctx, OUT_X, cy - 26, '✓ 許可済み：そのまま実行', { font: F.jp(700, 24), h: 52, padX: 22, fill: C.greenSoft, color: C.green, alpha: o });
      } else if (r.kind.startsWith('ask')) {
        // a confirmation dialog; a person answers it
        const w = 560;
        ctx.save();
        ctx.globalAlpha = o;
        rr(ctx, OUT_X, r.y, w, r.h, 14);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        text(ctx, r.q, OUT_X + 26, r.y + 44, { font: F.jp(700, 24), color: C.ink, alpha: o });
        const yes = r.kind === 'ask-yes';
        const press = seg(t, r.at + 1.5, r.at + 1.7);
        const by = r.y + r.h - 56;
        tag(ctx, OUT_X + 26, by, '許可', { font: F.jp(700, 20), h: 40, padX: 22, r: 8, fill: yes && press ? C.green : C.panel, color: yes && press ? '#fff' : C.ink, alpha: o });
        tag(ctx, OUT_X + 140, by, '拒否', { font: F.jp(700, 20), h: 40, padX: 22, r: 8, fill: !yes && press ? C.red : C.panel, color: !yes && press ? '#fff' : C.ink, alpha: o });
        const res = tw(t, r.at + 1.9, 0.5);
        if (res > 0) {
          const col = yes ? C.green : C.red;
          text(ctx, yes ? '人が確かめて、許可' : '人が拒否して、止める', OUT_X + w + 30, cy + 9, { font: F.jp(700, 24), color: col, alpha: res });
        }
        // the person
        const p = tw(t, r.at + 1.0, 0.4);
        if (p > 0) {
          const hx = OUT_X + w - 50;
          ctx.fillStyle = C.blue;
          ctx.globalAlpha = p;
          circle(ctx, hx, r.y + r.h - 64, 13);
          ctx.fill();
          rr(ctx, hx - 18, r.y + r.h - 46, 36, 30, [12, 12, 4, 4]);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else {
        // the sandbox: the action runs inside a fenced box
        const w = W - M.r - OUT_X;
        ctx.save();
        ctx.globalAlpha = o;
        ctx.setLineDash([10, 8]);
        rr(ctx, OUT_X, r.y, w, r.h, 18);
        ctx.fillStyle = C.blueSoft;
        ctx.fill();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        text(ctx, 'サンドボックス（隔離した環境）', OUT_X + 26, r.y + 42, { font: F.jp(700, 24), color: C.blue, alpha: o });
        const run = seg(t, r.at + 0.9, r.at + 2.6);
        ctx.fillStyle = C.blue;
        ctx.globalAlpha = o * 0.25;
        ctx.fillRect(OUT_X + 26, r.y + 70, 420, 14);
        ctx.globalAlpha = o;
        ctx.fillRect(OUT_X + 26, r.y + 70, 420 * run, 14);
        ctx.globalAlpha = 1;
        text(ctx, run >= 1 ? 'テストを実行した' : 'テストを実行中…', OUT_X + 26, r.y + 124, { font: F.jp(500, 22), color: C.ink, alpha: o });
        text(ctx, '外のファイルやネットには届かない', W - M.r - 26, r.y + 124, { font: F.jp(500, 21), color: C.ink2, align: 'right', alpha: tw(t, r.at + 1.4, 0.5) });
      }
    });
  },
});
