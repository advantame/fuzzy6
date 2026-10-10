# 計算と値段：調査ログ

- 質問: decks/llm 第7章「計算と値段」の W1–W10（KV cache、縮小attention、MoE、provider prompt cache、reasoning、長いagent sessionの料金）を一次資料で検証する。
- 範囲: 各IDに confirmed / corrected / uncertain、画面に使える日本語、一次URL、適用範囲を整理。モデル設定由来の計算は式と入力を残す。API・料金は現行公式ページの取得日を明示し、当初の発表・preview・beta・GAを区別する。
- 開始: 2026-10-10 03:55:00 UTC（clock）。
- 書込み: research/cost-facts/log.md（追記のみ）と、最終report turnで作るreport.mdのみ。project実装・deckは編集しない。
- 先に読んだ資料（2026-10-10）: AGENTS.md、decks/llm/README.md、decks/llm/ch7-knowledge.md、docs/spec.md、research/llm-facts/report.md、research/agent-facts/report.md。既存報告の会話履歴・harness・API公開日の根拠は再利用し、別ID体系と混同しない。
- 最終報告の形: research/agent-facts/report.mdと同じく要約・判定方法、W1–W10各1行の表、必要な補足、不確実性と計画の変遷、推奨行動。英語の短い逐語引用と日本語の要約を区別する。
- OpenAI API調査には openai-docs skillを使用（読了）。明示された歴史発表はopenai.comも対象とする（今回のユーザー指定が優先）。

## 初期計画

調査単元は「問い × 資料群」で切り分ける。各単元を完了して記録してから次へ進む。

1. **W1–W2: 標準KV cacheの仕組みとLlama 3.1 70B容量** × Pope／PagedAttention／Llama 3論文、Meta公式config・model実装・weight index。
2. **W3–W4: MQA・GQA・MLAの定義と容量差** × 原論文、Meta／Mistral／DeepSeek公式config・実装。
3. **W5–W6: 最新DeepSeekとMoEの数値・公開区分** × 原論文、DeepSeek technical report・model cards、Mistral／OpenAI発表。
4. **W7a・W8・W9b・W10: Anthropicの現行仕様と変遷** × 発表、API pricing／prompt caching／thinking／effort文書。
5. **W7b・W8・W9a・W10: OpenAIの現行仕様と変遷** × 公式API文書・changelog・発表。GPT-6のモデル別の差を確認。
6. **W7c–d・W9c–d・W10: Google／DeepSeek caching・reasoning・料金** × 公式文書・発表、R1原論文／Nature。
7. **W8・W10: prefix安定性と長いsessionの計算** × Manus原文、各社会話／cache文書。二次増加の条件・式と「例」の料金計算を確定。
8. **全項目の横断照合** × 以上の一次資料と既存報告。引用、単位、日付、現行価格の適用条件、未確定事項を監査。

全単元完了時はlogを確定し ready-to-report を返す。report.mdはその次の明示的なreport turnで作る。

## Unit 1: W1–W2 — KV cacheの機構とLlama 3.1 70Bの容量

取得・参照日: **2026-10-10 UTC**。論文はnative web、API metadataとMeta実装は上限付きurllibで取得。モデル重みのダウンロード・モデル実行はしていない。

### 参照した一次資料

- Pope et al., *Efficiently Scaling Transformer Inference*, arXiv:2211.05102v1, 2022-11-09: https://arxiv.org/pdf/2211.05102 （18頁、§1–2）。HTML v2 URLは404でPDFへ切替。
- Kwon et al., *Efficient Memory Management for Large Language Model Serving with PagedAttention*, arXiv:2309.06180v1, 2023-09-12, SOSP 2023: https://arxiv.org/html/2309.06180 （§2.1、§2.2、§3、§4.1脚注）。
- Meta, *The Llama 3 Herd of Models*, arXiv:2407.21783v3, 2024-11-23版: https://arxiv.org/html/2407.21783v3 （Table 1、Table 3、§3.2）。v4 URLは取得失敗。
- Meta公式モデルrepoのHugging Face API metadata: https://huggingface.co/api/models/meta-llama/Llama-3.1-70B-Instruct 。取得時sha `1605565b47bb9346c5515c34102e054115b4f98b`、`safetensors.parameters.BF16 = 70553706496`、`safetensors.total = 70553706496`。
- Meta公式推論実装: https://raw.githubusercontent.com/meta-llama/llama-models/main/models/llama3/model.py （閲覧用 https://github.com/meta-llama/llama-models/blob/main/models/llama3/model.py ）。111–116行にKV heads／head dimension、147–160行にcache配列、183–187行に追加と全prefix参照、266–268行に層別TransformerBlock、289–303行にcausal mask。
- 直接取得を試みたが401: https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/raw/main/config.json 、同repo `blob/main/config.json`、`raw/main/model.safetensors.index.json`。公式configの内容を読めたことにはしない。旧 `Meta-Llama-3.1-70B-Instruct` 名でも取得不可。third-party派生モデルのconfig検索結果は採用していない。

### 事実と判定案

**W1 confirmed（通常のcausal Transformerの逐次decodeに限定）**

- Pope §1は各層のattention key/value tensorsをKV cacheと呼び、decode中に保持すると説明。§2は入力処理prefillと自己回帰生成decodeを分ける。
- Kwon §2.1–2.2は位置ごとのQ/K/V投影、既存tokenのK/V保存、新たなiterationで新token分のK/Vのみ計算、既知promptの並列処理を明記する。Meta実装も入力された新しい区間だけを投影し、cacheへ追記して先頭から現在までのK/Vを読む。この根拠から「cacheがなければprefixのK/Vを再計算する」は標準的な素朴実装についての説明として支持できる。
- 画面用案: **「過去の各トークンのKとVを層ごとに保存し、次のトークンの計算で再利用する。入力は並列に処理でき、通常の生成は1トークンずつ進む。」** 補足では新tokenのQ/K/Vを計算すること、attention自体は過去のK/Vを読むことを明記する。「計算するのはQKVだけ」「過去をもう読まない」「あらゆるモデルが全文を永遠に保存」とは書かない。MLA、sliding window、eviction、speculative decoding等は別。
- Kwon §3の例は一般の13Bモデルではなく **OPT-13B**。原文表記は **800 KB/token、最大1.6 GB/request（2048 token）**。式は `2 × 5120 × 40 × 2 = 819,200 bytes/token = 800 KiB/token`。2048 tokenで `1,677,721,600 bytes = 1.5625 GiB ≈ 1.68 GB`。原論文のKB/GB表記を厳密なSIへ勝手に読み替えず、画面なら800 KiBを用いる。これがLlama 70B例より大きいのはモデルサイズだけでKV量が決まらないため。

**W2 confirmed相当の数値、公式config直接照合は未了**

- Llama論文Table 3の70B列: **80 layers、model dimension 8192、FFN dimension 28672、64 attention heads、8 KV heads**。`head_dim = 8192 / 64 = 128`。§3.2はGQAでKV cacheを小さくする狙いを明記する。Table 1はApril 2024のLlama 3とJuly 2024のLlama 3.1を区別する。128Kは3.1の長文脈であり、初代Llama 3へ混同しない。
- 式: **`bytes/token = 2(K,V) × L × H_KV × D_head × bytes/value`**。非量子化bf16、batch=1、全層で通常のGQA cacheを保持する理論payload。`2 × 80 × 8 × 128 × 2 = 327,680 bytes = 320 KiB/token`。
- 131,072 tokenなら `327,680 × 131,072 = 42,949,672,960 bytes = 40 GiB`。入力＋出力を含む保持token数の例であり、131,072 tokenの入力に追加で無制限に出力できる意味ではない。paging余白、allocator、scale／metadata、activations、temporary buffer、複数request、TPによる複製は含まない。
- Meta実装の各層に独立cacheがあり、`[:start_pos+seqlen]`で全prefixを参照する。sliding windowの切捨てや層間KV共有はこの標準実装にない。従って上式のLを80とするのは妥当。
- 公式repo metadataが返す厳密なパラメータ数は **70,553,706,496**。bf16重みpayloadは **141,107,412,992 bytes ≈ 141.107 GB ≈ 131.417 GiB**。画面の「約70.6B、重み約141 GB」は妥当。「141 GiB」としない。API metadataは公式repoのtensor集計であり、論文が小数点以下の厳密値を直接公表しているという意味ではない。
- 整数演算だけで容量を再計算し一致を確認。参考検算として `2VD + L(2D²+2D H_KV D_head+3DF+2D)+D` に `V=128256,D=8192,L=80,H_KV=8,D_head=128,F=28672` を入れると **70,553,706,496**。ただし今回V=128256、untied embedding／bias無し等の全入力を公式configで直接確認できていないため、この分解式は最終報告で確定根拠にしない。確実な根拠は取得したAPI metadata。

### 未解決と次の単元

- W2の公式configが401のため、`max_position_embeddings=131072`、dtype、tie設定等の直接照合が残る。論文は128Kを支持するが厳密な131072を現物configで確認する追加点はUnit 8へ持ち越す。認証情報は探さず、公開公式資料だけで続ける。
- 先行reportの必要部分は再利用する。llm-facts T2は全履歴方式とResponses例外、H7はDeepSeek-R1公開2025-01-20／論文初投稿01-22を既に検証。agent-factsはharness／compaction／server保存と現在contextの違いを検証済み。
- 次: **Unit 2（W3–W4、MQA/GQA/MLA原論文・config）**。ユーザーからtoken閾値の通知を受けたのでUnit 1をここで確定しcheckpointする。report turnではない。

## Plan revision 1

