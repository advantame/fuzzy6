// Contract fixture: text from spec §6.6; recording durations are test examples.
export default {
  id: 'script', title: '語り', poster: 'a.done',
  script: [
    { id: 'a', text: '最初の手がかりは{y48} 1948 年。\nけれど出来事の多くは、{band}**最後の 10 年**に集まっている。', lead: 0.4, tail: 0.2, rest: 'short', still: true },
    { id: 'b', text: '{tf}2017 年の Transformer から、{gpt}GPT、{chat}[ChatGPT|チャットジーピーティー] へと一気に進んだ。', lead: 0.6, tail: 0.3, rest: 0.4 },
    { id: 'spin', lead: 1.2, tail: 0.2 },
  ],
  setup(stage) {
    const { ctx } = stage.canvas();
    return {
      render(t) {
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, stage.W, stage.H);
        ctx.fillStyle = '#ddd';
        ctx.fillRect(100, 100, 1400 * (stage.duration ? t / stage.duration : 1), 100);
        // Expose the live stage contract without a second test-only rendering path.
        stage.el.dataset.anchor = stage.at('band');
        stage.el.dataset.duration = stage.duration;
        stage.el.dataset.enter = stage.pace.enter;
      },
    };
  },
};
