import { PACE_FIELDS } from './pace.js';
import { mergePace, takeSpeeds } from './timeline.js';
import { element } from './chrome.js';

export function createTune(root, deck, api, position) {
  const key = `mx-tune:${deck.id}`;
  const defaults = mergePace(deck.pace);
  const sameValues = (a, b) => a && typeof a === 'object' && !Array.isArray(a) &&
    Object.keys(a).length === Object.keys(b).length && Object.keys(b).every(k =>
      typeof b[k] === 'object' ? sameValues(a[k], b[k]) : a[k] === b[k]);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const value = JSON.parse(saved);
      if (sameValues(value?.defaults, defaults) && value.pace) api.setPace(value.pace);
      else localStorage.removeItem(key);
    }
  } catch { /* storage may be unavailable, or contain an obsolete value */ }
  root.setAttribute('data-tune', '');
  const panel = element('aside', 'mx-tune');
  const collapse = element('button', 'mx-tune-toggle', '−');
  collapse.setAttribute('aria-expanded', 'true');
  const body = element('div', 'mx-tune-body');
  body.append(element('h2', 'mx-tune-title', '歩調の調整'));
  const now = element('output', 'mx-tune-position');
  const json = element('textarea', 'mx-tune-json');
  json.readOnly = true;
  const reset = element('button', 'mx-tune-reset', '既定に戻す');
  const fields = [];
  const controller = new AbortController();
  const listen = (el, event, fn) => el.addEventListener(event, fn, { signal: controller.signal });
  const read = (value, path) => path.split('.').reduce((o, k) => o[k], value);
  const patch = (path, value) => path.split('.').reduceRight((o, k) => ({ [k]: o }), value);
  for (const field of PACE_FIELDS) {
    if (field.group) { body.append(element('h3', 'mx-tune-group', field.group)); continue; }
    const row = element('label', 'mx-tune-field');
    row.dataset.key = field.key;
    row.append(element('span', 'mx-tune-label', field.label));
    if (field.hint) row.append(element('small', 'mx-tune-hint', field.hint));
    const inputs = field.options ? [element('select')] : [element('input'), element('input')];
    for (const [i, input] of inputs.entries()) {
      input.setAttribute('aria-label', field.label);
      if (!field.options) {
        input.type = i ? 'number' : 'range';
        for (const attr of ['min', 'max', 'step']) input[attr] = field[attr];
      }
      listen(input, 'input', () => {
        if (!field.options && (!input.validity.valid || input.value === '')) return;
        api.setPace(patch(field.key, field.key === 'cue.stay' ? input.value : Number(input.value)));
        save();
        refresh();
      });
      // Hand the keys back to the player once a slider or a choice has been set with the
      // pointer; a number field keeps the focus while it is being typed.
      if (input.type !== 'number') listen(input, 'change', () => input.blur());
      row.append(input);
    }
    body.append(row);
    fields.push({ field, inputs });
  }
  body.append(now, json, reset);
  panel.append(collapse, body);
  root.append(panel);
  listen(collapse, 'click', () => {
    body.hidden = !body.hidden;
    panel.toggleAttribute('data-collapsed', body.hidden);
    collapse.textContent = body.hidden ? '+' : '−';
    collapse.setAttribute('aria-expanded', String(!body.hidden));
    window.dispatchEvent(new Event('resize')); // the frame takes back the panel's room
  });
  listen(reset, 'click', () => { api.setPace(defaults); save(); refresh(); });
  function save() { try { localStorage.setItem(key, JSON.stringify({ defaults, pace: api.pace() })); } catch { /* optional persistence */ } }
  function refresh() {
    const pace = api.pace();
    const clip = deck.chapters.flatMap(c => c.clips).find(c => c.id === api.state().clip);
    for (const { field, inputs } of fields) {
      if (field.options) {
        const speeds = clip ? takeSpeeds(clip, deck.voice) : [];
        const current = read(pace, field.key);
        const options = field.options === 'takes'
          ? [...new Set([...speeds, current])].sort((a, b) => a - b)
            .map(s => [s, speeds.includes(s) ? s : `${s}（録りなし）`]) : field.options;
        const signature = JSON.stringify(options);
        if (inputs[0].dataset.options !== signature) {
          inputs[0].replaceChildren(...options.map(([value, label]) => {
            const option = element('option', '', label); option.value = value; return option;
          }));
          inputs[0].dataset.options = signature;
        }
        inputs[0].disabled = field.options === 'takes' && !speeds.length;
      }
      for (const input of inputs) input.value = read(pace, field.key);
    }
    json.value = JSON.stringify(pace, null, 2);
    showPosition();
  }
  function showPosition() {
    const pos = position();
    const section = { lead: 'lead', pre: '声の前', voice: '声', tail: 'tail', rest: '間' }[pos?.section] ?? '—';
    now.textContent = `${pos?.line ?? '—'} / ${section} / ${api.state().t.toFixed(3)}`;
  }
  const unsub = [api.on('time', showPosition), api.on('timeline', () => { refresh(); save(); }), api.on('change', refresh)];
  refresh();
  return { destroy() { controller.abort(); unsub.forEach(fn => fn()); panel.remove(); root.removeAttribute('data-tune'); } };
}
