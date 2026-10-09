// 1966, ELIZA: the opening of Weizenbaum's published conversation, then how one reply is
// made — the person's own words, with "my" and "me" swapped and nothing understood.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { COL, yearBlock, chip, chipWidth, marker } from '../lib/parts.js';
import { text, typed, measure, line } from '../../../src/kit/draw.js';
import { tw, seg, outBack, inOutCubic } from '../../../src/kit/ease.js';

// Weizenbaum (1966), the published DOCTOR conversation
const TALK = [
  ['you', 'Men are all alike.'],
  ['eliza', 'IN WHAT WAY'],
  ['you', 'They’re always bugging us about something or other.'],
  ['eliza', 'CAN YOU THINK OF A SPECIFIC EXAMPLE'],
  ['you', 'Well, my boyfriend made me come here.'],
  ['eliza', 'YOUR BOYFRIEND MADE YOU COME HERE'],
];
const IN = ['Well,', 'my', 'boyfriend', 'made', 'me', 'come', 'here.'];
const OUT = ['YOUR', 'BOYFRIEND', 'MADE', 'YOU', 'COME', 'HERE'];
const LINKS = [[1, 0], [2, 1], [3, 2], [4, 3], [5, 4], [6, 5]]; // IN index → OUT index
const SWAP = new Set([1, 4]); // my → YOUR, me → YOU

const LINE0 = 148;
const LH = 50;
const TEXT_X = COL + 112;
const MECH = 7.6;
const IN_Y = 596;
const OUT_Y = 724;
const FONT_IN = F.sans(500, 26);
const FONT_OUT = F.mono(600, 24);

