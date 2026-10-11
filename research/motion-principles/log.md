# 表現の規則のための調査ログ

- 問い: fuzzy6 — Motion Explorer の高校数学（ベクトル、三角比から三角関数）デッキに向け、可変長（上限90秒）、意味の区切りと移動、完成図と強調、合成音声と字幕、補足図・たとえ、詳細への導線という6案を、A〜Gの研究と実務の一次資料で検証する。
- 範囲: 主張、出典、実験条件、効果の方向・大きさ、適用範囲、反例・再現失敗、制作規則、確からしさを記録。最終報告は日本語、根拠の強さを付けた10〜20の規則を含む。研究上の原理とソフト操作の慣習、推測を区別する。
- UTC開始: 2026-10-11 03:57:44 UTC
- 書込範囲: research/motion-principles/ 内の log.md（追記のみ）と、報告ターンで作る report.md のみ。プロジェクトファイルは変更しない。

## 初期計画

単位は「問い × 資料群」。番号は実施順。必要に応じて計画改訂を追記する。

1. 制作の現状と制約 × AGENTS.md・docs/spec.md・decks/llm/README.md。
2. A: 描画過程・手・完成図との比較 × dynamic drawing / sequential display の原著実験・原著メタ分析。
3. A: 強調と情報の消失 × signaling/cueing の種類別メタ分析・視線実験・transient information の原著。
4. B: 区切り・長さ・位置 × segmenting の原著メタ分析・学習者制御/停止位置の比較実験。
5. B: 動画の移動 × 章・サムネイル・スライド移動のHCI研究、およびYouTube等プレーヤー・PowerPoint/Keynote等の公式操作資料。
6. C: 構造の先出し × advance organizer / pre-training の原著と統合研究、事前知識・expertise reversal の実験。
7. D: 音声・字幕 × modality / redundancy の近年の統合研究と境界条件の原著（母語・長さ・自己ペース）。
8. D: 合成音声・日本語の速度・同期 × voice principle の近年の実験、日本語字幕/発話速度の研究・公式基準、temporal contiguity の原著。
9. E: 余白・補足 × coherence / seductive details の原著メタ分析・説明に必要な補足との境界。
10. E: たとえ・具体例から抽象へ × concreteness fading / analogical learning / 誤概念修正の原著と統合研究。
11. F: 概要から詳細へ × elaboration theory / stretchtext / hypertext・概念地図・前提知識グラフの理論原典と学習実験。
12. G: 実務と研究の接点 × 3Blue1Brown/manim等の本人の説明、Heer & Robertson (2007)、アニメーション原則・UI motionの一次資料。
13. A〜G: 反証・版・外的妥当性の横断監査 × 残る原著・補足資料。6案の判定と10〜20規則の根拠を照合し、数学への適用と未検証の点を整理。
14. 報告（別ターン）: 全単位が終わったターンは ready-to-report を返し、attendant の報告ターン指示後に log.md を再読して report.md を執筆。

記録方法: DOI/URL・閲覧日・資料の版を残す。読めた範囲（全文/抄録）を明示し、原著で確かめられない効果量を推定で埋めない。d/g、相関、正答率、学習時間、好みを混同しない。有意差なしを同等性の証明としない。学習成果（保持/転移/遅延テスト）と満足度/視聴維持を分ける。

## Unit 1: 制作の現状と検証すべき前提

### 資料（2026-10-11閲覧、いずれも全文）

- AGENTS.md（リポジトリ直下）。ユーザーが渡した機体規則・プロジェクト規則も適用。
- docs/spec.md、版0.2（2026-10-10）。
- decks/llm/README.md（制作記録2026-10-10）。

### 確認した事実

- README「狙い」は1クリップ1つの考え、15〜17秒、最後を一枚の図版として読める構成。構成表には12秒の扉、17.5秒・18秒の例外もある。79本・10章。本文の約22分は内容の長さ、通し確認25分27秒にはクリップ間待機も含むと考えられる（後者の内訳は未確認）。
- READMEは字幕が事実の文、ステージが構造と数字を受け持つとして、字幕全文の重複を避ける。現時点で音声はない。
- README「動き」は線の描き足し、数字の数え上げ、入り0.5〜0.8秒、ずらし0.05〜0.15秒、最後3〜4秒の静止。一方AGENTS.mdと制作メモには、3秒以上何も動かない区間を探して図内の動きを足す方針がある。両者は完全には整合せず、「読む時間」と「装飾的な活動」を研究で分ける必要がある。
- spec §3.4: 目印は既定で字幕cueの始まり。任意のclip.marksを指定できる。これは「図が完成し静止画として読める点」と一致する契約ではない。
- spec §4: ←→/PageUp/Downはクリップ移動、Shift+矢印は±2秒。シークバーにTabでフォーカスした場合は矢印±1秒、Shift付き±5秒。意味単位への矢印移動は現行操作を変える提案になる。
- spec §5: クリップ移動はt=0から自動再生、終端で停止、任意の自動送りは既定2.5秒待機。音声がないことを自動再生の前提にしている。音声導入では学習設計以外にブラウザの再生許可・同期時計も後続実装で検討が要る（本調査では実装しない）。
- spec §6.1/8: 任意の時刻で同じ図が出る純粋関数、静止時刻URL、APIによるseekがある。区切り時点の比較制作と理解テストの試作に適した土台。
- 字幕の上限はspec §6.3では2行・1行全角34字ほど。AGENTS.md/制作メモの実測では35字まで、36字で折返し。これはレイアウト上の上限で、学習時に読める字数/秒の実証値ではない。
- 4章以降は同じ図の配置・部品を継続し、アプリ→ハーネスのように名称を段階的に精密化。図の連続性、事前訓練、抽象から具体への展開が既に部分的に存在する。

### この段階の判断・確からしさ

現状の文書上の仕様は高い確かさで確認。学習効果は未測定。90秒、5秒送り、35字、3秒以内に動かす、といった値を学習科学の定数として扱わない。旧デッキの素材の事実（LLM史等）は今回再検証しない。

### 未解決と次

派生した問い: 「最後の完成図」「読むための停止」「動かし続ける」はどの場面で両立するか。原問いA/B/Eに必要なので追究する。音声エンジンやブラウザ同期の実装詳細は後続開発へ延期。
次: Unit 2、dynamic drawingの効果を、単なる順次出現・完成図上の強調・手の社会的手掛かりから切り分ける。

## Unit 2: 描画過程・手・完成図上の誘導は同じ効果か

### 資料（すべて2026-10-11閲覧）

- A1: Fiorella & Mayer (2016), *Effects of Observing the Instructor Draw Diagrams on Learning from Multimedia Messages*, Journal of Educational Psychology 108(4), 528–546. DOI https://doi.org/10.1037/edu0000065 。著者抄録をERICで確認: https://eric.ed.gov/?id=EJ1099178 （全文未確認）。関連する2015年学位論文は https://escholarship.org/content/qt55v7s9t1/qt55v7s9t1.pdf （検索抄録のみ。5実験であり、2016論文の4実験と混同しない）。
- A2: Fiorella, Stull, Kuhlmann & Mayer (2019; online 2018-12-10), *Instructor Presence in Video Lectures: The Role of Dynamic Drawings, Eye Contact, and Instructor Visibility*, JEP 111(7), 1162–1171. https://doi.org/10.1037/edu0000325 。著者抄録・冒頭を確認: https://www.researchgate.net/publication/329548623_Instructor_Presence_in_Video_Lectures_The_Role_of_Dynamic_Drawings_Eye_Contact_and_Instructor_Visibility （全文の方法・表は未確認）。
- A3: Zhang, Guo, Son, Blank & Stigler, *Watching videos of a drawing hand improves students’ understanding of the normal probability distribution*. online 2024-02-20、巻号年2025、Memory & Cognition 53, 262–281. https://doi.org/10.3758/s13421-024-01526-7 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC11779760/ （全文HTML、方法・結果・表2〜5・限界を確認）。
- A4: Reuter, Lazzara & Leuchter, *Static, dynamic, or human? The role of slide dynamics and instructor cues in video lectures*. online/version of record 2025-11-18、巻号年2026、ETR&D 74, 469–492. https://doi.org/10.1007/s11423-025-10572-0 ; https://link.springer.com/article/10.1007/s11423-025-10572-0 （全文HTML、方法・結果・限界を確認。表内の全係数は未抽出）。
- A5: Fiorella et al. (2020), *Fostering generative learning from video lessons: Benefits of instructor-generated drawings and learner-generated explanations*, JEP 112(5), 895–906. https://doi.org/10.1037/edu0000408 ; https://digitalcommons.memphis.edu/facpub2/2581/ （著者抄録）。
- 追跡候補: Fiorella (2023), *Are there metacognitive benefits of learner- and instructor-generated visualizations?* https://doi.org/10.1002/acp.4135 ; https://onlinelibrary.wiley.com/doi/full/10.1002/acp.4135 （検索抜粋のみ）。Schmidgall et al. (2019), https://doi.org/10.1016/j.learninstruc.2018.01.006 （原著抄録探索のみ）。これらの数値は採用していない。

### 主張と実験条件・効果

**A1: 手描きの観察は条件によって転移を助ける。** 大学生がドップラー効果の音声付き説明を見る4実験。既描画の図に対し、全身を見せて描く条件の転移は事前知識低群d=0.58、高群d=−0.24（後者は有意でない）。手のみを見せる比較d=0.35。手を見せずに描く比較d=−0.16（有意でない）。手のみ対全身d=0.36は境界的。別実験間の「有意/非有意」の差だけでは手の有無の交互作用を証明できない。N・時間・保持の詳細は全文追跡対象。

**A2: 手や身体は描画効果の必要条件ではない。** 腎臓の音声付き説明を大学生に提示。実験1では講師を見せない動的描画が完成図より事後テストでd=0.54優位。実験2では透明板で視線を合わせる条件が通常板よりd=0.54。A1の手なし条件の非有意結果から「手が必要」と一般化できない。複雑さ・題材・テストの違いは残る。Nと保持/転移の内訳は未確認。

**A3: 完成図＋動くカーソルは有力な比較対象。** 大学初級統計、正規分布、16分動画。Study 2はN=63（手あり16、手なし23、静止24）、直後平均14.59/12.93/11.77。事前得点調整の条件効果は偏η²=.14、p=.014。手あり優位は対静止p_adj<.001、対手なし.042。3週間後の全体検定は非有意（本文p=.140/偏η²=.06、表4は.141/.07と不一致）、手あり対静止の事後比較のみ.017。Study 3（N=92）は手ありと静止図＋カーソルの差が非有意（p_adj=.264）、両者とも別内容の対照より良好。非事前登録・小標本。等価性やカーソルの純粋効果を証明したものではない。

**A4: buildsを足しても改善しなかった自然な授業条件。** ドイツの教員養成学生238人を静止スライド＋音声／同期して順次出現＋音声／順次出現＋講師の身振りに無作為割付、別専攻74人が非受講対照。研究法3題、停止・巻戻し・章移動・再視聴可。形式間の知識獲得に一般的優位なし。研究デザイン題で主観難度との交互作用B=.29、SE=.13、p=.027（標準化効果量ではない）。簡単な図表・自己制御が効果を弱めたという説明は著者の解釈。音声は静止条件のみ別録音、講師ありでは図が小さい。遅延測定なし。順次表示が常に優れるという予測の反例であり、完全な追試ではない。

**A5: 見せ方と学習活動が相互作用する。** N=196大学生、腎臓、静止/手なし動的描画×各部後の説明を書く/描く/再視聴。説明を書く群は再視聴より保持d=.58、転移d=.87。転移では説明活動の優位が動的描画で大きかった（ds>1、静止では<.5）。これらを「動的描画の主効果」として引用しない。完成図が読めるだけで理解できたとは判定できない。

### 切り分けと制作への暫定規則（研究からの推論）

1. 「線が描かれる」「部品が順次現れる」「完成図に誘導を足す」「対象そのものが変形する」を分けて扱う。描画の効果を一般の出現アニメーションへそのまま移さない。
2. 既知の部品の関係を読む場面では、必要な図を先に置き、音声と対応する強調で案内する案は試す価値がある。ただしその方法が全面的に優位という証拠ではない（A3）。
3. ベクトルの合成や単位円からグラフを作るように生成順そのものが内容なら、生成過程を残す候補にする（A1/A2から数学への外挿、直接検証は未了）。
4. 手を模したカーソルや講師像を装飾として必須化しない。注目点を示す機能と図を隠す負担を別に評価する。
5. 読むための静止と、完成前の単なる待ち時間を区別する。短い説明課題・新しい例への適用で理解を確認する候補を残す（A5）。

確からしさ: 描画の普遍的優位を否定するには複数の実験があり中程度。最善条件・メカニズムは未確定。日本語の高校数学・90秒以下・合成音声での直接証拠はここでは得ていない。大半が大学生、音声付きであり、現行の無音字幕のみへの外挿にも注意する。

### 未解決・次の単位

dynamic drawingに限定したメタ分析は今回の検索で確保できなかった（存在しないとはいえない）。A1/A2の全文、sequential displayの独立実験、手が害になった比較を追跡する。次はUnit 3（signaling/cueingの種類別統合研究とtransient information）。

## Plan revision 1

Unit 2で、描画・段階出現・強調・対象の変形の混同が、原問いAへの回答を左右すると判明した。原問いを変更せず、Unit 2を原著比較の一次確認として完了し、未確保の統合研究と反例の精査をUnit 3およびUnit 13へ配分する。

- Unit 3に追加: Sondermann & Merkt (2023a)（図スライドと文字スライド）、Schroeder & Traxler (2017)（手が不利な斜面説明）、A1/A2の方法と比較条件の全文確認。A4の参考文献から原著URLを追う。
- Unit 13に追加: 描画限定メタ分析の探索継続、A3の表/本文の数値不一致の扱い、自己ペースがbuilds効果を弱める仮説の検証。
- 派生問い「分かった感じと転移・遅延保持は一致するか」は、制作規則の検証に必要なのでUnit 13で追究する。自己説明の授業全体への実装設計は延期し、推奨する次の行動に残す。
- 残り: Unit 3〜13（上記追加を含む）、その後は別ターンの報告。全単位は未完了。

チェックポイント: Unit 1と2は完了・記録済み。次回はこのログを再読しUnit 3から再開する。report.mdはまだ作成しない。

## Unit 3: 強調の平均効果・種類・失敗例と、消える情報の負担

### 資料（すべて2026-10-11閲覧）

- A6: Richter, Scheiter & Eitel (2016), *Signaling text-picture relations in multimedia learning: A comprehensive meta-analysis*. Educational Research Review 17, 19–36. https://www.sciencedirect.com/science/article/pii/S1747938X15000664 （出版社の検索取得本文・抄録・方法抜粋。直接openは失敗）。
- A7: Schneider, Beege, Nebel & Rey (2018), *A meta-analysis of how signaling affects learning with media*. ERR 23, 1–24. https://doi.org/10.1016/j.edurev.2017.11.001 ; https://www.sciencedirect.com/science/article/pii/S1747938X17300581 （出版社検索取得の抄録・方法抜粋。直接openは失敗）。
- A8: Alpizar, Adesope & Wong (2020), *A meta-analysis of signaling principle in multimedia learning environments*. ETR&D 68, 2095–2119. https://doi.org/10.1007/s11423-020-09748-7 ; https://rex.libraries.wsu.edu/esploro/outputs/journalArticle/A-meta-analysis-of-signaling-principle-in/99900601052901842 （出版社・著者所属大学の抄録）。
- A9: Xie, Wang, Zhou & Wu (2016), *Cueing effect in multimedia learning: A meta-analysis*. Acta Psychologica Sinica 48(5), 540–555. https://doi.org/10.3724/SP.J.1041.2016.00540 ; https://journal.psych.ac.cn/acps/EN/Y2016/V48/I5/540 （出版社の詳細な英語抄録。中国語全文の分類表は未確認）。
- A10: de Koning et al. (2009), *Towards a Framework for Attention Cueing in Instructional Animations: Guidelines for Research and Design*. EPR 21, 113–140. https://doi.org/10.1007/s10648-009-9098-7 （著者による理論レビュー、出版社抄録と本文の検索取得部分）。
- A11: de Koning et al. (2010), *Attention guidance in learning from a complex animation: Seeing is understanding?* Learning and Instruction 20, 111–122. https://doi.org/10.1016/j.learninstruc.2009.02.010 ; https://eric.ed.gov/?id=EJ867535 （著者抄録）。
- A12: de Koning et al. (2011), *Attention cueing in an instructional animation: The role of presentation speed*. CHB 27, 41–45. https://doi.org/10.1016/j.chb.2010.05.010 ; https://www.sciencedirect.com/science/article/pii/S0747563210001470 （出版社抄録・導入抜粋）。
- A13: Boucheix & Lowe (2010), *An eye tracking comparison of external pointing cues and internal continuous cues in learning with complex animations*. Learning and Instruction 20, 123–135. https://doi.org/10.1016/j.learninstruc.2009.02.015 ; https://www.sciencedirect.com/science/article/pii/S0959475209000231 （出版社抄録）。
- A14: Leahy & Sweller (2011), *Cognitive load theory, modality of presentation and the transient information effect*. ACP 25, 943–951. https://doi.org/10.1002/acp.1787 （出版社抄録と参考文献）。
- A15: Wong, Leahy, Marcus & Sweller (2012), *Cognitive load theory, the transient information effect and e-learning*. Learning and Instruction 22, 449–457. https://doi.org/10.1016/j.learninstruc.2012.05.004 ; https://www.sciencedirect.com/science/article/pii/S0959475212000369 （出版社検索取得の抄録と導入。方法・結果の表未確認）。
- A16: Singh, Marcus & Ayres (2012), *The Transient Information Effect: Investigating the Impact of Segmentation on Spoken and Written text*. ACP 26, 848–853. https://doi.org/10.1002/acp.2885 （出版社著者抄録）。
- A17: Schroeder & Traxler (2017), *Humanizing Instructional Videos in Physics: When Less Is More*. JSET 26, 269–278. https://doi.org/10.1007/s10956-016-9677-6 ; https://researchprofiles.ku.dk/da/publications/humanizing-instructional-videos-in-physics-when-less-is-more/ （書誌と著者抄録の一部を取得。実験結果の数値は未確認）。
- 追跡先のみ: Sondermann & Merkt (2023), Computers & Education 193, 104675, https://www.sciencedirect.com/science/article/pii/S0360131522002469 （直接取得失敗）。同じ著者の別論文は Contemporary Educational Psychology 74, 102207, https://doi.org/10.1016/j.cedpsych.2023.102207 。著者博士論文の大学リポジトリ: https://publikationen.uni-tuebingen.de/xmlui/bitstream/handle/10900/157465/Dissertation_Christina%20Sondermann.pdf?isAllowed=y&sequence=2 （検索抜粋のみ）。2023a/bを引用先ごとの並べ方で誤同定しない。

