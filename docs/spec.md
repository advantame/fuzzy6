# Motion Explorer 仕様

版 0.2（2026-10-10 改訂）。この文書は、エクスプローラの共通部品と、デッキ・クリップ・テーマの契約の正本です。実装（`src/explorer/`）とこの文書が食い違ったら、どちらを正とするか決めて、両方をそろえます。

## 1. 何をするものか

短いモーション（クリップ）を束ねて、← と → で行き来しながら見ていくウェブアプリです。クリップは数秒から数十秒のアニメーションで、時刻の純粋関数として描きます。

テーマごとに見た目は大きく変えてかまいません。テーマが変えないのは次の三つです。

- 画面の幾何（L 字の枠と、1600×900 のステージ）
- 部品の構造と振る舞い（パンくず、題名、デッキの軸、シークバー、字幕、ナビ、目次）
- デッキとクリップの契約（データの形、時刻の扱い、確認用の URL）

### 用語

| 用語 | 意味 |
|---|---|
| デッキ (deck) | 一つのテーマのクリップの束。例: LLM |
| 章 (chapter) | デッキの中の区切り。クリップを順に並べたもの |
| クリップ (clip) | 一本の短いモーション。時刻 t の純粋関数として描く |
| 字幕 (cue) | クリップの時刻の区間に結びついた文 |
| ステージ (stage) | クリップを描く 1600×900 の領域 |
| 枠 (chrome) | ステージの左と下を囲む L 字の領域 |
| テーマ (theme) | デッキの見た目。CSS 変数、CSS、飾りの DOM で与える |

## 2. 画面の幾何

論理座標 1920×1080 で設計し、全体を一様に拡大縮小してウィンドウに収めます。1760×990 のウィンドウでは 11/12 倍、1600×900 では 5/6 倍になり、どれでも同じ絵です。16:9 でないウィンドウでは、余った側に帯が出ます（帯の色は `--mx-bg`）。

```
x: 0          320                                        1920
y: 0  ┌────────┬──────────────────────────────────────────┐
      │        │                                          │
      │  rail  │                 stage                    │
      │320×900 │               1600×900                   │
      │        │                                          │
  900 ├────────┼──────────────────────────────────────────┤
      │ corner │                  bar                     │
      │320×180 │               1600×180                   │
 1080 └────────┴──────────────────────────────────────────┘
```

- ステージの 1600×900 は、画面全体と相似の 16:9（画面の 5/6）です。クリップはこの論理座標で描きます。
- L 字の内側の二辺を、二本の軸として扱います。横の辺（ステージの下端、y = 900）はシークバーで、クリップの中の時刻を表します。縦の辺（ステージの左端、x = 320）はデッキの軸で、デッキの中の位置を表します。二辺が交わる角（corner）に、現在の番号と前後のボタンを置きます。
- 四つの領域の位置と大きさは固定です。テーマは色、書体、飾りを変えますが、寸法は変えません。

## 3. 部品

### 3.1 全体

```html
<div class="mx" data-deck="llm" data-chapter="history" data-clip="shannon" data-state="playing">
  <div class="mx-frame">                  <!-- 1920×1080。JS が transform で拡縮し、中央に置く -->
    <aside class="mx-rail">…</aside>      <!-- 3.2 -->
    <main class="mx-stage">…</main>       <!-- 3.3 -->
    <div class="mx-corner">…</div>        <!-- 3.5 -->
    <footer class="mx-bar">…</footer>     <!-- 3.4 -->
    <div class="mx-index" hidden>…</div>  <!-- 3.6。ステージの領域に重なる -->
  </div>
</div>
```

`.mx` の属性。テーマの CSS は、これを見て見た目を切り替えます。

| 属性 | 値 |
|---|---|
| `data-deck` | デッキの id |
| `data-chapter` | 現在の章の id |
| `data-clip` | 現在のクリップの id |
| `data-state` | `loading` / `playing` / `paused` / `ended` |
| `data-dir` | 直前の移動の向き。`next` / `prev` / `jump` |
| `data-auto` | 「自動で次へ」が有効なとき付く |
| `data-index` | 目次が開いているとき付く |
| `data-first` / `data-last` | 最初・最後のクリップのとき付く |
| `data-still` | 静止フレームのモード（§8）のとき付く |
| `data-clean` | 枠を消すモード（§8）のとき付く |

JS が書く CSS 変数。

