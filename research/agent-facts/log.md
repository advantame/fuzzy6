# Agent chapters fact-check — research log

## Question, scope, and start

- Question: Japanese explainer deck `decks/llm` の新4〜6章（tool use → toolsの接続先 → agent harnesses）について、B1–B4、R1–R3、S1–S5、M1–M2、H1–H5の全19項目を一次資料で検証する。
- Scope: 各IDにつきconfirmed / corrected / uncertain、画面に安全に使える値・文言、一次資料URL、条件・留保を用意する。APIは現行公式文書のページ・版・取得日を記録し、歴史的仕様と現在を分ける。発表、preview、beta、GAを混同しない。最終報告は日本語、先行報告と同じ「要約→全ID一行の表→必要な補足」の形。
- UTC start: **2026-10-09 20:05:54 UTC**（clock tool）。環境のcurrent_dateは2026-10-10だが、取得日は実際のUTC時計を使う。前回レポートも同じ区別をしている。
- Files: 書込み先は `research/agent-facts/log.md` と、報告ターンで作成する `research/agent-facts/report.md` のみ。プロジェクトファイルは変更しない。
- First reads: `AGENTS.md`、`decks/llm/README.md`、`docs/spec.md`、`research/llm-facts/report.md`（2026-10-09 UTC取得）。先行報告は再検証せず、既存のA1（function calling / tool use GA / Toolformer）、H7年表（Claude Code）、A6（multi-agent）、A7（computer use/Operator）を再利用する。今回の追加質問のみ新たに調べる。
- Relevant skill: `/home/apm/.codex/skills/.system/openai-docs/SKILL.md`。OpenAI APIは公式文書検索・取得を使用。歴史的発表・公開コードも必要というユーザーの一次資料指定を優先する。

## Initial plan

調査単位は「問い × 資料群」。各単位の完了後、次へ進む前に出典・事実・未解決点を追記する。

1. **B1–B2 / APIの呼出し往復と現行仕様** × Anthropic Messages公式tool-use/API文書、OpenAI Function calling・Chat Completions・Responses公式文書。system promptのモデル別追加トークンと推奨APIを確認。
2. **B3–B4 / 生の会話形式と研究・公開日** × OpenAI gpt-oss/Harmony公式ガイド・tokenizer/コード、Meta Llama 3.1公式形式、arXiv書誌、先行報告の再引用。特殊トークン、呼出し停止、next-token説明の限界を確認。
3. **R1–R2 / RAGの原論文と先行研究** × Lewis論文・NeurIPS書誌、DPR、REALM等の原論文。初稿日、所属、データ・モデル規模、命名と「最初」の範囲を確認。
4. **R3 / 現代のRAGとAPI検索ツール初公開** × Anthropic/OpenAI公式検索文書・発表、必要なら初期Assistants retrieval資料。web searchとfile/retrieval、製品とAPIを分ける。
5. **S1–S4 / shellツールとCLI公開史** × Anthropic computer-use初期schema・reference implementation、Claude Code既存検証、OpenAI/Google CLI公式発表・コード。
6. **S5 / computer useの入出力とlaunch評価** × Anthropicの技術・発表資料、OSWorld原論文、OpenAI Operator/CUA発表・system card。課題数・観測条件・step budget・human比較を確認。
7. **M1–M2 / MCP wire仕様の変遷と統治** × 2024-11-05版と取得時点最新のMCP公式仕様・変更履歴、Linux Foundation/AAIF・寄贈元公式発表。
8. **H1 / harness・scaffoldの用語と評価依存** × Anthropic Agent SDK改称・engineering記事、OpenAI Codex記事、METR/SWE-bench論文・公式結果。短い正確な引用と同一モデル比較を確認。
9. **H2–H4 / sessions・context・memory・指示ファイル** × Claude Code/Codex公式CLI文書・changelog/コード、Anthropic APIリリースとcontext engineering記事、OpenAI compaction文書・changelog、AGENTS.md公式発表。
10. **H5 / subagent導入とcontext、80%の意味** × Claude Code公式文書・changelog、Anthropic multi-agent記事（90.2%・15×・4×は先行報告再引用、80%だけ追加検証）。
11. **全19項目 / 最終照合** × 上記取得済み証拠と先行報告。ID欠落、日付・版、引用長、未確定範囲、画面向け文言を点検。必要な追加単位は計画改訂として追記する。

全単位完了時はログを確定して `ready-to-report` を返す。そのターンにはreportを書かず、指定された報告ターンでログを読み直してreportを作る。

## Unit 1: B1–B2 — APIの呼出し往復・停止理由・現行推奨

### Sources consulted

すべて **2026-10-09 UTC取得**。HTMLはnative webで本文を取得。OpenAIガイド2件は公式Developer Docs検索とfetchでも本文を取得した。公開ドキュメントは更新される現行版で、ページ自体に固定版番号はない。モデル名・tool_choice別の条件は取得時点の記載。

