# 「次の言葉の予測」から「穴埋め」へ：語りの事実確認ログ

- 問い: LLM デッキ導入の「言語モデル」と新クリップ「文章を組み立てる」の原稿を、C1〜C6について一次資料で確かめる。
- 範囲: 言語モデル一般の定義と穴埋めの比喩、自己回帰型・マスク言語モデル・スパン復元・拡散型の違い、主要モデルの公表資料、生成の絵と実際の手順の対応。基準日は **2026-10-14**。以後に出た資料は使わない。日本語で、各項目の判定、短い言い換え、引用・所在・取得日、残る不確実性を残す。
- UTC開始: **2026-10-14 08:00:00 UTC**。
- 書込み先: `research/compose-facts/log.md`（追記のみ）と、報告ターンで作る `report.md` のみ。プロジェクト実装、原稿、Git状態は変更しない。

## 初期計画

問い×資料群で次の調査単位に分ける。各単位を完了するたびに、出典と判断と次の単位を追記する。

1. **C1・C2：穴埋めという説明の射程 × 古典的確率言語モデル、BERT、T5 の原論文。** 先に AGENTS.md、既存報告 N3/N8、spec と現在の原稿を読み、列確率／条件付き確率／訓練目的／生成の違いを整理する。
2. **C1・C4・C5：マスク型と連続値拡散、絵の妥当性 × LLaDA、Dream、Diffusion-LM の原論文と公式コード。** 穴からの生成、確定済み位置、remasking、ブロック単位の生成を確認する。
3. **C4・C5：商用拡散型で公開されている範囲 × Inception Mercury と Google Gemini Diffusion の公式発表・技術報告。** マスク／連続ノイズ／不明を分ける。
4. **C3：2026-10時点の「主流」の根拠 × GPT、Claude、Gemini、Llama、Qwen、DeepSeek の公式論文・モデルカードと日付のある利用・評価資料。** 確認できた世代と最新世代を混同しない。
5. **C3・C6：生成の順序と導入の接続 × 複数トークン予測・推測的デコードの原論文、および前単位の照合。** 出力の因果的な順序と物理的な計算の並列性を分け、全原稿と絵の判定を揃える。必要なら計画改訂を追記する。
6. **報告前の照合 × 全単位の証拠。** C1〜C6と全対象文の判定、引用の総量、資料の日付と不確実性を確認する。完了後は ready-to-report を返し、別の報告ターンで既存報告に倣う report.md を作成する。

## Unit 1: C1・C2の基礎 — 列確率、BERT、T5と穴埋め

完了日・全出典の取得日: **2026-10-14 UTC**。初期計画の Unit 1 を完了。C1全体の最終判定は拡散型の照合後に確定する。

### 読んだローカル資料

- `AGENTS.md`（全体）。事実は一次資料で裏取り、例示と実測の区別、実単位はトークン、文面の実装は今回行わないことを確認。
- `research/intro-facts/report.md`（全体の取得と見出し、N3・N8およびその出典を重点確認）。N3は列全体の確率と次語の条件付き確率が整合すること、N8は自己回帰型への限定と拡散型の反例を指摘。今回の調査はこの限定を踏まえ、より広い導入の比喩を検証する。
- `docs/spec.md`（取得、冒頭・構成・語りの契約を確認）。今回の対象は資料調査のみで、仕様変更なし。
- `decks/llm/clips/langmodel.js`（scriptと描画の冒頭〜末尾付近）。現状は「ここまでの言葉」「次の言葉」。候補の絵には説明用の例・実際の単位はトークンという注がある。g前半の「決まりの重なりが言語の構造」は既存報告N4が広すぎるとした点であり、穴埋めへの変更だけでは解消しない。

### 一次資料・所在・短い原文引用

後続報告で用いる出典IDを **S1〜** とする。このログのIDは既存intro-factsのS番号とは別。

- **S1** Bengio et al. (2003), *A Neural Probabilistic Language Model*, JMLR 3:1137–1155。https://jmlr.org/papers/volume3/bengio03a/bengio03a.pdf 。Abstract p.1137、§1 p.1138、§2 pp.1141–1142。引用: “learn the joint probability function of sequences of words in a language” (Abstract)。列の確率を前の語に条件付けた各語の確率の積で表す式が§1にある。softmaxによる候補全体の正規化を§2に記す。
- **S2** Devlin et al. (2019), *BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding*, NAACL pp.4171–4186。https://aclanthology.org/N19-1423.pdf 。§1 pp.4171–4172、§3 p.4173、§3.1 p.4174。引用（計18語）: “masked language model”; “predict the original vocabulary id of the masked word based only on its context.” 入力の左右の文脈、語彙上のsoftmax、WordPiece単位、MLMとNSPの二つの訓練課題を確認。
- **S3** Raffel et al. (2020), *Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer*, JMLR 21(140):1–67。https://jmlr.org/papers/volume21/20-074/20-074.pdf 。§2.1 pp.4–5、§3.1.4 pp.12–13、Figure 2 p.13。引用（計24語）: “All consecutive spans of dropped-out tokens are replaced by a single sentinel token.” / “which only allows the model to attend to past outputs.” スパンを印へ置き換え、欠けたスパンを区切りの印とともに出力する課題。decoderは自己回帰的で、encoderの出力も参照する。
- **S4** Salazar et al. (2020), *Masked Language Model Scoring*, ACL pp.2699–2712。https://aclanthology.org/2020.acl-main.240/ 、本文 https://aclanthology.org/2020.acl-main.240.pdf 。Abstract、§2.1–2.2 p.2700、Appendix B p.2711。引用: “pseudo-log-likelihood scores (PLLs), which are computed by masking tokens one by one.” MLMの列スコアは各位置の条件付き確率から作る擬似尤度。付録Bでは正規化した列分布を別途構成する議論と、元のMLMの条件付き分布との同一視の問題を扱う。

いずれも基準日以前の公刊原論文。native webで本文を取得して確認。外部ページ全文のローカルコピーは作らない。引用は各資料25語以内に抑え、報告でも同じ短い引用を再利用する。

### 確認した事実と原稿への含意

1. **古典的確率言語モデルは「末尾の穴」という説明に収められるが、正式な定義そのものではない。** S1の列確率を連鎖律で展開すれば次語分布になる。数学上の分解と、実装が逐次生成することは同一ではない。穴を実際の入力記号として持つ必要もない。「穴」は未知の続き／欠けた内容を示す比喩。
2. **BERTをマスク言語モデルと呼んでよい。** S2原論文がその呼称と目的を明示する。ただしモデル自体は双方向の表現モデルで、微調整後の分類等を含む全用途が穴埋めではない。BERTのMLMは任意位置の隠したトークンを文脈から推定し、候補語彙に確率を付ける。穴は途中に限られず、複数にもできる。
3. **「BERTは列全体の確率を定義しない」も精密化が必要。** 標準BERTの出力から自己回帰型と同じ積で正規化済みの列尤度が直接出るわけではない。各位置を順に隠して足す対数スコアは擬似尤度である（S4）。別の正規化や生成手順を導入する研究まで不可能と断言しない。制作メモには「通常のBERTは、自己回帰型のような列の尤度をそのまま与えるモデルではない」が適切。
4. **T5のスパン復元は穴埋めに収まるが、一つの穴は一つのトークンではない。** S3の入力の印は連続した複数トークンを表せる。復元内容は別の出力列として自己回帰的に生成する。「途中の穴＝非自己回帰」「穴埋め＝拡散」ではない。
5. **C2 iは、候補に付ける数字が確率分布であるという条件で言える。** S1/S2/S3は語彙上のsoftmaxを使う。logitなど任意のスコアを確率とは呼ばない。図の語句候補はトークン分布の実測ではなく説明用の例。複数の穴の各位置の確率と、文章全体の確率は区別する。
6. **「まわり」は自己回帰型でも解釈可能だが、左右両側を常に見るとの誤解を避けるとよい。** 候補は「手がかりになる言葉を見て、穴に入る候補に、それぞれ確率を付けるの」。末尾の穴の場面では「ここまでの言葉を手がかりに」にできる。画面で末尾の右に言葉を描かないだけでも区別の助けになる。
7. **C2 jは、続きの先頭の穴を、既にある文脈から予測するという意味なら言える。** 「文の終わり」は句点後の完成文末に限定する必要はなく、書きかけの列の末尾。短い案は「いまある文章の先の穴を埋めるのが、次の言葉の予測よ」。末尾に複数の穴があるだけで自己回帰型になるわけではなく、生成順序を別に説明する必要がある。
8. **C1 gの暫定判定は『限定すれば言える』。** AR、MLM、T5をつなぐ直観として有用だが、モデル全般の必要十分な定義にはしない。「言語モデルは、言葉の並び方を学ぶの。文章の穴に入る言葉を予測する、と考えてみましょう」が安全側の候補。連続値拡散を確認後に最終案を絞る。g前半は既存N4に倣い「こうした結び付きも、言語の構造の一つ」とする余地がある。

