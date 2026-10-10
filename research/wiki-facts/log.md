# LLM Wiki と「知識を育てる」ファクトチェック調査ログ

- 質問: 日本語解説デッキの新章8「知識を育てる」向けに、依頼K1–K10（Karpathy LLM Wiki、知識管理の系譜、長文脈評価、先行・後続実装と批判、memoryとharness）を一次資料で検証する。
- 範囲: 各IDにつき判定・安全な画面文言・出典URL・留保を1行にまとめ、日本語の最終報告を作る。引用は所在と短い逐語抜粋を示す。全文や多数の長い引用は転載せず、原文リンクと内容の要約で補う。
- UTC開始: 2026-10-10 03:55:01 UTC。
- 出力: research/wiki-facts/log.md（追記のみ）、report.md（報告ターンで作成）の2成果物のみ。プロジェクトの変更・モデル実行はしない。

## 初期計画

単元は「確認する問い × 資料群」で定義する。

1. 前提と再利用範囲 × AGENTS.md、デッキ文書、既存2報告。章の説明と検証済み事項を整理する。
2. K1・K2の発言は何か × Karpathy本人のX投稿、gist本文と履歴/API。日付、原文所在、三層・三操作・規模・比喩の帰属を確認。
3. K3・K4の年表は正しいか × Bush原典、各発明者・研究機関・プロジェクト公式沿革。
4. K5の図に使える測定値は何か × Lost in the Middle論文・著者データ、Chroma報告、RULER論文。条件と具体値を確認。
5. K6の先行例とK7の後続は何か × GraphRAG論文/公式発表、Cognition・Factory・LangChain・Garry Tan公式資料、mem0記事、Farzapedia本人発信。
6. K8の批判の帰属と実証範囲 × HN/gistコメント、批評者の原文、RAG Collapse・WikiLoop論文。体験談と実験結果を区別。
7. K9・K10のmemory/harnessとの関係 × 既存報告H3、OpenAI公式沿革、MemGPT、Anthropicの2記事。日付と短い引用を確認。
8. 全IDの抜け・反証・出典帰属を横断照合。新しい問いが出たら計画を追記更新。
9. 全調査単元を終えた次の専用報告ターンでreport.mdを作成する。

## Unit 1: 前提の読み込みと既存検証の再利用

資料（2026-10-10取得）:
- AGENTS.md（ボス提示の機体規則を含む）、docs/spec.md（0.2の冒頭・契約）。
- decks/llm/README.md、decks/llm/ch7-knowledge.md。
- research/llm-facts/report.md、research/agent-facts/report.md。

確認事項:
- READMEは、画面・字幕に使う事実を一次資料で裏付け、例の数字には例と表示する方針。ch7-knowledge.mdは下調べで、一次/二次/未確認を分けているが、Karpathy初回投稿の全文は未読と明記。今回の対象はボスの最新指定どおり新章8。
- agent-facts R1–R3はRAGの命名・先行例・検索を道具にできることを検証済み。今回再調査しない。「RAGは蓄積しない」は全方式の定義ではなく、回答を書き戻さない通常の検索→生成ループを指すかをK2/K6で検証する。
- agent-facts H3はClaude API context editing/memory toolの2025-09-29 public betaを検証済み。K9では同報告と https://claude.com/resources/articles/context-management を再引用する。Claude製品の会話memoryとAPIツールを混同しない。
- agent-facts H1/H2/H4はharness、セッション保存、AGENTS.md/CLAUDE.mdの機能を検証済み。K10では依頼された記事の具体的設計と発言だけを追加確認する。
- 既存報告の主表形式（ID / Status / 画面に使える値・文言 / 一次資料 / 範囲・留保）を最終報告に採用。K1–K10を10行とし、K5の内訳等は必要な補足へ置く。

未解決: 外部資料の逐語照合、年表、図用の具体値は未実施。全文転載要求には原文へのリンクと短い引用・要約で対応する。

次の単元: Unit 2、KarpathyのX投稿・gistと履歴。

## Unit 2: Karpathyのgist本文・履歴とX投稿への到達性

資料（すべて2026-10-10取得・試行）:
- 一次: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f （本文を通読。web抽出L62–117、コメントは別著者）。
- 一次・履歴: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f/revisions 。初版固定URL: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f/ac46de1ad27f92b28ac95459c782c07f6b8c964a 。
- 一次URL・取得失敗: https://x.com/karpathy/status/2039805659525644595 、https://x.com/karpathy/status/2040470801506541998 。通常URLはInternal Error、?lang=en付きは403。検索も当人の全文を返さなかった。
- API取得失敗: https://api.github.com/gists/442a6bf555914893e9891c11519de94f （shell urllib:502、web:不可）。https://api.fxtwitter.com/status/2039805659525644595 および /2040470801506541998 はwebでInternal Error。第三者のAPIなので取得できても転送経路として明記する。
- 二次・探索のみ: https://www.burn451.cloud/vault/karpathy/llm-knowledge-bases-using-llms-to-build-personal-knowledge-bases （冒頭の転載断片と要約。日付をApr18と表示し、RAGに勝るという強い言い換えがあり、そのまま使えない）。
- 二次・次回探索候補: https://github.com/nanzhipro/karpathy-wiki/blob/main/wiki/sources/karpathy-x-2026-llm-wiki.md （要約。元データ2026/4.3.md、4.5.md参照。日付はUTCと異なるため原投稿IDを優先）。

確認事項と帰属:
- K1/K2の指定IDをSnowflake式 ((id >> 22) + 1288834974657) のUnixミリ秒としてPython標準ライブラリで計算。K1=2026-04-02T20:42:21.644Z、K2=2026-04-04T16:45:23.850Z。これは投稿ID由来の時刻で、X画面の表示時刻や本文を直接取得したものではない。
- gistのGitHub表示はCreated April 4, 2026 16:25。履歴はRevisions 1、75行追加・削除0で初版のみ。固定commitはac46de1ad27f92b28ac95459c782c07f6b8c964a。秒と明示的なtimezoneはAPI失敗のためまだ照合していない。安全な日付は2026-04-04。
- K2の比喩の原文は **“Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase.”**。gistのThe core idea節、人とLLMの役割を述べた段落末尾（web L74、初版にも存在）。第三者の言い換えではない。別の短い原文は **“a persistent, compounding artifact”**（同節L72）。このログでgistからの逐語引用は計20語。他の要求箇所は以下の所在と要約で記録する。
- 冒頭L66: idea fileはエージェントへ渡して構想を伝え、個別実装は人とエージェントで詰める文書。コード共有が不要になるという理由のX原文は未取得。
- The core idea L68–74: 毎回断片を再構成する利用への批評と、継続的に編集するwikiの提案。一般のRAGの定義・性能比較の実験ではない。
- Architecture L85–87: 変更しない資料、LLMが編集するwiki、人とLLMで育てる規約ファイルの三層。規約例はCLAUDE.md/AGENTS.md。
- Operations L89–93: 取り込みで1資料が10–15頁に及ぶのは例。良い回答を戻す。点検は矛盾、陳腐化、孤立頁、欠けた概念・参照・データを探す。
- Indexing and logging L97–99: index.mdは索引（問いでは先に読む）、log.mdは追記の時系列。約100資料・数百頁で埋め込み検索なしに回るという本人の経験。Optional: CLI tools L101–102は成長後の検索導入も認める。
- Query L91およびWhy this works L112–114: Markdown/Marp/matplotlib等の出力と書戻し、人が資料選択・分析の方向・問い・意味を担うこと、保守負担を理由とするwiki放棄の主張、Memexとの類比はいずれも本人の本文にある。保守費用がほぼゼロ、LLMが更新を忘れない等は著者の主張であり保証として画面に出さない。
- Memexの保守主体をめぐる解釈はKarpathyの歴史評価。Bush自身が保守を全く考慮していなかったことの立証にはならず、Unit 3で原典と分ける。

