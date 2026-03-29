<div align="center">

# 🖥️ Nexus IDE - Terminal Edition

<img src="https://lucide.dev/api/icons/terminal-square?size=128&color=3b82f6" alt="Nexus IDE Terminal" width="128" height="128" />

### *A Complete IDE in Your Terminal — No Browser Needed*

[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-CLI-3b82f6?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/packages)
[![Version](https://img.shields.io/badge/Version-5.0.2-3b82f6?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge&labelColor=1e293b)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-6366f1?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)

*A fully standalone terminal IDE built with blessed.js — file explorer, code editor, AI assistant, terminal, and more. Everything runs right in your terminal. No browser. No GUI. Pure terminal.*

</div>

---

## ⚡ Quick Start

```bash
# Run the terminal IDE instantly (no install needed)
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

This is a **standalone TUI** — it runs directly in your terminal. Using `npm run dev` starts the web server, which is NOT the terminal interface!

### ✅ Correct Usage

```bash
# After cloning the repo
git clone -b cli https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
npm install

# Run the full TUI
npm run tui
# OR
node cli/nexus.js
# OR
nexus
```

---

## 🖥️ What It Looks Like

```
┌─ NEXUS IDE - TUI ─────────────────────────────────────┐
│ Files          │ Editor - main.js    │ AI Assistant    │
│                │                     │                 │
│ 📁 ../         │ import express from │ You:            │
│ 📁 src/        │ 'express';          │ How do I set    │
│ 📁 public/     │                     │ up a REST API?  │
│ 📄 index.js    │ const app = expr    │                 │
│ 📄 package.json│ ess();              │ AI: Here's how  │
│ 📄 README.md   │                     │ to create a     │
│                │ app.get('/', (req   │ basic Express   │
│                │ , res) => {         │ server with     │
│                │   res.send('Hel     │ routing...      │
├────────────────┴─────────────────────┴─────────────────┤
│ Terminal: $ npm test                                    │
│ > nexus-ide-cli@5.0.2 test                             │
│ All tests passed ✓                                      │
├─────────────────────────────────────────────────────────┤
│ [Files] [Editor] [AI] [Terminal] | main.js | Node.js   │
└─────────────────────────────────────────────────────────┘
```

---

## 🌟 Full Feature List

This is a **complete, standalone terminal IDE** — not a wrapper around the web version. Everything runs natively in your terminal using blessed.js.

### 🎯 Core IDE

| Feature | Description |
|---------|-------------|
| 📁 **File Explorer** | Full directory navigation with keyboard, go up/open dirs, create/rename/delete files |
| ✏️ **Code Editor** | Built-in text editor with syntax-aware editing, open multiple files in tabs |
| 📑 **Tab Support** | Open multiple files simultaneously, switch between tabs |
| 💾 **Save / New File** | Create new files and save changes directly from the editor |
| 📂 **Directory Navigation** | Browse any directory on your system, full path tracking |
| 🔍 **Command Palette** | `Ctrl+K` to open command palette with quick actions |

### 💻 Integrated Terminal

| Feature | Description |
|---------|-------------|
| ⌨️ **Built-in Shell** | Full terminal emulator running inside the TUI |
| ▶️ **Code Execution** | Run `.js`, `.py`, `.sh`, `.rb`, and more directly from the editor |
| 🔧 **Command Output** | See stdout/stderr in the terminal panel with color-coded output |
| 🔄 **Toggle Panel** | Show/hide the terminal with `Ctrl+T` |

### 🤖 AI Assistant

| Feature | Description |
|---------|-------------|
| 💬 **In-Terminal AI Chat** | Chat with AI providers directly in the TUI without leaving |
| 🔀 **12+ Providers** | OpenAI, Anthropic, Google, xAI, Mistral, DeepSeek, Groq, Cohere, Perplexity, Alibaba, Together, Ollama |
| 🎯 **AI Commands** | `/help`, `/provider`, `/model`, `/clear`, `/code <prompt>`, `/explain`, `/fix` |
| 🔄 **Provider Switching** | Switch between AI providers and models on the fly |
| 💡 **Code Generation** | Generate code, explain files, fix errors — all from the terminal |

### 🧩 Extensions

| Feature | Description |
|---------|-------------|
| 📦 **Extension Browser** | Browse available extensions without leaving the TUI |
| ⚡ **Quick Install** | Install and manage extensions from the extension panel |

---

## ⌨️ Keyboard Shortcuts

### Global

| Key | Action |
|:---:|--------|
| `Ctrl+K` | Open command palette |
| `Ctrl+S` | Save current file |
| `Ctrl+R` | Run current file |
| `Ctrl+T` | Toggle terminal panel |
| `Ctrl+A` | Toggle AI assistant |
| `Ctrl+E` | Toggle extensions panel |
| `Ctrl+?` | Show help |
| `Ctrl+Q` | Quit |
| `Tab` | Cycle focus: Files → Editor → AI |
| `Esc` / `Q` | Back / Close panel / Quit |

### Command Palette Actions

| Key | Action |
|:---:|--------|
| `N` | New file |
| `O` | Open file |
| `S` | Save file |
| `W` | Close tab |
| `F` | Find in file |
| `R` | Run code |
| `T` | Toggle terminal |
| `E` | Extensions |
| `A` | AI assistant |
| `P` | Projects |
| `G` | Git info |
| `?` | Help |
| `Q` | Quit |

---

## 🤖 AI Providers

| Provider | Models | Type |
|----------|--------|------|
| OpenAI | GPT-4o, GPT-4o Mini, O1, O3 Mini | Cloud |
| Anthropic | Claude Opus 4, Claude Sonnet 4, Claude 3.5 | Cloud |
| Google Gemini | Gemini 2.5 Pro, Gemini 2.0 Flash | Cloud |
| xAI (Grok) | Grok 3, Grok 3 Fast, Grok 2 Vision | Cloud |
| Mistral | Mistral Large, Codestral, Pixtral | Cloud |
| DeepSeek | DeepSeek Chat, DeepSeek Coder, DeepSeek R1 | Cloud |
| Alibaba Qwen | Qwen Max, Qwen Coder Plus | Cloud |
| Groq | Llama 3.3 70B, Mixtral | Cloud (Free) |
| Cohere | Command R+, Command R | Cloud |
| Perplexity | Sonar Pro, Sonar Reasoning | Cloud |
| Together AI | Llama 3.3, Mistral, Qwen | Cloud |
| Ollama | Llama 3.2, Mistral, Code Llama | Local |

---

## 🌿 All Versions

| Version | Branch | Install Command | Description |
|---------|--------|-----------------|-------------|
| **Stable** | `stable` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@stable` | ✅ Production ready (v4.4) |
| **Beta** | `main` | `npx github:TheStrongestOfTomorrow/Nexus-IDE@main` | 🧪 Latest with WebContainer (v5.1) |
| **Professional** | `professional` | `npx github:TheStrongestOfTomorrow/Nexus-IDE#professional` | 💼 Beta features + enterprise exclusives |
| **CLI/TUI (This)** | `cli` | `npx github:TheStrongestOfTomorrow/Nexus-IDE#cli` | 🖥️ Full standalone terminal IDE |

---

## 🎯 Use Cases

- 🖥️ **SSH Development** — Full IDE over SSH, no X11 needed
- ☁️ **Server Admin** — Edit configs, run scripts on remote servers
- 📱 **Low Resources** — Lightweight, runs on anything with a terminal
- ⌨️ **Keyboard Lovers** — 100% keyboard-driven, zero mouse required
- 🐧 **Linux/WSL** — Native terminal experience
- 🔧 **Headless Servers** — Use the AI assistant to code on machines with no GUI
- 🚀 **Quick Edits** — Faster than opening a full IDE for small changes

---

## 🔧 Configuration

### Set AI Provider
```bash
# Use environment variables:
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
