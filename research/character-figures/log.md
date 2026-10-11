# 四国めたん・ずんだもんのウェブ用立ち絵調査ログ

## 質問・範囲

四国めたんとずんだもんを fuzzy6 の字幕帯の左右に同時表示し、VOICEVOX 音声に合わせた口パクを行うため、立ち絵候補、素材・キャラクター・音声の規約、音素と差分の対応、PSD の PNG 書き出し手段、公開 Git に置けない場合の代案を調べる。最重要の問いは、画像／書き出した部品を公開リポジトリ `advantame/fuzzy6` に収録して GitHub Pages に配信できるか。個人・非商用の解説、All rights reserved のプロジェクトという条件で評価する。

開始 UTC: **2026-10-11 07:21:02 UTC**。

出力はこのディレクトリの `log.md`（追記のみ）と最終 `report.md` のみ。素材本体の取得、依存導入、VOICEVOX Engine 起動、プロジェクト編集、公開操作、問い合わせ送信は行わない。配布ページ／規約／作者の公開説明を一次資料として優先し、確認日と短い引用を残す。分からないレイヤ名は推測で埋めない。

## 初期計画

単位は「調べる問い × 情報源群」。新しい問い・資料によって計画を改訂し、その理由を追記する。

1. **ローカルの前提・実装境界 × AGENTS.md、docs/spec.md、既存音声調査、LICENSE、公開 CI**。幾何、音声同期、現在の権利方針と調査の制約を確定する。
2. **公式素材・キャラクター利用条件 × zunko.jp の配布ページ、ガイドライン、FAQ**。公式候補と形式、個人／同人／企業、改変・再配布、ウェブ／Git の明文を調べる。自作二次創作の条件も扱う。
3. **坂本アヒル素材の入手・差分・許諾 × 作者の配布ページ、規約、公開発言**。四国めたん／ずんだもんを比較し、素材再配布とウェブ配信／公開 Git の境界を確認する。
4. **その他の実用候補 × 解説用途の立ち絵作者の一次配布ページ・規約**。双方を揃えられる候補を優先し、入手の登録、PSD／PNG、口・目差分、絵柄と上半身使用、クレジットを確認する。「広く使われる」の根拠と単なる候補の発見を区別する。
5. **ずんだもん音声の差分 × VOICEVOX／SSS の規約、公式 FAQ、公開 source／同梱資料**。四国めたんの既存調査との差分と exact credit を確認する。Engine は起動しない。
6. **口パク・瞬きの慣習 × YMM4 公式文書、PSDTool／PSDToolKit 公式文書・source、VOICEVOX の音素・時間データ定義**。a i u e o／N／cl／pau／子音／無声母音と差分対応、レイヤの命名、瞬きの目安を調べ、慣習と実装提案を分ける。
7. **PSD 書き出しの実現性 × psd-tools／ag-psd 公式文書・source、必要最小限の読み取り環境確認**。Linux aarch64 で venv／node_modules のみを使う手順、合成と個別レイヤの違い、位置・透明度・マスク、資源上限を整理する。実素材での書き出し試験・導入はしない。
8. **公開方法の選択 × 各素材の許諾の照合、GitHub の一次規約、代替構成**。Git／Pages／外部ビルド取得／手元利用／自作・依頼制作の違い、All rights reserved と第三者条件の分離を整理し、ボスの決定事項を確定する。必要なら明文の不足を埋める追加検索を行う。

全単位完了後はログを確定して `ready-to-report` を返す。その次の、attendant が明示する report turn でログを読み直し、日本語の `report.md` を書く。

## Unit 1: ローカルの前提・実装境界

完了・確認日: **2026-10-11 UTC**。

### 参照資料

- `/home/apm/orca/workspaces/fuzzy6/searobin/AGENTS.md` — 2026-10-11取得。ユーザーが提示した機体規則も遵守する。
- `/home/apm/orca/workspaces/fuzzy6/searobin/docs/spec.md` — 2026-10-11取得、版0.4（2026-10-11改訂）。全文を区間に分けて読んだ。
- `/home/apm/orca/workspaces/fuzzy6/searobin/research/voice-terms/report.md` — 2026-10-11取得。四国めたん規約・公開 Git に関する既存判断の関連箇所を確認。今回のずんだもん・画像規約は独立に確認する。
- `/home/apm/orca/workspaces/fuzzy6/searobin/LICENSE` — 2026-10-11取得。
- `/home/apm/orca/workspaces/fuzzy6/searobin/.github/workflows/pages.yml` — 2026-10-11取得。
- 初期のウェブ探索で公式資料 https://zunko.jp/guideline.html と https://zunko.jp/con_illust.html を発見（2026-10-11）。検索抜粋を規約の最終的な根拠にはしない。本文確認は Unit 2 で行う。

### 出典に基づく事実

1. **AGENTS.md／仕様§2**: 論理座標1920×1080、ステージ1600×900、左 rail 320×900、下 bar 1600×180。立ち絵を置く候補位置は下の字幕・シーク帯であり、既定の幾何を変える機能は仕様から設計する必要がある。本調査は実装／レイアウト決定を行わない。
2. **仕様§3.2・§7**: `deck.credits` は rail に文字列を並べ、`voice.credit` は自動で追加される。既存音声 credit は `VOICEVOX:四国めたん`。立ち絵作者の credit と音声 credit は異なる権利の表示であるため、候補規約の調査で別々に確認する。
3. **仕様§5.2・§6.7・§7.1**: 音声は制作時に文ごとに合成し、Opus と manifest を配信する。クリップ時計を音声位置に合わせ、文の開始、長さ、印の時刻を時間割から求める。現 manifest の例は duration・anchors・hash 等で、音素ごとの口形タイムラインを公開契約としては定義していない。
4. **仕様§7・§9**: 現在の `deck.voice`／manifest は一話者の構造で、同時に鳴らす声は一つと明記される。**二人の立ち絵の同時表示は二人の同時発話を意味しない**。話者交代の指定や口パクデータの追加は、今後の設計で検討すべき差分。本依頼から同時発話の機能を要求されたとは解釈しない。
5. **仕様§6.1・§8・§9、AGENTS.md**: 描画は時刻の純粋関数、乱数は種付き、シーク・静止表示でも同じ時刻は同じ絵。口パクと瞬きも再現可能な時刻の関数にする提案がこの方針に整合する。停止中に新たな無制限の timer を回す案はこの方針から導かれない。
6. **LICENSE**: 全体は All rights reserved で、GitHub 規約内の閲覧・fork、公開サイトの閲覧、法定利用を除外している。第三者の音声・書体の条件を別に案内している。新たな立ち絵を作者 `advantame` の著作物・一律の再利用禁止許諾として扱えるかは、素材元の許諾を照合して判断する必要がある。
7. **Pages workflow／AGENTS.md**: 公開 CI は checkout → npm ci → test → build → dist 配信。現在は外部の立ち絵取得 step を持たない。本依頼の通常方式では公開 Git へ画像を置く必要がある。main への merge／push はボスが保留しており、本調査も公開操作を行わない。
8. **既存音声調査**: 四国めたん生成音声の利用とモデル・素材の再配布を分け、GitHub のホスト許諾との関係を未確定として残している。画像素材への当てはめは別の原文確認が必要。既存報告の「音声の Git 掲載を名指しで禁じる条文なし」を、立ち絵の再配布許諾と読み替えない。

### 未解決点

- 公式・各作者が、表示用に書き出した部品 PNG をウェブで送ること／公開 Git に置くことをどう扱うか。登録・ファイル形式・差分名はまだ未確認。
- 音声の二人対応と口パクデータの仕様は未設計。今回は素材選定・規約・慣習の材料を報告し、実装を決めない。
- 自作の絵の公開に素材再配布禁止が及ぶか、キャラクターの条件と作者素材の条件を分けて調べる必要がある。

### 次の単位

**Unit 2: 公式素材・キャラクター利用条件 × zunko.jp 配布・ガイドライン・FAQ**。今回の token threshold 通知を受け、Unit 1 の記録を完了して checkpoint を要求する。公式本文の確認は次の continuation から始める。

## Unit 2: 公式素材・キャラクター利用条件

完了・確認日: **2026-10-11 UTC**。

### 参照資料・確認方法

- https://zunko.jp/guideline.html — 2026-10-11取得。キャラクター利用の手引き、Q&A、末尾の「キャラクターイラスト利用のガイドライン」を本文で確認。
- https://zunko.jp/con_illust.html — 2026-10-11取得。ウェブ抽出では動的な画像一覧が落ちるため、HTML／埋め込み JavaScript を urllib でメモリ上に読み、`addImg` と対象キャラの登録列を確認した。素材リンクを生成する source は確認したが、PNG／PSD／ZIP 本体は取得していない。
- https://zunko.jp/con_shoushi.html — 2026-10-11取得。地域外の企業商用、個人のゲーム／アプリ等の小口データ販売向けの入口を確認。価格の詳説は今回の非商用条件の判断に不要。
- 公式ドメインで「GitHub イラスト」「素材 再配布」「PSD 口」「met_s222」等を検索（2026-10-11）。2D部品 PNG の公開 Git を明示して扱う公式説明はこの範囲では発見できなかった。検索不発は不存在の証明ではない。

### 公式候補・入手の確かな点

- 配布ページは会員ログインのないページで、同一サイトの `/sozai/<dir>/<file>.<ext>` を通常の download link として生成する。**ページ上、会員登録の要求はない**。配布ファイル自体の取得によるアクセス試験はしていない。
- `addImg` は拡張子省略時を PNG とし、PSD を別途明記する。ずんだもんには人型の列中に `zunmon008.psd`、sourceの「ここから妖精」以降に `zmon_2003.psd` がある。配布場所は上記ページ、リンク先は https://zunko.jp/sozai/zundamon/zunmon008.psd と https://zunko.jp/sozai/zundamon/zmon_2003.psd （本体未取得）。多数の通常 PNG もある。
- 四国めたんには PNG と、sourceで「ここからSD」と区別された **`met_s214`～`met_s222` の9 PSD** がある。例 https://zunko.jp/sozai/methane/met_s222.psd （本体未取得）。ずんだもんにも SD の PNG 登録がある。SDは配布sourceの区分であり、正確な頭身や表情数を画像から測定したものではない。
- 公式はキャラクターデザインを江戸村ににこと案内。通常絵／SD／人型／妖精の選択肢はあるが、**PSDだから口パク用とは限らない**。配布ページに、口・目の差分一覧、あいうえお対応、閉じ／ん、レイヤ実名、半閉じの有無の説明は発見できない。これらは未確認とする。上半身切り抜きは規約上許可されるが、絵ごとの使いやすさはプレビュー選定後の確認事項。
- `output_ng` という内部フラグは、ページsourceでは公式の画像URL一覧をサーバへ渡す特定処理の除外に使う。画像download linkは生成される。**この変数名を素材の書き出し禁止や権利条件と解釈しない**。

