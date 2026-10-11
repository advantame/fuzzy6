import { spawnSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { sha256, validateWav } from './core.mjs';

export const MAX_OPUS_BYTES = 2 * 1024 ** 2;
export const MAX_TAKES = 2000;
export const TOOL_TIMEOUT_MS = 30_000;
// Native spawnSync timeout runs even while JS is blocked. SIGKILL cannot be ignored;
// spawnSync waits for/reaps this child. opus-tools do not create child processes.
// No shell, output files, retries, or tool-version subprocesses. Each take uses two
// serial children at most; bounded input (180s), stdout (2/18 MiB), stderr, and time.
export function runTool(command, args, input, maxBuffer, timeout = TOOL_TIMEOUT_MS) {
  const result = spawnSync(command, args, { input, maxBuffer, timeout, killSignal: 'SIGKILL', windowsHide: true });
  if (result.error) {
    if (result.error.code === 'ENOENT') throw new Error(`${command} がありません。作者用環境に opus-tools (opusenc / opusdec) が必要です。`);
    throw new Error(`${command}: ${result.error.code}（時間または出力容量の上限、または起動失敗）`);
  }
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal}): ${result.stderr.toString('utf8', 0, 2048)}`);
  return result.stdout;
}
export function findOpusTool(name) {
  for (const dir of [join(homedir(), '.local/bin'), ...(process.env.PATH ?? '').split(':').filter(Boolean)]) {
    const file = join(dir, name);
    try { accessSync(file, constants.X_OK); return file; } catch { /* next explicit directory */ }
  }
  throw new Error(`${name} がありません。作者用環境に opus-tools (opusenc / opusdec) が必要です。`);
}
export function opusTools() { return { enc: findOpusTool('opusenc'), dec: findOpusTool('opusdec') }; }

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  let crc = n << 24;
  for (let i = 0; i < 8; i++) crc = (crc << 1) ^ ((crc & 0x80000000) ? 0x04c11db7 : 0);
  return crc >>> 0;
});
export function oggCRC(page) {
  let crc = 0;
  for (let i = 0; i < page.length; i++) {
    const byte = i >= 22 && i < 26 ? 0 : page[i];
    crc = (crc << 8) ^ crcTable[((crc >>> 24) ^ byte) & 255];
  }
  return crc >>> 0;
}
function pages(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_OPUS_BYTES) throw new Error('Ogg Opus の容量が不正です。');
  const result = [];
  let offset = 0, serial;
  while (offset < bytes.length) {
    if (offset + 27 > bytes.length || bytes.toString('ascii', offset, offset + 4) !== 'OggS' || bytes[offset + 4] !== 0) throw new Error('Ogg page header が不正です。');
    const segments = bytes[offset + 26];
    const bodyStart = offset + 27 + segments;
    if (bodyStart > bytes.length) throw new Error('Ogg segment table が途中です。');
    let length = 0;
    for (let i = offset + 27; i < bodyStart; i++) length += bytes[i];
    const end = bodyStart + length;
    if (end > bytes.length) throw new Error('Ogg page body が途中です。');
    const page = bytes.subarray(offset, end);
    if (page.readUInt32LE(22) !== oggCRC(page)) throw new Error('Ogg CRC が一致しません。');
    serial ??= page.readUInt32LE(14);
    if (page.readUInt32LE(14) !== serial || page.readUInt32LE(18) !== result.length) throw new Error('Ogg serial / sequence が不正です。');
    const flags = page[5];
    if ((flags & ~7) || (result.length === 0 ? flags !== 2 : Boolean(flags & 2)) || ((flags & 4) && end !== bytes.length)) throw new Error('Ogg stream flags が不正です。');
    result.push({ page, body: bytes.subarray(bodyStart, end), flags, granule: page.readBigUInt64LE(6) });
    offset = end;
  }
  return result;
}
export function parseOggOpus(bytes) {
  const all = pages(bytes);
  const first = all[0], last = all.at(-1);
  const head = first.body;
  if (all.length < 3 || head.length !== 19 || head.toString('ascii', 0, 8) !== 'OpusHead' || head[8] !== 1 || head[9] !== 1 || head[18] !== 0 || first.page[26] !== 1) throw new Error('mono OpusHead が必要です。');
  if (all[1].body.toString('ascii', 0, 8) !== 'OpusTags' || !(last.flags & 4)) throw new Error('Ogg Opus が完結していません。');
  const preSkip = head.readUInt16LE(10);
  const ticks = last.granule - BigInt(preSkip);
  if (ticks < 0n || ticks > 180n * 48000n) throw new Error('Opus granule / pre-skip の長さが不正です。');
  return { preSkip, presentationTicks: Number(ticks), channels: head[9], inputSampleRate: head.readUInt32LE(12), serial: first.page.readUInt32LE(14) };
}
// opusenc writes its libopus vendor version and an ENCODER comment even with
// --discard-comments. Replace the standalone tags packet, rebuild its lacing and
// checksum. Audio packets, granules and pre-skip remain byte-for-byte intact.
export function normalizeOpus(bytes) {
  const all = pages(bytes);
  const tags = all[1];
  if (!tags || tags.flags !== 0 || tags.granule !== 0n || tags.body.toString('ascii', 0, 8) !== 'OpusTags' ||
      [...tags.page.subarray(27, 27 + tags.page[26])].slice(0, -1).some(n => n !== 255) || tags.page[26 + tags.page[26]] === 255) throw new Error('OpusTags は単独の完結したpageである必要があります。');
  const body = Buffer.alloc(16); // empty vendor, zero comments: no date/tool strings
  body.write('OpusTags');
  const page = Buffer.alloc(28 + body.length);
  tags.page.copy(page, 0, 0, 27);
  page[26] = 1; page[27] = body.length; body.copy(page, 28);
  page.writeUInt32LE(oggCRC(page), 22);
  const output = Buffer.concat(all.map((p, i) => i === 1 ? page : p.page));
  parseOggOpus(output);
  return output;
}
export function encoderArgs(serial) {
  return ['--quiet', '--bitrate', '40', '--vbr', '--comp', '10', '--framesize', '20',
    '--speech', '--downmix-mono', '--padding', '0', '--discard-comments', '--discard-pictures', '--serial', String(serial), '-', '-'];
}
export function encodeOpus(wav, { tools = opusTools(), signal, run = runTool } = {}) {
  signal?.throwIfAborted();
  const master = validateWav(wav);
  // Depends only on source bytes, never filename, clock, PID or random serial.
  const serial = Buffer.from(master.sha256, 'hex').readUInt32LE(0);
  const bytes = normalizeOpus(run(tools.enc, encoderArgs(serial), wav, MAX_OPUS_BYTES));
  signal?.throwIfAborted();
  const parsed = parseOggOpus(bytes);
  const samples48 = master.samples * 2;
  if (parsed.serial !== serial || parsed.presentationTicks !== samples48) throw new Error('Opus granule / pre-skip と原本のサンプル数が一致しません。');
  const pcm = run(tools.dec, ['--quiet', '--rate', '48000', '--no-dither', '-', '-'], bytes, 18 * 1024 ** 2);
  signal?.throwIfAborted();
  if (pcm.length !== samples48 * 2) throw new Error(`Opus 復号長が原本と一致しません: expected=${samples48}, decodedBytes=${pcm.length}`);
  return { bytes, sha256: sha256(bytes), samples48, master };
}
