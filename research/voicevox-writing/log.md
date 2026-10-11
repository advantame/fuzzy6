# VOICEVOX 原稿の書き方・API での調整の調査ログ

- 質問: VOICEVOX の文を自然に読ませる具体的な語彙・型ごとの書き方と設定を、主に利用者の経験・公開 Tips から集め、Engine 0.25.2 HTTP API で再現できる手段と確かさを明らかにする。
- 必須の具体例: ChatGPT の平板化（出だしを低くし「ト」で上げる希望を含む）、ツールの平板化と長音の弱さ、エージェントは現状問題なしという扱い。
- 範囲: 四国めたん（ノーマル）を中心に、ずんだもん、話速 1.1 / 1.3 / 1.5。カタカナ・略語、数字と単位、記号、助詞、異読語・固有名詞、句読点と間、疑問文、句境界、漢字・かな、長音。ユーザー辞書、AquesTalk 風カナ、AudioQuery の調整と再計算を調べる。
- 成果物: このディレクトリの log.md（追記のみ）と、日本語 report.md（指定された五項目を含む）のみ。
- 制約: Engine を起動しない、合成しない、sudo・インストール・プロジェクト編集をしない。ローカル資料は読み取り。出典には URL/パスと確認日。未試聴の推測を事実扱いしない。
- UTC 開始時刻: 2026-10-11T07:21:00Z

## 初期計画

各単位は、調べる問いと資料群の組で定義する。公式は操作の保証に用い、自然さの規則は利用者の事例を主とする。

1. **既存原稿・道具の制約 × リポジトリとローカル配布物**: AGENTS.md、docs/spec.md §6.6・§7.1、narrate の処理・記録・時間計算、配布 Engine の構成を読み、設計案に必要な制約を整理。
2. **0.25.2 で実現可能な操作 × 固定版の公式ソース・API**: アクセント、カナ文法、平板の表現、辞書、再計算、長さ・高さ・無音・疑問上昇、英語対応をソースで確認。
3. **カタカナ・略語・長音・話者の癖 × 利用者のブログ/note/動画/Tips**: ChatGPT、GPT など、ツール、ずんだもん/めたんの具体的な調整経験を集める。
4. **数字・記号・助詞・異読語・固有名詞 × 利用者の説明/配布辞書**: 読みを安定させる規則と具体例、漢字/かなの使い分け、辞書の実践を集める。
5. **句読点・間・疑問・句境界 × 利用者の調声記事/動画/公開データ**: API に置き換え可能な手順を抜き出し、空白などの不確かな説を分離。
6. **規則の裏付けと三例の最適手段 × 複数利用者の照合・公式コードへの対応付け**: 独立した複数の経験と単独経験を区別し、版差・未確認事項・道具の仕組み案を固める。足りない領域の検索をここで補う。
7. **report 境界**: 最新計画の全研究単位完了をログへ記録して ready-to-report を返す。別途明示された report turn でログを再読し report.md を書く。

### 確かさの分類案

- 操作保証（固定版コード/API）、複数の独立利用者の経験、単独利用者の経験、実装に基づく推論、未確認を区別する。
- アクセントの「標準的な読み」とボスの好む実現を区別する。平板の核位置と各モーラの実際の pitch は同じではない。

## Unit 1: 既存原稿・道具の制約 × リポジトリとローカル配布物

確認日: 2026-10-11 UTC。Engine/合成/道具の実行はしていない。

### 資料

- `/home/apm/orca/workspaces/fuzzy6/searobin/AGENTS.md`（§表現の決まり、制作手順、環境）および依頼中に提示された機体規則。
- `docs/spec.md` §6.6、§7.1（2026-10-11、version 0.4）。
- `src/explorer/script.js` の parseLine。
- `tools/narrate.mjs` の generate、および `tools/narrate/core.mjs` の SETTINGS、generationHash、queryTiming、prefixMoraCount、anchorSeconds。
- `/home/apm/apps/voicevox-engine-0.25.2/engine_manifest.json`、配布ディレクトリのファイル一覧（読み取りのみ）。

### 確認できたこと

1. spec と script.js: `[表記|よみ]` は字幕と読み上げ文字列の分離だけ。アクセント・モーラ長・局所 pitch 指定はない。印は読み上げ文字列のコードポイント位置へ変換される。改行は読み上げから消え、日本語に接する半角空白も消える。そのため「日本語に空白を挿入する」利用者 Tips は現在の道具にはそのまま適用できない。
2. spec: 文の途中の間の専用記法はなく、意図的な待ちは文を分ける設計。話速も文単位で slow/normal/fast。声の外の lead/tail/rest と、語の発音長・句内 pause の調整は分けて考える必要がある。
3. narrate.mjs: 文全体と各印までの部分文字列を `/audio_query` に渡す。部分の moras[].text が全文の先頭と一致することを確認し、拍数に置き換える。時刻は全文 AudioQuery の音素長から計算する。`/synthesis` は enable_interrogative_upspeak=true。
4. core.mjs: Engine 0.25.2 / Core 0.16.1 に固定。SETTINGS は pitchScale=0、intonationScale=1、volumeScale=1、prePhonemeLength=0.05、postPhonemeLength=0.1、pauseLength=null、pauseLengthScale=1、24kHz mono。speedScale は文ごとの話速。
5. core.mjs: queryTiming は音素長を speedScale で割り、93.75 fps で音素ごとに丸める。疑問上昇は条件つきで 0.15 秒相当の追加母音を見込む。既存の timing と実 WAV の長さの差が 0.02 秒以上なら拒否する。局所長や pause を変更した後の最終 query で印の時刻を計算する必要がある（設計上の推論）。
6. generationHash は source、印、話者/スタイル、Engine/Core、SETTINGS、speed、upspeak を含む。将来の辞書やアクセント指定が変わった際も古い録りを区別するには、それらをハッシュの入力へ含める必要がある（設計上の推論）。現在 reading は query.kana を保存するだけなので、後段 AudioQuery 編集で変わった調声を記録しきれない可能性がある。
7. ローカル manifest は version=0.25.2、モーラ pitch、音素長、速度、pitch、intonation、volume、pause、疑問上昇、未知英単語のカタカナ変換に supported=true。配布物は凍結バイナリ/内部ライブラリ中心で、読みやすい Engine Python ソースや OpenAPI は一覧では見つからない。対応手順は公開 0.25.2 タグのソースを確認する。

### 未解決

- API の accent とユーザー辞書 accent_type における平板の数値は同じか。助詞を含めた平板/尾高の区別。
- pitch と長さの再計算順序、カナ文法、英単語設定の適用先、pause/疑問上昇の版差。
- 自然に聞こえる長音長や pitch に固定値の定石があるかは利用者側の調査が必要。

### 次の単位

Unit 2: 固定版 0.25.2 の公式ソース/API により、操作保証と平板・長音の表現を確認する。公開タグの README と tts_pipeline router の取得を開始した（URL は次単位へ記録）。

## Unit 2: 0.25.2 の調整 API の保証範囲 × 固定版公式ソース

確認日: 2026-10-11 UTC。native web で公開タグを取得し、コードの一部は urllib の上限付き読み取りでも確認した。Engine の起動・API 呼出・合成は行っていない。以下の URL はすべて `0.25.2` タグで、latest 文書の機能を混ぜない。

### 資料と操作上の所見

- S1: https://github.com/VOICEVOX/voicevox_engine/tree/0.25.2 （README、HTTP の位置づけと AquesTalk 風記法の説明）。公式の「風」記法は本家 AquesTalk と異なる。
- S2: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/app/routers/tts_pipeline.py （audio_query/accent_phrases/mora_data/mora_length/mora_pitch/synthesis）。
  - `/audio_query` は通常テキストから初期 AudioQuery を作る。**0.25.2 のこの endpoint に is_kana はない**。
  - `POST /accent_phrases?text=...&speaker=...&is_kana=true&core_version=0.16.1` はカナから accent_phrases 配列を返す。既存 query の accent_phrases を置換して synthesis へ送れる。
  - `POST /mora_data? speaker=...&core_version=...` の JSON body は **AudioQuery 全体でなく accent_phrases の配列**。長さと高さを再計算。`/mora_length` と `/mora_pitch` は片方だけ。
  - speaker は互換性上の名前で実際は style ID。四国めたん/ずんだもんでも合成と再計算は同一スタイルを指定する。
  - enable_katakana_english は audio_query と accent_phrases にあり、既定 true。is_kana=true 時には無視される。
- S3: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/model.py （AudioQuery）。
  - kana は読み取り専用で synthesis では無視。**query.kana の文字列を書き換えるだけでは音は直らない**。
  - 全体パラメータとして speedScale、pitchScale、intonationScale、volumeScale、prePhonemeLength、postPhonemeLength、pauseLength、pauseLengthScale がある。pauseLength は null で無効。
- S4: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/model.py （Mora/AccentPhrase）。
  - Mora は text、consonant、consonant_length、vowel、vowel_length、pitch。長さと pitch の編集が可能。個別モーラの音量フィールドはない。
  - AccentPhrase は moras、accent、pause_mora、is_interrogative。pause_mora=null で句末無音を付けない。
- S5: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/kana_converter.py （文法と parse/create）。
  - カタカナのみ。`/` は無音なし句境界、`、` は無音あり句境界、`_` は母音無声化、`'` は核位置、句末の全角 `？` は疑問形。全句に `'` をちょうど一つ置く。句頭には置けない。数値 pitch・長さ・任意秒 pause の記法はない。
  - `'` の前までに出来たモーラ数が accent に入る。助詞が同じ句にあるときは助詞まで含めて核の位置を考える。
- S6: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/mora_mapping.py （カナと音素の表）。
  - `チャ`、`ティ` はそれぞれ一モーラ。`ッ`、`ウ`、`イ` は別モーラ。**このカナ直指定表に長音記号 `ー` はない**。通常テキスト/辞書では長音記号を使えても、AquesTalk 風直接入力では `ツウル`、`ジイピイティイ` のような母音表記が必要（S5 と合わせた実装上の結論）。
- S7: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/tts_engine.py （予測と synthesis の適用順）。
  - accent は 1 始まり。頭高=1、それ以外は第2モーラに開始フラグ、accent-1 に終了フラグ。句の最後へ accent を置けば句内に後続の下降モーラを作らない。ただし絶対 pitch の形は予測モデル依存。
  - 長さの予測後に高さを予測。synthesis は accent を読んで高さを再予測しないので、accent だけ書き換えても既存 pitch はそのまま。核/句境界/読み変更→mora_data（長さ維持なら mora_pitch）→手動 pitch/長さ/pause→synthesis が順序。再計算は手調整を上書きする。
  - speedScale は母音/子音/前後無音/pause の長さを割る。pitchScale は pitch に 2**pitchScale を掛ける。intonationScale は有声モーラの平均 pitch からの偏差へ掛ける。0 にすると一様化するので、語の平板指定の代用にはならない。
  - pauseLength は全 pau を一律に置換し、pauseLengthScale は pau に掛ける。局所 pause_mora.vowel_length を使う場合 pauseLength=null にする。最終 pause 秒は速度でも割られる。
  - 疑問上昇 true で is_interrogative かつ最終 pitch>0 の句へ、同じ母音 0.15 秒・pitch+0.3（最大6.5）を追加。句末 pitch の変更だけとは違い、長さも変わる。disable で自動追加を止められる。
