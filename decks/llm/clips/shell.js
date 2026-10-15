// 6-3: the shell as one tool. Told from the designer's side (Boss, 2026-10-15), like 6-1 and 6-2. A computer
// has many programs (finding files, calculating, …); writing a tool definition for each of them would never
// end — the definitions alone fill the document. So we connect the shell as one tool. A shell takes
// instructions written as text and runs programs (among other things); those instructions are commands.
// Here we make the command the tool's input and return the program's output, or its error, as text. Both
// are text, so the LLM can be made to write commands and read what comes back. Asked for today's date and
// 2 to the 64th power, the LLM asks, in turn, for a command that prints the date and one that calculates;
// the app runs each in the shell and writes the output in, and the LLM answers from the two. How to use
// commands has been written down in many texts — manuals, answers to questions — and a model that learned
// from such texts can write them. One tool, and behind it the programs it is allowed to run. ずんだもん
// asks whether that is not dangerous: it can be — a command that deletes files runs too, if it has the
// right. So the files and operations it may use are narrowed, a person is asked before it runs, and it runs
// in a place apart from the usual environment (chapter 7).
//
// The layout is 6-1's and 6-2's (lib/rig.js toolUseLayout with the taller tool's place). The clip joins 6-2
// (spec §6.10): its first frame is 6-2's last picture, drawn here as search.js draws it, and the bridge
// clears 6-2's conversation, its definition, its search, its cards and notes, leaving the frame, the system
// mark at the head, and an empty tool's place. Everything in the conversation is an example: the question,
// the definitions, the commands and their output (the date is the clock of the machine it ran on), the
// answer (cut into tokens as o200k_base cuts them), the Q&A page, the files (research/connect-facts 6-3).
// The layout, the terminal, the programs and the document's pieces for a bash call live in lib/terminal.js,
// which 6-4 (agent.js) uses too; its first frame is this clip's last picture.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag, example, source, SOURCE_RIGHT } from '../lib/parts.js';
import {
  chatScreen, screenBubbles, chatBubble, screenLinks, toTool, fromTool, writePath, flyMark,
  llmBlock, appFrame, toolBox, channel, actor, token, TOKEN, tokenPlaces, onPath, docLayout, docEntry, rowAt, sweep, send,
  roleMark, markWidth, MARK_H, ROLE, BY, WRITER,
} from '../lib/rig.js';
import { searchLayout, searchLabels, searchPanel, PASSAGES } from '../lib/docsearch.js';
import {
  T, L, ACT, SCREEN, TOOL, DOC, MFONT, DX, SYS, defY, DEFS, defRows, drawDef, callLayout, drawCall, lookLine, halt,
  chipFlight, channelNames, TERM, CHIP, programChips, terminal, progChip, padlock, shellLink, keyRow, gate, person,
  sandbox, NOTE_X, NOTE_Y, llmTag, careCard,
} from '../lib/terminal.js';
import { text, measure, rr, path, circle, line, arrowHead } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { focus, ring, ringBox } from '../../../src/kit/cue.js';
import { place, segment, disc } from '../../../src/kit/place.js';

// ——— the layout: 6-1's and 6-2's (the tool's place taller, the screen shorter), in lib/terminal.js
const S = searchLayout(TOOL);

// ——— 6-2's picture, as search.js has it (its last frame is this clip's first)
const Q62 = '出張の日当は、今年の改定で変わった？';
const Q62_SCREEN = '出張の日当は、\n今年の改定で変わった？';
const DEF62 = 'search_docs';
const DEFS62 = [
  [[DEF62, F.jp(700, 17)], ['：社内の資料を検索する', F.jp(500, 17)]],
  [['入力：query（検索の言葉）', F.jp(500, 17)]],
];
const HEAD62 = [['{"', 'name', '":', ' "', 'search', '_docs', '",'], [' "', 'input', '":', ' {"', 'query', '":']];
const CALLS62 = [[...HEAD62, [' "', '出', '張', ' 日', '当', '"}}']], [...HEAD62, [' "', '202', '6', '年', ' 日', '当', 'の', '改', '定', '"}}']]];
const W2_62 = '2026年 日当の改定';
const RES62 = ['［1］旅費規程 第5条：日当は1日2,000円', '［4］2026年4月の改定：日当を1日2,500円に'];
const ANS62 = '変わりました。4月から、\n1日2,500円です［4］。';
const NOTE62 = '質問、資料、呼び出し、答えは説明のための例';
const ONE62 = 'この例の search_docs は、いちばん近い 1 件を返す';
const SOURCE62 = 'OpenAI（2025-03-11）、Anthropic（2025-05-07）の発表';
const Q1_62 = { u: 0.55, v: 0.44 };
const Q2_62 = { u: 0.3, v: 0.36 };
const FORMS = { x: 30, y: 46, w: 346 };
const FROWS = [
  { label: '先に検索する', chain: ['検索', 'LLM'] },
  { label: 'LLM に選ばせる', chain: ['LLM', '検索', 'LLM', '検索', 'LLM'] },
  { label: '組み合わせる', chain: ['検索', 'LLM', '検索', 'LLM'], opt: 2, note: '足りなければ、LLM が頼む' },
];
const FROW_Y = (k) => FORMS.y + 50 + k * 96;
const FORMS_H = (rows) => (rows === 2 ? FROW_Y(1) + 86 : FROW_Y(2) + 66) - FORMS.y;
const LINK = { font: F.jp(700, 14), h: 28, padX: 10, gap: 18 };
const WEB = { x: 30, y: 586, w: 346, h: 182 };

// ——— the document (6-2's head and fonts; this clip writes in the same places)
const TFONT = F.jp(500, 20); // text in the document
const RFONT = F.jp(500, 16); // 6-2: what the search found
const MLH62 = 28; // 6-2: a row of a call
const MLH = 27; // this clip: a row of a call

// ——— this clip's conversation (an example)
const Q = '今日の日付と、2の64乗を教えて';
// the one definition, at the head (c): lib/terminal.js DEFS
// the LLM's two calls, row by row, as o200k_base cuts them (15 and 26 tokens; none splits a character)
const HEAD = [['{"', 'name', '":', ' "', 'bash', '",'], [' "', 'input', '":', ' {"', 'command', '":']];
const CALL1 = [...HEAD, [' "', 'date', '"}}']];
const CALL2 = [...HEAD, [' "', 'python', '3', ' -', 'c'], [' \'', 'print', '(', '2', '**', '64', ')', '\'"', '}}']];
const PRE = 13; // tokens before the command
const CMD1 = 'date';
const CMD2 = "python3 -c 'print(2**64)'";
const OUT1 = 'Thu Oct 15 14:30:00 JST 2026';
const OUT2 = '18446744073709551616';
// the answer (o200k_base: 25 tokens); in the document it breaks after 「は、」, on the screen after each sentence
const ANS = ['今日は', '202', '6', '年', '10', '月', '15', '日', 'です', '。', '2', 'の', '64', '乗', 'は', '、', '184', '467', '440', '737', '095', '516', '16', 'です', '。'];
const ANS_DOC = '今日は2026年10月15日です。2の64乗は、\n18446744073709551616です。';
const ANS_SCREEN = '今日は2026年10月15日です。\n2の64乗は、\n18446744073709551616です。';
const NOTE = '会話、定義、コマンド、出力は説明のための例。日付は、実行した機械の時計による';

