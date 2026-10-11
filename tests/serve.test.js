import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { createStaticApp } from '../server/static.mjs';

let temp, dist, app;
const html = Buffer.from('<html><body>Motion Explorer</body></html>\n'.repeat(20));
const voice = Buffer.from('0123456789');
const types = {
  html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8', svg: 'image/svg+xml',
  png: 'image/png', webp: 'image/webp', woff2: 'font/woff2', woff: 'font/woff',
  ttf: 'font/ttf', opus: 'audio/ogg', wav: 'audio/wav', ico: 'image/x-icon',
  txt: 'text/plain; charset=utf-8', map: 'application/json; charset=utf-8',
  bin: 'application/octet-stream',
};
function request(url = '/', headers = {}, method = 'GET') {
  return app({ url, method, rawHeaders: ['X-App-User', 'user1', ...Object.entries(headers).flat()] });
}

beforeAll(async () => {
  temp = await mkdtemp(join(tmpdir(), 'fuzzy6-serve-'));
  dist = join(temp, 'dist');
  for (const name of ['', 'decks/llm', 'empty', 'assets/nested', '.private', 'a:b', '日本 語']) {
    await mkdir(join(dist, name), { recursive: true });
  }
  await writeFile(join(dist, 'index.html'), html);
  await writeFile(join(dist, 'decks/llm/index.html'), 'deck');
  await writeFile(join(dist, 'voice.opus'), voice);
  await writeFile(join(dist, 'zero.opus'), '');
  await writeFile(join(dist, 'assets/app-Ab12_cd3.js'), html);
  await writeFile(join(dist, 'assets/plain.js'), html);
  await writeFile(join(dist, 'assets/nested/font-Ab12_cd3.woff2'), voice);
  await writeFile(join(dist, '日本 語/index.html'), 'Japanese');
  await writeFile(join(dist, '.env'), 'hidden');
  await writeFile(join(dist, '.private/secret.txt'), 'hidden');
  await writeFile(join(temp, 'outside.txt'), 'outside');
  for (const extension of Object.keys(types)) await writeFile(join(dist, `type.${extension}`), html);
  await symlink(join(temp, 'outside.txt'), join(dist, 'escape.txt'));
  await symlink(temp, join(dist, 'escape-dir'));
  await symlink(join(dist, 'index.html'), join(dist, 'internal.html'));
  await symlink(dist, join(dist, 'loop'));
  app = await createStaticApp(dist);
});
afterAll(async () => { if (temp) await rm(temp, { recursive: true, force: true }); });

describe('health, identity and methods', () => {
  it('allows exact health checks without identity, including HEAD and a query', () => {
    const get = app({ url: '/healthz?probe=1' });
    expect(get.status).toBe(200);
    expect(get.body.toString()).toBe('ok\n');
    expect(app({ url: '/healthz', method: 'HEAD' }).body.length).toBe(0);
    expect(app({ url: '/healthz', method: 'POST' }).status).toBe(405);
    expect(app({ url: '/healthz/' }).status).toBe(403);
    expect(app({ url: '/healthz', rawHeaders: ['X-App-User', 'invalid'] }).status).toBe(200);
  });
  it.each([[], ['X-App-User', ''], ['X-App-User', 'user0'], ['X-App-User', 'user01'],
    ['X-App-User', 'user-1'], ['X-App-User', 'user1.0'], ['X-App-User', 'User1'],
    ['X-App-User', 'user1,user2'], ['X-App-User', ' user1'], ['X-App-User', 'user1 '],
    ['X-App-User', 'user1\n'], ['X-App-User', 'user１'],
    ['X-App-User', 'user1', 'x-app-user', 'user1'],
    ['X-App-User', 'user1', 'X-App-User', 'user2'],
  ])('rejects invalid identity header pairs %#', (...rawHeaders) => {
    // it.each spreads array rows into arguments.
    for (const url of ['/', '/decks/llm', '/missing']) expect(app({ url, rawHeaders }).status).toBe(403);
  });
  it.each(['user1', 'user2', 'user999999999999999999999999'])('accepts %s without numeric coercion', user => {
    expect(app({ rawHeaders: ['x-aPp-uSeR', user] }).status).toBe(200);
  });
  it.each(['POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])('rejects %s', method => {
    const response = request('/', {}, method);
    expect(response.status).toBe(405);
    expect(response.headers.Allow).toBe('GET, HEAD');
  });
});

