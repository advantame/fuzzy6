// Generated test audio; no speech engine, network or model is used.
import { oggCRC } from '../../tools/narrate/opus.mjs';
export function testWav(samples = 72000) {
  const b = Buffer.alloc(44 + samples * 2);
  b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(24000, 24); b.writeUInt32LE(48000, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) b.writeInt16LE(Math.round(1500 * Math.sin(i / 24000 * Math.PI * 880)), 44 + i * 2);
  return b;
}
// Container-only fixture for journal/planner tests. It deliberately does not claim
// to be decodable audio; real codec and Chromium tests use tone.opus instead.
export function testOgg(samples48 = 144000, serial = 7, vendor = 'test encoder') {
  const head = Buffer.alloc(19); head.write('OpusHead'); head[8] = 1; head[9] = 1;
  head.writeUInt16LE(312, 10); head.writeUInt32LE(24000, 12);
  const tags = Buffer.alloc(16 + Buffer.byteLength(vendor)); tags.write('OpusTags');
  tags.writeUInt32LE(Buffer.byteLength(vendor), 8); tags.write(vendor, 12);
  return Buffer.concat([head, tags, Buffer.from([0xf8, 0xff, 0xfe])].map((body, i) => {
    const page = Buffer.alloc(28 + body.length); page.write('OggS'); page[5] = [2, 0, 4][i];
    page.writeBigUInt64LE(i === 2 ? BigInt(samples48 + 312) : 0n, 6);
    page.writeUInt32LE(serial, 14); page.writeUInt32LE(i, 18);
    page[26] = 1; page[27] = body.length; body.copy(page, 28);
    page.writeUInt32LE(oggCRC(page), 22);
    return page;
  }));
}
