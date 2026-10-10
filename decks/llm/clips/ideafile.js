// Sharing the idea instead of the code. Code arrives as the same thing everywhere; Karpathy
// shared LLM Wiki as an "idea file" — 75 lines of Markdown — to be handed to one's own agent,
// which builds a version fitted to that person. The three builds are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { text, rr, arrow, circle } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const CODE_Y = 150;
const IDEA = { x: M.l, y: 410, w: 230, h: 290 };
const PEOPLE = [
  { y: 380, name: 'A さん', what: 'Markdown のフォルダ', kind: 'tree' },
  { y: 540, name: 'B さん', what: 'グラフで見る wiki', kind: 'graph' },
  { y: 700, name: 'C さん', what: '検索を足した wiki', kind: 'search' },
];
const P_X = 620;
const AG_X = 840;
const OUT_X = 1110;

export default clip({
  id: 'ideafile',
  title: '考えを配る',
  kicker: 'idea file',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'Karpathy は、この型をコードではなく「idea file」として配った。\n75 行の Markdown に、考えだけが書いてある。' },
    { at: 6.0, to: 11.0, text: '受け取った人は、それを自分のエージェントに渡す。\nエージェントが、その人に合わせて組み立てる。' },
    { at: 11.2, to: 18, text: '同じ考えから、形の違う実装がいくつも生まれた。\nエージェントが組み立てるなら、配るのは考えでよい、という見方。' },
  ],

  draw(ctx, t) {
    // ——— code: the same thing arrives everywhere
    const ca = tw(t, 0.4, 0.5);
    text(ctx, 'コードを配る', M.l, CODE_Y - 30, { font: F.jp(700, 22), color: C.ink, alpha: ca });
    text(ctx, '同じものが、そのまま届く', M.l + 150, CODE_Y - 30, { font: F.jp(500, 18), color: C.muted, alpha: ca });
    repo(ctx, M.l, CODE_Y, ca);
    const ar = tw(t, 1.0, 0.5);
    ctx.save();
    ctx.globalAlpha = ar;
    ctx.strokeStyle = C.ink2;
    ctx.fillStyle = C.ink2;
    ctx.lineWidth = 2;
    arrow(ctx, M.l + 200, CODE_Y + 40, 600 - 14, CODE_Y + 40, inOutCubic(seg(t, 1.0, 1.5)), 10);
    ctx.restore();
    [0, 1, 2].forEach((i) => repo(ctx, 600 + i * 210, CODE_Y, tw(t, 1.5 + i * 0.25, 0.4)));
    text(ctx, '3 人に、同じもの', 600 + 3 * 210 + 10, CODE_Y + 48, { font: F.jp(700, 19), color: C.ink2, alpha: tw(t, 2.3, 0.5) });

    // ——— the idea file
    const ia = tw(t, 2.8, 0.6, (p) => outBack(p, 1.4));
    if (ia > 0) {
      const a = Math.min(1, ia);
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, IDEA.x, IDEA.y, IDEA.w, IDEA.h, 12);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = C.rule;
      for (let k = 0; k < 11; k++) ctx.fillRect(IDEA.x + 22, IDEA.y + 96 + k * 16, (IDEA.w - 44) * (0.5 + 0.5 * ((k * 37) % 10) / 10), 5);
      ctx.restore();
      text(ctx, 'llm-wiki.md', IDEA.x + 22, IDEA.y + 40, { font: F.mono(600, 20), color: C.ink, alpha: a });
      text(ctx, '75 行。考えだけ', IDEA.x + 22, IDEA.y + 70, { font: F.jp(500, 17), color: C.accent, alpha: a });
      text(ctx, '考えを配る', M.l, IDEA.y - 70, { font: F.jp(700, 22), color: C.ink, alpha: a });
      text(ctx, '受け取った側で、形が決まる', M.l + 130, IDEA.y - 70, { font: F.jp(500, 18), color: C.muted, alpha: a });
      tag(ctx, IDEA.x, IDEA.y + IDEA.h + 14, 'idea file', { font: F.sans(700, 17), h: 30, padX: 12, fill: C.accent, color: '#fff', alpha: a });
    }

    // ——— each person's agent builds its own version
    PEOPLE.forEach((p, i) => {
      const at = 6.2 + i * 0.5;
      const a = tw(t, at, 0.5);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 2.5;
      arrow(ctx, IDEA.x + IDEA.w + 10, IDEA.y + IDEA.h / 2, P_X - 30, p.y, inOutCubic(seg(t, at, at + 0.5)), 12);
      ctx.restore();
      // the person
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = C.blue;
      circle(ctx, P_X, p.y - 8, 13);
      ctx.fill();
      rr(ctx, P_X - 18, p.y + 8, 36, 22, 10);
      ctx.fill();
      ctx.restore();
      text(ctx, p.name, P_X, p.y + 54, { font: F.jp(700, 17), color: C.blue, align: 'center', alpha: a });
      // their agent
      const g = tw(t, at + 0.6, 0.5);
      ctx.save();
      ctx.globalAlpha = g;
      ctx.strokeStyle = C.ink2;
      ctx.fillStyle = C.ink2;
      ctx.lineWidth = 2;
      arrow(ctx, P_X + 32, p.y + 4, AG_X - 12, p.y + 4, inOutCubic(seg(t, at + 0.6, at + 1.0)), 10);
      rr(ctx, AG_X, p.y - 30, 170, 68, 12);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.restore();
      text(ctx, 'エージェント', AG_X + 85, p.y + 11, { font: F.jp(700, 19), color: C.paper, align: 'center', alpha: g });
      // what it builds
      const b = tw(t, at + 1.4, 0.6);
      ctx.save();
      ctx.globalAlpha = b;
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 2;
      arrow(ctx, AG_X + 182, p.y + 4, OUT_X - 12, p.y + 4, inOutCubic(seg(t, at + 1.4, at + 1.8)), 10);
      ctx.restore();
      build(ctx, OUT_X, p.y - 54, p.kind, b);
      text(ctx, p.what, OUT_X + 200, p.y + 10, { font: F.jp(700, 19), color: C.ink, alpha: b });
    });
    const fa = tw(t, 11.4, 0.6);
    text(ctx, '同じ考えから、形の違う実装', OUT_X, PEOPLE[2].y + 84, { font: F.jp(700, 20), color: C.accent, alpha: fa });

    example(ctx, M.l, 818, tw(t, 6.6, 0.5), '三つの実装は説明のための例');
    source(ctx, 'Karpathy（X、2026-04-04）、gist「llm-wiki.md」', tw(t, 2.8, 0.5));
  },
});

