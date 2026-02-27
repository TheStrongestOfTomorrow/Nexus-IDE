# 🚀 Nexus IDE v3.2 Beta

<p align="center">
  <img src="https://lucide.dev/api/icons/zap?size=64&color=3b82f6" alt="Nexus Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-3.2_Beta-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Status-Stable-emerald?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/AI-Powered-violet?style=for-the-badge" alt="AI" />
</p>

Welcome to **Nexus IDE v3.2 Beta**, the most powerful web-based development environment. Version 3.2 focuses on UI simplification, Termux/Android compatibility, and expanded AI capabilities.

## 🌈 What's New in v3.2 Beta
- **✨ Simplified UI**: Cleaner Activity Bar with "More Tools" menu and streamlined Status Bar.
- **📱 Termux Compatibility**: Removed problematic native dependencies (`better-sqlite3`) to ensure smooth installation on Android/Termux.
- **🤖 Expanded AI Providers**: Native support for **Groq**, **Deepseek**, and enhanced **Ollama** integration.
- **📁 Folder Preview Dashboard**: Click any folder in the explorer to see a dashboard of its contents and quick-run options.
- **📱 Touch Mode**: Toggle "Touch Friendly Mode" in settings for a mobile-optimized experience.
- **🐚 Nexus Shell v3.1**: Run Python (Pyodide) and NPM commands directly in the browser.

---

## 🛠️ Self-Hosting Instructions (Git/NPM)

If you are hosting Nexus IDE yourself, follow these steps:

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/nexus-ide.git
cd nexus-ide
npm install
```

### 2. Build & Start
```bash
npm run build
NODE_ENV=production npm start
```

---

## 📜 Update Logs

### 🟦 v3.2 Beta (Current)
- Simplified UI with grouped Activity Bar items.
- Fixed Termux build errors by removing native SQLite dependencies.
- Added **Groq** and **Deepseek** AI providers.
- Streamlined Status Bar for a cleaner look.

### 🟦 v3.1 Beta
- Added **Folder Preview Dashboard** for quick directory overview.
- Implemented **Touch Friendly Mode** for mobile/tablet optimization.
- Added **Ollama** support with configurable URLs.
- Introduced **Nexus Shell** with Python (Pyodide) support.

### 🟦 v3.0 Beta
- Added **Full Folder Preview** logic with directory listing fallback.
- Fixed AI Tab response parsing bugs.
- Updated README with colorful branding.

---

## 🚀 Getting Started
1. Set your **API Keys** in Settings.
2. Open a **Local Folder** or use a **Template**.
3. Use **Cmd+Shift+P** for the Command Palette.

*Crafted with ❤️ for the next generation of developers.*
