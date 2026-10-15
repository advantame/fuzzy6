// 6-6: operating a screen. Some software is made only for people to operate on a screen. So the designer
// connects, as tools, programs that take a picture of the screen and that work the mouse and the keyboard.
// Asked to book a meeting room, the LLM first asks for a screenshot; the picture comes back. A model made for
// operating screens is given that picture to read, and judges where the buttons and the input boxes are —
// and it can get a position wrong. The LLM is made to write, for the tools that operate, where to click and
// what to type; once the app has done it, it takes the screen as a picture again and hands it to the LLM,
// which chooses the next operation from it. So work on screens made for people can go on. In October 2024
// Anthropic released such tools as a public beta; on OSWorld (tasks of operating a screen) the model of the
// time solved about 15% with the screen's pictures only and at most 15 operations, while people, in the
// original paper's study, solved about 72% under other conditions. OSWorld-Verified, which revised the
// tasks and their scoring, has a score of about 86% in its official table of August 2026 — another version
// and other conditions, not to be compared with the 15% as it is (two separate cards, no line between them,
// no ratio, no line for the people's value). ずんだもん would not like her own computer worked on at will:
// the place where it is operated is kept apart from the everyday computer, with what may be used narrowed
// down — and an operation that reaches outside, such as confirming the booking, is put to a person first
// (the booking does reach the outside service even from a place apart). The next chapter looks closely at
// the app working around the LLM.
//
// The layout is 6-5's with the app's frame narrower, the chat screen shorter and the tool's place wider
// (G66), so that the screen in it is large. The clip joins 6-5 (spec §6.10): its first frame is 6-5's last
// picture, drawn here as coding.js draws it, and the bridge clears 6-5's conversation, its column and card,
// the shell and the files, then moves the frame, the screen and the tool's place to this clip's places.
// Everything in the conversation is an example: the request, the booking page, the definitions of the
// three tools, the operations (cut into tokens as o200k_base cuts them; not the 2024 API's form), the
// pictures; the release and the OSWorld numbers are facts (research/connect-facts 6-6 and its OSWorld part).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import {
  chatScreen, screenBubbles, chatBubble, screenLinks, toTool, fromTool, writePath, flyMark, llmBlock, appFrame, toolBox,
  channel, actor, token, TOKEN, onPath, docLayout, docEntry, rowAt, sweep, send, roleMark, markWidth,
  MARK_H, ROLE, WRITER, toolUseLayout, G5,
} from '../lib/rig.js';
import {
  G6, T as T64, L as L64, DOC as DOC64, MFONT, DX, SYS, defY, DEFS, defRows, drawDef, callLayout, drawCall,
  halt, CHIP, terminal, progChip, check, padlock, gate, person,
} from '../lib/terminal.js';
import { text, measure, rr, path, line, arrow, arrowHead, circle, typed } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { focus, ring, ringBox } from '../../../src/kit/cue.js';
import { place, rect } from '../../../src/kit/place.js';

// ——— 6-5's last picture, as coding.js has it (its last frame is this clip's first) ————————————————————
const TFONT = F.jp(500, 20); // text in the document
const MLH = 26; // a row of a call
const RLH = 24; // a row of a command's output
const VIS65 = DOC64.y + DOC64.h - 20;
const ROW0 = ['{"', 'name', '":', ' "', 'bash', '",', ' "', 'input', '":', ' {"', 'command', '":'];
const G65 = { ...G6, tool: { x: G6.tool.x, y: 350, w: G6.tool.w, h: 420 } };
const T5 = toolUseLayout(G65);
const L5 = T5.L;
const SCREEN5 = { ...T5.SCREEN, h: 200 };
const TOOL5 = L5.tool;
const TERM5 = { x: TOOL5.x + 14, y: TOOL5.y + 14, w: TOOL5.w - 28, h: 160 };
const FILES = { x: TOOL5.x + 14, y: TERM5.y + TERM5.h + 12, w: TOOL5.w - 28, h: TOOL5.y + TOOL5.h - 14 - (TERM5.y + TERM5.h + 12) };
const ASK65 = 'テストが通るように直して';
const DEFS65 = [
  ...DEFS,
  [['edit_file', F.jp(700, 17)], ['：ファイルの一部を書き換える', F.jp(500, 17)]],
  [['入力：path、old、new（元の文字と、新しい文字）', F.jp(500, 17)]],
];
const EDIT_ROWS = [
  ['{"', 'name', '":', ' "', 'edit', '_file', '",', ' "', 'input', '":'],
  [' {"', 'path', '":', ' "', 'average', '.py', '",'],
  [' "', 'old', '":', ' "', 'len', '(xs', ')', ' +', ' ', '1', '",'],
  [' "', 'new', '":', ' "', 'len', '(xs', ')"', '}}'],
];
const CALLS65 = [
  [ROW0, [' "', 'pytest', '"}}']],
  [ROW0, [' "', 'grep', ' -', 'n', " '", 'def', ' average', "'"], [' *.', 'py', '"}}']],
  [ROW0, [' "', 'cat', ' average', '.py', '"}}']],
  EDIT_ROWS,
  [ROW0, [' "', 'pytest', '"}}']],
];
const OUTS65 = [
  ['>   assert average([2, 4]) == 3', 'E   assert 4.0 == 3', '1 failed'],
  ['average.py:1:def average(xs):'],
  ['def average(xs):', '    return sum(xs) / len(xs) + 1'],
  ['average.py を書き換えました'],
  ['1 passed'],
];
// the terminal as it ends: the four commands that went to the shell, and their output
const TERM65 = [
  [['pytest'], [['>   assert average([2, 4]) == 3'], ['E   assert 4.0 == 3', 'err'], ['1 failed', 'err']]],
  [["grep -n 'def average' *.py"], [['average.py:1:def average(xs):']]],
  [['cat average.py'], [['def average(xs):'], ['    return sum(xs) / len(xs) + 1']]],
  [['pytest'], [['1 passed', 'ok']]],
].flatMap(([[cmd], outs]) => [
  { s: cmd, cmd: true, show: -10, type: -10 },
  ...outs.map(([s, kind]) => ({ s, err: kind === 'err', ok: kind === 'ok', show: -10 })),
]);
const ANS65 = 'average.py の「+ 1」を消して、\nテストが通るように直しました。';
const NOTE65 = '依頼、コード、テスト、コマンド、出力、答え、edit_file の定義は説明のための例';
const FFONT = F.mono(500, 14);
const AVG = ['def average(xs):', '    return sum(xs) / len(xs)', ' + 1'];
const TEST = ['def test_average():', '    assert average([2, 4]) == 3'];
const NOT_CHECKED = '空のリストのときなどは、確かめていない';
const FY = { title: 22, avgName: 50, avg: [70, 89], testName: 118, test: [138, 157], note: [182, 202] };
const FX = FILES.x + 16;
const STEPS65 = [
  ['テストを動かす', 'pytest'],
  ['ファイルを探す', 'grep'],
  ['中身を読む', 'cat'],
  ['コードを直す', 'edit_file'],
  ['テストをもう一度', 'pytest'],
];
const COL65 = { x: 84, head: 590, top: 606, step: 37, h: 30, w: 268 };
const CARD65 = { x: 30, y: 46, w: 336, h: 306 };

// ——— this clip's layout: the app's frame narrower, the chat screen shorter, the tool's place wider ——————
const G66 = {
  llm: G5.llm,
  app: { x: G5.app.x, y: G5.app.y, w: 580, h: G5.app.h },
  tool: { x: 1050, y: 336, w: 454, h: 384 },
};
const T6 = toolUseLayout(G66);
const L6 = T6.L;
const ACT6 = T6.ACT;
const DOC6 = L6.doc;
const TOOL6 = L6.tool;
const CHAT = { ...T6.SCREEN, h: 190 };
const VIS = DOC6.y + DOC6.h - 20; // the LLM's tokens run under the entry they write, inside the frame
const mixBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
const mixG = (a, b, p) => ({ llm: mixBox(a.llm, b.llm, p), app: mixBox(a.app, b.app, p), tool: mixBox(a.tool, b.tool, p) });

// ——— the screen in the tool's place: a computer's display showing a booking page (an example) ——————————
// The page is drawn in its own units (PW × PH); the picture the tools take measures PIX pixels per unit,
// so the positions the LLM writes are these units × PIX.
const PW = 408;
const PH = 304;
const PIX = 3;
const P = {
  head: 34,
  lx: 22,
  fx: 104, fw: 200, fh: 34,
  rows: { date: 52, time: 98, room: 144 },
  btn: { x: 104, y: 192, w: 120, h: 38 },
  done: { x: 236, y: 192, w: 156, h: 38 },
  bar: 272,
};
const CENTER = {
  date: { x: P.fx + P.fw / 2, y: P.rows.date + P.fh / 2 },
  time: { x: P.fx + P.fw / 2, y: P.rows.time + P.fh / 2 },
  button: { x: P.btn.x + P.btn.w / 2, y: P.btn.y + P.btn.h / 2 },
};
const REST = { x: 330, y: 246 }; // where the pointer rests before anything is done
const TOOLROW = { x: TOOL6.x + 14, y: TOOL6.y + 12 }; // the three tools' chips
const MON = { x: TOOL6.x + 14, y: TOOL6.y + 50, w: PW + 18, h: PH + 18 }; // the display
const PG = { x: MON.x + 9, y: MON.y + 9 }; // the page on it
const FENCE = { x: TOOL6.x - 7, y: TOOL6.y - 7, w: TOOL6.w + 14, h: TOOL6.h + 14 }; // a place apart (l)
const SVC = { x: TOOL6.x + 46, y: FENCE.y + FENCE.h + 24, w: 300, h: 54 }; // the booking service, outside (l2)
const NET_X = SVC.x + 27; // the line from the computer out to the service
const BAR_APPS = ['ブラウザ', 'メール', 'ファイル']; // the computer's apps (l: all but the browser are locked)

// ——— above the LLM: the picture the LLM reads, enlarged (d–f2) ————————————————————————————————————
const CARD = { x: 30, y: 46, w: 336, h: 300 };
const MS = 0.7; // its scale
const MAG = { x: CARD.x + 15, y: CARD.y + 44 };
const TH = 40 / PH; // a picture in the document

