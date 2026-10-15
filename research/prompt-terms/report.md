# 「プロンプト」の導入：事実確認

## 要約と判定方法

**3-1でモデルへの入力文章を「プロンプト」と名付け、4-2で利用者が入力した文を指す用法も説明する構成は妥当。** 両方に一次資料の用例がある。画面の一部分と、その回にモデルへ渡す入力全体を指し分ければよい。ただし、これは教材で扱う二つの用法であり、promptの意味を網羅した排他的な二分類ではない。system promptという部分名や、画像を含む用法もある。[InstructGPT 付録A.2.2][IG]、[Anthropic Prompt caching][A2]、[ChatGPTヘルプ][H1]、[Claudeヘルプ][H3]

**明確化を優先するのは、4-2.2の入力全体、4-4.2の評価対象、3-3.2のベクトルの差の向き。** 「約1万3千件のプロンプト」はInstructGPTのSFT訓練入力12,725件を丸めた値として使える。「頼みに沿う」を「指示に沿う」へ変える方針にも日本語の一次用例がある。[InstructGPT 表6・9][IG]、[LLM-jp][J2]、[Mikolovほかの単語関係の研究][V3]

対象は、ボス提示の全17文と図の指示対象。基準日・外部資料取得日・ローカル資料確認日は **2026-10-15 UTC**。論文の発表年や版とは区別する。動的な公式文書は取得時点の内容を根拠とし、過去版を復元したものではない。調査の経過、取得箇所、固定した原稿は[log.md](log.md)に記録した。

| 判定 | 文数 | 意味 |
|---|---:|---|
| 言える | 14 | 指定された図と前後で妥当。全製品共通の定義・仕様という意味ではない。 |
| 限定すれば言える | 3 | 指す範囲や対象を明確にする必要がある。 |
| 言えない | 0 | 原文の主張を取り消す必要がある文はない。 |

言い換え案は、めたんの常体で使える事実確認案。語り・字幕・図の最終編集は制作担当へ渡す。AGENTS.md、spec、READMEの指定段、先行報告を踏まえ、必要な根拠を原論文・公式文書で再確認した。書込みは本調査のlog.mdとreport.mdのみ。原稿・実装・録り・Git・システム設定の変更、モデル実行、音声合成、ブラウザ再生は行っていない。

## P1〜P6の結論

| 問い | 結論 | 主な根拠 |
|---|---|---|
| P1 モデルへの入力をpromptと呼ぶ範囲 | 指示・例・履歴等を含む入力全体を指す用例がある。GPT-3論文には指示部分だけをpromptと呼ぶ箇所もある。APIの計数欄は別途仕様を確認する。 | [GPT-3 §2・2.4][GPT3]、[InstructGPT A.2.2][IG]、[OpenAI][O1]、[Anthropic][A2]、[Google][G1] |
| P2 利用者の入力をpromptと呼ぶ用法 | 三社のチャットヘルプ、画像生成の公式説明、日本の公的資料で確認できる。文字だけ、命令文だけに限らない。使用頻度の統計ではない。 | [ChatGPT][H1]、[Gemini][H2]、[Claude][H3]、[Midjourney][I2]、[デジタル庁][J1] |
| P3 二用法の関係と説明の限界 | 両立する。今回の図で指す範囲を示す説明が適切。全入力が普通の文章、利用者の入力がモデル入力と常に同一、という定義へ広げない。 | [Anthropic][A2]、[Context engineering][E1]、[DALL·E 3][I1]、[SD3実装][I6] |
| P4 InstructGPTの件数・由来 | SFT・RM・PPOの訓練prompt数は12,725・33,207・31,144。SFTとRMはラベラー作成分を含む。API利用者由来の人の選好評価と区別する。 | [InstructGPT §3.2・3.6・4.1、表6・9][IG] |
| P5 提示17文と図 | 14文は維持可能、3文は限定を明確にする。3-1の命名、3-7の窓、few-shotとSFTの区別、ベクトルの成分数の説明は使える。 | 下記の全17文の表と図の確認 |
| P6 instruction followingの呼び方 | 動詞句は「指示に沿う／従う」、名詞は「指示追従」に一次用例がある。「指示に沿う」を採用する方針は妥当。 | [LLM-jp][J2]、[OpenAI日本語][J3]、[言語処理学会論文][J4] |

## P1・P2：promptが指す範囲

### 入力全体を指す用法

