# 「次の言葉の予測」から「穴埋め」へ：語りの事実確認

## 要約と判定方法

**「穴埋め」は、自己回帰型、BERT、T5、マスク型拡散をつなぐ導入の見方として使える。ただし、言語モデル全般の定義にはしない。** 拡散型にも、穴ではなく連続ベクトルやランダムなトークンから文章を作るものがある。gを「穴に入る言葉を予測するものとして見てみましょう」、5を「拡散型と呼ばれる作り方の一つ」とすれば、説明の射程が明確になる。[BERT（S2）](https://aclanthology.org/N19-1423.pdf)、[T5（S3）](https://jmlr.org/papers/volume21/20-074/20-074.pdf)、[Diffusion-LM（S10）](https://arxiv.org/pdf/2205.14217v1)、[DiffusionGemma（S18）](https://ai.google.dev/gemma/docs/diffusiongemma/explained)

**上下二段の絵は維持できる。** 上段を自己回帰型の基本の生成手順、下段をマスク型拡散の一例とする。下段は「各段階で残すと決めた語だけを表示する」条件なら、一度出した語を消す動きを追加する必要はない。全拡散型やMercury・Gemini Diffusionの内部再現としては示せない。[LLaDA論文・公式コード（S5・S6）](https://arxiv.org/html/2502.09992v3)、[Dream-v0公式コード（S9）](https://huggingface.co/Dream-org/Dream-v0-Instruct-7B/blob/05334cb9faaf763692dcf9d8737c642be2b2a6ae/generation_utils.py)

**「いま主流」は「広く使われている」への言い換えを勧める。** 主要系列の公表資料と利用実績を合わせた定性的判断はできるが、最新の全製品の内部方式や、世界全体の方式別シェアは確認できない。自己回帰型でも複数トークンを並列に検証できるので、「前から順に」は生成の依存関係を表し、物理的な計算が毎回一語だけという意味にはしない。[Claude公式説明（S22）](https://platform.claude.com/docs/en/about-claude/glossary)、[利用調査（S32）](https://arxiv.org/html/2601.10088v1)、[推測的デコード（S37）](https://proceedings.mlr.press/v202/leviathan23a/leviathan23a.pdf)

対象は依頼時の「言語モデル」g・i・i2・j・qと「文章を組み立てる」1〜6の計11文、および上下の絵。**基準日・外部資料の取得日は2026-10-14 UTC**。公開日・版の日付は別に記載する。日付表示のない公式ページは取得時点の説明として使い、過去の提供開始日の証拠にはしない。S番号は今回の[調査ログ](log.md)と共通で、[既存の導入調査](../intro-facts/report.md)のS番号とは別である。

判定は「言える」「限定すれば言える」「言えない」。問いや教材の範囲宣言は技術的命題と区別した。言い換えは事実として言える範囲を示す案で、文面・絵・音声の実装ではない。研究用の2ファイル以外は変更せず、モデル実行、APIによる生成、音声合成、ブラウザでの見た目・動作確認も行っていない。

## C1〜C6の判定表

| 項目 | 判定 | 条件と短い案 | 主な根拠 |
|---|---|---|---|
| C1 穴埋めによる一般説明 | **限定すれば言える** | 共通の直観として使う。唯一の一般定義にはしない。「文章の穴に入る言葉を予測するものとして見てみましょう」 | S1〜S10、S18・S20 |
| C2 候補の数字、文末の穴 | **限定すれば言える** | 数字は候補の確率。自己回帰型の手がかりは既にある文脈。「手がかりになる言葉を見て」「いまある文章の先の穴」 | S1〜S3、S5 |
| C3 主流と「前から順に」 | **限定すれば言える** | 主要系列と利用実績に基づく定性的判断。全最新版・世界の過半数は未確認。「広く使われているのは、前から順に書く作り方よ」 | S21〜S35、S37・S38 |
| C4 穴を減らす方式を拡散型と呼ぶ | **限定すれば言える** | マスク型の例。「拡散型と呼ばれる作り方の一つよ」。「すべて」「多く」は支持しない | S5〜S20 |
| C5 一度埋めた所を変えない絵 | **限定すれば言える** | マスク型の特定手順で、選別後の状態だけ示す例なら成立。全拡散型・特定商用モデルの内部再現としては**言えない** | S5・S6・S8・S9・S11・S14・S18 |
| C6 反復生成と後続の限定 | **文1は限定すれば言える／文6は言える** | 生成には候補の選択・更新位置・終了の手順が要る。後続を前から書く型へ限定する宣言は妥当 | S1・S5・S7・S37・S39、後続クリップ |

## 根拠と条件

### C1：一般定義と、説明のための「穴」

列全体の確率を考える古典的な確率言語モデルでも、連鎖律によって、先行する語を条件とする次語の確率の積へ分解できる。この意味で「まだ分からない次の位置」を穴に見立てられる。ただし、数学的な分解、訓練課題、実際の生成アルゴリズムは同じものではない。[Bengio et al. §1–2（S1）](https://jmlr.org/papers/volume3/bengio03a/bengio03a.pdf)

| 型・例 | 穴埋めという見方との対応 | 制作メモに残す限界 |
|---|---|---|
| 古典的な確率言語モデル | 列確率を次語の条件付き確率へ分解できる | 穴は数学的定義の必須要素ではない。連鎖律だけで計算順序は決まらない（S1） |
| 自己回帰型 | 既にある列のすぐ次を、末尾の穴に見立てられる | 通常のdecoderが毎回実際のマスク記号を加えるという意味ではない（S1・S37） |
| BERTのマスク言語モデル | 隠した位置のトークンを文脈から予測する | 穴は途中に限らず複数でもよい。BERTの全用途が穴埋めではない（S2） |
| T5のスパン復元 | 連続した欠損部分を一つの印で示し、内容を復元する | 一つの穴は複数トークンを表せる。復元の出力列は自己回帰的に生成する（S3） |
| LLaDA・Dreamのマスク型拡散 | マスクされた複数位置を反復的に復元する | 予測候補をどれだけ残すか、どの位置から埋めるかという手順を伴う（S5〜S9） |
| Diffusion-LM | 連続ベクトルのノイズを減らして語へ写す | 穴の位置を埋めるという実装の説明には収まらない（S10） |
| DiffusionGemma | ランダムな語彙トークンから反復的に復元する | 明示的なマスクを使わない離散拡散。離散型をすべて穴埋めと呼べない（S18・S20） |

**BERTを「マスク言語モデル」と呼んでよい。** 原論文がその呼称と、文脈から隠した語彙IDを予測する目的を明示している。一方、「BERTは列全体の確率を定義しない」という批判も言い切りすぎになる。通常のBERTが出す各位置の分布から、自己回帰型と同じ形の正規化済み列尤度がそのまま得られるわけではない、という限定が適切。位置を一つずつ隠して得る列スコアは擬似尤度であり、別の正規化や生成手順を導入する研究まで否定しない。[BERT §3.1（S2）](https://aclanthology.org/N19-1423.pdf)、[Masked Language Model Scoring §2・Appendix B（S4）](https://aclanthology.org/2020.acl-main.240.pdf)

gでは「言語モデルは穴埋めをするもの」と定義するより、**「言語モデルを、文章の穴に入る言葉を予測するものとして見てみましょう」**がよい。前半の「決まりの重なりが、言語の構造」は、穴埋めへの変更とは別に、既存N4に従って「こうした結び付きも、言語の構造の一つ」と限定する。

### C2：「まわり」「確率」「文の終わり」

iの説明は、候補に付ける数字が正規化された確率である設定なら使える。任意の点数やlogitをそのまま確率とは呼ばない。複数の穴の各位置に対する分布と、文章全体の確率も区別する。図の語句と数字は実モデルのトークン分布を測定した結果ではなく、説明用の例とする。[Bengio et al. §2（S1）](https://jmlr.org/papers/volume3/bengio03a/bengio03a.pdf)、[BERT §3.1（S2）](https://aclanthology.org/N19-1423.pdf)

「まわり」は左右両側を見るとの印象を与えうる。共通の説明では**「手がかりになる言葉を見て」**、自己回帰の場面では「ここまでの言葉を手がかりに」が使える。i2で初めて確率と名付ける構成を保つなら、iの後半は原文の「ありそうな度合いを数字で付けるの」を残せる。

jの「文の終わり」は、完成した文の句点後ではなく、書きかけの列のすぐ次を指すと明瞭になる。ただし末尾に穴が並んでいるだけでは自己回帰型とは決まらない。全マスクの応答を用意する拡散型もあるため、次の位置を予測して文脈へ足す手順まで説明する。[LLaDA §2.4（S5）](https://arxiv.org/html/2502.09992v3)

> jの案：いまある文章の先の穴を埋めるのが、次の言葉の予測よ。

### C3：2026年10月の「主流」と、順序の意味

主要系列に自己回帰型・次トークン予測の公表資料があり、その系列が広く使われていることも一次集計で確認できる。これらを合わせた**本調査の定性的判断**として、「前から順に書く作り方が広く使われている」は支持される。古い世代の論文を最新全モデルの仕様として扱うことや、評価順位を利用率に読み替えることはできない。

| 系列 | 確認した公表範囲 | 判断の限界 |
|---|---|---|
| GPT | GPT-4技術報告は次トークン予測の事前学習を明記（S21） | 取得時の公式一覧にはGPT-6系列等もあり、GPT-4を最新とは呼べない。最新全IDの生成方式は一覧から確認できない（S35） |
| Claude | 公式GlossaryがClaudeの基盤を自己回帰言語モデルと明記（S22） | 系列の公式一般説明であり、各モデルIDの詳細仕様をすべて検証したわけではない |
| Gemini | 1.0はdecoder-only、2.5は教師の次トークン分布による蒸留を記載（S23・S24） | 3.7から参照をたどった構造説明はMoE transformerまで。causal maskや生成順序の直接確認にはならない（S33・S34）。Gemini Diffusionも別に存在する |
| Llama | Llama 4 Scout/Maverickのモデルカードが自己回帰型と明記（S25） | 確認対象は同カードのモデル |
| Qwen | Qwen3とQwen3.5のカードがcausal language modelと明記。公式概念集も次トークン生成を説明（S26〜S28） | 他の全世代へ個別確認なしで広げない。thinkingモードの有無とは別の分類 |
| DeepSeek | V3は次トークン予測と因果鎖を保つMTPを記述。V4カードはMTP戦略の継承を記載（S29・S30） | V4.1を含む最新全版の推論コードを検証したわけではない |

OpenRouterの週次ランキングは**2026-10-13までの同プラットフォーム内の利用**で、主要系列へのトラフィックを確認できる。別の100兆トークン調査は**2024-11〜2025-11**の観測で、公開モデル系列の広い利用を支える。いずれも世界の無作為標本ではなく、社内利用・ローカル実行などを含まない。著者別リクエスト比率を方式別シェアへ変換せず、過去のトークン集計を2026年10月の比率として使わない。[ランキング（S31）](https://openrouter.ai/rankings?view=week)、[調査・§10 Limitations（S32）](https://arxiv.org/html/2601.10088v1)

**推測的デコードは「前から順に」の意味を限定するが、自己回帰的な依存関係を壊さない。** 小さいモデルなどが複数の先の候補を提案し、大きい対象モデルがまとめて検証できる。S37の正確な受理・補正手順では対象モデルと同じ分布から生成でき、受理する接頭辞を前から延ばす。一回の対象モデル計算で複数トークンを得られるため、「一語ごとに必ず一回計算する」とは説明しない。[Leviathan et al. §2・Algorithm 1（S37）](https://proceedings.mlr.press/v202/leviathan23a/leviathan23a.pdf)

複数トークン予測（MTP）も、訓練目標だけで推論方式を一意に決めない。S38の独立head方式とDeepSeek-V3の因果鎖を持つ方式は異なり、いずれも通常の次トークン推論と推測的な高速化を区別している。「MTPなら非自己回帰」「予測した複数候補を必ずそのまま出す」とは言えない。[Gloeckle et al. §2（S38）](https://arxiv.org/html/2404.19737v1)、[DeepSeek-V3 §2.2（S29）](https://arxiv.org/html/2412.19437v2)

> 文2の案：広く使われているのは、前から順に書く作り方よ。

「いま主流」を残す場合は、制作メモに「2026-10-14時点、主要系列の公表資料と利用集計を合わせた定性的説明。全LLM・全最新版の構造を保証するものではない」と残す。

### C4：マスク型拡散と、それ以外の拡散

| モデル・方式 | 公表されたノイズと生成 | 穴が減る図との対応 |
|---|---|---|
| LLaDA | マスクされた応答から反復復元。ブロック内を拡散、ブロック間を自己回帰にする選択肢もある（S5・S6） | 特定の生成設定の例として対応する |
| Dream 7B | マスクを吸収状態とする離散拡散。全体の文脈で予測する（S7・S8） | マスク型の例として対応。確定済み位置を保持するコードの直接確認は先行Dream-v0の標準samplingに限定（S9） |
| Diffusion-LM | Gaussianベクトル列からノイズを減らし、語のベクトルへ近づける（S10） | 穴を埋める図は実装を表さない |
| DiffusionGemma | 明示的なマスクではなく、語彙から取ったランダムトークンを使う離散拡散。再ノイズ化とブロック処理を説明（S18・S20） | 穴が減るだけの図では、その方式の全手順を表せない |
| Mercury | 技術報告はトークン列上のノイズと並列反復更新を記述。具体的な遷移核、マスクの有無は未確定（S11）。Mercury 2・2.5の公式発表もその点を確定しない（S16・S17） | 特定の内部再現として示す根拠が足りない |
| Gemini Diffusion | 公式発表はノイズを反復的に改善し、ブロック単位で生成・途中修正すると説明。ノイズの種類・マスクの有無・確定条件は未確定（S14・S15） | 同上。DiffusionGemmaの仕様を代用しない（S19） |

「ノイズ」と書かれているだけで連続値型とは決まらない。マスクも離散ノイズの一種であり、ランダムな語彙への置換もある。また、連続時間の拡散だからデータも連続値だ、とは言えない。[Dream §3（S7）](https://arxiv.org/html/2508.15487v1)、[DiffusionGemma “Uniform State Diffusion”（S18）](https://ai.google.dev/gemma/docs/diffusiongemma/explained)

文4・5は**「拡散型の一つ」**への限定が適切。「拡散型の多く」には母集団と件数の根拠がなく、今回の調査では勧めない。「下書き」は全マスクの応答を見せる比喩で、先に別のモデルで文章を書かなければならないという意味にはしない。

> 文4・5の案：穴だらけの下書きから、何か所かずつ埋める作り方もあるの。これは、拡散型と呼ばれる作り方の一つよ。

### C5：remaskingと、絵で表示する状態

**仮候補を穴へ戻す操作と、前の段階で残すと決めた語を再編集する操作を区別する。** LLaDAの説明には、穴全部に候補を予測し、一部を再マスクする手順がある。一方、確認した公式コードは更新対象を現在のマスク位置に絞り、既存トークンを保持する。仮候補を画面へ出さず、選別後の状態だけ見せれば、穴が減るだけの図になる。[LLaDA §2.4・Appendix A.1（S5）](https://arxiv.org/html/2502.09992v3)、[generate.py L125–181（S6）](https://github.com/ML-GSAI/LLaDA/blob/f2683fd9cd10721f2853bafa52f8572ae8155d0c/generate.py)

Dream-v0の標準samplingも現在のマスク位置のみを変更する。したがって、remaskingという語があることだけを理由に、既に表示した語を必ず消すアニメーションを追加する必要はない。ただし、これは全方式への保証ではない。DiffusionGemmaは、後の文脈によって確信が下がった位置の再ノイズ化を明示する。[Dream-v0 `_sample`（S9）](https://huggingface.co/Dream-org/Dream-v0-Instruct-7B/blob/05334cb9faaf763692dcf9d8737c642be2b2a6ae/generation_utils.py)、[DiffusionGemma（S18）](https://ai.google.dev/gemma/docs/diffusiongemma/explained)

「ばらばらの順」は**「前からとは限らない順」**の意味なら使える。順序を確信度で選ぶ手順もあり、常に一様ランダムではない。ブロック間を左から進める方式もあるので、「拡散型は絶対に前から書かない」「常に文章全体を同時に完成させる」へ広げない。[Dream README（S8）](https://github.com/DreamLM/Dream/blob/fd91b8f1d47c5cbe4a8a1674fd9b98045e79d9db/README.md)、[LLaDA Appendix B.4（S5）](https://arxiv.org/html/2502.09992v3)

絵の扱いは次の条件で足りる。

- 上段の札は「前から順に書く型」または「自己回帰型」。基本の逐次生成の例とする。
- 下段の札は「拡散型の一例」または「穴を埋める拡散型」。制作メモに「各段階で残すと決めた語だけを表示」と残す。
- 共通の「例」の札と、実際の単位はトークンである注を保つ。一枚の語句カードを一トークン、一回のモデル計算と同一視しない。
- 同じ完成文、穴の数・幅、語句の区切り、埋まる順・間隔は説明用に決めたもの。二方式の出力一致や速度差を測った結果ではない。
- 下段へMercuryやGemini Diffusionの名前を添えて、その内部を再現した図にしない。

### C6：穴埋めから文章へ、後続の説明範囲

候補に確率を付けることだけで文章は完成しない。何を選び、どの位置を更新し、いつ終了するかという生成手順が必要になる。BERTにも別途の反復生成手順を組み合わせた研究はあるが、どんな穴埋め器でも反復すれば良質な文章を保証できるという意味ではない。[BERTによる生成研究 §3（S39）](https://aclanthology.org/W19-2304.pdf)

> 文1の案：穴に入る言葉を選び、予測を重ねると、文章を作れるの。作り方は、一つではないわ。

文3の「また穴を開ける」は未知の次位置を示す比喩として成立する。実際の自己回帰decoderにマスク記号を追加するとの誤解を避けるなら、**「終わりの穴を埋めたら、今度はその先の言葉を予測するの」**とできる。

文6の「この先は、前から順に書く型を追っていくのよ」は**そのまま言える**。教材の範囲宣言であり、LLM全般の定義ではない。確認した後続の[route.js](../../decks/llm/clips/route.js)、[predict.js](../../decks/llm/clips/predict.js)、[pretrain.js](../../decks/llm/clips/pretrain.js)の説明とも整合する。後続を単独で共有する場合、この限定が伝わるかは制作時に点検する。

qは問いとして言える。gを説明上の見方に限定した場合は、「穴に入る言葉を予測する、という見方はわかったのだ」と揃える。AI能力の原因や歴史について、この問いだけで新しい断定を加えたことにはしない。

## 全11文の判定と言い換え案

| 文 | 依頼原稿の要点 | 判定 | 短い案 |
|---|---|---|---|
| g | 決まりの重なりが構造。モデルはそれをまねて穴を予測 | 限定すれば言える | こうした結び付きも、言語の構造の一つ。言語モデルを、文章の穴に入る言葉を予測するものとして見てみましょう。 |
| i | まわりの言葉から候補に数字を付ける | 限定すれば言える | 手がかりになる言葉を見て、穴に入る候補のそれぞれに、ありそうな度合いを数字で付けるの。 |
| i2 | この数字が、確率よ | 言える（確率を描く設定で） | 原文維持可。任意のスコアではなく、説明用の確率とする。 |
| j | 穴が文の終わりなら次の言葉の予測 | 限定すれば言える | いまある文章の先の穴を埋めるのが、次の言葉の予測よ。 |
| q | 穴埋めがどうしてAIの話になるか | 言える（問いとして） | 穴に入る言葉を予測する、という見方はわかったのだ。でも、それがどうして AI の話になるのだ？ |
| 1 | 穴埋めを重ねれば文章を作れる | 限定すれば言える | 穴に入る言葉を選び、予測を重ねると、文章を作れるの。作り方は、一つではないわ。 |
| 2 | いま主流のLLMは前から順に書く | 限定すれば言える | 広く使われているのは、前から順に書く作り方よ。 |
| 3 | 終わりを埋め、その先に穴を開ける | 限定すれば言える | 終わりの穴を埋めたら、今度はその先の言葉を予測するの。 |
| 4 | 穴だらけの下書きから全体を埋める | 限定すれば言える | 穴だらけの下書きから、何か所かずつ埋める作り方もあるの。 |
| 5 | こちらは拡散型と呼ばれる | 限定すれば言える | これは、拡散型と呼ばれる作り方の一つよ。 |
| 6 | この先は前から順に書く型を追う | 言える | 原文維持可。 |

## 不確実性と、問い・計画の展開

原問いは最後まで「この11文と絵が事実としてどこまで言えるか」で維持した。六つの調査単位を完了し、次の派生質問を必要な範囲で追究した。

| 派生質問 | 判断・計画の変更 | 結果 |
|---|---|---|
| remaskingは表示した語の取り消しを必ず意味するか | Unit 2・3へ候補と確定状態の区別を追加 | 必ずしも意味しない。表示する状態を決めれば既存の絵が成立 |
| 離散拡散はすべてマスク型か | Unit 3へDiffusionGemmaを追加 | 否。ランダム語彙ノイズを比較表に追加 |
| 最新全モデルの構造と世界シェアまで必要か | Unit 4で網羅調査を追加しないと判断 | 原稿の判定は定性的証拠と限界の明記で可能 |
| 候補の分布を出すことと文章を生成することは同じか | Unit 5へBERTの反復生成研究を追加 | 選択・更新・終了の手順が別に必要 |

残る不確実性は、Mercury・Gemini Diffusionの厳密なノイズ核と確定後の再編集規則、最新全商用モデルIDの生成方式、世界全体の方式別利用率である。これらを推測で埋めなくても、上記の限定付き原稿と絵は成立する。

各商用APIでの高速化の本番採否、全デッキを単独閲覧した場合の限定の伝わり方、一般BERTの条件分布の整合性についての完全な数学的証明は今回の範囲から外した。特にS39は生成手順の実例にのみ用い、同論文のMRF解釈を無条件の定理として採用していない。S4 Appendix Bの留保を優先する。

## 推奨する次の作業

1. gを「穴埋めという見方」に、5と下段の札を「拡散型の一例」に限定する。2は「広く使われている」へ変更する。
2. 制作メモへ、穴は未知位置の比喩であること、下段は選別後の状態だけを見せること、語句・数字・順序・間隔は説明用の例であることを残す。
3. i・i2の確率の数値・丸め・棒の表示を照合する。ローカル実装では描画値とラベルが別に指定されているため、事実説明と表示の一致は制作側で確かめる。g前半も既存N4と揃える。
4. 後続のクリップを単独で見せる箇所では、自己回帰型への限定が読み取れるか確認する。実製品の内部手順や速度を描く場合は、その時点の個別仕様を改めて調べる。

## 出典・所在・短い原文引用

**以下はすべて2026-10-14 UTC取得。** 各項目の年月日は資料の公開日・版日付またはコードのcommit日で、取得日とは異なる。日付固定の論文・コードを優先し、日付不明の公式文書は取得時点の説明として扱った。引用は資料ごとに25語以内に収め、同じ引用を本文で重複掲載していない。補助資料は引用を追加せず、確認した範囲を記す。

### 定義、マスク、スパン、列確率

- **S1 — Bengio et al. (2003), [A Neural Probabilistic Language Model](https://jmlr.org/papers/volume3/bengio03a/bengio03a.pdf)**。JMLR 3:1137–1155。Abstract p.1137、§1 p.1138、§2 pp.1141–1142。引用：“learn the joint probability function of sequences of words in a language”。列確率、連鎖律、語彙上のsoftmaxの根拠。
- **S2 — Devlin et al. (2019), [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://aclanthology.org/N19-1423.pdf)**。§1 pp.4171–4172、§3 p.4173、§3.1 p.4174。引用：“masked language model”; “predict the original vocabulary id of the masked word based only on its context.”。MLMの呼称・文脈・語彙ID予測を確認。
- **S3 — Raffel et al. (2020), [Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://jmlr.org/papers/volume21/20-074/20-074.pdf)**。§2.1 pp.4–5、§3.1.4 pp.12–13、Figure 2。引用：“All consecutive spans of dropped-out tokens are replaced by a single sentinel token.” / “which only allows the model to attend to past outputs.”。スパンの印とdecoderの因果的な注意を確認。
- **S4 — Salazar et al. (2020), [Masked Language Model Scoring](https://aclanthology.org/2020.acl-main.240.pdf)**。Abstract、§2.1–2.2 p.2700、Appendix B p.2711。引用：“pseudo-log-likelihood scores (PLLs), which are computed by masking tokens one by one.”。擬似尤度と、結合分布・条件分布の扱いへの留保。

### マスク型と連続値型の論文・公式コード

- **S5 — Nie et al., [Large Language Diffusion Models](https://arxiv.org/html/2502.09992v3)**。arXiv:2502.09992v3、2025-10-18。§2.1、§2.4、Appendix A.1 Eq.(10)・Algorithm 4、B.4 Figure 4、B.6 Figure 5。引用：“starting from a fully masked response”; “Block diffusion sampling applies the origin reverse process within each block and the autoregressive sampling across blocks.”。Algorithm 5の個数表記には不整合が見えるため、保持の判断はEq.(10)・Algorithm 4・S6に依拠した。
- **S6 — ML-GSAI, [LLaDA/generate.py](https://github.com/ML-GSAI/LLaDA/blob/f2683fd9cd10721f2853bafa52f8572ae8155d0c/generate.py)**。commit `f2683fd9cd10721f2853bafa52f8572ae8155d0c`、2026-07-12。`generate` L125–181、`var_generate` L185–208。引用：`x0 = torch.where(mask_index, x0, x)`（L174）。現在のマスク位置を選別対象とすること、ブロック生成を確認。
- **S7 — Ye et al., [Dream 7B: Diffusion Large Language Models](https://arxiv.org/html/2508.15487v1)**。arXiv:2508.15487v1、2025-08-21。§3 Eq.(2)/(3)、§4.1、§4.3、Table 1。引用：“We employ discrete diffusion with absorbing states”; “progressive full-context prediction”。マスクを使う離散拡散の根拠。
- **S8 — DreamLM, [Dream README](https://github.com/DreamLM/Dream/blob/fd91b8f1d47c5cbe4a8a1674fd9b98045e79d9db/README.md)**。commit `fd91b8f1d47c5cbe4a8a1674fd9b98045e79d9db`、2025-09-26。“Parameters of diffusion_generate()”。引用：“The remasking strategy in diffusion sampling, controlling the token generation order.”。ランダム以外の確信度等による順序を確認。
- **S9 — Dream-org, [Dream-v0-Instruct-7B/generation_utils.py](https://huggingface.co/Dream-org/Dream-v0-Instruct-7B/blob/05334cb9faaf763692dcf9d8737c642be2b2a6ae/generation_utils.py)**。SHA `05334cb9faaf763692dcf9d8737c642be2b2a6ae`、モデルAPIの最終更新2025-07-15。`DreamGenerationMixin._sample`、web表示L567–667。引用：`mask_index = (x == mask_token_id)`。ユーザー定義hookを使わない標準分岐で、現在のマスク位置のみ更新することを確認。S7と同一版とは扱わない。
- **S10 — Li et al., [Diffusion-LM Improves Controllable Text Generation](https://arxiv.org/pdf/2205.14217v1)**。arXiv:2205.14217v1、2022-05-27。Abstract p.1、Figure 1 p.2、§3 pp.3–4、§4.1–4.2 pp.4–5。引用：“Diffusion-LM iteratively denoises a sequence of Gaussian vectors into word vectors”。取得PDFのv1表示を確認し、ここでは版付きURLを示す。

### 商用拡散と、マスク以外の離散拡散

- **S11 — Khanna et al., [Mercury: Ultra-Fast Language Models Based on Diffusion](https://arxiv.org/html/2506.17298v1)**。arXiv:2506.17298v1、2025-06-17。Abstract、§1、§2.1 Training/Architecture、§2.2 Serving。引用：“trained to predict multiple tokens in parallel”; “modifying multiple tokens in parallel”。トークン列上の逆過程は記述されるが、具体的ノイズ核は特定されない。
- **S12 — Inception, [Introducing Mercury, the World’s First Commercial-Scale Diffusion Large Language Model](https://www.inceptionlabs.ai/blog/introducing-mercury)**。日付表示なし。“Our Vision”“Mercury Coder”“What’s next”。並列反復更新の公式説明。性能優位の一般化は採用していない。
- **S13 — Inception, [Introducing the Inception API](https://www.inceptionlabs.ai/blog/introducing-inception-api)**。日付表示なし。“Diffusing Mode”。引用：“stream blocks of noisy tokens”。途中状態を表示できるというAPI説明であり、ノイズ核の特定や歴史的な実装日の根拠にはしない。
- **S14 — Google DeepMind, [Gemini Diffusion](https://deepmind.google/models/gemini-diffusion/)**。日付表示なし。“What is a diffusion model?”“More coherent text”“Iterative refinement”。引用：“refining noise, step-by-step”; “Generates entire blocks of tokens at once”; “Corrects errors during generation for more consistent outputs.”。マスクの有無や確定位置の扱いは不明。
- **S15 — Google, [Gemini Diffusion is our new experimental research model](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-diffusion/)**。2025-05-20、発表本文。引用：“converting random noise into coherent text or code”。発表日とノイズからの反復生成を確認。Gaussianノイズとの特定には使わない。
- **S16 — Inception, [Introducing Mercury 2](https://www.inceptionlabs.ai/blog/introducing-mercury-2)**。公式ブログ一覧で2026-02-24。“A new foundation”。引用：“producing multiple tokens simultaneously and converging”。並列収束の説明で、厳密な再編集規則までは公表していない。
- **S17 — Inception, [Introducing Mercury 2.5](https://www.inceptionlabs.ai/blog/introducing-mercury-2-5)**。公式ブログ一覧で2026-09-08。“What changed”“Get Started”。拡散型の新世代とAPI提供を確認。世代の日付は[公式一覧](https://www.inceptionlabs.ai/blog)と照合。
- **S18 — Google AI for Developers, [Diffusion in Text Generation Explained](https://ai.google.dev/gemma/docs/diffusiongemma/explained)**。Last updated 2026-06-10 UTC。“Uniform State Diffusion”“Architecture”“Multi-Canvas Sampling”。引用：“Instead of an explicit `[MASK]` token”; “entirely random tokens from the vocabulary”。語彙ノイズ、再ノイズ化、ブロック内外の処理の違いを確認。
- **S19 — Google, [DiffusionGemma: 4x faster text generation](https://blog.google/innovation-and-ai/technology/developers-tools/diffusion-gemma-faster-text-generation/)**。2026-06-10、導入本文。Gemini Diffusion研究を基にした別モデルであることを確認。題名の速度値は原稿の比較に採用していない。
- **S20 — Google AI for Developers, [DiffusionGemma model overview](https://ai.google.dev/gemma/docs/diffusiongemma)**。Last updated 2026-06-10 UTC。導入、core features。離散拡散とblock-autoregressive multi-canvas samplingを照合。

### 主要系列、利用の範囲、最新世代の留保

- **S21 — OpenAI, [GPT-4 Technical Report](https://arxiv.org/html/2303.08774v6)**。arXiv:2303.08774v6、2024-03-04（初版2023年）。Abstract、§2。引用：“pre-trained to predict the next token in a document”。読んだv6本文にない`autoregressive`という語を引用へ補っていない。
- **S22 — Anthropic, [Glossary](https://platform.claude.com/docs/en/about-claude/glossary)**。日付表示なし。“Pretraining”“Tokens”。引用：“autoregressive language models (such as Claude's underlying model)”。取得時点の系列一般の公式説明。
- **S23 — Gemini Team, [Gemini: A Family of Highly Capable Multimodal Models](https://arxiv.org/html/2312.11805v5)**。arXiv:2312.11805v5、2025-05-09（初版2023年）。§2、Appendix 10.1 Model architecture。引用：“decoder-only Transformer architecture”。対象はGemini 1.0。
- **S24 — Gemini Team, [Gemini 2.5: Pushing the Frontier with Advanced Reasoning, Multimodality, Long Context, and Next Generation Agentic Capabilities](https://arxiv.org/html/2507.06261v1)**。arXiv:2507.06261v1、2025-07-07。§2.1 Architectureの蒸留段落。引用：“the teacher’s next token prediction distribution”。MoEという記載だけから生成順序を推論していない。
- **S25 — Meta, [Llama 4 Maverick model card](https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct)**。カード内のモデル公開日2025-04-05。Model Information / Model Architecture。引用：“The Llama 4 models are auto-regressive language models that use”。Scout/Maverickの構造説明。
- **S26 — Qwen, [Qwen3-235B-A22B model card](https://huggingface.co/Qwen/Qwen3-235B-A22B)**。Model Overview。引用：“Type: Causal Language Models”。日付固定の[Qwen3 Technical Report](https://arxiv.org/html/2505.09388v1)（2025-05-14）§2・§3も照合。
- **S27 — Qwen, [Key Concepts](https://qwen.readthedocs.io/en/latest/getting_started/concepts.html)**。日付表示なし。“Causal Language Models”。引用：“Qwen models are causal language models suitable for text completion.”。causalと自己回帰型、次トークン予測の関係を公式に説明。
- **S28 — Qwen, [Qwen3.5-397B-A17B model card](https://huggingface.co/Qwen/Qwen3.5-397B-A17B)**。CitationにFebruary 2026。Model Overview / Citation。引用：“Type: Causal Language Model with Vision Encoder”。構造が混成でも言語生成がcausalと明記される例。
- **S29 — DeepSeek-AI, [DeepSeek-V3 Technical Report](https://arxiv.org/html/2412.19437v2)**。arXiv:2412.19437v2、2025-02-18（初版2024-12-27）。§2.2、Figure 3、MTP in Inference、§5。引用：“keep the complete causal chain at each prediction depth”。MTPの訓練構造と推論での選択肢を区別。
- **S30 — DeepSeek, [V4モデルカード](https://fe-static.deepseek.com/chat/transparency/deepseek-V4-model-card-CN_3c2bd9.pdf)**。[公式透明度センター](https://www.deepseek.com/transparency/)から参照。モデル公開日2026-04-24、PDF資料公開日2026-04-27。p.3「模型架构」でV3のMTP戦略の継承を確認。[公式配布ページ](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)も照合。日付欄には順序の不整合があるが、いずれも基準日前。
- **S31 — OpenRouter, [AI Model Rankings](https://openrouter.ai/rankings?view=week)**。取得画面の集計最終日は2026-10-13。“How these rankings are measured”“Model rankings by tokens processed”“Market Share”。引用：“These rankings show traffic routed through OpenRouter.” / “None of them measures users or spend.”。可変ページの取得時点の値であり、全世界の方式別シェアではない。
- **S32 — Aubakirova et al. / OpenRouter・a16z, [State of AI: An Empirical 100 Trillion Token Study with OpenRouter](https://arxiv.org/html/2601.10088v1)**。arXiv:2601.10088v1、2026-01-15（本文December 2025）。Open vs. Closed Source Models、Key Open Source Players、§10 Limitations。[公式表示](https://openrouter.ai/state-of-ai)の観測期間は2024-11〜2025-11。引用：“This study reflects patterns observed on a single platform, namely OpenRouter”。
- **S33 — Google DeepMind, [Gemini 3.7 Flash Model Card](https://deepmind.google/models/model-cards/gemini-3-7-flash/)**。2026-08-13。Architecture、Distribution、Evaluation。評価の比較対象と構造の参照先を確認。評価点を利用率とは扱わない。
- **S34 — Google公式モデルカード群**。[3.6 Flash](https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-6-Flash-Model-Card.pdf)（July 2026）、[3.5 Flash](https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-5-Flash-Model-Card.pdf)、[3 Flash](https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-Flash-Model-Card.pdf)（December 2025）、[3 Pro](https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-Pro-Model-Card.pdf)（取得版May 2026）。各Architecture、最終参照先3 Pro p.3。参照をたどってもcausal maskや生成順序の直接確認には至らなかった。
- **S35 — OpenAI, [Models](https://developers.openai.com/api/docs/models)・[What's new](https://learn.chatgpt.com/docs/whats-new)**。取得時のモデル一覧と2026-09の週次告知。GPT-4を最新世代とは呼べないことを確認する補助資料。生成方式の詳細仕様としては使わない。
- **S36 — OpenAI, [Predicted Outputs](https://developers.openai.com/api/docs/guides/predicted-outputs)**。日付表示なし。出力予測による高速化、accepted/rejected prediction tokensの説明。GPT-4o/4.1系列を扱う補助資料で、全GPT系列の内部仕様・導入日の根拠にはしない。

### 複数トークン予測、推測的デコード、BERTの生成手順

- **S37 — Leviathan, Kalman & Matias (2023), [Fast Inference from Transformers via Speculative Decoding](https://proceedings.mlr.press/v202/leviathan23a/leviathan23a.pdf)**。ICML/PMLR 202:19274–19286、公刊日2023-07-23〜29。[書誌](https://proceedings.mlr.press/v202/leviathan23a.html)。§2.1–2.3、Algorithm 1（PDF pp.2–3）、Appendix A.1。引用：“have the same distribution as those from the target model alone”。分布の同一性は個別実行の文字列・乱数消費の同一性を意味しない。
- **S38 — Gloeckle et al., [Better & Faster Large Language Models via Multi-token Prediction](https://arxiv.org/html/2404.19737v1)**。arXiv:2404.19737v1、2024-04-30。Figure 1、§2 Method / Inference、§3.2。引用：“vanilla next-token autoregressive prediction using the next-token prediction head”。訓練の複数headと、通常推論・self-speculative decodingを区別。
- **S39 — Wang & Cho (2019), [BERT has a Mouth, and It Must Speak: BERT as a Markov Random Field Language Model](https://aclanthology.org/W19-2304.pdf)**。NeuralGen pp.30–36、2019-06-06。§3 Sampling / Sequential Sampling、§4（pp.31–33）。引用：“we initialize to be an all-mask sequence”; “We repeat this procedure many times”。反復生成手順の実例としてのみ採用。MRFの結合分布とMLM条件分布の同一視についてはS4の留保を参照。

ローカル資料は[AGENTS.md](../../AGENTS.md)、[docs/spec.md](../../docs/spec.md)、[既存intro-facts/report.md](../intro-facts/report.md)、[langmodel.js](../../decks/llm/clips/langmodel.js)、[compose.js](../../decks/llm/clips/compose.js)、[deck.js](../../decks/llm/deck.js)とC6記載の後続3クリップを確認した。取得・照合日は2026-10-14。調査中の並行変更は編集していない。取得経路、未読資料、引用語数の訂正、計画改訂の履歴は[log.md](log.md)に残した。
