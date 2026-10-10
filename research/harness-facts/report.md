# 「開いたハーネス」：H1–H12のファクトチェック

## 要約と判定方法

**12項目中、confirmed（確認）7件、corrected（訂正）5件。訂正はH1・H3・H4・H9・H11。** 各項目全体をuncertainとする必要はなかったが、用語の世界初、評価時の厳密な実行版、成績差の因果関係、入手できなかった実験資料には未確定部分が残る。confirmedは一次資料に記載された値・条件・発表を確認したという意味で、実験を独立再現した判定ではない。

章の中心に置ける説明は「モデルを動かす周囲のプログラムも、結果を左右する」。数値には課題の版、ハーネス、推論設定、評価者を添える。DeepSeek Harnessは公開当初と現行で構成が変わっており、Codex app-serverとACPも異なる接続規約である。

新規資料の取得日はすべて **2026-10-10 UTC**。調査開始は同日03:55:05 UTC。以下の「現行」はこの取得時点を指す。記事・論文の公開日、leaderboardの更新日とは区別した。[先行agent報告](../agent-facts/report.md)のCodex CLI公開日、2026-01-23のagent loop記事などと、[先行LLM報告](../llm-facts/report.md)の関連結果を再利用した。先行調査から引き継ぐ事項は同報告の取得日による。mini-SWE-agentの詳細は先行報告H1に十分な記載がなく、今回補った。

プロジェクトのコード、設定、デッキは変更していない。モデル実行、課金を伴う測定、接続試験は行っていない。資料ごとの確認箇所、取得できなかったURL、計画変更は[調査ログ](log.md)に記録した。

## 全項目の判定表

各IDにつき1行。画面では「画面に使える値・文言」を使い、版・条件は脚注や制作READMEへ残す。