InstructGPTの付録A.2.2には、性格設定、過去のHuman/AI発言、次のAI発言開始印までを一つのpromptとするchat例がある。直近の利用者の一文だけに限らない直接例である。一方、GPT-3論文の§2.4では自然言語の指示部分をpromptと呼ぶ箇所があるため、「論文では常に入力全体という一つの意味」とはまとめない。[InstructGPT][IG]、[GPT-3][GPT3]

三社の開発者文書も、promptに複数の要素を含めている。

| 資料群 | 確認できる用法 |
|---|---|
| OpenAI | 指示、例、追加の背景資料をpromptの構成として扱う。キャッシュ文書では、developerメッセージ、ツール定義、会話履歴などを含む整形済みcontextを扱う。過去のassistant出力も次回の入力になる。[Prompt engineering][O1]、[Prompt caching][O2]、[Conversation state][O3] |
| Anthropic | promptの全体を`tools`、`system`、`messages`の順で説明する。system promptはその全体の一部になりうる。[Prompt caching][A2] |
| Google | 指示・例・背景情報・答える対象をpromptに含める。system instructionや履歴も入力の計数対象である。[Prompt design strategies][G1]、[Tokens][G2] |

3-1では、途中までの文章を与えて続きを書く場面の**最初に与えた部分**を名付ければよい。promptは命令文でなければならない、という条件はない。Googleにも途中までの入力の続きを生成する説明がある。[Google Partial input completion][G1]

### 利用者の入力を指す用法

| 資料群 | 確認できる用法と限界 |
|---|---|
| ChatGPTヘルプ | 応答を引き出すために利用者が入れる入力をpromptと説明する。画像・音声などの形も挙げる。[H1][H1] |
| Gemini Appsヘルプ | テキスト欄にpromptを入力・送信し、送ったpromptを編集する手順がある。画像・ファイルも追加できる。[H2][H2] |
| Claudeヘルプ | 質問や依頼をpromptの例とし、チャット欄へ入力して送信する手順を示す。[H3][H3] |
| デジタル庁 | テキストベースの生成AIを使う検証の説明で、プロンプトを大規模言語モデルへの入力文と説明する。内部の全入力と利用者の文を厳密に分類した定義ではない。[J1][J1] |
| 画像生成 | Midjourneyは望む絵を伝える文字・句をpromptと呼び、一語の場合も挙げる。DALL·E 3にも利用者の入力をpromptと呼ぶ用例がある。[I2][I2]、[I1][I1] |

したがって4-2.1は、利用者の吹き出しを指しているなら維持できる。「ふつう」は三社等に用例があるという範囲で理解し、使用頻度を測定した主張にはしない。3-1とのつながりを明示する任意の案は、**「チャットボットでは、ユーザーが直接入力するこの文も、プロンプトと呼ばれているわ。」**。原文の誤りを直すために必須という意味ではない。

## P1・P3：トークン計数、窓、課金を分ける

**`prompt_tokens`や`input_tokens`という名前だけから、同じ範囲を数えているとは判断できない。** 取得した文書では次の相違がある。表は用語調査の補足であり、モデル別価格や制限の完全な一覧ではない。

| API・欄 | 範囲・注意 | 根拠 |
|---|---|---|
| OpenAI Chat Completions `usage.prompt_tokens` | promptのトークン数。`prompt_tokens_details`に内訳があり、生成分は`completion_tokens`。 | [Chat API][O4]、[CompletionUsage][O5] |
| OpenAI Responses `usage.input_tokens` | キャッシュ分を含む総入力。取得版の費用計算では、`input_tokens_details.cached_tokens`と`cache_write_tokens`を総入力から引いて通常入力分を求める。 | [Prompt caching][O2] |
| Anthropic Messages `usage.input_tokens` | キャッシュ使用時は最後のキャッシュ境界より後の非キャッシュ入力分。総入力は`input_tokens + cache_read_input_tokens + cache_creation_input_tokens`。 | [Prompt caching][A2] |
| Anthropic token-counting endpoint | system・tools・画像・PDF等を含む構造化入力の見積り。生成時のusageの同名欄とは役割が違う。自動追加のsystem最適化分を含むことがあり、その追加分は非課金とする注記もある。 | [Token counting][A1] |
| Gemini generateContent `usageMetadata.promptTokenCount` | キャッシュ分を含む有効なpromptの総数。`cachedContentTokenCount`は内数。`toolUsePromptTokenCount`、`thoughtsTokenCount`、候補出力は別欄で、`totalTokenCount`はそれらも含む。 | [UsageMetadata][G3] |
| Gemini Interactionsのusage | 入力・出力・thinking・cached・tool useを別の欄で返す説明。generateContentの欄名と混ぜない。 | [Tokens][G2] |

