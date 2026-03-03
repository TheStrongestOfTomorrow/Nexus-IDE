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

## 🚀 Nexus IDE v3.5 Standalone Edition

Nexus IDE is now ready for production as a standalone application across all platforms.

### 📱 Mobile (Android/iOS)
- **PWA (Instant App)**: Open Nexus IDE in your mobile browser (Chrome/Safari) and select **"Add to Home Screen"** or **"Install App"**. It will work offline and feel like a native app.
- **Native APK**: Use the provided GitHub Action to build a native Android APK automatically.

### 💻 Desktop (Windows/Mac/Linux)
- **Standalone App**: Nexus IDE is configured for **Tauri**. When you push your code to GitHub with a version tag (e.g., `v3.5.0`), GitHub Actions will automatically build:
    - `.exe` for Windows
    - `.dmg` for macOS
    - `.deb` / `.AppImage` for Linux
- You can download these from your repository's **Releases** page.

### 🛠️ How to Build Your Own Apps (Free)
1.  **Push to GitHub**: Upload this project to a new GitHub repository.
2.  **Create a Release**: Go to "Releases" -> "Draft a new release".
3.  **Tag it**: Give it a tag like `v3.5.0`.
4.  **Wait**: GitHub Actions will start building your apps for all platforms.
5.  **Download**: Once finished, the files will appear in the release.

---

## 🌈 What's New in v3.5
- **📦 Multi-Platform Support**: Ready for PWA, Android, Windows, Mac, and Linux.
- **⚡ Offline Mode**: Service Worker integration for instant loading without internet.
- **✨ Simplified UI**: Cleaner Activity Bar with "More Tools" menu.
- **🤖 Expanded AI Providers**: Native support for **Groq**, **Deepseek**, and enhanced **Ollama**.

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
