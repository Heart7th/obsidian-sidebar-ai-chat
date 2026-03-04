import { Vault, TFile, normalizePath } from "obsidian";
import { ChatMessage, SidebarAISettings } from "./types";

function getDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function getChatFilePath(chatRoot: string, projectName: string, vaultName: string): string {
  if (projectName === vaultName) {
    return normalizePath("_chat.md");
  }
  return normalizePath(`${projectName}/_chat.md`);
}

async function ensureFolder(vault: Vault, path: string): Promise<void> {
  const parts = path.split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const normalized = normalizePath(current);
    const existing = vault.getAbstractFileByPath(normalized);
    if (!existing) {
      await vault.createFolder(normalized);
    }
  }
}

export async function appendMessage(
  vault: Vault,
  settings: SidebarAISettings,
  projectName: string,
  vaultName: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const filePath = getChatFilePath(settings.chatRoot, projectName, vaultName);
  const folderPath = filePath.includes("/") ? filePath.substring(0, filePath.lastIndexOf("/")) : null;
  if (folderPath) {
    await ensureFolder(vault, folderPath);
  }

  const date = getDateStr();
  const time = getTimeStr();
  const sender = role === "user" ? settings.userName : settings.assistantName;
  const line = `\n### ${date} ${time}\n**${sender}**: ${content}\n`;

  let file = vault.getAbstractFileByPath(filePath);
  if (!file) {
    const header = `# Chat\n`;
    await vault.create(filePath, header + line);
  } else if (file instanceof TFile) {
    await vault.append(file, line);
  }
}

export async function loadHistory(
  vault: Vault,
  settings: SidebarAISettings,
  projectName: string,
  vaultName: string
): Promise<ChatMessage[]> {
  const filePath = getChatFilePath(settings.chatRoot, projectName, vaultName);
  const file = vault.getAbstractFileByPath(filePath);
  if (!file || !(file instanceof TFile)) return [];

  const content = await vault.read(file);
  return parseHistory(content, settings);
}

function parseHistory(content: string, settings: SidebarAISettings): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const blocks = content.split(/\n### \d{4}-\d{2}-\d{2} \d{2}:\d{2}\n/);

  const userPattern = new RegExp(`^\\*\\*${escapeRegex(settings.userName)}\\*\\*:\\s*([\\s\\S]*?)(?=\\n\\*\\*${escapeRegex(settings.assistantName)}\\*\\*:|$)`);
  const assistantPattern = new RegExp(`\\*\\*${escapeRegex(settings.assistantName)}\\*\\*:\\s*([\\s\\S]*?)$`);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    const userMatch = block.match(userPattern);
    const assistantMatch = block.match(assistantPattern);

    if (userMatch) {
      messages.push({ role: "user", content: userMatch[1].trim() });
    }
    if (assistantMatch) {
      messages.push({ role: "assistant", content: assistantMatch[1].trim() });
    }
  }

  return messages;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
