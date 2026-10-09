// 1950, Turing: the question, and the game that replaced it — an interrogator exchanging
// written messages through a wall with A and B, one of which is a machine.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { COL, yearBlock, tag } from '../lib/parts.js';
import { text, typed, rr, circle } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const Q1 = 'I propose to consider the question,';
const Q2 = '‘Can machines think?’';
const WALL = 900;
const SLOT = 588;
const FIG = { c: 700, a: 1130, b: 1350 };
const BASE = 728; // feet of the figures
const GAME = 5.3;
const TRIP = 1.15; // seconds per message trip

export default clip({
  id: 'turing',
  title: '機械は考えるか',
  kicker: '1950 · チューリング',
  duration: 16,
  cues: [
    { at: 0.4, to: 5.1, text: '1950 年、アラン・チューリングは\n「機械は考えることができるか」という問いを立てた。' },
    { at: 5.3, to: 10.6, text: 'そして問いを、一つのゲームに置き換えた。\n機械が人の役を演じたとき、文字のやりとりだけで見破れるか。' },
    { at: 10.8, to: 17, text: '**模倣ゲーム**。のちにチューリング・テストと呼ばれる。' },
  ],

  draw(ctx, t) {
    yearBlock(ctx, t, { year: '1950', who: 'Alan M. Turing', what: ['Computing Machinery', 'and Intelligence'] });

    // the question
    text(ctx, Q1, COL, 176, { font: F.sans(500, 34), color: C.ink2, alpha: tw(t, 0.6, 0.6) });
    text(ctx, typed(Q2, seg(t, 1.1, 2.3)), COL, 268, { font: F.sans(600, 78), color: C.ink, ls: -1 });
    text(ctx, '「機械は考えることができるか」', COL, 332, { font: F.jp(500, 30), color: C.muted, alpha: tw(t, 2.7, 0.7) });

    // the game
    const g = tw(t, GAME, 0.6);
    if (g <= 0) return;
    ctx.fillStyle = C.accent;
    ctx.globalAlpha = g;
    ctx.fillRect(COL, 412, 10, 34);
    ctx.globalAlpha = 1;
    const tw1 = text(ctx, '模倣ゲーム', COL + 26, 442, { font: F.jp(700, 34), color: C.ink, alpha: g });
    text(ctx, 'The Imitation Game', COL + 26 + tw1 + 18, 441, { font: F.sans(500, 22), color: C.muted, alpha: g });
    const later = tw(t, 10.9, 0.6);
    if (later > 0) tag(ctx, W - M.r, 414, 'のちのチューリング・テスト', { font: F.jp(700, 20), h: 36, padX: 16, fill: C.accent, color: '#fff', alpha: later, align: 'right' });

    // wall with a slot for the messages
    const wall = tw(t, GAME + 0.4, 0.7, inOutCubic);
    ctx.fillStyle = C.ink;
    const wallTop = 500;
    ctx.fillRect(WALL - 6, wallTop + (SLOT - 20 - wallTop) * (1 - wall), 12, (SLOT - 20 - wallTop) * wall);
    ctx.fillRect(WALL - 6, SLOT + 20, 12, (BASE + 6 - SLOT - 20) * wall);

    figure(ctx, FIG.c, tw(t, GAME + 0.3, 0.6, (p) => outBack(p, 1.8)), 'person', '質問者');
    figure(ctx, FIG.a, tw(t, GAME + 0.55, 0.6, (p) => outBack(p, 1.8)), 'unknown', 'A');
    figure(ctx, FIG.b, tw(t, GAME + 0.7, 0.6, (p) => outBack(p, 1.8)), 'unknown', 'B');

    // messages: question to A, answer back, question to B, answer back, …
    const t0 = GAME + 1.3;
    if (t > t0) {
      const k = (t - t0) / TRIP;
      const n = Math.floor(k);
      const p = k - n;
      const target = n % 4 < 2 ? FIG.a : FIG.b;
      const outward = n % 2 === 0;
      const [x0, x1] = outward ? [FIG.c + 56, target - 56] : [target - 56, FIG.c + 56];
      const travel = inOutCubic(Math.min(1, p / 0.8));
      slip(ctx, x0 + (x1 - x0) * travel, SLOT, Math.min(1, p / 0.08) * (1 - seg(p, 0.86, 1)), outward);
    }

    text(ctx, '質問者は、文字のやりとりだけで A と B を見分ける', (FIG.c + FIG.b) / 2, 836, {
      font: F.jp(500, 24), color: C.ink2, align: 'center', alpha: tw(t, GAME + 1.8, 0.7),
    });
  },
});

// A simple standing figure; `unknown` hides who it is behind a question mark.
function figure(ctx, x, s, kind, name) {
  if (s <= 0) return;
  ctx.save();
  ctx.translate(x, BASE);
  ctx.scale(s, s);
  ctx.fillStyle = kind === 'person' ? C.ink : C.panel;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  rr(ctx, -46, -118, 92, 118, [26, 26, 6, 6]);
  ctx.fill();
  if (kind === 'unknown') ctx.stroke();
  circle(ctx, 0, -158, 32);
  ctx.fill();
  if (kind === 'unknown') {
    ctx.stroke();
    text(ctx, '?', 0, -144, { font: F.sans(600, 40), color: C.ink, align: 'center' });
  }
  ctx.restore();
  text(ctx, name, x, BASE + 40, { font: kind === 'person' ? F.jp(500, 22) : F.cond(700, 30), color: C.ink, align: 'center', alpha: Math.min(1, s) });
}

// A folded paper slip with two written lines; questions go out, answers come back in blue.
function slip(ctx, x, y, a, outward) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x - 22, y - 15, 44, 30, 4);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = outward ? C.ink : C.blue;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = outward ? C.ink : C.blue;
  ctx.fillRect(x - 14, y - 6, 28, 3);
  ctx.fillRect(x - 14, y + 3, 18, 3);
  ctx.restore();
}