OpenAIの会話状態の文書では、会話をIDで継続する方式でも以前の入力分が次の入力課金対象になる。Anthropicの窓の文書では、キャッシュされたprefixも窓を占める。入力に含めること、呼出し元から全文を再送すること、再計算すること、課金されることは区別する。[Conversation state][O3]、[Context windows][A3]

OpenAI・Anthropicは窓にその回の入力と出力・推論用の部分を含めて説明する。一方、Googleの取得版は共有の窓を持つ世代と、入力・出力に別の予算を持つ世代を区別する。3-7の図は説明対象の自己回帰型LLMの参照範囲として使い、全APIの「入力上限」の数値にそのまま置き換えない。[O3][O3]、[A3][A3]、[G2][G2]

隠れた指示や非課金の追加分についての注記もあるため、usageの課金数が内部の全トークンを完全に開示しているとは保証できない。入力文字列だけのトークナイズ結果を、窓・課金・毎分上限の共通値にする根拠にもならない。[O2][O2]、[A1][A1]

## P3：エージェント・画像生成まで広げた場合の限界

Anthropicのcontext engineering記事は、推論時に含めるsystem instructions、tools、外部資料、履歴等をcontextとして管理する説明をする。その対比でprompt engineeringを主に指示の書き方として扱う。これはprompt全体というAPI文書の用法と範囲が違う。**promptとcontextの境界は、文書の目的に応じて読む必要がある。** また、ファイルのパスを持ち、必要になってから内容を読む構成や履歴の要約もあるため、参照可能な全ファイル・過去の全会話が毎回の入力になるわけではない。[Context engineering][E1]

system欄の指示をsystem prompt、利用者の要求をuser promptと呼ぶ公式の用例もある。ツール結果は次の入力に入るが、Anthropicでは`user` role内の`tool_result`として返す方式がある。roleがuserだから人間が直接書いた文、とは判断できない。[Prompting best practices][E3]、[Computer use][E4]、[Handle tool calls][E2]

画像生成については、次の反例が一般化の限界を示す。

| 論点 | 確認した例 | 制作上の含意 |
|---|---|---|
| 利用者の入力とモデル用入力 | DALL·E 3の説明では、ChatGPTが利用者のアイデアから詳しいpromptを作る。[I1][I1] | 画面に入れた文と画像モデルへの文が一致するとは限らない。 |
| テキストのトークン化 | SD3 Mediumは三つのテキストエンコーダを使う。固定版DiffusersはCLIP系・T5系tokenizerとencoderを持ち、IDから埋め込みを作って画像生成の条件に使う。[I4][I4]、[I5][I5]、[I6][I6] | 「トークナイザに掛ける文章」という特徴だけではLLMの文章生成を定義できない。 |
| 画像を含むprompt | Midjourneyには文字と画像の併用、複数画像だけを使う方法がある。[I3][I3] | promptを常に文章だけへ限定しない。画像自体を文字用tokenizerへ入れるという意味でもない。 |
| negative prompt等 | SD3の固定版実装は`negative_prompt`や埋め込みを直接渡す引数を持つ。[I5][I5] | 全入力が一つの文章欄を通るわけではない。negative promptは通常の文に禁止を書くことと同一仕様ではなく、除外の成功保証でもない。 |

以上は、3-1の「この文章」という局所的な命名を否定しない。今回の語りでは文字の例に対象を絞り、system/user prompt、画像、ツール、複数encoderの詳細は制作注記に置くことを勧める。context engineeringを新たな必須用語として3章・4章へ加える必要もない。これは資料を合わせた教材上の判断である。

## P4：InstructGPTの件数・学習・評価

表6は件数をprompts単位で示し、表9に合計がある。**約1万3千件はSFTの訓練12,725件**である。[InstructGPT 付録A.3・A.4][IG]

| データ | 訓練：ラベラー作成 | 訓練：API利用者由来 | 訓練合計 | 検証：ラベラー作成 | 検証：API利用者由来 | 検証合計 |
|---|---:|---:|---:|---:|---:|---:|
| SFT（手本の学習） | 11,295 | 1,430 | **12,725** | 1,550 | 103 | **1,653** |
| RM（報酬モデル） | 6,623 | 26,584 | **33,207** | 3,488 | 14,399 | **17,887** |
| PPO | — | 31,144 | **31,144** | — | 16,185 | **16,185** |

