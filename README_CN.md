# Sidebar AI Chat

一款 Obsidian 插件，在侧边栏添加 AI 聊天面板，**自动读取当前文件作为上下文**，按文件夹**自动管理项目对话**。原生支持 [OpenClaw](https://github.com/openclaw/openclaw) Gateway + 兼容任何 OpenAI API。

## 功能特性

- 💬 **侧边栏聊天** — 在 Obsidian 右侧面板直接与 AI 对话
- ⚡ **SSE 流式输出** — 桌面端实时逐字显示回复内容
- 📄 **自动文件上下文** — 当前打开的文件内容自动作为上下文发送给 AI
- 📁 **智能项目切换** — 根据文件夹结构自动检测项目，支持可点击的面包屑导航
- 🏠 **全局聊天** — 以 Vault 名称命名的全局对话，不随文件切换
- 📝 **Markdown 聊天记录** — 对话保存为项目目录下的 `_chat.md`，可按项目开关
- 🔒 **隐藏聊天文件** — `_chat.md` 默认在文件管理器中隐藏（可切换）
- 🤖 **兼容任何 OpenAI API** — 支持 OpenAI、Anthropic、Ollama、LM Studio、OpenRouter 等
- 🦞 **原生 OpenClaw 支持** — 与 [OpenClaw](https://github.com/openclaw/openclaw) Gateway 深度集成，支持多 Agent 路由
- 📱 **移动端支持** — iPad 和手机均可使用
- 📚 **大文件支持** — 超过 200KB 的文件只发送路径，Agent 通过工具自行读取（无大小限制）
- ✅ **编辑前确认** — Agent 编辑文件前先展示修改内容，经用户确认后执行

## 安装

### 从社区插件安装（即将上线）
1. 打开 Obsidian 设置 → 第三方插件 → 浏览
2. 搜索 "Sidebar AI Chat"
3. 点击安装 → 启用

### 手动安装
1. 从 [最新 Release](https://github.com/Heart7th/obsidian-sidebar-ai-chat/releases) 下载 `main.js`、`manifest.json`、`styles.css`
2. 在你的 Vault 中创建文件夹：`<vault>/.obsidian/plugins/sidebar-ai-chat/`
3. 将 3 个文件复制到该文件夹
4. 重启 Obsidian → 设置 → 第三方插件 → 启用 "Sidebar AI Chat"

### 从源码构建
```bash
git clone https://github.com/Heart7th/obsidian-sidebar-ai-chat.git
cd obsidian-sidebar-ai-chat
npm install
npm run build
```
将 `main.js`、`manifest.json`、`styles.css` 复制到 Vault 的插件目录。

## 快速开始

1. 打开 设置 → Sidebar AI Chat
2. 配置：
   - **API URL**：你的 API 端点
   - **API Key**：API 密钥
   - **Default Model**：全局默认模型或 Agent（如 `openclaw:writer`、`gpt-4o`）
   - **Agent Vault Path**：此 Vault 在 Agent 机器上的绝对路径（跨设备使用时需要）
   - **用户名 / 助手名**：自定义显示名称
3. 点击左侧功能栏的 💬 图标打开聊天

## OpenClaw 集成

[OpenClaw](https://github.com/openclaw/openclaw) 是一个私人 AI 网关，可以运行多个 AI Agent，支持完整的工具调用、记忆系统和多渠道投递。

### 为什么用 OpenClaw + Obsidian？

- **多 Agent 路由** — 不同项目可以对接不同的 Agent（比如写作助手、投资分析师、编程助手）
- **完整工具能力** — Agent 可以读写文件、执行命令、搜索网络等
- **持久化会话** — 通过 OpenClaw 的 Session 管理，对话上下文跨会话保持
- **自托管** — 数据完全在你自己的机器上

### OpenClaw 配置方法

1. 在 OpenClaw 配置文件（`~/.openclaw/openclaw.json`）中启用 HTTP API：
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

2. 在插件设置中填写：
   - **API URL**：`http://<网关IP>:18789/v1`（开启 TLS 时用 `https://`）
   - **API Key**：Gateway 认证 Token（`gateway.auth.token`）
   - **Default Model**：`openclaw:writer`（或其他 Agent ID）

3. 各项目可单独设置 Model 覆盖全局默认：
   - `openclaw:main` — 主 Agent
   - `openclaw:invest` — 投资 Agent
   - `openclaw:writer` — 写作 Agent
   - 支持你在 OpenClaw 中定义的任意 Agent ID
   - 留空则使用全局默认

### 跨设备使用

当 Vault 通过 Obsidian Sync、iCloud 等在多台设备间同步时，文件路径会不一样。设置 **Agent Vault Path** 为 Agent 所在机器上的绝对路径：

- Agent 在 Mac mini 上：`/Users/Heart7/Obsidian/MyVault`
- 你在 MacBook 上编辑：`/Users/heart7/Obsidian/MyVault`
- 填写：`/Users/Heart7/Obsidian/MyVault`

### 自签名证书

如果 OpenClaw Gateway 使用自签名 TLS 证书，桌面端自动使用 Node.js HTTPS（跳过证书验证）。移动端请使用 HTTP 或配置正式证书。

## 工作原理

### SSE 流式输出（桌面端）
桌面端通过 Server-Sent Events 实时流式输出，逐字显示回复。等待时显示计时器。移动端因 `requestUrl` 限制，回复完整返回。

### 自动文件上下文
打开文件时，插件自动读取内容作为上下文。超过 200KB 的大文件只发送路径，Agent 通过 Read 工具自行读取，支持任意大小的文件（小说、代码库等）。

### 智能项目
项目映射到文件夹结构。打开 `研究/机器学习/` 下的文件，聊天自动切换到对应项目。每个项目维护独立的对话，可以使用不同的模型/Agent。

### 编辑前确认
连接到有文件操作能力的 Agent（如 OpenClaw）时，Agent 会先展示计划的修改内容并征求确认。不会未经同意修改文件。

### 聊天记录
对话保存为标准 Markdown 格式的 `_chat.md` 文件，存放在每个项目目录下。默认在文件管理器中隐藏，但完全可搜索、可链接。每个项目可单独开关记录保存。

## 兼容 API 列表

| 服务商 | API URL | Model 示例 |
|--------|---------|------------|
| **OpenClaw** | `http://gateway:18789/v1` | `openclaw:writer` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Ollama | `http://localhost:11434/v1` | `llama3` |
| LM Studio | `http://localhost:1234/v1` | `local-model` |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4-20250514` |
| 任何 OpenAI 兼容服务 | 你的端点 URL | 你的模型名 |

## 开源协议

MIT
