# Demo deck

A minimal reference for deck authors and the browser-test fixture. The Basics chapter
contains an unnumbered opening, a deterministic canvas clock (with declared Japanese
fonts), and a DOM clip driven by `--mx-t`. Timing contains a 1.5-second clip with a
0.35-second hold, followed by overlapping subtitles demonstrating safe markup.

Every render is a function of the supplied time. Canvas clips paint their background;
DOM clips put content inside `stage.el`. `stage.canvas()` owns buffer sizing and resets
the context transform before each render. No factual external claims or sources.

2026-10-10: Created with the engine implementation for spec v0.1. The short clip is
penultimate so its auto-advance can be demonstrated. Engine API state uses deck,
chapter and clip IDs and a zero-based `index`; events receive a state snapshot.
Index ↓ moves within a chapter and closes at its final item, resolving the two
conflicting ↓ bindings in v0.1. Four simultaneously active cues are the maximum
rendered (earliest first), matching the hard DOM resource cap.

2026-10-11: Added `script`, a spec 0.3 contract fixture using the sample text from
spec §6.6. It includes spoken and silent lines, lead, tail, named and numeric rests,
stills, and anchors. The two recording speeds and durations are **examples**, not
actual narration; no voice files or external service are required. Subtitles are
derived from the script. Browser tests supply a short generated WAV when checking
audio synchronization. The fixture draws only a progress rectangle and exposes
the live stage values as data attributes for tests.

Spec 0.3 replaces the earlier index behavior: ↓ stays at the chapter's last item.
The new narration chapter follows Timing; `short` still advances to `cues`.

2026-10-11: 仕様 0.5 の配役と立ち絵の見本を追加。`duet`（「二人の語り」）では、左の `metan` と右の `zunda` が交互に話す。絵は `lib/puppet.js` の色違いで、実際のキャラクター素材ではない。最初の二文は手書きの長さと口の形、最後の文は見積もりによる口の開閉を使う。音声ファイルや合成用の話者設定はなく、無音で確認できる。`script` は左の語り手だけを出し、`duet` へ移っても左の要素を保つ。

- `?c=duet&sound=0` で通常再生、`?c=duet&t=0.5` で同じ時刻の静止画を確認する。
- `&cast=0` または `window.__mx.setCast(false)` で隠し、`setCast(true)` で戻す。
- 二人の文は「左の語り手から話します。」「次は、右の語り手です。」「録りがない文でも、口が動きます。」。動作確認用の例であり、事実や数値を説明する原稿ではない。

2026-10-14: Added the spec 0.6 dive example. `sweep` opens “時刻で何が決まる？”
at 3 seconds, including its final frame. Its `detail` dive shows a position determined
only by time, with the caption “同じ時刻なら、同じ位置に描きます。” No narration is
synthesized. Returning resumes the saved sweep time; opening `?c=detail` directly
returns to sweep at 3 seconds. Main-line numbering and navigation remain unchanged.

2026-10-14: Added the spec 0.7 join example using the existing `short` → `cues`
pair. `short` fills an orange bar; `cues` (`join: 'cut'`) starts with that same full
bar. Both use `lib/bar.js`
so `short` at 1.5 seconds and `cues` at 0 seconds have identical stage pixels.
Open `?c=short&auto=1&sound=0` to see the join after the hold, or advance from its
final frame with ↓ / →. Advancing partway through `short`, or entering `cues` via
the index, still uses the ordinary transition. No clips or voice files were added.

2026-10-14: The spec 0.8 bridge confines that retraction to the first 0.6 seconds
of `cues`. At its head the bar is already one third full, representing the first
caption. It fills to two thirds and then fully at the next caption boundaries.
Only a join from `short` plays the retraction; ↑, the index, R and `go('cues')`
start at 0.6. The existing cues remain absolute (0, 2, 5 seconds); the cue at 0
is not a stop, and the first stop is 0.6. `?c=cues&t=0` still shows the exact
joining picture. Duration remains 9 seconds including the bridge. No synthesis.
