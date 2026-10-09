# LLM解説デッキ：24項目のファクトチェック

## 要約と判定方法

**24項目中、confirmed（確認）17件、corrected（修正）7件。** 修正対象は **H1・H2・H4・H7・C6・T2・A4**。各項目全体を uncertain とする必要はなかったが、C6の「誰でも利用できるAPIとして世界最大」という解釈は未確定である。confirmed も、下表に示した対象・条件・出典への帰属を伴う判定とする。

出典の取得・確認日はすべて **2026-10-09 UTC**。研究開始は同日16:53:01 UTC。作成環境の日付表示とは区別し、レポート作成によって調査時点を更新したことにはしない。原論文、公式発表・仕様・コード、裁判所文書を優先し、利用者数の推計には出典を明示した報道を用いた。引用の原版と再版、論文初投稿と製品公開、プレビューと一般提供、評価の旧版と新版を分けている。検証過程・取得方法・追加出典は [log.md](log.md) に記録した。

画面に反映すべき主要な修正は、Shannonの原版の文字と句点、Turingの組版、Transformerの「attentionだけ」という説明、公開日のイベント名、APIごとの会話状態管理、MCPの製品別対応時期である。現在値は、長文コンテキストなら公開モデルの公称値、METRなら測定版と取得日を添えて使う。

## 全項目の判定表

主表は指定IDごとに1行、計24行。長い引用・年表・測定値は後続の補足に収めた。

