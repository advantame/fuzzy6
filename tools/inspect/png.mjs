import { inflateSync } from 'node:zlib';
import { open } from 'node:fs/promises';
export const MAX_PNG_BYTES = 32 * 1024 * 1024;
export const MAX_PIXELS = 8_000_000;
export async function readPNG(path) {
  const file = await open(path, 'r');
  try {
    const { size } = await file.stat();
    if (size > MAX_PNG_BYTES) throw new Error('PNG exceeds 32 MiB');
    const bytes = Buffer.alloc(size);
    const { bytesRead } = await file.read(bytes, 0, size, 0);
    if (bytesRead !== size) throw new Error('Truncated PNG file');
    return decodePNG(bytes);
  } finally { await file.close(); }
}
export function decodePNG(bytes) {
  if (bytes.length > MAX_PNG_BYTES || !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('Invalid PNG signature/size');
  let width, height, bpp, ended = false, seenIDAT = false;
  const parts = [];
  let offset = 8;
  for (let count = 0; offset < bytes.length; count++) {
    if (count >= 10000 || offset + 12 > bytes.length) throw new Error('Invalid PNG chunks');
    const n = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8);
    if (offset + 12 + n > bytes.length) throw new Error('Truncated PNG chunk');
    const body = bytes.subarray(offset + 8, offset + 8 + n);
    if (crc32(bytes.subarray(offset + 4, offset + 8 + n)) !== bytes.readUInt32BE(offset + 8 + n)) throw new Error('PNG CRC mismatch');
    if (count === 0 && type !== 'IHDR') throw new Error('PNG must start with IHDR');
    if (type === 'IHDR') {
      if (width !== undefined || n !== 13) throw new Error('Invalid IHDR');
      width = body.readUInt32BE(0); height = body.readUInt32BE(4);
      bpp = { 2: 3, 6: 4 }[body[9]];
      if (!width || !height || width > 8192 || height > 8192 || width * height > MAX_PIXELS) throw new Error('PNG exceeds dimension/pixel limit');
      if (body[8] !== 8 || !bpp || body[10] || body[11] || body[12]) throw new Error('Only 8-bit RGB/RGBA non-interlaced PNG is supported');
    } else if (type === 'IDAT') { parts.push(body); seenIDAT = true; }
    else if (type === 'IEND') { if (n || !seenIDAT) throw new Error('Invalid IEND'); ended = true; offset += 12; break; }
    else if (type === 'tRNS' || type === 'acTL' || /^[A-Z]/.test(type) && type !== 'PLTE') throw new Error(`Unsupported PNG chunk: ${type}`);
    offset += n + 12;
  }
  if (!ended || offset !== bytes.length) throw new Error('Missing IEND or trailing PNG data');
  const stride = width * bpp, size = height * (stride + 1);
  const raw = inflateSync(Buffer.concat(parts), { maxOutputLength: size });
  if (raw.length !== size) throw new Error('Invalid PNG scanline size');
  const rows = Buffer.allocUnsafe(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    if (filter > 4) throw new Error('Invalid PNG filter');
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, a = x >= bpp ? rows[i - bpp] : 0, b = y ? rows[i - stride] : 0, c = y && x >= bpp ? rows[i - stride - bpp] : 0;
      let predictor = 0;
      if (filter === 1) predictor = a;
      else if (filter === 2) predictor = b;
      else if (filter === 3) predictor = (a+b) >> 1;
      else if (filter === 4) {
        const p = a+b-c, pa = Math.abs(p-a), pb = Math.abs(p-b), pc = Math.abs(p-c);
        predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      rows[i] = raw[y * (stride + 1) + 1 + x] + predictor;
    }
  }
  if (bpp === 4) return { width, height, pixels: rows };
  const pixels = Buffer.allocUnsafe(width * height * 4);
  for (let s = 0, d = 0; s < rows.length; s += 3, d += 4) {
    pixels[d] = rows[s]; pixels[d+1] = rows[s+1]; pixels[d+2] = rows[s+2]; pixels[d+3] = 255;
  }
  return { width, height, pixels };
}
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const b of bytes) crc = crcTable[(crc ^ b) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
export function comparePixels(a, b) {
  const w = Math.max(a.width, b.width), h = Math.max(a.height, b.height);
  let count = 0, left = w, top = h, right = -1, bottom = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * a.width + x) * 4, j = (y * b.width + x) * 4;
    if (x < a.width && y < a.height && x < b.width && y < b.height && a.pixels.readUInt32BE(i) === b.pixels.readUInt32BE(j)) continue;
    count++; left = Math.min(left,x); top = Math.min(top,y); right = Math.max(right,x); bottom = Math.max(bottom,y);
  }
  return { count, box: count ? { x: left, y: top, width: right-left+1, height: bottom-top+1 } : null };
}
