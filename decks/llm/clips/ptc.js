// Calling tools from code. One call at a time (4-5), every result lands in the document and the
// model rereads all of it, large intermediate results included. Let the model write code that
// calls the tools instead: the code runs in a sandbox, the intermediate work stays in the code,
// and only the final result comes back. Cloudflare's Code Mode (2025-09-26), Anthropic's code
// execution with MCP (2025-11-04; loading only the definitions needed took one example from
// 150,000 to 2,000 tokens) and programmatic tool calling (beta, 2025-11-24), and dsh's Code (PTC)
// preset. The task, the code and the token counts are an example.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { example, source, tag } from '../lib/parts.js';
import { ROLE } from '../lib/rig.js';
import { text, rr, measure, typed } from '../../../src/kit/draw.js';
import { tw, seg, outExpo } from '../../../src/kit/ease.js';

const LW = 680;
const LX = [M.l, W - M.r - LW];
const DY = 150;
const DH = 404;
// [role, kind, text or lines, tokens, when]
const ONE = [
  ['user', 'text', '9 月の遅れた注文を、顧客ごとにまとめて', 30, 0.8],
  ['assistant', 'call', 'orders.list({ month: 9 })', 20, 1.4],
  ['result', 'big', '（注文 1,200 件の一覧）', 38000, 1.9],
  ['assistant', 'call', 'customers.get("c-104")', 20, 2.7],
  ['result', 'data', '{ name: "…", … }', 900, 3.1],
  ['assistant', 'call', 'customers.get("c-233")', 20, 3.6],
  ['result', 'data', '{ name: "…", … }', 900, 4.0],
  ['assistant', 'text', 'まとめました。遅れは 3 件で…', 60, 4.6],
];
const CODE = [
  'const late = (await orders.list({ month: 9 }))',
  '  .filter((o) => o.late);',
  'const who = await Promise.all(',
  '  late.map((o) => customers.get(o.customer)));',
  'return summarize(late, who);',
];
const BY_CODE = [
  ['user', 'text', '9 月の遅れた注文を、顧客ごとにまとめて', 30, 6.2],
  ['assistant', 'code', CODE, 90, 6.8],
  ['result', 'data', '遅れ 3 件、顧客 3 人のまとめ', 150, 8.8],
  ['assistant', 'text', 'まとめました。遅れは 3 件で…', 60, 9.4],
];
const FACTS = 11.4;

export default clip({
  id: 'ptc',
  title: 'コードで呼ぶ',
  kicker: 'PTC と Code Mode',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.8, text: 'ツールを一つずつ呼ぶと、そのたびに結果が文書に積まれ、\nモデルは全部を読み直す。途中の大きな結果も、窓に入る。' },
    { at: 6.0, to: 11.2, text: 'そこで、ツールを呼ぶコードをモデルに書かせ、まとめて実行する。\n途中の処理はコードの中で済み、文書に戻るのは最後の結果だけ。' },
    { at: 11.4, to: 18, text: '2025 年 9 月に Cloudflare が、11 月に Anthropic が、この形を示した。\ndsh にも、Code（PTC）というプリセットがある。' },
  ],

  draw(ctx, t) {
    lane(ctx, t, 0, '一つずつ呼ぶ', '4-5 のループ', ONE, 0.4);
    lane(ctx, t, 1, 'コードで呼ぶ', 'まとめて実行', BY_CODE, 6.0);

    // ——— where the idea came from
    const fa = tw(t, FACTS, 0.6);
    if (fa > 0) {
      const y = 680;
      ctx.save();
      ctx.globalAlpha = fa;
      ctx.fillStyle = C.rule;
      ctx.fillRect(M.l, y - 34, (W - M.l - M.r) * outExpo(fa), 2);
      ctx.restore();
      const items = [
        ['2025-09-26', 'Cloudflare「Code Mode」', 'MCP のツールを TypeScript の API として見せる'],
        ['2025-11-04', 'Anthropic「Code execution with MCP」', '要る定義だけを読む例で 150,000 → 2,000 トークン'],
        ['2025-11-24', 'Anthropic の Programmatic Tool Calling', 'Python からツールを呼ぶ（ベータ）'],
      ];
      items.forEach(([when, who, what], i) => {
        const a = tw(t, FACTS + 0.3 + i * 0.3, 0.5);
        const yy = y + i * 34;
        const w = text(ctx, when, M.l, yy, { font: F.cond(700, 20), color: C.ink, alpha: a });
        const w2 = text(ctx, who, M.l + w + 14, yy, { font: F.jp(700, 18), color: C.ink, alpha: a });
        text(ctx, what, M.l + w + 14 + w2 + 16, yy, { font: F.jp(500, 17), color: C.ink2, alpha: a });
      });
    }

    example(ctx, M.l, 818, tw(t, 1.0, 0.5), '依頼、コード、トークンの数は説明のための例');
    source(ctx, 'Cloudflare（2025-09-26）、Anthropic（2025-11-04、2025-11-24）、deepseek-harness の ptc プリセット', fa);
  },
});

