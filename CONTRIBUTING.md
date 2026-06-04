<div align="center">

# Contributing to Nexus IDE

<img src="https://lucide.dev/api/icons/git-pull-request?size=96&color=f59e0b" alt="Contributing" width="96" height="96" />

### *Build the Future of IDEs with Us*

[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-10b981?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/pulls)

</div>

---

## Quick Start

```bash
# 1. Fork & Clone
git clone https://github.com/YOUR_USERNAME/Nexus-IDE.git
cd Nexus-IDE

# 2. Install Dependencies
npm install --legacy-peer-deps

# 3. Start Development Server
npm run dev
# Opens at http://localhost:3000 with COEP/COOP headers (v86 + WebContainer work)

# 4. Create a Branch
git checkout -b feature/my-feature

# 5. Make Changes & Test
npm run build    # Verify production build works

# 6. Commit & Push
git commit -m "feat: my awesome feature"
git push origin feature/my-feature

# 7. Open a Pull Request
```

---

## Ways to Contribute

| Type | Description | How |
|------|-------------|-----|
| Bug Fixes | Fix issues | Check [Issues](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues), label `bug` |
| Features | Add functionality | Open an issue first to discuss, then PR |
| AI Providers | Add a new AI provider | See below |
| AI Tools | Add a new AI tool | See below |
| UI/UX | Design improvements | Screenshots or Figma links in issue |
| Documentation | Improve docs | Fix inaccuracies, add examples |

---

## Branch Guide

| Branch | Purpose |
|--------|---------|
| `main` | Active development — all PRs merge here |
| `gh-pages` | Auto-deployed from `main`, do not edit directly |
| `cli` | Terminal-only edition |

> **Note:** The `stable`, `professional`, and `master` branches are legacy and should not be used.

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Example |
|------|---------|
| `feat` | `feat: add Gemini 3.0 model support` |
| `fix` | `fix: terminal resize crash on mobile` |
| `docs` | `docs: update contributing guide` |
| `style` | `style: fix sidebar padding` |
| `refactor` | `refactor: extract file tree from useFileSystem` |
| `test` | `test: add aiToolService unit tests` |
| `chore` | `chore: update dependencies` |

---

## Project Structure

```
Nexus-IDE/
├── src/
│   ├── components/          # React UI components
│   │   ├── AIAssistant.tsx  # AI chat, agent, prototyper modes
│   │   ├── Editor.tsx       # Monaco editor wrapper
│   │   ├── LinuxTerminal.tsx # v86 x86 emulator UI
│   │   ├── CollaborationView.tsx # Real-time collab
│   │   ├── GithubView.tsx   # Git/GitHub integration
│   │   ├── SettingsPanel.tsx # Settings with 9 categories
│   │   └── ...              # 30+ more components
│   ├── services/            # Business logic
│   │   ├── aiProviderService.ts  # 14 AI providers
│   │   ├── aiToolService.ts      # 51 AI tools
│   │   ├── v86Service.ts         # v86 emulator management
│   │   ├── webcontainerService.ts # Node.js in browser
│   │   ├── socketService.ts      # WebSocket collaboration
│   │   ├── gitService.ts         # Git operations
│   │   ├── githubService.ts      # GitHub API
│   │   └── ...
│   ├── hooks/               # React hooks
│   │   ├── useFileSystem.ts # File management + IndexedDB
│   │   ├── useIDEState.ts   # Global IDE state (Zustand-like)
│   │   ├── usePWA.ts        # PWA registration
│   │   └── useWindow.ts     # Window management
│   ├── config/
│   │   └── models.ts        # AI model definitions
│   └── embed.tsx            # Embeddable web component build
├── public/
│   ├── v86/                 # v86 BIOS + Linux kernel (~5MB)
│   ├── sw.js                # Service worker
│   └── manifest.json        # PWA manifest
├── .github/workflows/       # CI/CD
│   ├── gh-pages.yml         # Deploy to GitHub Pages
│   ├── android.yml          # Build Android APK
│   ├── release.yml          # Desktop + mobile releases
│   └── publish.yml          # npm package publish
├── server.ts                # Express + Vite dev server
├── vite.config.ts           # Build configuration
└── src-tauri/               # Tauri desktop app (Rust)
```

---

## Adding an AI Provider

1. Add the model IDs in `src/config/models.ts`
2. Add the provider config and API endpoint in `src/services/aiProviderService.ts`
3. Add tool format conversion (if not OpenAI-compatible) in `src/services/aiToolService.ts`
4. Update the AI provider selector in `src/components/AIAssistant.tsx`
5. Update the settings panel in `src/components/SettingsPanel.tsx`
6. Update the README provider table
7. Test with your API key

---

## Adding an AI Tool

1. Define the tool in `src/services/aiToolService.ts` — add to the appropriate category array (`FILE_TOOLS`, `GIT_TOOLS`, `GITHUB_TOOLS`, etc.)
2. Implement the tool execution handler in `src/components/AIAssistant.tsx` — find the `switch (toolCall.name)` block
3. Add the tool format conversion for each provider format in `src/services/aiToolService.ts` (`toOpenAITools`, `toAnthropicTools`, `toGeminiTools`, `toOllamaTools`)
4. Test: ask the AI to use your tool in chat mode

---

## GitHub Pages Compatibility

Not all features work on static hosting. When adding a new feature, consider:

| Requirement | Works on GH Pages? | How to Handle |
|-------------|-------------------|---------------|
| Standard browser APIs | Yes | No special handling |
| `SharedArrayBuffer` | No (needs COEP/COOP headers) | Gate behind `V86Service.isSupported()` / `webcontainerService.isSupported()` |
| WebSocket server | No (static site) | Use WebRTC P2P or external relay |
| File System Access API | Chromium only | Feature-detect and show friendly message |
| Server-side execution | No | Use WebContainer or Pyodide in browser |

---

## PR Checklist

Before submitting:

- [ ] Code compiles: `npm run build`
- [ ] No TypeScript errors in your changed files
- [ ] Tested locally: `npm run dev`
- [ ] Commit messages follow convention
- [ ] PR description explains what and why

---

## Useful Links

| Resource | Link |
|----------|------|
| Issues | [Open Issues](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues) |
| Discussions | [GitHub Discussions](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/discussions) |
| Live Demo | [GitHub Pages](https://thestrongestoftomorrow.github.io/Nexus-IDE/) |
