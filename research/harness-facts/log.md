# 「開いたハーネス」章：調査ログ

- 問い：decks/llm の第9章向けに指定された H1–H12 の主張を一次資料で検証し、画面に使える日本語・日付・数値・条件を示す。
- 範囲：harness engineering、評価値の読み方、DeepSeek Harness/Cordis、モデルカード、費用実験、Codex/app-server、ACP、最小構成、コードからのツール呼出し。既存 research/llm-facts/report.md と research/agent-facts/report.md は再利用し、既確認内容の再調査はしない。プロジェクトは編集しない。
- 開始：2026-10-10 03:55:05 UTC。取得日は特記なければ 2026-10-10 UTC。
- 成果物：この追記専用 log.md と、別の report turn で作る日本語 report.md のみ。
- 判定：confirmed / corrected / uncertain。複合項目は重要な訂正・未確定点を隠さない。会社発表・独立評価、初投稿・公開・preview・beta・GA を分離。リポジトリは読んだ commit とパスを保存。

## 初期計画

調査単位は「問い × 資料群」で分ける。単位を終えるたびに出典、確認内容、未解決点と次の単位を追記する。

1. H1：用語・起源・開発実験の数値 × Hashimoto、OpenAI、martinfowler.com 本人/公式記事。前提文書と既存報告の引継ぎもここで記録。
2. H2：同一モデルでのharness変更効果 × LangChain公式記事、Meta-Harness/Self-Harness論文。
3. H3：ベンチマークの定義・独立成績・限界 × SWE-bench/Terminal-Bench/DeepSWE/Toolathlon公式資料、Vals AI、OpenAI。
4. H4：公開日・構造・profile/preset・記録・sandbox × deepseek-ai/deepseek-harness 固定commit、release履歴。
5. H5：Cordisの理論・由来・図示例 × 論文版履歴、Cordis/Koishi公式文書・コード。
6. H6：モデルカード値・設定と第三者評価 × DeepSeek-V4-Pro-0813公式HFモデルカード固定commit、Vals AI/Artificial Analysis。
7. H7：既定の推論設定と費用実験 × Prompt-Induced Waste in Coding Agents v6と実験資料。
8. H8：Codexを組み込む三層・公開範囲・Relay × OpenAI公式記事、サンプル/ライセンス。2026-01-23記事は既存調査を再利用。
9. H9：app-serverのtransport・型・通知・承認 × openai/codex codex-rs/app-server READMEと型定義の固定commit。
10. H10：ACPの開始・仕様・採用 × Zed/ACP公式発表と仕様、各実装の公式資料。
11. H11–H12：最小harnessの系譜とコードによるtool使用 × 既存agent-facts、Anthropic/mini-SWE-agent/Cloudflare公式資料。DeepSeek Code/PTCとの対応はUnit 4を参照。
12. 横断整合：H1–H12の空欄・版・条件・出典・引用量の監査。必要な派生問いを追究または保留とする。

全単位終了後は ready-to-report を返し、次の明示的なreport turnで報告書を作成する。

## Unit 1: H1 用語・記事の版・OpenAI開発実験と前提の引継ぎ

完了：2026-10-10 UTC。以下すべて同日取得。

### 読んだ資料

- ローカル：`AGENTS.md`、`decks/llm/README.md`、`decks/llm/ch7-knowledge.md`。`docs/spec.md`冒頭の仕様・画面の契約も参照。先行報告 `research/agent-facts/report.md`（特にS3、H1、H2–H5）と `research/llm-facts/report.md` の判定・関連項目を参照。mini-SWE-agent記載位置の確認に `research/agent-facts/log.md` Unit 8相当の行530、561も参照。
- Mitchell Hashimoto, **My AI Adoption Journey**, **2026-02-05**, §Step 5: Engineer the Harness：<https://mitchellh.com/writing/my-ai-adoption-journey>。
- Ryan Lopopolo, **Harness engineering: leveraging Codex in an agent-first world**, **2026-02-11**, OpenAI：<https://openai.com/index/harness-engineering/>。全本文、特に冒頭、We started with an empty git repository、Redefining the role of the engineer、We made repository knowledge the system of record、Enforcing architecture and taste。
- Birgitta Böckeler, **Harness engineering for coding agent users**, **2026-04-02**：<https://martinfowler.com/articles/harness-engineering.html>。署名・式のリンク先・Significant Revisionsを確認。
- Birgitta Böckeler, **Harness Engineering - first thoughts**, **2026-02-17**：<https://martinfowler.com/articles/exploring-gen-ai/harness-engineering-memo.html>。現在の記事がリンクする初期メモ。`Model +`の一致なし。
- Vivek Trivedy, **The Anatomy of an Agent Harness**, **2026-03-10**, LangChain：<https://www.langchain.com/blog/the-anatomy-of-an-agent-harness>（旧URL <https://blog.langchain.com/the-anatomy-of-an-agent-harness/> から転送）。Böckelerの式が直接リンクしている一次資料。署名・日付・定義を確認。
- 式の先行例を完全一致・before:2026-03-10でも検索したが、先行使用を確定する一次資料は得られなかった。検索エンジンの期間指定を満たさない後日の結果も返ったため、検索結果の日付だけで起源を認定しない。

### 確認した事実と画面に使う文言

**H1の推奨判定：corrected。** Hashimoto/OpenAIの大筋・日付・数値は確認。式をBöckelerの初出とする帰属には訂正が必要で、世界最初の使用者は未確定。

1. Hashimotoの題名は「Harness engineering」ではなく **My AI Adoption Journey**。2026-02-05のStep 5でharness engineeringと呼んでいる。エージェントが同じ誤りを繰り返さないよう、指示ファイルと検証用プログラムを改善する考え。業界で定着した別の語があれば従うと本人が留保しており、造語の世界初という主張ではない。短い逐語引用候補（23語）：“anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again.” ←この候補は実際には29語なので最終報告では全体を引用しない。採用候補を **“the agent never makes that mistake again”**（8語）に限定し、定義の残りは日本語で要約する。
2. OpenAIは社内betaを開発した事例を自己報告。初commitは2025年8月下旬、約5か月で約100万行（アプリだけでなく基盤・ツール・文書等を含む）、人が直接書いたコード0行、約1,500件のPRを作成・merge。当初3人がCodexを動かし、平均 **3.5 PR / engineer / day**。記事時点で7人へ拡大し、処理量は増加したという。同社の自己報告で、第三者測定や一般的な生産性保証ではない。人は意図指定・優先順位・受入条件・結果判断等を担う。internal beta / external alpha testersでありGAの事例とは書かない。
3. 同記事の教訓：AGENTS.mdは約100行の入口とし、詳しい正本へ案内する。linter/構造testで境界を検査し、errorに修正方法を含める。失敗時は不足している道具・文書・制約を環境へ追加する。原文の短い逐語引用を3つ合計20語以内に収める：
   - “map, not a 1,000-page instruction manual” （7語）
   - “inject remediation instructions into agent context” （7語）
   - “what capability is missing” （4語）
   合計18語。引用以外は日本語要約。全文の長文引用は行わない。
4. **Agent = Model + Harness** はTrivedyの2026-03-10 LangChain記事で確認。Böckelerの2026-04-02記事はその記事へ直接リンクして式を使う。2026-02-17は初期メモの日付で、現在の全文記事や式の初出日へ流用しない。安全な画面文：「エージェント ＝ モデル ＋ ハーネス（LangChain、2026-03-10）」。本文・脚注ではVivek Trivedyを明記し、「初めて考案した」とはしない。Böckelerの署名をMartin Fowlerと取り違えない。

### 引継ぐ既存調査と差分

- `research/agent-facts/report.md` H1より、OpenAIの **2026-01-23**記事は **Unrolling the Codex agent loop**：<https://openai.com/index/unrolling-the-codex-agent-loop/>。agent (or harness)の説明は今回のH8で再引用する。Codex harness自体の初公開日と区別する。
- 同S3よりCodex CLIは **2025-04-16**にopen sourceの実験として公開、クラウド版2025-05-16とは別。H8の前提として再利用。
- 同H1のGPT-4 Turbo比較はSWE-bench **Lite** 300課題、gpt-4-1106-preview、pass@1、Shell-only 11% / SWE-agent 18%、1課題4ドル。今回H2の2025–26例と混ぜない。
- 指定された「mini-SWE-agentはagent-facts H1を再引用」は、最終report H1にmini自体の詳細がない。既存logにはVerifiedのBash Onlyがmini-SWE-agentへ揃える点だけある。今回H11ではこの点を再利用し、公開日・約100行・bash onlyは新たに一次資料を確認する必要がある。
- `ch7-knowledge.md` のDeepSeek節は一次/二次/未の予備調査。公式根拠の代用にはしない。特に四つのpreset、内部限定期間、88頁草稿、PTCを今後直接照合する。

### 留保・次の単位

- H1の世界初の用語/式使用者は確定できない。確認できた本人の使用日と直接の引用経路を報告し、優先権の断定はしない。これは調査不能な障害ではなく報告上の留保。
- OpenAIの行数・PR数は同社集計の方法や生データを独立検証していない。
- 次は **Unit 2（H2：LangChainの52.8→66.5、Meta-Harness、Self-Harnessのモデル・測定条件）**。H1引用候補の誤った語数カウントは上記で明示し、最終採用は短い8語の断片のみ。

## Plan revision 1

- 学んだこと：Böckelerの現行記事と2月メモは別の版で、式は3月のTrivedy記事へ遡る。mini-SWE-agentの詳細は先行reportでは確定していない。
- 計画変更：Unit 1内で版と帰属の照合を完了。Unit 11のmini-SWE-agent部分は「既存結果の再引用だけ」ではなく、不足する公開日・規模・tool構成を新規照合する。派生問い「式の世界初」は先行例を検索したが未確定として保留し、必要ならアーカイブによる優先権調査を次の対応に挙げる。
- 残り：Units 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12。質問の主題は変わっていない。
- Bossからtoken閾値の通知を受領。Unit 1を完全に記録したのでここでcheckpointを要求し、次turnはlogを読みUnit 2から続ける。reportはまだ作成しない。

## Unit 2: H2 同一モデルのharness変更と自己改善研究の測定条件

完了・資料取得日：2026-10-10 UTC。

### 読んだ一次資料

- Vivek Trivedy, **Improving Deep Agents with harness engineering**, LangChain, **2026-02-17**：<https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering>。本文のExperiment Setup、reasoning budget、結論を確認。
- Yoonho Lee, Roshen Nair, Qizheng Zhang, Kangwook Lee, Omar Khattab, Chelsea Finn, **Meta-Harness: End-to-End Optimization of Model Harnesses**：<https://arxiv.org/abs/2603.28052>、固定版 <https://arxiv.org/html/2603.28052v1>。初投稿 **2026-03-30 05:33:50 UTC**、取得時v1のみ。§3、§4、Table 2/6/7を確認。
- Hangfan Zhang et al., **Self-Harness: Harnesses That Improve Themselves**：<https://arxiv.org/abs/2606.09498>、固定版 <https://arxiv.org/html/2606.09498v3>。初投稿 **2026-06-08**、v2 **2026-08-12**、現行v3 **2026-08-20**。§3.4、§4.1–4.2、Table 1、Appendix Aを確認。v1 HTML <https://arxiv.org/html/2606.09498v1> も開いたが版差分の網羅的検証はしていない。以下はv3の値である。
- この単位ではリポジトリ実装は証拠に使っていないため、commit引用は不要。論文の版番号を固定する。

### 確認結果

**H2推奨判定：confirmed（値は一致。ただし測定条件を併記）。** 画面主文：「同じモデルでも、ハーネスを変えると成績が変わる」。三つの数値を同条件のランキングとして並べない。

**LangChain**：GPT-5.2-Codexを固定し、deepagents-cliのTerminal Bench 2.0が **52.8% → 66.5%（+13.7ポイント）**。89課題、Harbor/Daytonaを使用。同社の実験報告。変更はprompt・tool・middlewareのほか推論予算配分も含む。常時xhigh 53.9%、high 63.6%、最終はxhigh→high→xhigh。モデル重み固定と推論計算量固定は別。記事からは試行数・信頼区間・独立test splitを確定できない。画面には「LangChain報告、2026-02-17」を付ける。

