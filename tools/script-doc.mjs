import { parseLine } from '../src/explorer/script.js';
import { conditions } from '../src/explorer/quiz.js';
import { normalizeDeck } from '../src/explorer/model.js';
import { readCast, lineBy } from '../src/explorer/cast.js';
import { buildTimeline, mergePace, lineSpeed } from '../src/explorer/timeline.js';

// Escape only what changes the rendering, so the file still reads well as plain text ("GPT-3",
// "1.5" stay as written): inline markup anywhere, and block markers at the start, where a list
// item's text could open a heading, a quote or another list. Newlines never introduce blocks.
const markdown = value => String(value).replace(/[\r\n]+/g, '')
  .replace(/[\\`*_\[\]<~&]/g, '\\$&')
  .replace(/^([#>+=-])/, '\\$1')
  .replace(/^(\d+)([.)])/, '$1\\$2');
const code = value => {
  const text = String(value).replace(/[\r\n]+/g, '');
  const fence = '`'.repeat(Math.max(0, ...[...text.matchAll(/`+/g)].map(m => m[0].length)) + 1);
  return `${fence} ${text} ${fence}`.replace(/^` ([^`]+) `$/, '`$1`');
};
const hasSpeech = clip => clip.script?.some(line => line.text !== undefined);

// An empty result means there is no narration; writers leave any existing file alone.
export function renderScript(deck) {
  const model = normalizeDeck(deck);
  if (!model.all.some(({ clip }) => hasSpeech(clip))) return '';
  const pace = mergePace(deck.pace);
  const cast = readCast(deck.voice);
  const first = Object.keys(cast)[0];
  const timelines = new Map();
  const timeline = clip => {
    if (!timelines.has(clip)) timelines.set(clip, buildTimeline(clip, pace, deck.voice));
    return timelines.get(clip);
  };
  const title = entry => `${entry.dive ? '深掘り ' : entry.label ? `${entry.label} ` : ''}${markdown(entry.clip.title)}`;
  const doorText = entry => {
    const { parent, parentDoor: door } = entry;
    const lines = timeline(parent.clip).lines;
    const from = door.from ?? 0;
    const line = lines.find(l => l.id === from || l.parsed.anchors.some(a => a.name === from) ||
      ['start', 'voice', 'end', 'done', 'next'].some(suffix => `${l.id}.${suffix}` === from)) ??
      (typeof from === 'number' ? lines.findLast(l => l.start <= from) ?? lines[0] : undefined);
    const spoken = lines.filter(l => l.spoken);
    const who = parent.dive ? `深掘り「${markdown(parent.clip.title)}」` : parent.label || `「${markdown(parent.clip.title)}」`;
    // Numeric doors and silent parents are valid engine inputs, but have no
    // spoken line number. Keep the reference truthful in those cases.
    const where = line?.spoken ? ` の ${spoken.indexOf(line) + 1}（${code(`${parent.clip.id}/${line.id}`)}）`
      : `（${code(line ? `${parent.clip.id}/${line.id}` : parent.clip.id)}）`;
    return `${who}${where}から降りられる。${door.label ? `降り口の札は「${markdown(door.label)}」。` : ''}`;
  };
  const paragraphs = [
    `# ${markdown(deck.title)} の原稿`,
    `この文書は、各クリップの \`script\` から自動で作っています。手では直さず、クリップの \`script\` を直してください。dev サーバが動いている間は、クリップを直すたびに書き直されます。手で作り直すときは ${code(`npm run script -- ${deck.id}`)} です。`,
    `${first ? `話者を書いていない文は、${markdown(cast[first].name)}の文です。` : ''}文の終わりの \`a\` などは文の id で、\`compose/a\` のように、クリップの id と合わせて指せます。`,
  ];
  for (const [index, chapter] of deck.chapters.entries()) {
    paragraphs.push(`## ${index + 1}. ${markdown(chapter.title)}`);
    let silent = [];
    const flush = () => {
      if (silent.length) paragraphs.push(`語りなし: ${silent.join('、')}`);
      silent = [];
    };
    for (const entry of model.all.filter(e => e.indexChapter === chapter)) {
      const { clip } = entry;
      if (entry.group && entry.part === 0) {
        flush();
        paragraphs.push(`### 深掘り ${markdown(entry.group.title)} ${code(entry.group.id)}`);
        for (const parent of model.all) for (const parentDoor of parent.clip.doors ?? [])
          if (model.targets.get(parentDoor.to)?.group === entry.group) paragraphs.push(doorText({ parent, parentDoor }));
      }
      if (!hasSpeech(clip)) { silent.push(title(entry)); continue; }
      flush();
      const tl = timeline(clip);
      const spoken = clip.script.filter(s => s.text !== undefined).map(s => ({ ...s, by: lineBy(s, cast), parsed: parseLine(s.text) }));
      const estimated = tl.lines.some(l => l.spoken && (!l.take || l.speed !== lineSpeed(clip.script.find(s => s.id === l.id), pace)));
      const duration = (Math.round(tl.duration * 10) / 10).toFixed(1);
      paragraphs.push(`${entry.group ? '####' : '###'} ${title(entry)} ${code(clip.id)}（${estimated ? `約 ${duration} 秒、録りのない文は見積もり` : `${duration} 秒`}）`);
      if (entry.dive && !entry.group) paragraphs.push(doorText(entry));
      paragraphs.push(spoken.map((line, i) => {
        const speed = clip.script.find(s => s.id === line.id).speed;
        const actor = line.by !== first ? `**${markdown(cast[line.by].name)}**　` : '';
        const note = speed === 'slow' ? '（ゆっくり）' : speed === 'fast' ? '（早口）' : '';
        const byQuestion = new Map();
        for (const condition of conditions(line)) {
          const [id, result] = condition.split('.');
          if (!byQuestion.has(id)) byQuestion.set(id, []);
          byQuestion.get(id).push({ right: '正解', wrong: '不正解', skip: '飛ばした' }[result]);
        }
        const prefix = byQuestion.size ? `〔${[...byQuestion].map(([id, results]) => `${id} が${results.join('か')}${results.at(-1).endsWith('正解') ? 'の' : ''}とき`).join('、または ')}〕` : '';
        const choices = line.ask ? `\n   選択肢: ${line.ask.choices.map((choice, j) => `${j + 1}. ${markdown(typeof choice === 'string' ? parseLine(choice).plain : choice.text)}${j === line.ask.answer ? '（正解）' : ''}`).join(' ')}` : '';
        return `${i + 1}. ${prefix}${actor}${markdown(line.parsed.plain)}${note} ${code(line.id)}${choices}`;
      }).join('\n'));
    }
    flush();
  }
  return `${paragraphs.join('\n\n')}\n`;
}
