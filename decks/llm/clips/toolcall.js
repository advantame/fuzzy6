// During generation: whether to call a tool is one more next-token choice. The model picks the
// mark that opens a call, writes the tool's name and input token by token, and generation
// stops at the closing mark; the app receives the call as data. The JSON is split with the real
// o200k_base tokenizer; the marks, the probabilities and the API shape are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source, chip, chipWidth } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, toolList, channel, docLayout, docEntry, docEnd, sweep, send, stopBadge, jsonLine } from '../lib/rig.js';
import { text, rr, line, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, inOutCubic, outBack } from '../../../src/kit/ease.js';

const L = layout();
const ENTRIES = [
  { role: 'system', text: '使えるツール：get_weather, search_web, calculate' },
  { role: 'user', text: '東京の今の気温は？' },
  { role: 'assistant', text: '' },
];
const OPEN = '〈呼び出し〉';
const CLOSE = '〈/呼び出し〉';
// {"name": "get_weather", "input": {"city": "東京"}} in o200k_base: 16 tokens
const CALL = ['{"', 'name', '":', ' "', 'get', '_weather', '",', ' "', 'input', '":', ' {"', 'city', '":', ' "', '東京', '"}}'];
const TOKENS = [OPEN, ...CALL, CLOSE];
const SPECIAL = { font: F.jp(700, 16), h: 34, padX: 11, r: 17, fill: C.ink, color: C.paper };
const PLAIN = { font: F.mono(500, 17), h: 34, padX: 7, r: 6 };
// the first choice after the assistant's mark
const FIRST = [
  [OPEN, 0.86],
  ['東京', 0.06],
  ['現在', 0.03],
  ['申し', 0.02],
];
const PANEL = { x: 96, y: 574, w: 282, h: 232 };
const RECEIVED = ['{"type": "tool_use",', ' "name": "get_weather",', ' "input": {"city": "東京"}}'];
const CARD = { x: 1110, y: 112, w: 394, h: 176 };
// OpenAI harmony (gpt-oss): the call as the model writes it (Cookbook example, line-broken)
const REAL = [
  '<|start|>assistant<|channel|>commentary',
  'to=functions.get_current_weather <|constrain|>json',
  '<|message|>{"location":"San Francisco"}',
];

const READ = 0.8;
const PROBS = 1.9;
const FLY = 3.4;
const STREAM = 5.8;
const STEP = 0.27;
const END = STREAM + (CALL.length + 0.4) * STEP;
const STOP = 11.0;

const isSpecial = (s) => s === OPEN || s === CLOSE;
const styleOf = (s, i) => (isSpecial(s) ? SPECIAL : { ...PLAIN, fill: C.tints[i % C.tints.length] });
const appearAt = (i) => (i === 0 ? FLY + 0.6 : i === TOKENS.length - 1 ? END : STREAM + (i - 1) * STEP);

