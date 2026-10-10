# 7 章から先に要る知識（2026-10-10 の洗い出し）

7 章から先に、最新の話題の説明を入れるための下調べです。ボスが例に挙げたのは、LLM Wiki はどんな考えから出てきたのか、DeepSeek Harness はなぜ優れているのか、の二つです。どちらも 2026 年 4 月以降の話題なので、この日に web で一次資料と報道を集めました。

この文書では、二つの説明の筋を組み、筋の一歩ごとに要る知識を挙げ、いまの 1〜6 章で足りるかを見ます。事実の確かさは次の印で分けます。画面と字幕に使う前に、research で裏を取ります。

- 一次: 公式の文書、論文、本人の投稿を読んだ。引用する文言は、使う前にもう一度確かめる。
- 二次: 報道や解説でだけ見た。
- 未: まだ調べていない（Claude の手持ちの知識）。

## 1. 二つの題材

### LLM Wiki（2026 年 4 月、Andrej Karpathy）

- 2026-04-02 20:42 UTC、X に「LLM Knowledge Bases」を投稿した（日時は投稿の ID から計算）。研究の話題ごとに LLM に知識ベースを作らせていて、最近のトークンの多くはコードでなく知識の操作に使っている、と書き出している（一次。全文はまだ読んでいない）。
  - 資料を raw/ に置き、LLM が .md の wiki に「compile」する。見るのは Obsidian で、wiki は LLM の領分になり、人はほとんど手を入れない（二次）。
  - 約 100 記事、40 万語の規模なら凝った RAG は要らず、LLM が保つ索引と要約で足りる（二次）。
- 2026-04-04 16:45 UTC の投稿で、続きを gist「llm-wiki.md」として出し、「idea file」と呼んだ（一次）。gist の中身（一次）:
  - RAG は質問のたびに知識を一から掘り起こすので、何も積み上がらない。wiki のほうは「a persistent, compounding artifact」になる。
  - 三層に分ける。資料は変えない。wiki は LLM が書いて保つ。決まりの文書（CLAUDE.md や AGENTS.md）は人と LLM で育てる。
  - 操作は三つ。ingest は 1 つの資料で 10〜15 頁を更新する。query では、よい答えを wiki に戻す。lint は矛盾、古い主張、孤立した頁、欠けた概念を探す。
  - index.md は頁の目録で、問いのときに最初に読む。log.md は追記だけの記録。約 100 資料、数百頁までなら埋め込みの検索なしで回る。
  - 人は資料を選び、問いを立て、意味を考える。LLM は要約、相互参照、整理、帳簿付けを受け持つ。
  - Vannevar Bush の Memex（1945）に通じる考えだとし、Bush が答えられなかった「誰が保守するのか」を LLM が引き受ける、と書く。
  - 「Humans abandon wikis because the maintenance burden grows faster than the value.」
- idea file という配り方: エージェントの時代にはコードやアプリを配る意味が薄れ、考えを配れば相手のエージェントが合わせて作る（04-04 の投稿。一次、検索結果に出た冒頭だけ）。
- その後（二次）
  - 同じ形が製品になった。Cognition の DeepWiki、Factory の AutoWiki、LangChain の OpenWiki、Garry Tan の GBrain（mem0「The State of Agent Wikis」）。ただし DeepWiki は 2025 年からある（未）ので、「LLM Wiki が最初」とは書けない。
  - 批判は主に五つ。言い換えの言い換えで細部が平らになる。数百ファイルを超えると崩れる。古くなった頁に気づきにくい（「a compiled wiki is a cache, and caches lie」）。整理の作業と一緒に、考えることまで手放してしまう。そして「ただの RAG だ」という批判で、これには、書き戻すループが新しいという反論がある。
  - 線の引き方: wiki は資料に何があるかを持ち、memory は相手が誰で何を決めたかを持つ（mem0）。

### DeepSeek Harness（2026 年 8 月、DeepSeek）

- github.com/deepseek-ai/deepseek-harness。MIT ライセンスの developer preview で、コマンドは dsh（一次: README）。README は「THERE WILL BE COMPATIBILITY-BREAKING CHANGES.」と明記している。公開は 2026-08-13 で、DeepSeek-V4-Pro の正式版（0813）と同じ日（二次）。
- 標語は「Everything is a Plugin」。モデルの差し込み口、ツールの登録、セッションの記録、エージェントのループまでがプラグインで、設定で差し替えられる。「There is no privileged core to patch.」（一次: docs/architecture.md）
- 土台は Cordis という枠組み。プラグインは共有の context にサービス、型付きのイベント、取り消せる効果を足し、外すとその登録が巻き戻る（一次）。
  - 理論の論文は Shi、Zhang、Cui「A Programming Paradigm for Spatiotemporal Composability」（arXiv:2608.25512、北京大学と DeepSeek-AI、2026-08-26、92 ページ）。二つに分けて形式化している。時間の合成は、部品を外したら副作用が残らないこと。空間の合成は、部品が依存を宣言し、文脈が変わるたびに有効と無効が切り替わること。動機には「self-evolving agent harnesses」を挙げる（一次: 要旨）。
