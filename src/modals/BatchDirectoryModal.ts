// src/modals/BatchDirectoryModal.ts

import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import { currentFileService } from '../services/currentFileService';
import { textProcessingService } from '../services/textProcessingService';
import { selectionService } from '../services/selectionService';

export class BatchDirectoryModal extends Modal {
    private targetDirectory: string = '';

    constructor(app: App, defaultDirectory?: string) {
        super(app);
        this.targetDirectory = defaultDirectory || '/';
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Batch Directory Operations' });

        // Directory Selection
        this.createDirectorySelectionSection(contentEl);
        
        // Batch File Operations
        this.createBatchFileOperationsSection(contentEl);
        
        // Batch Text Processing Operations
        this.createBatchTextProcessingSection(contentEl);
        
        // Batch Analysis Operations
        this.createBatchAnalysisSection(contentEl);
    }

    private createDirectorySelectionSection(contentEl: HTMLElement) {
        const section = contentEl.createEl('div', { cls: 'modal-section' });
        section.createEl('h3', { text: 'Directory Selection' });

        new Setting(section)
            .setName('Target Directory')
            .setDesc('Directory to process (defaults to vault root)')
            .addText(text => 
                text
                    .setPlaceholder('/ (vault root)')
                    .setValue(this.targetDirectory)
                    .onChange((value) => { 
                        this.targetDirectory = value || '/';
                    })
            )
            .addButton(button => 
                button
                    .setButtonText('List Files')
                    .onClick(async () => {
                        const files = await this.getMarkdownFilesInDirectory(this.targetDirectory);
                        new Notice(`Found ${files.length} markdown files in directory`);
                    })
            );
    }

