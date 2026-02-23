# Nexus IDE

Nexus IDE is a powerful, web-based integrated development environment inspired by the look and feel of VS Code. It allows you to write, preview, and manage your code directly in your browser.

## Features

- **VS Code Inspired UI**: Familiar interface with sidebar, editor, and preview panes.
- **Multi-Language Support**: Write HTML, CSS, JavaScript, Python, and more.
- **Live Preview**: See your changes in real-time with an integrated iframe preview.
- **Python Support**: Run Python code directly in the browser using Pyodide.
- **AI Assistant**: Integrated AI assistant with three powerful modes:
  - **Chat**: Ask questions and get help with your code.
  - **Agent**: Let the AI autonomously create and edit files.
  - **Vibe Coder**: Describe a project vibe and watch it come to life.
- **Multiple AI Providers**: Support for Gemini, OpenAI, and Anthropic (bring your own API key).
- **Local Storage**: Your work is automatically saved to your browser's local storage.
- **Export as ZIP**: Download your entire project as a ZIP file for offline use.

## Getting Started

1. Open the IDE in your browser.
2. Create new files using the explorer sidebar.
3. Set your AI API keys in the Settings menu (gear icon) to enable the AI Assistant.
4. Use the Preview pane to see your web projects or Python scripts in action.

## AI Modes

### Chat Mode
A conversational interface where you can ask about your code, debug issues, or get explanations.

### Agent Mode
The AI can see your entire project structure and can suggest (and apply) changes across multiple files.

### Vibe Coder
A high-level generation mode. Describe the "vibe" or the goal of your project, and the AI will generate the necessary files to make it happen.

## Technologies Used

- **React**: Frontend framework.
- **Monaco Editor**: The power behind the code editor.
- **Tailwind CSS**: Modern styling.
- **Pyodide**: Python runtime in the browser.
- **Lucide React**: Beautiful icons.
- **JSZip**: Exporting projects as ZIP files.
