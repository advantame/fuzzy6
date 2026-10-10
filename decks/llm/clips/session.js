// A session: one piece of work, from the request to the report, piling up in one document that
// the model rereads every round. Most of its bulk is tool results. The harness saves it to a
// file and can resume it later. The session, its contents and the token counts are an example;
// the storage and the commands are Claude Code's and Codex CLI's documented behaviour.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox, toolList, channel, ROLE } from '../lib/rig.js';
import { text, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const L = layout();
// [role, kind, text, tokens, tool lit]
const EVENTS = [
  ['system', 'text', '指示とツールの説明書', 12000],
  ['user', 'text', 'ログインの不具合を直して。テストも通して。', 30],
  ['assistant', 'text', 'まず、関係するファイルを探します。', 40],
  ['assistant', 'call', 'bash: grep -rn "login" src/', 30, 0],
  ['result', 'data', 'src/auth/login.ts:12: …（38 行）', 900],
  ['assistant', 'call', 'read: src/auth/login.ts', 30, 1],
  ['result', 'data', '（ファイルの中身 240 行）', 3200],
  ['assistant', 'text', 'トークンの期限切れを見落としています。', 40],
  ['assistant', 'call', 'edit: src/auth/login.ts', 60, 2],
  ['result', 'data', '1 か所を書き換えました', 40],
  ['assistant', 'call', 'bash: npm test', 30, 0],
  ['result', 'data', '（テストの出力 180 行）… 2 failed', 4800],
  ['assistant', 'call', 'read: src/auth/session.ts', 30, 1],
  ['result', 'data', '（ファイルの中身 310 行）', 4100],
  ['assistant', 'call', 'edit: src/auth/session.ts', 60, 2],
  ['result', 'data', '1 か所を書き換えました', 40],
  ['assistant', 'call', 'bash: npm test', 30, 0],
  ['result', 'data', '（テストの出力 172 行）… all passed', 4500],
  ['assistant', 'text', '直しました。原因は 2 つありました。', 60],
];
const T0 = 0.6;
const STEP = 0.44;
const ROW = 38;
const appearAt = (i) => T0 + i * STEP;
const SAVE = 11.4;
// share of the document by kind, for the bar
const GROUPS = [
  ['ツールの結果', (e) => e[0] === 'result', C.green],
  ['指示と説明書', (e) => e[0] === 'system', C.ink2],
  ['会話と呼び出し', (e) => e[0] !== 'result' && e[0] !== 'system', C.accent],
];
const JSONL = [
  '{"type":"user","message":{…}}',
  '{"type":"assistant","message":{…}}',
  '{"type":"user","message":{…}}',
  '…',
];

export default clip({
  id: 'session',
  title: '一回の仕事',
  kicker: 'セッション',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: '依頼から報告までの一回の仕事を、**セッション**と呼ぶ。\nやりとりはすべて、一本の文書に積み上がる。' },
    { at: 5.8, to: 11.2, text: 'ふくらむのは主に、ツールの結果。\nモデルは 1 周ごとに、この全部を読み直す。' },
    { at: 11.4, to: 18, text: 'セッションはファイルに保存され、あとで続きから再開できる。\nClaude Code は、1 行に 1 件ずつの JSONL に記録する。' },
  ],

  draw(ctx, t) {
    const base = tw(t, 0, 0.5);
    const shown = EVENTS.filter((_, i) => t >= appearAt(i));
    const tokens = shown.reduce((n, e) => n + e[3], 0);
    appFrame(ctx, L, base, { name: 'ハーネス' });
    text(ctx, `約 ${(Math.round(tokens / 100) * 100).toLocaleString('en-US')} トークン`, L.app.x + L.app.w - 26, L.app.y + 40, { font: F.cond(700, 26), color: C.accent, align: 'right', alpha: base * tw(t, T0, 0.4) });
    text(ctx, 'セッションの文書', L.app.x + 140, L.app.y + 39, { font: F.jp(500, 18), color: C.ink2, alpha: base });
    channel(ctx, L.read, base);
    channel(ctx, L.write, base);
    channel(ctx, L.call, base);
    channel(ctx, L.back, base);

    // ——— the document, scrolling as it grows
    const d = L.doc;
    const top = d.y + 18;
    const visible = Math.floor((d.h - 30) / ROW);
    // once the paper is full, each new entry pushes the rest up by one row
    const smooth = EVENTS.reduce((s, _, i) => (i + 1 > visible ? s + ROW * inOutCubic(seg(t, appearAt(i), appearAt(i) + 0.35)) : s), 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(d.x, d.y + 6, d.w, d.h - 12);
    ctx.clip();
    EVENTS.forEach((e, i) => {
      const a = tw(t, appearAt(i), 0.3);
      if (a <= 0) return;
      const y = top + i * ROW - smooth;
      if (y < d.y - ROW || y > d.y + d.h) return;
      entry(ctx, d.x + 18, y, e, a);
    });
    ctx.restore();
    // a fade at the top edge, where earlier entries scroll away
    if (smooth > 0) {
      const g = ctx.createLinearGradient(0, d.y, 0, d.y + 40);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(d.x + 6, d.y + 6, d.w - 12, 34);
    }

    // ——— the model rereads it all each round; the tools take turns
    const last = shown[shown.length - 1];
    const writing = last && (last[0] === 'assistant') && t < appearAt(EVENTS.length - 1) + 0.6;
    llmBlock(ctx, L, base, { glow: writing ? 0.8 : 0 });
    const lit = last && last[4] !== undefined && t < appearAt(EVENTS.indexOf(last)) + STEP ? last[4] : -1;
    toolBox(ctx, L, base, { draw: toolList(['bash', 'read', 'edit'], lit, lit >= 0 ? 1 : 0) });

    // ——— what the document is made of
    const ca = tw(t, 5.8, 0.6);
    if (ca > 0) {
      const x = L.llm.x;
      const y = L.llm.y + L.llm.h + 62;
      const w = 270;
      text(ctx, '文書の中身', x, y, { font: F.jp(700, 18), color: C.ink, alpha: ca });
      let bx = x;
      GROUPS.forEach(([name, pick, col], i) => {
        const v = shown.filter(pick).reduce((s, e) => s + e[3], 0) / Math.max(1, tokens);
        ctx.fillStyle = col;
        ctx.globalAlpha = ca;
        ctx.fillRect(bx, y + 16, w * v, 26);
        ctx.globalAlpha = 1;
        bx += w * v;
        text(ctx, `${name}　${Math.round(v * 100)}%`, x + 18, y + 76 + i * 28, { font: F.jp(500, 16), color: C.ink, alpha: ca });
        ctx.fillStyle = col;
        ctx.globalAlpha = ca;
        ctx.fillRect(x, y + 64 + i * 28, 10, 10);
        ctx.globalAlpha = 1;
      });
    }

    // ——— saved, and resumed
    const s = tw(t, SAVE, 0.6);
    if (s > 0) {
      const x = L.tool.x - 20;
      const y = L.tool.y + L.tool.h + 34;
      const w = L.tool.w + 20;
      ctx.save();
      ctx.globalAlpha = s;
      rr(ctx, x, y, w, 214, 12);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      text(ctx, '~/.claude/projects/…/<id>.jsonl', x + 16, y + 28, { font: F.mono(600, 13), color: C.ink, alpha: s });
      JSONL.forEach((line, i) => text(ctx, line, x + 16, y + 56 + i * 22, { font: F.mono(500, 12), color: C.ink2, alpha: tw(t, SAVE + 0.2 + i * 0.12, 0.3) }));
      const r = tw(t, SAVE + 1.4, 0.5, (p) => outBack(p, 1.5));
      if (r > 0) {
        const cw = tag(ctx, x + 16, y + 142, 'claude --resume', { font: F.mono(600, 15), h: 30, padX: 12, r: 8, fill: C.accent, color: '#fff', alpha: Math.min(1, r) });
        text(ctx, '続きから', x + 30 + cw, y + 163, { font: F.jp(700, 16), color: C.accent, alpha: Math.min(1, r) });
      }
      text(ctx, 'Codex CLI では codex resume', x + 16, y + 198, { font: F.jp(500, 15), color: C.muted, alpha: tw(t, SAVE + 2.2, 0.5) });
      // the file comes back into the harness
      const back = tw(t, SAVE + 1.8, 0.8, inOutCubic);
      if (back > 0) {
        ctx.strokeStyle = C.accent;
        ctx.fillStyle = C.accent;
        ctx.lineWidth = 3;
        arrow(ctx, x - 10, y + 157, L.app.x + L.app.w + 10, y + 157, back, 12);
      }
    }
    source(ctx, 'Claude Code と Codex CLI の公式文書（2026 年 10 月）', s);
    example(ctx, M.l, 818, tw(t, 1.0, 0.5), 'セッションの中身とトークン数は説明のための例');
  },
});

// One compact line of the session: role mark and a single line of text.
function entry(ctx, x, y, e, a) {
  const [role, kind, s] = e;
  const r = ROLE[role];
  ctx.save();
  ctx.globalAlpha *= a;
  tag(ctx, x, y, r.name, { font: F.jp(700, 14), h: 26, padX: 8, r: 5, fill: r.fill, color: r.color });
  const tx = x + 118;
  if (kind !== 'text') {
    rr(ctx, tx, y - 2, 500, 30, 6);
    ctx.fillStyle = kind === 'call' ? C.accentSoft : '#eef6f0';
    ctx.fill();
    ctx.fillStyle = kind === 'call' ? C.accent : C.green;
    ctx.fillRect(tx, y + 3, 3, 20);
  }
  text(ctx, s, tx + (kind === 'text' ? 0 : 12), y + 19, { font: kind === 'text' ? F.jp(500, 17) : F.mono(500, 15), color: role === 'system' ? C.ink2 : C.ink });
  ctx.restore();
}