- 学んだこと: 公式HF repoのmetadataは公開だがconfigは401。技術論文だけでは厳密なconfig全項目を読んだことにならない。W2の数量結論は強く支持されるが、config直読の確認範囲を明記する必要がある。
- 変更: Unit 8へ「Llama 3.1公式config／max_position_embeddingsの公開代替資料による照合」を追加。Unit 1を再開して探索し続けず、現在の証拠と未確定範囲を分離する。
- 派生問い: KV payloadと実稼働GPU memoryが違う理由は原問の数字の誤用を防ぐため、この範囲の注記だけを今回追究。実測memory benchmark／GPU実行は不要として対象外。
- 残る単元: 2 attention variants、3 DeepSeek/MoE、4 Anthropic、5 OpenAI、6 Google/DeepSeek API、7 Manus/session計算、8横断照合（上記追加を含む）、その後の独立report turn。

## Unit 2: W3–W4 — MQA・GQA・MLAの定義と容量差

取得・参照日: **2026-10-10 UTC**。native webで原論文・公式ページを閲覧し、固定commitの小さなconfig／実装だけを上限付きurllibで照合。モデル実行・インストールはなし。

### 参照した一次資料

- Shazeer, *Fast Transformer Decoding: One Write-Head is All You Need*: https://arxiv.org/abs/1911.02150 。v1投稿 **2019-11-06**、abstractの全head間のK/V共有。
- Ainslie et al., *GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints*: https://arxiv.org/abs/2305.13245 、https://arxiv.org/html/2305.13245v3 （§2.2、Figure 2、§4）。v1 **2023-05-22**、v3 **2023-12-23**。EMNLP 2023採録は https://aclanthology.org/2023.emnlp-main.298/ でも照合。
- Meta, *Llama 2*: https://arxiv.org/html/2307.09288v2 （Table 1、Appendix A.2.1）。PDF取得は失敗したがHTML本文を取得。
- Meta, *The Llama 3 Herd of Models*: https://arxiv.org/html/2407.21783v3 （§3.2、Table 3）。Unit 1のモデル世代の区別も再利用。
- Mistral AI, **Mistral 7B**, **2023-09-27**: https://mistral.ai/news/announcing-mistral-7b/ 。公式config: https://huggingface.co/mistralai/Mistral-7B-v0.1/raw/main/config.json 。32 query heads、8 KV heads、sliding_window=4096。
- DeepSeek-AI, *DeepSeek-V2*: https://arxiv.org/abs/2405.04434 、https://arxiv.org/html/2405.04434v5 。v1投稿 **2024-05-07**、確認したv5は **2024-06-19**。§2.1.2–2.1.4、式9–19、Table 1、§3.2.3。
- DeepSeek-V3公式config: https://huggingface.co/deepseek-ai/DeepSeek-V3/raw/e815299b0bcbac849fa540c768ef21845365c9eb/config.json 。shaは https://huggingface.co/api/models/deepseek-ai/DeepSeek-V3 で取得し、固定版を読み直した。
- DeepSeek-V3公式推論実装: https://github.com/deepseek-ai/DeepSeek-V3/blob/9b4e9788e4a3a731f7567338ed15d3ec549ce03b/inference/model.py 。raw固定版も取得。440–444行でnaiveの展開済K/V cacheと、それ以外のkv_cache／pe_cacheのshapeを確認。Web検索側mainの行番号408–413とは差があるため、最終引用は固定commitに揃える。

### 判定と画面用の事実

**W3 confirmed**

- MQAはShazeerの2019年論文で、すべてのquery headが1組のkey/value headを共有する方式。GQAはAinslieらの2023年論文で、query headsをG群に分けて各群が1組のK/V headを共有する方式。G=1ならMQA、G=query head数ならMHA（§2.2）。画面用: **「MQAはすべてのQで1組のK/Vを共有。GQAはQのグループごとにK/Vを共有する。」** モデルの全層が単一K/Vを共有するという意味ではない。
- Llama 2の公表モデルでは**70BがGQA**。Table 1は34BにもGQAとするが、本文で公開したサイズは7B・13B・70B。従って公開例に34Bを無条件で並べない。Llama 2全サイズをGQAとは書かない。
- Llama 3論文§3.2は8 KV headsのGQAを明記し、Table 3の8B・70B・405B列も支持する。Mistral 7Bは発表本文とconfigの両方がGQAを支持。初代Mistral 7B v0.1はSWAも併用するため、全長KV cache容量の単純な比例例にはそのまま使わない。
- GQA論文§4はRabeによる独立開発も記している。今回の問いは論文・定義の確認であり、世界初の優先権までは追わない。名前の由来や唯一の発明者という断定を加えない。

**W4 corrected（MLAの説明に位置キーと測定条件を補足）**

- V2論文はMLAを導入し、K/Vを共同で低次元へ投影して保存する。実際のMLA cacheには**圧縮latentに加え、decoupled RoPE用のキー**も必要（式15、§2.1.3）。画面用: **「MLAはK/Vをまとめて圧縮し、位置情報用のキーと一緒に保存する。」** 「latentだけを保存」はこのRoPE構成を説明するには不完全。
- V2がDeepSeek 67B比で**KV cacheを93.3%削減、最大生成throughputを5.76倍**と報告したことは確認。これは同社のモデル比較であり、MLA単体の一般保証ではない。§3.2.3は8基のH800を使う1 nodeで、既存67B serviceのprompt／生成長分布に基づく比較。V2側はFP8 weights、平均6bitのKV cache量子化なども用いる。93.3%の公表値と、ここで新たに計算するV3のbf16理論比較を混ぜない。速度は単一リクエストのlatencyが5.76分の1という意味ではない。
- V3固定configの入力: **kv_lora_rank=512、qk_rope_head_dim=64、num_hidden_layers=61、num_attention_heads=128、qk_nope_head_dim=128、v_head_dim=128**。公式実装の圧縮pathは各層に512要素のkv_cacheと64要素のpe_cacheを持つ。`num_key_value_heads=128`だけを通常GQA式へ入れるのはMLAの保存量を表さない。
- **独自計算・bf16 cache payloadの例:** `(512+64) × 61 × 2 = 70,272 bytes/token = 68.625 KiB/token`。576はKとVを共同で圧縮したlatent＋位置キーなので、さらにK/Vの2倍を掛けない。最後の2はbytes/value。
- **仮想的な展開済full multi-head cacheとの比較（公表スコアではない）:** K head dim=`128+64=192`、V head dim=`128`、heads=`128`、layers=`61`、bf16=`2 bytes`。`128 × (192+128) × 61 × 2 = 4,997,120 bytes/token = 4.765625 MiB/token`。MLA payloadはその**1.40625%（約1/71.1、98.59375%少ない）**。この比較は公式実装のnaive pathがheadごとにRoPE keyも展開するshapeと対応する。RoPE keyを共有保存する別の非圧縮設計なら分母は変わるので、「すべてのMHAの71倍」とはしない。
- 上記は61本の本体attention層、1 sequence、非量子化bf16、論理payloadの計算。追加MTP層、実行時temporary buffer、allocator、padding、tensor parallel複製などは除く。configのFP8量子化設定があるからKV cacheも1 byteと推定してはならない。今回の計算条件は明示的にbf16。

### 未解決点と次の単元

- W3/W4の必要な定義・出典・設定・容量計算は完了。V2の高速化の要因分解や実環境でのGPU使用量測定は対象外。V3の追加MTP込みの稼働容量は今回の61層例の外に置く。
- 単元1で残ったLlama 3.1公式configの公開取得は、予定どおりUnit 8へ持ち越す。
- 次: **Unit 3（W5–W6、最新DeepSeekとMoEの数値・公開区分）**。残る単元は3・4・5・6・7・8、その後に独立report turn。主題・単元構成の変更はない。
- token閾値通知を受領したため、Unit 2をここで完全に記録してcheckpointを要求する。report.mdはまだ作成しない。

## Unit 3: W5–W6 — DeepSeekのattention世代・公開区分とMoE

取得・参照日: **2026-10-10 UTC**。native webで一次資料を閲覧し、小さな公式config・metadata・実装をサイズ上限付きurllibでも照合。重み・モデル実行・インストールなし。

### 参照した一次資料

- DeepSeek公式更新履歴: https://api-docs.deepseek.com/updates/ （2024-12-26、2025-09-29、2025-12-01、2026-04-24、07-31、08-13、09-10項）。
- DeepSeek-V3.2-Exp model card: https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp 。DSAを導入する実験版と明記。実装: https://raw.githubusercontent.com/deepseek-ai/DeepSeek-V3.2-Exp/main/inference/model.py （90行のindex_topk、435–487行のIndexer、583–601行のattention mask）。当日のmainであり固定commit照合は未実施。
- V3.2-Exp論文所在: https://github.com/deepseek-ai/DeepSeek-V3.2-Exp/blob/main/DeepSeek_V3_2.pdf 。GitHub表示はPDF本文を出さず、raw URLはnative webがapplication/octet-streamを拒否したため、本文を読んだ根拠にはしていない。上記model card＋公式実装で必要なDSA機構を確認。
- DeepSeek-V4 preview発表、**2026-04-24**: https://deepseek.com/en/news/v4-preview/ 。
- DeepSeek-V4 technical report: https://arxiv.org/html/2606.19348v1 、https://arxiv.org/pdf/2606.19348 （abstract、Figure 1、§2.1、§2.3、§4.2.1）。取得PDFは58頁、Figure 1の数値はPDF textでも読めた。HTML/PDFヘッダは26 Apr 2026を表示するがarXiv番号の年月と不整合があるため、論文初投稿日をこの表示だけで確定しない。preview発表日は独立した公式発表で確定。
- Preview Pro card: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro 、0813 card: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813 。後者Introduction、License、Safetensors Model size表示を直接確認。
- HF公式repo metadata: https://huggingface.co/api/models/deepseek-ai/DeepSeek-V4-Pro 、https://huggingface.co/api/models/deepseek-ai/DeepSeek-V4-Pro-0813 、https://huggingface.co/api/models/deepseek-ai/DeepSeek-V4-Flash 。取得shaは順に `b5968e9190ef611bbf34a7229255be88a0e937c1`、`72e1d3230f6c080a530b0a1d46f8eb4602340597`、`60d8d70770c6776ff598c94bb586a859a38244f1`。
- 上記固定shaのconfigも確認: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/raw/b5968e9190ef611bbf34a7229255be88a0e937c1/config.json 、https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813/raw/72e1d3230f6c080a530b0a1d46f8eb4602340597/config.json 、https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash/raw/60d8d70770c6776ff598c94bb586a859a38244f1/config.json 。
- Shazeer et al., *Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer*: https://arxiv.org/abs/1701.06538 （v1 **2017-01-23**）。
- Fedus et al., *Switch Transformers*: https://arxiv.org/abs/2101.03961 （v1 **2021-01-11**、v3 2022-06-16）、https://arxiv.org/html/2101.03961v3 （single-expert routing、§2）。
- Mistral AI, *Mixtral of experts*, **2023-12-11**: https://mistral.ai/news/mixtral-of-experts/ 。現行モデル台帳 https://docs.mistral.ai/models/mixtral-8x7b-0-1 は丸めた47B/13Bを記すため、小数値は原発表を採用。
- DeepSeek-V3: https://arxiv.org/abs/2412.19437 （v1 **2024-12-27**）、https://arxiv.org/html/2412.19437v2 （abstract、§4.2）。モデル公開2024-12-26は前記公式changelog。
- OpenAI, *Introducing gpt-oss*, **2025-08-05**: https://openai.com/index/introducing-gpt-oss/ （architecture表）。公式config https://huggingface.co/openai/gpt-oss-120b/raw/main/config.json の36 layers、128 local experts、4 experts/tokenも確認。OpenAI本文はurllibでは403だがnative webで直接読めた。