// ——— this clip's conversation (an example) ——————————————————————————————————————————————————————
const ASK = '10月20日14時で、会議室を予約して';
const DEFS6 = [
  [['screenshot', F.jp(700, 17)], ['：画面を写した画像を返す', F.jp(500, 17)]],
  [['click', F.jp(700, 17)], ['：位置（x、y）をクリックする', F.jp(500, 17)]],
  [['type', F.jp(700, 17)], ['：文字（text）を打ち込む', F.jp(500, 17)]],
];
const ROW_CLICK = ['{"', 'name', '":', ' "', 'click', '",', ' "', 'input', '":'];
const ROW_TYPE = ['{"', 'name', '":', ' "', 'type', '",', ' "', 'input', '":'];
const at3 = (n) => String(Math.round(n * PIX));
const clickRow = (k) => [' {"', 'x', '":', ' ', at3(CENTER[k].x), ',', ' "', 'y', '":', ' ', at3(CENTER[k].y), '}}'];
// the LLM's six calls, row by row, as o200k_base cuts them (12, 21, 17, 21, 17 and 21 tokens; none splits a character)
const CALLS = [
  { rows: [['{"', 'name', '":', ' "', 's', 'creenshot', '",'], [' "', 'input', '":', ' {', '}}']], op: 'shot', chip: 'screenshot' },
  { rows: [ROW_CLICK, clickRow('date')], op: 'click', key: 'date', chip: 'click' },
  { rows: [ROW_TYPE, [' {"', 'text', '":', ' "', '10', '/', '20', '"}}']], op: 'type', key: 'date', s: '10/20', chip: 'type' },
  { rows: [ROW_CLICK, clickRow('time')], op: 'click', key: 'time', chip: 'click' },
  { rows: [ROW_TYPE, [' {"', 'text', '":', ' "', '14', ':', '00', '"}}']], op: 'type', key: 'time', s: '14:00', chip: 'type' },
  { rows: [ROW_CLICK, clickRow('button')], op: 'click', key: 'button', chip: 'click' },
];
// the screen after each operation, as the picture the app takes of it
const SHOTS = [
  {},
  { focus: 'date' },
  { focus: 'date', date: '10/20' },
  { focus: 'time', date: '10/20' },
  { focus: 'time', date: '10/20', time: '14:00' },
  { date: '10/20', time: '14:00', done: 1, locks: 1 },
];
const NOTE = '依頼、予約の画面、ツールの定義、操作の書き方は説明のための例（2024 年の API の形ではない）';

// ——— how fast a round goes: the first two slowly, the next ones faster
const SLOW = { fly: 0.55, read: 0.9, tok: 0.42, eot: 0.5, step: 0.3, go: 0.6, act: 0.6, shot: 0.35, back: 0.65 };
const MID = { fly: 0.5, read: 0.8, tok: 0.36, eot: 0.42, step: 0.25, go: 0.5, act: 0.6, shot: 0.3, back: 0.55 };
const FAST = { fly: 0.25, read: 0.3, tok: 0.26, eot: 0.2, step: 0.08, go: 0.28, act: 0.35, shot: 0.15, back: 0.32 };

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n times, evenly from a, the last one landing (after a flight of fly) by b
const times = (n, a, b, fly) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - fly - a)) / Math.max(1, n - 1));
// a call's token times: the first nPre from a, then the rest from wAt, landing by wEnd
function callTimes(nPre, nW, a, wAt, wEnd, fly) {
  const pre = times(nPre, a, Math.max(wAt + fly - 0.05, a + nPre * 0.04 + fly), fly);
  const w0 = Math.max(wAt, pre[pre.length - 1] + 0.05);
  return [...pre, ...times(nW, w0, Math.max(wEnd, w0 + nW * 0.05 + fly), fly)];
}
// after the call is written: the app stops the LLM and passes the call on, the tool acts on the screen, the
// app takes a picture of it, the picture comes back and is written in
function follow(r, o = {}) {
  const sp = r.sp;
  r.fin = r.tok[r.tok.length - 1] + sp.tok;
  r.stop = r.fin + sp.eot;
  r.go = Math.max(r.stop + sp.step, o.go ?? 0);
  r.work = r.go + sp.go;
  r.acted = r.work + (r.op === 'shot' ? 0 : sp.act);
  r.shot = Math.max(r.acted + 0.05, o.shot ?? 0);
  r.back = Math.max(r.shot + sp.shot, o.back ?? 0);
  r.resMark = r.back + sp.back * 0.35;
  r.resIn = r.back + sp.back;
  r.done = r.resIn + 0.35;
  return r;
}

