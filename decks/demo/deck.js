import duet from './clips/duet.js';
import { puppet } from './lib/puppet.js';
import opening from './clips/opening.js';
import sweep from './clips/sweep.js';
import dom from './clips/dom.js';
import cues from './clips/cues.js';
import short from './clips/short.js';
import script from './clips/script.js';
import { parseLine } from '../../src/explorer/script.js';
// Recording-only examples: the missing files intentionally exercise silent fallback.
const records = Object.fromEntries(script.script.filter(l => l.text).map((line, i) => [line.id, {
  by: 'metan', source: parseLine(line.text).speech,
  takes: {
    '1.3': { file: `script/${line.id}@1.3.wav`, duration: i ? 1.8 : 1.2,
      anchors: i ? { tf: 0, gpt: 0.6, chat: 1.1 } : { y48: 0.3, band: 0.8 } },
    '1.5': { file: `script/${line.id}@1.5.wav`, duration: i ? 1.5 : 1,
      anchors: i ? { tf: 0, gpt: 0.5, chat: 0.9 } : { y48: 0.25, band: 0.65 } },
  },
}]));
const duetRecords = Object.fromEntries(duet.script.slice(0, 2).map(line => [line.id, {
  by: line.by, source: parseLine(line.text).speech,
  takes: { '1.3': { duration: 2, anchors: {},
    mouth: [[0, 'x'], [0.1, 'a'], [0.35, 'i'], [0.6, 'u'], [0.85, 'e'], [1.1, 'o'], [1.35, 'n'], [1.6, 'a'], [1.85, 'x']] } },
}]));
export default {
  id: 'demo', title: 'Demo', subtitle: 'Motion Explorer contract examples',
  autoAdvance: false,
  voice: {
    cast: {
      metan: { name: '左の語り手', side: 'left', figure: puppet({ body: '#d9a7ba' }) },
      zunda: { name: '右の語り手', side: 'right', figure: puppet({ body: '#a6cb91' }) },
    },
    manifest: { version: 2, clips: { script: records, duet: duetRecords } }, url: () => undefined,
  },
  chapters: [
    { id: 'basics', title: 'Basics', clips: [opening, sweep, dom] },
    { id: 'timing', title: 'Timing', clips: [short, cues] },
    { id: 'narration', title: '語り', clips: [script, duet] },
  ],
};
