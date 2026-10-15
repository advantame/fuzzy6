// 6-5: fixing code. One of the things agents are used for is writing and fixing programs. Asked to make the
// tests pass, the agent here starts by running the tests (pytest, through the shell). It reads the failing
// test's output, looks for the file that matters (grep for the function the test calls), and once found,
// reads it (cat). Knowing where to fix, it fixes the code with a tool that rewrites files (edit_file: the
// app runs it at the LLM's request), runs the tests again and sees them pass — and if they had not, it would
// read the output and fix again. A test's result is text too, so the LLM reads whether the code did what the
// written condition says; but a passing test does not mean every mistake is gone (the test checks only the
// condition it writes down: average([]) is not checked). Without tests, the LLM may be made to write one
// first. SWE-bench (2023, the original) collected 2,294 issues actually reported in 12 Python projects, and
// checks with tests whether the code was fixed so that an issue is solved. How to read its scores is for
// chapter 10.
//
// The layout is 6-1's to 6-4's (lib/terminal.js) with the tool's place taller and the screen shorter (G65),
// so that the shell and the files fit one above the other. The clip joins 6-4 (spec §6.10): its first frame
// is 6-4's last picture, drawn here as agent.js draws it, and the bridge clears 6-4's conversation, its
// columns and cards, the agent's frame, the programs under the shell, then moves the screen and the tool's
// place to this clip's places. Everything in the conversation is an example: the request, the code and the
// test, the commands and their output, the edit, the answer (cut into tokens as o200k_base cuts them), the
// definition of edit_file (research/connect-facts 6-5).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import {
  chatScreen, screenBubbles, chatBubble, screenLinks, toTool, fromTool, writePath, flyMark, llmBlock, appFrame, toolBox,
  channel, actor, token, TOKEN, tokenPlaces, onPath, docLayout, docEntry, rowAt, sweep, send, roleMark, markWidth,
  MARK_H, ROLE, WRITER, loopIcon, toolUseLayout, mix,
} from '../lib/rig.js';
import {
  G6, T, L, ACT, SCREEN, TOOL, DOC, MFONT, DX, SYS, defY, DEFS, defRows, drawDef, callLayout, drawCall, lookLine, halt,
  chipFlight, channelNames, CHIP, programChips, terminal, progChip, keyRow, gate, check, LOCKED,
} from '../lib/terminal.js';
import { text, measure, rr, path, line, arrow, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { focus, ring, ringBox } from '../../../src/kit/cue.js';

const TFONT = F.jp(500, 20); // text in the document
const MLH = 26; // a row of a call
const RLH = 24; // a row of a command's output
const VIS64 = DOC.y + DOC.h - 12; // the lowest 6-4's written part may reach before its document scrolls
const VIS = DOC.y + DOC.h - 20; // this clip's: the LLM's tokens run under the entry they write, inside the frame

// ——— 6-4's last picture, as agent.js has it (its last frame is this clip's first) ————————————————
const ASK64 = 'ログを調べて、エラーが多い日と、\nその中身を教えて';
const ROW0 = ['{"', 'name', '":', ' "', 'bash', '",', ' "', 'input', '":', ' {"', 'command', '":'];
const CALLS64 = [
  [ROW0, [' "', 'grep', ' -', 'c', ' ERROR', ' logs', '/*.', 'log', '"}}']],
  [ROW0, [' "', 'grep', ' ERROR', ' logs', '/', '202', '6', '-', '10', '-', '07', '.log'], [' |', ' head', ' -', '3', '"}}']],
  [ROW0, [' "', 'grep', ' -', 'c', " '", 'db', ':', ' timeout', "'"], [' logs', '/', '202', '6', '-', '10', '-', '07', '.log', '"}}']],
];
const OUTS64 = [
  ['logs/2026-10-06.log:3', 'logs/2026-10-07.log:41', 'logs/2026-10-08.log:5'],
  ['ERROR db: timeout after 30s', 'ERROR db: timeout after 30s', 'ERROR db: timeout after 30s'],
  ['38'],
];
const TERM_CMDS64 = [['grep -c ERROR logs/*.log'], ['grep ERROR logs/2026-10-07.log', '| head -3'], ["grep -c 'db: timeout'", 'logs/2026-10-07.log']];
const REPORT64 = '10月7日が41件で最も多く、うち38件は\nデータベースの時間切れでした。\n理由は、ログからはまだ不明です。';
const NOTE64 = '依頼、ログ、コマンド、出力、報告は説明のための例';
const CHIP_ORDER = ['find', 'ls', 'grep', 'python3', 'bc', 'date', 'git', 'cat', 'sort', 'wc', 'sed', 'cp', 'mv', 'rm', 'curl', 'ssh', 'sudo', '…'];
const STEPS64 = [
  [['日ごとのエラーを数える']],
  [['10月7日', C.accent], ['のエラーの中身を見る']],
  [['時間切れ', C.accent], ['の件数を数える']],
  [['報告にまとめる']],
];
const COL64 = { x: 84, head: 597, top: 616, step: 38, h: 30 };
const LIMIT_Y64 = COL64.top + 4 * COL64.step + 8;
const CARD64 = { x: 30, y: 46, w: 326, h: 290 };
const RELEASES = [
  ['2 月 24 日', 'Claude Code', '研究プレビュー'],
  ['4 月 16 日', 'Codex CLI', 'オープンソース'],
  ['6 月 25 日', 'Gemini CLI', 'オープンソースのプレビュー'],
];
const SOURCE64 = '出典：Anthropic、OpenAI、Google の発表';
const FRAME = [[70, 350], [372, 350], [372, 72], [1124, 72], [1124, 356], [1522, 356], [1522, 824], [70, 824]];

// ——— this clip's layout: the screen shorter, the tool's place taller (the shell over the files) ——————————
const G65 = { ...G6, tool: { x: G6.tool.x, y: 350, w: G6.tool.w, h: 420 } };
const T5 = toolUseLayout(G65);
const L5 = T5.L;
const SCREEN5 = { ...T5.SCREEN, h: 200 };
const TOOL5 = L5.tool;
const TERM5 = { x: TOOL5.x + 14, y: TOOL5.y + 14, w: TOOL5.w - 28, h: 160 };
const FILES = { x: TOOL5.x + 14, y: TERM5.y + TERM5.h + 12, w: TOOL5.w - 28, h: TOOL5.y + TOOL5.h - 14 - (TERM5.y + TERM5.h + 12) };

// ——— this clip's conversation (an example) ———————————————————————————————————————————————
const ASK = 'テストが通るように直して';
// the head: the shell (kept from 6-3) and a tool that rewrites a part of a file (its wording is an example)
const DEFS5 = [
  ...DEFS,
  [['edit_file', F.jp(700, 17)], ['：ファイルの一部を書き換える', F.jp(500, 17)]],
  [['入力：path、old、new（元の文字と、新しい文字）', F.jp(500, 17)]],
];
// the LLM's five calls, row by row, as o200k_base cuts them (15, 23, 17, 36 and 15 tokens; none splits a character)
const EDIT_ROWS = [
  ['{"', 'name', '":', ' "', 'edit', '_file', '",', ' "', 'input', '":'],
  [' {"', 'path', '":', ' "', 'average', '.py', '",'],
  [' "', 'old', '":', ' "', 'len', '(xs', ')', ' +', ' ', '1', '",'],
  [' "', 'new', '":', ' "', 'len', '(xs', ')"', '}}'],
];
const CALLS = [
  { rows: [ROW0, [' "', 'pytest', '"}}']], pre: 13, chip: 'pytest' },
  { rows: [ROW0, [' "', 'grep', ' -', 'n', " '", 'def', ' average', "'"], [' *.', 'py', '"}}']], pre: 13, chip: 'grep …' },
  { rows: [ROW0, [' "', 'cat', ' average', '.py', '"}}']], pre: 13, chip: 'cat …' },
  { rows: EDIT_ROWS, pre: 4, chip: 'edit_file' },
  { rows: [ROW0, [' "', 'pytest', '"}}']], pre: 13, chip: 'pytest' },
];
// what came back (the app writes it in; no tokens): the shell's output, and the edit tool's report
const OUTS = [
  ['>   assert average([2, 4]) == 3', 'E   assert 4.0 == 3', '1 failed'],
  ['average.py:1:def average(xs):'],
  ['def average(xs):', '    return sum(xs) / len(xs) + 1'],
  ['average.py を書き換えました'],
  ['1 passed'],
];
// the terminal shows the four commands that went to the shell (the edit does not)
const TERM_OUT = [
  [['pytest'], [['>   assert average([2, 4]) == 3'], ['E   assert 4.0 == 3', 'err'], ['1 failed', 'err']]],
  [["grep -n 'def average' *.py"], [['average.py:1:def average(xs):']]],
  [['cat average.py'], [['def average(xs):'], ['    return sum(xs) / len(xs) + 1']]],
  null,
  [['pytest'], [['1 passed', 'ok']]],
];
// the answer (o200k_base: 21 tokens); in the document and on the screen it breaks after 「、」
const ANSWER = ['average', '.py', ' の', '「', '+', ' ', '1', '」を', '消', 'して', '、', 'テ', 'スト', 'が', '通', 'る', 'よう', 'に', '直', 'しました', '。'];
const ANS_DOC = 'average.py の「+ 1」を消して、\nテストが通るように直しました。';
const NOTE = '依頼、コード、テスト、コマンド、出力、答え、edit_file の定義は説明のための例';

// the files, as the tool's place shows them
const FFONT = F.mono(500, 14);
const AVG = ['def average(xs):', '    return sum(xs) / len(xs)', ' + 1'];
const TEST = ['def test_average():', '    assert average([2, 4]) == 3'];
const NOT_CHECKED = '空のリストのときなどは、確かめていない'; // average([]) divides by zero; the test does not try it
const FY = { title: 22, avgName: 50, avg: [70, 89], testName: 118, test: [138, 157], note: [182, 202] };
const FX = FILES.x + 16; // where the code starts

// ——— under the LLM: what the LLM chose to do next, one row per round, and the way back when a test fails
const STEPS = [
  ['テストを動かす', 'pytest'],
  ['ファイルを探す', 'grep'],
  ['中身を読む', 'cat'],
  ['コードを直す', 'edit_file'],
  ['テストをもう一度', 'pytest'],
];
const COL = { x: 84, head: 590, top: 606, step: 37, h: 30, w: 268 };

// ——— above the LLM: the card of writing the test first (h), then SWE-bench (i, i2, j)
const CARD = { x: 30, y: 46, w: 336, h: 306 };
const FIRST_H = 290; // the card of writing the test first is shorter

// ——— how fast a round goes: the first slowly, the next ones faster
const SLOW = { fly: 0.55, tok: 0.42, eot: 0.5, read: 0.95, step: 0.32, go: 0.6, out: 0.5, work: 1.15, back: 0.65 };
const FAST = { fly: 0.4, tok: 0.3, eot: 0.34, read: 0.55, step: 0.18, go: 0.4, out: 0.45, work: 0.9, back: 0.45 };
const EDIT = { ...FAST, eot: 0.25, step: 0.12, go: 0.3, out: 0.2, work: 1.1 };
const MID = { fly: 0.5, tok: 0.38, eot: 0.45, read: 0.8, step: 0.28, go: 0.5, out: 0.9, work: 1.2, back: 0.55 };

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n times, evenly from a, the last one landing (after a flight of fly) by b
const times = (n, a, b, fly) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - fly - a)) / Math.max(1, n - 1));
// a call's token times: the JSON up to the command from a, then the command from wAt, landing by wEnd
function callTimes(nPre, nW, a, wAt, wEnd, fly) {
  const pre = times(nPre, a, Math.max(wAt + fly - 0.05, a + nPre * 0.04 + fly), fly);
  const w0 = Math.max(wAt, pre[pre.length - 1] + 0.05);
  return [...pre, ...times(nW, w0, Math.max(wEnd, w0 + nW * 0.05 + fly), fly)];
}
// after the call is written: the app stops the LLM, passes the call on, the tool runs it, the result comes
// back and is written in
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
  id: 'coding',
  title: 'コードを直す',
  kicker: 'コーディングエージェント',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 1.2, // 6-4's conversation, columns, cards and frame clear away, then the tool's place grows
  script: [
    { id: 'a', text: 'エージェントの使い道の一つが、\n{write}プログラムを書いたり、{fix}直したりする仕事よ。' },
    { id: 'b', tail: 2.6, rest: 'short', text: 'ここでは、ユーザーが\n{ask}「テストが通るように[直して」と|なおしてと]頼んだとして、\n\n{run}エージェントが、まずテストを動かすところから、\n見てみましょう。' },
    { id: 'c', lead: 1.5, tail: 2.6, rest: 'short', text: '{readout}エージェントは、失敗したテストの出力を読んで、\n{search}関係するファイルを探すの。' },
    { id: 'c2', lead: 0.9, tail: 2.5, text: '{found}見つかったら、{open}その中身を読むわ。' },
    { id: 'd', lead: 1.4, tail: 2.1, still: true, text: '{where}直す場所がわかったら、{tool}ファイルを書き換えるツールで、\n{fixit}コードを直すわ。' },
    { id: 'e', lead: 1.0, tail: 0.4, text: 'そして、{again}もう一度テストを動かして、{pass}通ることを確かめるの。' },
    { id: 'e2', still: true, text: '{fail}通らなければ、{readout2}その出力を読んで、{refix}また直すわ。' },
    { id: 'f', tail: 1.5, text: '{text}テストの結果もテキストで返せるから、\n{read}それを LLM に読ませれば、\n\n{cond}書いた条件のとおりに動いたかが、\n{know}LLM にもわかるわ。' },
    { id: 'f2', still: true, text: 'ただ、{pass2}テストが[通っても|とおっても]、\n{all}間違いがすべてなくなったとは限らないの。' },
    { id: 'g', by: 'zunda', text: '{none}テストがなかったら、{how}どうするのだ？' },
    { id: 'h', still: true, text: 'そのときは、{want}ユーザーがどう動いてほしいかをもとに、\n\n{write2}確かめるためのテストを、\n{first}エージェントに先に書かせることもあるわ。' },
    { id: 'i', text: '2023 年に公開された {swe}[SWE-bench|スウィーベンチ] は、\n{proj}[12 の|じゅうにの] Python のプロジェクトから作った試験よ。' },
    { id: 'i1', text: '{real}実際にプロジェクトに報告された課題が、\n{n}2,294 件入っているわ。' },
    { id: 'i2', still: true, text: '{fixc}試すモデルにコードを直させて、\n{solved}課題を解けたかを、{bytest}テストで確かめるの。' },
    { id: 'j', text: '{score}ただ、点の読み方には、注意が要るわね。\n{ch10}10 章で、くわしく見ていきましょう。' },
  ],

  prepare(ctx) {
    // ——— 6-4's last picture, laid out as agent.js lays it out
    const opts = { ...T.DOC, font: TFONT, lh: 28 };
    const one = (e, yy) => docLayout(ctx, L, [e], { ...opts, top: yy - DOC.y })[0];
    const defs64 = defRows(ctx, DEFS);
    let y = defY(1) + 28;
    const U64 = one({ role: 'user', text: ASK64 }, y);
    y = U64.y + U64.h + 12;
    const calls64 = CALLS64.map((rows, k) => {
      const c = callLayout(ctx, { x: DX, y, w: U64.w, h: rows.length * MLH + 16 }, rows, MLH, { hang: true });
      y = c.band.y + c.band.h + 10;
      const R = one({ role: 'result', kind: 'data', text: OUTS64[k].join('\n'), font: MFONT, lh: RLH }, y);
      y = R.y + R.h + 12;
      return { c, R };
    });
    const A64 = one({ role: 'assistant', text: REPORT64, lh: 30 }, y + 2);
    const aRow64 = rowAt(A64, 2);
    const aEnd64 = { x: aRow64.x + measure(ctx, A64.font, A64.rows[2]) + 14, y: aRow64.y - 21, w: markWidth(ctx, ROLE.end.name) };
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
    const sp64 = {
      day: inOut(calls64[0].R, 1, '2026-10-07', 'logs/'),
      n41: inOut(calls64[0].R, 1, '41', 'logs/2026-10-07.log:'),
      row07: inOut(calls64[0].R, 1, OUTS64[0][1], ''),
      day2: inCall(calls64[1].c, 17, 22),
      timeout: inOut(calls64[1].R, 0, 'db: timeout', 'ERROR '),
      timeout3: inCall(calls64[2].c, 17, 19),
      log: inText(U64, 0, 'ログ', ''),
      err: inText(U64, 0, 'エラー', 'ログを調べて、'),
      logs1: inCall(calls64[0].c, 16, 19),
    };
    const links64 = [
      { from: { x: U64.tx + measure(ctx, U64.font, U64.rows[0]) + 8, y: rowAt(U64, 0).y - 7 }, to: { x: calls64[0].c.end.x + calls64[0].c.end.w + 10, y: sp64.logs1.y + 10 } },
      { from: { x: sp64.row07.x + sp64.row07.w + 8, y: sp64.row07.y + 10 }, to: { x: rowEnd(calls64[1].c, 1) + 8, y: sp64.day2.y + 10 } },
      { from: { x: inOut(calls64[1].R, 0, OUTS64[1][0], '').x + inOut(calls64[1].R, 0, OUTS64[1][0], '').w + 8, y: sp64.timeout.y + 10 }, to: { x: rowEnd(calls64[2].c, 1) + 8, y: sp64.timeout3.y + 10 } },
    ];
    const laneX64 = calls64[0].c.band.x + calls64[0].c.band.w - 14;
    // the scroll 6-4 ends with, summed as agent.js sums it
    let need = 0;
    let sy64 = 0;
    [...calls64.flatMap(({ c, R }) => [c.band.y + c.band.h, R.y + R.h]), A64.y + A64.h].forEach((bottom) => {
      const to = Math.max(need, bottom - VIS64);
      if (to > need) sy64 += (to - need) * 1;
      need = to;
    });
    const Bs64 = screenBubbles(ctx, SCREEN, [['user', ASK64], ['assistant', REPORT64]], { font: F.jp(500, 15), gap: 12 });
    const { posB } = programChips(ctx);
    const lines64 = TERM_CMDS64.flatMap(([cmd, cont], k) => {
      const out = [{ s: cmd, cmd: true, show: -10, type: -10 }];
      if (cont) out.push({ s: cont, cont: true, show: -10, type: -10 });
      OUTS64[k].forEach((s) => out.push({ s, show: -10 }));
      return out;
    });
    const old = { defs: defs64, U: U64, calls: calls64, A: A64, aEnd: aEnd64, spans: sp64, links: links64, laneX: laneX64, sy: sy64, Bs: Bs64, posB, lines: lines64 };

    // ——— this clip's document: the head (bash, then edit_file), the request, five calls with what came back, the answer
    const defs = defRows(ctx, DEFS5);
    defs.forEach((d, k) => { if (d.right > DOC.x + DOC.w - 18) throw new Error(`coding: definition row ${k} is too wide`); });
    const editBox = { x: DX - 4, y: defY(2) - 20, w: Math.max(defs[2].right, defs[3].right) - DX + 8, h: defY(3) + 6 - defY(2) + 20 };
    y = defY(3) + 28;
    const U = one({ role: 'user', text: ASK }, y);
    y = U.y + U.h + 12;
    const calls = CALLS.map(({ rows }, k) => {
      const c = callLayout(ctx, { x: DX, y, w: U.w, h: rows.length * MLH + 16 }, rows, MLH, { hang: true });
      if (c.end.x + c.end.w > c.band.x + c.band.w - 6) throw new Error(`coding: call ${k + 1}'s end mark does not fit`);
      c.toks.forEach((tk) => { if (tk.x + tk.w > c.band.x + c.band.w - 6) throw new Error(`coding: call ${k + 1} is too wide`); });
      y = c.band.y + c.band.h + 10;
      const R = one({ role: 'result', kind: 'data', text: OUTS[k].join('\n'), font: MFONT, lh: RLH }, y);
      if (R.rows.length !== OUTS[k].length) throw new Error(`coding: result ${k + 1} takes ${R.rows.length} rows`);
      y = R.y + R.h + 12;
      return { c, R };
    });
    const A = one({ role: 'assistant', text: ANS_DOC, lh: 30 }, y + 2);
    if (A.rows.length !== 2) throw new Error(`coding: the answer takes ${A.rows.length} rows`);
    const ansToks = tokenPlaces(ctx, A, ANSWER);
    const aRow = rowAt(A, 1);
    const aEnd = { x: aRow.x + measure(ctx, A.font, A.rows[1]) + 14, y: aRow.y - 21, w: markWidth(ctx, ROLE.end.name) };
    if (aEnd.x + aEnd.w > A.tx + A.w) throw new Error('coding: the answer\'s end mark does not fit');
    // the pieces the next call takes from what came before (doc coordinates)
    // (token indices: grep's ' average' is 18, cat's '.py' 15, the edit's ' +', ' ', '1' are 24–26)
    const spans = {
      average: inOut(calls[0].R, 0, 'average', '>   assert '),
      four: inOut(calls[0].R, 1, '4.0', 'E   assert '),
      defAvg: inCall(calls[1].c, 17, 18),
      file: inOut(calls[1].R, 0, 'average.py', ''),
      catFile: inCall(calls[2].c, 14, 15),
      plus: inOut(calls[2].R, 1, '+ 1', '    return sum(xs) / len(xs) '),
      oldPlus: inCall(calls[3].c, 24, 26),
    };
    // the links: from the end of the row read to the end of the row of the next call that uses it
    const outEnd = (R, row) => ({ x: rowAt(R, row).x + measure(ctx, MFONT, OUTS[calls.findIndex((q) => q.R === R)][row]) + 8, y: rowAt(R, row).y - 5 });
    // (on a call's last row, the arrow points past its end mark)
    const inEnd = (c, row) => (row === c.toks[c.toks.length - 1].row ? c.end.x + c.end.w + 10 : rowEnd(c, row) + 8);
    const links = [
      { from: outEnd(calls[0].R, 0), to: { x: inEnd(calls[1].c, 1), y: spans.defAvg.y + 10 } },
      { from: outEnd(calls[1].R, 0), to: { x: inEnd(calls[2].c, 1), y: spans.catFile.y + 10 } },
      { from: outEnd(calls[2].R, 1), to: { x: inEnd(calls[3].c, 2), y: spans.oldPlus.y + 10 } },
    ];
    const laneX = calls[0].c.band.x + calls[0].c.band.w - 14;
    links.forEach((ln, k) => { if (Math.max(ln.from.x, ln.to.x) > laneX - 16) throw new Error(`coding: link ${k + 1} has no room at the band's edge`); });
    // the screen: the request and the answer
    const Bs = screenBubbles(ctx, SCREEN5, [['user', ASK], ['assistant', ANS_DOC]], { font: F.jp(500, 15), gap: 12 });
    const lastB = Bs[Bs.length - 1];
    if (lastB.y + lastB.L.h > SCREEN5.y + SCREEN5.h - 8) throw new Error(`coding: the screen overflows (${lastB.y + lastB.L.h})`);
    // the files
    const fw = (s) => measure(ctx, FFONT, s);
    if (FX + fw(AVG[1] + AVG[2]) > FILES.x + FILES.w - 10) throw new Error('coding: average.py is too wide');
    if (FX + fw(TEST[1]) > FILES.x + FILES.w - 10) throw new Error('coding: the test is too wide');
    const files = {
      plusX: FX + fw(AVG[1]),
      plusW: fw(AVG[2]),
      assertW: fw(TEST[1]),
      chipW: measure(ctx, CHIP.font, 'edit_file') + CHIP.padX * 2,
    };
    return { old, defs, editBox, U, calls, A, ansToks, aEnd, spans, links, laneX, Bs, files };
  },

  draw(ctx, t, s, { at, pace }) {
    const { old, defs, editBox, U, calls, A, ansToks, aEnd, spans, links, laneX, Bs, files } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 6-4's picture clears away, then the screen and the tool's place move to this clip's places
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.5));
    const gp = inOutCubic(seg(t, br * 0.4, br));
    const fresh = inOutCubic(seg(t, br * 0.6, br));
    const Lb = mix(G6, G65, gp);
    const Lx = { ...L5, tool: Lb.tool, call: Lb.call, back: Lb.back };
    const termBox = { x: Lb.tool.x + 14, y: Lb.tool.y + 14, w: Lb.tool.w - 28, h: 160 };
    const screen = { ...SCREEN5, h: lerp(SCREEN.h, SCREEN5.h, gp) };

    // ——— when things happen
    // a: the files come in, and the definition of the tool that rewrites them
    const filesIn = tw(t, at('a') + 0.1, pace.ground);
    const codeP = seg(t, at('write') - lead, at('write') - lead + 1.2);
    const defAt = at('fix') - lead;
    const defP = (k) => seg(t, defAt + 0.25 + (k - 2) * 0.45, defAt + 0.25 + (k - 2) * 0.45 + 0.5);
    // b: the request
    const askAt = at('ask') - lead;
    const userAt = askAt + 0.45;
    // b–e: five rounds; each, the app writes the assistant's mark and has the LLM read, the LLM writes a call,
    // the app stops it and runs the call (in the shell, or with the edit tool), and writes what came back in
    const r1 = { sp: SLOW, mark: userAt + SLOW.fly + 0.15 };
    r1.read = r1.mark + SLOW.fly - 0.1;
    r1.wrote = r1.read + SLOW.read;
    r1.open = Math.max(r1.wrote, at('run') - 0.6);
    r1.tok = callTimes(13, 2, r1.open + SLOW.eot - 0.2, at('b.end') - 0.15, at('b.end') + 0.45, SLOW.tok);
    follow(r1);
    const r2 = { sp: FAST, mark: Math.max(r1.done, at('c') + 0.05) };
    r2.read = Math.max(r2.mark + FAST.fly - 0.1, at('readout') - 0.3);
    r2.wrote = r2.read + FAST.read;
    r2.open = r2.wrote;
    r2.tok = callTimes(13, 10, r2.open + FAST.eot - 0.15, at('search') - 0.1, at('c.end') - 0.1, FAST.tok);
    follow(r2);
    const r3 = { sp: FAST, mark: Math.max(r2.done, at('c2') + 0.05) };
    r3.read = Math.max(r3.mark + FAST.fly - 0.1, at('found') - 0.3);
    r3.wrote = r3.read + FAST.read;
    r3.open = r3.wrote;
    r3.tok = callTimes(13, 4, r3.open + FAST.eot - 0.15, at('open') - 0.1, at('c2.end') - 0.1, FAST.tok);
    follow(r3);
    const r4 = { sp: EDIT, mark: Math.max(r3.done, at('d') + 0.05) };
    r4.read = Math.max(r4.mark + EDIT.fly - 0.1, at('where') - 0.5);
    r4.wrote = r4.read + EDIT.read;
    r4.open = r4.wrote;
    // the tool's name lands as the voice names it; the rest follows quickly, so that the app stops it at 「コードを直す」
    r4.tok = [...times(4, r4.open + EDIT.eot - 0.15, at('tool') - 0.2, EDIT.tok), ...Array.from({ length: 32 }, (_, k) => at('tool') - 0.15 + k * 0.035)];
    follow(r4);
    const r5 = { sp: FAST, mark: Math.max(r4.done, at('e') + 0.05) };
    r5.read = r5.mark + FAST.fly - 0.1;
    r5.wrote = r5.read + FAST.read;
    r5.open = r5.wrote;
    r5.tok = callTimes(13, 2, r5.open + FAST.eot - 0.15, at('again') - 0.2, at('again') + 0.25, FAST.tok);
    follow(r5);
    const rounds = [r1, r2, r3, r4, r5];
    // f: the answer, the sixth round
    const r6 = { sp: MID, mark: Math.max(r5.done, at('f') + 0.05) };
    r6.read = Math.max(r6.mark + MID.fly - 0.1, at('read') - 0.2);
    r6.wrote = r6.read + MID.read;
    r6.tok = times(ANSWER.length, Math.max(r6.wrote, at('know') - 0.2), at('f.end') + 0.6, MID.tok);
    r6.fin = r6.tok[r6.tok.length - 1] + MID.tok;
    r6.endIn = r6.fin + MID.eot;
    const landed = (r, k) => t >= r.tok[k] + r.sp.tok;
    const callLanded = (c, r) => c.toks.reduce((n, _, k) => (landed(r, k) ? k + 1 : n), 0);
    const ansLanded = (tt) => ansToks.reduce((u, tk, k) => (tt >= r6.tok[k] + MID.tok ? tk.upto : u), 0);

    // the document scrolls when what comes next would pass its foot (the written part's bottom, at the time)
    const scrollAt = [
      ...calls.flatMap(({ c, R }, k) => [[rounds[k].mark, c.band.y + c.band.h], [rounds[k].resMark, R.y + R.h]]),
      [r6.mark, A.y + A.h],
    ];
    let need = 0;
    let sy = 0;
    scrollAt.forEach(([when, bottom]) => {
      const to = Math.max(need, bottom - VIS);
      if (to > need) sy += (to - need) * inOutCubic(seg(t, when - 0.5, when - 0.05));
      need = to;
    });

    // ——— who is at work
    const actGlow = Math.max(
      span(t, defAt, defAt + 1.4),
      span(t, userAt - 0.1, userAt + SLOW.fly),
      ...[...rounds, r6].map((r) => span(t, r.mark, r.wrote)),
      ...rounds.map((r) => span(t, r.stop, r.done - 0.2)),
      span(t, r6.tok[0] + MID.tok, r6.endIn - 0.1),
    );
    const llmGlow = Math.max(
      ...rounds.map((r) => span(t, r.wrote - 0.1, r.stop)),
      span(t, r6.wrote - 0.1, r6.endIn - 0.15),
    );
    const writing = rounds.some((r) => t >= r.open && t < r.stop) || (t >= r6.tok[0] && t < r6.endIn);

    // ——— the rings: what the voice points at
    const [readoutLit] = lit(['readout'], at('search'));
    const [toolLit] = lit(['tool'], at('fixit'));
    const [textLit] = lit(['text'], at('read'));
    const [condLit] = lit(['cond'], at('f.end'));
    const [pass2Lit, allLit] = lit(['pass2', 'all'], at('f2.end'));
    const [noneLit] = lit(['none'], at('g.end'));
    const [failLit, readout2Lit, refixLit] = lit(['fail', 'readout2', 'refix'], at('e2.end'));

    // ——— the chat screen: 6-4's conversation leaves, this one comes in
    chatScreen(ctx, screen, 1);
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      chatBubble(ctx, old.Bs[0], { alpha: 1 });
      chatBubble(ctx, old.Bs[1], { alpha: 1, chars: 1 });
      ctx.restore();
    }
    chatBubble(ctx, Bs[0], { alpha: tw(t, askAt, 0.35) });
    chatBubble(ctx, Bs[1], { alpha: tw(t, r6.tok[0] + MID.tok, 0.2), chars: ansLanded(t - 0.12) });
    screenLinks(ctx, T, { talk: 1, back: 1, talkHot: span(t, askAt + 0.05, askAt + 0.8) > 0.5, backHot: span(t, r6.tok[0] + MID.tok, r6.fin + 0.2) > 0.5 });

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, L, 1, { name: '' });
    llmBlock(ctx, L, 1, { glow: llmGlow });
    channel(ctx, L.read, 1, { hot: [...rounds, r6].some((r) => span(t, r.read, r.wrote) > 0.5) });
    channel(ctx, L.write, 1, { hot: llmGlow > 0.5 && writing });
    const runHot = rounds.some((r) => span(t, r.go, r.work) > 0.5);
    channel(ctx, Lx.call, 1, { labelAlpha: fresh, hot: runHot });
    channel(ctx, Lx.back, 1, { labelAlpha: fresh, hot: rounds.some((r) => span(t, r.back, r.back + r.sp.back * 0.6) > 0.5) });
    if (gone > 0.001) channelNames(ctx, { inName: gone, outName: gone, errName: gone, inHot: false, outHot: false, ringLit: 0 });

    // ——— the document: 6-4's (scrolled as it ends) clears away; this one comes in (scrolled by sy, clipped to the paper)
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      drawDoc64(ctx, old);
      ctx.restore();
    }
    ctx.save();
    if (sy > 0) {
      ctx.beginPath();
      ctx.rect(DOC.x, DOC.y + 2, DOC.w, DOC.h - 4);
      ctx.clip();
      ctx.translate(0, -sy);
    }
    if (fresh > 0.001) {
      ctx.save();
      ctx.globalAlpha *= fresh;
      roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
      defs.forEach((d, k) => drawDef(ctx, d, defY(k), k < 2 ? 1 : defP(k)));
      ctx.restore();
    }
    // b: the request
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
    // what the next call takes from what came before, marked where it is read and where it is written
    marker(ctx, spans.average, pop('readout'));
    marker(ctx, spans.four, pop('readout'));
    marker(ctx, spans.defAvg, tw(t, r2.tok[18] + FAST.tok, 0.3));
    marker(ctx, spans.file, pop('found'));
    marker(ctx, spans.catFile, tw(t, r3.tok[15] + FAST.tok, 0.3));
    marker(ctx, spans.plus, pop('where'));
    marker(ctx, spans.oldPlus, tw(t, r4.tok[26] + EDIT.tok, 0.3));
    links.forEach((ln, k) => {
      const [r, i] = [[r2, 18], [r3, 15], [r4, 26]][k];
      link(ctx, ln, laneX, tw(t, r.tok[i] + r.sp.tok, 0.6, inOutCubic));
    });
    const R1 = calls[0].R;
    ringBox(ctx, { x: R1.tx, y: R1.y, w: R1.w, h: R1.h }, readoutLit, C.accent, 0);
    const R5 = calls[4].R;
    ringBox(ctx, { x: R5.tx, y: R5.y, w: R5.w, h: R5.h }, textLit, C.accent, 0);
    // f: the answer
    if (t >= r6.mark + MID.fly) roleMark(ctx, A.x, A.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    const ca = ansLanded(t);
    if (ca > 0) docEntry(ctx, A, 1, { tagAlpha: 0, chars: ca });
    if (t >= r6.endIn) roleMark(ctx, aEnd.x, aEnd.y, ROLE.end, { edge: WRITER.end });
    // a cursor after the assistant's mark, while the LLM reads, until it writes
    const cur = rounds.map((r, k) => [r, calls[k].c.open]).find(([r]) => t >= r.read && t < r.open + r.sp.eot);
    const cursor = cur ? { x: cur[1].x, y: cur[1].y + MARK_H - 2 } : t >= r6.read && t < r6.tok[0] + MID.tok ? (() => { const p = rowAt(A, 0); return { x: p.x, y: p.y + 6 }; })() : null;
    if (cursor && Math.floor(t * 2.5) % 2 === 0) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(cursor.x, cursor.y - 30, 4, 30);
    }
    ctx.restore();
    // the top of the paper, where the scrolled part goes on
    if (sy > 0.5) paperTop(ctx, sy);
    // the reads: the app hands the document over
    [...rounds.map((r, k) => [r, calls[k].c.band.y]), [r6, A.y]].forEach(([r, yy]) => {
      sweep(ctx, L, seg(t, r.read + 0.05, r.read + r.sp.read), yy - sy + MARK_H);
      send(ctx, L.read, seg(t, r.read + 0.4 * (r.sp.read / SLOW.read), r.read + r.sp.read + 0.05), '', 'doc');
    });

    // ——— the app's box; it sees where each call ends, and stops the writing; 6-4's loop and person clear away
    actor(ctx, ACT, 1, actGlow);
    rounds.forEach((r, k) => {
      const lk = span(t, r.stop - 0.05, r.go + 0.25);
      const e = calls[k].c.end;
      if (lk > 0) lookLine(ctx, { x: e.x, y: e.y - sy, w: e.w }, tw(t, r.stop - 0.05, 0.3, inOutCubic), lk);
    });
    halt(ctx, Math.max(...rounds.map((r) => span(t, r.fin + r.sp.eot - 0.05, r.go + 0.45))));
    if (gone > 0.001) {
      loopIcon(ctx, T.LOOP.x, T.LOOP.y, T.LOOP.r, gone, { p: 1 });
      text(ctx, 'くり返す', T.LOOP.x - T.LOOP.r - 14, T.LOOP.y + 6, { font: F.jp(700, 16), color: C.purple, align: 'right', alpha: gone });
      gate(ctx, (L.call.x1 + L.call.x2) / 2, L.call.y, gone);
    }

    // ——— the tool's place: the shell over the files
    const editRun = span(t, r4.work - 0.1, r4.back + 0.1);
    const runIn = (r) => span(t, r.work + 0.1, r.back);
    toolBox(ctx, Lx, 1, {
      solid: 1,
      draw: (c) => {
        if (gone > 0.001) {
          terminal(c, t, 1, old.lines, { lineAlpha: gone, box: termBox });
          CHIP_ORDER.forEach((n) => {
            const b = old.posB[n];
            progChip(c, b.x, b.y, b.w, 1, n, { a: gone, lit: 0, lock: LOCKED.includes(n) || n === 'rm' ? 1 : 0, red: 0, ok: 0 });
          });
          text(c, 'シェルの先のプログラム', TOOL.x + 16, TOOL.y + TOOL.h - 42, { font: F.jp(700, 15), color: C.muted, alpha: gone });
          keyRow(c, TOOL.x + 16, TOOL.y + TOOL.h - 18, gone, 0);
        } else {
          terminal(c, t, 1, termLines(rounds), { box: termBox, trim: true });
        }
        filesPanel(c, {
          a: filesIn,
          code: codeP,
          chip: tw(t, defAt + 0.6, pace.enter),
          chipLit: editRun,
          chipRing: toolLit,
          hlTest: Math.max(runIn(r1), runIn(r5)),
          hlAvg1: runIn(r2),
          hlAvg: runIn(r3),
          edit: seg(t, r4.outAt, r4.outAt + 0.8),
          editArrow: span(t, r4.work, r4.outAt + 0.9),
          fail: tw(t, r1.outAt + 0.2, 0.3) * (1 - tw(t, r5.outAt + 0.1, 0.25)),
          pass: tw(t, r5.outAt + 0.2, 0.3),
          passRing: pass2Lit,
          cond: pop('cond'),
          condRing: condLit,
          note2: pop('all'),
          note2Ring: allLit,
          testRing: noneLit,
          q: pop('how') * (1 - tw(t, at('h'), 0.4)),
        }, files);
      },
    });
    const lw = text(ctx, 'ツール', Lx.tool.x, Lx.tool.y - 16, { font: F.jp(700, 22), color: C.ink });
    text(ctx, 'の場所', Lx.tool.x + lw, Lx.tool.y - 16, { font: F.jp(700, 22), color: C.ink });

    // ——— under the LLM: 6-4's column clears; what the LLM chose to do next, and the way back when a test fails (e2)
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      steps64(ctx);
      ctx.restore();
    }
    const fills = rounds.map((r, k) => [r.tok[CALLS[k].pre], r.fin]);
    steps(ctx, t, {
      head: pop('run'),
      fills,
      slotFrom: [at('run') - lead, ...fills.slice(0, 4).map(([, b]) => b)],
      back: { row: pop('fail'), read: pop('readout2'), arrow: tw(t, at('refix') - lead, 0.6, inOutCubic) },
      rings: { row: Math.max(failLit, readout2Lit), fix: refixLit },
    });

    // ——— above the LLM: 6-4's card clears; the test written first (h), then SWE-bench (i, i2, j)
    if (gone > 0.001) releases64(ctx, gone);
    const firstOut = tw(t, at('i'), 0.45, inOutCubic);
    firstCard(ctx, {
      a: pop('want') * (1 - firstOut),
      want: pop('want'),
      rows: [pop('write2'), tw(t, at('first') - lead + 0.2, pace.enter), tw(t, at('first') - lead + 0.45, pace.enter), tw(t, at('first') - lead + 0.7, pace.enter)],
      first: pop('first'),
    });
    sweCard(ctx, {
      a: tw(t, at('i') + 0.2, pace.enter),
      name: pop('swe'),
      proj: pop('proj'),
      real: pop('real'),
      n: pop('n'),
      fixc: pop('fixc'),
      solved: pop('solved'),
      bytest: pop('bytest'),
      score: pop('score'),
      ch10: tw(t, at('ch10') - lead, pace.enter, (p) => outBack(p, 1.4)),
    });
    source(ctx, '出典：Jimenez ほか（2023）', pop('proj'), SOURCE_RIGHT);

    // ——— 6-4's frame of the agent clears away
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      agentFrame64(ctx);
      ctx.restore();
    }

    // ——— in flight, over everything
    flyMark(ctx, T, U, seg(t, userAt, userAt + SLOW.fly), ROLE.user, { edge: WRITER.user, dy: -sy });
    [...rounds.map((r, k) => [r, { x: DOC.x + 18, y: calls[k].c.band.y }]), [r6, A]].forEach(([r, E]) => {
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
      chipFlight(ctx, seg(t, r.go, r.go + sp.go), toTool(T5, band, -sy), CALLS[k].chip, 'call');
      const bp = seg(t, r.back, r.back + sp.back);
      chipFlight(ctx, bp < 1 ? bp : 0.999, fromTool(T5, R, -sy, R.tx + 120), '結果', 'found', bp < 1 ? null : 1 - tw(t, r.resIn - 0.05, 0.25));
      flyMark(ctx, T, R, seg(t, r.resMark, r.resMark + sp.fly), ROLE.result, { edge: WRITER.result, dy: -sy });
    });
    ansToks.forEach((tk, k) => {
      const p = seg(t, r6.tok[k], r6.tok[k] + MID.tok);
      if (p <= 0 || p >= 1) return;
      const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
      const pt = onPath(writePath(T, A, tk.x + w / 2, tk.y, -sy), inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
    });
    const pe6 = seg(t, r6.fin, r6.endIn);
    if (pe6 > 0 && pe6 < 1) {
      const pt = onPath(writePath(T, A, aEnd.x + aEnd.w / 2, aEnd.y + MARK_H / 2, -sy), inOutCubic(pe6));
      roleMark(ctx, pt.x - aEnd.w / 2, pt.y - MARK_H / 2, ROLE.end, { edge: WRITER.end, alpha: clamp(pe6 * 8) });
    }

    // ——— the example's note (6-4's gives way)
    const ex = { x: L.app.x, y: L.app.y + L.app.h + 22 };
    const exW = measure(ctx, F.jp(700, 17), '例') + 20;
    example(ctx, ex.x, ex.y, 1, '');
    text(ctx, NOTE64, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: gone });
    text(ctx, NOTE, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: fresh });
  },
});