// One way of working: its title, the document it builds, and what the model rereads.
function lane(ctx, t, k, name, note, rows, at) {
  const a = tw(t, at, 0.5);
  if (a <= 0) return;
  const x = LX[k];
  const w = text(ctx, name, x, DY - 22, { font: F.jp(700, 24), color: k ? C.accent : C.ink, alpha: a });
  text(ctx, note, x + w + 16, DY - 23, { font: F.jp(500, 17), color: C.muted, alpha: a });
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, DY, LW, DH, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  let y = DY + 18;
  let tokens = 0;
  let reads = 0;
  rows.forEach(([role, kind, s, n, when]) => {
    const ra = tw(t, when, 0.35);
    const h = kind === 'big' ? 80 : kind === 'code' ? 22 + CODE.length * 22 : 30;
    if (ra > 0) {
      row(ctx, t, x + 16, y, LW - 32, role, kind, s, h, ra, when);
      tokens += n;
      if (role === 'assistant') reads++;
    }
    y += h + 8;
  });
  // what the model had to read, once it has read anything
  const firstRead = rows.find((r) => r[0] === 'assistant')[4];
  const ca = tw(t, firstRead, 0.4);
  const cy = DY + DH + 42;
  const rw = text(ctx, `${reads}`, x, cy, { font: F.cond(700, 40), color: k ? C.accent : C.ink, alpha: ca });
  text(ctx, '回、モデルが文書を読み直した', x + rw + 8, cy - 4, { font: F.jp(700, 18), color: C.ink2, alpha: ca });
  text(ctx, `文書 約 ${(Math.round(tokens / 100) * 100).toLocaleString('en-US')} トークン`, x + LW, cy - 4, { font: F.jp(700, 18), color: k ? C.accent : C.ink, align: 'right', alpha: ca });
}

// One entry of a lane's document, in the role marks of the tool diagram.
function row(ctx, t, x, y, w, role, kind, s, h, a, when) {
  const r = ROLE[role];
  const font = F.jp(700, 13);
  const tw_ = measure(ctx, font, r.name) + 14;
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, x, y + 3, tw_, 24, 6);
  ctx.fillStyle = r.fill;
  ctx.fill();
  ctx.restore();
  text(ctx, r.name, x + tw_ / 2, y + 16, { font, color: r.color, align: 'center', base: 'middle', alpha: a });
  const bx = x + 108;
  const bw = w - 108;
  if (kind === 'text') {
    text(ctx, s, bx, y + 21, { font: F.jp(500, 17), color: C.ink, alpha: a });
    return;
  }
  const call = kind === 'call' || kind === 'code';
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, bx, y, bw, h, 8);
  ctx.fillStyle = call ? C.accentSoft : '#eef6f0';
  ctx.fill();
  ctx.fillStyle = call ? C.accent : C.green;
  ctx.fillRect(bx, y + 5, 4, h - 10);
  if (kind === 'big') {
    // a long listing: rows of grey
    ctx.fillStyle = C.rule;
    for (let k = 0; k < 4; k++) ctx.fillRect(bx + 16, y + 34 + k * 11, (bw - 40) * (0.6 + 0.4 * (((k * 37) % 10) / 10)), 5);
  }
  ctx.restore();
  if (kind === 'code') {
    s.forEach((line, k) => {
      text(ctx, typed(line, seg(t, when + k * 0.35, when + k * 0.35 + 0.35)), bx + 14, y + 26 + k * 22, { font: F.mono(500, 14), color: C.ink, alpha: a });
    });
    return;
  }
  const jp = /[^\x00-\x7f]/.test(s.replace(/[…]/g, ''));
  text(ctx, s, bx + 14, y + 21, { font: kind === 'big' ? F.jp(700, 16) : jp ? F.jp(500, 16) : F.mono(500, 15), color: C.ink, alpha: a });
}
