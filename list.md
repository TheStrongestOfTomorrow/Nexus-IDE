# 🚀 Nexus IDE v3.5 - Feature List

Nexus IDE is a professional-grade, web-based development environment designed for speed, flexibility, and deep AI integration. Below is a thorough explanation of every feature currently available.

---

## 🏗️ Core IDE Features

### 1. Multi-Tab Monaco Editor
Powered by the same engine as VS Code, the editor provides:
- **Syntax Highlighting**: Support for 50+ languages.
- **IntelliSense**: Smart code completion and suggestions.
- **Multi-Cursor Editing**: Edit multiple lines simultaneously.
- **Minimap**: Quick navigation for large files.

### 2. Integrated Live Preview
- **Real-time Rendering**: See your HTML, CSS, and JavaScript changes instantly in a split-pane view.
- **Console Logs**: View logs directly from the preview environment.
- **Responsive Toggle**: Switch between Desktop and Mobile preview modes.

### 3. Native Terminal
- **WebSocket Backend**: A real terminal connected to the server.
- **Multi-Shell Support**: Automatically detects and uses Bash (Linux/macOS) or PowerShell (Windows).
- **Process Execution**: Run Node.js, Python, or shell scripts directly from the IDE.

### 4. Local File System Access
- **Folder Sync**: Open entire local folders directly from your computer using the File System Access API.
- **Auto-Save**: Changes are persisted to your local disk or browser's IndexedDB automatically.

### 5. PWA (Progressive Web App)
- **Installable**: Install Nexus IDE as a standalone app on Windows, macOS, Android, and iOS.
- **Offline Support**: Core features work without an internet connection thanks to advanced Service Worker caching.
- **Native Feel**: No browser chrome, custom splash screens, and theme-color integration.

---

## 🤖 Nexus AI Assistant

### 6. AI Modes
- **Chat**: Ask questions about your code, get explanations, or debug errors.
- **Composer (Agent)**: Describe a feature or bug fix, and the AI will autonomously edit multiple files in your workspace.
- **Vibe Coder**: Provide a high-level "vibe" or project idea, and the AI will generate the entire project structure and code from scratch.

### 7. Multi-Model Support
Connect to any major AI provider:
- **Gemini (Google)**: Native integration with Gemini 3 Flash/Pro.
- **OpenAI**: Support for GPT-4o and GPT-4o-mini.
- **Anthropic**: Support for Claude 3.5 Sonnet.
- **Local (Ollama)**: Run AI locally on your own machine for 100% privacy.
- **Groq & DeepSeek**: High-speed inference for rapid coding.

### 8. AI Battleground
- **Comparative Analysis**: Send the same prompt to multiple models (e.g., Gemini vs GPT-4o) and compare their responses side-by-side to choose the best code.

### 9. Architecture Analysis
- **Mermaid.js Integration**: The AI can scan your entire project and generate a visual flowchart (Mermaid diagram) of your app's architecture and component relationships.

---

## 🐙 GitHub & DevOps

### 10. Deep GitHub Integration
- **OAuth Authentication**: Securely link your GitHub account.
- **Repository Explorer**: Browse and clone your public and private repositories.
- **Source Control**: Commit and push changes directly to GitHub from the sidebar.

### 11. Native Build Workflows
Pushing a version tag (e.g., `v3.5.0`) to your GitHub repository automatically triggers GitHub Actions to build:
- **Windows**: `.exe` installer.
- **macOS**: `.dmg` disk image.
- **Linux**: `.deb` package.
- **Android**: `.apk` file via Capacitor.

---

## 🌐 Collaboration & Hosting

### 12. Real-time Collaboration
- **Shared Sessions**: Create a session ID and share it with teammates to edit the same files in real-time.
- **Presence Indicators**: See when other users join or leave your session.

### 13. Workspace Hosting
- **Instant Deployment**: Host your current project on a public URL with one click.
- **Live URL**: Share the generated URL with clients or friends to show off your work instantly.

---

## 🎮 Specialized Tools

### 14. Minecraft Bridge
- **WebSocket Connection**: Connect Nexus IDE directly to **Minecraft Bedrock Edition**.
- **Command Runner**: Execute in-game commands (like `/tp` or `/fill`) directly from the IDE terminal.
- **Event Listener**: Listen to real-time game events (block breaks, player chat) and log them in the IDE for debugging or automation scripts.

### 15. Command Palette
- **Quick Actions**: Press `Ctrl+Shift+P` to access a searchable list of all IDE commands, from creating files to running AI scans.

### 16. Extension System
- **Custom Scripts**: Load external JavaScript extensions to add new functionality or integrate with 3rd-party services.

### 17. Touch-Friendly Mode
- **Mobile Optimized**: A dedicated mode that increases hit targets and adjusts the layout for comfortable use on tablets and smartphones.
