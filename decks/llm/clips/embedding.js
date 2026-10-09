// Embeddings: a token becomes a long list of numbers; words with near meanings get near
// lists. The map is a picture (a flat stand-in for thousands of dimensions); the analogy
// king − man + woman ≈ queen is the result Mikolov et al. reported (2013): Queen is the
// word nearest to the computed vector.

import { clip } from '../lib/clip.js';
import { C, F, M, W } from '../lib/theme.js';
import { chip, example, caption } from '../lib/parts.js';
import { text, typed, circle, rr, line, arrow, quadPoints, path } from '../../../src/kit/draw.js';
import { tw, seg, inOutCubic, outBack } from '../../../src/kit/ease.js';

const VEC = ['0.21', '-1.37', '0.88', '0.05', '-0.62', '1.14', '-0.33', '0.70'];
const MAP = { x: 640, y: 150, w: W - M.r - 640, h: 640 };
const GROUPS = [
  { name: '動物', cx: 900, cy: 356, r: 124, words: [['猫', 920, 356], ['犬', 1000, 308], ['馬', 830, 300], ['鳥', 852, 414]] },
  { name: '食べ物', cx: 900, cy: 640, r: 140, words: [['パン', 830, 610], ['りんご', 960, 680], ['寿司', 860, 712], ['ラーメン', 980, 590]] },
  { name: '都市', cx: 1310, cy: 470, r: 140, words: [['東京', 1300, 440], ['大阪', 1380, 500], ['パリ', 1240, 530], ['ロンドン', 1360, 390]] },
];
const MAP_AT = 5.8;
const ANALOGY = 11.2;
// analogy points, in the left column
const AN = { man: [150, 800], woman: [380, 800], king: [190, 690], queen: [420, 690] };