### W5: corrected — 数値は概ね支持、preview・GA・計数対象を明示

- **V3.2-Expは2025-09-29の実験版**。V3.1-TerminusにDSAを追加したことをcardと更新履歴が支持。公式Indexerは過去位置にscoreを付け、`topk(min(index_topk,end_pos))`で選択し、core attentionで他位置をmaskする。既定index_topk=2048。画面案: **「DSAは軽いindexerで参照先を選び、選んだ位置へattentionを向ける。」** 選択されなかった位置のKVを永久削除する意味ではない。V3.2本版の発表は2025-12-01で、Expと同一公開区分にしない。
- **V4 previewは2026-04-24**。Pro **1.6T total / 49B active per token**、Flash **284B / 13B**、両者**1M tokens**。固定configはいずれもmax_position_embeddings=**1,048,576**。モデルrepoと重みは**MIT License**（少なくともPro preview／0813 cardで明記、Flashも同系列。最終横断照合でFlash License本文を直読するとより確実）。
- 技術報告はCSAとHCAのhybridを明示。CSAはtoken方向に圧縮してからtop-kを選択する。HCAはさらに強く圧縮し、**HCA自体にはsparse選択を使わない**。局所情報用sliding-window branchも持つ。「全層が同じsparse attention」「MLAのlatent次元だけを縮めた」とは説明しない。
- 1M contextにおける**V3.2比のsingle-token inference FLOPs約27%／KV約10%（Pro）**はabstractに明記。FlashはFigure 1の **9.8× lower FLOPs、13.7× smaller KV**から、`100/9.8≈10.2%`、`100/13.7≈7.3%`で**約10%／約7%**が支持される。Pro図は3.7×／9.5×で、27%／10%は丸め値。**同社による特定長文脈・実装条件での比較**として表示する。
- §2.3.4はKVのRoPE部分BF16・他FP8、indexer FP4などを説明。従ってW2/W4の純bf16容量と単純に同一条件比較できない。FLOPs削減率をAPI料金や実時間の削減率へそのまま置換しない。
- **V4-Pro-0813は2026-08-13 GA**（公式changelogの明示）。cardはpreviewのmodel structureを基礎に**DSpark speculative-decoding moduleを追加**と明記する。HFのSafetensors表示が**1.7T**であることも確認。画面案: **「V4-Pro本体は約1.6T。0813配布版には投機的デコード用DSparkも含まれる。」** 「0813本体を1.7Tへ拡大した」「DSparkは正確に0.1T」を断定しない。
- 補助照合: HF metadataのtensor集計はpreview **1,598,839,674,782**、0813 **1,650,497,936,906**、差 **51,658,262,124**。configには0813だけ`dspark_block_size=5`、`dspark_target_layer_ids=[58,59,60]`等が加わる。ただしtensor集計はBF16/F32/F8/I8/I64を含み、量子化scale等も含み得る。これは「学習可能なDSparkの正確なパラメータ数」の証明ではない。**model cardの追加moduleの明示と、配布tensor数の増加・丸めの違いが整合する**という推論として扱う。
- **Flash-0731は2026-07-31にAPI public beta**と更新履歴が記す。「official release」という同じ文中の語だけを取ってGAと呼ばない。原問の4月preview数値と8月Pro GAを混ぜない。

### W6: confirmed（一般説明は対象MoE層に限定）

- Shazeer 2017はsparsely-gated MoE layerの原論文、Switchは2021年初投稿で、**1 tokenを1 expertへrouteするk=1方式**。2017をMoEという考え全体の最初の発明年とはしない。
- **Mixtral 8×7B**: 原発表2023-12-11、**46.7B total / 12.9B per token、各層の8 expertから2つ**。8個の独立した7Bモデルを丸ごと回す意味ではない。原発表の「12.9B denseと同じ速度・コスト」という断言までは採用しない（実機通信やmemory条件に依存）。当時APIはbetaと発表、open weightsはApache 2.0。
- **DeepSeek-V3**: モデル公開2024-12-26、論文初投稿12-27。**671B total / 37B active per token**。§4.2は最初の3層を除くFFNをMoEにし、各MoE層に**256 routed experts＋1 shared expert、tokenごとにrouted 8個**を有効化すると明記。shared expertを含め「8個だけ」とはしない。
- **gpt-oss-120b**: 2025-08-05公開、**117B total / 5.1B active per token、128 expertsから4個**。公式configでnum_local_experts=128、num_experts_per_tok=4を照合。128を全36層を足したexpert総数と解釈しない。
- **V4-Pro**: technical report §4.2.1と固定configが**各層384 routed＋1 shared、tokenごとにrouted 6個**を支持。61層。本体1.6T／49BはW5と同じ集計範囲。Flashは43層、256 routed＋1 shared、routed 6個、284B／13B。
- 画面用案: **「MoEは、トークンごとに使うexpertを絞る。各MoE層で選ばれたexpertを計算し、その結果を合わせる。」** 通常のlearned routerの説明はMixtral等に適用できるが、**V4の最初の3 MoE層は入力token IDに基づくhash routing**（§2.1、§4.2.1）。「すべてのMoE層で内容を読む学習済みrouterが専門家を選ぶ」と全モデルへ一般化しない。expertを数学担当・法律担当と人間の領域分類へ固定対応させない。
- Active parametersは各tokenのforwardで使う重みの量で、モデル全体の保存容量がその数まで減るという意味ではない。総重み、実行FLOPs、KV cache、providerの販売価格は別の量。

### 未解決点と次の単元

- W5の1.7T表示は直接確認。DSpark追加は明記されるが、tensor名別の厳密な学習可能parameter分解はしていない。原問への安全な説明には不要で、上記の限定で報告できる。
- V4 paperのarXiv IDと表示日付の不整合は残す。画面の公開年月日は公式preview発表とchangelogを採用するため結論には影響しない。
- 次: **Unit 4（Anthropic W7a/W8/W9b/W10、公式cache・thinking・pricing）**。残り4・5・6・7・8＋独立report turn。token閾値通知に従いUnit 3を完結してcheckpointする。

## Plan revision 2

- 学んだこと: DeepSeek公式changelogは4月preview→7月Flash API public beta→8月Pro GAを区別し、9月10日にはV4.1-Flashと新価格を記す。原問のV4は歴史的な比較として保持する必要があり、APIの現行説明を4月の料金へ固定すると古くなる。
- 変更: **Unit 6**に「V4.1-Flashを含む取得日現在のDeepSeek model alias・料金と過去のR1/V3.2の区別」を追加。**Unit 8**に「FlashのMIT License本文直読」を追加。W5の数値例をV4.1へ置換する調査は不要。
- 派生問い: V4.1のcross-layer reuse/FP4圧縮の詳細、DSparkの厳密なmodule別parameter数は元の画面用事実確認を越えるため**deferred**。必要なら次の更新で別調査にする。原問自体は変わらない。
- 現在の残単元: 4 Anthropic、5 OpenAI、6 Google/DeepSeek現行API（追加点込み）、7 Manus/session計算、8横断監査（Llama config・Flash license含む）、その後report turn。

## Unit 4: W7a・W8・W9b・W10 — Anthropicのcache・thinking・料金

取得・参照日: **2026-10-10 UTC**。native webで公式本文を閲覧。API呼出し・課金・モデル実行なし。

### 参照した一次資料

- 現行Prompt caching: https://platform.claude.com/docs/en/build-with-claude/prompt-caching （Pricing、Cache limitations、Explicit breakpoints、What invalidates the cache、Automatic caching）。
- 現行Pricing: https://platform.claude.com/docs/en/about-claude/pricing （モデル表、residency、long context、tool use）。
- 公式release notes: https://platform.claude.com/docs/en/release-notes/overview （旧 https://platform.claude.com/docs/en/release-notes/api からredirect）。2024-08-14、12-17、2025-01-15、08-13、11-24、2026-02-05、02-19、10-07を確認。
- 当初Prompt caching発表: https://www.anthropic.com/news/prompt-caching → https://claude.com/resources/articles/prompt-caching 。現在移設ページの表示日付は **August 14, 2025** だが、本文の旧モデル価格と、公式release notesの **2024-08-14 beta**、旧Newsroom一覧と不整合。開始日はrelease notesを優先し、移設記事の日付を採用しない。
- Claude 3.7 Sonnet発表: https://www.anthropic.com/news/claude-3-7-sonnet （2025-02-24）。
- Claude Opus 4.5発表: https://www.anthropic.com/news/claude-opus-4-5 （2025-11-24、effort導入）。
- 現行Effort: https://platform.claude.com/docs/en/build-with-claude/effort 。
- 現行Extended thinking: https://platform.claude.com/docs/en/build-with-claude/extended-thinking 。
- 現行Thinking: https://platform.claude.com/docs/en/build-with-claude/thinking （model別設定・表示・thinking block・max output）。
- Mid-conversation system messages and tool changes: https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages 。
- AWS公式Messages API仕様: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-request-response.html （Opus 4.5 effort beta、low/medium/high、effort-2025-11-24）。first-party Claude APIの現行beta状況とは区別。
- 取得上の制約: release notesの`.md`版をurllibで読む補助試行は403。HTML版はnative webで読め、必要な日付・本文は確認できた。旧 `whats-new-claude-4-6` URLは現行Opus 5.5ページへredirectするため、4.6当時の証拠として採用しない。

