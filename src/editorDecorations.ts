import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from '@codemirror/view';
import { isShoppingListMarkerLine } from './shoppingList';

const hiddenMarkerLine = Decoration.line({
	class: 'shopping-list-sorter-hidden-marker',
});

export const shoppingListMarkerHider = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = buildDecorations(view);
		}

		update(update: ViewUpdate): void {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = buildDecorations(update.view);
			}
		}
	},
	{
		decorations: (plugin) => plugin.decorations,
	},
);

function buildDecorations(view: EditorView): DecorationSet {
	const decorations = [];

	for (const { from, to } of view.visibleRanges) {
		let position = from;

		while (position <= to) {
			const line = view.state.doc.lineAt(position);
			if (isShoppingListMarkerLine(line.text)) {
				decorations.push(hiddenMarkerLine.range(line.from));
			}

			if (line.to + 1 > to) {
				break;
			}
			position = line.to + 1;
		}
	}

	return Decoration.set(decorations);
}
