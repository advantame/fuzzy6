// 7-2: a common socket. An issue on GitHub is where a team writes down a problem to fix or a job to do and
// follows it; somebody may have written about the same timeouts already. GitHub has an API through which
// other programs read and write issues, and a program that calls it, built into the harness, can be used as
// a tool. But GitHub is not the only service to connect, and there is more than one harness (one used in a
// terminal, one in an editor): three harnesses and four services, each pair joined by a program of its own,
// make 3 × 4 = 12 programs to write. So the exchange between the harness and the program that connects to a
// service is given a common shape — asking which tools there are, calling a tool — which every harness
// sends the same way; one program per service that exchanges in this shape serves any harness. The programs
// to write: three on the harnesses' side, four on the services', 3 + 4 = 7. The rule is called MCP (Model
// Context Protocol), the program that answers the harness an MCP server (run on one's own computer or on the
// net). Anthropic released MCP in November 2024; in December 2025 it was given to a foundation under the
// Linux Foundation. ずんだもん: so the shape of the socket was made the same? Yes: a harness that speaks MCP
// can use the same MCP server as any other.
//
// What is counted is the programs to write (research/harness-jobs-facts 7-2): the 12 are the programs in
// the cells of a table, harnesses down its side and services along its top, not lines; nothing stands in
// the middle (no hub or band, which would look like a relay server or a bus). Made common, each program
// splits where it meets the harness: the halves that face the harnesses merge, row by row, into one part
// per harness, and those that face the services merge, column by column, into one per service — the
// seven parts, all with the same socket (plug() in lib/harness.js). What is made the same is the shape of
// the exchange; each service's API and the tools' inputs stay as they are (MCP's card says so). The parts
// on the harnesses' side are not named MCP clients: a harness makes one client per server it connects to,
// so their number is not three (the same research).
//
// The clip joins 7-1 (spec §6.10): its first frame is 7-1's last picture, drawn here with lib/harness.js's
// functions as harness.js draws them (and 7-1's two cards under the LLM, copied below); the bridge clears
// the jobs and the cards, the chapter's contents but its first card, and the person on the way to the tool.
// The document stays short, as 7-1 leaves it, while the harness's program to GitHub sits under it; at the
// end the document is full height again (DOC7). The picture pulls back to the table as 7-2's fifth sentence
// begins (the harness's box, GitHub and the program to it take their places in it) and comes back as the
// last one ends: the GitHub MCP server then stands in the tool's place under the shell, run on the user's
// computer (an example), with its line down to GitHub's API — only placed there, as 7-3 begins.
// Everything in the picture is an example (the request, the issues, the harnesses and services, where the
// servers run); the release and the gift are facts.

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import { chatScreen, screenBubbles, chatBubble, screenLinks, llmBlock, appFrame, channel, docLayout, docEntry, rowAt, roleMark, ROLE, WRITER, loopIcon } from '../lib/rig.js';
import { T as T64, SYS, defY, DEFS, defRows, drawDef, gate, person } from '../lib/terminal.js';
import {
  T7, L7, ACT7, DOC7, TOOL7, NET7, CARD7, UNDER7, DOC7_SHORT, PANEL7, NAME, harnessBox, toolPlace, shell, exampleNote,
  marker, chipGo, REPORT64, ASK7_SCREEN, ASK7_DOC, term64Lines, jobCards, tocCards, TOC,
  githubPanel, issueRow, API7, PORT, plug, PLUG, programCard, mcpServer, SERVER7, SERVER_FONT, SERVER_SUB, serverLine,
  mcpCard,
} from '../lib/harness.js';
import { text, measure, rr, path, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { focus, ringBox } from '../../../src/kit/cue.js';

// ——— 7-1's last picture, as harness.js draws it (its last frame is this clip's first) ——————————————————
const TFONT = F.jp(500, 20); // text in the document
const NAMECARD = { x: UNDER7.x, y: UNDER7.y, w: UNDER7.w, h: 126 };
const VARYCARD = { x: UNDER7.x, y: NAMECARD.y + NAMECARD.h + 12, w: UNDER7.w, h: 118 };
const NOTE71 = '依頼、ログ、出力、報告、文書の中身は説明のための例';

// ——— this clip ————————————————————————————————————————————————————————————————————————————————————
const NOTE_A = '依頼、ログ、出力、報告、文書の中身、Issue の一覧は説明のための例';
const NOTE_B = 'ハーネスとサービスの組み合わせ、サーバーの置き場所は説明のための例';
// a–d: the program to GitHub, built into the harness, under its short document; its line to GitHub's API
const PART = { x: DOC7.x + DOC7.w - 236, y: PANEL7.y + PANEL7.h - 66, w: 236, h: 60 };
const LANE_X = (L7.app.x + L7.app.w + TOOL7.x) / 2 + 12; // between the frame and the tool's place (clear of 結果)
const LANE_Y = (TOOL7.y + TOOL7.h + NET7.y) / 2; // under the tool's place, over GitHub
const PART_LINE = [[PART.x + PART.w, PART.y + PART.h / 2], [LANE_X, PART.y + PART.h / 2], [LANE_X, LANE_Y], [API7.x, LANE_Y], [API7.x, API7.y - PORT.h / 2]];
// e on: the table — the harnesses down its side, the services along its top, a program in each cell
const MX = {
  hx: 400, hw: 260, hh: 76,
  rows: [320, 460, 600],
  cols: [840, 1020, 1200, 1380],
  sy: 110, sw: 160, sh: 60,
  cw: 150, ch: 60, lw: 40, gap: 6,
  hp: { x: 664, w: 74, h: 60 },
  sp: { y: 184, w: 150, h: 50 },
};
const HARNESSES = ['このハーネス', 'ターミナルで使うもの', 'エディタで使うもの'];
const SERVICES = ['GitHub', 'チャット', 'カレンダー', 'データベース'];
const WHERE = ['手元', 'ネットの先', 'ネットの先', '手元']; // where each service's MCP server runs (an example)
const HB = (i) => ({ x: MX.hx, y: MX.rows[i] - MX.hh / 2, w: MX.hw, h: MX.hh });
const SB = (j) => ({ x: MX.cols[j] - MX.sw / 2, y: MX.sy, w: MX.sw, h: MX.sh });
const CELL = (i, j) => ({ x: MX.cols[j] - MX.cw / 2, y: MX.rows[i] - MX.ch / 2, w: MX.cw, h: MX.ch });
const HP = (i) => ({ x: MX.hp.x, y: MX.rows[i] - MX.hp.h / 2, w: MX.hp.w, h: MX.hp.h });
const SP = (j) => ({ x: MX.cols[j] - MX.sp.w / 2, y: MX.sp.y, w: MX.sp.w, h: MX.sp.h });
// a cell's program, split where it meets the harness (h): the part that faces the harness, and the rest
const LEFT = (i, j, g = MX.gap) => { const b = CELL(i, j); return { x: b.x, y: b.y, w: MX.lw - g / 2, h: b.h }; };
const RIGHT = (i, j, g = MX.gap) => { const b = CELL(i, j); return { x: b.x + MX.lw + g / 2, y: b.y, w: b.w - MX.lw - g / 2, h: b.h }; };
// the count, under the table
const SUM = { x: MX.hx, label: 702, sub: 732, y: 782, x2: MX.hx + 380 };
const CF = F.cond(700, 46);
const H_FONT = F.jp(700, 17);
const S_FONT = F.jp(700, 18);
const CARD_FONT = F.jp(500, 14);

const mixBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

export default clip({
  id: 'mcp',
  title: '共通の差し込み口',
  kicker: 'MCP',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.8, // 7-1's lists, cards and the person on the way to the tool clear away
  script: [
    { id: 'a', text: '{issue}Issue は、{bug}直したい問題や、{task}これからする仕事を書きこんで、\n{team}チームで追いかけるための場所よ。' },
    { id: 'b', text: '{same}同じ時間切れのことを、\n{some}もうだれかが書きこんでいるかもしれないわね。' },
    { id: 'c', text: '{gh}GitHub には、ほかのプログラムから\nIssue を読み書きするための{api}API があるわ。' },
    { id: 'd', still: true, tail: 1.2, text: '{that}その API を呼ぶ{prog}プログラムを{into}ハーネスに組みこめば、\n{tool}ツールとして使えるの。' },
    { id: 'e', lead: 1.4, text: 'でも、{svc}つなぎたいサービスは、{gh2}GitHub {more}だけではないわ。' },
    { id: 'f', text: '{hs1}ハーネスのほうも、{term}ターミナルで使うもの、\n{edit}エディタで使うもの、と一つではないわね。' },
    { id: 'g', still: true, text: '{three}三つのハーネスと{four}四つのサービスを、\n{own}組ごとに専用のプログラムでつなぐなら、\n\n{mul}3 かける 4 で、{twelve}12 本を書くことになるわ。' },
    { id: 'h', text: 'そこで、{between}ハーネスと、サービスにつなぐプログラムとの\nやりとりを、{common}共通の形にそろえましょう。' },
    { id: 'i', tail: 0.4, text: '{ask}使えるツールを尋ねる、{call}ツールを呼ぶ、といったやりとりを、\n{every}どのハーネスも、同じ形で送るの。' },
    { id: 'j', text: '{each}サービスごとに、この形でやりとりするプログラムを\n一つ用意すれば、{any}どのハーネスでも使い回せるわ。' },
    { id: 'k', still: true, text: '用意するプログラムは、\n{hs}ハーネスの側に三つ、{ss}サービスの側に四つ。\n\n{plus}3 たす 4 で、{seven}7 本になるわね。' },
    { id: 'l', text: 'この決まりを、{mcp}MCP と呼ぶわ。\n{abbr}[Model Context Protocol|モデルコンテクストプロトコル]の略よ。' },
    { id: 'm', text: '{q13}ハーネスからの問い合わせや呼び出しに答えるプログラムを、\n{srv}MCP サーバーと呼ぶわ。' },
    { id: 'm2', text: '{local}手元のパソコンで動かすものも、\n{remote}ネットの先で動くものもあるの。' },
    { id: 'n', still: true, text: 'MCP は、{y24}2024 年 11 月に Anthropic が公開し、\n\n{y25}2025 年 12 月には、[Linux Foundation|リナックスファウンデーション]の\nもとの団体に寄贈されたわ。' },
    { id: 'o', by: 'zunda', text: '{plug}[差しこみ口|さしこみぐち]の形を、{align}そろえたってことなのだ？' },
    { id: 'p', tail: 1.8, text: '{yes}そうよ。{sup}MCP に対応したハーネスなら、\n{reuse}同じ MCP サーバーを使い回せるわ。' },
  ],

  prepare(ctx) {
    // ——— 7-1's last picture: the head of the document, the request, the screen's two bubbles
    const opts = { ...T64.DOC, font: TFONT, lh: 28 };
    const one = (L0, e, yy) => docLayout(ctx, L0, [e], { ...opts, top: yy - L0.doc.y })[0];
    const defs = defRows(ctx, DEFS);
    const U = one(L7, { role: 'user', text: ASK7_DOC }, defY(1) + 28);
    if (U.rows.length !== 3) throw new Error(`mcp: the request takes ${U.rows.length} rows`);
    const [Br, Bu] = screenBubbles(ctx, T7.SCREEN, [['assistant', REPORT64], ['user', ASK7_SCREEN]], { font: F.jp(500, 15), gap: 12 });
    const inText = (E, row, part, before) => {
      const at = rowAt(E, row);
      return { x: at.x + measure(ctx, E.font, before), y: at.y - 20, w: measure(ctx, E.font, part), h: 26 };
    };
    // a, b: the words in the request that the voice points at
    const words = { issue: inText(U, 2, 'Issue', 'GitHub の '), timeout: inText(U, 0, '時間切れ', '') };

    // ——— the table: the names must fit their boxes
    HARNESSES.forEach((s) => {
      if (MX.hh * 0.95 + measure(ctx, H_FONT, s) + 10 > MX.hw) throw new Error(`mcp: ${s} does not fit its box`);
    });
    SERVICES.forEach((s) => {
      if (measure(ctx, S_FONT, s) + 24 > MX.sw) throw new Error(`mcp: ${s} does not fit its box`);
    });
    if (measure(ctx, SERVER_FONT, 'GitHub の MCP サーバー') + 30 + 12 > SERVER7.w) throw new Error('mcp: the server\'s name does not fit');
    if (MX.hp.x + MX.hp.w + PLUG.w / 2 + 8 > CELL(0, 0).x) throw new Error('mcp: the harness\'s part touches the cells');
    return { defs, U, Br, Bu, words };
  },

  draw(ctx, t, s, { at, pace }) {
    const { defs, U, Br, Bu, words } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;

    // ——— the bridge: 7-1's lists, its cards under the LLM, most of the contents and the person clear away
    const br = at('a');
    const gone = 1 - inOutCubic(seg(t, 0, br));
    // e: the picture pulls back to the table; p: and comes back, with GitHub's MCP server in the tool's place
    const pB = inOutCubic(seg(t, at('e'), at('e') + 1.3));
    const pR = inOutCubic(seg(t, at('p.end') + 0.15, at('p.end') + 1.6));
    const q = Math.min(pB, 1 - pR); // how far the shared pieces stand in the table
    const mA = pB * (1 - seg(pR, 0, 0.45)); // the table's own pieces (they leave first as it comes back)
    const sceneB = seg(pR, 0.3, 1); // the chapter's picture comes back after them
    const tableOn = mA > 0.001 || q > 0.001; // (the table draws the shared pieces while it is on)

    // ——— the rings: what the voice points at
    const [issueLit, bugLit, taskLit, teamLit] = lit(['issue', 'bug', 'task', 'team'], at('a.end'));
    const [sameLit] = lit(['same'], at('some'));
    const [ghLit] = lit(['gh'], at('api'));
    const [thatLit, intoLit] = lit(['that', 'into'], at('tool'));
    const [gh2Lit] = lit(['gh2'], at('more'));
    const [hs1Lit] = lit(['hs1'], at('term'));
    const [threeLit, fourLit, twelveLit] = lit(['three', 'four', 'twelve'], at('g.end'));
    const [betweenLit] = lit(['between'], at('common'));
    const [hsLit, ssLit, sevenLit] = lit(['hs', 'ss', 'seven'], at('k.end'));
    const [q13Lit] = lit(['q13'], at('srv'));
    const [plugLit] = lit(['plug'], at('o.end'));
    const [askLit, callLit] = lit(['ask', 'call'], at('every'));
    const [mcpLit] = lit(['mcp'], at('l.end'));
    const [y24Lit, y25Lit] = lit(['y24', 'y25'], at('n.end'));
    const [supLit, reuseLit] = lit(['sup', 'reuse'], at('p.end'));

    // ——— the chapter's picture (7-1's, then this clip's), drawn small while the table takes over
    const sceneA = (1 - pB) * (1 - pR);
    if (sceneA > 0.001) {
      withScene(ctx, sceneA, lerp(1, 0.94, pB), () => scene(ctx, t, s, {
        docH: DOC7_SHORT.h,
        box: !tableOn,
        panel: !tableOn,
        partCard: !tableOn,
        leave: 1 - seg(pB, 0, 0.3),
        gate: gone,
        c71: gone,
        toc0: 1,
        note71: gone,
        noteA: 1 - gone,
        gh: tw(t, at('a'), pace.enter),
        ghRings: { issue: issueLit, gh: ghLit, that: thatLit },
        bug: pop('bug'), task: pop('task'), team: pop('team'), bugLit, taskLit, teamLit,
        some: pop('some') * (1 - tw(t, at('c'), 0.4)),
        port: pop('api'),
        part: pop('prog'),
        partLine: inOutCubic(seg(t, at('prog') - lead + 0.15, at('prog') - lead + 0.85)),
        into: intoLit,
        call: seg(t, at('tool') - lead, at('tool') - lead + 0.9),
        back: seg(t, at('tool') - lead + 0.95, at('tool') - lead + 1.85),
        words: { issue: issueLit, timeout: sameLit },
      }));
    }
    if (sceneB > 0.001) {
      withScene(ctx, sceneB, lerp(0.94, 1, pR), () => scene(ctx, t, s, {
        docH: DOC7.h,
        box: !tableOn,
        panel: !tableOn,
        final: true,
        gh: 1,
        server: tableOn ? 0 : 1,
        serverLine: seg(pR, 0.7, 1),
        noteA: 1,
      }));
    }

    // ——— the table
    if (tableOn) table(ctx, t, s, { at, pace, pop, lit, q, mA, pB, pR, threeLit, fourLit, twelveLit, betweenLit, hsLit, ssLit, sevenLit, q13Lit, plugLit, supLit, reuseLit, gh2Lit, hs1Lit });

    // ——— MCP's card, above the LLM (it stays as the clip ends)
    const card = mcpCard(ctx, {
      a: pop('common'),
      name: seg(t, at('mcp') - lead, at('mcp') - lead + 0.4),
      abbr: pop('abbr'),
      rows: [pop('ask'), pop('call')],
      note: tw(t, at('call') + 0.6, pace.enter),
      years: [pop('y24'), pop('y25')],
      plugColor: plugLit > 0.5 ? C.accent : C.ink,
    });
    if (card) {
      ringBox(ctx, card.plug, plugLit, C.accent, 6);
      ringBox(ctx, card.title, mcpLit, C.accent, 4);
      ringBox(ctx, card.rows[0], askLit, C.accent, 3);
      ringBox(ctx, card.rows[1], callLit, C.accent, 3);
      ringBox(ctx, card.years[0], y24Lit, C.accent, 3);
      ringBox(ctx, card.years[1], y25Lit, C.accent, 3);
      const qa = pop('align') * (1 - tw(t, at('p'), 0.4));
      if (qa > 0.001) tag(ctx, CARD7.x + CARD7.w + 4, CARD7.y - 16, '？', { font: F.jp(700, 16), h: 28, padX: 9, fill: C.accent, color: '#fff', r: 14, align: 'right', alpha: qa });
    }

    // ——— the example's note (7-1's gives way; the table has its own)
    exampleNote(ctx, L7, '', 0, 1);
    const exX = L7.app.x + measure(ctx, F.jp(700, 17), '例') + 20 + 10;
    const exY = L7.app.y + L7.app.h + 22 + 21;
    const nf = F.jp(400, 17);
    text(ctx, NOTE71, exX, exY, { font: nf, color: C.muted, alpha: gone });
    text(ctx, NOTE_A, exX, exY, { font: nf, color: C.muted, alpha: (1 - gone) * (1 - pB) + sceneB });
    text(ctx, NOTE_B, exX, exY, { font: nf, color: C.muted, alpha: mA });
  },
});

// Draw fn with alpha a, scaled by sc about the stage's middle (the picture pulling back).
function withScene(ctx, a, sc, fn) {
  ctx.save();
  ctx.globalAlpha *= a;
  if (sc !== 1) {
    ctx.translate(800, 450);
    ctx.scale(sc, sc);
    ctx.translate(-800, -450);
  }
  fn();
  ctx.restore();
}

// ——— the chapter's picture: 7-1's last (v.c71 its lists and cards, v.gate the person, v.toc0 the first card of
// the contents), this clip's GitHub and the program to it (a–d), or, with v.final, the picture as the clip ends
function scene(ctx, t, s, v) {
  const { defs, U, Br, Bu, words } = s;
  const Ld = { ...L7, doc: { ...DOC7, h: v.docH } };
  // the chat screen: 6-4's report and the request
  chatScreen(ctx, T7.SCREEN, 1);
  chatBubble(ctx, Br, { alpha: 1 });
  chatBubble(ctx, Bu, { alpha: 1 });
  screenLinks(ctx, T7, { talk: 1, back: 1, talkHot: false, backHot: false });
  // the LLM, and the frame with its document
  appFrame(ctx, Ld, 1, { name: '' });
  llmBlock(ctx, L7, 1, { glow: 0 });
  channel(ctx, L7.read, 1, { hot: false });
  channel(ctx, L7.write, 1, { hot: false });
  channel(ctx, L7.call, 1, { labelAlpha: 1, hot: false });
  channel(ctx, L7.back, 1, { labelAlpha: 1, hot: false });
  roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
  defs.forEach((d, k) => drawDef(ctx, d, defY(k), 1));
  docEntry(ctx, U, 1, { tagAlpha: 0, chars: 1 });
  roleMark(ctx, U.x, U.y + 1, ROLE.user, { edge: WRITER.user });
  if (!v.final) {
    marker(ctx, words.issue, v.words.issue);
    marker(ctx, words.timeout, v.words.timeout);
  }
  // the harness's box (7-1's: アプリ gone, ハーネス), its loop; the person on the way to the tool (7-1)
  if (v.box) harnessBox(ctx, ACT7, 1, { glow: 0, names: [['アプリ', 0, 26], [NAME, 1, 0]] });
  const LP = T7.LOOP;
  loopIcon(ctx, LP.x, LP.y, LP.r, 1, { p: 1 });
  text(ctx, 'くり返す', LP.x - LP.r - 14, LP.y + 6, { font: F.jp(700, 16), color: C.purple, align: 'right', alpha: 1 });
  if ((v.gate ?? 0) > 0.001) gate(ctx, (L7.call.x1 + L7.call.x2) / 2, L7.call.y, v.gate);
  // the tool's place: the shell (6-4's lines), and as the clip ends GitHub's MCP server under it
  toolPlace(ctx, L7, 1, {
    draw: (c) => {
      shell(c, t, 1, term64Lines(() => -100), { trim: true });
      if (v.final && (v.server ?? 0) > 0.001) mcpServer(c, SERVER7, v.server);
    },
  });
  // 7-1's lists and cards
  if ((v.c71 ?? 0) > 0.001) {
    ctx.save();
    ctx.globalAlpha *= v.c71;
    jobCards(ctx, { head: [['アプリにさせてきた仕事', 0], ['ハーネスにさせてきた仕事', 1]], cards: [1, 1, 1, 1], lit: [0, 0, 0, 0] });
    nameCard71(ctx);
    varyCard71(ctx);
    ctx.restore();
  }
  if (!v.final) {
    const c71 = v.c71 ?? 0;
    tocCards(ctx, { head: c71, cards: TOC.map((_, k) => (k === 0 ? v.toc0 : c71)) });
  }

  // ——— GitHub in the net beyond (a on)
  const gh = v.gh ?? 0;
  if (gh > 0.001) {
    const B = NET7;
    if (v.panel) githubPanel(ctx, B, gh, { rows: 1, port: v.final ? 1 : v.port });
    if (!v.final) {
      const lv = v.leave;
      ctx.save();
      ctx.globalAlpha *= lv;
      ringBox(ctx, { x: B.x + 12, y: B.y + 44, w: B.w - 24, h: 70 }, v.ghRings.issue, C.accent, 0);
      ringBox(ctx, B, v.ghRings.gh, C.accent, 4);
      ringBox(ctx, { x: API7.x - PORT.w / 2, y: API7.y - PORT.h / 2, w: PORT.w, h: PORT.h }, v.ghRings.that, C.accent, 4);
      // a: a problem to fix, a job to do, the people who follow them
      const kinds = [['直したい問題', v.bug, v.bugLit], ['これからする仕事', v.task, v.taskLit]];
      kinds.forEach(([k, a, l], r) => {
        const row = issueRow(B, r);
        const w = tag(ctx, row.x + row.w + 12, row.y - 15, k, { font: F.jp(700, 12), h: 20, padX: 8, fill: C.panel, color: C.ink2, r: 6, alpha: a * gh });
        ringBox(ctx, { x: row.x + row.w + 12, y: row.y - 15, w, h: 20 }, l, C.accent, 2);
      });
      [0, 1, 2].forEach((r) => {
        const row = issueRow(B, r);
        const ta = tw(v.team, r * 0.25, 0.75) * gh;
        if (ta > 0.001) peopleIcon(ctx, B.x + B.w - 34, row.y - 5, ta);
      });
      ringBox(ctx, { x: B.x + B.w - 52, y: B.y + 44, w: 36, h: 70 }, v.teamLit, C.accent, 0);
      // b: somebody may have written about it already
      if (v.some > 0.001) tag(ctx, B.x + B.w - 10, B.y - 14, '同じ時間切れの Issue は？', { font: F.jp(700, 13), h: 26, padX: 10, fill: C.accent, color: '#fff', r: 13, align: 'right', alpha: v.some * gh });
      ctx.restore();
    }
  }
  // c, d: the program built into the harness, its line to the API; it is used as a tool (a round trip)
  if (!v.final) {
    const pa = v.part ?? 0;
    if (pa > 0.001) {
      ctx.save();
      ctx.globalAlpha *= pa;
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      path(ctx, PART_LINE, v.partLine);
      ctx.restore();
      if (v.partCard) partCard(ctx, PART, pa);
      text(ctx, 'ハーネスに組みこんだプログラム', PART.x, PART.y - 12, { font: F.jp(500, 13), color: C.muted, alpha: pa });
      chipGo(ctx, v.call, PART_LINE, 'Issue を読む', 'call', null, 1600);
      chipGo(ctx, v.back, [...PART_LINE].reverse(), 'Issue の一覧', 'found', null, 1600);
    }
    ringBox(ctx, L7.app, v.into ?? 0, C.accent, 4);
  }
  if (v.final) serverLine(ctx, SERVER7, 1, v.serverLine);
}

// The program to GitHub as d builds it into the harness.
function partCard(ctx, B, a) {
  programCard(ctx, B, a, [['GitHub に', F.jp(700, 15)], ['つなぐプログラム', F.jp(700, 15)]]);
}

// Two people who follow an issue, centred on (x, y).
function peopleIcon(ctx, x, y, a) {
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  person(ctx, x - 7, y + 1, C.blue, 0.72);
  person(ctx, x + 7, y + 1, C.blue, 0.72);
  ctx.restore();
}

// ——— the table (e on) ——————————————————————————————————————————————————————————————————————————————

function table(ctx, t, s, k) {
  const { at, pace, pop, q, mA, pB, pR } = k;
  const lead = pace.cue.lead;
  // the harness's box, GitHub and the program to it come from the chapter's picture (q: 0 there, 1 here)
  // e, f: the other services and harnesses
  const svcA = [1, ...[1, 2, 3].map((j) => tw(t, at('more') - lead + (j - 1) * 0.14, pace.enter))];
  const hrnA = [1, pop('term'), pop('edit')];

  // ——— g: a program in every cell, one for each pair (the first is the program to GitHub)
  const ownAt = at('own') - lead;
  const step = Math.max(pace.stagger, (at('mul') - lead - ownAt) / 12);
  const cellA = (i, j) => (i === 0 && j === 0 ? 1 : tw(t, ownAt + (i * 4 + j - 1) * step, pace.enter));
  // h: split where they meet the harness; a common socket there
  const split = inOutCubic(seg(t, at('between') - lead, at('between') - lead + 0.6));
  const sockA = pop('common');
  // i: the parts that face the harnesses merge into one per harness; j: the rest, into one per service
  const mh = (j) => inOutCubic(seg(t, at('every') - lead + j * 0.1, at('every') - lead + j * 0.1 + 0.85));
  const ms = (j) => inOutCubic(seg(t, at('each') - lead + j * 0.12, at('each') - lead + j * 0.12 + 0.85));
  const hpA = mh(3); // a harness's own part is whole once the last half has come
  const okA = (i, j) => tw(t, at('any') - lead + j * 0.14 + i * 0.05, pace.enter);
  const srvName = seg(t, at('srv') - lead, at('srv') - lead + 0.4);
  const plugC = k.plugLit > 0.5 ? C.accent : C.ink;

  // ——— the services along the top, the harnesses down the side (the first of each comes from the picture)
  SERVICES.forEach((name, j) => {
    if (j === 0) return;
    serviceBox(ctx, SB(j), name, mA * svcA[j]);
  });
  HARNESSES.forEach((name, i) => {
    if (i === 0) return;
    harnessChip(ctx, HB(i), mA * hrnA[i], [[name, 1]]);
  });
  // GitHub: the panel in the net beyond, or its box in the table
  const G = mixBox(NET7, SB(0), q);
  if (q > 0.001 && q < 0.999) githubPanel(ctx, G, 1 - q, { rows: 1 - clamp(q * 2), port: 1 - clamp(q * 2) });
  if (q > 0.001) serviceBox(ctx, G, 'GitHub', clamp(q * 1.4 - 0.2));
  // the harness's box: from 7-1's (ハーネス) to the table's (このハーネス)
  if (q > 0.001) {
    const Bh = mixBox(ACT7, HB(0), q);
    harnessChip(ctx, Bh, 1, [[NAME, 1 - q, F.jp(700, 32), 86], [HARNESSES[0], q]], { gx: lerp(48, MX.hh * 0.5, q), gr: lerp(24, MX.hh * 0.25, q) });
  }
  ringBox(ctx, SB(0), k.gh2Lit * mA, C.accent, 4);
  ringBox(ctx, HB(0), k.hs1Lit * mA, C.accent, 4);
  ringBox(ctx, [0, 1, 2].map(HB), k.threeLit * mA, C.accent, 6);
  ringBox(ctx, [0, 1, 2, 3].map(SB), k.fourLit * mA, C.accent, 6);

  // ——— the cells: whole programs (g), split (h), the halves leaving (i, j). The program to GitHub comes in
  // from under the harness's document (with the shared pieces, not faded with the table)
  if (split <= 0.001) {
    const B = mixBox(PART, CELL(0, 0), pB);
    programCard(ctx, B, 1, []);
    cardText(ctx, B, [['GitHub に', F.jp(700, 15)], ['つなぐプログラム', F.jp(700, 15)]], 1 - pB);
    cardText(ctx, B, [['つなぐ', CARD_FONT], ['プログラム', CARD_FONT]], pB);
  }
  ctx.save();
  ctx.globalAlpha *= mA;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      const a = cellA(i, j);
      if (a <= 0.001) continue;
      if (split <= 0.001) {
        if (i === 0 && j === 0) continue;
        programCard(ctx, CELL(i, j), a, []);
        cardText(ctx, CELL(i, j), [['つなぐ', CARD_FONT], ['プログラム', CARD_FONT]], a);
        continue;
      }
      // the rest of a split program, on its way up to the service's own part (its socket faces the harness)
      const pr = ms(j);
      if (pr < 1) {
        const Rb = mixBox(RIGHT(i, j, MX.gap * split), SP(j), pr);
        programCard(ctx, Rb, 1, []);
        cardText(ctx, Rb, [['つなぐ', CARD_FONT], ['プログラム', CARD_FONT]], 1 - clamp(pr * 3));
        plug(ctx, lerp(Rb.x, Rb.x + Rb.w / 2, pr), lerp(Rb.y + Rb.h / 2, Rb.y + Rb.h, pr), sockA, plugC);
      }
    }
  }
  // the parts that face the harness (purple once split), on their way to the harness's own part: they dip
  // under their row as they go, over the cells they pass
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      if (split <= 0.001 || hpA >= 1) continue;
      const pl = mh(j);
      const Lb = mixBox(LEFT(i, j, MX.gap * split), HP(i), pl);
      const dy = Math.sin(Math.PI * pl) * 44;
      rr(ctx, Lb.x, Lb.y + dy, Lb.w, Lb.h, 9);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.save();
      ctx.globalAlpha *= split;
      ctx.fillStyle = C.purpleSoft;
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = split > 0.5 ? C.purple : C.ink2;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }
  // ——— the harnesses' own parts (i), the services' own parts (j)
  for (let i = 0; i < 3; i++) {
    if (hpA <= 0.001) break;
    const B = HP(i);
    programCard(ctx, B, hpA >= 1 ? 1 : seg(hpA, 0.9, 1), [], { fill: C.purpleSoft, stroke: C.purple });
    progLines(ctx, B, hpA, C.purple);
    plug(ctx, B.x + B.w, B.y + B.h / 2, seg(hpA, 0.6, 1), plugC);
  }
  ctx.restore();
  ringBox(ctx, [0, 1, 2].map(HP), Math.max(k.hsLit, k.supLit) * mA, C.accent, 5);
  for (let j = 0; j < 4; j++) {
    const pr = ms(j);
    if (pr < 1) {
      if (pr > 0.6) cardText(ctx, SP(j), [['つなぐプログラム', CARD_FONT]], mA * seg(pr, 0.6, 1));
      continue;
    }
    const B = j === 0 ? mixBox(SP(0), SERVER7, pR) : SP(j);
    const a = j === 0 ? 1 : mA;
    if (j === 0 && pR > 0.001) {
      // GitHub's MCP server goes to the tool's place
      programCard(ctx, B, a, []);
      cardText(ctx, B, [['MCP サーバー', F.jp(700, 15)]], 1 - clamp(pR * 2));
      text(ctx, 'GitHub の MCP サーバー', B.x + 30, B.y + 25, { font: SERVER_FONT, color: C.ink, alpha: clamp(pR * 2 - 1) });
      text(ctx, '手元のパソコンで動かす（例）', B.x + 30, B.y + 44, { font: SERVER_SUB, color: C.muted, alpha: clamp(pR * 2 - 1) });
      plug(ctx, lerp(B.x + B.w / 2, B.x, pR), lerp(B.y + B.h, B.y + B.h / 2, pR), 1, C.ink);
      tag(ctx, B.x + B.w / 2, B.y + B.h + 12, WHERE[0], { font: F.jp(700, 12), h: 22, padX: 9, fill: C.paper, stroke: C.ink2, color: C.ink2, r: 11, align: 'center', alpha: 1 - clamp(pR * 3) });
      continue;
    }
    if (a <= 0.001) continue;
    programCard(ctx, B, a, []);
    cardText(ctx, B, [['つなぐプログラム', CARD_FONT]], a * (1 - srvName));
    cardText(ctx, B, [['MCP サーバー', F.jp(700, 15)]], a * srvName);
    plug(ctx, B.x + B.w / 2, B.y + B.h, a, plugC);
    // m2: where it runs (an example)
    const wa = a * (WHERE[j] === '手元' ? k.pop('local') : k.pop('remote'));
    if (wa > 0.001) tag(ctx, B.x + B.w / 2, B.y + B.h + 12, WHERE[j], { font: F.jp(700, 12), h: 22, padX: 9, fill: C.paper, stroke: C.ink2, color: C.ink2, r: 11, align: 'center', alpha: wa });
  }
  ringBox(ctx, [0, 1, 2, 3].map(SP), Math.max(k.ssLit, k.q13Lit) * mA, C.accent, 5);
  ringBox(ctx, SP(0), k.reuseLit * mA, C.accent, 5);

  // ——— j: any harness with any service's part (nothing written in the cells)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      const a = okA(i, j) * mA;
      if (a > 0.001) okMark(ctx, MX.cols[j], MX.rows[i], a);
    }
  }
  ringBox(ctx, [0, 1, 2].map((i) => ({ x: MX.cols[0] - 16, y: MX.rows[i] - 16, w: 32, h: 32 })), k.reuseLit * mA, C.accent, 4);
  ringBox(ctx, [0, 1, 2].flatMap((i) => [0, 1, 2, 3].map((j) => CELL(i, j))), k.twelveLit * mA, C.accent, 6);

  // ——— the count: what there is to write
  const lA = pop('mul') * mA;
  text(ctx, '書くプログラム', SUM.x, SUM.label, { font: F.jp(700, 17), color: C.ink2, alpha: lA });
  text(ctx, '組ごとに専用', SUM.x, SUM.sub, { font: F.jp(500, 15), color: C.muted, alpha: lA });
  const dim = 1 - 0.55 * pop('plus');
  const w1 = text(ctx, '3 × 4 = ', SUM.x, SUM.y, { font: CF, color: C.ink, alpha: lA * dim });
  text(ctx, '12', SUM.x + w1, SUM.y, { font: CF, color: k.twelveLit > 0.5 ? C.accent : C.ink, alpha: pop('twelve') * mA * dim });
  const pA = pop('plus') * mA;
  text(ctx, '共通の形にそろえる', SUM.x2, SUM.sub, { font: F.jp(500, 15), color: C.muted, alpha: pA });
  const w2 = text(ctx, '3 + 4 = ', SUM.x2, SUM.y, { font: CF, color: C.ink, alpha: pA });
  text(ctx, '7', SUM.x2 + w2, SUM.y, { font: CF, color: C.accent, alpha: pop('seven') * mA });
  ringBox(ctx, { x: SUM.x2 + w2 - 4, y: SUM.y - 40, w: measure(ctx, CF, '7') + 8, h: 46 }, k.sevenLit * mA, C.accent, 2);
}