### 未解決・次の単位

- C1のマスク型拡散／連続値拡散の射程、C4/C5の実際の生成・remaskingは未確認。
- C3の2026-10現在のモデルと普及は未調査。既存報告の2023年GPT/Geminiの資料だけで現行全世代を断定しない。
- C6の「重ねれば文章を組み立てられる」は、モデルとサンプリング手順の組を説明する条件をUnit 5で検討する。
- **次は Unit 2（LLaDA、Dream、Diffusion-LMの原論文・公式コード）**。新しい単位へ進む前に、指示されたチェックポイントを取る。

## Unit 2: C1・C4・C5 — マスク型拡散と連続値拡散、確定とremaskingの区別

完了日・全出典の取得日: **2026-10-14 UTC**。初期計画のUnit 2を完了。論文・公式コードを読んだ調査であり、モデルのロードや生成実験は行っていない。

### 一次資料・所在・原文引用

- **S5** Nie et al., *Large Language Diffusion Models*, arXiv:2502.09992v3（版の日付 **2025-10-18**、基準日前）。https://arxiv.org/html/2502.09992v3 。§2.1、§2.4、Appendix A.1 Eq.(10)、Algorithms 4/5、B.4 Figure 4、B.6 Figure 5。引用（合計23語）: “starting from a fully masked response” (§2.4); “Block diffusion sampling applies the origin reverse process within each block and the autoregressive sampling across blocks.” (B.4)。学習はマスク率を変えた復元。生成は全マスクの応答から始め、穴の予測と選別を繰り返す。通常の逆過程Eq.(10)とAlgorithm 4は確定済みトークンを保持。B.4はブロック内を拡散、ブロック間を自己回帰とする混合手順を明記。Figure 5は1回の計算で8/4/2/1トークンを確定する設定を示す。
- **S6** ML-GSAI公式 `LLaDA/generate.py`、commit **f2683fd9cd10721f2853bafa52f8572ae8155d0c**（GitHub APIで **2026-07-12T11:58:09Z** と確認）。https://github.com/ML-GSAI/LLaDA/blob/f2683fd9cd10721f2853bafa52f8572ae8155d0c/generate.py （本文取得は同じcommitのraw URL）。`generate` L125–181、`var_generate` L185–208。短い引用: `x0 = torch.where(mask_index, x0, x)` (L174)。確信度による選別の対象を現在のマスク位置に絞り、既存トークンを保つ。`block_length`で左からのブロック生成を選べる。`var_generate`には次のブロックを後から付ける実装もある。最新mainだけに依存せず、この基準日前のcommitへ固定。
- **S7** Ye et al., *Dream 7B: Diffusion Large Language Models*, arXiv:2508.15487v1（**2025-08-21**）。https://arxiv.org/html/2508.15487v1 。§3 Eq.(2)/(3)、§4.1、§4.3、Table 1。引用（10語）: “We employ discrete diffusion with absorbing states” / “progressive full-context prediction” (§3)。Dreamは[MASK]をノイズとする離散拡散。時刻が連続であることと、データが連続値であることは別。§4.1の位置をずらす予測はAR初期重みを活用するためであり、推論全体が左から順になるという意味ではない。
- **S8** DreamLM公式README、commit **fd91b8f1d47c5cbe4a8a1674fd9b98045e79d9db**（GitHub API: **2025-09-26T11:53:48Z**）。https://github.com/DreamLM/Dream/blob/fd91b8f1d47c5cbe4a8a1674fd9b98045e79d9db/README.md 。読んだページ https://github.com/DreamLM/Dream の “Parameters of diffusion_generate()”。引用（12語）: “The remasking strategy in diffusion sampling, controlling the token generation order.” `origin`はランダム、他は最高確率・1位と2位の差・entropy等による順序選択。stepsを減らすと1段階で複数トークンを出す。
- **S9** Dream-org公式モデルの `generation_utils.py`。https://huggingface.co/Dream-org/Dream-v0-Instruct-7B/blob/05334cb9faaf763692dcf9d8737c642be2b2a6ae/generation_utils.py 。読んだmainのモデルAPIでSHA **05334cb9faaf763692dcf9d8737c642be2b2a6ae**、最終更新 **2025-07-15T09:23:55Z** を確認。`DreamGenerationMixin._sample` の初期化・`mask_index`・`origin`/他のalg分岐（web表示L567–667）。短い引用: `mask_index = (x == mask_token_id)`。どの標準分岐もマスク位置のみを書き換える。ユーザー定義hookを使わない既定の処理では既に確定した位置を変更しない。論文のDream 7Bとこの先行v0実装の版は混同せず、コードの結論はv0の標準samplingに限定。
- **S10** Li et al., *Diffusion-LM Improves Controllable Text Generation*, arXiv:2205.14217v1（**2022-05-27**）。https://arxiv.org/pdf/2205.14217 （取得本文にv1日付あり）。Abstract p.1、§3 pp.3–4、§4.1–4.2 pp.4–5、Figure 1 p.2。引用（13語）: “Diffusion-LM iteratively denoises a sequence of Gaussian vectors into word vectors” (Abstract)。連続値の潜在ベクトルからノイズを減らし、語へ写す。通常のマスク記号を逐次埋める処理ではない。

検索で見つかったfork、Reddit、第三者要約は証拠に採用していない。公開日の相対表示ではなく原論文の版日付とコードのcommit日付を用いた。各資料の原文引用は25語以内。

### 判定と絵への含意

1. **C1 g: 一般定義としては『限定すれば言える』が確定。** 穴埋めはAR、BERTのMLM、T5のスパン復元、LLaDA/Dreamのマスク型をつなぐ直観にはなる。一方、S10の連続ノイズを穴と呼ぶのは実装の記述ではない。「言語モデルは、言葉の並び方を学ぶの。ここでは、文章の穴に入る言葉を予測するものとして考えてみましょう」のように説明上の見方とする。すべての言語モデルが必ず同じ穴埋め器であるとは言わない。
2. **C4 4・5: 『拡散型の一つ』への限定なら言える。** S5/S7はマスク型、S10は連続値型。穴埋めだけを拡散一般の定義にはしない。「拡散型の多く」は割合の母集団・集計がないので、この調査からは採用しない。案: 4「穴だらけの下書きから、何か所かずつ埋める作り方もあるの。」5「これは、拡散型と呼ばれる作り方の一つよ。」ここでいう「下書き」は絵の比喩で、既に書いた文章を必ず用意するという意味ではない。
3. **C5の元の絵は、マスク型の一手順の『確定した状態だけを描く例』として言える。** 穴をいくつかずつ埋め、確定後は保持する表示はS5 Eq.(10)、S6、S9に対応する。全拡散型を代表する唯一の図にはしない。下段の札は「拡散型の一例」または「穴を埋める拡散型」にする案。「例」の札に加え、実単位はトークンである注を既存方針どおり保つ。
4. **remaskingを理由に『一度出た語を必ず消すアニメが必要』とはいえない。** S5 §2.4では穴すべてに仮候補を予測し、一部を再マスクする。この仮候補を表示せず、選別後の状態だけ描けば穴は減るだけになる。S6/S9のコード読解でも標準手順は過去の確定済み位置を保持する。制作メモは「この図は各段階で残すと決めた語だけを見せる」と明示すれば足りる。低確信度の候補を穴へ戻す過程を詳述するなら、仮候補と確定済みの区別が要る。
5. **『ばらばらの順』は『先頭からとは限らない』を表す。** S8の順序はランダムだけではなく確信度でも選ぶため、意味なくランダムに配置するとの語りは避ける。語りの候補は「前からとは限らない順で」。同じ日本語完成文へ到達する二段は説明用に構成した例であり、二つの実モデルが必ず同じ出力を返す実験結果ではない。
6. **semi-autoregressiveは両分類の境界が混ざる例。** S5 B.4/S6ではブロック間を左から、ブロック内を複数位置の穴埋めで進められる。「拡散型は絶対に前から書かない」「文章全体を必ず同時に処理」は不可。今の短い導入に全方式を描く必要はないが、全体を埋めるのは今回の例の条件とする。
7. **『穴を埋める＝拡散』の逆も不可。** Unit 1のT5のスパン復元はdecoderの逐次生成であり、穴埋めの課題と拡散というモデル化を同一視しない。C6で「穴埋めを繰り返す」だけから、任意のMLMがよい文章生成器になるとは導かない。

