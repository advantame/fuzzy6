import { resolveDoors } from './dive.js';
import { validateBridge } from './model.js';
import { readCast, lineBy, clipCast, recordMatches } from './cast.js';
import { PACE } from './pace.js';
import { parseLine, isName } from './script.js';

export const roundTime = n => Math.round(n * 1000) / 1000;
const copy = value => structuredClone(value);
export function mergePace(...patches) {
  const result = copy(PACE);
  const merge = (into, patch, path = '') => {
    if (patch === undefined) return;
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error(`Invalid pace: ${path || 'pace'}`);
    for (const key of Object.keys(into)) {
      if (patch?.[key] === undefined) continue;
      if (typeof into[key] === 'object') merge(into[key], patch[key], path ? `${path}.${key}` : key);
      else into[key] = patch[key];
    }
  };
  for (const patch of patches) merge(result, patch);
  const validate = (object, shape = PACE, path = '') => {
    for (const [key, n] of Object.entries(object)) {
      const name = path ? `${path}.${key}` : key;
      if (typeof shape[key] === 'object') validate(n, shape[key], name);
      else if (name === 'cue.stay') {
        if (!['next', 'phrase'].includes(n)) throw new Error('Invalid cue.stay');
      } else if (!Number.isFinite(n) || n < 0 ||
        ((name.startsWith('voice.speed.') || name === 'voice.cps' || name === 'skip') && n === 0))
        throw new Error(`Invalid pace: ${name}`);
    }
  };
  validate(result);
  return result;
}
export function lineSpeed(source, pace) {
  if (source.speed !== undefined && !['slow', 'normal', 'fast'].includes(source.speed))
    throw new Error(`Invalid line speed: ${source.id}`);
  return pace.voice.speed[source.speed ?? 'normal'];
}
export function takeSpeeds(clip, voice) {
  return [...new Set((Array.isArray(clip.script) ? clip.script : []).filter(line => line?.text !== undefined)
    .map(line => voice?.manifest?.clips?.[clip.id]?.[line.id]).filter(Boolean)
    .flatMap(line => Object.keys(line.takes ?? {}).map(Number)))].filter(n => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
}
function mergeStops(stops, duration, head = 0) {
  const result = [];
  let previousAt;
  for (const stop of stops.filter(s => s.at >= head && s.at <= duration).sort((a, b) => a.at - b.at)) {
    const last = result.at(-1);
    if (last && Math.round((stop.at - previousAt) * 1000) < 50) {
      // Keep the actual still's time/identity when a line head almost coincides with it.
      if (stop.kind === 'still' && !(head > 0 && last.at === head)) Object.assign(last, stop);
      last.kind = 'still';
    } else result.push({ ...stop });
    previousAt = stop.at;
  }
  return result;
}
export function buildTimeline(clip, pace = mergePace(), voice) {
  validateBridge(clip);
  const head = roundTime(clip.bridge ?? 0);
  const actors = readCast(voice);
  const cast = clipCast(clip, actors);
  const times = new Map();
  const lines = [];
  const cues = [];
  const stops = [];
  const at = name => {
    if (!times.has(name)) throw new Error(`Unknown timeline name: ${name}`);
    return times.get(name);
  };
  if (clip.script === undefined) {
    const duration = clip.duration;
    for (const mark of [{ at: head }, ...(clip.marks ?? clip.cues ?? []).filter(mark => mark.at >= head)])
      stops.push({ at: roundTime(mark.at), kind: 'line', line: null, label: mark.label ?? mark.text?.replace(/\*\*/g, '').slice(0, 12) ?? '' });
    stops.push({ at: duration, kind: 'still', line: null, label: '' });
    return { cast, duration, head, lines, cues: clip.cues ?? [], stops: mergeStops(stops, duration, head), at, doors: resolveDoors(clip, { at }) };
  }
  if (clip.duration !== undefined || clip.cues !== undefined) throw new Error('script cannot be combined with duration or cues');
  if (!Array.isArray(clip.script) || !clip.script.length) throw new Error('script must contain a line');
  const names = new Set();
  const name = n => {
    if (!isName(n) || names.has(n)) throw new Error(`Invalid or duplicate timeline name: ${n}`);
    names.add(n);
  };
  const seconds = (n, label) => {
    if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${label}`);
    return n;
  };
  let start = head;
  for (const source of clip.script) {
    name(source.id);
    const speed = lineSpeed(source, pace);
    const by = lineBy(source, actors);
    const parsed = parseLine(source.text);
    for (const anchor of parsed.anchors) name(anchor.name);
    const spoken = source.text !== undefined;
    const record = voice?.manifest?.clips?.[clip.id]?.[source.id];
    const speeds = recordMatches(record, by, actors) && record.source === parsed.speech ? Object.keys(record.takes ?? {})
      .filter(s => Number.isFinite(Number(s)) && Number(s) > 0)
      .sort((a, b) => {
        const delta = Math.abs(Number(a) - speed) - Math.abs(Number(b) - speed);
        return Math.abs(delta) < 1e-9 ? Number(a) - Number(b) : delta;
      }) : [];
    const take = spoken ? record?.takes?.[speeds[0]] : undefined;
    const length = Array.from(parsed.speech).length;
    const audioLength = spoken ? seconds(take?.duration ?? length / pace.voice.cps / speed, 'voice duration') : 0;
    const leadEnd = roundTime(start + seconds(source.lead ?? 0, 'lead'));
    const voiceAt = roundTime(leadEnd + (spoken ? pace.pre : 0));
    const end = roundTime(voiceAt + audioLength);
    const done = roundTime(end + seconds(source.tail ?? 0, 'tail'));
    const restName = source.rest ?? 'normal';
    const rest = seconds(typeof restName === 'number' ? restName : pace.rest[restName], 'rest');
    const line = { id: source.id, by, start, leadEnd, voice: voiceAt, end, done,
      next: roundTime(done + rest), spoken, take, speed: Number(speeds[0]), parsed,
      label: source.label ?? Array.from(parsed.plain).slice(0, 12).join('') };
    lines.push(line);
    stops.push({ at: start, kind: 'line', line: line.id, label: line.label });
    if (source.still || source === clip.script.at(-1)) stops.push({ at: done, kind: 'still', line: line.id, label: line.label });
    for (const anchor of parsed.anchors) {
      const offset = take?.anchors?.[anchor.name] ?? (length ? audioLength * anchor.offset / length : 0);
      times.set(anchor.name, roundTime(voiceAt + seconds(offset, 'anchor')));
    }
    start = line.next;
  }
  const duration = lines.at(-1).done;
  if (duration > 90) throw new Error('duration must not exceed 90 seconds');
  lines.at(-1).next = duration;
  for (const line of lines) {
    times.set(line.id, line.start);
    for (const key of ['start', 'voice', 'end', 'done', 'next']) times.set(`${line.id}.${key}`, line[key]);
    if (line.spoken) cues.push({ at: line.voice, to: Infinity, text: line.parsed.caption, by: line.by });
  }
  cues.forEach((cue, i) => { cue.to = cues[i + 1]?.at ?? Infinity; });
  return { cast, duration, head, lines, cues, stops: mergeStops(stops, duration, head), at, doors: resolveDoors(clip, { at }) };
}
export function nextTarget(timeline, t, pace) {
  if (t < timeline.head) return { at: timeline.head, kind: 'stop' };
  if (t >= timeline.duration) return null;
  const stop = timeline.stops.find(s => s.at - t >= 0.05 - 1e-9);
  const at = stop?.at ?? timeline.duration;
  return at - t > pace.skip ? { at: roundTime(t + pace.skip), kind: 'skip' } : { at, kind: 'stop' };
}
export function previousTarget(timeline, t, pace) {
  if (t < timeline.head) return null;
  const i = timeline.stops.findLastIndex(s => s.at <= t + 0.05 + 1e-9);
  const current = timeline.stops[i];
  const stop = current && t - current.at > pace.again + 1e-9 ? current : timeline.stops[i - 1];
  if (!stop) return null;
  return t - stop.at > pace.skip ? { at: roundTime(t - pace.skip), kind: 'skip' } : { at: stop.at, kind: 'stop' };
}
export function positionAt(timeline, t) {
  const line = timeline.lines.findLast(line => line.start <= t);
  if (!line) return null;
  const intervals = [ ['lead', line.start, line.leadEnd], ['pre', line.leadEnd, line.voice],
    ['voice', line.voice, line.end], ['tail', line.end, line.done], ['rest', line.done, line.next] ];
  const interval = intervals.find(([, a, b]) => t >= a && t < b) ?? intervals.at(-1);
  return { line: line.id, section: interval[0], offset: Math.max(0, t - interval[1]) };
}
export function preservePosition(before, after, t) {
  if (t < before.head) return t;
  const pos = positionAt(before, t);
  if (!pos) return Math.min(t, after.duration);
  const line = after.lines.find(line => line.id === pos.line);
  if (!line) return Math.min(t, after.duration);
  const bounds = { lead: [line.start, line.leadEnd], pre: [line.leadEnd, line.voice],
    voice: [line.voice, line.end], tail: [line.end, line.done], rest: [line.done, line.next] };
  const [a, b] = bounds[pos.section];
  return roundTime(Math.min(a + pos.offset, b));
}
export function posterTime(clip, timeline) {
  return Math.max(0, Math.min(timeline.duration, typeof clip.poster === 'string' ? timeline.at(clip.poster) : clip.poster ?? timeline.duration));
}
