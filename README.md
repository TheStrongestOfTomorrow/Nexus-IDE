<div align="center">

# Nexus IDE

<img src="https://lucide.dev/api/icons/zap?size=128&color=f59e4b" alt="Nexus IDE" width="128" height="128" />

### *The AI-First, Browser-Based IDE with WebContainer Power*

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-222222?style=for-the-badge&labelColor=1e293b&logo=github)](https://thestrongestoftomorrow.github.io/Nexus-IDE/)
[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-Beta-f59e4b?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/packages)
[![Version](https://img.shields.io/badge/Version-5.5.6-3b82f6?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![Linux](https://img.shields.io/badge/Linux-Alpine_Linux_in_Browser-emerald?style=for-the-badge&labelColor=1e293b)](https://github.com/nickvdp/nickvdp)
[![WebContainer](https://img.shields.io/badge/WebContainer-Enabled-10b981?style=for-the-badge&labelColor=1e293b)](https://webcontainers.io)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge&labelColor=1e293b)](LICENSE)

*A modern, high-performance IDE with AI integration, VS Code-like experience, real Alpine Linux in your browser, and the power to run Node.js entirely in the browser.*

</div>

---

## Live Demo

Try Nexus IDE right now — no installation needed!

| Platform | Link | Notes |
|----------|------|-------|
| GitHub Pages | [**thestrongestoftomorrow.github.io/Nexus-IDE**](https://thestrongestoftomorrow.github.io/Nexus-IDE/) | Static hosting — some features require a backend server (see below) |

### GitHub Pages Limitations

The GitHub Pages deployment is a **static site** — there is no Node.js backend. Most features work great, but some require a running server:

| Feature | GitHub Pages | Locally (`npm start`) |
|---------|:------------:|:---------------------:|
| Code Editor & File Manager | Works | Works |
| AI Providers (12+) | Works (direct API) | Works |
| GitHub Integration (Device Flow + PAT) | Works | Works |
| Workspace Save / IndexedDB | Works | Works |
| Session Persistence | Works | Works |
| Theme Studio & Settings | Works | Works |
| Extensions Marketplace | Works | Works |
| Voice Control & Zen Mode | Works | Works |
| Mobile UI | Works | Works |
| v86 Alpine Linux | Partial (no SharedArrayBuffer) | Works (with COEP/COOP headers) |
| WebContainers (Node.js in browser) | Partial (no SharedArrayBuffer) | Works (with COEP/COOP headers) |
| Server-side Terminal (bash) | Unavailable | Works |
| Server-side Code Execution | Unavailable | Works |
| WebSocket Collaboration | Falls back to external relay | Works (native WS) |
| Minecraft Bridge | Unavailable | Works |
| GitHub OAuth (callback) | Device Flow instead | Works |
| AI API Proxy | Direct browser calls instead | Works |

> **Why?** GitHub Pages serves static files only — no custom response headers, no WebSocket server, no server-side processes. For the full experience, run Nexus IDE locally with `npm start`.

---

## v5.5.6 — The Freedom Update

The biggest feature release ever. Real AI streaming, 51-tool system, password-protected collaboration, terminal freedom, CI/CD pipelines, and a completely redesigned Settings page with mobile UI for both portrait and landscape.

### AI Streaming & Tools
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

### Secure Collaboration
| Feature | Description |
|---------|-------------|
| **Password Protection** | SHA-256 hashed passwords for sessions |
| **Session Timeout** | Configurable session expiry |
| **Max Participants** | Limit session size |
| **Host Controls** | Kick participants, transfer host role |
| **Mutual Backup** | Both host and visitor save workspace to IndexedDB |
| **Conflict Resolution** | Restore from backup on reconnect |

### Redesigned Settings
| Feature | Description |
|---------|-------------|
| **Sidebar Navigation** | 9 organized categories instead of infinite scroll |
| **Terminal Config** | RAM allocation, disk size, network relay, boot-on-start |
| **Linux User Mode** | Root / User+Sudo / User-only configuration |
| **Collab Settings** | Password, timeout, max participants |
| **Editor Settings** | Minimap, word wrap, font size, tab size |
| **Mobile Settings** | Touch mode, UI preferences |

### Mobile UI
| Feature | Description |
|---------|-------------|
| **Portrait Mode** | Bottom tab bar with Files, Search, AI, Terminal, Git |
| **Landscape Mode** | Activity sidebar + editor split view |
| **Swipe Gestures** | Swipe between tabs in portrait mode |
| **Full-Screen Editor** | Tap file to open in full-screen overlay |
| **Responsive Detection** | Auto-detect orientation and device type |

### Terminal Freedom
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

### Theme Studio
| Feature | Description |
|---------|-------------|
| **21 CSS Variables** | Full theme customization including scrollbar, selection, hover, badges |
| **7 Preset Themes** | Midnight Blue, One Dark Pro, Dracula, Solarized Dark, GitHub Dark, VS Code Dark+, Light |
| **Custom Themes** | Save/load named themes to localStorage |
| **Import/Export** | Share themes as JSON files |
| **Live Preview** | Changes apply instantly via CSS variables |

### CI/CD Pipelines
| Feature | Description |
|---------|-------------|
| **Tauri Desktop Builds** | macOS, Windows, Linux via GitHub Actions |
| **Android APK Builds** | Capacitor-based debug + release APKs |
| **GitHub Pages Deploy** | Automatic deployment on push to main |
| **Release Artifacts** | APK, DMG, MSI, AppImage on tagged releases |

### Performance
| Feature | Description |
|---------|-------------|
| **Lazy Loading** | Monaco Editor, v86, xterm.js, ThemeStudio loaded on demand |
| **Code Splitting** | Heavy components in separate chunks (62KB, 13KB, 6KB) |
| **Faster Startup** | Initial load reduced by deferring non-essential modules |
| **Serial I/O Buffering** | Optimized v86 serial output with buffered flushing |

### Capacitor Bridge (Android)
| Feature | Description |
|---------|-------------|
| **Native Shell** | Execute commands via Termux plugin bridge |
| **Native Filesystem** | Read/write files on Android storage |
| **Haptics & Vibration** | Haptic feedback for actions |
| **Device Info** | Access platform, model, OS version |
| **Share Sheet** | Share files via native Android share dialog |

---

## Real Linux in Your Browser

**v86 x86 emulation** boots a **real Alpine Linux** distro entirely inside your browser — no server, no VM, no Docker, just pure WebAssembly-powered x86 emulation. Your Linux filesystem persists in IndexedDB and survives page refreshes and browser restarts.

> **Note:** The v86 emulator and WebContainers require `SharedArrayBuffer`, which needs cross-origin isolation headers (`COEP`/`COOP`). These headers are set automatically when running locally with `npm start`, but are not available on GitHub Pages. For the full Linux and WebContainer experience, run locally.

---

## Install & Run

### Method 1 — Clone & Run Locally (Recommended)

```bash
# Clone the repo
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE

# Install dependencies
npm install

# Start the dev server (includes backend for full features)
npm start
```

Then open **http://localhost:3000** in your browser. This gives you the full experience including server-side terminal, WebSocket collaboration, and cross-origin isolation for v86/WebContainers.

### Method 2 — GitHub Packages

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

### Method 3 — Just Browse

Open [thestrongestoftomorrow.github.io/Nexus-IDE](https://thestrongestoftomorrow.github.io/Nexus-IDE/) — no install, no account, just code. Some server-dependent features won't be available (see the compatibility table above).

---

## All Versions

| Version | Branch | Description |
|---------|--------|-------------|
| **Latest (This)** | `main` | v5.5.6 — AI Streaming, Tools, Linux, Mobile |
| **CLI / TUI** | `cli` | Terminal-only edition |

---

## AI Providers

| Provider | Models | Type |
|----------|--------|------|
| OpenAI | GPT-4o, O1, O3 Mini | Cloud |
| Anthropic | Claude Opus 4.8, Sonnet 4.6 | Cloud |
| Google | Gemini 2.5 Pro, Flash | Cloud |
| xAI | Grok 3, Grok 3 Fast | Cloud |
| Mistral | Codestral, Large | Cloud |
| DeepSeek | Coder, R1 | Cloud |
| Groq | Llama 3.3 70B | Free Tier |
| Cohere | Command R+ | Cloud |
| Perplexity | Sonar Pro | Cloud |
| Alibaba | Qwen Max, Coder | Cloud |
| Together | Llama 3.3, Qwen 2.5 | Cloud |
| Ollama | Llama, Mistral, DeepSeek | Local |

---

## Full Feature List

| Feature | Description |
|---------|-------------|
| Alpine Linux | Real Linux terminal via v86 emulation |
| Workspace Saves | Save/load projects to IndexedDB |
| Beginner UI | Simplified interface for newcomers |
| WebContainer | Run Node.js in browser |
| 12+ AI Providers | OpenAI, Claude, Gemini, Grok, and more |
| Voice Control | Control IDE with speech |
| Zen Mode | Distraction-free coding |
| Theme Studio | Create custom themes |
| Dependency Graph | Visualize project deps |
| Cloud Bridge | Real-time collaboration |
| Mobile UI | Proper touch-optimized mobile experience |
| Extensions | OpenVSX marketplace |
| Search | Full project search |
| Debug | Run and debug tools |
| Snippets | Code snippet manager |
| Todo Scanner | Find TODOs in code |
| Project Insights | Code statistics |
| Diff Editor | Compare file changes |
| Command Palette | Ctrl+Shift+P power |

---

## Deployment

### Live Demo (No Install)
- **GitHub Pages**: [thestrongestoftomorrow.github.io/Nexus-IDE](https://thestrongestoftomorrow.github.io/Nexus-IDE/) — Automatically deploys from `main` branch on every push

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
npm start        # Dev server on localhost:3000 (full features)
npm run build    # Production build -> dist/
npm run serve    # Serve production build
```

### Android
Download the APK from [Releases](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases) and install on your device. No Google Play needed.

### Tauri Desktop
```bash
npm run tauri:build
```

---

## Changelog

### v5.5.6 (Current)
- AI Streaming — Real-time token-by-token streaming for all 12 providers via SSE
- 51 AI Tools — File ops, git, GitHub, terminal, web, editor, workspace, debug, code analysis
- Streaming + Tools — Tools execute mid-stream with follow-up response
- Password-Protected Sessions — SHA-256 hashed passwords for collaboration
- Session Management — Timeout, max participants, kick, host transfer
- Settings Overhaul — Sidebar navigation with 9 organized categories
- Mobile Portrait/Landscape UI — Bottom tab bar, swipe gestures, full-screen editor
- Setup Wizard — First-boot user configuration (Root/Sudo/Restricted/Skip)
- Custom Image Upload — Load ISO/IMG files into v86 emulator
- Theme Studio — 21 variables, 7 presets, custom themes, import/export, light mode
- CI/CD Pipelines — Tauri (Win/Mac/Linux), Android APK, GitHub Pages
- Lazy Loading — Monaco, v86, xterm.js, ThemeStudio loaded on demand
- Capacitor Bridge — Native shell, filesystem, haptics, share sheet
- Optimized Serial I/O — Buffered v86 output with 4KB flush for better performance
- Updated AI Models — Claude Opus 4.8, Sonnet 4.6; Gemini 2.5 Pro; Grok 3

### v5.4.0
- Alpine Linux Terminal — Real Linux via v86 x86 emulation in your browser
- File Bridge — Push/pull files between Nexus workspace and Alpine filesystem
- VM State Persistence — Save/restore VM state to IndexedDB
- Serial/Screen Modes — Toggle between xterm.js terminal and v86 canvas output
- Disk Image Caching — Alpine image downloaded once, cached in IndexedDB

### v5.3.0
- Editor Improvements — Auto-close brackets, auto indent, split editor, minimap, word wrap
- Welcome Tab — New tab page with quick actions, recent files, shortcuts
- Notification Toasts — Bottom-right toast system

### v5.2.0
- Deep Git Integration — Full source control panel: staging, commits, branches, history, PRs, issues
- Auto-Update Check — Checks GitHub for new releases every 5 minutes

### v5.1.5
- Airplane Mode — Auto-detect offline, partial lock on internet features only
- Session Persistence — Full IDE state saved to IndexedDB every 30 seconds

### v5.1.0
- Workspace Save System — Save/load workspaces to IndexedDB with auto-save
- Beginner-Friendly UI — New simplified interface with tabbed navigation
- Tauri v5.1.0 — Updated desktop integration
- Capacitor Improvements — Splash screen, status bar, keyboard handling

### v5.0.0
- WebContainer Integration — Run Node.js in browser
- npm install support in browser
- Cross-Origin Isolation headers (COOP/COEP)

---

<div align="center">

### Made with love by Taz

*The Future of Browser-Based Development*

**v5.5.6 — The Freedom Update**

</div>
