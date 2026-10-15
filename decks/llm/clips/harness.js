// 7-1: the program around the LLM. Chapter 6 connected tools to the LLM and built an AI agent; all the while
// the app was made to do a number of jobs: put the conversation and the tools' definitions into one document
// and have the LLM read it; when the LLM writes a tool call, run the tool and write its result in; repeat that
// until the answer is written; ask the user before an operation that reaches outside. A program around the
// LLM that builds the document, runs the tools and turns the loop is called a harness — the app's box takes
// the name, the「7 章　ハーネス」tag that 6-6 left flying into it. ずんだもん asks whether it is something other
// than the app: it is the same; Anthropic and OpenAI call this part of an agent, outside the LLM, its harness.
// The same LLM, in another harness, can do other things and score otherwise (chapter 10). Then back to 6-4:
// the errors of 7 October were mostly the database timing out, and why was not known. Now the user asks for
// the cause to be found and fixed, and for what was found to go into an issue on GitHub — a long task, which
// the chapter follows to its end, adding to the harness one job after another (the last picture is the
// chapter's contents, as dashed cards in the harness's frame).
//
// The layout is chapter 7's (lib/harness.js; this clip lays it out for the chapter). The clip joins 6-6 (spec
// §6.10): its first frame is 6-6's last picture, drawn here as gui.js draws it, and the bridge clears 6-6's
// conversation, its screen and fence, the outside service and the OSWorld cards, then gives the screen its
// height and the tool's place its shell. The「7 章　ハーネス」tag stays (it moves left, out of the way of the
// loop). Everything in the conversation is an example: the request, the logs and the commands' output (6-4's),
// the report, the document's entries (grey bars where the words do not matter); the naming is a fact
// (research/harness-jobs-facts).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import {
  chatScreen, screenBubbles, chatBubble, screenLinks, toTool, fromTool, writePath, flyMark, llmBlock, appFrame,
  channel, token, TOKEN, onPath, docLayout, docEntry, rowAt, sweep, send, roleMark, markWidth, MARK_H, ROLE, WRITER,
  toolUseLayout, loopIcon, working, G5,
} from '../lib/rig.js';
import { T as T64, DX, SYS, defY, DEFS, defRows, drawDef, callLayout, drawCall, CHIP, TL, progChip, check, padlock, gate } from '../lib/terminal.js';
import {
  G7, SCREEN_H, HARNESS_W, NAME, NAME_X, harnessLayout, mix7, T7, L7, DOC7, TOOL7, TERM7, DOC7_SHORT, UNDER7,
  harnessBox, toolPlace, shell, exampleNote, marker, paperTop, chipGo, framePath, perimeter, REPORT64, ASK7_SCREEN,
  ASK7_DOC, term64Lines, jobBox, jobCards, TOC, tocBox, tocCards, textBar,
} from '../lib/harness.js';
import { text, measure, rr, line } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outBack } from '../../../src/kit/ease.js';
import { focus, ring, ringBox } from '../../../src/kit/cue.js';

// ——— 6-6's last picture, as gui.js has it (its last frame is this clip's first) ——————————————————————————
const TFONT = F.jp(500, 20); // text in the document
const MLH = 26; // a row of a call
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
const VIS6 = DOC6.y + DOC6.h - 20;
// the booking page on the screen in the tool's place (in its own units; the pictures measure PIX per unit)
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
const TOOLROW = { x: TOOL6.x + 14, y: TOOL6.y + 12 };
const MON = { x: TOOL6.x + 14, y: TOOL6.y + 50, w: PW + 18, h: PH + 18 };
const PG = { x: MON.x + 9, y: MON.y + 9 };
const FENCE66 = { x: TOOL6.x - 7, y: TOOL6.y - 7, w: TOOL6.w + 14, h: TOOL6.h + 14 };
const SVC = { x: TOOL6.x + 46, y: FENCE66.y + FENCE66.h + 24, w: 300, h: 54 };
const NET_X = SVC.x + 27;
const BAR_APPS = ['ブラウザ', 'メール', 'ファイル'];
const CARD66 = { x: 30, y: 46, w: 336, h: 300 };
const CARD26 = { x: 30, y: 612, w: 336, h: 210 };
const TH = 40 / PH;
const ASK66 = '10月20日14時で、会議室を予約して';
const DEFS66 = [
  [['screenshot', F.jp(700, 17)], ['：画面のスクリーンショットを返す', F.jp(500, 17)]],
  [['click', F.jp(700, 17)], ['：位置（x、y）をクリックする', F.jp(500, 17)]],
  [['type', F.jp(700, 17)], ['：文字（text）を打ち込む', F.jp(500, 17)]],
];
const ROW_CLICK = ['{"', 'name', '":', ' "', 'click', '",', ' "', 'input', '":'];
const ROW_TYPE = ['{"', 'name', '":', ' "', 'type', '",', ' "', 'input', '":'];
const at3 = (n) => String(Math.round(n * PIX));
const clickRow = (k) => [' {"', 'x', '":', ' ', at3(CENTER[k].x), ',', ' "', 'y', '":', ' ', at3(CENTER[k].y), '}}'];
const CALLS66 = [
  [['{"', 'name', '":', ' "', 's', 'creenshot', '",'], [' "', 'input', '":', ' {', '}}']],
  [ROW_CLICK, clickRow('date')],
  [ROW_TYPE, [' {"', 'text', '":', ' "', '10', '/', '20', '"}}']],
  [ROW_CLICK, clickRow('time')],
  [ROW_TYPE, [' {"', 'text', '":', ' "', '14', ':', '00', '"}}']],
  [ROW_CLICK, clickRow('button')],
];
const SHOTS = [
  {},
  { focus: 'date' },
  { focus: 'date', date: '10/20' },
  { focus: 'time', date: '10/20' },
  { focus: 'time', date: '10/20', time: '14:00' },
  { date: '10/20', time: '14:00', done: 1, locks: 1 },
];
const LIVE66 = { focus: null, date: '10/20', time: '14:00', done: 1, press: 0, locks: 1, caret: null };
const NOTE66 = '依頼、予約の画面、ツールの定義、操作の書き方は説明のための例（2024 年の API の形ではない）';