### 統合研究が支持すること、支持しないこと

A6は文章と図の対応づけに限った27研究・45比較・N=2464。理解/転移r=.17、95%CI [.11,.22]。低事前知識で効果が強い。A7はメディア学習のより広い103研究・145比較・N=12,201を扱い、保持g=.53 [.42,.64]、転移g=.33 [.22,.43]。事前知識の調整効果は検出しなかった。A8は29実験研究・44独立効果・N=2726で総合学習成果d=.38（p<.01）。数値の違いは版更新だけでなく、対象・指標・採択基準の違いであり、一つの「最新版の効果量」に置換しない。統合研究間では元実験が重なるので独立な4回の再現とも数えない。

A9は43実証研究を収集。保持は44効果/N=3910、g=.53 [.36,.69]、転移は41効果/N=3906、g=.36 [.23,.49]。静的教材・宣言的知識で動的教材・手続き的知識より効果が大きいというモデレータ結果。spatial-temporal cuesはphysical cuesより転移で強い一方、physical cuesは注視時間/回数で強い。分類の詳細を読まず、これを「矢印より色が常に良い」と翻訳してはいけない。注視の増加と学習の増加は別の指標である。

総合判断: 関連部分・構造・表象間の対応を示す強調の小〜中程度の平均利益は、複数の統合研究に支持される（確からしさ: 高め）。特定の色・拡大率・矢印・囲みの順位、同時に強調してよい個数、持続秒数はここからは決まらない。日本語高校数学への量的予測ではない。

### 種類と失敗例

- A10の分類は選択（場所に気づく）、組織化（構造を把握する）、統合（要素・表象の関係を結ぶ）の3機能。制作では、色・囲み等の見た目より先に「どの認知的仕事を助けるか」を定義するのに使える。理論分類であり、単独の効果量ではない。
- A11は心血管系アニメーションで視線・回顧報告・理解/転移を測定。強調部位の注視頻度・時間は増えたが、探索・認知負荷の効果はなかった。A12は同系統の教材で強調有無×高/低速を比較し、理解・転移の優位を検出しなかった。A11/A12のN・標準化効果・CIは未確認。非有意を無効果の確定や同等性の証明にしない。
- A13はピアノ機構の2実験。広がる色が矢印/無強調より関連箇所への視線と理解を助け、イベントの始まりと同期した色誘導が非同期より良好。対象の動き・因果の流れに沿う誘導を支持する単一研究群。N・効果量は未確認。「色」そのものの普遍的勝利ではない。
- A17については前単位A4が手の可視化による不利を引用しており、大学掲載の著者抄録では手あり条件の講師評価（人間らしさ・魅力）が高いことを確認。学習の詳細と数値は原著全文で追跡する。好意的評価を理解向上の代用にしない。

### 消える情報と残る図

A14: 温度グラフの読み方を小学生に教えた実験1（N=24）では図＋文章が図＋音声を上回った。文章/音声を短くした実験2（N=64）では音声＋図の優位が戻った。別実験間の比較であり、長さの普遍的閾値は示さない。標準化効果量は未確認。

A15は動画/静止図、音声/文字を長短の区切りと比較する2実験で、短区切りで現れる動的/音声の利点が長区切りでは消えるか逆転する仮説を支持。著者は未知で相互依存の強い技術的内容を境界条件に挙げる。日常会話や映画一般へは外挿しない。方法・秒数・N・効果量はUnit 4または7で追跡。

A16はgrade 10生徒の2実験。短く区切ると文章・音声とも改善し、特に音声で大きい。長い音声より同内容の文章が優位になる結果も得た。今回得た抄録にN・効果量なし。高校年代の直接証拠だが数学アニメーションそのものではない。

この群は「全アニメーションを完成図へ置換せよ」ではなく、必要な以前の情報へ迅速に戻れず、同時に新情報を処理する負担が問題だと示す。動的表示が前の状態を残す、重要な状態で止まる、履歴/小図を参照できる、といった対策は機序に沿う設計仮説。対策の実装形や5秒送りは未検証。

### 制作への暫定規則と未解決

1. いま述べる関係の構成要素は参照できる形で揃え、強調で対応づける。組立て順それ自体が内容なら順次描画を保つ（Unit 2との統合からの推論）。
2. 一つの強調に「選ぶ・まとめる・対応づける」の目的を書く。色を付けただけで理解の説明を省略しない（統合研究＋原著）。
3. 単位円の点とsinのグラフ等は同じ出来事として同期して導く。拡大・矢印などは必要箇所を隠したり新たな探索を要求したりしないか確認する（A13からの数学への外挿）。
4. 新旧の状態を比較する場面は、前状態を残すか直ちに戻れる点を用意する。単に動きを遅くするだけで解消すると仮定しない（A12/A14〜16）。
5. 目立った、見られた、好まれた、分かった感じがした、を学習成果と別に測る。無強調の新しい問題でも説明・適用できるか確認する。

未解決: 強調種類の定義とモデレータの全文表、元実験の重複・出版バイアス、手/順次表示の原著全文、拡大や囲みに特有の効果。次はUnit 4（segmentingの効果量・長さ・停止位置）。

## Plan revision 2

Unit 3で、強調の平均効果と種類別の順位は分ける必要があり、視線・好みと転移も一致しないことを確認した。情報の消失はAだけでなくB/Dの長さ・音声にも直接関わるため、A14〜16の方法追跡をUnit 4/7へ統合する。Unit 3に追加されていたA1/A2・Sondermann & Merkt・Schroeder & Traxlerの全文精査は、横断比較が揃うUnit 13へ移す。原問いの範囲は変えない。

- 残り: Unit 4〜12、Unit 13（上の移管項目と従来の監査項目を含む）、その後は別ターンの報告。
- チェックポイント: Unit 3は完了・記録済み。次回はUnit 4。report.mdは報告ターンまで作らない。

## Unit 4: 区切りの効果・長さ・停止位置を分けて考える

### 資料（すべて2026-10-11閲覧）

- B1: Rey, Beege, Nebel, Wirzberger, Schmitt & Schneider (2019), *A Meta-analysis of the Segmenting Effect*, EPR 31, 389–419. https://doi.org/10.1007/s10648-018-9456-4 ; 著者公開の出版社版PDF https://maria-wirzberger.de/wp-content/uploads/2019/01/Rey2019_Article_AMeta-analysisOfTheSegmentingE.pdf （全文、方法・表3/4・出版バイアスを確認）。
- B2: Spanjers, van Gog, Wouters & van Merriënboer (2012), *Explaining the segmentation effect in learning from animations: The role of pausing and temporal cueing*, Computers & Education 59, 274–280. https://doi.org/10.1016/j.compedu.2011.12.024 ; 大学リポジトリ出版社版 https://cris.maastrichtuniversity.nl/ws/files/72615120/spanjers_2012_explaining_the_segmentations_effect.pdf （全文、方法・結果を確認）。/files/だけのURLは取得失敗し、/ws/files/で取得できた。
- B3: Doolittle, Bryant & Chittum (2015、著作権/先行版2014), *Effects of degree of segmentation and learner disposition on multimedia learning*, BJET 46(6), 1333–1346. 著者公開PDF https://www.peterdoolittle.org/publications/publication-3.pdf （全文、表1/2・結果を確認）。
- B4: Merkt, Ballmann, Felfeli & Schwan (2018), *Pauses in educational videos: Testing the transience explanation against the structuring explanation*, CHB 89, 399–410. https://doi.org/10.1016/j.chb.2018.01.013 ; https://www.sciencedirect.com/science/article/pii/S0747563218300207 （出版社検索取得の著者抄録と導入、直接open失敗）。
- B5: Merkt & Bodemer (2024、初公開7月16日), *Learning with videos: Do task instructions and the availability of a pause button matter?*, JCAL 40(6), 2856–2871. https://doi.org/10.1111/jcal.13044 ; https://onlinelibrary.wiley.com/doi/full/10.1111/jcal.13044 （全文、実験2の方法・考察を確認）。
- 追跡資料: Biard, Cojean & Jamet (2018), *Effects of segmentation and pacing on procedural learning by video*, CHB 89, 411–417, https://doi.org/10.1016/j.chb.2017.12.002 ; https://www.sciencedirect.com/science/article/pii/S0747563217306829 （出版社導入のみ、結果本文未確保）。Spanjers et al. (2011), https://doi.org/10.1016/j.chb.2010.05.011 （出版社抄録の一部）。これらの効果量は採用しない。

### 統合結果とその範囲

B1は2018-01-10までの英語資料、56研究・88比較。表3の保持d=.32 [.20,.43]（67比較、N=6100）、近転移d=.36 [.24,.48]（56比較、N=4754）。認知負荷の低下d=.23 [.06,.39]、学習時間は増加方向d=−.92 [−1.64,−.20]だが出版バイアスの兆候あり。dは小標本補正済み。自己ペース群の転移d=.45、保持d=.19（CIが0を含む）。区切りを設ける効果と操作権の効果を包含するため、後者だけの推定ではない。平均区切り長75.49秒（SD109.63）は最適値ではない。高事前知識の保持効果が大きいというモデレータは「初心者だけに効く」とする一般化に反する。異質性が大きく、平均効果から90秒上限・5秒送りは導けない。

確からしさ: 区切りの小〜中程度の平均利益は高め。最適長・どの学習者に最善か・遠転移は未確定。UIの停止位置への移動だけで、自動停止/再開の実験と同じ効果が得られるとはまだいえない。

### 停止時間と意味の境界の切り分け

B2: オランダ中等教育3年、確率未習の分析対象N=161、平均約14.8歳、4群に無作為割付。男性音声付き約2分強の確率の解法4本。6〜7の意味段階で「2秒停止」「0.5秒暗転」「両方」「なし」を比較し、無停止群も末尾10〜12秒で総時間を揃えた。停止で8点満点の事後得点6.46対5.80、偏η²=.03、p=.04。暗転は得点に有意効果なく、主観的努力を2.73から2.19へ低下（偏η²=.03、p=.02）。段階は問題提示→順序の扱い→復元/非復元→各事象の確率→積。末尾のまとめ時間と途中の処理時間は同じ働きではない可能性を示す。ただし暗転と停止の長さは異なり、最適な停止長を検証した研究ではない。

B4: 音の振動の長めの実写＋説明アニメーションを用いる2実験。連続、実測した意味境界で停止、意味境界の目印のみ（実験1）、構造を乱す別位置の停止（実験2）を比較。予定した主分析で停止の学習利益を検出せず、消失負担の軽減/構造化のどちらの機序も明確に支持できなかった。N・効果量・停止秒数は原著全文未確認。意味境界なら必ず効くという主張の反例だが、90秒以下への直接反証ではない。

### 細分化の利益と煩わしさ

B3: 大学生212人、歴史資料を調べる方法の約9分教材を1/7/14/28区切りに無作為割付、続行ボタンで再開。応用得点（16点満点）は順に3.88/4.36/5.38/6.48。1対7以外の応用の比較は有意、報告dは.38〜1.29。学習時間も増えたが14対28の差は非有意。28区切り群は学習成績が良い一方、「煩わしい」が7段階で6.00（他群4.12〜4.52）で、役立つ/適切という評価も悪かった。約19秒平均という値は9分÷28の概算で、普遍的な最適長でも実際の各区間長でもない。数学や長期保持への一般化は未検証。停止の多さは好みと理解で逆の結果を生み得る。

### 停止ボタンさえあればよいか

B5: 実験2は成人オンライン標本168人（220人募集、事前規準で除外、平均年齢52.91歳）。3本の教材に対する評価課題の有無×停止ボタンの有無。停止以外の移動は不可。事前登録した学習成果の主効果・交互作用は検出されず、停止可能群では学習見積りが正確になった（探索的）。高年齢ほど停止が学習を助ける交互作用も探索的であり、確立した年齢別規則にしない。効果量/CIは今回未抽出。日本の高校生にそのまま適用できないが、ボタンの提供を理解向上と同一視しない根拠になる。

### 制作への規則案（ここでの統合・推論）

1. クリップ全体の尺は説明する問いで決め、その内部を「関係/操作を一つ説明し終えた所」で区切る。尺と区切り間隔は別に設計する。15〜17秒固定を外す案には整合するが、上限90秒は制作上の仮決めとして扱う。
2. 読める完成状態の目印に加え、重要な変形の直前へ戻れる目印を試す。前者は処理の区切り、後者は見逃しの回復であり、後者の学習効果は直接未検証。
3. 止めて読む間を残す。末尾だけ長く静止させる、または待つ間を常に装飾的に動かす方針にはしない（B2＋Unit 3の消失負担からの推論）。
4. 目印への移動、任意の一時停止、目印での自動停止、固定秒のシークを異なる操作として比較する。すべてをsegmentingの一語で正当化しない。
5. 頻繁な強制停止の評価は、理解/転移と煩わしさを分ける。B3を理由に細分化を最大化するのも、好みに反するから直ちに廃止するのも早い。

### 未解決・次

B1は表3/4で自己ペースのCIが若干違うため、報告は表3に統一する（保持[-.04,.45]、転移[.24,.66]）。B3の正確な区切り決定手順と遅延測定、B4の全文、Biardの結果、2011年のexpertise reversalの指標は横断監査候補。A14〜16の長短の具体的手続きは音声比較が主なのでUnit 7へまとめる。次はUnit 5、動画移動のHCI研究と公式操作の慣習。

## Plan revision 3

Unit 4で、意味の区切り・自動停止・停止ボタン・移動操作は同じ介入でないと確認した。原問いを維持し、Unit 5に「移動して探し直せる効果と、止めて処理する効果を区別する」を追加する。B5参考文献のYu et al. (2023、タイムラインの構造表示)、Merkt et al. (2022、自然な停止行動)をUnit 5の追跡候補とする。長さの最適化試験を網羅する新しい問いは拡張せず、現デッキの試作評価を推奨する次の行動へ残す。

- 残り: Unit 5〜12、Unit 13（原著追跡と反証/版/外的妥当性監査）、別ターンの報告。
- チェックポイント: Unit 4完了・記録済み。次回はUnit 5。report.mdはまだ作らない。

## Unit 5: 動画内の移動の研究と、キー操作の慣習

### 資料（すべて2026-10-11閲覧）

- B6: Merkt, Weigand, Heier & Schwan (2011), *Learning with videos vs. learning with print: The role of interactive features*, Learning and Instruction 21, 687–704. https://doi.org/10.1016/j.learninstruc.2011.03.004 ; https://eric.ed.gov/?id=EJ936844 （著者抄録）。全文の所在 https://citeseerx.ist.psu.edu/document?doi=88c40e5f915101fcd1bf45d89454a72772fecd42&repid=rep1&type=pdf は検索結果の冒頭のみ確認。
- B7: Merkt, Hoppe, Bruns, Ewerth & Huff (2022; online 2021), *Pushing the button: Why do learners pause online videos?*, Computers & Education 176, 104355. https://doi.org/10.1016/j.compedu.2021.104355 ; 国立図書館収録の出版社版 https://d-nb.info/1263106439/34 （全文、方法・回帰分析を確認）。著者のデータ/スクリプト公開先 https://osf.io/nd54f/ は論文内のリンクを確認、データ自体は未読。
- B8: Yu, Gou, Li, Pi & Yang (2024; 初公開2023-11-10), *Introducing support for learner control: Temporal and organizational cues in instructional videos*, BJET 55(3), 933–956. https://doi.org/10.1111/bjet.13408 ; https://bera-journals.onlinelibrary.wiley.com/doi/abs/10.1111/bjet.13408 （出版社の著者抄録・practitioner notes。二つのWileyドメインで/full/は取得失敗）。
- B9: Kim, Guo, Cai, Li, Gajos & Miller (2014), *Data-Driven Interaction Techniques for Improving Navigation of Educational Videos*, UIST 2014. 著者公開PDF https://juhokim.com/files/UIST2014-LectureScape.pdf （全文、比較条件・結果・限界を確認）。
- B10: Kim (2013), *ToolScape: Enhancing the Learning Experience of How-to Videos*, CHI 2013 Extended Abstracts. 著者公開PDF https://juhokim.com/files/CHI2013-src-toolscape.pdf （全文、方法・結果を確認）。短報であり、後年の発展研究と同一視しない。
- B11: YouTube公式 *Keyboard shortcuts for YouTube*. https://support.google.com/youtube/answer/7631406?hl=en （操作表）。
- B12: YouTube公式 *Video Chapters*. https://support.google.com/youtube/answer/9884579?hl=en （章の作成・移動目的の説明）。
- B13: Microsoft公式 *Use keyboard shortcuts to deliver PowerPoint presentations*. https://support.microsoft.com/en-us/accessibility/powerpoint/use-keyboard-shortcuts-to-deliver-powerpoint-presentations （Windows/macOS/Webの操作表）。補助確認 https://support.microsoft.com/en-us/powerpoint/go-to-a-slide-when-delivering-your-presentation 。
- B14: Apple公式 *Keyboard shortcuts for Keynote on Mac*. https://support.apple.com/guide/keynote/keyboard-shortcuts-tanfde4a3e6d/15.4/mac/1.0 （15.4のガイド、再生と動画制御の表を確認）。

