// The opening's skit: a road seen from the side, scrolling past as ずんだもん walks, and the
// tree she stops at. When she abstracts, the scenery fades and what is left is the right
// triangle of the tree (ground, trunk, line of sight) on squared paper — drawn by
// treeTriangle(), which the opening and 1-1 share so that 1-1 joins without a seam.

import { clamp, lerp } from '../../../src/kit/ease.js';
import { circle, text } from '../../../src/kit/draw.js';
import { hash } from '../../../src/kit/random.js';
import { C, F, W } from './theme.js';
import { corners, drawTri, angleAt, angleShape, dim, vertexLabel, RAD } from './tri.js';
import { drawSprite } from './figures.js';

// ——— the tree's triangle ————————————————————————————————————————————
// 18 m to the tree, 38° up to its top (an example). On the stage: A on the far edge of the
// road, the base 700 px long.
export const TREE = { deg: 38, A: { x: 380, y: 700 }, base: 700 };
export const treeCorners = (pose) => corners(TREE.deg, TREE.base, pose ?? { x: TREE.A.x, y: TREE.A.y });

const SC = {
  sky: '#cfe7f1',
  sky2: '#eef5ea',
  cloud: '#ffffff',
  hillFar: '#b4d3bc',
  hillNear: '#94c19c',
  wall: '#efe4d2',
  wall2: '#e2d6c2',
  roof: '#b8665a',
  roof2: '#6f7f99',
  pole: '#5d5750',
  field: '#cfe3a9',
  road: '#d6d1c6',
  roadEdge: '#bdb6a8',
  line: '#ffffff',
  near: '#b7d58f',
  trunk: '#8a6a4a',
  leaf: '#5b9c55',
  leaf2: '#78b46a',
};

const HORIZON = 610;
const ROAD_TOP = 700;
const ROAD_BOT = 800;

// The scenery, scrolled by `scroll` px (the distance walked) and faded by `alpha`. The tree
// is drawn by drawTree; the far layers move slower than the road.
// `total` is the distance walked when she stops: the poles are set from it, so that none
// stands by the tree or the labels when she does.
export function scenery(ctx, scroll, alpha, total = 0) {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, SC.sky);
  g.addColorStop(1, SC.sky2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, HORIZON);
  // clouds
  for (let i = 0; i < 6; i++) {
    const x = wrap(i * 330 + 120 - scroll * 0.06, -200, W + 200);
    const y = 90 + hash(i * 7) * 170;
    cloud(ctx, x, y, 0.7 + hash(i * 11) * 0.6);
  }
  // hills, far and near
  hills(ctx, scroll * 0.12, HORIZON, 120, SC.hillFar, 0.004, 0.011, 1);
  hills(ctx, scroll * 0.25, HORIZON + 6, 70, SC.hillNear, 0.007, 0.017, 2);
  // the field between the houses and the road
  ctx.fillStyle = SC.field;
  ctx.fillRect(0, HORIZON, W, ROAD_TOP - HORIZON);
  // houses along the field
  for (let i = 0; i < 9; i++) {
    const x = wrap(i * 260 + 60 - scroll * 0.45, -240, W + 240);
    house(ctx, x, HORIZON + 34, i);
  }
  // the road, its far edge at ROAD_TOP, a dashed centre line
  ctx.fillStyle = SC.road;
  ctx.fillRect(0, ROAD_TOP, W, ROAD_BOT - ROAD_TOP);
  ctx.fillStyle = SC.roadEdge;
  ctx.fillRect(0, ROAD_BOT - 6, W, 6);
  ctx.fillStyle = SC.line;
  for (let x = -((scroll % 120) + 120); x < W + 120; x += 120) ctx.fillRect(x, (ROAD_TOP + ROAD_BOT) / 2 - 3, 64, 6);
  ctx.fillStyle = SC.near;
  ctx.fillRect(0, ROAD_BOT, W, 900 - ROAD_BOT);
  // utility poles on the far edge, with their wires
  const span = 720;
  const off = 600 + total;
  const first = Math.floor((scroll - off - 400) / span);
  const poles = [];
  for (let k = first; k < first + 5; k++) poles.push(k * span + off - scroll);
  ctx.strokeStyle = SC.pole;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < poles.length - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(poles[i], 300);
    ctx.quadraticCurveTo((poles[i] + poles[i + 1]) / 2, 336, poles[i + 1], 300);
    ctx.stroke();
  }
  for (const x of poles) {
    ctx.fillStyle = SC.pole;
    ctx.fillRect(x - 5, 284, 10, ROAD_TOP - 284);
    ctx.fillRect(x - 30, 298, 60, 6);
  }
  ctx.restore();
}

const wrap = (x, lo, hi) => lo + ((((x - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));

function cloud(ctx, x, y, s) {
  ctx.fillStyle = SC.cloud;
  for (const [dx, dy, r] of [[0, 0, 34], [36, -14, 40], [76, 0, 32], [38, 12, 34]]) {
    circle(ctx, x + dx * s, y + dy * s, r * s);
    ctx.fill();
  }
}

function hills(ctx, off, base, amp, color, f1, f2, seed) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, base);
  for (let x = 0; x <= W; x += 16) {
    const u = x + off;
    const y = base - amp * (0.55 + 0.3 * Math.sin(u * f1 + seed) + 0.15 * Math.sin(u * f2 + seed * 3));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, base);
  ctx.closePath();
  ctx.fill();
}