// ——— this clip ————————————————————————————————————————————————————————————————————————————————————
// before the naming the box is the app's (200 wide); g widens it for its new name
const TA = harnessLayout(G7, ACT6.w);
const NOTE = '依頼、ログ、出力、報告、文書の中身は説明のための例';
const CH7 = '7 章　ハーネス';
const CH7_FONT = F.jp(700, 15);
// the 7 章 tag: where 6-6 has it (right of it, the app's box), then at the left of the strip, out of the loop's way
const CH7_FROM = { x: ACT6.x - 22, y: ACT6.y + ACT6.h / 2 - 15 }; // its right end
const CH7_AT = { x: DOC7.x + 18, y: CH7_FROM.y }; // its left end, once moved
// a: the agent of chapter 6, round the LLM, the frame and the tool's place (the screen and the top left stay out)
const FRAME7 = [[70, 352], [372, 352], [372, 72], [986, 72], [986, 356], [1522, 356], [1522, 826], [70, 826]];
// the document's summary in c–e: its entries, the parts written in them (grey bars)
const BAR = { user: 210, call: 96, data: 180, answer: 150 };
const BAR_C = { user: '#c9d3f5', call: '#f3b9a2', data: '#b9dcc6', answer: C.rule };
// under the LLM: the name (i), what changes with the harness (j)
const NAMECARD = { x: UNDER7.x, y: UNDER7.y, w: UNDER7.w, h: 126 };
const VARYCARD = { x: UNDER7.x, y: NAMECARD.y + NAMECARD.h + 12, w: UNDER7.w, h: 118 };
// c, e: the conversation, as grey bubbles on the screen (who said what does not matter here)
const GHOST = { user: { w: 196, h: 42 }, reply: { w: 220, h: 42 } };

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));

