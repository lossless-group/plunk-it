// Re-export types from obsidian.d.ts
export * from './obsidian';

// Plugin specific types
export interface PlunkItSettings {
    sendgridApiKey: string;
    plunkApiToken: string;
    senderEmail: string;
    senderName: string;
    defaultSubject: string;
    backlinkUrlBase: string | undefined;
    filterKey: string | undefined;
}

export const DEFAULT_SETTINGS: PlunkItSettings = {
    sendgridApiKey: '',
    plunkApiToken: '',
    senderEmail: '',
    senderName: '',
    defaultSubject: 'Update from {date}',
    backlinkUrlBase: undefined,
    filterKey: undefined
}

export interface PlunkItPlugin extends Plugin {
    settings: PlunkItSettings;
    loadSettings(): Promise<void>;
    saveSettings(): Promise<void>;
}