export default clip({
  id: 'gui',
  title: '画面を操作する',
  kicker: 'コンピュータ操作',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 1.2, // 6-5's conversation, column, card, shell and files clear away, then the screen's place grows
  script: [
    { id: 'a', text: 'ソフトやサービスの中には、{human}人が画面で操作するようにしか、\n{only}作られていないものもあるわ。' },
    { id: 'b', text: 'そこで、{cap}画面を画像に写したり、{mouse}マウスやキーボードを\n操作したりするプログラムを、{tool}ツールとしてつなぐの。' },
    { id: 'b2', tail: 0.8, rest: 'short', text: 'たとえば、{ask}「10 月 20 日 14 時で、会議室を[予約して」と|よやくしてと]\n頼んだとしましょう。' },
    { id: 'c', lead: 1.6, tail: 0.6, text: '{shot}画面を写すツールからは、\n{now}そのときの画面の画像が{back}返ってくるわ。' },
    { id: 'd', text: '{model}画面の操作に対応したモデルに、{read}その画像を読ませて、\n{pos}ボタンや入力欄の位置を{judge}判断させるの。' },
    { id: 'd2', still: true, text: '{miss}位置を[読み違える|よみちがえる]こともあるわ。' },
    { id: 'e', tail: 0.5, text: '{optool}操作のツールには、{where}どこをクリックするか、\n{what}何を入力するかを、{llm}LLM に指示させましょう。' },
    { id: 'f', tail: 0.8, text: '{run}アプリが操作を実行したら、{shot2}また画面を画像にして、\n{pass}LLM に渡すわ。' },
    { id: 'f2', tail: 0.6, text: '{see}その画像を見て、{next}次の操作を選ばせるの。' },
    { id: 'g', lead: 1.6, tail: 1.9, still: true, text: 'こうして、{job}会議室の予約のような、\n{people}人のための画面での仕事も、{go}進められるわね。' },
    { id: 'h', text: '{y24}2024 年 10 月、{anth}Anthropic は、{tool2}こうした画面の操作のための\nツールを、{beta}公開のベータとして出したわ。' },
    { id: 'i', text: '{task}画面を操作する課題を集めた試験の一つが、{osw}[OSWorld|オーエスワールド] よ。' },
    { id: 'i2', text: '{then}そのときのモデルは、{img}画面の画像だけを使い、\n{n15}[15 回|じゅうごかい]までの操作で、{p15}[約 15%|やくじゅうごぱーせんと] の課題を解いたわ。' },
    { id: 'i3', still: true, text: '{hum}人は、元の論文の調べで{p72}[約 72%|やくななじゅうにぱーせんと] だったけれど、\n{cond}条件は同じではないわね。' },
    { id: 'j', text: 'その後、{ver}課題や採点を見直した、\n{name}[OSWorld-Verified|オーエスワールドベリファイド] という版も公開されたわ。' },
    { id: 'j1', text: '{tab}2026 年 8 月の公式の表では、\n{p86}[約 86%|やくはちじゅうろっぱーせんと] という得点も報告されているの。' },
    { id: 'j2', still: true, text: 'ただし、{diff}試験の版も条件も違うので、\n{cmp}さっきの [15%|じゅうごぱーせんと] とは、そのまま比べられないわ。' },
    { id: 'k', by: 'zunda', text: '{mine}ボクのパソコンを、{auto}勝手に操作されたら困るのだ。' },
    { id: 'l', still: true, text: 'だから、{env}操作させる環境を、{cut}ふだんのパソコンから切り離して、\n{limit}使えるものも絞ることが勧められているの。' },
    { id: 'l2', lead: 1.6, tail: 3.0, still: true, text: '{fix}予約の確定のように、{out}外に影響する操作は、\n{ask2}人に確かめさせることも大切ね。' },
    { id: 'm', text: '次の章では、{around}LLM のまわりで働く、\n{app}このアプリのことを、もっとくわしく見ていきましょう。' },
  ],

  prepare(ctx) {
    const opts = { ...T64.DOC, font: TFONT, lh: 28 };
    const one = (L0, e, yy) => docLayout(ctx, L0, [e], { ...opts, top: yy - L0.doc.y })[0];
    const old = prepare65(ctx, one);

    // ——— this clip's document: the head (the three tools), the request, six calls with the pictures that came back
    const defs = DEFS6.map((row) => {
      let x = DX;
      const segs = row.map(([s, font]) => {
        const w = measure(ctx, font, s);
        const out = { s, font, x, w, n: Array.from(s).length };
        x += w;
        return out;
      });
      return { segs, right: x, n: segs.reduce((n, sg) => n + sg.n, 0) };
    });
    defs.forEach((d, k) => { if (d.right > DOC6.x + DOC6.w - 18) throw new Error(`gui: definition row ${k} is too wide`); });
    let y = defY(DEFS6.length - 1) + 28;
    const U = one(L6, { role: 'user', text: ASK }, y);
    if (U.rows.length !== 1) throw new Error('gui: the request takes more than a row');
    y = U.y + U.h + 12;
    const calls = CALLS.map(({ rows }, k) => {
      const c = callLayout(ctx, { x: DX, y, w: U.w, h: rows.length * MLH + 16 }, rows, MLH, { hang: true });
      if (c.end.x + c.end.w > c.band.x + c.band.w - 6) throw new Error(`gui: call ${k + 1}'s end mark does not fit`);
      c.toks.forEach((tk) => { if (tk.x + tk.w > c.band.x + c.band.w - 6) throw new Error(`gui: call ${k + 1} is too wide`); });
      y = c.band.y + c.band.h + 10;
      const R = one(L6, { role: 'result', kind: 'data', text: ' ', lh: 38 }, y);
      y = R.y + R.h + 12;
      return { c, R };
    });
    // the position the LLM writes in its first click, where it lands in the call (tokens 13 and 19)
    const num = (c, i) => ({ x: c.toks[i].x, y: c.toks[i].y - 13, w: c.toks[i].w, h: 20 });
    const xy = [num(calls[1].c, 13), num(calls[1].c, 19)];
    // the screen: the request, then (l2) the app's question
    const [Bq] = screenBubbles(ctx, CHAT, [['user', ASK]], { font: F.jp(500, 15), gap: 12 });
    const dlg = { x: CHAT.x + 20, y: Bq.y + Bq.L.h + 10, w: 340, h: 64 };
    if (dlg.y + dlg.h > CHAT.y + CHAT.h - 6) throw new Error(`gui: the question does not fit the screen (${dlg.y + dlg.h})`);
    // the tools' chips
    const cw = (n) => measure(ctx, CHIP.font, n) + CHIP.padX * 2;
    let cx = TOOLROW.x;
    const chips = ['screenshot', 'click', 'type'].map((n) => {
      const b = { n, x: cx, y: TOOLROW.y, w: cw(n), h: CHIP.h };
      cx += b.w + 8;
      return b;
    });
    // the picture the LLM reads: where it judges the parts are, the position it writes, a part read wrong (d2)
    const part = (x, y0, w, h) => ({ x: MAG.x + x * MS - 3, y: MAG.y + y0 * MS - 3, w: w * MS + 6, h: h * MS + 6 });
    const frames = {
      date: part(P.fx, P.rows.date, P.fw, P.fh),
      time: part(P.fx, P.rows.time, P.fw, P.fh),
      room: part(P.fx, P.rows.room, P.fw, P.fh),
      button: part(P.btn.x, P.btn.y, P.btn.w, P.btn.h),
    };
    const missed = { ...frames.button, x: frames.button.x + 22, y: frames.button.y + 9 };
    const shapes = Object.values(frames).map((b) => rect(b.x, b.y, b.w, b.h));
    const xyFont = F.mono(600, 13);
    const xyText = `(${at3(CENTER.date.x)}, ${at3(CENTER.date.y)})`;
    const xyW = measure(ctx, xyFont, xyText) + 12;
    const fd = frames.date;
    const xyAt = place({ x: fd.x + fd.w, y: fd.y + fd.h / 2 }, { x: 1, y: 0 }, { w: xyW, h: 22 }, shapes, { gap: 4, to: 140 });
    if (xyAt.box.x + xyAt.box.w > CARD.x + CARD.w - 6) throw new Error('gui: the position does not fit the card');
    const missFont = F.jp(700, 12);
    const missText = '読み違え（例）';
    const missW = measure(ctx, missFont, missText) + 14;
    const missAt = place({ x: missed.x + missed.w, y: missed.y + missed.h / 2 }, { x: 1, y: 0 }, { w: missW, h: 22 }, [...shapes, rect(missed.x, missed.y, missed.w, missed.h)], { gap: 6, to: 140 });
    if (missAt.box.x + missAt.box.w > CARD.x + CARD.w - 6) throw new Error('gui: the wrong reading\'s tag does not fit the card');
    return { old, defs, U, calls, xy, Bq, dlg, chips, frames, missed, xyAt, xyText, xyFont, missAt, missText, missFont };
  },

  draw(ctx, t, s, { at, pace }) {
    const { old, defs, U, calls, xy, Bq, dlg, chips } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 6-5's picture clears away, then the frame, the screen and the tool's place move to this clip's places
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.5));
    const gp = inOutCubic(seg(t, br * 0.45, br));
    const fresh = inOutCubic(seg(t, br * 0.6, br));
    const Tb = toolUseLayout(mixG(G65, G66, gp));
    const Lb = Tb.L;
    const screen = { ...Tb.SCREEN, h: lerp(SCREEN5.h, CHAT.h, gp) };

    // ——— when things happen
    // a: the screen made for people; b: the tools that take its picture and work it, and their definitions
    const monA = tw(t, at('a') + 0.05, pace.ground);
    const defAt = at('tool') - lead;
    const defP = (k) => seg(t, defAt + 0.15 + k * 0.4, defAt + 0.15 + k * 0.4 + 0.5);
    // b2: the request
    const askAt = at('ask') - lead;
    const userAt = askAt + 0.45;
    const userIn = userAt + SLOW.fly;
    // c–g, l2: six rounds; each, the app writes the assistant's mark and has the LLM read, the LLM writes a
    // call, the app stops it and has the tool act on the screen, takes its picture and writes the picture in
    const r1 = { sp: SLOW, ...CALLS[0], mark: userIn + 0.25 };
    r1.read = r1.mark + SLOW.fly - 0.1;
    r1.wrote = r1.read + SLOW.read;
    r1.open = r1.wrote;
    r1.tok = times(12, r1.open + SLOW.eot - 0.15, Math.max(at('shot') - 0.95, r1.open + 1.6), SLOW.tok);
    follow(r1, { go: at('shot') - 0.15, shot: at('now') - 0.1, back: at('back') - 0.5 });
    const r2 = { sp: SLOW, ...CALLS[1], mark: Math.max(r1.done, at('read') - 0.8) };
    r2.read = Math.max(r2.mark + SLOW.fly - 0.1, at('read') - 0.15);
    r2.wrote = r2.read + SLOW.read;
    r2.open = Math.max(r2.wrote, at('e') + 0.05);
    r2.tok = callTimes(13, 8, r2.open + SLOW.eot - 0.15, at('where') + 0.05, at('llm') - 0.25, SLOW.tok);
    follow(r2, { go: at('run') - 0.1, shot: at('shot2') - 0.1, back: at('pass') - 0.5 });
    const r3 = { sp: MID, ...CALLS[2], mark: r2.done };
    r3.read = r3.mark + MID.fly - 0.1;
    r3.wrote = r3.read + MID.read;
    r3.open = Math.max(r3.wrote, at('next') - 0.45);
    r3.tok = callTimes(13, 4, r3.open + MID.eot - 0.15, at('next') + 0.35, at('f2.end') + 0.05, MID.tok);
    follow(r3);
    const fastRound = (k, mark, n) => {
      const r = { sp: FAST, ...CALLS[k], mark };
      r.read = r.mark + FAST.fly - 0.1;
      r.wrote = r.read + FAST.read;
      r.open = r.wrote;
      r.tok = times(n, r.open + 0.1, r.open + 0.5 + FAST.tok, FAST.tok);
      return r;
    };
    // (a fast round begins as the picture before it is being written in)
    const r4 = follow(fastRound(3, r3.resIn + 0.1, 21));
    const r5 = follow(fastRound(4, r4.resIn + 0.1, 17));
    // l2: the last click, on 予約する, waits for a person to confirm it; the booking reaches the service first
    const r6 = fastRound(5, at('l2') + 0.05, 21);
    const press = at('l2.end') + 0.35;
    follow(r6, { go: press + 0.2 });
    r6.shot = Math.max(r6.shot, r6.acted + 0.6);
    r6.back = r6.shot + FAST.shot;
    r6.resMark = r6.back + FAST.back * 0.35;
    r6.resIn = r6.back + FAST.back;
    r6.done = r6.resIn + 0.35;
    const rounds = [r1, r2, r3, r4, r5, r6];
    const landed = (r, k) => t >= r.tok[k] + r.sp.tok;
    const callLanded = (c, r) => c.toks.reduce((n, _, k) => (landed(r, k) ? k + 1 : n), 0);

    // the document scrolls when what comes next would pass its foot
    let need = 0;
    let sy = 0;
    calls.flatMap(({ c, R }, k) => [[rounds[k].mark, c.band.y + c.band.h], [rounds[k].resMark, R.y + R.h]]).forEach(([when, bottom]) => {
      const to = Math.max(need, bottom - VIS);
      if (to > need) sy += (to - need) * inOutCubic(seg(t, when - 0.5, when - 0.05));
      need = to;
    });

    // ——— the screen, as it is at t
    let cur = REST;
    [[r2, CENTER.date], [r4, CENTER.time], [r6, CENTER.button]].forEach(([r, q]) => {
      const m = inOutCubic(seg(t, r.work, r.work + r.sp.act * 0.8));
      if (m > 0) cur = { x: lerp(cur.x, q.x, m), y: lerp(cur.y, q.y, m) };
    });
    const live = {
      focus: t >= r6.acted ? null : t >= r4.acted ? 'time' : t >= r2.acted ? 'date' : null,
      date: typed('10/20', seg(t, r3.work, r3.acted)),
      time: typed('14:00', seg(t, r5.work, r5.acted)),
      done: tw(t, r6.acted + 0.05, 0.3),
      press: span(t, r6.acted - 0.15, r6.acted + 0.1, 0.08, 0.2),
      locks: pop('limit'),
      caret: t >= r3.work && t < r3.acted + 0.4 ? 'date' : t >= r5.work && t < r5.acted + 0.4 ? 'time' : null,
    };
    const clicks = [r2, r4, r6].map((r) => seg(t, r.acted - 0.05, r.acted + 0.4));
    const flash = Math.max(...rounds.map((r) => Math.sin(Math.PI * seg(t, r.shot - 0.05, r.shot + 0.25))));
    const chipLit = [
      Math.max(...rounds.map((r) => span(t, r.shot - 0.15, r.shot + 0.3, 0.1, 0.25))),
      Math.max(...[r2, r4, r6].map((r) => span(t, r.work - 0.05, r.acted, 0.1, 0.25))),
      Math.max(...[r3, r5].map((r) => span(t, r.work - 0.05, r.acted, 0.1, 0.25))),
    ];

    // ——— who is at work
    const actGlow = Math.max(
      span(t, defAt, defAt + 1.6),
      span(t, userAt - 0.1, userIn),
      ...rounds.map((r) => span(t, r.mark, r.wrote)),
      ...rounds.map((r) => span(t, r.stop, Math.min(r.done, r.stop + 2) - 0.2)),
      span(t, r6.go - 0.2, r6.done - 0.2),
    );
    const llmGlow = Math.max(
      ...rounds.map((r) => span(t, r.read + 0.25, r.wrote)),
      ...rounds.map((r) => span(t, r.open - 0.1, r.stop)),
    );
    const writing = rounds.some((r) => t >= r.open && t < r.stop);

    // ——— the rings: what the voice points at
    const [onlyLit] = lit(['only'], at('a.end'));
    const [shotLit, backLit] = lit(['shot', 'back'], at('c.end'));
    const [modelLit] = lit(['model'], at('read'));
    const [optLit, whereLit, whatLit] = lit(['optool', 'where', 'what'], at('llm'));
    const [jobLit, peopleLit] = lit(['job', 'people'], at('go'));
    const [tool2Lit] = lit(['tool2'], at('beta'));
    const [cmpLit] = lit(['cmp'], at('j2.end'));
    const [mineLit] = lit(['mine'], at('k.end'));
    const [envLit] = lit(['env'], at('cut'));
    const [fixLit, outLit, askLit] = lit(['fix', 'out', 'ask2'], at('l2.end'));
    const [aroundLit, appLit] = lit(['around', 'app'], at('m.end'));

    // ——— the chat screen: 6-5's conversation leaves, this one comes in
    chatScreen(ctx, screen, 1);
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      chatBubble(ctx, old.Bs[0], { alpha: 1 });
      chatBubble(ctx, old.Bs[1], { alpha: 1, chars: 1 });
      ctx.restore();
    }
    chatBubble(ctx, Bq, { alpha: tw(t, askAt, 0.35) });
    dialog(ctx, dlg, { a: pop('ask2'), pressed: tw(t, press, 0.2), tap: seg(t, press - 0.05, press + 0.45), ring: askLit });
    screenLinks(ctx, Tb, {
      talk: 1,
      back: 1,
      talkHot: Math.max(span(t, askAt + 0.05, askAt + 0.8), span(t, press, press + 0.6)) > 0.5,
      backHot: span(t, at('ask2') - lead, at('ask2') + 0.6) > 0.5,
    });

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, Lb, 1, { name: '' });
    llmBlock(ctx, L6, 1, { glow: llmGlow });
    ring(ctx, L6.llm.x, L6.llm.y, L6.llm.w, L6.llm.h, Math.max(modelLit, aroundLit), C.accent, 22);
    channel(ctx, L6.read, 1, { hot: rounds.some((r) => span(t, r.read, r.wrote) > 0.5) });
    channel(ctx, L6.write, 1, { hot: llmGlow > 0.5 && writing });
    const linkLit = span(t, defAt, defAt + 1.2) > 0.5;
    channel(ctx, Lb.call, 1, { labelAlpha: 1, hot: linkLit || rounds.some((r) => span(t, r.go, r.work) > 0.5) });
    channel(ctx, Lb.back, 1, { labelAlpha: 1, hot: linkLit || rounds.some((r) => span(t, r.back, r.back + r.sp.back * 0.6) > 0.5) });

    // ——— the document: 6-5's (scrolled as it ends) clears away; this one comes in (scrolled by sy, clipped to the paper)
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      drawDoc65(ctx, old);
      ctx.restore();
      if (old.sy > 0.5) paperTop(ctx, DOC64, old.sy, gone);
    }
    ctx.save();
    if (sy > 0) {
      ctx.beginPath();
      ctx.rect(DOC6.x, DOC6.y + 2, DOC6.w, DOC6.h - 4);
      ctx.clip();
      ctx.translate(0, -sy);
    }
    if (fresh > 0.001) roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system, alpha: fresh });
    defs.forEach((d, k) => drawDef(ctx, d, defY(k), defP(k)));
    // b2: the request
    if (t >= userIn) {
      docEntry(ctx, U, 1, { tagAlpha: 0, chars: tw(t, userIn - 0.05, 0.3) });
      roleMark(ctx, U.x, U.y + 1, ROLE.user, { edge: WRITER.user });
    }
    // the rounds: the call, and the picture that came back
    calls.forEach(({ c, R }, k) => {
      const r = rounds[k];
      if (t >= r.mark + r.sp.fly) roleMark(ctx, DOC6.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
      drawCall(ctx, c, { bandA: tw(t, r.open + r.sp.eot - 0.1, 0.25), open: t >= r.open + r.sp.eot, n: callLanded(c, r), end: t >= r.fin + r.sp.eot });
      if (t >= r.resMark + r.sp.fly) roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
      const oi = tw(t, r.resIn - 0.05, 0.3);
      if (oi > 0) {
        docEntry(ctx, R, oi, { tagAlpha: 0 });
        thumb(ctx, R.tx + 12, R.y + 8, SHOTS[k], oi);
        text(ctx, '画面の画像', R.tx + 12 + PW * TH + 14, R.y + R.h / 2 + 6, { font: F.jp(500, 15), color: C.ink2, alpha: oi });
      }
    });
    // e: the position the LLM writes, marked where it lands
    xy.forEach((b, i) => marker(ctx, b, tw(t, r2.tok[i ? 19 : 13] + SLOW.tok, 0.3) * (1 - tw(t, at('g'), 0.4))));
    // c: the picture that came back
    const R1 = calls[0].R;
    ringBox(ctx, { x: R1.tx, y: R1.y, w: R1.w, h: R1.h }, backLit, C.accent, 0);
    // l2: the click that waits for a person
    const C6 = calls[5].c;
    ringBox(ctx, C6.band, fixLit, C.accent, 2);
    // a cursor after the assistant's mark, while the LLM reads, until it writes
    // (when the LLM writes later, as in d–e, the cursor waits for that)
    const reading = rounds.map((r, k) => [r, calls[k].c.open]).find(([r]) => (t >= r.read && t < r.wrote + 0.2) || (t >= r.open - 0.4 && t < r.open + r.sp.eot));
    if (reading && Math.floor(t * 2.5) % 2 === 0) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(reading[1].x, reading[1].y + MARK_H - 30, 4, 30);
    }
    ctx.restore();
    if (sy > 0.5) paperTop(ctx, DOC6, sy, 1);
    // the reads: the app hands the document over
    rounds.forEach((r, k) => {
      sweep(ctx, L6, seg(t, r.read + 0.05, r.read + r.sp.read), calls[k].c.band.y - sy + MARK_H);
      send(ctx, L6.read, seg(t, r.read + 0.4 * (r.sp.read / SLOW.read), r.read + r.sp.read + 0.05), '', 'doc');
    });

    // ——— the app's box; it sees where each call ends, and stops the writing
    actor(ctx, Tb.ACT, 1, actGlow);
    ringBox(ctx, ACT6, appLit, C.accent, 4);
    rounds.forEach((r, k) => {
      const lk = span(t, r.stop - 0.05, Math.min(r.go, r.stop + 1.2) + 0.25);
      const e = calls[k].c.end;
      if (lk > 0) lookLine(ctx, { x: e.x, y: e.y - sy, w: e.w }, tw(t, r.stop - 0.05, 0.3, inOutCubic), lk);
    });
    halt(ctx, Math.max(...rounds.map((r) => span(t, r.fin + r.sp.eot - 0.05, Math.min(r.go, r.stop + 1.2) + 0.45))));
    // l2: a person confirms before the click on 予約する goes on
    const gx = (L6.call.x1 + L6.call.x2) / 2;
    const gateA = pop('ask2', 0.3);
    gate(ctx, gx, L6.call.y, gateA);
    ring(ctx, gx - 16, L6.call.y - 16, 32, 32, askLit * gateA, C.accent, 16);

    // ——— the tool's place: 6-5's shell and files clear; the screen comes in, and the tools that work it
    toolBox(ctx, Lb, 1, {
      solid: 1,
      draw: (c) => {
        if (gone > 0.001) {
          c.save();
          c.globalAlpha *= gone;
          terminal(c, t, 1, TERM65, { box: TERM5, trim: true });
          filesPanel65(c, old.files);
          c.restore();
        }
      },
    });
    const lw = text(ctx, 'ツール', Lb.tool.x, Lb.tool.y - 16, { font: F.jp(700, 22), color: C.ink });
    text(ctx, 'の場所', Lb.tool.x + lw, Lb.tool.y - 16, { font: F.jp(700, 22), color: C.ink });
    // a: made for people to see and work
    const humanA = pop('human') * (1 - tw(t, at('cap') - lead, 0.3));
    if (humanA > 0.001) {
      ctx.save();
      ctx.globalAlpha *= humanA;
      person(ctx, TOOLROW.x + 12, TOOLROW.y + 13, C.blue);
      ctx.restore();
      text(ctx, '人が見て、マウスやキーボードで操作する画面', TOOLROW.x + 30, TOOLROW.y + 19, { font: F.jp(700, 14), color: C.blue, alpha: humanA });
    }
    // b: the programs that take the picture and work the mouse and the keyboard
    const chipA = [pop('cap'), pop('mouse'), tw(t, at('mouse') - lead + pace.stagger, pace.enter)];
    chips.forEach((b, k) => progChip(ctx, b.x, b.y, b.w, 1, b.n, { a: chipA[k], lit: chipLit[k] }));
    const last = chips[2];
    text(ctx, '写す・操作するプログラム', last.x + last.w + 12, last.y + 18, { font: F.jp(500, 13), color: C.muted, alpha: tw(t, at('mouse') - lead + 0.3, pace.enter) });
    ringBox(ctx, chips.slice(1), optLit, C.accent, 3);
    ringBox(ctx, chips[1], whereLit, C.accent, 3);
    ringBox(ctx, chips[2], whatLit, C.accent, 3);
    ringBox(ctx, chips, tool2Lit, C.accent, 3);
    ringBox(ctx, chips[0], shotLit, C.accent, 3);
    // the display, the page on it, the pointer
    display(ctx, monA, live, cur, clicks, flash);
    ringBox(ctx, MON, Math.max(onlyLit, peopleLit, mineLit, envLit), C.accent, -2);
    ringBox(ctx, { x: PG.x, y: PG.y, w: PW, h: P.head }, jobLit, C.accent, 2);
    ringBox(ctx, { x: PG.x + P.btn.x, y: PG.y + P.btn.y, w: P.btn.w, h: P.btn.h }, fixLit, C.accent, 3);
    // k: and if it were mine?
    const q = pop('auto') * (1 - tw(t, at('l'), 0.4));
    if (q > 0.001) tag(ctx, TOOL6.x + TOOL6.w - 10, TOOL6.y - 14, '？', { font: F.jp(700, 16), h: 28, padX: 9, fill: C.accent, color: '#fff', r: 14, align: 'right', alpha: q });
    // l: a place apart from the everyday computer
    fence(ctx, pop('cut', 0.6));
    // l2: the booking goes out, to a service outside
    service(ctx, {
      a: tw(t, at('l2'), pace.ground),
      go: seg(t, r6.acted + 0.05, r6.acted + 0.5),
      done: tw(t, r6.acted + 0.5, 0.3),
      hot: outLit,
    });

    // ——— 6-5's column and card clear away
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      steps65(ctx);
      sweCard65(ctx);
      source(ctx, '出典：Jimenez ほか（2023）', 1, SOURCE_RIGHT);
      ctx.restore();
    }

    // ——— above the LLM: the picture the LLM reads (d–f2), then 2024 (h–i3); under it: the model (d), then 2026 (j–j2)
    const magIn = at('read') - lead;
    const magOut = tw(t, at('g'), 0.4);
    const later = 1 - seg(t, r3.read, r3.read + 0.3);
    magCard(ctx, {
      a: tw(t, magIn + 0.35, 0.4) * (1 - magOut),
      fly: inOutCubic(seg(t, magIn, magIn + 0.7)),
      from: { x: R1.tx + 12, y: R1.y + 8 - sy },
      swap: seg(t, r3.read + 0.2, r3.read + 0.6),
      frames: [0, 1, 2, 3].map((k) => tw(t, at('pos') - lead + k * pace.stagger * 2, pace.enter) * later),
      judge: pop('judge') * later,
      miss: tw(t, at('miss') - lead, 0.5) * (1 - tw(t, at('e'), 0.45)),
      xy: tw(t, r2.tok[13] + SLOW.tok, 0.3) * later,
      see: pop('see'),
      out: magOut,
    }, s);
    tag(ctx, T6.NOTE.x, T6.NOTE.y[0], '画面の操作に対応したモデル', { font: F.jp(700, 15), h: 30, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center', alpha: pop('model') });
    card2024(ctx, {
      a: tw(t, at('h'), pace.ground),
      y24: pop('y24'), anth: pop('anth'), beta: pop('beta'),
      task: pop('task'), osw: pop('osw'),
      then: pop('then'), img: pop('img'), n15: pop('n15'), p15: pop('p15'),
      hum: pop('hum'), p72: pop('p72'), cond: pop('cond'),
      ring: cmpLit,
    });
    card2026(ctx, {
      a: tw(t, at('j'), pace.ground),
      ver: pop('ver'), name: pop('name'), tab: pop('tab'), p86: pop('p86'),
      diff: pop('diff'), cmp: pop('cmp'),
      ring: cmpLit,
    });

    // ——— m: chapter 7 looks at the app
    tag(ctx, ACT6.x - 22, ACT6.y + ACT6.h / 2 - 15, '7 章　ハーネス', { font: F.jp(700, 15), h: 30, padX: 11, fill: C.ink, color: C.paper, align: 'right', alpha: tw(t, at('app') - lead, pace.enter, (p) => outBack(p, 1.4)) });

    // ——— in flight, over everything
    flyMark(ctx, T6, U, seg(t, userAt, userIn), ROLE.user, { edge: WRITER.user, dy: -sy });
    calls.forEach(({ c, R }, k) => {
      const r = rounds[k];
      const sp = r.sp;
      flyMark(ctx, T6, { x: DOC6.x + 18, y: c.band.y }, seg(t, r.mark, r.mark + sp.fly), ROLE.assistant, { edge: WRITER.assistant, dy: -sy });
      const lane = { y: c.band.y, h: c.band.h };
      const po = seg(t, r.open, r.open + sp.eot);
      if (po > 0 && po < 1) {
        const pt = onPath(writePath(T6, lane, c.open.x + c.open.w / 2, c.open.y + MARK_H / 2, -sy), inOutCubic(po));
        roleMark(ctx, pt.x - c.open.w / 2, pt.y - MARK_H / 2, ROLE.call, { edge: WRITER.call, alpha: clamp(po * 8) });
      }
      c.toks.forEach((tk, j) => {
        const p = seg(t, r.tok[j], r.tok[j] + sp.tok);
        if (p <= 0 || p >= 1) return;
        const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
        const pt = onPath(writePath(T6, lane, tk.x + tk.w / 2, tk.y, -sy), inOutCubic(p));
        token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
      });
      const pe = seg(t, r.fin, r.fin + sp.eot);
      if (pe > 0 && pe < 1) {
        const pt = onPath(writePath(T6, lane, c.end.x + c.end.w / 2, c.end.y + MARK_H / 2, -sy), inOutCubic(pe));
        roleMark(ctx, pt.x - c.end.w / 2, pt.y - MARK_H / 2, ROLE.callEnd, { edge: WRITER.callEnd, alpha: clamp(pe * 8) });
      }
      const band = { tx: c.band.x, w: c.band.w, y: c.band.y, h: c.band.h };
      chipGo(ctx, seg(t, r.go, r.go + sp.go), toTool(T6, band, -sy), r.chip, 'call');
      const bp = seg(t, r.back, r.back + sp.back);
      chipGo(ctx, bp < 1 ? bp : 0.999, fromTool(T6, R, -sy, R.tx + 120), '画像', 'found', bp < 1 ? null : 1 - tw(t, r.resIn - 0.05, 0.25));
      flyMark(ctx, T6, R, seg(t, r.resMark, r.resMark + sp.fly), ROLE.result, { edge: WRITER.result, dy: -sy });
    });

    // ——— the example's note (6-5's gives way)
    const ex = { x: L6.app.x, y: L6.app.y + L6.app.h + 22 };
    const exW = measure(ctx, F.jp(700, 17), '例') + 20;
    example(ctx, ex.x, ex.y, 1, '');
    text(ctx, NOTE65, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: gone });
    text(ctx, NOTE, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: fresh });
  },
});