export default clip({
  id: 'harness',
  title: 'LLM の周り',
  kicker: 'ハーネス',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 1.2, // 6-6's conversation, screen, fence and cards clear away, then the screen grows and the shell comes in
  script: [
    { id: 'a', text: '6 章では、{tools}LLM にツールをつないで、\n{agent}AI エージェントを組み立てたわね。' },
    { id: 'b', text: 'そのあいだ、{app}アプリには、{jobs}いろいろな仕事をさせてきたわ。' },
    { id: 'c', tail: 1.0, text: 'まず、{conv}会話と{defs}ツールの定義を、\n{read}LLM に読ませる{one}一本の文書にまとめること。' },
    { id: 'd', tail: 0.6, text: '{call}LLM がツール呼び出しを書いたら、{run}ツールを動かして、\n{add}結果を文書に書き足すこと。' },
    { id: 'e', lead: 2.2, text: '{done}LLM がユーザーへの返事を書くまで、{loop}それをくり返すこと。' },
    { id: 'f', still: true, text: 'そして、{out}確認が要ると決めた操作の前に、\n{ask}ユーザーに確認すること。' },
    { id: 'g', still: true, tail: 0.5, text: 'このように、{around}LLM の周りで、{j1}文書を組み立て、\n{j2}ツールを動かし、{j3}くり返しを回すプログラムを、\n\n{name}ハーネスと呼ぶわ。' },
    { id: 'h', by: 'zunda', text: '{q}アプリとは、別のものなのだ？' },
    { id: 'i', text: '{same}この図のアプリと、同じものよ。\n{rename}名前を、エージェントの話でよく使う呼び方に替えたの。' },
    { id: 'i2', text: '{co}Anthropic や OpenAI も、{c1b}LLM に読ませる文書を整え、\n{c2b}ツールを動かし、{c3b}くり返しを回す部分を、\n\n{call2}ハーネスと呼んでいるわ。' },
    { id: 'j', still: true, text: '{same2}同じ LLM でも、{build}ハーネスの作りしだいで、\n{can}できることも、{score}試験の点も変わるわ。\n\n{ch10}くわしくは、10 章で見ていきましょう。' },
    { id: 'k', lead: 0.8, text: 'ここで、{six}6 章でエージェントが{log}ログを調べた話に戻るわ。' },
    { id: 'l', still: true, text: '{oct7}10 月 7 日のエラーの多くは、\n{db}データベースの時間切れだったけれど、\n\n{why}その理由は、まだわかっていなかったわね。' },
    { id: 'm', tail: 0.6, text: 'そこで、ユーザーが{ask2}「時間切れの原因を突き止めて、\n直す変更を作って。\n\nわかったことは、GitHub の Issue に[書いておいて」と|かいておいてと]\n頼んだとしましょう。' },
    { id: 'n', by: 'zunda', text: '{s1}調べて、{s2}直して、{s3}書きこんで。{long}長い仕事になりそうなのだ。' },
    { id: 'o', lead: 0.9, text: '{go}この仕事を進めながら、{add2}ハーネスに足していく仕事を、\n{one2}一つずつ見ていくわ。' },
  ],

  prepare(ctx) {
    const opts = { ...T64.DOC, font: TFONT, lh: 28 };
    const one = (L0, e, yy) => docLayout(ctx, L0, [e], { ...opts, top: yy - L0.doc.y })[0];
    const old = prepare66(ctx, one);
    if (NAME_X + measure(ctx, F.jp(700, 32), NAME) + 18 > HARNESS_W) throw new Error('harness: the name does not fit the box');

    // ——— c–e: the document in summary — the head (the shell's definition), the conversation, two rounds, the answer
    const defs = defRows(ctx, DEFS);
    const head = { x: SYS.x - 6, y: SYS.y - 5, w: Math.max(...defs.map((d) => d.right)) + 8 - (SYS.x - 6), h: defY(1) + 8 - (SYS.y - 5) };
    let y = defY(1) + 28;
    const U0 = one(L7, { role: 'user', text: ' ' }, y);
    y = U0.y + U0.h + 12;
    const rounds = [0, 1].map(() => {
      const c = one(L7, { role: 'assistant', kind: 'call', text: ' ', lh: 22 }, y);
      y = c.y + c.h + 10;
      const r = one(L7, { role: 'result', kind: 'data', text: ' ', lh: 22 }, y);
      y = r.y + r.h + 12;
      return { c, r };
    });
    const A3 = one(L7, { role: 'assistant', text: ' ' }, y);
    // inside a call band: the LLM's call mark, a bar, its end mark
    const openW = markWidth(ctx, ROLE.call.name);
    const endW = markWidth(ctx, ROLE.callEnd.name);
    const inBand = (E) => {
      const open = { x: E.tx + 10, y: E.y + (E.h - MARK_H) / 2, w: openW };
      const bar = { x: open.x + openW + 10, y: E.y + E.h / 2, w: BAR.call };
      const end = { x: bar.x + bar.w + 10, y: open.y, w: endW };
      if (end.x + end.w > E.tx + E.w - 6) throw new Error('harness: the call band is too narrow');
      return { open, bar, end };
    };
    rounds.forEach((rd) => { rd.parts = inBand(rd.c); });
    const aEnd = { x: A3.tx + BAR.answer + 12, y: A3.y + 1, w: markWidth(ctx, ROLE.end.name) };
    const written = { x: DOC7.x + 8, y: SYS.y - 8, w: DOC7.w - 16, h: A3.y + A3.h + 8 - (SYS.y - 8) };
    const written1 = { ...written, h: U0.y + U0.h + 8 - (SYS.y - 8) }; // c: as far as it is written then

    // ——— m: the request, in the document; n: the three things it asks
    const U = one(L7, { role: 'user', text: ASK7_DOC }, defY(1) + 28);
    if (U.rows.length !== 3) throw new Error(`harness: the request takes ${U.rows.length} rows`);
    if (U.y + U.h > DOC7.y + DOC7_SHORT.h - 12) throw new Error('harness: the request does not fit the short document');
    const inText = (E, row, part, before) => {
      const at = rowAt(E, row);
      return { x: at.x + measure(ctx, E.font, before), y: at.y - 20, w: measure(ctx, E.font, part), h: 26 };
    };
    const asks = [inText(U, 0, '突き止めて', '時間切れの原因を'), inText(U, 1, '直す変更を作って', ''), inText(U, 2, '書いておいて', 'GitHub の Issue に')];

    // ——— the screen: 6-4's report, then the request; where the parts of the report are
    const [Br, Bu] = screenBubbles(ctx, T7.SCREEN, [['assistant', REPORT64], ['user', ASK7_SCREEN]], { font: F.jp(500, 15), gap: 12 });
    if (Br.L.lines.length !== 3 || Bu.L.lines.length !== 2) throw new Error('harness: the screen\'s bubbles break otherwise');
    if (Bu.y + Bu.L.h > T7.SCREEN.y + T7.SCREEN.h - 8) throw new Error(`harness: the screen overflows (${Bu.y + Bu.L.h})`);
    const inBubble = (b, i, part, before) => {
      const L = b.L;
      const cy = b.y + L.pad + L.size * 0.62 + i * L.lh;
      return { x: b.x + L.pad + measure(ctx, L.font, before), y: cy - L.size * 0.62, w: measure(ctx, L.font, part), h: L.size * 1.25 };
    };
    const rep = { oct7: inBubble(Br, 0, '10月7日', ''), db: inBubble(Br, 1, 'データベースの時間切れ', ''), why: inBubble(Br, 2, Br.L.lines[2], '') };

    // the TOC's cards must fit the frame
    const last = tocBox(TOC.length - 1);
    if (last.y + last.h > DOC7.y + DOC7.h) throw new Error('harness: the contents do not fit the frame');
    return { old, defs, head, U0, rounds, A3, aEnd, written, written1, U, asks, Br, Bu, rep };
  },

  draw(ctx, t, s, { at, pace }) {
    const { old, defs, head, U0, rounds, A3, aEnd, written, written1, U, asks, Br, Bu, rep } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 6-6's picture clears away, the screen grows and the tool's place takes the shell
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br * 0.5));
    const gp = inOutCubic(seg(t, br * 0.45, br * 0.95));
    const fresh = inOutCubic(seg(t, br * 0.6, br));
    const tagMove = inOutCubic(seg(t, br * 0.15, br * 0.75));

    // ——— g: the naming. The box widens for its new name, アプリ gives way to ハーネス, the 7 章 tag flies in
    const nameAt = at('name') - lead - 0.25;
    const flyP = seg(t, nameAt, nameAt + 0.6); // the tag's flight to the box
    const merge = seg(t, nameAt + 0.55, nameAt + 0.85); // it fades into the name
    const widen = inOutCubic(seg(t, nameAt + 0.15, nameAt + 0.6));
    const oldName = 1 - seg(t, nameAt + 0.15, nameAt + 0.45);
    const newName = seg(t, nameAt + 0.6, nameAt + 0.9);
    const Tb = harnessLayout(mix7(G66, G7, gp), lerp(ACT6.w, HARNESS_W, widen));
    const Lb = Tb.L;
    const BOX = Tb.ACT;
    const screen = { ...Tb.SCREEN, h: lerp(CHAT.h, SCREEN_H, gp) };
    // o: the document gets shorter, and the chapter's contents come in under it
    const shrink = inOutCubic(seg(t, at('o'), at('o') + 0.8));
    const Ld = { ...Lb, doc: { ...Lb.doc, h: lerp(DOC7.h, DOC7_SHORT.h, shrink) } };

    // ——— when things happen
    // c: the conversation and the definitions go into one document; the LLM reads it
    const convAt = at('conv') - lead;
    const defsAt = at('defs') - lead;
    const defP = (k) => seg(t, defsAt + 0.45 + k * 0.3, defsAt + 0.9 + k * 0.3);
    const read1 = at('c.end') - 0.05; // the read itself, in c's tail
    // d: the LLM writes a call, the tool runs, the result is written in; e: once more, quickly, then the answer
    const r1 = { mark: at('d'), fly: 0.45, tok: 0.35, step: 0.18, go: 0.6, work: 0.55, back: 0.55 };
    r1.write = Math.max(at('call') - lead, r1.mark + r1.fly);
    r1.run = Math.max(at('run') - lead, r1.write + 1.5);
    r1.add = Math.max(at('add') - lead, r1.run + r1.go + r1.work);
    const r2 = { mark: at('e') + 0.05, fly: 0.25, tok: 0.2, step: 0.08, go: 0.3, work: 0.25, back: 0.3 };
    r2.read = r2.mark + r2.fly;
    r2.write = r2.read + 0.35;
    r2.run = r2.write + 0.8;
    r2.add = r2.run + r2.go + r2.work;
    const calls = [r1, r2].map((r, k) => {
      const w = r.write;
      return {
        ...r,
        ...rounds[k],
        open: [w, w + r.tok + 0.1],
        toks: [0, 1, 2].map((j) => w + r.tok + j * r.step),
        end: [w + r.tok + 3 * r.step + 0.05, w + 2 * r.tok + 3 * r.step + 0.15],
        resMark: r.add + r.back * 0.5,
        resIn: r.add + r.back + 0.1,
      };
    });
    // e: the reply — once the second round's result is in, while the voice says it
    const a3 = { mark: calls[1].resIn + 0.05 };
    a3.read = a3.mark + 0.35;
    a3.write = Math.max(a3.read + 0.45, at('done') + 0.2);
    a3.toks = [0, 1, 2].map((j) => a3.write + j * 0.14);
    a3.end = a3.write + 3 * 0.14 + 0.1;
    // k: the summary leaves; 6-4's shell comes back
    const sessOut = tw(t, at('k'), 0.6, inOutCubic);
    const keep = 1 - sessOut;
    const userP = seg(t, convAt + 0.2, convAt + 0.65); // the user's mark, out of the box
    const replyAt = a3.end + 0.35; // the reply has its end mark: it goes to the screen
    const termAt = at('six') - lead;
    const termStep = Math.max(0.12, (at('log') + 0.8 - termAt) / 12);
    // m: the request
    const askIn = at('ask2') - lead;
    const userAt = askIn + 0.45;
    const userIn = userAt + 0.55;

    // ——— who is at work
    const actGlow = Math.max(
      span(t, convAt - 0.1, convAt + 0.65), span(t, defsAt - 0.05, defsAt + 1.3), span(t, replyAt - 0.1, replyAt + 0.4),
      span(t, read1, read1 + 0.95),
      ...calls.map((r) => span(t, r.mark, r.mark + r.fly)),
      ...calls.map((r) => span(t, r.run - 0.1, r.resIn)),
      span(t, r2.read, r2.read + 0.4),
      span(t, a3.mark, a3.read + 0.4),
      span(t, userAt - 0.1, userIn),
    );
    const writing = calls.some((r) => t >= r.write && t < r.end[1]) || (t >= a3.write && t < a3.end + 0.4);
    const llmGlow = Math.max(span(t, read1 + 0.5, read1 + 1.1), span(t, r2.read + 0.25, r2.write), span(t, a3.read + 0.25, a3.write), writing ? 1 : 0);
    const reading = t >= read1 && t < read1 + 1.0 ? 1 : (t >= r2.read && t < r2.read + 0.45) || (t >= a3.read && t < a3.read + 0.45) ? 1 : 0;

    // ——— the rings: what the voice points at
    const [toolsLit] = lit(['tools'], at('agent'));
    const [appLit] = lit(['app'], at('jobs'));
    const [readLit, oneLit] = lit(['read', 'one'], at('c.end'));
    const [loopLit] = lit(['loop'], at('e.end'));
    const [outLit] = lit(['out'], at('ask'));
    const [aroundLit, j1Lit, j2Lit, j3Lit] = lit(['around', 'j1', 'j2', 'j3'], at('name'));
    const [qLit] = lit(['q'], at('h.end'));
    const [renameLit] = lit(['rename'], at('i.end'));
    const [c1bLit, c2bLit, c3bLit] = lit(['c1b', 'c2b', 'c3b'], at('call2'));
    const [same2Lit, buildLit] = lit(['same2', 'build'], at('can'));
    const [logLit] = lit(['log'], at('k.end'));
    const [oct7Lit, dbLit, whyLit] = lit(['oct7', 'db', 'why'], at('l.end'));
    const [s1Lit, s2Lit, s3Lit, longLit] = lit(['s1', 's2', 's3', 'long'], at('n.end'));

    // ——— the chat screen: 6-6's request and question leave; 6-4's report, then the request, come in
    chatScreen(ctx, screen, 1);
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      chatBubble(ctx, old.Bq, { alpha: 1 });
      dialog66(ctx, old.dlg);
      ctx.restore();
    }
    // c, e: the conversation, as grey bubbles; they leave in k
    const S7 = T7.SCREEN;
    const gu = { x: S7.x + S7.w - 20 - GHOST.user.w, y: S7.y + 62 };
    ghostBubble(ctx, gu.x, gu.y, GHOST.user, 'user', seg(t, convAt - 0.1, convAt + 0.3), tw(t, convAt - 0.15, 0.3) * keep);
    ghostBubble(ctx, S7.x + 20, gu.y + GHOST.user.h + 12, GHOST.reply, 'assistant', seg(t, replyAt, replyAt + 0.4), tw(t, replyAt - 0.05, 0.3) * keep);
    chatBubble(ctx, Br, { alpha: tw(t, at('l') - 0.1, 0.4) });
    [[rep.oct7, oct7Lit], [rep.db, dbLit]].forEach(([b, a]) => marker(ctx, b, a));
    ringBox(ctx, rep.why, whyLit, C.accent, 3);
    chatBubble(ctx, Bu, { alpha: tw(t, askIn, 0.35) });
    screenLinks(ctx, Tb, {
      talk: 1,
      back: 1,
      talkHot: Math.max(span(t, convAt - 0.1, convAt + 0.4), span(t, askIn + 0.05, askIn + 0.8)) > 0.5,
      backHot: span(t, replyAt - 0.1, replyAt + 0.5) > 0.5,
    });

    // ——— the LLM, and the frame with its document
    appFrame(ctx, Ld, 1, { name: '' });
    llmBlock(ctx, L7, 1, { glow: llmGlow });
    ring(ctx, L7.llm.x, L7.llm.y, L7.llm.w, L7.llm.h, Math.max(aroundLit, same2Lit, readLit), C.accent, 22);
    channel(ctx, L7.read, 1, { hot: reading > 0.5 });
    channel(ctx, L7.write, 1, { hot: writing && llmGlow > 0.5 });
    const runHot = calls.some((r) => span(t, r.run, r.run + r.go) > 0.5);
    const backHot = calls.some((r) => span(t, r.add, r.add + r.back) > 0.5);
    const toolLit = Math.max(j2Lit, c2bLit) > 0.5;
    channel(ctx, Lb.call, 1, { labelAlpha: 1, hot: runHot || toolLit });
    channel(ctx, Lb.back, 1, { labelAlpha: 1, hot: backHot || toolLit });
    ringBox(ctx, Lb.app, buildLit, C.accent, 4);

    // ——— the document: 6-6's (scrolled as it ends) clears away; this clip's comes in
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      drawDoc66(ctx, old);
      ctx.restore();
      paperTop(ctx, DOC6, old.sy, gone);
    }
    // the head: the system mark (out of the box) and the shell's definition, from c on
    const sysP = seg(t, defsAt, defsAt + 0.5);
    if (sysP >= 1) roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
    defs.forEach((d, k) => drawDef(ctx, d, defY(k), defP(k)));
    // c–e: the summary of a session (grey bars), until k
    if (keep > 0.001) {
      ctx.save();
      ctx.globalAlpha *= keep;
      if (userP >= 1) roleMark(ctx, U0.x, U0.y + 1, ROLE.user, { edge: WRITER.user });
      textBar(ctx, U0.tx, U0.y + 15, BAR.user * seg(t, convAt + 0.6, convAt + 0.95), 1, BAR_C.user);
      calls.forEach((r) => {
        const { c, r: R, parts } = r;
        if (t >= r.mark + r.fly) roleMark(ctx, c.x, c.y + 1, ROLE.assistant, { edge: WRITER.assistant });
        const bandA = tw(t, r.open[1] - 0.1, 0.25);
        if (bandA > 0.001) {
          ctx.save();
          ctx.globalAlpha *= bandA;
          docEntry(ctx, c, 1, { tagAlpha: 0, chars: 0 });
          ctx.restore();
        }
        if (t >= r.open[1]) roleMark(ctx, parts.open.x, parts.open.y, ROLE.call, { edge: WRITER.call });
        const landed = r.toks.reduce((n, at0) => (t >= at0 + r.tok ? n + 1 : n), 0);
        textBar(ctx, parts.bar.x, parts.bar.y, (parts.bar.w * landed) / 3, 1, BAR_C.call);
        if (t >= r.end[1]) roleMark(ctx, parts.end.x, parts.end.y, ROLE.callEnd, { edge: WRITER.callEnd });
        if (t >= r.resMark + 0.45) roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
        const ri = tw(t, r.resIn - 0.05, 0.3);
        if (ri > 0.001) {
          docEntry(ctx, R, ri, { tagAlpha: 0, chars: 0 });
          textBar(ctx, R.tx + 16, R.y + R.h / 2, BAR.data * seg(t, r.resIn, r.resIn + 0.35), ri, BAR_C.data);
        }
      });
      if (t >= a3.mark + 0.35) roleMark(ctx, A3.x, A3.y + 1, ROLE.assistant, { edge: WRITER.assistant });
      const aLanded = a3.toks.reduce((n, at0) => (t >= at0 + 0.3 ? n + 1 : n), 0);
      textBar(ctx, A3.tx, A3.y + 15, (BAR.answer * aLanded) / 3, 1, BAR_C.answer);
      if (t >= a3.end + 0.35) roleMark(ctx, aEnd.x, aEnd.y, ROLE.end, { edge: WRITER.end });
      ctx.restore();
    }
    ringBox(ctx, written1, oneLit, C.accent, 0);
    ringBox(ctx, written, Math.max(j1Lit, c1bLit), C.accent, 0);
    ringBox(ctx, [...calls.flatMap((r) => [r.c, r.r])].map((E) => ({ x: E.tx, y: E.y, w: E.w, h: E.h })), loopLit, C.accent, 4);
    // m: the request, out of the harness's box; n: the three things it asks
    if (t >= userIn) {
      docEntry(ctx, U, 1, { tagAlpha: 0, chars: tw(t, userIn - 0.05, 0.6) });
      roleMark(ctx, U.x, U.y + 1, ROLE.user, { edge: WRITER.user });
    }
    asks.forEach((b, k) => marker(ctx, b, [s1Lit, s2Lit, s3Lit][k]));
    ringBox(ctx, { x: U.tx, y: U.y - 2, w: U.w, h: U.h + 4 }, longLit, C.accent, 4);
    // the reads: the harness hands the document over
    sweep(ctx, L7, seg(t, read1 + 0.05, read1 + 0.95), U0.y + U0.h);
    send(ctx, L7.read, seg(t, read1 + 0.4, read1 + 1.0), '', 'doc');
    sweep(ctx, L7, seg(t, r2.read, r2.read + 0.4), rounds[0].r.y + rounds[0].r.h);
    send(ctx, L7.read, seg(t, r2.read + 0.1, r2.read + 0.45), '', 'doc');
    sweep(ctx, L7, seg(t, a3.read, a3.read + 0.4), rounds[1].r.y + rounds[1].r.h);
    send(ctx, L7.read, seg(t, a3.read + 0.1, a3.read + 0.45), '', 'doc');

    // ——— the box: the app's, then the harness's; the 7 章 tag moves out of the way, and flies into it at the name
    harnessBox(ctx, BOX, 1, {
      glow: actGlow,
      names: newName > 0.001 || oldName < 0.999 ? [['アプリ', oldName, (1 - oldName) * 26], [NAME, newName, (1 - newName) * -18]] : [['アプリ', 1, 0]],
    });
    ringBox(ctx, BOX, Math.max(appLit, qLit, renameLit), C.accent, 4);
    // h: and the app?
    const qA = pop('q') * (1 - tw(t, at('i'), 0.4));
    if (qA > 0.001) tag(ctx, BOX.x + BOX.w + 4, BOX.y - 16, '？', { font: F.jp(700, 16), h: 28, padX: 9, fill: C.accent, color: '#fff', r: 14, align: 'right', alpha: qA });
    // e: the loop, left of the box; f: the user is asked on the way to the tool
    const loopA = pop('loop');
    if (loopA > 0.001) {
      const LP = Tb.LOOP;
      loopIcon(ctx, LP.x, LP.y, LP.r, loopA, { p: loopA });
      text(ctx, 'くり返す', LP.x - LP.r - 14, LP.y + 6, { font: F.jp(700, 16), color: C.purple, align: 'right', alpha: loopA });
      ring(ctx, LP.x - LP.r - 92, LP.y - 30, LP.r + 92 + LP.r, 60, Math.max(j3Lit, c3bLit) * loopA, C.accent);
    }
    if (gone > 0.001) gate(ctx, (L6.call.x1 + L6.call.x2) / 2, L6.call.y, gone);
    const gateA = pop('ask', 0.35);
    const gx = (L7.call.x1 + L7.call.x2) / 2;
    gate(ctx, gx, L7.call.y, gateA);

    // ——— the tool's place: 6-6's screen and fence clear; the shell comes in (and, in k, shows 6-4's commands)
    toolPlace(ctx, Lb, 1, {
      draw: (c) => {
        const tm = shell(c, t, fresh, term64Lines((k) => termAt + k * termStep), { box: { ...TERM7, x: Lb.tool.x + 14, y: Lb.tool.y + 14 }, trim: true });
        // l: the timeouts, in vermilion (the lines are too close to ring)
        if (tm && dbLit > 0.001) [7, 8].forEach((k) => { const b = tm.box(k, 'db: timeout', 'ERROR '); text(c, 'db: timeout', b.x, b.y + 14, { font: TL.font, color: C.accent, alpha: dbLit * tm.shown(k) }); });
      },
    });
    working(ctx, L7, calls.reduce((p, r) => (t >= r.run + r.go && t < r.run + r.go + r.work ? seg(t, r.run + r.go, r.run + r.go + r.work) : p), 0));
    ringBox(ctx, TOOL7, Math.max(toolsLit, outLit), C.accent, 4);
    ringBox(ctx, TERM7, logLit, C.accent, 4);
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      tools66(ctx, old.chips);
      display66(ctx);
      fence66(ctx);
      service66(ctx);
      ctx.restore();
    }

    // ——— 6-6's notes and cards clear away
    if (gone > 0.001) {
      ctx.save();
      ctx.globalAlpha *= gone;
      tag(ctx, T6.NOTE.x, T6.NOTE.y[0], '画面の操作に対応したモデル', { font: F.jp(700, 15), h: 30, padX: 10, fill: '#fff', stroke: C.ink2, color: C.ink, align: 'center' });
      card2024(ctx);
      card2026(ctx);
      ctx.restore();
    }

    // ——— a: the agent of chapter 6
    agentFrame(ctx, inOutCubic(seg(t, at('agent') - lead, at('agent') - lead + 0.9)), tw(t, at('agent') - lead + 0.6, pace.enter, (p) => outBack(p, 1.4)), 1 - tw(t, at('b'), 0.5));

    // ——— top left: what the app has been made to do (b–f), renamed at g
    const cardsA = ['conv', 'call', 'done', 'out'].map((n) => pop(n));
    const litK = (a) => span(t, at(a) - 0.1, at(`${a}.end`) - 0.3);
    jobCards(ctx, {
      head: [['アプリにさせてきた仕事', pop('jobs') * oldName], ['ハーネスにさせてきた仕事', newName]],
      cards: cardsA,
      lit: [litK('c'), litK('d'), litK('e'), litK('f')],
    });
    [j1Lit, j2Lit, j3Lit].forEach((a, k) => ringBox(ctx, jobBox(k), a, C.accent, 3));
    // the 7 章 tag: moved left in the bridge, into the box at the name
    ch7Tag(ctx, tagMove, flyP, merge, BOX, measure(ctx, F.jp(700, 32), NAME));

    // ——— under the LLM: the name (i), what changes with it (j)
    nameCard(ctx, { a: pop('same'), co: pop('co') });
    varyCard(ctx, { a: pop('build'), can: pop('can'), score: pop('score'), ch10: tw(t, at('ch10') - lead, pace.enter, (p) => outBack(p, 1.4)) });

    // ——— o: the chapter's contents, in the harness's frame under its document
    tocCards(ctx, {
      head: tw(t, at('go') - lead, pace.enter),
      cards: TOC.map((_, k) => tw(t, at('add2') - lead + k * Math.max(pace.stagger, (at('one2') + 0.4 - at('add2')) / (TOC.length - 1)), pace.enter)),
    });

    // ——— in flight, over everything
    flyMark(ctx, TA, { x: SYS.x, y: SYS.y }, sysP, ROLE.system, { edge: WRITER.system });
    flyMark(ctx, TA, U0, userP, ROLE.user, { edge: WRITER.user, alpha: keep });
    calls.forEach((r) => {
      const { c, r: R, parts } = r;
      flyMark(ctx, TA, c, seg(t, r.mark, r.mark + r.fly), ROLE.assistant, { edge: WRITER.assistant });
      const po = seg(t, r.open[0], r.open[1]);
      if (po > 0 && po < 1) {
        const pt = onPath(writePath(TA, c, parts.open.x + parts.open.w / 2, parts.open.y + MARK_H / 2), inOutCubic(po));
        roleMark(ctx, pt.x - parts.open.w / 2, pt.y - MARK_H / 2, ROLE.call, { edge: WRITER.call, alpha: clamp(po * 8) });
      }
      r.toks.forEach((at0, j) => {
        const p = seg(t, at0, at0 + r.tok);
        if (p <= 0 || p >= 1) return;
        const x = parts.bar.x + ((j + 0.5) * parts.bar.w) / 3;
        const pt = onPath(writePath(TA, c, x, parts.bar.y), inOutCubic(p));
        token(ctx, pt.x - 13, pt.y - TOKEN.h / 2, 26, '', clamp(p * 8) * clamp((1 - p) * 8));
      });
      const pe = seg(t, r.end[0], r.end[1]);
      if (pe > 0 && pe < 1) {
        const pt = onPath(writePath(TA, c, parts.end.x + parts.end.w / 2, parts.end.y + MARK_H / 2), inOutCubic(pe));
        roleMark(ctx, pt.x - parts.end.w / 2, pt.y - MARK_H / 2, ROLE.callEnd, { edge: WRITER.callEnd, alpha: clamp(pe * 8) });
      }
      // (out of the document's right margin: the band's end has the LLM's end mark)
      chipGo(ctx, seg(t, r.run, r.run + r.go), toTool(TA, { tx: c.tx, w: TA.lane + 40 - c.tx, y: c.y, h: c.h }), 'コマンド', 'call');
      chipGo(ctx, seg(t, r.add, r.add + r.back), fromTool(TA, R, 0, R.tx + 110), '出力', 'found');
      flyMark(ctx, TA, R, seg(t, r.resMark, r.resMark + 0.45), ROLE.result, { edge: WRITER.result });
    });
    flyMark(ctx, TA, A3, seg(t, a3.mark, a3.mark + 0.35), ROLE.assistant, { edge: WRITER.assistant });
    a3.toks.forEach((at0, j) => {
      const p = seg(t, at0, at0 + 0.3);
      if (p <= 0 || p >= 1) return;
      const x = A3.tx + ((j + 0.5) * BAR.answer) / 3;
      const pt = onPath(writePath(TA, A3, x, A3.y + 15), inOutCubic(p));
      token(ctx, pt.x - 13, pt.y - TOKEN.h / 2, 26, '', clamp(p * 8) * clamp((1 - p) * 8));
    });
    const pa = seg(t, a3.end, a3.end + 0.35);
    if (pa > 0 && pa < 1) {
      const pt = onPath(writePath(TA, A3, aEnd.x + aEnd.w / 2, aEnd.y + MARK_H / 2), inOutCubic(pa));
      roleMark(ctx, pt.x - aEnd.w / 2, pt.y - MARK_H / 2, ROLE.end, { edge: WRITER.end, alpha: clamp(pa * 8) });
    }
    flyMark(ctx, T7, U, seg(t, userAt, userIn), ROLE.user, { edge: WRITER.user });

    // ——— the example's note (6-6's gives way)
    exampleNote(ctx, L7, '', 0, 1);
    const exX = L7.app.x + measure(ctx, F.jp(700, 17), '例') + 20 + 10;
    const exY = L7.app.y + L7.app.h + 22 + 21;
    text(ctx, NOTE66, exX, exY, { font: F.jp(400, 17), color: C.muted, alpha: gone });
    text(ctx, NOTE, exX, exY, { font: F.jp(400, 17), color: C.muted, alpha: fresh });
  },
});