### 未解決・次の単位

- 商用MercuryとGemini Diffusionの内部がマスク型か連続値型かは未確認。公開発表の「noise」だけで連続値型と断定しない。
- 今回の公開コードが保持する方式と、確定済み位置を改めて修正する別の方式の一般論を混同しない。商用モデルで修正が明示されるかはUnit 3で照合する。
- 論文Algorithm 5の`n_un`の説明とLowestの個数には表記上の不整合が見える。細かな個数の根拠には使わず、Eq.(10)、Algorithm 4、実コードを基準とする。この誤記の著者への照会は本件に不要。
- **次はUnit 3（Mercury、Gemini Diffusionの一次資料）**。指示に従い、この完成した単位を記録してチェックポイントを取る。

## Plan revision 1

Unit 2で、C5の「remasking」が、(a)同じ段階の仮候補を戻す操作と、(b)過去の確定位置を編集する操作を区別しないと誤解を生むと判明した。派生質問「絵は候補を描くのか、確定後の状態を描くのか」を原問いに必要なため今追究し、Unit 2で(a)に対応する単調な穴埋め図が成立すると確認した。Unit 3に商用発表で(b)がどこまで明示されるかの照合を加える。研究全体の問いは変更しない。

残る単位:
- Unit 3: C4/C5 × Mercury・Gemini Diffusionの一次資料。ノイズの種類、更新・修正の公表範囲。
- Unit 4: C3 × 主要6系列の公式資料と基準日前の利用・評価情報。「主流」の根拠と限界。
- Unit 5: C3/C6 × 複数トークン予測・推測的デコードの原論文、全原稿の接続。
- Unit 6: 全項目・全対象文、引用量、日付、不確実性の照合。その後ready-to-report。
- 別ターン: 日本語のreport.md作成。

## Unit 3: C4・C5 — Mercury、Gemini Diffusionの公開範囲と離散ノイズの第三の形

完了日・全出典の取得日: **2026-10-14 UTC**。初期計画のUnit 3を完了。native webで一次資料を確認し、商用APIの呼出し・モデル実行は行っていない。

### 一次資料・所在・短い原文引用

- **S11** Khanna et al., *Mercury: Ultra-Fast Language Models Based on Diffusion*, arXiv:2506.17298v1（**2025-06-17**）。https://arxiv.org/html/2506.17298v1 。Abstract、§1、§2.1 Training/Architecture、§2.2 Serving。引用（計13語）: “trained to predict multiple tokens in parallel” / “modifying multiple tokens in parallel”。§2.1はトークン列の空間にあるノイズ状態と逆過程を記述するが、具体的な遷移核やマスク記号の指定はない。§2.2の推論エンジンはproprietary。SEDDを拡張したとの記載だけから特定のノイズ方式を確定しない。
- **S12** Inception, *Introducing Mercury, the World’s First Commercial-Scale Diffusion Large Language Model*。https://www.inceptionlabs.ai/blog/introducing-mercury 。見出し“Our Vision”“Mercury Coder”“What’s next”。並列の反復更新と将来的な編集・生成順序の自由を説明。現在ページに公開日表示がなく、2025年のモデルの技術的根拠は日付固定のS11を優先する。性能優位の広告的な一般化は本調査の事実認定に採らない。原文引用なし。
- **S13** Inception, *Introducing the Inception API*。https://www.inceptionlabs.ai/blog/introducing-inception-api 。“Diffusing Mode”。引用（7語）: “stream blocks of noisy tokens”。`diffusing`によって途中のノイズを含むブロックを逐次表示できるというAPI説明。現在ページの公開日表示がないため、基準日前の詳細な内部仕様の証拠にはしない。
- **S14** Google DeepMind, *Gemini Diffusion*。https://deepmind.google/models/gemini-diffusion/ 。“What is a diffusion model?”、“More coherent text”、“Iterative refinement”。引用（計21語）: “refining noise, step-by-step”; “Generates entire blocks of tokens at once”; “Corrects errors during generation for more consistent outputs.” 公開ページはノイズの種類、マスク記号、個々の位置の確定条件を特定しない。本文に日付はなく、発表日はS15で確定する。
- **S15** Google公式発表、*Gemini Diffusion is our new experimental research model*（**2025-05-20**）。https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-diffusion/ 。発表本文。引用（11語）: “converting random noise into coherent text or code”。実験的デモの公表と反復的なノイズからの生成を裏付ける。「画像と似た方法」はGaussianノイズを使うという証拠にはならない。
- **S16** Inception, *Introducing Mercury 2*（公式ブログ一覧 https://www.inceptionlabs.ai/blog で **2026-02-24**）。https://www.inceptionlabs.ai/blog/introducing-mercury-2 。“A new foundation”。引用（7語）: “producing multiple tokens simultaneously and converging”。複数トークンを並列に修正して収束する説明があるが、ノイズ核や確定位置の再変更の厳密な規則はない。
- **S17** Inception, *Introducing Mercury 2.5*（同公式一覧で **2026-09-08**）。https://www.inceptionlabs.ai/blog/introducing-mercury-2-5 。“What changed”“Get Started”。拡散型としての新世代とAPI提供を明記。したがって2026-10にMercury Coderを最新世代として扱わない。ただし本記事から2.5のマスク方式を特定できない。原文引用なし。
- **S18** Google AI for Developers, *Diffusion in Text Generation Explained*（ページ末尾 **Last updated 2026-06-10 UTC**）。https://ai.google.dev/gemma/docs/diffusiongemma/explained 。“Uniform State Diffusion”“Architecture”“Multi-Canvas Sampling”。引用（計15語）: “Instead of an explicit `[MASK]` token”; “entirely random tokens from the vocabulary”。DiffusionGemmaでは語彙から取ったランダムなトークンをノイズに使うと明記。後の文脈で低確信度となった位置を再びノイズ化する。ブロック内は双方向、ブロック間は自己回帰的な処理。
- **S19** Google, *DiffusionGemma: 4x faster text generation*（**2026-06-10**）。https://blog.google/innovation-and-ai/technology/developers-tools/diffusion-gemma-faster-text-generation/ 。導入本文。Gemini Diffusion研究を基にした別の公開実験モデルと明記。S18の内容はGemini Diffusion自体の全仕様の公開とはみなさない。原文引用なし。
- **S20** Google AI for Developers, *DiffusionGemma model overview*（**Last updated 2026-06-10 UTC**）。https://ai.google.dev/gemma/docs/diffusiongemma 。導入、core features。離散拡散、block-autoregressive multi-canvas samplingを明記。S18の解釈を照合した。原文引用なし。

