# 🚀 Nexus IDE v4.3 Mega-Upgrade

<p align="center">
  <img src="https://lucide.dev/api/icons/zap?size=64&color=3b82f6" alt="Nexus Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-4.3.0-blue" alt="Version 4.3.0" />
  <img src="https://img.shields.io/badge/Status-Production_Ready-green" alt="Status" />
  <img src="https://img.shields.io/badge/Performance-5x_Faster-orange" alt="Performance" />
  <img src="https://img.shields.io/badge/Privacy-First-blueviolet" alt="Privacy" />
</p>

Nexus IDE is a modern, high-performance, browser-based IDE designed for the next generation of developers. Optimized for both desktop and mobile (Termux), it brings the power of VS Code with a simplified, AI-first experience.

---

## 🎯 What's New in v4.3

### 🎙️ Nexus Voice (New!)
Control your IDE with your voice. Click the microphone icon in the Title Bar to start.
*   **"Run Code"**: Executes the current file.
*   **"Open Settings"**: Opens the settings panel.
*   **"Toggle Terminal"**: Shows/hides the terminal.
*   **"Clear Workspace"**: Wiped files safely with a prompt.

### 🧘 Zen Mode
Focus on what matters—your code. Click the Eye icon in the Title Bar to hide all sidebars and terminals instantly.

### 🎨 Theme Studio & Visualization
*   **Theme Studio**: Create custom color vibes for your IDE.
*   **Dependency Graph**: Visual breakdown of your project's `package.json`.
*   **Project Insights**: Stats on lines of code (LOC), file types, and languages.

### ☁️ Nexus Cloud Bridge
Real-time collaboration now works everywhere! We've implemented a fallback signaling server so **Collaboration Bridge** works even when hosted on static platforms like GitHub Pages.

---

## 🚀 Deployment & Releases

### 📱 Android Release (APK)
Nexus IDE is fully optimized for Android. Check the [Actions tab](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/actions) to download the latest automated APK build.

### 💻 Desktop Releases (Windows, macOS, Linux)
Powered by **Tauri**, Nexus IDE is available as a lightweight native desktop application. Downloads are available in the GitHub Releases section.

### 🌐 Web Hosting (GitHub Pages)
v4.3 is fully compatible with GitHub Pages. AI features use direct browser-to-API calls, and collaboration uses the Nexus Cloud signaling bridge.

---

## 🔧 Local Development

1. **Clone and Install:**
   ```bash
   git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
   cd Nexus-IDE
   npm install
   ```

2. **Configure Auth:**
   Create a `.env` file with your `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

3. **Run:**
   ```bash
   npm run dev
   ```

---

*Crafted with ❤️ for the modern developer by Taz.*
