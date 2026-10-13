import '../../../src/explorer/explorer.css';
import { createExplorer } from '../../../src/explorer/index.js';

const params = new URLSearchParams(location.search);
window.lifecycle = [];
const record = event => { if (window.lifecycle.length < 100) window.lifecycle.push(event); };
if (params.has('gate')) {
  const load = document.fonts.load.bind(document.fonts);
  document.fonts.load = (font, text) => font.includes('join-gate')
    ? new Promise(resolve => { window.releaseFont = resolve; }) : load(font, text);
}
const clip = (id, extra = {}) => ({
  id, title: id, duration: 2, hold: 0.1, ...extra,
  setup(stage) {
    if (!stage.thumb) record({ id, event: 'setup' });
    const { ctx } = stage.canvas();
    let first = true;
    return {
      render(t) {
        if (first && !stage.thumb) record({ id, event: 'render', t });
        first = false;
        stage.el.dataset.seconds = t;
        ctx.fillStyle = '#123456'; ctx.fillRect(0, 0, stage.W, stage.H);
      },
      dispose() { if (!stage.thumb) record({ id, event: 'dispose' }); },
    };
  },
});
const before = clip('before', { join: 'cut' });
const after = clip('after', {
  join: params.get('join') ?? 'cut',
  ...(params.has('bridge') ? { bridge: Number(params.get('bridge')) } : {}),
  ...(params.has('script') ? { duration: undefined, script: [{ id: 'a', lead: 1, tail: 0.4 }] } : {}),
  fonts: [['16px join-gate', 'test']],
  doors: [{ to: 'detail', from: 0, label: 'Detail' }],
});
window.joinDeck = { id: 'join', title: 'Join', chapters: [
  { id: 'one', title: 'One', clips: [before] },
  { id: 'two', title: 'Two', clips: [after, clip('last', { join: 'cut' })], dives: [clip('detail', { join: 'cut' })] },
] };
window.makeJoinExplorer = () => createExplorer(document.querySelector('#app'), window.joinDeck);
window.makeJoinExplorer();
