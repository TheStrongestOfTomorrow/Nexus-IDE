<div align="center">

# 🖥️ Nexus IDE - Terminal Edition

<img src="https://lucide.dev/api/icons/terminal-square?size=128&color=3b82f6" alt="Nexus IDE Terminal" width="128" height="128" />

### *Code in Your Terminal. AI at Your Fingertips.*

[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-CLI-3b82f6?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/packages)
[![Version](https://img.shields.io/badge/Version-5.0.2-3b82f6?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge&labelColor=1e293b)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-6366f1?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)

</div>

---

## ⚡ Quick Start

```bash
# Run the terminal edition instantly (no install needed)
npx github:TheStrongestOfTomorrow/Nexus-IDE#cli

# Or install globally from GitHub Packages
npm install -g @TheStrongestOfTomorrow/nexus-ide-cli
nexus
```

> **Note:** You need GitHub Packages access. If prompted, authenticate with:
> ```
> npm login --scope=@TheStrongestOfTomorrow --registry=https://npm.pkg.github.com
> ```

---

## 🚀 How to Use

### ⚠️ IMPORTANT: Do NOT use `npm run dev`

The TUI is designed to run directly. Using `npm run dev` starts the web server, NOT the terminal interface!

### ✅ Correct Usage

```bash
# After cloning the repo
git clone -b cli https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
npm install

# Run TUI (Terminal User Interface)
npm run tui
# OR
node cli/nexus.js
# OR
npx nexus
```

### 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npx github:TheStrongestOfTomorrow/Nexus-IDE#cli` | Run TUI from GitHub |
| `npm run tui` | Run TUI (after clone) |
| `node cli/nexus.js` | Run TUI directly |
| `nexus` | Run TUI (if installed globally) |

---

## 🌟 Features

### 🎯 Full Terminal IDE
| Feature | Description |
|---------|-------------|
| 📁 **File Explorer** | Navigate directories with keyboard |
| ✏️ **Code Editor** | Edit files directly in terminal |
| 🤖 **AI Assistant** | Chat with 12+ AI providers |
| 💻 **Built-in Terminal** | Run commands without leaving |
| 🔧 **Git Integration** | View status, branch info |

### 🤖 AI Providers
| Provider | Models | Type |
|----------|--------|------|
| OpenAI | GPT-4o, O1, O3 Mini | Cloud |
| Anthropic | Claude Opus 4, Sonnet 4 | Cloud |
| Google | Gemini 2.5 Pro, Flash | Cloud |
| xAI | Grok 3, Grok 3 Fast | Cloud |
| Mistral | Mistral Large, Codestral | Cloud |
| DeepSeek | Coder, R1 | Cloud |
| Groq | Llama 3.3 70B | Cloud (Free) |
| Ollama | Llama, Mistral | Local |

---

## ⌨️ Keyboard Shortcuts

### Navigation
| Key | Action |
|:---:|--------|
| `↑` `↓` | Navigate items |
| `Enter` | Select / Open |
| `Tab` | Switch panels |
| `Q` / `Esc` | Back / Quit |

### File Operations
| Key | Action |
|:---:|--------|
| `E` | Edit file |
| `D` | Delete file |
| `N` | New file |
| `H` | Go up directory |

### AI Chat
| Key | Action |
|:---:|--------|
| `C` | Start chat |
| `H` | AI help |

---

## 📋 CLI Commands

```bash
nexus                    # Launch TUI (default)
nexus tui                # Same as above
nexus start              # Start web server (not TUI!)
nexus ai "prompt"        # Quick AI question
nexus run file.js        # Execute code
nexus ls                 # List files
nexus config             # View settings
```

---

## 🌿 All Versions

| Version | Branch | Install Command | Description |
|---------|--------|-----------------|-------------|
| **Stable** | `stable` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@stable` | ✅ Production ready (v4.4) |
| **Beta** | `main` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@main` | 🧪 Latest with WebContainer (v5.1) |
| **Professional** | `professional` | `npx github:TheStrongestOfTomorrow/Nexus-IDE#professional` | 💼 CLI + Web dual mode |
| **CLI/TUI (This)** | `cli` | `npx github:TheStrongestOfTomorrow/Nexus-IDE#cli` | 🖥️ Terminal only |

---

## 🎯 Use Cases

- 🖥️ **SSH Development** - Full IDE over SSH
- ☁️ **Server Admin** - Edit configs remotely
- 📱 **Low Resources** - Lightweight interface
- ⌨️ **Keyboard Lovers** - No mouse needed
- 🐧 **Linux/WSL** - Native terminal experience

---

## 🔧 Configuration

### Set AI Provider
```bash
# In TUI, go to Settings (option 6)
# Or use environment variables:
export NEXUS_AI_PROVIDER=openai
export NEXUS_AI_KEY=sk-...
export NEXUS_AI_MODEL=gpt-4o
```

### Config File Location
```
~/.nexus-ide/config.json
```

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| GitHub Packages | https://github.com/TheStrongestOfTomorrow/Nexus-IDE/packages |
| GitHub | https://github.com/TheStrongestOfTomorrow/Nexus-IDE |
| Issues | https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues |
| Stable | [stable](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/tree/stable) |
| Beta | [main](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/tree/main) |
| Professional | [professional](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/tree/professional) |

---

<div align="center">

### Made with ❤️ by Taz

*Terminal. Simplified.*

</div>