| 変数 | 要素 | 値 | 更新 |
|---|---|---|---|
| `--mx-k` | `.mx` | 拡縮の倍率 | リサイズのとき |
| `--mx-deck-progress` | `.mx` | デッキの中の位置。0〜1（最初のクリップで 0、最後で 1） | 移動のとき |
| `--mx-progress` | `.mx-seek` | クリップの中の進み。0〜1 | 描くたび |
| `--mx-t`, `--mx-p` | `.mx-layer` | そのクリップの時刻（秒）と進み（0〜1） | 描くたび |

ページの `document.title` は「クリップの題名 — デッキの title」にします。

### 3.2 rail（パンくず、題名、デッキの軸）

```html
<aside class="mx-rail">
  <nav class="mx-crumbs" aria-label="現在地">
    <button class="mx-crumb" data-level="deck">LLM</button>
    <button class="mx-crumb" data-level="chapter"><span class="mx-crumb-no">1</span><span class="mx-crumb-name">歴史</span></button>
  </nav>
  <header class="mx-heading" aria-live="polite">
    <div class="mx-heading-body">
      <p class="mx-no"><span class="mx-no-chapter">1</span><span class="mx-no-sep">-</span><span class="mx-no-clip">3</span></p>
      <h1 class="mx-title">次の文字を当てる</h1>
      <p class="mx-kicker">1948 · Claude Shannon</p>
    </div>
  </header>
  <ol class="mx-axis" aria-label="クリップの並び">
    <li class="mx-tick" data-chapter="history" data-chapter-start data-state="past">
      <button tabindex="-1" data-clip="opening" data-label="1-1 LLM"></button>
    </li>
    …
  </ol>
</aside>
```

- パンくずは「デッキ / 章」の二段です。どちらを押しても目次（3.6）が開きます。章を押したときは、その章の最初の項目にフォーカスを置きます。
- `.mx-heading-body` は、クリップが変わるたびに新しい要素に差し替えます。CSS アニメーションを毎回最初から流すためです。古い要素には `data-out` を付け、`animationend` で取り除きます（アニメーションがなければ 600ms 後）。同時に存在するのは 2 つまでです。
- `.mx-no` は章の中の番号です。`numbered: false` のクリップ（扉など）では置きません。`.mx-kicker` は `clip.kicker` があるときだけ置きます。
- `.mx-axis` はデッキの全クリップを順に並べた目盛りです。章の最初の目盛りに `data-chapter-start` を付けます。`data-state` は `past` / `current` / `future` です。テーマが縦の辺に沿って描きます。目盛りの button を押すと、そのクリップへ移ります。button の `data-label` は「番号 題名」で、テーマが吹き出しに使えます。目次があるので、目盛りは Tab の対象にしません（`tabindex="-1"`）。

### 3.3 stage

```html
<main class="mx-stage" aria-label="次の文字を当てる">
  <div class="mx-layer" data-clip="turing" data-role="out">…</div>
  <div class="mx-layer" data-clip="shannon" data-role="current">…</div>
</main>
```

- 1600×900 で、はみ出しは隠します。
- クリップごとに `.mx-layer`（1600×900）を一枚作り、`clip.setup` に渡します（§6）。
- 切り替え: 新しい層を `data-role="in"` で置き、スタイルを一度確定させてから（次のフレームで）`current` に変えます。古い層は `data-role="out"` にして、`transitionend` で dispose して取り除きます（トランジションがなければ 700ms 後）。向きは `.mx[data-dir]` で CSS が知ります。
- ステージを押す（タップする）と、再生と一時停止が切り替わります。タッチで横に 60px 以上スワイプすると、前後のクリップへ移ります。

### 3.4 bar（シークバーと字幕）

```html
<footer class="mx-bar">
  <div class="mx-seek" role="slider" tabindex="0" aria-label="再生位置"
       aria-valuemin="0" aria-valuemax="14" aria-valuenow="3.2" aria-valuetext="0:03 / 0:14"
       style="--mx-progress: 0.23">
    <div class="mx-seek-track"></div>
    <div class="mx-seek-fill"></div>
    <div class="mx-seek-marks">
      <button class="mx-seek-mark" tabindex="-1" style="--at: 0.06" data-time="0:00"></button>
    </div>
    <div class="mx-seek-head"></div>
    <div class="mx-seek-hover" hidden style="--at: 0.4">
      <span class="mx-seek-hover-time">0:05</span>
      <span class="mx-seek-hover-text">前の文字を多く見るほど、英語らしくなる。</span>
    </div>
  </div>
  <div class="mx-time"><span class="mx-time-now">0:03</span><span class="mx-time-sep">/</span><span class="mx-time-all">0:14</span></div>
  <div class="mx-subs" aria-live="polite">
    <p class="mx-cue" data-state="in">1948 年、シャノンは<strong>次の文字の確率</strong>で英文を作った。</p>
  </div>
</footer>
```

