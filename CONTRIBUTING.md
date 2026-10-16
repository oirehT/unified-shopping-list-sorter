# Contributing

Thanks for helping improve Unified Shopping List Sorter. Bug reports, ideas, and pull requests are welcome.

## Reporting issues

Open an issue on GitHub with your Obsidian version, your platform, the shopping-list block you used, and what you expected the sort to do. A small Markdown snippet that reproduces the problem helps most.

## Making changes

1. Fork the repository and create a branch from `main`.
2. Install dependencies and run the checks with `pnpm`, as listed under **Development** in the [README](README.md).
3. Add or update tests in `test/` when you change sorting behaviour, and run `pnpm test`.
4. Run `pnpm build` before opening a pull request so type errors and bundle problems show up early.
5. Update the README when behaviour, settings, or usage change.

Keep the plugin ID `shopping-list-sorter` unchanged so existing installs keep working.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) such as `fix: keep cursor on the edited item after sorting`. Release notes are generated from these prefixes (`feat`, `fix`, `docs`, and so on), so a clear prefix and summary put your change in the right section.

## Releases

Releases are published by the maintainer through the GitHub Actions release workflow, which builds, attests, and uploads `main.js`, `manifest.json`, and `styles.css`.