**Meta-Harness**：過去候補のコード・score・実行traceをfilesystemに蓄積し、提案用coding agentが必要な部分を読む。提案者は **Claude Code + Opus 4.6**、対象モデルの重みは固定（§3）。Table 7：TerminalBench-2の **Haiku 4.5 = 37.6%**（比較Goose 35.5%、Terminus-KIRA 33.7%、Terminus 2 28.3%）、**Opus 4.6 = 76.4%**（Terminus-KIRA 74.7%、ForgeCode 81.8%）。順位は論文当時の著者記載で、10月の順位ではない。§4.3は探索と最終評価に **同じ89課題**を使うと明記。全般説明のtest非公開と混同しない。Table 2：分類平均40.9→48.6（ACE比+7.7ポイント）、追加context 50.8K→11.4K。Table 6：200題のIMO級問題、未使用の5モデルへ転用し、検索なし比で平均+4.7ポイント、3サンプル平均pass@1。すべて著者評価。

**Self-Harness**：同じモデルが失敗分析→変更提案→回帰検証を行い、重みを変えずharnessを更新する。Table 1のTerminal-Bench-2.0 **held-out**：

| 固定モデル | 初期→最終 pass rate | 全評価subsetでの初期→最終 |
|---|---:|---:|
| MiniMax M2.5 | 40.5%→61.9% | 42.2%→53.9% |
| Qwen3.5-35B-A3B | 23.8%→38.1% | 18.0%→36.7% |
| GLM-5 | 42.9%→57.1% | 46.1%→57.0% |

TB2全89題ではなく、外部資源不安定・非対応multimodal課題を除く **64題subset**。各候補原則2回評価、平均単一試行成功率。held-outのtraceを提案者に見せないが、その成績は変更採用gateに使う（§3.4、§4.1）。したがって「完全未使用testへの汎化を証明」とは言わない。画面文：「自身のハーネスを改良。MiniMax M2.5：40.5→61.9%（TB2の一部、著者のheld-out評価）」、脚注で採用gate使用を説明する。

### 留保・派生問い・次の単位

- 三例はいずれも原著者/開発元の報告であり、今回独立再現していない。値の一致と一般化の保証を分ける。
- 派生問い「held-outは完全に未使用のtestか」は元の『条件の確認』に必要なため本単位で追究・完了。Self-Harnessはtrace非公開と採否判定への使用を区別する。Meta-Harnessもcoding節は同一課題を探索に利用する。
- LangChainの反復回数/誤差、Self-HarnessのTB2分割ごとの課題数は読んだ本文から未確定。最終reportでは未確認値を補完しない。網羅的な再現性監査・版間の全変更比較は範囲外として保留。
- 次は **Unit 3：H3 ベンチマーク定義・2026-10独立成績・Verifiedの限界**。残りUnits 3–12。H2で見つけた条件差はUnit 12の横断監査でも保持する。
- token閾値通知を受け、この完了記録を保存したのでcheckpointを要求。reportはまだ作成しない。

## Unit 3: H3 ベンチマークの定義・独立成績・Verifiedの限界

完了・資料取得日：2026-10-10 UTC。

### 読んだ一次資料

- Vals AI, **SWE-bench Verified Leaderboard and Methodology**：<https://www.vals.ai/benchmarks/swebench>。冒頭のArchived Benchmark、更新日、順位表、Backgroundを確認。
- Vals AI, **Vals Index Leaderboard and Methodology**：<https://www.vals.ai/benchmarks/vals_index>。Updatesの2026-08-13と2026-09-25。
- OpenAI, **Why SWE-bench Verified no longer measures frontier coding capabilities**, **2026-02-23**：<https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/>。公式検索結果に提供された本文の監査・汚染・結論を確認。URLのslugと現在の見出しは異なる。
- SWE-bench公式一覧：<https://www.swebench.com/>（入口として参照）。
- **Terminal-Bench: Benchmarking Agents on Hard, Realistic Tasks in Command Line Interfaces**：<https://arxiv.org/abs/2601.11868>、固定版 <https://arxiv.org/html/2601.11868v1>。§3.1、§3.4、Appendix F。
- Terminal-Bench公式 **Terminal-Bench 2.1**：<https://www.tbench.ai/news/terminal-bench-2-1>。改訂内容と同じagent-modelの版間比較。`/docs/terminus`、`/docs/terminus-2`は取得エラーだったので根拠にせず、論文へ切替。
- Datacurve, **DeepSWE**：<https://deepswe.datacurve.ai/>。113課題、9月22日更新、作問方法、mini-swe-agentを使う説明。
- Huang et al., **DeepSWE: Measuring Frontier Coding Agents on Original, Long-Horizon Engineering Tasks**：<https://arxiv.org/abs/2607.07946>（2026-07-08初投稿）。
- `datacurve-ai/deep-swe` の **README.md**、commit **0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea**（2026-08-26）：<https://github.com/datacurve-ai/deep-swe/blob/0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea/README.md>。GitHub APIでHEADを解決し、同SHAのrawを読んだ。
- Li et al., **The Tool Decathlon: Benchmarking Language Agents for Diverse, Realistic, and Long-Horizon Task Execution**：<https://arxiv.org/abs/2510.25726>。原論文v1 2025-10-29、v2 2026-02-26。概要は32アプリ・604 tools・108課題。
- `hkust-nlp/Toolathlon` の **README.md**、commit **9be8d8fe07a497b18ee61e3f2ae694e9797f39eb**（2026-08-06）：<https://github.com/hkust-nlp/Toolathlon/blob/9be8d8fe07a497b18ee61e3f2ae694e9797f39eb/README.md>。GitHub APIでHEADを解決し、同SHAのrawを読んだ。
- 検索中に独立監査者の一次報告も発見：Samaritan Research, **DeepSWE v1.1 – Benchmark review**, 2026-09-07：<https://samaritan-research.org/benchmarks/deepswe/review>。検索結果で23/113課題のfalse negativeという監査者の主張を確認したのみ。事例の実装検証は今回していないため、欠陥率を本報告の確定値にはしない。

### 確認結果と画面文

**H3推奨判定：corrected。** 候補のVals数値は正しいが、日付と「default harness」の意味を訂正する。

**SWE-bench Verified**：画面文「実際のGitHub issueを修正し、テストで成否を判定する500課題」。Valsの独立評価は **Claude Opus 5 97.00%、DeepSeek V4 Pro 0813 96.40%、GPT-5.6 Sol 96.20%**。いずれも表示上 **Mini-SWE-agent**。同サイトはbash-onlyの最小harnessを使うと説明している。安全な日付表記は **『Vals AI、2026-09-01更新の保存結果／2026-10-10取得』**。10月の最新モデル全体の順位とはしない。同ページは飽和を理由に新モデルの評価を終了したArchived Benchmark。Vals Indexからは既に8月13日に除かれている。「第三者が測った」ことと「未知課題での実務能力を保証する」ことは別。

**Verifiedの限界**：OpenAIは2026-02-23に報告をやめる理由として、テストの不備と訓練時の問題・解答への接触の証拠を挙げた。**失敗が多かった138課題を監査し、その59.4%に重大な問題**。500問全体の59.4%ではない。調べたfrontier modelsに一部gold patch等の再現が見られたという同社分析。全問題が汚染済み、全モデルについて証明済み、と拡張しない。「飽和」はValsの判断、「汚染・採点不備」はOpenAIの分析として主体を付ける。OpenAIがSWE-bench Proを推奨したことは同記事時点の方針として記すが、Proに問題がないとの保証にはしない。

**Terminal-Bench 2.x**：画面文「端末環境で、実装・設定・データ処理などの作業を最後までやり遂げる」。2.0は **89課題**。**Terminus 2は主催者の比較用reference agent**で、headless terminal一つを通じてBash操作し、context要約も備える。全参加者が使う必須harnessではなく、Codex CLI・Claude Code等の結果もある。評価実行の基盤 **Harbor** とagent scaffold **Terminus 2**を分ける。2.1は同89課題のうち **28課題を修正**した版（公式現行release note）。2.0と2.1の数値を混ぜない。例として公式比較ではOpus 4.6 + Claude Codeが58.0→70.1%、モデルの変更がなくても課題の改訂で成績が変わる。2.xを『2026年10月時点の最新版』とはしない（Valsの9月25日記録では4.0へ移行済み）。

**DeepSWE**：画面文「新たに作った長いソフトウェア開発課題を、動作検証で採点する」。Datacurveの **113課題、91 repositories、5言語**。公開済み修正コミットをそのまま問題にする方式と異なる。公式leaderboardは **mini-swe-agent**に統一し、READMEではPierでModal上の評価を実行したと記す。v1.1はagentが作ったcommit差分を取り出し、別の新しい検証containerへ適用して採点する。「汚染ゼロを保証」「採点が常に正確」は書かない。同名のcoding modelとの混同を避け、**Datacurveのbenchmark**と明示する。

**Toolathlon-Verified**：画面文「複数の業務アプリの道具を使い、長い手順の仕事を完了する」。原Toolathlonは32アプリ・604 tools・108課題。**Verifiedは2026-06-30に公開**された、指示・正解・評価器を見直したfinal release。READMEは600以上のtoolsと説明。原論文の古いscoreをVerifiedの成績へ移さない。既定評価は1課題5400秒、1 turnの出力上限64K、reasoning effortを明示、temperature/top_pはprovider既定。この条件はDeepSeek自身のH6測定設定と同一とは限らない。

共通の安全な画面文：「成績はモデルと実行環境の組合せ。課題の版・ハーネス・推論設定・評価者をそろえて読む」。会社model cardは『開発元報告』、Vals/Artificial Analysis自身の実施結果は『第三者評価』。同じbenchmark名だけでは条件が同一とは言わない。

### 留保・次の単位

- Valsの各runのmini-swe-agent commit、反復回数、reasoning設定は今回の公開概要では確定していない。上位3者の僅差の統計的有意性は主張しない。
- DeepSWE/Toolathlonの内部採点の正しさを再実行で監査してはいない。原Toolathlonの108という数をVerifiedにも無条件に引き継がず、画面では数を省略できる。
- 次は **Unit 4：H4 DeepSeek Harnessの公開日・版・実装と構成**。残りUnits 4–12。
- token閾値通知に従い、完成したUnit 3を保存してcheckpointを要求する。reportはまだ書かない。

## Plan revision 2

- 学んだこと：Vals Verifiedは9月1日更新のアーカイブ、Terminus 2は比較用agentでありbenchmark全体の必須harnessではない。TB2.1の課題修正・DeepSWEの採点方式変更により、benchmarkの版も比較条件として不可欠。
- 派生問い「2026年10月の最新benchmarkは何か」は広すぎるため、元のH3に必要な『2.xを最新版と呼ばない』ことだけ本単位で追究・完了。4.0の網羅的調査は保留。
- 派生問い「DeepSWEの独立監査で指摘された欠陥は現行版に残るか」は実装再監査を要する。元の一行説明・帰属確認を超えるため保留し、必要なら推奨次行動に含める。最終reportでは無条件のcontamination-free/reliableという宣伝表現を採用しない。
- 残り計画：Unit 4 H4、5 H5、6 H6、7 H7、8 H8、9 H9、10 H10、11 H11–H12、12 横断監査。Unit 6ではbenchmarkの版・実行者の相違も照合する。主題の変更なし。

## Unit 4: H4 DeepSeek Harnessの公開時点・現行版・構成と記録

完了・資料取得日：2026-10-10 UTC。インストール・実行はせず、公式リポジトリの固定版と公開メタデータを読んだ。

### 出典と固定版

公式repo：<https://github.com/deepseek-ai/deepseek-harness>。以下のパスは `https://github.com/deepseek-ai/deepseek-harness/blob/<SHA>/<path>` で固定して引用する。

