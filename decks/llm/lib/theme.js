// The look of the LLM deck on the stage: warm paper, black ink, one vermilion signal.
// The chrome around the stage is styled in ../theme.css with the same palette.

import chars from 'virtual:chars/decks/llm';

export const C = {
  paper: '#f4f1e9',
  panel: '#ebe6da',
  ink: '#151412',
  ink2: '#45413a',
  muted: '#7d776c',
  rule: '#d5cec0',
  grid: '#e2dccf',
  accent: '#ff5a1f',
  accentSoft: '#ffdccd',
  blue: '#2f5bea',
  blueSoft: '#d9e2ff',
  green: '#178f53',
  greenSoft: '#cfeeda',
  red: '#d42a20',
  // token chips cycle through these
  tints: ['#ffd5c0', '#cdebd5', '#ddd5ff', '#cfe2ff', '#ffeca6', '#ffd0db'],
};

const FAMILY = {
  jp: '"IBM Plex Sans JP", "IBM Plex Sans", sans-serif',
  sans: '"IBM Plex Sans", "IBM Plex Sans JP", sans-serif',
  cond: '"IBM Plex Sans Condensed", "IBM Plex Sans JP", sans-serif',
  mono: '"IBM Plex Mono", "IBM Plex Sans JP", monospace',
};

// F.jp(700, 48) → '700 48px "IBM Plex Sans JP", …'
export const F = Object.fromEntries(
  Object.entries(FAMILY).map(([k, fam]) => [k, (w, px) => `${w} ${px}px ${fam}`]),
);

// Every face the clips draw with, loaded before the first frame (spec §6.4). The Japanese
// faces get every non-ASCII character found in this deck's source files.
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const SYMBOLS = '·×−→←↑↓≈≤≥…“”‘’–—';
export const FONTS = [
  ...[400, 500, 700].map((w) => [`${w} 32px "IBM Plex Sans JP"`, ASCII + chars]),
  ...[400, 500, 600].map((w) => [`${w} 32px "IBM Plex Sans"`, ASCII + SYMBOLS]),
  ...[500, 600, 700].map((w) => [`${w} 32px "IBM Plex Sans Condensed"`, ASCII + SYMBOLS]),
  ...[400, 500, 600].map((w) => [`${w} 32px "IBM Plex Mono"`, ASCII + SYMBOLS]),
];

export const W = 1600;
export const H = 900;
// the stage's margins
export const M = { l: 96, r: 96, t: 80, b: 72 };
