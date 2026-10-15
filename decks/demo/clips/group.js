import { drawGroup } from '../lib/group.js';
const clip = (id, title, value, extra = {}) => ({
  id, title, duration: 1, hold: 0.15, ...extra,
  setup(stage) {
    const { ctx } = stage.canvas();
    return { render(t) { drawGroup(stage, ctx, value(t)); } };
  },
});
export default { id: 'motion-group', title: '三本の動き', clips: [
  clip('group-one', '伸びる', t => 0.3 + 0.7 * t),
  clip('group-two', 'つないで縮む', t => t < 0.4 ? 1 - 0.5 * t / 0.4 : 0.5, { join: 'cut', bridge: 0.4 }),
  clip('group-three', 'もう一度伸びる', t => 0.5 + 0.5 * t),
] };