### W7a: corrected — beta／GAと、現行モデル別価格・最小長

- release notesは **2024-08-14 public beta、2024-12-17 beta header不要**を明示。後者を通常cacheのGA相当の日として記載できる。**1-hour TTLのbeta header不要化は2025-08-13**で別。**automatic cachingは2026-02-19導入**。OpenAIの無設定の自動cacheと違い、Anthropicのautomatic方式もrequestのtop-level `cache_control`を指定する。
- 当初発表のClaude 3.5 Sonnetは通常入力 **$3/MTok**、write **$3.75**、read **$0.30**、output **$15**。当初writeは入力の1.25倍、readは0.1倍。
- 現行writeは **5分TTL=1.25倍、1時間TTL=2倍**。readは**通常0.1倍**だが、**Fable 5.1／Mythos 5.1は0.025倍、Opus 5.5／Sonnet 5.5は0.05倍**。**Sonnet 5.5のreadは2026-10-07に$0.20→$0.10/MTokへ変更**したことをrelease notesで確認。画面で「Anthropicは常に10分の1」と断定しない。
- TTLは既定5分、指定で1時間。再利用で延長し、延長の別料金はない（read料金自体は発生）。現行文書では**write/readしたrequestの開始から**数えるため、長い生成時間もTTLを消費する。
- `cache_control`はそのblockまでの**全prefix**を対象にする。明示breakpointは最大4個、automaticも1枠を使う。各breakpointから最大20個のblock境界を遡って既存entryを探す。**前回書いていない境界に勝手にcacheを生成するわけではない**。block増加、TTL切れ、最小長未満でhitしない場合がある。
- 2026-10-10現行minimum（Claude API等、Bedrockの独立条件はAWS docs確認が必要）:

| 最小token数 | モデル |
|---|---|
| 512 | Fable 5.1、Mythos 5.1、Opus 5.5、Opus 5、Sonnet 5.5、Fable 5、Mythos 5、Haiku 5.5 |
| 1,024 | Opus 4.8、Sonnet 5、Sonnet 4.6、Sonnet 4.5、Opus 4.1、Opus 4、Sonnet 4 |
| 2,048 | Mythos Preview、Opus 4.7、Haiku 3.5 |
| 4,096 | Opus 4.6、Opus 4.5、Haiku 4.5 |

- 上表は現行文書の全列挙。deprecated／retiredで他cloudにだけ残るモデルも含むため、表掲載をClaude APIで今も利用可の保証にしない。Mythos系列のlimited availabilityも一般公開と同一扱いにしない。最小長未満ではcacheされず、エラーではない。usageのcache_creation_input_tokens／cache_read_input_tokensで実績を確認する。

### W8のAnthropic部分: confirmed、prefix変更と末尾追加を区別

- Prompt cachingとMid-conversation文書が**tools → system → messages**、cache breakpointまで完全一致が必要と明記。既存tools変更は全段、既存top-level system変更はsystemと後続messagesを無効にする。先頭timestampの更新もprefix変更なので同様、という説明は一次記述からの直接的な適用。
- 安全な画面用: **「同じ先頭部分を再利用する。前の内容を書き換えると、その位置より後のcacheは使えない。」** 変更より前の既存entryが残る可能性があり、「1文字変えたら全cacheが必ず消える」は過剰。
- 現行APIには、対応モデルでsystem指示やtool変更を**会話の末尾へ追加**し、既存prefixを保つ機能がある。これは完全一致の例外ではなく、既存prefixを書き換えない機構。top-level `output_config.effort`変更はcacheへ影響する一方、対応モデルの**per-message effortはbeta**でprefixを保つ。deckには実装一覧を載せず、上記原則の注記に留める。
- Manusの逐語引用と他社比較はUnit 7で行う。今回は未照合。

### W9b: corrected — 3.7のbudgetとClaude 5系のeffortを分ける

- **Claude 3.7 Sonnet: 2025-02-24**、extended thinkingとAPIのthinking token budgetを導入。発表はthinking tokensもoutput価格に含むと明記（当時$15/MTok）。モデル公開と同日Claude Codeのlimited research previewを混同しない。
- **Effort: Claude Opus 4.5、2025-11-24 public beta**。release notesが明記。初期はlow/medium/high（AWS仕様でも確認）。**2026-02-05**にbeta header不要となりOpus 4.6対応、adaptive thinkingの深さ制御へ使うと公式記録が説明。
- 取得日現在、Claude 5系列のeffortは **low / medium / high / xhigh / max**。Opus 5.5／Haiku 5.5は既定medium、それ以外の対象5系列は既定high。effortは固定token数や厳密な上限ではない。`max_tokens`は思考＋最終応答を含む総出力上限。
- Claude 5系列はadaptive thinkingが既定。**旧 `thinking.type=enabled`＋`budget_tokens`は対応しない（400）**。4.6ではdeprecatedながら利用可能、4.7以降は非対応。したがって「現在もClaudeはbudget_tokensで指定」と一般化しない。
- モデル差: **Opus 5.5／Fable 5・5.1／Mythos 5・5.1はthinking無効化不可**。**Opus 5はhigh以下ならdisabled可、xhigh/maxでは不可**。**Sonnet 5はdisabled可**。**Sonnet 5.5はdisabled不可だがhigh以下でbetween_tools可**（冒頭の思考を省き、tool間の思考は維持）。Haiku 5.5の細かなdisabled／between_tools対応は今回の表示範囲から全条件を確定していないため、必要ならUnit 8でThinking表を再確認する。
- 5系列はthinking表示が既定omitted。summarizedを指定すると要約が見えるが、内部思考の全量と同一ではない。非表示にしても思考計算／課金がゼロになるわけではない。画面用: **「思考にも出力tokenの料金がかかる。思考の深さを選べるが、指定方法はモデルで違う。」**

### W10の料金候補と計算への引継ぎ

- **Claude Sonnet 5.5 (`claude-sonnet-5-5`)**を現行の例に採用可能。2026-10-10取得、first-party Claude API、USD/100万tokens、global・通常速度・通常同期request: **入力$2、5分write$2.50、1時間write$4、read$0.10、output$10**。PricingとPrompt cachingの2ページで一致。
- Sonnet 5.5は1M context全域で標準単価。US-only inferenceなら1.1倍、Batchなら別価格、server tool利用料等は別。計算例はこれらを除いたtoken従量部分と明示する。
- 現行automatic caching文書のmulti-turn図は「既存historyをread、新しいassistant＋user部分をwrite」を明記し、W10の課金分解を支持する。二次増加の式と数値例は、他社料金を集めるUnit 7で確定する。

### 未解決点と次の単元

- 必須のAnthropic導入日、現行cache料金・最小長、3.7→effortの変遷、例用現行価格の確認は完了。移設ブログ表示日の不整合は残るが、当初beta日は公式release notesで確定できる。
- 全cloud／全廃止モデルの互換性網羅は対象外。Claude 5.5の新機構の実装検証も今回は行わない。
- 次: **Unit 5（OpenAI W7b/W8/W9a/W10、現行APIとGPT-6、歴史発表）**。token閾値通知に従い、このUnitを完全に追記してcheckpointする。report turnではない。

## Plan revision 3

- 学んだこと: 2026-10-07のSonnet 5.5 cache read値下げにより、原問の「Claude 5系」の想定より新しい5.5を含める必要がある。静的な「全モデル0.1倍」「budget_tokensで制御」は現行仕様を誤る。
- 変更: Unit 7の料金例には**Sonnet 5.5の10月7日以後の価格**を使用する。Unit 8に「Haiku 5.5を最終説明に含める場合のThinking表の無効化条件」「旧URLのredirect先と発表日不整合の引用監査」を追加。新たな大単元は不要。
- 派生問い: mid-conversation system/tool更新・per-message effortの全API実装を調べる必要はない。prefix原理を誤解させない注記だけ追究し、詳細な移行・実装は**deferred**として必要時の次の行動へ送る。元の問いは維持。
- 残る単元: 5 OpenAI、6 Google/DeepSeek API、7 Manus/session計算、8横断照合（これまでの追加点含む）、その後に独立report turn。

## Unit 5: W7b・W8・W9a・W10 — OpenAIの現行cache・reasoning・料金

取得・参照日: **2026-10-10 UTC**。native webで一次ページを開き、ナビゲーションが長い公式文書は同URLの`.md`版をサイズ・時間上限付きurllibで補助取得。API実行・課金なし。OpenAI Docs skillの継続適用。

### 参照した一次資料