- S8: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/app/routers/user_dict.py （辞書 API）。
  - GET /user_dict は UUID→詳細のオブジェクト。POST /user_dict_word は query parameter に surface、pronunciation（カタカナ）、accent_type、word_type、priority を渡す。UUID を返す。PUT/DELETE /user_dict_word/{UUID} で更新/削除。
  - word_type は PROPER_NOUN、COMMON_NOUN、VERB、ADJECTIVE、SUFFIX。priority は0〜10、公式の引数説明は1〜9を推奨、高いほど優先。
  - POST /import_user_dict?override=... は GET と同じ種類の UUID→UserDictWord 詳細オブジェクトを JSON body として取り込む。表層形→読みだけの簡略マップではない。既存 UUID の衝突は override に従う。
- S9: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/user_dict/model.py （辞書検証）。
  - accent_type は0〜モーラ数が許容され、0を登録できる。発音はカタカナと長音記号を許容。拗音を文字数だけで数えない。surface の英字は全角正規化される。
  - 0の「平板」という用語との対応は OpenJTalk のラベル変換/公式 editor による追加照合を残す（ここでは0許容と1始まり accent を混同しない）。
- S10: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/njd_feature_processor.py （通常文/英単語処理）。
  - 未知読みの feature かつ英字だけの token をカタカナ変換し、新 feature の acc=1（頭高）としている。GPT/MCP/o1 などが必ずその経路を通るとは未確認。略語の望む読み・平板まで保証する設定ではない。
  - 英字 token 間の全角空白で生まれる pau は除去する。日本語と英語では空白の扱いが違うため「空白は常に無音」の規則には出来ない。
- S11: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/tts_pipeline/text_analyzer.py （ラベル→句）。
  - OpenJTalk label の accent_position を採用し、句のモーラ数を超える位置は句末へ clip する。句末の pau は group 境界から作られる。OpenJTalk が平板の0をどの f2 値へ変換するかはここでは見えない。
- S12: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/user_dict/user_dict_manager.py （本文取得済み、詳細未精読）。次の辞書の実践/再現性の単位で defaults、適用範囲、書込先を確認する。

### 具体例への暫定的な技術対応（自然さを試聴した結果ではない）

- ChatGPT の語の部分は `チャ / ッ / ト / ジ / イ / ピ / イ / ティ / イ` の9モーラ。提示された読みの末尾 `エト` は後続の「へと」と見られ、辞書へ含めない。句全体が「ChatGPT へと」なら11モーラで、句内の下降を避ける直接入力例は `チャットジイピイティイエト'`、accent=11。語末9へ核を置くと後続助詞が下がる可能性があり、語だけの平板化と混同しない。
- ツールは `ツ / ウ / ル` の3モーラ、「ツールを」全体なら `ツウルオ'`、accent=4 という句内下降回避の候補。アクセント訂正と長音を伸ばす操作は別。長音に当たる母音単独の `ウ` の vowel_length を調整できる。個別 volume はないので「弱さ」を長さだけで必ず解消する保証はない。
- 「チャを低く、トで高く」は頭高を直すことに加え、促音の無声性と声のあるモーラの pitch の聞こえ方の問い。核を末尾へ置く操作は平板候補になるが、「トで上がる」を核位置の3で指定するのは違う（核は下降側の位置）。必要なら再計算後に有声モーラの pitch を個別に直す。独立利用者の経験と公式の平板対応で裏付けを取る。
- エージェントに問題がないというボスの観察を変える根拠はない。語彙全体を一律平板化する案は採らない。

### 発見した利用者側の検索候補（本文はまだ検証していない）

- https://sitake8192.hatenadiary.com/entry/voicevox_long_sound 「VOICEVOXに長音を発音してもらう」、2023-12-12。長い連続母音のかすれと、ずんだもんの長音解説動画への参照が検索で見つかった。普通の「ツール」の短い長音と、叫びの何秒もの長音は問題を分ける必要がある。
- https://github.com/KEIKEI999/VoiceVoxLM にユーザー辞書の0=平板の説明が検索で見つかった。ただし「語全体を高く」の説明は正確さを別途確認。公式コードの代わりにしない。
- word_property.py という推測パスは404で、資料として利用しない。辞書の生成処理は manager へ追う。

### 未解決・確かさ

固定版コードによる**操作保証**であり、どの pitch/長さが自然かという経験則はまだ未調査。辞書0→句末核への具体的な写像、辞書の defaults/複合語結合、pitch の単位、句読点ごとの前処理、版差の由来も追加照合を残す。長音の速度による短縮は実装上明白だが、1.1/1.3/1.5で「ツール」がどれほど聞き取りにくいかは未試聴。

### 次の単位

Unit 3: 利用者の具体的なカタカナ/略語/長音/話者の調整例を読む。完了後、残る固定版仕様は補足単位で照合する。

## Plan revision 1

- 学んだこと: `/audio_query` の is_kana 非対応、query.kana が合成に無視されること、辞書 accent_type と句 accent の形式の違いは、記法案を左右する。英単語の自動補完には acc=1 の経路があり、正しい読みと正しい核の指定を分ける必要がある。
- 単位の変更: Unit 2 は「調整 API の保証範囲」として完了。平板の正確な正規化・辞書の defaults/結合・pitch 単位・句読点/空白の版差は、利用者の実例を得てから対象を絞る **Unit 6a（固定版の補足照合）** と、従来の統合 **Unit 6b** に分割する。未確認点を無理に一般則にしない。
- 派生質問: 「極端な長音のかすれ対策を普通の一モーラ長音にも適用すべきか」。元のツールの問いに必要なので Unit 3 で区別して追究する。長い叫びの表現全般の研究は範囲を広げず、必要な違いだけ記録する。
- 現在の残り単位: Unit 3（カタカナ/略語/長音/話者 × 利用者）、Unit 4（数字/記号/異読語/辞書 × 利用者）、Unit 5（句読点/間/疑問/句境界 × 利用者）、Unit 6a（平板写像/辞書適用/単位/版差 × 固定版の補足）、Unit 6b（証拠の照合/必須三例/設計案）、ready-to-report 境界、明示された別 report turn。

### 継続時の注意

初期計画と Unit 1〜2 を読み直す。現在 report.md は未作成で、全単位はまだ完了していない。書き込みはこの log.md への追記のみ。ローカル Engine は一度も起動していない。ユーザーから token threshold の通知が来たため、この単位を完了して checkpoint を要求する。

## Unit 3: カタカナ・略語・長音・話者の調整例 × 利用者の公開記事と動画説明

確認日: 2026-10-11 UTC。native web 検索と本文取得。Engine 起動・API 呼出・合成・試聴はしていない。この単位は長音の通常調整と極端な伸ばし音の別問題を区別し、英字読みの具体例を得るところまでを完了した。

### 資料と確認できたこと

- U1: https://sitake8192.hatenadiary.com/entry/voicevox_long_sound — berry8192「VOICEVOXに長音を発音してもらう」、2023-12-12。
  - 利用者の作業順は、読み修正→大きなアクセント→個別イントネーション→長さ。母音が何個も続く長い発声でかすれる例をずんだもんで紹介。母音間に「ん」を入れ、その長さを約0.010に残し、中途で不自然に pitch が跳ねる場合は挿入「ん」の高さも変えるという経験。原因の説明は著者自身が推測と明記しており、Engine の内部原因として採用しない。
  - API 対応の推論: moras に N を含む読みを用意し、再計算後にその vowel_length/pitch を変更できる。ただし **普通のツールの一拍のウを強める規則ではない**。固定値0.010はこの極端な発声の単独経験で、話速1.3/1.5への移植値ではない。
  - 著者はじゅごんの2022年の解説動画を参考に挙げている。別著者でもこの部分の証拠を独立した二例と数えない。
- U2: https://scrapbox.io/takker/VOICEVOXでは長音をワ行に差し替える — takker の公開メモ、2023-07-10/07-23 の時刻表示。
  - 長音をワ行へ替え、wの子音長を0.08〜0.15程度にするという短いメモ。sm41172195 へのリンクがある。原動画の要約であり独立した試験ではない。
- U3: https://www.nicovideo.jp/watch/sm41172195 — じゅごん「ずんだもんに『ぐえーーーー』って言わせよう【VOICEVOX解説】」。原サイト本文は取得失敗。
  - 動画説明の転載を https://www.nicozon.net/tag/ずんだもん解説/m/d および https://www.nicozon.net/search/グエー/r/d/6 の検索結果で確認。対象は「あーーーー」「ぐえーーーー」「ぎゃーーーー」、短い「あっ！」。2022-10-10追記で、動画内のワ行の案をハ行へ訂正し、ワ行はハ行が合わない場合の次案に下げている。
  - **U2だけ読んでワ行を一般則にするのは不適切**。原動画を再生・試聴していないため、詳しいハ行への変換表や長さ数値は未確認。転載の説明と本文確認済みのU1から極端な伸ばし音への適用範囲だけ採る。
- U4: https://moto-k7.hatenablog.com/entry/2026/02/03/230000 — moto-k7「VOICEVOXの紹介」、2026-02-03、Windows11/VOICEVOX0.25.1 を明記。
  - アクセントを先に直し、それで意図に届かない部分は音ごとの高さを直す。長音や無音を調整する場合は長さタブで母音・子音を別に変える。句の分割/結合、読み変更も図示。**ツールの短い長音には母音長を調整する手段が素直に対応する**（語固有の推奨値は記事にない）。API は U4 GUI 操作を S4/S7 の vowel_length/pitch と句配列へ翻訳できる。
- U5: https://fitgap.com/jp/products/voicevox — PIGNUS 後藤康浩の利用レビュー。テスト2026-04、Windows/VOICEVOX0.25.2、更新2026-05-01 を明記。
  - 「ChatGPT」のアクセントに違和感、「初心者の方」をホウと読む具体例。編集で修正し、頻出語は読みとアクセントを辞書登録する運用。**ChatGPT問題そのものはボス以外にも報告がある**が、平板の核位置やどのモーラを低くするかは記事に書かれていない。正確な数値処方の根拠にはしない。
  - 同じサイトの AivisSpeech 比較ページ https://fitgap.com/jp/products/aivisspeech にも「みなさんこんにちは」の一続き解析、区切りの必要性が出る。筆者/サイトが同じなので独立報告に数えない。関連本文の再照合は Unit5。
- U6: https://genussmittel.biz/voicevox-control-voice-change — 管理人「VOICEVOXの調声方法・イントネーション変更」、2022-03-31/07-05更新。
  - 気になる文節だけアクセント位置を動かして再生確認する実践。全体の話速・抑揚は別パネル。自然さの具体的語彙例や数値はない。本文が核を「強く発音する場所」と説明する点は言語学的な正確さが足りず、APIの核=下降位置を説明するときはS7を採る。
- U7: https://qiita.com/fwatty/items/c9655188b41b55b23459 — fwatty「ChatGPTに英語をカタカナにしてもらう」、2023-03-31。
  - 英語の専門用語をカナへ前処理する実例。ImageNet→イメージネット、SpectralNorm→スペクトラルノルム、GAN→ジーエーエヌ、SwinV2→スウィンブイツーなど。読みの決定が課題であり、変換結果のアクセントは検証していない。GAN のガン読みなど別慣習もあるので、この記事の変換を唯一の正解としない。単独著者のLLM変換例であって合成の聴取評価ではない。
- U8: https://github.com/VOICEVOX/voicevox/issues/1955 — ShimagayaSatoka のユーザー要望、2024-03-24（GitHubは公式 repository だが当該内容は利用者の一次経験/提案）。
  - Speaker→スピーカー、talk→トークを望む一方、IAA/ISO は文字列として読ませたいという相反する要求を明記。英単語化と英略語の文字読みは別に管理する理由が具体的。単語間スペースをポーズと扱わない希望もある。現在0.25.2では S10 の未知英語処理があり、2024年の「できない」を現版全体へ一般化しない。
