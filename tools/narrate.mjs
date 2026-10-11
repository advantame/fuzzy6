#!/usr/bin/env node
// Usage: npm run narrate -- <deck> [clipId ...] [--generate | --encode | --prune | --inspect] [--speeds 1.1,1.3,1.5]
// --inspect requires one clip. --json streams a JSON array of final AudioQueries.
// Inspection writes only the dictionary ledger/cache, never voice assets/manifest.
// Default is read-only: no HTTP, engine, listening port, cache, or output files.
// Without --speeds, generate only each line's deck pace speed (slow/normal/fast).
// With --speeds, generate every listed speed for every spoken line.
// List unused takes in all plans; generate/encode keep them. --prune removes their
// Opus files and moves takes to _retired, keeping WAVs. No engine; no --speeds.
// Removed or silent script lines have no current spoken speed; their records are
// retained. --prune only compares takes belonging to the selected spoken lines.
// --generate / --inspect: local CPU Engine 0.25.2 / Core 0.16.1 on 127.0.0.1:8083 only.
// Check port availability and ownership; prlimit AS=4GiB, CPU=1800s, no core dumps,
// 256 open files; ten inference/BLAS threads, CUDA hidden, one engine, no retries.
// XDG directories: <project>/.cache/voicevox/. Require 16GiB available RAM.
// Mutable APIs enabled for the dictionary only through our owned local engine.
// Lifetime .cache/voicevox/.engine-lock serializes engines across decks/modes.
// Unknown dictionary UUIDs abort before any DELETE/POST. managed-words.json keeps
// our UUIDs after every registration. Lexicon <=1000 words, word/kana <=200 chars.
// Startup and each response <=120s; generation <=30min, supervised in a separate
// process. SIGINT/SIGTERM/client disconnect trigger cleanup. Verify PID start time
// and executable before TERM, then KILL after 3s; wait another 3s to reap.
// JSON <=8MiB, API JSON <=2MiB, WAV <=10MiB/180s, log <=16KiB, <=2000 lines.
// CLI output <=8MiB per run, checked before enqueueing each line/query.
// Writes are serialized under voice/.narrate-lock. Per-take hashes include anchors
// and settings. Obsolete takes move to _retired (never played, still owned).
// Opus: <=2000 takes, one child at a time, <=30s/child, SIGKILL then reap;
// stdin <=10MiB/180s, stdout <=2MiB encode / 18MiB decode (stderr also bounded).
// No engine for --encode or --prune. See narrate/opus.mjs for deterministic tag/serial handling.
// _pending journals writes and pruning for interrupted-write recovery under the lock.
// After an uncatchable kill, inspect ownership before manually removing the named lock.
// Spec leaves anchor-only edits and partial multi-speed updates unspecified; these
// extra manifest fields keep old takes out of playback without deleting their WAVs.
// Playback-only narrators without speaker/style (demo) are not synthesis targets.

import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { parseArgs, collectLines, narrator, SETTINGS, CORE_VERSION, generationHash,
  prefixMoraCount, anchorSeconds, queryTiming, checkDuration, validateWav, millis, MAX_WAV_BYTES } from './narrate/core.mjs';
import { inspectAssets, openWriter, readOptional } from './narrate/assets.mjs';
import { encodeOpus, opusTools } from './narrate/opus.mjs';
import { startSupervisedEngine, request, resolveStyle, TOTAL_MS } from './narrate/engine.mjs';
import { readLexicon, lineLexicon } from './narrate/lexicon.mjs';
import { syncDictionary } from './narrate/dictionary.mjs';
import { queryLine, inspectQueries, formatInspection } from './narrate/inspect.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function loadDeck(root, id) {
  // runner avoids Vite's generated config file; middlewareMode/hmr/watch/optimizer
  // disabling avoids sockets, watchers and cache writes, including in dry-run.
  const server = await createServer({ root, configFile: join(root, 'vite.config.js'), configLoader: 'runner',
    logLevel: 'error', server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    environments: { ssr: { optimizeDeps: { noDiscovery: true, include: [] } } },
  });
  try { return (await server.ssrLoadModule(`/decks/${id}/deck.js`)).default; }
  finally { await server.close(); }
}

async function commitEncoded(writer, item, encoded) {
  const take = { ...item.take, file: item.file, sha256: encoded.sha256, master: item.master };
  await writer.commit({ kind: 'encode', clipId: item.clipId, lineId: item.lineId,
    speed: item.speed, take, previousSha256: item.previousSha256 }, encoded.bytes);
}
export async function encode(voiceDir, state, signal, { tools, encodeAudio = encodeOpus } = {}) {
  const pending = state.encodePlan.filter(item => item.status === 'encode');
  if (!pending.length && !state.needsRecovery) return [];
  if (pending.length) tools ??= opusTools(); // Fail before any mutation if tools are missing.
  const writer = await openWriter(voiceDir, state);
  const results = [];
  try {
    if (state.needsRecovery) await writer.persist();
    for (const item of pending) {
      signal.throwIfAborted();
      const wav = await readOptional(join(voiceDir, item.master.file), MAX_WAV_BYTES);
      if (!wav || validateWav(wav).sha256 !== item.master.sha256) throw new Error(`原本が変更されています: ${item.master.file}`);
      const encoded = encodeAudio(wav, { tools, signal });
      if (Math.abs(encoded.master.duration - item.take.duration) > 0.000501) throw new Error(`原本の長さが記録と違います: ${item.master.file}`);
      await commitEncoded(writer, item, encoded);
      results.push({ file: item.file, wavBytes: wav.length, opusBytes: encoded.bytes.length,
        samples24: encoded.master.samples, samples48: encoded.samples48 });
    }
    return results;
  } finally { await writer.close(); }
}