API由来はPlaygroundからの入力で、本番API利用のデータではない。SFTには同じ指示に異なるfew-shot例を付けたデータ点があり、独立した指示の種類数とは異なる。RMでは一つのpromptに4〜9出力を順位付けするため、prompt数は比較対数でもない。PPO用入力には人の正解ラベルを付けていない。[InstructGPT §3.2、付録A.3][IG]

主たる人の選好評価には、訓練に含まれない利用者のAPI由来promptを用いる。表9のtest setは3,196件だが、図3の各条件で全件使った数や比較回数と同一視しない。公開NLPベンチマーク等の別の評価もある。[InstructGPT §3.6・4.1、図3、表9][IG]

現行の[rlhf.js](../../decks/llm/clips/rlhf.js)では4-4.2の後に13億対1750億の選好結果が続くので、評価場面と読むことができる。推奨案は **「2022 年の InstructGPT の評価では、API の利用者から集めたプロンプトへの答えを、人に比べてもらったの。」**。RM訓練全体の由来を説明する場所へ移すなら、ラベラー作成分も必要になる。

回答部分だけの予測を手本と比べる4-3.3には、TRLとLlama 2の公開例が根拠になる。promptを損失から外しても入力から消すわけではない。TRLには全体を対象にする設定もある。「ここでは」を保ち、InstructGPT自身の非公開maskを再現した図とは説明しない。[TRL SFT Trainer][S1]、[Llama 2 §3.1][S2]

## P5：全17文の判定

原文はボス提示分をそのまま掲載する。表中の短い案は最終台本ではなく、事実確認上の候補である。

### 3-1・3-7：入力と窓

| ID | 原文 | 判定 | 条件・言い換え案 | 根拠 |
|---|---|---|---|---|
| 3-1.1 | 最初に LLM に読ませる、この文章のことを、プロンプトと呼ぶわ。 | 言える | 維持。文字の続きを生成する図の初期入力を指す。全promptが文章だけという定義へ広げない。 | [IG A.2.2][IG]、[O1][O1]、[G1][G1] |
| 3-7.1 | プロンプトだけでなく、書いていく答えも、この窓の中に入っていくわ。 | 言える | 維持。この自己回帰型LLMの窓の模式図として使う。APIの入力上限だけ、課金トークンだけを指す図とはしない。 | [O3][O3]、[A3][A3]、[G2][G2] |

[inside.js](../../decks/llm/clips/inside.js)では、最初のWORDSを「プロンプト」、後続ADDEDを「LLM が書き足した部分」とする。その回の生成を区切る札として提示条件と合う。生成した文が次回の呼出しで履歴として入力になることとも両立する。[Conversation state][O3]

[context.js](../../decks/llm/clips/context.js)はWIN=96、FIRST=64、ANSWER=20で、入力と生成部分を同じ枠へ描く。「イメージ」「この例では96トークン」の札がある。後半の歴史的なモデル上限の棒や書籍換算の再監査は今回の17文の対象外であり、この判定で再承認したものではない。

### 4-1：プロンプトの中の例

| ID | 原文 | 判定 | 条件・言い換え案 | 根拠 |
|---|---|---|---|---|
| 4-1.1 | たとえば、このモデルに、『日本の首都はどこですか？』というプロンプトだけを与えた場面を考えてみましょう。 | 言える | 維持。「場面を考える」という説明用例。日本語の出力を実測として扱わない。 | [先行報告A1](../assistant-facts/report.md)、[base.js](../../decks/llm/clips/base.js) |
| 4-1.2 | 逆に、プロンプトの形を整えてやると、続きも変わるわ。 | 言える | 入力構成が続きへ影響するという意味で可。必ず違う出力になる保証や正解保証にはしない。任意の案「プロンプトの形を整えると、答えの形で続きを書きやすくなるわ。」 | [GPT-3 §2・3.2][GPT3]、[G1][G1] |
| 4-1.3 | 2020 年の GPT-3 の論文では、質問と答えの例をプロンプトに入れて、新しい質問に続きを書かせる方法も、試しているの。 | 言える | 維持。few-shotの質問応答に対応。論文内のpromptの用語法が一つに統一されているという主張にはしない。 | [GPT-3 §2・3.2・付録G][GPT3]、[G1][G1] |
| 4-1.4 | このとき、パラメータは変えていないわ。 | 言える | 維持。そのfew-shot推論の間に重みを更新しないという意味。 | [GPT-3 §2][GPT3] |
| 4-1.5 | 例は、プロンプトの中にあるだけなの。 | 言える | 維持。その場面で追加する手本は入力に置かれる。事前学習に似た例がなかったという主張にはしない。 | [GPT-3 §2][GPT3] |

### 4-2：利用者の文と入力全体