// ——— the programs (a, b), then behind the shell (c on)
const SA = 1.25; // their size while they stand alone (a, b)
const ROWS_A = [['find', 'ls', 'grep'], ['python3', 'bc'], ['date', 'git', 'cat', 'sort'], ['wc', 'sed', 'cp', 'mv', 'rm'], ['curl', 'ssh', 'sudo', '…']];
const GROUPS = ['ファイルを探す', '計算する']; // after rows 0 and 1 of ROWS_A
const LOCKED = ['curl', 'ssh', 'sudo'];
// b: one definition for each (an example of what that would take)
const DEF_LIST = [
  ['find', 'ファイルを探す', 'path（場所）、name（名前）'],
  ['ls', 'ファイルの一覧を出す', 'path（場所）'],
  ['grep', '文字列を探す', 'pattern（探す文字列）、file'],
  ['python3', 'Python のプログラムを動かす', 'code（プログラム）'],
  ['bc', '式を計算する', 'expression（式）'],
  ['date', '日付と時刻を出す', 'format（書式）'],
  ['git', '変更の記録を扱う', 'args（引数）'],
  ['cat', 'ファイルの中身を出す', 'file（ファイル）'],
  ['sort', '行を並べ替える', 'file（ファイル）'],
  ['wc', '行や文字を数える', 'file（ファイル）'],
  ['sed', '文字列を置き換える', 'script、file'],
  ['cp', 'ファイルを写す', 'from、to'],
  ['mv', 'ファイルを動かす', 'from、to'],
  ['rm', 'ファイルを消す', 'path（場所）'],
  ['curl', 'Web から取ってくる', 'url'],
  ['ssh', 'ほかの機械に入る', 'host'],
  ['sudo', '管理者として動かす', 'command'],
];

// ——— the shell: a terminal at the top of the tool's place, the programs under it (lib/terminal.js)
const B_LABEL = TOOL.y + TOOL.h - 42;
const B_KEY = TOOL.y + TOOL.h - 18;

// ——— above and under the LLM
const MAN = { x: 30, y: 46, w: 346, h: 124 }; // h: a manual page
const QA = { x: 30, y: 184, w: 346, h: 92 }; // h: an answer to a question

const FLY = 0.55; // a mark flying out of the app's box
const TOK = 0.42; // a token along the write channel and into its place
const EOT = 0.5; // a mark the LLM writes, the same way
const READ = 0.95; // the app has the LLM read the document
const STEP = 0.32; // the app sees the call's end, before it passes the command on
const GO = 0.6; // the command, from the call to the shell
const WORK = 0.8; // the shell runs it, and the output comes up
const BACK = 0.65; // the output, from the shell into its place

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n token times, evenly from a, the last one landing by b
const times = (n, a, b) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - TOK - a)) / Math.max(1, n - 1));
// a call's token times: the JSON up to the command from a, then the command from wAt, landing by wEnd
function callTimes(nPre, nW, a, wAt, wEnd) {
  const pre = times(nPre, a, Math.max(wAt + TOK - 0.05, a + nPre * 0.05 + TOK));
  const w0 = Math.max(wAt, pre[pre.length - 1] + 0.06);
  return [...pre, ...times(nW, w0, Math.max(wEnd, w0 + nW * 0.06 + TOK))];
}
const upto = (list, ts) => (s) => list.reduce((u, tk, k) => (s >= ts[k] + TOK ? tk.upto : u), 0);

