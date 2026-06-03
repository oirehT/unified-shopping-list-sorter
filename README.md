# Shopping List Sorter

Shopping List Sorter is an Obsidian plugin for managed shopping-list blocks. It inserts Markdown task-list blocks into notes and keeps only those blocks sorted by checkbox status, configured store keywords, and item name.

## Current scope

- Insert a managed shopping list from the command palette.
- Sort managed shopping-list blocks without touching normal checkboxes elsewhere in the note.
- Hide managed block markers in the editor so lists render cleanly.
- Keep unchecked items above checked items.
- Sort store-aware items using configurable German grocery store keywords.
- Auto-sort with a configurable debounce delay.

## Usage

Use the command palette command **Shopping List Sorter: Insert shopping list** to add a managed block to the current note:

```md
<!-- shopping-list:start {"title":"Shopping list"} -->
## Shopping list
- [ ] Item
<!-- shopping-list:end -->
```

Only content between those markers is managed. The plugin hides the marker lines in the editor while keeping them in the Markdown source. Normal Markdown task lists elsewhere in the note are ignored.

Use **Shopping List Sorter: Sort shopping lists in current note** to sort manually. When auto-sort is enabled, the plugin also sorts after editor changes once the configured delay has elapsed.

## Sorting rules

- unchecked tasks first
- checked tasks second
- untagged items before store-grouped items
- store groups sorted A-Z
- items inside each group sorted A-Z with German-aware collation

Store keywords are matched case-insensitively around word and punctuation boundaries. The default keywords are `aldi`, `dm`, `edeka`, `lidl`, `netto`, `penny`, and `rewe`.

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
