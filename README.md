![GitHub License](https://img.shields.io/github/license/abianche/skroll) 
[![Tauri](https://img.shields.io/badge/Tauri-24C8D8?logo=tauri&logoColor=fff)](#)

# Skroll: Cross-Platform Narrative Editor

**A modern cross-platform tool for writing and playing branching stories, built with Tauri, React, and Rust.**

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
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)  
- [Node.js](https://nodejs.org/) (LTS recommended)  
- [pnpm](https://pnpm.io/) or npm/yarn  
- Platform toolchains:  
  - **macOS/iOS** → Xcode  
  - **Windows** → Visual Studio Build Tools  
  - **Linux** → GCC/Clang + libgtk  

### Clone & Run
```bash
git clone https://github.com/yourname/narrative-editor.git
cd narrative-editor
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

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).  
