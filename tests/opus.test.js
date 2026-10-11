import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { encodeOpus, normalizeOpus, parseOggOpus, opusTools, runTool, oggCRC } from '../tools/narrate/opus.mjs';
import { sha256 } from '../tools/narrate/core.mjs';
import { testWav, testOgg } from './fixtures/narrate-data.js';

let tools;
try { tools = opusTools(); } catch { /* CI does not have opus-tools. */ }

describe('bounded Opus subprocesses', () => {
  it('reports a missing executable clearly', () => {
    expect(() => runTool('/missing-narrate-opusenc', [], Buffer.alloc(0), 128, 100)).toThrow('opus-tools');
  });
  it('kills and reaps a timed-out child and can then run the next child', () => {
    expect(() => runTool(process.execPath, ['-e', 'setInterval(()=>{},1000)'], Buffer.alloc(0), 1024, 100)).toThrow('ETIMEDOUT');
    expect(runTool(process.execPath, ['-e', "process.stdout.write('ok')"], Buffer.alloc(0), 1024, 1000).toString()).toBe('ok');
  });
  it('bounds accumulated output using a tiny overflow', () => {
    expect(() => runTool(process.execPath, ['-e', "process.stdout.write('x'.repeat(4096))"], Buffer.alloc(0), 128, 1000)).toThrow('ENOBUFS');
    expect(() => runTool(process.execPath, ['-e', "process.stderr.write('x'.repeat(4096))"], Buffer.alloc(0), 128, 1000)).toThrow('ENOBUFS');
  });
});

describe('Ogg headers, deterministic metadata and length', () => {
  it('removes vendor/date/comment differences while preserving granule and pre-skip', () => {
    const a = normalizeOpus(testOgg(9600, 7, 'libopus 1.4 2026-10-11'));
    const b = normalizeOpus(testOgg(9600, 7, 'other version'));
    expect(a.equals(b)).toBe(true);
    expect(parseOggOpus(a)).toMatchObject({ presentationTicks: 9600, preSkip: 312, channels: 1 });
    expect(normalizeOpus(a).equals(a)).toBe(true);
  });
  it('rejects truncated, corrupted and incomplete streams', () => {
    const valid = testOgg();
    expect(() => parseOggOpus(valid.subarray(0, -1))).toThrow();
    const corrupt = Buffer.from(valid); corrupt[corrupt.length - 1] ^= 1;
    expect(() => parseOggOpus(corrupt)).toThrow('CRC');
    const noEnd = Buffer.from(valid);
    const lastOffset = noEnd.lastIndexOf(Buffer.from('OggS'));
    noEnd[lastOffset + 5] = 0;
    noEnd.writeUInt32LE(oggCRC(noEnd.subarray(lastOffset)), lastOffset + 22);
    expect(() => parseOggOpus(noEnd)).toThrow('完結');
  });
  it.each(['granule', 'decoded'])('rejects a one-sample %s mismatch without real tools', mismatch => {
    const wav = testWav(4800), serial = Buffer.from(sha256(wav), 'hex').readUInt32LE(0);
    let calls = 0;
    const run = () => ++calls === 1 ? testOgg(mismatch === 'granule' ? 9601 : 9600, serial) : Buffer.alloc(9601 * 2);
    expect(() => encodeOpus(wav, { tools: {}, run })).toThrow(mismatch === 'granule' ? 'granule' : '復号長');
    expect(calls).toBe(mismatch === 'granule' ? 1 : 2);
  });
  it('reads the checked-in browser fixture without external tools', () => {
    const bytes = readFileSync(new URL('./fixtures/tone.opus', import.meta.url));
    expect(parseOggOpus(bytes).presentationTicks).toBe(144000);
  });
  it.skipIf(!tools)('real tools produce identical bytes and exact 48kHz lengths, including a partial final frame', () => {
    for (const samples of [4800, 4801, 72123]) {
      const wav = testWav(samples);
      const a = encodeOpus(wav, { tools }), b = encodeOpus(wav, { tools });
      expect(a.bytes.equals(b.bytes)).toBe(true);
      expect(a.samples48).toBe(samples * 2);
      expect(parseOggOpus(a.bytes).presentationTicks).toBe(samples * 2);
      expect(a.bytes.includes(Buffer.from('libopus'))).toBe(false);
      expect(a.bytes.includes(Buffer.from('ENCODER'))).toBe(false);
    }
  });
});
