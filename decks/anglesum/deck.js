// The angle-sum deck: "the sum of a triangle's interior angles is π rad", proved twice from a
// definition of angle as arc length on the unit circle (README.md has the plan and the two
// proofs it follows). めたん defines and proves step by step; ずんだもん reads the figures and
// asks what the next step answers.

import { FONTS } from './lib/theme.js';
import manifest from './voice/manifest.json';
import lexicon from './voice/lexicon.js';
import { standing, hasFigures } from './lib/figures.js';
import opening from './clips/opening.js';
import norm from './clips/norm.js';
import arc from './clips/arc.js';
import angle from './clips/angle.js';
import rotate from './clips/rotate.js';
import edges from './clips/edges.js';
import det from './clips/det.js';
import equal from './clips/equal.js';
import turn from './clips/turn.js';
import once from './clips/once.js';
import interior from './clips/interior.js';
import place from './clips/place.js';
import ray from './clips/ray.js';
import speed from './clips/speed.js';
import integral from './clips/integral.js';
import alpha from './clips/alpha.js';
import beta from './clips/beta.js';
import gamma from './clips/gamma.js';
import whole from './clips/whole.js';
import parallel from './clips/parallel.js';

// The narration is synthesised ahead of time (spec §7.1, `npm run narrate -- anglesum`).
const audio = import.meta.glob('./voice/**/*.opus', { eager: true, query: '?url', import: 'default' });

export default {
  id: 'anglesum',
  title: '三角形の内角の和',
  subtitle: '角度を弧で決めて、二通りに証明する',
  autoAdvance: true,
  fonts: FONTS,
  frame: { gutter: 120 },
  voice: {
    // めたん leads: every line that names no one is hers.
    cast: {
      metan: { name: '四国めたん', speaker: '四国めたん', style: 'ノーマル', credit: 'VOICEVOX:四国めたん', ...standing('metan', 'left') },
      zunda: { name: 'ずんだもん', speaker: 'ずんだもん', style: 'ノーマル', credit: 'VOICEVOX:ずんだもん', ...standing('zunda', 'right') },
    },
    lexicon,
    manifest,
    url: (file) => audio[`./voice/${file}`],
  },
  credits: [...(hasFigures ? ['立ち絵:akihiyo'] : [])],
  chapters: [
    { id: 'angle', title: '角度', clips: [opening, norm, arc, angle, rotate] },
    { id: 'proof1', title: '証明 1', clips: [edges, det, equal, turn, once, interior] },
    { id: 'proof2', title: '証明 2', clips: [place, ray, speed, integral, alpha, beta, gamma, whole, parallel] },
  ],
};
