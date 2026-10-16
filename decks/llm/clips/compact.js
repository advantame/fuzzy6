// 7-5: keeping the document inside the window. As the research goes on, the document nears the context window's
// limit. 4-5 left out the old part of a conversation, or summarised it. In an agent's document, the first thing to
// look at is the old tool results: as long as the files are there, a tool can read them again when they are needed.
// So the harness takes the results no longer needed out of the document the LLM reads, and leaves only a mark that
// says so. If the document nears the limit even so, the harness has the LLM summarise the exchange so far and
// goes on from that summary — compaction, as it is sometimes called. ずんだもん: won't something important drop
// out? It may; so the rules every session must keep go in a file outside the document ("tests run with this
// command", "do not touch the production database"), and this harness puts them back into the document at a
// session's start and after a summary. Such files go by names like CLAUDE.md and AGENTS.md. But a document that can
// be read whole is not always used as well everywhere: chapter 8.
//
// The layout is chapter 7's (lib/harness.js). The clip joins 7-4 (spec §6.10): its first frame is 7-4's last
// (lib/harness.js final74), and the bridge clears the session's bracket and the commands that resume it. The
// document stays a summary (7-4's map of it) until the fold, then is drawn at full size again. What is taken out is
// taken out of the document the LLM reads: the record above the LLM keeps every row (research/harness-jobs-facts
// 7-5). The LLM writes the summary (ink tokens); the harness asks for it and writes its mark (purple edge). The
// rules file is an instruction for the LLM, not the harness's permissions (7-7). Everything is an example: the
// commands and their output, the tokens and the limit, the record, the summary, the rules. 7-5 ends on
// lib/harness.js final75 (7-6's first frame).

import { clip } from '../lib/clip.js';
import { C, F } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import {
  chatScreen, chatBubble, screenLinks, flyMark, llmBlock, appFrame, channel, token, TOKEN, onPath, sweep, send,
  roleMark, MARK_H, ROLE, WRITER, BY, loopIcon,
} from '../lib/rig.js';
import {
  T7, L7, ACT7, DOC7, NAME, harnessBox, toolPlace, shell, exampleNote, chipGo, mcpServer, SERVER7, API7, NET7,
  githubBoard, serverWire, sessionBracket, resumeCard, NOTE74, mapX, mapY, prepare75, summaryDoc75, recordCard75,
  RECORD74, docBar75, LIMIT_X75, BAR74, rulesCard75, RULES_CARD75, rulesSource75, compactionName75,
  whenCard75, filesList75, longDoc75, ch8Tag75, shortDoc75, shiftE, terminalLines75, CHIPS75, NOTE75, CLEAR75, PH75,
  RULE_MARK, TOOL7, textBar,
} from '../lib/harness.js';
import { text, measure, rr, path, arrowHead, line } from '../../../src/kit/draw.js';
import { tw, seg, lerp, clamp, inOutCubic, outCubic } from '../../../src/kit/ease.js';
import { focus, ring, ringBox, lifted } from '../../../src/kit/cue.js';

const QUICK = 1.05; // a round on the summary of the document (7-4's quick rounds)
const round = (st) => ({ st, read: st - 0.25, write: st, chipGo: st + 0.42, work: st + 0.7, out: st + 0.82, back: st + 0.78, resIn: st + 1.0 });
const span = (t, a, b, rise = 0.2, fall = 0.3) => seg(t, a, a + rise) * (1 - seg(t, b, b + fall));
const ID = { sx: 1, sy: 1, top: DOC7.y }; // the document at full size, as a map
const mixM = (a, b, p) => ({ sx: lerp(a.sx, b.sx, p), sy: lerp(a.sy, b.sy, p), top: lerp(a.top, b.top, p) });
const RIGHT = mapX({ sx: 0.7 }, DOC7.x + DOC7.w) + 14; // right of the summary: notes on its entries
const SUM_N = 79; // the summary's tokens

