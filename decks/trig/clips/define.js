// 1-3: めたん cuts in. Joined from the end of 1-2 (lib/board.js draws both), she strikes out
// 「たてそこ比」: the ratios already have names. She sets the triangle in its usual pose,
// names the sides, and turns ずんだもん's three cards into the definitions of sin, cos and tan.
// Then the cursive s, c, t over three copies of the triangle — the side the pen passes first
// is the denominator — and "drum this into your head". The sheet shrinks into the corner for
// the exercises that follow (it stays there through 1-6).

import { clip } from '../lib/clip.js';
import { C } from '../lib/theme.js';
import { seg, tw, lerp, inOutCubic, outBack, clamp } from '../../../src/kit/ease.js';
import { focus, ringBox } from '../../../src/kit/cue.js';
import { drawTri, angleAt, mixTri, rightBox, pointBox } from '../lib/tri.js';
import { math, box } from '../lib/math.js';
import {
  board, boardCorners, ratioCard, ratioTable, tatesoko, CARD, TATE, ZUNDA_NAMES, METAN_NAMES,
  memo, memoPanel, MEMO_CORNER, drillTag, defCard, DEF_SLOT, definition,
} from '../lib/board.js';

const script = [
  { id: 'stop', by: 'metan', label: '待ちなさい', text: '{wait}待ちなさい！　その比には、もう{already}名前があるのよ。' },
  { id: 'who', label: 'め、めたん！？', speed: 'fast', rest: 'short', text: 'め、めたん！？　いつからそこにいたのだ！？' },
  { id: 'so', by: 'metan', label: '角度だけで決まる', text: '直角三角形の[辺|ヘン]の比が、{angle}角度だけで決まる。そこまでは、あなたの{found}見つけたとおりよ。' },
  { id: 'place', by: 'metan', label: 'θ を左下に', text: '{theta}角を [θ|シータ] として、[θ|シータ] が{bl}左下、直角が{br}右下に来るように置くわ。' },
  { id: 'names', by: 'metan', label: '斜辺、高さ、底辺', text: 'いちばん長い[辺|ヘン]が{hyp}斜辺、右の縦の[辺|ヘン]が{height}高さ、下の[辺|ヘン]が{base}底辺よ。' },
  { id: 'sin', by: 'metan', label: 'サイン', lead: 0.8, text: '{sinr}高さを斜辺で割った比を、[θ|シータ] の{sinname}サインと呼んで、[sin θ|サインシータ] と書くわ。' },
  { id: 'cos', by: 'metan', label: 'コサイン', text: '{cosr}底辺を斜辺で割った比は、{cosname}コサイン。[cos θ|コサインシータ] と書くの。' },
  { id: 'tan', by: 'metan', label: 'タンジェント', text: 'そして、{tanr}高さを底辺で割った比が、{tanname}タンジェント。[tan θ|タンジェントシータ] と書くのよ。' },
  { id: 'mine', label: 'たてそこ比は tan', text: 'ボクの{tate}「たてそこ比」は、タンジェントだったのだ……。' },
  { id: 'how', by: 'metan', label: '覚え方', lead: 1.4, text: '覚え方を教えるわ。三角形の上に、{cur}筆記体の [s|エス]、[c|シー]、[t|ティー] を書くの。' },
  { id: 's', by: 'metan', label: 's の書き方', text: '[sin|サイン] の [s|エス] は、{up}斜辺を上ってから、{down}高さを下りるわね。{den}先になぞる[辺|ヘン]が分母、{num}あとになぞる[辺|ヘン]が分子よ。' },
  { id: 'ct', by: 'metan', label: 'c と t', text: '{c}[cos|コサイン] の [c|シー] は、斜辺から底辺へ。{t}[tan|タンジェント] の [t|ティー] は、底辺から高さへ進むの。' },
  { id: 'drill', by: 'metan', label: '頭に叩き込む', text: 'まずはこれを覚えて、{bang}頭に叩き込みなさい。' },
  { id: 'cram', label: 'いきなり暗記', speed: 'fast', text: 'い、いきなり暗記なのだ！？' },
  { id: 'try', by: 'metan', label: '問題へ', text: '使っているうちに、意味もわかってくるわ。{go}さっそく、問題を解いてみましょう。' },
];

// ratio card i (her order: height/base, height/slant, base/slant) becomes definition slot j
const SLOT = [2, 0, 1];
const LETTER = ['t', 's', 'c'];
const NAMED = ['tanname', 'sinname', 'cosname'];
const KANA = { s: 'サイン', c: 'コサイン', t: 'タンジェント' };

