// 1-1: what is inside an agent. Coming from the opening, the clip joins it without a
// transition (spec §6.10): its bridge starts from the opening's last frame (lib/cover.js) and
// lets the cover leave. The clip's own head is the agent's box alone — where it starts when
// entered from anywhere else. The box opens into the agent's parts — the model, the program
// around it, the tools (the same three parts chapters 5–7 are drawn on) — and the model is
// lit as the core. ずんだもん knows the name from ChatGPT: the chat window the viewer has used
// comes in on the right, and it has the same core. Its name unfolds, and the clip ends on the
// half of the name the next clip takes. What the model does is left to 1-2: "the next word" is
// only one kind of language model, and the clip does not say it of LLMs as a whole.

import { clip } from '../lib/clip.js';
import { C, F, M } from '../lib/theme.js';
import { tag } from '../lib/parts.js';
import { layout, llmBlock, appFrame, toolBox } from '../lib/rig.js';
import { BOX, DONE, coverLayout, coverTitle, coverBox, coverSides, coverAsk } from '../lib/cover.js';
import { chatCard } from '../lib/chat.js';
import { text, measure, arrow, line, wipe } from '../../../src/kit/draw.js';
import { tw, seg, lerp, outExpo, outCubic, inOutCubic } from '../../../src/kit/ease.js';
import { enter, focus, dimmed } from '../../../src/kit/cue.js';

// the agent, opened (closed, it is the cover's BOX)
const OPEN = { x: M.l, y: 96, w: 1408, h: 262 };
const L = layout({
  llm: { x: 156, y: 140, w: 150, h: 150 },
  app: { x: 430, y: 130, w: 590, h: 170 },
  tool: { x: 1146, y: 140, w: 300, h: 150 },
});

const WORDS = ['Large', 'Language', 'Model'];
const BIG = 180; // "LLM" before it unfolds
const NAME_W = 940; // leaves the right for the chat window
const CHAT = { x: 1080, y: 404 };
// the name sits in the middle of the room the opened box leaves below it
const Y0 = 618; // baseline of "LLM"
const Y1 = 590; // baseline of the unfolded words
const JA = ['大規模', '言語モデル'];
const JA_FONT = F.jp(700, 56);
const JA_Y = 676;