| ID | 原文 | 判定 | 条件・言い換え案 | 根拠 |
|---|---|---|---|---|
| 4-2.1 | 生成 AI を使うときに、ユーザーが直接入力するこの部分は、ふつう、プロンプトと呼ばれているわ。 | 言える | 利用者の吹き出しを指すなら維持可。任意の案「チャットボットでは、ユーザーが直接入力するこの文も、プロンプトと呼ばれているわ。」 | [H1][H1]、[H2][H2]、[H3][H3]、[J1][J1] |
| 4-2.2 | LLM から見たプロンプトは、こうして整えた文書の全体なの。 | 限定すれば言える | 文字の会話の、その回に渡す全入力という範囲。案「LLM に渡すときは、こうして整えた文書全体を、プロンプトと呼んでいるの。」後からsystemを足す時の接続も必要。 | [IG A.2.2][IG]、[O1][O1]、[A2][A2]、[G1][G1] |

**4-2.2は語の正しさに加え、図の表示順を合わせる必要がある。** 調査時の[template.js](../../decks/llm/clips/template.js)では、次の順序だった。

| 印 | 表示・説明 |
|---|---|
| a2 | 利用者の吹き出しを指し、promptと呼ぶ。 |
| e → e2 | assistant開始印を置き、履歴・最新利用者文・開始印を入力全体として囲む。systemの行は囲みに入らない。 |
| f | 生成を始める。e2の囲みは既に消えている。 |
| h以降 | systemの指示を初めて示し、system promptと名付ける。 |

この順序は、まず指示なしの例を見せてから指示を追加する説明なら成立する。現在の順序を保つ場合は、systemを足す時に **「この指示も、LLM に渡すプロンプトの一部なの。」** と結ぶことを勧める。最初から同一のsystem付き呼出しの全体を示す構成に変えるなら、生成前にsystemも出して全体を示す。どちらも、今生成した答えを同じ回の初期promptに含めて囲まない。これは資料とコードの照合からの制作提案であり、変更済みという報告ではない。[Anthropicの全体とsystemの区分][A2]、[System promptの用法][E3]

### 4-3・4-4：手本・比較・評価

| ID | 原文 | 判定 | 条件・言い換え案 | 根拠 |
|---|---|---|---|---|
| 4-3.1 | 印で会話の形を整えても、それだけで、指示に沿った答えを出せるとは限らないわ。 | 言える | 維持。形式は能力の保証ではない。「指示に沿う」は一次用例とも整合する。 | [IG][IG]、[J2][J2]、[先行報告A2・A3](../assistant-facts/report.md) |
| 4-3.2 | そこで、プロンプトと、望ましい答えの手本を用意するの。 | 言える | 維持。promptと望ましい応答の組。人が書く手本は今回の例とし、SFTの手本の由来をすべて人手へ限定しない。 | [IG][IG]、[S1][S1]、[S2][S2] |
| 4-3.3 | ここでは、プロンプトを手がかりにして、答えの部分の予測を、手本と比べているわ。 | 言える | 「ここでは」を維持。回答のみの損失の公開例を示す。promptも入力に残る。InstructGPTのmask実装を再現した図とはしない。 | [S1][S1]、[S2 §3.1][S2] |
| 4-3.4 | 2022 年の InstructGPT では、人の手本を使う学習に、約 1 万 3 千件のプロンプトを使ったの。 | 言える | 維持。SFT訓練12,725件。人数、検証数、独立した指示・答えの種類数、比較対数とは異なる。 | [IG 表6・9][IG] |
| 4-4.1 | 同じプロンプトに、モデルが書いた答えを、いくつか並べるわ。 | 言える | 維持。InstructGPT型の比較学習の説明。図の三つは説明用で、論文のRMは一入力に4〜9出力を順位付けした。 | [IG §3.2・3.5][IG] |
| 4-4.2 | 2022 年の InstructGPT の実験では、利用者から集めたプロンプトへの答えを、人に比べてもらったの。 | 限定すれば言える | 人の選好評価を指す範囲。案「2022 年の InstructGPT の評価では、API の利用者から集めたプロンプトへの答えを、人に比べてもらったの。」RM訓練全体の由来へ転用しない。 | [IG §3.2・3.6・4.1][IG]、[rlhf.js](../../decks/llm/clips/rlhf.js) |

### 3-3：ベクトルの二文

