# AGENTS.md

## Dev environment tips
- Use `pnpm install` to install dependencies.
- The project is structured as a pnpm workspace:
  - `apps/desktop` → Electron + React renderer app
  - `packages/*` → Shared libraries (e.g. story engine, utilities)
- Electron Forge is used for running and packaging the desktop app.

## Testing instructions
- To lint, run `pnpm lint` from the package root.
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