// ——— 6-5's picture as it ends (coding.js, at its duration) ————————————————————————————————————————

function prepare65(ctx, one) {
  const defs = defRows(ctx, DEFS65);
  let y = defY(3) + 28;
  const U = one(L64, { role: 'user', text: ASK65 }, y);
  y = U.y + U.h + 12;
  const calls = CALLS65.map((rows, k) => {
    const c = callLayout(ctx, { x: DX, y, w: U.w, h: rows.length * MLH + 16 }, rows, MLH, { hang: true });
    y = c.band.y + c.band.h + 10;
    const R = one(L64, { role: 'result', kind: 'data', text: OUTS65[k].join('\n'), font: MFONT, lh: RLH }, y);
    y = R.y + R.h + 12;
    return { c, R };
  });
  const A = one(L64, { role: 'assistant', text: ANS65, lh: 30 }, y + 2);
  const aRow = rowAt(A, 1);
  const aEnd = { x: aRow.x + measure(ctx, A.font, A.rows[1]) + 14, y: aRow.y - 21, w: markWidth(ctx, ROLE.end.name) };
  const inOut = (R, row, part, before) => {
    const p = rowAt(R, row);
    return { x: p.x + measure(ctx, R.font, before), y: p.y - 15, w: measure(ctx, R.font, part), h: 20 };
  };
  const inCall = (c, i0, i1) => {
    const a = c.toks[i0];
    const b = c.toks[i1];
    const x0 = a.x + (a.s.startsWith(' ') ? measure(ctx, MFONT, ' ') : 0);
    return { x: x0, y: a.y - 13, w: b.x + b.w - x0, h: 20, row: a.row };
  };
  const rowEnd = (c, row) => Math.max(...c.toks.filter((tk) => tk.row === row).map((tk) => tk.x + tk.w));
  const spans = {
    average: inOut(calls[0].R, 0, 'average', '>   assert '),
    four: inOut(calls[0].R, 1, '4.0', 'E   assert '),
    defAvg: inCall(calls[1].c, 17, 18),
    file: inOut(calls[1].R, 0, 'average.py', ''),
    catFile: inCall(calls[2].c, 14, 15),
    plus: inOut(calls[2].R, 1, '+ 1', '    return sum(xs) / len(xs) '),
    oldPlus: inCall(calls[3].c, 24, 26),
  };
  const outEnd = (R, row) => ({ x: rowAt(R, row).x + measure(ctx, MFONT, OUTS65[calls.findIndex((q) => q.R === R)][row]) + 8, y: rowAt(R, row).y - 5 });
  const inEnd = (c, row) => (row === c.toks[c.toks.length - 1].row ? c.end.x + c.end.w + 10 : rowEnd(c, row) + 8);
  const links = [
    { from: outEnd(calls[0].R, 0), to: { x: inEnd(calls[1].c, 1), y: spans.defAvg.y + 10 } },
    { from: outEnd(calls[1].R, 0), to: { x: inEnd(calls[2].c, 1), y: spans.catFile.y + 10 } },
    { from: outEnd(calls[2].R, 1), to: { x: inEnd(calls[3].c, 2), y: spans.oldPlus.y + 10 } },
  ];
  const laneX = calls[0].c.band.x + calls[0].c.band.w - 14;
  // the scroll 6-5 ends with: as far as its lowest entry passes the foot
  const bottoms = [...calls.flatMap(({ c, R }) => [c.band.y + c.band.h, R.y + R.h]), A.y + A.h];
  const sy = Math.max(0, ...bottoms.map((b) => b - VIS65));
  const Bs = screenBubbles(ctx, SCREEN5, [['user', ASK65], ['assistant', ANS65]], { font: F.jp(500, 15), gap: 12 });
  const fw = (str) => measure(ctx, FFONT, str);
  const files = { plusX: FX + fw(AVG[1]), plusW: fw(AVG[2]), chipW: measure(ctx, CHIP.font, 'edit_file') + CHIP.padX * 2 };
  return { defs, U, calls, A, aEnd, spans, links, laneX, sy, Bs, files };
}