暫定画面文言: 「資料からwikiを編み、質問で得た答えも戻す。人が問いを立て、LLMが整理と更新を担う。」規模は「Karpathyの例：約100資料・数百頁」と帰属を付す。K1の約100記事/40万語はX本文をまだ直接確認できていないため保留。

未解決:
- K1の全文・各要求箇所とK2追投稿のコード共有/idea file発言は一次または信頼できる原文アーカイブでの照合が必要。gistの内容からXの逐語表現を推測しない。
- gistの細かな作成時刻のUTC明示、API履歴照合は未完。現在の公式UIでは改訂なしと確認できる。
- 原文全文と多数の長い引用はそのまま転載しない。最終報告でも各資料の短い逐語引用と節へのリンク、要約にする。gistの複製URLを別出典として引用量を増やさない。

次の単元: Unit 3でX本文の代替経路を限定的に調べる（下の計画改訂）。その後にMemex/年表へ進む。

## Plan revision 1

わかったこと: gist本文は一次資料で検証できたが、Xの直接取得が拒否された。最初のUnit 2を「gist・履歴・到達性確認」として完結させ、X本文の照合を独立した単元へ分割する。これは新しい主題の追加ではなくK1/K2の取得経路の分割。

派生した問い: 「RAGは蓄積しない」はどこまで言えるか。元の章の対比を正確にするため今追う。先行するGraphRAG等との照合に含め、検索の有無と書戻しの有無を分ける。

残りの単元:
3. K1/K2 X本文 × 本人投稿の別表示、原文アーカイブ/転載の照合（取得元の格を明記）。
4. K3/K4 Memex・年表 × 原典と公式沿革。
5. K5 長文脈 × 3研究の本文・著者データ。
6. K6/K7 先行・後続 × 公式発表、mem0、Farzapedia。
7. K8 批判 × 原コメント、批評者記事、2論文。
8. K9/K10 memory/harness × 既存H3、公式発表、MemGPT、Anthropic記事。
9. 全ID照合・不足の解消。すべて終わったらready-to-reportを返す。
10. 明示された報告ターンにreport.md（日本語・10行主表）を作成。

チェックポイント: Unit 1–2完了。まだ報告段階ではない。次回はこのログを読み、Unit 3から再開する。出力ディレクトリには現時点でlog.mdのみ（report.mdは専用報告ターンまで作らない）。

## Unit 3: K1/K2のX本文を第三者API経由で照合

資料（2026-10-10取得）:
- 原投稿URL: https://x.com/karpathy/status/2039805659525644595 および https://x.com/karpathy/status/2040470801506541998 。X直接取得はUnit 2で失敗。
- 本文の転送経路: https://api.fxtwitter.com/karpathy/status/2039805659525644595 と https://api.fxtwitter.com/karpathy/status/2040470801506541998 。webツールでは不可だがshellのurllibでHTTP 200、JSONのtweet.id、author.screen_name、created_at、textを取得し全本文を読んだ。第三者転送であり、X公式APIからの直接取得ではない。
- 二次・照合補助: https://github.com/nanzhipro/karpathy-wiki/blob/main/wiki/sources/karpathy-x-2026-llm-wiki.md 、https://github.com/jameesy/foundry-vault/blob/main/sources/LLM%20Knowledge%20Bases%20%28Karpathy%29.md 。本文転送の規模・構成と整合する。ただし双方とも要約であり、独立した真正性の保証ではない。
- 取得失敗: https://raw.githubusercontent.com/nanzhipro/karpathy-wiki/main/2026/4.3.md と /2026/4.5.md は404。https://api.github.com/gists/442a6bf555914893e9891c11519de94f は再試行も502。探索はここで打ち切る。

確認事項:
- K1: APIのcreated_atは2026-04-02 20:42:21 +0000、投稿者karpathy、ID一致。Unit 2のSnowflake計算と一致する。内容は次の8箇所で照合できた。
  - 冒頭: 研究テーマごとの個人知識ベースにLLMを使い、コードよりMarkdownや画像の知識を操作する用途が増えたという自己報告。
  - Data ingest節: 記事・論文・リポジトリ・データセット・画像等をraw/に入れ、LLMが.md群のwikiへ段階的に編集する。要約、backlinks、概念別記事、リンクを作る。Web Clipperと画像のローカル保存も記載。
  - IDE節: Obsidianを表示側として使い、LLMがwikiを書く・保守する。Marp等のプラグインにも言及。
  - Q&A節: 本人の最近の研究wikiは約100記事・約40万語。索引と短い要約をLLMに保守させると、この小規模では関連データを読めたので複雑なRAGを要しなかったという体験。全体を毎回コンテキストへ詰めるという意味でも、あらゆるRAGより優れるという比較実験でもない。
  - Output節: Markdown、Marpのスライド、matplotlib画像をObsidianで見る。出力をwikiへ戻すことが多いという運用。
  - Linting節: 矛盾、足りない情報（web検索で補う）、新しい記事の候補となる関連を点検し、データ整合性を改善すると述べる。自動検証の正確さは測っていない。
  - Extra tools/Further explorations節: 素朴な検索エンジンを自作しweb UIとCLIで使う。将来は合成データとfine-tuningも検討している。この追加検索の存在は「検索が一切不要」という解釈への反証。
  - TLDR末尾の逐語引用（17語）: “You rarely ever write or edit the wiki manually, it's the domain of the LLM.” 所在は最終段落の第2文。全文転載の代わりにこれを代表引用にし、他の箇所は節名と要約で示す。
- K2: APIのcreated_atは2026-04-04 16:45:23 +0000、投稿者とID一致。初回投稿を引用したfollow-upで、gistへのリンクも一致。
  - 第2段落は、具体的なコードやアプリを共有する必要性が下がり、構想を共有して相手側のagentが用途に合わせて実装する、というidea fileの理由を述べる。
  - 最終段落は、このgistをagentへ渡せば自分用wikiと使い方を作れること、多様な実装を認めるため意図的に抽象的にしたこと、Discussionで調整・貢献できることを述べる。
  - K2投稿の短い逐語抜粋（21語）: “you just share the idea, then the other person's agent customizes & builds it for your specific needs.” 所在は第2段落の第2文の後半。
  - Obsidian/IDE/programmer/codebaseの比喩はこのfollow-upにはない。Unit 2で確認したgist本文に存在する。
- 本文転送と二次要約は整合するが、二次要約に記された4月3日/5日をUTCの日付と取り違えない。確実に使えるUTC日は4月2日/4日。

判定案と安全な画面文言:
- K1 confirmed（本人投稿の本文は第三者API経由、経路を明記）。「Karpathyの運用例：約100記事・40万語。索引と要約を使って必要な資料を読む。回答もwikiへ戻す。」
- K2 confirmed（gistは一次資料、X follow-upの本文は第三者API経由）。「共有するのは構想。手元のagentが用途に合わせてwikiを作る。」

未解決・留保:
- X公式ページでの直接照合はできていない。原投稿の改訂の有無や、転送APIの取得時点を独立に保証できない。投稿時刻はID計算とAPIの両方で一致。
- gistの作成は2026-04-04、UI上の履歴1件までは確認済み。APIが取れないため秒・timezoneとupdated_atの確定は保留。日単位の年表には影響しない。
- 原文全文と多数の逐語引用の再掲は行わない。出典URL、節の所在、代表的な短い引用と日本語要約で要求を満たす。

次の単元: 最新計画のUnit 4（K3/K4、Bush原典と知識管理の年表）。Unit 3完了後、指示されたトークン閾値のチェックポイントを要求する。まだ報告段階ではない。残りはUnit 4–9、報告は専用ターンUnit 10。

## Unit 4: K3/K4のMemex原典と知識管理の年表

