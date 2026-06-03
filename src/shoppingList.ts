export const START_MARKER_PREFIX = 'shopping-list:start';
export const END_MARKER_PREFIX = 'shopping-list:end';

const START_MARKER_PATTERN = /^\s*<!--\s*shopping-list:start(?:\s+.*?)?\s*-->\s*$/;
const END_MARKER_PATTERN = /^\s*<!--\s*shopping-list:end\s*-->\s*$/;
const TASK_LINE_PATTERN = /^(\s*)([-*+]) \[([ xX])\] (.*)$/;

export interface SortShoppingListsOptions {
	storeKeywords: string[];
	locale?: string;
}

export interface SortShoppingListsResult {
	text: string;
	changed: boolean;
	blocksSorted: number;
}

interface TaskLine {
	line: string;
	indent: string;
	checked: boolean;
	text: string;
	store: string | null;
	sortText: string;
	index: number;
}

export function createShoppingListBlock(title: string): string {
	const safeTitle = title.trim() || 'Shopping list';
	return [
		`<!-- ${START_MARKER_PREFIX} {"title":"${escapeJsonString(safeTitle)}"} -->`,
		`## ${safeTitle}`,
		'- [ ] ',
		`<!-- ${END_MARKER_PREFIX} -->`,
		'',
	].join('\n');
}

export function sortShoppingLists(
	markdown: string,
	options: SortShoppingListsOptions,
): SortShoppingListsResult {
	const lines = markdown.split('\n');
	const sortedLines = [...lines];
	let changed = false;
	let blocksSorted = 0;

	for (let lineIndex = 0; lineIndex < sortedLines.length; lineIndex += 1) {
		if (!isStartMarker(sortedLines[lineIndex] ?? '')) {
			continue;
		}

		const endIndex = findEndMarker(sortedLines, lineIndex + 1);
		if (endIndex === -1) {
			break;
		}

		const blockLines = sortedLines.slice(lineIndex + 1, endIndex);
		const sortedBlock = sortBlockLines(blockLines, options);
		if (sortedBlock.changed) {
			sortedLines.splice(lineIndex + 1, blockLines.length, ...sortedBlock.lines);
			changed = true;
			blocksSorted += 1;
		}

		lineIndex = endIndex;
	}

	return {
		text: changed ? sortedLines.join('\n') : markdown,
		changed,
		blocksSorted,
	};
}

export function isShoppingListMarkerLine(line: string): boolean {
	return isStartMarker(line) || isEndMarker(line);
}

function sortBlockLines(
	lines: string[],
	options: SortShoppingListsOptions,
): { lines: string[]; changed: boolean } {
	const taskIndexes = lines
		.map((line, index) => ({ line, index, task: parseTaskLine(line) }))
		.filter((entry) => entry.task !== null);

	if (taskIndexes.length < 2) {
		return { lines, changed: false };
	}

	const firstTaskIndex = taskIndexes[0]?.index;
	const lastTaskIndex = taskIndexes[taskIndexes.length - 1]?.index;
	if (firstTaskIndex === undefined || lastTaskIndex === undefined) {
		return { lines, changed: false };
	}

	const taskRegion = lines.slice(firstTaskIndex, lastTaskIndex + 1);
	const hasUnsupportedLine = taskRegion.some(
		(line) => line.trim().length > 0 && parseTaskLine(line) === null,
	);
	if (hasUnsupportedLine) {
		return { lines, changed: false };
	}

	const tasks = taskRegion
		.map((line, index) => {
			const parsed = parseTaskLine(line);
			if (parsed === null) {
				return null;
			}
			const detectedStore = detectStore(parsed.text, options.storeKeywords);
			return {
				line,
				indent: parsed.indent,
				checked: parsed.checked,
				text: parsed.text,
				store: detectedStore,
				sortText: normaliseSortText(parsed.text, options.storeKeywords),
				index,
			};
		})
		.filter((task): task is TaskLine => task !== null);

	const firstIndent = tasks[0]?.indent;
	if (firstIndent === undefined || tasks.some((task) => task.indent !== firstIndent)) {
		return { lines, changed: false };
	}

	const collator = new Intl.Collator(options.locale ?? 'de', {
		numeric: true,
		sensitivity: 'base',
	});
	const sortedTasks = [...tasks].sort((left, right) =>
		compareTasks(left, right, collator),
	);
	const sortedTaskLines = sortedTasks.map((task) => task.line);
	const nextLines = [
		...lines.slice(0, firstTaskIndex),
		...sortedTaskLines,
		...lines.slice(lastTaskIndex + 1),
	];

	const changed = nextLines.some((line, index) => line !== lines[index]);
	return { lines: changed ? nextLines : lines, changed };
}

function parseTaskLine(line: string): {
	indent: string;
	checked: boolean;
	text: string;
} | null {
	const match = TASK_LINE_PATTERN.exec(line);
	if (match === null) {
		return null;
	}

	const [, indent, , status, text] = match;
	if (indent === undefined || status === undefined || text === undefined) {
		return null;
	}

	return {
		indent,
		checked: status.toLowerCase() === 'x',
		text,
	};
}

function compareTasks(
	left: TaskLine,
	right: TaskLine,
	collator: Intl.Collator,
): number {
	const checkedComparison = Number(left.checked) - Number(right.checked);
	if (checkedComparison !== 0) {
		return checkedComparison;
	}

	const leftStoreRank = left.store === null ? 0 : 1;
	const rightStoreRank = right.store === null ? 0 : 1;
	if (leftStoreRank !== rightStoreRank) {
		return leftStoreRank - rightStoreRank;
	}

	if (left.store !== null && right.store !== null) {
		const storeComparison = collator.compare(left.store, right.store);
		if (storeComparison !== 0) {
			return storeComparison;
		}
	}

	const textComparison = collator.compare(left.sortText, right.sortText);
	if (textComparison !== 0) {
		return textComparison;
	}

	return left.index - right.index;
}

function findEndMarker(lines: string[], startIndex: number): number {
	for (let index = startIndex; index < lines.length; index += 1) {
		if (isEndMarker(lines[index] ?? '')) {
			return index;
		}
	}

	return -1;
}

function isStartMarker(line: string): boolean {
	return START_MARKER_PATTERN.test(line);
}

function isEndMarker(line: string): boolean {
	return END_MARKER_PATTERN.test(line);
}

function detectStore(text: string, storeKeywords: string[]): string | null {
	const normalisedStores = normaliseStoreKeywords(storeKeywords);
	const matchedStores = normalisedStores.filter((store) =>
		createStorePattern(store).test(text),
	);

	if (matchedStores.length === 0) {
		return null;
	}

	return matchedStores.sort((left, right) =>
		left.localeCompare(right, 'de', { sensitivity: 'base' }),
	)[0] ?? null;
}

function normaliseSortText(text: string, storeKeywords: string[]): string {
	let value = text;
	for (const store of normaliseStoreKeywords(storeKeywords)) {
		value = value.replace(createStorePattern(store), ' ');
	}

	return value
		.replace(/[()/?,]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function normaliseStoreKeywords(storeKeywords: string[]): string[] {
	return Array.from(
		new Set(
			storeKeywords
				.map((store) => store.trim().toLowerCase())
				.filter((store) => store.length > 0),
		),
	).sort((left, right) => left.localeCompare(right, 'de', { sensitivity: 'base' }));
}

function createStorePattern(store: string): RegExp {
	return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(store)}(?=$|[^\\p{L}\\p{N}])`, 'giu');
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeJsonString(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
