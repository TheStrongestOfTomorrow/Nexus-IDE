# 🖥️ Nexus IDE CLI - Terminal User Interface

<p align="center">
  <img src="https://lucide.dev/api/icons/terminal?size=64&color=3b82f6" alt="Nexus CLI Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-blue" alt="Version" />
  <img src="https://img.shields.io/badge/Platform-Terminal-green" alt="Platform" />
  <img src="https://img.shields.io/badge/Interface-TUI-magenta" alt="TUI" />
  <img src="https://img.shields.io/badge/Source-GitHub_Only-red" alt="GitHub Only" />
</p>

> **⚠️ GitHub Only Release** - This branch is NOT published to npm!

---

## 🎯 What is Nexus CLI?

Nexus IDE CLI is a **full Terminal User Interface (TUI)** version of Nexus IDE. Access all IDE features directly from your terminal with a beautiful, interactive interface.

---

## 🚀 Quick Start

```bash
# Run directly (no installation needed)
npx github:TheStrongestOfTomorrow/Nexus-IDE#cli

# Or install globally
npm install -g github:TheStrongestOfTomorrow/Nexus-IDE#cli
nexus
```

---

## ✨ Features

### 🖥️ Terminal User Interface
- **Interactive Menu System** - Navigate with arrow keys
- **File Browser** - Browse, view, edit, delete files
- **AI Chat Interface** - Chat with AI in terminal
- **Settings Panel** - Configure everything visually
- **Progress Indicators** - Spinners, progress bars, status messages

### 🤖 AI Integration
- **8+ AI Providers** - Gemini, OpenAI, Claude, xAI, Mistral, DeepSeek, Groq, Ollama
- **Quick AI Commands** - Ask questions, explain code, refactor
- **Interactive Chat** - Full conversation with AI
- **Code Analysis** - AI explains, refactors, generates tests

### 📁 File Management
- **Browse Files** - Navigate directories visually
- **View Files** - Read any file with syntax hints
- **Edit Files** - Opens in nano/vim
- **Create/Delete** - Full file operations

### ▶️ Code Execution
- **Run JavaScript/TypeScript** - Direct execution
- **Run Python** - Python script support
- **Run Shell Scripts** - Bash execution

### 🎨 Beautiful UI
- **Color-coded Output** - Easy to read
- **File Icons** - Visual file type indicators
- **Box Drawing** - Clean borders and panels
- **Responsive** - Adapts to terminal size

---

## 📖 Usage

### Launch TUI (Default)

```bash
nexus
```

### Quick Commands

```bash
# Start web IDE server
nexus start --port 8080

# Ask AI a question
nexus ai "How do I center a div?"

# View file
nexus cat src/App.tsx

# Edit file
nexus edit config.json

# Run code
nexus run main.ts

# List files
nexus ls src/

# View config
nexus config
```

---

## ⌨️ Keyboard Shortcuts

### Main Menu
| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate options |
| `1-8` | Quick select |
| `Enter` | Confirm selection |
| `Q` | Quit |

### File Browser
| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate files |
| `Enter` | Open file/folder |
| `E` | Edit file |
| `D` | Delete file |
| `N` | Create new file |
| `H` | Go to parent folder |
| `Q` | Back to menu |

### AI Chat
| Key | Action |
|-----|--------|
| `C` | Start chat |
| `H` | AI help |
| `Q` | Back to menu |

### Input Mode
| Key | Action |
|-----|--------|
| `Enter` | Submit |
| `Esc` | Cancel |
| `Backspace` | Delete character |

---

## 🤖 AI Providers

| Provider | Models | Get API Key |
|----------|--------|-------------|
| **Google Gemini** | gemini-2.5-pro, gemini-2.0-flash | [Get Key](https://makersuite.google.com/app/apikey) |
| **OpenAI** | gpt-4o, gpt-4o-mini, o1-preview | [Get Key](https://platform.openai.com/api-keys) |
| **Anthropic** | claude-opus-4, claude-sonnet-4 | [Get Key](https://console.anthropic.com/) |
| **xAI (Grok)** | grok-3, grok-2-vision | [Get Key](https://console.x.ai/) |
| **Mistral** | mistral-large, codestral | [Get Key](https://console.mistral.ai/) |
| **DeepSeek** | deepseek-chat, deepseek-coder | [Get Key](https://platform.deepseek.com/) |
| **Groq** | llama-3.3-70b, mixtral | [Get Key](https://console.groq.com/) |
| **Ollama** | llama3.2, mistral, codellama | Local - No key needed! |

---

## ⚙️ Configuration

### Set API Key

```bash
# Via TUI
nexus
# Go to Settings > API Key

# Via environment variable
export NEXUS_AI_KEY=your-api-key
export NEXUS_AI_PROVIDER=gemini
export NEXUS_AI_MODEL=gemini-2.0-flash
```

### Config File Location

```
~/.nexus-ide/config.json
```

### Example Config

```json
{
  "apiKey": "your-api-key",
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "workspace": "/path/to/project",
  "serverPort": 3000,
  "editor": "nano",
  "theme": "dark",
  "showHidden": false
}
```

---

## 📦 Installation Options

### Option 1: One-time Run (Recommended)

```bash
npx github:TheStrongestOfTomorrow/Nexus-IDE#cli
```

### Option 2: Global Install

```bash
npm install -g github:TheStrongestOfTomorrow/Nexus-IDE#cli
nexus
```

### Option 3: Clone & Run

```bash
git clone -b cli https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
npm install
node cli/nexus.js
```

---

## 🔗 Other Nexus IDE Versions

| Version | Install | Description |
|---------|---------|-------------|
| **Stable** | `npx nexus-ide` | Production-ready web IDE |
| **Beta** | `npx nexus-ide@beta` | Latest features web IDE |
| **CLI (This)** | `npx github:TheStrongestOfTomorrow/Nexus-IDE#cli` | Terminal User Interface |

---

## 🎮 Screenshots

### Main Menu
```
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
     ★ Terminal User Interface ★ GitHub Only ★

Welcome to Nexus IDE TUI

Version 2.0 • GitHub Only

  → 🚀 1. Start Web IDE Server
    📁 2. File Browser
    🤖 3. AI Assistant
    ▶️ 4. Run Code
    📚 5. Git Status
    ⚙️ 6. Settings
    ❓ 7. Help
    🚪 8. Exit
```

### File Browser
```
📁 File Browser

Path: /home/user/my-project

  → 📁 src
    📁 public
    📄 package.json  1.2KB
    📄 README.md     3.4KB
    📄 tsconfig.json 512B
    🔐 .env          128B

────────────────────────────────────────
↑↓ Navigate • Enter Open • E Edit • D Delete • N New • H Back • Q Quit
```

---

## 🔧 Requirements

- **Node.js** >= 18.0.0
- **Terminal** with ANSI color support
- **Optional**: `nano` or `vim` for file editing

---

## 🐛 Known Issues

- Some terminals may not support all ANSI colors
- Large files may cause rendering issues
- Windows terminals may have limited Unicode support

---

## 📄 License

MIT License - See [LICENSE](LICENSE)

---

## 🔗 Links

- **Main Repository:** [GitHub](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
- **Issues:** [Report Bug](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues)
- **Stable Version:** `npx nexus-ide`
- **Beta Version:** `npx nexus-ide@beta`

---

<p align="center">
  <strong>Crafted with ❤️ for terminal lovers by Taz</strong>
</p>