export default clip({
  id: 'shell',
  title: 'コマンドを打つ',
  kicker: 'シェルをツールに',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.9, // 6-2's conversation, search and cards clear away; skipped unless the clip is joined from 6-2
  script: [
    { id: 'a', text: 'コンピュータで使うプログラムには、\n{find}ファイルを探すものや、{calc}計算するものなど、{many}いろいろあるわ。' },
    { id: 'b', tail: 0.5, text: '{each}その一つ一つに、ツールの定義を書いていくのは、\n{endless}きりがないわね。' },
    { id: 'c', text: 'そこで、{shell}シェルを、{one}一つのツールとしてつなぐの。' },
    { id: 'd', text: 'シェルは、{text}文字で書いた指示を受け取って、\n{run}プログラムを動かすなどの処理をする仕組みよ。' },
    { id: 'd2', still: true, text: 'その指示を、{cmd}コマンドと呼ぶわ。' },
    { id: 'e', text: 'ここでは、{input}コマンドをツールの入力にして、\n{out}出力や{err}エラーの知らせを、{text2}文字で返すようにするわ。' },
    { id: 'f', still: true, text: '{both}コマンドも結果も文字でやりとりするから、LLM に、\n{write}コマンドを書かせたり、{read}返った結果を読ませたりできるの。' },
    { id: 'g', text: 'たとえば、{ask}「今日の日付と、2 の 64 乗を[教えて」と|おしえてと]頼まれたら、\n{date}日付を出すコマンドと、{calc2}計算するコマンドを、{order}順に頼めるわ。' },
    { id: 'g2', lead: 1.8, tail: 0.2, rest: 'short', text: 'まず、{c1}[date|デイト] を頼むと、{run1}アプリがシェルで動かして、\n{out1}出力を書き足すわ。' },
    { id: 'g3', lead: 1.8, tail: 0.7, rest: 'short', text: '次に、{c2}計算のコマンドを頼むと、{out2}2 の 64 乗が返ってくるわ。' },
    { id: 'g4', still: true, lead: 1.2, tail: 1.2, text: '{two}二つの出力をもとに、{ans}答えを書くの。' },
    { id: 'h', text: 'コマンドの使い方は、{man}説明書や、{qa}質問への答えとして、\n{many2}たくさんの文章に書かれてきたものね。' },
    { id: 'h2', still: true, text: '{learn}そうした文章から使い方を学んだモデルなら、\n{can}コマンドを書けるのよ。' },
    { id: 'i', still: true, text: '{one2}ツールは一つでも、{beyond}その先で、\n{allowed}実行を許された、{various}いろいろなプログラムを使えるの。' },
    { id: 'j', by: 'zunda', text: '{danger}いろいろなプログラムを動かせるなら、\n危なくないのだ？' },
    { id: 'k', tail: 0.6, text: '危ないこともあるわ。{rm}ファイルを消すコマンドも、\n{perm}実行できる権限があれば、{runs}動いてしまうの。' },
    { id: 'l', text: 'だから、{lim}使えるファイルや操作を絞ったり、{ask2}実行の前に人に\n確かめたり、{box}ふだんの環境と分けた場所で動かしたりするの。' },
    { id: 'l2', tail: 0.4, text: '{ch7}7 章で見ていきましょう。' },
  ],

  prepare(ctx) {
    // ——— 6-2's last picture, laid out as search.js lays it out
    const opts62 = { ...T.DOC, font: TFONT, lh: 28, mono: RFONT, lhMono: 24 };
    const one62 = (e, y) => docLayout(ctx, L, [e], { ...opts62, top: y - DOC.y })[0];
    let y = defY(1) + 28;
    const Qe = one62({ role: 'user', text: Q62 }, y);
    y = Qe.y + Qe.h + 14;
    const c1 = callLayout(ctx, { x: DX, y, w: Qe.w, h: 3 * MLH62 + 16 }, CALLS62[0], MLH62);
    y = c1.band.y + c1.band.h + 10;
    const R1 = one62({ role: 'search', kind: 'data', text: RES62[0] }, y);
    y = R1.y + R1.h + 14;
    const c2 = callLayout(ctx, { x: DX, y, w: Qe.w, h: 3 * MLH62 + 16 }, CALLS62[1], MLH62);
    y = c2.band.y + c2.band.h + 10;
    const R2 = one62({ role: 'search', kind: 'data', text: RES62[1] }, y);
    y = R2.y + R2.h + 16;
    const A = one62({ role: 'assistant', text: ANS62 }, y);
    const aRow = rowAt(A, A.rows.length - 1);
    const aEnd = { x: aRow.x + measure(ctx, A.font, A.rows[A.rows.length - 1]) + 14, y: aRow.y - 21, w: markWidth(ctx, ROLE.end.name) };
    const B = screenBubbles(ctx, SCREEN, [['user', Q62_SCREEN], ['assistant', ANS62]]);
    const lackTag = { x: R1.tx + R1.w - 8, y: R1.y + (R1.h - 24) / 2 };
    const lab = searchLabels(ctx, S);
    const q1 = S.at(Q1_62);
    const q2 = S.at(Q2_62);
    const idx = (n) => PASSAGES.findIndex((p) => p.n === n);
    const p1 = S.pos[idx(1)];
    const p4 = S.pos[idx(4)];
    const shapes = [segment(q1, p1, 2), segment(q2, p4, 2), disc(q1, 10), disc(q2, 10), ...S.pos.map((p) => disc(p, 7)),
      ...[1, 4].map((n) => { const w = measure(ctx, F.jp(700, 13), `［${n}］`); return { kind: 'rect', x: lab[n].x - w / 2, y: lab[n].y - 7, w, h: 14 }; })];
    const qLab = [q1, q2].map((q, k) => {
      const w = measure(ctx, F.jp(700, 13), `${k + 1} 回め`);
      return place(q, { x: -1, y: 0 }, { w, h: 14 }, shapes, { gap: 4, from: 10 + w / 2 });
    });
    const forms = FROWS.map((row, k) => {
      let x = FORMS.x + 16;
      const chips = row.chain.map((s) => {
        const w = measure(ctx, LINK.font, s) + LINK.padX * 2;
        const c = { s, x, w, y: FROW_Y(k) + 24 };
        x += w + LINK.gap;
        return c;
      });
      const end = chips[chips.length - 1].x + chips[chips.length - 1].w;
      const ox = row.opt === undefined ? 0 : chips[row.opt].x - 8;
      const opt = row.opt === undefined ? null : { x: ox, x1: Math.max(end + 8, ox + 16 + measure(ctx, F.jp(500, 13), row.note)) };
      return { chips, x0: chips[0].x, x1: chips[chips.length - 1].x + chips[chips.length - 1].w, opt };
    });
    const old = { Qe, calls: [[c1, R1], [c2, R2]], A, aEnd, B, defs: defRows(ctx, DEFS62), lackTag, lab, q1, q2, qLab, forms };

    // ——— this clip's document: the head, the question, two calls with their output, the answer
    const opts = { ...T.DOC, font: TFONT, lh: 28 };
    const one = (e, yy) => docLayout(ctx, L, [e], { ...opts, top: yy - DOC.y })[0];
    y = defY(1) + 28;
    const Qm = one({ role: 'user', text: Q }, y);
    y = Qm.y + Qm.h + 12;
    const k1 = callLayout(ctx, { x: DX, y, w: Qm.w, h: 3 * MLH + 16 }, CALL1, MLH);
    y = k1.band.y + k1.band.h + 10;
    const O1 = one({ role: 'result', kind: 'data', text: OUT1, font: MFONT, lh: 22 }, y);
    y = O1.y + O1.h + 12;
    const k2 = callLayout(ctx, { x: DX, y, w: Qm.w, h: 4 * MLH + 16 }, CALL2, MLH);
    y = k2.band.y + k2.band.h + 10;
    const O2 = one({ role: 'result', kind: 'data', text: OUT2, font: MFONT, lh: 22 }, y);
    y = O2.y + O2.h + 14;
    const Am = one({ role: 'assistant', text: ANS_DOC }, y);
    if (Am.y + Am.h > DOC.y + DOC.h - 6) throw new Error(`shell: the document overflows (${Am.y + Am.h})`);
    if (Am.rows.length !== 2) throw new Error(`shell: the answer takes ${Am.rows.length} rows`);
    const ansToks = tokenPlaces(ctx, Am, ANS);
    const amRow = rowAt(Am, Am.rows.length - 1);
    const amEnd = { x: amRow.x + measure(ctx, Am.font, Am.rows[Am.rows.length - 1]) + 14, y: amRow.y - 21, w: markWidth(ctx, ROLE.end.name) };
    if (amEnd.x + amEnd.w > Am.tx + Am.w) throw new Error('shell: the answer\'s end mark does not fit');
    [k1, k2].forEach((k) => { if (k.end.x + k.end.w > k.band.x + k.band.w - 6) throw new Error('shell: a call\'s end mark does not fit'); });
    const Bm = screenBubbles(ctx, SCREEN, [['user', Q], ['assistant', ANS_SCREEN]], { font: F.jp(500, 18) });
    const last = Bm[Bm.length - 1];
    if (last.y + last.L.h > SCREEN.y + SCREEN.h - 8) throw new Error('shell: the screen overflows');
    const defs = defRows(ctx, DEFS);
    const defBox = { x: DX - 4, y: SYS.y - 1, w: Math.max(...defs.map((d) => d.right)) - DX + 8, h: defY(1) + 6 - SYS.y + 1 };
    const inBox = { x: DX + 19 - 4, y: defY(1) - 18, w: defs[1].right - DX - 19 + 8, h: 24 };
    // b: one definition per program, two rows each (most of them end up under the paper's edge)
    const many = defRows(ctx, DEF_LIST.flatMap(([n, what, input]) => [[[n, F.jp(700, 17)], [`：${what}`, F.jp(500, 17)]], [[`入力：${input}`, F.jp(500, 17)]]]));

    // ——— the programs: where they stand alone (a, b) and under the shell (c on)
    const cw = (n) => measure(ctx, CHIP.font, n) + CHIP.padX * 2;
    const posA = {};
    const capA = [];
    ROWS_A.forEach((row, r) => {
      let x = TOOL.x + 20;
      row.forEach((n) => {
        posA[n] = { x, y: TOOL.y + 66 + r * 46, w: cw(n) };
        x += cw(n) * SA + 10;
      });
      if (x - 10 > TOOL.x + TOOL.w - 18) throw new Error(`shell: row ${r} of the programs is too wide`);
      if (GROUPS[r]) {
        capA.push({ s: GROUPS[r], x: x + 4, y: TOOL.y + 66 + r * 46 + (CHIP.h * SA) / 2 + 5 });
        if (x + 4 + measure(ctx, F.jp(500, 15), GROUPS[r]) > TOOL.x + TOOL.w - 14) throw new Error('shell: a group\'s caption is too wide');
      }
    });
    const { posB, chipsBox } = programChips(ctx);
    const names = ROWS_A.flat();
    return { old, Qm, k1, O1, k2, O2, Am, ansToks, amEnd, Bm, defs, defBox, inBox, many, posA, posB, capA, names, chipsBox };
  },

  draw(ctx, t, s, { at, pace }) {
    const { old, Qm, k1, O1, k2, O2, Am, ansToks, amEnd, Bm, defs, defBox, inBox, many, posA, posB, capA, names, chipsBox } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 6-2's conversation, search and cards clear away. The first frame is 6-2's untouched.
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.6));
    const fresh = inOutCubic(seg(t, br * 0.6, br));

    // ——— when things happen
    // a: the programs come into the tool's place, a group at a time
    const titleA = tw(t, at('a'), pace.enter);
    const groupAt = { find: 0, ls: 0, grep: 0, python3: 1, bc: 1 };
    const chipIn = (n) => {
      const g = groupAt[n];
      if (g === 0) return tw(t, at('find') - lead + ROWS_A[0].indexOf(n) * pace.stagger, pace.enter, (p) => outBack(p, 1.6));
      if (g === 1) return tw(t, at('calc') - lead + ROWS_A[1].indexOf(n) * pace.stagger, pace.enter, (p) => outBack(p, 1.6));
      const k = names.indexOf(n) - 5;
      return tw(t, at('many') - lead + k * 0.05, pace.enter, (p) => outBack(p, 1.6));
    };
    // b: the app writes one definition per program at the head, faster and faster, past the paper's edge
    const each = at('each') - lead;
    const N = DEF_LIST.length;
    const defAt = (k) => each + 0.15 + (at('endless') + 0.1 - each - 0.15) * Math.pow(k / N, 0.8);
    const manyOut = 1 - tw(t, at('c'), 0.45, inOutCubic);
    // c: the programs step back under the shell; the head gets the one definition
    const shellAt = at('shell') - lead;
    const toB = inOutCubic(seg(t, shellAt, shellAt + 0.9));
    const termIn = tw(t, shellAt + 0.15, 0.6);
    const bashAt = at('one') - lead;
    const bashIn = [seg(t, bashAt, bashAt + 0.45), seg(t, bashAt + 0.3, bashAt + 0.75)];
    // e: the channels are named for what goes along them
    const inName = pop('input');
    const outName = pop('out');
    const errName = pop('err');
    // g: the question; g2–g4: the LLM asks twice, the app runs each command and writes its output in
    const askAt = at('ask') - lead;
    const userAt = askAt + 0.45;
    const round = (id) => {
      const st = at(id);
      const mark = st + 0.05;
      const read = mark + FLY - 0.1;
      return { st, mark, read, wrote: read + READ };
    };
    const r1 = round('g2');
    r1.open = Math.max(r1.wrote, at('c1') - 1.1);
    r1.tok = callTimes(PRE, CALL1[2].length - 1, r1.open + EOT - 0.2, at('c1') - 0.15, at('c1') + 0.35);
    const r2 = round('g3');
    r2.open = Math.max(r2.wrote, at('c2') - 1.1);
    r2.tok = callTimes(PRE, CALL2[2].length + CALL2[3].length - 1, r2.open + EOT - 0.2, at('c2') - 0.15, at('c2') + 0.7);
    [[r1, 'run1', 'out1'], [r2, null, 'out2']].forEach(([r, run, out]) => {
      r.fin = r.tok[r.tok.length - 1] + TOK;
      r.stop = r.fin + EOT;
      r.go = Math.max(r.stop + STEP, run ? at(run) - lead : 0);
      r.work = r.go + GO;
      r.outAt = r.work + 0.5;
      r.back = Math.max(r.work + WORK, at(out) - lead);
      r.resMark = r.back + BACK * 0.35;
      r.resIn = r.back + BACK;
      r.done = r.resIn + 0.35;
    });
    const r3 = round('g4');
    const a3 = Math.max(r3.wrote, at('ans') - 0.35);
    r3.tok = times(ANS.length, a3, Math.max(at('ans') + 0.9, a3 + 1.3));
    r3.fin = r3.tok[r3.tok.length - 1] + TOK;
    r3.endIn = r3.fin + EOT;
    const landedAns = upto(ansToks, r3.tok);
    const callLanded = (c, r) => c.toks.reduce((n, _, k) => (t >= r.tok[k] + TOK ? k + 1 : n), 0);
    // k: a command that deletes files reaches the shell
    const rmGo = at('rm') - lead;
    const rmIn = rmGo + 1.0;
    const runsAt = at('runs') - lead;

    // ——— who is at work
    const actGlow = Math.max(
      span(t, each - 0.1, at('endless') + 0.3),
      span(t, bashAt - 0.1, bashAt + 0.8),
      span(t, userAt - 0.1, userAt + FLY),
      ...[r1, r2, r3].map((r) => span(t, r.mark, r.wrote)),
      ...[r1, r2].map((r) => span(t, r.stop, r.done - 0.2)),
      span(t, r3.tok[0] + TOK, r3.endIn - 0.1),
      span(t, rmGo - 0.15, rmIn - 0.2),
      span(t, at('ask2') - lead, at('box') - lead),
    );
    const [writeLit, readLit] = lit(['write', 'read'], at('f.end'));
    const learnP = inOutCubic(seg(t, at('learn') - lead, at('learn') - lead + 0.9));
    const llmGlow = Math.max(
      writeLit,
      ...[r1, r2].map((r) => span(t, r.wrote - 0.1, r.stop)),
      span(t, r3.wrote - 0.1, r3.endIn - 0.15),
      span(t, at('learn') - lead + 0.5, at('learn') - lead + 1.2),
    );
    const writing = [r1, r2].some((r) => t >= r.open && t < r.stop) || (t >= r3.tok[0] && t < r3.endIn);

    // ——— the chat screen: 6-2's conversation leaves, this one comes in
    chatScreen(ctx, SCREEN, 1);
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      chatBubble(ctx, old.B[0], { alpha: 1 });
      chatBubble(ctx, old.B[1], { alpha: 1, chars: 1 });
      ctx.restore();
    }
    chatBubble(ctx, Bm[0], { alpha: tw(t, askAt, 0.35) });
    chatBubble(ctx, Bm[1], { alpha: tw(t, r3.tok[0] + TOK, 0.2), chars: landedAns(t - 0.12) });
    screenLinks(ctx, T, { talk: 1, back: 1, talkHot: span(t, askAt + 0.05, askAt + 0.8) > 0.5, backHot: span(t, r3.tok[0] + TOK, r3.fin + 0.2) > 0.5 });

    // ——— the LLM, and the app: its frame with the document
    appFrame(ctx, L, 1, { name: '' });
    llmBlock(ctx, L, 1, { glow: llmGlow });
    channel(ctx, L.read, 1, { hot: readLit > 0.5 });
    channel(ctx, L.write, 1, { hot: (llmGlow > 0.5 && writing) || writeLit > 0.5 });
    const chainHot = span(t, bashAt + 0.75, bashAt + 1.5) > 0.5;
    const [inLit, outLit, textLit] = lit(['input', 'out', 'text2'], at('e.end'));
    channel(ctx, L.call, 1, { labelAlpha: 1 - inName, hot: chainHot || inLit > 0.5 || [r1, r2].some((r) => span(t, r.go, r.work) > 0.5) || span(t, rmGo + 0.3, rmIn) > 0.5 });
    channel(ctx, L.back, 1, { labelAlpha: 1 - outName, hot: outLit > 0.5 || [r1, r2].some((r) => span(t, r.back, r.back + BACK * 0.6) > 0.5) });
    channelNames(ctx, { inName, outName, errName, inHot: inLit > 0.5, outHot: outLit > 0.5, ringLit: textLit });

    // ——— the document. 6-2's conversation and definition leave; the system mark at the head stays.
    roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      old.defs.forEach((d, k) => drawDef(ctx, d, defY(k), 1));
      drawOldDoc(ctx, old);
      ctx.restore();
    }
    // b: the definitions pile up past the paper's edge
    if (manyOut > 0.001 && t >= defAt(0)) {
      ctx.save();
      ctx.globalAlpha *= manyOut;
      rr(ctx, DOC.x, DOC.y, DOC.w, DOC.h, 14);
      ctx.clip();
      many.forEach((d, k) => {
        const di = Math.floor(k / 2);
        const at0 = defAt(di) + (k % 2) * 0.12;
        drawDef(ctx, d, defY(k), seg(t, at0, at0 + Math.max(0.12, 0.3 * (1 - di / N))));
      });
      // the paper's lower edge, where they go on
      const ov = pop('endless');
      if (ov > 0.001) {
        const g = ctx.createLinearGradient(0, DOC.y + DOC.h - 70, 0, DOC.y + DOC.h);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(255,255,255,0.95)');
        ctx.globalAlpha = manyOut * ov;
        ctx.fillStyle = g;
        ctx.fillRect(DOC.x, DOC.y + DOC.h - 70, DOC.w, 70);
      }
      ctx.restore();
      tag(ctx, DOC.x + DOC.w - 14, DOC.y + DOC.h - 42, '定義が、まだ続く…', { font: F.jp(700, 15), h: 30, padX: 11, fill: '#fff', stroke: C.red, color: C.red, align: 'right', alpha: manyOut * pop('endless') });
    }
    // c: the one definition
    defs.forEach((d, k) => drawDef(ctx, d, defY(k), bashIn[k]));
    // g: the question
    if (t >= userAt + FLY) {
      docEntry(ctx, Qm, 1, { tagAlpha: 0, chars: tw(t, userAt + FLY - 0.05, 0.3) });
      roleMark(ctx, Qm.x, Qm.y + 1, ROLE.user, { edge: WRITER.user });
    }
    // g2, g3: the assistant's mark, the call, the output
    const calls = [[k1, r1, callLanded(k1, r1), O1], [k2, r2, callLanded(k2, r2), O2]];
    calls.forEach(([c, r, n, O]) => {
      if (t >= r.mark + FLY) roleMark(ctx, DOC.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
      drawCall(ctx, c, { bandA: tw(t, r.open + EOT - 0.1, 0.25), open: t >= r.open + EOT, n, end: t >= r.fin + EOT });
      if (t >= r.resMark + FLY) roleMark(ctx, O.x, O.y + 1, ROLE.result, { edge: WRITER.result });
      const oi = tw(t, r.resIn - 0.05, 0.3);
      if (oi > 0) docEntry(ctx, O, oi, { tagAlpha: 0, chars: seg(t, r.resIn, r.resIn + 0.45) });
    });
    // g4: the assistant's mark, the answer, its end
    if (t >= r3.mark + FLY) roleMark(ctx, Am.x, Am.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    const ca = landedAns(t);
    if (ca > 0) docEntry(ctx, Am, 1, { tagAlpha: 0, chars: ca });
    if (t >= r3.endIn) roleMark(ctx, amEnd.x, amEnd.y, ROLE.end, { edge: WRITER.end });
    // a cursor after the assistant's mark, while the LLM reads, until it writes
    const cur = [[r1, k1.open], [r2, k2.open]].find(([r]) => t >= r.read && t < r.open + EOT);
    const cursor = cur ? { x: cur[1].x, y: cur[1].y + MARK_H - 2 } : t >= r3.read && t < r3.tok[0] + TOK ? (() => { const p = rowAt(Am, 0); return { x: p.x, y: p.y + 6 }; })() : null;
    if (cursor && Math.floor(t * 2.5) % 2 === 0) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(cursor.x, cursor.y - 30, 4, 30);
    }
    // rings on the document
    const [inDefLit] = lit(['input'], at('out'));
    ringBox(ctx, inBox, inDefLit, C.accent, 2);
    const [oneLit] = lit(['one2'], at('beyond'));
    ringBox(ctx, defBox, oneLit, C.accent);
    const [twoLit] = lit(['two'], at('ans'));
    const box = (E) => ({ x: E.tx, y: E.y, w: E.w, h: E.h });
    ringBox(ctx, [box(O1), box(O2)], twoLit, C.accent);
    const [canLit] = lit(['can'], at('h2.end'));
    ringBox(ctx, [k1.band, k2.band], canLit, C.accent);
    // the reads: the app hands the document over
    [[r1, k1.band.y], [r2, k2.band.y], [r3, Am.y]].forEach(([r, yy]) => {
      sweep(ctx, L, seg(t, r.read + 0.05, r.read + READ), yy + MARK_H);
      send(ctx, L.read, seg(t, r.read + 0.4, r.read + READ + 0.05), '', 'doc');
    });
    // f: the LLM reads (a schematic read of the head)
    send(ctx, L.read, seg(t, at('read') - lead, at('read') - lead + 0.8), '', 'doc');

    // ——— the app's box; it sees where each call ends, and stops the writing
    actor(ctx, ACT, 1, actGlow);
    [[r1, k1], [r2, k2]].forEach(([r, c]) => {
      const lk = span(t, r.stop - 0.05, r.go + 0.25);
      if (lk > 0) lookLine(ctx, c.end, tw(t, r.stop - 0.05, 0.3, inOutCubic), lk);
    });
    halt(ctx, Math.max(...[r1, r2].map((r) => span(t, r.fin + EOT - 0.05, r.go + 0.5))));
    // l: a person is asked before it runs — on the way to the shell
    gate(ctx, (L.call.x1 + L.call.x2) / 2, L.call.y, pop('ask2'));

    // ——— the tool's place. 6-2's search clears; the programs come in (a), then the shell over them (c)
    const [termLit, bothLit] = [lit(['beyond'], at('allowed'))[0], lit(['both'], at('write'))[0]];
    const [variousLit] = lit(['various'], at('i.end'));
    const [dangerLit] = lit(['danger'], at('j.end'));
    const [cmdLit] = lit(['cmd'], at('d2.end'));
    const [dateLit, calcLit, orderLit] = lit(['date', 'calc2', 'order'], at('g.end'));
    const [permLit] = lit(['perm'], at('runs'));
    toolBox(ctx, L, 1, {
      solid: 1,
      draw: (c) => {
        if (gone > 0.001) last62Search(c, old, gone);
        // a, b: the programs, alone
        text(c, 'コンピュータのプログラム', TOOL.x + 20, TOOL.y + 38, { font: F.jp(700, 21), color: C.ink, alpha: titleA * (1 - toB) });
        capA.forEach((g, k) => text(c, g.s, g.x, g.y, { font: F.jp(500, 15), color: C.ink2, alpha: (k ? pop('calc') : pop('find')) * (1 - toB) }));
        // c on: the shell
        const lines = termLines({ at, lead, r1, r2, rmIn, runsAt, shellIn: shellAt + 0.5 });
        const tm = terminal(c, t, termIn, lines);
        // d2: the instruction is a command
        if (tm) {
          const l0 = tm.box(0, 'ls');
          ringBox(c, l0, cmdLit, C.accent, 0);
          tag(c, l0.x + l0.w + 14, l0.y, 'コマンド', { font: F.jp(700, 12), h: 20, padX: 7, fill: C.accent, color: '#fff', r: 5, alpha: pop('cmd') * (1 - tw(t, at('g'), 0.4)) * termIn });
          // k: the command that deletes, and what it deleted
          const rmLine = tm.box(10);
          tag(c, rmLine.x + rmLine.w + 12, rmLine.y, 'ファイルを消す', { font: F.jp(700, 12), h: 20, padX: 7, fill: '#fff', stroke: C.red, color: C.red, r: 5, alpha: tm.shown(10) * tw(t, rmIn + 0.2, pace.enter) });
          const gone9 = tm.box(9, 'reports/', 'memo.txt  ');
          const strike = tw(t, runsAt + 0.5, 0.4);
          if (strike > 0.001 && tm.shown(9) > 0.001) {
            c.save();
            c.globalAlpha *= tm.shown(9);
            c.strokeStyle = C.red;
            c.lineWidth = 2.5;
            line(c, gone9.x - 2, gone9.y + gone9.h / 2, gone9.x + gone9.w + 2, gone9.y + gone9.h / 2, strike);
            c.restore();
            tag(c, gone9.x + gone9.w + 12, gone9.y, '消えた', { font: F.jp(700, 12), h: 20, padX: 7, fill: C.red, color: '#fff', r: 5, alpha: strike * tm.shown(9) });
          }
        }
        ringBox(c, TERM, Math.max(termLit, bothLit), C.accent, 4);
        // the links from the shell down to the program it runs
        const runLinks = [['ls', span(t, at('run') - lead, at('d.end'))], ['date', span(t, r1.work + 0.25, r1.back)], ['python3', span(t, r2.work + 0.25, r2.back)], ['rm', span(t, rmIn + 0.2, runsAt + 0.9)]];
        runLinks.forEach(([n, a]) => shellLink(c, posB[n], a * toB, n === 'rm' ? C.red : C.accent));
        // the programs
        names.forEach((n, k) => {
          const a0 = posA[n];
          const b0 = posB[n];
          const st = Math.min(1, toB * 1.15 - (k / names.length) * 0.15);
          const p = inOutCubic(clamp(st));
          const defK = DEF_LIST.findIndex(([m]) => m === n);
          const defLit = defK >= 0 ? span(t, defAt(defK) - 0.05, defAt(defK) + 0.35, 0.08, 0.25) : n === '…' ? span(t, defAt(N), at('endless') + 0.6, 0.1, 0.3) : 0;
          const runLit = runLinks.reduce((m, [rn, a]) => (rn === n ? Math.max(m, a) : m), 0);
          const plan = n === 'date' ? dateLit : n === 'python3' ? calcLit : 0;
          progChip(c, lerp(a0.x, b0.x, p), lerp(a0.y, b0.y, p), a0.w, lerp(SA, 1, p), n, {
            a: chipIn(n),
            lit: Math.max(defLit, n === 'rm' ? 0 : runLit, plan),
            lock: LOCKED.includes(n) ? pop('allowed') : n === 'rm' ? pop('lim') : 0,
            red: n === 'rm' ? tw(t, rmGo, pace.enter) * (1 - pop('lim')) : 0,
            ok: n === 'rm' ? pop('perm') * (1 - pop('lim')) : 0,
          });
        });
        // g: which program does which, in order
        [['date', 1, 'date'], ['python3', 2, 'calc2']].forEach(([n, k, id]) => {
          const b0 = posB[n];
          const a = pop(id) * (1 - tw(t, at('h'), 0.4));
          const sc = 1 + (cue.scale - 1) * orderLit;
          badge(c, b0.x + 7, b0.y - 4, String(k), a, sc);
        });
        ringBox(c, posB.rm, permLit, C.red, 3);
        ringBox(c, chipsBox, Math.max(variousLit, dangerLit), C.accent, 2);
        // under the programs: what they are, and the key to the locks and the check
        text(c, 'シェルの先のプログラム', TOOL.x + 16, B_LABEL, { font: F.jp(700, 15), color: C.muted, alpha: tw(t, shellAt + 0.6, pace.enter) });
        keyRow(c, TOOL.x + 16, B_KEY, pop('allowed'), pop('perm') * (1 - pop('lim')));
      },
    });
    const lw = text(ctx, 'ツール', TOOL.x, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    text(ctx, 'の場所', TOOL.x + lw, TOOL.y - 16, { font: F.jp(700, 22), color: C.ink });
    // 6-2's note beside the name, clearing away
    if (gone > 0.001) {
      const w0 = measure(ctx, F.jp(700, 22), 'の場所');
      text(ctx, 'LLM が頼むツール', TOOL.x + lw + w0 + 14, TOOL.y - 17, { font: F.jp(700, 15), color: C.ink, alpha: gone });
    }
    // j: is it not dangerous?
    qMark(ctx, TOOL.x + TOOL.w - 16, TOOL.y - 26, pop('danger') * (1 - tw(t, at('k'), 0.4)));
    // l: a place apart from the usual environment
    sandbox(ctx, pop('box'));

    // ——— above the LLM: 6-2's card (clearing away), the texts on commands (h), what is done (l)
    if (gone > 0.001) drawForms62(ctx, old.forms, gone);
    papers(ctx, t, { man: pop('man'), qa: pop('qa'), many: pop('many2'), learn: learnP });
    careCard(ctx, { card: tw(t, at('l'), pace.enter), rows: [pop('lim'), pop('ask2'), pop('box')], ch7: pop('ch7') });

    // ——— under the LLM: 6-2's card (clearing away); what the LLM does with the shell (f, h2)
    if (gone > 0.001) drawWeb62(ctx, gone);
    llmTag(ctx, NOTE_Y[0], 'コマンドを書く', pop('write'));
    llmTag(ctx, NOTE_Y[1], '結果を読む', pop('read'));
    llmTag(ctx, NOTE_Y[2], 'コマンドの使い方を学習', tw(t, at('learn') - lead + 0.7, pace.enter));
    text(ctx, '何を学んだかは、モデルによって違う', NOTE_X, NOTE_Y[2] + 52, { font: F.jp(500, 13), color: C.muted, align: 'center', alpha: tw(t, at('learn') - lead + 0.9, pace.enter) });
    if (gone > 0.001) source(ctx, SOURCE62, gone, SOURCE_RIGHT);

    // ——— in flight, over everything
    // g: the question's mark
    flyMark(ctx, T, Qm, seg(t, userAt, userAt + FLY), ROLE.user, { edge: WRITER.user });
    // each round: the assistant's mark out of the app's box
    [[r1, { x: DOC.x + 18, y: k1.band.y }], [r2, { x: DOC.x + 18, y: k2.band.y }], [r3, Am]].forEach(([r, E]) => {
      flyMark(ctx, T, E, seg(t, r.mark, r.mark + FLY), ROLE.assistant, { edge: WRITER.assistant });
    });
    // the calls: the LLM's call mark, tokens and end mark, along the write channel and in under the band;
    // then the command to the shell, its output back into its place, and the result's mark
    calls.forEach(([c, r, , O], k) => {
      const lane = { y: c.band.y, h: c.band.h };
      const po = seg(t, r.open, r.open + EOT);
      if (po > 0 && po < 1) {
        const pt = onPath(writePath(T, lane, c.open.x + c.open.w / 2, c.open.y + MARK_H / 2), inOutCubic(po));
        roleMark(ctx, pt.x - c.open.w / 2, pt.y - MARK_H / 2, ROLE.call, { edge: WRITER.call, alpha: clamp(po * 8) });
      }
      c.toks.forEach((tk, j) => {
        const p = seg(t, r.tok[j], r.tok[j] + TOK);
        if (p <= 0 || p >= 1) return;
        const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
        const pt = onPath(writePath(T, lane, tk.x + tk.w / 2, tk.y), inOutCubic(p));
        token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
      });
      const pe = seg(t, r.fin, r.fin + EOT);
      if (pe > 0 && pe < 1) {
        const pt = onPath(writePath(T, lane, c.end.x + c.end.w / 2, c.end.y + MARK_H / 2), inOutCubic(pe));
        roleMark(ctx, pt.x - c.end.w / 2, pt.y - MARK_H / 2, ROLE.callEnd, { edge: WRITER.callEnd, alpha: clamp(pe * 8) });
      }
      const band = { tx: c.band.x, w: c.band.w, y: c.band.y, h: c.band.h };
      chipFlight(ctx, seg(t, r.go, r.go + GO), toTool(T, band), k ? 'python3 -c …' : CMD1, 'call');
      const bp = seg(t, r.back, r.back + BACK);
      chipFlight(ctx, bp < 1 ? bp : 0.999, fromTool(T, O, 0, O.tx + 120), '出力', 'found', bp < 1 ? null : 1 - tw(t, r.resIn - 0.05, 0.25));
      flyMark(ctx, T, O, seg(t, r.resMark, r.resMark + FLY), ROLE.result, { edge: WRITER.result });
    });
    // g4: the answer's tokens and its end mark
    ansToks.forEach((tk, k) => {
      const p = seg(t, r3.tok[k], r3.tok[k] + TOK);
      if (p <= 0 || p >= 1) return;
      const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
      const pt = onPath(writePath(T, Am, tk.x + w / 2, tk.y), inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
    });
    const pe3 = seg(t, r3.fin, r3.endIn);
    if (pe3 > 0 && pe3 < 1) {
      const pt = onPath(writePath(T, Am, amEnd.x + amEnd.w / 2, amEnd.y + MARK_H / 2), inOutCubic(pe3));
      roleMark(ctx, pt.x - amEnd.w / 2, pt.y - MARK_H / 2, ROLE.end, { edge: WRITER.end, alpha: clamp(pe3 * 8) });
    }
    // k: the app passes on a command that deletes files
    const y0 = ACT.y + ACT.h - 20;
    chipFlight(ctx, seg(t, rmGo, rmIn), [[ACT.x + ACT.w - 40, y0], [T.lane, y0], [T.lane, L.call.y], [L.call.x2, L.call.y], [TOOL.x + 10, L.call.y]], 'rm -r reports', 'call');

    // ——— the example's note (6-2's gives way)
    const ex = { x: L.app.x, y: L.app.y + L.app.h + 22 };
    const exW = measure(ctx, F.jp(700, 17), '例') + 20;
    example(ctx, ex.x, ex.y, 1, '');
    text(ctx, NOTE62, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: gone });
    text(ctx, NOTE, ex.x + exW + 10, ex.y + 21, { font: F.jp(400, 17), color: C.muted, alpha: fresh });
  },
});