// ——— this clip's pieces ———————————————————————————————————————————————————————————————————————————

// a: the agent of chapter 6, as 6-4 drew it (the outline drawn round, its name on the top edge)
function agentFrame(ctx, p, nameA, a) {
  if (p <= 0.001 || a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  framePath(ctx, FRAME7, 22);
  const len = perimeter(FRAME7);
  ctx.setLineDash([len * p, len + 10]);
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  tag(ctx, FRAME7[2][0] + 28, FRAME7[2][1] - 20, 'AI エージェント', { font: F.jp(700, 20), h: 40, padX: 16, fill: C.ink, color: C.paper, alpha: nameA * a });
}

// The 7 章 tag: 6-6's (its right end by the app's box), moved left (move 0 → 1), then flown into the box as it
// takes the name (fly 0 → 1): it lifts over the loop, lands on the name (nameW wide) and fades into it (merge).
function ch7Tag(ctx, move, fly, merge, B, nameW) {
  if (merge >= 1) return;
  const w = measure(ctx, CH7_FONT, CH7) + 22;
  const x0 = lerp(CH7_FROM.x - w, CH7_AT.x, move);
  if (fly <= 0) {
    tag(ctx, x0, CH7_FROM.y, CH7, { font: CH7_FONT, h: 30, padX: 11, fill: C.ink, color: C.paper });
    return;
  }
  const q = inOutCubic(fly);
  const cx = lerp(x0 + w / 2, B.x + NAME_X + nameW / 2, q);
  const cy = lerp(CH7_FROM.y + 15, B.y + B.h / 2, q) - Math.sin(Math.PI * q) * 34;
  const sc = 1 + 0.3 * merge;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sc, sc);
  tag(ctx, -w / 2, -15, CH7, { font: CH7_FONT, h: 30, padX: 11, fill: C.ink, color: C.paper, alpha: 1 - merge });
  ctx.restore();
}