- U9: https://github.com/noir55/voicevox_cli_client — noir55 の CLI client README。動作例はEngine0.14.6、読み取り時main。
  - 置換リストで [Pp]ython→パイソンなどの表記ゆれをカナへ統一。表層形/カタカナ発音/核/優先度の四列で辞書を一括登録し、rubyの核を1→0へ変更する例。英文カナ化はCMU辞書も使い、4文字以上に限るのは短い英単語はVOICEVOXのほうが自然という作者の印象。
  - **4文字以上ルールはこの利用者の好み/旧版の経験で、Engine標準規則ではない**。置換と辞書を別に持つ実装例として設計案に役立つ。現版 API 操作の根拠はS2/S8を使う。
- U10: https://www.youtube.com/watch?v=W_ORlMmRJlE — 「【実演あり】VOICEVOXでよい声を作る方法＆コツなどを10分で解説 ～イントネーションやテンポの調整など」。検索の動画説明で02:50「音の長さの調整」を確認したが、openはサイトのフッターしか得られず、具体例・手順は取得/試聴できていない。定量処方の出典には使わない。
- U11（次の単位への候補）: https://github.com/kajidog/mcp-tts-voicevox/blob/main/README.ja.md — 利用者ツールがカタカナに核記号を入れる独自notation、ユーザー辞書 API、句編集を公開。VOICEVOX本来のカナ仕様と混同しない。Unit6bで記法案の参考にするなら実装を追加照合。
- U12（次の単位への候補）: https://wikiwiki.jp/voicevox/調整ノウハウ — VOICEVOX協同組合の利用者Wiki、2021-10-19更新。は/へ、短い行頭句の具体例が検索/取得結果に出る。Unit4/5で本文を詳しく読む。

### この単位で得た規則と確かさ

1. 頻出の英字専門語は、意図するカナ読みとアクセントを語彙として管理する。かなへ置換する実装/利用例はU7/U8/U9、辞書運用はU5/U9にある。ただしGPT/MCP/LLM/API/AI/o1個々の自然な核について一致した複数利用者の具体値は見つからなかった。
2. ChatGPT のアクセント違和感は0.25.2のU5が具体的に裏付ける。一般的な「核を直す→音ごとのpitch」の順はU4とS公式使い方でも確認できる。ChatGPTを平板にする数値はUnit2からの技術推論で、利用者多数の定石と偽らない。
3. 普通の短い長音は母音の長さを直せる（U4、S4/S7）。長音を母音字で書くことは direct is_kana の構文上必要だが、通常テキストでツール→ツウルにしただけで音が長く強くなる保証は得られない。0.25.2の読みがすでにツウルなら、同じモーラ列の書換えだけを解決策にしない。
4. U1/U2/U3の子音挿入は極端な長音表現に限る。互いに参照関係があり、独立した三人の検証と数えない。ワ行という古い要約に後日ハ行へ訂正があり、Tipsの改訂日を追う必要がある。
5. 話速1.3/1.5で長音が短くなる実装はS7で保証されるが、具体的な聞き取り低下や何倍伸ばすべきかは未確認。母音長の固定値や倍率は全話者共通の定石として提示できない。
6. 四国めたんノーマル/ずんだもんに固有で、語型に一般化できるアクセントや弱長音の処方は今回の利用者資料から得られなかった。極端な長音のずんだもん実例はあるが、めたんへの移植やCore0.16.1での再現は未検証。歌唱/NEUTRINO/CeVIO資料はトークEngineへ混ぜない。

### 未解決

- GPT/MCP/LLM/API/AI/o1の核の共通規則、エージェントの標準核の調査は得られず、必須例はボスの好む読みとして設計する。
- 「母音で書くと長音が安定」「速いと特に弱い」という利用者側の具体的な比較は未確認。以後の照合単位で補足検索を有限に行い、出なければ未確認として報告。
- 動画の原本文・字幕が得られないものは、説明の確認範囲を超えて内容を推測しない。

### 次の単位

Unit 4: 数字・年・単位・小数・範囲・記号、は/へ、異読語・固有名詞・漢字かなの選択、配布辞書を利用者の具体例で調べる。優先候補はU12と辞書配布記事。現在Unit1〜3完了、report.md未作成。

## Plan revision 2

- 学んだこと: 語彙固有の定量Tipsは一般的な調声紹介より少なく、極端な長音の資料には原動画→利用者メモ/記事という参照関係と後日訂正がある。「何人が同じ説を記載」よりも根拠の独立性と対象発声を照合する必要がある。
- 変更: 残り単位は維持。Unit6bに、長音Tipsの参照関係と改訂の照合、略語個々のアクセントについての限定補足検索を含める。語数を増やすだけの網羅検索はしない。
- 派生質問: 「Tipsの複数掲載を独立した経験として数えてよいか」。確かさDの評価に必要なので現在追究し、U1/U2/U3は参照のある一系列として記録した。
- 現在の残り単位: Unit4（数字/記号/助詞/異読語/辞書 × 利用者）、Unit5（句読点/間/疑問/句境界 × 利用者）、Unit6a（平板写像/辞書適用/単位/版差 × 固定版補足）、Unit6b（独立性/補足検索/必須三例/設計）、ready-to-report、別の明示された report turn。
- token threshold の通知を受けたため、Unit3を完了・追記した時点でcheckpointを要求する。次の単位は次turnで始める。

## Unit 4: 数字・記号・助詞・異読語・固有名詞・配布辞書 × 利用者の具体例

確認日: 2026-10-11 UTC。native web の本文と検索、公開 GitHub の bounded urllib 読み取り（各262144 bytes以内、timeout20秒）。Engine 起動・API 呼出・合成は一切していない。数字の読み、曖昧語の置換、辞書登録の粒度について具体例を得て、この単位を完了した。

### 資料と帰属する所見

- U12（既出、本文精読）: https://wikiwiki.jp/voicevox/調整ノウハウ — 利用者Wiki、2021年の初期版 Tips。
  - `やっと部屋に入れる` はイレル、`やっと部屋にはいれる` は助詞としてワを含むワイレルとなる例。`やっと部屋にハいれる` / `やっと部屋に派いれる` でハイレルにする修正を明示。単漢字/カタカナを使うと意図する音になる場合があるという経験で、ひらがなへ全部開くのが常に安定という説への反例。
  - 本文は「は/わ、え/へ」を題にしているが、実例はハの誤解析だけ。へ→エの語固有実例まで確認したことにはしない。現0.25.2で同じ誤解析が起きるかは未検証。
  - API への対応案: 今の記法なら `[入れる|ハイレル]` の局所置換で人の意図を保持。これは原例からの設計推論であり、置換後の句/核は別に確認する。
- U13: https://www.fmcent.com/ブログ/技術部ブログ/voicevox-単語登録が反映されない場合の暫定対処法/ — FM cent. 水谷夏樹、2022年ごろの実験記事（本文に2022-02-28公式postを引用）。
  - 若木町→ワカキチョオ、中山→ナカヤマを望むが、初期読みにワカギマチジュウヤマ。辞書登録だけでは前後の文次第で効かず、priority5→7で変わらず→9でワカキチョオナカヤマになったという具体的経験。なお一つの句へ結合されたので、「の」の追加/句分割も必要だった。
  - 読みを正字のチョウより発音のチョオで登録する実例。これだけで全語のオウをオオへ変える普遍則としない。
  - `白石` をシロイシに全体登録すると人名のシライシを壊すため、`白石町`→シロイシチョオ、`白石平野`→シロイシヘイヤ、`白石警察署`→シロイシケエサツショのように長い語で登録。優先度を初めから最大にせず、効かない文で上げて確かめる運用。
  - API はS8のPUT/POSTで現在もpriorityを指定可。priority9はこの地名/文の単独実験の結果で、ChatGPTなど全語の定数ではない。UIに優先度がないという記述は2022年当時であり、現版GUIの欠点としない。
- U14: https://note.com/natrium_0807/n/nff7c41677729 — ナトリウム「VOICEVOXで自然な音声を作るために気をつけていること」、2024-05-15。自作朗読のメイキング/動画チャンネルも示す利用者。
  - `中日` をナカビの意味で使ったがチュウニチになる経験。`髙橋` 等の特殊字が読点へ置き換わる経験。人名・熟語は文全体で読み確認し、頻出固有名詞は辞書登録。`[中日|ナカビ]`、`[髙橋|タカハシ]` は現原稿記法へ翻訳した案。すべての異体字が必ず読点になるとは言わない。
  - `ところ用途` が一語に繋がる例、`「魏志倭人伝」を` の閉じ括弧後に不要な読点が入り助詞前で休む例も確認。句境界とpauseはUnit5に持ち越す。
  - `インフィニティ` 末尾のティが短く感じるので、読み側を`インフィニティー`にする単独経験。**普通の長音に近い利用者の具体例がUnit3を補足**。元々長音がない表記にモーラを足す話で、すでにツ/ウ/ルがあるツールへさらにウを足す推奨ではない。最後の小母音カタカナすべてを一律に伸ばす標準読みでもない。
- U15: https://shorty.mazenture.com/articles/zatsugaku-shorts-koe-erabikata — Shorty製作者側の記事、実測日2026-09-29、青山龍星。記事はEngineの版を明記していない。製品宣伝を兼ねる単独検証で公開生queryは未確認。
  - 表に、体長2m→タイチョウニエム（修正2メートル）、100g→ヒャクジー（100グラム）、5℃→ゴドシー（5度）、1/3→イチ、サン（3分の1）と具体的な読み・修正を掲載。
  - 一方、1,200年前、紀元前300年、18世紀、3.14、10km/時速120km、DNAは意図どおりと報告。全部の数字/単位が苦手とは言えない。日本橋→ニホンバシであり大阪のニッポンバシを指すときは指定が必要とする。
  - 本リポジトリなら `[2m|2メートル]`、`[100g|100グラム]`、`[1/3|サンブンノイチ]` 等に対応（設計推論）。℃を度と省くかセッシゴドと厳密に言うかは文の意味に合わせる。記号の意味はEngineに任せず作者が決める。mをすべて置換すると変数mや英単語を壊すので、数値+単位を型として扱う。
- U16: https://note.com/ishibashi_check/n/n30d7d9c76fd9 — 石橋「VOICEVOXの誤読を、音声を作る前に見つける方法」、2026-09-05、Engine0.25.2を明記。チェックツール販売を兼ねる単独報告、生queryの配布は本文で未確認。
  - 七五三→ナナヒャクゴジュウサン（希望シチゴサン）、八街→ヤマチ（ヤチマタ）、一二三さん→ヒャクニジュウサンサン（ヒフミ）、月見里→ツキミサト（ヤマナシ）、栗花落→クリハナオチ（ツユリ）という例。人名は実際の本人の読みで決めるため、全員にこの読みと自動判定しない。
  - 二〇二一年→ニセンニジュウイチネン、昭和五十六年→ショオワゴジュウロクネンは正しく読めたと報告。「漢数字は必ず一字ずつ誤読」は反証される。同じ版でも前処理と文脈が違えば変わる可能性は残る。
  - 全文queryのkanaを見て、姓+肩書き/敬称（例茂木大臣）も別に抜き出して確認する運用。単語のみと全文のどちらか一方だけでは不十分。アラビア数字ならどの経路でも安全という本文の強い表現は保証として採らない。
