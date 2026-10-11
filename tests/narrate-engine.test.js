import { it, expect, vi, afterEach } from 'vitest';
import { request } from '../tools/narrate/engine.mjs';

afterEach(() => vi.unstubAllGlobals());
it('sends dictionary query parameters on the allowed port and accepts an empty DELETE 204', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify('00000000-0000-4000-8000-000000000001')))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetch);
  const params = { surface: 'ツール', pronunciation: 'ツール', accent_type: 0, word_type: 'COMMON_NOUN', priority: 5 };
  const id = await request('/user_dict_word', { method: 'POST', params });
  const [url, init] = fetch.mock.calls[0];
  expect(url.origin).toBe('http://127.0.0.1:8083');
  expect(Object.fromEntries(url.searchParams)).toEqual(Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])));
  expect(init.body).toBeUndefined();
  expect(init.method).toBe('POST');
  await expect(request(`/user_dict_word/${id}`, { method: 'DELETE' })).resolves.toBeUndefined();
  expect(fetch.mock.calls[1][1].method).toBe('DELETE');
});
