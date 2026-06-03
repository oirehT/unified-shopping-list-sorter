import { describe, expect, it } from 'vitest';
import { createShoppingListBlock, sortShoppingLists } from '../src/shoppingList';

const stores = ['aldi', 'rewe', 'dm', 'lidl', 'netto', 'penny'];

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