資料（すべて2026-10-10取得・試行）:
- Bush原典: https://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/ （July 1945、本文§6–8を確認）。
- Nelson本人のプロジェクト沿革: https://xanadu.com/HISTORY/ 。同プロジェクトの原論文再録: https://xanadu.com/HART%2CFulltext.pdf （The New Media Reader再録p.144にhypertextの導入文）。ACM DOI https://dl.acm.org/doi/10.1145/800197.806036 は取得失敗。書誌の補助 https://elmcip.net/critical-writing/complex-information-processing-file-structure-complex-changing-and-indeterminate は1965 ACM national conference論文と記載。
- Engelbart Institute: https://www.dougengelbart.org/mousesite/1968Demo.html 、https://dougengelbart.org/content/view/374/ （映像索引と当日のデモ説明）。
- CERN: https://drupal-timeline.web.cern.ch/first-outline-world-wide-web （1989年3月、正確な日は不明と明記）、https://drupal-timeline.web.cern.ch/timeline-header/109 （検索抽出で1990年末の初サイト/サーバ、本文再取得は503）、https://home.cern/science/computing/the-birth-of-the-web/ 。W3C保存の当時の年表: https://www.w3.org/History/19921103-hypertext/hypertext/WWW/History.html 。
- Ward Cunningham本人: https://c2.com/doc/etymology.html 。元WikiHistory https://c2.com/cgi/wiki?WikiHistory は https://wiki.c2.com/?WikiHistory へ転送されJSの外枠のみ。shellでHTMLを確認し、その公開ページデータURL https://c2.com/wiki/remodel/pages/WikiHistory も試したが15秒timeout。https://c2.com/wiki/history/WikiHistory は403。
- WikiWikiWebの日付の補助（二次）: https://www.doc.ic.ac.uk/csg/WikiWikiWeb （Imperial Collegeの紹介ページ、1995-03-25と記載）。
- Wikimedia Foundation公式: https://wikimediafoundation.org/wikipedia25/ （2001-01-15創設）。
- Niklas Luhmann Archiv: https://niklas-luhmann-archiv.de/nachlass/zettelkasten 、https://niklas-luhmann-archiv.de/bestand/zettelkasten/auszuege 、https://niklas-luhmann-archiv.de/assets/NL-Findbuch.pdf 。
- Obsidian公式変更履歴: https://obsidian.md/changelog/2020-03-30-desktop-v0.0.1/ 。開発者ericaxによる公開当日の告知: https://news.ycombinator.com/item?id=23324598 （2020-05-27）。同社公式 https://blog.dynalist.io/obsidian/ （2020-05-30、公開ベータが2日前に始まったとする）。
- Obsidian開発初期の区別の補助: https://forum.obsidian.md/t/when-was-obsidian-first-released-is-it-mayof-2020/40486 （2022-07-17、WhiteNoiseは3月をinternal buildsと説明）。リンク先v0.0.1フォーラムは取得失敗。現在のBacklinks/Graph helpは外枠しか取れず、機能の確認には上の開発者当日告知を用いた。

確認事項:
- K3 confirmed。Bushの1945年7月号の記事§6は個人の本・記録・通信を保管して素早く参照する装置を構想、§7は資料同士を結ぶ操作、§8はその連鎖を備えた百科事典も描く。代表的な逐語抜粋は§6 “a device in which an individual stores all his books, records, and communications” と§8 “associative trails”（計17語）。安全な文言: 「1945年、Bushは個人の資料を蓄え、連想の道筋で結ぶ装置Memexを構想した」。実際に製造されたコンピュータやLLMによる自動要約装置とはしない。
- K3/K2の関係: §6の注釈、§7の利用者による結合・自分の分析の追加・他者との共有、§8の経路を作る専門家の記述がある。したがって「Bushは保守の主体を考えていなかった」は原典から導けない。Karpathyは保守をLLMへ移す点を強調している、と帰属させる。
- K4 Nelsonは1965年のACM会議論文でhypertextを公表したことを確認。ただしXanadu公式沿革は語を選んだのは1963年、公表1965年と区別する（別の同プロジェクトFAQ等は1965年にcoinedと書く）。安全な文言は「1965年：Nelsonが論文で『hypertext』を提唱」。1965年を言葉の私的な着想時点と断言しない。
- K4 NLS: EngelbartとSRIのチームが1968-12-09、San FranciscoのFall Joint Computer Conferenceで90分のデモを実施。マウスだけでなく文書リンクと遠隔共同作業などを示した。安全な文言「1968年：NLSで文書を結び、共同で扱う実演」。
- K4 Webは要訂正。1989年3月の提案は確認。CERNは1990年末までに最初のサイト・サーバ・ブラウザが動作したと記載。W3Cの当時の年表は1991年8月にネット上で公開しalt.hypertextへ6/16/19日に告知したと記録。安全な年表は「1989年：Webを提案／1990年末：最初のサイト稼働／1991年：広く公開」。1991年を最初のサイトの作成時点と同一視しない。3月12日など要求外の精密な日は足さない。
- K4 WikiWikiWeb: Ward本人の2003年書簡はWeb上のwikiを1995年に始めたと確認。1995-03-25という日は大学サイトの二次紹介で一致するが、今回本人のWikiHistory本文は取れていない。画面は「1995年：Ward CunninghamのWikiWikiWeb」が一次資料だけで安全。最終報告の詳細日は1995-03-25（二次資料照合、本人ページ未取得）と出典の格を明記する。
- K4 Wikipedia: Foundation公式の25周年ページで2001-01-15を確認。WikiWikiWeb一般の誕生とは6年異なる。
- K4 Luhmann: アーカイブ管理機関は約90,000枚、形成期間はおよそ1952年〜1997年初めと説明。二つの主要な集合があり、全てが日付付きでも同じ種類のカードでもない。資料間で第1集合の内訳（約22,000/23,000枚、1960/1961年）が揺れるため内訳を画面に出す必要はない。「約9万枚、約1952–1997年」が安全。Zettelkasten自体をLuhmannの発明としない。
- K4 Obsidian: 現公式変更履歴は2020-03-30をv0.0.1 Initial release、publicと表示。一方、当時の開発者ericaxはHNの2020-05-27投稿で当日public beta開始と告知し、内部リンク・graph view・backlink paneを明記。同社5月30日のブログの「2日前」は1日のずれがある。安全な画面文言「2020年：Obsidian。リンク・逆リンク・グラフでノートをつなぐ」。詳細では初版3月30日と公開ベータ告知5月27日を併記し、現在のpublicラベルだけで3月30日を無条件の一般公開開始としない。

暫定判定: K3 confirmed、K4 corrected（Webの作成/公開とNelsonの命名/公表の区別）。

未解決・留保:
- WikiWikiWebの3月25日は一次ページで未照合。Unit 9の不足確認で再試行できるが、年だけの画面文言には支障がない。
- Obsidianの3月30日の配布対象は現変更履歴と当時の公開ベータ告知の呼称が異なる。月日まで一つに統合しない。
- 年表上の順序は直接の影響関係・唯一の系譜を証明しない。個人のノート、共同編集、LLMでの整理をすべて同じ目的・機能として扱わない。

次の単元: Unit 5（K5、Lost in the Middle／Context Rot／RULERの条件と図用の具体値）。Unit 4の記録を完了したので指示されたチェックポイントを要求する。残りはUnit 5–9、報告は専用ターンUnit 10。

## Unit 5: K5の長文脈評価と図に使う実測値

資料（すべて2026-10-10取得）:
- Liuらの著者版: https://arxiv.org/html/2307.03172v3 （2023-11-20版、§2、Appendix G.2 Table 6、Table 1、Figure 5）。TACL書誌: https://aclanthology.org/2024.tacl-1.9/ 、刊行PDF: https://aclanthology.org/2024.tacl-1.9.pdf （2024年2月、vol.12 pp.157–173）。
- Chroma原報告: https://www.trychroma.com/research/context-rot （旧research.trychroma.comから転送）。原図: https://www.trychroma.com/img/context_rot/longmemeval/claude.png （ファイルを残さず画像を取得し、印字値を目視照合）。著者コードの所在確認: https://github.com/chroma-core/context-rot 。
- Hsiehら: https://arxiv.org/abs/2404.06654 、https://arxiv.org/html/2404.06654v3 （初出2024-04-09、今回の数値は2024-08-06 v3、§4 Table 3、Appendix A Table 4）。