export default clip({
  id: 'compact',
  title: '窓に収める',
  kicker: 'コンパクション',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.8, // the session's bracket and the commands that resume it clear away
  script: [
    { id: 'a', lead: 0.3, still: true, text: '調べものが続くと、{grow}文書は、\n{limit}コンテクストウィンドウの上限に{near}近づいていくわ。' },
    { id: 'b', text: '{ref}[4-5|ヨンノゴ] では、会話が長くなったとき、\n{cut}古い部分を省いたり、{sum}要約したりしたわね。' },
    { id: 'c', text: '{agent}エージェントの文書で、まず目をつけたいのは、\n{old}古いツールの結果よ。' },
    { id: 'd', text: '{file}ファイルが残っていれば、{need}要るときに、\n{again}もう一度ツールで読み直せるわ。' },
    { id: 'e', still: true, text: 'そこで、{old2}もう要らない古い結果を、\n{out}LLM に読ませる文書から外して、\n\n{mark}外したことがわかる印だけを残させましょう。' },
    { id: 'f', lead: 2.2, tail: 2.0, text: 'それでも{again2}上限に近づいたら、{ask}ここまでのやりとりを\nLLM に要約させて、{from}その要約から続けさせるの。' },
    { id: 'g', still: true, text: '{doc2}文書をこうして{short}要約で短くすることを、\n{name}コンパクションと呼ぶこともあるわ。' },
    { id: 'h', by: 'zunda', text: '{lost}要約したら、大事なことが抜けてしまわないのだ？' },
    { id: 'i', lead: 0.6, text: '{yes}抜けることもあるわ。\nだから、{keep}どのセッションでも守らせたい決まりは、\n\n{outside}文書の外の{file2}ファイルに書いておくの。' },
    { id: 'j', text: 'たとえば、{rule1}「テストは、このコマンドで動かす」\n{rule2}「本番のデータベースには触らない」といった決まりよ。' },
    { id: 'k', still: true, tail: 1.0, text: '{this}このハーネスには、{start}セッションの始めと、\n{after}要約したあとに、{put}その決まりを文書へ入れ直させましょう。' },
    { id: 'l', text: 'こうしたファイルには、{cm}[CLAUDE.md|クロードエムディー] や\n{am}[AGENTS.md|エージェンツエムディー] という名前が使われているわね。' },
    { id: 'm', text: 'ただ、{long}長い文書を読ませられても、\n{well}どこでも同じようにうまく使えるとは限らないわ。\n\n{ch8}8 章で見ていきましょう。' },
  ],

  prepare(ctx) {
    return prepare75(ctx);
  },

  draw(ctx, t, s, { at, pace }) {
    const { s73, ents, MAP } = s;
    const cue = pace.cue;
    const lead = cue.lead;
    const pop = (n, dur = pace.enter) => tw(t, at(n) - lead, dur);
    const lit = (ids, until) => focus(t, ids.map(at), until - cue.fall, cue).level;
    const N74 = 14; // 7-4's entries; the four rounds' are 14 to 21, the request 22, the summary 23

    // ——— the bridge: the session's bracket and the commands that resume it clear away
    const br = at('a');
    const nar = inOutCubic(seg(t, 0, br));

    // ——— four more rounds: two as a begins, two in f's lead
    const q = [round(at('a') + 0.15), round(at('a') + 0.15 + QUICK), round(at('f') + 0.15), round(at('f') + 0.15 + QUICK)];
    const callK = (j) => N74 + 2 * j;
    const roundOf = (k) => (k >= N74 && k < N74 + 8 ? Math.floor((k - N74) / 2) : -1);
    const wrote = q.map((r) => tw(t, r.write, 0.4));
    const landed = q.map((r) => tw(t, r.resIn, 0.4));

    // ——— e: the old results taken out (one after another), what was taken out still in the record
    const clearAt = (i) => at('out') - lead + i * 0.14;
    const clr = (k) => {
      const i = CLEAR75.indexOf(k);
      return i < 0 ? 0 : inOutCubic(seg(t, clearAt(i), clearAt(i) + 0.7));
    };
    const clearAll = CLEAR75.reduce((n, k) => n + clr(k), 0) / CLEAR75.length;

    // ——— f: the request, the summary the LLM writes, the fold, the document at full size again
    const askFly = at('ask') - lead;
    const askRead = askFly + 0.6;
    const asstFly = askRead + 0.25;
    const w0 = askRead + 0.6;
    const W = Math.max(1.3, at('from') - lead - w0 - 0.1);
    const tokAt = (j) => w0 + (j * W) / SUM_N;
    const TOK_FLY = 0.3;
    const wroteSum = s.toks.reduce((n, tk, j) => (t >= tokAt(j) + TOK_FLY ? tk.upto : n), 0);
    const foldAt = Math.max(at('from') - lead, tokAt(SUM_N - 1) + TOK_FLY + 0.1);
    const fold = inOutCubic(seg(t, foldAt, foldAt + 0.9));
    const zoom = inOutCubic(seg(t, foldAt + 0.7, foldAt + 1.6));
    const textA = seg(t, foldAt + 1.5, foldAt + 1.8);
    const contFly = foldAt + 1.9;
    const contRead = contFly + 0.5;

    // ——— k: the rules put back in
    const ruleRead = at('put') - lead;
    const ruleFly = ruleRead + 0.55;
    const shift = seg(t, ruleFly - 0.1, ruleFly + 0.45);
    const ruleType = seg(t, ruleFly + 0.45, ruleFly + 1.0);
    const ruleSweep = ruleFly + 1.05;

    // ——— where the entries of the long document are: moved up by what was taken out above them, folded (f)
    const shrinkOf = (k) => (ents[k].y1 - ents[k].y0 - PH75) * clr(k);
    const shiftTo = (k) => CLEAR75.reduce((n, j) => (j < k ? n + shrinkOf(j) : n), 0);
    const appear = (k) => {
      if (k < N74) return 1;
      const j = roundOf(k);
      if (j >= 0) return k === callK(j) ? tw(t, q[j].write - 0.05, 0.15) : tw(t, q[j].resIn - 0.05, 0.15);
      if (k === 22) return tw(t, askFly + 0.4, 0.15);
      return tw(t, asstFly + 0.4, 0.15);
    };
    const prog = (k) => {
      const j = roundOf(k);
      if (j >= 0) return k === callK(j) ? seg(t, q[j].write, q[j].write + 0.4) : seg(t, q[j].resIn, q[j].resIn + 0.25);
      if (k === 22) return seg(t, askFly + 0.4, askFly + 0.7);
      if (k === 23) return wroteSum;
      return 1;
    };
    // the bottom of what is written (full-size y), before and after the fold
    let endPre = ents[0].y1;
    for (let k = 1; k < ents.length; k++) {
      const ap = appear(k);
      if (ap <= 0) continue;
      const y1 = ents[k].y1 - shiftTo(k) - shrinkOf(k);
      endPre = lerp(endPre, y1, ap);
    }
    const end = lerp(endPre, s.top + s.S.h, fold);
    const avail = MAP.sy * (s.end - DOC7.y);
    const Mmap = { ...MAP, sy: end <= s.end ? MAP.sy : Math.min(MAP.sy, avail / (end - DOC7.y)) };
    const M = zoom > 0 ? mixM(Mmap, ID, zoom) : Mmap;
    const dyOf = (k) => {
      if (k === 0) return 0;
      const base = -shiftTo(k);
      const y0 = ents[k].y0 + base;
      return base + (s.top - y0) * fold;
    };
    const boxOf = (k, MM = M) => {
      const e = ents[k];
      const dy = dyOf(k);
      const x0 = Math.min(...e.items.map((it) => it.x));
      const x1 = Math.max(...e.items.map((it) => it.x + it.w));
      const h = (e.y1 - e.y0 - shrinkOf(k)) * MM.sy;
      return { x: mapX(MM, x0), y: mapY(MM, e.y0 + dy), w: (x1 - x0) * MM.sx, h };
    };

    // ——— who is at work
    const actGlow = Math.max(
      ...q.map((r) => Math.max(span(t, r.read - 0.05, r.read + 0.25), span(t, r.chipGo - 0.1, r.chipGo + 0.3), span(t, r.back + 0.15, r.resIn + 0.2))),
      span(t, at('old2') - lead, at('mark') + 0.3),
      span(t, askFly - 0.2, askRead + 0.4),
      span(t, foldAt - 0.1, foldAt + 1.0),
      span(t, contFly - 0.2, contRead + 0.3),
      span(t, ruleRead - 0.1, ruleSweep + 0.3),
    );
    const llmGlow = Math.max(
      ...q.map((r) => span(t, r.read + 0.15, r.chipGo - 0.05)),
      span(t, askRead + 0.15, tokAt(SUM_N - 1) + TOK_FLY),
      span(t, contRead + 0.3, contRead + 0.9),
      span(t, ruleSweep + 0.3, ruleSweep + 0.9),
    );
    const writing = q.some((r) => t >= r.write && t < r.chipGo - 0.05) || (t >= w0 && t < tokAt(SUM_N - 1) + TOK_FLY);

    // ——— the rings: what the voice points at
    const [growLit] = lit(['grow'], at('limit'));
    const [nearLit] = lit(['near'], at('a.end'));
    const [agentLit, oldLit] = lit(['agent', 'old'], at('c.end'));
    const [fileLit, needLit] = lit(['file', 'need', 'again'], at('d.end'));
    const [old2Lit, outLit] = lit(['old2', 'out', 'mark'], at('e.end'));
    const [again2Lit] = lit(['again2'], at('ask'));
    const [doc2Lit, shortLit, nameLit] = lit(['doc2', 'short', 'name'], at('g.end'));
    const [lostLit] = lit(['lost'], at('h.end'));
    const [outsideLit] = lit(['outside'], at('i.end'));
    const [thisLit] = lit(['this'], at('start'));
    const [cmLit, amLit] = lit(['cm', 'am'], at('l.end'));
    const [longLit, wellLit] = lit(['long', 'well'], at('ch8'));

    // ——— the chat screen (7-4's report and the request)
    chatScreen(ctx, T7.SCREEN, 1);
    chatBubble(ctx, s73.Br, { alpha: 1 });
    chatBubble(ctx, s73.Bu, { alpha: 1 });
    screenLinks(ctx, T7, { talk: 1, back: 1, talkHot: false, backHot: false });

    // ——— the LLM, the frame and the channels
    appFrame(ctx, L7, 1, { name: '' });
    llmBlock(ctx, L7, 1, { glow: llmGlow });
    const reads = [...q.map((r) => r.read), askRead, contRead, ruleSweep];
    const readHot = reads.some((r) => span(t, r, r + 0.3) > 0.5);
    channel(ctx, L7.read, 1, { hot: readHot });
    channel(ctx, L7.write, 1, { hot: llmGlow > 0.5 && writing });
    channel(ctx, L7.call, 1, { labelAlpha: 1, hot: q.some((r) => span(t, r.chipGo, r.work) > 0.5) });
    channel(ctx, L7.back, 1, { labelAlpha: 1, hot: q.some((r) => span(t, r.back, r.resIn) > 0.5) });

    // ——— the document: its summary (7-4's map) until it is folded, then the short document at full size
    const docRest = (k) => (oldLit > 0.001 && ents[k].kind !== 'result' ? lerp(1, cue.dim, oldLit) : 1);
    if (textA < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - textA;
      summaryDoc75(ctx, ents, M, (k) => {
        const ap = appear(k);
        const folding = k > 0 && k < 23 ? 1 - seg(fold, 0, 0.7) : 1;
        return { alpha: ap * folding * docRest(k), prog: prog(k), dy: dyOf(k), clear: clr(k), rename: k === 23 ? seg(fold, 0.3, 0.9) : 0 };
      });
      ctx.restore();
    }
    // the assistant's mark under the summary, once it goes on (f's tail), and the rules (k)
    const asstA = t >= contFly + 0.45 ? 1 : 0;
    if (textA > 0.001) {
      ctx.save();
      ctx.globalAlpha *= textA;
      shortDoc75(ctx, s, { rules: ruleType, ruleMark: t >= ruleFly + 0.45 ? 1 : 0, shift, asst: asstA });
      ctx.restore();
    }
    // the reads: the harness hands the document over
    q.forEach((r, j) => {
      sweep(ctx, L7, seg(t, r.read, r.read + 0.3), mapY(Mmap, ents[callK(j)].y0 + dyOf(callK(j))));
      send(ctx, L7.read, seg(t, r.read + 0.05, r.read + 0.35), '', 'doc');
    });
    sweep(ctx, L7, seg(t, askRead, askRead + 0.4), mapY(Mmap, ents[22].y1 + dyOf(22)));
    send(ctx, L7.read, seg(t, askRead + 0.1, askRead + 0.5), '', 'doc');
    sweep(ctx, L7, seg(t, contRead, contRead + 0.45), s.asstY + MARK_H);
    send(ctx, L7.read, seg(t, contRead + 0.1, contRead + 0.55), '', 'doc');
    sweep(ctx, L7, seg(t, ruleSweep, ruleSweep + 0.45), s.asstY + s.RULE_DY + MARK_H);
    send(ctx, L7.read, seg(t, ruleSweep + 0.1, ruleSweep + 0.55), '', 'doc');

    // a: the newest entries grow the document
    if (growLit > 0.001) ringBox(ctx, [boxOf(callK(0)), boxOf(callK(1) + 1)], growLit, C.accent, 4);
    // c: the document; the old results (7-3's and the first five rounds'), bracketed on the right
    const mapRing = () => ({ x: DOC7.x + 10, y: mapY(M, DOC7.y), w: mapX(M, DOC7.x + DOC7.w) - DOC7.x - 22, h: mapY(M, endPre) - mapY(M, DOC7.y) + 6 });
    if (agentLit > 0.001) ringBox(ctx, mapRing(), agentLit, C.accent, 4);
    const brkA = pop('old') * (1 - tw(t, at('f'), 0.4));
    if (brkA > 0.001) {
      const b0 = boxOf(CLEAR75[0]);
      const b1 = boxOf(CLEAR75[CLEAR75.length - 1]);
      const x = RIGHT;
      ctx.save();
      ctx.globalAlpha *= brkA;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      path(ctx, [[x - 8, b0.y], [x, b0.y], [x, b1.y + b1.h], [x - 8, b1.y + b1.h]]);
      ctx.restore();
      const ym = b1.y + b1.h - 16; // (low on the bracket: the call that reads src/db.py again passes higher up, d)
      const swap = seg(t, at('mark') - lead, at('mark') - lead + 0.4);
      const opt = { font: F.jp(700, 13), h: 26, padX: 9, r: 13 };
      tag(ctx, x + 10, ym - 13, '古いツールの結果', { ...opt, fill: C.paper, stroke: C.green, color: C.green, alpha: brkA * (1 - swap) });
      tag(ctx, x + 10, ym - 13, '外したことの印', { ...opt, fill: C.paper, stroke: C.purple, color: C.purple, alpha: brkA * swap });
    }
    // d: the result of cat src/db.py (round 2) — the file is still there, a tool can read it again
    if (needLit > 0.001) ringBox(ctx, boxOf(7), needLit, C.accent, 3);
    // e: the document the LLM reads (that is what they are taken out of)
    if (outLit > 0.001) ringBox(ctx, mapRing(), outLit, C.accent, 4);
    // f: the request and the summary, named on the right while they are written
    const askNote = tw(t, askFly + 0.45, 0.3) * (1 - seg(fold, 0, 0.4));
    if (askNote > 0.001) {
      const b = boxOf(23);
      tag(ctx, RIGHT, b.y - 30, '要約を頼む', { font: F.jp(700, 13), h: 26, padX: 9, r: 13, fill: C.paper, stroke: C.purple, color: C.purple, alpha: askNote });
    }
    const sumNote = tw(t, w0, 0.3) * (1 - seg(fold, 0, 0.4));
    if (sumNote > 0.001) {
      const b = boxOf(23);
      tag(ctx, RIGHT, b.y + 2, 'LLM が書く要約', { font: F.jp(700, 13), h: 26, padX: 9, r: 13, fill: C.ink, color: C.paper, alpha: sumNote });
    }
    // g: the short document; the summary (also when ずんだもん asks, h)
    const SEnow = shiftE(s.SE, s.RULE_DY * inOutCubic(shift));
    const sumBox = { x: SEnow.x, y: SEnow.y, w: SEnow.tx + SEnow.w - SEnow.x, h: SEnow.h };
    if (doc2Lit > 0.001) ringBox(ctx, { x: DOC7.x + 10, y: DOC7.y + 8, w: DOC7.w - 20, h: s.asstY + MARK_H - DOC7.y }, doc2Lit, C.accent, 4);
    ringBox(ctx, sumBox, Math.max(shortLit, lostLit), C.accent, 6);
    const qA = pop('lost') * (1 - tw(t, at('i'), 0.4));
    tag(ctx, sumBox.x + sumBox.w + 4, sumBox.y - 18, '？', { font: F.jp(700, 16), h: 28, padX: 9, fill: C.accent, color: '#fff', r: 14, align: 'right', alpha: qA });
    // i: something may drop out of a summary
    const holeA = pop('yes') * (1 - tw(t, at('j'), 0.4));
    if (holeA > 0.001) {
      const row = 3;
      const rw = measure(ctx, SEnow.font, SEnow.rows[row]);
      const x = SEnow.tx + rw + 10;
      const y = SEnow.y + 21 + row * SEnow.lh - 19;
      ctx.save();
      ctx.globalAlpha *= holeA;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.8;
      rr(ctx, x, y, 44, 24, 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      text(ctx, '？', x + 22, y + 13, { font: F.jp(700, 15), color: C.muted, align: 'center', base: 'middle', alpha: holeA });
    }
    // k: the rules, in the document
    const [putLit] = lit(['put'], at('k.end'));
    if (putLit > 0.001 && t > ruleFly + 0.4) ringBox(ctx, { x: s.RE.x, y: s.RE.y, w: s.RE.tx + s.RE.w - s.RE.x, h: s.RE.h }, putLit, C.accent, 6);

    // ——— the harness's box (and its loop); in the frame's top left, the name (g) and when the rules go back in (k)
    harnessBox(ctx, ACT7, 1, { glow: actGlow, names: [['アプリ', 0, 26], [NAME, 1, 0]] });
    ring(ctx, ACT7.x, ACT7.y, ACT7.w, ACT7.h, thisLit, C.accent, 18);
    const LP = T7.LOOP;
    loopIcon(ctx, LP.x, LP.y, LP.r, 1, { p: 1 });
    text(ctx, 'くり返す', LP.x - LP.r - 14, LP.y + 6, { font: F.jp(700, 16), color: C.purple, align: 'right', alpha: 1 });
    compactionName75(ctx, pop('name'), lifted(nameLit, cue));
    const when = whenCard75(ctx, { a: pop('this'), rows: [pop('start'), pop('after')] });
    when.rows.forEach((b, i) => ringBox(ctx, b, lit(['start', 'after'], at('put'))[i], C.accent, 3));

    // ——— the tool's place: the shell, the GitHub MCP server, the files the shell works on; GitHub in the net beyond
    const work = (j) => q[j].work;
    const out = (j) => q[j].out;
    // d: a call that would read src/db.py again (dashed: it can, it is not run here)
    const ghostGo = seg(t, at('again') - lead, at('again') - lead + 0.6);
    const ghostBack = seg(t, at('again') - lead + 0.75, at('again') - lead + 1.35);
    const filesA = pop('file');
    toolPlace(ctx, L7, 1, {
      draw: (cx) => {
        shell(cx, t, 1, terminalLines75(work, out), { trim: true });
        mcpServer(cx, SERVER7, 1);
        const fb = filesList75(cx, { a: filesA, lit: Math.max(fileLit, span(t, at('again') - lead + 0.45, at('again') - lead + 1.0)) });
        if (fb.length) ringBox(cx, fb[1], fileLit, C.accent, 2);
      },
    });
    githubBoard(ctx, NET7, 1, { narrow: 0, scroll: 1, found: 0 });
    serverWire(ctx, SERVER7, API7.x, 1, 1);

    // ——— above the LLM: the record (rows go on; it keeps what was taken out), then a strip; the rules' file
    const recRows = RECORD74.length + q.reduce((n, r) => n + tw(t, r.write, 0.18) + tw(t, r.resIn, 0.18), 0);
    const keepA = pop('out') * (1 - tw(t, at('f'), 0.4));
    const strip = seg(t, at('i'), at('i') + 0.6);
    recordCard75(ctx, {
      a: 1, rows: recRows, strip, keepTag: keepA,
      keep: (k) => (CLEAR75.includes(k + 1) ? keepA : 0),
    });
    const rc = rulesCard75(ctx, { slot: pop('keep'), a: pop('file2'), rules: [pop('rule1'), pop('rule2')], note: tw(t, at('rule2') - lead + 0.6, pace.enter), names: [pop('cm'), pop('am')] });
    ringBox(ctx, RULES_CARD75, outsideLit, C.accent, 4);
    rc.names.forEach((b, i) => ringBox(ctx, { ...b, w: RULES_CARD75.w - 36 }, [cmLit, amLit][i], C.accent, 3));
    rulesSource75(ctx, pop('am'));
    // k: the harness reads the file and puts the rules back in
    const wireP = seg(t, ruleRead, ruleRead + 0.5);
    const wireA = 1 - tw(t, at('k.end'), 0.4);
    if (wireP > 0 && wireA > 0.001) {
      const yW = RULES_CARD75.y + 30;
      const pts = [[RULES_CARD75.x + RULES_CARD75.w + 2, yW], [L7.app.x - 8, yW], [L7.app.x - 8, L7.app.y + 8], [ACT7.x + 40, L7.app.y + 8], [ACT7.x + 40, ACT7.y - 2]];
      ctx.save();
      ctx.globalAlpha *= wireA;
      ctx.strokeStyle = ctx.fillStyle = C.purple;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      path(ctx, pts, wireP);
      if (wireP > 0.97) arrowHead(ctx, ACT7.x + 40, ACT7.y - 2, Math.PI / 2, 11);
      ctx.restore();
      text(ctx, '読み込む', ACT7.x - 30, L7.app.y + 27, { font: F.jp(700, 14), color: C.purple, align: 'right', alpha: wireA * seg(wireP, 0.6, 1) });
    }
    flyMark(ctx, T7, { x: s.RE.x, y: s.RE.y }, seg(t, ruleFly, ruleFly + 0.45), RULE_MARK, { edge: BY.app });

    // ——— under the LLM: what the document holds, with the window's limit; 4-5 (b); a long document (m)
    const calls = (2000 + 500 * wrote.reduce((n, w) => n + w, 0)) * (1 - fold);
    const results = (27000 + 13000 * landed[0] + 1000 * landed[1] - 27000 * clearAll + 14000 * landed[2] + 10000 * landed[3]) * (1 - fold);
    const vals = [12000, calls, results, 80 * fold];
    const goneA = span(t, at('out') - lead, at('f'), 0.2, 0.5);
    const fromTok = 12000 + calls + results;
    const bar = docBar75(ctx, {
      a: 1, vals,
      rows: [1, 1 - fold, 1 - fold, fold], slots: [0, 1, 2, 1],
      track: pop('limit'), limit: pop('limit'), limitP: seg(t, at('limit') - lead, at('limit') - lead + 0.6),
      gone: { from: fromTok, to: fromTok + 27000 * clearAll, a: goneA * clearAll },
    });
    if (bar) {
      if (bar.boxes[2]) ringBox(ctx, bar.boxes[2], Math.max(oldLit, old2Lit) * (1 - fold), C.accent, 3);
      const nearBox = { x: bar.end - 4, y: BAR74.y - 4, w: LIMIT_X75 - bar.end + 8, h: BAR74.h + 8 };
      ringBox(ctx, nearBox, Math.max(nearLit, again2Lit), C.accent, 3);
      ringBox(ctx, [bar.boxes[0], bar.boxes[3]].filter(Boolean), shortLit, C.accent, 4);
      ringBox(ctx, { x: BAR74.x, y: BAR74.y, w: LIMIT_X75 - BAR74.x, h: BAR74.h }, longLit, C.accent, 4);
    }
    card45(ctx, { a: pop('ref') * (1 - tw(t, at('c') + 0.2, 0.4)), cut: pop('cut'), sum: pop('sum') });
    const ld = longDoc75(ctx, { a: pop('long'), well: seg(t, at('well') - lead, at('well') - lead + 0.8), q: pop('well') });
    if (ld) ringBox(ctx, ld, wellLit, C.accent, 3);
    ch8Tag75(ctx, tw(t, at('ch8') - lead, pace.enter));

    // ——— 7-4's last pieces, clearing in the bridge
    if (nar < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - nar;
      sessionBracket(ctx, s, { p: 1, tag: 1, tail: 1 });
      resumeCard(ctx, { a: 1 });
      ctx.restore();
    }

    // ——— in flight, over everything
    // the four rounds: the command to the shell and its output back, from and to the summary (7-4's quick rounds)
    q.forEach((r, j) => {
      const cb = boxOf(callK(j), Mmap);
      const rb = boxOf(callK(j) + 1, Mmap);
      const c = ents[callK(j)].c;
      const from = [[mapX(Mmap, c.band.x + c.band.w) - 30, cb.y + cb.h / 2], [T7.lane, cb.y + cb.h / 2], [T7.lane, L7.call.y], [L7.call.x2, L7.call.y], [L7.tool.x, L7.call.y]];
      chipGo(ctx, seg(t, r.chipGo, r.chipGo + 0.3), from, CHIPS75[j], 'call');
      const R = ents[callK(j) + 1].R;
      const back = [[L7.tool.x, L7.back.y], [L7.back.x2, L7.back.y], [T7.lane, L7.back.y], [T7.lane, rb.y + rb.h / 2], [mapX(Mmap, R.tx) + 60, rb.y + rb.h / 2]];
      chipGo(ctx, seg(t, r.back, r.resIn), back, '出力', 'found');
    });
    // d: the call that could read the file again, and what it would bring back (dashed)
    {
      const b = boxOf(7);
      const R = ents[7].R;
      const go = [[mapX(M, R.tx + R.w) - 20, b.y + b.h / 2], [T7.lane, b.y + b.h / 2], [T7.lane, L7.call.y], [L7.call.x2, L7.call.y], [L7.tool.x, L7.call.y]];
      ghostChip(ctx, ghostGo, go, 'cat src/db.py', C.accent);
      const back = [[L7.tool.x, L7.back.y], [L7.back.x2, L7.back.y], [T7.lane, L7.back.y], [T7.lane, b.y + b.h / 2], [mapX(M, R.tx + R.w) - 20, b.y + b.h / 2]];
      ghostChip(ctx, ghostBack, back, 'もう一度読める', C.green);
    }
    // f: the request's mark and the assistant's mark, out of the box into the summary of the document (shrinking to it)
    flyInto(ctx, seg(t, askFly, askFly + 0.45), ROLE.system, ents[22], dyOf(22), Mmap);
    flyInto(ctx, seg(t, asstFly, asstFly + 0.45), ROLE.assistant, ents[23], dyOf(23), Mmap);
    // the summary's tokens, from the LLM into their place
    s.toks.forEach((tk, j) => {
      const p = seg(t, tokAt(j), tokAt(j) + TOK_FLY);
      if (p <= 0 || p >= 1) return;
      const dy = dyOf(23);
      const S = s.S;
      const label = tk.s.replace(/^ /, '');
      if (!label) return;
      const w = measure(ctx, TOKEN.font, label) + TOKEN.padX * 2;
      // out of the write channel, down the frame's margin to the row, and in
      const ty = mapY(Mmap, tk.y + 9 + dy);
      const wc = L7.write;
      const pt = onPath([[wc.x1, wc.y], [T7.margin, wc.y], [T7.margin, ty], [mapX(Mmap, tk.x) + w / 2, ty]], inOutCubic(p));
      token(ctx, pt.x - w / 2, pt.y - TOKEN.h / 2, w, label, clamp(p * 8) * clamp((1 - p) * 6));
    });
    // f's tail: the assistant's mark under the summary at full size
    flyMark(ctx, T7, { x: DOC7.x + 18, y: s.asstY }, seg(t, contFly, contFly + 0.45), ROLE.assistant, { edge: WRITER.assistant });

    // ——— the example's note (7-4's gives way)
    exampleNote(ctx, L7, '', 0, 1);
    const exX = L7.app.x + measure(ctx, F.jp(700, 17), '例') + 20 + 10;
    const exY = L7.app.y + L7.app.h + 22 + 21;
    const nf = F.jp(400, 17);
    text(ctx, NOTE74, exX, exY, { font: nf, color: C.muted, alpha: 1 - seg(nar, 0, 0.5) });
    text(ctx, NOTE75, exX, exY, { font: nf, color: C.muted, alpha: seg(nar, 0.5, 1) });
  },
});

// A mark the harness writes, out of its box into entry e of the summary of the document (it shrinks to the map).
function flyInto(ctx, p, r, e, dy, M) {
  if (p <= 0 || p >= 1) return;
  const qq = inOutCubic(p);
  const x = lerp(T7.FROM.x, mapX(M, e.items[0].x), qq);
  const y = lerp(T7.FROM.y, mapY(M, e.items[0].y + dy), qq) + Math.sin(Math.PI * qq) * 16;
  const sc = lerp(1, Math.max(M.sx, M.sy), qq);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, lerp(1, M.sy, qq));
  roleMark(ctx, 0, 0, r, { edge: BY.app, alpha: clamp(p * 6) });
  ctx.restore();
}