### キャラクター・公式イラストの条件（guideline.html に帰属）

- 本件の個人非商用利用は事前申請不要。四国めたんを含む東北三姉妹以外にも非商用可と明示。同人は原価回収目的の節度ある有償販売まで認め、一般商流／大規模営利は別扱い。
- 地域内企業等の無償商用対象は、ずんだもんは東北6県、四国めたんは四国4県。住所／本籍・企業名等の表示条件がある。地域外企業商用はライセンス窓口。本件の非商用には所在地の確認は不要。
- 個人ブログ／動画の通常広告等や一般の配信は非商用範囲という例外がある。他企業スポンサー案件等は別扱い。音声で商用可でも、キャラ／イラストはこの条件を独立して満たす必要がある。
- 技術紹介のウェブ／書籍を例外的商用可とするQ&Aは、プログラミング・3Dなど**キャラクターの利用方法を広げる目的**を説明する。数学解説一般へこの例外を広げる必要も根拠もない（今回は通常の非商用で評価）。
- Web／アプリ利用を認めるQ&Aがある。短い引用は「携帯のアプリやWebページに使うことも可能です。」。公式素材の切り抜き、色変更、フィルタ、画像の重なり、認識可能な服装変更が認められる。縮小／部品別PNG書き出しという工程名は明示されないが、認識を保つ通常の表示加工は広い許諾に含まれるとの見立て。ただし加工の許可と加工済み部品の独立配布の許可を分ける。
- コピーライト(c)は必須でない。声のVOICEVOXクレジットとは別。任意表示案は `キャラクター・公式イラスト：東北ずん子・ずんだもんプロジェクト（SSS LLC.）` と公式素材／ガイドラインへのリンク。
- 自分で描いた二次創作利用を認める。他人の絵にはその作者の権利と追加条件があり、SSSの許可だけで使えない。`（ず・ω・きょ）` はガイドライン準拠・他クリエイター等の自由利用を意図する表示。**自作絵をAll rights reservedで管理したいなら、この自由利用表示を必須と思って付けない**。自作絵の権利とキャラクターの権利は分離する。
- 主な禁止群は原作不明の改変、二次創作無断利用、商標／意匠による独占、素材そのもの／素材主体の販売、権利侵害・著しいイメージ毀損、特定者・団体・国家の非難／加害、政治宗教関連の応援・批評・情報提供、情報商材等の販売宣伝、意図的虚偽、指定風俗業、反社会的勢力、禁止行為の助長。自作絵にもキャラクター条件は残る。

### 公開 Git と再配布についての見立て

- **確かな点**: ガイドラインには素材自体の「販売」禁止があり、2D画像の無償再配布一般を名指しした禁止文は今回確認した本文に見つからない。3D改造再配布は明示許可だが2D部品へ自動で適用できない。
- **重大な未確定点**: 禁止事項10は「再許諾」を禁止し、本文は「ライセンス権の全部または一部を、再許諾することは禁止」とする。Git／fork／ホスト契約との関係、表示用に最小化したPNGをGitに含める行為が無償素材再配布なのか作品への組込みなのかは明文で決められない。
- **暫定判定**: 本件のウェブで公式絵を表示する目的には根拠がある。ただし **公式2D素材を公開リポジトリへ収録してよい、と確定する材料は不足**。単に再配布禁止が見つからないことも、再許諾禁止に反しない証拠にはならない。Unit 8でGitHub規約と合わせ、Pages配信・Git収録・再利用許諾を区別する。
- 自作を使えば第三者作者の「素材再配布禁止」はなくなるが、SSSのキャラクターガイドラインと再許諾禁止の問題まで消えるとはいえない。この点を最終比較と推奨行動に残す。

### 未解決点と次の単位

公式PSDの口・目の実レイヤ構成、正確な頭身、対象素材ごとの部品加工／Git許諾は未確認。素材本体未取得の制約下では、未確認と明記して候補比較する。**次は Unit 3: 坂本アヒル素材 × 作者配布・規約・公開発言**。本turnのtoken threshold通知に従い、Unit 2記録を完了してcheckpointを要求する。

## Unit 3: 坂本アヒル素材の入手・差分・許諾

完了・確認日: **2026-10-11 UTC**。

### 参照資料・取得方法

作者の一次配布ページ（全て2026-10-11確認）:

- https://seiga.nicovideo.jp/seiga/im10788496 — ずんだもん無印。本文の現リンク先は2.3。
- https://seiga.nicovideo.jp/seiga/im11206626 — ずんだもんV3.2。
- https://seiga.nicovideo.jp/seiga/im10791276 — 四国めたん2.1。
- https://seiga.nicovideo.jp/seiga/im11020697 — ちびめたん。
- https://www.pixiv.net/artworks/92641351 — 作者のずんだもん配布投稿。ページ抽出不可だが https://www.pixiv.net/ajax/illust/92641351 の公開captionで、作者名・題名・配布条件・同じ配布リンクを確認。
- ニコニコの公開テキストAPI https://seiga.nicovideo.jp/api/illust/info?id=10788496 、https://seiga.nicovideo.jp/api/illust/info?id=11206626 、https://seiga.nicovideo.jp/api/illust/info?id=10791276 、https://seiga.nicovideo.jp/api/illust/info?id=11020697 。HTML画面の途中で省略される更新説明を、このXMLのdescriptionで全文確認した。
- https://ux.getuploader.com/s_ahiru/download/37 、https://ux.getuploader.com/s_ahiru/download/59 、https://ux.getuploader.com/s_ahiru/download/35 — ZIPを取得せず、ファイル名・パスワード入力フォームだけを確認。ちびめたんの https://ux.getuploader.com/s_ahiru/download/41 は作者本文のリンクを確認したが、このdownloadフォームは未読。
- https://zunko.jp/guideline.html — 2026-10-11再確認。特に（ず・ω・きょ）の意味、二次創作者の別権利、再許諾禁止を照合。

補助資料（作者本人の許諾を代替しない、全て2026-10-11確認）:

- https://dev.ore-shika.com/post/ymm-lipblink/ — 坂本アヒルずんだもん2.3を実際に操作した使用者の説明（2025-12-02）。口・目のパスをテキストで確認。初心者メモなのでソフト仕様や規約判断の根拠にはしない。
- https://nightwork.sakura.ne.jp/ukagaka/shell/Shikokumetan_Zundamon_Shellkit/Shikokumetan_Zundamon_Shellkit.html — 使用者が2.1／2.3を加工しシェルとして配布した事例。作者が許可した事実までは示さない。
- https://github.com/kasei-san/zundamon-notify と https://raw.githubusercontent.com/kasei-san/zundamon-notify/main/scripts/generate-variants.py — 公開Gitでの利用例とテキストscriptの探索。scriptは色変更処理で、口・目差分の確認資料にならなかった。画像本体は取得していない。このGitの存在は権利者の許諾証拠ではない。
- https://www.youtube.com/watch?v=ulke1mX2HA4 — Saityoの解説／製品検証動画の概要検索結果に両キャラの立ち絵を坂本アヒルと記載。実際の利用者が作者を示す例として参照し、素材利用規約の根拠にはしない。
- 「坂本アヒル 再配布」「sakamoto_AHR 再配布」「坂本アヒル クレジット 不要」「坂本アヒル GitHub」「四国めたん／ずんだもん あいうえお 口」等を検索。作者のGit名指しの声明・完全な差分一覧は発見できなかった。

web抽出ではニコ静がnon-retryable、uploaderのuuドメインが403だったため、正規のseiga／ux URLへurllibで上限を付けてHTML/XML/JSONだけをメモリ上で取得。ZIP、PSD、PNG、サムネイル本体、パスワード送信は行っていない。関連しないブログや別キャラ「雨衣」の禁止条件を、この二人の素材へ転用しない。

### 候補・登録・形式・絵柄

1. **ずんだもん無印（現配布2.3）**: 配布はim10788496、ZIPフォームはdownload/37、作者が公開するpassは `zunda`。ZIPファイル名は「ずんだもん立ち絵素材2.3.zip」。作者はPSDTool対応と明記、使用例には中の「ずんだもん立ち絵素材2.3.psd」と記載。PSD候補であり、同梱PNGの有無は未確認。
2. **ずんだもんV3.2**: im11206626、download/59、「ずんだもん立ち絵素材V3.2.zip」、pass `zunda`。作者の2023-09-03更新説明は、構造を簡単にしたPSDの「通常版」「上向き版」を追加、顔のバランス等を調整とする。無印2.3のレイヤ名をV3.2へ無条件に引き継がない。
3. **四国めたん2.1**: im10791276、download/35、「四国めたん立ち絵素材2.1.zip」、pass `ch4`。作者はPSDTool対応と明記、更新に非表示レイヤーを追加と書く。PSDの候補。同梱PNGは未確認。
4. **ちびめたん**: im11020697、download/41、pass `ch4`。作者の説明は「やや子供っぽくアレンジしてます。」、PSDTool対応。ずんだもんとの見た目の組合せを変えたいときの追加候補。名称だけから正確な頭身を断定しない。
5. 配布ページおよびZIPフォームはログインなしで閲覧できた。uploader上部には会員登録／サインインへのナビがあるが、**ダウンロード条件のフォームは会員ログインでなくパスワード認証**。登録必須の表示は見つからず、登録不要の経路が用意されているとの見立て（実際の認証・ダウンロードはしていない）。ニコ静／pixivでの閲覧制限と、外部uploaderでの取得条件を分ける。
6. 小さめのデフォルメ人型、親しみやすい解説向けという使用例があるが、今回は画像を取得／測定していない。**正確な頭身は未確認**。通常めたんと子供風ちびめたんを区別。上半身へのcropは公式に準拠する通常改変の見立てでは可能で、口・目と体を分けて使う使用例もある。ただし選ぶ姿勢・衣装・腕が上半身の枠に収まるかは個別previewで確認が必要。
7. 広く使われていることは、解説動画の本人credit、動画制作ツールの多数の案内・実用例から裏付けられる。検索時点の閲覧数や人気順位を選定の定量根拠にはしない。

### 口・目差分：確定できた範囲

**作者本文に帰属する差分名**:

- ずんだもんV3.2に追加された口は **「えへ」「ほほえみ」「あは」**、正面向き眉は「基本眉2」。これで全口差分・5母音対応を証明したとはしない。
- 四国めたん2.1更新は、目 **「くるぐる」**、左腕「ひそひそ」「マイク」、「バスタオル」、「かげり」、PSDTool用非表示レイヤー追加を説明。
- 作者の配布captionには、両者のあ／い／う／え／お／んの口一覧、閉じ目／半閉じ目の全名称・個数はない。

**使用者が2.3で操作した名前（補助、全inventoryの保証なし）**:

- https://dev.ore-shika.com/post/ymm-lipblink/ は口 `口/むふ`（閉じ）、`口/ほー`（中間）、`口/ほあー`（開き）を順序付ける。
- 同記事は目を白目＋黒目の合成として説明し、`目/目セット/普通白目` と `目/目セット/黒目/普通目`、閉じかけ「細め目」、閉じ「なごみ目」を挙げる。目を差分PNG化する際は黒目の残りに注意する材料になる。
- **この記事の記載は作者一次のレイヤ一覧でも実PSDの検査結果でもない**。実採用前に正規取得した選定versionで照合する必要がある。a i u e oの5形とN専用形が揃うとの情報は確認できないため、3段階開閉なら実装できるとの候補評価に留める。

### 利用条件・credit・公開Gitの見立て

- **作者の一次許諾**: 4つの対象投稿の全てに「公式の規約の範囲なら何に使ってもだいじょうぶ！」と **`（ず・ω・きょ）`** の表示がある。ずんだもん無印だけには、こっそり扱うべきものはそう扱う旨の補足がある。キャラ公式の非商用／同人／企業・禁止用途の条件はUnit 2のまま適用される。
- **作者credit**: 作者本文に追加の必須credit書式や親作品登録義務は見つからない。公式の（ず・ω・きょ）Q&Aもcreditが任意で申請なしと説明。任意でも出典管理のため **`立ち絵：坂本アヒル`** と対象投稿URL・versionを掲載する案を推奨。VOICEVOX表記の義務とは別。
- **改変**: 公式条件へ準拠する広い許諾と自由利用表示があり、認識を保つ切り抜き・縮小・部品書き出しには肯定的な根拠がある。ただしこれらの工程を作者が逐語列挙したわけではない。公開画像としての変形と、素材部品の独立公開は別に評価する。
- **再配布**: 調べた作者本文に素材そのものの無償再配布禁止はない。むしろ（ず・ω・きょ）を明記して公式条件へ準拠する他者利用を許している。このため、一般的な「坂本素材は再配布不可」とする断定は本件の一次説明と合わない。シェル配布者も再配布可と解釈しているが、それ自体を許諾の証拠にしない。
- **確かな点**: 本件の個人非商用ウェブでの画像表示には、作者の広い許諾＋公式Web利用Q&Aという二段の根拠がある。部品を加工することに作者独自の禁止は見つからない。
- **未確定点**: 作者は「公開Git／GitHub Pages／fork」を名指しで説明していない。公式の再許諾禁止は残り、公開Gitの最低限のホスト／fork許諾が、作者・SSSへ独立に準拠する利用で済むかが明文で決められない。**公開Git収録は他候補より根拠が強い有力案だが、断定的な「無条件OK」にはできない**。Unit 8でこの表示とGitHub規約を具体的に照合する。
- **All rights reserved**: この素材は作者が他クリエイターへ直接与えている自由利用条件を持つ。fuzzy6の独自コード・編集物の再利用禁止とは分け、第三者素材の条件を案内する必要がある。素材自身を「advantameが全権利保有・作者の許諾を含め他者の再利用を全部禁止」と表示するのは適切でない。許諾の出所は原作者／SSSにある。

### 未解決点と次の単位

実PSD未取得につき全口・全目の実レイヤ名、5母音／N専用差分、頭身・姿勢の実測、archive内READMEの追加条件は未確認。これらを隠して完全な素材仕様と扱わない。配布作者の広い許諾は確認できたので、登録や主張の不足だけを理由に調査全体をblockedにしない。

**次は Unit 4: その他の実用候補 × 作者の一次配布・規約**。akihiyo、のんたお、浅井麻等の両キャラ候補を探索し、候補数を増やすためだけに同等素材を無制限に集めない。本turnのtoken threshold通知に従い、Unit 3をここで完了しcheckpointを要求する。

## Unit 4: その他の実用候補・作者別の利用範囲

完了・確認日: **2026-10-11 UTC**。

### 参照資料・確認方法

作者の一次資料（全て2026-10-11確認）:

- akihiyo: https://seiga.nicovideo.jp/seiga/im10792934 （立ちずんだもん素材）、https://seiga.nicovideo.jp/seiga/im10796593 （立ちめたん素材）。HTML抽出が失敗したため、公開テキストAPI https://seiga.nicovideo.jp/api/illust/info?id=10792934 と https://seiga.nicovideo.jp/api/illust/info?id=10796593 でcaption全文を確認。
- akihiyo のプロフィール https://seiga.nicovideo.jp/user/illust/20132633 と https://www.nicovideo.jp/user/20132633 。ログイン不要の本文・公開descriptionは短い挨拶と https://twitter.com/AKlHlYO の案内のみ。追加の素材規約はこの部分にない。
- akihiyo配布場所 https://ux.getuploader.com/hiyohiyo25252/ は一覧を取得。captionが指定する https://ux.getuploader.com/hiyohiyo25252/download/3 と https://ux.getuploader.com/hiyohiyo25252/download/4 はweb抽出／urllibとも取得失敗（403等）。素材本体は取得していない。
- のんたお: https://seiga.nicovideo.jp/seiga/im10857524 （のんたお式ずんだもん立ち絵 ver.2.0）、公開caption全文 https://seiga.nicovideo.jp/api/illust/info?id=10857524 。配布リンク https://ux.getuploader.com/nontao/download/45 はcaptionで確認、フォーム取得は403等で失敗。
- 浅井麻: https://asavo.fanbox.cc/posts/2535217 （四国めたん／ずんだもん配布）、https://asavo.fanbox.cc/posts/2011932 （動画へのイラスト利用ルール、本文更新2022-09-02）。FANBOXの通常抽出はiframeだけだったため、www.fanbox.ccの同投稿HTMLと公開JSON https://api.fanbox.cc/post.info?postId=2535217 、https://api.fanbox.cc/post.info?postId=2011932 を確認。JSONの `body.post` の本文、feeRequired=0、isRestricted=false、添付fileMapの名前・拡張子のみを読み、画像・ZIP・ファイルのURL先は取得していない。
- 浅井麻の補足（作者） https://kakuyomu.jp/works/1177354055409884147/episodes/16816700429167142445 、作者のID一覧 https://kakuyomu.jp/works/1177354055409884147/episodes/16816700428995032936 と通常一覧 https://kakuyomu.jp/works/1177354055409884147/episodes/16816700429190295813 。
- 浅井麻の個別一次caption: https://seiga.nicovideo.jp/seiga/im10785964 （通常ずんだもん）、https://seiga.nicovideo.jp/seiga/im10790258 （SDずんだもん）、https://seiga.nicovideo.jp/seiga/im10787066 （通常めたん）、https://seiga.nicovideo.jp/seiga/im10792060 （SDめたん）。対応する公開API `https://seiga.nicovideo.jp/api/illust/info?id=<数字>` で全文確認。

探索・実用例・差分の補助資料（作者の許諾を代替しない、全て2026-10-11確認）:

- https://www.the-time.jp/tachie/ — 候補リンクの発見とakihiyo PSD利用例。記事の人気評・加工制約の断言は作者規約として引用しない。
- https://trap.jp/post/1565/ — 大学同好会の実利用記事。akihiyoの両キャラ配布ページを引用。
- https://www.simulationroom999.com/blog/with-voicevox-and-aivisspeech-characters-creating-videos-using-standing-pictures-preparation/2/ — akihiyo PSDを操作した使用者の記事（2025-05-13／14）。既存の口では母音形が不足し、「い」を追加制作したと本文にある。原素材の完全inventoryや作者による改変許諾の証明にはしない。
- https://www.simulationroom999.com/blog/voicevox-lipsync-openai-local-llm-engine-core-comparison/ と https://github.com/KEIKEI999/VoiceVoxLM — 使用者の技術例と素材同梱例。GitHub公開tree metadataも確認したが、作者README／規約の写しを見つけられなかった。公開Gitの存在を許諾証拠にしない。
- https://jikan-dorobo.com/cast/ — akihiyoずんだもんを実際に使うサイト自身のcredit例。これは作者がウェブ利用を許可した証拠にはならない。
- https://www.youtube.com/watch?v=b0QAlsgr4bA の概要を https://yutura.net/channel/78794/video/b0QAlsgr4bA/ の検索抽出で確認。ひなちゃもんの「ちっちゃずんだもん2」作者creditにのんたおがある。ただし**別variantであり、im10857524の規約を自動適用しない**。作者の実使用例があることだけの補助。
- 浅井麻の配布投稿に、本家の解説動画で使用との記述と https://www.nicovideo.jp/watch/sm39116000 の埋込がある。作者からの実用紹介として確認、動画本体は取得していない。

HTML/XML/JSONの取得は各URL15〜20秒、100〜700KBの読み取り上限でメモリ上のみ。素材本体、画像preview、ZIP、PSD、PNGは未取得。登録・認証・パスワード送信なし。akihiyo／のんたお／浅井麻の規約・credit・再配布・口形を有限の検索で探索したが、検索不発を権利放棄と解釈しない。

### 候補比較の材料

**akihiyo（両キャラ）**:

- 正規配布入口は上記ニコ静2投稿。ずんだもんcaptionのpassは `zunda`、めたんは `metan`。リンク先はそれぞれdownload/3／4。作者はめたんを「四国めたんの足が短い立ち絵です。」と説明。デフォルメされた短い脚の人型で両者の絵柄を合わせられる候補。正確な頭身・crop後の構図は画像未検査につき未確認。
- PSD形式で使う使用者の記事がある。作者captionは形式や完全レイヤ構成を記載していないので、形式は「PSD（実利用記事で確認）」、同梱PNGは未確認とする。入手は公開pass付き外部uploader、作者captionに登録必須の記載なし。ただしフォーム取得失敗なので登録要否を実アクセスで確定できない。
- 使用者はめたん／ずんだもんの口形不足を説明し、めたんの「い」を「え」から横に引き延ばし、レイヤ名を「あいうえお」に付け直している。**この「あいうえお」は元からの作者レイヤ名ではない**。同記事の画像altには「なごみ」「笑い」等があるが、作者の実ファイル名称一覧としては未確定。
- 作者の追加credit義務、改変／部品PNG配布／商用／ウェブ／Git許諾を一次資料で確定できなかった。任意に `立ち絵：akihiyo`＋各配布リンクを出すことは出典表示案であって義務の確認結果ではない。上半身cropも禁止と決めないが作者追加条件未確認。**公開Git採用は判断保留**。利用者のGit同梱やブログの一般的な「規約を守る」記載を原作者の許諾へ読み替えない。

**のんたお式ずんだもん ver.2.0（ずんだもんのみを今回確認）**:

- 作者はPSDTool対応、必要に応じた加工・加筆可と明示。captionリンクはdownload/45、pass `maru25`。登録必須とは書かれていないが、外部フォームを確認できず、実ダウンロード未試験。PSD候補、同梱PNGの有無、正確な頭身、全口／全目のレイヤ名、5母音／N形は未確認。
- 公式ガイドライン準拠＋良識の範囲、動画の収益化は公式が許す範囲で可、収益化以外の商用不可。短い禁止の原文は **「立ち絵の二次配布」**。他に政治・宗教・誹謗中傷・残虐・批判的内容、イメージ毀損、グッズ化、原型を留めない改変、AI学習を禁止。
- 作者captionに必須credit書式を発見できない。出典表示案は `立ち絵：のんたお`＋対象投稿URL。加工可からcrop／縮小・部品書き出しは通常加工として見立てられるが、**公開Gitで部品を渡すことは二次配布禁止に抵触する見立てが強く、そのまま採用しない**。
- Web表示を名指しした許可・「画像を送信するだけなら再配布でない」という作者説明は確認できない。二次配布禁止が通常の作品中の利用まで全否定するとは限らないが、部品PNGを個別に配信する方式の判断は追加確認が必要。Gitだけを外してPagesへ直接置けば解決、と結論しない。四国めたんの同作者同系統素材は今回の有限検索で確認できず、存在しないと断言しない。

**浅井麻（両キャラ・通常／SD）**:

- 通常ずんだもん im10785964／通常めたん im10787066、SDずんだもん im10790258／SDめたん im10792060。配布先は両キャラ共通FANBOX2535217、通常／SD／背面・創作衣装を区別。作者は通常頭身とデフォルメを分けているが数値の頭身は未確認。上半身に使う構図はpreview選択の事項。
- 各前向き投稿はPSDTool対応、FANBOXに `ずんだもん_立ち絵.zip`、`四国めたん_立ち絵.zip`、`SDずんだもん_立ち絵.zip`、`SD四国めたん_立ち絵.zip` のmetadataがある。背面にはPNGのみ／PNG＋PSDの別がある。前向きPSDの口・目の完全名称や「あいうえお／ん」、同梱PNGは未確認。
- 投稿はfeeRequired=0、isRestricted=falseで、会員認証なしに本文・添付metadataを読めた。作者の補足にも配布サイトで有料planを設けないとある。**無料・支援加入不要の配布**を確認、ファイル本体の取得時にログインを求めるかは未試験。
- 主規約の短い引用 **「動画以外での無断使用（SNSアイコン等も不可）」**、二次配布も禁止。作者補足には動画以外での一律禁止と、ニコ静への画像投稿の限定例外がある。したがってfuzzy6のインタラクティブWebアプリは通常の無許可利用対象に入らず、**非商用でも、公開Git／Web双方とも別途許諾が必要**。Canvasで時系列に動くことを「動画投稿」と同一視しない。
- 規約は個人の動画投稿・配信、良識内加工を許可。動画配信収益以外の商用、二次配布、著しいイメージ毀損、公序良俗違反、中傷、政治宗教を禁止。僅かな使用でも条件を守ると補足される。
- ニコ動は対応イラストへのコンテンツツリー登録、他の動画メディアは作者名 `浅井麻` とTwitter ID `@asaiasa0` **または**作者URLを動画内／説明に必須。表示例 `立ち絵：浅井麻（@asaiasa0）`。親登録されたニコ動では作者名等任意。使用報告は任意。このcreditを付けるだけでWebアプリが許可されるわけではない。

### 人気・精度・未解決点

坂本アヒル、akihiyo、のんたおには解説・実況・制作教程の利用例を確認できる。「広く使われる」の代表候補として扱うが、順位や市場shareの測定はしていない。浅井麻は通常頭身／SDを揃えられ、公式解説の使用紹介もあるが、利用範囲が本件に適合しないという比較材料を残す。候補数だけを増やす追加探索は不要と判断した（初期Unit 4の範囲内）。

全候補の完全レイヤ一覧、頭身の数値は本体未取得の制約で未確認。Web配信と再配布の一般的な法的定義だけで作者の意図を断定しない。追加許諾が要る候補についても今回は問い合わせせず、ボスの選択材料へ回す。akihiyoの追加規約不明はその候補の評価限界であり、調査全体をblockedにはしない。

**次は Unit 5: ずんだもん音声の差分 × VOICEVOX／SSS公式規約・既存四国めたん調査**。今回のtoken threshold通知に従い、Unit 4の記録をここで確定してcheckpointを要求する。


## Unit 5: ずんだもん音声の規約差分・クレジット

完了・確認日: **2026-10-11 UTC**。

### 参照資料

- https://voicevox.hiroshiba.jp/term/ — 2026-10-11本文取得。現行のソフトウェア利用規約。
- https://voicevox.hiroshiba.jp/qa/ — 2026-10-11本文取得。クレジット、会社／学校での利用、音声の中間表現、モーフィング、キャラクターの権利者、個別適合質問の扱いを確認。
- https://zunko.jp/con_ongen_kiyaku.html — 2026-10-11本文全66行取得。VOICEVOX章と共通音源規約を確認。Voiceger／MMVCの別章は今回の音声に適用しない。
- https://voicevox.hiroshiba.jp/dormitory/zundamon/ — 2026-10-11本文取得。公式キャラクター紹介と公式サイトへの入口を確認。イラスト本体は取得しない。
- `/home/apm/apps/voicevox-engine-0.25.2/resources/engine_manifest_assets/terms_of_service.md` — 2026-10-11読取り。Engine 0.25.2同梱規約。Engineを起動せず、テキストだけを読む。
- `/home/apm/apps/voicevox-engine-0.25.2/resources/character_info/388f246b-8c41-4ac1-8e2d-5d79f3ff56d9/policy.md` — 2026-10-11読取り。ずんだもんの同梱policy。SHA-256: 0f1240a5b8ca1e1e831e673ecfc0a0f31ffe8545540c6379b1768301a5dc7c69。
- `/home/apm/orca/workspaces/fuzzy6/searobin/research/voice-terms/report.md` — 2026-10-11再読。四国めたんの表記・音源条件・完成音声とモデルの区別・Git論点を照合。今回の立ち絵規約と混同しない。

### 出典に基づく事実・四国めたんとの差分

1. **SSS音源規約**のVOICEVOX章は、題名からずんだもん・四国めたんを同じ許諾・共通規約の対象にしている。両者について商用／非商用可、利用時credit必要。短い原文は「例： VOICEVOX:ずんだもん、VOICEVOX:四国めたん」。この比較で、ずんだもんだけに追加の用途制限や専用の再配布条件は見つからない。
2. **実Engine同梱ずんだもんpolicy**も「VOICEVOX:ずんだもん」を示し、生成音声はcreditを記載すれば商用・非商用利用可能、詳細はSSS音源規約参照、とする。したがって今回の追加のexact credit案は **`VOICEVOX:ずんだもん`**。二人の声を使う完成物では **`VOICEVOX:四国めたん` と `VOICEVOX:ずんだもん` の二つ**を示す。一人の立ち絵を表示しただけでその声も使ったとは扱わず、音声creditと画像作者creditを分ける。
3. **アプリの配置条件（SSS）**は、紹介画面など、短い原文で「少し探せばわかる場所に」。常時表示、全画像への焼込み、声優名、スタイル名、ロゴ、README等の指定ファイル名までは対象本文に要求がない。既存のrailに二人分のcreditを置き、トップ／音声近傍READMEに規約URLと確認日も記す案は、見つけやすさとclone/fork時の条件伝達のための推奨。現在の一話者`deck.voice`の変更設計はUnit 1の未設計事項のまま。
4. **共通音源規約（SSS）**は、公序良俗違反、政治・宗教活動やそれにつながる行為、特定の個人・団体・国家への非難・批判・応援目的、情報商材とその宣伝、意図的な虚偽や誤解を招く内容の作成・共有・拡散、指定風俗営業、反社会的勢力等を禁止。非商用の教育説明もこの用途条件の対象。四国めたんで既に調べた条件と同じである。
5. **VOICEVOXソフト規約**は、生成音声には各音声ライブラリ規約が適用され、他者へ生成音声利用を許諾する場合はその遵守と更なる許諾時の継承を義務付ける。サイトの条番号は2・3、Engine同梱は3・4で対応し、同梱版はアプリ組込み再配布の文もある。これは完成音声利用の根拠であり、PSD素材の再配布許可へは転用しない。
6. **公式FAQ**は、音声のみの作品で冒頭／末尾等にcreditを置く例を示すが、今回のアプリ付属Opus各ファイルへcredit音声を足す明文義務とは読めない。音声中間表現（AudioQuery／FrameAudioQuery）を別合成に使う場合もcredit必要とする。口パク用に時間だけ抽出する処理の追加creditを明示したFAQではないが、今回そもそも完成音声に通常creditを付ける。二人の絵の同時表示はモーフィングではない。将来音声を実際にモーフィングするなら両音源規約が適用され、厳しい側が優先される。
7. **音声とキャラ／素材の別条件**: 音源は商用可でも、立ち絵・キャラクターにはUnit 2〜4の別条件が残る。完成音声のGit/Pages公開を名指しで禁じる文は今回の音源本文にもないが、GitHubのホスト／fork許諾との両立は既存音声報告が残した論点をそのまま引き継ぐ。これを画像のGit掲載許可の根拠にしない。

### 未解決点

- 規約本文に施行日／改定日を見つけられず、2026-10-11は取得確認日として記録する。権利者による本アプリの個別適合認証は得ていない。
- 音声でのスタイル別例外やGit名指し許諾は今回確認した一次資料にない。別製品（VOICEPEAK／VoiSona／Voiceger等）のずんだもん規約や、他キャラ／NemoのAI学習禁止を本件へ転用しない。
- creditの具体的可読性、二話者のmanifest仕様、単独の音声作品として提供するときの条件は制作時の確認事項。Engine起動、合成、音声・素材の取得、問い合わせ送信はしていない。

### 次の単位

**Unit 6: 口パク・瞬きの慣習 × YMM4／PSDToolKit／VOICEVOXの一次文書・source**。音素と差分の対応、レイヤ命名、時刻計算、まばたきの目安を調べる。token threshold通知を受け、Unit 5の記録を完了してcheckpointを要求する。


## Unit 6: 口パク・瞬きの慣習、VOICEVOXの時刻データ

完了・確認日: **2026-10-11 UTC**。

### 参照資料・取得方法

一次資料（全て2026-10-11確認）:

- https://manjubox.net/ymm4/release/4.49.0.0/ — YMM4公式リリース説明、2026-02-01公開。source https://raw.githubusercontent.com/manju-summoner/manjubox.posts/master/ymm4/release/4.49.0.0.md も全文確認。
- https://www.manjubox.net/ymm4/faq/立ち絵機能/動く立ち絵素材の作り方/ — 動く立ち絵PNGのフォルダ・ファイル命名。
- https://manjubox.net/ymm4/faq/立ち絵機能/psd/ — PSD立ち絵のレイヤ割当手順。
- https://manjubox.net/ymm4/release/3.9.9.164/ — まばたき開始・間隔の設定導入の公式記録。
- https://www.manjubox.net/ymm4/ と https://github.com/y-chan/ymm-kuchipaku — 旧来の外部lab変換ツールの案内／作者READMEを補足に確認。古い「YMM4が標準であいうえお未対応」を現状へ転用しない。
- https://oov.github.io/aviutl_psdtoolkit/psd.html — 口パク開閉／あいうえお、子音処理3種、目パチの設定・コード例。文書末尾はv0.2.0beta72、生成2026-09-09と表示。
- https://oov.github.io/aviutl_psdtoolkit/ と https://oov.github.io/aviutl_psdtoolkit/tutorial.html — AviUtl拡張編集上のツール、Windows環境、準備オブジェクト等。
- https://oov.github.io/psdtool/manual.html — `*`／`!`／反転レイヤというPSDToolの独自命名規則。webの記号findが失敗したためHTMLをurllibでメモリ上に取得し、テキストを抽出して照合。
- https://raw.githubusercontent.com/oov/aviutl_psdtoolkit/main/src/lua/PSDToolKit.lua — LipSyncLab（概ね322〜440行）とBlinker（229〜259行）を読む。UTF-8でなくcp932で解読。GitHub公開tree metadataでsourceを発見、mainの閲覧時点の実装であり、作者素材のファイルは取得しない。
- https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/model.py — AudioQuery。
- https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/model.py — Mora、AccentPhrase、FrameAudioQuery。
- https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/phoneme.py — 音素集合、無声母音、N／cl／pau／silの区別。
- https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/tts_engine.py — queryの変換、話速・無音・疑問形補正・フレーム丸め。本機のEngineと同じ0.25.2 tagを指定。

公式資料の探索にnative webを使用。source／HTMLは15秒timeout、700〜800KBの有限上限でメモリ上だけに読む。PSDToolKit、YMM4、VOICEVOXを導入・起動していない。PNG／PSD／ZIP／画像preview、合成音声は未取得。一般ブログの瞬き数値や第三者コードの音素処理を慣習の一次証拠には採用しなかった。

### YMM4の仕組み・名前（公式に帰属）

1. **現在の標準機能**: 2026-02-01の4.49.0.0から「動く立ち絵」「Psd立ち絵」の両方にあいうえお口パクがある。対応素材が必要。VOICEVOX等は音声合成エンジンから生成された口パク情報を使い、その他のエンジンは音声解析した情報を使うと公式が説明。旧外部ツールKuchiPaku等の「標準未対応」という説明は現行の判断に使わない。
2. **PNG版の名前**: 口フォルダで `パーツ名.a.png`／`.i.png`／`.u.png`／`.e.png`／`.o.png` を各母音に対応、`.0.png` が閉じ、`パーツ名.png` は開き（あいうえお方式ではサムネイル用）。専用`.N.png`はこの公式規格に列挙されていない。これは書き出したPNGの規格であり、PSD素材の元のレイヤ名を証明しない。
3. **音量口パク／まばたき**: 口／目のそれぞれのフォルダで `.0.png` が閉じ、`.1.png`等が任意枚数の中間、数字のない`パーツ名.png`が開き。必ず3枚必要とはしない。PSD版はマネージャーで任意の実レイヤを割り当てて順番を設定する。名前だけで全素材へ自動対応するとは限らない。
4. 目・口・眉・髪・顔色・体・他・後等のフォルダと規定の描画順を持つ。YMM4は参考となる制作慣習であり、本Webアプリで同じフォルダ名を強制する必要はない。
5. まばたきはキャラクターごとの開始／間隔を設定できる。今回の公式本文で、YMM4の現行既定値や全人向けの生理学的な最適値までは確認していない。

### PSDTool／PSDToolKitの仕組み・名前（oov文書・sourceに帰属）

- PSDToolのレイヤ名先頭 `*` は同一親グループ内のラジオボタン化（一つを選んで他を外す）、先頭 `!` は強制表示。例 `!口`の子を `*あ`／`*い`等にすると、状態パス例 `v1.!口/*あ`になる。名前末尾の`:flipx`／`:flipy`／`:flipxy`は反転時の専用差分。これらはPSDフォーマット自体の意味でも、psd-tools／ag-psdが自動実装する意味でもない。
- 開閉のみは音量によるしきい値から開閉状態を変える。目パチには最低開き・閉じ2種、途中のほぼ開き／半開き／ほぼ閉じは任意に割当。
- **あいうえお口パク**はa/i/u/e/o/N（ん）の6パターンを割り当てる。公式の短い説明「母音の形に合わせてアニメーション」を行う。PSDToolKit自体はwavから母音を自動認識しないので、wavと同名lab、またはlabのタイムライン投入が必要。音素情報がない場合はsource上、音量による「あ」／「ん」のfallbackがあるが、本来の母音同期になったとは扱わない。
- 文書の子音処理: mode 0すべて「ん」、mode 1は口を閉じる子音以外で前の母音を引継ぎ、mode 2は前後の母音の形を小さくして補間。これは代表的な選択肢で、唯一の業界標準ではない。
- **実sourceの細部**: mode 0は大文字無声母音も小文字相当へ割当。mode 1は有声母音で状態更新、`pau`／`N`／`cl`で「ん」に戻り、それ以外（無声母音を含む）では直前状態を維持する。文書の「閉じる子音」を本sourceのmode 1でm/b/pにまで広げて説明しない。mode 2は`pau`／`N`／`m`／`p`／`b`／`v`を「ん」、clの前半は直前母音、後半は「う」。その他の子音は前半に直前、後半に次の母音を小さくした形を使う（a/A→o、i/I→i、他→uというsource例）。my/by/py等の全拗音を同一処理する保証はこの条件分岐から導かない。
- **状態を持つ処理の移植注意**: sourceのmode 1／開閉処理はlayerごとの過去stateを持ち、巻戻しでresetする。fuzzy6の純粋時刻・シーク契約にはそのままコピーせず、事前計算した区間配列から現在時刻の状態を求める。
- **瞬き**: 文書例は間隔4秒、速さ1フレーム、offset0。複数キャラはoffsetをずらすと公式に説明。4秒は文書の例であり「人は全員4秒ごと」「推奨必須」「正確な総周期4秒」を意味しない。実Blinkerの周期は間隔にパターン数・speedのフレーム分を加え、5周期に1回の追加blinkもあるため、speedだけで総閉眼長を秒へ断定しない。

### VOICEVOX 0.25.2の音素と時刻（公式sourceに帰属）

- AudioQueryの`accent_phrases[].moras[]`は`consonant`（無い場合null）、`consonant_length`、`vowel`、`vowel_length`。各句末に任意の`pause_mora`。Moraの`vowel`は有声a/i/u/e/oだけでなく、大文字A/I/U/E/O（無声）、N（ん）、cl（っ）、pau（無音）も入る。`N`を小文字化して子音`n`と混同しない。前後無音は内部`sil`で、decoderにはpauへ変換。
- 子音集合には通常のk/s/t/n/h/m/y/r/w/g/z/d/b/pに加えky/sh/ch/ny/hy/my/ry/gy/j/by/py、f/v/ts/ty/dy/kw/gw等もある。未列挙・未知の音素には安全な閉じfallbackと診断が必要。ひらがな字幕の一文字ずつに一定時間を配る方式は合成の実タイミングを表さない。
- 合成変換順は前後無音追加→pauseLength置換（nullなら無し）→pauseLengthScale倍率→全音素長をspeedScaleで割る→93.75Hz（24000/256）の音素ごとのフレーム丸め。前後無音も話速除算に含む。`_to_frame`はNumPyの偶数丸め（banker's rounding）であり、JSのMath.roundだけでは半整数tieで同一にならない。
- synthesisでは必要なら疑問形末尾に同じ母音0.15秒のモーラを追加してから上記変換を行う。長さを単純加算しただけではこれらによるずれがある。厳密同期は使用した最終queryとsynthesisオプションに基づいて、各音素の丸め済みフレーム数を積算するのがsourceに一致する設計案。近似で済ませる場合も累積ずれ・最終Opusのdurationを比較する必要がある。
- 実wav／Opusでの符号化・切出し・実再生の始点差は今回は測定できない。既存制作ツールにどの補正が入るかは本単位の実装試験対象ではない。Engineを起動して確認したものではない。

### fuzzy6への割当・瞬きの提案（調査結果からの設計案、未実装）

| 音素・状態 | 五母音がある場合の基本案 | 根拠・注意 |
|---|---|---|
| a i u e o | 対応する母音差分 | YMM4／PSDToolKitの共通する母音方式 |
| A I U E O | 対応小文字と同じ形 | PSDToolKit mode 0/2の実例。無音だから自動で全て閉じると決めない |
| N | ん、無ければ閉じ | 簡略化した口形。発音上Nが常に唇閉鎖とは主張しない |
| pau／sil、未発話、未データ | 閉じ | 会話以外で口が開き続けない |
| cl | 最初の版は閉じ | PSDToolKit mode 0/1の実例。精密化時に前後母音への遷移を比較 |
| m／my、b／by、p／py | 短く閉じ | mode 2のm/b/pを参考に拗音にも広げる本アプリの案。元ソフトと同一とは言わない |
| その他の子音 | 同じモーラの次母音を小さくした形、または直前母音を保持 | PSDToolKitの前後補間を参考。全子音を毎回閉じるちらつきを避ける比較案 |

- 母音別差分が未確認の坂本アヒル素材等には、**閉じ／中間／開きの3段階**を最初の候補にする。Unit 3の補助資料の `むふ`／`ほー`／`ほあー`は選定versionを取得後に照合。5母音へ無理に作者の表情名を当てはめない。音量方式なら事前に有限長の包絡線を作る、音素方式なら母音中だけ開閉の候補状態を作る。これは5母音口パクと同じ忠実度ではない。
- 立ち絵は二人とも表示し、発話者のタイムラインだけ口を動かす。聞き手の口は閉じ、瞬きだけ別々にする。2人の同時発話を本依頼から追加要求としない。現仕様は1話者なので、話者ID／母音区間の契約は後の設計事項。
- まばたきの試作値は**間隔4秒前後（必要なら種付きで3〜6秒）、全体120〜200ms、開き→半閉じ→閉じ→半閉じ→開き**。4秒は公式例に由来、3〜6秒と120〜200msは本調査の試作提案であり、生理測定結果やソフトの普遍的既定値ではない。半閉じがなければ開閉2枚でも可。二人でphase／seedを変える。
- 時刻から直接求め、停止時に時計は進めない。`rest`を飾りの動きで埋めないというAGENTS方針に合わせ、rest中の瞬きを止めるか通常の最小頻度で残すかはボス／見た目担当の判断。瞬きの秒数を制作の固定規則にせず、paceへ集約して実画面で調整する。

### 未解決点と次の単位