### 学習者制御は、目印の存在だけで決まらない

B6: ドイツ中等教育の生徒が複雑な内容を学ぶ、実験室と現場の2研究。操作の程度が違う動画2種と同内容の図入り文章を比較。著者は動画の効果が文章に劣らない結果を報告し、停止・ブラウズ等の細かな制御が、目次・索引等の大きな移動より有益だったと解釈する。目次等の使い方への誤解もあった。N・効果量・等価性検定は未確認なので、統計的同等性の証明とは扱わない。目次を提供すれば必ず使われ、理解が上がるという前提への注意になる。

B7: 科学動画4本（147〜392秒）、プラットフォーム訪問者2114人中、停止した626 IDのログと、別の実験室で集めた意味境界/難しさの判断、映像カット検出を突き合わせた探索的研究。自然な停止との関連は難しさβ=.09（p=.006）、意味境界β=.07（p=.042）、外部の構造表示β=−.02（p=.631）、モデルR²=.01。効果は小さく、停止の集まる動画を選んでいる。観察的関連であり、目印設置やそこで止まることが理解を上げる因果効果ではない。カットを検出した目印と、内容を読んで決めた区切りを混同しない。

B8: N=117を時間の手掛かり（進捗バー）有無×構造の手掛かり（目次）有無の4群に無作為割付。両種類で転移とgermane loadの利益、目次で話題想起・保持・見積りの正確さの利益を報告。標準化効果量、教材、年齢、秒数と目次操作の詳細は全文未確認。抄録中の「learner controlの平均g=.05」は先行メタ分析の引用であり、この実験の効果量ではない。B6と矛盾を断定せず、表示内容・使い方・課題による条件差として残す。

確からしさ: 意味に沿った移動の支援を試す根拠はあるが、5秒・90秒・特定のキー配列の学習利益までは支持しない。自動停止の実験（Unit 4）、停止行動の観察（B7）、進捗/目次の介入（B8）は別種の証拠。

### HCI試作から得られる利益と反例

B9（LectureScape）: CS入門受講者12人、同一参加者内比較、検索・要約の8課題。基準UIにも字幕テキスト検索とホバー時のサムネイルがある。視聴ログのピーク、非線形タイムライン、過去フレームの固定などを足しても課題成績の有意差なし。問題検索時間は96対106秒（p=.8）。速さ/効率の主観評価は改善したが、使いやすさは4.7対6.3/7で低下（p<.001）。初見の新規学習ではなく主に既習内容の再訪。小標本で複数機能の束なので、サムネイル単独の無効性や同等性を示さない。「人気の箇所」と「自分が今探す箇所」は一致しない可能性がある。

B10（ToolScape）: Photoshop初心者12人、2つの加工課題、各20分、10動画を参照する参加者内比較。手順名と前後の状態を示し、そこへ跳べるUIで、自己効力感の増加は1.4対.1/7、作品の外部評価順位は5.7対7.3（小さい方が良い、p<.01、報告r=.29）。所要時間に差なし。短い手順が密集すると目印が重なり、情報過多の訴えもあった。数学の概念理解や遅延保持の結果ではない。再訪のしやすさと作業中の参照には使える設計例だが、複数の機能を含むためキーでの移動単独の効果量にはできない。

制作への推論: 目印には「第3点」だけでなく内容の短い名前または読める図のプレビューを候補にする。必要な前状態を残す/固定する案はUnit 3の情報消失対策とも整合する。ただし画面上の目次・過去図・字幕を常に全て展開する根拠にはならず、見る対象の競合を試作で確認する。

### 公式操作の比較（実務の慣習。学習実験ではない）

| ソフト・文脈 | 細かな送り戻し | 構造単位の移動 | この案への含意 |
|---|---|---|---|
| YouTube（公式表のシークバー） | ←→は±5秒、J/Lは±10秒 | Ctrl+←→（Windows）、Option+←→（Mac）は章移動。Shift+N/Pは動画移動（前動画はプレイリスト時） | 秒と章で操作を分ける慣習。5秒は製品の選択値 |
| PowerPoint発表時 | →/Space/PageDown等で次のアニメーションまたは次スライド。←/PageUp等で前のアニメーションまたは前スライド | スライド番号＋Enter/Returnで指定スライドへ | スライド内の進行とスライド移動を一つの「次」で扱う慣習。ただし連続動画の5秒シークとの混合ではない |
| Keynote 15.4 Mac発表時 | →/↓で次build/slide、Shift+→で次build/slideへアニメーションなし、Shift+←/↑で前build | ←/↑は前slide、Shift+↓でbuildを飛ばして次slide。番号から切替 | 通常の左右が対称なbuild送りとは限らない。発表内の動画にはJ/K/L等が別にある |

B12では章に個別プレビューを持たせ、見直しに使う。作成要件は00:00開始、3個以上、各章10秒以上。これはYouTubeの製品制約であり、数学の区切りは最低10秒という学習規則にはしない。

### 原案2の判定と暫定規則

- 「読める状態や重要な変化の直前へ戻れる点」は、参照・再訪を助ける設計として支持する材料がある。学習への効果量は未確定。変化の直前と完成状態では目的が違うため、同じ点へ機械的に揃えない。
- 「次の点が遠い時だけ同じキーが5秒送りになる」は今回の一次資料群では直接の比較実験がなく、主要3ソフトにも同じ切替を確認できなかった。採用不可ではなく未検証の設計仮説。距離の閾値、逆方向の振る舞い、音声の文中へ着地した時、連打時の予測可能性を試作で評価する必要がある。
- 暫定案としては、意味の目印への移動と固定秒の送りを区別し、どこへ進むかを画面で分かるようにする。もし同じキーの混合を採用するなら、次の行先を表示して「目印のつもりが途中へ着地する」回数を評価する。これは研究からの設計推論であり、確立した学習原理ではない。
- 目印の密度は増やすほどよいとは限らない。名前やプレビューが重なる場合は、表示密度と移動可能な点の数を分けて扱う。理解テストに加えて、見逃した変化を見つけ直す時間・誤移動・操作の煩わしさを測る。

### 未解決・次

B8の原著全文の効果量と条件、B6の群構成と成果指標は未確保。5秒送り/意味移動の混合操作、重要な拡大の直前へ停止する操作の直接の学習実験は今回得られなかった。存在しないとは断定しない。サムネイル単独・キー単独の因果効果も複合UI研究からは分離できない。
次はUnit 6（構造の先出し、advance organizer / pre-training、事前知識による逆転）。

## Plan revision 4

Unit 5により、原案2は「意味を回復する参照支援」と「キーの割当・距離で切り替わる送り」を分けて評価する必要が明確になった。問いは変えず、後者の最適化は研究の確定則にせず試作の推奨行動へ回す。B8の目次と、Unit 6の内容構造の先出しは関連するが、UIの目次をadvance organizerそのものと呼ばない。

- Unit 13に追跡候補追加: B6/B8の全文条件と効果量。未取得の数値を埋めるために二次資料から転記しない。
- 残り: Unit 6〜12、Unit 13（蓄積した反証・版・外的妥当性の監査）、別ターンの報告。
- チェックポイント: Unit 5完了・記録済み。次回はUnit 6。report.mdはまだ作らない。

### チェックポイント確認（2026-10-11）

継続開始時にログを再読した。Unit 5の資料・所見・未解決事項・次単位は上記に記録済み。新しいUnit 6の調査開始前にトークン閾値通知を受けたため、この完了境界でチェックポイントを要求する。追加の調査結果はなく、計画改訂4を維持する。再開先はUnit 6（構造の先出し × advance organizer / pre-training / 事前知識）、残りUnit 6〜13。報告ターンではない。

### チェックポイント再確認（2026-10-11 04:06:40 UTC）

継続指示後、Unit 6の開始前に再度トークン閾値通知を受領。ログの冒頭とUnit 5・計画改訂4を確認した。未完了の調査・編集はないため、記録済みのUnit 5を最後の完了単位としてチェックポイントを要求する。新規所見はなく、再開先はUnit 6、残りはUnit 6〜13と別ターンの報告で変わらない。

### チェックポイント確認（2026-10-11 04:07:10 UTC）

継続時にログを再読した。次単位の資料調査を始める前にトークン閾値通知を受領したため、記録済みのUnit 5完了境界でチェックポイントを要求する。新たな研究単位・所見・未完了の編集はない。計画改訂4を維持し、次回はUnit 6（構造の先出し）、残りUnit 6〜13と別ターンの報告。

## Unit 6: 構造の先出し、部品の事前学習、事前知識による効果の変化

### 資料（すべて2026-10-11閲覧）

- C1: Ausubel (1960), *The use of advance organizers in the learning and retention of meaningful verbal material*, JEP 51(5), 267–272. https://doi.org/10.1037/h0046669 ; https://www.researchgate.net/publication/220040523_The_use_of_advance_organizers_in_the_learning_and_retention_of_meaningful_verbal_material （原著抄録と本文冒頭。全文の数表は未確認）。
- C2: Luiten, Ames & Ackerson (1980), *A Meta-analysis of the Effects of Advance Organizers on Learning and Retention*, AERJ 17(2), 211–218. https://doi.org/10.3102/00028312017002211 ; https://journals.sagepub.com/doi/pdf/10.3102/00028312017002211?download=true （出版社の著者抄録）。
- C3: Stone (1983), *A Meta-Analysis of Advance Organizer Studies*, Journal of Experimental Education 51(4), 194–199. https://doi.org/10.1080/00220973.1983.11011862 ; https://www.tandfonline.com/doi/abs/10.1080/00220973.1983.11011862 （出版社抄録。オンライン掲載2015年と刊行1983年を区別）。
- C4: Mayer, Mathias & Wetzell (2002), *Fostering understanding of multimedia messages through pre-training: evidence for a two-stage theory of mental model construction*, JEP: Applied 8(3), 147–154. https://doi.org/10.1037/1076-898X.8.3.147 ; https://pubmed.ncbi.nlm.nih.gov/12240927/ （著者抄録）。著者による原理の定義も確認: https://www.cambridge.org/core/books/multimedia-learning/pretraining-principle/01791D57F5D4164251269E6DF56A8BF1 （2009年版の章、検索取得の要約）。
- C5: Kalyuga, Chandler & Sweller (2000), *Incorporating Learner Experience Into the Design of Multimedia Instruction*, JEP 92(1), 126–136. https://doi.org/10.1037/0022-0663.92.1.126 ; https://www.researchgate.net/publication/48828991_Incorporating_Learner_Experience_Into_the_Design_of_Multimedia_Instruction （APA提供の原著全文、方法・結果・一般討論を確認。表のOCR値は使用しない）。1997会議論文・1998 Human Factors論文とは別の原著。
- C6: Gorbunova, Kapuza, Chen & Costley (2025-08-07), *Rethinking pre-training: cognitive load implications for learners with varying prior knowledge*. https://doi.org/10.3389/fpsyg.2025.1628047 ; https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1628047/full （全文HTML、方法・表2/3・考察を確認）。
- 横断監査候補: Cromley & Chen (2025), *A meta-analysis of Richard Mayer’s multimedia learning research: Searching for boundary conditions of design principles across multiple media types*, ERR 49, 100730. https://doi.org/10.1016/j.edurev.2025.100730 ; https://www.sciencedirect.com/science/article/pii/S1747938X25000673 （出版社抄録）。1990–2022年のMayer共著92論文・181研究・591効果を多層分析、全体g=.37。特定研究者のコーパスであり、pre-training単独の統合効果としては使わない。
- 探索したが根拠に採用しない: https://www.ideals.illinois.edu/items/20405 （advance organizerの更新メタ分析、直接取得失敗）。Visible Learning等の二次集計にあるC2/C3の効果量は原著表で未確認のため転記しない。

### 何を先に見せるかを区別する

C1は未習の文章を理解する上位概念を先に導入する仮説。比較対象は同じ長さの歴史的導入文で、大学生40人ずつの比較において保持の利益を報告する。これは単なる目次、完成図の一瞥、用語一覧と同じ介入ではない。全文の標準化効果量・遅延時間は未確認。

C2は公刊・未公刊135研究を分析し、学習と保持に平均的利益を報告。C3は29報告から112 studiesと記載し、全体の利益を認める一方、高効果の条件にはAusubelの理論予測と一致しないものがあった。二つの統合研究の採用基準・独立性・数値の算出法は抄録だけでは比較できない。よって「先に全体を見せるだけで一定のdが出る」という規則は作らない。

C4のpre-trainingは、車のブレーキ（実験1/2）と自転車ポンプ（実験3）の音声付きアニメーションの前に、部品とその取り得る状態を学ぶ介入。転移は3実験とも、保持は実験1/2で比較群より良かった。実験3には事後に同じ訓練を置く比較もある。N・秒数・効果量は抄録では得られない。全体の仕組みを先に全て説明する根拠ではなく、部品の理解と関係の理解を分ける根拠となる。

制作への推論: 「単位円の点の高さを、角度ごとに並べるとグラフになる」という関係の見取り図と、「半径1・角度・座標・正負」の事前確認は別に設計する。目次は移動の案内、見取り図は関係の案内、事前訓練は部品を読める準備。これは数学への外挿であり、この文面や図そのものの学習効果を検証したものではない。

### 既習者には同じ支援が必要とは限らない

C5はオーストラリアの職業訓練生60人、切削速度のノモグラムを読む教材。実験1は図のみ／図と文字／図と音声／図と文字と音声の4形式を訓練前後で比較し、初心時の音声付き図の優位が訓練後に縮小した。形式×段階のテスト得点交互作用F(3,55)=2.83、p<.05。ただしこの実験だけでは訓練後の図のみの有意な優位は得られていない。約2.5か月後の38人の実験2では45秒の固定提示で音声を避けられない条件となり、図のみが図＋音声より10問テストで良好（F(1,36)=4.19、p<.05）。経験だけでなく提示時間・音声回避可能性も変わるため、純粋な経験操作の反転と単純化しない。日本の高校数学への最適な省略量は不明。

C6は「pre-trainingは既習者にも有益」という反例候補だが、因果推論に限界がある。ロシアの大学院生136人、認知負荷理論、概念地図＋用語集を約7分、その後の課題約30分中も参照可。全員が事前訓練を受け、事前知識は中央値で二分。負荷の自己報告を段階間で比較し、知識×段階の交互作用は検出されなかった（一般化η²<.01、p=.82/.84/.19）。事前訓練を受けない群がなく、課題も変わるので、負荷の低下を事前訓練の因果効果や成績改善とは呼べない。本調査の判断は「専門知識があれば必ず逆効果とも、全員へ一律に有益ともいえない」。

### 暫定規則と確からしさ

1. 導入では、これから答える問いと既知の概念への接続を短く示す。全情報を一度に詰めた完成図を必須にしない（C1〜4からの設計推論、確からしさ中）。
2. 新しい記号・部品の名前や状態が読めない場合は、それを先に少数ずつ確認してから関係の変化を説明する（C4、異分野からの外挿を含み中）。
3. 既習者が導入や用語確認を飛ばして戻れる構造を試す（C5に整合する設計判断、中。飛ばすUIの効果は直接未検証）。「上級者なら常に説明を消す」としない。
4. 完成図を最初に出す案は、読める部品・関係が既にあるかで選ぶ。概要の先出しの利益と、全細部の同時提示の利益を同一視しない。Unit 2/3と合わせ、生成の過程が内容なら途中の変化も残す。
5. 評価は事前知識を測った上で転移・遅延保持を調べる。主観的な分かりやすさや負荷だけで先出し方式を決定しない。

### 未解決・次

C2/C3の統合効果量と採用基準、C4の全文N・教材長・効果量は未確認。高校のベクトル・三角関数の90秒以下クリップで完成図先出しと事前訓練を直交比較した直接証拠は今回得ていない。次はUnit 7、音声・字幕のmodality/redundancy、母語・長さ・自己ペースによる境界条件。

## Plan revision 5

Unit 6で、構造の先出しを「既知と新規を結ぶ上位の説明」「部品の事前訓練」「目次」「完成図の提示」に分けた。原問いは維持する。派生問い「学習者の事前知識をどの短い課題で診断するか」は制作上重要だが診断法の開発まで拡張せず、試作の推奨行動へ延期する。