function drawDoc65(ctx, o) {
  ctx.save();
  if (o.sy > 0) {
    ctx.beginPath();
    ctx.rect(DOC64.x, DOC64.y + 2, DOC64.w, DOC64.h - 4);
    ctx.clip();
    ctx.translate(0, -o.sy);
  }
  roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
  o.defs.forEach((d, k) => drawDef(ctx, d, defY(k), 1));
  docEntry(ctx, o.U, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.U.x, o.U.y + 1, ROLE.user, { edge: WRITER.user });
  o.calls.forEach(({ c, R }) => {
    roleMark(ctx, DOC64.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    drawCall(ctx, c, { bandA: 1, open: true, n: c.toks.length, end: true });
    roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
    docEntry(ctx, R, 1, { tagAlpha: 0, chars: 1 });
  });
  const sp = o.spans;
  [sp.average, sp.four, sp.defAvg, sp.file, sp.catFile, sp.plus, sp.oldPlus].forEach((b) => marker(ctx, b, 1));
  o.links.forEach((ln) => link(ctx, ln, o.laneX, 1));
  roleMark(ctx, o.A.x, o.A.y + 1, ROLE.assistant, { edge: WRITER.assistant });
  docEntry(ctx, o.A, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.aEnd.x, o.aEnd.y, ROLE.end, { edge: WRITER.end });
  ctx.restore();
}

// From the end of an output's row, by the bands' right edge, to the end of the next call's row.
function link(ctx, ln, x, p) {
  if (p <= 0.001) return;
  const { from, to } = ln;
  const r = 8;
  const pts = [[from.x, from.y], [x - r, from.y], [x, from.y + r], [x, to.y - r], [x - r, to.y], [to.x + 6, to.y]];
  ctx.save();
  ctx.strokeStyle = C.accent;
  ctx.fillStyle = C.accent;
  ctx.lineWidth = 2.2;
  const end = path(ctx, pts, p);
  if (end && p > 0.97) arrowHead(ctx, to.x, to.y, Math.PI, 10);
  ctx.restore();
}

// A round's number: an ink disc.
function badgeN(ctx, x, y, str, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  text(ctx, str, x, y + 1, { font: F.sans(700, 13), color: '#fff', align: 'center', base: 'middle', alpha: a });
}

// 6-5's files as they end: average.py fixed, the test passed, what it checks and what it does not.
function filesPanel65(ctx, f) {
  const b = FILES;
  const y = (k) => b.y + k;
  ctx.save();
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'ファイル', b.x + 12, y(FY.title), { font: F.jp(700, 15), color: C.ink2 });
  text(ctx, 'average.py', b.x + 12, y(FY.avgName), { font: F.mono(600, 13), color: C.ink2 });
  text(ctx, 'test_average.py', b.x + 12, y(FY.testName), { font: F.mono(600, 13), color: C.ink2 });
  text(ctx, AVG[0], FX, y(FY.avg[0]), { font: FFONT, color: C.ink });
  text(ctx, AVG[1], FX, y(FY.avg[1]), { font: FFONT, color: C.ink });
  text(ctx, TEST[0], FX, y(FY.test[0]), { font: FFONT, color: C.ink });
  text(ctx, TEST[1], FX, y(FY.test[1]), { font: FFONT, color: C.ink });
  ctx.save();
  ctx.fillStyle = C.muted;
  ctx.fillRect(b.x + 6, y(FY.avg[1]) - 14, 3, 18);
  ctx.restore();
  const cx = b.x + b.w - 10 - f.chipW;
  progChip(ctx, cx, b.y + 7, f.chipW, 1, 'edit_file', { a: 1, lit: 0 });
  const right = b.x + b.w - 10;
  const w = tag(ctx, right, y(FY.testName) - 15, '　 テスト通過', { font: F.jp(700, 12), h: 21, padX: 7, fill: C.green, color: '#fff', r: 5, align: 'right', alpha: 1 });
  check(ctx, right - w + 13, y(FY.testName) - 4.5, 6.5, 1);
  ctx.save();
  ctx.fillStyle = C.green;
  ctx.fillRect(b.x + 6, y(FY.test[1]) - 14, 3, 18);
  ctx.restore();
  text(ctx, '確かめたのは、この 1 行の条件だけ', b.x + 12, y(FY.note[0]), { font: F.jp(700, 14), color: C.green });
  text(ctx, NOT_CHECKED, b.x + 12, y(FY.note[1]), { font: F.jp(500, 14), color: C.ink2 });
}

