import { Editor, Notice, Plugin } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	ShoppingListSorterSettingTab,
	ShoppingListSorterSettings,
} from './settings';

export default class ShoppingListSorterPlugin extends Plugin {
	settings!: ShoppingListSorterSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addCommand({
			id: 'insert-shopping-list',
			name: 'Insert shopping list',
			editorCallback: (editor: Editor) => {
				editor.replaceSelection(this.createShoppingListBlock());
			},
		});

		this.addCommand({
			id: 'sort-shopping-lists',
			name: 'Sort shopping lists in current note',
			editorCallback: (_editor: Editor) => {
				new Notice('Shopping list sorting will be added next.');
			},
		});

		this.addSettingTab(new ShoppingListSorterSettingTab(this.app, this));
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<ShoppingListSorterSettings>,
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private createShoppingListBlock(): string {
		const title =
			this.settings.defaultListTitle.trim() || DEFAULT_SETTINGS.defaultListTitle;
		return [
			`<!-- shopping-list:start {"title":"${title.replaceAll('"', '\\"')}"} -->`,
			`## ${title}`,
			'- [ ] ',
			'<!-- shopping-list:end -->',
			'',
		].join('\n');
	}
}