確認事項:
- K5(a) confirmed。図用の正確な数値は下表。モデルはGPT-3.5-Turboの0613版（4K）、NaturalQuestions-Openの2,655問、正解を含む文書1つと妨害文書19の条件。回答に正解文字列が含まれるかで採点。文書の位置だけを変える実験であり、全トークンへの注意の重みを測った図ではない。

| 正解文書の位置（1始まり） | 1 | 5 | 10 | 15 | 20 |
|---|---:|---:|---:|---:|---:|
| 論文のindex（0始まり） | 0 | 4 | 9 | 14 | 19 |
| 正答率 % | 75.8 | 57.2 | 53.8 | 55.4 | 63.2 |

- 数値の出典は **arXiv v3 Appendix G.2 Table 6**、曲線はFigure 5。資料なしのclosed-book=56.1%（Table 1）。補助的に正解資料1つだけのoracle=88.3%。先頭→中央の差は22.0 percentage pointsで、22%相対減とは書かない。Table 6はarXiv版の表番号として明記する（刊行PDFで同表は文字検索できなかったため、TACL版にも同番号があるとは保証しない）。画面の注記は「GPT-3.5-Turbo-0613／20文書／Liu et al., TACL 2024（数値：arXiv v3表6）」が安全。
- K5(b) confirmed。Chromaの表示日は2025-07-14。脚注に7月16日の追補があり、取得本文は初日から完全に不変とはしない。対象18モデル: Claude Opus 4, Sonnet 4, Sonnet 3.7, Sonnet 3.5, Haiku 3.5; OpenAI o3, GPT-4.1, 4.1 mini, 4.1 nano, GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo; Gemini 2.5 Pro, 2.5 Flash, 2.0 Flash; Qwen3-235B-A22B, 32B, 8B。全モデルを全実験で評価したわけではないとAppendixが明記。
- Chromaの課題群は、意味的類似度・妨害文・文章構造を変えたNIAH、LongMemEvalの会話QA、反復語列のコピー。長さによる性能変化はモデル・条件で異なり、単純な検索課題の高得点からあらゆる長文処理を推定できない。
- Chromaの安全な性能数値: LongMemEvalの同社選別306問で、Claude Sonnet 4（非thinking）の平均スコアは、関連部分のみ（平均約300 tokens）0.89、全履歴（平均約113,000 tokens）0.38。所在はLongMemEval Results—Claude Familyの原図、棒上の印字値。丸められたスコアである。無関係な情報・検索負荷・回答辞退も関わる条件比較で、「113Kを超えると知能が半分」「読めるのは38%」とはしない。
- K5(c) confirmed。RULERのeffective lengthは、13課題の平均が基準Llama2-7Bの4K時の85.6%を超える、調べた長さの最大値。物理的に入力可能な上限や全用途の保証ではない。v3 Table 3のGPT-4（Appendix Aでgpt-4-1106-preview）は公称128K、実効64K。平均は64Kで87.0%、128Kで81.2%。評価点は4K/8K/16K/32K/64K/128Kで、64Kの直後から失敗すると特定したわけではない。対象は検索、多段の追跡、集約、QA。

安全な共通画面文言: 「入る長さと、使いこなせる長さは同じではない。正解の位置や、余分な情報の量で成績が変わる。」見出しの「長文脈は均等に読まれない」は比喩として使う場合も、測ったのは条件別の正答率だと補足する。2023–2025年の特定モデルの実験を、2026年の全モデルに一律適用しない。

未解決・留保: Chromaの原図の丸め前スコアとAPIモデルの細かな日付IDは未照合だが、上記の図中表示値の再掲には不要。研究の再実行や2026年モデルの追加ベンチマークは依頼外。これらの結果だけでLLM WikiがRAGや長文投入より優れるとは証明できない。

次の単元: Unit 6（K6/K7、GraphRAG/DeepWikiと後続実装の公式発表・日付）。Unit 5完了後に指示されたチェックポイントを要求する。残りはUnit 6–9。report.mdは全単元終了後の専用報告ターンに作る。

## Unit 6: K6/K7の先行例・実装・公開日とMem0記事の照合

資料（すべて2026-10-10取得・試行）:
- GraphRAG論文書誌・抄録: https://arxiv.org/abs/2404.16130 。公式実装公開記事: https://www.microsoft.com/en-us/research/blog/graphrag-new-tool-for-complex-data-discovery-now-on-github/ 。公式技術説明: https://microsoft.github.io/graphrag/ 。
- Cognition公式記事: https://cognition.com/blog/deepwiki （現在の表示日05.05.25）。当初の公式告知: https://x.com/cognition_labs/status/1915816544480989288 。本文・UTC時刻は第三者転送API https://api.fxtwitter.com/cognition_labs/status/1915816544480989288 で取得。投稿リンク発見の二次資料: https://blog.starbug1.com/archives/3088 （2025-04-29、当時の埋め込み引用）。開発者自身の当時の応答: https://news.ycombinator.com/item?id=43796308 （silasalberti、2025-04-25）。
- Factory公式記事: https://factory.ai/news/wiki （2026-06-17）。公式沿革: https://docs.factory.com/changelog/release-notes （March 18 / April 10等）。
- LangChain公式: https://www.langchain.com/blog/introducing-openwiki-an-open-source-agent-for-repo-documentation （Brace Sproul、2026-07-01）、https://www.langchain.com/blog/introducing-openwiki-brains-general-purpose-wiki-memory-for-agents （同、2026-07-10）。コード所在: https://github.com/langchain-ai/openwiki 。
- GBrain本人リポジトリ: https://github.com/garrytan/gbrain 。GitHub API: https://api.github.com/repos/garrytan/gbrain （created_atとdefault_branchを取得）。公開告知: https://x.com/garrytan/status/2042369335419945338 、転送API https://api.fxtwitter.com/garrytan/status/2042369335419945338 。発見用の二次資料: https://kevin-wiki.vercel.app/wiki/tools/gbrain 。
- GBrainの補助確認: https://raw.githubusercontent.com/garrytan/gbrain/master/CHANGELOG.md は2MBの読み取り上限で途中まで（初版には届かず、初版日を確定する証拠には不使用）。/main/CHANGELOG.mdは取得失敗、/v0.9.3/CHANGELOG.mdは404。最新版READMEの動的な規模は画面向け数値として採用しない。
- Mem0本人記事: https://www.linkedin.com/pulse/state-agent-wikis-mem0-6eiec （Published Jul 21, 2026）。同社告知URLは https://x.com/mem0ai/status/2079585032587694582 （本文の確認にはLinkedIn公式記事を使用）。
- KarpathyのFarzapedia紹介: https://x.com/karpathy/status/2040572272944324650 （公式URLは取得エラー）。全文・UTC時刻は https://api.fxtwitter.com/karpathy/status/2040572272944324650 で取得。発見用の二次転送 https://instalker.org/karpathy/status/2040572272944324650 と整合。第三者記事の「canonical implementation」という強い呼称は本人の本文にない。

