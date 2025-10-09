# Contributing

Thanks for your interest in improving this project!
This doc explains how to set up your environment, make changes, and submit pull requests.

## Code of Conduct
Be respectful and constructive. By participating, you agree to uphold our community standards.  
(see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md))

---

## Getting Started

### Prerequisites
- **Node.js** (see `.nvmrc`; use `nvm use` or install from <https://nodejs.org>).
- **pnpm** (enable with `corepack enable pnpm` or install globally).
- Optional: Electron prerequisites for your OS (Xcode CLT on macOS, Build Tools on Windows, standard desktop deps on Linux).

### Install & Run
```bash
pnpm install
pnpm dev:desktop
```
This boots the Electron app with hot reload for the renderer.

### Project Structure (high level)
```
apps/desktop/            # Electron Forge workspace (main, preload, renderer)
  src/main/              # Main process entrypoints
  src/preload/           # Preload scripts (typed IPC surface)
  src/renderer/          # React + Mantine UI
  src/shared/engine-skroll/       # Experimental DSL runtime helpers
  src/shared/ipc-contracts/       # Shared IPC contracts between main and renderer
  src/shared/parser-skroll/       # DSL parser built on Tree-sitter
  src/shared/storage/             # Persistence helpers and abstractions
  src/shared/tree-sitter-skroll/  # Tree-sitter grammar + WASM build output
```

---

## How to Contribute

### 1) Fork & Branch
- Fork the repo and create a branch from `main`:
  ```bash
  git checkout -b feat/short-descriptor
  ```
- Keep branches small and focused on one change.

### 2) Run Checks Locally
```bash
pnpm lint           # Workspace lint (ESLint + Prettier rules)
pnpm typecheck      # TypeScript project references
pnpm test           # Package-level unit tests (Jest)
pnpm build          # Ensure the bundles compiles
```
Run targeted scripts (e.g., `pnpm --filter @skroll/desktop lint`) when working inside a single workspace.

### 3) Commit Style
- Keep commits small and descriptive.
- Recommended prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Example:
  ```
  feat(engine): add support for conditional choice guards
  ```

### 4) Pull Request Guidelines
- Target branch: `main`.
- Fill out the PR template:
  - What/why of the change
  - Screenshots/GIFs (for renderer/UI work)
  - Test plan (commands run + expected results)
  - Any migrations or breaking changes
- Ensure CI passes (lint/typecheck/tests/build).
- CI workflow is compatible with `act` for local runs.

### 5) Reviews & Merging
- At least **1 approval** required.
- Squash merge is preferred for a tidy history.
- Maintainers may request changes for clarity, coverage, or docs.

---

## Coding Standards

### TypeScript & React (renderer + packages)
- Strict TypeScript; avoid `any` unless there's a documented reason.
- Prefer functional components and hooks.
- Manage state locally where possible (Zustand or React context when shared).
- Keep components small, accessible, and testable.
- Follow shared ESLint + Prettier configuration (`pnpm lint --fix`).

### Electron Main/Preload
- Keep the main process minimal—delegate work to packages when possible.
- Maintain `contextIsolation` and use typed channels from `@skroll/ipc-contracts`.
- Avoid synchronous filesystem or blocking calls on the main thread.
- Document new IPC channels and preload exports.

---

## Tests

### Unit & Integration
- `pnpm test` runs Jest suites across packages.
- Add tests alongside new logic (especially storage flows and DSL runtime helpers).

### Desktop App
- Ensure `pnpm --filter @skroll/desktop build` succeeds before opening a PR.
- If you add Playwright or other end-to-end tests, document setup commands in your PR.

---

## Documentation
- Update `README.md` or `docs/` when user-facing behaviour changes.
- Add usage notes/examples for new features.
- Keep architectural decisions in sync if you introduce new patterns.

---

## Release (early guidance)
- Tag releases as `v0.x.y` until we hit 1.0.
- Desktop artifacts are produced via Electron Forge (`pnpm --filter @skroll/desktop make`).

---

## Questions?
Open a discussion or file an issue with the `question` label.  
Thanks for contributing!
