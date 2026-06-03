# Unified Shopping List Sorter

Unified Shopping List Sorter is an Obsidian plugin for managed shopping-list blocks. It inserts Markdown task-list blocks into notes and keeps only those blocks sorted by checkbox status, configured store keywords, and item name.

## Current scope

- Insert a managed shopping list from the command palette.
- Sort managed shopping-list blocks without touching normal checkboxes elsewhere in the note.
- Hide managed block markers in the editor so lists render cleanly.
- Keep unchecked items above checked items.
- Sort store-aware items using configurable German grocery store keywords.
- Auto-sort with a configurable debounce delay.

## Usage

Use the command palette command **Unified Shopping List Sorter: Insert shopping list** to add a managed block to the current note:

```md
<!-- shopping-list:start {"title":"Shopping list"} -->
## Shopping list
- [ ] Item
<!-- shopping-list:end -->
```

Only content between those markers is managed. The plugin hides the marker lines in the editor while keeping them in the Markdown source. Normal Markdown task lists elsewhere in the note are ignored.

Use **Unified Shopping List Sorter: Sort shopping lists in current note** to sort manually. When auto-sort is enabled, the plugin also sorts after editor changes once the configured delay has elapsed.

## Sorting rules

- unchecked tasks first
- checked tasks second
- untagged items before store-grouped items
- store groups sorted A-Z
- items inside each group sorted A-Z with German-aware collation

Store keywords are matched case-insensitively around word and punctuation boundaries. The default keywords are `aldi`, `dm`, `edeka`, `lidl`, `netto`, `penny`, and `rewe`.

## German supermarket examples

With the default German store keywords, each checkbox-status group is sorted in this order:

1. Items without a recognised store keyword
2. `aldi`
3. `dm`
4. `edeka`
5. `lidl`
6. `netto`
7. `penny`
8. `rewe`

The comma-separated setting controls which store names are recognised, not a manual priority order. Store groups are ordered alphabetically. Inside a store group, the store keyword is ignored for item-name sorting. If an item mentions several stores, such as `Pizza Rewe/Aldi`, it is grouped under the alphabetically first matched store, in this case `aldi`.

For example, this managed block:

```md
<!-- shopping-list:start {"title":"Alltag einkaufen"} -->
## Alltag einkaufen
- [ ] Pesto Rewe
- [x] Waschmittel dm
- [ ] Hafermilch
- [ ] Gurken Edeka
- [ ] Nudeln Rewe
- [ ] Pizza Rewe/Aldi
- [ ] Shampoo dm
- [ ] Kaffee
- [ ] Milch Aldi
- [x] Butter Aldi
- [ ] Duschgel dm
- [ ] Brot Lidl
<!-- shopping-list:end -->
```

is sorted as:

```md
<!-- shopping-list:start {"title":"Alltag einkaufen"} -->
## Alltag einkaufen
- [ ] Hafermilch
- [ ] Kaffee
- [ ] Milch Aldi
- [ ] Pizza Rewe/Aldi
- [ ] Duschgel dm
- [ ] Shampoo dm
- [ ] Gurken Edeka
- [ ] Brot Lidl
- [ ] Nudeln Rewe
- [ ] Pesto Rewe
- [x] Butter Aldi
- [x] Waschmittel dm
<!-- shopping-list:end -->
```

Some common German supermarket keyword sets produce these group orders:

1. `aldi, edeka, rewe` sorts as untagged, `aldi`, `edeka`, `rewe`.
2. `aldi, lidl, netto, penny` sorts as untagged, `aldi`, `lidl`, `netto`, `penny`.
3. `dm, edeka, rewe` sorts as untagged, `dm`, `edeka`, `rewe`.

## Settings

- **Auto-sort**: enable or disable sorting after edits.
- **Auto-sort delay**: debounce delay in milliseconds.
- **Store keywords**: comma-separated store names for grouping.
- **Default list title**: heading used by the insert command.

## Development

```bash
pnpm install
pnpm test
pnpm build
```

The Obsidian runtime loads `manifest.json`, the bundled `main.js`, and `styles.css` from a vault plugin folder:

```text
<Vault>/.obsidian/plugins/shopping-list-sorter/
```