- **公開commit A = `47f943859bef60e4160492346772ded9b24f765a`**、2026-08-13 11:38:46 UTC。公式GitHub API <https://api.github.com/repos/deepseek-ai/deepseek-harness/commits/47f9438> のmessageは公開向けnpmリリースと `dsh@0.1.0-rc.5` を明示。<https://github.com/deepseek-ai/deepseek-harness/commit/47f943859bef60e4160492346772ded9b24f765a>。
- **現行調査commit B = `d743267388641bc76f17c45ce8b4c231aed1d32c`**、2026-10-09 09:31:32 UTC。APIのmaster解決・tags・releasesで一致を確認。<https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.2> は2026-10-09 11:09:26 UTC公開。
- A/B：`README.md`、`package.json`、`docs/architecture.md`、`docs/subsystems/sandbox.md`、`packages/client/ui-agent-preset/src/client/locales.ts`。
- A：`apps/cli/config/agent-presets/{standard,minimal,code,cordis}/agent.cordis.yml`、`apps/cli/config/agent-presets/{code,cordis}/preset.yml`。全presetの構成行とMinimal全文を確認。
- B：`LICENSE`、`packages/bundle/web-app/presets/{standard,minimal,ptc,cordis}.patch.yml`、`packages/bundle/web-app/cordis.patch.yml`、`packages/bundle/base/cordis.patch.yml`、`packages/bundle/sdk-minimal/README.md` と `cordis.patch.yml`、`packages/preset/agent-preset-registry/src/mount.ts`。
- B：`docs/subsystems/subagent.md`、`packages/subagent/subagent-codex/README.md`、`packages/subagent/subagent-claude-code/README.md`、`packages/shell/tool-bash-persistent/README.md`。
- npm公式registry：<https://registry.npmjs.org/@deepseek-ai%2fdsh>。dist-tagsと公開時刻を取得。取得時 `latest` / `next` は **0.2.0-rc.2**、`alpha` は **0.2.1-alpha.2**。package createdは8月10日だが、非公開/公開の切替時刻を意味しない。現在のtime一覧にrc.5がなく、初公開の証明にregistry createdを使わない。
- DeepSeek公式 **Change Log**：<https://api-docs.deepseek.com/updates/>、中国語 <https://api-docs.deepseek.com/zh-cn/updates/> の2026-07-31項。Harness minimalは「即将发布 / to be released soon」と記載。
- 二次記事 <https://moyi-api.com/blogs/deepseek-harness-agent-framework> の検索結果にはinternal until July 31という主張があるが、その日を一般公開日とする根拠には採用しない。一次資料へ遡って上記changelogを確認した。

### 判定・画面に使える文言

**H4推奨判定：corrected。** 主な訂正は版の混同、profileとpresetの混同、7月31日を公開日扱いする点。公式の4 presetは実在する。

1. **公開と版**：画面文「DeepSeek Harness、2026-08-13に開発者向けプレビューとして公開（MIT）」。Aの公開commit・package版0.1.0-rc.5とREADMEが根拠。Bもdeveloper previewで、GAとは書かない。READMEの短い引用は **“THERE WILL BE COMPATIBILITY-BREAKING CHANGES.”**。現行版を一つだけ書くなら区分が必要：**調査した最新alpha/ソースは0.2.1-alpha.2、npm既定latestは0.2.0-rc.2（2026-10-10取得）**。MITはプロジェクトLICENSE。依存・同梱物すべてがMITという意味ではない。

2. **プラグイン構造**：画面文「モデル接続、道具の登録、会話の記録、実行ループまで、交換できるプラグイン」。A/B `docs/architecture.md` はCordisがサービス・型付きイベント・元へ戻せる登録を提供すると説明する。READMEのEverything is a Pluginと、architectureの **“There is no privileged core to patch”** を確認。フレームワークや既定実装が存在しない、という主張ではなく、拡張・差替えの設計を表す。Cordis自体の来歴は次Unit 5へ。

3. **profileとpreset**：profileは起動時に束ねる実行環境。Bは **web / headless / sdk / sdk-minimal / acp** を配布テンプレートとして列挙。webはブラウザUI、headlessはサーバなしの一回実行、sdkはSDK向けJSON-RPC、acpは自動化用ACP server、sdk-minimalはbaseを継承しない明示的小構成。**Aの配布テンプレートはwebとheadlessだけ**。5種を公開当初の機能として書かない。会話ごとのagent presetとは階層が違う。

4. **四つのpresetは公式に実在**：Aの英語UIは **Standard mode / Minimal mode / Code mode / Creator mode**。同じCodeの中国語名はPTC模式、ディレクトリIDは`code`。Bでは英語も **PTC mode**、IDは`ptc`。CreatorのIDはA/Bとも`cordis`。安全な画面文「標準／最小／コードから道具を呼ぶPTC／プラグインを作るCreator」。単なる第三者の分類ではない。
   - **Standard**：shell、ファイル操作・検索、job、skill、goal、plan、圧縮、子agent、質問・todo・web等を組む。Bはschedule等も含む。すべての公開済みpluginを一律ロードするわけではない。
   - **Code/PTC**：基本的な作業能力をコード経由でまとめて呼び出せる提示方式。Aは`dsh-agent-tool-presentation`の`mode: code`、Bは`mode: ptc`。現行PTC patchではworkflow-ptc/tool-workflowがdisabledなので「Standardと全行同一で提示だけ違う」と厳密に断定せず、主要能力をコードから合成する説明に留める。
   - **Creator**：Standardに近い道具に`dsh-tool-cordis`と制作向けskill等を加え、プラグイン・UI・独自構成の制作を支援する。モデル重みの自己学習機能とは異なる。
   - **Minimalは版依存**：Aのファイルは明示的に **persistent bash + str_replace_editorの2 tools、固定persona、context compactionなし**。personaは **“You are a helpful software engineer assistant.”**。`complete: true` / `includeRuntimeContext: false`。この3点は公開時版を付ければconfirmed。
   - BのWeb Minimal preset自身は永続shellだけ（Linux/macOSはbash、Windowsはpwsh）、固定persona、圧縮pluginなし。web layerではbaseのcompaction-basic/command-compactを無効化して、Standard等のpresetが必要な圧縮を再導入する。Bのbaseにはglobalなworking_directory等もあり、MCPや追加pluginも構成できるため、「現行全アプリでモデルが絶対にshell一個しか見ない」とはしない。UIの説明とpreset自身の定義を区別する。
   - Bの **sdk-minimal** は別物。既定でshell（bash/pwsh）＋`working_directory`、圧縮・fs tools・skills・jobs・subagentsなし、非圧縮JSONL保存。MCPを設定すればtools等は増える。既定danger-full-accessであり、最小＝強いsandboxとは言わない。

5. **外部子agent**：Claude Code / Codexへ委任する公式providerがある。AのStandard内の`subagent_codex` / `subagent_claude_code`はdisabledで、存在と既定有効を区別する。Bではprofile bundleをPluginsから有効化する。一回の独立したnative session/threadで作業し、最終回答か安全な失敗診断を返す。親へ全思考・全tool履歴を共有する方式ではなく、現在の外部providerは継続対話用local childとも異なる。Codex側のmodel weightsやAPIがMIT公開されたことを意味しない。

6. **sandbox**：A/Bとも公式文書は **Linux bwrap/Landlock、macOS Seatbelt、Windows ACL restricted-token** を列挙。「LinuxはLandlockだけ」「Windowsは未対応」は不正確。ここでのmodeはファイルへの作用を制御し、network/process visibilityは範囲外。Windowsと古いLandlock ABIはpartial enforcementの場合がある。画面では「OS別の実行制限もプラグイン」とし、万能な隔離保証にしない。

7. **記録と再構成**：B `docs/architecture.md` の **“Model-visible means logged.”** を確認。modelへのrequestをログから再構成できることを設計契約とし、`deriveMessages()`がモデル向け履歴を投影する。append-onlyの論理SessionEvent logと、JSONL保存providerを区別する。現在はversion付き `session.vN.jsonl[.zstd]`（旧v0は`session.jsonl[.zstd]`）で、形式移行は旧世代を置換せず新世代を作る。「画面に流れた全中間chunkが即座に永続化される」「ログだけあれば同じ出力を必ず再現」は含意しない。現行文書はsettlement前のプロセス消失時にはdurable attempt streamが残らないとも明記。

8. **step / turn**：A/Bで一致。画面文「stepはモデルへの1回の要求と、それが呼ぶ道具。turnは入力を受けて処理が落ち着くまでのまとまり（0回以上のstep）」。最初の入力が拒否された場合等は0 stepでturnが閉じる。『turn＝LLMを1回呼ぶ』へ置換しない。

9. **7月31日の意味**：公式changelogは同日時点でもHarnessを **公開予定**と書く。安全な文は「7月31日のモデル評価で使用が明記され、8月13日に公開」。『7月31日まで社内限定で、その日に一般公開』は訂正。社外の限定beta参加者の有無・内部利用開始日は公開資料だけでは確定せず、文字通りのinternal-onlyを断定しない。モデルAPIのpublic betaとHarness公開を混ぜない。

### 留保と次の単位

- 実行して全構成のtool roster・sandbox動作・ログ復元を検証したわけではない。コード/設定/契約からの事実確認。現行Webに共通toolが加わることを踏まえ、Minimalの厳密な「2 tools」はAへ限定する。
- 8月13日の公開日・rc.5は公式公開commitから確認。GitHubの最初のRelease entry（取得した一覧ではrc.7）やnpm package createdとは区別する。
- 次は **Unit 5：H5 Cordisの論文・来歴・描ける具体例**。残りUnits 5–12。H6のベンチマーク測定時Minimalを、取得時のBへ勝手に置き換えない。
- token閾値通知に従い、この完成記録を保存してcheckpointを要求。reportはまだ作成しない。

## Plan revision 3

- 学んだこと：H4の候補は公開時と現行の構成を混ぜていた。profileは2→5、Minimalのtoolsは版によって変わり、npmのlatestとalphaも別。
- Unit 4内で「公開時と現行のどちらの構成か」を派生問いとして追究・完了。主題を変更せず、以後のH6/H7/H12では測定・説明対象の版を優先する。
- 追加の派生問い「現行の全profile・全追加plugin下でMinimalが実際に何toolsを見せるか」は網羅的実行検証になるため保留。必要なら固定した起動設定でtool schemaを取得する作業を次行動に挙げる。説明デッキでは公開時rc.5の明示的2-tool構成を使うことを推奨。
- 残り計画：Unit 5 H5、6 H6、7 H7、8 H8、9 H9、10 H10、11 H11–H12、12 横断監査。Unit 12でA/Bの引用を取り違えていないか確認する。

## Unit 5: H5 Cordis論文の版・定義・来歴と図示例

完了・取得日：2026-10-10 UTC。公式論文と固定commitの資料を読み、コードは実行していない。

### 出典

- Yifan Shi, Wei Zhang, Tianyi Cui, **A Programming Paradigm for Spatiotemporal Composability**：<https://arxiv.org/abs/2608.25512>、固定版PDF <https://arxiv.org/pdf/2608.25512v1>。初投稿 **2026-08-26 08:22:19 UTC**、取得時v1のみ、**92ページ**。表紙、abstract、§3の登録例、§5.3 Koishi、§6.1 System Boundary、§6.3を参照。HTML版は404だったためPDF本文へ切り替えた。
- 先行草稿repo `cordiverse/paper`：**commit `948a07b369c62adb3b12e102458be5c18dfb69b9`**（2026-08-13 10:39:32 UTC、upload paper）の `README.md` と `paper.pdf`。<https://github.com/cordiverse/paper/blob/948a07b369c62adb3b12e102458be5c18dfb69b9/README.md>、<https://github.com/cordiverse/paper/blob/948a07b369c62adb3b12e102458be5c18dfb69b9/paper.pdf>。公式GitHub APIの全5 commit履歴も確認。raw PDFを4MB上限でメモリ取得し、既存pdfinfoとpdftotext（表紙のみ）へ標準入力で渡した。**88ページ**を直接確認。ファイル保存・インストールはしていない。
- 現在のpaper repoは **`0d43a6f18004a7b5bf9662c31aa08c3712d232ec`**（2026-08-28）でarXivへの案内へ移行。8月26日の更新commitは `bb8b29ff8398d88123d7c948b8ed8c978e13a4c0`。初期commitと現行READMEを混同しない。
- `cordiverse/cordis` **commit `9f5e69062995a939f5c76b8d503a4421b80a0bf3`**（2026-10-09）：`packages/core/README.md` <https://github.com/cordiverse/cordis/blob/9f5e69062995a939f5c76b8d503a4421b80a0bf3/packages/core/README.md>。meta-frameworkという位置づけ、API未安定、公式文書へのリンクを確認。
- DeepSeek Harness **commit B `d743267388641bc76f17c45ce8b4c231aed1d32c`**：`docs/cordis-primer.md` <https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/docs/cordis-primer.md>。公式公開ページ <https://deepseek-harness.github.io/deepseek-harness/reference/cordis-primer> とtutorial概要も参照。
- Koishi公式 **History**：<https://koishi.chat/en-US/about/history>、**Updates**：<https://koishi.chat/en-US/about/releases>、**Service & Dependency**：<https://koishi.chat/en-US/guide/plugin/service>。旧公式v3文書：<https://koishi.js.org/v3/guide/context.html>。
- 作者shigmaによる **Koishi 4.7.5**公式release discussion、**2022-06-19**：<https://github.com/koishijs/koishi/discussions/727>。Cordisの機能追加と版更新が既に記録されている。これをDeepSeek Harness以前からの存在・Koishiとの関係の直接の根拠とする。
- 二次の草稿紹介は探索の手掛かりのみ。頁数・日付・著者所属は上記一次資料へ遡った。`cordis.js.org`はweb toolで取得不能だったが、公式repoから案内される現行文書で補完できた。

