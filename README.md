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

## 🚀 Nexus IDE v3.5 Standalone PWA

Nexus IDE is a fully standalone Progressive Web App (PWA) that works on both PC and Mobile. It also features deep GitHub integration for professional developers.

### 🌐 Live Access
Launch Nexus IDE directly in your browser:
**[Launch Nexus IDE](https://ais-dev-2ohtpjmveazkc6kl5yej3e-83785088393.asia-southeast1.run.app)**

### 📱 How to Install (Mobile & PC)
1.  **Open the link** above in your browser (Chrome, Edge, or Safari).
2.  **Install the App**:
    *   **On Android/Chrome**: Click the three dots and select **"Install App"** or **"Add to Home Screen"**.
    *   **On iOS/Safari**: Click the **Share** button and select **"Add to Home Screen"**.
    *   **On PC (Chrome/Edge)**: Click the **Install icon** in the address bar.
3.  **Use Offline**: Once installed, Nexus IDE will work even without an internet connection.

### 🐙 GitHub Integration
- **Connect**: Link your GitHub account to clone, commit, and push changes.
- **Native Builds**: Push with a version tag (e.g., `v3.5.0`) to trigger automatic builds for:
    - **Windows (.exe)**
    - **macOS (.dmg)**
    - **Linux (.deb)**
    - **Android (.apk)**

### 📁 Local-First Storage
- **IndexedDB**: All your files are stored safely in your browser's local database.
- **Privacy**: Your code never leaves your device unless you explicitly export or push it.
- **Instant Save**: Changes are saved automatically as you type.

---

## 🌈 What's New in v3.5
- **📦 Standalone PWA**: No GitHub or external accounts required.
- **⚡ Offline Mode**: Full service worker support for instant loading.
- **✨ Simplified UI**: Focused on coding, previewing, and AI assistance.
- **🤖 Local AI**: Support for **Ollama** allows you to run AI models entirely on your own machine.

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
