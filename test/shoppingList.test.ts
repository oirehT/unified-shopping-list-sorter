import { describe, expect, it } from 'vitest';
import {
	createShoppingListBlock,
	isShoppingListMarkerLine,
	sortShoppingLists,
} from '../src/shoppingList';

const stores = ['aldi', 'rewe', 'dm', 'edeka', 'lidl', 'netto', 'penny'];

describe('sortShoppingLists', () => {
	it('keeps unchecked items above checked items and sorts each status group', () => {
		const input = [
			'<!-- shopping-list:start {"title":"Alltag einkaufen"} -->',
			'## Alltag einkaufen',
			'- [x] Zahnpasta',
			'- [ ] Olivenöl',
			'- [ ] Gesichtscreme',
			'- [x] Butter',
			'<!-- shopping-list:end -->',
			'',
		].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });

		expect(result.changed).toBe(true);
		expect(result.blocksSorted).toBe(1);
		expect(result.text).toBe(
			[
				'<!-- shopping-list:start {"title":"Alltag einkaufen"} -->',
				'## Alltag einkaufen',
				'- [ ] Gesichtscreme',
				'- [ ] Olivenöl',
				'- [x] Butter',
				'- [x] Zahnpasta',
				'<!-- shopping-list:end -->',
				'',
			].join('\n'),
		);
	});

	it('sorts untagged items before configured store groups and sorts store groups A-Z', () => {
		const input = [
			'Outside',
			'<!-- shopping-list:start -->',
			'## Alltag einkaufen',
			'- [ ] Pesto Rewe',
			'- [ ] Honig',
			'- [ ] Milch Aldi',
			'- [ ] Kaffee',
			'- [ ] Body Creme dm',
			'- [ ] Gurken Edeka',
			'- [ ] Nudeln Rewe',
			'- [ ] Pizza Rewe/Aldi',
			'<!-- shopping-list:end -->',
		].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });

		expect(result.text).toBe(
			[
				'Outside',
				'<!-- shopping-list:start -->',
				'## Alltag einkaufen',
				'- [ ] Honig',
				'- [ ] Kaffee',
				'- [ ] Milch Aldi',
				'- [ ] Pizza Rewe/Aldi',
				'- [ ] Body Creme dm',
				'- [ ] Gurken Edeka',
				'- [ ] Nudeln Rewe',
				'- [ ] Pesto Rewe',
				'<!-- shopping-list:end -->',
			].join('\n'),
		);
	});

	it('detects store keywords case-insensitively around punctuation', () => {
		const input = [
			'<!-- shopping-list:start -->',
			'## Alltag einkaufen',
			'- [ ] Nudeln REWE',
			'- [ ] Mayo (Rewe)',
			'- [ ] Shampoo DM?',
			'<!-- shopping-list:end -->',
		].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });

		expect(result.text).toBe(
			[
				'<!-- shopping-list:start -->',
				'## Alltag einkaufen',
				'- [ ] Shampoo DM?',
				'- [ ] Mayo (Rewe)',
				'- [ ] Nudeln REWE',
				'<!-- shopping-list:end -->',
			].join('\n'),
		);
	});

	it('does not touch unmarked checkbox lists', () => {
		const input = ['- [x] Zebra', '- [ ] Apple'].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });

		expect(result.changed).toBe(false);
		expect(result.text).toBe(input);
	});

	it('sorts multiple managed blocks independently', () => {
		const input = [
			'<!-- shopping-list:start -->',
			'## One',
			'- [x] B',
			'- [ ] A',
			'<!-- shopping-list:end -->',
			'Middle',
			'<!-- shopping-list:start -->',
			'## Two',
			'- [x] D',
			'- [x] C',
			'<!-- shopping-list:end -->',
		].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });

		expect(result.blocksSorted).toBe(2);
		expect(result.text).toBe(
			[
				'<!-- shopping-list:start -->',
				'## One',
				'- [ ] A',
				'- [x] B',
				'<!-- shopping-list:end -->',
				'Middle',
				'<!-- shopping-list:start -->',
				'## Two',
				'- [x] C',
				'- [x] D',
				'<!-- shopping-list:end -->',
			].join('\n'),
		);
	});

	it('leaves blocks unchanged when task content has unsupported interleaved notes', () => {
		const input = [
			'<!-- shopping-list:start -->',
			'## Alltag einkaufen',
			'- [x] Kaffee',
			'Remember coupons',
			'- [ ] Milch',
			'<!-- shopping-list:end -->',
		].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });

		expect(result.changed).toBe(false);
		expect(result.text).toBe(input);
	});

	it('leaves nested lists unchanged to avoid breaking task hierarchy', () => {
		const input = [
			'<!-- shopping-list:start -->',
			'## Alltag einkaufen',
			'- [x] Kaffee',
			'  - [ ] Pads',
			'- [ ] Milch',
			'<!-- shopping-list:end -->',
		].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });

		expect(result.changed).toBe(false);
		expect(result.text).toBe(input);
	});

	it('maps each original line to its sorted line so the cursor can follow an item', () => {
		const input = [
			'Outside',
			'<!-- shopping-list:start -->',
			'## Alltag einkaufen',
			'- [ ] Zwiebeln',
			'- [ ] Milch Aldi',
			'- [ ] Brot',
			'<!-- shopping-list:end -->',
			'<!-- shopping-list:start -->',
			'- [ ] Tee',
			'- [ ] Apfel',
			'<!-- shopping-list:end -->',
		].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });
		const inputLines = input.split('\n');
		const outputLines = result.text.split('\n');

		expect(result.lineMap).toEqual([0, 1, 2, 4, 5, 3, 6, 7, 9, 8, 10]);
		inputLines.forEach((line, index) => {
			expect(outputLines[result.lineMap[index] ?? -1]).toBe(line);
		});
	});

	it('maps removed blank lines to the sorted line of the item above them', () => {
		const input = [
			'<!-- shopping-list:start -->',
			'- [ ] Zwiebeln',
			'',
			'- [ ] Brot',
			'<!-- shopping-list:end -->',
		].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });

		expect(result.text.split('\n')).toEqual([
			'<!-- shopping-list:start -->',
			'- [ ] Brot',
			'- [ ] Zwiebeln',
			'<!-- shopping-list:end -->',
		]);
		expect(result.lineMap).toEqual([0, 2, 2, 1, 3]);
	});

	it('sorts a block that directly follows a block whose blank lines were removed', () => {
		const input = [
			'<!-- shopping-list:start -->',
			'- [ ] Zwiebeln',
			'',
			'- [ ] Brot',
			'<!-- shopping-list:end -->',
			'<!-- shopping-list:start -->',
			'- [ ] Tee',
			'- [ ] Apfel',
			'<!-- shopping-list:end -->',
		].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });

		expect(result.blocksSorted).toBe(2);
		expect(result.text.split('\n')).toEqual([
			'<!-- shopping-list:start -->',
			'- [ ] Brot',
			'- [ ] Zwiebeln',
			'<!-- shopping-list:end -->',
			'<!-- shopping-list:start -->',
			'- [ ] Apfel',
			'- [ ] Tee',
			'<!-- shopping-list:end -->',
		]);
		expect(result.lineMap).toEqual([0, 2, 2, 1, 3, 4, 6, 5, 7]);
	});

	it('returns an identity line map when nothing needs sorting', () => {
		const input = [
			'<!-- shopping-list:start -->',
			'- [ ] Brot',
			'- [ ] Milch',
			'<!-- shopping-list:end -->',
		].join('\n');

		const result = sortShoppingLists(input, { storeKeywords: stores });

		expect(result.changed).toBe(false);
		expect(result.lineMap).toEqual([0, 1, 2, 3]);
	});
});

describe('createShoppingListBlock', () => {
	it('creates an Obsidian-friendly managed shopping-list block', () => {
		expect(createShoppingListBlock('Alltag einkaufen')).toBe(
			[
				'<!-- shopping-list:start {"title":"Alltag einkaufen"} -->',
				'## Alltag einkaufen',
				'- [ ] ',
				'<!-- shopping-list:end -->',
				'',
			].join('\n'),
		);
	});
});

describe('isShoppingListMarkerLine', () => {
	it('identifies managed block markers for editor hiding', () => {
		expect(
			isShoppingListMarkerLine(
				'<!-- shopping-list:start {"title":"Alltag einkaufen"} -->',
			),
		).toBe(true);
		expect(isShoppingListMarkerLine('<!-- shopping-list:end -->')).toBe(true);
		expect(isShoppingListMarkerLine('- [ ] Milch Aldi')).toBe(false);
	});
});
