// cite-wide/src/modals/CitationModal.ts
import { App, Modal, Notice, Editor } from 'obsidian';
import { citationService, type CitationGroup } from '../services/citationService';

export class CitationModal extends Modal {
    private editor: Editor;
    private content: string;
    private citationGroups: CitationGroup[] = [];

    constructor(app: App, editor: Editor) {
        super(app);
        this.editor = editor;
        this.content = editor.getValue();
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('cite-wide-modal');

        // Find all citation groups
        this.citationGroups = citationService.findCitations(this.content);

        if (this.citationGroups.length === 0) {
            contentEl.createEl('p', { 
                text: 'No citations found in the current document.' 
            });
            return;
        }

        // Create a container for citation groups
        const container = contentEl.createDiv('cite-wide-container');
        
        // Add a title
        container.createEl('h2', { 
            text: 'Citations in Document',
            cls: 'cite-wide-title'
        });

        // Add each citation group
        for (const group of this.citationGroups) {
            this.renderCitationGroup(container, group);
        }

        // Add convert all button
        const footer = contentEl.createDiv('cite-wide-footer');
        const convertAllBtn = footer.createEl('button', {
            text: 'Convert All to Hex',
            cls: 'mod-cta'
        });

        convertAllBtn.addEventListener('click', () => this.convertAllCitations());
    }

    private renderCitationGroup(container: HTMLElement, group: CitationGroup) {
        const groupEl = container.createDiv('cite-wide-group');
        const header = groupEl.createDiv('cite-wide-group-header');
        
        // Create a collapsible header
        const headerContent = header.createDiv('cite-wide-group-header-content');
        headerContent.createEl('h3', { 
            text: `Citation [${group.number}] (${group.matches.length} instances)`,
            cls: 'cite-wide-group-title'
        });

        if (group.url) {
            headerContent.createEl('a', {
                href: group.url,
                text: 'Source',
                cls: 'cite-wide-source-link',
                attr: { target: '_blank' }
            });
        }

        // Add convert button
        const convertBtn = header.createEl('button', {
            text: 'Convert to Hex',
            cls: 'mod-cta cite-wide-convert-btn'
        });

        convertBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.convertCitationGroup(group);
        });

        // Create collapsible content
        const content = groupEl.createDiv('cite-wide-group-content');
        content.style.display = 'none'; // Start collapsed

        // Toggle content on header click
        header.addEventListener('click', () => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });

        // Add each citation instance
        group.matches.forEach((match) => {
            const instanceEl = content.createDiv('cite-wide-instance');
            
            // Show line number and preview
            const lineInfo = instanceEl.createDiv('cite-wide-line-info');
            lineInfo.createEl('span', { 
                text: `Line ${match.lineNumber + 1}: `,
                cls: 'cite-wide-line-number'
            });

            // Create a preview of the line content
            const preview = match.lineContent.trim();
            const previewText = preview.length > 100 
                ? `${preview.substring(0, 100)}...` 
                : preview;
                
            lineInfo.createEl('span', {
                text: previewText,
                cls: 'cite-wide-line-preview'
            });

            // Add view button
            const viewBtn = instanceEl.createEl('button', {
                text: 'View',
                cls: 'mod-cta-outline cite-wide-view-btn'
            });

            viewBtn.addEventListener('click', () => {
                this.scrollToLine(match.lineNumber);
            });
        });
    }

    private async convertCitationGroup(group: CitationGroup) {
        try {
            const result = citationService.convertCitation(
                this.content,
                group.number
            );

            if (result.changed) {
                await this.saveChanges(result.content);
                new Notice(`Converted citation [${group.number}] to hex format`);
                this.close();
            } else {
                new Notice('No changes were made to the document');
            }
        } catch (error) {
            console.error('Error converting citation:', error);
            new Notice('Error converting citation. See console for details.');
        }
    }

    private async convertAllCitations() {
        try {
            let updatedContent = this.content;
            let totalConverted = 0;

            // Process each group
            for (const group of this.citationGroups) {
                const result = citationService.convertCitation(
                    updatedContent,
                    group.number
                );

                if (result.changed) {
                    updatedContent = result.content;
                    totalConverted += result.stats.citationsConverted;
                }
            }

            if (totalConverted > 0) {
                await this.saveChanges(updatedContent);
                new Notice(`Converted ${totalConverted} citations to hex format`);
                this.close();
            } else {
                new Notice('No citations were converted');
            }
        } catch (error) {
            console.error('Error converting citations:', error);
            new Notice('Error converting citations. See console for details.');
        }
    }

    private async saveChanges(newContent: string) {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            throw new Error('No active file');
        }

        await this.app.vault.modify(activeFile, newContent);
    }

    private scrollToLine(lineNumber: number) {
        this.editor.setCursor({ line: lineNumber, ch: 0 });
        this.editor.scrollIntoView({
            from: { line: Math.max(0, lineNumber - 2), ch: 0 },
            to: { line: lineNumber + 2, ch: 0 }
        }, true);
        this.close();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}