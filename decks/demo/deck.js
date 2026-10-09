import opening from './clips/opening.js';
import sweep from './clips/sweep.js';
import dom from './clips/dom.js';
import cues from './clips/cues.js';
import short from './clips/short.js';
export default {
  id: 'demo', title: 'Demo', subtitle: 'Motion Explorer contract examples',
  autoAdvance: false,
  chapters: [
    { id: 'basics', title: 'Basics', clips: [opening, sweep, dom] },
    { id: 'timing', title: 'Timing', clips: [short, cues] },
  ],
};
