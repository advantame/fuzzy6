# fuzzy6 の VOICEVOX 音声公開・クレジット・配信形式の調査ログ

- 質問: 四国めたん（ノーマル）の制作時合成音声と長さ等の JSON を公開リポジトリ advantame/fuzzy6 および GitHub Pages で配布する際の条件、クレジット、既存 fuzzy3/fuzzy4 の判断、配信形式を一次資料と実装から確認する。
- 範囲: ローカル VOICEVOX Engine 0.25.2 CPU 版で合成済みの音声のみを配る。エンジン・モデル配布、ブラウザ内合成、合成実行、プロジェクト編集は対象外。法的判断を代行せず、原文と確認日、明文の要件と運用上の推奨、解釈の不確実性を区別する。
- 出力: このディレクトリの append-only `log.md` と、報告ターンに書く日本語 `report.md` のみ。
- UTC 開始: 2026-10-11 04:29:42 UTC。
- 先行確認: 現在のリポジトリの `AGENTS.md` を最初に読み、`docs/spec.md` を参照。書込みは `research/voice-terms/` 内だけ。sudo、パッケージ導入、GPU 負荷は行わない。

## 初期計画

質問 × 資料群で次の単位に分ける。必要が生じたら計画変更を追記する。

1. **既存判断と公開対象の差分 × ローカル docs・コード**: fuzzy3 の COMPILER voiceProfiles.policy、音声調査 §12、pro-review と実際の Ogg Opus/Web Audio 実装、fuzzy4 narration.md、fuzzy6 の仕様・公開導線を読む。再利用できる結論と再確認対象を整理。
2. **クレジット・配布・用途制限 × VOICEVOX と四国めたん公式規約・FAQ**: 現行原文、更新日、表記、配置、生成音声配布、商用・非商用、二次利用、教育用途を確認。
3. **ウェブでの表示例と fuzzy6 の配置案 × 公式案内・実際のウェブ表示・公開コード**: 明文の要件とサイト実例を分け、デッキ画面、目次、トップ、README、LICENSE/NOTICE の役割を具体化。第三者の実例は許諾の証拠としない。
4. **音声形式のブラウザ対応 × 各ブラウザ公式文書・仕様・実装履歴**: 2026 年 10 月時点として Ogg Opus、WebM Opus、AAC/m4a、MP3 の audio 要素と decodeAudioData を macOS/iOS の Chrome/Edge/Firefox/Safari を含め確認。バージョン・OS 条件と未実測を明記。
5. **容量・この機械での生成・fuzzy3 の理由 × ローカル環境・opus 公式・既存実装**: 読取りだけでツール能力を確認し、ビットレートから容量を算出。WAV 原本との比較、同期と全復号メモリも確認。形式の第一候補と代案を整理。
6. **整合性確認 × 以上の証拠一覧**: 規約と公開条件、表示案、互換性表、推奨ファイル群、残る不確実性が質問を覆うか点検。全単位完了後は log を確定して ready-to-report を返し、次の指定された報告ターンで report.md を書く。

現時点の未解決: 規約でウェブページ内の場所が限定されるか、公開素材の二次利用条件の通知方法、Safari の Ogg/WebM の OS・版境界、opusenc のローカル機能。

## Unit 1: 既存判断・実装と fuzzy6 公開対象の差分

完了日時: 2026-10-11（UTC）。この単位はローカル文書・コードの読取り。ウェブ規約の現行性は未確認であり、以下の既存結論は法的根拠として未確定。

### 資料（すべて 2026-10-11 取得）

- **L1**: `/home/apm/orca/workspaces/fuzzy6/searobin/AGENTS.md`（最初に読んだ）。公開と部品・制作・機体のルール。
- **L2**: `/home/apm/orca/workspaces/fuzzy6/searobin/docs/spec.md` 版 0.2、§3.2–3.6、§8 を含む画面契約。`index.html`、`src/home/main.js`、`README.md`、`vite.config.js`、`.gitignore` も確認。
- **L3**: `/home/apm/projects/fuzzy3/docs/COMPILER.md` の voiceProfiles（114 行以降）、音声成果物と Runtime Scene IR（419 行以降）。
- **L4**: `/home/apm/projects/fuzzy3/docs/research/voice-narration-webgpu-2026-08-08.md` §12（353 行以降、2026-08-09 採用決定）。
- **L5**: `/home/apm/projects/fuzzy3/docs/research/pro-review.md`。全文を区間分割して読んだ。特に §2–3、§7、§10–12、最終採否。
- **L6**: `/home/apm/projects/fuzzy4/docs/narration.md`。全文を読んだ（2026-09-12 生成・Git除外経緯、利用条件など）。
- **L7**: `/home/apm/projects/fuzzy3/public/narration/buffer-transport.js`（48–55、228–320、465–478 行付近）、`public/forms/story.js`（78–102 行）、`public/style.css`（290 行付近）、`tools/speech/opus.js`（全文）、`README.md`（音声部分）。

### 確認した事実と帰属

1. **制作時合成＋完成音声・metadata の静的配信は既に fuzzy3 の本番方式。** L4 §12 は作者が正規 Engine をローカルで起動して公式 HTTP API を使い、Engine/CORE/VVM を同梱・再配布しないと決めている。音声と同期 metadata をコミットし、閲覧者はそれを取得して再生する。VVM（文書では約 58 MB）、ORT、辞書、初期化・推論待ちを閲覧者の必須経路から外す理由が書かれている。L5 §2 も固定された説明原稿ではこの構成を第一候補にしている。これは今回の配布対象と一致する。
2. **ソフトウェア・モデルの配布ライセンスと生成音声の条件を分ける考え方は再利用できる。** L5 §10、L4 §12.5 は、観客配布物に CORE/ORT/VVM/OpenJTalk 辞書のコピーがない構成では、その再配布を理由とした各ライセンス全文のフロントへの同梱を要求しないと整理。一方、生成音声にはクレジットと音源規約が適用されるとしている。現行一次資料で次単位に確認する。ソフトを配らないからクレジットも不要、という結論ではない。
3. **既存のクレジットは `VOICEVOX:四国めたん`。** L3 は exact string として validator 上の契約にしている。L3 の Runtime IR は `voiceCredits` に `音声合成: VOICEVOX:四国めたん` を出力し、標準再生シェルで常時表示すると説明。L7 `public/forms/story.js` は `aria-label="音声クレジット"` を持つ表示要素を右 rail に追加しており、文書だけでなく実装もある。L6 も同じ文言と両公式規約リンクを採用。**「表記の exact string」と「常時表示」は、現段階では既存プロジェクトの採用方針として確認したもので、公式規約が全実装へ要求するかはまだ未確認。**
4. **fuzzy3 の policy は法律そのものではなく、作者の内容確認の記録。** L3 は `termsReviewedAt: 2026-08-09`、`reviewedBy: story-author`、`reviewScope: whole-story`、`restrictedDomainReview: approved`、`allowUserGeneratedText: false`、`grantDownstreamReuse: false` を例示し、固定 story 全体と制限領域を人間が確認してから合成する門であり法的判断を代替しないと明記。L4 §12.5 は規約取得日／snapshot hash、査読日、査読者も記録する方針。L5 §11 は政治・宗教、人物・団体・国家への批判／応援、虚偽・誤解誘導への注意から、四国めたんを全コンテンツへ自動適用しないよう提案。
5. **「公開する」と「第三者へ独立した再利用権を与える」を分ける必要がある。** L4 §12.5 は第三者に音声二次利用を許諾する場合の義務継承を挙げ、`allowAudioExport` ではなく `grantDownstreamReuse` を使う。L3 の初版は二次利用権を与えない方針。L5 §7 の「ユーザーが生成音声をダウンロード・再配布できる機能」は確認を取る領域という過去の助言で、ダウンロードが公式規約で一律禁止という証拠ではない。公開 Git では音声が容易に取得・fork できるため、方針を JSON に記すだけでなく README/NOTICE 等で閲覧者に伝える必要があるかを、現行規約と GitHub 条件で再確認する。
6. **fuzzy4 の音声 Git 除外は規約上の禁止を示していない。** L6 は Emdash が未追跡バイナリの行数計数でフリーズしたため、`/public/audio/*` を除外し、`manifest.json` だけ履歴管理に残したと説明する。音声ファイルはローカルに存在し、アプリ再生を維持。従ってその `.gitignore` を今回へ無条件に持ち込むと、「完成音声を公開リポジトリと Pages で配布する」という要件と衝突する。tool の事故対策と規約要件を混同しない。
7. **fuzzy4 の生成環境は今回の前提と一致。** L6 は `/home/apm/apps/voicevox-engine-0.25.2/run`、Engine 0.25.2、Core 0.16.1、Linux arm64 CPU 版、四国めたんノーマル、UUID `7ffcb7ce-00ec-4bdc-82cd-45a8889e43ff`、style ID 2、24 kHz mono PCM16 WAV と記録。23 場面・335.520 秒で WAV 計 16,105,972 bytes。制作条件、台本、hash、AudioQuery、生成日時、クレジットを manifest に記録する考え方は使える。4 スレッド、仮想アドレス制限、当時の生成承認は当該セッションの記録で、今回の合成実行の承認と扱わない。
8. **Ogg Opus と Web Audio 全復号の主な理由はサイズと時間軸の検証。** L3/L4 は WAV master 24 kHz mono PCM16 から mono Ogg Opus VBR 40 kbps を派生。Opus presentation timebase は 48 kHz。`finalGranule - preSkip` が WAV master の sample 数の 2 倍に等しいことを確認し、`opusdec` の全復号 sample 数も照合する。VBR の bitrate を同期時刻の根拠にはしない。L7 encode 実装は `--bitrate 40 --vbr --comp 10 --framesize 20 --speech --padding 0 --discard-comments --serial ...`。24 kHz 入力を 48 kHz の時間軸として扱っても、元録音の帯域が増えるわけではない。
9. **全復号方式は文書に留まらず実装されているが、全ブラウザ対応の実測証拠ではない。** L7 は `new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 })`、音声 bytes 取得と hash 確認、`decodeAudioData` 全復号後に sampleRate と length を IR と厳密照合してから再生する。長さ不一致や decode 失敗時は無音の論理時計・字幕へ fallback。AudioContext/fetch 自体がない場合だけ media provider へ戻るため、AudioContext があるのに Ogg 未対応というケースでは別コーデックに自動で切り替わらない。現行 Safari 等の対応を後続単位で調査する。L5 は当初 `HTMLAudioElement` のシンプルな再生を提案しており、L4 §12.2 と現行 README が後の全復号方式への更新を記録している。L3 は異なる build/arch の Opus 復号 PCM の LSB が異なり得るため、復号 PCM hash の機械間一致を契約にしないとしている。
10. **WAV 原本を配信するかはプロジェクト差。** L3 は master と Opus と制作 sidecar をコミットし、master は `.dockerignore` で本番 image から除外、sidecar は非配信。一方 L6 は master 自体を Git 除外。今回の最小公開物が「配信用音声＋長さ JSON」であることから、WAV 原本・完全 AudioQuery・生成実行ログまで公開必須とする理由は現段階でない。公開リポジトリにあることと Pages ビルド成果物にあることも別に扱う。
11. **fuzzy6 の画面内クレジット用部品は現行仕様に定義されていない。** L2 では rail、bar、目次 dialog は既定で、専用の credit 項目はない。トップ `index.html` は操作説明 footer、デッキ一覧は `src/home/main.js`。デッキは独立したページで直リンクできるため、トップだけの表示では各デッキの訪問者が見ない可能性がある。トップの cover は `?c=opening&t=...&clean` を iframe で表示する。音声導入時に cover が鳴るかどうかは後続の実装課題（本調査では編集しない）。L1/L2 は `/fuzzy6/` 配信を前提に `base: './'`、独自 href/src も相対パスとする。
12. **リポジトリの root LICENSE/NOTICE は今回のローカル対象ファイル検索では見つからなかった。** 根拠は L2 の `rg --files -g 'LICENSE*' -g 'NOTICE*'` の結果。これは音声に無条件な OSS 許諾が既に付くことを意味しない。README と公開サイトのクレジット、音声用途制限、著作物のライセンス範囲を今後別々に提案する。