export async function prune(voiceDir, state, signal) {
  if (!state.unused.length && !state.needsRecovery) return [];
  const writer = await openWriter(voiceDir, state);
  const removed = [];
  try {
    if (state.needsRecovery) await writer.persist();
    for (const item of state.unused) {
      signal.throwIfAborted();
      await writer.commit({ kind: 'prune', ...item });
      removed.push(item.take.file);
    }
    return removed;
  } finally { await writer.close(); }
}

export async function generate(root, voiceDir, state, voice, signal, { tools, encodeAudio = encodeOpus } = {}) {
  const lexicon = readLexicon(voice.lexicon);
  const deliveries = { ...state, encodePlan: state.encodePlan.filter(item => state.plan.some(p =>
    p.status === 'encode' && p.line.clipId === item.clipId && p.line.lineId === item.lineId && p.speed === item.speed)) };
  if (deliveries.encodePlan.length) {
    await encode(voiceDir, deliveries, signal, { tools, encodeAudio });
    // encode() shares the manifest object but persisted it through its own writer.
    state.raw = await readOptional(join(voiceDir, 'manifest.json'));
    state.needsRecovery = false;
  }
  const pending = state.plan.filter((item) => !['ready', 'encode'].includes(item.status));
  if (!pending.length && !state.needsRecovery) return;
  if (pending.length) tools ??= opusTools();
  const writer = await openWriter(voiceDir, state);
  let engine;
  try {
    await writer.persist(); // Persist any recovered journal before a new transaction.
    if (!pending.length) return;
    engine = await startSupervisedEngine(root, signal);
    const options = { signal, identity: engine.identity };
    await syncDictionary(root, lexicon, request, options);
    const styles = new Map();
    let params;
    // One line's queries in memory at a time. Prefix queries determine only a mora
    // index; all times come from the full query, never from prefix durations.
    let previousLine, query, counts;
    for (const item of pending) {
      signal.throwIfAborted();
      const { line, speed, file, masterFile } = item;
      const actor = narrator(line, voice);
      if (!styles.has(line.by)) styles.set(line.by, await resolveStyle(actor, options));
      params = { speaker: styles.get(line.by), core_version: CORE_VERSION };
      if (line !== previousLine) {
        query = await queryLine(line, lexicon, params, options);
        counts = {};
        for (const anchor of line.anchors) {
          const prefix = Array.from(line.source).slice(0, anchor.offset).join('');
          if (!prefix) counts[anchor.name] = 0;
          else if (prefix === line.source) counts[anchor.name] = query.accent_phrases.reduce((n, p) => n + p.moras.length, 0);
          else {
            const prefixQuery = await request('/audio_query', { ...options, method: 'POST', params: { ...params, text: prefix } });
            try { counts[anchor.name] = prefixMoraCount(query, prefixQuery); }
            catch (error) { throw new Error(`${line.clipId}/${line.lineId} {${anchor.name}}: ${error.message}`); }
          }
        }
        previousLine = line;
      }
      const current = { ...query, ...SETTINGS, speedScale: Number(speed) };
      const { mouth } = queryTiming(current); // Same phoneme clock as the anchors.
      const anchors = Object.fromEntries(Object.entries(counts).map(([name, count]) => [name, anchorSeconds(current, count)]));
      const wav = await request('/synthesis', { ...options, method: 'POST', params: { ...params, enable_interrogative_upspeak: true }, body: current, bytes: true });
      let info;
      try {
        info = validateWav(wav);
        checkDuration(current, info.duration);
      } catch (error) { throw new Error(`${line.clipId}/${line.lineId}@${speed}: ${error.message}`); }
      if (typeof query.kana !== 'string' || query.kana.length > 10000) throw new Error('AudioQuery に読みがありません。');
      // Validate the derivative before recording anything. A crash between the two
      // commits leaves a valid legacy WAV take, recoverable by --encode.
      const encoded = encodeAudio(wav, { tools, signal });
      const take = { file: masterFile, duration: millis(info.duration), anchors, mouth, sha256: info.sha256, generationSha256: generationHash(line, voice, speed) };
      await writer.commit({ line, voice: { speaker: actor.speaker, style: actor.style, lexicon: lineLexicon(line.source, lexicon) }, speed, take, reading: query.kana, previousSha256: item.previousMasterSha256 }, wav);
      await commitEncoded(writer, { clipId: line.clipId, lineId: line.lineId, speed, take, file,
        master: { file: masterFile, sha256: info.sha256 }, previousSha256: item.previousSha256 }, encoded);
    }
  } finally {
    try { await engine?.stop(); } finally { await writer.close(); }
  }
}