- [Anthropic: Tool use with Claude](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — How tool use works / Pricing（HTMLの該当箇所はL87–88、L277–328）。
- [Anthropic: Define tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools) — Specifying client tools / Tool use system prompt / Forcing tool use。旧 `implement-tool-use` URLはこのページへredirect。
- [Anthropic: Handle tool calls](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls) — client結果のfields、順序、エラー、server toolとの混在。
- [Anthropic: Stop reasons and fallback](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons) — quick reference、end_turn、max_tokens、tool_use。
- [OpenAI: Function calling](https://developers.openai.com/api/docs/guides/function-calling) — request→call→execute→result→answer、Responses item定義、モデル別制限。
- [OpenAI: Migrate to the Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses) — 冒頭の推奨、§5のfunction定義比較。
- [OpenAI: Create chat completion](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create) — ChatCompletionToolMessageParam、finish_reason、tool_calls例。公式fetchの `.md` は404だったためnative webでHTMLを取得（L889–926、L1908以降、L2470以降）。
- ローカル既存資料：`research/llm-facts/report.md` A1・T2（取得2026-10-09）。2023-06-13 function callingと2024-05-30 Anthropic GAの発表日は既存確認を再利用。発表URLはUnit 2でB4にまとめる。

### Findings attributed to sources

**B1 — 判定候補 corrected（主な仕組みは確認、停止理由の断定を修正）。**

- Define toolsによるユーザー定義ツールの標準形は `name`、`description`、`input_schema`（JSON Schema）。Anthropic定義済みclient toolsはdate-versioned `type`で指定するので、すべてのclient toolがユーザー定義と同じ必須fieldsを持つと一般化しない。descriptionは説明を書く標準fieldという意味で使い、API必須性までは主張しない。
- OverviewとHandle tool callsで、assistantの `tool_use` blockは `id`・`name`・`input`。通常の完了したclient callは `stop_reason: "tool_use"`。アプリ側が実行し、assistant応答自体を履歴に保存したうえで直後の `user` messageに `tool_result` を入れる。対応IDは `tool_use_id`。結果の `content` は文字列またはcontent block配列で、**省略可能**。`is_error`も省略可能で、失敗時にtrue。
- ツール結果messageは対応するassistantの直後。user content内ではtool_resultが先。同時に複数のclient呼出しがあれば各IDの結果を返す。「role:user」はAPI上の区分で、人間がツール結果を入力しているという意味ではない。
- Stop reasons文書は `end_turn` を自然に応答が完了したことと定義する。ツールを呼ばない応答でも `max_tokens`、`stop_sequence`、`refusal`、`model_context_window_exceeded`等があり得る。途中で切れたtool_use blockにもmax_tokensがあり得る。画面では **「自然に応答を終えると end_turn。ツールを呼ぶと tool_use」** と正常な例に限定する。
- Define toolsは、ツール定義・設定・利用者指定system promptから専用system promptを構成すると明示。これはAPIに渡すschemaとモデルが読む文字列の区別を裏付けるが、閉じたClaudeモデルの全内部シリアライズを公開した証拠ではない。
- Overviewはclient tools（独自ツール、bash、text_editor等）はアプリ、server tools（web_search、web_fetch、code_execution、tool_search等）はAnthropic基盤で実行とする。server tool結果が常に同一レスポンスで完結するとは限らない。client/serverを同時に呼んだ場合の未完了server結果は後続レスポンスに来る場合があり、server loopにはpause_turnもある。

**B1: 現行Pricing表の追加system promptトークン数**（通常の入力・出力、個別のtool定義、tool_use/tool_result本文のトークンとは別。最低1 toolがある条件。toolsなし＋noneなら追加0）。列は `auto / none` と `any / tool`。

| モデル（公式表の名前） | auto / none | any / tool |
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

- 表の値はOverviewのPricing。Opus 5.5／Sonnet 5.5はany/tool欄がなく、Define toolsのForcing tool useが400 errorになることを確認しているため「非対応」とした。Haiku 5.5の406をこの2モデルにも拡張しない。
- manual extended thinkingではany/toolが非対応。adaptive thinkingを使うモデルでも個別のモデル制約が優先。表は全モデルの利用可能性、retirement、全推論設定での強制呼出し可否を保証しない。
- 取得時点に表が載せているモデルをすべて転記した。表にないモデルの値は推定しない。旧世代を含む追加トークン一覧であり、現役モデルの一覧ではない。

**B2 — 判定候補 confirmed（function tools・対応モデルの範囲に限定）。**

- Migrate §5はChat Completionsで `{type:"function", function:{name, description, parameters, ...}}`、Responsesで `{type:"function", name, description, parameters, ...}` と外側の構造が異なることを示す。parametersはJSON Schema。strictなどの追加fieldsもあり、提示した3fieldで全定義を尽くすという意味ではない。
- Chat API referenceはassistant messageの `tool_calls` 配列とchoiceの `finish_reason: "tool_calls"` を示す。戻す結果は `role: "tool"`、`tool_call_id`で呼出しと対応付ける。function argumentsはJSONで符号化された**文字列**。Anthropicのinputオブジェクトと混同しない。
- Function callingはResponsesの `function_call` output itemを `call_id`・`name`・JSON文字列の `arguments` で記述。結果は `function_call_output` input item、同じ `call_id`、`output`。通常のメッセージとは独立したitem。結果を返す際、履歴を渡す方式ではmodel output（推論itemを含む必要な状態）も維持する。
- Migrate冒頭は新規プロジェクトにResponsesを推奨、Chat Completionsも引き続きサポートとする。
- **現行の重要な適用範囲：** Function calling冒頭はGPT-6 AstraとGPT-6.1 Solのtool callingにはResponsesが必要と明記。Chat Completions例はGPT-5.6 Terraのreasoning無効設定。Chat API schemaが残っていることと、全モデルでtool callingできることは別。
- 現行ガイドはcustom tools等も記すので「OpenAIのtoolsはすべてtype:function」とせず、画面は「関数ツール」の例とする。
- SDKの扱いなど実装細部は今回の画面には不要。なお現在のmigration文書はResponsesでstrict未指定ならstrict化を試み、互換schemaにできないとbest-effortへfallback、Chatは既定non-strictと記す。古い解説のstrict既定を無条件に再利用しない。

### Screen-safe wording candidates

- B1: 「Claudeは道具の名前と引数を `tool_use` に書く。アプリが実行し、結果を `user` メッセージ内の `tool_result` で返す。自然に回答を終えると `end_turn`。検索などのserver toolsはAnthropic側で実行される。」画面内コードは上記fieldsを使用。追加トークンは別の補足表で取得日とモデルを添える。
- B2: 「OpenAIでは、アプリが関数呼出しを実行して結果を返す。Chat Completionsは `tool_calls → role:tool`、Responsesは `function_call → function_call_output`。新規開発にはResponsesが推奨される。」対応IDも図に示す場合はそれぞれtool_call_id／call_id。

### Unresolved points and boundaries

- 現行ドキュメントのページは固定版ではないため、この値を将来にも通用する定数としない。モデル別トークン追加数の全変更履歴は要求の中心ではなく追究しない。
- OpenAIの2023年初期function callingのfieldsと現行toolsとの世代差は、Unit 2のB4歴史説明で補う（発表日は既存検証を再引用）。現行スキーマを2023年当初のJSON例として表示しない。
- Claudeの「client toolsets」の現在仕様はS1の2024年初期3 toolsと別。S1で初期schema/sourceを調べ、当初の例へ現行toolset_nameなどを混ぜない。
- 全19項目のうちB1/B2の単位完了。先行報告本文は長く、冒頭全項目表およびA6/A7・不確実性等を読んだ。Claude Codeの具体的年表出典URLはUnit 5で既存reportの該当年表から再抽出すればよい。

### Next unit

Unit 2（B3–B4）：gpt-oss/HarmonyとLlama 3.1の公開形式、特殊トークン、next-token生成の説明、Toolformer/WebGPT書誌と既存発表日の再引用。ユーザーのcheckpoint閾値通知に従い、Unit 1を耐久記録したここでcompactionを要求する。まだready-to-reportではなく、report.mdは作成していない。

## Unit 2: B3–B4 — 公開会話形式・特殊トークン・next-token生成・公開日

### Sources consulted

すべて **2026-10-09 UTC取得**（終了付近の時計20:09 UTC）。Web本文・公式Developer Docs fetchで確認。コードは読むだけで、モデルのdownload・実行はしていない。

- [OpenAI: OpenAI harmony response format](https://developers.openai.com/cookbook/articles/openai-harmony) — 現行Cookbook、Special Tokens / Defining available tools / Receiving tool calls / Handling tool calls。公開版番号はない。Developer Docs fetchで全体と該当anchorを取得。
- [OpenAI: Verifying gpt-oss implementations](https://developers.openai.com/cookbook/articles/gpt-oss/verifying-implementations) — 公式検索から取得した補助資料。gpt-ossでHarmonyの会話・tool call・tool間の状態を保持することを確認。
- [OpenAI harmony format.md](https://github.com/openai/harmony/blob/main/docs/format.md)、[raw本文](https://raw.githubusercontent.com/openai/harmony/main/docs/format.md) — mainの取得時点。Cookbookと基本形式は一致するが、関数名をget_weather/get_current_weather/lookup_weatherと混在させた古い例がある。最終引用は名前の整合した現行Cookbookを使う。
- [OpenAI tiktoken: openai_public.py](https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py)、[raw本文](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken_ext/openai_public.py) — main、`o200k_harmony()`のspecial_tokens辞書（native web L114–142）。
- [OpenAI gpt-oss: torch/model.py](https://github.com/openai/gpt-oss/blob/main/gpt_oss/torch/model.py)、[raw本文](https://raw.githubusercontent.com/openai/gpt-oss/main/gpt_oss/torch/model.py) — main、TokenGenerator.generate（L421–447）。
- [OpenAI: Introducing gpt-oss](https://openai.com/index/introducing-gpt-oss/) — 発表日2025-08-05、gpt-oss-120b/20b公開。
- [Meta: Llama 3.1 Prompt Formats](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/prompt_format.md)、[raw本文](https://raw.githubusercontent.com/meta-llama/llama-models/main/models/llama3_1/prompt_format.md) — mainに保存されたLlama 3.1形式、Tokens / Builtin Tool Calling / JSON based tool calling。Llama一般の最新版形式として扱わない。
- [Meta: llama3/tokenizer.py](https://github.com/meta-llama/llama-models/blob/main/models/llama3/tokenizer.py)、[raw本文](https://raw.githubusercontent.com/meta-llama/llama-models/main/models/llama3/tokenizer.py) — main、特殊トークン一覧・ID割当・stop_tokens・allowed_special。
- [Meta: llama3/generation.py](https://github.com/meta-llama/llama-models/blob/main/models/llama3/generation.py)、[raw本文](https://raw.githubusercontent.com/meta-llama/llama-models/main/models/llama3/generation.py) — main、generate / chat_completion、共通生成loop。
- [Meta: Introducing Llama 3.1](https://ai.meta.com/blog/meta-llama-3-1/) — 発表日2024-07-23。
- [Toolformer, arXiv:2302.04761](https://arxiv.org/abs/2302.04761) — Submission history v1および著者表記。所属・従来の評価は先行報告A1を再利用。
- [WebGPT, arXiv:2112.09332](https://arxiv.org/abs/2112.09332) — Submission historyとabstract。取得時点の本文はv3（2022-06-01）だが、初稿はv1（2021-12-17）。
- ローカル `research/llm-facts/report.md` A1、T2（2026-10-09取得）。既存確認を再引用する発表：[OpenAI function calling](https://openai.com/index/function-calling-and-other-api-updates/)（2023-06-13）、[Anthropic tool use GA](https://www.anthropic.com/news/tool-use-ga)（2024-05-30）。この2日の再検証はしていない。

### Findings attributed to sources

**B3(a) — confirmed（gpt-ossの公開形式、関数ツールの標準例として）。**

- gpt-oss公開日は2025-08-05。Harmonyガイドは関数定義をdeveloper messageのTools節へ置き、TypeScriptに似た型表記の `namespace functions` に包むとする。APIから渡すJSON Schemaと、モデルに見せる文字列表現は同じ形ではない。Python/browserという学習済みbuilt-in toolsはsystem messageで定義する別扱い。
- 関数呼出しはassistant messageで `to=functions.NAME` を宛先にし、通常は `commentary` channel。宛先はrole側にもchannel側にも書ける。channel名・関数名・`to=`・`json`は通常の文字列であり、その全体がそれぞれ専用の1 tokenだという意味ではない。
- optionalな `<|constrain|>json` はheaderのcontent typeを示す。これだけで引数が必ずschema通りになるとは言えない。ガイドのStructured output節は、完全な準拠を保証するにはsampling時のgrammar制約が別途必要と説明する。
- `<|call|>`は「ツール呼出しへ引き渡すために推論を止める」stop token。tokenそのものがOSや外部APIを実行するのではなく、実行側が停止を認識して関数を呼ぶ。ガイドとtiktoken辞書は下記IDで一致した。

| 表記 | 単一の特殊token ID | 意味 |
|---|---:|---|
| `<|start|>` | 200006 | message開始 |
| `<|end|>` | 200007 | message終了（必ずしもassistant全体の終了ではない） |
| `<|message|>` | 200008 | headerと本文の境界 |
| `<|channel|>` | 200005 | header内のchannel指定 |
| `<|constrain|>` | 200003 | header内のcontent type指定 |
| `<|return|>` | 200002 | assistantのcompletion終了、sampling停止 |
| `<|call|>` | 200012 | toolへ制御を渡すためsampling停止 |

- 「`<|…|>`は1 token」は**このtokenizerの特殊tokenとして登録された表記を、制御tokenとしてエンコードした場合**に限る。任意の `<|好きな文字列|>` が1 tokenになるわけではないし、利用者の本文にその文字列を打つだけで必ず制御token化されるわけでもない。公開辞書に列挙されたtokenのIDを根拠にする。
- 返る結果は意味上tool roleで、直列化時のmessage先頭は文字列 `tool` ではなく `functions.NAME`。現行Cookbookの例は `to=assistant`、commentaryを付け、末尾を `<|end|>` にする。
- 現行Cookbookの **Receiving tool calls** のうちassistantの呼出し部分、および **Handling tool calls** の結果部分の短い逐語引用（前段のanalysis例は省いた）：

```text
<|start|>assistant<|channel|>commentary to=functions.get_current_weather <|constrain|>json<|message|>{"location":"San Francisco"}<|call|>
<|start|>functions.get_current_weather to=assistant<|channel|>commentary<|message|>{"sunny": true, "temperature": 20}<|end|>
```

- 上の2行は隣接する別messageである。画面は例であることを示し、閉じたClaude/GPTモデルの実際の内部入力をこの形式と断定しない。gpt-ossの公開仕様で説明できる。

**B3(b) — confirmed（Llama 3.1 Instructのツール利用形式）。**

- Meta発表日2024-07-23。公式3.1 prompt formatは `<|eom_id|>` をツール処理のため制御を渡せるmessage終端、`<|eot_id|>` をassistantがそのuser依頼への応答を終えたturn終端と説明。ツール使用時のeomの後にはexecutorから結果が戻り、生成が続く。
- `<|python_tag|>` はツール呼出しを示す特殊token。brave_search/wolfram_alphaなどにも付くので「Pythonコードの実行だけを示す」と説明しない。結果のroleは `ipython`（意味上tool）。MetaのJSON tool call例でもEnvironment: ipythonの条件でpython_tag/eomを使う。
- `<|eot_id|>` はuser/system/toolの入力message末尾にも用いられる。従って画面では「**assistantが出す**eotは応答の終了」とすると混乱がない。すべてのeotが会話全体終了を意味するわけではない。
- tokenizer.pyは3つを独立したspecial_tokens entriesとし、eom/eotをstop_tokensにも入れる。generation.pyは同じnext-token loopで両者を扱う。`allowed_special`の設定によって文字列を普通のテキストとして符号化することも明記されており、上記の「1 token」の条件を補強する。

**B3(c) — confirmed（生成機構を指す説明として。以下は公開コードと形式仕様からの推論）。**

- gpt-oss TokenGenerator.generateは既存token列をmodelに渡し、最後のlogitsからargmaxまたはsoftmax＋multinomialで次tokenを選び、同じloopでstop_tokensを判定している。
- Llamaのgenerateもforward→logits→top-p samplingまたはargmax→next_token→stop判定という共通loop。chat_completionもこのgenerateを使用する。通常の文章とtool callは別の分類器に分けて出力するのではなく、同じ語彙からの自己回帰生成として表現される、と説明できる。
- **安全な文言：**「ツールを呼ぶ指示も、文章と同じ次トークン生成で書かれる。実行するのは周りのプログラム。」これは「すべてがモデルの自由意思で決まり、アプリは関与しない」ことを意味しない。prompt、tool選択の強制・禁止、grammar/logits制約、許可判定など実行側の条件が生成・実行を制御できる。
- 当該モデルをtool-use向けに学習させている点も省略しすぎない。「追加の学習なしに普通の次token予測だけで道具が使える」という主張はしていない。

**B4 — confirmed。**

- Toolformer: *Toolformer: Language Models Can Teach Themselves to Use Tools*、Timo Schickほか、arXiv:2302.04761 **v1 2023-02-09 16:49:57 UTC**。著者・日付は書誌から、Meta AI Research中心という所属は既存A1を再利用。
- WebGPT: *WebGPT: Browser-assisted question-answering with human feedback*、Reiichiro Nakanoほか、arXiv:2112.09332 **v1 2021-12-17 05:43:43 UTC**。したがって「2021年12月」は正確。現行citationのyearが2022でも、初公開日が2022という意味ではない。
- OpenAI function calling **2023-06-13**、Anthropic tool use **GA 2024-05-30**は先行report A1とその公式URLを再引用。これらは研究の初出日ではなくAPI機能の発表／一般提供日。
- 2023年当初のOpenAI payload形状は本単位では再調査していない。Unit 1の現行 `tools` / `tool_calls` を「2023年6月当日の例」と表示する根拠にはしない。今回の歴史画面は日付を示し、コード画面は取得時点のAPIと明記すれば依頼範囲を満たす。

### Unresolved points and boundaries

- CookbookとGitHub mainで関数名の整合性などに差があるが、token IDや受け渡しの骨格は一致。資料間の例を混ぜず、上記の現行Cookbookの2行を使う。
- 現在のmainコードを公開当日そのままのcommitとは呼ばない。公開日と取得した仕様の版を分けた。公開当日から全fieldが不変だったかというcommit考古学は、この画面の説明には不要なので追究しない。
- 生の形式から閉じたモデル全体の内部形式を推測する話、およびtool実行許可・sandbox設計は今回のB3検証範囲外。元の問いは変わっていないためplan revisionは不要。
- 取得できなかった仮パス `models/llama3/api/tokenizer.py`、`models/llama3/reference_impl/generation.py` は根拠に使わず、公式repositoryに実在する上記の現行パスへ訂正して確認した。

### Next unit

**Unit 3（R1–R2）**：RAG原論文・NeurIPS書誌・DPR/REALM一次資料で初稿日、所属、Wikipedia date、100-word/約21M passages、BART-large、top-k、命名と「最初」の留保を確認する。ユーザーのcheckpoint閾値通知に従い、Unit 2を完全に追記したこの時点でcompactionを要求する。残りはInitial planのUnit 3〜11。まだready-to-reportではなく、report.mdは作成しない。

## Unit 3: R1–R2 — RAGの原論文・数値・命名と先行研究

### Sources consulted

すべて **2026-10-09 UTC取得**（単位開始時20:11:46 UTC）。native webで本文またはPDFを取得した。

- [RAG arXiv書誌](https://arxiv.org/abs/2005.11401) — v1の投稿履歴、採録情報。
- [RAG v1 PDF](https://arxiv.org/pdf/2005.11401v1) — 2020-05-22版。表紙、§1、§2.2–2.4、§3、§4.7を確認。
- [RAG v4 HTML](https://arxiv.org/html/2005.11401v4) — 2021-04-12版。§2–3でv1の構成・数値と照合。以下の報告では初稿を優先する。
- [NeurIPS 2020公式書誌](https://proceedings.nips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html) — Advances in Neural Information Processing Systems 33、著者一覧。
- [DPR arXiv書誌](https://arxiv.org/abs/2004.04906)、[ACL/EMNLP 2020書誌](https://aclanthology.org/2020.emnlp-main.550/)、[DPR論文PDF](https://aclanthology.org/2020.emnlp-main.550.pdf) — §3、§4.1。Wikipediaの正確な日とpassage数。
- [REALM arXiv書誌](https://arxiv.org/abs/2002.08909)、[ICML 2020/PMLR書誌とabstract](https://proceedings.mlr.press/v119/guu20a.html) — 初稿日と方式。
- [ORQA arXiv書誌](https://arxiv.org/abs/1906.00300) — 初稿日・著者・abstract。
- [NVIDIA: What Is Retrieval-Augmented Generation, aka RAG?](https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/) — Patrick Lewis本人へのインタビュー、How It Got Named ‘RAG’。表示更新日2025-01-31、編集注記の初公開日2023-11-15。命名に関する本人証言を一次資料として利用し、この記事の一般的技術解説を原論文の代わりにはしない。
- 命名の補強検索では二次記事・転載も返ったが根拠には採用していない。NVIDIAの公式URLで本人の発言を確認できた。

### Findings attributed to sources

**R1 — confirmed。**

- arXivのv1は **2020-05-22 21:34:34 UTC**。NeurIPS公式書誌は**NeurIPS 2020（vol.33）**を確認する。初稿表紙の所属は **Facebook AI Research／University College London／New York University**。2020年当時の所属を「Meta AI」とだけ書くより、当時の名前を使う。
- 原論文§1は方法をretrieval-augmented generation（RAG）と名づけている。NVIDIAの本人インタビューでも、Lewisは論文執筆時の名前の選択を振り返っている。したがって「**Lewisらが2020年の論文でRAGという名を導入した**」は使える。「検索を使う言語モデルを初めて発明した」へ拡張しない。
- RAG v1 §2.2–2.4：DPRは質問と文書を別々のBERT-baseで符号化するbi-encoderで、内積による検索（MIPS）を行う。生成器は **BART-large、論文表記で400M parameters（約4億）**。微調整するのはquery encoderと生成器で、document encoderとindexは固定。
- v1 §3では学習時の候補 **k∈{5,10}**、評価時kはvalidation dataで決める。常にk=5または常にk=10という仕様ではない。v4も同じ範囲。検索文書ごとに生成確率を求め、潜在文書を周辺化するRAG-Sequence／RAG-Tokenの2方式を評価している。現在よく見る「全検索断片を一つのpromptへまとめる方式」だけで原論文を描くと不正確。
- DPR §4.1で検索元は **英語Wikipedia 2018-12-20 dump**、記事本文を重ならない **100-word** 単位へ分割し、**21,015,324 passages（約2,100万）**。各passageには記事題名と区切りも付く。100はtoken数や文字数ではない。表・infobox・list・曖昧さ回避page等の除去も記載される。
- RAG v1 §3も正確なpassage数21,015,324を記載し、§4.7に通常のindexの日付2018-12-20を明記。v4 §3は21Mと丸める。したがって数値差ではなく表示精度の違い。文書数はWikipediaの記事数ではなく分割後の検索単位数。

**R2 — corrected（「最初」を否定し、先行例を明示）。**

- **REALM（Guuら）v1は2020-02-10 18:40:59 UTC**。ICML 2020掲載。潜在的なknowledge retrieverをmasked language modelingの目的で事前学習し、文書検索を事前学習・微調整・推論に使う。RAGより前のretrieval-augmented language modelとして十分な反例。
- **ORQA（Lee・Chang・Toutanova）v1は2019-06-01**、ACL 2019。質問と回答の組からretrieverとreaderを共同学習し、retrieverをInverse Cloze Taskで事前学習する。検索を潜在変数として扱う点も先行する。
- RAG論文自身の§1もREALM／ORQAを先行例として挙げ、検索を使う抽出的QAから事前学習済みseq2seq生成器を使う一般的な生成課題へ広げる位置づけを述べる。REALM／ORQAを現在のchatbot型生成モデルと同一視しない。

### Screen-safe wording candidates

- R1: 「2020年、LewisらがRAGを提案。約2,100万のWikipedia断片をDPRで検索し、BART-largeで生成した。」数値の札は「2018-12-20版／100語ずつ／21,015,324断片」。補足で学習時k=5または10、評価時は調整と記す。
- R2: 「検索と言語モデルを組み合わせる研究はRAG以前からある。REALM（2020年2月）などを経て、RAG（同年5月）は検索と文章生成を組み合わせる方法に名を与えた。」さらに短くする場合は「RAGが検索活用の始まりではない」。

### Unresolved points and boundaries

- 「世界で最初の検索拡張言語モデル」を特定する網羅的な歴史調査はしない。今回の問いはRAGを最初と呼べるかであり、明確な先行例で否定できる。現段階で新たな必須調査単位は不要。
- RAGという略称の命名は原論文と著者本人の回想で裏付けたが、検索・生成という考え方全体の優先権を意味しない。
- 正確なdump日・passage数はv1とDPR本文が一致。原論文のBART-largeの400Mは概数なので、画面で不必要に厳密なパラメータ総数へ置き換えない。
- 現代の広義RAGとmodel-called search toolsの関係、API初公開日は予定通り次のUnit 4で扱う。R1/R2の単位は完了。

### Next unit

**Unit 4（R3）**：現代の広義RAG、Anthropic API web searchとOpenAI API web/file/retrievalの最初の公式提供日。chat製品・API、preview/beta/GAを分ける。ユーザーのcheckpoint閾値通知に従い、このUnit 3を完全に追記した時点でcompactionを要求し、今回は次の単位へ進まない。残りはInitial planのUnit 4〜11。まだready-to-reportではなく、report.mdは作成しない。

## Unit 4: R3 — 広義のRAGと検索ツールのAPI公開史

### Sources consulted

すべて **2026-10-09 UTC取得**（開始時20:13:55 UTC）。native webで公式本文を取得。現行APIガイドは固定版番号のない取得時点のページであり、tool typeの版は別途記した。

- [Anthropic: Introducing Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval) — 2024-09-19、冒頭とA primer on RAG。
- [Anthropic: Introducing web search on the Anthropic API](https://www.anthropic.com/news/web-search-api) — 2025-05-07。現在は [Claude記事](https://claude.com/resources/articles/web-search-api)へredirect。元の発表日を表示し、2025-09-10のweb fetch追記もある。
- [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) — 2025-05-07、2026-02-17の項目を確認。
- [Anthropic: Claude can now search the web](https://www.anthropic.com/news/web-search) — 2025-03-20、現在は [Claude記事](https://claude.com/resources/articles/web-search)へredirect。Getting startedで当初のfeature preview条件を確認。
- [Claude Platform: Web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) — 現行版。tool version一覧、server_tool_use、response、server/client混在時の扱い。
- [OpenAI: New models and developer products announced at DevDay](https://openai.com/index/new-models-and-developer-products-announced-at-devday/) — 2023-11-06、Assistants API, Retrieval, and Code Interpreter節。
- [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) — 2024-04-17、2025-03-11等。2024-04-17の旧whats-newリンクは現行 [Assistants migration guide](https://developers.openai.com/api/docs/assistants/migration)にredirectされ、当時の本文が残っていないため、日付・file search導入はchangelogを根拠にする。
- [OpenAI: New tools for building agents](https://openai.com/index/new-tools-for-building-agents/) — 2025-03-11、Responses / Web search / File search節。
- [OpenAI API: Web search](https://developers.openai.com/api/docs/guides/tools-web-search) — 現行版。初期web_search_previewと現在のweb_search、新規統合の推奨、model decisionの扱い。
- [OpenAI API: File search](https://developers.openai.com/api/docs/guides/tools-file-search) — 現行版。semantic＋keyword search、hosted tool、vector stores。

### Findings attributed to sources

**R3 — confirmed（広い用法と検索tool化は正しい。初公開日は検索対象・API世代別に記す）。**

- AnthropicのContextual Retrieval記事は、RAGを知識ベースから関連情報を検索しuser promptへ追加する方法として説明する。現在の実務で、原論文固有のDPR＋BARTや文書の周辺化を必須とせず、**検索した資料を生成時の入力へ加える方式の総称**として使われることを裏付ける。
- 「テキストを検索してpromptに入れる**あらゆる**システム」は広すぎる表現。検索情報を言語モデルの生成へ利用する条件を残す。検索のみのシステム、単なる静的指示ファイル、全資料をそのまま渡すlong contextと一括しない。Contextual Retrieval記事自身も知識ベース全体をpromptへ入れる方法をRAGとは区別する。
- モデルが検索をtoolとして選ぶことと、検索資料で生成を補強するRAGは対立する分類ではない。モデルが検索を繰り返し、返った情報を回答へ使う構成は両方に該当し得る。これは両社のtool仕様と上の定義を組み合わせた整理であり、厳密な学術上の統一定義を主張しない。

| 対象 | 初公式提供・発表日 | 当時の区分と確認範囲 |
|---|---|---|
| OpenAI Assistants APIのRetrieval（利用者の文書） | **2023-11-06** | DevDay発表。Assistants APIは**beta**、当日から全developerに提供。文書のembedding・分割・検索をOpenAI側で処理する機能。Web検索ではない。 |
| OpenAI Assistants APIのfile search | **2024-04-17** | API changelogに新file search toolの導入を明記。1 assistantあたり最大10,000 files。ここをResponses初公開と混同しない。今回取得できた当該changelogは更新を記すが、file search単独のGA宣言はしていない。 |
| OpenAI Responses APIのWeb検索 | **2025-03-11** | 全developer向け**preview**。typeは当初 `web_search_preview`。同日Chat Completionsに `gpt-4o-search-preview` / `gpt-4o-mini-search-preview`も公開。 |
| OpenAI Responses APIのfile search | **2025-03-11** | Responsesでの提供開始。発表はimproved file searchと説明。OpenAIの文書検索そのものの初登場ではない。Web検索のpreview表記をfile searchへ一律に移さない。 |
| Anthropic Messages APIのWeb検索 | **2025-05-07** | 公式発表とAPI release notesが一致。当初はClaude 3.7 Sonnet、更新版3.5 Sonnet、3.5 Haiku。発表本文はavailable/introducingとし、API機能をbeta/GAのいずれとも明示していないため、画面は**提供開始**とする。 |

**現行仕様との区別：**

- Anthropic現行ガイドの基本版は `web_search_20250305`。この末尾日付は**tool schemaの版名であり、API公開日2025-05-07とは異なる**。現行版一覧にはdynamic filteringを加える `web_search_20260209`、response inclusion制御を加える `web_search_20260318`もある。単純な検索の図には基本版を使える。
- Claudeが検索を選ぶと `server_tool_use`（name: web_search、input.query）、結果は `web_search_tool_result`。検索はAnthropic側で実行する。これはB1のアプリ実行 `tool_use → user/tool_result` と異なる。client toolと同時に呼ぶ場合やpause_turn等の続行条件はUnit 1参照。
- OpenAI現行ガイドは新規Responses統合に `type: "web_search"` を推奨。初期の `web_search_preview` はlegacy向けに残るが、filters等の新機能に非対応。Chatの初期search-previewモデルは2026-07-23 shutdownと現行ガイドに明記されるので、2025年当初のモデル名を現行推奨に使わない。
- OpenAI現行file searchは `file_search`、対象は事前にuploadしてvector storeへ入れたファイル、semantic＋keyword検索を行う。モデルが利用を選び、OpenAIが実行するhosted tool。自作retrieverをfunction toolとして渡す構成も可能だが、ここでは公式組込みtoolの公開日を調べた。
- Anthropicの**2025-03-20**はClaude製品のWeb検索（当初US有料プランのfeature preview）であり、APIの2025-05-07と別。製品版の2025-05-27全プラン世界展開とも区別する。

### Screen-safe wording candidates

- 「いまは、検索した資料をモデルへの入力に加えて答えを作る方式を、広くRAGと呼ぶ。検索をモデルが呼ぶ『道具』として渡すこともできる。」
- 年表にWeb検索だけを載せる場合：「OpenAI API：2025-03-11（preview）／Anthropic API：2025-05-07（提供開始）」。
- 文書検索も載せる場合：「OpenAI Assistants Retrieval：2023-11-06（beta）→ file search：2024-04-17 → Responses file search：2025-03-11」。

### Unresolved points and boundaries

- 正式なGA日を画面に要求しない限り、初公開をGAへ言い換えない。Anthropic release notesの2026-02-17現行本文はweb search等を「no beta header required」と記すが、「この日まで全web searchがbetaだった」と遡及する根拠にならない。検索結果には古いcrawlの「now generally available」文言もあったため、現在のcanonical本文を優先し、5月の初提供をGAと断定しない。
- OpenAIのweb_search正式版へ移った厳密なGA日も、取得した資料からは確定していない。依頼された初公開日と現行typeは確認できたので、GA日の追加考古学は不要。GAを年表に載せる必要が生じた場合の追加調査として保留する。
- 「両社の最初の検索」は、モデルが呼ぶ**公式組込み検索tool**を対象とする。以前から作れた自作検索関数、embeddings API、旧汎用検索endpoint、ChatGPT/Claude製品や研究デモの最初まで含めた主張ではない。
- 元の問いは変わらず、Initial plan Unit 4内でAPI世代の区別を解決した。必須単位の追加・削除はない。report.mdはまだ作成しない。

### Next unit

**Unit 5（S1–S4）**：Anthropic 2024-10-22 computer-use beta初期3 tool typeとpersistent bashの公式schema/reference implementation、Claude Code既存年表の再引用、Codex CLI/Gemini CLIの公式発表日。ユーザーのcheckpoint閾値通知に従い、Unit 4を完全に追記したここでcompactionを要求する。残りはInitial plan Unit 5〜11。まだready-to-reportではない。

## Unit 5: S1–S4 — 初期computer-useの3 toolsとterminal agent公開史

### Sources consulted

すべて **2026-10-09 UTC取得**（単位開始時20:16 UTC）。発表と現行文書はnative web、OpenAI changelogは公式Developer Docs検索・fetchでも確認。歴史的コードはGitHub APIで日付を固定したcommitを選び、raw sourceを読み取り専用で取得した。インストール・コード実行はしていない。

- [Anthropic: Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku](https://www.anthropic.com/news/3-5-models-and-computer-use) — 2024-10-22、冒頭のpublic betaとAPI提供。
- [Anthropic quickstarts — 2024-10-22のcommit](https://github.com/anthropics/anthropic-quickstarts/commit/4acbe40937e0962a55fc77ca74552b5d7064c680) — commit timestamp 2024-10-22T22:59:29Z。同日の最後のcomputer-use-demo変更をGitHub APIのpath＋until＋per_page=1で取得。
- 同commitの [bash.py](https://github.com/anthropics/anthropic-quickstarts/blob/4acbe40937e0962a55fc77ca74552b5d7064c680/computer-use-demo/computer_use_demo/tools/bash.py)、[edit.py](https://github.com/anthropics/anthropic-quickstarts/blob/4acbe40937e0962a55fc77ca74552b5d7064c680/computer-use-demo/computer_use_demo/tools/edit.py)、[computer.py](https://github.com/anthropics/anthropic-quickstarts/blob/4acbe40937e0962a55fc77ca74552b5d7064c680/computer-use-demo/computer_use_demo/tools/computer.py)、[loop.py](https://github.com/anthropics/anthropic-quickstarts/blob/4acbe40937e0962a55fc77ca74552b5d7064c680/computer-use-demo/computer_use_demo/loop.py) — raw.githubusercontent.comの同じcommit/pathで本文を取得。
- [Claude Platform: Bash tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/bash-tool) — 現行版、How it works / Tool versions / Implement the bash tool。
- [Claude Platform: Text editor tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/text-editor-tool) — 現行版、Use the text editor tool / Change log。
- [Claude Platform: Computer use tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool) — 現行版、Migrate from computer_20251124 / Earlier tool versions。モデル・プラットフォーム条件は取得時点の記載。
- [quickstarts mainのbash.py](https://raw.githubusercontent.com/anthropics/anthropic-quickstarts/main/computer-use-demo/computer_use_demo/tools/bash.py) — 初期実装を探す入口として閲覧。歴史的判定は上記の固定commitを採用。
- ローカル `research/llm-facts/report.md` H7年表（194–196行）：Claude Codeの既存検証を再引用。出典は [Claude 3.7 Sonnet発表](https://www.anthropic.com/news/claude-3-7-sonnet) と [Claude 4発表](https://www.anthropic.com/news/claude-4)。依頼どおり再調査はしていない。
- [OpenAI: Introducing OpenAI o3 and o4-mini](https://openai.com/index/introducing-o3-and-o4-mini/) — 2025-04-16、Codex CLI: frontier reasoning in the terminal節。
- [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) — 2025-04-16のCodex CLI公開を確認。現行ページ、固定版番号なし。
- [Google: Gemini CLI: your open-source AI agent](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-cli-open-source-ai-agent/) — 2025-06-25、本文とNow in preview、Apache 2.0表記。

### Findings attributed to sources

**S1 — confirmed（3つはtoolのtype名。実行はアプリ側）。**

- Anthropicの発表日は **2024-10-22**、区分は **public beta**。同日からAnthropic API、Amazon Bedrock、Google Cloud Vertex AIで利用できると発表。
- 同日commitのloop.pyはComputerTool／BashTool／EditToolの3つを登録し、beta flagは `computer-use-2024-10-22`。各定義の `type` と `name` は次のとおり。

| 用途 | 2024-10-22のtype | 呼出しname |
|---|---|---|
| 画面・マウス・キーボード | `computer_20241022` | `computer` |
| ファイル編集 | `text_editor_20241022` | `str_replace_editor` |
| シェル | `bash_20241022` | `bash` |

- 初期bash.pyは最初の呼出しで `_BashSession` と `/bin/bash` processを作り、以後は同じprocessのstdinへcommandを書き込む。restart指定時はsessionを作り直す。stdout/stderrをdecodeしてCLIResultへ入れ、loop.pyが通常出力をtext contentとして、エラーを文字列とis_errorでtool_resultへ返す。従って「持続的なシェルでcommandを実行し、出力をテキストでモデルへ返す」は初期実装でも裏付けられる。シェルの状態は実装側のprocess寿命に従い、APIが永続的に保存してくれるという意味ではない。
- 現行Bash tool文書もclient toolであり、アプリが1つのbash processを保ち、作業ディレクトリ・環境変数等を呼出し間で維持すると明記する。現行版は **`bash_20250124`、beta header不要**。初期 `bash_20241022` は2024年10月版Sonnet 3.5用で同モデルはretiredと記載。現行サンプルに初期typeをそのまま使わない。
- 現行editorガイドの例は **`text_editor_20250728` / `str_replace_based_edit_tool`**。Change logも2024-10-22の初版を記録する。2025年版のnameを初期例に混ぜない。
- 現行computer useはClaude APIとGoogle Cloudでは **`computer_toolset_20260801`** を案内し、従来の `computer_20251124` / `computer_20250124` は対応モデル・プラットフォームに応じてbetaで残る。新toolsetでは個別actionがnameとなり、tool_useに `toolset_name: "computer"` が加わる。2024年の3 toolsの説明へこの現行形式を遡及しない。互換性表の全転記は本問に不要で、S5で観測・actionの仕組みを扱う。

**S2 — confirmed（先行報告の再引用）。**

- Claude Code **2025-02-24：限定研究プレビュー**（Claude 3.7 Sonnet発表）。**2025-05-22：GA／一般提供開始**（Claude 4発表）。この2日は先行report H7の確認済み結果であり、今回重複調査しない。

**S3 — confirmed。**

- Codex CLIは **2025-04-16**、o3／o4-miniと同じ発表で公開。発表はterminalから実行し、利用者のcomputer上で働く軽量なcoding agentと記し、その日から完全にopen sourceとする。API changelogも同日のCLI公開を記録。
- その節の区分は **new experiment**。GAと書かず「オープンソースで公開」とする。2025-05-16のクラウド版Codex研究プレビュー、2021年のCodexモデルとは別の出来事。
- 「ローカル」はCLIとファイル操作が手元で動くこと。モデル推論も必ずローカルという意味にしない。発表はAPIモデルの利用を説明している。

**S4 — confirmed（当初previewを補足）。**

- Gemini CLIはGoogle公式記事の **2025-06-25**。terminalへGeminiをつなぐopen-source AI agentとして発表し、本文は **Now in preview**、ライセンスは **Apache 2.0** と明記。
- Codingに強みがあるが、content generation、問題解決、research、task management等にも使うutilityとして紹介する。画面は「端末で使うオープンソースAIエージェントをpreview公開」とすればよい。無料枠・当時のモデル名は今回の公開史の要点ではなく、現行条件にも転用しない。

### Screen-safe wording candidates

- S1: 「2024-10-22、Anthropicがcomputer useをpublic betaで公開。画面操作・ファイル編集・bashの3つの道具を用意した。bashはアプリ側で同じシェルを保ち、実行結果を文字で返す。」type名を表示するなら上の初期表を使用。
- S2: 「Claude Code：2025-02-24 限定研究プレビュー → 2025-05-22 一般提供」。
- S3: 「Codex CLI：2025-04-16、端末で使うcoding agentをオープンソースで公開」。
- S4: 「Gemini CLI：2025-06-25、端末で使うAIエージェントをオープンソースでpreview公開」。

### Unresolved points and boundaries

- mainのbash.pyには `BashTool20241022` というclass名に対しapi_typeが20250124という記載があり、歴史的schemaの根拠には不適切だった。公開当日の固定commitで3 typeと実装を確認して解決した。repositoryへの修正やissue作成は範囲外。
- 現行editor changelogの2025-04-29行は「Claude 4向け」と書くが、Claude 4発表日と同一ではない。typeの版名やchangelog日をモデル公開日に読み替えない。
- computer toolsetの全migration仕様や新しいaction群の歴史は依頼の範囲外。初期と現行の差を説明するのに必要な型・nameの差だけ記録した。
- 必須の追加単位は生じておらず、元の問いとInitial planを維持。S1–S4の単位は完了。report.mdはまだ作成しない。

### Next unit

**Unit 6（S5）**：Anthropicのpixel-counting／screenshot→action、OSWorld原論文のtask数とhuman成績、Claude 3.5 Sonnet更新版14.9%／7.8%／22.0%のstep条件、Operator/CUA launch時のOSWorld・WebArena・WebVoyagerを確認。ユーザーのcheckpoint閾値通知に従い、Unit 5を完全に追記したここでcompactionを要求する。残りはInitial plan Unit 6〜11。まだready-to-reportではない。

## Unit 6: S5 — computer useの入出力とlaunch時ベンチマークの条件

### Sources consulted

すべて **2026-10-09 UTC取得**（終了前時計20:19:03 UTC）。native webで公式記事・論文・PDFを取得。初期実装のraw sourceのみweb取得がcache missとなったため、curl（20秒・100KB上限）で読み取り取得した。コード実行・モデル評価はしていない。

- [Anthropic: Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku](https://www.anthropic.com/news/3-5-models-and-computer-use) — 2024-10-22、Teaching Claude to navigate computers節。
- [Anthropic: Developing a computer use model](https://www.anthropic.com/research/developing-computer-use) — 2024-10-22、The research process / The future of computer use。
- [Anthropic: Model Card October Addendum](https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf) — 2024年10月版、PDF p.2、§2.1とTable 1。本文抽出・screenshot取得。
- [Xie et al.: OSWorld, arXiv:2404.07972](https://arxiv.org/abs/2404.07972) — 書誌、v1/v2日付。[v2本文](https://arxiv.org/html/2404.07972v2) — §3、§3.4 Human Performance、§4.1、Table 5。
- [Anthropic quickstarts computer.py（2024-10-22固定commit）](https://github.com/anthropics/anthropic-quickstarts/blob/4acbe40937e0962a55fc77ca74552b5d7064c680/computer-use-demo/computer_use_demo/tools/computer.py) — Unit 5と同じcommit、Action一覧・__call__・screenshot・scale_coordinates。raw.githubusercontent.comの同一pathから本文取得。
- [OpenAI: Computer-Using Agent](https://openai.com/index/computer-using-agent/) — 2025-01-23、How it works / Evaluations。歴史的数値は先行report A7で確認済みのOperator公開日・仕組みを前提に、今回追加でlaunch scoresと条件を調べた。
- [OpenAI: CUA eval extra information](https://cdn.openai.com/cua/CUA_eval_extra_information.pdf) — January 2025、§1–4、特にp.6 Sampling / Scoring。本文抽出・screenshot取得。
- [OpenAI: Operator System Card](https://openai.com/index/operator-system-card/) — 2025-01-23公開、現行本文には2025-03-11 API Availability追記がある。この追記は1月の提供条件として使わない。

### Findings attributed to sources

**S5 — 判定候補 corrected（主要な数値・仕組みは確認。比較条件と初期action形式を補正）。**

**仕組みとpixel counting：**

- Anthropicの研究記事は、Claudeへ画面のscreenshotを渡し、縦横のpixel数を見積もってcursorを目的位置へ動かすよう訓練したと説明する。入力は連続動画ではなく、離散的な画面画像であり、短時間だけ出る通知等を見逃すことがあるとも記す。「画面を見る→操作を出す→実行後の画面を見る」という図は妥当。
- 固定commitのcomputer.pyはmouse_move、left_click、各種click、type、key等を実装する。ただし**初期computer_20241022のleft_clickはcoordinateを受け取らない**。当時の正確な例は `mouse_move` に `coordinate:[x,y]` を与え、その後 `left_click`。coordinateを受けるのはmouse_moveとleft_click_dragで、clickは現在のcursor位置で実行する。一般説明の「pixel座標で移動してclick」はよいが、2024年のAPI JSON例を「left_click＋coordinate」にしない。
- 初期reference implementationは画面を縮小する場合の座標変換も行う。座標はモデルへ見せる画面寸法との対応が必要。モデルがactionを生成し、アプリのtool実装がxdotool等へ変換して実行、screenshotを返す。モデル自身が直接OSを動かすという説明は避ける。
- OpenAI CUA記事もscreenshotをcontextへ追加し、mouse・keyboard操作を繰り返すloopを説明する。個別サイト用のDOM操作APIを前提とするbrowser agentと区別できる。

**OSWorldの原論文：**

- 初稿は **2024-04-11**（Xie et al., arXiv:2404.07972v1）。本文確認はv2（2024-05-30）。原benchmarkは **369課題（Ubuntu）**。環境自体のWindows/macOS対応と、この369課題の実験対象を混同しない。論文は別途Windows 43課題も記す。
- 人間の成功率は **72.36%**（約72%、小数1桁なら72.4%）。§3.4では基本的なソフト利用技能のあるcomputer science専攻学生が実施し、対象のsamples/softwareには未接触と説明する。すべての人間の普遍的な成功率でも、モデルと同じ15操作制限での成績でもない。
- 元論文にはaccessibility tree、screenshot、両者の組合せ、Set-of-Markなど複数の入力条件があり、最高12.24%というabstractの値をscreenshot-onlyの次点7.8%の代わりに使わない。

**2024-10-22のClaude 3.5 Sonnet更新版：**

| 値 | 一次資料と適用条件 |
|---|---|
| **14.9%** | Anthropic発表・Model Card Table 1。OSWorld、screenshot-only、**最大15 steps**。 |
| **22.0%** | 同Model Card。screenshot-only、**最大50 stepsに増やし、promptも最適化**。操作回数だけの単独効果を測った比較とは書かない。 |
| **7.8%** | Anthropic発表記事が当時のscreenshot-only categoryのnext-best systemとして報告。 |
| **7.7%** | 同日のDeveloping a computer use model記事にあるnext-best値。7.8%と一次資料内で不一致。 |
| **72.36%** | Model CardがOSWorld原論文から引用した人間の成績。 |

- 最終レポートでは7.8%を「**Anthropic発表による当時の次点**」と出典付きで載せるか、画面を「当時の次点は約8%」にする。7.8%がどの具体的なモデル・runだったかはこの資料では確定しない。原論文v2のscreenshot-only最大値（5.80%）も時点・model setが異なり、直接の裏付けではない。7.7/7.8差を根拠なしに丸め誤差と断定しない。

**2025-01-23のOperator / CUA launch：**

| benchmark | CUA成功率 | launch資料に基づく条件 |
|---|---:|---|
| OSWorld | **38.1%** | Ubuntu VM、画面画像＋mouse/keyboard。 |
| WebArena | **58.1%** | Operator browser、サイトごとの補助promptあり。 |
| WebVoyager | **87.0%** | Operator browser、質問をそのままpromptへ渡す。GPT-4oで自動採点。 |

- 1月の区分は **Operatorのresearch preview**、当初米国Pro向け。これらは中核モデルCUAのbenchmark成績であり、利用者の全実作業でOperatorが同率で成功するという意味ではない。
- 評価補足資料は**全結果pass@1、temperature 0.6、特記なければ最大200 steps**とする。OSWorldでは配布VMのdockを右へ移しており、少し成績が上がったと明記。Claudeの15/50 stepsと条件を揃えたランキングではない。
- WebVoyagerは壊れた35課題を除外した。live websitesと除外集合が時期で変わるため、異なる発表の数値が直接比較できるとは限らないと補足資料自身が注意する。
- Operator System Cardの2025-03-11追記はAPIの `computer-use-preview` をresearch previewとして述べる。1月のOperator製品公開と3月のAPI公開は別（先行report A7と整合）。

### Screen-safe wording candidates

- 「画面の画像を読み、座標への移動・クリック・文字入力を道具に指示する。実行後の画像を見て次の操作を決める。」pixel countingは「Anthropicは、正確に操作するためpixelの位置を数える訓練が重要だったと説明した」。
- 「OSWorld：369課題。Claude 3.5 Sonnet更新版は14.9%（画像のみ・15操作まで）。50操作とprompt最適化で22.0%。人間は72.36%。」
- 「CUA公開時（2025-01-23）：OSWorld 38.1%、WebArena 58.1%、WebVoyager 87.0%。pass@1、原則200操作まで。」画面に三つを載せる場合、WebVoyagerの35課題除外を脚注、他モデルとの条件差はREADMEへ残す。

### Unresolved points and boundaries

- 次点7.7/7.8%の差の原因と具体的runの同定は未解決。依頼の値自体は発表記事で確認済みであり、出典限定か約8%で正確に伝えられるため、全leaderboard履歴の復元は必須にしない。
- **派生質問（保留）：** 条件を揃えてClaude 3.5とCUAの能力差を比較できるか。新たな再評価・再現は元のfact-checkの範囲外。必要になった場合はstep budget、prompt、task snapshot、採点方法を固定する追加調査として推奨する。今回は数値の条件を併記することで解決する。
- 2026年の現行computer toolsetへの変化はUnit 5で記録済み。S5ではlaunch時の仕組みと数値を確認した。元の問いとInitial planは維持、追加必須単位はない。report.mdはまだ作成しない。

### Next unit

**Unit 7（M1–M2）**：MCPの2024-11-05版と取得時点の最新仕様、JSON-RPC・initialize・tools・fields・transportの差、Streamable HTTP導入版、AAIF寄贈の日付とAGENTS.md/gooseを一次資料で確認。ユーザーのcheckpoint閾値通知に従い、このUnit 6の完全な追記後にcompactionを要求する。残りはInitial plan Unit 7〜11。まだready-to-reportではない。

## Plan revision 1: MCPの現行版で初期化方式が変わっている

- Unit 7で、公式Versioningページが**2026-07-28をCurrent**と明示し、同版で`initialize`往復を廃止したことが判明した。M1は「初期仕様も現行仕様もinitializeで開始」とは確認できず、版別の訂正が必要。
- **派生質問（今追う）：** 現行版の画面用wire例を作るには何を足す必要があるか。M1の現行仕様確認に不可欠なので、Unit 7の中を「2024年のwire」「2025年transport移行」「2026年のstateless化と追加fields」「AAIF統治」に分け、現行schemaとversioning/transport本文の確認を追加した。独立した追加番号は作らず、Unit 7内で完了させる。
- **派生質問（保留）：** 実際の各MCP製品・SDKがどの版を採用しているか。仕様のCurrentと個々の実装の対応状況は別であり、相互運用テストや全面migrationガイドは依頼の範囲外。実装へ進む場合の次の行動として残す。
- 元の問い（19項目のfact-check）は変わらない。現在の残単位：Unit 7（上の拡張を含む）、8（H1 harness/scaffold）、9（H2–H4 session/context/memory）、10（H5 subagents）、11（全ID最終照合）。

## Unit 7: M1–M2 — MCPの初期wire・現行stateless仕様・AAIF寄贈

### Sources consulted

すべて **2026-10-09 UTC取得**（開始20:20:10、終了前20:21:19 UTC）。native webで公式仕様・発表・schemaを閲覧。現行schemaの対象interfaceのoptional性は、raw本文をPython標準urllibで読み取り取得し、コメントを除いても確認した（20秒timeout、400KB読取上限、ファイル保存・ライブラリ導入なし）。

- [MCP Versioning](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning) — `/specification/versioning`のredirect先。Current版を確認。
- **2024-11-05**公式仕様：[Specification](https://modelcontextprotocol.io/specification/2024-11-05)、[Lifecycle](https://modelcontextprotocol.io/specification/2024-11-05/basic/lifecycle)、[Transports](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports)、[Tools](https://modelcontextprotocol.io/specification/2024-11-05/server/tools)、[schema.ts](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/schema/2024-11-05/schema.ts)。schemaはmain中の版別directory、Tool/CallToolRequest/CallToolResultを確認。
- **2025-03-26**：[Key Changes](https://modelcontextprotocol.io/specification/2025-03-26/changelog)、[Transportsの公式repository本文](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-03-26/basic/transports.mdx)。Streamable HTTP導入版。
- **2025-06-18**：[Key Changes](https://modelcontextprotocol.io/specification/2025-06-18/changelog)。structured tool output、title、resource links追加。
- **2026-07-28**公式仕様：[Specification](https://modelcontextprotocol.io/specification/2026-07-28)、[Key Changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog)、[Versioning and Compatibility](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)（同版`basic/lifecycle`のredirect先）、[Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)、[Transports overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)、[Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)、[schema.ts](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/schema/2026-07-28/schema.ts)。RequestParams/RequestMetaObject/Tool/BaseMetadata/CallToolRequestParams/CallToolResultを確認。
- [MCP Blog: The 2026-07-28 Specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/) — 2026-07-28公開、maintainers David Soria Parra / Den Delimarsky。正式releaseとschema変更の補助確認。
- [Linux Foundation: Formation of the Agentic AI Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) — 2025-12-09、設立・founding contributions。
- [MCP Blog: MCP joins the Agentic AI Foundation](https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/) — 2025-12-09、Lead Core Maintainer David Soria Parra。寄贈とtechnical governance。

### Findings attributed to sources

**M1 — corrected（JSON-RPCとtool往復は正しい。initializeを現行へ一般化しない）。**

- 取得時点の公式Currentは **2026-07-28**。2025-11-25は直前の版。draft検索結果や過去の解説を現行とせず、Currentページ・日付付きrelease記事・日付付き仕様の3つで確認した。
- 初期2024-11-05も現行2026-07-28も **JSON-RPC 2.0**。serverが提供する中心的primitiveは **tools / resources / prompts**。それぞれ、実行可能な機能／文脈やデータ／promptのひな型。すべてのserverが3つとも提供する必要があるという意味ではない。
- JSON-RPCはhost内のclientとserverの通信仕様である。モデルproviderへ渡すAnthropic `input_schema`やOpenAI `parameters`と同じwireではない。MCPでは**`inputSchema`と`isError`（camelCase）**。API別のfield名の差をMCP内の改名と誤認しない。

**2024-11-05と2026-07-28の比較：**

| 対象 | 2024-11-05 | 2026-07-28（取得時Current） |
|---|---|---|
| 開始・version交渉 | clientが`initialize`を送り、応答後`notifications/initialized`。version/capabilities/identityを交換 | このhandshakeを廃止。requestごとの`params._meta`にversion/capabilities。任意に`server/discover`を呼べる |
| 一覧 | clientが`tools/list`、serverが`result.tools` | 名称を維持。`resultType:"complete"`とcache fieldsを追加 |
| tool定義 | `name`、optional `description`、`inputSchema` | 基本名を維持。optional `title`、`icons`、`outputSchema`、annotations等が加わっている |
| 呼出し | `tools/call`、`params.name`、optional `params.arguments` | 同じ基本名。共通のrequired `_meta`、MRTR用の追加paramsがある |
| 完了結果 | `content`配列、optional `isError` | 同じ基本名＋required `resultType:"complete"`。optional `structuredContent` |
| 標準transport | stdio、HTTP+SSE | stdio、Streamable HTTP。旧HTTP+SSEはdeprecated |

- **初期必須性：** Tool.nameとinputSchemaは必須、descriptionはoptional。CallToolRequest.argumentsはoptional。CallToolResult.contentは必須配列、isErrorはoptionalで未指定はfalse扱い。文字結果の例は`{type:"text",text:"..."}`。画像やembedded resourceも返せる。RPC層の`error`とtool実行失敗の`result.isError:true`は別。
- **改名ではなく追加：** 依頼に列挙された`tools/list`、`tools/call`、name、description、inputSchema、arguments、content、isErrorは現行でも同名。2025-06-18のtitleは表示名の追加でありnameの改名ではない。同版でstructured tool outputも追加。`content`が`structuredContent`に改名されたわけではない。
- **現行のrequired metadata：** `params._meta["io.modelcontextprotocol/protocolVersion"]`と`params._meta["io.modelcontextprotocol/clientCapabilities"]`が必須。capabilitiesは空objectでもよい。clientInfoはSHOULD（通常送るが必須fieldとはしない）。HTTPでは同じversionを`MCP-Protocol-Version`にも載せる。
- **現行一覧の追加fields：** `tools/list`のresultには`resultType:"complete"`、`ttlMs`、`cacheScope`（public/private）が必要。2024年例をそのまま現行の完全なJSON例として見せると不足する。
- **現行tools/callの例外：** 途中で追加入力が必要なら`resultType:"input_required"`を返すMRTRがある。常に1回のcallで完了結果を返すという一般化は避ける。通常の完了例ではcontentとisErrorを示せばよいが、required resultTypeも付ける。
- 現行Toolsページはrequest例の`_meta`を簡潔さのため省略していると冒頭で明記する。release blogにも簡略なHTTP例がある。完全なwireを描く際はschema/transport本文を優先し、簡略例をそのまま転記しない。

**transportの時系列と適用範囲：**

- **2025-03-26**版がHTTP+SSEを**Streamable HTTPに置換**。2024年の説明にStreamable HTTPを遡及しない。
- 2025年版Streamable HTTPは単一endpointでPOST/GET、任意SSE、session ID等を使えた。2026-07-28版はGET streamとprotocol-level sessionを廃止し、requestごとのPOSTとそのresponse（JSONまたはSSE）を中心とする。SSEそのものが廃止されたのではない。
- 2026年版ではHTTPに`Mcp-Method`、対象がある場合は`Mcp-Name`等も必要。名称が同じStreamable HTTPでも版で振る舞いが違う。単純な入門図は「stdio／Streamable HTTP」とし、GET/sessionの内部図を出すなら版を添える。
- statelessはprotocolの性質。アプリが状態を持てないという意味ではなく、呼出し間で必要な状態は明示的なhandle等を引数に渡せる。legacy（2025-11-25以前）との相互運用には両世代を実装する対応が必要。

**M2 — confirmed。**

- **2025-12-09**、Linux Foundationが **Agentic AI Foundation（AAIF）**の設立と3 projectのfounding contributionsを発表。Anthropicの **MCP**、Blockの **goose**、OpenAIの **AGENTS.md**。
- MCP側の同日発表もAnthropicがMCPをAAIFへ寄贈すると明示。AAIFはLinux Foundation傘下の **directed fund**。画面は「Linux Foundation傘下のAAIFへ寄贈」とすれば正確。
- MCP側は既存maintainer体制と技術方針の自律性が続くと説明。AAIF boardの役割は戦略投資・予算・会員・新project承認等。Linux FoundationがMCPの技術方針を直接決めるようになった、とは書かない。
- 12月9日は寄贈・AAIF設立の発表日で、MCPやAGENTS.mdそのものの初公開日ではない。AGENTS.mdの初公開日はUnit 9/H4で別に確認する。

### Screen-safe wording candidates

- M1の概念：「MCPは、アプリと道具・資料の提供元をつなぐ共通の通信規約。JSON-RPC 2.0で、tools・resources・promptsを扱う。」
- M1の往復：「`tools/list`で道具の定義を取得し、`tools/call`で名前と引数を送る。結果は`content`などで返る。」ラベルに仕様版を付ける。
- 初期化の比較：「2024-11-05版：まずinitializeで交渉。2026-07-28版：各requestに版と能力を添える。」現行のinitialize図は修正必須。
- transport：「stdio／Streamable HTTP（2025-03-26版から。初期版はHTTP+SSE）」。
- M2：「2025-12-09、MCPはLinux Foundation傘下のAAIFへ。Blockのgoose、OpenAIのAGENTS.mdも設立時のprojectに加わった。」

### Unresolved points and boundaries

- Currentの判定と依頼されたfield名・transport・寄贈日は一次資料で確定。各CLI/host/serverの採用版は未調査で、Currentへの全移行が済んだとは主張しない。
- 現行changelogはinput/output schemaの表現拡張を記すが、schema.tsのTool.inputSchemaは引き続き`type:"object"`を要求している。今回の説明にはobject引数例を使い、「任意のJSON値をtool引数にできる」へ拡張しない。規範間の細かな整合監査は依頼の範囲外。
- 全改名の網羅migrationガイド、extensionsの全歴史、AAIFの取得時点全project一覧は扱わない。M2で列挙するのは設立時の3 projectである。
- Plan revision 1で拡張したUnit 7は完了。元の19項目の問いは維持。report.mdはまだ作成しない。

### Next unit

**Unit 8（H1）**：harness/scaffoldの一次資料の用語・短い逐語引用・日付、Claude Code SDK→Claude Agent SDKの改称日、Anthropic/OpenAI記事、METR/SWE-benchで同一モデルがscaffoldにより異なる成績を出す1例を確認する。ユーザーのcheckpoint閾値通知に従い、このUnit 7の完全な追記後にcompactionを要求する。残りはUnit 8〜11。まだready-to-reportではない。

## Unit 8: H1 — harness / scaffoldの用語・SDK改称・同一モデルの評価差

### Sources consulted

すべて **2026-10-09 UTC取得**（開始20:23:19 UTC）。native webで公式記事・論文本文を取得。検索で見つけた第三者の解説は根拠に使わず、以下の一次資料へ戻った。

- [Anthropic: Building agents with the Claude Agent SDK](https://claude.com/resources/articles/building-agents-with-the-claude-agent-sdk) — **2025-09-29**。旧`/blog/`からredirect。改称・harness・agent loop・compaction。
- [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — **2025-11-26**、Justin Young。
- [OpenAI: Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/) — **2026-01-23**、Michael Bolin。冒頭のharness定義、tool実行・context管理。
- [METR: New report: Evaluating Language-Model Agents on Realistic Autonomous Tasks](https://metr.org/blog/2023-08-01-new-report/) — 2023-08-01の公開ページ。
- [METR掲載の報告PDF](https://metr.org/Evaluating_LMAs_Realistic_Tasks.pdf) — Kinniment et al.、表紙の所属表記はAlignment Research Center, Evaluations Team。§2、pp.3–5のscaffolding。対応する[arXiv:2312.11671](https://arxiv.org/abs/2312.11671)の初稿投稿は2023-12-18で、先行Web公開と分ける。
- [SWE-bench Verified公式説明](https://www.swebench.com/verified) — 現行ページ、固定版・公開日なし。Bash Onlyとfull leaderboardの差、scaffoldという語を確認。
- [SWE-agent論文 v3](https://arxiv.org/html/2405.15793v3) — Yang et al.、§2–5、Table 1 / Table 3。[書誌](https://arxiv.org/abs/2405.15793)ではv1 **2024-05-06**、今回読んだv3 **2024-11-11**。arXiv番号の見かけから日付を推定しない。
- 補助的に閲覧：[Anthropic: Raising the bar on SWE-bench Verified with Claude 3.5 Sonnet](https://www.anthropic.com/news/swe-bench-sonnet)、[SWE-bench leaderboard](https://www.swebench.com/)、[METR: Measuring AI Ability to Complete Long Software Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/)。同一モデルの比較例としては、版が明記された上記SWE-agent論文の実験を採用した。

### Findings attributed to sources

**H1 — confirmed（harnessとscaffoldは重なる用語。ただし厳密な共通規格名ではない）。**

- **2025-09-29**の記事でAnthropicはClaude Code SDKから**Claude Agent SDKへの改称**を明言。新モデルの公開ではなく、Claude Codeを支える仕組みをコーディング以外のagentにも使うSDKの改称。この記事の用語を示す逐語引用（22語）：

  > “In other words, the agent harness that powers Claude Code (the Claude Code SDK) can power many other types of agents, too.”

- 同記事はcontext収集→行動→検証→反復をagent loopとして説明し、tool実行、独立contextのsubagent、context limit近くでの要約を扱う。したがって「モデルの外側で、道具の実行と会話の反復・文脈管理を担うプログラム」という画面向け説明を裏付ける。SDK改称日をharnessの発明日・語の初出日とはしない。
- **2025-11-26**のharness記事は、長い作業を複数contextへ引き継ぐため、初回の環境準備と後続の段階的な実装、進捗ファイル、git履歴を組み合わせた例。逐語引用（18語）：

  > “We looked to human engineers for inspiration in creating a more effective harness for long-running agents.”

- 記事はClaude Agent SDKを汎用harnessと呼び、compactionだけで長期作業が成功するとは限らないと述べる。これは特定のweb app実験での設計例で、すべてのharnessに同じファイルや手順が必須という定義ではない。
- **2026-01-23**のOpenAI記事はCodex harnessを、Codex各体験の中核となるagent loopと実行logicと説明。逐語引用（23語）：

  > “We hope this post gives you a good view into the role our agent (or “harness”) plays in making use of an LLM.”

- 同記事のloopは、モデルへ問い合わせ→tool callを実行→結果を次の入力へ追加→再び問い合わせ、回答まで反復。context windowの管理・compactionも実行側の責務として扱う。この記事の日付をCodex harness自体の初公開日として使わない。

**scaffold / scaffoldingの根拠と意味の限界：**

- METR掲載の旧ARC Evals報告§2は、LLM APIとやり取りするプログラムをscaffoldingと呼ぶ。逐語引用（14語）：

  > “The scaffolding program parses the model’s next action and executes it.”

- 同節は、初期目標と道具の説明を送ること、action実行、結果を次のpromptへ加えること、contextから古いactionを落とす実装、subagent委任を説明する。この意味でharnessと役割が重なる。2023-08-01のWeb公開があり、arXiv投稿日の2023-12-18が初めてこの考えが公開された日とはしない。
- SWE-bench公式Verified説明はfull leaderboardをモデル＋agentの多様なシステムの比較とし、モデル比較のためBash Onlyではmini-SWE-agentへ揃えるとする。scaffoldという語も使っている。ただし同サイトの**evaluation harness**（patchを適用してtestする採点基盤）と、**agent scaffold**（推論・道具・contextを回す実行側）は役割が異なる。「harnessはどの文脈でも同じ意味」とはしない。
- 用語の発明者・厳密な同義性を認定する問いではなく、一次資料で使用実態と機能の共通部分を確認した。

**同じモデルでも外側の仕組みで成績が変わる、採用する1例：**

| 出典・条件 | Shell-only agent | SWE-agent |
|---|---:|---:|
| SWE-agent論文v3 Table 1、SWE-bench **Lite 300課題**、GPT-4 Turbo **gpt-4-1106-preview**、pass@1 | **11.00%** | **18.00%** |

- 同論文§4がモデルsnapshotと1課題**4ドル**の予算上限を指定。差は**7 percentage points（7ポイント）**。モデルを再学習した比較ではなく、検索・編集・表示・feedback・context処理を含む周辺interfaceの異なるsystemを比較したもの。
- Shell-onlyの**7.33%**はdemonstrationなしの別条件。これと18%を比べると約10.7ポイントで、論文導入の10.7ポイントはこの差に対応する。標準Shell-only（demonstrationあり）11%と混ぜない。画面には11%対18%を採用する。
- **Verified 500課題の値ではない**。またGPT-4 TurboとClaude 3 Opusの比較、Claude 3.5旧版33%→新版49%は同じモデルでscaffoldだけを変えた証拠にならない。
- 7ポイントのすべてを単一の機能（例えばcontext圧縮のみ）へ帰属させない。より広く「評価されるのはモデルと実行環境の組合せ」と説明するための実験例として使う。

### Screen-safe wording candidates

- 「ハーネスは、モデルを呼び、道具を実行し、結果と文脈を整えて次の推論へ渡すプログラム。研究ではscaffoldとも呼ばれる。」用語の範囲が資料ごとに違うことはREADMEの補足へ。
- 「Claude Code SDK → Claude Agent SDK（2025-09-29）。Claude Codeを支えるharnessを、ほかのagentにも。」
- 「同じGPT-4 Turboでも、SWE-bench Liteの成功率はShell-only 11%／SWE-agent 18%。道具や文脈の渡し方も成績を左右する。」脚注はモデルsnapshot、300課題、pass@1、論文v3/Table 1。

### Unresolved points and boundaries

- 元のH1の問いは完了。harness/scaffoldの用語に全組織共通の規範的定義や明確な同義語関係があるとは主張しない。
- **派生質問（保留）：** 取得時点のClaude CodeとCodexの実用性能差を、同一モデル・同一予算で比較できるか。今回の歴史・説明用fact-checkには不要。製品比較を行う段階で別評価を設計する。
- SDK記事のsubagent/compaction記述はH3/H5にも使えるが、現行CLIの挙動・導入日はまだ未検証。次単位以降で確認する。
- Plan revision 1の残単位はUnit 9（H2–H4）、10（H5）、11（全ID最終照合）。元の19項目の範囲を維持。report.mdはまだ作成しない。

### Next unit

**Unit 9（H2–H4）**：Claude CodeのJSONL session保存・continue/resume、Codex resume、/compact、自動compaction、Anthropic context editing/memory toolとcontext engineering記事の日付、OpenAI Responses compactionの初公開、CLAUDE.mdとAGENTS.mdの初公開・読み込みを公式資料で確認。ユーザーのcheckpoint閾値通知に従い、このUnit 8の完全な追記後にcompactionを要求する。まだready-to-reportではない。

## Plan revision 2: H3の圧縮方式とH4の「公開日」を分ける

- Unit 9の資料から、OpenAI Responsesには明示的な`/responses/compact`と後発の自動server-side compactionがあり、公開日が異なると分かった。H3をこの2行に分けて記録する。Claude APIのtool result clearing、Claude Codeの会話要約、API memory toolもそれぞれ別機能として扱う。
- **派生質問（今追究する）：AGENTS.mdの「launch」はCodexの指示ファイルとしての利用開始か、ツール横断の公開フォーマット／サイトの公開か。** 2025-05-16のCodex発表と、OpenAIの「2025年8月公開」という振り返りが両方あるため、原質問H4に答えるために必要。Unit 9内で公式サイト、初回commit、参加者Ampの発表を追加照合する。原質問の目的は変えない。
- **保留する派生質問：** CLAUDE.md自体の厳密な初実装日、すべてのagent製品によるAGENTS.md採用日、各CLIがどのAPI compactionを内部で使うか。原依頼はCLAUDE.mdの読込み動作とAGENTS.mdの公開史の確認であり、この全実装史は不要。
- Unitの追加・削除はなく、Unit 9の中の論点と資料群を補強。現在の残単位は **Unit 9（H2–H4、今回完了予定）、Unit 10（H5）、Unit 11（全19項目の最終照合）**。

## Unit 9: H2–H4 — session保存・compaction公開史・指示ファイル

### Sources consulted

すべて **2026-10-09 UTC取得**（調査中の時計20:26:55 UTC）。CLI/APIガイドは取得時点の現行ページで固定版番号なし。Webの現行HTML、OpenAI Developer Docsのsearch/fetch、GitHub公式APIで確認。第三者記事・掲示板は根拠に採用しない。

- [Claude Code: Manage sessions](https://code.claude.com/docs/en/sessions) — Resume a session、Where transcripts are stored、保存を変更・無効化する設定（L45–61、L259–274）。
- [Claude Code: How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works) — sessionとcontext、resume/fork、context limitへの対応（L125–165）。
- [Claude Code: How Claude remembers your project](https://code.claude.com/docs/en/memory) — CLAUDE.mdの読み込み階層、auto memoryとの区別、現行AGENTS.md fallback。
- [Claude Code: Hooks reference](https://code.claude.com/docs/en/hooks) — transcript_pathのJSONL例、PreCompactのmanual/auto、PostCompactのsummary。JSONLはsessions本文で直接確認できたのでhook例だけに依存しない。
- [Codex CLI](https://learn.chatgpt.com/docs/codex/cli) — 旧`developers.openai.com/codex/cli/features/`のredirect先。
- [OpenAI: Developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli) — `codex resume`節（L3003–3060）、current directory / --last / --all / session ID。
- [OpenAI: Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) — discovery chain、run開始時の読込み（L916–923）。短縮した`/docs/agents-md`は取得失敗したため、公式CLIページのリンクから正しいURLを取得。
- [Anthropic: Managing context on the Claude Developer Platform](https://claude.com/resources/articles/context-management) — **2025-09-29**、旧`www.anthropic.com/news/context-management`のredirect先。context editingとmemory toolのpublic beta発表。
- [Anthropic: Introducing Claude Sonnet 4.5](https://www.anthropic.com/news/claude-sonnet-4-5) — **2025-09-29**。同日公開されたAPI機能、SDKを明記。
- [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) — **2025-09-29**の項（Sonnet 4.5、memory beta、context editing beta）。
- [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — **2025-09-29**。compaction / structured note-taking / subagent architecture。
- [Claude API: Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) — Tool result clearing / Context editing happens server-side（L97–122）。
- [Claude API: Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool) — client-side execution、/memories、tool definition（L77–95、L165–168）。
- [OpenAI API Changelog](https://developers.openai.com/api/docs/changelog) — **2025-12-11** client-side compaction、**2026-02-10** server-side compaction。公式fetch本文とWeb検索で照合。
- [OpenAI API: Compaction](https://developers.openai.com/api/docs/guides/compaction) — 公式fetchで全本文、standalone endpointとserver-side方式を確認。
- [AGENTS.md公式サイト](https://agents.md/) — open formatの用途、Aboutの協力者一覧。
- [OpenAI: Introducing Codex](https://openai.com/index/introducing-codex/) — **2025-05-16**、本文のAGENTS.md説明と公開system message。後日の更新注記がある現行の歴史ページ。
- [OpenAI: Agentic AI Foundation](https://openai.com/index/agentic-ai-foundation/) — **2025-12-09**、AGENTS.mdの起源と「August 2025」release、寄贈主体。
- [Amp: From AGENT.md to AGENTS.md](https://ampcode.com/news/AGENTS.md) — **2025-08-20**、既存AGENT.mdからの移行とOpenAIがagents.md domainを取得した説明。参加当事者の一次資料。
- [AGENTS.md initial commit](https://github.com/agentsmd/agents.md/commit/ba9474a69e9a2c0c4176713843b78e8f54377941) — `ba9474a69e9a2c0c4176713843b78e8f54377941`、author/committer日付 **2025-08-19T21:49:01Z**、parents=0、作者Romain Huet。サイトのsourceを含む初回commit。GitHub HTMLでは日付が抽出されず、[公式commit API](https://api.github.com/repos/agentsmd/agents.md/commits/ba9474a69e9a2c0c4176713843b78e8f54377941)で確認。
- [GitHub repository metadata](https://api.github.com/repos/agentsmd/agents.md) — created_at **2025-08-19T17:22:54Z**。APIはPython標準urllibで20秒timeout・400–500KB読取り上限を設け、保存せず必要なfieldsだけ取得した。

### Findings attributed to sources

**H2 — confirmed（CLIの既定保存動作として）。**

- Claude Codeのsessions公式文書は、作業中にsessionをローカルへ継続保存し、既定のtranscriptは **`~/.claude/projects/<project>/<session-id>.jsonl`** と明示する。JSONLは1行が1個のJSON objectで、message、tool use、metadataなどを記録する。`<project>`はworking directoryを変換した名前。長いpathへの例外処理もあるため、単なる固定slug規則を全ケースへ一般化しない。
- **`claude --continue`** は現directoryの直近会話、**`claude --resume`** は選択画面、**`claude --resume <session-id>`** は指定会話を再開。現行版は名前やtranscript絶対pathも受け取る。resumeは同じsession IDに追記する操作で、forkは新しいID。
- 「各sessionを必ず永久保存」は誤り。保存先は設定可能、既定retentionは30日、全modeの書込み抑止や`-p`用`--no-session-persistence`がある。非対話/SDK sessionは通常のpickerと対話`--continue`から除外される条件もある。画面の基本説明は「既定で保存し、あとから再開できる」で足りる。
- OpenAI公式Developer commandsは **`codex resume`**（既存session選択）、**`codex resume --last`**（現working directoryで直近）、**`codex resume <SESSION_ID>`** を提供。`--all`で現directory外も対象にできる。今回必要な「Codex CLIにもresumeがある」は確認できた。
- 保存済みtranscriptと、その時点でモデルが読むcontextは同じものではない。履歴がdiskに残っていても、圧縮済みcontextのモデルが全発言を一度に見ていることは保証しない。

**H3 — confirmed（公開日と機能の区別を明記）。**

| 機能・資料 | 確認した日付 | その日に言えること |
|---|---|---|
| Claude API context editing + memory tool | **2025-09-29** | Sonnet 4.5と同日に**public beta**。発表・API release notesが一致 |
| Effective context engineering for AI agents | **2025-09-29** | 同名のengineering記事公開。概念自体の発明日ではない |
| Responses API `/responses/compact` | **2025-12-11** | changelogで**client-side compaction**公開 |
| Responses API server-side compaction | **2026-02-10** | 閾値による自動圧縮をResponses内で提供する後発機能 |

- Claude Codeの現行works文書は、context上限に近づくと古いtool outputを整理し、必要なら会話を要約すると説明。**`/compact`** で利用者が要約を起動し、保存したい点を指示できる。自動圧縮に普遍的な「残り何%」の数値を与えない。
- 2025-09-29のcontext engineering記事も、Claude Codeが履歴をモデルへ渡して重要情報を要約し、圧縮contextで継続すると説明する。同記事の「直近5ファイル」等は記事当時の実装例であり、現行すべてのmodel/CLIの固定契約として画面に載せない。要約で細部が失われる可能性はある。
- **API context editing** の初期機能は、古いtool result/callを取り除きcontextを節約するもの。現行guideの`clear_tool_uses_20250919`は設定閾値を超えると古い結果からplaceholderへ置換。既定はresultのみで、`clear_tool_inputs:true`ならcall入力も対象。**server側でモデルへ渡す前に適用し、clientが持つ元の会話履歴は書き換えない**。会話全体の意味的要約と同一視しない。
- **API memory tool** は文脈の外にファイル風の記録を保存・参照するclient tool。モデルは操作を要求し、開発者側のhandlerがstorageを操作して`tool_result`を返す。`/memories`はhandlerが実storageへ対応付けるprefix。Anthropicがすべての利用者に自動で永続storageを割り当てるという意味ではない。
- tool type **`memory_20250818`**、context strategy **`clear_tool_uses_20250919`**、beta header **`context-management-2025-06-27`** の日付部分を公開日と解釈しない。公開日はrelease notesの**2025-09-29**。現行memory toolと2025年のbeta発表は版を分けて説明する。
- **OpenAI `/responses/compact`** は、clientが明示的にendpointを呼び、返された圧縮windowを次のResponses入力に渡す方式。changelogの「client-side」は呼出し管理の意味で、ローカルPCだけで圧縮計算をする意味ではない。圧縮結果は**暗号化されたopaqueなcompaction item**と、保持された他のitemsを含み得る。人間が読める通常の要約文字列と断定しない。
- 現行OpenAI guideは`context_management`の`compact_threshold`によるserver-side方式も記述する。閾値到達時にserverが圧縮し、streamにcompaction itemを出す。この自動方式を2025-12-11からあったことにしない。CLIの`/compact`とAPI endpointの公開日も別。
- 全方式とも、学習でmodel weightsへ記憶を追加する説明ではない。必要な状態を要約・外部保存・再読込みで次の推論へ渡す仕組みとして描ける。

**H4 — corrected（指示ファイルの動作は確認。「初公開」の対象を限定）。**

- Claude Code公式memory文書は、**CLAUDE.mdをsession開始時にcontextへ読み込む**と明記。user、project、祖先directoryなどの設定が対象。作業directory以下のsubdirectoryのCLAUDE.mdは、関連するfileへアクセスした時に読み込むため、「repositoryの全CLAUDE.mdを開始時に読む」は誤り。
- 指示ファイルは規則・手順等の文脈。auto memory（Claudeが書く経験メモ）、JSONL transcript（会話記録）、API memory tool（storage操作）とは区別する。これらの読み込みをモデルの再学習と呼ばない。
- AGENTS.md公式サイトはcoding agentへproject固有の指示を与える**simple, open format**とする。Aboutは **OpenAI Codex、Amp、Google Jules、Cursor、Factory**等の協力によるものと明記。OpenAI単独がすべてのagent製品向けの規格を一方的に発明した、とは書かない。
- OpenAIの**2025-12-09** AAIF記事はCodexの指示を置く仕組みが起源とし、公開を**2025年8月**と振り返る。寄贈主体はOpenAI。公式repositoryの初回commitは**2025-08-19 UTC**（上記hash）、翌**8月20日**にはAmpが対応変更を発表。これで「8月に公開フォーマットとして広まった」時系列は確認できる。
- ただしOpenAIの**2025-05-16 Introducing Codex**にはすでにAGENTS.mdを使う説明とsystem messageがある。したがって**「AGENTS.mdというファイルが2025-08-19に初めて生まれた」ではない**。推奨日付表記は **「公開フォーマット：2025年8月（公式repo初回commit 8月19日）」**。年表で日を使うなら「公式repo初回commit」とeventを名指しする。
- **厳密な一般公開日には留保：** Git commit/created_atだけではrepositoryがpublicに切り替わった瞬間やdomain公開時刻は証明できない。OpenAI当日のlaunch告知は今回取得できず、8月19日を無条件に正式発表日とする確度は不足。8月20日はAmpの参加発表日で、OpenAIの初回発表日と置き換えない。
- OpenAI現行AGENTS.md文書もrun開始時のinstruction chain構築を明記する。各agentが採用する読込み規則は完全に同一ではない。現行Claude Codeも設定とCLAUDE.mdの有無に応じてAGENTS.mdを読むため、「Claude CodeはCLAUDE.mdしか読めない」という補足は避ける。この後年の対応を2025年当時へ遡及しない。

### Screen-safe wording candidates

- H2：「会話は既定で端末に保存される。Claude CodeはJSONLに記録し、`--continue`／`--resume`で再開。Codex CLIにも`resume`がある。」
- H3：「文脈がいっぱいに近づいたら、古い結果を整理し、要点を残して続ける。長く残す情報は外部のメモへ。」具体的な機能名はAPI/CLIを添える。
- H3の年表：「2025-09-29：Claude APIのcontext editing／memory toolがpublic beta。2025-12-11：Responses APIの明示的compaction。2026-02-10：Responses内の自動compaction。」
- H4：「CLAUDE.mdやAGENTS.mdに、プロジェクトの作業手順や規約を書く。ハーネスがそれを文脈へ読み込む。」
- H4の日付：「AGENTS.md公開フォーマット：2025年8月。OpenAIを含む複数のagent開発者が協力。」8月19日を表示する場合は「公式repo初回commit」の注記付き。

### Unresolved points and boundaries

- H2/H3は依頼された機能・日付を確認。H4の機能・公開月・協力者は確認、正確な一般公開日だけは上記の意味の違いを明記して限定する。新たな阻害条件や追加のユーザー入力は不要。
- CLI/APIのguideは取得時点の現行仕様。保存無効化・retentionの例外を含み、全CLI versionの挙動を保証しない。ローカルの実sessionや個人transcriptは検査していない。
- 原依頼H4はCLAUDE.mdの初実装日を要求していないため追究しない。AGENTS.md全採用製品史、各harnessの内部compaction実装も保留。
- Plan revision 2のUnit 9を完了。残りは **Unit 10（H5）とUnit 11（全19項目最終照合）**。report.mdはまだ作成していない。

### Next unit

**Unit 10（H5）**：Claude Code subagentsの独立contextと導入日を公式docs/changelogで確認。Anthropic multi-agent記事の90.2%・15×・4×は先行report再引用し、BrowseCompでtoken使用量がperformance varianceの約80%を説明するという記述を追加検証する。ユーザーのcheckpoint閾値通知に従い、このUnit 9の完全な追記後にcompactionを要求する。まだready-to-reportではない。

## Plan revision 3: H5の導入日を「カスタムsubagents」と従来の委任に分ける

- 公式CHANGELOGはv1.0.60で**custom subagents**の作成を追加したと記す一方、以前のv1.0.41にはSubagentStop hookが既にある。2025-04-18付の公式best-practices記事の検索収録本文にもsubagent委任が登場する。したがって7月の公開を「Claude Codeが初めて子エージェントを使えるようになった日」と書けない。
- **派生質問（今回追究）：H5の導入日はカスタム定義機能か、委任機能全体か。** 原質問に正しく答えるため、Unit 10に公式変更commitとnpm publish時刻の照合を追加し、両者を区別する。単位の追加・削除はなし。
- 最初期の内部委任の厳密な初実装・全利用者へのrollout日時までは資料がなく、保留する。画面の年表にはイベントを特定できるカスタムsubagentsの公開日を使える。
- 現在の残単位：**Unit 10（H5、今回完了）、Unit 11（全19項目の最終照合）**。原質問は移動していない。

## Unit 10: H5 — subagentの独立context・カスタム定義導入日・BrowseCompの80%

### Sources consulted

すべて **2026-10-09 UTC取得**（時計20:31:00 UTC）。現行docsは固定版番号のない取得時点の内容。モデル実行やパッケージのinstallはしていない。

- [Claude Code: Create custom subagents](https://code.claude.com/docs/en/sub-agents) — 冒頭、Manage subagent context / What loads at startup（Web本文L91–93、L944–946）。
- [Claude Code公式CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)、[raw](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md) — v1.0.60のcustom subagents追加、v1.0.41のSubagentStop hook。main取得時点。
- [v1.0.60を追記した公式commit](https://github.com/anthropics/claude-code/commit/812c27b8b35ff3a520764c0f0aa75b61ad512489)、[公式API](https://api.github.com/repos/anthropics/claude-code/commits/812c27b8b35ff3a520764c0f0aa75b61ad512489) — **2025-07-24T21:01:31Z**、CHANGELOGへv1.0.60とcustom subagents追加の1項目を追記したdiffを確認。
- [npm registry: @anthropic-ai/claude-code](https://registry.npmjs.org/@anthropic-ai%2fclaude-code) — publisher packageの`time` metadata。**v1.0.60: 2025-07-24T20:52:22.104Z**。隣接版v1.0.59は7月23日、v1.0.61は7月25日。Python標準urllibで25秒timeout、12MB上限、メモリ内読取り後に3件の時刻だけ出力。ファイル保存なし。
- [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices) — native検索に収録された公式旧記事本文は**2025-04-18**付、Explore, plan, code, commit節でsubagentsを使う説明。直接openは現行docsへのredirectで失敗したため、この歴史ページの日付・本文は検索収録による補助確認と明記する。厳密な初導入日をこれだけで認定しない。
- [Anthropic: How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — **2025-06-13**、Benefits of a multi-agent system（Web本文L29–34）、80%を追加検証。
- ローカル先行報告 `research/llm-facts/report.md` **A6（表および§A6・A7、L39/L247–249）** — 90.2%・約15×・約4×の既存確認を再引用。今回その数字の独立した再評価はしない。
- 失敗も記録：GitHub release `https://github.com/anthropics/claude-code/releases/tag/v1.0.60` はWeb取得失敗、GitHub release APIも404。releaseページの推定日時は使わず、上記公式commitとnpm metadataを採用した。第三者ブログ・Redditは根拠に採用しない。

### Findings attributed to sources

**H5 — 判定候補 corrected（独立contextと数値はconfirmed、導入日の対象を限定）。**

- Claude Code現行公式docsは、各subagentが**独立したcontext window**で作業し、結果を主担当へ返すと説明する。通常のnon-fork subagentは親の全会話を自動で受け取らず、委任文と必要な指示等から始まる。取得時点の**fork**は親の会話を継承する例外なので、「すべての子が必ず空の履歴から始まる」と断定しない。独立contextは別のメモリ領域という説明であり、別々のモデル重みを学習する意味ではない。
- 公式CHANGELOGの**v1.0.60**はカスタムsubagentを作成する機能と当時の`/agents`を追加。npm publish時刻と同日の公式commitが一致し、**カスタムsubagents導入日＝2025-07-24 UTC**と確認できる。
- それ以前のv1.0.41にSubagentStop hookが存在し、4月18日付公式記事の検索収録本文にもsubagentsの活用があるため、7月24日を委任機能全体の初登場とするのは誤り。通常の委任機能が最初に利用可能になった厳密な日は未確定。現行の`/agents`の挙動は2025年当時から変わっているので、導入当時のコマンド説明を現行UI契約にしない。

**Anthropic multi-agent記事の統計：**

- 先行A6を再引用：**2025-06-13**の同社報告で、主担当Opus 4＋Sonnet 4子担当は、内部research評価で単独Opus 4を**90.2%上回った**。通常チャット比のトークン量はmulti-agent **約15倍**、single-agent **約4倍**。性能差・トークン量・金額は異なる指標。90.2ポイント増や、Claude Code全般の性能向上を示す数値ではない。
- 今回追加確認した短い原文：**“We found that token usage by itself explains 80% of the variance”**（15 words）。直前の文が対象を**BrowseComp evaluationのperformance variance**と明示する。記事はトークン使用量・tool call数・モデル選択の3要因で**95%**を説明したとも述べる。
- これは**Anthropicの当該分析における成績のばらつきの説明率**。BrowseComp正答率80%、全AI能力の80%、性能向上の80%、トークンを増やせば必ず80%改善、という意味ではない。因果効果を証明した統制実験としては扱えない。記事にはこの分析の標本、回帰仕様、生データ、誤差・信頼区間が十分記載されておらず、独立再現した値とはしない。
- 内部research評価の90.2%とBrowseCompの80%は**別の評価の記述**。同じ棒グラフへ同じ尺度として並べない。約15倍・4倍も通常チャットという別の基準に対するtoken倍率。

### Screen-safe wording candidates

- 「子エージェントは、それぞれの文脈で調べ、結果を主担当へ返す。」脚注：Claude Code現行docs。forkの継承は必要なときREADME補足へ。
- 年表：「**2025-07-24：Claude Codeにカスタムsubagents（v1.0.60）**」。既存の委任機能までこの日が初登場とは書かない。
- 数値：「AnthropicのBrowseComp分析では、トークン使用量だけで成績のばらつきの80%を説明したと報告。」日付と同社分析を添える。
- 先行A6の90.2%・15×を再掲するなら、内部research評価・単独Opus 4比と、token量・通常チャット比を別々に注記する。

### Unresolved points and boundaries

- 厳密な初期built-in委任の導入日、2025-04-18記事の初版と後日の更新差、80%の統計的再現に必要なデータは未確定。日付はカスタム定義機能へ限定することで原依頼の年表に使える結果を得た。
- **派生質問（保留）：** 同一token予算でsingle-agentとmulti-agentを比較するとどうなるか。元のfact-checkは記事の主張の確認であり、新規実験や一般的費用対効果の判定は不要。必要なら次の独立調査・評価設計の課題とする。
- Unit 10完了。**残りはUnit 11（全19項目の最終照合）のみ**。report.mdはまだ作成していない。

### Next unit

**Unit 11：** 取得済みログと原依頼・先行報告を突き合わせ、全19IDの欠落、confirmed/corrected/uncertain、日付・版、引用長、画面用文言と留保を点検する。ユーザーのcheckpoint閾値通知に従い、ここでcompactionを要求する。まだready-to-reportではない。

- Unit 10の引用語数注記を訂正：上記80%の英語引用は空白区切りで**12 words**（15ではない）。引用本文と事実判定に変更なし。最終報告では同一記事の逐語引用合計を25語以内に保つ。

## Unit 11: 全19項目 — 原依頼との最終照合・判定確定・報告準備

### Sources consulted

照合日 **2026-10-09 UTC**（本単位の時計20:32:28 UTC）。新しいWeb調査や既存の数値の再評価は行わず、取得済み一次資料の記録と原依頼を照合した。したがって各Web資料の取得日はUnits 1–10に記録した2026-10-09のまま。

- `research/agent-facts/log.md` — Initial plan、Plan revisions 1–3、Units 1–10の全内容。各IDの原質問、一次URL、仕様・論文・コードの版、取得日、画面用文言、未解決点を確認。
- `research/llm-facts/report.md` — 要約・24項目表と既存のA1／H7／A6／A7への参照。原依頼が再利用を指定した発表日・multi-agent数値を新規検証したかのように記載しないことを確認。
- 原依頼 — B1–B4、R1–R3、S1–S5、M1–M2、H1–H5の**19項目**、日本語、1IDにつき主表1行、画面に使える修正文言、一次URL、条件・留保、現行APIの版・取得日、歴史的提供区分、出力範囲を再確認。
- 逐語引用の照合対象：Unit 2の[Harmony guide](https://developers.openai.com/cookbook/articles/openai-harmony)、Unit 8の[Agent SDK記事](https://claude.com/resources/articles/building-agents-with-the-claude-agent-sdk)、[long-running harness記事](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)、[Codex agent loop記事](https://openai.com/index/unrolling-the-codex-agent-loop/)、[METR報告PDF](https://metr.org/Evaluating_LMAs_Realistic_Tasks.pdf)、Unit 10の[multi-agent記事](https://www.anthropic.com/engineering/multi-agent-research-system)。本文は各Unitで取得済みの記録を使用し、本単位では再取得しない。

### Findings attributed to sources

**主表の判定はconfirmed 13件、corrected 6件、uncertain 0件。** confirmedは当該行の対象・条件・出典への帰属を伴う判定であり、留保のない普遍的事実の認定ではない。未確定の一部論点は下記のとおり独立して残す。

| ID | 確定判定 | 証拠単位 | 報告で落とさない内容 |
|---|---|---|---|
| B1 | corrected | Unit 1 | tool_useとuser/tool_result、対応ID、contentは任意、end_turnは自然終了の一例。モデル×tool_choiceの追加token表を補足に全件掲載。client/server実行主体を区別。 |
| B2 | confirmed | Unit 1 | Chatのtools/tool_calls/role:toolとResponsesの独立items、JSON文字列のarguments、新規Responses推奨。現行モデルごとのAPI制約。 |
| B3 | confirmed | Unit 2 | Harmonyのdocumented 2-message例・7特殊tokenとID、Llama 3.1のeom/eot/python_tag/ipython。next-token生成の説明は公開コードからの推論と明記。 |
| B4 | confirmed | Unit 2 | Toolformer 2023-02-09、WebGPT 2021-12-17、既存A1のAPI日付再引用。論文とAPI公開を分ける。 |
| R1 | confirmed | Unit 3 | RAG v1 2020-05-22、NeurIPS 2020、3所属、命名、DPR/MIPS、BART-large約400M、2018-12-20 dump、100語、21,015,324 passages、学習時k∈{5,10}。 |
| R2 | corrected | Unit 3 | RAGが検索活用の始まりではない。REALM 2020-02-10、ORQA 2019-06-01。 |
| R3 | confirmed | Unit 4 | 広義RAGは検索情報を生成入力へ加える方式。OpenAI文書検索2023-11-06 beta→file search 2024-04-17→Responses 2025-03-11、Web検索OpenAI 2025-03-11 preview／Anthropic 2025-05-07提供開始。 |
| S1 | confirmed | Unit 5 | 2024-10-22 public betaの3つのtypeと呼出しnameを分ける。持続bashはアプリのprocess。初期と現行schema差。 |
| S2 | confirmed | Unit 5・先行H7 | Claude Code 2025-02-24限定研究preview、2025-05-22 GA。再引用。 |
| S3 | confirmed | Unit 5 | Codex CLI 2025-04-16 open-source公開、new experiment。クラウドCodexやローカルmodel推論と混同しない。 |
| S4 | confirmed | Unit 5 | Gemini CLI 2025-06-25 open-source preview、Apache 2.0。 |
| S5 | corrected | Unit 6 | 画像→action、初期clickの座標制約。369課題、人間72.36%、Claude14.9%/15 steps、22%/50 steps＋prompt最適化、次点7.8/7.7の出典差。CUA38.1/58.1/87%、pass@1、原則200 steps、WebVoyager除外。 |
| M1 | corrected | Unit 7 | 2024-11-05とCurrent 2026-07-28の対照。現行initialize廃止、required metadata/resultType等、既存field名は維持。Streamable HTTPは2025-03-26版から。 |
| M2 | confirmed | Unit 7 | 2025-12-09、AAIF設立とAnthropic MCP／Block goose／OpenAI AGENTS.md寄贈。技術統治の意味を限定。 |
| H1 | confirmed | Unit 8 | SDK改称2025-09-29、harness記事2025-11-26、Codex記事2026-01-23、短い正確な引用、METR/SWE-benchのscaffold。GPT-4 Turbo同一snapshotでLite11%対18%。 |
| H2 | confirmed | Unit 9 | 既定JSONL保存とcontinue/resume、Codex resume。保存の例外、transcriptと実際のcontextの区別。 |
| H3 | confirmed | Unit 9 | Claude Code手動/自動compact、2025-09-29 API context editing/memory betaとcontext engineering記事、Responses明示compact 2025-12-11／自動server-side 2026-02-10。 |
| H4 | corrected | Unit 9 | CLAUDE.md開始時読込みと下位directory例外。AGENTS.mdはCodex 5月利用と8月open-format公開を区別。8月19日は初回commit。複数開発者の協力。 |
| H5 | corrected | Unit 10 | 独立context、カスタムsubagentsはv1.0.60/2025-07-24。委任全体の初日ではない。A6再引用とBrowseCompのvariance80%を区別。 |

**数値・日付・版の整合性：**

- 19IDすべてに資料URL、取得日、判定理由、画面用候補があり、未調査のIDはない。R3は広義の用法を認める判定だが、原依頼の「あらゆるシステム」は「検索資料を生成入力へ加える方式」と限定する。
- APIの版名中の日付は公開日ではない。S1の`*_20241022`のように一致する場合も、R3の`web_search_20250305`やH3のmemory/beta headerのように異なる場合もある。年表のイベントを明記する。
- MCPの現行版、モデル別追加tokens、CLIの機能は取得時点の文書。歴史的な発表日の仕組みへ現行版を遡及しない。現在の公式仕様が実装製品へすべて導入済みだとは書かない。
- Anthropicの14.9%とCUAの38.1%は条件の違う別発表。H1の11%対18%はSWE-bench Lite、同一GPT-4 snapshotの比較。H5の90.2%、80%、15×、4×も指標・分母・評価が異なる。単一の比較グラフへ無条件に並べない。
- 先行報告を再利用した箇所に日付・数値の矛盾はない。新しいH1–H5と先行報告のH1–H7は別のID体系なので、先行への参照には必ず「先行報告」を添える。

**引用の整合性と訂正：**

- Unit 8の英語引用を空白区切りで再計数したところ、Agent SDKは22語、long-running harnessは**16語（ログの18語を訂正）**、Codexは23語、METRは**11語（ログの14語を訂正）**。逐語本文自体は変更しない。Unit 10の80%引用は既に追記で訂正した12語。
- それぞれ異なる資料の短い引用で、各資料25語以内。報告内で同一出典の別の英文を追加して上限を超えない。Harmony例は記録済みの短い2行を使用し、developer namespace全例の追加引用は不要。技術説明は日本語の要約で補う。
- 最終報告では主表に全説明を押し込まず、B1の追加token表、B3の形式例、R3/S5/M1/H1/H3の複数条件を必要な補足へ分ける。逐語引用と説明用の作例を区別する。

### Unresolved points and boundaries

- S5の次点7.7/7.8%の差、AGENTS.mdサイト/repositoryの厳密な一般公開時刻、Claude Code初期built-in委任の初日、BrowseComp80%分析の再現用データは未確定。いずれも確認済みの出典・イベント・対象へ表現を限定すれば画面を作れるため、追加必須単位にはしない。
- 保留派生質問は、条件を揃えたagent性能比較、同一token予算でのsingle/multi-agent比較、各MCP製品の実装版、検索toolのGA厳密日、指示ファイルの全採用史・harness内部圧縮の詳細。最終報告の推奨行動へ引き継ぎ、今回の完了条件へ追加しない。
- Plan revisions 1–3で扱った派生質問は、原依頼の19項目を正確に答えるための意味・版・公開イベントの切分けであり、原質問そのものの置換はない。新規必須単位は生じなかった。
- **最新計画に対する全11調査単位が完了。** 本ターンではreport.mdを作らず、ログだけを追記。プロジェクトファイルや先行報告の変更はしていない。

### Next unit

**ready-to-report** — 次はattendantが明示する報告ターン。`log.md`を読み直し、`research/agent-facts/report.md`を日本語で「要約→19IDそれぞれ1行の主表→必要な補足→不確実性・計画の変遷→推奨行動」の形に作る。今回のcheckpoint閾値通知に従い、完全なUnit 11を保存したここでcompactionを要求する。**ready to write report**。

## Report completion

- 報告ターン（2026-10-09 UTC）：全調査ログと原依頼を読み直し、`research/agent-facts/report.md`を作成した。追加のWeb調査は行わず、取得日は各Unitに記録した2026-10-09を維持した。
- 報告は日本語の要約、19ID各1行の主表、必要な補足、不確実性・計画の変遷、推奨行動で構成。判定はconfirmed 13件／corrected 6件。先行報告の再引用と今回の追加検証を区別した。
- 書込み後にID集合と重複、判定数、コードブロックの対応、成果物一覧を確認。19行に欠落・重複なし。出力ディレクトリは`log.md`と`report.md`の2ファイルのみ。デッキ・engine・先行報告は変更していない。
- 最新計画の全研究単位と最終報告を完了。残る限定的な不確実性・保留派生質問は報告の末尾へ引き継いだ。追加checkpointは要求せず、state doneで終了する。