- Unit 13に追加: C2〜4の未確認条件の追跡、Cromley & Chenの2025統合研究の原理別・成果別の境界条件。すべての追跡候補の全文取得を必須とせず、未確認値は未確認のまま報告する。
- 残り: Unit 7〜12、Unit 13（反証・版・外的妥当性の監査）、別ターンの報告。
- チェックポイント: Unit 6を完了・追記済み。閾値通知に従ってこの完了境界で圧縮を要求する。次回はUnit 7。report.mdはまだ作らない。

## Unit 7: 音声・字幕の効果は、比較対象と利用条件によって変わる

### 資料（すべて2026-10-11閲覧）

- D1: Ginns (2005), *Meta-analysis of the modality effect*. Learning and Instruction 15, 313–331. https://doi.org/10.1016/j.learninstruc.2005.07.001 ; https://www.researchgate.net/publication/223089224_Meta-analysis_of_the_modality_effect （著者抄録・本文冒頭）。
- D2: Reinwein (2012; online 2011), *Does the modality effect exist? And if so, which modality effect?* J Psycholinguist Res 41, 1–32. https://doi.org/10.1007/s10936-011-9180-4 ; https://pubmed.ncbi.nlm.nih.gov/21989625/ （著者抄録）。
- D3: Adesope & Nesbit (2012; online 2011), *Verbal redundancy in multimedia learning environments: A meta-analysis*. JEP 104, 250–263. https://doi.org/10.1037/a0026147 ; https://www.researchgate.net/publication/232469670_Verbal_Redundancy_in_Multimedia_Learning_Environments_A_Meta-Analysis （APA原著全文のHTML化、方法・結果・表2〜4を確認）。
- D4: Trypke, Stebner & Wirth (2023), *Two types of redundancy in multimedia learning: a literature review*. https://doi.org/10.3389/fpsyg.2023.1148035 ; https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1148035/full （原著レビュー本文、分類・方法・比較表を確認。統合効果量を出すメタ分析ではない）。
- D5: Mayer & Johnson (2008), *Revising the redundancy principle in multimedia learning*. JEP 100, 380–386. https://doi.org/10.1037/0022-0663.100.2.380 ; https://www.researchgate.net/publication/232540768_Revising_the_Redundancy_Principle_in_Multimedia_Learning （著者提供/APA原著全文、条件と表1/2を確認）。
- D6: Jamet & Le Bohec (2007), *The effect of redundant text in multimedia instruction*. CEP 32, 588–598. https://doi.org/10.1016/j.cedpsych.2006.07.001 ; https://www.sciencedirect.com/science/article/pii/S0361476X06000294 （出版社の著者抄録）。
- D7: Tabbers, Martens & Van Merriënboer (2004), *Multimedia instructions and cognitive load theory: Effects of modality and cueing*. BJEP 74, 71–81. https://doi.org/10.1348/000709904322848824 ; https://bpspsychub.onlinelibrary.wiley.com/doi/abs/10.1348/000709904322848824 （著者抄録、巻号情報。電子化2010年と刊行2004年を区別）。
- D8: Knoop-van Campen, Segers & Verhoeven (2018), *The modality and redundancy effects in multimedia learning in children with dyslexia*. Dyslexia 24, 140–155. https://doi.org/10.1002/dys.1585 ; https://pubmed.ncbi.nlm.nih.gov/29577504/ （著者抄録。PMC全文は取得時に確認画面になった）。
- D9: Pannatier & Bétrancourt (2024; copyright 2023), *Learning from academic video with subtitles: When foreign language proficiency matters*. Learning and Instruction 90, 101863. https://doi.org/10.1016/j.learninstruc.2023.101863 ; https://www.sciencedirect.com/science/article/pii/S0959475223001329 （出版社検索取得の詳細抄録。本文未取得）。
- D10: Carranza & Geller (2026), *A redundant redundancy principle? examining the redundancy principle through cognitive load*. https://doi.org/10.1080/01443410.2026.2678483 ; https://www.tandfonline.com/doi/pdf/10.1080/01443410.2026.2678483 （出版社PDFの検索取得抜粋、一般討論と一部方法。直接openは失敗）。刊行日の表示が検索源で一致しないため正確な日付は保留。
- 追加追跡候補（結論に数値を採用しない）: Cromley & Chen (2025), https://doi.org/10.1016/j.edurev.2025.100730 （Unit 6と同一。今回出版社検索で原理別の表3も取得。ただしmodalityの括弧内が「no captions vs. captions」となっており、redundancyとの分類・比較条件を補足で確認する必要がある）。Désiron, Endres & Schneider (2026), https://doi.org/10.3389/fpsyg.2026.1795142 （重なる強調の効果、検索抜粋のみ。原問いAの追跡候補）。

### 二つの問いを分ける

modalityは通常「図＋文章」対「図＋音声」、verbal redundancyは「音声＋文字」対「音声」等の比較である。字幕を足す効果と文章を音声へ置き換える効果は別。さらに、音声の全文字幕、図に接した短いラベル、読み返せる文章、無音時の唯一の説明文は役割が異なる。D3/D4の分類を踏まえ、本デッキへの推論でも一括して『文字』と呼ばない。

D1は43独立効果を統合し、複数要素の関係・提示速度による条件差と、固定速度での音声の利益を報告。D2の再分析は86効果（研究内の下位群を単位）でd=.38、trim-and-fill補正後d=.20。D2が引用するD1のd=.72より小さい。研究集合・集約単位が違い、補正値も真値の確定ではない。固定の大きな効果を全教材に約束できない。

D3は33報告・57独立効果、計N=3452。音声＋文字は文字のみとの比較でg=−.04、95%CI[−.14,.06]、音声のみとの比較でg=.29、[.20,.39]。後者には図なし・図ありと短い要語・全文重複が混在する。固定速度g=.34、自己ペースg=.12（後者は非有意）。「音声のみ」の比較とは言語提示の条件であり、必ずしも図がないという意味ではない。字幕一般が害という平均像ではなく、図の有無・知識・重複の程度を区別すべき結果である。

D4は1991〜2021年の54報告・63研究を分類し、情報内容の重複と処理経路の競合を分ける。実験教材そのものを確認できない例が多く、著者の記述から分類した限界がある。このレビューの分類は異なる結果を整理する道具であり、脳内に独立した固定容量の箱が実測された証拠ではない。

### 短いラベルと全文字幕、自己ペースの反例

D5は雷16枚/ブレーキ8枚、1枚約8〜10秒の図＋音声に、対応箇所へ2〜3語を加えた大学生の2実験。保持はd=.47/.70改善、転移は有意差なし。全文字幕を短くすれば必ず転移が上がるとは言えず、語数・配置・内容の選別が同時に変わる。英語の2〜3語を日本語の字数上限に変換しない。

D6は記憶モデルの図＋音声に、同内容の文章を順次または一括表示した比較。両表示とも保持・転移・図の記憶が低下したと報告。N・効果量は抄録では未確認。段階的に字幕を出すだけで競合が解決するとは限らない反例。

D7は19〜25歳の教育学専攻111人、約1時間のウェブ教材。文字を音声へ替えると保持・転移が低下。自己ペースが逆転の一因という説明は著者の仮説であり、この研究だけで速度の因果効果を分離したわけではない。90秒以下のアニメーションへ直接移せないが、長く参照する文章を全て音声へ替える根拠が弱いことを示す。

D8は11歳の読字障害児26人と典型的読者38人、図＋文字／図＋音声／図＋両方を自己ペース・参加者内で比較。知識獲得の形式差は検出せず、読字障害群は文字だけで学習時間が長かった。得点の平均差だけでは利用上の利益を評価できず、支援の必要性を一般的な冗長性原則で否定しない。日本語の読字困難への直接証拠ではない。

### 言語と近年の反証

D9はフランス語話者131人、英語動画に英語字幕／仏語字幕／字幕なし。習熟度3段階で検討し、字幕の主効果・交互作用を検出しなかった。言語習熟度は推論・転移・余分な負荷と関連。「外国語なら字幕が必ず低習熟を補う」とも言えない。外国語の語彙獲得と、外国語で数学等の内容を理解する課題を混同しない。

D10の原著一般討論は2実験について、全文字幕の有無による学習成果・自己報告負荷の有意差がないと述べる。負荷尺度の感度不足や字幕への慣れは著者の説明候補。新世代が字幕に慣れたことを実証した研究とは扱わない。全条件・信頼区間を未確認なので「無害と証明」とは言わず、普遍的な害への反例候補としてUnit 13で監査する。

### 制作への暫定規則と確からしさ

1. 図の変化を追う最中の説明には音声を試す価値があるが、全文字幕を常時読ませる構成が最適とは決めない。図の近くの必要な式・記号・短い語は残す（D1〜6、条件付きの根拠は中）。
2. 音声オン時の全文字幕、短い要語、字幕オフを同一視せず、選べる候補として比較する。無音で使う場合に要語だけで説明が欠けないか確認する。切替のUI自体の学習効果は未検証の制作判断。
3. 一文を聞きながら別の長文を読む課題にしない。音声と図が同じ関係を説明し、文字は見失いやすい対象を支える設計を試す。全文字幕の一律廃止は支持しない。
4. 音声も消える情報なので、長い式や複数条件を音声だけに移さず、停止・再聴・式の保持を組み合わせる。Unit 3のA14〜16（長い音声と分節の境界条件）に接続する。
5. 平均的な転移成績に加え、読字・聴取の条件、無音利用、再訪、所要時間を評価する。音声の好みと学習成績は別に記録する（D7〜9）。

「単に音声を足す」「字幕を消す」の普遍則を避ける判断は比較的一貫した根拠がある。一方、日本語の高校数学・90秒以下・合成音声の最良の組合せは直接検証できていない。音声の品質・速さ・図との同期は次単位で扱う。

### 未解決・次

D10の全文条件と刊行日の確認、D9の効果量、Mayer研究限定の2025統合研究の原理分類はUnit 13の追跡候補とする。全文取得の成否にかかわらず、未確認値は補わない。次はUnit 8（合成音声・日本語の速度・字幕と図の同期）。

## Plan revision 6

Unit 7で、音声導入を『読み上げの追加』一つで評価できず、文字を音声に替える比較、全文字幕の追加、短い図中ラベル、無音の説明を分ける必要が明確になった。原問いは維持する。

- 派生問い『聴取・読字の支援や無音モードをどう提供するか』は、音声と字幕案の判定に必要な範囲で上記規則に含める。障害別の教育介入・実装基準の全面調査へは拡張せず、利用者テストの次の行動へ延期する。
- Unit 13へD10と2025統合研究の条件確認、2026の重なる強調研究の追跡を追加する。未取得数値を埋めるためだけの無制限な探索はしない。
- 残り: Unit 8〜12、Unit 13（反証・版・外的妥当性の監査）、別ターンの報告。
- チェックポイント: 閾値通知を受領し、進行単位7を完了して追記した。次回はUnit 8。report.mdはまだ作らない。

## Unit 8: 合成音声の品質、日本語の速度、音声と図の同期

### 資料（すべて2026-10-11閲覧）

- D11: Craig & Schroeder (2017), *Reconsidering the voice effect when learning from a virtual human*, Computers & Education 114, 193–205. https://doi.org/10.1016/j.compedu.2017.07.003 ; https://www.researchgate.net/publication/318341059_Reconsidering_the_voice_effect_when_learning_from_a_virtual_human （著者公開全文、方法・結果・討論を確認）。著者所属大学の書誌 https://asu.elsevierpure.com/en/publications/reconsidering-the-voice-effect-when-learning-from-a-virtual-human/ 。
- D12: 應供亮生・荊木拓・澤山郁夫, 「動画教材の日本語ナレーションにおける新・旧合成音声と人間音声での学習効果の差異」, 日本教育工学会論文誌49(Suppl.), 165–168. https://doi.org/10.15077/jjet.S49104 ; https://www.jstage.jst.go.jp/article/jjet/49/Suppl./49_S49104/_pdf/-char/ja （全文4頁。PDFの表3数値は抽出不良のため本文の検定値のみ採用）。巻号年/発行日2025/2025-12-20、早期公開2026-01-29、J-STAGE公開2026-05-12と併記されている: https://www.jstage.jst.go.jp/article/jjet/49/Suppl./49_S49104/_article/-char/ja 。
- D13: Jing et al., *Cute Computer-Synthesized Voice Hinders Learning Performance in Instructional Videos*. https://doi.org/10.1080/00220973.2024.2446169 ; https://www.tandfonline.com/doi/full/10.1080/00220973.2024.2446169?af=R （出版社著者抄録）。online 2024-12-28、巻号2026/94(4), 752–769。方法部分も著者公開版で確認: https://www.researchgate.net/publication/387494510_Cute_Computer-Synthesized_Voice_Hinders_Learning_Performance_in_Instructional_Videos （英単語学習・参加者内比較の抜粋。効果量表未読）。
- D14: 豊倉省子・山田優 (2017), 「字幕翻訳における文字数制限の妥当性についての検証～1秒4文字は妥当か？～」, 通訳翻訳研究への招待18, 33–52. https://doi.org/10.50837/iits.1802 ; https://www.jstage.jst.go.jp/article/iits/18/0/18_1802/_pdf/-char/ja （全文、方法と結論を確認。Web抽出の仮名が文字化けしたため同じPDFをcurlでストリーム取得しpdftotextで確認。ファイル保存なし）。J-STAGE掲載2025年を刊行年と混同しない。
- D15: Netflix公式, *Japanese Timed Text Style Guide*, https://partnerhelp.netflixstudios.com/hc/en-us/articles/215767517-Japanese-Timed-Text-Style-Guide （本文I.5/I.19、II.6/II.18、変更履歴。閲覧時の最新表示更新は2025-12-19）。補助: General Requirements https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617-Timed-Text-Style-Guide-General-Requirements 。教育実験ではなく納品仕様。
- D16: 産総研 (2026-09-25), 「合成音声読み上げ時の音声情報理解力を定量化」, https://www.aist.go.jp/aist_j/press_release/pr2026/pr20260925/pr20260925.html （研究機関による研究紹介全文）。紹介された原著はMiura et al., *Profiling Speech Rate Abilities of Visually Impaired Screen Reader Users by Bayesian Item Response Theory*, Interspeech 2026。会議本文は未取得、紹介記事を原著全文と呼ばない。
- D17: Mayer & Anderson (1992), *The Instructive Animation: Helping Students Build Connections Between Words and Pictures in Multimedia Learning*, JEP 84(4), 444–452. https://mrbartonmaths.com/resourcesnew/8.%20Research/Explicit%20Instruction/Instructive%20Animation.pdf （原著出版社版の再掲、抄録・方法を確認）。
- D18: Ginns (2006), *Integrating information: A meta-analysis of the spatial contiguity and temporal contiguity effects*, Learning and Instruction 16(6), 511–525. https://doi.org/10.1016/j.learninstruc.2006.10.001 ; https://www.researchgate.net/publication/248498142_Integrating_information_A_meta-analysis_of_the_spatial_contiguity_and_temporal_contiguity_effects （著者公開accepted manuscript、本文とモデレータ表を確認。最終出版社版との数値照合は未了）。
- D19: Porte et al. (2026), *Continuous Temporal Contiguity Narration–Animation for Learning in Virtual Reality*. https://doi.org/10.1002/jcal.70218 ; https://onlinelibrary.wiley.com/doi/10.1002/jcal.70218 （全文HTML、方法・表2/結果4.2・限界）。
- 追跡候補: Davis, Vincent & Park (2019), *Reconsidering the Voice Principle with Non-native Language Speakers*, https://www.sciencedirect.com/science/article/pii/S0360131519301587 （抄録/検索抜粋のみ。ここでは数値を採用しない）。Moreno & Mayer (1999), *Cognitive Principles of Multimedia Learning: The Role of Modality and Contiguity*, https://www.researchgate.net/profile/Richard-Mayer-4/publication/228698670_Cognitive_Principles_of_Multimedia_Learning_The_Role_of_Modality_and_Contiguity/links/57799c7608aead7ba0764344/Cognitive-Principles-of-Multimedia-Learning-The-Role-of-Modality-and-Contiguity.pdf （検索取得の原著結果抜粋のみ）。

### 合成音声か人間音声か、という二択では決められない

D11は成人オンライン標本140人、雷の形成、仮想講師＋図、固定速度でMicrosoft Mary／Neospeech Kate／人間女性を比較。転移の条件差は偏η²=.06、p=.02で、当時の新しい合成音声が旧音声・人間音声より良好。保持と選択問題の差は非有意。特定の声と仮想講師の組合せであり、合成一般の優越や現行ニューラル音声全体の同等性ではない。旧合成音声の不利を現代の全製品へ一般化することには反証となる。

D12は日本語母語の成人501人（平均44.75歳）、約3分45秒のサーモスタット教材。図と要語に、VOICEVOX 0.22.2のずんだもん／棒読みちゃんのゆっくり／男性教員1人の音声を付け、停止・再視聴不可。合成音声は速度のみ調整、イントネーションは未調整。7問の直後理解テストは人間音声が両合成音声より良好（全体η²=.013、p=.039、対比較ds>.23）。新旧合成間は非有意（d=.04）。聞き取りやすさでは新合成と人間の双方が旧合成を上回った。音声ごとに1声、転移・遅延測定なし。自然さ・聞きやすさを理解の代用にせず、調整した別声でも再評価する根拠になる。

D13は大学生30人、英単語教材を人間／formal合成／cute合成で見る参加者内の視線実験。抄録は人間音声の学習・注意の優位を報告する一方、人物印象の差は検出しなかった。小標本で効果量未確認。タイトルだけから「かわいい声だけが悪い」「自然な合成なら必ず問題ない」とは結論しない。

