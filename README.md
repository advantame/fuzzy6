# fuzzy6 — Motion Explorer

短いモーションを束ね、矢印キーで行き来しながら見ていくウェブアプリです。↑ ↓ でクリップを、← → でクリップの中の止まりを移ります。左と下の L 字の枠に、パンくず、題名、シークバー、字幕、ナビを置き、残りの 1600×900 のステージでクリップを再生します。クリップには語りの音声を付けられます。枠の部品とデッキの契約は [docs/spec.md](docs/spec.md) にまとめてあります。

## 見る

手元で動かすときは、次のようにします。公開版は、URL を伝えた人にだけ見せています（2026-10-11 から。くわしくは [AGENTS.md](AGENTS.md) の「公開」）。

```bash
nvm use            # Node 24
npm ci
npm run dev        # http://127.0.0.1:5175/
```

トップページにデッキの一覧が出ます。表紙を指すと、そのデッキの扉のクリップが再生されます。

## デッキ

| デッキ | 中身 |
|---|---|
| [LLM — 次の一語から、エージェントまで](decks/llm/README.md) | LLM の歴史、基本概念、チャットボット、ツール、つなぐ先、ハーネス。続けて 2026 年までの話題として、知識を育てる（LLM Wiki）、計算と値段（KV キャッシュ、MoE）、ハーネスを鍛えて測る、開いたハーネス（DeepSeek Harness、Codex の app-server、ACP）（10 章 79 本、2026-10-10） |
| [demo](decks/demo/README.md) | engine の契約の見本（テストにも使う） |

作り方、確かめ方、決まりごとは [AGENTS.md](AGENTS.md) にあります。

## 語りの音声

音声合成: **VOICEVOX:四国めたん**

語りの音声は、[VOICEVOX](https://voicevox.hiroshiba.jp/) で合成したものです。音声には、[VOICEVOX 利用規約](https://voicevox.hiroshiba.jp/term/)と、[四国めたんの音源利用規約](https://zunko.jp/con_ongen_kiyaku.html)がかかっています。このリポジトリにあるのは合成した音声とその記録だけで、エンジンやモデルは含みません。音声を取り出して別の用途に使うことは、許諾していません。くわしくは [decks/llm/voice/README.md](decks/llm/voice/README.md) にあります。

## ライセンス

このリポジトリは、中身を見られるように公開していますが、利用を許諾するものではありません（All rights reserved）。許可なく、複製、改変、再配布、他の作品への組み込みに使うことはできません。GitHub の上での閲覧と fork、公開しているサイトの閲覧は、この限りではありません。全文は [LICENSE](LICENSE) にあります。
