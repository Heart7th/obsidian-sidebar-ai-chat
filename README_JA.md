# Sidebar AI Chat

Obsidian のサイドバーに AI チャットパネルを追加するプラグインです。**開いているファイルを自動的にコンテキストとして送信**し、フォルダ構造に基づいて**プロジェクトごとに会話を管理**します。[OpenClaw](https://github.com/openclaw/openclaw) Gateway にネイティブ対応 + OpenAI 互換 API をサポート。

## 機能

- 💬 **サイドバーチャット** — Obsidian の右パネルで直接 AI と会話
- 📄 **自動ファイルコンテキスト** — 現在開いているファイルの内容を自動的に AI に送信
- 📁 **スマートプロジェクト切替** — フォルダ構造からプロジェクトを自動検出、クリック可能なパンくずリストで階層を選択
- 🏠 **Vault レベルチャット** — ファイル切替に依存しないグローバルな会話
- 📝 **Markdown 履歴** — 会話をプロジェクトフォルダ内の `_chat.md` に保存（プロジェクトごとに ON/OFF 可能）
- 🔒 **チャットファイル非表示** — `_chat.md` はデフォルトでファイルエクスプローラーから非表示（切替可能）
- 🤖 **OpenAI 互換 API 対応** — OpenAI、Anthropic、Ollama、LM Studio、OpenRouter など
- 🦞 **OpenClaw ネイティブ対応** — [OpenClaw](https://github.com/openclaw/openclaw) Gateway との深い統合、マルチエージェントルーティング対応
- 📱 **モバイル対応** — iPad・スマートフォンでも利用可能

## インストール

### コミュニティプラグインから（近日公開）
1. Obsidian 設定 → コミュニティプラグイン → 閲覧
2. "Sidebar AI Chat" を検索
3. インストール → 有効化

### 手動インストール
1. [最新リリース](https://github.com/Heart7th/obsidian-sidebar-ai-chat/releases) から `main.js`、`manifest.json`、`styles.css` をダウンロード
2. Vault にフォルダを作成：`<vault>/.obsidian/plugins/sidebar-ai-chat/`
3. 3つのファイルをフォルダにコピー
4. Obsidian を再起動 → 設定 → コミュニティプラグイン → "Sidebar AI Chat" を有効化

### ソースからビルド
```bash
git clone https://github.com/Heart7th/obsidian-sidebar-ai-chat.git
cd obsidian-sidebar-ai-chat
npm install
npm run build
```
`main.js`、`manifest.json`、`styles.css` を Vault のプラグインフォルダにコピー。

## セットアップ

1. 設定 → Sidebar AI Chat を開く
2. 設定項目：
   - **API URL**：API エンドポイント
   - **API Key**：API キー
   - **ユーザー名 / アシスタント名**：表示名をカスタマイズ
4. 左リボンの 💬 アイコンをクリックしてチャットを開く

## OpenClaw 連携

[OpenClaw](https://github.com/openclaw/openclaw) は、複数の AI エージェントを実行できるパーソナル AI ゲートウェイです。ツール呼び出し、メモリシステム、マルチチャネル配信をサポートしています。

### なぜ OpenClaw + Obsidian？

- **マルチエージェントルーティング** — プロジェクトごとに異なるエージェントを割り当て（例：執筆アシスタント、投資アナリスト、コーディングアシスタント）
- **フルツールアクセス** — エージェントはファイル読み書き、コマンド実行、Web 検索などが可能
- **永続セッション** — OpenClaw のセッション管理により、セッションをまたいでコンテキストを保持
- **セルフホスト** — データはすべて自分のマシン上に保管

### OpenClaw の設定方法

1. OpenClaw 設定ファイル（`~/.openclaw/openclaw.json`）で HTTP API を有効化：
   ```json
   {
     "gateway": {
       "http": {
         "endpoints": {
           "chatCompletions": { "enabled": true }
         }
       }
     }
   }
   ```

2. プラグイン設定で入力：
   - **API URL**：`http://<ゲートウェイIP>:18789/v1`（TLS 有効時は `https://`）
   - **API Key**：Gateway 認証トークン（`gateway.auth.token`）

3. 各プロジェクトの **Model** に `openclaw:<agentId>` を設定：
   - `openclaw:main` — メインエージェント
   - `openclaw:invest` — 投資エージェント
   - `openclaw:writer` — 執筆エージェント
   - OpenClaw で定義した任意のエージェント ID に対応

### 自己署名証明書

OpenClaw Gateway がデフォルトの自己署名 TLS 証明書を使用している場合、デスクトップ版では Node.js HTTPS（証明書検証スキップ）に自動フォールバックします。モバイル版では HTTP を使用するか、正式な TLS 証明書を設定してください。

## 仕組み

### 自動ファイルコンテキスト
Obsidian でファイルを開くと、プラグインが自動的にファイル内容を読み取り、AI へのコンテキストとして送信します。「このノートを要約して」「ここに足りないものは？」と聞けば、AI はあなたが見ている内容を把握しています。

### スマートプロジェクト
プロジェクトはフォルダ構造にマッピングされます。`研究/ML/` 内のファイルを開くと、チャットは自動的にそのプロジェクトに切り替わります。パンくずリストの任意の階層をクリックして、お好みのプロジェクト粒度を選択：

> 📄 **研究** › **ML** › ノート

各プロジェクトは独立した会話を保持し、異なるモデルを使用できます。

### チャット履歴
会話は標準 Markdown 形式の `_chat.md` ファイルとして各プロジェクトフォルダに保存されます。デフォルトではファイルエクスプローラーから非表示ですが、検索やリンクは可能です。プロジェクトごとに履歴保存の ON/OFF を設定できます。

## 対応 API 一覧

| プロバイダー | API URL | Model 例 |
|-------------|---------|----------|
| **OpenClaw** | `http://gateway:18789/v1` | `openclaw:main` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Ollama | `http://localhost:11434/v1` | `llama3` |
| LM Studio | `http://localhost:1234/v1` | `local-model` |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4-20250514` |
| OpenAI 互換サービス | エンドポイント URL | モデル名 |

## ライセンス

MIT
