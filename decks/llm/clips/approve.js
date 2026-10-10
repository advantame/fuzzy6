// Asking first. Before a command runs, app-server asks the client: not a notification but a request
// from the server with an id (item/commandExecution/requestApproval), which the client answers
// with the same id and a decision — accept, acceptForSession, decline (skip the action, the turn
// goes on) or cancel (and stop the turn). The app draws the dialog however it likes. File changes
// have the same kind of request. The command and the dialog are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { jsonLine } from '../lib/rig.js';
import { text, rr, arrow } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack, outExpo } from '../../../src/kit/ease.js';

const CL = 190;
const SV = 1010;
const TOP = 196;
const ROW = 50;
// [when, to the server?, json, hot]
const MSGS = [
  [1.0, false, '{"method":"item/started","params":{…}}'],
  [1.8, false, '{"id":7,"method":"item/commandExecution/requestApproval","params":{…}}', true],
  [4.2, true, '{"id":7,"result":{"decision":"accept"}}', true],
  [4.9, false, '{"method":"item/completed","params":{…}}'],
];
const DLG = { x: M.l, y: 430, w: 820, h: 196 };
const BUTTONS = ['許可', 'このセッションでは許可', '断る', '中止'];
const DECISIONS = [
  ['accept', 'この操作を許可する'],
  ['acceptForSession', 'このセッション中は許可'],
  ['decline', '断る。turn は続く'],
  ['cancel', '断って、turn も止める'],
];
const DX = 1060;
const DEC = 6.0;
const END = 11.4;

