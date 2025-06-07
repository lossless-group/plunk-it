import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Editor } from 'obsidian';
import * as crypto from 'crypto';

interface ContentFarmSettings {
    mySetting: string;
    localLLMPath: string;
    requestBodyTemplate: string;
}

const DEFAULT_SETTINGS: ContentFarmSettings = {
    mySetting: 'default',
    localLLMPath: 'http://localhost:3030/api/search',
    requestBodyTemplate: `{
            "chatModel": {
                "provider": "openai",
                "name": "gpt-4o-mini"
            },
            "embeddingModel": {
                "provider": "openai",
                "name": "text-embedding-3-large"
            },
            "optimizationMode": "speed",
            "focusMode": "webSearch",
            "query": "What is Perplexicas architecture",
            "history": [
                ["human", "Hi, how are you?"],
                ["assistant", "I am doing well, how can I help you today?"]
            ],
            "systemInstructions": "Focus on providing technical details about Perplexicas architecture.",
            "stream": false
        }`
};

export default class ContentFarmPlugin extends Plugin {
    public settings: ContentFarmSettings = DEFAULT_SETTINGS;
    private statusBarItemEl: HTMLElement | null = null;
    private ribbonIconEl: HTMLElement | null = null;

    async onload(): Promise<void> {
        await this.loadSettings();

        this.registerRibbonIcon();
        this.setupStatusBar();
        this.registerCommands();
        this.addSettingTab(new ContentFarmSettingTab(this.app, this));
    }

    onunload(): void {
        this.statusBarItemEl?.remove();
        this.ribbonIconEl?.remove();
    }

    private async loadSettings(): Promise<void> {
        this.settings = { 
            ...DEFAULT_SETTINGS, 
            ...(await this.loadData() ?? {}) 
        };
    }

