[中文文档](README_CN.md) | [日本語ドキュメント](README_JA.md)

# Sidebar AI Chat

An Obsidian plugin that adds an AI chat sidebar with **automatic file context** and **project-based conversation management**. Native **OpenClaw** Gateway support + any OpenAI-compatible API.

## Features

- 💬 **Sidebar Chat** — Chat with AI directly in Obsidian's right panel
- ⚡ **SSE Streaming** — Real-time token display as responses are generated (desktop)
- 📄 **Auto File Context** — Currently open file is automatically sent as context
- 📁 **Smart Project Switching** — Auto-detects projects from your folder structure with clickable breadcrumbs
- 🏠 **Vault-level Chat** — Global conversation that persists across all files
- 📝 **Markdown History** — Chat logs saved as `_chat.md` in each project folder (toggleable per project)
- 🔒 **Hidden Chat Files** — Chat files hidden from file explorer (toggleable)
- 🤖 **Any OpenAI-compatible API** — Works with OpenAI, Anthropic, Ollama, LM Studio, OpenRouter, and more
- 🦞 **Native OpenClaw Support** — First-class integration with [OpenClaw](https://github.com/openclaw/openclaw) Gateway for multi-agent routing
- 📱 **Mobile Support** — Works on iPad and mobile devices
- 📚 **Large File Support** — Files over 200KB send path only; agent reads via tool (no payload limits)
- ✅ **Confirmation Before Edit** — Agent asks before modifying your files

## Installation

### From Community Plugins (coming soon)
1. Open Obsidian Settings → Community plugins → Browse
2. Search "Sidebar AI Chat"
3. Click Install → Enable

### Manual Install
1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/Heart7th/obsidian-sidebar-ai-chat/releases)
2. Create folder: `<your-vault>/.obsidian/plugins/sidebar-ai-chat/`
3. Copy the 3 files into the folder
4. Restart Obsidian → Settings → Community plugins → Enable "Sidebar AI Chat"

### Build from Source
```bash
git clone https://github.com/Heart7th/obsidian-sidebar-ai-chat.git
cd obsidian-sidebar-ai-chat
npm install
npm run build
```
Copy `main.js`, `manifest.json`, `styles.css` to your vault's plugin folder.

## Setup

1. Open Settings → Sidebar AI Chat
2. Configure:
   - **API URL**: Your OpenAI-compatible endpoint
   - **API Key**: Your API key
   - **Default Model**: Global default model or agent (e.g. `openclaw:writer`, `gpt-4o`)
   - **Agent Vault Path**: Absolute path to this vault on the agent's machine (for cross-device setups)
   - **User / Assistant names**: Customize display names
3. Click the 💬 icon in the left ribbon to open the chat

## OpenClaw Integration

[OpenClaw](https://github.com/openclaw/openclaw) is a personal AI gateway that lets you run multiple AI agents with full tool access, memory, and multi-channel delivery.

### Why OpenClaw + Obsidian?

- **Multi-agent routing** — Different projects can talk to different agents (e.g. a writing assistant for docs, an investment analyst for research)
- **Full tool access** — Your agents can read files, run commands, search the web, and more
- **Persistent sessions** — Conversations maintain context across sessions via OpenClaw's session management
- **Self-hosted** — Your data stays on your machine

### OpenClaw Setup

1. Enable the HTTP API in your OpenClaw config (`~/.openclaw/openclaw.json`):
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

2. In plugin settings:
   - **API URL**: `http://<your-gateway-ip>:18789/v1` (or `https://` if TLS is enabled)
   - **API Key**: Your Gateway auth token (`gateway.auth.token`)
   - **Default Model**: `openclaw:writer` (or any agent ID)

3. Per-project model override — set the **Model** field on each project:
   - `openclaw:main` — Your main agent
   - `openclaw:invest` — Investment agent
   - `openclaw:writer` — Writing agent
   - Any agent ID defined in your OpenClaw config
   - Leave empty to use the global default

### Cross-Device Setup

When your vault syncs across devices (Obsidian Sync, iCloud, etc.), file paths differ between your editing device and the agent's machine. Set **Agent Vault Path** to the absolute path on the agent's machine:

- Agent runs on Mac mini at `/Users/Heart7/Obsidian/MyVault`
- You edit on MacBook at `/Users/heart7/Obsidian/MyVault`
- Set Agent Vault Path to `/Users/Heart7/Obsidian/MyVault`

### Self-signed Certificates

If your OpenClaw Gateway uses self-signed TLS certificates, the plugin uses Node.js HTTPS with certificate verification disabled on desktop. On mobile, use HTTP or configure a proper TLS certificate.

## How It Works

### SSE Streaming (Desktop)
On desktop, responses stream in real-time via Server-Sent Events. You see tokens appear as they're generated. A timer shows elapsed time while waiting. On mobile, responses are returned in full (Obsidian's `requestUrl` doesn't support SSE).

### Auto File Context
When you open a file in Obsidian, the plugin automatically reads its content and includes it as context. Files over 200KB send only the file path — the agent reads the content via its Read tool, supporting files of any size (novels, codebases, etc.).

### Smart Projects
Projects are mapped to your folder structure. Open a file in `Research/ML/` and the chat auto-switches to that project. Click any level in the breadcrumb to choose your preferred grouping:

> 📄 **Research** › **ML** › my-notes

Each project maintains its own conversation and can use a different model/agent.

### Confirmation Before Edit
When connected to an agent with file access (e.g. OpenClaw), the agent will show you planned changes and ask for confirmation before editing any file. No surprise modifications.

### Chat History
Conversations are saved as standard Markdown in `_chat.md` files within each project folder. They're hidden from the file explorer by default but fully searchable and linkable. You can toggle history saving per project.

## Compatible APIs

| Provider | API URL | Model Example |
|----------|---------|---------------|
| **OpenClaw** | `http://gateway:18789/v1` | `openclaw:writer` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Ollama | `http://localhost:11434/v1` | `llama3` |
| LM Studio | `http://localhost:1234/v1` | `local-model` |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4-20250514` |
| Any OpenAI-compatible | Your endpoint URL | Your model name |

## License

MIT