describe('paths and prefix-preserving directory redirects', () => {
  it('serves indexes and does not fall back to the home page', () => {
    expect(request('/').body.equals(html)).toBe(true);
    expect(request('/decks/llm/').body.toString()).toBe('deck');
    expect(request('/index.html?ignored=1').status).toBe(200);
    expect(request('/missing').status).toBe(404);
    expect(request('/empty/').status).toBe(404);
    expect(request('/voice.opus/').status).toBe(404);
    expect(request('/%E6%97%A5%E6%9C%AC%20%E8%AA%9E/').body.toString()).toBe('Japanese');
  });
  it.each([
    ['/decks/llm', 'llm/'], ['/decks/llm?c=timeline&t=1%202', 'llm/?c=timeline&t=1%202'],
    ['/decks', 'decks/'], ['/a:b', 'a%3Ab/'], ['/%E6%97%A5%E6%9C%AC%20%E8%AA%9E', '%E6%97%A5%E6%9C%AC%20%E8%AA%9E/'],
  ])('redirects %s relatively', (url, location) => {
    const result = request(url, { Host: 'unused.internal' });
    expect(result.status).toBe(308);
    expect(result.headers.Location).toBe(location);
    const base = new URL(`https://example.test/secret/app${url}`);
    expect(new URL(location, base).pathname.startsWith('/secret/app/')).toBe(true);
  });
  it.each(['/../outside.txt', '/decks/../../outside.txt', '/%2e%2e/outside.txt',
    '/decks/%2E%2e/index.html', '/./index.html', '/.env', '/%2eenv', '/.private/secret.txt',
    '/index.html%00', '/bad%', '/bad%GG', '/%C0%AE', '/%2foutside.txt', '/%5c..%5coutside.txt',
    '/decks\\llm', '//decks/llm', '/decks//llm', 'https://example.test/', '/index.html#fragment',
    '/decks/llm?bad=\r\nheader',
  ])('rejects unsafe path %s', url => {
    expect(request(url).status).toBe(400);
  });
  it.each(['/escape.txt', '/escape-dir/outside.txt', '/internal.html', '/loop/index.html'])('does not follow symlinks: %s', url => {
    expect(request(url).status).toBe(404);
  });
  it('keeps serving the startup snapshot after disk changes', async () => {
    const before = request('/decks/llm/');
    await writeFile(join(dist, 'decks/llm/index.html'), 'changed');
    const after = request('/decks/llm/');
    expect(after.body.equals(before.body)).toBe(true);
    expect(after.headers.ETag).toBe(before.headers.ETag);
  });
});