export default clip({
  id: 'define',
  title: '三角比',
  kicker: 'sin・cos・tan',
  join: 'cut',
  cast: ['metan', 'zunda'],
  poster: 'drill.done',
  script,

  draw(ctx, t, _, { at, pace }) {
    const cue = pace.cue;
    const lead = cue.lead;

    // who: everything jumps at her entrance
    const jolt = Math.sin(Math.PI * seg(t, at('who.voice'), at('who.voice') + 0.5));
    ctx.translate(0, -10 * jolt);

    const how = at('how');
    const split = inOutCubic(seg(t, how, how + 1.4));
    const T0 = boardCorners();

    if (split < 1) {
      ctx.save();
      // ——— the board, turning into めたん's definitions
      const thetaMix = tw(t, at('theta') - lead, 0.5);
      const nameMix = {
        hyp: tw(t, at('hyp') - lead, 0.4),
        height: tw(t, at('height') - lead, 0.4),
        base: tw(t, at('base') - lead, 0.4),
      };
      if (split === 0) {
        const bd = board(ctx, { other: 1 - thetaMix, angle: thetaMix > 0.5 ? 'θ' : '38°', nameMix });
        const pose = focus(t, [at('bl'), at('br')], at('place.end'), cue);
        ringBox(ctx, [pointBox(T0.A), bd.angle], pose.level[0], C.accent);
        ringBox(ctx, rightBox(T0), pose.level[1], C.accent);
      } else {
        // the triangle splits into the three of the sheet
        for (let i = 0; i < 3; i++) {
          const U = mixTri(T0, memoPanel(i).T, split);
          drawTri(ctx, U, { lw: lerp(6, 5, split) });
          angleAt(ctx, U, 'A', { r: lerp(70, 58, split), label: 'θ', size: lerp(32, 30, split) });
        }
      }

      // the table she wanted goes: the names will carry it
      ratioTable(ctx, 720, 500, { alpha: 1 - tw(t, at('angle') - lead, 0.5) });

      // the cards: hers until the definitions take them over
      const names = {
        height: nameMix.height > 0.5 ? METAN_NAMES.height : ZUNDA_NAMES.height,
        base: ZUNDA_NAMES.base,
        hyp: nameMix.hyp > 0.5 ? METAN_NAMES.hyp : ZUNDA_NAMES.hyp,
      };
      const reorder = inOutCubic(seg(t, at('sin'), at('sin') + 0.8));
      const defLit = focus(t, [at('sinr'), at('cosr'), at('tanr')], at('tan.end'), cue);
      for (let i = 0; i < 3; i++) {
        const j = SLOT[i];
        const L = LETTER[i];
        const named = tw(t, at(NAMED[i]) - lead, 0.5);
        const y = lerp(CARD.y[i], DEF_SLOT.y[j] + (DEF_SLOT.h - CARD.h) / 2, reorder);
        // to the sheet: the definition moves under its panel
        if (split > 0) {
          const P = memoPanel('sct'.indexOf(L));
          const bx = box(definition(L), 46);
          const fx = lerp(DEF_SLOT.x + 34, P.fx - bx.w / 2, split);
          const fy = lerp(DEF_SLOT.y[j] + DEF_SLOT.h / 2 + 16, P.fy, split);
          defCard(ctx, j, L, { alpha: 1 - split });
          math(ctx, definition(L), fx, fy, { size: 46, alpha: split });
          continue;
        }
        ratioCard(ctx, CARD.x, y, i, { names, alpha: 1 - named, w: lerp(CARD.w, DEF_SLOT.w, reorder) });
        defCard(ctx, j, L, { alpha: named, name: KANA[L], lit: defLit.level['sct'.indexOf(L)] > 0.5 });
      }

      // 「たてそこ比」: struck out, then gone into the tan card
      const strike = seg(t, at('wait') - 0.1, at('wait') + 0.35);
      const fly = inOutCubic(seg(t, at('tate'), at('tate') + 0.9));
      const tx = lerp(TATE.x, DEF_SLOT.x + DEF_SLOT.w - 250, fly);
      const ty = lerp(TATE.y, DEF_SLOT.y[2] + 74, fly);
      tatesoko(ctx, tx, ty, { strike, alpha: (1 - seg(fly, 0.7, 1)) * (1 - split) });
      ctx.restore();
    }

    // ——— the sheet: the cursive s, c, t, and the frame around what to remember
    const sP = seg(t, at('up') - 0.15, at('down') + 0.9);
    const cP = seg(t, at('c') - 0.1, at('c') + 1.3);
    const tP = seg(t, at('t') - 0.1, at('t') + 1.3);
    const go = inOutCubic(seg(t, at('go') - 0.2, at('go') + 0.8));
    if (split >= 1) {
      const where = {
        x: lerp(0, MEMO_CORNER.x, go),
        y: lerp(0, MEMO_CORNER.y, go),
        s: lerp(1, MEMO_CORNER.s, go),
      };
      const frame = tw(t, at('bang') - lead, 0.4, outBack);
      const shake = Math.sin(t * 38) * 5 * Math.sin(Math.PI * seg(t, at('cram.voice'), at('cram.end')));
      memo(ctx, { ...where, x: where.x + shake * (1 - go), write: [sP, cP, tP], frame: clamp(frame) });
      // den, num: the parts of sin's definition as she names them (where memo() writes it)
      if (go === 0) {
        const P = memoPanel(0);
        const { parts } = math(ctx, definition('s'), P.fx, P.fy, { size: 44, align: 'center', alpha: 0 });
        const dn = focus(t, [at('den'), at('num')], at('s.end'), cue);
        ringBox(ctx, parts.den, dn.level[0], C.accent);
        ringBox(ctx, parts.num, dn.level[1], C.accent);
      }
    }
    drillTag(ctx, '演習', tw(t, at('go') + 0.4, 0.5));
  },
});

