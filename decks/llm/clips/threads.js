// Many threads from one client. app-server lets a client start threads (thread/start), reopen
// one (thread/resume), branch one (thread/fork), add instructions to a running turn (turn/steer)
// and stop it (turn/interrupt). One client runs several pieces of work side by side. The method
// names are the protocol's; the threads, their work and their timing are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { text, rr, circle, line } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const X0 = 470;
const X1 = W - M.r - 20;
const U0 = 0.9; // the playhead runs from U0 for SPAN seconds
const SPAN = 9.6;
const UMAX = 10;
const ux = (u) => X0 + (u / UMAX) * (X1 - X0);
const LANES = [
  { y: 176, name: 'thread A', job: '調べる', start: 0, turns: [[0.2, 4.0, 'done']] },
  { y: 270, name: 'thread A′', job: '別の案', start: 5.0, from: 0, turns: [[5.2, 9.0, 'done']] },
  { y: 364, name: 'thread B', job: '直す', start: 0.5, turns: [[0.7, 8.6, 'done']], steer: 3.6 },
  { y: 458, name: 'thread C', job: '試す', start: 1.0, turns: [[1.2, 6.0, 'stop']] },
  { y: 552, name: '前の thread', job: '続き', start: 6.8, resume: true, turns: [[7.0, 9.6, 'done']] },
];
const CB = { x: M.l, y: 300, w: 230, h: 140 };
const LEGEND = 11.4;