- U17: https://note.com/samune_labo/n/na7e5a9a90c29 — AI×SNS完全自動化研究所、2026-09-23、春日部つむぎ/話速1.4、Engine版不明。自動動画工程と読み替え辞書1,810語の体験。ツール販売を兼ねる。
  - 著者のひらがな置換読み「はち」がワチになる37件がカタカナハチにして消えたと報告。`2倍`→にばいの置換が`2倍速`に干渉する例もある。小数点の後に漢数字の一二ではなくカタカナイチニを書く案。
  - **注意**: 記事の「ひらがな辞書登録がエラーなく成功」はS9のEngine API（カタカナ発音必須）と一致しない。前処理の読み替え辞書、エディタがかなを変換するUI、Engine辞書を区別すべきで、APIがひらがなpronunciationを受理する根拠にはしない。APIは最初からカタカナを要求する。
  - 63.3→ロクジュウ/サンテン/サン、3001→サンゼン/イチ等を別の数と断定するが、アクセント句が分かれたことだけでは数の誤読の証拠にならない。また0.12→レイテンジュウニは小数部を一桁ずつにしない不適切な読みの可能性で、10.2になるという説明は数値の等価関係として支持できない。**小数部を各桁で読む意図と、句境界の自然さを検査する契機としてのみ採用**。数値が変わるEngine不具合としては採用しない。
- U18: https://github.com/usapopopooon/voicevox-discord と
  https://raw.githubusercontent.com/usapopopooon/voicevox-discord/main/bot/features/dictionary/builtin_readings.py 、
  https://raw.githubusercontent.com/usapopopooon/voicevox-discord/main/bot/features/dictionary/text_processing.py — 利用者Botの公開実装/main（read時点）。native raw取得失敗後、urllib読み取りで本文確認。辞書~65KB、処理~31KB。
  - 配布されている**前処理の読み替え辞書**であり、Engineへ直接importできるaccent付きUserDictWord JSONではない。月極→ツキギメ、相殺→ソウサイ、㎏→キログラム、㎐→ヘルツ、㌔/㍉等をUnicode分解で展開する具体例。accent/pitch/音素長の保証は含まない。
  - text_processingは長いキーを先に並べた正規表現で置換。ユーザーの読み替えを先に適用し、それからbuilt-inを適用するコメントあり。スラング/顔文字/英語題名等を別群に管理。**デッキ辞書の長い語を優先し、用途ごとに語彙を分ける設計の実例**。公開データがすべて正しい標準読みという裏付けにはしない。今回この辞書をダウンロード保存/取り込み/実行していない。
- 補助読了: https://tomonomonado.hatenablog.com/entry/2024/02/02/215856 — 英語と無線LANの前処理。単語ごとの空白で不要な無音が入る旧版の経験/引用を含む。英語の空白は現S10のpau除去とも関連するので、Unit5の版差に回す。
- 未採用の検索候補: https://note.com/zeronin_keiei/n/n40f71dee7a85 は一般TTSの数字記号を展開する記事で、VOICEVOX/他Engineの識別が弱い。https://crystal-method.com/blog/voicevox-how-to-use/ は一般ガイドで具体的な自身のquery実験はない。U15/U16のほうが具体的なので規則の独立根拠の人数を水増ししない。

### この単位で採る規則と強さ

1. 「読みを確定するため全部ひらがな」は採らない。は/へが助詞として解析される場合、語だけカタカナにする（U12具体例、U17の置換工程で独立した類似事故。ただしEngine版/話者/用途が違う）。助詞そのものを発音カナ直指定するときはワ/エで書くという技術対応はUnit2の読み経路とボス提示例による。
2. 曖昧語は出現文ごとに読み置換、頻出固有名詞は読み+核を登録（U5/U13/U14、複数独立の実践）。異読語`中日`、異体字`髙橋`、人名/地名の読みは内容に応じて明示。全国共通に唯一の読みを決めない。
3. 辞書は`白石町`のように意味が確定する長い表層形を登録する。反映しないときのみpriorityを上げ、元文で確認。9はU13の一例、全語へ強制しない。本文が望むアクセント句になるかも別に検査。
4. 単位・分数記号を語へ展開する（U15の一検証+U18の配布実装、対象語は完全には一致しない）。`2m`→2メートル、100g→100グラム、1/3→サンブンノイチ。年/月日/小数/範囲を全部数値型一つで処理せず、意味を選ぶ必要がある。
5. 小数部は各桁の読みを明示する案（例 `[0.12|レイテンイチニ]`）はU17の経験を元にした設計案。U15では3.14が正しい。小数が一般に誤読されるという強い結論は採らない。年もU16では漢数字のままで正しく読めた。
6. 長音表記を足す具体例インフィニティ→インフィニティーはU14単独経験。ツールのウの長さ不足は既存の長音モーラの長さを直す問題として区別する。

### 未解決・残す限界

- 数字の範囲（1〜3/1-3）、科学単位/複合単位、月日の慣用読み、o1などの数を含むモデル名について、Engine0.25.2とめたん/ずんだもんの具体的比較はまだ得られていない。範囲をイチカラサンと読むのか、番号イチノサンなのかは内容が決める設計方針として示し、利用者の定石と捏造しない。
- 単語・数字の単独queryと全文queryで読みや句が変わるため、静的辞書だけで全問題を解決できる保証はない。Engineを起動していないのでこの機械での再現は未確認。
- U15/U16/U17は実測を標榜するが生queryと独立再現がなく、販売記事であることを含め単独自己報告に分類。語型の具体的修正を参考にしつつ、内部原因や「安全」をそのまま断定しない。
- accent付きEngine用の大規模な専門辞書配布は今回得られていない。U18とU9は前処理/登録ツールの実例。辞書の仕様保証はS8/S9で別に行う。

### 次の単位

Unit5: 句読点・空白・間・疑問・句境界を利用者資料で調べる。優先資料はU14（読点長0.10〜0.15、括弧後pause、しているの結合）とU12（短い行頭句）、U5（挨拶の分割）、疑問文の具体的調整例。今回threshold通知を受けたため、ここでdurableな完了記録を残しcheckpointを要求する。残りUnit5、6a、6b、ready-to-report、別report turn。report.mdは未作成。

## Unit 5: 句読点・空白・間・疑問・句境界 × 利用者の調声と前処理の実例

確認日: 2026-10-11 UTC。native web の検索・本文取得を中心に、既出の利用者資料を再読した。Engine 起動・API 呼出・合成・音声試聴はしていない。句境界と無音の別操作、pause の具体値の帰属、文末を調整する利用者例まで確認して、この単位を完了。

### 資料・発言の帰属と評価

- U14（既出、全文再照合）: https://note.com/natrium_0807/n/nff7c41677729 — ナトリウム、2024-05-15。
  - `一見したところ用途不明…` が `ところ用途` という一つの句になって不自然なので、区切りを直す具体例。`〜している / 〜していた` は初期状態でシテ／イルに分かれやすく、繋ぎ方を複数試して文になじむものを選ぶ。細かい代替パターンは画像で、テキストからは核位置の全値を確定できない。無音を加えるべきだとまでは言っていない。
  - 読点は入力直後0.30〜0.50程度と述べ、作者自身は読む速度に合わせ0.10〜0.15程度へ短縮。これは**個人の調整値**で、Engine が読点を常に0.10〜0.15秒にする仕様ではない。値が最終WAVの実測秒なのか編集バーの長さなのかは本文からは確定しない。S7では speedScale で割られることを別に説明する。
  - `「魏志倭人伝」を` で括弧の後、語と助詞「を」の間に不要な読点由来pauseができるため、そのpauseを削除。引用符・括弧を原稿から一律に消すという処方ではなく、その箇所で一拍置くのか続けるのか判断する。
  - 大きなアクセントを直した後、各音の高さを直す。一つの句のpitchをまとめて上下させ、前後の句の高さを合わせる操作も紹介。APIでは全有声モーラのpitchを同じ差だけ動かす案へ翻訳できるが、差の定量値は記事にない。
- U12（既出、残りを精読）: https://wikiwiki.jp/voicevox/調整ノウハウ — 利用者Wiki、2021年初期版。
  - 行頭の短い `また、` / `なお、`、`実は、短い語句が苦手です` の「は」が無音のようになる例。語の前に `、っ、` を足すと出る場合があるとし、v0.6.0以降は前後無音の長さでも改善すると記す。
  - **旧版の回避策**として記録し、現Engine0.25.2で原稿の頭に促音を自動挿入する定石にはしない。今回の道具のprePhonemeLength=0.05で起きるか未試聴。再発するときにまず前後無音を比較する候補。v0.7.0でCore向上による金属的ノイズ改善も記され、症状は版依存。
- U5関連ページ（既出）: https://fitgap.com/jp/products/aivisspeech — PIGNUS後藤のVOICEVOXとの比較。
  - VOICEVOXの `みなさんこんにちは` が一続きになり、句点を入れて区切ったと報告。AivisSpeechの感情・記号処理の説明はVOICEVOXの仕様へ転用しない。U5のVOICEVOXレビューと同じ作者/サイトなので独立した二人とは数えない。
  - APIで間を作りたくない挨拶なら、無音なしの句分割も選べる（S5/S7に基づく設計推論）。句点挿入と同じ音になると保証するものではない。
- U19（Unit4補助読了資料を正式登録）: https://tomonomonado.hatenablog.com/entry/2024/02/02/215856 — tomonomonado、2024-02-02、VOICEVOX/COEIROINKの前処理スクリプト。
  - U20を引用し、`アイ ラブ ユー` の単語間に最大約0.5秒の無音が入りすぎると説明。前処理で空白を作らず `この無線LANを`→`この無線ランを` と繋げる方向でスクリプトを変更。空白由来の無音の経験は引用部分なので、U20とは独立の発見に数えない。COEIROINKのendpointや設定をVOICEVOXへ混ぜない。
- U20: https://qiita.com/hajime_y/items/18ea318a94aaf78996a6 — hajime_y、2022-07-08投稿/07-11更新。U19の原記事。
  - 英単語→カナの辞書変換でスペースを挿入し、単語間に約0.5秒の不要な無音が入るため、APIの `accent_phrases[].pause_mora.vowel_length` が0.2を超えたとき0.2へ抑えるコードを掲載。句読点も短くなるが作者の早口プリセットでは問題を感じないという個人の経験。
  - 「無音を足す/空白を取り除く」と「既にqueryにあるpauseを短くする」の実装例。0.2は固定の普遍推奨値ではない。コードのcustom speedScaleが最終値を決め、S7の除算を踏まえると0.2というフィールド値とWAVの0.2秒は必ずしも等しくない。
  - U19/U20は**カタカナへ置換して入れた空白**の話。S10の英字token間のpau除去は別経路なので、現版で両方が同じ振る舞いだと断定しない。今のscript.jsは日本語に接する半角空白を消すため、この旧前処理事故はそのまま移植されない。
  - Unit4への補足: `+ / ＋`→プラス、`-`→マイナス、`= / ＝`→イコール、`No.2 / No2`→ナンバー2を前処理する公開例。マイナスとしての-と範囲/番号としての-は意味が違うので、この全置換をそのまま数学/モデル名の一般規則にはしない。
- U21: https://note.com/sss_aa/n/n35180a834ae4 — sss aa、2026-07-11。自作改造エディタで小説を朗読している利用者。
  - 括弧による不要pauseを自動削除したところ、強調の引用符による意図的な「ため」まで消して棒読みになった経験。括弧類と引用符類を区別し、処理を行ごとにON/OFF、手調整した行を自動処理から保護したと報告。**pauseを機械的に全削除する案への具体的反例**。
  - `？` の語尾が上がらない場合に疑問形を自動設定。言い切り文末・読点前を少し下げ、文後半を低くする「ナチュラル化」を独自実装したと述べる。Engine標準で同名機能があるとは言わない。値と実際の実装は本文にない。語彙の平板と文全体のpitch勾配は別に考える設計案へ繋がるが、全原稿へ自動適用する推奨にはしない。
  - `インフィニティ` の句末ティ/ディを伸ばすなどを「コミュニティのノウハウ」から自動化している。U14と同じ例なので、参照先未判明の時点で独立した二人の新しい比較実験には数えない。
  - 新しい補足例として、行頭の `絶対` が「でったい」に聞こえるのでz子音を伸ばすという処理。原因の一般性と定量値は未検証。ツールの母音の長さ不足と混同しない。
  - 公開実装として https://github.com/qwe339/voicevox-ai を紹介。本文の自己報告以上の裏付けに使うならUnit6bで対象ファイルを限定して読む。今回はリポジトリを取得/実行していない。
