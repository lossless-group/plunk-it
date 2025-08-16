import { App, Modal, Setting } from 'obsidian';
import { EmailService, UpdateCampaignConfig } from '../services/emailService';

export class UpdateCampaignModal extends Modal {
    private emailService: EmailService;
    private content: string;
    private config: Partial<UpdateCampaignConfig> = {};
    private onSubmit: (result: { success: boolean; message: string; campaignId?: string }) => void;
    private plugin: any; // Will be the main plugin instance
    private availableClients: string[] = [];

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
        
        // Extract campaign ID from frontmatter
        const { frontmatter } = this.emailService.extractFrontmatter(content);
        const campaignId = frontmatter?.campaignId;
        
        // Set default values from content and settings
        this.config = {
            id: campaignId || '',
            subject: this.emailService.getDefaultSubject(content),
            apiToken: this.plugin.settings.plunkApiToken || '',
            recipients: [], // Will be populated when fetching contacts
            style: 'SANS',
            subscribedOnly: false,
            selectedClient: 'all'
        };
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Update Email Campaign' });

        // Load available clients if API token is configured
        if (this.config.apiToken) {
            try {
                this.availableClients = await this.emailService.getUniqueClients(this.config.apiToken);
            } catch (error) {
                console.error('Failed to load clients:', error);
                this.availableClients = [];
            }
        }

        // Show warning if API token is not configured
        if (!this.config.apiToken) {
            const warningEl = contentEl.createEl('div', { 
                cls: 'setting-item-description',
                text: '⚠️ Please configure your Plunk API token in the plugin settings first.'
            });
            warningEl.style.color = 'var(--text-error)';
            warningEl.style.fontWeight = 'bold';
        }

        // Show warning if no campaign ID found
        if (!this.config.id) {
            const warningEl = contentEl.createEl('div', { 
                cls: 'setting-item-description',
                text: '⚠️ No campaign ID found in frontmatter. Please create a campaign first.'
            });
            warningEl.style.color = 'var(--text-error)';
            warningEl.style.fontWeight = 'bold';
        }

        // Campaign ID display (read-only)
        new Setting(contentEl)
            .setName('Campaign ID')
            .setDesc('ID of the campaign to update')
            .addText(text => {
                text.setValue(this.config.id || '')
                    .setDisabled(true);
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

        // Subscribed users filter setting
        new Setting(contentEl)
            .setName('Send to Subscribed Users Only')
            .setDesc('Only send to contacts who are subscribed to your emails (subscribed users are okay with marketing/non-critical mail)')
            .addToggle(toggle => {
                toggle.setValue(this.config.subscribedOnly ?? false)
                    .onChange(value => {
                        this.config.subscribedOnly = value;
                    });
            });

        // Client filter setting
        new Setting(contentEl)
            .setName('Client Filter')
            .setDesc('Send to contacts from a specific client only')
            .addDropdown(dropdown => {
                // Add "All Clients" option
                dropdown.addOption('all', 'All Clients');
                
                // Add client options
                this.availableClients.forEach(client => {
                    dropdown.addOption(client, client);
                });
                
                dropdown.setValue(this.config.selectedClient || 'all')
                    .onChange(value => {
                        this.config.selectedClient = value;
                    });
            });

        // Info about recipients
        const infoEl = contentEl.createEl('div', { 
            cls: 'setting-item-description',
            text: `ℹ️ This campaign will be updated with the new content and settings${this.config.selectedClient && this.config.selectedClient !== 'all' ? ` and sent to contacts from client: ${this.config.selectedClient}` : ''}.`
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
            text: 'Update Campaign',
            cls: 'mod-cta'
        }).addEventListener('click', async () => {
            await this.updateCampaign();
        });
    }

    private async updateCampaign() {
        // Validate required fields
        if (!this.config.apiToken) {
            this.onSubmit({ success: false, message: 'API token is required' });
            return;
        }
        if (!this.config.id) {
            this.onSubmit({ success: false, message: 'Campaign ID is required' });
            return;
        }
        if (!this.config.subject) {
            this.onSubmit({ success: false, message: 'Subject is required' });
            return;
        }

        try {
            // Get all contacts for recipients (filtered by subscribed status and client if requested)
            const recipients = await this.emailService.getAllContacts(this.config.apiToken, this.config.subscribedOnly, this.config.selectedClient);
            
            if (recipients.length === 0) {
                let filterText = '';
                if (this.config.subscribedOnly) {
                    filterText += 'subscribed ';
                }
                if (this.config.selectedClient && this.config.selectedClient !== 'all') {
                    filterText += `from client '${this.config.selectedClient}' `;
                }
                this.onSubmit({ success: false, message: `No ${filterText}contacts found. Please add some contacts to your Plunk account first.` });
                return;
            }

            // Extract body content (without frontmatter)
            const { body } = this.emailService.extractFrontmatter(this.content);

            const updateConfig: UpdateCampaignConfig = {
                id: this.config.id,
                subject: this.config.subject,
                body: body,
                apiToken: this.config.apiToken,
                recipients: recipients,
                ...(this.config.style && { style: this.config.style }),
                ...(this.config.selectedClient && { selectedClient: this.config.selectedClient })
            };

            const result = await this.emailService.updateCampaign(body, updateConfig);
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
