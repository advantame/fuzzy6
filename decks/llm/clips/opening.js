// Opening: the deck is about AI agents. A request goes in, the agent works through its steps
// by itself and reports back; the last sentence turns to the box and asks what is inside. The
// deck's subtitle is written one token at a time (the real o200k_base split) as the promise.
//
// The picture is lib/cover.js: 1-1 starts from this clip's last frame and opens the box
// (spec §6.10). The last frame is also the deck's cover on the home page (src/home).

import { clip } from '../lib/clip.js';
import { SUB, LOG, USES, BOX, DONE, coverLayout, coverTitle, coverBox, coverSides, coverAsk } from '../lib/cover.js';
import { tw, seg, lerp, outCubic } from '../../../src/kit/ease.js';
import { enter } from '../../../src/kit/cue.js';

const SUB_STEP = 0.1; // seconds per token of the subtitle
const FLASH = 0.6; // how long a token's tint takes to fade once it is written

export default clip({
  id: 'opening',
  title: 'AI エージェント',
  kicker: 'その中を、土台から',
  numbered: false,
  cast: ['metan', 'zunda'],
  script: [
    { id: 'a', text: 'これから、{title}AI エージェントの話をするわ。' },
    {
      id: 'b',
      still: true,
      tail: 0.9,
      text: '{ask}頼んだ仕事を、{look}自分で調べ、{tool}道具を使いながら、\n{done}最後まで進めようとする AI のことよ。',
    },
    { id: 'c', text: 'いまでは、{use}仕事のあちこちで使われるようになったわね。' },
    { id: 'd', tail: 0.8, text: '{inside}その中がどうなっているのかを、\n{base}土台から順に見ていくわ。' },
  ],

  prepare: coverLayout,

  draw(ctx, t, s, { at, pace, duration }) {
    const cue = pace.cue;

    // The box is the ground of sentence b; the request, the steps and the report arrive as
    // the voice reaches them.
    const asked = at('ask');
    const steps = [at('look'), at('tool'), lerp(at('tool'), at('done'), 0.5), at('done')].map((x) => x - cue.lead);
    const finish = at('b.end') + 0.2;
    const use = at('use') - cue.lead;
    const base = at('base');

    // the last frame is the finished picture whatever the timeline: 1-1 starts from it
    const v = t >= duration ? DONE : {
      rise: tw(t, at('a') + 0.1, 0.8),
      mark: tw(t, at('title') - cue.lead, 0.7, outCubic),
      sub: SUB.map((_, i) => {
        const on = base + i * SUB_STEP;
        return t < on ? { on: 0, flash: 0 } : { on: tw(t, on, 0.25), flash: 1 - seg(t, on + 0.15, on + 0.15 + FLASH) };
      }),
      box: enter(t, at('b'), pace),
      steps: LOG.map((_, i) => {
        const end = i < LOG.length - 1 ? steps[i + 1] : finish;
        return { on: tw(t, steps[i], pace.enter), ok: seg(t, end, end + 0.25) };
      }),
      ask: tw(t, asked - cue.lead, pace.enter),
      typed: seg(t, asked, asked + 0.6),
      sent: tw(t, asked + 0.3, 0.5, outCubic),
      back: tw(t, finish, 0.5, outCubic),
      result: tw(t, finish + 0.1, pace.enter),
      usesLabel: tw(t, use, pace.enter),
      uses: USES.map((_, i) => enter(t, use + 0.1, pace, i)),
      inside: tw(t, at('inside') - cue.lead, cue.rise + 0.2, outCubic),
      spin: t,
    };

    coverTitle(ctx, s, v);
    coverBox(ctx, BOX, v);
    coverSides(ctx, s, v);
    coverAsk(ctx, v);
  },
});