describe('types, security and caching', () => {
  it.each(Object.entries(types))('sets MIME for %s', (extension, type) => {
    expect(request(`/type.${extension}`).headers['Content-Type']).toBe(type);
  });
  it.each(['/assets/app-Ab12_cd3.js', '/assets/nested/font-Ab12_cd3.woff2'])('caches Vite assets: %s', url => {
    expect(request(url).headers['Cache-Control']).toBe('private, max-age=31536000, immutable');
  });
  it.each(['/', '/decks/llm/', '/voice.opus', '/type.js', '/assets/plain.js'])('revalidates unhashed files: %s', url => {
    expect(request(url).headers['Cache-Control']).toBe('private, no-cache');
  });
  it('sets security headers on successes, redirects, and all error responses without blocking same-origin frames', () => {
    const results = [request('/'), request('/healthz'), request('/decks/llm'), request('/../x'),
      app({}), request('/missing'), request('/', {}, 'POST'), request('/voice.opus', { Range: 'bytes=50-' }),
      request('/', { 'Accept-Encoding': '*;q=0' }), request('/', { 'If-None-Match': '*' })];
    for (const { headers } of results) {
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Referrer-Policy']).toBe('no-referrer');
      expect(headers['X-Frame-Options']).toBeUndefined();
      expect(headers['Content-Security-Policy']).toBeUndefined();
      expect(headers['Cache-Control']).not.toContain('public');
    }
  });
  it('HEAD has GET headers and no body (including errors)', () => {
    for (const url of ['/', '/missing', '/healthz', '/decks/llm']) {
      const get = request(url), head = request(url, {}, 'HEAD');
      expect(head.status).toBe(get.status);
      expect(head.headers).toEqual(get.headers);
      expect(head.body.length).toBe(0);
    }
  });
});

describe('ranges and conditional requests', () => {
  it.each([
    ['bytes=0-1', '01', 'bytes 0-1/10'], ['bytes=3-', '3456789', 'bytes 3-9/10'],
    ['bytes=-3', '789', 'bytes 7-9/10'], ['bytes=8-100', '89', 'bytes 8-9/10'],
    ['bytes=-100', '0123456789', 'bytes 0-9/10'],
    ['bytes=0-999999999999999999999999', '0123456789', 'bytes 0-9/10'],
  ])('serves %s', (range, body, contentRange) => {
    const response = request('/voice.opus', { Range: range, 'Accept-Encoding': 'gzip, br' });
    expect(response.status).toBe(206);
    expect(response.body.toString()).toBe(body);
    expect(response.headers['Content-Range']).toBe(contentRange);
    expect(response.headers['Content-Length']).toBe(String(body.length));
    expect(response.headers['Accept-Ranges']).toBe('bytes');
    expect(response.headers['Content-Encoding']).toBeUndefined();
  });
  it.each(['bytes=10-', 'bytes=8-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,3-4',
    'bytes=a-b', 'items=0-1', 'bytes=999999999999999999999999-',
  ])('returns 416 for %s', range => {
    const response = request('/voice.opus', { Range: range });
    expect(response.status).toBe(416);
    expect(response.headers['Content-Range']).toBe('bytes */10');
    expect(response.body.length).toBe(0);
  });
  it('handles empty files and ignores Range on HEAD', () => {
    expect(request('/zero.opus', { Range: 'bytes=0-' }).headers['Content-Range']).toBe('bytes */0');
    const head = request('/voice.opus', { Range: 'bytes=0-1' }, 'HEAD');
    expect(head.status).toBe(200);
    expect(head.headers['Content-Length']).toBe('10');
    expect(head.body.length).toBe(0);
  });
  it('uses strong content ETags, accepts weak/list/wildcard conditions, and checks conditions before Range', () => {
    const { ETag } = request('/voice.opus').headers;
    expect(ETag).toMatch(/^"[a-f0-9]{64}"$/);
    for (const match of [ETag, `W/${ETag}`, `"old", W/${ETag}`, '*']) {
      const response = request('/voice.opus', { 'If-None-Match': match, Range: 'bytes=0-1' });
      expect(response.status).toBe(304);
      expect(response.headers.ETag).toBe(ETag);
      expect(response.headers['Content-Length']).toBeUndefined();
      expect(response.body.length).toBe(0);
    }
    expect(request('/voice.opus', { 'If-None-Match': '"old"' }).status).toBe(200);
    expect(request('/voice.opus', { 'If-None-Match': ETag }, 'HEAD').status).toBe(304);
    expect(app({ url: '/voice.opus', rawHeaders: ['If-None-Match', ETag] }).status).toBe(403);
  });
  it('honors only a matching strong If-Range', () => {
    const { ETag } = request('/voice.opus').headers;
    expect(request('/voice.opus', { Range: 'bytes=0-1', 'If-Range': ETag }).status).toBe(206);
    for (const value of ['"old"', `W/${ETag}`, 'Wed, 01 Jan 2020 00:00:00 GMT']) {
      const response = request('/voice.opus', { Range: 'bytes=0-1', 'If-Range': value });
      expect(response.status).toBe(200);
      expect(response.body.equals(voice)).toBe(true);
    }
  });
});