### 確認結果と画面に使える文言

**H5推奨判定：confirmed（草稿とarXivの版、可逆性の境界を明記）。**

1. **書誌・所属**：題名・著者は質問どおり。**Yifan Shi＝北京大学およびDeepSeek-AI、Wei Zhang＝北京大学、Tianyi Cui＝DeepSeek-AI**。3著者全員をDeepSeek所属としない。arXiv登録は8月26日。**8月13日付の88ページ草稿**はGitHubの固定commit内READMEとPDFで確認できた。8月26日のarXiv v1は92ページ。Git commit時刻単独では公開設定切替の履歴まで証明しないが、当日付の公開草稿として引用する根拠はある。査読受理・学会採録・製品GAを示すものではない。

2. **時間的合成可能性（temporal composability）**：画面文「プラグインを外すと、そのプラグインが登録したものも取り除ける」。論文では各context変換に逆操作を伴わせ、runtimeが保持する **revertible effects**で定式化する。後付けの『全部を元に戻す』ボタンではなく、登録時から解除方法を持つ設計。

3. **空間的合成可能性（spatial composability）**：画面文「必要なサービスが現れると動き、なくなると止まる」。依存を宣言し、contextの変化に応じて有効化・無効化を調整する **reactive coeffects**。地理的分散や並列GPU配置を指す語ではない。`inject`で必要なサービスを宣言するという公式primerの説明と一致。

4. **図にできる具体例**：一次資料にある登録・依存機構を次の二つの短い例として描ける。
   - 時間：プラグインAがイベントの聞き手を登録 → Aを外す → Aの聞き手だけが消え、Bの登録は残る。論文のevent listener/route registrationの例、公式primerの`ctx.on()`/`ctx.effect()`が根拠。『聞き手』が分かりにくければ、画面を「Aの道具を登録→Aを外す→Aの道具も一覧から消える」とする。これはprimerのtool schema登録の説明を図解したものと注記。
   - 空間：DBを必要とするプラグインが待機 → DBサービスを追加 → 起動 → DBサービスを外す → 停止。Koishi公式Service & Dependencyの `inject = ['database']` の例。提供側の差替え時は依存側が再起動する。異なるAPI版のコードを一つの実行可能snippetに混ぜず、図は概念図にする。

5. **由来**：安全な画面文「チャットボット基盤Koishiのプラグイン基盤として育ったCordisを、エージェントにも使う」。Koishi公式historyは開発開始2019年8月、v1公開2020年1月、v3でhot reload、v4でServiceを導入と記す。2022年の公式release noteに既にCordis更新がある。論文§5.3はKoishiをCordis上のchatbot application frameworkとし、KoishiはCordis v3、論文はv4を扱うと明記。したがって『2026年にDeepSeekがゼロから発明した』は不適切。独立repoへ抽出された正確な日付・最初のcommitは本単位では確定しておらず、画面で断定しない。

6. **可逆性の範囲**：論文§6.1は、排他的に変更でき以前の状態へ復元できる場所をsystem boundaryの内側とする。外部への送信等が自動で取り消されるとは主張していない。contextで管理された登録の解除と、送信済みメール・外部APIの作用の取り消しを混ぜない。§6.3も悪意あるpluginに対する言語内の制御とsandboxを区別。『どんなコード変更や副作用も安全に巻き戻せる』は画面に載せない。

### 留保・次の単位

- 本論文はpreprintで、形式証明の全検証・実装の正当性検証・実行再現は行っていない。Koishiの事例は著者自身が観察的事例であり比較実験ではないと限定する。生産性や性能の定量的改善をこの論文から付け足さない。
- 派生問い『Cordisの可逆性は外部の作用にも及ぶか』は誤解を防ぐため本単位で追究・完了。派生問い『Koishiから独立した正確な日付』は主題に不要なため保留。必要なら公式Git履歴から追跡する。
- 次は **Unit 6：H6 DeepSeek-V4-Pro-0813モデルカードの評価値・設定と第三者測定**。残りUnits 6–12。元の計画の主題・順序に変更なし。
- token閾値通知に従い、Unit 5の記録を保存してcheckpointを要求する。reportはまだ書かない。

## Unit 6: H6 DeepSeek-V4-Pro-0813のモデルカードと独立測定

完了・取得日：2026-10-10 UTC。モデルのダウンロード・実行はせず、モデルカードと評価機関自身の公開結果を確認。

### 出典

- DeepSeek公式HFモデルカード `deepseek-ai/DeepSeek-V4-Pro-0813`、**commit `72e1d3230f6c080a530b0a1d46f8eb4602340597`**、`README.md`：<https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813/blob/72e1d3230f6c080a530b0a1d46f8eb4602340597/README.md>。API <https://huggingface.co/api/models/deepseek-ai/DeepSeek-V4-Pro-0813> でSHAを解決（createdAt 2026-08-13 03:05:06 UTC、lastModified 2026-08-13 16:28:28 UTC）し、同SHAのraw全文を取得。Web表示とも表・脚注が一致。
- Vals AI公式モデルページ：<https://www.vals.ai/models/deepseek_deepseek-v4-pro-0813>。個別成績・共通hyperparameter欄を参照。
- Vals AI **SWE-bench Verified**：<https://www.vals.ai/benchmarks/swebench>。9月1日更新の保存結果、96.40% / Mini-SWE-agentを再確認。定義・飽和の評価はUnit 3を再利用。
- Vals AI **Terminal-Bench 2.1**：<https://www.vals.ai/benchmarks/terminal-bench-2-1>。**2026-09-28更新**のArchived Benchmark。順位表・Methodology・Daytona/time-limitの説明を参照。
- Vals AI **Terminal-Bench 4.0**：<https://www.vals.ai/benchmarks/terminal-bench-4>。Methodologyと2.1との比較。現在はmini-swe-agent、2.1はTerminus 2と明記。
- Vals AI **Vals Index**：<https://www.vals.ai/benchmarks/vals_index>。2026-09-25にv2.1へ更新。
- Artificial Analysis公式モデルページ：<https://artificialanalysis.ai/models/deepseek-v4-pro/>（見出しは **DeepSeek V4 Pro 0813 (Max)**）。Intelligence Index値・版・独立測定の説明を参照。`/models/deepseek-v4-pro-0813` は取得不能だったが、公式検索で上記canonical pageを特定できた。
- Artificial Analysis公式releaseページ：<https://artificialanalysis.ai/models/releases/deepseek-v4-pro>。MaxとNon-reasoningの別variantを確認。
- Artificial Analysis公式比較表：<https://artificialanalysis.ai/models/comparisons/deepseek-v4-pro-vs-trinity-large-thinking>。TB4.0の14%を確認。これはDeepSeek社のTB2.1値の追試ではない。
- 検索には転載・非公式guideも出たが数値の根拠に採用せず、上記公式モデルカード/測定機関のページへ遡った。

### 確認結果

**H6推奨判定：confirmed（DeepSeek自己報告と独立測定の条件を分ける）。**

1. **設定脚注**：モデルカードのNotes 1は「上記の公開ベンチマークのうち、コードエージェント課題」について、**DeepSeek Harnessのminimal mode、reasoning effort `max`、temperature 1.0、top_p 0.95**を使用したと明記。全ベンチマーク・全比較モデルに同一harnessを使ったとは書いていない。実行時のHarness commit/version、比較モデル側の全設定、反復回数・誤差範囲はこのカードから確定できない。Unit 4で確認したrc.5構成と整合するが、「この評価が厳密にrc.5で走った」は未確認なので断定しない。

2. **モデルカードの比較値（すべてDeepSeek掲載値）**：

| モデル表記 | Terminal Bench 2.1 | DeepSWE | Toolathlon-Verified |
|---|---:|---:|---:|
| DeepSeek-V4-Pro-0813 | 87.9 | 62.7 | 74.1 |
| DeepSeek-V4-Flash-0731 | 82.7 | 54.4 | 70.3 |
| DeepSeek-V4-Pro (Preview) | 72.1 | 12.8 | 55.9 |
| DeepSeek-V4-Flash (Preview) | 61.8 | 7.3 | 49.7 |
| GLM-5.2 | 81.0 | 46.2 | 59.9 |
| Kimi K3 | 88.3 | 67.5 | 76.5 |
| Opus-4.8 | 85.0 | 58.0 | 76.2 |
| Fable-5 (w/ fallback) | 88.0 | 70.0 | 77.9 |

安全な主文：「DeepSeek社の評価：TB2.1 87.9、DeepSWE 62.7、Toolathlon-Verified 74.1」。比較表を出す場合、Fableの**fallbackあり**を省略しない。モデルカードにはfallback先の詳細がない。DSBench-FullStack/Hardは社内test setで、公開ベンチマーク扱いしない。カードのofficial releaseはモデルのpreview終了を指し、DeepSeek HarnessのGAを示すものではない。

3. **独立測定との具体的対照**：ValsのTB2.1では同じ名前の **V4 Pro 0813 + Terminus 2 = 54.68%**。89課題、pass@1、Daytona上で時間制限を使うと同機関が説明。9月28日更新の保存結果であり、取得時点では新規評価を終えている。DeepSeekカードの **87.9**との差は確かに存在するが、実行環境・設定・harness等の条件差があるので「33.22ポイントすべてがharnessの因果効果」としない。画面向け：「TB2.1：DeepSeek報告87.9／Vals測定54.68。実行条件が違う」。脚注にDeepSeek Harness minimalとTerminus 2を明記する。

4. **Valsの他の独立結果**：SWE-bench Verified **96.40%（Mini-SWE-agent、2026-09-01更新）**。取得時のモデルページは **Vals Index 47.63% ±1.12（v2.1）**、**Terminal-Bench 4.0 14.14% ±2.02**。TB4.0はmini-swe-agentを用いるので、同機関のTB2.1とさえ課題/harnessが変わっている。モデルページの既定設定はprovider DeepSeek、temperature 1、top_p default、最大出力384,000、effort max。ただしベンチマークごとの例外があり得るとページ自身が留保する。旧Indexの52.37等を取得時の現行値と混ぜない。

5. **Artificial Analysis**：取得時、**V4 Pro 0813 (Max)のIntelligence Indexは36、Index v4.3.2**。同版はTB4.0等を含む10評価の合成指標。公式比較表は **TB4.0 14%**（丸め値）。この36は正答率36%ではなく、DeepSeekのTB2.1 87.9と同じ尺度でもない。ページの#9/117は同等サイズのopen-weight等のclass内順位であり、全モデル総合9位とはしない。8月のIndex値や旧Coding/Agentic Indexを今の値として流用しない。推奨画面文は数値を増やすより「第三者評価でも、課題・ハーネス・推論設定・測定日を読む」。

### 留保・派生問い・次の単位

- 確認したのは各発表者がその値・設定を公表している事実。生traceや実行環境による独立再現は今回していない。DeepSeekカードの三ベンチマークすべてを同条件で独立追試した証拠は得ていない。
- 派生問い「自己報告TB2.1と第三者TB2.1の差はすべてharness差か」は、H6の安全な対照説明に必要な範囲で追究し、**因果帰属は未確定**と結論。統制実験・trace比較は範囲外として保留し、必要なら次の対応に含める。
- 残りは **Unit 7 H7費用実験、8 H8 Codex platform、9 H9 app-server、10 H10 ACP、11 H11–H12最小構成とcode tools、12横断監査**。主題・順序の変更なし。次はUnit 7。
- token閾値通知に従い、Unit 6の完全な記録を保存したのでcheckpointを要求する。reportはまだ作成しない。

