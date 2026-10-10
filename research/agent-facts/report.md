# ツール・検索・エージェント：19項目のファクトチェック

## 要約と判定方法

**19項目中、confirmed（確認）13件、corrected（訂正）6件。訂正対象はB1・R2・S5・M1・H4・H5。** 各項目全体をuncertainとする必要はなかったが、公開日の厳密な意味や比較条件に未確定部分がある。confirmedも、下表の対象・条件・出典への帰属を伴う判定である。

重要な訂正は、MCPの現行版では`initialize`往復が廃止されていること、ツールを呼ばない応答が必ず`end_turn`になるわけではないこと、RAGを検索活用の起源としないこと、AGENTS.mdの公開フォーマット化と以前からの利用を分けること、Claude Codeのカスタムsubagentsと従来の委任を区別すること。computer useの成績には操作数・入力・採点条件を添える。

一次資料の取得・確認日はすべて **2026-10-09 UTC**。研究開始は同日20:05:54 UTC。環境の日付表示2026-10-10とは区別し、報告作成によって調査時点を更新したことにはしない。現行API・CLI文書は固定版番号のない取得時点のページ、MCPは日付付き仕様、論文は下記の版を使用した。詳しい取得方法・節・照合・計画変更は[調査ログ](log.md)にある。

[先行報告](../llm-facts/report.md)のA1（API公開日）、H7（Claude Code）、A6（multi-agent数値）、A7（computer use／Operator公開区分）は指定どおり再利用した。本報告のH1–H5は先行報告の同名IDとは別体系。新たなモデル評価・実行やプロジェクトの変更は行っていない。

## 全項目の判定表

主表は指定IDごとに1行、計19行。画面では短い文言を使い、細かな条件は脚注やREADMEへ残す。

