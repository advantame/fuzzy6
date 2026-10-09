export default {
  id: 'dom', title: 'CSS clock', duration: 10, marks: [{ at: 5, label: 'Halfway' }],
  setup({ el }) {
    const marker = document.createElement('div'); marker.className = 'demo-marker'; el.append(marker);
    return { render() {} };
  },
};
