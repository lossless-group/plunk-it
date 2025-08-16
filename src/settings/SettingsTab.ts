import { App, PluginSettingTab, Setting } from 'obsidian';
import PlunkItPlugin from '../../main';

export class SettingsTab extends PluginSettingTab {
    plugin: PlunkItPlugin;

    constructor(app: App, plugin: PlunkItPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Plunk It Settings' });

        // Plunk API Token setting
        new Setting(containerEl)
            .setName('Plunk API Token')
            .setDesc('Your Plunk API token for sending emails. Get it from useplunk.com')
            .addText(text => text
                .setPlaceholder('Enter your Plunk API token')
                .setValue(this.plugin.settings.plunkApiToken)
                .onChange(async (value) => {
                    this.plugin.settings.plunkApiToken = value;
                    await this.plugin.saveSettings();
                }));
    }
}