この3研究は完全な追試同士ではない。言語、題材、話者、抑揚調整、仮想講師の有無が異なり、勝敗を一つに統合できない。音声導入の可否より、実際に使う読みの誤り・区切り・図との対応を確かめる方が制作に直結する。合成音声採用は条件付きの制作判断として残し、人間らしさの主観評定だけでは選ばない（確からしさ中）。

### 字数、読みの速度、学習に必要な時間を分ける

D14は英語学習歴10年超の8人（視線分析は5人）、英語映画2作の約2分の場面を、毎秒4/6/8字制限で翻訳した字幕により比較。4と6の視線・受容が近い結果を報告するが、小標本、上級英語話者、同じ作品を反復し、文字量と翻訳内容も変わる。数学の転移テストや、日本語ナレーションと図の同時処理を測っていない。「全員6字/秒まで理解できる」とは読めない。

D15の公式規格では、翻訳字幕は上限4字/秒、SDHは7字/秒。横字幕の1行上限も13字対16字と異なる。半角を0.5字に数える等の規則があり、音声のモーラ/秒・英語words/minとは交換できない。これらは配信の納品仕様で、高校数学の認知限界ではない。現在の1行35字も別のレイアウト制約である。表示時間を字数だけから決めず、図を見る時間を含めて確かめる。

D16は視覚障害のスクリーンリーダー利用者11人を扱い、ITAコーパスの文章を5速度（実測約6〜27モーラ/秒）で比較した研究の機関発表。個人差が大きいと報告する。紹介の設定値250〜300語/分の境界を一般の日本語教材速度へ移さない。対象・課題とも数学動画と違い、原著のモデルと尺度は未確認。今回の資料から日本語高校数学の最適な発話速度は確定できない。

### 音声と図の同期には根拠があるが、許容ずれの定数はない

D17は低事前知識の大学生、ポンプ（N=136）とブレーキ（N=144）の2実験。音声とアニメーションの同時提示は、前後にまとめて提示する条件等より問題解決に良好で、保持の形式差は検出されなかった。図の説明を聞く時にその図を参照できる利益であり、字幕を一文字ずつ発話へ合わせる検証ではない。

D18の著者accepted manuscriptは50研究を統合し、そのうち時間的近接13研究でd=.78、95%CI[.63,.92]と記載する。複雑な教材の利益が大きいという条件差も報告。D19等の引用にはd=.87が現れるため、最終報告で採用する場合は「著者原稿の値」と明示するか出版社版を照合する。異なる版の数値を黙って混ぜない。空間的近接の数学群の値を、数学に限定した時間的同期の値として使わない。

D19はフランスの中学生227人、12分の森林土壌分解の画面上のVR動画（没入型HMDではない）。音声を図より±2/±6秒ずらす5条件を比較し、同期が音声先行の2群よりd=.81、音声後行の2群よりd=.46良好。各値は2/6秒をまとめた比較で、2秒ずれ単独の効果量ではない。2秒未満は検証せず、字幕の遅延も扱わない。群人数の説明には本文40〜46と表40〜59の不整合があり、Nと比較は表・分析を優先した。語りと無関係な次の図が出る負担を避ける根拠にはなるが、普遍的な「±2秒以内なら安全」の根拠にはならない。

短い情報片の継起提示では同時提示の優位が得られない原著結果もある（Moreno & Mayer 1999検索取得部分。全文追跡候補）。音声を発する瞬間だけが唯一の適切な表示時点とは考えない。必要な図を先に置いて残し、対応部分を語りに合わせて強調する案は、時間的近接と矛盾しない設計推論。

### 暫定規則・確からしさ

1. 合成音声は実際に採用する声・設定・台本で試す。数学記号、負号、指数、角度、座標の読みと間を確認し、聞きやすさに加えて短い理解/転移課題で比べる（D11〜13からの数学への外挿、確からしさ中）。音声エンジンの製品順位は作らない。
2. 発話が指す対象・変化と図の強調を同期させる。関連図を先に置き続けることと、別の図へ進みながら古い内容を話すことを区別する（D17〜19、方向の根拠は高め、具体的なミリ秒値は不明）。
3. 字幕は意味のまとまりで読み返せる候補を用意し、発話に合わせて細かく消す方式を必須にしない。数式や関係を見比べる時間を残す（Unit 3/7との統合からの制作判断、直接UI比較は未了）。
4. 発話速度、字幕の字数/表示秒数、図の変化速度を別に記録する。90秒に収めるため一律に早口にせず、内容分割を検討する（D14〜16からの設計判断）。普遍的な字数/秒は規則に書かない。
5. 音声オン、無音、全文字幕の各利用条件で説明が成立するかを確かめる。速度変更と停止後の再開で図と音声が対応するかは、後続の実装検証項目に残す。

### 未解決・次

日本語数学の最適な発話速度、声質と抑揚の独立効果、字幕の更新単位と視線往復の最良条件は未確定。新合成音声と人間の同等性を証明したとはしない。D18の最終版照合、D13の効果量、短区切りでの時間的近接の境界条件はUnit 13の追跡候補。次はUnit 9（coherence / seductive details、補足と装飾の境界）。

## Plan revision 7

Unit 8で、現代の日本語合成音声にも人間より理解得点が低い原著があると確認したため、「近年のTTSだからvoice principleは不要」という結論は採らない。同時に英語の逆方向の結果も残し、原問いを維持して声と条件ごとの検証へ絞る。

- 派生問い「日本語数学記号の読み・間・同期をどう検査するか」は、採用する台本の利用者テストとして次の行動に残す。全TTS製品の比較・音声エンジン実装へは拡張しない。
- Unit 13にD18の原稿/最終版差、D13の条件・効果量、短い区切りでの時間的近接の反例を追加。原著が取れなければ未確認のまま報告する。
- 残り: Unit 9〜12、Unit 13（蓄積した反証・版・外的妥当性の監査）、別ターンの報告。
- チェックポイント: 閾値通知に従い、Unit 8を完了して本項まで追記した。次回はUnit 9。report.mdはまだ作らない。

## Unit 9: 余白を埋める演出と、理解に必要な補足の境界

### 資料（すべて2026-10-11閲覧）

- E1: Rey (2012), *A review of research and a meta-analysis of the seductive detail effect*. Educational Research Review 7(3), 216–237. https://doi.org/10.1016/j.edurev.2012.05.003 ; https://www.sciencedirect.com/science/article/pii/S1747938X12000413 （出版社著者抄録・導入の検索取得本文。全表未確認）。
- E2: Sundararajan & Adesope (2020), *Keep it Coherent: A Meta-Analysis of the Seductive Details Effect*. EPR 32, 707–734. https://doi.org/10.1007/s10648-020-09522-4 ; https://link.springer.com/article/10.1007/s10648-020-09522-4 （出版社抄録・参考文献）。著者所属機関の掲載 https://rex.libraries.wsu.edu/esploro/outputs/journalArticle/Keep-it-Coherent-A-Meta-Analysis-of/99900601155501842 。効果量の全文表は未確保。二次資料に異なる総合値があるため数値を転記しない。
- E3: Cheng, Wu, R. Wang & Z. Wang (2026), *Seductive Details, Cognitive Load, and Learning Outcomes: A Multi-level Meta-analysis and MASEM*. EPR 38, 28. https://doi.org/10.1007/s10648-025-10099-z ; https://link.springer.com/article/10.1007/s10648-025-10099-z （刊行日2026-03-05、出版社抄録）。全文公開版 https://www.researchgate.net/publication/401582464_Seductive_Details_Cognitive_Load_and_Learning_Outcomes_A_Multi-level_Meta-analysis_and_MASEM （本文方法、外れ値除去、表3〜7、媒介・出版バイアス部分を確認）。
- E4: Wesenberg, Jansen, Krieglstein, Schneider & Rey (2025), *The influence of seductive details in learning environments with low and high extrinsic motivation*. Learning and Instruction 96, 102054. https://doi.org/10.1016/j.learninstruc.2024.102054 ; https://www.sciencedirect.com/science/article/pii/S0959475224001816 （出版社検索取得の抄録・方法2.1.5・表2。全文の直接openは失敗。Study 2の全係数は未確認）。
- E5: Kienitz, Krebs & Eitel (2023), *Seductive details hamper learning even when they do not disrupt*. Instructional Science 51, 595–616. https://doi.org/10.1007/s11251-023-09632-w ; https://link.springer.com/article/10.1007/s11251-023-09632-w （全文HTML、方法・結果・限界）。
- E6: Wesenberg et al. (2026), *The more, the worse? The influence of the seductive detail amount on learning*. Instructional Science 54, 29. https://doi.org/10.1007/s11251-026-09781-8 ; https://link.springer.com/article/10.1007/s11251-026-09781-8 （全文HTML、方法・結果・限界）。
- E7: Schneider & Désiron (2024), *Exploring the interplay of information relevance and colorfulness in multimedia learning*. Frontiers in Psychology 15, 1393113. https://doi.org/10.3389/fpsyg.2024.1393113 ; https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1393113/full （全文HTML、方法・表3/9・結果・限界）。
- E8: Ainsworth (2006), *DeFT: A conceptual framework for considering learning with multiple representations*. Learning and Instruction 16, 183–198. https://doi.org/10.1016/j.learninstruc.2006.03.001 ; https://www.researchgate.net/publication/222410911_DeFT_A_conceptual_framework_for_learning_with_multiple_representations_Learning_and_Instruction_16_183-198 （著者投稿の刊行前原稿全文、機能分類と表現間の対応課題を確認）。理論・研究整理であり一つの新規実験ではない。
- 追跡候補のみ: Brom, Stárková & D’Mello (2018), https://doi.org/10.1016/j.edurev.2018.09.004 ; https://www.sciencedirect.com/science/article/pii/S1747938X18302148 （出版社の検索抜粋のみ。emotional designのメタ分析だが、数値は二次資料でしか確認できなかったため今回採用しない）。Wesenberg et al. (2026), *Mitigating the seductive details effect by topic and irrelevance signals*, https://doi.org/10.1111/bjep.70022 （導入抜粋のみ）。

### 平均的な不利益はあるが、量・形式・動機で変わる

E1は39の実験効果を整理し、学習目標に不要な面白い文章・画像・音等を省くと、保持に小〜中、転移に中程度の利益と報告。E2も平均的な不利益を認めるが、媒体・言語・教科・自己ペース等による差を報告する。これは「面白さ全般を消す」「短くするほど良い」という命題ではない。興味深さと学習目標への無関係さが揃う付加情報を扱う。

E3は2025年5月までを探索。外れ値9効果を除去後の50研究・177効果でg=−.16、95%CI[−.22,−.10]。保持−.17、理解−.19、転移−.12。中等教育の部分群は−.05、CI[−.19,.10]で非有意だが、学齢間の調整効果自体も非有意であり「高校生には無害」としない。外的負荷の媒介は8研究・16効果の暫定結果。出版バイアス検定は非有意だが、バイアス不存在の証明ではない。外れ値除去にはE4由来の効果も含まれる。過去統合との値の差は対象・方法が異なり、時代による減衰と決めない。表の一部に符号・p値の本文不整合があり、報告では抄録と表3で一致する全体値を優先する。

E4はN=120/210の2実験で、補足有無を群間、必須／任意と説明する学習単位を参加者内で操作。両実験とも必須単位では補足が得点を下げ、任意単位では無差または改善。Study 1の調整平均は必須11.56→9.55、任意4.34→6.15（補足なし→あり）。前提知識等を調整し、全体所要時間は平均約26分。興味を介する利益も報告。これは自発視聴に関係する反例だが、全員が実験へ有償参加しており、公開サイトの離脱・長期学習を直接調べた研究ではない。得点差を標準化効果量や高校数学の予測値へ変換しない。

E6はドイツ語話者の学生N=191/101、学習文章に占める余談の量を変える2実験。余談による中断回数を固定しても、量が増すほど再生得点は低下した。転移は実験1で有意な関係なし、実験2では少量の利益を示唆する曲線が出たが、交差検証で不安定。実験1の転移尺度も信頼性が低い。小さな余談なら常に安全、または許容率12.5%という規則にはしない。主観的負荷・動機の有意差がなくても再生成績が変わり得る。

### 別枠、目立ち方、必要な図を分ける

E5は雷形成の文章537語＋線画4点に、落雷被害の写真5枚＋説明229語を追加。主に大学生のオンライン実験で、目標に無関係と明示する指示は再生の不利益を解消したが、別テーマとして処理する指示だけでは解消しなかった。転移の効果は非有意で、尺度信頼性も低い。抄録N=247に対し方法の人数・群合計は248、結果のF値・自由度・偏η²にも不整合があるため効果量を転記しない。「補足」という枠に入れるだけで注意競合が解消するとは断定できない。

E7は大学生128人・高校段階140人に、ハリケーンの4ページ・820語の教材を提示。説明部分と装飾写真をカラー／白黒で交差させた。両集団で一方だけカラーの構成が、両方同じ構成より保持・転移で良好。どちらをカラーにするかの差は非有意だった。装飾写真を置かない対照はなく、写真を足す利益や、カラー装飾の無害さを証明しない。一般の数学画面に最適な色も決まらない。美観の操作と、情報内容の追加を混同しないための原著例とする。

E8は補足図の役割を、相補的な情報・処理、別表現の読み違いの制約、関係や抽象的理解の構築として整理する。同時に、個々の表現を読めることと、それらの対応を理解することを学習者に要求する。図を追加するだけでは効果を保証しない。数学で単位円・座標・式を並べる場合、どの量が対応するかまで案内する、という推論につながる。これはcoherenceの反例ではなく、目標に関係する表現を区別するための理論枠組み。

### 制作への暫定規則と確からしさ

1. 補足を置く前に「これでどの関係・誤解・次の操作が分かるか」を一文で指定する。ベクトルの矢印と成分の対応、単位円の高さとsinの対応を示す図は必要情報になり得る。画面の空きや静止時間だけを理由に足さない（E1〜3/E8からの制作判断、方向の根拠は中〜高）。
2. 読むための静止を許容し、「3秒以内に何かを動かす」は学習上の必須規則から外す候補とする。今回の研究はこの3秒値を直接試していないので、「静止は必ず優れる」とも書かない。必要な比較を妨げる装飾運動を避ける推論である。
3. 補足・余談は必要な説明と区別する。折り畳みや詳細リンクへ移す案は候補だが、学習利益を直接証明したとは扱わずUnit 11で導線と負担を調べる。必要な前提を隠すと主説明が成立しない点に注意する。
4. 興味を維持する効果と、保持・転移・遅延成績を別々に測る。自発利用では継続の利益があり得るため、装飾の全面禁止ではなく、同じ学習目標の説明を魅力的にする案を先に試す（E4/E7、条件付き）。
5. 補足図が増える場合は、同じ記号・色・対応線等を使い、何を見比べるかを説明する。図の数や余白率の万能値は置かない（E8とUnit 3の強調研究からの推論）。

### 未解決と次

空白面積の最適率、静止秒数の閾値、日本語高校数学の無関係な運動の費用、自発視聴で継続と転移を両立する条件は未確定。E3の外れ値込み推定値と、E2の原著数値は取れなければ未確認のまま残す。E5の不整合も無理に修正値を計算しない。次はUnit 10（具体例・たとえから抽象への移行、対応づけ、誤概念）。

## Plan revision 8

Unit 9で2026年の新しい統合研究と、必須／任意の学習で余談の効果方向が変わる2025年の実験を確認した。原問いは維持し、「余白を補足で埋めるか」という量の判断を、補足の機能・目標との関係・利用時の動機の判断へ具体化した。

- 派生問い「自発的な利用で、興味から得られる継続の利益と説明への注意競合をどう比較するか」は原問いEに必要なのでE4で追究し、実サイトでの検証は推奨する次の行動に延期する。マーケティングや視聴時間最大化の調査へは広げない。
- Unit 11に、必要な前提と任意の余談を同じ詳細リンクへ押し込まないための条件整理を追加。
- Unit 13の監査候補にE3（外れ値除去・表の不整合）とE5（人数・統計量の不整合）を追加。全数値の再計算や再メタ分析は範囲外とし、結論に必要な値のみ採用する。
- 残り: Unit 10（たとえ・具体と抽象）、Unit 11（詳細導線）、Unit 12（実務と研究）、Unit 13（監査）、別ターンの報告。
- チェックポイント: 閾値通知に従いUnit 9を完了し本項まで追記した。次回はUnit 10。report.mdはまだ作らない。

## Unit 10: 具体例・たとえから抽象へ移る際の対応づけと誤概念

### 資料（すべて2026-10-11閲覧）

