# 🚀 Nexus IDE v4.2 Mega-Upgrade

<p align="center">
  <img src="https://lucide.dev/api/icons/zap?size=64&color=3b82f6" alt="Nexus Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-4.2.0-blue" alt="Version 4.2.0" />
  <img src="https://img.shields.io/badge/Status-Production_Ready-green" alt="Status" />
  <img src="https://img.shields.io/badge/Performance-5x_Faster-orange" alt="Performance" />
  <img src="https://img.shields.io/badge/Privacy-First-blueviolet" alt="Privacy" />
</p>

Nexus IDE is a modern, high-performance, browser-based IDE designed for the next generation of developers. Optimized for both desktop and mobile (Termux), it brings the power of VS Code with a simplified, AI-first experience.

---

## 🎯 What's New in v4.2

### ✨ Core Features
*   **Beginner-Friendly UI (VS Code Remaster)**: A clean, spacious layout with clear labels, large icons, and guided tutorials. **Toggle back to the classic v4.1 UI anytime in Settings!**
*   **5x Faster Loading**: Optimized with IndexedDB queries and LocalStorage caching. Initial load in <400ms, workspace restore in <50ms.
*   **AI Supercharge**: Support for the latest models (Gemini 3.1 Pro, Claude 4.6, GPT-4o, Deepseek, Ollama). 
*   **Workspace Save & Restore**: Auto-save every 5 minutes and manual snapshots (Ctrl+Shift+S) for point-in-time recovery.
*   **Shared .nexus Format**: Export your entire workspace (excluding secrets/keys) into a single `.nexus` file to share with others.
*   **Actual API Mocking**: Real request interception for GET, POST, PUT, and DELETE. Test your frontend without a backend.
*   **Pre-install Dependencies**: One-click setup for React, Vue, Express, TypeScript, Vite, Tailwind, and more—now fully functional and cached.
*   **Optional Chat History**: Privacy-first AI chat history saving (disabled by default) with storage monitoring.

---

## 🚀 Deployment & Releases

### 📱 Android Release (APK)
Nexus IDE is fully optimized for Android. We use GitHub Actions to automatically build APKs.
*   **How to Build**: Every push to `main` triggers an Android build. Check the [Actions tab](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/actions) to download the latest artifact.
*   **Workflow**: Managed via `.github/workflows/android.yml`.

### 💻 Desktop Releases (Windows, macOS, Linux)
Powered by **Tauri**, Nexus IDE is available as a lightweight native desktop application.
*   **Source**: Located in the `src-tauri/` directory.
*   **Build**: Triggered via `.github/workflows/release.yml` on every new tag.

### 🌐 Web Hosting (7+ Platforms)
Nexus IDE can be deployed to almost any cloud provider in minutes:
1.  **Vercel** (Recommended): Easiest setup, perfect for the frontend.
2.  **Railway**: Docker-native, great for full-stack deployments.
3.  **Render**: Free tier available, simple and reliable.
4.  **DigitalOcean**: Full control with Docker droplets.
5.  **AWS/Heroku**: Production-grade hosting for scale.
*   *See [HOSTING_DEPLOYMENT_GUIDES.md](./HOSTING_DEPLOYMENT_GUIDES.md) for step-by-step instructions.*

---

## 🐳 Quick Start with Docker

The fastest way to run Nexus IDE locally or on a server:
```bash
# Clone the repository
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE

# Start with Docker Compose
docker-compose up -d

# Visit http://localhost:3000
```

---

## 🔧 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
   cd Nexus-IDE
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your GitHub OAuth credentials:
   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   APP_URL=http://localhost:3000
   ```
   *Note: You can create your own GitHub OAuth App in your [GitHub Developer Settings](https://github.com/settings/developers).*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *Visit http://localhost:3000 to start coding.*

---

## 🔒 Privacy & Security
*   **API Keys**: Stored locally in your browser's `localStorage`. They are **never** sent to our servers or included in `.nexus` exports.
*   **Chat History**: Optional and stored locally. You have full control to enable/disable or clear it anytime.
*   **No Data Export**: Your code and workspaces stay on your device unless you explicitly export them.

---

## 🤝 Contributing
We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) and [CONTRIBUTIONS.md](./CONTRIBUTIONS.md) for guidelines.

---

*Crafted with ❤️ for the modern developer by Taz.*
