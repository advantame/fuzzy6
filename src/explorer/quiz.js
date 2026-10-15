import { parseLine } from './script.js';

export const conditions = source => source.when === undefined ? [] : Array.isArray(source.when) ? source.when : [source.when];
export const outcome = (source, choice) => choice == null ? 'skip' : choice === source.ask.answer ? 'right' : 'wrong';
export function includesLine(source, sources, answers) {
  return source.when === undefined || conditions(source).some(condition => {
    const [id, result] = condition.split('.');
    return outcome(sources.find(s => s.id === id), Object.hasOwn(answers, id) ? answers[id] : undefined) === result;
  });
}
export function validateQuestions(sources) {
  const questions = new Set();
  const conditional = new Set();
  for (const source of sources) if (source.when !== undefined) {
    conditional.add(source.id);
    for (const anchor of parseLine(source.text).anchors) conditional.add(anchor.name);
  }
  for (const source of sources) {
    if (source.when !== undefined) {
      const terms = conditions(source);
      if (!terms.length || terms.some(c => typeof c !== 'string' || !/^[a-z][a-z0-9-]*\.(right|wrong|skip)$/.test(c) || !questions.has(c.split('.')[0])))
        throw new Error(`Invalid when: ${source.id}`);
    }
    if (source.ask === undefined) continue;
    const ask = source.ask;
    if (!ask || source.text === undefined || !parseLine(source.text).speech.length || source.when !== undefined)
      throw new Error(`ask requires an unconditional spoken line: ${source.id}`);
    if (!Array.isArray(ask.choices) || ask.choices.length < 2 || ask.choices.length > 9 || ask.choices.some(c =>
      typeof c !== 'string' && (!c || typeof c.html !== 'string' || typeof c.text !== 'string')))
      throw new Error(`Invalid ask choices: ${source.id}`);
    if (!Number.isInteger(ask.answer) || ask.answer < 0 || ask.answer >= ask.choices.length)
      throw new Error(`Invalid ask answer: ${source.id}`);
    if (ask.layout !== undefined && !['row', 'column', 'grid'].includes(ask.layout)) throw new Error(`Invalid ask layout: ${source.id}`);
    if (ask.box !== undefined && (!ask.box || ['x', 'y', 'w', 'h'].some(k => !Number.isFinite(ask.box[k])) || ask.box.w <= 0 || ask.box.h <= 0))
      throw new Error(`Invalid ask box: ${source.id}`);
    for (const key of ['from', 'until']) if (ask[key] !== undefined &&
      (typeof ask[key] !== 'string' || conditional.has(ask[key].split('.')[0])))
      throw new Error(`Invalid ask ${key}: ${source.id}`);
    questions.add(source.id);
  }
}
export function resolveQuestions(sources, at) {
  const questions = sources.filter(s => s.ask).map(source => ({
    ...source.ask, id: source.id, start: at(source.id), gate: at(`${source.id}.done`),
    from: at(source.ask.from ?? source.id), layout: source.ask.layout ?? 'row',
    box: source.ask.box ?? { x: 200, y: 660, w: 1200, h: 180 },
  }));
  questions.forEach((q, i) => {
    const source = sources.find(s => s.id === q.id);
    q.until = source.ask.until === undefined ? questions[i + 1]?.from ?? Infinity : at(source.ask.until);
    if (!Number.isFinite(q.from) || q.from > q.gate || q.until <= q.from ||
      (source.ask.until !== undefined && !Number.isFinite(q.until))) throw new Error(`Invalid ask interval: ${q.id}`);
  });
  const ordered = [...questions].sort((a, b) => a.from - b.from);
  if (ordered.some((q, i) => i && ordered[i - 1].until > q.from)) throw new Error('Overlapping ask intervals');
  return questions;
}
export function validAnswers(sources = [], answers = {}) {
  return Object.fromEntries(Object.entries(answers).filter(([id, choice]) => {
    const ask = sources.find(s => s.id === id)?.ask;
    return ask && (choice === null || (Number.isInteger(choice) && choice >= 0 && choice < ask.choices?.length));
  }));
}
export function answerAt(timeline, answers, id, t, thumb = false) {
  const q = timeline.questions?.find(q => q.id === id);
  if (!q) throw new Error(`Unknown question: ${id}`);
  if (thumb) return { choice: null, result: null, waiting: false };
  const choice = Object.hasOwn(answers, id) ? answers[id] : null;
  return { choice, result: choice !== null ? choice === q.answer ? 'right' : 'wrong' : (Object.hasOwn(answers, id) || t > q.gate) ? 'skip' : null,
    waiting: !Object.hasOwn(answers, id) && t === q.gate };
}
export const availableQuestion = (timeline, answers, t) => timeline.questions?.find(q =>
  q.from <= t && t < q.until && answerAt(timeline, answers, q.id, t).result === null);
