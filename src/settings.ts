import { App, PluginSettingTab, Setting } from 'obsidian';
import ShoppingListSorterPlugin from './main';

export interface ShoppingListSorterSettings {
	autoSort: boolean;
	autoSortDelayMs: number;
	storeKeywords: string;
	defaultListTitle: string;
}

export const DEFAULT_SETTINGS: ShoppingListSorterSettings = {
	autoSort: true,
	autoSortDelayMs: 1000,
	storeKeywords: 'aldi, dm, edeka, lidl, netto, penny, rewe',
	defaultListTitle: 'Shopping list',
};

export function parseStoreKeywords(value: string): string[] {
	return value
		.split(',')
		.map((keyword) => keyword.trim().toLowerCase())
		.filter((keyword) => keyword.length > 0);
}

export class ShoppingListSorterSettingTab extends PluginSettingTab {
	plugin: ShoppingListSorterPlugin;

	constructor(app: App, plugin: ShoppingListSorterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Auto-sort')
			.setDesc('Sort managed shopping-list blocks after note edits.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoSort).onChange(async (value) => {
					this.plugin.settings.autoSort = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Auto-sort delay')
			.setDesc('Delay in milliseconds before sorting after an edit.')
			.addText((text) =>
				text
					.setPlaceholder('1000')
					.setValue(String(this.plugin.settings.autoSortDelayMs))
					.onChange(async (value) => {
						const parsed = Number.parseInt(value, 10);
						if (Number.isNaN(parsed) || parsed < 0) {
							return;
						}
						this.plugin.settings.autoSortDelayMs = parsed;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Store keywords')
			.setDesc('Comma-separated store names used for grouping.')
			.addTextArea((text) =>
				text
					.setPlaceholder('aldi, dm, edeka, lidl, netto, penny, rewe')
					.setValue(this.plugin.settings.storeKeywords)
					.onChange(async (value) => {
						this.plugin.settings.storeKeywords = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Default list title')
			.setDesc('Heading inserted by the shopping-list command.')
			.addText((text) =>
				text
					.setPlaceholder('Shopping list')
					.setValue(this.plugin.settings.defaultListTitle)
					.onChange(async (value) => {
						this.plugin.settings.defaultListTitle =
							value.trim() || DEFAULT_SETTINGS.defaultListTitle;
						await this.plugin.saveSettings();
					}),
			);
	}
}
