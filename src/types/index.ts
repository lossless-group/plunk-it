import { PluginSettingTab } from 'obsidian';
import { Plugin } from 'obsidian';

export interface PluginSettings {
  plunkApiToken: string;
  backlinkUrlBase: string;
}

export interface PlunkItPlugin extends Plugin {
  settings: PluginSettings;
}

export interface PlunkItPluginSettingsTab extends PluginSettingTab {
  plugin: PlunkItPlugin;
}
