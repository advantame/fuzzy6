import { clampTime, cuesAt, formatTime } from './model.js';
export function bindInput({ root, chrome, model, api, listen, cancelHold, toggleAuto, showCursor, unlock, cues }) {
  const { q, buttons } = chrome;
  const toggle = () => (api.state().state === 'playing' ? api.pause() : api.play());
  let unlockGesture = false;
  listen(root, 'pointerdown', e => {
    unlockGesture = !e.target.closest('.mx-sound') && unlock();
    cancelHold();
    if (e.target.closest('button, .mx-seek') && !e.target.closest('.mx-index, .mx-tune')) e.preventDefault();
    if (api.state().indexOpen && !e.target.closest('.mx-index, .mx-crumb')) api.closeIndex();
  });
  listen(root, 'mousedown', e => {
    if (e.target.closest('button, .mx-seek') && !e.target.closest('.mx-index, .mx-tune')) e.preventDefault();
  });
  listen(root, 'pointermove', () => {
    cancelHold();
    showCursor();
  });
  listen(root, 'wheel', cancelHold, { passive: true });
  listen(root, 'click', e => {
    if (unlockGesture) { unlockGesture = false; return; }
    cancelHold();
    const button = e.target.closest('button');
    if (!button) return;
    if (button.matches('.mx-next')) void api.next();
    else if (button.matches('.mx-prev')) void api.prev();
    else if (button.matches('.mx-play')) toggle();
    else if (button.matches('.mx-sound')) api.setSound(api.state().sound === 'off');
    else if (button.matches('.mx-unlock')) unlock();
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
      if (Math.max(Math.abs(point.clientX - touchOrigin.x), Math.abs(point.clientY - touchOrigin.y)) > 10)
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
    if (unlockGesture || e.target.closest('button')) { touch = null; return; }
    const dx = e.clientX - touch.x;
    const dy = e.clientY - touch.y;
    if (touch.type === 'touch' && Math.max(Math.abs(dx), Math.abs(dy)) >= 60) {
      e.preventDefault();
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) void api.nextStop();
        else void api.prevStop();
      } else if (dy < 0) void api.next();
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
    q('seek-hover').hidden = false;
    q('seek-hover').style.setProperty('--at', api.state().duration ? time / api.state().duration : 0);
    q('seek-hover-time').textContent = formatTime(time);
    q('seek-hover-text').textContent = cuesAt(cues(), time)
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
    if (state.sound === 'blocked') {
      e.preventDefault();
      if (key === 'm') api.setSound(false);
      else unlock();
      return;
    }
    unlock();
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
      ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'pageup', 'pagedown', 'home', 'end'].includes(key) || /^[1-9]$/.test(key);
    if (navigation && e.repeat) {
      e.preventDefault();
      return;
    }
    let action;
    if (key === 'arrowright') action = api.nextStop;
    else if (key === 'arrowleft') action = api.prevStop;
    else if (['arrowdown', 'pagedown'].includes(key)) action = api.next;
    else if (['arrowup', 'pageup'].includes(key)) action = api.prev;
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
    else if (key === 'i') action = () => api.openIndex();
    else if (key === 'm') action = () => api.setSound(state.sound === 'off');
    else if (key === 'c') action = () => api.setSubs(!state.subs);
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