シークバー

- バーの上辺、つまりステージとの境目に沿って置きます。`--mx-progress` を描くたびに書き換えます。
- 押す、または引きずると、その時刻へ移ります。引きずっている間は時計を止め、離したら元の再生状態に戻します。
- マウスやタッチで押しても、フォーカスは取りません。← → がクリップの移動のまま残るようにするためです。Tab でフォーカスしたときだけ、← → で 1 秒、Shift 付きで 5 秒、Home / End で頭と終わりへ動かします。
- 目印 `.mx-seek-mark` は、既定では各 cue の始まりに置きます。`clip.marks` があれば、そちらを使います。目印を押すと、その時刻へ移ります。
- ポインタを載せている間は `.mx-seek-hover` を出し、その位置の時刻と、その時刻に出ている字幕の文を見せます（なければ文は空）。
- 時刻の表示は `m:ss` です。

字幕

- 時刻 t で有効な cue（`at ≤ t < to`）をすべて、`at` の順に `<p class="mx-cue">` で出します。
- cue の文は HTML としてエスケープしたうえで、`**…**` を `<strong>`、`\n` を `<br>` にします。
- 再生中に cue が入れ替わるときは、入る cue に `data-state="in"`、出る cue に `data-state="out"` を付けます。出る cue は `animationend` で取り除きます（アニメーションがなければ 500ms 後）。`.mx-cue` の要素は、出ていくものを含めて 4 つまでです。
- 有効な cue が変わらないフレームでは、字幕の要素を移動・再挿入しません。新しい cue だけを `at` 順の位置に一度挿入し、登場アニメーションの再始動を防ぎます。
- シークや移動で時刻が飛んだときは、演出なしで入れ替えます。そのフレームだけ `.mx-subs` に `data-instant` を付けます。

### 3.5 corner（現在の番号とナビ）

```html
<div class="mx-corner">
  <button class="mx-prev" aria-label="前のクリップ（←）"><span class="mx-icon"></span></button>
  <div class="mx-count"><span class="mx-count-now">07</span><span class="mx-count-sep">/</span><span class="mx-count-all">28</span></div>
  <button class="mx-next" aria-label="次のクリップ（→）"><span class="mx-icon"></span></button>
  <button class="mx-play" aria-label="再生 / 一時停止（Space）"><span class="mx-icon"></span></button>
  <button class="mx-auto" aria-pressed="false" aria-label="自動で次へ（A）"><span class="mx-icon"></span><span class="mx-auto-label">自動</span></button>
</div>
```

- 最初のクリップでは `.mx-prev` を、最後のクリップでは `.mx-next` を disabled にします。
- 番号はデッキ全体の通し番号で、2 桁にそろえます（100 以上は 3 桁）。
- アイコンはテーマの CSS が `.mx-icon` に描きます。
- 枠のボタンは、マウスで押してもフォーカスを取りません（Space が直前のボタンの押し直しにならないように）。Tab で移って押す使い方は残します。

### 3.6 目次（index）

```html
<div class="mx-index" role="dialog" aria-label="目次" hidden>
  <header class="mx-index-head">
    <p class="mx-index-deck">LLM</p>
    <h2 class="mx-index-title">次の一語から、エージェントまで</h2>
  </header>
  <div class="mx-index-chapters">
    <section class="mx-index-chapter" data-chapter="history">
      <h3 class="mx-index-chapter-title"><span class="mx-index-chapter-no">1</span>歴史</h3>
      <ol class="mx-index-clips">
        <li><button class="mx-index-clip" data-clip="shannon" aria-current="true">
          <canvas class="mx-index-thumb"></canvas>
          <span class="mx-index-no">1-3</span><span class="mx-index-name">次の文字を当てる</span>
        </button></li>
      </ol>
    </section>
  </div>
</div>
```

