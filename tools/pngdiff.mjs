// npm run pngdiff -- a.png b.png
// Compare decoded pixels; 0 = identical, 1 = different, 2 = invalid input.
// Node zlib only. 8-bit RGB/RGBA, non-interlaced; at most 32 MiB/file,
// 8192 per side and 8 million pixels. RGB is compared as opaque RGBA.
import { readPNG, comparePixels } from './inspect/png.mjs';
import { supervised } from './inspect/runtime.mjs';
await supervised(import.meta.url, async args => {
  if (args.length !== 2) throw new Error('Usage: pngdiff a.png b.png');
  const a = await readPNG(args[0]), b = await readPNG(args[1]);
  const result = comparePixels(a, b);
  console.log(`${result.count} px differ; box ${JSON.stringify(result.box)}; sizes ${a.width}x${a.height} / ${b.width}x${b.height}`);
  process.exitCode = result.count ? 1 : 0;
}, 30);
