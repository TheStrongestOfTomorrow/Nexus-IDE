<div align="center">

# 💼 Nexus IDE - Professional Edition

<img src="https://lucide.dev/api/icons/briefcase?size=128&color=6366f1" alt="Nexus IDE Professional" width="128" height="128" />

### *The Ultimate Office-Ready Development Environment*

[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-Professional-6366f1?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/packages)
[![Version](https://img.shields.io/badge/Version-1.0.2-6366f1?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge&labelColor=1e293b)](LICENSE)
[![Mode](https://img.shields.io/badge/Mode-CLI%20%2B%20Web-10b981?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-3b82f6?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)

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

## 🌟 Why Professional?

| Feature | Description |
|---------|-------------|
| 🔄 **Dual Mode** | Switch between CLI & Web instantly |
| 🤖 **12+ AI Providers** | OpenAI, Claude, Gemini, Grok, Ollama... |
| 🤝 **Collaboration** | Real-time editing, live share |
| 💼 **Office Tools** | Docs, spreadsheets, presentations |
| 🔒 **Enterprise Ready** | CI/CD, Docker, Git integration |

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
- Real-time collaboration
- Extension marketplace
- Mobile-friendly

---

## 🤖 AI Providers

| Provider | Models | Best For |
|----------|--------|----------|
| OpenAI | GPT-4o, O1, O3 | General |
| Anthropic | Claude Opus 4, Sonnet 4 | Reasoning |
| Google | Gemini 2.5 Pro, Flash | Fast |
| xAI | Grok 3, Grok Fast | Real-time |
| Mistral | Codestral, Large | Coding |
| DeepSeek | Coder, R1 | Code gen |
| Groq | Llama 3.3 70B | Speed (Free) |
| Ollama | Llama, Mistral | Local |

---

## 🌿 All Versions

| Version | Branch | Install Command | Description |
|---------|--------|-----------------|-------------|
| **Stable** | `stable` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@stable` | ✅ Production ready (v4.4) |
| **Beta** | `main` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@main` | 🧪 Latest with WebContainer (v5.1) |
| **Professional (This)** | `professional` | `npx github:TheStrongestOfTomorrow/Nexus-IDE#professional` | 💼 CLI + Web dual mode |
| **CLI/TUI** | `cli` | `npx github:TheStrongestOfTomorrow/Nexus-IDE#cli` | 🖥️ Terminal only |

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