// ——— the document's pieces (6-2's, and this clip's) ———————————————————————————————————————

// 6-2's document as it ends: the question, the two calls and what they found, the answer, the note on [1].
function drawOldDoc(ctx, o) {
  docEntry(ctx, o.Qe, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.Qe.x, o.Qe.y + 1, ROLE.user, { edge: WRITER.user });
  o.calls.forEach(([c, R]) => {
    roleMark(ctx, DOC.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    drawCall(ctx, c, { bandA: 1, open: true, n: c.toks.length, end: true });
    roleMark(ctx, R.x, R.y + 1, ROLE.search, { edge: BY.app });
    docEntry(ctx, R, 1, { tagAlpha: 0, chars: 1 });
  });
  roleMark(ctx, o.A.x, o.A.y + 1, ROLE.assistant, { edge: WRITER.assistant });
  docEntry(ctx, o.A, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.aEnd.x, o.aEnd.y, ROLE.end, { edge: WRITER.end });
  tag(ctx, o.lackTag.x, o.lackTag.y, '改定の話はない', { font: F.jp(700, 13), h: 24, padX: 8, fill: '#fff', stroke: C.red, color: C.red, align: 'right', alpha: 1 });
}

// ——— the shell (its pieces are in lib/terminal.js) ——————————————————————————————————————————

// What the terminal shows, and when: commands (typed after the prompt) and what they print.
function termLines({ at, lead, r1, r2, rmIn, runsAt, shellIn }) {
  const k0 = at('k');
  return [
    { s: 'ls', cmd: true, show: shellIn, type: at('text') - lead + 0.05 },
    { s: 'memo.txt  reports/', show: at('run') - lead + 0.45 },
    { s: 'sl', cmd: true, show: at('err') - lead - 0.25, type: at('err') - lead - 0.2 },
    { s: 'bash: sl: command not found', err: true, show: at('err') - lead + 0.2 },
    { s: CMD1, cmd: true, show: r1.work, type: r1.work + 0.02 },
    { s: OUT1, show: r1.outAt },
    { s: CMD2, cmd: true, show: r2.work, type: r2.work + 0.02 },
    { s: OUT2, show: r2.outAt },
    { s: 'ls', cmd: true, show: k0 + 0.05, type: k0 + 0.1 },
    { s: 'memo.txt  reports/', show: k0 + 0.5 },
    { s: 'rm -r reports', cmd: true, red: true, show: rmIn, type: rmIn + 0.02 },
    { s: 'ls', cmd: true, show: runsAt, type: runsAt + 0.05 },
    { s: 'memo.txt', show: runsAt + 0.45 },
  ];
}

// A numbered badge (g: the order the LLM asks in).
function badge(ctx, x, y, s, a, sc = 1) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.fillStyle = C.accent;
  circle(ctx, 0, 0, 8.5);
  ctx.fill();
  ctx.restore();
  text(ctx, s, x, y + 1, { font: F.sans(700, 12), color: '#fff', align: 'center', base: 'middle', alpha: a });
}