// A code package: a box with a few lines, the same every time.
function repo(ctx, x, y, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, 180, 80, 10);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = C.ink2;
  ctx.font = F.mono(600, 15);
  ctx.fillText('wiki-app/', x + 14, y + 26);
  ctx.fillStyle = C.rule;
  for (let k = 0; k < 3; k++) ctx.fillRect(x + 14, y + 40 + k * 11, 120 - k * 24, 5);
  ctx.restore();
}

// Three different builds of the same idea, drawn small.
function build(ctx, x, y, kind, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y, 180, 116, 12);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = C.ink2;
  if (kind === 'tree') {
    ['raw/', 'wiki/', '  RAG.md', '  検索.md', 'index.md'].forEach((s, i) => {
      ctx.font = F.mono(500, 13);
      ctx.fillText(s, x + 16, y + 24 + i * 19);
    });
  } else if (kind === 'graph') {
    const pts = [[40, 30], [90, 22], [140, 40], [60, 70], [120, 80], [30, 96], [150, 98]];
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 1.2;
    [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [3, 5], [4, 6]].forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(x + pts[i][0], y + pts[i][1]);
      ctx.lineTo(x + pts[j][0], y + pts[j][1]);
      ctx.stroke();
    });
    pts.forEach(([u, v]) => {
      ctx.beginPath();
      ctx.arc(x + u, y + v, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    rr(ctx, x + 14, y + 16, 152, 26, 13);
    ctx.strokeStyle = C.ink2;
    ctx.stroke();
    ctx.font = F.jp(500, 13);
    ctx.fillText('検索…', x + 28, y + 34);
    ctx.fillStyle = C.rule;
    for (let k = 0; k < 3; k++) ctx.fillRect(x + 14, y + 58 + k * 18, 140 - k * 30, 8);
  }
  ctx.restore();
}
