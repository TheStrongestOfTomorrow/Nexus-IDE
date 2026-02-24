# 🚀 Nexus IDE

Nexus IDE is a powerful, web-based integrated development environment inspired by the look and feel of VS Code. It allows you to write, preview, and manage your code directly in your browser with built-in AI intelligence and seamless integrations.

## ✨ Why Nexus?

Nexus isn't just another code editor; it's a complete development environment that lives in your browser. Whether you're a student learning to code, a developer prototyping a new idea, or an AI enthusiast exploring the latest models, Nexus provides the tools you need without the overhead of a local setup.

## 🛠 Features

- **VS Code Inspired UI**: Familiar interface with sidebar, editor, and preview panes.
- **Multi-Language Support**: Write HTML, CSS, JavaScript, Python, and more.
- **Live Preview**: See your changes in real-time with an integrated iframe preview.
- **Python Support**: Run Python code directly in the browser using Pyodide.
- **AI Assistant**: Integrated AI assistant with three powerful modes:
  - **Chat**: Ask questions and get help with your code.
  - **Agent**: Let the AI autonomously create and edit files.
  - **Vibe Coder**: Describe a project vibe and watch it come to life.
- **Multiple AI Providers**: Support for Gemini, OpenAI, and Anthropic (bring your own API key).
- **Real-time Collaboration**: Code together with your team in real-time via WebSockets.
- **Terminal Integration**: A real terminal for running Node.js and other server-side tasks.
- **Extension Marketplace**: Support for custom themes and plugins via external script loading.
- **Mobile Optimization**: A better experience for coding on the go with responsive layouts.
- **Ollama Support**: Integration with local models for private, offline intelligence (Self-Hosting only).
- **GitHub Integration**: Connect your GitHub account to clone, commit, and push changes directly.
  - **Single Repo Import**: To maintain performance, you can import one repository at a time.
  - **Bulk Deletion**: Easily clear your workspace by deleting all imported repository files at once.
  - **Auto-Preview**: The system automatically attempts to render a preview of your project, handling complex file structures from GitHub.
- **Local Storage**: Your work is automatically saved to your browser's local storage.
- **Export as ZIP**: Download your entire project as a ZIP file for offline use.

## 🚀 Getting Started

1. Open the IDE in your browser.
2. Create new files using the explorer sidebar.
3. Set your AI API keys in the Settings menu (gear icon) to enable the AI Assistant.
4. Use the Preview pane to see your web projects or Python scripts in action.

## 🤖 AI Modes

### Chat Mode
A conversational interface where you can ask about your code, debug issues, or get explanations.

### Agent Mode (Composer)
The AI can see your entire project structure and can suggest (and apply) changes across multiple files. It acts as your autonomous pair programmer.

### Vibe Coder
A high-level generation mode. Describe the "vibe" or the goal of your project, and the AI will generate the necessary files to make it happen.

## 📅 Roadmap

We're constantly working to make Nexus better. Here's what's on the horizon:

- [ ] **Docker Support**: One-click deployment with pre-configured environments.
- [ ] **Advanced Debugging**: Visual debugger for JavaScript and Python.
- [ ] **Plugin API**: More robust API for extension developers.
- [ ] **Cloud Sync**: Sync your projects across devices without GitHub.

## 📜 Update Log

### V2.6 Alpha Release (Feb 2026)
- **Diff View**: Compare local changes with original versions or imported repository files.
- **AI Approval Workflow**: Review and approve AI-generated code changes with an "Always Allow" option.
- **Framework Templates**: Added templates for Next.js, Vue, Svelte, and Tailwind CSS.
- **Improved Sidebar**: Enhanced explorer with file comparison tools.

### V2.5 Alpha Release (Feb 2026)
- **Session-based Collaboration**: One-time session keys for instant pair programming with friends.
- **Inactivity Auto-Wipe**: Sessions automatically expire and wipe data after 30 minutes of inactivity.
- **IndexedDB Persistence**: Robust workspace saving using browser-native IndexedDB.
- **VSIX Support**: Load and install VS Code extensions directly from `.vsix` files.
- **GitHub Customization**: Set descriptions, licenses, and visibility when creating new repositories.
- **WASM Support**: Added templates and runtime considerations for WebAssembly.

### V2.1 Alpha Release (Feb 2026)
- **Graphics & Game Dev**: Added templates for WebGL, Three.js, and WebGPU to bootstrap high-performance graphics projects.
- **VS Code Extension Support**: Enhanced the extension system to support loading VS Code themes and language configurations directly into Monaco.
- **Extension Marketplace**: Added a featured marketplace to discover and install popular IDE enhancements.

### V2 Alpha Release (Feb 2026)
- **Real-time Collaboration**: Implemented WebSocket-based code synchronization for team editing.
- **Terminal Integration**: Added a functional terminal (xterm.js) with server-side shell access.
- **Extensions**: Introduced a system to load custom JavaScript extensions from URLs.
- **Ollama Support**: Added support for self-hosted local AI models via Ollama.
- **Mobile Optimization**: Improved UI responsiveness for smaller screens and touch devices.

### Alpha V1.5 (Feb 2026)
- **GitHub Integration**: Full support for connecting GitHub, importing repos, and pushing changes.
- **UI Overhaul**: Redesigned AI Assistant panel to match VS Code's "Composer" style.
- **Full-Stack Support**: Added an Express backend to handle secure OAuth flows.
- **Status Bar Updates**: Now shows your GitHub connection status.

### Alpha V1 (Jan 2026)
- **Initial Release**: Basic editor, preview, and local storage support.
- **AI Integration**: Gemini, OpenAI, and Anthropic support.
- **Python Support**: Integrated Pyodide for browser-side Python execution.

## 🏠 Self-Hosting

Nexus IDE is designed to be easy to host on your own infrastructure.

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/nexus-ide.git
   cd nexus-ide
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` if you want GitHub integration.
4. **Build the project**:
   ```bash
   npm run build
   ```
5. **Run in Production**:
   ```bash
   npm start
   ```

### Deployment Options
- **Vercel/Netlify**: Perfect for the frontend, but requires a separate backend for GitHub OAuth.
- **Docker**: (Coming Soon) We are working on a Dockerfile for one-click deployments.
- **Cloud Run**: The recommended way to host the full-stack application.

## 🤓 Documentation for Nerds

- [Detailed Features Deep Dive](./src/FEATURES.md)
- [Contribution Guidelines](./CONTRIBUTIONS.md)

## 🧪 Technologies Used

- **React**: Frontend framework.
- **Monaco Editor**: The power behind the code editor.
- **Tailwind CSS**: Modern styling.
- **Express**: Backend server for OAuth and API proxying.
- **Pyodide**: Python runtime in the browser.
- **Lucide React**: Beautiful icons.
- **JSZip**: Exporting projects as ZIP files.
- **Motion**: Fluid animations and transitions.