確認事項:
- K6 confirmed。GraphRAG論文v1は2024-04-24 18:38:11 UTC、実装公開記事は2024-07-02。資料からentity graphを抽出し、関連entity群のcommunity summariesを事前生成する。これはRAGの一方式である。LLM Wikiに先行する事前整理の例として使えるが、wikiの三操作と同じ運用だったとはしない。
- 派生問い（Unit 2）への答え: 「RAGは蓄積しない」は不正確。索引・資料・要約を保存するRAGがあり、回答の書戻しも設計次第。安全な対比は「検索して答えるだけなら、答えは知識庫へ残らない。Wiki型の運用では、整理した知識や有用な回答を戻して更新する」。検索の有無と、永続成果物への書戻しの有無は別軸。
- K6 DeepWiki: 本人公式アカウントの告知は **2025-04-25 17:13:53 UTC**（ID/本文を転送APIで取得）。Cognitionブログの現在の表示日は2025-05-05なので、ブログ日を発売日としない。公開GitHub repoから構造化した説明文書を作り、質問できるサービス。2025-04-25のHNで開発者Silas Albertiが自分の開発した製品として質問に答えている。安全な年表「2025年4月：DeepWiki。コードをwikiに整理し、質問できる」。2026年4月のKarpathy投稿の後継として並べない。
- K7 AutoWiki: 公式紹介記事は **2026-06-17**。ソースからwikiを生成し、変更に応じて差分更新、CIで既定ブランチへのpushに合わせて更新する設計。ところが公式changelogには **2026-03-18** のv0.80.0で既にAutoWikiアップロード後のdashboardリンクがあり、2026-04-10には差分更新と検索/exportの項目がある。6月17日を初登場と断定できず、Karpathy後に生まれたという因果も立証できない。安全な記載「Factory AutoWiki（2026年6月17日紹介記事。機能の履歴は3月以前に遡る）」、初公開日はuncertain。
- K7 OpenWiki: 公式公開記事は **2026-07-01**。コード用のwiki生成・維持CLIで、DeepWiki・AutoWiki・Karpathyの構想に影響を受けたと明記。AGENTS.md/CLAUDE.mdへwikiの参照を加える。初日の記事のKeeping the wiki up to date節で、定期GitHub Actionによるgit差分ベースの更新を記載している。**2026-07-10** のOpenWiki Brainsは個人の接続先資料等へ用途を拡大し、端末内wikiをスケジュール更新する設計。公開後の派生例として確実。
- K7 GBrain: GitHub APIのrepo作成時刻は **2026-04-05T14:40:56Z**、branchはmaster。これは公開告知日と同義ではない。本人の公開告知は **2026-04-09 22:29:29 UTC**（第三者転送APIで原文照合）でMIT公開と明記。アジア圏等の4月10日表記とは日付差に注意。初期告知からSupabase DBの接続とimport/queryを案内しており、「DBもサービスも不要なMarkdownファイルだけ」とするMem0の説明は少なくともこの実装の一般説明として不正確。本人が個人agent用の永続知識管理として作ったもの、とする。Karpathyから直接派生したことは今回の本人資料では確定していない。
- K7 Mem0: **2026-07-21**、同社のIn Context #17。A wiki is not memory節の逐語抜粋（計22語）: “what does this body of material contain” および “what a specific person prefers, what they decided last week”。前者は資料集合の知識、後者は個人の嗜好・決定・体験を、という同社の概念上の区分。この区別は有用だが、wiki形式には個人記憶を表せないという技術的な禁止ではない。記事は自社memory製品の紹介も兼ねる。
- Mem0記事の時系列・機能の注意: 冒頭は4社をKarpathy後の数か月で現れたものとしてまとめるが、DeepWikiは2025年。Factory以外は手動更新のみという記述はOpenWikiの7月1日公式記事と食い違う。上のGBrain説明も本人告知と不一致。従ってこの記事は「Mem0がどう分類したか」の一次資料として扱い、他社沿革や性能の事実の根拠にはしない。
- K7 Farzapedia: Karpathyが紹介したのは **2026-04-04 23:28:36 UTC**。安全な画面文言「KarpathyはFarzapediaを個人wikiの実例として紹介。見える・持ち出せる記憶を評価した」。本人が挙げた性質は、内容を確認できること、ローカルで所有すること、共通ファイル形式、使うAIを選べること。公式/唯一の実装と認定したとは述べていない。4月5日という紹介記事の日付はUTC日付とは異なる。

判定案: K6 confirmed、K7 corrected（後続という括り、初公開日と記事日、Mem0の一般化に修正が必要）。原投稿を第三者APIで取得した箇所は、最終報告でもその転送経路を明記する。

未解決・留保:
- AutoWikiの最初の公開日・当時の利用可能範囲は未確定。3月18日の履歴はその日までに機能が存在した証拠であって正式発売日の証拠ではない。Unit 9で必要性を判断し、最小限の追加確認に留める。
- GBrainの初版versionの日付はここでは確定しない。repo作成日と本人の公開告知を分ければ依頼の年表は満たせる。
- 製品相互の優劣・長期の知識維持精度はこの単元では評価していない。形の類似だけから独立発明や直接の影響を決めない。

次の単元: Unit 7（K8、批判の原文とRAG Collapse／WikiLoopの実証範囲）。本単元の記録を完了したので指示されたチェックポイントを要求する。

## Plan revision 2

わかったこと: 「LLM Wikiの後続」を探す過程で、DeepWikiは前年、AutoWikiはKarpathy投稿より前の履歴が見つかった。Mem0記事をそのまま時系列の証拠にできない。原質問を変更せず、K6/K7を「先行例・関連実装・明示された影響関係」の3つに整理する。

派生した問い: wikiとuser memoryは排他的か。元の章の説明に必要なので今追う。K9のmemory調査で形式・保存対象・更新契機の違いを確認し、「wikiだから個人の意思決定を保存できない」という言い方を避ける。全製品の長期精度ベンチマークは依頼外としてdeferred、必要なら次の検証課題として報告に残す。

残りの単元:
7. K8 批判 × HN/gist原コメント、批評者記事、RAG CollapseとWikiLoop。
8. K9/K10 memory/harness × 既存H3、公式発表、MemGPT、Anthropic記事。wikiとの排他性を点検。
9. 全ID照合・不足確認。AutoWiki初公開の限定確認、K4の未確定日付等は画面に必要な精度で判断。
10. 全調査完了後にready-to-reportを返し、明示された専用報告ターンでreport.mdを作る。

## Unit 7: K8の批判の原文・帰属とRAG Collapse／WikiLoopの測定範囲

資料（すべて2026-10-10取得・試行）:
- HN元スレッド: https://news.ycombinator.com/item?id=47640875 （HTMLのtitle属性で投稿日時を照合）。個別コメント: https://news.ycombinator.com/item?id=47645480 、https://news.ycombinator.com/item?id=47646835 、https://news.ycombinator.com/item?id=47647504 、https://news.ycombinator.com/item?id=47647774 。
- gist本文/コメント: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f 。通常HTMLは最近のコメントしか表示せず、load_commentsの試行は有効な本文なし。公式APIの https://api.github.com/gists/442a6bf555914893e9891c11519de94f/comments?per_page=100&page=1 は取得できたためpage=1–7（各100件、4月4日〜20日を含む）を上限付きで走査。コメントのID・user・created_at・bodyを照合。
- gist個別原コメント: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f?permalink_comment_id=6103209 （LudoE11）、同 ?permalink_comment_id=6102967 と ?permalink_comment_id=6103019 （現在API user=null）、同 ?permalink_comment_id=6086743 （asakin）、同 ?permalink_comment_id=6109752 （gulliveruk）。
- 二次・帰属探索: Z. Huang, Denser.ai, https://denser.ai/blog/llm-wiki-karpathy-knowledge-base/ （2026-04-16、@gnusupport/@LudoE11の批判をまとめる記事）。数値と名前の対応をこの記事だけで断定しない。
- 体験者自身: Dani Gerwa, https://danigerwa.com/articles/one-small-layer-karpathy-llm/ （2026-04-11）。Kunal Ganglani, https://www.kunalganglani.com/blog/llm-wiki-karpathy-local-knowledge-base （表示は2026-04-15、更新2026-09-16。3か月使用という記述を4月15日時点の発言とはしない）。
- 取得失敗: https://www.scribelet.app/blog/llm-wiki （web Cache miss、shell403）。検索断片には資料更新後もwikiが古い内容を伝えるという著者の批評があるが、依頼のcache引用の逐語一致・著者名は確認できず。
- RAG Collapse: Gregory Druck / Ethan Smith, https://arxiv.org/abs/2608.22118 、https://arxiv.org/html/2608.22118v1 （初出2026-08-22 22:06:44 UTC、§4/7/8/9/14/15を確認）。
- WikiLoop: https://arxiv.org/abs/2607.26604 、https://arxiv.org/html/2607.26604v1 （初出2026-07-29 08:28:30 UTC、§3/4/5とTable 1を確認）。

