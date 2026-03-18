# 💼 Nexus IDE - Professional Edition

<p align="center">
  <img src="https://lucide.dev/api/icons/briefcase?size=64&color=6366f1" alt="Nexus Professional Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-6366f1" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/Mode-CLI%20%2B%20Web-green" alt="CLI + Web Mode" />
  <img src="https://img.shields.io/badge/Status-Professional-blue" alt="Status" />
  <img src="https://img.shields.io/npm/l/nexus-ide?color=blueviolet" alt="License" />
</p>

**Nexus IDE Professional** is the ultimate office-ready development environment that combines the power of a full terminal IDE (TUI) with a modern browser-based web IDE. Perfect for professional developers, teams, and enterprise environments.

---

## 🚀 Quick Start

```bash
# Run directly from GitHub
npx github:TheStrongestOfTomorrow/Nexus-IDE#professional

# Choose your mode interactively
nexus-pro

# Or specify directly
nexus-pro tui     # Terminal Mode
nexus-pro web     # Web Mode
```

---

## 🌿 All Versions

| Version | Install | Description |
|---------|---------|-------------|
| **Stable** | `npx nexus-ide` | ✅ Production ready web IDE |
| **Beta** | `npx nexus-ide@beta` | 🧪 Latest features |
| **CLI/TUI** | `npx github:TheStrongestOfTomorrow/Nexus-IDE#cli` | 🖥️ Terminal only |
| **Professional (This)** | `npx github:TheStrongestOfTomorrow/Nexus-IDE#professional` | 💼 CLI + Web modes |

---

## ✨ Professional Features

### 🔄 Dual Mode System
- **Terminal Mode (TUI)**: Full IDE in your terminal for SSH, servers, and keyboard-centric workflows
- **Web Mode**: Browser-based IDE with Monaco editor, real-time collaboration, and visual tools
- **Seamless Switching**: Switch between modes based on your current needs

### 🤖 AI Integration (12+ Providers)
| Provider | Models | Best For |
|----------|--------|----------|
| **OpenAI** | GPT-4o, O1, O3 Mini | General purpose |
| **Anthropic** | Claude Opus 4, Sonnet 4 | Complex reasoning |
| **Google Gemini** | Gemini 2.5 Pro, Flash | Fast responses |
| **xAI** | Grok 3, Grok 3 Fast | Real-time info |
| **Mistral** | Mistral Large, Codestral | Code generation |
| **DeepSeek** | DeepSeek Coder, R1 | Coding tasks |
| **Groq** | Llama 3.3 70B | Ultra-fast inference |
| **Ollama** | Llama, Mistral, Code Llama | Local/Offline |

### 💼 Office-Ready Tools
- **Document Editor**: Write and edit markdown, docs
- **Spreadsheet View**: CSV/TSV data visualization
- **Presentation Mode**: Preview slides from markdown
- **Diagram Support**: Mermaid diagrams render
- **PDF Preview**: View PDFs in web mode

### 🤝 Collaboration
- **Real-time Editing**: Collaborate with team members
- **Live Share**: Share your workspace
- **Chat Integration**: Built-in team chat
- **Code Review**: Inline comments and reviews

### 🔧 Enterprise Features
- **Multi-environment Support**: Dev, staging, production configs
- **Git Integration**: Full Git workflow support
- **CI/CD Integration**: Pipeline configuration
- **Docker Support**: Container management
- **API Testing**: Built-in API client

---

## 📋 Commands

### Mode Selection
```bash
nexus-pro              Interactive mode selector
nexus-pro tui          Launch Terminal User Interface
nexus-pro web          Launch Web IDE server
```

### Web Mode Options
```bash
nexus-pro web --port 8080    Custom port
nexus-pro serve              Production build & serve
```

### Quick Commands
```bash
nexus-pro ai "prompt"        Quick AI question
nexus-pro explain file.js    AI explains code
nexus-pro ls                 List files
nexus-pro run file.js        Execute code
nexus-pro config             View configuration
```

---

## ⌨️ Keyboard Shortcuts (TUI)

### Main Menu
| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate |
| `1-8` | Quick select |
| `Enter` | Confirm |
| `Q` | Quit |

### File Browser
| Key | Action |
|-----|--------|
| `Enter` | Open |
| `E` | Edit |
| `D` | Delete |
| `N` | New file |
| `H` | Parent folder |

### AI Chat
| Key | Action |
|-----|--------|
| `C` | Chat |
| `H` | Help |

---

## 🖼️ Screenshots

### Mode Selector
```
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
     ★ Professional Edition ★ CLI + Web ★

Welcome to Nexus IDE Professional!

Choose your mode:

  1. Terminal Mode (TUI)     Full IDE in your terminal
  2. Web Mode                Browser-based IDE
  3. Quick Commands          AI, files, config
  4. Help                    Show all options
  5. Exit                    Quit

Your choice: _
```

---

## 🎯 Use Cases

### Perfect For:
- **Remote Development**: SSH + TUI for server work
- **Office Work**: Web mode for meetings, docs, presentations
- **Team Collaboration**: Real-time editing and sharing
- **Enterprise**: CI/CD, Docker, API testing
- **Education**: Teaching, workshops, tutorials

---

## 🔧 Configuration

### Environment Variables
```bash
# AI Configuration
NEXUS_AI_PROVIDER=openai      # Provider ID
NEXUS_AI_KEY=sk-...           # API key
NEXUS_AI_MODEL=gpt-4o         # Model name

# Server Configuration
PORT=3000                     # Web server port
```

### Config File
Located at `~/.nexus-ide/config.json`

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| **GitHub Repo** | https://github.com/TheStrongestOfTomorrow/Nexus-IDE |
| **Stable Branch** | `git clone -b stable ...` |
| **Beta Branch** | `git clone -b main ...` |
| **CLI Branch** | `git clone -b cli ...` |
| **Report Issue** | https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues |

---

## 💖 Contributing

Nexus IDE is open-source. Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

[MIT License](LICENSE)

---

*Crafted with ❤️ for professionals by Taz.*
