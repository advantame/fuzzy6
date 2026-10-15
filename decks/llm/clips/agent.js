// 6-4: the agent. Told from the designer's side (Boss, 2026-10-15), like 6-1 to 6-3. This time the app is
// asked for a goal — look through the logs and say which day has many errors and what they are — and the
// way to get there is left to the LLM. With the shell as its tool, the LLM first asks for a command that
// counts the errors by day; reading the result, it sees that 10-07 stands out, and asks next for a command
// that shows that day's errors; reading those, it asks how many are the database's timeouts. Each next
// command takes a piece of the result before it (README: the vermilion links). Read the last result,
// decide what to do next, again and again, towards the goal — though a person may be asked on the way, and
// the app stops it at a limit it set. Which steps, in what order, is not all written in advance: inside
// the tools and the rules the designer prepared, the LLM picks the next action from what it reads. At the
// end it reports what it found and what is still not known. Such a mechanism is called an AI agent — and
// that is what was inside the box of the opening (lib/cover.js): the box opens into this picture, and its
// parts are 1-1's three (the LLM, the app, the tools). In 2025, agents used from the terminal came out one
// after another (the LLM itself runs behind an API, not in the terminal).
//
// The layout is 6-1's to 6-3's (lib/terminal.js). The clip joins 6-3 (spec §6.10): its first frame is
// 6-3's last picture, drawn here as shell.js draws it, and the bridge clears 6-3's conversation, its
// terminal lines, the card and the marks of chapter 7's care, leaving the frame, the definition of bash at
// the head, the terminal and the programs under it (their locks too). The document scrolls once it is
// full. Everything in the conversation is an example: the request, the logs and the commands' output, the
// commands (cut into tokens as o200k_base cuts them), the report (research/connect-facts 6-4).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example } from '../lib/parts.js';
import {
  chatScreen, screenBubbles, chatBubble, screenLinks, toTool, fromTool, writePath, flyMark, llmBlock, appFrame, toolBox,
  channel, actor, token, TOKEN, tokenPlaces, onPath, docLayout, docEntry, rowAt, sweep, send, roleMark, markWidth,
  MARK_H, ROLE, WRITER, loopIcon,
} from '../lib/rig.js';
import {
  T, L, ACT, SCREEN, TOOL, DOC, MFONT, DX, SYS, defY, DEFS, defRows, drawDef, callLayout, drawCall, lookLine, halt,
  chipFlight, channelNames, TERM, programChips, terminal, progChip, shellLink, keyRow, gate, sandbox, NOTE_X, NOTE_Y,
  llmTag, careCard, LOCKED,
} from '../lib/terminal.js';
import { BOX, DONE, coverBox } from '../lib/cover.js';
import { text, measure, rr, path, line, arrow, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { focus, ring, ringBox } from '../../../src/kit/cue.js';

// ——— 6-3's last picture, as shell.js has it (its last frame is this clip's first)
const TFONT = F.jp(500, 20); // text in the document
const Q63 = '今日の日付と、2の64乗を教えて';
const HEAD63 = [['{"', 'name', '":', ' "', 'bash', '",'], [' "', 'input', '":', ' {"', 'command', '":']];
const CALL1_63 = [...HEAD63, [' "', 'date', '"}}']];
const CALL2_63 = [...HEAD63, [' "', 'python', '3', ' -', 'c'], [' \'', 'print', '(', '2', '**', '64', ')', '\'"', '}}']];
const MLH63 = 27;
const OUT1_63 = 'Thu Oct 15 14:30:00 JST 2026';
const OUT2_63 = '18446744073709551616';
const ANS63_DOC = '今日は2026年10月15日です。2の64乗は、\n18446744073709551616です。';
const ANS63_SCREEN = '今日は2026年10月15日です。\n2の64乗は、\n18446744073709551616です。';
const NOTE63 = '会話、定義、コマンド、出力は説明のための例。日付は、実行した機械の時計による';
// the terminal as 6-3 leaves it: thirteen lines, the last five in view
const LINES63 = [
  ['ls', 'cmd'], ['memo.txt  reports/'], ['sl', 'cmd'], ['bash: sl: command not found', 'err'], ['date', 'cmd'],
  [OUT1_63], ["python3 -c 'print(2**64)'", 'cmd'], [OUT2_63], ['ls', 'cmd'], ['memo.txt  reports/'],
  ['rm -r reports', 'cmd', 'red'], ['ls', 'cmd'], ['memo.txt'],
].map(([s, kind, red]) => ({ s, cmd: kind === 'cmd', err: kind === 'err', red: !!red, show: -10, type: -10 }));

// ——— this clip's conversation (an example)
const ASK = 'ログを調べて、エラーが多い日と、\nその中身を教えて';
const ASK_SCREEN = 'ログを調べて、エラーが多い日と、\nその中身を教えて';
// the LLM's three calls, row by row, as o200k_base cuts them (21, 29 and 31 tokens; none splits a character)
const ROW0 = ['{"', 'name', '":', ' "', 'bash', '",', ' "', 'input', '":', ' {"', 'command', '":'];
const CALLS = [
  [ROW0, [' "', 'grep', ' -', 'c', ' ERROR', ' logs', '/*.', 'log', '"}}']],
  [ROW0, [' "', 'grep', ' ERROR', ' logs', '/', '202', '6', '-', '10', '-', '07', '.log'], [' |', ' head', ' -', '3', '"}}']],
  [ROW0, [' "', 'grep', ' -', 'c', " '", 'db', ':', ' timeout', "'"], [' logs', '/', '202', '6', '-', '10', '-', '07', '.log', '"}}']],
];
const PRE = 13; // tokens before the command
const CMDS = ['grep -c …', 'grep … | head -3', "grep -c 'db: …'"]; // the command, as a chip on its way to the shell
// what each command printed (the app writes it in; no tokens)
const OUTS = [
  ['logs/2026-10-06.log:3', 'logs/2026-10-07.log:41', 'logs/2026-10-08.log:5'],
  ['ERROR db: timeout after 30s', 'ERROR db: timeout after 30s', 'ERROR db: timeout after 30s'],
  ['38'],
];
// the terminal: each command (a long one goes on over a second line) and its output
const TERM_CMDS = [['grep -c ERROR logs/*.log'], ['grep ERROR logs/2026-10-07.log', '| head -3'], ["grep -c 'db: timeout'", 'logs/2026-10-07.log']];
// the report (o200k_base: 39 tokens); in the document it breaks after 「件は」 and the first sentence
const REPORT = ['10', '月', '7', '日', 'が', '41', '件', 'で', '最', 'も', '多', 'く', '、', 'う', 'ち', '38', '件', 'は',
  'デ', 'ータ', 'ベ', 'ース', 'の', '時間', '切', 'れ', 'でした', '。', '理由', 'は', '、', 'ログ', 'から', 'は', 'まだ', '不', '明', 'です', '。'];
const FIRST = 28; // the tokens of the first sentence (what was found)
const REPORT_DOC = '10月7日が41件で最も多く、うち38件は\nデータベースの時間切れでした。\n理由は、ログからはまだ不明です。';
const REPORT_SCREEN = '10月7日が41件で最も多く、うち38件は\nデータベースの時間切れでした。\n理由は、ログからはまだ不明です。';
const NOTE = '依頼、ログ、コマンド、出力、報告は説明のための例';
const MLH = 26; // a row of a call
const RLH = 24; // a row of a command's output
const VIS = DOC.y + DOC.h - 12; // the lowest the written part may reach before the document scrolls
// the programs under the shell, in the order 6-3 draws them (a lock may reach over its neighbour's edge)
const CHIP_ORDER = ['find', 'ls', 'grep', 'python3', 'bc', 'date', 'git', 'cat', 'sort', 'wc', 'sed', 'cp', 'mv', 'rm', 'curl', 'ssh', 'sudo', '…'];

// ——— under the LLM: what the LLM chose to do next, one row per round
const STEPS = [
  [['日ごとのエラーを数える']],
  [['10月7日', C.accent], ['のエラーの中身を見る']],
  [['時間切れ', C.accent], ['の件数を数える']],
  [['報告にまとめる']],
];
const COL = { x: 84, head: 597, top: 616, step: 38, h: 30 };
const LIMIT_Y = COL.top + 4 * COL.step + 8;

// ——— above the LLM (outside the agent's frame): the card of who decides what (f, f2), 1-1's parts (j),
// the agents of 2025 (k)
const CARD = { x: 30, y: 46, w: 326, h: 290 };
const INNER = { x: 46, y: 196, w: 294, h: 118 };
const MINI = { x: 34, y: 82, w: 318, h: 112 };
const RELEASES = [
  ['2 月 24 日', 'Claude Code', '研究プレビュー'],
  ['4 月 16 日', 'Codex CLI', 'オープンソース'],
  ['6 月 25 日', 'Gemini CLI', 'オープンソースのプレビュー'],
];
const SOURCE = '出典：Anthropic、OpenAI、Google の発表';

// ——— the agent's frame (h) and the opening's box opening into it (i). The screen stays outside (top right),
// as the person who asks stayed outside the box; so does the card above the LLM (top left).
const FRAME = [[70, 350], [372, 350], [372, 72], [1124, 72], [1124, 356], [1522, 356], [1522, 824], [70, 824]];
const CORNER = { tl: [BOX.x, BOX.y], tr: [BOX.x + BOX.w, BOX.y], br: [BOX.x + BOX.w, BOX.y + BOX.h], bl: [BOX.x, BOX.y + BOX.h] };
const FROM = ['tl', 'tl', 'tl', 'tr', 'tr', 'tr', 'br', 'bl'].map((k) => CORNER[k]);

// ——— how fast a round goes: the first slowly, the next ones faster
const SLOW = { fly: 0.55, tok: 0.42, eot: 0.5, read: 0.95, step: 0.32, go: 0.6, out: 0.5, work: 1.15, back: 0.65 };
const MID = { fly: 0.5, tok: 0.38, eot: 0.45, read: 0.8, step: 0.28, go: 0.5, out: 0.9, work: 1.2, back: 0.55 };
const FAST = { fly: 0.42, tok: 0.3, eot: 0.36, read: 0.6, step: 0.2, go: 0.4, out: 1.05, work: 1.3, back: 0.45 };

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n times, evenly from a, the last one landing (after a flight of fly) by b
const times = (n, a, b, fly) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - fly - a)) / Math.max(1, n - 1));
// a call's token times: the JSON up to the command from a, then the command from wAt, landing by wEnd
function callTimes(nPre, nW, a, wAt, wEnd, fly) {
  const pre = times(nPre, a, Math.max(wAt + fly - 0.05, a + nPre * 0.04 + fly), fly);
  const w0 = Math.max(wAt, pre[pre.length - 1] + 0.05);
  return [...pre, ...times(nW, w0, Math.max(wEnd, w0 + nW * 0.05 + fly), fly)];
}
// after the call is written: the app stops the LLM, passes the command on, the shell runs it, the output
// comes back and is written in
function follow(r) {
  const sp = r.sp;
  r.fin = r.tok[r.tok.length - 1] + sp.tok;
  r.stop = r.fin + sp.eot;
  r.go = r.stop + sp.step;
  r.work = r.go + sp.go;
  r.outAt = r.work + sp.out;
  r.back = r.work + sp.work;
  r.resMark = r.back + sp.back * 0.35;
  r.resIn = r.back + sp.back;
  r.done = r.resIn + 0.35;
  return r;
}

