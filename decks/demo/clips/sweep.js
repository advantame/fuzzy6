export default {
  id: 'sweep', title: 'Canvas clock', kicker: 'A pure function of time', duration: 12, poster: 6,
  doors: [{ to: 'detail', from: 3, label: '時刻で何が決まる？', by: 'zunda' }],
  fonts: [['400 64px "IBM Plex Sans JP"', '時刻']],
  cues: [{ at: 0, to: 12, text: '時刻だけで、同じ絵を描きます。' }],
  setup(stage) {
    const { ctx } = stage.canvas({ alpha: false });
    const ink = stage.theme('--mx-ink'), accent = stage.theme('--mx-accent');
    return {
      render(t) {
        ctx.fillStyle = '#1b1a18'; ctx.fillRect(0, 0, stage.W, stage.H);
        ctx.fillStyle = accent; ctx.fillRect(80, 640, 1440 * t / 12, 40);
        ctx.fillStyle = ink; ctx.font = '400 64px "IBM Plex Sans JP"'; ctx.fillText('時刻', 80, 240);
        ctx.font = '160px monospace'; ctx.fillText(t.toFixed(2), 80, 460);
      },
      dispose() {},
    };
  },
};