補助的にInceptionの2026-07-14記事 https://www.inceptionlabs.ai/blog/mercury-2-the-first-reasoning-model-fast-enough-to-pick-up-the-phone と2026-08-11記事 https://www.inceptionlabs.ai/blog/mercury-2-for-search を確認。全位置の復元を学ぶことと並列更新の説明はあるが、内部のノイズ核を特定する追加証拠は得られなかった。日付は公式ブログ一覧と照合。これらの広告的な主流モデル・速度・価格の比較は採用しない。

### 確認した事実・判定

1. **Mercuryは並列に反復更新する拡散型だが、この資料群ではマスク型と確定できない。** S11の数式はノイズ付きトークン列と逆過程を記述し、Diffusion-LMのGaussian潜在ベクトルとは異なる記述である。一方、離散状態のどの遷移を使うかは明かしていない。したがって分類表では「トークン列上の拡散を記述。具体的ノイズ／マスク方式は公開資料から未確定」とする。SEDDやMDLMの引用、創業者の別論文から内部仕様を補わない。
2. **Gemini Diffusionの公式発表は生成途中の修正を明言するが、何を『確定済み』と呼ぶかは不明。** S14/S15はノイズを洗練しブロックを生成すると説明する。過去の確定位置を再マスクするのか、まだ確定していない候補を変更するのかまでは判別できない。「修正できる」を「必ず過去の確定語を消す」へ読み替えない。
3. **C5の穴が減るだけの絵を、MercuryやGemini Diffusionの忠実な内部再現として提示する根拠は不足する。** ただしUnit 2のLLaDA/Dreamの特定の手順を根拠に「マスク型拡散の一例」「確定後の状態だけを示す」とする絵は成立する。商用名をその絵に添えて同じ方式と示唆しない。修正アニメーションを必須とする結論にもならない。
4. **『マスクか連続値か』だけでは拡散型を分類しきれない。** S18/S20のDiffusionGemmaは離散語彙のランダム置換であり、明示的な穴とも連続Gaussianノイズとも違う。C1/C4の一般化を避ける理由がもう一つ増えた。制作メモの分類は、(a)マスク、(b)ランダムな離散トークン、(c)連続ベクトル、(d)公表資料では不明、に分けると正確。短い語りに全種類を足す必要はない。
5. **DiffusionGemmaをGemini Diffusionの仕様の代用にはしない。** S19は研究上のつながりを示すが、モデル同一性やすべての生成手順の一致を保証しない。基準日前の新しい反例としては採用し、商用Gemini Diffusionのノイズ分類は未確定のまま残す。
6. **C4の安全な語りは引き続き『拡散型と呼ばれる作り方の一つ』。** 『拡散型の多く』『拡散は穴を埋める方式』は未支持。『どの拡散型も文章全体を一度に完成させる』もブロック処理・反復回数と矛盾する。S12/S14の広告的な『ARより必ず整合的』『誤りを直せるから正しい』も導入へ持ち込まない。

### 未解決・次の単位

- 商用2系列の厳密なノイズ核、確定と再編集の境界は公開した一次資料の範囲で不明。問い合わせや実APIの観察でも内部アルゴリズムを証明できるとは限らず、この調査では追求を止める。
- DiffusionGemmaの実コードの全枝検証はしていない。分類と再ノイズ化は公式の明示的な仕様説明を根拠とし、コード上の保証にはしない。
- **次はUnit 4（C3、主要6系列の公式資料と2026-10時点の『主流』の根拠）**。ボスから閾値到達の通知があったため、完成した本単位を記録しチェックポイントを要求する。

## Plan revision 2

Unit 3で基準日前のDiffusionGemmaの公式資料を発見し、派生質問「離散拡散はすべてマスク型か」を、C1/C4の射程に必要なため同単位へ追加して追究した。回答は否。ランダム語彙ノイズの方式を報告の比較表へ追加する。原問いは変更しない。商用内部の完全解明や追加モデルの網羅は、原稿の判定を変えないため追加単位にしない。Mercuryの新世代が基準日前に公表されているため、Unit 4でも古い技術報告を現在世代へ無条件に広げない方針を維持する。

残る単位:
- Unit 4: C3 × GPT・Claude・Gemini・Llama・Qwen・DeepSeekの公式資料と基準日前の利用・評価情報。「主流」の根拠と限界。
- Unit 5: C3/C6 × 複数トークン予測・推測的デコードの原論文、原稿の接続。
- Unit 6: C1〜C6・全対象文、引用量、日付、不確実性の最終照合。その後ready-to-report。
- 別ターン: 日本語のreport.md作成。

## Unit 4: C3 — 主要系列の自己回帰性と、2026-10の「主流」を支える証拠の限界

完了日・全出典の取得日: **2026-10-14 UTC**。計画のUnit 4を完了。モデルの公表資料と利用集計を分けて調べた。最新モデルの全内部仕様を確認できたという意味ではなく、確認できた世代・確認できない世代を区別してC3を判定する。

### 一次資料・所在・短い原文引用