### そのまま使える結論／次に確かめる結論

- 再利用: 制作時ローカル合成、閲覧者は完成音声と JSON のみ取得、Engine/モデルを配らない構成。固定原稿全体の確認記録、話者・style 名・クレジット・制作日・hash の記録。字幕・視覚説明だけでも成立する fallback。配信と二次利用許諾の区別。
- 一次資料で再確認: 具体的なクレジット表記と置く場所の最低条件、公開 Git/Pages の生成音声配布許諾、第三者再利用義務、商用・教育用途・禁止用途の原文。
- 公開条件で変わる: サイト直リンクの利用者にもクレジットを見せること、clone/fork で持ち出される素材の条件通知、生成音声をコードのライセンスと混同しないこと。fuzzy4 の Git 除外理由を規約禁止として継承しない。
- 技術上再確認: Ogg Opus の Safari/macOS/iOS の版と OS 条件、audio 要素と decodeAudioData の違い。Web Audio 全復号の厳密 sample 照合が各候補形式で成立するか。この機械の opusenc だけで作れるコンテナ範囲。

### 未解決点・次の単位

- 既存資料の規約確認日は 2026-08-09 等であり、2026-10-11 の現行規約を確認していない。
- 既存 `grantDownstreamReuse: false` は作者方針。公式規約の第三者条件や GitHub の fork 権限との関係は未確認。
- 全復号方式の browser/OS 互換性、CLI のローカル存在・版は未確認。合成・encode・ブラウザ実験は未実行。
- 次は **Unit 2: クレジット・配布・用途制限 × VOICEVOX と四国めたん公式規約・FAQ**。取得予定: `https://voicevox.hiroshiba.jp/term/`、`https://voicevox.hiroshiba.jp/qa/`、`https://zunko.jp/con_ongen_kiyaku.html`。必要ならローカル 0.25.2 同梱規約と公式 VVM 規約を比較する。

## Plan revision 1

学んだこと: fuzzy3 は既に生成音声をコミットする設計で、今回「公開になったから生成音声の配布が初めて問題になる」とは限らない。一方 fuzzy4 の非追跡方針は規約由来ではない。第三者への二次利用権を与えない方針は公開 Git の fork 条件と区別して説明する必要がある。

- 派生質問: **公開 GitHub リポジトリの閲覧・fork 条件と、独立した素材再利用の許諾はどう分かれるか。** 元の質問（第三者二次利用）へ正確に答えるため今追究する。Unit 2 の資料群に GitHub 公式 Terms of Service と licensing 文書を追加する。
- Unit 5 は CLI 確認と容量に加え、全復号メモリと別形式の長さ・encoder delay を扱う（元の計画を明確化、追加単位は作らない）。
- 残り: Unit 2（公式規約・FAQ＋GitHub 条件）、Unit 3（ウェブ表示例・配置案）、Unit 4（ブラウザ対応）、Unit 5（容量・生成・時間軸）、Unit 6（整合性確認）。全単位完了後の report turn で報告を作る。

チェックポイント: ボスの token threshold 通知を受け、現在の Unit 1 を完了してこの entry を追記した。まだ規約のウェブ取得も report.md 作成も行っていない。

## Unit 2: クレジット・生成音声公開・用途制限と GitHub 条件

完了日: 2026-10-11（UTC）。公式ウェブ規約・FAQ と、実際に用いる Engine 0.25.2 同梱ファイルを照合。合成・配信・プロジェクト変更はしていない。

### 資料（すべて 2026-10-11 取得）

