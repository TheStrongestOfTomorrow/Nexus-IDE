# 🖥️ Nexus IDE CLI - Terminal-Based IDE

> **GitHub Only Release** - Not on npm (yet!)

<p align="center">
  <img src="https://lucide.dev/api/icons/terminal?size=64&color=3b82f6" alt="Nexus CLI Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue" alt="Version" />
  <img src="https://img.shields.io/badge/Platform-Terminal-green" alt="Platform" />
  <img src="https://img.shields.io/badge/AI-Powered-magenta" alt="AI" />
</p>

---

## 🚀 Quick Start

### Install from GitHub

```bash
# Run directly (recommended)
npx github:TheStrongestOfTomorrow/Nexus-IDE#cli

# Or install globally
npm install -g github:TheStrongestOfTomorrow/Nexus-IDE#cli
```

### Start Interactive Mode

```bash
nexus
```

---

## 📖 Commands

### 🌐 IDE & Server

| Command | Description |
|---------|-------------|
| `nexus` | Start interactive menu |
| `nexus start` | Start web IDE server |
| `nexus server` | Start web IDE server |
| `nexus start --port 8080` | Server on custom port |
| `nexus open` | Open IDE in browser |

### 🤖 AI Assistant

| Command | Description |
|---------|-------------|
| `nexus ai "your prompt"` | Ask AI a question |
| `nexus chat` | Interactive AI chat |
| `nexus explain <file>` | AI explains code |
| `nexus refactor <file>` | AI refactors code |
| `nexus test <file>` | AI generates tests |
| `nexus docs <file>` | AI generates documentation |

### 📁 File Operations

| Command | Description |
|---------|-------------|
| `nexus ls [path]` | List files |
| `nexus cat <file>` | View file content |
| `nexus edit <file>` | Edit file in terminal |
| `nexus create <file>` | Create new file |
| `nexus rm <file>` | Delete file |
| `nexus mkdir <path>` | Create directory |

### ▶️ Code Execution

| Command | Description |
|---------|-------------|
| `nexus run <file>` | Execute code file |
| `nexus repl` | Start REPL |
| `nexus test` | Run tests |

### 📦 Project

| Command | Description |
|---------|-------------|
| `nexus init [name]` | Initialize new project |
| `nexus info` | Show project info |
| `nexus deps` | Manage dependencies |
| `nexus build` | Build project |

### 🔧 Configuration

| Command | Description |
|---------|-------------|
| `nexus config` | Show/edit configuration |
| `nexus keys` | Manage API keys |
| `nexus help` | Show help |
| `nexus version` | Show version |

---

## ⚙️ Configuration

### Set AI Provider

```bash
nexus config
# Follow the prompts
```

### Environment Variables

```bash
export NEXUS_AI_KEY=your_api_key
export NEXUS_AI_PROVIDER=gemini  # or openai, anthropic
export NEXUS_AI_MODEL=gemini-2.0-flash
```

### Config File

Config is stored at: `~/.nexus-ide/config.json`

```json
{
  "apiKey": "your-api-key",
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "workspace": "/path/to/project"
}
```

---

## 🎮 Interactive Mode

Just run `nexus` without arguments:

```
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝

★ Terminal IDE • AI-Powered • GitHub Only ★

What would you like to do?

  1. Start Web IDE Server
  2. Open AI Chat
  3. Browse Files
  4. Run Code
  5. Edit File
  6. Project Info
  7. Git Status
  8. Settings
  9. Exit
```

---

## 🤖 Supported AI Providers

| Provider | Models |
|----------|--------|
| **Google Gemini** | gemini-2.0-flash, gemini-1.5-pro |
| **OpenAI** | gpt-4o, gpt-4o-mini, o1-preview |
| **Anthropic** | claude-opus-4, claude-sonnet-4 |
| **xAI** | grok-3, grok-2-vision |
| **Mistral** | mistral-large, codestral |
| **DeepSeek** | deepseek-chat, deepseek-coder |
| **Groq** | llama-3.3-70b, mixtral |
| **Ollama** | llama3.2, mistral, codellama |

---

## 📝 Examples

### Start IDE Server

```bash
nexus start --port 8080
```

### Ask AI

```bash
nexus ai "How do I center a div in CSS?"
nexus ai "Write a function to sort an array"
nexus ai "Debug this error: TypeError: Cannot read property 'x' of undefined"
```

### AI Chat

```bash
nexus chat
# Interactive conversation with AI
```

### Edit File

```bash
nexus edit src/App.tsx
# Opens in nano/vim
```

### Run Code

```bash
nexus run main.ts
nexus run script.py
nexus run app.js
```

### Explain Code

```bash
nexus explain complex-algorithm.ts
```

---

## 🔌 Run Web IDE

The CLI can also start the full web-based IDE:

```bash
nexus start
# Open http://localhost:3000 in browser
```

---

## 📦 Installation Options

### Option 1: One-time Run (No Install)

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

## 🔧 Requirements

- **Node.js** >= 18.0.0
- **npm** or **pnpm** or **yarn**

---

## 📄 License

MIT License - See [LICENSE](LICENSE)

---

## 🔗 Links

- **Main IDE (npm):** `npx nexus-ide`
- **CLI (GitHub only):** `npx github:TheStrongestOfTomorrow/Nexus-IDE#cli`
- **Repository:** [GitHub](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
- **Issues:** [Report Bug](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues)

---

*Crafted with ❤️ for terminal lovers by Taz*
