export const W = 1600;
export const H = 900;
export function validateBridge(clip, dive = false) {
  if (clip.bridge === undefined) return;
  if (!Number.isFinite(clip.bridge) || clip.bridge <= 0 || clip.bridge > 3)
    throw new Error(`Clip ${clip.id}: bridge must be a number greater than 0 and at most 3`);
  if (clip.join !== 'cut' || dive)
    throw new Error(`Clip ${clip.id}: bridge requires join 'cut' on the main line`);
  if (clip.script === undefined && clip.duration < clip.bridge)
    throw new Error(`Clip ${clip.id}: duration must include bridge`);
}
export function normalizeDeck(deck) {
  const gutter = deck.frame?.gutter === undefined ? 0 : deck.frame.gutter;
  if (!Number.isInteger(gutter) || gutter < 0 || gutter > 240)
    throw new Error('deck.frame.gutter must be an integer from 0 to 240');
  const chapters = new Set();
  const ids = new Map();
  const clips = [];
  const dives = [];
  const declared = [];
  for (const [ci, chapter] of (deck.chapters ?? []).entries()) {
    if (chapters.has(chapter.id)) throw new Error(`Duplicate chapter id: ${chapter.id}`);
    chapters.add(chapter.id);
    let number = 0;
    for (const [row, clip] of [...chapter.clips, ...(chapter.dives ?? [])].entries()) {
      const dive = row >= chapter.clips.length;
      validateBridge(clip, dive);
      if (ids.has(clip.id)) throw new Error(`Duplicate clip id: ${clip.id}`);
      if (typeof clip.setup !== 'function') throw new Error(`Clip ${clip.id}: missing setup`);
      if (clip.join !== undefined && clip.join !== 'fade' && clip.join !== 'cut')
        throw new Error(`Clip ${clip.id}: join must be 'fade' or 'cut'`);
      if (clip.script === undefined && (!Number.isFinite(clip.duration) || clip.duration <= 0 || clip.duration > 180))
        throw new Error(`Clip ${clip.id}: duration must be positive and at most 180 seconds`);
      const entry = {
        clip,
        chapter,
        chapterNumber: ci + 1,
        row,
        dive,
        number: dive || clip.numbered === false ? null : ++number,
        index: dive ? -1 : clips.length,
        global: dive ? null : clips.length + 1,
      };
      entry.label = entry.number === null ? '' : `${entry.chapterNumber}-${entry.number}`;
      (dive ? dives : clips).push(entry);
      declared.push(entry);
      ids.set(clip.id, entry);
    }
  }
  if (!clips.length) throw new Error('Deck must contain at least one clip');
  const all = orderEntries(declared);
  for (const entry of dives) entry.index = entry.main.index;
  const rows = new Map();
  for (const entry of all) {
    // Index sections follow the parent, including cross-chapter references.
    entry.indexChapter = (entry.main ?? entry).chapter;
    const row = rows.get(entry.indexChapter) ?? 0;
    entry.indexRow = row;
    rows.set(entry.indexChapter, row + 1);
  }
  return { clips, dives, all, ids, gutter };
}
// Shared by playback, capture and narration. Ordering needs IDs and doors only,
// so draft narration does not require a renderer or a completed timeline.
export function orderedClips(deck) {
  return orderEntries(deck.chapters.flatMap(chapter => [
    ...chapter.clips.map(clip => ({ clip, dive: false })),
    ...(chapter.dives ?? []).map(clip => ({ clip, dive: true })),
  ])).map(entry => entry.clip);
}
function orderEntries(declared) {
  const clips = declared.filter(entry => !entry.dive);
  const dives = declared.filter(entry => entry.dive);
  const ids = new Map();
  for (const entry of declared) {
    validateBridge(entry.clip, entry.dive);
    if (ids.has(entry.clip.id)) throw new Error(`Duplicate clip id: ${entry.clip.id}`);
    ids.set(entry.clip.id, entry);
  }
  // Declaration order is chapters, then each chapter's clips followed by dives.
  for (const entry of declared) {
    for (const door of entry.clip.doors ?? []) {
      const target = ids.get(door.to);
      if (!target?.dive) throw new Error(`Clip ${entry.clip.id}: door target is not a dive: ${door.to}`);
      if (!target.parent) { target.parent = entry; target.parentDoor = door; }
    }
  }
  for (const entry of dives) {
    if (!entry.parent) throw new Error(`Unreferenced dive: ${entry.clip.id}`);
    const seen = new Set();
    let parent = entry;
    while (parent.dive) {
      if (seen.has(parent)) throw new Error(`Dive parent cycle: ${entry.clip.id}`);
      seen.add(parent);
      parent = parent.parent;
      if (!parent) throw new Error(`Unreferenced dive: ${entry.clip.id}`);
    }
    entry.main = parent;
  }
  // Iterative traversal keeps even very deeply authored hierarchies bounded by entries.
  const children = new Map();
  for (const entry of dives) {
    if (!children.has(entry.parent)) children.set(entry.parent, []);
    children.get(entry.parent).push(entry);
  }
  const all = [];
  const pending = [...clips].reverse();
  while (pending.length) {
    const entry = pending.pop();
    entry.order = all.length;
    all.push(entry);
    pending.push(...(children.get(entry) ?? []).toReversed());
  }
  return all;
}
export function clampTime(t, duration) {
  const n = Number(t);
  return Number.isNaN(n) ? 0 : Math.max(0, Math.min(duration, n));
}
export const canCutJoin = (from, to, t, duration, dir) =>
  dir === 'next' && !!from && !from.dive && !to.dive &&
  to.index === from.index + 1 && to.clip.join === 'cut' && t === duration;
export const cuesAt = (cues = [], t) => cues.filter(c => c.at <= t && t < c.to).sort((a, b) => a.at - b.at);
export const escapeHTML = text =>
  String(text).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const cueMarkup = text =>
  escapeHTML(text)
    .replace(/\*\*(.*?)\*\*/gs, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
export function formatTime(t) {
  const n = Math.max(0, Math.floor(Number(t) || 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}
export const canvasScale = (k, dpr) => Math.min(k * dpr, 2, Math.sqrt(4.2e6 / (W * H)));
export const advanceTime = (t, dt, duration) => clampTime(t + Math.max(0, Math.min(dt, 0.1)), duration);
export const seekState = (state, t, duration) =>
  t >= duration ? 'ended' : state === 'ended' ? 'paused' : state;