export default clip({
  id: 'toolcall',
  title: '呼び出しを書く',
  kicker: 'ツール呼び出しの生成',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'ツールを使うかどうかも、**次のトークンの予測**で決まる。\nここで選ばれたのは、呼び出しの始まりを表す印。' },
    { at: 5.8, to: 11.0, text: '続けて、ツールの名前と入力を、\n学習した書式で 1 トークンずつ書いていく。' },
    { at: 11.2, to: 18, text: '終わりの印を書くと、生成はそこで止まる。\nアプリには、ツールの名前と入力が渡される。' },
  ],

  prepare(ctx) {
    const E = docLayout(ctx, L, ENTRIES, { top: 30, gap: 22 });
    // chips flow from the assistant's text position and wrap inside the paper
    const a = E[2];
    let x = a.tx;
    let y = a.y - 3;
    const chips = TOKENS.map((s, i) => {
      const w = chipWidth(ctx, s, styleOf(s, i));
      if (x + w > a.tx + a.w) {
        x = a.tx;
        y += 44;
      }
      const out = { s, x, y, w };
      x += w + 5;
      return out;
    });
    return { E, chips };
  },

  draw(ctx, t, { E, chips }) {
    const base = tw(t, 0, 0.5);
    appFrame(ctx, L, base, { note: 'モデルが読む文書' });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base, { hot: t >= STREAM - 0.2 && t < STOP });
    channel(ctx, L.call, base);
    channel(ctx, L.back, base);
    E.forEach((e, i) => docEntry(ctx, e, tw(t, 0.15 + i * 0.12, 0.4)));
    sweep(ctx, L, seg(t, READ, READ + 1.0), docEnd(E));
    send(ctx, L.read, seg(t, READ + 0.3, READ + 1.0), '', 'doc');

    // ——— the call, token by token
    chips.forEach((c, i) => {
      const at = appearAt(i);
      if (t < at) return;
      const pop = Math.min(1, outBack(seg(t, at, at + 0.25), 2));
      const flash = 1 - seg(t, at + 0.15, at + 0.7);
      const st = styleOf(c.s, i);
      ctx.save();
      ctx.translate(c.x + c.w / 2, c.y + 17);
      ctx.scale(lerp(0.7, 1, pop), lerp(0.7, 1, pop));
      ctx.translate(-(c.x + c.w / 2), -(c.y + 17));
      chip(ctx, c.x, c.y, c.s, { ...st, fill: !isSpecial(c.s) && flash > 0.5 ? C.accent : st.fill, color: !isSpecial(c.s) && flash > 0.5 ? '#fff' : st.color });
      ctx.restore();
    });
    // pulses along the write channel, one per token
    TOKENS.forEach((_, i) => {
      if (i === 0) return;
      const p = seg(t, appearAt(i) - 0.22, appearAt(i));
      if (p <= 0 || p >= 1) return;
      const x = lerp(L.write.x1, L.write.x2, p);
      ctx.fillStyle = C.accent;
      circle(ctx, x, L.write.y, 6);
      ctx.fill();
    });
    // the caret after the last written token, until generation stops
    const written = chips.filter((_, i) => t >= appearAt(i));
    if (t < STOP && Math.floor(t * 2.5) % 2 === 0) {
      const last = written[written.length - 1];
      const cx = last ? last.x + last.w + 6 : E[2].tx + 2;
      const cy = last ? last.y + 4 : E[2].y + 2;
      ctx.fillStyle = C.accent;
      ctx.fillRect(cx, cy, 4, 26);
    }
    // names for the two marks
    const open = chips[0];
    const ma = tw(t, FLY + 1.0, 0.5) * (1 - tw(t, STREAM, 0.4));
    text(ctx, '↑ 呼び出しの始まりを表す、特別なトークン', open.x, open.y + 66, { font: F.jp(700, 18), color: C.ink2, alpha: ma });
    const close = chips[chips.length - 1];
    const ea = tw(t, END + 0.4, 0.5);
    text(ctx, '↑ 終わりの印', close.x, close.y + 64, { font: F.jp(700, 18), color: C.ink2, alpha: ea });

    // ——— the model: first-token probabilities, then the stream
    const glow = Math.max(seg(t, READ + 0.9, READ + 1.2) * (1 - seg(t, FLY, FLY + 0.4)), seg(t, STREAM - 0.3, STREAM) * (1 - seg(t, STOP, STOP + 0.3)));
    llmBlock(ctx, L, base, { glow });
    stopBadge(ctx, L, tw(t, STOP, 0.4, (p) => outBack(p, 1.6)), 'tool_use');
    const pa = tw(t, PROBS, 0.5) * (1 - tw(t, FLY + 1.0, 0.5));
    if (pa > 0) {
      ctx.save();
      ctx.globalAlpha = pa;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      line(ctx, L.llm.x + L.llm.w / 2, L.llm.y + L.llm.h, L.llm.x + L.llm.w / 2, PANEL.y);
      rr(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 16);
      ctx.fillStyle = C.ink;
      ctx.fill();
      text(ctx, '次のトークンの確率', PANEL.x + 18, PANEL.y + 36, { font: F.jp(700, 17), color: '#bdb6a9' });
      const grow = inOutCubic(seg(t, PROBS + 0.2, PROBS + 0.9));
      const pick = seg(t, PROBS + 1.1, PROBS + 1.3);
      FIRST.forEach(([s, p], i) => {
        const y = PANEL.y + 56 + i * 42;
        const hot = i === 0;
        const flying = hot && t >= FLY;
        if (!flying) {
          chip(ctx, PANEL.x + 16, y, s, hot ? { ...SPECIAL, fill: pick > 0 ? C.accent : '#3b3732', color: '#fff' } : { font: F.jp(500, 17), h: 34, padX: 9, fill: '#3b3732', color: C.paper });
        }
        const bx = PANEL.x + 132;
        const w = Math.max(2, 90 * p * grow);
        ctx.fillStyle = hot && pick > 0 ? C.accent : '#8f897d';
        ctx.fillRect(bx, y + 9, w, 16);
        text(ctx, `${Math.round(p * 100)}%`, bx + w + 8, y + 24, { font: F.cond(700, 20), color: hot ? '#fff' : '#bdb6a9', alpha: grow });
      });
      ctx.restore();
    }
    // the chosen mark flies from the panel to the document
    const fly = seg(t, FLY, FLY + 0.6);
    if (fly > 0 && fly < 1) {
      const e = inOutCubic(fly);
      const fx = lerp(PANEL.x + 16, open.x, e);
      const fy = lerp(PANEL.y + 56, open.y, e) - Math.sin(Math.PI * e) * 60;
      chip(ctx, fx, fy, OPEN, { ...SPECIAL, fill: C.accent, color: '#fff' });
    }

    // ——— what the app receives once generation stops
    const ca = tw(t, STOP + 0.6, 0.6);
    if (ca > 0) {
      ctx.save();
      ctx.globalAlpha = ca;
      rr(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 14);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
      text(ctx, 'アプリが受け取る呼び出し', CARD.x + 20, CARD.y + 38, { font: F.jp(700, 19), color: C.accent, alpha: ca });
      RECEIVED.forEach((s, i) => jsonLine(ctx, s, CARD.x + 20, CARD.y + 80 + i * 30, { font: F.mono(500, 17), alpha: ca }));
      // the written call, outlined, with a thread to the card
      const x0 = chips[0].x - 8;
      const y0 = chips[0].y - 8;
      const x1 = Math.max(...chips.map((c) => c.x + c.w)) + 8;
      const y1 = close.y + 42;
      ctx.save();
      ctx.globalAlpha = ca;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2.5;
      rr(ctx, x0, y0, x1 - x0, y1 - y0, 12);
      ctx.stroke();
      line(ctx, x1, (y0 + y1) / 2, CARD.x, CARD.y + CARD.h - 24, tw(t, STOP + 0.7, 0.6, inOutCubic));
      ctx.restore();
    }
    toolBox(ctx, L, base, { draw: toolList(['get_weather', 'search_web', 'calculate']) });

    // ——— the same thing in a real, published format
    const ra = tw(t, STOP + 2.0, 0.6);
    if (ra > 0) {
      const x = L.doc.x + 18;
      const y = close.y + 98;
      const w = L.doc.w - 36;
      ctx.save();
      ctx.globalAlpha = ra;
      rr(ctx, x, y, w, 172, 12);
      ctx.fillStyle = C.paper;
      ctx.fill();
      ctx.restore();
      text(ctx, '実在する書式の例：gpt-oss（2025 年）', x + 20, y + 34, { font: F.jp(700, 17), color: C.ink2, alpha: ra });
      const mono = F.mono(500, 15);
      REAL.forEach((s, i) => {
        const w0 = text(ctx, s, x + 20, y + 68 + i * 24, { font: mono, color: C.ink, alpha: ra });
        if (i === REAL.length - 1) text(ctx, '<|call|>', x + 20 + w0, y + 68 + i * 24, { font: F.mono(600, 15), color: C.accent, alpha: ra });
      });
      text(ctx, '<|call|> は 1 トークン。ここで生成が止まり、呼び出しが渡される', x + 20, y + 150, { font: F.jp(500, 16), color: C.ink2, alpha: ra });
    }

    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '確率と印は説明のための例。区切りは o200k_base');
    source(ctx, 'OpenAI harmony（gpt-oss、2025 年 8 月）', ra);
  },
});
