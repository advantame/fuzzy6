import { bar } from '../lib/bar.js';

export default {
  id: 'cues', title: 'Subtitle boundaries', duration: 9, join: 'cut', bridge: 0.6,
  cues: [
    { at: 0, to: 3, text: 'A **strong** beginning\nA second line' },
    { at: 2, to: 5, text: '<script> & "quotes" are text.' },
    { at: 5, to: 9, text: 'The **last** subtitle.' },
  ],
  setup(stage) {
    const draw = bar(stage);
    return { render(t) {
      // Only the bridge retracts the previous picture. At the head, one third
      // already stands for the first caption; later boundaries fill the bar.
      draw(t < 0.6 ? 1 - (2 / 3) * t / 0.6 : t < 2 ? 1 / 3 : t < 5 ? 2 / 3 : 1);
    } };
  },
};
