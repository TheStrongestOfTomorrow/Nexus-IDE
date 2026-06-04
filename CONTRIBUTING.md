# Contributing to Nexus IDE

Thanks for checking this out. Here's how to get set up and contribute.

---

## Quick Start

```bash
# 1. Fork & Clone
git clone https://github.com/YOUR_USERNAME/Nexus-IDE.git
cd Nexus-IDE

# 2. Install Dependencies
npm install --legacy-peer-deps

# 3. Start Development Server
npm start
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

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Active development — all PRs merge here |
| `beta` | Experimental features for power users |
| `cli` | Terminal-only TUI edition |
| `gh-pages` | Auto-deployed from `main`, don't edit directly |

---

## Ways to Contribute

- **Bug fixes** — Check [Issues](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues), look for `bug` label
- **Features** — Open an issue first to discuss, then submit a PR
- **AI providers** — Add a new provider (see below)
- **AI tools** — Add a new tool for the AI agent (see below)
- **UI/UX** — Screenshots or mockups in an issue
- **Docs** — Fix inaccuracies, add examples, improve clarity

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

## Adding an AI Provider

1. Add model IDs in `src/config/models.ts`
2. Add provider config and API endpoint in `src/services/aiProviderService.ts`
3. Add tool format conversion (if not OpenAI-compatible) in `src/services/aiToolService.ts`
4. Update the provider selector in `src/components/AIAssistant.tsx`
5. Update the settings panel in `src/components/SettingsPanel.tsx`
6. Update the README provider table
7. Test with your API key

---

## Adding an AI Tool

1. Define the tool in `src/services/aiToolService.ts` — add to the appropriate category array (`FILE_TOOLS`, `GIT_TOOLS`, `GITHUB_TOOLS`, etc.)
2. Implement the handler in `src/components/AIAssistant.tsx` — find the `switch (toolCall.name)` block
3. Add format conversion for each provider in `src/services/aiToolService.ts` (`toOpenAITools`, `toAnthropicTools`, `toGeminiTools`, `toOllamaTools`)
4. Test: ask the AI to use your tool in chat mode

---

## GitHub Pages Compatibility

When adding a feature, consider whether it works on static hosting:

| Requirement | Works on GH Pages? | How to Handle |
|-------------|-------------------|---------------|
| Standard browser APIs | Yes | No special handling |
| `SharedArrayBuffer` | No (needs COEP/COOP) | Gate behind `V86Service.isSupported()` or `webcontainerService.isSupported()` |
| WebSocket server | No (static site) | Use WebRTC P2P or external relay |
| File System Access API | Chromium only | Feature-detect and show friendly message |
| Server-side execution | No | Use WebContainer or Pyodide in browser |

---

## PR Checklist

Before submitting:

- [ ] Code compiles: `npm run build`
- [ ] No TypeScript errors in your changed files
- [ ] Tested locally: `npm start`
- [ ] Commit messages follow convention
- [ ] PR description explains what and why
