---
summary: Documentation entry point for Unified Shopping List Sorter.
read_when:
  - You need a quick map of the plugin scope and release files.
  - You are changing setup, release metadata, or contributor guidance.
---

# Docs

Unified Shopping List Sorter is an Obsidian plugin that sorts only managed shopping-list blocks.

Start with the root `README.md` for usage, sorting rules, settings, and development commands.

Release assets are `main.js`, `manifest.json`, and `styles.css`. Publish releases through the GitHub Actions release workflow so those assets receive provenance attestations and release notes generated from Conventional Commit prefixes.

Keep the plugin ID `shopping-list-sorter` stable unless a migration plan exists.