export const crossedGate = (timeline, answers, before, after) => timeline.questions?.find(q =>
  !Object.hasOwn(answers, q.id) && before < q.gate && after >= q.gate);
export function clearAnswers(timeline, answers, before, after) {
  if (after >= before) return false;
  let changed = false;
  for (const q of timeline.questions ?? []) if (after <= q.start && Object.hasOwn(answers, q.id)) {
    delete answers[q.id]; changed = true;
  }
  return changed;
}
export function parseAnswers(text = '') {
  const answers = {};
  for (const term of text.split(',')) {
    const match = /^([a-z][a-z0-9-]*):([0-8])$/.exec(term);
    if (match) answers[match[1]] = Number(match[2]);
  }
  return answers;
}

// Check every possible result without constructing all timelines. Work is a
// depth-first search over the finite set of question results; retain only one
// assignment. Upper bounds combine mutually exclusive single-question lines.
// Most clips are proven safe at the root, including long lists of short quizzes.
export function validateQuestionDuration(costs, head) {
  const ids = costs.filter(c => c.source.ask).map(c => c.source.id);
  if (!ids.length) return;
  const choices = new Map();
  const results = ['right', 'wrong', 'skip'];
  const terms = costs.map(c => conditions(c.source).map(term => term.split('.')));
  const lastRequired = costs.findLastIndex(c => c.source.when === undefined);
  const minLastRest = Math.min(...costs.slice(lastRequired).map(c => c.rest));
  function upper() {
    let sum = head;
    const single = new Map();
    costs.forEach((cost, index) => {
      const clause = terms[index];
      if (!clause.length || clause.some(([id, result]) => choices.get(id) === result)) { sum += cost.total; return; }
      const possible = clause.filter(([id]) => !choices.has(id));
      if (!possible.length) return;
      const variables = new Set(possible.map(([id]) => id));
      if (variables.size > 1) { sum += cost.total; return; }
      const id = possible[0][0];
      if (!single.has(id)) single.set(id, [0, 0, 0]);
      const weights = single.get(id);
      for (const result of new Set(possible.map(([, result]) => result))) weights[results.indexOf(result)] += cost.total;
    });
    for (const weights of single.values()) sum += Math.max(...weights);
    return sum - minLastRest;
  }
  function exact() {
    let sum = head, rest = 0;
    costs.forEach((cost, index) => {
      if (!terms[index].length || terms[index].some(([id, result]) => choices.get(id) === result)) {
        sum += cost.total; rest = cost.rest;
      }
    });
    return sum - rest;
  }
  // Iterative traversal avoids stack overflow for an unusually long script.
  const branches = Array(ids.length).fill(0);
  let depth = 0;
  while (depth >= 0) {
    if (upper() <= 180000) {
      if (depth === 0) return;
      depth--; choices.delete(ids[depth]);
    } else if (depth === ids.length) {
      if (exact() > 180000) throw new Error('duration must not exceed 180 seconds for any answers');
      depth--; choices.delete(ids[depth]);
    } else if (branches[depth] < results.length) {
      choices.set(ids[depth], results[branches[depth]++]);
      depth++;
      if (depth < ids.length) branches[depth] = 0;
    } else {
      branches[depth] = 0;
      depth--;
      if (depth >= 0) choices.delete(ids[depth]);
    }
  }
}