確認事項と帰属:
- HNスレッド投稿は2026-04-04 16:57:45。devnullbrainの「model collapse」懸念は4月5日02:05:27、コメント47645480。既存情報をLLMが書き直すと情報が劣化するという懸念を述べ、学習時のmodel collapse研究へリンクしている。Imanari（47646835、4月5日06:56:17）は、二次情報を再利用するほど微小な誤りが蓄積するという懸念。同スレッドでは、モデルを再学習する話ではないという反論と、rawへのリンクを保持する設計だという指摘もある。「model collapseがこのwiki運用で実証済み」とはしない。
- 「outsourcing the thinking」の文字列そのものの出典は特定できていない。主旨を一次資料で裏付けるのはnidnogg（47647504、2026-04-05 09:04:43）の、設計・調査をwikiに任せて自分の知識の穴が残ったという体験と、loveparade（47647774、同09:55:02）の、wikiを書く過程で本人の理解が育つという意見。安全な文言は「整理を任せると、自分で理解を組み立てる機会まで減らさないか、という批判もある」。特定の人による上記英語の逐語引用とはしない。
- 約1,000ファイル: gist APIで現在user=nullのコメント6102967（2026-04-16 05:46:34）、6103019（同06:42:47）に、その規模で破綻するという強い断定がある。しかし比較条件・実験データはない。Denser.aiは@gnusupportと@LudoE11に帰属させるが、現在のAPIだけでは匿名化された本文の著者をgnusupportと確定できない。
- LudoE11の現存するコメント6103209（2026-04-16 08:32:51）は、大規模wikiの保守・幻覚・矛盾検出の一貫性への疑念と、人間の監督の必要性を述べる。これは意見/経験であり、1,000ファイルを測ったベンチマークではない。asakinの4月8日コメント6086743は@bitsofchrisの「1000 files」懸念への言及だが、元コメントの本文・日付は今回見つからず。全コメントの網羅取得は不要と判断して7頁で探索を止めた。
- 約200ファイル: Dani Gerwa本人の記事（4月11日、The Problem That Shows Up Around 200 Files節）は224ファイルのwikiで広いgrep→多数の頁の読み込みによりトークン消費が増え、検索を導入した体験。本人も厳密なbenchmarkではないと明記。Kunal Ganglaniの更新済み記事にも約200ファイルで全体graphを文脈に保持できなくなるという運用談がある。これらはgistコメントへの帰属を確認できず、本人記事として使う。「200/1,000がLLM Wiki全般の上限」とは言わない。
- 「a compiled wiki is a cache, and caches lie」は完全一致検索・部分検索、HN、取得したgistコメントと批評記事では出典を特定できず。名言として引用せずuncertain。安全な説明は「まとめを更新しなければ、元資料が変わっても古い説明が残る」。この機構の説明と、特定の人が言ったという帰属は分ける。
- RAG Collapseは、**モデルを再学習せず**、同じ問いに答えた生成結果を記事へ変換して次回の参照資料に入れる反復simulation。全資料を置換、1件ずつ置換、原資料も残るpoolに追加して検索、の3条件。測定は回答間の意味類似、語彙/登場entityの種類、回答が同内容か、自己生成資料の引用率等。中心結果は回答の多様性の縮小と自己生成資料への偏りであり、wikiの正答率・幻覚率や全モデルの知能低下を直接測ったものではない。
- RAG Collapseの具体例: v1 §9 Table 3、GPT-5.2 Chat／Entity ChatGPTの101問／Search条件で、collapsed at start 1.98%、end 77.23%。entity課題のcollapseは同一roundで生成した回答すべてが同じentity集合を挙げる定義。これは77.23%の事実誤りという意味ではない。§14–15ではcollapse防止専用promptを試しておらず、検索多様化等の緩和策の効果は未確定。画面に数字を載せる必要がなければ「自己生成資料を再び検索する実験では、回答の多様性が縮んだ」で十分。
- WikiLoopは、sourceへのprovenanceを持つlinked-page wikiを作るBuilderと、検索・読込み・リンク追跡で回答するNavigatorを、役割に応じた共有policyとして学習する。Builderは編集前後のwikiの隔離copyを用い、固定Navigatorの下流QAの改善と無関係な問いへの退行を報酬にする。Navigatorは証拠が揃うことを効率化より優先する設計。
- WikiLoop v1 §4 Table 1: AuthTrace（860作品・2,099問）、同じQwen3.5-9B回答backboneで、All ACはLLM-Wiki base 56.3、WikiLoop 62.6（6.3ポイント差）。ただしbaseは著者の先行LLM-Wiki実装であり、Karpathyの個人wikiの実測ではない。**§5 Limitationsはcandidate editsを評価後に破棄するので、永続書戻し・長期のBuilder/Navigator相互適応は未検証と明記**。長期の誤り蓄積が解決した証拠にしない。

判定案: K8 corrected（一部引用帰属はuncertain）。安全な画面文言: 「知識庫が育っても、正しさが自動で増えるわけではない。原資料に戻れること、古い記述の更新、人の理解と点検が要る」。研究は「同じ生成文を再参照すると回答が似通う実験」と「回答への役立ち方を報酬にwiki編集を学ぶ研究」に分ける。

未解決・留保:
- cacheの英語一句とoutsourcingの英語一句は発言者・日時が未特定。後者の論旨はHN本人コメントで代替可能。前者は直接引用を画面から外すのが安全。
- 約1,000ファイルの批判者の一部は現在API user=null。二次資料から実名/handleを断定しない。約200ファイルも、普遍的限界や厳密な測定結果としない。
- RAG CollapseとWikiLoopは本調査で再実験せず、確認したv1の主張を記録。査読済み採択は確認していないので2026年プレプリントとする。

次の単元: Unit 8（K9/K10、memory機能とharnessのファイル状態）。Unit 7を完結し、ボスの閾値通知に従ってチェックポイントを要求する。残りはUnit 8–9、全単元終了後にready-to-report、明示された報告ターンまでreport.mdを作らない。

## Plan revision 3

わかったこと: 批判の「model collapse」と研究のRAG Collapseは、学習時の崩壊・推論時の回答多様性の縮小・wikiの事実誤りを混同しやすい。K8は発言の存在と実証された現象を別々に扱う。WikiLoopには長期書戻しを試していない重要な限定があった。

派生した問い: wikiを長期更新したときに、出典忠実性・回答品質・費用はRAGより改善するか。元の依頼の文言を安全にするには「今回の2論文だけでは証明されない」と示せば足りるため、包括的比較はdeferred。検索で見つかった別研究（https://arxiv.org/abs/2605.18490 、https://arxiv.org/abs/2605.07068 ）は次回の調査候補としてのみ記録し、本調査では本文未検証・数値不採用。

残りの単元は変更なし: 8 memory/harness、9 全ID照合・未確認項目の安全な扱い、10 専用報告ターン。

## Unit 8: K9/K10のmemory公開履歴とファイルによるセッション引継ぎ

