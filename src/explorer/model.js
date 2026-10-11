export const W = 1600;
export const H = 900;
export function normalizeDeck(deck) {
  const gutter = deck.frame?.gutter === undefined ? 0 : deck.frame.gutter;
  if (!Number.isInteger(gutter) || gutter < 0 || gutter > 240)
    throw new Error('deck.frame.gutter must be an integer from 0 to 240');
  const chapters = new Set();
  const ids = new Map();
  const clips = [];
  for (const [ci, chapter] of (deck.chapters ?? []).entries()) {
    if (chapters.has(chapter.id)) throw new Error(`Duplicate chapter id: ${chapter.id}`);
    chapters.add(chapter.id);
    let number = 0;
    for (const [row, clip] of chapter.clips.entries()) {
      if (ids.has(clip.id)) throw new Error(`Duplicate clip id: ${clip.id}`);
      if (typeof clip.setup !== 'function') throw new Error(`Clip ${clip.id}: missing setup`);
      if (clip.script === undefined && (!Number.isFinite(clip.duration) || clip.duration <= 0 || clip.duration > 90))
        throw new Error(`Clip ${clip.id}: duration must be positive`);
      const entry = {
        clip,
        chapter,
        chapterNumber: ci + 1,
        row,
        number: clip.numbered === false ? null : ++number,
        index: clips.length,
        global: clips.length + 1,
      };
      entry.label = entry.number === null ? '' : `${entry.chapterNumber}-${entry.number}`;
      clips.push(entry);
      ids.set(clip.id, entry);
    }
  }
  if (!clips.length) throw new Error('Deck must contain at least one clip');
  return { clips, ids, gutter };
}
export function clampTime(t, duration) {
  const n = Number(t);
  return Number.isNaN(n) ? 0 : Math.max(0, Math.min(duration, n));
}
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