完全な素材レイヤ一覧、母音形の品質、実音声のoffsetは本体未取得・Engine未起動につき未試験。ソフトの割当機能は素材の利用許諾や不足差分の存在を保証しない。Blink数値は公式例と提案を分けて報告する。口形の細かさ／二話者仕様／restでの瞬きは採用後の設計事項であり、今回コードは変更しない。

**次は Unit 7: PSD書き出し × psd-tools／ag-psd一次文書・最小環境確認**。aarch64 Linuxのプロジェクトvenv／node_modulesのみで行う未実行手順と合成上の落とし穴をまとめる。token threshold通知を受け、このUnit 6の記録を確定してcheckpointを要求する。


## Unit 7: PSDのPNG書き出し、aarch64での導入・合成・資源上限

完了・確認日: **2026-10-11 UTC**。

### 参照資料・確認方法

一次文書・source（全て2026-10-11確認）:

- https://psd-tools.readthedocs.io/en/latest/ — 表示はpsd-tools 1.24.0。基本／composite extraの導入と描画の対応範囲。
- https://psd-tools.readthedocs.io/en/latest/usage.html — CLIのshow/export、レイヤ順、topilとcomposite、layer_filter、合成の限界。
- https://psd-tools.readthedocs.io/en/latest/reference/psd_tools.html — PSDImage.open、descendants、compositeのviewport／ignore_preview／alpha／ICC、ParseLimits／max_alloc_bytes。
- https://psd-tools.readthedocs.io/en/latest/reference/psd_tools.api.layers.html — レイヤのbbox／offset／visible／opacity／mask／clipping／composite／topil。
- https://psd-tools.readthedocs.io/en/latest/untrusted.html — 解析・解凍・allocation budgetの対象と限界、外部timeout／OS process memory limit。
- https://raw.githubusercontent.com/psd-tools/psd-tools/v1.24.0/src/psd_tools/api/psd_image.py — v1.24.0でcompositeのignore_preview等を確認。加えてmainの同ファイル、および https://raw.githubusercontent.com/psd-tools/psd-tools/main/src/psd_tools/api/layers.py のvisible setter、https://raw.githubusercontent.com/psd-tools/psd-tools/main/docs/untrusted.rst の説明を照合。mainは閲覧時点sourceと区別する。
- https://github.com/Agamnentzar/ag-psd — 作者README、Nodeのcanvasを使う標準例、useImageData／useRawData／totalMemoryLimit、合成しない旨、production時の上限と分離。
- https://github.com/Agamnentzar/ag-psd/blob/master/README_PSD.md — レイヤtop/left/bottom/right、opacity（0〜1）、clipping／hidden、mask／children、グループ自身にbitmapがない点。
- https://raw.githubusercontent.com/Agamnentzar/ag-psd/master/src/psdReader.ts — 画像をimageDataへ保持する分岐とcreateImageDataの呼出し、maskを別に保持する仕組み。
- https://raw.githubusercontent.com/Agamnentzar/ag-psd/master/src/helpers.ts — initializeCanvasの第2引数createImageDataMethod、既定createImageDataがcanvasへ依存する点。
- https://raw.githubusercontent.com/Agamnentzar/ag-psd/master/src/psd.ts — ReadOptions、raw/lazy画像、totalMemoryLimit。READMEの古い対応制限とsourceの差を認め、全てのbit深度・色空間が同じ対応だと断言しない。初回対象はRGB 8bitに限定する提案。
- https://github.com/pngjs/pngjs — pure JavaScriptのPNG encoder/decoder、PNG.sync.write、colorType 6（RGBA）の例。

配布metadata（wheel/npmの本体は未取得、全て2026-10-11確認）:

- https://pypi.org/pypi/psd-tools/1.24.0/json — Python>=3.10、基本依存typing-extensions／attrs／Pillow>=10.3.0／numpy>=1.22、composite extraはaggdraw／scipy。cp312 Linux manylinux aarch64 wheel `psd_tools-1.24.0-cp312-cp312-manylinux_2_24_aarch64.manylinux_2_28_aarch64.whl` を確認。最新まとめの `/pypi/psd-tools/json` は800KB上限を超えたので読み取りを中断し、版指定metadataへ切り替えた。
- https://pypi.org/pypi/Pillow/12.0.0/json — Python>=3.10、cp312 manylinux aarch64 wheelあり。
- https://pypi.org/pypi/numpy/2.3.4/json — Python>=3.11、cp312 manylinux aarch64 wheelあり。
- https://pypi.org/pypi/scipy/1.16.2/json — Python>=3.11、cp312 manylinux aarch64 wheelあり。
- https://pypi.org/pypi/aggdraw/1.3.19/json — Python>=3.9、cp312 manylinux aarch64 wheelあり。これらは利用できる具体例で、各依存の最新版を網羅したという主張ではない。
- https://registry.npmjs.org/ag-psd/latest — 閲覧時点31.0.3、通常依存pako 2.1.0／base64-js 1.5.1、optional native dependencyなし。
- https://registry.npmjs.org/pngjs/latest — 閲覧時点7.0.0、Node>=14.19.0、通常依存なし。
- 本機読取りのみ `uname -m` → aarch64、`python3 --version` → Python 3.12.3、`node --version` → v24.19.0。

native webを優先し、本文抽出しにくいsource／metadataをurllibの15秒timeout・800KB上限でメモリ上だけに読んだ。推測したsecurity.html／security.rst等のURLは取得失敗し、文書の正式linkからuntrusted.htmlへ到達した。依存導入、venv作成、PSD／PNG／ZIP／previewの取得、実書き出し、Engine起動、project編集は行わない。

### 二つの道具の位置付け

1. **psd-toolsを初回候補にする**。PSDImageでレイヤtreeを読み、`layer.composite()`はマスク・ベクトルマスク・クリッピングを含む単独レイヤ合成、`psd.composite()`は選択した状態の全体合成を行う。`layer.topil()`は生の画素の取得で、マスクを別に読む例が公式にある。短い一次引用は「Composite layer and masks」。**topilで各レイヤを保存しただけではPhotoshopでの最終見た目と同じにならない**。
2. 基本のピクセル合成は通常依存のみ。ベクトルの線・gradient/pattern・一部effectには`[composite]`のaggdraw/scipyが必要。ただしextraを入れても全layer effect／文字／smart object／adjustmentが完全に描画できるわけではない。usageの具体的な一部adjustment対応を優先し、「全調整レイヤ不可」／「全調整レイヤ可」のどちらにも単純化しない。結果はPhotoshopと異なる場合があると公式が記す。
3. **ag-psdはtree／bitmapの読出し用の軽いNode代案**。作者の短い説明「does NOT generate new composite canvas」が明示する通り、レイヤ順・可視性・blend変更から新しい合成画像を生成するrendererではない。rawレイヤbitmapとmaskは別で、グループ自身にimageDataがない。複数画素レイヤからなる白目＋黒目や、親opacity／clipping／multiply等を、自前で再現しないまま単独PNGにしてはいけない。
4. 標準のNode例は`ag-psd/initialize-canvas`からnode-canvasを使う。この機械ではネイティブcanvasのOS依存を避けるため、**`useImageData: true`だけで済ませず、initializeCanvasの第2引数でImageData生成を提供する**。既定のcreateImageDataは依然canvasを使うことをsourceで確認した。pure JSのpngjsと組合せれば、RGB 8bitのraw bitmapをPNG化する経路にCairo等のグローバル導入は必要ないとのsource上の見立て。実動作未試験。

### 権利確認後に行う導入・書き出し手順案（未実行）

調査中の操作ではなく、採用素材の許諾／archive内READMEを確認してから行う次工程として報告する。現在のexactly-two-artifacts制約下ではscriptやmetadataファイルも作成しない。

1. **正規入手と記録**: 作者指定URL・version・取得日・checksum・規約／同梱READMEを記録。素材PSDは非公開の作業場所に保持し、公開Gitへ自動で加えない。未知のZIPはfile数・展開後byte上限とpath traversal検査を設定する。許可された出力だけ公開候補にする。
2. **独立したプロジェクト内venv**: 例 `python3 -m venv tools/character-export/.venv`、`tools/character-export/.venv/bin/python -m pip install --only-binary=:all: 'psd-tools[composite]==1.24.0'`。基本pixelのみならextraなしでもよい。確認できたarm64 wheelsに基づく手順で、resolverの成功・色管理対応は実機で未確認。`--only-binary=:all:`でwheel不足時は停止し、sudo／apt／system Python／pip --userへ進まない。採用版と全依存はロックする。
3. **まず構造だけ確認**: `psd-tools show <許諾済みPSD>`またはPSDImageからtreeを列挙。名前だけでなく親パス／重複識別子、kind、visible、bbox/offset、opacity、blend、mask、clippingを有限の件数で記録。body、口の各状態、目の開／半閉／閉、白目・黒目セットを人が選ぶ。PSDToolの`*`／`!`／`:flipx`等はUnit 6の独自規則であり、このreaderが勝手に同じ意味へ解釈するものではない。
4. **表示状態を明示する**: 一つの口／目を選び兄弟差分を隠すだけでなく、必要な全祖先を表示し、無関係な姿勢・腕・服装・背面・背景を除く。強制表示と白目／黒目等の従属関係を反映。原PSDを書き戻す必要はなく、メモリ上だけ可視性を変える。名前をファイル名へそのまま転記せず、`mouth-closed.png`／`eye-open.png`等の固定名と元パスの対応を記録する。
5. **共通座標で合成する**: 基本呼出しは、選択済み可視性を用いた `psd.composite(viewport=(0, 0, psd.width, psd.height), alpha=0.0, ignore_preview=True).convert('RGBA')`。ignore_previewは保存済みの古い全体previewを返すことを避ける。alpha0は透明背景。forceはvector再描画用なので万能スイッチとは扱わない。ICC変換／RGB 8bit化を決め、同じcrop・倍率を全状態へ使う。レイヤ単独のbboxで保存するときはleft/topとcrop原点をmetadataに残す。**差分ごとの自動trimで原点を失うと、口／目が動くので避ける**。
6. **部品が分離できる場合**: body/base、口状態、目状態をそれぞれ必要な従属レイヤ込みで合成して保存。親blend／effectが他部品のbackdropに依存しないか確認。白目と黒目をひとつの目状態へ焼く。mouthだけが単純なnormal layerでもlayer.topilよりcompositeを基本にする。
7. **分離が崩れる場合**: 人体・顔ごと合成した「口×目」の有限状態をPNG化して切替。3口×3目なら9枚、6口（5母音＋閉／ん共用）×3目なら18枚／人。N専用を加えた7口なら21枚／人。全姿勢・全衣装・全表情の直積は作らない。この方式も素材の加工物であり、合成しただけで再配布禁止を回避できるとは扱わない。
8. **検証する**: author／PSDTool等の正規previewと目視で比較（許諾後）。マスク端、黒目残り、opacity、色、crop、半透明輪郭、反転専用差分、固定原点、各状態の重ね順を確かめる。PNGサイズ・状態数・hashを記録。二人分を字幕枠で表示して文字を隠さないか確認するのは見た目担当の次工程。元レイヤが不足なら5母音をあると報告しない。

