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
