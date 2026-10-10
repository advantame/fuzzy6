// Answers that do not stay: with search alone, every question is answered by finding fragments
// and assembling an answer on the spot; when the session ends, the assembled answer is gone, and
// the same question tomorrow starts the search again. Writing the answer back as a page lets the
// next piece of work start from it. The question, documents and answer are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, searchMap, channel, docLayout, docEntry, docEnd, sweep, send, flow, stopBadge } from '../lib/rig.js';
import { text, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const L = layout();
const JP = F.jp(500, 19);
const ENTRIES = [
  { role: 'user', text: 'RAG と長い窓は、どう使い分ける？' },
  { role: 'assistant', kind: 'call', text: '{"name": "search",\n "input": {"query": "RAG 長い文脈"}}' },
  { role: 'search', kind: 'data', font: JP, lh: 31, text: '[2] 長い文脈は、真ん中を見落としやすい\n[5] RAG は、要る断片だけを読ませる' },
  { role: 'assistant', text: '資料が多ければ RAG、少なければ窓に\n全部入れる、が目安です［2］［5］。' },
];
// the same steps in both sessions, relative to the session's start
const S = { user: 0, read: 0.5, call: 1.1, out: 1.6, look: 2.0, back: 2.6, result: 3.0, read2: 3.3, answer: 3.9, done: 4.6 };
const SESSIONS = [0.3, 6.4];
const END = 5.4; // the first session ends
const BACK = 11.2; // writing the answer back
const CARD = { x: 1206, y: 640, w: 298, h: 118 };

export default clip({
  id: 'noremain',
  title: '答えが残らない',
  kicker: '検索して答える',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: '検索して答えるやり方では、質問のたびに資料の断片を探し、\nその場で答えを組み立てる。' },
    { at: 5.8, to: 11.0, text: 'セッションが終われば、組み立てた答えは残らない。\n次に同じことを聞かれたら、また一から探す。' },
    { at: 11.2, to: 18, text: '整理した知識や、よい答えを書き戻しておけば、\n次の仕事は、そこから始められる。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 26, gap: 18, mono: F.mono(500, 16), lhMono: 26 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    appFrame(ctx, L, base, { name: 'ハーネス', note: t < SESSIONS[1] - 0.3 ? '1 回目のセッション' : '翌日、同じ質問', noteAlpha: tw(t, 0.4, 0.5) * (1 - tw(t, END, 0.3)) + tw(t, SESSIONS[1] - 0.3, 0.4) });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base);
    channel(ctx, L.call, base);
    channel(ctx, L.back, base);

    // which session is on the page, and how far it has got
    const k = t < SESSIONS[1] - 0.2 ? 0 : 1;
    const s0 = SESSIONS[k];
    const at = (key) => s0 + S[key];
    const gone = k === 0 ? 1 - tw(t, END, 0.6) : 1;
    const appear = [at('user'), at('call') + 0.5, at('result'), at('answer')];
    E.forEach((e, i) => docEntry(ctx, e, tw(t, appear[i], 0.4) * gone, { chars: i === 3 ? seg(t, at('answer'), at('answer') + 0.7) : 1, hot: i === 3 && t > BACK && t < BACK + 1.4 }));
    sweep(ctx, L, seg(t, at('read'), at('read') + 0.6), docEnd(E, 1));
    send(ctx, L.read, seg(t, at('read') + 0.1, at('read') + 0.6), '', 'doc');
    send(ctx, L.write, seg(t, at('call'), at('call') + 0.5), '呼び出し', 'call');
    flow(ctx, [[E[1].tx + E[1].w - 30, E[1].y + 20], [L.call.x1, L.call.y], [L.call.x2, L.call.y]], seg(t, at('out'), at('look')), 'RAG 長い文脈', 'call');
    flow(ctx, [[L.back.x1, L.back.y], [L.back.x2, L.back.y], [E[2].tx + E[2].w - 40, E[2].y + 20]], seg(t, at('back'), at('result')), '断片', 'data');
    sweep(ctx, L, seg(t, at('read2'), at('read2') + 0.6), docEnd(E, 3));
    send(ctx, L.read, seg(t, at('read2') + 0.1, at('read2') + 0.6), '', 'doc');
    send(ctx, L.write, seg(t, at('answer') - 0.2, at('answer') + 0.3), '答え', 'text');

    // the end of the first session
    const endA = Math.sin(Math.PI * seg(t, END, END + 1.2));
    text(ctx, 'セッションが終わる', L.doc.x + L.doc.w / 2, L.doc.y + 200, { font: F.jp(700, 26), color: C.ink2, align: 'center', alpha: endA });
    text(ctx, '組み立てた答えは、どこにも残らない', L.doc.x + L.doc.w / 2, L.doc.y + 240, { font: F.jp(500, 20), color: C.muted, align: 'center', alpha: endA });

    // ——— the model and the search
    const glow = seg(t, at('read') + 0.4, at('read') + 0.6) * (1 - seg(t, at('call') + 0.3, at('call') + 0.5)) + seg(t, at('read2') + 0.4, at('read2') + 0.6) * (1 - seg(t, at('done'), at('done') + 0.2));
    llmBlock(ctx, L, base, { glow: Math.min(1, glow) });
    stopBadge(ctx, L, tw(t, at('call') + 0.5, 0.3, (p) => outBack(p, 1.6)) * (1 - tw(t, at('result'), 0.3)), 'tool_use');
    stopBadge(ctx, L, tw(t, at('done'), 0.3, (p) => outBack(p, 1.6)) * (k === 0 ? 1 - tw(t, END, 0.3) : 1), 'end_turn', false);
    const look = seg(t, at('look'), at('back'));
    toolBox(ctx, L, base, {
      solid: 1,
      label: 'ツールの位置',
      draw: (cx, b, a) => searchMap(cx, b, { a, q: [0.62, 0.42], qa: tw(t, at('look'), 0.3) * (k === 0 ? gone : 1), look: look * (k === 0 ? gone : 1), k: 2, qLabel: '検索の言葉', note: '資料 1,200 件' }),
    });

    // ——— how many times the same work was done
    const ca = tw(t, 1.0, 0.5);
    const x = L.llm.x;
    const y = L.llm.y + L.llm.h + 70;
    text(ctx, '探して組み立てた回数', x, y, { font: F.jp(700, 18), color: C.ink, alpha: ca });
    text(ctx, k === 0 ? '1' : '2', x, y + 64, { font: F.cond(700, 64), color: k === 0 ? C.ink : C.accent, alpha: ca });
    text(ctx, '回', x + 44, y + 60, { font: F.jp(500, 20), color: C.ink2, alpha: ca });
    text(ctx, '同じ質問でも、毎回', x, y + 100, { font: F.jp(500, 17), color: C.muted, alpha: tw(t, SESSIONS[1] + 1.0, 0.5) });

    // ——— writing the good answer back as a page
    const wb = tw(t, BACK, 0.6);
    if (wb > 0) {
      ctx.save();
      ctx.globalAlpha = wb;
      rr(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 14);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      text(ctx, 'wiki/', CARD.x + 18, CARD.y + 34, { font: F.mono(600, 18), color: C.ink, alpha: wb });
      text(ctx, 'RAG と窓.md', CARD.x + 18, CARD.y + 70, { font: F.jp(700, 22), color: C.accent, alpha: tw(t, BACK + 0.3, 0.5) });
      text(ctx, '答えと出典から作った頁', CARD.x + 18, CARD.y + 98, { font: F.jp(500, 16), color: C.ink2, alpha: tw(t, BACK + 0.5, 0.5) });
      const e = E[3];
      ctx.save();
      ctx.strokeStyle = C.accent;
      ctx.fillStyle = C.accent;
      ctx.lineWidth = 3;
      arrow(ctx, e.tx + e.w + 8, e.y + 30, CARD.x - 14, CARD.y + CARD.h / 2, inOutCubic(seg(t, BACK + 0.1, BACK + 0.9)), 14);
      ctx.restore();
      text(ctx, '書き戻す', (e.tx + e.w + CARD.x) / 2 - 34, (e.y + CARD.y + CARD.h / 2) / 2 + 52, { font: F.jp(700, 19), color: C.accent, align: 'right', alpha: tw(t, BACK + 0.7, 0.5) });
      text(ctx, '次は、ここから読める', CARD.x + CARD.w / 2, CARD.y + CARD.h + 34, { font: F.jp(700, 19), color: C.ink, align: 'center', alpha: tw(t, BACK + 1.2, 0.6) });
    }

    example(ctx, M.l, 818, tw(t, 1.2, 0.5), '質問・資料・答えは説明のための例');
  },
});
