// Cordis, the framework that joins dsh's parts (Shi, Zhang & Cui, "A Programming Paradigm for
// Spatiotemporal Composability", arXiv:2608.25512, 2026-08-26). Two properties, each drawn as the
// paper's kind of example: remove plugin A and the listener A registered goes with it while B's
// stays (revertible effects); a plugin that declares it needs a database starts when one appears,
// stops when it goes, and restarts on another (reactive coeffects). Only registrations inside the
// framework are undone — a sent email is not. It grew as the plugin base of Koishi (2019–).
// The code-like labels are an example, not one version's API.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { text, rr, line, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, keys, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const P1 = M.l;
const P2 = 830;
const TOP = 130;
const OUT = 3.2; // A is taken out
const DB_IN = 7.0;
const DB_OUT = 8.8;
const DB2_IN = 10.0;
const END = 11.4;

export default clip({
  id: 'cordis',
  title: '外すと消える',
  kicker: 'Cordis',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '部品をつなぐ Cordis には、二つの性質がある。一つめ、\n部品を外すと、その部品が登録したものも一緒に消える。' },
    { at: 6.0, to: 11.2, text: '二つめ、部品は要るものを宣言しておき、\nそれがそろうと動き出し、なくなると止まる。' },
    { at: 11.4, to: 18, text: '取り消せるのは枠組みの中の登録だけで、送ったメールは戻らない。\nKoishi の部品の基盤として育ち、2026 年 8 月に論文になった。' },
  ],

  draw(ctx, t) {
    // ——— 1. taking a part out takes its registrations with it
    const a1 = tw(t, 0.4, 0.5);
    heading(ctx, P1, '1', '外すと、その登録も消える', a1);
    // the shared context with one event and its listeners
    const cx = P1 + 270;
    const cw = 420;
    ctx.save();
    ctx.globalAlpha = a1;
    rr(ctx, cx, TOP + 40, cw, 330, 16);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.restore();
    text(ctx, '共有の文脈', cx + 20, TOP + 76, { font: F.jp(700, 20), color: C.ink, alpha: a1 });
    tag(ctx, cx + 20, TOP + 96, 'イベント：ツールを実行する前', { font: F.jp(700, 16), h: 32, padX: 12, fill: C.ink, color: C.paper, alpha: tw(t, 0.7, 0.4) });
    const gone = inOutCubic(seg(t, OUT + 0.4, OUT + 1.0));
    [['A', 1.2, 'A の聞き手', 'ctx.on(…)'], ['B', 1.6, 'B の聞き手', 'ctx.on(…)']].forEach(([who, at, what, code], i) => {
      const y = TOP + 160 + i * 110;
      const pa = tw(t, at - 0.4, 0.4);
      // the plugin, which A leaves
      const out = who === 'A' ? inOutCubic(seg(t, OUT, OUT + 0.7)) : 0;
      const px = P1 - 150 * out;
      plugin(ctx, px, y, `部品 ${who}`, pa * (1 - out), C.ink);
      // its registration in the context
      const ea = tw(t, at, 0.4) * (who === 'A' ? 1 - gone : 1);
      if (ea > 0.001) {
        ctx.save();
        ctx.globalAlpha = ea;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2.5;
        line(ctx, P1 + 200, y + 36, cx + 20, y + 36);
        rr(ctx, cx + 20, y + 6, cw - 40, 60, 10);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
        text(ctx, what, cx + 40, y + 43, { font: F.jp(700, 19), color: C.ink, alpha: ea });
        text(ctx, code, cx + cw - 40, y + 42, { font: F.mono(500, 16), color: C.ink2, align: 'right', alpha: ea });
      }
      if (who === 'A' && gone > 0) {
        // the place it was, struck through
        ctx.save();
        ctx.globalAlpha = Math.min(1, gone * 2) * tw(t, OUT + 0.4, 0.3);
        ctx.strokeStyle = C.muted;
        ctx.setLineDash([7, 6]);
        ctx.lineWidth = 2;
        rr(ctx, cx + 20, y + 6, cw - 40, 60, 10);
        ctx.stroke();
        ctx.restore();
        text(ctx, '一緒に消えた', cx + cw / 2, y + 43, { font: F.jp(700, 18), color: C.muted, align: 'center', alpha: tw(t, OUT + 1.0, 0.4) });
      }
    });
    text(ctx, 'B の登録は残る', cx + cw / 2, TOP + 412, { font: F.jp(700, 19), color: C.green, align: 'center', alpha: tw(t, OUT + 1.4, 0.5) });

    // ——— 2. a part runs while what it needs is there
    const a2 = tw(t, 6.0, 0.5);
    heading(ctx, P2, '2', '要るものがそろうと動く', a2);
    if (a2 > 0) {
      const y = TOP + 120;
      const running = (t >= DB_IN + 0.4 && t < DB_OUT + 0.3) || t >= DB2_IN + 0.3;
      plugin(ctx, P2, y, '部品 C', a2, running ? C.accent : C.muted);
      tag(ctx, P2, y + 92, 'inject: database', { font: F.mono(600, 16), h: 32, padX: 12, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: a2 });
      // its state
      const lamp = running ? C.green : C.muted;
      ctx.save();
      ctx.globalAlpha = a2;
      ctx.fillStyle = lamp;
      circle(ctx, P2 + 18, y + 162, 9);
      ctx.fill();
      ctx.restore();
      const state = t < DB_IN + 0.4 ? '待っている' : t < DB_OUT + 0.3 ? '動いている' : t < DB2_IN + 0.3 ? '止まった' : '動き直した';
      text(ctx, state, P2 + 36, y + 169, { font: F.jp(700, 20), color: running ? C.green : C.ink2, alpha: a2 });
      // the database services, coming and going
      const sx = P2 + 330;
      const db1 = tw(t, DB_IN, 0.5) * (1 - inOutCubic(seg(t, DB_OUT, DB_OUT + 0.5)));
      const db2 = tw(t, DB2_IN, 0.5, (p) => outBack(p, 1.5));
      service(ctx, sx, y - 50 + (1 - db1) * -20, 'データベース 1', db1);
      service(ctx, sx, y + 70, 'データベース 2', Math.min(1, db2));
      // the link while one is there
      const link = running ? 1 : 0;
      if (link) {
        ctx.save();
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        const ty = t >= DB2_IN ? y + 106 : y - 14;
        line(ctx, P2 + 200, y + 36, sx - 10, ty, inOutCubic(seg(t, t >= DB2_IN ? DB2_IN + 0.2 : DB_IN + 0.2, t >= DB2_IN ? DB2_IN + 0.6 : DB_IN + 0.6)));
        ctx.restore();
      }
      text(ctx, '現れると動き、外すと止まり、替わると動き直す', P2, TOP + 412, { font: F.jp(700, 19), color: C.ink2, alpha: tw(t, DB2_IN + 0.6, 0.5) });
    }

    // ——— the limit, and where it came from
    const ea = tw(t, END, 0.6);
    if (ea > 0) {
      const y = 640;
      ctx.save();
      ctx.globalAlpha = ea;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 44, (W - M.l - M.r) * outExpo(ea), 2);
      ctx.restore();
      text(ctx, '取り消せるのは、枠組みの中で登録したものだけ。外へ送ったメールや API の呼び出しは戻らない', M.l, y, { font: F.jp(700, 20), color: C.red, alpha: ea });
      const b = tw(t, END + 0.6, 0.5);
      text(ctx, '2019 年に始まったチャットボットの枠組み Koishi の、部品の基盤として育った', M.l, y + 44, { font: F.jp(500, 18), color: C.ink2, alpha: b });
      text(ctx, '論文：Shi、Zhang、Cui（北京大学、DeepSeek-AI）2026-08-26、92 ページ', M.l, y + 78, { font: F.jp(500, 18), color: C.ink2, alpha: tw(t, END + 0.9, 0.5) });
    }

    example(ctx, M.l, 818, tw(t, 1.4, 0.5), 'コードの書き方は考え方の例で、特定の版の API ではない');
    source(ctx, 'arXiv:2608.25512、deepseek-harness docs/cordis-primer.md、Koishi の文書', a1);
  },
});

// A numbered panel heading.
function heading(ctx, x, n, s, a) {
  tag(ctx, x, TOP - 30, n, { font: F.cond(700, 22), h: 36, padX: 13, fill: C.accent, color: '#fff', alpha: a });
  text(ctx, s, x + 50, TOP - 3, { font: F.jp(700, 26), color: C.ink, alpha: a });
}

// A plugin tile with a plug on its right.
function plugin(ctx, x, y, s, a, color) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, 180, 72, 12);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillRect(x + 180, y + 26, 20, 20);
  ctx.restore();
  text(ctx, s, x + 90, y + 44, { font: F.jp(700, 22), color: '#fff', align: 'center', alpha: a });
}

// A service that other parts can depend on.
function service(ctx, x, y, s, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, 300, 72, 12);
  ctx.fillStyle = C.greenSoft;
  ctx.fill();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, s, x + 150, y + 44, { font: F.jp(700, 21), color: C.green, align: 'center', alpha: a });
}