| ID | Status | 正しい値・表現 | 出典 | 短い注記 |
|---|---|---|---|---|
| H1 | corrected | Shannon, *A Mathematical Theory of Communication*, BSTJ 27、1948年7月・10月。§3の指定5例の1948年原版は、ゼロ次の文字列が `FFJEYVKCQSGXYD`。5例とも末尾のピリオドなし。全文は引用補足。 | [1948年原版 p.388](https://www3.nd.edu/~powers/ame.20231/shannon1948a.pdf)、[訂正再版 §3](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf) | 提示されたHと末尾句点は訂正再版に一致。原版引用としては修正が必要。記号集合には空白も含む。 |
| H2 | corrected | Turing, *Computing Machinery and Intelligence*, Mind 59(236), 1950年10月、pp.433–460。表示用正規化は `I propose to consider the question, ‘Can machines think?’`。 | [原版アーカイブ p.433](https://turingarchive.kings.cam.ac.uk/publications-lectures-and-talks-amtb/amt-b-19)、[出版社書誌](https://doi.org/10.1093/mind/LIX.236.433) | 原版は小型大文字・曲線の一重引用符・組版上の空きあり。閉じ引用符の後に句点を足さない。文字による模倣ゲームという説明は妥当。 |
| H3 | confirmed | MITのJoseph Weizenbaum、CACM 9(1)、1966年1月、pp.36–45。DOCTORはロジャーズ派心理療法家を模したスクリプト。キーワードと分解・再構成規則を用いる。提示8行は語句・大小文字・文末記号が一致。 | [1966年論文 pp.36–37](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf)、[1976年著書序論の再録](https://cyborgdigitalculture.files.wordpress.com/2013/09/24-weizenbaum-03.pdf) | 秘書の逸話は1976年の本人の回想。1966年論文の記述や、機械が理解した証拠として扱わない。 |
| H4 | corrected | 8著者、arXiv初投稿2017-06-12、当時の学会名はNIPS 2017。「再帰・畳み込みを使わず、attentionで系列の依存関係を扱う」。big modelは8基のNVIDIA P100で約3.5日。 | [論文・投稿履歴](https://arxiv.org/abs/1706.03762)、[本文 §§3, 5.2](https://arxiv.org/pdf/1706.03762) | FFNなどもあるため「attentionしか使わない」は不正確。Google中心、Toronto所属のGomezを含み同氏の作業はGoogle Brainで実施。 |
| H5 | confirmed | GPT＝Generative Pre-trained Transformer。初代2018-06-11・約117M、GPT-2発表2019-02-14・約1.5B、最大重み公開2019-11-05。GPT-3初投稿2020-05-28・175B、学習で処理したトークン数300B。few-shot引用は補足のとおり。 | [GPT発表](https://openai.com/index/language-unsupervised/)、[GPTの展開形](https://openai.com/index/gpts-are-gpts/)、[GPT-2発表](https://openai.com/index/better-language-models/)、[最大モデル公開](https://openai.com/index/gpt-2-1-5b-release/)、[GPT-3論文](https://arxiv.org/abs/2005.14165) | 300Bは一意なコーパス量とは違う。図の `plush girafe` はfが1個のまま引用する。 |
| H6 | confirmed | ChatGPT研究プレビュー2022-11-30。約5日で100万ユーザーはAltmanの2022-12-05発表。2023年1月の約1億MAUはUBSの推計。TikTok約9か月、Instagram約2年半という当時の比較もReutersにある。 | [OpenAI発表](https://openai.com/index/chatgpt/)、[Altman発言の同時代報道](https://indianexpress.com/article/technology/tech-news-technology/openai-chatgpt-crosses-1-million-users-ceo-says-they-might-have-to-monetise-this-8306997/)、[Reuters配信記事](https://www.investing.com/news/economy/chatgpt-sets-record-for-fastestgrowing-user-base--analyst-note-2993773) | ChatGPTはUBS／Similarweb、比較2社はSensor Towerが出所。「当時」「推計」「月間」を省かない。 |
| H7 | corrected | 指定の暦日は概ね正しい。BERTは2018-10-11論文初投稿、o1は2024-09-12のo1-preview／o1-mini、Codexは2025-05-16クラウド版研究プレビューと記す。全日付と出典は年表補足。 | [BERT投稿履歴](https://arxiv.org/abs/1810.04805)、[o1-preview](https://openai.com/index/introducing-openai-o1-preview/)、[Codex cloud](https://openai.com/index/introducing-codex/) | 論文・発表・限定公開・GAを「発売」の一語にまとめない。Claude CodeはpreviewとGAを分ける。 |
| C1 | confirmed | GPT-4o → `o200k_base`（約20万）、GPT-4／GPT-3.5-turbo → `cl100k_base`（約10万）。GPT-2は50,257。 | [tiktoken対応表](https://github.com/openai/tiktoken/blob/main/tiktoken/model.py)、[encoding定義](https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py) | 定義済みトークン数と最大ID＋1は異なる。画面の概数は妥当。 |
| C2 | confirmed | Mikolov et al.の2013年1月論文§1.1に `vector(”King”) - vector(”Man”) + vector(”Woman”)` があり、Queenのベクトルが最も近いと説明する。 | [Efficient Estimation, p.2](https://arxiv.org/pdf/1301.3781)、[引用元のMikolov・Yih・Zweig論文](https://aclanthology.org/N13-1090/) | 正確な等式ではない。1月論文自体が先行のRNN埋め込み研究を引用している。 |
| C3 | confirmed | GPT-3 **175B版**は96層、`d_model=12,288`、96 attention heads、文脈長2,048トークン。 | [GPT-3論文 Table 2.1／§2.1](https://arxiv.org/pdf/2005.14165) | 全GPT-3サイズ共通の値ではない。 |
| C4 | confirmed | 2024-04-18公開のLlama 3（8B／70B）は**15兆超のトークンで事前学習**。 | [Meta発表](https://ai.meta.com/blog/meta-llama-3/)、[公式モデルカード](https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md) | 指示調整データ数や文書数ではない。 |
| C5 | confirmed | Chinchilla：70Bパラメータ、1.4T学習トークン、比率は約20トークン／パラメータ。同程度の学習FLOPsでGopher 280Bを広い評価群で上回った。初投稿2022-03-29。 | [原論文](https://arxiv.org/abs/2203.15556)、[DeepMind解説](https://deepmind.google/blog/an-empirical-analysis-of-compute-optimal-large-language-model-training/) | 20:1は学習計算量に対する目安。普遍的定数や推論費用を含めた生涯最適値ではない。 |
| C6 | corrected | 歴史的な公称値は確認。Gemini 1.5 Proの1Mは2024-02-15限定preview、2Mは2024-05-14 preview／06-27全開発者へ開放。2026-10-09調査で確認した公開モデルの最大公称値は**Llama 4 Scout 10M**。 | [Gemini初報](https://blog.google/innovation-and-ai/products/google-gemini-next-generation-model-february-2024/)、[2M開放](https://developers.googleblog.com/en/new-features-for-the-gemini-api-and-google-ai-studio/)、[Meta Scout公開](https://ai.meta.com/blog/llama-4-multimodal-intelligence/) | 「一般アカウントから実際に使えるAPIとして世界最大」は未確定。AWS資料の10M／3.5M不一致を補足に明記。 |
| C7 | confirmed | Kaplan et al., *Scaling Laws for Neural Language Models*、初投稿2020-01-23。研究対象の範囲で、他の制約が律速しないとき、保留データ上の交差エントロピー損失がモデル規模・データ量・学習計算量に対してべき乗則で低下。 | [原論文](https://arxiv.org/abs/2001.08361) | 全ベンチマーク点数や「知能」の普遍則ではない。 |
| T1 | confirmed | InstructGPTブログ2022-01-27、論文初投稿2022-03-04。評価対象のプロンプトでは、1.3B InstructGPTの出力が175B GPT-3より好まれた。実演によるSFT → 比較から報酬モデル → PPO。 | [論文](https://arxiv.org/abs/2203.02155)、[OpenAIブログ](https://openai.com/index/instruction-following/) | あらゆる能力の優越を示す結果ではない。厳密な学習法ではPPO-ptxの事前学習勾配混合もある。 |
| T2 | corrected | Chat Completions／gpt-3.5-turboは2023-03-01公開。`system`／`user`／`assistant`を使用。Chat CompletionsとAnthropic Messagesではアプリが履歴を渡す。現在のすべての会話APIがこの方式ではない。 | [当日の公式告知](https://community.openai.com/t/introducing-chatgpt-and-whisper-apis/80485)、[公式Cookbook](https://developers.openai.com/cookbook/examples/how_to_format_inputs_to_chatgpt_models)、[OpenAI状態管理](https://developers.openai.com/api/docs/guides/conversation-state)、[Anthropic Messages](https://platform.claude.com/docs/en/build-with-claude/working-with-messages) | Responsesの`previous_response_id`やConversationsにはサーバー側で状態を継承する方式がある。公式引用は補足。 |
| T3 | confirmed | *Mata v. Avianca*、2023-06-22、P. Kevin Castel判事。提出された架空の判決文6件。弁護士2名と事務所へ**合計5,000ドルを連帯負担**する制裁。例は架空の *Varghese v. China Southern Airlines Co., Ltd.* | [制裁命令 ECF 54](https://www.nhd.uscourts.gov/sites/default/files/pdf/Mata-v-Avianca-sanctions-order.PDF)、[同文書のHTML／署名情報](https://law.justia.com/cases/federal/district-courts/new-york/nysdce/1:2022cv01461/575368/54/) | 各人5,000ドルではない。AI使用そのものだけでなく、その後の虚偽説明などを含む悪意の行為が問題となった。 |
| A1 | confirmed | OpenAI function calling 2023-06-13。Anthropic tool use一般提供2024-05-30。Toolformer初投稿2023-02-09、Meta AI Research中心。 | [OpenAI発表](https://openai.com/index/function-calling-and-other-api-updates/)、[Anthropic GA発表](https://www.anthropic.com/news/tool-use-ga)、[Toolformer論文](https://arxiv.org/abs/2302.04761) | API機能の公開日と、ツール使用研究の起源を混同しない。Toolformerは少数の実演を用いる。 |
| A2 | confirmed | ReAct初投稿2022-10-06、ICLR 2023。推論と行動を交互に生成し、環境の観察を次の判断に使う。HotpotQA、FEVER、ALFWorld、WebShopで評価。 | [原論文](https://arxiv.org/abs/2210.03629)、[著者の解説](https://react-lm.github.io/) | 「推論→行動→観察」は説明用の模式図。すべての現代エージェントが内部推論を表示するという意味ではない。 |
| A3 | confirmed | SWE-bench初投稿2023-10-10、ICLR 2024、12のPythonリポジトリから2,294課題。Verifiedは2024-08-13公開、500課題の人手検証済み部分集合。 | [原論文](https://arxiv.org/abs/2310.06770)、[Verified発表](https://openai.com/index/introducing-swe-bench-verified/) | 現在の比較指標としての妥当性や汚染の有無まで保証する数字ではない。 |
| A4 | corrected | MCP公開2024-11-25。USB-C引用は正確。OpenAI 2025-03-26はSDK対応と今後の製品対応表明、Google 04-09は対応表明。Microsoft 05-19はWindows向け発表で、Copilot Studioの初期対応は03-19。 | [MCP発表](https://www.anthropic.com/news/model-context-protocol)、[公式入門](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro)、[Microsoft 3月発表](https://www.microsoft.com/en-us/copilot/blog/copilot-studio/introducing-model-context-protocol-mcp-in-copilot-studio-simplified-integration-with-ai-apps-and-agents/) | 企業全体の初採用日として「Microsoftは5月」は不正確。製品別の出典付き年表を補足。 |
| A5 | confirmed | 2025年3月原論文ではp50タスク長の倍増時間は212日、95% CI 171–249日（約7か月）。原図のClaude 3.7 Sonnetは約59分。後続値と近年の速い傾向はMETR補足参照。 | [原論文v1](https://arxiv.org/html/2503.14499v1)、[公式ダッシュボード](https://metr.org/time-horizons/)、[TH1.1データ](https://metr.org/assets/benchmark_results_1_1.yaml) | p50は人間が要する課題時間。AIの連続稼働時間ではない。測定版・補正日・モデル日を分ける。 |
| A6 | confirmed | Anthropic、2025-06-13。Opus 4主担当＋Sonnet 4子エージェントが社内研究評価で単独Opus 4を90.2%上回ったと報告。マルチエージェントのトークン使用量はチャットの約15倍。 | [Anthropic技術記事](https://www.anthropic.com/engineering/multi-agent-research-system) | 90.2%と15倍の比較対象は異なる。独立再現結果、90.2ポイント増、金額15倍とは言えない。 |
| A7 | confirmed | 2024-10-22、更新版Claude 3.5 Sonnetのcomputer useを公開APIベータへ。2025-01-23、Operatorを米国ChatGPT Pro利用者向け研究プレビューとして公開。 | [Anthropic発表](https://www.anthropic.com/news/3-5-models-and-computer-use)、[Operator発表](https://openai.com/index/introducing-operator/) | Operatorは専用ブラウザを使う製品。1月時点の公開API提供とは異なる。 |

## 引用・表記をそのまま使うための補足

### H1：Shannonの1948年原版

以下は原版p.388の5例。印刷上の改行だけを空白に統合し、囲みの引用符は加えていない。指定された文章は訂正再版と一致するが、**原版のゼロ次はX、5例の末尾にはピリオドがない**。XからHへの変更理由は未確認なので「誤植を修正した」とは断定しない。[1948年原版](https://www3.nd.edu/~powers/ame.20231/shannon1948a.pdf)、[訂正再版](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf)

Zero-order approximation：記号は独立かつ等確率。

```text
XFOML RXKHRJFFJUJ ZLPWCFWKCYJ FFJEYVKCQSGXYD QPAAMKBZAACIBZLHJQD
```

First-order approximation：記号は独立だが、英語の出現頻度に従う。空白を含む27記号なので「文字頻度」だけでは空白を除外したように読ませない。

```text
OCRO HLI RGWR NMIELWIS EU LL NBNESEBYA TH EEI ALHENHTTPA OOBTTVA NAH BRL
```

Second-order approximation：英語のdigram（2記号の並び）の構造を使う。

```text
ON IE ANTSOUTINYS ARE T INCTORE ST BE S DEAMY ACHIN D ILONASIVE TUCOOWE AT TEASONARE FUSO TIZIN ANDY TOBE SEACE CTISBE
```

Third-order approximation：英語のtrigram（3記号の並び）の構造を使う。

```text
IN NO IST LAT WHEY CRATICT FROURE BIRS GROCID PONDENOME OF DEMONSTURES OF THE REPTAGIN IS REGOACTIONA OF CRE
```

Second-Order Word Approximation：原論文では6番目の例。単語間の遷移確率を使う。

```text
THE HEAD AND IN FRONTAL ATTACK ON AN ENGLISH WRITER THAT THE CHARACTER OF THIS POINT IS THEREFORE ANOTHER METHOD FOR THE LETTERS THAT THE TIME OF WHO EVER TOLD THE PROBLEM FOR AN UNEXPECTED
```

### H2：Turingの冒頭

原版の見た目を文字で近似すると次のとおり。小型大文字は通常の大文字で表した。印刷物の空き量はUnicodeの空白個数と同一視できない。[原版 p.433](https://turingarchive.kings.cam.ac.uk/publications-lectures-and-talks-amtb/amt-b-19)

```text
I PROPOSE to consider the question, ‘ Can machines think ? ’
```

画面では次の正規化が読みやすい。注記は「小型大文字・組版上の空白を正規化」。

```text
I propose to consider the question, ‘Can machines think?’
```

原文は最初に男女を当てるゲームを説明し、次に一方を機械へ置き換える。回答は書面、望ましくはタイプ入力、理想的にはteleprinterによる。後世の簡略化された「人間かAIかを見分ける試験」だけを、そのまま原論文冒頭の設定としない。[原論文§1の転記](https://www.csee.umbc.edu/courses/471/papers/turing.pdf)

### H3：ELIZAの会話と逸話

原版p.36の8行。アポストロフィは曲線の記号で表記。ASCIIの `'` に統一する場合は表記の正規化となる。機械側の大文字行には句点も疑問符も付けない。[1966年論文](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf)

```text
Men are all alike.
IN WHAT WAY
They’re always bugging us about something or other.
CAN YOU THINK OF A SPECIFIC EXAMPLE
Well, my boyfriend made me come here.
YOUR BOYFRIEND MADE YOU COME HERE
He says I’m depressed much of the time.
I AM SORRY TO HEAR YOU ARE DEPRESSED
```

秘書の逸話は *Computer Power and Human Reason*（1976）、原著pp.6–7に由来する。今回確認した序論の再録では、開発を知る秘書が数回の会話後にWeizenbaumへ退室を求めたと本人が記している。紹介文は「Weizenbaumは、人々がELIZAへ感情移入し擬人化することに驚いたと回想した」が適切。秘書と論文中の会話例の相手が同一人物とは推定しない。[著書序論の再録 pp.369–370](https://cyborgdigitalculture.files.wordpress.com/2013/09/24-weizenbaum-03.pdf)

### H5：GPT-3のfew-shot図

Figure 2.1、p.7のfew-shot欄は次のとおり。語句、大小文字、アクセント、矢印、未完の最終行が提示文と一致した。[GPT-3論文](https://arxiv.org/pdf/2005.14165)

```text
Translate English to French:
sea otter => loutre de mer
peppermint => menthe poivrée
plush girafe => girafe peluche
cheese =>
```

`girafe`はこの欄ではfが1個。隣のfine-tuning欄では`giraffe`となっており、図内で異なる。引用時に黙って綴りを直さない。この図は手法の模式的説明で、当該プロンプトの生成結果や評価成績そのものではない。

初代GPTの約117Mについては、公式公開の146テンソルの形状から要素数を合計すると**116,534,784**だった。これは公開済み事前学習パラメータの計算値であり、2018年論文にその総数が明記されていたという意味ではない。[公式形状メタデータ](https://github.com/openai/finetune-transformer-lm/blob/master/model/params_shapes.json)

### C2：King − Man ＋ Woman

2013年1月論文§1.1、p.2の式部分の転記は次のとおり。右向き引用符が両側に使われている。[原論文](https://arxiv.org/pdf/1301.3781)

```text
vector(”King”) - vector(”Man”) + vector(”Woman”)
```

画面向けに記号を正規化した説明式：

```text
vector("King") − vector("Man") + vector("Woman") ≈ vector("Queen")
```

原文は結果に最も近いベクトルがQueenだと述べる。`≈`を含む全体は説明用の書き換えで、原文の完全引用ではない。1月論文の参考文献[20]は、Mikolov・Wen-tau Yih・Geoffrey Zweigの *Linguistic Regularities in Continuous Space Word Representations*（NAACL-HLT 2013）。こちらはRNN由来の埋め込みを使う研究で、同じ類推を報告している。CBOW／skip-gramが初めて発見したと限定せず、「Mikolovらの2013年の単語ベクトル研究で報告」とする。[引用元論文](https://aclanthology.org/N13-1090/)

### T2・A4：公式文書の短い引用

OpenAIの移行ガイド：

> In Chat Completions, conversation state must be managed manually.

[OpenAI：Migrate to the Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)

Anthropic Messages：

> The Messages API is stateless, which means that you always send the full conversational history to the API.

[Anthropic：Using the Messages API](https://platform.claude.com/docs/en/build-with-claude/working-with-messages)

ここでの「全履歴」は通常の利用パターンを説明する。アプリは保持する履歴を選び、必要なら切り詰め・要約できる。前回送った情報が次回に自動復元されるわけではない。保存・キャッシュの有無と、次の推論の文脈を誰が組み立てるかは別の問題。Responses／Conversationsのサーバー側状態継承も併記する。[OpenAI：Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)

MCPの公式入門：

> Think of MCP like a USB-C port for AI applications.

指定の `a USB-C port for AI applications` は正確。これは接続方式の標準化の比喩である。今回読んだのは2026-07-28版の文書であり、この文自体の初出日を2024-11-25と確認したわけではない。[MCP公式入門](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro)

## 年表・数値の使い分け

### H4：著者・所属・学習時間

8著者はAshish Vaswani、Noam Shazeer、Niki Parmar、Jakob Uszkoreit、Llion Jones、Aidan N. Gomez、Łukasz Kaiser、Illia Polosukhin。表紙ではGomezはUniversity of Toronto所属で、Google Brainで研究したとの脚注がある。PolosukhinにもGoogle Researchでの作業を示す脚注がある。画面には「Google Brain／Google Researchを中心とする8人（トロント大学のAidan Gomezを含む）」が適切。[原論文表紙](https://arxiv.org/pdf/1706.03762)

機械翻訳が主な実験対象だが構文解析も扱う。big modelの約3.5日は8基のP100で30万stepという特定の学習実験の値。研究全体の総作業時間ではない。モデルには位置ごとのFFN、埋め込み、位置情報、残差接続、正規化もある。[原論文 §§3, 5.2, 6](https://arxiv.org/pdf/1706.03762)

### H6：利用者数の出典と指標

約5日で100万人という数字はAltmanの発表への帰属を付ける。元投稿の直接表示は確認できず、2022-12-05の同時代記事に埋め込まれた投稿とリンクで確認した。「登録者」「DAU」「MAU」など、元発言のusersより具体的な指標へ置き換えない。[同時代報道](https://indianexpress.com/article/technology/tech-news-technology/openai-chatgpt-crosses-1-million-users-ceo-says-they-might-have-to-monetise-this-8306997/)

1億人は2023年1月の**推計月間アクティブユーザー**。Reuters配信版の掲載表示は2023-02-02で、本文が言及するUBS調査は2月1日。TikTokの約9か月はグローバル公開後、Instagramは約2年半という比較だが、3サービスの指標定義が厳密に同一かは当該記事から確定しない。「史上最速」を時点なしで固定的な称号にしない。[Reuters配信記事](https://www.investing.com/news/economy/chatgpt-sets-record-for-fastestgrowing-user-base--analyst-note-2993773)

### H7：全日付の確認

| 対象 | 画面用の日付・イベント | 出典と留意点 |
|---|---|---|
| Dartmouth | 1956年夏の研究会。提案書は1955-08-31。 | [1955年提案書](https://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html)、[Dartmouth回顧](https://ai.dartmouth.edu/founding-and-future-ai)。Artificial Intelligenceは提案書の題名に存在。 |
| Bengioら | 2003年2月、*A Neural Probabilistic Language Model*、JMLR 3:1137–1155。 | [JMLR書誌](https://jmlr.org/papers/v3/bengio03a.html) |
| word2vec | 2013年。関連する最初の論文は01-16、後続の語・句の論文は10-16初投稿。 | [1月論文](https://arxiv.org/abs/1301.3781)、[10月論文](https://arxiv.org/abs/1310.4546) |
| BERT | 2018-10-11、論文初投稿。 | [arXiv](https://arxiv.org/abs/1810.04805)。[公式OSS告知](https://research.google/blog/open-sourcing-bert-state-of-the-art-pre-training-for-natural-language-processing/)は11-02で「今週公開」と説明。重み・コードの初公開日とは分ける。 |
| LLaMA | 2023-02-24、Metaが発表し研究向け提供。 | [Meta](https://ai.meta.com/blog/large-language-model-llama-meta-ai/)。当初は非商用研究向け、申請によるアクセス。 |
| GPT-4 | 2023-03-14、発表。 | [OpenAI](https://openai.com/index/gpt-4/) |
| Claude | 2023-03-14、発表・提供拡大。 | [Anthropic](https://www.anthropic.com/news/introducing-claude)。先行するclosed alphaがあった。 |
| Gemini | 2023-12-06、Gemini 1.0発表。 | [Google](https://blog.google/innovation-and-ai/technology/ai/google-gemini-ai/)。ProのBard利用は同日、開発者提供は12-13から、Ultraは後。 |
| OpenAI o1 | 2024-09-12、o1-preview／o1-mini公開。 | [preview発表](https://openai.com/index/introducing-openai-o1-preview/)。非preview版o1は[2024-12-05発表](https://openai.com/index/introducing-chatgpt-pro/)。 |
| MCP | 2024-11-25、仕様・関連実装の公開。 | [Anthropic](https://www.anthropic.com/news/model-context-protocol) |
| DeepSeek-R1 | 2025-01-20、モデル・API公開。 | [公式発表](https://api-docs.deepseek.com/news/news250120/)。[論文](https://arxiv.org/abs/2501.12948)初投稿は01-22。 |
| Claude Code preview | 2025-02-24、限定研究プレビュー。 | [Anthropic](https://www.anthropic.com/news/claude-3-7-sonnet) |
| Codex cloud agent | 2025-05-16、クラウド型ソフトウェア開発エージェントの研究プレビュー。 | [OpenAI](https://openai.com/index/introducing-codex/)。Codexという名称やCLIの初登場日ではない。 |
| Claude Code GA | 2025-05-22、一般提供開始。 | [Anthropic](https://www.anthropic.com/news/claude-4) |

### C1・C5：数値の定義

公開encodingの厳密な数え方は次のとおり。公式rankファイルの行数と特殊トークン定義を照合した。`n_vocab`は最大トークンID＋1なので、IDの欠番を含む。[encoding定義](https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py)、[core実装](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken/core.py)

| Encoding | 通常トークン | 定義済み特殊トークン | 定義済み合計 | 最大ID＋1 |
|---|---:|---:|---:|---:|
| cl100k_base | 100,256 | 5 | 100,261 | 100,277 |
| o200k_base | 199,998 | 2 | 200,000 | 200,019 |

これらは公開base encodingの値であり、サービス内部の非公開制御トークン全体を数えたものではない。説明画面では約10万／約20万で十分。

Chinchillaの20:1は1.4T÷70Bであり、学習FLOPsを固定したときの経験的な最適配分の目安。Llama 3は推論効率を重視して小さめのモデルを長く学習する狙いを説明しており、15T超という数値と矛盾しない。KaplanとChinchillaは、損失のスケーリングという大枠を共有しても、最適なモデル量・データ量の配分まで同じではない。[Chinchilla論文](https://arxiv.org/abs/2203.15556)、[Llama 3発表](https://ai.meta.com/blog/meta-llama-3/)、[Kaplan論文](https://arxiv.org/abs/2001.08361)

### C6：コンテキスト長と「一般提供」の限界

| 対象 | 値・日付 | 提供段階・出典 |
|---|---|---|
| GPT-4 | 8,192／32,768、2023-03-14 | APIはwaitlist、32Kは限定アクセス。[発表](https://openai.com/index/gpt-4-research/) |
| Claude | 100,000、2023-05-11 | 9Kから拡張。[発表](https://www.anthropic.com/news/100k-context-windows) |
| Claude 2.1 | 200,000、2023-11-21 | APIで提供。claude.aiの200KはPro向け。[発表](https://www.anthropic.com/news/claude-2-1) |
| Gemini 1.5 Pro | 1,000,000、2024-02-15 | 限定private preview。標準は128K、研究上の10M試験は別。[発表](https://blog.google/innovation-and-ai/products/google-gemini-next-generation-model-february-2024/) |
| Gemini 1.5 Pro | 2,000,000、2024-05-14／06-27 | [5月のprivate preview](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-gemma-developer-updates-may-2024/)から[6月の全開発者への開放](https://developers.googleblog.com/en/new-features-for-the-gemini-api-and-google-ai-studio/)へ。 |

**現在値の推奨文：**「公開済みモデルの公称値では、今回確認した最大はLlama 4 Scoutの1,000万トークン（2026-10-09調査）。実際のAPI上限は提供元・契約による。」Metaは2025-04-05に重みを公開し、モデルカード・現在の導入資料も10Mを記載する。独自ライセンスの公開重みなので、無条件に「オープンソース」や正式なサービス段階としての「GA」と言い換えない。[Meta発表](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)、[公式モデルカード](https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct)、[導入資料](https://ai.meta.com/llama/get-started/)

**ホステッドAPIとしての最大値は未確定。** AWSの現行ScoutカードはActive／10M、quota表にも10Mの専用項目がある一方、2026-01-21のAWS記事はBedrockでは最大3.5Mとする。10Mの標準quotaは0で調整申請可能。提供経路の差、変更時期、文書の誤差などは説明候補にすぎず、今回どれかと確定できなかった。「Bedrockなら全利用者が10Mを使える」とは書かない。[AWSモデルカード](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-meta-llama-4-scout-17b-instruct.html)、[quota表](https://docs.aws.amazon.com/general/latest/gr/bedrock.html)、[AWSの3.5M記載](https://aws.amazon.com/blogs/machine-learning/using-strands-agents-to-create-a-multi-agent-solution-with-metas-llama-4-and-amazon-bedrock/)

Magicの100Mは確認した資料では研究発表で、同じ窓長の一般提供を確証できない。MiniMax-01の4Mは10M未満。これらを含む探索でも、10Mを超える公開済み汎用モデルは確立できなかったが、世界のすべての私的契約まで網羅した主張ではない。[Magic研究発表](https://magic.dev/blog/100m-token-context-windows)、[MiniMax発表](https://www.minimax.io/news/minimax-01-series-2)

比較確認した現行例はGPT-6 Astraが文脈1,050,000（最大入力922,000、最大出力128,000）、Claude Opus 5.5が1M、Gemini 3.8 Flashが入力1,048,576。各社で入力上限と合計文脈長の定義が違うため、同一指標としてそのまま順位付けしない。窓長は長文全体を正確に扱える品質の保証でもない。[OpenAI仕様](https://developers.openai.com/api/docs/models/gpt-6-astra)、[Anthropic仕様](https://platform.claude.com/docs/en/models/opus-5-5/overview)、[Google仕様](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)

### T3：6件と制裁金

6件は提出された架空の判決文 **Varghese、Shaboon、Petersen、Martinez、Durden、Miller** を指す。それらの中に含まれる虚偽引用すべての総数ではない。例示する場合は次を明確に「架空の引用」と表示する：*Varghese v. China Southern Airlines Co., Ltd., 925 F.3d 1339 (11th Cir. 2019)*。[制裁命令 pp.7, 12–13, 33–34](https://www.nhd.uscourts.gov/sites/default/files/pdf/Mata-v-Avianca-sanctions-order.PDF)

5,000ドルの連帯負担者はPeter LoDuca、Steven A. Schwartz、Levidow, Levidow & Oberman P.C.。裁判所への支払いであり、各人への刑事罰という表現は避け「制裁金」とする。判断は、指摘後の依拠継続・意図的な確認回避・裁判所への虚偽説明なども含む。依頼人と名前を冒用された裁判官への通知も命じられた。[同命令 pp.1–2, 31, 33–34](https://www.nhd.uscourts.gov/sites/default/files/pdf/Mata-v-Avianca-sanctions-order.PDF)

### A4：MCP対応の製品別年表

| 日付 | 確認できたイベント | 出典 |
|---|---|---|
| 2024-11-25 | AnthropicがMCPを公開。 | [公式発表](https://www.anthropic.com/news/model-context-protocol) |
| 2025-03-19 | Microsoft Copilot Studioで初期対応を発表。preview地域から展開。 | [公式ブログ](https://www.microsoft.com/en-us/copilot/blog/copilot-studio/introducing-model-context-protocol-mcp-in-copilot-studio-simplified-integration-with-ai-apps-and-agents/) |
| 2025-03-26 | AltmanがAgents SDKでの対応を表明。ChatGPT desktopとResponsesは今後対応と説明。 | [元投稿](https://x.com/sama/status/1904957253456941061)。X公式oEmbedで本文・日付を確認。 |
| 2025-04-09 | HassabisがGeminiモデル／SDKの今後のMCP対応を表明。 | [元投稿](https://x.com/demishassabis/status/1910107859041271977)。X公式oEmbedで確認。 |
| 2025-05-19 | Windows 11へのネイティブ対応を発表。選定パートナー向けprivate previewは今後の予定。 | [Windows公式ブログ](https://blogs.windows.com/windowsdeveloper/2025/05/19/advancing-windows-for-ai-development-new-platform-capabilities-and-tools-introduced-at-build-2025/) |
| 2025-05-20 | Gemini APIでMCP定義のネイティブSDK対応を追加と発表。 | [Google I/O記事](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/google-gemini-updates-io-2025/) |
| 2025-05-21 | OpenAI Responses APIでremote MCP server対応を公開。 | [公式発表](https://openai.com/index/new-tools-and-features-in-the-responses-api/) |

### A6・A7：結果の比較対象と公開範囲

90.2%はAnthropicの内部評価における**単独Opus 4に対する性能比較**、約15倍は**通常チャットに対するトークン量**。同記事は単一エージェントを約4倍とも記すが、これだけから同一予算の性能差や費用対効果を推定できない。生のスコア、誤差、予算を揃えた実験の詳細は十分に公開されておらず、「同社は〜と報告」が適切。[Anthropic技術記事](https://www.anthropic.com/engineering/multi-agent-research-system)

Claudeのcomputer useは2024年10月の更新版3.5 Sonnetで、Anthropic API、Bedrock、Vertex AIを通じた実験的公開ベータ。Operatorは2025年1月時点では米国Pro向け研究プレビューで、Computer-Using Agent（CUA）と専用ブラウザを使う。後者の発表ページの2025-07-17追記はChatGPT agentへの統合であり、1月の公開条件と混ぜない。[Claude発表](https://www.anthropic.com/news/3-5-models-and-computer-use)、[Operator発表](https://openai.com/index/introducing-operator/)

## A5：METRの原論文と後続測定

### 定義と資料の版

**p50 time horizonは、評価対象の課題群で成功率50%に相当する「人間の専門家がその課題に要する時間」**。AIの実行時間、連続して自律稼働できる時間、現実のあらゆる仕事の半分を自動化できる長さを意味しない。主に仕様が明確で自己完結したソフトウェア・ML・サイバーセキュリティ課題について、モデルと実行用の仕組みを合わせて測る指標である。[原論文v1](https://arxiv.org/html/2503.14499v1)、[公式の定義・限界](https://metr.org/time-horizons/)

初稿は**2025-03-18**にarXivへ投稿、METRブログは**03-19**。現在の論文・ブログには題名の変更や新しい図が反映されているので、2025年3月の値には明示的にv1を使う。現在のダッシュボードは**2026-09-08を最終更新日として更新終了を告知**しており、モデル追加の最後の記録は05-08のMythos Preview (early)。以下の「現在値」は2026-10-09に取得できた最新の公式公開値で、同日時点のすべての新モデルを測定済みという意味ではない。[投稿履歴](https://arxiv.org/abs/2503.14499)、[3月ブログ](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/)、[ダッシュボード](https://metr.org/time-horizons/)

### 原論文Figure 5の表示値

次表は原図のラベルを目視確認した概数。モデル日はMETRの図・データで採用する日で、測定実施日ではない。[原論文Figure 5](https://arxiv.org/html/2503.14499v1/plots/individual_histograms/default/histograms.png)、[本文§4.2](https://arxiv.org/html/2503.14499v1)

| 指定モデル | 図で採用するモデル日 | 原図のp50表示 | 注意 |
|---|---|---|---|
| GPT-2 | 2019-02-14 | 約2秒 | ごく短い課題で測定。長い課題の成績はゼロとして補完。 |
| GPT-3 | 2020-05-28 | 約9秒 | 実測は代理モデル`davinci-002`。 |
| GPT-3.5 | 2022-03-15 | 約36秒 | 実測は`gpt-3.5-turbo-instruct`。このAPIの公開日を意味しない。 |
| GPT-4 0314 | 2023-03-14 | 約5分 | GPT-4 1106は別の点で約8分。 |
| Claude 3.5 Sonnet (Old) | 2024-06-20 | 約18分 | 最初の3.5 Sonnet。 |
| Claude 3.5 Sonnet (New) | 2024-10-22 | 約28分 | 更新版。無印の「3.5 Sonnet」では区別できない。 |
| o1 | 2024-12-05 | 約39分 | o1-previewは別で約22分。 |
| Claude 3.7 Sonnet | 2025-02-24 | **約59分** | 本文でも59分。要旨の「約50分」は粗い表現。 |

元のGPT-3／3.5を使えないため近い後継を代理評価し、古いモデル系列の日付に置いたと論文が説明する。「2019年当時に測った値」などとは書かない。またAppendix Dは一部で異なる処理版を使ったと注意し、Table 9には旧／新Sonnet 3.5が18.22／28.98分、o1が39.21分、GPT-4 1106が8.56分とある。これらを原図の丸め前の同一値と決めつけず、画面には上の図ラベルを概数として用いる。[原論文§4.2・Appendix D](https://arxiv.org/html/2503.14499v1)

### 原論文後の公式測定：TH1.0とTH1.1を分ける

下表は公式の [TH1.0 YAML](https://metr.org/assets/benchmark_results_1_0.yaml) と [TH1.1 YAML](https://metr.org/assets/benchmark_results_1_1.yaml) を2026-10-09に取得した補正後の値。**単位は分、角括弧は95%信頼区間**。日付はデータの`release_date`であり、METRによる測定公表日ではない。「—」はその系列に収録なし。数値の桁はデータ照合用で、画面上の精度を主張するものではない。

| モデル | モデル日 | TH1.0 p50 分 [95% CI] | TH1.1 p50 分 [95% CI] |
|---|---|---|---|
| DeepSeek V3 0324 | 2025-03-24 | 24.59 [12.57, 43.33] | — |
| o3 | 2025-04-16 | 91.44 [46.57, 158.04] | 119.73 [74.62, 190.94] |
| o4-mini | 2025-04-16 | 76.75 [37.05, 142.12] | — |
| Claude Opus 4 | 2025-05-22 | 83.57 [44.93, 140.62] | 100.37 [59.99, 163.45] |
| Claude Sonnet 4 | 2025-05-22 | 73.66 [38.32, 127.09] | — |
| DeepSeek R1 0528 | 2025-05-28 | 32.76 [13.76, 64.08] | — |
| Gemini 2.5 Pro Preview | 2025-06-05 | 40.18 [20.36, 69.86] | — |
| Grok 4 | 2025-07-09 | 104.85 [47.56, 208.30] | — |
| Claude Opus 4.1 | 2025-08-05 | 109.26 [55.95, 200.81] | 100.47 [59.27, 159.45] |
| gpt-oss-120b | 2025-08-05 | 45.11 [19.90, 85.54] | — |
| GPT-5 | 2025-08-07 | 130.82 [67.70, 247.82] | 203.01 [112.64, 405.55] |
| Claude Sonnet 4.5 | 2025-09-29 | 116.53 [58.94, 225.75] | — |
| Kimi K2 Thinking | 2025-11-06 | 57.62 [27.42, 100.59] | — |
| Gemini 3 Pro | 2025-11-18 | — | 224.33 [139.57, 379.24] |
| GPT-5.1-Codex-Max | 2025-11-19 | 162.25 [80.19, 336.50] | 223.71 [134.31, 396.21] |
| Claude Opus 4.5 | 2025-11-24 | 246.78 [104.27, 821.56] | 292.99 [161.72, 623.70] |
| GPT-5.2 | 2025-12-11 | — | 352.25 [198.07, 815.18] |
| Claude Opus 4.6 | 2026-02-05 | — | 718.81 [316.69, 3633.79] |
| GPT-5.3-Codex | 2026-02-05 | — | 349.53 [194.91, 816.35] |
| Gemini 3.1 Pro | 2026-02-19 | — | 384.15 [233.50, 694.75] |
| GPT-5.4 | 2026-03-05 | — | 341.74 [186.58, 768.78] |
| Claude Mythos Preview (early) | 2026-04-07 | — | 1044.78 [508.88, 3304.26]：測定の信頼範囲超過 |

TH1.1の中心値を時間に直すと、GPT-5は約3時間23分、Opus 4／4.1は約1時間40分、Opus 4.5は約4時間53分、Opus 4.6は約11時間59分。Mythos Preview (early)は計算上約17時間25分だが、**METR自身が16時間超の測定を信頼できないとしているため、確定した能力の見出しに使わない**。長い側の区間が広いことも併記する。[TH1.1データ](https://metr.org/assets/benchmark_results_1_1.yaml)、[測定限界](https://metr.org/time-horizons/)

### 公表・修正の日付

| 日付 | 公表・更新内容 | 出典 |
|---|---|---|
| 2025-08-07 | GPT-5評価報告は当時のp50を約2時間17分と記載。対象はgpt-5-thinking。 | [GPT-5評価報告](https://metr.org/evaluations/gpt-5-report/) |
| 2025-12-19 | ダッシュボードへOpus 4.5を追加。 | [更新履歴](https://metr.org/time-horizons/) |
| 2026-01-29 | TH1.1を公開。当時の値はGPT-5 214分 [117,480]、Opus 4 101 [58,170]、Opus 4.5 320 [170,729]、Sonnet 3.7 60 [32,106]。 | [TH1.1公開記事](https://metr.org/blog/2026-1-29-time-horizon-1-1/) |
| 2026-02-03／04／20 | 新系列へGemini 3 Pro・GPT-5.1-Codex-Max／GPT-5.2／Opus 4.6・GPT-5.3-Codexを順次追加。 | [更新履歴](https://metr.org/time-horizons/) |
| 2026-03-03 | 意図しない正則化の影響を修正。最近のモデルのp50が最大約20%低下。 | [更新履歴](https://metr.org/time-horizons/)、[03-20研究ノート](https://metr.org/notes/2026-03-20-impact-of-modelling-assumptions-on-time-horizon-results/) |
| 2026-04-10／15、05-08 | GPT-5.4／Gemini 3.1 Pro／Mythos Preview (early)を追加。最後の追加時に16時間超の限界も明示。 | [更新履歴](https://metr.org/time-horizons/) |
| 2026-09-08 | ダッシュボードの継続更新終了を告知。 | [ダッシュボード](https://metr.org/time-horizons/) |

GPT-5の2時間17分、TH1.1初報の214分、取得時点の203.01分はそれぞれ異なる版・時点の値。古い報告に帰属させた歴史的記載は誤りではないが、新旧を混ぜた一本の成長曲線にはしない。TH1.1では課題数が170→228、8時間以上の課題が14→31へ増え、実行基盤も変わった。31の長い課題のうち人間の時間を実測したものは5件で、残りは推定値。この設計も長時間側の不確実性に関係する。[TH1.1公開記事](https://metr.org/blog/2026-1-29-time-horizon-1-1/)

### 最近の倍増時間は速いのか

**速い傾向を報告している。ただし期間・系列・公表版を指定する。** 原論文にも2024年以降だけなら118日という推定がある。7か月から一意の新しい定数へ置き換わったわけではない。

| 出典の版・日付 | 期間／系列 | 倍増時間 |
|---|---|---|
| 2025年3月原論文 | 2019年〜2025年初め | 212日 [95% CI 171–249]、約7か月 |
| 同原論文Figure 19 | 2024-01-01以降 | 118日、約3.9か月 |
| 2026-01-29 TH1.1初報 | 全期間の結合系列 | 196.5日 |
| 同初報 | 2023年以降、TH1／TH1.1 | 165.3 [129,211]／130.8 [107,161]日 |
| 同初報 | 2024年以降、TH1／TH1.1 | 108.9／88.6日 |
| 2026-05-19 Frontier Risk Report | 2024年以降の公開フロンティア | 105日、R²=0.98 |
| 2026-10-09取得のTH1.0 | 全期間／2023年以降 | 201.150 [176.208,225.353]／175.603 [138.411,229.176]日 |
| 2026-10-09取得のTH1.1 | 全期間の結合系列／2023年以降 | 187.778／128.744 [104.428,158.012]日 |

出典：[原論文v1](https://arxiv.org/html/2503.14499v1)、[原Figure 19](https://arxiv.org/html/2503.14499v1/plots/logistic/double_line_2024_trendline.png)、[TH1.1初報の付録](https://metr.org/blog/2026-1-29-time-horizon-1-1/)、[5月レポートAppendix E](https://metr.org/blog/2026-05-19-frontier-risk-report/)、[TH1.0データ](https://metr.org/assets/benchmark_results_1_0.yaml)、[TH1.1データ](https://metr.org/assets/benchmark_results_1_1.yaml)。

TH1.1の全期間系列は2023年以前にTH1.0の点を使う結合系列である。取得時のYAMLは2024年以降だけの倍増時間を公開していないため、初報の88.6日を「現在のデータの推定値」と呼ばない。短い期間の回帰、課題群、モデル選択、補正の影響を受ける経験的傾向であり、将来の自動化時期を保証する法則ではない。

### 別の後続指標

2026-05-19の報告は別のソフトウェア再実装課題群 **MirrorCode-Early** も扱い、Opus 4.6・Gemini 3.1 Pro・GPT-5.4はp50が32時間超、Opus 4.6は100時間超とする。課題群と実行予算が異なり、TH1.1の点と同じグラフへ追加できない。一般に1実行100Mトークン、Opus 4.6は400M、GPT-4oは10Mという設定も関係する。[同報告Appendix E](https://metr.org/blog/2026-05-19-frontier-risk-report/)

2026-07-21の **Expenditure Horizon** は、人間とエージェントの費用・性能が交差する点をドルで表す別指標。新しいモデルを扱っていても、p50タスク時間の更新値ではない。これを根拠に未測定の新モデルのTH1.1値を補完しない。[METRの定義](https://metr.org/blog/2026-07-21-expenditure-horizon/)

## 残る不確実性

| 論点 | 確定できていないこと | このレポートでの扱い |
|---|---|---|
| 原文の版・組版 | ShannonのX→Hの編集理由。歴史的活字の空きを一意の文字コード列にする方法。 | 原版の目視転記と正規化を分けた。理由を創作しない。 |
| H6の一次資料 | Altmanの元投稿の直接表示と、UBS原調査全文は未取得。 | 同時代の投稿引用記事とReutersの明示的な出典に帰属させ、監査済み実測値とは扱わない。 |
| BERT公開日 | 最初にリポジトリ・重みが一般公開された厳密な日。 | 確定した10月11日の論文初投稿日を採用。 |
| C6のAPI最大値 | AWSの10M／3.5Mの差の理由。特定アカウント・地域・契約で使える上限。世界全体の網羅的最大値。 | 公開済みモデルの公称最大としてScout 10Mを提示し、APIの最大は未確定と明記。 |
| METRの原データと版 | 2025年3月当時のraw CSVは公開ストレージから取得できず、一部後続モデルの初回測定公表日も未確定。 | 原図・表を根拠に原論文値を示す。後続表のモデル日を公表日と偽らない。 |
| METRの外的妥当性 | 現実の長い仕事への一般化、16時間超の精度、未掲載の新モデルの能力。 | 限定された課題群、広い区間、更新終了を明記。未掲載を能力上限の証拠にしない。 |
| Anthropic内部評価 | 90.2%の生データ・詳細な算式・予算を揃えた比較・独立再現。 | 同社の報告として確認。一般的な性能増や費用対効果へ拡張しない。 |

これらは「不明な部分を既知として埋めない」ための境界であり、24項目の出典付き修正文を提供する妨げにはならない。取得不能だった資料、代わりに読んだ資料、版の対応は [log.md](log.md) の各Unitに残した。

## 問いと計画の変化

当初の問いは「指定24項目の画面表示を正確にする」であり、最後まで変更していない。原資料を読むと、数値そのものより**何を、いつ、どの版で数えているか**を確かめる追加の問いが必要になった。11回の計画改訂をログへ追記し、以下を元の範囲内で調べた。

| 派生した問い | 判断と成果 |
|---|---|
| 「原文」とは原版か訂正再版か。 | 今回追究。Shannonの版差、Turingの組版、GPT-3図の綴りを区別。 |
| 数値の出所・発見の帰属は正しいか。 | 今回追究。初代GPTの公開形状からの数え上げ、単語類推の先行RNN研究への引用を確認。 |
| 年表の日付はどのイベントを指すか。 | 今回追究。投稿・発表・preview・GA、MCPの製品別対応を分離。 |
| 語彙数・最適学習量・コンテキスト最大の定義は何か。 | 今回追究。定義済み数とID範囲、学習FLOPsと生涯費用、公開重みとAPI提供条件を分離。 |
| 会話APIのstatelessはどのAPIに当てはまるか。 | 今回追究。Chat Completions／Messagesとサーバー側状態継承を区別。 |
| 「架空6件」「90.2%」「15倍」の対象は何か。 | 今回追究。提出判決文の数、性能比較、チャット比トークン量を分離。 |
| METRの相違する値は誤りか更新か。 | 今回追究。原図、TH1.0、TH1.1、正則化修正、別の課題群・別指標を分離。 |

**今回は保留した派生調査：** BERTのコード・重み初公開日の履歴調査、アカウント別の長文API可用性と品質・費用の実測、現在のSWE-bench Verifiedの妥当性、異なる自律性・生産性指標間の比較、マルチエージェントの予算統制下での再現、computer-use製品のその後の全履歴。いずれも、今回の歴史的事実と条件付き現在値を確定するためには不要であり、実装・製品選択・最新性能比較へ進む場合に別途必要となる。

## 推奨する次の対応

1. **7つのcorrected項目を画面原稿へ反映する。** 引用はこのレポートの原版転記または明示した正規化を使い、H7・A4の各日付にはイベント名を添える。
2. **confirmed項目にも必要な限定を残す。** H6は「推計・月間・当時」、T1は「評価したプロンプトで好まれた」、T3は「合計・連帯」、A6は「同社の社内評価」と比較対象を記す。
3. **C6とA5の画面に取得日・版を付ける。** C6は「確認した公開モデルの公称値」、A5は「2025年原論文」または「TH1.1、2026-10-09取得」を選び、p50の定義を短く説明する。METRの新旧系列を無印で混在させない。
4. **デッキ制作時に出典を近くへ置く。** 長い引用と表は補足画面へ分け、デッキのREADMEへ一次資料と制作日を記録する。ここではデッキやプロジェクトファイルは編集していない。
5. **運用上の比較へ進む場合だけ保留事項を再開する。** API提供条件の確認、長文品質、最新ベンチマークの妥当性、同予算のマルチエージェント評価を、それぞれ用途を定めて調べる。
