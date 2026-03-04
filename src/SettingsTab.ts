import { App, PluginSettingTab, Setting } from "obsidian";
import type SidebarAIChatPlugin from "./main";

export class SidebarAISettingsTab extends PluginSettingTab {
  plugin: SidebarAIChatPlugin;

  constructor(app: App, plugin: SidebarAIChatPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Sidebar AI Chat" });

    new Setting(containerEl)
      .setName("API URL")
      .setDesc("OpenAI-compatible API endpoint (e.g. https://api.openai.com/v1)")
      .addText((text) =>
        text
          .setPlaceholder("https://api.openai.com/v1")
          .setValue(this.plugin.settings.apiUrl)
          .onChange(async (value) => {
            this.plugin.settings.apiUrl = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Bearer token for authentication")
      .addText((text) => {
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = "password";
      });

    new Setting(containerEl)
      .setName("User name")
      .setDesc("Display name for your messages")
      .addText((text) =>
        text
          .setPlaceholder("User")
          .setValue(this.plugin.settings.userName)
          .onChange(async (value) => {
            this.plugin.settings.userName = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Assistant name")
      .setDesc("Display name for AI responses")
      .addText((text) =>
        text
          .setPlaceholder("AI")
          .setValue(this.plugin.settings.assistantName)
          .onChange(async (value) => {
            this.plugin.settings.assistantName = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default project")
      .setDesc("Default project to open on start")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.defaultProject)
          .onChange(async (value) => {
            this.plugin.settings.defaultProject = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Hide chat files")
      .setDesc("Hide _chat.md files from the file explorer")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.hideChatFiles)
          .onChange(async (value) => {
            this.plugin.settings.hideChatFiles = value;
            await this.plugin.saveSettings();
            this.plugin.updateHideChatFiles();
          })
      );

    // Projects list
    containerEl.createEl("h3", { text: "Projects" });
    containerEl.createEl("p", {
      text: "Projects are also auto-created from folder names when you open files.",
      cls: "setting-item-description",
    });

    this.plugin.settings.projects.forEach((project, index) => {
      new Setting(containerEl)
        .setName(`Project ${index + 1}`)
        .addText((text) =>
          text
            .setPlaceholder("Name")
            .setValue(project.name)
            .onChange(async (value) => {
              this.plugin.settings.projects[index].name = value;
              await this.plugin.saveSettings();
            })
        )
        .addText((text) =>
          text
            .setPlaceholder("Model")
            .setValue(project.model)
            .onChange(async (value) => {
              this.plugin.settings.projects[index].model = value;
              await this.plugin.saveSettings();
            })
        )
        .addToggle((toggle) =>
          toggle
            .setTooltip("Save chat history")
            .setValue(project.saveHistory !== false)
            .onChange(async (value) => {
              this.plugin.settings.projects[index].saveHistory = value;
              await this.plugin.saveSettings();
            })
        )
        .addExtraButton((btn) =>
          btn.setIcon("trash").onClick(async () => {
            this.plugin.settings.projects.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          })
        );
    });

    new Setting(containerEl).addButton((btn) =>
      btn.setButtonText("Add Project").onClick(async () => {
        this.plugin.settings.projects.push({ name: "", model: "gpt-4o" });
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
}
