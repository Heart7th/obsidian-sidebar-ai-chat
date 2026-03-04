# Obsidian OpenClaw Chat Plugin

## Overview
An Obsidian plugin that adds a sidebar chat panel connected to OpenClaw Gateway API.

## API Details
- **Endpoint**: `https://127.0.0.1:18789/v1/chat/completions` (self-signed TLS, must skip verification)
- **Auth**: `Authorization: Bearer <token>` (configured in plugin settings)
- **Agent selection**: Use `model: "openclaw:<agentId>"` or header `x-openclaw-agent-id`
- **Session persistence**: Set `user` field to a stable string to share session across calls
- **Streaming**: Set `stream: true` for SSE responses

## Required Features

### 1. Chat Sidebar
- Opens as a right sidebar panel (like Obsidian's backlinks panel)
- Message input at bottom with send button (Enter to send, Shift+Enter for newline)
- Messages displayed with user/assistant bubbles
- Markdown rendering for assistant replies
- Auto-scroll to latest message

### 2. Project Selection
- Dropdown at top of sidebar to select "project"
- Projects are defined in plugin settings as a list: `[{name: "日常", agentId: "main"}, {name: "投资", agentId: "invest"}, ...]`
- Switching project switches the agent AND the chat history file

### 3. Chat History as Markdown
- Each conversation saved as markdown in the vault
- Path: `<configurable_root>/<project_name>/chat-YYYY-MM-DD.md`
- Format:
  ```markdown
  # Chat - 2026-03-05
  
  ## 03:52
  **Vincent**: message here
  
  **Eureka**: response here
  
  ## 04:15
  **Vincent**: another message
  ```
- New day = new file automatically
- History loaded from file when switching projects

### 4. Settings
- Gateway URL (default: `https://127.0.0.1:18789`)
- Auth token
- Chat history root folder (default: `chats/`)
- Projects list: array of {name, agentId, icon?}
- Default project

### 5. Streaming
- Use SSE streaming for real-time response display
- Show typing indicator while waiting

## Tech Stack
- TypeScript
- Obsidian Plugin API
- Native fetch for HTTP requests (Obsidian uses Electron, so Node.js TLS options available)
- No external dependencies

## File Structure
```
obsidian-openclaw-chat/
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── src/
│   ├── main.ts          # Plugin entry
│   ├── ChatView.ts      # Sidebar view
│   ├── SettingsTab.ts    # Settings UI
│   ├── api.ts           # OpenClaw API client
│   ├── storage.ts       # Chat history read/write
│   └── types.ts         # TypeScript types
├── styles.css           # Chat UI styles
└── README.md
```

## Important Notes
- Gateway uses self-signed TLS certificate - must use `rejectUnauthorized: false` or equivalent
- The `user` field in chat completions request should be set to `obsidian-<projectName>` for session persistence
- Keep it simple and functional - this is a v1
