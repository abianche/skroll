# Contributing

Thanks for your interest in improving this project!  
This doc explains how to set up your environment, make changes, and submit pull requests.

## Code of Conduct
Be respectful and constructive. By participating, you agree to uphold our community standards.  
(see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md))

---

## Getting Started

### Prerequisites
- **Rust** (stable): <https://www.rust-lang.org/tools/install>  
- **Node.js** (LTS) + **pnpm** (`npm i -g pnpm`)  
- **Tauri v2 toolchains**:
  - macOS/iOS: Xcode
  - Windows: VS Build Tools
  - Linux: GCC/Clang + libgtk

### Install & Run
```bash
pnpm install
pnpm tauri dev
```
This launches the Tauri window with the React app.

### Project Structure (high level)
```
crates/story-core/    # Rust core (parser, validator, runtime)
src-tauri/            # Tauri backend (Rust) + command bridges
frontend/             # React + TypeScript editor & preview UI
assets/               # Samples, schema, icons
docs/                 # Docs and design notes
```

---

## How to Contribute

### 1) Fork & Branch
- Fork the repo and create a branch from `main`:
  ```
  git checkout -b feat/short-descriptor
  ```
- Use a **small, focused branch** per change.

### 2) Run Checks Locally
```bash
# Frontend
pnpm lint
pnpm format:check
pnpm build

# Rust
cargo fmt -- --check
cargo clippy -- -D warnings
cargo test
```

### 3) Commit Style
- Keep commits small and descriptive.
- Recommended prefixes: `feat:`, `fix:` `refactor:`, `docs:`, `test:`, `chore:`.
- Example:
  ```
  feat(runtime): add conditional operator support (>=, <=)
  ```

### 4) Pull Request Guidelines
- Target branch: `main`.
- Fill the PR template:
  - What/why of the change
  - Screenshots/GIFs (UI changes)
  - Test plan (steps and expected results)
  - Any breaking changes or migrations
- Ensure CI is green (lint/format/tests).

### 5) Reviews & Merging
- At least **1 approval** required.
- Squash merge is preferred (clean history).
- Maintainers may request changes for clarity, tests, or docs.

---

## Coding Standards

### TypeScript / React (frontend)
- **TypeScript strict**; no `any` unless justified.
- Prefer functional components + hooks.
- State: minimal and localized (e.g., Zustand/Context).
- Avoid large components; keep files focused.
- Keep UI accessible (labels, roles, keyboard nav).
- Use Prettier + ESLint defaults.

### Rust (core + tauri)
- `cargo fmt` + `clippy -D warnings` clean.
- Prefer `Result<>` with error types over panics (except tests).
- Add **unit tests** for core logic (parser, validator, runtime).
- Keep command surfaces **explicit** and typed (serde models).

---

## Tests

### Frontend
- Add component tests where useful (e.g., choice rendering).
- Snapshot tests ok for simple UI; prefer behavioral tests.

### Rust
- Unit tests for parsing, validation, state transitions.
- Include failure cases (unknown node, invalid condition, etc.).

---

## Documentation
- Update `README.md` / `docs/` when user-facing behavior changes.
- For new features, add short usage notes and examples.
- For schema changes, update `docs/schema.md` and sample story.

---

## Issue Labels (suggested)
- `type:bug`, `type:feature`, `type:docs`, `type:refactor`
- `area:frontend`, `area:core`, `area:tauri`, `area:infra`
- `good first issue`, `help wanted`

---

## Release (early guidance)
- Use tags like `v0.x.y` for pre-release versions.
- Binary builds per-platform via CI (future task).

---

## Questions?
Open a discussion or an issue with the `question` label.  
Thanks for contributing!