export async function main(args = process.argv.slice(2), { root = ROOT, load = loadDeck } = {}) {
  let outputBytes = 0;
  const print = text => {
    const bytes = Buffer.byteLength(text) + 1;
    if (outputBytes + bytes > 8 * 1024 ** 2) throw new Error('端末出力の8MiB上限です。対象または話速を減らしてください。');
    outputBytes += bytes;
    console.log(text);
  };
  const options = parseArgs(args);
  if (options.help) {
    console.log('npm run narrate -- <deck> [clipId …] [--generate | --encode | --prune | --inspect | --dry-run] [--speeds 1.1,1.3,1.5]\n既定はdry-run。--speeds 省略時は文ごとの歩調、指定時は全ての文に全ての指定話速（0.5〜2）。\n--inspect は一つのクリップの拍・高さ・長さを表示。--json で JSON。音声・記録は書かず、辞書の控えだけを更新。\n--prune は使っていない録りのOpusと有効な記録を片づけ、WAVを残す（--speeds 併用不可）。\n合成は承認を得てから --generate で実行。');
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('全体の30分上限です。')), TOTAL_MS);
  const interrupt = () => controller.abort(new Error('中断しました。'));
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  try {
    const deck = await load(root, options.deck);
    controller.signal.throwIfAborted();
    const lines = collectLines(deck, options.clips);
    if (options.inspect) {
      if (options.json) print('[');
      let first = true;
      for await (const result of inspectQueries(root, lines, deck.voice, options.speeds, controller.signal)) {
        print(options.json ? `${first ? '' : ','}${JSON.stringify(result)}` : formatInspection(result));
        first = false;
      }
      if (options.json) print(']');
      return;
    }
    if (!lines.length && !options.encode) { print(`${options.deck}: 対象なし（合成用の話者・スタイル、または読み上げる script がありません）`); return; }
    const voiceDir = join(root, 'decks', options.deck, 'voice');
    const state = await inspectAssets(voiceDir, lines, deck.voice, options.speeds, { clips: options.clips, encodeSpeeds: options.speeds });
    print(options.generate ? '生成計画' : options.encode ? 'Opus 変換計画（エンジン起動なし）' : options.prune ? '片づけ計画（エンジン起動なし）' : 'DRY RUN（起動・書込みなし）');
    for (const line of lines) {
      const takes = state.plan.filter((item) => item.line === line);
      print(`${line.clipId}/${line.lineId}\t${line.by} (${line.speaker} / ${line.style})\t${line.source}\t${takes.map((t) => `${t.speed}: ${{ missing: '足りない録り', stale: '古い録り', ready: '再利用', encode: '原本から変換' }[t.status]}`).join(', ')}`);
      print(`  語彙: ${lineLexicon(line.source, readLexicon(deck.voice.lexicon)).map(entry => JSON.stringify(entry)).join(', ') || 'なし'}`);
    }
    const needed = state.plan.filter((item) => !['ready', 'encode'].includes(item.status)).length;
    for (const item of state.unused) print(`${item.clipId}/${item.lineId}@${item.speed}\t${state.manifest.clips[item.clipId][item.lineId].by}\t使っていない録り\t${item.take.file}`);
    print(`必要な合成: ${needed}件`);
    if (options.prune) {
      const removed = await prune(voiceDir, state, controller.signal);
      print(`片づけた録り: ${removed.length}件`);
    }
    if (options.encode) {
      for (const item of state.encodePlan) print(`${item.file}\t${state.manifest.clips[item.clipId][item.lineId].by}\t${item.status}`);
      const results = await encode(voiceDir, state, controller.signal);
      for (const r of results) print(`${r.file}\tWAV=${r.wavBytes}B\tOpus=${r.opusBytes}B\t24kHz=${r.samples24} / 48kHz=${r.samples48} samples: 一致`);
    }
    if (options.generate) {
      await generate(root, voiceDir, state, deck.voice, controller.signal);
      print('文\t語り手\t話速\t読み（カナ）\t長さ\t印（秒）');
      for (const { line, speed } of state.plan) {
        const entry = state.manifest.clips[line.clipId][line.lineId];
        const take = entry.takes[speed];
        print(`${line.clipId}/${line.lineId}\t${line.by}\t${speed}\t${entry.reading}\t${take.duration.toFixed(3)}秒\t${Object.entries(take.anchors).map(([name, t]) => `${name}=${t.toFixed(3)}`).join(' ') || '—'}`);
      }
    }
  } finally {
    clearTimeout(timer);
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`語り: ${error.message.slice(0, 3000)}`); process.exitCode = 1; });
}