- 当初発表 **Prompt Caching in the API**, 2024-10-01: https://openai.com/index/api-prompt-caching/ 。
- 現行 **Prompt caching**: https://developers.openai.com/api/docs/guides/prompt-caching （How caching works、model differences、lifetime、keys、settings、cost calculation）。同`.md`も取得。
- **Better prompt caching for GPT-6**, 2026-09-22: https://openai.com/index/better-prompt-caching-for-gpt-6/ 。
- **Pricing**: https://developers.openai.com/api/docs/pricing 、https://developers.openai.com/api/docs/pricing.md 。HTMLでは複数tierの表が連続するため、MarkdownのStandard見出しと列順で検算した。
- **Reasoning models**: https://developers.openai.com/api/docs/guides/reasoning 、同`.md`（effort、context、billing、summary）。
- モデル別仕様（各`.md`も取得）: https://developers.openai.com/api/docs/models/gpt-6-astra 、https://developers.openai.com/api/docs/models/gpt-6.1-sol 、https://developers.openai.com/api/docs/models/gpt-6-sol 、https://developers.openai.com/api/docs/models/gpt-6-luna 。
- 現行GPT-6 guide: https://developers.openai.com/api/docs/guides/latest-model.md 。native webはtext/markdownを拒否したがurllibで取得。APIのenumはこのguideとモデル別ページで一致。
- **Changelog**: https://developers.openai.com/api/docs/changelog.md （2024-12-17、2026-09-29、10-08）。
- **OpenAI o1 and new tools for developers**: https://openai.com/index/o1-and-new-tools-for-developers/ 。o1-2024-12-17と新reasoning_effortを明記。旧モデル仕様 https://developers.openai.com/api/docs/models/o1 も参照。
- **OpenAI o3-mini**, 2025-01-31: https://openai.com/index/openai-o3-mini/ 。low／medium／highの列挙、ChatGPT/API公開の区別。

### W7b: corrected — 2024年の128-token刻み・50%割引を現行へ流用しない

**当初**: 2024-10-01から対象GPT-4o／4o mini／o1-preview／o1-miniへ自動適用。入力の50%割引、1,024 tokensから128-token刻み。無操作5–10分程度、最終利用から1時間以内に消去と発表。当初GPT-4oは通常入力$2.50、cache read $1.25、output $10/MTok。独立したcache-write割増はなかった。発表は即日適用で、cache機能をbetaと呼んではいない（対象モデル名のpreviewとは別）。

**現行GPT-5.6以後（GPT-6を含む）**: 最小は**可視入力1,024 tokens**。hidden system分はこの最小長に算入しない。message境界のimplicit方式が既定で、explicit breakpointも選べる。cache token数は適格境界までの実数で、旧来の128-token丸めを適用しない。writeは通常入力の**1.25倍**、readはGPT-6 Astra／Sol／Lunaで**0.1倍**、**GPT-6.1 Solは0.05倍**。writeは通常入力料金への追加1.25倍ではなく、当該tokenへ適用する単価（合計2.25倍にしない）。

保持指定は **`prompt_cache_options.ttl: "30m"`**、現時点でこの値のみ。最後のwrite／reuseから少なくとも30分が適格期間、reuseで延長し再write料金なし。前世代の`prompt_cache_retention: in_memory/24h`とは別。`prompt_cache_key`はGPT-5.6以後ではrouting最適化に不要で、顧客・利用者ごとのcache accounting分離に任意指定する。旧世代では安定したkeyがroutingを助けるがhit保証ではない。

画面用: **「同じ先頭部分を再利用する。割引率・書込み料金・保持時間はモデルと世代で変わる。」** 最小長だけでhitを保証しない。配置、適格境界、保持、prefix一致等が必要。requestにcache機能があることと、出力済み回答を再送して生成を省くことは違う。

### W8: confirmed — prefixを保つこと、設定もprefixを変えること

- 2026-09-22発表は、toolの定義・schema・順序を安定させ、指示変更は後続developer messageへ追加する方針を明記。GPT-6ではrequest-level effortを固定し、`configuration_update`を会話末尾へ足して深さを変えられる。完全一致原則を回避するのでなく、既存prefixを保持する設計。
- 現行cache文書は、timestampや動的内容を先頭へ置かず、過去messages／tool resultsを保って追記するよう案内。compaction等は変更位置以降の再利用を失わせ得る。tool、effort、verbosity、output schema等もモデルへ渡す内容を変える。
- 安全な画面用: **「前の内容を書き換えると、そこから後のprefixは一致しなくなる。固定の説明を先頭へ、新しい情報を末尾へ。」** 既存entryそのものの削除と、次requestからの再利用不能を区別する。変更より前の適格prefixは使える場合がある。
- W10について現行文書と9月発表は、長いagentが過去の指示・tool・会話を繰り返し使い、そこをcacheで再利用すると明記。二次増加の厳密な式はUnit 7で条件を明示して導く。

### W9a: corrected — 非表示の思考も課金、effortはモデル依存

- o1のAPI **reasoning_effort導入は2024-12-17**。当初発表とChangelogの両方が確認する。o3-miniの**2025-01-31**発表はlow／medium／highを明示するが、effortパラメータの初導入日ではない。o1は当初usage tier 5から段階公開、o3-miniもtier 3–5からと発表したため、「その日に全利用者へ無制限GA」と付け足さない。
- 現行APIのモデル別値:

| モデル | 対応effort |
|---|---|
| GPT-6 Astra | low / medium / high / xhigh / max |
| GPT-6.1 Sol | low / medium（既定）/ high / xhigh / max |
| GPT-6 Sol、GPT-6 Luna | none / low / medium（既定）/ high / xhigh / max |

- Astra／6.1 Solへnoneは使えず、6.1 Solへminimalも使えない。上記モデルページにはultraをAPI対応値として列挙していない。Codex側のUI・実行環境が受け付ける名前をAPI仕様の証拠にしない。Astraの既定値は今回のモデルページの明示範囲で確定せず、画面には不要。
- Reasoning文書はraw reasoningを通常の可読本文として返さず、**output tokensとして課金**すると明記。usageのreasoning_tokensで数量を確認でき、summaryや再送用encrypted itemはraw思考全文の開示とは違う。
- 「回答前に思考」は導入説明として妥当だが、現在のモデルには**visible output／tool callの間にも思考するinterleaved thinking**がある。「全思考が必ず最終回答の前の一塊」は過剰。画面用: **「答えや道具の使い方を考えるtokenにも、出力の料金がかかる。」**
- effortは思考量を導く設定で、固定token数や料金上限ではない。`max_output_tokens`は思考・可視出力等を合わせて制限する。GPT-5.6以後は過去turnのreasoning再利用に関する既定も変わっており、「思考は次のturnには必ず捨てる」と一般化しない。

### W10: 現行料金候補

**GPT-6.1 Sol (`gpt-6.1-sol`)**、first-party API、USD／100万tokens、Standard・global、入力**272K以下**: **通常入力$2、cache write $2.50、cache read $0.10、output $10**。2026-09-29 releaseをChangelogで確認し、価格表・モデルページとも一致。モデル本体のreleaseと、同時にbetaと記されたmulti-agent機能は区別する。

入力が272Kを超えると、**そのrequest全体**の入力・cache単価が2倍、outputが1.5倍（$4／$5／$0.20／$15）。超えた部分だけへの加算ではない。Batch／Flex／Fast／Ultrafastは別単価。regional processingは対象モデルで10%増、tool等の別料金もある。Unit 7の例はglobal Standard・短文脈・token従量部分だけに固定する。

独自の請求式（現行guideの式とも一致）: `C_input = [(I − R − W) p_in + R p_read + W p_write] / 1,000,000`。`I`は総入力、`R`はcached_tokens、`W`はcache_write_tokens。出力分`O p_out / 1,000,000`を足す。全入力料金にread/write料金を重ねて二重計上しない。

### 未解決点と次の単元

- 必要な旧／現行cache仕様、effort導入日、GPT-6別の対応値、料金候補は確認完了。o1初日enumの歴史archiveは今回取得しておらず、low/medium/highの逐語列挙はo3-mini発表から確認したもの。必要ならUnit 8で初日o1仕様を補助照合するが、パラメータ導入日の結論は確実。
- 現行cacheの全routing／全message適格性／全SDK対応を実行検証してはいない。課金例は理想的なhit条件を明示し、実際の請求予測とは分ける。
- 次: **Unit 6（Google／DeepSeekのcache・reasoning・現行料金）**。残り6・7・8＋独立report turn。token閾値通知に従いUnit 5をここで完結しcheckpointを要求する。

## Plan revision 4

- 学んだこと: OpenAIは現行GPT-6世代でcache writeの単価・境界・保持設定が変更済み。さらに9月29日のGPT-6.1 Solはreadが0.05倍で、旧GPT-6 Solの0.1倍とは異なる。『OpenAIは書込み無料』という過去の比較表を現行へ使えない。
- 変更: Unit 7のOpenAI例には**GPT-6.1 SolのStandard短文脈価格**を採用し、Anthropic同様にwrite／read／通常入力を分ける。Unit 8でcache世代・128-token刻み・API enumとCodex設定を混同していないか監査する。
- 派生問い: 新cacheの実hit率や全SDKの移行検証は元問を越えるため**deferred**。API利用実装時に小規模なusage照合を推奨する。原問の主題変更なし。
- 現在の残単元: 6 Google/DeepSeek API、7 Manus/session計算、8横断照合（Llama config、Flash license、各社日付・価格・設定の監査）、その後明示的report turn。

## Unit 6: W7c–d・W9c–d・W10 — Google／DeepSeekのcache・reasoning・現行料金

取得・参照日: **2026-10-10 UTC**。native webを使用し、DeepSeekのHTML本文は上限1–1.5 MB・各20秒のurllibでも確認。モデル実行、API課金、インストールなし。

### 参照した一次資料

