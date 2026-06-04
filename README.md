<div align="center">

# Nexus IDE

### A full-featured IDE that runs entirely in your browser.

**No downloads. No cloud dependency. Your data stays on your machine.**

[![Live Demo](https://img.shields.io/badge/Try_It_Now-GitHub_Pages-222222?style=for-the-badge&labelColor=1e293b&logo=github)](https://thestrongestoftomorrow.github.io/Nexus-IDE/)
[![Version](https://img.shields.io/badge/Version-5.5.6-3b82f6?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge&labelColor=1e293b)](LICENSE)

</div>

---

## Try It

**Just open this link** — no install, no account, no signup:

**[thestrongestoftomorrow.github.io/Nexus-IDE](https://thestrongestoftomorrow.github.io/Nexus-IDE/)**

That's it. You're coding.

---

## What Is This?

Nexus IDE is a browser-based code editor built for people who don't want to download a 300MB IDE. It runs entirely in your browser with zero server dependency — your files, your AI keys, your code all stay local.

It's not a toy editor. It has a real Linux terminal, AI assistance from 12 providers, collaboration, git integration, mobile support, and an extension marketplace. All in a browser tab.

---

## Quick Start

### Just Browse (fastest)
Open [thestrongestoftomorrow.github.io/Nexus-IDE](https://thestrongestoftomorrow.github.io/Nexus-IDE/) — no install needed. Some features (Linux terminal, WebContainer) require running locally.

### Run Locally (full features)
```bash
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
npm install
npm start
```
Opens at `http://localhost:3000` with COEP/COOP headers — v86 Linux and WebContainer work.

---

## Features

### Editor
- Monaco Editor (the same engine as VS Code)
- Split editor, minimap, word wrap, auto-close brackets
- Command palette (Ctrl+Shift+P)
- Diff editor for comparing changes
- File search across your project

### AI (12 Providers, 51 Tools)
- OpenAI, Anthropic, Google, xAI, Mistral, DeepSeek, Groq, Cohere, Perplexity, Alibaba, Together, Ollama
- 3 modes: Chat, Agent (executes tools), Prototyper (generates workspaces)
- AI can read/write files, run terminal commands, manage git, search the web, and more
- Real-time streaming responses
- Your API keys stay in your browser — no server proxy

### Linux Terminal
- Real Alpine Linux running in your browser via v86 x86 emulation
- Not a simulated terminal — it's an actual Linux distro
- Package manager, file system, networking — everything works
- Setup wizard for first-boot configuration
- Custom ISO/IMG upload (Windows, Ubuntu, etc.)
- File bridge between Nexus workspace and Linux filesystem

### WebContainer
- Run Node.js entirely in the browser
- `npm install` works — no server needed
- Requires SharedArrayBuffer (run locally for full support)

### Collaboration
- Real-time collaborative editing
- Password-protected sessions with SHA-256 hashing
- Host controls: kick participants, transfer host
- Session timeout and max participant limits

### Git & GitHub
- Full source control panel: staging, commits, branches, history
- GitHub integration via Device Flow or PAT
- Create issues, pull requests from inside the IDE
- AI can execute git commands through tools

### Mobile
- Portrait mode with bottom tab bar
- Landscape mode with split view
- Swipe gestures between tabs
- Touch-optimized for phones and tablets

### Themes
- Theme Studio with 21 customizable CSS variables
- 7 preset themes (One Dark Pro, Dracula, Solarized, GitHub Dark, etc.)
- Import/export themes as JSON
- Live preview

### More
- Workspace save/load to IndexedDB — survives page refresh
- Session persistence (auto-saves every 30 seconds)
- Extensions marketplace (OpenVSX)
- PWA — install as an app
- Zen mode and voice control
- Embeddable in other apps via Shadow DOM
- Android APK and Tauri desktop builds

---

## GitHub Pages vs Local

The live demo works great for most things. Some features need server headers that GitHub Pages can't provide:

| Feature | GitHub Pages | Local (`npm start`) |
|---------|:------------:|:-------------------:|
| Code Editor, AI, Git, Themes | Works | Works |
| Collaboration, Extensions, Mobile | Works | Works |
| v86 Linux Terminal | Hidden (needs SharedArrayBuffer) | Works |
| WebContainer (Node.js) | Hidden (needs SharedArrayBuffer) | Works |
| Server-side Terminal | Unavailable | Works |

On GitHub Pages, Linux terminal and WebContainer are automatically hidden from the UI. For the full experience, run locally.

---

## Deployment

See [EMBED_GUIDE.md](EMBED_GUIDE.md) for embedding Nexus in your app.

### GitHub Pages (automatic)
The repo deploys to GitHub Pages on every push to `main`. Just push and it's live.

### Docker
```bash
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
docker-compose up -d
```

### Cloud Platforms (Vercel, Railway, Render, Netlify)
Works out of the box. Add COEP/COOP headers for v86/WebContainer support:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Android
Download the APK from [Releases](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases) or build from source:
```bash
npm install && npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

### Tauri Desktop
```bash
npm run tauri:dev    # Development
npm run tauri:build  # Production (macOS, Windows, Linux)
```

---

## AI Providers

| Provider | Models | Runs Locally? |
|----------|--------|:------------:|
| OpenAI | GPT-4o, O1, O3 Mini | No |
| Anthropic | Claude Opus 4.8, Sonnet 4.6 | No |
| Google | Gemini 2.5 Pro, Flash | No |
| xAI | Grok 3, Grok 3 Fast | No |
| Mistral | Codestral, Large | No |
| DeepSeek | Coder, R1 | No |
| Groq | Llama 3.3 70B | No (free tier) |
| Cohere | Command R+ | No |
| Perplexity | Sonar Pro | No |
| Alibaba | Qwen Max, Coder | No |
| Together | Llama 3.3, Qwen 2.5 | No |
| Ollama | Llama, Mistral, DeepSeek | **Yes** |

---

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Active development — all PRs merge here |
| `beta` | Experimental features for power users |
| `cli` | Terminal-only TUI edition |
| `gh-pages` | Auto-deployed from `main`, don't edit directly |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, commit conventions, and how to add AI providers/tools.

---

<div align="center">

### Made by Taz

*Zero downloads. Zero cloud dependency. Just code.*

</div>