function cardBox(ctx, b, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// i, i2: the name — what it is in this picture, who calls it so, and what the picture is not
function nameCard(ctx, o) {
  const a = o.a;
  if (a <= 0.001) return;
  const b = NAMECARD;
  cardBox(ctx, b, a);
  const x = b.x + 16;
  text(ctx, NAME, x, b.y + 30, { font: F.jp(700, 18), color: C.purple, alpha: a });
  text(ctx, '＝ この図で「アプリ」と呼んできた部分', x, b.y + 54, { font: F.jp(500, 14), color: C.ink, alpha: a });
  text(ctx, 'Anthropic や OpenAI の記事での呼び名', x, b.y + 77, { font: F.jp(500, 14), color: C.ink, alpha: a * o.co });
  text(ctx, '出典：Anthropic（2025-11-26）、OpenAI（2026-01-23）', x, b.y + 98, { font: F.jp(400, 11), color: C.muted, alpha: a * o.co });
  text(ctx, '役割をまとめた図。製品やプロセスの境目とは一致しない', x, b.y + 115, { font: F.jp(400, 11), color: C.muted, alpha: a });
}

// j: with the same LLM, what changes with the harness (chapter 10)
function varyCard(ctx, o) {
  const a = o.a;
  if (a <= 0.001) return;
  const b = VARYCARD;
  cardBox(ctx, b, a);
  const x = b.x + 16;
  text(ctx, '同じ LLM でも、ハーネスの作りで変わる', x, b.y + 30, { font: F.jp(700, 15), color: C.ink2, alpha: a });
  const chip = { font: F.jp(700, 16), h: 32, padX: 13, fill: C.purpleSoft, color: C.ink, r: 8 };
  const w1 = tag(ctx, x, b.y + 42, 'できること', { ...chip, alpha: a * o.can });
  tag(ctx, x + w1 + 10, b.y + 42, '試験の点', { ...chip, alpha: a * o.score });
  tag(ctx, b.x + b.w - 14, b.y + b.h - 40, '10 章　鍛えて測る', { font: F.jp(700, 15), h: 30, padX: 11, fill: C.ink, color: C.paper, align: 'right', alpha: a * o.ch10 });
}

// A bubble on the screen with a grey bar for its words (c, e).
function ghostBubble(ctx, x, y, g, role, p, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, x, y, g.w, g.h, 18);
  ctx.fillStyle = role === 'user' ? C.blueSoft : C.panel;
  ctx.fill();
  ctx.restore();
  textBar(ctx, x + 16, y + g.h / 2, (g.w - 48) * p, a, role === 'user' ? BAR_C.user : C.rule);
}

