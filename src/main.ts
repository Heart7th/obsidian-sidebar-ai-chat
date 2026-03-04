import { Plugin } from "obsidian";
import { SidebarAISettings, DEFAULT_SETTINGS, VIEW_TYPE_CHAT } from "./types";
import { ChatView } from "./ChatView";
import { SidebarAISettingsTab } from "./SettingsTab";

const HIDE_CHAT_STYLE_ID = "sidebar-ai-hide-chat-files";

export default class SidebarAIChatPlugin extends Plugin {
  settings: SidebarAISettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_CHAT, (leaf) => new ChatView(leaf, this));

    this.addRibbonIcon("message-circle", "Sidebar AI Chat", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-chat",
      name: "Open Chat",
      callback: () => this.activateView(),
    });

    this.addSettingTab(new SidebarAISettingsTab(this.app, this));

    this.updateHideChatFiles();
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CHAT);
    document.getElementById(HIDE_CHAT_STYLE_ID)?.remove();
  }

  updateHideChatFiles(): void {
    const existing = document.getElementById(HIDE_CHAT_STYLE_ID);
    if (this.settings.hideChatFiles) {
      if (!existing) {
        const style = document.createElement("style");
        style.id = HIDE_CHAT_STYLE_ID;
        style.textContent = `
          .nav-file-title[data-path$="/_chat.md"],
          .nav-file-title[data-path="_chat.md"] {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      existing?.remove();
    }
  }

  async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_CHAT);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }

    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE_CHAT, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
