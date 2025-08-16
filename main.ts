import { Notice, Plugin, Editor, MarkdownView } from 'obsidian';
// Import your services here
import { processSiteUuidForFile } from './src/services/siteUuidService';
import { BacklinkUrlService } from './src/services/backlinkUrlService';
// Import your modals here  
import { BatchDirectoryModal } from './src/modals/BatchDirectoryModal';
import { CurrentFileModal } from './src/modals/CurrentFileModal';
import { EmailModal } from './src/modals/EmailModal';
import { CampaignModal } from './src/modals/CampaignModal';
// Import your settings
import { SettingsTab } from './src/settings/SettingsTab';
import { PluginSettings } from './src/types';
// Import your utilities here
// import { yourUtility } from './src/utils/yourUtility';

export default class StarterPlugin extends Plugin {
    settings!: PluginSettings;

    async onload(): Promise<void> {
        // Load settings
        await this.loadSettings();
        
        // Add settings tab
        this.addSettingTab(new SettingsTab(this.app, this));
        // Load CSS
        this.loadStyles();
        
        // Add ribbon icon for Insert URL from Backlink
        const ribbonIconEl = this.addRibbonIcon(
            'link',
            'Insert URL from Backlink',
            async () => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView && activeView.editor) {
                    const backlinkService = new BacklinkUrlService(this.app);
                    const result = await backlinkService.processBacklinkAtCursor(activeView.editor);
                    
                    if (result.success) {
                        new Notice(result.message, 4000);
                    } else {
                        new Notice(result.message, 5000);
                    }
                } else {
                    new Notice('Please open a markdown file first');
                }
            }
        );
        ribbonIconEl.addClass('insert-backlink-url-ribbon-icon');
        
        // Register commands
        this.registerCommands();
        
        // Register command to open Batch Directory Modal
        this.addCommand({
            id: 'open-batch-directory-modal',
            name: 'Open Batch Directory Modal',
            callback: () => {
                new BatchDirectoryModal(this.app).open();
            }
        });

        // Register command to open Current File Modal
        this.addCommand({
            id: 'open-current-file-modal',
            name: 'Open Current File Modal',
            editorCallback: (editor: Editor) => {
                new CurrentFileModal(this.app, editor).open();
            }
        });
        
        // Add additional command groups as needed
        // this.registerAdditionalCommands();
    }
    
    private loadStyles() {
        // Obsidian automatically loads styles.css from the plugin directory
        // This method can be used to add additional dynamic styles if needed
        
        // Example of adding dynamic styles:
        // this.addStyle(`
        //     .my-plugin-class {
        //         color: var(--text-accent);
        //     }
        // `);
        
        console.log('Plugin styles loaded - styles.css is automatically loaded by Obsidian');
    }

    private registerCommands(): void {
        // Example command with modal
        this.addCommand({
            id: 'open-modal-command',
            name: 'Open Modal Command',
            editorCallback: (_editor: Editor) => {
                // Example: Open a modal
                // new YourModal(this.app, editor).open();
                new Notice('Modal command triggered - implement your modal here');
            }
        });

        // Example command with text processing
        this.addCommand({
            id: 'process-content-command',
            name: 'Process Content Command', 
            editorCallback: async (_editor: Editor) => {
                try {
                    // const content = editor.getValue();
                    
                    // Example: Process the content with your service
                    // const result = yourService.processContent(content);
                    // if (result.changed) {
                    //     editor.setValue(result.content);
                    //     new Notice(`Processed successfully`);
                    // } else {
                    //     new Notice('No changes needed');
                    // }
                    
                    new Notice('Content processing command - implement your logic here');
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error processing content: ' + errorMsg);
                }
            }
        });

        // Example command for cursor operations
        this.addCommand({
            id: 'insert-at-cursor-command',
            name: 'Insert at Cursor Command',
            editorCallback: (editor: Editor) => {
                try {
                    const cursor = editor.getCursor();
                    const textToInsert = 'Example text'; // Replace with your logic
                    
                    // Insert text at cursor
                    editor.replaceRange(textToInsert, cursor);
                    
                    new Notice('Text inserted at cursor');
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error inserting text: ' + errorMsg);
                }
            }
        });

        // Add site_uuid command
        this.addCommand({
            id: 'add-site-uuid',
            name: 'Add Site UUID',
            callback: async () => {
                try {
                    const activeFile = this.app.workspace.getActiveFile();
                    if (!activeFile) {
                        new Notice('No active file found');
                        return;
                    }

                    // Check if it's a markdown file
                    if (activeFile.extension !== 'md') {
                        new Notice('Site UUID can only be added to Markdown files');
                        return;
                    }

                    new Notice('Adding site UUID...', 2000);
                    const result = await processSiteUuidForFile(activeFile);
                    
                    if (result.success) {
                        const message = result.hadExistingUuid 
                            ? `Updated site UUID: ${result.uuid}`
                            : `Added site UUID: ${result.uuid}`;
                        new Notice(message, 5000);
                    } else {
                        new Notice(`Failed to add site UUID: ${result.message}`, 5000);
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error adding site UUID: ' + errorMsg, 5000);
                }
            }
        });

        // Add email newsletter command
        this.addCommand({
            id: 'send-email-newsletter',
            name: 'Send Email',
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
                            const updatedContent = emailService.updateFrontmatterWithCampaignId(content, result.campaignId);
                            editor.setValue(updatedContent);
                            
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

                    new Notice('Sending campaign...', 2000);
                    
                    const { EmailService } = await import('./src/services/emailService');
                    const emailService = new EmailService();
                    const result = await emailService.sendCampaign(content, this.settings.plunkApiToken);
                    
                    if (result.success) {
                        new Notice(result.message, 8000);
                    } else {
                        new Notice(result.message, 8000);
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error sending campaign: ' + errorMsg, 5000);
                }
            }
        });
    }

    // Additional command groups can be registered here as needed
    // private registerSelectionCommands(): void {
    //     this.addCommand({
    //         id: 'process-selection-command',
    //         name: 'Process Selection Command',
    //         editorCallback: (editor: Editor) => {
    //             const selection = editor.getSelection();
    //             if (!selection) {
    //                 new Notice('Please select some text first');
    //                 return;
    //             }
    //             
    //             // Example: Process the selection
    //             // const processed = yourService.processSelection(selection);
    //             // editor.replaceSelection(processed);
    //             
    //             editor.replaceSelection(selection.toUpperCase()); // Example transformation
    //             new Notice('Selection processed successfully');
    //         }
    //     });
    // }

    async loadSettings() {
        this.settings = Object.assign({}, {
            apiKey: '',
            baseUrl: '',
            retries: 3,
            backoffDelay: 1000,
            rateLimit: 10,
            cacheDuration: 300,
            plunkApiToken: ''
        }, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}