// ——— 6-6's picture as it ends (gui.js, at its duration) ————————————————————————————————————————————

function prepare66(ctx, one) {
  const defs = DEFS66.map((row) => {
    let x = DX;
    const segs = row.map(([str, font]) => {
      const w = measure(ctx, font, str);
      const out = { s: str, font, x, w, n: Array.from(str).length };
      x += w;
      return out;
    });
    return { segs, right: x, n: segs.reduce((n, sg) => n + sg.n, 0) };
  });
  let y = defY(DEFS66.length - 1) + 28;
  const U = one(L6, { role: 'user', text: ASK66 }, y);
  y = U.y + U.h + 12;
  const calls = CALLS66.map((rows) => {
    const c = callLayout(ctx, { x: DX, y, w: U.w, h: rows.length * MLH + 16 }, rows, MLH, { hang: true });
    y = c.band.y + c.band.h + 10;
    const R = one(L6, { role: 'result', kind: 'data', text: ' ', lh: 38 }, y);
    y = R.y + R.h + 12;
    return { c, R };
  });
  // the scroll 6-6 ends with: as far as its lowest entry passes the foot
  const sy = Math.max(0, ...calls.flatMap(({ c, R }) => [c.band.y + c.band.h - VIS6, R.y + R.h - VIS6]));
  const [Bq] = screenBubbles(ctx, CHAT, [['user', ASK66]], { font: F.jp(500, 15), gap: 12 });
  const dlg = { x: CHAT.x + 20, y: Bq.y + Bq.L.h + 10, w: 340, h: 64 };
  const cw = (n) => measure(ctx, CHIP.font, n) + CHIP.padX * 2;
  let cx = TOOLROW.x;
  const chips = ['screenshot', 'click', 'type'].map((n) => {
    const b = { n, x: cx, y: TOOLROW.y, w: cw(n), h: CHIP.h };
    cx += b.w + 8;
    return b;
  });
  return { defs, U, calls, sy, Bq, dlg, chips };
}