資料（すべて2026-10-10取得）:
- 既存検証: research/agent-facts/report.md のH3と補足。API memory toolの性質・public betaの日付は再利用。
- OpenAI公式発表: https://openai.com/index/memory-and-new-controls-for-chatgpt/ （初出2024-02-13、2024-09-05・2025-04-10・2025-06-03の追記を区別）。公式release notes: https://help.openai.com/en/articles/6825453-chatgpt-release-notes （Apr 29, 2024、Feb 13, 2024の節）。
- OpenAI Docsスキルを使用。公式docs検索でChatGPT memoryの指定年月を検索したがAPIの無関係な結果だったため、ボス指定の公式発表・公式Helpに限定したweb検索へ切り替え、原ページを開いて照合。
- Anthropic公式: https://claude.com/resources/articles/context-management （September 29, 2025、memory toolとpublic betaの段落）。
- Packerら: https://arxiv.org/abs/2310.08560 （MemGPT: Towards LLMs as Operating Systems、初出2023-10-12 17:51:32 UTC、v2 2024-02-12。書誌・抄録を確認）。
- Anthropic engineering: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents （2025-09-29、Why context engineering…、Context retrieval and agentic search、Structured note-taking）。
- Anthropic engineering: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents （Justin Young、2025-11-26、導入、The long-running agent problem、Feature list、Incremental progress、Getting up to speed、脚注1）。

確認事項と判定:
- K9 confirmed。ChatGPTは **2024-02-13** にFree/Plusの一部にmemoryを試験提供と発表。**2024-04-29** にPlus全体へ拡大（当時は欧州・韓国を除外）。**2024-09-05** の公式追記はFree/Plus/Team/Enterpriseへの提供を記載。**2025-04-10** の追記は保存した記憶に加え過去の会話を参照する拡張を記載し、Plus/Pro向け、Team/Enterprise/Eduは数週間後とする。段階的な導入を一つの「memory発売日」にしない。
- 2025-04-10の発表は過去の会話を利用したpersonalizationについてであり、すべての過去の発言を毎回答の入力へ全文投入することや完全な想起の保証ではない。安全な画面文言は「2024年、会話をまたいで情報を残すmemoryを試験提供。2025年には過去の会話も参照する形へ拡張」。歴史的な時点の記述であって現在の全プランの仕様表ではない。
- Claude API memory toolは **2025-09-29 public beta**（既存agent-facts H3を再引用、公式発表とも一致）。ツール呼出しで外部ファイルを作成・読込・更新・削除し、保存基盤を開発者が管理する。知識庫、プロジェクト状態、以前の学びを残せる。Claudeの一般消費者向け会話memoryの公開日とは別。
- MemGPTは **2023-10-12** 初出。OSの階層的な記憶管理を参考に、限られたモデル入力と外部の記憶領域の間で情報を動かす設計。論文は文書分析と複数セッションの会話で評価。モデルの物理的context window自体が無限になるという説明にはしない。ChatGPT memory/Claude toolの発明元や直接の系譜とする証拠は今回の資料にはない。
- Plan revision 2の派生問いへの答え: wikiは情報の組織化・表示形式、個人memoryは保存対象や用途の呼び方であり、排他的ではない。Claudeの公式memory tool自身がファイル形式で知識庫・作業状態を保存する。これは「wikiは個人の決定を保持できない」という技術的区分への反証になる。資料中心／個人中心というMem0の対比は用途の傾向として使う。
- K10 confirmed（記事内の設計事例として）。Context engineering記事は **2025-09-29**。関連情報を必要な時にツールで読込み、探索で徐々に文脈を得ること、窓の外へメモを書いて後で読み戻すことを説明している。既存の検索へ動的探索を加える混合方式も認め、RAGを一律不要としていない。
- 同記事の短い逐語抜粋と所在（合計25語以内で最終報告へ採用可）: Why context engineering…第1–2段落の “context rot” と “attention budget”; Context retrieval and agentic searchの “just in time” と “progressive disclosure”; Structured note-taking冒頭の “These notes get pulled back into the context window at later times.”（計22語）。同節の例にNOTES.mdがある。原文でjust in timeにハイフンはない。NOTES.mdは任意のcustom agentの例で、すべてのagentが必ず使う固定ファイル名ではない。
- Attention budgetはこの記事の説明上の比喩。モデルに一定量の注意残高があり1tokenごとに測定可能な量だけ減ると実証した物理法則として扱わない。context rotはK5の条件付き実験と結びつけ、「長くなるほど、どの問いも必ず単調に悪化する」としない。
- Harnesses記事は **2025-11-26**。最初のsessionのinitializerが起動script、進捗ファイル、初期git commit、要件を展開したJSONの機能一覧を準備。後続のcoding agentが進捗とgit履歴を読み、機能を進め、検証後に機能一覧の状態・進捗・commitを残す設計。ファイル例はclaude-progress.txtとfeature_list.json。JSONを使う理由は著者の実験でMarkdownより不適切な変更が少なかったためであり、全モデルへの普遍的な優位ではない。
- Harnessesの逐語抜粋（導入第2段落、13語）: “each new session begins with no memory of what came before.” 同記事は新しいsessionへの文脈引継ぎの必要性をこう述べる。一般にharnessが要約・履歴・メモを入力へ復元できないという意味ではない。
- Harnessesの短い逐語抜粋の補足（The long-running agent problemの箇条書き、2語）: “Initializer agent”; ファイル名claude-progress.txtを含めても引用総量25語以内。細かな設計は要約と節名で示す。脚注1ではinitializer/codingの違いは初期user promptだけで、system prompt・tools・harnessは同じと明記。異なるモデルを必要とする仕組みとはしない。

安全な画面文言:
- K9: 「会話の好みや決定も、作業の進み具合も、外へ残して次に読み戻せる。何を残し、いつ使うかは仕組みごとに違う。」
- K10: 「文脈が切り替わっても、進捗・未完了の機能・変更履歴をファイルから読み直し、続きを進める。」

未解決・留保:
- 記事の公開日時はページ表記の日付まで。記事の現行本文が公開当日の文面と完全に同じかはアーカイブ差分で保証していない。
- ChatGPTの2026年時点のmemory内部設計・全プランの最新仕様はこの歴史照合の範囲外。検索に新しい公式記事が出たが、その仕様を2024–2025年へ遡及していない。
- Anthropicの例を、このプロジェクトへそのまま課す運用規則とは扱わない。性能優位や引継ぎ完全性を本調査で測定していない。

次の単元: Unit 9（全K1–K10照合、WikiWikiWebの一次日付・AutoWiki初公開日の限定確認、未確認引用を採用しない扱いの確定）。Unit 8を完結したのでボスの閾値通知に従いチェックポイントを要求する。まだready-to-reportではない。Unit 9完了後にready-to-reportを返し、明示された専用報告ターンでreport.mdを作成する。

## Plan revision 4

わかったこと: 最終照合でWikiHistoryのミラーと、そこから本人サイトにある1995年3月16日の招待メールを確認できた。広い公開日と、既に動くwikiを特定の相手へ案内した日を分ける必要がある。AutoWikiは公式3月18日履歴と6月17日紹介記事の区別を維持する。原質問は変更しない。

派生した問い: WikiWikiWebの最初の稼働日はいつか。1995年3月16日までに存在したことは一次資料で分かるが、全公開範囲・初稼働時刻の確定は章の年表に不要なのでdeferred。3月25日を「初めて稼働した日」と書かない。

残りの単元: 現在のUnit 9を横断照合と日付の限定調査で完結する。追加の調査単元は設けず、次は明示された専用報告ターン。報告では未確定事項を留保として残す。

## Unit 9: 全K1–K10の照合と、未確定日付・引用の扱いの確定

