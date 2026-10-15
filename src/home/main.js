// The deck list. Each card shows its deck's cover clip through the deck's own page, opened
// in still-frame mode (spec §8) inside an iframe, so a cover is never a stale screenshot.
// Hovering or focusing a card plays the cover clip by driving that page's __setTime.

import '@fontsource/ibm-plex-sans-jp/400.css';
import '@fontsource/ibm-plex-sans-jp/500.css';
import '@fontsource/ibm-plex-sans-jp/700.css';
import '@fontsource/ibm-plex-sans-condensed/600.css';
import '@fontsource/ibm-plex-sans-condensed/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import './home.css';
import llm from '../../decks/llm/deck.js';
import trig from '../../decks/trig/deck.js';
import demo from '../../decks/demo/deck.js';
import { buildTimeline, mergePace } from '../explorer/timeline.js';

export const DECKS = [
  { deck: llm, href: 'decks/llm/', cover: 'opening', size: 'large' },
  { deck: trig, href: 'decks/trig/', cover: 'opening', size: 'large' },
  { deck: demo, href: 'decks/demo/', cover: 'opening', size: 'small', note: 'engine の契約の見本。テストにも使う。' },
];
const HOLD = 1.5; // seconds the last frame stays before the preview loops
const still = matchMedia('(prefers-reduced-motion: reduce)');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function totalTime(seconds) {
  return seconds < 90 ? `${Math.round(seconds)} 秒` : `約 ${Math.round(seconds / 60)} 分`;
}

function card({ deck, href, cover, size, note }) {
  const clips = deck.chapters.flatMap((c) => c.clips);
  const pace = mergePace(deck.pace);
  const timelines = new Map(clips.map(c => [c.id, buildTimeline(c, pace, deck.voice)]));
  const coverTimeline = timelines.get(cover);
  const seconds = [...timelines.values()].reduce((n, timeline) => n + timeline.duration, 0);

  const li = el('li', 'deck');
  li.dataset.size = size;

  const frame = el('div', 'deck-cover');
  const iframe = el('iframe');
  iframe.src = `${href}?c=${cover}&t=${coverTimeline.duration}&clean`;
  iframe.loading = 'lazy';
  iframe.tabIndex = -1;
  iframe.title = `${deck.title} の表紙`;
  iframe.setAttribute('aria-hidden', 'true');
  const scrub = el('span', 'deck-scrub');
  frame.append(iframe, scrub);

  const body = el('div', 'deck-body');
  const title = el('h2', 'deck-title');
  const link = el('a', '', deck.title);
  link.href = href;
  title.append(link);
  body.append(title, el('p', 'deck-sub', deck.subtitle));
  if (note) body.append(el('p', 'deck-note', note));
  body.append(el('p', 'deck-meta', `${deck.chapters.length} 章 · ${clips.length} 本 · ${totalTime(seconds)}`));

  // the chapters as a ruler, each as long as its share of the clips
  const ruler = el('ol', 'deck-chapters');
  deck.chapters.forEach((chapter, i) => {
    const item = el('li');
    item.style.setProperty('--n', chapter.clips.length);
    item.style.setProperty('--i', i);
    item.append(el('b', '', String(i + 1)), el('span', '', chapter.title));
    ruler.append(item);
  });
  body.append(ruler, el('span', 'deck-open', '開く'));
  li.append(frame, body);

  preview(li, iframe, scrub, coverTimeline.duration);
  return li;
}

// Play the cover clip while the card is pointed at or focused; rest on the last frame.
function preview(li, iframe, scrub, duration) {
  let raf = 0;
  let start = 0;
  const page = () => {
    const win = iframe.contentWindow;
    return win && win.__ready === true && typeof win.__setTime === 'function' ? win : null;
  };
  const tick = (now) => {
    start ||= now;
    const t = Math.min(((now - start) / 1000) % (duration + HOLD), duration);
    page()?.__setTime(t);
    scrub.style.transform = `scaleX(${t / duration})`;
    raf = requestAnimationFrame(tick);
  };
  const play = () => {
    if (raf || still.matches || !page()) return;
    start = 0;
    li.dataset.playing = '';
    raf = requestAnimationFrame(tick);
  };
  const rest = () => {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    delete li.dataset.playing;
    scrub.style.transform = '';
    page()?.__setTime(duration);
  };
  li.addEventListener('pointerenter', play);
  li.addEventListener('pointerleave', rest);
  li.addEventListener('focusin', play);
  li.addEventListener('focusout', rest);
}

document.getElementById('decks').append(...DECKS.map(card));