function drawDoc66(ctx, o) {
  ctx.save();
  if (o.sy > 0) {
    ctx.beginPath();
    ctx.rect(DOC6.x, DOC6.y + 2, DOC6.w, DOC6.h - 4);
    ctx.clip();
    ctx.translate(0, -o.sy);
  }
  roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system, alpha: 1 });
  o.defs.forEach((d, k) => drawDef(ctx, d, defY(k), 1));
  docEntry(ctx, o.U, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, o.U.x, o.U.y + 1, ROLE.user, { edge: WRITER.user });
  o.calls.forEach(({ c, R }, k) => {
    roleMark(ctx, DOC6.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
    drawCall(ctx, c, { bandA: 1, open: true, n: c.toks.length, end: true });
    roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
    docEntry(ctx, R, 1, { tagAlpha: 0 });
    thumb(ctx, R.tx + 12, R.y + 8, SHOTS[k], 1);
    text(ctx, '画面の画像', R.tx + 12 + PW * TH + 14, R.y + R.h / 2 + 6, { font: F.jp(500, 15), color: C.ink2, alpha: 1 });
  });
  ctx.restore();
}

// the tools' chips over the screen
function tools66(ctx, chips) {
  chips.forEach((b) => progChip(ctx, b.x, b.y, b.w, 1, b.n, { a: 1, lit: 0 }));
  const last = chips[2];
  text(ctx, '撮る・操作するプログラム', last.x + last.w + 12, last.y + 18, { font: F.jp(500, 13), color: C.muted, alpha: 1 });
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

// The booking page at scale sc with its top-left at (x, y) (gui.js's page()).
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

// The display in the tool's place as 6-6 ends: the page booked, the pointer on 予約する.
function display66(ctx) {
  ctx.save();
  rr(ctx, MON.x, MON.y, MON.w, MON.h, 12);
  ctx.fillStyle = '#2a2d33';
  ctx.fill();
  ctx.restore();
  page(ctx, PG.x, PG.y, 1, LIVE66, 1);
  const cx = PG.x + CENTER.button.x;
  const cy = PG.y + CENTER.button.y;
  ctx.save();
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

// The app's question on the chat screen, confirmed.
function dialog66(ctx, b) {
  ctx.save();
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, '予約を確定してよいですか？', b.x + 14, b.y + 25, { font: F.jp(700, 15), color: C.ink, alpha: 1 });
  text(ctx, '10/20 14:00　第 1 会議室', b.x + 14, b.y + 51, { font: F.jp(500, 12), color: C.ink2, alpha: 1 });
  const bf = { font: F.jp(700, 12), h: 24, padX: 9, r: 6 };
  const right = b.x + b.w - 12;
  const w2 = tag(ctx, right, b.y + 34, 'やめる', { ...bf, fill: '#fff', stroke: C.rule, color: C.ink2, align: 'right', alpha: 1 });
  tag(ctx, right - w2 - 8, b.y + 34, '✓ 確定した', { ...bf, fill: C.green, color: '#fff', align: 'right', alpha: 1 });
}

// The place apart, round 6-6's tool's place (broken where the place has its name).
function fence66(ctx) {
  const b = FENCE66;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1600, 900);
  ctx.rect(TOOL6.x - 12, TOOL6.y - 40, measure(ctx, F.jp(700, 22), 'ツールの場所') + 20, 30);
  ctx.clip('evenodd');
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 7]);
  rr(ctx, b.x, b.y, b.w, b.h, 26);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  tag(ctx, b.x + b.w - 16, b.y - 13, '切り離した環境（仮想マシンなど）', { font: F.jp(700, 14), h: 26, padX: 10, fill: C.paper, stroke: C.ink2, color: C.ink2, r: 13, align: 'right', alpha: 1 });
}

