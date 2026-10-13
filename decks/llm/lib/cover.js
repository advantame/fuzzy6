// The cover picture: the deck's title over an agent at work. The opening builds it up; 1-1
// starts from the finished picture and lets everything but the agent's box leave, so the two
// clips join without a transition (spec §6.10). Both paint through these functions, in this
// order — title, box, sides, question — so the last frame of one is the first frame of the
// other.
//
// Each function takes `v`, the values the picture depends on. The opening computes them from
// its timeline; DONE is what they all reach at its end.

import { C, F, M } from './theme.js';
import { tag, example, bubbleLayout, bubble, marker } from './parts.js';
import { text, measure, rr, arrow } from '../../../src/kit/draw.js';
import { lerp } from '../../../src/kit/ease.js';
import { ring } from '../../../src/kit/cue.js';

export const TITLE = 'AI エージェント';
// "次の一語から、エージェントまで" in o200k_base (GPT-4o's tokenizer): 11 tokens
export const SUB = ['次', 'の', '一', '語', 'から', '、', 'エ', 'ージ', 'ェ', 'ント', 'まで'];
export const LOG = ['コードを調べる', 'テストを動かす', '原因を直す', 'もう一度テストを動かす'];
export const USES = ['コードを書く', '調べものをする', '資料をまとめる', '画面を操作する'];

// the agent, closed
export const BOX = { x: 560, y: 396, w: 480, h: 296, r: 26 };

const TITLE_FONT = F.jp(700, 128);
const TITLE_Y = 236;
const SUB_FONT = F.jp(500, 40);
const SUB_Y = 318;
const MID = BOX.y + BOX.h / 2;
const TALK = F.jp(500, 27);

export const DONE = {
  rise: 1, // the title
  mark: 1, // the line under it
  sub: SUB.map(() => ({ on: 1, flash: 0 })),
  box: 1,
  steps: LOG.map(() => ({ on: 1, ok: 1 })),
  ask: 1, // the request,
  typed: 1, // its text,
  sent: 1, // and its arrow into the box
  back: 1, // the arrow out of the box
  result: 1,
  usesLabel: 1,
  uses: USES.map(() => 1),
  inside: 1, // the question about the box
  spin: 0, // the clock of a running step's mark
};

// Layout that does not depend on time (a clip's prepare).
export function coverLayout(ctx) {
  let x = M.l;
  const sub = SUB.map((s) => {
    const w = measure(ctx, SUB_FONT, s);
    const out = { s, x, w };
    x += w;
    return out;
  });
  return {
    sub,
    titleW: measure(ctx, TITLE_FONT, TITLE, -1),
    ask: bubbleLayout(ctx, 'このテストが通るように\n直して', 360, { font: TALK }),
    done: bubbleLayout(ctx, 'できました。テストは\nぜんぶ通っています', 350, { font: TALK }),
  };
}

// What the deck is about, and its subtitle written one token at a time.
export function coverTitle(ctx, s, v) {
  ctx.fillStyle = C.accent;
  ctx.fillRect(M.l, 84, 72 * v.rise, 10);
  text(ctx, TITLE, M.l, TITLE_Y + (1 - v.rise) * 28, { font: TITLE_FONT, color: C.ink, alpha: v.rise, ls: -1 });
  marker(ctx, M.l, TITLE_Y + 20, s.titleW, 8, v.mark, C.accent);
  s.sub.forEach((tk, i) => {
    const { on, flash } = v.sub[i];
    if (on <= 0) return;
    if (flash > 0) {
      ctx.save();
      ctx.globalAlpha *= flash;
      rr(ctx, tk.x - 2, SUB_Y - 40, tk.w + 4, 54, 8);
      ctx.fillStyle = C.tints[i % C.tints.length];
      ctx.fill();
      ctx.restore();
    }
    text(ctx, tk.s, tk.x, SUB_Y, { font: SUB_FONT, color: C.ink2, alpha: on });
  });
}

