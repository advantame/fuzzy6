import { describe, it, expect } from 'vitest';
import { buildTimeline, mergePace, nextTarget } from '../src/explorer/timeline.js';
import { answerAt, availableQuestion, crossedGate, clearAnswers, parseAnswers } from '../src/explorer/quiz.js';
import { collectLines } from '../tools/narrate/core.mjs';
import { renderScript } from '../tools/script-doc.mjs';
const question = (id = 'q1', ask = {}) => ({ id, text: 'a{mark}b', ask: { choices: ['yes', { html: '<b>no</b>', text: 'no' }], answer: 0, ...ask } });
const clip = script => ({ id: 'quiz', title: 'Quiz', script, setup() {} });
const script = () => [question(),
  { id: 'yes', when: 'q1.right', text: 'right{hit}', lead: 0.5 },
  { id: 'no', when: ['q1.wrong', 'q1.skip'], text: 'wrong', lead: 1 },
  { id: 'common', text: 'common' },
];
const deck = c => ({ id: 'example', title: 'Example', chapters: [{ id: 'one', title: 'One', clips: [c] }] });

describe('question validation', () => {
  const invalid = [
    ['silent', () => [{ ...question(), text: undefined }]],
    ['conditional question', () => [question(), { ...question('q2'), when: 'q1.right', text: 'q2' }]],
    ['null ask', () => [{ ...question(), ask: null }]],
    ['few choices', () => [question('q1', { choices: ['one'] })]],
    ['many choices', () => [question('q1', { choices: Array(10).fill('a') })]],
    ['non-array choices', () => [question('q1', { choices: 'ab' })]],
    ['missing choice text', () => [question('q1', { choices: ['a', { html: 'b' }] })]],
    ['missing choice html', () => [question('q1', { choices: ['a', { text: 'b' }] })]],
    ['numeric choice', () => [question('q1', { choices: ['a', 1] })]],
    ...[-1, 2, 0.5, '0', NaN, undefined].map(answer => ['answer ' + answer, () => [question('q1', { answer })]]),
    ['layout', () => [question('q1', { layout: 'other' })]],
    ['box', () => [question('q1', { box: { x: 0, y: 0, w: 0, h: 1 } })]],
    ['unknown from', () => [question('q1', { from: 'missing' })]],
    ['unknown until', () => [question('q1', { until: 'missing' })]],
    ['numeric from', () => [question('q1', { from: 0 })]],
    ['numeric until', () => [question('q1', { until: 2 })]],
    ['from after gate', () => [question('q1', { from: 'after' }), { id: 'after', text: 'a' }]],
    ['until equals from', () => [question('q1', { until: 'q1' })]],
    ['until before from', () => [question('q1', { from: 'mark', until: 'q1' })]],
    ['conditional line from', () => [question('q1', { from: 'yes' }), { id: 'yes', when: 'q1.right', text: 'a' }]],
    ['conditional anchor until', () => [question('q1', { until: 'later' }), { id: 'yes', when: 'q1.right', text: '{later}a' }]],
    ['conditional suffix until', () => [question('q1', { until: 'yes.done' }), { id: 'yes', when: 'q1.right', text: 'a' }]],
    ['overlap', () => [question('q1', { until: 'q2.done' }), { ...question('q2'), text: 'q2' }]],
    ['forward when', () => [{ id: 'yes', when: 'q1.right', text: 'a' }, question()]],
    ['non-question when', () => [{ id: 'a', text: 'a' }, { id: 'b', text: 'b', when: 'a.right' }]],
    ...['q1.other', 'q1', [], null, 1, ['q1.right', 1]].map(when => ['invalid when ' + when, () => [question(), { id: 'yes', when, text: 'a' }]]),
  ];
  it.each(invalid)('rejects %s', (_, make) => expect(() => buildTimeline(clip(make()))).toThrow());
  it('validates excluded lines too', () => {
    expect(() => buildTimeline(clip([question(), { id: 'yes', when: 'q1.right', text: 'a', tail: -1 }]))).toThrow('tail');
  });
  it('allows 2–9 choices, three layouts and explicit unconditional anchor bounds', () => {
    for (const layout of ['row', 'column', 'grid']) {
      const tl = buildTimeline(clip([question('q1', { choices: Array(9).fill('a'), answer: 8, layout, from: 'mark', until: 'after.done', box: { x: 1, y: 2, w: 3, h: 4 } }), { id: 'after', text: 'a' }]));
      expect(tl.questions[0]).toMatchObject({ layout, from: tl.at('mark'), until: tl.duration });
    }
  });
  it('rejects a long non-default branch and mixed-question combinations', () => {
    expect(() => buildTimeline(clip([question(), { id: 'yes', when: 'q1.right', lead: 180 }]))).toThrow('180');
    const sources = [question(), { ...question('q2'), text: 'q2' },
      { id: 'a', when: 'q1.right', lead: 90 }, { id: 'b', when: 'q2.wrong', lead: 90 }];
    expect(() => buildTimeline(clip(sources))).toThrow('180');
  });
  it('does not add mutually exclusive branches when checking the limit', () => {
    expect(buildTimeline(clip([question(), ...['right', 'wrong', 'skip'].map(result => ({ id: result, when: `q1.${result}`, lead: 170 }))])).duration).toBeLessThan(180);
  });
  it('checks OR conditions once, and keeps a finite linear bound for independent alternatives', () => {
    const sources = Array.from({ length: 50 }, (_, i) => [
      { ...question(`q${i}`), text: 'q' },
      ...['right', 'wrong', 'skip'].map(result => ({ id: `${result}-${i}`, when: `q${i}.${result}`, lead: 1, rest: 0 })),
    ]).flat();
    expect(buildTimeline(clip(sources)).duration).toBeLessThan(180);
  });
});

