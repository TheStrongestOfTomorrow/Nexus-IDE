<div align="center">

# 🚀 Nexus IDE

<img src="https://lucide.dev/api/icons/zap?size=128&color=f59e4b" alt="Nexus IDE" width="128" height="128" />

### *The AI-First, Browser-Based IDE with WebContainer Power*

[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-Beta-f59e4b?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/packages)
[![Version](https://img.shields.io/badge/Version-5.2.0-3b82f6?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![WebContainer](https://img.shields.io/badge/WebContainer-Enabled-10b981?style=for-the-badge&labelColor=1e293b)](https://webcontainers.io)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge&labelColor=1e293b)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-6366f1?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)

*A modern, high-performance IDE with AI integration, VS Code-like experience, workspace persistence, and the power to run Node.js entirely in your browser.*

</div>

---

## 🖥️ Coming Soon — Real Linux in Your Browser

We're working on something huge. **v86 emulation** will let you run a **real Alpine Linux distro** entirely inside Nexus IDE — no server, no VM, just your browser.

| Capability | Details |
|-----------|--------|
| **Full Linux Terminal** | Real `bash`, `apt`, `git`, `python`, `node` — not simulated |
| **v86 x86 Emulator** | WebAssembly-based x86 emulator runs actual Linux binaries |
| **IndexedDB Persistence** | Your Linux filesystem survives page refreshes and browser restarts |
| **Portable** | Works on any device with a browser — even on a 2GB laptop on a plane |
| **noVNC (Optional)** | Users can install noVNC inside the Linux env to get a full GUI desktop in another tab |
| **Wine (Optional)** | Users can install Wine inside the Linux env to run Windows .exe binaries |
| **Offline Ready** | Works completely offline — pair with Airplane Mode for true isolation |
| **musl + glibc** | Alpine's musl by default, install glibc compat for any package |

> 🚧 *This is an active development goal for the next beta release. Stay tuned.*

---

## ⚡ Install & Run

### Method 1 — GitHub Packages (Recommended)

```bash
# Run instantly — no install needed
npx github:TheStrongestOfTomorrow/Nexus-IDE

# Or install globally
npm install -g @TheStrongestOfTomorrow/nexus-ide
nexus-ide
```

> **Note:** You need GitHub Packages access. If prompted, add this to your `~/.npmrc`:
> ```
> @TheStrongestOfTomorrow:registry=https://npm.pkg.github.com
> //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
> ```

### Method 2 — Clone & Run Locally

```bash
# Clone the repo
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE

# Install dependencies
npm install

# Start the dev server
npm start
```

Then open **http://localhost:3000** in your browser. That's it — Nexus IDE is running locally on your machine.

> **Branch-specific clones** — each edition has its own dev command:
> ```bash
> # Beta (This Branch — v5.1)
> git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git && cd Nexus-IDE && npm install && npm run dev
>
> # Stable (v4.4)
> git clone -b stable https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git && cd Nexus-IDE && npm install && npm run dev
>
> # Professional
> git clone -b professional https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git && cd Nexus-IDE && npm install && npm run web
>
> # CLI / Terminal Edition
> git clone -b cli https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git && cd Nexus-IDE && npm install && npm run tui
> ```

---

## 🔥 What's New in v5.2.0

The biggest GitHub integration update ever. Nexus IDE now has a full source control panel rivaling desktop IDEs, complete with staging, branching, commit history, pull requests, and issues — all from the browser.

### 🔀 Deep Git Integration (NEW!)

Complete rewrite of the GitHub panel into a professional source control view with 5 tabs.

| Feature | Description |
|---------|-------------|
| **File Staging** | Stage/unstage individual files before committing |
| **Commit Messages** | Write commit messages with a dedicated textarea |
| **Staged/Unstaged Groups** | Visual separation of staged vs unstaged files |
| **File Status Icons** | See which files are added, modified, or untracked |
| **Branch Management** | List, create, switch, and delete branches |
| **Commit History** | Browse full commit log with expandable details |
| **Commit Diffs** | View file changes per commit |
| **Pull/Fetch** | Pull latest changes from remote |
| **Clone Repository** | Import repos directly into workspace |
| **Pull Requests** | List, create, merge PRs with Open/Closed/All filters |
| **Issues** | List, create, and browse issues |
| **Repo Selector** | Switch between connected repositories |

### 🔄 Auto-Update Check (NEW!)

Nexus IDE now automatically checks GitHub for new releases.

| Feature | Description |
|---------|-------------|
| **Auto-Check** | Checks every 5 minutes for new releases |
| **Version Compare** | Semver comparison against latest GitHub release |
| **Manual Check** | Check for updates anytime from Settings |
| **Release Info** | Shows changelog, publish date, and download link |

### 🛠️ VS Code UI Fixes

| Bug | Fix |
|-----|-----|
| **Activity bar broken** | Clicking Explorer/Search/Git now actually changes the sidebar |
| **Editor collapsed** | Editor now fills the full available height |
| **No preview panel** | Preview panel added to VS Code mode |
| **Sidebar resize broken** | Drag to resize sidebar (160px–500px) |

---

## 🔥 What's New in v5.1.5

A focused update bringing two developer-experience essentials: **Airplane Mode** for offline work and **Session Persistence** so you never lose your place.

### ✈️ Airplane Mode (NEW!)

Going offline? Nexus IDE now intelligently detects when you lose connectivity and adapts automatically. Internet-reliant features are gracefully locked, while everything else continues working normally.

| Feature | Description |
|---------|-------------|
| **Auto-Detection** | Detects offline via `navigator.onLine` + active ping checks every 30s |
| **Manual Toggle** | Click the ✈️ icon in the title bar to enable/disable airplane mode |
| **Partial Lock** | Only internet features are locked — editor, terminal, and files still work |
| **Full Lock Mode** | Optional: lock all internet features until you manually re-enable |
| **Status Banner** | Dismissable banner shows affected features and what still works |
| **Status Bar Indicator** | Online/offline indicator with airplane icon in the status bar |
| **Voice Control** | Say "airplane" to toggle via voice commands |
| **Settings Control** | Full airplane mode and full lock controls in Settings panel |

**Locked when offline:** Real-time Collaboration, Minecraft Bridge, Cloud AI Providers, GitHub Push, Auto-Update Check

**Still works offline:** Code Editor, File Manager, Terminal (WebContainer), Settings, Workspace (IndexedDB), Extensions (installed), AI (Local/Ollama)

### 💾 Session Persistence (NEW!)

Your entire IDE session is now saved to IndexedDB every 30 seconds. Refresh your browser, close and reopen the tab — Nexus IDE picks up exactly where you left off.

| Feature | Description |
|---------|-------------|
| **Full State Save** | Open tabs, active file, panel visibility, UI mode — all saved |
| **30s Auto-Save** | Session snapshots saved automatically every 30 seconds |
| **Boot Restore** | Automatically restores your last session on page load |
| **Terminal History** | Command history persisted across sessions in IndexedDB |
| **Settings Remembered** | AI provider, model selections, and all settings preserved |
| **Manual Controls** | Save, restore, and clear session from Settings panel |
| **Timestamp Display** | See exactly when your last session was saved |

---

## 🔥 What's New in v5.1.0

The biggest feature update since v5.0! This release brings a complete workspace save system, a brand-new beginner-friendly UI, improved cross-platform integration, and dozens of refinements.

### 💾 Workspace Save System (NEW!)
Your work is now persistent. Save, load, and manage multiple workspaces right from the IDE.

| Feature | Description |
|---------|-------------|
| **Save to IndexedDB** | Save your entire workspace with one click — files, settings, everything |
| **Auto-Save** | Workspace auto-saves every 60 seconds so you never lose progress |
| **Load Workspaces** | Browse and load any previously saved workspace from the sidebar |
| **Rename & Delete** | Right-click to rename or delete saved workspaces |
| **Export as .nexus** | Export workspaces as `.nexus` files to share or back up |
| **Import .nexus Files** | Import `.nexus` workspace files from other devices or users |
| **Storage Stats** | See exactly how much IndexedDB storage you're using |
| **Multi-Workspace** | Switch between different projects without losing work |

### 🎨 Beginner-Friendly UI (NEW!)
A completely redesigned interface that makes Nexus IDE accessible to everyone — not just power users.

| Feature | Description |
|---------|-------------|
| **Tabbed Navigation** | Clean navigation tabs: Files, Code, AI, Run, Tools, Workspace |
| **Contextual Hints** | Every tab shows a helpful description of what it does |
| **Labeled Actions** | All buttons and controls have clear, descriptive labels |
| **Welcome Screen** | Friendly onboarding when you open the IDE with no files |
| **Quick Actions** | One-click buttons for common tasks like creating HTML files |
| **All Features Included** | Every feature from the legacy UI is accessible, just organized better |
| **Switch Anytime** | Toggle between Beginner and Legacy UI from Settings |

### 🖥️ Better Platform Integration
Improved support across all platforms — Web, Tauri Desktop, and Capacitor Mobile.

| Platform | Improvements |
|----------|-------------|
| **Tauri Desktop** | Updated to v5.1.0, improved CSP, better window config, updated descriptions |
| **Capacitor Mobile** | Splash screen, status bar theming, keyboard handling, dark mode support |
| **PWA** | New shortcuts (New File, AI Chat, Workspaces), expanded file handlers, app categories |
| **Service Worker** | Updated caching strategy, API response caching for AI providers, clean cache naming |

### 🔧 UI Refinements
| Feature | Description |
|---------|-------------|
| **Save Workspace Button** | Quick-save button right in the Explorer sidebar header |
| **Workspaces Tab** | Dedicated workspace browser accessible from the Activity Bar |
| **Settings Overhaul** | Redesigned settings with clear UI mode selection cards |
| **Auto-Save Indicator** | Visual feedback when your workspace is auto-saved |
| **Mobile UI Polish** | Improved touch targets, smoother transitions, better layout |
| **Version Unified** | All platforms now report v5.1.0 consistently |

---

## 🎯 How to Use Workspace Saves

### Quick Save
1. Click the **Save** icon (💾) in the Explorer header
2. Enter a name for your workspace
3. Your workspace is saved to IndexedDB instantly

### Auto-Save
- Your workspace auto-saves every 60 seconds
- No action needed — it just works in the background

### Load a Workspace
1. Click the **Hard Drive** icon in the Activity Bar
2. Browse your saved workspaces
3. Click any workspace to load it

### Export / Import
- **Export**: Click the download icon on any saved workspace to get a `.nexus` file
- **Import**: Click the upload icon in the workspace panel to import a `.nexus` file

---

## 🎯 How to Switch UI Modes

1. Open **Settings** (gear icon or `Ctrl+,`)
2. Find the **Interface Mode** section at the top
3. Click **Beginner Friendly UI** or **Legacy UI** to switch
4. Your preference is saved automatically

The Beginner UI is perfect if you're new to Nexus IDE. The Legacy UI gives you the full VS Code-style experience with maximum editor space.

---

## 🌿 All Versions

| Version | Branch | Install Command | Description |
|---------|--------|-----------------|-------------|
| **Stable** | `stable` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@stable` | ✅ Production ready (v4.4) |
| **Beta (This)** | `main` | `npx github:TheStrongestOfTomorrow/Nexus-IDE` | 🧪 Latest with all features (v5.2.0) |
| **Professional** | `professional` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@professional` | 💼 CLI + Web dual mode |
| **CLI/TUI** | `cli` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@cli` | 🖥️ Terminal only |

---

## 🤖 AI Providers

| Provider | Models | Type |
|----------|--------|------|
| OpenAI | GPT-4o, O1, O3 Mini | Cloud |
| Anthropic | Claude Opus 4, Sonnet 4 | Cloud |
| Google | Gemini 2.5 Pro, Flash | Cloud |
| xAI | Grok 3, Grok Fast | Cloud |
| Mistral | Codestral, Large | Cloud |
| DeepSeek | Coder, R1 | Cloud |
| Groq | Llama 3.3 70B | Free Tier |
| Cohere | Command R+ | Cloud |
| Perplexity | Sonar Pro | Cloud |
| Alibaba | Qwen Max, Coder | Cloud |
| Together | Llama 3.3, Qwen 2.5 | Cloud |
| Ollama | Llama, Mistral, DeepSeek | Local |

---

## ✨ Full Feature List

| Feature | Description |
|---------|-------------|
| 💾 **Workspace Saves** | Save/load projects to IndexedDB |
| 🎨 **Beginner UI** | Simplified interface for newcomers |
| 🌐 **WebContainer** | Run Node.js in browser |
| 🤖 **12+ AI Providers** | OpenAI, Claude, Gemini, Grok, and more |
| 🎙️ **Voice Control** | Control IDE with speech |
| 🧘 **Zen Mode** | Distraction-free coding |
| 🎨 **Theme Studio** | Create custom themes |
| 📊 **Dependency Graph** | Visualize project deps |
| ☁️ **Cloud Bridge** | Real-time collaboration |
| 📱 **Mobile UI** | Proper touch-optimized mobile experience |
| 🎮 **Minecraft Bridge** | Connect to Minecraft |
| 📦 **Extensions** | OpenVSX marketplace |
| 🔍 **Search** | Full project search |
| 🐛 **Debug** | Run and debug tools |
| 📝 **Snippets** | Code snippet manager |
| ✅ **Todo Scanner** | Find TODOs in code |
| 📈 **Project Insights** | Code statistics |
| 🔀 **Diff Editor** | Compare file changes |
| ⌨️ **Command Palette** | Ctrl+Shift+P power |

---

## 🚀 Deployment

### GitHub Packages
```bash
npm install -g @TheStrongestOfTomorrow/nexus-ide
nexus-ide
```

### Clone & Host Locally
```bash
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
npm install
npm start        # Dev server on localhost:3000
npm run build    # Production build → dist/
npm run serve    # Serve production build
```

### Android
Download the APK from [Releases](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases) and install on your device. No Google Play needed.

### Docker
```bash
docker-compose up -d
```

### Tauri Desktop
```bash
npm run tauri:build
```

### Vercel/Railway/Render
Connect GitHub → Auto-deploy

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| 📦 **Download Release** | [v5.1.0 Release](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases/tag/v5.1.0) |
| 🔀 **v5.2.0** | [Deep Git Integration Release](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases/tag/v5.2.0) |
| ✈️ **v5.1.5** | Airplane Mode + Session Persistence |
| GitHub Packages | https://github.com/TheStrongestOfTomorrow/Nexus-IDE/packages |
| GitHub | https://github.com/TheStrongestOfTomorrow/Nexus-IDE |
| Issues | https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues |
| WebContainer Docs | https://webcontainers.io |
| Stable Branch | [stable](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/tree/stable) |
| Professional | [professional](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/tree/professional) |
| CLI | [cli](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/tree/cli) |

---

## 📝 Changelog

### v5.2.0 (Current - Beta)
- 🔀 **Deep Git Integration** — Full source control panel: staging, commits, branches, history, PRs, issues
- 📋 **File Staging** — Stage/unstage individual files before committing
- 🌿 **Branch Management** — List, create, switch, delete branches
- 📜 **Commit History** — Browse commit log with expandable diffs
- 🔃 **Pull/Fetch** — Pull latest changes from remote
- 📥 **Clone Repository** — Import repos directly into workspace
- 🔀 **Pull Requests** — List, create, merge PRs
- 🐛 **Issues** — List, create, and browse issues
- 🔄 **Auto-Update Check** — Checks GitHub for new releases every 5 minutes
- 🛠️ **VS Code UI Fixes** — Activity bar, editor height, preview panel, sidebar resize
- 📦 **GitHub Service Rewrite** — 16 new API methods, full TypeScript interfaces

### v5.1.5
- ✈️ **Airplane Mode** — Auto-detect offline, partial lock on internet features only
- 📡 **Active Ping Check** — 30-second connectivity verification (not just navigator.onLine)
- ✈️ **Manual Toggle** — Click airplane icon in title bar or use voice commands
- 🔒 **Full Lock Mode** — Optional stricter lockdown of all internet features
- 📢 **Status Banner** — Dismissable banner with affected/available features list
- 💾 **Session Persistence** — Full IDE state saved to IndexedDB every 30 seconds
- 🔄 **Boot Restore** — Automatically restore last session on page load
- 📜 **Terminal History** — Command history saved across sessions
- ⚙️ **Settings Integration** — Airplane Mode + Session Persistence controls in Settings
- 🎨 **3 UI Modes** — Airplane mode banner works in all UI modes (Legacy, Beginner, VS Code)
- 📝 **README Update** — v86 Linux emulation teaser section added

### v5.1.0
- 💾 **Workspace Save System** — Save/load workspaces to IndexedDB with auto-save
- 🎨 **Beginner-Friendly UI** — New simplified interface with tabbed navigation
- 📱 **Mobile UI Improvements** — Better touch targets and responsive layout
- 🖥️ **Tauri v5.1.0** — Updated desktop integration
- 📲 **Capacitor Improvements** — Splash screen, status bar, keyboard handling
- 🌐 **PWA Enhancements** — New shortcuts, file handlers, service worker updates
- 🔧 **Settings Overhaul** — Clear UI mode selection, workspace info
- ⚡ **UI Refinements** — Save button in explorer, workspace tab, version unified
- 📦 **GitHub Packages** — Moved from npm to GitHub Packages
- 🌿 **Branch cleanup** — Stable branch updated with final v4.x.x release

### v5.0.0
- ✨ **WebContainer Integration** — Run Node.js in browser!
- 📦 npm install support in browser
- 🖥️ Dev server support (Vite, Next.js, React)
- 🔧 Cross-Origin Isolation headers (COOP/COEP)
- 🎨 New WebContainer terminal UI
- 🔗 Direct preview URLs for running apps

### v4.4.0
- 12+ AI providers
- Extensions marketplace
- Voice control
- Theme studio

### v4.1.0
- Stable release
- Core IDE features
- AI assistant
- File management

---

<div align="center">

### Made with ❤️ by Taz

*The Future of Browser-Based Development*

**v5.2.0 — Deep Git Integration**

</div>