## Unit 7: H7 推論設定と費用実験の値・対象範囲

完了・取得日：2026-10-10 UTC。

### 出典

- Sarel Weinberger / Amir Hozez（両名PointFive）, **Prompt-Induced Waste in Coding Agents: Reasoning, Effort, Harness Design, and End-to-End Cost**：<https://arxiv.org/abs/2608.01347>。初投稿2026-08-02、v6は **2026-09-10 07:43 UTC**。
- 固定版 <https://arxiv.org/html/2608.01347v6> の§2、§6.1 **Table 3**、Appendix O（Setup / Arms and design / Activation gate / Comparative results / Scope）を確認。
- 論文が再現資料として挙げる <https://github.com/PointFiveLabs/prompt-efficiency-benchmark> はWeb取得・GitHub API `/repos/PointFiveLabs/prompt-efficiency-benchmark/commits/HEAD` とも404。実験コード・ledger・commitは確認できず。消失・非公開・URL誤記のどれかは未確定。これは論文の記載値を確認する妨げではないが、独立再現性の留保になる。
- Unit 4のDeepSeek構成の版差を再参照。今回の費用実験を公開時Minimalや現行全presetへ拡張しない。

### 確認結果

**H7推奨判定：confirmed（著者報告として。実験artifact未確認）。**

Table 3の平均請求額／1実行（USD）：

| arm | 費用 | baseline比 | 成功 |
|---|---:|---:|---:|
| baseline | 0.2753 | — | 15/15 |
| policy | 0.2114 | −23.2% | 15/15 |
| rewrite | 0.2109 | −23.4% | 15/15 |
| effort | 0.0696 | −74.7% | 15/15 |
| full | 0.0490 | −82.2% | 15/15 |

対象は **dsh 0.1.0rc7、unattended dsh-jsonrpc-agent構成、Claude Sonnet 5固定、5課題×5条件×3反復＝75実行**。Appendix OのTable 6は事前のactivation gateであり、費用比較表の番号ではない。

policyは効率方針をpersonaへ追加、rewriteは入力文の補正、effortは状況に応じた推論設定変更、fullは三つの併用。effortは一律lowではなくlow/medium/high、xhighをhighへ対応させ、介入しない場合は既定を維持。効果を足し算しない。

著者は通常requestの通信を調べ、**評価した構成が既定で強い推論を有効にしていた**と報告する。Anthropic APIへ互換経路で接続し、thinkingフィールド除去と出力上限調整のshimを挟む。DeepSeekモデルの測定ではない。独立に通信traceを再確認したわけでもない。

画面向け：「同じSonnet 5でも、推論設定の制御で費用が変わる。5課題の実験で平均請求額−74.7%（著者報告）」。補足にfull −82.2%、各条件15/15成功を置ける。いずれもdsh内のbaseline比。易しい成功率上限の課題で、難問で品質を保てる保証や、他harnessより82%安いという比較にはしない。

### 留保・次の単位

- 主張の確認と実験の独立検証を区別する。生データ・信頼区間・補正後の検定結果は未検証。論文もrewrite単独の効果を独立に確証された結果とは扱わない。
- 派生問い「公開artifactから数値を再集計できるか」はURLが404で未解決。原質問に必要な『論文の値と条件』は確認できたので調査を止めず、artifactの修正URL・固定commitの確認を次行動として保留する。
- 残り計画：**Unit 8 H8 Codex platform、9 H9 app-server、10 H10 ACP、11 H11–H12最小構成とcode tools、12横断監査**。次はUnit 8。最終reportはまだ作成しない。
- token閾値通知に従い、この完成Unitを保存したのでcheckpointを要求する。

## Unit 8: H8 Codexを組み込む三層・公開範囲・Relay

完了・取得日：2026-10-10 UTC。公式記事・文書と固定commitを照合。インストールやagent実行は行っていない。

### 出典

- Nicolas Bonamy / Derrick Choi, **Codex as a platform: build on the open agent harness**, **2026-08-19**：<https://developers.openai.com/blog/codex-as-a-platform>。公式Docs取得toolで本文、Webの同ページで署名・日付を確認。The reusable part、integration layers、Relay節を参照。
- OpenAI公式 **Open Source**：<https://developers.openai.com/codex/open-source>（現在 <https://learn.chatgpt.com/docs/open-source> へ転送）。公開部品の表を確認。
- Celia Chen, **Unlocking the Codex harness: how we built the App Server**, **2026-02-04**：<https://openai.com/index/unlocking-the-codex-harness/>。Inside the Codex harness、clients、Other ways、脚注を参照。
- **Unrolling the Codex agent loop**, **2026-01-23**：<https://openai.com/index/unrolling-the-codex-agent-loop/>。既存 `research/agent-facts/report.md` H1（行206付近）の確定結果と短い原文を再利用し、同じ内容の再調査はしない。
- `openai/codex`：GitHub API `/repos/openai/codex/commits/HEAD` で **commit `322bbf4d8486efd7dbbcf49598711a9e3fefc282`**（2026-10-10 02:54:59 UTC）を解決。以下を同SHAのrawで取得：
  - `README.md`：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/README.md>
  - `LICENSE`：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/LICENSE>。冒頭のApache 2.0表記を確認。
  - `sdk/typescript/README.md`：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/sdk/typescript/README.md>
  - `sdk/typescript/package.json`：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/sdk/typescript/package.json>。license Apache-2.0。
  - `codex-rs/app-server/Cargo.toml`：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server/Cargo.toml>。license.workspaceを参照。
  - `codex-rs/Cargo.toml`：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/Cargo.toml>。workspaceのlicense Apache-2.0。
  - `sdk/typescript/src/exec.ts`も取得したが、今回抽出した文字列に一致しなかったため実装詳細の追加証拠には用いない。SDKの説明はREADMEを根拠とする。
- Relayサンプルの公開コードを公式ドメイン・openai GitHubで探索したが、記事内に専用repoのリンクはなく、検索でも対応する公式repoは確認できなかった。同名の非公式repoや通信relayのコードは採用しない。
- ローカル `/home/apm/projects/codex-appserver` はファイル一覧のみ確認。これは本機の別プロジェクトなので、OpenAIの公開ライセンス・プロトコルの正本には使わない。

### 確認結果と画面文

**H8推奨判定：confirmed（記事日と公開範囲を区別）。**

1. **2026-08-19の記事**はBonamy/Choiの連名。主張は「再利用するのはモデルの周囲の実行系」。会話状態、道具、進行通知、sandboxと承認設定、継続処理をharnessが担い、app-serverが製品側から使う入口になる。短い引用候補は見出し **“The reusable part is the agent loop”**（8語）のみ。記事日をCLI/harnessの初公開日や新たなGA日としない。CLIの公開は先行調査で確認済みの2025-04-16。

2. **組込みの三層**（8月記事、SDK README、2月記事を相互照合）：

| 入口 | 画面に使える説明 | 境界 |
|---|---|---|
| `codex exec` | 「スクリプトやCIから、非対話の仕事を実行」 | 構造化出力を受け取り終了する用途。全ての仕事が自動的に時間・費用上限を持つという意味にはしない。 |
| Codex SDK | 「コードから仕事を開始・再開し、進行を読む」 | 固定commitのTypeScript SDKはCLIを子processとして動かし、stdin/stdoutのJSONLを扱う。`startThread` / `resumeThread` / `run` / `runStreamed` をREADMEで確認。Responses API SDKやAgents SDKと別。 |
| app-server | 「会話、進行、中断、承認を自分のアプリへ組み込む」 | 双方向のclient protocolでagentのlifecycleを扱う。UIや業務判断自体を提供する完成アプリではない。正確なメソッド・transportはUnit 9で固定commitから確認する。 |

三つは利用目的による入口の違いで、独立した三種類のモデルではない。SDKの`item.completed`等とapp-serverの`item/completed`を混ぜない。

3. **オープンソースの範囲**：Codex CLI / core harness / app-server / 公式TypeScript SDKは `openai/codex` 内にあり **Apache-2.0**。SDK packageとRust workspaceの指定も一致。公式一覧は **IDE extensionとCodex cloudをNot open source** と明記。モデルの重み・モデルアクセス・managed serviceが同じライセンスで公開されたという意味ではない。desktop app全体についても、共通harnessを使う事実だけから「全ソース公開」とは言わない。公開一覧には他のrepoもあるが、それらのライセンスまで一律Apache-2.0と拡張しない。

4. **Relay**：架空の配送ダッシュボードの例。アプリが選択した配送情報を与え、アプリ所有のMCP toolから状態を調べ、配送の予約変更には人の承認を求める。画面・業務記録・業務規則・操作と承認UIはアプリ側、agent loop・会話状態・進行通知・tool往復はharness側、という分担。safe画面文：「業務の画面と道具は自分のアプリに。エージェントの反復はCodexに」。**架空データのサンプル**であり、実物流での運用実績・性能測定ではない。専用公開repo/commit/ライセンスは確認できていないので「ダウンロード可能なOSS Relay」とは書かない。

5. **前の記事との関係**：2026-01-23は **Unrolling the Codex agent loop**。既存deckのagent (or harness)という引用はこの投稿であり、Unlockingの投稿日ではない。原文候補は **“our agent (or ‘harness’)”** の短い断片に限定し、全文は再引用しない。2026-02-04の **Unlocking the Codex harness** は **Celia Chen**。agentの中核を共有し、App Serverを双方向APIおよびcoreを保持する長寿命processとして説明する。短い引用候補 **“a client-friendly, bidirectional JSON-RPC API”**（脚注番号を除く6語）。2月記事の時点ではTUIのapp-server化は計画と書かれているため、導入済み一覧の証拠にはその図だけを使わない。

### 留保・派生問い・次の単位

- Relayの実装コードの公開有無は未確定。責任分担は公式記事の説明として確認済みなのでH8自体は完了。派生問い「Relayを実行可能なサンプルとして配れるか」は原質問の画面説明に不要なため保留し、実装着手時に配布元・ライセンスを確認する次行動にする。
- 2月記事脚注は厳密なJSON-RPC 2.0ではなく、`jsonrpc` headerを省いたJSON-RPC liteとする。現行WebSocket対応等と区別し、Unit 9でREADME・型を照合する。
- 残り計画：**Unit 9 H9 app-server、10 H10 ACP、11 H11–H12最小構成とcode tools、12横断監査**。主題の変更なし。次はUnit 9。同じCodex SHAを使えばH8/H9を一つのsnapshotで説明できる。
- token閾値通知に従い、この完全なUnit記録を保存してcheckpointを要求する。reportはまだ作成しない。

## Plan revision 2

- Unit 9で判明：指定された現行`codex-rs/app-server/README.md`は、基本protocolの通し説明ではなく個別機能の追補になっている。また現行公式guideの承認選択肢一覧は、固定commitの生成型にあるネットワーク規則変更の選択肢を省いている。
- 対応：Unit 9の資料群を、READMEに加えて公式app-server guide、同SHAのRust protocol定義・生成TypeScript・transport実装へ広げる。日付・版が異なる記述を混ぜず、正確なwire名は固定commitを優先する。この照合はUnit 9内で完了し、新しい独立unitは増やさない。
- 派生問い「guideと生成型の差をどう扱うか」は正確なプロトコル説明に必要なため追究。全APIの差分監査は範囲外として保留。
- 残りはUnits 9（本turnで完了）、10、11、12。元の問いの主題は変わっていない。

## Unit 9: H9 app-serverのtransport・通知名・承認応答と利用クライアント

完了・全資料取得日：2026-10-10 UTC。Unit 8と同じ **openai/codex commit `322bbf4d8486efd7dbbcf49598711a9e3fefc282`** に固定。資料閲覧のみ。サーバ起動やschema生成コマンドの実行はしていない。

### 出典