// A service in the table: a white box with its name.
function serviceBox(ctx, B, name, a) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, B.x, B.y, B.w, B.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();
  text(ctx, name, B.x + B.w / 2, B.y + B.h / 2 + 1, { font: S_FONT, color: C.ink, align: 'center', base: 'middle', alpha: a });
}

// A harness in the table: the purple box with its gear (as harnessBox has it) and its name. names: [[text,
// alpha, font, x], …] (crossfaded while the box comes from the chapter's picture). o: { gx, gr }
function harnessChip(ctx, B, a, names, o = {}) {
  if (a <= 0.001) return;
  const cy = B.y + B.h / 2;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, B.x, B.y, B.w, B.h, 18);
  ctx.fillStyle = C.purple;
  ctx.fill();
  gear(ctx, B.x + (o.gx ?? B.h * 0.5), cy, o.gr ?? B.h * 0.25, '#fff');
  ctx.restore();
  names.forEach(([s0, na, font, x]) => text(ctx, s0, B.x + (x ?? B.h * 0.95), cy + 2, { font: font ?? H_FONT, color: '#fff', base: 'middle', alpha: a * na }));
}

// rig.js's gear, stroke for stroke
function gear(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i / 8) * Math.PI * 2);
    ctx.fillRect(-r * 0.17, -r, r * 0.34, r * 0.4);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.moveTo(r * 0.3, 0);
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();
}