// j: a question over the tool's place (5-3's mark).
function qMark(ctx, x, y, a, r = 16) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  circle(ctx, x, y, r);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  text(ctx, '？', x, y + 1, { font: F.jp(700, Math.round(r * 1.3)), color: C.red, align: 'center', base: 'middle', alpha: a });
}

// ——— h: texts on how to use commands; h2: they go into the model —————————————————————————————

function papers(ctx, t, { man, qa, many, learn }) {
  if (man <= 0.001 && qa <= 0.001) return;
  const out = 1 - clamp((learn - 0.55) / 0.45);
  if (out <= 0.001) return;
  // h2: the papers shrink into the LLM
  const into = (b, k, fn) => {
    const p = clamp(learn * 1.1 - k * 0.1);
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const tx = lerp(cx, NOTE_X, p);
    const ty = lerp(cy, L.llm.y + L.llm.h / 2, p);
    const sc = lerp(1, 0.12, p);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(sc, sc);
    ctx.translate(-cx, -cy);
    ctx.globalAlpha *= out;
    fn();
    ctx.restore();
  };
  // more papers behind (h: たくさんの文章)
  if (many > 0.001) {
    into(QA, 1, () => {
      [2, 1].forEach((k) => {
        ctx.save();
        ctx.globalAlpha *= many;
        rr(ctx, QA.x + k * 7, QA.y + k * 7, QA.w, QA.h, 10);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = C.rule;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });
    });
    text(ctx, 'ほかにも、たくさんの文章', QA.x + QA.w, QA.y + QA.h + 38, { font: F.jp(500, 13), color: C.muted, align: 'right', alpha: many * (1 - clamp(learn * 3)) });
  }
  if (man > 0.001) into(MAN, 0, () => manPage(ctx, man));
  if (qa > 0.001) into(QA, 1, () => qaPage(ctx, qa));
}