// 6-5's column under the LLM, filled, with the way back when a test fails.
function steps65(ctx) {
  const K = COL65;
  text(ctx, 'LLM が選ぶ次の行動', K.x, K.head, { font: F.jp(700, 15), color: C.ink2 });
  const rowY = (k) => K.top + k * K.step;
  STEPS65.forEach(([str, tool], k) => {
    const y = rowY(k);
    badgeN(ctx, K.x + 12, y + K.h / 2, String(k + 1), 1);
    text(ctx, str, K.x + 32, y + 21, { font: F.jp(500, 15), color: C.ink });
    text(ctx, tool, K.x + K.w, y + 20, { font: F.mono(500, 13), color: C.muted, align: 'right' });
  });
  const y = rowY(5);
  ctx.save();
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);
  rr(ctx, K.x, y, K.w, K.h, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  const w = text(ctx, '通らなければ', K.x + 32, y + 21, { font: F.jp(500, 15), color: C.red });
  text(ctx, '、出力を読んで', K.x + 32 + w, y + 21, { font: F.jp(500, 15), color: C.ink });
  ctx.save();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(K.x + 12, y + K.h / 2, 10, 0, Math.PI * 2);
  ctx.stroke();
  line(ctx, K.x + 8, y + K.h / 2 - 4, K.x + 16, y + K.h / 2 + 4);
  line(ctx, K.x + 16, y + K.h / 2 - 4, K.x + 8, y + K.h / 2 + 4);
  ctx.restore();
  const y5 = rowY(5) + K.h / 2;
  const y3 = rowY(3) + K.h / 2;
  const x = K.x - 16;
  const r = 8;
  ctx.save();
  ctx.strokeStyle = C.red;
  ctx.fillStyle = C.red;
  ctx.lineWidth = 2.2;
  path(ctx, [[K.x - 2, y5], [x + r, y5], [x, y5 - r], [x, y3 + r], [x + r, y3], [K.x - 4, y3]], 1);
  arrowHead(ctx, K.x - 2, y3, 0, 9);
  ctx.restore();
}

// 6-5's SWE-bench card as it ends.
function sweCard65(ctx) {
  const b = CARD65;
  ctx.save();
  rr(ctx, b.x, b.y, b.w, b.h, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  const w0 = text(ctx, '2023', b.x + 16, b.y + 40, { font: F.cond(700, 34), color: C.ink });
  const w1 = text(ctx, 'SWE-bench', b.x + 16 + w0 + 10, b.y + 38, { font: F.sans(700, 22), color: C.ink });
  tag(ctx, b.x + 16 + w0 + 10 + w1 + 10, b.y + 18, '原版', { font: F.jp(700, 13), h: 24, padX: 8, fill: '#fff', stroke: C.ink2, color: C.ink2, r: 6 });
  text(ctx, '12 の Python のプロジェクトから', b.x + 16, b.y + 66, { font: F.jp(500, 15), color: C.ink });
  text(ctx, '実際に報告された課題を集めた', b.x + 16, b.y + 87, { font: F.jp(500, 15), color: C.ink });
  const nw = text(ctx, '2,294', b.x + 16, b.y + 138, { font: F.cond(700, 52), color: C.accent, ls: -1 });
  text(ctx, '件', b.x + 16 + nw + 6, b.y + 136, { font: F.jp(700, 22), color: C.accent });
  const fy = b.y + 166;
  ctx.save();
  ctx.fillStyle = C.rule;
  ctx.fillRect(b.x + 16, b.y + 152, b.w - 32, 1.5);
  ctx.restore();
  const chipO = { font: F.jp(700, 13), h: 28, padX: 9, r: 7 };
  const c1 = tag(ctx, b.x + 16, fy, '直したコード', { ...chipO, fill: C.panel, color: C.ink });
  const c2x = b.x + 16 + c1 + 30;
  const c2 = tag(ctx, c2x, fy, '評価用のテスト', { ...chipO, fill: '#fff', stroke: C.ink2, color: C.ink });
  const oy = fy + 42;
  const outO = { ...chipO, h: 24, font: F.jp(700, 12), padX: 8 };
  const ow1 = tag(ctx, c2x - 24, oy, '✓ 解けた', { ...outO, fill: C.green, color: '#fff' });
  const o2x = c2x - 24 + ow1 + 12;
  const ow2 = tag(ctx, o2x, oy, '✕ 解けない', { ...outO, fill: '#fff', stroke: C.red, color: C.red });
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = C.ink2;
  ctx.lineWidth = 2;
  arrow(ctx, b.x + 16 + c1 + 4, fy + 14, c2x - 4, fy + 14, 1, 8);
  const cx2 = c2x + c2 / 2;
  arrow(ctx, cx2 - 6, fy + 30, c2x - 24 + ow1 / 2, oy - 4, 1, 8);
  arrow(ctx, cx2 + 6, fy + 30, o2x + ow2 / 2, oy - 4, 1, 8);
  ctx.restore();
  const sy = b.y + 258;
  text(ctx, '点：解けた課題の割合（%）', b.x + 16, sy, { font: F.jp(500, 14), color: C.ink });
  tag(ctx, b.x + 16, sy + 12, '読み方に注意', { font: F.jp(700, 12), h: 24, padX: 7, fill: '#fff', stroke: C.accent, color: C.accent, r: 6 });
  tag(ctx, b.x + b.w - 16, sy + 10, '10 章　鍛えて測る', { font: F.jp(700, 15), h: 30, padX: 11, fill: C.ink, color: C.paper, align: 'right' });
}

// ——— shared by both pictures ——————————————————————————————————————————————————————————————

// The top of the paper, where the scrolled part goes on.
function paperTop(ctx, D, sy, a) {
  const g = ctx.createLinearGradient(0, D.y, 0, D.y + 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalAlpha = clamp(sy / 30) * a;
  ctx.fillStyle = g;
  ctx.fillRect(D.x + 4, D.y + 2, D.w - 8, 30);
  ctx.restore();
}

// A highlighter under a piece of text that is already drawn (multiplied, so the text stays dark).
function marker(ctx, b, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha *= clamp(a);
  rr(ctx, b.x - 3, b.y - 1, b.w + 6, b.h + 2, 4);
  ctx.fillStyle = C.accentSoft;
  ctx.fill();
  ctx.restore();
}

// ——— this clip's pieces ———————————————————————————————————————————————————————————————————

// The app sees where the call ends — purple dashes from its box down the document's right margin.
function lookLine(ctx, m, p, a) {
  const x = DOC6.x + DOC6.w - 8;
  const y0 = ACT6.y + ACT6.h + 4;
  const y = m.y + MARK_H / 2;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 6]);
  path(ctx, [[x, y0], [x, y], [m.x + m.w + 9, y]], p);
  ctx.setLineDash([]);
  ctx.restore();
}