- **W1**: [VOICEVOX ソフトウェア利用規約](https://voicevox.hiroshiba.jp/term/)。許諾1–3、禁止、その他。ページ本文には施行日・改定日を見つけなかった。
- **W2**: [VOICEVOX よくあるご質問](https://voicevox.hiroshiba.jp/qa/)、ライセンス・利用規約に関する質問。動画、電話など音声だけの利用、音楽配信、機械での音声案内、会社・学校、クレジット省略、規約適合問い合わせを確認。本文に当該回答の改定日はない。
- **W3**: [SSS LLC. 音源利用規約](https://zunko.jp/con_ongen_kiyaku.html)。VOICEVOX の四国めたんを含む章、および共通規約。別製品 Voiceger/MMVC の章を混同しない。ページ本文に施行日・改定日はない。
- **L8**: `/home/apm/apps/voicevox-engine-0.25.2/engine_manifest.json`（version 0.25.2、default_sampling_rate 24000）、`resources/engine_manifest_assets/terms_of_service.md`、`resources/character_info/7ffcb7ce-00ec-4bdc-82cd-45a8889e43ff/policy.md` および metas.json。manifest が同梱規約へのパスを指す。規約ファイル SHA-256: Engine terms `5e0d9c5c06c870191c5f0b76b3b4c9d06359b89a51c0b696ca7df1934c3e4f5b`、四国めたん policy `aaea8f7e8dc9459ca34dd92e97b2da2a7a3cafe23cc00ad8cca867c4163a1e61`。
- **W4**: [公式 VOICEVOX VVM TERMS.txt](https://github.com/VOICEVOX/voicevox_vvm/blob/main/TERMS.txt)（取得実体: https://raw.githubusercontent.com/VOICEVOX/voicevox_vvm/main/TERMS.txt ）。音声モデル規約と四国めたんの短い policy。今回 VVM を配布することの許諾調査ではなく、同梱規約との比較。
- **W5**: [GitHub Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)、本文の Effective date は **April 27, 2026**。D.3–8、J.3 を確認。
- **W6**: [GitHub Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)、Choosing the right license、Determining the location。
- **W7**: [GitHub Terms for Additional Products and Features](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)、Pages 章。Version Effective Date **August 27, 2026**。
- **W8**: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)、Usage limits。
- 参考確認: [Engine 0.25.2 ソース](https://github.com/VOICEVOX/voicevox_engine/tree/0.25.2) の raw terms_of_service.md は `dummy teams of service`、四国めたん policy.md は `dummy1 policy` だった。公開ソースの placeholder を配布バイナリの規約原文として引用してはいけない。今回の確定根拠は **L8 の実物** と W1/W3/W4。Engine 0.25.2 README に「利用規約」の文字検索一致なし。第三者検索結果や公式 issue は補助探索だけで、条件の根拠には採用しない。

### 原文の短い抜粋と、その意味

- W1「ご利用の際は VOICEVOX を利用したことがわかるクレジット表記が必要です。」ソフト側の文言要件は VOICEVOX 使用が分かること。厳密な一字一句の形式まではこの条文にない。
- W3 表記例「VOICEVOX:四国めたん」。配置条件はアプリの「紹介画面など」「少し探せばわかる場所に」。動画は見に行った利用者が分かる程度の場所。**ノーマルのスタイル名、声優名、ロゴ、規約全文同梱、常時表示、全クリップへの焼込みを求める条文は、この対象規約では見つからない。** L8 と W4 の四国めたん policy も同じクレジットを指定。
- W1 許諾3 は「本許諾内容の 2 及び 3 の遵守を義務付けてください」。他者へ音声利用を許諾するとき、音声ライブラリ規約の遵守と、更に他者へ許諾する際の同じ義務の継承を求める。
- W3 共通規約は「政治活動、宗教活動またはそれらにつながる行為」と、個人・団体・国家への非難・批判・応援を目的にする利用を禁止。教育という名称だけで免除されるとは書かれていない。
- W5 D.5 の短い原語は `view and "fork"`。公開設定はサービス内の閲覧・利用・表示・実演・fork 複製を許諾する。D.4 の AI 学習を含む GitHub 側の許諾は別問題（下記）。

### 事実と制作への適用

1. **商用と非商用の両方が利用可能。** W1 許諾1、W3 許諾1、L8/W4 四国めたん policy は共通。クレジットと用途条件を満たす四国めたん利用について、企業だから一律有償・事前許可が必要という条文は対象資料にない。W2 の会社・学校の回答も生成音声の商用・非商用使用を認め、各規約確認を求める。W3 の有償クレジット省略契約は通常のクレジット付き公開とは別制度で、今回使う理由はない（金額に依存する提案もしない）。
2. **アプリ掲載の最低要件は、利用者が少し探せば分かるクレジット。** `音声合成: VOICEVOX:四国めたん` と書けば、VOICEVOX 側の使用表示と音源側の例の双方を満たす意図を明確にできる。スタイルを補足するなら `（ノーマル）` は任意。紹介画面等という柔軟な文言を、全画面への常時表示義務と読み替えない。fuzzy6 各デッキに容易に開ける「音声・クレジット」導線を設ける、または rail/bar の常設欄を使うのは推奨実装。トップ、目次、README 等の具体的比較は Unit 3。
3. **生成音声を公開 Git/Pages に載せることを名指し禁止する条文はない。** W1 は生成音声利用と他者への利用許諾を、W2 はウェブページ等でのクレジットを伴う公開を想定し、L8/W4 は四国めたんの生成音声利用を認める。このため「固定解説の完成音声を配信し、明記した条件を保持する公開」は利用許諾の範囲に入るという読解が有力。ただし **GitHub という配信者に要求される追加権利まで適合すると断定する法的判断は別**。生成物と Engine/model のコピーを区別すること。W1 のソフト無断再配布禁止を WAV/Opus の公開禁止と読み替えない。
4. **Engine 規約とエディター等のサイト規約は文章が異なる。** L8 Engine terms はアプリ組込み再配布を許諾2で認め、生成音声は3、義務継承は4（3及び4）。W1 はその組込み条項がなく、生成音声が2、義務継承が3（2及び3）で、ソフト無断再配布禁止がある。W4 モデル terms は L8 と同構造。今回 Engine/model は配らないのでこの差は成果物のソフト再配布判断を必要としないが、制作記録は「実際に使う Engine terms＋現行音源規約」を指すべき。W1 はプロジェクト公式の生成音声案内として補助参照する。
5. **禁止用途の範囲。** W1/L8/W4 は制作者・第三者への不利益、公序良俗違反等。W3 共通規約は、公序良俗違反、政治・宗教活動等、個人・団体・国家への非難・批判・応援の目的、情報商材とその宣伝、意図的な虚偽・誤解誘導、指定の風俗営業・性風俗業態、反社会的勢力等を禁止し、該当時には対象団体・個人の許諾中止があり得る。日本法準拠。無料・非商用であってもこの条件は残る。
6. **教育解説の運用。** 台本全体、画面の図・字幕・リンク先との組合せを人間が確認し、特定企業・人物・国家の批判／応援が目的になっていないかを確認する。例えば技術の仕組みの中立説明と、特定企業を宣伝／非難する説明は、同じ技術を扱っても目的が違う。作り物の出力・数値を「例」と明示し、意図的な虚偽や誤認誘導を避ける。学校・教育一般は許可だが、上記制限への特別免除はない。情報商材と一般教材の境界、社会政治・宗教についての中立教材が「つながる行為」に当たるか、批判・応援の目的の判断は定義されず、読み手による解釈が残る。曖昧なデッキではその話者を自動採用せず作者が判断する。
7. **第三者による独立再利用。** 二次利用を許諾するなら、利用者に音源規約遵守と更なる許諾先への同条件継承を義務付ける必要がある。コードの MIT/CC0 等の一括文言に音声も含めない。README と音声の近くの NOTICE/README と manifest に credit・規約URL・確認日・再利用方針を記すのは条件を伝える運用案で、ファイル名 NOTICE 自体が規約必須という意味ではない。既存 `grantDownstreamReuse:false` は「作者として追加の独立素材再利用を許諾しない」方針と説明する。生成音声への著作権成立・権利帰属を本調査では断定しない。
8. **GitHub 公開は「何の権利も許諾しない」状態ではない。** W5 D.3–5 は公開物を掲載できる権限とライセンス遵守を投稿者の責任とし、サービス内の閲覧・fork 等の許諾を要求。W6 はライセンス未選択でも公開リポジトリの view/fork 権利は残ると説明。従って全面的な「複製一切禁止」は公開 Git の説明として不整合。W5 D.6 は既存ライセンスがある repo への追加物は原則同条件とするため、将来 code LICENSE を設ける際は音声の別扱い・範囲を明記する。
9. **今回新たに見つかった公開プラットフォーム上の留保。** W5 の現行 D.4 は GitHub と affiliates に保存・ホスト・解析・表示・複製等に加え、AI／機械学習モデルの訓練・開発・改善の権利も許諾すると明記。J.3 の Input/Output opt-out は D.4–8 と公開 repo contents には及ばない。W3 に機械学習利用の名指し禁止は見つからなかったが、生成音声の無条件再利用権を投稿者が有するか、GitHub 側の条項と音源条件の継承・クレジットを両立できるかはこの原文だけでは確定しない。**NOTICE に規約を書くことは、プラットフォーム規約を変更する手段ではない。** 通常のサイト再生利用を認める結論と、ホストへ要求される広い許諾の適合を分けて報告する。音声配布前に作者がこの点を再判断し、必要なら法的専門家・権利者・プラットフォームの説明を参照する対象として残す。調査のため外部へ問い合わせは送らない。
10. **Pages の商用条件は音源の商用可否とは独立。** W7 は静的な個人・組織のプロジェクト紹介を想定し、商取引／商用 SaaS を主目的とする無料ホスティングは禁止、寄付・クラウドファンディング等の一部収益化は可。今回の教育解説という目的は想定されるプロジェクト紹介に近いという推論。音声が商用利用可でも、Pages で有料教材販売・商用SaaSを無条件に運営できるわけではない。W8 は公開サイト1GB以下、source repo1GB推奨、月間100GB soft bandwidth、10分deployment timeout、Actions custom workflow は10builds/hour制限の対象外と記載。これはVOICEVOX条項ではない。

### 未解決点と次の単位

- 規約で紹介画面の exact UI までは定義されず、README だけで公開ウェブアプリの利用者に足りるかの個別判定は断定しない。Unit 3 で容易な導線を具体化する。
- 生の音声ファイルを単独作品として配る場合と、付属クレジットのあるアプリの構成ファイルとして配る場合の境界は明文でない。W2 は電話等の音声のみの場合には冒頭・末尾の音声クレジットを案内する。一方概要欄のない配信では補足Webページ等も可と説明。今回のアプリ配信用ファイルへ一律に読み上げクレジット挿入が必須とする根拠はないが、独立素材としての提供へ拡大するなら再確認対象。
- 両権利者は規約適合性の質問には原則答えない（W2/W3）。問い合わせで個別保証を容易に得られる、と約束しない。
- GitHub の広いライセンス条項と条件付きの音声利用との関係は「禁止が見つからないので全面許可」とも「必ず違反」とも断定できない。
- 次は **Unit 3: ウェブでのクレジット実例と fuzzy6 の配置案 × 公式サイト・アプリ作者の表示／公開コード**。Unit 2 を完了したので、ボスの token threshold 通知に従いこの記録後 checkpoint を要求する。

## Plan revision 2

学んだこと: 今回用いる Engine 0.25.2 の同梱規約は公式サイトのソフトウェア規約と同一ではない。公開 GitHub の現行 ToS は閲覧・fork 以外のホストへの許諾（AI学習等）も明示している。従来 `grantDownstreamReuse:false` をそのままコピーするだけでは公開条件の説明が足りない。

- 派生質問: **ホスティングのため投稿者が GitHub に与える権利と、条件付き音源利用許諾は両立するか。** 元の「公開 Git/Pages と二次利用」へ答えるため今追究し、Unit 2 に現行条文の比較を含めて完了。法律判断・権利者個別許諾の獲得は調査の権限外として未解決事項／公開前の判断対象へ回す。これが元の質問全体を置き換えるわけではない。
- Unit 3 の表示提案は「明文で必須な容易に見つけられる表示」と「常設・各デッキ・README/NOTICE等の運用推奨」を分ける。配信用ファイルと音声単独作品の区別も含める。
- 残り: Unit 3（表示例・配置）、Unit 4（browser対応）、Unit 5（容量・CLI・全復号）、Unit 6（整合性）。report.md はまだ作成しない。


## Unit 3: ウェブ表示の実例と fuzzy6 の具体的な配置

完了日: 2026-10-11（UTC）。公式の配置条件を Unit 2 から引き継ぎ、実例の配信者自身によるページ・公開コードを調べた。fuzzy6 の共有作業環境で仕様が版 0.3 に変わっていることも読取りで確認。自分はプロジェクトを編集していない。

### 資料（すべて 2026-10-11 取得）

- **W1/W2/W3**（Unit 2 で取得済み）: https://voicevox.hiroshiba.jp/term/ 、https://voicevox.hiroshiba.jp/qa/ 、https://zunko.jp/con_ongen_kiyaku.html 。表記とアプリの「少し探せばわかる場所に」という最低条件の根拠。
- **L9**: 現在の `/home/apm/orca/workspaces/fuzzy6/searobin/docs/spec.md` 版 **0.3（2026-10-11 改訂）**、§3.2（101–130 行付近）、§7/7.1（473–553 行付近）、変更履歴（643 行付近）。`src/explorer/chrome.js`、`src/explorer/index.js`、`src/home/main.js`、`index.html`、`decks/llm/deck.js` も検索・関連箇所を読取り。
- **E1**: [ずんだもん推理室の実際の公開ウェブアプリ](https://zundamon-mystery-room.chita256.chatgpt.site/) と [作者の公開 README](https://github.com/take365/zundasuiri/blob/main/README.md)（取得実体 https://raw.githubusercontent.com/take365/zundasuiri/main/README.md ）。native web がアプリを取得できなかったので、urllib の読み取り（timeout、取得 byte 上限、process メモリ上限付き、保存なし）で HTML 本体と README を確認。
- **E2**: [Nextretch 作者による制作記事](https://zenn.dev/takunton/articles/e1ee2ab904da1c)（公開日は本文に 2026/06/16）。作者が自身のアプリとクレジットを説明する一次資料。https://stretch-voice.pages.dev/ の HTML は取得できたが、動的 JS 本体は HTTP 403。そのため本単位ではアプリ画面の表示を実測したとはしない。
- **E3（補助、最終報告の主要実例には採らない）**: https://nikolat.github.io/sosiremi/ の `<aside class="readme" aria-label="banjou_no_sumikko_de"><pre>` 内に、盤上の隅っこで作者の README を掲載。「棋譜の読み上げ音声について」の節に「VOICEVOX:四国めたん」を利用と公式サイトURLを記載。これは配布物紹介ウェブページに README の音声 credit を見せる実例だが、当該ページが作者本人のサイトではないので、許諾・作者方針の根拠には採らない。作者 repo https://github.com/Tatakinov/banjou_no_sumikko_de は検索で見つかったが、推測した master branch の raw readme は404、追究を打ち切った。
- **探索のみ（根拠不採用）**: https://voicecloner.org/ja/voicevox-web は検索結果と live HTML/本文の credit 該当箇所が一致せず、再取得は403だった。「クレジットをコピー」という検索結果だけで現在の表示例にしない。https://voicevox.hiroshiba.jp/ は公式の話者名・音声 sample・利用規約の並列表示があるが、実演ページ内に exact credit が表示されることをこの読取りでは確認できず、具体的な credit 設置例として数えない。

### 事実と表示の判断

1. **ブラウザアプリでの実例 E1。** live HTML の `footer.app-footer` に `VOICEVOX: ずんだもん / 四国めたん / 春日部つむぎ / 玄野武宏 / 青山龍星 / 雨晴はう` がある。README は、制作時に生成した完成音声をブラウザで再生し、外部API接続・ログイン不要と説明する。また `app/page.tsx` のクレジット画面とスタッフロールを説明し、画面への画像リンクもある。**確認したのは取得したHTMLの表示用要素と作者文書であり、CSSによる可読性や全状態のGUIを測定したわけではない。** 複数話者をまとめたこの書式を fuzzy6 へそのままコピーする理由はない。四国めたん一人なら公式例の `VOICEVOX:四国めたん` が簡潔で曖昧さが少ない。
2. **完成 WAV を同梱する音声ガイドの実例 E2。** Nextretch の作者は React/Vite/PWA で事前生成 WAV を同梱すると説明。記事の「クレジット・利用について」に `音声: VOICEVOX:ずんだもん` と両公式サイトリンクがあり、アプリ内フッターのリンクから利用規約・免責事項を確認できると述べる。これは自分の制作と掲載方針に関する一次証言。ただしアプリ内の credit 自体がどこでどの文言として描画されるかは、今回403でUIを追えなかったため作者説明以上に断定しない。ずんだもんは四国めたんと同じ W3 の VOICEVOX 章に含まれるため、導線の比較例として使えるが、個別の適合承認の証拠ではない。
3. **実例と条件を区別する。** E1/E2 は「フッター＋専用画面」「紹介記事＋アプリ内の案内リンク」の運用を示す。権利者が認証した表示方式であるとは述べられておらず、実例を根拠に「この場所なら必ず合法」と結論づけない。最低条件は W1/W3 の表記・見つけやすさによって説明する。
4. **fuzzy6 は版0.3で credit の置き場所を既に仕様化している。** L9 §3.2 は rail の末尾に `.mx-credits` / `.mx-credit` を置き、§7 は `deck.credits` と `voice.credit` の自動追加を定義する。例は `voice: {speaker:'四国めたん', style:'ノーマル', credit:'VOICEVOX:四国めたん', ...}`。Unit 1 の「専用部品はない」は当時の版0.2の事実であり、現在の仕様についてはこの entry で更新する。ただし読んだ `src/explorer/chrome.js` にはまだ credits の生成がなく、`src/explorer/` に声の復号実装ファイルもなかった。仕様への追加と実装完了を混同しない（共有作業が進行中なので将来変わり得る）。
5. **fuzzy6 で最低条件を満たす意図が明確な案。** 音声を使う各デッキの rail に `VOICEVOX:四国めたん` を置く。文言として `音声合成: VOICEVOX:四国めたん` もよいが、既定の `voice.credit` を公式例のまま自動追加するなら bare string で足りる意図が明確。通常表示で読めるサイズ・色を確保し、字幕や操作に埋もれないことを導入時に確認する。この常設 rail 案は規約が要求する常時表示の解釈ではなく、直リンクでも見つかる場所を確保する実装上の推奨。
6. **画面の各候補を、義務と推奨に分ける。** 以下の「必須」は公式原文にある機能要件であり、特定のファイル名やUI部品を要求するものではない。

| 候補 | 必須に関わる位置付け | fuzzy6 での提案 |
| --- | --- | --- |
| 各デッキの画面内 | アプリで少し探せば credit を見つけられることが必須。画面ごとの常設は明文必須ではない | §3.2/§7の rail に公式例を常設するのを第一案。各クリップに焼き込む必要は示されていない |
| 目次・紹介／クレジット画面 | 認識できる導線があれば公式の「紹介画面など」に沿う代案 | 各デッキの通常画面から明確に開ける目次の末尾、または「音声・クレジット」画面に同文言。rail 常設なら重複表示は任意。規約リンクをまとめる場所に向く |
| トップページ | トップへの配置自体は名指し必須ではない | 共通 footer に同文言＋両規約リンクを推奨。デッキ直リンクを考えるとトップだけに任せない |
| root README／デッキ README | 公開ウェブ利用者が repo 文書を少し探せば見つけられると個別判定できる保証はない。ファイルへの記載自体は名指し必須ではない | clone/fork 利用者向けに credit、条件リンク、確認日、完成音声のみ配布、コードと音声の範囲の違いを記す。サイト表示の補助として使う |
| LICENSE／NOTICE | 特定ファイル名・規約全文同梱はこの対象規約に明文要求なし。再利用許諾するなら遵守義務の継承は必須 | コードの LICENSE に音声を無条件で含めない。音声近傍の README または NOTICE に条件案内と作者の二次利用方針を書く。root NOTICE を採る場合は root README から辿れるようにする |
| manifest.json／ファイル metadata | JSON の credit 項目を求める条文はない。閲覧者が JSON だけ調べないと表示を発見できない状態では見つけやすさが不確か | 話者・style・credit・規約URL・確認日・制作用 Engine 版・hash と再利用方針を記録し、持ち出したファイルの条件が追えるようにする |

7. **仕様の `clean` 表示は別経路。** cover iframe は枠を消すため rail credit が隠れる。トップ内の無音 cover は共通 footer の表示で扱う案。`clean` を音付きで独立公開／共有する経路に広げるなら、その表示にも credit 導線を用意するか、音付き公開を通常枠ありのデッキに限る運用を検討する。Unit 1時点の未解決「coverが鳴るか」を credit 構造から追記したもので、本単位では再生実験・挙動変更をしていない。
8. **単独音声との区別。** README／NOTICE／metadata はアプリ構成ファイルの文脈を伝える。アプリとは別の音声素材集・ポッドキャスト・電話音声等として提供することへ用途を広げる際は、W2 の音声のみの場合の冒頭／末尾 credit と補足Webページの案内に照らして表示を再判断する。配信ファイルの全てに読み上げを加えることが必須だという一律の結論は出さない。

### 未解決点・次の単位

- 「少し探せば」のクリック数、最低文字サイズ、READMEだけの場合、音声単独URLへのアクセスは具体的に定義されていない。rail常設案はこの解釈の負担を小さくする提案。
- E1/E2 の規約適合保証は確認していない。実例のGUI全状態・視覚的可読性を検証していないことを報告に残す。
- fuzzy6 の仕様版0.3と現在の実装は進行中の差がある。導入者は音声とcredit実装後に公開URL直リンク・目次・clean・スマホ縮小状態を確認する。この調査はソースを直さない。
- 次は **Unit 4: 2026年10月の codec/container と audio要素／decodeAudioData の対応 × browser公式資料・仕様・実装履歴**。SafariのOS／版、iOSの各ブラウザでWebKitと別エンジンを混同しないことを重点にする。
- ボスの checkpoint token threshold 通知を受け、この単位の完全記録を追記した後 checkpoint/compaction を要求する。report.md は未作成。

## Plan revision 3

学んだこと: 共有作業の fuzzy6 仕様が調査中に0.2から0.3へ変わり、音声manifest・WAV配信・rail credit の契約が追加されていた。Unit1の画面構造に関する否定的記述は取得時点の事実であり、将来提案にそのまま使わない。第三者サイトの検索結果はlive HTMLと一致しない場合があり、実例には取得した表示用HTMLと作者自身の文書を採用する。

- Unit3 は現在の仕様を読んだうえで完了。専用 credit UI を新設する提案から、**既に仕様化された rail credit を確実に実装・表示する提案**へ更新。コード編集は引き続き範囲外。
- Unit5 は版0.3が現在WAVを記録する点を含め、Opus導入を将来の配信形式選択として整理する。現時点で fuzzy6 が Opus を使っていると書かない。必要な関連コードはUnit5で読み直す。
- 残り: Unit4（browser対応）、Unit5（容量・CLI・時間軸・現在のWAV契約との差分）、Unit6（整合性）。全単位完了後にready-to-report、明示された報告ターンでreport.md。

## Unit 4: 2026年10月の音声形式・audio 要素・decodeAudioData のブラウザ対応

完了日: 2026-10-11（UTC）。ブラウザ開発元の公開文書・実装・テストと Web Audio 仕様を読取り。実機 Safari／各ブラウザで fuzzy6 配信ファイルを再生する試験はしていない。ここでの対応は文書とコードによる形式対応で、任意のファイル・全バージョンでの成功保証ではない。

### 資料（すべて 2026-10-11 取得）

- **C1**: [WebKit Features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)（2025-03-31）、Media 章。Ogg と MediaRecorder の追加を区別。
- **C2**: [WebKit Features in Safari 17.4](https://webkit.org/blog/15063/webkit-features-in-safari-17-4/)（2024-03-05）、Additional codecs 章。
- **C3**: [WebKit Features in Safari 17.0](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)（2023-09-18）、And more video and audio。
- **C4**: [WebKit Features for Safari 27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)（2026-09-17）、Web Audio/Media の修正と Updating to Safari 27。2026年10月の現行系列を2025年の18.4で止めて扱わないため確認。
- **C5**: [Chromium Audio/Video](https://www.chromium.org/audio-video/)、Codec and Container Support。Google Chrome の AAC と一般 Chromium の build 差も記載。[Microsoft Edge (Chromium)](https://support.microsoft.com/en-us/edge/microsoft-edge-chromium) も Microsoft 自身が Chrome と同じ基盤と説明。Edge macOS の codec 表は **C6** の開発文書で補完。
- **C6**: [MDN Media container formats](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Containers)（本文最終更新 2026-10-01）、Ogg、WebM、MP4、MP3。Mozilla の開発文書として参照、Safari の開始条件は WebKit の C1–C3 を優先。[Firefox Help: Audio and video files in Firefox](https://support.mozilla.org/en-US/kb/audio-and-video-firefox)（取得時は旧URL https://support.mozilla.org/en-US/kb/html5-audio-and-video-firefox から転送）、audio codec 表と AAC FAQ。AAC は OS の decoder に依存。
- **C7**: [W3C Web Audio API 1.0 §1.1.2 decodeAudioData](https://www.w3.org/TR/webaudio-1.0/#dom-baseaudiocontext-decodeaudiodata)（Recommendation 2021-06-17）、[MDN decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)。仕様の形式対応・sniffing・resampling、MDN の完全ファイル必須を確認。
- **C8**: WebKit の現行公開実装 [AudioFileReaderCocoa.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/cocoa/AudioFileReaderCocoa.mm)（取得実体 https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/platform/audio/cocoa/AudioFileReaderCocoa.mm ）。WebM 専用 demux と AVFoundation 経路、Ogg/AAC/MP3/MP4 の識別。公式テスト [decode-audio-data-ogg-opus.html](https://github.com/WebKit/WebKit/blob/main/LayoutTests/webaudio/decode-audio-data-ogg-opus.html) と同名 `-expected.txt`、[decode-audio-data-webm-opus.html](https://github.com/WebKit/WebKit/blob/main/LayoutTests/webaudio/decode-audio-data-webm-opus.html)、`decode-audio-data-aac.html`、`decode-audio-data-m4a-no-mp4-brand.html` も raw で読んだ。テストの存在は期待する仕様の一次根拠で、今回テストを実行した結果ではない。
- **C9**: [WebKit commit 615a7b1e9c76e3c57b7ac4fa1e427d2144e450f1](https://github.com/WebKit/WebKit/commit/615a7b1e9c76e3c57b7ac4fa1e427d2144e450f1)（2026-06-03、canonical `314462@main`）。GitHub API の有限 byte 読取りで commit message と TestExpectations の patch を確認。Ogg decode の regression 修正とテスト追加。WebM テストの履歴には [f1a836c378ccc0626dc9e0fb56d188268a57740d](https://github.com/WebKit/WebKit/commit/f1a836c378ccc0626dc9e0fb56d188268a57740d)（2021-07-29、WebAudio WebM/Opus support）がある。
- **C10**: [WebKit bug 226922](https://bugs.webkit.org/show_bug.cgi?id=226922)（Safari15 の audio と Web Audio の差、FIXED、開発者コメントは STP132 以降の修正と説明）、[bug 183852](https://bugs.webkit.org/show_bug.cgi?id=183852)（報告者による17.4動作報告は補助に限る）、[STP240](https://webkit.org/blog/17896/release-notes-for-safari-technology-preview-240/)（WebM >2ch と MP4 Opus の decode 修正）、[STP251](https://webkit.org/blog/18194/release-notes-for-safari-technology-preview-251/)（2026-08-26、M4A ftyp brand による decodeAudioData EncodingError の修正）。STPでの修正を全 stable 版への配布済みとは扱わない。MP4 Opus 修正は C4 が Safari27 stable にも記載。
- **C11**: [Chromium security FAQ: Chrome for iOS](https://github.com/chromium/chromium/blob/main/docs/security/faq.md)（raw の How is security different in Chrome for iOS?）、[Firefox for iOS source docs](https://firefox-source-docs.mozilla.org/overview/ios.html)、[Microsoft Edge for iOS and Android: What developers need to know](https://blogs.windows.com/msedgedev/2017/10/05/microsoft-edge-ios-android-developer/)（2017-10-05）。各社が WebKit／WKWebView 採用を説明。Edge は iOS版がそのOSのSafariに対応すると明示。古いEdge記事のみで2026年の独自エンジン配布状況を断定しない。
- **C12**: [Apple: alternative browser engines in EU](https://developer.apple.com/support/alternative-browser-engines/)、[Japan](https://developer.apple.com/support/alternative-browser-engines-jp/)。日本は iOS26.2 以降、EUも entitlement により別エンジンを許可。許可制度の存在と Chrome/Edge/Firefox の製品版が実際に別エンジンを配布していることは別。
- 探索だけ・不採用: MDN Audio_codecs の一部は Safari Opus を CAF のみとする古い説明、Edge Ogg 非対応など C1/C6 の新しい container 表と矛盾する。2026年の結論にその古い段落を採らない。第三者 Can I Use／Reddit／Wikipedia は判断根拠にしない。WebKit bug316172 は native web が取得できず、対応する開発元 commit C9 で内容を確認。推測した AudioFileReaderCocoa.cpp URL は404で、APIのディレクトリ一覧から正しい .mm を確認した。

### 確認した事実

1. **Safari の Ogg Opus は現在も一律非対応、という結論は誤り。** C1 は Safari18.4 の Ogg Opus/Vorbis 追加を明記。ただし **macOS Sequoia15.4、iOS18.4、iPadOS18.4 以降**という OS 条件がある。Safari だけを更新した旧 macOS の対応まで18.4という番号から推論しない。C4 によると Safari27.0 は2026年9月公開で、macOS27/iOS27 等に同梱、macOS26 と15でも更新可能。最新 Safari と最低互換対象の版を分ける。
2. **Safari WebM Opus の境界。** C3 は Safari17.0＋macOS Sonoma14 で mono/stereo Opus in WebM/MP4 の対応を追加。C2 は iOS/iPadOS17.4 で WebM を全面対応と説明。macOS の WebMコンテナ／VP8/VP9自体は14.1以来という記述を、Opus の全API対応開始と読み替えない。今回 mono なので多チャンネル制限の対象ではない。C1 の18.4 MediaRecorder WebM Opus追加は **録音生成の対応**で、ファイル再生の開始時期ではない。
3. **audio と decodeAudioData の関係。** C7 の仕様は audio 要素が対応する形式の音声ファイルデータを decode できると説明する。ただし C10 は実装で両者に差が出た履歴の一次証拠。現在 C8 は Ogg Opus と WebM Opus の decode 成功・frame数を期待するテストを持つため、現行の OS 条件を満たす Safari/WebKit は両APIへの対応が見込める。**Safari18.4が全ての decodeAudioData 実装・OS組合せで開始版である、とまでリリース記事だけで確定しない。** 公開に用いる実際のfileのdecodeを最後に確認する。
4. **2026年に Ogg decode regression と修正もある。** C9 は MP4 Opus のため AudioToolbox AudioFile から AVFoundation AVURLAssetReader へ移行した後、Ogg の MIME が `application/ogg` と判定され、AVFoundation が期待する `audio/ogg` と合わなかったと説明。2026-06-03 の修正は識別を直し、Ogg Opus/Vorbis decode test を追加。reader main と stable 製品の版別同一性をこの調査では追跡していないので、修正commitの存在を全端末の動作証明にしない。iOS の TestExpectations の Vorbis Failure／Ogg simulator 非対応注記も実機対応と区別する（今回は Opus）。
5. **AAC-LC/m4a、MP3 は広い旧ブラウザ対応を狙う代案。** C5/C6 は両形式の通常再生を支持する。Chrome は proprietary codecs を含む配布版と無印 Chromium の build 差がある。Firefox の AAC は OS media decoder に依存し、macOS は対応対象。iOS版Firefoxを desktop Gecko の表で判定しない。AAC は m4a という拡張子だけでcodecを決められないので、本比較は **MP4内のAAC-LC** に限定。
6. **M4A の decode 検出は追加の注意点。** C10 STP251 は valid M4A でも ftyp の brand が mp4 で始まらないと decode が失敗する修正を記載。C8 のテストは AAC-LC、`M4A `/`iso2`/`isom` のbrandを扱い、長さはencoder delay次第で小さい許容差を設ける。2026年10月に全 stable へ同じ修正が入ったか未確定なので、拡張子／canPlayType の肯定だけで全復号を保証しない。
7. **iOS はブラウザ名に加えて OS/engine で判定する。** C11 が示す通常の WebKit製品版はSafariの形式条件を共有する。C12 の EU・日本の制度から「iOSの全ブラウザは例外なくWebKit」という将来に通用しない断言を避ける。本表は普通の WebKit版を対象とし、別エンジン版・実験版・特殊embedded環境は実際のengineで別判定する。独自engineを提供したとの一次証拠を今回見つけていないので、許可制度から製品移行を推論しない。
8. **完全ファイルと時間軸。** C7 は完全なファイル bytes から復号し、AudioContext の sampleRate に resample すると説明。`decodeAudioData` は streaming chunk decoder ではない。24kHz入力であっても返ったAudioBufferを24kHzと決めつけず、実際のcontext/ buffer sampleRateとlengthでdurationを検証する。`audio.canPlayType()` はHTML再生の事前判定には使えるが、対象 bytes の decode 成功・trim・長さ検証の代わりにはならない。

### 対応表（2026-10-11 の公式公開資料に基づく、実機未測）

各セルは **audio 要素／decodeAudioData**。○は通常の対象形式への対応が文書・仕様・現行実装から確認できること。○* は下記 OS・版条件を満たす WebKit に限る。APIごとの実際のfile検証は全セルで残る。Ogg/WebM の WebKit decode は C7/C8/C9 のコード・仕様による判断を含む（リリース記事だけによるAPI開始版の保証ではない）。

| OS・ブラウザ | Ogg Opus | WebM Opus（mono） | AAC-LC / m4a | MP3 |
| --- | --- | --- | --- | --- |
| macOS Chrome（Google配布） | ○／○ | ○／○ | ○／○ | ○／○ |
| macOS Edge（Chromium版） | ○／○ | ○／○ | ○／○ | ○／○ |
| macOS Firefox | ○／○ | ○／○ | ○／○（OS decoder） | ○／○ |
| macOS Safari | ○*／○* | ○*／○* | ○／○（M4A brand等は実file確認） | ○／○ |
| iOS Chrome（WebKit版） | ○*／○* | ○*／○* | ○／○（同上） | ○／○ |
| iOS Edge（WebKit版） | ○*／○* | ○*／○* | ○／○（同上） | ○／○ |
| iOS Firefox（WebKit版） | ○*／○* | ○*／○* | ○／○（同上） | ○／○ |
| iOS Safari | ○*／○* | ○*／○* | ○／○（同上） | ○／○ |

- Ogg の文書上の再生最低条件: Safari18.4＋macOS15.4以上、iOS18.4以上のWebKit。これより古いSafari/OSはOggを非対応として代案を用意する。ブラウザアプリだけの更新ではOS由来のdecoderを更新できない。
- WebM Opus の保守的な再生対象: Safari17＋macOS14以上、iOS17.4以上。HTMLとdecodeの過去差分・blob経路問題があるので、古い版対応が必要ならMP3/AAC/WAVの方が導入リスクは小さい。
- 最新OS/最新版だけを対象にするなら、この4形式は対応面で候補になる。**Oggの配信効率と既存encoderが有利か、旧iOS/macOSも対象にするか**が実際の選択基準となる。全て○だから無条件に1形式を選べる、とは結論しない。
- `<audio><source>` は別形式を列挙できるが、Web Audio はfetch/decodeする候補をアプリが選び、失敗時に次の候補へ進む仕組みが必要。fuzzy3 の既存 fallback は同じ音声URLの再生方式変更や無音時計であり、MP3へ自動で切替える仕組みではない（Unit1）。

### 未解決点・次の単位

- 今回は端末・ブラウザ別の実機試験をしていない。特にSafari最低対応版、2026年Ogg regressionの製品版への影響、M4A brand修正のstableへの配布版を確定していない。表はcodec対応の選定資料として使い、配信予定の短い実fileのdownload/decode/再生/長さ・末尾までの確認を導入時に行う。
- 一次資料の新しいcontainer表と古いcodec解説が矛盾する点は報告で注記。Safari非対応を固定前提にした古い提案は再利用しない。
- 容量・この機械で作れるコンテナ・codec、fuzzy3の全復号のメモリや時間軸検証は次単位へ。
- 次は **Unit5: 容量・ローカルCLI・Opus時間軸・fuzzy3採用理由とfuzzy6 WAV仕様との差分**。本ターンの token threshold 通知に従い、Unit4を完全記録してからcheckpoint/compactionを要求する。report.mdは未作成。

## Unit 5: 容量・ローカル変換能力・時間軸・現在の fuzzy6 との差分

完了日: 2026-10-11（UTC）。ツールの存在・version/help、コード、公式マニュアルを読取り、容量は式から計算。音声合成・エンコード・インストール・ビルド・ブラウザ試験はしていない。書込みはこのログへの追記のみ。

### 資料（すべて 2026-10-11 取得）

- **T1**: `uname -m`、`command -v ffmpeg opusenc opusdec lame fdkaac mkvmerge avconv qaac afconvert`、`~/.local/bin/opusenc --version` と `--help`。20秒timeout、192MiB仮想アドレス上限内の短い読取り。結果は aarch64、`/home/apm/.local/bin/opusenc` と `opusdec` のみが PATH で見つかった。opusenc は **opus-tools 0.2 / libopus 1.4**。他の encoder/muxer は PATH で未検出（機械全体に絶対にないとまでは調べない）。ユーザーの ffmpeg なしという前提と一致。
- **T2**: [Xiph opusenc(1)](https://opus-codec.org/docs/opus-tools/opusenc.html)（文書末尾2019-09-07）。出力が **Ogg Opus stream**、WAV入力、VBRのtarget bitrate、speech、comp、framesize、metadata paddingの説明。ローカルhelpにはWAV/AIFF/raw PCM入力と本調査の設定がある。
- **T3**: [RFC 7845: Ogg Encapsulation for the Opus Audio Codec](https://www.rfc-editor.org/rfc/rfc7845.html)（2016-04）、§4/4.2/4.3/4.4 と §5.1。48kHz granule、pre-skip、末尾trim、Input Sample Rateの意味。
- **T4**: [RFC 6716: Definition of the Opus Audio Codec](https://www.rfc-editor.org/rfc/rfc6716.html)（2012-09）、§2.1付近の帯域・effective sample rate表。24kHz super-wideband、48kHz fullbandを区別。
- **T5**: [W3C Web Audio API 1.0: AudioBuffer](https://www.w3.org/TR/webaudio-1.0/#AudioBuffer) と §5.1（2021-06-17 Recommendation）。各channelは32bit float PCMのmemory-resident asset。Unit4 C7のdecodeAudioDataによるcontext sampleRateへのresampleも引き継ぐ。
- **T6**: [fdkaac 作者の公式README／man page](https://github.com/nu774/fdkaac)（作者nu774）。WAV/raw/CAFからM4A/AAC、AAC-LCはprofile2既定、M4A既定、gaplessはM4Aのみ。[LAME 作者公式サイト](https://lame.sourceforge.io/)はMP3 encoderとしての一次根拠。これらは代案の道具で、手元に導入済みという証拠ではない。
- **T7**: [MKVToolNix mkvmerge 公式マニュアル](https://mkvtoolnix.download/doc/mkvmerge.html)。native webが取得不能のためtimeout12秒、取得512KiB、process192MiB・20秒上限のurllibで保存なし読取り。`--webm`／拡張子webmでWebMにし、許可audio codecはOpus/Vorbisと説明。出力形式変更にはmuxerが必要という根拠。PATHではmkvmerge未検出なので具体的なローカルremuxは未実行。
- **L10**: fuzzy6の現在の `docs/spec.md` **0.3**（§7.1/§10）、`.gitignore`、`.github/workflows/pages.yml`、`src/explorer/sound.js`（全文）、`src/explorer/chrome.js`（credit部分）、`src/explorer/index.js`（prepareSound部分）、`decks/llm/deck.js`、`decks/llm/voice/manifest.json`（2MiB上限の小さな集計）、`git ls-files 'decks/*/voice/*'`。共有作業は継続中で、本単位の取得時点に限る。
- **L7（再読）**: `/home/apm/projects/fuzzy3/tools/speech/opus.js` のencode/parse/decode部分。Unit1のL3/L4/L7で採用理由・同期契約を確認済み。

### 容量と生成可能性

以下はdecimal MB（1MB=1,000,000bytes）、1分の音声payload。圧縮形式は **bitrate×1000×60÷8** の計算であり、実ファイルの計測・品質比較ではない。container/header/tagとVBR変動は別に加わる。特に短い文を多数のfileに分けるとheaderの割合が増える。

| 形式 | 語り向け比較用の設定例（品質保証でない） | 1分の目安 | 現在のこの機械で作れるか | 判断 |
| --- | --- | --- | --- | --- |
| WAV 原本 | 24kHz、mono、PCM16、384kbps | 2.88MB＋header | 原本をそのまま使える | 再圧縮不要。旧端末向け暫定fallbackにも使えるが通信量は大きい |
| Ogg Opus | mono VBR40kbps、比較範囲32–48 | 約0.30MB（範囲0.24–0.36）＋Ogg | **可**。既存opusencがWAVから直接生成。ffmpeg・sudo不要 | 第一候補。対象OSと実file decode確認が条件 |
| WebM Opus | 同じOpus40kbps相当 | 約0.30MB＋WebM。Oggとの差は主にcontainer | **現在の確認済み道具だけでは不可**。opusencはOggのみ。別途WebM muxerが必要 | iOS17.4等までOpusを広げる理由はあるが、Oggよりツールが増え、旧OS万能の解決ではない |
| AAC-LC / m4a | mono48–64kbps（例64） | 0.36–0.48MB＋MP4 | **確認済み道具だけでは不可**。例fdkaacとlibfdk-aacが必要、PATHで未検出 | 広い旧OS対応の代案。M4A brand／delayの実file検証が残る |
| MP3 | mono64–96kbps（例64） | 0.48–0.72MB＋header/tag | **確認済み道具だけでは不可**。例LAME、PATHで未検出 | 旧Safari/iOSを含む圧縮fallbackの有力案。Opusより大きい比較設定 |

- 上記AAC/MP3のbitrateは比較のための選定案で、公式が四国めたんの音質を保証した値ではない。子音・数字・語尾を試聴してから確定する。T2はVBRのtargetが大きく多様な音声集合の平均であり、各短いfileが正確に40kbpsになるとは説明していない。
- WAV384kbps対Opus40kbpsのpayload比は約9.6:1、削減約89.6%。fuzzy4の335.520秒ならWAV約16.105MBに対し40kbpsの目標payload約1.678MB（実Opusは未作成／未計測）。
- 生成例は `~/.local/bin/opusenc --bitrate 40 --vbr --speech --comp 10 --framesize 20 --padding 0 input.wav output.opus`。これは提案文字列であり実行していない。拡張子 `.opus` はOgg Opusで、`.webm`に名前を変えてもWebMにはならない。将来の実装では有限件数・fileサイズ・出力サイズ・timeout等を設ける。fuzzy3のhelperにはmaxBuffer128MiBがあるがtimeoutがなく、そのまま移植する理由にはしない。
- 必要なら追加encoder/muxerはaarch64向けのプロジェクト内ツールや適切な隔離環境で検討する。sudo/global aptを必要条件としない。この調査で導入・buildはしておらず、aarch64 prebuilt availabilityや依存ライセンスまでは検証していない。現時点で工具追加なしのfallbackはWAV。

### Opus の時間軸・全復号・fuzzy3 の理由

1. **48kHzはOpusの時刻表現。** T3 §4はgranuleを固定48kHz単位とし、PCM位置をgranule−pre-skip、再生時刻をその値÷48000とする。Input Sample Rateは元入力のrateであり再生rateではない。T4の24kHz入力を48kHz時間軸で扱っても、録音の情報・帯域が増えるわけではない。
2. **fuzzy3の検証は自然な組合せ。** L7は完結した単一Ogg streamのEOS、channel、sequence、pre-skip、finalGranuleを読取り、presentationTicksを確定。24kHz WAV sample数×2と照合し、opusdec48kHz全復号sample数も検証。末尾paddingやcodec delayを実際の提示時間から外して、字幕・seek・cueの時間に使う。browser側は48kHz context/buffer lengthを照合する（Unit1）。この契約がAACやMP3にも拡張子を替えるだけで成立するとはしない。
3. **理由は小さい配信fileと、再生前に検証できる時間軸。** fuzzy3は固定音声をfetchしてhash・decode・長さを先に確認し、AudioBufferSourceとAudioContext時計でseek／字幕を同期する。L4はブラウザ合成のモデル・初期化・推論待ち回避も根拠。この選択が全端末で最少メモリ／最速という実測ではない。一般の長いaudioに対してHTMLAudioElement streamingも別選択肢だが、今の短い語りの設計と混同しない。
4. **配信圧縮と再生メモリは別。** T5のfloat32 mono PCMは48kHzで **11.52MB/分**、44.1kHzで10.584MB/分、24kHzで5.76MB/分。48kHz10分なら115.2MBのsample領域だけを要し、取得bytes・decode途中・コピー等は追加。Opusにしても全復号のPCMは小さくならない。短い文／clip単位で読み込み、保持範囲を有限にする理由になる。
5. **代案のdelay・trimは別に検証。** AAC/m4a、MP3、WebM Opusに替える場合は、出来上がったfileのdecodeAudioData後のdurationと頭・末尾、原本のanchorsとの一致を確認する。T6のM4A gapless metadataやUnit4のWebKit AAC testの許容差は、browserごとにdelay処理が関わる証拠。正しいコンテナで作ったことと、sampleまで元WAVに一致することは別。実fileで差が出れば形式ごとのmetadata／補正・許容方針を決め、bitrateや圧縮file byte数から声の時間を推定しない。

### 共有作業で進んだ現在の fuzzy6 と公開に必要な差分

1. **Unit3後にrail creditとsound実装が増えた。** L10 `chrome.js` はdeck.creditsとvoice.creditを重複排除してrail末尾の `.mx-credits` に追加。llm deckは `VOICEVOX:四国めたん` を設定。Unit3の「まだcredit/sound実装がない」は当時のsnapshotで、現在については訂正する。通常画面／clean／縮小時の見え方を試験したわけではない。
2. **fuzzy6も現在は文単位の全復号方式だが、fuzzy3の厳密契約をそのまま実装したものではない。** `sound.js` はページ共通のsampleRate指定なしAudioContext、fetch全bytes→decodeAudioData、AudioContext時計・AudioBufferSourceを使う。現在と前後clipの選択済みtakeを保持、範囲外や不要な話速のcacheを解放し、取得は32MiB上限、loadは15秒の待機上限。specのclip最大90秒と3clip範囲から音声が各clip時間内に収まる場合、48kHz PCMのsample領域は最大約51.84MBの比較目安（decode途中・overheadは別）。コードはbrowser bufferのhash／48kHz sample長をfuzzy3同様に厳密照合してはいない。native decodeをPromise timeoutで物理停止できる保証もこの読取りからはない。
3. **配信圧縮は未決定、WAVはGit除外。** L10 spec §7.1は「配信用の形式（圧縮）は、0.3では決めていません」「いまはWAVのまま置き、.gitignoreでWAVを除きます」。`.gitignore`は `decks/*/voice/**/*.wav`。llm deckのVite globも `**/*.wav`。local manifestには5take・合計34.678秒の記録があったが、`git ls-files 'decks/*/voice/*'` は本単位では空。ローカルで生成しただけではGit/Pagesに載るとはいえない。
4. **CIで配る音声を明示的な公開成果物にする必要。** `.github/workflows/pages.yml` はmain checkout→npm ci→test→build→distのPages upload。Engine起動・合成stepはない。従って今回の要求を満たすなら、配信用 `.opus` 等とmanifestを履歴管理し、Viteの参照／globとfile拡張子・URL対応を決め、distに含める必要がある。WAV原本の非追跡は維持できるが、配信用音声まで非追跡のままでは公開CIで再現できない。master／完全AudioQuery／engine/modelsの同梱は必須にしない。
5. **形式の第一案と代案。** 対象OSがUnit4のOgg条件を満たすなら、既存道具で作れるmono Ogg Opus VBR40kbps＋文/take単位の全復号を第一案。旧macOS/iOSも対象なら圧縮代案はMP3 mono64–96kbps、またはAAC-LC/m4a48–64kbpsを検討（どちらも現在は追加道具未導入）。道具追加なしで旧端末へ対応を急ぐならWAVをfallbackとし、Git/Pagesへ意図して含める。WebM Opusは旧WebKitの一部でOggより対象が広いが、追加muxerとdecode確認が必要で、今回の第一代案にはしない。各形式のURLをmanifestで区別し、Web Audioは復号失敗時に次形式を選ぶ必要がある（現在この機構は確認できない）。

### 未解決点・次の単位

- 音質と実file size、全対象browserのdecodeAudioDataのduration／末尾trim・再生、Opusの実際の生成成功は未測。この単位は選定根拠であり実装検証完了ではない。
- 追加AAC/MP3/WebM道具のaarch64導入可否・依存ライセンスは未調査。必要な形式を選んでからの制作作業とする。
- 現在の共有コードsnapshotのGit除外・Pages成果物の注意を報告へ反映。音声導入・公開設定・クレジットUI実装の進行は自分の変更と記述しない。
- 次は **Unit6: 全証拠の整合性・質問のcoverage・残る解釈／実測の区別**。本ターンのtoken threshold通知に従い、Unit5を完全追記してからcheckpoint/compactionを要求する。report.mdは未作成。

## Plan revision 4

学んだこと: 共有作業でrail creditとWeb Audio再生はUnit3後に実装された一方、現在の仕様はWAVをGit除外し配信用圧縮を未決定と明記している。この制作で「ローカルに音声がある」ことと「checkoutからPagesに配られる」ことを分ける必要がある。

- Unit5はOpusの形式選定に加え、配信用fileの追跡とmanifest・Vite参照の対応が公開時に必要なことを確認して完了。追加の実装作業は本調査の範囲外。
- 派生事項: **共有作業中の実装が変わるので調査での不存在を恒久的な欠陥として報告しない。** 新しい単位を増やさずUnit6でsnapshotの日付と現在の結論を整合させる。
- 残りはUnit6のみ。全研究単位の完了後はready-to-reportを返し、明示されたreport turnでのみreport.mdを作成する。

## Unit 6: 証拠の整合性・質問の網羅性・報告に残す境界

完了日時: 2026-10-11 04:49:56 UTC。Unit1–5とPlan revision1–4を全区間読み直して照合した。新たな規約判断・実装・音声生成・実機試験は行っていない。以下は既取得の証拠の整理であり、法律上の適合保証ではない。

### 資料と取得日

- **統合資料**: `/home/apm/orca/workspaces/fuzzy6/searobin/research/voice-terms/log.md` の初期計画、Unit1–5、Plan revision1–4（本単位で2026-10-11再読）。各原資料の取得日はすべて2026-10-11。
- **表示・配布条件**: W1 `https://voicevox.hiroshiba.jp/term/`、W2 `https://voicevox.hiroshiba.jp/qa/`、W3 `https://zunko.jp/con_ongen_kiyaku.html`、L8 `/home/apm/apps/voicevox-engine-0.25.2/resources/engine_manifest_assets/terms_of_service.md` と同Engineの四国めたんpolicy、W4 `https://github.com/VOICEVOX/voicevox_vvm/blob/main/TERMS.txt`。今回用いるEngine同梱規約とサイト規約は条項番号・ソフト再配布条件が異なる。報告では実物L8を根拠に含める。
- **公開ホスト**: W5 `https://docs.github.com/en/site-policy/github-terms/github-terms-of-service`、W6 licensing-a-repository、W7 additional-products-and-features、W8 github-pages-limits（完全URLはUnit2）。発効日と取得日を混同しない。
- **実例・配置**: E1 `https://zundamon-mystery-room.chita256.chatgpt.site/` と作者 `https://github.com/take365/zundasuiri/blob/main/README.md`、E2作者記事 `https://zenn.dev/takunton/articles/e1ee2ab904da1c`。L9/L10のfuzzy6仕様・実装。実例の適合認証や全画面GUIは確認していない。
- **既存判断**: L3 `/home/apm/projects/fuzzy3/docs/COMPILER.md`、L4 `/home/apm/projects/fuzzy3/docs/research/voice-narration-webgpu-2026-08-08.md` §12、L5 `/home/apm/projects/fuzzy3/docs/research/pro-review.md`、L6 `/home/apm/projects/fuzzy4/docs/narration.md`、L7 fuzzy3実装（詳細パスはUnit1）。作者方針と公式義務を区別する。
- **互換性・生成**: C1–C12のWebKit/Chromium/Microsoft/Mozilla/Apple/W3C資料と公式実装・履歴（完全URLはUnit4）、T1ローカルhelp/version、T2 `https://opus-codec.org/docs/opus-tools/opusenc.html`、T3 `https://www.rfc-editor.org/rfc/rfc7845.html`、T4 RFC6716、T5 Web Audio AudioBuffer、T6 fdkaac/LAME、T7 mkvmerge（完全URLはUnit5）。文書上対応、ソースの期待、実機での成功を分ける。

### 質問を覆うかの点検結果

| 質問 | 確定できる根拠・報告に含める内容 | 留保 |
| --- | --- | --- |
| 1. 文言・位置・実例 | Unit2 W1/W3/L8の原文。公式例 `VOICEVOX:四国めたん`。アプリでは少し探せば分かる場所。Unit3の各デッキrail／目次／トップ／README／LICENSE・NOTICEの役割表とE1/E2 | 常時表示・各クリップ焼込み・ノーマル表記・指定ファイル名は明文義務としない。トップだけ、READMEだけ、音声単独URL、clean経路の適合は個別に確定しない |
| 2. Git/Pages・商用・禁止・二次利用・教育 | Unit2 W1/W3/L8の商用非商用利用、生成音声とEngine/modelの区別、用途制限、再許諾時の義務継承。W5/W6のview/forkとホスト許諾、W7のPages商用制限 | Git/Pagesを名指し禁止する条文は見つからないが、GitHubの要求する権利と条件付き利用の両立は法律判断をせず未確定。教育を特別免除にしない |
| 3. fuzzy3/fuzzy4で使える結論と差分 | Unit1とUnit5。制作時合成、固定原稿確認、クレジット、metadata、Ogg全復号。fuzzy4のGit除外はツール事故対策。公開では条件伝達と配信成果物の追跡が必要 | `grantDownstreamReuse:false`は作者方針であり公式の全面再利用禁止ではない。pro-reviewの初期HTMLAudio案は最終方式と区別 |
| 4. 形式・ブラウザ・容量・作れるか | Unit4のmacOS/iOS各4ブラウザ×4形式×2APIの表、OS条件。Unit5の容量・ツール表、Opus時間軸、fuzzy3採用理由、全復号PCMメモリ | 最新形式対応と最低対応OSを区別。全セル実機未測。追加encoderのaarch64導入は未確認。容量は計算であり試聴・実測ではない |
| 最後の具体的作業 | 下記の統合方針を報告末尾の箇条書きにする | 本調査はプロジェクトへの実装・公開を行わない |

### 統合する具体的方針（報告用、実装ではない）

1. **表示**: 音声を使うデッキの `voice.credit` に `VOICEVOX:四国めたん`。紹介文なら `音声合成: VOICEVOX:四国めたん` とする。通常画面のrailを第一の表示場所にし、必要なら目次／「音声・クレジット」画面へ両規約リンクをまとめる。ノーマルは制作metadataに記録する任意補足。クレジットが容易に見つかることが必須で、rail常設という手段は推奨。
2. **補助表示**: トップのfooterとroot/deck READMEに同文言・両規約リンク・確認日2026-10-11・完成音声のみ配布を記す案。トップだけに表示を任せない。cleanで音を再生する共有経路を設けるなら、その経路にも表示導線を確保する。音声のみの独立作品へ拡大する場合はW2の音声クレジット案内を改めて検討する。
3. **リポジトリの最小公開物**: 配信用音声（第一案は文／take単位の `.opus`）と、それを参照するmanifest JSON。条件が追える音声近傍README/NOTICEとroot READMEのリンクを推奨。WAV master、完全AudioQuery、Engine、CORE、VVM、辞書は今回の配布必須物にしない。音声が将来のコードLICENSEの対象に無条件で含まれないよう範囲を明記する。NOTICEという名前や規約全文同梱を公式義務にしない。
4. **manifestの提案項目**: file URL、codec/container、提示時間（秒、必要なら48kHz Opus ticks）、原本sample rate、話者・style、credit、制作Engine版、音声hash、規約URLと確認日、作者の再利用方針。これらは制作・同期・条件伝達の推奨で、全項目が規約必須ではない。原本24kHz、Opus48kHz時刻、実際のAudioContext sampleRateは別々に扱う。圧縮byte数から長さを推定しない。
5. **二次利用の説明**: `grantDownstreamReuse:false`を採るなら「作者として独立素材再利用への追加許諾を与えない」と説明し、GitHub内のview/forkまで禁止とは書かない。条件案内の例は「本リポジトリの音声はVOICEVOX（四国めたん・ノーマル）で生成しています。適用される許諾に基づいて利用する場合は、クレジット `VOICEVOX:四国めたん` と音源規約を守り、他者へ利用を許諾する場合も同条件の遵守を義務付けてください」。この案内自体が新たな利用許諾なのか曖昧にならないよう、作者の選んだ方針を別に明記する。GitHub ToSとの関係や生成音声の著作権成立はこの文面で解決したとしない。
6. **形式**: 対象OSがOgg条件を満たすならmono Ogg Opus VBR40kbpsを第一案。旧OSも対象ならMP3 mono64–96kbps、またはAAC-LC/m4a mono48–64kbpsを圧縮代案（追加道具未導入）とする。追加道具なしならWAVの暫定fallback。WebMはOpusを一部の旧WebKitに広げられるが追加muxerを要し、万能fallbackにはならない。
7. **公開までの技術差分**: Unit5取得時点のfuzzy6はrail creditと文単位Web Audio全復号を実装済み、圧縮未決定・WAV Git除外。配信用ファイルとmanifestの追跡、Vite参照拡張子、distへの同梱を整合させる。複数形式ならWeb Audio側でURL選択・decode失敗時の次候補を実装し、実ファイルで長さ・末尾・seek・字幕同期、公開URL直リンクと縮小表示を確認する。現行コードが将来もこのsnapshotのままとは言わない。

### 報告に残す不確実性と派生質問の扱い

- 法的・解釈上: 見つけやすさの具体的基準、単独音声とアプリ構成ファイルの境界、教育と禁止領域の境界、GitHubへの広い許諾と条件付き音源利用の関係。規約本文に施行・改定日がない資料は取得日だけを記す。個別適合に権利者が必ず答えるとは案内しない。
- 技術上: Safari各OS/版への修正の配布状況と実ファイルdecode、M4A brand/delay、試聴した音質・実サイズ、追加道具のaarch64導入。今後の制作・公開前の確認対象として残し、調査を終えられない理由とはしない。
- 派生質問「公開Gitのforkと独立再利用」「ホスト許諾と音源条件」は元の配布質問に必要なのでUnit2で追究し、後者の法的結論のみ未解決。別の目的へ置換はしていない。合成・追加encoder導入・ブラウザ実機試験は本調査の範囲外として推奨次作業に残す。
- 共有作業で仕様・実装が変化したためPlan revision3/4で差分を更新した。報告ではUnit5の最新取得snapshotを使い、Unit1/3の「ない」という記述を恒久的な欠陥にしない。
- 最終報告の構成: 日本語の要約、確認日と原文、表示場所の必須／推奨表、公開・二次利用・教育の条件、fuzzy3/fuzzy4の継承／差分、8ブラウザ行の対応表、形式別の容量／ローカル生成表、fuzzy3の理由、留保・計画の変化、fuzzy6で行うことの箇条書き。直接URLを引用し、実例の証拠の強さも示す。

### 完了と次の単位

最新Plan revision4の全研究単位（Unit1–6）は完了。追加調査単位は不要。`report.md`はこのターンでは作成しない。次はattendantが明示する**報告ターン**でこのログを読み直し、`research/voice-terms/report.md`を書く。

ボスのtoken threshold通知を受け、Unit6の完全entryを追記してからcheckpoint/compactionを要求する。終了状態は `continue`、unitは `ready-to-report`、noteに `ready to write report`、checkpointはtrue。報告ターンではcheckpointを要求せずdoneで終了する。

## 報告ターン完了

完了日: 2026-10-11（UTC）。attendant の明示「This is the report turn」に従い、初期計画・Unit1–6・Plan revision1–4を全区間再読し、`research/voice-terms/report.md` を日本語で作成した。

- 成果物: `report.md`（220行）。要約、規約原文と確認日、表示場所の必須／推奨表、公開Git/Pages・二次利用・教育の条件、既存fuzzy3/fuzzy4の継承と差分、macOS/iOS各4ブラウザの2API対応表、形式別容量とローカル生成能力、fuzzy3の採用理由、未確定事項、計画の変化、fuzzy6の具体的作業を収録。
- 根拠: 本ログに記録した一次資料とローカル資料（取得2026-10-11）。新しい研究単位・法的判断・合成・変換・導入・公開・実機試験は行っていない。GitHubホスト許諾、表示の具体的基準、Safari修正のstable配布状況、実ファイル復号等の留保を残した。
- 検証: 必須4質問と末尾作業一覧の対応、8ブラウザ行、確認日・実機未測の注記・資料リンクを確認。出力ディレクトリの成果物は `log.md` と `report.md` の2ファイルのみ。今回の書込みもこの2ファイル内だけ。
- 次: 調査は完了。報告に挙げた制作・実機確認・公開前判断は実装担当／作者の次作業であり、この研究の未完単位ではない。報告ターンの規定に従いcheckpointを要求せず、`state: done`、`unit: report`、`checkpoint: false`で終了する。