- セッションの記録は追記だけの JSONL で、モデルに渡す文脈はここから組み立てる。原則は「Model-visible means logged」で、どのリクエストも記録から作り直せる（一次）。
- ステップはモデルへのリクエスト 1 回とそのツール呼び出し、ターンは 0 回以上のステップ。ループの節目（ツールの実行の前、実行、後など）にイベントがあり、権限などの決まりはそこに差し込む（一次）。
- 起動の形（profile）は web、headless、sdk、sdk-minimal、acp（一次: apps/cli/README.md）。次のものは解説サイトでだけ見た（二次）。
  - Standard、Minimal、Code（PTC）、Creator の四つのプリセット。
  - Minimal は bash と str_replace_editor だけで、圧縮をしない。
  - Claude Code と Codex を子エージェントとして呼ぶ橋。
  - Landlock と Seatbelt のサンドボックス。
- DeepSeek-V4-Pro-0813 のモデルカードの注: 公開ベンチマークのうちコードエージェントの課題は、DeepSeek Harness の minimal モードで測った。推論の effort は max、temperature 1.0、top_p 0.95（一次: Hugging Face）。報道では、Harness は 2026-07-31（V4-Flash の公開）まで社内だけのもので、それまでの注は外から確かめられない環境を指していた（二次）。
- 優れているといわれる点（二次）: 部品を全部差し替えられる。モデルを選ばない。点を測った環境を誰でも動かし直せる。各ステップが見える。36Kr は OpenAI と Anthropic のハーネスを「black box」と呼び、両社は自社のモデルと縦に組み、DeepSeek は横に広げる、と見る。
- 割り引く材料
  - arXiv:2608.01347（v6、2026-09-10）は、モデルを Claude Sonnet 5 に固定して dsh 0.1.0rc7 を測った。既定の構成はふつうの依頼にも強い推論をかけていて、effort を下げるだけで 1 回あたりの費用が約 75% 減った。effort を抑える効果の大きさは、ハーネスの既定と依頼の方針しだいで変わる、という結論（一次: 本文 6.1 節と表 3）。
  - OpenAI も 2026-08-19 に「Codex as a platform: build on the open agent harness」を出し、Codex のハーネス（Apache-2.0）を他社の製品に組み込める形で示した（二次）。Codex CLI は 2025 年 4 月からオープンソースなので（agent-facts S3）、開いたハーネスは DeepSeek だけのものではない。
  - ベンチマークの数字の多くは DeepSeek の自己申告で、同じ表でも DeepSWE や Toolathlon-Verified では Fable 5 のほうが高い（一次: モデルカード）。

## 2. 説明の筋と、一歩ごとに要る知識

「いまの章」は、その知識を扱っているクリップです。「新」は、いまのデッキにない知識です。

### LLM Wiki はどんな考えから出てきたか

| 筋 | 要る知識 | いまの章 |
|---|---|---|
| 1. RAG は質問のたびに断片を探し直すので、まとめが残らない | RAG の手順。モデルは毎回文書を全部読み直し、セッションが変われば何も覚えていない | 5-1、5-2。3-4、4-4 |
| 2. 文脈の窓に全部は入らない。入っても、長いほど質が落ちる | 窓の上限。実際に使える長さは公称より短い（context rot） | 2-6、6-6。新 |
| 3. 人は昔から、知識を積み上げる場所を作ってきた | Memex（1945）、ハイパーテキスト、wiki、個人の知識管理（ツェッテルカステン、Obsidian、バックリンク） | 新 |
| 4. それでも続かない。保守の手間が、価値より速く増える | 保守の負担（Karpathy の論点） | 新 |
| 5. 2025〜26 年、帳簿付けを嫌がらない保守係が現れた | エージェントがファイルを読み書きする。長い仕事を任せられる | 5-3〜5-5。6-9 |
| 6. 資料を一度読ませて wiki に編み込み、索引をたどって答え、ときどき点検する | 三層と三つの操作。目録を先に読み、要る頁だけを開く。決まりの文書（CLAUDE.md、AGENTS.md） | 新。新。6-6 |
| 7. 「その場で探す」から「前もって編む」へ | 先に計算して置いておく考え（コンパイル、キャッシュ）。先行例（GraphRAG、DeepWiki） | 新 |
| 8. 配り方も変わる。コードでなく考えを配る | idea file。エージェントがコードを書く。Karpathy の Software 3.0 などの言い方 | 新。5-5。新 |
| 9. 限界と、その後 | 言い換えの劣化と、出典へのたどり方。規模の壁。各社の実装。wiki と memory の区別 | 3-5 の続き。新 |

