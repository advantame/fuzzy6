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
// A retained clip (docs/stage.md; the immediate one it replaced, pixel for pixel, is clips/legacy/session.js).
// It starts from 7-3's last picture (from: mcpflow): the scene says how that picture changes, and the bridge moves
// one into the other — the tool's place back to G7 (the shell wide again), the lane's log, the harness's socket,
// MCP's card and the notes under the LLM gone, 7-3's note giving way to 7-4's. The first two rounds run on the
// document as it is (6-4's fast rounds); then the document is shown whole, as a summary (lib/harness.js
// summaryDoc), and stays so. Everything in the session is an example: the commands and their output (none of it
// tells the cause yet, research/harness-jobs-facts 7-4), the tokens (o200k_base), the amounts on the bar, the
// record (its form and its name, not any product's file). The record is drawn apart from the document: what the
// harness writes down is not the document it has the LLM read. Resuming brings back the exchange, not the
// programs that had stopped (the shell, the server): nothing in the tool's place is drawn coming back. 7-4 ends
// on lib/harness.js final74 (7-5's first frame).

import { stage } from '../lib/stage.js';
import * as K from '../lib/kinds.js';
import mcpflow from './mcpflow.js';
import { C, F } from '../lib/theme.js';
import { toTool, fromTool, writePath, onPath, MARK_H, TOKEN } from '../lib/rig.js';
import { person } from '../lib/terminal.js';
import {
  G7, T7, L7, ACT7, DOC7, TERM7, NET7, CARD7, UNDER7, NAME, SERVER7, API7, prepare74, CHIPS74, NOTE74, mapX, mapY,
  entBox, terminalLines74,
} from '../lib/harness.js';
import { text, rr, path, arrowHead, circle, measure as measureOn } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic } from '../../../src/kit/ease.js';
import { ringBox } from '../../../src/kit/cue.js';

// ——— how fast a round goes (6-4's form): the first two on the document as it is, the rest on the summary
const SP = [
  { fly: 0.4, read: 0.55, tok: 0.28, eot: 0.32, step: 0.15, go: 0.4, out: 0.45, work: 0.85, back: 0.4, dur: 0.9 },
  { fly: 0.34, read: 0.45, tok: 0.24, eot: 0.28, step: 0.12, go: 0.34, out: 0.4, work: 0.75, back: 0.36, dur: 0.65 },
];
const QUICK = 1.05; // a round on the summary
const VIS = DOC7.y + DOC7.h - 12; // the lowest the written part may reach before the document scrolls

// n times, evenly from a, the last one landing (after a flight of fly) by b
const times = (n, a, b, fly) => Array.from({ length: n }, (_, k) => a + (k * Math.max(0, b - fly - a)) / Math.max(1, n - 1));
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