    private createBatchFileOperationsSection(contentEl: HTMLElement) {
        const section = contentEl.createEl('div', { cls: 'modal-section' });
        section.createEl('h3', { text: 'Batch File Operations' });

        // Batch List Headers
        new Setting(section)
            .setName('Extract All Headers')
            .setDesc('Extract headers from all files in directory')
            .addButton(button => 
                button
                    .setButtonText('Extract Headers')
                    .onClick(async () => {
                        await this.processBatchOperation('listHeaders', () => {
                            new Notice('Headers extraction completed');
                        });
                    })
            );

        // Batch YAML Operations
        let yamlKey = '';
        let yamlValue = '';
        new Setting(section)
            .setName('Batch Update YAML')
            .setDesc('Update YAML key-value pair in all files')
            .addText(text => 
                text
                    .setPlaceholder('YAML key')
                    .onChange((value) => { yamlKey = value; })
            )
            .addText(text => 
                text
                    .setPlaceholder('New value')
                    .onChange((value) => { yamlValue = value; })
            )
            .addButton(button => 
                button
                    .setButtonText('Update All YAML')
                    .onClick(async () => {
                        if (!yamlKey || !yamlValue) {
                            new Notice('Please enter both key and value');
                            return;
                        }
                        
                        let filesUpdated = 0;
                        await this.processBatchOperation('updateYaml', (file, content) => {
                            const yaml = currentFileService.extractYamlFrontmatter(content);
                            if (yaml) {\n                                const updatedYaml = currentFileService.changeYamlValue(yaml, yamlKey, yamlValue);\n                                const newContent = content.replace(/^---\\n[\\s\\S]+?\\n---/, `---\\n${updatedYaml}\\n---`);\n                                this.app.vault.modify(file, newContent);\n                                filesUpdated++;\n                            }\n                        });\n                        \n                        new Notice(`Updated YAML in ${filesUpdated} files`);\n                    })\n            );\n    }\n\n    private createBatchTextProcessingSection(contentEl: HTMLElement) {\n        const section = contentEl.createEl('div', { cls: 'modal-section' });\n        section.createEl('h3', { text: 'Batch Text Processing' });\n\n        // Batch Replace All\n        let replacePattern = '';\n        let replaceWith = '';\n        new Setting(section)\n            .setName('Batch Replace All')\n            .setDesc('Replace pattern in all files in directory')\n            .addText(text => \n                text\n                    .setPlaceholder('Pattern to replace')\n                    .onChange((value) => { replacePattern = value; })\n            )\n            .addText(text => \n                text\n                    .setPlaceholder('Replace with')\n                    .onChange((value) => { replaceWith = value; })\n            )\n            .addButton(button => \n                button\n                    .setButtonText('Replace in All Files')\n                    .onClick(async () => {\n                        if (!replacePattern) {\n                            new Notice('Please enter a pattern to replace');\n                            return;\n                        }\n                        \n                        try {\n                            const regex = new RegExp(replacePattern, 'g');\n                            let filesUpdated = 0;\n                            let totalReplacements = 0;\n                            \n                            await this.processBatchOperation('replaceAll', (file, content) => {\n                                const result = textProcessingService.replaceAll(content, regex, replaceWith);\n                                if (result.changed) {\n                                    this.app.vault.modify(file, result.content);\n                                    filesUpdated++;\n                                    totalReplacements += result.stats.itemsProcessed;\n                                }\n                            });\n                            \n                            new Notice(`Made ${totalReplacements} replacements in ${filesUpdated} files`);\n                        } catch (error) {\n                            new Notice('Invalid regex pattern');\n                        }\n                    })\n            );\n\n        // Batch Remove Duplicates\n        new Setting(section)\n            .setName('Remove Duplicate Lines')\n            .setDesc('Remove duplicate lines from all files')\n            .addButton(button => \n                button\n                    .setButtonText('Remove Duplicates in All Files')\n                    .onClick(async () => {\n                        let filesUpdated = 0;\n                        let totalLinesRemoved = 0;\n                        \n                        await this.processBatchOperation('removeDuplicates', (file, content) => {\n                            const result = textProcessingService.removeDuplicateLines(content);\n                            if (result.changed) {\n                                this.app.vault.modify(file, result.content);\n                                filesUpdated++;\n                                totalLinesRemoved += result.stats.itemsProcessed;\n                            }\n                        });\n                        \n                        new Notice(`Removed ${totalLinesRemoved} duplicate lines from ${filesUpdated} files`);\n                    })\n            );\n\n        // Batch Normalize Whitespace\n        new Setting(section)\n            .setName('Normalize Whitespace')\n            .setDesc('Clean up whitespace in all files')\n            .addButton(button => \n                button\n                    .setButtonText('Normalize All Files')\n                    .onClick(async () => {\n                        let filesUpdated = 0;\n                        \n                        await this.processBatchOperation('normalizeWhitespace', (file, content) => {\n                            const result = textProcessingService.normalizeWhitespace(content);\n                            if (result.changed) {\n                                this.app.vault.modify(file, result.content);\n                                filesUpdated++;\n                            }\n                        });\n                        \n                        new Notice(`Normalized whitespace in ${filesUpdated} files`);\n                    })\n            );\n    }\n\n    private createBatchAnalysisSection(contentEl: HTMLElement) {\n        const section = contentEl.createEl('div', { cls: 'modal-section' });\n        section.createEl('h3', { text: 'Batch Analysis' });\n\n        // Count Pattern Matches\n        let countPattern = '';\n        new Setting(section)\n            .setName('Count Pattern Matches')\n            .setDesc('Count occurrences of a pattern across all files')\n            .addText(text => \n                text\n                    .setPlaceholder('Pattern to count (regex)')\n                    .onChange((value) => { countPattern = value; })\n            )\n            .addButton(button => \n                button\n                    .setButtonText('Count Matches')\n                    .onClick(async () => {\n                        if (!countPattern) {\n                            new Notice('Please enter a pattern to count');\n                            return;\n                        }\n                        \n                        try {\n                            const regex = new RegExp(countPattern, 'g');\n                            let totalMatches = 0;\n                            let filesWithMatches = 0;\n                            \n                            await this.processBatchOperation('countMatches', (file, content) => {\n                                const count = textProcessingService.countOccurrences(content, regex);\n                                if (count > 0) {\n                                    totalMatches += count;\n                                    filesWithMatches++;\n                                }\n                            });\n                            \n                            new Notice(`Found ${totalMatches} matches in ${filesWithMatches} files`);\n                        } catch (error) {\n                            new Notice('Invalid regex pattern');\n                        }\n                    })\n            );\n\n        // File Statistics\n        new Setting(section)\n            .setName('Generate Statistics')\n            .setDesc('Generate statistics for all files in directory')\n            .addButton(button => \n                button\n                    .setButtonText('Generate Stats')\n                    .onClick(async () => {\n                        const files = await this.getMarkdownFilesInDirectory(this.targetDirectory);\n                        let totalWords = 0;\n                        let totalLines = 0;\n                        let totalCharacters = 0;\n                        let filesWithYaml = 0;\n                        \n                        for (const file of files) {\n                            const content = await this.app.vault.read(file);\n                            const lines = content.split('\\n');\n                            const words = content.split(/\\s+/).filter(w => w.length > 0);\n                            \n                            totalLines += lines.length;\n                            totalWords += words.length;\n                            totalCharacters += content.length;\n                            \n                            if (currentFileService.extractYamlFrontmatter(content)) {\n                                filesWithYaml++;\n                            }\n                        }\n                        \n                        const stats = [\n                            `Files: ${files.length}`,\n                            `Total Lines: ${totalLines}`,\n                            `Total Words: ${totalWords}`,\n                            `Total Characters: ${totalCharacters}`,\n                            `Files with YAML: ${filesWithYaml}`\n                        ];\n                        \n                        new Notice(`Directory Statistics:\\n${stats.join('\\n')}`);\n                    })\n            );\n    }\n\n    private async getMarkdownFilesInDirectory(directory: string): Promise<TFile[]> {\n        const files = this.app.vault.getMarkdownFiles();\n        \n        if (directory === '/' || directory === '') {\n            return files;\n        }\n        \n        return files.filter(file => file.path.startsWith(directory));\n    }\n\n    private async processBatchOperation(\n        operationType: string,\n        callback: (file: TFile, content: string) => void\n    ): Promise<void> {\n        const files = await this.getMarkdownFilesInDirectory(this.targetDirectory);\n        \n        if (files.length === 0) {\n            new Notice('No markdown files found in directory');\n            return;\n        }\n        \n        new Notice(`Processing ${files.length} files...`);\n        \n        for (const file of files) {\n            try {\n                const content = await this.app.vault.read(file);\n                callback(file, content);\n            } catch (error) {\n                console.error(`Error processing file ${file.path}:`, error);\n            }\n        }\n        \n        new Notice(`Batch operation '${operationType}' completed`);\n    }\n\n    onClose() {\n        const { contentEl } = this;\n        contentEl.empty();\n    }\n}"