export default clip({
  id: 'embedding',
  title: '意味を数の並びに',
  kicker: '埋め込み（ベクトル）',
  duration: 17,
  cues: [
    { at: 0.4, to: 5.6, text: 'トークンは、たくさんの数の並び、**ベクトル**に置き換えられる。\nGPT-3 では 1 トークンあたり 12,288 個。' },
    { at: 5.8, to: 11.0, text: '意味の近い語ほど、ベクトルも近くなる。\nこの配置は、学習の中で決まっていく。' },
    { at: 11.2, to: 18, text: '2013 年のミコロフらの研究では、\n「王 − 男 + 女」の計算結果に最も近い語が「女王」だった。' },
  ],

  draw(ctx, t) {
    // ——— one token, one vector
    const c = tw(t, 0.3, 0.6, (p) => outBack(p, 1.6));
    chip(ctx, M.l, 170, '猫', { font: F.jp(700, 56), h: 84, padX: 24, fill: C.tints[0], alpha: Math.min(1, c) });
    ctx.strokeStyle = C.ink;
    ctx.fillStyle = C.ink;
    ctx.lineWidth = 3;
    arrow(ctx, M.l + 120, 212, M.l + 196, 212, tw(t, 0.9, 0.5), 14);
    const vx = M.l + 220;
    // bracket
    const br = tw(t, 1.1, 0.5);
    if (br > 0) {
      ctx.globalAlpha = br;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(vx + 12, 150);
      ctx.lineTo(vx, 150);
      ctx.lineTo(vx, 470);
      ctx.lineTo(vx + 12, 470);
      ctx.moveTo(vx + 168, 150);
      ctx.lineTo(vx + 180, 150);
      ctx.lineTo(vx + 180, 470);
      ctx.lineTo(vx + 168, 470);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    VEC.forEach((v, i) => {
      const a = tw(t, 1.3 + i * 0.12, 0.3);
      text(ctx, v, vx + 150, 186 + i * 34, { font: F.mono(500, 24), color: C.ink, align: 'right', alpha: a });
    });
    text(ctx, '⋮', vx + 112, 474, { font: F.sans(600, 26), color: C.ink, align: 'center', alpha: tw(t, 2.4, 0.4) });
    text(ctx, typed('GPT-3 では 12,288 個', seg(t, 2.6, 3.4)), M.l, 520, { font: F.jp(700, 24), color: C.ink2 });
    example(ctx, M.l, 540, tw(t, 3.0, 0.5), '数は説明のための例');

    // ——— the map of meanings
    const m = tw(t, MAP_AT, 0.6);
    if (m > 0) {
      ctx.save();
      ctx.globalAlpha = m;
      rr(ctx, MAP.x, MAP.y, MAP.w, MAP.h, 18);
      ctx.fillStyle = '#efebe1';
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 2;
      ctx.stroke();
      caption(ctx, '意味の地図（平面に描いた例）', MAP.x + MAP.w - 24, MAP.y + MAP.h - 24, { font: F.jp(500, 19), color: C.muted, ls: 0, align: 'right' });
      ctx.restore();
      GROUPS.forEach((g, gi) => {
        const ga = tw(t, MAP_AT + 0.6 + gi * 0.7, 0.6);
        if (ga <= 0) return;
        ctx.save();
        ctx.globalAlpha = ga * 0.55;
        ctx.fillStyle = C.tints[[0, 4, 3][gi]];
        circle(ctx, g.cx, g.cy, g.r * (0.85 + 0.15 * ga));
        ctx.fill();
        ctx.restore();
        text(ctx, g.name, g.cx, g.cy - g.r - 12, { font: F.jp(700, 22), color: C.ink2, align: 'center', alpha: ga });
        g.words.forEach(([w, x, y], wi) => {
          if (gi === 0 && wi === 0) return; // 猫 arrives from the vector
          const p = tw(t, MAP_AT + 0.8 + gi * 0.7 + wi * 0.1, 0.5, (q) => outBack(q, 2));
          if (p <= 0) return;
          ctx.fillStyle = C.ink;
          circle(ctx, x, y, 7 * Math.min(1.2, p));
          ctx.fill();
          text(ctx, w, x + 14, y + 9, { font: F.jp(500, 26), color: C.ink, alpha: Math.min(1, p) });
        });
      });
      // 猫 travels from its vector into the animal group
      const fly = seg(t, MAP_AT + 0.4, MAP_AT + 1.6);
      if (fly > 0) {
        const [, x, y] = GROUPS[0].words[0];
        const pts = quadPoints(vx + 190, 300, (vx + 190 + x) / 2, 120, x, y, 40);
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 8]);
        const end = path(ctx, pts, inOutCubic(fly));
        ctx.setLineDash([]);
        if (end) {
          ctx.fillStyle = C.accent;
          circle(ctx, end.x, end.y, 9);
          ctx.fill();
        }
        if (fly >= 1) text(ctx, '猫', x + 14, y + 9, { font: F.jp(700, 26), color: C.accent });
      }
    }

    // ——— king − man + woman ≈ queen
    const a = tw(t, ANALOGY, 0.6);
    if (a <= 0) return;
    // the left column clears for the analogy
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = C.paper;
    ctx.fillRect(M.l - 8, 590, 520, 260);
    ctx.restore();
    text(ctx, '王 − 男 + 女 ≈ 女王', M.l, 616, { font: F.jp(700, 32), color: C.ink, alpha: a });
    text(ctx, 'ミコロフら（2013）', M.l + 330, 615, { font: F.sans(500, 20), color: C.muted, alpha: a });
    const pts = { ...AN };
    Object.entries(pts).forEach(([k, [x, y]], i) => {
      const p = tw(t, ANALOGY + 0.3 + i * 0.12, 0.4, (q) => outBack(q, 2));
      ctx.fillStyle = k === 'queen' ? C.accent : C.ink;
      circle(ctx, x, y, 8 * Math.min(1.2, p));
      ctx.fill();
      const name = { man: '男 man', woman: '女 woman', king: '王 king', queen: '女王 queen' }[k];
      text(ctx, name, x, y + (y > 740 ? 38 : -20), { font: F.jp(700, 22), color: k === 'queen' ? C.accent : C.ink, align: 'center', alpha: Math.min(1, p) });
    });
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.blue;
    ctx.fillStyle = C.blue;
    arrow(ctx, AN.man[0] + 12, AN.man[1], AN.woman[0] - 14, AN.woman[1], tw(t, ANALOGY + 1.0, 0.6, inOutCubic), 13);
    ctx.strokeStyle = C.accent;
    ctx.fillStyle = C.accent;
    arrow(ctx, AN.king[0] + 12, AN.king[1], AN.queen[0] - 14, AN.queen[1], tw(t, ANALOGY + 1.6, 0.6, inOutCubic), 13);
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 6]);
    line(ctx, AN.man[0], AN.man[1] - 10, AN.king[0], AN.king[1] + 10, tw(t, ANALOGY + 0.8, 0.5));
    line(ctx, AN.woman[0], AN.woman[1] - 10, AN.queen[0], AN.queen[1] + 10, tw(t, ANALOGY + 0.8, 0.5));
    ctx.setLineDash([]);
  },
});
