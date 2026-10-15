# 5章「ツール」第1稿の事実確認

調査基準日・報告日：2026-10-15 UTC。対象は [decks/llm/README.md](../../decks/llm/README.md) の「2026-10-15（5 章を作り直す）」にある5-1〜5-5の71文、「決めたこと」6項目、「絵の方針」5項目。判定は [log.md](log.md) Unit 1に保存した第1稿に対応する。以後の原稿変更を自動で含むものではない。

## 要約

**「LLMが呼び出しを書き、モデル外のプログラムが実行し、結果を入力へ加えて次の生成を行う」という章の筋は維持できる。** 全71文の判定は「言える」33文、「限定すれば言える」33文、「言えない」5文。「限定」は主に、説明用の模式図、APIの構造化データ、実モデルのトークン列を区別するために必要となる。判定数は重要度を表す点数ではない。

先に置き換える必要がある5文は次のとおり。詳しい根拠と全件の修正案は後の判定表に示す。

| 文ID | 原文の問題 | 修正の中心 |
|---|---|---|
| 5-1.2 | 学習の時点から「あしたの天気がどこにも書かれていなかった」とは言えない。 | 学習済み知識だけでは最新の予報を確かめられず、今回の入力にも予報がない、と設定する。 |
| 5-2.2 | 「知っているのは文書だけ」は学習済み知識を否定してしまう。 | 今回のアプリで利用できるツールの情報を伝える必要がある、とする。 |
| 5-3.2 | 「どれも同じテキスト」では、宛先・特殊トークン・構造化された呼び出しを説明できない。 | 普通の文章だけで頼みを書かせた場合の困りごとを仮定する。 |
| 5-3.10 | 共通の「呼び出し開始トークン」がアシスタント直後に一つ出るとは限らない。 | 呼び出しも、宛先や印を含むトークン列として生成する、とする。 |
| 5-5.12 | 「アプリは合わせて回すだけ」では実行可否・上限・呼び出し方の制御が消える。 | モデル出力を受け、外側のアプリが次の処理へ進める、とする。 |

根拠は、知識の時点に関する [Claude公式説明][U2-S1]、既存調査の [重みと入力の区別](../concept-facts/report.md)、[Harmony形式][U3-S1]、[Llama 3.1形式][U3-S2]、[実行許可][U4-S1]、[エージェントループ][U5-S1]。各論点の詳しい対応は以下に記す。

## 判定の読み方と調査範囲

- **言える**：この章のテキスト生成モデル・外部ツール・正常動作の作例という文脈で維持できる。問い・章の案内は、対話として維持できれば含める。
- **限定すれば言える**：例、形式、担当、条件を明示して使う。
- **言えない**：原文の中心的な断定を置き換える必要がある。

「アプリ」は既存のA2の用法を引き継ぎ、画面とLLMの間で会話を受け渡すプログラムをサーバー側まで含めて指す。ただし、図ではAPI提供元による入力整形・推論停止と、利用アプリによる実行判断を区別する。利用者の端末だけで全処理を行う意味にはしない。[assistant-facts A2](../assistant-facts/report.md)

既存調査の確定事項を引き継ぎ、未解決の差分だけを公式文書、論文、公開コードで確認した。API・SDK・モデル・tokenizerの実行実験は行っていない。原稿・実装・Git・システム設定は変更していない。言い換えは事実を正す候補であり、語りの最終的な文分割・字幕整形は制作側で行う。ずんだもんの問いだけは元の話者の口調を保った。

## 論点別の結論

### 1. 学習済み知識と、今回使える道具の情報を分ける

知識の締切は、その後の世界の情報を確実に答えられるという保証がないことを示す。「あしたの天気」という語だけから、学習時点に予報が一切存在しなかったと断定することはできない。また、未来の実際の天気と、いま公表されている予報は別である。この章では「最新予報が入力にないので、外部から取得する」という設定で足りる。[学習データの時点][U2-S1]、[モデルの知識・学習データの締切][U2-S2]

5-2は、LLMの知識全部を文書へ限定せず、「このアプリでどのツールが利用でき、どう頼むかを伝える」という問題に絞る。通常の生成では学習済みの重みと現在の入力の両方を使う、という既存の結論と整合する。[concept-facts K6・K7](../concept-facts/report.md)

### 2. 定義データからモデル入力への整形には担当がある

「開発者が定義をデータとして用意し、渡すときにモデル向けの表現へ整える」は、この章の関数ツールでは言える。すべての方式で同じJSONが、そのまま同じ場所に入るわけではない。

| 方式 | 入力化の担当・表現 | 図への反映 |
|---|---|---|
| Anthropic API | tools、設定、systemからAPI側がツール用のsystem promptを構築する。 | `name / description / input_schema`はAPIへ渡す定義データと表示する。[定義][U2-S3] |
| Hugging Face | `tools`のschemaをchat templateがモデル用の文字表現へ整形する。Python関数からschemaを作る方法もある。 | schemaと整形後の入力を分ける。[tools引数][U2-S4]、[template][U2-S5] |
| gpt-oss / Harmony | 公開例ではdeveloperメッセージに`namespace functions`等で道具を示し、rendererがトークン列にする。 | Anthropicのsystem表現と同じ実形式のようにつなげない。[Harmony][U2-S6] |

定義だけを渡しても、実装本文が自動で渡るわけではない。HFの関数からschemaを作る処理も実装本文を利用しない。一方、別途ソースコードを入力することまで不可能とは言わない。[HFの関数・schema変換][U2-S4]

目的、使う条件、入力の意味を明確に書くことをAnthropicは推奨している。説明の長さだけで選択精度が保証される、とは言わない。定義は入力トークンを使うため、「一度に渡す定義を増やすほど、入力も長くなる」が適切。必要なものだけを読み込む構成もあり、保有するツール総数と毎回の入力量は同じではない。[定義の書き方][U2-S3]、[トークン消費][U2-S7]

### 3. 呼び出しもトークン生成だが、共通の一枚の開始札はない

gpt-ossはHarmony形式で学習されており、Llama 3の技術報告にも、関数定義・問い・呼び出しや複数段の利用を含む学習の記述がある。「こうした形式の呼び出しも書けるように学習させる」は言える。ツールを一つ増やすたびにアプリ開発者が再学習する必要がある、という意味にはしない。[Harmony][U3-S1]、[Llama 3論文 §4.3.5][U3-S3]

公開gpt-ossの生成コードは次のトークンを選んで追加し、指定された停止トークンや上限で生成を終える。このコードと公開形式を合わせれば、呼び出しもトークンを順に生成する、という説明を裏付けられる。これはコード読解による判断で、すべての非公開APIの生成制約を検証したものではない。[生成コード][U3-S5]

