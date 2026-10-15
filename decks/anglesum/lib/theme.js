// The look of the angle-sum deck on the stage: paper, black ink, and one colour for each corner
// of the triangle — A (with α and θ₃) in blue, B (β, θ₁) in green, C (γ, θ₂) in purple — so an
// angle reads the same in both proofs. Vermilion is the signal: emphasis and answers only. The
// chrome around the stage is ../theme.css.

import chars from 'virtual:chars/decks/anglesum';

export const C = {
  paper: '#f6f3eb',
  grid: '#e6e1d5',
  gridBold: '#d9d2c3',
  ink: '#151412',
  ink2: '#45413a',
  muted: '#8a8478',
  rule: '#d5cec0',
  accent: '#ff5a1f',
  accentSoft: '#ffdccd',
  A: '#2f5bea',
  ASoft: '#dce4ff',
  B: '#178f53',
  BSoft: '#d3efdd',
  C: '#8a3fd1',
  CSoft: '#ecdffa',
  white: '#ffffff',
  // the first and second components of a vector (chapter 1)
  x1: '#b8770b',
  x2: '#0e7f8f',
};

// the colour of each corner, and of the turn that happens there (θ₁ at B, θ₂ at C, θ₃ at A)
export const CORNER = { A: C.A, B: C.B, C: C.C };
export const SOFT = { A: C.ASoft, B: C.BSoft, C: C.CSoft };

// Numbers and Latin letters drawn with fillText are set in Computer Modern (KaTeX's faces), and
// Japanese in IBM Plex Sans JP: the faces are listed in that order, so a label like 「長さ 1」
// takes each character from the right one. Formulas themselves are drawn by MathJax (lib/math.js).
const MATH = '"KaTeX_Main"';
const FAMILY = {
  jp: `${MATH}, "IBM Plex Sans JP", sans-serif`,
  plain: '"IBM Plex Sans JP", sans-serif',
};

// F.jp(700, 48) → '700 48px "KaTeX_Main", "IBM Plex Sans JP", sans-serif'.
export const F = Object.fromEntries(Object.entries(FAMILY).map(([k, fam]) => [k, (w, px) => `${w} ${px}px ${fam}`]));

// Every face the clips draw with, loaded before the first frame (spec §6.4). The Japanese
// faces get every non-ASCII character found in this deck's source files.
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const SYMBOLS = 'θαβγπ°²³√−×±·…→←↑↓≈∞';
export const FONTS = [
  ...[400, 700].map((w) => [`${w} 32px "KaTeX_Main"`, ASCII + SYMBOLS]),
  ['italic 400 32px "KaTeX_Math"', ASCII],
  ...[400, 500, 700].map((w) => [`${w} 32px "IBM Plex Sans JP"`, ASCII + chars]),
];

export const W = 1600;
export const H = 900;
