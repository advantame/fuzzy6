# LLMデッキ「導入の章」：語りの事実確認

## 要約と判定方法

**5本・48文の構成と、言葉の予測から知識・計算・話の筋へ進む説明は使える。ただし、「一つだけ」「必ず要る」「最後まで」といった断定と、歴史を一つの原因で説明する箇所は修正が必要。** とくに優先するのは、1-1の4、1-2の1・5・10、深掘りの5・13〜15・17、扉の2である。未測定の棒は数字が付く前から「例」とし、推理小説の「均等から一候補100%」を一般的な挙動として示さない。

対象は [decks/llm/README.md](../../decks/llm/README.md) の「2026-10-13（導入の章）」にある第1稿。調査中に更新された「のどがかわいたので、水を」の例を採用した。**基準日と外部資料の取得・確認日は2026-10-13 UTC**。報告の作成や環境の日付表示によって、資料を再確認したことにはしない。原稿・デッキ・engine・規約表示は変更しておらず、モデルの実行、音声合成、動画音声との聞き合わせも行っていない。

「確認」は記した条件内で言えること、「訂正」は用語・事実・説明の修正が必要なこと、「言い過ぎ」は元の断定より狭い範囲まで根拠があることを示す。問いや制作上の案内は、科学的事実の確認と分ける。S番号は末尾の出典一覧に対応し、検証過程と取得の限界は [log.md](log.md) に記録した。短い言い方の案は、事実として言える範囲を示すための材料である。

## N1〜N10の判定表

| 項目 | 判定 | 結論・対応 | 主な根拠 |
|---|---|---|---|
| N1 モデルと天気 | 言い過ぎ／条件付き確認 | モデル一般を予測専用と定義しない。物理型の数値予報は例として妥当。言語との共通点は対象の関係を表して予測すること | S1–S7 |
| N2 降水確率 | 確認、比較の範囲を限定 | 確率で表す例として使える。70%の対象は指定時間・地域の1mm以上の降水。次語分布と同じ仕組みではない | S4、S7–S8 |
| N3 定義・語の起源 | 確認、絶対的初出は未確定 | 列の確率と次語の条件付き確率は整合。1975年のIBM論文で明確な用例。1975年を発想や語の絶対的起源としない | S8–S10、S12、S18 |
| N4 言語の構造 | 確認、限定を推奨 | 語順・共起・意味との適合の規則性は支持される。「決まりや傾向」「構造の一つ」が適切。「飲んだが1位」は未実測 | S13–S17 |
| N5 知識・推論と四問 | 言い過ぎを修正 | 能力が役立つ場面の例として使える。各正答から、その能力や内部の手順が必須だったとは言えない | S18–S23、S25–S28 |
| N6 AIへの歴史 | 前半確認／後半訂正 | 予測の学習を幅広い課題へ役立てる期待は確認。「この見込みがAIの話にした」という単一原因の歴史は支持されない | S9、S21–S23、S29–S33 |
| N7 理解論争 | 確認 | 予測の成功、内部の状態表現、伝達意図との対応を区別する。「いまも議論」は残せる。全研究者の合意率は未調査 | S34、S36–S41 |
| N8 次の一語だけ | 言い過ぎ／用語を訂正 | 自己回帰の文章生成へ限定し、「語」を「トークン」へ。拡散は生成方式の反例。推論・マルチモーダルは別の区別 | S32、S42–S46 |
| N9 エージェント・利用 | 確認、完遂保証を修正 | LLMと道具等の構成は妥当。途中で人へ戻す場合もある。複数の業務での利用を確認。数字には母集団と時点が必要 | S47–S52 |
| N10 ずんだもん | 確認（今回の音声・原稿） | 四国めたんと同じVOICEVOX音源章が適用。両話者のクレジットが必要。7発話に禁止用途への明白な該当は見当たらない | S53–S56 |

## 根拠と短い言い方の案

### N1：モデル、天気と言語の対応

