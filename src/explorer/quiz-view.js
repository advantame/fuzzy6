import { element } from './chrome.js';
import { cueMarkup } from './model.js';
import { answerAt } from './quiz.js';

export function createQuizView(stage, doors) {
  const active = new Map();
  return {
    render(timeline, answers, t, instant) {
      const visible = (timeline.questions ?? []).filter(q => q.from <= t && t < q.until);
      for (const [id, item] of active) if (!visible.some(q => q.id === id && q === item.question)) {
        item.node.remove(); active.delete(id);
      }
      for (const question of visible) {
        let item = active.get(question.id);
        if (!item) {
          const node = element('div', 'mx-quiz');
          node.dataset.ask = question.id;
          node.dataset.layout = question.layout;
          if (!instant) node.setAttribute('data-in', '');
          for (const [key, value] of Object.entries(question.box)) node.style.setProperty(`--${key}`, `${value}px`);
          const choices = element('ol', 'mx-choices');
          const buttons = question.choices.map((choice, index) => {
            const li = element('li');
            const button = element('button', 'mx-choice');
            button.dataset.key = index + 1;
            const label = element('span', 'mx-choice-label');
            label.innerHTML = typeof choice === 'string' ? cueMarkup(choice) : choice.html;
            button.setAttribute('aria-label', `${index + 1}. ${typeof choice === 'string' ? choice.replace(/\*\*/g, '') : choice.text}`);
            button.append(element('span', 'mx-choice-key', index + 1), label);
            li.append(button); choices.append(li);
            return button;
          });
          const hint = element('p', 'mx-quiz-hint');
          hint.append(element('span', 'mx-quiz-how', '数字キーか、押して答える'), element('span', 'mx-quiz-skip', '→ で答えを見る'));
          node.append(choices, hint);
          stage.insertBefore(node, doors);
          item = { node, buttons, question }; active.set(question.id, item);
        }
        const answer = answerAt(timeline, answers, question.id, t);
        const state = answer.result ?? (answer.waiting ? 'wait' : 'open');
        if (item.node.dataset.state !== state) item.node.dataset.state = state;
        if (instant) { item.node.removeAttribute('data-in'); item.node.getAnimations().forEach(a => a.cancel()); }
        item.buttons.forEach((button, i) => {
          button.toggleAttribute('data-picked', answer.choice === i);
          button.toggleAttribute('data-correct', !!answer.result && question.answer === i);
          if (answer.result) { if (button.getAttribute('aria-disabled') !== 'true') button.setAttribute('aria-disabled', 'true'); }
          else button.removeAttribute('aria-disabled');
        });
      }
    },
  };
}
