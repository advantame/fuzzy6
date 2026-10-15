export default {
  id: 'quiz', title: '二つの問題', cast: [],
  script: [
    { id: 'q1', text: '1 + 1 は？', ask: { choices: ['2', '3', { html: '<b>4</b>', text: '4' }], answer: 0, box: { x: 200, y: 600, w: 1000, h: 170 } } },
    { id: 'q1-yes', when: 'q1.right', text: '正解です。' },
    { id: 'q1-no', when: ['q1.wrong', 'q1.skip'], text: '答えは、2 です。' },
    { id: 'common', text: '次の問題です。' },
    { id: 'q2', text: '2 × 2 は？', ask: { choices: ['2', '3', '4'], answer: 2, layout: 'grid', box: { x: 200, y: 580, w: 1000, h: 220 } } },
    { id: 'q2-yes', when: 'q2.right', text: '正解です。' },
    { id: 'q2-no', when: ['q2.wrong', 'q2.skip'], text: '答えは、4 です。' },
    { id: 'end', text: '二問を見終えました。', still: true },
  ],
  doors: [{ to: 'motion-group', from: 'q1.done', label: '動きの組を見る？' }],
  setup(stage) {
    const { ctx } = stage.canvas();
    return { render(t) {
      ctx.fillStyle = '#1b1a18'; ctx.fillRect(0, 0, stage.W, stage.H);
      for (const [i, id] of ['q1', 'q2'].entries()) {
        const answer = stage.answer(id);
        stage.el.dataset[id] = JSON.stringify(answer);
        ctx.strokeStyle = '#c0bcb5'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(550 + i * 500, 340, 110, 0, Math.PI * 2); ctx.stroke();
        if (t >= stage.at(id) && answer.result) {
          ctx.fillStyle = { right: '#7ebc88', wrong: '#ce7769', skip: '#777' }[answer.result];
          ctx.beginPath(); ctx.arc(550 + i * 500, 340, 90, 0, Math.PI * 2); ctx.fill();
        }
      }
    } };
  },
};