一方、Harmonyでは宛先がheaderにあり、引数が本文にある。`to=`、関数名、channel名等は一つの共通「呼び出し開始トークン」ではない。Llama 3.1には`<|python_tag|>`を使う例があるが、別形式の例もある。「名前と入力を一つのJSONへ入れ、始まりと終わりの印で挟む」は**教材の模式例**に限定する。[Harmony][U3-S1]、[Llama 3.1の複数形式][U3-S2]、[特殊トークン定義][U3-S4]

したがって、5-3の最初の一トークンの二択確率図は、宛先・印・入力を順に書く図に替えるのが最も整合する。確率図を残すなら、そのような開始トークンを用いる特定形式の模式図であり、数値も作例である、と二重に限定する。

### 4. 終端トークン、APIの停止理由、ツールの実行を分ける

取得日のHarmony資料では、引渡しの`<|call|>`、完了の`<|return|>`、メッセージ区切りの`<|end|>`を区別する。Llama 3.1の引渡しには`<|eom_id|>`の例がある。これらの表記と、Anthropic APIが返す`stop_reason: "tool_use"`は別の層の情報である。[Harmony][U3-S1]、[tokenizer定義][U3-S4]、[Llama 3.1][U3-S2]、[APIの停止理由][U4-S3]

API利用側のアプリが、生の終端トークンを毎回直接見張る必要はない。「モデルを動かす側が生成を止め、アプリは呼び出しの名前と入力を受け取る」とすれば担当が混ざらない。その後に実行するのもモデル外であり、client toolsは利用アプリ側、server toolsは提供元側で処理する。[agent-facts B1・B2](../agent-facts/report.md)、[公開モデルの外部executor][U3-S2]

呼び出しと承認は別である。外側の規則によって自動実行される場合も、拒否・確認になる場合もある。5-3.14〜15を「毎回、人が確認するから勝手に動かない」という保証にはしない。[Claude Agent SDKの許可判定][U4-S1]

### 5. 結果の追加、再生成、画面表示は別々の処理

