# 計算と値段：W1–W10のファクトチェック

## 要約と判定方法

**10項目中、confirmed（確認）6件、corrected（訂正）4件。訂正対象はW4・W5・W7・W9。** confirmedも下表の条件付きの判定である。項目全体をuncertainとする必要はなかったが、配布重みの集計差の内訳や実際のキャッシュ命中率には未確定部分がある。

大きな修正点は、MLAでは圧縮latentに加えて位置情報用のキーも保存すること、モデル本体のパラメータ数と補助モジュール込みの配布量を分けること、旧来のキャッシュ割引率・保持時間・思考設定を現行モデルへ流用しないこと。キャッシュは再利用部分の単価を下げるが、長い会話の累計入力に生じる二次項を自動的に消すわけではない。

一次資料の取得・確認日はすべて **2026-10-10 UTC**。開始時刻は03:55:00 UTC。現行API・価格はその日の公式文書の値であり、過去の発表内容は別に記す。[調査ログ](log.md)に資料の節、取得制約、計算の検算、計画変更を残した。[先行LLM報告](../llm-facts/report.md)の会話履歴とR1公開日、[先行agent報告](../agent-facts/report.md)の保存履歴・現在のcontext・compactionの区別は再利用した。モデル実行、課金API呼出し、デッキの編集は行っていない。

## 全項目の判定表

指定IDごとに1行。画面には短い文言を使い、条件・計算式・細かな公開区分は脚注やREADMEへ残す。

