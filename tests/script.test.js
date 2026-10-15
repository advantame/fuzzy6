import { describe, expect, test } from 'vitest';
import { parseLine, isName } from '../src/explorer/script.js';

describe('narration line markup', () => {
  test('blank lines keep subtitle pages and locate their normalized speech offsets', () => {
    const line = parseLine('😀 [AI|エーアイ]\nです。 \n\n{next}**次**の\n文。\n\n終わり。');
    expect(line.caption.split('\n\n')).toEqual(['😀 AI\nです。 ', '**次**の\n文。', '終わり。']);
    expect(line.speech).toBe('😀エーアイです。次の文。終わり。');
    expect(line.plain).toBe('😀 AIです。 次の文。終わり。');
    expect(line.pages).toEqual([8, 12]);
    expect(line.anchors).toEqual([{ name: 'next', offset: 8 }]);
    expect(parseLine('a\nb').pages).toEqual([]);
  });
  test.each(['\n\n文', '文\n\n', '文\n\n\n次', '文\n\n\n\n次', '{a}\n\n文', '文\n\n{a}'])(
    'rejects invalid subtitle breaks in %j', text => expect(() => parseLine(text)).toThrow('Narration line'));
  test('anchors vanish from both readings and point at the next spoken character', () => {
    const line = parseLine('けれど多くは、{band}**最後の 10 年**に集まっている。');
    expect(line.caption).toBe('けれど多くは、**最後の 10 年**に集まっている。');
    expect(line.plain).toBe('けれど多くは、最後の 10 年に集まっている。');
    expect(line.speech).toBe('けれど多くは、最後の10年に集まっている。');
    expect(line.anchors).toEqual([{ name: 'band', offset: 7 }]);
    expect(Array.from(line.speech)[7]).toBe('最');
  });
  test('shown and spoken forms split, plain brackets stay', () => {
    const line = parseLine('{a}[ChatGPT|チャットジーピーティー] と [1] の例');
    expect(line.caption).toBe('ChatGPT と [1] の例');
    expect(line.speech).toBe('チャットジーピーティーと[1]の例');
    expect(line.anchors).toEqual([{ name: 'a', offset: 0 }]);
  });
  test('spaces survive only between ASCII characters, offsets follow the dropped ones', () => {
    const line = parseLine('Large Language Model は {x}2017 年の Transformer から');
    expect(line.speech).toBe('Large Language Modelは2017年のTransformerから');
    expect(Array.from(line.speech)[line.anchors[0].offset]).toBe('2');
  });
  test('line breaks and escapes', () => {
    const line = parseLine('一行目。\n二行目は \\{name} と \\[a|b] と \\*\\\\。');
    expect(line.caption).toBe('一行目。\n二行目は {name} と [a|b] と *\\。');
    expect(line.speech).toBe('一行目。二行目は{name}と[a|b]と*\\。');
    expect(line.anchors).toEqual([]);
  });
  test('an anchor at the end counts every spoken character', () => {
    const line = parseLine('終わり{z}');
    expect(line.anchors).toEqual([{ name: 'z', offset: 3 }]);
  });
  test('bad anchors are rejected', () => {
    expect(() => parseLine('{Bad}')).toThrow(/invalid anchor/);
    expect(() => parseLine('{open')).toThrow(/unclosed/);
    expect(() => parseLine('{a}x{a}')).toThrow(/duplicate/);
    expect(isName('a-1')).toBe(true);
    expect(isName('1a')).toBe(false);
  });
});