function sheet(ctx, b, a, label) {
  const dy = (1 - a) * 8;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, b.x, b.y + dy, b.w, b.h, 10);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  tag(ctx, b.x + b.w - 10, b.y + 8 + dy, label, { font: F.jp(700, 12), h: 22, padX: 7, fill: C.panel, color: C.ink2, align: 'right', r: 6, alpha: a });
  return dy;
}

// A manual page (the start of GNU coreutils' date(1)).
function manPage(ctx, a) {
  const b = MAN;
  const dy = sheet(ctx, b, a, '説明書');
  const x = b.x + 14;
  const head = F.mono(700, 12);
  const body = F.mono(500, 11.5);
  text(ctx, 'DATE(1)', x, b.y + 26 + dy, { font: head, color: C.ink, alpha: a });
  text(ctx, 'User Commands', x + 92, b.y + 26 + dy, { font: F.mono(500, 12), color: C.ink2, alpha: a });
  text(ctx, 'NAME', x, b.y + 50 + dy, { font: head, color: C.ink, alpha: a });
  text(ctx, 'date - print or set the system date and time', x + 10, b.y + 68 + dy, { font: body, color: C.ink2, alpha: a });
  text(ctx, 'SYNOPSIS', x, b.y + 92 + dy, { font: head, color: C.ink, alpha: a });
  text(ctx, 'date [OPTION]... [+FORMAT]', x + 10, b.y + 110 + dy, { font: body, color: C.ink2, alpha: a });
}

