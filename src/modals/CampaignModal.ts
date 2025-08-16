import { App, Modal, Setting } from 'obsidian';
import { EmailService, CampaignConfig } from '../services/emailService';

export class CampaignModal extends Modal {
    private emailService: EmailService;
    private content: string;
    private config: Partial<CampaignConfig> = {};
    private onSubmit: (result: { success: boolean; message: string; campaignId?: string }) => void;
    private plugin: any; // Will be the main plugin instance

    constructor(
        app: App, 
        content: string, 
        plugin: any,
        onSubmit: (result: { success: boolean; message: string; campaignId?: string }) => void
    ) {
        super(app);
        this.emailService = new EmailService();
        this.content = content;
        this.plugin = plugin;
        this.onSubmit = onSubmit;
        
        // Set default values from content and settings
        this.config = {
            name: this.emailService.getDefaultCampaignName(content),
            subject: this.emailService.getDefaultSubject(content),
            apiToken: this.plugin.settings.plunkApiToken || '',
        };
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Create Email Campaign' });

        // Show warning if API token is not configured
        if (!this.config.apiToken) {
            const warningEl = contentEl.createEl('div', { 
                cls: 'setting-item-description',
                text: '⚠️ Please configure your Plunk API token in the plugin settings first.'
            });
            warningEl.style.color = 'var(--text-error)';
            warningEl.style.fontWeight = 'bold';
        }

        // Campaign name setting
        new Setting(contentEl)
            .setName('Campaign Name')
            .setDesc('Name for your campaign')
            .addText(text => {
                text.setPlaceholder('My Newsletter Campaign')
                    .setValue(this.config.name || '')
                    .onChange(value => {
                        this.config.name = value;
                    });
            });

        // Subject setting
        new Setting(contentEl)
            .setName('Subject')
            .setDesc('Email subject line for the campaign')
            .addText(text => {
                text.setPlaceholder('Newsletter Subject')
                    .setValue(this.config.subject || '')
                    .onChange(value => {
                        this.config.subject = value;
                    });
            });

        // Subscribed users filter setting
        new Setting(contentEl)
            .setName('Send to Subscribed Users Only')
            .setDesc('Only send to contacts who are subscribed to your emails')
            .addToggle(toggle => {
                toggle.setValue(this.config.subscribedOnly ?? false)
                    .onChange(value => {
                        this.config.subscribedOnly = value;
                    });
            });

        // Info about recipients
        const infoEl = contentEl.createEl('div', { 
            cls: 'setting-item-description',
            text: 'ℹ️ This campaign will be sent to contacts in your Plunk account.'
        });
        infoEl.style.color = 'var(--text-muted)';
        infoEl.style.fontStyle = 'italic';

        // Buttons
        const buttonContainer = contentEl.createEl('div', { cls: 'campaign-modal-buttons' });
        
        buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'mod-warning'
        }).addEventListener('click', () => {
            this.close();
        });

        buttonContainer.createEl('button', {
            text: 'Create Campaign',
            cls: 'mod-cta'
        }).addEventListener('click', async () => {
            await this.createCampaign();
        });
    }



    private async createCampaign() {
        // Validate required fields
        if (!this.config.apiToken) {
            this.onSubmit({ success: false, message: 'API token is required' });
            return;
        }
        if (!this.config.name) {
            this.onSubmit({ success: false, message: 'Campaign name is required' });
            return;
        }
        if (!this.config.subject) {
            this.onSubmit({ success: false, message: 'Subject is required' });
            return;
        }

        try {
            const result = await this.emailService.createCampaign(this.content, this.config as CampaignConfig);
            this.onSubmit(result);
            this.close();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.onSubmit({ success: false, message: `Error: ${errorMessage}` });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
