<div align="center">

# 🤝 Contributing to Nexus IDE

<img src="https://lucide.dev/api/icons/git-pull-request?size=96&color=f59e0b" alt="Contributing" width="96" height="96" />

### *Build the Future of IDEs with Us*

[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-10b981?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/pulls)
[![Good First Issue](https://img.shields.io/badge/Good%20First%20Issue-Available-3b82f6?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
[![Discord](https://img.shields.io/badge/Discord-Join-5865f2?style=for-the-badge&labelColor=1e293b&logo=discord)](https://discord.gg/nexus-ide)

</div>

---

## 🚀 Quick Start

```bash
# 1. Fork & Clone
git clone https://github.com/YOUR_USERNAME/Nexus-IDE.git
cd Nexus-IDE

# 2. Install Dependencies
npm install

# 3. Start Development
npm run dev

# 4. Create Branch
git checkout -b feature/my-feature

# 5. Make Changes & Test
# Your awesome changes here...

# 6. Commit & Push
git commit -m "feat: my awesome feature"
git push origin feature/my-feature

# 7. Open Pull Request 🎉
```

---

## 🎯 Ways to Contribute

| Type | Description | Labels |
|------|-------------|--------|
| 🐛 **Bug Fixes** | Fix issues | `bug` |
| ✨ **Features** | Add functionality | `enhancement` |
| 📝 **Docs** | Improve documentation | `documentation` |
| 🎨 **UI/UX** | Design improvements | `ui` |
| 🌐 **i18n** | Translations | `translation` |
| 🧪 **Tests** | Write tests | `testing` |

---

## 📋 Branch Guide

| Branch | Purpose | Merge To |
|--------|---------|----------|
| `main` | Beta release | - |
| `stable` | Production | `main` → `stable` |
| `cli` | Terminal IDE | `main` → `cli` |
| `professional` | Office edition | `main` → `professional` |

---

## 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Example |
|------|---------|
| `feat` | `feat: Add AI provider` |
| `fix` | `fix: Terminal resize bug` |
| `docs` | `docs: Update README` |
| `style` | `style: Format code` |
| `refactor` | `refactor: Clean up AI service` |
| `test` | `test: Add unit tests` |
| `chore` | `chore: Update deps` |

---

## ✅ PR Checklist

Before submitting, ensure:

- [ ] ✅ Code compiles (`npm run build`)
- [ ] ✅ No TypeScript errors (`npm run lint`)
- [ ] ✅ Tested locally (`npm run dev`)
- [ ] ✅ Updated documentation
- [ ] ✅ Descriptive commit messages
- [ ] ✅ PR description explains changes

---

## 🏗️ Project Structure

```
Nexus-IDE/
├── src/              # React components
│   ├── components/   # UI components
│   ├── constants/    # Config & models
│   └── services/     # AI providers
├── cli/              # Terminal IDE
│   ├── nexus.js      # CLI entry
│   └── tui/          # TUI interface
├── bin/              # NPM binaries
├── server.ts         # Express server
└── vite.config.ts    # Build config
```

---

## 🤖 Adding AI Providers

1. Add model constants in `src/constants/models.ts`
2. Add provider config in `src/services/aiProviderService.ts`
3. Update README with provider info
4. Test with your API key

---

## 🔗 Useful Links

| Resource | Link |
|----------|------|
| Issues | [Open Issues](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues) |
| Discussions | [GitHub Discussions](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/discussions) |
| NPM | [nexus-ide](https://www.npmjs.com/package/nexus-ide) |

---

## 💡 Tips

- Start with `good first issue` labels
- Ask questions in discussions
- Run `npm run lint` before committing
- Keep PRs focused and small

---

<div align="center">

### Thank You for Contributing! 🙏

*Every contribution makes Nexus IDE better*

</div>
