# 🖥️ Nexus IDE - CLI/TUI Version

<p align="center">
  <img src="https://lucide.dev/api/icons/terminal?size=64&color=3b82f6" alt="Nexus Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-5.0.0-blue" alt="Version 5.0.0" />
  <img src="https://img.shields.io/badge/Interface-TUI-green" alt="TUI Interface" />
  <img src="https://img.shields.io/badge/Status-Stable-brightgreen" alt="Status" />
  <img src="https://img.shields.io/npm/l/nexus-ide?color=blueviolet" alt="License" />
</p>

**Nexus IDE TUI** is a powerful terminal-based IDE that brings the full IDE experience to your command line. Perfect for SSH sessions, remote development, and developers who prefer the terminal.

---

## 🚀 Quick Start

### Install & Run TUI
```bash
# Run directly from GitHub (recommended)
npx github:TheStrongestOfTomorrow/Nexus-IDE#cli

# Or clone and run
git clone -b cli https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
npm install
npx nexus
```

### Run Web Mode
```bash
# Start web server instead
npx nexus start
```

---

## 🌿 All Versions

| Version | Install | Description |
|---------|---------|-------------|
| **Stable** | `npx nexus-ide` | ✅ Production ready web IDE |
| **Beta** | `npx nexus-ide@beta` | 🧪 Latest features |
| **Professional** | `npx github:TheStrongestOfTomorrow/Nexus-IDE#professional` | 💼 Office-ready with CLI+Web |
| **CLI/TUI (This)** | `npx github:TheStrongestOfTomorrow/Nexus-IDE#cli` | 🖥️ Terminal interface |

---

## 🎮 TUI Features

### Full Terminal IDE Experience
- **File Explorer**: Navigate directories with keyboard
- **Code Editor**: Edit files with syntax awareness
- **AI Assistant**: Integrated AI chat panel (12+ providers)
- **Terminal**: Built-in terminal for commands
- **Git Integration**: View git status

### 12+ AI Providers Built-In
| Provider | Models |
|----------|--------|
| **OpenAI** | GPT-4o, GPT-4o Mini, O1, O3 Mini |
| **Anthropic** | Claude Opus 4, Claude Sonnet 4, Claude 3.5 |
| **Google Gemini** | Gemini 2.5 Pro, Gemini 2.0 Flash |
| **xAI** | Grok 3, Grok 3 Fast, Grok 2 Vision |
| **Mistral** | Mistral Large, Codestral, Pixtral |
| **DeepSeek** | DeepSeek Chat, DeepSeek Coder, DeepSeek R1 |
| **Alibaba Qwen** | Qwen Max, Qwen Coder Plus |
| **Groq** | Llama 3.3 70B, Mixtral (Free tier) |
| **Ollama** | Llama 3.2, Mistral, Code Llama (Local) |

---

## 📋 Available Commands

### TUI Mode (Terminal Interface)
```bash
nexus                  Launch TUI (default)
nexus tui              Same as above
nexus chat             Open AI chat directly
```

### Web Mode (Browser Interface)
```bash
nexus start            Start development server
nexus start --port 8080  Custom port
```

### Quick Commands
```bash
nexus ai "prompt"      Ask AI a question
nexus explain file.js  AI explains code
nexus run file.js      Execute code
nexus ls               List files
nexus cat file.js      View file
nexus edit file.js     Edit file
nexus config           Show configuration
```

---

## ⌨️ Keyboard Shortcuts

### Main Menu
| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate options |
| `1-8` | Quick select |
| `Enter` | Confirm |
| `Q` / `Esc` | Quit / Go back |

### File Browser
| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate files |
| `Enter` | Open file/folder |
| `E` | Edit file |
| `D` | Delete file |
| `N` | Create new file |
| `H` | Go to parent folder |

### AI Chat
| Key | Action |
|-----|--------|
| `C` | Start chat |
| `H` | Show AI help |

---

## 🖼️ TUI Layout

```
╔═══════════════════════════════════════════════════════════════╗
║                      NEXUS IDE v5.0.0                         ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   Welcome to Nexus IDE TUI                                    ║
║                                                               ║
║   🚀 1. Start Web IDE Server                                  ║
║   📁 2. File Browser                                          ║
║   🤖 3. AI Assistant                                          ║
║   ▶️ 4. Run Code                                              ║
║   📚 5. Git Status                                            ║
║   ⚙️ 6. Settings                                              ║
║   ❓ 7. Help                                                  ║
║   🚪 8. Exit                                                  ║
║                                                               ║
║   Use ↑↓ or 1-8 to select, Enter to confirm, Q to quit       ║
║                                                               ║
║   Provider: Google Gemini                                     ║
║   Model: gemini-2.0-flash                                     ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🎯 Use Cases

### Perfect For:
- **SSH/Remote Development**: Full IDE over SSH
- **Low Resource Machines**: Lightweight terminal interface
- **Server Administration**: Edit configs and run commands
- **WSL/Container Development**: Native terminal experience
- **Keyboard-Centric Developers**: No mouse needed

### AI-Powered Features:
- **Code Generation**: Generate code from prompts
- **Code Explanation**: Understand complex code
- **Error Fixing**: Get help with bugs
- **Multi-Provider Support**: Use your preferred AI

---

## 🔧 Configuration

### Environment Variables
```bash
# AI Provider Keys
NEXUS_AI_KEY          Your API key
NEXUS_AI_PROVIDER     Provider (gemini, openai, anthropic, etc.)
NEXUS_AI_MODEL        Model name
```

### Config File
Settings are stored in `~/.nexus-ide/config.json`

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| **GitHub Repo** | https://github.com/TheStrongestOfTomorrow/Nexus-IDE |
| **Stable Branch** | `git clone -b stable https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git` |
| **Beta Branch** | `git clone -b main https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git` |
| **Professional Branch** | `git clone -b professional https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git` |
| **Report Issue** | https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues |

---

## 💖 Community & Contributing

Nexus IDE is an open-source project. Contributions are welcome! Check out our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

Nexus IDE is licensed under the [MIT License](LICENSE).

---

*Crafted with ❤️ for terminal lovers by Taz.*