- E9: Fyfe, McNeil, Son & Goldstone (2014), *Concreteness Fading in Mathematics and Science Instruction: A Systematic Review*. EPR 26, 9–25. https://doi.org/10.1007/s10648-014-9249-3 ; https://eric.ed.gov/?id=EJ1036777 （著者抄録、ResearchGateの著者投稿本文の検索抜粋）。定量的メタ分析ではなく系統的レビュー。
- E10: Fyfe, McNeil & Borjas (2015), *Benefits of “concreteness fading” for children's mathematics understanding*. Learning and Instruction 35, 104–120. https://doi.org/10.1016/j.learninstruc.2014.10.004 ; 原著PDF https://jumpmath.org/ca/wp-content/uploads/sites/1/2023/09/Week-6-Fyfe-McNeil-Borjas-2015.pdf （全文取得、実験1の方法・結果、全体抄録を確認）。著者の業績一覧でも書誌照合: https://leadlab.sites.iu.edu/publications/index.html 。
- E11: McNeil & Fyfe (2012), *“Concreteness fading” promotes transfer of mathematical knowledge*. Learning and Instruction 22(6), 440–448. https://eric.ed.gov/?id=EJ978023 （著者抄録。Nと効果量の全文表は未確認）。
- E12: Kaminski, Sloutsky & Heckler (2008), *The Advantage of Abstract Examples in Learning Math*. Science 320, 454–455. https://doi.org/10.1126/science.1154659 ; 著者公開の原著 https://mathcog.org/Publications/TheAdvantageOfAbstractExamplesInLearningMath.pdf （2ページ本文。補足資料は未確認）。
- E13: Trninic et al. (2020), *The Disappearing “Advantage of Abstract Examples in Learning Math”*. Cognitive Science 44(7), e12851. https://doi.org/10.1111/cogs.12851 ; https://onlinelibrary.wiley.com/doi/10.1111/cogs.12851 （全文HTML、方法・表3/4・結果・限界）。
- E14: *One Instructional Sequence Fits all? A Conceptual Analysis of the Applicability of Concreteness Fading in Mathematics, Physics, Chemistry, and Biology Education*. https://doi.org/10.1007/s10648-020-09581-7 ; https://link.springer.com/article/10.1007/s10648-020-09581-7 （全文HTMLの概念分析・数学の適用部分）。新規比較実験ではない。
- E15: Alfieri, Nokes-Malach & Schunn (2013), *Learning Through Case Comparisons: A Meta-Analytic Review*. Educational Psychologist 48(2), 87–113. https://doi.org/10.1080/00461520.2013.775712 ; 原著PDFの公開コピー https://scispace.com/pdf/learning-through-case-comparisons-a-meta-analytic-review-21w9vk760p.pdf （全文、抄録・比較群・調整分析・考察を確認）。著者大学URL https://www.lrdc.pitt.edu/schunn/papers/ContrastingCasesMeta-AlfieriEtAl2013.pdf は検索に残るが、直接取得は404。出版社直接openも失敗したためPDFコピーを使用。
- E16: Rittle-Johnson & Star (2007), *Does Comparing Solution Methods Facilitate Conceptual and Procedural Knowledge? An Experimental Study on Learning to Solve Equations*. JEP 99(3), 561–574. https://doi.org/10.1037/0022-0663.99.3.561 （出版社著者抄録）。著者投稿本文 https://www.researchgate.net/publication/228339259_Does_Comparing_Solution_Methods_Facilitate_Conceptual_and_Procedural_Knowledge_An_Experimental_Study_on_Learning_to_Solve_Equations （方法・考察の検索取得部分）。
- E17: Rittle-Johnson & Star (2009), *Compared to what? The effects of different comparisons on conceptual knowledge and procedural flexibility for equation solving*. https://dash.harvard.edu/entities/publication/73120378-9609-6bd4-e053-0100007fdf3b （著者所属大学の原著抄録）。関連する著者総括: *Using comparison of multiple strategies in the mathematics classroom: lessons learned and next steps* (2017), https://doi.org/10.1007/s11858-017-0853-9 （抄録）。
- E18: Schroeder & Kucera (2022), *Refutation Text Facilitates Learning: a Meta-Analysis of Between-Subjects Experiments*. EPR 34, 957–987. https://doi.org/10.1007/s10648-021-09656-z ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8784251/ （直接openは認証画面。検索取得の原著本文で方法・全体結果・表2数学群・出版バイアス・限界を確認）。出版社・ERICの著者抄録でも全体値を照合: https://eric.ed.gov/?id=EJ1334754 。
- E19: Dikme, Leuders, Brunner & Loibl (2026), *Fostering conceptual change by comparing correct and incorrect solutions – The role of individual misconceptions*. Learning and Instruction 105, 102395（巻号2026年10月、著者公開PDFは2026-07-17投稿）。https://doi.org/10.1016/j.learninstruc.2026.102395 ; https://www.sciencedirect.com/science/article/pii/S0959475226000800 （出版社抄録・方法と考察の検索取得本文。全結果表・効果量は未確認）。
- 補助的に確認: Gentner, Loewenstein & Thompson (2003), *Learning and Transfer: A General Role for Analogical Encoding*, https://doi.org/10.1037/0022-0663.95.2.393 ; https://groups.psych.northwestern.edu/gentner/papers/GentnerLoewensteinThompson03.pdf （検索取得の著者本文冒頭）。よく知る領域から新領域へ写すたとえと、二つのまだ十分理解していない事例を比べて共通構造を得るanalogical encodingを区別している。今回この交渉研究の効果量は使わない。

### 具体から抽象への移行は有望だが、アニメーションのフェード効果ではない

E9は、具体物から図示を経て抽象表現へ進み、対応を明示する設計を推奨する。これは物体の不透明度を下げる演出や、単に具体例の後へ式を置くことを意味しない。E14も、表現の見た目の具体性と、その領域の学習目標を分ける必要を論じる。図を最後に全部消すという必須規則にはならない。

E10は等式の両辺が同じ量を表す理解について3実験。実験1は低事前知識の小学2〜3年生、最終N=63、個別指導とテストを一回30分で実施。具体物／記号／具体→中間図→記号／逆順を比較し、段階移行群の転移は残る3群をまとめた比較よりd=.76、p=.007。5問の転移は全体平均0.60問と低く、相対的な改善を習得達成と読まない。条件別人数の方法欄は16/19/13/13（計61）、結果欄は16/19/14/14（計63）で不整合がある。N=63と分析自由度は一致するが、群人数を独断で訂正しない。実験2/3も著者は段階移行群の転移優位を報告するが、全係数は今回転記しない。対話・フィードバック付きの実物教材から90秒動画へは外挿になる。

E11は大学生を記号のみ／意味のある画像／具体から記号へ移す群へ無作為割付し、直後・1週・3週後の転移を測定。段階移行群の成績が最も良く、記号のみが具体のみを上回る差は頑健ではなかったと著者抄録が報告する。遅延測定を含む支持例だが、日本語高校数学の全概念に必ず適用できるとはしない。

### 「抽象例の方が良い」という結果にも境界と反証がある

E12は大学生に位数3の数学的群を記号や液体計量カップ等で教え、別のゲームへの転移で記号例の優位を報告する。数学全般や学校の文章題を測った研究ではない。E13は具体例の筋書きと、単位元ゼロを満杯でなく空のカップにする等の変更を加え、抽象条件と比較した。114人を3条件へ割付したうち、本論文の主要比較は各38人の2条件（N=76）。初期学習は具体95%／抽象70%、抽象転移は73%／78%、具体転移は95%／90%、形式的転移は78%／70%（除外前）。全体として具体例を改善すると抽象例の一般的優位は得られなかった。

ただし、初期学習得点を共変量とする分析では抽象条件の転移優位が出ており、旧版の具体例と改良版を同時に無作為比較していない。全員が形式的転移前に抽象転移課題も経験した。したがってE13を「具体例が常に勝つ」という逆の万能則にしない。内容の意味、誤解を生む対応、何への転移を測るかが結論を変えるという反証として扱う。

### 例を並べるだけでなく、比較する関係を指定する

E15は57実験・336テストのメタ分析でd=.50、95%CI[.44,.56]。比較対象を一例ずつ学ぶsequential条件に限るとd=.37、CI[.31,.44]で、無学習群等との比較より小さい。336を独立研究数と表現しない。課題やテスト時点で異質性があり、全体値を数学動画の効果予測に使わない。

E16では第7学年70人がペアで多段階一次方程式の解法を学んだ。解法を比較する条件は、一つずつ検討する条件より手続き知識と柔軟性の伸びが大きかったが、概念知識の優位は示さなかった。E17の第7〜8学年162人の実験では、同じ問題の異なる解法を比べる方が、同じ解法で解く類似問題を比べるより概念知識・柔軟性に良好だった。著者総括は、一つの解法をある程度理解してから比較し、似ている点・違う点・適用条件を議論することを推奨する。これらは比較活動の証拠で、二つの図を受動的に眺めるだけの効果とは区別する。

### 誤概念を扱うなら、正しい説明と修正理由まで出す

E18は33研究・44独立比較、N=3,869。誤解を示し、誤りと明示し、正しい説明を与えるrefutation textは全体g=.41、95%CI[.30,.51]、I²=60.76%。数学部分群は5比較、g=.32、CI[.02,.62]。trim-and-fillによる仮想的な補正後はg=.28で方向は保つが、これを真の補正値と断言しない。大半が短い文章の一回介入で、誤概念の有無・事前知識による差は報告不足で解析できなかった。誤答に×だけ付ける動画の証拠ではない。

E19は第6学年184人の分数課題。解答を試みた後、正解のみ／本人の誤解に合う誤答と正解／本人とは異なる誤答と正解を提示。誤答比較の2群をまとめた一般的優位は得られず、本人の誤解に合う比較が合わない比較より良いという結果だった。効果量と遅延測定は未確認。典型的な誤答を全員に見せれば必ず改善するという主張の反例として採用する。

### 制作への暫定規則と確からしさ

1. たとえには、対象概念との対応と限界を定める。たとえば移動をベクトルの入口にするなら、経路の長さと変位を区別する。単位円では角度・座標・波形の同じ量を追えるようにする。これらの数学題材での具体的演出は設計推論であり、今回の研究が直接検証した例ではない（E9/E12〜14、一般的方向は中）。
2. 具体→対応を示す中間表現→記号は候補とし、同じ量・関係を保って移る。最終的には元のたとえがない新しい問題へ適用できるか確かめる。「必ず3段階」「必ず具体から開始」は採らない（E9〜14、条件付き支持）。
3. 二例・二解法を使うときは何を比べるかを字幕・問い・強調で指定し、参照する両方を見られる状態にする。同一問題の図形的解法と成分による解法の比較は候補だが、一方の意味も未知なら先にその前提を説明する（E15〜17からの外挿、比較活動の根拠は中〜高）。
4. 誤解を修正するクリップは、誤りの提示だけで終わらず、なぜ成り立たないかと正しい関係を示す。視聴者がその誤解を持つかを小さな問いで確認できるとよい。全クリップへの誤答挿入は不要（E18/E19、短文介入の平均効果は中、動画への直接性は低い）。
5. 評価は同じ例の再認だけでなく、外見や設定の変わった適用と遅延確認を含める。好きな例・分かりやすさ・一例の成功を転移の証明としない（E10〜13/E15）。

### 未解決と次

ベクトル・三角関数を日本語の短い動画で学ぶ際の、具体例の最良の順序・中間表現・比較の量は未確定。高校生対象の直接研究と、合成音声下の効果は今回の資料にない。E10の人数不整合、E19の全結果表は監査候補に残し、数値を無理に補完しない。次はUnit 11（概要から詳細への導線、概念地図・前提関係、必要な前提と任意補足の区別）。

## Plan revision 9

Unit 10では原問いEを維持し、「たとえを足すか」から「対応を明示して新しい問題へ移せるか」へ判定を具体化した。具体・抽象のどちらか一方の普遍的優越という読みを、改良した具体例の反証研究で退けた。2026年の誤答比較実験を追加し、典型的誤答を全員に示す規則も採らない。

- 派生問い「利用者の誤概念を診断し、補足へ分岐するべきか」は導線設計に関係するためUnit 11で必要性のみ整理する。適応教材システムの仕様・実装と診断問題の制作は範囲を超えるので延期し、次の行動へ残す。
- Unit 13の候補にE10の人数不整合とE19の結果表を追加。監査は最終規則の結論を左右する点を優先し、取得困難な全論文の全係数回収は目標にしない。
- 残り: Unit 11（詳細導線）、Unit 12（実務と研究）、Unit 13（反証・版・外的妥当性の監査）、別ターンの報告。
- チェックポイント: 閾値通知に従いUnit 10を完了し、本項まで追記した。次回はUnit 11。report.mdはまだ作らない。

## Unit 11: 概要・前提・詳細をつなぐ導線は学習を助けるか

### 資料（すべて2026-10-11閲覧）

- F1: Reigeluth & Stein (1983), *The Elaboration Theory of Instruction*, in *Instructional-Design Theories and Models*. 原典章PDF https://ocw.metu.edu.tr/pluginfile.php/9337/mod_resource/content/1/Reigeluth%201983%20Article.pdf （24ページの全文、定義・適用範囲・epitome・前提系列・実証的根拠の節を確認）。1999年改訂章の効果量として扱わない。
- F2: Chen, *The Effect of Elaboration Strategies in a Hypertext Environment on Learning*. https://files.eric.ed.gov/fulltext/ED476959.pdf （原著の検索取得で抄録・教材・群構成を確認。直接取得は36MB超として失敗。結果表は未確認）。著者CVは同題を2002年ED-MEDIA会議論文として記載: https://bpb-us-e1.wpmucdn.com/sites.psu.edu/dist/9/166731/files/2023/05/cv_chen23v.1.pdf 。検索PDF表示のページ番号とCVのページ番号は異なるため、会議資料集の再収録・版の同一性は未確定。
- F3: DeStefano & LeFevre (2007), *Cognitive load in hypertext reading: A review*. Computers in Human Behavior 23, 1616–1641. https://doi.org/10.1016/j.chb.2005.08.012 ; https://www.sciencedirect.com/science/article/pii/S0747563205000658 （出版社抄録・導入本文。定性的レビューでありメタ分析ではない）。
- F4: Amadieu, Tricot & Mariné (2010), *Interaction between prior knowledge and concept-map structure on hypertext comprehension, coherence of reading orders and disorientation*. Interacting with Computers 22, 88–97. https://doi.org/10.1016/j.intcom.2009.07.001 ; https://www.sciencedirect.com/science/article/pii/S0953543809000563 （出版社の検索取得で抄録・導入。全文のN・係数は未確認）。別論文 *Prior knowledge in learning from a non-linear electronic document* (2009), https://pmc.ncbi.nlm.nih.gov/articles/PMC7126386/ も検索本文を確認したが、N=54等をF4へ混ぜない。さらに2009年のHIV題材N=24の別論文とも区別する。
- F5: Su & Klein (2006), *Effects of Navigation Tools and Computer Confidence on Performance and Attitudes in a Hypermedia Learning Environment*. Journal of Educational Multimedia and Hypermedia 15(1), 87–106. 著者公開PDF https://myweb.fsu.edu/jklein/articles/Su_Klein_2006.pdf （全文、方法・表1・考察）。
- F6: Jáñez & Rosales (2020), *Novices’ performance using hypertext materials: Shedding light on disorientation*. AJET 36(4), 189–205. https://doi.org/10.14742/ajet.4617 ; https://ajet.org.au/index.php/AJET/article/view/4617 （出版社著者抄録）。著者投稿の本文・図説も確認: https://www.researchgate.net/publication/344417485_Novices%27_performance_using_hypertext_materials_Shedding_light_on_disorientation （検索取得の方法・考察・図説）。
- F7: Schroeder, Nesbit, Anguiano & Adesope, *Studying and Constructing Concept Maps: a Meta-Analysis*. online 2017-03-21、巻号年2018、EPR 30, 431–455. https://doi.org/10.1007/s10648-017-9403-9 ; https://link.springer.com/article/10.1007/s10648-017-9403-9 ; https://eric.ed.gov/?id=EJ1179084 （出版社・ERICの著者抄録、書誌）。旧版Nesbit & Adesope (2006), https://www.sfu.ca/~jcnesbit/research/NesbitAdesope2006.pdf は抄録だけ確認し、旧版の数値を混ぜない。
- F8: Boyle & Encarnacion (1994), *MetaDoc: An adaptive hypertext reading system*. UMUAI 4, 1–19. https://doi.org/10.1007/BF01142355 ; https://link.springer.com/article/10.1007/BF01142355 （原著抄録と書誌。学習実験の全表は未取得）。
- F9: Bret Victor (2011-03-10), *Explorable Explanations*, 2024年2月追記付き。https://worrydream.com/ExplorableExplanations/ （全文、実例の説明と2024追記）。本人による設計論・デモであり対照学習実験ではない。
- F10: Ted Nelson本人のCV https://hyperland.com/TNvita （Stretchtext, hypertext note #8への原典案内を確認）。原稿画像 https://xanadu.com/XUarchive/htn8.tif は取得失敗。したがって1967年の原稿内容・成立日の詳細を、今回原典全文で確かめた事実として扱わない。
- 探索のみ: *How the design and complexity of concept maps influence cognitive learning processes*, https://pmc.ncbi.nlm.nih.gov/articles/PMC8788906/ （検索本文で方法・結果の一部。直接取得は認証画面）。今回の主要結論や数値には使用しない。

### 理論の意味: 「概要を表示」「自由なリンク」「前提を教える」は別の操作

F1のelaboration theoryは、多数の考えを選択・配列・統合・要約するマクロな授業設計を対象とする。epitomeは、全見出しの薄い要約ではなく、少数の基礎的で代表的な考えを応用できる水準まで教える入口。前提となる知識の系列も組み込む。クリックや画面遷移の方式を比較した理論ではなく、単純から複雑への系列が常に最良との実証済み法則でもない。

F2は米国大学生33人、約2,000語の心臓教材。単純から複雑へ構成したハイパーテキストと通常の線形教材を比較し、著者抄録は事実・概念の成績差を報告する。しかし検索取得できた記述だけでは全ての操作差と結果表を監査できないため、効果量・汎用的優位は採用しない。理論の名を付ければ詳細リンクの効果まで保証される、とはいえない。