export default clip({
  id: 'agent',
  title: '自分で動く',
  kicker: 'AI エージェント',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.9, // 6-3's conversation, terminal lines and care clear away; skipped unless the clip is joined from 6-3
  script: [
    { id: 'a', text: 'こんどは、ユーザーが{ask}「ログを調べて、エラーが多い日と、\nその中身を[教えて」と|おしえてと]頼んだとしましょう。\n\n{leave}どう調べるかの細かな手順は、LLM に任せるわ。' },
    { id: 'b', lead: 1.5, tail: 1.2, rest: 'short', text: '{shell}シェルをツールとして使える LLM は、まず、\n\n{count}日ごとのエラーの数を数えるコマンドを、\nツール呼び出しに書くわ。' },
    { id: 'c', lead: 1.9, text: '{read}LLM が、返ってきた結果を読むと、\n{oct7}10 月 7 日だけが、{many}飛び抜けて多いわね。' },
    { id: 'd', tail: 1.2, rest: 'short', text: 'そこで LLM が次に書くのは、\n{that}その日のエラーの中身を見るコマンドよ。' },
    { id: 'e', lead: 1.9, tail: 1.6, text: '{read2}LLM は、前の結果を読んで、{decide}次にすることを決める。\n{repeat}これをくり返して、{goal}目的に向けて進めるのよ。' },
    { id: 'e2', text: 'ただ、{human}途中でユーザーに確認したり、\n{limit}アプリが決めた回数の上限で止まったりすることもあるわ。' },
    { id: 'f', text: 'アプリを作る人が、{order}どの順に何を調べるかを、\n{all}すべて前もって決めておくわけではないの。' },
    { id: 'f2', still: true, text: '{tools}用意されたツールと、{rules}使ってよい範囲の中で、\n{llm}LLM が、結果を見ながら、{next}次の行動を選ぶわ。' },
    { id: 'g', lead: 1.5, tail: 0.3, still: true, text: '最後に LLM は、{found}調べてわかったことと、\n{unknown}まだわからないことを、{report}報告にまとめるわ。' },
    { id: 'h', text: 'このように、{choose}次の行動や使うツールを LLM に選ばせながら、\n{goal2}目的に向けて仕事を進める仕組みを、{name}AI エージェントと呼ぶの。' },
    { id: 'i', by: 'zunda', tail: 0.6, text: '{first}はじめに見たエージェントの中身は、{this}これだったのだ！' },
    { id: 'j', lead: 0.7, still: true, text: 'ええ。{llm2}次の行動を選ぶ LLM と、{app}ツールの実行や\n結果の受け渡しを受け持つアプリと、{tool}ツールの組み合わせよ。' },
    { id: 'k', lead: 0.7, tail: 0.9, text: '2025 年には、{term}ターミナルの中で使うエージェントが、\n{many2}次々に公開されたわ。' },
  ],

  prepare(ctx) {
    // ——— 6-3's last picture, laid out as shell.js lays it out
    const opts63 = { ...T.DOC, font: TFONT, lh: 28 };
    const one63 = (e, yy) => docLayout(ctx, L, [e], { ...opts63, top: yy - DOC.y })[0];
    let y = defY(1) + 28;
    const Qm = one63({ role: 'user', text: Q63 }, y);
    y = Qm.y + Qm.h + 12;
    const k1 = callLayout(ctx, { x: DX, y, w: Qm.w, h: 3 * MLH63 + 16 }, CALL1_63, MLH63);
    y = k1.band.y + k1.band.h + 10;
    const O1 = one63({ role: 'result', kind: 'data', text: OUT1_63, font: MFONT, lh: 22 }, y);
    y = O1.y + O1.h + 12;
    const k2 = callLayout(ctx, { x: DX, y, w: Qm.w, h: 4 * MLH63 + 16 }, CALL2_63, MLH63);
    y = k2.band.y + k2.band.h + 10;
    const O2 = one63({ role: 'result', kind: 'data', text: OUT2_63, font: MFONT, lh: 22 }, y);
    y = O2.y + O2.h + 14;
    const Am = one63({ role: 'assistant', text: ANS63_DOC }, y);
    const amRow = rowAt(Am, Am.rows.length - 1);
    const amEnd = { x: amRow.x + measure(ctx, Am.font, Am.rows[Am.rows.length - 1]) + 14, y: amRow.y - 21 };
    const Bm = screenBubbles(ctx, SCREEN, [['user', Q63], ['assistant', ANS63_SCREEN]], { font: F.jp(500, 18) });
    const old = { Qm, calls: [[k1, O1], [k2, O2]], Am, amEnd, Bm };

    // ——— this clip's document: the head (kept), the request, three calls with their output, the report
    const defs = defRows(ctx, DEFS);
    const defBox = { x: DX - 4, y: SYS.y - 1, w: Math.max(...defs.map((d) => d.right)) - DX + 8, h: defY(1) + 6 - SYS.y + 1 };
    const opts = { ...T.DOC, font: TFONT, lh: 28 };
    const one = (e, yy) => docLayout(ctx, L, [e], { ...opts, top: yy - DOC.y })[0];
    y = defY(1) + 28;
    const U = one({ role: 'user', text: ASK }, y);
    y = U.y + U.h + 12;
    const calls = CALLS.map((rows, k) => {
      const c = callLayout(ctx, { x: DX, y, w: U.w, h: rows.length * MLH + 16 }, rows, MLH, { hang: true });
      if (c.end.x + c.end.w > c.band.x + c.band.w - 6) throw new Error(`agent: call ${k + 1}'s end mark does not fit`);
      c.toks.forEach((tk) => { if (tk.x + tk.w > c.band.x + c.band.w - 6) throw new Error(`agent: call ${k + 1} is too wide`); });
      y = c.band.y + c.band.h + 10;
      const R = one({ role: 'result', kind: 'data', text: OUTS[k].join('\n'), font: MFONT, lh: RLH }, y);
      y = R.y + R.h + 12;
      return { c, R };
    });
    const A = one({ role: 'assistant', text: REPORT_DOC, lh: 30 }, y + 2);
    if (A.rows.length !== 3) throw new Error(`agent: the report takes ${A.rows.length} rows`);
    const repToks = tokenPlaces(ctx, A, REPORT);
    const aRow = rowAt(A, 2);
    const aEnd = { x: aRow.x + measure(ctx, A.font, A.rows[2]) + 14, y: aRow.y - 21, w: markWidth(ctx, ROLE.end.name) };
    if (aEnd.x + aEnd.w > A.tx + A.w) throw new Error('agent: the report\'s end mark does not fit');
    // where a piece of an output, or of a command, sits (doc coordinates)
    const inOut = (R, row, part, before) => {
      const at = rowAt(R, row);
      return { x: at.x + measure(ctx, R.font, before), y: at.y - 15, w: measure(ctx, R.font, part), h: 20 };
    };
    const inCall = (c, i0, i1) => {
      const a = c.toks[i0];
      const b = c.toks[i1];
      const x0 = a.x + (a.s.startsWith(' ') ? measure(ctx, MFONT, ' ') : 0);
      return { x: x0, y: a.y - 13, w: b.x + b.w - x0, h: 20, row: a.row };
    };
    const inText = (E, row, part, before) => {
      const at = rowAt(E, row);
      return { x: at.x + measure(ctx, E.font, before), y: at.y - 20, w: measure(ctx, E.font, part), h: 26 };
    };
    const rowEnd = (c, row) => Math.max(...c.toks.filter((tk) => tk.row === row).map((tk) => tk.x + tk.w));
    const spans = {
      day: inOut(calls[0].R, 1, '2026-10-07', 'logs/'),
      n41: inOut(calls[0].R, 1, '41', 'logs/2026-10-07.log:'),
      row07: inOut(calls[0].R, 1, OUTS[0][1], ''),
      day2: inCall(calls[1].c, 17, 22),
      timeout: inOut(calls[1].R, 0, 'db: timeout', 'ERROR '),
      timeout3: inCall(calls[2].c, 17, 19),
      n38: inOut(calls[2].R, 0, '38', ''),
      // round 1 takes its pieces from the request itself
      log: inText(U, 0, 'ログ', ''),
      err: inText(U, 0, 'エラー', 'ログを調べて、'),
      logs1: inCall(calls[0].c, 16, 19),
    };
    // the links: from the end of the output's row to the end of the next command's row, by the band's right edge
    const links = [
      { from: { x: U.tx + measure(ctx, U.font, U.rows[0]) + 8, y: rowAt(U, 0).y - 7 }, to: { x: calls[0].c.end.x + calls[0].c.end.w + 10, y: spans.logs1.y + 10 } }, // past the end mark on the same row
      { from: { x: spans.row07.x + spans.row07.w + 8, y: spans.row07.y + 10 }, to: { x: rowEnd(calls[1].c, 1) + 8, y: spans.day2.y + 10 } },
      { from: { x: inOut(calls[1].R, 0, OUTS[1][0], '').x + inOut(calls[1].R, 0, OUTS[1][0], '').w + 8, y: spans.timeout.y + 10 }, to: { x: rowEnd(calls[2].c, 1) + 8, y: spans.timeout3.y + 10 } },
    ];
    const laneX = calls[0].c.band.x + calls[0].c.band.w - 14;
    links.forEach((ln, k) => { if (Math.max(ln.from.x, ln.to.x) > laneX - 16) throw new Error(`agent: link ${k + 1} has no room at the band's edge`); });
    // the screen: the request and the report
    const Bs = screenBubbles(ctx, SCREEN, [['user', ASK_SCREEN], ['assistant', REPORT_SCREEN]], { font: F.jp(500, 15), gap: 12 });
    const lastB = Bs[Bs.length - 1];
    if (lastB.y + lastB.L.h > SCREEN.y + SCREEN.h - 8) throw new Error(`agent: the screen overflows (${lastB.y + lastB.L.h})`);
    if (lastB.L.lines.length !== 3) throw new Error(`agent: the report takes ${lastB.L.lines.length} lines on the screen`);
    const { posB, chipsBox } = programChips(ctx);
    return { old, defs, defBox, U, calls, A, repToks, aEnd, spans, links, laneX, Bs, posB, chipsBox };
  },

  draw(ctx, t, s, { at, pace }) {
    const { old, defs, defBox, U, calls, A, repToks, aEnd, spans, links, laneX, Bs, posB, chipsBox } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 6-3's conversation, terminal lines and care clear away. The first frame is 6-3's untouched.
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.6));
    const fresh = inOutCubic(seg(t, br * 0.6, br));

    // ——— when things happen
    // a: the request
    const askAt = at('ask') - lead;
    const userAt = askAt + 0.45;
    // b–e: three rounds; each, the app writes the assistant's mark and has the LLM read, the LLM writes a call,
    // the app stops it and runs the command in the shell, and writes the output in
    const r1 = { sp: SLOW, mark: at('b') + 0.05 };
    r1.read = r1.mark + SLOW.fly - 0.1;
    r1.wrote = r1.read + SLOW.read;
    r1.open = Math.max(r1.wrote, at('shell') - 0.1);
    r1.tok = callTimes(PRE, 8, r1.open + SLOW.eot - 0.2, at('count') - 0.15, at('b.end') - 0.5, SLOW.tok);
    follow(r1);
    const r2 = { sp: MID, mark: Math.max(r1.done, at('read') - 0.35) };
    r2.read = r2.mark + MID.fly - 0.1;
    r2.wrote = r2.read + MID.read;
    r2.open = Math.max(r2.wrote, at('d') + 0.1);
    r2.tok = callTimes(PRE, 16, r2.open + MID.eot - 0.2, at('that') - 0.45, at('d.end') - 0.35, MID.tok);
    follow(r2);
    const r3 = { sp: FAST, mark: Math.max(r2.done, at('read2') - 0.3) };
    r3.read = r3.mark + FAST.fly - 0.1;
    r3.wrote = r3.read + FAST.read;
    r3.open = Math.max(r3.wrote, at('decide') - 0.45);
    r3.tok = times(31, r3.open + FAST.eot - 0.15, at('repeat') - 0.05, FAST.tok);
    follow(r3);
    const rounds = [r1, r2, r3];
    // g: the report, the fourth round
    const r4 = { sp: MID, mark: Math.max(r3.done, at('g') + 0.1) };
    r4.read = r4.mark + MID.fly - 0.1;
    r4.wrote = r4.read + MID.read;
    const a4 = Math.max(r4.wrote, at('found') - 0.25);
    r4.tok = [...times(FIRST, a4, at('unknown') - 0.1, MID.tok), ...times(REPORT.length - FIRST, at('unknown') - 0.05, at('report') + 0.05, MID.tok)];
    r4.fin = r4.tok[r4.tok.length - 1] + MID.tok;
    r4.endIn = r4.fin + MID.eot;
    const landed = (r, k) => t >= r.tok[k] + r.sp.tok;
    const callLanded = (c, r) => c.toks.reduce((n, _, k) => (landed(r, k) ? k + 1 : n), 0);
    const repLanded = (tt) => repToks.reduce((u, tk, k) => (tt >= r4.tok[k] + MID.tok ? tk.upto : u), 0);

    // the document scrolls when what comes next would pass its foot (the written part's bottom, at the time)
    const scrollAt = [
      ...calls.flatMap(({ c, R }, k) => [[rounds[k].mark, c.band.y + c.band.h], [rounds[k].resMark, R.y + R.h]]),
      [r4.mark, A.y + A.h],
    ];
    let need = 0;
    let sy = 0;
    scrollAt.forEach(([when, bottom]) => {
      const to = Math.max(need, bottom - VIS);
      if (to > need) sy += (to - need) * inOutCubic(seg(t, when - 0.5, when - 0.05));
      need = to;
    });

    // e2–k
    const human = pop('human');
    const limitA = pop('limit');
    const loopA = pop('repeat');
    const frameP = inOutCubic(seg(t, at('name') - lead, at('name') - lead + 0.9));
    const nameTag = tw(t, at('name') - lead + 0.6, pace.enter, (p) => outBack(p, 1.4));
    const boxIn = tw(t, at('first') - lead, 0.5);
    const openP = inOutCubic(seg(t, at('this') - lead, at('this') - lead + 1.0));
    const cardIn = tw(t, at('order') - lead, pace.enter);
    const cardOut = tw(t, at('j'), 0.5, inOutCubic);
    const miniIn = tw(t, at('j') + 0.25, pace.enter) * (1 - tw(t, at('k'), 0.5, inOutCubic));
    const relIn = tw(t, at('k') + 0.3, pace.enter);

    // ——— who is at work
    const actGlow = Math.max(
      span(t, userAt - 0.1, userAt + SLOW.fly),
      ...[...rounds, r4].map((r) => span(t, r.mark, r.wrote)),
      ...rounds.map((r) => span(t, r.stop, r.done - 0.2)),
      span(t, r4.tok[0] + MID.tok, r4.endIn - 0.1),
    );
    const llmGlow = Math.max(
      ...[...rounds].map((r) => span(t, r.wrote - 0.1, r.stop)),
      span(t, r4.wrote - 0.1, r4.endIn - 0.15),
    );
    const writing = rounds.some((r) => t >= r.open && t < r.stop) || (t >= r4.tok[0] && t < r4.endIn);

    // ——— the rings: what the voice points at
    const [shellLit] = lit(['shell'], at('count'));
    const [read2Lit] = lit(['read2'], at('decide'));
    const [goalLit] = lit(['goal'], at('e.end'));
    const [orderLit] = lit(['order'], at('all'));
    const [toolsLit, rulesLit, llmLit, nextLit] = lit(['tools', 'rules', 'llm', 'next'], at('f2.end'));
    const [chooseLit, goal2Lit] = lit(['choose', 'goal2'], at('name'));
    const [llm2Lit, appLit, toolLit] = lit(['llm2', 'app', 'tool'], at('j.end'));

    // ——— the chat screen: 6-3's conversation leaves, this one comes in
    chatScreen(ctx, SCREEN, 1);
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      chatBubble(ctx, old.Bm[0], { alpha: 1 });
      chatBubble(ctx, old.Bm[1], { alpha: 1, chars: 1 });
      ctx.restore();
    }
    chatBubble(ctx, Bs[0], { alpha: tw(t, askAt, 0.35) });
    chatBubble(ctx, Bs[1], { alpha: tw(t, r4.tok[0] + MID.tok, 0.2), chars: repLanded(t - 0.12) });
    const bubbleBox = (b) => ({ x: b.x, y: b.y, w: b.L.w, h: b.L.h });
    ringBox(ctx, bubbleBox(Bs[0]), Math.max(goalLit, goal2Lit), C.accent, 2);
    screenLinks(ctx, T, { talk: 1, back: 1, talkHot: span(t, askAt + 0.05, askAt + 0.8) > 0.5, backHot: span(t, r4.tok[0] + MID.tok, r4.fin + 0.2) > 0.5 });

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, L, 1, { name: '' });
    llmBlock(ctx, L, 1, { glow: Math.max(llmGlow, llmLit, chooseLit, llm2Lit) });
    channel(ctx, L.read, 1, { hot: rounds.some((r) => span(t, r.read, r.wrote) > 0.5) || span(t, r4.read, r4.wrote) > 0.5 });
    channel(ctx, L.write, 1, { hot: llmGlow > 0.5 && writing });
    const runHot = rounds.some((r) => span(t, r.go, r.work) > 0.5);
    channel(ctx, L.call, 1, { labelAlpha: 0, hot: runHot });
    channel(ctx, L.back, 1, { labelAlpha: 0, hot: rounds.some((r) => span(t, r.back, r.back + r.sp.back * 0.6) > 0.5) });
    channelNames(ctx, { inName: 1, outName: 1, errName: 1, inHot: runHot, outHot: false, ringLit: 0 });

    // ——— the document (scrolled by sy, clipped to the paper)
    ctx.save();
    if (sy > 0) {
      // a clip changes how the edges are smoothed, so the unscrolled document (6-3's first frame) goes without
      ctx.beginPath();
      ctx.rect(DOC.x, DOC.y + 2, DOC.w, DOC.h - 4);
      ctx.clip();
      ctx.translate(0, -sy);
    }
    roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
    defs.forEach((d, k) => drawDef(ctx, d, defY(k), 1));
    ringBox(ctx, defBox, shellLit, C.accent);
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      drawOldDoc(ctx, old);
      ctx.restore();
    }
    // a: the request
    if (t >= userAt + SLOW.fly) {
      docEntry(ctx, U, 1, { tagAlpha: 0, chars: tw(t, userAt + SLOW.fly - 0.05, 0.3) });
      roleMark(ctx, U.x, U.y + 1, ROLE.user, { edge: WRITER.user });
    }
    // b–e: the rounds
    calls.forEach(({ c, R }, k) => {
      const r = rounds[k];
      if (t >= r.mark + r.sp.fly) roleMark(ctx, DOC.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
      drawCall(ctx, c, { bandA: tw(t, r.open + r.sp.eot - 0.1, 0.25), open: t >= r.open + r.sp.eot, n: callLanded(c, r), end: t >= r.fin + r.sp.eot });
      if (t >= r.resMark + r.sp.fly) roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
      const oi = tw(t, r.resIn - 0.05, 0.3);
      if (oi > 0) docEntry(ctx, R, oi, { tagAlpha: 0, chars: seg(t, r.resIn, r.resIn + 0.45) });
    });
    // the pieces of an output that the next command takes, marked where they are read and where they are written
    const lk1 = tw(t, r1.tok[17] + SLOW.tok, 0.3);
    [spans.log, spans.err, spans.logs1].forEach((b) => marker(ctx, b, lk1));
    marker(ctx, spans.day, pop('oct7'));
    marker(ctx, spans.day2, tw(t, r2.tok[22] + MID.tok, 0.3));
    marker(ctx, spans.timeout, pop('read2'));
    marker(ctx, spans.timeout3, tw(t, r3.tok[19] + FAST.tok, 0.3));
    links.forEach((ln, k) => {
      const r = rounds[k];
      const i = [17, 22, 19][k];
      link(ctx, ln, laneX, tw(t, r.tok[i] + r.sp.tok, 0.6, inOutCubic));
    });
    // c: the count that stands out turns vermilion
    const n41 = pop('many');
    if (n41 > 0.001) text(ctx, '41', spans.n41.x, spans.n41.y + 15, { font: MFONT, color: C.accent, alpha: n41 });
    const R2 = calls[1].R;
    ringBox(ctx, { x: R2.tx, y: R2.y, w: R2.w, h: R2.h }, read2Lit, C.accent, 0);
    // g: the report, what was found and what is not known yet
    if (t >= r4.mark + MID.fly) roleMark(ctx, A.x, A.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    const ca = repLanded(t);
    if (ca > 0) docEntry(ctx, A, 1, { tagAlpha: 0, chars: ca });
    if (t >= r4.endIn) roleMark(ctx, aEnd.x, aEnd.y, ROLE.end, { edge: WRITER.end });
    reportKey(ctx, A, tw(t, r4.tok[FIRST - 1] + MID.tok, pace.enter), tw(t, r4.tok[REPORT.length - 1] + MID.tok, pace.enter));
    // a cursor after the assistant's mark, while the LLM reads, until it writes
    const cur = rounds.map((r, k) => [r, calls[k].c.open]).find(([r]) => t >= r.read && t < r.open + r.sp.eot);
    const cursor = cur ? { x: cur[1].x, y: cur[1].y + MARK_H - 2 } : t >= r4.read && t < r4.tok[0] + MID.tok ? (() => { const p = rowAt(A, 0); return { x: p.x, y: p.y + 6 }; })() : null;
    if (cursor && Math.floor(t * 2.5) % 2 === 0) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(cursor.x, cursor.y - 30, 4, 30);
    }
    ctx.restore();
    // the top of the paper, where the scrolled part goes on
    if (sy > 0.5) {
      const g = ctx.createLinearGradient(0, DOC.y, 0, DOC.y + 30);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save();
      ctx.globalAlpha = clamp(sy / 30);
      ctx.fillStyle = g;
      ctx.fillRect(DOC.x + 4, DOC.y + 2, DOC.w - 8, 30);
      ctx.restore();
    }
    // the reads: the app hands the document over
    [...rounds.map((r, k) => [r, calls[k].c.band.y]), [r4, A.y]].forEach(([r, yy]) => {
      sweep(ctx, L, seg(t, r.read + 0.05, r.read + r.sp.read), yy - sy + MARK_H);
      send(ctx, L.read, seg(t, r.read + 0.4 * (r.sp.read / SLOW.read), r.read + r.sp.read + 0.05), '', 'doc');
    });

    // ——— the app's box; it sees where each call ends, and stops the writing; its loop (e)
    actor(ctx, ACT, 1, actGlow);
    rounds.forEach((r, k) => {
      const lk = span(t, r.stop - 0.05, r.go + 0.25);
      const e = calls[k].c.end;
      if (lk > 0) lookLine(ctx, { x: e.x, y: e.y - sy, w: e.w }, tw(t, r.stop - 0.05, 0.3, inOutCubic), lk);
    });
    halt(ctx, Math.max(...rounds.map((r) => span(t, r.fin + r.sp.eot - 0.05, r.go + 0.45))));
    if (loopA > 0.001) {
      loopIcon(ctx, T.LOOP.x, T.LOOP.y, T.LOOP.r, loopA, { p: loopA });
      text(ctx, 'くり返す', T.LOOP.x - T.LOOP.r - 14, T.LOOP.y + 6, { font: F.jp(700, 16), color: C.purple, align: 'right', alpha: loopA });
    }
    ring(ctx, T.LOOP.x - T.LOOP.r - 92, T.LOOP.y - 30, T.LOOP.r + 92 + T.LOOP.r, 60, rulesLit * loopA, C.accent);
    // e2: a person is asked on the way to the shell (6-3's mark); 6-3's mark clears in the bridge
    const gx = (L.call.x1 + L.call.x2) / 2;
    gate(ctx, gx, L.call.y, Math.max(gone, human));
    ring(ctx, gx - 18, L.call.y - 18, 36, 36, rulesLit * human, C.accent);

    // ——— the tool's place: the terminal and the programs under it
    toolBox(ctx, L, 1, {
      solid: 1,
      draw: (c) => {
        if (gone > 0.001) {
          const tm = terminal(c, t, 1, LINES63, { lineAlpha: gone });
          drawOldTerm(c, tm, gone);
        } else {
          terminal(c, t, 1, termLines(rounds), {});
        }
        ringBox(c, TERM, toolsLit, C.accent, 4);
        rounds.forEach((r) => shellLink(c, posB.grep, span(t, r.work + 0.25, r.back), C.accent));
        const grepLit = Math.max(...rounds.map((r) => span(t, r.work + 0.25, r.back)));
        CHIP_ORDER.forEach((n) => {
          const b = posB[n];
          progChip(c, b.x, b.y, b.w, 1, n, { a: 1, lit: n === 'grep' ? grepLit : 0, lock: LOCKED.includes(n) || n === 'rm' ? 1 : 0, red: 0, ok: 0 });
        });
        ringBox(c, chipsBox, rulesLit, C.accent, 2);
        text(c, 'シェルの先のプログラム', TOOL.x + 16, TOOL.y + TOOL.h - 42, { font: F.jp(700, 15), color: C.muted });
        keyRow(c, TOOL.x + 16, TOOL.y + TOOL.h - 18, 1, 0);
      },
    });
    const lw = text(ctx, 'ツール', TOOL.x, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    text(ctx, 'の場所', TOOL.x + lw, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    // 6-3's fence and care, clearing away
    if (gone > 0.001) {
      sandbox(ctx, gone);
      careCard(ctx, { card: gone, rows: [1, 1, 1], ch7: gone });
      ctx.save();
      ctx.globalAlpha *= gone;
      llmTag(ctx, NOTE_Y[0], 'コマンドを書く', 1);
      llmTag(ctx, NOTE_Y[1], '結果を読む', 1);
      llmTag(ctx, NOTE_Y[2], 'コマンドの使い方を学習', 1);
      text(ctx, '何を学んだかは、モデルによって違う', NOTE_X, NOTE_Y[2] + 52, { font: F.jp(500, 13), color: C.muted, align: 'center', alpha: 1 });
      ctx.restore();
    }

    // ——— under the LLM: what the LLM chose to do next, round by round; the limit the app set (e2)
    const fills = [...rounds.map((r) => [r.tok[PRE], r.fin]), [r4.tok[0], r4.fin]];
    steps(ctx, t, {
      head: pop('leave'),
      fills,
      slotFrom: [at('leave') - lead, ...fills.slice(0, 3).map(([, b]) => b)],
      limit: limitA,
      ringA: Math.max(orderLit, nextLit, chooseLit),
      limitLit: rulesLit,
    });

    // ——— above the LLM: who decides what (f, f2), then 1-1's parts (j), then the agents of 2025 (k)
    whoCard(ctx, {
      a: cardIn * (1 - cardOut),
      inner: cardIn,
      outer: pop('all'),
      rows: [pop('tools'), pop('rules'), pop('rules') * tw(t, at('rules') - lead + 0.2, pace.enter)],
      innerLit: nextLit,
    });
    miniParts(ctx, miniIn, [llm2Lit, appLit, toolLit], [pop('llm2'), pop('app'), pop('tool')]);
    releases(ctx, relIn, tw(t, at('many2') - lead + 0.6, pace.enter), RELEASES.map((_, k) => tw(t, at('term') - lead + k * 0.45, pace.enter)));

    // j: the three parts of the big picture, as 1-1's
    ring(ctx, L.app.x, L.app.y, L.app.w, L.app.h, appLit, C.accent, 22);
    ring(ctx, TOOL.x, TOOL.y, TOOL.w, TOOL.h, toolLit, C.accent, 20);

    // ——— h: the agent's frame and its name
    agentFrame(ctx, frameP, nameTag);

    // ——— in flight, over everything
    flyMark(ctx, T, U, seg(t, userAt, userAt + SLOW.fly), ROLE.user, { edge: WRITER.user, dy: -sy });
    [...rounds.map((r, k) => [r, { x: DOC.x + 18, y: calls[k].c.band.y }]), [r4, A]].forEach(([r, E]) => {
      flyMark(ctx, T, E, seg(t, r.mark, r.mark + r.sp.fly), ROLE.assistant, { edge: WRITER.assistant, dy: -sy });
    });
    calls.forEach(({ c, R }, k) => {
      const r = rounds[k];
      const sp = r.sp;
      const lane = { y: c.band.y, h: c.band.h };
      const po = seg(t, r.open, r.open + sp.eot);
      if (po > 0 && po < 1) {
        const pt = onPath(writePath(T, lane, c.open.x + c.open.w / 2, c.open.y + MARK_H / 2, -sy), inOutCubic(po));
        roleMark(ctx, pt.x - c.open.w / 2, pt.y - MARK_H / 2, ROLE.call, { edge: WRITER.call, alpha: clamp(po * 8) });
      }
      c.toks.forEach((tk, j) => {
        const p = seg(t, r.tok[j], r.tok[j] + sp.tok);
        if (p <= 0 || p >= 1) return;
        const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
        const pt = onPath(writePath(T, lane, tk.x + tk.w / 2, tk.y, -sy), inOutCubic(p));
        token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
      });
      const pe = seg(t, r.fin, r.fin + sp.eot);
      if (pe > 0 && pe < 1) {
        const pt = onPath(writePath(T, lane, c.end.x + c.end.w / 2, c.end.y + MARK_H / 2, -sy), inOutCubic(pe));
        roleMark(ctx, pt.x - c.end.w / 2, pt.y - MARK_H / 2, ROLE.callEnd, { edge: WRITER.callEnd, alpha: clamp(pe * 8) });
      }
      const band = { tx: c.band.x, w: c.band.w, y: c.band.y, h: c.band.h };
      chipFlight(ctx, seg(t, r.go, r.go + sp.go), toTool(T, band, -sy), CMDS[k], 'call');
      const bp = seg(t, r.back, r.back + sp.back);
      chipFlight(ctx, bp < 1 ? bp : 0.999, fromTool(T, R, -sy, R.tx + 120), '出力', 'found', bp < 1 ? null : 1 - tw(t, r.resIn - 0.05, 0.25));
      flyMark(ctx, T, R, seg(t, r.resMark, r.resMark + sp.fly), ROLE.result, { edge: WRITER.result, dy: -sy });
    });
    repToks.forEach((tk, k) => {
      const p = seg(t, r4.tok[k], r4.tok[k] + MID.tok);
      if (p <= 0 || p >= 1) return;
      const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
      const pt = onPath(writePath(T, A, tk.x + w / 2, tk.y, -sy), inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
    });
    const pe4 = seg(t, r4.fin, r4.endIn);
    if (pe4 > 0 && pe4 < 1) {
      const pt = onPath(writePath(T, A, aEnd.x + aEnd.w / 2, aEnd.y + MARK_H / 2, -sy), inOutCubic(pe4));
      roleMark(ctx, pt.x - aEnd.w / 2, pt.y - MARK_H / 2, ROLE.end, { edge: WRITER.end, alpha: clamp(pe4 * 8) });
    }

    // ——— the example's note (6-3's gives way)
    const ex = { x: L.app.x, y: L.app.y + L.app.h + 22 };
    const exW = measure(ctx, F.jp(700, 17), '例') + 20;
    example(ctx, ex.x, ex.y, 1, '');
    text(ctx, NOTE63, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: gone });
    text(ctx, NOTE, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: fresh });

    // ——— i: the opening's box, back for a moment, opens into this picture
    openingBox(ctx, boxIn, openP);
  },
});

