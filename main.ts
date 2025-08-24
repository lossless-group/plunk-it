import { Notice, Plugin, Editor } from 'obsidian';
import { EmailModal } from './src/modals/EmailModal';
import { CampaignModal } from './src/modals/CampaignModal';
import { UpdateCampaignModal } from './src/modals/UpdateCampaignModal';
import { SendCampaignModal } from './src/modals/SendCampaignModal';
import { SettingsTab } from './src/settings/SettingsTab';
import { PluginSettings } from './src/types';
import './src/styles/modals.css';

export default class PlunkItPlugin extends Plugin {
    settings!: PluginSettings;

    async onload(): Promise<void> {
        // Load settings
        await this.loadSettings();
        
        // Add settings tab
        this.addSettingTab(new SettingsTab(this.app, this));
        
        // Register commands
        this.registerCommands();
    }

    private registerCommands(): void {
        // Add individual email command
        this.addCommand({
            id: 'send-email-newsletter',
            name: 'Send Individual Email',
            editorCallback: async (editor: Editor) => {
                try {
                    const content = editor.getValue();
                    if (!content.trim()) {
                        new Notice('No content to send');
                        return;
                    }

                    new EmailModal(this.app, content, this, (result) => {
                        if (result.success) {
                            new Notice(result.message, 5000);
                        } else {
                            new Notice(result.message, 8000);
                        }
                    }).open();
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error opening email modal: ' + errorMsg, 5000);
                }
            }
        });

        // Add create campaign command
        this.addCommand({
            id: 'create-email-campaign',
            name: 'Create Email Campaign',
            editorCallback: async (editor: Editor) => {
                try {
                    const content = editor.getValue();
                    if (!content.trim()) {
                        new Notice('No content to create campaign from');
                        return;
                    }

                    new CampaignModal(this.app, content, this, async (result) => {
                        if (result.success && result.campaignId) {
                            // Update the file content with the campaign ID
                            const { EmailService } = await import('./src/services/emailService');
                            const emailService = new EmailService();
                            
                            // Use the updated content that already has selectedClients if available
                            const contentToUpdate = (result as any).updatedContent || content;
                            const finalContent = emailService.updateFrontmatterWithCampaignId(contentToUpdate, result.campaignId);
                            editor.setValue(finalContent);
                            
                            new Notice(`Campaign created successfully! Campaign ID: ${result.campaignId}`, 8000);
                        } else {
                            new Notice(result.message, 8000);
                        }
                    }).open();
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error opening campaign modal: ' + errorMsg, 5000);
                }
            }
        });

        // Add send campaign command
        this.addCommand({
            id: 'send-email-campaign',
            name: 'Send Email Campaign',
            editorCallback: async (editor: Editor) => {
                try {
                    const content = editor.getValue();
                    if (!content.trim()) {
                        new Notice('No content to send campaign from');
                        return;
                    }

                    // Check if API token is configured
                    if (!this.settings.plunkApiToken) {
                        new Notice('Please configure your Plunk API token in the plugin settings first', 5000);
                        return;
                    }

                    new SendCampaignModal(this.app, content, this, async (result) => {
                        if (result.success) {
                            new Notice(result.message, 8000);
                        } else {
                            new Notice(result.message, 8000);
                        }
                    }).open();
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error opening send campaign modal: ' + errorMsg, 5000);
                }
            }
        });

        // Add update campaign command
        this.addCommand({
            id: 'update-email-campaign',
            name: 'Update Email Campaign',
            editorCallback: async (editor: Editor) => {
                try {
                    const content = editor.getValue();
                    if (!content.trim()) {
                        new Notice('No content to update campaign from');
                        return;
                    }

                    // Check if API token is configured
                    if (!this.settings.plunkApiToken) {
                        new Notice('Please configure your Plunk API token in the plugin settings first', 5000);
                        return;
                    }

                    new UpdateCampaignModal(this.app, content, this, async (result) => {
                        if (result.success) {
                            new Notice(result.message, 8000);
                        } else {
                            new Notice(result.message, 8000);
                        }
                    }).open();
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error opening update campaign modal: ' + errorMsg, 5000);
                }
            }
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, {
            plunkApiToken: '',
            backlinkUrlBase: '',
            filterKey: 'client'
        }, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}