export default clip({
  id: 'threads',
  title: '束ねて動かす',
  kicker: '多くの thread',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '一つのクライアントが、いくつもの thread を同時に動かせる。\n調べる、直す、試すを、並べて走らせる。' },
    { at: 6.0, to: 11.2, text: '走っている turn に指示を足す steer、止める interrupt、\n途中から枝分かれさせる fork、前の続きを開く resume。' },
    { at: 11.4, to: 18, text: '人が一つずつ見ていた画面を、プログラムが束ねる。\nハーネスの外側に、もう一段の仕組みを作れる。' },
  ],

  draw(ctx, t) {
    const u = Math.max(0, Math.min(UMAX, ((t - U0) / SPAN) * UMAX));
    // ——— the one client
    const ca = tw(t, 0.4, 0.5);
    ctx.save();
    ctx.globalAlpha = ca;
    rr(ctx, CB.x, CB.y, CB.w, CB.h, 18);
    ctx.fillStyle = C.blue;
    ctx.fill();
    ctx.restore();
    text(ctx, 'クライアント', CB.x + CB.w / 2, CB.y + 62, { font: F.jp(700, 24), color: '#fff', align: 'center', alpha: ca });
    text(ctx, '1 つ', CB.x + CB.w / 2, CB.y + 100, { font: F.jp(700, 20), color: '#d9e2ff', align: 'center', alpha: ca });
    // the time axis
    ctx.save();
    ctx.globalAlpha = ca;
    ctx.fillStyle = C.rule;
    ctx.fillRect(X0, 620, X1 - X0, 2);
    ctx.restore();
    text(ctx, '時間 →', X1, 650, { font: F.jp(500, 16), color: C.muted, align: 'right', alpha: ca });

    LANES.forEach((L) => {
      // every lane hangs off the client, even before its thread starts
      const la = tw(t, 0.6, 0.5);
      if (L.from == null) {
        ctx.save();
        ctx.globalAlpha = la * 0.7;
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CB.x + CB.w + 8, CB.y + CB.h / 2);
        ctx.bezierCurveTo(CB.x + CB.w + 70, CB.y + CB.h / 2, X0 - 70, L.y + 22, X0 - 8, L.y + 22);
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = la * 0.8;
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      line(ctx, X0, L.y + 22, X1, L.y + 22);
      ctx.restore();
      if (u < L.start) return;
      const a = Math.min(1, (u - L.start) * 3) * ca;
      if (L.from != null) {
        // a fork branches off its parent
        const py = LANES[L.from].y + 36;
        const fx = ux(L.start) - 60;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(fx, py);
        ctx.bezierCurveTo(fx, py + 40, ux(L.start) - 40, L.y + 22, ux(L.start), L.y + 22);
        ctx.stroke();
        ctx.restore();
        tag(ctx, fx - 54, py + 24, 'fork', { font: F.mono(600, 15), h: 28, padX: 10, fill: C.accentSoft, color: C.accent, alpha: a });
      }
      const nw = text(ctx, L.name, X0, L.y - 8, { font: L.name.startsWith('thread') ? F.mono(600, 17) : F.jp(700, 16), color: C.ink, alpha: Math.max(a, 0) });
      text(ctx, L.job, X0 + nw + 12, L.y - 9, { font: F.jp(500, 16), color: C.ink2, alpha: a });
      // its turns, drawn up to the playhead
      L.turns.forEach(([s, e, how]) => {
        if (u < s) return;
        const end = Math.min(u, e);
        const done = u >= e;
        ctx.save();
        ctx.globalAlpha = a;
        rr(ctx, ux(s), L.y + 8, Math.max(4, ux(end) - ux(s)), 28, 8);
        ctx.fillStyle = done ? (how === 'stop' ? '#f3d4cf' : C.ink2) : C.accent;
        ctx.fill();
        ctx.restore();
        if (done) {
          if (how === 'stop') {
            ctx.save();
            ctx.globalAlpha = a;
            ctx.fillStyle = C.red;
            ctx.fillRect(ux(e) - 3, L.y + 2, 6, 40);
            ctx.restore();
            text(ctx, 'interrupt', ux(e) + 12, L.y + 28, { font: F.mono(600, 16), color: C.red, alpha: a });
          } else {
            text(ctx, 'turn', ux(s) + 12, L.y + 28, { font: F.mono(600, 15), color: '#fff', alpha: a });
          }
        } else {
          text(ctx, 'turn', ux(s) + 12, L.y + 28, { font: F.mono(600, 15), color: '#fff', alpha: a * seg(ux(end) - ux(s), 50, 70) });
        }
      });
      // marks on the lane
      if (L.steer != null && u >= L.steer) {
        const p = Math.min(1, (u - L.steer) * 2.5);
        ctx.save();
        ctx.globalAlpha = p;
        ctx.fillStyle = C.blue;
        circle(ctx, ux(L.steer), L.y + 22, 9);
        ctx.fill();
        ctx.restore();
        tag(ctx, ux(L.steer) - 12, L.y - 34, 'steer：テストも足して', { font: F.jp(700, 15), h: 30, padX: 10, fill: C.blueSoft, color: C.blue, alpha: p });
      }
      if (L.resume) tag(ctx, ux(L.start) - 84, L.y + 8, 'resume', { font: F.mono(600, 15), h: 28, padX: 10, fill: C.blueSoft, color: C.blue, alpha: a });
    });
    // the playhead
    if (u > 0 && u < UMAX) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = C.accent;
      ctx.fillRect(ux(u) - 1, 150, 2, 470);
      ctx.restore();
    }

    // ——— the requests, named
    const la = tw(t, LEGEND, 0.6);
    if (la > 0) {
      const y = 712;
      const items = [['thread/start', '始める'], ['thread/resume', '続きを開く'], ['thread/fork', '枝分かれ'], ['turn/steer', '指示を足す'], ['turn/interrupt', '止める']];
      let x = M.l;
      items.forEach(([k, v], i) => {
        const a = tw(t, LEGEND + 0.2 + i * 0.2, 0.4);
        const w = text(ctx, k, x, y, { font: F.mono(600, 17), color: C.ink, alpha: a });
        const w2 = text(ctx, v, x + w + 8, y, { font: F.jp(500, 16), color: C.ink2, alpha: a });
        x += w + w2 + 36;
      });
      text(ctx, 'どれも、クライアントから app-server への要求', M.l, y + 40, { font: F.jp(500, 16), color: C.muted, alpha: tw(t, LEGEND + 1.4, 0.5) });
    }

    example(ctx, M.l, 818, tw(t, 1.2, 0.5), 'thread の中身と時間の流れは説明のための例');
    source(ctx, 'openai/codex の app-server-protocol（322bbf4）ClientRequest.ts', ca);
  },
});