- Google I/O予告、2024-05-14: https://blog.google/innovation-and-ai/technology/developers-tools/gemini-gemma-developer-updates-may-2024/ （context cachingをJuneに追加予定と明記）。
- Gemini API release notes: https://ai.google.dev/gemini-api/docs/changelog （2024-06-18 API support追加）。
- Google公開紹介、2024-06-27: https://developers.googleblog.com/en/new-features-for-the-gemini-api-and-google-ai-studio/ （1.5 Pro／Flashでlaunch済み）。
- Implicit caching発表、2025-05-08: https://developers.googleblog.com/en/gemini-2-5-models-now-support-implicit-caching/ 。
- 現行Gemini caching: https://ai.google.dev/gemini-api/docs/caching （2026-10-09更新表示）。GenerateContent側: https://ai.google.dev/gemini-api/docs/generate-content/caching （explicitのBeta、TTL、保管料）。
- DeepSeek **Context Caching is Available 2024/08/02**: https://api-docs.deepseek.com/news/news0802/ 。native webでは価格を検索しても表示されなかったが、同URLのHTML本文をurllibで取得し当初価格を確認。
- 現行Context Caching: https://api-docs.deepseek.com/guides/kv_cache/ 。
- 現行Models & Pricing: https://api-docs.deepseek.com/quick_start/pricing/ 。native webは一度Internal Error、末尾slashなしから再取得できた。HTML直接取得でも表と脚注を照合。
- **DeepSeek-V4-Pro GA、2026-08-13**: https://api-docs.deepseek.com/news/news260813/ （native web検索とurllib本文）。
- 現行Thinking Mode: https://api-docs.deepseek.com/guides/thinking_mode/ 。API reference: https://api-docs.deepseek.com/api/create-chat-completion/ （native web取得エラーのためurllibでenum、max_tokens、usage部分を確認）。
- Preview発表: https://deepseek.com/en/news/v4-preview/ （2026-04-24、dual thinking/non-thinking modes）。
- DeepSeek-R1原論文v1: https://arxiv.org/html/2501.12948v1 （2025-01-22、Abstract、§1、§2.3）。書誌: https://arxiv.org/abs/2501.12948 （現在v2は2026-01-04のため歴史記述はv1へ固定）。
- Nature版: https://www.nature.com/articles/s41586-025-09422-z.pdf 、DOI https://doi.org/10.1038/s41586-025-09422-z 。HTMLは取得エラーだったがPDF11頁を取得、p.633–635の本文・Figure 2を確認。online **2025-09-17**、Nature 645, 633–638、号の日付09-18。
- R1公式repo: https://github.com/deepseek-ai/DeepSeek-R1 （Introduction、§7 License）。公開日2025-01-20は既存 `research/llm-facts/report.md:193` の確認済み根拠 https://api-docs.deepseek.com/news/news250120/ を再利用（今回のURL再openはInternal Error、過去の確認を否定しない）。

### W7c: confirmed（日付を予告・API提供開始に分ける）

- Explicit context cachingは**2024-05-14に予告、2024-06-18にGemini APIへ追加**。06-27の公式blogでも1.5 Pro／Flashでlaunch済みと紹介。2025-05-08記事の「May 2024にpioneered」という回顧を、そのままAPI提供開始日へ使わない。
- Implicit cachingは**2025-05-08にGemini 2.5向けrollout発表**。当初はcache対象tokensの75%割引、最小2.5 Flash=1,024、Pro=2,048。同一prefixを先頭に置き、変動内容を末尾へ足す助言も明記。
- 2026-10-10の現行guideでは2.5以後にimplicitが既定で有効。現在のminimumは**2.5 Flash／Pro=2,048、3.8 Flash／3.6 Flash／3.1 Pro Preview=4,096**。当初のFlash 1,024を現行へ流用しない。hitは保証されない。
- **現行Interactions APIはimplicitのみ**。Explicitは**GenerateContent API**で提供され、現行文書は**Beta（v1beta）**と明記する。モデルがGAであることからcache APIもGAと推定しない。Explicitはcache objectを作り参照し、既定TTL1時間、保管token数×時間の料金もある。read単価だけを比較すると総額を誤る。
- 画面用: **「Geminiは、保存を指定するexplicit cacheを2024年6月に提供。自動のimplicit cacheは2025年5月に導入した。」** 細かな現行割引はモデルの価格表次第であり、今回はGoogleの単価をW10の比較例へ追加しない。

### W7d: corrected — 当初価格と現行V4-Pro、保存境界の条件

- **2024-08-02**にdisk context cachingを全利用者へ自動提供。旧発表の当初価格は**hit $0.014／MTok、miss $0.14／MTok**。ストレージ別料金なし。先頭tokenから同じprefixだけが対象で、入力途中の同一文章はhit対象にならない。当時の64-token storage unit、未使用entryは数時間〜数日で消去、100%hitは保証しないという記述も確認。
- **現行**は自動cacheだが、SWAに伴い**永続化済みのprefix unit全体と一致**する必要がある。入力末尾／出力末尾、検出した共通prefix、長文の固定間隔でunitを作る。`A+B`の次に`A+C`を送っても、Aのunitがまだなければhitしない。共通Aを検出・保存した後の`A+D`なら使える例が公式文書にある。従って「同じ先頭ならその全長が必ずhit」や「現行も必ず64-token刻み」は避ける。
- 現行guideもbest effort、cache構築は数秒、未使用は通常数時間〜数日で消去としている。TTL保証の数字ではない。`prompt_cache_hit_tokens`／`prompt_cache_miss_tokens`で実績を見る。保存した回答文をそのまま返すresponse cacheではなく、生成計算は行う。
- V4-Proの現行モデルversionは**DeepSeek-V4-Pro-0813**、API ID **`deepseek-v4-pro`**。**2026-08-13 GA発表、08-16 16:00 UTC料金適用開始**。2026-04-24 previewと区別。
- **USD／100万tokens、2026-10-10取得**:

| 時間区分 | 通常入力/cache miss | cache write | cache read/hit | output |
|---|---:|---|---:|---:|
| Off-peak | $0.66 | 独立単価・追加write料なし。miss入力へ$0.66 | $0.022 | $1.98 |
| Peak | $1.32 | 独立単価・追加write料なし。miss入力へ$1.32 | $0.044 | $3.96 |

- Peakは**月〜金01:00–04:00、06:00–10:00 UTC、ただし中国の祝日を除く**。その他・週末・中国の祝日終日はoff-peak。native webの旧crawl検索表には祝日除外がなかったが、今回取得した現行HTML本文に明記されているためこちらを採る。off-peakはpeakの半額、readはmissの1/30。「以前の価格から半額」とは言っていない。
- 上のwrite列を単に「0ドル」とすると新規入力も無料に見えるため、**「追加write料なし（miss課金）」**とする。総入力I、hit R、出力Oの費用は `[(I−R) p_miss + R p_hit + O p_out]/1,000,000`。通常入力とhitを重ねて課金しない。
- 現行Flash欄は**V4.1-Flash**へ更新され、旧v4-flashの名前も新モデルへrouteされる。V4-Proの例と混ぜない。

### W9c: corrected — R1とR1-Zero、公開日と論文日

- 公開**2025-01-20**、arXiv v1 **01-22**、Nature online **09-17**。公開日について既存報告を再利用。
- R1コードとモデルweightsの**MIT license**は公式repo §7が明記。蒸留Llama／Qwenモデルは元モデルのlicenseにも言及されており、全関連モデルを無条件に同一licenseとしない。
- arXiv v1とNature本文は、**R1-Zeroは事前学習済みV3-Baseへ初期SFTなしでRLを適用**、**R1はcold-start SFT、reasoning RL、rejection sampling＋SFT、追加RLを組み合わせる**と区別する。「事前学習も含め全部RLだけ」「R1に教師あり学習はない」は誤り。
- 「主にRL」は全学習の量や費用比率まで意味すると根拠不足。画面用: **「DeepSeek-R1は、教師あり調整と強化学習を組み合わせ、推論の力を伸ばした。生成した推論文も読める。」** 推論テキストが可視であることと、内部計算の忠実な全記録であることは別。現行APIにも`reasoning_content`と最終`content`の分離があり、reasoning token数もusageへ分離される。

### W9d: corrected — non-thinkとeffortを別にする

- 当初V4 previewのthinking／non-thinkingの二方式は04-24発表が支持。現行は**thinking無効、またはlow／high／max**。**low追加は2026-08-13のGA発表**で確認。原問の「non-think／high／max」は現行一覧として不完全。
- 既定thinking enabled、effort high。Thinking guideはChatCompletionsの`thinking.type=disabled`と`reasoning_effort=low/high/max`を説明。さらに現行ChatCompletions referenceは`reasoning_effort=none`で無効化も明記。Responses形式は`reasoning.effort=none/low/high/max`。互換値は独立した深さではなく、minimal→low、medium/xhigh→high、guideではultra→max。
- **最大出力384K = 393,216 tokens**（現行pricing表とChatCompletions reference）。思考を含む生成の総量で、入力＋生成はcontext上限にも制約される。既定はnon-thinking **8K**、thinking **64K**、max effort **128K**。最大値と既定値を混同しない。
- Toolありrequestでは現行guideが過去turnのreasoning_contentを再送・contextへ組込み要求とする。Toolなしでは再送不要、送ってもcontextに含まれない。全reasoning APIが過去思考を一律に破棄するとの説明は避ける。これはW10の例で「何tokensを再送するか」の条件に関係する。

### 未解決点と次の単元

- W7c/d、W9c/dの必須事項、W10用V4-Pro料金は確認完了。Googleを含む全モデルの現行単価網羅は要求外。
- 祝日カレンダーの指定・time-zone境界を跨ぐ1requestの料金決定時点までは文書の確認範囲外。W10の例は全requestが同じ時間帯区分内という条件にする。全ユーザーの実測hit率は保証しない。
- 次: **Unit 7（Manusの正確な短い引用、prefix安定性、長いsessionの二次増加と料金例）**。残る単元7・8、その後明示的report turn。token閾値通知に従いUnit 6を完結してcheckpointを要求する。

## Plan revision 5

