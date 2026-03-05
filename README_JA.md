# Sidebar AI Chat

Obsidian のサイドバーに AI チャットパネルを追加するプラグインです。**開いているファイルを自動的にコンテキストとして送信**し、フォルダ構造に基づいて**プロジェクトごとに会話を管理**します。[OpenClaw](https://github.com/openclaw/openclaw) Gateway にネイティブ対応 + OpenAI 互換 API をサポート。

## 機能

- 💬 **サイドバーチャット** — Obsidian の右パネルで直接 AI と会話
- ⚡ **SSE ストリーミング** — デスクトップでリアルタイムにトークンを表示
- 📄 **自動ファイルコンテキスト** — 現在開いているファイルの内容を自動的に AI に送信
- 📁 **スマートプロジェクト切替** — フォルダ構造からプロジェクトを自動検出、クリック可能なパンくずリスト
- 🏠 **Vault レベルチャット** — ファイル切替に依存しないグローバルな会話
- 📝 **Markdown 履歴** — 会話をプロジェクトフォルダ内の `_chat.md` に保存（プロジェクトごとに ON/OFF 可能）
- 🔒 **チャットファイル非表示** — `_chat.md` はデフォルトでファイルエクスプローラーから非表示
- 🤖 **OpenAI 互換 API 対応** — OpenAI、Anthropic、Ollama、LM Studio、OpenRouter など
- 🦞 **OpenClaw ネイティブ対応** — [OpenClaw](https://github.com/openclaw/openclaw) Gateway との深い統合、マルチエージェントルーティング
- 📱 **モバイル対応** — iPad・スマートフォンでも利用可能
- 📚 **大容量ファイル対応** — 200KB 以上のファイルはパスのみ送信、エージェントがツールで読み取り
- ✅ **編集前確認** — エージェントはファイル編集前に変更内容を表示し、ユーザーの確認を待つ

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
   - **Default Model**：グローバルデフォルトモデル/エージェント（例：`openclaw:writer`、`gpt-4o`）
   - **Agent Vault Path**：エージェントマシン上のこの Vault の絶対パス（マルチデバイス環境用）
   - **ユーザー名 / アシスタント名**：表示名をカスタマイズ
3. 左リボンの 💬 アイコンをクリックしてチャットを開く

## OpenClaw 連携

[OpenClaw](https://github.com/openclaw/openclaw) は、複数の AI エージェントを実行できるパーソナル AI ゲートウェイです。

### なぜ OpenClaw + Obsidian？

- **マルチエージェントルーティング** — プロジェクトごとに異なるエージェント（執筆、投資分析、コーディング等）
- **フルツールアクセス** — ファイル読み書き、コマンド実行、Web 検索が可能
- **永続セッション** — セッションをまたいでコンテキストを保持
- **セルフホスト** — データはすべて自分のマシン上

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
   - **Default Model**：`openclaw:writer`（またはエージェント ID）

3. プロジェクトごとにモデルを上書き可能：
   - `openclaw:main` — メインエージェント
   - `openclaw:invest` — 投資エージェント
   - `openclaw:writer` — 執筆エージェント
   - 空欄ならグローバルデフォルトを使用

### マルチデバイス環境

Vault が Obsidian Sync や iCloud で同期される場合、デバイス間でファイルパスが異なります。**Agent Vault Path** にエージェントマシン上の絶対パスを設定してください。

### 自己署名証明書

Gateway がデフォルトの自己署名証明書を使用している場合、デスクトップ版では Node.js HTTPS（証明書検証スキップ）を使用します。モバイル版では HTTP または正式な証明書を設定してください。

## 仕組み

### SSE ストリーミング（デスクトップ）
Server-Sent Events でリアルタイムにトークンを表示。待機中はタイマーを表示。モバイル版は `requestUrl` の制限により、完全なレスポンスを返します。

### 自動ファイルコンテキスト
ファイルを開くと自動的にコンテキストとして送信。200KB 以上の大容量ファイルはパスのみ送信し、エージェントが Read ツールで読み取ります。

### スマートプロジェクト
フォルダ構造にマッピング。各プロジェクトは独立した会話を保持し、異なるモデル/エージェントを使用可能。

### 編集前確認
ファイルアクセス機能を持つエージェント接続時、変更内容を表示してユーザーの確認を待ちます。

### チャット履歴
`_chat.md` として各プロジェクトフォルダに保存。検索・リンク可能。プロジェクトごとに ON/OFF 設定可能。

## 対応 API 一覧

| プロバイダー | API URL | Model 例 |
|-------------|---------|----------|
| **OpenClaw** | `http://gateway:18789/v1` | `openclaw:writer` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Ollama | `http://localhost:11434/v1` | `llama3` |
| LM Studio | `http://localhost:1234/v1` | `local-model` |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4-20250514` |
| OpenAI 互換サービス | エンドポイント URL | モデル名 |

## ライセンス

MIT