- U22: https://note.com/tsuki_kotoba/n/n22e41cdf7529 — RE-NO、2025-08-02。
  - `こんにちは。今日は晴れていて、気持ちがいいですね。` と読点が多い版、`このアプリは、誰でも無料で使えます。` と語ごとに読点を置く版を比較する説明。句読点を入れすぎると切れ切れに感じるという単独の入門記事。
  - 本文の「読点は0.1〜0.15秒」という**仕様の断定**は、U14がその値へ手調整するという記述とS7の予測/速度依存に合わないため採用しない。記事は版/話者/生query/測定を示さず、ダッシュや三点リーダーの秒数も保証されない。
- U23: https://note.com/claudecodevideo/n/n381435083271 — ClaudeCodeで動画制作を自動化する人、2026-05-12。
  - ずんだもん `〜なのだぞ` の語尾が上がるので意図的に下げると落ち着くと述べる。ただし「prosody指定」としか書かず、APIコード・Engine版・スタイル・値はない。Engine0.25.2にprosodyという独立フィールドは見つかっていない（S3/S4）。**ずんだもん全体の癖や、そのまま使えるAPI処方の証拠にしない**。
  - 話速1.08/抑揚1.35が良い、1.3は聞けないという作者の好み/統計主張も、ボスの1.3を変更する根拠ではない。queryや比較条件の公開がない。
- U24: https://hiroboonext.net/voicevox-zundamon-tuning-guide/ — ずんだもん入門記事、検索では2026年の更新、本文はEngine版不明。
  - `？`で疑問上昇、言い切りは下げる、全角空白で間を作るとの一般的説明。GUI記述や無声化説明に曖昧さがあり、操作保証はS2〜S7に置く。特に全角空白の効果を任意秒pauseの仕様にしない。具体queryを伴う個人の比較ではないため、独立経験の人数へ加算しない。
- U25: https://hitorinezumi.cloudfree.jp/wp/20220406-1/ — ひとりネズミ、2022-04-06/2023-10-04。
  - 四国めたんの `よろしくお願いします。` は作者にとって初期状態が自然だったが、末尾「ス」の母音uを伸ばすと「ますー」になり違和感という作例。音声を試聴していないが調整対象の本文は確認。**全語の母音を一律に伸ばすのが自然さの改善ではない**という単独の好みの例。めたんの不具合の報告ではない。
- 補助・未採用: https://note.com/page10/n/n1269acc3d56e （ぽぽろ、PowerPoint音声化ツール、検索では2025年ごろ）にpauseLength/pauseLengthScaleを扱うコードがあるが、対象語への具体的な好ましい値の聴取比較は確認できず、今回は自然さの定量根拠に使わない。
- 補助・未採用: https://note.com/aki_moonfuyusun/n/n49a7cecfcb24 は一般的な核/疑問文調整ガイドであり、語固有の比較/生query/版は見つからなかった。https://ai.essential-navigator.com/news/voicevox-high-quality-voice-guide はU14/旧公式issueと同じ説明を含むまとめで、独立した利用者の経験へ数えない。
- S13（操作の来歴確認）: https://github.com/VOICEVOX/voicevox_engine/issues/222 — Hiroshiba、2021-12-06。末尾を伸ばして追加部分を高くする自動疑問上昇の提案。現在版の数値・条件の保証は0.25.2タグS7を使い、この旧issueを現版の未対応の根拠にしない。
- S14（手段の確認のみ）: https://voicevox.hiroshiba.jp/how_to_use/ — 現在の公式使い方。疑問文自動調整が語尾を上げる説明を確認。latestのGUIの実験的機能分類をEngine0.25.2 HTTP APIのendpoint仕様と混同しない。

### APIへの具体的な翻訳と採る規則

1. **区切りを直すだけならpauseは必須ではない。** 例 `ところ/用途` はmoras配列を二句へ分け、それぞれaccentを決めてmora_dataへ渡す。AquesTalk風は各句に核記号を置いた上で `/` が無音なし、`、` が無音あり（S5）。もともと二句だったものを結合する場合も核を決め直し再計算する。U14/U4がGUIで区切りを直す実践、S5/S7がAPI手段の保証。具体的な核値は文と希望による。
2. **名詞と助詞の間など不要な間は、その句のpause_moraをnullにする。** `「魏志倭人伝」を` の例。句境界まで消すかは別判断で、nullだけでも無音は消える。新たなpauseを入れるにはpause_moraが必要で、nullの句にpauseLengthだけ指定しても追加されない。S4/S7に基づく技術推論。
3. **読点が長すぎるとき、まず局所pause_mora.vowel_lengthを短くする。** U14の0.10〜0.15、U20の最大0.2はその利用者の基準。全句を同じ長さへ置換したい場合はpauseLength、比率ならpauseLengthScale（S3/S7）。局所値を生かすにはpauseLength=null。希望WAV pauseがt秒なら丸め前の値は `t * speedScale / pauseLengthScale`。これは速度依存の式であり、試聴済み定石の秒数ではない。
4. **空白は作者が秒を指定する手段にはしない。** U20旧版カナ前処理では無音が長すぎ、U19は空白挿入を取り除いた。S10の未知英語処理と今のscript.jsの空白除去があるため、半角/全角・英字/カナ・Engine/Core版・前処理で違う。固定版前処理の句読点一覧は次単位へ持ち越す。
5. **疑問はis_interrogativeとsynthesisフラグの二段を記録する。** U21の自己報告と公式S14、固定版S7の組合せ。AquesTalk風では句末 `？` を使える（S5）。`is_interrogative=true` と `enable_interrogative_upspeak=true` なら条件付きで最後の母音を追加し高くする（Unit2の数値参照）。手でpitchを決めるならフラグfalseで二重の上昇を避ける。文末を下げるときは自動疑問追加を止めて、最後の有声モーラのpitchを編集する。固定の下降量は得られなかった。
6. **句読点や括弧の全自動削除を避け、個別に意図を持たせる。** U21は一括削除による失敗を自分の例として報告。今のspecでは演出の待ちは文を分けlead/tail/restへ置き、今回のpause編集案は発話の自然さを調整する操作として扱う。字幕の括弧を保持したまま読み側だけ変える現記法も候補。
7. 語尾が上がる/下がる傾向と語彙の平板は別。U23のずんだもん語尾の話には版/スタイル/数値がなく、四国めたん/ずんだもん全般の癖の認定はまだできない。U25ではめたん初期状態が自然という反対の個人観察もある。

### 未解決と証拠の限界

- `、` / `。` / `！` / `？`、半角と全角の空白を通常テキストが何へ正規化するかは、0.25.2の実装と依存OpenJTalkの補足照合が必要。文字ごとに固定秒が割り当てられているという利用者記事は保証としない。
- 疑問文・言い切りの自然な末尾pitchに、独立した多数の利用者が一致する定量値は得られなかった。上げる/下げるという方針とAPI操作は書けるが、全疑問を同じ上昇量にする推薦はできない。
- 「〜している」の核の具体的な候補はU14の画像にあり、本文からの値の再構成はしていない。原図未確認として記録し、API例へ勝手な値を与えない。
- U21は公開forkを挙げており、調声補正の実装に具体的な上限・値・再計算順序があるかが新しい検証候補。元のAPI再現の問いに必要な部分だけUnit6bで限定追究し、改造エディタ全体の調査には広げない。

### 次の単位

Unit6a: 固定版の補足照合（辞書accent_type=0→助詞込みの句末accent、辞書defaults/適用範囲、pitch単位、句読点/空白の処理と版依存）。続いてUnit6b: 独立性の整理、有限の略語/長音補足、必須三例への回答と道具の設計案。今回threshold通知を受けたため、ここで完了記録を追記してcheckpointを要求する。report.mdは未作成。

## Plan revision 3

- 学んだこと: 読点長の0.10〜0.15が「利用者の手調整」から「Engineの仕様」へ変わって書かれる記事があり、数字の一致だけで複数実験の合意と扱えない。U19はU20の無音の経験を引用し、U21もコミュニティTipsの再実装と明記する。参照関係が確かさに直結する。
- 変更: Unit6a/6bを維持し、Unit6bの対象資料へU21の公開fork（qwe339/voicevox-ai）を追加。ただし有限の関連ファイルの読み取りだけで、実行・インストール・改造はしない。
- 派生質問（現在追究）: 「不要pauseの一括削除は自然さを損なうか」。U21の具体的な失敗例があるため、辞書/原稿の仕組みに個別ON/OFFと手調整の優先を含めるための根拠として採用する。全自動ナチュラル化の品質評価は元の範囲を超えるため保留し、承認後の少数比較の推奨へ回す。
- 現在の残り単位: Unit6a（固定版補足）、Unit6b（証拠独立性/有限補足/三例/設計、公開forkの関連実装確認を含む）、ready-to-report、別の明示されたreport turn。

## Unit 6a: 平板の写像・辞書の適用範囲・長さ/高さ・文字正規化 × 固定版補足コード

確認日: 2026-10-11 UTC。log.mdを再読してPlan revision 3の次単位を実施した。native webと上限付きurllib読み取り（各131072〜524288 bytes、timeout20秒、有限のファイル集合）で照合。Engine起動・API呼出・合成・依存インストール・他ファイルの書込みはしていない。threshold通知を受けたので、この単位を完了して記録した後にcheckpointを要求する。

### 資料と確認した事実

- S12（既出、精読）: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/user_dict/user_dict_manager.py
  - ユーザー辞書は保存先のuser_dict.jsonへ永続化し、同梱default.csvと合わせてOpenJTalk用にコンパイル、pyopenjtalkのグローバル辞書へ適用する。**話者別でも文別でもデッキ別でもない**。登録/更新/削除/importはいずれも保存と再適用を行う。
  - importは既存辞書との**マージ**。override=trueでは同じUUIDを取り込み側で上書き、falseでは既存側を残す。表層形が同じ別UUIDはこの処理では重複として除かれない。importだけではデッキ切替時に旧デッキ語彙が消えない。
  - GET /user_dictの詳細モデルとディスク保存形式は完全に同じではない。保存形式はcostを含み、APIのpriorityへ変換する。保存ファイルをそのままHTTP importへ渡すという設計をしない。現APIはS8/S9の詳細オブジェクトが根拠。
- S15: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/voicevox_engine/user_dict/user_dict_word.py
  - POST/PUTでword_typeを省略するとPROPER_NOUN、priorityを省略すると5。単語生成時のaccent_associative_ruleは `*`。COMMON_NOUN等の品詞も選べる。PUTは指定UUIDの単語を作り直すため、省略値が「既存値を保持する部分更新」とは限らず、必要な品詞/優先度を明示するのが再現性のある運用。
  - priorityを品詞別のcost候補へ変換し、高いpriorityほど低いcostになる。元の文脈と品詞コストに関係するため、優先度を最大にしても望む句分割やアクセントを直接指定する操作にはならない。
