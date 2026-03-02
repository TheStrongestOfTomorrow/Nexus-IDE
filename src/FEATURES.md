# Nexus IDE - Technical Features & Deep Dive

This document provides a detailed breakdown of the features and technical implementation of Nexus IDE.

## 1. Core Architecture
Nexus IDE is built as a modern Single Page Application (SPA) using React and TypeScript. It leverages a modular component architecture to ensure scalability and maintainability.

### 1.1 File System Hook (`useFileSystem`)
The IDE manages a virtual file system in the browser's `localStorage`.
- **State Management**: Uses React `useState` and `useEffect` for persistence.
- **UUIDs**: Every file is assigned a unique ID using the `uuid` library.
- **Language Detection**: Automatically maps file extensions to Monaco Editor languages.

## 2. Integrated Development Environment
### 2.1 Monaco Editor
We use the `@monaco-editor/react` package, which brings the core of VS Code's editor to the web.
- **IntelliSense**: Basic syntax highlighting and autocompletion for supported languages.
- **Theming**: Integrated VS Code Dark theme.

### 2.2 Live Preview System
The preview system uses an `iframe` with a `Blob` URL.
- **HTML/CSS/JS**: Injects styles and scripts directly into the HTML template.
- **Python Support**: Uses **Pyodide** (WebAssembly) to run Python code directly in the browser. It redirects `stdout` and `stderr` to a custom console UI.
- **Markdown**: Uses `marked` and `github-markdown-css` for high-quality rendering.
- **SQL/JSON**: Custom syntax highlighting for data files.

## 3. AI Assistant (The "Nexus" Brain)
The AI Assistant supports multiple providers and modes.

### 3.1 Providers
- **Google Gemini**: Native integration using `@google/genai`.
- **OpenAI**: Integration using the `openai` SDK.
- **Anthropic**: Integration using the `@anthropic-ai/sdk`.

### 3.2 Modes
- **Chat**: Context-aware conversation. The AI sees all your files in the prompt.
- **Agent**: Autonomous file manipulation. The AI returns a JSON schema of file changes which the IDE applies automatically.
- **Vibe Coder**: High-level creative generation based on descriptive prompts.

## 4. Export & Portability
- **ZIP Export**: Uses `jszip` and `file-saver` to bundle the entire virtual project into a downloadable archive.

## 5. Security & Privacy
- **Client-Side Keys**: API keys are stored in `localStorage` and never sent to our servers (only to the respective AI providers).
- **Sandboxed Preview**: The preview iframe uses `sandbox` attributes to prevent malicious scripts from accessing the main IDE state.
