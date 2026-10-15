// The mouth and eyes of a figure drawn on the stage, timed like the figure in the bar (spec
// §3.4): while one of the speaker's lines is voiced, the mouth follows the recording's mouth
// track; a line with no recording opens and shuts every 0.14 s; otherwise it is shut. The
// eyes blink for 0.12 s every 2–6 s, from a seeded sequence.

import manifest from '../voice/manifest.json';
import { hash } from '../../../src/kit/random.js';

function take(record, speed) {
  const takes = Object.entries(record?.takes ?? {});
  if (!takes.length) return null;
  takes.sort(([a], [b]) => Math.abs(a - speed) - Math.abs(b - speed) || b - a);
  return takes[0][1];
}

export function mouthAt(clipId, script, t, at, pace, speaker) {
  for (const line of script) {
    if (!line.text || (line.by ?? speaker) !== speaker) continue;
    const v = at(`${line.id}.voice`);
    const e = at(`${line.id}.end`);
    if (t < v || t >= e) continue;
    const tk = take(manifest.clips?.[clipId]?.[line.id], pace.voice.speed[line.speed ?? 'normal']);
    const u = t - v;
    if (tk?.mouth?.length) {
      let shape = 'x';
      for (const [s, m] of tk.mouth) {
        if (s > u) break;
        shape = m;
      }
      return shape;
    }
    return Math.floor(u / 0.14) % 2 ? 'x' : 'a';
  }
  return 'x';
}

export function eyesAt(seed, t) {
  let at = 0;
  for (let i = 0; i < 200; i++) {
    at += 2 + 4 * hash(seed * 977 + i);
    if (t < at) return 'open';
    if (t < at + 0.12) return 'closed';
  }
  return 'open';
}