- ステージの領域（x 320, y 0, 1600×900）に重ねます。枠は見えたままです。
- 開く: ↑ または I、パンくずを押す。閉じる: Esc、↓、I、項目を選ぶ、目次の外（枠）を押す。
- 開いている間は再生を止め、閉じたら元の状態に戻します。項目を選んだときは、そのクリップを頭から再生します。
- 開いた直後は、現在のクリップの項目にフォーカスを置きます。矢印キーで項目を移ります（↑ ↓ は章の中、← → は隣の章の同じ段。段がなければ最後の項目）。Enter で選びます。
- 縮小図 `.mx-index-thumb`: 目次を開いたとき、まだ描いていないものを 1 フレームに 1 枚ずつ描きます。`stage.thumb = true` で setup を一度呼び、`clip.poster`（既定は duration）の時刻を描いて、すぐ dispose します。縮小先の canvas は画像補間を有効にし、品質を `high` にします。描いた縮小図は保持してかまいません。

## 4. 操作

| 操作 | キー | ほかの手段 |
|---|---|---|
| 次のクリップ | → / PageDown | `.mx-next`、左へスワイプ |
| 前のクリップ | ← / PageUp | `.mx-prev`、右へスワイプ |
| 最初 / 最後のクリップ | Home / End | |
| 再生 / 一時停止 | Space / K | ステージを押す、`.mx-play` |
| 頭から再生 | R | |
| 2 秒戻る / 進む | Shift + ← / Shift + → | |
| 章の頭へ | 1〜9 | |
| 目次を開く / 閉じる | ↑ / I（閉じるのは Esc、↓ も可） | パンくずを押す |
| 自動で次へ（切り替え） | A | `.mx-auto` |
| 全画面 | F | |

- キーの押しっぱなしによる自動リピート（`e.repeat`）は、クリップの移動では無視します。一回押すと一つ進みます。Shift + ← → のシークはリピートを受けます。
- Ctrl、Alt、Meta が付いたキーは扱いません。ブラウザの操作を奪わないためです。
- フォーカスが入力欄（input, textarea, contenteditable）にあるときは、キーを扱いません。

## 5. 再生のモデル

- **時計**: 再生中は、フレームごとに `t += min(dt, 0.1)` で進めます（dt は rAF の時刻の差、秒）。タブが隠れている間は時計を止め、戻ったら再生を続けます。
- **クリップに入る**: ← → や目次で移ったときは、いつも t = 0 から再生します。
- **終わり**: t が duration に達したら t = duration にして、`data-state="ended"` にします。最後の絵（`render(duration)`）で止まります。
- **自動で次へ**: `data-auto` のとき、ended になってから `clip.hold` 秒（既定 2.5 秒）後に次へ進みます。最後のクリップでは進みません。待っている間に何か操作があれば、待つのをやめます。
- **シーク**: t を [0, duration] に収めて描き直します。再生中なら、その位置から再生を続けます。ended から戻したときは paused にします。
- **描き直す時**: 再生中の各フレーム、シーク、リサイズ、クリップの入れ替え、フォントの読み込みの完了。止まっている間は rAF を回しません。
- **開いた直後**: フォントの読み込みを待って（§6.4）、URL の `?c=` のクリップ（なければ最初）を t = 0 から再生します。音を出さないので、ユーザーの操作を待たずに再生を始めます。

## 6. クリップの契約

```js
export default {
  id: 'shannon',                     // デッキの中で一意。URL に使う（英小文字、数字、ハイフン）
  title: '次の文字を当てる',          // 題名（rail の見出し、目次、document.title）
  kicker: '1948 · Claude Shannon',   // 任意。題名に添える一行
  duration: 14,                      // 秒。動きが終わる時刻。ここで止まる
  hold: 2.5,                         // 任意。自動で次へ進むまで、止まっている秒数
  poster: 14,                        // 任意。目次の縮小図に描く時刻（既定は duration）
  numbered: true,                    // 任意。false なら章の中の番号を振らない（扉など）
  cues: [                            // 字幕。at 秒から to 秒まで出す
    { at: 0.8, to: 5.5, text: '1948 年、シャノンは**次の文字の確率**で英文を作った。' },
  ],
  marks: [{ at: 6, label: '二次近似' }],                  // 任意。ないときは cue の at を使う
  fonts: [['600 64px "IBM Plex Sans JP"', '描く文字列']], // 任意。最初に描く前に読み込む
  setup(stage) {
    // 一度だけ呼ばれる。DOM や canvas を作り、時刻によらない準備をする
    const { ctx } = stage.canvas();
    return {
      render(t) { /* 時刻 t の絵を描く。t の純粋関数にする */ },
      dispose() { /* 任意。後片付け。層の DOM は engine が消す */ },
    };
  },
};
```

