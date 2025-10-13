# AGENTS.md

## Dev environment tips
- Use `pnpm install` to install dependencies.
- For development, run `pnpm dev:desktop` to start the Electron app with hot reload.
- The project is structured as a pnpm workspace:
  - `apps/desktop` → Electron + React renderer app
    - `src/main/` → Electron main process:
      - `window/createWindow.ts` → BrowserWindow creation and config
      - `ipc/registerIpcHandlers.ts` → All IPC channel handlers
      - `utils/fileValidation.ts` → DSL file path guards
    - `src/preload/` → Preload scripts:
      - `preload.ts` → Context bridge only
      - `api.ts` → IPC-backed `SkrollApi` wiring
    - `src/renderer/` → React UI
    - `src/shared/` → Shared modules (type-only and pure logic):
      - `engine-skroll/` (runtime session) — split into `index.ts`, `session.ts`, `types.ts`
      - `ipc-contracts/` (typed channels) — per-contract files + `types.ts` + `Channels`
      - `parser-skroll/` (Tree-sitter-based parser) — `parse.ts`, `types.ts`
      - `storage/` (persistence utils) — `app-data.ts`, `json.ts`, `recent.ts`
      - `tree-sitter-skroll/` (grammar + WASM loader) — `env.ts`, `loader.ts`, `index.ts`
- Electron Forge is used for running and packaging the desktop app.

## Testing instructions
- To lint, run `pnpm lint` from the package root.
- To typecheck, run `pnpm typecheck` from the package root.
- To test, run `pnpm test` from the package root.
- To build, run `pnpm build` from the package root.
- Fix any ESLint or type errors before commit.

## PR instructions
- Branch naming:
  - feat/<scope> for new features
  - fix/<scope> for bug fixes
  - chore/<scope> for infra/maintenance
- Commit messages should be clear and follow conventional commit style.
- Ensure CI passes before requesting review:
  - lint
  - test
  - build