export default stage({
  id: 'session',
  title: '記録を残す',
  kicker: 'セッション',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 1.0, // the tool's place widens again; 7-3's lane, socket, card and notes clear away
  from: mcpflow,
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
    // the request on the screen: where 原因を突き止めて is (a, c2)
    const Bu = s.s73.Bu;
    const L = Bu.L;
    const goal = { x: Bu.x + L.pad + measureOn(ctx, L.font, '時間切れの'), y: Bu.y + L.pad + L.size * 0.62 - 11, w: measureOn(ctx, L.font, '原因を突き止めて'), h: 21 };
    return { ...s, goal };
  },

  scene(w, f) {
    const { t, at, pace, cue, lead, pop, lit, span, s } = f;
    const { ents, MAP, rounds, goal } = s;

    // ——— 7-3's picture becomes 7-4's: the shell wide again; the lane's log, the socket, MCP's card and the notes
    // under the LLM go; 7-3's note gives way to 7-4's (the bridge moves all of it)
    w.vars.G = G7;
    w.set('github', { box: NET7, narrow: 0, found: 0 });
    w.set('wire', { srv: SERVER7, x: API7.x });
    w.drop('plug', 'log', 'notes', 'mcpcard');
    w.set('note.text', { s: NOTE74 });

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
      ...R12.map((r) => Math.max(span(r.mark, r.wrote), span(r.stop, r.done - 0.2))),
      ...quick.map((q) => Math.max(span(q.read - 0.05, q.read + 0.25), span(q.chipGo - 0.1, q.chipGo + 0.3), span(q.back + 0.15, q.resIn + 0.2))),
      span(repAt - 0.4, at('h.end')),
      span(rebAt0 - 0.4, at('carry') - lead),
    ) * (1 - boxOff);
    const llmGlow = Math.max(
      ...R12.map((r) => span(r.wrote - 0.1, r.stop)),
      ...quick.map((q) => span(q.read + 0.15, q.chipGo - 0.05)),
      span(at('carry') - lead + 0.2, at('i.end')),
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
    const bubA = 1 - offG * (1 - onH) - offI * (1 - carryOn);
    w.set('bubble.report', { a: bubA });
    w.set('bubble.ask', { a: bubA });
    w.add('goal', K.marker, { b: goal, a: Math.max(causeLit, goalLit) * bubA }, { after: 'bubble.ask' });

    // ——— the LLM and the channels
    w.set('llm', { glow: llmGlow });
    const readHot = R12.some((r) => span(r.read, r.wrote) > 0.5) || quick.some((q) => span(q.read, q.read + 0.3) > 0.5) || span(at('carry') - lead + 0.05, at('carry') - lead + 0.8) > 0.5;
    w.set('ch.read', { hot: readHot });
    w.set('ch.write', { hot: llmGlow > 0.5 && writing });
    w.set('ch.call', { hot: R12.some((r) => span(r.go, r.work) > 0.5) || quick.some((q) => span(q.chipGo, q.work) > 0.5) });
    w.set('ch.back', { hot: R12.some((r) => span(r.back, r.back + r.sp.back * 0.6) > 0.5) || quick.some((q) => span(q.back, q.resIn) > 0.5) });

    // ——— the document as it is (7-3's, then two rounds), scrolled as it grows, until it is shown whole
    const docA = 1 - cross;
    // (a clip changes how the edges are smoothed, so the unscrolled document — 7-3's last frame — goes without)
    w.set('doc', { a: docA, clip: sy > 0 ? { x: DOC7.x, y: DOC7.y + 2, w: DOC7.w, h: DOC7.h - 4 } : null, dy: -sy });
    const D = { in: 'doc' };
    rounds.slice(0, 2).forEach(({ c, R }, k) => {
      const r = R12[k];
      const n = k + 1;
      if (t >= r.mark + r.sp.fly) w.add(`doc.call.${n}.mark`, K.mark, { x: DOC7.x + 18, y: c.band.y + 1, role: 'assistant' }, D);
      w.add(`doc.call.${n}`, K.call, { c, o: { bandA: tw(t, r.open + r.sp.eot - 0.1, 0.25), open: t >= r.open + r.sp.eot, n: c.toks.reduce((m, _, j) => (landed(r, j) ? j + 1 : m), 0), end: t >= r.fin + r.sp.eot } }, D);
      if (t >= r.resMark + r.sp.fly) w.add(`doc.res.${n}.mark`, K.mark, { x: R.x, y: R.y + 1, role: 'result' }, D);
      const oi = tw(t, r.resIn - 0.05, 0.3);
      if (oi > 0) w.add(`doc.res.${n}`, K.entry, { E: R, o: { tagAlpha: 0, chars: seg(t, r.resIn, r.resIn + 0.4) }, a: oi }, D);
    });
    // b: the calls and the results that pile up
    const c2b = rounds[1].c.band;
    w.add('ring.pile', K.ringBox, { b: [{ x: c2b.x, y: c2b.y, w: c2b.w, h: c2b.h }, { x: rounds[1].R.tx, y: rounds[1].R.y, w: rounds[1].R.w, h: rounds[1].R.h }], level: pileLit, pad: 4 }, D);

    // the rest goes over the document, under the harness's box
    const UNDER = { before: 'harness' };
    if (docA > 0.001) {
      // the top of the paper, where the scrolled part goes on (it follows the scroll, which begins in the bridge:
      // the bridge does not fade it in)
      if (sy > 0.5) w.add('doc.top', paperTop, { a: clamp(sy / 30) * docA }, { ...UNDER, bridge: 'now' });
      // the reads: the harness hands the document over
      R12.forEach((r, k) => {
        w.add(`read.${k + 1}`, K.sweepDoc, { p: seg(t, r.read + 0.05, r.read + r.sp.read), bottom: rounds[k].c.band.y - sy + MARK_H }, UNDER);
        w.add(`send.${k + 1}`, K.sendDoc, { p: seg(t, r.read + 0.25, r.read + r.sp.read + 0.05) }, UNDER);
      });
    }

    // ——— the document shown whole: the summary
    const dimRest = lerp(1, cue.dim, resLit);
    w.group('summary', { a: cross, clip: zoom < 1 ? { x: DOC7.x, y: DOC7.y + 2, w: DOC7.w, h: DOC7.h - 4 } : null }, UNDER);
    w.add('summary.doc', K.summary, { ents, M, alpha: ents.map((e, k) => entA(k) * (e.kind === 'result' ? 1 : dimRest)), prog: ents.map((_, k) => entP(k)) }, { in: 'summary' });
    // the quick rounds' reads
    quick.forEach((q, j) => {
      w.add(`read.q${j}`, K.sweepDoc, { p: seg(t, q.read, q.read + 0.3), bottom: mapY(MAP, ents[8 + j * 2].y0) }, UNDER);
      w.add(`send.q${j}`, K.sendDoc, { p: seg(t, q.read + 0.05, q.read + 0.35) }, UNDER);
    });
    // g: what is gone; g2: what was looked at, and has to be checked again
    const right = mapX(MAP, DOC7.x + DOC7.w);
    const lostA = pop('gone') * (1 - onH);
    if (lostA > 0.001) {
      w.add('lost', lost, { box: { x: DOC7.x + 8, y: MAP.top - 2, w: right - DOC7.x - 4, h: mapY(MAP, s.end) - MAP.top + 10 }, a: lostA }, UNDER);
      w.add('lost.tag', K.tag, { x: right + 12, y: MAP.top - 4, s: '消えた', o: { font: F.jp(700, 15), h: 30, padX: 11, fill: C.red, color: '#fff' }, a: lostA }, UNDER);
    }
    const ghostA = pop('what') * (1 - onH);
    if (ghostA > 0.001) {
      w.add('ghost', K.summary, { ents, M: MAP, ghost: true, alpha: ents.map(() => ghostA) }, UNDER);
      ents.forEach((e, k) => {
        if (e.kind !== 'call') return;
        const b = entBox(MAP, e);
        w.add(`ghost.q${k}`, K.tag, { x: right + 14, y: b.y + b.h / 2 - 12, s: '？', o: { font: F.jp(700, 14), h: 24, padX: 8, fill: C.paper, stroke: C.muted, color: C.muted }, a: ghostA }, UNDER);
      });
    }
    const redoA = pop('redo') * (1 - onH);
    if (redoA > 0.001) w.add('redo', K.tag, { x: right + 10, y: mapY(MAP, s.end) + 8, s: '確かめ直す', o: { font: F.jp(700, 14), h: 28, padX: 10, fill: C.accent, color: '#fff' }, a: redoA }, UNDER);

    // ——— the session's bracket (c, c2); gone while the bar is read (d); back once the exchange carries over (i)
    const brA = (1 - tw(t, at('d'), 0.4)) + carryOn;
    if (brA > 0.001) {
      const p = t < at('d') ? seg(t, at('conv') - lead, at('conv') - lead + 0.7) : 1;
      const tagA = t < at('d') ? pop('sess') : 1;
      const tailA = t < at('d') ? tw(t, at('goal') - lead + 0.2, 0.6) : 1;
      w.group('session', { a: clamp(brA) }, UNDER);
      if (t < at('d')) w.add('report.slot', K.slot, { s, a: tailA }, { in: 'session' });
      w.add('bracket', K.bracket, { s, p, tag: tagA, tail: tailA }, { in: 'session' });
      if (one2Lit > 0.001) w.add('ring.session', sessionRing, { s, level: one2Lit }, UNDER);
    }
    // e: a single result can take thousands of tokens
    [[7, '約 3,900 トークン', 'file', fileLit], [11, '約 2,700 トークン', 'out', outLit]].forEach(([k, s0, anc, lv]) => {
      const a = pop(anc) * (1 - gone1);
      if (a <= 0.001) return;
      const b = entBox(MAP, ents[k]);
      const R = ents[k].R;
      const y = b.y + b.h / 2;
      const tx = right + 14;
      w.add(`size.${k}.line`, leader, { pts: [[mapX(MAP, R.tx + R.w) + 3, y], [tx - 2, y]], a }, UNDER);
      w.add(`size.${k}`, K.tag, { x: tx, y: y - 13, s: s0, o: { font: F.jp(700, 13), h: 26, padX: 9, fill: C.green, color: '#fff' }, a }, UNDER);
      w.add(`size.${k}.ring`, K.ringBox, { b: { x: mapX(MAP, R.tx), y: mapY(MAP, R.y), w: R.w * MAP.sx, h: R.h * MAP.sy }, level: lv * a, pad: 3 }, UNDER);
    });

    // the harness's box (grey while its program has ended), its loop
    w.set('harness', { glow: actGlow });
    if (boxOff > 0.001) {
      w.group('harness.ended', { filter: 'grayscale(1)' }, { after: 'harness' });
      w.add('harness.grey', K.harness, { glow: 0, names: [['アプリ', 0, 26], [NAME, 1, 0]], a: boxOff }, { in: 'harness.ended' });
    }
    w.set('loop', { a: 1 - boxOff });
    w.set('loop.label', { a: 1 - boxOff });
    if (boxOff > 0.001) {
      const LP = T7.LOOP;
      w.add('loop.grey', K.loop, { color: C.muted, a: boxOff }, { after: 'loop.label' });
      w.add('loop.label.grey', K.text, { s: 'くり返す', x: LP.x - LP.r - 14, y: LP.y + 6, o: { font: F.jp(700, 16), color: C.muted, align: 'right' }, a: boxOff }, { after: 'loop.grey' });
      w.add('ended', K.tag, { x: ACT7.x + ACT7.w - 12, y: ACT7.y - 14, s: 'プログラムが終了', o: { font: F.jp(700, 14), h: 28, padX: 10, fill: C.ink, color: C.paper, align: 'right' }, a: boxOff }, { after: 'loop.label.grey' });
    }
    // the harness sees where each call ends, and stops the writing
    const OVER = { before: 'tools' };
    R12.forEach((r, k) => {
      const lk = span(r.stop - 0.05, r.go + 0.2);
      const e = rounds[k].c.end;
      if (lk > 0 && cross < 1) w.add(`look.${k + 1}`, K.look, { m: { x: e.x, y: e.y - sy, w: e.w }, p: tw(t, r.stop - 0.05, 0.3, inOutCubic), a: lk }, OVER);
    });
    w.add('halt', K.halt, { a: Math.max(...R12.map((r) => span(r.fin + r.sp.eot - 0.05, r.go + 0.35))) }, OVER);

    // ——— the tool's place: the shell wide again, with the five rounds' commands
    const work = (k) => (k < 2 ? R12[k].work : quick[k - 2].work);
    const out = (k) => (k < 2 ? R12[k].outAt : quick[k - 2].out);
    w.set('tools', { lines: terminalLines74(work, out), term: TERM7, srv: SERVER7 }, { bridge: 'now' });

    // ——— above the LLM: the record — not there yet (g); written as the session goes (h); read back (i); what the
    // agent read and ran (k)
    const NOTE = { before: 'note.mark' };
    const slotA = pop('none') * (1 - pop('rec'));
    const readA = pop('whatread') * (1 - tw(t, at('l'), 0.4));
    const ranA = pop('whatran') * (1 - tw(t, at('l'), 0.4));
    const rowLit = (k) => span(rebuildAt(k + 1) - 0.1, rebuildAt(k + 1) + 0.15, 0.1, 0.25);
    w.add('record', K.record, { slot: slotA, rows: t < at('h') ? 0 : recRows, lit: ents.slice(1).map((_, k) => rowLit(k)), read: readA, ran: ranA, a: pop('rec') }, NOTE);
    // ——— under the LLM: what the document holds (d, e), the commands that resume (j)
    // (dim while the document it tells of is gone: g to h, and i until it is built again)
    const docGone = gone1 * (1 - tw(t, replayAt(ents.length - 1), 0.4)) + gone2 * (1 - tw(t, rebuildAt(ents.length - 1), 0.4));
    const barA = lerp(1, 0.3, docGone);
    const frameA = tw(t, at('d'), 0.5);
    w.add('bar', K.bar, { frame: frameA, fill: inOutCubic(seg(t, at('most') - lead, at('most') - lead + 0.8)), names: tw(t, at('most') - lead + 0.3, pace.enter), nums: pop('thou'), lit: [0, 0, resLit], a: barA }, NOTE);
    const ccA = pop('cc');
    w.add('resume', K.resume, { cc: ccA, cx: pop('cx'), note: tw(t, at('local') - lead + 0.3, pace.enter), a: ccA }, NOTE);
    if (ccA > 0.001) w.add('ring.resume', resumeRing, { level: resumeLit }, NOTE);
    w.add('ring.record', K.ring, { x: CARD7.x, y: CARD7.y, w: CARD7.w, h: CARD7.h, level: Math.max(file2Lit, fromLit, localLit, keepLit), r: 14 }, NOTE);
    if (frameA * barA > 0.001) w.add('ring.bar', K.ringBox, { b: 'bar:all', level: shortLit, pad: 6 }, NOTE);
    if (shortLit > 0.001) w.add('ring.summary', K.ringBox, { b: { x: DOC7.x + 10, y: MAP.top, w: right - DOC7.x - 6, h: mapY(MAP, s.end) - MAP.top + 6 }, level: shortLit, pad: 4 }, NOTE);
    // h: the harness writes the record; i: it reads it back
    const wire = [[ACT7.x + 34, ACT7.y], [ACT7.x + 34, CARD7.y + 34], [CARD7.x + CARD7.w + 4, CARD7.y + 34]];
    w.add('wire.write', recordWire, { pts: wire, p: seg(t, at('rec') - lead, at('rec') - lead + 0.6), label: '書き残す', a: 1 - tw(t, at('h.end'), 0.4) }, NOTE);
    w.add('wire.read', recordWire, { pts: [...wire].reverse().map(([x, y], i) => (i === 0 ? [x + 4, y] : [x, y])), p: seg(t, at('from') - lead, at('from') - lead + 0.6), label: '読み込む', a: 1 - tw(t, at('carry'), 0.4) }, NOTE);
    // k: a person checks it later
    const hu = pop('human') * (1 - tw(t, at('l'), 0.4));
    if (hu > 0.001) w.add('person', human, { a: hu }, NOTE);

    // ——— f: closing the terminal
    const xA = pop('close') * (1 - onH);
    if (xA > 0.001) {
      const S = T7.SCREEN;
      const bx = S.x + S.w - 32;
      const by = S.y + 33;
      w.add('close', closeButton, { x: bx, y: by, shut: offG > 0.5, a: xA }, NOTE);
      w.add('ring.close', K.ring, { x: bx - 13, y: by - 13, w: 26, h: 26, level: closeLit, r: 13 }, NOTE);
      w.add('close.q', K.tag, { x: bx - 22, y: by - 14, s: '？', o: { font: F.jp(700, 16), h: 28, padX: 9, fill: C.accent, color: '#fff', r: 14, align: 'right' }, a: pop('close') * (1 - tw(t, at('g'), 0.4)) }, NOTE);
    }

    // ——— in flight, over everything (the first two rounds)
    rounds.slice(0, 2).forEach(({ c, R }, k) => {
      const r = R12[k];
      const sp = r.sp;
      const n = k + 1;
      w.add(`fly.assistant.${n}`, K.flyingMark, { E: { x: DOC7.x + 18, y: c.band.y }, p: seg(t, r.mark, r.mark + sp.fly), role: 'assistant', dy: -sy }, NOTE);
      const lane = { y: c.band.y, h: c.band.h };
      const po = seg(t, r.open, r.open + sp.eot);
      if (po > 0 && po < 1) {
        const pt = onPath(writePath(T7, lane, c.open.x + c.open.w / 2, c.open.y + MARK_H / 2, -sy), inOutCubic(po));
        w.add(`fly.open.${n}`, K.mark, { x: pt.x - c.open.w / 2, y: pt.y - MARK_H / 2, role: 'call', a: clamp(po * 8) }, NOTE);
      }
      c.toks.forEach((tk, j) => {
        const p = seg(t, r.tok[j], r.tok[j] + sp.tok);
        if (p <= 0 || p >= 1) return;
        const tw0 = f.measure(TOKEN.font, tk.s) + TOKEN.padX * 2;
        const pt = onPath(writePath(T7, lane, tk.x + tk.w / 2, tk.y, -sy), inOutCubic(p));
        w.add(`fly.token.${n}.${j}`, K.token, { x: pt.x - tw0 / 2, y: pt.y - TOKEN.h / 2, w: tw0, s: tk.s, a: clamp(p * 8) * clamp((1 - p) * 8) }, NOTE);
      });
      const pe = seg(t, r.fin, r.fin + sp.eot);
      if (pe > 0 && pe < 1) {
        const pt = onPath(writePath(T7, lane, c.end.x + c.end.w / 2, c.end.y + MARK_H / 2, -sy), inOutCubic(pe));
        w.add(`fly.end.${n}`, K.mark, { x: pt.x - c.end.w / 2, y: pt.y - MARK_H / 2, role: 'callEnd', a: clamp(pe * 8) }, NOTE);
      }
      const band = { tx: c.band.x, w: c.band.w, y: c.band.y, h: c.band.h };
      w.add(`fly.command.${n}`, K.chip, { p: seg(t, r.go, r.go + sp.go), pts: toTool(T7, band, -sy), s: CHIPS74[k], kind: 'call' }, NOTE);
      const bp = seg(t, r.back, r.back + sp.back);
      w.add(`fly.output.${n}`, K.chip, { p: bp < 1 ? bp : 0.999, pts: fromTool(T7, R, -sy, R.tx + 120), s: '出力', kind: 'found', fade: bp < 1 ? null : 1 - tw(t, r.resIn - 0.05, 0.25) }, NOTE);
      w.add(`fly.result.${n}`, K.flyingMark, { E: R, p: seg(t, r.resMark, r.resMark + sp.fly), role: 'result', dy: -sy }, NOTE);
    });
    // the quick rounds: the command goes to the shell and the output comes back, from and to the summary
    quick.forEach((q, j) => {
      const c = ents[8 + j * 2];
      const R = ents[9 + j * 2];
      const cb = entBox(MAP, c);
      const rb = entBox(MAP, R);
      const from = [[mapX(MAP, c.c.band.x + c.c.band.w) - 30, cb.y + cb.h / 2], [T7.lane, cb.y + cb.h / 2], [T7.lane, L7.call.y], [L7.call.x2, L7.call.y], [L7.tool.x, L7.call.y]];
      w.add(`fly.command.q${j}`, K.chip, { p: seg(t, q.chipGo, q.chipGo + 0.3), pts: from, s: CHIPS74[j + 2], kind: 'call' }, NOTE);
      const back = [[L7.tool.x, L7.back.y], [L7.back.x2, L7.back.y], [T7.lane, L7.back.y], [T7.lane, rb.y + rb.h / 2], [mapX(MAP, R.R.tx) + 60, rb.y + rb.h / 2]];
      w.add(`fly.output.q${j}`, K.chip, { p: seg(t, q.back, q.resIn), pts: back, s: '出力', kind: 'found' }, NOTE);
    });
  },
});


