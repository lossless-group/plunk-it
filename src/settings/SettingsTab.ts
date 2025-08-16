import { App, PluginSettingTab, Setting } from 'obsidian';
import StarterPlugin from '../../main';

export class SettingsTab extends PluginSettingTab {
    plugin: StarterPlugin;

    constructor(app: App, plugin: StarterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Plugin Settings' });

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

        // API Key setting (existing)
        new Setting(containerEl)
            .setName('API Key')
            .setDesc('Your API key for other services')
            .addText(text => text
                .setPlaceholder('Enter your API key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        // Base URL setting (existing)
        new Setting(containerEl)
            .setName('Base URL')
            .setDesc('Base URL for API calls')
            .addText(text => text
                .setPlaceholder('https://api.example.com')
                .setValue(this.plugin.settings.baseUrl)
                .onChange(async (value) => {
                    this.plugin.settings.baseUrl = value;
                    await this.plugin.saveSettings();
                }));

        // Retries setting (existing)
        new Setting(containerEl)
            .setName('Retries')
            .setDesc('Number of retries for failed requests')
            .addSlider(slider => slider
                .setLimits(0, 10, 1)
                .setValue(this.plugin.settings.retries)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.retries = value;
                    await this.plugin.saveSettings();
                }));

        // Backoff Delay setting (existing)
        new Setting(containerEl)
            .setName('Backoff Delay')
            .setDesc('Delay between retries in milliseconds')
            .addSlider(slider => slider
                .setLimits(100, 5000, 100)
                .setValue(this.plugin.settings.backoffDelay)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.backoffDelay = value;
                    await this.plugin.saveSettings();
                }));

        // Rate Limit setting (existing)
        new Setting(containerEl)
            .setName('Rate Limit')
            .setDesc('Requests per minute')
            .addSlider(slider => slider
                .setLimits(1, 100, 1)
                .setValue(this.plugin.settings.rateLimit)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.rateLimit = value;
                    await this.plugin.saveSettings();
                }));

        // Cache Duration setting (existing)
        new Setting(containerEl)
            .setName('Cache Duration')
            .setDesc('Cache duration in seconds')
            .addSlider(slider => slider
                .setLimits(0, 3600, 60)
                .setValue(this.plugin.settings.cacheDuration)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.cacheDuration = value;
                    await this.plugin.saveSettings();
                }));
    }
}