科学モデルは、対象を簡略化して表し、理解・説明・検証・予測などに用いる。「本物のふるまいをまねて、予測に使うもの」は今回見る予測用モデルの紹介にはなるが、モデル一般の定義として狭い。統計モデルが本物の内部機構を再現するとも限らない。[NRC 第3章 pp.56–58（S1）](https://www.nationalacademies.org/read/13165/chapter/7)、[NIST §3.4.3（S2）](https://www.itl.nist.gov/div898/handbook/ppc/section4/ppc43.htm)

> 案（1-2の1）：モデルは、ものごとの特徴や関係を表して、説明や予測に使うものよ。

「まねる」を残すなら「ここでは、ものごとのふるまいをまねて、予測するモデルを見るわ」と対象を限定できる。

気象庁の物理型数値予報は、観測から現在の状態を定め、物理・化学の法則に基づいて将来を計算する。空気の流れだけでなく温度、水蒸気、日射なども関わる。言語側では、文章から言葉の列の確率的な規則性を学ぶ、という対比ができる。[気象庁「数値予報とは」（S3）](https://www.jma.go.jp/jma/kishou/know/whitep/1-3-1.html)、[Bengioほか2003 §1–2（S7）](https://jmlr.csail.mit.edu/papers/volume3/bengio03a/bengio03a.pdf)

| 比較点 | 物理型数値予報の例 | 統計的・ニューラル言語モデルの例 |
|---|---|---|
| 表すもの | 大気等の状態と変化 | 言葉の列の確率的な規則性 |
| 予測の条件 | 観測から推定した現在の状態 | それまでの言葉・文脈 |
| 作り方 | 物理法則を数値計算する | 文のデータからパラメータを学ぶ |
| 予測 | 将来の気象状態 | 次の候補の確率 |

これは典型例の比較である。気象庁は降水確率等に統計的な後処理も使い、ECMWFは2025-02-25に学習型のAIFSを運用開始している。「天気は物理だけ、言語はデータだけ」という区分や、人の脳の仕組みを言語モデルがそのまま再現するという説明には広げない。[気象庁ガイダンス（S5）](https://www.jma.go.jp/jma/kishou/know/whitep/1-3-11.html)、[ECMWF運用開始（S6）](https://www.ecmwf.int/en/about/media-centre/news/2025/ecmwfs-ai-forecasts-become-operational)

> 案（1-2の2）：天気のモデルは、空気の流れや温度の変化を計算して、あしたの天気を予測するわ。

図の補足は「物理の法則を使う数値予報の例」で足りる。

### N2：降水確率70%と候補の分布

気象庁の定義は、指定された時間帯に、対象地域内の各地点で合計1mm以上の降水がある確率。70%という予報の事例を多数集めると、およそ70%でその降水が起こるという説明である。雨の強さ、時間の70%、面積の70%を意味しない。補集合は1mm未満であり、「晴れ30%」でもない。[気象庁FAQ、降水確率の2項目（S4）](https://www.jma.go.jp/jma/kishou/know/faq/faq4.html)

> 案（1-2の8）：天気予報に降水確率があるように、言語モデルも、ありそうな度合いを確率で表すの。

降水確率は「1mm以上／未満」という二値の事象、次語予測は同じ位置の全候補にわたる条件付き分布である。どちらも確率なので比喩は使えるが、モデルの作り方や確率の正確さまで同じとは言えない。**語に付く70%は、その語で述べた内容が事実である確率70%ではない。** これは気象庁の定義と、言語モデルの確率の対象を比較した本調査の整理である。[Bengioほか §2 p.1141（S7）](https://jmlr.csail.mit.edu/papers/volume3/bengio03a/bengio03a.pdf)

### N3：言語モデルの定義と初期用例

「言葉の並び方をとらえて次を予測する」は、統計的言語モデルへの平易な導入として使える。教科書は “a language model assigns a probability to each possible next word” と定義し、列全体の確率を、それまでの列を条件とする各語の確率の積で表す。列の確率と次語の条件付き確率は、対立する定義ではない。[Jurafsky & Martin、2025-01-12版 第3章 p.1・§3.1 式(3.4)（S8）](https://web.stanford.edu/~jurafsky/slp3/old_jan25/3.pdf)

ここでの「まねる」は、確率的な規則性を近似するという意味。確率を付けた後で一つを選ぶ生成の手順とは分ける。「確率は予測の出し方」という原稿の順序はよいが、確率は表示だけでなく数学的定義にも含まれる。[2026-08-19版 第1章 §1.1（S12）](https://web.stanford.edu/~jurafsky/slp3/1.pdf)

**1975年5月のJelinek・Bahl・Mercer論文に、§IV “LANGUAGE MODEL”という明確な用例がある。** 音声認識で候補の語列へ事前確率を与え、音響側のモデル等と組み合わせる部品だった。Jelinek本人は2009年の回顧p.487脚注3で、音響モデルと言語モデルの呼称について “Both these terms, now used throughout the field, were “invented” at IBM” と述べる。[1975年原論文 p.252（S9）](https://www.researchgate.net/publication/220049390_Design_of_a_linguistic_statistical_decoder_for_the_recognition_of_continuous_speech)、[本人の回顧（S10）](https://aclanthology.org/J09-4004.pdf)

> 歴史に使える案：「言語モデル」という呼び名は、1970年代のIBMの音声認識研究ですでに使われていたの。

1972年は当該グループの発足年であり、語の初出年とは確定していない。1975年を「次語予測という発想の誕生」や「絶対に最初の用語使用」とも言わない。予測の先行例としてShannon 1951がある。英語一般の *language model* の初出探索は未完である。

### N4：文法、言い回し、意味と言語の構造

分布、共起、意味との適合によって続きやすさが変わるという骨格は支持される。Harrisは “difference of meaning correlates with difference of distribution.” と述べ、意味と分布の関係を論じる。ただし意味全体を隣接頻度と同一視してはいない。Church & Hanksは共起、Resnikは動詞と目的語等の意味的な選好を統計的に扱う。[Harris 1954 §2.3(b) p.156（S13）](https://www.its.caltech.edu/~matilde/ZelligHarrisDistributionalStructure1954.pdf)、[Church & Hanks 1990 §1–2（S14）](https://aclanthology.org/J90-1003.pdf)、[Resnik 1997 §1–2（S15）](https://aclanthology.org/W97-0209.pdf)

> 案（1-2の6〜7）：文法や言い回し、言葉の意味や文脈によって、続きやすい言葉は変わるの。こうした言葉の結び付きも、言語の構造の一つよ。

「言語の構造」を捨てる必要はない。「決まりの重なり」と構造全般を等置せず、一面を説明していると分かるようにする。例外のない禁止と、出現しやすい傾向も分けたい。

「のどがかわいたので、水を」の後では、日常的な字義通りの場面なら「飲んだ」「買った」が自然で、「読んだ」は合いにくい。ただしこれは本調査の言語的判断であり、資料にこの日本語3候補の測定結果があるわけではない。「飲んだがいちばん」は、モデル・入力・候補集合・測り方を指定しない限り確認できない。作品名などの文脈なら「水を読んだ」も成立しうる。

> 案（1-2の5）：『のどがかわいたので、水を』と来たら、『飲んだ』は自然ね。『買った』もありそう。『読んだ』は、この場面には合いにくいわ。

### N5：予測に知識や推論が関わるという原典

原典は、「よい予測に各能力が役立つ」という議論と実験を支える。**任意の一問の正答には必ずその能力が必要で、しかも人と同じ手順を実行した、とまでは示さない。**

| 原典 | 確認できること | 引用・所在と留保 |
|---|---|---|
| Shannon 1951（S18） | 人が未知の英文の次の文字を順に予測し、英語のエントロピーを推定。文脈と話者の言語知識を利用 | §3 p.54：“anyone speaking a language possesses, implicitly, an enormous knowledge of the statistics of the language.” 人による文字予測であり、LLMの四能力を実証した研究ではない |
| Sutskever、NVIDIA GTC対談（S19–S20） | 推理小説の結末の名前を予測するには、話を追う力が関わるというたとえ | 公式公開2023-03-22。28:17 “Say you read a detective novel,”、28:42 “and that person's name is.. -- Predict that word.” 公式書き起こしで確認、音声との聞き合わせは未実施 |
| Mahoney 1999（S21） | 文章予測・圧縮の良さをAIの評価へ結び付ける提案 | PDF p.1第2段落：“seems to require the same type of real-world knowledge”。留保を伴う議論で、人間と同じ内部機構の証明ではない |
| Hutter FAQ（S22） | 圧縮と確率予測を結び、言語・計数・専門知識が役立つ例を提示 | “What does compression has to do with (artificial) intelligence?”等。現在のFAQの主張であり、全段落を2006年当時の逐語記録とはしない |
| GPT-2論文 2019（S23） | 自然な文章を予測する学習から、文章中に示された課題を推定・実行する力が育つという仮説と多課題評価 | §2 p.3：“Our speculation is”に続き “learn to infer and perform the tasks demonstrated in natural language sequences in order to better predict them”。§6は苦手な課題も明記 |

原文の参照先：[Shannon](https://sites.socsci.uci.edu/~rfutrell/teaching/itl-davis/readings/shannon1951prediction.pdf)、[NVIDIA公式対談](https://www.nvidia.com/en-us/on-demand/session/gtcspring23-s52092/)、[Mahoney](https://www.mattmahoney.net/AAAI99-177.pdf)、[Hutter FAQ](https://hutter1.net/prize/hfaq.htm)、[GPT-2論文](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)。対談の公開日と収録日は異なり、[NVIDIA公式ブログ（S20）](https://blogs.nvidia.com/blog/sutskever-openai-gtc/)はGPT-4発表の翌日に収録したと記す。引用するときは「2023年3月の対談、公式公開3月22日」と時刻を添える。

四問は次のように扱えば維持できる。四つの独立した内部部品や、実験で確定した能力の難易度順を表すものではない。

| 例題 | 判定 | 短い案 |
|---|---|---|
| 学校へ→行く（深掘り3〜5） | 自然な一候補。「向かう」「通う」等もあり、文法だけで唯一の続きは決まらない | 「『行く』は、文法や言い回しに合った、自然な続きよ」 |
| 日本の最高峰→富士山（6〜8） | 地理の答えは確認。正答だけから内部知識の形は特定できない | 「日本の山についての知識が、答えを選ぶ手掛かりになるわ」 |
| りんご3個＋4個→7個（9〜11） | 答えと問題の種類は正しい。単発正答は、その場の内部計算の証明ではない | 「これは、足し算で答えを出せる問題ね」 |
| 推理小説の犯人（12〜14） | 筋や手掛かりが役立つ例。ただし記憶・要約・直前の答え等でも当たり、全文を読めば必ず分かるとも限らない | 「初めて読む」を問いへ加え、「手掛かりや登場人物の関係を追うことが、予測に役立つの」 |

富士山の根拠は[国土地理院Q2.11・A2.11（S25）](https://www.gsi.go.jp/kohokocho/FAQ2.html)。3+4=7には外部資料は不要。「これは計算ね」を問題の種類として使うことはできる。

算術の内部には実証研究がある。GPT-3論文は算術評価と訓練データ照合から、丸暗記だけでは説明しにくいと解釈した。後続の因果的分析には、多数の規則の組合せが答えを支えるという報告があり、Claude 3.5 Haikuの36+59では概算と一の位に関わる経路の組合せが報告されている。各研究は対象モデル・課題・分析方法に限界がある。**「答えの丸暗記」か「人と同じ筆算」かの二択にしない。** [GPT-3 §3.9.1（S26）](https://arxiv.org/html/2005.14165v4)、[Nikankinほか §7–8（S27）](https://technion-cs-nlp.github.io/llm-arithmetic-heuristics/paper.pdf)、[Anthropic “Addition”と方法の限界（S28）](https://transformer-circuits.pub/2025/attribution-graphs/biology.html)

> 案（深掘り2）：次の言葉を予測するとき、どんな力が役に立つかを、四つの問題で見ていくわ。
>
> 案（深掘り13）：どんな話なのか、読んでみないと予測しにくいのだ。
>
> 案（深掘り15）：いろいろな文章の続きをうまく予測するには、文法だけでなく、知識や計算、話の筋を追う力も役に立つの。
>
> 案（1-2の12／深掘り16）：文章には、人が知っていることや、考えた道筋も書かれているからよ。

最後の案は文章に知識や思考の結果が記されるという意味であり、すべてが正しく、漏れなく記されるという主張ではない。

### N6：言語モデルが幅広い課題へ使われるようになった経緯

「知能に近づくかもしれない」は、予測・圧縮・多課題学習への研究上の期待として確認できる。一方、**「この見込みが、言語モデルをAIの話にした」は歴史の原因を一つにまとめすぎている。** 音声認識には早くからAIとの接点があり、後の汎用化にも複数の段階がある。[IBM 1975抄録（S9）](https://research.ibm.com/publications/design-of-a-linguistic-statistical-decoder-for-the-recognition-of-continuous-speech)、[GPT-2 §1–2（S23）](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)

| 時期 | 今回の問いに関係する代表例 |
|---|---|
| 1970年代 | 音声認識で、言語モデルが候補語列の確率を与える（S9） |
| 1990年 | 統計的機械翻訳で、言語モデル・翻訳確率・探索を組み合わせる（S29 §1–2） |
| 2003年 | ニューラル確率言語モデルで、語の表現と確率関数を学ぶ（S7） |
| 2017年 | Transformerを提案し、機械翻訳で評価（S31） |
| 2018年 | GPTで、言語モデルの事前学習の後に課題ごとの教師あり微調整（S30） |
| 2019年 | GPT-2で、課題専用の重み更新なしに複数の課題を評価（S23） |
| 2020年 | GPT-3で、指示や少数の例を入力する多課題評価（S26） |
| 2022年 | 人の実演・比較による追加訓練で、指示への応答を改善（S32–S33） |

参照：[統計的翻訳1990](https://aclanthology.org/J90-2002.pdf)、[ニューラルLM 2003](https://jmlr.csail.mit.edu/papers/volume3/bengio03a/bengio03a.pdf)、[Transformer](https://arxiv.org/abs/1706.03762)、[GPT 2018](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf)、[GPT-3](https://arxiv.org/abs/2005.14165)、[InstructGPT](https://arxiv.org/abs/2203.02155)。これは代表的な系譜であり、汎用AIになった唯一の年や原因を確定する年表ではない。

> 案（深掘り17）：言葉の予測を学ぶことが、さまざまな問題を解く力につながるかもしれない。そう期待して、研究が進められてきたの。

実験の成果へ寄せるなら「言葉の予測を学んだモデルを、質問に答えたり、文章を訳したりする、さまざまな課題に使えることが分かってきたの」。2018年には課題ごとの追加訓練もあったという違いは、歴史の章で補える。

### N7：理解をめぐる議論と、内部表現の実験

深掘り18は残せる。争点には「理解」の定義、何を対象にした理解か、どう測るかがある。正答できること、内部に状態を表すものがあること、人の伝達意図や現実との対応を学んでいることは、同じ検査ではない。

| 資料 | 主張・発見 | 射程 |
|---|---|---|
| Bender & Koller 2020（S34） | 意味を言語形式と伝達意図の関係と定義し、形式だけからその対応は学べないと論じる | 立場論文と思考実験。単語の丸暗記しかないという主張や、全将来モデルの実測結果ではない |
| Othello-GPT（S36） | 手の列だけを学んだモデルの内部から盤面を読み出せ、介入で予測も変わる | 予測から背後の状態表現を獲得する実験。自然言語の伝達意図や人間同様の理解の証明ではない |
| Nandaほか2023（S37） | 自分／相手の石として表せば線形な読み出しや操作が可能 | 元研究の「非線形」という解釈まで確定事項としない |
| Vafaほか2024（S38） | 履歴の違いに対する状態表現の一貫性を検査。人工棋譜と大会棋譜のモデルで差がある | 元の発見の全面否定ではない。訓練データ・評価法の影響。手法の適用対象も限定される |
| Vafaほか2025（S39） | 課題の成績と、想定した世界モデルに沿う適応を分けて検査 | 今回確認したのは公式抄録。全モデルへの結論には使わない |

参照：[Bender & Koller §1・§3–4](https://aclanthology.org/2020.acl-main.463.pdf)、[Othello-GPT §4.2・§7](https://arxiv.org/pdf/2210.13382)、[線形表現](https://aclanthology.org/2023.blackboxnlp-1.2.pdf)、[一貫性の評価 §4・Appendix F](https://arxiv.org/html/2406.03689v2)、[2025年研究の抄録](https://proceedings.mlr.press/v267/vafa25a.html)。Othello論文§4.2 p.7の表現は “suggesting the emergent representations are causal to model predictions”。「理解全般が証明された」への読み替えはできない。

Benderほか2021 *Stochastic Parrots*（S35）は書誌と著者の案内を確認したが、全文を取得できなかった。詳細な要約や逐語引用は採用していない。著者の2025年講演では、形と意味の議論を再掲し、同論文を環境・研究参加・データ・人への影響を問うものとして位置付けている。[Bender 2025、PDF pp.6–7（S41）](https://faculty.washington.edu/ebender/papers/Bender-ISU-2025.pdf)

論争を整理する[Mitchell & Krakauer 2023（S40）](https://arxiv.org/html/2210.13966v3)と上記後続研究から、議論の継続は支持できる。ただし2026年10月までの全研究の網羅レビューや、全研究者の合意率を調べたものではない。

> 案（深掘り18）：ただ、予測がうまいことを、どこまで「理解している」と言えるのかは、いまも議論があるの。
>
> 案（深掘り19）：次の言葉を予測する、その中にも、いろいろな仕組みがありそうなのだ。

19は、複雑な内部処理と次トークン生成が両立すると伝える形にする。18の留保を添えても、他の文の「必須」「全文が必要」という断定が正当化されるわけではない。

### N8：「一つだけ」「次の一語」の修正

自己回帰型の文章生成は、文脈と生成済みの続きを条件に、次のトークンの分布を計算し、候補を選んで続ける。**一語と一トークンは同じではない。** トークンは文字、単語の一部、単語等に対応し、分割方式や言語によって変わる。必ず最も確率の高い候補を選ぶとも限らない。[S8](https://web.stanford.edu/~jurafsky/slp3/old_jan25/3.pdf)、[OpenAI “Managing tokens”（S43）](https://developers.openai.com/api/docs/guides/advanced-usage)

| 区別 | 判定に必要なこと |
|---|---|
| 生成方式 | LLaDAのように、隠した位置を反復して予測する拡散型がある。全LLMを左から次の一つへ限定できない（S44） |
| 回答までの処理 | 推論モデルは最終回答の前に推論トークンも生成する。「画面に出す次の語を直接選ぶだけ」では足りない（S45） |
| 入出力 | 画像・音声・動画等を扱うモデルもある。マルチモーダルであること自体は自己回帰の否定ではない（S42、S46） |
| 訓練 | 次トークン予測の事前学習に加え、指示への応答を整える追加訓練がある（S32、S42） |
| システム | 道具の実行、状態管理、人への返却などはモデル以外の部品も担う（S47–S49） |

参照：[LLaDA §2.1–2.4（S44）](https://arxiv.org/html/2502.09992v3)、[推論モデルの説明（S45）](https://developers.openai.com/cookbook/examples/responses_api/reasoning_items)、[GPT-4 Abstract・§1–2（S42）](https://cdn.openai.com/papers/gpt-4.pdf)、[Gemini §2（S46）](https://arxiv.org/html/2312.11805v4)。拡散・推論・マルチモーダルは、同じ軸の三分類ではない。

> 案（1-1の4）：ここでは、文章を小さな単位に分け、次の一つを予測しながら続きを作る型を見るわ。この単位を、トークンと呼ぶの。
>
> 案（1-1の5）：続きを予測する仕組みが、どうして仕事をこなす力につながるのかしら。
>
> 案（1-2の10）：次のトークンを予測するとは、こうして次の候補に確率を付けることなの。

「ここでは自己回帰型」という対象の限定があれば、導入で例外をすべて列挙する必要はない。語句を候補にした絵は説明用の例とし、実モデルの一トークンの分布と同一視しない。

### N9：エージェントの説明と利用の数字

各社の定義には幅があるが、LLMが手順や道具を選び、結果を受けながら人に代わって仕事を進める、という中心部分は一致する。人に情報・判断を求めたり、停止したりする場合もある。Anthropicの “Agents”節には “potentially returning to the human for further information or judgement” とある。OpenAIのガイドも失敗時の停止・人への制御返却を扱う。[Anthropic（S47）](https://www.anthropic.com/engineering/building-effective-agents)、[OpenAI pp.4・31（S48）](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)、[Google（S50）](https://cloud.google.com/discover/what-are-ai-agents)

> 案（扉2）：頼まれた仕事の進め方を選び、必要な情報や道具を使って、作業を進めるAIのことよ。

「最後まで」の意図を残すなら「仕事の完了を目指して進める」。検索しない仕事もあるため、「自分で調べる」を毎回の必要条件にしない。

1-1の1〜2の部品と中核の説明は、今回扱うLLMエージェントへ限定すれば使える。OpenAIはモデル・道具・指示を基本要素とし、開発文書は状態／記憶・進行管理も分けている。[S48 p.7](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)、[S49 Core concepts](https://developers.openai.com/tracks/building-agents)

> 案（1-1の1〜2）：ここで見るエージェントは、いくつかの部品を組み合わせているの。その中で、次に何をするかを決める役を担うのが、LLMよ。

扉3は、IT、知識管理、ソフトウェア開発など複数の業務領域の利用として裏付けられる。全職場への定着を意味させない。数字を一つ出すなら次の40%が候補になる。[McKinsey 2026本文、業種別利用とAbout the research（S52）](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai)

| 数字 | 正確な対象と意味 | 日付・調査方法 |
|---|---|---|
| **40%** | 年商10億ドル超の組織に属する回答者のうち、少なくとも一つの業務機能でAIエージェントの利用を拡大する段階にあると答えた割合 | McKinsey、2026-08-25公表。調査2026-05-04〜06-08。全体は97か国1,719人、国別GDPで加重。40%の分母は大規模組織の回答者部分群 |
| 46%（別候補） | leadersのうち、自社がagentで業務の流れ・工程を全面自動化していると答えた割合 | Microsoft、2025-04-23公表。調査2025-02-06〜03-24。全体は31市場の知識労働者31,000人。分母はそのうち意思決定に影響する中上位の職位のleaders |

46%の出典は[Microsoft Work Trend Index本文・Methodology（S51）](https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born)。同資料の81%は今後の戦略への組込み見込みで、利用済みの率ではない。

両調査とも民間の自己申告調査であり、全世界の企業の普及率ではない。40%と46%は母集団・年・設問が違い、増減比較はできない。部分群人数、質問票全文、scalingの厳密な判定境界までは確認できていない。S52の年商条件は本文のat leastと要約・方法のmore thanに差があり、上表は後者に従った。画面には「大規模企業の回答者／エージェントの利用を拡大中 40%」、脚注に年商・時期・自己申告を添える。条件を載せられない場合は業務例を示す方がよい。

> 案（扉3）：調べものやソフトウェアづくりなど、いろいろな仕事で使われ始めているわ。

### N10：ずんだもんの音声と今回の発話

**今回のVOICEVOX生成音声では、ずんだもんと四国めたんは同じ音源利用規約の章に含まれる。** クレジット例は「VOICEVOX:ずんだもん、VOICEVOX:四国めたん」。両話者を使う作品では両方を表示する。アプリの紹介画面など、利用者が少し探せば見つかる場所でよく、全画面常設までは条文の要件ではない。[SSS音源利用ガイドライン、VOICEVOX章・許諾内容2（S54）](https://zunko.jp/con_ongen_kiyaku.html)

VOICEVOX規約も音源の条件への従属と、他者に利用を許諾する場合の条件継承を求める。実際のEngine 0.25.2同梱policyも両話者の条件を裏付ける。音源の条件が同じであることを、別製品やキャラクター画像の条件まで同じという意味にはしない。[VOICEVOX規約（S53）](https://voicevox.hiroshiba.jp/term/)、[公式FAQ（S55）](https://voicevox.hiroshiba.jp/qa/)、S56同梱ファイル

原稿内のずんだもんの7発話は、1-2の11、深掘り1・4・7・10・13・19。技術の問い、日常文の補完、富士山、足し算、架空の推理小説、説明を受けた感想である。原稿全体と共通規約を照合し、政治・宗教活動、特定者への非難・応援、情報商材、意図的な虚偽等の**禁止用途への明白な該当は見当たらない**と判断した。これは本文比較の結果で、権利者の個別承認ではない。[S54 共通規約](https://zunko.jp/con_ongen_kiyaku.html)

先行 [voice-terms報告](../voice-terms/report.md) から、話者クレジットと音源の用途条件は引き継げる。ただし先行報告の公開GitHub／GitHub Pagesという配信前提は、現在の非公開リポジトリ・限定公開基盤とは違うため、そのまま引き継がない。現在は音声の再利用を許諾しない方針である。

> 制作記録の案：ずんだもんの問い・答えを含む導入原稿について、VOICEVOXと音源の規約を2026-10-13に確認。音声クレジットは「VOICEVOX:四国めたん」「VOICEVOX:ずんだもん」を併記する。

## 確率の絵で揃えること

この節は、確率の定義（S7–S8）と原稿を比較した本調査の判断であり、特定モデルの測定結果ではない。

1. **未測定の棒には最初から「例」。** 数字のない長さや順位も量を表すので、1-2の5から表示する。候補3つが語彙全体ではないことを示し、数字を付けるなら残りの候補の扱いも揃える。
2. **自然さ、次トークンの確率、語句全体の確率、犯人の見込みを分ける。** 「飲んだ」「富士山」「7個」等が一トークンになる保証はない。同じ犯人を姓名・名字・代名詞で指せるので、人物の確率と次語の確率も一致しない。
3. **未知だから均等、全文を読めば100%とはしない。** 文脈が少なくても事前の偏りがあり、手掛かりを増やしても確実とは限らない。「文脈が増えると候補の見込みが変わる」という例で目的を満たせる。
4. **実測を採るなら条件も保存する。** モデル、版、入力全文、候補の分割、語句への集計方法を決める。今回は実測も新規モデルの読み込みもしていない。

## 全48文の照合

以下はクリップ名と文番号で原稿を指す。表中のS番号は末尾の出典へ対応する。「案内／問い」は外部の事実断定ではない。本文の短い修正案と併せて読む。

| 扉 | 判定 | 根拠・条件・対応 |
|---|---|---|
| 1 AIエージェントの話をする | 案内 | 教材の主題。外部検証不要 |
| 2 自分で調べ、道具を使い、最後まで進める | 言い過ぎを修正 | S47–S50。進め方を選ぶ仕組みは確認。完遂保証にせず「完了を目指して進める」。調査が毎回必須とも限らない |
| 3 仕事のあちこちで使われる | 確認（範囲付き） | S51/S52の利用例・調査。多様な業務の利用を意味し、全職場での普及を意味しない |
| 4 中を土台から見る | 案内 | 構成上の約束。公開前に実際の章構成と照合 |

| 1-1 | 判定 | 根拠・条件・対応 |
|---|---|---|
| 1 エージェントは部品の組合せ | 確認（対象限定） | S47–S49。ここで扱うLLMエージェントの説明 |
| 2 中核がLLM | 確認（対象限定） | S48/S49。agent一般の歴史上の定義をLLMへ限定しない |
| 3 Large Language Model／大規模言語モデル | 確認 | S44等。「大規模」の共通の数値境界を含む定義ではない |
| 4 一つだけ、文章の次の一語を予測 | 言い過ぎ・単位の訂正 | S8/S12/S32/S42–S46。自己回帰の生成手順へ限定し、一語をトークンへ訂正。訓練・内部処理・システム全体と分ける |
| 5 たったそれだけでどうして仕事をこなせるか | 問いの前提を修正 | 4と連動。「続きを予測する仕組みが、どうして仕事をこなす力につながるのか」 |
| 6 これから追う | 案内 | 外部検証不要 |
| 7 言語モデルから | 案内 | 次のクリップとの接続 |

| 1-2 | 判定 | 根拠・条件・対応 |
|---|---|---|
| 1 モデルはまねて予測するもの | 言い過ぎ（定義が狭い） | S1/S2。説明・理解等にも使う。一般定義を広げるか、今回見る予測用モデルへ限定 |
| 2 天気モデルは空気の動きをまねる | 確認（物理型の例） | S3/S5/S6。温度等も含む物理型数値予報の例とする。現在の全気象モデルを物理式型としない |
| 3 言語モデルがまねるのは並び方 | 確認（平易な表現） | S7–S9/S12。確率的規則性を捉えるという意味。人の言語処理の全機構の模倣ではない |
| 4 言葉はでたらめに並ばない | 確認 | S13–S17。語順・共起・意味・文脈の規則性 |
| 5 飲んだが一番、買ったも、読んだはまず来ない | 未実測の順位を修正 | 日常的な自然さの例は妥当。「飲んだは自然」に弱め、棒には最初から「例」。S15等は日本語3候補の実測ではない |
| 6 文法・言い回し・意味の決まり | 確認（傾向を含む） | S13–S17。「決まりや傾向」、または「意味や文脈によって続きやすさが変わる」 |
| 7 決まりの重なりが言語の構造／次を予測 | 定義の限定を推奨 | S13等とS7–S9。「こうした結び付きも、言語の構造の一つ」。構造全般と同一視しない |
| 8 降水確率70%と同じ | 確認（共通点を限定） | S4/S7。確率で表す点。仕組み・確率の対象・校正まで同じではない |
| 9 文脈から候補に確率を付ける | 確認 | S7/S8/S12。候補全体の条件付き分布。実際の候補選択とは別 |
| 10 LLMの次の一語はこのこと | 用語を訂正 | 1-1の4と揃える。語句候補の図を一トークンの実測分布としない |
| 11 ずんだもんの問い | 問い | 技術上の疑問。音源用途はS53–S56との比較で問題の明白な該当なし |
| 12 並び方の中に人の知識や考え | 確認（比喩） | S21/S23。文章には知識や考えた道筋も書かれるという範囲。完全・正確に全て記録されるとはしない |

| 深掘り | 判定 | 根拠・条件・対応 |
|---|---|---|
| 1 次語予測がどうしてAIか | 問い | 問題設定。音源条件は本報告N10 |
| 2 次を当てるのに何が要るか、四問 | 問いの枠を限定 | S19/S23と本報告N5。四問は能力が役立つ場面の例。必須能力を識別する実験ではない |
| 3 学校へ、という問題 | 例題 | 作った文の補完例。実測値なし |
| 4 行く | 確認（自然な一候補） | 言語的判断。他にも向かう・通う等があり一意ではない |
| 5 正解、文法と言い回しで当たる | 言い過ぎを修正 | 「文法や言い回しに合った自然な続き」。文法だけで原文の続きが確定するとは言わない |
| 6 日本の最高峰という問題 | 例題 | 7の事実を問う。作った問い |
| 7 富士山 | 確認 | S25国土地理院A2.11 |
| 8 文法だけでは当たらず知識が要る | 確認（説明する水準を限定） | 事実が答えを選ぶ手掛かり。単発正答から内部知識の形・方法は断定できない |
| 9 りんご3個に4個 | 例題 | 足し算を問う通常の設定 |
| 10 7個 | 確認 | 3+4=7。外部資料不要 |
| 11 これは計算 | 確認（問題の種類として） | 「足し算で答えを出せる問題」。その場の内部計算の証拠とはしない。S26–S28 |
| 12 推理小説の最後の犯人は | 例題（原典あり） | S19のたとえに対応。実在作品・実験・実測値ではない |
| 13 全部読まないと分からない | 言い過ぎを修正 | 全文の必要条件は未成立。「どんな話なのか、読んでみないと予測しにくい」等 |
| 14 最初から筋を追う必要がある | 言い過ぎを修正 | 手掛かりや人物関係を追うことが役立つ。要約・記憶・直前の答え等の反例を排除していない |
| 15 予測に知識・計算・筋を追う力が要る | 言い過ぎを修正 | S19/S21–S23/S26–S28。「役に立つ」「学習につながることがある」。任意の一問の必要条件としない |
| 16 人の知識や考えが文章に書かれる | 確認（比喩） | S21/S23。1-2の12と同じ条件 |
| 17 知能へ近づく期待がAIの話にした | 前半確認・後半訂正 | S19/S21–S23は研究上の期待。S9/S29–S33は長い来歴と複数の段階。一つの期待が初めてAIとの関係を作ったとは言えない |
| 18 当てることと理解は今も議論 | 確認 | S34/S36–S41。理解の定義、対象、評価の違いを含む。全研究者の割合・総意は未調査 |
| 19 言葉を当てるだけとは言えなくなった | 結び方の限定を推奨 | S27/S28/S36等。複雑な内部処理と次トークン生成は両立。「予測する中にも仕組みがありそう」等。人間同様の理解の証明にしない |

| 1-3 | 判定 | 根拠・条件・対応 |
|---|---|---|
| 1 この先の道筋 | 案内 | 外部検証不要 |
| 2 前半は歴史・基本・チャットボット | 案内 | 制作予定。完成後の章構成と照合 |
| 3 ツールを持たせエージェントを組立てる | 案内（技術上も妥当） | S47–S49。モデルと周辺部品を分ける導入との整合を保つ |
| 4 後半は知識・計算と値段・ハーネス | 案内 | 制作予定。各章の事実の再検証は本調査の対象外 |
| 5 大規模の意味は歴史で説明 | 案内 | LLM略語の確認は1-1の3。規模の共通の固定境界を新たに要求しない |
| 6 歴史へ、次を当てる考えはどこから | 問い・接続 | S18の1951年は先行例、S9の1975年は明確な用語使用例。考えと呼称の初出を混同しない |


## 不確実性と調査の限界

- *language model*の絶対的初出は確定していない。1975年の用例と当事者の回顧までを根拠とする。
- 例文の順位・確率、四問のモデル別正答率は未測定。作った例と実測出力を混ぜない。
- Sutskever対談は公式の時刻付き書き起こしを確認したが、動画音声との聞き合わせは未実施。映像や逐語字幕を制作する場合は28:17・28:42付近を再生確認する。
- *Stochastic Parrots*全文は未取得。S39は抄録、S31は抄録と投稿履歴までの確認であり、未読の本文から詳細を補っていない。
- 「理解」に関する代表的な資料は確認したが、2026-10-13までの全研究の網羅レビュー、研究者全体の総意の調査ではない。意識の有無は対象外。
- エージェントの数字は母集団付きの民間調査。全企業を代表する公的な普及率は今回確定できなかった。存在しないという結論ではない。
- 音源規約の「情報商材」の一般的な境界、将来の販売・別媒体配信、配信契約・画像の権利条件は本件の固定原稿の照合を超える。用途を変えるときに再確認する。
- 原稿の古い制作メモには「深掘りはまだ仕様にない」とあるが、調査終盤のspec v0.6は深掘りを定義していた。実装・動作状況は調べていない。

## 問いと計画の変遷

元の問いは「導入5本の各文が一次資料に照らして言えるか」であり、最後まで変わっていない。質問と資料群を組み合わせた12単位を完了し、7回の計画改訂を追記した。単位の追加・削除ではなく、調査中に分かった条件と対象の更新を反映した。

| 改訂 | 分かったこと・扱い |
|---|---|
| 1 | 天気にも学習型と統計的後処理がある。「天気は全て物理型か」をN1に必要な派生質問として追究。全予報システムの比較は保留 |
| 2 | 原稿の例が「きょうは天気が」から「水を」へ変更されていたため更新。用語の絶対的初出探索は保留 |
| 3 | 答え・内部機構・確率の対象を分離。「犯人の確率か次語の確率か」は図の判定に必要なので追究。実測は保留 |
| 4 | Othello後続研究を追究し、表現の選び方と一貫性の評価を整理。意識、全モデルの順位、全研究の網羅比較は保留 |
| 5 | 利用調査の年・母集団・設問を分離し、2026年資料を採用。全企業の代表的普及率は保留 |
| 6 | 音源条件は先行報告から引き継げるが、配信環境の前提は変わっていた。現行基盤の契約全体の再審査は保留 |
| 7 | 48文を照合し、四問を独立した能力の階段としない点を確認。深掘りの仕様・実装の現在地は制作側の次の確認として保留 |

派生質問が元の問いを置き換えたものはない。必要な派生質問は該当単位の中で扱い、それ以外は下記の条件付きの次の対応へ残した。

## 推奨する次の対応

1. 制作担当とボスで、1-1の4の対象限定とトークンの説明を決め、1-1の5・1-2の10・深掘り19の用語を揃える。
2. モデル一般の定義、候補の「いちばん」、四問の必要条件、深掘り17の歴史の因果、エージェントの完遂保証を、本報告の短い案の範囲へ直す。
3. 棒の「例」を最初から表示し、何の確率かを固定する。実測値を使う場合だけ、別途モデルと入力・集計条件を決めて測る。
4. 扉の利用の数字は40%の母集団・時点を表示できる場合に採る。表示が窮屈なら業務例を使う。
5. 両話者のクレジットと今回の用途確認日を制作記録へ反映する。合成・inspectは既存のプロジェクト規則に従い、ボスの承認後に行う。
6. 制作着手時に深掘りの仕様・実装の状態を確認し、章案内を完成した構成と照合する。

厳密な語源史、対談の映像引用、*Stochastic Parrots*の詳細紹介、全企業の普及率が必要になった場合だけ、対応する未確認資料を追加調査する。販売・配信方法・画像利用を変える場合は、その変更に対応する規約・契約を改めて確認する。

## 出典一覧

**以下の取得・確認日はすべて2026-10-13 UTC。** 発行日・版の日付とは区別する。出典番号はログと共通。本文で採用していない資料や、全文取得に至らなかった資料も、その範囲を明示して残す。

- **S1** National Research Council (2012), *A Framework for K-12 Science Education*, Chapter 3, Practice 2 “Developing and Using Models”, pp.56–58。https://www.nationalacademies.org/read/13165/chapter/7 。出版社の本文HTMLを確認。

- **S2** NIST/SEMATECH e-Handbook, §3.4.3 “Building Models”。https://www.itl.nist.gov/div898/handbook/ppc/section4/ppc43.htm 。web本文抽出が短かったため、curl（25秒・500kB上限、保存なし）でも本文を確認。

- **S3** 気象庁「数値予報とは」、冒頭説明と「数値予報モデルでは」で始まる段落。https://www.jma.go.jp/jma/kishou/know/whitep/1-3-1.html 。本文HTMLを確認。

- **S4** 気象庁「天気予報・天気図について」、見出し「降水確率はどうやって決めるのですか？」「『降水確率』の意味について教えてください。」。https://www.jma.go.jp/jma/kishou/know/faq/faq4.html 。本文HTMLを確認。

- **S5** 気象庁「数値予報の応用プロダクト」、冒頭第2段落（ガイダンス）。https://www.jma.go.jp/jma/kishou/know/whitep/1-3-11.html 。本文HTMLを確認。

- **S6** ECMWF, “ECMWF’s AI forecasts become operational”, 2025-02-25、冒頭と “First operational open AI model”。https://www.ecmwf.int/en/about/media-centre/news/2025/ecmwfs-ai-forecasts-become-operational 。本文HTMLを確認。

- **S7** Bengio, Ducharme, Vincent & Jauvin (2003), *A Neural Probabilistic Language Model*, JMLR 3:1137–1155、Abstract、§1 pp.1138–1139、§2 p.1141。https://jmlr.csail.mit.edu/papers/volume3/bengio03a/bengio03a.pdf （誌面情報：https://jmlr.org/papers/v3/bengio03a.html ）。PDF本文を確認。N1/N2の言語側の比較に使用。N3/N4でも使える。

- **S8** Jurafsky & Martin, *Speech and Language Processing*, 第3版草稿、2025-01-12版、Chapter 3 “N-gram Language Models”, pp.1–3、§3.1、式(3.1)・(3.3)・(3.4)。著者公開PDF：https://web.stanford.edu/~jurafsky/slp3/old_jan25/3.pdf 。定義と連鎖律の本文を確認。

- **S9** Jelinek, Bahl & Mercer (1975), “Design of a Linguistic Statistical Decoder for the Recognition of Continuous Speech”, *IEEE Transactions on Information Theory* 21(3), pp.250–256, May 1975, DOI:10.1109/TIT.1975.1055384。IBM書誌・抄録：https://research.ibm.com/publications/design-of-a-linguistic-statistical-decoder-for-the-recognition-of-continuous-speech 。著者Robert Mercerが公開した原論文の全文（ResearchGate本文抽出、特にp.252 §IV）：https://www.researchgate.net/publication/220049390_Design_of_a_linguistic_statistical_decoder_for_the_recognition_of_continuous_speech 。著者アップロード表示と原論文本文を確認。ページ境界から§IVの誌面p.252を確認。IBMの01 Jan 1975、ResearchGateのJune表示ではなく、誌面ヘッダのMAY 1975を採る。

- **S10** Jelinek (2009), “The Dawn of Statistical ASR and MT”, *Computational Linguistics* 35(4), pp.483–494、特に§1 p.484、§3 pp.485–488、p.487脚注3。著者本人の回顧。https://aclanthology.org/J09-4004/ 、本文PDF：https://aclanthology.org/J09-4004.pdf 。

- **S11** Jelinek (1976), “Continuous Speech Recognition by Statistical Methods”, *Proceedings of the IEEE* 64(4), pp.532–556, April 1976, DOI:10.1109/PROC.1976.10159。IBM公式書誌・抄録：https://research.ibm.com/publications/continuous-speech-recognition-by-statistical-methods 。出版社：https://ieeexplore.ieee.org/document/1454428/ 。IEEE検索表示で巻号・月を確認したが本文openはJavaScript確認画面。原論文全文の引用根拠としては使わない。IBMの01 Jan表示を正確な出版日とは扱わない。

- **S12** Jurafsky & Martin, 同教科書2026-08-19版、Chapter 1 “Introduction”, §1.1 p.3–4：https://web.stanford.edu/~jurafsky/slp3/1.pdf 。版の日付は著者目次 https://web.stanford.edu/~jurafsky/slp3/ とPDF先頭で確認。2026年版でも次の候補への確率分布という定義が維持されている。

- **S13** Zellig S. Harris (1954), “Distributional Structure”, *WORD* 10(2–3), pp.146–162、特に§1.1 p.146、§1.2 pp.149–151、§2.3(b) pp.156–157。原論文の大学公開スキャン：https://www.its.caltech.edu/~matilde/ZelligHarrisDistributionalStructure1954.pdf 。PDF本文と誌面ページ境界を確認。DOI:10.1080/00437956.1954.11659520。

- **S14** Kenneth Ward Church & Patrick Hanks (1990), “Word Association Norms, Mutual Information, and Lexicography”, *Computational Linguistics* 16(1), pp.22–29、Abstract、§1–2 pp.22–23。https://aclanthology.org/J90-1003/ 、原論文：https://aclanthology.org/J90-1003.pdf 。

- **S15** Philip Resnik (1997), “Selectional Preference and Sense Disambiguation”, ACL SIGLEX workshop, pp.52–57、§1–2 pp.52–53、Table 1 p.54。原論文：https://aclanthology.org/W97-0209.pdf 。

- **S16** Jurafsky & Martin, “Selectional Restrictions / Selectional Preferences”, *Speech and Language Processing* 公開講義スライド、特にスライド9–11。https://web.stanford.edu/~jurafsky/slp3/slides/22_select.pdf 。版の日付は本文で確定できず、更新時期の根拠にしない。厳密な禁止ではなく傾向として扱うという説明と、例外の実例を補助確認。

- **S17** Fernando Pereira, Naftali Tishby & Lillian Lee (1993), “Distributional Clustering of English Words”, ACL, pp.183–190、Abstract/Introduction p.183、Decision Task p.189。https://aclanthology.org/P93-1024/ 、原論文：https://aclanthology.org/P93-1024.pdf 。疎なデータ、未観測の組合せの推定、類似する用例への一般化を確認。

- **S18** Claude E. Shannon (1951), “Prediction and Entropy of Printed English”, *Bell System Technical Journal* 30(1), pp.50–64、特に§3 pp.54–58。原論文の大学公開PDF：https://sites.socsci.uci.edu/~rfutrell/teaching/itl-davis/readings/shannon1951prediction.pdf 。出版社書誌：https://onlinelibrary.wiley.com/doi/pdf/10.1002/j.1538-7305.1951.tb01366.x 。本文の実験手順と誌面ページを確認。刊行は1951年1月。

- **S19** NVIDIA GTC Spring 2023、S52092, “Fireside Chat with Ilya Sutskever and Jensen Huang: AI Today and Vision of the Future”。公式動画・時刻付き書き起こし：https://www.nvidia.com/en-us/on-demand/session/gtcspring23-s52092/ 。27:38–29:30（理解・推理小説）、12:17–16:59（圧縮と事前学習の当事者回顧）、21:06–23:33（文章・世界・追加訓練）。ページHTMLの公開メタデータは2023-03-22T09:00:00Z。通常のopenでは本文72行の殻のみだったが、同じ公式URLを検索した結果には、短いスニペットではなく時刻付き本文の長い抜粋が返り、上記区間を確認できた。動画音声との独立した聞き合わせはしていない。

- **S20** NVIDIA公式ブログ、Rick Merritt, “AI Opener: OpenAI’s Sutskever in Conversation With Jensen Huang”, 2023-03-22。https://blogs.nvidia.com/blog/sutskever-openai-gtc/ 。冒頭第2段落に、対談はGPT-4発表の翌日に収録したと明記。公開日と収録日は異なる。S19の公開メタデータと合わせ、出典表記は「2023年3月のNVIDIA GTC対談（公式公開2023-03-22）」が確実。第三者ページにある3月23日をそのまま採らない。

- **S21** Matthew V. Mahoney (1999), “Text Compression as a Test for Artificial Intelligence”, AAAI-99 Proceedingsの1ページのポスター論文。著者公開PDF：https://www.mattmahoney.net/AAAI99-177.pdf 。全文を確認。PDFに誌面ページ番号が見えないため、引用位置はPDF p.1・第2段落とする。参考文献に同名の長い報告があるが、両者を混同しない。

- **S22** Marcus Hutter, “Human Knowledge Compression Contest: Frequently Asked Questions & Answers”。権利者サイトの本文：https://hutter1.net/prize/hfaq.htm 、見出し “What does compression has to do with (artificial) intelligence?”、“Why is ‘understanding’ of the text or ‘intelligence’ needed to achieve maximal compression?”。公式prize.hutter1.netの別ホスト表記はTLSホスト名不一致で直接取得に失敗したため、同一運営者のhutter1.net/prizeの本文で確認した。現在のFAQは更新されており、特定の段落を2006年当時の逐語記録とは扱わない。

- **S23** Radford et al. (2019), *Language Models are Unsupervised Multitask Learners*, §2 p.3、§6 p.9、§7 p.10。原論文：https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf 。本文を確認。発表日2025年等とする検索インデックス情報は採らず、公式発表 https://openai.com/index/better-language-models/ の2019-02-14で確認。

- **S24** OpenAI, “Improving language understanding with unsupervised learning”, 2018-06-11。https://openai.com/index/language-unsupervised/ 。GPTの事前学習と教師あり微調整、COPA／RACE／ROCStoriesの説明を本文確認。GPT原論文自体の詳しい比較はUnit 7へ渡す。

- **S25** 国土地理院「2 国土の情報に関するQ&A」、Q2.11「日本で一番低い山，高い山を教えてください」、A2.11。https://www.gsi.go.jp/kohokocho/FAQ2.html 。本文を開き、富士山が日本で最も高い山という回答を確認。ページ最終更新表示2024-01-30。

- **S26** Brown et al. (2020), *Language Models are Few-Shot Learners*, §3.9.1 “Arithmetic”、Table 3.9、同節末尾の訓練データ照合。本文HTML：https://arxiv.org/html/2005.14165v4 、書誌：https://arxiv.org/abs/2005.14165 。§3.9.1本文を確認。

- **S27** Nikankin, Reusch, Mueller & Belinkov, *Arithmetic Without Algorithms: Language Models Solve Math With a Bag of Heuristics*, ICLR 2025版、§2.1 pp.2–3、§7–8 p.10。著者研究グループ公開PDF：https://technion-cs-nlp.github.io/llm-arithmetic-heuristics/paper.pdf 。初出2024-10-28の書誌：https://arxiv.org/abs/2410.21272 。本文を確認。引用は会議論文版による。

- **S28** Lindsey et al. (Anthropic), *On the Biology of a Large Language Model*, 2025-03-27、“Addition”、冒頭 “A note on our approach and its limitations”、“Introductory Example: Multi-step Reasoning”。https://transformer-circuits.pub/2025/attribution-graphs/biology.html 。本文を確認。加算の詳細な方法論を載せる姉妹論文は検索で確認したが、本単位の主要根拠はこの本文。

- **S29** Brown et al. (1990), “A Statistical Approach to Machine Translation”, *Computational Linguistics* 16(2), pp.79–85。書誌：https://aclanthology.org/J90-2002/ 、原論文：https://aclanthology.org/J90-2002.pdf 。§1 p.79、§2 p.80、Figure 1、§5 p.82を確認。

- **S30** Radford, Narasimhan, Salimans & Sutskever (2018), *Improving Language Understanding by Generative Pre-Training*。原論文：https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf 。Abstract p.1、§1 pp.1–2、§5 pp.7–8を確認。2018-06-11の公式発表S24（https://openai.com/index/language-unsupervised/ ）も再取得。

- **S31** Vaswani et al. (2017), *Attention Is All You Need*、著者投稿のAbstractと投稿履歴：https://arxiv.org/abs/1706.03762 。初回投稿2017-06-12。今回の確認は、Transformerの提案と機械翻訳での評価があったことまでで、実験詳細の再評価はしていない。

- **S32** Ouyang et al. (2022), *Training language models to follow instructions with human feedback*。原論文：https://cdn.openai.com/papers/Training_language_models_to_follow_instructions_with_human_feedback.pdf 、書誌：https://arxiv.org/abs/2203.02155 。Abstract p.1、§1 pp.1–3、Figure 2を確認。

- **S33** OpenAI, “Aligning language models to follow instructions”, 2022-01-27。https://openai.com/index/instruction-following/ 。発表日、冒頭、Methodsを確認。ここにあるAPI提供状況は2022年当時の記録であり、2026年の現状を示す出典にはしない。

- **S34** Bender & Koller (2020), “Climbing towards NLU: On Meaning, Form, and Understanding in the Age of Data”, ACL, pp.5185–5198。https://aclanthology.org/2020.acl-main.463.pdf 。Abstract、§1、§3 pp.5187–5188、§4 pp.5188–5189を確認。

- **S35** Bender, Gebru, McMillan-Major & Shmitchell (2021), “On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?”, FAccT, pp.610–623。DOI：https://doi.org/10.1145/3442188.3445922 。著者の案内 https://faculty.washington.edu/ebender/stochasticparrots/ で当該論文へのリンクを確認。出版社HTML/PDFと推定著者PDFの取得は失敗。**この単位では原論文全文を読めていないため、逐語引用や詳細な原論文要約の根拠にはしない。** 著者自身による2025年の振り返りS41で補う。

- **S36** Li, Hopkins, Bau, Viégas, Pfister & Wattenberg, “Emergent World Representations: Exploring a Sequence Model Trained on a Synthetic Task”, ICLR 2023（初回投稿2022-10-24）。https://arxiv.org/abs/2210.13382 、本文 https://arxiv.org/pdf/2210.13382 。Abstract、§4.2 p.7、§7 p.9を確認。OpenReview PDFはブラウザ確認画面のためarXiv著者稿を使用。

- **S37** Nanda, Lee & Wattenberg (2023), “Emergent Linear Representations in World Models of Self-Supervised Sequence Models”, BlackboxNLP, pp.16–30、2023-12-07。https://aclanthology.org/2023.blackboxnlp-1.2/ 、原論文 https://aclanthology.org/2023.blackboxnlp-1.2.pdf 。Abstract・§1 pp.16–17を確認。

- **S38** Vafa, Chen, Kleinberg, Mullainathan & Rambachan (2024), “Evaluating the World Model Implicit in a Generative Model”, NeurIPS 2024。著者稿本文 https://arxiv.org/html/2406.03689v2 、会議書誌 https://papers.nips.cc/paper_files/paper/2024/hash/2f6a6317bada76b26a4f61bb70a7db59-Abstract-Conference.html 。本文§3.4、§4、§5、Appendix F Table 6を確認。会議PDFは取得失敗のため著者稿の版を明記する。

- **S39** Vafa, Chang, Rambachan & Mullainathan (2025), “What Has a Foundation Model Found? Using Inductive Bias to Probe for World Models”, ICML, PMLR 267:60727–60747。https://proceedings.mlr.press/v267/vafa25a.html 。**著者の公式Abstractを確認した範囲**。掲載PDFの取得は失敗し、実験詳細の判定には使わない。

- **S40** Mitchell & Krakauer (2023), “The Debate Over Understanding in AI’s Large Language Models”, PNAS 120(13):e2215907120、2023-03-21。https://doi.org/10.1073/pnas.2215907120 、確認した著者稿 https://arxiv.org/html/2210.13966v3 （2023-02-10版）。冒頭から理解・ベンチマークの議論を確認。論争の整理と著者の立場に用い、ここから引用される他人の実験やアンケート数値を原典未確認のまま採用しない。

- **S41** Emily M. Bender (2025), “Resisting Dehumanization in the Age of ‘AI’: The View from the Humanities”, ISU AI & the Humanities, 2025-04-16。著者公開スライド https://faculty.washington.edu/ebender/papers/Bender-ISU-2025.pdf 。表紙、PDFの6–7ページ（0始まりP5–6）を確認。著者が2020/2021年論文をどう位置付けているかの一次資料であり、新しい対照実験ではない。

- **S42** OpenAI (2023), *GPT-4 Technical Report*, Abstract・§1 p.1、§2 p.2。https://cdn.openai.com/papers/gpt-4.pdf 。本文PDFを取得し、次トークン予測の事前学習、追加訓練、画像・文章入力と文章出力を確認。書誌 https://arxiv.org/abs/2303.08774 。

- **S43** OpenAI API, “Advanced usage”, “Managing tokens”節。https://developers.openai.com/api/docs/guides/advanced-usage 。本文を確認。トークンの一般説明だけを用い、同ページの古いモデルの料金・上限等は採らない。

- **S44** Nie et al. (2025), “Large Language Diffusion Models”, arXiv:2502.09992、初回2025-02-14、確認した著者稿v3は2025-10-18。https://arxiv.org/abs/2502.09992 、本文 https://arxiv.org/html/2502.09992v3 。Abstract、§2.1–2.4、Figure 2を確認。2025-10-18は今回の基準日2026-10-13より前であり、使用可能。

- **S45** Bill Chen / OpenAI (2025-05-11), “Better performance from reasoning models using the Responses API”, “How Reasoning Models work”節。https://developers.openai.com/cookbook/examples/responses_api/reasoning_items 。本文の日付・アーカイブ表示を確認。o3/o4-miniの内部推論トークンの説明に限定して使用し、現在のAPIの推奨設定とは扱わない。

- **S46** Gemini Team / Google (2023), “Gemini: A Family of Highly Capable Multimodal Models”, §2 “Model Architecture”、Figure 2、§4。https://arxiv.org/abs/2312.11805 、確認した本文v4 https://arxiv.org/html/2312.11805v4 。画像・音声・動画・文章の入力、画像トークン、事前学習データを確認。

- **S47** Anthropic, “Building effective agents”, 2024-12-19。https://www.anthropic.com/engineering/building-effective-agents 。本文の“What are agents?”、“Building blocks, workflows, and agents”、“Agents”を確認。

- **S48** OpenAI, *A practical guide to building agents*。https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf 。PDFの印刷ページ4（What is an agent?）、7（Agent design foundations）、31（Plan for human intervention）を確認。PDF自体に明確な発行日を確認できなかったため、取得時点の公式資料として扱う。

- **S49** OpenAI Developers, “Building agents”。https://developers.openai.com/tracks/building-agents 。Introduction、Core conceptsを確認。日付付き固定版ではない。

- **S50** Google Cloud, “What is an AI agent?”。https://cloud.google.com/discover/what-are-ai-agents 。冒頭定義、Key features、How do AI agents work? を確認。ページ更新表示は04/02/2026（この表記を記録し、月日を推定して断定しない）。

- **S51** Microsoft, *2025 Work Trend Index: The year the Frontier Firm is born*, 2025-04-23。https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born 。本文の46%・81%、末尾Methodology内のSurvey Methodology・Audiencesを確認。

- **S52** McKinsey, *The state of AI in 2026: On the road to ROI*, 2026-08-25。https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai 。Key takeaways、Use of AI is deepening…、Use of agentic AI varies by industry、About the researchを確認。Exhibit 2・3の画像取得は失敗、PDFリンクも本文へ戻ったため、図の細目ではなく**本文に明記された結果**を使う。

- **S53** VOICEVOX「ソフトウェア利用規約」、許諾内容1–3、禁止事項、その他。https://voicevox.hiroshiba.jp/term/ 。公式本文を確認。

- **S54** SSS LLC.「音源利用ガイドライン」、冒頭の「VOICEVOX ずんだもん、…、四国めたん、…音源利用規約」許諾内容1–3、および「音源についての共通規約」禁止事項1–6。https://zunko.jp/con_ongen_kiyaku.html 。公式本文を確認。ウェブ本文に施行日・改定日は見つからず、取得日を記録する。

- **S55** VOICEVOX「よくあるご質問」ライセンス・利用規約に関する質問、特に「会社や学校で使いたいです」「『VOICEVOX:キャラクター名』のクレジット表記を省略するにはどうすれば良いですか？」、その他のキャラクター権利者の説明。https://voicevox.hiroshiba.jp/qa/ 。公式本文を確認。

- **S56** Engine 0.25.2同梱ファイルを起動せず読取り確認。ずんだもん：[policy.md](/home/apm/apps/voicevox-engine-0.25.2/resources/character_info/388f246b-8c41-4ac1-8e2d-5d79f3ff56d9/policy.md)。四国めたん：[policy.md](/home/apm/apps/voicevox-engine-0.25.2/resources/character_info/7ffcb7ce-00ec-4bdc-82cd-45a8889e43ff/policy.md)。Engine：[terms_of_service.md](/home/apm/apps/voicevox-engine-0.25.2/resources/engine_manifest_assets/terms_of_service.md)。ファイルのSHA-256はlog.mdのUnit 11に記録。

- **ローカル資料**：[原稿README](../../decks/llm/README.md)、[AGENTS.md](../../AGENTS.md)、[仕様](../../docs/spec.md)、[先行LLM報告](../llm-facts/report.md)、[先行agent報告](../agent-facts/report.md)、[先行音声報告](../voice-terms/report.md)。先行報告は構成・論点の確認に使い、今回の外部事実の根拠は上記一次資料で取り直した。
