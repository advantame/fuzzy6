# 四国めたん・ずんだもんのウェブ用立ち絵調査

確認日：**2026-10-11 UTC**。以下のリンク先・規約・ローカル資料は、特記のない限りこの日に確認した。規約の施行日が分からない場合も、この日付は確認日を意味する。調査過程・取得方法・追加の出典は [log.md](log.md) に記録した。

## 要約

**今回確認した資料だけでは、立ち絵の部品 PNG を公開リポジトリ `advantame/fuzzy6` に置き、現行の GitHub 契約の下で Pages に配ることまで、無条件に許可された候補は確定できない。** 一方、個人・非商用のウェブ表示には、公式素材と坂本アヒル素材に明確な肯定的根拠がある。既存素材を選ぶなら、**坂本アヒルの両キャラを第一候補、公式を次の候補**として、公開 Git の条件を詰めるのが有力である。

中心の未確定点は、SSS の「再許諾」禁止と、GitHub が投稿者に求めるホスト・複製・公開 fork 等の許諾との整合である。現行 GitHub 規約には AI／ML の学習・開発等も含まれる。作者の加工許可、ウェブでの使用許可、公開 Git に画像を収録する許可は、それぞれ分けて判断する必要がある。[SSS ガイドライン](https://zunko.jp/guideline.html)、[GitHub 利用規約 D](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)

のんたお ver.2.0 は二次配布・AI 学習禁止があり、現条件での Git 収録を勧めない。浅井麻素材は動画外の無断使用を禁止するので、本件ウェブ利用にも別途許諾が必要。akihiyo は詳細な作者条件を一次資料で確定できず、採用判断を保留する。

**素材本体・プレビュー画像は取得していない。** 完全なレイヤ一覧、正確な頭身、同梱 README、実 PSD の合成品質は未確認である。依存導入・書き出し試験・VOICEVOX Engine 起動・問い合わせ送信・アプリ変更・公開操作も行っていない。以下の手順と数値案は、次工程のための材料である。

## 1. 候補の比較

### 1.1 配布・入手・絵柄

「登録不要」は、配布ページの条件と未認証で読めた範囲の判断である。**どの候補も実ファイルの取得は試していない**。ニコニコ／pixiv の閲覧制限と、作者が指定する外部配布先のダウンロード条件は別である。

| 候補 | 正規の配布場所・版 | 形式と入手条件 | 絵柄・上半身使用 |
|---|---|---|---|
| 公式・ずんだもん | [公式素材一覧](https://zunko.jp/con_illust.html)。人型 `zunmon008.psd`、妖精 `zmon_2003.psd` | PNG 多数と PSD。ページ上に登録要求なし。リンクを生成する HTML／JavaScript を確認 | 人型・妖精・SD の選択肢。上半身切り抜きは公式の加工許可に根拠あり。口パク向きかは未確認 |
| 公式・四国めたん | [公式素材一覧](https://zunko.jp/con_illust.html)。SD の `met_s214`～`met_s222`、9 PSD | PNG と PSD。ページ上に登録要求なし | 通常絵と SD。上半身加工は同上。各姿勢の字幕枠への適合は未確認 |
| 坂本アヒル・ずんだもん無印 | [作者投稿](https://seiga.nicovideo.jp/seiga/im10788496) → [配布フォーム](https://ux.getuploader.com/s_ahiru/download/37)、現リンク 2.3 | ZIP 内 PSD／PSDTool 対応。フォームはログインではなく公開 pass `zunda`。登録要求は見つからない。同梱 PNG 未確認 | 小さめのデフォルメ人型として使われる代表候補。上半身 crop に肯定的な許諾根拠あり |
| 坂本アヒル・ずんだもん V3.2 | [作者投稿](https://seiga.nicovideo.jp/seiga/im11206626) → [配布フォーム](https://ux.getuploader.com/s_ahiru/download/59) | ZIP 内 PSD。pass `zunda`。簡単な構造の「通常版」「上向き版」を追加したと作者が説明 | 顔のバランス等を調整した別版。2.3 の差分名・構造を引き継ぐと決めない |
| 坂本アヒル・四国めたん | [作者投稿](https://seiga.nicovideo.jp/seiga/im10791276) → [配布フォーム](https://ux.getuploader.com/s_ahiru/download/35)、2.1 | ZIP 内 PSD／PSDTool 対応。pass `ch4`。登録要求は見つからない。同梱 PNG 未確認 | 通常めたん。両キャラの作者を揃えられる。上半身 crop は選ぶ腕・姿勢を確認する |
| 坂本アヒル・ちびめたん | [作者投稿](https://seiga.nicovideo.jp/seiga/im11020697) → [配布先](https://ux.getuploader.com/s_ahiru/download/41) | PSDTool 対応。pass `ch4`。このフォーム自体は未確認 | 作者の説明は「やや子供っぽくアレンジしてます。」。組合せを変えたい場合の候補 |
| akihiyo・両キャラ | [ずんだもん](https://seiga.nicovideo.jp/seiga/im10792934) → [配布先](https://ux.getuploader.com/hiyohiyo25252/download/3)、[めたん](https://seiga.nicovideo.jp/seiga/im10796593) → [配布先](https://ux.getuploader.com/hiyohiyo25252/download/4) | PSD は実利用記事で確認。pass は順に `zunda`／`metan`。作者 caption に登録必須の記載なし。ただしフォーム取得失敗のため要否を確定できない | 作者がめたんを「足が短い立ち絵」と説明。短い脚のデフォルメ。作者の詳細加工条件が未確定なので crop の採用判断も保留 |
| のんたお・ずんだもん ver.2.0 | [作者投稿](https://seiga.nicovideo.jp/seiga/im10857524) → [配布先](https://ux.getuploader.com/nontao/download/45) | PSDTool 対応。pass `maru25`。登録要否はフォーム取得失敗で未確定。同梱 PNG 未確認 | この版の正確な頭身・構図は未確認。加工可なので crop に根拠あり。同作者の対応するめたんは今回未確認 |
| 浅井麻・両キャラ通常／SD | [共通配布ページ](https://asavo.fanbox.cc/posts/2535217)。通常：[ずんだもん](https://seiga.nicovideo.jp/seiga/im10785964)／[めたん](https://seiga.nicovideo.jp/seiga/im10787066)。SD：[ずんだもん](https://seiga.nicovideo.jp/seiga/im10790258)／[めたん](https://seiga.nicovideo.jp/seiga/im10792060) | 前向き素材は ZIP／PSDTool 対応。FANBOX の無料投稿・支援加入不要を確認。ファイル取得時のログイン要否は未試験。背面に PNG の別素材もある | 通常頭身と SD を両方揃えられる。良識内加工は可。ただし本件ウェブ利用には別許諾が必要 |

公式 PSD の直接リンク例は [人型ずんだもん](https://zunko.jp/sozai/zundamon/zunmon008.psd)、[妖精ずんだもん](https://zunko.jp/sozai/zundamon/zmon_2003.psd)、[SD めたん](https://zunko.jp/sozai/methane/met_s222.psd)。リンクの存在を確認したもので、ファイル本体は取得していない。公式が案内するキャラクターデザインは江戸村ににこだが、一覧の全画像を同一作者の作品と断定していない。

頭身の数値は全候補で未確認。「通常」「SD」「子供っぽい」等の作者の区分と、利用例に基づく定性的な説明に留める。字幕帯の高さ 180px に収める最適な crop は、正規取得後にプレビューで選ぶ。

### 1.2 口・目の差分と実名

**PSDTool 対応は、あいうえお 5 形や「ん」専用形が揃うことを保証しない。** 作者の表情名と音素の対応も同じではない。

| 候補 | 作者一次資料で確認した名称・構成 | 口パク・瞬きの評価限界 |
|---|---|---|
| 公式・両キャラ | 配布ページに口・目の完全一覧や実レイヤ名を発見できない | あいうえお、閉じ、ん、半閉じ目等は全て未確認 |
| 坂本アヒル・ずんだもん 2.3 | 作者 caption から完全一覧は確認できない | 下記の使用者の記事には 3 段階口・目の具体名がある。実 PSD／採用版で照合が必要 |
| 坂本アヒル・ずんだもん V3.2 | 更新説明で口「えへ」「ほほえみ」「あは」、眉「基本眉2」 | これらを a/i/u/e/o と決めつけない。閉じ／ん／全目差分は未確認 |
| 坂本アヒル・めたん 2.1 | 更新説明で目「くるぐる」、腕「ひそひそ」「マイク」等 | 全口・全目一覧、5 母音、N 専用形は未確認 |
| 坂本アヒル・ちびめたん | PSDTool 対応の記述 | 実レイヤ名・個数は未確認 |
| akihiyo | 作者 caption に完全一覧なし | 使用者が不足する「い」を加工して追加した例がある。記事の「あいうえお」は作者の元レイヤ名ではない |
| のんたお ver.2.0／浅井麻 | PSDTool 対応の記述 | 全口・全目、あいうえお、閉じ／んの名称と個数は未確認 |

坂本アヒル 2.3 を操作した使用者は、口を `口/むふ`（閉じ）→ `口/ほー`（中間）→ `口/ほあー`（開き）と説明している。目は `目/目セット/普通白目` と `目/目セット/黒目/普通目` の組合せ、半閉じ「細め目」、閉じ「なごみ目」。**作者の一次一覧でも本調査の実 PSD 検査結果でもない**ので、候補評価用の補助情報である。[使用者の操作記録](https://dev.ore-shika.com/post/ymm-lipblink/)

akihiyo の利用記事では、めたんの「い」を「え」の横伸ばしで作り、名前を母音名へ付け直している。元素材にその 5 形が存在するという証拠にはならない。[利用者による差分追加例](https://www.simulationroom999.com/blog/with-voicevox-and-aivisspeech-characters-creating-videos-using-standing-pictures-preparation/2/)

坂本アヒル・akihiyo・のんたおには、解説／実況や制作教程の使用例を確認した。例えば [Saityo の動画](https://www.youtube.com/watch?v=ulke1mX2HA4) は両キャラの坂本アヒル credit を示し、[大学同好会の記事](https://trap.jp/post/1565/) は akihiyo 素材を紹介する。浅井麻も配布投稿で公式解説の使用を紹介する。「広く使われる」の代表候補として調べたが、人気順位・市場 share の調査ではない。利用者の公開 Git や二次配布例の存在は、作者の許諾証拠にしていない。

## 2. 規約と公開リポジトリ収録の見立て

### 2.1 キャラクターと公式素材の条件

基礎資料は [東北ずん子・ずんだもんプロジェクトのガイドライン／FAQ](https://zunko.jp/guideline.html)。音声ライブラリと作者の立ち絵は別の条件も持つ。

| 利用者・目的 | 公式の整理と本件への適用 |
|---|---|
| 個人・非商用 | 事前申請不要。ずんだもん・四国めたんとも対象。本件の個人非商用解説は、この入口で評価できる |
| 個人の同人 | 原価回収目的の節度ある有償頒布を認める。通常の営利商流と同一ではなく、万能な売上閾値は確認できない |
| 個人ブログ・動画の一般広告等 | 非商用扱いとする例外あり。他企業のスポンサー案件等は別扱い |
| 企業等の商用 | ずんだもんは東北 6 県、めたんは四国 4 県に地域内の無償利用制度。所在地等の表示条件あり。地域外は [ライセンス窓口](https://zunko.jp/con_shoushi.html)。本件非商用に地域条件を持ち込む必要はない |
| 技術紹介の商用例外 | キャラの利用を広げるプログラミング・3D 等の紹介についての例外。数学解説一般への拡張根拠にはしない |

ウェブ表示については FAQ が **「Webページに使うことも可能です。」** と明示する。認識可能な切り抜き、色変更、フィルタ、重なり、服装変更等も認める。縮小やレイヤ別 PNG 書き出しという工程名は列挙されていないが、通常の表示加工には肯定的な根拠がある。ただし、加工物の部品を別途配る権限までは同じ説明だけで確定しない。[公式 FAQ・加工条件](https://zunko.jp/guideline.html)

主な禁止用途は、原作が分からない改変、他人の二次創作の無断使用、商標／意匠による独占、素材そのもの・素材を主とする販売、権利侵害や著しいイメージ毀損、特定者・団体・国家への非難等、政治・宗教関連、情報商材等の販売宣伝、意図的虚偽、指定風俗営業、反社会的勢力、禁止行為の助長である。実際の解説内容を最終版の全文に照らす必要がある。[公式禁止事項](https://zunko.jp/guideline.html)

**自作の二次創作絵も使用できる**が、キャラクター条件は残る。他の作者の配布素材の再配布禁止を避けられることと、SSS の条件が消えることは別である。免責 7 は、準拠する二次的著作物を作品の振興目的で SSS が配信／放送利用する許諾も定める。依頼制作は支払だけで必要な権利が全部移ると考えず、加工・部品 PNG・公開 Git・ウェブ配信の範囲を作者と合意する。[二次創作・免責条項](https://zunko.jp/guideline.html)

`（ず・ω・きょ）` は、ガイドラインに準拠し、他のクリエイター等の自由利用を意図する表示。自作絵を All rights reserved で管理したい場合、この表示を必須だと思って付ける必要はない。SSS のキャラ権と自作絵の権利帰属は分ける。[自由利用表示の説明](https://zunko.jp/guideline.html)

### 2.2 作者ごとの追加条件

| 素材 | 確認できた条件・短い原文 | 改変・再配布・商用の判断 |
|---|---|---|
| 公式 | ウェブ使用・通常加工を許可。素材自体の「販売」を禁止。禁止事項 10 はライセンス権の全部・一部について **「再許諾することは禁止」** | 今回読んだ本文に 2D 素材の無償再配布一般の明示禁止は見つからない。しかしその不在だけで Git 収録可とはならない。3D 改造再配布の明示許可を 2D に転用しない |
| 坂本アヒル・対象 4 投稿 | **「公式の規約の範囲なら何に使ってもだいじょうぶ！」**、`（ず・ω・きょ）` | 公式の非商用／同人／企業区分・禁止用途に従う。crop・縮小・部品書き出しに肯定的根拠。作者独自の無償再配布禁止は見つからない。「坂本素材は一律再配布不可」と断定する資料ではない |
| akihiyo・対象 2 投稿 | 公開 caption・プロフィールから詳細な作者利用規約を確定できない | credit、加工、再配布、ウェブ、商用の追加条件は未確認。利用者の記事や Git 同梱例で補わない |
| のんたお ver.2.0 | **「必要に応じて加工、加筆OKです。」**、禁止項目 **「立ち絵の二次配布」** | 公式範囲の動画収益化は可、それ以外の商用不可。AI 学習、政治宗教、中傷・残虐・批判的内容、イメージ毀損、グッズ化、原型を留めない改変等も禁止 |
| 浅井麻 | **「動画以外での無断使用（SNSアイコン等も不可）」**、二次配布禁止 | 個人動画投稿・配信と良識内加工を許す。動画配信収益以外の商用、著しいイメージ毀損、中傷、政治宗教等を禁止。作者補足にニコ静投稿の限定例外があるが、本件のウェブアプリを含まない |

出典：[公式](https://zunko.jp/guideline.html)、坂本アヒル [ずんだもん 2.3](https://seiga.nicovideo.jp/seiga/im10788496)／[V3.2](https://seiga.nicovideo.jp/seiga/im11206626)／[めたん 2.1](https://seiga.nicovideo.jp/seiga/im10791276)／[ちびめたん](https://seiga.nicovideo.jp/seiga/im11020697)、akihiyo [ずんだもん](https://seiga.nicovideo.jp/seiga/im10792934)／[めたん](https://seiga.nicovideo.jp/seiga/im10796593)、[のんたお](https://seiga.nicovideo.jp/seiga/im10857524)、浅井麻 [主規約](https://asavo.fanbox.cc/posts/2011932)（本文更新 2022-09-02）／[作者補足](https://kakuyomu.jp/works/1177354055409884147/episodes/16816700429167142445)。

ニコ静の本文は、例えば [坂本アヒル投稿の公開テキスト API](https://seiga.nicovideo.jp/api/illust/info?id=10788496) の description でも確認した。浅井麻の無料投稿・規約は FANBOX の公開 JSON から本文と添付 metadata を確認した。詳しい取得 URL は log.md にある。別キャラや別 variant の規約を本候補へ流用していない。

### 2.3 ウェブ配信と公開 Git を分ける理由

GitHub 利用規約の現行表示は **2026-04-27 発効**。画像も Content に含まれる。D.3 は第三者素材の投稿権限・ライセンス遵守を投稿者の責任とし、既存ライセンスが GitHub に必要な権限を与えていれば追加許諾は不要とも定める。従って「公開 Git なら全素材不可」と一律に決める根拠でもない。[GitHub 利用規約 A・D.3](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)

ただし、次の範囲まで照合が必要である。

- **D.4：ホスト等の許諾。** 保存・アーカイブ・解析・表示・複製等に加え、現行文面は **“including by training AI Features”** とし、Affiliates の AI／ML の学習・開発・改善等も含む。
- **D.5：公開 repository の他ユーザーへの許諾。** **“view and "fork"”** に加え、サービス内での use／display／perform／fork による reproduce を認める。第三者素材にも必要な条件を確保する。Git 外での無制限な再販売・一般再利用まで自動的に許すという意味ではない。
- **D.7：著作者人格権等。** 不行使等と、それが成立しない場合の代替許諾がある。利用者が原作者の権利を当然に放棄できると考えない。
- **削除後の扱い。** 既存 fork 等は許諾終了の例外。公開後に消せば全コピーを回収できるわけではない。

以上の出典は [GitHub 利用規約 D.3～D.8](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)。J.3 の AI 設定の opt-out は D.4～D.8 を制限せず、public repository の Content には適用されないとするため、Copilot 設定を OFF にするだけで作者の AI 学習禁止が解消するとはいえない。[同規約 J.3](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)

Pages の追加規約は **2026-08-27 発効**。本件の個人非商用解説は、オンライン business／EC／商用 SaaS 等のホスティング禁止に当たらないとの見立てだが、Pages も基本契約に従う。**Git への commit を避け、CI が外から取り込んだ PNG を Pages だけに置く場合も、GitHub のホストと画像配信の許諾確認は残る。** 本調査で Pages 用の素材権利の例外条項は見つからない。[GitHub 追加規約・Pages](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)

これは原文の照合による見立てであり、権利者による本アプリの個別認証ではない。個人の非商用利用と、営利企業であるホストへの契約上の許諾は、別に評価する。

### 2.4 本件の採否表

| 候補 | 確かな点 | 文面だけでは決められない点／公開 Git の見立て |
|---|---|---|
| 公式 | 本件の非商用ウェブ使用と認識可能な加工に根拠あり | 部品 PNG の独立公開、再許諾禁止と GitHub D の整合が不明。**収録可とは確定できない** |
| 坂本アヒル | 広い使用許可・自由利用表示。独自の無償再配布禁止なし | 直接の自由利用許諾が GitHub の必要範囲を覆うか、SSS 条件との整合が不明。**既存素材の第一候補、条件付きで有力** |
| akihiyo | 両キャラの配布と実用例あり | 作者の詳細条件から先に確認。**判断保留** |
| のんたお ver.2.0 | 加工可、二次配布・AI 学習禁止が明示 | 部品 PNG の Git 公開は二次配布禁止に抵触する見立てが強い。ウェブ配信だけの例外も未確認。**現条件で採用しない** |
| 浅井麻 | 動画外の無断使用・二次配布禁止が明示 | Canvas アニメを動画投稿と同一視できない。**本件ウェブ・Git とも個別許諾が先** |
| 自作／依頼制作 | 第三者の配布素材の禁止を避け、必要な差分を用意できる | SSS のキャラ条件・再許諾問題は残る。依頼作者との契約でも GitHub の範囲を明示する |

各行の素材条件は §2.1～2.2 の一次出典、Git の評価は §2.3 との照合である。通常の作品中でのウェブ表示まで「再配布だから全面禁止」とする一般論も、画面で使うなら部品 Git 公開も必ず許されるという一般論も、今回の作者文面からは導けない。

### 2.5 All rights reserved の扱い

[現在の LICENSE](/home/apm/orca/workspaces/fuzzy6/searobin/LICENSE) は GitHub 内の閲覧・fork 等を除外し、第三者条件も別に案内する。新しい素材を使うなら、作者・対象ファイル・配布版・URL・条件を第三者素材として明記する。fuzzy6 の独自コード等の All rights reserved 方針は維持できるが、坂本アヒルや SSS が直接与える許諾を取り消す表示や、立ち絵まで advantame が全権利保有する表示にはしない。ARR は GitHub 内の最低限の fork 許諾を消せない。[GitHub のライセンス説明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)

## 3. クレジットと、ずんだもん音声の差分

### 3.1 推奨する表示

両者の声と坂本アヒル素材を採用する場合の表示案：

```text
VOICEVOX:四国めたん
VOICEVOX:ずんだもん
立ち絵：坂本アヒル
キャラクター：東北ずん子・ずんだもんプロジェクト（SSS LLC.）
```

| 対象 | 必須／任意と書き方 |
|---|---|
| VOICEVOX 音声 | 使用した声ごとに **`VOICEVOX:ずんだもん`**／**`VOICEVOX:四国めたん`** を記載。音声を使わず立ち絵だけ出すキャラに、その音声 credit が必須になるわけではない |
| 公式キャラ・公式素材 | `(c)` は公式条件では必須でない。上記のキャラ表示と配布ページ・規約リンクは推奨する出典表示 |
| 坂本アヒル・対象素材 | 作者独自の必須書式・親作品登録義務は見つからない。公式の自由利用表示の説明でも credit は任意。推奨は `立ち絵：坂本アヒル`＋採用版の配布 URL |
| akihiyo／のんたお ver.2.0 | caption に必須書式を発見できない。`立ち絵：akihiyo`／`立ち絵：のんたお`＋配布 URL は出典案であり、義務がないことの確定ではない。未確認の同梱条件も確認する |
| 浅井麻 | 許可された動画用途では、ニコ動は対応イラストへのコンテンツツリー登録。それ以外の動画メディアは作者名と `@asaiasa0` または [作者 URL](https://twitter.com/asaiasa0) を動画内／説明に記載。例 `立ち絵：浅井麻（@asaiasa0）`。**この表記だけで本件ウェブ利用は許可されない** |

素材 credit の根拠は §2.2 の作者規約と [公式自由利用 FAQ](https://zunko.jp/guideline.html)。詳細な Credits／README に素材名・版・配布 URL・確認日を残すと、改版や fork 時も条件を追える。

### 3.2 四国めたんの既存調査からの差分

SSS の VOICEVOX 章はずんだもん・四国めたんを同じ許諾対象にし、生成音声は credit を付けて商用／非商用に使用できる。原文の例は **「VOICEVOX:ずんだもん、VOICEVOX:四国めたん」**。今回、ずんだもんだけに追加の用途制限は見つからなかった。したがって主な追加は **ずんだもんの音声を使った場合の表記を足すこと**である。[SSS 音源規約](https://zunko.jp/con_ongen_kiyaku.html)

SSS はアプリの紹介画面等の **「少し探せばわかる場所に」** credit を求める。既存の rail とトップ／音声 README に二人分を出す案が合う。声優名、スタイル名、ロゴ、全フレームへの焼込み、各 Opus への credit 音声追加までは、確認した本文で必須とされていない。[SSS 音源規約](https://zunko.jp/con_ongen_kiyaku.html)、[VOICEVOX FAQ](https://voicevox.hiroshiba.jp/qa/)

四国めたんと同じ共通音源の禁止用途は引き継ぐ。政治宗教等、特定者等への非難・批判・応援、情報商材、意図的虚偽・誤解を招く内容、指定風俗業、反社会的勢力等の制限がある。ソフト規約も各音源条件の遵守・下流への条件継承を求める。**音声の商用可をキャラ絵や PSD の商用・再配布許可へ転用しない。** [SSS 共通音源規約](https://zunko.jp/con_ongen_kiyaku.html)、[VOICEVOX 利用規約](https://voicevox.hiroshiba.jp/term/)

本機の Engine 0.25.2 同梱ずんだもん policy も、この表記と商用／非商用可を示した。Engine は起動せずテキストだけを確認した。従来の完成音声の公開方針は [既存の四国めたん調査](/home/apm/orca/workspaces/fuzzy6/searobin/research/voice-terms/report.md) と AGENTS.md を引き継ぎ、画像の Git 許諾は本報告で独立に評価する。

## 4. リップシンク・まばたきの仕組みと割り当て案

### 4.1 YMM4 と PSDToolKit の慣習

**YMM4 は 4.49.0.0（2026-02-01）から、標準の「動く立ち絵」「Psd 立ち絵」であいうえお口パクに対応する。** VOICEVOX 等は合成エンジンの口パク情報を使い、その他は音声解析による情報を使うと公式が説明する。古い外部プラグインの「標準では未対応」という説明は現状へ転用しない。[公式リリース](https://manjubox.net/ymm4/release/4.49.0.0/)

YMM4 の PNG 素材規格は次のとおり。**書き出し後の名前であり、元 PSD のレイヤ名の決まりではない。** PSD 版は任意のレイヤをマネージャーで各状態へ割り当てる。[PNG 素材の作り方](https://www.manjubox.net/ymm4/faq/立ち絵機能/動く立ち絵素材の作り方/)、[PSD 立ち絵 FAQ](https://manjubox.net/ymm4/faq/立ち絵機能/psd/)

| 方式 | 名前と状態 |
|---|---|
| あいうえお | `パーツ名.a.png`、`.i.png`、`.u.png`、`.e.png`、`.o.png`。閉じは `.0.png`。数字・母音を付けない `パーツ名.png` はこの方式ではサムネイル用。公式一覧に `.N.png` はない |
| 音量による開閉／目パチ | `.0.png` が閉じ、`.1.png` 等が任意の中間、数字なしの `パーツ名.png` が開き。中間を必ず 1 枚に限る規格ではない |

PSDTool の独自レイヤ規則は、先頭 `*` が同じ親の下で排他的に一つを選ぶ指定、先頭 `!` が強制表示、末尾 `:flipx`／`:flipy`／`:flipxy` が反転用差分。例えば `!口` の下に `*あ`／`*い` 等を置く。**PSD ファイル形式そのものの意味ではなく、psd-tools／ag-psd が自動的に再現する機能でもない。** [PSDTool マニュアル](https://oov.github.io/psdtool/manual.html)

AviUtl の PSDToolKit は、通常の口パクを音量のしきい値で、あいうえお口パクを a/i/u/e/o/N の 6 状態の割り当てで動かす。後者は wav と同名の lab 等の音素タイミングが必要で、PSDToolKit 自体が wav から母音を自動認識するわけではない。目パチは開き・閉じの 2 状態から使え、中間は任意。[PSDToolKit 口パク・目パチ](https://oov.github.io/aviutl_psdtoolkit/psd.html)（表示版 beta72、文書生成 2026-09-09）

同文書の子音処理は、すべて「ん」、直前母音の保持、前後母音の小さい形による補間という 3 方式。閲覧時の [公式 Lua source](https://raw.githubusercontent.com/oov/aviutl_psdtoolkit/main/src/lua/PSDToolKit.lua) では、mode 1 は `pau`／`N`／`cl` で閉じ側へ戻り、その他は直前状態を保持する。mode 2 は `m`／`p`／`b`／`v` 等を閉じ側にする。子音を全て毎回閉じる以外にも、ちらつきを減らす実用上の選択肢がある。

### 4.2 fuzzy6 の割り当て案

以下は上記の慣習を参考にした**本アプリ用の提案**で、全ソフト共通の規則ではない。

| VOICEVOX 音素・状態 | 5 母音の差分がある場合 | 補足 |
|---|---|---|
| `a i u e o` | 同じ母音の口 | 母音方式の基本 |
| `A I U E O`（無声母音） | 小文字と同じ形 | PSDToolKit mode 0／2 の実例に沿う。無声という理由だけで必ず閉じない |
| `N` | 「ん」専用、なければ閉じと共用 | 簡略化。N は小文字 `n` 子音とは別。発音上いつも唇が閉じるという主張ではない |
| `cl`（促音） | 初版は閉じ | mode 0／1 を参考にした簡単な案。精密化時は前後母音への遷移を比較する |
| `pau`／`sil`、聞き手、未発話、データなし | 閉じ | 無音で口を開いたままにしない |
| `m my b by p py` | 短く閉じ | mode 2 の m/b/p を参考に拗音にも広げる案。元ソフトの全条件と同一ではない |
| その他の子音 | 次の母音の小さい形、または直前母音を保持 | 小さい形がなければ保持を試す。全子音を閉じる方式と実画面で比較する |
| 未知の音素 | 閉じ＋短い診断 | 状態不明で開き続けることを避ける |

母音形が未確認の坂本アヒル素材は、**閉じ／中間／開きの 3 段階を最初の候補**にする。2.3 の `むふ`／`ほー`／`ほあー` が実ファイルで確認できれば割り当てやすい。音量方式は制作時に包絡線を有限長の配列へ変換しておき、音素方式は母音区間に開く状態を割り当てる。この 3 段階方式は 5 母音を描き分ける方式と同じ忠実度ではない。「えへ」等の表情名を無理に母音へ読み替えない。

二人の絵は同時表示し、口を動かすのは発話者だけ、聞き手は閉じ口にする。現仕様は一話者の `deck.voice` と一つの同時音声なので、**二立ち絵の表示と二音声の同時再生を混同しない**。話者交代を行うなら話者 ID と口形区間の追加契約が必要。[docs/spec.md](/home/apm/orca/workspaces/fuzzy6/searobin/docs/spec.md) §7・§9

### 4.3 VOICEVOX の時間情報を使う方法

Engine 0.25.2 の `AudioQuery.accent_phrases[].moras[]` は `consonant`、`consonant_length`、`vowel`、`vowel_length` を持ち、句末に任意の `pause_mora` がある。子音のないモーラもある。母音には大文字無声母音、N、cl、pau も入る。字幕の文字数から均等配分するより、この合成時の区間を使うのが適している。[AudioQuery 定義](https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/model.py)、[Mora 定義](https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/model.py)、[音素定義](https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/phoneme.py)

正確に合わせる場合は、**実際に使用した最終 query と synthesis オプション**から、次の変換を再現する。

1. 子音→母音、句末 pause の順で区間を並べ、前後無音を加える。
2. `pauseLength` の置換、`pauseLengthScale` の倍率を適用する。
3. 前後無音を含む全音素長を `speedScale` で割る。
4. 93.75Hz（24000/256）で音素ごとのフレーム数へ丸め、積算する。

実装の丸めは NumPy の偶数丸めで、JS の `Math.round` とは半整数で異なる。疑問形補正が有効なら、末尾の同じ母音 0.15 秒の追加モーラも先に反映する。モーラ長の単純な総和だけでは、そのまま合成時刻と一致しない。[Engine 0.25.2 合成処理](https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/tts_engine.py)

配る口形は音素区間から事前生成した配列にし、現在の音声時計 `t` から求めるのが仕様の純粋時刻・シーク・撮影に合う。既存 manifest には音素タイムラインの契約がないため、このデータの持ち方は次の設計事項。最終 Opus の開始位置・長さとの照合は、許可された合成を行う工程で必要であり、今回測定していない。

### 4.4 まばたきの目安

PSDToolKit の文書例は間隔 4 秒、速さ 1 フレーム、offset 0。二人の場合に offset をずらす説明がある。ただし source の総周期にはパターン遷移分も加わり、追加 blink もあるので、「正確に 4 秒周期」「1 フレームが総閉眼長」とは読めない。YMM4 の現行既定値や、生理学的な最適間隔は今回確認していない。[PSDToolKit 文書](https://oov.github.io/aviutl_psdtoolkit/psd.html)、[Blinker source](https://raw.githubusercontent.com/oov/aviutl_psdtoolkit/main/src/lua/PSDToolKit.lua)

試作案は **4 秒前後、必要なら種付きで 3～6 秒、全体 120～200ms**。開き→半閉じ→閉じ→半閉じ→開きとし、半閉じがなければ 2 枚でよい。4 秒は公式例を参考にした値、3～6 秒と 120～200ms は本報告の制作案であり、ソフトの普遍的既定値や測定結果ではない。

二人は独立した seed／位相にする。同じ `t` なら同じ目になるよう `hash`／`mulberry32` を使って事前計算し、停止中に時計を進めない。`rest` を飾りの動きで埋めない方針に合わせ、rest の瞬きを止めるか最小限残すかは見た目担当とボスが決める。時間の好みは `pace` に集約する。[AGENTS.md](/home/apm/orca/workspaces/fuzzy6/searobin/AGENTS.md)、[仕様の時刻契約](/home/apm/orca/workspaces/fuzzy6/searobin/docs/spec.md) §6.1・§8

## 5. PSD をウェブ用 PNG に書き出す方法

### 5.1 道具の比較

読取りで確認した本機は **aarch64、Python 3.12.3、Node 24.19.0**。次の導入例は未実行である。採用素材の許諾と同梱条件を確かめてから、プロジェクト内だけで行う。

| 道具 | 適した用途 | 制限・aarch64 での方針 |
|---|---|---|
| psd-tools 1.24.0 | tree 検査、マスク等を含むレイヤ／選択状態の全体合成。**最初の推奨** | Photoshop との完全一致は保証されない。文字・smart object・調整・effects 等は対応範囲を確認。`[composite]` でも全機能が再現されるわけではない |
| ag-psd 31.0.3＋pngjs 7.0.0 | Node で tree／RGBA bitmap を読み、単純なレイヤを PNG 化する代案 | ag-psd は **“does NOT generate new composite canvas”**。新しい全体合成の renderer ではない。mask、親 opacity、blend、clipping 等の合成は別途必要 |

根拠：[psd-tools usage](https://psd-tools.readthedocs.io/en/latest/usage.html)、[レイヤ API](https://psd-tools.readthedocs.io/en/latest/reference/psd_tools.api.layers.html)、[ag-psd README](https://github.com/Agamnentzar/ag-psd)、[PSD 構造の説明](https://github.com/Agamnentzar/ag-psd/blob/master/README_PSD.md)、[pngjs](https://github.com/pngjs/pngjs)。

psd-tools の `layer.composite()` はマスク等を含む合成を行うが、`layer.topil()` は生の画素の取得で、マスクを別に読む。**topil で各レイヤを保存しただけでは最終表示と同じとは限らない。** 白目＋黒目や、クリッピングした色等は必要な従属レイヤをまとめる。[レイヤ API](https://psd-tools.readthedocs.io/en/latest/reference/psd_tools.api.layers.html)

### 5.2 psd-tools の導入例と手順

将来の独立した L2 環境の例：

```bash
python3 -m venv tools/character-export/.venv
tools/character-export/.venv/bin/python -m pip install --only-binary=:all: 'psd-tools[composite]==1.24.0'
```

Python 3.12／Linux arm64 の wheel があることを [psd-tools 1.24.0 metadata](https://pypi.org/pypi/psd-tools/1.24.0/json) で確認した。依存にも具体的な arm64 wheel の例として [Pillow 12.0.0](https://pypi.org/pypi/Pillow/12.0.0/json)、[NumPy 2.3.4](https://pypi.org/pypi/numpy/2.3.4/json)、[SciPy 1.16.2](https://pypi.org/pypi/scipy/1.16.2/json)、[aggdraw 1.3.19](https://pypi.org/pypi/aggdraw/1.3.19/json) を確認した。resolver の成功は実機未試験。wheel が不足したら停止し、sudo・apt・system Python・`pip --user` に進まない。成功した版と全依存をロックする。基本ピクセルだけなら extra なしも選べる。[公式導入説明](https://psd-tools.readthedocs.io/en/latest/)

書き出し工程：

1. **正規入手・条件記録。** 作者 URL、版、日付、checksum、同梱 README を確認する。元 PSD／ZIP は非公開作業場所に置き、Git へ自動追加しない。ZIP はパス逸脱、ファイル数、展開後サイズを検査する。
2. **tree を検査。** `psd-tools show` 等で親パス、重複名の識別子、kind、visible、bbox／offset、opacity、blend、mask、clipping を確認する。体・口・目、白目＋黒目のセットを選ぶ。まず完全な実レイヤ一覧をここで作る。
3. **状態を選択。** 必要な祖先を表示し、同じ口／目グループの他差分や不要な衣装・腕・背景を隠す。PSDTool の `*`／`!`／反転ルールは自分で反映する。元 PSD を保存し直す必要はない。
4. **透明背景・共通座標で合成。** 全状態で同じ viewport、crop、倍率、色管理を使う。顔部品は従属する画素・マスク込みで合成する。
5. **原点を保持。** 差分ごとの自動 trim は避ける。小さな bbox で出す場合は left／top と共通 crop 原点を保存する。各差分が別の原点になると口・目が切替時にずれる。
6. **正規プレビューと比較。** 黒目残り、マスク端、色、半透明輪郭、重ね順、反転差分、全状態の原点を確認する。出力の寸法・サイズ・hash を短く記録する。字幕枠で二人が文字を隠さないかは見た目工程で確かめる。

合成の核心は次の呼出し。**可視性選択と入力・メモリ上限を先に適用した後の断片**である。

```python
# psd は許諾済み PSD を読み、選定状態の可視性を設定済み。
image = psd.composite(
    viewport=(0, 0, psd.width, psd.height),
    alpha=0.0,
    ignore_preview=True,
).convert('RGBA')
# 全状態へ同一 crop と縮小を適用して保存する。
```

`ignore_preview=True` は PSD に保存済みの古い全体プレビューを返すことを避ける。`force` はベクトル等の再描画用で、完全再現の万能指定ではない。ICC／sRGB と RGB 8bit の扱いも揃える。[PSDImage API](https://psd-tools.readthedocs.io/en/latest/reference/psd_tools.html)、[1.24.0 の合成 source](https://raw.githubusercontent.com/psd-tools/psd-tools/v1.24.0/src/psd_tools/api/psd_image.py)

部品が独立して合成できるなら `base.png`、口の状態、目の状態に分ける。親 blend や effects が背景に依存して分離を崩す場合は、人物全体の「口×目」だけを有限枚数で焼く。3 口×3 目なら 9 枚、5 母音＋閉じ／ん共用の 6 口×3 目なら 18 枚、N 専用もあれば 21 枚／人。全衣装・全表情の直積を作る必要はない。**全身へ合成しても、素材の加工物であることや作者の再配布条件は消えない。**

### 5.3 ag-psd の Node 代案

将来の独立した `tools/character-export` 配下の例：

```bash
npm install --save-exact ag-psd@31.0.3 pngjs@7.0.0
```

ag-psd の通常依存は pako／base64-js、pngjs は pure JS。[ag-psd 配布 metadata](https://registry.npmjs.org/ag-psd/latest)、[pngjs 配布 metadata](https://registry.npmjs.org/pngjs/latest) で版を確認した。標準の `ag-psd/initialize-canvas` 例は node-canvas を使うため、本機ではその OS 依存を避ける経路を選ぶ。

**`useImageData: true` だけでは canvas 依存をなくせない。** `initializeCanvas` の第 2 引数に ImageData 生成関数を提供する必要がある。最初に `skipLayerImageData: true` 等で構造を読んで、各 layer／mask の寸法・総画素数を確認してから bitmap を読む。[helpers source](https://raw.githubusercontent.com/Agamnentzar/ag-psd/master/src/helpers.ts)、[reader source](https://raw.githubusercontent.com/Agamnentzar/ag-psd/master/src/psdReader.ts)

RGB 8bit の単純な bitmap に対する核心の例（未実行、入力検査・外部 process 制限は別途必要）：

```js
import { initializeCanvas, readPsd } from 'ag-psd';
import pngjs from 'pngjs';

initializeCanvas(
  () => { throw new Error('Canvas is not used in raw export'); },
  (width, height) => {
    // 実装時はここでも寸法・画素数・累計確保量を検査する。
    return { width, height,
      data: new Uint8ClampedArray(width * height * 4) };
  }
);
const psd = readPsd(buffer, {
  useImageData: true,
  skipCompositeImageData: true,
  skipThumbnail: true,
  skipLinkedFilesData: true,
  totalMemoryLimit: 512 * 1024 ** 2,
});
// 検査済みの対象 layer.imageData を得た後：
const png = pngjs.PNG.sync.write(layer.imageData, { colorType: 6 });
// left/top、別の mask、親 opacity/blend/clipping の扱いが必要。
```

この方法は全体 renderer の代わりではない。グループ自身は bitmap を持たず、白目＋黒目の組合せ等はそのまま一つの完成 PNG にならない。正しい合成が必要なら psd-tools を優先する。raw／lazy 読取り経路もあるが、追加 decode 全体に同じ予算が継承されると断定せず、process 全体の上限を併用する。

### 5.4 この機械での処理上限

psd-tools の byte 制限は既定で無効の項目があり、合成の allocation budget は process 全体のメモリ上限ではない。ag-psd の `totalMemoryLimit` も入力 Buffer や JS 全体の上限ではない。小さな PSD でも layer／mask の bbox が巨大になり得る。双方とも別 process のメモリ上限と外部 timeout を使い、同じ event loop の timer だけで同期 decode を止めようとしない。[psd-tools 非信頼入力](https://psd-tools.readthedocs.io/en/latest/untrusted.html)、[ag-psd production の説明](https://github.com/Agamnentzar/ag-psd)

初回の**試作上限案**は、入力 64MiB、文書／layer／mask 各辺 4096px・16Mpixel 以下、1000 layers・深度 64、21 状態／人まで、出力総 256MiB、process 4GiB・120 秒。素材の実寸を測った値ではない。入力確認で合わなければ生成前に見積りを変更する。出力予算を生成前に予約し、固定集合だけを処理する。全組合せ展開・無制限再試行は行わない。小さな自作入力で成功・失敗時の停止を確認してから実素材へ適用し、大きな画像の詳細 diff ではなく寸法・サイズ・hash で診断する。GPU・VOICEVOX Engine は不要である。[機体の有限性規則](/home/apm/orca/workspaces/fuzzy6/searobin/AGENTS.md)

## 6. 代替方法と、ボスが決める必要のあること

### 6.1 画像を公開 Git に置けない場合

| 方法 | 解決する点 | 残る条件・本件への影響 |
|---|---|---|
| 手元でだけ取得・表示 | Git／CI／Pages に素材を渡さず、公開再配布・host／fork の問題を避ける | 作者の利用目的・加工条件は残る。浅井麻の動画外条件が手元ウェブなら自動で許可されるとは読めない。公開版に二人の絵は出ない |
| 利用者が正規入手した画像をブラウザで選ぶ | 公開するのは読込み機能だけ。端末内で使い、server へ upload しなければ運営側の素材再配布を避けられる | 利用者自身も作者条件に従う。正規入手・書き出しを利用者が行う負担がある。初期表示から二人を出す要望とは異なる |
| CI が正規配布元から取り込む | Git 履歴・fork に画像原本を含めない | **Pages で PNG を配る許諾は残る**。自動取得・加工・host 条件を確認する。認証迂回はせず、版・hash、配布終了時の扱いを決める |
| 非公開保管庫から CI が取り込む | Git 原本公開を避け、固定した入力を保持できる | 保管 host の契約も確認。secret は公開 PNG の許諾を変えない。公開 cache／artifact に元 PSD／ZIP を入れない |
| 許諾された外部 host／CDN から画像を読む | 画像 byte を Git／Pages から分離できる | 外部 upload・配信の権限が必要。保存先変更で再配布禁止が消えるわけではない。CORS、可用性、URL 変更を確認 |
| 作者ページへの通常リンク／画像 hotlink | 通常リンクなら自分で素材を配らない | ページへのリンクと画像の自動埋込みは別。hotlink の許可・安定性は未確認。配布 PSD は口形 PNG の代わりにならない |
| 自作・依頼制作 | 配布作者の素材禁止を避け、5 母音や目差分を最初から用意できる | SSS 条件は残る。依頼は crop・縮小・部品化・Git／Pages・fork／host／AI 等の範囲と credit を具体的に合意する |
| 当面は画像なしで公開 | 現行のアプリ・音声公開経路を維持できる | 二人の立ち絵を公開する目的は未達。音声条件は継続する |

素材条件は §2、GitHub 条件は §2.3 を参照。外部取得・外部配信は、条件を満たす場合の構成案であり、個別の取得先・CORS・自動取得規約を検証した完成案ではない。spritesheet、Base64、全身を焼いた PNG、縮小、拡張子変更も、加工物を渡すこと自体は変えない。動画書出しなら動画用素材の条件を検討できるが、seek・静止点を持つ本ウェブアプリとは成果物が変わる。

**CI の成果物は非公開とは限らない。** public repository の read access を持つサインインユーザーは workflow artifact を取得でき、fork の PR から base branch の cache にアクセスできる。Git に commit しなければ元素材が秘匿されるとは考えない。原本を通常 artifact／cache／配信 dist に混ぜず、必要 PNG だけを許可された範囲で配る設計が必要。[artifact の取得条件](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts?tool=webui)、[cache の共有条件](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)

### 6.2 決める順序

1. **公開方式と素材の第一候補。** 坂本アヒル／公式の Git 条件を詰める、利用者持込み・手元専用へ切り替える、自作／依頼制作で作者条件を整える、のどれを進めるか。公開時から二人が見えることを優先するなら、外部取得だけでは権利問題が解消しない点を踏まえる。
2. **明文が得られない場合の代案。** SSS は無料利用等の適合質問に **「原則お答えしておりません」** とする。無回答を承諾扱いせず、収録を保留するか別方式へ進むかを決める。[公式免責 8](https://zunko.jp/guideline.html)
3. **版・構図。** ずんだもん 2.3／V3.2、めたん 2.1／ちび等から、二人の姿勢、顔の大きさ、上半身 crop を選ぶ。既存の bar は 1600×180、字幕箱は幅 1360px なので、画像と字幕を両立する配置が必要。
4. **口形の細かさ。** 初版は 3 段階か 5 母音か、不足差分を描き足すか、N を閉じと共用するか。正規取得後の inventory を見て決める。
5. **話者と時刻の契約。** 発話者の指定、口形区間、音声 credit の二話者対応、聞き手／rest の瞬き方針を決める。二人の同時発話は今回の要件に追加しない。

幾何・音声契約の根拠は [docs/spec.md](/home/apm/orca/workspaces/fuzzy6/searobin/docs/spec.md)。見た目と仕様の根幹は AGENTS.md の担当へ渡し、engine の変更前に spec を更新する。本調査で決定・実装していない。

### 6.3 許諾を確認する場合の具体的な文面案

以下は**未送信の準備案**。作者には作者素材の条件、SSS にはキャラ・公式素材・再許諾条件を別々に確認する。作者の返答だけで SSS の条件を解除した扱いにしない。

> 個人・非商用の解説 Web アプリ fuzzy6（[公開 repository](https://github.com/advantame/fuzzy6)、[GitHub Pages](https://advantame.github.io/fuzzy6/)）で、四国めたんとずんだもんを字幕の左右に表示したいです。対象は〔作者・配布 URL・版〕です。上半身・口・目を切り出し／縮小し、必要な PNG だけを公開 repository に置いて CI で配信します。PSD／ZIP 原本は収録せず、権利帰属・元規約・credit を示します。PNG は個別 URL から取得でき、repository は GitHub 内で閲覧・fork できます。この利用は素材再配布・再許諾の条件上認められますか。現行 GitHub ToS D.4～D.7（host・複製・解析・AI／ML の学習開発等を含む）に必要な権限も満たせるか、Git 収録を避け Pages の配信だけにした場合の条件もご教示ください。

これは本報告の作成した質問案で、出典の引用ではない。「表示だけ」と説明して個別 PNG の取得・fork・host の範囲を省かない。SSS の回答原則があるため、返答の保証はない。

## 調査の限界・問いと計画の進展

初期計画の 8 単位（ローカル前提、公式、坂本アヒル、他作者、音声差分、口パク、書出し、公開方式）を全て完了した。単位の追加・削除はない。最重要の問いは最初から **「公開 Git に画像を置けるか」** で変わっていない。

調査中に、現行 GitHub の AI を含む Content 許諾、SSS の無料利用質問への回答原則、PSD reader と renderer の違い、異常入力の資源上限が具体的な判断材料になった。いずれも元の問いに必要なので、それぞれ公開方式・書出しの単位内で追究した。自作なら全部自由、CI 外部取得なら全部解決、PSDTool 対応なら 5 母音が揃う、といった見立ては採らなかった。

次工程へ保留したのは、選定 archive の README と実レイヤ inventory、正確な頭身・姿勢、venv／Node 経路の実成功、PSD の合成一致、音声と Opus の offset、権利者の個別説明である。今回の「素材本体を取得しない」「Engine を起動しない」という制約下で確認できない事項を、確定情報として埋めていない。

推奨する次の行動は、まずボスが §6.2 の公開方式と第一候補を選び、必要な権利範囲を絞ること。Git＋Pages 収録を続けるなら §6.3 の具体的な条件を確認し、採用条件が整った段階でのみ正規素材を取得して同梱条件・実 inventory を検査する。その後、小さな入力で書出し経路と上限を確かめ、二人分の選定状態を比較し、仕様・クレジット・公開範囲をレビューする。**本報告作成時点では、素材収録も main への merge／push もしていない。**
