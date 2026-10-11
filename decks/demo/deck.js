import opening from './clips/opening.js';
import sweep from './clips/sweep.js';
import dom from './clips/dom.js';
import cues from './clips/cues.js';
import short from './clips/short.js';
import script from './clips/script.js';
import { parseLine } from '../../src/explorer/script.js';
// Recording-only examples: the missing files intentionally exercise silent fallback.
const records = Object.fromEntries(script.script.filter(l => l.text).map((line, i) => [line.id, {
  source: parseLine(line.text).speech,
  takes: {
    '1.3': { file: `script/${line.id}@1.3.wav`, duration: i ? 1.8 : 1.2,
      anchors: i ? { tf: 0, gpt: 0.6, chat: 1.1 } : { y48: 0.3, band: 0.8 } },
    '1.5': { file: `script/${line.id}@1.5.wav`, duration: i ? 1.5 : 1,
      anchors: i ? { tf: 0, gpt: 0.5, chat: 0.9 } : { y48: 0.25, band: 0.65 } },
  },
}]));
export default {
  id: 'demo', title: 'Demo', subtitle: 'Motion Explorer contract examples',
  autoAdvance: false,
  voice: { manifest: { version: 1, clips: { script: records } }, url: () => undefined },
  chapters: [
    { id: 'basics', title: 'Basics', clips: [opening, sweep, dom] },
    { id: 'timing', title: 'Timing', clips: [short, cues] },
    { id: 'narration', title: '語り', clips: [script] },
  ],
};
