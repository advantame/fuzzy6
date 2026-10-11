export default {
  id: 'gutter-fixture', title: 'Gutter fixture', frame: { gutter: 120 },
  chapters: [{ id: 'test', title: 'Test', clips: [{
    id: 'sample', title: 'Sample', duration: 12,
    setup() { return { render() {} }; },
  }] }],
};
