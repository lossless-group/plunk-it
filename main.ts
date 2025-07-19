import { Notice, Plugin, Editor } from 'obsidian';
// Import your services here
// import { yourService } from './src/services/yourService';
// Import your modals here  
// import { YourModal } from './src/modals/YourModal';
// Import your utilities here
// import { yourUtility } from './src/utils/yourUtility';

export default class {{PLUGIN_CLASS_NAME}} extends Plugin {
    async onload(): Promise<void> {
        // Load CSS
        this.loadStyles();
        
        // Register commands
        this.registerCommands();
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
            styleEl.id = '{{PLUGIN_ID}}-styles';
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
            editorCallback: (editor: Editor) => {
                // Example: Open a modal
                // new YourModal(this.app, editor).open();
                new Notice('Modal command triggered - implement your modal here');
            }
        });

        // Example command with text processing
        this.addCommand({
            id: 'process-content-command',
            name: 'Process Content Command', 
            editorCallback: async (editor: Editor) => {
                try {
                    const content = editor.getValue();
                    
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
    }

    // Example: Additional command group for selection operations
    private registerSelectionCommands(): void {
        this.addCommand({
            id: 'process-selection-command',
            name: 'Process Selection Command',
            editorCallback: (editor: Editor) => {
                const selection = editor.getSelection();
                if (!selection) {
                    new Notice('Please select some text first');
                    return;
                }
                
                // Example: Process the selection
                // const processed = yourService.processSelection(selection);
                // editor.replaceSelection(processed);
                
                editor.replaceSelection(selection.toUpperCase()); // Example transformation
                new Notice('Selection processed successfully');
            }
        });
    }

    // Example: Additional command group for formatting operations
    private registerFormattingCommands(): void {
        this.addCommand({
            id: 'format-document-command',
            name: 'Format Document Command',
            editorCallback: (editor: Editor) => {
                const content = editor.getValue();
                
                // Example: Format the document
                // const formatted = yourService.formatDocument(content);
                const formatted = content.trim(); // Example formatting
                
                if (formatted !== content) {
                    editor.setValue(formatted);
                    new Notice('Document formatted successfully');
                } else {
                    new Notice('No formatting needed');
                }
            }
        });
    }
}