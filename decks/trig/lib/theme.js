// The look of the trig deck on the stage: squared paper, black ink, and one colour for each
// ratio — the height (sin) in blue, the base (cos) in green, tan in purple. Vermilion is the
// signal: emphasis and answers only. The chrome around the stage is ../theme.css.

import chars from 'virtual:chars/decks/trig';

export const C = {
  paper: '#f6f3eb',
  grid: '#e4dfd2',
  gridBold: '#d8d1c1',
  panel: '#ece7db',
  ink: '#151412',
  ink2: '#45413a',
  muted: '#7d776c',
  rule: '#d5cec0',
  accent: '#ff5a1f',
  accentSoft: '#ffdccd',
  sin: '#2f5bea',
  sinSoft: '#dce4ff',
  cos: '#178f53',
  cosSoft: '#d3efdd',
  tan: '#8a3fd1',
  tanSoft: '#ecdffa',
  white: '#ffffff',
};

const FAMILY = {
  jp: '"IBM Plex Sans JP", "IBM Plex Sans", sans-serif',
  sans: '"IBM Plex Sans", "IBM Plex Sans JP", sans-serif',
  cond: '"IBM Plex Sans Condensed", "IBM Plex Sans JP", sans-serif',
  mono: '"IBM Plex Mono", "IBM Plex Sans JP", monospace',
};

// F.jp(700, 48) → '700 48px "IBM Plex Sans JP", …'. F.it is the italic for letters in formulas.
export const F = {
  ...Object.fromEntries(Object.entries(FAMILY).map(([k, fam]) => [k, (w, px) => `${w} ${px}px ${fam}`])),
  it: (w, px) => `italic ${w} ${px}px ${FAMILY.sans}`,
};

// Every face the clips draw with, loaded before the first frame (spec §6.4). The Japanese
// faces get every non-ASCII character found in this deck's source files.
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const SYMBOLS = 'θαβ°²³√−×÷±·…“”’–—→←↑↓≈';
export const FONTS = [
  ...[400, 500, 700].map((w) => [`${w} 32px "IBM Plex Sans JP"`, ASCII + chars]),
  ...[400, 500, 600].map((w) => [`${w} 32px "IBM Plex Sans"`, ASCII + SYMBOLS]),
  ...[400, 500].map((w) => [`italic ${w} 32px "IBM Plex Sans"`, ASCII + SYMBOLS]),
  ...[500, 600, 700].map((w) => [`${w} 32px "IBM Plex Sans Condensed"`, ASCII + SYMBOLS]),
  ...[400, 500, 600].map((w) => [`${w} 32px "IBM Plex Mono"`, ASCII + SYMBOLS]),
];

export const W = 1600;
export const H = 900;
// the squared paper: one square is 40 px, every fifth line is a little darker
export const SQ = 40;
