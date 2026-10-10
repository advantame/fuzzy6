# 「知識を育てる」：LLM Wikiと関連する10項目のファクトチェック

## 要約と判定方法

**K1–K10のうちconfirmed 7件、corrected 3件（K4・K7・K8）。** 複合項目の一部には未確定点があるため、confirmedも下記の帰属・条件を伴う判定である。調査資料の取得日はすべて **2026-10-10 UTC**。開始時刻は同日03:55:01 UTC。公開日、論文初投稿、製品の提供開始、更新された記事の日付を区別した。

章の対比には、**「検索して答えるだけなら、答えは知識庫に残らない。整理した知識や有用な回答を書き戻すと、次の仕事に使える」**が安全。「RAGは蓄積しない」「Wikiなら検索不要」「蓄積すれば正確さも増す」は一般化が強すぎる。事前に要約を保存するGraphRAGは2024年、コードをwiki化するDeepWikiは2025年に先行する。[GraphRAG論文](https://arxiv.org/abs/2404.16130)、[DeepWiki公式告知](https://x.com/cognition_labs/status/1915816544480989288)

長文脈の実験は、位置や余分な情報で成績が変わることを示す。Wiki方式の優位や2026年の全モデルの限界を証明するものではない。関連製品をすべてKarpathyの後継と呼ぶこと、体験談の200／1,000ファイルを一律の限界値にすることも避ける。

[既存LLM報告](../llm-facts/report.md)と[agent報告](../agent-facts/report.md)を再利用した。特にRAGの由来・範囲、harnessと会話保存、Claude API memory toolの既検証事項は再調査していない。取得経路・試行・計画変更は[調査ログ](log.md)に記録した。デッキや実装は変更せず、モデル評価も実行していない。

以下の英語引用は短い逐語抜粋、日本語は要約または提案文言である。依頼された投稿全文や多数の長い引用は転載せず、原文リンクと節・段落の所在を示す。Xの本文は公式ページから直接取得できず、指定した原投稿を第三者転送APIで照合した箇所がある。その経路は補足に明記する。

## 全項目の判定表

| ID | Status | 画面に使える値・文言 | 一次資料・出典 | 範囲・留保 |
|---|---|---|---|---|
| K1 | confirmed | 「2026年4月2日、KarpathyがLLMで資料をwikiへ整理する運用を紹介。本人の例は約100記事・40万語。索引と要約を使って資料を読み、出力も戻す。」 | [本人投稿](https://x.com/karpathy/status/2039805659525644595) | UTC 20:42:21。本文は第三者API経由。規模と検索の十分さは本人の経験で、性能比較ではない。 |
| K2 | confirmed | 「4月4日、構想を共有するLLM Wikiのidea fileを公開。原資料・wiki・規約の三層を、取り込み・質問・点検で育てる。」 | [追投稿](https://x.com/karpathy/status/2040470801506541998)、[gist初版](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f/ac46de1ad27f92b28ac95459c782c07f6b8c964a) | IDE／programmer／codebaseの比喩はgist本文。RAGへの批評は本人の見解。gistの細かな時刻・updated_atは未確定。 |
| K3 | confirmed | 「1945年、Bushは個人の資料を蓄え、連想の道筋で結ぶ装置Memexを構想した。」 | [As We May Think、§6–8](https://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/) | July 1945。構想であり、実装されたLLMシステムではない。Bushも人による注釈・結合・共有を記述。 |
| K4 | corrected | 「1965 hypertextの提唱 → 1968 NLS実演 → 1989 Web提案／1990初サイト稼働／1991公開 → 1995 WikiWikiWeb → 2001 Wikipedia → 2020 Obsidian」。Luhmannは約1952–1997年、約9万枚。 | [Xanadu](https://xanadu.com/HISTORY/)、[NLS](https://www.dougengelbart.org/mousesite/1968Demo.html)、[CERN](https://home.cern/science/computing/the-birth-of-the-web/)、[Ward](https://c2.com/doc/etymology.html)、[Wikimedia](https://wikimediafoundation.org/wikipedia25/)、[Luhmann Archiv](https://niklas-luhmann-archiv.de/nachlass/zettelkasten)、[Obsidian開発者告知](https://news.ycombinator.com/item?id=23324598) | 「最初のWebサイト＝1991」は訂正。Wikiの3月25日はミラー等による。Obsidianの初版と公開ベータを分ける。詳細年表は下記。 |
| K5 | confirmed | 「入る長さと、使いこなせる長さは同じではない。正解の位置や余分な情報の量で成績が変わる。」GPT-3.5-Turboの20文書QAは先頭75.8%、中央53.8%、末尾63.2%。 | [Lost in the Middle v3、表6](https://arxiv.org/html/2307.03172v3)、[Context Rot](https://www.trychroma.com/research/context-rot)、[RULER v3](https://arxiv.org/html/2404.06654v3) | 特定モデル・課題・版の正答率。attention weightの測定ではない。全座標、基準線、他2研究の数値は下記。 |
| K6 | confirmed | 「LLMによる事前整理は先行例がある。GraphRAGは2024年にグラフと要約を作り、DeepWikiは2025年4月にコードをwiki化するサービスを公開。」 | [GraphRAG論文](https://arxiv.org/abs/2404.16130)、[実装公開](https://www.microsoft.com/en-us/research/blog/graphrag-new-tool-for-complex-data-discovery-now-on-github/)、[DeepWiki告知](https://x.com/cognition_labs/status/1915816544480989288) | 論文4月24日、実装7月2日。DeepWiki告知4月25日、現ブログ表示5月5日。LLM Wikiと同じ運用という意味ではない。 |
| K7 | corrected | 「関連実装にはAutoWiki、OpenWiki、GBrainなどがある。資料を整理するwikiと、個人の好みや決定を残すmemoryは用途が重なり得る。」 | [Factory履歴](https://docs.factory.com/changelog/release-notes)、[OpenWiki](https://www.langchain.com/blog/introducing-openwiki-an-open-source-agent-for-repo-documentation)、[GBrain](https://github.com/garrytan/gbrain)、[Mem0記事](https://www.linkedin.com/pulse/state-agent-wikis-mem0-6eiec)、[Farzapedia紹介](https://x.com/karpathy/status/2040572272944324650) | 全てをKarpathy以後の後継とは呼べない。AutoWiki初公開日はuncertain。Mem0の他社沿革・機能の説明には不一致がある。 |
| K8 | corrected | 「知識庫が育っても、正しさが自動で増えるわけではない。原資料への参照、古い記述の更新、人による理解と点検が要る。」 | [HN](https://news.ycombinator.com/item?id=47640875)、[gistの批判](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f?permalink_comment_id=6103209)、[RAG Collapse v1](https://arxiv.org/html/2608.22118v1)、[WikiLoop v1](https://arxiv.org/html/2607.26604v1) | cacheの英語一句とoutsourcingの英語一句の逐語帰属はuncertain。200／1,000は一律の限界ではない。2論文も長期wikiの正確さを保証しない。 |
| K9 | confirmed | 「ChatGPT memoryは2024年2月13日に試験提供、2025年4月10日に過去の会話の参照を拡張。Claude API memory toolは2025年9月29日public beta。MemGPT論文は2023年10月12日。」 | [OpenAI発表と追記](https://openai.com/index/memory-and-new-controls-for-chatgpt/)、[Claude公式](https://claude.com/resources/articles/context-management)、[MemGPT](https://arxiv.org/abs/2310.08560) | 製品のpersonalization、開発者管理の保存ツール、研究方式を区別。段階的提供は下記。Claude toolは既存agent報告H3の再引用。 |
| K10 | confirmed | 「文脈が切り替わっても、進捗・未完了の機能・変更履歴を読み直し、続きを進める。」Anthropic記事は2025年9月29日と11月26日。 | [context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)、[long-running harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | 記事中の設計例。NOTES.md等は全agent必須の規格ではない。メモの復元はharnessの仕事で、引継ぎの完全性は別途検証が必要。 |

## K1・K2：投稿、gist、引用の所在

K1原投稿は **2026-04-02 20:42:21 UTC**、K2追投稿は **2026-04-04 16:45:23 UTC**。投稿IDから計算した時刻と、[K1転送API](https://api.fxtwitter.com/karpathy/status/2039805659525644595)・[K2転送API](https://api.fxtwitter.com/karpathy/status/2040470801506541998)の投稿者・ID・時刻・本文を照合した。本人の文章を転送した資料であり、X公式APIから直接取得したものではない。地域時刻による4月3日／5日表記と混ぜない。

K1の代表引用は、最終TLDR段落の第2文。

> “You rarely ever write or edit the wiki manually, it's the domain of the LLM.”

原文の[LLM Knowledge Bases投稿](https://x.com/karpathy/status/2039805659525644595)では、要求箇所は次の位置にある。以下は要約。

| 所在 | 確認した内容 |
|---|---|
| Data ingest | 論文、記事、コード等を`raw/`へ置き、LLMがMarkdownのwikiへ段階的に整理。要約や相互リンク、概念のページを作る。 |
| IDE | 表示・閲覧にはObsidian、wikiの編集・保守にはLLMを使う。 |
| Q&A | 本人の最近のwikiは約100記事・約40万語。索引と短い要約を頼りに必要箇所を読むため、この規模では複雑なRAGを要しなかったという自己報告。 |
| Output | Markdown、Marpのスライド、matplotlib画像を作り、出力をwikiにも戻す。 |
| Linting | 矛盾、不足、追加調査、新たな関連を点検する。点検精度の測定結果ではない。 |
| Extra tools／Further explorations | 簡単な検索エンジンも自作。検索を一切使わない運用とは言えない。 |

K2追投稿の第2段落では、コード一式の共有より構想の共有を重視する理由を述べる。短い抜粋は次のとおり。[原投稿](https://x.com/karpathy/status/2040470801506541998)

> “you just share the idea, then the other person's agent customizes & builds it for your specific needs.”

gistは **2026-04-04作成**。[履歴UI](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f/revisions)は取得時点で1 revision、75行追加・削除0。確認した固定版は`ac46de1ad27f92b28ac95459c782c07f6b8c964a`。UIの時刻表示は16:25だが、timezone・秒・APIの`updated_at`を確定できなかったため、報告の日付は日単位とする。

[gist初版](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f/ac46de1ad27f92b28ac95459c782c07f6b8c964a)の代表引用は **The core idea** 節の次の2箇所。IDEの比喩は第三者の言い換えでも追投稿の文でもない。

> “a persistent, compounding artifact”
>
> “Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase.”

同じgist内の他の要求箇所は、引用を重ねず所在と要旨を示す。

| 節 | 要旨・適用範囲 |
|---|---|
| 冒頭 | idea fileは構想をagentへ伝える文書。具体的な構成は利用者側で決める。 |
| The core idea | 毎回断片から答えを組み立て直す利用への批評。人が資料・問い・方向を選び、LLMが整理・更新する。一般のRAG全方式の定義ではない。 |
| Architecture | 原資料、LLMが編集するwiki、`CLAUDE.md`／`AGENTS.md`等の規約という三層。 |
| Operations | 取り込み、質問、点検。1資料が10–15ページに関わるのは例。有用な回答を保存し、矛盾・古い主張・孤立頁・欠けた概念等を探す。 |
| Indexing and logging | `index.md`は索引、`log.md`は追記の作業履歴。本人の約100資料・数百頁という経験はK1の40万語と単位が違う。 |
| Optional: CLI tools | 規模が増えれば検索導入も認める。 |
| Why this works | 人の保守負担によるwiki放棄を論じ、Memexに触れる。保守の負担・価値に関する著者の見解で、保守費がゼロになる証明ではない。 |

## K3・K4：Memexと最小年表

Bushの **1945年7月号**の記事、§6の短い定義は以下。§8では **“associative trails”** という表現が使われる。[As We May Think](https://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/)

> “a device in which an individual stores all his books, records, and communications”

Memexは個人の資料を保存して参照し、関連づけた道筋をたどる装置の構想。§6–8には利用者の注釈、資料の結合、自分の分析、共有、経路を作る専門家も登場する。したがって「Bushは保守を誰がするか考えていなかった」と原典の欠落を断定せず、「Karpathyは保守をLLMへ移す点を強調した」と述べる。

| 年・日付 | 安全な記載と根拠 |
|---|---|
| 約1952年〜1997年初め | LuhmannのZettelkasten、約90,000枚。管理機関の[概要](https://niklas-luhmann-archiv.de/nachlass/zettelkasten)・[目録](https://niklas-luhmann-archiv.de/assets/NL-Findbuch.pdf)。カード箱の発明者とはしない。集合別の細かな枚数は採用しない。 |
| 1965 | NelsonがACM全国会議の論文でhypertextを提唱。[本人プロジェクト沿革](https://xanadu.com/HISTORY/)は語の選択1963／公表1965を区別。[論文再録](https://xanadu.com/HART%2CFulltext.pdf) p.144に用語導入。[書誌補助](https://elmcip.net/critical-writing/complex-information-processing-file-structure-complex-changing-and-indeterminate)は二次資料。 |
| 1968-12-09 | EngelbartとSRIチームのNLS実演。San FranciscoのFall Joint Computer Conferenceで90分、リンクや遠隔共同作業を示した。[Engelbart Institute](https://www.dougengelbart.org/mousesite/1968Demo.html) |
| 1989-03 | Berners-LeeのWeb提案。[CERNの提案年表](https://drupal-timeline.web.cern.ch/first-outline-world-wide-web)は正確な日が不明と明記。 |
| 1990年末／1991年 | 1990年末までに最初のWebサイト・サーバ・ブラウザが稼働。1991年8月にインターネットへ公開・告知。[CERN](https://home.cern/science/computing/the-birth-of-the-web/)、[W3C保存年表](https://www.w3.org/History/19921103-hypertext/hypertext/WWW/History.html)。「最初のサイトを1991年に作成」としない。 |
| 1995 | Ward CunninghamのWikiWikiWeb。[本人書簡](https://c2.com/doc/etymology.html)で年を確認。広い公開日3月25日は[WikiHistoryの第三者ミラー](https://kidneybone.com/c2/wiki/WikiHistory)と[大学の紹介](https://www.doc.ic.ac.uk/csg/WikiWikiWeb)による。本人サイトの[保存メール](https://c2.com/wiki/mail-history.txt)では3月16日に既に知人へURLを案内し、約1週間後の広い告知を予定。3月25日を初稼働時刻としない。 |
| 2001-01-15 | Wikipedia創設。[Wikimedia Foundation](https://wikimediafoundation.org/wikipedia25/) |
| 2020 | Obsidian。公式履歴では[v0.0.1初版は3月30日](https://obsidian.md/changelog/2020-03-30-desktop-v0.0.1/)、開発者の[公開ベータ当日告知は5月27日](https://news.ycombinator.com/item?id=23324598)。後者に内部リンク、backlinks、graph viewを明記。 |

Obsidianの[同社5月30日記事](https://blog.dynalist.io/obsidian/)は公開ベータを「2日前」と記すため、当日告知と1日ずれる。現行変更履歴のpublic表示だけで、3月30日を一般向け公開の確定日にはしない。画面の年表なら「2020年」で足りる。上の並びは複数の知識整理の例であり、一本の直接的な影響関係を証明するものではない。

## K5：長文脈の図に使える値と条件

### Lost in the Middle

Liuらの論文はarXiv:2307.03172、刊行は **TACL 2024、vol.12、pp.157–173**。[刊行書誌](https://aclanthology.org/2024.tacl-1.9/)。下の数値は **arXiv v3（2023-11-20）Appendix G.2 Table 6**、曲線はFigure 5、closed-bookはTable 1から採る。刊行版でも同じ表番号とは保証しない。[数値を確認した著者版](https://arxiv.org/html/2307.03172v3)

条件は **GPT-3.5-Turbo-0613（4K）／NaturalQuestions-Openの2,655問／正解文書1＋妨害文書19**。正解文字列を回答に含むかで採点し、正解文書の位置を動かした。

| 正解文書の位置（1始まり） | 1 | 5 | 10 | 15 | 20 |
|---|---:|---:|---:|---:|---:|
| 論文のindex（0始まり） | 0 | 4 | 9 | 14 | 19 |
| 正答率（%） | 75.8 | 57.2 | 53.8 | 55.4 | 63.2 |

資料なしの **closed-book基準線は56.1%**。補助値として正解文書1つだけのoracleは88.3%。先頭と中央の差は **22.0ポイント**で、相対22%減ではない。5測定点を結ぶ図を作れるが、全位置を実測したような滑らかな線やattentionの強さの図にしない。

推奨脚注：「GPT-3.5-Turbo-0613／20文書／Liu et al., TACL 2024。数値：arXiv v3表6」。この旧モデルの結果から現在の全モデルが同じ曲線になるとは言わない。

### Chroma Context Rot

[原報告](https://www.trychroma.com/research/context-rot)の表示日は **2025-07-14**。7月16日追補を含む取得時点の本文を読んだ。対象は次の18モデル。ただし全モデルを全実験で評価したわけではない。

- Claude Opus 4、Sonnet 4、Sonnet 3.7、Sonnet 3.5、Haiku 3.5。
- OpenAI o3、GPT-4.1、4.1 mini、4.1 nano、GPT-4o、GPT-4 Turbo、GPT-3.5 Turbo。
- Gemini 2.5 Pro、2.5 Flash、2.0 Flash。
- Qwen3-235B-A22B、32B、8B。

課題は、意味の類似・妨害文・文章構造を変えたneedle-in-a-haystack、LongMemEvalの会話QA、反復語列のコピー。長さの影響はモデルと条件で変わる。単純な検索課題で高得点でも、あらゆる長文課題を処理できるとは限らない。

引用に使える例は **LongMemEvalの選別306問、Claude Sonnet 4の非thinking設定**。関連部分のみ（平均約300 tokens）で平均スコア **0.89**、全履歴（平均約113,000 tokens）で **0.38**。[Claude family原図](https://www.trychroma.com/img/context_rot/longmemeval/claude.png)の棒上の表示値で、丸め前の値ではない。余分な情報や検索の負担、回答辞退も関わる条件比較であり、「113Kから知能が半分」「読める割合38%」という意味ではない。

### RULER

Hsiehら、初投稿 **2024-04-09**。数値は **v3（2024-08-06）Table 3／Appendix A Table 4**。13課題の平均が基準モデルLlama2-7Bの4K時の **85.6%**を上回る、評価した長さの最大値をeffective context lengthとする。[書誌](https://arxiv.org/abs/2404.06654)、[v3本文](https://arxiv.org/html/2404.06654v3)

例は **gpt-4-1106-preview：公称128K、実効64K**。平均スコアは64Kで **87.0%**、128Kで **81.2%**。評価点は4K／8K／16K／32K／64K／128K。64K直後を失敗点と特定したわけではない。検索、多段追跡、集約、QAという同研究の課題と基準に依存し、物理的に入力できる長さとも、全用途の保証とも異なる。

## K6・K7：先行例、関連実装、明示された影響関係

| 対象 | 確認した日付・内容 | 留保・出典 |
|---|---|---|
| Microsoft GraphRAG | 論文v1 **2024-04-24**、実装公開 **2024-07-02**。索引構築時にentity graphとcommunity summariesを作る。 | 事前の知識整理を行うRAGの例。[論文](https://arxiv.org/abs/2404.16130)、[Microsoft発表](https://www.microsoft.com/en-us/research/blog/graphrag-new-tool-for-complex-data-discovery-now-on-github/)、[公式技術説明](https://microsoft.github.io/graphrag/) |
| Cognition DeepWiki | 公式告知 **2025-04-25 17:13:53 UTC**。GitHubの公開repoを構造化した説明文書へ整理し、質問できる。 | [告知](https://x.com/cognition_labs/status/1915816544480989288)は[転送API](https://api.fxtwitter.com/cognition_labs/status/1915816544480989288)で照合。[同日の開発者応答](https://news.ycombinator.com/item?id=43796308)もある。[ブログ](https://cognition.com/blog/deepwiki)の現表示日は5月5日で、初公開日と混同しない。 |
| Factory AutoWiki | 紹介記事 **2026-06-17**。遅くとも **2026-03-18**の公式履歴に登場。ソースからwikiを作り、変更に合わせて更新する。 | **初公開日はuncertain**。3月18日はアップロード完了後のリンク追加、4月10日は差分更新等の記録。[公式履歴](https://docs.factory.com/changelog/release-notes)、[紹介記事](https://factory.com/news/wiki)。4月2日以後に初めて生まれたとは言えない。 |
| LangChain OpenWiki | **2026-07-01**。repo用wikiの生成・維持CLI。DeepWiki、AutoWiki、Karpathyの構想から影響を受けたと明記。 | [初回記事](https://www.langchain.com/blog/introducing-openwiki-an-open-source-agent-for-repo-documentation)のKeeping the wiki up to dateに、定期GitHub Actionでgit差分から更新する仕組みも記載。 |
| OpenWiki Brains | **2026-07-10**。接続先の個人資料等へ範囲を広げ、端末内wikiをスケジュール更新。 | [公式記事](https://www.langchain.com/blog/introducing-openwiki-brains-general-purpose-wiki-memory-for-agents) |
| Garry Tan GBrain | repo作成 **2026-04-05 14:40:56 UTC**、本人のMIT公開告知 **4月9日22:29:29 UTC**。 | [repo](https://github.com/garrytan/gbrain)、[作成時刻API](https://api.github.com/repos/garrytan/gbrain)、[告知](https://x.com/garrytan/status/2042369335419945338)／[転送API](https://api.fxtwitter.com/garrytan/status/2042369335419945338)。作成時刻は公開時刻ではない。初期告知からSupabase接続を案内しており「DB不要のMarkdownだけ」とは言えない。Karpathyからの直接派生は今回の本人資料では未確定。 |
| Mem0 The State of Agent Wikis | **2026-07-21**、In Context #17。資料集合の知識と個人の嗜好・決定を区別。 | [同社LinkedIn記事](https://www.linkedin.com/pulse/state-agent-wikis-mem0-6eiec)。同社の分類を知る一次資料で、自社製品の紹介も兼ねる。 |
| Farzapediaの紹介 | Karpathyの投稿は **2026-04-04 23:28:36 UTC**。内容を確認・所有・移行でき、使うAIを選べる点を評価。 | [本人投稿](https://x.com/karpathy/status/2040572272944324650)／[転送API](https://api.fxtwitter.com/karpathy/status/2040572272944324650)。「公式」「唯一」「canonical implementation」と認定したとは書かない。 |

Mem0記事の **A wiki is not memory** 節から短く引用すると、資料集合側は **“what does this body of material contain”**、個人側は **“what a specific person prefers, what they decided last week”**。[原文](https://www.linkedin.com/pulse/state-agent-wikis-mem0-6eiec)

この用途の対比は使えるが、同記事の他社に関する説明は修正が必要。DeepWikiは前年からあり、OpenWikiは初回記事から自動更新を説明し、GBrainは初期告知からDB接続を案内している。Mem0記事だけを根拠に全てをKarpathyの後続・手動更新・ファイルのみとしない。wikiは情報を組織化する形、個人memoryは保存対象や用途の呼び方であり、互いに排他的ではない。

## K8：批判の帰属と実証の範囲

### コメント・体験談

元の[HNスレッド](https://news.ycombinator.com/item?id=47640875)は **2026-04-04 16:57:45 UTC**。コメントが実在することと、その懸念が実証されたことを分ける。

| 論点 | 確認できた発言者・日時・資料 | 画面での扱い |
|---|---|---|
| 要約の反復による劣化 | [devnullbrain](https://news.ycombinator.com/item?id=47645480)、4月5日02:05:27。学習時model collapse研究に言及。[Imanari](https://news.ycombinator.com/item?id=47646835)、同06:56:17。小さい誤りの蓄積を懸念。 | 批判・懸念として帰属。同じスレッドには、再学習ではないことやrawを残す設計を指摘する反論もある。 |
| 自分の思考を任せること | [nidnogg](https://news.ycombinator.com/item?id=47647504)、4月5日09:04:43。調査を任せて理解の穴が残った体験。[loveparade](https://news.ycombinator.com/item?id=47647774)、同09:55:02。wikiを書く過程の価値を指摘。 | 「整理を任せると、自分で理解を組み立てる機会まで減らさないか」。依頼の英語句そのものの出典は未特定で、逐語引用にはしない。 |
| 約1,000ファイルでの破綻 | gistの[6102967](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f?permalink_comment_id=6102967)と[6103019](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f?permalink_comment_id=6103019)、4月16日05:46:34／06:42:47。現在のAPIでuserはnull。 | 主張はあるが実験条件・データはない。[二次記事](https://denser.ai/blog/llm-wiki-karpathy-knowledge-base/)による名前の帰属を、本人確認済みとして採用しない。 |
| 大規模保守・点検の不安定さ | [LudoE11の現存コメント](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f?permalink_comment_id=6103209)、4月16日08:32:51。 | 人間の監督が要るという意見。1,000ファイルを測定したベンチマークとはしない。 |
| 約200ファイル | [Dani Gerwa本人記事](https://danigerwa.com/articles/one-small-layer-karpathy-llm/)、4月11日、The Problem That Shows Up Around 200 Files節。224ファイルで広いgrep・読込みのトークン消費が増え、検索を導入。 | 本人も厳密なbenchmarkではないとする。gistコメントとしての帰属は未確認。 |

[Kunal Ganglani本人記事](https://www.kunalganglani.com/blog/llm-wiki-karpathy-local-knowledge-base)にも約200ファイルの運用談があるが、表示は4月15日、更新は9月16日。3か月使用という記述を4月15日時点の発言としない。

**“a compiled wiki is a cache, and caches lie” は出典・発言者を特定できなかった。** 引用札には採用しない。説明するなら、調査者の要約として「元資料が変わっても、まとめを更新しなければ古い説明が残る」とする。検索で見つかった未取得の記事断片だけから発言者を補わない。

### RAG Collapse

Gregory Druck／Ethan Smith、初投稿 **2026-08-22**。確認版はv1。[書誌](https://arxiv.org/abs/2608.22118)、[本文](https://arxiv.org/html/2608.22118v1)

モデルの再学習は行わず、生成した回答を記事に変えて次回の参照資料にする反復simulation。資料を全置換する条件、1件ずつ置換する条件、原資料を残すpoolへ追加して検索する条件を比較し、回答間の意味類似、語彙・entityの多様性、自己生成資料の引用などを測る。主な結果は回答の多様性の縮小と自己生成資料への偏りである。

具体例は **§9 Table 3、GPT-5.2 Chat／Entity ChatGPTの101問／Search条件**。collapsedの割合は開始 **1.98%**、終了 **77.23%**。この課題でcollapseとは、同じroundの複数回答が全て同じentity集合になること。**77.23%の事実誤りや幻覚率ではない。** 専用の防止prompt等の有効性はこの実験では確定していない。

安全な画面文言：「自己生成した資料を繰り返し検索する実験では、回答の多様性が縮んだ」。Karpathyの個人wikiの実測、学習時のmodel collapse、wiki全般の正確さの評価と同一視しない。

### WikiLoop

初投稿 **2026-07-29**、確認版はv1。[書誌](https://arxiv.org/abs/2607.26604)、[本文](https://arxiv.org/html/2607.26604v1)

出典つきのlinked-page wikiを編集するBuilderと、検索・読込み・リンク追跡で回答するNavigatorを役割に応じて学習する。Builderは編集前後の隔離copyを使い、固定NavigatorでのQA改善と無関係な問いへの退行を評価する。

**§4 Table 1、AuthTrace（860作品・2,099問）、同じQwen3.5-9B回答backbone**では、All ACがLLM-Wiki base **56.3**、WikiLoop **62.6**で **6.3ポイント差**。baseは著者側の先行実装であり、Karpathyの運用を直接測った値ではない。

特に **§5 Limitationsは、候補の編集を評価後に破棄するため、永続的な書戻しと長期の相互適応は未検証**と述べる。長期の誤り蓄積を解決した証拠には使えない。両論文とも本調査では再実験せず、査読採択も確認していないので、2026年のプレプリントとして扱う。

## K9：memoryの提供段階と保存対象

| 日付 | 確認した段階・内容 | 根拠 |
|---|---|---|
| 2023-10-12 | MemGPT初投稿。OSの階層的記憶管理にならい、限られたモデル入力と外部記憶の間で情報を動かす。 | [Packerらの書誌・抄録](https://arxiv.org/abs/2310.08560)。v2は2024-02-12。物理的なcontext windowが無限になる方式ではない。 |
| 2024-02-13 | ChatGPT memoryをFree／Plusの一部で試験提供。 | [初回発表](https://openai.com/index/memory-and-new-controls-for-chatgpt/) |
| 2024-04-29 | Plus全体へ拡大。当時は欧州・韓国を除外。 | [公式release notesのApr 29, 2024節](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| 2024-09-05 | Free／Plus／Team／Enterpriseへの提供を記載。 | [元発表の同日追記](https://openai.com/index/memory-and-new-controls-for-chatgpt/) |
| 2025-04-10 | 保存した記憶に加え、過去の会話も参照する拡張。Plus／Pro向け、Team／Enterprise／Eduは数週間後との案内。 | [元発表の同日追記](https://openai.com/index/memory-and-new-controls-for-chatgpt/) |
| 2025-09-29 | Claude API memory toolのpublic beta。外部ファイルを作成・読込み・更新・削除でき、保存基盤は開発者が管理。 | [公式発表](https://claude.com/resources/articles/context-management)、[既存agent報告H3](../agent-facts/report.md)。 |

ChatGPTの過去の会話参照は、全発言を毎回答の入力へそのまま入れることや完全な想起の保証ではない。上表は当時の発表であり、2026年時点の全プラン仕様表ではない。Claude API toolは一般消費者向けClaudeの会話memoryとは別機能。MemGPTから両社機能への直接の影響関係は、今回の資料では立証していない。

Claudeのツールは知識庫や作業状態も保存対象にできる。これが示すのは「wiki／memory」の排他性ではなく、**何を残すか、どの形式か、いつ読み戻すかを設計する必要がある**ということ。

## K10：ファイルに残し、新しい文脈へ戻す

Anthropicの **Effective context engineering for AI agents** は **2025-09-29**。[原記事](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

| 原文の所在 | 短い逐語抜粋・要旨 |
|---|---|
| Why context engineering…冒頭 | **“context rot”**、**“attention budget”**。文脈が増える際の情報利用の難しさを説明する比喩。測定可能な一定の注意残高があるという物理法則ではない。 |
| Context retrieval and agentic search | **“just in time”**、**“progressive disclosure”**。必要な時にツールで読み込み、探索を進めながら情報を得る。固定検索と動的探索の併用も認める。 |
| Structured note-taking冒頭 | **“These notes get pulled back into the context window at later times.”** 外へ書いたメモを後で文脈に戻す。同節に`NOTES.md`の例。 |

**Effective harnesses for long-running agents** はJustin Young、**2025-11-26**。[原記事](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)の導入第2段落には次の文がある。

> “each new session begins with no memory of what came before.”

この記事の設計例では、最初の **“Initializer agent”** が起動script、進捗ファイル`claude-progress.txt`、初期git commit、要件を展開したJSONの機能一覧`feature_list.json`を準備する。後続のcoding agentが進捗とgit履歴を読み、一つずつ進め、検証結果を一覧・進捗・commitへ残す。所在はThe long-running agent problem、Feature list、Incremental progress、Getting up to speed。

JSON採用は著者の試行でMarkdownより不適切な変更が少なかったという経験に基づく。全モデルに普遍的な優位とはしない。脚注1では、initializerとcoding agentは初期user promptが異なり、system prompt・tools・harnessは同じと説明する。別モデルが必須という意味ではない。

新sessionについての引用も、harnessが履歴・要約・ファイルを読み戻せないという意味ではない。記事はまさにその引継ぎを設計する話である。上記ファイル名や手順を全agentの規格、またはこのプロジェクトに課す規則として扱わない。

## 不確実性と、問い・計画の変遷

主題は当初のK1–K10から変えていない。9調査単元を完了し、4回の計画改訂で次を明確にした。

1. **X取得を独立単元へ分割。** gistは直接読めたがXは取得を拒否したため、第三者APIによる本文照合を追加した。本文の改訂履歴や転送の完全性を独立に保証したわけではない。
2. **「RAGは蓄積しない」を派生質問として追究。** GraphRAG等の先行例により、検索の有無と書戻しの有無を分ける必要が分かった。元の二分法を修正したが、章の目的は変わらない。
3. **「後継」から先行例・関連実装・明示された影響へ整理。** DeepWikiとAutoWikiの時系列が理由。「wikiと個人memoryは排他的か」もK9で追い、形式と用途を分けた。
4. **批判と測定対象を分離。** 学習時model collapse、推論時の回答多様性、wikiの事実誤りは別。長期のWiki／RAG／memory比較は今回の2論文だけでは答えられず、保留した。
5. **日付の精度を制限。** WikiWikiWebは3月16日の招待と3月25日の広い公開を区別。AutoWikiは3月18日までの存在と6月17日の記事を区別し、初公開日を未確定のまま残した。

残る不確実性は、gistのtimezone・秒・updated_at、WikiWikiWebの初稼働時刻、Obsidian初版の配布範囲、AutoWikiの初公開日と当時の利用範囲、K8の未確認英語句と匿名化コメントの著者である。これらを推測で埋める必要はなく、上記の画面用文言はこの不確実性を織り込んでいる。

Chromaの丸め前スコア、2026年モデルでの再評価、長期wikiの品質・費用の公平な比較も未実施。取得した公式記事の現行本文が初日と完全に同じか、アーカイブ差分で全面確認したわけではない。未読の派生論文や検索断片は結論の根拠に採用していない。

## 推奨する次の行動

- デッキの対比を「検索して答える」「知識を整理して書き戻す」の動作として示す。RAGとWikiの二者択一にはしない。
- K5の図にはモデル・資料数・版・基準線を併記し、上表の5測定点を使う。Wikiの優位を示す図には転用しない。
- 年表は画面で必要な精度に留め、細かな日付差はREADMEに残す。AutoWikiの初公開日や未確認の英語名言は採用しない。
- wikiが長期運用で優れることまで主張する場合は、同じ資料・問い・更新履歴で、出典忠実性、更新漏れ、回答品質、利用者の理解、費用を比べる別調査を行う。WikiLoopの短期評価を長期検証の代用にしない。
- 公開前に変更されやすい製品文書だけを再確認し、2026年のモデル全般へ話を広げる場合に限って長文脈評価を更新する。
