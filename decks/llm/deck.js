// The LLM deck: history → concepts → chatbots → agents (README.md has the plan and sources).

import { FONTS } from './lib/theme.js';
import opening from './clips/opening.js';
import timeline from './clips/timeline.js';
import shannon from './clips/shannon.js';
import turing from './clips/turing.js';
import eliza from './clips/eliza.js';
import transformer from './clips/transformer.js';
import scale from './clips/scale.js';
import chatgpt from './clips/chatgpt.js';
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
import loop from './clips/loop.js';
import coding from './clips/coding.js';
import mcp from './clips/mcp.js';
import horizon from './clips/horizon.js';
import safety from './clips/safety.js';
import nest from './clips/nest.js';

export default {
  id: 'llm',
  title: 'LLM',
  subtitle: '次の一語から、エージェントまで',
  fonts: FONTS,
  chapters: [
    { id: 'history', title: '歴史', clips: [opening, timeline, shannon, turing, eliza, transformer, scale, chatgpt] },
    { id: 'concepts', title: '基本概念', clips: [tokens, predict, embedding, attention, pretrain, context] },
    { id: 'chat', title: 'チャットボット', clips: [base, rlhf, template, memory, hallucination] },
    { id: 'agents', title: 'エージェント', clips: [tools, loop, coding, mcp, horizon, safety, nest] },
  ],
};
