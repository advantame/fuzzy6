import '../../src/explorer/explorer.css';
import { createExplorer } from '../../src/explorer/index.js';
window.setups = []; window.disposals = []; window.renders = [];
const params = new URLSearchParams(location.search);
if (params.has('slow')) {
  document.fonts.load = () => new Promise(resolve => setTimeout(resolve, 120));
}
const clips = Array.from({ length: 12 }, (_, i) => ({
  id: `clip-${i}`, title: `Clip ${i}`, duration: 4,
  fonts: [[`16px fixture${i}`, 'test']],
  setup(stage) {
    if (!stage.thumb) window.setups.push(i);
    if (params.has('errors') && i === 1) throw new Error('setup failed');
    const { ctx } = stage.canvas();
    return {
      render(t) {
        if (!stage.thumb) window.renders.push({ i, t });
        if (window.renders.length > 100) window.renders.shift();
        if (params.has('errors') && i === 2) throw new Error('render failed');
        ctx.fillStyle = '#123456'; ctx.fillRect(0, 0, 1600, 900);
      },
      dispose() { if (!stage.thumb) window.disposals.push(i); },
    };
  },
}));
window.fixtureDeck = { id: 'fixture', title: 'Fixture', chapters: [{ id: 'test', title: 'Test', clips }] };
window.makeExplorer = options => createExplorer(document.querySelector('#app'), window.fixtureDeck, options);
window.makeExplorer();