// A call that could be made (dashed: not run here), on its way along a polyline; it slides under the tool's place.
function ghostChip(ctx, p, pts, s, color) {
  if (p <= 0 || p >= 1) return;
  const pt = onPath(pts, inOutCubic(p));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, TOOL7.x, 900);
  ctx.clip();
  ctx.globalAlpha = clamp(p * 8) * clamp((1 - p) * 8);
  const font = color === C.accent ? F.mono(600, 15) : F.jp(700, 15);
  const w = measure(ctx, font, s) + 20;
  rr(ctx, pt.x - w / 2, pt.y - 15, w, 30, 8);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
  text(ctx, s, pt.x, pt.y + 1, { font, color, align: 'center', base: 'middle' });
  ctx.restore();
}

// b: 4-5, small — the old part left out, or summarised (under the bar).
function card45(ctx, o) {
  const a = o.a ?? 0;
  if (a <= 0.001) return;
  const B = { x: BAR74.x, y: 704, w: LIMIT_X75 - BAR74.x, h: 108 };
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  rr(ctx, B.x, B.y, B.w, B.h, 12);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  const tw0 = text(ctx, '4-5', B.x + 14, B.y + 24, { font: F.mono(600, 14), color: C.purple, alpha: a });
  text(ctx, '毎回読み直す（チャットボット）', B.x + 14 + tw0 + 10, B.y + 24, { font: F.jp(700, 13), color: C.ink2, alpha: a });
  // two small documents: the old lines struck out; the old lines folded into one summary line
  const mini = (x, kind, p) => {
    const y0 = B.y + 38;
    ctx.save();
    ctx.globalAlpha *= clamp(a);
    rr(ctx, x, y0, 120, 46, 6);
    ctx.fillStyle = C.paper;
    ctx.fill();
    ctx.restore();
    const ws = [84, 66, 92, 56];
    ws.forEach((w, i) => {
      const y = y0 + 9 + i * 10;
      if (kind === 'sum' && i < 2) {
        textBar(ctx, x + 10, y, w, a * (1 - p), C.rule, 5);
        return;
      }
      textBar(ctx, x + 10, y, w, a, C.rule, 5);
      if (kind === 'cut' && i < 2 && p > 0) {
        ctx.save();
        ctx.globalAlpha *= a;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        line(ctx, x + 6, y, x + 14 + w, y, outCubic(clamp(p * 1.4 - i * 0.3)));
        ctx.restore();
      }
    });
    if (kind === 'sum') textBar(ctx, x + 10, y0 + 14, 70, a * p, C.green, 7);
    text(ctx, kind === 'cut' ? '古い部分を省く' : '要約する', x + 60, B.y + B.h - 10, { font: F.jp(700, 12), color: C.ink2, align: 'center', alpha: a * Math.max(0.35, p) });
  };
  mini(B.x + 26, 'cut', o.cut ?? 0);
  mini(B.x + B.w - 146, 'sum', o.sum ?? 0);
}
