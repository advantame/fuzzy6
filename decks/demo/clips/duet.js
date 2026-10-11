// Silent, hand-timed contract example. These figures are plain test puppets.
export default {
  id: 'duet', title: '二人の語り', poster: 'b.done',
  script: [
    { id: 'a', by: 'metan', text: '左の語り手から話します。', still: true },
    { id: 'b', by: 'zunda', text: '次は、右の語り手です。', still: true },
    { id: 'c', by: 'metan', text: '録りがない文でも、口が動きます。' },
  ],
  setup(stage) {
    const { ctx } = stage.canvas();
    return { render(t) {
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, stage.W, stage.H);
      // The two panels follow the same sentence boundaries as the figures.
      for (const [id, x, color] of [['a', 240, '#d9a7ba'], ['b', 880, '#a6cb91']]) {
        ctx.fillStyle = t >= stage.at(`${id}.voice`) && t < stage.at(`${id}.end`) ? color : '#333';
        ctx.fillRect(x, 250, 480, 400);
      }
    } };
  },
};