### 6.1 時刻の純粋関数

- `render(t)` の結果は t だけで決まるようにします。前のフレームの状態に頼りません。だから、シークしても、`?t=` で開いても、目次の縮小図でも、同じ時刻なら同じ絵になります。
- 乱数は種付きの関数（`src/kit` の `hash`、`mulberry32`）を使い、`Math.random` は使いません。
- 時刻によらない計算（文字の幅の測定、スプライトの作成など）は setup で済ませてかまいません。

### 6.2 stage の API

| 名前 | 内容 |
|---|---|
| `stage.W`, `stage.H` | 1600, 900（論理座標） |
| `stage.el` | このクリップの層 `.mx-layer`。DOM で描くクリップは、この中に要素を置く。CSS の 1px が論理座標の 1 にあたる |
| `stage.canvas(opts)` | 層いっぱいの canvas を作り、`{ canvas, ctx }` を返す。`opts.alpha` の既定は true。描画バッファは 1600×900 に「拡縮の倍率 × devicePixelRatio」を掛けた大きさで、倍率は 2 まで、総画素は 420 万までに抑える。engine は `render` の直前に毎回 `ctx.setTransform(s, 0, 0, s, 0, 0)` を呼ぶので、クリップは論理座標のまま描ける。消去はしないので、クリップが背景から塗る |
| `stage.still` | 静止フレームのモードなら true |
| `stage.thumb` | 目次の縮小図のための setup なら true |
| `stage.theme(name)` | テーマの CSS 変数の値を文字列で返す。例: `stage.theme('--mx-accent')` |

DOM で描くクリップのために、engine は `render` の直前に、層へ `--mx-t`（秒）と `--mx-p`（0〜1）を書きます。CSS の `calc()` で、時刻に応じた見た目を書けます。

### 6.3 字幕の書き方

- 一つの cue は 2 行まで、1 行は全角 34 字ほどまでにします。
- `**…**` で強調します（テーマのアクセント色）。`\n` で改行します。
- cue は時刻の順に並べ、なるべく重ねません。重なったときは、両方を `at` の順に出します。
- 最後の cue の `to` を `duration` より後ろにすると、終わりで止まっている間も、その字幕が出たままになります。

### 6.4 フォント

- 枠の文字は DOM なので、必要な字はブラウザが読み込みます。
- canvas に描く文字は、最初に描く前に読み込んでおく必要があります。`deck.fonts` と `clip.fonts` に `[font, text]` を並べると、engine は `document.fonts.load(font, text)` をすべて待ってから描きます。日本語の書体は unicode-range で分かれているので、実際に描く文字列を渡します。
- `deck.fonts` は起動時に一度だけ待ちます。`clip.fonts` は、そのクリップを最初に描く前に待ちます。隣のクリップの分は先回りして読み込みます。

### 6.5 失敗したとき

- setup や render が例外を投げたら、その層にエラーの札（クリップの id と例外の文）を出し、そのクリップの render はそれ以上呼びません。console.error には一度だけ出します。ナビゲーションはそのまま使えます。

## 7. デッキの契約

```js
export default {
  id: 'llm',
  title: 'LLM',                          // 短い名前（パンくずの根、document.title）
  subtitle: '次の一語から、エージェントまで', // 目次の見出し
  fonts: [/* §6.4 */],                   // 任意
  autoAdvance: false,                    // 任意。「自動で次へ」の初期値
  chapters: [
    { id: 'history', title: '歴史', clips: [opening, shannon /* … */] },
  ],
  decorate(root) {},                     // 任意。枠に飾りの DOM を足す（root は .mx）
};
```

- 章の id とクリップの id は、それぞれデッキの中で一意にします。
- 番号: 章は 1 から数えます。章の中のクリップも 1 から数え、`numbered: false` のものは数えません。通し番号（corner）は、すべてのクリップを 1 から数えます。
- ページは `createExplorer(host, deck, options)` で作ります。`options.url`（既定 true）を false にすると、URL を読みも書きもしません。戻り値は §8 の API です。

## 8. URL と確認用の契約

