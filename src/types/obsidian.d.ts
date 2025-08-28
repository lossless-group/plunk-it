import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf } from 'obsidian';

declare module 'obsidian' {
  interface App {
    commands: any;
    vault: Vault;
    workspace: Workspace;
  }
  
  interface Vault {
    modify(file: TFile, content: string): Promise<void>;
  }

  interface Workspace {
    getActiveViewOfType<T extends View>(type: new(...args: any[]) => T): T | null;
    activeLeaf: WorkspaceLeaf | null;
  }

  interface View {
    file: TFile | null;
  }
  
  interface Editor {
    getSelection(): string;
    replaceSelection(text: string): void;
    getCursor(): { line: number, ch: number };
    setCursor(line: number, ch: number): void;
    lastLine(): number;
  }

  interface MarkdownView extends View {
    editor: Editor;
  }

  class Modal {
    contentEl: HTMLElement;
    constructor(app: App);
    onOpen(): void;
    onClose(): void;
    close(): void;
  }

  class Setting {
    constructor(containerEl: HTMLElement);
    setName(name: string): this;
    setDesc(desc: string): this;
    addText(cb: (text: HTMLInputElement) => any): this;
    addToggle(cb: (toggle: HTMLInputElement) => any): this;
    addDropdown(cb: (dropdown: HTMLSelectElement) => any): this;
    onChange(cb: (value: string) => any): this;
  }

  interface PluginManifest {
    dir: string;
  }
}