### DeepSeek Harness はなぜ優れているといわれるか

| 筋 | 要る知識 | いまの章 |
|---|---|---|
| 1. 点数は、モデルとハーネスと設定の組で決まる | 同じモデルでもハーネスで変わる。推論の effort（考える量を選ぶ） | 6-2。新 |
| 2. DeepSeek は自社の点を Harness の minimal モードで測り、その環境を公開した | ベンチマークの読み方（何を測るか、飽和、自己申告と第三者の測定）。再現できること。オープンソースのライセンス | 新 |
| 3. 設計の芯は、すべてが部品で、特別な中核がないこと | ハーネスの仕事の分け方。プラグイン | 6-1。新 |
| 4. 部品を外しても跡が残らず、依存がそろえば動き出す | 副作用、取り消せる効果、依存の宣言（Cordis） | 新 |
| 5. だから、動かしたまま組み替えられる。人もエージェントもハーネスを直していける | ハーネス工学（2026-02）。ハーネスの自動改良（Meta-Harness、Self-Harness） | 新 |
| 6. モデルが見たものは、必ず記録にある | セッションの記録。記録から文脈を組み立てる（再開、分岐、再生） | 6-5。新 |
| 7. どのモデルでも動き、他社のエージェントも子として呼べる | サブエージェント。エディタとハーネスをつなぐ約束（ACP） | 6-7。新 |
| 8. 安全は、ループの節目と OS の機能で守る | 権限と承認。OS のサンドボックス（Landlock、Seatbelt） | 6-8。新 |
| 9. 割り引く材料 | 成功 1 件あたりの費用。既定の設定の効き方。開いたハーネスはほかにもある | 新。新。5-4 |

## 3. いまのデッキにない知識

二つの説明のどちらかが、これなしでは成り立たないもの:

1. 実際に使える文脈の長さ（context rot）
2. 知識を積み上げる場所の系譜（Memex、ハイパーテキスト、wiki、個人の知識管理）
3. 前もって編むか、その場で探すか（コンパイルとキャッシュ）
4. 状態をファイルに出す（目録、記録、進み具合のメモ）。6-5 と 6-6 で一部に触れているが、一つの考えとしては扱っていない
5. ベンチマークの読み方（何を測るか、ハーネスと設定込みの値であること、自己申告と第三者、飽和）
6. 推論の effort（考える量を選ぶと、点と費用が変わる）
7. プラグインと、取り消せる効果
8. 記録を正本にする（追記だけの記録から状態を組み立てる）
9. ハーネス工学と、ハーネスの自動改良
10. オープンソースのライセンスと、開いたハーネス

あると説明が深まるもの:

- MoE（V4-Pro は 1.6T のパラメータのうち、1 トークンごとに 49B を使う。二次）
- KV キャッシュとプロンプトキャッシュ。読み直しの費用と、キャッシュに当たった入力の値段
- DeepSeek の歩み（R1 が 2025-01（未）、V4 のプレビューが 2026-04-24（二次））
- まとめて実行する呼び出し（programmatic tool calling、Code mode）。ループの往復を減らす
- スキル（説明書を要るときだけ開く）。4-2 の説明書と、LLM Wiki の目録の両方に通じる
- エージェント向けの強化学習（環境の中で練習する）。モデルが自分のハーネスに合わせて鍛えられる話につながる

## 4. 同じ土台で話せる、ほかの最新の話題（候補）

| 話題 | 時期 | 中身と、使う土台 |
|---|---|---|
| ハーネス工学（Mitchell Hashimoto の投稿、OpenAI「Harness engineering」） | 2026-02（二次） | エージェントの失敗をハーネスの不具合として直す。AGENTS.md は短い地図にする |
| ハーネスの自動改良（Meta-Harness、Self-Harness ほか） | 2026-03〜（二次） | ハーネスのコードを別のエージェントや自分が書き換え、点を上げる |
| 開いたハーネス（DeepSeek Harness、Codex as a platform） | 2026-08 | 上の DeepSeek Harness の筋 |
| 長く走るエージェントのハーネス（Anthropic） | 2025-11（未） | 進み具合をファイルに出して、窓をまたぐ。LLM Wiki と同じ考え |
| エージェント wiki（DeepWiki、AutoWiki、OpenWiki） | 2025〜26（二次） | LLM Wiki の筋の 9 |
| スキル | 2025-10〜（未） | 説明書を要るときだけ開く |
| まとめて実行する呼び出し（PTC、Code mode） | 2025-09〜（未） | 4-5 のループの往復を減らす |