- 公式 **Codex App Server**：<https://learn.chatgpt.com/docs/app-server>（旧入口 <https://developers.openai.com/codex/app-server>）。OpenAI Docs検索後、本文を取得。Protocol、Message schema、Core primitives、Lifecycle、Approvals、remote terminal UI節を参照。
- Celia Chen, 2026-02-04 **Unlocking the Codex harness**：<https://openai.com/index/unlocking-the-codex-harness/>。Local Apps & IDEs / Codex Web / TUI節。Unit 8で確定した記事・日付を再利用し、利用clientの説明を追加確認。
- 2026-08-19 platform記事：<https://developers.openai.com/blog/codex-as-a-platform>。Unit 8の公開範囲とclientの説明を再参照。CLIがharnessを使うことと別processへのJSON-RPC接続を区別。
- 以下のパスを上記SHAのrawで取得（リンクは同SHAの固定blob）：
  - **README** `codex-rs/app-server/README.md`：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server/README.md>。39,700文字。冒頭はThread list exclusionsで、現在は個別機能の追補。基本概念の唯一の根拠として引用しない。
  - wire envelope `codex-rs/app-server-protocol/src/rpc.rs`：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/src/rpc.rs>。
  - 承認の原型 `codex-rs/app-server-protocol/src/protocol/v2/item.rs`：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/src/protocol/v2/item.rs>。
  - 生成型のルートは `codex-rs/app-server-protocol/schema/typescript/`。`ClientRequest.ts`、`ServerNotification.ts`、`ServerRequest.ts`を確認：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/ClientRequest.ts>、<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/ServerNotification.ts>、<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/ServerRequest.ts>。
  - 同生成型ルートの`v2/CommandExecutionApprovalDecision.ts`、`FileChangeApprovalDecision.ts`、`CommandExecutionRequestApprovalParams.ts`、`CommandExecutionRequestApprovalResponse.ts`、`FileChangeRequestApprovalResponse.ts`、`NetworkPolicyAmendment.ts`、`NetworkPolicyRuleAction.ts`、`TurnStatus.ts`。特にdecision型：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/v2/CommandExecutionApprovalDecision.ts>、<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/v2/FileChangeApprovalDecision.ts>。
  - transport本体 `codex-rs/app-server-transport/src/transport/mod.rs`、`stdio.rs`、`websocket.rs`：<https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-transport/src/transport/mod.rs>。`codex-rs/app-server/src/transport.rs`のre-exportから辿った。
- 旧配置と推測した`src/protocol/v2.rs`は404。APIで現在の分割配置を確認し、上の`v2/item.rs`へ切り替えた。存在しないパスを報告の根拠にしない。

### 確認結果

**H9推奨判定：corrected。** 基本メソッド名は合っている。JSON-RPCの省略field、WebSocketの成熟度、完全な承認選択肢を補足する。

1. **transport**：双方向JSON-RPC 2.0型の通信だが、wire上では **`"jsonrpc":"2.0"`を送らず要求もしない**。`rpc.rs`も厳密なJSON-RPC 2.0ではないと明記。安全な画面文：「JSON-RPC系の双方向通信。標準はstdioのJSONL」。既定は`--listen stdio://`で、1行1JSON。`--listen ws://IP:PORT`では1 text frameに1メッセージ。取得時guideはWebSocketとapp-server commandをexperimental / production非対応と説明しており、GAと断定しない。固定型には`UnixSocket`と`Off`も存在し、guideは`unix://` / `unix://PATH`をUnix socket上のWebSocket、`off`をlocal listenerなしとする。TCP WebSocketだけで全remote接続を説明しない。

2. **最小ライフサイクルとwire名**：接続ごとに`initialize` request→response→`initialized` notification。その後`thread/start`（新規）または`thread/resume`（再開）、必要なら`thread/fork`。`turn/start`で入力を渡し、`turn/steer`で進行中turnへ追加入力、`turn/interrupt`で中断要求。通知は`thread/started`、`turn/started`、`item/started`、`item/completed`、`turn/completed`。`turn/completed`はイベント名であり成功だけを意味しない。`TurnStatus`は`completed` / `interrupted` / `failed` / `inProgress`で、終了時statusを読む。

3. **三つの単位**：Thread＝会話の入れ物、Turn＝一つの依頼に続く一連の作業、Item＝入力・返答・コマンド・ファイル変更・tool呼出し等の単位。1 turnが1 model呼出しとは限らない。安全な図示：「会話 Thread → 依頼ごとの作業 Turn → メッセージや道具の操作 Item」。DeepSeekのstep/turn定義（Unit 4）を名前だけで同一視しない。

4. **代表的な増分・進行通知**（生成`ServerNotification.ts`で完全一致を確認）：
   - `item/agentMessage/delta`
   - `item/plan/delta`
   - `item/commandExecution/outputDelta`
   - `item/fileChange/outputDelta`、`item/fileChange/patchUpdated`
   - `item/reasoning/summaryTextDelta`、`item/reasoning/summaryPartAdded`、`item/reasoning/textDelta`
   - `item/mcpToolCall/progress`
   - `turn/diff/updated`、`turn/plan/updated`
   `item/*/delta`は概念的な略記で、全てがそのsuffixではない。TypeScript SDKの`item.completed`とも別名。reasoning系通知があっても全モデルの内部思考が必ず公開されるとは言わない。

5. **承認はserverからclientへのrequest**：`item/commandExecution/requestApproval`と`item/fileChange/requestApproval`。notificationと違って`id`があり、clientは同じ`id`で`result: {decision: ...}`を返す。対象のthread/turn/item識別子を保持する。
   - commandの文字列選択肢：`accept`、`acceptForSession`、`decline`、`cancel`。
   - commandのobject選択肢：`{"acceptWithExecpolicyAmendment":{"execpolicy_amendment":["cmd","..."]}}`、**`{"applyNetworkPolicyAmendment":{"network_policy_amendment":{"host":"example.com","action":"allow"}}}`**（actionは`allow`または`deny`）。後者は固定schemaにあり、guideの短いdecision一覧には載っていない。
   - file変更：`accept`、`acceptForSession`、`decline`、`cancel`の4つ。
   - `decline`＝その操作を拒否してturnを継続、`cancel`＝拒否しturnも中断。`acceptForSession`を機械全体への恒久許可と説明しない。Rustコメントではcommandのsession内cache、fileは同じfile群への今後の変更に関する承認。policy amendmentは別の選択肢。
   - guideは`serverRequest/resolved`で解決・清掃を通知し、最終`item/completed`を送る流れを説明。serverの承認設定によってはrequest自体が発生しないため、全操作で必ず承認UIが出るとはしない。
   - legacy `execCommandApproval` / `applyPatchApproval`もunionに残るが、新しいv2の説明と混在させない。`item/permissions/requestApproval`は別の権限要求。

6. **schema取得**：公式guideのコマンドは`codex app-server generate-ts --out ./schemas`および`codex app-server generate-json-schema --out ./schemas`。実行したCodex binaryの版に対応するため、実装時は使うbinaryから生成する。本調査は実行せず、repositoryの生成済み型を読んだ。guideには安定面と`experimentalApi` opt-inの区別があるが、これはapp-server全体のGA宣言とは別。

7. **first-party client**：公式記事で **VS Code拡張、Codex desktop app、Codex Webのcontainer内worker**が確認できる。Webブラウザ自身がstdioへ直接つながるという意味ではなく、当該記事ではbrowser→backendがHTTP/SSE、worker→app-serverがstdio。現行guideでは **CLIのremote terminal UI**が`codex --remote ...`でapp-serverへ接続できる。2月記事のTUI移行は当時まだ計画なので、「2月時点でCLIも全てJSON-RPC化済み」としない。通常CLIの全経路が別processのapp-serverを通るという断定も不要。JetBrains/Xcodeはpartnerで、OpenAI first-party一覧に含めない。

### 留保・次の単位

- official guideと固定生成型には細部の差がある。例えばguideが挙げる`availableDecisions`は読んだcommitの`CommandExecutionRequestApprovalParams.ts`にはなく、逆に固定型は`kind`・`startedAtMs`等を持つ。本報告はH9で要求されたmethod/notification/decision名を固定型に基づき確定し、全payloadの網羅表は作らない。
- 成熟度の表現には注意する。公式記事の「互換性を保つ設計」と、現在guideの「experimental・production非対応」は別の主張。画面はGAを掲げず、取得日と固定commitを明示する。実運用の契約・全機能互換性試験は範囲外。
- Unit 9は完了。次は **Unit 10：H10 ACPの開始日、標準化対象、採用とadapterの区別**。残りUnits 10、11、12。token閾値通知に従い完全な記録を保存し、ここでcheckpointを要求する。reportはまだ作成しない。

## Plan revision 4

- Unit 10で判明：Zedの旧Codex ACP repoは開発先を移し、現行adapterはCodex App Serverを起動してACPと相互変換する。DeepSeekのACP profileは汎用的な完全版エディタUIではなく、公式にautomation-onlyと位置づけられている。
- Unit 10の資料群を移転先adapter READMEとDeepSeek ACP package/bundleの固定commitへ広げ、この単位内で追究した。派生問い「ACPとapp-serverは同じものか」はH9/H10の接続を正確に説明するため追究・完了。全clientとagentの互換性行列・実行試験は範囲外として保留。
- 残り：Unit 10（以下で完了）、Unit 11 H11–H12、Unit 12横断監査。主題は変わっていない。なお過去のPlan revision見出しは追記順が1→3→2となっているが、既存ログを変更せず、以後は4から続ける。

## Unit 10: H10 ACPの公開日・通信の対象・採用とadapterの区別

完了・全資料取得日：2026-10-10 UTC。公開記事と固定commitのREADME/仕様を照合。インストール・サーバ起動・接続試験は行っていない。

### 出典

- Nathan Sobo, Zed, **Bring Your Own Agent to Zed — Featuring Gemini CLI**, **2025-08-27**：<https://zed.dev/blog/bring-your-own-agent-to-zed>。ACPを作りGoogleと協力してGemini CLIを初期reference implementationとした説明。
- Morgan Krey, Zed, **Claude Code: Now in Beta in Zed**, **2025-09-03**：<https://zed.dev/blog/claude-code-via-acp>。public beta、SDKを包むadapter、Apache licenseで公開という説明。
- Richard Feldman, Zed, **Codex is Live in Zed**, **2025-10-16**：<https://zed.dev/blog/codex-is-live-in-zed>。Zedでの提供開始と`codex-acp` adapter、agentごとに任意機能が異なる説明。
- ACP公式 **Introduction**：<https://agentclientprotocol.com/get-started/introduction>。旧`/overview/introduction`から転送。local/remoteの範囲、remote対応進行中、MCPのJSON表現を再利用する説明。
- ACP公式v1 **Overview**：<https://agentclientprotocol.com/protocol/v1/overview>。下記固定repo文書と照合。
- `agentclientprotocol/agent-client-protocol` **commit `44d93e13291498b4e78b6c96fea493f840eb6701`**（2026-10-10 00:53:42 UTC）：
  - `README.md`：<https://github.com/agentclientprotocol/agent-client-protocol/blob/44d93e13291498b4e78b6c96fea493f840eb6701/README.md>。
  - `docs/protocol/v1/overview.mdx`：<https://github.com/agentclientprotocol/agent-client-protocol/blob/44d93e13291498b4e78b6c96fea493f840eb6701/docs/protocol/v1/overview.mdx>。
  - `docs/protocol/v1/transports.mdx`：<https://github.com/agentclientprotocol/agent-client-protocol/blob/44d93e13291498b4e78b6c96fea493f840eb6701/docs/protocol/v1/transports.mdx>。
- `zed-industries/claude-agent-acp` **commit `96b6b4f478c5276b727c0a1d3cc3717da2d9e9ae`**（2026-10-09）：`README.md` <https://github.com/zed-industries/claude-agent-acp/blob/96b6b4f478c5276b727c0a1d3cc3717da2d9e9ae/README.md>。現行のClaude Agent SDK wrapperとしての説明を確認。
- 旧 `zed-industries/codex-acp` **commit `296069e841634cd4bb9bc4515602d836e49231ec`**（2026-07-22）：`README.md` <https://github.com/zed-industries/codex-acp/blob/296069e841634cd4bb9bc4515602d836e49231ec/README.md>。移転とApp Server利用を明記。
- 移転先 `agentclientprotocol/codex-acp` **commit `202e66e63343ec4f5a5e35ab590251d813d129ca`**（2026-10-10 03:15:35 UTC）：`README.md` <https://github.com/agentclientprotocol/codex-acp/blob/202e66e63343ec4f5a5e35ab590251d813d129ca/README.md>。ACP stdio server→Codex App Server、要求とイベントの相互変換。
- DeepSeek HarnessはUnit 4の **commit B `d743267388641bc76f17c45ce8b4c231aed1d32c`**を再利用：
  - `packages/acp/README.md`と`packages/acp/acp/README.md`：<https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/acp/acp/README.md>。
  - `packages/bundle/acp-app/README.md`：<https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/acp-app/README.md>。
  - `packages/bundle/acp-app/cordis.patch.yml`：<https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/acp-app/cordis.patch.yml>。