// An answer to a question, as a Q&A page has it (an example).
function qaPage(ctx, a) {
  const b = QA;
  const dy = sheet(ctx, b, a, '質問への答え（例）');
  const x = b.x + 14;
  tag(ctx, x, b.y + 30 + dy, '質問', { font: F.jp(700, 12), h: 22, padX: 6, fill: C.blueSoft, color: C.blue, r: 5, alpha: a });
  text(ctx, '2 の 64 乗を、コマンドで計算するには？', x + 44, b.y + 46 + dy, { font: F.jp(500, 14), color: C.ink, alpha: a });
  tag(ctx, x, b.y + 58 + dy, '回答', { font: F.jp(700, 12), h: 22, padX: 6, fill: C.greenSoft, color: C.green, r: 5, alpha: a });
  const w = text(ctx, "python3 -c 'print(2**64)'", x + 44, b.y + 74 + dy, { font: F.mono(500, 12.5), color: C.ink, alpha: a });
  text(ctx, ' で出せます。', x + 44 + w, b.y + 74 + dy, { font: F.jp(500, 13), color: C.ink, alpha: a });
}

// ——— 6-2's search, cards and notes as they end (search.js) ——————————————————————————————————

const IDX = (n) => PASSAGES.findIndex((p) => p.n === n);
const LABEL = F.jp(700, 13);
const QDOT = 7;

// 6-2's search panel at its end: the panel, the two searches' lines, dots and labels, the second words.
function last62Search(c, o, a) {
  const { lab, q1, q2, qLab } = o;
  searchPanel(c, S, lab, { a, docs: () => 1, title: 1, kinds: 0, query: { a: 0 }, found: [], model: 1, caption: 1, vec: 1, near: [], miss: 0 });
  c.save();
  c.globalAlpha *= a;
  c.save();
  c.globalAlpha *= lerp(1, 0.45, 1);
  lines(c, q1, [1], [1]);
  c.restore();
  lines(c, q2, [4], [1]);
  greens(c, lab, [1, 4], [1, 1]);
  hollow(c, q1, 1, '1 回め', qLab[0]);
  const qm = { x: lerp(q1.x, q2.x, 1), y: lerp(q1.y, q2.y, 1) };
  qDot(c, qm, 1, '2 回め', qLab[1], 1);
  queryRow(c, { s: W2_62, a: 1, chars: 1, dot: 1 });
  text(c, ONE62, S.miss.x, S.miss.y + 24, { font: F.jp(500, 13), color: C.muted, alpha: 1 });
  const titleW = measure(c, F.jp(700, 21), '社内の資料の検索');
  tag(c, S.title.x + titleW + 10, S.title.y - 20, DEF62, { font: F.mono(600, 13), h: 24, padX: 8, fill: C.ink, color: C.paper, r: 6, alpha: 1 });
  c.restore();
}