// A chip on its way along a polyline (eased overall): an operation the LLM wrote, passed on by the app
// (vermilion), or the picture coming back (green). It slides into the tool's place and out of it under its edge.
function chipGo(ctx, p, pts, str, kind, a = null) {
  if (p <= 0 || p >= 1 || a === 0) return;
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, TOOL6.x, 900);
  ctx.clip();
  ctx.globalAlpha = clamp(p * 8) * (a ?? clamp((1 - p) * 8));
  const font = kind === 'call' ? F.mono(600, 15) : F.jp(700, 16);
  tag(ctx, pt.x, pt.y - 15, str, { font, h: 30, padX: 10, fill: kind === 'call' ? C.accent : C.green, color: '#fff', align: 'center', r: 8 });
  ctx.restore();
}

// Text on the page; in a small picture it reads as a grey bar.
function ptext(ctx, str, x, y, o, small) {
  if (!small) return text(ctx, str, x, y, o);
  const w = measure(ctx, o.font, str);
  const px = parseInt(o.font.match(/(\d+)px/)[1], 10);
  const x0 = o.align === 'center' ? x - w / 2 : x;
  ctx.save();
  ctx.globalAlpha *= 0.5;
  ctx.fillStyle = o.color;
  ctx.fillRect(x0, y - px * 0.62, w, px * 0.5);
  ctx.restore();
  return w;
}

// The booking page at scale sc with its top-left at (x, y). st: { focus ('date' | 'time'), date, time (what is
// typed), caret ('date' | 'time'), press (0–1, 予約する held down), done (0–1, booked), locks (0–1, the other
// apps locked) }
function page(ctx, x, y, sc, st, a = 1) {
  if (a <= 0.001) return;
  const small = sc < 0.3;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.globalAlpha *= clamp(a);
  rr(ctx, 0, 0, PW, PH, 4);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = C.panel;
  ctx.fillRect(0, 0, PW, P.head);
  ctx.fillStyle = '#e3ddd0';
  ctx.fillRect(0, P.bar, PW, PH - P.bar);
  ctx.restore();
  ptext(ctx, '会議室の予約', 14, 23, { font: F.jp(700, 16), color: C.ink }, small);
  // the boxes: date, time, the room
  const label = { font: F.jp(500, 15), color: C.ink2 };
  [['date', '日付', '月/日'], ['time', '時刻', '時:分']].forEach(([k, name, hint]) => {
    const ry = P.rows[k];
    ptext(ctx, name, P.lx, ry + 23, label, small);
    const on = st.focus === k;
    rr(ctx, P.fx, ry, P.fw, P.fh, 6);
    ctx.strokeStyle = on ? C.blue : C.rule;
    ctx.lineWidth = on ? 2.5 : 1.5;
    ctx.stroke();
    const v = st[k] ?? '';
    if (v) {
      const w = ptext(ctx, v, P.fx + 12, ry + 23, { font: F.mono(500, 16), color: C.ink }, small);
      if (!small && st.caret === k) {
        ctx.fillStyle = C.ink;
        ctx.fillRect(P.fx + 13 + w, ry + 8, 2, 18);
      }
    } else ptext(ctx, hint, P.fx + 12, ry + 23, { font: F.jp(400, 14), color: C.muted }, small);
  });
  const rm = P.rows.room;
  ptext(ctx, '会議室', P.lx, rm + 23, label, small);
  rr(ctx, P.fx, rm, P.fw, P.fh, 6);
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ptext(ctx, '第 1 会議室', P.fx + 12, rm + 23, { font: F.jp(500, 15), color: C.ink }, small);
  ctx.fillStyle = C.ink2;
  ctx.beginPath();
  ctx.moveTo(P.fx + P.fw - 22, rm + 14);
  ctx.lineTo(P.fx + P.fw - 12, rm + 14);
  ctx.lineTo(P.fx + P.fw - 17, rm + 21);
  ctx.closePath();
  ctx.fill();
  // the button, and what it says once the booking is made
  const b = P.btn;
  rr(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fillStyle = (st.press ?? 0) > 0.5 ? '#1f3fb0' : C.blue;
  ctx.fill();
  ptext(ctx, '予約する', b.x + b.w / 2, b.y + 25, { font: F.jp(700, 16), color: '#fff', align: 'center' }, small);
  const done = st.done ?? 0;
  if (done > 0.001) {
    const d = P.done;
    ctx.save();
    ctx.globalAlpha *= done;
    rr(ctx, d.x, d.y, d.w, d.h, 8);
    ctx.fillStyle = C.greenSoft;
    ctx.fill();
    ptext(ctx, '予約しました', d.x + 34, d.y + 25, { font: F.jp(700, 15), color: C.green }, small);
    ctx.restore();
    if (!small) check(ctx, d.x + 18, d.y + d.h / 2, 8, done);
  }
  // the taskbar: the computer's apps
  let ax = 10;
  BAR_APPS.forEach((n, k) => {
    const font = F.jp(500, 12);
    const w = measure(ctx, font, n) + 16;
    rr(ctx, ax, P.bar + 6, w, 20, 5);
    ctx.fillStyle = k === 0 ? '#fff' : '#efebe2';
    ctx.fill();
    ptext(ctx, n, ax + w / 2, P.bar + 20, { font, color: k === 0 ? C.ink : C.ink2, align: 'center' }, small);
    if (k > 0 && (st.locks ?? 0) > 0.001) padlock(ctx, ax + w - 1, P.bar + 7, 7.5, st.locks);
    ax += w + 6;
  });
  ctx.restore();
}

// A picture of the screen in the document.
function thumb(ctx, x, y, st, a) {
  page(ctx, x, y, TH, st, a);
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, x, y, PW * TH, PH * TH, 3);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// The display in the tool's place: the page live, the pointer, a click, the flash of a picture being taken.
function display(ctx, a, st, cur, clicks, flash) {
  if (a <= 0.001) return;
  const dy = (1 - a) * 8;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, MON.x, MON.y + dy, MON.w, MON.h, 12);
  ctx.fillStyle = '#2a2d33';
  ctx.fill();
  ctx.restore();
  page(ctx, PG.x, PG.y + dy, 1, st, a);
  if (flash > 0.001) {
    ctx.save();
    ctx.globalAlpha *= a * 0.7 * flash;
    rr(ctx, PG.x, PG.y, PW, PH, 4);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }
  const cx = PG.x + cur.x;
  const cy = PG.y + cur.y + dy;
  clicks.forEach((r) => {
    if (r <= 0 || r >= 1) return;
    ctx.save();
    ctx.globalAlpha *= a * (1 - r);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3;
    circle(ctx, cx, cy, 6 + r * 22);
    ctx.stroke();
    ctx.restore();
  });
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 22);
  ctx.lineTo(6, 17);
  ctx.lineTo(10, 26);
  ctx.lineTo(14, 24);
  ctx.lineTo(10, 15);
  ctx.lineTo(17, 15);
  ctx.closePath();
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// d–f2: the picture the LLM reads, enlarged above it: where it judges the parts to be, the position it
// writes, a position read wrong (d2), and the next picture (f2).
function magCard(ctx, o, g) {
  if (o.fly <= 0.001 || o.out >= 0.999) return;
  const b = CARD;
  const a = o.a;
  const keep = 1 - o.out;
  if (a > 0.001) {
    ctx.save();
    ctx.globalAlpha *= a;
    rr(ctx, b.x, b.y, b.w, b.h, 16);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    text(ctx, 'LLM が読む画像', b.x + 16, b.y + 30, { font: F.jp(700, 16), color: C.ink, alpha: a });
    text(ctx, '枠：LLM が判断した位置（イメージ）', b.x + 16, b.y + b.h - 14, { font: F.jp(500, 12), color: C.muted, alpha: a * o.judge });
  }
  // the picture: on its way from the document, then here
  const sc = lerp(TH, MS, o.fly);
  const x = lerp(o.from.x, MAG.x, o.fly);
  const y = lerp(o.from.y, MAG.y, o.fly);
  page(ctx, x, y, sc, SHOTS[0], keep * (1 - o.swap));
  if (o.swap > 0.001) page(ctx, x, y, sc, SHOTS[1], keep * o.swap);
  ctx.save();
  ctx.globalAlpha *= keep;
  rr(ctx, x, y, PW * sc, PH * sc, 4);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  if (o.fly < 1) return;
  // where the parts are, as the LLM judges them; d2: the button's read wrong
  ['date', 'time', 'room', 'button'].forEach((k, i) => {
    const fa = o.frames[i] * keep;
    if (fa <= 0.001) return;
    let f = g.frames[k];
    const wrong = k === 'button' && o.miss > 0.001;
    if (wrong) f = { ...f, x: lerp(f.x, g.missed.x, o.miss), y: lerp(f.y, g.missed.y, o.miss) };
    ctx.save();
    ctx.globalAlpha *= fa;
    ctx.strokeStyle = wrong ? C.red : C.ink;
    ctx.lineWidth = 2.2;
    if (wrong) ctx.setLineDash([6, 4]);
    rr(ctx, f.x, f.y, f.w, f.h, 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  });
  if (o.miss > 0.001) tag(ctx, g.missAt.box.x, g.missAt.box.y, g.missText, { font: g.missFont, h: 22, padX: 7, fill: '#fff', stroke: C.red, color: C.red, r: 6, alpha: o.miss * keep });
  // e: the position the LLM writes
  if (o.xy > 0.001) {
    const px = MAG.x + CENTER.date.x * MS;
    const py = MAG.y + CENTER.date.y * MS;
    ctx.save();
    ctx.globalAlpha *= o.xy * keep;
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2;
    line(ctx, px - 9, py, px + 9, py);
    line(ctx, px, py - 9, px, py + 9);
    circle(ctx, px, py, 5);
    ctx.stroke();
    ctx.restore();
    tag(ctx, g.xyAt.box.x, g.xyAt.box.y, g.xyText, { font: g.xyFont, h: 22, padX: 6, fill: C.accentSoft, color: C.ink, r: 6, alpha: o.xy * keep });
  }
  // f2: in the next picture, the date box is the one being typed into
  if (o.see > 0.001) {
    const f = g.frames.date;
    ctx.save();
    ctx.globalAlpha *= o.see * keep;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2.2;
    rr(ctx, f.x, f.y, f.w, f.h, 6);
    ctx.stroke();
    ctx.restore();
  }
}

// l2: the app asks the person on the chat screen, and the person confirms.
function dialog(ctx, b, o) {
  const a = o.a;
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, '予約を確定してよいですか？', b.x + 14, b.y + 25, { font: F.jp(700, 15), color: C.ink, alpha: a });
  text(ctx, '10/20 14:00　第 1 会議室', b.x + 14, b.y + 51, { font: F.jp(500, 12), color: C.ink2, alpha: a });
  const bf = { font: F.jp(700, 12), h: 24, padX: 9, r: 6 };
  const right = b.x + b.w - 12;
  const w2 = tag(ctx, right, b.y + 34, 'やめる', { ...bf, fill: '#fff', stroke: C.rule, color: C.ink2, align: 'right', alpha: a });
  const okR = right - w2 - 8;
  const okW = tag(ctx, okR, b.y + 34, o.pressed > 0.5 ? '✓ 確定した' : '確定する', { ...bf, fill: o.pressed > 0.5 ? C.green : C.purple, color: '#fff', align: 'right', alpha: a });
  if (o.tap > 0 && o.tap < 1) {
    ctx.save();
    ctx.globalAlpha *= a * (1 - o.tap);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 3;
    circle(ctx, okR - okW / 2, b.y + 46, 6 + o.tap * 20);
    ctx.stroke();
    ctx.restore();
  }
  ring(ctx, b.x, b.y, b.w, b.h, o.ring * a, C.accent, 12);
}