// The agent's box with the record of its steps. 1-1 opens it: `rect` is where the box is,
// `fill` and `outline` cross from the ink box to a frame, `head` and `rows` are what leaves.
export function coverBox(ctx, rect, v, { fill = 1, outline = 0, head = 1, rows = 1 } = {}) {
  if (v.box <= 0) return;
  ctx.save();
  ctx.globalAlpha *= v.box;
  rr(ctx, rect.x, rect.y + (1 - v.box) * 16, rect.w, rect.h, BOX.r);
  if (fill > 0) {
    ctx.save();
    ctx.globalAlpha *= fill;
    ctx.fillStyle = C.ink;
    ctx.fill();
    ctx.restore();
  }
  if (outline > 0) {
    ctx.save();
    ctx.globalAlpha *= outline;
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  text(ctx, TITLE, rect.x + 32, rect.y + 52, { font: F.jp(700, 24), color: C.paper, alpha: v.box * head });
  if (rows <= 0) return;
  LOG.forEach((label, i) => {
    const { on, ok } = v.steps[i];
    if (on <= 0) return;
    const y = rect.y + 116 + i * 46;
    status(ctx, rect.x + 46, y - 9, v.spin, ok, on * rows);
    text(ctx, label, rect.x + 74, y, { font: F.jp(500, 25), color: C.paper, alpha: on * rows * lerp(1, 0.7, ok) });
  });
}

// The request going in, the report coming out, and where agents are used.
export function coverSides(ctx, s, v) {
  example(ctx, BOX.x + 4, BOX.y + BOX.h + 16, v.box, 'やりとりは説明のための例');

  const askY = MID - s.ask.h / 2;
  text(ctx, '頼む人', M.l + 4, askY - 14, { font: F.jp(500, 19), color: C.muted, alpha: v.ask });
  bubble(ctx, M.l, askY, s.ask, { fill: C.blueSoft, alpha: v.ask, chars: v.typed });
  ctx.strokeStyle = C.ink2;
  ctx.fillStyle = C.ink2;
  ctx.lineWidth = 3;
  arrow(ctx, M.l + s.ask.w + 16, MID, BOX.x - 16, MID, v.sent);

  const resX = BOX.x + BOX.w + 114;
  const resY = MID - s.done.h / 2;
  ctx.strokeStyle = C.ink2;
  ctx.fillStyle = C.ink2;
  ctx.lineWidth = 3;
  arrow(ctx, BOX.x + BOX.w + 16, MID, resX - 16, MID, v.back);
  text(ctx, '結果', resX + 4, resY - 14, { font: F.jp(500, 19), color: C.muted, alpha: v.result });
  bubble(ctx, resX, resY, s.done, { fill: C.greenSoft, alpha: v.result });

  text(ctx, '使われている場面', M.l, 801, { font: F.jp(500, 20), color: C.muted, alpha: v.usesLabel });
  let ux = M.l + 190;
  USES.forEach((u, i) => {
    const p = v.uses[i];
    ux += tag(ctx, ux, 772 + (1 - p) * 10, u, { font: F.jp(500, 22), h: 44, padX: 18, r: 12, fill: '#fff', stroke: C.ink2, alpha: p }) + 12;
  });
}

// The question the deck answers: what is inside the box.
export function coverAsk(ctx, v) {
  ring(ctx, BOX.x, BOX.y, BOX.w, BOX.h, v.inside, C.accent, BOX.r);
  tag(ctx, BOX.x + BOX.w, BOX.y - 60, 'この中は？', { font: F.jp(700, 22), h: 42, padX: 18, fill: C.accent, color: '#fff', alpha: v.inside, align: 'right' });
}

// A step's mark: a turning arc while it runs, a tick once it is done.
function status(ctx, x, y, clock, ok, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  if (ok < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - ok;
    ctx.strokeStyle = C.accent;
    ctx.beginPath();
    ctx.arc(x, y, 9, clock * 6, clock * 6 + 4.2);
    ctx.stroke();
    ctx.restore();
  }
  if (ok > 0) {
    ctx.globalAlpha *= ok;
    ctx.strokeStyle = C.greenSoft;
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x - 2, y + 7);
    ctx.lineTo(x + 9, y - 7);
    ctx.stroke();
  }
  ctx.restore();
}
