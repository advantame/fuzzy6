import { normalizeDeck, clampTime, advanceTime, seekState } from './model.js';
import { createChrome } from './chrome.js';
import { createLayer } from './layer.js';
import { bindInput } from './input.js';

export function createExplorer(host, deck, options = {}) {
  const model = normalizeDeck(deck);
  const params = options.url === false ? new URLSearchParams() : new URLSearchParams(location.search);
  const still = params.has('t');
  const clean = params.has('clean');
  const root = document.createElement('div');
  root.className = 'mx';
  root.dataset.deck = deck.id;
  root.toggleAttribute('data-still', still);
  root.toggleAttribute('data-clean', clean);
  host.append(root);
  const listeners = new AbortController();
  const timers = new Set();
  const frames = new Set();
  const retirements = new Map();
  let destroyed = false;
  let generation = 0;
  let pending = model.ids.get(params.get('c'))?.index ?? 0;
  let current = null;
  let layer = null;
  let outgoing = null;
  let t = 0;
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
  function state() {
    return {
      deck: deck.id,
      chapter: current?.chapter.id ?? null,
      clip: current?.clip.id ?? null,
      index: current?.index ?? -1,
      count: model.clips.length,
      t,
      duration: current?.clip.duration ?? 0,
      state: status,
      auto,
      indexOpen,
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
  }
  function showCursor(schedule = status === 'playing') {
    cancelTimer(cursorTimer);
    root.removeAttribute('data-cursor-hidden');
    if (schedule) cursorTimer = later(() => root.setAttribute('data-cursor-hidden', ''), 2500);
  }
  function render(instant = false) {
    if (!current || destroyed) return;
    layer.render(t);
    chrome.render(current.clip, t, instant || still, still);
    emit('time');
  }
  function ended() {
    setState('ended');
    cancelHold();
    if (auto && !still && !indexOpen && current.index < model.clips.length - 1)
      holdTimer = later(() => next(), Math.max(0, current.clip.hold ?? 2.5) * 1000);
  }
  function startClock() {
    if (clockFrame || status !== 'playing' || document.hidden || destroyed) return;
    clockFrame = frame(stamp => {
      clockFrame = null;
      t = advanceTime(t, lastStamp === undefined ? 0 : (stamp - lastStamp) / 1000, current.clip.duration);
      lastStamp = stamp;
      render();
      if (t >= current.clip.duration) ended();
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
  function newLayer(clip, thumb = false) {
    return createLayer(clip, root, { k, still, thumb, report });
  }
  async function navigate(index, seconds = 0, dir = 'jump') {
    if (destroyed) return;
    cancelHold();
    pending = Math.max(0, Math.min(model.clips.length - 1, index));
    // Only the last destination may set up a layer after asynchronous font loads.
    const entry = model.clips[pending];
    const ticket = ++generation;
    setState('loading');
    await bootFonts;
    if (ticket !== generation || destroyed) return;
    await loadFonts(entry.clip.fonts);
    if (ticket !== generation || destroyed) return;
    if (indexOpen) closeIndex(false);
    // Retire the previous exit before adding an entrance: at most two live layers.
    if (outgoing) {
      remove(outgoing.el);
      outgoing = null;
    }
    if (layer) {
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
    t = clampTime(seconds, entry.clip.duration);
    root.dataset.chapter = entry.chapter.id;
    root.dataset.clip = entry.clip.id;
    root.dataset.dir = dir;
    root.toggleAttribute('data-first', entry.index === 0);
    root.toggleAttribute('data-last', entry.index === model.clips.length - 1);
    root.style.setProperty(
      '--mx-deck-progress',
      model.clips.length === 1 ? 0 : entry.index / (model.clips.length - 1),
    );
    layer = newLayer(entry.clip);
    layer.el.dataset.role = still ? 'current' : 'in';
    q('stage').append(layer.el);
    layer.setup();
    chrome.change(entry, still);
    document.title = `${entry.clip.title} — ${deck.title}`;
    if (options.url !== false) {
      const url = new URL(location.href);
      url.searchParams.set('c', entry.clip.id);
      history.replaceState(null, '', url);
    }
    render(true);
    if (!still) {
      const incoming = layer;
      void incoming.el.offsetWidth;
      frame(() => {
        if (incoming === layer) incoming.el.dataset.role = 'current';
      });
    }
    if (t >= entry.clip.duration) ended();
    else setState(still ? 'paused' : 'playing');
    emit('change');
    for (const i of [entry.index - 1, entry.index + 1])
      if (model.clips[i]) void loadFonts(model.clips[i].clip.fonts);
    if (still) window.__ready = true;
  }
  function go(id, { t = 0 } = {}) {
    const entry = model.ids.get(id);
    if (!entry) return Promise.reject(new Error(`Unknown clip id: ${id}`));
    return navigate(entry.index, t);
  }
  function next() {
    cancelHold();
    if (pending < model.clips.length - 1) return navigate(pending + 1, 0, 'next');
  }
  function prev() {
    cancelHold();
    if (pending > 0) return navigate(pending - 1, 0, 'prev');
  }
  function play() {
    cancelHold();
    if (!current || destroyed || status === 'loading' || indexOpen) return;
    if (t >= current.clip.duration) {
      t = 0;
      render(true);
    }
    setState('playing');
  }
  function pause() {
    cancelHold();
    if (status === 'playing') setState('paused');
  }
  function seek(seconds) {
    cancelHold();
    if (!current || destroyed) return;
    t = clampTime(seconds, current.clip.duration);
    lastStamp = undefined;
    const nextState = seekState(status, t, current.clip.duration);
    render(true);
    if (nextState === 'ended') ended();
    else setState(nextState);
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
    const entry = model.clips.find(e => !thumbDone.has(e.clip.id));
    if (!entry) return;
    const run = thumbnailRun;
    thumbnailFrame = frame(async () => {
      thumbnailFrame = null;
      thumbnailBusy = true;
      await loadFonts(entry.clip.fonts);
      if (!destroyed && indexOpen && run === thumbnailRun) {
        // Render at stage size so clip layout and text metrics match playback.
        const preview = newLayer(entry.clip, true);
        try {
          preview.setup();
          preview.render(clampTime(entry.clip.poster ?? entry.clip.duration, entry.clip.duration));
          const thumb = chrome.buttons[entry.index].querySelector('canvas');
          thumb.width = Math.max(1, Math.floor(112 * k * devicePixelRatio));
          thumb.height = Math.max(1, Math.floor(63 * k * devicePixelRatio));
          const ctx = thumb.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          for (const { canvas } of preview.canvases) ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
          if (preview.canvases.length) thumb.dataset.drawn = '';
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
    const target = chapterHead ? model.clips.find(e => e.chapter === current.chapter) : current;
    chrome.buttons[target.index].focus();
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
    const w = clean ? 1600 : 1920;
    const h = clean ? 900 : 1080;
    k = Math.min(innerWidth / w, innerHeight / h);
    root.style.setProperty('--mx-k', k);
    q('frame').style.transform =
      `translate(${(innerWidth - w * k) / 2}px, ${(innerHeight - h * k) / 2}px) scale(${k})`;
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
    go,
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
  root.dataset.state = status;
  bindInput({ root, chrome, model, api, listen, cancelHold, toggleAuto, showCursor });
  listen(window, 'resize', resize);
  listen(document, 'visibilitychange', () => {
    cancelHold();
    lastStamp = undefined;
    if (document.hidden) {
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
  void navigate(pending, still ? Number(params.get('t')) : 0);
  return api;
}
