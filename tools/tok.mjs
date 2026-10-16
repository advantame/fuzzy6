// npm run tok -- '文字列' …  (o200k_base / GPT-4o)
// Prints token count, IDs and decoded pieces. A piece that splits a UTF-8 character
// can contain U+FFFD; token IDs preserve the exact boundary. At most 16 arguments,
// 16 KiB total UTF-8 input; external deadline 30s and heap cap 512 MiB.
// Special-token spellings are treated as ordinary input text.
import { supervised } from './inspect/runtime.mjs';
await supervised(import.meta.url, async args => {
  if (!args.length || args.length > 16 || args.reduce((n,s) => n + Buffer.byteLength(s), 0) > 16384) throw new Error('Supply 1–16 strings, at most 16 KiB total');
  const { Tiktoken } = await import('js-tiktoken/lite');
  const { default: ranks } = await import('js-tiktoken/ranks/o200k_base');
  const encoder = new Tiktoken(ranks);
  for (const s of args) {
    const ids = encoder.encode(s, [], []);
    console.log(`${JSON.stringify(s)}: ${ids.length} tokens`);
    console.log(ids.map(id => `${JSON.stringify(encoder.decode([id]))}:${id}`).join(' | '));
  }
}, 30);
