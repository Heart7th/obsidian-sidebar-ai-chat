export interface Project {
  name: string;
  model: string;       // model name (e.g. "gpt-4o", "claude-sonnet-4-20250514", "openclaw:main")
  icon?: string;
  saveHistory?: boolean; // default true
}

export interface SidebarAISettings {
  apiUrl: string;        // OpenAI-compatible endpoint
  apiKey: string;        // API key / Bearer token
  userName: string;      // display name for user messages
  assistantName: string; // display name for assistant messages
  chatRoot: string;
  projects: Project[];
  defaultProject: string;
  hideChatFiles: boolean;
}

export const DEFAULT_SETTINGS: SidebarAISettings = {
  apiUrl: "https://api.openai.com/v1",
  apiKey: "",
  userName: "User",
  assistantName: "AI",
  chatRoot: "chats/",
  projects: [{ name: "General", model: "gpt-4o" }],
  defaultProject: "General",
  hideChatFiles: true,
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export const VIEW_TYPE_CHAT = "sidebar-ai-chat-view";
