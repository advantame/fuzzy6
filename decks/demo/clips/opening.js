export default {
  id: 'opening', title: 'Motion Explorer', numbered: false, duration: 8,
  cues: [{ at: 0, to: 8, text: 'Use ← and → to explore the clips.' }],
  setup({ el }) {
    const text = document.createElement('p'); text.className = 'demo-label';
    text.textContent = 'Motion Explorer'; el.append(text);
    return { render() {} };
  },
};
