import { mkdir, open, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readOptional } from './assets.mjs';
import { dictionaryParams, MAX_WORDS } from './lexicon.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function syncDictionary(root, lexicon, request, options) {
  const dir = join(root, '.cache/voicevox');
  const path = join(dir, 'managed-words.json');
  const bytes = await readOptional(path, 128 * 1024);
  const record = bytes ? JSON.parse(bytes.toString('utf8')) : { version: 1, uuids: [] };
  if (!record || record.version !== 1 || !Array.isArray(record.uuids) || record.uuids.length > MAX_WORDS ||
      record.uuids.some(id => typeof id !== 'string' || !UUID.test(id)) || new Set(record.uuids).size !== record.uuids.length)
    throw new Error('辞書のUUID控えが不正です。');
  const known = new Set(record.uuids);
  const dictionary = await request('/user_dict', options);
  if (!dictionary || typeof dictionary !== 'object' || Array.isArray(dictionary)) throw new Error('ユーザー辞書の応答が不正です。');
  const ids = Object.keys(dictionary);
  // The complete preflight precedes ALL DELETE/POST and ledger writes.
  if (ids.some(id => !known.has(id))) throw new Error('道具の控えにない語がユーザー辞書にあります。辞書は変更しません。');
  const save = async () => {
    await mkdir(dir, { recursive: true });
    const temp = join(dir, `.managed-${randomUUID()}.json`);
    let handle;
    try {
      handle = await open(temp, 'wx', 0o600);
      await handle.writeFile(JSON.stringify({ version: 1, uuids: [...known] }) + '\n');
      await handle.sync();
      await handle.close(); handle = null;
      await rename(temp, path);
    } finally {
      await handle?.close();
      await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; });
    }
  };
  for (const id of ids) {
    await request(`/user_dict_word/${id}`, { ...options, method: 'DELETE' });
    known.delete(id);
    await save();
  }
  // Stale ledger IDs are harmless; discard them after successful preflight.
  known.clear();
  if (bytes) await save();
  for (const entry of lexicon) {
    const id = await request('/user_dict_word', { ...options, method: 'POST', params: dictionaryParams(entry) });
    if (typeof id !== 'string' || !UUID.test(id) || known.has(id)) throw new Error('辞書登録で不正なUUIDが返りました。');
    known.add(id);
    // Persist after each registration so a later failure remains recoverable.
    // An interruption between POST and save fails closed on the next run.
    await save();
  }
}
