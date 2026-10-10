# fuzzy6 — Motion Explorer

短いモーション（クリップ）を束ね、← と → で行き来しながら見ていくウェブアプリです。画面は 1920×1080 の論理座標で、左と下の L 字の枠にパンくず・題名・シークバー・字幕・ナビを置き、残りの 1600×900 のステージでクリップを再生します。部品と契約の正本は [docs/spec.md](docs/spec.md) です。

## 構成

```
docs/spec.md            部品と契約の仕様（正本）
src/explorer/           engine。spec の実装（index.js が createExplorer）
src/explorer/explorer.css  幾何と既定の見た目
src/kit/                canvas で描くクリップのための道具（緩急、種付き乱数、文字、図形）
decks/<id>/             一つのデッキ（テーマ）。index.html, main.js, deck.js, theme.css, clips/, README.md
index.html, src/home/   デッキの一覧（表紙は各デッキの静止フレームを iframe で出す。spec §8）
tools/capture.mjs       静止フレーム、各クリップの poster、連続フレームの一覧を撮る
tests/                  unit（vitest）と e2e（playwright）
```

## コマンド

```bash
npm run dev            # http://127.0.0.1:5175/（デッキの一覧）
npm run build          # dist/
npm test               # unit（vitest）
npm run test:e2e       # e2e（playwright、port 8082 で自前のサーバを立てる）
npm run capture -- …   # 使い方は tools/capture.mjs の先頭（dev サーバが起動している前提）
```

## 決まりごと

- engine の振る舞いを変えるときは、先に `docs/spec.md` を直し、版と変更の記録を更新する。
- デッキは engine と `src/kit/` を import してよい。デッキどうしは import しない。
- クリップは時刻の純粋関数として描く（spec §6.1）。乱数は `src/kit` の `hash` / `mulberry32` を使う。
- canvas に描く文字は、最初に描く前に `deck.fonts` / `clip.fonts` で読み込む（spec §6.4）。
- デッキの狙い、構成、事実の出典、日付つきの制作メモは `decks/<id>/README.md` に書く。どのデッキにも効く知見はこのファイルに書く。

## クリップを作る手順（2026-10-10、LLM デッキで固めた）

1. デッキの `README.md` に、クリップの狙い、中身、字幕、出典を書く。数値や出力が作り物なら「例」の札を付けると決めておく。
2. クリップを書く。canvas のクリップは `decks/llm/lib/clip.js` の `clip({ prepare, draw })` の形が楽で、`prepare` に時刻によらない配置の計算を置く。
3. `npm run capture -- <deck> --posters` で全クリップの最後の絵を撮り、重なり、はみ出し、折り返しを見る。最後の絵が一枚の図版として読めるまで直す。
4. `npm run capture -- <deck> <id> --sheet --every 0.75` で動きの一覧を撮り、途中の重なりや、何も動かない間を見る。静止フレームは動きの確認にならないので、区切りごとに実際に再生する。
5. 事実は一次資料で裏を取る（codex の research が向く）。訂正はデッキの `README.md` の表に反映する。

気づいたこと:

- 最後の cue の `to` を `duration` より後ろにすると、終わりの静止画でも字幕が出たままになる（cue は `at ≤ t < to` で出る）。
- rail の題名は、幅 236px に 42px で組むので 1 行 5 字まで。句の切れ目で折れるため、6 字以上の句を作らない。カタカナ語も例外ではなく、「コンピュータを使う」は「コンピュー／タを使う」、「呼ばなくなるまで」は「呼ばなくな／るまで」と折れた。
- 何本ものクリップで同じ図を軸にするときは、図の部品と配置をデッキの `lib/` に一つのモジュールとしてまとめる（LLM デッキの `lib/rig.js`）。配置は箱の位置から通り道などを割り出す関数にしておくと、あるクリップだけツールの位置を広げる、といった変形を、配置どうしの補間で動かせる。
- 撮影（静止フレームのモード）では枠のトランジションを止めている。止めないと、撮る瞬間に軸などが途中の形で写る。
- その裏返しで、撮影では CSS のアニメーションとトランジションの不具合が写らない。2026-10-10 には、再生中に字幕がまったく見えない不具合（engine が字幕の要素を毎フレーム付け直し、入りのアニメーションが毎回最初に戻っていた）を、撮影だけでは見落としていた。枠に手を入れたら、通常のモードで再生し、Playwright で要素の不透明度や `getAnimations()` の進み具合を時間を追って読む。e2e テストにも、再生中の字幕が見えることを確かめるものがある。

## 分担

見た目、レイアウト、動き、文面（字幕や UI の文言、文書）のように知覚で判断する部分は Claude が受け持つ。engine のロジック、ツール、機能テストと GUI テストは codex（GPT-6 Astra）に任せる。codex に頼むときは、このファイルと `docs/spec.md` を読ませる。

## 環境

- ポートは dev が 5175、preview が 5176、e2e が 8082。どれも `strictPort` で固定する（ボスの規則で、使ってよいのは 5173〜5176 と 8080〜8083 だけ）。
- 依存はすべてプロジェクト内の `node_modules` に入れる。sudo は使わない。
- Playwright は `@playwright/test` 1.62.1 に固定し、キャッシュ済みの chromium-1234 を使う。`playwright install-deps` は sudo apt を呼ぶので使わない。
- ツールとテストは、ブラウザの各操作に timeout を付け、全体にも上限の時間を設ける。子プロセスは終了時に必ず閉じる。