describe('question timeline and time-dependent answers', () => {
  it.each([['right', 0], ['wrong', 1], ['skip', undefined]])('calculates %s with excluded anchors at Infinity', (result, choice) => {
    const tl = buildTimeline(clip(script()), mergePace(), undefined, choice === undefined ? {} : { q1: choice });
    const selected = result === 'right' ? 'yes' : 'no', excluded = result === 'right' ? 'no' : 'yes';
    expect(tl.lines.map(l => l.id)).toEqual(['q1', selected, 'common']);
    for (const suffix of ['', '.start', '.voice', '.end', '.done', '.next']) expect(tl.at(excluded + suffix)).toBe(Infinity);
    if (result !== 'right') expect(tl.at('hit')).toBe(Infinity);
    expect(tl.cues).toHaveLength(3);
    expect(tl.stops.some(s => s.line === excluded)).toBe(false);
    expect(tl.stops.find(s => s.kind === 'ask')).toMatchObject({ at: tl.at('q1.done'), line: 'q1' });
    expect(tl.at('q1.next')).toBe(tl.at(selected));
  });
  it('merges an ask with a nearby line/still and retains the gate', () => {
    const tl = buildTimeline(clip([question('q1', { }), { id: 'last', lead: 1 }]), mergePace({ rest: { normal: 0.01 } }));
    expect(tl.stops.find(s => s.kind === 'ask').at).toBe(tl.at('q1.done'));
    expect(nextTarget(tl, tl.at('q1.done') - 0.1, mergePace())).toEqual({ at: tl.at('q1.done'), kind: 'stop' });
    const final = buildTimeline(clip([question()]));
    expect(final.stops.at(-1).kind).toBe('ask');
  });
  it('uses next question from as until, and leaves the final choices visible at duration', () => {
    const tl = buildTimeline(clip([question(), { ...question('q2'), text: 'second' }]));
    expect(tl.questions[0].until).toBe(tl.at('q2'));
    expect(tl.questions[1].until).toBe(Infinity);
  });
  it('distinguishes open, wait, skip, choices and unknown IDs at the supplied time', () => {
    const tl = buildTimeline(clip(script())); const gate = tl.at('q1.done');
    expect(answerAt(tl, {}, 'q1', gate - 0.1)).toEqual({ choice: null, result: null, waiting: false });
    expect(answerAt(tl, {}, 'q1', gate)).toEqual({ choice: null, result: null, waiting: true });
    expect(answerAt(tl, {}, 'q1', gate + 0.1).result).toBe('skip');
    expect(answerAt(tl, { q1: 0 }, 'q1', gate)).toEqual({ choice: 0, result: 'right', waiting: false });
    expect(answerAt(tl, { q1: 1 }, 'q1', gate).result).toBe('wrong');
    expect(answerAt(tl, { q1: 0 }, 'q1', tl.duration, true)).toEqual({ choice: null, result: null, waiting: false });
    expect(() => answerAt(tl, {}, 'missing', 0)).toThrow('Unknown question');
    expect(availableQuestion(tl, {}, gate)?.id).toBe('q1');
    expect(availableQuestion(tl, {}, gate + 0.1)).toBeUndefined();
  });
  it('crosses a gate only from below, ignores answered questions and clears on backwards head crossing', () => {
    const tl = buildTimeline(clip(script())), gate = tl.at('q1.done');
    expect(crossedGate(tl, {}, gate - 0.01, gate)?.id).toBe('q1');
    expect(crossedGate(tl, {}, gate, gate + 0.1)).toBeUndefined();
    expect(crossedGate(tl, { q1: 0 }, 0, gate)).toBeUndefined();
    const answers = { q1: 0 };
    expect(clearAnswers(tl, answers, gate, 0.1)).toBe(false);
    expect(clearAnswers(tl, answers, gate, 0)).toBe(true);
    expect(answers).toEqual({});
  });
  it('parses only zero-based choice indices', () => expect(parseAnswers('q1:0,q2:2,bad:-1,x:9,wrong')).toEqual({ q1: 0, q2: 2 }));
});