function house(ctx, x, base, i) {
  const w = 120 + hash(i * 3) * 60;
  const h = 60 + hash(i * 5) * 34;
  ctx.fillStyle = i % 2 ? SC.wall : SC.wall2;
  ctx.fillRect(x, base - h, w, h);
  ctx.fillStyle = i % 3 ? SC.roof : SC.roof2;
  ctx.beginPath();
  ctx.moveTo(x - 10, base - h);
  ctx.lineTo(x + w / 2, base - h - 42);
  ctx.lineTo(x + w + 10, base - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9fb4c8';
  ctx.fillRect(x + 18, base - h + 18, 22, 20);
  ctx.fillRect(x + w - 40, base - h + 18, 22, 20);
}

// The tree with its root at (x, y) and its top `top` px above. Leaves fade with `leaves`.
export function drawTree(ctx, x, y, top, alpha = 1, leaves = 1) {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = SC.trunk;
  ctx.fillRect(x - 17, y - top * 0.58, 34, top * 0.58);
  ctx.globalAlpha *= leaves;
  const cy = y - top + 150;
  const blobs = [[0, 0, 150], [-96, 40, 96], [100, 44, 98], [-50, -66, 92], [56, -60, 96], [0, 70, 110]];
  ctx.fillStyle = SC.leaf;
  for (const [dx, dy, r] of blobs) {
    circle(ctx, x + dx, cy + dy, r);
    ctx.fill();
  }
  ctx.fillStyle = SC.leaf2;
  for (const [dx, dy, r] of [[-40, -40, 52], [50, -20, 40], [-80, 40, 34]]) {
    circle(ctx, x + dx, cy + dy, r);
    ctx.fill();
  }
  ctx.restore();
}

// ずんだもん on the stage, her bottom edge below the stage's: a bust in the foreground, as in
// a skit video. bob lifts her (px), tilt leans her (radians). Without the art, a plain
// rounded green shape stands in.
export function zundamon(ctx, x, o = {}) {
  const h = o.h ?? 380;
  const bottom = 912 - (o.bob ?? 0);
  if ((o.alpha ?? 1) <= 0.001) return;
  if (drawSprite(ctx, 'zunda', x, bottom, h, { mouth: o.mouth, eyes: o.eyes, alpha: o.alpha, tilt: o.tilt })) return;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.translate(x, bottom);
  ctx.rotate(o.tilt ?? 0);
  ctx.fillStyle = '#7cc56a';
  circle(ctx, 0, -h * 0.55, h * 0.36);
  ctx.fill();
  ctx.fillRect(-h * 0.3, -h * 0.3, h * 0.6, h * 0.3);
  ctx.fillStyle = '#fbe7cf';
  circle(ctx, 0, -h * 0.5, h * 0.22);
  ctx.fill();
  ctx.restore();
}

// A thought mark over her head: '!' or '?' in a round badge, popping in with `p`.
export function mark(ctx, x, y, s, p, color = C.accent) {
  if (p <= 0.001) return;
  const r = 34 * (0.6 + 0.4 * clamp(p * 1.4));
  ctx.save();
  ctx.globalAlpha *= clamp(p * 2);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  circle(ctx, x, y, r);
  ctx.fill();
  ctx.stroke();
  // a mark (!, ?), not a letter of a formula: in the sans face
  text(ctx, s, x, y + r * 0.42, { font: F.cond(700, r * 1.25), color, align: 'center' });
  ctx.restore();
}

// The tree's triangle as it stands once the scenery has gone: the three sides in their
// colours, the right angle, the 18 m under the base, the 38° at A and the unknown height.
// o: { pose, alpha, sides (0–1: drawn sides), labels (0–1, or { dist, ang, height, distP,
// angP, heightP }), height: label for the height, heightColor, heightSize, patch (alpha of a
// white plate under the height's label, to read it over the leaves), names (alpha of the
// corners' names A, B, C; none by default) }. Returns { T, box } — box holds the labels'
// boxes, for rings, and box.names the names' boxes by corner.
export function treeTriangle(ctx, o = {}) {
  const T = treeCorners(o.pose);
  const s = o.pose?.s ?? 1;
  const a = o.alpha ?? 1;
  const sides = o.sides ?? 1;
  drawTri(ctx, T, { alpha: a * sides, lw: 6, right: o.right ?? sides });
  const L = typeof o.labels === 'object' ? { dist: 1, ang: 1, height: 1, ...o.labels } : { dist: o.labels ?? 1, ang: o.labels ?? 1, height: o.labels ?? 1 };
  const k = Math.max(0.6, s);
  const distDim = dim(ctx, T.A, T.C, { x: 0, y: 1 }, 56 * k, '18 m', { alpha: L.dist * a, p: L.distP ?? 1, size: 34, color: C.cos, labelColor: C.cos });
  const dist = distDim.box;
  const ang = angleAt(ctx, T, 'A', { r: 84 * k, label: '38°', size: 32, alpha: L.ang * a, p: L.angP ?? 1, color: C.ink });
  const hl = o.height ?? '？';
  const heightDim = dim(ctx, T.C, T.B, { x: 1, y: 0 }, 56 * k, hl, {
    alpha: L.height * a,
    p: L.heightP ?? 1,
    size: o.heightSize ?? 40,
    color: C.sin,
    labelColor: o.heightColor ?? C.sin,
    patch: o.patch ?? 0,
  });
  const height = heightDim.box;
  // the corners' names keep clear of the dimension lines and every label
  const avoid = [...distDim.shapes, ...heightDim.shapes, angleShape(T.A, T.C, T.B, 84 * k)];
  const text = [dist, ang, height];
  const names = o.names == null ? null : Object.fromEntries(['A', 'B', 'C'].map((c) => [c, vertexLabel(ctx, T, c, c, { avoid, text, alpha: o.names * a })]));
  return { T, box: { dist, ang, height, names } };
}

export { RAD, lerp };
