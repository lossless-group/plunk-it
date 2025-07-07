import { Notice, Plugin, Editor } from 'obsidian';
import { citationService } from './src/services/citationService';
import { CitationModal } from './src/modals/CitationModal';

export default class CiteWidePlugin extends Plugin {
    async onload(): Promise<void> {
        // Load CSS
        this.loadStyles();
        
        // Register commands
        this.registerCitationCommands();
    }
    
    private async loadStyles() {
        try {
            const cssPath = this.manifest.dir + '/styles.css';
            const response = await fetch(cssPath);
            if (!response.ok) throw new Error('Failed to load CSS');
            
            const css = await response.text();
            const styleEl = document.createElement('style');
            styleEl.id = 'cite-wide-styles';
            styleEl.textContent = css;
            document.head.appendChild(styleEl);
        } catch (error) {
            console.error('Error loading styles:', error);
        }
    }

    private registerCitationCommands(): void {
        // Command to show citations in current file
        this.addCommand({
            id: 'show-citations',
            name: 'Show Citations in Current File',
            editorCallback: (editor: Editor) => {
                new CitationModal(this.app, editor).open();
            }
        });

        // Command to convert all citations to hex format
        this.addCommand({
            id: 'convert-all-citations',
            name: 'Convert All Citations to Hex Format',
            editorCallback: async (editor: Editor) => {
                try {
                    const content = editor.getValue();
                    // Get all citation groups
                    const groups = citationService.findCitations(content);
                    let totalConverted = 0;
                    let updatedContent = content;
                    
                    // Convert each citation group
                    for (const group of groups) {
                        const result = citationService.convertCitation(updatedContent, group.number);
                        if (result.changed) {
                            updatedContent = result.content;
                            totalConverted += result.stats.citationsConverted;
                        }
                    }
                    
                    if (totalConverted > 0) {
                        editor.setValue(updatedContent);
                        new Notice(`Updated ${totalConverted} citations`);
                    } else {
                        new Notice('No citations needed conversion');
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error processing citations: ' + errorMsg);
                }
            }
        });

        // Command to insert a new citation
        this.addCommand({
            id: 'insert-hex-citation',
            name: 'Insert Hex Citation',
            editorCallback: (editor: Editor) => {
                try {
                    const cursor = editor.getCursor();
                    const hexId = citationService.getNewHexId();
                    
                    // Insert the citation reference at cursor
                    editor.replaceRange(`[^${hexId}]`, cursor);
                    
                    // Add the footnote definition at the end
                    const content = editor.getValue();
                    const footnotePosition = {
                        line: content.split('\n').length,
                        ch: 0 
                    };
                    
                    editor.replaceRange(`\n\n[^${hexId}]: `, footnotePosition);
                    
                    // Position cursor after the inserted citation
                    const newPos = {
                        line: footnotePosition.line + 2, // +2 for the two newlines
                        ch: `[^${hexId}]: `.length
                    };
                    editor.setCursor(newPos);
                    
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error inserting citation: ' + errorMsg);
                }
            }
        });
    }
}