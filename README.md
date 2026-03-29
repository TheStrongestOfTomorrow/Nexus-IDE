<div align="center">

# 💼 Nexus IDE - Professional Edition

<img src="https://lucide.dev/api/icons/briefcase?size=128&color=6366f1" alt="Nexus IDE Professional" width="128" height="128" />

### *The Enterprise-Grade IDE — Everything from Beta, Plus More*

[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-Professional-6366f1?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/packages)
[![Version](https://img.shields.io/badge/Version-1.0.2-6366f1?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge&labelColor=1e293b)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-3b82f6?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)

*A full-featured, professional-grade IDE with all beta features, real-time collaboration, project visualization, productivity tools, and enterprise-exclusive capabilities.*

</div>

---

## ⚡ Quick Start

```bash
# Run the professional edition instantly (no install needed)
npx github:TheStrongestOfTomorrow/Nexus-IDE#professional

# Or install globally from GitHub Packages
npm install -g @TheStrongestOfTomorrow/nexus-ide-professional
nexus-pro
```

> **Note:** You need GitHub Packages access. If prompted, authenticate with:
> ```
> npm login --scope=@TheStrongestOfTomorrow --registry=https://npm.pkg.github.com
> ```

---

## 🚀 How to Use

### ⚠️ IMPORTANT: Do NOT use `npm run dev`

The Professional edition has TWO modes. Using `npm run dev` starts ONLY the web server!

### ✅ Correct Usage

```bash
# After cloning the repo
git clone -b professional https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
npm install

# Interactive mode selector (CHOOSE YOUR MODE)
npm start
# OR
node bin/nexus-pro.js
# OR
npx nexus-pro
```

### 📋 Mode Selection

When you run `nexus-pro`, you'll see:

```
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
     ★ Professional Edition ★ CLI + Web ★

Choose your mode:

  1. Terminal Mode (TUI)     Full IDE in your terminal
  2. Web Mode                Browser-based IDE
  3. Quick Commands          AI, files, config
  4. Help                    Show all options
  5. Exit                    Quit

Your choice: _
```

### 🎯 Direct Commands

```bash
nexus-pro              # Interactive selector
nexus-pro tui          # Terminal Mode directly
nexus-pro web          # Web Mode directly
nexus-pro web --port 8080  # Custom port
nexus-pro ai "prompt"  # Quick AI question
nexus-pro config       # View settings
```

---

## 🔥 Everything from Beta + Enterprise Exclusives

Professional Edition includes **every feature** from the Beta branch (v5.1.0), plus powerful enterprise-only additions:

### ✅ All Beta Features Included

| Feature | Description |
|---------|-------------|
| 🌐 **WebContainer** | Run Node.js entirely in your browser |
| 💾 **Workspace Saves** | Save/load workspaces to IndexedDB with auto-save |
| 🎨 **Beginner UI** | Simplified interface with tabbed navigation |
| 📱 **Mobile UI** | Touch-optimized mobile experience |
| 🤖 **12+ AI Providers** | OpenAI, Claude, Gemini, Grok, DeepSeek, Ollama... |
| 🧘 **Zen Mode** | Distraction-free coding |
| 🎨 **Theme Studio** | Create custom themes |
| 📊 **Dependency Graph** | Visualize project dependencies |
| 📦 **Extensions** | OpenVSX marketplace |
| 🔍 **Search** | Full project search |
| 🐛 **Debug** | Run and debug tools |
| 📝 **Snippets** | Code snippet manager |
| ✅ **Todo Scanner** | Find TODOs in code |
| 📈 **Project Insights** | Code statistics |
| 🔀 **Diff Editor** | Compare file changes |
| ⌨️ **Command Palette** | Ctrl+Shift+P power |
| 🎙️ **Voice Control** | Control IDE with speech |

### 💎 Enterprise-Exclusive Features

These features exist **only** in the Professional Edition — they are not available in Beta, Stable, or CLI.

| Feature | Description |
|---------|-------------|
| 🛡️ **Team Management** | Full team roster with role-based access control (Admin, Developer, Viewer), invite system, online status tracking, and activity feed |
| 📊 **Project Dashboard** | Real-time metrics overview — total files, lines of code, AI queries, active sessions, uptime, sprint progress, and team productivity charts |
| 🔀 **Code Review** | Built-in PR review system with status tracking (Open/Merged/Closed), diff summaries with additions/deletions per file, comment threads, and Approve/Request Changes actions |
| ⚙️ **CI/CD Pipeline** | Live pipeline monitoring with Build → Test → Deploy stage visualization, status badges (Success/Running/Failed/Pending), build durations, trigger builds, and full build history |
| 🌐 **Environment Manager** | Multi-environment configuration (Development, Staging, Production) with per-environment variables, deploy actions, active environment highlighting, and cross-environment comparison diffs |
| 📋 **Audit Log** | Compliance-ready action tracking with filterable log entries, severity indicators (Info/Warning/Critical), search, date range filters, action type filters, and CSV export |

---

## 🖥️ Two Modes, One IDE

### Terminal Mode (TUI)
```
╔═══════════════════════════════════════════════╗
║              NEXUS IDE v1.0.2                 ║
╠═══════════════════════════════════════════════╣
║  📁 Explorer  │  ✏️ Editor  │  🤖 AI Chat   ║
║               │             │               ║
║  📂 src       │ code here   │ Ask anything ║
║  📂 public    │             │              ║
║  📄 pkg.json  │             │              ║
╚═══════════════════════════════════════════════╝
```

### Web Mode
- Monaco Editor (VS Code engine)
- Real-time collaboration with live sessions
- VibeGraph project visualization
- Mermaid diagram rendering
- Pomodoro productivity timer
- Minecraft script management
- Extension marketplace
- Mobile-friendly responsive layout
- Workspace save/load system
- Beginner-friendly UI mode

---

## 🤖 AI Providers

| Provider | Models | Best For |
|----------|--------|----------|
| OpenAI | GPT-4o, O1, O3 Mini | General |
| Anthropic | Claude Opus 4, Sonnet 4 | Reasoning |
| Google | Gemini 2.5 Pro, Flash | Fast |
| xAI | Grok 3, Grok Fast | Real-time |
| Mistral | Codestral, Large | Coding |
| DeepSeek | Coder, R1 | Code gen |
| Groq | Llama 3.3 70B | Speed (Free) |
| Cohere | Command R+ | Enterprise |
| Perplexity | Sonar Pro | Research |
| Alibaba | Qwen Max, Coder | Multilingual |
| Together | Llama 3.3, Qwen 2.5 | Open Source |
| Ollama | Llama, Mistral, DeepSeek | Local |

---

## 🌿 All Versions

| Version | Branch | Install Command | Description |
|---------|--------|-----------------|-------------|
| **Stable** | `stable` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@stable` | ✅ Production ready (v4.4) |
| **Beta** | `main` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@main` | 🧪 Latest with WebContainer (v5.1) |
| **Professional (This)** | `professional` | `npx github:TheStrongestOfTomorrow/Nexus-IDE#professional` | 💼 Beta features + enterprise exclusives |
| **CLI/TUI** | `cli` | `npx github:TheStrongestOfTomorrow/Nexus-IDE#cli` | 🖥️ Full standalone terminal IDE |

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| GitHub Packages | https://github.com/TheStrongestOfTomorrow/Nexus-IDE/packages |
| GitHub | https://github.com/TheStrongestOfTomorrow/Nexus-IDE |
| Issues | https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues |
| Stable | [stable](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/tree/stable) |
| Beta | [main](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/tree/main) |
| CLI | [cli](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/tree/cli) |

---

<div align="center">

### Made with ❤️ by Taz

*Professional. Powerful. Perfect.*

</div>
