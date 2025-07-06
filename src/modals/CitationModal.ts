import { App, Modal, Notice, Editor } from 'obsidian';
import { citationService } from '../services/citationService';

export interface CitationMatch {
    type: 'footnote' | 'reference';
    original: string;
    number: string;
    position: number;
    line: number;
    lineContent: string;
}

export class CitationModal extends Modal {
    private matches: CitationMatch[] = [];
    private content: string = '';

    constructor(app: App, private editor: Editor) {
        super(app);
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('cite-wide-modal');

        // Get current editor content
        this.content = this.editor.getValue();
        
        // Find all citations in the content
        this.findCitations();

        if (this.matches.length === 0) {
            contentEl.createEl('h3', { text: 'No Citations Found' });
            contentEl.createEl('p', { 
                text: 'No footnote references [^1] or citations [1] were found in the current note.' 
            });
            return;
        }

        // Create header
        contentEl.createEl('h3', { text: 'Citations in Current Note' });
        
        // Create table
        const table = contentEl.createEl('table', { cls: 'cite-wide-table' });
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        headerRow.createEl('th', { text: 'Type' });
        headerRow.createEl('th', { text: 'Number' });
        headerRow.createEl('th', { text: 'Context' });
        headerRow.createEl('th', { text: 'Actions' });

        const tbody = table.createEl('tbody');
        
        // Add each citation to the table
        this.matches.forEach((match) => {
            const row = tbody.createEl('tr');
            
            // Type
            row.createEl('td', { 
                text: match.type === 'footnote' ? 'Footnote' : 'Citation',
                cls: 'cite-type-cell'
            });
            
            // Number
            row.createEl('td', { 
                text: match.number,
                cls: 'cite-number-cell'
            });
            
            // Context (first 30 chars of line)
            const context = match.lineContent?.trim() || '';
            row.createEl('td', { 
                text: context.length > 30 ? context.substring(0, 30) + '...' : context,
                cls: 'cite-context-cell',
                title: context // Show full line on hover
            });
            
            // Actions
            const actionsCell = row.createEl('td', { cls: 'cite-actions-cell' });
            
            // View button
            const viewBtn = actionsCell.createEl('button', { 
                text: 'View',
                cls: 'mod-cta'
            });
            
            viewBtn.onclick = () => {
                // Move cursor to the line of this citation
                this.editor.setCursor({ line: match.line, ch: 0 });
                this.editor.focus();
                this.close();
            };
            
            // Add space between buttons
            actionsCell.createEl('span', { text: ' ', cls: 'button-spacer' });
            
            // Convert to Hex button
            const convertBtn = actionsCell.createEl('button', {
                text: 'To Hex',
                cls: 'mod-cta'
            });
            
            convertBtn.onclick = async () => {
                await this.convertCitationToHex(match);
                this.close();
            };
        });
        
        // Add convert all button if we have citations
        if (this.matches.length > 0) {
            const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
            const convertAllBtn = buttonContainer.createEl('button', {
                text: 'Convert All to Hex',
                cls: 'mod-cta'
            });
            
            convertAllBtn.onclick = async () => {
                await this.convertAllCitations();
                this.close();
            };
        }
    }

    private findCitations() {
        const lines = this.content.split('\n');
        
        lines.forEach((line, lineIndex) => {
            if (!line) return;
            
            // Find footnote references [^1]
            const footnoteRegex = /\[\^(\d+)\]/g;
            let match;
            while ((match = footnoteRegex.exec(line)) !== null) {
                if (match[0] && match[1] !== undefined) {
                    this.matches.push({
                        type: 'footnote',
                        original: match[0],
                        number: match[1],
                        position: match.index,
                        line: lineIndex,
                        lineContent: line
                    });
                }
            }
            
            // Find citations [1] (but not links [text](url))
            const citationRegex = /\[(\d+)\]/g;
            while ((match = citationRegex.exec(line)) !== null) {
                // Skip if it's part of a markdown link
                if (match[0] && match[1] !== undefined && !/\]\([^)]*$/.test(line.substring(0, match.index || 0))) {
                    this.matches.push({
                        type: 'reference',
                        original: match[0],
                        number: match[1],
                        position: match.index || 0,
                        line: lineIndex,
                        lineContent: line
                    });
                }
            }
        });
        
        // Sort by line number and then by position in line
        this.matches.sort((a, b) => {
            if (a.line !== b.line) return a.line - b.line;
            return a.position - b.position;
        });
    }

    private async convertAllCitations() {
        // This will be implemented to convert all citations to hex format
        new Notice('Converting citations to hex format...');
        // Implementation will be added after we confirm the modal works
    }

    private async convertCitationToHex(match: CitationMatch) {
        try {
            const content = this.editor.getValue();
            const lines = content.split('\n');
            let updated = false;
            
            // Generate hex ID for this citation
            const hexId = citationService.generateHexId(parseInt(match.number));
            
            // Replace all instances of this citation
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (!line) continue;
                
                // Handle footnote references [^1]
                if (match.type === 'footnote') {
                    const footnoteRef = new RegExp(`\\[\\^${match.number}\\]`, 'g');
                    if (footnoteRef.test(line)) {
                        lines[i] = line.replace(footnoteRef, `[^${hexId}]`);
                        updated = true;
                    }
                    
                    // Also check for footnote definitions
                    const footnoteDef = new RegExp(`^\\[\\^${match.number}\\]:`);
                    if (footnoteDef.test(line.trim())) {
                        lines[i] = line.replace(`[^${match.number}]:`, `[^${hexId}]:`);
                        updated = true;
                    }
                } 
                // Handle regular citations [1]
                else {
                    const citationRegex = new RegExp(`\\[${match.number}\\]`, 'g');
                    if (citationRegex.test(line)) {
                        // Skip if it's part of a markdown link
                        if (!/\]\([^)]*$/.test(line.substring(0, line.indexOf(`[${match.number}]`)))) {
                            lines[i] = line.replace(citationRegex, `[${hexId}]`);
                            updated = true;
                        }
                    }
                }
            }
            
            if (updated) {
                // Update the editor content
                this.editor.setValue(lines.join('\n'));
                new Notice(`Converted citation [${match.number}] to hex format`);
            }
            
        } catch (error) {
            console.error('Error converting citation to hex:', error);
            new Notice('Error converting citation to hex. Check console for details.');
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
