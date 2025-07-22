import { Notice, Plugin, Editor } from 'obsidian';
// Import your services here
import { processSiteUuidForFile } from './src/services/siteUuidService';
// Import your modals here  
import { BatchDirectoryModal } from './src/modals/BatchDirectoryModal';
// Import your utilities here
// import { yourUtility } from './src/utils/yourUtility';

export default class StarterPlugin extends Plugin {
    async onload(): Promise<void> {
        // Load CSS
        this.loadStyles();
        
        // Register commands
        this.registerCommands();
        
        // Register command to open Batch Directory Modal
        this.addCommand({
            id: 'open-batch-directory-modal',
            name: 'Open Batch Directory Operations',
            callback: () => {
                new BatchDirectoryModal(this.app).open();
            }
        });
        
        // Add additional command groups as needed
        // this.registerAdditionalCommands();
    }
    
    private async loadStyles() {
        try {
            const cssPath = this.manifest.dir + '/styles.css';
            const response = await fetch(cssPath);
            if (!response.ok) throw new Error('Failed to load CSS');
            
            const css = await response.text();
            const styleEl = document.createElement('style');
            styleEl.id = 'obsidian-plugin-starter-styles';
            styleEl.textContent = css;
            document.head.appendChild(styleEl);
        } catch (error) {
            console.error('Error loading styles:', error);
        }
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
}