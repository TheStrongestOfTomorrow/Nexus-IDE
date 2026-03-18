# 🚀 Nexus IDE: The AI-First, Browser-Based IDE

<p align="center">
  <img src="https://lucide.dev/api/icons/zap?size=64&color=3b82f6" alt="Nexus Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/nexus-ide?color=blue" alt="NPM Version" />
  <img src="https://img.shields.io/badge/Version-4.4.0-blue" alt="Version 4.4.0" />
  <img src="https://img.shields.io/badge/Status-Production_Ready-green" alt="Status" />
  <img src="https://img.shields.io/npm/l/nexus-ide?color=blueviolet" alt="License" />
</p>

Nexus IDE is a modern, high-performance, browser-based IDE designed for the next generation of developers. It offers a powerful, VS Code-like experience, enhanced with AI-first features and a streamlined interface. Optimized for both desktop and mobile (Termux), Nexus is the perfect tool for developers who value speed, efficiency, and privacy.

---

## 📦 Quick Start (NPM)

The fastest way to get started with Nexus IDE:

```bash
# Run instantly (no install required)
npx nexus-ide

# Or install globally
npm install -g nexus-ide
nexus-ide
```

That's it! Nexus IDE will start on `http://localhost:3000`

### CLI Commands

```bash
npx nexus-ide              # Start development server
npx nexus-ide build        # Build for production
npx nexus-ide serve        # Build and serve production
npx nexus-ide --port 8080  # Custom port
npx nexus-ide --open       # Open browser automatically
npx nexus-ide --help       # Show all options
```

---

## 🚀 Nexus IDE v4.4 - The God Update

Welcome to the most powerful version of Nexus IDE yet! **v4.4** introduces a suite of new features designed to make you a 10x developer.

---

## 🔥 Key Features of v4.4

### 🤖 AI That Works for You

*   **Custom Instructions:** New, fine-tuned instructions for the AI assistant in Chat and Agent modes give you more control over the AI's behavior.
*   **Say /yes to Ship:** Are you tired of confirming every little change the AI wants to make? Just type `/yes` in the chat, and the AI will have full control to build, test, and deploy your code.
*   **Prototyper Mode:** The new Composer/Vibe mode allows you to build entire applications from a single prompt. Just describe what you want to build, and the AI will do the rest.
*   **12+ AI Providers:** OpenAI, Anthropic Claude, Google Gemini, xAI (Grok), Mistral, DeepSeek, Alibaba Qwen, Groq, Cohere, Perplexity, Together AI, and Ollama (local).

### 🧩 Extension System
*   **OpenVSX Registry:** Browse and install extensions directly from OpenVSX
*   **VSIX Support:** Upload and install local `.vsix` files
*   **Extension Management:** Enable, disable, and uninstall extensions

### 🌐 A True VS Code Experience

*   **VSIX Extension Support:** Install and use your favorite VS Code extensions directly in Nexus IDE. No more compromises.
*   **Beginner Friendly UI:** A new, simplified UI for beginners makes it easier than ever to get started with Nexus IDE. The classic UI is still available in the settings for power users.
*   **Working Templates:** The template system has been completely overhauled. Now you can create and use templates that "actually work."

---

## ✨ Why Choose Nexus IDE?

*   **Blazing Fast:** 5x faster than traditional IDEs, with a lightweight footprint.
*   **AI-Powered:** Integrated AI assistant and voice commands to supercharge your workflow.
*   **Cross-Platform:** Use it on the web, as a native desktop app, or on your Android device.
*   **Privacy-First:** Your code, your keys, your privacy. No unnecessary data collection.
*   **Real-time Collaboration:** Seamlessly code with your team, no matter where you are.
*   **Extensible and Customizable:** Tailor the IDE to your needs with custom themes, and more.

---

## 🔮 Key Features

### 🎙️ Nexus Voice
Control your IDE with your voice. Simply click the microphone icon in the Title Bar to get started.
*   **"Run Code"**: Executes the current file.
*   **"Open Settings"**: Opens the settings panel.
*   **"Toggle Terminal"**: Shows/hides the terminal.
*   **"Clear Workspace"**: Safely wipes files with a confirmation prompt.

### 🧘 Zen Mode
Focus on your code without distractions. Click the Eye icon in the Title Bar to instantly hide all sidebars and terminals.

### 🎨 Theme Studio & Visualization
*   **Theme Studio**: Create your own custom color themes.
*   **Dependency Graph**: Visualize your project's dependencies from `package.json`.
*   **Project Insights**: Get statistics on lines of code, file types, and languages used.

### ☁️ Nexus Cloud Bridge
Our real-time collaboration now works everywhere! We've implemented a fallback signaling server so the **Collaboration Bridge** works even on static platforms like GitHub Pages.

---

## 🚀 Deployment & Releases

### 📦 NPM Package (Recommended)

```bash
# Quick start
npx nexus-ide

# Install globally
npm install -g nexus-ide
nexus-ide

# Build for production
npx nexus-ide build

# Serve production build
npx nexus-ide serve
```

### 🌐 Web Version (GitHub Pages)
Nexus IDE is fully compatible with GitHub Pages. AI features use direct browser-to-API calls, and collaboration is powered by the Nexus Cloud signaling bridge.

### 📱 Android Release (APK)
Nexus IDE is optimized for Android devices. You can download the latest automated APK build from the [Actions tab](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/actions).

### 💻 Desktop Releases (Windows, macOS, Linux)
Powered by Tauri, Nexus IDE is also available as a lightweight native desktop application. You can find the latest releases in the [GitHub Releases](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases) section.

---

## 🛠️ Getting Started (Local Development)

### Option 1: NPM (Recommended)

```bash
# Run instantly
npx nexus-ide

# Or install globally
npm install -g nexus-ide
nexus-ide
```

### Option 2: Clone from GitHub

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
    cd Nexus-IDE
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Authentication (Optional):**
    Create a `.env` file at the root of the project and add your GitHub Client ID and Secret for full GitHub integration.
    ```
    GITHUB_CLIENT_ID=your_client_id
    GITHUB_CLIENT_SECRET=your_client_secret
    ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

---

## 🤖 Supported AI Providers

| Provider | Models |
|----------|--------|
| **OpenAI** | GPT-4o, GPT-4o Mini, O1, O3 Mini |
| **Anthropic** | Claude Opus 4, Claude Sonnet 4, Claude 3.5 |
| **Google Gemini** | Gemini 2.5 Pro, Gemini 2.0 Flash |
| **xAI** | Grok 3, Grok 3 Fast, Grok 2 Vision |
| **Mistral** | Mistral Large, Codestral, Pixtral |
| **DeepSeek** | DeepSeek Chat, DeepSeek Coder, DeepSeek R1 |
| **Alibaba Qwen** | Qwen Max, Qwen Coder Plus |
| **Groq** | Llama 3.3 70B, Mixtral (Free tier) |
| **Cohere** | Command R+, Command R |
| **Perplexity** | Sonar Pro, Sonar Reasoning |
| **Together AI** | Llama 3.3, Mistral, Qwen models |
| **Ollama** | Llama 3.2, Mistral, Code Llama (Local) |

---

## 💖 Community & Contributing

Nexus IDE is an open-source project and we welcome contributions from the community. If you'd like to get involved, please check out our [CONTRIBUTING.md](CONTRIBUTING.md) file for more information on how to submit pull requests, report bugs, and suggest new features.

---

## 📄 License

Nexus IDE is licensed under the [MIT License](LICENSE).

---

*Crafted with ❤️ for the modern developer by Taz.*
