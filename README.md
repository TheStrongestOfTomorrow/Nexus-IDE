<div align="center">

# 🚀 Nexus IDE

<img src="https://lucide.dev/api/icons/zap?size=128&color=f59e4b" alt="Nexus IDE" width="128" height="128" />

### *The AI-First, Browser-Based IDE with WebContainer Power*

[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-Beta-f59e4b?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/packages)
[![Version](https://img.shields.io/badge/Version-5.5.5-3b82f6?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![Linux](https://img.shields.io/badge/Linux-Alpine_Linux_in_Browser-emerald?style=for-the-badge&labelColor=1e293b)](https://github.com/nickvdp/nickvdp)
[![WebContainer](https://img.shields.io/badge/WebContainer-Enabled-10b981?style=for-the-badge&labelColor=1e293b)](https://webcontainers.io)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge&labelColor=1e293b)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-6366f1?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)

*A modern, high-performance IDE with AI integration, VS Code-like experience, real Alpine Linux in your browser, and the power to run Node.js entirely in the browser.*

</div>

---

## 🚀 v5.5.5 — The Freedom Update

The biggest feature release ever. Real AI streaming, 51-tool system, password-protected collaboration, terminal freedom, CI/CD pipelines, and a completely redesigned Settings page with mobile UI for both portrait and landscape.

### 🤖 AI Streaming & Tools (NEW!)
| Feature | Description |
|---------|-------------|
| **Real-Time Streaming** | AI responses stream token-by-token via SSE for all 12 providers |
| **Stop Button** | Abort streaming mid-response with one click |
| **Streaming Toggle** | Enable/disable streaming per session |
| **51 AI Tools** | AI can read/write files, run terminal commands, manage git, search web, and more |
| **File Tools** | read_file, write_file, delete_file, list_files, search_files, and more |
| **Git Tools** | git_status, git_diff, git_log, git_commit, git_branch, git_push, and more |
| **GitHub Tools** | create_issue, create_pr, search_repos, read_file, and more |
| **Terminal Tools** | run_terminal_command, get_terminal_output, clear_terminal |
| **Code Analysis** | analyze_code, find_references, count_lines_of_code |
| **Web Tools** | web_search, web_scrape, web_screenshot, fetch_url |
| **Editor Tools** | get_selection, replace_selection, goto_line, find_replace |
| **Workspace Tools** | create_snippet, list_snippets, apply_snippet, export_workspace |
| **Debug Tools** | toggle_breakpoint, get_call_stack, inspect_variable |
| **Streaming + Tools** | Tools execute mid-stream with follow-up streaming response |
| **Tool Results UI** | Tool calls shown inline in chat with collapsible results |

### 🔒 Secure Collaboration (NEW!)
| Feature | Description |
|---------|-------------|
| **Password Protection** | SHA-256 hashed passwords for sessions |
| **Session Timeout** | Configurable session expiry |
| **Max Participants** | Limit session size |
| **Host Controls** | Kick participants, transfer host role |
| **Mutual Backup** | Both host and visitor save workspace to IndexedDB |
| **Password Validation** | Server-side password verification via WebSocket |
| **Conflict Resolution** | Restore from backup on reconnect |

### ⚙️ Redesigned Settings (NEW!)
| Feature | Description |
|---------|-------------|
| **Sidebar Navigation** | 9 organized categories instead of infinite scroll |
| **Terminal Config** | RAM allocation, disk size, network relay, boot-on-start |
| **Linux User Mode** | Root / User+Sudo / User-only configuration |
| **Collab Settings** | Password, timeout, max participants |
| **Editor Settings** | Minimap, word wrap, font size, tab size |
| **Mobile Settings** | Touch mode, UI preferences |

### 📱 Mobile UI (NEW!)
| Feature | Description |
|---------|-------------|
| **Portrait Mode** | Bottom tab bar with Files, Search, AI, Terminal, Git |
| **Landscape Mode** | Activity sidebar + editor split view |
| **Swipe Gestures** | Swipe between tabs in portrait mode |
| **Full-Screen Editor** | Tap file to open in full-screen overlay |
| **Responsive Detection** | Auto-detect orientation and device type |

### 🐧 Terminal Freedom (NEW!)
| Feature | Description |
|---------|-------------|
| **Setup Wizard** | First-boot configuration with user creation options |
| **Skip User Setup** | Option to stay as root, no user created |
| **User Creation** | Create user with sudo or restricted access |
| **Custom Images** | Upload ISO/IMG files (Windows, Ubuntu, etc.) |
| **Network Relay** | Real internet access inside the VM via network_relay_url |
| **Smart Install Prompts** | "Install?" banner when commands aren't found |
| **Proper Package Manager** | Uses runCommand() for reliable apk add/del |
| **File Browser** | Navigate Alpine filesystem from within Nexus |

### 🎨 Theme Studio (UPGRADED!)
| Feature | Description |
|---------|-------------|
| **21 CSS Variables** | Full theme customization including scrollbar, selection, hover, badges |
| **7 Preset Themes** | Midnight Blue, One Dark Pro, Dracula, Solarized Dark, GitHub Dark, VS Code Dark+, Light |
| **Custom Themes** | Save/load named themes to localStorage |
| **Import/Export** | Share themes as JSON files |
| **Live Preview** | Changes apply instantly via CSS variables |

### 🚀 CI/CD Pipelines (NEW!)
| Feature | Description |
|---------|-------------|
| **Tauri Desktop Builds** | macOS, Windows, Linux via GitHub Actions |
| **Android APK Builds** | Capacitor-based debug + release APKs |
| **GitHub Pages Deploy** | Automatic deployment on push to main |
| **Release Artifacts** | APK, DMG, MSI, AppImage on tagged releases |

### ⚡ Performance (NEW!)
| Feature | Description |
|---------|-------------|
| **Lazy Loading** | Monaco Editor, v86, xterm.js, ThemeStudio loaded on demand |
| **Code Splitting** | Heavy components in separate chunks (62KB, 13KB, 6KB) |
| **Faster Startup** | Initial load reduced by deferring non-essential modules |

### 📲 Capacitor Bridge (NEW!)
| Feature | Description |
|---------|-------------|
| **Native Shell** | Execute commands via Termux plugin bridge |
| **Native Filesystem** | Read/write files on Android storage |
| **Haptics & Vibration** | Haptic feedback for actions |
| **Device Info** | Access platform, model, OS version |
| **Share Sheet** | Share files via native Android share dialog |

---

## 🐧 v5.4.0 — Real Linux in Your Browser

The biggest update in Nexus IDE history. **v86 x86 emulation** now boots a **real Alpine Linux** distro entirely inside your browser — no server, no VM, no Docker, just pure WebAssembly-powered x86 emulation. Your Linux filesystem persists in IndexedDB and survives page refreshes and browser restarts.

### 🖥️ Alpine Linux Terminal (NEW!)

| Feature | Description |
|---------|-------------|
| **Real Linux Terminal** | Full `bash`, `apk`, `git`, `python3`, `node` — not simulated |
| **v86 x86 Emulator** | WebAssembly-based x86 emulator runs actual Linux binaries |
| **Alpine Disk Image** | Pre-built Alpine Linux root filesystem, downloaded once from CDN |
| **IndexedDB Persistence** | VM state and disk image cached in your browser |
| **Serial Terminal** | xterm.js-powered terminal with command history (↑/↓) |
| **Screen Mode** | Toggle to v86 canvas output for GUI apps |
| **128 MB RAM** | Default memory allocation for the virtual machine |
| **Auto-Save State** | Optional periodic VM state saving (every 60s) |
| **Boot Progress** | Multi-phase boot UI: download → configure → boot → running |

### 📂 Workspace ↔ Alpine File Bridge (NEW!)

| Feature | Description |
|---------|-------------|
| **Push Files** | Send workspace files to Alpine Linux with one click |
| **Pull Files** | Import files from Alpine back into your Nexus workspace |
| **Path Mapping** | Automatic mapping between workspace paths and Alpine paths |
| **Directory Sync** | Push/pull entire directory structures |
| **File Browser** | Browse Alpine filesystem right from the Linux Terminal panel |
| **Package Manager** | Quick-install common packages: git, python3, nodejs, vim, htop |
| **Disk Usage** | Real-time disk usage display |

### 🖥️ Linux Terminal Activity

A new **Monitor** icon in the activity bar gives you instant access to the Linux Terminal. Click it to open the full v86 Alpine Linux environment with serial terminal, file browser, and package manager panels.

> 💡 **Tip**: Say "linux" or "alpine" via voice commands to instantly open the Linux Terminal.

> ⚠️ **Note**: noVNC and Wine are optional user-installed packages inside Alpine, NOT bundled by Nexus IDE.

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

## 🔥 What's New in v5.3.0

Editor polish blitz — 15 quality-of-life improvements that make Nexus IDE feel like a professional desktop IDE. Also a sneak peek at what's coming next.

### 🎨 Editor Improvements

| Feature | Description |
|---------|-------------|
| **Auto-Close Brackets** | Automatically closes `()`, `{}`, `[]`, `""`, `''` |
| **Auto-Close Quotes** | Smart quote auto-closing for single and double quotes |
| **Auto Indent** | Full auto-indentation on new lines and after `{` |
| **Split Editor** | Side-by-side file editing — already built, now promoted |
| **File Icons** | Color-coded icons by file type in explorer and tabs |
| **Minimap** | Code overview sidebar (enabled by default, toggle with Ctrl+Shift+M) |
| **Word Wrap** | Soft wrap long lines (enabled by default) |
| **Indent Guides** | Visual indentation level guides |
| **Bracket Pair Colors** | Matching brackets in distinct colors |
| **Sticky Scroll** | Keeps current scope header visible while scrolling |
| **Breadcrumbs** | File path navigation in all UI modes |

### 🖥️ New Components

| Component | Description |
|-----------|-------------|
| **Welcome Tab** | New tab page with quick actions, recent files, keyboard shortcuts |
| **Keyboard Shortcuts Panel** | Full shortcuts reference (Ctrl+Shift+K), searchable, grouped by category |
| **Notification Toasts** | Bottom-right toast system for success, error, warning, info |

---

## 🔥 What's New in v5.2.0

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
| **Beta (This)** | `main` | `npx github:TheStrongestOfTomorrow/Nexus-IDE` | 🚀 Latest with AI Streaming & Tools (v5.5.5) |
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
| 🐧 **Alpine Linux** | Real Linux terminal via v86 emulation |
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
| 🚀 **v5.5.5** | [The Freedom Update](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases/tag/v5.5.5) |
| 🐧 **v5.4.0** | [Alpine Linux in Your Browser](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases/tag/v5.4.0) |
| 📦 **Download Release** | [v5.1.0 Release](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases/tag/v5.1.0) |
| 🔀 **v5.3.0** | [Editor Polish Blitz](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases/tag/v5.3.0) |
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

### v5.5.5 (Current - Beta)
- 🤖 **AI Streaming** — Real-time token-by-token streaming for all 12 providers via SSE
- 🤖 **51 AI Tools** — File ops, git, GitHub, terminal, web, editor, workspace, debug, code analysis
- 🤖 **Streaming + Tools** — Tools execute mid-stream with follow-up response
- 🔒 **Password-Protected Sessions** — SHA-256 hashed passwords for collaboration
- 🔒 **Session Management** — Timeout, max participants, kick, host transfer
- 🔒 **Password Validation** — Server-side verification via WebSocket
- 💾 **Mutual Collab Backup** — Both host and visitor save workspace to IndexedDB
- ⚙️ **Settings Overhaul** — Sidebar navigation with 9 organized categories
- ⚙️ **Terminal Config** — RAM, disk, network relay, boot-on-start in Settings
- 📱 **Mobile Portrait UI** — Bottom tab bar, swipe gestures, full-screen editor
- 📱 **Mobile Landscape UI** — Activity sidebar, split panel, resizable bottom panel
- 🐧 **Setup Wizard** — First-boot user configuration (Root/Sudo/Restricted/Skip)
- 🐧 **Custom Image Upload** — Load ISO/IMG files into v86 emulator
- 🐧 **Network Relay** — Real internet access inside the VM
- 🐧 **Smart Install Prompts** — "Install?" banner for missing commands
- 🐧 **Proper Package Manager** — Uses runCommand() for reliable apk add/del
- 🛡️ **FileBridge Security** — Path sanitization against shell injection
- 🔧 **VS Code UI Polish** — Scrollable tabs, better resize handling, search bar
- 🎨 **Theme Studio** — 21 variables, 7 presets, custom themes, import/export, light mode
- 🚀 **CI/CD Pipelines** — Tauri (Win/Mac/Linux), Android APK, GitHub Pages
- ⚡ **Lazy Loading** — Monaco, v86, xterm.js, ThemeStudio loaded on demand
- 📲 **Capacitor Bridge** — Native shell, filesystem, haptics, share sheet

### v5.4.0
- 🐧 **Alpine Linux Terminal** — Real Linux via v86 x86 emulation in your browser
- 🐧 **v86 Emulator** — WebAssembly-powered x86 emulator boots Alpine Linux
- 📂 **File Bridge** — Push/pull files between Nexus workspace and Alpine filesystem
- 🐧 **Activity Bar Integration** — Monitor icon in activity bar for instant Linux access
- 📦 **Package Manager** — Quick-install git, python3, nodejs, vim, htop, and more
- 📁 **File Browser** — Browse Alpine filesystem from within Nexus IDE
- 💾 **VM State Persistence** — Save/restore VM state to IndexedDB
- 🔄 **Auto-Save State** — Optional periodic VM state saving (every 60s)
- 📺 **Serial/Screen Modes** — Toggle between xterm.js terminal and v86 canvas output
- 📡 **Disk Image Caching** — Alpine image downloaded once from CDN, cached in IndexedDB
- 🎙️ **Voice Control** — Say "linux" or "alpine" to open the terminal
- ⚙️ **Settings Panel** — v86/Linux section in Settings with usage instructions

### v5.3.0
- 🎨 **Auto-Close Brackets** — Automatically closes `()`, `{}`, `[]`, `""`, `''`
- 🎨 **Auto-Close Quotes** — Smart quote auto-closing
- 🎨 **Auto Indent** — Full auto-indentation on new lines
- 🎨 **Split Editor** — Side-by-side file editing (Ctrl+B)
- 🎨 **File Icons** — Color-coded by file type in explorer and tabs
- 🎨 **Minimap** — Code overview sidebar, toggle with Ctrl+Shift+M
- 🎨 **Word Wrap** — Soft wrap enabled by default
- 🎨 **Indent Guides** — Visual indentation level guides
- 🎨 **Bracket Pair Colors** — Matching brackets in distinct colors
- 🎨 **Sticky Scroll** — Current scope header stays visible while scrolling
- 🖥️ **Welcome Tab** — New tab page with quick actions, recent files, shortcuts
- ⌨️ **Keyboard Shortcuts Panel** — Full reference (Ctrl+Shift+K), searchable
- 🔔 **Notification Toasts** — Bottom-right toast system

### v5.2.0
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

**v5.5.5 — The Freedom Update**

</div>