it('narrates every conditional line and documents all choices/conditions with skip duration', () => {
  const c = clip(script()), d = deck(c);
  d.voice = { cast: { narrator: { name: 'Narrator', speaker: '四国めたん', style: 'ノーマル' } } };
  expect(collectLines(d).map(l => l.lineId)).toEqual(['q1', 'yes', 'no', 'common']);
  const text = renderScript(d);
  expect(text).toContain('選択肢: 1. yes（正解） 2. no');
  expect(text).toContain('〔q1 が正解のとき〕');
  expect(text).toContain('〔q1 が不正解か飛ばしたとき〕');
  expect(text).toContain(buildTimeline(c).duration.toFixed(1) + ' 秒');
});

it('question IDs matching Object properties still begin unanswered', () => {
  const tl = buildTimeline(clip([{ ...question('constructor'), text: 'a' }, { id: 'yes', when: 'constructor.right', lead: 1 }]));
  expect(answerAt(tl, {}, 'constructor', 0).choice).toBeNull();
  expect(tl.at('yes')).toBe(Infinity);
});

it('a door from an excluded conditional anchor stays closed without failing the clip', () => {
  const c = { ...clip(script()), doors: [{ to: 'dive', from: 'hit', until: 'common' }] };
  const skipped = buildTimeline(c);
  expect(skipped.doors[0].from).toBe(Infinity);
  expect(buildTimeline(c, mergePace(), undefined, { q1: 0 }).doors[0].from).toBeLessThan(Infinity);
});

it('ignores unknown and out-of-range supplied answers when resolving branches', () => {
  const tl = buildTimeline(clip(script()), mergePace(), undefined, { q1: 8, missing: 0 });
  expect(tl.at('yes')).toBe(Infinity);
  expect(tl.at('no')).toBeLessThan(Infinity);
});