- S16: https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/pyproject.toml および https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.25.2/requirements.txt
  - Engine 0.25.2タグはVOICEVOX/pyopenjtalkのcommit `74703b034dd90a1f199f49bb70bf3b66b1728a86` を参照。pyproject内のproject.version表記には自動管理のTODOがあり、タグやローカルmanifestの代わりにそこからEngine版を推定しない。
- S17: https://raw.githubusercontent.com/VOICEVOX/pyopenjtalk/74703b034dd90a1f199f49bb70bf3b66b1728a86/.gitmodules と https://api.github.com/repos/VOICEVOX/pyopenjtalk/git/trees/74703b034dd90a1f199f49bb70bf3b66b1728a86?recursive=1
  - 当該pyopenjtalkのOpenJTalk submoduleはVOICEVOX/open_jtalk commit `d2a2cbfcbd69abc74993ed8bab3fabc0111c9727`（treeはtruncated=false）。この固定commitを次のラベルコードの照合に使った。upstreamの最新masterを0.25.2の保証に混ぜない。
- S18: https://raw.githubusercontent.com/VOICEVOX/open_jtalk/d2a2cbfcbd69abc74993ed8bab3fabc0111c9727/src/jpcommon/jpcommon_label.c
  - `/F:` の句ラベル第2項は、句のaccentが0なら **count_mora_in_accent_phrase（句全体のモーラ数）**、それ以外ならaccentを出力する（本文770行付近）。/A:/E:/G:でも同じ正規化がある。S11のEngineはそのF2アクセント位置を読む。これで**OpenJTalkで句が平板0のままなら、APIのaccentは助詞も含めた句末モーラ数になる**という対応を固定依存コードで確認できた。
  - `？` の発音マークを受けると直前の句にquestion emotion flagを付けてshort_pause_flagを設定する。句頭のquestionにはwarningで対象がない。記号を置くだけで全文脈に必ず望む疑問調になるとはしない。
- S19: https://raw.githubusercontent.com/VOICEVOX/open_jtalk/d2a2cbfcbd69abc74993ed8bab3fabc0111c9727/src/njd_set_accent_type/njd_set_accent_type.c
  - 付属語の結合規則F1は核を変えず、F2は平板時に新たな核を置く、F3は非平板時に置く、F4は無条件に置く、F5は0へする。名詞結合にもC1等がある。**単語辞書のaccent_type=0が、どんな後続語との結合後も句の平板を保証するわけではない**。助詞/複合語の結合と句分割を済ませた最終queryを検査する。
  - 個々の「を」「へと」の辞書内の全結合規則まではこの単位で抽出していない。必須例の直接AudioQuery指定なら、解析に依存せず句accentを末尾へ設定できる。
- S20: https://raw.githubusercontent.com/VOICEVOX/open_jtalk/d2a2cbfcbd69abc74993ed8bab3fabc0111c9727/src/text2mecab/text2mecab_rule_utf_8.h
  - 半角空白→全角空白、!→！、?→？、,→全角コンマ `，`、.→全角ピリオド `．`、-→ `−`、数字/ASCII英字→全角、半角｡→。/､→、の正規化表を確認。
  - これは文字前処理であってpause秒数の割当てではない。`,`が直ちに日本語読点`、`へ変わるという説明もこの表からは支持されない。辞書/文脈を経た発音がpauになるかは別段階。通常テキストの句読点の自然な間はqueryを確認して局所調整する方針を維持。
- S21: https://raw.githubusercontent.com/VOICEVOX/open_jtalk/d2a2cbfcbd69abc74993ed8bab3fabc0111c9727/src/jpcommon/jpcommon_rule_utf_8.h と https://raw.githubusercontent.com/VOICEVOX/open_jtalk/d2a2cbfcbd69abc74993ed8bab3fabc0111c9727/src/njd2jpcommon/njd2jpcommon_rule_utf_8.h
  - JPCommonの内部発音マークは長音ー、short pause、questionを区別（pau、silも別）。普通のテキスト/辞書のーが内部で扱われることと、S6のdirect kana入力にーがないことは両立する。記号/括弧/句点/空白は品詞の分類にも現れるが、その一覧だけで各文字の最終音声を一律に決めない。
- S10/S11/S7（再照合、URLはUnit2）:
  - enable_katakana_english=trueの場合だけ、英字feature間のpau全角空白を削除。falseならその削除処理も実行されない。単に英語の読みだけを切り替える完全に局所的なスイッチとして扱わず、句/間の変化も検査する。
  - 音素長の単位は秒（S7の_to_frame(sec)が93.75 frame/secで丸める）。speedScaleとpause倍率の適用後に丸める。したがって長音の希望する実時間を維持するには `vowel_length = 希望秒 * speedScale` が丸め前の対応。全話者の自然値を決める式ではない。
- S22（補助、固定Core側の型の確認）: https://raw.githubusercontent.com/VOICEVOX/voicevox_core/0.16.1/crates/voicevox_core/src/engine/talk/model.rs と https://raw.githubusercontent.com/VOICEVOX/voicevox_core/0.16.1/crates/voicevox_core/src/core/infer/domains/talk.rs
  - Talkのpitchは音高float、予測出力名f0_list、decode入力f0。ここにHz/MIDI等の単位の明記は見つからない。FrameAudioQuery歌唱のf0をTalkのpitchの値へそのまま転用しない。
- S23（開発者の公開推論実装、固定Coreモデルとの完全一致は未照合）: https://github.com/Hiroshiba/vv_core_inference と https://raw.githubusercontent.com/Hiroshiba/vv_core_inference/df60099ccd58a54352bf0239b60cb29794385473/vv_core_inference/make_decode_forwarder.py 、同commitの https://raw.githubusercontent.com/Hiroshiba/vv_core_inference/df60099ccd58a54352bf0239b60cb29794385473/vv_core_inference/forwarder.py
  - 読み取り時mainのSHAをGitHub APIで記録（df60099ccd58a54352bf0239b60cb29794385473）。開発者はVOICEVOXコア内の推論コードと説明し、forwarderは同じインターフェースと処理だとする。decode wrapperは正のf0をtorch.expで指数へ戻してvocoderへ渡すため、入力pitchが**自然対数のF0表現**である裏付けになる。無声は0。公開sampleは実VOICEVOXのモデルではないとREADMEが明記する。
  - 0.16.1で配られた個々の音声モデルの内部ONNXを解析して同一性を確かめてはいない。reportではTalk pitchをHz直接/半音数として指定せず、予測値に対する局所調整とし、単位の根拠とこの限界を区別する。S7のpitchScaleはこの数値へ2**scaleを掛ける実装なので、値0.1が厳密に何半音かという音楽単位の解説は追加しない。
- 補助・保証には不使用: https://github.com/VOICEVOX/voicevox_engine/issues/798 （2023-11-29、0.14.10のf0配置への質問。本文は確認できたが解答コメントはnative webに出ず、単位の保証に使わない）。https://github.com/VOICEVOX/voicevox_engine/issues/603 （0.13.3/0.14.0のdirect kana結果差という検索結果。現0.25.2の不具合とみなさず、版間で同じ指定でも自然さが変わりうる旧報告としてのみ記録）。推測したvv_core_inference master treeは404で、mainを確認して読み直した。

### 必須例と仕組みへの結論

1. **辞書の平板とAudioQueryの平板候補を数値0で共通化しない。** 辞書へはChatGPT→チャットジーピーティー・accent_type=0、ツール→ツール・accent_type=0が反復語の候補。直接句指定では語だけならaccent=9/3、提示の助詞込みなら11/4。最終queryで句/読み/核/pitchを検査する。直接句指定の0は使わない。
2. **いちばん制御が確実なルート**は、全文のaccent_phrasesの対象句を定め→句末accentへ変更→同じstyle/Coreのmora_data（長さを保持するならmora_pitch）→必要な有声pitchと長音母音長の局所変更→最終queryで合成、という手順。これは音声の自然さを試聴した保証ではなく、指定内容が合成へ伝わる操作の保証。
3. ChatGPTでチャ低/ト以降高を厳密にしたければ、促音ッを有声化してpitchを与えるのではなく、有声のチャ/ト/以降を編集する候補。平板核だけでは各モーラの絶対値が同じになるとは限らない（S7予測モデル）。ツールのウはすでに一モーラとしてあるため、母音字への置換だけで延長されると期待しない。
4. **デッキ辞書案はEngineグローバル辞書と切り分ける必要がある。** importは切替ではない。将来のnarrate実装で隔離した保存先/プロセス辞書を使うか、デッキ語彙を前処理とquery修正に閉じる方式を設計する。既存のユーザー辞書を消したり入れ替えたりする操作は今回行わず、設計上の要件としてUnit6bへ渡す。

### 未解決・限界

- この機械で辞書accent_type=0を登録し「ChatGPTへと」「ツールを」を解析/合成した実験は行っていない。OpenJTalkの固定コードによる写像は確認したが、最終句がどう結合されるか/どのpitchになるかは未確認。自然さの聴取評価は承認後へ保留。
- 。/、/？！/空白の各文脈の最終発音と秒数を完全な一覧へ固定する根拠は得られない。前処理の正規化と内部マークは確認できたため、再現には文字の効果に頼るだけでなくqueryの句境界/pause/is_interrogativeを検査して編集する。
- pitch単位は公開開発者の推論コードで対数F0の裏付けを得た。固定版Coreの各配布モデル内部までの同一性は未照合。無声0を有声pitchへ一律に変えない。
- 版差の網羅追跡は本題を超えるため行わない。旧Tipsの範囲・現版のコード保証・現版での未試聴を各規則へ明記する。

### 次の単位

Unit6b: 有限の略語/長音補足検索、U21の公開forkと必要ならU11の記法の関連ファイルだけを読んで、証拠の独立性・必須三例の答え・記法とデッキ語彙の設計案を統合する。Unit6aは完了。残りUnit6b、ready-to-report境界、別の明示report turn。report.mdはまだ作成しない。


## Unit 6b: 利用者実装の有限照合・証拠の独立性・必須三例・道具の仕組み案

確認日: 2026-10-11 UTC。開始時にlog.mdの全既存単位（381行）を再読し、Plan revision 3に従って残る研究単位を完了した。native webで有限の補足検索、GitHub APIのtree（524288 bytes上限、timeout15〜20秒）、rawの関連ファイル（65536 bytes上限、timeout15〜20秒）を読み取った。Engine起動・API呼出・合成・試聴・インストール・cloneは行っていない。書込みはこのlog.mdへの追記だけ。checkpoint通知を受けたため、本単位の完了を記録してからcheckpointを要求する。report.mdは別の明示report turnまで作らない。

### 資料・取得範囲と帰属する事実

