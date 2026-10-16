import { parseLine } from '../../src/explorer/script.js';
// Mask explicit readings before parsing; masked spans cannot join adjacent tokens.
export function readingWarnings(text, lexicon = []) {
  let masked = String(text ?? '').replace(/\\[\[{*\\]|\[[^\]|]*\|[^\]]*\]/g, match => match.startsWith('\\') ? match : '　');
  masked = parseLine(masked).speech;
  for (const { word } of [...lexicon].sort((a,b)=>b.word.length-a.word.length)) if (word) masked = masked.split(word).join('　');
  const patterns = [
    ['year', /\d{4}\s*年/gu], ['hyphen-number', /\d+(?:[-‐‑–]\d+)+/gu],
    ['hash-number', /[#＃]\s*\d+/gu],
    ['letters-number', /[A-Za-z]+(?:[ -]?[A-Za-z]+)*\s*\d+(?:\.\d+)?[A-Za-z]*|\d+[A-Za-z]+/gu],
    ['counter', /\d+(?:\.\d+)?\s*(?:トークン|ページ|か月|ヶ月|時間|文字|[本枚個人回台冊匹頭杯件行字秒分時日月年歳倍章節])/gu],
  ];
  const found=[], ranges=[];
  for(const [kind,pattern] of patterns) for(const match of masked.matchAll(pattern)) {
    const start=match.index,end=start+match[0].length;
    if(ranges.some(([a,b])=>start<b && end>a)) continue;
    ranges.push([start,end]);found.push({kind,text:match[0]});
  }
  return found;
}