| ID | Status | 画面に使える値・文言 | 一次資料 | 範囲・留保 |
|---|---|---|---|---|
| W1 | confirmed | 「過去の各トークンのKとVを層ごとに保存し、次のトークンの計算で再利用する。入力は並列に処理でき、通常の生成は1トークンずつ進む。」 | [Pope §1–2](https://arxiv.org/pdf/2211.05102)、[PagedAttention §2–3](https://arxiv.org/html/2309.06180) | 通常のcausal Transformerの説明。新tokenのQ/K/Vを計算し、過去のK/Vを読む。OPT-13Bの例は800 KiB/token、2048 tokenで1.5625 GiB。原論文は800 KB・1.6 GBと表記。 |
| W2 | confirmed | 「Llama 3.1 70Bでは、bf16のKVが1トークン320 KiB。131,072トークンで40 GiB。重みだけでも約141 GB。」 | [Llama 3 Table 3](https://arxiv.org/html/2407.21783v3)、[Meta公式台帳](https://github.com/meta-llama/llama-models/blob/0e0b8c519242d5833d8c11bffc1232b77ad7f301/models/sku_list.py)、[長さ・形式](https://github.com/meta-llama/llama-models/blob/0e0b8c519242d5833d8c11bffc1232b77ad7f301/models/sku_types.py)、[公式repo集計](https://huggingface.co/api/models/meta-llama/Llama-3.1-70B-Instruct) | 80層、8 KV heads、head dim 128、2 bytes/value。重み70,553,706,496 parameters。1 sequenceの理論payloadで、実稼働memoryとは別。HF config直読は401、Meta公開コードで必要値を照合。 |
| W3 | confirmed | 「MQAはすべてのQで1組のK/Vを共有。GQAはQのグループごとにK/Vを共有する。」MQA **2019-11-06**、GQA **2023-05-22初稿／EMNLP 2023**。 | [MQA](https://arxiv.org/abs/1911.02150)、[GQA](https://arxiv.org/html/2305.13245v3)、[EMNLP](https://aclanthology.org/2023.emnlp-main.298/)、[Llama 2](https://arxiv.org/html/2307.09288v2)、[Llama 3](https://arxiv.org/html/2407.21783v3)、[Mistral 7B](https://mistral.ai/news/announcing-mistral-7b/) | 採用例はLlama 2 **70B**、Llama 3、Mistral 7B。層をまたぐ共有ではない。Mistral 7B v0.1はsliding windowも併用。 |
| W4 | corrected | 「MLAはK/Vをまとめて圧縮し、位置情報用のキーと一緒に保存する。」V2はDeepSeek 67B比でKV **93.3%削減**、最大生成throughput **5.76倍**と報告。V3のbf16例は **68.625 KiB/token**。 | [V2](https://arxiv.org/html/2405.04434v5)、[V3 config](https://huggingface.co/deepseek-ai/DeepSeek-V3/raw/e815299b0bcbac849fa540c768ef21845365c9eb/config.json)、[V3実装](https://github.com/deepseek-ai/DeepSeek-V3/blob/9b4e9788e4a3a731f7567338ed15d3ec549ce03b/inference/model.py) | 「latentだけ」は不完全。V2の速度は同社の測定条件付き。V3の仮想full multi-head cacheとの比は本報告の計算で、公表性能値ではない。 |
| W5 | corrected | 「V3.2-Expは参照先を選ぶDSAを導入。V4は圧縮した履歴を使うCSAとHCAを組み合わせる。」V4 **2026-04-24 preview**、Pro **1.6T／49B active**、Flash **284B／13B**、両者**1M context・MIT**。1M時のV3.2比はPro **FLOPs約27%・KV約10%**、Flash **約10%・約7%**。 | [V3.2-Exp card](https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp)、[V4 preview](https://deepseek.com/en/news/v4-preview/)、[技術報告](https://arxiv.org/html/2606.19348v1)、[Pro-0813](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813)、[Flash](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash)、[更新履歴](https://api-docs.deepseek.com/updates/) | Pro-0813は**2026-08-13 GA**、DSparkを追加した配布版は1.7T表示。本体1.6Tと区別。HCA自体はsparse選択を行わない。比率は同社の特定条件での比較。 |
| W6 | confirmed | 「MoEは、トークンごとに使うexpertを絞る。各MoE層で選ばれたexpertを計算し、その結果を合わせる。」Mixtral **46.7B／12.9B・2 of 8**、V3 **671B／37B・8 of 256＋shared 1**、gpt-oss-120b **117B／5.1B・4 of 128**。 | [Shazeer 2017](https://arxiv.org/abs/1701.06538)、[Switch](https://arxiv.org/html/2101.03961v3)、[Mixtral](https://mistral.ai/news/mixtral-of-experts/)、[V3](https://arxiv.org/html/2412.19437v2)、[gpt-oss](https://openai.com/index/introducing-gpt-oss/)、[V4](https://arxiv.org/html/2606.19348v1) | 数は総量／1 tokenでactiveとなる量。expert選択数は各MoE層あたり。V4-Proは6 of 384＋shared 1。先頭3層はhash routingなので、全層をlearned routerと断定しない。 |
| W7 | corrected | 「同じ先頭部分を次のリクエストでも再利用する。書込み料金・読出し割引・保持時間は提供元とモデルで変わる。」Anthropic **2024-08-14 beta→12-17 beta header不要**、OpenAI **2024-10-01自動適用**、Gemini explicit **2024-06-18**／implicit **2025-05-08**、DeepSeek disk cache **2024-08-02**。 | [Claude履歴](https://platform.claude.com/docs/en/release-notes/overview)、[Claude cache](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)、[OpenAI旧発表](https://openai.com/index/api-prompt-caching/)、[現行仕様](https://developers.openai.com/api/docs/guides/prompt-caching)、[Gemini履歴](https://ai.google.dev/gemini-api/docs/changelog)、[implicit発表](https://developers.googleblog.com/en/gemini-2-5-models-now-support-implicit-caching/)、[DeepSeek旧発表](https://api-docs.deepseek.com/news/news0802/)、[現行価格](https://api-docs.deepseek.com/quick_start/pricing/) | 旧OpenAIの50%・128-token刻みや、Claude一律0.1倍を現行全モデルへ流用しない。Gemini explicitは現行GenerateContent Beta。元の価格・現行条件は補足表。 |
| W8 | confirmed | 「固定の説明を先頭へ、新しい情報を末尾へ。前の内容を書き換えると、その位置より後のキャッシュは使えなくなる。」Manusの記事は**2025-07-18**、Sonnetの通常入力$3／cache read $0.30という**10倍**の価格差を紹介。 | [Claude cache](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)、[OpenAI cache](https://developers.openai.com/api/docs/guides/prompt-caching)、[Manus原文](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) | 前方の適格prefixは再利用できる場合がある。「全cacheが削除される」とはしない。最重要という評価はManus著者の経験的判断。逐語引用は補足。 |
| W9 | corrected | 「答えや道具の使い方を考えるtokenにも、出力の料金がかかる。思考の深さを選べるが、指定方法はモデルで違う。」OpenAI effort導入 **2024-12-17**、Claude 3.7 thinking budget **2025-02-24**、Claude effort **2025-11-24 public beta**。R1はSFTとRLを併用。現行V4はthinking無効／**low・high・max**、最大出力**384K**。 | [o1発表](https://openai.com/index/o1-and-new-tools-for-developers/)、[OpenAI reasoning](https://developers.openai.com/api/docs/guides/reasoning)、[Claude 3.7](https://www.anthropic.com/news/claude-3-7-sonnet)、[Claude effort](https://platform.claude.com/docs/en/build-with-claude/effort)、[Claude thinking](https://platform.claude.com/docs/en/build-with-claude/thinking)、[R1 v1](https://arxiv.org/html/2501.12948v1)、[Nature](https://doi.org/10.1038/s41586-025-09422-z)、[V4 thinking](https://api-docs.deepseek.com/guides/thinking_mode/) | 非表示でも課金対象。思考は回答前だけでなくtool間にもある。Claude 5系へ旧budget_tokensを使わない。V4 low追加は2026-08-13。384Kは思考込みの総出力上限。 |
| W10 | confirmed | 「履歴を全部使い続け、毎回ほぼ同じ量を足すと、入力tokenの累計は回数の二乗に近い増え方になる。再利用した部分は、安い読出し料金になる。」**例：20回・累計入力390,000 tokens・出力10,000 tokens**で、理想hit時Sonnet 5.5／GPT-6.1 Sol **$0.2086**、V4-Pro **$0.046882 off-peak／$0.093764 peak**。 | [Manus](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)、[Claude cache](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)、[Claude価格](https://platform.claude.com/docs/en/about-claude/pricing)、[OpenAI会話状態](https://developers.openai.com/api/docs/guides/conversation-state)、[OpenAI価格](https://developers.openai.com/api/docs/pricing)、[DeepSeek価格](https://api-docs.deepseek.com/quick_start/pricing/) | 二次増加の式・金額は本報告の独自計算。全文保持、ほぼ一定の増分、compactionなし、上限内が条件。人間のturn数でなくモデル呼出し数。実測の仕事量・品質・費用比較ではない。 |

## 必要な補足

### W1–W2：KVの機構、単位、容量の計算

Popeらは各層のattentionのkey/valueをdecode中に保持する仕組みを説明し、Kwonらは既存tokenのK/Vを再利用して新token分だけを計算することを明記する。キャッシュなしの素朴な実装ではprefixのK/Vを再計算する。ただし、新tokenの処理はQ/K/V投影だけで完了せず、保存されたK/Vを使うattentionやFFNも必要。prefillは既知の入力位置を並列処理できるという意味で、因果関係を無視するという意味ではない。[Pope](https://arxiv.org/pdf/2211.05102)、[PagedAttention](https://arxiv.org/html/2309.06180)

通常のMHA/GQAで、KとVのhead dimensionが等しい場合の非量子化payloadは次式になる。

```text
KV bytes/token = 2（KとV）× 層数 × KV head数 × head dimension × bytes/value

Llama 3.1 70B（bf16）:
head dimension = 8192 / 64 = 128
2 × 80 × 8 × 128 × 2 = 327,680 bytes = 320 KiB/token
327,680 × 131,072 = 42,949,672,960 bytes = 40 GiB

重み（全て2 bytesとして）:
70,553,706,496 × 2 = 141,107,412,992 bytes
                      ≈ 141.107 GB ≈ 131.417 GiB
```

Metaの公開台帳は80層・64 query heads・8 KV heads・dim 8192、型定義はLlama 3.1の131,072 contextとbf16形式を示す。[台帳](https://github.com/meta-llama/llama-models/blob/0e0b8c519242d5833d8c11bffc1232b77ad7f301/models/sku_list.py)、[型定義](https://github.com/meta-llama/llama-models/blob/0e0b8c519242d5833d8c11bffc1232b77ad7f301/models/sku_types.py)

標準実装には層ごとの独立cacheがあり、全prefixを参照する。この実装でsliding-window切捨てや層間KV共有は行わない。厳密なparameter数は公式HF repoのtensor集計を根拠とし、約70.6Bという丸めと整合する。[Meta実装](https://github.com/meta-llama/llama-models/blob/0e0b8c519242d5833d8c11bffc1232b77ad7f301/models/llama3/model.py)、[公式metadata](https://huggingface.co/api/models/meta-llama/Llama-3.1-70B-Instruct)

131,072は保持する入力＋生成tokenの総量の例。40 GiBにはページ余白、allocator、activations、temporary buffer、複数request、並列化に伴う複製などを含まない。BF16重みとKVだけを足して実稼働の必要memoryと断定しない。

PagedAttentionの13B例は**OPT-13B**で、`2×5120×40×2=819,200 bytes/token=800 KiB/token`。2048 tokenで`1,677,721,600 bytes=1.5625 GiB`。原文の「800 KB」「1.6 GB」はこの文脈の表記であり、厳密なSIなら約1.68 GBになる。[論文 §3](https://arxiv.org/html/2309.06180)

### W3–W4：head共有とMLAは別の縮小方法

MQA/GQAの共有は**同じ層のquery heads間**の話。GQAで群数が1ならMQA、query head数と同じならMHAになる。Llama 2は公開された全サイズがGQAではなく70Bが該当する。Mistral 7B v0.1は32 query heads・8 KV headsに加えて4096のsliding windowを持つ。[GQA §2.2](https://arxiv.org/html/2305.13245v3)、[Llama 2 Table 1](https://arxiv.org/html/2307.09288v2)、[Mistral公式config](https://huggingface.co/mistralai/Mistral-7B-v0.1/raw/main/config.json)

DeepSeek-V2の初稿は**2024-05-07**。MLAはK/Vの共同圧縮latentと、decoupled RoPE用のキーを保持する。同論文の93.3%削減・最大5.76倍はDeepSeek 67Bとのモデル比較。throughput比較は8基のH800を使う1 node、既存サービスの長さ分布に基づき、V2側はFP8重み・平均6bitのKV量子化等も用いる。単一requestの待ち時間や、MLAだけの効果を示す倍率ではない。[V2 §2.1・§3.2.3](https://arxiv.org/html/2405.04434v5)

**以下はV3の設定からの独自計算で、公表された比較スコアではない。** 1 sequence、61本の本体attention層、bf16を仮定する。[固定config](https://huggingface.co/deepseek-ai/DeepSeek-V3/raw/e815299b0bcbac849fa540c768ef21845365c9eb/config.json)、[圧縮／naive両pathの実装](https://github.com/deepseek-ai/DeepSeek-V3/blob/9b4e9788e4a3a731f7567338ed15d3ec549ce03b/inference/model.py)

| 比較対象 | 式と入力 | 1 tokenあたり |
|---|---|---:|
| MLAの圧縮cache | `(kv_lora_rank 512 + qk_rope_head_dim 64) × 61層 × 2 bytes` | **70,272 bytes = 68.625 KiB** |
| 仮想full multi-head cache | `128 heads × [K(128+64) + V(128)] × 61層 × 2 bytes` | **4,997,120 bytes = 4.765625 MiB** |

この分母に対してMLAは**1.40625%（約1/71.1）**。576要素はK/V共同latent＋位置キーなので、さらにK/Vの2倍を掛けない。仮想分母は公式naive pathと同様に位置キーもheadごとに展開する設計であり、位置キーを共有保存する別設計なら比率は変わる。MTP追加層、量子化metadata、実行時buffer等は含めない。

### W5–W6：DeepSeekの世代、公開区分、MoEの数え方

| 対象 | 確認した日付・区分 | 説明に残す条件 |
|---|---|---|
| V3.2-Exp | **2025-09-29 実験版** | DSAのlightning indexerが過去位置にscoreを付け、top-kを選ぶ。公式実装の既定kは2048。未選択KVの永久削除ではない。 |
| V3.2本版 | **2025-12-01 発表** | Expと区別する。 |
| V4 Pro／Flash | **2026-04-24 preview** | 公表contextは1M、両configは1,048,576。repoと重みはMIT。 |
| V4-Flash-0731 | **2026-07-31 API public beta** | 発表にofficial releaseという語もあるが、GAと読み替えない。 |
| V4-Pro-0813 | **2026-08-13 GA** | DSpark speculative-decoding moduleを追加。現行V4-Pro料金の適用開始は08-16 16:00 UTC。 |

出典：[更新履歴](https://api-docs.deepseek.com/updates/)、[DSA card](https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp)、[DSA実装](https://github.com/deepseek-ai/DeepSeek-V3.2-Exp/blob/main/inference/model.py)、[Pro-0813 card](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813)、[Flash License](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash/blob/main/LICENSE)。

V4のCSAはtoken方向に圧縮した後でtop-kを選び、HCAはさらに強く圧縮して使うがHCA自体のsparse選択はない。局所情報用のsliding-window branchもある。1M時のProの27%／10%は技術報告の概数。Flashは図の9.8倍少ないFLOPs・13.7倍小さいKVから約10.2%／7.3%と計算でき、画面の約10%／約7%を支持する。同報告はKVのRoPE部BF16・他FP8等を使うため、W2/W4の純bf16例との直接倍率比較にはしない。[V4技術報告 Figure 1・§2](https://arxiv.org/html/2606.19348v1)

Pro-0813 cardは本体の1.6T／49Bを維持しつつDSpark追加を明記し、Safetensors欄は1.7Tと表示する。公式repo metadataはpreviewが1,598,839,674,782、0813が1,650,497,936,906、差が51,658,262,124。この増加と丸めはDSpark追加の説明と整合するが、scale等も含み得る集計なので、差をそのまま学習可能なDSpark parameter数と断定しない。Flashにも本文284BとSafetensors 291Bの違いがある。[Pro metadata](https://huggingface.co/api/models/deepseek-ai/DeepSeek-V4-Pro)、[0813 metadata](https://huggingface.co/api/models/deepseek-ai/DeepSeek-V4-Pro-0813)、[Flash card](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash)

| MoEモデル／論文 | 初稿またはモデル公開 | 総parameters／tokenあたりactive | 各MoE層の選択 |
|---|---|---|---|
| Shazeerら sparsely-gated MoE | **2017-01-23 初稿** | 本問では特定サイズを採用しない | 疎なgating。MoE全体の発明年とはしない。 |
| Switch Transformer | **2021-01-11 初稿** | 同上 | 1 tokenを1 expertへrouteするk=1方式。 |
| Mixtral 8×7B | **2023-12-11 発表** | **46.7B／12.9B** | **8から2**。8個の独立7Bモデル全体を動かす意味ではない。 |
| DeepSeek-V3 | **2024-12-26 公開**、論文12-27 | **671B／37B** | **256 routedから8＋shared 1**。先頭3層を除くFFNがMoE。 |
| gpt-oss-120b | **2025-08-05 公開** | **117B／5.1B** | **128から4**。128は全層合計ではない。 |
| DeepSeek-V4-Pro | **2026-04-24 preview** | **1.6T／49B** | **384 routedから6＋shared 1**、61層。先頭3層はtoken IDによるhash routing。 |

出典：[Shazeer](https://arxiv.org/abs/1701.06538)、[Switch](https://arxiv.org/abs/2101.03961)、[Mixtral発表](https://mistral.ai/news/mixtral-of-experts/)、[V3論文](https://arxiv.org/html/2412.19437v2)、[V3公開履歴](https://api-docs.deepseek.com/updates/)、[gpt-oss発表](https://openai.com/index/introducing-gpt-oss/)、[V4 §4.2.1](https://arxiv.org/html/2606.19348v1)。activeが小さくても、全重みの保存容量がその数まで減るわけではない。expertを人間の「数学担当」「法律担当」へ固定対応させる説明も避ける。

### W7：provider cacheの当初と現行

#### Anthropic

通常cacheは**2024-08-14 public beta**、**2024-12-17にbeta header不要化（GA相当）**。1時間TTLのbeta header不要化は**2025-08-13**、automatic cachingは**2026-02-19導入**で別の節目。当初Claude 3.5 Sonnetは通常入力$3、write $3.75、read $0.30、output $15／MTokだった。移設された発表記事の表示年は2025になっているため、開始日は公式release notesを採用する。[Release notes](https://platform.claude.com/docs/en/release-notes/overview)、[当初発表の移設先](https://claude.com/resources/articles/prompt-caching)

現行writeは通常入力の**5分1.25倍／1時間2倍**。readは通常**0.1倍**、Fable 5.1／Mythos 5.1は**0.025倍**、Opus 5.5／Sonnet 5.5は**0.05倍**。Sonnet 5.5のreadは**2026-10-07に$0.20→$0.10/MTok**へ変更された。[Caching価格](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)、[変更履歴](https://platform.claude.com/docs/en/release-notes/overview)

現行文書の最小cache長は次のとおり。掲載されていることを、全モデルが現在first-party APIで一般利用できる保証にはしない。

| 最小token数 | モデル |
|---:|---|
| 512 | Fable 5.1、Mythos 5.1、Opus 5.5、Opus 5、Sonnet 5.5、Fable 5、Mythos 5、Haiku 5.5 |
| 1,024 | Opus 4.8、Sonnet 5、Sonnet 4.6、Sonnet 4.5、Opus 4.1、Opus 4、Sonnet 4 |
| 2,048 | Mythos Preview、Opus 4.7、Haiku 3.5 |
| 4,096 | Opus 4.6、Opus 4.5、Haiku 4.5 |

出典：[Cache limitations](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)。Bedrock等の独立条件は別途確認が必要。

`cache_control`のbreakpointはそのblockまでの全prefixが対象。明示指定は最大4個、automaticも1枠を使い、各breakpointから最大20個のblock境界を遡って保存済みentryを探す。automaticもtop-level `cache_control`の指定が必要。TTLは既定5分、指定で1時間。write/readしたrequestの**開始**から数え、再利用で更新する。最小長未満や保存境界・保持期間の不一致はhitしない。[現行仕様](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

#### OpenAI

| 論点 | 2024-10-01の発表 | 現行GPT-5.6以後、GPT-6を含む |
|---|---|---|
| 方式 | 対象モデルへ即日自動適用。cache自体をbetaとは記載せず | message境界のimplicitが既定、explicit breakpointも選択可 |
| 最小・刻み | 1,024 tokensから128-token刻み | **可視入力1,024 tokens**。hidden system分を最小長へ算入しない。適格境界の実数で、128刻みではない |
| 価格 | readは通常入力の50%。独立write割増なし | write **1.25倍**、readはGPT-6 Astra／Sol／Luna **0.1倍**、GPT-6.1 Sol **0.05倍** |
| 保持 | 無操作5–10分程度、最終利用から1時間以内に消去 | `prompt_cache_options.ttl:"30m"`。write／reuseから少なくとも30分、reuseで延長 |
| key | 現行の世代別仕様と区別する | `prompt_cache_key`は任意のaccounting分離。新世代のrouting最適化には不要 |

出典：[当初発表](https://openai.com/index/api-prompt-caching/)、[現行cache](https://developers.openai.com/api/docs/guides/prompt-caching)、[2026-09-22更新発表](https://openai.com/index/better-prompt-caching-for-gpt-6/)。当初GPT-4oの入力／read／outputは$2.50／$1.25／$10。新世代のwrite 1.25倍は当該tokenに適用する料金で、通常料金への追加1.25倍ではない。旧世代の`prompt_cache_retention: in_memory/24h`やrouting keyの説明と混ぜない。

#### Google Gemini

Explicit context cachingは**2024-05-14予告、06-18 API追加**。06-27の公式blogでもlaunch済みと紹介した。Implicitは**2025-05-08にGemini 2.5へrollout発表**、当初75%割引、最小Flash 1,024／Pro 2,048 tokensだった。[I/O予告](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-gemma-developer-updates-may-2024/)、[API履歴](https://ai.google.dev/gemini-api/docs/changelog)、[6月紹介](https://developers.googleblog.com/en/new-features-for-the-gemini-api-and-google-ai-studio/)、[implicit発表](https://developers.googleblog.com/en/gemini-2-5-models-now-support-implicit-caching/)

現行implicitは2.5以後に既定で有効。最小長は2.5 Flash／Proが**2,048**、3.8 Flash／3.6 Flash／3.1 Pro Previewが**4,096**。Interactions APIはimplicitのみ。ExplicitはGenerateContent APIの**Beta（v1beta）**で、cache objectを参照し、既定TTLは1時間。保存token数×時間の料金もある。[現行caching](https://ai.google.dev/gemini-api/docs/caching)、[GenerateContent caching](https://ai.google.dev/gemini-api/docs/generate-content/caching)

#### DeepSeek

**2024-08-02**にdisk cacheを自動提供。当初hit **$0.014**／miss **$0.14** per MTok、保管の別料金なし。当初の64-token unitを現行へ流用しない。[当初発表](https://api-docs.deepseek.com/news/news0802/)

現行cacheは、先頭から**永続化済みのunit全体**との一致が必要。`A+B`の後の`A+C`でも、Aのunitが未保存ならhitしない。共通Aを検出・保存した後なら再利用できる。構築には数秒かかる場合があり、best effortで、未使用entryは通常数時間〜数日で消去される。固定TTL保証ではない。[現行KV cache](https://api-docs.deepseek.com/guides/kv_cache/)

V4-ProはAPI ID `deepseek-v4-pro`、現行versionは0813。08-13 GA発表、**2026-08-16 16:00 UTCからpeak/off-peak料金**。Peakは**月〜金01:00–04:00・06:00–10:00 UTC、中国の祝日を除く**。それ以外・週末・中国の祝日はoff-peak。価格はW10表に示す。現行Flash欄はV4.1-Flashへ更新され、旧v4-flash名も新モデルへrouteされるため、4月のpreviewモデルと区別する。[GA発表](https://api-docs.deepseek.com/news/news260813/)、[現行Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/)

### W8：一致するprefixとManusの正確な引用

Anthropicの階層は**tools → system → messages**。既存toolsの変更は全段、既存systemの変更はsystemと後続messagesへ影響する。OpenAIも固定内容を前方、動的内容を後方へ置くよう案内する。先頭timestampを更新すれば、その位置から後は以前のprefixと一致しない。ただし、これは次のrequestでの再利用可否の話で、保存entryがすべて物理削除されるという意味ではない。[Claude](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)、[OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

現行APIには、system/tool更新やeffort変更を会話の末尾へ追加して旧prefixを保つ機能もある。これも完全一致原則に従う仕組み。top-level設定の書換えとは区別する。[Claude mid-conversation](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages)、[OpenAI更新発表](https://openai.com/index/better-prompt-caching-for-gpt-6/)

Manusの記事はYichao “Peak” Ji、**2025-07-18**。以下は原文の短い抜粋（合計23語）。第1引用は「1つ選ぶなら」という著者の実務上の見解の一部であり、普遍的な順位の証明ではない。

> KV-cache hit rate is the single most important metric for a production-stage AI agent

> Keep your prompt prefix stable.

> Make your context append-only.

出典：[Context Engineering for AI Agents: Lessons from Building Manus](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)。記事のSonnet例は通常入力$3／cached input $0.30 per MTok、10倍の単価差。現行Sonnet 5.5の$2／$0.10へ置換して記事の引用扱いにしない。全sessionの料金が10分の1になる保証でもない。

### W9：思考tokenとeffortの変遷

#### OpenAI

`reasoning_effort`のAPI導入は**o1、2024-12-17**。**2025-01-31 o3-mini**発表はlow／medium／highを明示するが、パラメータの初導入ではない。o1は当初tier 5、o3-miniはtier 3–5からの提供とされた。[o1発表](https://openai.com/index/o1-and-new-tools-for-developers/)、[o3-mini発表](https://openai.com/index/openai-o3-mini/)

| 現行モデル | APIの対応effort |
|---|---|
| GPT-6 Astra | low / medium / high / xhigh / max |
| GPT-6.1 Sol | low / medium（既定）/ high / xhigh / max |
| GPT-6 Sol、GPT-6 Luna | none / low / medium（既定）/ high / xhigh / max |

出典：[Astra](https://developers.openai.com/api/docs/models/gpt-6-astra)、[6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol)、[6 Sol](https://developers.openai.com/api/docs/models/gpt-6-sol)、[6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna)。クライアント側の設定名をAPI enumの証拠にしない。これらのページにultraは対応値として列挙されていない。

Raw reasoningは通常の可読本文として返さず、output tokensとして課金する。summaryやencrypted itemは内部思考全文の開示ではない。現在は可視出力・tool callの間にも思考し得る。effortは固定token数や料金上限ではなく、`max_output_tokens`は思考を含む総出力を制限する。[Reasoning guide](https://developers.openai.com/api/docs/guides/reasoning)

#### Anthropic

Claude 3.7 Sonnetは**2025-02-24**にextended thinkingと`budget_tokens`を導入。Effortは**Opus 4.5、2025-11-24 public beta**、**2026-02-05にbeta header不要化・Opus 4.6対応**。当初effortはlow／medium／highだった。[3.7発表](https://www.anthropic.com/news/claude-3-7-sonnet)、[Opus 4.5発表](https://www.anthropic.com/news/claude-opus-4-5)、[Release notes](https://platform.claude.com/docs/en/release-notes/overview)

Claude 5系列はadaptive thinkingが既定で、effortは**low／medium／high／xhigh／max**。Opus 5.5／Haiku 5.5は既定medium、他の対象5系列はhigh。旧`thinking.type=enabled`＋`budget_tokens`は非対応（400）。4.6ではdeprecatedながら利用可能、4.7以後は非対応。[Effort](https://platform.claude.com/docs/en/build-with-claude/effort)、[Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

| モデル | thinking無効化等の現行条件 |
|---|---|
| Opus 5.5、Fable 5／5.1、Mythos 5／5.1 | 無効化不可 |
| Opus 5 | low／medium／highならdisabled可。xhigh／maxは不可 |
| Sonnet 5 | disabled可 |
| Sonnet 5.5 | disabled不可。high以下ならbetween_tools可 |
| Haiku 5.5 | high以下ならdisabled可。xhigh／maxは不可。between_toolsは非対応 |

出典：[Thinking設定表](https://platform.claude.com/docs/en/build-with-claude/thinking)。5系列のthinking表示は既定omittedで、summarizedなら要約が見える。非表示でも思考の課金は発生し、`max_tokens`は思考＋最終応答の総量を制限する。

#### DeepSeek

R1は**2025-01-20公開、arXiv初稿01-22、Nature online 09-17**。コードと本体重みはMITで、蒸留Llama／Qwenの元licenseとは区別する。**R1-Zero**は事前学習済みモデルへ初期SFTなしでRLを適用。**R1**はcold-start SFT、reasoning RL、rejection sampling＋SFT、追加RLを組み合わせる。「R1はすべてRLだけ」「全学習の大半がRL」といった量的断定はしない。生成した推論文を読めることと、内部計算の忠実な全記録であることも別。[公開発表（先行報告から再引用）](https://api-docs.deepseek.com/news/news250120/)、[原論文v1](https://arxiv.org/html/2501.12948v1)、[Nature版](https://doi.org/10.1038/s41586-025-09422-z)、[License](https://github.com/deepseek-ai/DeepSeek-R1)

V4は4月previewでthinking／non-thinkingを提供し、**2026-08-13にlowを追加**。現行は無効、またはlow／high／max、既定はthinking enabled・high。Chat Completionsでは`thinking.type=disabled`またはreference記載の`reasoning_effort=none`で無効化し、Responses形式は`reasoning.effort=none/low/high/max`。互換値のminimal等を独立した深さとして数えない。[Preview](https://deepseek.com/en/news/v4-preview/)、[GA発表](https://api-docs.deepseek.com/news/news260813/)、[Thinking guide](https://api-docs.deepseek.com/guides/thinking_mode/)、[API reference](https://api-docs.deepseek.com/api/create-chat-completion/)

現行最大出力は**384K＝393,216 tokens**で思考を含む。既定はnon-thinking 8K、thinking 64K、max effort 128K。入力＋生成はcontext上限にも制約される。toolありでは過去turnの`reasoning_content`再送が必要という現行条件もあるため、思考を常に次turnで捨てる説明は避ける。[API reference](https://api-docs.deepseek.com/api/create-chat-completion/)、[Thinking guide](https://api-docs.deepseek.com/guides/thinking_mode/)

### W10：長いsessionの式と「例」付き料金

初回入力をP、各request間に増える入力を一定g、モデル呼出し回数をnとすると、次のように計算できる。

```text
t回目の入力: I_t = P + (t−1)g
累計入力:    I = nP + g n(n−1)/2

前回のprefix全体に毎回hitする理想例:
新規write総量 W = P + (n−1)g
cache read総量 R = I−W = (n−1)P + g(n−1)(n−2)/2
```

これは**本報告の導出**。Manusは行動・観察を次の入力へ追加するloop、Claude文書は過去prefixのreadと新規末尾のwriteを説明しており、式の前提を支持する。全文保持、一定増分、compaction／truncationなし、context上限以内という条件がある。可変増分なら`I = nP + Σ(k=1..n−1)(n−k)g_k`。read総量にも二次項が残るため、正のread単価なら費用も自動的に線形にはならない。[Manus](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)、[Claude multi-turn caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

OpenAIの`previous_response_id`でもchainの過去入力はinput課金対象。HTTP本文で履歴を送り直さなくてよいことと、モデル入力・課金から過去履歴が消えることは別である。このため画面では「全履歴を毎回**使う**」がより安全。[Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)

**価格はUSD／100万tokens、2026-10-10取得。** First-party、通常同期API、global／Standard相当のtoken従量部分。

| モデル／条件 | 通常入力 | cache write | cache read | output |
|---|---:|---:|---:|---:|
| Claude Sonnet 5.5 | $2 | 5分 $2.50／1時間 $4 | $0.10 | $10 |
| GPT-6.1 Sol、入力272K以下 | $2 | 30分 $2.50 | $0.10 | $10 |
| DeepSeek-V4-Pro、off-peak | $0.66 | 追加write料なし（miss課金） | $0.022 | $1.98 |
| DeepSeek-V4-Pro、peak | $1.32 | 追加write料なし（miss課金） | $0.044 | $3.96 |

出典：[Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing)、[Claude cache](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)、[OpenAI pricing](https://developers.openai.com/api/docs/pricing)、[GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol)、[DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/)。

Sonnet 5.5は1M context全域でこの標準単価。GPT-6.1 Solは入力272Kを超えると**request全体**の入力・cacheが2倍、outputが1.5倍になる（$4／$5／$0.20／$15）。Batch・優先速度・地域指定・tools・storage・外部サービス・税等はこの例に含めない。

**例：架空の20回。** `n=20, P=10,000, g=1,000`、毎回の課金対象outputを思考込み500 tokensと仮定する。入力は10,000→29,000、累計I=390,000、新規W/miss=29,000、read R=361,000、output O=10,000。gは保持する出力と新入力・tool結果等を合わせた増分で、思考を含む全出力が次回入力へ必ず戻るという仮定ではない。

最低長、保存境界、lookback、cache構築、保持時間を満たし、毎回前回の入力全体にhitすると仮定する。最終20回目のwrite料金も含む。DeepSeekは全requestが同じ時間区分内で終わるものとする。

| 例のモデル／条件 | 計算（最後に1,000,000で割る） | 合計 |
|---|---|---:|
| Sonnet 5.5、5分 | `29,000×2.50 + 361,000×0.10 + 10,000×10` | **$0.2086** |
| Sonnet 5.5、1時間 | `29,000×4 + 361,000×0.10 + 10,000×10` | **$0.2521** |
| GPT-6.1 Sol、30分 | `29,000×2.50 + 361,000×0.10 + 10,000×10` | **$0.2086** |
| V4-Pro、off-peak | `29,000×0.66 + 361,000×0.022 + 10,000×1.98` | **$0.046882** |
| V4-Pro、peak | `29,000×1.32 + 361,000×0.044 + 10,000×3.96` | **$0.093764** |

通常入力・write・readは重複しない入力区分。総入力の通常料金にwrite/readを上乗せして二重計上しない。一般には`[(I−R−W)p_in + Wp_write + Rp_read + Op_out]/10^6`、DeepSeekは`[(I−R)p_miss + Rp_hit + Op_out]/10^6`になる。各社でtokenizerや思考量が違うため、同じ数値予算は同じ文章量・品質・仕事量を意味しない。金額は実測値や実sessionの予算保証ではない。

## 不確実性と調査計画の変遷

初期の8単元（KV基礎、attention variants、DeepSeek/MoE、Anthropic、OpenAI、Google/DeepSeek API、session計算、横断照合）は完了した。問いの中心は変わっていないが、調査で見つかった差を7回の計画追記で反映した。

- **今回追究した派生問い**：HFのLlama configが401だったため、Metaの公開台帳・型定義・実装へ照合先を追加し、必要な値を確認した。Sonnet 5.5の10月値下げ、GPT-6.1 Solのcache世代差、DeepSeekのpeak条件・現行aliasを料金例へ反映した。FlashのMITとHaiku 5.5のthinking条件も最終監査で直接確認した。
- **未確定のまま分離した点**：HF config.json自体の直読、V4の配布tensor集計差の全内訳、V4論文のarXiv番号と表示日付の不整合、o1初日enumの歴史archive。必須のLlama数値は別の公式一次資料で確認でき、V4公開日は公式発表、effort導入日はo1発表、low／medium／highの明示列挙はo3-mini発表に基づくため、これらを推測で補わず回答できる。
- **延期した派生問い**：V4.1のattention詳細、DSparkとFlash追加tensorの厳密なparameter監査、全SDK移行、全cloud互換性、DeepSeekの祝日一覧と時間境界を跨ぐrequestの課金時点、実hit率と品質を揃えた費用測定。これらは画面用fact-checkを越えるため別調査とした。

## 推奨する次の行動

1. W4・W5・W7・W9を上表の文言へ修正し、W2/W4の計算条件とW10の「例」を画面・READMEへ明記する。容量のGB/GiB、KV量と総重み、throughputとlatencyを分ける。
2. API価格・effort・cache表には**2026-10-10確認**とモデルIDを残す。公開直前に価格ページを再確認し、過去の発表値は日付付きで保持する。
3. 実予算が必要になった段階で、小さな上限付きsessionのusageから通常入力・write・read・思考込みoutputを測る。DeepSeekで時間境界や祝日が重要なら、その請求条件を確認する。モデル間の品質当たり費用比較は、この架空例から結論を出さず別途評価する。
