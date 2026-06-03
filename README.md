# Shopping List Sorter

Shopping List Sorter is an Obsidian plugin for managed shopping-list blocks. It inserts Markdown task-list blocks into notes and keeps only those blocks sorted by checkbox status, configured store keywords, and item name.

## Current scope

- Insert a managed shopping list from the command palette.
- Sort managed shopping-list blocks without touching normal checkboxes elsewhere in the note.
- Keep unchecked items above checked items.
- Sort store-aware items using configurable German grocery store keywords.
- Auto-sort with a configurable debounce delay.

## Development

```bash
pnpm install
pnpm test
pnpm build
```

The Obsidian runtime loads `manifest.json` and the bundled `main.js` from a vault plugin folder:

```text
<Vault>/.obsidian/plugins/obsidian-shopping-list-sorter/
```
Obsidian plugin for auto-sorting managed shopping lists