- 推測した`packages/bundle/acp/`は404。公式Git treeで`acp-app/`を確認して上記へ切替。検索の二次記事や非公式guideは根拠に採用しない。取得できた`packages/subagent/subagent-acp/README.md`は子agent clientの文書で、server文書と混ぜない。

### 確認結果と画面文

**H10推奨判定：confirmed（adapter経由と各実装の範囲を併記）。**

1. **開始日と主体**：ACPの公開発表は **2025-08-27**、ZedのNathan Soboの記事。Zedが作り、GoogleのGemini CLI teamと協力し、Gemini CLIを初期reference implementationとして統合。安全な画面文：「ACP：エディタとコーディングエージェントをつなぐ共通規約。ZedがGoogleのGemini CLIチームと協力して2025年8月に公開」。全参加企業が同時にnative実装を出した、標準化団体で正式認定された、とは言わない。

2. **通信の対象と版**：エディタ/IDE等のclientとcoding agent間で、依頼、進行通知、権限要求などをやり取りする **JSON-RPC 2.0**。localの基本はclientがagentを子processとして起動し、stdio上で改行区切りのUTF-8 JSONを送受信。固定READMEで現行stable protocolは **1**。crate/schema artifactの版番号はwire versionとは別。remoteも対象だが、v1 transport文書のStreamable HTTPは **draft proposal in progress**。introにHTTP/WebSocketの説明があっても「両方とも確定標準transportとして全面対応」としない。任意のcustom transportは許される。

3. **標準化する範囲**：初期化・能力交渉、`session/new`、`session/prompt`、`session/update`、`session/cancel`、`session/request_permission`等。`session/load`やfilesystem/terminalの操作等は任意能力。ツールの実装・モデルの重み・全UI体験を統一する仕様ではない。MCPとJSON表現の一部を共有するが、接続する両端の役割は異なる。Codex固有の`thread/start`等とも別。

4. **採用例**：

| 実装 | 根拠のある説明 | 日付・留保 |
|---|---|---|
| Gemini CLI | ACPの最初のreference integration。Zedがagentを子processとして起動 | 2025-08-27の公開記事。現在の全機能を当日版へ遡及させない。 |
| Claude Code / Claude Agent SDK | ZedがSDKを包むACP adapterを提供。現行READMEはClaude Agent SDK用と明記 | Zedのpublic beta発表2025-09-03。Anthropic本体のnative ACP採用と同一視しない。 |
| Codex | Zedで2025-10-16からACP adapter経由で提供。現行は`agentclientprotocol/codex-acp` | 現行adapterはCodex App Serverを起動し、ACP要求とCodexイベントを変換する。OpenAIのapp-server自体がACPである、とはしない。 |
| DeepSeek Harness | 公式`acp` profileがACP v1 stdio serverを提供 | Bで確認。公開当初Aには配布profileがweb/headlessしかなかった点はUnit 4参照。ACP profileの初公開日は本単位で確定していない。 |

5. **DeepSeekの重要な限定**：公式は **automation-only** とし、script controller / test runner / 別processの子agent向け。`dsh --profile acp`で起動し、base上にACP bridge、persona、既定`deepseek-official` / `deepseek-v4-flash`を載せる。serverはsession永続化・再開・model/effort選択・prompt/cancel・権限要求と標準semantic updatesを扱うが、DSH独自の表示card、plans、terminal views、elicitation、`session/load`によるtranscript replay等は含まない。`session/update`は確定した返答・thought・generic tool lifecycle・config/context情報を扱う。したがって「ACP profileがWeb UIの全表示をZedへ移す」とは書かない。

6. **H9とつなぐ図の推奨**：概念上は「ACP対応エディタ → ACP → Codex adapter → app-server → Codex harness」。これは現行adapter READMEを要約した構成図で、全ACP agentにapp-serverが必要という意味ではない。DeepSeekは自身のACP server、ClaudeはSDK wrapper、Geminiは初期reference integrationという違いを残す。

### 留保・次の単位

- 仕様・各実装のREADMEは相互接続を保証する実測ではない。clientのoptional capabilities、adapterのpreview/release差、認証・対応機能は実装時に固定版で検証する。stable ACP v1と各製品のGAは別の状態。
- 派生問い「DeepSeek ACP profileの初公開日」「各clientと全agent間の機能互換性」は原質問の採用有無には不要で保留。章で歴史年表を日単位にする場合や接続を実装する場合の次行動とする。
- Unit 10完了。次は **Unit 11：H11最小harnessの系譜、H12コードによるtool呼出し**。残りUnits 11、12。token閾値通知に従い、この完全な記録を保存してcheckpointを要求する。reportはまだ作成しない。

## Plan revision 5

- Unit 11で、mini-SWE-agentのv1.0.0は旧名micro-swe-agentで公開され、翌日に改名されたこと、現在のv2はnative tool callingが既定であることを確認した。『約100行』『bash only』『tool callingなし』を一括して現行版の特徴とする説明は不正確。
- Unit 11の資料群にGitHub release metadata、改名commit、PyPI公開時刻、v2 migration guideを追加し、この単位内で追究した。新しい独立unitは不要。
- 派生問い『DeepSeekが先行実装を直接継承したか』は、構成の類似と歴史的な前例を説明する範囲に留める。直接の作者証言やコード由来の完全な追跡は確認しておらず、因果的系譜の断定は保留する。
- 残りはUnit 11（以下で完了）とUnit 12横断監査。元の問いは変わっていない。

## Unit 11: H11 最小構成の前例とH12 コードによるツール呼出し

完了・全資料取得日：2026-10-10 UTC。一次記事・固定README・公開metadataを確認。インストールやagent実行はしていない。

### 出典

- Erik Schluntz, Anthropic, **Raising the bar on SWE-bench Verified with Claude 3.5 Sonnet**, **2025-01-06**：<https://www.anthropic.com/engineering/swe-bench-sonnet>。日付、Tool Using Agent、Edit Tool schema、Resultsを確認。
- Kenton Varda / Sunil Pai, Cloudflare, **Code Mode: the better way to use MCP**, **2025-09-26**：<https://blog.cloudflare.com/code-mode/>。冒頭、Converting MCP to TypeScript、Running code in a sandboxを確認。
- Anthropic, **Code execution with MCP: Building more efficient agents**, **2025-11-04**：<https://www.anthropic.com/engineering/code-execution-with-mcp>。Google Drive→Salesforce例、ツール定義の必要時読込と150,000→2,000の段落。
- Anthropic, **Introducing advanced tool use on the Claude Developer Platform**, **2025-11-24**：<https://www.anthropic.com/engineering/advanced-tool-use>。三つのbeta機能、Tool Search Tool、Programmatic Tool Calling、開始用beta headerの説明を確認。
- mini-SWE-agent現行固定commit **`04d809ceab9df28f9adaed044884180159172930`**（2026-09-03 05:05:59 UTC）：
  - `README.md`：<https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/README.md>。
  - `docs/advanced/v2_migration.md`：<https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/docs/advanced/v2_migration.md>。
- mini-SWE-agent **v1.0.0** release：<https://github.com/SWE-agent/mini-swe-agent/releases/tag/v1.0.0>、API <https://api.github.com/repos/SWE-agent/mini-swe-agent/releases/tags/v1.0.0>。`published_at` **2025-07-22 15:58:18 UTC**。同日のv1.0.0.rc1は02:27:35 UTC。
- v1.0.0のcommit **`a2b0efee5fd9c1d3bc9fdfc6fe88036a2235d74d`**、`README.md`：<https://github.com/SWE-agent/mini-swe-agent/blob/a2b0efee5fd9c1d3bc9fdfc6fe88036a2235d74d/README.md>。当時の名がmicro-swe-agentであること、100行の対象を確認。
- 改名commit **`3afab092127f3b85c778703246baefb8fff5567f`**（2025-07-23 17:55:02 UTC）、message `Rename to mini-swe-agent (#263)`、`README.md`：<https://github.com/SWE-agent/mini-swe-agent/blob/3afab092127f3b85c778703246baefb8fff5567f/README.md>。時刻はREADMEのcommit一覧APIから取得。詳細commit APIは応答を200KBで打ち切ったためJSON parseが失敗したが、必要なmetadataは一覧ですでに取得済み。無制限な再取得はせずraw READMEで改名を照合。
- PyPI公式metadata <https://pypi.org/pypi/mini-swe-agent/json>。現在残る最古ファイルは **1.1.0、2025-07-23 17:46:44 UTC**。GitHub公開日とは別。
- SWE-bench公式 **Verified**：<https://www.swebench.com/verified.html>。既存 `research/agent-facts/log.md` Unit 8（特に行530、561）のBash Only説明を再利用し、今回追加でv1/v2の注意書きを確認。既存 `research/agent-facts/report.md` H1はminimalの詳細の根拠ではないというUnit 1の判断を維持。
- DeepSeekはUnit 4で読んだ公開時A/現在Bのpresetを再利用。Bの `packages/bundle/web-app/presets/minimal.patch.yml` は再取得：<https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/web-app/presets/minimal.patch.yml>。Code/PTCの正式なmode値と名称はUnit 4の固定patchを根拠とする。

### H11 確認結果

**推奨判定：corrected（主要主張は確認。100行の範囲、公開/改名と版の区別を補う）。**

1. **Anthropic記事日は2025-01-06**。対象はupgraded / new Claude 3.5 Sonnetで **SWE-bench Verified 49%**、同社自己報告。最小scaffoldはprompt、**bash**、**str_replace_editor**の二つの汎用tool。Editのcommand enumは正確に **`view`, `create`, `str_replace`, `insert`, `undo_edit`**。toolの数は2で、editの5操作を独立した5 toolsと数えない。モデルが終了するか200k contextを超えるまで反復し、固定の作業順序を強制しない。ツール説明の改善や絶対pathの要求も設計の一部。記事日をモデルの初公開日としない。

2. **miniの公開日**：v1.0.0の公開は **2025-07-22（当時micro-swe-agent）**、現在名への改名commitとmini-swe-agent名でのPyPI配布は **2025-07-23**。safe画面表記：「mini-SWE-agent、2025年7月公開」。日単位で出すなら「7/22 v1.0.0公開、7/23 現在名へ」を脚注にする。repo作成日、初commit、PyPI現存最古ファイルを同じ『初公開』へ押し込まない。

3. **約100行の範囲**：公式は **agent classが約100行のPython**と説明し、environment・model接続・実行scriptは別。製品全体や全依存が100行ではない。主な設計はbashだけの道具、線形に追加する履歴、各actionを独立したsubprocessで実行。DeepSeekのpersistent shellと同じshell寿命ではない。

4. **現行v2の補足**：READMEの『tool-calling interfaceを必要としない』という説明は、v2の既定動作と区別する。固定migration guideは **v2がnative tool callingでbashを呼ぶことを既定**とし、文字列から正規表現でcommandを取り出す旧方式も選べると説明。『bash only』は能力の最小構成であり、『native tool callingを絶対に使わない』の同義語ではない。SWE-bench公式も1.xと2.xの成績は必ずしも比較できず、1.xのtemperature=0（対応モデルのみ）から2.xでは未指定へ変わると明記。

5. **Bash Onlyとの関係**：SWE-bench公式はモデル比較をしやすくするためmini-SWE-agentに揃えると説明。全leaderboardの全entryがminiという意味ではない。各結果にはrelease番号が付くので、単に『共通harness』だけで全世代が完全同条件とは言わない。

6. **DeepSeekへのつなぎ方**：画面では「小さい実行系の前例：Anthropicのbash＋編集、mini-SWE-agentのbash」と並べ、その後にDeepSeekのMinimalを置ける。公開時Aはbash＋編集、現在BのWeb Minimal自身はpersistent shell中心（Unit 4）。**直接のコード継承や発明者からの影響を確認した系譜図にはしない**。構成の比較・前例としての関連は支持されるが、作者の動機までは確定しない。

### H12 確認結果

