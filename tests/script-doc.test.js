import { describe, expect, it } from 'vitest';
import { renderScript } from '../tools/script-doc.mjs';
import { buildTimeline, mergePace } from '../src/explorer/timeline.js';

const clip = (id, script, extra = {}) => ({ id, title: id, setup() {}, ...(script ? { script } : { duration: 1 }), ...extra });
function fixture() {
  return { id: 'test', title: '台本', voice: { cast: { first: { name: '一人目' }, other: { name: '二人目' } } }, chapters: [
    { id: 'one', title: '最初', clips: [
      clip('opening', [{ id: 'a', text: 'はじめ。' }], { numbered: false }),
      clip('parent', [
        { id: 'silent', lead: 1 },
        { id: 'a', text: '{mark}**答え**は[表示|ひょうじ]。\n次へ。', speed: 'slow' },
        { id: 'b', by: 'other', text: '問い。', speed: 'fast' },
        { id: 'c', by: 'first', text: 'おわり。', speed: 'normal' },
      ], { doors: [{ to: 'detail', from: 'mark', label: 'なぜ？' }, { to: 'detail', from: 'b', label: '使わない' }] }),
      clip('empty'), clip('mute', [{ id: 'a', lead: 1 }]),
      clip('next', [{ id: 'a', text: '次。' }]), clip('last'),
    ], dives: [clip('nested', [{ id: 'a', text: '奥。' }]),
      clip('detail', [{ id: 'q', text: '詳しく。' }], { doors: [{ to: 'nested', from: 'q' }] })] },
    { id: 'two', title: '続き', clips: [clip('unnumbered', undefined, { numbered: false }), clip('end')] },
  ] };
}

describe('script document', () => {
  it('renders speakers, pace notes, parsed text, IDs and engine numbering', () => {
    const text = renderScript(fixture());
    expect(text).toContain('話者を書いていない文は、一人目の文です。');
    expect(text).toContain('### opening `opening`（約 ');
    expect(text).toContain('### 1-1 parent `parent`');
    expect(text).toContain('1. 答えは表示。次へ。（ゆっくり） `a`\n2. **二人目**　問い。（早口） `b`\n3. おわり。 `c`');
    expect(text).not.toContain('`silent`');
    expect(text).not.toContain('**一人目**');
    expect(text).not.toContain('{mark}');
    expect(text).not.toContain('ひょうじ');
  });
  it('places nested dives immediately after their parents and uses the first parent door', () => {
    const text = renderScript(fixture());
    expect(text).toContain('1-1 の 1（`parent/a`）から降りられる。降り口の札は「なぜ？」。');
    expect(text).toContain('深掘り「detail」 の 1（`detail/q`）から降りられる。\n\n1. 奥。');
    expect(text).not.toContain('使わない');
    const headings = text.split('\n').filter(s => s.startsWith('### ')).map(s => s.match(/`([^`]+)`/)[1]);
    expect(headings).toEqual(['opening', 'parent', 'detail', 'nested', 'next']);
  });
  it('groups consecutive silent clips and preserves chapter boundaries and unnumbered titles', () => {
    expect(renderScript(fixture())).toContain('語りなし: 1-2 empty、1-3 mute\n\n### 1-4 next');
    expect(renderScript(fixture())).toContain('語りなし: 1-5 last\n\n## 2. 続き\n\n語りなし: unnumbered、2-1 end\n');
    const deck = fixture();
    deck.chapters[0].dives[0] = clip('nested');
    expect(renderScript(deck)).toContain('語りなし: 深掘り nested、1-2 empty、1-3 mute');
  });
  it('escapes literal Markdown, HTML entities, titles and actor names', () => {
    const deck = fixture();
    deck.title = '# [台本]';
    deck.voice.cast.other.name = '*語り手*';
    deck.chapters[0].clips[1].script[3].text = '\\* _ ` [x] <tag> # | \\ {literal}'.replace('{literal}', '\\{literal}');
    const text = renderScript(deck);
    expect(text).toContain('# \\# \\[台本\\] の原稿');
    expect(text).toContain('**\\*語り手\\***');
    expect(text).toContain('3. \\* \\_ \\` \\[x\\] \\<tag> # | \\\\ {literal} `c`');
    deck.chapters[0].clips[1].script[3].text = '&copy; ![x](url) ~x~ 1. + GPT-3 は 1.5 倍';
    expect(renderScript(deck)).toContain('3. \\&copy; !\\[x\\](url) \\~x\\~ 1. + GPT-3 は 1.5 倍 `c`');
    // block markers at the start of a line's text
    for (const [src, out] of [['# 見出し', '\\# 見出し'], ['> 引用', '\\> 引用'], ['- 箇条', '\\- 箇条'], ['1. 番号', '1\\. 番号']]) {
      deck.chapters[0].clips[1].script[3].text = src;
      expect(renderScript(deck)).toContain(`3. ${out} \`c\``);
    }
  });
  it('uses engine durations, flags missing exact speeds and stale recordings', () => {
    const deck = { id: 'timing', title: '時間', pace: { pre: 0.4, voice: { speed: { normal: 1.4 } } },
      voice: { cast: { first: { name: '一人目' } }, manifest: { clips: { sample: {
        a: { source: '声。', takes: { '1.4': { duration: 2.25 } } },
      } } } }, chapters: [{ id: 'a', title: '章', clips: [clip('sample', [{ id: 'a', text: '声。' }])] }] };
    expect(renderScript(deck)).toContain('`sample`（2.7 秒）');
    const record = deck.voice.manifest.clips.sample.a;
    record.takes = { '1.3': { duration: 2.5 } };
    expect(renderScript(deck)).toContain('`sample`（約 2.9 秒、録りのない文は見積もり）');
    record.source = '古い文';
    const expected = buildTimeline(deck.chapters[0].clips[0], mergePace(deck.pace), deck.voice).duration.toFixed(1);
    expect(renderScript(deck)).toContain(`（約 ${expected} 秒、録りのない文は見積もり）`);
  });
  it('handles no cast, no speech, cross-chapter dives and deterministic LF output', () => {
    const deck = fixture();
    delete deck.voice;
    for (const line of deck.chapters[0].clips[1].script) delete line.by;
    deck.chapters[1].dives = deck.chapters[0].dives;
    delete deck.chapters[0].dives;
    const text = renderScript(deck);
    expect(text).not.toContain('話者を書いていない文は');
    expect(text.indexOf('### 深掘り nested')).toBeLessThan(text.indexOf('## 2. 続き'));
    expect(Buffer.from(text).equals(Buffer.from(renderScript(deck)))).toBe(true);
    expect(text.endsWith('\n') && !text.endsWith('\n\n') && !text.includes('\r')).toBe(true);
    deck.chapters = [{ id: 'silent', clips: [clip('empty')] }];
    expect(renderScript(deck)).toBe('');
  });
});
