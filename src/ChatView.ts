import { ItemView, WorkspaceLeaf, MarkdownRenderer, TFile } from "obsidian";
import { VIEW_TYPE_CHAT, ChatMessage, Project, SidebarAISettings } from "./types";
import { streamChat } from "./api";
import { loadHistory, appendMessage } from "./storage";
import type SidebarAIChatPlugin from "./main";

export class ChatView extends ItemView {
  plugin: SidebarAIChatPlugin;
  messages: ChatMessage[] = [];
  currentProject: Project;
  isStreaming = false;

  private messagesContainer: HTMLElement;
  private inputEl: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private projectSelect: HTMLSelectElement;
  private contextIndicator: HTMLElement;
  private activeFileContent: string | null = null;
  private activeFilePath: string | null = null;
  private fileChangeHandler: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: SidebarAIChatPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentProject = this.getDefaultProject();
  }

  getViewType(): string {
    return VIEW_TYPE_CHAT;
  }

  getDisplayText(): string {
    return "OpenClaw Chat";
  }

  getIcon(): string {
    return "message-circle";
  }

  private getDefaultProject(): Project {
    const s = this.plugin.settings;
    return (
      s.projects.find((p) => p.name === s.defaultProject) ||
      s.projects[0] || { name: "default", agentId: "main" }
    );
  }

  /** Get the vault name as global project */
  private getVaultName(): string {
    return this.app.vault.getName();
  }

  /** Get all folder levels from a file path */
  private getFolderLevelsFromPath(filePath: string): string[] {
    const parts = filePath.split("/");
    // Remove the filename
    parts.pop();
    if (parts.length === 0) return [];
    
    // Build cumulative paths: ["投资", "投资/日股", "投资/日股/分析"]
    const levels: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      levels.push(parts.slice(0, i + 1).join("/"));
    }
    return levels;
  }

  /** Get the deepest folder as default project name */
  private getProjectNameFromPath(filePath: string): string {
    const parts = filePath.split("/");
    if (parts.length > 1) {
      // Use deepest folder (immediate parent)
      return parts.slice(0, -1).join("/");
    }
    return this.plugin.settings.defaultProject || "日常";
  }

  /** Find or create a project for the given name */
  private findOrCreateProject(name: string): Project {
    const existing = this.plugin.settings.projects.find((p) => p.name === name);
    if (existing) return existing;

    // Auto-create project with default agent
    const newProject: Project = { name, agentId: "main" };
    this.plugin.settings.projects.push(newProject);
    this.plugin.saveSettings();
    return newProject;
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("openclaw-chat-container");

    // Header with project selector
    const header = container.createDiv({ cls: "openclaw-chat-header" });
    this.projectSelect = header.createEl("select", { cls: "openclaw-project-select" });
    this.rebuildProjectOptions();
    this.projectSelect.addEventListener("change", () => this.onProjectChange());

    // Context indicator (shows current file)
    this.contextIndicator = container.createDiv({ cls: "openclaw-context-indicator" });
    this.contextIndicator.style.display = "none";

    // Messages area
    this.messagesContainer = container.createDiv({ cls: "openclaw-messages" });

    // Input area
    const inputArea = container.createDiv({ cls: "openclaw-input-area" });
    this.inputEl = inputArea.createEl("textarea", {
      cls: "openclaw-input",
      attr: { placeholder: "Send a message... (Shift+Enter for newline)", rows: "1" },
    });
    this.sendBtn = inputArea.createEl("button", {
      cls: "openclaw-send-btn",
      text: "Send",
    });

    this.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.inputEl.addEventListener("input", () => {
      this.inputEl.style.height = "auto";
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + "px";
    });

    this.sendBtn.addEventListener("click", () => this.sendMessage());

    // Watch for active file changes
    this.fileChangeHandler = () => this.onActiveFileChange();
    this.app.workspace.on("active-leaf-change", this.fileChangeHandler as any);

    // Initial file detection
    await this.onActiveFileChange();

    // Load history
    await this.loadCurrentHistory();
  }

  private async onActiveFileChange(): Promise<void> {
    // Only track markdown editor leaves, ignore sidebar/chat panel clicks
    const activeLeaf = this.app.workspace.activeLeaf;
    if (activeLeaf?.getViewState()?.type === VIEW_TYPE_CHAT) {
      // User clicked on the chat sidebar — keep the previous file context
      return;
    }

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      // Don't clear context if no file is active (e.g. sidebar focused)
      if (!this.activeFilePath) {
        this.contextIndicator.style.display = "none";
      }
      return;
    }

    // Skip chat history files
    if (activeFile.path.endsWith("_chat.md")) {
      return;
    }

    this.activeFilePath = activeFile.path;

    // Read file content (truncate if too long)
    try {
      const content = await this.app.vault.read(activeFile);
      this.activeFileContent = content;
    } catch {
      this.activeFileContent = null;
    }

    // Update context indicator with clickable breadcrumbs
    this.contextIndicator.style.display = "flex";
    this.contextIndicator.empty();

    const icon = this.contextIndicator.createSpan({ cls: "openclaw-context-icon" });
    icon.setText("📄");

    const breadcrumbs = this.contextIndicator.createSpan({ cls: "openclaw-breadcrumbs" });
    const folderLevels = this.getFolderLevelsFromPath(activeFile.path);

    if (folderLevels.length > 0) {
      folderLevels.forEach((level, idx) => {
        const folderName = level.split("/").pop() || level;
        const crumb = breadcrumbs.createSpan({ cls: "openclaw-breadcrumb" });
        crumb.setText(folderName);
        // Highlight the currently selected project level
        if (level === this.currentProject.name) {
          crumb.addClass("openclaw-breadcrumb-active");
        }
        crumb.addEventListener("click", () => this.switchToProjectLevel(level));
        
        if (idx < folderLevels.length - 1) {
          breadcrumbs.createSpan({ cls: "openclaw-breadcrumb-sep", text: " › " });
        }
      });
      breadcrumbs.createSpan({ cls: "openclaw-breadcrumb-sep", text: " › " });
    }
    
    const fileLabel = breadcrumbs.createSpan({ cls: "openclaw-breadcrumb-file" });
    fileLabel.setText(activeFile.basename);

    // Auto-switch project based on deepest folder
    const projectName = this.getProjectNameFromPath(activeFile.path);
    if (projectName !== this.currentProject.name) {
      const project = this.findOrCreateProject(projectName);
      this.currentProject = project;
      this.rebuildProjectOptions();
      this.messages = [];
      this.messagesContainer.empty();
      await this.loadCurrentHistory();
    }
  }

  private async switchToProjectLevel(level: string): Promise<void> {
    if (level === this.currentProject.name) return;
    const project = this.findOrCreateProject(level);
    this.currentProject = project;
    this.rebuildProjectOptions();
    this.messages = [];
    this.messagesContainer.empty();
    await this.loadCurrentHistory();
    // Re-render breadcrumbs to update active highlight
    if (this.activeFilePath) {
      this.updateBreadcrumbHighlight();
    }
  }

  private updateBreadcrumbHighlight(): void {
    const crumbs = this.contextIndicator.querySelectorAll(".openclaw-breadcrumb");
    const folderLevels = this.activeFilePath ? this.getFolderLevelsFromPath(this.activeFilePath) : [];
    crumbs.forEach((crumb, idx) => {
      if (idx < folderLevels.length && folderLevels[idx] === this.currentProject.name) {
        crumb.addClass("openclaw-breadcrumb-active");
      } else {
        crumb.removeClass("openclaw-breadcrumb-active");
      }
    });
  }

  private rebuildProjectOptions(): void {
    this.projectSelect.empty();

    // Always show vault-level global project first
    const vaultName = this.getVaultName();
    this.findOrCreateProject(vaultName); // ensure it exists

    // Vault project first, then the rest (deduplicated)
    const seen = new Set<string>();
    const ordered: Project[] = [];

    const vaultProject = this.plugin.settings.projects.find((p) => p.name === vaultName);
    if (vaultProject) {
      ordered.push(vaultProject);
      seen.add(vaultName);
    }

    for (const project of this.plugin.settings.projects) {
      if (!seen.has(project.name)) {
        ordered.push(project);
        seen.add(project.name);
      }
    }

    for (const project of ordered) {
      const displayName = project.name === vaultName
        ? `🏠 ${project.name}`
        : project.icon ? `${project.icon} ${project.name}` : project.name;
      const opt = this.projectSelect.createEl("option", {
        text: displayName,
        value: project.name,
      });
      if (project.name === this.currentProject.name) {
        opt.selected = true;
      }
    }
  }

  private async onProjectChange(): Promise<void> {
    const name = this.projectSelect.value;
    const project = this.plugin.settings.projects.find((p) => p.name === name);
    if (project) {
      this.currentProject = project;
      this.messages = [];
      this.messagesContainer.empty();
      await this.loadCurrentHistory();
    }
  }

  private async loadCurrentHistory(): Promise<void> {
    this.messages = await loadHistory(
      this.app.vault,
      this.plugin.settings,
      this.currentProject.name,
      this.getVaultName()
    );
    this.renderAllMessages();
  }

  private renderAllMessages(): void {
    this.messagesContainer.empty();
    for (const msg of this.messages) {
      this.renderMessage(msg);
    }
    this.scrollToBottom();
  }

  private renderMessage(msg: ChatMessage): HTMLElement {
    const bubble = this.messagesContainer.createDiv({
      cls: `openclaw-message openclaw-message-${msg.role}`,
    });
    const label = bubble.createDiv({ cls: "openclaw-message-label" });
    label.setText(msg.role === "user" ? this.plugin.settings.userName : this.plugin.settings.assistantName);
    const body = bubble.createDiv({ cls: "openclaw-message-body" });

    if (msg.role === "assistant") {
      MarkdownRenderer.render(this.app, msg.content, body, "", this.plugin);
    } else {
      body.setText(msg.content);
    }

    return bubble;
  }

  private createStreamingBubble(): { bubble: HTMLElement; body: HTMLElement } {
    const bubble = this.messagesContainer.createDiv({
      cls: "openclaw-message openclaw-message-assistant",
    });
    const label = bubble.createDiv({ cls: "openclaw-message-label" });
    label.setText(this.plugin.settings.assistantName);
    const body = bubble.createDiv({ cls: "openclaw-message-body" });
    body.addClass("openclaw-streaming");
    body.setText("●●●");
    return { bubble, body };
  }

  private scrollToBottom(): void {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private async sendMessage(): Promise<void> {
    const text = this.inputEl.value.trim();
    if (!text || this.isStreaming) return;

    this.isStreaming = true;
    this.sendBtn.disabled = true;
    this.inputEl.value = "";
    this.inputEl.style.height = "auto";

    // Add user message
    const userMsg: ChatMessage = { role: "user", content: text };
    this.messages.push(userMsg);
    this.renderMessage(userMsg);
    this.scrollToBottom();

    if (this.currentProject.saveHistory !== false) {
      await appendMessage(
        this.app.vault,
        this.plugin.settings,
        this.currentProject.name,
        this.getVaultName(),
        "user",
        text
      );
    }

    const { body } = this.createStreamingBubble();
    let fullResponse = "";

    // Show elapsed time while waiting
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      if (!fullResponse) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        body.setText(`Thinking... ${elapsed}s`);
      }
    }, 1000);

    // Build messages for API
    const apiMessages: { role: string; content: string }[] = [];

    // Add system context with current file if available
    if (this.activeFileContent && this.activeFilePath) {
      apiMessages.push({
        role: "system",
        content: `You are responding via an Obsidian sidebar chat plugin. The user wants you to help write and edit their notes.\n\nThe user is currently viewing/editing this file in Obsidian:\n\nFile: ${this.activeFilePath}\n\nFile content:\n\`\`\`\n${this.activeFileContent}\n\`\`\`\n\nRULES:\n1. Unless the user explicitly specifies a different file, ALL writing/editing tasks target THIS file (${this.activeFilePath}).\n2. BEFORE editing any file, you MUST first show the user what you plan to write/change and ask for confirmation. For example: "I'll add the following paragraph after section X: [content]. Shall I go ahead?"\n3. Only after the user confirms (e.g. "yes", "go ahead", "ok", "好", "可以", "改吧") should you use Edit/Write tools to apply the changes.\n4. For simple questions, discussions, or summaries: just reply with text, no confirmation needed.\n5. Never edit files without explicit user approval.`,
      });
    }

    // Add recent chat history
    const recentMessages = this.messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    apiMessages.push(...recentMessages);

    try {
      await streamChat(
        this.plugin.settings.apiUrl,
        this.plugin.settings.apiKey,
        this.currentProject.model,
        apiMessages,
        this.currentProject.name,
        {
          onToken: (token: string) => {
            fullResponse += token;
            body.removeClass("openclaw-streaming");
            body.empty();
            MarkdownRenderer.render(this.app, fullResponse, body, "", this.plugin);
            this.scrollToBottom();
          },
          onDone: () => {},
          onError: (err: Error) => {
            body.removeClass("openclaw-streaming");
            body.empty();
            body.setText(`Error: ${err.message}`);
            body.addClass("openclaw-error");
          },
        }
      );

      if (fullResponse) {
        const assistantMsg: ChatMessage = { role: "assistant", content: fullResponse };
        this.messages.push(assistantMsg);
        if (this.currentProject.saveHistory !== false) {
          await appendMessage(
            this.app.vault,
            this.plugin.settings,
            this.currentProject.name,
            this.getVaultName(),
            "assistant",
            fullResponse
          );
        }
      }
    } catch (err: any) {
      if (!fullResponse) {
        body.removeClass("openclaw-streaming");
        body.empty();
        body.setText(`Error: ${err.message}`);
        body.addClass("openclaw-error");
      }
    } finally {
      clearInterval(timerInterval);
      this.isStreaming = false;
      this.sendBtn.disabled = false;
      this.inputEl.focus();
    }
  }

  async onClose(): Promise<void> {
    if (this.fileChangeHandler) {
      this.app.workspace.off("active-leaf-change", this.fileChangeHandler as any);
    }
  }
}
