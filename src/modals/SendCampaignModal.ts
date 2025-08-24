import { App, Modal, Setting } from 'obsidian';
import { EmailService } from '../services/emailService';

export class SendCampaignModal extends Modal {
    private emailService: EmailService;
    private content: string;
    private config: {
        apiToken: string;
        campaignId: string;
        updateRecipients: boolean;
        subscribedOnly: boolean;
        selectedClients: string[];
        backlinkUrlBase: string;
        filterKey: string;
    };
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
        
        // Extract campaign ID and filters from frontmatter
        const { frontmatter } = this.emailService.extractFrontmatter(content);
        const campaignId = frontmatter?.campaignId;
        
        // Set default values from content and settings
        this.config = {
            apiToken: this.plugin.settings.plunkApiToken || '',
            campaignId: campaignId || '',
            updateRecipients: true,
            subscribedOnly: frontmatter?.subscribedOnly ?? false,
            selectedClients: this.getSelectedClientsFromFrontmatter(frontmatter) || ['all'],
            backlinkUrlBase: this.plugin.settings.backlinkUrlBase || '',
            filterKey: this.plugin.settings.filterKey || 'client'
        };
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Send Email Campaign' });

        // Show warning if API token is not configured
        if (!this.config.apiToken) {
            contentEl.createEl('div', { 
                cls: 'setting-item-description warning',
                text: '⚠️ Please configure your Plunk API token in the plugin settings first.'
            });
        }

        // Show warning if no campaign ID found
        if (!this.config.campaignId) {
            contentEl.createEl('div', { 
                cls: 'setting-item-description warning',
                text: '⚠️ No campaign ID found in frontmatter. Please create a campaign first.'
            });
        }

        // Campaign ID display (read-only)
        new Setting(contentEl)
            .setName('Campaign ID')
            .setDesc('ID of the campaign to send')
            .addText(text => {
                text.setValue(this.config.campaignId || '')
                    .setDisabled(true);
            });

        // Update recipients before sending setting
        new Setting(contentEl)
            .setName('Update Recipients Before Sending')
            .setDesc('Refresh the recipient list with current contacts using existing filters from frontmatter')
            .addToggle(toggle => {
                toggle.setValue(this.config.updateRecipients)
                    .onChange(value => {
                        this.config.updateRecipients = value;
                    });
            });

        // Show current filters info
        contentEl.createEl('div', { 
            cls: 'setting-item-description info margin-top',
            text: this.getFiltersInfoText()
        });

        // Info about sending
        contentEl.createEl('div', { 
            cls: 'setting-item-description info',
            text: 'ℹ️ This will send the campaign immediately to all recipients.'
        });

        // Buttons
        const buttonContainer = contentEl.createEl('div', { cls: 'campaign-modal-buttons' });
        
        buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'mod-warning'
        }).addEventListener('click', () => {
            this.close();
        });

        buttonContainer.createEl('button', {
            text: 'Send Campaign',
            cls: 'mod-cta'
        }).addEventListener('click', async () => {
            await this.sendCampaign();
        });
    }

    private async sendCampaign() {
        // Validate required fields
        if (!this.config.apiToken) {
            this.onSubmit({ success: false, message: 'API token is required' });
            return;
        }
        if (!this.config.campaignId) {
            this.onSubmit({ success: false, message: 'Campaign ID is required' });
            return;
        }

        try {
            // If update recipients is enabled, update the campaign first
            if (this.config.updateRecipients) {
                // Get all contacts for recipients (filtered by subscribed status and ${this.config.filterKey || 'client'}s if requested)
                const recipients = await this.emailService.getAllContacts(this.config.apiToken, this.config.subscribedOnly, this.config.selectedClients || [], this.config.filterKey);
                
                if (recipients.length === 0) {
                    let filterText = '';
                    if (this.config.subscribedOnly) {
                        filterText += 'subscribed ';
                    }
                                if (this.config.selectedClients && this.config.selectedClients.length > 0 && !this.config.selectedClients.includes('all')) {
                filterText += `from ${this.config.filterKey || 'client'}s: ${this.config.selectedClients.join(', ')} `;
            }
                    this.onSubmit({ success: false, message: `No ${filterText}contacts found. Please add some contacts to your Plunk account first.` });
                    return;
                }

                // Extract body content (without frontmatter)
                const { body } = this.emailService.extractFrontmatter(this.content);

                // Update the campaign with new recipients
                const updateResult = await this.emailService.updateCampaign(body, {
                    id: this.config.campaignId,
                    subject: this.emailService.getDefaultSubject(this.content),
                    body: body,
                    apiToken: this.config.apiToken,
                    recipients: recipients,
                    backlinkUrlBase: this.config.backlinkUrlBase
                });

                if (!updateResult.success) {
                    this.onSubmit(updateResult);
                    return;
                }
            }

            // Send the campaign
            const result = await this.emailService.sendCampaign(this.content, this.config.apiToken);
            this.onSubmit(result);
            this.close();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.onSubmit({ success: false, message: `Error: ${errorMessage}` });
        }
    }

    private getSelectedClientsFromFrontmatter(frontmatter: any): string[] {
        // Handle migration from old selectedClient to new selectedClients
        if (frontmatter?.selectedClients) {
            return Array.isArray(frontmatter.selectedClients) ? frontmatter.selectedClients : [frontmatter.selectedClients];
        }
        if (frontmatter?.selectedClient) {
            return [frontmatter.selectedClient];
        }
        return ['all'];
    }

    private getFiltersInfoText(): string {
        let filters = [];
        
        if (this.config.subscribedOnly) {
            filters.push('subscribed users only');
        }
        
        if (this.config.selectedClients && this.config.selectedClients.length > 0 && !this.config.selectedClients.includes('all')) {
            filters.push(`${this.config.filterKey || 'client'}s: ${this.config.selectedClients.join(', ')}`);
        }
        
        if (filters.length === 0) {
            return 'ℹ️ Current filters: All contacts';
        }
        
        return `ℹ️ Current filters: ${filters.join(', ')}`;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
