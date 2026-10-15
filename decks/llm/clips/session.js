// 7-4: keeping a record. From here the agent reads the logs and the code and tries commands, looking for the
// cause: tool calls and their results pile up, one after another, in one document. This exchange, carried on
// as one conversation, is called a session; here, one session runs until the cause is found and reported. In
// this example most of what piles up is tool results — a file's contents or a command's output can take
// thousands of tokens each. ずんだもん: what if the terminal is closed half way? With nothing yet that keeps a
// record, the exchange so far is gone when the harness's program ends, and what was looked at has to be checked
// again. So the harness is made to write the conversation, the tool calls and their results, in order, into a
// file; to go on, it builds the document the LLM reads again from that record, and the exchange carries over.
// Claude Code and Codex CLI keep sessions in local files and can resume them. The record also lets a person
// check later what the agent read and ran. But keeping a record does not make the document any shorter.
//
// The layout is chapter 7's (lib/harness.js). The clip joins 7-3 (spec §6.10): its first frame is 7-3's last
// (lib/harness.js final73), and the bridge takes the tool's place back to G7 (the shell wide again) and clears
// the lane's log, the harness's socket, MCP's card and the notes under the LLM. The first two rounds run on the
// document as it is (6-4's fast rounds); then the document is shown whole, as a summary (lib/harness.js
// summaryDoc), and stays so. Everything in the session is an example: the commands and their output (none of it
// tells the cause yet, research/harness-jobs-facts 7-4), the tokens (o200k_base), the amounts on the bar, the
// record (its form and its name, not any product's file). The record is drawn apart from the document: what the
// harness writes down is not the document it has the LLM read. Resuming brings back the exchange, not the
// programs that had stopped (the shell, the server): nothing in the tool's place is drawn coming back. 7-4 ends
// on lib/harness.js final74 (7-5's first frame).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import {
  chatScreen, chatBubble, screenLinks, toTool, fromTool, writePath, flyMark, llmBlock, appFrame, channel, token, TOKEN,
  onPath, docEntry, sweep, send, roleMark, MARK_H, ROLE, WRITER, loopIcon,
} from '../lib/rig.js';
import { SYS, defY, drawDef, drawCall, halt, person } from '../lib/terminal.js';
import {
  G7, G73, harnessLayout, mix7, T7, L7, ACT7, DOC7, TERM7, NET7, CARD7, UNDER7, NAME, harnessBox, toolPlace, shell, exampleNote,
  marker, lookLine, chipGo, mcpServer, SERVER7, mcpCard, TERM73, SERVER73, NET73, API7, API73, githubBoard, serverWire,
  mcpLog, harnessPlug, llmNotes73, NOTE73, prepare74, summaryDoc, sessionBracket, reportSlot, docBar, recordCard,
  resumeCard, terminalLines74, CHIPS74, NOTE74, mapX, mapY, entBox,
} from '../lib/harness.js';
import { text, measure, rr, path, arrowHead, circle } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { focus, ring, ringBox } from '../../../src/kit/cue.js';

// ——— how fast a round goes (6-4's form): the first two on the document as it is, the rest on the summary
const SP = [
  { fly: 0.4, read: 0.55, tok: 0.28, eot: 0.32, step: 0.15, go: 0.4, out: 0.45, work: 0.85, back: 0.4, dur: 0.9 },
  { fly: 0.34, read: 0.45, tok: 0.24, eot: 0.28, step: 0.12, go: 0.34, out: 0.4, work: 0.75, back: 0.36, dur: 0.65 },
];
const QUICK = 1.05; // a round on the summary
const VIS = DOC7.y + DOC7.h - 12; // the lowest the written part may reach before the document scrolls

const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
// n times, evenly from a, the last one landing (after a flight of fly) by b
const times = (n, a, b, fly) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - fly - a)) / Math.max(1, n - 1));
const lerpBox = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
// after the call is written: the harness stops the LLM, passes the command on, the shell runs it, the output
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
  r.done = r.resIn + 0.3;
  return r;
}

