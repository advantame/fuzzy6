import { isName } from './script.js';
import { mulberry32 } from '../kit/random.js';

const object = value => value && typeof value === 'object' && !Array.isArray(value);
const url = value => typeof value === 'string' && value.length > 0;
export function readCast(voice) {
  if (voice === undefined) return {};
  if (!object(voice) || Object.hasOwn(voice, 'speaker') || Object.hasOwn(voice, 'style'))
    throw new Error('voice.speaker/style is obsolete; use voice.cast');
  if (!object(voice.cast) || !Object.keys(voice.cast).length) throw new Error('voice.cast must contain a narrator');
  for (const [id, actor] of Object.entries(voice.cast)) {
    if (!isName(id) || !object(actor) || !url(actor.name)) throw new Error(`Invalid cast: ${id}`);
    if (actor.side !== undefined && !['left', 'right'].includes(actor.side)) throw new Error(`Invalid cast side: ${id}`);
    const f = actor.figure;
    if (f === undefined) continue;
    if (!actor.side) throw new Error(`Figure requires side: ${id}`);
    if (!object(f) || !Number.isFinite(f.width) || f.width <= 0 || !Number.isFinite(f.height) || f.height <= 0 || !url(f.base))
      throw new Error(`Invalid figure: ${id}`);
    if (!object(f.mouth) || !url(f.mouth.x) || !url(f.mouth.a) ||
        Object.entries(f.mouth).some(([shape, src]) => !['x', 'a', 'i', 'u', 'e', 'o', 'n'].includes(shape) || !url(src)))
      throw new Error(`Figure requires mouth.x and mouth.a (valid shapes only): ${id}`);
    if (f.eyes !== undefined && (!object(f.eyes) || !url(f.eyes.open) || !url(f.eyes.closed)))
      throw new Error(`Figure requires eyes.open and eyes.closed: ${id}`);
  }
  return voice.cast;
}
export function lineBy(line, cast) {
  if (line.by !== undefined && (!isName(line.by) || !Object.hasOwn(cast, line.by)))
    throw new Error(`Unknown narrator by: ${line.by}`);
  return line.by ?? Object.keys(cast)[0];
}
export function clipCast(clip, cast) {
  const spoken = [];
  if (Array.isArray(clip.script)) for (const line of clip.script) {
    const by = lineBy(line, cast); // Silent lines still validate their explicit by.
    if (line.text !== undefined && by !== undefined) spoken.push(by);
  }
  const ids = clip.cast === undefined ? [...new Set(spoken)] : clip.cast;
  if (!Array.isArray(ids)) throw new Error('clip.cast must be an array');
  const seen = new Set(), sides = new Set(), result = [];
  for (const id of ids) {
    if (!isName(id) || !Object.hasOwn(cast, id)) throw new Error(`Unknown clip.cast narrator: ${id}`);
    if (seen.has(id)) throw new Error(`Duplicate clip.cast narrator: ${id}`);
    seen.add(id);
    const actor = cast[id];
    if (!actor.figure) continue;
    if (sides.has(actor.side)) throw new Error(`Two figures on the same side: ${actor.side}`);
    sides.add(actor.side);
    result.push({ ...actor, id });
  }
  return result;
}
export function recordMatches(record, by, cast) {
  if (!record) return false;
  if ((record.by ?? Object.keys(cast)[0]) !== by) return false;
  // v1 has no per-line identity. Preserve its durations and silent/audio playback.
  return record.by === undefined || (record.speaker === cast[by]?.speaker && record.style === cast[by]?.style);
}
export function mouthShape(shape, images) {
  if (images[shape]) return shape;
  return ({ i: images.e ? 'e' : 'a', e: 'a', u: images.o ? 'o' : 'a', o: 'a', n: 'x' })[shape] ?? 'x';
}
// A minimum 2-second gap allows at most 90 blinks through 180 seconds, plus one
// lookahead. Recompute from the same seed to preserve the existing sequence prefix,
// never from elapsed wall time or the previous frame, including backwards seeks.
export function eyesAt(clipId, actorId, t) {
  let seed = 2166136261;
  for (const ch of `${clipId}/${actorId}`) seed = Math.imul(seed ^ ch.codePointAt(0), 16777619);
  const random = mulberry32(seed);
  let at = 0;
  for (let i = 0; i < 91; i++) {
    at += 2 + random() * 4;
    if (t < at) break;
    if (t < at + 0.12) return 'closed';
  }
  return 'open';
}
export function castAt(clipId, timeline, t) {
  const line = timeline.lines.find(l => l.spoken && l.voice <= t && t < l.end);
  return (timeline.cast ?? []).map(actor => {
    const speaking = line?.by === actor.id;
    let shape = 'x';
    if (speaking) {
      const offset = t - line.voice;
      shape = line.take?.mouth?.length
        ? line.take.mouth.findLast(([at]) => at <= offset + 1e-9)?.[1] ?? 'x'
        : Math.floor((offset + 1e-9) / 0.14) % 2 ? 'x' : 'a';
    }
    return { id: actor.id, side: actor.side, speaking, mouth: mouthShape(shape, actor.figure.mouth),
      eyes: actor.figure.eyes ? eyesAt(clipId, actor.id, t) : null };
  });
}
