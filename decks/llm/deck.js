// The LLM deck: an introduction (agents, the LLM at their core, what a language model is) →
// history → concepts → chatbots → tools → what tools connect to → harnesses → growing
// knowledge → compute and price → improving and measuring harnesses → open harnesses
// (README.md has the plan and sources).

import { FONTS } from './lib/theme.js';
import manifest from './voice/manifest.json';
import lexicon from './voice/lexicon.js';
import { standing, hasFigures } from './lib/figures.js';
import opening from './clips/opening.js';
import core from './clips/core.js';
import langmodel from './clips/langmodel.js';
import compose from './clips/compose.js';
import whyai from './clips/whyai.js';
import route from './clips/route.js';
import timeline from './clips/timeline.js';
import shannon from './clips/shannon.js';
import turing from './clips/turing.js';
import eliza from './clips/eliza.js';
import transformer from './clips/transformer.js';
import scale from './clips/scale.js';
import chatgpt from './clips/chatgpt.js';
import inside from './clips/inside.js';
import tokens from './clips/tokens.js';
import predict from './clips/predict.js';
import embedding from './clips/embedding.js';
import attention from './clips/attention.js';
import pretrain from './clips/pretrain.js';
import context from './clips/context.js';
import base from './clips/base.js';
import rlhf from './clips/rlhf.js';
import template from './clips/template.js';
import memory from './clips/memory.js';
import hallucination from './clips/hallucination.js';
import tools from './clips/tools.js';
import toolspec from './clips/toolspec.js';
import toolcall from './clips/toolcall.js';
import toolresult from './clips/toolresult.js';
import toolloop from './clips/toolloop.js';
import rag from './clips/rag.js';
import search from './clips/search.js';
import shell from './clips/shell.js';
import agent from './clips/agent.js';
import gui from './clips/gui.js';
import harness from './clips/harness.js';
import scaffold from './clips/scaffold.js';
import mcpflow from './clips/mcpflow.js';
import session from './clips/session.js';
import compact from './clips/compact.js';
import subagent from './clips/subagent.js';
import coding from './clips/coding.js';
import mcp from './clips/mcp.js';
import horizon from './clips/horizon.js';
import safety from './clips/safety.js';
import nest from './clips/nest.js';
import lostmiddle from './clips/lostmiddle.js';
import noremain from './clips/noremain.js';
import knowledgeplaces from './clips/knowledgeplaces.js';
import llmwiki from './clips/llmwiki.js';
import ingest from './clips/ingest.js';
import query from './clips/query.js';
import lint from './clips/lint.js';
import compile from './clips/compile.js';
import ideafile from './clips/ideafile.js';
import drift from './clips/drift.js';
import wikimemory from './clips/wikimemory.js';
import kvcache from './clips/kvcache.js';
import kvsize from './clips/kvsize.js';
import kvshrink from './clips/kvshrink.js';
import promptcache from './clips/promptcache.js';
import prefix from './clips/prefix.js';
import moe from './clips/moe.js';
import reasoning from './clips/reasoning.js';
import sessioncost from './clips/sessioncost.js';
import harnesseng from './clips/harnesseng.js';
import nohands from './clips/nohands.js';
import maplessons from './clips/maplessons.js';
import samemodel from './clips/samemodel.js';
import metaharness from './clips/metaharness.js';
import selfharness from './clips/selfharness.js';
import saturate from './clips/saturate.js';
import readscore from './clips/readscore.js';
import dsh from './clips/dsh.js';
import cordis from './clips/cordis.js';
import eventlog from './clips/eventlog.js';
import minimal from './clips/minimal.js';
import defaults from './clips/defaults.js';
import ptc from './clips/ptc.js';
import platform from './clips/platform.js';
import appserver from './clips/appserver.js';
import approve from './clips/approve.js';
import threads from './clips/threads.js';
import acp from './clips/acp.js';
import outlook from './clips/outlook.js';

// The narration is synthesised ahead of time (spec §7.1, `npm run narrate -- llm`). The record
// and the delivered audio (Ogg Opus) are in the repository; where a file is missing or the
// browser cannot decode it, the clip plays silently on the recorded timing.
const audio = import.meta.glob('./voice/**/*.opus', { eager: true, query: '?url', import: 'default' });

export default {
  id: 'llm',
  title: 'LLM',
  subtitle: '次の一語から、エージェントまで',
  // plays on from clip to clip unless the viewer turns it off (A); the wait is pace.end
  autoAdvance: true,
  fonts: FONTS,
  // 17:9. The column on the right gives ずんだもん room beside the stage (spec §2).
  frame: { gutter: 120 },
  voice: {
    // The cast (spec §7.2). The first speaker reads every line that names no one.
    cast: {
      metan: { name: '四国めたん', speaker: '四国めたん', style: 'ノーマル', credit: 'VOICEVOX:四国めたん', ...standing('metan', 'left') },
      // ずんだもん asks the questions (1-2 and its dive).
      zunda: { name: 'ずんだもん', speaker: 'ずんだもん', style: 'ノーマル', credit: 'VOICEVOX:ずんだもん', ...standing('zunda', 'right') },
    },
    lexicon,
    manifest,
    url: (file) => audio[`./voice/${file}`],
  },
  // The figures are akihiyo's standing-picture materials, used locally (AGENTS.md). The intro
  // draws ChatGPT's mark (lib/chat.js), which belongs to OpenAI.
  credits: [...(hasFigures ? ['立ち絵:akihiyo'] : []), 'ChatGPT のロゴ:OpenAI'],
  chapters: [
    // whyai is a dive (spec §5.3): off the main line, entered from ずんだもん's question in 1-2.
    { id: 'intro', title: 'はじめに', clips: [opening, core, langmodel, compose, route], dives: [whyai] },
    { id: 'history', title: '歴史', clips: [timeline, shannon, turing, eliza, transformer, scale, chatgpt] },
    { id: 'concepts', title: '基本概念', clips: [inside, tokens, embedding, attention, predict, pretrain, context] },
    { id: 'chat', title: 'チャットボット', clips: [base, rlhf, template, memory, hallucination] },
    { id: 'tools', title: 'ツール', clips: [tools, toolspec, toolcall, toolresult, toolloop] },
    { id: 'connect', title: 'つなぐ先', clips: [rag, search, shell, agent, coding, gui] },
    { id: 'harness', title: 'ハーネス', clips: [harness, scaffold, mcp, mcpflow, session, compact, subagent, safety, horizon, nest] },
    { id: 'wiki', title: '知識を育てる', clips: [lostmiddle, noremain, knowledgeplaces, llmwiki, ingest, query, lint, compile, ideafile, drift, wikimemory] },
    { id: 'cost', title: '計算と値段', clips: [kvcache, kvsize, kvshrink, promptcache, prefix, moe, reasoning, sessioncost] },
    { id: 'tune', title: '鍛えて測る', clips: [harnesseng, nohands, maplessons, samemodel, metaharness, selfharness, saturate, readscore] },
    { id: 'open', title: '開いたハーネス', clips: [dsh, cordis, eventlog, minimal, defaults, ptc, platform, appserver, approve, threads, acp, outlook] },
  ],
};