| パラメータ | 意味 |
|---|---|
| `?c=<clipId>` | そのクリップから開く。移動するたびに `history.replaceState` で書き換える |
| `&t=<秒>` | 静止フレームのモード。そのクリップの t 秒を、再生せずに表示する。層、題名、字幕の入れ替えの演出はしない |
| `&clean` | 枠を消し、ステージだけを画面いっぱいに出す（カバー画像などの撮影用） |
| `&auto=1` | 「自動で次へ」を有効にして開く |

静止フレームのモードでは、window に次のものを置きます。

- `window.__ready`: 最初の絵を描き終えたら true
- `window.__setTime(s)`: 同じクリップの s 秒を描き直す。枠の表示（シークバー、字幕、時刻）も合わせる
- `window.__go(clipId, s)`: 別のクリップの s 秒へ移る。描き終えたら解決する Promise を返す

トップページ（`src/home/`）は、デッキの表紙をこのモードで出します。デッキのページを `?c=<表紙のクリップ>&t=<その長さ>&clean` で iframe の中に開き、カードを指している間は親のページから `__setTime` を毎フレーム呼んで表紙のクリップを再生します。このモードの契約を変えるときは、トップページも合わせて直します。

どのモードでも、`window.__mx` に engine の API を置きます。`state()`, `go(clipId, { t })`, `next()`, `prev()`, `play()`, `pause()`, `seek(t)`, `openIndex()`, `closeIndex()`, `on(event, fn)`, `destroy()`。`state()` は `{ deck, chapter, clip, index, count, t, duration, state, auto, indexOpen }` を返します。イベントは `change`（クリップが変わった）、`state`（再生状態が変わった）、`time`（描いた）です。

## 9. 資源の扱い

- 層は同時に 2 枚までです。速い連打で移動が重なったときは、最後の目的地だけを準備し、途中のクリップは setup しません。準備中だったものは捨てます。
- 題名のかたまりは 2 つまで、字幕の要素は 4 つまでです（出ていくものを含む）。
- 縮小図は、目次が開いている間だけ、1 フレームに 1 枚作ります。閉じたら作るのをやめます。
- rAF は、再生中と、描き直しが必要なときだけ回します。

## 10. テーマの契約

テーマは CSS で、`.mx` の中の要素の見た目を自由に決めてかまいません。ただし次の二つは守ります。

- 四つの領域の位置と大きさ（§2）は変えません。
- 部品の DOM 構造（§3）に頼ってかまいません。engine はこの構造を版をまたいで保ち、変えるときは版を上げて §12 に書きます。

基本の CSS 変数。既定値は `src/explorer/explorer.css` にあり、テーマが上書きします。

| 変数 | 用途 |
|---|---|
| `--mx-bg` | 帯（レターボックス）と枠の地 |
| `--mx-stage-bg` | ステージの地 |
| `--mx-ink` | 枠の主な文字 |
| `--mx-muted` | 枠の控えめな文字 |
| `--mx-rule` | 罫線、シークバーの溝 |
| `--mx-accent` | 進み、強調、現在位置 |
| `--mx-on-accent` | アクセント色の上に載る文字 |
| `--mx-font` | 枠の書体 |
| `--mx-font-mono` | 時刻と番号の書体 |

## 11. ファイル

```
index.html, src/home/  デッキの一覧（トップページ）
src/explorer/          engine（この仕様の実装）
  index.js             createExplorer(host, deck, options)
  explorer.css         幾何と既定の見た目
src/kit/               canvas で描くクリップのための道具（緩急、種付き乱数、文字、図形）
decks/<id>/            一つのデッキ。index.html, main.js, deck.js, theme.css, clips/, README.md
tools/capture.mjs      静止フレームと連続フレームの一覧を撮る
tests/                 unit（vitest）と e2e（playwright）
```

## 12. 変更の記録

- 0.2（2026-10-10）: 再生中の字幕が毎フレームの再挿入で見えなくなる不具合を修正。枠の時刻表示・属性と層の時刻変数は値が変わるときだけ更新。目次の縮小図に高品質の画像補間を指定。DOM 構造・字幕の上限・退出とシーク時の契約は維持。既定の見た目では、題名の入れ替えで古い題名が消えてから新しい題名を入れる（同じ場所で重ねると読めないため）。トップページが §8 の静止フレームのモードを表紙に使うことを §8 に書いた。

- 0.1（2026-10-10）: 起草。
