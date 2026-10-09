export default {
  id: 'short', title: 'A short pause', duration: 1.5, hold: 0.35,
  setup(stage) {
    const { ctx } = stage.canvas();
    return { render(t) {
      ctx.fillStyle = '#1b1a18'; ctx.fillRect(0, 0, stage.W, stage.H);
      ctx.fillStyle = '#ff6a3d'; ctx.fillRect(100, 400, 1400 * t / 1.5, 100);
    } };
  },
};