- **S21** OpenAI, *GPT-4 Technical Report*, arXiv:2303.08774v6（**2024-03-04**、初版2023年）。https://arxiv.org/html/2303.08774v6 。Abstract、§2。引用（10語）: “pre-trained to predict the next token in a document”。次トークン予測の事前学習とRLHF、そのほかの内部詳細を公開しない範囲を明記。今回読んだv6の本文には`autoregressive`の語は見つからないため、引用にその語を補わない。次トークン予測の根拠として用いる。
- **S22** Anthropic, *Glossary*, “Pretraining”“Tokens”。https://platform.claude.com/docs/en/about-claude/glossary 。公開日の表示なし。**取得時点の公式説明**として用いる。引用（10語）: “autoregressive language models (such as Claude's underlying model)”。Claudeの基盤を自己回帰型と明記し、先行する文脈から次の語を予測する事前学習を説明。全モデルIDの個別システムカードに代わるものではない。
- **S23** Gemini Team, *Gemini: A Family of Highly Capable Multimodal Models*, arXiv:2312.11805v5（**2025-05-09**、初版2023年）。https://arxiv.org/html/2312.11805v5 。§2、Appendix 10.1 Model architecture。引用（3語）: “decoder-only Transformer architecture”。Gemini 1.0の構造を記す。Gemini Diffusionや2026年の最新世代までこの一文で保証しない。
- **S24** Gemini Team, *Gemini 2.5: Pushing the Frontier with Advanced Reasoning, Multimodality, Long Context, and Next Generation Agentic Capabilities*, arXiv:2507.06261v1（**2025-07-07**）。https://arxiv.org/html/2507.06261v1 。§2.1 Architecture（とくに小型モデルへの蒸留の段落）。引用（6語）: “the teacher’s next token prediction distribution”。次トークン分布を蒸留する記述があり、2.5系列が次語生成の系列にあることを支える。MoEという単語だけで自己回帰型と推論しない。
- **S25** Meta, *Llama 4 model card*, Model Information / Model Architecture。https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct 。モデルの公開日 **2025-04-05** とカード内に明記。引用（10語）: “The Llama 4 models are auto-regressive language models that use”。Scout/Maverickを自己回帰型と直接明示。MoEと画像入力を持つことはテキスト生成の自己回帰性を否定しない。
- **S26** Qwen, *Qwen3-235B-A22B model card*, Model Overview。https://huggingface.co/Qwen/Qwen3-235B-A22B 。引用（4語）: “Type: Causal Language Models”。対応する日付固定の技術報告 https://arxiv.org/html/2505.09388v1 （**2025-05-14**）も§2・§3を照合。カードは2025年Qwen3の公開モデルを対象とする。
- **S27** Qwen, *Key Concepts*, Causal Language Models。https://qwen.readthedocs.io/en/latest/getting_started/concepts.html 。取得時点の公式ドキュメント、公開日表示なし。引用（10語）: “Qwen models are causal language models suitable for text completion.” causalを自己回帰型とも呼び、先行トークンから次を生成すると説明。系列一般の説明と個別モデルカードの組で用いる。
- **S28** Qwen, *Qwen3.5-397B-A17B model card*, Model Overview / Citation。https://huggingface.co/Qwen/Qwen3.5-397B-A17B 。Citationに **February 2026**。引用（8語）: “Type: Causal Language Model with Vision Encoder”。Gated DeltaNetとGated Attentionを交互に使う構造でも、出力言語モデルはcausalと明示。Qwen3.8 Maxなど別世代をこのカードで直接確認したとはしない。
- **S29** DeepSeek-AI, *DeepSeek-V3 Technical Report*, arXiv:2412.19437v2（**2025-02-18**、初版2024-12-27）。https://arxiv.org/html/2412.19437v2 。§2.2、Figure 3、MTP in Inference、§5のMTP評価。引用（9語）: “keep the complete causal chain at each prediction depth”。複数の未来トークンを予測しながら因果鎖を保つ構造を記述し、MTPを取り外す通常推論と推測的デコードへの利用を区別する。Unit 5で生成手順を詳しく扱う。
- **S30** DeepSeek公式透明度センター https://www.deepseek.com/transparency/ と、そこからリンクされたV4モデルカード https://fe-static.deepseek.com/chat/transparency/deepseek-V4-model-card-CN_3c2bd9.pdf 。モデル公開日 **2026-04-24**、PDF表紙の資料公開日は **2026-04-27**（更新日のほうが先に見える記載上の不整合はあるが、いずれも基準日前）。p.3「模型架构」はV3のMTP戦略を継承と明記。公式配布ページ https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro のIntroduction、How to Run Locally、技術報告リンクも確認。V3の基本構造とのつながりを確認したが、V4.1の詳細な推論コードまで検証していない。原文引用なし。
- **S31** OpenRouter, *AI Model Rankings*。https://openrouter.ai/rankings?view=week 。ページに **Usage data through Oct 13, 2026** と表示。How these rankings are measured、Model rankings by tokens processed、Market Shareを確認。引用（12語）: “These rankings show traffic routed through OpenRouter.” / “None of them measures users or spend.” 週次表の著者別リクエスト構成比はDeepSeek 24.5%、OpenAI 18.6%、Google 17.8%、Qwen 5.4%、Anthropic 3.9%。これら5系列の合計は70.2%（単純加算）。**これは自己回帰型の世界シェアでも、この5系列の全モデルの構造の証明でもない。** トークン数の表は入出力合計であり、同ページのリクエスト比率と混ぜない。可変ページなので取得日・集計最終日を必ず併記する。
- **S32** Aubakirova et al. / OpenRouter・a16z, *State of AI: An Empirical 100 Trillion Token Study with OpenRouter*, arXiv:2601.10088v1（**2026-01-15**、本文にDecember 2025）。https://arxiv.org/html/2601.10088v1 、同じ調査の公式表示 https://openrouter.ai/state-of-ai 。Open vs. Closed Source Models、Key Open Source Players、§10 Limitations。公式表示の著者別オープンモデル合計（**2024-11〜2025-11**）はDeepSeek 14.37T、Qwen 5.59T、Meta LLaMA 3.96Tトークン。引用（11語）: “This study reflects patterns observed on a single platform, namely OpenRouter”。企業の内部利用・ローカル実行等が含まれない制約を明記。2026-10のシェアとして再利用しない。推論・エージェント化の同資料の大きな物語は、自己回帰／非自己回帰の分類証拠には採らない。
- **S33** Google DeepMind, *Gemini 3.7 Flash Model Card*（**2026-08-13**）。https://deepmind.google/models/model-cards/gemini-3-7-flash/ 。Architecture、Distribution、Evaluation。2026年の比較対象を確認する資料。評価表にはClaude Sonnet 5、GPT-5.6 Terra等が並ぶが、評価点は利用率ではない。Architectureは3.6 Flashへ参照するだけ。引用なし。
- **S34** S33の参照をたどったGoogle公式モデルカード群。3.6 Flash（**July 2026**） https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-6-Flash-Model-Card.pdf 、3.5 Flash https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-5-Flash-Model-Card.pdf 、3 Flash（**December 2025**） https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-Flash-Model-Card.pdf 、3 Pro（取得版 **May 2026**） https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-Pro-Model-Card.pdf 。各Architecture、最終的に3 Pro PDF p.3。3.7→3.6→3.5→3 Flash→3 Proと構造の参照が続き、最終資料はsparse MoE transformerと説明する。これだけではcausal maskやデコード順序の明示にならないため、最新世代の自己回帰性を「直接確認」とはしない。引用なし。
- **S35** OpenAI公式 Models https://developers.openai.com/api/docs/models と What's new https://learn.chatgpt.com/docs/whats-new 。取得時の現行モデル一覧と、2026-09の週次告知を確認。GPT-6系列などが公表済みであり、GPT-4を最新世代と呼べない。モデル一覧は内部の生成方式の仕様ではない。引用なし。openai-docsスキルの指定する公式ドキュメント検索・本文取得を先行し、その範囲では構造を確認できなかったため、ボスが求めた一次論文もS21として調べた。
- **S36** OpenAI, *Predicted Outputs*。https://developers.openai.com/api/docs/guides/predicted-outputs 。本文を公式Docsツールで取得。GPT-4o/4.1系列の出力予測を使った高速化、accepted/rejected prediction tokensを説明。公開日のない現在の機能説明なので、歴史的な実装日付や全GPT系列の仕様の根拠にはしない。引用なし。Unit 5の補助資料候補。

補助確認: OpenAI Tokenizer https://platform.openai.com/tokenizer は検索結果に次トークン予測の説明が出たが、直接openでは本文0行だったため主要証拠にはしない。Anthropicの検索結果にあった2026年PDFは取得エラーだったため未読資料として扱い、引用していない。第三者のランキング転載やSNSのモデル構造に関する推測は採用しない。

### 確認した事実と判定

1. **C3は「限定すれば言える」。** 公表資料が示す主要な系列には、先行する出力に条件付けて続きを生成する自己回帰型が広くある（S21〜S29）。これらの系列の広い利用は一次集計S31/S32で裏付けられる。したがって一般向け導入で「前から順に書く作り方が広く使われている」と言える。一方、最新の全商用モデルIDの内部構造や、2026-10の世界全体で自己回帰型が占める正確な割合は確認できていない。「主流」を定量的な過半数・全上位モデルの断言とするのは資料を越える。
2. **短い推奨案は「広く使われているのは、前から順に書く作り方よ」。** 「いま主流のLLMは」を残すなら制作メモに「2026-10-14時点、主要系列の公表資料と利用集計を総合した定性的な説明。全LLM・全最新版の構造保証ではない」と記す。画面の上段は「前から順に書く型」または「自己回帰型」の例として示す方が、変化の速い市場順位に依存しない。
3. **主要6系列の根拠の強さは一様でない。** Llama 4、Qwen3/3.5、Claude公式一般説明は自己回帰／causalを直接明記する。GPT-4は次トークン事前学習を明記。Gemini 1.0はdecoder-only、2.5は教師の次トークン分布を明記する。DeepSeek-V3は次トークンとMTPの因果鎖を具体的に示す。最新のGPT・Geminiすべてへ古い論文を外挿しない。単にTransformer、MoE、thinkingと書かれているだけでは生成順序を確定しない。
4. **「主流」の根拠は二段に分ける。** (a)開発元の論文・モデルカードで生成方式を確かめ、(b)評価資料・利用資料でその系列が主要な比較対象／使用対象であることを確かめる。評価で高得点＝広く使用、APIで大量token＝世界全体の高シェア、のどちらも成立しない。S31の集計自体も、現在の主要モデル名が旧論文の世代と違うことを示すので、方式別シェアの数値は算出しない。
5. **「前から順に」は、文章の依存関係と確定する接頭辞の説明に限定する。** 1トークンずつの単純な図は基本方式の説明例にはなるが、全サービスが毎回の物理的計算で必ず1トークンだけ生成するという仕様ではない。S29のMTPとS36の出力予測がその注意の根拠。推測的デコードの原論文に基づく厳密な説明は次のUnit 5で完成させる。
6. **「思考するモデルだから自己回帰型ではない」とは判断しない。** S26のQwen3カードはcausalであることとthinking/non-thinkingの両モードを同時に明示する。エージェントの反復呼出しや内部思考の長さと、1回のトークン列生成の因果構造は別の軸。