// ——— 6-3's picture as it ends ———————————————————————————————————————————————————————————————

// 6-3's document: the question, the two calls and their output, the answer.
function drawOldDoc(ctx, o) {
  docEntry(ctx, o.Qm, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.Qm.x, o.Qm.y + 1, ROLE.user, { edge: WRITER.user });
  o.calls.forEach(([c, O]) => {
    roleMark(ctx, DOC.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    drawCall(ctx, c, { bandA: 1, open: true, n: c.toks.length, end: true });
    roleMark(ctx, O.x, O.y + 1, ROLE.result, { edge: WRITER.result });
    docEntry(ctx, O, 1, { tagAlpha: 0, chars: 1 });
  });
  roleMark(ctx, o.Am.x, o.Am.y + 1, ROLE.assistant, { edge: WRITER.assistant });
  docEntry(ctx, o.Am, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.amEnd.x, o.amEnd.y, ROLE.end, { edge: WRITER.end });
}

// 6-3's tags in the terminal: the command that deleted, and what it deleted.
function drawOldTerm(c, tm, a) {
  const rmLine = tm.box(10);
  tag(c, rmLine.x + rmLine.w + 12, rmLine.y, 'ファイルを消す', { font: F.jp(700, 12), h: 20, padX: 7, fill: '#fff', stroke: C.red, color: C.red, r: 5, alpha: a });
  const gone9 = tm.box(9, 'reports/', 'memo.txt  ');
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = C.red;
  c.lineWidth = 2.5;
  line(c, gone9.x - 2, gone9.y + gone9.h / 2, gone9.x + gone9.w + 2, gone9.y + gone9.h / 2, 1);
  c.restore();
  tag(c, gone9.x + gone9.w + 12, gone9.y, '消えた', { font: F.jp(700, 12), h: 20, padX: 7, fill: C.red, color: '#fff', r: 5, alpha: a });
}

// ——— this clip's pieces ———————————————————————————————————————————————————————————————————

// What the terminal shows, and when: the three commands (two of them over two lines) and their output.
function termLines(rounds) {
  return rounds.flatMap((r, k) => {
    const [cmd, cont] = TERM_CMDS[k];
    const out = [{ s: cmd, cmd: true, show: r.work, type: r.work + 0.02 }];
    if (cont) out.push({ s: cont, cont: true, show: r.work + 0.5, type: r.work + 0.52 });
    OUTS[k].forEach((s, j) => out.push({ s, show: r.outAt + j * 0.1 }));
    return out;
  });
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

// From the end of an output's row, by the bands' right edge, to the end of the next command's row.
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

// g: the report's two parts — what was found (green) and what is not known yet (grey), in the marks' column.
function reportKey(ctx, A, found, unknown) {
  const x = A.tx - 10;
  const y0 = A.y + 2;
  const parts = [[found, C.green, y0, A.y + A.lh * 2 - 4], [unknown, C.muted, A.y + A.lh * 2 + 2, A.y + A.h - 2]];
  parts.forEach(([a, color, ya, yb]) => {
    if (a <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = color;
    ctx.fillRect(x, ya, 3, yb - ya);
    ctx.restore();
  });
  tag(ctx, x - 7, A.y + 37, 'わかったこと', { font: F.jp(700, 11), h: 20, padX: 6, fill: '#fff', stroke: C.green, color: C.green, r: 5, align: 'right', alpha: found });
  tag(ctx, x - 7, A.y + A.lh * 2 + 4, 'まだわからないこと', { font: F.jp(700, 11), h: 20, padX: 6, fill: '#fff', stroke: C.muted, color: C.ink2, r: 5, align: 'right', alpha: unknown });
}

// Under the LLM: what it chose to do next, one row per round, with an open slot (？) for the next one;
// the limit on the rounds that the app sets (e2).
function steps(ctx, t, { head, fills, slotFrom, limit, ringA, limitLit }) {
  if (head <= 0.001) return;
  text(ctx, 'LLM が選ぶ次の行動', COL.x, COL.head, { font: F.jp(700, 15), color: C.ink2, alpha: head });
  const rowY = (k) => COL.top + k * COL.step;
  let filled = 0;
  fills.forEach(([a, b], k) => {
    const p = seg(t, a, b);
    if (p <= 0) {
      // the open slot, until the LLM writes its call
      const sa = tw(t, slotFrom[k], 0.35) * (k === 0 ? head : 1);
      if (sa > 0.001 && (k === 0 || t >= slotFrom[k])) slot(ctx, rowY(k), k + 1, sa);
      return;
    }
    filled = k + 1;
    const y = rowY(k);
    badgeN(ctx, COL.x + 12, y + COL.h / 2, String(k + 1), tw(t, a, 0.25));
    let left = Math.round(STEPS[k].reduce((n, [s]) => n + Array.from(s).length, 0) * p);
    let x = COL.x + 32;
    STEPS[k].forEach(([s, color]) => {
      const chars = Array.from(s);
      const shown = chars.slice(0, Math.max(0, left)).join('');
      left -= chars.length;
      x += text(ctx, shown, x, y + 21, { font: F.jp(500, 15), color: color ?? C.ink }) || 0;
    });
  });
  if (filled && ringA > 0.001) {
    const n = Math.min(filled, 3);
    ring(ctx, COL.x, COL.top, 268, rowY(n - 1) + COL.h - COL.top, ringA, C.accent);
  }
  // e2: the limit
  if (limit > 0.001) {
    ctx.save();
    ctx.globalAlpha *= limit;
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    line(ctx, COL.x, LIMIT_Y, COL.x + 268, LIMIT_Y, limit);
    ctx.setLineDash([]);
    ctx.restore();
    text(ctx, '周の数の上限（アプリが決める）', COL.x, LIMIT_Y + 22, { font: F.jp(700, 14), color: C.purple, alpha: limit });
    ring(ctx, COL.x, LIMIT_Y - 6, 268, 34, limitLit * limit, C.accent);
  }
}

function slot(ctx, y, n, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);
  rr(ctx, COL.x, y, 150, COL.h, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  text(ctx, String(n), COL.x + 12, y + 20, { font: F.sans(700, 13), color: C.muted, align: 'center', alpha: a });
  text(ctx, '？', COL.x + 32, y + 21, { font: F.jp(700, 16), color: C.muted, alpha: a });
}

// A round's number: an ink disc (the LLM chose it).
function badgeN(ctx, x, y, s, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  text(ctx, s, x, y + 1, { font: F.sans(700, 13), color: '#fff', align: 'center', base: 'middle', alpha: a });
}

// f, f2: who decides what. The designer prepares (outer, purple: the app's colour); within it, the LLM picks
// the next action from what it reads (inner, ink).
function whoCard(ctx, { a, inner, outer, rows, innerLit }) {
  if (a <= 0.001) return;
  const b = CARD;
  ctx.save();
  ctx.globalAlpha *= a;
  if (outer > 0.001) {
    ctx.save();
    ctx.globalAlpha *= outer;
    rr(ctx, b.x, b.y, b.w, b.h, 16);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
    text(ctx, 'アプリを作る人が、前もって用意する', b.x + 16, b.y + 32, { font: F.jp(700, 16), color: C.purple, alpha: outer });
  }
  ['ツール：シェル（bash）', '許す範囲：コマンド、ユーザー確認', 'くり返しの作りと、周の上限'].forEach((s, k) => {
    text(ctx, s, b.x + 16, b.y + 66 + k * 30, { font: F.jp(500, 15), color: C.ink, alpha: rows[k] });
  });
  if (inner > 0.001) {
    const i = INNER;
    ctx.save();
    ctx.globalAlpha *= inner;
    rr(ctx, i.x, i.y, i.w, i.h, 12);
    ctx.fillStyle = C.paper;
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    text(ctx, 'LLM が、結果を見ながら選ぶ', i.x + 14, i.y + 32, { font: F.jp(700, 16), color: C.ink, alpha: inner });
    text(ctx, 'どの順に、何を調べるか', i.x + 14, i.y + 66, { font: F.jp(500, 15), color: C.ink, alpha: inner });
    text(ctx, '（次の行動）', i.x + 14, i.y + 94, { font: F.jp(500, 14), color: C.ink2, alpha: inner });
    ring(ctx, i.x, i.y, i.w, i.h, innerLit * inner, C.accent, 12);
  }
  ctx.restore();
}

// j: 1-1's picture of the agent's parts, small. lits: the rings; labels: what each does.
function miniParts(ctx, a, lits, labels) {
  if (a <= 0.001) return;
  const m = MINI;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, m.x, m.y, m.w, m.h, 14);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.stroke();
  tag(ctx, m.x + 14, m.y - 15, 'AI エージェント', { font: F.jp(700, 14), h: 30, padX: 11, fill: C.ink, color: C.paper });
  text(ctx, '1-1 で見た部品', m.x + m.w, m.y - 22, { font: F.jp(500, 14), color: C.muted, align: 'right' });
  const y = m.y + 26;
  const h = 66;
  const P = [{ x: m.x + 16, w: 66 }, { x: m.x + 112, w: 110 }, { x: m.x + 252, w: 52 }];
  // the LLM
  rr(ctx, P[0].x, y, P[0].w, h, 12);
  ctx.fillStyle = C.ink;
  ctx.fill();
  text(ctx, 'LLM', P[0].x + P[0].w / 2, y + h / 2 + 1, { font: F.sans(700, 20), color: C.paper, align: 'center', base: 'middle' });
  // the app, with its document
  rr(ctx, P[1].x, y, P[1].w, h, 12);
  ctx.fillStyle = C.panel;
  ctx.fill();
  text(ctx, 'アプリ', P[1].x + 10, y + 22, { font: F.jp(700, 14), color: C.ink });
  rr(ctx, P[1].x + 10, y + 32, P[1].w - 20, 24, 6);
  ctx.fillStyle = '#fff';
  ctx.fill();
  // the tools
  rr(ctx, P[2].x, y, P[2].w, h, 10);
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.setLineDash([]);
  text(ctx, 'ツール', P[2].x + P[2].w / 2, y + h / 2 + 1, { font: F.jp(700, 12), color: C.ink, align: 'center', base: 'middle' });
  // the links between them
  ctx.strokeStyle = C.ink2;
  ctx.fillStyle = C.ink2;
  ctx.lineWidth = 1.8;
  [[P[0], P[1]], [P[1], P[2]]].forEach(([p, q]) => {
    const x1 = p.x + p.w + 5;
    const x2 = q.x - 5;
    arrow(ctx, x2, y + h / 2 - 8, x1, y + h / 2 - 8, 1, 7);
    arrow(ctx, x1, y + h / 2 + 8, x2, y + h / 2 + 8, 1, 7);
  });
  ctx.restore();
  P.forEach((p, k) => ring(ctx, p.x, y, p.w, h, lits[k] * a, C.accent, 10));
  const LABELS = ['選ぶ', '実行と受け渡し', 'シェル'];
  P.forEach((p, k) => text(ctx, LABELS[k], p.x + p.w / 2, m.y + m.h + 26, { font: F.jp(700, 14), color: C.ink2, align: 'center', alpha: labels[k] * a }));
}

// k: agents used from the terminal, 2025, and where their LLM runs (not in the terminal).
function releases(ctx, a, note, rows) {
  if (a <= 0.001) return;
  const b = CARD;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, b.x, b.y, b.w, b.h, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  const w0 = text(ctx, '2025', b.x + 16, b.y + 40, { font: F.cond(700, 34), color: C.ink, alpha: a });
  text(ctx, 'ターミナルのエージェント', b.x + 16 + w0 + 12, b.y + 36, { font: F.jp(700, 17), color: C.ink, alpha: a });
  RELEASES.forEach(([date, name, kind], k) => {
    const ra = rows[k] * a;
    const y = b.y + 80 + k * 50;
    text(ctx, name, b.x + 16, y, { font: F.sans(600, 19), color: C.ink, alpha: ra });
    text(ctx, `${date}　${kind}`, b.x + 16, y + 21, { font: F.jp(400, 14), color: C.ink2, alpha: ra });
  });
  const na = note * a;
  text(ctx, 'ターミナルで動くのは、アプリの部分。', b.x + 16, b.y + 236, { font: F.jp(500, 14), color: C.ink2, alpha: na });
  text(ctx, 'LLM は、既定では、API の先の提供元で動く。', b.x + 16, b.y + 257, { font: F.jp(500, 14), color: C.ink2, alpha: na });
  text(ctx, SOURCE, b.x + 16, b.y + b.h - 12, { font: F.jp(400, 12), color: C.muted, alpha: rows[2] * a });
}

// h: the agent's frame — the LLM, the app and the tools inside, the screen and the cards outside — and its name.
function agentFrame(ctx, p, nameA) {
  if (p <= 0.001) return;
  ctx.save();
  framePath(ctx, FRAME, 22);
  const len = perimeter(FRAME);
  ctx.setLineDash([len * p, len + 10]);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  tag(ctx, FRAME[2][0] + 28, FRAME[2][1] - 20, 'AI エージェント', { font: F.jp(700, 20), h: 40, padX: 16, fill: C.ink, color: C.paper, alpha: nameA });
}

// i: the opening's box (lib/cover.js), closed, over a veil; then it opens into the agent's frame.
function openingBox(ctx, a, open) {
  if (a <= 0.001 || open >= 1) return;
  // the veil over this picture, lifting as the box opens
  ctx.save();
  ctx.globalAlpha = 0.82 * a * (1 - open);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, 1600, 900);
  ctx.restore();
  const pts = FRAME.map((q, k) => [lerp(FROM[k][0], q[0], open), lerp(FROM[k][1], q[1], open)]);
  const sc = lerp(0.94, 1, a);
  const cx = BOX.x + BOX.w / 2;
  const cy = BOX.y + BOX.h / 2;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(cx, cy);
  ctx.scale(sc, sc);
  ctx.translate(-cx, -cy);
  framePath(ctx, pts, lerp(BOX.r, 22, open));
  ctx.save();
  ctx.globalAlpha *= 1 - seg(open, 0, 0.7);
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.restore();
  if (open > 0) {
    ctx.save();
    ctx.globalAlpha *= open;
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
  const fade = 1 - seg(open, 0, 0.45);
  coverBox(ctx, BOX, DONE, { fill: 0, outline: 0, head: fade, rows: fade });
  ring(ctx, BOX.x, BOX.y, BOX.w, BOX.h, fade, C.accent, BOX.r);
  tag(ctx, BOX.x + BOX.w, BOX.y - 60, 'この中は？', { font: F.jp(700, 22), h: 42, padX: 18, fill: C.accent, color: '#fff', alpha: fade, align: 'right' });
  ctx.restore();
}

// A closed outline through the corners pts, each rounded by up to r.
function framePath(ctx, pts, r) {
  const n = pts.length;
  const d = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  const first = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  for (let i = 0; i < n; i++) {
    const o = pts[(i - 1 + n) % n];
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const rr0 = Math.min(r, d(o, p) / 2, d(p, q) / 2);
    if (rr0 < 0.5) ctx.lineTo(p[0], p[1]);
    else ctx.arcTo(p[0], p[1], q[0], q[1], rr0);
  }
  ctx.closePath();
}

const perimeter = (pts) => pts.reduce((n, p, i) => n + Math.hypot(pts[(i + 1) % pts.length][0] - p[0], pts[(i + 1) % pts.length][1] - p[1]), 0);
