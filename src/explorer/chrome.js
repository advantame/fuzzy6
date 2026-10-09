import { cueMarkup, cuesAt, formatTime } from './model.js';
export function element(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}
export function createChrome(root, deck, model, retire, frame) {
  root.innerHTML = `
    <div class="mx-frame">
      <aside class="mx-rail">
        <nav class="mx-crumbs" aria-label="現在地">
          <button class="mx-crumb" data-level="deck"></button>
          <button class="mx-crumb" data-level="chapter">
            <span class="mx-crumb-no"></span><span class="mx-crumb-name"></span>
          </button>
        </nav>
        <header class="mx-heading" aria-live="polite"></header>
        <ol class="mx-axis" aria-label="クリップの並び"></ol>
      </aside>
      <main class="mx-stage"></main>
      <div class="mx-corner">
        <button class="mx-prev" aria-label="前のクリップ（←）"><span class="mx-icon"></span></button>
        <div class="mx-count">
          <span class="mx-count-now"></span><span class="mx-count-sep">/</span><span class="mx-count-all"></span>
        </div>
        <button class="mx-next" aria-label="次のクリップ（→）"><span class="mx-icon"></span></button>
        <button class="mx-play" aria-label="再生 / 一時停止（Space）"><span class="mx-icon"></span></button>
        <button class="mx-auto" aria-pressed="false" aria-label="自動で次へ（A）">
          <span class="mx-icon"></span><span class="mx-auto-label">自動</span>
        </button>
      </div>
      <footer class="mx-bar">
        <div class="mx-seek" role="slider" tabindex="0" aria-label="再生位置" aria-valuemin="0">
          <div class="mx-seek-track"></div>
          <div class="mx-seek-fill"></div>
          <div class="mx-seek-marks"></div>
          <div class="mx-seek-head"></div>
          <div class="mx-seek-hover" hidden>
            <span class="mx-seek-hover-time"></span><span class="mx-seek-hover-text"></span>
          </div>
        </div>
        <div class="mx-time">
          <span class="mx-time-now"></span><span class="mx-time-sep">/</span><span class="mx-time-all"></span>
        </div>
        <div class="mx-subs" aria-live="polite"></div>
      </footer>
      <div class="mx-index" role="dialog" aria-label="目次" hidden>
        <header class="mx-index-head">
          <p class="mx-index-deck"></p><h2 class="mx-index-title"></h2>
        </header>
        <div class="mx-index-chapters"></div>
      </div>
    </div>`;
  const q = cls => root.querySelector(`.mx-${cls}`);
  q('crumb').textContent = deck.title;
  q('index-deck').textContent = deck.title;
  q('index-title').textContent = deck.subtitle ?? deck.title;
  const width = Math.max(2, String(model.clips.length).length);
  q('count-all').textContent = String(model.clips.length).padStart(width, '0');
  const ticks = [];
  const buttons = [];
  for (const [ci, chapter] of deck.chapters.entries()) {
    const section = element('section', 'mx-index-chapter');
    section.dataset.chapter = chapter.id;
    const title = element('h3', 'mx-index-chapter-title');
    title.append(element('span', 'mx-index-chapter-no', ci + 1), document.createTextNode(chapter.title));
    const list = element('ol', 'mx-index-clips');
    section.append(title, list);
    q('index-chapters').append(section);
    for (const clip of chapter.clips) {
      const entry = model.ids.get(clip.id);
      const tick = element('li', 'mx-tick');
      const jump = element('button');
      tick.dataset.chapter = chapter.id;
      tick.toggleAttribute('data-chapter-start', entry.row === 0);
      jump.tabIndex = -1;
      jump.dataset.clip = clip.id;
      jump.dataset.label = `${entry.label} ${clip.title}`.trim();
      jump.setAttribute('aria-label', jump.dataset.label);
      tick.append(jump);
      q('axis').append(tick);
      ticks.push(tick);
      const li = element('li');
      const button = element('button', 'mx-index-clip');
      button.dataset.clip = clip.id;
      button.append(
        element('canvas', 'mx-index-thumb'),
        element('span', 'mx-index-no', entry.label),
        element('span', 'mx-index-name', clip.title),
      );
      li.append(button);
      list.append(li);
      buttons.push(button);
    }
  }
  const active = new Map();
  function subtitles(clip, t, instant, still) {
    const subs = q('subs');
    const cues = cuesAt(clip.cues, t).slice(0, 4);
    // Jumps rebuild the cue set without entrance or exit animations.
    if (instant) {
      subs.replaceChildren();
      active.clear();
      subs.setAttribute('data-instant', '');
      if (!still)
        frame(() => {
          subs.removeAttribute('data-instant');
          for (const node of subs.children) node.getAnimations().forEach(a => a.cancel());
        });
    }
    for (const [cue, node] of active)
      if (!cues.includes(cue)) {
        active.delete(cue);
        node.dataset.state = 'out';
        retire(node, 'animationend', 500);
      }
    for (const [index, cue] of cues.entries())
      if (!active.has(cue)) {
        while (subs.children.length >= 4)
          (subs.querySelector('[data-state="out"]') ?? subs.firstElementChild).remove();
        const node = element('p', 'mx-cue');
        node.dataset.state = 'in';
        node.innerHTML = cueMarkup(cue.text);
        // Only insert new nodes: moving a live cue restarts its entrance animation.
        const following = cues.slice(index + 1).find(next => active.has(next));
        subs.insertBefore(node, active.get(following) ?? null);
        active.set(cue, node);
        if (instant) node.getAnimations().forEach(a => a.cancel());
      }
  }
  return {
    q,
    ticks,
    buttons,
    change(entry, still) {
      const { clip, chapter, index } = entry;
      q('crumb-no').textContent = entry.chapterNumber;
      q('crumb-name').textContent = chapter.title;
      const heading = q('heading');
      if (still) heading.replaceChildren();
      else {
        heading.querySelector('[data-out]')?.remove();
        if (heading.firstElementChild) {
          heading.firstElementChild.setAttribute('data-out', '');
          retire(heading.firstElementChild, 'animationend', 600);
        }
      }
      const body = element('div', 'mx-heading-body');
      if (entry.number !== null) {
        const no = element('p', 'mx-no');
        no.append(
          element('span', 'mx-no-chapter', entry.chapterNumber),
          element('span', 'mx-no-sep', '-'),
          element('span', 'mx-no-clip', entry.number),
        );
        body.append(no);
      }
      body.append(element('h1', 'mx-title', clip.title));
      if (clip.kicker) body.append(element('p', 'mx-kicker', clip.kicker));
      heading.append(body);
      if (still) body.getAnimations().forEach(a => a.cancel());
      q('stage').setAttribute('aria-label', clip.title);
      q('count-now').textContent = String(entry.global).padStart(width, '0');
      q('prev').disabled = index === 0;
      q('next').disabled = index === model.clips.length - 1;
      ticks.forEach((tick, i) => {
        tick.dataset.state = i < index ? 'past' : i === index ? 'current' : 'future';
      });
      buttons.forEach((b, i) => b.setAttribute('aria-current', String(i === index)));
      q('seek').setAttribute('aria-valuemax', clip.duration);
      q('time-all').textContent = formatTime(clip.duration);
      q('seek-marks').replaceChildren();
      for (const mark of clip.marks ?? clip.cues ?? []) {
        const button = element('button', 'mx-seek-mark');
        button.tabIndex = -1;
        button.style.setProperty('--at', mark.at / clip.duration);
        button.dataset.time = formatTime(mark.at);
        button.dataset.seconds = mark.at;
        button.setAttribute('aria-label', mark.label ?? formatTime(mark.at));
        q('seek-marks').append(button);
      }
    },
    render(clip, t, instant, still = false) {
      const seek = q('seek');
      const progress = String(t / clip.duration);
      const seconds = String(t);
      const time = formatTime(t);
      const label = `${time} / ${formatTime(clip.duration)}`;
      if (seek.style.getPropertyValue('--mx-progress') !== progress) {
        seek.style.setProperty('--mx-progress', progress);
      }
      if (seek.getAttribute('aria-valuenow') !== seconds) {
        seek.setAttribute('aria-valuenow', seconds);
      }
      if (seek.getAttribute('aria-valuetext') !== label) {
        seek.setAttribute('aria-valuetext', label);
      }
      // The displayed second changes much less often than the playback clock.
      if (q('time-now').textContent !== time) q('time-now').textContent = time;
      subtitles(clip, t, instant, still);
    },
  };
}
