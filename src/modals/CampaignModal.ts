import { App, Modal, Setting, MarkdownView } from 'obsidian';
import { EmailService, CampaignConfig } from '../services/emailService';

export class CampaignModal extends Modal {
    private emailService: EmailService;
    private content: string;
    private config: Partial<CampaignConfig> = {};
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
        
        // Extract frontmatter to get saved selected ${this.config.filterKey || 'client'}
        const { frontmatter } = this.emailService.extractFrontmatter(content);
        
        // Set default values from content and settings
        this.config = {
            name: frontmatter?.subject || this.emailService.getDefaultSubject(content),
            subject: frontmatter?.subject || this.emailService.getDefaultSubject(content),
            apiToken: this.plugin.settings.plunkApiToken || '',
            style: frontmatter?.style || 'SANS',
            selectedClients: this.getSelectedClientsFromFrontmatter(frontmatter) || ['all'],
            subscribedOnly: frontmatter?.subscribedOnly ?? false,
            backlinkUrlBase: this.plugin.settings.backlinkUrlBase || '',
            filterKey: this.plugin.settings.filterKey || 'client'
        };
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Create Email Campaign' });

        // Show warning if API token is not configured
        if (!this.config.apiToken) {
            contentEl.createEl('div', { 
                cls: 'setting-item-description warning',
                text: '⚠️ Please configure your Plunk API token in the plugin settings first.'
            });
        }

        // Load available ${this.config.filterKey || 'client'}s if API token is configured
        if (this.config.apiToken) {
            try {
                this.availableClients = await this.emailService.getUniqueClients(this.config.apiToken, this.plugin.settings.filterKey);
            } catch (error) {
                console.error(`Failed to load ${this.config.filterKey || 'client'}s:`, error);
                this.availableClients = [];
            }
        }

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
            .setDesc('Only send to contacts who are subscribed to your emails (subscribed users are okay with marketing/non-critical mail)')
            .addToggle(toggle => {
                toggle.setValue(this.config.subscribedOnly ?? false)
                    .onChange(value => {
                        this.config.subscribedOnly = value;
                    });
            });

        // ${this.config.filterKey || 'Client'} filter setting
        const clientFilterContainer = contentEl.createEl('div', { cls: 'setting-item' });
        
        // Create a container for name and description to stack them vertically
        const nameDescriptionContainer = clientFilterContainer.createEl('div');
        nameDescriptionContainer.style.display = 'flex';
        nameDescriptionContainer.style.flexDirection = 'column';
        nameDescriptionContainer.style.gap = '4px';
        
        nameDescriptionContainer.createEl('div', { 
            cls: 'setting-item-name',
            text: `${this.config.filterKey || 'Client'} Filter`
        });
        
        nameDescriptionContainer.createEl('div', { 
            cls: 'setting-item-description',
            text: `Send to contacts from specific ${this.config.filterKey || 'client'}s`
        });
        
        // Create a vertical container for checkboxes
        const checkboxContainer = clientFilterContainer.createEl('div', { cls: 'setting-item-control' });
        checkboxContainer.style.display = 'flex';
        checkboxContainer.style.flexDirection = 'column';
        checkboxContainer.style.gap = '8px';

        // All ${this.config.filterKey || 'Client'}s checkbox
        const allClientsDiv = checkboxContainer.createEl('div', { cls: 'setting-item' });
        allClientsDiv.style.display = 'flex';
        allClientsDiv.style.alignItems = 'center';
        allClientsDiv.style.gap = '8px';
        allClientsDiv.createEl('div', { cls: 'setting-item-name', text: `All ${this.config.filterKey || 'Client'}s` });
        const allClientsControl = allClientsDiv.createEl('div', { cls: 'setting-item-control' });
        const allClientsToggle = allClientsControl.createEl('input', { type: 'checkbox' });
        allClientsToggle.checked = this.config.selectedClients?.includes('all') || false;
        allClientsToggle.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                // If "All ${this.config.filterKey || 'Client'}s" is selected, clear other selections
                this.config.selectedClients = ['all'];
                this.updateClientCheckboxes();
            } else {
                // Remove "all" from selection
                this.config.selectedClients = this.config.selectedClients?.filter(client => client !== 'all') || [];
                this.updateClientCheckboxes();
            }
        });

        // Individual ${this.config.filterKey || 'client'} checkboxes
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
                    // Add ${this.config.filterKey || 'client'} to selection and remove "all" if it was selected
                    this.config.selectedClients = this.config.selectedClients?.filter(c => c !== 'all') || [];
                    this.config.selectedClients.push(client);
                    allClientsToggle.checked = false;
                    this.updateClientCheckboxes();
                } else {
                    // Remove ${this.config.filterKey || 'client'} from selection
                    this.config.selectedClients = this.config.selectedClients?.filter(c => c !== client) || [];
                    this.updateClientCheckboxes();
                }
            });
            this.clientCheckboxes.push({ client, setting: { controlEl: clientControl } });
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
                    .setValue('SANS')
                    .onChange(value => {
                        this.config.style = value;
                    });
            });

        // Info about recipients
        contentEl.createEl('div', { 
            cls: 'setting-item-description info',
            text: `ℹ️ This campaign will be sent to contacts in your Plunk account${this.config.selectedClients && this.config.selectedClients.length > 0 && !this.config.selectedClients.includes('all') ? ` from ${this.config.filterKey || 'client'}s: ${this.config.selectedClients.join(', ')}` : ''}.`
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

        if (!this.config.subject) {
            this.onSubmit({ success: false, message: 'Subject is required' });
            return;
        }

        try {
            // Save selected ${this.config.filterKey || 'client'}s, subject, and title to frontmatter before creating campaign
            this.saveCampaignPropertiesToFrontmatter();
            
            // Use the updated content that now includes all properties in frontmatter
            const result = await this.emailService.createCampaign(this.content, this.config as CampaignConfig);
            
            // Pass the updated content along with the result
            if (result.success && result.campaignId) {
                this.onSubmit({ ...result, updatedContent: this.content } as any);
            } else {
                this.onSubmit(result);
            }
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

    private saveCampaignPropertiesToFrontmatter() {
        // Prepare properties to save to frontmatter
        const properties: Record<string, any> = {
            selectedClients: this.config.selectedClients || ['all']
        };

        // Add subject if provided
        if (this.config.subject) {
            properties.subject = this.config.subject;
        }

        // Add subscribedOnly setting if it's different from default
        if (this.config.subscribedOnly !== undefined) {
            properties.subscribedOnly = this.config.subscribedOnly;
        }

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