export default clip({
  id: 'approve',
  title: '許可を聞く',
  kicker: '承認の往復',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: '危ない操作の前に、app-server はクライアントへ許可を求める。\n通知ではなく、番号の付いた要求で、答えを待つ。' },
    { at: 6.0, to: 11.2, text: '答えは四つ。許可、このセッションでは許可、断る、中止。\n断ると操作だけを飛ばして続け、中止すると turn ごと止まる。' },
    { at: 11.4, to: 18, text: '許可を聞く画面は、アプリが自分の形で作れる。\nファイルの変更にも、同じ形の要求がある。' },
  ],

  draw(ctx, t) {
    // ——— the two ends
    const la = tw(t, 0.4, 0.5);
    tag(ctx, CL, TOP - 96, 'クライアント', { font: F.jp(700, 19), h: 40, padX: 16, fill: C.blue, color: '#fff', align: 'center', alpha: la });
    tag(ctx, SV, TOP - 96, 'codex app-server', { font: F.jp(700, 19), h: 40, padX: 16, fill: C.ink, color: '#fff', align: 'center', alpha: la });
    ctx.save();
    ctx.globalAlpha = la;
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    [CL, SV].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, TOP - 46);
      ctx.lineTo(x, TOP + MSGS.length * ROW);
      ctx.stroke();
    });
    ctx.restore();
    // the server waits while the question is open
    const waiting = t >= 1.8 && t < 4.4;
    const st = t < 1.8 ? 'turn：進行中' : waiting ? 'turn：答えを待つ' : 'turn：続ける';
    text(ctx, st, SV + 16, TOP - 20, { font: F.jp(700, 16), color: waiting ? C.accent : C.ink2, alpha: la });

    MSGS.forEach(([at, up, json, hot], i) => {
      const a = tw(t, at, 0.35);
      if (a <= 0) return;
      const y = TOP + i * ROW + 24;
      const p = inOutCubic(seg(t, at, at + 0.45));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = hot ? C.accent : up ? C.blue : C.ink2;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = hot ? 3 : 2;
      arrow(ctx, up ? CL + 10 : SV - 10, y, up ? SV - 10 : CL + 10, y, p, 10);
      ctx.restore();
      jsonLine(ctx, json, CL + 22, y - 10, { font: F.mono(500, 14), alpha: a });
      const kind = json.startsWith('{"id"') ? (up ? '応答' : '要求') : '通知';
      text(ctx, kind, up ? SV + 16 : CL - 16, y + 5, { font: F.jp(700, 14), color: hot ? C.accent : C.ink2, align: up ? 'left' : 'right', alpha: a });
    });
    text(ctx, '同じ番号で答える', SV + 16, TOP + 2 * ROW + 50, { font: F.jp(700, 15), color: C.accent, alpha: tw(t, 4.6, 0.4) });

    // ——— the app's own dialog
    const da = tw(t, 2.4, 0.5, (p) => outBack(p, 1.4));
    if (da > 0) {
      const a = Math.min(1, da);
      ctx.save();
      ctx.globalAlpha = a;
      rr(ctx, DLG.x, DLG.y, DLG.w, DLG.h, 16);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
      text(ctx, 'コマンドを実行してよいですか？', DLG.x + 26, DLG.y + 42, { font: F.jp(700, 22), color: C.ink, alpha: a });
      tag(ctx, DLG.x + 26, DLG.y + 62, 'npm install', { font: F.mono(600, 18), h: 38, padX: 14, fill: C.panel, color: C.ink, alpha: a, r: 8 });
      let x = DLG.x + 26;
      BUTTONS.forEach((s, i) => {
        const clicked = i === 0 && t >= 3.6;
        const w = tag(ctx, x, DLG.y + 130, s, { font: F.jp(700, 18), h: 42, padX: 18, fill: clicked ? C.blue : i === 0 ? C.blueSoft : '#fff', stroke: clicked || i === 0 ? null : C.ink2, color: clicked ? '#fff' : i === 0 ? C.blue : C.ink, alpha: a, r: 10 });
        x += w + 12;
      });
      text(ctx, 'アプリが作る画面', DLG.x + DLG.w - 24, DLG.y + 41, { font: F.jp(500, 15), color: C.muted, align: 'right', alpha: a });
    }

    // ——— the four answers
    const ea = tw(t, DEC, 0.6);
    if (ea > 0) {
      text(ctx, '答えの種類', DX, TOP + 2 * ROW + 118, { font: F.jp(700, 20), color: C.ink, alpha: ea });
      DECISIONS.forEach(([k, what], i) => {
        const a = tw(t, DEC + 0.3 + i * 0.3, 0.4);
        const y = TOP + 2 * ROW + 140 + i * 54;
        const lit = (i === 2 && t >= 8.6 && t < 10.0) || (i === 3 && t >= 10.0 && t < 11.4);
        ctx.save();
        ctx.globalAlpha = a;
        rr(ctx, DX, y, W - M.r - DX, 46, 10);
        ctx.fillStyle = lit ? C.accentSoft : '#fff';
        ctx.fill();
        ctx.restore();
        text(ctx, k, DX + 16, y + 30, { font: F.mono(600, 17), color: C.ink, alpha: a });
        text(ctx, what, DX + 200, y + 30, { font: F.jp(500, 17), color: C.ink2, alpha: a });
      });
    }

    // ——— the same for file changes
    const fa = tw(t, END, 0.6);
    if (fa > 0) {
      const y = 712;
      ctx.save();
      ctx.globalAlpha = fa;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 34, (W - M.l - M.r) * outExpo(fa), 2);
      ctx.restore();
      text(ctx, 'ファイルの変更にも同じ形の要求', M.l, y + 4, { font: F.jp(700, 19), color: C.ink, alpha: fa });
      text(ctx, 'item/fileChange/requestApproval', M.l + 318, y + 3, { font: F.mono(600, 17), color: C.ink2, alpha: fa });
      text(ctx, '設定によっては、要求が来ないこともある', W - M.r, y + 3, { font: F.jp(500, 17), color: C.muted, align: 'right', alpha: tw(t, END + 0.6, 0.5) });
    }

    example(ctx, M.l, 818, tw(t, 2.6, 0.5), 'コマンドと画面は説明のための例');
    source(ctx, 'openai/codex の app-server-protocol（322bbf4）ServerRequest.ts ほか', la);
  },
});