## 5. 図の軸の続け方（案）

- LLM Wiki: ツールの位置にフォルダ（raw/、wiki/、index.md、log.md）を置く。文書（窓）はセッションごとに消えるが、フォルダは残る。問いのたびに index.md を読み、要る頁だけを開き、答えを頁に書き戻す。6-6「窓に収める」と対になる。
- DeepSeek Harness: ハーネスの枠そのものを部品に分ける（モデルの差し込み口、ツールの登録、記録、ループ）。部品を抜くと、その部品が登録したものも一緒に消える。別の部品を差すと動き出す。6-1 の 6 枚のカードを、差し替えられる部品として描き直せる。
- 構成: いまは 6-10 nest がデッキの締めで、開幕の路線図は六章。7 章を足すなら、締めの位置と路線図を決め直す。

## 6. 裏を取ること（research に回す）

LLM Wiki

- L1 X の二つの投稿の全文と、gist の日付、改訂の有無、引用する文の原文
- L2 「Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase.」の出どころ（gist か、投稿か、他人の言い換えか）
- L3 Memex の原典（Bush「As We May Think」1945）と、gist での触れ方
- L4 ハイパーテキスト、WikiWikiWeb、Wikipedia、ツェッテルカステン、Obsidian の年と、最初の形
- L5 前もって編む先行例（GraphRAG、DeepWiki）の日付と仕組み
- L6 その後の実装（AutoWiki、OpenWiki、GBrain）の日付と、mem0 の整理の原文
- L7 批判の出どころ（Hacker News、gist のコメント）と、自分の書いた要約を読み直すと劣化するという研究（arXiv:2608.22118 など）
- L8 context rot の測定（Chroma の 2025 年の報告など）と、実際に使える長さ

DeepSeek Harness

- D1 公開の日時、版（0.1.0-rc.5 と報じられている）、developer preview の文言、社内だけで使っていた期間
- D2 四つのプリセットが公式にあるか、それぞれのツール、Minimal の中身（bash、str_replace_editor、圧縮なし）
- D3 Claude Code と Codex への橋、サンドボックスの実装、acp の profile
- D4 Cordis の論文の定義と例。8 月 13 日に出たと報じられた「88 ページの草稿」と arXiv 版の関係
- D5 モデルカードの表と注（一次で見た）を、第三者の測定（Vals、Artificial Analysis）と並べる
- D6 arXiv:2608.01347 の dsh の結果（表 3）の条件
- D7 V4 の事実（2026-04-24 のプレビュー、1.6T と 49B、100 万トークン、V3.2 と比べた計算量 27% と KV キャッシュ 10%、2026-08-16 からの値段）。モデルカードは 1.7T と書いているので、数え方の違いを確かめる
- D8 OpenAI「Codex as a platform」（2026-08-19）。Codex のどこが開いていて、どこが閉じているか
- D9 ハーネス工学の出どころ（Hashimoto の投稿、OpenAI の 2026-02-11 の記事の数字）
- D10 Meta-Harness（arXiv:2603.28052）と Self-Harness（arXiv:2606.09498）の数字と条件

## 集めた資料

一次

- Karpathy「LLM Knowledge Bases」 https://x.com/karpathy/status/2039805659525644595
- Karpathy の idea file の投稿 https://x.com/karpathy/status/2040470801506541998
- Karpathy「llm-wiki.md」 https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- DeepSeek Harness の README と設計 https://github.com/deepseek-ai/deepseek-harness （docs/architecture.md、apps/cli/README.md）
- Shi ほか、arXiv:2608.25512 https://arxiv.org/abs/2608.25512
- DeepSeek-V4-Pro-0813 のモデルカード https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813
- Weinberger、Hozez、arXiv:2608.01347 https://arxiv.org/abs/2608.01347

二次

- VentureBeat（2026-08-13）DeepSeek Harness と V4-Pro の値段
- 36Kr（2026-08-15）DeepSeek Harness の公開の経緯と見立て
- DEV「The Official DeepSWE Number Is Footnoted to DeepSeek Harness」（2026-08-16）
- mem0「The State of Agent Wikis」
- OpenAI「Codex as a platform」 https://developers.openai.com/blog/codex-as-a-platform
- OpenAI「Harness engineering」 https://openai.com/index/harness-engineering/
- Marmelab「The State of AI Harness Engineering 2026」（2026-09-24）
