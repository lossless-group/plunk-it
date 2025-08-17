import { App, Modal, Setting } from 'obsidian';
import { EmailService, EmailConfig } from '../services/emailService';

export class EmailModal extends Modal {
    private emailService: EmailService;
    private content: string;
    private config: Partial<EmailConfig> = {};
    private onSubmit: (result: { success: boolean; message: string }) => void;
    private plugin: any; // Will be the main plugin instance

    constructor(
        app: App, 
        content: string, 
        plugin: any,
        onSubmit: (result: { success: boolean; message: string }) => void
    ) {
        super(app);
        this.emailService = new EmailService();
        this.content = content;
        this.plugin = plugin;
        this.onSubmit = onSubmit;
        
        // Set default values from content and settings
        this.config = {
            subject: this.emailService.getDefaultSubject(content),
            to: this.emailService.getDefaultRecipient(content),
            from: '',
            apiToken: this.plugin.settings.plunkApiToken || '',
            subscribed: true,
            backlinkUrlBase: this.plugin.settings.backlinkUrlBase || '',
            style: 'SANS'
        };
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Send Email Newsletter' });

        // Show warning if API token is not configured
        if (!this.config.apiToken) {
            const warningEl = contentEl.createEl('div', { 
                cls: 'setting-item-description',
                text: '⚠️ Please configure your Plunk API token in the plugin settings first.'
            });
            warningEl.style.color = 'var(--text-error)';
            warningEl.style.fontWeight = 'bold';
        }

        // Recipient setting
        new Setting(contentEl)
            .setName('To')
            .setDesc('Email address to send to')
            .addText(text => {
                text.setPlaceholder('recipient@example.com')
                    .setValue(this.config.to || '')
                    .onChange(value => {
                        this.config.to = value;
                    });
            });

        // Subject setting
        new Setting(contentEl)
            .setName('Subject')
            .setDesc('Email subject line')
            .addText(text => {
                text.setPlaceholder('Newsletter Subject')
                    .setValue(this.config.subject || '')
                    .onChange(value => {
                        this.config.subject = value;
                    });
            });



        // Sender name setting
        new Setting(contentEl)
            .setName('Sender Name')
            .setDesc('Name of the sender (optional)')
            .addText(text => {
                text.setPlaceholder('Your Name')
                    .setValue(this.config.name || '')
                    .onChange(value => {
                        this.config.name = value;
                    });
            });

        // Subscribed setting
        new Setting(contentEl)
            .setName('Subscribed')
            .setDesc('Mark recipient as subscribed')
            .addToggle(toggle => {
                toggle.setValue(this.config.subscribed ?? true)
                    .onChange(value => {
                        this.config.subscribed = value;
                    });
            });

        // Style setting
        new Setting(contentEl)
            .setName('Style')
            .setDesc('Email styling template')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('SANS', 'Sans Serif')
                    .addOption('SERIF', 'Serif')
                    .addOption('HTML', 'HTML Email')
                    .setValue(this.config.style || 'SANS')
                    .onChange(value => {
                        this.config.style = value;
                    });
            });

        // Buttons
        const buttonContainer = contentEl.createEl('div', { cls: 'email-modal-buttons' });
        
        buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'mod-warning'
        }).addEventListener('click', () => {
            this.close();
        });

        buttonContainer.createEl('button', {
            text: 'Send Email',
            cls: 'mod-cta'
        }).addEventListener('click', async () => {
            await this.sendEmail();
        });
    }



    private async sendEmail() {
        // Validate required fields
        if (!this.config.apiToken) {
            this.onSubmit({ success: false, message: 'API token is required' });
            return;
        }
        if (!this.config.to) {
            this.onSubmit({ success: false, message: 'Recipient email is required' });
            return;
        }
        if (!this.config.subject) {
            this.onSubmit({ success: false, message: 'Subject is required' });
            return;
        }

        try {
            const result = await this.emailService.sendEmail(this.content, this.config as EmailConfig);
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