| ID | 原文 | 判定 | 条件・言い換え案 | 根拠 |
|---|---|---|---|---|
| 3-3.1 | ベクトルに並ぶ数の個数は、モデルによって違うわ。 | 言える | 維持。ここでは一トークン分の表現の次元数を指す。大きさを測るノルムとの混同を避けられる。 | [GPT-3 表2.1][GPT3]、[V4 §2.1][V4]、[V5 §2.3.2・2.3.11][V5] |
| 3-3.2 | 言葉の関係が、ベクトルの向きにも表れていた、ということね。 | 限定すれば言える | 単語対の差を指す。案「言葉の関係が、ベクトルの差の向きにも表れていた、ということね。」2013年の英語の単語研究という限定を保つ。 | [V2 §1.1][V2]、[V3 §5][V3] |

GPT-3の`d_model`はSmallが768、Mediumが1,024、175Bが12,288であり、成分数がモデルによって異なる例になる。異なるモデルが同じ次元を採用する可能性を否定する文ではない。[GPT-3 表2.1][GPT3]

2013年の研究は、一定の関係を持つ単語対の差に規則性が現れることを扱う。King − Man + WomanからQueenに近い表現が得られるという例も、厳密な等式や全モデル共通の法則ではない。研究の近さの基準にはcosine similarityを用いる。[Mikolovほか][V2]、[Mikolov・Yih・Zweig §5][V3]

[embedding.js](../../decks/llm/clips/embedding.js)の矢印は男→女と王→女王の移動を表すため、「差」を補うと指示対象が明確になる。図の「英語の単語の研究」「2013」「イメージ」を維持し、手で置いた平面座標を実測の埋め込みとして見せない。コード上、二本の矢印を平行に置く一方、計算点GUESSは別の座標に置かれている。図を数値計算の実演として扱う場合は、制作時に配置と計算の整合を別途確認する必要がある。今回、配置の変更や実モデルでの測定はしていない。

## P6：「指示に沿う」の呼び方

LLM-jpはインストラクションチューニングを、利用者の指示に沿った出力を得るための学習として説明する。OpenAIの日本語記事には「指示に従う」、日本語研究にはinstruction followingに対応する「指示追従」の用例がある。[LLM-jp][J2]、[OpenAI日本語][J3]、[原田ほか §1][J4]

今回の使い分けは次の形でよい。唯一の標準訳や最頻表記を認定したものではない。

| 何を述べるか | 使う呼び方 |
|---|---|
| モデルに与える入力、手本と組にする入力、その件数 | プロンプト |
| 出力が要求へ適合する振る舞い | 指示に沿う／指示に従う |
| 能力・性能の専門的な名詞 | 指示追従 |
| 3-3で名前を付けた数の組 | ベクトル |

promptには指示以外に例・履歴・資料等も入るため、promptとinstructionを同義に固定しない。3-1の途中までの文章を「指示文」へ言い換える必要はない。これは一次用例を合わせた本調査の整理である。

## 残る不確実性

- 各社の非公開テンプレートや隠れた指示の全内容は分からない。利用者ヘルプから実際のモデル入力を完全には復元できない。
- InstructGPTの損失maskの具体的実装は今回確認できない。回答だけの損失の根拠はTRL・Llama 2等の公開例である。
- 日本語全体の用語使用頻度、唯一の標準定義、各学習方式の採用率は測っていない。
- 全モデルの窓・入出力上限・価格・課金境界、画像生成の全方式やnegative promptの効き方は網羅していない。固定版の実装例を、現在の全製品の仕様へ広げない。
- 英語の2013年の単語類推を、現代LLMや日本語で再現する測定はしていない。図の軸に意味の名前を付けられるかも本調査の対象外である。
- コードの表示順を読んだが、字幕・語り・図の同期、見やすさ、音声の読みは未検証。事実確認の結果は視聴確認の代わりにならない。

## 問いと計画の経緯

出発点は、モデルの入力文章と利用者の入力文をどちらも「プロンプト」と呼ぶ構成の妥当性だった。ローカル資料、原論文、三社API文書、利用者ヘルプ、日本語資料、エージェント文書、画像生成、ベクトル、全17文の横断判定という9調査単元を完了した。元の問いを別の問いに置き換える必要はなかった。

