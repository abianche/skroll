![GitHub License](https://img.shields.io/github/license/abianche/skroll) 
[![Tauri](https://img.shields.io/badge/Tauri-24C8D8?logo=tauri&logoColor=fff)](#)
[![CI](https://github.com/abianche/skroll/actions/workflows/ci.yaml/badge.svg)](https://github.com/abianche/skroll/actions/workflows/ci.yaml)

# Skroll: Cross-Platform Narrative Editor

**A modern cross-platform tool for writing and playing branching stories, built with Tauri, React, and Rust.**

---

## 🦀 Rust Workspace Quickstart

Scaffold for a branching-story toolchain.

- `story-core`: runtime/IR types
- `skroll-schema`: versioned JSON document types
- `skroll-lang`: compiler front-end (parser/validator/emitter) + `skrollc` CLI

```bash
cargo build
cargo run -p skroll-lang -- compile examples/hello.skr -o examples/hello.story.json
```

### Roadmap

* Parser with spans (chumsky)
* AST → IR (story-core)
* JSON emission (skroll-schema)
* Tree-sitter grammar for editor

---

## ✨ Vision
This project aims to provide writers and developers with a simple yet powerful editor for **interactive fiction**.
Think *Inklewriter* or *Twine*, but designed to run **everywhere**: desktop, mobile, and web.

With this tool you can:
- Write branching stories in a clean editor.
- Visualize story flow and choices.
- Playtest stories instantly inside the app.
- Export to portable formats (JSON) and use them in your own games.

---

## 🛠 Tech Stack
- **[Tauri v2](https://tauri.app/)** — cross-platform shell (desktop + mobile).  
- **React + TypeScript** — frontend editor and preview UI.  
- **Rust** — story parsing, validation, and runtime engine.  

---

## 📦 Project Structure
```
.
├── crates/
│   └── story-core/      # Rust core library (parser, validator, runtime)
├── src-tauri/           # Tauri backend, bridges Rust <-> JS
├── frontend/            # React + TS app (editor & preview UI)
├── assets/              # Sample stories, icons, schemas
└── docs/                # Documentation and design notes
```

---

## 🚀 Getting Started
### Prerequisites
- Follow Tauri [prerequisites](https://tauri.app/start/prerequisites)

### Tooling & Versions
- Node.js: uses `.nvmrc` (Node 22 LTS). If you have `nvm`, run `nvm use` to match.
- pnpm: use Corepack to manage pnpm version: `corepack enable && corepack prepare pnpm@latest --activate`.
- Rust: repo pins `stable` via `rust-toolchain.toml`.

Quick installs (pick what applies):
- macOS/Linux Node (nvm):
  - `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
  - `nvm install` (reads `.nvmrc` and installs Node 22)
- pnpm via Corepack (bundled with Node 16.10+):
  - `corepack enable && corepack prepare pnpm@latest --activate`
- Rust via rustup:
  - `curl https://sh.rustup.rs -sSf | sh`
  - `rustup default stable` (optional; the repo already pins stable)

Editors:
- The repo includes `.editorconfig` for consistent formatting.
- VS Code: suggested extensions in `.vscode/extensions.json` (Rust Analyzer, Tauri).

### Clone & Run
```bash
git clone https://github.com/abianche/skroll.git
cd skroll
nvm use             # match Node version from .nvmrc
corepack enable     # manage pnpm via Corepack
corepack prepare pnpm@latest --activate
pnpm install
pnpm tauri dev
```

This should open a Tauri window with the scaffolded React app.

---

## 🗺 Roadmap (MVP)
### ⚠️ **UNDER INITIAL DEVELOPMENT**

We are actively building the foundation of this project, and it is not yet ready for production use.

- [ ] JSON story schema & sample stories  
- [ ] Parser & runtime in Rust  
- [ ] Minimal editor + live preview  
- [ ] Graph view of branching nodes  
- [ ] Export & import stories  
- [ ] Desktop builds (Win/macOS/Linux)  
- [ ] Mobile builds (iOS/Android)  

---

## 🤝 Contributing
Contributions are welcome!  
- Open an issue for ideas, bugs, or feature requests.  
- Fork and PR for code changes.  
- See [CONTRIBUTING.md](CONTRIBUTING.md).  

### 🦀 Rust Formatting & Linting
- Format check: `cargo fmt -- --check`
- Lint (deny warnings): `cargo clippy -- -D warnings`

Both commands should pass locally before opening a PR. See `CONTRIBUTING.md` for the full checklist.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).  