// ——— this clip's own kinds ———————————————————————————————————————————————————————————————————————————

// The top of the paper, where the scrolled part goes on.
function paperTop(ctx, p, a) {
  const g = ctx.createLinearGradient(0, DOC7.y, 0, DOC7.y + 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.fillRect(DOC7.x + 4, DOC7.y + 2, DOC7.w - 8, 30);
  ctx.restore();
}

// g: the dashed outline of what is gone. { box }
function lost(ctx, { box }, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([9, 6]);
  rr(ctx, box.x, box.y, box.w, box.h, 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  return box;
}

// c2: the ring round the session, from the request down to its name on the bracket. { s, level }
function sessionRing(ctx, { s, level }, a, env) {
  const sb = env.out('bracket');
  const b = { x: DOC7.x + 10, y: mapY(s.MAP, s.U.y) - 4, w: sb.tag.x + sb.tag.w - DOC7.x - 10, h: mapY(s.MAP, s.end) + 40 - mapY(s.MAP, s.U.y) };
  ringBox(ctx, b, level, C.accent, 6);
  return b;
}

// e: the green line from a result to its size. { pts }
function leader(ctx, { pts }, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  path(ctx, pts);
  ctx.restore();
}

// j: the ring round the commands that resume. { level }
function resumeRing(ctx, { level }, a, env) {
  const chips = env.out('resume').chips;
  ringBox(ctx, [...chips, { x: UNDER7.x, y: chips[0].y, w: 1, h: 1 }], level, C.accent, 5);
}

// The harness and its record: a purple line (drawn up to p) with the arrow at its end, and what it does there.
// { pts, p, label }
function recordWire(ctx, { pts, p, label }, a) {
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

// k: a person who checks the record later.
function human(ctx, p, a) {
  const px = CARD7.x + CARD7.w + 34;
  const py = CARD7.y + 28;
  ctx.save();
  ctx.globalAlpha *= a;
  circle(ctx, px, py, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  person(ctx, px, py, C.blue);
  ctx.restore();
  text(ctx, '人が、あとから確かめる', px + 26, py + 6, { font: F.jp(700, 15), color: C.blue, alpha: a });
}

// f: the screen's close button (dark once the terminal is closed). { x, y, shut }
function closeButton(ctx, { x: bx, y: by, shut }, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  circle(ctx, bx, by, 13);
  ctx.fillStyle = shut ? C.ink : '#fff';
  ctx.fill();
  ctx.strokeStyle = C.ink2;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = shut ? '#fff' : C.ink2;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx - 5, by - 5);
  ctx.lineTo(bx + 5, by + 5);
  ctx.moveTo(bx + 5, by - 5);
  ctx.lineTo(bx - 5, by + 5);
  ctx.stroke();
  ctx.restore();
  return { x: bx - 13, y: by - 13, w: 26, h: 26 };
}