- 学んだこと: GoogleのMay 2024という回顧は予告日とAPI提供開始を分ける必要がある。DeepSeek V4の現行cacheは保存済みunit一致の条件があり、原問の単純なprefix hit説明だけでは保証が強すぎる。V4-Pro正式公開でlowが加わり、現行Flash APIは別世代へ置換済み。
- 変更: Unit 7の理想hit例は適格な保存境界と構築完了を仮定し、DeepSeekの料金はpeak／off-peak両方を示す。Unit 8の監査にGoogle予告／提供／Beta、DeepSeek中国祝日条件とAPI aliasを加える。大単元の追加なし。
- 派生問い: DeepSeek cache unitの固定間隔の具体値、祝日一覧、時刻境界の請求仕様は本問の一般説明に不要なため**deferred**。実運用の予算算定時にproviderへ確認する次の行動として残す。元の問いは変わらない。
- 現在の残単元: 7 Manus/session計算、8横断照合（過去revisionの未解決点も含む）、その後独立report turn。

## Unit 7: W8・W10 — Manusの引用と長いsessionの入力・料金計算

取得・参照日: **2026-10-10 UTC**。native webで一次本文を確認。計算は小さな整数とPython Decimalのみで再検算し、API呼出し・課金・モデル実行はしていない。Unit 4–6で取得済みの料金を再利用。

### 参照した一次資料

- Yichao 'Peak' Ji, **Context Engineering for AI Agents: Lessons from Building Manus**, **2025-07-18**: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus （日付・署名、Design Around the KV-Cache、Use the File System as Context）。検索の相対日付より本文の絶対日付を採用。
- Anthropic **Prompt caching**: https://platform.claude.com/docs/en/build-with-claude/prompt-caching （Automatic caching、How automatic prefix checking works、Pricing、TTL）。今回再取得したSonnet 5.5料金もUnit 4と一致。
- OpenAI **Conversation state**: https://developers.openai.com/api/docs/guides/conversation-state （previous_response_id、Data retention、Managing context）。OpenAI Docs skillの継続適用。
- Unit 4–6の価格の根拠を再利用: https://platform.claude.com/docs/en/about-claude/pricing 、https://developers.openai.com/api/docs/pricing 、https://api-docs.deepseek.com/quick_start/pricing/ 。取得日は各単元とも2026-10-10。
- 既存検証を再利用: research/llm-facts/report.md の全履歴方式／Responses例外、research/agent-facts/report.md の保存履歴と現在context、compactionの区別。元ファイルを変更していない。

### W8: confirmed（Manusの経験的な見解として）

- 本文の日付は**2025/7/18**、著者は**Yichao 'Peak' Ji**。cache hit率を最重要とする部分は筆者の経験的な判断であり、すべてのagentに対する数学的定理やproviderのSLAではない。記事末尾も普遍的真理ではないと限定している。
- 最終報告で使う逐語引用は次の**計23語**に絞る（他の同記事本文は日本語要約とする）。第1引用は文中の抜粋で、前置きの「1つ選ぶならという筆者の見解」は地の文で説明する。
  - “KV-cache hit rate is the single most important metric for a production-stage AI agent”
  - “Keep your prompt prefix stable.”
  - “Make your context append-only.”
- 記事のClaude Sonnet例は**cached input $0.30／MTok、uncached input $3／MTok**、すなわち通常入力がcache readの**10倍**。これは**2025-07-18の記事の例**で、今回採用した2026-10のSonnet 5.5の$2／$0.10（20倍）に置き換えて記事の引用扱いにしない。10倍の価格差はsession全体が10分の1になる保証でもない。
- 記事は行動・観察を次の入力へ追記するloop、初期timestampや過去履歴の編集によるprefix不一致、安定した直列化と適切なbreakpointを説明する。固定prefixと追記の勧めはUnit 4–6のprovider仕様とも整合する。
- 確認範囲を越えた一般化を避ける: prefixの一致だけでは実hitを保証しない。Anthropicのlookbackはbreakpoint当たり20 block位置で、以前書いたentryが範囲外ならhitしない。今回の同社文書は、旧entryに届かせる追加breakpointの例も示す。DeepSeekにも保存済みunitの条件がある（Unit 6）。

### W10: confirmed（条件付きの独自導出）

**画面用:** 「履歴を全部使い続け、毎回ほぼ同じ量を足すと、入力tokenの累計は回数の二乗に近い増え方になる。cacheで再利用した部分は、安い読出し料金になる。」

- Manusはaction／observationを次の入力へ追加し、文脈がstepごとに成長すると説明する。Anthropicは会話が成長すると過去prefixをread、新しい末尾をwriteする例を示す。**二乗の式そのものは本調査の計算**であり、これらの資料からの逐語引用ではない。
- 最初の入力をP token、各回の間に増える入力を一定g token、request回数をnとすると、`I_t = P + (t−1)g`。累計は **`I_total = nP + g n(n−1)/2`**。g>0でnが増える範囲に二次項がある。人間との会話回数ではなく、tool loopを含む**モデル呼出し回数**を数える。
- 全履歴を保持、増分ほぼ一定、途中のcompaction／truncationなし、context上限以内、という条件。可変長の一般形は `nP + Σ(k=1..n−1)(n−k)g_k`。無限長の会話を実モデルが受け付ける意味ではなく、context制限までの増え方の説明。
- OpenAI Conversation stateは`previous_response_id`でもchainの過去inputがinput課金対象と明記。**HTTP本文で履歴を送り直さないことと、その履歴がモデル入力／課金から消えることは別**。cache割引の適用可否は別途prompt caching仕様による。画面文言は「全履歴を毎回送る」より「全履歴を毎回使う」がserver保存方式にも誤解を生みにくい。
- 理想的に毎回前のprefixへhitし、新規末尾のみwriteなら、write総量は **`W=P+(n−1)g`**、read総量は **`R=I_total−W=(n−1)P+g(n−1)(n−2)/2`**。write量は線形でもread総量の二次項は残る。**read単価が正なら、cacheで請求額の増え方が自動的に線形になるわけではない**。計算資源、転送量、請求tokenを同じ量として扱わない。

### 「例」付きの価格表・計算

すべて**USD／100万tokens、2026-10-10取得**。first-party、通常同期API、global／Standard相当。Batch・速度優先・地域指定・tool実行・ストレージ・外部service・税などは別。この表はtoken単価の比較で、同じtoken予算で同じ品質／同じ仕事量を達成する比較ではない。

| モデル／条件 | 通常入力 | cache write | cache read | output |
|---|---:|---:|---:|---:|
| Claude Sonnet 5.5 | $2 | 5分 $2.50／1時間 $4 | $0.10 | $10 |
| GPT-6.1 Sol、入力272K以下 | $2 | 30分 $2.50 | $0.10 | $10 |
| DeepSeek-V4-Pro、off-peak | $0.66 | 追加write料なし（miss課金） | $0.022 | $1.98 |
| DeepSeek-V4-Pro、peak | $1.32 | 追加write料なし（miss課金） | $0.044 | $3.96 |

- DeepSeek peak: 月〜金01:00–04:00・06:00–10:00 UTC、中国の祝日を除く。例は全requestが同じ区分内で完了すると仮定。8月16日16:00 UTC適用開始（Unit 6）。
- **架空の20回の例:** `n=20, P=10,000, g=1,000`。毎回の課金対象outputを500 tokens（思考を含む総量）と仮定し、O=10,000。入力は10,000→29,000、累計**390,000**、新規write／miss計**29,000**、read計**361,000**。gは直前出力のうち保持する内容と新しい入力・tool結果を合わせた増分で、output token全部を次回再送するという一般仕様は仮定しない。
- 同一prefixを追記で維持、最低長・保存境界・lookback・構築完了・保持時間を満たし、前回の入力全体が毎回hitすると仮定する。全requestの末尾までwriteし、20回目に書いた分も課金へ含める。実測値ではない。
- **Sonnet 5.5（5分）／GPT-6.1 Sol（30分）:** `(29,000×2.50 + 361,000×0.10 + 10,000×10)/1,000,000 = $0.2086`。内訳はwrite **$0.0725**、read **$0.0361**、output **$0.10**。同じ数字になるのは今回の単価と仮定が同じためであり、モデルの同等性を意味しない。
- Sonnet 5.5の1時間TTLならwriteが$0.116で、合計**$0.2521**。5分のTTLは今回再読した文書ではrequest開始から測り、生成時間も含む。cache readにより刷新するが、長いresponseの後は残り時間が短い場合がある。
- **V4-Pro off-peak:** `(29,000×0.66 + 361,000×0.022 + 10,000×1.98)/1,000,000 = $0.046882`。内訳はmiss **$0.01914**、read **$0.007942**、output **$0.0198**。
- **V4-Pro peak:** 同条件で**$0.093764**（全単価がoff-peakの2倍）。
- 通常入力、write、readは入力tokenの重複しない課金区分。合計入力の通常料金にさらにwrite／read料金を加算しない。全miss時もcache writeが発生するAPIでは、単なる通常入力単価だけを「cacheなしの実請求」と呼ぶと誤るため、この例では無条件の削減率を掲げない。

### 未解決点と次の単元

- 必須のManus日付・短い逐語引用・歴史価格・prefix助言、sessionの条件付き式、現行3社の価格例は確認完了。cacheの実hit率、providerごとのtokenizer差、実モデルの思考量や品質差は未測定で、例は実予算の保証ではない。
- 次は **Unit 8（横断照合）**。Llama公式config代替、V4-Flash license、全W項目の出典・公開区分・引用・単位・現行値と旧値の監査、必要ならHaiku 5.5 thinking条件の確認。終わったらready-to-reportを返し、report.mdは明示的report turnで作成。
- token閾値通知に従いUnit 7をここで完結してcheckpointを要求する。projectファイルは変更していない。

## Plan revision 6

- 学んだこと: cache readの累計にも二次項が残る。したがってcacheによる単価低下と、compactionによるcontext削減を分ける必要がある。また、server側保存でHTTP上の再送を省いても過去入力の課金が消えるとは限らない。
- 変更: Unit 8の最終監査に「cacheが二次増加を線形化するという誤読の防止」「request回数と人間のturn数の区別」「思考を含むoutput総量と再送量の区別」を追加。大単元の増減なし。
- 派生問い: 実際のagent sessionでのcache率・token内訳・品質当たり費用の測定は**deferred**。原問は説明のfact-checkと例用の単価であり、モデルを動かして性能比較する依頼ではない。必要時はusageを記録する小規模な別調査を推奨する。
- 現在の残単元: **8 横断照合**、その後の明示的な独立report turn。