export default clip({
  id: 'eliza',
  title: '規則だけの会話',
  kicker: '1966 · ELIZA',
  duration: 17,
  cues: [
    { at: 0.4, to: 4.6, text: '1966 年、MIT のジョセフ・ワイゼンバウムが ELIZA を作った。' },
    { at: 4.8, to: 9.4, text: '心理療法家のような口ぶりで、相手の言葉を返す。' },
    { at: 9.6, to: 13.8, text: '仕組みは、キーワードを探して文を組み替える**規則**だけ。\n意味は扱っていない。' },
    { at: 14.0, to: 18, text: '開発を見ていた秘書でさえ、数回やりとりしただけで、\n席を外してほしいと頼んだという（ワイゼンバウムの回想、1976）。' },
  ],

  prepare(ctx) {
    const gap = 14;
    const layout = (words, font) => {
      const ws = words.map((w) => chipWidth(ctx, w, { font, padX: 14 }));
      let x = COL;
      return ws.map((w) => {
        const out = { x, w };
        x += w + gap;
        return out;
      });
    };
    return { inPos: layout(IN, FONT_IN), outPos: layout(OUT, FONT_OUT) };
  },

  draw(ctx, t, { inPos, outPos }) {
    yearBlock(ctx, t, { year: '1966', who: 'ELIZA', what: ['Joseph Weizenbaum', 'MIT'] });

    // the conversation
    TALK.forEach(([who, s], i) => {
      const at = 1.0 + i * 0.9;
      const a = tw(t, at, 0.4);
      if (a <= 0) return;
      const y = LINE0 + i * LH;
      const eliza = who === 'eliza';
      text(ctx, eliza ? 'ELIZA' : '人', COL, y, { font: F.mono(600, 18), color: eliza ? C.accent : C.muted, ls: 1.5, alpha: a });
      const font = eliza ? F.mono(500, 25) : F.sans(400, 28);
      const shown = typed(s, seg(t, at, at + s.length / (eliza ? 34 : 44)));
      text(ctx, shown, TEXT_X, y, { font, color: eliza ? C.accent : C.ink });
    });
    // mark the swapped words in the last exchange once the rule is shown
    const hi = tw(t, MECH + 2.2, 0.6);
    if (hi > 0) {
      const f5 = F.sans(400, 28);
      const s5 = TALK[4][1];
      for (const w of ['my', 'me']) {
        const at = s5.indexOf(` ${w} `) + 1;
        marker(ctx, TEXT_X + measure(ctx, f5, s5.slice(0, at)), LINE0 + 4 * LH + 6, measure(ctx, f5, w), 5, hi, C.accent);
      }
      const f6 = F.mono(500, 25);
      const s6 = TALK[5][1];
      for (const w of ['YOUR', 'YOU']) {
        const at = w === 'YOUR' ? 0 : s6.indexOf(' YOU ') + 1;
        marker(ctx, TEXT_X + measure(ctx, f6, s6.slice(0, at)), LINE0 + 5 * LH + 6, measure(ctx, f6, w), 5, hi, C.ink);
      }
    }

    // how the last reply is made
    const m = tw(t, MECH, 0.6);
    if (m <= 0) return;
    ctx.fillStyle = C.rule;
    ctx.fillRect(COL, 470, (W - M.r - COL) * m, 2);
    text(ctx, '返事の作り方', COL, 530, { font: F.jp(700, 26), color: C.ink, alpha: m });
    text(ctx, '人の言葉を、そのまま組み替える', COL + 172, 529, { font: F.jp(400, 22), color: C.muted, alpha: m });

    IN.forEach((w, i) => {
      const p = tw(t, MECH + 0.3 + i * 0.07, 0.5, (q) => outBack(q, 1.6));
      if (p <= 0) return;
      const dropped = i === 0 ? seg(t, MECH + 2.0, MECH + 2.6) : 0;
      const { x } = inPos[i];
      ctx.save();
      ctx.globalAlpha = Math.min(1, p) * (1 - dropped * 0.65);
      chip(ctx, x, IN_Y - 28 + (1 - Math.min(1, p)) * 16, w, { font: FONT_IN, h: 52, fill: SWAP.has(i) ? C.accentSoft : C.panel });
      ctx.restore();
      if (dropped > 0) {
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 2;
        line(ctx, x + 6, IN_Y - 2, x + 6 + (inPos[i].w - 12) * dropped, IN_Y - 2);
      }
    });

    LINKS.forEach(([a, b], k) => {
      const p = tw(t, MECH + 1.0 + k * 0.1, 0.6, inOutCubic);
      if (p <= 0) return;
      const swap = SWAP.has(a);
      ctx.strokeStyle = swap ? C.accent : C.rule;
      ctx.lineWidth = swap ? 3 : 2;
      const x0 = inPos[a].x + inPos[a].w / 2;
      const x1 = outPos[b].x + outPos[b].w / 2;
      line(ctx, x0, IN_Y + 28, x1, OUT_Y - 30, p);
    });

    OUT.forEach((w, j) => {
      const p = tw(t, MECH + 1.4 + j * 0.1, 0.5, (q) => outBack(q, 1.6));
      if (p <= 0) return;
      const swapped = j === 0 || j === 3;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p);
      chip(ctx, outPos[j].x, OUT_Y - 26 + (1 - Math.min(1, p)) * 16, w, {
        font: FONT_OUT, h: 52, fill: swapped ? C.accent : C.ink, color: swapped ? '#fff' : C.paper,
      });
      ctx.restore();
    });

    const lab = tw(t, MECH + 2.3, 0.6);
    if (lab > 0) {
      const mid = (i) => inPos[i].x + inPos[i].w / 2;
      text(ctx, 'my → YOUR', (mid(1) + outPos[0].x + outPos[0].w / 2) / 2 - 18, (IN_Y + OUT_Y) / 2 + 6, { font: F.mono(600, 19), color: C.accent, align: 'right', alpha: lab });
      text(ctx, 'me → YOU', (mid(4) + outPos[3].x + outPos[3].w / 2) / 2 + 18, (IN_Y + OUT_Y) / 2 + 6, { font: F.mono(600, 19), color: C.accent, alpha: lab });
    }
    text(ctx, 'キーワードを見つけ、決まった型に当てはめて返すだけ', COL, 816, { font: F.jp(400, 22), color: C.muted, alpha: tw(t, MECH + 2.8, 0.6) });
  },
});
