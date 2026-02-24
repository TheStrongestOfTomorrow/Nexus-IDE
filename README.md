# Nexus IDE V2.9 Alpha

Welcome to Nexus IDE, a professional-grade web-based development environment.

## Features

- **Native File System Access**: Open local folders directly from your computer.
- **AI Assistant**: Powered by Gemini, OpenAI, and Anthropic.
  - **Ghost Text**: predictive code completions as you type.
  - **Code Lens**: AI actions directly in your code.
  - **Battleground**: Compare responses from multiple AI models.
  - **Project Memory**: AI understands your entire project context.
- **Collaboration**: Real-time multi-user coding sessions.
- **Command Palette**: Quick access to all IDE features (Ctrl+Shift+P).
- **Architecture Analysis**: Generate Mermaid.js diagrams of your project.
- **Diff View**: Compare and approve AI-generated changes.
- **Framework Support**: Templates for React, Vue, Svelte, Next.js, and more.
- **Terminal & Execution**: Run your code directly in the integrated terminal.

## Getting Started

1. Set your API keys in the **Settings** (bottom left).
2. Use the **Explorer** to create or import files.
3. Try the **AI Assistant** (Cmd+I or the Sparkles icon).
4. Use the **Command Palette** (Ctrl+Shift+P) to explore features.

## Self-Hosting (Beta)

Nexus IDE now supports "Self-Hosting" your project directly from the workspace.

### How to use:
1. Go to the **Collaboration** tab.
2. Generate a **Session Key**.
3. Click **Host Project Online**.
4. Your project will be accessible via a public URL (e.g., `/hosted/SESSION_ID/index.html`).

### Configuration:
The self-host feature automatically serves:
- `index.html` as the entry point.
- All `.js` and `.css` files in the same directory.
- Relative paths are resolved automatically.

> **Note**: This is a session-based hosting feature. If the session expires (30 minutes of inactivity), the hosted site will be taken down.

---
*Crafted with passion for developers.*
