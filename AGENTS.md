# AGENTS.md

## Repo

- Unified Shopping List Sorter is an Obsidian plugin for managed shopping-list blocks.
- The plugin ID is `shopping-list-sorter`; keep it stable for existing installs.
- Use `pnpm` for dependencies, tests, and builds.

## Workflow

- Run `git pull --ff-only` before editing on the current branch.
- Open relevant docs before changing behaviour.
- Keep changes small and follow existing TypeScript, Markdown, and JSON formatting.
- Do not commit, push, rename, or delete files unless the user asks.

## Verify

- Use `pnpm test` for sorting logic changes.
- Use `pnpm build` before release or manifest/bundle changes.