// l: the place where the screen is operated, kept apart from the everyday computer.
function fence(ctx, a) {
  if (a <= 0.001) return;
  const b = FENCE;
  const pad = (1 - a) * 10;
  ctx.save();
  // (broken where the tool's place has its name, like a frame's title)
  ctx.beginPath();
  ctx.rect(0, 0, 1600, 900);
  ctx.rect(TOOL6.x - 12, TOOL6.y - 40, measure(ctx, F.jp(700, 22), 'ツールの場所') + 20, 30);
  ctx.clip('evenodd');
  ctx.globalAlpha *= a;
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 7]);
  rr(ctx, b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, 26);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  tag(ctx, b.x + b.w - 16, b.y - 13, '切り離した環境（仮想マシンなど）', { font: F.jp(700, 14), h: 26, padX: 10, fill: C.paper, stroke: C.ink2, color: C.ink2, r: 13, align: 'right', alpha: a });
}

// l2: the service the booking page talks to, outside the place apart; the booking goes out to it.
function service(ctx, o) {
  const a = o.a;
  if (a <= 0.001) return;
  const b = SVC;
  const y0 = MON.y + MON.h;
  const moving = o.go > 0 && o.go < 1;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = o.hot > 0.5 || moving ? C.accent : C.ink2;
  ctx.lineWidth = 2.5;
  line(ctx, NET_X, y0, NET_X, b.y);
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // a server
  [0, 1].forEach((k) => {
    rr(ctx, b.x + 14, b.y + 12 + k * 16, 26, 12, 3);
    ctx.stroke();
    ctx.fillStyle = C.ink2;
    ctx.fillRect(b.x + 19, b.y + 17 + k * 16, 4, 2);
  });
  ctx.restore();
  text(ctx, '会議室の予約サービス', b.x + 52, b.y + 24, { font: F.jp(700, 15), color: C.ink, alpha: a });
  text(ctx, '外のサービス（ネットの先）', b.x + 52, b.y + 44, { font: F.jp(500, 12), color: C.muted, alpha: a * (1 - o.done) });
  text(ctx, '10/20 14:00 の予約を受け付けた', b.x + 52, b.y + 44, { font: F.jp(700, 12), color: C.green, alpha: a * o.done });
  if (o.done > 0.001) check(ctx, b.x + b.w - 20, b.y + 18, 9, o.done * a);
  ringBox(ctx, b, o.hot, C.accent, 3);
  // the booking on its way out
  if (moving) {
    const y = lerp(y0, b.y, inOutCubic(o.go));
    tag(ctx, NET_X + 10, y - 12, '予約', { font: F.jp(700, 12), h: 24, padX: 8, fill: C.accent, color: '#fff', r: 6, alpha: clamp(o.go * 8) * clamp((1 - o.go) * 8) });
  }
}

function cardBox(ctx, b, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, b.x, b.y, b.w, b.h, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// h–i3: October 2024 — the public beta, and OSWorld as it was then (a card of its own).
function card2024(ctx, o) {
  const a = o.a;
  if (a <= 0.001) return;
  const b = CARD;
  cardBox(ctx, b, a);
  const x = b.x + 16;
  const w0 = text(ctx, '2024', x, b.y + 40, { font: F.cond(700, 34), color: C.ink, alpha: a * o.y24 });
  text(ctx, '10 月 22 日', x + w0 + 10, b.y + 37, { font: F.jp(700, 16), color: C.ink, alpha: a * o.y24 });
  text(ctx, 'Anthropic が、画面の操作のツールを', x, b.y + 66, { font: F.jp(500, 14), color: C.ink, alpha: a * o.anth });
  text(ctx, '公開ベータとして出した', x, b.y + 86, { font: F.jp(500, 14), color: C.ink, alpha: a * o.beta });
  ctx.save();
  ctx.globalAlpha *= a * o.task;
  ctx.fillStyle = C.rule;
  ctx.fillRect(x, b.y + 100, b.w - 32, 1.5);
  ctx.restore();
  const wn = text(ctx, 'OSWorld', x, b.y + 126, { font: F.sans(700, 19), color: C.ink, alpha: a * o.osw });
  text(ctx, '（原版、369 課題）', x + wn + 4, b.y + 125, { font: F.jp(500, 13), color: C.ink2, alpha: a * o.osw });
  text(ctx, '画面を操作する課題を集めた試験', x, b.y + 147, { font: F.jp(500, 13), color: C.muted, alpha: a * o.task });
  // the model, then; the people, in the original paper's study (the words in a column right of the numbers)
  const big = F.cond(700, 34);
  const col = x + Math.max(measure(ctx, big, '14.9%'), measure(ctx, big, '72.36%')) + 14;
  const w15 = text(ctx, '14.9%', x, b.y + 194, { font: big, color: C.ink, alpha: a * o.p15 });
  text(ctx, 'Claude 3.5 Sonnet（更新版）', col, b.y + 177, { font: F.jp(500, 13), color: C.ink, alpha: a * o.then });
  const wi = text(ctx, '画面の画像だけ', col, b.y + 195, { font: F.jp(500, 13), color: C.ink2, alpha: a * o.img });
  text(ctx, '、15 回まで', col + wi, b.y + 195, { font: F.jp(500, 13), color: C.ink2, alpha: a * o.n15 });
  text(ctx, '72.36%', x, b.y + 245, { font: big, color: C.ink, alpha: a * o.p72 });
  text(ctx, '人', col, b.y + 228, { font: F.jp(700, 13), color: C.ink, alpha: a * o.hum });
  text(ctx, '元の論文（2024）の調べ', col, b.y + 246, { font: F.jp(500, 13), color: C.ink2, alpha: a * o.hum });
  text(ctx, '条件は同じではない（人には回数の上限なし）', x, b.y + 270, { font: F.jp(700, 12), color: C.ink, alpha: a * o.cond });
  text(ctx, '出典：Anthropic（2024-10-22）、Xie ほか（2024）', x, b.y + b.h - 10, { font: F.jp(400, 11), color: C.muted, alpha: a * o.anth });
  ringBox(ctx, { x, y: b.y + 168, w: w15, h: 28 }, o.ring * o.p15, C.accent, 4);
}

// j–j2: the official table of OSWorld-Verified, August 2026 (a card of its own, under the LLM).
const CARD26 = { x: 30, y: 612, w: 336, h: 210 };
function card2026(ctx, o) {
  const a = o.a;
  if (a <= 0.001) return;
  const b = CARD26;
  cardBox(ctx, b, a);
  const x = b.x + 16;
  text(ctx, 'OSWorld-Verified', x, b.y + 30, { font: F.sans(700, 19), color: C.ink, alpha: a * o.name });
  text(ctx, '課題や採点を見直した版', x, b.y + 51, { font: F.jp(500, 13), color: C.muted, alpha: a * o.ver });
  text(ctx, '公式の表の得点（2026-08-01 付）', x, b.y + 76, { font: F.jp(500, 13), color: C.ink, alpha: a * o.tab });
  const w86 = text(ctx, '85.96%', x, b.y + 119, { font: F.cond(700, 34), color: C.ink, alpha: a * o.p86 });
  text(ctx, 'Claude Fable 5', x + w86 + 14, b.y + 102, { font: F.jp(500, 13), color: C.ink, alpha: a * o.p86 });
  text(ctx, '100 回まで', x + w86 + 14, b.y + 120, { font: F.jp(500, 13), color: C.ink2, alpha: a * o.p86 });
  text(ctx, '試験の版も条件も違う', x, b.y + 150, { font: F.jp(700, 13), color: C.ink, alpha: a * o.diff });
  text(ctx, '2024 年の 14.9% とは、そのまま比べられない', x, b.y + 170, { font: F.jp(500, 13), color: C.ink, alpha: a * o.cmp });
  text(ctx, '出典：OSWorld の公式の Verified の表', x, b.y + b.h - 12, { font: F.jp(400, 11), color: C.muted, alpha: a * o.tab });
  ringBox(ctx, { x, y: b.y + 93, w: w86, h: 28 }, o.ring * o.p86, C.accent, 4);
}