**推奨判定：confirmed（数値は記事の例、製品の共通規格や普遍的削減率ではない）。**

1. **Cloudflare 2025-09-26**：MCP toolsをTypeScript APIとして提示し、モデルがそのAPIを呼ぶコードを書く。コードをsandboxで実行し、中間データの受渡し・複数呼出しをコード内で行って必要な結果をモデルへ返す。当該記事の実装はAPI定義全体をcontextに載せ、動的検索は将来改善と記す。したがって後の必要時読込の仕組みを初回実装に遡及させない。全モデル・全課題で性能向上を証明したという主張へ拡張しない。

2. **Anthropic 2025-11-04**：MCP serverをcode APIにし、filesystemを探索して必要な定義だけ読む例で **150,000→2,000 tokens、98.7%減**と記載。算術上は98.666…%の丸め。原文は時間・費用の節約にも言及するが、安全な画面文は **「必要なツール定義だけを読む例：150,000→2,000 tokens（98.7%減、Anthropic記事）」**。全仕事の請求額・wall-clock時間が同率減る実測値、複数課題の平均、MCP仕様自体の保証にはしない。中間データをコード内に保持し、必要な結果を返す仕組みも説明される。

3. **Anthropic 2025-11-24**：発表当日は三機能の **beta**。**Tool Search Tool**は必要な定義を検索してcontextへ載せる。**Programmatic Tool Calling**はPythonで複数のtoolを呼び、途中の結果を処理して返す情報を選ぶ。三つ目は **Tool Use Examples**。記事のbeta header `advanced-tool-use-2025-11-20`は公開記事日ではない。11/4の設計記事と11/24のAPI機能発表も別。現在の提供状態をこの歴史記事だけから断定しない。

4. **DeepSeek Code/PTCは公式**：公開時Aの英語名Code mode、中国語PTC模式、mode値`code`。現在Bの英語名PTC mode、ID/値`ptc`。公式presetの存在とコード経由のtool合成をUnit 4で確認済み。AnthropicのPTC APIと同一wire protocolや同一製品ではない。Cloudflare/Anthropic/DeepSeekは**コードで道具を組み合わせる設計を比較できる**が、同一実装・直接移植を裏付ける資料は確認していない。

### 未解決点・次の単位

- miniの最初の一般向け告知投稿・最初のrepo可視化時刻までは確定していない。releaseと改名の履歴を日付の根拠として示せば原質問には十分。細密な起源・直接的影響関係の調査は保留し、必要な場合の次行動へ残す。
- 98.7%のraw計測traceや統計的な一般性は本記事だけから検証できず、例として帰属を付ける。各社のCode/PTCを同条件で比較する実験は範囲外。
- Unit 11完了。残りは **Unit 12：H1–H12の横断監査（元質問との対応、欠落、版・日付・数値・引用量）**。token閾値通知に従い、ここで完全なUnit記録を保存してcheckpointを要求する。まだreportを作成しない。

## Unit 12: H1–H12 横断監査 — 元質問との対応、版・条件・出典・引用

完了・参照日：**2026-10-10 UTC**。元のH1–H12依頼と本log Units 1–11を再読し、各小問の回答・根拠・留保を照合した。この単位は保存済みの一次資料調査結果の監査であり、外部ページの再取得や実験の追試はしていない。

### 参照した資料と検算

- 元依頼：第9章「開いたハーネス」のH1–H12、出力先 `research/harness-facts`、日本語、各ID一行の判定表、一次URL・固定commit・取得日、既存調査の再利用という要件。
- `research/harness-facts/log.md` Units 1–11（本日記録・本日再読）。各一次URL、固定版、file path、取得日は該当Unitの出典欄を正本とする。今回再取得していないページへ新しい検証時刻を付けない。
- 既存報告の利用箇所はUnit 1/8/11で記録した `research/agent-facts/report.md` と `research/agent-facts/log.md`、およびUnit 1で記録した `research/llm-facts/report.md`。既存のCodex公開日と2026-01-23記事を再調査せず引き継ぐ。mini-SWE-agentの詳細は先行report H1にはないため、Unit 11の新規一次資料を使う。
- 小さなローカル検算：記録した17個の完全commitはすべて40桁。Units 1–11の連番を確認。DecimalでH7の表示費用から削減率を再計算し、policy 23.2%、rewrite 23.4%、effort 74.7%、full 82.2%と一致。H12の150,000→2,000は98.7%（小数1桁）と一致。これは算術確認であって元実験の再現ではない。

### 全項目の最終判定と必須の留保

| ID | 判定 | reportで落としてはいけない条件・訂正 | 根拠の単位 |
|---|---|---|---|
| H1 | corrected | Hashimotoは2026-02-05のMy AI Adoption Journey。OpenAI 02-11の約100万行・約1,500 PR等は自己報告。式はTrivedy 03-10を確認、Böckeler 04-02はそれへリンク。「世界初」は未確定。 | 1 |
| H2 | confirmed | LangChainはGPT-5.2-Codex固定でも推論予算配分を変更。Meta-Harnessのcoding探索は評価と同じ89課題。Self-Harness v3は64課題subsetでheld-out値も採用gateに使用。三例を同条件のランキングにしない。 | 2 |
| H3 | corrected | Vals Verifiedは09-01更新の保存結果で新規評価終了。Terminus 2はreference agentで必須ではない。TB2.0/2.1/4.0を混ぜない。DeepSWEはDatacurveのbenchmark。 | 3、6 |
| H4 | corrected | 08-13公開時A/rc.5と現行B/alphaを分離。npm latestは別。profileとpreset、Web Minimalとsdk-minimalを分離。07-31は公開予定との記載で、一般公開日ではない。 | 4、10、11 |
| H5 | confirmed | 08-13草稿88頁と08-26 arXiv v1の92頁は別。著者所属を個別に示す。可逆性はcontext内で管理した登録等の境界に限る。 | 5 |
| H6 | confirmed | 全表はDeepSeek掲載値。minimal/max/1.0/0.95脚注はコードエージェント課題に限定。87.9対54.68の差すべてをharness効果と帰属しない。AA Index 36は正答率36%ではない。 | 6 |
| H7 | confirmed | v6 Table 3、Sonnet 5固定、特定のdsh rc7 unattended構成、75実行の著者報告。各arm15/15成功の小規模課題。artifact URLは404で未検証。 | 7 |
| H8 | confirmed | 08-19のplatform記事は新規公開日ではない。exec/SDK/app-serverの入口を分離。公開core等はApache-2.0、IDE/cloudやモデル重みまで拡張しない。Relayは架空の例で専用公開repo未確認。 | 8 |
| H9 | corrected | jsonrpc fieldを省くJSON-RPC系通信。生成型を固定commitで引用し、guideとの差を保持。承認はserver request、通知ではない。WebSocket等のexperimental表記をGAへ変えない。 | 9 |
| H10 | confirmed | ACP公開は2025-08-27。エディタとagentの規約。Claude/Codexはadapter経由、Codexのadapterはapp-serverへ接続。DeepSeek ACPはautomation-only。 | 10 |
| H11 | corrected | Anthropicは2 tools、editの5 commands。miniはagent class約100行、v1公開07-22・翌日改名、現行v2はnative tool calling既定。DeepSeekへの直接の影響・継承は未証明。 | 11 |
| H12 | confirmed | Code Mode 2025-09-26、MCP code記事11-04、advanced tool use beta発表11-24を分離。98.7%は記事のtoken例。DeepSeek Code/PTCは公式だが各社同一仕様ではない。 | 11、4 |

- 集計：**confirmed 7件、corrected 5件**。複合項目全体をuncertainにする必要はないが、世界初、厳密な測定commit、因果効果、公開artifact等の個別不確実性は必ず残す。confirmedは記載の数値・条件・発表を一次資料で確認した判定であり、実験を独立再現した意味ではない。
- H3のOpenAI監査値59.4%は失敗が多い138課題の中の割合。500課題全体へ拡張しない。H6の第三者測定も版・harness・日付を必須にする。上位の僅差が統計的に有意とは主張しない。
- H4の短い「Minimal＝bash＋編集、固定persona、圧縮なし」は公開時Aに限定すれば使える。H6のmodel card評価がそのrc.5で実行されたという証明にはならない。H7のrc7構成の既定推論設定とも別物である。
- H8/H9は同一Codex SHA `322bbf4d8486efd7dbbcf49598711a9e3fefc282`。app-server READMEだけで説明できないため、生成型/Rust/transportのパスも引用する。H10のACP wire version 1とadapter製品の成熟度は別に扱う。

### 引用・報告形式の監査

- H1のHashimoto長文候補は採用しない。必要なら8語の断片のみ。OpenAI harness engineering記事の逐語引用はUnit 1の3断片、計18語へ限定し、他の説明は日本語要約とする。語数誤記を最終報告へ持ち込まない。
- 同一出典から表・本文に引用を重複掲載して上限を超えない。DeepSeekの標語・persona・警告は必要な短句だけとし、他は日本語にする。H8の3記事はそれぞれ短い引用だけ。数値の出所は引用文量を増やす代わりにリンクで追えるようにする。
- 本文の主表は**H1–H12を各一行**。大きな比較表（H6）、費用表（H7）、正確なwire名/承認応答（H9）は主表の下へ補足する。H4は公開時/現行の小表が有用。画面用の短い文と調査上の留保を同じ意味に保つ。
- protocol/repository引用では可変mainリンクだけにせず、固定commitと対象pathを必ず示す。全体に取得日2026-10-10を明記し、保存済みleaderboardの更新日は別記する。

### 未解決点・推奨する追加調査

- 用語や式の世界初、Cordis独立化の正確な日、miniの一般向け告知時刻、DeepSeek ACP初公開日：細密な歴史の主張が必要な場合のみarchive/Git履歴で追加確認。
- H7再現artifactの正しい公開先、H2の未公表反復・誤差、H6のrun設定/trace、DeepSWE監査の現行版への適用：結果を再利用して比較実験を行う場合の追加確認。今回の説明用fact-checkを止める条件ではない。
- 最小構成の実際のtool roster、sandbox動作、ACP/client互換性、app-serverの全payload差分：接続や運用を実装する段階で版と設定を固定して確認。今回コードは実行せず、モデルロード・課金・OS変更を行っていない。
- Relayの配布repoとlicense、各社Code/PTCやDeepSeekへの直接的な継承関係：実行サンプル配布や系譜の因果主張が必要なら追究。現段階は概念の比較と公式記事の範囲で説明可能。

### 完了境界

- **Unit 12完了。最新計画に対して全研究単位1–12が完了。** report.mdはこのturnでは作成しない。
- token閾値通知に従い、完全なUnit記録を保存してcheckpointを要求する。次は明示的な独立report turnで本logを読み、日本語report.mdを作成する。

## Plan revision 6

- 横断監査では新たな必須研究単位は生じなかった。元質問の主題は変わっていない。
- 追究した派生問いは、版・公開日の区別、held-outの採否利用、可逆性の境界、プロトコル文書と生成型の差、ACP adapterとapp-serverの接続、現行miniのtool calling。いずれも元の主張を正確にするため各Unit内で解決した。
- 歴史の絶対的な初出・完全な由来、実行による互換性と再現性の監査、harnessだけの因果効果、取得できなかったartifact/Relay repoはdeferredとして上記の次行動へ集約する。
- 最新の残作業は**明示的なreport turnでreport.mdを書くことだけ**。要約、各ID一行の主表、必要な補足、残る不確実性、問いと計画の変遷、推奨次行動を含める。
- Handoff: **ready to write report**。

## Report completion

- 完了時刻：2026-10-10 04:23:12 UTC。
- 明示的なreport turnで本logと元依頼を再読し、`report.md`を作成した。研究単位の追加・外部資料の再取得は行っていない。
- 内容：日本語の要約、H1–H12各一行の判定表、必要な詳細表と固定commit/path付き一次資料、未確定事項、派生問いの追究／保留、推奨する次の対応。confirmed 7件、corrected 5件。
- 検査：主表がH1からH12まで順に一行ずつあること、判定数、repositoryのblobリンクがすべて40桁commitに固定されていること、code fenceの対応を小さなローカル検査で確認。出力directoryの成果物は`log.md`と`report.md`だけ。既存logの内容は変更していない。
- 最新計画の残作業なし。report turnの契約に従いcheckpointは要求せず、doneを返す。