// ——— 6-4's picture as it ends (agent.js, at its duration) ————————————————————————————————————————

function drawDoc64(ctx, o) {
  const { sy } = o;
  ctx.save();
  if (sy > 0) {
    ctx.beginPath();
    ctx.rect(DOC.x, DOC.y + 2, DOC.w, DOC.h - 4);
    ctx.clip();
    ctx.translate(0, -sy);
  }
  roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
  o.defs.forEach((d, k) => drawDef(ctx, d, defY(k), 1));
  docEntry(ctx, o.U, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.U.x, o.U.y + 1, ROLE.user, { edge: WRITER.user });
  o.calls.forEach(({ c, R }) => {
    roleMark(ctx, DOC.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    drawCall(ctx, c, { bandA: 1, open: true, n: c.toks.length, end: true });
    roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
    docEntry(ctx, R, 1, { tagAlpha: 0, chars: 1 });
  });
  const sp = o.spans;
  [sp.log, sp.err, sp.logs1].forEach((b) => marker(ctx, b, 1));
  marker(ctx, sp.day, 1);
  marker(ctx, sp.day2, 1);
  marker(ctx, sp.timeout, 1);
  marker(ctx, sp.timeout3, 1);
  o.links.forEach((ln) => link(ctx, ln, o.laneX, 1));
  text(ctx, '41', sp.n41.x, sp.n41.y + 15, { font: MFONT, color: C.accent, alpha: 1 });
  roleMark(ctx, o.A.x, o.A.y + 1, ROLE.assistant, { edge: WRITER.assistant });
  docEntry(ctx, o.A, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.aEnd.x, o.aEnd.y, ROLE.end, { edge: WRITER.end });
  reportKey64(ctx, o.A);
  ctx.restore();
  if (sy > 0.5) paperTop(ctx, sy);
}

// 6-4's report: what was found (green) and what is not known yet (grey), in the marks' column.
function reportKey64(ctx, A) {
  const x = A.tx - 10;
  const y0 = A.y + 2;
  [[C.green, y0, A.y + A.lh * 2 - 4], [C.muted, A.y + A.lh * 2 + 2, A.y + A.h - 2]].forEach(([color, ya, yb]) => {
    ctx.save();
    ctx.globalAlpha *= 1;
    ctx.fillStyle = color;
    ctx.fillRect(x, ya, 3, yb - ya);
    ctx.restore();
  });
  tag(ctx, x - 7, A.y + 37, 'わかったこと', { font: F.jp(700, 11), h: 20, padX: 6, fill: '#fff', stroke: C.green, color: C.green, r: 5, align: 'right', alpha: 1 });
  tag(ctx, x - 7, A.y + A.lh * 2 + 4, 'まだわからないこと', { font: F.jp(700, 11), h: 20, padX: 6, fill: '#fff', stroke: C.muted, color: C.ink2, r: 5, align: 'right', alpha: 1 });
}

// 6-4's column under the LLM, filled, with the limit on the rounds.
function steps64(ctx) {
  const K = COL64;
  text(ctx, 'LLM が選ぶ次の行動', K.x, K.head, { font: F.jp(700, 15), color: C.ink2, alpha: 1 });
  STEPS64.forEach((parts, k) => {
    const y = K.top + k * K.step;
    badgeN(ctx, K.x + 12, y + K.h / 2, String(k + 1), 1);
    let x = K.x + 32;
    parts.forEach(([s, color]) => {
      x += text(ctx, s, x, y + 21, { font: F.jp(500, 15), color: color ?? C.ink }) || 0;
    });
  });
  ctx.save();
  ctx.globalAlpha *= 1;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  line(ctx, K.x, LIMIT_Y64, K.x + 268, LIMIT_Y64, 1);
  ctx.setLineDash([]);
  ctx.restore();
  text(ctx, '周の数の上限（アプリが決める）', K.x, LIMIT_Y64 + 22, { font: F.jp(700, 14), color: C.purple, alpha: 1 });
}

// 6-4's card of the agents used from the terminal (2025).
function releases64(ctx, a) {
  if (a <= 0.001) return;
  const b = CARD64;
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
    const y = b.y + 80 + k * 50;
    text(ctx, name, b.x + 16, y, { font: F.sans(600, 19), color: C.ink, alpha: a });
    text(ctx, `${date}　${kind}`, b.x + 16, y + 21, { font: F.jp(400, 14), color: C.ink2, alpha: a });
  });
  text(ctx, 'ターミナルで動くのは、アプリの部分。', b.x + 16, b.y + 236, { font: F.jp(500, 14), color: C.ink2, alpha: a });
  text(ctx, 'LLM は、既定では、API の先の提供元で動く。', b.x + 16, b.y + 257, { font: F.jp(500, 14), color: C.ink2, alpha: a });
  text(ctx, SOURCE64, b.x + 16, b.y + b.h - 12, { font: F.jp(400, 12), color: C.muted, alpha: a });
}