// Lines of text centred in a card.
function cardText(ctx, B, lines, a) {
  if (a <= 0.001) return;
  const lh = 20;
  const y0 = B.y + B.h / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach(([s0, font], i) => text(ctx, s0, B.x + B.w / 2, y0 + i * lh + 1, { font, color: C.ink, align: 'center', base: 'middle', alpha: a }));
}

// A program part's few lines of code, in a harness's colour.
function progLines(ctx, B, a, color) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.fillStyle = color;
  [[0, 30], [1, 20], [2, 26]].forEach(([r, w]) => {
    rr(ctx, B.x + 16, B.y + 18 + r * 10, w, 4, 2);
    ctx.fill();
  });
  ctx.restore();
}

// Any harness with any service's part: a green check in the cell.
function okMark(ctx, x, y, a) {
  const s = 0.8 + 0.2 * clamp(a);
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  circle(ctx, x, y, 14 * s);
  ctx.fillStyle = C.green;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 6 * s, y);
  ctx.lineTo(x - 1.5 * s, y + 5 * s);
  ctx.lineTo(x + 7 * s, y - 5 * s);
  ctx.stroke();
  ctx.restore();
}

// ——— 7-1's two cards under the LLM, as harness.js draws them at its end ——————————————————————————————

function cardBox71(ctx, b) {
  ctx.save();
  ctx.globalAlpha *= 1;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function nameCard71(ctx) {
  const b = NAMECARD;
  cardBox71(ctx, b);
  const x = b.x + 16;
  text(ctx, NAME, x, b.y + 30, { font: F.jp(700, 18), color: C.purple, alpha: 1 });
  text(ctx, '＝ この図で「アプリ」と呼んできた部分', x, b.y + 54, { font: F.jp(500, 14), color: C.ink, alpha: 1 });
  text(ctx, 'Anthropic や OpenAI の記事での呼び名', x, b.y + 77, { font: F.jp(500, 14), color: C.ink, alpha: 1 });
  text(ctx, '出典：Anthropic（2025-11-26）、OpenAI（2026-01-23）', x, b.y + 98, { font: F.jp(400, 11), color: C.muted, alpha: 1 });
  text(ctx, '役割をまとめた図。製品やプロセスの境目とは一致しない', x, b.y + 115, { font: F.jp(400, 11), color: C.muted, alpha: 1 });
}

function varyCard71(ctx) {
  const b = VARYCARD;
  cardBox71(ctx, b);
  const x = b.x + 16;
  text(ctx, '同じ LLM でも、ハーネスの作りで変わる', x, b.y + 30, { font: F.jp(700, 15), color: C.ink2, alpha: 1 });
  const chip = { font: F.jp(700, 16), h: 32, padX: 13, fill: C.purpleSoft, color: C.ink, r: 8 };
  const w1 = tag(ctx, x, b.y + 42, 'できること', { ...chip, alpha: 1 });
  tag(ctx, x + w1 + 10, b.y + 42, '試験の点', { ...chip, alpha: 1 });
  tag(ctx, b.x + b.w - 14, b.y + b.h - 40, '10 章　鍛えて測る', { font: F.jp(700, 15), h: 30, padX: 11, fill: C.ink, color: C.paper, align: 'right', alpha: 1 });
}
