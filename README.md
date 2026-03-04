[中文文档](README_CN.md)

# Sidebar AI Chat

An Obsidian plugin that adds an AI chat sidebar with **automatic file context** and **project-based conversation management**. Native **OpenClaw** Gateway support + any OpenAI-compatible API.

## Features

- 💬 **Sidebar Chat** — Chat with AI directly in Obsidian's right panel
- 📄 **Auto File Context** — Currently open file is automatically sent as context
- 📁 **Smart Project Switching** — Auto-detects projects from your folder structure with clickable breadcrumbs
- 🏠 **Vault-level Chat** — Global conversation that persists across all files
- 📝 **Markdown History** — Chat logs saved as `_chat.md` in each project folder (toggleable per project)
- 🔒 **Hidden Chat Files** — Chat files hidden from file explorer (toggleable)
- 🤖 **Any OpenAI-compatible API** — Works with OpenAI, Anthropic, Ollama, LM Studio, OpenRouter, and more
- 🦞 **Native OpenClaw Support** — First-class integration with [OpenClaw](https://github.com/openclaw/openclaw) Gateway for multi-agent routing
- 📱 **Mobile Support** — Works on iPad and mobile devices

## Setup

1. Install the plugin
2. Open Settings → Sidebar AI Chat
3. Configure:
   - **API URL**: Your OpenAI-compatible endpoint
   - **API Key**: Your API key
   - **User / Assistant names**: Customize display names
4. Click the 💬 icon in the left ribbon to open the chat

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

3. For each project, set the **Model** to `openclaw:<agentId>`:
   - `openclaw:main` — Your main agent
   - `openclaw:invest` — Investment agent
   - `openclaw:writer` — Writing agent
   - Any agent ID defined in your OpenClaw config

### Self-signed Certificates

If your OpenClaw Gateway uses self-signed TLS certificates (the default), the plugin automatically falls back to Node.js HTTPS with certificate verification disabled on desktop. On mobile, use HTTP or configure a proper TLS certificate.

## How It Works

### Auto File Context
When you open a file in Obsidian, the plugin automatically reads its content and includes it as context in your chat. Ask "summarize this note" or "what's missing here?" and the AI knows exactly what you're looking at.

### Smart Projects
Projects are mapped to your folder structure. Open a file in `Research/ML/` and the chat auto-switches to that project. Click any level in the breadcrumb to choose your preferred grouping:

> 📄 **Research** › **ML** › my-notes

Each project maintains its own conversation and can use a different model.

### Chat History
Conversations are saved as standard Markdown in `_chat.md` files within each project folder. They're hidden from the file explorer by default but fully searchable and linkable. You can toggle history saving per project.

## Compatible APIs

| Provider | API URL | Model Example |
|----------|---------|---------------|
| **OpenClaw** | `http://gateway:18789/v1` | `openclaw:main` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Ollama | `http://localhost:11434/v1` | `llama3` |
| LM Studio | `http://localhost:1234/v1` | `local-model` |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4-20250514` |
| Any OpenAI-compatible | Your endpoint URL | Your model name |

## License

MIT
