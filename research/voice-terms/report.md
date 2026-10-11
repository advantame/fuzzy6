# fuzzy6 — 四国めたんの合成音声公開・クレジット・配信形式

確認日：**2026-10-11（UTC）**。以下のウェブ資料・ローカル資料はすべてこの日に取得・確認した。規約の取得日と施行日は区別する。対象は、ローカルの VOICEVOX Engine 0.25.2 CPU 版で制作時に合成する「四国めたん・ノーマル」の完成音声と長さ等の JSON を、公開リポジトリ `advantame/fuzzy6` と [GitHub Pages の公開版](https://advantame.github.io/fuzzy6/)へ置く制作である。

AGENTS.md を先に読み、プロジェクトは編集していない。合成、音声変換、ツール導入、公開操作、ブラウザ実機試験も行っていない。法的判断・個別の適合保証を代行する報告ではなく、原文で確認できる条件、制作上の推奨、未確定な解釈を分けて記す。取得経緯・資料一覧・計画変更の詳細は [log.md](log.md) にある。

## 要約

- 表示は **`VOICEVOX:四国めたん`** を採る。公式の音源規約にある表記例と同梱 policy に沿い、VOICEVOX の使用も示せる。紹介文では `音声合成: VOICEVOX:四国めたん` としてよい。アプリで容易に見つけられることが必須で、各デッキの rail 常設はそのための推奨手段である。
- 生成音声は商用・非商用とも利用でき、完成音声の Git/Pages 掲載を名指しで禁止する条文は見つからない。クレジット、音源の用途制限、他者へ利用を許諾する場合の条件継承が残る。**GitHub が投稿者に求める広いホスト許諾との両立は、原文だけで個別に確定できなかった。** 公開を無条件に許可、または一律に禁止する結論にはしない。
- 配信形式の第一候補は **mono Ogg Opus、VBR 40 kbps**。既存の `opusenc` で WAV から作れ、約 0.30 MB/分の目安になる。Safari/WebKit の Ogg 対応には OS 条件がある。旧端末も対象にするなら MP3 または AAC-LC/m4a、追加道具を使わない暫定代案なら WAV を用意する。
- fuzzy3 の制作時合成・完成音声と JSON の静的配信・固定原稿確認・Ogg 全復号の考え方は再利用できる。fuzzy4 の WAV Git 除外はツール事故対策だった。fuzzy6 の公開 CI は合成しないため、**配信用音声と manifest を履歴管理し、ビルド成果物に含める**必要がある。

上記の規約上の根拠は [VOICEVOX 利用規約](https://voicevox.hiroshiba.jp/term/)、[SSS LLC. 音源利用規約の共通規約と VOICEVOX 章](https://zunko.jp/con_ongen_kiyaku.html)、後述の Engine 同梱規約。互換性と容量の根拠は第4節に示す。

## 1. クレジットの文言と置く場所

### 原文で求められること

[VOICEVOX 利用規約](https://voicevox.hiroshiba.jp/term/) は次のように記す。

> ご利用の際は VOICEVOX を利用したことがわかるクレジット表記が必要です。

[四国めたんを含む音源規約](https://zunko.jp/con_ongen_kiyaku.html)の VOICEVOX 章の表記例は **`VOICEVOX:四国めたん`**。アプリの配置説明には「紹介画面など」「少し探せばわかる場所に」という文言がある。したがって、VOICEVOX 使用と話者が分かる文言を、アプリ利用者が容易に見つけられる場所へ置くことが要件である。

この対象規約には、全画面での常時表示、全クリップへの焼込み、スタイル名「ノーマル」、声優名、ロゴ、特定のファイル名 `LICENSE`／`NOTICE`、規約全文の同梱を要求する明文は見つからない。`VOICEVOX:四国めたん` の完全一致を validator で求める fuzzy3 の契約は、公式例を確実に使うためのプロジェクト方針でもある。文字サイズやクリック数についての具体的な基準は原文にない。

公式の [FAQ](https://voicevox.hiroshiba.jp/qa/) は、動画なら動画内や概要欄、電話等の音声だけの利用なら冒頭・末尾の音声クレジット、概要欄のない音楽配信なら補足ウェブページ等、機械の音声案内なら読み上げや周辺の表示、という媒体に応じた案内をしている。今回のアプリ構成ファイルすべてにクレジット音声を追加する義務までは読み取れない。将来、音声素材集・ポッドキャストなど単独の音声作品として提供するなら再検討する。

### fuzzy6 の配置案：必須条件と推奨手段

表の「必須」は機能上の条件であり、各行の場所すべてに重複表示する義務ではない。配置要件の根拠は上記 [音源規約](https://zunko.jp/con_ongen_kiyaku.html)。

| 場所 | 必須に関わる条件 | fuzzy6 での推奨 |
| --- | --- | --- |
| 各デッキの画面内 | アプリ利用者がクレジットを容易に見つけられること。画面内常設そのものは明文必須ではない | 音声を使うデッキの `voice.credit` を `VOICEVOX:四国めたん` とし、rail 末尾に表示。直リンクの訪問者にも届く |
| 目次、紹介、クレジット画面 | 明確な導線があれば「紹介画面など」に沿う配置候補 | 目次末尾または「音声・クレジット」画面に同文言と両規約リンク。rail 常設なら重複は任意 |
| トップページ | トップへの配置は名指し必須ではない | footer に同文言と両規約リンク。各デッキへ直接来る利用者がいるため、トップだけには任せない |
| root README、各デッキ README | ファイルへの記載自体は名指し必須ではない。README だけでサイト利用者に十分かは確定できない | clone/fork 利用者向けにクレジット、規約URL、確認日、完成音声だけを配布すること、二次利用方針を記す |
| LICENSE、NOTICE、音声近傍 README | 指定ファイル名・全文同梱は明文必須ではない。他者へ利用を許諾するときの遵守義務の継承は必須 | コードのライセンスと音声条件の範囲を明示。音声近傍 README または NOTICE に条件案内を置き、root README からリンクする |
| manifest JSON、ファイル内 metadata | JSON への記載は規約の指定ではない。JSON だけでは見つけやすい画面表示の代替にならない | 話者・style・credit・規約URL・確認日・生成環境・hash・作者の再利用方針を記録する |

fuzzy6 の仕様0.3と Unit 5 取得時点の実装では、`deck.credits` と `voice.credit` を重複排除して `.mx-credits` に加える rail 表示が既にある。LLM デッキには上記クレジットが設定されている。これはコード読取りによる確認で、公開版の可読性を確認した結果ではない。[仕様](../../docs/spec.md)、[chrome.js](../../src/explorer/chrome.js)、[LLM deck.js](../../decks/llm/deck.js)。

`clean` 表示では rail が隠れる。トップの無音 cover iframe は共通 footer で案内する案が適しているが、音付きの `clean` URL を独立共有するなら、その経路にもクレジットへの導線が必要になる。通常表示、デッキ直リンク、目次、縮小画面、音付き `clean` の各導線を制作時に確認する。Pages は `/fuzzy6/` 配下なので、自分で書くリンクも既存方針に合わせて相対パスにする。

### ウェブアプリでの実例と証拠の範囲

| 実例 | 確認できたこと | 留保 |
| --- | --- | --- |
| [ずんだもん推理室](https://zundamon-mystery-room.chita256.chatgpt.site/)／[作者 README](https://github.com/take365/zundasuiri/blob/main/README.md) | 取得した live HTML の footer に `VOICEVOX: ずんだもん / 四国めたん / 春日部つむぎ / 玄野武宏 / 青山龍星 / 雨晴はう`。作者は事前生成音声をブラウザで再生し、クレジット画面とスタッフロールを設けたと説明 | HTML と作者文書を確認。CSS・全状態の GUI や権利者による適合承認は未確認 |
| [Nextretch 作者の制作記事](https://zenn.dev/takunton/articles/e1ee2ab904da1c)（2026-06-16） | 事前生成 WAV を React/Vite/PWA に同梱。記事に `音声: VOICEVOX:ずんだもん` と規約リンク。作者はアプリ内 footer から利用規約・免責事項を開けると説明 | アプリ HTML は取得したが JS が403で、アプリ画面内のクレジット文言・位置までは確認できない |

これらは配信者自身の表示・制作説明という一次資料であり、規約適合の認証例ではない。fuzzy6 の義務は実例の模倣ではなく、規約の表記・見つけやすさから判断する。

## 2. 配布、商用、第三者利用、教育用途

### 今回使う Engine の規約を区別する

実物の [Engine 0.25.2 同梱規約](/home/apm/apps/voicevox-engine-0.25.2/resources/engine_manifest_assets/terms_of_service.md) は、許諾1が商用・非商用、2がアプリ組込み再配布、3が生成音声と音声ライブラリ規約、4が他者に利用を許諾する場合の3・4の義務継承、という構造である。VOICEVOX 使用クレジットも必要。[同梱の四国めたん policy](/home/apm/apps/voicevox-engine-0.25.2/resources/character_info/7ffcb7ce-00ec-4bdc-82cd-45a8889e43ff/policy.md) はクレジットと商用・非商用利用、および SSS LLC. の詳細規約への参照を含む。公式 [VVM TERMS.txt](https://github.com/VOICEVOX/voicevox_vvm/blob/main/TERMS.txt) も同系統の構造だった。

サイトの [VOICEVOX ソフトウェア利用規約](https://voicevox.hiroshiba.jp/term/) は生成音声が許諾2、義務継承が3で、ソフト無断再配布禁止の文言もあり、Engine 同梱文と同一ではない。今回はエンジン・CORE・VVM・辞書を配布しないため、ソフト再配布を音声ファイル公開と混同しない。制作記録は実際の Engine 同梱規約と現行音源規約を根拠にする。

再確認用の SHA-256 は次のとおり。ウェブの VOICEVOX 規約・FAQ・SSS 規約には本文で施行日／改定日を見つけられず、ここでは取得日だけを示している。公開ソースの Engine 0.25.2 の規約ファイルには dummy の文言があり、配布バイナリの原文の代替としては採用しなかった。

```text
Engine terms: 5e0d9c5c06c870191c5f0b76b3b4c9d06359b89a51c0b696ca7df1934c3e4f5b
四国めたん policy: aaea8f7e8dc9459ca34dd92e97b2da2a7a3cafe23cc00ad8cca867c4163a1e61
```

### 完成音声の Git/Pages 配布

生成音声は各音声ライブラリ規約に従って利用でき、商用・非商用とも認められる。企業・学校での利用も公式 FAQ は想定している。完成音声をウェブアプリで配信する構成はこの許諾に沿うという読解が有力であり、生成 WAV/Opus の公開リポジトリ掲載や Pages 配信を名指しで禁じる条文は見つからない。ただしクレジットと用途条件は残り、**「公開リポジトリなので音声も自由な素材」という許諾にはならない**。[Engine 同梱規約](/home/apm/apps/voicevox-engine-0.25.2/resources/engine_manifest_assets/terms_of_service.md)、[音源規約](https://zunko.jp/con_ongen_kiyaku.html)、[FAQ](https://voicevox.hiroshiba.jp/qa/)。

公開 GitHub 固有の条件として、[GitHub Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)（発効2026-04-27）の D.3–8 を確認した。投稿者には掲載の権限・ライセンス遵守が求められ、公開設定はサービス内の閲覧や fork 等への許諾を伴う。ライセンスを付けない場合にも view/fork が可能なことは [GitHub の licensing 案内](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)にも明記されている。

さらに現行 ToS D.4 は GitHub と affiliates への保存・ホスト・解析・表示・複製等に加え、AI／機械学習モデルの訓練・開発・改善の権利を含む。J.3 の Input/Output の opt-out は D.4–8 と公開リポジトリ内容には及ばない。四国めたんの対象規約に機械学習の名指し禁止は見つからなかったが、投稿者が与えられる権利の範囲、クレジットと条件継承、GitHub の D.7 のサービス内での attribution・moral rights の扱いとの関係までは、この比較で確定できない。[GitHub ToS D・J](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)。

ここは公開前の作者判断に残す論点である。NOTICE に条件を書いても GitHub ToS は変更されず、「必ず適合」「必ず違反」とは言えない。必要に応じて法的専門家や権利者・プラットフォームの説明を参照する。公式 FAQ 等は個別の規約適合質問には原則回答しないとしており、問い合わせで保証が得られるとは約束できない。この調査では問い合わせを送っていない。

Pages 自体の条件も別にある。[追加製品規約の Pages 章](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)（発効2026-08-27）は、商取引・商用 SaaS を主目的とする無料ホスティング等を制限する。教育解説プロジェクトの公開は想定されるプロジェクト紹介に近い、という推論はできるが、音源の商用利用が可能だから有料教材販売等も Pages で無条件に行える、とはならない。[Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) は公開サイト1GB以下、source repo 1GB推奨、帯域100GB/月の soft limit 等も示す。

### 禁止用途と教育解説での確認

[SSS LLC. 共通規約](https://zunko.jp/con_ongen_kiyaku.html)は、公序良俗違反のほか、次の用途等を制限する。日本法準拠で、該当時には許諾中止があり得る。

- 政治・宗教活動、またはそれらにつながる行為。
- 個人・団体・国家への非難・批判・応援を目的とする利用。
- 情報商材とその宣伝。
- 意図的な虚偽、誤解を誘導する内容の制作・拡散。
- 指定の風俗営業・性風俗業態、反社会的勢力への協力、暴力・脅迫・欺罔による信用毀損や業務妨害等。

VOICEVOX 側の規約にも、制作者・第三者への不利益、公序良俗に反する行為等の制限がある。無料・非商用でも条件は残る。[VOICEVOX 利用規約](https://voicevox.hiroshiba.jp/term/)、[Engine 同梱規約](/home/apm/apps/voicevox-engine-0.25.2/resources/engine_manifest_assets/terms_of_service.md)。

教育用途への一律免除はない。fuzzy6 では合成前に、台本全体と図・字幕・出典リンクを合わせて人間が確認する運用を推奨する。技術の仕組みを説明することと、特定企業・人物・国家への宣伝／非難が目的になることを区別する。作り物の数値や出力は AGENTS.md の方針どおり「例」と示す。情報商材と一般教材の境界、政治・宗教の中立教材が「つながる行為」に当たる範囲、批判・応援の目的の判断は定義が十分でなく、曖昧なデッキで話者を自動採用しない。

### 第三者の二次利用

サイト規約の許諾3は、他者に利用を許諾するとき「本許諾内容の 2 及び 3 の遵守を義務付けてください」と記す。Engine 同梱版は対応する3・4を継承する構造である。したがって再利用を許諾するなら、音源規約遵守と、その先への許諾時の同条件継承を利用者に義務付ける必要がある。[VOICEVOX 規約](https://voicevox.hiroshiba.jp/term/)、[Engine 同梱規約](/home/apm/apps/voicevox-engine-0.25.2/resources/engine_manifest_assets/terms_of_service.md)。

fuzzy3 の `grantDownstreamReuse: false` を継承する場合は、**作者として独立した素材再利用への追加許諾を与えない方針**として書く。GitHub 内の view/fork まで禁止する意味にはしない。生成音声の著作権成立・権利帰属も本調査では断定しない。将来コードに MIT 等の LICENSE を設けるなら音声の扱いを分ける。GitHub ToS D.6 の追加物への既存ライセンス適用もあるため、コードと音声の範囲を曖昧にしない。

条件案内の文案は以下。これは新たな独立再利用許諾そのものとしてではなく、作者が選ぶ方針とは別に置く。

> 本リポジトリの音声は VOICEVOX（四国めたん・ノーマル）で生成しています。適用される許諾に基づいて利用する場合は、クレジット `VOICEVOX:四国めたん` と音源規約を守り、他者へ利用を許諾する場合も同条件の遵守を義務付けてください。

ここに両公式規約リンクと確認日を加え、作者の追加許諾の有無を明記する。音声近傍 README/NOTICE と root README のリンクは、その条件が clone/fork 後も追えるようにする推奨である。

## 3. fuzzy3／fuzzy4 から継承できるものと公開時の差分

| 資料 | 既に決めた・確認したこと | fuzzy6 へ使える結論／公開条件で変わる点 |
| --- | --- | --- |
| [fuzzy3 COMPILER.md](/home/apm/projects/fuzzy3/docs/COMPILER.md) の voiceProfiles.policy | exact credit、`termsReviewedAt: 2026-08-09`、作者による whole-story 確認、`allowUserGeneratedText:false`、`grantDownstreamReuse:false` | 固定台本全体を確認し、日付・査読者・規約 snapshot/hash を記録する。これらの flag は作者方針で、公式規約が教育音声や二次利用を全面禁止する証拠ではない。今回の確認日は2026-10-11へ更新する |
| [fuzzy3 音声調査 §12](/home/apm/projects/fuzzy3/docs/research/voice-narration-webgpu-2026-08-08.md:353) | 2026-08-09 に制作時の正規ローカル Engine 合成、完成音声＋metadata の静的配信を採用。Engine/CORE/VVM は配らない。Ogg Opusと Web Audio 全復号 | 今回と同じ構成。閲覧者からモデル・辞書・初期化・推論待ちを外す理由も継承できる。生成音声にはクレジットと音源条件が残る |
| [fuzzy3 pro-review.md](/home/apm/projects/fuzzy3/docs/research/pro-review.md) | 初期案は HTMLAudioElement＋rAF。§7 は音声ダウンロード・再配布機能の確認を勧め、§10 はソフトライセンスを分離、§11 は禁止領域に注意 | 初期 HTMLAudio 案は最終採用方式ではない。§7 の助言を公式のダウンロード全面禁止と読み替えない。内容確認と配布物のライセンス分離は継承 |
| [fuzzy4 narration.md](/home/apm/projects/fuzzy4/docs/narration.md) | Engine 0.25.2、Core 0.16.1、Linux arm64 CPU、四国めたんノーマル（style ID 2）、24 kHz mono PCM16。23場面335.520秒、WAV計16,105,972 bytes。manifestに台本・設定・hash等 | 生成環境と記録方法は参考になる。WAV Git 除外は Emdash の未追跡バイナリ計数によるフリーズ対策で、規約禁止ではない。今回、配信用ファイルを公開する要件に合わせる |

fuzzy3 は原本 WAV・Opus・制作 sidecar を履歴管理し、原本を本番 image から除き、sidecar は非配信としている。今回の最小配布物は音声＋JSON なので、WAV 原本や完全 AudioQuery まで公開する必要は確認されていない。音声・モデル等を同梱しない構成に、CORE/ORT/VVM/OpenJTalk の再配布を理由とする各ライセンス全文同梱を自動で持ち込む必要もない。ただし他のコード依存物のライセンスは別問題である。

公開で増える対応は、デッキ直リンクでの表示、clone/fork 先へ条件を伝える文書、独立再利用の方針と GitHub 内の権利の区別、そして公開 CI に配信ファイルを渡すこと。過去セッションの合成設定・実行承認を、今回の新たな合成承認と扱わない。

## 4. 配信形式、ブラウザ、容量、この機械での生成

### 2026年10月時点の形式対応

各セルは **`audio` 要素／`AudioContext.decodeAudioData`**。○は文書・仕様・開発元の現行実装から確認できる通常の形式対応で、全セル実機未測。○* は下の Safari/WebKit の OS・版条件付き。AAC は **AAC-LC を MP4/m4a に格納したもの**に限定する。

| OS・ブラウザ | Ogg Opus | WebM Opus（mono） | AAC-LC / m4a | MP3 |
| --- | --- | --- | --- | --- |
| macOS Chrome（Google 配布版） | ○／○ | ○／○ | ○／○ | ○／○ |
| macOS Edge（Chromium版） | ○／○ | ○／○ | ○／○ | ○／○ |
| macOS Firefox | ○／○ | ○／○ | ○／○（OS decoder） | ○／○ |
| macOS Safari | ○*／○* | ○*／○* | ○／○（実ファイル確認） | ○／○ |
| iOS Chrome（WebKit版） | ○*／○* | ○*／○* | ○／○（実ファイル確認） | ○／○ |
| iOS Edge（WebKit版） | ○*／○* | ○*／○* | ○／○（実ファイル確認） | ○／○ |
| iOS Firefox（WebKit版） | ○*／○* | ○*／○* | ○／○（実ファイル確認） | ○／○ |
| iOS Safari | ○*／○* | ○*／○* | ○／○（実ファイル確認） | ○／○ |

macOS Chrome/Edge は [Chromium の codec/container 文書](https://www.chromium.org/audio-video/)、[Microsoft の Chromium 基盤説明](https://support.microsoft.com/en-us/edge/microsoft-edge-chromium)、[Mozilla の container 表](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Containers)（更新2026-10-01）を根拠にする。Google Chrome の AAC と、proprietary codec を含まない Chromium build は同一視しない。Firefox の AAC は [Mozilla 公式ヘルプ](https://support.mozilla.org/en-US/kb/audio-and-video-firefox)による OS decoder 依存で、macOS は対応対象。

Safari/WebKit の条件と証拠は次のとおり。

- **Ogg Opus**：Safari 18.4 で追加。文書上の再生対象は **macOS Sequoia 15.4、iOS/iPadOS 18.4以降**。古い macOS で Safari アプリだけを更新した場合まで推定しない。[Safari 18.4 の公式記事](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)（2025-03-31）。
- **WebM Opus**：mono/stereo の保守的な再生対象は **Safari 17＋macOS Sonoma 14以降、iOS/iPadOS 17.4以降**。WebM 動画コンテナ対応開始と Opus 対応開始、18.4 の MediaRecorder 生成対応とファイル再生対応は別。[Safari 17](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)（2023-09-18）、[Safari 17.4](https://webkit.org/blog/15063/webkit-features-in-safari-17-4/)（2024-03-05）。
- 2026年10月の現行系列は18.4で止まっていない。公式記事では **Safari 27.0** が2026-09-17公開、macOS/iOS 27等に同梱、macOS 26・15でも更新可能とされる。最低対応 OS の議論とは分ける。[Safari 27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)。

`decodeAudioData` は仕様上、audio が対応する形式を復号し、返す PCM を context の sample rate に resample する。完全なファイルを渡す API で、ストリーミング断片の復号用ではない。[W3C Web Audio §decodeAudioData](https://www.w3.org/TR/webaudio-1.0/#dom-baseaudiocontext-decodeaudiodata)、[MDN API 文書](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)。WebKit 現行 [AudioFileReaderCocoa.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/cocoa/AudioFileReaderCocoa.mm) と公式 [Ogg Opus テスト](https://github.com/WebKit/WebKit/blob/main/LayoutTests/webaudio/decode-audio-data-ogg-opus.html)、[WebM Opus テスト](https://github.com/WebKit/WebKit/blob/main/LayoutTests/webaudio/decode-audio-data-webm-opus.html)も両形式の復号を期待する。このため表の WebKit の decode 対応は仕様・コードからの判断を含み、リリース記事だけで API の正確な開始版を確定したものではない。

実装上の差もある。過去には audio で再生できる Opus が Web Audio では失敗した [Safari 15 の公式 bug](https://bugs.webkit.org/show_bug.cgi?id=226922)がある。2026-06-03 の [Ogg MIME 判定の修正 commit](https://github.com/WebKit/WebKit/commit/615a7b1e9c76e3c57b7ac4fa1e427d2144e450f1) は Ogg 復号 regression を修正している。M4A では ftyp brand による `EncodingError` の修正が [STP251](https://webkit.org/blog/18194/release-notes-for-safari-technology-preview-251/)（2026-08-26）にあるが、全 stable 版への配布状況は今回確定していない。`canPlayType()` の肯定や拡張子だけを、実ファイルの decode・末尾処理・長さの保証には使わない。

iOS 表は各社の通常の WebKit 製品版を対象とする。[Chrome の公式 source 文書](https://github.com/chromium/chromium/blob/main/docs/security/faq.md)、[Firefox の iOS 文書](https://firefox-source-docs.mozilla.org/overview/ios.html)、[Microsoft の iOS 開発者説明](https://blogs.windows.com/msedgedev/2017/10/05/microsoft-edge-ios-android-developer/)がこの基盤を説明する。ただし Microsoft 記事は2017年のもので、2026年の全製品形態の証明ではない。[Apple の EU 制度](https://developer.apple.com/support/alternative-browser-engines/)と [日本の制度](https://developer.apple.com/support/alternative-browser-engines-jp/)（日本はiOS26.2以降）には別エンジンを許可する仕組みがある。許可制度だけから製品の移行を推定せず、別エンジン版・実験版は実際の engine で別に判定する。

### 1分の容量とローカル生成能力

容量は **decimal MB（1 MB＝1,000,000 bytes）**、`kbps × 1000 × 60 ÷ 8` の計算。圧縮形式には container・header・tag が加わり、VBR は短い各ファイルで変動する。音質比較や実測値ではない。

| 形式 | 語りの比較用設定 | 1分の目安 | aarch64 Linux、現在の確認済み道具で作れるか |
| --- | --- | --- | --- |
| WAV 原本 | 24 kHz、mono、16 bit PCM＝384 kbps | 2.88 MB＋header | 原本をそのまま配れる |
| **Ogg Opus** | mono VBR **40 kbps**（比較範囲32–48） | **約0.30 MB**（0.24–0.36）＋Ogg | **可**。既存 `~/.local/bin/opusenc` で WAV から直接生成。ffmpeg・sudo不要 |
| WebM Opus | mono 40 kbps相当 | 約0.30 MB＋WebM | 現在の道具だけでは不可。Opus の WebM 格納に別の muxer が必要 |
| AAC-LC / m4a | mono 48–64 kbps | 0.36–0.48 MB＋MP4 | 現在の道具だけでは不可。例：fdkaac＋libfdk-aac |
| MP3 | mono 64–96 kbps | 0.48–0.72 MB＋header/tag | 現在の道具だけでは不可。例：LAME |

ローカル確認では aarch64、`opusenc`／`opusdec` は opus-tools 0.2／libopus 1.4。ffmpeg、lame、fdkaac、mkvmerge、avconv、qaac、afconvert は PATH で未検出だった。機械全体の不存在や、追加ツールの aarch64 ビルド・導入成功までは確認していない。

[opusenc 公式マニュアル](https://opus-codec.org/docs/opus-tools/opusenc.html)は Ogg Opus 出力と WAV 入力、VBR、speech 等を説明する。[mkvmerge 公式マニュアル](https://mkvtoolnix.download/doc/mkvmerge.html)は WebM 出力で Opus/Vorbis を扱う。[fdkaac 作者 README](https://github.com/nu774/fdkaac)は WAV 等から AAC/m4a を生成する道具、[LAME 公式サイト](https://lame.sourceforge.io/)は MP3 encoder の一次資料。追加ツールは必要な代案を決めた後、プロジェクト内または適切な隔離環境で検討し、sudo やグローバル apt を前提にしない。

将来の変換コマンド例（**今回は未実行**）：

```bash
~/.local/bin/opusenc --bitrate 40 --vbr --speech --comp 10 --framesize 20 --padding 0 input.wav output.opus
```

`.opus` はここでは Ogg コンテナであり、名前を `.webm` に変えても WebM にはならない。変換ツール化では件数・入力／出力サイズ・時間・子プロセスに有限な上限を付ける。fuzzy3 の helper は出力 buffer 上限はあるが timeout がなく、無条件にコピーしない。

40 kbps の payload は WAV の約1/9.6、削減約89.6%。fuzzy4 の335.520秒を同じ目標 bitrate にすれば約1.678 MBの payload だが、実 Opus を作って測った値ではない。AAC/MP3 の設定も比較案で、四国めたんの子音・数字・語尾を試聴してから確定する。

### fuzzy3 が Ogg Opus＋Web Audio 全復号を採った理由

[fuzzy3 の採用決定 §12](/home/apm/projects/fuzzy3/docs/research/voice-narration-webgpu-2026-08-08.md:353)、[opus.js](/home/apm/projects/fuzzy3/tools/speech/opus.js)、[buffer-transport.js](/home/apm/projects/fuzzy3/public/narration/buffer-transport.js)から、主な理由は小さい配信ファイル、制作時に検証できる提示時間、AudioContext 時計での seek・字幕同期である。

Ogg Opus の granule は48 kHz単位で、通常の新規単一ストリームの提示 sample 数は `finalGranule − preSkip`、時間はそれを48000で割る。fuzzy3 はこれを24 kHz WAVの sample 数×2、および `opusdec` の48 kHz全復号 sample 数と照合する。元の24 kHz録音の帯域が増える意味ではない。[RFC 7845 §4・5.1](https://www.rfc-editor.org/rfc/rfc7845.html)、[RFC 6716](https://www.rfc-editor.org/rfc/rfc6716.html)。

ブラウザ側は48 kHz context を作り、全 bytes を取得し、hash、全復号、sampleRate・length を先に確認して AudioBufferSource で再生する。delay／末尾 padding を提示時間から外し、字幕等の時刻に使う。異なる build/architecture で復号 PCM の最下位 bit が異なる可能性があるため、全端末の PCM hash 一致を契約にはしない。この選択が最少メモリ・最速だと全端末で実測されたわけではない。

全復号後の mono float32 PCM は48 kHzで **11.52 MB/分**、44.1 kHzで10.584 MB/分。10分を48 kHzで保持すると sample 領域だけで115.2 MBとなり、取得 bytes・復号途中・コピー等は別に加わる。圧縮しても PCM メモリは減らないので、短い文／clip単位で保持範囲を有限にする。[W3C AudioBuffer](https://www.w3.org/TR/webaudio-1.0/#AudioBuffer)。

AAC/MP3/WebM に替える場合は、実ファイルの復号後の duration、頭と末尾、字幕 anchors を別途確認する。Opus の48 kHz契約を拡張子だけ変えて使わない。元 WAV の24 kHz、Opus の時刻単位48 kHz、実際の context/buffer の sampleRate を区別し、圧縮ファイルの byte 数から長さを推定しない。

## 5. 現在の fuzzy6 への差分と残る確認

共有作業中に仕様・コードが変わったため、ここは **2026-10-11、Unit 5 取得時点**の snapshot である。仕様0.3は rail credit と声を定義し、実装も文単位の全復号方式になっていた。一方、[仕様 §7.1](../../docs/spec.md)では配信用圧縮形式が未決定で、[.gitignore](../../.gitignore) が `decks/*/voice/**/*.wav` を除外、[LLM deck.js](../../decks/llm/deck.js) は WAV の glob を参照していた。

[sound.js](../../src/explorer/sound.js) は sampleRate 指定なしの共通 AudioContext で fetch→decode を行い、現在と前後clipの選択済みtakeを保持する。取得32 MiB上限、load待機15秒上限がある。fuzzy3 の48 kHz/hash/sample長照合と同じ厳密契約ではなく、Promise の timeout が native decode 自体を物理停止する保証も確認できない。音声が最大90秒のclip時間内に収まり3clip分保持する場合、48 kHz PCM sample 領域は約51.84 MBという比較目安になる。

[Pages workflow](../../.github/workflows/pages.yml) は checkout→npm ci→test→build→dist の公開で、合成 step はない。したがって実装時には配信用 `.opus` 等と manifest を追跡し、Vite の glob／URL／拡張子と dist 同梱を整合させる。ローカル WAV が存在するだけでは公開 CI に渡らない。WAV 原本を非追跡のままにし、配信用派生物だけを追跡する選択はできる。

複数形式を使うなら `audio` の source 列挙と Web Audio の fetch/decode は別に設計する。Web Audio 側で候補 URL を選び、復号失敗時に次の形式へ進む必要がある。fuzzy3 の decode失敗時の無音時計・字幕 fallback や、AudioContext がないときの media provider は、別 codec への自動切替ではない。

残る不確実性は次のとおり。

- **規約解釈**：見つけやすさの具体的基準、アプリ付属ファイルと単独音声作品の境界、教育と禁止領域の境界、GitHub の広いホスト許諾と条件付き音源利用の関係。これらを本報告の推奨文面だけで解決したとはしない。
- **技術・制作**：対象端末の実ファイル decode、Safari 修正の各 stable 版への配布状況、M4A brand・delay・末尾trim、音質と実容量、追加encoder/muxerの aarch64 導入可否。通常画面・直リンク・縮小表示のクレジット可読性も未試験。

## 6. 調査計画の変化

最初は既存判断、公式規約、表示実例、ブラウザ対応、容量／CLI、統合確認の6単位に分けた。公開 Git の view/fork と独立素材再利用の違いが必要になり、Unit 2 に GitHub 一次資料を追加した。そこから派生したホスト許諾と音源条件の両立も追究したが、法的結論は上記の留保として残した。元の質問を別の目的に置き換えてはいない。

調査中に fuzzy6 の仕様が0.2から0.3へ変わり、さらに rail credit と音声実装が追加されたため、計画変更3・4で最新 snapshot に更新した。初期の「実装がない」という観察を恒久的な欠陥としては報告していない。合成・変換・追加ツール導入・実機試験は元の調査範囲外として、次の制作作業へ残した。最新計画の全6単位は完了している。

## fuzzy6 で行うこと

- **文言**：音声を使うデッキの `voice.credit` は `VOICEVOX:四国めたん`。説明文では `音声合成: VOICEVOX:四国めたん`。「ノーマル」は manifest の style に記録する。
- **置く場所**：各デッキの rail を主な表示場所とする。目次／クレジット画面に規約リンクをまとめ、トップ footer、root README、デッキ README にも補助表示する。トップ・READMEだけに任せず、音付き `clean` と直リンクでも容易に見つかる導線を確認する。常設や全場所への重複は公式の明文義務ではない。
- **条件文書**：音声近傍 README または NOTICE に、両規約URL、確認日2026-10-11、完成音声のみを配布すること、作者の二次利用方針と条件継承を記し、root README からリンクする。コード LICENSE の対象と音声条件を区別する。`grantDownstreamReuse:false` は追加の独立素材許諾を与えない方針として説明する。
- **リポジトリのファイル**：文／take単位の配信用音声と、それを参照する manifest JSON を履歴管理し、Pages の dist に含める。JSONには URL、codec/container、提示時間、原本sample rate、話者・style・credit、Engine版、hash、規約URL・確認日、作者方針を推奨。WAV 原本・完全 AudioQuery・Engine・CORE・VVM・辞書は今回の必須配布物にしない。
- **第一候補**：mono **Ogg Opus VBR40 kbps**。既存 opusenc を使う。対象 OS が Safari/WebKit の Ogg 条件を満たすことを確認し、実ファイルの decode・提示時間・頭末尾・seek・字幕同期を検証する。
- **代案**：旧 macOS/iOS 対応を含めるなら **MP3 mono64–96 kbps**、または **AAC-LC/m4a mono48–64 kbps**。追加道具なしの暫定 fallback は **WAV**。WebM Opus は一部旧 WebKit の対象を広げるが、muxer追加を要し万能の代案ではない。複数形式は manifest と Web Audio の候補切替を整合させる。
- **公開前の判断**：台本・図・字幕全体の禁止領域確認を日付・確認者付きで残す。GitHub へのホスト許諾の論点を作者が判断し、必要な説明を参照する。本調査の「名指し禁止なし」を個別公開の適合保証として扱わない。
