# 🧭 Exploring Nexus IDE v2.5

Welcome to the most advanced version of Nexus IDE yet. This guide will help you navigate the new features introduced in the **v2.5 Alpha Update**.

## 🤝 Real-time Collaboration (Sessions)

Nexus now supports session-based collaboration with one-time keys.

1.  **Generate a Key**: Go to the **Collaboration** tab (Users icon) and click "Generate Session Key".
2.  **Share**: Send this key to a friend.
3.  **Join**: Your friend enters the key in their Collaboration tab and clicks "Join Session".
4.  **Live Sync**: Any changes made to files will be instantly synchronized across all participants.
5.  **Auto-Wipe**: To ensure privacy and resource management, sessions have a **30-minute inactivity timeout**. If no one interacts with the workspace for 30 minutes after everyone leaves, the session data is wiped from the server.

## 🔌 VS Code Extensions & VSIX

You can now enhance your IDE with VS Code extensions.

-   **Marketplace**: Browse featured extensions in the **Extensions** tab.
-   **VSIX Loading**: Have a custom extension? Click "Load .VSIX" to upload and install it directly.
-   **Themes**: Many VS Code themes can be loaded and applied to the Monaco editor.

## 🐙 GitHub Customization

When creating a new repository, you can now specify:
-   **Description**: Tell the world what your project is about.
-   **License**: Choose from MIT, Apache, GPL, or Unlicense.
-   **Visibility**: Toggle between Public and Private repositories.

## 💾 Workspace Persistence (IndexedDB)

Your workspace is now backed by **IndexedDB**, providing much larger storage capacity than `localStorage`.
-   **Auto-Save**: Every change is saved locally in your browser.
-   **Session Resumption**: If you close your browser and come back, your files will be right where you left them.

## 🎮 Graphics & WASM

We've added templates for cutting-edge web technologies:
-   **WebGL/Three.js**: For 3D graphics.
-   **WebGPU**: The next generation of graphics on the web.
-   **WASM**: Support for WebAssembly modules.

## 🤖 Local AI (Ollama)

Privacy-conscious? You can now connect Nexus to a local **Ollama** instance.
1.  Run Ollama on your machine (`ollama serve`).
2.  Select "Ollama" as your provider in Settings.
3.  Choose your local model (e.g., `llama3`, `mistral`).
4.  Code with full privacy.

---

*Nexus IDE: Crafted for the modern developer.*