Node代案の例は、独立した `tools/character-export` 配下で `npm install --save-exact ag-psd@31.0.3 pngjs@7.0.0` を行い、そのnode_modulesを使う。初回解析は `readPsd(buffer, { skipLayerImageData: true, skipCompositeImageData: true, skipThumbnail: true, skipLinkedFilesData: true })` で構造を確認。その後の8bit読出し用の核心は以下（未実行の説明用断片、実際には先に寸法／byte上限チェックを入れる）:

```js
initializeCanvas(
  () => { throw new Error('Canvas is not used in raw export'); },
  (width, height) => ({ width, height,
    data: new Uint8ClampedArray(width * height * 4) })
);
const psd = readPsd(buffer, {
  useImageData: true, skipCompositeImageData: true,
  skipThumbnail: true, skipLinkedFilesData: true,
  totalMemoryLimit: 512 * 1024 ** 2
});
// 対象layer.imageDataのRGBAをPNG.sync.writeへ渡す。
// left/top、layer.mask、親opacity／blend／clippingは別に処理する。
```

Sourceの`useRawData`＋getLayerImageDataで必要なbitmapだけを後から読む経路もある。上の例は全レイヤbitmapを読むので総pixel数を事前検査する。lazy getterのallocationへreadPsdのbudgetが全体として継承されると断言せず、外部process制限と独自の寸法／総byte検査を必須にする。Nodeで「raw PNGが書ける」と「最終表示の合成が正しい」を分ける。

### 処理の有限性・機体の条件に合わせた提案

- **psd-tools公式**はParseLimitsのbyte limitが既定では無効、renderのallocation budgetは既定4GiBだが**1回のallocationの見積り**でprocess全体の上限ではないと説明する。有限なParseLimits（例64MiB/read、累計256MiB、10万objects、descriptor深度32）、max_alloc_bytes（例512MiB）を使い、別processのRLIMIT_AS（公式例4GiB）と外部timeoutを併用する。OS設定変更は不要。effectがbudget超過でskipされる場合もあるので、終了成功だけで絵の一致を判定しない。
- **ag-psd公式**もPSD本体の小ささが展開後bitmapの小ささを保証せず、documentとは独立にlayer bboxが巨大になり得ると説明。totalMemoryLimit（README既定2GB）だけでinput BufferやJS全体を上限化したと扱わない。同期decodeは同じevent loopのtimerでは中断できないため別processに外部timeoutを付ける。
- 本アプリの初回exporterの提案例は、入力PSD64MiB、文書／各layer／maskのbboxは各辺4096px・16Mpixel以内、tree1000layers・深度64、最初のpresetは1人あたり21状態以内、出力総256MiB、process memory4GiB／120秒。これらは**本機用の試作上限案で、素材の実寸や公式推奨値を測った数字ではない**。入力に合わなければ処理前に見積りを変更する。処理は固定集合を順に生成し、各出力のpixel/byte予算を生成前に予約し、上限／timeout超過で中断。再試行・子process増殖・全組合せ生成なし。
- 大きなbitmapのassert/diffを作らず、短い寸法・サイズ・checksumで診断。まず小さい自作の成功／失敗ケースで上限処理を検証してから、正規素材へ適用する次工程を推奨。GPUは使わず、Engineは起動しない。

### 未解決点と次の単位

venv／pip resolverの実成功、psd-toolsと選定PSDの合成一致、PSD実寸・mask／blend構造、全差分の互換性は未試験。レイヤ書き出し方法があることは、素材再配布の許諾を意味しない。技術的手順は示せたので、本体取得禁止を理由に調査全体をblockedにしない。計画Unit 7内の資源・合成問題であり新たな問いへの拡張はない。

**次は Unit 8: 公開Git／Pages／手元・外部取得・自作の比較 × GitHub一次規約と素材許諾の照合**。今回のtoken threshold通知に従いUnit 7記録をここで完了し、checkpointを要求する。報告書は全単位完了後の明示report turnで書く。

## Unit 8: 公開Git・Pagesの許諾、代替方法、ボスの決定事項

完了・確認日: **2026-10-11 UTC**。

### 参照資料

一次資料（全て2026-10-11本文確認）:

- https://docs.github.com/en/site-policy/github-terms/github-terms-of-service — 現行表示の発効日2026-04-27。AのContent／Service定義、D.3〜D.8、J.3を確認。既存音声報告の文面を前提にせず現ページで照合した。
- https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features — Version Effective Date 2026-08-27。冒頭の基本契約との組合せ、Actions・Pages章を確認。
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository — 無ライセンス／public閲覧・fork、非公開化後も既存copyが残るという説明。
- https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching — cache共有・forkのPRからbase branch cacheへアクセスできる点を本文で確認。検索抜粋と本文で掲載箇所・表現が異なるが、この要点は一致。
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts?tool=webui — workflow artifactはGitHubへサインインしrepository read accessを持つ人が取得できるとの本文。
- https://zunko.jp/guideline.html — 再確認。Web／アプリ利用、（ず・ω・きょ）、他作者の権利、禁止事項10「再許諾」、免責7・8を照合。
- 本ディレクトリの `log.md` Unit 1〜7 — 2026-10-11再読。各素材の作者一次規約、LICENSE／CI、出力・同期手順を照合した。新たな素材本体取得・作者への送信はない。

### GitHub規約に書かれていること

1. **ToS A／D.3**: Contentにはimages／graphicsも含み、第三者が作ったContentを投稿する人は投稿権限と適用ライセンスの遵守を確かめる責任がある。素材が既にGitHubに必要な権限を与えるライセンスを含む場合、追加licenseは不要という留保もある。したがって「公開Gitなら全素材不可」と一律に決めるのも適切でない。原作者による直接許諾が必要範囲を覆うかが問題。
2. **D.4**: GitHubとAffiliatesへ、serviceの提供・開発・改善に必要な保存・hosting・archive・解析・表示・copy等を認める許諾。現行本文はAI機能のtrainingおよびAffiliatesのAI／ML技術のtraining・開発・改善も含む。短い原文 **“including by training AI Features”**。単に閲覧者のブラウザに一回絵を表示する許諾だけでは、契約上求める範囲を確認しきれない。
3. **D.5**: publicにすると他ユーザーの閲覧・forkを認め、serviceの機能内でuse／display／perform／forkによるreproduceの非独占・全世界許諾を与える。短い原文 **“view and "fork"”**。第三者Contentについてもこれらを許す条件であることを投稿者が確認する。Git外での無制限な再利用／再販売まで自動許諾される、という意味ではない。
4. **D.6／D.7**: repositoryのlicenseに従うcontributionの扱いがあり、違う条件の合意は優先する。著作者人格権の不行使等と、法により不行使が成立しない場合の代替許諾もある。作者credit必須素材や原キャラ権に対し、投稿者がどこまでこの権限を持つかを分ける必要がある。作者の人格権を利用者が当然に放棄できるとは解釈しない。
5. **D.3／D.8、licensing doc**: publicとしてinternet上にaccessibleにする指示、削除してもfork済みContentは許諾終了の例外がある。All rights reservedや無licenseは一般再利用の許諾に変わらないが、GitHub内の最低限のview／forkを消せない。現在のLICENSEはこの除外を既に持つ（Unit 1）。掲載後に消せば全copyを回収できる、とは扱わない。
6. **J.3**: AI Featuresへ提供したInputs／Outputsのtraining等には個人アカウント設定のopt-outがある。一方、同章はD.4〜D.8の権利を制限せず、public repositoryのContentへの許諾にはそのopt-outが適用されないと明記する。**Copilotの学習設定をOFFにすれば公開素材のAI学習禁止問題が必ず解消する、とは言えない**。素材の作者条件と契約の照合に必要な現行の差分であり、別の一般AI調査へ広げない。
7. **Additional TermsのPages章**: 個人・団体のproject紹介の静的Webを想定し、オンラインbusiness／EC／商用SaaS等を禁止する。本件の個人非商用解説という目的はその商用hosting禁止に該当するものではないとの見立て。ただしPagesも基本契約を遵守すると明記し、素材の権利を特別に付与する条項やDの例外は見つからない。**Git commitを避けてPagesにだけ置く方式でも、Pages上のhosting／配信の許諾確認は残る**。

以上は契約の原文とそれに対する本調査の照合であり、権利者・裁判所による本件個別判断ではない。一般の非商用Web許可が、営利hosting事業者の契約への許諾まで認めるかは、ユーザーの非商用とhosting事業者の営利を混同せず未確定とする。

### 素材ごとの照合と最重要の結論

| 候補 | Web利用・加工について確認できた根拠 | 公開Gitへの部品PNG収録の見立て |
|---|---|---|
| 公式zunko.jp | 個人非商用、Web／アプリ、認識可能な切り抜き等の許可 | 2D無償再配布一般の明示禁止は見つからないが、再許諾禁止10とGitHub Dの関係は不明。**掲載可と確定できない** |
| 坂本アヒル・対象4投稿 | 公式範囲なら何にでも利用可＋（ず・ω・きょ）による他クリエイターへの直接許諾。作者独自の再配布禁止なし | **既存素材の第一候補、条件付きで有力**。自由利用表示は肯定的根拠。しかしSSSの再許諾禁止、D.4のAI等を含む範囲、D.5 forkに関する作者・SSSの明文が不足。無条件OKと断定しない |
| akihiyo・対象2投稿 | 公開captionから作者の詳細な追加条件を確定できない | **保留**。利用者のpublic Gitを許諾根拠にできない。選ぶなら同梱規約／作者の説明確認が先 |
| のんたお式ずんだもんver.2.0 | 加工可、公式範囲の動画収益化可。一方二次配布・AI学習禁止 | **現条件のまま採用しない**。部品PNGのGit公開は二次配布禁止へ抵触する見立てが強い。さらにD.4との衝突懸念。Webの部品送信が作品利用の例外かも明示されない |
| 浅井麻・両キャラ通常／SD | 個人動画投稿／配信と良識内加工。動画外の無断使用・二次配布禁止 | **本件Web／Gitとも個別許諾が先**。非商用・credit掲載・Canvasアニメであることだけでは動画外禁止を解消しない |
| 自作／依頼した二次創作絵 | SSSは自作二次創作を許す。他人の配布素材の禁止がなくなる／依頼作者とは直接条件を合意できる | 作者素材条件は自分で整えられるが、**SSSのキャラ条件・再許諾問題は残る**。「自分で描けばGit含め全部自由」と断定しない |

