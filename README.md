# fuzzy6 — Motion Explorer

短いモーションを束ね、← と → で行き来しながら見ていくウェブアプリです。左と下の L 字の枠に、パンくず、題名、シークバー、字幕、ナビを置き、残りの 1600×900 のステージでクリップを再生します。枠の部品とデッキの契約は [docs/spec.md](docs/spec.md) にまとめてあります。

## 見る

公開版は <https://advantame.github.io/fuzzy6/> で見られます。手元で動かすときは、次のようにします。

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
