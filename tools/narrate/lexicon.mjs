// Engine 0.25.2 utility/text_utility.py count_mora and user_dict/model.py.
// https://github.com/VOICEVOX/voicevox_engine/blob/0.25.2/voicevox_engine/utility/text_utility.py
const MORA = /[イ][ェ]|[ヴ][ャュョ]|[ウクグトド][ゥ]|[テデ][ィェャュョ]|[クグ][ヮ]|[キシチニヒミリギジヂビピ][ェャュョ]|[キニヒミリギビピ][ィ]|[クツフヴグ][ァ]|[ウクスツフヴグズ][ィ]|[ウクツフヴグ][ェォ]|[ァ-ヴー]/g;
export const kanaMoras = kana => kana.match(MORA) ?? [];
export const MAX_WORDS = 1000;

export function readLexicon(value = []) {
  if (!Array.isArray(value) || value.length > MAX_WORDS) throw new Error(`voice.lexicon は${MAX_WORDS}語以内の配列にしてください。`);
  const words = new Set();
  return value.map(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('語彙の項目が不正です。');
    const { word, kana, accent, long, type = 'proper', priority = 5 } = entry;
    if (typeof word !== 'string' || !word.trim() || word.length > 200 || /[\r\n\0]/.test(word)) throw new Error('語彙の word は改行・null を含まない1〜200文字にしてください。');
    if (words.has(word)) throw new Error(`語彙の word が重複しています: ${word}`);
    words.add(word);
    if (typeof kana !== 'string' || kana.length > 200 || !/^[ァ-ヴー]+$/.test(kana) ||
        /[ァィゥェォャュョヮッ][ァィゥェォャュョヮ]|ッッ|[^クグ]ヮ/.test(kana)) throw new Error(`語彙 ${word}: kana は有効なカタカナと長音で書いてください。`);
    if (accent !== 'flat' && (!Number.isInteger(accent) || accent < 1 || accent > kanaMoras(kana).length)) throw new Error(`語彙 ${word}: accent は flat か1〜拍数です。`);
    if (long !== undefined && (!Number.isFinite(long) || long <= 1 || long > 3)) throw new Error(`語彙 ${word}: long は1より大きく3以下です。`);
    if (!['proper', 'common'].includes(type)) throw new Error(`語彙 ${word}: type は proper / common です。`);
    if (!Number.isInteger(priority) || priority < 1 || priority > 9) throw new Error(`語彙 ${word}: priority は1〜9の整数です。`);
    return { word, kana, accent, ...(long === undefined ? {} : { long }), type, priority };
  }).sort((a, b) => a.word < b.word ? -1 : a.word > b.word ? 1 : 0);
}

// Literal, non-overlapping occurrences in the already parsed speech (ruby applied).
export function wordCount(source, word) {
  if (!word) throw new Error('空の語は数えられません。');
  let count = 0, at = 0;
  while ((at = source.indexOf(word, at)) !== -1) { count++; at += word.length; }
  return count;
}
export const lineLexicon = (source, lexicon) => lexicon.filter(entry => source.includes(entry.word));
export const dictionaryParams = entry => ({ surface: entry.word, pronunciation: entry.kana,
  accent_type: entry.accent === 'flat' ? 0 : entry.accent,
  word_type: entry.type === 'common' ? 'COMMON_NOUN' : 'PROPER_NOUN', priority: entry.priority });

// Patch only after every match has been checked. No guessed positions or partial
// edits on failure. Phrase boundaries are allowed, audible pauses are not.
export function applyLong(query, source, lexicon) {
  const moras = query.accent_phrases.flatMap(p => [...p.moras, ...(p.pause_mora ? [null] : [])]);
  const patches = new Map();
  for (const entry of lineLexicon(source, lexicon).filter(e => e.long !== undefined)) {
    const pattern = kanaMoras(entry.kana);
    let found = 0;
    for (let i = 0; i <= moras.length - pattern.length; i++) {
      const matches = pattern.every((text, j) => {
        const mora = moras[i + j];
        if (!mora) return false;
        if (text !== 'ー') return mora.text === text;
        const vowel = moras[i + j - 1]?.vowel?.toLowerCase();
        return j > 0 && /^[aiueo]$/.test(vowel) && mora.consonant == null &&
          mora.vowel?.toLowerCase() === vowel && mora.text === { a: 'ア', i: 'イ', u: 'ウ', e: 'エ', o: 'オ' }[vowel];
      });
      if (!matches) continue;
      found++;
      for (let j = 0; j < pattern.length; j++) if (pattern[j] === 'ー') {
        const mora = moras[i + j];
        if (patches.has(mora)) throw new Error(`語彙 ${entry.word}: 長音の適用先が重複しています。`);
        if (!Number.isFinite(mora.vowel_length) || mora.vowel_length < 0) throw new Error(`語彙 ${entry.word}: 母音の長さが不正です。`);
        patches.set(mora, mora.vowel_length * entry.long);
      }
      i += pattern.length - 1;
    }
    const expected = wordCount(source, entry.word);
    if (found !== expected) throw new Error(`語彙 ${entry.word}: 拍の一致数 ${found} と読み上げの文の語数 ${expected} が違います。`);
  }
  for (const [mora, length] of patches) mora.vowel_length = length;
  return query;
}
