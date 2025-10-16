![GitHub License](https://img.shields.io/github/license/abianche/skroll)
[![CI](https://github.com/abianche/skroll/actions/workflows/ci.yml/badge.svg)](https://github.com/abianche/skroll/actions/workflows/ci.yml)
[![CodeQL](https://github.com/abianche/skroll/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/abianche/skroll/actions/workflows/github-code-scanning/codeql)
[![Dependabot Updates](https://github.com/abianche/skroll/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/abianche/skroll/actions/workflows/dependabot/dependabot-updates)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=abianche_skroll&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=abianche_skroll)

# Skroll: Cross-Platform Narrative Editor

**A modern cross-platform tool for writing and playing branching stories, built with Electron.**

---

## ✨ Vision

This project aims to provide writers and developers with a simple yet powerful editor for **interactive fiction**, designed to run on macOS, Windows, and Linux as a native desktop app.

With this tool you can:

- Write branching stories in a clean editor.
- Visualize story flow and choices.
- Playtest stories instantly inside the app.
- Export to portable formats (JSON) and use them in your own games.

---

## 🗺 Roadmap (MVP)

### ⚠️ **UNDER INITIAL DEVELOPMENT**

We are actively building the foundation of this project, and it is not yet ready for production use.

---

## 🤖 AI Assistant Support

This project includes [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server configuration for Shadcn UI components. The MCP server allows AI assistants like Claude to:

- Query available Shadcn UI components
- Add components to the project
- Access component documentation

The configuration is defined in `.mcp.json` at the project root.

---

## 🛠️ Setup and Development

Follow these steps to get the desktop app running locally and contribute effectively.

### Prerequisites

- macOS, Windows, or Linux (commands below use macOS/zsh examples)
- Node.js 20+ (LTS recommended)
- pnpm 10.x (this repo pins pnpm via packageManager)
	- Optional via Corepack:
		- Enable once: `corepack enable`
		- Activate the pinned pnpm: `corepack prepare pnpm@10.18.3 --activate`
- Git

### Install dependencies

Run from the repository root:

```bash
pnpm install
```

This installs all workspace packages (apps/desktop, etc.).

### Run the Desktop app (development)

Starts Electron with hot reload via Electron Forge + Webpack:

```bash
pnpm dev:desktop
```

The first run may take a minute while Webpack builds the renderer and main bundles.

### Lint, typecheck, and build

- Lint all packages:

	```bash
	pnpm lint
	```

- Typecheck all packages:

	```bash
	pnpm typecheck
	```

- Build all packages:

	```bash
	pnpm build
	```

### Tests

This project includes unit tests (Jest) and end-to-end tests (Playwright).

- Unit tests (runs Tree-sitter WASM build automatically first):

	```bash
	pnpm test
	```

- End-to-end tests (Playwright):

	1) Install Playwright browsers once if you haven't:

	```bash
	pnpm --filter @skroll/desktop exec playwright install
	```

	2) Package the app and run E2E tests:

	```bash
	pnpm --filter @skroll/desktop pretest:e2e
	pnpm --filter @skroll/desktop test:e2e
	```

### Tree-sitter development (language grammar)

The Skroll DSL is powered by Tree-sitter and a generated WebAssembly module. Relevant files live in `apps/desktop/src/shared/tree-sitter-skroll`.

- Generate parser sources from the grammar:

	```bash
	pnpm ts:gen
	```

- Build the language WASM used by the app and tests:

	```bash
	pnpm ts:build-wasm
	```

- Helpful commands while iterating on the grammar:

	```bash
	# Parse files using the configured grammar
	pnpm ts:parse

	# Quick parse/highlight of the bundled sample script
	pnpm ts:parse:sample
	pnpm ts:highlight:sample

	# Launch Tree-sitter playground against the grammar
	pnpm ts:playground
	```

Notes:

- During development, Webpack copies `tree-sitter.wasm` and the generated `tree-sitter-skroll.wasm` into the app bundle. If you edit the grammar, rebuild the WASM with `pnpm ts:build-wasm` and restart the dev server if necessary.

### Packaging

Create a distributable build of the desktop app using Electron Forge:

```bash
pnpm package:desktop
```

Create platform-specific installers/archives:

```bash
pnpm make:desktop
```

Outputs are placed under the `apps/desktop/out` or `apps/desktop/dist` folders depending on the step.

### Useful workspace-scoped commands

- Filter commands to the desktop app package:

	```bash
	pnpm --filter @skroll/desktop <command>
	```

- Clean build artifacts for the desktop app:

	```bash
	pnpm --filter @skroll/desktop clean
	```

### Run CI locally (optional)

This repository’s GitHub Actions workflow can be exercised locally with `act`:

```bash
pnpm act
```

### Troubleshooting

- Electron doesn’t start or shows missing files after grammar changes:
	- Run `pnpm ts:build-wasm` to regenerate the DSL WASM, then restart `pnpm dev:desktop`.

- Playwright E2E tests fail with missing browsers:
	- Run `pnpm --filter @skroll/desktop exec playwright install` once.

- Type or lint errors:
	- Run `pnpm typecheck` and `pnpm lint` for details.

---

## 🤝 Contributing

Contributions are welcome!

- Open an issue for ideas, bugs, or feature requests.
- Fork and PR for code changes.
- See [CONTRIBUTING.md](CONTRIBUTING.md).
- CI workflow is compatible with `act` for local runs.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
