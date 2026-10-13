// Doors use only the clip's timeline and time, never playback or visit history.
export function resolveDoors(clip, timeline) {
  const doors = clip.doors ?? [];
  if (!Array.isArray(doors) || doors.length > 3) throw new Error('A clip may have at most 3 doors');
  const time = value => {
    const result = typeof value === 'string' ? timeline.at(value) : value;
    if (!Number.isFinite(result) || result < 0) throw new Error(`Invalid door time: ${value}`);
    return result;
  };
  return doors.map(door => {
    const from = time(door.from ?? 0);
    const until = door.until === undefined ? Infinity : time(door.until);
    if (until < from) throw new Error(`Door ${door.to}: until precedes from`);
    return { ...door, from, until, source: door };
  }).sort((a, b) => a.from - b.from);
}
export const doorsAt = (doors = [], t) => doors.filter(d => d.from <= t && t < d.until);
export function descentTarget(doors, t, to) {
  const open = doorsAt(doors, t);
  return to === undefined ? open.at(-1) : open.find(d => d.to === to);
}
export function ascentTarget(entry, stack, compute) {
  if (!entry?.dive) return null;
  if (stack.length) return { ...stack.at(-1) };
  const timeline = compute(entry.parent.clip);
  const door = timeline.doors?.find(d => d.source === entry.parentDoor);
  return { id: entry.parent.clip.id, t: door?.from ?? 0 };
}
