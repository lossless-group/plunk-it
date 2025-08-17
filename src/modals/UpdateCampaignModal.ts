import { App, Modal, Setting, MarkdownView } from 'obsidian';
import { EmailService, UpdateCampaignConfig } from '../services/emailService';

export class UpdateCampaignModal extends Modal {
    private emailService: EmailService;
    private content: string;
    private config: Partial<UpdateCampaignConfig> = {};
    private onSubmit: (result: { success: boolean; message: string; campaignId?: string }) => void;
    private plugin: any; // Will be the main plugin instance
    private availableClients: string[] = [];
    private clientCheckboxes: Array<{ client: string; setting: { controlEl: HTMLDivElement } }> = [];

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
        
        // Extract campaign ID and selected client from frontmatter
        const { frontmatter } = this.emailService.extractFrontmatter(content);
        const campaignId = frontmatter?.campaignId;
        
        // Set default values from content and settings
        this.config = {
            id: campaignId || '',
            subject: frontmatter?.subject || this.emailService.getDefaultSubject(content),
            apiToken: this.plugin.settings.plunkApiToken || '',
            recipients: [], // Will be populated when fetching contacts
            style: frontmatter?.style || 'SANS',
            subscribedOnly: frontmatter?.subscribedOnly ?? false,
            selectedClients: this.getSelectedClientsFromFrontmatter(frontmatter) || ['all'],
            backlinkUrlBase: this.plugin.settings.backlinkUrlBase || ''
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
        const clientFilterContainer = contentEl.createEl('div', { cls: 'setting-item' });
        
        // Create a container for name and description to stack them vertically
        const nameDescriptionContainer = clientFilterContainer.createEl('div');
        nameDescriptionContainer.style.display = 'flex';
        nameDescriptionContainer.style.flexDirection = 'column';
        nameDescriptionContainer.style.gap = '4px';
        
                nameDescriptionContainer.createEl('div', {
            cls: 'setting-item-name',
            text: 'Client Filter'
        });
        const descriptionEl = nameDescriptionContainer.createEl('div', { 
            cls: 'setting-item-description',
            text: 'Send to contacts from specific clients (leave unchecked for all clients)'
        });
        descriptionEl.style.maxWidth = '200px';
        
        // Create a vertical container for checkboxes
        const checkboxContainer = clientFilterContainer.createEl('div', { cls: 'setting-item-control' });
        checkboxContainer.style.display = 'flex';
        checkboxContainer.style.flexDirection = 'column';
        checkboxContainer.style.gap = '8px';

        // All Clients checkbox
        const allClientsDiv = checkboxContainer.createEl('div', { cls: 'setting-item' });
        allClientsDiv.style.display = 'flex';
        allClientsDiv.style.alignItems = 'center';
        allClientsDiv.style.gap = '8px';
        allClientsDiv.createEl('div', { cls: 'setting-item-name', text: 'All Clients' });
        const allClientsControl = allClientsDiv.createEl('div', { cls: 'setting-item-control' });
        const allClientsToggle = allClientsControl.createEl('input', { type: 'checkbox' });
        allClientsToggle.checked = this.config.selectedClients?.includes('all') || false;
        allClientsToggle.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                // If "All Clients" is selected, clear other selections
                this.config.selectedClients = ['all'];
                this.updateClientCheckboxes();
            } else {
                // Remove "all" from selection
                this.config.selectedClients = this.config.selectedClients?.filter(client => client !== 'all') || [];
                this.updateClientCheckboxes();
            }
        });

        // Individual client checkboxes
        this.clientCheckboxes = [];
        this.availableClients.forEach(client => {
            const clientDiv = checkboxContainer.createEl('div', { cls: 'setting-item' });
            clientDiv.style.display = 'flex';
            clientDiv.style.alignItems = 'center';
            clientDiv.style.gap = '8px';
            clientDiv.createEl('div', { cls: 'setting-item-name', text: client });
            const clientControl = clientDiv.createEl('div', { cls: 'setting-item-control' });
            const clientToggle = clientControl.createEl('input', { type: 'checkbox' });
            clientToggle.checked = this.config.selectedClients?.includes(client) || false;
            clientToggle.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                if (target.checked) {
                    // Add client to selection and remove "all" if it was selected
                    this.config.selectedClients = this.config.selectedClients?.filter(c => c !== 'all') || [];
                    this.config.selectedClients.push(client);
                    allClientsToggle.checked = false;
                    this.updateClientCheckboxes();
                } else {
                    // Remove client from selection
                    this.config.selectedClients = this.config.selectedClients?.filter(c => c !== client) || [];
                    this.updateClientCheckboxes();
                }
            });
            this.clientCheckboxes.push({ client, setting: { controlEl: clientControl } });
        });

        // Info about recipients
        const infoEl = contentEl.createEl('div', { 
            cls: 'setting-item-description',
            text: `ℹ️ This campaign will be updated with the new content and settings${this.config.selectedClients && this.config.selectedClients.length > 0 && !this.config.selectedClients.includes('all') ? ` and sent to contacts from clients: ${this.config.selectedClients.join(', ')}` : ''}.`
        });
        infoEl.style.color = 'var(--text-muted)';
        infoEl.style.fontStyle = 'italic';

        // Buttons
        const buttonContainer = contentEl.createEl('div', { cls: 'campaign-modal-buttons' });
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.marginTop = '20px';
        buttonContainer.style.justifyContent = 'flex-end';
        
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
            // Save all campaign properties to frontmatter before updating campaign
            this.saveCampaignPropertiesToFrontmatter();
            
            // Get all contacts for recipients (filtered by subscribed status and clients if requested)
            const recipients = await this.emailService.getAllContacts(this.config.apiToken, this.config.subscribedOnly, this.config.selectedClients);
            
            if (recipients.length === 0) {
                let filterText = '';
                if (this.config.subscribedOnly) {
                    filterText += 'subscribed ';
                }
                if (this.config.selectedClients && this.config.selectedClients.length > 0 && !this.config.selectedClients.includes('all')) {
                    filterText += `from clients: ${this.config.selectedClients.join(', ')} `;
                }
                this.onSubmit({ success: false, message: `No ${filterText}contacts found. Please add some contacts to your Plunk account first.` });
                return;
            }

            // Extract body content from the updated content (with new frontmatter)
            const { body } = this.emailService.extractFrontmatter(this.content);

            const updateConfig: UpdateCampaignConfig = {
                id: this.config.id,
                subject: this.config.subject,
                body: body,
                apiToken: this.config.apiToken,
                recipients: recipients,
                style: this.config.style || 'SANS',
                selectedClients: this.config.selectedClients || ['all'],
                backlinkUrlBase: this.config.backlinkUrlBase || ''
            };

            const result = await this.emailService.updateCampaign(this.content, updateConfig);
            this.onSubmit(result);
            this.close();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.onSubmit({ success: false, message: `Error: ${errorMessage}` });
        }
    }

    private updateClientCheckboxes() {
        this.clientCheckboxes.forEach(({ client, setting }) => {
            const toggle = setting.controlEl.querySelector('input') as HTMLInputElement;
            toggle.checked = this.config.selectedClients?.includes(client) || false;
        });
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

    // private saveSelectedClientsToFrontmatter(selectedClients: string[]) {
    //     // Update the content with the new selected clients in frontmatter
    //     this.content = this.emailService.updateFrontmatterWithSelectedClients(this.content, selectedClients);
        
    //     // Update the current file in Obsidian
    //     const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    //     if (activeView && activeView.file) {
    //         this.app.vault.modify(activeView.file, this.content);
    //     }
    // }

    private saveCampaignPropertiesToFrontmatter() {
        // Prepare properties to save to frontmatter
        const properties: Record<string, any> = {
            selectedClients: this.config.selectedClients || ['all']
        };

        // Add subject if provided
        if (this.config.subject) {
            properties.subject = this.config.subject;
        }

        // Add subscribedOnly setting
        properties.subscribedOnly = this.config.subscribedOnly;

        // Add style if it's different from default
        if (this.config.style && this.config.style !== 'SANS') {
            properties.style = this.config.style;
        }

        // Update the content with all properties in frontmatter
        this.content = this.emailService.updateFrontmatterWithProperties(this.content, properties);
        
        // Update the current file in Obsidian
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView && activeView.file) {
            this.app.vault.modify(activeView.file, this.content);
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
