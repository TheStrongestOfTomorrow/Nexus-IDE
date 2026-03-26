<div align="center">

# 🚀 Nexus IDE

<img src="https://lucide.dev/api/icons/zap?size=128&color=f59e4b" alt="Nexus IDE" width="128" height="128" />

### *The AI-First, Browser-Based IDE with WebContainer Power*

[![NPM Beta](https://img.shields.io/badge/NPM-Beta-f59e4b?style=for-the-badge&labelColor=1e293b&logo=npm)](https://www.npmjs.com/package/nexus-ide)
[![Version](https://img.shields.io/badge/Version-5.0.0-3b82f6?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![WebContainer](https://img.shields.io/badge/WebContainer-Enabled-10b981?style=for-the-badge&labelColor=1e293b)](https://webcontainers.io)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge&labelColor=1e293b)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-6366f1?style=for-the-badge&labelColor=1e293b&logo=github)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)

*A modern, high-performance IDE with AI integration, VS Code-like experience, and the power to run Node.js entirely in your browser.*

</div>

---

## ⚡ Quick Start

```bash
# Run the latest beta version instantly
npx nexus-ide@beta

# Or install globally
npm install -g nexus-ide@beta
nexus-ide
```

---

## 🔥 What's New in v5.0.0 - WebContainer Update

### 🌐 Run Node.js in Your Browser!
The biggest update yet! Nexus IDE now includes **WebContainer** support, powered by StackBlitz. Run full Node.js applications, install npm packages, and start dev servers - **all without a backend server!**

| Feature | Description |
|---------|-------------|
| **🚀 Full Node.js Runtime** | Run Node.js applications entirely in the browser |
| **📦 npm Install** | Install any npm package directly in browser |
| **🖥️ Dev Servers** | Start Vite, Next.js, React, Vue dev servers |
| **⚡ Instant Boot** | WebContainer boots in milliseconds |
| **🔒 Sandboxed** | Secure, isolated environment for your code |

### 🎯 How to Use WebContainer

1. Open Nexus IDE
2. Click **More Tools (⋯)** → **WebContainer**
3. Click **Boot** to start the container
4. Click **Mount Files** to load your project
5. Run commands like `npm install` and `npm run dev`
6. Your app runs at the preview URL!

### 🤖 AI Superpowers (Enhanced)
| Feature | Description |
|---------|-------------|
| **12+ Providers** | OpenAI, Claude, Gemini, Grok, DeepSeek, Ollama... |
| **Custom Instructions** | Fine-tune AI behavior |
| **/yes Mode** | AI builds, tests, deploys automatically |
| **Prototyper Mode** | Build entire apps from one prompt |

### 🧩 Extensions
| Feature | Description |
|---------|-------------|
| **OpenVSX Registry** | Browse & install extensions |
| **VSIX Support** | Upload local extensions |
| **Full Management** | Enable, disable, uninstall |

### 🎨 Experience
| Feature | Description |
|---------|-------------|
| **VS Code Feel** | Familiar interface |
| **Beginner UI** | Simplified for newcomers |
| **Working Templates** | Pre-configured setups |

---

## 🌿 All NPM Versions

| Version | Install Command | Description |
|---------|-----------------|-------------|
| **Stable** | `npx nexus-ide` or `npx nexus-ide@latest` | ✅ Production ready (v4.1) |
| **Beta (This)** | `npx nexus-ide@beta` | 🧪 Latest with WebContainer (v5.0) |
| **Professional** | `npx nexus-ide-professional` | 💼 CLI + Web dual mode |
| **CLI/TUI** | `npx nexus-ide-cli` | 🖥️ Terminal only |

---

## 🌐 WebContainer Features

### What You Can Do
```bash
# In the WebContainer terminal:
npm install lodash express react
npm run dev
npm run build
node server.js
```

### Supported Operations
| Operation | Status |
|-----------|--------|
| npm install | ✅ Full support |
| npm run dev | ✅ Vite, Next.js, React, Vue |
| npm run build | ✅ All major bundlers |
| node scripts | ✅ Run any Node.js code |
| File System | ✅ Full virtual FS |

### Technical Details
- **Powered by** StackBlitz WebContainer API
- **Requires** Cross-Origin Isolation (COOP/COEP headers)
- **Supports** SharedArrayBuffer for multi-threading
- **Works in** All modern browsers (Chrome, Firefox, Safari, Edge)

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
| Ollama | Llama, Mistral | Local |

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌐 **WebContainer** | Run Node.js in browser |
| 🎙️ **Voice Control** | Control IDE with speech |
| 🧘 **Zen Mode** | Distraction-free coding |
| 🎨 **Theme Studio** | Create custom themes |
| 📊 **Dependency Graph** | Visualize project deps |
| ☁️ **Cloud Bridge** | Real-time collaboration |
| 📱 **Mobile Ready** | Android (Termux) support |
| 🎮 **Minecraft Bridge** | Connect to Minecraft |

---

## 🚀 Deployment

### NPM
```bash
npx nexus-ide@beta --port 8080
```

### Docker
```bash
docker-compose up -d
```

### Vercel/Railway/Render
Connect GitHub → Auto-deploy

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| NPM | https://www.npmjs.com/package/nexus-ide |
| GitHub | https://github.com/TheStrongestOfTomorrow/Nexus-IDE |
| Issues | https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues |
| WebContainer Docs | https://webcontainers.io |
| **Install** | |
| Stable | `npx nexus-ide@latest` |
| Beta (w/ WebContainer) | `npx nexus-ide@beta` |
| Professional | `npx nexus-ide@pro` |
| CLI | `npx nexus-ide@cli` |

---

## 📝 Changelog

### v5.0.0 (Current - Beta)
- ✨ **WebContainer Integration** - Run Node.js in browser!
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

**v5.0.0 - WebContainer Edition**

</div>