### 非線形の自由には負担があるが、初学者が必ず迷うわけでもない

F3は主に大学生の文章読解研究を整理し、リンク選択と視覚処理の負担が読解を損なう例、低い事前知識・作業記憶で不利になる例を報告する。階層と知識構造が対応している場合は低知識者にも利益があり、複雑な全体地図は一貫して有効ではない。リンクの種類が分かること、選択の案内があることと、単に全リンクを見せることを分ける。

F4は階層型とネットワーク型を比較し、低事前知識群で階層型の理解・読む順序・迷いの感覚が良好、高知識群では理解と迷いに構造差がなかったと報告する。効果量・Nは全文未確認のため記載しない。F6はスペインの教育学部生90人（ハイパーテキスト45／紙45）、全員低い題材知識で、試験準備・要約・問いかけの3課題を実施。大半は一貫した順序で読め、強い迷いはハイパーテキスト群の約13%にとどまった。教材には階層図への入口、見出し、既読リンク色等があった。これらの個別要素を独立に操作した実験ではないため、どの要素が解決したかまでは断定しない。初学者であることだけを理由に自由な移動を禁止する根拠にはならない。

### 概念地図の学習効果を、そのままナビゲーションの効果にしない

F7は142独立効果量、N=11,814、全体g=.58。地図を作る活動は各々の比較条件に対しg=.72、既成地図を学ぶ活動はg=.43。異なる研究群の調整分析であり、「作る対見る」の直接無作為比較の効果量ではない。地図を使った学習の平均的支持はあるが、クリック可能な前提グラフを画面脇に置くだけの効果を表さない。

F5は大学生354人、12授業セクションを事前知識でブロック化して3条件へ割付。Internet/WWWの教材に埋込リンクのみ／階層目次追加／地図追加を比較した。23点の事後テストは17.01／17.94／17.55。目次対リンクのみは著者のES=.31、p<.05。地図は他2群との有意差なし。目次・地図とも迷いの自己報告は改善したが、これを成績の改善と同一視しない。授業単位の割付を個人単位ANOVAで分析しており、クラスタ考慮は確認できない。地図の関係ラベルも省略されていた。全面的な地図の無効性を示す実験ではない。

### Stretchtextとexplorable explanations: 方法の提案と学習実験を区別

Stretchtextは、この制作では「現在の文脈内で詳しさを増減する形式」として検討できる。F8は技術文書の詳細度を利用者モデルまたは明示操作で変える実装を記述する。ただし原著抄録は学習効果の数値を示さず、後世のレビューが述べる速度・理解改善を原著の係数として転載しない。Nelsonの原稿はF10経由で到達を試みたが未取得。成立史の精査は設計判断に不要なので保留する。

F9は、説明として読むだけでも意味が通り、疑問が生まれたら同じ文脈で例の条件を変えて調べられる構成を示す。単に操作可能な箱を置き、あとは自分で発見させる形式を批判している。2024追記では、元の狙いは教育用の可動図一般よりも、前提・計算・モデルを読者が変更して主張を検証できる文章だったと補足する。これは原案6への有用な設計上の類比だが、クリック式補足や日本語高校数学での学習効果の実験ではない。

### 制作への暫定規則と確からしさ

1. 各クリップの理解に今必要な前提と、任意の深掘り・余談を分ける。前提が未知なら本線の前置きまたは明示した復習へ導き、必須の説明をすべて任意クリックへ隠さない（F1/F3/F4とUnit 6からの推論、一般方向は中）。
2. 推奨される本線を保ちながら、図の要素から「何が分かる補足か」を示して開けるようにする。「詳しく」だけより「角度とラジアンの復習」のように行先と目的を明示する案。任意の一律リンク個数・階層深さは研究から決めない（F3/F5/F6、設計案として中）。
3. 移動前の図・時点を保持し、現在地・補足の題・戻り先を示す。短い定義は同じ文脈で表示、長い説明は別クリップへ移り元の時点に戻す案を比較する。これは研究の負荷知見とF9から導く実装仮説で、両方式の勝敗を示す直接実験は得ていない。
4. 前提知識のグラフはまず制作者が教材の依存関係を点検するために使う。視聴者へ見せる場合は現在の学習に必要な部分と関係の意味を示し、全ノードを常時見せることを必須にしない。「AがBの前提」と「AがBの一部」「別の説明」を同じ線で混ぜない（F1/F5/F7を踏まえた制作上の推論）。
5. クリック数・滞在時間・迷いの自己報告だけで成否を決めず、必要な補足を探し、戻って元の問題を説明・解答できるか測る。誤概念に応じた適応分岐は可能性として残すが、全員への診断・自動適応を最初から必須化しない（F5/F6、Unit 10との接続）。

確からしさ: 非線形教材の構造・事前知識・案内が重要という方向は複数研究で中程度。概念地図を用いた学習の平均効果は統合研究で支持される。ただし、短い数学動画の要素をクリックして補足クリップへ降り、同じ時点へ戻る形式の直接効果は未検証。理論・実務の設計案と区別する。

### 未解決と次

短い同一画面補足と別クリップ遷移の比較、音声を伴う移動と復帰、前提グラフの適切な表示範囲、高校生の自己診断の正確さは未確定。適応教材・推薦アルゴリズム・成立史の全面調査には広げない。次はUnit 12（作り手本人・Heer & Robertson・アニメーション原則・UI motionの一次資料）。

## Plan revision 10

Unit 11で、原問いFの「詳しくする」を、前提を補う・任意の情報を足す・モデルの条件を変えて検証する、の異なる目的へ分ける必要が明らかになった。原問いは維持する。explorable explanationsの本人による2024追記も取り込み、教育用インタラクティブ図一般への意味の拡張を区別した。

- 派生問い「どの前提が不足するか診断して自動分岐するか」は、原問い6に必須でない。Unit 10で延期した診断問題・適応教材の設計を引き続き次の行動へ残す。
- 原典Nelsonの詳細な成立史とMetaDocの全結果表の回収は、制作規則の結論を左右しないため今回の必須単位から除く。原典未取得と効果量未確認は報告に明示する。
- 残り: Unit 12（実務と研究）、Unit 13（反証・版・外的妥当性の監査）、別ターンの報告。
- チェックポイント: 閾値通知に従いUnit 11を完了し本項まで追記した。次回はUnit 12。report.mdはまだ作らない。

## Unit 12: 作り手・可視化実験・アニメーション原則・UI motionは何を勧めるか

### 資料（すべて2026-10-11閲覧）

- G1: Grant Sanderson, *About / FAQs*, 3Blue1Brown。https://www.3blue1brown.com/about/ （本人サイト、Manim・制作道具の説明本文）。補助資料 *How I animate 3Blue1Brown*（2024-10-12）https://www.3blue1brown.com/lessons/manim-demo/ はページ説明のみ。動画全編の分析は行っていない。
- G2: Sanderson (2021-07-16), *The Summer of Math Exposition*. https://www.3blue1brown.com/blog/some1/ （本人による募集・審査基準の全文）。同年10月23日の振返り https://www.3blue1brown.com/blog/some1-results/ も本文確認。審査基準は学習成果の実験結果ではない。
- G3: Trevor Cheung / Mathemaniac, *My SoMEπ criteria*. https://www.mathemaniac.co.uk/blog/my-somepi-criteria （本人の全文。表示日はApr 25、表示範囲に年がないので年は確定しない）。
- G4: Heer & Robertson (2007), *Animated Transitions in Statistical Data Graphics*, IEEE TVCG 13(6), 1240–1247. https://doi.org/10.1109/TVCG.2007.70539 ; 著者公開PDF https://jheer.org/publications/2007-AnimatedTrans-InfoVis.pdf （8ページ全文、方法・図の説明・結果・限界を確認）。書誌 https://pubmed.ncbi.nlm.nih.gov/17968070/ 。検索結果の「数か月前」という表示は論文出版年ではない。
- G5: Lasseter (1987), *Principles of Traditional Animation Applied to 3D Computer Animation*, SIGGRAPH Computer Graphics 21(4), 35–44. https://doi.org/10.1145/37401.37407 。CMUの原論文複製 https://www.cs.cmu.edu/afs/cs/academic/class/15462-f13/www/lec_slides/Lesseter.pdf は検索本文の冒頭のみ、直接取得失敗。原論文複製の全文テキスト https://www.scribd.com/document/1055458996/John-Lasseter-Principles-of-Traditional-Animation-Applied-to-3D-Computer-Animation で§2.2 Timing、§2.3 Anticipation、§2.4 Stagingを確認（投稿者の要約ではなく論文本文）。
- G6: Zongker & Salesin (2003), *On Creating Animated Presentations*, Symposium on Computer Animation, 298–308. https://doi.org/10.2312/SCA03/298-308 ; 著者所属大学PDF https://grail.cs.washington.edu/wp-content/uploads/2015/08/zongker-2003-oca.pdf ; 複製 https://www.cs.ubc.ca/~van/cpsc590/papers/Zongker.pdf ; 出版社書誌 https://diglib.eg.org/items/692711ca-7b50-476d-a748-43f43afb2cd3 （全文、§2/4/5を確認。大学PDFのshell取得は失敗したがweb取得は成功）。
- G7: Google, Material Design 2, *Understanding motion*. https://m2.material.io/design/motion/understanding-motion/ （公式検索取得本文のPrinciples/Hierarchy。直接openはJavaScript案内のみ。Material 3の現行トークン値として引用しない）。
- G8: Sharon Harris & John Schlemmer, *Making Motion Meaningful*, Google Design. https://design.google/library/making-motion-meaningful （本文。Google PhotosやDuo等の担当デザイナーの説明。掲載年は本文に見えないため確定しない）。
- G9: W3C, WCAG 2.2 Understanding *2.3.3 Animation from Interactions*（AAA）https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions と *2.2.2 Pause, Stop, Hide*（A）https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide （条件・例・範囲を確認）。公式解説であり、教材の学習効果実験や本アプリの適合性監査ではない。

### 作り手の基準: 道具や見た目より、何を分かってほしいか

G1でSandersonは、Manimを精密な図や長い場面をコードで扱うための道具と説明し、用途によってDesmos/GeoGebraや一般の映像編集ソフトも選ぶとしている。音声編集までManimへ詰め込むことは勧めていない。これをfuzzy6の時刻同期エンジンの不適切さの根拠にしない。制作方式の違いであり、Manim製であることは学習効果を保証しない。

G2の審査基準は明瞭さ・動機づけ・新しさ・記憶に残ること。未知の専門語や前提への配慮、早い段階で学ぶ理由を伝えることを勧める。「最初の30秒」や審査時の「5〜10分」は競技の実務値であり、90秒教材の実証的な最適値ではない。振返りでも短い作品は審査しやすい一方、よい説明には時間が要る場合があると述べる。

G3は新規な切り口と学ぶ理由を重視し、Manim/GeoGebra/板書という様式自体は審査基準にしない。本人が個人的好みと明記する強い「新規性」条件は、既知の高校数学の基礎を教える本制作の必須条件にはしない。G2/G3の印象や審査順位は保持・転移・遅延テストと異なる評価対象である。

### 可視化実験: 追跡には利益があるが、段階を増やせばよいわけではない

G4はデータ図に慣れた26〜62歳の成人24人が二つの参加者内実験に参加。瞬時切替／直接補間／段階化を比較し、対象追跡（遷移1.25秒）と値の変化推定（2秒）を測った。追跡は全遷移でアニメーションが良好（条件検定p<.001）。ただし散布図の時系列変化では段階化が直接補間より悪い（p=.002）。値推定は積上げ棒で条件差なし（p=.224）、ドーナツでは直接補間が段階化より良好（p=.024）。図の数値から効果量を逆算せず、標準化効果量は未確認とする。数学の概念学習・転移は測っていない。

軸の拡縮は値の推定を難しくした。共通尺度を保つ、必要な拡縮と値変化を区別するという勧めは妥当だが、グリッドを残す提案と段階ごと約1秒という勧めは著者の考察で、独立に最適化した実験結果ではない。段階の好みと誤差の改善も常に一致しない（G4）。

### Stagingの意味と、キャラクター表現を説明図へ移す際の衝突

G5のstagingは、伝える考えを明瞭にし、適切な時点で注目先を分かるように配置・強調すること。timingや予告もそのために使う。これは娯楽アニメーションの実務原則であり、要素を一個ずつ出す教育法の無作為実験ではない。原論文は11項目を列挙しており、後世の「12原則」の一覧と同一の版として扱わない。

G6は発表用アニメーションの制作経験から、意味のある動き、複雑さの管理、語りとの一致、内容そのものの変化と注意誘導・場面遷移の区別を勧める。特に注目させるための伸縮や誇張が、図の意味を変えたように見える問題を指摘する。著者自身が、原則は例外を許す既定値であると明記している。学習効果の比較実験は行っていない。

G6の一度に一つの動きを行う案とG4の結果には条件付きの衝突がある。独立した動きが注意を奪い合うことを避ける狙いは有用だが、極端な段階化は余分な変化と記憶負担を増やす。本制作では「主に追う関係を一つにする」と捉える。たとえば単位円の角度・点の高さ・グラフの対応を同時に動かすことは、一つの関係を示す演出になり得る。これが高校生に最善であるかは試作検証が必要。

### UI motion: 関係と帰り道を示す用途と、表現的な楽しさを分ける

G7は関係・操作・結果を伝える、重要なものに注意を向ける、個性を表現するという3原則を置き、親子・同階層の関係を動きで示す。G8は共有要素の移動や焦点の案内、複雑な内部操作を簡潔に見せる実例を説明する。補足へ入って戻るときの文脈維持には参考になるが、UIの気持ちよさ・ブランド表現を数学の理解向上と同一視しない。バウンドや祝祭的な動きを、coherenceの知見に優先する一般規則にはしない。

G9では、操作で始まる非本質的な位置・形等のアニメーションを無効化できることがAAAの2.3.3、一定条件を満たす自動の動きに停止等を設けることがAの2.2.2に対応する。後者の5秒は適用条件で、学習上のシーク幅・最適な区切りではない。補足パネルの大きな移動と、教える対象の変化を分け、前者を抑える選択を用意する案を次の実装検討へ残す。法的義務や本アプリの適合判定までは扱わない。

### 制作への暫定規則・研究との一致と不一致

1. 図を動かす前に、その動きが「量や関係の変化」「注目の案内」「画面間の移動」のどれかを決める。たとえば注目用のベクトル伸縮を、スカラー倍と誤認させない。色・囲み等も意味の対応を保つ（G5/G6/G7＋Unit 3。実務と設計推論）。
2. 対象の同一性と不変量を追える動きにし、座標の尺度変更と数値自体の変化を混同させない。拡縮の前後を読める目印は有力な案だが、そこへのキー移動はG4の実験で検証された機能ではない（G4、単一研究からの外挿）。
3. 同時に独立した見せ場を増やさず、必要な対応関係はまとめて見せる。全要素を一つずつ動かす義務、静止3秒を超えたら何か動かす義務にはしない（G4/G6、Unit 4/9との統合）。
4. 完成図＋強調、生成過程、連動する変化を内容に応じて選ぶ。好まれる見た目・新規性・視聴時間を、理解や転移と別に評価する（G1〜G4とUnit 2/3）。
5. 入口で問いと到達点を分かるようにし、初学者の前提を考慮する。驚きはその問いに役立つ範囲で使う。作者の成功例から尺・強調回数・動きの速度の固定値を作らない（G2/G3、実務）。

確からしさ: 原則の出典と対象範囲の確認は高い。G4の対象追跡・値推定は小標本の実験証拠で中程度、日本語高校数学への直接性は低い。他の制作指針は実務・規格・理論であり、効果量はない。実務と研究が「矛盾する」ときも、楽しさ・移動の理解・数学学習という評価目的の違いを先に確認する。

### 未解決と次

高校生のベクトル・三角関数で、複数表現の同時連動と段階化のどちらがよいか、拡縮前の目印に戻る操作、VOICEVOXの語りと同期した強調の最良速度は直接未検証。制作道具の比較や全デザインシステムの網羅調査は行わない。次はUnit 13、これまで残した原著・版・数値・反例を、最終規則への影響順に監査する。

## Plan revision 11

Unit 12で、同じ「staging」が注意を向ける演出、変化の段階分け、意味単位の区切りを指して使われる点を確認した。原問いを維持し、最終報告ではこれらを区別する。また、学習上の提案とUIの快適さ・アクセシビリティの基準を分ける。

- 派生問い「動きを抑えた数学教材の代替表現をどこまで実装するか」は、今回の6案の学習科学の検証を超える。非本質的なUI motionを減らすという方向だけ記録し、詳細な仕様・適合性監査・代替教材の評価は推奨する次の行動へ延期する。
- Unit 13では、日本語高校数学への外挿、実証値と制作仮説、効果がないことと同等性、実験間/研究群間の比較を再点検する。全未取得資料の回収を完了条件にはしない。取得できない重要点は、根拠を弱く表示するか数値を不採用にして明示する。
- 残り: Unit 13（反証・版・外的妥当性の監査）、別ターンの報告。Unit 13終了時はready-to-reportを返し、そのターンでは報告書を書かない。
- チェックポイント: 閾値通知に従いUnit 12を完了し、本項まで追記した。次回はUnit 13。report.mdはまだ作らない。

## Plan revision 12

