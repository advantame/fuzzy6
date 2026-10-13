// Tool use, abstractly: the model can only write text, so the app stands between it and the
// tool. The model writes a request, the app runs the tool and writes the result back into the
// document. The tool is anything that takes an input and returns a result. This picture is
// the axis of chapters 5–7 (lib/rig.js). The question and the result are an example.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, chip } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, channel, docLayout, docEntry, docEnd, sweep, send, working, noLink } from '../lib/rig.js';
import { text, rr } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outBack, inOutCubic } from '../../../src/kit/ease.js';

const L = layout();
const ENTRIES = [
  { role: 'user', text: '東京の今の気温は？' },
  { role: 'assistant', kind: 'call', text: '依頼：天気を調べる（東京）' },
  { role: 'result', kind: 'data', text: '18℃、晴れ' },
  { role: 'assistant', text: '東京は今 18℃ で、晴れています。' },
];
// what the model writes on its own, before the app is there
const LOOSE = ['東京', 'の', '今', 'の', '気温', 'は', '…'];
const EXAMPLES = [
  ['天気の API', '都市 → 天気'],
  ['検索', '言葉 → 関係する文章'],
  ['計算機', '式 → 答え'],
  ['シェル', 'コマンド → 出力'],
];
const CARD = { w: 298, h: 72 };
const CARD_Y = [146, 232, 614, 700];

const APP_AT = 5.0;
const T = {
  user: 5.9,
  read1: 6.2,
  call: 7.0,
  input: 7.9,
  run: 8.5,
  result: 9.2,
  read2: 10.0,
  answer: 10.7,
  examples: 12.3,
};

export default clip({
  id: 'tools',
  title: 'ツールを使う',
  kicker: 'ツール使用',
  duration: 17,
  cues: [
    { at: 0.4, to: 4.8, text: 'LLM にできるのは、文章を書くことだけ。\n調べたり、動かしたりはできない。' },
    { at: 5.0, to: 11.8, text: 'そこで**アプリ**が間に立つ。モデルが依頼の文を書くと、\nアプリがツールを動かし、結果を文書に書き足す。' },
    { at: 12.0, to: 18, text: 'ツールの中身は何でもよい。\n入力を受け取って、結果を返すものなら。' },
  ],

  prepare(ctx) {
    // the abstract round is short, so it is set larger than the later clips
    return { E: docLayout(ctx, L, ENTRIES, { top: 34, gap: 30, font: F.jp(500, 27), lh: 40, mono: F.jp(500, 24), lhMono: 36 }) };
  },

  draw(ctx, t, { E }) {
    const appA = tw(t, APP_AT, 0.8);
    const appK = lerp(0.94, 1, appA);

    // ——— before the app: the model writes, and the words go nowhere
    LOOSE.forEach((s, i) => {
      const at = 1.0 + i * 0.32;
      const p = seg(t, at, at + 1.5);
      if (p <= 0 || p >= 1) return;
      const x = L.llm.x + L.llm.w + 24 + inOutCubic(p) * 300;
      const a = Math.min(1, p * 5) * (1 - seg(p, 0.6, 1));
      chip(ctx, x, L.llm.y + L.llm.h / 2 - 24, s, { font: F.jp(500, 24), h: 46, padX: 12, fill: C.tints[i % C.tints.length], alpha: a });
    });
    noLink(ctx, 660, L.llm.y + L.llm.h / 2, L.tool.x - 30, tw(t, 2.9, 0.6) * (1 - tw(t, APP_AT - 0.2, 0.4)), 'モデルは、ツールを直接は動かせない');

    // ——— the app between them
    ctx.save();
    const cx = L.app.x + L.app.w / 2;
    const cy = L.app.y + L.app.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(appK, appK);
    ctx.translate(-cx, -cy);
    appFrame(ctx, L, appA, { note: '依頼を読んでツールを動かし、結果を書き足す', noteAlpha: tw(t, T.examples + 0.6, 0.6) });
    ctx.restore();
    const ch = tw(t, APP_AT + 0.5, 0.6, inOutCubic);
    channel(ctx, L.read, ch);
    channel(ctx, L.write, ch);
    channel(ctx, L.call, tw(t, APP_AT + 0.65, 0.6, inOutCubic));
    channel(ctx, L.back, tw(t, APP_AT + 0.65, 0.6, inOutCubic));

    // the document, entry by entry
    const shows = [T.user, T.call + 0.6, T.result + 0.6, T.answer + 0.6];
    E.forEach((e, i) => {
      const a = tw(t, shows[i], 0.4);
      const hot = i === 1 && t >= T.input - 0.2 && t < T.run + 0.4;
      docEntry(ctx, e, a, { hot, chars: i === 3 ? seg(t, shows[i], shows[i] + 0.8) : 1 });
    });
    sweep(ctx, L, seg(t, T.read1, T.read1 + 0.8), docEnd(E, 1));
    sweep(ctx, L, seg(t, T.read2, T.read2 + 0.8), docEnd(E, 3));
    send(ctx, L.read, seg(t, T.read1 + 0.2, T.read1 + 0.8), '', 'doc');
    send(ctx, L.read, seg(t, T.read2 + 0.2, T.read2 + 0.8), '', 'doc');
    send(ctx, L.write, seg(t, T.call, T.call + 0.6), '依頼', 'call');
    send(ctx, L.call, seg(t, T.input, T.input + 0.6), '東京', 'call');
    send(ctx, L.back, seg(t, T.result, T.result + 0.6), '18℃、晴れ', 'data');
    send(ctx, L.write, seg(t, T.answer, T.answer + 0.6), '答え', 'text');

    // ——— the model and the tool
    const llmA = tw(t, 0.2, 0.6, (p) => outBack(p, 1.4));
    const writing = Math.max(seg(t, T.call - 0.3, T.call) * (1 - seg(t, T.call + 0.6, T.call + 0.8)), seg(t, T.answer - 0.3, T.answer) * (1 - seg(t, T.answer + 0.6, T.answer + 0.8)));
    llmBlock(ctx, L, Math.min(1, llmA), { glow: writing, note: '文章を書く', noteAlpha: tw(t, 1.0, 0.5) });
    const toolA = tw(t, 0.5, 0.6, (p) => outBack(p, 1.4));
    const runP = seg(t, T.run, T.run + 0.7);
    toolBox(ctx, L, Math.min(1, toolA), {
      glow: runP > 0 && runP < 1 ? 1 : 0,
      note: t >= T.examples + 0.6 ? '入力を受け取り、結果を返す' : '調べる・動かす',
    });
    working(ctx, L, runP);

    // ——— what can sit in the tool's place
    const ha = tw(t, T.examples, 0.5);
    text(ctx, 'ツールの例', L.tool.x, 126, { font: F.jp(700, 18), color: C.muted, alpha: ha });
    EXAMPLES.forEach(([name, io], i) => {
      const a = tw(t, T.examples + 0.15 + i * 0.18, 0.5, (p) => outBack(p, 1.3));
      if (a <= 0) return;
      const y = CARD_Y[i] + (1 - Math.min(1, a)) * (i < 2 ? -10 : 10);
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      rr(ctx, L.tool.x, y, CARD.w, CARD.h, 12);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      text(ctx, name, L.tool.x + 18, y + 30, { font: F.jp(700, 21), color: C.ink, alpha: Math.min(1, a) });
      text(ctx, io, L.tool.x + 18, y + 57, { font: F.jp(400, 17), color: C.ink2, alpha: Math.min(1, a) });
    });

    example(ctx, M.l, 818, tw(t, APP_AT + 1.0, 0.5), '質問と結果は説明のための例');
  },
});
