import { clampTime, cuesAt, formatTime } from './model.js';
export function bindInput({ root, chrome, model, api, listen, cancelHold, toggleAuto, showCursor }) {
  const { q, buttons } = chrome;
  const toggle = () => (api.state().state === 'playing' ? api.pause() : api.play());
  listen(root, 'pointerdown', e => {
    cancelHold();
    if (e.target.closest('button, .mx-seek') && !e.target.closest('.mx-index')) e.preventDefault();
    if (api.state().indexOpen && !e.target.closest('.mx-index, .mx-crumb')) api.closeIndex();
  });
  listen(root, 'mousedown', e => {
    if (e.target.closest('button, .mx-seek') && !e.target.closest('.mx-index')) e.preventDefault();
  });
  listen(root, 'pointermove', () => {
    cancelHold();
    showCursor();
  });
  listen(root, 'wheel', cancelHold, { passive: true });
  listen(root, 'click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.matches('.mx-next')) void api.next();
    else if (button.matches('.mx-prev')) void api.prev();
    else if (button.matches('.mx-play')) toggle();
    else if (button.matches('.mx-auto')) toggleAuto();
    else if (button.matches('.mx-crumb')) api.openIndex(button.dataset.level === 'chapter');
    else if (button.matches('.mx-seek-mark')) api.seek(Number(button.dataset.seconds));
    else if (button.dataset.clip) void api.go(button.dataset.clip);
  });
  let touch;
  let touchOrigin;
  // Cancel horizontal browser gestures without requiring a theme CSS change.
  listen(
    q('stage'),
    'touchstart',
    e => {
      const point = e.touches[0];
      touchOrigin = e.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null;
    },
    { passive: true },
  );
  listen(
    q('stage'),
    'touchmove',
    e => {
      if (!touchOrigin || e.touches.length !== 1) return;
      const point = e.touches[0];
      if (Math.abs(point.clientX - touchOrigin.x) > Math.abs(point.clientY - touchOrigin.y))
        e.preventDefault();
    },
    { passive: false },
  );
  listen(q('stage'), 'pointerdown', e => {
    touch = { x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType };
  });
  listen(q('stage'), 'pointercancel', () => {
    touch = null;
  });
  listen(q('stage'), 'pointerup', e => {
    if (!touch || touch.id !== e.pointerId) return;
    const dx = e.clientX - touch.x;
    const dy = e.clientY - touch.y;
    if (touch.type === 'touch' && Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      if (dx < 0) void api.next();
      else void api.prev();
    } else if (Math.hypot(dx, dy) < 10) toggle();
    touch = null;
  });
  const slider = q('seek');
  const pointerTime = e => {
    const box = slider.getBoundingClientRect();
    return clampTime(((e.clientX - box.left) / box.width) * api.state().duration, api.state().duration);
  };
  let drag;
  listen(slider, 'pointerdown', e => {
    if (e.button !== 0 || e.target.closest('.mx-seek-mark')) return;
    e.preventDefault();
    drag = { id: e.pointerId, playing: api.state().state === 'playing' };
    slider.setPointerCapture(e.pointerId);
    api.pause();
    api.seek(pointerTime(e));
  });
  listen(slider, 'pointermove', e => {
    const time = pointerTime(e);
    const clip = model.ids.get(api.state().clip)?.clip;
    q('seek-hover').hidden = false;
    q('seek-hover').style.setProperty('--at', api.state().duration ? time / api.state().duration : 0);
    q('seek-hover-time').textContent = formatTime(time);
    q('seek-hover-text').textContent = cuesAt(clip?.cues, time)
      .map(c => c.text.replace(/\*\*/g, ''))
      .join('\n');
    if (drag?.id === e.pointerId) api.seek(time);
  });
  listen(slider, 'pointerleave', () => {
    q('seek-hover').hidden = true;
  });
  const release = e => {
    if (drag?.id !== e.pointerId) return;
    const resume = drag.playing;
    drag = null;
    if (slider.hasPointerCapture(e.pointerId)) slider.releasePointerCapture(e.pointerId);
    if (resume && api.state().state !== 'ended') api.play();
  };
  listen(slider, 'pointerup', release);
  listen(slider, 'pointercancel', release);
  listen(slider, 'lostpointercapture', release);
  listen(window, 'keydown', e => {
    cancelHold();
    if (
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      e.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
    )
      return;
    const key = e.key.toLowerCase();
    const state = api.state();
    if (state.indexOpen) {
      if (['escape', 'i'].includes(key)) {
        e.preventDefault();
        api.closeIndex();
        return;
      }
      const at = model.ids.get(document.activeElement?.dataset.clip) ?? model.ids.get(state.clip);
      if (key === 'enter') {
        e.preventDefault();
        void api.go(at.clip.id);
        return;
      }
      if (key.startsWith('arrow')) {
        e.preventDefault();
        const chapter = at.chapterNumber - 1;
        let target;
        if (key === 'arrowup' || key === 'arrowdown') {
          if (key === 'arrowdown' && at.row === at.chapter.clips.length - 1) {
            api.closeIndex();
            return;
          }
          const row = at.row + (key === 'arrowup' ? -1 : 1);
          target = model.ids.get(
            at.chapter.clips[Math.max(0, Math.min(at.chapter.clips.length - 1, row))].id,
          );
        } else {
          const ci = Math.max(
            0,
            Math.min(model.clips.at(-1).chapterNumber - 1, chapter + (key === 'arrowleft' ? -1 : 1)),
          );
          const candidates = model.clips.filter(c => c.chapterNumber === ci + 1);
          target = candidates[Math.min(at.row, candidates.length - 1)];
        }
        if (target) buttons[target.index].focus();
        return;
      }
      return;
    }
    if (e.target === slider && ['arrowleft', 'arrowright', 'home', 'end'].includes(key)) {
      e.preventDefault();
      api.seek(
        key === 'home'
          ? 0
          : key === 'end'
            ? state.duration
            : state.t + (key === 'arrowleft' ? -1 : 1) * (e.shiftKey ? 5 : 1),
      );
      return;
    }
    if (e.shiftKey && ['arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault();
      api.seek(state.t + (key === 'arrowleft' ? -2 : 2));
      return;
    }
    const navigation =
      ['arrowleft', 'arrowright', 'pageup', 'pagedown', 'home', 'end'].includes(key) || /^[1-9]$/.test(key);
    if (navigation && e.repeat) {
      e.preventDefault();
      return;
    }
    let action;
    if (['arrowright', 'pagedown'].includes(key)) action = api.next;
    else if (['arrowleft', 'pageup'].includes(key)) action = api.prev;
    else if (key === 'home') action = () => api.go(model.clips[0].clip.id);
    else if (key === 'end') action = () => api.go(model.clips.at(-1).clip.id);
    else if (/^[1-9]$/.test(key))
      action = () => {
        const entry = model.clips.find(c => c.chapterNumber === Number(key));
        if (entry) return api.go(entry.clip.id);
      };
    else if (key === ' ' || key === 'k') action = toggle;
    else if (key === 'r')
      action = () => {
        api.seek(0);
        api.play();
      };
    else if (key === 'i' || key === 'arrowup') action = () => api.openIndex();
    else if (key === 'a') action = toggleAuto;
    else if (key === 'f')
      action = () => {
        const result = document.fullscreenElement
          ? document.exitFullscreen?.()
          : document.documentElement.requestFullscreen?.();
        result?.catch(() => {});
      };
    if (action) {
      e.preventDefault();
      void action();
    }
  });
}
