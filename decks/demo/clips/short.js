import { bar } from '../lib/bar.js';

export default {
  id: 'short', title: 'A short pause', duration: 1.5, hold: 0.35,
  setup(stage) {
    const draw = bar(stage);
    return { render(t) { draw(t / stage.duration); } };
  },
};
