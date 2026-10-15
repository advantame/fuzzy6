// The trigonometry deck: from a right triangle to adding waves. ずんだもん works things out
// from nothing and drives the story; めたん explains, names and corrects (README.md has the
// plan). Chapter 1 is built; the later chapters are planned in the README.

import { FONTS } from './lib/theme.js';
import manifest from './voice/manifest.json';
import lexicon from './voice/lexicon.js';
import { standing, hasFigures } from './lib/figures.js';
import opening from './clips/opening.js';
import small from './clips/small.js';
import discover from './clips/discover.js';
import define from './clips/define.js';
import extree from './clips/extree.js';
import ladder from './clips/ladder.js';
import turn from './clips/turn.js';
import special from './clips/special.js';
import relations from './clips/relations.js';
import complement from './clips/complement.js';
import slope from './clips/slope.js';

// The narration is synthesised ahead of time (spec §7.1, `npm run narrate -- trig`).
const audio = import.meta.glob('./voice/**/*.opus', { eager: true, query: '?url', import: 'default' });

export default {
  id: 'trig',
  title: '三角関数',
  subtitle: '直角三角形から、波の合成まで',
  autoAdvance: true,
  fonts: FONTS,
  frame: { gutter: 120 },
  voice: {
    // ずんだもん leads: every line that names no one is hers.
    cast: {
      zunda: { name: 'ずんだもん', speaker: 'ずんだもん', style: 'ノーマル', credit: 'VOICEVOX:ずんだもん', ...standing('zunda', 'right') },
      metan: { name: '四国めたん', speaker: '四国めたん', style: 'ノーマル', credit: 'VOICEVOX:四国めたん', ...standing('metan', 'left') },
    },
    lexicon,
    manifest,
    url: (file) => audio[`./voice/${file}`],
  },
  credits: [...(hasFigures ? ['立ち絵:akihiyo'] : [])],
  chapters: [
    { id: 'ratio', title: '三角比', clips: [opening, small, discover, define, extree, ladder, turn, special, relations, complement, slope] },
  ],
};