    public async saveSettings(): Promise<void> {
        try {
            await this.saveData(this.settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
            new Notice('Failed to save settings');
        }
    }

    private async sendRequest(jsonString: string, editor?: Editor): Promise<string> {
        try {
            const response = await fetch(this.settings.localLLMPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonString,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Parse JSON to check if it's a streaming request
            const requestData = JSON.parse(jsonString);
            if (requestData.stream && editor) {
                // Insert a new line and get the position for streaming
                const cursor = editor.getCursor();
                const insertPos = { line: cursor.line + 1, ch: 0 };
                editor.replaceRange('\n', cursor);
                
                // Handle streaming response directly to editor
                const reader = response.body?.getReader();
                if (!reader) throw new Error('No response body');
                
                let result = '';
                let lastUpdate = Date.now();
                const updateThreshold = 50; // ms between updates
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = new TextDecoder().decode(value);
                    result += chunk;
                    
                    // Only update the editor at a throttled rate for performance
                    const now = Date.now();
                    if (now - lastUpdate >= updateThreshold) {
                        editor.replaceRange(chunk, insertPos);
                        lastUpdate = now;
                    } else {
                        // For the last chunk, make sure to update
                        if (done) {
                            editor.replaceRange(chunk, insertPos);
                        }
                    }
                    
                    // Move cursor to end of inserted text
                    const lines = result.split('\n');
                    const lastLine = lines[lines.length - 1] || ''; // Handle empty last line
                    editor.setCursor({
                        line: insertPos.line + Math.max(0, lines.length - 1), // Ensure non-negative line number
                        ch: lastLine.length
                    });
                }
                
                // Final update with any remaining content
                editor.replaceRange(result, insertPos);
                return result;
            } else {
                if (!editor) {
                    new Notice('Error: No active editor');
                    return '';
                }

                // Simple fetch request with the raw JSON string
                try {
                    const response = await fetch(this.settings.localLLMPath, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: jsonString
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.text();
                    editor.replaceRange('\n' + data, editor.getCursor());
                    return data;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    new Notice(`Error: ${errorMessage}`);
                    console.error('Request failed:', error);
                    return '';
                }
            }
        } catch (error) {
            console.error('Error sending request:', error);
            const errorMessage = `Error: ${error instanceof Error ? error.message : String(error)}`;
            if (editor) {
                editor.replaceRange('\n' + errorMessage, editor.getCursor());
            }
            throw new Error(errorMessage);
        }
    }

    private registerRibbonIcon(): void {
        this.ribbonIconEl = this.addRibbonIcon(
            'dice', 
            'Content Farm', 
            () => {
                new Notice('This is Deep Lossless notice!');
            }
        );
        this.ribbonIconEl?.addClass('content-farm-ribbon');
    }

    private setupStatusBar(): void {
        this.statusBarItemEl = this.addStatusBarItem();
        if (this.statusBarItemEl) {
            this.statusBarItemEl.setText('Content Farm Active');
        }
    }

    private registerCommands(): void {
        this.addCommand({
            id: 'open-content-farm-modal',
            name: 'Open Content Farm',
            callback: () => {
                new ContentFarmModal(this.app).open();
            }
        });

        this.addCommand({
            id: 'insert-sample-text',
            name: 'Insert Sample Text',
            editorCallback: (editor: Editor) => {
                editor.replaceSelection('Sample text from Content Farm');
            }
        });

        // Generate and insert a random hex ID
        this.addCommand({
            id: 'insert-hex-citation',
            name: 'Insert Random Hex Citation',
            editorCallback: (editor) => {
                const cursor = editor.getCursor();
                const line = editor.getLine(cursor.line);
                const match = line.match(/\[\^([^\]]+)\]/);
                
                if (match) {
                    const citationId = match[1];
                    editor.replaceRange(
                        `[^${citationId}]: `,
                        { line: cursor.line, ch: 0 },
                        { line: cursor.line, ch: line.length }
                    );
                    editor.setCursor(cursor.line, `[^${citationId}]: `.length);
                } else {
                    new Notice('No citation found on the current line');
                }
            }
        });

        this.addCommand({
            id: 'open-sample-modal-complex',
            name: 'Open sample modal (complex)',
            checkCallback: (checking: boolean) => {
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView) {
                    if (!checking) {
                        new ContentFarmModal(this.app).open();
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'send-perplexica-request',
            name: 'Send Perplexica Request',
            editorCallback: (editor) => {
                editor.replaceSelection(
                    '```requestjson--perplexica\n' + 
                    this.settings.requestBodyTemplate + '\n' +
                    '```'
                );
            }
        });

        // This adds an editor command that can perform some operation on the current editor instanceAdd commentMore actions
        this.addCommand({
            id: 'add-hex-citation',
            name: 'Add Hex Citation',
            editorCallback: (editor) => {
                const hexId = crypto.randomBytes(3).toString('hex');
                editor.replaceSelection(`[^${hexId}]`);
            }
        });

        // Simple curl command with NDJSON streaming support
        this.addCommand({
            id: 'curl-request',
            name: 'Curl Request',
            editorCallback: (editor: Editor) => {
                const sel = editor.getSelection() || '';
                const json = sel.match(/```[\s\S]*?```/)?.[0].replace(/```[\s\S]*?\n|```/g, '') || '';
                if (!json) { 
                    new Notice('No request found'); 
                    return; 
                }

                // Save current content and add a new line for the response
                const currentContent = editor.getValue();
                editor.setValue(currentContent + '\n'); // Add new line for response
                
                // Use spawn instead of exec to handle streaming
                const { spawn } = require('child_process');
                const echo = spawn('echo', [json]);
                const curl = spawn('curl', [
                    '-s',
                    '-X', 'POST',
                    '-H', 'Content-Type: application/json',
                    '--no-buffer',
                    '--data-binary', '@-',
                    'http://localhost:3030/api/search'
                ]);

                let responseText = '';
                
                // Pipe echo to curl
                echo.stdout.pipe(curl.stdin);

                // Handle curl output
                curl.stdout.on('data', (data: Buffer) => {
                    const lines = data.toString().split('\n').filter(line => line.trim());
                    
                    lines.forEach(line => {
                        try {
                            const message = JSON.parse(line);
                            if (message.type === 'response' && message.data) {
                                responseText += message.data;
                                
                                // Update the editor with the current response
                                const currentContent = editor.getValue();
                                const newContent = currentContent + message.data;
                                editor.setValue(newContent);
                                
                                // Move cursor to end of content
                                const pos = editor.offsetToPos(newContent.length);
                                editor.setCursor(pos);
                            }
                        } catch (e) {
                            // Ignore JSON parse errors for partial lines
                        }
                    });
                });

                curl.stderr.on('data', (data: Buffer) => {
                    new Notice(`Error: ${data.toString()}`);
                });

                curl.on('close', (code: number) => {
                    if (code !== 0) {
                        new Notice(`Process exited with code ${code}`);
                    }
                });
            }
        });

        this.addCommand({
            id: 'send-request-from-selection',
            name: 'Send Request from Selection',
            editorCallback: async (editor) => {
                const selection = editor.getSelection();
                if (!selection) {
                    new Notice('Please select a code block with the request JSON');
                    return;
                }

                try {
                    // Extract JSON from code block
                    const jsonMatch = selection.match(/```(?:requestjson--perplexica)?\n?([\s\S]*?)\n?```/);
                    if (!jsonMatch || !jsonMatch[1]) {
                        throw new Error('No valid JSON found in selection');
                    }

                    const jsonString = jsonMatch[1].trim();
                    // Log the extracted JSON for debugging
                    console.log('Extracted JSON:', jsonString);
                    
                    // Validate JSON syntax
                    try {
                        JSON.parse(jsonString); // Just validate, we'll use the string as-is
                        await this.sendRequest(jsonString, editor);
                    } catch (e: unknown) {
                        const error = e as Error;
                        console.error('JSON parse error:', error);
                        throw new Error(`Invalid JSON in code block: ${error.message}`);
                    }
                } catch (error) {
                    console.error('Error processing request:', error);
                    new Notice(`Error: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        });
    }
}

class ContentFarmModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Content Farm' });
        contentEl.createEl('p', { text: 'Welcome to Content Farm Plugin!' });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class ContentFarmSettingTab extends PluginSettingTab {
    plugin: ContentFarmPlugin;

    constructor(app: App, plugin: ContentFarmPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Content Farm Settings' });

        new Setting(containerEl)
            .setName('Custom Setting')
            .setDesc('Configure your content farm settings')
            .addText(text => text
                .setPlaceholder('Enter your setting')
                .setValue(this.plugin.settings.mySetting)
                .onChange(async (value: string) => {
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                })
            );
        
        new Setting(containerEl)
        .setName('Local LLM Path or Port')
        .setDesc('Configure your local LLM path or port')
        .addText(text => text
            .setPlaceholder('http://localhost:11434')
            .setValue(this.plugin.settings.localLLMPath)
            .onChange(async (value: string) => {
                this.plugin.settings.localLLMPath = value;
                await this.plugin.saveSettings();
            })
        );

        // Create a textarea for JSON configuration
        const jsonSetting = new Setting(containerEl)
            .setName('Request Body Template')
            .setDesc('Enter your request body template as JSON');
            
        // Create a textarea element
        const textArea = document.createElement('textarea');
        textArea.rows = 10;
        textArea.cols = 50;
        textArea.style.width = '100%';
        textArea.style.minHeight = '300px';
        textArea.style.fontFamily = 'monospace';
        textArea.placeholder = '{\n  "chatModel": {\n    "provider": "openai",\n    "name": "gpt-4o-mini"\n  },\n  "embeddingModel": {\n    "provider": "openai",\n    "name": "text-embedding-3-large"\n  },\n  "optimizationMode": "speed",\n  "focusMode": "webSearch",\n  "query": "What is Perplexica",\n  "history": [\n    ["human", "Hi, how are you?"],\n    ["assistant", "I am doing well, how can I help you today?"]\n  ],\n  "systemInstructions": "Focus on providing technical details about Perplexica\\\'s architecture.",\n  "stream": false\n}';
        
        // Set initial value if it exists
        if (this.plugin.settings.requestBodyTemplate) {
            try {
                const config = JSON.parse(this.plugin.settings.requestBodyTemplate);
                textArea.value = JSON.stringify(config, null, 2);
            } catch (e) {
                // If not valid JSON, use as is
                textArea.value = this.plugin.settings.requestBodyTemplate;
            }
        }
        
        // Add input event listener
        textArea.addEventListener('input', async () => {
            this.plugin.settings.localLLMPath = textArea.value;
            await this.plugin.saveSettings();
        });
        
        // Add the textarea to the setting
        jsonSetting.settingEl.appendChild(textArea);
    }
}