### 未解決・次の単位

- 最新GPT全モデルID、Gemini 3以降の全モデル、Claude各IDの個別生成仕様は、今回確認した公開資料だけでは一律に断定できない。これは原稿を限定するための不確実性として報告へ残す。全モデルの非公開仕様の完全解明は本調査で追わない。
- OpenRouterは利用の一次データだが世界代表の無作為標本ではない。世界全体の方式別シェアは未確定。商用拡散の存在（Unit 3）は「全LLMが同じ」の反例だが、それだけで自己回帰型が広く使われることを否定しない。
- **次はUnit 5（C3/C6、複数トークン予測・推測的デコードの原論文と原稿の接続）**。ボスから閾値到達の通知があったため、本単位をログに確定してチェックポイントを要求する。

## Plan revision 3

Unit 4で、現在の利用順位のモデル名と、内部構造を詳しく公表した世代が必ずしも一致しないと確認した。派生質問「最新モデルすべての方式と世界市場シェアを確定する必要があるか」は、元の教育用原稿を判定するためには不要と判断し、網羅調査は追加しない。原問いは維持する。「主流」を残すなら定性的総合判断と示し、短い推奨案では「広く使われている」とする。最新の個別製品を説明する制作に変わった時点で、当該モデルカードの追加確認を次の行動として勧める。

残る単位:
- Unit 5: C3/C6 × MTP・推測的デコード原論文。因果的な順序と計算の並列性、1・3・6・qの語りの接続。
- Unit 6: C1〜C6と全11文・上下の絵の判定を照合。引用量、基準日、不確実性を確認。その後ready-to-report。
- 別ターン: 日本語のreport.md作成。

## Unit 5: C3・C6 — 自己回帰の順序、並列計算、穴埋めから文章生成への接続

完了日・全出典の取得日: **2026-10-14 UTC**。計画のUnit 5を完了。論文のアルゴリズムと、依頼原稿の1・3・6・qを照合した。モデル実行やプロジェクトファイルの変更は行っていない。

### 一次資料・所在・短い原文引用

- **S37** Leviathan, Kalman & Matias (2023), *Fast Inference from Transformers via Speculative Decoding*, ICML/PMLR 202:19274–19286。公刊日 **2023-07-23〜29**。書誌 https://proceedings.mlr.press/v202/leviathan23a.html 、本文 https://proceedings.mlr.press/v202/leviathan23a/leviathan23a.pdf 。§2.1–2.3、Algorithm 1（PDF pp.2–3）、Appendix A.1。引用（11語）: “have the same distribution as those from the target model alone” (PDF p.2)。近似モデルが複数の候補を作り、対象モデルがその候補列の各位置の条件付き確率を並列に評価。先頭から受理された候補を保持し、最初の棄却位置を補正分布から選び直す。対象モデル1回で複数トークンを得られ、論文の正確な受理・補正手順では対象分布が変わらない。
- **S38** Gloeckle et al. (2024), *Better & Faster Large Language Models via Multi-token Prediction*, arXiv:2404.19737v1（**2024-04-30**）。https://arxiv.org/html/2404.19737v1 、版日付 https://arxiv.org/abs/2404.19737v1 。Figure 1、§2 Method / Inference、§3.2。引用（8語）: “vanilla next-token autoregressive prediction using the next-token prediction head” (§2)。共有の幹と複数の独立したheadで未来の複数位置を予測する訓練。推論では次トークンheadだけ使えるし、追加headをself-speculative decodingに使うこともできる。複数トークンを予測する訓練目標から、推論が非自己回帰だとは導けない。
- **S29再照合** DeepSeek-V3 Technical Report, arXiv:2412.19437v2（**2025-02-18**）。https://arxiv.org/html/2412.19437v2 、§2.2、Figure 3、MTP in Inference。Unit 4の引用 “keep the complete causal chain at each prediction depth” を再利用（新しい引用は追加しない）。S38の独立head方式と異なり、DeepSeek-V3は追加位置を順次予測し、各予測深さで因果鎖を維持すると明記。MTP moduleを外して通常の推論を行うことも、推測的デコードに転用することもできる。
- **S39** Wang & Cho (2019), *BERT has a Mouth, and It Must Speak: BERT as a Markov Random Field Language Model*, NeuralGen pp.30–36（**2019-06-06**）。https://aclanthology.org/W19-2304/ 、本文 https://aclanthology.org/W19-2304.pdf 。§3 Sampling / Sequential Sampling、§4（pp.31–33）。引用（11語）: “we initialize to be an all-mask sequence” / “We repeat this procedure many times” (p.32)。全マスク等で初期化し、位置を選んでマスクし、その位置の候補を選んで更新する生成手順を試す。**本調査ではこの生成手順の存在だけを根拠にする。** 同論文のMRFの結合分布とMLMの出力条件分布の同一視はS4 Appendix Bの指摘を踏まえ、そのまま一般的な定理として採らない。初版／更新日の補助確認 https://arxiv.org/abs/1902.04094 （v1 2019-02-11、v2 2019-04-09）。

ローカル資料（同日取得）:
- `decks/llm/clips/langmodel.js` のscriptと図の注、`decks/llm/clips/compose.js` のscriptとラベル、`decks/llm/deck.js` の並び。
- `decks/llm/clips/route.js`、`predict.js`、`pretrain.js` の対象説明。後続が次トークンの予測・選択・反復を扱うことを確認。これはデッキ全編の事実監査ではない。
- 依頼時の原稿11文を判定対象とする。現在のローカルファイルにはすでに穴埋め版とcomposeが存在するが、並行作業の変更は編集しない。ログUnit 1の「現状」はUnit 1取得時の記録であり、書き換えない。

### 確認した事実と判定

1. **C3「前から順に」は、出力の条件付き依存関係としては維持できる。** S37では最終的に残す列を接頭辞から延長し、同じ自己回帰分布から標本を得る。並列に計算した先の候補も、途中の候補が棄却されればそのまま確定できない。一方、対象モデルの1回のforward passで複数位置を検証し、複数トークンを返せる。「前から順に」から「各物理計算は必ず一語だけ」「常に1トークンにつき大モデルを1回呼ぶ」とは言えない。分布が同じとは、個々の実行の出力文字列や乱数消費が必ず同じという意味ではない。
2. **複数トークン予測は単一の生成方式名ではない。** S38は独立head、S29は因果鎖を持つ追加moduleという違いがあり、両者とも通常の次トークン推論と推測的な高速化を区別する。したがって「MTPなら必ず非自己回帰」「MTPなら追加候補をすべて無検証で出す」は不可。確認した論文の手順の結論を、MTPを名乗る全実装へ無条件に広げない。
3. **上段の一つずつ書き足す絵は、基本の逐次生成の例として言える。** 原稿2の判定はUnit 4どおり「限定すれば言える」。補助注は「基本の手順の例。実際には複数の候補をまとめて検証する高速化もある」で十分。初学者向けの語りで推測的デコードを詳説する必要はない。左からの語句カードは実トークン境界や計算のタイミングを再現したものではない、と制作メモへ残す。
4. **C6・文1は「限定すれば言える」。** 自己回帰型では候補を選んで文脈へ足す反復、マスク型拡散では穴を更新するスケジュールを組み合わせれば文章を生成できる（S1/S5/S7/S37）。S39はBERTにも別途の反復生成手順を構成できる実例。ただし、単に候補の確率を出すことだけで文章が完成するわけではなく、どの位置を更新するか・何を残すか・いつ終えるかを決める必要がある。「どんな穴埋め器でも繰り返せば整った文章になる」「全言語モデルの全用途が穴埋め生成」の意味にはしない。短い案: **「穴に入る言葉を選び、予測を重ねると、文章を作れるの。作り方は、一つではないわ。」** これは今回扱う生成手順への説明であり、品質の保証ではない。
5. **文3は「限定すれば言える」。** 比喩としては次の未知位置を示す穴を開ければよいが、通常の自己回帰decoderが毎回入力列へ実際の[MASK] tokenを追加する、という事実説明にはしない。短い案: **「終わりの穴を埋めたら、今度はその先の言葉を予測するの。」** 図では点線の空欄を次の位置へ移す／足すだけで対応する。制作メモに「穴は未知位置の記号で、実装上のmask tokenではない」と明記する。
6. **C6・文6は「言える」。** 「この先は、前から順に書く型を追っていくのよ」は、この教材の説明範囲を宣言する文であり、拡散型を排除したLLMの普遍定義ではない。現在のroute/predict/pretrainはその流れに合う。原文のまま使える。任意の短い案は **「この先は、前から順に書く型のしくみを見ていくわ。」** 後続の各クリップを単独で共有するとこの限定を見落としうるため、その際は必要な場所へ自己回帰型への限定を置く。全編の再監査は別作業。
7. **qは問いとして「言える」だが、gの射程を狭めた案と揃える。** q自体は技術的命題の断言ではない。ただし「言語モデル＝穴埋めだけ」を復唱させるより、**「穴に入る言葉を予測する、という見方はわかったのだ。でも、それがどうして AI の話になるのだ？」** とすれば、一般定義ではなく導入の見方だと保てる。AI能力の原因をこの一問だけで説明したことにはならない。kやwhyaiの因果説明は既存intro-factsの対象で、本単位で追加断定しない。
8. **学習目標・モデルの出力・文章を作る手順・画面の出現順を分けるのが本件の要点。** マスク課題を学んだT5でもdecoderは自己回帰的（S3）。複数未来位置を学ぶモデルも次トークン生成に使える（S38/S29）。自己回帰モデルでも検証計算は並列にできる（S37）。穴の絵を共通の直観に使うことはできるが、この四つを同じ分類軸として説明しない。