describe('precomputed compression and startup limits', () => {
  it.each([['gzip', gunzipSync], ['br', brotliDecompressSync]])('serves precomputed %s and variant-specific ETags', (encoding, decode) => {
    const plain = request('/');
    const compressed = request('/', { 'Accept-Encoding': encoding });
    expect(compressed.headers['Content-Encoding']).toBe(encoding);
    expect(compressed.headers.Vary).toBe('Accept-Encoding');
    expect(plain.headers.Vary).toBe('Accept-Encoding');
    expect(decode(compressed.body).equals(html)).toBe(true);
    expect(compressed.headers['Content-Length']).toBe(String(compressed.body.length));
    expect(compressed.headers.ETag).not.toBe(plain.headers.ETag);
    expect(request('/', { 'Accept-Encoding': encoding }).body).toBe(compressed.body);
    expect(request('/', { 'Accept-Encoding': encoding, 'If-None-Match': compressed.headers.ETag }).status).toBe(304);
    expect(request('/', { 'Accept-Encoding': encoding, 'If-None-Match': plain.headers.ETag }).status).toBe(200);
    const head = request('/', { 'Accept-Encoding': encoding }, 'HEAD');
    expect(head.headers).toEqual(compressed.headers);
    expect(head.body.length).toBe(0);
  });
  it.each(['html', 'js', 'mjs', 'css', 'json', 'svg'])('compresses %s', extension => {
    expect(request(`/type.${extension}`, { 'Accept-Encoding': 'gzip' }).headers['Content-Encoding']).toBe('gzip');
  });
  it.each([
    ['gzip, br', 'br'], ['gzip;q=1, br;q=0.5', 'gzip'], ['gzip;q=0, br;q=0', undefined],
    ['gzip;q=0.5, identity;q=0.1', 'gzip'], ['br;q=0, *;q=1', 'gzip'],
    ['gzip;q=0.5', undefined], ['', undefined], ['deflate', undefined],
  ])('negotiates %s', (accept, expected) => {
    expect(request('/', { 'Accept-Encoding': accept }).headers['Content-Encoding']).toBe(expected);
  });
  it('rejects encodings when no available representation is acceptable', () => {
    expect(request('/', { 'Accept-Encoding': '*;q=0' }).status).toBe(406);
    expect(request('/voice.opus', { 'Accept-Encoding': 'identity;q=0, gzip' }).status).toBe(406);
  });
  it('never compresses ranges, including text ranges', () => {
    const response = request('/', { Range: 'bytes=0-3', 'Accept-Encoding': 'br, gzip' });
    expect(response.status).toBe(206);
    expect(response.body.toString()).toBe('<htm');
    expect(response.headers['Content-Encoding']).toBeUndefined();
    expect(request('/', { Range: 'bytes=0-3', 'Accept-Encoding': 'identity;q=0, gzip' }).status).toBe(406);
  });
  it('fails with tiny byte and entry caps before loading an oversized snapshot', async () => {
    await expect(createStaticApp(dist, { maxBytes: 1 })).rejects.toThrow('byte limit');
    await expect(createStaticApp(dist, { maxEntries: 1 })).rejects.toThrow('entry limit');
  });
  it('rejects a symlink as the dist root', async () => {
    await expect(createStaticApp(join(dist, 'loop'))).rejects.toThrow('directory');
  });
});
