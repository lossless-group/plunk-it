import type { App, Editor } from 'obsidian';
import { MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as crypto from 'crypto';

interface ContentFarmSettings {
    mySetting: string;
    localLLMPath: string;
    requestBodyTemplate: string;
}

const DEFAULT_SETTINGS: ContentFarmSettings = {
    mySetting: 'default',
    localLLMPath: 'http://localhost:11434',
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

        this.registerDomEvent(document, 'click', this.handleDocumentClick);
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
            editorCallback: (editor: Editor) => {
                const hexId = crypto.randomBytes(3)  // Generates 6-character hex string
                    .toString('hex');  // Keep it lowercase
                editor.replaceSelection(`[^${hexId}]`);
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

        // This adds an editor command that can perform some operation on the current editor instanceAdd commentMore actions
        this.addCommand({
            id: 'sample-editor-command',
            name: 'Sample editor command',
            editorCallback: (editor: Editor) => {
                console.log(editor.getSelection());
                editor.replaceSelection('Sample Editor Command');
            }
        });
    }

    private readonly handleDocumentClick = (evt: MouseEvent): void => {
        if (process.env.NODE_ENV === 'development') {
            console.debug('Document click:', evt);
        }
    };
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