- U21-code: sss aaのnoteで紹介された公開fork https://github.com/qwe339/voicevox-ai （U21本文のURL/日付はUnit5）。GitHub tree取得時mainは `a260d48974f7fb0ac227abffde34eb67be6fe3d8`、truncated=false。このcommitの次のファイルのみ精読した。
  - https://raw.githubusercontent.com/qwe339/voicevox-ai/a260d48974f7fb0ac227abffde34eb67be6fe3d8/src/domain/voiceTuning.ts （41244 bytes、1203行、設定と関連処理を選択して確認）。生成後AudioQueryの補正という明記。OpenAPIクライアントのcamelCaseフィールドで書かれているため、HTTP JSONへ移す場合はvowelLength→vowel_length、consonantLength→consonant_length、pauseMora→pause_mora、accentPhrases→accent_phrases等へ翻訳する。
  - **弱いウ/イ**: weakVowelLength既定enabled=true、targetU/targetI=true、minLength=0.18。mora.vowelがu/U/i/Iで、vowelLengthが最低長未満なら0.18へ上げる（967〜987行）。speedScaleに合わせてこの閾値を換算する処理はこの関数にない。これは普通の弱い母音への公開実装例であり、何秒もの叫び向けU1/U2/U3とは違う。特定話者/ツール/話速での比較音声を確認しておらず、**作者の設定例、普遍定石ではない**。0.18フィールドの最終時間は0.25.2仕様によれば1.1で約0.164秒、1.3で約0.138秒、1.5で0.120秒（丸め前）。この数値は移植候補を説明するための計算で、めたんの推奨値ではない。
  - **句末ティ/ディ等**: endSmallVowel既定enabled=true、minLength=0.15。判定は実際にはmora.textの末尾が小文字ィ/ェで、pause直前または最終句の最後のみ。該当母音長を最低長へ上げる（843〜860行）。U14のインフィニティ→インフィニティーはモーラ追加、こちらは既存モーラ長の変更であり操作が異なる。作者がコミュニティノウハウを採ったと述べるため、同じ例を独立した二つの聴取実験として数えない。
  - **行頭ざ行**: zConsonant既定enabled=true、minLength=0.1、lineHeadOnly=true、includeJ=false。最初のモーラのconsonantがzで短い場合にconsonantLengthを0.1へ上げる（808〜830行）。U21の「絶対→でったい」の経験をコード化したもの。z全般の原因の実証や全話者の自然値ではない。
  - **読点の上限**: pauseCap既定enabled=false、maxSeconds=0.15。ON時にpauseMora.vowelLengthが閾値超なら閾値へ詰める。**0.15がEngineの自動仕様という証拠ではなく任意の利用者設定**。U14/U20の値の位置づけと整合。
  - **括弧pauseの削除**: bracketPause既定enabled=true、kagiBrackets=true、quoteMarks=false。読点/句点なしで対象括弧がある行のpauseMoraをundefinedへする（789〜806行）。引用符を初期対象から外した実装はU21の「ためまで消えて棒読み」の記事と整合する。すべての括弧を消すのが自然という保証ではない。句を結合する処理とは別。
  - **疑問/文末**: ?/？で終わる文の最後の句へisInterrogative=trueを付ける。sentenceEndFall既定delta=0.15、prePauseFall=0.07、declination slopePerPhrase=0.04/maxDrop=0.25。lowerLastVoicedMoraは最後と直前の有声モーラを探し、最後がmax(直前pitch-delta,4.0)より高いときのみ下げる。疑問文やisInterrogative=trueの句は文末下降から外す。後続句のpitchは最初の句の最大pitchから句数に応じて下がるcapで抑える。値はHz/半音ではない。**この作者の独自ナチュラル化、Engine0.25.2の機能名/固定定数ではない**。
  - **無声化への別処理**: revoiceShortVowelは4モーラ以下の行でvowel=U/Iかつpitch=0なら、前方→後方の有声pitchを借り（なければ5.5）、vowelを小文字にする。この設定もenabled=true。ただし今回の「ツール」のウが無声化している証拠はなく、長さ不足と無声化を混同しない。促音ッは対象ではない。全ての無声モーラを有声化する設計を採らない。
  - https://raw.githubusercontent.com/qwe339/voicevox-ai/a260d48974f7fb0ac227abffde34eb67be6fe3d8/src/domain/autoSilence.ts （6331 bytes、203行）。三点リーダ/連続ダッシュの行頭/行末や記号のみ行をpre/postPhonemeLength=1.5とする設定。**この改造エディタの前処理が追加する無音**であり、「Engineは…を必ず1.5秒にする」という根拠にはしない。既存リポジトリは演出の待ちをlead/tail/restへ置くため、このルールの移植は推奨しない。
  - https://raw.githubusercontent.com/qwe339/voicevox-ai/a260d48974f7fb0ac227abffde34eb67be6fe3d8/src/domain/textPreprocess.ts （10288 bytes、327行）。置換ルールは上から逐次適用、デフォルトrules空。語彙の言い換え/話者割当/長い行の分割は別機能として持つ。今回の読み指定へ語彙自体を変える置換を混ぜない設計に役立つ。編集全体のstore呼出箇所、手調整行の保護フラグ、Engine版との組合せは追わず、noteの説明を超えて検証済みとは言わない。
- U11-code: https://github.com/kajidog/mcp-tts-voicevox/blob/main/README.ja.md （既出U11）と、GitHub tree取得時main commit `4fc2c326cfb52fa8b37d82c24238187ffd1c975d`、truncated=false。関連ファイル https://raw.githubusercontent.com/kajidog/mcp-tts-voicevox/4fc2c326cfb52fa8b37d82c24238187ffd1c975d/packages/voicevox-client/src/accent-utils.ts （15698 bytes、424行）を照合。
  - `コン[ニ]チワ,セ[カ]イ` のような独自記法を使う。カンマで句を示し、一モーラを角括弧で囲んで1始まりのaccentへ変換。文字位置とEngineが返すmoras.textを突き合わせる。長音符は辞書モーラ分解では独立した一モーラ、小書き字は前の字へ結合する。
  - Engineの句分割が入力の区切りと違う場合の分割/結合処理を実装。切り出し末尾が元の句末でない場合はpause/is_interrogativeを引き継がず、結合は最後の句のそれらを引き継ぐ。**句の編集で核だけでなく末尾属性も対応させる必要**を示す公開利用者実装として採用。
  - 注意: accentPhrasesToNotationのコメントはaccent=0を平板と呼び角括弧を省略するが、フレーズの括弧省略は自動推定保持の意味。辞書parseAccentNotationの省略はestimateAccentTypeへ行き、`max(1,モーラ数)`を返す。つまり0を省略で書き出して再入力しても0を保持する保証はない。助詞つきでは辞書の平板0と語末核（尾高）を区別する必要がある（S18/S19）。**この独自記法の平板処理をそのまま採用しない**。クライアントがaccent編集後に再計算する全呼出経路は未照合、APIの再計算保証はS2/S7を根拠とする。
- U26（補助、限定採用）: https://takagi-hiromitsu.jp/diary/20260920.html — 高木浩光、2026-09-20、ずんだもん/めたんの解説動画制作日記。
  - 導入で、漢字の読み修正をLLMへ任せても、ずんだもんのアクセントは人が聞いて修正指示していると自分の制作経験を記す。**読み修正とアクセント修正を別に扱う、利用者の独立した実践**としてのみ採用。
  - 本文にAquesTalkPlayerとVOICEVOXの作業対話が長く共存し、検索結果の「平板ですべて読む」等はどちらの手段かを分離する必要がある。20260920本文で「整理整頓」「アクセントの指定方法」「データ」の具体箇所はfindで見つからなかった（最新日記の検索結果との混同を防ぐ）。AI発言を利用者本人が実測したAPI保証として採らない。Engine版や個々の核の処方はこの資料で確定していない。

### 有限補足検索の結果と打切り

native webで次の6クエリを検索した: `VOICEVOX "MCP" "アクセント"`、`VOICEVOX "ツール" "長音" 調整`、`VOICEVOX "GPT" "平板"`、`site.zenn.dev VOICEVOX "長音" 調整`、`site.x.com VOICEVOX "アクセント" "ChatGPT"`、`site.dic.nicovideo.jp VOICEVOX "調声"`。

- GPT/MCP/LLM/API/AI/o1の語ごとに、核値まで一致した複数の独立利用者の規則は追加で得られなかった。「存在しない」とは言わず、この有限検索と既存単位の資料で未確認とする。読み候補をデッキ語彙へ置くことはできるが、自然な核の標準値として掲載しない。
- 検索ではMCPツール実装、再掲の長音メモ、他音声ソフト資料が多かった。 https://zenn.dev/chomstudio/scraps/06123e73ed2673 は**VOICEPEAK**の長音/かな検証であり、VOICEVOXの書き方規則へ流用しない。 https://help.voicization.net/windows/phrase_editor/ も別製品ヘルプ。X/ニコニコ大百科から語固有のAPI再現に使える本文は新たに得られなかった。媒体名を埋めるために一般記事を独立検証の人数へ加えない。
- https://note.com/clean_broom590/n/na37386f8cc4b はアクセント辞書生成ツールの紹介、https://github.com/KEIKEI999/VoiceVoxLM はユーザー辞書0を平板と説明するREADME。ただし生成JSONの完全なschema/助詞結合を新たに確かめておらず、固定版の平板保証はS18/S19に置く。これらを語別の自然な核の証拠として採らない。
- https://www.nicozon.net/watch/sm41189630 は調声講座の動画説明が出たが、具体値を得るための動画聴取は行わず、新しい定量根拠にしない。無関係な歌唱/VOICEPEAK/UTAU/一般日本語アクセントの結果は除いた。これで追加検索を終了する。

### 証拠の独立性と確かさの統合

reportの各規則に、**M=複数の独立利用者の実践、E=単独利用者の経験/実装、F=固定版公式コードで操作を確認、P=本調査の設計推論、?=未確認**を併記する。M/Eは効果量や全話者での保証ではなく、資料の性質のラベル。

|規則/主張|独立性と採用範囲|
|---|---|
|読みを直す→核を直す→個別pitch/長さ|U1、U4、U14の具体的な手順は複数作者にある。U1の極端長音手法の参照は別に扱う。API順はF(S2/S7)|
|頻出語を読み+核で辞書化|U5、U9、U13、U14の独立した運用。登録で文脈全体の句/核が保証されるわけではない|
|全部ひらがなにせず、曖昧な語をカタカナで指定|U12の入れる/はいれる、U17のハチは独立した類似失敗。旧版・前処理辞書/Engine辞書・話者の差を明示|
|数字+単位/分数を意味から語へ展開|U15の単独測定、U18の別作者の配布前処理。具体的に2m/100g/1/3を確かめたのはU15。年/小数全部が誤るとは言えない|
|通常の長音は母音長を編集|U4がGUI操作、U21-codeが弱いu/iの最低長補正を実装。F(S4/S7)は伝達を保証。0.18の自然さはE・未試聴|
|インフィニティ末尾|U14の単独経験→U21がコミュニティ知見を実装。参照関係不明でも独立の同条件実験2件と数えない|
|ぐえーーーー等に子音を挿入|U3の動画→U2メモ/U1参照。同一系列。U3の2022-10-10訂正（ハ行先/ワ行次）を併記|
|カナ英語の空白による長いpause|U20→引用U19。一系列、2022年のカナ前処理の話。現在の英字featureの空白除去(S10)とは別|
|読点0.10〜0.15|U14の好み、U21-codeの任意cap。U22のEngine固定仕様という断定は不採用。値だけ一致しても合意実験としない|
|ChatGPTの違和感|ボスとU5(.25.2)に個別報告。ただし利用者の平板核値の一致はない。今回の11/9はF+Pによるボスの希望の実現|
|句分割/結合、括弧pauseの個別除去|U4/U14に編集実践、U21に全削除で意図したためが消えた反例。句境界とpauseの別操作を採る|
|ずんだもんの語尾、めたん固有の癖|U23の一経験、U25のめたん初期が自然という別経験。全話者/全スタイルの癖と認定できない|

### 必須具体例1〜3への確定回答（操作の答えと未試聴の区別）

