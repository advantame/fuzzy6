// 1948, Shannon: English made from probabilities. Each row is typed out as if generated; the
// tinted box behind the caret is what the row "looks at" to choose the next symbol.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { COL, yearBlock, marker } from '../lib/parts.js';
import { text, measure } from '../../../src/kit/draw.js';
import { tw, seg, outCubic } from '../../../src/kit/ease.js';

// Shannon (1948), §3 "The series of approximations to English", as printed in the July 1948
// BSTJ original (the later corrected reprint differs: SGHYD for SGXYD, and adds full stops).
// `look` is how many preceding letters choose the next one ('word' = the preceding word).
const ROWS = [
  { n: '0 次', how: '文字と空白を等しい確率で選ぶ', look: 0, s: 'XFOML RXKHRJFFJUJ ZLPWCFWKCYJ FFJEYVKCQSGXYD QPAAMKBZAACIBZLHJQD' },
  { n: '1 次', how: '英語の文字の頻度で選ぶ', look: 0, s: 'OCRO HLI RGWR NMIELWIS EU LL NBNESEBYA TH EEI ALHENHTTPA OOBTTVA NAH BRL' },
  { n: '2 次', how: '前の 1 文字から次を選ぶ', look: 1, s: 'ON IE ANTSOUTINYS ARE T INCTORE ST BE S DEAMY ACHIN D ILONASIVE TUCOOWE AT TEASONARE FUSO TIZIN ANDY TOBE SEACE CTISBE' },
  { n: '3 次', how: '前の 2 文字から次を選ぶ', look: 2, s: 'IN NO IST LAT WHEY CRATICT FROURE BIRS GROCID PONDENOME OF DEMONSTURES OF THE REPTAGIN IS REGOACTIONA OF CRE' },
  { n: '単語', how: '前の 1 語から次の語を選ぶ', look: 'word', s: 'THE HEAD AND IN FRONTAL ATTACK ON AN ENGLISH WRITER THAT THE CHARACTER OF THIS POINT IS THEREFORE ANOTHER METHOD FOR THE LETTERS THAT THE TIME OF WHO EVER TOLD THE PROBLEM FOR AN UNEXPECTED' },
];

const TOP = 150;
const STEP = 128;
const START = 1.4;
const GAP = 2.15;
const CPS = 52; // characters typed per second
const MONO = F.mono(400, 22);
const READABLE = 'THE HEAD AND IN FRONTAL ATTACK ON AN ENGLISH WRITER';

export default clip({
  id: 'shannon',
  title: '次の文字を当てる',
  kicker: '1948 · シャノン',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.0, text: '1948 年、クロード・シャノンは英文を**確率**で作ってみせた。' },
    { at: 5.2, to: 10.8, text: '次の文字を、前の何文字かを手がかりに選ぶ。\n手がかりを増やすほど、英語らしくなる。' },
    { at: 11.0, to: 18, text: '前の文脈から**次を予測する**。\nいまの LLM も、この考え方の上にある。' },
  ],

  prepare(ctx) {
    const maxW = W - M.r - COL;
    const rows = ROWS.map((r) => {
      // cut long samples at a word boundary so each fits on one line, ending in "…"
      let s = r.s;
      if (measure(ctx, MONO, s) > maxW) {
        const words = s.split(' ');
        s = '';
        for (const w of words) {
          if (measure(ctx, MONO, `${s}${s ? ' ' : ''}${w} …`) > maxW) break;
          s += (s ? ' ' : '') + w;
        }
        s += ' …';
      }
      return { ...r, s, cw: measure(ctx, MONO, 'M') };
    });
    return { rows };
  },

  draw(ctx, t, { rows }) {
    yearBlock(ctx, t, { year: '1948', who: 'Claude E. Shannon', what: ['A Mathematical Theory', 'of Communication'] });

    rows.forEach((r, i) => {
      const at = START + i * GAP;
      const y = TOP + i * STEP;
      const a = tw(t, at, 0.6);
      if (a <= 0) return;
      const dy = (1 - a) * 14;
      const nw = text(ctx, r.n, COL, y + dy, { font: F.jp(700, 24), color: C.accent, alpha: a });
      text(ctx, r.how, COL + Math.max(nw, 64) + 16, y + dy, { font: F.jp(500, 22), color: C.ink2, alpha: a });

      // typing
      const chars = Array.from(r.s);
      const n = Math.min(chars.length, Math.floor(Math.max(0, t - at - 0.35) * CPS));
      const typedS = chars.slice(0, n).join('');
      const ty = y + 50;
      // what this row looks at while choosing the next symbol
      if (n > 0 && n < chars.length && r.look) {
        let from = Math.max(0, n - r.look);
        let to = n;
        if (r.look === 'word') {
          // the word before the one being typed
          const space = typedS.lastIndexOf(' ');
          from = space < 0 ? n : typedS.lastIndexOf(' ', space - 1) + 1;
          to = space < 0 ? n : space;
        }
        const x0 = COL + measure(ctx, MONO, chars.slice(0, from).join(''));
        const w = measure(ctx, MONO, chars.slice(from, to).join(''));
        if (w > 0) {
          ctx.fillStyle = C.accentSoft;
          ctx.fillRect(x0 - 2, ty - 22, w + 4, 30);
        }
      }
      // the readable stretch of the word-level row, underlined once it is all there
      if (r.look === 'word') {
        const p = tw(t, START + 4 * GAP + 0.35 + chars.length / CPS + 0.4, 1.0, outCubic);
        marker(ctx, COL, ty + 10, measure(ctx, MONO, READABLE), 4, p, C.accent);
      }
      text(ctx, typedS, COL, ty, { font: MONO, color: C.ink });
      if (n < chars.length && t > at + 0.2 && Math.floor(t * 3) % 2 === 0) {
        ctx.fillStyle = C.accent;
        ctx.fillRect(COL + measure(ctx, MONO, typedS) + 2, ty - 21, 3, 28);
      }
    });

    // the rows' thread: a thin rule tying the five steps together
    const thread = seg(t, START, START + 4 * GAP + 0.6);
    if (thread > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(COL - 28, TOP - 22, 2, (4 * STEP + 58) * thread);
    }
  },
});