export default clip({
  id: 'session',
  title: '記録を残す',
  kicker: 'セッション',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 1.0, // the tool's place widens again; 7-3's lane, socket, card and notes clear away
  script: [
    { id: 'a', lead: 0.3, tail: 2.5, rest: 'short', text: 'ここから、エージェントは、{logs}ログや{code}コードを読み、\n{try}コマンドを試しながら、{cause}原因を探していくわ。' },
    { id: 'b', lead: 0.3, tail: 1.9, text: '{pile}ツール呼び出しと結果が、{one}一本の文書に、\n{more}次々と積もっていくの。' },
    { id: 'c', rest: 'short', text: 'こうして、{conv}一つの会話として続けていくやりとりを、\n{sess}セッションと呼ぶわ。' },
    { id: 'c2', still: true, text: 'ここでは、{goal}原因を突き止めて報告するまでを、\n{one2}一つのセッションとして見ていくわ。' },
    { id: 'd', text: 'この例では、{most}積もった中身の多くを、\n{res}ツールの結果が占めているわね。' },
    { id: 'e', still: true, text: '{file}ファイルの中身や{out}コマンドの出力は、\n{one3}一つで{thou}何千トークンにもなることがあるわ。' },
    { id: 'f', by: 'zunda', text: '途中で{close}ターミナルを閉じたら、どうなるのだ？' },
    { id: 'g', text: '{none}まだ記録を残す仕組みがないと、\n{end}ハーネスのプログラムが終わったとき、\n\n{gone}それまでのやりとりが消えてしまうわ。' },
    { id: 'g2', still: true, tail: 0.3, text: '{what}何を調べたかを、{redo}確かめ直すことになるわね。' },
    { id: 'h', lead: 0.8, tail: 0.5, text: 'そこで、{rec}ハーネスには、{items}会話やツール呼び出し、\nその結果を、{file2}順にファイルへ書き残させましょう。' },
    { id: 'i', lead: 1.2, tail: 0.5, still: true, text: '続けるときは、{from}その記録から、\n{rebuild}LLM に読ませる文書を組み立て直させれば、\n\n{carry}それまでのやりとりを引き継げるわ。' },
    { id: 'j', text: '{cc}[Claude Code|クロードコード] や {cx}[Codex CLI|コーデックスシーエルアイ] も、\n{local}セッションを手元のファイルに残して、\n\n{resume}あとから再開できるようにしているわ。' },
    { id: 'k', text: '記録は、{whatread}エージェントが何を読み、{whatran}何を動かしたかを、\n{human}人があとから確かめるのにも使えるの。' },
    { id: 'l', text: 'ただ、{keep}記録を残しても、\n{short}LLM に読ませる文書が短くなるわけではないわね。' },
  ],

  prepare(ctx) {
    const s = prepare74(ctx);
    const { s73 } = s;
    // the request on the screen: where 原因を突き止めて is (a, c2)
    const Bu = s73.Bu;
    const L = Bu.L;
    const pre = '時間切れの';
    const goal = { x: Bu.x + L.pad + measure(ctx, L.font, pre), y: Bu.y + L.pad + L.size * 0.62 - 11, w: measure(ctx, L.font, '原因を突き止めて'), h: 21 };
    return { ...s, goal };
  },

  draw(ctx, t, s, { at, pace }) {
    const { s73, ents, MAP, rounds, goal } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;

    // ——— the bridge: back to G7; the lane's log, the socket, MCP's card and the notes clear away
    const br = at('a');
    const nar = inOutCubic(seg(t, 0, br));
    const Tb = harnessLayout(mix7(G73, G7, nar));
    const Lx = Tb.L;
    const TERM = lerpBox(TERM73, TERM7, nar);
    const SRV = lerpBox(SERVER73, SERVER7, nar);
    const NET = lerpBox(NET73, NET7, nar);
    const apiX = lerp(API73.x, API7.x, nar);
    const old = 1 - nar;

    // ——— a: two rounds on the document as it is
    const r1 = { sp: SP[0], mark: at('a') + 0.05 };
    const r2 = { sp: SP[1] };
    [r1, r2].forEach((r, k) => {
      const sp = r.sp;
      if (k === 1) r.mark = r1.resIn - 0.1;
      r.read = r.mark + sp.fly - 0.1;
      r.wrote = r.read + sp.read;
      r.open = r.wrote;
      const n = rounds[k].c.toks.length;
      const a0 = r.open + sp.eot - 0.15;
      r.tok = times(n, a0, a0 + sp.dur + sp.tok, sp.tok);
      follow(r);
    });
    const R12 = [r1, r2];
    const landed = (r, j) => t >= r.tok[j] + r.sp.tok;
    // the document scrolls when what comes next would pass its foot
    const scrollAt = rounds.slice(0, 2).flatMap(({ c, R }, k) => [[R12[k].mark, c.band.y + c.band.h], [R12[k].resMark, R.y + R.h]]);
    const scrollY = (tt) => {
      let need = 0;
      let sy = 0;
      scrollAt.forEach(([when, bottom]) => {
        const to = Math.max(need, bottom - VIS);
        if (to > need) sy += (to - need) * inOutCubic(seg(tt, when - 0.5, when - 0.05));
        need = to;
      });
      return sy;
    };
    const sy = scrollY(t);

    // ——— b: the document shown whole (the summary), and three more rounds on it
    const zAt = Math.max(at('one') - lead, r2.done + 0.05);
    const cross = seg(t, zAt, zAt + 0.3);
    const zoom = inOutCubic(seg(t, zAt + 0.1, zAt + 1.0));
    const sy0 = scrollY(zAt);
    const M = zoom >= 1 ? MAP : { sx: lerp(1, MAP.sx, zoom), sy: lerp(1, MAP.sy, zoom), top: lerp(DOC7.y - sy0, MAP.top, zoom) };
    const q0 = Math.max(zAt + 1.25, at('more') - lead - 0.2);
    const quick = [0, 1, 2].map((j) => {
      const st = q0 + j * QUICK;
      return { st, read: st - 0.25, write: st, chipGo: st + 0.42, work: st + 0.7, out: st + 0.82, back: st + 0.78, resIn: st + 1.0 };
    });

    // ——— the record that is not there yet, the program that ends (g); the remedy (h); resuming (i)
    const offG = tw(t, at('end') - lead, 0.5);
    const gone1 = seg(t, at('gone') - lead, at('gone') - lead + 0.6);
    const onH = tw(t, at('h'), 0.5);
    const offI = tw(t, at('i'), 0.4);
    const gone2 = seg(t, at('i') + 0.05, at('i') + 0.45);
    const onI = tw(t, at('i') + 0.65, 0.35);
    const carryOn = tw(t, at('carry') - lead, 0.45);
    const boxOff = offG * (1 - onH) + offI * (1 - onI);
    // h: the session again, written down as it goes; i: the document built again from the record
    const repAt = at('items') - lead;
    const repStep = Math.max(0.12, (at('h.end') + 0.25 - repAt) / (ents.length - 1));
    const replayAt = (k) => (k === 0 ? repAt - 0.35 : repAt + (k - 1) * repStep);
    const rebAt0 = at('rebuild') - lead;
    const rebStep = Math.max(0.1, (at('carry') - lead - 0.25 - rebAt0) / (ents.length - 1));
    const rebuildAt = (k) => (k === 0 ? rebAt0 - 0.3 : rebAt0 + (k - 1) * rebStep);

    // the summary's entries: there from the start (head to the second round), the quick rounds; gone (g); back
    // as the session is replayed (h); gone (i's lead); built again from the record (i)
    const appearA = (k) => (k < 8 ? 1 : tw(t, quick[Math.floor((k - 8) / 2)][k % 2 === 0 ? 'write' : 'resIn'] - 0.05, 0.15));
    const progA = (k) => (k < 8 ? 1 : (k % 2 === 0 ? seg(t, quick[(k - 8) / 2].write, quick[(k - 8) / 2].write + 0.4) : seg(t, quick[(k - 9) / 2].resIn, quick[(k - 9) / 2].resIn + 0.25)));
    const entA = (k) => appearA(k) * (1 - gone1) + tw(t, replayAt(k), 0.18) * (1 - gone2) + tw(t, rebuildAt(k), 0.18);
    const entP = (k) => (t < at('end') ? progA(k) : 1);
    // the record's rows: written as the session is replayed (h)
    const recRows = ents.slice(1).reduce((n, _, k) => n + tw(t, replayAt(k + 1), 0.18), 0);

    // ——— who is at work
    const actGlow = Math.max(
      ...R12.map((r) => Math.max(span(t, r.mark, r.wrote), span(t, r.stop, r.done - 0.2))),
      ...quick.map((q) => Math.max(span(t, q.read - 0.05, q.read + 0.25), span(t, q.chipGo - 0.1, q.chipGo + 0.3), span(t, q.back + 0.15, q.resIn + 0.2))),
      span(t, repAt - 0.4, at('h.end')),
      span(t, rebAt0 - 0.4, at('carry') - lead),
    ) * (1 - boxOff);
    const llmGlow = Math.max(
      ...R12.map((r) => span(t, r.wrote - 0.1, r.stop)),
      ...quick.map((q) => span(t, q.read + 0.15, q.chipGo - 0.05)),
      span(t, at('carry') - lead + 0.2, at('i.end')),
    );
    const writing = R12.some((r) => t >= r.open && t < r.stop) || quick.some((q) => t >= q.write && t < q.chipGo - 0.05);

    // ——— the rings: what the voice points at
    const [causeLit] = lit(['cause'], at('a.end'));
    const [pileLit] = lit(['pile'], at('one'));
    const [goalLit, one2Lit] = lit(['goal', 'one2'], at('c2.end'));
    const [resLit] = lit(['res'], at('d.end'));
    const [fileLit, outLit] = lit(['file', 'out', 'one3', 'thou'], at('e.end'));
    const [closeLit] = lit(['close'], at('f.end'));
    const [fromLit] = lit(['from'], at('rebuild'));
    const [localLit, resumeLit] = lit(['local', 'resume'], at('j.end'));
    const [keepLit, shortLit] = lit(['keep', 'short'], at('l.end'));
    const [file2Lit] = lit(['file2'], at('h.end'));

    // ——— the chat screen: 6-4's report and the request; closed (f, g) and opened again (h, i)
    chatScreen(ctx, T7.SCREEN, 1);
    const bubA = 1 - offG * (1 - onH) - offI * (1 - carryOn);
    chatBubble(ctx, s73.Br, { alpha: bubA });
    chatBubble(ctx, s73.Bu, { alpha: bubA });
    marker(ctx, goal, Math.max(causeLit, goalLit) * bubA);
    screenLinks(ctx, T7, { talk: 1, back: 1, talkHot: false, backHot: false });

    // ——— the LLM, the frame and the channels
    appFrame(ctx, Lx, 1, { name: '' });
    llmBlock(ctx, Lx, 1, { glow: llmGlow });
    const readHot = R12.some((r) => span(t, r.read, r.wrote) > 0.5) || quick.some((q) => span(t, q.read, q.read + 0.3) > 0.5) || span(t, at('carry') - lead + 0.05, at('carry') - lead + 0.8) > 0.5;
    channel(ctx, Lx.read, 1, { hot: readHot });
    channel(ctx, Lx.write, 1, { hot: llmGlow > 0.5 && writing });
    const callHot = R12.some((r) => span(t, r.go, r.work) > 0.5) || quick.some((q) => span(t, q.chipGo, q.work) > 0.5);
    const backHot = R12.some((r) => span(t, r.back, r.back + r.sp.back * 0.6) > 0.5) || quick.some((q) => span(t, q.back, q.resIn) > 0.5);
    channel(ctx, Lx.call, 1, { labelAlpha: 1, hot: callHot });
    channel(ctx, Lx.back, 1, { labelAlpha: 1, hot: backHot });

    // ——— the document as it is (7-3's, then two rounds), until it is shown whole
    const docA = 1 - cross;
    if (docA > 0.001) {
      ctx.save();
      ctx.globalAlpha *= docA;
      if (sy > 0) {
        // a clip changes how the edges are smoothed, so the unscrolled document (7-3's last frame) goes without
        ctx.beginPath();
        ctx.rect(DOC7.x, DOC7.y + 2, DOC7.w, DOC7.h - 4);
        ctx.clip();
        ctx.translate(0, -sy);
      }
      roleMark(ctx, SYS.x, SYS.y + 1, ROLE.system, { edge: WRITER.system });
      s.defs.forEach((d, k) => drawDef(ctx, d, defY(k), 1));
      docEntry(ctx, s.U, 1, { tagAlpha: 0, chars: 1 });
      roleMark(ctx, s.U.x, s.U.y + 1, ROLE.user, { edge: WRITER.user });
      roleMark(ctx, DOC7.x + 18, s.c73.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
      drawCall(ctx, s.c73, { bandA: 1, open: true, n: s.c73.toks.length, end: true });
      roleMark(ctx, s.R73.x, s.R73.y + 1, ROLE.result, { edge: WRITER.result });
      docEntry(ctx, s.R73, 1, { tagAlpha: 0, chars: 1 });
      rounds.slice(0, 2).forEach(({ c, R }, k) => {
        const r = R12[k];
        if (t >= r.mark + r.sp.fly) roleMark(ctx, DOC7.x + 18, c.band.y + 1, ROLE.assistant, { edge: WRITER.assistant });
        drawCall(ctx, c, { bandA: tw(t, r.open + r.sp.eot - 0.1, 0.25), open: t >= r.open + r.sp.eot, n: c.toks.reduce((n, _, j) => (landed(r, j) ? j + 1 : n), 0), end: t >= r.fin + r.sp.eot });
        if (t >= r.resMark + r.sp.fly) roleMark(ctx, R.x, R.y + 1, ROLE.result, { edge: WRITER.result });
        const oi = tw(t, r.resIn - 0.05, 0.3);
        if (oi > 0) docEntry(ctx, R, oi, { tagAlpha: 0, chars: seg(t, r.resIn, r.resIn + 0.4) });
      });
      // b: the calls and the results that pile up
      const c2b = rounds[1].c.band;
      ringBox(ctx, [{ x: c2b.x, y: c2b.y, w: c2b.w, h: c2b.h }, { x: rounds[1].R.tx, y: rounds[1].R.y, w: rounds[1].R.w, h: rounds[1].R.h }], pileLit, C.accent, 4);
      ctx.restore();
      // the top of the paper, where the scrolled part goes on
      if (sy > 0.5) {
        const g = ctx.createLinearGradient(0, DOC7.y, 0, DOC7.y + 30);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.globalAlpha = clamp(sy / 30) * docA;
        ctx.fillStyle = g;
        ctx.fillRect(DOC7.x + 4, DOC7.y + 2, DOC7.w - 8, 30);
        ctx.restore();
      }
      // the reads: the harness hands the document over
      R12.forEach((r, k) => {
        sweep(ctx, L7, seg(t, r.read + 0.05, r.read + r.sp.read), rounds[k].c.band.y - sy + MARK_H);
        send(ctx, L7.read, seg(t, r.read + 0.25, r.read + r.sp.read + 0.05), '', 'doc');
      });
    }

    // ——— the document shown whole: the summary
    const dimRest = lerp(1, cue.dim, resLit);
    if (cross > 0.001) {
      ctx.save();
      ctx.globalAlpha *= cross;
      // (only while it zooms out: what goes past the paper then is cut; once it fits, nothing is)
      if (zoom < 1) {
        ctx.beginPath();
        ctx.rect(DOC7.x, DOC7.y + 2, DOC7.w, DOC7.h - 4);
        ctx.clip();
      }
      summaryDoc(ctx, ents, M, { alpha: (k) => entA(k) * (ents[k].kind === 'result' ? 1 : dimRest), prog: entP });
      ctx.restore();
    }
    // the quick rounds' reads
    quick.forEach((q) => {
      sweep(ctx, L7, seg(t, q.read, q.read + 0.3), mapY(MAP, ents[8 + quick.indexOf(q) * 2].y0));
      send(ctx, L7.read, seg(t, q.read + 0.05, q.read + 0.35), '', 'doc');
    });
    // g: what is gone; g2: what was looked at, and has to be checked again
    const lostA = pop('gone') * (1 - onH);
    if (lostA > 0.001) {
      ctx.save();
      ctx.globalAlpha *= lostA;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([9, 6]);
      rr(ctx, DOC7.x + 8, MAP.top - 2, mapX(MAP, DOC7.x + DOC7.w) - DOC7.x - 4, mapY(MAP, s.end) - MAP.top + 10, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      tag(ctx, mapX(MAP, DOC7.x + DOC7.w) + 12, MAP.top - 4, '消えた', { font: F.jp(700, 15), h: 30, padX: 11, fill: C.red, color: '#fff', alpha: lostA });
    }
    const ghostA = pop('what') * (1 - onH);
    if (ghostA > 0.001) {
      summaryDoc(ctx, ents, MAP, { ghost: true, alpha: () => ghostA });
      ents.forEach((e, k) => {
        if (e.kind !== 'call') return;
        const b = entBox(MAP, e);
        tag(ctx, mapX(MAP, DOC7.x + DOC7.w) + 14, b.y + b.h / 2 - 12, '？', { font: F.jp(700, 14), h: 24, padX: 8, fill: C.paper, stroke: C.muted, color: C.muted, alpha: ghostA });
      });
    }
    const redoA = pop('redo') * (1 - onH);
    if (redoA > 0.001) {
      const yb = mapY(MAP, s.end) + 8;
      tag(ctx, mapX(MAP, DOC7.x + DOC7.w) + 10, yb, '確かめ直す', { font: F.jp(700, 14), h: 28, padX: 10, fill: C.accent, color: '#fff', alpha: redoA });
    }

    // ——— the session's bracket (c, c2); gone while the bar is read (d); back once the exchange carries over (i)
    const brA = (1 - tw(t, at('d'), 0.4)) + carryOn;
    if (brA > 0.001) {
      ctx.save();
      ctx.globalAlpha *= clamp(brA);
      const p = t < at('d') ? seg(t, at('conv') - lead, at('conv') - lead + 0.7) : 1;
      const tagA = t < at('d') ? pop('sess') : 1;
      const tailA = t < at('d') ? tw(t, at('goal') - lead + 0.2, 0.6) : 1;
      if (t < at('d')) reportSlot(ctx, s, tailA);
      const sb = sessionBracket(ctx, s, { p, tag: tagA, tail: tailA });
      ctx.restore();
      if (one2Lit > 0.001) {
        const b = { x: DOC7.x + 10, y: mapY(MAP, s.U.y) - 4, w: sb.tag.x + sb.tag.w - DOC7.x - 10, h: mapY(MAP, s.end) + 40 - mapY(MAP, s.U.y) };
        ringBox(ctx, b, one2Lit, C.accent, 6);
      }
    }
    // e: a single result can take thousands of tokens
    [[7, '約 3,900 トークン', 'file', fileLit], [11, '約 2,700 トークン', 'out', outLit]].forEach(([k, s0, anc, lv]) => {
      const a = pop(anc) * (1 - gone1);
      if (a <= 0.001) return;
      const b = entBox(MAP, ents[k]);
      const R = ents[k].R;
      const bx = mapX(MAP, R.tx + R.w);
      const y = b.y + b.h / 2;
      const tx = mapX(MAP, DOC7.x + DOC7.w) + 14;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      path(ctx, [[bx + 3, y], [tx - 2, y]]);
      ctx.restore();
      tag(ctx, tx, y - 13, s0, { font: F.jp(700, 13), h: 26, padX: 9, fill: C.green, color: '#fff', alpha: a });
      ringBox(ctx, { x: mapX(MAP, R.tx), y: mapY(MAP, R.y), w: R.w * MAP.sx, h: R.h * MAP.sy }, lv * a, C.accent, 3);
    });

    // the harness's box (grey while its program has ended), its loop
    harnessBox(ctx, ACT7, 1, { glow: actGlow, names: [['アプリ', 0, 26], [NAME, 1, 0]] });
    if (boxOff > 0.001) {
      ctx.save();
      ctx.filter = 'grayscale(1)';
      harnessBox(ctx, ACT7, boxOff, { glow: 0, names: [['アプリ', 0, 26], [NAME, 1, 0]] });
      ctx.restore();
    }
    const LP = T7.LOOP;
    loopIcon(ctx, LP.x, LP.y, LP.r, 1 - boxOff, { p: 1 });
    text(ctx, 'くり返す', LP.x - LP.r - 14, LP.y + 6, { font: F.jp(700, 16), color: C.purple, align: 'right', alpha: 1 - boxOff });
    if (boxOff > 0.001) {
      loopIcon(ctx, LP.x, LP.y, LP.r, boxOff, { p: 1, color: C.muted });
      text(ctx, 'くり返す', LP.x - LP.r - 14, LP.y + 6, { font: F.jp(700, 16), color: C.muted, align: 'right', alpha: boxOff });
      tag(ctx, ACT7.x + ACT7.w - 12, ACT7.y - 14, 'プログラムが終了', { font: F.jp(700, 14), h: 28, padX: 10, fill: C.ink, color: C.paper, align: 'right', alpha: boxOff });
    }
    // the harness sees where each call ends, and stops the writing
    R12.forEach((r, k) => {
      const lk = span(t, r.stop - 0.05, r.go + 0.2);
      const e = rounds[k].c.end;
      if (lk > 0 && cross < 1) lookLine(ctx, DOC7, ACT7, { x: e.x, y: e.y - sy, w: e.w }, tw(t, r.stop - 0.05, 0.3, inOutCubic), lk);
    });
    halt(ctx, Math.max(...R12.map((r) => span(t, r.fin + r.sp.eot - 0.05, r.go + 0.35))));

    // ——— the tool's place (the shell wide again, and the GitHub MCP server); GitHub in the net beyond
    const work = (k) => (k < 2 ? R12[k].work : quick[k - 2].work);
    const out = (k) => (k < 2 ? R12[k].outAt : quick[k - 2].out);
    toolPlace(ctx, Lx, 1, {
      draw: (cx) => {
        shell(cx, t, 1, terminalLines74(work, out), { trim: true, box: TERM });
        mcpServer(cx, SRV, 1);
      },
    });
    githubBoard(ctx, NET, 1, { narrow: old, scroll: 1, found: old });
    serverWire(ctx, SRV, apiX, 1, 1);
    harnessPlug(ctx, old);
    mcpLog(ctx, { a: old, rows: [1, 1, 1, 1] });
    llmNotes73(ctx, [old, old, old]);
    mcpCard(ctx, { a: old, name: 1, abbr: 1, rows: [1, 1], note: 1, years: [1, 1], plugColor: C.ink });

    // ——— above the LLM: the record — not there yet (g); written as the session goes (h); read back (i); what the
    // agent read and ran (k)
    const slotA = pop('none') * (1 - pop('rec'));
    const cardA = pop('rec');
    const readA = pop('whatread') * (1 - tw(t, at('l'), 0.4));
    const ranA = pop('whatran') * (1 - tw(t, at('l'), 0.4));
    const rowLit = (k) => span(t, rebuildAt(k + 1) - 0.1, rebuildAt(k + 1) + 0.15, 0.1, 0.25);
    const rec = recordCard(ctx, { slot: slotA, a: cardA, rows: t < at('h') ? 0 : recRows, lit: rowLit, read: readA, ran: ranA });
    // ——— under the LLM: what the document holds (d, e), the commands that resume (j)
    // (dim while the document it tells of is gone: g to h, and i until it is built again)
    const docGone = gone1 * (1 - tw(t, replayAt(ents.length - 1), 0.4)) + gone2 * (1 - tw(t, rebuildAt(ents.length - 1), 0.4));
    const bar = docBar(ctx, {
      a: lerp(1, 0.3, docGone),
      frame: tw(t, at('d'), 0.5),
      fill: inOutCubic(seg(t, at('most') - lead, at('most') - lead + 0.8)),
      names: tw(t, at('most') - lead + 0.3, pace.enter),
      nums: pop('thou'),
      lit: [0, 0, resLit],
    });
    const chips = resumeCard(ctx, { a: pop('cc'), cc: pop('cc'), cx: pop('cx'), note: tw(t, at('local') - lead + 0.3, pace.enter) });
    if (chips.length) ringBox(ctx, [...chips, { x: UNDER7.x, y: chips[0].y, w: 1, h: 1 }], resumeLit, C.accent, 5);
    ring(ctx, CARD7.x, CARD7.y, CARD7.w, CARD7.h, Math.max(file2Lit, fromLit, localLit, keepLit), C.accent, 14);
    if (bar) ringBox(ctx, bar.all, shortLit, C.accent, 6);
    if (shortLit > 0.001) {
      const b = { x: DOC7.x + 10, y: MAP.top, w: mapX(MAP, DOC7.x + DOC7.w) - DOC7.x - 6, h: mapY(MAP, s.end) - MAP.top + 6 };
      ringBox(ctx, b, shortLit, C.accent, 4);
    }
    // h: the harness writes the record; i: it reads it back
    const wire = [[ACT7.x + 34, ACT7.y], [ACT7.x + 34, CARD7.y + 34], [CARD7.x + CARD7.w + 4, CARD7.y + 34]];
    recordWire(ctx, wire, seg(t, at('rec') - lead, at('rec') - lead + 0.6), (1 - tw(t, at('h.end'), 0.4)), '書き残す');
    recordWire(ctx, [...wire].reverse().map(([x, y], i) => (i === 0 ? [x + 4, y] : [x, y])), seg(t, at('from') - lead, at('from') - lead + 0.6), (1 - tw(t, at('carry'), 0.4)), '読み込む');
    // k: a person checks it later
    const hu = pop('human') * (1 - tw(t, at('l'), 0.4));
    if (hu > 0.001) {
      const px = CARD7.x + CARD7.w + 34;
      const py = CARD7.y + 28;
      ctx.save();
      ctx.globalAlpha *= hu;
      circle(ctx, px, py, 16);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      person(ctx, px, py, C.blue);
      ctx.restore();
      text(ctx, '人が、あとから確かめる', px + 26, py + 6, { font: F.jp(700, 15), color: C.blue, alpha: hu });
    }

    // ——— f: closing the terminal
    const xA = pop('close') * (1 - onH);
    if (xA > 0.001) {
      const S = T7.SCREEN;
      const bx = S.x + S.w - 32;
      const by = S.y + 33;
      ctx.save();
      ctx.globalAlpha *= xA;
      circle(ctx, bx, by, 13);
      ctx.fillStyle = offG > 0.5 ? C.ink : '#fff';
      ctx.fill();
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = offG > 0.5 ? '#fff' : C.ink2;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx - 5, by - 5);
      ctx.lineTo(bx + 5, by + 5);
      ctx.moveTo(bx + 5, by - 5);
      ctx.lineTo(bx - 5, by + 5);
      ctx.stroke();
      ctx.restore();
      ring(ctx, bx - 13, by - 13, 26, 26, closeLit, C.accent, 13);
      const qa = pop('close') * (1 - tw(t, at('g'), 0.4));
      tag(ctx, bx - 22, by - 14, '？', { font: F.jp(700, 16), h: 28, padX: 9, fill: C.accent, color: '#fff', r: 14, align: 'right', alpha: qa });
    }

    // ——— in flight, over everything (the first two rounds)
    rounds.slice(0, 2).forEach(({ c, R }, k) => {
      const r = R12[k];
      const sp = r.sp;
      flyMark(ctx, T7, { x: DOC7.x + 18, y: c.band.y }, seg(t, r.mark, r.mark + sp.fly), ROLE.assistant, { edge: WRITER.assistant, dy: -sy });
      const lane = { y: c.band.y, h: c.band.h };
      const po = seg(t, r.open, r.open + sp.eot);
      if (po > 0 && po < 1) {
        const pt = onPath(writePath(T7, lane, c.open.x + c.open.w / 2, c.open.y + MARK_H / 2, -sy), inOutCubic(po));
        roleMark(ctx, pt.x - c.open.w / 2, pt.y - MARK_H / 2, ROLE.call, { edge: WRITER.call, alpha: clamp(po * 8) });
      }
      c.toks.forEach((tk, j) => {
        const p = seg(t, r.tok[j], r.tok[j] + sp.tok);
        if (p <= 0 || p >= 1) return;
        const w = measure(ctx, TOKEN.font, tk.s) + TOKEN.padX * 2;
        const pt = onPath(writePath(T7, lane, tk.x + tk.w / 2, tk.y, -sy), inOutCubic(p));
        token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, tk.s, clamp(p * 8) * clamp((1 - p) * 8));
      });
      const pe = seg(t, r.fin, r.fin + sp.eot);
      if (pe > 0 && pe < 1) {
        const pt = onPath(writePath(T7, lane, c.end.x + c.end.w / 2, c.end.y + MARK_H / 2, -sy), inOutCubic(pe));
        roleMark(ctx, pt.x - c.end.w / 2, pt.y - MARK_H / 2, ROLE.callEnd, { edge: WRITER.callEnd, alpha: clamp(pe * 8) });
      }
      const band = { tx: c.band.x, w: c.band.w, y: c.band.y, h: c.band.h };
      chipGo(ctx, seg(t, r.go, r.go + sp.go), toTool(T7, band, -sy), CHIPS74[k], 'call');
      const bp = seg(t, r.back, r.back + sp.back);
      chipGo(ctx, bp < 1 ? bp : 0.999, fromTool(T7, R, -sy, R.tx + 120), '出力', 'found', bp < 1 ? null : 1 - tw(t, r.resIn - 0.05, 0.25));
      flyMark(ctx, T7, R, seg(t, r.resMark, r.resMark + sp.fly), ROLE.result, { edge: WRITER.result, dy: -sy });
    });
    // the quick rounds: the command goes to the shell and the output comes back, from and to the summary
    quick.forEach((q, j) => {
      const c = ents[8 + j * 2];
      const R = ents[9 + j * 2];
      const cb = entBox(MAP, c);
      const rb = entBox(MAP, R);
      const from = [[mapX(MAP, c.c.band.x + c.c.band.w) - 30, cb.y + cb.h / 2], [T7.lane, cb.y + cb.h / 2], [T7.lane, L7.call.y], [L7.call.x2, L7.call.y], [L7.tool.x, L7.call.y]];
      chipGo(ctx, seg(t, q.chipGo, q.chipGo + 0.3), from, CHIPS74[j + 2], 'call');
      const back = [[L7.tool.x, L7.back.y], [L7.back.x2, L7.back.y], [T7.lane, L7.back.y], [T7.lane, rb.y + rb.h / 2], [mapX(MAP, R.R.tx) + 60, rb.y + rb.h / 2]];
      chipGo(ctx, seg(t, q.back, q.resIn), back, '出力', 'found');
    });

    // ——— the example's note (7-3's gives way)
    exampleNote(ctx, L7, '', 0, 1);
    const exX = L7.app.x + measure(ctx, F.jp(700, 17), '例') + 20 + 10;
    const exY = L7.app.y + L7.app.h + 22 + 21;
    const nf = F.jp(400, 17);
    text(ctx, NOTE73, exX, exY, { font: nf, color: C.muted, alpha: 1 - seg(nar, 0, 0.5) });
    text(ctx, NOTE74, exX, exY, { font: nf, color: C.muted, alpha: seg(nar, 0.5, 1) });
  },
});

// The harness and its record: a purple line (drawn up to p) with the arrow at its end, and what it does there.
function recordWire(ctx, pts, p, a, label) {
  if (p <= 0 || a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.strokeStyle = ctx.fillStyle = C.purple;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  path(ctx, pts, p);
  if (p > 0.97) {
    const [x1, y1] = pts[pts.length - 1];
    const [x0, y0] = pts[pts.length - 2];
    arrowHead(ctx, x1, y1, Math.atan2(y1 - y0, x1 - x0), 11);
  }
  ctx.restore();
  const [ax, ay] = pts[1];
  text(ctx, label, (ax + Math.min(pts[0][0], pts[2][0], ax)) / 2 + 40, ay - 10, { font: F.jp(700, 15), color: C.purple, alpha: a * clamp(p * 2 - 1) });
}
