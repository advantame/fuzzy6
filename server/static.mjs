import { createHash } from 'node:crypto';
import { lstat, opendir, readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

export const SECURITY_HEADERS = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
});

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.opus': 'audio/ogg', '.wav': 'audio/wav', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.map': 'application/json; charset=utf-8',
};
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.map']);
const EMPTY = Buffer.alloc(0);

function representation(body) {
  return { body, etag: `"${createHash('sha256').update(body).digest('hex')}"` };
}

// A fixed startup snapshot: no request-dependent cache, filesystem writes, or reads.
// Reject all symlinks (including internal links) and special files. The image's
// root-owned dist is immutable to the runtime user. Bounds leave room in 1 GiB
// for Node, compression scratch space, and connections; compressed copies are
// at most roughly twice the source size, plus small per-file format overhead.
export async function createStaticApp(dist, { maxBytes = 128 * 1024 * 1024, maxEntries = 10000 } = {}) {
  const root = resolve(dist);
  if (!(await lstat(root)).isDirectory()) throw new Error('dist must be a directory');
  const files = new Map();
  const directories = new Set(['/']);
  let bytes = 0;
  let entries = 0;
  const pending = [{ disk: root, url: '' }];
  while (pending.length) {
    const { disk, url } = pending.pop();
    for await (const entry of await opendir(disk)) {
      if (++entries > maxEntries) throw new Error('dist entry limit exceeded');
      if (entry.name.startsWith('.')) continue;
      const path = join(disk, entry.name);
      const key = `${url}/${entry.name}`;
      if (entry.isDirectory()) {
        directories.add(key);
        pending.push({ disk: path, url: key });
      } else if (entry.isFile()) {
        const stat = await lstat(path);
        if (!stat.isFile()) continue;
        bytes += stat.size;
        if (bytes > maxBytes) throw new Error('dist byte limit exceeded');
        const body = await readFile(path);
        const extension = extname(key).toLowerCase();
        const variants = { identity: representation(body) };
        if (TEXT.has(extension)) {
          variants.gzip = representation(gzipSync(body));
          variants.br = representation(brotliCompressSync(body, {
            params: { [constants.BROTLI_PARAM_QUALITY]: 4 },
          }));
        }
        files.set(key, { variants, type: TYPES[extension] || 'application/octet-stream' });
      }
    }
  }

  // Takes the request's raw header pairs so duplicate identity headers cannot
  // disappear through HTTP header normalization. Returns a response without I/O.
  return function respond({ method = 'GET', url = '/', rawHeaders = [] }) {
    const headers = new Map();
    for (let i = 0; i < rawHeaders.length; i += 2) {
      const name = rawHeaders[i].toLowerCase();
      headers.set(name, [...(headers.get(name) || []), rawHeaders[i + 1]]);
    }
    const header = (name) => headers.get(name)?.join(',');
    const reply = (status, route, body = EMPTY, extra = {}) => ({
      status, route,
      headers: { ...SECURITY_HEADERS, 'Cache-Control': 'no-store',
        ...(status === 304 ? {} : { 'Content-Length': String(body.length) }), ...extra },
      body: method === 'HEAD' ? EMPTY : body,
    });

    const queryAt = url.indexOf('?');
    const rawPath = queryAt < 0 ? url : url.slice(0, queryAt);
    const query = queryAt < 0 ? '' : url.slice(queryAt);
    const health = rawPath === '/healthz';
    const users = headers.get('x-app-user');
    if (!health && (users?.length !== 1 || !/^user[1-9][0-9]*$/.test(users[0]))) {
      return reply(403, 'identity');
    }
    if (method !== 'GET' && method !== 'HEAD') return reply(405, 'method', EMPTY, { Allow: 'GET, HEAD' });
    if (health) return reply(200, 'health', Buffer.from('ok\n'), { 'Content-Type': TYPES['.txt'] });

    // Do not use URL's dot-segment normalization before validating the path.
    let segments;
    try {
      if (!rawPath.startsWith('/') || /[\x00-\x20\x7f#\\]/.test(url)) throw new Error();
      segments = rawPath.slice(1).split('/').map(decodeURIComponent);
      if (segments.some((part, i) => part.startsWith('.') || /[\x00-\x1f\x7f/\\]/.test(part)
        || (part === '' && i !== segments.length - 1))) throw new Error();
    } catch {
      return reply(400, 'path');
    }
    let key = '/' + segments.join('/');
    if (directories.has(key) && key !== '/') {
      // Escape ':' too: a directory called "https:..." must stay a relative URL.
      const location = `${encodeURIComponent(segments.at(-1))}/${query}`;
      return reply(308, 'directory', EMPTY, { Location: location });
    }
    if (key.endsWith('/')) key += 'index.html';
    const file = files.get(key);
    if (!file) return reply(404, 'missing');

    const range = method === 'GET' ? header('range') : undefined;
    const encoding = chooseEncoding(header('accept-encoding'), range ? ['identity'] : Object.keys(file.variants));
    const vary = file.variants.gzip ? { Vary: 'Accept-Encoding' } : {};
    if (!encoding) return reply(406, 'file', EMPTY, vary);
    const variant = file.variants[encoding];
    const meta = {
      ...vary,
      'Content-Type': file.type,
      'Cache-Control': /^\/assets\/.*-[\w-]{8}\.[^/]+$/.test(key)
        ? 'private, max-age=31536000, immutable' : 'private, no-cache',
      ETag: variant.etag,
      'Accept-Ranges': 'bytes',
      ...(encoding === 'identity' ? {} : { 'Content-Encoding': encoding }),
    };
    const noneMatch = header('if-none-match');
    if (noneMatch?.split(',').some(value => value.trim() === '*' || value.trim().replace(/^W\//, '') === variant.etag)) {
      return reply(304, 'file', EMPTY, meta);
    }
    if (range && (!header('if-range') || header('if-range') === variant.etag)) {
      const span = parseRange(range, variant.body.length);
      if (!span) return reply(416, 'file', EMPTY, { ...meta, 'Content-Range': `bytes */${variant.body.length}` });
      const [start, end] = span;
      return reply(206, 'file', variant.body.subarray(start, end + 1), {
        ...meta, 'Content-Range': `bytes ${start}-${end}/${variant.body.length}`,
      });
    }
    return reply(200, 'file', variant.body, meta);
  };
}

function chooseEncoding(value, available) {
  if (!value) return 'identity';
  const weights = new Map();
  for (const item of value.toLowerCase().split(',')) {
    const match = /^\s*([a-z*]+)\s*(?:;\s*q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?\s*$/.exec(item);
    if (match) weights.set(match[1], match[2] === undefined ? 1 : Number(match[2]));
  }
  const weight = name => weights.get(name) ?? (name === 'identity' ? (weights.get('*') === 0 ? 0 : 1) : weights.get('*') ?? 0);
  return ['br', 'gzip', 'identity'].filter(name => available.includes(name) && weight(name) > 0)
    .sort((a, b) => weight(b) - weight(a))[0];
}

function parseRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  // BigInt handles syntactically valid offsets beyond JS's safe integer range.
  const length = BigInt(size);
  const start = match[1] ? BigInt(match[1]) : length - BigInt(match[2]);
  const end = match[1] && match[2] ? BigInt(match[2]) : length - 1n;
  if (start >= length || end < start) return null;
  return [Number(start < 0n ? 0n : start), Number(end >= length ? length - 1n : end)];
}
