export default {
  id: 'detail', title: '時刻と位置', duration: 2, hold: 0.2,
  marks: [{ at: 1, label: '中間' }],
  cues: [{ at: 0, to: Infinity, text: '同じ時刻なら、同じ位置に描きます。' }],
  setup(stage) {
    const { ctx } = stage.canvas();
    return {
      render(t) {
        ctx.fillStyle = '#1b1a18'; ctx.fillRect(0, 0, stage.W, stage.H);
        ctx.strokeStyle = stage.theme('--mx-muted');
        ctx.beginPath(); ctx.moveTo(160, 450); ctx.lineTo(1440, 450); ctx.stroke();
        ctx.fillStyle = stage.theme('--mx-accent');
        ctx.fillRect(160 + 1200 * t / stage.duration, 410, 80, 80);
      },
    };
  },
};