### 未解決・次の単位

- 今回の論文は、特定の商用APIがどの高速化を本番で使うかを証明しない。製品ごとの推論エンジン、MTPの採否、速度差の網羅調査は原稿の判定に不要で、追加しない。
- 一般のBERT条件分布の整合性や厳密な定常分布の導出は、C6の「生成手順を別に定める」ことを越える。S4の注意を記載し、数学上の全面的な証明は追わない。
- **次はUnit 6（全C1〜C6、原稿11文と絵、引用量・日付・不確実性の最終照合）**。閾値到達の指示に従い、本単位を完全に追記してチェックポイントを要求する。まだready-to-reportではなく、report.mdは書かない。

## Plan revision 4

Unit 5で派生質問「穴埋めの確率を出せることと、文章生成手順があることは同じか」を明確に分離する必要を確認した。原問いC6に必要なため、BERTの反復生成研究S39を同単位へ追加して追究し、候補の選択・位置の更新・終了の手順が別に要ると整理した。研究の中心の問いは変わらない。派生質問「推測的デコード等を各商用APIが現在どこまで使用するか」「後続の全クリップを単独閲覧しても限定が通じるか」は、本調査では網羅しない。前者は製品仕様を描く時の再確認、後者は制作時の確認事項として報告の次の行動へ残す。

残る単位:
- Unit 6: C1〜C6、全11文・上下の絵、引用量、基準日、不確実性の最終照合。完了時はready-to-report。
- 別の報告ターン: 日本語のreport.mdを、既存intro-factsの形式に倣って作成。

Unit 5追補（同日、引用語数の訂正）: S38の記載引用は9語、S39の二つの引用は合計13語。上の「8語」「11語」は数え違い。引用本文と所在、判定は変わらず、どちらも1資料25語以内。Unit 6ではこの訂正後の語数を採る。

## Unit 6: 全11文・C1〜C6・上下の絵と出典の最終照合

完了日・照合日: **2026-10-14 UTC**。Plan revision 4の最後の調査単位を完了。これはUnit 1〜5で取得済みの一次資料と原稿の照合であり、外部資料の再取得をしたという意味ではない。外部資料の取得日は各Unitにある2026-10-14のまま。報告書はこのターンでは作成しない。

### 照合した資料・所在

- `research/compose-facts/log.md` 全Unit 1〜5、Plan revision 1〜4、S1〜S39のURL・所在・公開日・引用・留保。本単位で新しい外部出典は追加していない。
- 依頼原稿の11文（langmodelのg/i/i2/j/q、composeの1〜6）、C1〜C6、上下の絵の条件。判定対象は依頼時の文で固定する。
- `decks/llm/clips/langmodel.js` のscript、候補・数字・例の注、`decks/llm/clips/compose.js` のscript・WORDS・DIFF・上下段ラベル・例の注（本単位の取得日2026-10-14）。実装にも依頼と同じ文があり、下段の語句群を3段階で追加する描画を確認。ブラウザの表示・音・動作を検証したわけではない。
- `research/intro-facts/report.md` の要約・判定表・N3/N4/N8と引用の形式、`docs/spec.md` の語り・表示に関する契約（本単位の取得日2026-10-14）。既存報告と今回のS番号は別系統なので混同しない。
- 出典の要点を再照合した主な所在: S1 §1–2（列確率と次語分布）、S2 §3.1（MLM）、S3 §3.1.4/Fig.2（スパン復元）、S4 §2/Appendix B（擬似尤度）、S5 §2.4/Appendix A.1/B.4（生成と保持・ブロック）、S6 `generate`、S9 `_sample`（マスク位置だけを更新）、S10 §4（連続ベクトル）、S11 §2.1–2.2/S14–S18（商用公表範囲と別種の離散ノイズ）、S21〜S35（主要系列と利用の範囲）、S37 Algorithm 1/S38 §2/S29 §2.2（並列検証・MTP）、S39 §3（BERTの追加生成手順）。URLは前単位のS番号に付記済み。

### C1〜C6の最終判定

| 項目 | 判定 | 判定の範囲と短い案 | 根拠 |
|---|---|---|---|
| C1 穴埋めによる一般説明 | **限定すれば言える** | 共通の直観として使える。全言語モデルの必要十分な定義や、実装が同じマスク記号を使うとの説明にはしない。「文章の穴に入る言葉を予測する、という見方で考えてみましょう」 | S1〜S10、S18/S20 |
| C2 候補の数字・文末の穴 | **限定すれば言える** | 候補の正規化された確率を示す。自己回帰型の手がかりは既にある文脈。末尾の次の位置の予測を指し、末尾に複数の穴があれば必ず自己回帰、とはしない。「手がかりになる言葉を見て」「いまある文章の先の穴」 | S1〜S3、S5/S6 |
| C3 現在の主流と順序 | **限定すれば言える** | 主要系列の公表資料と利用の広さを合わせた定性的判断。最新全製品の方式・世界の過半数は未確認。「広く使われているのは、前から順に書く作り方よ」 | S21〜S35、S37/S38/S29 |
| C4 穴を減らす拡散 | **限定すれば言える** | マスク型の例。連続ベクトルやランダムな離散トークンを使う拡散もある。「拡散型と呼ばれる作り方の一つよ」 | S5〜S20 |
| C5 下段の図 | **限定すれば言える** | マスク型の特定の手順で、選別後に残す語だけを描く例なら成立。全拡散型やMercury/Gemini Diffusionの内部再現としては**言えない**。「前からとは限らない順で穴を埋める、一つの例」 | S5/S6/S8/S9、S11/S14/S18 |
| C6 反復生成と後続の範囲 | **文1は限定すれば言える／文6は言える** | 候補の選択・更新位置・終了の手順を伴う生成の説明。任意の穴埋め器が良質な文章を必ず作れるとの保証にしない。後続を前から書く型へ限定する宣言は妥当 | S1/S5/S7/S37/S39、ローカルの後続クリップ |

### 全11文の判定と短い言い方の案

言い換えは事実として言える範囲を示す案であり、文面・タイミングの実装ではない。原文の「言葉」は非専門家向けの語で、図と制作メモに実際の単位はトークンと残す。