| 派生した問い・発見 | 判断と対応 |
|---|---|
| 同じ`input_tokens`でも総入力を指すとは限らない。計数欄をpromptの定義に使えるか。 | 原稿の範囲を決めるため追究。Unit 3でAPIごとの違いを整理し、Plan revision 1を追記。後続Unit 6は部分名とcontext、Unit 9は窓の図へ重点を絞った。単元の追加・削除・順序変更はない。 |
| 二用法で用語全体を分類できるか。 | GPT-3の指示部分、system/user prompt、context engineeringの用例を追究。網羅的な二分類ではなく、図で指す範囲の説明と整理した。 |
| 利用者の文がアプリで書き換えられる画像生成もあるか。 | P3に必要なのでUnit 7でDALL·E 3を確認した。 |
| 「向き」は単語ベクトル自体か差か。 | 3-3.2の判断に必要なのでUnit 8で原論文と図を照合し、差の方向と確認した。 |
| 入力全体を名付ける時点にsystemが含まれるか。 | P3・P5に必要なのでUnit 9で表示順を調査。後から加える指示も全体の一部と結ぶ案を示した。 |
| 非公開入力の復元、全価格・上限表、現代モデルでの類推再現、全画像方式の性能比較 | 元の導入判断に不要なので保留。将来それらを主張する場合の追加調査・測定へ回す。 |

最新のPlan revision 1に対する全調査単元を完了後、専用の報告ターンで本報告を作成した。

## 推奨する次行動

1. 制作担当が4-2.2、4-4.2、3-3.2の限定を原稿と図へ反映する。4-2のsystemを出す順序は、上記二案のどちらを採るかに合わせる。
2. 3-1の初期入力と生成部分の札、3-7の模式図、4-1の説明用の日本語例、3-3の2013年・英語の研究・イメージの札を保つ。
3. READMEの制作注記に、InstructGPTの件数と由来、評価との区別、SFTの損失の根拠、promptの非排他的な用法、ベクトルの差という条件を残す。API計数や画像生成の詳細は、語りに詰め込まず参照可能にする。
4. 採用後、制作担当が字幕の指示対象と図の範囲を通し再生で確認する。ベクトルの図を計算の実演にする場合は、説明用座標の整合も確認する。
5. 保留した性能・内部実装・上限等を後で述べる場合は、対象モデルと版を決めて追加調査する。今回の報告をその代わりの根拠にはしない。

## 出典一覧

以下の外部資料の取得日はすべて **2026-10-15 UTC**。題名後の日付は発表年・公開日・固定した版を表す。確認節の詳細は[log.md](log.md)の各Unitにある。

| ID | 一次資料 | 主な確認箇所 |
|---|---|---|
| GPT3 | [Brownほか, Language Models are Few-Shot Learners][GPT3]（2020、arXiv v4） | §2・2.1・2.4・3.2、表2.1、付録G |
| IG | [Ouyangほか, Training language models to follow instructions with human feedback][IG]（2022、v1） | §3.2・3.6・4.1、図3、A.2.2、表6・9 |
| O1 | [OpenAI Prompt engineering][O1] | Message formatting、Examples、Context |
| O2 | [OpenAI Prompt caching][O2] | キャッシュ対象、usage、費用計算 |
| O3 | [OpenAI Conversation state][O3] | 履歴、previous_response_id、窓 |
| O4・O5 | [OpenAI Chat API][O4]／[Completions API][O5] | CompletionUsage、prompt_tokens |
| A1 | [Anthropic Token counting][A1] | 構造化入力と見積り |
| A2 | [Anthropic Prompt caching][A2] | promptの構成、入力計数 |
| A3 | [Anthropic Context windows][A3] | 窓、thinking、compaction |
| G1 | [Google Prompt design strategies][G1] | 入力、途中からの生成、few-shot |
| G2 | [Google Understand and count tokens][G2] | 履歴、system、tools、窓、Interactions |
| G3 | [Google Generating content / UsageMetadata][G3] | promptTokenCount等 |
| H1 | [ChatGPT Prompt engineering best practices][H1] | What is a prompt? |
| H2 | [Gemini Apps Help: Use Gemini Apps][H2] | 入力・送信・編集 |
| H3 | [Claude Help: Get started with Claude][H3] | promptの説明、チャット欄 |
| J1 | [デジタル庁・行政における生成AIの技術検証][J1]（2024-05-13公開、05-17更新） | 検証内容、投稿プロンプト一覧の紹介 |
| J2 | [LLM-jp-13B v2.0 公開][J2]（2024-04-30） | インストラクションチューニング |
| J3 | [OpenAI 言語モデルを指示に従わせるためのアライメント][J3]（記事日付2022-01-27） | 取得時点の日本語版の用語 |
| J4 | [原田ほか、複数の指示追従成功率を個々の指示追従成功率から推定する][J4]（NLP2025） | §1・2 |
| E1 | [Anthropic Effective context engineering for AI agents][E1]（2025-09-29） | promptとの対比、必要時の読込み、要約 |
| E2 | [Anthropic Handle tool calls][E2] | client toolの結果、role、型 |
| E3 | [Anthropic Prompting best practices][E3] | Give Claude a role |
| E4 | [Anthropic Computer use tool][E4] | user prompt、agent loop |
| I1 | [OpenAI DALL·E 3][I1] | promptをChatGPTで整える説明 |
| I2 | [Midjourney Prompt Basics][I2] | promptの説明、単語・句 |
| I3 | [Midjourney Image Prompts][I3] | 画像と文字、複数画像 |
| I4 | [Stability AI SD3 Medium Diffusers model card][I4] | Model Description |
| I5 | [Hugging Face Diffusers SD3文書][I5]（v0.30.3固定） | tokenizer、encoder、prompt関連引数 |
| I6 | [Hugging Face Diffusers SD3コード][I6]（v0.30.3固定） | `_get_clip_prompt_embeds`、生成ループ |
| V2 | [Mikolovほか, Efficient Estimation of Word Representations in Vector Space][V2]（2013、v3） | §1.1 |
| V3 | [Mikolov・Yih・Zweig, Linguistic Regularities in Continuous Space Word Representations][V3]（2013） | §1・5、図2の説明 |
| V4 | [Goodfellowほか, Deep Learning, Chapter 2][V4] | §2.1 |
| V5 | [Zhangほか, Dive into Deep Learning, Linear Algebra][V5] | §2.3.2・2.3.11 |
| S1 | [Hugging Face TRL SFT Trainer][S1] | completionのみ／全体の損失 |
| S2 | [Touvronほか, Llama 2][S2]（2023、v2） | §3.1 Fine-Tuning Details |