1. **ChatGPT**: 通常利用者はアクセントの核をGUIで直し、必要なら各音の高さを直し、頻出語は辞書にする（U4/U5/U14）。本調査で利用者が「ChatGPTは必ず核○」と一致する規則は得ていない。ボスの希望への候補は、辞書 `surface=ChatGPT, pronunciation=チャットジーピーティー, accent_type=0`。直接句指定は「チャ・ッ・ト・ジ・イ・ピ・イ・ティ・イ」の9モーラ、助詞「へと」を同句に含むなら11。核は語の末尾だけでなく**句全体の末尾**（9/11）へ置き、mora_dataまたはmora_pitchで予測を更新。例AquesTalk風 `チャットジイピイティイエト'`。核3はトから上がる記号ではなく、トの後で下降する位置なので不適切。低いチャ→ッは無声→トで有声の上昇が聞こえる候補。なおモデルが平板でも絶対pitch一定を保証しないので、厳密にト以降を保ちたい場合だけ再計算後の有声モーラのpitchを修正する。促音に声を足さない。末尾エトは後続「へと」と考えられるためChatGPT単語の辞書へ含めない。
2. **ツール**: 核訂正と長音の補正を分ける。辞書候補 `pronunciation=ツール, accent_type=0`、語だけの句ならaccent=3、「ツールを」の句なら4、AquesTalk風 `ツウルオ'`。再計算後、`moras[1]`（0始まりで2拍目ウ、vowel=u・consonant=nullのはず）を確認し **vowel_length** を延長する。ツの子音長や全体volumeScale/intonationScaleを最初の代替にしない。母音字に替えるだけでは既にあるウを延長しない。U21-codeの0.18は試し値の出典にはできるが、めたん/この文の定石とは言えない。値はspeedで割られ、高速ほど実時間が短いことはF。知覚の悪化は未聴取。ウが本当にU/pitch0なら無声化も別に検査するが、ボス例だけからその原因と決めない。個別モーラ音量はAPIにないため、弱さが音量/音色由来なら母音長だけでの完全解決は保証できない。
3. **エージェント等**: ボスの聴取で問題ないので現状を維持。カタカナ語/英略語を一律平板、母音を一律延長、intonationScale=0のような全体変更は導入しない。語が自然でも、他の文脈で誤った場合は全文のqueryと聴取で個別に修正する。

確実さの順序は「望む指定が合成に届く」という意味で、**最終AudioQueryの句を直接編集→再計算→局所pitch/長さパッチ**が最も確実。辞書は反復の効率がよく、最終の句結合・核・pitchの検査が必要。AquesTalk風は読み/核/句を直接決めるが、各pitchや長さは指定できず後段パッチが必要。自然さの順位は未試聴で未確定。

### 原稿とデッキ語彙の設計案（実装/仕様変更は今回行わない）

1. **三層の指定を分ける**。通常は既存 `[表記|よみ]` の局所読みと、デッキ語彙の反復語。次に必要な文だけのアクセント句（読み・核・無音なしの区切り・疑問）。最終にモーラの長さ/pitch/pauseを編集する調声メタデータ。演出の待ちと文内速度変更は既存の文分割+lead/tail/rest+三段話速を継続する。
2. **平板は意味で書く**。新記法/デッキ辞書の値には `accent: "flat"` または `flat: true` のような意味を与え、Engineの形式へ翻訳する。語彙登録ならaccent_type=0、直接句なら助詞まで含むmoras.length。`[ChatGPT|チャットジーピーティー;accent=flat]` 等は提案表記で未実装と明記する。句末核の整数と平板を語彙の一フィールドで暗黙に共用しない。
3. **語への平板指定を句全体へ盲目的に拡張しない**。ChatGPTへと/ツールをのような独立名詞+助詞が対象。対象語がさらに他の名詞/述語と一つの句へ組み込まれたとき、句全部を平板にすると他語も変わる。対象の想定句/読みを照合し、一致しなければ要確認とし、必要ならその文の句境界を明示する。カタカナ長音ー→母音展開は直カナ用コンパイラへ持たせ、通常の作者読みではーを使えてよい。
4. **デッキ語彙はプロジェクトが所有する小さいデータ**。設計例の要素はsurface、pronunciation、意味によるaccent、word_type、priority、別名、大文字小文字の方針、想定例文/助詞、根拠、確認版/話者/話速。英単語読みと文字略語読みを明示しGPT/MCP/LLM/API/AI/o1を個別管理。MCPエムシーピー、LLMエルエルエム、APIエーピーアイ、AIエーアイ、o1オーワンは**内容から採用する読み候補**で、自然な核が合意済みの辞書ではない。長い語優先、単語境界、明示の局所読み優先を設けて白石/白石町、2倍/2倍速等の干渉を防ぐ。配布U18は参考で、1810語など大辞書を無検証で取り込まない。
5. **Engine辞書はグローバルでimportはmerge**（S12）。推奨案はnarrate自身の管理下で、専用Engineの辞書保存先を隔離し、正規化済みデッキ語彙だけを登録する方式。別案はEngine辞書を変えず、前処理+最終queryパッチに閉じる方式。どちらもプロジェクトの設計段階で選ぶ。importのoverride=trueを辞書入替とみなさない、同じsurface別UUIDの重複や残存語を検査する。GET形式を輸出入、エディタ用前処理辞書/CSV/TipsをそのままEngineJSONとして送らない。
6. **文単位の上級指定はサイドデータが向く**。原稿には読み/flatまでの小さい指定、必要なら文の安定IDに結びつく全句のAquesTalk風入力。長さやpitch数値は原稿内の演出秒とは別の調声メタデータに置き、明示的なモーラ番号+期待text/音素、パッチの適用順、出典/試聴メモを持つ。`ツール`の2拍目ウにvowel長の倍率/フィールド秒を指定する案が可能。原稿に現在使う`{印}`と別の予約記号を検討し、U11の角括弧記法を既存rubyとそのまま併用しない。全句手指定は保守負担があるので例外経路にする。
7. **処理順と印の時刻を一緒に設計する**。字幕/読み/印の対応を解析→明示局所読み優先の語彙前処理→通常全文query/句override→核/句/音素変更の再計算（mora_data、長さを保持するならmora_pitch）→長さ/pitch/pauseパッチ→全文の最終queryから印の時刻とWAV期待時間を計算→同じqueryで合成。既存のprefix queryも同じ語彙/読み方で扱い、手入力句の場合は印をモーラへ明示対応させる。配列番号だけのパッチは前処理変更で他語へ当たるため、期待読み/句/モーラが合わなければ停止する。
8. **キャッシュと再現性**。generationHashへデッキ語彙内容（正規化後）、原稿記法の版、句override、モーラパッチ、英語変換flag、疑問flag、style/Core/Engineと三段speedを含める。manifest等へ最終句/核/pitch/長さ/pauseまたはそのハッシュを保存し、query.kanaだけで全調声を表現したとみなさない。手調整済みの箇所を一律自動処理で上書きしない。全句のpitch0化やpause一括削除、無声化一括解除は初期処理に入れない。
9. **承認後の次の試聴（保留）**。この調査では実施しない。対象は1-1のChatGPTへと/ツールを/問題ないエージェントを含む実文。先に「現在→核のみ→長音長のみ/核+長さ」を少数比較、基本1.3で決め、1.1と1.5で確認。各queryと希望の聞こえ方を記録し、その結果だけをめたんの確定語彙として入れる。ずんだもんは同じ読み・核を候補にしても、pitch/長さは別スタイルで再計算・確認する。合成や起動の承認は別途必要なのでここでは求めず、次行動として提案する。

### 最終の未確認事項・残る問い

- Engine0.25.2/Core0.16.1での実際のqueryと音、辞書0の必須例の最終句結合/核/pitch、めたん/ずんだもん各スタイルの自然値。APIとコード上の手段は確認したが、この機械で再現したとは言わない。
- GPT/MCP/LLM/API/AI/o1それぞれの自然な核の合意、数字の範囲/複合単位/モデル名の数の最善読み、句読点や空白ごとの固定pause秒。希望と文脈を語彙/句データへ保存する案で対応し、未知は報告する。
- ー→母音の通常テキスト書換えだけで長音が強くなるという独立比較、1.1/1.3/1.5でのツールの知覚の定量差。0.18等は作者の実装値で、この問題での検証済み値ではない。
- U21-codeの全呼出順/手調整保護と当該note時点から現在commitまでの変更、U11の全クライアント再計算、U14の「している」画像内の核値、動画本文の未聴取。コードの有無と品質評価を分ける。
- 固定Core配布ONNX内部までのpitch単位一致は未検証（S23の対数F0裏付けの範囲）。Talk pitchをHzや半音の絶対値で決める案は出さない。
- 全自動ナチュラル化の比較評価、版差の網羅追跡、他話者/歌唱/大辞書品質評価は範囲外で保留。今回の派生質問（極端長音と普通長音の違い、複数掲載の独立性、全pause削除の損失）は元の規則/API設計の範囲で回答できた。

### 次の単位・研究完了の境界

Plan revision 3の研究単位Unit1〜5、6a、6bはすべて完了。新たな研究単位は追加しない。次は **ready-to-report** 境界。report.mdはこのturnでは書かず、明示的な「This is the report turn」を受けた別turnでlog.mdを再読し、日本語report.mdを作成する。必須内容は（1）型/例/書き方・設定/手段/出典/確かさの規則表、（2）0.25.2 API手段のできる/できない表、（3）必須三例への答え、（4）原稿/辞書の仕組み案、（5）未確認、さらに調査の要約・問い/計画の変化・次行動。出典URLと確認日2026-10-11、短い引用、独立性と版の区別を保持する。ready to write report。

## Unit 7: 明示された report turn × 完了した調査ログの統合

確認日: 2026-10-11 UTC。attendantから「This is the report turn」の明示を受け、既存log.mdの全468行を分割して再読した。Plan revision 3までの完了単位を統合し、`research/voicevox-writing/report.md`を作成した。新たな研究単位やWeb出典は追加していない。

### 資料

- `research/voicevox-writing/log.md` Unit1〜5、6a、6b、Plan revision1〜3（再読日2026-10-11）。各URL・確認日・経験の帰属・固定版の照合範囲を報告書へ引き継いだ。
- `research/voicevox-writing/report.md`（作成・点検日2026-10-11）。53の出典リンク定義を含む。ローカル参照はAGENTS.md、docs/spec.md、script.js、narrate.mjs、core.mjs。

### 完成した成果と検証

1. 日本語の要点、型別の規則表、0.25.2のAPI能力表と再計算・辞書の具体手順、必須三例の答え、道具の三層指定・デッキ語彙・印/キャッシュの設計案、確かさと未確認、計画の変化と次行動を記載した。
2. ChatGPTは辞書0／語のみ句9／へと込み句11、ツールは辞書0／語のみ句3／を込み句4と、再計算後の2拍目ウのvowel_lengthを区別。エージェントは現状維持。長さ0.18等は利用者設定例として扱い、自然値や合成済みの答えとしなかった。
3. M/E/F/P/?の分類、参照・転載による証拠の非独立性、旧版と固定版・自己報告と実測の差を保持。X/ニコニコ大百科の有効本文未取得、VOICEPEAK資料の除外、動画未聴取を明記した。
4. 軽い読み取り検査で、報告書の出典参照に未定義がないこと、53 URLが既存ログに記録済みであること、表の列数が揃うこと、ローカルリンク先が存在することを確認。連続した短縮参照を区切り、Markdownの参照リンク解釈の曖昧さを除いた。出力ディレクトリの成果物はlog.mdとreport.mdの二つのみ。
5. Engine起動・API実行・合成・試聴、sudo、インストール、リポジトリの他ファイル変更は行っていない。

### 未解決と次の行動

未解決はreport第5節へ集約した。主に現機械・めたん/ずんだもんでの実音、略語ごとの核の合意、長音の最適値と速度別知覚、句読点別固定秒、公開実装の全経路と配布モデル内部のpitch単位。承認後の少数合成比較、仕様・実装の判断は次作業として提案しており、今回の調査の残単位ではない。

研究と報告は完了。report turnの運用契約に従ってcheckpoint/compactionを要求せず、state=done・checkpoint=falseで終了する。