// The words the search ran with: the tag, the vector's dot, the words.
function queryRow(ctx, o) {
  const a = o.a ?? 0;
  if (a <= 0.001) return;
  const w = tag(ctx, S.query.x, S.query.y, '検索の言葉', { font: F.jp(700, 13), h: 26, padX: 9, fill: '#fff', stroke: C.purple, color: C.purple, alpha: a });
  const dx = S.query.x + w + 10;
  const cy = S.query.y + 13;
  const dot = o.dot ?? 0;
  if (dot > 0.001) {
    ctx.save();
    ctx.globalAlpha *= a * dot;
    ctx.fillStyle = C.accent;
    circle(ctx, dx + 6, cy, 6);
    ctx.fill();
    ctx.restore();
  }
  const tx = dx + 18;
  const chars = Array.from(o.s);
  text(ctx, chars.slice(0, Math.round(chars.length * clamp(o.chars ?? 1))).join(''), tx, cy + 6, { font: F.jp(500, 17), color: C.ink, alpha: a });
}

// Green lines from the words' dot q to passages ns, each drawn up to p.
function lines(ctx, q, ns, ps) {
  ns.forEach((n, k) => {
    const p = ps[k] ?? 0;
    if (p <= 0.001) return;
    const d = S.pos[IDX(n)];
    ctx.save();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    line(ctx, q.x, q.y, d.x, d.y, p);
    ctx.restore();
  });
}

// The passages found: green dots with their numbers.
function greens(ctx, lab, ns, as) {
  ns.forEach((n, k) => {
    const a = as[k] ?? 0;
    if (a <= 0.001) return;
    const d = S.pos[IDX(n)];
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = C.green;
    circle(ctx, d.x, d.y, 5.5);
    ctx.fill();
    ctx.restore();
    text(ctx, `［${n}］`, lab[n].x, lab[n].y + 5, { font: LABEL, color: C.green, align: 'center', alpha: a });
  });
}

// The words' dot on the map, with its label (at the centre l).
function qDot(ctx, q, a, s, l, la = 1) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = C.accent;
  circle(ctx, q.x, q.y, QDOT * Math.min(1.15, 0.6 + a * 0.5));
  ctx.fill();
  ctx.restore();
  text(ctx, s, l.x, l.y + 5, { font: LABEL, color: C.accent, align: 'center', alpha: a * la });
}

// Where the first words landed, once the second had moved on.
function hollow(ctx, q, a, s, l) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  circle(ctx, q.x, q.y, QDOT - 1);
  ctx.stroke();
  ctx.restore();
  text(ctx, s, l.x, l.y + 5, { font: LABEL, color: C.accent, align: 'center', alpha: a * 0.8 });
}

function linkChip(ctx, c, a) {
  if (a <= 0.001) return;
  const llm = c.s === 'LLM';
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, c.x, c.y, c.w, LINK.h, 7);
  ctx.fillStyle = llm ? C.ink : '#fff';
  ctx.fill();
  if (!llm) {
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, c.s, c.x + c.w / 2, c.y + LINK.h / 2 + 1, { font: LINK.font, color: llm ? '#fff' : C.ink, align: 'center', base: 'middle', alpha: a });
}

function linkArrow(ctx, a, b, p) {
  if (p <= 0.001) return;
  const y = b.y + LINK.h / 2;
  const x1 = a.x + a.w + 4;
  const x2 = b.x - 4;
  ctx.save();
  ctx.globalAlpha *= clamp(p);
  ctx.strokeStyle = ctx.fillStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 5, y);
  ctx.stroke();
  arrowHead(ctx, x2, y, 0, 7);
  ctx.restore();
}

// 6-2's card of the order of the exchanges, as it ends (three rows, the brackets, the RAG tag), at alpha a.
function drawForms62(ctx, forms, a) {
  const H = lerp(FORMS_H(2), FORMS_H(3), 1);
  ctx.save();
  ctx.globalAlpha = a;
  rr(ctx, FORMS.x, FORMS.y, FORMS.w, H, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'やりとりの順（この例）', FORMS.x + 16, FORMS.y + 30, { font: F.jp(700, 16), color: C.ink2, alpha: a });
  FROWS.forEach((row, k) => {
    const f = forms[k];
    const y = FROW_Y(k);
    const lw = text(ctx, row.label, FORMS.x + 16, y + 15, { font: F.jp(700, 15), color: C.ink, alpha: a });
    if (k === 1) tag(ctx, FORMS.x + 16 + lw + 10, y - 3, '広い意味で RAG', { font: F.jp(700, 13), h: 24, padX: 8, fill: '#fff', stroke: C.accent, color: C.accent, r: 6, alpha: a });
    ctx.save();
    ctx.translate(0, 0);
    if (f.opt) {
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      rr(ctx, f.opt.x, y - 4, f.opt.x1 - f.opt.x, f.chips[0].y + LINK.h + 6 - (y - 4), 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      text(ctx, row.note, f.opt.x + 8, y + 13, { font: F.jp(500, 13), color: C.muted, alpha: a });
    }
    f.chips.forEach((c, i) => {
      if (i > 0) linkArrow(ctx, f.chips[i - 1], c, a);
      linkChip(ctx, c, a);
    });
    ctx.restore();
    if (k < 2) {
      const by = y + 62;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      path(ctx, [[f.x0, by - 6], [f.x0, by], [f.x1, by], [f.x1, by - 6]], 1);
      ctx.restore();
      const cx = (f.x0 + f.x1) / 2;
      const font = F.jp(500, 13);
      const w1 = measure(ctx, font, '時間');
      const w2 = measure(ctx, font, '・費用');
      const x0 = cx - (w1 + w2 * 1) / 2;
      text(ctx, '時間', x0, by + 17, { font, color: C.ink2, alpha: a });
      text(ctx, '・費用', x0 + w1, by + 17, { font, color: C.ink2, alpha: a });
    }
  });
}

// 6-2's card of the Web search tools of 2025, as it ends, at alpha a.
function drawWeb62(ctx, a) {
  const { x, y, w, h } = WEB;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(0, 0);
  rr(ctx, x, y, w, h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  const gx = x + 28;
  const gy = y + 28;
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.8;
  circle(ctx, gx, gy, 11);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(gx, gy, 4.5, 11, 0, 0, Math.PI * 2);
  ctx.stroke();
  line(ctx, gx - 11, gy, gx + 11, gy);
  ctx.restore();
  text(ctx, 'Web を検索するツール', x + 48, y + 34, { font: F.jp(700, 17), color: C.ink, alpha: a });
  text(ctx, '公開された Web を調べる（社内の資料の検索とは別）', x + 16, y + 62, { font: F.jp(500, 12), color: C.muted, alpha: a });
  text(ctx, '2025', x + 16, y + 126, { font: F.cond(700, 40), color: C.ink, alpha: a });
  [['OpenAI', '3 月', 'Responses API で、プレビュー'], ['Anthropic', '5 月', 'Messages API で、提供を開始']].forEach(([who, month, what], k) => {
    const ry = y + 96 + k * 48;
    const ww = text(ctx, who, x + 108, ry, { font: F.jp(700, 15), color: C.ink, alpha: a });
    text(ctx, month, x + 108 + ww + 10, ry, { font: F.jp(700, 15), color: C.ink2, alpha: a });
    text(ctx, what, x + 108, ry + 21, { font: F.jp(500, 13), color: C.ink2, alpha: a });
  });
}