| ID | Status | 画面に使える値・文言 | 一次資料 | 範囲・留保 |
|---|---|---|---|---|
| H1 | corrected | 「同じ誤りを繰り返さないよう、周囲の仕組みを直す。」Hashimoto **2026-02-05**。OpenAI事例 **2026-02-11**。式「Agent = Model + Harness」はTrivedy **2026-03-10**で確認。 | [Hashimoto](https://mitchellh.com/writing/my-ai-adoption-journey)、[Lopopolo](https://openai.com/index/harness-engineering/)、[Trivedy](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)、[Böckeler](https://martinfowler.com/articles/harness-engineering.html) | 式の世界初は未確定。Böckelerの現行記事は04-02、02-17は別の初期メモ。OpenAIの約100万行・約1,500 PRは同社報告。 |
| H2 | confirmed | 「同じモデルでも、ハーネスを変えると成績が変わる。」GPT-5.2-Codex **52.8→66.5%**。Meta-HarnessのHaiku 4.5 **37.6%**。Self-HarnessのMiniMax M2.5 **40.5→61.9%**。 | [LangChain、2026-02-17](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering)、[Meta-Harness v1](https://arxiv.org/html/2603.28052v1)、[Self-Harness v3](https://arxiv.org/html/2606.09498v3) | いずれも著者・開発元評価。推論予算や課題集合が異なる。Self-Harnessのheld-out成績も変更採用の判定に使う。 |
| H3 | corrected | 「成績はモデルと実行環境の組合せ。課題の版・ハーネス・推論設定・評価者を読む。」ValsのVerified保存結果：Opus 5 **97.00%**、V4 Pro 0813 **96.40%**、GPT-5.6 Sol **96.20%**。 | [Vals保存結果](https://www.vals.ai/benchmarks/swebench)、[OpenAIの監査](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)、[Terminal-Bench論文](https://arxiv.org/html/2601.11868v1)、[DeepSWE](https://deepswe.datacurve.ai/)、[Toolathlon固定README](https://github.com/hkust-nlp/Toolathlon/blob/9be8d8fe07a497b18ee61e3f2ae694e9797f39eb/README.md) | Valsは**09-01更新、10-10取得**。新規評価終了済みで、10月の全最新モデルの順位ではない。Terminus 2は比較用agentで、全参加者の必須harnessではない。 |
| H4 | corrected | 「DeepSeek Harness：**2026-08-13、MITで開発者向けプレビュー公開**。モデル接続、道具、記録、ループをプラグインで組む。」Standard／Minimal／Code・PTC／Creatorは公式。 | [公開commit A](https://github.com/deepseek-ai/deepseek-harness/commit/47f943859bef60e4160492346772ded9b24f765a)、[現行README B](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/README.md)、[構造 B](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/docs/architecture.md)、[公式更新履歴](https://api-docs.deepseek.com/updates/) | 公開時rc.5、調査した最新alphaは0.2.1-alpha.2、npm latestは0.2.0-rc.2。profileとpresetを分離。bash＋編集のMinimalは公開時A。07-31時点では公開予定。 |
| H5 | confirmed | 「Cordis：外したプラグインの登録を片付け、必要なサービスが現れたら動かす。」Shi・Zhang・CuiのarXiv初稿 **2026-08-26、92頁**。先行草稿 **08-13、88頁**。 | [論文v1](https://arxiv.org/pdf/2608.25512v1)、[先行草稿](https://github.com/cordiverse/paper/blob/948a07b369c62adb3b12e102458be5c18dfb69b9/paper.pdf)、[公式primer](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/docs/cordis-primer.md)、[Koishi 2022年の記録](https://github.com/koishijs/koishi/discussions/727) | Koishiのプラグイン基盤として以前から存在。可逆性は管理下の登録等に限られ、外部送信を自動で取り消す保証ではない。 |
| H6 | confirmed | 「DeepSeek社の評価：V4-Pro-0813はTB2.1 **87.9**、DeepSWE **62.7**、Toolathlon-Verified **74.1**。」コードエージェント課題の脚注はminimal／max／temperature 1.0／top_p 0.95。 | [固定モデルカード](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813/blob/72e1d3230f6c080a530b0a1d46f8eb4602340597/README.md)、[Vals TB2.1](https://www.vals.ai/benchmarks/terminal-bench-2-1)、[Artificial Analysis](https://artificialanalysis.ai/models/deepseek-v4-pro/) | 表はすべてDeepSeek掲載値。Valsの同名モデル＋Terminus 2は54.68%。差全体をharnessの因果効果にはできない。 |
| H7 | confirmed | 「同じSonnet 5でも、推論設定の制御で費用が変わる。5課題の実験で平均請求額**−74.7%**、施策併用で**−82.2%**（著者報告）。」 | [論文v6、Table 3・Appendix O](https://arxiv.org/html/2608.01347v6) | v6は2026-09-10。dsh 0.1.0rc7の特定構成、5課題×5条件×3反復。全条件15/15成功。再現artifactのURLは404で未検証。 |
| H8 | confirmed | 「Codexの実行系を、自分の製品へ組み込む。単発処理はexec、コードからの操作はSDK、対話アプリにはapp-server。」platform記事 **2026-08-19**。 | [Bonamy／Choiの記事](https://developers.openai.com/blog/codex-as-a-platform)、[公開範囲](https://developers.openai.com/codex/open-source)、[固定LICENSE](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/LICENSE)、[SDK README](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/sdk/typescript/README.md) | CLI・core・app-server・TypeScript SDKはApache-2.0。IDE拡張・cloud・モデル重みまでの公開を意味しない。Relayは架空の業務アプリ例。 |
| H9 | corrected | 「app-serverはJSON-RPC系の双方向通信。Threadに会話、Turnに一連の作業、Itemに発話や操作を持つ。標準はstdioのJSONL。」 | [公式guide](https://learn.chatgpt.com/docs/app-server)、[固定README](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server/README.md)、[wire定義](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/src/rpc.rs) | `jsonrpc` fieldを省く。承認はserver request。正確な名前・応答は補足。WebSocket等のexperimental表記をGAへ置き換えない。 |
| H10 | confirmed | 「ACP：エディタとコーディングエージェントをつなぐ共通規約。ZedがGoogleのGemini CLIチームと協力し、**2025-08-27**公開。」 | [Zed公開記事](https://zed.dev/blog/bring-your-own-agent-to-zed)、[ACP固定仕様](https://github.com/agentclientprotocol/agent-client-protocol/blob/44d93e13291498b4e78b6c96fea493f840eb6701/docs/protocol/v1/overview.mdx)、[Codex adapter](https://github.com/agentclientprotocol/codex-acp/blob/202e66e63343ec4f5a5e35ab590251d813d129ca/README.md) | JSON-RPC 2.0、基本はstdio。ClaudeとCodexはadapter経由。Codex adapterはapp-serverへ接続する。DeepSeekの公式acp profileはautomation-only。 |
| H11 | corrected | 「小さい実行系の前例：Anthropicはbash＋編集の2 toolsでVerified **49%**。mini-SWE-agentはbash中心、agent classが約100行。」 | [Anthropic、2025-01-06](https://www.anthropic.com/engineering/swe-bench-sonnet)、[mini v1.0.0](https://github.com/SWE-agent/mini-swe-agent/releases/tag/v1.0.0)、[現行README](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/README.md)、[Bash Only説明](https://www.swebench.com/verified.html) | miniは2025-07-22旧名でv1公開、07-23改名。全製品が100行ではない。現行v2はnative tool calling既定。DeepSeekへの直接継承は未証明。 |
| H12 | confirmed | 「道具を呼ぶコードを書き、途中の処理もコード内で行う。」Cloudflare **2025-09-26**、Anthropic MCP記事 **11-04**。定義の必要時読込の例は**150,000→2,000 tokens、98.7%減**。advanced tool useは**11-24 beta発表**。 | [Code Mode](https://blog.cloudflare.com/code-mode/)、[MCPとコード実行](https://www.anthropic.com/engineering/code-execution-with-mcp)、[advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use)、[DeepSeek公式PTC](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/web-app/presets/ptc.patch.yml) | 98.7%は記事のtoken例で、全タスクの費用削減率ではない。DeepSeek Code/PTCは公式だが、各社で同じ実装・通信仕様ではない。 |

## 必要な補足

### H1：用語、OpenAIの開発事例、引用

Hashimotoの記事名は **My AI Adoption Journey**。2026-02-05のStep 5でharness engineeringを使い、失敗を繰り返さないために指示や検証プログラムを改善すると説明する。本人も既存の呼称があれば従うと留保しているため、用語の発明者とは断定しない。[本人記事](https://mitchellh.com/writing/my-ai-adoption-journey)

Ryan LopopoloのOpenAI記事は **2026-02-11**。同社の社内beta開発について、2025年8月下旬の初commitから約5か月、約100万行、人が直接書いたコード0行、約1,500件のPR作成・merge、平均 **3.5 PR／engineer／day**を報告する。当初3人、記事時点で7人。行数にはアプリ以外の基盤・ツール・文書も含まれる。人は意図、優先順位、受入条件、結果の判断を担当した。独立測定や一般的な生産性保証ではなく、internal beta／外部alpha利用者の事例である。[OpenAI記事](https://openai.com/index/harness-engineering/)

同記事の教訓に対応する短い原文は次のとおり。引用は合計18語に限定し、説明は日本語で要約した。

| 教訓 | 正確な短い引用 | デッキ向けの説明 |
|---|---|---|
| AGENTS.mdは入口 | “map, not a 1,000-page instruction manual” | 約100行の案内から、詳しい正本へたどれるようにする。 |
| 規約を機械的に検査 | “inject remediation instructions into agent context” | linterや構造testが違反を検出し、エラーに直し方を含める。 |
| 失敗から環境を改善 | “what capability is missing” | 足りない道具、文書、制約を特定して環境へ加える。 |

式はVivek Trivedyの **The Anatomy of an Agent Harness（2026-03-10）**で確認した。Birgitta Böckelerの **Harness engineering for coding agent users（2026-04-02）**は式からこの記事へリンクしている。Böckelerの **2026-02-17**記事は初期メモで、現行全文記事の日付や式の初出日に使えない。署名もMartin Fowlerではない。確認できた引用経路を示し、世界初という優先権は保留する。[Trivedy](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)、[Böckeler現行記事](https://martinfowler.com/articles/harness-engineering.html)、[初期メモ](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering-memo.html)

### H2：モデル固定と、評価条件固定の違い

LangChainの2026-02-17報告はGPT-5.2-Codexを固定し、deepagents-cliのTerminal-Bench 2.0を **52.8→66.5%（+13.7ポイント）**に改善した。89課題、Harbor／Daytonaを使用。prompt・tool・middlewareに加え推論予算配分も変更しており、最終構成はxhigh→high→xhigh。常時xhighは53.9%、highは63.6%だった。モデル重みは固定でも計算量固定の比較ではない。試行数、信頼区間、独立test splitは記事から確定できなかった。[LangChain](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering)

**Meta-Harness**はYoonho Leeほか、初投稿 **2026-03-30**、ここではv1。提案者はClaude Code＋Opus 4.6で、過去候補のコード、score、traceをfilesystemから読む。対象モデルの重みを更新せず実行系を探索する。主な値は次のとおり。[論文v1、§3–4・Tables 2/6/7](https://arxiv.org/html/2603.28052v1)

| 対象 | 著者報告 | 読み方 |
|---|---|---|
| TerminalBench-2、Haiku 4.5 | **37.6%**。Goose 35.5、Terminus-KIRA 33.7、Terminus 2 28.3 | 探索と最終評価に同じ89課題を使用。 |
| TerminalBench-2、Opus 4.6 | **76.4%**。Terminus-KIRA 74.7、ForgeCode 81.8 | 論文時点の比較。10月の順位ではない。 |
| 分類 | ACE比で平均 **40.9→48.6**、追加context **50.8K→11.4K** | +7.7ポイント。coding scoreとは別。 |
| IMO級数学200題 | 未使用の5モデルへの転用で検索なし比 **平均+4.7ポイント** | 3サンプル平均pass@1。 |

**Self-Harness**は初投稿 **2026-06-08**、数値は **v3（2026-08-20）**のTable 1。モデル自身が失敗分析、変更提案、回帰検証を行う。TB2全89題から外部資源が不安定な課題や非対応multimodal課題を除いた **64題subset**で、各候補原則2回評価する。[論文v3](https://arxiv.org/html/2606.09498v3)

| 固定モデル | held-out：初期→最終 | 評価subset全体：初期→最終 |
|---|---:|---:|
| MiniMax M2.5 | 40.5%→61.9% | 42.2%→53.9% |
| Qwen3.5-35B-A3B | 23.8%→38.1% | 18.0%→36.7% |
| GLM-5 | 42.9%→57.1% | 46.1%→57.0% |

held-outのtraceは提案者へ見せないが、**その成績は変更採用の判定に使う**。完全に未使用のtestへの汎化を証明したとは言えない。三研究を一つのランキングへまとめると、課題集合と探索条件の差が隠れる。

### H3：ベンチマークの一行説明と限界

| 評価 | 画面用の説明 | 条件と一次資料 |
|---|---|---|
| SWE-bench Verified | 実際のGitHub issueを修正し、テストで成否を判定する500課題。 | Valsの上位3結果はMini-SWE-agent。09-01更新のアーカイブで新規評価終了。[Vals](https://www.vals.ai/benchmarks/swebench) |
| Terminal-Bench 2.x | 端末で実装・設定・データ処理などを最後までやり遂げる。 | 2.0は89題。Terminus 2は端末を使うreference agent、Harborは評価基盤。[論文v1](https://arxiv.org/html/2601.11868v1) |
| DeepSWE | 新たに作った長いソフトウェア開発課題を、動作検証で採点する。 | **Datacurveのbenchmark**。113題、91 repositories、5言語。同名のcoding modelと区別。[公式](https://deepswe.datacurve.ai/)、[論文](https://arxiv.org/abs/2607.07946) |
| Toolathlon-Verified | 複数の業務アプリの道具を使い、長い手順の仕事を完了する。 | 指示・正解・評価器を見直したfinal release、**2026-06-30**。原版は32アプリ・604 tools・108題。[固定README](https://github.com/hkust-nlp/Toolathlon/blob/9be8d8fe07a497b18ee61e3f2ae694e9797f39eb/README.md)、[原論文](https://arxiv.org/abs/2510.25726) |

Verifiedの飽和はVals自身の評価で、同社Indexからは2026-08-13に除外済み。OpenAIは2026-02-23、テスト不備と訓練時の問題・解答への接触を理由に報告をやめると説明した。**失敗が多かった138課題を監査し、その59.4%に重大な問題**を認めたという分析であり、500題全体の59.4%ではない。一部gold patch等の再現を根拠にしているが、全問題・全モデルが汚染済みとまでは言えない。[Vals更新履歴](https://www.vals.ai/benchmarks/vals_index)、[OpenAI分析](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)

TB2.1は同じ89題のうち28題を修正した版。公式比較では同じOpus 4.6＋Claude Codeでも2.0の58.0から2.1の70.1へ変わる。モデルやharnessだけでなく課題改訂でも数字は動く。2.xを10月の最新版と呼ばない。Valsは9月25日にTB4.0へ移行している。[TB2.1改訂](https://www.tbench.ai/news/terminal-bench-2-1)、[Vals更新](https://www.vals.ai/benchmarks/vals_index)

DeepSWE公式leaderboardはmini-swe-agentを使用。v1.1では生成commitの差分を新しい検証containerへ適用して採点する。[固定README `0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea`](https://github.com/datacurve-ai/deep-swe/blob/0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea/README.md)。Toolathlonの原版の課題数・成績をVerifiedへ無条件に移さない。同READMEの既定評価設定とDeepSeekカード独自の測定設定も別である。どちらも採点の完全性や汚染ゼロを保証する言葉は避ける。

### H4：DeepSeek Harnessの公開時と調査時を分ける

以下では固定commitを **A／B** と表記する。リンク先はすべてその版。取得日は2026-10-10。

| 区分 | 固定commit・版 | 確認した状態 |
|---|---|---|
| A：公開時 | `47f943859bef60e4160492346772ded9b24f765a`、2026-08-13、**0.1.0-rc.5** | 公開向けnpmリリースを記すcommitとREADME。developer preview。[commit](https://github.com/deepseek-ai/deepseek-harness/commit/47f943859bef60e4160492346772ded9b24f765a) |
| B：現行ソース／alpha | `d743267388641bc76f17c45ce8b4c231aed1d32c`、2026-10-09、**0.2.1-alpha.2** | developer preview継続。[Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.2)、[README.md](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/README.md) |
| npmの既定配布 | 取得時latest／next＝**0.2.0-rc.2**、alpha＝**0.2.1-alpha.2** | 「現在版」を書くときは配布channelを付ける。[registry](https://registry.npmjs.org/@deepseek-ai%2fdsh) |

READMEには **“Everything is a Plugin”**、互換性の注意 **“THERE WILL BE COMPATIBILITY-BREAKING CHANGES.”** がある。MITは[プロジェクトLICENSE B](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/LICENSE)の指定であり、すべての依存まで同じライセンスとは限らない。

`docs/architecture.md`の **“There is no privileged core to patch”** は、モデル接続・tool registry・session log・agent loopまで差し替え可能という設計を表す。Cordisはサービス、型付きイベント、解除できる登録を支える。フレームワークや既定実装が存在しないという意味ではない。[architecture B](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/docs/architecture.md)

**profileは起動時の実行環境、presetは会話ごとのagent構成。** Aの配布profileはweb／headless。Bは次の5種を列挙する。[README A](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/README.md)、[README B](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/README.md)

| Bのprofile | 用途 |
|---|---|
| web | ブラウザUI |
| headless | サーバなしの一回実行 |
| sdk | SDK向けJSON-RPC |
| sdk-minimal | baseを継承せず、明示した小構成でSDKから利用 |
| acp | 自動化用途のACP server |

公式presetの英語UI名はAでStandard／Minimal／Code／Creator。AのCodeの中国語名はPTCで、Bは英語もPTC、IDも`code`から`ptc`へ変わる。CreatorのIDは`cordis`。[UI定義 A](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/client/ui-agent-preset/src/client/locales.ts)、[UI定義 B](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/client/ui-agent-preset/src/client/locales.ts)

| preset | 読んだ構成と説明 |
|---|---|
| Standard | shell、ファイル操作・検索、job、skill、goal、plan、圧縮、子agent、質問等を組む。Bにはschedule等もある。[A `standard/agent.cordis.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/apps/cli/config/agent-presets/standard/agent.cordis.yml)、[B `standard.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/web-app/presets/standard.patch.yml) |
| Minimal A | **persistent bash＋str_replace_editorの2 tools**。固定personaは “You are a helpful software engineer assistant.”。`complete: true`、`includeRuntimeContext: false`、圧縮なし。[A `minimal/agent.cordis.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/apps/cli/config/agent-presets/minimal/agent.cordis.yml) |
| Minimal B | Web preset自身は永続shell中心（Linux/macOSはbash、Windowsはpwsh）、固定persona、圧縮pluginなし。共通層やMCPの追加分があり得るので「全構成で必ず1 tool」とはしない。[B `minimal.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/web-app/presets/minimal.patch.yml)、[Web共通構成](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/web-app/cordis.patch.yml) |
| Code／PTC | 主要な作業能力をコードから合成する提示方式。Aのmodeは`code`、Bは`ptc`。Bには無効化されたworkflow項目もあり、Standardと全設定同一とは断定しない。[A `code/agent.cordis.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/apps/cli/config/agent-presets/code/agent.cordis.yml)、[B `ptc.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/web-app/presets/ptc.patch.yml) |
| Creator | Standardに近い能力へ`dsh-tool-cordis`や制作向けskillを加え、プラグイン・UI・構成の制作を支援。モデル重みを学習する機能ではない。[B `cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/web-app/presets/cordis.patch.yml) |

`sdk-minimal`はWeb Minimalと別物。既定はshell＋`working_directory`、圧縮・fs tools・skills・jobs・subagentsなしで、非圧縮JSONL保存。MCPを設定すれば道具は増える。既定はdanger-full-accessであり、「最小だから強い隔離」とは説明できない。[B `packages/bundle/sdk-minimal/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/sdk-minimal/README.md)

Claude Code／Codexへ委任する公式providerも存在する。AのStandardでは両providerがdisabled、Bではprofile bundleを有効化して使う。独立したnative session／threadから最終結果または失敗診断を返す方式で、親子が全履歴を共有するとは限らない。[B `docs/subsystems/subagent.md`](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/docs/subsystems/subagent.md)、[Codex provider](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/subagent/subagent-codex/README.md)、[Claude Code provider](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/subagent/subagent-claude-code/README.md)

sandbox文書はLinuxのbwrap／Landlock、macOSのSeatbelt、WindowsのACL restricted-tokenを列挙する。主にfilesystemへの作用を制御し、networkやprocess visibilityはこのmodeの範囲外。Windowsや古いLandlock ABIでは部分的な強制の場合がある。資料に記載された設計であり、本調査で各OSの動作を試した結果ではない。[B `docs/subsystems/sandbox.md`](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/docs/subsystems/sandbox.md)

記録の契約は **“Model-visible means logged.”**。`deriveMessages()`がappend-onlyな論理SessionEvent logからモデル向け履歴を組む。JSONLは保存providerで、Bは`session.vN.jsonl[.zstd]`、旧v0は`session.jsonl[.zstd]`。移行は新しい世代を作る。すべてのstream chunkの即時永続化や、同じモデル出力の再現を保証する文ではない。settlement前のprocess消失ではdurable attempt streamが残らない場合も文書化されている。[architecture B](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/docs/architecture.md)

同文書で**stepはモデルへの1要求とその道具、turnは入力を受けて処理が落ち着くまでのまとまり**。turnは0回以上のstepを含み得る。2026-07-31の公式更新履歴はHarnessを公開予定と説明しているため、安全な年表は「7月31日のモデル評価に使用が記載、8月13日公開」。内部利用開始日や限定社外提供の有無は未確定である。[公式更新履歴](https://api-docs.deepseek.com/updates/)

### H5：Cordisの論文、来歴、図にできる例

論文は **Yifan Shi、Wei Zhang、Tianyi Cui, A Programming Paradigm for Spatiotemporal Composability**。所属はShi＝北京大学・DeepSeek-AI、Zhang＝北京大学、Cui＝DeepSeek-AI。arXiv v1は2026-08-26、92頁。8月13日付の88頁草稿は`cordiverse/paper`のcommit **`948a07b369c62adb3b12e102458be5c18dfb69b9`**のPDFで確認した。草稿のGit履歴と一般公開設定の切替時刻までは同義ではない。[論文v1](https://arxiv.org/pdf/2608.25512v1)、[草稿README](https://github.com/cordiverse/paper/blob/948a07b369c62adb3b12e102458be5c18dfb69b9/README.md)、[草稿PDF](https://github.com/cordiverse/paper/blob/948a07b369c62adb3b12e102458be5c18dfb69b9/paper.pdf)

| 概念 | 説明 | 描ける具体例 |
|---|---|---|
| temporal composability／revertible effects | 登録時から解除方法を持ち、contextの変更を戻せる。 | Aがイベントの聞き手を登録→Aを外す→Aの聞き手だけが消え、Bの登録は残る。 |
| spatial composability／reactive coeffects | 宣言した依存サービスの出現・消失に応じて有効化する。 | DB待ちのプラグイン→DB追加で起動→DBを外すと停止。提供側を差し替えると依存側を再起動。 |

前者は論文の登録例とprimerの`ctx.on()`／`ctx.effect()`、後者はKoishiの`inject = ['database']`に基づく。図では概念例として使い、異なるAPI版を混ぜた実行可能コードにはしない。[公式primer B](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/docs/cordis-primer.md)、[Koishi Service & Dependency](https://koishi.chat/en-US/guide/plugin/service)

論文§6.1の可逆性は、排他的に変更でき、以前の状態へ戻せるsystem boundary内の話である。外部へ送信したメールや任意のAPI作用まで取り消せる、という説明には使えない。preprintの形式・実装の正当性を本調査が全面検証したわけでもない。[論文v1](https://arxiv.org/pdf/2608.25512v1)

来歴は「チャットボット基盤Koishiのプラグイン基盤として育ったCordisをエージェントにも使う」が安全。Koishiは2019年8月開発開始、2020年1月v1、v3でhot reload、v4でServiceを導入。2022-06-19の公式release discussionには既にCordisの更新がある。論文はKoishi側Cordis v3と論文のv4を区別する。2026年にDeepSeekがゼロから発明したとは言えない。[Koishi History](https://koishi.chat/en-US/about/history)、[Koishi 4.7.5](https://github.com/koishijs/koishi/discussions/727)、[Cordis `packages/core/README.md`、`9f5e69062995a939f5c76b8d503a4421b80a0bf3`](https://github.com/cordiverse/cordis/blob/9f5e69062995a939f5c76b8d503a4421b80a0bf3/packages/core/README.md)

### H6：モデルカードの表と第三者評価

次表はすべて**DeepSeekが掲載した比較値**。正本はHF `README.md`、commit **`72e1d3230f6c080a530b0a1d46f8eb4602340597`**、取得2026-10-10。[固定モデルカード](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813/blob/72e1d3230f6c080a530b0a1d46f8eb4602340597/README.md)

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

設定脚注は「上記の公開ベンチマークのうちコードエージェント課題」に限定される。**DeepSeek Harness minimal、reasoning effort max、temperature 1.0、top_p 0.95**。全比較モデル・全評価を同一harnessで測ったとは書かれていない。実行時のHarness commit、全比較設定、反復数、誤差はカードだけでは確定しない。Fableのfallbackありを省略せず、社内のDSBenchは公開benchmarkに含めない。モデルのofficial releaseとHarnessのGAも別である。

| 第三者測定 | V4 Pro 0813の値 | 比較時の条件 |
|---|---:|---|
| Vals SWE-bench Verified | 96.40% | Mini-SWE-agent、09-01更新の保存結果。[結果](https://www.vals.ai/benchmarks/swebench) |
| Vals TB2.1 | 54.68% | Terminus 2、89課題、pass@1、Daytona・時間制限、09-28更新の保存結果。[結果と方法](https://www.vals.ai/benchmarks/terminal-bench-2-1) |
| Vals TB4.0 | 14.14% ±2.02 | mini-swe-agentへ変更。TB2.1と課題も異なる。[モデルページ](https://www.vals.ai/models/deepseek_deepseek-v4-pro-0813)、[方法](https://www.vals.ai/benchmarks/terminal-bench-4) |
| Vals Index v2.1 | 47.63% ±1.12 | 複数評価をまとめた指標。旧Index値と混ぜない。[モデルページ](https://www.vals.ai/models/deepseek_deepseek-v4-pro-0813) |
| Artificial Analysis Intelligence Index v4.3.2 | 36 | Max variant、10評価の合成指標。正答率36%ではない。[モデルページ](https://artificialanalysis.ai/models/deepseek-v4-pro/) |
| Artificial Analysis TB4.0 | 14% | 公式比較表の丸め値。DeepSeek社TB2.1の追試ではない。[比較表](https://artificialanalysis.ai/models/comparisons/deepseek-v4-pro-vs-trinity-large-thinking) |

TB2.1の **87.9対54.68**は対照として使えるが、33.22ポイント全体をharnessの因果効果とは呼べない。設定・時間制限・実行環境等も異なり得る。Valsモデルページの既定はtemperature 1、top_p default、effort max、最大出力384,000だが、評価ごとの例外があり得る。上位の僅差が統計的に有意とも主張しない。

### H7：費用実験の全条件

Sarel Weinberger／Amir Hozez（PointFive）、**Prompt-Induced Waste in Coding Agents: Reasoning, Effort, Harness Design, and End-to-End Cost**。初投稿2026-08-02、指定の **v6は2026-09-10**。費用比較は **§6.1 Table 3**、設定はAppendix O。AppendixのTable 6は事前のactivation gateで、費用表ではない。[論文v6](https://arxiv.org/html/2608.01347v6)

| 条件 | 平均請求額／1実行（USD） | baseline比 | 成功 |
|---|---:|---:|---:|
| baseline | 0.2753 | — | 15/15 |
| policy | 0.2114 | −23.2% | 15/15 |
| rewrite | 0.2109 | −23.4% | 15/15 |
| effort | 0.0696 | −74.7% | 15/15 |
| full | 0.0490 | −82.2% | 15/15 |

**dsh 0.1.0rc7、unattended dsh-jsonrpc-agent構成、Claude Sonnet 5固定、5課題×5条件×3反復＝75実行**。policyは効率方針の追加、rewriteは入力文の補正、effortは状況に応じた推論設定、fullは三つの併用。effortを一律lowへ落とした実験ではなく、low／medium／high等を使う。

著者は、評価した構成が既定で強い推論を有効にしたと通信から判断した。Anthropicへの互換経路とthinking field除去・出力上限調整のshimを使用しており、DeepSeekモデルの測定ではない。成功率が上限に達した5課題での結果を、難問でも同じ品質・削減率と一般化しない。fullの値は他harnessとの比較でもない。

論文が挙げる[再現資料URL](https://github.com/PointFiveLabs/prompt-efficiency-benchmark)はWeb／GitHub APIとも404。コード、ledger、固定commitによる独立再集計はできていない。生traceや統計検定は未検証で、rewrite単独の効果を確証済みとは扱わない。

### H8：Codexの三つの入口と公開範囲

**Codex as a platform: build on the open agent harness**はNicolas Bonamy／Derrick Choi、**2026-08-19**。記事の短い表現は **“The reusable part is the agent loop”**。これはplatformとしての説明記事の日付であり、CLI・harnessの初公開日やGA日ではない。CLIは先行調査で確認済みの2025-04-16公開。[platform記事](https://developers.openai.com/blog/codex-as-a-platform)、[CLI公開記事](https://openai.com/index/introducing-o3-and-o4-mini/)

| 入口 | 用途・境界 |
|---|---|
| `codex exec` | scriptやCIで非対話の仕事を実行し、構造化出力を受け取る。 |
| Codex SDK | コードからthreadを開始・再開し、進行を読む。固定版のTypeScript SDKはCLIを子processとして動かし、stdin/stdoutのJSONLを扱う。`startThread`／`resumeThread`／`run`／`runStreamed`。 |
| app-server | 会話、進行、中断、承認を独自アプリへ組み込む双方向client protocol。UIや業務判断はアプリ側で実装する。 |

SDKはResponses API SDKやAgents SDKと別である。SDKの`item.completed`とapp-serverの`item/completed`も同じ名前ではない。[固定SDK README](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/sdk/typescript/README.md)

以下はすべて `openai/codex` **`322bbf4d8486efd7dbbcf49598711a9e3fefc282`**、取得2026-10-10。CLI／core harness／app-server／TypeScript SDKはApache-2.0。[LICENSE](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/LICENSE)、[SDK package.json](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/sdk/typescript/package.json)、[app-server Cargo.toml](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server/Cargo.toml)、[workspace Cargo.toml](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/Cargo.toml)。[公式一覧](https://developers.openai.com/codex/open-source)はIDE extensionとCodex cloudを非公開とする。desktopアプリ全体の公開やモデル重み・managed serviceの公開を、coreのライセンスから推定しない。

**Relay**は架空の配送ダッシュボード例。アプリが画面、配送記録、業務規則、MCP tool、承認UIを持ち、Codexがagent loop、会話状態、進行通知、toolとの往復を担当する。実物流での運用実績ではない。専用の公式公開repoは確認できず、ダウンロード可能なOSSサンプルとは書けない。[platform記事](https://developers.openai.com/blog/codex-as-a-platform)

| 以前の記事 | 日付・要点 |
|---|---|
| **Unrolling the Codex agent loop** | **2026-01-23**。既存デッキの “our agent (or ‘harness’)” はこの記事。先行調査を再利用。[記事](https://openai.com/index/unrolling-the-codex-agent-loop/) |
| **Unlocking the Codex harness: how we built the App Server** | **2026-02-04、Celia Chen**。coreを保持する長寿命processと “a client-friendly, bidirectional JSON-RPC API” を説明。当時のTUI移行は計画として記載。[記事](https://openai.com/index/unlocking-the-codex-harness/) |

### H9：app-serverの正確なwire名と承認

根拠はH8と同じCodex SHA。`codex-rs/app-server/README.md`は取得版では個別機能の追補が中心のため、[固定README](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server/README.md)に加えて[公式guide](https://learn.chatgpt.com/docs/app-server)、[Rust wire定義](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/src/rpc.rs)、生成型を照合した。

通信はJSON-RPC 2.0型だが、**`"jsonrpc":"2.0"`を送らず要求もしない**。既定の`--listen stdio://`では1行1JSON。`--listen ws://IP:PORT`は1 text frameに1メッセージ。guideにはWebSocketとapp-server commandのexperimental／production非対応表記がある。`unix://`／`unix://PATH`はUnix socket上のWebSocket、`off`はlocal listenerなし。[transport実装 `codex-rs/app-server-transport/src/transport/mod.rs`](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-transport/src/transport/mod.rs)

**Thread＝会話、Turn＝依頼に続く一連の作業、Item＝入力・返答・コマンド・ファイル変更等。** 一つのTurnにモデル呼出しや道具の操作が複数あり得る。

| 区分 | 正確なmethod／notification名 |
|---|---|
| 接続初期化 | request `initialize` → response → notification `initialized` |
| 会話 | `thread/start`、`thread/resume`、`thread/fork` |
| 作業 | `turn/start`、`turn/steer`、`turn/interrupt` |
| 主な進行通知 | `thread/started`、`turn/started`、`item/started`、`item/completed`、`turn/completed` |
| 回答・計画の増分 | `item/agentMessage/delta`、`item/plan/delta` |
| コマンド・変更 | `item/commandExecution/outputDelta`、`item/fileChange/outputDelta`、`item/fileChange/patchUpdated` |
| reasoning関連 | `item/reasoning/summaryTextDelta`、`item/reasoning/summaryPartAdded`、`item/reasoning/textDelta` |
| その他の進行 | `item/mcpToolCall/progress`、`turn/diff/updated`、`turn/plan/updated` |

名前は`codex-rs/app-server-protocol/schema/typescript/`内の[ClientRequest.ts](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/ClientRequest.ts)、[ServerNotification.ts](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/ServerNotification.ts)による。`turn/completed`は成功だけを意味せずstatusを読む。[v2/TurnStatus.ts](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/v2/TurnStatus.ts)の値は`completed`／`interrupted`／`failed`／`inProgress`。reasoning通知の存在も全モデルの内部思考が必ず公開される意味ではない。

承認は通知ではなく、serverからclientへのID付きrequestである。clientは同じIDで`result: {decision: ...}`を返す。[ServerRequest.ts](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/ServerRequest.ts)

| request | 許容するdecision |
|---|---|
| `item/commandExecution/requestApproval` | `accept`、`acceptForSession`、`decline`、`cancel`、および下記2種のobject |
| `item/fileChange/requestApproval` | `accept`、`acceptForSession`、`decline`、`cancel` |

command承認のobject形式例：

```json
{"acceptWithExecpolicyAmendment":{"execpolicy_amendment":["cmd","..."]}}
```

```json
{"applyNetworkPolicyAmendment":{"network_policy_amendment":{"host":"example.com","action":"allow"}}}
```

networkのactionは`allow`または`deny`。この選択肢は固定生成型にあり、guideの短い一覧には載っていない。[v2/CommandExecutionApprovalDecision.ts](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/v2/CommandExecutionApprovalDecision.ts)、[v2/FileChangeApprovalDecision.ts](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/v2/FileChangeApprovalDecision.ts)、[v2/NetworkPolicyRuleAction.ts](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/v2/NetworkPolicyRuleAction.ts)

`decline`は操作を拒否してturn継続、`cancel`は拒否してturnも中断。`acceptForSession`を機械全体への恒久許可とは説明しない。commandはsession内の承認、fileは同じfile群の以後の変更に関する承認として扱われる。[Rust `protocol/v2/item.rs`](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/src/protocol/v2/item.rs)。legacyの`execCommandApproval`／`applyPatchApproval`や、別の`item/permissions/requestApproval`を上のv2説明へ混ぜない。設定によって承認requestが発生しない場合もある。

schema取得用の公式コマンドは次の二つ。本調査では実行せず、生成済み型を読んだ。実装時は使用するbinaryの版から生成する。

```sh
codex app-server generate-ts --out ./schemas
codex app-server generate-json-schema --out ./schemas
```

guideと固定型にはpayloadの細部にも差がある。例えばguideの`availableDecisions`は読んだcommitの[CommandExecutionRequestApprovalParams.ts](https://github.com/openai/codex/blob/322bbf4d8486efd7dbbcf49598711a9e3fefc282/codex-rs/app-server-protocol/schema/typescript/v2/CommandExecutionRequestApprovalParams.ts)にはない。全payloadが一致する保証はせず、上表は要求された名前の確認結果とする。

first-partyの利用例は**VS Code拡張、Codex desktop app、Codex Webのcontainer内worker**。2月の記事ではbrowser→backendがHTTP/SSE、worker→app-serverがstdio。現行guideではremote terminal UIも`codex --remote ...`で接続できる。2月時点の全CLI経路がapp-server化済みとは言えない。[2月の記事](https://openai.com/index/unlocking-the-codex-harness/)、[現行guide](https://learn.chatgpt.com/docs/app-server)

### H10：ACPと各agentの接続

ACPの公開発表は **2025-08-27、ZedのNathan Sobo**。Zedが作り、GoogleのGemini CLI teamと協力した。初期reference integrationはGemini CLI。[発表](https://zed.dev/blog/bring-your-own-agent-to-zed)

取得した仕様は `agentclientprotocol/agent-client-protocol` **`44d93e13291498b4e78b6c96fea493f840eb6701`**、取得2026-10-10。stable wire versionは**1**。エディタ等のclientとcoding agent間でJSON-RPC 2.0を使い、localの基本は子processのstdioに改行区切りのUTF-8 JSONを送る。v1 transport文書のStreamable HTTPは検討中のdraftであり、すべてのremote transportが確定標準ではない。[README.md](https://github.com/agentclientprotocol/agent-client-protocol/blob/44d93e13291498b4e78b6c96fea493f840eb6701/README.md)、[docs/protocol/v1/transports.mdx](https://github.com/agentclientprotocol/agent-client-protocol/blob/44d93e13291498b4e78b6c96fea493f840eb6701/docs/protocol/v1/transports.mdx)

初期化、能力交渉、`session/new`、`session/prompt`、`session/update`、`session/cancel`、`session/request_permission`等を標準化する。`session/load`やfilesystem／terminal操作等は任意能力。モデル重み、道具の実装、全UIを統一する仕様ではない。MCPとJSON表現の一部を共有しても、接続する両端の役割は異なる。[固定overview.mdx](https://github.com/agentclientprotocol/agent-client-protocol/blob/44d93e13291498b4e78b6c96fea493f840eb6701/docs/protocol/v1/overview.mdx)

| 採用例 | 根拠と範囲 |
|---|---|
| Gemini CLI | 2025-08-27の初期reference integration。[発表](https://zed.dev/blog/bring-your-own-agent-to-zed) |
| Claude Code／Claude Agent SDK | Zedのpublic betaは**2025-09-03**。SDKを包むadapterで、Anthropic本体のnative ACP実装という意味ではない。[発表](https://zed.dev/blog/claude-code-via-acp)、[`zed-industries/claude-agent-acp` README、`96b6b4f478c5276b727c0a1d3cc3717da2d9e9ae`](https://github.com/zed-industries/claude-agent-acp/blob/96b6b4f478c5276b727c0a1d3cc3717da2d9e9ae/README.md) |
| Codex | Zedで**2025-10-16**提供開始。現行adapterはCodex App Serverを起動し、ACPの要求・通知と相互変換。[発表](https://zed.dev/blog/codex-is-live-in-zed)、[`agentclientprotocol/codex-acp` README、`202e66e63343ec4f5a5e35ab590251d813d129ca`](https://github.com/agentclientprotocol/codex-acp/blob/202e66e63343ec4f5a5e35ab590251d813d129ca/README.md) |
| DeepSeek Harness | Bの公式acp profileがACP v1 stdio serverを提供。**automation-only**で、script controller／test runner／他processの子agent向け。[`packages/acp/acp/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/acp/acp/README.md)、[`packages/bundle/acp-app/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/bundle/acp-app/README.md) |

Codexの関係図は「ACP対応エディタ → ACP → Codex adapter → app-server → Codex harness」と描ける。すべてのACP agentがapp-serverを必要とするわけではない。旧Zed repoも移転先とApp Server利用を記している。[旧README、`296069e841634cd4bb9bc4515602d836e49231ec`](https://github.com/zed-industries/codex-acp/blob/296069e841634cd4bb9bc4515602d836e49231ec/README.md)

DeepSeekのACPはsession永続化・再開、model／effort選択、prompt／cancel、権限要求等を扱うが、DSH独自card・plan・terminal viewや`session/load`によるtranscript replay等を含まない。「Web UIをそのままエディタへ移す」とは言えない。ACP v1のstableと、各adapterや製品のGAも別である。

### H11–H12：小さい構成と、コードで道具を組み合わせる前例

Anthropicの **Raising the bar on SWE-bench Verified with Claude 3.5 Sonnet**はErik Schluntz、**2025-01-06**。更新版Sonnetによる49%は同社報告。最小scaffoldはpromptと**bash／str_replace_editorの2 tools**。編集toolのcommandは`view`、`create`、`str_replace`、`insert`、`undo_edit`の5操作で、tool数と混同しない。終了か200k context超過まで反復し、固定の作業順序を強制しない。この記事日をモデルの初公開日にはしない。[Anthropic記事](https://www.anthropic.com/engineering/swe-bench-sonnet)

mini-SWE-agentは**2025-07-22にv1.0.0公開、当時はmicro-swe-agent**。**07-23に現在名へ改名**し、mini-swe-agent名のPyPI現存最古配布も同日。画面は「2025年7月公開」が安全。[release](https://github.com/SWE-agent/mini-swe-agent/releases/tag/v1.0.0)、[v1 README、`a2b0efee5fd9c1d3bc9fdfc6fe88036a2235d74d`](https://github.com/SWE-agent/mini-swe-agent/blob/a2b0efee5fd9c1d3bc9fdfc6fe88036a2235d74d/README.md)、[改名README、`3afab092127f3b85c778703246baefb8fff5567f`](https://github.com/SWE-agent/mini-swe-agent/blob/3afab092127f3b85c778703246baefb8fff5567f/README.md)、[PyPI metadata](https://pypi.org/pypi/mini-swe-agent/json)

約100行なのは**Pythonのagent class**で、model接続・environment・実行script等は別。bash中心、線形に追加する履歴、各actionを独立subprocessで実行する設計で、DeepSeekのpersistent shellとは寿命が違う。現行README／migration guideは **`04d809ceab9df28f9adaed044884180159172930`**、取得2026-10-10。[README.md](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/README.md)

現行v2は**native tool callingでbashを呼ぶ方式が既定**。文字列からcommandを抽出する旧方式も選べる。bash onlyと、tool callingを使わないことは同義ではない。[`docs/advanced/v2_migration.md`](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/docs/advanced/v2_migration.md)。SWE-benchのBash Onlyはminiへ揃えるが、v1とv2でtemperature等が変わるため全世代の完全同条件を意味しない。[SWE-bench公式](https://www.swebench.com/verified.html)

これらはDeepSeek Minimalを説明する**構成上の前例**として並べられる。直接のコード継承・作者への影響を証明した系譜図にはしない。

| 公開日 | 一次資料 | 確認した内容と限定 |
|---|---|---|
| **2025-09-26** | Cloudflare、Kenton Varda／Sunil Pai、[Code Mode: the better way to use MCP](https://blog.cloudflare.com/code-mode/) | MCP toolsをTypeScript APIとして提示し、モデルがコードを書き、sandboxで実行する。中間処理をコード内に置ける。当初の記事実装はAPI定義全体をcontextへ載せ、動的検索は将来改善としていた。 |
| **2025-11-04** | Anthropic、[Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) | filesystemから必要な定義だけ読む例で**150,000→2,000 tokens、98.7%減**。全業務の費用・時間が同率減る平均実測ではない。 |
| **2025-11-24** | Anthropic、[Introducing advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use) | 発表時はbeta。Tool Search Toolは定義を必要時に検索、Programmatic Tool CallingはPythonで呼出し・中間処理、第三の機能はTool Use Examples。beta headerの11-20を記事日にしない。 |

DeepSeekのCode／PTCも公式presetである。Aのmode値`code`、Bの`ptc`はH4の固定ファイルで確認済み。各社の仕組みは「コードで道具を組み合わせる」という設計を比較できるが、同一wire protocol、同一製品、直接移植の証拠にはならない。

## 残る不確実性

- **歴史の絶対的な初出**：用語・式の世界初、Cordis独立化の日、miniの最初の一般告知・repo可視化時刻、DeepSeek ACPの初公開日は未確定。確認した記事・release・固定commitの日付を使えば今回の説明は可能。
- **実験条件と因果関係**：H2の未公表反復・誤差、H6の実行commit・全設定・traceは未確定。自己報告と第三者測定の差をharnessだけへ帰属できない。H7の公開artifactは404。
- **ベンチマークの採点品質**：DeepSWEへの独立監査報告も見つかったが、検索結果の確認にとどまり、指摘が現行版へどう当てはまるかは実装監査していない。欠陥率を本報告の確定値には採用しなかった。[監査者の報告](https://samaritan-research.org/benchmarks/deepswe/review)
- **実行時の挙動**：Minimalに追加pluginを組んだ際の全tool一覧、各OS sandbox、ACP互換性、app-serverの全payloadは実行検証していない。公式guideと生成型には差がある。
- **公開コードと系譜**：Relay専用repoの公開有無、DeepSeekと先行実装の直接継承は未確認。説明用の公式記事・設計比較と、配布可能な実装・因果的な由来を分ける。

## 問いと計画の変遷

元の問いは「第9章のH1–H12を一次資料で検証する」で、主題は変わっていない。初期の12研究単位を完了し、横断監査まで終えた。調査中は次の派生問いを、元の主張を正確にするために追究した。

| 派生問い | 決定と結果 |
|---|---|
| 記事日・初出・公開版は同じか | 追究。Böckelerの版、DeepSeek公開時A／現行B、Cordis草稿／arXiv、mini公開／改名を分離した。 |
| held-outは完全未使用か | 追究。Self-Harnessは採用判定に利用、Meta-Harnessのcoding探索は評価と同じ課題だった。 |
| 可逆性は外部作用にも及ぶか | 追究。Cordisの管理境界内の登録等に限る説明へ絞った。 |
| guideだけでwire名を確定できるか | 追究。app-serverは固定Rust定義・生成型・transportまで資料群を広げた。 |
| ACPとapp-serverは同じものか | 追究。現行Codex adapterが両者を変換することを確認した。 |
| bash onlyはtool callingなしを意味するか | 追究。mini v2の既定を調べ、能力構成と呼出し形式を分離した。 |
| 起源の完全追跡、全実装の互換性・再現性、harness単独の因果効果 | 保留。今回の説明用検証を超え、追加資料や実験が必要。 |

追加の必須研究単位は残っていない。ログの計画改訂見出しに番号の重複があるが、追記順を保持し、最終のPlan revision 6で全単位完了と保留事項を確定した。

## 推奨する次の対応

1. **制作へ反映する。** 主表の短文を使い、DeepSeekの2-tool図には「公開時rc.5」、数値には評価者・課題版・日付を添える。harness自己改善はモデル重みの学習と分け、架空データや概念図には「例」を付ける。
2. **図は境界を見せる。** Cordisは「登録→解除」と「依存の出現→起動」の2例、Codex／ACPはadapterを挟む接続図が使える。成績表では会社報告と第三者評価の条件を隣に置く。
3. **実装する段階で版を固定して検証する。** Codex binaryからschema生成、DeepSeekのprofile・preset・追加pluginから実際のtool一覧確認、ACPのoptional capabilities確認を行う。本報告のsnapshotを将来の互換性保証にはしない。
4. **比較実験や歴史の断定が必要になった場合だけ追加調査する。** H7 artifactの正しい公開先、H2／H6のrun設定とtrace、Relay配布元、初出のarchiveを確認する。新しい測定は今回の範囲に含めていない。
