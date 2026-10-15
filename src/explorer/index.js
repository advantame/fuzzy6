import { answerAt, availableQuestion, crossedGate, clearAnswers, parseAnswers, validAnswers } from './quiz.js';
import { createQuizView } from './quiz-view.js';
import { doorsAt, descentTarget, ascentTarget } from './dive.js';
import { createCastView } from './cast-view.js';
import { normalizeDeck, clampTime, advanceTime, seekState, canCutJoin, diveNeighbor } from './model.js';
import { createChrome } from './chrome.js';
import { createLayer } from './layer.js';
import { bindInput } from './input.js';
import { buildTimeline, mergePace, nextTarget, previousTarget, preservePosition, positionAt, posterTime } from './timeline.js';
import { createSound } from './sound.js';

export function createExplorer(host, deck, options = {}) {
  const model = normalizeDeck(deck);
  const params = options.url === false ? new URLSearchParams() : new URLSearchParams(location.search);
  const still = params.has('t');
  const clean = params.has('clean');
  const root = document.createElement('div');
  root.className = 'mx';
  root.dataset.deck = deck.id;
  root.style.setProperty('--mx-gutter', `${model.gutter}px`);
  root.toggleAttribute('data-gutter', model.gutter > 0);
  root.toggleAttribute('data-still', still);
  root.toggleAttribute('data-clean', clean);
  host.append(root);
  const listeners = new AbortController();
  const timers = new Set();
  const frames = new Set();
  const retirements = new Map();
  let destroyed = false;
  let generation = 0;
  let pending = model.ids.get(params.get('c')) ?? model.clips[0];
  let diveStack = [];
  let answers = {};
  let waiting = null;
  let openDoors = [];
  let current = null;
  let layer = null;
  let outgoing = null;
  let t = 0;
  let pace = mergePace(deck.pace);
  let timing;
  let soundOn = params.get('sound') !== '0';
  let soundState = soundOn ? 'on' : 'off';
  let subs = true;
  let castOn = params.get('cast') !== '0';
  let landingTimer;
  let tune;
  const sound = still ? null : createSound(deck.voice);
  const view = () => ({ ...current.clip, ...timing.value });
  function compute(clip, choices = {}) {
    try { return buildTimeline(clip, pace, deck.voice, choices); }
    catch (error) {
      return { ...buildTimeline({ duration: 1 }), error };
    }
  }
  let status = 'loading';
  let k = 1;
  let auto = params.get('auto') === '1' || !!deck.autoAdvance;
  let indexOpen = false;
  let indexWasPlaying = false;
  let previousFocus;
  let holdTimer;
  let clockFrame;
  let lastStamp;
  let cursorTimer;
  const events = new Map();
  const fonts = new Map();
  const reported = new Set();
  const listen = (target, type, fn, opts = {}) =>
    target.addEventListener(type, fn, { ...opts, signal: listeners.signal });
  function later(fn, ms) {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!destroyed) fn();
    }, ms);
    timers.add(id);
    return id;
  }
  function cancelTimer(id) {
    clearTimeout(id);
    timers.delete(id);
  }
  function frame(fn) {
    const id = requestAnimationFrame(stamp => {
      frames.delete(id);
      if (!destroyed) fn(stamp);
    });
    frames.add(id);
    return id;
  }
  function cancelFrame(id) {
    cancelAnimationFrame(id);
    frames.delete(id);
  }
  function retire(el, event, ms, dispose = () => el.remove()) {
    const finish = () => {
      cancelTimer(timer);
      el.removeEventListener(event, end);
      retirements.delete(el);
      dispose();
    };
    const end = e => {
      if (e.target === el) finish();
    };
    const timer = later(finish, ms);
    el.addEventListener(event, end);
    retirements.set(el, finish);
  }
  function remove(el) {
    const finish = retirements.get(el);
    if (finish) finish();
    else el.remove();
  }
  const chrome = createChrome(root, deck, model, retire, frame);
  const { q } = chrome;
  const quizView = createQuizView(q('stage'), q('doors'));
  const castView = createCastView(root, q('subs'));
  function state() {
    return {
      deck: deck.id,
      chapter: current?.chapter.id ?? null,
      clip: current?.clip.id ?? null,
      index: current?.index ?? -1,
      count: model.clips.length,
      t,
      duration: timing?.value.duration ?? 0,
      head: timing?.value.head ?? 0,
      state: status,
      auto,
      indexOpen,
      sound: soundState, subs, cast: castView.state(),
      line: timing ? positionAt(timing.value, t)?.line ?? null : null,
      stops: timing ? timing.value.stops.map(s => ({ ...s })) : [],
      target: timing ? nextTarget(timing.value, t, pace) : null,
      dive: current?.dive ? { parent: current.parent.clip.id, depth: diveStack.length, group: current.group?.id ?? null, part: current.part + 1, parts: current.parts } : null,
      ask: waiting,
      answers: Object.fromEntries((timing?.value.questions ?? []).map(q => [q.id, answerAt(timing.value, answers, q.id, t)])),
      doors: timing ? doorsAt(timing.value.doors, t).map(({ to, label, by }) => ({ to, label, by })) : [],
    };
  }
  function emit(name) {
    for (const fn of events.get(name) ?? []) fn(state());
  }
  function setState(value) {
    if (status === value && root.dataset.state === value) return;
    status = value;
    root.dataset.state = value;
    emit('state');
    if (value !== 'playing') {
      sound?.stop();
      cancelFrame(clockFrame);
      clockFrame = null;
      lastStamp = undefined;
      showCursor(false);
    } else {
      showCursor();
      startClock();
    }
  }
  function cancelHold() {
    cancelTimer(holdTimer);
    holdTimer = null;
    cancelTimer(landingTimer);
    landingTimer = null;
    root.removeAttribute('data-landing');
    if (status === 'playing') startClock();
  }
  function showCursor(schedule = status === 'playing') {
    cancelTimer(cursorTimer);
    root.removeAttribute('data-cursor-hidden');
    if (schedule) cursorTimer = later(() => root.setAttribute('data-cursor-hidden', ''), 2500);
  }
  function render(instant = false) {
    if (!current || destroyed) return;
    if (still) waiting = timing.value.questions?.find(q => answerAt(timing.value, answers, q.id, t).waiting)?.id ?? null;
    if (waiting) { if (root.dataset.ask !== waiting) root.dataset.ask = waiting; }
    else root.removeAttribute('data-ask');
    layer.render(t);
    quizView.render(timing.value, answers, t, instant || still || status !== 'playing');
    chrome.render(view(), t, instant || still, still, nextTarget(timing.value, t, pace));
    castView.render(current.clip.id, timing.value, t, castOn);
    const doors = doorsAt(timing.value.doors, t);
    chrome.doors(doors, instant || still || status !== 'playing');
    if (doors.length !== openDoors.length || doors.some((door, i) => door !== openDoors[i])) {
      openDoors = doors;
      for (const door of doors) void loadFonts(model.targets.get(door.to).clip.fonts);
      prepareSound(current, timing.value, t);
    }
    emit('time');
  }
  function ended(natural = false) {
    setState('ended');
    cancelHold();
    if (natural && auto && !still && !indexOpen && (current.dive || current.index < model.clips.length - 1))
      holdTimer = later(() => next(), Math.max(0, current.clip.hold ?? pace.end) * 1000);
  }
  function startClock() {
    if (clockFrame || status !== 'playing' || document.hidden || destroyed || landingTimer) return;
    clockFrame = frame(stamp => {
      clockFrame = null;
      const dt = lastStamp === undefined ? 0 : Math.max(0, Math.min(0.1, (stamp - lastStamp) / 1000));
      const before = t;
      t = soundOn && sound ? sound.clock(current.clip.id, timing.value, t, dt)
        : advanceTime(t, dt, timing.value.duration);
      lastStamp = stamp;
      const gate = crossedGate(timing.value, answers, before, t);
      if (gate) { t = gate.gate; waiting = gate.id; setState('paused'); }
      else for (const q of timing.value.questions ?? [])
        if (before === q.gate && t > q.gate && !Object.hasOwn(answers, q.id)) answers[q.id] = null;
      render();
      if (gate) return;
      if (t >= timing.value.duration) ended(true);
      else startClock();
    });
  }
  async function loadFonts(list = []) {
    await Promise.all(
      list.map(([font, text]) => {
        const key = JSON.stringify([font, text]);
        if (!fonts.has(key))
          fonts.set(
            key,
            Promise.resolve()
              .then(() => document.fonts?.load(font, text))
              .catch(() => {}),
          );
        return fonts.get(key);
      }),
    );
  }
  const bootFonts = loadFonts(deck.fonts);
  const report = (id, error) => {
    if (!reported.has(id)) {
      reported.add(id);
      console.error(`Motion Explorer: ${id}`, error);
    }
  };
  function newLayer(clip, thumb = false, box = timing) {
    const source = box.value.error ? { ...clip, setup() { throw box.value.error; } } : clip;
    return createLayer(source, root, { k, still, thumb, report, timing: () => box.value, pace: () => pace, answers: () => box.answers ?? {} });
  }
  function prepareSound(entry, timeline, seconds = 0, stack = diveStack) {
    if (!sound) return;
    // Retain only the current neighborhood and the currently open destinations.
    const neighbors = entry.dive
      ? [diveNeighbor(entry, -1), diveNeighbor(entry, 1), model.ids.get(stack.at(-1)?.id) ?? entry.parent]
      : [model.clips[entry.index - 1], model.clips[entry.index + 1]];
    const entries = [...new Set([entry, ...neighbors,
      ...doorsAt(timeline.doors, seconds).map(d => model.targets.get(d.to))].filter(Boolean))];
    sound.prepare(entries.map(e => ({ id: e.clip.id, timeline: e === entry ? timeline : compute(e.clip) })), soundOn);
  }
  function syncSound() {
    if (root.dataset.sound !== soundState) root.dataset.sound = soundState;
    if (q('sound') && q('sound').getAttribute('aria-pressed') !== String(soundOn))
      q('sound').setAttribute('aria-pressed', String(soundOn));
    if (soundState === 'blocked') {
      if (!q('unlock')) {
        const button = document.createElement('button');
        button.className = 'mx-unlock';
        button.textContent = '音声つきで再生';
        q('stage').append(button);
      }
    } else q('unlock')?.remove();
  }
  function blocked() {
    const waiting = soundOn && sound && timing.value.lines.some(l => l.spoken) && sound.blocked();
    soundState = waiting ? 'blocked' : soundOn ? 'on' : 'off';
    syncSound();
    return waiting;
  }
  function unlock() {
    if (soundState !== 'blocked') {
      if (soundOn && sound && (deck.voice || timing?.value.lines.some(l => l.spoken))) void sound.unlock();
      return false;
    }
    const ticket = generation;
    void sound.unlock().then(() => {
      if (!destroyed && ticket === generation && status === 'paused' && !blocked()) play();
    });
    return true;
  }
  function setSound(on) {
    cancelHold();
    soundOn = !!on;
    sound?.stop();
    const wasBlocked = soundState === 'blocked';
    soundState = soundOn ? 'on' : 'off';
    syncSound();
    if (current && soundOn && sound) {
      prepareSound(current, timing.value, t);
      const resume = status === 'playing' || wasBlocked;
      const ticket = generation;
      void sound.unlock().then(() => {
        if (destroyed || ticket !== generation || !soundOn) return;
        if (!blocked() && resume && status === 'paused') play();
      });
      if (blocked()) setState('paused');
    }
    if (wasBlocked && !soundOn) play();
  }
  function setSubs(on) {
    cancelHold();
    subs = !!on;
    if (subs) root.removeAttribute('data-subs');
    else root.dataset.subs = 'off';
  }
  function setCast(on) {
    cancelHold();
    castOn = !!on;
    if (current && !destroyed) castView.render(current.clip.id, timing.value, t, castOn);
  }
  function setPace(patch) {
    const nextPace = mergePace(pace, patch);
    cancelHold();
    sound?.stop();
    pace = nextPace;
    if (!current) return;
    const before = timing.value;
    timing.value = compute(current.clip, answers);
    t = preservePosition(before, timing.value, t);
    lastStamp = undefined;
    chrome.timing(view());
    prepareSound(current, timing.value, t);
    thumbDone.clear();
    render(true);
    if (t >= timing.value.duration) ended();
    else if (status === 'ended') setState('paused');
    emit('timeline');
    thumbnails();
  }
  async function navigate(entry, seconds, dir = 'jump', stack = [], returning = false, restored = {}) {
    if (destroyed) return;
    const requestedJoin = canCutJoin(current, entry, t, timing?.value.duration, dir);
    const joins = () => requestedJoin && canCutJoin(current, entry, t, timing?.value.duration, dir);
    cancelHold();
    pending = entry;
    // Only the last destination may set up a layer after asynchronous font loads.
    const ticket = ++generation;
    setState('loading');
    await bootFonts;
    if (ticket !== generation || destroyed) return;
    await loadFonts(entry.clip.fonts);
    if (ticket !== generation || destroyed) return;
    const nextAnswers = validAnswers(entry.clip.script, restored);
    const nextTimeline = compute(entry.clip, nextAnswers);
    const entryTime = () => clampTime(seconds ?? (joins() ? 0 : nextTimeline.head), nextTimeline.duration);
    prepareSound(entry, nextTimeline, entryTime(), stack);
    if (sound && soundOn) await sound.waitFirst(entry.clip.id, nextTimeline);
    if (ticket !== generation || destroyed) return;
    if (indexOpen) closeIndex(false);
    const start = entryTime();
    const cut = !still && joins();
    const joinedLayer = cut ? layer : null;
    // Retire the previous exit before adding an entrance: at most two live layers.
    if (outgoing) {
      remove(outgoing.el);
      outgoing = null;
    }
    if (layer && !cut) {
      if (still) layer.dispose();
      else {
        outgoing = layer;
        outgoing.el.dataset.role = 'out';
        const old = outgoing;
        retire(old.el, 'transitionend', 700, () => {
          old.dispose();
          if (outgoing === old) outgoing = null;
        });
      }
    }
    current = entry;
    diveStack = stack;
    openDoors = [];
    chrome.doors([], true);
    answers = nextAnswers;
    waiting = null;
    timing = { value: nextTimeline, answers };
    t = start;
    root.dataset.chapter = entry.chapter.id;
    root.dataset.clip = entry.clip.id;
    root.dataset.dir = dir;
    root.toggleAttribute('data-dive', entry.dive);
    root.toggleAttribute('data-first', !entry.dive && entry.index === 0);
    root.toggleAttribute('data-last', !entry.dive && entry.index === model.clips.length - 1);
    root.style.setProperty(
      '--mx-deck-progress',
      model.clips.length === 1 ? 0 : entry.index / (model.clips.length - 1),
    );
    layer = newLayer(entry.clip);
    layer.el.dataset.role = still || cut ? 'current' : 'in';
    q('stage').append(layer.el);
    layer.setup();
    chrome.change({ ...entry, clip: view() }, still);
    document.title = `${entry.clip.title} — ${deck.title}`;
    if (options.url !== false) {
      const url = new URL(location.href);
      url.searchParams.set('c', entry.clip.id);
      history.replaceState(null, '', url);
    }
    render(true);
    // Paint the replacement before retiring the last picture, without yielding
    // to a browser frame or putting either layer into an entrance/exit state.
    joinedLayer?.dispose();
    if (still) {
      await castView.wait();
      if (ticket !== generation || destroyed) return;
    }
    if (!still && !cut) {
      const incoming = layer;
      void incoming.el.offsetWidth;
      frame(() => {
        if (incoming === layer) incoming.el.dataset.role = 'current';
      });
    }
    if (t >= timing.value.duration) ended(returning);
    else setState(still || blocked() ? 'paused' : 'playing');
    emit('timeline');
    emit('change');
    for (const neighbor of entry.dive ? [diveNeighbor(entry, -1), diveNeighbor(entry, 1)] : [model.clips[entry.index - 1], model.clips[entry.index + 1]])
      if (neighbor) void loadFonts(neighbor.clip.fonts);
    if (still) window.__ready = true;
  }
  function go(id, { t } = {}) {
    const entry = model.ids.get(id);
    if (!entry) return Promise.reject(new Error(`Unknown clip id: ${id}`));
    return navigate(entry, t);
  }
  function next() {
    cancelHold();
    if (pending.dive) {
      const neighbor = diveNeighbor(pending, 1);
      return neighbor ? navigate(neighbor, undefined, 'next', diveStack) : ascend();
    }
    if (pending.index < model.clips.length - 1) return navigate(model.clips[pending.index + 1], undefined, 'next');
  }
  function prev() {
    cancelHold();
    if (pending.dive) {
      const neighbor = diveNeighbor(pending, -1);
      return neighbor ? navigate(neighbor, undefined, 'prev', diveStack) : ascend();
    }
    if (pending.index > 0) return navigate(model.clips[pending.index - 1], undefined, 'prev');
  }
  function descend(to) {
    if (!current || destroyed || status === 'loading' || indexOpen || diveStack.length >= 8) return;
    const door = descentTarget(timing.value.doors, t, to);
    if (!door) return;
    return navigate(model.targets.get(door.to), undefined, 'jump', [...diveStack, { id: current.clip.id, t, answers: { ...answers } }]);
  }
  function ascend() {
    if (destroyed || status === 'loading') return;
    const target = ascentTarget(current, diveStack, compute);
    if (!target) return;
    return navigate(model.ids.get(target.id), target.t, 'jump', diveStack.slice(0, -1), true, target.answers);
  }
  function rebuildAnswers() {
    sound?.stop();
    timing.value = compute(current.clip, answers);
    timing.answers = answers;
    lastStamp = undefined;
    chrome.timing(view());
    prepareSound(current, timing.value, t);
    emit('timeline');
  }
  function answer(id, choice) {
    if (!current || destroyed || status === 'loading') return false;
    const question = availableQuestion(timing.value, answers, t);
    if (!question || question.id !== id || !Number.isInteger(choice) || choice < 0 || choice >= question.choices.length) return false;
    const resume = waiting === id;
    cancelHold();
    answers[id] = choice;
    waiting = null;
    rebuildAnswers();
    render(true);
    if (resume && !still) {
      if (t >= timing.value.duration) ended(true);
      else play();
    }
    return true;
  }
  function restart() {
    if (!current || status === 'loading') return;
    answers = {};
    waiting = null;
    rebuildAnswers();
    t = timing.value.head;
    render(true);
    if (t >= timing.value.duration) ended();
    else play();
  }
  function play() {
    cancelHold();
    if (!current || destroyed || status === 'loading' || indexOpen) return;
    const gate = timing.value.questions?.find(q => q.gate === t && !Object.hasOwn(answers, q.id));
    if (gate) answers[gate.id] = null;
    else if (t >= timing.value.duration) { restart(); return; }
    // Starting exactly on a gate deliberately passes it. The next frame is
    // strictly beyond the gate; retain the skip until the question is rewound.
    waiting = null;
    root.removeAttribute('data-ask');
    if (gate) render(true);
    if (t >= timing.value.duration) { ended(true); return; }
    if (!still && blocked()) { setState('paused'); unlock(); return; }
    setState('playing');
  }
  function pause() {
    cancelHold();
    if (status === 'playing') setState('paused');
  }
  function seek(seconds) {
    cancelHold();
    if (!current || destroyed) return;
    sound?.stop();
    const before = t;
    const destination = clampTime(seconds, timing.value.duration);
    if (clearAnswers(timing.value, answers, before, destination)) rebuildAnswers();
    t = clampTime(destination, timing.value.duration);
    waiting = null;
    if (!still) for (const q of timing.value.questions ?? [])
      if (t > q.gate && !Object.hasOwn(answers, q.id)) answers[q.id] = null;
    lastStamp = undefined;
    const nextState = seekState(status, t, timing.value.duration);
    render(true);
    if (nextState === 'ended') ended();
    else setState(nextState);
  }
  function moveStop(backward) {
    cancelHold();
    if (!current || status === 'loading') return;
    const wasWaiting = !!waiting;
    const wasPlaying = status === 'playing' || status === 'ended';
    const target = backward ? previousTarget(timing.value, t, pace) : nextTarget(timing.value, t, pace);
    if (!target) {
      if (!backward && waiting) {
        answers[waiting] = null; waiting = null; ended(); render(true); return;
      }
      if (backward && current.dive) {
        const neighbor = diveNeighbor(current, -1);
        return neighbor ? navigate(neighbor, Infinity, 'prev', diveStack) : ascend();
      }
      if (backward && current.index > 0) return navigate(model.clips[current.index - 1], Infinity, 'prev');
      if (!backward && status === 'ended') return next();
      return;
    }
    seek(target.at);
    const gate = timing.value.questions?.find(q => q.gate === t && !Object.hasOwn(answers, q.id));
    if (!backward && target.kind === 'stop' && gate) {
      waiting = gate.id; setState('paused'); render(true); return;
    }
    if (wasWaiting && !backward && !still && t < timing.value.duration) setState('playing');
    if (t >= timing.value.duration) return;
    if (wasPlaying && !still) {
      setState('playing');
      if (target.kind === 'stop' && timing.value.stops.some(s => s.at === t && s.kind === 'still') && pace.land > 0) {
        sound?.stop();
        cancelFrame(clockFrame);
        clockFrame = null;
        lastStamp = undefined;
        root.setAttribute('data-landing', '');
        landingTimer = later(() => {
          landingTimer = null;
          root.removeAttribute('data-landing');
          startClock();
        }, pace.land * 1000);
      }
    }
  }
  function toggleAuto() {
    cancelHold();
    auto = !auto;
    syncAuto();
  }
  function syncAuto() {
    root.toggleAttribute('data-auto', auto);
    q('auto').setAttribute('aria-pressed', String(auto));
  }
  let thumbnailFrame;
  let thumbnailRun = 0;
  let thumbnailBusy = false;
  const thumbDone = new Set();
  function thumbnails() {
    if (!indexOpen || thumbnailBusy || thumbnailFrame || destroyed) return;
    const entry = model.all.find(e => !thumbDone.has(e.clip.id));
    if (!entry) return;
    const run = thumbnailRun;
    thumbnailFrame = frame(async () => {
      thumbnailFrame = null;
      thumbnailBusy = true;
      await loadFonts(entry.clip.fonts);
      if (!destroyed && indexOpen && run === thumbnailRun) {
        // Render at stage size so clip layout and text metrics match playback.
        const box = { value: compute(entry.clip) };
        const preview = newLayer(entry.clip, true, box);
        try {
          preview.setup();
          preview.render(posterTime(entry.clip, box.value));
          const thumb = chrome.buttons[entry.order].querySelector('canvas');
          thumb.width = Math.max(1, Math.floor(112 * k * devicePixelRatio));
          thumb.height = Math.max(1, Math.floor(63 * k * devicePixelRatio));
          const ctx = thumb.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          for (const { canvas } of preview.canvases) ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
          if (preview.canvases.length) thumb.dataset.drawn = '';
          thumbDone.add(entry.clip.id);
        } catch (error) {
          report(entry.clip.id, error);
          thumbDone.add(entry.clip.id);
        } finally {
          preview.dispose();
        }
      }
      thumbnailBusy = false;
      thumbnails();
    });
  }
  function openIndex(chapterHead = false) {
    cancelHold();
    if (!current || indexOpen || destroyed) return;
    indexWasPlaying = status === 'playing';
    previousFocus = document.activeElement;
    pause();
    indexOpen = true;
    root.setAttribute('data-index', '');
    q('index').hidden = false;
    const target = chapterHead ? model.all.find(e => e.indexChapter === current.chapter) ?? current : current;
    chrome.buttons[target.order].focus();
    thumbnails();
  }
  function closeIndex(restore = true) {
    if (!indexOpen) return;
    indexOpen = false;
    thumbnailRun++;
    cancelFrame(thumbnailFrame);
    thumbnailFrame = null;
    q('index').hidden = true;
    root.removeAttribute('data-index');
    previousFocus?.focus?.();
    if (restore && indexWasPlaying) play();
  }
  function resize() {
    const w = clean ? 1600 : 1920 + model.gutter;
    const h = clean ? 900 : 1080;
    // The open tuning panel (spec §8.1) stands beside the frame, not over the stage.
    const side = root.querySelector('.mx-tune:not([data-collapsed])')?.offsetWidth ?? 0;
    const room = Math.max(320, innerWidth - side);
    k = Math.min(room / w, innerHeight / h);
    root.style.setProperty('--mx-k', k);
    q('frame').style.transform =
      `translate(${(room - w * k) / 2}px, ${(innerHeight - h * k) / 2}px) scale(${k})`;
    outgoing?.resize(k);
    layer?.resize(k);
    render(true);
    thumbDone.clear();
    thumbnails();
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    generation++;
    thumbnailRun++;
    listeners.abort();
    for (const finish of [...retirements.values()]) finish();
    for (const id of timers) clearTimeout(id);
    for (const id of frames) cancelAnimationFrame(id);
    timers.clear();
    frames.clear();
    events.clear();
    sound?.destroy();
    tune?.destroy();
    castView.destroy();
    layer?.dispose();
    outgoing?.dispose();
    root.remove();
    if (window.__mx === api) {
      delete window.__mx;
      if (still) {
        delete window.__ready;
        delete window.__setTime;
        delete window.__go;
      }
    }
  }
  const api = {
    state,
    at: name => timing.value.at(name),
    pace: () => structuredClone(pace),
    setPace, setSound, setSubs, setCast,
    nextStop: () => moveStop(false),
    prevStop: () => moveStop(true),
    go,
    descend,
    ascend,
    answer,
    next,
    prev,
    play,
    pause,
    seek,
    openIndex,
    closeIndex,
    on(event, fn) {
      if (!events.has(event)) events.set(event, new Set());
      events.get(event).add(fn);
      return () => events.get(event)?.delete(fn);
    },
    destroy,
  };
  syncAuto();
  syncSound();
  root.dataset.state = status;
  bindInput({ root, chrome, model, api, listen, cancelHold, toggleAuto, showCursor, unlock, restart,
    question: () => timing && availableQuestion(timing.value, answers, t)?.id, cues: () => timing?.value.cues ?? [] });
  listen(window, 'resize', resize);
  listen(document, 'visibilitychange', () => {
    cancelHold();
    lastStamp = undefined;
    if (document.hidden) {
      sound?.stop();
      cancelFrame(clockFrame);
      clockFrame = null;
    } else startClock();
  });
  deck.decorate?.(root);
  window.__mx = api;
  if (still) {
    window.__ready = false;
    window.__setTime = seek;
    window.__go = (id, t = 0) => go(id, { t });
  }
  resize();
  void (async () => {
    if (params.has('tune')) {
      const { createTune } = await import('./tune.js');
      if (destroyed) return;
      tune = createTune(root, deck, api, () => timing ? positionAt(timing.value, t) : null);
      resize();
    }
    if (!destroyed) await navigate(pending, still ? Number(params.get('t')) : undefined, 'jump', [], false, parseAnswers(params.get('a') ?? ''));
  })();
  return api;
}