横断監査で、A1の原著先行版に「完成図を指し示す」比較群があることを確認した。この比較は原案3の一律採用を左右するので優先して追究した。併せて、Mayer共著研究に限定した2025年の統合研究、2026年の重なる強調の実験、描画と自己評価の2023年実験を監査する。原問いは維持し、「どの見せ方が勝つか」を、何を比較し何が改善したのかへ分解する。

- Unit 13は新規の全分野レビューではなく、原案判定に効く反証、比較対象、版、外的妥当性、未確認値の採否を確定する単位とする。
- A2/A14〜16の全係数、Sondermann & Merktの全比較、B4/B6/B8/Biard、C2〜4、D9/D10/D13/D18の未取得表、E2/E3の感度分析、E10の人数訂正、E19/F2/F4/F8の全表等は、取得・照合できないものを推定で埋めず、条件や数値を不採用にする。これらの全面回収は本調査の完了条件から外す。研究者への問合せは行わない。
- 派生問い「好み・理解の自己評価・成績がどう一致するか」は既存計画の範囲で追究する。診断課題の開発、長期利用の効果測定、音声・操作の実装、完全なアクセシビリティ監査は引き続き延期する。
- 残り: Unit 13の完了記録と、明示的に指定される別ターンの最終報告。報告ターン前にreport.mdは作らない。

## Unit 13: 原案の判定を左右する反証・版・比較条件・外的妥当性の監査

### 資料（すべて2026-10-11閲覧）

- 既存証拠: 本ファイルUnit 1〜12の出典と所見を再読。新たな閲覧と再確認を下記に区別する。プロジェクトファイルの再実行・変更は行っていない。
- H1（A1の追加原著版）: Fiorella & Mayer, *Effects of Observing the Instructor Draw Diagrams on Learning From Multimedia Messages*. https://bootcampmilitaryfitnessinstitute.com/wp-content/uploads/2015/11/effects-of-observing-the-instructor-draw-diagrams-on-learning-from-multimedia-messages-fiorella-meyer-2015.pdf （20頁の原著先行版、方法・比較・結果を確認）。DOIはA1と同じ https://doi.org/10.1037/edu0000065 。PDFに2015と仮の巻頁があり、書誌の正本は2016年108(4), 528–546とする。2015年の5実験の学位論文とは別。抄録は https://eric.ed.gov/?id=EJ1099178 でも再照合。
- H2（A17の追加原著確認）: Schroeder & Traxler (2017), *Humanizing Instructional Videos in Physics: When Less Is More*. https://www.researchgate.net/publication/313372328_Humanizing_Instructional_Videos_in_Physics_When_Less_Is_More （著者抄録、出版社版の冒頭・図説。本文全表は未確認）。https://doi.org/10.1007/s10956-016-9677-6 。二次紹介の人数・学習効果量は転記しない。
- H3: Fiorella, Stull & Jaeger (2023), *Are there metacognitive benefits of learner- and instructor-generated visualizations?* https://doi.org/10.1002/acp.4135 ; https://onlinelibrary.wiley.com/doi/full/10.1002/acp.4135 （全文HTML、方法・表1/2・計画対比・限界。著者名は報告前にページ先頭と照合する）。
- H4（C/Dで保留した統合研究）: Cromley & Chen (2025), *A meta-analysis of Richard Mayer’s multimedia learning research: Searching for boundary conditions of design principles across multiple media types*. https://doi.org/10.1016/j.edurev.2025.100730 ; https://www.sciencedirect.com/science/article/abs/pii/S1747938X25000673 （出版社検索取得の抄録・方法・討論本文。補足の全コード・原理別比較表の照合は未了）。著者所属機関の書誌 https://experts.illinois.edu/en/persons/jennifer-g-cromley/ でも巻号2025年11月を確認。
- H5: Désiron, Endres & Schneider (2026-05-22), *Is it not too redundant? When signaling overlap reduces extraneous load and enhances retention in a software video tutorial*. https://doi.org/10.3389/fpsyg.2026.1795142 ; https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2026.1795142/full （全文HTML、方法・結果4.2/4.3・限界）。
- 再確認: D10 https://www.tandfonline.com/doi/full/10.1080/01443410.2026.2678483 と同DOIのPDF。出版社検索取得の抄録と冒頭で、受理2026-05-19・2研究・3提示条件・非有意結果を確認。全結果と刊行日の不一致は解消せず、N・効果量・正確な出版日は採用しない。
- 再確認: D18 https://www.researchgate.net/publication/248498142_Integrating_information_A_meta-analysis_of_the_spatial_contiguity_and_temporal_contiguity_effects と出版社 https://www.sciencedirect.com/science/article/pii/S0959475206000806 。著者原稿の時間的近接d=.78は再確認できたが、出版社最終版の数表は回収できず、.87との版照合は未完了。
- 再確認: E19 https://www.sciencedirect.com/science/article/pii/S0959475226000800 と https://www.researchgate.net/publication/410361644_Fostering_conceptual_change_by_comparing_correct_and_incorrect_solutions_-_The_role_of_individual_misconceptions 。N=184・第6学年・比較条件・原著の結論を再確認。全係数と遅延成績は依然未確認。
- 描画限定メタ分析の追加探索は、一般の静的/動的視覚化、講師存在、学習者自身の描画の統合研究に主として到達した。これらを「講師による線の生成対完成図＋同期強調」に限定した統合効果へ置き換えない。今回その限定メタ分析は確保できず、存在しないとは断定しない。

### 原案3に効く追加確認: 完成図＋強調も一律の勝者ではない

H1の実験1は大学生157人、約100秒のドップラー効果教材。同じ図・説明で、全身を見せて描画／完成図を講師が指示／完成図を指示なし、の3群を比較。低事前知識者では描画が指示群より転移で良好（d=.63、p=.02）。事前知識×条件の交互作用を報告する。指示群対指示なしの利益は検出されなかった。Unit 2で主に述べた描画対完成図の比較に、この第三群を補足する。

これとA3の「手描き対完成図＋カーソルの差なし」は題材・尺・誘導方法・テストが違い、論理矛盾や完全な追試失敗ではない。必要なのは、生成順が意味を持つか、強調が本当に対応を助けているかの判断。原案3は全クリップ一律の置換ではなく選択肢として扱う。H1の実験2〜4はN=121/107/99で、4実験の人数や手・身体の条件を混ぜない。原著先行版と最終版の全表照合まではできていない。

H2の著者抄録は、斜面の摩擦を解く同内容の動画で、手なしの方が学習テスト・訓練効率で良く、手ありの方が人間らしさ・興味を引く評定が高いと明記する。Unit 3の間接的な「手が不利」候補を、原著の方向確認へ引き上げる。N・dを原著表で読めていないので数値は増やさない。手の表示は学習の必要条件にも、普遍的な害にもできない。

### 「分かった感じ」と理解・転移は別に扱う

H3では大学生133人が生物の5文章（練習1文章は別）を学び、文章のみ／完成図／自分で図を描く／講師の描画動画を見る、を比較。理解得点の群差は非有意（p=.317）。後ろ2群をまとめた計画対比では、説明できるという判断と実得点の相対的対応が改善（d=.36、p=.041）したが、テスト得点の予測判断では非有意（d=.15、p=.402）。これを「描画の理解効果d=.36」と引用しない。約75分の実験であり短い数学動画ではない。

この結果は、見た目の好みだけでなく「どの内容を理解できたかを本人が判断できること」も別の成果であると示す。Unit 4の細分化は煩わしさと応用得点が逆方向、Unit 5のLectureScapeは主観的効率と課題成績が一致せず、H2も好みと成績が一致しない。完成図が読める、見やすい、最後まで見た、理解を自己申告した、だけで数学的転移の達成を判定しない。

### 強調が重なることと、不要な重複は同じでない

H5はドイツの大学生101人、22分52秒のPhotoshop操作動画、5群への無作為割付。全群同じ音声で、ラベルと同期した枠を段階的に増やし、停止・速度変更は不可。量の線形対比は保持（偏η²=.115）・転移（.144）で良好、余分な負荷（.221）は低下を示す。これは特定の5条件を通じた傾向で、隣り合う各群の差や一つずつの枠の独立効果ではない。長い複雑なソフト教材であり、数学図の囲みを増やす万能則にも全文字幕の追加利益にもできない。

H5は「強調は一箇所・一種類しか許さない」「同じ対象を音声と枠で示すと必ず冗長」という強い規則への反証になる。制作では主に読む関係を絞り、関係の両端を複数箇所で同期強調することを許す。原案3の色・囲み・拡大を同時に最大化する根拠ではない。

### メタ分析の大きさ・有意差・原理名の監査

H4は1990〜2022年のMayer共著92論文・181研究・591効果を対象とし、全体g=.37。全分野の更新版でも、各原理を直接競わせた実験でもない。本文討論は原理・媒体・成果による差を示す。segmenting、pre-training、voice、contiguityにはこの集合で非有意の平均もあるが、原理全体の無効の証明や、別のより広い統合研究を取り消す結果とはしない。

H4は、抄録の「全moderator」と本文の介入時間の扱い、modalityの平均値、Unit 7で記録した分類の括弧に照合未了が残る。そのため原理別の数値を制作規則の係数として採用しない。総平均の比較や、ある原理が他より効果量の数字が大きいというだけで制作優先順位を決めない。理論上の言葉が同じでも比較条件が異なり、研究者・地域・媒体・年代は共起する。

統合研究の確からしさは「効果が大きい」ではなく、方向の再現、研究の範囲、偏り、介入の近さで表示する。A6〜9/B1/D3/E3/E15/F7等には元研究の重複がある。複数メタ分析を独立した実験として数えず、異なるg/d/rを加算しない。平均効果や研究間のモデレータは、fuzzy6の各実装の因果効果の保証ではない。

### 不一致・未取得資料の最終的な扱い

| 対象 | 監査後の扱い |
|---|---|
| A3 Study 2の遅延テストの本文と表 | 非有意の全体検定と、事後の一比較を分ける。細かなp/偏η²の不一致を隠さず、報告では方向中心。Study 3の非有意を同等性とはしない |
| A1先行版と学位論文、A4 onlineと巻号 | A1は4実験、学位論文は5実験。A4は2025 online/2026巻号。採用する版を明記 |
| B1自己ペースCI | 表3を使う。平均区切り長は最適長ではない。学習時間の統合値の偏りを明記 |
| D12日本語合成音声 | 2025巻号/2026公開。VOICEVOX全体の劣位ではなく特定の声・設定と成人の一教材。d>.23等を高校数学の期待差にしない |
| D18時間的近接 | 報告本文は方向を主に述べる。dを出すなら著者原稿d=.78と版を明記し、未照合の.87を使わない |
| D19群人数の不整合 | 全Nと集約した比較の範囲のみ必要時に記す。±2秒を許容閾値に変換しない |
| E3外れ値・表の不整合 | g=−.16は外れ値9効果除去後。除去前の頑健性未確認。原著数値が不確かな箇所を追加しない |
| E5/E10の人数・統計量の不整合 | 独断で訂正・再算出しない。E10のd=.76は他3条件をまとめた比較で、各条件との一対一効果とはしない |
| E19の結果 | N=184と比較・結論は採用、未取得の係数と遅延効果は不採用 |
| F7概念地図 | 地図作成と地図読解の各平均は異なる研究群。直接比較やクリック式ナビの効果とはしない |
| G4/G5/G7/G9 | データ追跡は数学学習ではない。Lasseter1987の11項目を後年の12原則と混ぜない。Material 2は3の現行数値ではない。WCAG条件の秒数は最適学習時間ではない |
| その他の全文未回収項目 | 既存ログの読めた範囲と不確実性を維持。未確認N・秒数・dを二次資料から補わず、最終規則は他の確認済み証拠と設計推論に依拠 |

### 六つの原案と規則候補の照合結果

1. 可変長・上限90秒: 意味と処理量で長さを決める方向は支持。90秒の最適性は未検証。クリップ長と内部の区切りを分離（B1〜5）。
2. 意味の目印・読める状態・重要な変化の直前への移動: 参照を助ける合理的仮説。停止・区切りの学習証拠と、そこへ移動するUIの証拠を分離。遠い時だけ5秒送る同一キーの混合は直接証拠なし（B6〜14）。
3. 完成図＋強調: 有力な選択肢。構成順が内容なら生成過程も残す。初めに全細部を見せることはadvance organizerではない（A1〜13/H1/H5/C1〜5）。
4. 合成音声と字幕: 実際の声・読み・同期で条件付き採用。字幕全廃／全文常時必須のどちらも支持しない。無音利用、図中の式・記号、再聴を分ける（D1〜19）。
5. 補足図・たとえ: 目標に必要な対応・比較・誤解修正のためなら候補。空白や静止だけを理由に追加しない。具体から抽象も条件付き（E1〜19）。
6. 詳細へ降りる導線: 前提補充と任意の深掘りを区別し、本線・現在地・戻り先を保持する案。クリック式の補足から同じ時点へ戻る数学教材への直接効果は未検証（F1〜9/G7〜9）。

最終報告の10〜20規則には、18項目にまとめられる根拠が揃った: ①問いで尺を決める、②意味の内部区切り、③戻れる状態、④秒と意味移動を区別、⑤必要な関係の図を揃える、⑥生成順が内容なら残す、⑦目的ある同期強調、⑧読む静止と参照可能な前状態、⑨部品・記号の事前確認、⑩既習者の省略と復帰、⑪実際の合成音声を試す、⑫字幕・図中語・無音説明を分ける、⑬語りと対象を同期、⑭必要な補足と装飾を区別、⑮たとえの対応と限界、⑯比較・誤解修正を説明まで行う、⑰本線と詳細の往復、⑱理解・転移・遅延と利用上の成績を別々に検証。報告で各項目へ根拠の種類・確からしさ・例外を付ける。これは制作規則案の整理であり、プロジェクトの正本規則を変更したものではない。

### 外的妥当性、残る不確実性、次

多くは大学生・成人、英語等、数分〜数十分、一回視聴、直後テストである。中等教育の確率・方程式、児童の等式・分数、日本語TTSの原著もあるが、「日本の高校生×ベクトル/三角関数×90秒以下×VOICEVOX×意味移動UI」を一括して検証した証拠は今回得られなかった。したがって一般方向の根拠と実装への直接性を別に評定する。反例の多くは異なる条件での境界証拠であり、全てを厳密な追試失敗とは呼ばない。

次の行動は、代表的な二題で同じ台本・図・学習目標を保ち、見せ方・移動・音声条件を別々に試すこと。事前知識、見逃し回復、無強調の新例への適用、遅延確認、煩わしさを測る。小規模な操作試作は操作不良の発見には使えるが、学習効果の確定や同等性の証明には使わない。必要な学習実験の人数と意味のある差は、別途の設計対象とする。

最新の計画改訂12に対する研究単位1〜13は完了。未取得表の網羅的回収、診断・適応教材、長期継続と学習の両立、音声・キー操作実装、アクセシビリティ仕様は明示して延期する。次は明示的な報告ターンでlog.mdを再読し、日本語report.mdを書く。このターンではreport.mdを作らない。閾値通知に従い、本Unitの完全な記録を永続化してチェックポイントへ進む。

### Unit 13の書誌照合追記

H3の出版社ページ冒頭を2026-10-11に再確認した。著者は **Logan Fiorella & Allison J. Jaeger** の2名である。上の資料一覧に含めたStullは誤記であり、採用しない。書誌はApplied Cognitive Psychology 37(6), 1430–1443、初公開2023-09-16、DOI 10.1002/acp.4135。本文の実験条件・結果の帰属はH3のままで変わらない。本追記まで完了し、ready to write report。

## Unit 14: 最終報告の作成と照合

### 資料・実施時点

- 2026-10-11の明示的な報告ターン。確認時刻2026-10-11 04:32:26 UTC。
- `research/motion-principles/log.md` の初期計画、Unit 1〜13、計画改訂1〜12、書誌訂正までを再読した。資料のURL・閲覧日・取得範囲は各単位の記録に従い、新しいウェブ研究は追加していない。
- 同ディレクトリの `report.md` を作成・照合した。元の問いと指定された日本語・A〜G・10〜20規則の要件に照合した。

### 成果と根拠の扱い

- 報告は6案の判定、A〜G別の主張・比較条件・効果・反例・適用範囲、根拠の種類と確からしさを付けた18規則、残る不確実性、版・数値の採否、問いと計画の変化、次の検証案を含む。
- Unit 13の判断を維持した。90秒・5秒送り・字幕字数・静止3秒を普遍的な学習値とせず、描画と完成図＋強調の一律の勝者を決めない。字幕全廃や合成音声全般の優劣も結論にしていない。
- Fiorella & Jaeger (2023)は訂正済みの2著者で記載。時間的近接のd=.78は著者原稿の値と明記し、未照合の.87を採用しない。未取得表・人数不整合・同等性未検証も残した。
- 読取のみの機械的確認で、出力ディレクトリが `log.md` と `report.md` の2ファイルだけであること、報告の規則番号が1〜18であること、A〜Gの節があること、ローカル参照先が存在することを確認した。報告は311行、ウェブ資料リンク98箇所。リンク先の新規再取得やアプリの実行は行っていない。プロジェクトの仕様・コードは編集していない。

### 未解決と次

日本語高校数学への直接効果、最適な尺・発話速度・移動方式、診断と適応分岐、長期利用、実装・アクセシビリティの詳細は、報告に不確実性と推奨する次の行動として残した。本調査の最新計画に対する研究と報告は完了。次の研究単位はなく、報告ターンとして完了を返す。追加チェックポイントは要求しない。