export default clip({
  id: 'core',
  title: '中核は LLM',
  kicker: 'Large Language Model',
  cast: ['metan', 'zunda'],
  join: 'cut',
  bridge: 0.45, // the cover leaves; skipped unless the clip is joined from the opening
  script: [
    { id: 'a', lead: 0.9, text: 'エージェントは、{parts}いくつかの部品を\n組み合わせて作られているの。' },
    { id: 'b', still: true, text: 'その中核にあるのが、{llm}LLM という技術よ。' },
    { id: 'b2', by: 'zunda', text: 'LLM、聞いたことがあるのだ。\n{gpt}ChatGPT みたいな AI のことなのだ？' },
    { id: 'b3', still: true, text: 'おしいわね。ChatGPT のような対話型 AI サービスも、\n{core}中核にあるのが LLM なの。' },
    {
      id: 'c',
      lead: 0.8,
      still: true,
      text: 'LLM は {full}[Large Language Model|ラージ・ランゲージ・モデル] の略。\n日本語では、{ja}大規模言語モデルと呼ぶわ。',
    },
    { id: 'g', tail: 0.6, text: 'まずは、名前の後ろ半分、{lm}「言語モデル」からよ。' },
  ],

  prepare(ctx) {
    const em = (s) => measure(ctx, F.cond(700, 100), s) / 100;
    const gapEm = 0.26;
    const size = Math.min(128, Math.floor(NAME_W / (WORDS.reduce((n, w) => n + em(w), 0) + gapEm * 2)));
    let x = M.l;
    const words = WORDS.map((w, i) => {
      const from = M.l + measure(ctx, F.cond(700, BIG), 'LLM'.slice(0, i));
      const out = { w, from, to: x, initial: measure(ctx, F.cond(700, size), w[0]), full: measure(ctx, F.cond(700, size), w) };
      x += out.full + gapEm * size;
      return out;
    });
    return { size, words, jaSplit: measure(ctx, JA_FONT, JA[0]), cover: coverLayout(ctx) };
  },

  draw(ctx, t, { size, words, jaSplit, cover }, { at, pace }) {
    const cue = pace.cue;
    const a = at('a');

    // ——— the bridge: the cover leaves, all but its box. The first frame is the cover
    // untouched and the fade starts gently, because the join is a cut; at the head (the start
    // of sentence a) the box stands alone.
    const leave = 1 - inOutCubic(seg(t, 0, a));
    // ——— the box opens: the ink box becomes an outline around the parts
    const open = inOutCubic(seg(t, a + 0.05, a + 0.9));
    const box = {
      x: lerp(BOX.x, OPEN.x, open),
      y: lerp(BOX.y, OPEN.y, open),
      w: lerp(BOX.w, OPEN.w, open),
      h: lerp(BOX.h, OPEN.h, open),
    };
    if (leave > 0) {
      ctx.save();
      ctx.globalAlpha = leave;
      coverTitle(ctx, cover, DONE);
      ctx.restore();
    }
    coverBox(ctx, box, DONE, { fill: 1 - seg(open, 0, 0.7), outline: open, head: 1 - seg(open, 0, 0.5), rows: leave });
    if (leave > 0) {
      ctx.save();
      ctx.globalAlpha = leave;
      coverSides(ctx, cover, DONE);
      coverAsk(ctx, DONE);
      ctx.restore();
    }
    tag(ctx, OPEN.x + 28, OPEN.y - 20, 'AI エージェント', { font: F.jp(700, 20), h: 40, padX: 16, fill: C.ink, color: C.paper, alpha: seg(open, 0.6, 1) });

    // the parts are the answer of sentence a; the model is the answer of sentence b and
    // keeps its mark
    const core = focus(t, [at('llm')], at('b.end') - cue.fall, cue);
    const others = dimmed(0, core.any, cue);
    const partsAt = at('parts') - cue.lead;
    const marked = tw(t, at('llm') - cue.lead, cue.rise, outCubic);
    llmBlock(ctx, L, enter(t, partsAt, pace, 0), { glow: marked });
    appFrame(ctx, L, enter(t, partsAt, pace, 2) * others, { name: 'アプリ', note: 'LLM のまわりで働くプログラム' });
    toolBox(ctx, L, enter(t, partsAt, pace, 4) * others);
    const doc = L.doc;
    const docA = enter(t, partsAt, pace, 3) * others;
    ctx.fillStyle = C.rule;
    [0.72, 0.9, 0.5].forEach((f, i) => {
      ctx.globalAlpha = docA;
      ctx.fillRect(doc.x + 22, doc.y + 20 + i * 20, (doc.w - 44) * f, 6);
    });
    ctx.globalAlpha = 1;
    const links = enter(t, partsAt, pace, 5, outCubic);
    ctx.strokeStyle = C.ink2;
    ctx.fillStyle = C.ink2;
    ctx.lineWidth = 2.5;
    ctx.save();
    ctx.globalAlpha = others;
    const midY = L.llm.y + L.llm.h / 2;
    arrow(ctx, L.app.x - 14, midY - 16, L.llm.x + L.llm.w + 14, midY - 16, links, 12);
    arrow(ctx, L.llm.x + L.llm.w + 14, midY + 16, L.app.x - 14, midY + 16, links, 12);
    arrow(ctx, L.app.x + L.app.w + 14, midY - 16, L.tool.x - 14, midY - 16, links, 12);
    arrow(ctx, L.tool.x - 14, midY + 16, L.app.x + L.app.w + 14, midY + 16, links, 12);
    ctx.restore();
    tag(ctx, L.llm.x + L.llm.w / 2, L.llm.y + L.llm.h + 16, '中核', { font: F.jp(700, 20), h: 36, padX: 16, fill: C.accent, color: '#fff', alpha: marked, align: 'center' });

    // ——— the AI the viewer has used: it comes in as ずんだもん names it, and opens on the same
    // core as metan answers
    const gpt = at('gpt') - cue.lead;
    const inside = tw(t, at('core') - cue.lead, 0.6, inOutCubic);
    text(ctx, '対話型 AI サービス', CHAT.x, CHAT.y - 16, { font: F.jp(700, 20), color: C.ink2, alpha: enter(t, at('b3'), pace) });
    chatCard(ctx, CHAT.x, CHAT.y, {
      alpha: enter(t, gpt, pace),
      parts: [0, 1, 2].map((i) => enter(t, gpt, pace, i)),
      core: inside,
      coreLit: tw(t, at('core') - cue.lead, cue.rise, outCubic),
    });

    // ——— the name: the capitals travel to where their words start, then each word opens
    const c = at('c');
    const full = at('full');
    const drop = tw(t, c, 0.6, outCubic);
    if (drop > 0) {
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      const x = L.llm.x + L.llm.w / 2;
      line(ctx, x, L.llm.y + L.llm.h + 60, x, Y0 - BIG * 0.78, drop);
    }
    const lm = tw(t, at('lm') - cue.lead, cue.rise, outCubic); // the half the next clip takes
    const unfold = tw(t, full - 0.3, 0.9, inOutCubic);
    const reveal = tw(t, full + 0.4, 0.9, outCubic);
    words.forEach((wd, i) => {
      const rise = tw(t, c + 0.1 + i * 0.1, 0.7);
      if (rise <= 0) return;
      const k = lerp(BIG / size, 1, unfold);
      const x = lerp(wd.from, wd.to, unfold);
      const y = lerp(Y0, Y1, unfold) + (1 - rise) * 50;
      ctx.save();
      ctx.globalAlpha = rise * (i === 0 ? lerp(1, cue.dim, lm) : 1);
      ctx.translate(x, y);
      ctx.scale(k, k);
      ctx.beginPath();
      ctx.rect(-4, -size * 1.1, wd.initial + (wd.full - wd.initial) * reveal + 8, size * 1.4);
      ctx.clip();
      text(ctx, wd.w, 0, 0, { font: F.cond(700, size), color: C.ink });
      if (i > 0 && lm > 0) text(ctx, wd.w, 0, 0, { font: F.cond(700, size), color: C.accent, alpha: lm });
      ctx.restore();
    });
    const mark = tw(t, full + 1.0, 0.8);
    if (mark > 0) {
      ctx.fillStyle = C.accent;
      words.forEach((wd, i) => {
        const p = seg(mark, i * 0.15, i * 0.15 + 0.7);
        ctx.fillRect(wd.to, Y1 + 18, wd.initial * outExpo(p), 7);
      });
    }
    wipe(ctx, tw(t, at('ja') - cue.lead, 0.9, outCubic), M.l, JA_Y - 60, 700, 90, () => {
      text(ctx, JA[0], M.l, JA_Y, { font: JA_FONT, color: C.ink, alpha: lerp(1, cue.dim, lm) });
      text(ctx, JA[1], M.l + jaSplit, JA_Y, { font: JA_FONT, color: C.ink });
      text(ctx, JA[1], M.l + jaSplit, JA_Y, { font: JA_FONT, color: C.accent, alpha: lm });
    });
  },
});
