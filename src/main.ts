import { Editor, Notice, Plugin } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	parseStoreKeywords,
	ShoppingListSorterSettingTab,
	ShoppingListSorterSettings,
} from './settings';
import {
	createShoppingListBlock,
	sortShoppingLists,
	START_MARKER_PREFIX,
} from './shoppingList';

export default class ShoppingListSorterPlugin extends Plugin {
	settings!: ShoppingListSorterSettings;
	private isSorting = false;
	private pendingAutoSort: number | null = null;
	private pendingEditor: Editor | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addCommand({
			id: 'insert-shopping-list',
			name: 'Insert shopping list',
			editorCallback: (editor: Editor) => {
				editor.replaceSelection(
					createShoppingListBlock(this.settings.defaultListTitle),
				);
			},
		});

		this.addCommand({
			id: 'sort-shopping-lists',
			name: 'Sort shopping lists in current note',
			editorCallback: (editor: Editor) => {
				this.clearPendingAutoSort();
				this.sortEditor(editor, true);
			},
		});

		this.registerEvent(
			this.app.workspace.on('editor-change', (editor: Editor) => {
				this.scheduleAutoSort(editor);
			}),
		);

		this.addSettingTab(new ShoppingListSorterSettingTab(this.app, this));
	}

	onunload(): void {
		this.clearPendingAutoSort();
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

	private scheduleAutoSort(editor: Editor): void {
		if (this.isSorting || !this.settings.autoSort) {
			return;
		}

		if (!editor.getValue().includes(START_MARKER_PREFIX)) {
			return;
		}

		this.pendingEditor = editor;
		if (this.pendingAutoSort !== null) {
			window.clearTimeout(this.pendingAutoSort);
		}

		this.pendingAutoSort = window.setTimeout(() => {
			const editorToSort = this.pendingEditor;
			this.pendingAutoSort = null;
			this.pendingEditor = null;

			if (editorToSort !== null) {
				this.sortEditor(editorToSort, false);
			}
		}, this.getAutoSortDelayMs());
	}

	private sortEditor(editor: Editor, showNotice: boolean): void {
		const result = sortShoppingLists(editor.getValue(), {
			storeKeywords: parseStoreKeywords(this.settings.storeKeywords),
		});

		if (!result.changed) {
			if (showNotice) {
				new Notice('No managed shopping lists needed sorting.');
			}
			return;
		}

		this.isSorting = true;
		try {
			replaceEditorContent(editor, result.text);
		} finally {
			this.isSorting = false;
		}

		if (showNotice) {
			const suffix = result.blocksSorted === 1 ? '' : 's';
			new Notice(`Sorted ${result.blocksSorted} shopping list${suffix}.`);
		}
	}

	private clearPendingAutoSort(): void {
		if (this.pendingAutoSort !== null) {
			window.clearTimeout(this.pendingAutoSort);
			this.pendingAutoSort = null;
		}
		this.pendingEditor = null;
	}

	private getAutoSortDelayMs(): number {
		const delay = this.settings.autoSortDelayMs;
		if (!Number.isFinite(delay) || delay < 0) {
			return DEFAULT_SETTINGS.autoSortDelayMs;
		}

		return delay;
	}
}

function replaceEditorContent(editor: Editor, content: string): void {
	const cursor = editor.getCursor();
	const cursorOffset = editor.posToOffset(cursor);
	const lastLine = editor.lastLine();
	const end = {
		line: lastLine,
		ch: editor.getLine(lastLine).length,
	};

	editor.replaceRange(content, { line: 0, ch: 0 }, end, 'shopping-list-sorter');
	const nextOffset = Math.min(cursorOffset, content.length);
	editor.setCursor(editor.offsetToPos(nextOffset));
}
