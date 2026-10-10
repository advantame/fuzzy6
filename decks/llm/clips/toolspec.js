// Before generation: the app sends the tools' descriptions along with the conversation, and
// they become text at the head of the document the model reads. The model knows a tool only
// through that text. The tools and the request are an example shaped like Anthropic's API.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, toolList, channel, docLayout, docEntry, docEnd, sweep, send, jsonLine } from '../lib/rig.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic } from '../../../src/kit/ease.js';

const L = layout();
// what the app sends: [line, part it belongs to]
const API = [
  ['{', ''],
  ['  "tools": [', ''],
  ['    {', ''],
  ['      "name": "get_weather",', 'name'],
  ['      "description": "都市の今の天気を返す",', 'desc'],
  ['      "input_schema": {', 'input'],
  ['        "type": "object",', 'input'],
  ['        "properties": {"city": {"type": "string"}},', 'input'],
  ['        "required": ["city"]', 'input'],
  ['      }', 'input'],
  ['    },', ''],
  ['    {"name": "search_web", …},', ''],
  ['    {"name": "calculate", …}', ''],
  ['  ],', ''],
  ['  "messages": [', ''],
  ['    {"role": "user", "content": "東京の今の気温は？"}', ''],
  ['  ]', ''],
  ['}', ''],
];
const PARTS = [
  ['name', '名前', 2.4],
  ['desc', '何をするか', 3.1],
  ['input', '入力の形', 3.8],
];
const JFONT = F.mono(500, 17);
const JLH = 29;
const JX = L.doc.x + 26;
const JY = L.doc.y + 44;
const TOOLS = ['get_weather', 'search_web', 'calculate'];
// the same request, as the model reads it
const ENTRIES = [
  { role: 'system', text: '使えるツール：\nget_weather(city) — 都市の今の天気を返す\nsearch_web(query) — ウェブを検索する\ncalculate(expression) — 式を計算する' },
  { role: 'user', text: '東京の今の気温は？' },
  { role: 'assistant', text: '' },
];

const FLIP = 5.8;
const READ = 9.0;
const PICK = 11.2;

export default clip({
  id: 'toolspec',
  title: 'ツールの説明書',
  kicker: 'ツールの定義',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: '使えるツールは、アプリが**説明書**の形で渡す。\n名前、何をするか、入力の形を書いたもの。' },
    { at: 5.8, to: 11.0, text: '説明書は文字に直されて、文書の頭に入る。\nモデルが知っているツールは、ここに書かれたものだけ。' },
    { at: 11.2, to: 18, text: 'どのツールを使うか、使わないかは、\nモデルがこの説明を読んで決める。' },
  ],

  prepare(ctx) {
    return { E: docLayout(ctx, L, ENTRIES, { top: 30, gap: 22 }) };
  },

  draw(ctx, t, { E }) {
    const base = tw(t, 0, 0.5);
    const flip = inOutCubic(seg(t, FLIP, FLIP + 0.9));

    appFrame(ctx, L, base);
    const n1 = base * (1 - seg(t, FLIP - 0.3, FLIP));
    const n2 = tw(t, FLIP + 0.4, 0.5);
    text(ctx, 'API に渡すもの（説明書と会話）', L.app.x + 120, L.app.y + 39, { font: F.jp(500, 18), color: C.ink2, alpha: n1 });
    text(ctx, 'モデルが読む文書', L.app.x + 120, L.app.y + 39, { font: F.jp(500, 18), color: C.ink2, alpha: n2 });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base);
    channel(ctx, L.call, base);
    channel(ctx, L.back, base);

    // ——— what the app sends: the JSON, with its three parts marked
    const ja = 1 - flip;
    if (ja > 0) {
      ctx.save();
      ctx.globalAlpha = ja;
      ctx.translate(0, -40 * flip);
      PARTS.forEach(([part, , at]) => {
        const h = tw(t, at, 0.5);
        if (h <= 0) return;
        const rows = API.map(([, p], i) => (p === part ? i : -1)).filter((i) => i >= 0);
        const y0 = JY + rows[0] * JLH - 21;
        ctx.fillStyle = C.accentSoft;
        ctx.globalAlpha = ja * h * 0.75;
        rr(ctx, JX - 10, y0, (L.doc.w - 32) * h, rows.length * JLH + 2, 6);
        ctx.fill();
        ctx.globalAlpha = ja;
      });
      API.forEach(([s], i) => {
        const a = tw(t, 0.5 + i * 0.07, 0.4);
        jsonLine(ctx, s, JX, JY + i * JLH, { font: JFONT, alpha: a });
      });
      PARTS.forEach(([part, name, at]) => {
        const h = tw(t, at + 0.2, 0.5);
        if (h <= 0) return;
        const i = API.findIndex(([, p]) => p === part);
        text(ctx, name, L.doc.x + L.doc.w - 22, JY + i * JLH, { font: F.jp(700, 19), color: C.accent, align: 'right', alpha: h });
      });
      ctx.restore();
    }

    // ——— the document the model reads
    E.forEach((e, i) => {
      const a = tw(t, FLIP + 0.5 + i * 0.35, 0.5);
      if (a <= 0) return;
      ctx.save();
      ctx.translate(0, (1 - a) * 24);
      docEntry(ctx, e, a);
      ctx.restore();
    });
    // the assistant's turn is open: a caret where its text will go
    const last = E[E.length - 1];
    if (t >= FLIP + 1.4 && Math.floor(t * 2.5) % 2 === 0) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(last.tx + 2, last.y + 2, 4, 26);
    }
    // the model reads all of it, and the description that fits the question stands out
    sweep(ctx, L, seg(t, READ, READ + 1.0), docEnd(E));
    send(ctx, L.read, seg(t, READ + 0.3, READ + 1.0), '', 'doc');
    const pick = tw(t, PICK, 0.6);
    if (pick > 0) {
      const sys = E[0];
      const y = sys.y + 21 + sys.lh - 25;
      ctx.fillStyle = C.accentSoft;
      ctx.globalAlpha = 0.9 * pick;
      rr(ctx, sys.tx - 8, y, (sys.w + 8) * pick, 34, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      docEntry(ctx, { ...sys, rows: ['', sys.rows[1]] }, pick);
      text(ctx, '質問に合う説明', sys.tx + sys.w, y - 10, { font: F.jp(700, 18), color: C.accent, align: 'right', alpha: tw(t, PICK + 0.4, 0.5) });
    }

    // ——— the model, and the tools it was told about
    llmBlock(ctx, L, base, { glow: seg(t, READ + 0.8, READ + 1.1) * (1 - seg(t, PICK + 1.5, PICK + 2.2)) });
    toolBox(ctx, L, base, { draw: toolList(TOOLS, 0, pick) });

    example(ctx, M.l, 818, tw(t, 1.0, 0.5), 'ツールと書式は説明のための例（説明書の形は Anthropic の API にならった）');
  },
});