**この調査で、公開Git＋Pages＋現行GitHub契約を含めて無条件に掲載可と確定できた立ち絵候補はない。** ただし公式と坂本アヒルは非商用Web使用に明確な肯定的根拠があり、許諾を確認するなら有力候補。単なる作者の再配布禁止と、SSSの再許諾禁止は異なる問いなので、それぞれを確認する。利用者はSSSを代理してキャラクターをlicenseしない一方、GitHubに必要なContentの利用権限を確保する必要がある、という二点を同時に扱う。

**追加の公式事実**: guidelineの免責8は無料利用等の適合質問へ **「原則お答えしておりません」** とする。問い合わせれば必ず回答・許諾が得られるとは見込まない。無回答を承諾扱いしない。免責7はガイドライン準拠の二次的著作物について、作品を盛り上げる目的のSSSによる配信／放送利用への許諾も定める。自作をARR管理してもこのキャラ条件を無視しない。これらは既存Unit 2の「自作条件／次の行動」を具体化する同じ問いで、追加単位を必要とするscope変更ではない。

### Gitへ画像を置けない場合の代替方法（設計案と規約の扱い）

| 方法 | 公開Git・公開配信への効果 | 規約上の扱いと実現上の条件 |
|---|---|---|
| 手元だけで取得・書き出し・開発 | PSD／PNGをGit・CI・Pagesへ渡さない | Git上のホスト／fork・素材再配布問題を避けられる。個人利用・加工・禁止用途の作者条件は守る。浅井麻の動画外条件は手元Webでも自動許可と解釈しない。正規取得は今回未実行 |
| 公開アプリに画像を同梱せず、利用者が正規入手したローカル画像をbrowserで選択 | 公開するのはloader／契約だけ。絵は端末内で読み、serverへuploadしない設計にできる | 配布者による素材再配布を避ける有力な「利用者持込み」案。利用者も作者条件を満たす必要がある。閲覧者全員が正規入手／書き出しする負担があり、公開時から二人を表示する要望とは異なる。取得先への通常linkは素材同梱とは違う |
| CIで外部の正規配布元から取得してPNGを生成、distへ入れる | Git履歴とforkに素材本体を載せない。現workflowの変更が必要 | **公開Pagesへ部品を渡すことは残る**。正規自動取得・加工・Web配信・GitHub hostが許可される場合に限る。二次配布／動画外禁止の回避策ではない。パスワード／認証の迂回不可、提供サイトの自動取得条件・version/hash・変化／停止時の扱い確認が必要 |
| 自分の非公開保管庫からCIへ取得 | Git原本公開を避け、安定した入力を選べる | 非公開cloudへのuploadにもそのhost契約と素材条件の確認が必要。secretでURL等を隠しても配信PNGの許諾は変わらない。公開cache／artifactへ素材原本を入れない |
| 許諾を得た外部host／CDNにPNGを置き、公開アプリから読む | Git／Pagesに画像byteを含めない構成にできる | 外部hostへのupload・配信の許諾は必要。再配布禁止が保存先変更で消えるわけではない。host契約が目的に合うか、画像表示／CanvasのCORS、URL変更・可用性を確認。画像hostだけ変える場合もアプリ全体の表示利用条件は守る |
| 作者の既存画像へ直接link／hotlink | 自分でコピーして配る工程を減らす可能性 | 配布ページへの通常linkと、画像への自動アクセス／hotlinkを区別。author／hostが直接埋込みや大量アクセスを認めるか不明。PSD原本はmouth PNGの代わりにならない。許諾確認・安定性なしに推奨しない |
| 自分で描く／依頼制作 | 配布立ち絵の二次配布禁止、古い差分・登録の問題を避けられる | 必要な5母音／閉／ん、開／半閉／閉目を最初から用意できる。SSS条件は残る。依頼は支払だけで権利取得したとせず、加工・PNG部品・Web／Git掲載・fork／host権限・credit条件を具体的に合意する。GitHubのAI等の範囲も省略しない |
| キャラ画像なしで公開し、立ち絵の採用を保留 | 現行音声・アプリの公開経路を保てる | 二人の立ち絵の公開という目的は未達になる。許諾が解決するまでの暫定案。音声credit等は別に継続する |

sprite atlas、Base64、Canvasで全身を焼いたPNG、極端な縮小、ファイル拡張子変更は、素材の加工物を閲覧者に渡すこと自体をなくさない。これらを再配布禁止の抜け道とする作者の明文は確認できない。動画として書き出せば動画用候補を検討できるが、fuzzy6のinteractiveな静止・seek機能を持つ公開Webとは成果物が変わるため、この依頼を動画制作へ置換しない。

**外部CI案の公開範囲**: GitHub公式は、public repositoryをreadできるサインインユーザーがworkflow artifactsを取得できると説明し、base branchのcacheはforkのPRからもアクセスできると説明する。従って「Gitにcommitしなければ非公開」で済ませない。元PSD・ZIPを配信dist／通常artifact／cacheに混ぜず、必要PNGだけが公開される設計を、許諾取得後に確認する。Pages用artifactにも配信されるPNGが入るので、その公開許可は必要。secret・内部URLのlog出力を避け、download／展開はUnit 7の有限上限を使う。自動取得先の具体的規約／CORS／availabilityは採用先未定につき未検証。外部CI案を実装しない。

### All rights reserved・credit・決定事項

- 現在のfuzzy6のARR方針をコード・ボスの独自著作物に維持することと、第三者素材の権利帰属・直接許諾を正しく案内することは両立する。採用時は対象ファイル／作者／配布version／URL／条件／確認日を別記し、第三者素材への権限をfuzzy6が新たに許諾するとは書かない。坂本アヒルの自由利用条件をfuzzy6のARRで消すとも書かない。LICENSE等の実編集は本調査の対象外。
- creditの基本案は、使用声に応じ `VOICEVOX:四国めたん`、`VOICEVOX:ずんだもん` を別表示し、`キャラクター：東北ずん子・ずんだもんプロジェクト（SSS LLC.）`、採用作者なら `立ち絵：坂本アヒル` 等を加える。素材URL／versionはCreditsの詳しいページやREADMEへ。音声creditは必須、SSSの(c)と坂本アヒルcreditは確認した条件では任意。浅井麻等の固有条件はUnit 4の通り、creditだけで本件使用を許可に変えない。
- ボスの最初の選択は **(a)坂本アヒル／公式を第一候補にしてGit条件を確認する、(b)利用者持込み・手元専用を選ぶ、(c)自作／依頼制作＋SSS条件を整える** のいずれか。Git＋Pages収録を続けるなら、未確定のまま公開するかを暗黙に決めず、原作者・SSSの具体的許諾範囲を確認する材料を渡す。SSSの回答原則も踏まえ、質問の回答が得られない場合のfallbackを決める。
- 次に選ぶのは両者のversion／姿勢／上半身の構図、3段階口パクか5母音か、足りない差分を描き足すか、Nを閉と共用するか、聞き手・restの瞬き、二人のcredit／話者交代の仕様。見た目・根幹仕様はAGENTSの担当へ渡し、素材と口パクデータの契約が決まってからspecを更新する。現契約の一話者と同時二立ち絵を混同しない。

### 問い合わせ文の準備案（送信していない）

「個人・非商用の解説Webアプリ fuzzy6（公開Git `https://github.com/advantame/fuzzy6`、GitHub Pages `https://advantame.github.io/fuzzy6/`）で、四国めたん・ずんだもんを字幕の左右へ表示します。〔配布URL・version・作者〕から上半身、口・目差分を切り出し／縮小し、必要なPNGだけを公開repositoryに置きCIで配信したいです。PSD／ZIP原本や素材集としては配布せず、権利帰属・原規約・creditを示します。PNGは個別URLで取得でき、GitHub内でrepositoryの閲覧・forkが可能になります。この公開は素材再配布／再許諾の条件上認められますか。現行GitHub ToS D.4〜D.7（host・copy・解析・AI／ML開発学習等を含む許諾）への権限も満たせるか、Gitを外してPagesへPNGを配信する方式なら条件が変わるか、認められる方法とcreditをご教示ください。」

実際に問い合わせる際は作者には作者素材の条件、SSSにはキャラ・公式素材・再許諾条件を分け、選定version・出力範囲を絞る。作者の許可だけでSSSを代理させる／SSSだけで他作者の禁止を解除する質問にしない。AI範囲を隠して「表示だけ」と説明しない。問い合わせ送信は依頼されていないので実行しない。

### 未解決点・計画の完了・報告turnへの引継ぎ

未確定の中心は、SSS禁止事項10とGitHubのhost／fork／AI等の許諾との整合、公式2D／坂本アヒルの部品PNG公開についての個別明文、akihiyoの詳細な作者条件。実素材のlayer名・頭身・同梱README・導入成功・合成品質・実音声offsetは、素材本体を取得しない今回の制約から未試験として残す。どれも出典のない推測で埋めない。研究の成果として比較・技術手順・判断材料は揃い、採用可否が確定しないことを研究継続のblocked条件とはしない。

初期8単位を全て完了した。追加の問いは合成の整合性、資源の有限性、現行GitHubのAIを含むContent許諾、無料利用質問への回答原則であり、いずれも元の「公開リポジトリで使えるか／この機械で書き出せるか」に必要な既定単位内で追究した。計画の単位追加・削除はない。作品選定後の実PSD検査・実装試験・作者／SSSへの個別確認は次工程として保留する。

**次は報告turn。`ready-to-report`／ready to write report を返し、checkpoint後にattendantが明示する “This is the report turn” でのみreport.mdを書く。** 報告は日本語で、候補比較表、規約の確かな点と判断不能な点／公開Git見立て、credit、口パク案、書き出し手順、ボスの決定事項、要約・不確実性・問い／計画の進展・推奨次行動を含める。資料の確認日は全て2026-10-11、短い引用とURLを添える。元素材は取得せず、log以外のproject fileも変更していない。


## 報告turn完了

記録 UTC: **2026-10-11 07:56:04 UTC**（完成後の構成確認時刻）。attendant の明示した report turn で、初期計画と Unit 1〜8 の全ログを読み直し、`report.md` を作成した。

報告は日本語で、要約、候補比較、作者・キャラ規約と公開 Git の確かな点／未確定点、クレジットとずんだもん音声差分、口パク・瞬き案、aarch64 向けの未実行書き出し手順、代替構成、ボスの決定事項、調査の進展と次工程を含む。出典 URL・確認日・短い引用を記載した。公式／坂本アヒルの肯定的な Web 利用根拠と、GitHub の host・fork・AI 等の許諾との未確定点を分け、公開 Git に無条件収録可とは断定していない。

確認: 六つの要求節、ローカル参照リンク、コードフェンス、出力が `log.md` と `report.md` の二つだけであることを検査した。新しい調査単位は追加していない。元素材／プレビューの取得、依存導入、Engine 起動、アプリ編集、問い合わせ送信、merge／push は行っていない。report turn のため checkpoint は要求せず、`state: done` を返す。
