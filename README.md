# Sidebar AI Chat

An Obsidian plugin that adds an AI chat sidebar with **automatic file context** and **project-based conversation management**.

## Features

- 💬 **Sidebar Chat** — Chat with AI directly in Obsidian's right panel
- 📄 **Auto File Context** — Currently open file is automatically sent as context
- 📁 **Smart Project Switching** — Auto-detects projects from your folder structure with clickable breadcrumbs
- 🏠 **Vault-level Chat** — Global conversation that persists across all files
- 📝 **Markdown History** — Chat logs saved as `_chat.md` in each project folder (toggleable per project)
- 🔒 **Hidden Chat Files** — Chat files hidden from file explorer (toggleable)
- 🤖 **Any OpenAI-compatible API** — Works with OpenAI, Anthropic, Ollama, LM Studio, OpenRouter, and more

## Setup

1. Install the plugin
2. Open Settings → Sidebar AI Chat
3. Configure:
   - **API URL**: Your OpenAI-compatible endpoint (e.g. `https://api.openai.com/v1`)
   - **API Key**: Your API key
   - **User / Assistant names**: Customize display names
4. Click the 💬 icon in the left ribbon to open the chat

## How It Works

### Auto File Context
When you open a file in Obsidian, the plugin automatically reads its content and includes it as context in your chat. Ask "summarize this note" or "what's missing here?" and the AI knows exactly what you're looking at.

### Smart Projects
Projects are mapped to your folder structure. Open a file in `Research/ML/` and the chat auto-switches to that project. Click any level in the breadcrumb to choose your preferred grouping:

> 📄 **Research** › **ML** › my-notes

Each project maintains its own conversation and can use a different model.

### Chat History
Conversations are saved as standard Markdown in `_chat.md` files within each project folder. They're hidden from the file explorer by default but fully searchable and linkable.

## Compatible APIs

| Provider | API URL |
|----------|---------|
| OpenAI | `https://api.openai.com/v1` |
| Anthropic (via proxy) | Your proxy URL |
| Ollama | `http://localhost:11434/v1` |
| LM Studio | `http://localhost:1234/v1` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| OpenClaw | `https://your-gateway:18789/v1` |

Any service that implements the OpenAI Chat Completions API format will work.

## License

MIT
