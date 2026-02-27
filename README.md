# 🚀 Nexus IDE v3.1 Beta

<p align="center">
  <img src="https://lucide.dev/api/icons/zap?size=64&color=3b82f6" alt="Nexus Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-3.1_Beta-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Status-Stable-emerald?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/AI-Powered-violet?style=for-the-badge" alt="AI" />
</p>

Welcome to **Nexus IDE v3.1 Beta**, the most powerful web-based development environment. Version 3.1 introduces major architectural shifts and "Pro" level features for serious developers.

## 🌈 What's New in v3.1 Beta
- **📁 Folder Preview Dashboard**: Click any folder in the explorer to see a dashboard of its contents and quick-run options.
- **📱 Touch Mode**: Toggle "Touch Friendly Mode" in settings for a mobile-optimized experience with larger targets.
- **🤖 Full Ollama Support**: Connect to local Ollama instances with configurable URLs and models.
- **🐚 Nexus Shell v3.1**:
    - **Python (Pyodide)**: Run Python files directly in the terminal using `python [file]`.
    - **NPM Simulation**: Run `npm run dev` in the terminal to trigger the preview server.
    - **Local Commands**: Support for `ls`, `clear`, and `help` within the browser shell.
- **📁 Full Folder Preview**: Preview entire directory structures with resolved relative paths and directory listings.
- **🤖 AI Composer v2**: Enhanced "Agent" and "Vibe" modes with multi-file generation and auto-approval.
- **🌐 Session-Based Self-Hosting**: Host your project live with a single click during your session.
- **⚡ Performance Boost**: Optimized Monaco Editor instance management and IndexedDB sync.
- **🎨 UI Refinement**: More "colorful" and intuitive interface with improved activity bars.

---

## 🛠️ Self-Hosting Instructions (Git/NPM)

If you are hosting Nexus IDE yourself, follow these steps to ensure the server points to the correct build folder:

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/nexus-ide.git
cd nexus-ide
npm install
```

### 2. Build the Frontend
```bash
npm run build
```

### 3. Start the Full-Stack Server
The server is configured to serve the `dist` folder in production mode.
```bash
# Development mode (with Vite middleware)
npm run dev

# Production mode
NODE_ENV=production npm start
```

---

## 📜 Update Logs

### 🟦 v3.1 Beta (Current)
- Added **Folder Preview Dashboard** for quick directory overview.
- Implemented **Touch Friendly Mode** for mobile/tablet optimization.
- Updated core dependencies to latest stable versions.
- Improved folder grouping in the File Explorer.

### 🟦 v3.0 Beta
- Added **Full Folder Preview** logic with directory listing fallback.
- Fixed AI Tab response parsing bugs for complex JSON.
- Updated README with colorful branding and shields.
- Improved terminal responsiveness and shell initialization.
- Added **Ollama** support placeholder for local AI models.

### 🟩 v2.9 Alpha
- Native File System Access (File System Access API).
- AI Ghost Text & Code Lens.
- Mermaid.js Architecture Analysis.
- Real-time Collaboration Sessions.

### 🟨 v2.5 Alpha
- Initial AI Assistant integration.
- Monaco Editor core implementation.
- Basic File System (LocalStorage).

---

## 🚀 Getting Started
1. Set your **API Keys** in Settings.
2. Open a **Local Folder** or use a **Template**.
3. Use **Cmd+Shift+P** for the Command Palette.
4. Click **Host Project Online** to share your work!

*Crafted with ❤️ for the next generation of developers.*