## Unit 8: 全項目の横断照合 — 公式設定、license、単位・時点・計算

取得・参照日: **2026-10-10 UTC**。native webと、時間・サイズ上限付きの小さな公式source取得を使用。調査単元1–7の全ログと元のW1–W10依頼を再読して照合。モデル実行、API課金、project変更なし。

### 今回追加で参照した一次資料

- Meta公式モデル台帳: https://github.com/meta-llama/llama-models/blob/0e0b8c519242d5833d8c11bffc1232b77ad7f301/models/sku_list.py 。raw固定版も取得。19行、249–265行、530–546行。
- Meta公式SKU型定義: https://github.com/meta-llama/llama-models/blob/0e0b8c519242d5833d8c11bffc1232b77ad7f301/models/sku_types.py 。167行、200–208行。固定shaは https://api.github.com/repos/meta-llama/llama-models/git/ref/heads/main で取得した。
- Meta公式実装の固定版: https://github.com/meta-llama/llama-models/blob/0e0b8c519242d5833d8c11bffc1232b77ad7f301/models/llama3/model.py 。head dimension、cache shape、FFN寸法、層別block、embeddingとoutputを再照合。
- DeepSeek-V4-Flash model card: https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash （Introduction、License、Safetensors表示）。ライセンス本文: https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash/blob/main/LICENSE 。
- Claude現行Thinking表: https://platform.claude.com/docs/en/build-with-claude/thinking （Configuring thinking表、Turning thinking off、Thinking has a cost）。
- 既存研究の再読: 本log Unit 1–7、research/agent-facts/report.md の報告形式・全履歴／compaction区分、元のW1–W10依頼。過去に直接確認した一次URLと取得日は各Unitに記録済み。横断監査しただけのページを今回再取得したとは扱わない。

### W2の未確定部分を公式コードで解消

- HFの公式 `resolve/main/config.json` は今回も**401**。認証を探さず、公開されているMeta自身のモデル台帳を代替一次資料とした。HF config.jsonを読めたという記載にはしない。
- 固定版sku_list.pyはbaseとInstructの両方で、**dim=8192、n_layers=80、n_heads=64、n_kv_heads=8、vocab_size=128256、ffn_dim_multiplier=1.3、multiple_of=4096**を定義している。台帳は対象HF repo名も明示するため、別モデルの値を転用したものではない。
- sku_types.pyはLlama 3.1系列の**max_seq_length=131072**と既定の**bf16** checkpoint形式を明示。従ってUnit 1の「厳密な131072が公式一次資料で未確認」は解消。KV dtypeは実装が入力projectionのdtypeへ合わせるものであり、bf16容量の例という条件自体は引き続き明記する。
- model.pyの**head_dim=dim//n_heads=128**、層ごとの独立cache、全prefix参照をUnit 1と照合。sliding-window切捨て／層間KV共有がないこの標準実装に通常GQA式を適用できる。
- FFN実装の丸めは `int(2×32768/3)=21845`、`int(1.3×21845)=28398`、4096の倍数へ切上げて**28672**。embeddingとoutputは別に作成し、attention/FFN projectionにbiasなし。この入力とUnit 1のAPI tensor集計 **70,553,706,496**は整合する。厳密なparameter数の主たる根拠はHF公式repo metadataとし、分解は検算と位置づける。
- 再計算: `2×80×8×128×2=327680 bytes/token=320 KiB`、`×131072=40 GiB`。重みは`70553706496×2=141107412992 bytes`、約141.107 GB（131.417 GiB）。**W2をconfirmedとして報告可能**。ただしHF configの直接取得制約を短く留保する。

### W5・W9の残りの直接確認

- **V4-FlashのLicense節はrepositoryとmodel weightsの双方がMITと明記**し、LICENSE本文もMIT License。Unit 3のProだけからの類推を使う必要はなくなった。
- 同cardは本文にFlash **284B／13B active**、一方Safetensors集計表示には**291B**と出る。本体の公表parameter数と配布tensor集計を同じものにしないというUnit 3の注意がFlashにも必要。291Bをモデル本体の訂正値にはしない。差分の全内訳は未検証。
- **Haiku 5.5**: thinkingは既定adaptive、`enabled`＋`budget_tokens`と`between_tools`は400、`disabled`は**low／medium／highで可、xhigh／maxは不可**。Thinking表と本文の両方が一致。Unit 4の保留は解消。
- Claude 5系列の説明は「adaptiveが既定、深さはeffort、無効化条件はモデル別」に揃える。旧3.7のbudget_tokensを現行5系列へ流用しない。5.5モデルを5系列の例に含めてよいが、旧5と同一仕様とはしない。

### 横断監査結果

- **最終主表の判定案: confirmed 6件（W1・W2・W3・W6・W8・W10）、corrected 4件（W4・W5・W7・W9）**。各項目全体をuncertainにする必要はないが、個別の未確定点は別記する。W6のrouter説明は通常のMoE層に限定し、V4先頭3層のhash routingは例外として残す。
- W1の素朴な逐次decode、W2のGQA、W4のMLA、W5のCSA/HCAを区別。KV cache容量をモデル総parameter数だけで見積もらない。prefillの並列処理と、通常の自己回帰decodeの逐次性を説明し、speculative decoding等の例外へ一般化しない。
- W4の独自計算も再一致: MLA **70272 bytes/token**、仮想展開済multi-head **4997120 bytes/token**。K/V共同latentへ余計な2倍を掛けない。V2の93.3%／5.76倍とV4の27%／10%は各社の測定・比較条件つきで、bf16理論容量やAPI価格の倍率へ読み替えない。
- 日付監査: 公開／論文投稿、予告／提供開始、preview／beta／GAを分離。Anthropic移設記事の年の不整合はrelease notesを優先。V4論文の日付表示の不整合を公開日に使わず、公式preview発表04-24とPro GA 08-13を使う。Flash-0731はAPI public beta、Gemini explicitは現行GenerateContent Betaである点を残す。
- W7はa–dを主表の1行へ集約し、モデル別minimumや旧／現行価格の詳細は補足表へ。Anthropic 0.1倍やOpenAI 50%・128-token刻みを全現行モデルへ流用しない。OpenAI API effortのenumとCodex等クライアントの設定名を混同しない。
- W8のManus逐語引用はUnit 7の**計23語**の3抜粋に固定。記事の10倍例は2025-07-18当時の$3／$0.30で、現行Sonnet 5.5の$2／$0.10とは分ける。重要性の順位はManus著者の実務上の判断と明示する。
- W10のDecimal再検算は**I=390000、W/miss=29000、R=361000、O=10000**、Sonnet 5.5の5分／GPT-6.1 Sol **$0.2086**、Sonnet 1時間 **$0.2521**、V4-Pro off-peak **$0.046882**、peak **$0.093764**で一致。
- W10は**課金対象output総量に思考を含む**、新規input増分とは別、と明示。全履歴を毎回使う／一定増分／圧縮なしの条件で二次項が生じ、cache readにも二次項が残る。料金例は理想hit・同一時間帯・各社別tokenizerの同じ数値予算による架空例で、仕事の品質や実sessionの請求比較ではない。

### 残る不確実性と完了境界

- HF Llama config.jsonの直接取得は未達だが、必須の値はMeta公式コード・論文・HF公式metadataで確認済み。認証が必要な原ファイルの取得は後日の任意追加確認で、report作成を妨げない。
- V4 Pro／Flashの配布tensor集計差の全内訳、論文表示日付の不整合、実hit率、時間帯を跨ぐDeepSeek requestの課金時点・祝日一覧、品質を揃えた実費用比較は未検証。確定値に混ぜず、必要時の追加調査とする。
- o1初日のenumの歴史archiveは追加取得していない。導入日は2024-12-17の発表とchangelogで確定、low/medium/highの明示的列挙は2025-01-31 o3-mini発表を根拠にする。この区別で元問へ回答できるため追加単元は設けない。
- **Unit 1–8は完了。次は独立したreport turn**。このturnではreport.mdを作らない。ユーザーのtoken閾値通知に従い、Unit 8を完全に記録してcheckpointを要求する。

## Plan revision 7

- 学んだこと: Meta公式の公開SKU台帳がHF gated configの代替根拠になり、Llamaの必須値を確定できた。Flashも本体284BとSafetensors 291Bの集計差があり、モデル本体と配布tensorを分ける注記が必要。
- 変更: Unit 8でLlama config代替、Flash license、Haiku thinking保留を解消。追加の研究単元なし。
- 派生問い: **Flashの284Bと291Bの差分の全tensor内訳**はProのDSpark説明とは別の追加問題であり、元問の公表値・licenseの確認には不要。今回は**deferred**。Pro含むtensor別容量監査が必要になったときの追加行動へ送る。元の問いは変わっていない。
- 最新計画で残る作業は**明示的なreport turnで日本語report.mdを書くことのみ**。主表W1–W10各1行、必要な補足、未確定点、計画の変遷と推奨行動を含める。
- Handoff: **ready to write report**。

## Report completion — 2026-10-10 UTC

- 明示的なreport turnでUnit 1–8と元のW1–W10依頼を再読し、`research/cost-facts/report.md`を日本語で作成した。研究単元の追加はない。
- 主表はW1–W10各1行、confirmed 6件／corrected 4件。容量の式と入力、APIの当初／現行、公開区分、Manusの23語の逐語引用、料金例、未確定点、計画の変遷と推奨行動を記載した。
- 小さな検証処理でIDの過不足、判定数、表行・code fence、KV容量と全料金例の整数／Decimal計算を確認した。出力directoryの研究artifactはlog.mdとreport.mdの2件のみ。project実装は変更していない。
- 最新計画の研究・報告作業は完了。report turnのためcheckpointは要求しない。
