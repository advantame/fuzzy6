# ChatGPT と「穴埋め」を結ぶ語り：事実確認

## 要約と判定方法

**ChatGPT の文章生成と、続きを予測する言語モデルの説明は結びつけられる。** 主語を「ChatGPT の中の LLM」に絞ると、モデルの文章生成と、追加学習・指示・ツールを備えた製品の働きを区別しやすい。現行の公式概説も次の語の予測で文章生成を説明している。ただし、最新の全モデルIDの内部方式まで個別の技術資料で確認できたわけではない。[公式ヘルプ（O7）](https://help.openai.com/en/articles/7842364-how-chatgpt-and-our-foundation-models-are-developed)、[初代発表（O1）](https://openai.com/index/chatgpt/)

**GPT-3 の実測は使えるが、「大きさだけ」「予測だけ」「鍛えるほど必ず」を弱める必要がある。** 共通の事前学習の枠組みで規模を変えた8モデルを比較し、課題別の重み更新なしで測った実験である。few-shot では入力に解答例を与える。LAMBADA が測るのは前の文脈を使う末尾の一語の予測で、推理小説の結末推理そのものではない。[Brown（P3）§2・Table 2.1・H.1](https://arxiv.org/pdf/2005.14165)、[Paperno（P5）§2–3](https://aclanthology.org/P16-1144.pdf)

**花形の公式配布素材は OpenAI の「Blossom」で、ファイル名は monoblossom。** ChatGPT の公式アプリアイコンにも使われるが、確認したZIPに「ChatGPT専用SVG」という名前の素材はない。黒白の配布版を改変せず、余白を取り、OpenAIによる提供・推奨と誤解させない形で製品紹介に使う案を示す。教育用・限定公開だから無条件に使えるという例外は確認できなかった。[ブランドガイド（B1）](https://openai.com/brand/)、[公式配布ZIP（B2）](https://cdn.openai.com/brand/OpenAI-Logos-2025.zip)、[公式アプリアイコン（B3）](https://help.openai.com/en/articles/7905742-what-does-the-official-chatgpt-ios-app-icon-look-like)

対象は依頼のD1〜D9とロゴ。**基準日・外部資料の取得日は2026-10-14 UTC**。発表日・論文の版は別に記す。日付のない公式ページは取得時点の説明として扱い、相対的な更新表示から厳密な改訂日は推定しない。O/P/B番号は[調査ログ](log.md)と共通で、末尾の資料表に所在と短い引用をまとめた。基準日より後の資料は使用していない。

判定は「言える／限定すれば言える／言えない」。質問・会話上の印象と、技術的な断定を分ける。短い言い換えは事実の範囲を示す案で、最終原稿の採否は決めていない。指定されたAGENTS.md、spec冒頭、既存のN6〜N8とcompose-factsを先に読んだ。書き込んだのはこの調査のlog.mdとreport.mdのみ。デッキの実装・原稿・Git操作、モデル実行、音声合成、ロゴ素材の組込みは行っていない。

## D1〜D9 の判定と短い案

| 項目 | 判定 | 短い案・条件 | 主な根拠 |
|---|---|---|---|
| D1 | 限定すれば言える | 元の「ChatGPTみたいなAIのことなのだ？」は、D2で訂正される質問として残せる。単独で正しい定義にはしない。区別を先に伝えるなら「ChatGPTみたいなAIに使われているものなのだ？」 | O1/O2/O7 |
| D2 | 言える | 「ChatGPTも、中核にはLLMがあるの。」現在の製品を指す文脈。初代発表がモデルにもChatGPTの名前を使った歴史は別記。 | O1/O2/O4/O7/O10 |
| D3 | 言える | 「人と話すみたいに答えて、問題も解くのだ。」という印象・能力例。人間と同じ仕組みや常に正答を意味させない。 | O1/O3 |
| D4 | 限定すれば言える | 「ChatGPTの中のLLMも、続きを予測して、答えの文を組み立てるの。」現行製品の公式概説を根拠にし、最新全IDの詳細保証にはしない。 | O3/O6/O7 |
| D5 | 限定すれば言える | 「文章には、知識も、考える手順も書かれているわ。実際、続きを予測する学習で、いろいろな問題の成績も上がってきたの。」規模・データ・計算の条件を出典欄へ。 | P1/P2/P3/P4 |
| D6 | 限定すれば言える | 「続きを予測する学習で、どうして問題まで解けるのだ？」とし、現在のChatGPTの全訓練を予測だけとしない。 | P3/O1/P4 |
| D7 | 限定すれば言える | 「実際に、続きを予測するように学んだモデルを比べると、大きなモデルでは、知識や計算、前の文脈を使う問題の正答率が、全体として高くなったの。」図注にGPT-3、例を入力、課題別重み更新なし。 | P3/P5/P6/P7 |
| D8 | 限定すれば言える | 「こうして学んだLLMが、ChatGPTのようなAIの土台になっているの。人の指示に答えるための学習も、さらに重ねているわ。」 | O1/O2/O4/P4 |
| D9 | 言える | 原文の留保は維持可能。測定と解釈を揃える案：「ただ、正しく答えられることを、どこまで『理解している』と言えるのかは、いまも議論があるの。」 | L1/P8/P9/P10 |

## D1〜D4：ChatGPT、モデル、生成方式を分ける

### D1・D2：現在の製品と、初代発表の呼び方

D1は視聴者の連想を表す問いとして、D2で区別するなら残せる。単独で「LLMとはChatGPTのような製品のこと」と定義する文にはしない。

D2の「中核にあるのがLLM」は妥当である。2023年のGPT-4発表はモデルをChatGPTとAPI経由で提供すると説明し、同年のプラグイン発表は検索・計算・外部サービスを加える構成を示す。一方、2022年の初代発表はChatGPTをモデル名としても使っているため、「ChatGPTは一度もモデルを指したことがない」とは言えない。[O1 Methods](https://openai.com/index/chatgpt/)、[O2 冒頭・Steerability](https://openai.com/index/gpt-4-research/)、[O4 Overview](https://openai.com/index/chatgpt-plugins/)

追加学習はモデル自体を変える工程で、システム指示や実行ツールと同じ種類の外付け部品ではない。初代ChatGPTはGPT-3.5系列を対話例と人の比較評価によって追加学習している。システム指示は生成時の振る舞いを指定し、ツールは検索・計算などを実行する。2023年のプラグイン記事は歴史的証拠であり、現在の機能一覧としては使わない。[O1 Methods](https://openai.com/index/chatgpt/)、[O2 Steerability](https://openai.com/index/gpt-4-research/)、[O4](https://openai.com/index/chatgpt-plugins/)

### D3：「人みたい」は印象として使える

対話への応答や問題を解く能力は公式発表・技術報告で裏付けられる。ずんだもんの印象としての「人みたいに答えて、問題も解く」は使える。ただし人間と同じ仕組み・理解、常に正しい解答という意味は含めない。両資料は誤答や推論上の限界も記す。[O1 Limitations](https://openai.com/index/chatgpt/)、[O3 Abstract・§1–2](https://cdn.openai.com/papers/gpt-4.pdf)

### D4：固有モデルの技術開示と、現行製品の概説

| 確認対象 | 公式に確認できたこと | 留保 |
|---|---|---|
| GPT-4 | 次トークン予測による事前学習、Transformer型、RLHF（O3 pp.1–2） | 詳細な構造・規模・データ構成等には非公表部分がある |
| GPT-4o | 自己回帰型のomni modelと明記（O6 Introduction） | これだけで後続全モデルの仕様を確定しない |
| 現行ChatGPTの一般向け説明 | 次の語を予測して応答を生成するとの説明があり、トークンも補足される（O7） | 個々のモデルIDの詳細なデコード手順の開示ではない |
| GPT-4.5・GPT-5・GPT-6系の確認資料 | 事前学習・追加訓練・推論等の説明を確認（O11、O13〜O16） | 調べた資料では、最新各IDの自己回帰方式を直接確定できなかった |

固有モデルの明示として確認できた例はGPT-4/GPT-4oまで。一方、**現在のChatGPTに関する一般向けの公式説明も根拠になる**。「GPT-4oより後は一切語れない」「最新全モデルの方式が公表済み」のどちらにも寄せない。全版・全IDの網羅監査ではなく、検索語が見つからなかったことを非公表の完全な証明にもしない。[O3](https://cdn.openai.com/papers/gpt-4.pdf)、[O6](https://openai.com/index/gpt-4o-system-card/)、[O7](https://help.openai.com/en/articles/7842364-how-chatgpt-and-our-foundation-models-are-developed)

基準日時点の公式発表ではChat向けGPT-6 Sol/Lunaの展開が示され、ヘルプは有料ChatのSol、ProのAstra、Work/CodexのGPT-6.1 Solを区別している。ただしFree/Goについて、10月7日付発表・release notes・system cardのGPT-6 Lunaと、取得したモデルヘルプのGPT-5.6 Lunaに不一致がある。実アカウント別の稼働状況や不一致の理由は確定できない。**語りに最新モデル名を固定する必要はない。**[O8](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt)、[O9 2026-10-07](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)、[O10 Availability](https://openai.com/index/gpt-6-for-everyone/)、[O11 §1](https://deploymentsafety.openai.com/gpt-6-october)

| D4の案 | 評価 |
|---|---|
| 「ChatGPTも、穴埋めを重ねて……」 | 文章生成の概説としては支持できるが、製品の全処理と混同されやすい |
| 「あのAIも、穴埋めを重ねて……」 | ChatGPTを指す限り範囲は同じ。代名詞への変更では根拠や混同の問題を解消しない |
| **「ChatGPTの中のLLMも、続きを予測して、答えの文を組み立てるの。」** | 第一候補。文章を作るモデルに主語を絞り、公式概説の範囲に収める |
| 「ChatGPTに使われてきたGPT-4なども、続きを予測して文を作るの。」 | 固有モデルの技術開示に限定できるが、現行製品との接続は弱くなる |

「穴埋め」を残すなら「中のLLMも、文章の続きを埋めて、答えの文を組み立てるの」。末尾の未知位置の比喩であり、実際のマスク記号を毎回挿入する説明にはしない。計算単位は単語と一致しないトークン。「前から順に」は生成の依存関係を表し、一回の計算が必ず一トークンとは限らない。画面の文章以外にも内部推論やツール処理があり、表示の流れだけを全処理の図にしない。[既存compose-facts C2・C3](../compose-facts/report.md)、[O7](https://help.openai.com/en/articles/7842364-how-chatgpt-and-our-foundation-models-are-developed)、[O10 How Intelligent UI works](https://openai.com/index/gpt-6-for-everyone/)

## D5・D6・D8：予測の学習で何が伸び、何を追加するか

「文章には知識や考える手順が書かれている」は教育的な要約として使える。ただし、その内容がそっくりモデルへ移植される機構の証明ではない。**予測損失の改善、個々の問題の正答率、人にとって望ましい応答は、別々の評価である。**

| 資料 | 直接支えること | この語りでの限界 |
|---|---|---|
| Kaplan 2020（P1） | モデル規模・データ量・計算量と予測損失の経験的な関係 | 他の要因がボトルネックでない条件付き。任意の課題の正答率が必ず上がる法則ではない |
| Hoffmann 2022（P2） | 計算予算に対してモデル規模と学習トークン量を適切に配分する重要性 | 「大きさを増やせばよい」ではない。最適配分の推定はKaplanと同一ではない |
| Brown 2020（P3） | 予測で事前学習したモデルが、課題別の重み更新なしに多様な課題をこなし、規模とともに多くの成績が改善 | 苦手な課題や成績低下もある。few-shotは入力に例を与える |
| Ouyang 2022（P4） | 人の回答例と選好を使った追加学習が、指示への応答を改善 | 評価したプロンプトでの結果。全能力の何割がRLHF由来かという分解ではない |

出典：[P1 §1.1・Figure 1](https://arxiv.org/pdf/2001.08361)、[P2 Abstract・§1–2](https://arxiv.org/pdf/2203.15556)、[P3 §2](https://arxiv.org/pdf/2005.14165)、[P4 Abstract・Figure 1](https://arxiv.org/pdf/2203.02155)。

P2のChinchillaは、同程度の計算予算でモデルを小さくし、より多くのトークンで学習してGopherを上回った。D5は「鍛えるほど解ける問題が増える」という無条件の法則から、**「実際、その学習で、いろいろな問題の成績も上がってきた」**という実測の過去形へ寄せるとよい。[P2 pp.1–3](https://arxiv.org/pdf/2203.15556)

P4では、API由来の評価プロンプトで、1.3BのInstructGPTの応答が175BのGPT-3より好まれた。初代ChatGPTも対話例・人の比較評価による追加学習を明記している。「人向けの受け答えに追加学習が大きく寄与した」は支持できるが、「人らしさの大部分はRLHF」「知識・計算は事前学習で、追加学習は作法だけ」という厳密な分担にはしない。[P4 pp.1–4](https://arxiv.org/pdf/2203.02155)、[O1 Methods](https://openai.com/index/chatgpt/)

D6の「だけ」は外すのが明瞭。残すならGPT-3の事前学習の目的に限定し、学習文章の中身・モデル設計・評価時の例示まで不要だったとは読ませない。D8の「だから」は能力評価から製品成立への因果を強く言いすぎるため、「土台になっている」とつなぎ、指示に答えるための追加学習を一文補う。[P3 §2](https://arxiv.org/pdf/2005.14165)、[P4](https://arxiv.org/pdf/2203.02155)、[既存intro-facts N6・N8](../intro-facts/report.md)

## D7：GPT-3の8規模、72値と比較条件

### 数値の出典

出典はBrown et al. (2020), *Language Models are Few-Shot Learners*、取得PDF v4（2020-07-22）の **Appendix H, Table H.1、PDF p.63**。ページは1始まりで、印刷番号とも一致する。**全72値を表から転記し、別途取得したPDFのテキストでも照合した。図から読んだ推定値はない。**[原表（P3）](https://arxiv.org/pdf/2005.14165)

**以下はすべて Table H.1（p.63）の `acc`、単位は %。** M=100万、B=10億パラメータ。Small=125M、Medium=350M、Large=760M、XL=1.3B の対応は Table 2.1（p.8）。小数の桁は原表の表記を保った。few-shot列のKは原表に記された例示数で、zero-shotは例なし、one-shotは1例。few-shotは追加の重み学習を意味しない。

#### TriviaQA（知識を問う質問、外部文書を検索・提示しない closed-book）

原表のsplitは **dev**、few-shotの **K=64**。175Bについて別にあるtest-server列も71.2である。本文 Table 3.3（p.13）の175B few-shot 71.2はwiki splitのtest serverと明記される。8規模を同じ系列として描くときは、Table H.1の通常のdev列を採る。

| 規模 | zero-shot (%) | one-shot (%) | few-shot (%) |
|---|---:|---:|---:|
| 125M | 4.15 | 4.19 | 6.96 |
| 350M | 7.61 | 12.9 | 16.3 |
| 760M | 14.0 | 20.5 | 26.5 |
| 1.3B | 19.7 | 26.5 | 32.1 |
| 2.7B | 31.3 | 35.9 | 42.3 |
| 6.7B | 38.7 | 44.4 | 51.6 |
| 13B | 41.8 | 51.3 | 57.5 |
| 175B | 64.3 | 68.0 | 71.2 |

#### 2D+（論文の「2桁の足し算」）

原表のsplitは **n/a**、few-shotの **K=50**。§3.9.1では、0以上100未満から一様に選ぶ二つの整数の和を、自然言語の質問に答える形で評価する。従って必ず10〜99の二数ではなく、一桁や0も含む。各課題2,000問を生成し、正しい答えとの完全一致を要求する。175Bの3値はTable 3.9（p.23）とも一致。

| 規模 | zero-shot (%) | one-shot (%) | few-shot (%) |
|---|---:|---:|---:|
| 125M | 0.70 | 2.00 | 2.00 |
| 350M | 0.65 | 0.55 | 4.10 |
| 760M | 0.70 | 3.15 | 3.50 |
| 1.3B | 0.85 | 4.00 | 4.50 |
| 2.7B | 1.10 | 12.1 | 8.90 |
| 6.7B | 2.54 | 19.6 | 11.9 |
| 13B | 15.4 | 73.0 | 55.5 |
| 175B | 76.9 | 99.6 | 100.0 |

6.7B zero-shotの **2.54** は原表どおり。2,000問の単純比率なら0.05ポイント刻みになるため、その算出・集約または誤記の可能性は本文だけでは解けない。勝手に2.55等へ丸め直さない。100.0%もこの評価集合・設定での結果で、任意の足し算への完全保証ではない。

#### LAMBADA（段落の文脈から末尾の語を予測）

原表のsplitは **test**、few-shotの **K=15**。同表に隣接する `ppl`（perplexity）行と混同せず、ここでは正答率だけを採用。175Bの3値はTable 3.2（p.12）とも一致。

| 規模 | zero-shot (%) | one-shot (%) | few-shot (%) |
|---|---:|---:|---:|
| 125M | 42.7 | 22.0 | 22.0 |
| 350M | 54.3 | 47.1 | 40.4 |
| 760M | 60.4 | 52.6 | 63.2 |
| 1.3B | 63.6 | 58.3 | 57.0 |
| 2.7B | 67.1 | 61.1 | 78.1 |
| 6.7B | 70.3 | 65.4 | 79.1 |
| 13B | 72.5 | 69.0 | 81.3 |
| 175B | 76.2 | 72.5 | 86.4 |

### 「同じデータと学び方で、大きさだけを変えた」の修正

**共通の事前学習の枠組みで8規模を比較した、とは言える。「大きさだけが違う完全な単一変数実験」とは言えない。** 全モデル300Bトークン、文脈長2048、データ源の共通構成が示される一方、深さ・幅・ヘッド構成・学習率・バッチサイズ等が異なる。計算量も規模とともに変わる。同じ文章列を同じ順序で見たことまで確認したわけではない。[P3 Table 2.1–2.2、pp.8–9](https://arxiv.org/pdf/2005.14165)

課題別のfine-tuningや勾配更新をしない評価である。ただしfew-shotは問いと解答例を入力に含む。「課題の例を一度も見せずに解けた」ではない。LAMBADAのzero-shotとone-/few-shotでは提示形式も異なるので、設定間の差を例の数だけの効果とみなさない。[P3 §2、§2.4、§3.1.2](https://arxiv.org/pdf/2005.14165)

成績は全体として大規模側で高いが、必ず単調には増えない。例えばLAMBADA few-shotは760Mの63.2%から1.3Bの57.0%へ下がり、2D+ few-shotも350Mの4.10%から760Mの3.50%へ下がる。LAMBADA one-shotは、この8規模すべてでzero-shotより低い。「大きいほど必ずよい」「例が多いほど必ずよい」のどちらにも使わない。[P3 Table H.1](https://arxiv.org/pdf/2005.14165)

学習・評価データの重複と除去処理の不具合も論文に報告される。著者のLAMBADA分析は汚染の影響が小さいとするが、全評価例が完全に未知だった保証ではない。3桁算術の照合を2D+全問の非暗記の証明へ拡張しない。[P3 §2.2、§3.1.2、§3.9.1、§4](https://arxiv.org/pdf/2005.14165)

### LAMBADAと推理小説の対応

LAMBADAは小説の短い抜粋について末尾の一語を予測する課題。全体を読んだ二人が続けて正答し、最後の文だけを読んだ別の被験者たちが正答できなかった項目を選んでいる。前の文脈は平均4.6文。**「前の数文が手がかりになる、最後の一語を当てる課題」**が正確で、「前を読まない限り誰にも絶対に当たらない」という保証ではない。[P5 §2–3.1、pp.1526–1528](https://aclanthology.org/P16-1144.pdf)

前後の情報を結びつける点は推理小説の例と対応する。ただし犯人や物語全体の結末を推理する試験ではない。答えの語が前の文脈に現れる項目は8割超、固有名詞は48%で、登場人物や物の指示を追う問題も多い。**教材の推理小説は独自の「例」と表示し、LAMBADAの実問題・実測内容とは区別する。**「筋を追う力」より「前の文脈を使う問題」へ寄せるのがよい。[P5 §3.3、p.1529](https://aclanthology.org/P16-1144.pdf)

### 「急にできるようになる」と見せないための図の条件

Weiらは、小規模では見られず大規模で現れる能力を創発的と定義し、同時に採点指標によって改善が見えにくくなる場合を論じる。Schaefferらは、算術の同じ出力でも完全一致と編集距離で曲線が変わる例を示した。ただし後者はBrownの8規模・2D+・50-shotを再採点した研究ではない。**「Brownの急上昇は見かけと証明済み」「創発は存在しない」とは言えない。**[P6 §2、§5、Appendix A](https://arxiv.org/pdf/2206.07682)、[P7 §3、§7、Appendix A](https://arxiv.org/pdf/2304.15004)

以下は実測と研究上の留保に基づく制作案であり、論文が指定した表示規則ではない。

| 要素 | 提案 | 理由 |
|---|---|---|
| 横軸 | モデルの大きさ＝パラメータ数、対数目盛。8規模を実際の位置に置く | 等間隔の8点を数量軸に見せない。線形軸も正しいが小さい7点が密集する |
| 縦軸 | 2D+の完全一致の正答率、0〜100% | 何を数えた割合かを明示する |
| 点と線 | few-shotの8実測点を描く。線は点をつなぐ補助線 | 4.10→3.50の低下を消さず、滑らかなS字曲線を捏造しない |
| 大規模側 | 13Bと175Bの間の約13.5倍の空白を保つ | 間の規模を測っていない。能力が発生した閾値を特定しない |
| 比較対象 | 別々に訓練した8モデル、と示す | 一つのモデルが成長する時間軸と混同しない |
| 系列 | few-shot K=50を主にし、zero-/one-shotは併記か切替 | 少数例を入力して測ったことを残す |

図注の案：**「GPT-3（2020）／0〜99の整数2個の足し算／例50問を入力／課題別の重み更新なし／Brown Table H.1」**。100%はこの試験での値。採点の補足は「ここでは、答えが全部合った割合を見ている。成績の上がり方は採点のしかたでも変わる」。元の出力を取得していないため、部分点や編集距離の系列は作らない。[P3 §3.9.1・Table H.1](https://arxiv.org/pdf/2005.14165)、[P7](https://arxiv.org/pdf/2304.15004)

## D9：正しく答えることと理解の関係

**原文の留保は残せる。** N7との照合では、課題の正答率、内部状態の表現、伝達意図との対応を別の問いとして扱っている。D7の成績向上を、人間と同じ理解の証明に読み替えなければ矛盾しない。[既存intro-facts N7](../intro-facts/report.md)

Bender & Kollerは言語形式と伝達意図の関係を論じる立場論文、Liらは合成された盤上ゲームの予測モデルで盤面表現と介入効果を調べた実験であり、同じ問いへの単純な賛成・反対ではない。後者は「予測モデルには何の内部表現もない」という単純化を避ける根拠になるが、自然言語の理解全般を実証しない。Vafaらの公式抄録も、訓練課題の成績と世界モデルに沿う帰納バイアスを区別している。[P8 §1・§3–4](https://aclanthology.org/2020.acl-main.463.pdf)、[P9 §4.2](https://arxiv.org/pdf/2210.13382)、[P10 Abstract](https://proceedings.mlr.press/v267/vafa25a.html)

「ただ、正しく答えられることを、どこまで『理解している』と言えるのかは、いまも議論があるの」とすると、偶然の当たりではなく正答から理解への解釈の話だと伝わる。「いまも」はこの問題設定と既存N7に沿う整理であり、研究者全体の合意率や2026年までの網羅レビューではない。D9を付けても、D5〜D7の過大な断定がそのまま許されるわけではない。

## ロゴ：正式素材、公開条件、今回の適用

### 配布元と正式ファイル名

公開窓口は[OpenAI Design Guidelines（B1）](https://openai.com/brand/)、確認した素材は[OpenAI公式CDNのOpenAI-Logos-2025.zip（B2）](https://cdn.openai.com/brand/OpenAI-Logos-2025.zip)。花形はブランドページで **Blossom**、ZIP内で **OpenAI monoblossom** と呼ばれる。ZIPには次の4ファイルとOpenAIの文字ロゴがあり、ChatGPTというファイル名の素材はなかった。

| 種類 | ZIP内の正式パス |
|---|---|
| 黒い花形SVG | `OpenAI-logos(new)/SVGs/OpenAI-black-monoblossom.svg` |
| 白い花形SVG | `OpenAI-logos(new)/SVGs/OpenAI-white-monoblossom.svg` |
| 黒い花形PNG | `OpenAI-logos(new)/PNGs/OpenAI-black-monoblossom.png` |
| 白い花形PNG | `OpenAI-logos(new)/PNGs/OpenAI-white-monoblossom.png` |

SVGのviewBox・PNGの寸法は721×721。配布PNGには透明余白が含まれるが、その測定値を公式の最小余白に読み替えない。取得ZIPは76,633 bytes、SHA-256は `b2c4cd1e86bbe76bdc4946a72d014efa455240c177f4878fd68cc9b88c71d2ec`。素材は調査時にメモリ内で確認し、プロジェクトには保存していない。[配布実物（B2）](https://cdn.openai.com/brand/OpenAI-Logos-2025.zip)

公式ヘルプは、ChatGPT iOSアプリの識別を白地に黒いOpenAIロゴと説明する。従ってこの花形をChatGPTと明示した紹介に使う案には根拠がある。ただし「ChatGPT専用の正式SVG」という名前を作ったり、花形の素材と白地・角丸を含むアプリアイコン全体を同一視したりしない。[B3](https://help.openai.com/en/articles/7905742-what-does-the-official-chatgpt-ios-app-icon-look-like)

### 公開ガイドの明文と、制作上の判断

| 論点 | 確認できた条件・範囲 | 今回の適用案 |
|---|---|---|
| 色・形 | 配布どおり使う。Blossomへ色や独自要素を加えず、改変しない（B1） | 同梱の黒版か白版を選び、元の比率を保って一律に縮小する |
| 回転 | 公開本文に回転単独の禁止語は確認できなかった | 回さず向きを保つ。「配布どおり／改変しない」からの実務上の判断で、回転専用条項の引用ではない |
| 余白 | 規定の余白を取るよう指示し、図示している（B1・B4） | 周囲の文字・枠を離す。公式のpx・割合・最小サイズは未確認。素材内の透明余白だけで十分とは断定しない |
| 配置 | 込み入った背景を避け、教材自身の名前より目立たせない（B1） | 小さく置き、近くに「ChatGPT」を表示する |
| 帰属・関係 | OpenAIサービスに直接関係する使用とし、所有を示す。提携・推奨を示唆せず、自分のブランドへ取り込まない（B1） | 教材の提供者と製品の紹介を区別する。共同ブランド用テンプレートは使わない |
| 教育用途 | 公開ガイドは第三者資料を対象にするが、教育目的を無条件に認める特例は確認できない。教師向け契約もガイド参照（B5） | 製品を説明する場面との関連性はある。個別許諾取得済み・無条件可とは記さない |
| 限定公開・非公開repo | それだけで条件が免除される条文は確認できない | 公開範囲の小ささを使用条件の代わりにしない |

出典：[B1](https://openai.com/brand/)、[B4 余白の公式図](https://images.ctfassets.net/kftzwdyauwt9/7gIQtOpWt5okz8ZwQDNuRG/db6a664ed3906c725c781afb975d7649/Frame_2147224863.png)、[B5 §4](https://openai.com/policies/education-terms/)。B5は教師向けサービスの契約であり、この教材へ直接適用する根拠にはしていない。

権利欄の文案：**「ChatGPTおよびOpenAIのロゴはOpenAIに帰属します。本教材はOpenAIによる提供・推奨を示すものではありません。」** これは制作上の案で、公式の指定定型句ではない。

フルガイドの[brand.openai.com](https://brand.openai.com/)は認証画面へ転送され、詳細は取得できなかった。確認範囲は公開ページと配布実物まで。個別の適用保証が必要になった場合の窓口は公開ガイドの `partnercomms@openai.com`。本調査から連絡は送っていない。ボスが名前とロゴを使うと決めた方針を再確認する承認手続きは設けない。[B1 Contact・Brand partnerships](https://openai.com/brand/)

## 問いと調査計画の変化

元の問いは変えていない。初期計画の9単位を、資料に合わせて4回改訂した。変更の理由と経過は[log.md](log.md)に追記してある。

| 改訂 | 分かったことと扱い |
|---|---|
| 1 | 初代の「ChatGPT」はモデル名としても使われる。歴史的呼称と現在の製品・モデルの区別を分け、現行搭載モデルの確認をUnit 3へ集約 |
| 2 | 個別技術開示と現行の公式概説では裏付けの範囲が違う。Free/Goの記載不一致を照合したが、実アカウント別の稼働確認は後続へ送った |
| 3 | GPT-3は「大きさだけを変えた」比較ではない。学習条件を確認する問いを数値抽出と合わせて追究し、表現を修正 |
| 4 | Blossom、配布ファイル名、ChatGPTアプリアイコンを区別。教材への適用は公開条件との対応まで調べ、個別法律判断や許諾照会は後続候補にした |

理解研究の全体レビュー、創発論争の決着、Brownの再実験・著者照会は元の判定に不要なので拡張しなかった。最新計画の9単位と横断点検を完了してから、この報告を作成した。

## 残る不確実性と次の行動

| 不確実性 | 今回言える範囲／必要になった場合の次の行動 |
|---|---|
| 最新各モデルIDの生成方式、Free/Goの搭載表記の不一致 | D4は現行の一般向け公式説明に限定する。特定IDやプランを語りに入れるときだけ公式更新を再照合する |
| GPT-3の因果分解とデータ汚染 | 規模以外の条件も変わる実測比較として示す。全問非暗記や規模だけの因果効果は保証しない |
| 2D+の6.7B zero-shot 2.54%の算出 | 原表を維持する。2,000問の単純比率とのずれは未解決。再解析が必要なら評価コード・出力や著者情報の追加確認が必要 |
| Brownの出力を別指標で採点した曲線 | 今回は取得していない。編集距離・部分点の系列や能力発生の閾値を作らない |
| ロゴの詳細寸法・回転専用条項・教材個別の適用保証 | 公開ガイドと配布素材の条件を使う。数値指定や個別判断が必要ならフルガイド／窓口で確認 |
| 「理解」の定義と研究者全体の合意率 | D9はN7との整合確認にとどめる。正答から人間同様の理解を証明したとはしない |

制作へ渡す優先事項は、D4の主語を「中のLLM」に絞ること、D5〜D7の「だけ／ほど」を実測に合わせること、D8に追加学習の一文を補うこと。図には上記72値と比較条件を使い、LAMBADAと推理小説の例を区別する。ロゴは公式黒白版を使い、余白と帰属を整える。文面・絵・音声の採否と実装はこの報告の次の作業である。

## 資料・引用・所在

**以下はすべて2026-10-14 UTC取得・読取り。** 発表日や版の日付を併記した。短い引用は本文の判断を支える部分に限る。検索結果の断片だけを根拠にせず、原文を開いて確認した。P10のみ、使用範囲を公式抄録に限定する。資料の詳細なアクセス記録は[log.md](log.md)にある。

### OpenAIの製品・モデル資料

| ID | 一次資料・日付 | 所在、短い引用または確認範囲 |
|---|---|---|
| O1 | [Introducing ChatGPT](https://openai.com/index/chatgpt/)、2022-11-30 | 冒頭 “We’ve trained a model called ChatGPT”。Methods “ChatGPT is fine-tuned from a model in the GPT‑3.5 series”。初代の発表で、現行仕様の一覧ではない |
| O2 | [GPT-4](https://openai.com/index/gpt-4-research/)、2023-03-14 | 冒頭 “We are releasing GPT‑4’s text input capability via ChatGPT and the API”。Steerability、Limitations、ChatGPT Plusも確認 |
| O3 | [GPT-4 Technical Report](https://cdn.openai.com/papers/gpt-4.pdf)、表紙27 Mar 2023 | pp.1–2、Abstract・§2。“pre-trained to predict the next token in a document”。100頁の取得PDFを基準に参照 |
| O4 | [ChatGPT plugins](https://openai.com/index/chatgpt-plugins/)、2023-03-23 | 冒頭 “help ChatGPT access up-to-date information, run computations, or use third-party services”。ページにoutdatedの注記あり |
| O6 | [GPT-4o System Card](https://openai.com/index/gpt-4o-system-card/)、2024-08-08 | Introduction “GPT‑4o is an autoregressive omni model” |
| O7 | [How ChatGPT and our foundation models are developed](https://help.openai.com/en/articles/7842364-how-chatgpt-and-our-foundation-models-are-developed)、取得時点の現行ヘルプ | What is ChatGPT and how does it work? “predict the next most likely word when generating a response, one word at a time”。更新の相対表示に差があり、厳密な改訂日は採用しない。最大確率だけを選ぶ実装の保証とは読まない |
| O8 | [GPT-6 and other models in ChatGPT](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt)、現行ヘルプ | Choose a thinking level “GPT-6 Sol powers Instant, Medium, High, and Extra High”。Overview、Availabilityも確認。Free/Goの記載はO9〜O11と不一致 |
| O9 | [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) | 2026-10-07のGPT-6、2026-09-29のWork/Codex向けGPT-6.1 Sol、09-22、09-03の各日付付き項目。共通ナビゲーションのモデル名を旧記事当時の情報にしない |
| O10 | [GPT-6 and Intelligent UI for everyone](https://openai.com/index/gpt-6-for-everyone/)、2026-10-07 | Availability “GPT‑6 in ChatGPT is powered by GPT‑6 Sol”。How Intelligent UI worksでツール・推論・表示処理を確認 |
| O11 | [GPT-6 Sol and GPT-6 Luna: October 2026 update](https://deploymentsafety.openai.com/gpt-6-october)、2026-10-07 | §1 “These models will replace GPT-5.6 Sol and GPT-5.6 Luna in ChatGPT.”。§2も確認。自己回帰の明示は確認できず |
| O12 | [GPT-6 Astra: A new generation of intelligence](https://openai.com/index/gpt-6-astra/) | 導入、Availability、system cardへのリンク。初出はO9の2026-09-03で照合、09-22/29追記あり |
| O13 | [GPT-6 Astra System Card](https://deploymentsafety.openai.com/gpt-6-astra) | 導入・関連節と全文検索。autoregressive、next token、architectureの語は見つからず。後発の節も含むページで、全体を初出時の記述にはしない |
| O14 | [Introducing GPT-4.5](https://openai.com/index/introducing-gpt-4-5/)、2025-02-27／[System Card](https://cdn.openai.com/gpt-4-5-system-card-2272025.pdf) | PDF pp.1–2、§1–2。事前学習・追加訓練を確認。調べた範囲では次トークン・自己回帰の明示を確認できず |
| O15 | [GPT-5 System Card](https://cdn.openai.com/gpt-5-system-card.pdf)、表紙2025-08-13 | 取得PDF60頁でautoregressive / next tokenを検索して該当なし。方式が違うという証拠ではない |
| O16 | [Using GPT-6](https://developers.openai.com/api/docs/guides/latest-model)、取得時点のAPI文書 | 系列と推論・ツール設定を確認。APIの一覧から通常のChatの搭載モデルを推定しない |

補助照合として、[O5 Using tools](https://developers.openai.com/api/docs/guides/tools)と[O17 Model Release Notes](https://help.openai.com/en/articles/9624314-model-release-notes)も読んだ。API機能をChatGPTでの提供の直接証拠にはしていない。

### 予測・評価・理解の原論文

| ID | 一次資料・版 | 所在と短い引用 |
|---|---|---|
| P1 | Kaplan et al., [Scaling Laws for Neural Language Models](https://arxiv.org/pdf/2001.08361) (2020) | §1.1、Figure 1、§1.2、§2、pp.2–7。Figure 1 “when not bottlenecked by the other two”。取得PDF30頁、表紙v1/23 Jan 2020を基準に所在を記載 |
| P2 | Hoffmann et al., [Training Compute-Optimal Large Language Models](https://arxiv.org/pdf/2203.15556) (2022) | Abstract、§1–2、Table 1、pp.1–3。“model size and the number of training tokens should be scaled in equal proportions”。取得PDF36頁、本文に©2023の表示があり、2022初版と同一の版面とは断定しない |
| P3 | Brown et al., [Language Models are Few-Shot Learners](https://arxiv.org/pdf/2005.14165) (2020)、v4/2020-07-22 | §2 p.6 “no weight updates are allowed”。Table 2.1 p.8 “All models were trained for a total of 300 billion tokens.”。Table H.1 p.63が全72値、Table 3.2 p.12がLAMBADA、3.3 p.13がTriviaQA、3.9 p.23が算術175Bの照合先。75頁 |
| P4 | Ouyang et al., [Training language models to follow instructions with human feedback](https://arxiv.org/pdf/2203.02155) (2022)、v1/2022-03-04 | Abstract、§1、Figure 1、pp.1–4。“Making language models bigger does not inherently make them better at following a user’s intent.”。取得PDF68頁 |
| P5 | Paperno et al., [The LAMBADA dataset: Word prediction requiring a broad discourse context](https://aclanthology.org/P16-1144.pdf) (ACL 2016) | Abstract p.1525 “keep track of information in the broader discourse”。§2–3.1 pp.1526–1528、§3.2–3.3 p.1529。印刷pp.1525–1534 |
| P6 | Wei et al., [Emergent Abilities of Large Language Models](https://arxiv.org/pdf/2206.07682) (TMLR 2022)、v2/2022-10-26 | §2 p.2 “An ability is emergent if it is not present in smaller models but is present in larger models.”。§5.1–5.2 p.7、Appendix A.1 p.19、A.2/Figure 7 p.22 |
| P7 | Schaeffer et al., [Are Emergent Abilities of Large Language Models a Mirage?](https://arxiv.org/pdf/2304.15004) (2023)、v2/2023-05-22 | §3/Figures 3–4 pp.4–6、Appendix A pp.12–13。§7 p.9 “nothing in this paper should be interpreted as claiming that large language models cannot display emergent abilities” |
| P8 | Bender & Koller, [Climbing towards NLU: On Meaning, Form, and Understanding in the Age of Data](https://aclanthology.org/2020.acl-main.463.pdf) (ACL 2020) | §1 p.5185 “the relation between a linguistic form and communicative intent”。§3.1 p.5187、§4 pp.5188–5189 |
| P9 | Li et al., [Emergent World Representations: Exploring a Sequence Model Trained on a Synthetic Task](https://arxiv.org/pdf/2210.13382) (ICLR 2023)、取得版v5/2024-06-26 | Abstract、§4.2 p.7 “suggesting the emergent representations are causal to model predictions”。§7 p.9。盤面表現と介入効果に限定して使用 |
| P10 | Vafa et al., [What Has a Foundation Model Found? Using Inductive Bias to Probe for World Models](https://proceedings.mlr.press/v267/vafa25a.html) (ICML 2025) | 公式Abstract “excel at their training tasks yet fail to develop inductive biases towards the underlying world model”。抄録と書誌情報のみ確認し、本文の細部や全モデルへの一般化には使わない |

### ブランド資料とローカルの前提

| ID | 資料 | 所在と短い引用／確認範囲 |
|---|---|---|
| B1 | [OpenAI Design Guidelines](https://openai.com/brand/)、改訂日表示なし | How to use our Logos “Use the logo exactly as provided”、禁止事項中の “imply endorsement”。Blossom “DON'T add any colors to the Blossom”。Introduction、Brand partnerships、Contact、Usage termsも確認 |
| B2 | [OpenAI-Logos-2025.zip](https://cdn.openai.com/brand/OpenAI-Logos-2025.zip) | ZIP一覧、SVG宣言、PNG寸法を直接確認。ZIP内部の日時は正式公開日と同一視しない。共同ブランド用のPartnership Templatesとは別 |
| B3 | [公式ChatGPT iOSアプリアイコンの説明](https://help.openai.com/en/articles/7905742-what-does-the-official-chatgpt-ios-app-icon-look-like) | 冒頭 “black OpenAI logo on a white background”。更新表示は相対日付のため厳密な改訂日を記載しない |
| B4 | [B1の余白の図](https://images.ctfassets.net/kftzwdyauwt9/7gIQtOpWt5okz8ZwQDNuRG/db6a664ed3906c725c781afb975d7649/Frame_2147224863.png) | 中央のBlossomの上下左右の余白を円で図示。数値の文字指定はない。図そのものを表示して確認 |
| B5 | [Teacher Access Terms](https://openai.com/policies/education-terms/)、2026-01-01更新 | §4 “in accordance with our Brand Guidelines”。教師向けサービスの適用範囲も確認。教育一般のロゴ特例ではない |
| L1 | [intro-facts/report.md](../intro-facts/report.md)、N6・N7・N8 | N6の歴史因果、N7の正答と理解、N8のモデル・製品の区別を照合。これ自体を新たな一次研究として扱わない |
| L2 | [compose-facts/report.md](../compose-facts/report.md)、全体 | 穴埋めを共通の直観として使う条件、自己回帰の順序と物理計算の区別を引き継ぐ |
| L3 | [AGENTS.md](../../AGENTS.md)、[docs/spec.md](../../docs/spec.md)冒頭（版0.9、2026-10-14改訂） | 調査の範囲、文・印・クリップの契約を確認。実装変更はしない |

B1の通常HTTP取得は403だったがweb取得で本文を確認し、図の所在は[同ページのクエリ付きURL](https://openai.com/brand/?download=1)でも照合した。認証が必要なフルガイドは読めていない。取得できなかった資料の内容を補って断定していない。