ローカル資料は、[AGENTS.md](../../AGENTS.md)、[spec](../../docs/spec.md)、[LLMデッキREADME](../../decks/llm/README.md)の2026-10-15「4章を作り直す」「自己回帰型と呼ぶ」の段と3章原稿、[assistant-facts](../assistant-facts/report.md)、[llm-facts](../llm-facts/report.md)、および上記の各clipコードを参照した。先行報告の外部取得日と今回の再読日は別であり、今回の主要論点は列挙した原典で確認した。

[GPT3]: https://arxiv.org/html/2005.14165v4
[IG]: https://arxiv.org/html/2203.02155v1
[O1]: https://developers.openai.com/api/docs/guides/prompt-engineering
[O2]: https://developers.openai.com/api/docs/guides/prompt-caching
[O3]: https://developers.openai.com/api/docs/guides/conversation-state
[O4]: https://developers.openai.com/api/reference/resources/chat
[O5]: https://developers.openai.com/api/reference/resources/completions
[A1]: https://platform.claude.com/docs/en/build-with-claude/token-counting
[A2]: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
[A3]: https://platform.claude.com/docs/en/build-with-claude/context-windows
[G1]: https://ai.google.dev/gemini-api/docs/prompting-strategies
[G2]: https://ai.google.dev/gemini-api/docs/tokens
[G3]: https://ai.google.dev/api/generate-content#UsageMetadata
[H1]: https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt
[H2]: https://support.google.com/gemini/answer/13275745?hl=en
[H3]: https://support.claude.com/en/articles/8114491-get-started-with-claude
[J1]: https://www.digital.go.jp/news/19c125e9-35c5-48ba-a63f-f817bce95715
[J2]: https://llm-jp.nii.ac.jp/blog/blog-369/
[J3]: https://openai.com/ja-JP/index/instruction-following/
[J4]: https://www.anlp.jp/proceedings/annual_meeting/2025/pdf_dir/A2-1.pdf
[E1]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[E2]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
[E3]: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
[E4]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool
[I1]: https://openai.com/index/dall-e-3/
[I2]: https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics
[I3]: https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts
[I4]: https://huggingface.co/stabilityai/stable-diffusion-3-medium-diffusers
[I5]: https://huggingface.co/docs/diffusers/v0.30.3/en/api/pipelines/stable_diffusion/stable_diffusion_3
[I6]: https://github.com/huggingface/diffusers/blob/v0.30.3/src/diffusers/pipelines/stable_diffusion_3/pipeline_stable_diffusion_3.py
[V2]: https://arxiv.org/html/1301.3781v3
[V3]: https://aclanthology.org/N13-1090.pdf
[V4]: https://www.deeplearningbook.org/contents/linear_algebra.html
[V5]: https://d2l.ai/chapter_preliminaries/linear-algebra.html
[S1]: https://huggingface.co/docs/trl/sft_trainer
[S2]: https://arxiv.org/html/2307.09288v2