// 6-4's frame of the agent, and its name.
function agentFrame64(ctx) {
  ctx.save();
  framePath(ctx, FRAME, 22);
  const len = perimeter(FRAME);
  ctx.setLineDash([len * 1, len + 10]);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  tag(ctx, FRAME[2][0] + 28, FRAME[2][1] - 20, 'AI エージェント', { font: F.jp(700, 20), h: 40, padX: 16, fill: C.ink, color: C.paper, alpha: 1 });
}

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

// ——— shared by both pictures ——————————————————————————————————————————————————————————————

// The top of the paper, where the scrolled part goes on.
function paperTop(ctx, sy) {
  const g = ctx.createLinearGradient(0, DOC.y, 0, DOC.y + 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalAlpha = clamp(sy / 30);
  ctx.fillStyle = g;
  ctx.fillRect(DOC.x + 4, DOC.y + 2, DOC.w - 8, 30);
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

// ——— this clip's pieces ———————————————————————————————————————————————————————————————————

// What the terminal shows, and when: the four commands that went to the shell, and their output.
function termLines(rounds) {
  return rounds.flatMap((r, k) => {
    if (!TERM_OUT[k]) return [];
    const [[cmd], outs] = TERM_OUT[k];
    return [
      { s: cmd, cmd: true, show: r.work, type: r.work + 0.02 },
      ...outs.map(([s, kind], j) => ({ s, err: kind === 'err', ok: kind === 'ok', show: r.outAt + j * 0.1 })),
    ];
  });
}

// The files in the tool's place: average.py (the function) and test_average.py (its test), with what the
// shell reads lit while it runs, the edit tool's chip, the edit itself, and the test's state.
function filesPanel(ctx, o, f) {
  const a = o.a;
  if (a <= 0.001) return;
  const b = FILES;
  const y = (k) => b.y + k;
  const rowBox = (yy) => ({ x: b.x + 8, y: yy - 15, w: b.w - 16, h: 20 });
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, b.x, b.y + (1 - a) * 8, b.w, b.h, 12);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'ファイル', b.x + 12, y(FY.title), { font: F.jp(700, 15), color: C.ink2, alpha: a });
  // what the shell reads, lit while it runs
  const hl = (box, l) => {
    if (l <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= l * a;
    rr(ctx, box.x, box.y, box.w, box.h, 5);
    ctx.fillStyle = C.accentSoft;
    ctx.fill();
    ctx.restore();
  };
  hl(rowBox(y(FY.avg[0])), Math.max(o.hlAvg1, o.hlAvg));
  hl(rowBox(y(FY.avg[1])), o.hlAvg);
  hl({ x: b.x + 8, y: y(FY.test[0]) - 15, w: b.w - 16, h: FY.test[1] - FY.test[0] + 20 }, o.hlTest);
  // the code, typed in (a)
  const code = [[AVG[0], y(FY.avg[0])], [AVG[1] + AVG[2], y(FY.avg[1])], [TEST[0], y(FY.test[0])], [TEST[1], y(FY.test[1])]];
  const total = code.reduce((n, [s]) => n + s.length, 0);
  let left = Math.round(total * clamp(o.code));
  const names = clamp(o.code * 4);
  text(ctx, 'average.py', b.x + 12, y(FY.avgName), { font: F.mono(600, 13), color: C.ink2, alpha: a * names });
  text(ctx, 'test_average.py', b.x + 12, y(FY.testName), { font: F.mono(600, 13), color: C.ink2, alpha: a * names });
  code.forEach(([s, yy], k) => {
    if (left <= 0) return;
    const shown = s.slice(0, left);
    left -= s.length;
    if (k === 1 && o.edit > 0) {
      // the edit: 「 + 1」 is struck through, then goes
      text(ctx, AVG[1], FX, yy, { font: FFONT, color: C.ink, alpha: a });
      const gone = seg(o.edit, 0.45, 1);
      if (gone < 1) {
        text(ctx, AVG[2], f.plusX, yy, { font: FFONT, color: C.red, alpha: a * (1 - gone) });
        ctx.save();
        ctx.globalAlpha *= a * (1 - gone);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        line(ctx, f.plusX + 4, yy - 5, f.plusX + f.plusW + 2, yy - 5, seg(o.edit, 0, 0.4));
        ctx.restore();
      }
      return;
    }
    text(ctx, shown, FX, yy, { font: FFONT, color: C.ink, alpha: a });
  });
  // the changed line keeps a bar in the gutter (grey: green is for the condition the test checks)
  const changed = seg(o.edit, 0.6, 1);
  if (changed > 0) {
    ctx.save();
    ctx.globalAlpha *= a * changed;
    ctx.fillStyle = C.muted;
    ctx.fillRect(b.x + 6, y(FY.avg[1]) - 14, 3, 18);
    ctx.restore();
  }
  // the edit tool, at the head of the files; while it runs, an arrow down to the part it rewrites
  const cx = b.x + b.w - 10 - f.chipW;
  progChip(ctx, cx, b.y + 7, f.chipW, 1, 'edit_file', { a: o.chip * a, lit: o.chipLit });
  ringBox(ctx, { x: cx, y: b.y + 7, w: f.chipW, h: CHIP.h }, o.chipRing * o.chip, C.accent, 2);
  if (o.editArrow > 0.001) {
    const ax = f.plusX + f.plusW / 2;
    ctx.save();
    ctx.globalAlpha *= o.editArrow * a;
    ctx.strokeStyle = ctx.fillStyle = C.accent;
    ctx.lineWidth = 2.5;
    arrow(ctx, ax, b.y + 7 + CHIP.h + 3, ax, y(FY.avg[1]) - 18, clamp(o.editArrow * 1.5), 9);
    ctx.restore();
  }
  // the test's state: failed (b), passed (e)
  const right = b.x + b.w - 10;
  if (o.fail > 0.001) tag(ctx, right, y(FY.testName) - 15, '✕ テスト失敗', { font: F.jp(700, 12), h: 21, padX: 7, fill: '#fff', stroke: C.red, color: C.red, r: 5, align: 'right', alpha: o.fail * a });
  if (o.pass > 0.001) {
    const w = tag(ctx, right, y(FY.testName) - 15, '　 テスト通過', { font: F.jp(700, 12), h: 21, padX: 7, fill: C.green, color: '#fff', r: 5, align: 'right', alpha: o.pass * a });
    check(ctx, right - w + 13, y(FY.testName) - 4.5, 6.5, o.pass * a);
    ringBox(ctx, { x: right - w, y: y(FY.testName) - 15, w, h: 21 }, o.passRing, C.accent, 2);
  }
  // f: the condition the test writes down; f2: what it does not check
  if (o.cond > 0.001) {
    ctx.save();
    ctx.globalAlpha *= o.cond * a;
    ctx.fillStyle = C.green;
    ctx.fillRect(b.x + 6, y(FY.test[1]) - 14, 3, 18);
    ctx.restore();
    text(ctx, '確かめたのは、この 1 行の条件だけ', b.x + 12, y(FY.note[0]), { font: F.jp(700, 14), color: C.green, alpha: o.cond * a });
  }
  // (the rows are too close for a ring: what the voice points at turns vermilion, as 6-4 does)
  if (o.condRing > 0.001) text(ctx, TEST[1], FX, y(FY.test[1]), { font: FFONT, color: C.accent, alpha: o.condRing * a });
  if (o.note2 > 0.001) {
    text(ctx, NOT_CHECKED, b.x + 12, y(FY.note[1]), { font: F.jp(500, 14), color: C.ink2, alpha: o.note2 * a });
    text(ctx, NOT_CHECKED, b.x + 12, y(FY.note[1]), { font: F.jp(500, 14), color: C.accent, alpha: o.note2Ring * o.note2 * a });
  }
  // g: and if there were no test?
  ringBox(ctx, { x: b.x + 8, y: y(FY.testName) - 17, w: b.w - 16, h: FY.test[1] - FY.testName + 20 }, o.testRing, C.accent, 0);
  if (o.q > 0.001) tag(ctx, b.x + 150, y(FY.testName) - 17, '？', { font: F.jp(700, 16), h: 26, padX: 8, fill: C.accent, color: '#fff', r: 13, alpha: o.q * a });
}

// Under the LLM: what it chose to do next, one row per round, with an open slot (？) for the next one; and,
// if the test had not passed, the way back to fixing (e2).
function steps(ctx, t, { head, fills, slotFrom, back, rings }) {
  if (head <= 0.001) return;
  text(ctx, 'LLM が選ぶ次の行動', COL.x, COL.head, { font: F.jp(700, 15), color: C.ink2, alpha: head });
  const rowY = (k) => COL.top + k * COL.step;
  fills.forEach(([a, b], k) => {
    const p = seg(t, a, b);
    const y = rowY(k);
    if (p <= 0) {
      const sa = tw(t, slotFrom[k], 0.35) * (k === 0 ? head : 1);
      if (sa > 0.001 && (k === 0 || t >= slotFrom[k])) slot(ctx, y, k + 1, sa);
      return;
    }
    badgeN(ctx, COL.x + 12, y + COL.h / 2, String(k + 1), tw(t, a, 0.25));
    const [s, tool] = STEPS[k];
    const chars = Array.from(s);
    text(ctx, chars.slice(0, Math.round(chars.length * p)).join(''), COL.x + 32, y + 21, { font: F.jp(500, 15), color: C.ink });
    text(ctx, tool, COL.x + COL.w, y + 20, { font: F.mono(500, 13), color: C.muted, align: 'right', alpha: seg(p, 0.6, 1) });
  });
  // e2: if the test fails, read its output and fix again
  if (back.row > 0.001) {
    const y = rowY(5);
    ctx.save();
    ctx.globalAlpha *= back.row;
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    rr(ctx, COL.x, y, COL.w, COL.h, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    const w = text(ctx, '通らなければ', COL.x + 32, y + 21, { font: F.jp(500, 15), color: C.red, alpha: back.row });
    text(ctx, '、出力を読んで', COL.x + 32 + w, y + 21, { font: F.jp(500, 15), color: C.ink, alpha: back.read });
    // a red ✕ where a round's number would be: the test did not pass
    ctx.save();
    ctx.globalAlpha *= back.row;
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(COL.x + 12, y + COL.h / 2, 10, 0, Math.PI * 2);
    ctx.stroke();
    line(ctx, COL.x + 8, y + COL.h / 2 - 4, COL.x + 16, y + COL.h / 2 + 4);
    line(ctx, COL.x + 16, y + COL.h / 2 - 4, COL.x + 8, y + COL.h / 2 + 4);
    ctx.restore();
    ring(ctx, COL.x, y, COL.w, COL.h, rings.row * back.row, C.accent, 8);
  }
  if (back.arrow > 0.001) {
    const y5 = rowY(5) + COL.h / 2;
    const y3 = rowY(3) + COL.h / 2;
    const x = COL.x - 16;
    const r = 8;
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.fillStyle = C.red;
    ctx.lineWidth = 2.2;
    const end = path(ctx, [[COL.x - 2, y5], [x + r, y5], [x, y5 - r], [x, y3 + r], [x + r, y3], [COL.x - 4, y3]], back.arrow);
    if (end && back.arrow > 0.97) arrowHead(ctx, COL.x - 2, y3, 0, 9);
    ctx.restore();
    ring(ctx, COL.x, rowY(3), COL.w, COL.h, rings.fix, C.accent, 8);
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

function cardBox(ctx, a, h = CARD.h) {
  const b = CARD;
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, b.x, b.y, b.w, h, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// h: writing the test first — from how it should behave, a test; see it fail; fix; see it pass.
function firstCard(ctx, { a, want, rows, first }) {
  if (a <= 0.001) return;
  const b = CARD;
  cardBox(ctx, a, FIRST_H);
  text(ctx, 'テストを先に書かせる', b.x + 16, b.y + 34, { font: F.jp(700, 17), color: C.ink, alpha: a });
  text(ctx, 'どう動いてほしいか', b.x + 16, b.y + 68, { font: F.jp(500, 13), color: C.muted, alpha: a * want });
  text(ctx, '[2, 4] の平均は 3', b.x + 16, b.y + 92, { font: F.jp(700, 16), color: C.blue, alpha: a * want });
  const ROWS = [
    ['テストを書く', 'assert average([2, 4]) == 3'],
    ['動かして、失敗を確かめる', null, 'fail'],
    ['コードを直す'],
    ['テストが通る', null, 'pass'],
  ];
  const ys = [130, 186, 222, 258];
  // the line from one step to the next
  ctx.save();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    const p = rows[k + 1];
    if (p <= 0.001) continue;
    ctx.globalAlpha = a * p;
    line(ctx, b.x + 28, b.y + ys[k] + 12, b.x + 28, b.y + ys[k + 1] - 12);
  }
  ctx.restore();
  ROWS.forEach(([s, sub, kind], k) => {
    const ra = rows[k] * a;
    if (ra <= 0.001) return;
    const yy = b.y + ys[k];
    badgeN(ctx, b.x + 28, yy, String(k + 1), ra);
    const w = text(ctx, s, b.x + 48, yy + 6, { font: F.jp(500, 15), color: C.ink, alpha: ra });
    if (sub) text(ctx, sub, b.x + 48, yy + 30, { font: F.mono(500, 13), color: C.ink2, alpha: ra });
    if (kind === 'fail') tag(ctx, b.x + 48 + w + 10, yy - 10, '✕', { font: F.jp(700, 12), h: 20, padX: 6, fill: '#fff', stroke: C.red, color: C.red, r: 10, alpha: ra });
    if (kind === 'pass') {
      check(ctx, b.x + 48 + w + 18, yy, 9, ra);
    }
    if (k === 0) tag(ctx, b.x + 48 + w + 10, yy - 11, '直す前に', { font: F.jp(700, 12), h: 22, padX: 7, fill: C.accent, color: '#fff', r: 6, alpha: ra * first });
  });
}

// i, i2, j: SWE-bench (the original): issues from 12 Python projects, 2,294 of them; scored by whether the fixed
// code passes the tests that decide whether the issue is solved; how to read the scores is chapter 10's.
function sweCard(ctx, o) {
  const a = o.a;
  if (a <= 0.001) return;
  const b = CARD;
  cardBox(ctx, a);
  const na = o.name * a;
  const w0 = text(ctx, '2023', b.x + 16, b.y + 40, { font: F.cond(700, 34), color: C.ink, alpha: a });
  const w1 = text(ctx, 'SWE-bench', b.x + 16 + w0 + 10, b.y + 38, { font: F.sans(700, 22), color: C.ink, alpha: na });
  tag(ctx, b.x + 16 + w0 + 10 + w1 + 10, b.y + 18, '原版', { font: F.jp(700, 13), h: 24, padX: 8, fill: '#fff', stroke: C.ink2, color: C.ink2, r: 6, alpha: na });
  text(ctx, '12 の Python のプロジェクトから', b.x + 16, b.y + 66, { font: F.jp(500, 15), color: C.ink, alpha: o.proj * a });
  text(ctx, '実際に報告された課題を集めた', b.x + 16, b.y + 87, { font: F.jp(500, 15), color: C.ink, alpha: o.real * a });
  const nw = text(ctx, '2,294', b.x + 16, b.y + 138, { font: F.cond(700, 52), color: C.accent, alpha: o.n * a, ls: -1 });
  text(ctx, '件', b.x + 16 + nw + 6, b.y + 136, { font: F.jp(700, 22), color: C.accent, alpha: o.n * a });
  // how it is scored: the fixed code, the tests that decide, solved or not
  const fy = b.y + 166;
  ctx.save();
  ctx.globalAlpha *= a * o.fixc;
  ctx.fillStyle = C.rule;
  ctx.fillRect(b.x + 16, b.y + 152, b.w - 32, 1.5);
  ctx.restore();
  const chipO = { font: F.jp(700, 13), h: 28, padX: 9, r: 7 };
  const c1 = tag(ctx, b.x + 16, fy, '直したコード', { ...chipO, fill: C.panel, color: C.ink, alpha: o.fixc * a });
  const c2x = b.x + 16 + c1 + 30;
  const c2 = tag(ctx, c2x, fy, '評価用のテスト', { ...chipO, fill: '#fff', stroke: C.ink2, color: C.ink, alpha: o.bytest * a });
  const oy = fy + 42;
  const outO = { ...chipO, h: 24, font: F.jp(700, 12), padX: 8 };
  const ow1 = tag(ctx, c2x - 24, oy, '✓ 解けた', { ...outO, fill: C.green, color: '#fff', alpha: o.solved * a });
  const o2x = c2x - 24 + ow1 + 12;
  const ow2 = tag(ctx, o2x, oy, '✕ 解けない', { ...outO, fill: '#fff', stroke: C.red, color: C.red, alpha: o.solved * a });
  if (o2x + ow2 > b.x + b.w - 12) throw new Error('coding: SWE-bench\'s outcomes do not fit the card');
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.globalAlpha *= o.bytest * a;
  arrow(ctx, b.x + 16 + c1 + 4, fy + 14, c2x - 4, fy + 14, 1, 8);
  const cx2 = c2x + c2 / 2;
  arrow(ctx, cx2 - 6, fy + 30, c2x - 24 + ow1 / 2, oy - 4, 1, 8);
  arrow(ctx, cx2 + 6, fy + 30, o2x + ow2 / 2, oy - 4, 1, 8);
  ctx.restore();
  // j: the score, and chapter 10
  const sy = b.y + 258;
  text(ctx, '点：解けた課題の割合（%）', b.x + 16, sy, { font: F.jp(500, 14), color: C.ink, alpha: o.score * a });
  tag(ctx, b.x + 16, sy + 12, '読み方に注意', { font: F.jp(700, 12), h: 24, padX: 7, fill: '#fff', stroke: C.accent, color: C.accent, r: 6, alpha: o.score * a });
  tag(ctx, b.x + b.w - 16, sy + 10, '10 章　鍛えて測る', { font: F.jp(700, 15), h: 30, padX: 11, fill: C.ink, color: C.paper, align: 'right', alpha: o.ch10 * a });
}