結果は呼び出しと対応づけて次の入力へ加える。Anthropicではassistantの`tool_use`に対応する`tool_result`をuserメッセージ内に置く。OpenAIのChat Completionsでは`role: tool`、Responsesでは`function_call_output`を使う。このAPI上のuserを、人が手入力したという意味にしない。[結果の構造][U4-S6]、[OpenAI Function calling](https://developers.openai.com/api/docs/guides/function-calling)（B2から引継ぎ）

「結果を加えた文書を、次の生成の入力にする」は言える。「頭からもう一度」は、既に処理した前半も必ず全再計算するように聞こえるため外す。論理上の入力、APIでの履歴管理、キャッシュによる計算再利用は別である。[assistant-facts A5](../assistant-facts/report.md)、[Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)、[Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)（既存調査から引継ぎ）

`tool_use`と`end_turn`は正常例の主な分岐として使えるが、生成上限など別の停止もある。`end_turn`は正答を検証した印ではなく、空の応答になる場合もある。また、答えは生成途中から配信・表示できる。「終了してから初めて表示する」を一般原理にしない。[停止理由][U4-S3]、[Anthropic streaming][U4-S2]、[OpenAI streaming][U4-S4]

呼び出しや進捗を画面へ出すかどうかはアプリの設計で変わる。公式のDesktop文書にも呼び出しの要約・詳細表示の例がある。ここでの途中経過は、利用可能な呼び出し・結果・進捗等を指す。[表示モード][U4-S5]

### 6. 反復回数はモデル出力と外側の制御の両方に左右される

外側のアプリやSDKが、モデル生成、実行、結果の追加、次の生成を反復する構成は妥当。天気を読み、雨なら検索し、最後に回答する順は、説明用の逐次例として維持できる。どのモデルも同じ回数や順序を選ぶという実測事実ではない。[Claude Agent SDK loop][U5-S1]、[OpenAI Agents SDKのloop説明][U5-S6]

この図の一周をモデル呼出し一回を中心とする処理と数えるなら、雨の例は**3周・ツール2回**、晴れの例は**2周・ツール1回**になる。一つの応答で複数の呼び出しを出せるので、一周とツール一回を一般に同一視しない。複数要求の生成と、外部処理の実際の並行実行も別である。[並列呼び出し][U5-S2]

回数に上限を付けるSDKの例はある。ただし各SDKの`max_turns`等の数え方を、この教材の「周」と同一視しない。呼び出し方の指定、実行可否、上限も外側が管理するので、5-5.12の「回すだけ」は外す。[Claudeの上限][U5-S1]、[OpenAIのmax_turns使用例][U5-S5]、[tool_choice][U5-S3]

5-5の旧9行は擬似コードと明記し、少なくとも`tool_use`、`end_turn`、その他の停止を分ける。非`tool_use`をすべて正しい最終回答として扱う`else`は使わない。回数上限を設け、実APIのblock構造や呼出しIDの処理は抽象化していると示す。[停止理由][U4-S3]、[結果処理][U4-S6]。旧コードとの照合は [log.md](log.md) Unit 5に記録した。

### 7. 年はAPI提供の出来事として示し、用語は維持する

OpenAIの2023-06-13はfunction callingのAPI追加、Anthropicの2024-05-30はtool useの一般提供である。後者にはそれ以前のbetaがある。「広く使えるようにした」を、普及率や技術の発明年の意味にはしない。[OpenAI公式発表](https://openai.com/index/function-calling-and-other-api-updates/)、[Anthropic一般提供発表](https://www.anthropic.com/news/tool-use-ga)（B4から引継ぎ）、[beta終了のrelease notes][U5-S4]

「ツール」「ツールの定義／ツール定義」「ツール呼び出し」「ツール結果」は公式日本語文書にも用例がある。「ツールの結果」という語りも意味を保つ。function callingを「関数呼び出し」とすることと、すべてのツールを単一のプログラミング言語の関数に限定することは別である。唯一の標準訳を決める調査ではない。[Anthropic公式日本語文書][U5-S3]

## 全71文の判定と言い換え

原文は固定された第1稿を再掲した。「限定」の条件は直後の文や図注で共有してよく、各文に同じ断りを繰り返す必要はない。表のU番号は末尾の一次資料一覧、B・A・K等は既存調査の項目に対応する。


### 5-1（16文）

| 文ID | 第1稿の原文 | 判定 | 理由・必要な言い換え | 根拠 |
|---|---|---|---|---|
| 5-1.1 | チャットボットを作っていて、「あしたの京都の天気は？」と聞かれたとしましょう。 | 言える | 京都の天気を尋ねる作例の設定。 | 固定原稿 |
| 5-1.2 | LLM が学んだのは、学習に使った文章だけで、あしたの天気は、まだどこにも書かれていなかったわ。 | 言えない | 学習済み知識と最新情報を分ける。「学習で身に付けた知識だけでは、あしたの京都の最新の予報は確かめられないわ。いま渡した文書にも、予報は入っていないの。」 | [U2-S1][U2-S1]・[U2-S2][U2-S2]、既存[K6](../concept-facts/report.md)/[K7](../concept-facts/report.md) |
| 5-1.3 | このまま続きを書かせると、それらしい天気を、もっともらしく書いてしまうかもしれないの。 | 言える | 根拠のない天気を生成する可能性であって、必ず捏造するとは言っていない。図の出力は作例。 | [既存assistant-facts](../assistant-facts/report.md)、[本調査Unit 2](log.md#unit-2-学習時点ツール定義の入力化説明の効果) |
| 5-1.4 | 一方で、天気の予報を返してくれるプログラムなら、もうあるわね。 | 言える | 天気予報を取得して返す外部機能を用意する設定。特定の実在サービスの精度・稼働は主張しない。 | 既存[B1](../agent-facts/report.md)、[U3-S1][U3-S1]の天気ツール例 |
| 5-1.5 | でも、LLM にできるのは、文章の続きを書くことだけで、プログラムを動かすことはできないの。 | 限定すれば言える | テキスト生成を担うモデルと実行環境を分ける。「ここでLLMがするのは、続きをトークンで書くことよ。外のプログラムを動かすには、別の仕組みが要るの。」 | [U3-S2][U3-S2]・[U3-S5][U3-S5]、既存[A2](../assistant-facts/report.md) |
| 5-1.6 | そこで、プログラムを動かす役は、アプリに任せるの。 | 言える | 外側のアプリに実行を任せる設計。 | 既存[B1](../agent-facts/report.md)/[B2](../agent-facts/report.md)/[A2](../assistant-facts/report.md) |
| 5-1.7 | LLM には、答えの代わりに、「京都の天気予報を調べたい」という頼みを書かせるのよ。 | 限定すれば言える | 普通の文は概念を先に見せる表現。「頼みを、まずふつうの言葉で表してみましょう」と添えるか、図へ「頼みの意味」を表示。実APIが自由文だけを実行する図にはしない。 | [U3-S1][U3-S1]・[U3-S2][U3-S2]、原稿の段階的説明方針 |
| 5-1.8 | アプリは、その頼みを読んでプログラムを動かし、返ってきた予報を、文書に書き足すわ。 | 言える | 外側が呼出しを処理し結果を入力へ加える正常例。文7の概念図という条件を引き継ぐ。 | 既存[B1](../agent-facts/report.md)/[B2](../agent-facts/report.md)、[U4-S6][U4-S6] |
| 5-1.9 | それをもう一度 LLM に読ませれば、予報を手がかりにして、答えを書けるわね。 | 言える | 結果を回答の手がかりにできる。正確な回答を保証する文にしない。 | 既存[B1](../agent-facts/report.md)/[B2](../agent-facts/report.md) |
| 5-1.10 | ずんだもん: LLM が、自分で調べに行ったわけじゃないのだ？ | 言える | モデル自身と外側の実行を分けるための問い。 | [U3-S2][U3-S2] |
| 5-1.11 | ええ。LLM は頼みを書いただけで、プログラムを動かしたのは、アプリよ。 | 言える | モデルが要求を書き、外側が実行したというこの例の説明。 | 既存[B1](../agent-facts/report.md)/[A2](../assistant-facts/report.md)、[U3-S2][U3-S2] |
| 5-1.12 | こうして、アプリが LLM の頼みで動かすプログラムを、ツールと呼ぶわ。 | 限定すれば言える | 全toolの厳密な定義にしない。「こうしてLLMから利用できるようにつないだ機能を、ツールと呼ぶわ。」外側にはAPI提供元の実行機構も含む。 | 既存[B1](../agent-facts/report.md)、[U5-S3][U5-S3] |
| 5-1.13 | LLM がツールを使う頼みを書くことは、ツール呼び出しと呼ばれているの。 | 言える | 用語は妥当。実行との区別を強めるなら「こうした、ツールを使うための頼みを、ツール呼び出しと呼ぶの」。 | [U5-S3][U5-S3] |
| 5-1.14 | ツールの場所には、入力を受け取って、結果を返すものなら、何でも置けるの。 | 限定すれば言える | 接続・対応形式が必要。「アプリから呼び出せる形につなげば、いろいろな機能をツールにできるの。」 | 既存[B1](../agent-facts/report.md)/[R3](../agent-facts/report.md)/[S1](../agent-facts/report.md)、[U4-S6][U4-S6] |
| 5-1.15 | 天気のほかにも、検索、計算機、コマンドを打つシェルなど、いろいろなものがあるわ。 | 言える | 検索・計算・shellは外部ツールの例として妥当。 | 既存[R3](../agent-facts/report.md)/[S1](../agent-facts/report.md)、[U3-S2][U3-S2] |
| 5-1.16 | この章では、この一回のやりとりを、順に細かく見ていきましょう。 | 言える | 章の案内。5-5で反復へ進むこととも矛盾しない。 | 固定原稿 |

### 5-2（13文）

| 文ID | 第1稿の原文 | 判定 | 理由・必要な言い換え | 根拠 |
|---|---|---|---|---|
| 5-2.1 | LLM にツール呼び出しを書かせるには、まだ足りないものがあるの。 | 言える | 今回のアプリへ利用可能なツールの情報を加える導入。 | [U2-S3][U2-S3]・[U2-S5][U2-S5] |
| 5-2.2 | LLM が知っているのは、渡された文書に書かれたことだけよ。 | 言えない | 学習済み知識を消してしまう。「でも、このアプリでどの道具を使えるかは、LLMに伝える必要があるわ。」 | 既存[K6](../concept-facts/report.md)/[K7](../concept-facts/report.md)、[U2-S3][U2-S3] |
| 5-2.3 | どんなツールがあって、どう頼めばいいのかが書かれていなければ、頼みようがないわ。 | 限定すれば言える | 訓練で知った形式まで否定しない。「それぞれ何ができて、どう頼むのかを、入力に書いて渡すの。」 | [U2-S3][U2-S3]・[U2-S5][U2-S5]、[U3-S3][U3-S3] |
| 5-2.4 | そこで、アプリには、使えるツールの説明を、文書の頭に書かせておくの。 | 限定すれば言える | 位置やroleはモデル・APIにより異なる。「そこで、使えるツールの説明を、コンテクストに入れておくの。」頭に置くのはこの模式図の約束。 | [U2-S3][U2-S3]・[U2-S5][U2-S5]・[U2-S6][U2-S6] |
| 5-2.5 | 説明には、ツールの名前と、何をするのか、どんな入力を受け取るのかを書くわ。 | 言える | 名前・機能の説明・入力schemaはこの関数ツール定義の主要部。必ずこの三項だけと限定しない。 | [U2-S3][U2-S3]・[U2-S4][U2-S4] |
| 5-2.6 | こうして一つのツールを説明したものを、ツールの定義と呼ぶの。 | 言える | 「ツールの定義」は公式日本語用例あり。 | [U5-S3][U5-S3] |
| 5-2.7 | アプリを作る人は、定義を、決まった形のデータで書いておくの。 | 限定すれば言える | 今回はAPIへ定義データを用意する構成。「この例では、アプリを作る人が、定義を決まった形のデータで用意するわ。」schemaを関数から生成する方法もある。 | [U2-S3][U2-S3]・[U2-S4][U2-S4]・[U2-S5][U2-S5] |
| 5-2.8 | LLM に渡すときには、それが、コンテクストの中に、文字として書き込まれるのよ。 | 限定すれば言える | API JSONとモデル用文字列を同一視しない。「APIの提供元などが、それをモデルに合う書き方に整えて、コンテクストに入れるの。モデルは、その文字をトークンとして受け取るのよ。」 | [U2-S3][U2-S3]・[U2-S5][U2-S5]・[U2-S6][U2-S6] |
| 5-2.9 | 天気のほかに、検索や計算のツールも並べておけば、LLM は、質問に合うものを選んで頼めるわね。 | 言える | 定義を選択に使える。常に最適なツールを選ぶ保証ではない。 | [U2-S3][U2-S3]・[U2-S4][U2-S4] |
| 5-2.10 | ずんだもん: ツールの中のプログラムは、LLM には見えないのだ？ | 言える | 定義と実装の違いを尋ねる問い。回答側に限定が必要。 | [U2-S4][U2-S4] |
| 5-2.11 | 見えないわ。LLM にわかるのは、定義に書かれた言葉だけなの。 | 限定すれば言える | 「定義を渡しただけでは、中のプログラムまでは見えないわ。いまは、定義に書いた説明を手がかりに選ぶのよ。」別途コードを与える方法や学習済み知識を排除しない。 | [U2-S4][U2-S4]、既存[K6](../concept-facts/report.md)/[K7](../concept-facts/report.md) |
| 5-2.12 | だから、何をするツールで、どんなときに使うのかを、定義にわかりやすく書いておくことが大切なのよ。 | 言える | 目的・使用条件・引数の説明を明確にする公式推奨がある。長ければ必ずよいとは言わない。 | [U2-S3][U2-S3]・[U2-S4][U2-S4] |
| 5-2.13 | 定義もコンテクストの一部だから、ツールを増やすほど、読ませる文書も長くなるわ。 | 限定すれば言える | 「定義もコンテクストの一部だから、一度に渡す定義を増やすほど、入力も長くなるわ。」保有数と毎回の入力数を分ける。 | [U2-S7][U2-S7] |

### 5-3（16文）

| 文ID | 第1稿の原文 | 判定 | 理由・必要な言い換え | 根拠 |
|---|---|---|---|---|
| 5-3.1 | 定義が書いてあれば、LLM は、答えの代わりに、ツール呼び出しを書けるわね。 | 限定すれば言える | 形式を扱えるモデルという章の前提を明確にする。「ツールを使うように学習したLLMには、定義を渡して、呼び出しを書かせられるわね。」定義だけで任意のモデルが必ず成功するとはしない。 | [U3-S1][U3-S1]・[U3-S3][U3-S3] |
| 5-3.2 | でも、LLM が書くのは、どれも同じテキストよ。 | 言えない | 特殊tokenや宛先、構造化出力を無視して「どれも同じテキスト」と扱えない。「でも、頼みをふつうの文章だけで書かせたら、どうかしら。」 | [U3-S1][U3-S1]・[U3-S2][U3-S2]・[U3-S4][U3-S4] |
| 5-3.3 | このままだと、アプリには、それが答えなのか、ツールへの頼みなのか、見分けがつかないの。 | 限定すれば言える | 文2を仮定に直し、区別不能とは断定しない。「アプリが、答えとツールへの頼みを、区別しにくくなるわね。」 | [U3-S1][U3-S1]・[U3-S2][U3-S2]、形式からの教材上の推論 |
| 5-3.4 | 頼みだとわかっても、どのツールに何を渡せばいいのかを、自由な文章から読み取るのは大変ね。 | 言える | 自由文から名前・入力を取り出す負担という設計動機。できないとは断定していない。 | [U3-S1][U3-S1]・[U3-S2][U3-S2]、形式からの教材上の推論 |
| 5-3.5 | そこで、ツール呼び出しを書く形を、決めておくの。 | 言える | 呼出しの形式を決める仕組み。 | [U3-S1][U3-S1]・[U3-S2][U3-S2] |
| 5-3.6 | 始まりと終わりに、呼び出しの印を書き、その間に、ツールの名前と入力を書くわ。 | 限定すれば言える | 「この図では、呼び出しの印の間に、名前と入力を書くわ。」単一の共通開始tokenの実在を主張しない。 | [U3-S1][U3-S1]・[U3-S2][U3-S2] |
| 5-3.7 | 名前と入力は、プログラムが読み取りやすい、JSON という形で書くの。 | 限定すれば言える | 「中身は、プログラムが読み取りやすいJSONという形にしてあるの。」名前と入力が一体のJSONなのはこの例。Harmonyでは宛先と引数が別。 | [U3-S1][U3-S1]・[U3-S2][U3-S2] |
| 5-3.8 | そして、この形で書くように、LLM を学習させておくのよ。 | 限定すれば言える | 「こうした形式を使うモデルは、その形式の呼び出しも書けるように学習させてあるわ。」ツール追加ごとの再学習必須という意味を避ける。 | [U3-S1][U3-S1]・[U3-S3][U3-S3] |
| 5-3.9 | 呼び出しを書き始めるかどうかも、次のトークンを選ぶのと同じよ。 | 言える | 「ツール呼び出しも、次のトークンを一つずつ選んで書いていくわ」とすれば単一開始token説と切り離せる。公開実装からの判断。 | [U3-S1][U3-S1]・[U3-S5][U3-S5] |
| 5-3.10 | アシスタントの印のあとで、呼び出しの印が選ばれれば、呼び出しが始まるわ。 | 言えない | gpt-ossを含む共通原理としては成立しない。「その中に、ツールへの頼みだとわかる宛先や印を書いていくの。」 | [U3-S1][U3-S1]・[U3-S2][U3-S2]・[U3-S4][U3-S4] |
| 5-3.11 | 続けて、ツールの名前と入力を、トークンごとに書いていくの。 | 言える | 名前・入力をtoken列として生成する説明は妥当。図6〜7の順序・JSON形式はその作例に限る。 | [U3-S1][U3-S1]・[U3-S5][U3-S5] |
| 5-3.12 | 終わりの印が出たら、アプリはそこで書かせるのを止めて、名前と入力を読み取るわ。答えの終わりの印を見張らせたのと、同じやり方ね。 | 限定すれば言える | 「終わりの印が出たら、モデルを動かす側で生成を止めるわ。アプリは、呼び出された名前と入力を受け取るの。」API利用側がraw tokenを直接監視するとはしない。 | [U3-S1][U3-S1]・[U3-S5][U3-S5]、既存[B1](../agent-facts/report.md)/[B2](../agent-facts/report.md) |
| 5-3.13 | Anthropic の API では、呼び出しで止まったことを、tool_use という値で知らせてくれるわ。 | 言える | client toolへの引渡しを知らせるAnthropic APIの停止理由。特殊tokenそのものではない。 | 既存[B1](../agent-facts/report.md)、[U4-S3][U4-S3] |
| 5-3.14 | ずんだもん: LLM が、勝手にツールを動かしてしまうことは、ないのだ？ | 限定すれば言える | 自動実行がないという誤読を防ぐ。「呼び出しを書いたら、それだけでツールが動くのだ？」 | [U4-S1][U4-S1] |
| 5-3.15 | LLM が書けるのは、呼び出しの文字だけよ。本当に動かすかどうかを決めて、動かすのは、アプリなの。 | 限定すれば言える | 「動かすのは、モデルの外のアプリよ。自動で実行するか、確認を求めるかも、アプリ側で決めておくの。」 | [U3-S2][U3-S2]、[U4-S1][U4-S1]、既存[A2](../assistant-facts/report.md) |
| 5-3.16 | 印の書き方は、モデルごとに違うわ。画面の下は、gpt-oss というモデルの、実際の書き方よ。 | 限定すれば言える | 京都に書き換えた場合は「印や宛先の書き方は、モデルによって違うわ。下は、gpt-ossが使う形式に合わせた例よ。」公式の原例なら「公開資料にある呼び出しの例」。実測出力ではない。 | [U3-S1][U3-S1]、[旧REAL照合](log.md#unit-3-呼出しの学習開始終端jsonとトークンの実例) |

### 5-4（11文）

| 文ID | 第1稿の原文 | 判定 | 理由・必要な言い換え | 根拠 |
|---|---|---|---|---|
| 5-4.1 | アプリは、呼び出しから読み取った名前と入力で、ツールを動かすわ。 | 言える | 実行を許可された正常な呼出しの処理。 | 既存[B1](../agent-facts/report.md)/[B2](../agent-facts/report.md)、[U4-S1][U4-S1] |
| 5-4.2 | でも、返ってきた結果は、アプリの手元にあるだけで、LLM からは見えないの。 | 言える | 結果を次のモデル入力へまだ入れていない段階の説明。 | 既存[B1](../agent-facts/report.md)/[B2](../agent-facts/report.md)、[U4-S6][U4-S6] |
| 5-4.3 | そこで、アプリには、結果に「ツールの結果」という印を付けて、文書に書き足させるの。 | 限定すれば言える | 「そこで、アプリには、どの呼び出しの結果かがわかる形で、文書に書き足させるの。」単一の共通「結果token」があるとはしない。 | 既存[B1](../agent-facts/report.md)/[B2](../agent-facts/report.md)、[U4-S6][U4-S6] |
| 5-4.4 | その後ろに、アシスタントの印だけを、また書いておくわ。 | 限定すれば言える | 「そして、LLMが続きを書ける形に整えるの。」prefixの種類・作成担当はモデルとAPIによる。 | [U2-S5][U2-S5]・[U2-S6][U2-S6]、[U3-S1][U3-S1]・[U3-S2][U3-S2] |
| 5-4.5 | そして、この文書を、もう一度、頭から LLM に読ませるの。 | 限定すれば言える | 「結果を加えた文書を、次の生成の入力にするわ。」入力全体を使う関係はよいが、毎回頭から全文再計算する意味にはしない。 | 既存[K1](../concept-facts/report.md)/[K5](../concept-facts/report.md)/[A5](../assistant-facts/report.md) |
| 5-4.6 | すると LLM は、予報を手がかりにして、その続きに、答えを書いていくわ。 | 言える | 正常例で予報から答える。次の生成が必ず最終回答になるわけではないことは5-5で扱う。 | 既存[B1](../agent-facts/report.md)/[B2](../agent-facts/report.md)、[U5-S1][U5-S1] |
| 5-4.7 | 答えを書き終えたら、こんどは、答えの終わりの印を書くの。 | 限定すれば言える | 「この例では、答えを書き終えたら、応答を終える印を書くの。」語りの「答えの終わり」は応答終了の模式表示で、正確さの検証ではない。 | [U3-S1][U3-S1]・[U3-S4][U3-S4]、[U4-S3][U4-S3] |
| 5-4.8 | アプリは、どちらの印で止まったのかを見て、次にすることを決めるのよ。 | 限定すれば言える | 「アプリは、何のために生成が止まったかを見て、次の処理を選ぶの。」上限等の停止もある。 | [U4-S3][U4-S3] |
| 5-4.9 | 呼び出しの印なら、ツールを動かす。答えの終わりの印なら、答えを画面に出すわ。 | 限定すれば言える | 「この例では、呼び出しならツールを動かし、答えが終わったら、このやりとりを終えるわ。」画面は生成途中から表示可能。 | [U4-S2][U4-S2]・[U4-S3][U4-S3]・[U4-S4][U4-S4] |
| 5-4.10 | ずんだもん: 呼び出しや結果は、画面には出ないのだ？ | 言える | UI設計の自由を確認する問い。 | [U4-S5][U4-S5] |
| 5-4.11 | 出すかどうかも、アプリを作る人が決めるわ。調べている途中のようすを、画面に出すアプリもあるの。 | 言える | 呼出し・結果・進捗の表示はアプリ設計で変わる。非公開の内部思考を全表示するという意味にはしない。 | [U4-S5][U4-S5] |

### 5-5（15文）

| 文ID | 第1稿の原文 | 判定 | 理由・必要な言い換え | 根拠 |
|---|---|---|---|---|
| 5-5.1 | こんどは、「あしたの京都が雨なら、屋内で楽しめる所を教えて」と聞かれたとしましょう。 | 言える | 条件付き旅行相談という作例の設定。 | 固定原稿 |
| 5-5.2 | まず天気を調べて、雨だったら、屋内の場所も調べる必要があるわね。 | 限定すれば言える | ツールで二段階に調べる方針を置いた例。「この例では、まず天気を調べて、雨なら屋内の場所も検索するわ。」その戦略だけが可能とはしない。 | [U5-S1][U5-S1]・[U5-S2][U5-S2]、作例の設計 |
| 5-5.3 | 何回ツールを呼ぶことになるかは、一回めの結果を読むまで、わからないの。 | 限定すれば言える | 「次に何を頼むかは、返ってきた結果によって変わるの。」最初の結果を得れば最終回数まで確定する、という含意を避ける。 | [U5-S1][U5-S1]・[U5-S2][U5-S2] |
| 5-5.4 | そこで、アプリの動きを、くり返しの形に書いておくの。 | 言える | アプリまたはSDKが反復処理を持つ。 | [U5-S1][U5-S1]・[U5-S6][U5-S6] |
| 5-5.5 | LLM に文書を読ませて、呼び出しで止まったら、ツールを動かして結果を書き足し、また読ませるわ。 | 言える | 正常な呼出しで実行・結果入力・再生成を反復する。 | 既存[B1](../agent-facts/report.md)/[B2](../agent-facts/report.md)、[U5-S1][U5-S1] |
| 5-5.6 | 答えの終わりで止まったら、答えを画面に出して、くり返しを抜けるの。 | 限定すれば言える | 「答えを書き終えたら、このくり返しを抜けるの。」表示開始を最終停止の後に限定しない。 | [U4-S2][U4-S2]・[U4-S4][U4-S4]、[U5-S1][U5-S1] |
| 5-5.7 | 一周めでは、LLM が天気のツールを呼んで、雨の予報が返ってくるわ。 | 限定すれば言える | 「この例では、一周めに、LLMが天気のツールを頼んで、雨の予報が返ってくるわ。」作例であることを三周全体へかける。 | [U5-S1][U5-S1]・[U5-S2][U5-S2]、作例 |
| 5-5.8 | 二周めでは、それを読んだ LLM が、こんどは検索のツールで、屋内の見どころを調べるの。 | 限定すれば言える | 「二周めには、それを読んだLLMが、屋内の見どころを検索するよう頼むの。」実行矢印はアプリから出す。 | 既存[B1](../agent-facts/report.md)/[A2](../assistant-facts/report.md)、[U5-S1][U5-S1] |
| 5-5.9 | 三周めで、二つの結果をもとに答えを書いて、終わりの印で止まるわ。 | 限定すれば言える | 「三周めで、二つの結果をもとに答えを書いて終わるわ。」文7の「この例では」を継続し、3周=2呼出しと表示。 | [U5-S1][U5-S1]・[U5-S2][U5-S2]、作例 |
| 5-5.10 | 晴れの予報だったら、二周めで、そのまま答えを書いて終わるわね。 | 限定すれば言える | 「晴れの予報なら、この例では、二周めにそのまま答えて終わるわ。」どのモデルも必ずこの回数とはしない。 | [U5-S1][U5-S1]・[U5-S2][U5-S2]、作例 |
| 5-5.11 | ずんだもん: 何回まわるかは、だれが決めているのだ？ | 言える | モデル出力とアプリの反復制御の関係を尋ねる問い。 | [U5-S1][U5-S1]・[U5-S3][U5-S3] |
| 5-5.12 | LLM が、呼び出しを書くか、答えを書くかで決まるの。アプリは、それに合わせて回すだけよ。 | 言えない | アプリの実行可否・上限・呼出し制御を消せない。「LLMが次の呼び出しを書くか、答えを書き終えるかを見て、アプリが次へ進めるの。」 | [U4-S1][U4-S1]、[U5-S1][U5-S1]・[U5-S3][U5-S3] |
| 5-5.13 | ただ、いつまでも終わらないと困るから、回る回数に、上限を付けておくこともできるわ。 | 言える | 回数の上限を設けられる。教材の「周」を特定SDKのmax_turnsと同一視しない。 | [U5-S1][U5-S1]・[U5-S5][U5-S5] |
| 5-5.14 | OpenAI は 2023 年に、Anthropic は 2024 年に、こうしたツールの使い方を、API で広く使えるようにしたの。 | 限定すれば言える | 「OpenAIは2023年に、関数呼び出しをAPIへ加えたわ。Anthropicは2024年に、ツール使用のAPIを一般提供にしたの。」発明年や普及率を主張しない。 | 既存[B4](../agent-facts/report.md)、[U5-S4][U5-S4] |
| 5-5.15 | 次の章では、このツールの場所に、いろいろなものをつないでいきましょう。 | 言える | 次章の案内。つなぐにはアプリから呼べる契約が要るという文1.14の限定を引き継ぐ。 | 固定原稿、既存[B1](../agent-facts/report.md) |

## 決めたこと6項目の判定


1. **5本の並びと題名**：維持可能。ツール→定義→呼出し→結果→反復という構成に事実上の矛盾はない。「ツールの定義」は[日本語の公式用例][U5-S3]の用例あり。
2. **京都のあしたの天気**：題材は維持。ただし「学習文章にまだ書かれていなかったから」という採用理由は5-1.2の修正に合わせて撤回し、最新予報を外部から入れる必要のある例と位置づける。「未来の実際の天気」と「いま公表されている予報」を分ける。図の24℃・晴れ・雨は説明用。
3. **三つのツール**：`get_weather(city)`、`search_web(query)`、`calculate(expression)`は教材が定義する契約の例として可能。実在API共通の関数名・引数ではない。追加の整合点：天気の入力がcityだけなので、この作例の定義を「その都市の、あしたの予報を返す」と明示するか、「日別予報を返し、その中からあしたを読む」とする必要がある。日付を入力で選べると描くなら引数追加が要る。検索も「関係する文章を返す」はこのツールの仕様であり、すべての検索APIの返却形式ではない。
4. **LLM・アプリ・画面・ツールの配置**：維持可能。物理的な所在地の図ではなく役割の模式図とする。呼出しと結果は入力文書の位置から動いてよいが、実際の実行を起こす主体はアプリの箱で示す。API提供元のserver toolや入力整形もモデル外であり、すべてが利用者端末にある意味にはしない。旧layoutとの互換性は実装課題なので本調査では検証していない。
5. **印の外枠色**：紫=外側が入力へ用意するもの、墨=生成するものという図の約束は使える。固定された共通token一覧や全APIでの生成境界を主張しない。rendererがassistant headerの一部までprefixとして用意する形式もある。朱=要求、緑=結果は教材の凡例であり、仕様の色ではない。
6. **5-1末尾の章内目次**：事実上の問題なし。目次は5-2の定義、5-3の要求、5-4の結果、5-5の反復に対応する。

## 絵の方針5項目の判定

| 図 | 維持できる核 | 必要な修正・限定 |
|---|---|---|
| 5-1 | 問い→生成された頼み→外部実行→結果→回答。noLinkで直接実行ではないことを示す。 | 予報・温度・出力に「例」。根拠のない「晴れ」と取得例の「晴れ」が同じでも、正しさを実証したとは見せない。自由文の頼みは「頼みの意味」。noLinkは外側の接続が不要という意味にしない。 |
| 5-2 | 定義データを用意し、モデル入力へ整形する過程。名前・説明・入力の三部を指す。 | `name/description/input_schema`はAnthropic APIへの入力データと明記。システムの印・頭への配置は模式図。API側での整形を一段示す。gpt-oss実形式はdeveloperに置くので、Anthropic JSONからそのまま同じsystem本文になると描かない。実装を薄くする場面は「定義だけでは実装は渡らない」とする。 |
| 5-3 | 形式を決めて要求を生成し、外側が停止・処理する。公開形式の例を添える。 | 最初の1tokenの二択確率図は、共通原理やgpt-oss実測としては不適切。宛先・印・引数を順に生成する図へ変更が最も整合する。残す場合は特定形式の模式図かつ確率は例と明記。JSONは模式例、Harmonyは別枠の実形式例。stop_reasonはAPI側へ配置。o200k_baseの通常文字分割とo200k_harmonyの特殊tokenを区別。京都へ変更後の分割は未検算。 |
| 5-4 | 実行結果の追加、次の入力、回答生成、応答終了。 | 結果に呼出しとの対応を示す。紙束を毎回全再計算する動きにしない。tool_use/end_turnをAnthropic APIの停止理由と表示し「正常例。上限等の停止もある」。画面への表示開始を必ずend_turnの後としない。 |
| 5-5 | 条件付き検索の3周と、晴れなら2周という作例。履歴に2組の要求・結果が積もる。 | コードは「擬似コード」。非tool_useをすべて回答とする旧elseを直し、end_turn／その他の停止を分け、回数上限を表す。単一呼出し例と明示し、1周に複数呼出しも可能と補足。「3周／ツール2回」を分けて数える。年はAPI追加とGAの区別を札へ出す。 |


この横断表の根拠は、[定義の仕様][U2-S3]、[template][U2-S5]、[Harmony][U3-S1]、[tokenizer][U3-S4]、[停止理由][U4-S3]、[結果の対応][U4-S6]、[並列呼び出し][U5-S2]と、上の文別判定に示した既存根拠。配置・色・札の置き方は、それらを踏まえた制作上の提案である。

## gpt-ossの実形式例を載せる場合

京都にそろえるなら、取得日の公式形式に合わせた次の**作例**を使える。対応する`get_weather(city)`の定義をあらかじめ入力へ含める前提であり、京都の問いに対する実測出力ではない。headerの順序はこれだけに限られない。[Harmony][U3-S1]

```text
<|start|>assistant<|channel|>commentary to=functions.get_weather <|constrain|>json<|message|>{"city":"京都"}<|call|>
```

名前はheaderの宛先、本文は引数JSONとなる。模式図の「名前と入力が一つのJSON」とは別枠で示す。旧クリップのREALは公式のSan Francisco例に沿うもので、京都の実行ログではない。

gpt-ossのencoding名は`o200k_harmony`。公開コード上、通常文字の分割規則・語彙は`o200k_base`から引き継ぐが、特殊トークンを追加している。通常のJSONの分割を示すことと、特殊トークンの表記を文字として分割することを混同しない。京都へ書き換えたJSONの正確な分割・個数は未検算であり、旧東京例の16片をそのまま流用できるとは結論しない。[tokenizer定義][U3-S4]、[旧実装の照合記録](log.md)

## 残る不確実性

| 未確認事項 | 報告の結論への影響・扱い |
|---|---|
| 閉じたAPIの内部トークン列・非公開の学習詳細 | 公開のAPI構造と公開モデル形式を分ければ、章の説明に不要。非公開の実態を推定して断定しない。 |
| Anthropicの最初のbeta開始日 | 一次資料で未確定。2024-05-30の一般提供という説明には影響しない。 |
| gpt-oss公開当時の厳密なbyte表記 | 今回は取得日のDocs/mainを参照し、commit固定の歴史再現はしていない。「公開当時の生出力」と表示しない。 |
| 京都JSONの実際のトークン区切り | 制作時にその文字列を検算するか、厳密な分割図として提示しない。 |
| 京都の予報・温度・検索結果・生成確率・呼出し順 | すべて説明用の作例。実測値や実際のモデルの成功例と表示しない。 |
| 旧layoutとの互換性、字幕、完成動画の視認性・発音 | 実装・制作段階の確認事項。本調査では検証していない。 |

これらを未確認としたままでも、上記の限定を採用すれば原稿の事実確認は完了する。実機での成功や完成動画の品質を検証済みとする報告ではない。

## 問いと計画の変化

原質問は最後まで「第1稿の事実確認」のままで、別の問いへ置き換わっていない。初期計画の6単元は、①原稿と既存根拠、②学習時点と定義、③呼び出し形式、④実行・結果・停止・表示、⑤ループ・年・用語、⑥全件照合として完了した。[詳細な調査ログ](log.md)

- **追究した派生問い**：「cityだけで、どの日の予報を返すのか」。原稿の契約の整合に必要なためUnit 6で扱った。推奨は、定義を「その都市の、あしたの予報を返す」と明記すること。日別予報から選ぶ設定も可能。実在サービスを新たに調査する必要はなく、Plan revision 2で単元内の解消を記録した。
- **保留した派生問い**：大量のツール定義を必要時だけ読み込む仕組みの設計・性能比較。今回は「一度に渡す定義」の限定で足りる。
- **保留した派生問い**：権限モデルの詳細比較、ツール結果中の指示への防御。今回は実行主体と承認の有無を分ける範囲にとどめた。
- **保留した派生問い**：Anthropicの最初のbeta公開日。Plan revision 1で、一般提供日だけを使うことを決め、一次資料で確定しない追加探索を終了した。

## 推奨する次の対応

1. 第1稿の5-1.2、5-2.2、5-3.2／10、5-5.12を先に置き換え、文別表の限定を語り・図注へ反映する。5本の順序と京都の例は維持できる。
2. 図を、模式図・APIデータ・公開モデル形式の三つに分けて表示する。特に5-2の入力整形、5-3の開始札とHarmony、5-4の停止理由と表示開始をそろえる。
3. 天気ツールの定義に「あした」を明記し、予報・温度・確率・検索・出力には作例とわかる札を付ける。5-5は「3周・ツール2回」を区別し、擬似コードに正常終了以外の分岐と上限を示す。
4. 制作時に京都JSONの分割を確認し、語りの分割・字幕・動き・発音・旧layout互換性を通常の制作手順で確かめる。本報告の提案を採用しただけで、これらの検証が済んだ扱いにはしない。
5. 後の章で大量ツール、権限・安全性、技術史の初出を主題にする場合だけ、上の保留事項を別調査にする。この章の完成条件へ追加しない。

## 出典と取得日

### 引き継いだ調査

既存の確定事項は再調査していない。今回のローカル再読日はすべて2026-10-15 UTC。外部資料の取得日は次のとおり。

| 表中の記号 | 既存報告 | 外部資料の取得日 | 今回引き継いだ範囲 |
|---|---|---|---|
| B1〜B4、R3、S1 | [agent-facts](../agent-facts/report.md) | 2026-10-09 UTC | client/server tools、各APIの呼出し・結果、公開形式、公開年、検索・シェルの例。 |
| A2、A5、assistant-facts | [assistant-facts](../assistant-facts/report.md) | 2026-10-14 UTC | アプリの範囲、終端、履歴・計算の再利用等。 |
| K1、K5〜K7 | [concept-facts](../concept-facts/report.md) | 2026-10-14 UTC | 生成・停止・パラメータ・コンテクスト。報告基準日は2026-10-15。 |
| P1〜P3 | [prompt-terms](../prompt-terms/report.md) | 2026-10-15 UTC | コンテクストとプロンプトの用例・範囲。 |

引継ぎの主要な一次資料URLは、[OpenAI Function calling](https://developers.openai.com/api/docs/guides/function-calling)、[Anthropic tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)、[Bash tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/bash-tool)、[GPT-2 model code](https://github.com/openai/gpt-2/blob/master/src/model.py)、[Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)、[Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)、[Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)、[Context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。各資料と主張の対応は既存報告および本報告の論点別節を参照。

公開年の根拠は、[OpenAI公式発表（発表日2023-06-13）](https://openai.com/index/function-calling-and-other-api-updates/)と[Anthropic公式発表（発表日2024-05-30）](https://www.anthropic.com/news/tool-use-ga)。いずれも2026-10-09 UTC取得のB4から引き継いだ。発表日と取得日を区別している。

### 今回追加確認した一次資料

以下はすべて**2026-10-15 UTC取得**。同じURLを別の問いに用いた場合も、ログの資料番号を保った。コードのmainや公式文書は更新されうるため、ここでの結論は取得日時点の内容に基づく。

- U2-S1：[Claudeの学習データの時点](https://support.claude.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data)。
- U2-S2：[Claude models overview](https://platform.claude.com/docs/en/models/overview)。
- U2-S3：[Anthropic: Define tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)。
- U2-S4：[Hugging Face: Extra chat template features](https://huggingface.co/docs/transformers/en/chat_extras)。
- U2-S5：[Hugging Face: Writing a chat template](https://huggingface.co/docs/transformers/en/chat_templating_writing)。
- U2-S6：[OpenAI Harmony（定義・renderer）](https://developers.openai.com/cookbook/articles/openai-harmony)。
- U2-S7：[Anthropic: Tool use overview（入力トークン等）](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)。
- U3-S1：[OpenAI Harmony（呼出し・終端）](https://developers.openai.com/cookbook/articles/openai-harmony)。
- U3-S2：[Meta Llama 3.1 prompt format](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/prompt_format.md)。
- U3-S3：[The Llama 3 Herd of Models, §4.3.5](https://arxiv.org/html/2407.21783v3)。
- U3-S4：[OpenAI tiktoken: openai_public.py](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken_ext/openai_public.py)。
- U3-S5：[OpenAI gpt-oss: TokenGenerator.generate](https://raw.githubusercontent.com/openai/gpt-oss/main/gpt_oss/torch/model.py)。
- U4-S1：[Claude Agent SDK: Configure permissions](https://code.claude.com/docs/en/agent-sdk/permissions)。
- U4-S2：[Anthropic: Streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming)。
- U4-S3：[Anthropic: Stop reasons and fallback](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons)。
- U4-S4：[OpenAI: Migrate to Responses, streaming consumers](https://developers.openai.com/api/docs/guides/migrate-to-responses#7-update-streaming-consumers)。
- U4-S5：[Claude Desktop: Switch view modes](https://code.claude.com/docs/en/desktop#switch-view-modes)。
- U4-S6：[Anthropic: Handle tool calls](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls)。
- U5-S1：[Claude Agent SDK: How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop)。
- U5-S2：[Anthropic: Parallel tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use)。
- U5-S3：[Anthropic: ツール使用（日本語）](https://platform.claude.com/docs/ja/agents-and-tools/tool-use/overview)。
- U5-S4：[Anthropic API release notes](https://platform.claude.com/docs/en/release-notes/overview)。
- U5-S5：[OpenAI Agents SDK: max_turns使用例](https://developers.openai.com/cookbook/examples/agents_sdk/computer_use_with_daytona/computer_use_with_daytona#run-the-agent)。
- U5-S6：[OpenAI Agents SDK: loopの説明](https://developers.openai.com/cookbook/examples/agents_sdk/migrate-from-claude-agent-sdk/readme)。


### ローカル資料

2026-10-15 UTC再読：[AGENTS.md](../../AGENTS.md)、[docs/spec.md §6.6](../../docs/spec.md)、[対象README](../../decks/llm/README.md)、[旧toolcall.js](../../decks/llm/clips/toolcall.js)、[旧toolloop.js](../../decks/llm/clips/toolloop.js)。旧コードは原稿中のREAL・token分割・9行のループとの対応を読むために参照した。動作検証はしていない。

固定した対象段のUTF-8 SHA-256（見出しを除く本文）：`22549556eafe5e06f315476293c9979d21345420e5633c5c1c9328da8895a636`。原稿の全文と取得経緯は [log.md](log.md) Unit 1、全件照合はUnit 6に保存した。

[U2-S1]: https://support.claude.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data
[U2-S2]: https://platform.claude.com/docs/en/models/overview
[U2-S3]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
[U2-S4]: https://huggingface.co/docs/transformers/en/chat_extras
[U2-S5]: https://huggingface.co/docs/transformers/en/chat_templating_writing
[U2-S6]: https://developers.openai.com/cookbook/articles/openai-harmony
[U2-S7]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
[U3-S1]: https://developers.openai.com/cookbook/articles/openai-harmony
[U3-S2]: https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/prompt_format.md
[U3-S3]: https://arxiv.org/html/2407.21783v3
[U3-S4]: https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken_ext/openai_public.py
[U3-S5]: https://raw.githubusercontent.com/openai/gpt-oss/main/gpt_oss/torch/model.py
[U4-S1]: https://code.claude.com/docs/en/agent-sdk/permissions
[U4-S2]: https://platform.claude.com/docs/en/build-with-claude/streaming
[U4-S3]: https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
[U4-S4]: https://developers.openai.com/api/docs/guides/migrate-to-responses#7-update-streaming-consumers
[U4-S5]: https://code.claude.com/docs/en/desktop#switch-view-modes
[U4-S6]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
[U5-S1]: https://code.claude.com/docs/en/agent-sdk/agent-loop
[U5-S2]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use
[U5-S3]: https://platform.claude.com/docs/ja/agents-and-tools/tool-use/overview
[U5-S4]: https://platform.claude.com/docs/en/release-notes/overview
[U5-S5]: https://developers.openai.com/cookbook/examples/agents_sdk/computer_use_with_daytona/computer_use_with_daytona#run-the-agent
[U5-S6]: https://developers.openai.com/cookbook/examples/agents_sdk/migrate-from-claude-agent-sdk/readme
