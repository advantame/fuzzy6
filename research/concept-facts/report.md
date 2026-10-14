# 3章「基本概念」第1稿の事実確認

## 要約と判定方法

**章の流れは使える。修正の中心は、仕組みの境界と、例を一般則に広げている文である。** 全82項目のうち、言える45件、限定すれば言える34件、そのままでは言えない3件。3件は、全パラメータが乱数で出力確率に意味がないという説明（3-6.4）、全パラメータを直して一例の正解確率が毎回上がるという説明（3-6.8）、事前学習後は固定され使っても覚えないという説明（3-6.13）。実装には0や1から始める値があり、学習は複数の位置の損失をまとめて調整し、事前学習後にも追加学習がある。[GPT-2公式実装（S2）](https://github.com/openai/gpt-2/blob/master/src/model.py)、[損失の実装（S21）](https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/loss/loss_utils.py)、[InstructGPT（S25）](https://arxiv.org/abs/2203.02155)

全体を通して、次の6点を揃えると誤った像を残さずに説明できる。

1. **文章・番号・ベクトル・点数・選択を分ける。** トークン化と選択まで含める図は「生成のしくみ」全体とし、学習したモデル本体の境界を別に示す。K1。
2. **別モデルの数値を一つの実機の仕様へ合成しない。** 約20万語彙はGPT-4oの公開encoding、12,288次元・96層・1750億パラメータはGPT-3最大版の例。K2〜K6。
3. **入力に応じて変わる値と、学習で変える値を分ける。** ベクトルやアテンションの「参考にする度合い」の変化は、パラメータ更新とは別。K3・K4・K6。
4. **イメージと実測を分ける。** 日本語の意味配置、「電話」へ向く太い矢印、候補の確率は今回の実測ではない。「例」「イメージ」の札と、実物との対応・違いが要る。K3〜K5。
5. **生成順と、計算・通信・表示の回数を分ける。** 基本手順の100回の選択を、モデル実行100回や画面更新100回と同一視しない。K1・K5。
6. **100万トークンという量と、実際の入力容量を分ける。** 本調査の計数では『坊っちゃん』約13冊ぶん、『こころ』約8冊ぶんの量。ただし回答用の容量や独立の入力上限があり、その冊数を丸ごと投入できる保証ではない。K7。

対象は [LLMデッキREADME](../../decks/llm/README.md) の「2026-10-15（3 章を作り直す）」にある7クリップ・82項目。**基準日は2026-10-15、今回の外部資料取得・計数は2026-10-14 UTC**。公表日・版の日付とは区別する。対象原稿の全文とSHA-256は [調査ログ](log.md) Unit 1に保存し、Unit 10でREADMEの82項目との一致を確認した。

「言える」は、本章の代表的な自己回帰型テキスト生成の範囲で成立するという判定。「限定すれば言える」は必要な限定を文や図へ反映することが条件で、原稿を無修正で認める意味ではない。「言えない」はそのままの断定を採用できないという意味。問い・案内も件数に含む。3-7.10は未記入行を今回の計数で埋めた提案への判定である。

言い換えは、めたんの口調で事実として使える範囲を示す案。原稿・図・音声は変更していない。S番号とD番号は今回のlogと共通で、過去報告の番号とは別である。

## K1〜K8の判定表

| 項目 | 結論 | 主な修正点 |
|---|---|---|
| K1 流れとモデルの境界 | 限定すれば言える | トークン化・本体・選択を分け、全文再計算や表示との1対1対応を描かない |
| K2 トークン | 限定すれば言える | 語彙を作る際の頻度と、利用時の固定した切り方を分ける。バイト断片・英語の空白も含める |
| K3 埋め込み | 限定すれば言える | 表引きは正確。意味距離の一般則、日本語の実測図、厳密な類推等式にはしない |
| K4 アテンションと層 | 限定すれば言える | 自分自身も参照対象。電話への重みは模式例。学習時のマスク、残差等の省略、混成構成を区別 |
| K5 確率と選択 | 限定すれば言える | 抽選は選び方の一つ。候補集中・100回・終了印は条件を付ける |
| K6 事前学習 | 3文はそのままでは言えない | 初期化、まとめた損失の更新、追加学習・メモリーの区別を修正 |
| K7 文脈窓と小説換算 | 限定すれば言える | 提供元の定義を保持。窓の外の原文と要約を分ける。小説は量の比として使う |
| K8 日本語用語と比喩 | 用語は使える | 「数の並び」にベクトルの名を添え、「周り」は自分と前のトークンへ限定 |

## 根拠・文ごとの判定・言い換え


### K1：生成の流れ、モデル本体、ストリーミング

流れ図は次の区別で統一できる。公式GPT-2では、文章を番号化してからモデルへ渡し、モデルが点数を返し、外側の処理が次の番号を選ぶ。softmaxを数学上のモデル出力に含める描き方も可能だが、図の境界を途中で変えない。[モデル（S2）](https://github.com/openai/gpt-2/blob/master/src/model.py)、[生成（S3）](https://github.com/openai/gpt-2/blob/master/src/sample.py)、[入出力（S4）](https://github.com/openai/gpt-2/blob/master/src/interactive_conditional_samples.py)

```text
文章 → トークン化・番号化
     → モデル本体〔入力埋め込み → 層を重ねる → 最後の位置から語彙の点数〕
     → 確率・選択 → 選んだ番号を列の末尾へ追加 → 次を予測
生成した番号列 → 文章へ戻す → 表示
```

反復の条件になるのは、そこまでの列。ただしKV cacheで前の計算結果を再利用できるため、**毎回全文を一から再計算する動き**にはしない。説明にcacheの技術語を必ず足す必要はなく、「そこまでを手がかりに次を予測する」で足りる。公開GPT-2はこの区別を確かめる実例で、非公開の最新モデルの実装を特定する証拠には使わない。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S3](https://github.com/openai/gpt-2/blob/master/src/sample.py)

**ストリーミングは追加してよいが、生成と表示の間の処理を一文で示す。** 案：「生成した文章を、できたところから順に送ると、画面にも少しずつ表示できるのよ。」生成が逐次的でも、全部できてから返す方式はある。SSEのテキスト差分は1文字・1トークン・1回のモデル計算との対応を保証しない。特定UIの更新周期は未調査。[Streaming（S1）](https://developers.openai.com/api/docs/guides/streaming-responses)


#### 3-1の全項目

| 原稿ID | 判定 | 根拠・必要な限定・言い換え案 |
|---|---|---|
| 3-1.1 | 言える | 対象を前から順に生成するモデルに限定済み。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)–[S3](https://github.com/openai/gpt-2/blob/master/src/sample.py)。 |
| 3-1.2 | 限定すれば言える | 文章そのものは前処理へ、モデル本体には番号列。確率まで含む概観として可。「書きかけの文章から、次に来るトークンの確率を計算するの。」図では前処理と本体の境界を明示する。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)–[S4](https://github.com/openai/gpt-2/blob/master/src/interactive_conditional_samples.py)。 |
| 3-1.3 | 限定すれば言える | 条件となる列への追加として可。毎回全文再入力・再計算と受け取らせない。「その中から一つを選んで後ろに足し、そこまでの続きから、また次を予測するのよ。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)–[S3](https://github.com/openai/gpt-2/blob/master/src/sample.py)。 |
| 3-1.4 | 言える | 生成の論理的な反復。画面へ同じ単位・間隔で出るという意味にはしない。[S3](https://github.com/openai/gpt-2/blob/master/src/sample.py)、[S1](https://developers.openai.com/api/docs/guides/streaming-responses)。 |
| 3-1.5 | 言える | 問い。独立の事実主張なし。 |
| 3-1.6 | 言える | 前処理から予測まで段階を分ける説明として可。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)–[S4](https://github.com/openai/gpt-2/blob/master/src/interactive_conditional_samples.py)。 |
| 3-1.7 | 限定すれば言える | トークン化・番号化と入力埋め込みを一足に飛ばしている。「まず、文章をトークンに切って番号にするわ。モデルは、その番号を、数の並びに変えるの。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S4](https://github.com/openai/gpt-2/blob/master/src/interactive_conditional_samples.py)。BPEの細部はK2の検算。 |
| 3-1.8 | 限定すれば言える | 「まわり」は後方も含むと聞こえる。「次に、自分と、それより前のトークンを参考にして、数の並びを書き換えるの。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)の因果マスク。多層の説明はK4。 |
| 3-1.9 | 言える | 点数から確率にする段階を含めた概観として可。最後の位置を使うことは3-5.1で説明予定。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)–[S3](https://github.com/openai/gpt-2/blob/master/src/sample.py)。 |
| 3-1.10 | 言える | 案内。独立の事実主張なし。 |


### K2：トークン、BPE、語彙、番号

バイト単位BPEでは、細かなバイトから始め、学習用データによく現れる隣接対をまとめて語彙を作る。利用時には、既定の事前分割と結合順位を使う。**入力した文章の頻度から、その場で語彙を作るわけではない。** 通常トークンには一文字未満のバイト断片もあり、特殊トークンもあるので、文字列をまとめたものだけを全トークンの定義にしない。[教育用BPE（S5）](https://github.com/openai/tiktoken/blob/main/tiktoken/_educational.py)、[辞書定義（S6）](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken_ext/openai_public.py)

GPT-4o→o200k_base、GPT-4→cl100k_base、公開o200k_baseの語彙は通常199,998＋特殊2＝200,000という事実は既存調査を引き継ぐ。最大ID＋1の200,019とは別。これは商用チャットの非公開制御記号の全数を示すものではない。モデル同士で同じ切り方を共有することもある。[既存調査](../llm-facts/report.md)、[公式モデル対応](https://github.com/openai/tiktoken/blob/main/tiktoken/model.py)

バイトへ分ければ通常のUnicode文章の未知の文字も表現できる。ただし特殊トークンと同じ綴りを既定設定で拒否する等のAPI上の条件はある。「どんな入力文字列も無条件にエラーなく往復する」とは言わない。モデルが番号を読み書きするとは入出力の記号の話で、内部の計算は番号で引いたベクトルに対して行う。[core.py（S7）](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken/core.py)、[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)

#### 短文の実測

入力は `のどがかわいたので、水を飲んだ。`。改行・前後空白・メッセージ枠なし、通常テキスト扱い。

| 切り方 | 個数 | 分割 |
|---|---:|---|
| o200k_base | **12** | の｜ど｜が｜かわ｜いた｜ので｜、水｜を｜飲｜ん｜だ｜。 |
| cl100k_base | **17** | の｜ど｜が｜か｜わ｜い｜た｜の｜で｜、｜水｜を｜[飲の前半]｜[飲の後半]｜ん｜だ｜。 |

`飲`のUTF-8 `e9 a3 b2`は、cl100k_baseでは`e9 a3`（ID 72406）と`b2`（ID 110）。断片を単独で文字化したときの`�`を、そのトークン本来の文字名として描かない。o200k_baseの単独語は犬129581、猫48091、飲132125で、原稿の番号と一致した。辞書[D1](https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken)・[D2](https://openaipublic.blob.core.windows.net/encodings/cl100k_base.tiktoken)に対する本調査の計数。

英語 `I was thirsty, so I drank water.` は両方とも9個：`I｜ was｜ thirsty｜,｜ so｜ I｜ drank｜ water｜.`。先行空白も同じトークンになる。一語一トークン率は測定しておらず、公式の「平均約4文字／トークン」という目安からその割合は導けない。[説明（S8）](https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens)

計数器は既存のjs-tiktoken 1.0.21。`encode(text, [], [])`を使用し、全文decode一致を確認。両辞書の全行のID・バイト列を公式データと照合して不一致0、公式期待SHA-256とも一致した。公式Python版との二重実行ではない。辞書ハッシュと全ID列は[log Unit 3](log.md)に記録した。


#### 3-2の全項目

| 原稿ID | 判定 | 根拠・必要な限定・言い換え案 |
|---|---|---|
| 3-2.1 | 言える | この章のテキスト生成の単位として。[S5](https://github.com/openai/tiktoken)、[S8](https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens)。 |
| 3-2.2 | 言える | 指定の日本語入力をGPT-4o用o200k_baseで12と実測。メッセージ枠込みのAPI消費量ではない。[D1](https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken)・計数。 |
| 3-2.3 | 言える | 提示例への観察。 |
| 3-2.4 | 限定すれば言える | バイト断片もあり、語彙を作るときの頻度の話。「この切り方では、文字を表す細かな単位から、よく現れる並びをまとめて、トークンの一覧を作ってあるの。」[S5](https://github.com/openai/tiktoken)–[S7](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken/core.py)。 |
| 3-2.5 | 言える | 「、水」の結合と「飲｜ん｜だ」の分割は実測どおり。[D1](https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken)・計数。 |
| 3-2.6 | 限定すれば言える | 空白と頻出語への限定。「英語では、よく使う単語が、前の空白も含めて一つになることがあるわ。」[S8](https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens)・英語例。頻出語について「多い」とする定性的表現も可能だが、割合は裏付けていない。 |
| 3-2.7 | 言える | 辞書で各バイト列／特殊記号にIDを付与。[S6](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken_ext/openai_public.py)–[S7](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken/core.py)、[D1](https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken)/D2。 |
| 3-2.8 | 言える | 公開o200k_baseの約20万種類という既存の裏取りを引継ぐ。通常と特殊の区別は既存調査からの引継ぎ参照。 |
| 3-2.9 | 言える | 対応するencodingがモデルに定められている。複数モデルが同じものを共有する場合もあり、「全モデルで異なる」とは言わない。同じ文17は実測。 |
| 3-2.10 | 言える | `飲`全体はcl100kの通常語彙になく、UTF-8の2片になる。[D2](https://openaipublic.blob.core.windows.net/encodings/cl100k_base.tiktoken)・計数。 |
| 3-2.11 | 限定すれば言える | 通常文章を表現できる原理として可。実装の無条件成功を意味させない。「語彙にない文字も、こうして細かく分ければ、トークンの並びで表せるのよ。」[S5](https://github.com/openai/tiktoken)、[S7](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken/core.py)。 |
| 3-2.12 | 言える | 入出力の表現としての説明。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)–[S4](https://github.com/openai/gpt-2/blob/master/src/interactive_conditional_samples.py)。モデル内部まで番号そのものの大小で計算する図にはしない。 |


### K3：入力埋め込みと意味の関係

番号は埋め込み表の行を選ぶ添字。同一トークンは、位置情報や文脈の処理を加える前なら同じ数の並びになる。番号の近さは意味距離を表さないが、BPEのIDは結合順位を兼ねる場合もあるので、「番号には一切の情報がない」まで一般化しない。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S5](https://github.com/openai/tiktoken/blob/main/tiktoken/_educational.py)

学習した単語ベクトルに意味・文法の関係が表れる研究はある。しかし、**すべてのLLMの入力トークンで意味の近さと距離が対応する保証はない。** バイト断片は一語の意味を持つとは限らず、静的な入力埋め込みと文脈化後の表現も異なる。「近い値」より「意味や使い方の関係が、数の並びにも表れることがある」が適切。[2013年研究（S9）](https://arxiv.org/pdf/1301.3781)、[文脈表現の研究（S10）](https://aclanthology.org/D19-1006/)

動物・食べ物・都市の平面配置は「イメージ」とし、実モデルを平面へ写した観測図にはしない。高次元のすべての距離や方向を平面で保存できるわけではない。各軸へ「動物度」等の意味を保証する札も付けない。「例」の一文字だけで実測と見える説明を相殺するのは不十分、というのが本調査の制作上の判断。

2013年のKing−Man＋Womanの例は、**英語の単語表現の類推**として紹介できる。論文は先行研究に帰属させて紹介しており、「word2vecが初めて発見」ではない。日本語訳を添えるなら英語も併記し、正確な等式や完全な平行四辺形にはしない。類推評価はコサイン距離の最近傍で、入力に使った単語を候補から除いている。[S9 §1.1・§4](https://arxiv.org/pdf/1301.3781)


#### 3-3の全項目

| 原稿ID | 判定 | 根拠・必要な限定・言い換え案 |
|---|---|---|
| 3-3.1 | 限定すれば言える | 名札の比喩は可。番号が結合順位等を持つ点と意味距離を区別。「番号は名札のようなものよ。番号が近いからといって、意味も近いわけではないの。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S5](https://github.com/openai/tiktoken)。 |
| 3-3.2 | 言える | o200k_baseの単独語のIDはK2の検算の実測どおり。どの辞書の番号かを図で示す。 |
| 3-3.3 | 言える | 通常の入力埋め込みの表引きとして正確。位置情報を加える前の段階。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)。 |
| 3-3.4 | 限定すれば言える | GPT-3は複数サイズ。「GPT-3のいちばん大きなモデルでは、一つのトークンが12,288個の数になるのよ。」既存調査からの引継ぎの原論文確認を引継ぐ。 |
| 3-3.5 | 限定すれば言える | 学習で決まるは可。意味と距離の一般則にはしない。「この表の数は、学習で決まるわ。言葉の意味や使い方の関係が、数の並びにも表れることがあるの。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S9](https://arxiv.org/pdf/1301.3781)。 |
| 3-3.6 | 限定すれば言える | 配置は未実測。イメージに限定。「その関係を、こんな平面のイメージで見てみましょう。」画面に「イメージ」を付け、実測の分布とは扱わない。 |
| 3-3.7 | 言える | 問い。続く研究例の限定を保持する。 |
| 3-3.8 | 言える | 2013年の論文で紹介された例という意味で可。「初めて発見した」とは言わない。[S9](https://arxiv.org/pdf/1301.3781) §1.1。 |
| 3-3.9 | 限定すれば言える | 原例は英語。「英語の単語で、『王』から『男』を引いて『女』を足すと、いちばん近いのは『女王』になったのよ。」図にはKing等も併記し、等式にしない。[S9](https://arxiv.org/pdf/1301.3781)。 |
| 3-3.10 | 限定すれば言える | 関係の説明として可。差ベクトルの厳密な一致や、日本語での実測と受け取らせない。「言葉の関係が、数の並びの向きにも表れていた、ということね。」[S9](https://arxiv.org/pdf/1301.3781)、上記の図の条件。 |
| 3-3.11 | 言える | 表引き直後の表現と文脈化後の表現を区別した説明。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S10](https://aclanthology.org/D19-1006/)。単語研究の例とLLMのトークンの話の切替は明示する。 |


### K4：アテンション、多義語、位置、層

本章の因果self-attentionは、**自分自身を含めて、その位置まで**を参照する。QとKから参考の度合いを計算し、Vを重み付きでまとめ、出力変換を経て元の表現へ加える。「情報を混ぜ込む」はこの働きの簡略化として使える。元の埋め込みをそのまま足す、人が意識的に意味を選んでいる、という絵にはしない。[Transformer（S11）](https://arxiv.org/html/1706.03762v7)、[Llama 3（S12）](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)

「後ろはまだない」は生成時の説明として妥当。学習時は後ろの正解がデータに存在するので、先を見ないようにマスクする。位置情報はGPT-2の学習する表の加算と、Llama 3のQ/Kを回転するRoPEなど方式が違う。「位置の情報も、計算に使われているわ」なら加算方式への誤読を避けられる。今回の位置方式の直接確認はGPT-2とLlama 3であり、GPT-3の方式を新たに検証したわけではない。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S11](https://arxiv.org/html/1706.03762v7)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)

アテンションと位置ごとのMLP/FFNを重ねる説明は、**「大きく分けて二つ」**なら成立する。残差・正規化もある。FFNは各位置へ同じ変換規則を適用するので、単語ごとに別の計算器がある図にはしない。2017年の原型はencoder–decoderで、現代のdecoder-onlyと丸ごと同じではない。NVIDIA Nemotron-HのようなMambaとの混成もあるため、全LLM共通の唯一の構造とはしない。「多く」は定性的説明で、市場割合の測定ではない。[S11](https://arxiv.org/html/1706.03762v7)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)、[Nemotron-H（S13）](https://research.nvidia.com/labs/adlr/nemotronh/)

「電話をかける／眼鏡をかける／橋をかける」と、発信する／身につける／架け渡すという短い意味の対応は使える。ただし、これで意味が分かることと、特定モデルの特定headが電話へ強い重みを付けることは別。後者は未実測。o200k_baseとcl100k_baseでは「かける」は**か｜け｜るの3トークン**なので、一箱の図は単語単位へまとめたイメージと断る。[漢字ペディア（S14）](https://www.kanjipedia.jp/sakuin/doukunigi/items/0000942800)、[小学館辞書本文（S15）](https://kotobank.jp/word/%E6%8E%9B%E3%81%91%E3%82%8B-461286)、本調査K2の検算。


#### 3-4の全項目

| 原稿ID | 判定 | 根拠・必要な限定・言い換え案 |
|---|---|---|
| 3-4.1 | 言える | 三つの用法は自然。[S14](https://www.kanjipedia.jp/sakuin/doukunigi/items/0000942800)、[S15](https://kotobank.jp/word/%E6%8E%9B%E3%81%91%E3%82%8B-461286)。表記は比較のため平仮名で統一してよい。 |
| 3-4.2 | 限定すれば言える | この3例での話にする。「この三つでは、前にある言葉が、意味を見分ける手がかりになるわね。」一般の言語理解を前だけで十分としない。 |
| 3-4.3 | 限定すれば言える | 対象は因果self-attention。「ここで見るLLMにも、前の言葉を参考にする、アテンションという計算があるの。」後続で自分自身も含むと明示する。[S11](https://arxiv.org/html/1706.03762v7)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)。 |
| 3-4.4 | 限定すれば言える | 自己位置を足す。「各トークンが、自分と、それより前のトークンを、どれだけ参考にするかを数で決めるのよ。」[S11](https://arxiv.org/html/1706.03762v7)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)。 |
| 3-4.5 | 限定すれば言える | 実測としては言えない。単語単位の模式図と明示した上で「たとえば、『電話』の情報を取り込むイメージね。参考にする度合いに応じて、情報を数の並びに混ぜ込むの。」[S11](https://arxiv.org/html/1706.03762v7)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)と未測定の区別。 |
| 3-4.6 | 限定すれば言える | 意味ラベル一個へ確定すると描かない。「こうして、同じ言葉でも、前の言葉に応じて、数の並びが変わっていくの。」[S10](https://aclanthology.org/D19-1006/)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)。実際のtoken境界は単語図と異なる。 |
| 3-4.7 | 言える | 問い。独立の事実主張なし。 |
| 3-4.8 | 言える | この章の因果型の範囲で正確。[S11](https://arxiv.org/html/1706.03762v7)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)。自己回帰という性質だけから全方式の内部構造を一律に定義する説明は避ける。 |
| 3-4.9 | 言える | 生成時の理由として可。「学習のときも、先の答えを見ないように隠すのよ。」を3-6側に補うと誤解がない。[S11](https://arxiv.org/html/1706.03762v7)。 |
| 3-4.10 | 言える | 情報を取り入れる意味の「加えられている」なら可。「位置の情報も、計算に使われているわ。」なら加算方式への誤読も避けられる。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)。 |
| 3-4.11 | 言える | 代表的なGPT／Llamaブロックの大筋として正確。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)。画面の補足で残差・正規化を省略していると示せる。 |
| 3-4.12 | 限定すれば言える | 「大きく分けると、この二つを一組にして、何段も重ねるの。GPT-3のいちばん大きなモデルでは、96段あるわ。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)、既存調査からの引継ぎ。 |
| 3-4.13 | 限定すれば言える | 原型と現代構成の同一視を避ける。「この二つの計算を重ねる考え方は、2017年のTransformerで示されたの。いまのLLMの多くも、この考え方を受け継いでいるわ。」[S11](https://arxiv.org/html/1706.03762v7)、[S12](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)、[S13](https://research.nvidia.com/labs/adlr/nemotronh/)。 |


### K5：確率、選び方、温度、100回、停止

最後の位置の表現から語彙の点数logitを求め、softmaxで合計1の分布にする説明は正確。温度T>0なら `p_i = exp(z_i/T) / Σ_j exp(z_j/T)`。これは**次のトークンの確率であって、答えが事実として正しい確率ではない。** 「高い確率が一握りに集まる」は文脈次第なので、今回の分布図は説明用の例とする。小さい正の確率を0%に丸めることと、候補選別で確率を0にすることも違う。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[Llama生成コード（S16）](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)

くじはサンプリングの比喩として使える。最高点を選ぶ方式もあり、top-k/top-pで候補を絞り再正規化してから抽選する場合もある。温度を下げれば高得点へ集中し、上げれば平らに近づく。T=0を式の0除算で描かず、例のコードではargmaxへの分岐と捉える。温度0でも全サービスの完全再現性は保証されない。[S3](https://github.com/openai/gpt-2/blob/master/src/sample.py)、[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)、[API（S19）](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)

同じ質問で変わる理由は、抽選のほか、履歴・システム指示・取得情報など質問以外の入力の差、モデル更新、実行基盤の数値設定や非決定性がある。特定の画面で起きた違いの原因を特定した結果ではない。seedの説明資料は完全一致を保証せず、現行の全モデルでseedが使えることの根拠でもない。[S19](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)、[再現性の公式説明（S20）](https://developers.openai.com/cookbook/examples/reproducible_outputs_with_the_seed_parameter)

**100トークンなら100回**は、一つずつ本文を選んで足す基本手順の話に限定する。終了印や非表示の推論トークンは別。推測的デコードでは候補をまとめて検証し、一度の対象モデル計算で複数トークンを確定できる。表示更新回数や総演算量とも一致しない。[推測的デコード（S18）](https://proceedings.mlr.press/v202/leviathan23a/leviathan23a.pdf)、[S19](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)

終了印が出ると、**それを検出した生成プログラムが止める**。o200k_baseの`<|endoftext|>`199999は辞書の実在項目だが、GPT-4oの全チャットが必ずこれで終わるとまでは言えない。Llama 3にはturn終了の`<|eot_id|>`もある。長さ上限、stop文字列、ツールへの制御移譲等も区別する。上限が推論トークン込みなら、見える答えの長さだけの上限ではない。[辞書（S6）](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken_ext/openai_public.py)、[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)、[停止記号（S17）](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/tokenizer.py)、[S19](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)


#### 3-5の全項目

| 原稿ID | 判定 | 根拠・必要な限定・言い換え案 |
|---|---|---|
| 3-5.1 | 言える | この章の通常の自己回帰生成で、最終位置から次を予測する説明。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S3](https://github.com/openai/gpt-2/blob/master/src/sample.py)、[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)。 |
| 3-5.2 | 限定すれば言える | 語彙数を特定の例に結びつける。「語彙のすべてに点数を付けて、合計が100%になる確率に直すの。GPT-4oの切り方なら、語彙はおよそ20万種類よ。」既存調査からの引継ぎ、[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)。GPT-3の構成値と混ぜない。 |
| 3-5.3 | 限定すれば言える | 一般則・実測としては言えない。例の分布に「例」を表示して「この例では、いくつかの候補に、高い確率が集まっているわ。」未測定の割合を実モデルの出力としない。 |
| 3-5.4 | 限定すれば言える | 抽選方式として限定。「選び方の一つが、この確率に応じて、くじを引くように一つを選ぶ方法よ。」[S3](https://github.com/openai/gpt-2/blob/master/src/sample.py)、[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)。図で温度や候補の絞り込みを使うなら、その後の確率を描く。 |
| 3-5.5 | 言える | 直前にサンプリング方式を示した範囲なら正確。[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)。 |
| 3-5.6 | 言える | 問い。次文で理由の一つと答える構成は適切。 |
| 3-5.7 | 言える | 温度による分布の調整という説明として正確。[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)、[S19](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)。「毎回必ず違う」「温度0なら絶対一致」にはしない。ほかの変動理由は上記参照。 |
| 3-5.8 | 限定すれば言える | 基本手順として可。毎回全文を一から再計算するように描かない。「選んだトークンを後ろに足し、そこまでを手がかりに、また次を選ぶわ。」[S3](https://github.com/openai/gpt-2/blob/master/src/sample.py)、K1のcacheの区別。 |
| 3-5.9 | 限定すれば言える | 「この基本の手順では、本文を100トークン書くなら、一つ選んで足すことを100回くり返すの。」終了印の選択は別。実装のモデル実行回数とは対応しない旨を画面か制作注に置く。[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)、[S18](https://proceedings.mlr.press/v202/leviathan23a.html)、[S19](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)。 |
| 3-5.10 | 限定すれば言える | 「終了の印が選ばれると、それを受け取ったプログラムが、そこで生成を止めるのよ。」[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)、[S17](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/tokenizer.py)。印の種類はモデル・形式による。199999はo200k_baseの例に限る（[S6](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken_ext/openai_public.py)）。 |
| 3-5.11 | 言える | 長さ上限でも止まるという基本説明は正確。[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)、[S19](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)。上限に含むtokenの種類はAPIによる。これだけがほかの停止理由とはしない。 |


### K6：事前学習、パラメータ、利用中の変化

埋め込み表や変換の係数は学習するパラメータ。入力ごとに計算するアテンション重みや途中のベクトルは別。一からの学習では多くの重みを乱数で始めるが、GPT-2でもbiasは0、正規化のscaleは1で始める。未学習でも確率は数学的には有効な分布なので、「文章の続きを予測するようには、まだ学んでいない」と直す。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)

通常の一箇所の交差エントロピーは `L = -log p(学習文で次に現れたトークン)`。そのトークンへ低い確率を付けるほど損失が大きい。「正解」は本文の次のトークンで、事実の真偽や唯一の自然な続きの意味ではない。多くの位置・複数例の損失をまとめ、勾配を計算して更新する。全パラメータを学習対象にする場合でも、各回すべてが必ず動く、各例の正解確率が必ず上がる、という保証にはならない。これは損失・更新式からの数学的判断である。[損失実装（S21）](https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/loss/loss_utils.py)、[損失式（S22）](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html)、[Adam（S23）](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Adam.html)

学習では区間内の多位置を並列に予測でき、複数の文章もbatchにまとめられる。全データを一度に処理する図にはしない。先の答えは学習中も隠す。次トークン予測という目的は追加学習でも用いるので、大量のデータで土台を作る段階を「事前学習」と呼ぶ説明にする。[S21](https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/loss/loss_utils.py)、[学習手順（S24）](https://huggingface.co/docs/transformers/tasks/language_modeling)

**通常の生成中はパラメータを変えない**という説明は使える。ただし事前学習後には追加訓練があり、固定した重みでも文中の例や会話を手がかりに振る舞いが変わる。事前学習だけのモデルを会話アプリに絶対使えないという意味でもない。指示に沿って答えるための追加訓練へつなぐ。[GPT-3（S29）](https://arxiv.org/abs/2005.14165)、[InstructGPT（S25）](https://arxiv.org/abs/2203.02155)

ChatGPTのメモリーは、公式には保存情報や過去会話の参照として説明される。外部へ保存してpromptへ戻す公式実装例もあり、パラメータ更新なしで記憶機能を構成できる。ただし、その実装例はChatGPT内部の開示ではない。「会話のたびに本体の重みを書き換える機能」とする根拠はない一方、非公開サービスの全実装を監査したわけでもない。設定に応じて会話を将来のモデル改善へ利用することとは区別する。[Memory（S26）](https://help.openai.com/en/articles/8590148-memory-in-chatgpt)、[保存・参照の実装例（S27）](https://developers.openai.com/cookbook/examples/agents_sdk/context_personalization)

#### 学習量の例

| 対象 | 公表時期 | 事前学習トークン量 | 根拠・限定 |
|---|---|---:|---|
| GPT-3 | 2020年 | 3000億 | 既存調査を引継ぎ。学習中に処理した量。[論文](https://arxiv.org/pdf/2005.14165) |
| Llama 3 8B／70B | 2024-04-18 | 15兆超 | 初期Llama 3の値。[公式カード](https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md) |
| Nemotron-H-56B-Base | 2025-03-21の公式紹介 | 20兆 | 8Bの15兆、47Bへの蒸留630億とは別。[S13](https://research.nvidia.com/labs/adlr/nemotronh/) |
| Qwen3 | 2025-04-29の公式紹介 | 約36兆 | 同公開モデル群。合成の数学・コード等も含む。[S28](https://qwenlm.github.io/blog/qwen3/) |

追加するなら「2025年には、20兆や36兆トークンで事前学習したモデルも、公表されているわ。」が使える。提供元ごとにtokenizerや学習レシピが違うので、同じ原文の量を同じ切り方で測った比較ではない。重複なしの文章量とも、一度に読める長さとも区別する。最新最大値や会社の優劣を示す表ではない。


#### 3-6の全項目

| 原稿ID | 判定 | 根拠・必要な限定・言い換え案 |
|---|---|---|
| 3-6.1 | 言える | 問い。独立の事実主張なし。 |
| 3-6.2 | 言える | 学習する表と変換の係数という意味なら可。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)。途中で得る表現やattention重みとは分ける。 |
| 3-6.3 | 限定すれば言える | 「計算のしかたを決める、学習で調整する数を、パラメータと呼ぶわ。GPT-3のいちばん大きなモデルには、1750億個あるのよ。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、既存調査からの引継ぎ。 |
| 3-6.4 | 言えない | 全数が乱数、確率に意味がない、という断定を修正。「一から学習するときは、多くのパラメータを乱数で決めて始めるの。まだ、文章の続きを予測するようには、学んでいないわ。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)。 |
| 3-6.5 | 言える | この章の次token予測による事前学習として正確。[S21](https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/loss/loss_utils.py)、[S24](https://huggingface.co/docs/transformers/tasks/language_modeling)。「当てる」は次に実在したtokenを教師にすることだと続きで明確化。 |
| 3-6.6 | 言える | 指定文とo200k_baseなら「を」の次は「飲」。K2の検算。 |
| 3-6.7 | 言える | 通常の交差エントロピーの単調性。[S22](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html)。図には「学習文の次のtoken」を正解として示す。 |
| 3-6.8 | 言えない | 全数・一例の確率の毎回改善を保証しない。「いろいろな位置での外れをまとめて、それを小さくするように、パラメータを少しずつ調整するのよ。」[S21](https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/loss/loss_utils.py)–[S23](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Adam.html)。「どう変えると外れが減るかを、計算で求めるの。」を一文補ってもよい。 |
| 3-6.9 | 限定すれば言える | 「実際には、文章のたくさんの位置をまとめて学んで、別の文章でもくり返すの。学習中も、先の答えは見せないようにしているわ。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S21](https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/loss/loss_utils.py)、[S24](https://huggingface.co/docs/transformers/tasks/language_modeling)。全コーパスを一度に処理する図にはしない。 |
| 3-6.10 | 限定すれば言える | 同じ予測目標の追加学習もある。「大量の文章でこの練習をして、モデルの土台を作る段階を、事前学習と呼ぶの。」[S24](https://huggingface.co/docs/transformers/tasks/language_modeling)、[S25](https://arxiv.org/abs/2203.02155)。 |
| 3-6.11 | 言える | 既存裏取りの量として正しい。既存調査からの引継ぎ。GPT-3の数字は学習で処理した量。最新例を足すなら上表の2件。 |
| 3-6.12 | 言える | 問い。ただし答えを単純な「しない」にしない。 |
| 3-6.13 | 言えない | 事前学習後の追加学習と、会話・メモリーの保持を無視。「ふつうに答えを作る間は、パラメータは変えないわ。でも、会話や保存した情報を、答えるときの手がかりにはできるの。パラメータを変える追加の学習は、また別の仕組みよ。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)/S3、[S25](https://arxiv.org/abs/2203.02155)–[S27](https://developers.openai.com/cookbook/examples/agents_sdk/context_personalization)、[S29](https://arxiv.org/abs/2005.14165)。次章へ追加学習の説明を渡してよい。 |
| 3-6.14 | 限定すれば言える | 会話形式で使えないという絶対的境界にしない。「こうして、文章の続きを予測する力が育つわ。相手の頼みに沿って答える力を整えるために、さらに学習を重ねるのよ。」[S25](https://arxiv.org/abs/2203.02155)、[S29](https://arxiv.org/abs/2005.14165)。事前学習にも指示応答データが含まれうるので、能力が完全に分離するとも示さない。 |


### K7：コンテキストウィンドウ、入力・出力、公称値

OpenAIの文脈窓は入力・出力・推論トークンを含む。Claudeも履歴と新たな出力を含み、指示・ツールの定義や結果も容量を使う。**質問の原稿だけを窓いっぱいに入れ、その外へ答えが伸びる図にはしない。** Geminiの個別モデルページのように入力と出力を別の上限で示す場合もあり、提供元の列名を保つ。[OpenAI（S31）](https://developers.openai.com/api/docs/guides/conversation-state)、[Claude（S34）](https://platform.claude.com/docs/en/build-with-claude/context-windows)、[Gemini（S36）](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)

「窓の外は見えない」は、今回渡していない原文をそのまま直接参照できない、という意味に限定する。学習済みの重みも使い、要約・圧縮した情報が残ることや、外部から取り出して再入力することもある。古い原文が外れたことと、その情報の影響が完全に消えることは違う。[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[圧縮（S32）](https://developers.openai.com/api/docs/guides/compaction)、[S26](https://help.openai.com/en/articles/8590148-memory-in-chatgpt)、[S34](https://platform.claude.com/docs/en/build-with-claude/context-windows)

長さ超過は、既定でエラーにするAPIも、設定で古い項目を削るものも、圧縮して続けるものもある。「使う側のプログラムが管理する」は使えるが、常に先頭が自動で消えると描かない。管理手順の中でモデルに要約させることもあるので、モデルが判断へ全く関わらないとも言わない。[公式SDKのtruncation（S33）](https://raw.githubusercontent.com/openai/openai-python/main/src/openai/types/responses/response_create_params.py)、[S32](https://developers.openai.com/api/docs/guides/compaction)、[S34](https://platform.claude.com/docs/en/build-with-claude/context-windows)

#### 基準日向けに確認したAPIの公称値

実取得は2026-10-14 UTC。チャット製品や全プランで使える実効枠を検証した表ではない。

| モデル | 文脈全体の上限 | 入力上限として明記 | 出力上限として明記 | 出典 |
|---|---:|---:|---:|---|
| GPT-6 Astra | 1,050,000 | 922,000 | 128,000 | [S30](https://developers.openai.com/api/docs/models/gpt-6-astra) |
| Claude Opus 5.5 | 1M | 独立値は引用しない | 128K | [S34](https://platform.claude.com/docs/en/build-with-claude/context-windows)、[S35](https://platform.claude.com/docs/en/models/overview) |
| Gemini 3.8 Flash | このページは入力・出力を別表示 | 1,048,576 | 65,536 | [S36](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash) |

「100万規模を扱えるモデルも、いくつもある」は言える。「主なモデルはみんな100万」「現在の最大が100万」は言えない。過去の文脈長年表とScout 10Mの限定は[既存調査](../llm-facts/report.md)を引き継ぐ。GPT-6 Astraは窓を約100万と丸めても入力上限は922,000であり、100万トークンの小説本文をそのまま渡せる根拠にはならない。[S30](https://developers.openai.com/api/docs/models/gpt-6-astra)

公称の長さと、どの位置・どの課題でも同じように情報を使えることは別。Lost in the MiddleとRULERはその区別を支えるが、2024年の対象モデルの低下率や形を2026年の全モデルへ移さない。今回は現行モデルの長文品質ランキングを作っていない。[S37](https://aclanthology.org/2024.tacl-1.9/)、[S38](https://arxiv.org/abs/2404.06654)


#### 3-7の全項目

| 原稿ID | 判定 | 根拠・必要な限定・言い換え案 |
|---|---|---|
| 3-7.1 | 言える | この章で扱うモデル・利用時の有限の文脈上限として可。[S30](https://developers.openai.com/api/docs/models/gpt-6-astra)–[S36](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)。学習データ量とは別。 |
| 3-7.2 | 言える | 窓の比喩は可。「イメージ」と表示し、直接扱う文脈の枠として描く。[S31](https://developers.openai.com/api/docs/guides/conversation-state)、[S34](https://platform.claude.com/docs/en/build-with-claude/context-windows)。 |
| 3-7.3 | 限定すれば言える | 「答えを作るときは、この窓に入っている文章を、手がかりにするのよ。」[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、[S31](https://developers.openai.com/api/docs/guides/conversation-state)。学習した重みも使うので、確率に影響する情報が入力だけという読み方を避ける。 |
| 3-7.4 | 言える | ここでの代表的な自己回帰生成では出力も文脈へ加わる。[S31](https://developers.openai.com/api/docs/guides/conversation-state)/S34。出力には別上限があり、推論用のtokenも容量を使う場合がある。 |
| 3-7.5 | 限定すれば言える | 「窓に入っていない元の文章は、そのままでは参照できないの。」[S31](https://developers.openai.com/api/docs/guides/conversation-state)/S32/S34、[S26](https://help.openai.com/en/articles/8590148-memory-in-chatgpt)/S27。原文が外れたことと、要約や保存情報まで消えることを区別する。 |
| 3-7.6 | 限定すれば言える | 「長くなったら、どこを残し、どこを省くか、プログラム側で管理するの。前の内容を短くまとめて残す方法もあるわ。」[S32](https://developers.openai.com/api/docs/guides/compaction)–[S34](https://platform.claude.com/docs/en/build-with-claude/context-windows)。そもそも超過エラーで止める方式もあり、自動切捨ての普遍化はしない。 |
| 3-7.7 | 言える | 2,048は既存調査からの引継ぎの既存裏取りを引継ぎ。 |
| 3-7.8 | 限定すれば言える | 「2026年には、100万トークン規模を扱えるモデルも、いくつもあるわ。」[S30](https://developers.openai.com/api/docs/models/gpt-6-astra)/S35/S36。APIの公称値で、入力と文脈全体の定義差を画面に明記する。 |
| 3-7.9 | 言える | 問い。独立の事実主張なし。 |
| 3-7.10 | 言える（実測で補完） | 「青空文庫の『坊っちゃん』を、GPT-4oの切り方で数えると、約7万6千トークンになるわ。100万トークンは、その約13冊ぶん。『こころ』なら、約8冊ぶんの量なのよ。」本文の抽出条件は下記K7の計数節。実際に入力できる冊数とは区別する。[S39](https://www.aozora.gr.jp/cards/000148/card752.html)–[S41](https://www.aozora.gr.jp/cards/000879/card127.html)、[D1](https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken)。 |
| 3-7.11 | 言える | 公称長さと利用の質の区別はS37/S38で支持。古い評価の数値を現行モデル全般へ移さない。 |


#### 青空文庫3作の計数：取得元と版

以下は青空文庫が公表したトークン数ではなく、取得した本文を本調査で数えた値。作品カードとXHTMLを2026-10-14 UTCに取得した。

- **S39** 夏目漱石『坊っちゃん』、青空文庫[図書カードNo.752](https://www.aozora.gr.jp/cards/000148/card752.html)、[XHTML本文](https://www.aozora.gr.jp/cards/000148/files/752_14964.html)。新字新仮名。底本『ちくま日本文学全集 夏目漱石』筑摩書房、1992年、入力第1刷・校正1998年第2刷。XHTML最終更新日2011-05-20。
- **S40** 夏目漱石『こころ』、青空文庫[図書カードNo.773](https://www.aozora.gr.jp/cards/000148/card773.html)、[XHTML本文](https://www.aozora.gr.jp/cards/000148/files/773_14560.html)。新字新仮名。底本『こころ』集英社文庫、1991年、入力1995年第10刷・校正1996年第14刷。XHTML最終更新日2010-10-31。
- **S41** 芥川竜之介『羅生門』、青空文庫[図書カードNo.127](https://www.aozora.gr.jp/cards/000879/card127.html)、[XHTML本文](https://www.aozora.gr.jp/cards/000879/files/127_15260.html)。新字新仮名。底本『芥川龍之介全集1』ちくま文庫、1986年、入力1997年第14刷。XHTML最終更新日2022-07-16。短編との長さの違いを見るため3作目に選んだ。

#### 本文の抽出・計数方法

1. 各XHTMLを**Shift_JIS**で復号し、Python `html.parser.HTMLParser(convert_charrefs=True)`で解析する。`class="main_text"`のdiv内だけを採用する。ページの題名・著者欄、底本・入力者などの書誌、サイトの案内を除く。本文内の章見出し・章番号・末尾の執筆年月は含める。『坊っちゃん』末尾の「（明治三十九年四月）」、『羅生門』末尾の「（大正四年九月）」も含む。この範囲を本調査での「本文」とする。
2. `rt`と`rp`の内容を捨て、ルビの親文字`rb`は残す。`class="notes"`の要素の内容を捨てる。『こころ』には改ページ注記2件と底本異同注記3件、計5件があり、すべて除去した。他の2作にはこのclassの注記はなかった。底本異同注記を消しても、青空文庫本文側の校訂済み文字は残す。
3. 外字画像は説明文や※にせず、JIS X 0213の面・区・点からUnicode文字へ復元する。画像パスの`plane-ku/plane-ku-ten.png`を読み、1面は`bytes([ku+160, ten+160])`、2面はその前へ`0x8f`を付け、Pythonの`euc_jis_2004`で復号する。今回使った対応は下表。未対応画像があればエラーで停止する実装とし、黙って落とさない。
4. 元HTMLのテキストノード内のCR・LF・TABを除く。`br`と、`div`・`h3`・`h4`・`p`の閉じ位置をLFへ変える。出来た文字列をLFで分け、各行の先頭末尾のASCII空白だけを除き、空行を除去し、LF一つで結ぶ。末尾LFは付けない。**全角の段落字下げと見出し内の空白は残す。** 句読点・漢字・かな遣いは変更せず、Unicode正規化もしない。
5. この文字列のUnicodeコードポイント数を「文字数」とする。主列には改行・字下げを含む。参考としてPython `re.sub(r'\s','',text)`後の文字数も示す。token数は、空白除去版ではなく**主列の本文そのもの**を一度に `Tiktoken(o200k_base).encode(text, [], [])` で計数した値。通常テキスト扱いであり、BOS/EOS・チャット枠・質問・回答用の空きは加えていない。全作で`decode(ids) === text`を確認。
6. 換算は `1_000_000 / その作品一つのtoken数`。作品を複数つなげた文章の実測ではなく、単純な量の比。境目でtokenizationが変わる可能性や、書名・指示文を足す消費量はこの比に含まない。

外字の復元結果：

| 作品 | 面区点 | 復元文字・コードポイント | 出現回数 |
|---|---|---|---:|
| こころ | 1-84-77 | 挘 U+6318 | 1 |
| こころ | 1-87-64 | 燄 U+71C4 | 1 |
| こころ | 1-84-59 | 愷 U+6137 | 1 |
| こころ | 1-88-85 | 睜 U+775C | 1 |
| 羅生門 | 2-12-93 | 扭 U+626D | 1 |
| 羅生門 | 1-88-81 | 眶 U+7736 | 2 |

『坊っちゃん』の本文に外字画像はなかった。『こころ』4画像、『羅生門』3画像を復元した。ルビと注記を除去しつつ本文の文字を失わないための処理で、現代の常用字体への置換ではない。

#### 実測結果

以下はS39〜S41の公式なtoken数ではなく、本調査が上記方法で測った値。

| 作品 | 文字数（改行・字下げ込み） | 参考：空白類を除く文字数 | 本文行数 | o200k_base token数 | 100万tokenとの比 | 画面・語りの丸め |
|---|---:|---:|---:|---:|---:|---|
| 坊っちゃん | 88,972 | 88,272 | 482 | **75,597** | 13.228038… | 約13冊ぶん |
| こころ | 162,249 | 160,234 | 1,331 | **126,973** | 7.875690… | 約8冊ぶん |
| 羅生門 | 5,749 | 5,682 | 37 | **4,851** | 206.143063… | 短編約206編ぶん |

『羅生門』は短編一作を数えたので「206冊」とは呼ばない。『坊っちゃん』と『こころ』の2例を本文で使えば、小説の長さによる違いも示せる。「日本語の小説なら一律に何冊」とは一般化しない。丸めた約8冊は、8冊全文を実際に入力できるという保証ではない（126,973×8=1,015,784）。上記K7で確認した入力・出力の容量差を合わせて、**100万という量の物差し**として使う。

#### 再取得と抽出結果を照合するハッシュ

SHA-256。生XHTMLは取得バイト列、本文は上記正規化後の文字列をUTF-8にしたバイト列（BOM・末尾LFなし）。

| 作品 | 生XHTMLのbyte数 | 生XHTML SHA-256 | 本文UTF-8 SHA-256 |
|---|---:|---|---|
| 坊っちゃん | 364,145 | `b30b6f1cb8c8ab8ec71b4b37488ccc8450402d09090943500d121499b9a1eaa1` | `47b8f87ccc5c32d0781499f2e70e441d252282b2c90a847e1eb2ca75e8daa3fc` |
| こころ | 618,230 | `2f993b95343af9ca631d6fc8f050371d0d6df3423a4541669dee89430257b871` | `4f2d714a3494c2d590c99f7befb627be56df124669ace015c39330d83993447e` |
| 羅生門 | 21,933 | `96aa53761067394c36b615f964dd7f8af563f09aebcc6ee0c2b3c46b6038d832` | `a9ab0e5860dde40abf9a023ed02a07c8a072e5bc93a8921965cf503217692037` |

実行と検算：取得は3作品の有限集合、1件2,000,000 byteを上限に読み込み、通信timeout 10秒。計数の前に本文1件400,000文字未満を確認。Node heap上限512 MiB、Node子process timeout 35秒、処理全体を外部`timeout 90s`で制限。子processは同期完了を回収した。出力は計数・ハッシュ・外字一覧等だけ。小さい合成HTMLでルビ・注記除去と全角字下げ保持を先に確認し、不均衡なタグ入力では短いエラーで停止することも確認してから本文に適用。全作で全文のencode/decode一致をboolean比較で確認した。巨大な差分出力やモデル推論は行っていない。

#### 3-7.10に入れられる文

原稿の未記入行は、今回の実測値を入れ、計数条件を添えれば**言える**。

> 青空文庫の『坊っちゃん』を、GPT-4oの切り方で数えると、約7万6千トークンになるわ。100万トークンは、その約13冊ぶん。『こころ』なら、約8冊ぶんの量なのよ。

画面の注記案：`青空文庫の本文をo200k_baseで計数。ルビ・注記を除く。2026-10-14取得。` 詳細の文字数・token数・換算式は上表に従う。これを特定APIへ投入可能な冊数と結びつけず、回答用の容量や入力上限が別にある説明へつなぐ。『羅生門』は比較表の補足にできるが、語りに必ず入れる必要はない。


## K8：用語と比喩

日本語の唯一の規範や使用頻度を調べたものではなく、公式日本語文書・日本語を使う研究開発者に実例がある表記を採用する、という結論。原稿の7語はそのまま使える。用語を避けきるよりも、働きを説明した直後に名前を結び付けるとよい。

| 用語 | 原稿で使う表記・別表記 | めたんの口調の説明案と限定 | 根拠 |
|---|---|---|---|
| context window | コンテキストウィンドウ。空白を入れる「コンテキスト ウィンドウ」もある | 「一度に扱える文章の範囲を、コンテキストウィンドウと呼ぶの。」容量をtokenで示す。入力・出力等の内訳はK7の提供元別定義に従う。 | [S43](https://platform.claude.com/docs/ja/about-claude/glossary)、[S31](https://developers.openai.com/api/docs/guides/conversation-state)/S34/S36 |
| vocabulary | 語彙 | 「この切り方で使う、トークンの一覧を、語彙と呼ぶの。」知っている単語や事実の総数ではない。 | [S44](https://huggingface.co/docs/transformers/ja/main_classes/tokenizer)/S45、[S5](https://github.com/openai/tiktoken)–[S7](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken/core.py) |
| embedding | 埋め込み。エンベディングも使われる | 「番号に対応する数の並びを、表から取り出すの。このように、トークンを数の並びで表すのが、埋め込みよ。」この章は入力埋め込み。検索用の文書全体の埋め込みとは区別する。 | [S42](https://developers.google.com/machine-learning/glossary?hl=ja)、[S2](https://github.com/openai/gpt-2/blob/master/src/model.py) |
| attention | アテンション。アテンション機構／注意機構もある | 「自分と、それより前のトークンを、どれだけ参考にするかを計算して、情報を取り込むの。」本章の因果self-attentionに限定。 | [S42](https://developers.google.com/machine-learning/glossary?hl=ja)/S44、[S11](https://arxiv.org/html/1706.03762v7)/S12 |
| parameter | パラメータ | 「計算のしかたを決める、学習で調整する数を、パラメータと呼ぶわ。」表の各値や変換の係数。入力ごとに求めるattention重み・途中の表現とは分ける。 | [S42](https://developers.google.com/machine-learning/glossary?hl=ja)、[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)、K6 |
| pretraining | 事前学習。事前訓練／事前トレーニングもある | 「大量の文章で練習して、モデルの土台を作る段階を、事前学習と呼ぶの。」この章の次token予測を説明する。後にも追加学習がある。 | [S43](https://platform.claude.com/docs/ja/about-claude/glossary)/S45、[S21](https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/loss/loss_utils.py)/S24/S25 |
| temperature | 温度。temperature | 「どの候補へ確率を集めるか、その偏りを調整する設定が、温度よ。」学習した係数を変える設定ではなく、生成時の選び方の設定。一般向けの「選び方のばらつき」も可。 | [S42](https://developers.google.com/machine-learning/glossary?hl=ja)/S43、[S16](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)/S19 |

#### 「数の並び」と「周りを見る計算」の判断

1. **数の並び＝ベクトルは使える**。ここでは実数を決まった順に並べた表現として説明し、「こうした数の並びを、ベクトルと呼ぶの。」と一度名前を添えればよい（[S42](https://developers.google.com/machine-learning/glossary?hl=ja)、[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)）。数学のベクトル一般の定義をすべて扱う必要はない。ただし、文章全体のtoken IDの並びと、一つのtokenを表す数の並びは、見た目を分ける。「番号列→一つの番号に一つのベクトル→文脈に応じたベクトル」の段階を揃える。
2. **各成分への意味の札は付けない**。第1成分が動物度、第2成分が食べ物度、という表は今回測定しておらず、そのように読めると保証できない。単語ごとに数値を置く場合は「例」、平面上の配置・向きは「イメージ」。12,288個の数という実際のモデルの次元と、説明用の2次元配置は別（K3）。
3. **周りを見る計算だけでは限定不足**。「周り」は後方や近所だけにも聞こえる。本章では「自分と前のトークンを参考にする計算」とし、対象がその位置までであることを図でも示す。アテンション一般を常に前だけと定義するのではなく、この章の因果型の説明だと冒頭の範囲を維持する（[S11](https://arxiv.org/html/1706.03762v7)/S12）。
4. **「重み」は二種類を混同しない**。学習する変換の重みと、入力から計算するattentionの重みは異なる。後者は語りでは「参考にする度合い」と呼べば、3-6のパラメータ説明へ自然につながる（[S2](https://github.com/openai/gpt-2/blob/master/src/model.py)/S12）。入力ごとにベクトルや参考の度合いが変わることは、利用時にモデルのパラメータが書き換わることではない。
5. **「正解」「確率」「覚える」は補足が要る**。学習の正解は本文に実際に続いたtoken、確率は次tokenの選択の分布、会話で覚えることには外部の保存・参照もある。事実として正しい確率、唯一の正しい続き、すべてが重みへの記憶、という像を残さない（K5・K6）。

以上は資料の単なる翻訳ではなく、既に確認した計算と原稿の文脈を合わせた本調査の編集上の判断。利用者による理解度の実験を行ったわけではない。


## 全項目の集計

| 原稿 | 項目数 | 言える | 限定すれば言える | 言えない |
|---|---:|---:|---:|---:|
| 3-1 | 10 | 6 | 4 | 0 |
| 3-2 | 12 | 9 | 3 | 0 |
| 3-3 | 11 | 5 | 6 | 0 |
| 3-4 | 13 | 6 | 7 | 0 |
| 3-5 | 11 | 5 | 6 | 0 |
| 3-6 | 14 | 7 | 4 | 3 |
| 3-7 | 11 | 7 | 4 | 0 |
| 合計 | **82** | **45** | **34** | **3** |

## 残る不確実性と調査の限界

- 日本語の意味配置、類推、アテンションの矢印、出力確率は実モデルで測っていない。模式図としての成立条件を示した。英語の一語一トークン率も未測定。
- 公開GPT-2・Llama等の実装は、説明の仕組みを確認する例。商用最新版の非公開構造、内部のデコード、全制御トークン、製品UIの更新周期は確定していない。
- 現行の文脈値は取得時の公式API仕様。各チャット製品・プランの実効枠や現行モデルの長文品質は横断比較していない。混成構造を含む全モデルの構成割合も未測定。
- ChatGPTのメモリーは公式の機能説明を確認した。Cookbookの実装例をChatGPT内部の実装と同一視していない。利用時に重みを変える特殊な研究方式も網羅していない。
- 計数は第三者移植js-tiktoken 1.0.21による。公式辞書との全行・ハッシュ照合、短文検算、全文の往復一致を確認したが、公式Python tiktokenとの独立した二重計数はしていない。版、表記、改行、抽出条件、tokenizerを変えれば数字は変わる。
- GitHubのmain/master等は取得時点の本文を読んだもので、多くはcommit固定ではない。再現性が特に必要な辞書と小説の入力・抽出結果にはハッシュを残した。公式文書の現在値は今後変わりうる。
- 語りの分かりやすさの判断は、資料と原稿を照合した編集上の判断。一般の視聴者による理解度実験ではない。モデル実行・学習・音声合成・GUI確認は実施していない。

## 問いと計画の経緯

当初の問いは「3章の各文を一次資料で判定し、誤解を残す簡略化を直す」。原稿照合から用語まで10単元に分け、全単元を完了した。途中で、個別の数値だけでなく、モデルとアプリ、入力依存の値と学習する値、容量と能力の境界を揃える必要が明確になった。これをlogのPlan revision 1に記録した。元の問いは変えていない。

必要な派生問いとして、モデルの内外の境界、単語の図と実トークンの違い、アテンション重みとパラメータの違い、100万の窓へ100万の入力を渡せるか、青空文庫の外字を落とさず復元できるかを追究した。いずれも既存単元内で解決し、単元の追加・削除・統合はなかった。

実モデルで日本語の図を測る方法、英語の分割率、非公開の実装、製品別の枠、現行長文品質の比較は、今回の原稿を正確な基本説明へ直すためには不要なので保留した。

## 推奨する次の作業

1. 3-6.4・3-6.8・3-6.13を優先して直し、34件の限定を語りと図へ反映する。追加学習の説明を次章へ渡す場合も、通常の利用中の固定性とは分ける。
2. 章全体で、モデル本体の枠、GPT-3最大版とGPT-4oの切り方の札、「例」「イメージ」の札を統一する。「かける」の一箱は単語単位であることを示す。
3. 小説の語りには『坊っちゃん』約13冊ぶんと『こころ』約8冊ぶんの量を使い、本文抽出条件と取得日を制作記録へ残す。これを実際に投入できる冊数の案内に転用しない。
4. 実測の意味配置やアテンション図が必要になった場合だけ、対象モデル、層・head、語、距離・投影法を決めて別調査する。製品の入力可能量を案内する場合も、製品・プラン・利用経路を指定して確認する。

原稿・実装へ反映する工程は本調査に含めていない。今回の変更対象は本reportとappend-onlyのlogのみ。

## 出典

今回のS1〜S45、D1・D2の取得日は**2026-10-14 UTC**。下記の公表日・版・更新表示は取得日とは別。詳細な取得経路、取得できなかったURLと代替、実行条件は[log](log.md)に記録した。



- **S1** OpenAI, [Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses)、2026-10-14 UTCに公式docsツールで本文取得。更新日記載なし。通常は全出力後にHTTP応答し、streamingは生成中から出力先頭の表示・処理を始められると説明。SSEの`response.output_text.delta`はテキスト差分である。モデル計算・トークン・画面更新の1対1対応を保証する資料ではない。Unit 2で生成コードと組み合わせて判定する。
- **S2** OpenAI GPT-2 [`src/model.py`](https://github.com/openai/gpt-2/blob/master/src/model.py)、master、`model`／`attn`／`block`。Webで全文取得。
- **S3** OpenAI GPT-2 [`src/sample.py`](https://github.com/openai/gpt-2/blob/master/src/sample.py)、master、`sample_sequence`。Webに加えて[raw本文](https://raw.githubusercontent.com/openai/gpt-2/master/src/sample.py)を読み、処理順を確認。
- **S4** OpenAI GPT-2 [`src/interactive_conditional_samples.py`](https://github.com/openai/gpt-2/blob/master/src/interactive_conditional_samples.py)、master、`interact_model`。[raw本文](https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py)も確認。
- **S5** OpenAI tiktoken [README](https://github.com/openai/tiktoken) および公式の教育用BPE実装 [`_educational.py`](https://github.com/openai/tiktoken/blob/main/tiktoken/_educational.py)。`encode`、`bpe_encode`、`bpe_train`、`decode`を確認。
- **S6** OpenAI [`openai_public.py`](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken_ext/openai_public.py)：事前分割の正規表現、辞書URL、期待SHA-256、特殊トークンの定義。
- **S7** OpenAI [`core.py`](https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken/core.py)：`encode_ordinary`、`encode`、`decode_single_token_bytes`。特殊トークンの文字列の扱い、UTF-8でない断片の復号を確認。
- **S8** OpenAI [Understanding and counting tokens](https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens)：文字・単語の一部・単語全体・句読点となりうること、空白・大文字小文字で変わること。取得画面は「Updated: 14 days ago」と表示。英語の平均的目安は約4文字／token・約0.75語／tokenだが、これは「一単語一トークン」の割合の実測値ではない。
- **S9** Mikolov et al., 2013, [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/pdf/1301.3781)、v3（2013-09-07）、§1、§1.1、§§2–4。原論文本文を取得。2013年の類推の事実はUnit 1から引き継ぎ、今回は単語ベクトルと現代の入力埋め込みの適用範囲を確認。
- **S10** Ethayarajh, 2019, [How Contextual are Contextualized Word Representations?](https://aclanthology.org/D19-1006/)、[論文PDF](https://aclanthology.org/D19-1006.pdf)。静的な単語表現と、BERT・ELMo・GPT-2の各層が作る文脈依存の表現を区別する研究。要旨と論文を取得。今回は研究の対象と定性的結論だけを用い、数値を一般化しない。
- **S11** Vaswani et al., [Attention Is All You Need](https://arxiv.org/html/1706.03762v7)、v7（2023-08-02、研究初出2017年）、§§3.1–3.5。自己位置を含む因果マスク、Q/K/V、重み付き和、位置ごとのFFN、残差・正規化、原型のencoder–decoder構成を確認。
- **S12** Meta Llama 3 [`llama/model.py`](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/model.py)、main取得時点。`Attention.forward`、`apply_rotary_emb`、`FeedForward`、`TransformerBlock.forward`、`Transformer.forward`を確認。Q/Kの回転、因果マスク、重み付き和と出力射影、残差、RMSNorm、FFNの実装。
- **S13** NVIDIA, [Nemotron-H公式紹介](https://research.nvidia.com/labs/adlr/nemotronh/)（ページ表示の公開日2025-03-21）、および [Nemotron-H原論文v1](https://arxiv.org/html/2504.03624v1)（2025年）。MambaとTransformerを組み合わせる公式の反例。初めに試した `https://research.nvidia.com/labs/nemotron/Nemotron-H/` は取得エラーだったので、公式研究サイト内の現行ページを検索して取得した。
- **S14** 日本漢字能力検定協会・漢字ペディア [「かける・かかる」](https://www.kanjipedia.jp/sakuin/doukunigi/items/0000942800)。電話と橋の用例・漢字の使い分け。
- **S15** 小学館『デジタル大辞泉』『精選版 日本国語大辞典』 [「掛ける」コトバンク配信本文](https://kotobank.jp/word/%E6%8E%9B%E3%81%91%E3%82%8B-461286)。辞書の出典表記を確認。『精選版 日本国語大辞典』の眼鏡を掛ける用例を確認。本文抽出では大辞泉の全語義が表示されず、電話の用例は検索表示のみでもあったため、電話・橋はS14を主な裏付けとする。
- **S16** Meta Llama 3 [`llama/generation.py`](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/generation.py)、main取得時点。`generate`（最終位置のlogits、温度、argmax、長さと終了判定）、`sample_top_p`（候補の選別、再正規化、抽選）を確認。
- **S17** Meta Llama 3 [`llama/tokenizer.py`](https://raw.githubusercontent.com/meta-llama/llama3/main/llama/tokenizer.py)、main取得時点。`stop_tokens`に`<|end_of_text|>`と`<|eot_id|>`を登録し、後者を会話のturn終了と定義。
- **S18** Leviathan, Kalman & Matias, 2023, [Fast Inference from Transformers via Speculative Decoding](https://proceedings.mlr.press/v202/leviathan23a.html)、[論文PDF](https://proceedings.mlr.press/v202/leviathan23a/leviathan23a.pdf)。要旨、Algorithm 1、§3の生成数と計算量の区別を確認。
- **S19** OpenAI [Create chat completion](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)。`temperature`、`top_p`、`seed`、`max_completion_tokens`、`stop`、`finish_reason`。公式docs検索で本文を確認。公式fetchツールは同URLの.mdに404を返したため、native webでHTML本文を取得して照合した。更新日記載なし。
- **S20** OpenAI Cookbook [How to make your completions outputs consistent with the new seed parameter](https://developers.openai.com/cookbook/examples/reproducible_outputs_with_the_seed_parameter)。seed・system_fingerprintが同じでも完全一致を保証しないという説明と、バックエンドの重み・数値設定等の違いを確認。旧モデルを使う再現性の説明資料であり、現行全モデルでseedが使えるという根拠にはしない（S19はseedをdeprecatedと表示）。
- **S21** Hugging Face Transformers [`loss_utils.py`](https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/loss/loss_utils.py)、main取得時点、`ForCausalLMLoss`と`fixed_cross_entropy`。次位置へずらした教師、無視する位置、tokenとbatchをまとめた交差エントロピー。
- **S22** PyTorch [CrossEntropyLoss](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html)。stableから2.14へリダイレクト。クラス番号を教師にする損失式、mean／sum、ignore_indexを確認。
- **S23** PyTorch [Adam](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Adam.html)。stableから2.14へリダイレクト。勾配と過去のモーメントを使う更新式、最適化対象のparameter groupsを確認。
- **S24** Hugging Face [Causal language modeling](https://huggingface.co/docs/transformers/tasks/language_modeling)。因果的予測、文章を区間に分ける前処理、複数例をbatchにすること、学習と推論の別を確認。サンプルは追加学習なので、これだけを事前学習の実績とは扱わない。
- **S25** Ouyang et al., 2022, [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155)、[PDF](https://arxiv.org/pdf/2203.02155)、要旨・§3.5。GPT-3から教師あり追加学習、報酬モデル、人の評価に基づく強化学習へ進む実例。
- **S26** OpenAI [Memory in ChatGPT](https://help.openai.com/en/articles/8590148-memory-in-chatgpt)（旧memory-faq URLから転送）。取得時表示はUpdated: 25 days ago。過去会話・保存情報を応答へ参照する機能と、保存場所、モデル改善用データ利用の説明を確認。
- **S27** OpenAI Cookbook [Context Engineering for Personalization — State Management with Long-Term Memory Notes](https://developers.openai.com/cookbook/examples/agents_sdk/context_personalization)。公式docs検索後にfetchで本文取得。状態に保存し、次の実行のsystem promptへ注入する具体例。ChatGPT内部実装を開示した資料ではない。
- **S28** Qwen Team, [Qwen3: Think Deeper, Act Faster](https://qwenlm.github.io/blog/qwen3/)、ページ表示2025-04-29、Pre-training節。約36兆、最初の30兆超と追加5兆、合成データを含むこと。関連[Technical Report v1](https://arxiv.org/html/2505.09388v1)も取得したが、今回の数値は公式紹介の明記を根拠にする。
- **S29** Brown et al., 2020, [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)、要旨の勾配更新・fine-tuningなしで文中の例に適応する記述。数値諸元はUnit 1の既存裏取りから引継ぎ、再調査しない。
- **S30** OpenAI [GPT-6 Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra)。公式docsツールで本文取得。現行snapshotのcontext window 1,050,000、max input 922,000、max output 128,000を別々に明記。
- **S31** OpenAI [Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)、Managing the context window節。公式docsツールで本文取得。窓は入力・出力・推論tokenを含む。過去の出力を次の入力へ渡す説明も確認。
- **S32** OpenAI [Compaction](https://developers.openai.com/api/docs/guides/compaction)。公式docsツールで本文取得。閾値で文脈を圧縮し、過去の重要な状態を少ないtokenの不透明な項目として持ち越す説明。通常の文章の要約だけに限定されない。
- **S33** OpenAI Python SDK [`response_create_params.py`](https://raw.githubusercontent.com/openai/openai-python/main/src/openai/types/responses/response_create_params.py)、main取得時点、`truncation`。`auto`は会話の先頭項目から削り、既定の`disabled`は超過で400 error。公式[Responses create API reference](https://developers.openai.com/api/reference/resources/responses/methods/create)も検索したが、docs fetchは参照先だけを返し、Web取得はサイズ上限で失敗したため、実際に本文を開けた公式SDKの記述で確認した。
- **S34** Anthropic [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)。定義、入力・出力・thinking・toolsの計数、モデル別1M、要約による継続、超過時の扱いを確認。
- **S35** Anthropic [Models overview](https://platform.claude.com/docs/en/models/overview)。Opus 5.5のcontext 1Mとmax output 128Kを照合。旧`about-claude/models/overview`から転送。
- **S36** Google [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)。ページ更新表示2026-09-02 UTC。Input token limit 1,048,576とOutput token limit 65,536を別々に明記。
- **S37** Liu et al., 2024, [Lost in the Middle: How Language Models Use Long Contexts](https://aclanthology.org/2024.tacl-1.9/)、TACL 12:157–173、論文要旨。複数文書QAとkey-value検索で情報の位置を変える実験。
- **S38** Hsieh et al., 2024, [RULER: What's the Real Context Size of Your Long-Context Language Models?](https://arxiv.org/abs/2404.06654)、v3（2024-08-06）、論文要旨。検索だけでなく複数段の追跡・集約を含む合成評価。17モデル、13課題。
- **S39** 夏目漱石『坊っちゃん』、青空文庫[図書カードNo.752](https://www.aozora.gr.jp/cards/000148/card752.html)、[XHTML本文](https://www.aozora.gr.jp/cards/000148/files/752_14964.html)。新字新仮名。底本『ちくま日本文学全集 夏目漱石』筑摩書房、1992年、入力第1刷・校正1998年第2刷。XHTML最終更新日2011-05-20。
- **S40** 夏目漱石『こころ』、青空文庫[図書カードNo.773](https://www.aozora.gr.jp/cards/000148/card773.html)、[XHTML本文](https://www.aozora.gr.jp/cards/000148/files/773_14560.html)。新字新仮名。底本『こころ』集英社文庫、1991年、入力1995年第10刷・校正1996年第14刷。XHTML最終更新日2010-10-31。
- **S41** 芥川竜之介『羅生門』、青空文庫[図書カードNo.127](https://www.aozora.gr.jp/cards/000879/card127.html)、[XHTML本文](https://www.aozora.gr.jp/cards/000879/files/127_15260.html)。新字新仮名。底本『芥川龍之介全集1』ちくま文庫、1986年、入力1997年第14刷。XHTML最終更新日2022-07-16。短編との長さの違いを見るため3作目に選んだ。
- **S42** Google for Developers [機械学習の用語集（日本語）](https://developers.google.com/machine-learning/glossary?hl=ja)。アテンション、埋め込み／エンベディング ベクトル、パラメータ、温度の項目を確認。言葉の使用例と浮動小数点数の配列という説明に使用し、各モデルの詳細仕様はこの一般向け用語集から導かない。
- **S43** Anthropic [用語集（日本語）](https://platform.claude.com/docs/ja/about-claude/glossary)。コンテキストウィンドウ、事前訓練、temperature（温度）の表記、温度0でも完全決定的でないという注意を確認。
- **S44** Hugging Face [Tokenizer（日本語）](https://huggingface.co/docs/transformers/ja/main_classes/tokenizer)。トークナイザー、語彙、トークン文字列とIDの変換の表記を確認。日本語ページのナビゲーションには「注意機構」もある。説明の日本語には不自然な箇所があるため、原稿へ丸写しせず、表記の用例とする。
- **S45** 産業技術総合研究所 [日本語に強い大規模言語モデル「Swallow」を公開](https://www.aist.go.jp/aist_j/press_release/pr2023/pr20231219/pr20231219.html)、公開日2023-12-19。モデル開発者自身による日本語の「語彙」「継続事前学習」の使用例。今回、Swallowの性能や数値は原稿へ追加しない。


- **D1** 公式辞書 [o200k_base.tiktoken](https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken)、取得SHA-256 `446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d`。
- **D2** 公式辞書 [cl100k_base.tiktoken](https://openaipublic.blob.core.windows.net/encodings/cl100k_base.tiktoken)、取得SHA-256 `223921b76ee99bde995b7ff738513eef100fb51d18c93597a113bcffe865b2a7`。



### 既存調査から引き継いだ資料

- [llm-facts/report.md](../llm-facts/report.md)（外部取得2026-10-09）：語彙数、GPT-3最大版の次元・層数・パラメータ数と文脈・学習量、Llama 3の学習量、2013年類推、Transformer、文脈長年表。元資料は[GPT-3論文](https://arxiv.org/pdf/2005.14165)、[Llama 3公開記事](https://ai.meta.com/blog/meta-llama-3/)、[Llama 3モデルカード](https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md)、[tiktokenのモデル対応](https://github.com/openai/tiktoken/blob/main/tiktoken/model.py)等。同報告の限定を維持した。
- [compose-facts/report.md](../compose-facts/report.md)（外部取得2026-10-14）：自己回帰の依存順と実行回数の違い。推測的デコードの原論文は今回S18でも確認。
- [intro-facts/report.md](../intro-facts/report.md)（外部取得2026-10-13）：例と実測の区別、事前学習と追加訓練の区別。
- ローカルの[AGENTS.md](../../AGENTS.md)、[spec §6.6](../../docs/spec.md)、[対象README](../../decks/llm/README.md)を2026-10-14 UTCに読んだ。これらは制作上の制約・判定対象で、外部の技術的事実を証明する一次資料とは区別した。