// The outside service, the booking received.
function service66(ctx) {
  const b = SVC;
  const y0 = MON.y + MON.h;
  ctx.save();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2.5;
  line(ctx, NET_X, y0, NET_X, b.y);
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  [0, 1].forEach((k) => {
    rr(ctx, b.x + 14, b.y + 12 + k * 16, 26, 12, 3);
    ctx.stroke();
    ctx.fillStyle = C.ink2;
    ctx.fillRect(b.x + 19, b.y + 17 + k * 16, 4, 2);
  });
  ctx.restore();
  text(ctx, '会議室の予約サービス', b.x + 52, b.y + 24, { font: F.jp(700, 15), color: C.ink, alpha: 1 });
  text(ctx, '10/20 14:00 の予約を受け付けた', b.x + 52, b.y + 44, { font: F.jp(700, 12), color: C.green, alpha: 1 });
  check(ctx, b.x + b.w - 20, b.y + 18, 9, 1);
}

function cardBox66(ctx, b) {
  ctx.save();
  rr(ctx, b.x, b.y, b.w, b.h, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// October 2024 — the public beta, and OSWorld as it was then.
function card2024(ctx) {
  const b = CARD66;
  cardBox66(ctx, b);
  const x = b.x + 16;
  const w0 = text(ctx, '2024', x, b.y + 40, { font: F.cond(700, 34), color: C.ink, alpha: 1 });
  text(ctx, '10 月 22 日', x + w0 + 10, b.y + 37, { font: F.jp(700, 16), color: C.ink, alpha: 1 });
  text(ctx, 'Anthropic が、画面の操作のツールを', x, b.y + 66, { font: F.jp(500, 14), color: C.ink, alpha: 1 });
  text(ctx, '公開ベータとして出した', x, b.y + 86, { font: F.jp(500, 14), color: C.ink, alpha: 1 });
  ctx.save();
  ctx.fillStyle = C.rule;
  ctx.fillRect(x, b.y + 100, b.w - 32, 1.5);
  ctx.restore();
  const wn = text(ctx, 'OSWorld', x, b.y + 126, { font: F.sans(700, 19), color: C.ink, alpha: 1 });
  text(ctx, '（原版、369 課題）', x + wn + 4, b.y + 125, { font: F.jp(500, 13), color: C.ink2, alpha: 1 });
  text(ctx, '画面を操作する課題を集めた試験', x, b.y + 147, { font: F.jp(500, 13), color: C.muted, alpha: 1 });
  const big = F.cond(700, 34);
  const col = x + Math.max(measure(ctx, big, '14.9%'), measure(ctx, big, '72.36%')) + 14;
  text(ctx, '14.9%', x, b.y + 194, { font: big, color: C.ink, alpha: 1 });
  text(ctx, 'Claude 3.5 Sonnet（更新版）', col, b.y + 177, { font: F.jp(500, 13), color: C.ink, alpha: 1 });
  const wi = text(ctx, '画面の画像だけ', col, b.y + 195, { font: F.jp(500, 13), color: C.ink2, alpha: 1 });
  text(ctx, '、15 回まで', col + wi, b.y + 195, { font: F.jp(500, 13), color: C.ink2, alpha: 1 });
  text(ctx, '72.36%', x, b.y + 245, { font: big, color: C.ink, alpha: 1 });
  text(ctx, '人', col, b.y + 228, { font: F.jp(700, 13), color: C.ink, alpha: 1 });
  text(ctx, '元の論文（2024）の測定', col, b.y + 246, { font: F.jp(500, 13), color: C.ink2, alpha: 1 });
  text(ctx, '条件は同じではない（人には回数の上限なし）', x, b.y + 270, { font: F.jp(700, 12), color: C.ink, alpha: 1 });
  text(ctx, '出典：Anthropic（2024-10-22）、Xie ほか（2024）', x, b.y + b.h - 10, { font: F.jp(400, 11), color: C.muted, alpha: 1 });
}

// The official table of OSWorld-Verified, August 2026.
function card2026(ctx) {
  const b = CARD26;
  cardBox66(ctx, b);
  const x = b.x + 16;
  text(ctx, 'OSWorld-Verified', x, b.y + 30, { font: F.sans(700, 19), color: C.ink, alpha: 1 });
  text(ctx, '課題や採点を見直した版', x, b.y + 51, { font: F.jp(500, 13), color: C.muted, alpha: 1 });
  text(ctx, '公式の成績表の得点（2026-08-01 付）', x, b.y + 76, { font: F.jp(500, 13), color: C.ink, alpha: 1 });
  const w86 = text(ctx, '85.96%', x, b.y + 119, { font: F.cond(700, 34), color: C.ink, alpha: 1 });
  text(ctx, 'Claude Fable 5', x + w86 + 14, b.y + 102, { font: F.jp(500, 13), color: C.ink, alpha: 1 });
  text(ctx, '100 回まで', x + w86 + 14, b.y + 120, { font: F.jp(500, 13), color: C.ink2, alpha: 1 });
  text(ctx, '試験の版も条件も違う', x, b.y + 150, { font: F.jp(700, 13), color: C.ink, alpha: 1 });
  text(ctx, '2024 年の 14.9% とは、そのまま比べられない', x, b.y + 170, { font: F.jp(500, 13), color: C.ink, alpha: 1 });
  text(ctx, '出典：OSWorld の公式の Verified の表', x, b.y + b.h - 12, { font: F.jp(400, 11), color: C.muted, alpha: 1 });
}
