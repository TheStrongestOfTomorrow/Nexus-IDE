<div align="center">

# 🚀 Nexus IDE v2 (MIT)

### A state-of-the-art, high-performance, browser-native IDE.
**Zero server dependencies. Zero cloud lag. Bring-your-own-key privacy. All inside a browser tab.**

[![Live Demo](https://img.shields.io/badge/Try_It_Now-Vercel-000000?style=for-the-badge&labelColor=1e293b&logo=vercel)](https://nexus-ide.vercel.app/)
[![Version](https://img.shields.io/badge/Version-5.5.6-3b82f6?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge&labelColor=1e293b)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web_|_Tauri_|_Android-059669?style=for-the-badge&labelColor=1e293b)](https://github.com/TheStrongestOfTomorrow/Nexus-IDE)

---

### **[👉 Launch Nexus IDE Instantly](https://nexus-ide.vercel.app/)**
*No installs, no credit cards, no sign-ups. Starts nearly instantly.*

</div>

---

## 💡 Why Nexus IDE?

Traditional web IDEs are caught in a frustrating trade-off. **Cloud containers** (e.g., GitHub Codespaces, Gitpod) offer full POSIX environments but suffer from high subscription fees, slow server cold starts (15-30s), and network keystroke latency. **Client-side playgrounds** (e.g., standard CodePen, JSFiddle) load instantly but run in restricted sandboxes without a real terminal, Node.js compilation, or shell binaries. 

Furthermore, modern AI assistants route your code through proprietary middle-man proxy servers, compromising privacy and introducing subscription markups.

**Nexus IDE is a total paradigm shift.** It delivers the speed and immediate boot times of a static webpage, combined with the execution power of a virtualized OS, advanced multi-modal AI agents, and frictionless platform portability.

### 🌟 Key Performance & Privacy Advantages:

*   **Zero Startup Lag (Nearly Instant):** Runs entirely inside your browser's client engine. There are no remote virtual machines to provision or warm up. Typing, search, and UI renders happen at native local-hardware speed.
*   **Absolute Code & Key Privacy:** Direct browser-to-LLM client network connections. Your API keys are saved strictly in your local secure browser storage (IndexedDB) and your code is never routed through intermediate SaaS proxy databases.
*   **Dual-Engine Local Execution:**
    *   *v86 x86 VM:* Boots a real, native Alpine Linux kernel inside WebAssembly. Run raw POSIX binaries, write shell scripts, or compile code completely in-browser. Supports uploading custom ISO/IMG virtual disks (Ubuntu, Windows).
    *   *Node.js WebContainers:* Execute full, in-browser Node.js runtime instances. Run `npm install`, compile React/Vite/Express code, and host/preview development backends directly from your browser tab.
*   **Multi-Modal AI Agents (51 Built-in Tools):** Supports **12 top-tier AI providers** (Anthropic Claude, OpenAI, Google Gemini, xAI Grok, Mistral, DeepSeek, local Ollama, and more). Features **Chat, Agent, and Prototyper** modes. In Agent mode, the LLM can programmatically edit files, execute compile scripts in your terminal, manage git histories, and search the web.
*   **True Local Drive Synchronization:** Mount a real directory from your physical hard drive directly into the browser tab using the browser's modern **File System Access API**. Edits inside Nexus write back to your physical disk in real-time.
*   **Serverless P2P Collaboration:** Code together with teams in real-time using secure, password-gated peer-to-peer tunnels. Features SHA-256 hashing for session integrity and extensive host controls (kick participants, transfer host).
*   **Universal Portability:** One codebase compiled for Web (static assets), Desktop (Tauri wrappers for macOS, Windows, Linux), and Mobile (Capacitor wrapper compiled as an Android APK with swipe layouts and landscape/split view optimization).

---

## 🛠️ The Tech Stack & Architecture

Nexus IDE is an engineering marvel that integrates cutting-edge WebAssembly, DOM isolation, and virtualization tech into a single cohesive SPA:

```
+-----------------------------------------------------------------------------+
|                             NEXUS IDE WORKSPACE                             |
|  +--------------------+  +-----------------------+  +--------------------+  |
|  |     Monaco UI      |  | P2P Collaboration Hub |  |  Theme Studio (21) |  |
|  |   (VS Code Engine) |  | (Password-Gated Hashing)   |  | (Custom CSS Presets|  |
|  +---------+----------+  +-----------+-----------+  +---------+----------+  |
+------------|-------------------------|------------------------|-------------+
             | Bidirectional Sync      | Host Control           | Live Preview
             v                         v                        v
+-----------------------------------------------------------------------------+
|                            COMPUTE & COMPILING LAYER                        |
|  +-------------------------------------+  +------------------------------+  |
|  |     v86 WebAssembly x86 CPU VM      |  | WebContainer Node.js Engine  |  |
|  |  +-------------------------------+  |  |  (Fast client-side compiles) |  |
|  |  |   Virtualized Alpine Linux    |  |  |  +------------------------+  |  |
|  |  |   - Custom ISO/IMG Booting    |  |  |  | `npm install` & Server |  |  |
|  |  |   - Shared 9p File Bridge     |  |  |  +------------------------+  |  |
|  |  +-------------------------------+  |  |                              |  |
|  +-------------------------------------+  +------------------------------+  |
+-----------------------------------------------------------------------------+
             ^
             | Direct Client Endpoint Queries (BYOK)
             v
+-----------------------------------------------------------------------------+
|                      12-PROVIDER AI AGENT SYSTEM (51 TOOLS)                 |
|  +--------------------+  +--------------------+  +--------------------+  |
|  |    OpenAI / xAI    |  | Anthropic / Google |  | Ollama (Local/Off) |  |
|  +--------------------+  +--------------------+  +--------------------+  |
+-----------------------------------------------------------------------------+
```

### AI-Accelerated & Wasm-Powered Engineering

Nexus IDE is an ambitious experiment in building production-grade software at the absolute boundaries of modern web APIs. Our development process utilized advanced generative AI models for structural prototyping and boilerplate acceleration, integrated under strict human engineering supervision—a workflow that allowed us to rapidly bridge decades of virtualization engineering with modern browser sandboxing. 

The heart of the system relies on a **bidirectional filesystem bridge** utilizing the **9p filesystem protocol**. When you type in Monaco, an update is saved to the browser's IndexedDB and triggers a virtual "hardware interrupt" in the emulated v86 CPU. The virtualized guest Alpine kernel receives this update over the 9p mount and edits the corresponding files instantly. Compilations run inside the Alpine shell output binary products, which write back to the 9p mount and automatically update your Monaco workspace tree.

### Under-the-Hood Limitations (Transparent OSS Story):

*   **v86 CPU Overhead:** Because `v86` emulates a full x86 instruction set in WebAssembly without hardware acceleration, virtualized CPU speeds inside the browser are roughly 10x slower than native host execution. It is the perfect POSIX playground for runing lightweight scripts, learning terminal commands, and compiling small exercises, but not for compiling large multi-gigabyte packages.
*   **The SharedArrayBuffer Constraint:** Running local multi-threaded WebContainers or v86 workers requires **SharedArrayBuffer** support. Due to Spectre/Meltdown browser defenses, SharedArrayBuffer is exclusively active in **Secure Contexts** (HTTPS or localhost) and requires strict **COOP/COEP isolation headers** on the host. 
*   **GitHub Pages Isolation:** Standard GitHub Pages deployments do not support custom response headers, meaning the Alpine Terminal and WebContainers are automatically hidden on standard static page previews. However, the full editor, P2P collaboration, themes, and 12-provider AI Agent are completely functional out-of-the-box. Running the repo locally (`npm start`) or on header-supported cloud hosts (Vercel, Netlify, Render, Docker) automatically unlocks the full terminal features.

---

## 📊 Feature Matrix & Platform Capabilities

| Feature | Standard Browser (GitHub Pages) | Local Development (`npm start`) / Isolated Hosts |
| :--- | :---: | :---: |
| **Monaco Code Editor** | ✅ Active | ✅ Active |
| **BYOK 12 AI Providers** | ✅ Active | ✅ Active |
| **AI Agent Mode (51 Tools)** | ✅ Active | ✅ Active |
| **IndexedDB Workspaces** | ✅ Active | ✅ Active |
| **P2P Collaboration** | ✅ Active | ✅ Active |
| **OpenVSX Extensions** | ✅ Active | ✅ Active |
| **Theme Studio (21 Vars)** | ✅ Active | ✅ Active |
| **v86 Alpine VM Terminal** | ⚠️ Hidden (Requires COOP/COEP) | ✅ Active (Out of the box) |
| **WebContainer (Node.js)** | ⚠️ Hidden (Requires COOP/COEP) | ✅ Active (Out of the box) |
| **Server-Side Terminal** | ❌ Unavailable | ✅ Active |

---

## ⚡ Quick Start

### 1. Web Version (Fastest Preview)
Open **[thestrongestoftomorrow.github.io/Nexus-IDE](https://nexus-ide.vercel.app/)** on any desktop, tablet, or mobile browser to start coding immediately.

### 2. Full Local Experience (Recommended for terminal features)
Run Nexus locally on your computer with complete SharedArrayBuffer and loopback permissions:

```bash
# Clone the repository
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE

# Install dependencies and start the Vite server
npm install
npm start
```
Your browser will open automatically at `http://localhost:3000` with the correct cross-origin isolation headers applied.

### 3. Docker Deployment
```bash
docker-compose up -d
```

### 4. Desktop Compile (Tauri)
Nexus compiles to an ultra-lightweight native application (averaging under 25MB) using the Rust-based Tauri framework:
```bash
# Start Tauri Dev
npm run tauri:dev

# Build native binary (creates installer for your current OS)
npm run tauri:build
```

### 5. Mobile Compile (Capacitor Android APK)
Compile a native Android app optimized for touch input, landscape splits, and bottom-tab navigation:
```bash
npm install && npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

## 🤝 Contribution Guidelines

We love pull requests! As an open-source, vibe-coded tool, we welcome contributions of all shapes and sizes—from adding new AI providers to designing custom UI theme presets.

### Local Development Workflow

1.  **Fork the Repository:** Create your own fork of `TheStrongestOfTomorrow/Nexus-IDE`.
2.  **Create a Feature Branch:** We suggest naming your branch based on the feature: `feature/add-provider-x` or `bugfix/editor-leak`.
3.  **Code Quality Standards (Linting):** Ensure your changes compile and pass our TypeScript syntax validator before pushing:
    ```bash
    # Run compiler validation (tsc --noEmit)
    npm run lint
    ```
4.  **Local Testing:** Test your changes in both light/dark theme orientations and verify no global styles leak out of component bounds.

### Developer Conventions & Standards

*   **Branching Structure:**
    *   `main`: Active development—all pull requests should target this branch.
    *   `beta`: Experimental testing branch for power users and advanced WASM integrations.
    *   `cli`: Terminal-only, TUI-specific codebase edition.
*   **Commit Message Format (Conventional Commits):**
    To keep our release logs readable, we enforce Conventional Commit syntax:
    *   `feat(ai): add Alibaba Qwen Coder model integration`
    *   `fix(embed): resolve wheel event passive listener memory leak`
    *   `docs(embed): clarify COOP/COEP header configuration guidelines`
    *   `refactor(terminal): optimize v86 worker filesystem throughput`
*   **Adding New AI Providers:**
    Add your custom LLM connector under `src/services/ai/providers/`. Ensure you implement proper streaming response wrappers and define support for the BYOK model.

---

<div align="center">

### Made with ❤️ by Taz & the Open-Source Community
*Zero downloads. Zero cloud dependencies. Just code.*

</div>