| ID | Status | 画面に使える値・文言 | 一次資料 | 範囲・留保 |
|---|---|---|---|---|
| B1 | corrected | 「Claudeが`tool_use`に名前と引数を書く。アプリが実行し、`user`内の`tool_result`で結果を返す。自然に応答を終えると`end_turn`。」client toolsはアプリ、server toolsはAnthropic側で実行。 | [定義](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)、[往復](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls)、[停止理由](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons)、[追加トークン表](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) | ツールなしでも`max_tokens`等で停止する。結果の`content`は任意。モデル別追加量は補足表。 |
| B2 | confirmed | 「Chat Completionsは`tool_calls → role:tool`、Responsesは`function_call → function_call_output`。新規開発にはResponsesが推奨される。」 | [Function calling](https://developers.openai.com/api/docs/guides/function-calling)、[Chat API](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)、[移行ガイド](https://developers.openai.com/api/docs/guides/migrate-to-responses) | 関数ツールの説明。`arguments`はJSON文字列。現行のGPT-6 Astra／GPT-6.1 Solのtool callingにはResponsesが必要。 |
| B3 | confirmed | 「公開形式では、道具への指示も文章と同じ次トークン生成で書かれる。実行するのは周りのプログラム。」Harmonyは`<\|call\|>`で引渡し、Llama 3.1は`<\|eom_id\|>`と`<\|eot_id\|>`を区別。 | [Harmony](https://developers.openai.com/cookbook/articles/openai-harmony)、[token辞書](https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py)、[Llama 3.1形式](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/prompt_format.md) | 正確な引用・token ID・コード根拠は補足。任意の`<\|…\|>`が1 tokenという意味ではない。閉じたモデルの内部形式へ一般化しない。 |
| B4 | confirmed | Toolformer初稿 **2023-02-09**、WebGPT初稿 **2021-12-17**。OpenAI function calling **2023-06-13**、Anthropic tool use GA **2024-05-30**。 | [Toolformer](https://arxiv.org/abs/2302.04761)、[WebGPT](https://arxiv.org/abs/2112.09332)、[OpenAI発表](https://openai.com/index/function-calling-and-other-api-updates/)、[Anthropic GA](https://www.anthropic.com/news/tool-use-ga) | 後半2件は先行報告A1の再引用。論文初投稿とAPI提供を分ける。 |
| R1 | confirmed | 「Lewisらが2020年の論文でRAGを提案。約2,100万のWikipedia断片をDPRで検索し、BART-largeで生成した。」初稿 **2020-05-22**、NeurIPS 2020。 | [RAG v1](https://arxiv.org/pdf/2005.11401v1)、[書誌](https://arxiv.org/abs/2005.11401)、[NeurIPS](https://proceedings.nips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html)、[DPR](https://aclanthology.org/2020.emnlp-main.550/) | 2018-12-20版英語Wikipedia、100語、21,015,324断片。BART-large約400M、学習時k∈{5,10}。所属・命名・方式は補足。 |
| R2 | corrected | 「検索と言語モデルを組み合わせる研究はRAG以前からある。ORQA（2019年）、REALM（2020年2月）などが先行した。」 | [ORQA](https://arxiv.org/abs/1906.00300)、[REALM](https://arxiv.org/abs/2002.08909)、[RAG §1](https://arxiv.org/pdf/2005.11401v1) | RAGを最初の検索拡張言語モデルとは呼べない。これら先行例を現代のchatbotと同一視しない。 |
| R3 | confirmed | 「検索資料を生成時の入力へ加える方式を広くRAGと呼ぶ。検索をモデルが呼ぶ道具にすることもできる。」Web検索APIはOpenAI **2025-03-11 preview**、Anthropic **2025-05-07提供開始**。 | [広義RAG](https://www.anthropic.com/engineering/contextual-retrieval)、[OpenAI agents発表](https://openai.com/index/new-tools-for-building-agents/)、[Anthropic検索API](https://claude.com/resources/articles/web-search-api)、[DevDay](https://openai.com/index/new-models-and-developer-products-announced-at-devday/) | OpenAI文書検索はAssistants Retrieval **2023-11-06 beta**に遡る。製品検索とAPI、Webとファイル、初公開とGAを区別。 |
| S1 | confirmed | 「2024-10-22、Anthropicがcomputer useをpublic betaで公開。画面操作・編集・bashの3つの道具を用意した。bashは持続するシェルで実行し、出力を文字で返す。」 | [発表](https://www.anthropic.com/news/3-5-models-and-computer-use)、[公開当日実装](https://github.com/anthropics/anthropic-quickstarts/tree/4acbe40937e0962a55fc77ca74552b5d7064c680/computer-use-demo/computer_use_demo/tools)、[現行Bash tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/bash-tool) | 指定された3名は`type`。呼出し`name`と区別。シェルはアプリ側のprocessであり、APIによる永久保存ではない。 |
| S2 | confirmed | 「Claude Code：**2025-02-24 限定研究プレビュー → 2025-05-22 一般提供**。」 | [Claude 3.7](https://www.anthropic.com/news/claude-3-7-sonnet)、[Claude 4](https://www.anthropic.com/news/claude-4) | 先行報告H7の再引用。 |
| S3 | confirmed | 「Codex CLI：**2025-04-16**、端末で使うcoding agentをオープンソースで公開。」 | [o3／o4-mini発表](https://openai.com/index/introducing-o3-and-o4-mini/)、[API changelog](https://developers.openai.com/api/docs/changelog) | 当初はnew experiment。クラウドCodexの2025-05-16とは別。「ローカル」は推論モデルまで手元で動く意味ではない。 |
| S4 | confirmed | 「Gemini CLI：**2025-06-25**、端末で使うAIエージェントをオープンソースでpreview公開。」 | [Google発表](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-cli-open-source-ai-agent/) | Apache 2.0。GAと読み替えない。 |
| S5 | corrected | 「画面画像を読み、移動・クリック・文字入力を道具に指示する。」OSWorld **369課題**、更新版Claude 3.5 Sonnet **14.9%（画像のみ・15 steps）**、人間 **72.36%**。CUA公開時は **38.1%／58.1%／87.0%**。 | [Anthropic研究](https://www.anthropic.com/research/developing-computer-use)、[Model Card](https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf)、[OSWorld](https://arxiv.org/abs/2404.07972)、[CUA](https://openai.com/index/computer-using-agent/)、[評価条件](https://cdn.openai.com/cua/CUA_eval_extra_information.pdf) | CUAは順にOSWorld／WebArena／WebVoyager、pass@1、原則200 steps。初期clickの座標指定、22%、次点7.7/7.8差は補足。 |
| M1 | corrected | 「MCPはJSON-RPC 2.0で道具・資料・promptをつなぐ。`tools/list`で定義を取得し、`tools/call`で呼ぶ。」**2024-11-05版はinitialize、現行2026-07-28版は各requestに版と能力を添える**。 | [初期仕様](https://modelcontextprotocol.io/specification/2024-11-05)、[現行変更点](https://modelcontextprotocol.io/specification/2026-07-28/changelog)、[現行tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)、[2025-03-26変更点](https://modelcontextprotocol.io/specification/2025-03-26/changelog) | 列挙されたfield名は維持。現行はmetadata・resultType等が追加。Streamable HTTPは2025-03-26版から。 |
| M2 | confirmed | 「**2025-12-09**、MCPはLinux Foundation傘下のAAIFへ。Blockのgoose、OpenAIのAGENTS.mdも設立時のprojectに加わった。」 | [Linux Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)、[MCP発表](https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/) | AnthropicがMCPを寄贈。既存maintainerの技術統治をLFが直接置換したという意味ではない。 |
| H1 | confirmed | 「ハーネスは、モデルを呼び、道具を実行し、結果と文脈を次の推論へ渡すプログラム。研究ではscaffoldとも呼ばれる。」Claude Agent SDK改称 **2025-09-29**。同一GPT-4 TurboでLite **11%対18%**の例。 | [SDK](https://claude.com/resources/articles/building-agents-with-the-claude-agent-sdk)、[harness記事](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)、[Codex loop](https://openai.com/index/unrolling-the-codex-agent-loop/)、[METR報告](https://metr.org/Evaluating_LMAs_Realistic_Tasks.pdf)、[SWE-agent v3](https://arxiv.org/html/2405.15793v3) | 用語・日付・逐語引用は補足。Lite 300課題、同一snapshot、pass@1。採点用evaluation harnessとは区別。 |
| H2 | confirmed | 「会話は既定で端末に保存される。Claude CodeはJSONLへ記録し、`--continue`／`--resume`で再開。Codex CLIにも`resume`がある。」 | [Claude sessions](https://code.claude.com/docs/en/sessions)、[Codex commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli) | 保存無効化・保存期間等の例外あり。保存済み全文とモデルの現在のcontextは別。 |
| H3 | confirmed | 「文脈が上限に近づいたら、古い結果を整理し、要点を残して続ける。長く残す情報は外部のメモへ。」Claude API context editing／memory **2025-09-29 public beta**。Responses明示compaction **2025-12-11**、自動方式 **2026-02-10**。 | [Claude Code](https://code.claude.com/docs/en/how-claude-code-works)、[Anthropic発表](https://claude.com/resources/articles/context-management)、[context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)、[OpenAI changelog](https://developers.openai.com/api/docs/changelog)、[Compaction](https://developers.openai.com/api/docs/guides/compaction) | `/compact`、古いtool結果削除、外部memory、API圧縮を同一機能にしない。OpenAI圧縮itemはopaque。 |
| H4 | corrected | 「CLAUDE.mdやAGENTS.mdに作業手順や規約を書く。ハーネスが文脈へ読み込む。」AGENTS.md公開フォーマットは **2025年8月**、OpenAIを含む複数開発者が協力。 | [Claude memory](https://code.claude.com/docs/en/memory)、[AGENTS.md](https://agents.md/)、[OpenAI AAIF](https://openai.com/index/agentic-ai-foundation/)、[Codex発表](https://openai.com/index/introducing-codex/)、[初回commit](https://github.com/agentsmd/agents.md/commit/ba9474a69e9a2c0c4176713843b78e8f54377941) | CLAUDE.mdは階層で読込時期が異なる。8月19日は公式repo初回commitで、ファイルの誕生日や厳密な一般公開時刻ではない。 |
| H5 | corrected | 「子エージェントはそれぞれの文脈で調べ、結果を主担当へ返す。」Claude Codeの**カスタムsubagentsは2025-07-24（v1.0.60）**。AnthropicはBrowseComp分析でtoken量が成績のばらつきの**80%**を説明すると報告。 | [subagents](https://code.claude.com/docs/en/sub-agents)、[導入commit](https://github.com/anthropics/claude-code/commit/812c27b8b35ff3a520764c0f0aa75b61ad512489)、[npm公開時刻](https://registry.npmjs.org/@anthropic-ai%2fclaude-code)、[multi-agent記事](https://www.anthropic.com/engineering/multi-agent-research-system) | 委任全体は以前からある。80%は正答率・因果効果ではない。90.2%、15×、4×は先行A6再引用で、別の指標。 |

## 必要な補足

### B1–B2：APIの形と実行主体

以下は取得時点の関数／client toolの正常な往復を整理したもの。歴史的な公開当日のpayloadではない。

| 段階 | Anthropic Messages | OpenAI Chat Completions | OpenAI Responses |
|---|---|---|---|
| 定義 | `name`, `description`, `input_schema` | `{type:"function", function:{name,description,parameters}}` | `{type:"function", name,description,parameters}` |
| 呼出し | assistant contentの`tool_use`：`id`, `name`, `input` | assistantの`tool_calls`：`id`と`function.name/arguments` | output itemの`function_call`：`call_id`, `name`, `arguments` |
| 正常な呼出し停止 | `stop_reason:"tool_use"` | `finish_reason:"tool_calls"` | 呼出しitemを受け取る方式 |
| 結果 | 直後の`user` content内に`tool_result`、対応は`tool_use_id` | `role:"tool"`、対応は`tool_call_id` | input itemの`function_call_output`、対応は`call_id` |
| 引数の値 | `input`はobject | `arguments`はJSON文字列 | `arguments`はJSON文字列 |

Anthropicでは対応するassistant応答も履歴に残し、直後のuser messageで結果を返す。user content内ではtool_resultを先に置く。`content`と`is_error`は任意で、失敗時に後者をtrueにする。API上の`user`区分は、人間が結果を入力したという意味ではない。自然終了は`end_turn`だが、長さ制限・拒否等の別停止もある。[Handle tool calls](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls)、[Stop reasons](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons)

Anthropicはツール定義・設定・利用者のsystem promptから専用system promptを組み立てる。client/serverは実行場所の区別であり、server toolも常に一度の応答で完結するとは限らない。[Define tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)、[Overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)

OpenAIの例は関数ツールに限定する。Responsesには通常messageと別のitemがあり、結果を返すときは必要な推論item等の状態も保持する。新規開発にはResponsesが推奨され、Chat Completionsもサポートは継続するが、対応モデルのtool calling制約は別に確認する。[Function calling](https://developers.openai.com/api/docs/guides/function-calling)、[Migrate §5](https://developers.openai.com/api/docs/guides/migrate-to-responses)

**Anthropicの追加system promptトークン量（2026-10-09取得）**。最低1 toolがある条件で、ツール定義や呼出し・結果本文自体のtoken量とは別。列は`tool_choice`の種類。現役モデル一覧や全推論設定での利用可否を示す表ではない。[Overview：Pricing](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)

| モデル | `auto`／`none` | `any`／`tool` |
|---|---:|---:|
| Claude Opus 5.5 | 286 | 非対応 |
| Claude Sonnet 5.5 | 286 | 非対応 |
| Claude Haiku 5.5 | 286 | 406 |
| Claude Opus 5 | 286 | 406 |
| Claude Opus 4.8 | 290 | 410 |
| Claude Opus 4.7 | 675 | 804 |
| Claude Opus 4.6 | 497 | 589 |
| Claude Opus 4.5 | 496 | 588 |
| Claude Opus 4.1 | 313 | 315 |
| Claude Opus 4 | 313 | 315 |
| Claude Sonnet 5 | 354 | 474 |
| Claude Sonnet 4.6 | 497 | 589 |
| Claude Sonnet 4.5 | 496 | 588 |
| Claude Sonnet 4 | 313 | 315 |
| Claude Haiku 4.5 | 496 | 588 |
| Claude Haiku 3.5 | 264 | 355 |

Opus 5.5／Sonnet 5.5の`any`／`tool`は400 errorとなるため「非対応」。manual extended thinkingにも強制呼出しの制約がある。toolsなし＋`none`は追加0。表にないモデルへ値を推定しない。[Define tools：Forcing tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)

### B3–B4：公開モデルの生の形式と歴史

gpt-ossは**2025-08-05**公開。現行Harmonyガイドでは、関数定義をdeveloper messageの`namespace functions`にTypeScript風に記す。APIへ送るJSON Schemaと、モデルに見せる表現を区別する。以下はガイドのReceiving tool calls／Handling tool callsから、呼出しと結果の2 messageを引用したもの。[gpt-oss発表](https://openai.com/index/introducing-gpt-oss/)、[Harmony guide](https://developers.openai.com/cookbook/articles/openai-harmony)

```text
<|start|>assistant<|channel|>commentary to=functions.get_current_weather <|constrain|>json<|message|>{"location":"San Francisco"}<|call|>
<|start|>functions.get_current_weather to=assistant<|channel|>commentary<|message|>{"sunny": true, "temperature": 20}<|end|>
```

制御tokenとして符号化した場合の、辞書に登録された単一tokenは次のとおり。`commentary`、`to=`、関数名、`json`は普通の文字列。任意の山括弧表記や、利用者が本文に入力した同じ文字列が必ず1個の制御tokenになるわけではない。[tiktoken：o200k_harmony](https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py)

| 表記 | token ID | 役割 |
|---|---:|---|
| `<\|start\|>` | 200006 | message開始 |
| `<\|end\|>` | 200007 | message終了 |
| `<\|message\|>` | 200008 | headerと本文の境界 |
| `<\|channel\|>` | 200005 | channel指定 |
| `<\|constrain\|>` | 200003 | content type指定 |
| `<\|return\|>` | 200002 | assistant completion終了・sampling停止 |
| `<\|call\|>` | 200012 | toolへ制御を渡すためsampling停止 |

`<|call|>`自体が外部関数を実行するわけではない。`<|constrain|>json`も、それだけでschema準拠を保証するものではなく、必要なら生成側のgrammar制約を使う。結果は意味上tool roleだが、引用の直列化では送信者名が`functions.get_current_weather`になっている。[Harmony guide](https://developers.openai.com/cookbook/articles/openai-harmony)

Llama 3.1は**2024-07-23**公開。3.1 Instructの形式では、assistantの`<|eom_id|>`がtoolへの引渡し、`<|eot_id|>`が依頼への応答終了を表す。後者はuser等の入力message末尾にも使われるため、常に会話全体の終了を意味しない。`<|python_tag|>`はPython以外のtool呼出しにも付き、結果roleは`ipython`。これらはtokenizerの独立した特殊tokenとして登録される。[Meta発表](https://ai.meta.com/blog/meta-llama-3-1/)、[3.1 prompt format](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/prompt_format.md)、[tokenizer](https://github.com/meta-llama/llama-models/blob/main/models/llama3/tokenizer.py)

「同じ次トークン生成」は、公開されたgpt-oss／Llamaの生成loopと形式からの**推論**である。通常文とtool指示を同じ語彙の自己回帰生成として表現できる。ただしtool-use学習や、prompt、tool選択の強制・禁止、sampling制約、実行許可等は別にある。「追加学習なし」「アプリが判断に関与しない」とは言えない。[gpt-oss TokenGenerator.generate](https://github.com/openai/gpt-oss/blob/main/gpt_oss/torch/model.py)、[Llama generation](https://github.com/meta-llama/llama-models/blob/main/models/llama3/generation.py)

ToolformerはSchickら・Meta AI Research中心、v1 **2023-02-09**。WebGPTはNakanoら、v1 **2021-12-17**で、後の版の2022年表記を初公開年にしない。B4のAPI日付は先行A1を再引用しており、B1/B2の現行payloadを2023年当日のコードとして表示する根拠にはならない。[Toolformer書誌](https://arxiv.org/abs/2302.04761)、[WebGPT書誌](https://arxiv.org/abs/2112.09332)

### R1–R3：原論文のRAGと、現在の広い用法

Lewisらの*Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*はv1 **2020-05-22**、NeurIPS 2020。初稿の所属は**Facebook AI Research／University College London／New York University**。原論文はRAGという名を導入しており、Lewis本人も命名を回想している。検索という発想全体の発明を主張するものではない。[原論文](https://arxiv.org/pdf/2005.11401v1)、[著者インタビュー](https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/)

| 対象 | 確認値・条件 |
|---|---|
| 検索器 | DPR、質問と文書を別々のBERT-baseで符号化するbi-encoder、最大内積検索（MIPS） |
| 検索対象 | 英語Wikipedia **2018-12-20 dump** |
| 分割 | 重ならない**100語**単位。100 tokensや100文字ではない |
| 検索単位数 | **21,015,324 passages**。Wikipedia記事数ではない |
| 生成器 | **BART-large、約400M parameters（約4億）** |
| top-k | 学習時候補は**5／10**、評価時はvalidationで調整 |
| 学習 | query encoderと生成器を調整。document encoderとindexは固定 |

数値はRAG v1 §§2–3, 4.7とDPR §4.1が根拠。原論文にはRAG-Sequence／RAG-Tokenがあり、文書ごとの生成確率を周辺化する。単に全断片を一つのpromptへ連結した方式だけで原論文を描かない。[RAG v1](https://arxiv.org/pdf/2005.11401v1)、[DPR本文](https://aclanthology.org/2020.emnlp-main.550.pdf)

先行例はORQA（初稿 **2019-06-01**）とREALM（初稿 **2020-02-10**）。RAG自身も引用している。現在の広義RAGは、検索資料を生成入力へ加える構成を指せるが、単なる検索や静的な指示ファイルまで「あらゆるRAG」とは呼ばない。モデルが検索toolを選ぶ構成もこの定義に該当し得る、という整理になる。[ORQA](https://arxiv.org/abs/1906.00300)、[REALM](https://proceedings.mlr.press/v119/guu20a.html)、[Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)

| APIの検索機能 | 初公式提供・発表 | 当時の区分 |
|---|---|---|
| OpenAI Assistants Retrieval | **2023-11-06** | Assistants API beta。利用者の文書を検索 |
| OpenAI Assistants file search | **2024-04-17** | 新toolの導入。単独のGA宣言とはしない |
| OpenAI Responses Web検索 | **2025-03-11** | 全developer向けpreview、当初`web_search_preview` |
| OpenAI Responses file search | **2025-03-11** | Responsesで提供開始。文書検索全体の初登場ではない |
| Anthropic Messages Web検索 | **2025-05-07** | 提供開始。取得した発表本文からbeta／GAを断定しない |

日付の根拠は[DevDay](https://openai.com/index/new-models-and-developer-products-announced-at-devday/)、[OpenAI changelog](https://developers.openai.com/api/docs/changelog)、[Responses発表](https://openai.com/index/new-tools-for-building-agents/)、[Anthropic検索API発表](https://claude.com/resources/articles/web-search-api)。Anthropicの**2025-03-20**はClaude製品の検索feature previewであり、APIと別。[Claude製品の発表](https://claude.com/resources/articles/web-search)

現行OpenAIはResponsesの`web_search`を推奨し、ファイルはvector store上の`file_search`でsemantic／keyword検索する。Anthropicの基本版`web_search_20250305`の末尾はschema版で、公開日は5月7日。現行には`web_search_20260209`／`web_search_20260318`もある。Anthropic組込み検索の往復は`server_tool_use`／`web_search_tool_result`で、アプリ実行のB1と分ける。[OpenAI Web search](https://developers.openai.com/api/docs/guides/tools-web-search)、[File search](https://developers.openai.com/api/docs/guides/tools-file-search)、[Anthropic Web search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)

### S1–S5：端末・画面操作と評価条件

2024-10-22当日の固定commit `4acbe40937e0962a55fc77ca74552b5d7064c680`で、次の3つを確認した。mainのclass名だけから当時のschemaを推測していない。[当日loop.py](https://github.com/anthropics/anthropic-quickstarts/blob/4acbe40937e0962a55fc77ca74552b5d7064c680/computer-use-demo/computer_use_demo/loop.py)

| 用途 | 初期`type` | 初期の呼出し`name` |
|---|---|---|
| 画面操作 | `computer_20241022` | `computer` |
| ファイル編集 | `text_editor_20241022` | `str_replace_editor` |
| シェル | `bash_20241022` | `bash` |

bash実装は同一`/bin/bash` processへcommandを送り、stdout／stderrを文字で返す。restartするとsessionを作り直す。現在のガイドは`bash_20250124`を案内する。editorの現行例は`text_editor_20250728`／`str_replace_based_edit_tool`、computer useはプラットフォーム等に応じて`computer_toolset_20260801`等を案内するため、現行例と2024年の例を混ぜない。[初期bash.py](https://github.com/anthropics/anthropic-quickstarts/blob/4acbe40937e0962a55fc77ca74552b5d7064c680/computer-use-demo/computer_use_demo/tools/bash.py)、[Bash](https://platform.claude.com/docs/en/agents-and-tools/tool-use/bash-tool)、[Editor](https://platform.claude.com/docs/en/agents-and-tools/tool-use/text-editor-tool)、[Computer use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool)

computer useは画面画像→操作指示→アプリによる実行→次の画像、という往復。Anthropicはcursorを正しい位置へ動かすためpixel位置を数える訓練を説明している。連続動画を見るという意味ではない。**初期`computer_20241022`の`left_click`はcoordinateを受け取らない**ため、当時のコード例は`mouse_move`へ座標を渡し、その後`left_click`とする。[研究記事](https://www.anthropic.com/research/developing-computer-use)、[初期computer.py](https://github.com/anthropics/anthropic-quickstarts/blob/4acbe40937e0962a55fc77ca74552b5d7064c680/computer-use-demo/computer_use_demo/tools/computer.py)

OSWorldの初稿は**2024-04-11**。本文確認はv2（2024-05-30）。主実験はUbuntu上の**369課題**で、環境が他OSへ対応することとは別。人間の**72.36%**は論文の被験者条件での成功率で、モデルと同じ15操作制限ではない。[OSWorld書誌](https://arxiv.org/abs/2404.07972)、[v2本文 §§3–4](https://arxiv.org/html/2404.07972v2)

| 公表・評価 | 成績 | 比較に必要な条件 |
|---|---:|---|
| 更新版Claude 3.5 Sonnet、2024-10-22 | **14.9%** | OSWorld、screenshot-only、最大15 steps |
| 同モデルの追加条件 | **22.0%** | 最大50 steps **かつprompt最適化** |
| 当時の次点（Anthropic発表値） | **7.8%** | screenshot-only。別の同社研究記事は7.7%と記す |
| CUA、2025-01-23：OSWorld | **38.1%** | Ubuntu VM、画像＋mouse／keyboard |
| 同：WebArena | **58.1%** | Operator browser、サイト別の補助prompt |
| 同：WebVoyager | **87.0%** | Operator browser、GPT-4o自動採点、壊れた35課題を除外 |

Claudeの値は[Model Card October Addendum §2.1/Table 1](https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf)。7.8%は[発表記事](https://www.anthropic.com/news/3-5-models-and-computer-use)、7.7%は[研究記事](https://www.anthropic.com/research/developing-computer-use)で、差の原因は未確定。画面なら「当時の次点は約8%」か、7.8%に出典を明記する。

CUA値は[公開記事](https://openai.com/index/computer-using-agent/)と[評価補足](https://cdn.openai.com/cua/CUA_eval_extra_information.pdf)による。全結果pass@1、temperature 0.6、特記なければ最大200 steps。OSWorldではdock位置も変更している。Claudeの15／50 stepsと条件を揃えた順位表にはできない。Operatorの1月公開は米国Pro向けresearch previewであり、3月11日のAPI公開とは別。[Operator System Card](https://openai.com/index/operator-system-card/)

### M1–M2：MCPの版による差

取得時点の公式Currentは**2026-07-28**。初期2024-11-05版とともにJSON-RPC 2.0を使うが、開始方法が異なる。これはモデルproviderのAPIではなく、host内clientとtool等のserver間の規約である。[Versioning](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning)、[2026-07-28 release](https://blog.modelcontextprotocol.io/posts/2026-07-28/)

| 対象 | 2024-11-05 | 2026-07-28（取得時Current） |
|---|---|---|
| 開始 | `initialize`→応答→`notifications/initialized` | handshake廃止。requestごとのmetadata。任意の`server/discover` |
| 一覧 | `tools/list`→`result.tools` | 名称維持。`resultType`, `ttlMs`, `cacheScope`を追加 |
| 定義 | 必須`name`, `inputSchema`、任意`description` | 基本名は同じ。`title`, `icons`, `outputSchema`等を追加 |
| 呼出し | `tools/call`、`name`、任意`arguments` | 基本名は同じ。共通の必須`_meta`等を追加 |
| 完了結果 | 必須`content`配列、任意`isError` | 同じ＋必須`resultType:"complete"`、任意`structuredContent` |
| 標準transport | stdio、HTTP+SSE | stdio、Streamable HTTP |

根拠：[初期Lifecycle](https://modelcontextprotocol.io/specification/2024-11-05/basic/lifecycle)、[初期Tools](https://modelcontextprotocol.io/specification/2024-11-05/server/tools)、[現行Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)、[現行Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)、[現行schema](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/schema/2026-07-28/schema.ts)。`description`や`arguments`は最初から任意。`isError`省略はfalse扱いで、RPC自体の`error`とは別。

現行の完全なwire例を示すなら、requestの`params._meta`に`io.modelcontextprotocol/protocolVersion`と`io.modelcontextprotocol/clientCapabilities`を入れる。後者は空objectでもよい。一覧結果には`resultType:"complete"`、`ttlMs`、`cacheScope`が必要。HTTPではversion headerに加え`Mcp-Method`、対象があれば`Mcp-Name`等も使う。Tools文書の簡略例はmetadataを省いているため、そのまま完全例と呼ばない。[現行Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)、[Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)

依頼されたfield名に改名はない。`title`は表示名、`structuredContent`は構造化結果の追加で、`name`や`content`の置換ではない。MCPの`inputSchema`／`isError`と、Anthropicの`input_schema`／`is_error`を混同しない。現行には追加入力を求める`resultType:"input_required"`もある。[2025-06-18変更点](https://modelcontextprotocol.io/specification/2025-06-18/changelog)、[現行Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)

Streamable HTTPの導入は**2025-03-26版**。2026-07-28版ではGET streamとprotocol-level sessionが廃止され、POSTとそのresponseを中心とする。SSE自体が消えたわけではない。旧版の実装が残る可能性があり、Currentの公開だけでは各製品の移行を保証できない。[2025-03-26変更点](https://modelcontextprotocol.io/specification/2025-03-26/changelog)、[現行変更点](https://modelcontextprotocol.io/specification/2026-07-28/changelog)

AAIFはLinux Foundation傘下のdirected fund。**2025-12-09**の設立時寄贈はAnthropicのMCP、Blockのgoose、OpenAIのAGENTS.md。MCPのmaintainer体制と技術方針の自律性は続く。設立時の3 projectを現在の全project一覧とは呼ばない。[LF発表](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)、[MCP側発表](https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/)

### H1：harness／scaffoldの逐語引用と同一モデル比較

**2025-09-29**、Claude Code SDKからClaude Agent SDKへの改称を伝えた記事：

> In other words, the agent harness that powers Claude Code (the Claude Code SDK) can power many other types of agents, too.

Claude Codeの仕組みを他種のagentへ使えるという説明であり、新モデルやharnessという語の初登場日ではない。[Building agents with the Claude Agent SDK](https://claude.com/resources/articles/building-agents-with-the-claude-agent-sdk)

**2025-11-26**、長い作業を複数contextへ引き継ぐ設計の記事：

> We looked to human engineers for inspiration in creating a more effective harness for long-running agents.

進捗ファイル等を組み合わせた実装例で、全harnessに同じ手順を義務づける定義ではない。[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

**2026-01-23**、OpenAIのCodex agent loop記事：

> We hope this post gives you a good view into the role our agent (or “harness”) plays in making use of an LLM.

モデル呼出し、tool実行、結果を次の入力へ追加する反復とcontext管理を説明している。記事日付とCodex harness自体の初公開日は別。[Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)

METR掲載の旧ARC Evals報告§2：

> The scaffolding program parses the model’s next action and executes it.

Web公開は**2023-08-01**、対応するarXiv初投稿は**2023-12-18**。モデルのaction解釈、実行、結果の再入力等をscaffoldingと呼ぶ。harnessと役割が重なるが、全組織共通の厳密な同義語ではない。[METR公開ページ](https://metr.org/blog/2023-08-01-new-report/)、[報告PDF](https://metr.org/Evaluating_LMAs_Realistic_Tasks.pdf)、[arXiv書誌](https://arxiv.org/abs/2312.11671)

SWE-benchの公式説明もagent scaffoldという語を使う。一方、patchを適用してtestを走らせる**evaluation harness**は採点側の基盤であり、agent loopと区別する。[SWE-bench Verified](https://www.swebench.com/verified)

| 同一モデル比較 | Shell-only agent | SWE-agent |
|---|---:|---:|
| GPT-4 Turbo `gpt-4-1106-preview`、SWE-bench **Lite 300課題**、pass@1 | **11.00%** | **18.00%** |

出典はSWE-agent論文**v3（2024-11-11）Table 1、§4**。1課題4ドルの上限で、差は**7ポイント**。検索・編集・表示・feedback・context処理を含む仕組み全体の比較であり、圧縮だけの効果ではない。Shell-onlyの7.33%はdemonstrationなしの別条件で、上表へ混ぜない。Verified 500課題の成績でもない。[論文v3](https://arxiv.org/html/2405.15793v3)

### H2–H4：保存履歴・現在の文脈・外部記録

Claude Codeの既定transcriptは`~/.claude/projects/<project>/<session-id>.jsonl`。1行が1個のJSON objectで、message、tool use、metadata等を記録する。`claude --continue`は現directoryの直近会話、`claude --resume`は選択、`claude --resume <session-id>`は指定再開。保存先・保存抑止等は設定でき、永久保存ではない。[Manage sessions](https://code.claude.com/docs/en/sessions)

Codex CLIは`codex resume`、`codex resume --last`、`codex resume <SESSION_ID>`を提供する。保存された履歴の全文と、現在モデルに渡されるcontextは別物。[Developer commands：codex resume](https://learn.chatgpt.com/docs/developer-commands?surface=cli)、[Claude Codeのcontext説明](https://code.claude.com/docs/en/how-claude-code-works)

| 機能・資料 | 日付または状態 | 正確な意味 |
|---|---|---|
| Claude Code `/compact`／自動compaction | 現行docs、2026-10-09取得 | 手動要約、上限近くで古いtool出力を整理して必要なら要約 |
| Claude API context editing／memory tool | **2025-09-29 public beta** | Sonnet 4.5と同日。古いtool結果整理と外部記録操作 |
| Effective context engineering for AI agents | **2025-09-29** | 記事の公開日 |
| Responses `/responses/compact` | **2025-12-11** | clientが明示的に圧縮endpointを呼ぶ方式 |
| Responses server-side compaction | **2026-02-10** | 閾値で自動圧縮する後発機能 |

日付の根拠：[Anthropic context management発表](https://claude.com/resources/articles/context-management)、[API release notes](https://platform.claude.com/docs/en/release-notes/overview)、[context engineering記事](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)、[OpenAI changelog](https://developers.openai.com/api/docs/changelog)。CLIの`/compact`とAPI endpointの公開日を同一視しない。

Claude APIのcontext editingは、古いtool result等をserver側でplaceholderへ置き換えてモデル入力を節約する。clientの元履歴を書き換えず、会話全体の意味的要約とも異なる。memory toolはclient側handlerがstorageへ記録する仕組みで、Anthropicが自動で永続storageを用意する意味ではない。[Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing)、[Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)

`memory_20250818`、`clear_tool_uses_20250919`、`context-management-2025-06-27`の日付部分は公開日ではない。OpenAIのclient-side compactionも手元のPCだけで計算する意味ではなく、clientがAPI呼出しを管理することを指す。結果には暗号化されたopaqueなcompaction itemが含まれ、人間向けの要約文字列と断定できない。現行の自動方式は`context_management`の`compact_threshold`で設定する。[Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)、[Compaction](https://developers.openai.com/api/docs/guides/compaction)

CLAUDE.mdはsession開始時に指示として読むが、下位directoryのファイルは関連fileへアクセスした時に読む。「repository内の全部を開始時に読む」は不正確。指示ファイル、auto memory、transcript、API memory toolは異なる役割であり、いずれもモデル重みへの再学習という説明にはしない。[Claude memory](https://code.claude.com/docs/en/memory)

AGENTS.md公式サイトはOpenAI Codex、Amp、Google Jules、Cursor、Factory等の協力を記す。OpenAIは公開フォーマットのreleaseを**2025年8月**と振り返るが、**2025-05-16**のCodex発表に既に指示ファイルとして登場する。公式repoの初回commitは**2025-08-19 21:49:01 UTC**、Ampの対応発表は翌20日。したがって年表は「公開フォーマット：2025年8月」が安全で、日を必要とするなら「公式repo初回commit：8月19日」とする。[公式サイト](https://agents.md/)、[OpenAI AAIF](https://openai.com/index/agentic-ai-foundation/)、[Codex発表](https://openai.com/index/introducing-codex/)、[初回commit](https://github.com/agentsmd/agents.md/commit/ba9474a69e9a2c0c4176713843b78e8f54377941)、[Amp発表](https://ampcode.com/news/AGENTS.md)

現行Codexは開始時に指示の階層を構築する。製品間で読み込み規則が完全に同じとは限らず、現行Claude Codeにも条件付きAGENTS.md対応がある。「Claude CodeはCLAUDE.mdしか読めない」という補足は避ける。[Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)、[Claude memory](https://code.claude.com/docs/en/memory)

### H5：子エージェントと80%の意味

Claude Codeのsubagentは独立したcontext windowで作業し、結果を主担当へ返す。通常は親の全会話を自動継承しないが、現行のforkは継承する例外なので「必ず空の履歴から始まる」とは言わない。[Create custom subagents](https://code.claude.com/docs/en/sub-agents)

カスタム定義機能は**v1.0.60／2025-07-24 UTC**。公式CHANGELOG追記commitとnpm publish時刻（20:52:22.104Z）を照合した。それ以前のv1.0.41にもSubagentStop hookがあるため、この日を委任機能全体の初登場としない。[CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)、[導入commit](https://github.com/anthropics/claude-code/commit/812c27b8b35ff3a520764c0f0aa75b61ad512489)、[npm metadata](https://registry.npmjs.org/@anthropic-ai%2fclaude-code)

2025-06-13のAnthropic記事にある次の指標は、それぞれ分母と意味が異なる。[How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

| 値 | 対象・読み方 |
|---|---|
| **90.2%上回る** | Opus 4主担当＋Sonnet 4子担当の内部research評価、単独Opus 4比。先行A6再引用 |
| **約15×／約4×** | 通常チャット比のtoken使用量。順にmulti-agent／single-agent。先行A6再引用 |
| **80%** | BrowseCompに関する同社分析でtoken使用量が説明するperformance variance |

今回追加確認した80%の原文：

> We found that token usage by itself explains 80% of the variance

直前の文がBrowseCompの成績のばらつきを対象とする。**正答率80%、性能向上80%、token増加の因果効果ではない。** 分析の標本・回帰仕様・生データは記事だけでは十分分からず、独立再現した数値とはしない。90.2%は別の内部評価で、同じ尺度の棒グラフへ並べられない。[Anthropic記事](https://www.anthropic.com/engineering/multi-agent-research-system)

## 不確実性と計画の変遷

全11調査単位を完了した。途中の派生質問は元の19項目を正確に答えるために追究したもので、原質問の置換はない。

| 計画変更・派生質問 | 今回の扱いと結論 |
|---|---|
| 現行MCPのwire例は初期と同じか | Plan revision 1で仕様・schemaを追加照合。initialize廃止とmetadata追加を反映 |
| Responses圧縮の「公開」はどの方式か | Plan revision 2で明示endpointと後発の自動方式を分離 |
| AGENTS.mdの「launch」はファイル利用か公開フォーマットか | Plan revision 2で5月のCodex利用、8月の公開フォーマット、初回commitを分離 |
| subagentの「導入」は委任全体かカスタム定義か | Plan revision 3でCHANGELOG・commit・npm時刻を照合。7月24日はカスタム機能に限定 |

残る不確実性は以下のとおり。

- **S5：次点7.7%／7.8%の差。** 同社一次資料内の不一致で、run同定や差の原因は未確定。出典帰属か「約8%」で扱う。
- **H4：AGENTS.mdの厳密な一般公開時刻。** commit日だけではサイト公開やrepositoryのpublic切替時刻を証明できない。公開月とcommitイベントを使う。
- **H5：初期built-in委任の最初の日。** カスタム機能以前の存在は確認できるが、厳密な初導入日は確定していない。80%の統計的再現に必要なデータも不足する。
- **現行仕様と実装の差。** API/CLI文書は更新される。MCP Currentが各host/serverへ導入済みとは限らない。公開コードのmainは発売日の固定commitではないため、当日実装が必要なS1/S5のみ固定した。
- **検索toolのGA日。** 初公式提供日は確認したが、OpenAI正式Web検索への移行日やAnthropicの厳密なGA日は今回の根拠から確定していない。初公開をGAと言い換えない。

## 推奨する次の行動

1. **訂正6件を先に画面案へ反映する。** 特にM1は図の流れが変わる。歴史図なら2024-11-05、現行図なら2026-07-28を明示する。
2. **版・取得日・比較条件をREADMEへ残す。** APIのコードはprovider/API名、computer useはstepsと入力条件、SWE-agent比較はLite・snapshot・pass@1、multi-agentは指標ごとの分母を添える。
3. **B3は引用のまま、説明用に作るJSONや出力は「例」と表示する。** 公開モデルの形式を閉じたモデルの内部仕様として見せない。最終的な文面・レイアウト調整はデッキ制作側で行う。
4. **追加調査は用途が生じたものに絞る。** 条件を揃えたClaude/CUA比較、同一token予算でのsingle/multi-agent比較、製品ごとのMCP採用版、検索toolの厳密なGA日、指示ファイル全採用史・harness内部圧縮の詳細は保留。実性能や互換性を判断する段階で別の調査・評価として扱う。

本調査の成果物はこの報告と[追記型の調査ログ](log.md)の2点。デッキ・engine・先行報告は変更していない。