| 文 | 判定 | 短い案・条件 |
|---|---|---|
| g | 限定すれば言える | 「こうした結び付きも、言語の構造の一つ。言語モデルを、文章の穴に入る言葉を予測するものとして見てみましょう。」前半は既存N4の限定も反映。穴埋めを唯一の一般定義にしない |
| i | 限定すれば言える | 「手がかりになる言葉を見て、穴に入る候補に、それぞれ確率を付けるの。」i2で初めて確率と名付ける構成を保つ場合は、末尾を原文どおり「ありそうな度合いを数字で付けるの」とする |
| i2 | 言える（図の数字が確率という設定で） | 「この数字が、確率よ。」原文を維持可。任意のlogitや点数を確率とは呼ばない。実測ではなく説明用の確率と表示する |
| j | 限定すれば言える | 「いまある文章の先の穴を埋めるのが、次の言葉の予測よ。」書きかけの列のすぐ次を指す。穴の位置だけで生成方式全体を定義しない |
| q | 言える（問いとして） | 「穴に入る言葉を予測する、という見方はわかったのだ。でも、それがどうして AI の話になるのだ？」gの限定と合わせる。AI能力の原因について新たな断定は足さない |
| 1 | 限定すれば言える | 「穴に入る言葉を選び、予測を重ねると、文章を作れるの。作り方は、一つではないわ。」予測だけでなく選択・反復の手順を伴う |
| 2 | 限定すれば言える | 「広く使われているのは、前から順に書く作り方よ。」物理的な計算が毎回一語ずつとは言わない |
| 3 | 限定すれば言える | 「終わりの穴を埋めたら、今度はその先の言葉を予測するの。」穴は未知位置の比喩。通常の自己回帰decoderが[MASK]を追加するとの説明にしない |
| 4 | 限定すれば言える | 「穴だらけの下書きから、何か所かずつ埋める作り方もあるの。」全マスクから始める例。すでに文章の下書きを別途作った、との意味にはしない |
| 5 | 限定すれば言える | 「これは、拡散型と呼ばれる作り方の一つよ。」『多く』『すべて』に広げない |
| 6 | 言える | 「この先は、前から順に書く型を追っていくのよ。」原文維持可。教材の範囲宣言である |

### 絵の最終判断と制作へ渡す条件

1. **上段は基本の逐次生成の例として維持できる。** 札は「前から順に書く型」または「自己回帰型」が適切。1枚の語句カードを1実トークン、1モデル計算と同一視しない。推測的デコードは先の候補を並列に検証し複数を受理できるが、自己回帰的な条件付き分布からの生成という説明を崩さない（S37）。
2. **下段は穴が減る図のまま維持できる。** 札を「拡散型の一例」または「穴を埋める拡散型」とし、制作メモに「各段階で残すと決めた語だけを表示」と記す。S6/S9の標準手順に対応する。未採用の仮候補を表示しなければ、remaskingのためだけに語を消す動きを足す必要はない。
3. 「ばらばら」は先頭からとは限らない意味に限定する。順序が常に一様ランダムだとは説明しない。確信度で選ぶ方式もある（S8）。ブロック内を拡散、ブロック間を左から進める方式もあり（S5/S18）、拡散型が絶対に左から進まないとは言えない。
4. 同じ完成文、語句のまとまり、穴の数、穴の幅、埋まる順、間隔は**説明用に決めた例**。完成文が二方式で必ず一致する、下段が常に速い、文字数やトークン数が最初から正確に分かる、といった比較結果ではない。穴幅が答えの語句幅と一致しても、内部でその語が既知だったという意味ではない。
5. 見せる仕組みの例であり、特定の商用モデル名を下段へ添えてその内部の再現としない。Mercuryの具体的ノイズ核、Gemini Diffusionのマスクの有無・確定後の位置の再編集は、確認した公開資料から未確定（S11/S14〜S17）。

### 引用・日付・出典の監査

- 日付のある採用資料はすべて基準日2026-10-14以前。公開日と取得日を分ける。公開日が表示されない公式文書は「取得時点の説明」とし、過去の世代・提供開始日の証拠にしない。arXivはログ記載の版、コードは記載のcommitを報告でも使う。
- 利用のS31は最終集計2026-10-13のOpenRouter内の値、S32は2024-11〜2025-11の観測。両者やリクエストとトークンを混ぜない。5社の70.2%を自己回帰型のシェアへ読み替えない。報告本文は数値の羅列より、方式の一次資料と利用の一次資料の限界を優先する。
- 原文引用は短い既取得箇所だけを採り、URL・節/頁・取得日を添える。S番号は今回のログの番号を維持し、既存intro-factsの番号は「既存N4」等と区別する。
- 引用語数は、前単位の手計算に複数の誤差があったため再計数した。**空白区切りの合計**はS1=12、S2=17、S3=23、S4=12、S5=23、S7=10、S8=11、S10=11、S11=12、S13=5、S14=18、S15=8、S16=6、S18=12、S21=9、S22=8、S23=3、S24=6、S25=10、S26=4、S27=10、S28=7、S29=9、S31=14、S32=11、S37=11、S38=9、S39=13。コード引用S6/S9も短い一行。ハイフンを分けて数えても採用引用は各資料25語以内。**前単位の語数の注はこの訂正を優先する。引用本文・所在・判定は変更しない。** S29は再掲せず同じ引用を参照する。
- 報告で同じ出典の引用を表・本文・出典一覧に何度も掲載しない。引用の重複を避け、言い換えによる説明も当該出典の要約上限内に収める。

### 残る不確実性、派生質問、次の段階

- 原問いは変わっていない。追究した派生質問は、仮候補のremaskingと確定済み位置の変更の違い（Unit 2/3）、マスク以外の離散ノイズ（Unit 3）、候補分布と生成手順の違い（Unit 5）。これらが「穴埋め」の射程を定めるのに必要だった。
- 未確定のまま報告へ残すのは、商用拡散の厳密な内部手順、最新全モデルの個別方式、世界全体の方式別シェア。確認済みの世代から最新全モデルへ外挿しない。
- 今回追わない派生質問は、各APIの高速化の本番採否、全デッキの単独閲覧時の文脈、一般BERTの条件分布の整合性の完全な数学的証明。前二者は、実製品の手順を描くとき／制作時の確認として勧める。
- ローカルの図では候補の描画値とラベルが別に指定されている。確率の例の値・丸め・棒の対応は、制作側の既存N4対応とともに点検する事項。今回の外部事実調査から、数値や表示の実装修正へ範囲を広げない。
- **Plan revision 4の全調査単位が完了した。次は別の報告ターンで、ログを再読して日本語の `research/compose-facts/report.md` を作る。** 要約、C1〜C6と全11文の判定表、型と公表範囲の比較、引用と条件、短い案、不確実性、計画の展開、次の行動を含める。`ready-to-report`を返してチェックポイントを要求する。

## 報告完了: report.mdの作成と照合

完了日: **2026-10-14 UTC**。指定された報告ターンで本ログを再読し、`research/compose-facts/report.md`を作成した。新たな外部調査単位は追加していない。外部資料の取得日は各単位に記した2026-10-14であり、報告作成時の再取得を意味しない。

- 要約、C1〜C6の判定、全11文の判定と言い換え、方式・主要系列の比較、絵を使う条件、未確定事項、計画の展開、推奨する次の作業を収録した。
- S1〜S39のURL・所在・公開日または版・取得日の扱いと短い原文引用を整理した。ログのS番号を維持し、既存intro-factsのS番号とは区別した。
- 機械的照合で、C1〜C6の各節、原稿11文、連続したS1〜S39、ローカルリンク先の存在、行末空白なし、出力ディレクトリにlog.mdとreport.mdだけがあることを確認した。報告は220行、41,290 bytes。
- 結論はUnit 6から変更なし。穴埋めを説明上の見方に限定し、下段をマスク型拡散の一例とすれば採用可能。商用内部、最新全モデル、世界全体の方式別シェアは未確定のまま明示した。
- プロジェクト実装・Git状態は変更していない。モデル実行、音声・ブラウザ確認は範囲外として未実施。

最新計画の調査・報告は完了。次の研究単位はない。報告ターンの契約に従い、追加チェックポイントは要求せずdoneを返す。
