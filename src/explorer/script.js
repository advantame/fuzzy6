// The markup of one narration line (spec §6.6). One string is the source of both the caption
// and the speech: {name} marks a point in the voice, [shown|spoken] splits the two readings,
// **…** and line breaks belong to the caption only. No DOM here: the engine and
// tools/narrate.mjs both import this.

const NAME = /^[a-z][a-z0-9-]*$/;
const ESCAPABLE = new Set(['{', '[', '*', '\\']);
const isAscii = (ch) => ch !== undefined && ch.codePointAt(0) < 0x80;

export const isName = (s) => typeof s === 'string' && NAME.test(s);

// parseLine(text) → { caption, plain, speech, anchors }
//   caption  cue markup for the subtitle (** and \n kept, see cueMarkup in model.js)
//   plain    the caption without markup, on one line (for labels)
//   speech   what the voice reads
//   anchors  [{ name, offset }] — offset is the number of speech characters (code points)
//            before the anchor, so the anchor sits at the start of speech[offset]
export function parseLine(text) {
  const src = Array.from(String(text ?? ''));
  let caption = '';
  const spoken = []; // code points, before the spaces are normalised
  const raw = []; // { name, index } with index into `spoken`
  const fail = (why) => {
    throw new Error(`Narration line: ${why} — ${JSON.stringify(text)}`);
  };
  const say = (s) => {
    for (const ch of Array.from(s)) spoken.push(ch);
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\\' && ESCAPABLE.has(src[i + 1])) {
      caption += src[i + 1];
      say(src[i + 1]);
      i++;
    } else if (ch === '{') {
      const close = src.indexOf('}', i);
      if (close < 0) fail('unclosed {');
      const name = src.slice(i + 1, close).join('');
      if (!isName(name)) fail(`invalid anchor name "${name}"`);
      if (raw.some((a) => a.name === name)) fail(`duplicate anchor "${name}"`);
      raw.push({ name, index: spoken.length });
      i = close;
    } else if (ch === '[') {
      // [shown|spoken]; a bracket without a bar is ordinary text
      const close = src.indexOf(']', i);
      const bar = src.indexOf('|', i);
      if (close < 0 || bar < 0 || bar > close) {
        caption += ch;
        say(ch);
      } else {
        caption += src.slice(i + 1, bar).join('');
        say(src.slice(bar + 1, close).join(''));
        i = close;
      }
    } else if (ch === '*' && src[i + 1] === '*') {
      caption += '**';
      i++;
    } else if (ch === '\n') {
      caption += '\n';
    } else {
      caption += ch;
      say(ch);
    }
  }

  // Drop half-width spaces that touch a non-ASCII character ("1948 年" is read as "1948年");
  // spaces between ASCII words stay. A run of spaces is judged by what stands on either side.
  const kept = []; // kept[i] is true when spoken[i] survives
  for (let i = 0; i < spoken.length; i++) {
    if (spoken[i] !== ' ') {
      kept.push(true);
      continue;
    }
    let a = i;
    while (a > 0 && spoken[a - 1] === ' ') a--;
    let b = i;
    while (b < spoken.length - 1 && spoken[b + 1] === ' ') b++;
    kept.push(isAscii(spoken[a - 1]) && isAscii(spoken[b + 1]));
  }
  const before = [0]; // before[i] = kept characters in spoken[0..i)
  for (let i = 0; i < spoken.length; i++) before.push(before[i] + (kept[i] ? 1 : 0));
  const speech = spoken.filter((_, i) => kept[i]).join('');
  const anchors = raw.map(({ name, index }) => ({ name, offset: before[index] }));
  const plain = caption.replace(/\*\*/g, '').replace(/\n/g, '');
  return { caption, plain, speech, anchors };
}
