import { App, Modal, Notice, Editor, TFile } from 'obsidian';
import { citationService, type CitationConversionResult } from '../services/citationService';

// Extend the Obsidian Modal interface to include contentEl
declare module 'obsidian' {
    interface Modal {
        contentEl: HTMLElement;
    }
}

/**
 * Represents a single citation match in the document
 */
interface CitationMatch {
    type: 'footnote' | 'reference' | 'perplexity';
    original: string;
    number: string;
    position: number;
    line: number;
    lineContent: string;
}

interface CitationGroup {
    type: string;
    number: string;
    matches: CitationMatch[];
}

/**
 * Modal for displaying and managing citations in the current document
 */
export class CitationModal extends Modal {
    private matches: CitationMatch[] = [];
    private editor: Editor;
    private content: string;

    constructor(app: App, editor: Editor) {
        super(app);
        this.editor = editor;
        this.content = editor.getValue();
    }

    async onOpen(): Promise<void> {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('cite-wide-modal');

        // Find all citations in the document
        this.findCitations();

        // If no citations found, show a message
        if (this.matches.length === 0) {
            contentEl.createEl('p', { text: 'No citations found in the current document.' });
            return;
        }

        // Group citations by type and number
        const groupedCitations = this.groupCitations();

        // Create a container for the citation groups
        const container = contentEl.createDiv({ cls: 'citation-groups' });

        // Render each citation group
        Object.entries(groupedCitations).forEach(([key, group]) => {
            const [type, number] = key.split(':');
            const groupEl = container.createDiv({ cls: 'citation-group' });

            // Create header with toggle functionality
            const header = groupEl.createDiv({ cls: 'citation-group-header' });
            header.createEl('h3', { 
                text: `${type === 'footnote' ? 'Footnote' : 'Citation'} [${number}] (${group.matches.length} occurrences)` 
            });

            // Create content container (initially hidden)
            const content = groupEl.createDiv({ cls: 'citation-group-content' });

            // Add toggle functionality
            header.onclick = () => {
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            };

            // Add each citation context
            group.matches.forEach((match: CitationMatch) => {
                const contextEl = content.createDiv({ cls: 'citation-context' });
                contextEl.createEl('div', { 
                    text: `Line ${match.line + 1}: ${match.lineContent}`,
                    cls: 'citation-line'
                });

                // Add action buttons
                const actions = contextEl.createDiv({ cls: 'citation-actions' });

                // View button
                actions.createEl('button', {
                    text: 'View',
                    cls: 'mod-cta',
                    attr: { 'data-action': 'view' }
                }).addEventListener('click', () => this.scrollToCitation(match));

                // Convert to Hex button
                actions.createEl('button', {
                    text: 'To Hex',
                    cls: 'mod-cta',
                    attr: { 'data-action': 'convert' }
                }).addEventListener('click', () => this.convertCitationToHex(match));
            });
        });

        // Add a button to convert all citations
        const footer = contentEl.createDiv({ cls: 'modal-button-container' });
        footer.createEl('button', {
            text: 'Convert All to Hex',
            cls: 'mod-cta',
            attr: { 'data-action': 'convert-all' }
        }).addEventListener('click', () => this.convertAllCitations());
    }

    /**
     * Groups citations by their type and number
     */
    private groupCitations(): Record<string, CitationGroup> {
        const groups: Record<string, CitationGroup> = {};

        this.matches.forEach((match: CitationMatch) => {
            const key = `${match.type}:${match.number}`;
            if (!groups[key]) {
                groups[key] = {
                    type: match.type,
                    number: match.number,
                    matches: []
                };
            }
            groups[key]?.matches.push(match);
        });

        return groups;
    }

    /**
     * Scrolls the editor to a specific citation
     */
    private scrollToCitation(match: CitationMatch): void {
        const line = Math.max(0, match.line - 2); // Show a couple lines before the match
        this.editor.setCursor({ line, ch: 0 });
        this.editor.scrollIntoView({ from: { line, ch: 0 }, to: { line: line + 5, ch: 0 } });
        this.close();
    }

    /**
     * Finds all citations in the current document
     */
    private findCitations(): void {
        const lines = this.content.split('\n');

        lines.forEach((line: string, lineIndex: number) => {
            if (!line) return;

            // Find footnote references [^1]
            const footnoteRegex = /\[\^(\d+)\]/g;
            let footnoteMatch;
            while ((footnoteMatch = footnoteRegex.exec(line)) !== null) {
                this.matches.push({
                    type: 'footnote',
                    number: footnoteMatch[1] || '',
                    original: footnoteMatch[0] || '',
                    position: footnoteMatch.index || 0,
                    line: lineIndex,
                    lineContent: line
                });
            }

            // Find standard citations [1] (but not links [text](url))
            const citationRegex = /\[(\d+)\]/g;
            let citationMatch;
            while ((citationMatch = citationRegex.exec(line)) !== null) {
                // Skip if it's part of a markdown link
                if (!/\]\([^)]*$/.test(line.substring(0, citationMatch.index || 0))) {
                    this.matches.push({
                        type: 'reference',
                        number: citationMatch[1] || '',
                        original: citationMatch[0] || '',
                        position: citationMatch.index || 0,
                        line: lineIndex,
                        lineContent: line
                    });
                }
            }
        });
    }

    /**
     * Converts all citations in the document to hex format
     */
    private async convertAllCitations(): Promise<void> {
        new Notice('Converting all citations to hex format...');
        try {
            const content = this.editor.getValue();
            const result = citationService.convertCitations(content);

            if (result?.changed) {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) {
                    new Notice('No active file found');
                    return;
                }

                await this.app.vault.modify(activeFile as TFile, result.updatedContent);
                new Notice('Successfully converted all citations to hex format');
                this.close();
            } else {
                new Notice('No citations were converted');
            }
        } catch (error) {
            console.error('Error converting citations:', error);
            new Notice('Error converting citations. See console for details.');
        }
    }

    /**
     * Converts a specific citation to hex format
     */
    private async convertCitationToHex(match: CitationMatch): Promise<void> {
        try {
            const content = this.editor.getValue();

            // Use the citation service to handle the conversion
            const result = citationService.convertCitations(
                content,
                match.type === 'footnote' ? `[^${match.number}]` : `[${match.number}]`
            );

            if (result?.changed) {
                // Get the current file
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) {
                    new Notice('No active file found');
                    return;
                }

                await this.app.vault.modify(activeFile as TFile, result.updatedContent);
                new Notice(`Successfully converted ${match.type} [${match.number}] to hex format`);
                this.close();
            } else {
                new Notice(`No changes were made to ${match.type} [${match.number}]`);
            }
        } catch (error) {
            console.error(`Error converting citation ${match.number}:`, error);
            new Notice(`Error converting citation ${match.number}. See console for details.`);
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
