// Driving Codex from outside: app-server keeps the Codex core running and talks to a client in
// JSON-RPC-style messages without the "jsonrpc" field, one JSON per line over stdio by default.
// A thread is a conversation, a turn the work after one request, an item an utterance, command,
// file change and so on. The method names are the protocol's (openai/codex at 322bbf4); the
// parameters are elided. The VS Code extension, the desktop app and Codex Web's worker are its
// clients. "a client-friendly, bidirectional JSON-RPC API" (Celia Chen, 2026-02-04).

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { source, tag } from '../lib/parts.js';
import { jsonLine } from '../lib/rig.js';
import { text, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const CL = 190; // the client's lifeline
const SV = 1010; // the server's lifeline
const TOP = 196;
const ROW = 42;
// [when, to the server?, json]
const MSGS = [
  [0.9, true, '{"id":1,"method":"initialize","params":{…}}'],
  [1.5, false, '{"id":1,"result":{…}}'],
  [2.0, true, '{"method":"initialized"}'],
  [2.8, true, '{"id":2,"method":"thread/start","params":{…}}'],
  [3.4, false, '{"method":"thread/started","params":{…}}'],
  [4.2, true, '{"id":3,"method":"turn/start","params":{…}}'],
  [4.8, false, '{"method":"turn/started","params":{…}}'],
  [6.3, false, '{"method":"item/started","params":{…}}'],
  [7.1, false, '{"method":"item/completed","params":{…}}'],
  [7.9, false, '{"method":"item/agentMessage/delta","params":{…}}'],
  [8.7, false, '{"method":"turn/completed","params":{…}}'],
];
const NX = 1120;
const NEST = 6.0;
const CLIENTS = 11.4;

export default clip({
  id: 'appserver',
  title: '外から動かす',
  kicker: 'app-server',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'app-server は、Codex の中核を動かし続けるプロセス。\nアプリは、1 行に 1 つの JSON を送り合って、これを動かす。' },
    { at: 6.0, to: 11.2, text: '会話は thread、依頼ごとの仕事は turn、\nその中の発話やコマンドは item。進み具合は通知で届く。' },
    { at: 11.4, to: 18, text: 'VS Code の拡張やデスクトップアプリ、Codex Web の中の worker も、\napp-server を通して Codex を動かしている。' },
  ],

  draw(ctx, t) {
    // ——— the two ends and their lifelines
    const la = tw(t, 0.4, 0.5);
    end(ctx, CL, 'クライアント', 'あなたのアプリ', la, C.blue);
    end(ctx, SV, 'codex app-server', 'Codex の中核', la, C.ink);
    ctx.save();
    ctx.globalAlpha = la;
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    [CL, SV].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, TOP - 30);
      ctx.lineTo(x, TOP + MSGS.length * ROW);
      ctx.stroke();
    });
    ctx.restore();
    text(ctx, 'stdio、1 行に 1 つの JSON', (CL + SV) / 2, TOP - 46, { font: F.jp(500, 16), color: C.muted, align: 'center', alpha: la });

    // ——— the messages, in order
    MSGS.forEach(([at, up, json], i) => {
      const a = tw(t, at, 0.35);
      if (a <= 0) return;
      const y = TOP + i * ROW + 26;
      const x1 = up ? CL + 10 : SV - 10;
      const x2 = up ? SV - 10 : CL + 10;
      const p = inOutCubic(seg(t, at, at + 0.45));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = up ? C.blue : C.ink2;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2;
      arrow(ctx, x1, y, x2, y, p, 9);
      ctx.restore();
      jsonLine(ctx, json, CL + 22, y - 9, { font: F.mono(500, 14), alpha: a });
      // what kind of message
      const kind = json.startsWith('{"id"') ? (up ? '要求' : '応答') : '通知';
      text(ctx, kind, up ? CL - 16 : SV + 16, y + 5, { font: F.jp(700, 13), color: up ? C.blue : C.ink2, align: up ? 'right' : 'left', alpha: a });
    });

    // ——— thread, turn, item
    const na = tw(t, NEST, 0.6);
    if (na > 0) {
      const b = { x: NX, y: 150, w: W - M.r - NX, h: 360 };
      ctx.save();
      ctx.globalAlpha = na;
      rr(ctx, b.x, b.y, b.w, b.h, 16);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.restore();
      text(ctx, 'thread', b.x + 18, b.y + 34, { font: F.mono(600, 20), color: C.ink, alpha: na });
      text(ctx, '会話', b.x + 104, b.y + 33, { font: F.jp(700, 18), color: C.ink2, alpha: na });
      [0, 1].forEach((k) => {
        const ta = tw(t, NEST + 0.3 + k * 0.5, 0.5);
        const ty = b.y + 56 + k * 168;
        ctx.save();
        ctx.globalAlpha = ta * (k ? 0.55 : 1);
        rr(ctx, b.x + 14, ty, b.w - 28, 150, 12);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
        text(ctx, 'turn', b.x + 30, ty + 30, { font: F.mono(600, 18), color: C.ink, alpha: ta * (k ? 0.55 : 1) });
        text(ctx, k ? '次の依頼' : '依頼ごとの仕事', b.x + 86, ty + 29, { font: F.jp(700, 16), color: C.ink2, alpha: ta * (k ? 0.55 : 1) });
        const items = k ? ['発話', '返答'] : ['発話', 'コマンド', 'ファイルの変更', '返答'];
        let ix = b.x + 30;
        let iy = ty + 52;
        items.forEach((s, j) => {
          const w = tag(ctx, ix, iy, s, { font: F.jp(700, 15), h: 32, padX: 12, fill: j === 1 && !k ? C.accentSoft : C.panel, color: C.ink, alpha: tw(t, NEST + 0.8 + j * 0.15 + k * 0.5, 0.4) * (k ? 0.55 : 1) });
          ix += w + 10;
          if (ix > b.x + b.w - 120) {
            ix = b.x + 30;
            iy += 42;
          }
        });
        if (!k) text(ctx, 'item', b.x + b.w - 30, ty + 30, { font: F.mono(600, 16), color: C.accent, align: 'right', alpha: ta });
      });
      const ra = tw(t, NEST + 1.4, 0.5);
      text(ctx, '進み具合は、サーバーからの通知で届く', NX, b.y + b.h + 34, { font: F.jp(500, 16), color: C.ink2, alpha: ra });
      text(ctx, '“jsonrpc” の欄は送らない', NX, b.y + b.h + 60, { font: F.jp(500, 16), color: C.ink2, alpha: ra });
    }

    // ——— who uses it
    const ca = tw(t, CLIENTS, 0.6);
    if (ca > 0) {
      const y = 726;
      ctx.save();
      ctx.globalAlpha = ca;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 26, (W - M.l - M.r) * outExpo(ca), 2);
      ctx.restore();
      text(ctx, 'app-server を使うクライアント', M.l, y + 30, { font: F.jp(700, 20), color: C.ink, alpha: ca });
      let x = M.l + 300;
      ['VS Code の拡張', 'Codex のデスクトップアプリ', 'Codex Web の worker'].forEach((s, i) => {
        x += tag(ctx, x, y + 6, s, { font: F.jp(700, 18), h: 40, padX: 16, fill: C.blueSoft, color: C.blue, alpha: tw(t, CLIENTS + 0.3 + i * 0.25, 0.5) }) + 12;
      });
      text(ctx, '“a client-friendly, bidirectional JSON-RPC API”（Celia Chen、2026-02-04）', M.l, y + 82, { font: F.sans(500, 17), color: C.ink2, alpha: tw(t, CLIENTS + 1.2, 0.5) });
    }

    source(ctx, 'openai/codex の app-server（322bbf4）、OpenAI「Unlocking the Codex harness」（2026-02-04）', la);
  },
});

// One end of the conversation, above its lifeline.
function end(ctx, x, name, note, a, color) {
  if (a <= 0) return;
  tag(ctx, x, TOP - 112, name, { font: F.jp(700, 19), h: 40, padX: 16, fill: color, color: '#fff', align: 'center', alpha: a });
  text(ctx, note, x, TOP - 46, { font: F.jp(500, 15), color: C.ink2, align: 'center', alpha: a });
}