資料（すべて2026-10-10取得・再照合）:
- 本ログUnit 1–8、research/agent-facts/report.mdの主表と見出し構成。依頼の全K1–K10をログの対応箇所と照合。
- Ward本人の書簡: https://c2.com/doc/etymology.html （2003年11月の質問と返答）。
- 本人サイトの保存メール: https://c2.com/wiki/mail-history.txt （末尾のNew Service on PPR、1995-03-16 11:06AM）。
- 原WikiHistory: https://wiki.c2.com/?WikiHistory は今回もJS外枠のみ。
- WikiHistoryの第三者ミラー: https://kidneybone.com/c2/wiki/WikiHistory （冒頭およびWard署名まで、保存メールへのリンク）。https://kidneybone.com/c2/wiki/WardsWikiTenthAnniversary （日付の補助。共同編集ページで過去の年号改変を話題にしている）。
- アーカイブ再試行: https://web.archive.org/web/20031213120340/http://c2.com/cgi/wiki?WikiHistory はInternal Error。原サイトの当該時点本文の独立照合はできず。
- Factory公式: https://factory.ai/news/wiki （今回 https://factory.com/news/wiki に転送。冒頭は2026-06-17と表示）、https://docs.factory.com/changelog/release-notes （CLI v0.80.0／Desktop v0.34.0、2026-03-18）。公式限定の追加検索でも初公開日の告知は発見できなかった。

最終確認:
- WikiWikiWebは本人の2003年書簡で1995年を直接確認。WikiHistoryミラー冒頭は1995-03-25とし、Ward署名の回顧本文を収録している。本人サイトの保存メールでは**1995-03-16に既にwikiのURLを知人へ案内し、1週間ほど後に広く告知する予定**と述べている。3月25日と矛盾するものではなく、試用への招待と広い告知を区別する証拠。画面は「1995年：WikiWikiWeb」。補足で月日を出すなら「広い公開日は1995-03-25とWikiHistoryのミラー等が記載。本人保存メールでは3月16日に招待済み」とする。ミラーを原サイト直接取得とは表示しない。
- AutoWikiの初公開日は引き続きuncertain。3月18日の公式履歴はアップロード完了後のdashboardリンクを追加した記録。6月17日は紹介記事の日付。Unit 6の「機能の履歴は3月以前に遡る」は曖昧なので、最終報告は**「遅くとも2026-03-18の公式履歴に登場」**へ正確化する。Karpathyの4月2日投稿後に初めて現れたとは扱わない。
- K1/K2の発言、gistの所在・構造、K3原典、K4各年表、K5の3研究の具体値、K6先行例、K7関連実装、K8批判と2研究、K9公開履歴、K10記事の設計と短い引用はすべてログに対応づけ済み。判定表はK1 confirmed、K2 confirmed、K3 confirmed、K4 corrected、K5 confirmed、K6 confirmed、K7 corrected、K8 corrected、K9 confirmed、K10 confirmedを採用し、複合項目の未確定部分は同じ行の留保と補足に明示する。
- K1の規模「約100記事・40万語」とK2 gistの「約100資料・数百頁」は異なる原文の単位。混ぜて同じ数字だと書かない。三操作と三層は構想であり、厳密なプロトコルや性能保証ではない。
- K2のRAG批評は著者の主張として記載。GraphRAGの事前要約とK10の検索・動的探索の併用を踏まえ、「RAGは蓄積しない」「Wikiは検索不要」を一般命題として採用しない。
- K5の図は指定モデル・課題・資料数・評価版を併記。実測値をattention weightの図と呼ばず、2026年の全モデルへ一般化しない。Wiki方式の優位の根拠にも使わない。
- K7は「Karpathy後の後継」一括ではなく先行例／関連実装／明示された影響を区別。Mem0記事は同社の分類の出典であり、他社の発売日・機能の最終根拠にはしない。wikiと個人memoryは排他的でない。
- K8のcache一句は出典未特定、outsourcing一句は論旨を確認した本人コメントの要約へ置き換える。1,000ファイルの一部著者名は現在APIがnull、200ファイルは本人の運用談。いずれも普遍的な限界値・厳密な測定結果とはしない。RAG Collapseの多様性低下、学習時model collapse、wikiの事実誤りを分ける。WikiLoopは長期の永続書戻しを検証していない。
- 要求された全文と多数の逐語引用は転載せず、代表的な短い抜粋、節・段落の所在、日本語要約と原文リンクで報告する。各資料25語以内を目安にログにある抜粋を選び、同じ原文の複製を別資料として引用量を増やさない。特にgistはIDE比喩とcompounding artifact、K1は末尾の一文を優先する。

不確実性の確定（追加探索を止め、報告へ引き継ぐ）:
- X原投稿本文の一部は第三者API経由であり、原サイト直接取得ではない。時刻は投稿IDとAPIで整合する。
- gistの秒・timezone・updated_atは未確定だが、4月4日作成とUI履歴1件は確認済み。
- WikiWikiWebの3月25日はミラー／二次資料、Obsidianは初版とpublic betaの日を分離。AutoWiki初公開日は未特定。
- K8の未確認英語句・匿名化された著者は推測で補わない。
- Wiki/RAG/memoryの長期品質・費用を同じ条件で比較する評価、2026年モデルの長文脈再評価、WikiWikiWebの最初の稼働時刻は次の課題としてdeferred。未読の派生論文を結論の根拠にしない。

次の工程: 最新計画に対して全調査単元を完了。**ready to write report**。このターンではreport.mdを書かない。次の明示された報告ターンで本ログを読み直し、日本語の要約、K1–K10各1行の判定表、必要な補足（短い逐語引用・年表・K5図用データ・批判の帰属）、不確実性、計画の変遷、推奨する次の行動をresearch/wiki-facts/report.mdへ書く。ボスの閾値通知に従って、ログ追記の完了後にチェックポイントを要求する。

## Unit 10: 日本語の最終報告と照合

日時: 2026-10-10 04:14:59 UTC時点で報告本文と構造照合を完了（clock）。このターンはattendantが明示したreport turnであり、追加checkpointは要求しない。

参照資料（2026-10-10再読）:
- research/wiki-facts/log.md の全Unit 1–9とPlan revision 1–4。
- 元の依頼K1–K10、research/agent-facts/report.mdの主表形式。
- research/wiki-facts/report.md（本単元で作成）。新たなWeb資料やモデル実験は追加していない。外部資料の取得日は各Unitの2026-10-10を引き継ぐ。

成果・確認:
- 日本語の要約、全K1–K10各1行の主表、必要な補足、取得方法・不確実性、計画の変遷、推奨行動をreport.mdに保存。
- confirmed 7件、corrected 3件（K4/K7/K8）。複合項目内の未確認日付・引用帰属はuncertainと明示し、項目全体の判定に隠していない。
- K1/K2は代表的な短い逐語引用と原文の所在を示し、全文は転載しない。IDEの比喩はgist、初回投稿の規模とgistの規模は単位を分離。BushとAnthropicの引用も所在を付した。
- K5の5点（75.8/57.2/53.8/55.4/63.2）、closed-book 56.1、Chroma 0.89/0.38、RULER 64K/128Kと基準値、2論文の数値を本ログと照合。意味・版・モデル・課題の留保を伴って記載。
- 構造確認でK1–K10の欠落・重複なし、TODO等のplaceholderなし。69個の異なるURLをログと照合し、うち2個のgistコメントURLはUnit 7の「同 ?permalink_comment_id=6102967/6103019」という省略記法を完全URLへ展開したもので、新規未確認資料ではない。他のURLはログの記録と一致。
- 出力ディレクトリはlog.mdとreport.mdの2成果物のみ。最終本文は約36KB。デッキ、engine、他の研究成果物、依存、システム設定は変更していない。

残る点と次の工程:
- X直接取得、gistの細かな時刻、WikiWikiWeb初稼働、Obsidian初版の公開範囲、AutoWiki初公開日、批判の未特定引用・著者は報告の留保へ引き継いだ。長期Wiki/RAG/memory比較と現行モデルの追加評価は推奨する別調査としてdeferred。
- 最新計画の調査単元と報告をすべて完了。次の研究単元はない。state done、unit report、checkpoint falseで終了する。
