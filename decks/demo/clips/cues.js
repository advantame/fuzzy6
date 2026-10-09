export default {
  id: 'cues', title: 'Subtitle boundaries', duration: 9,
  cues: [
    { at: 0, to: 3, text: 'A **strong** beginning\nA second line' },
    { at: 2, to: 5, text: '<script> & "quotes" are text.' },
    { at: 5, to: 9, text: 'The **last** subtitle.' },
  ],
  setup({ el }) {
    const label = document.createElement('p'); label.className = 'demo-label';
    label.textContent = 'Subtitles & escaping'; el.append(label);
    return { render() {} };
  },
};
