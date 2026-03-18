#!/usr/bin/env node

/**
 * Nexus IDE TUI (Terminal User Interface)
 * A comprehensive terminal-based IDE experience
 * 
 * Usage: npx nexus-ide tui
 * Or: node cli/tui/index.js
 */

import blessed from 'blessed';
import { spawn, exec, execSync } from 'child_process';
import { createServer } from 'http';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname, relative } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

// Theme colors
const theme = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  textDim: '#8b949e',
  accent: '#58a6ff',
  green: '#3fb950',
  yellow: '#d29922',
  red: '#f85149',
  purple: '#a371f7',
  cyan: '#39c5cf',
  orange: '#db6d28'
};

// AI Provider configurations
const aiProviders = [
  { id: 'openai', name: 'OpenAI', models: ['GPT-4o', 'GPT-4o Mini', 'O1', 'O3 Mini'] },
  { id: 'anthropic', name: 'Anthropic', models: ['Claude Opus 4', 'Claude Sonnet 4', 'Claude 3.5'] },
  { id: 'google', name: 'Google Gemini', models: ['Gemini 2.5 Pro', 'Gemini 2.0 Flash'] },
  { id: 'xai', name: 'xAI (Grok)', models: ['Grok 3', 'Grok 3 Fast', 'Grok 2 Vision'] },
  { id: 'mistral', name: 'Mistral', models: ['Mistral Large', 'Codestral', 'Pixtral'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['DeepSeek Chat', 'DeepSeek Coder', 'DeepSeek R1'] },
  { id: 'alibaba', name: 'Alibaba Qwen', models: ['Qwen Max', 'Qwen Coder Plus'] },
  { id: 'groq', name: 'Groq', models: ['Llama 3.3 70B', 'Mixtral'] },
  { id: 'cohere', name: 'Cohere', models: ['Command R+', 'Command R'] },
  { id: 'perplexity', name: 'Perplexity', models: ['Sonar Pro', 'Sonar Reasoning'] },
  { id: 'together', name: 'Together AI', models: ['Llama 3.3', 'Mistral', 'Qwen'] },
  { id: 'ollama', name: 'Ollama (Local)', models: ['Llama 3.2', 'Mistral', 'Code Llama'] }
];

// Commands configuration
const commands = [
  { key: 'n', name: 'New File', action: 'newFile' },
  { key: 'o', name: 'Open File', action: 'openFile' },
  { key: 's', name: 'Save', action: 'saveFile' },
  { key: 'w', name: 'Close Tab', action: 'closeTab' },
  { key: 'f', name: 'Find', action: 'find' },
  { key: 'r', name: 'Run Code', action: 'runCode' },
  { key: 't', name: 'Terminal', action: 'toggleTerminal' },
  { key: 'e', name: 'Extensions', action: 'showExtensions' },
  { key: 'a', name: 'AI Assistant', action: 'toggleAI' },
  { key: 'p', name: 'Projects', action: 'showProjects' },
  { key: 'g', name: 'Git', action: 'showGit' },
  { key: '?', name: 'Help', action: 'showHelp' },
  { key: 'q', name: 'Quit', action: 'quit' }
];

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'Nexus IDE - TUI',
  fullUnicode: true,
  dockBorders: true
});

// State
const state = {
  currentDir: process.cwd(),
  files: [],
  openFiles: [],
  currentFile: null,
  fileContent: '',
  aiEnabled: true,
  currentAIProvider: 0,
  currentModel: 0,
  aiMessages: [],
  terminalVisible: false,
  extensionsVisible: false,
  helpVisible: false,
  serverRunning: false,
  serverPort: 3000
};

// Header bar
const header = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  tags: true,
  content: `{center}{bold}{cyan-fg}
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
{/cyan-fg}{/bold}{/center}{|}{right}{yellow-fg}v5.0.0 TUI{/yellow-fg}{/right}`,
  style: {
    fg: theme.text,
    bg: theme.bg
  },
  border: {
    type: 'line'
  }
});

// Menu bar
const menuBar = blessed.listbar({
  top: 3,
  left: 0,
  width: '100%',
  height: 3,
  keys: true,
  mouse: true,
  style: {
    bg: theme.panel,
    item: {
      bg: theme.panel,
      fg: theme.text,
      hover: {
        bg: theme.border,
        fg: theme.accent
      }
    },
    selected: {
      bg: theme.accent,
      fg: theme.bg
    }
  },
  commands: {
    'File': () => showFileMenu(),
    'Edit': () => showEditMenu(),
    'View': () => showViewMenu(),
    'Run': () => runCode(),
    'AI': () => toggleAI(),
    'Help': () => showHelp()
  }
});

// File explorer
const fileExplorer = blessed.box({
  top: 6,
  left: 0,
  width: '20%',
  height: '70%',
  label: ' Explorer ',
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    fg: theme.text,
    bg: theme.panel,
    border: { fg: theme.border },
    label: { fg: theme.accent },
    scrollbar: {
      bg: theme.border
    }
  },
  border: { type: 'line' }
});

// File list for navigation
const fileList = blessed.list({
  parent: fileExplorer,
  top: 0,
  left: 0,
  width: '100%-2',
  height: '100%-2',
  keys: true,
  vi: true,
  mouse: true,
  scrollable: true,
  style: {
    selected: {
      bg: theme.accent,
      fg: theme.bg
    },
    item: {
      fg: theme.text
    }
  }
});

// Code editor area
const editorBox = blessed.box({
  top: 6,
  left: '20%',
  width: '60%',
  height: '70%',
  label: ' Editor ',
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    fg: theme.text,
    bg: theme.bg,
    border: { fg: theme.border },
    label: { fg: theme.green },
    scrollbar: {
      bg: theme.border
    }
  },
  border: { type: 'line' }
});

// Editor textarea
const editor = blessed.textarea({
  parent: editorBox,
  top: 0,
  left: 0,
  width: '100%-2',
  height: '100%-2',
  keys: true,
  vi: true,
  mouse: true,
  scrollable: true,
  inputOnFocus: true,
  style: {
    fg: theme.text,
    bg: theme.bg,
    focus: {
      fg: theme.text,
      bg: theme.bg
    }
  }
});

// AI Assistant panel
const aiPanel = blessed.box({
  top: 6,
  left: '80%',
  width: '20%',
  height: '70%',
  label: ' AI Assistant ',
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    fg: theme.text,
    bg: theme.panel,
    border: { fg: theme.border },
    label: { fg: theme.purple },
    scrollbar: {
      bg: theme.border
    }
  },
  border: { type: 'line' }
});

// AI Chat content
const aiChat = blessed.box({
  parent: aiPanel,
  top: 0,
  left: 0,
  width: '100%-2',
  height: '75%',
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  content: `{bold}{cyan-fg}AI Assistant Ready{/cyan-fg}{/bold}

Provider: {green-fg}` + aiProviders[0].name + `{/green-fg}
Model: {yellow-fg}` + aiProviders[0].models[0] + `{/yellow-fg}

{bold}Commands:{/bold}
  /help - Show help
  /provider - Change AI
  /model - Change model
  /clear - Clear chat
  /code - Code mode
  /explain - Explain code
  /fix - Fix errors

{bold}Shortcuts:{/bold}
  Ctrl+A - Toggle AI
  Ctrl+P - Change provider
  Ctrl+M - Change model

Type a message to chat...`
});

// AI Input
const aiInput = blessed.textbox({
  parent: aiPanel,
  bottom: 1,
  left: 0,
  width: '100%-2',
  height: 3,
  keys: true,
  mouse: true,
  inputOnFocus: true,
  style: {
    fg: theme.text,
    bg: theme.bg,
    border: { fg: theme.border }
  },
  border: { type: 'line' }
});

// Command palette
const commandPalette = blessed.box({
  top: 'center',
  left: 'center',
  width: '60%',
  height: '70%',
  label: ' Command Palette ',
  tags: true,
  hidden: true,
  scrollable: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    fg: theme.text,
    bg: theme.panel,
    border: { fg: theme.accent },
    label: { fg: theme.accent }
  },
  border: { type: 'line' }
});

// Command list
const commandList = blessed.list({
  parent: commandPalette,
  top: 0,
  left: 0,
  width: '100%-2',
  height: '100%-2',
  keys: true,
  vi: true,
  mouse: true,
  style: {
    selected: {
      bg: theme.accent,
      fg: theme.bg
    },
    item: {
      fg: theme.text
    }
  }
});

// Status bar
const statusBar = blessed.box({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 3,
  tags: true,
  content: `{left} {cyan-fg}Ctrl+?{/cyan-fg} Help  {cyan-fg}Ctrl+K{/cyan-fg} Commands  {cyan-fg}Ctrl+S{/cyan-fg} Save  {cyan-fg}Ctrl+R{/cyan-fg} Run  {cyan-fg}Ctrl+Q{/cyan-fg} Quit {/left}{right}{green-fg}Ready{/green-fg} {/right}`,
  style: {
    fg: theme.text,
    bg: theme.panel,
    border: { fg: theme.border }
  },
  border: { type: 'line' }
});

// Help modal
const helpModal = blessed.box({
  top: 'center',
  left: 'center',
  width: '70%',
  height: '80%',
  label: ' Help - Keyboard Shortcuts ',
  tags: true,
  hidden: true,
  scrollable: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    fg: theme.text,
    bg: theme.panel,
    border: { fg: theme.green },
    label: { fg: theme.green }
  },
  border: { type: 'line' },
  content: `
{bold}{cyan-fg}═══════════════════════════════════════════════════════════════{/cyan-fg}{/bold}
{bold}                    NEXUS IDE - KEYBOARD SHORTCUTS                    {/bold}
{bold}{cyan-fg}═══════════════════════════════════════════════════════════════{/cyan-fg}{/bold}

{bold}{yellow-fg}FILE OPERATIONS{/yellow-fg}{/bold}
  {green-fg}Ctrl+N{/green-fg}     New File
  {green-fg}Ctrl+O{/green-fg}     Open File
  {green-fg}Ctrl+S{/green-fg}     Save File
  {green-fg}Ctrl+W{/green-fg}     Close Tab
  {green-fg}Ctrl+Shift+S{/green-fg}  Save As

{bold}{yellow-fg}EDITING{/yellow-fg}{/bold}
  {green-fg}Ctrl+Z{/green-fg}     Undo
  {green-fg}Ctrl+Y{/green-fg}     Redo
  {green-fg}Ctrl+F{/green-fg}     Find
  {green-fg}Ctrl+H{/green-fg}     Find & Replace
  {green-fg}Ctrl+A{/green-fg}     Select All
  {green-fg}Ctrl+C{/green-fg}     Copy
  {green-fg}Ctrl+V{/green-fg}     Paste
  {green-fg}Ctrl+X{/green-fg}     Cut

{bold}{yellow-fg}NAVIGATION{/yellow-fg}{/bold}
  {green-fg}Ctrl+P{/green-fg}     Quick Open (Files)
  {green-fg}Ctrl+G{/green-fg}     Go to Line
  {green-fg}Ctrl+Tab{/green-fg}   Next Tab
  {green-fg}Ctrl+Shift+Tab{/green-fg}  Previous Tab
  {green-fg}Alt+←{/green-fg}      Navigate Back
  {green-fg}Alt+→{/green-fg}      Navigate Forward

{bold}{yellow-fg}VIEW{/yellow-fg}{/bold}
  {green-fg}Ctrl+B{/green-fg}     Toggle Sidebar
  {green-fg}Ctrl+J{/green-fg}     Toggle Terminal
  {green-fg}Ctrl+E{/green-fg}     Toggle Explorer
  {green-fg}F11{/green-fg}        Toggle Fullscreen
  {green-fg}Ctrl+K Z{/green-fg}   Zen Mode

{bold}{yellow-fg}AI ASSISTANT{/yellow-fg}{/bold}
  {green-fg}Ctrl+A{/green-fg}     Toggle AI Panel
  {green-fg}Ctrl+Shift+P{/green-fg}  Change AI Provider
  {green-fg}Ctrl+Shift+M{/green-fg}  Change AI Model
  {green-fg}/ask{/green-fg}       Ask AI a question
  {green-fg}/code{/green-fg}      Generate code
  {green-fg}/explain{/green-fg}   Explain code
  {green-fg}/fix{/green-fg}       Fix errors

{bold}{yellow-fg}RUN & DEBUG{/yellow-fg}{/bold}
  {green-fg}F5{/green-fg}         Start Debugging
  {green-fg}Shift+F5{/green-fg}   Stop Debugging
  {green-fg}Ctrl+F5{/green-fg}    Run Without Debugging
  {green-fg}F9{/green-fg}         Toggle Breakpoint

{bold}{yellow-fg}TERMINAL{/yellow-fg}{/bold}
  {green-fg}Ctrl+\`{/green-fg}     Toggle Terminal
  {green-fg}Ctrl+Shift+\`{/green-fg}  New Terminal

{bold}{yellow-fg}GENERAL{/yellow-fg}{/bold}
  {green-fg}Ctrl+K{/green-fg}     Command Palette
  {green-fg}Ctrl+?{/green-fg}     Show Help
  {green-fg}Ctrl+Q{/green-fg}     Quit
  {green-fg}Esc{/green-fg}        Close Modal/Cancel

{bold}{cyan-fg}═══════════════════════════════════════════════════════════════{/cyan-fg}{/bold}
{bold}                    Press ESC or q to close this help                    {/bold}
{bold}{cyan-fg}═══════════════════════════════════════════════════════════════{/cyan-fg}{/bold}
`
});

// Terminal box
const terminalBox = blessed.box({
  bottom: 3,
  left: 0,
  width: '100%',
  height: '30%',
  label: ' Terminal ',
  tags: true,
  hidden: true,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    fg: theme.text,
    bg: theme.bg,
    border: { fg: theme.border },
    label: { fg: theme.cyan }
  },
  border: { type: 'line' }
});

// Terminal output
const terminalOutput = blessed.log({
  parent: terminalBox,
  top: 0,
  left: 0,
  width: '100%-2',
  height: '100%-4',
  keys: true,
  vi: true,
  mouse: true,
  scrollable: true,
  tags: true,
  style: {
    fg: theme.text,
    bg: theme.bg
  }
});

// Terminal input
const terminalInput = blessed.textbox({
  parent: terminalBox,
  bottom: 0,
  left: 0,
  width: '100%-2',
  height: 3,
  keys: true,
  mouse: true,
  inputOnFocus: true,
  style: {
    fg: theme.text,
    bg: theme.bg,
    border: { fg: theme.border }
  },
  border: { type: 'line' }
});

// Extensions panel
const extensionsPanel = blessed.box({
  top: 6,
  left: '20%',
  width: '60%',
  height: '70%',
  label: ' Extensions ',
  tags: true,
  hidden: true,
  scrollable: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    fg: theme.text,
    bg: theme.panel,
    border: { fg: theme.orange },
    label: { fg: theme.orange }
  },
  border: { type: 'line' },
  content: `{bold}{cyan-fg}OpenVSX Extension Registry{/cyan-fg}{/bold}

{bold}Featured Extensions:{/bold}
  
  {green-fg}●{/green-fg} Python - Python language support
  {green-fg}●{/green-fg} Prettier - Code formatter
  {green-fg}●{/green-fg} ESLint - JavaScript linter
  {green-fg}●{/green-fg} GitLens - Git supercharged
  {green-fg}●{/green-fg} Docker - Docker support
  {green-fg}●{/green-fg} Tailwind CSS - Utility-first CSS
  {green-fg}●{/green-fg} TypeScript - TS language support
  {green-fg}●{/green-fg} React - React tools

{bold}Categories:{/bold}
  Programming Languages
  Debuggers
  Snippets
  Linters
  Formatters
  Themes
  Keymaps

{bold}Commands:{/bold}
  /search <query> - Search extensions
  /install <name> - Install extension
  /uninstall <name> - Uninstall extension
  /list - List installed extensions

Press ESC to close`
});

// Functions
function loadDirectory(dir) {
  try {
    const items = readdirSync(dir);
    state.files = items.map(item => {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      return {
        name: item,
        path: fullPath,
        isDir: stat.isDirectory()
      };
    }).sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    const listItems = ['{yellow-fg}📁 ..{/yellow-fg}'];
    state.files.forEach(file => {
      if (file.isDir) {
        listItems.push(`{yellow-fg}📁 ${file.name}{/yellow-fg}`);
      } else {
        const ext = extname(file.name);
        const icon = getFileIcon(ext);
        listItems.push(`${icon} ${file.name}`);
      }
    });

    fileList.setItems(listItems);
    screen.render();
  } catch (err) {
    terminalOutput.log(`{red-fg}Error loading directory: ${err.message}{/red-fg}`);
  }
}

function getFileIcon(ext) {
  const icons = {
    '.js': '{yellow-fg}JS{/yellow-fg}',
    '.ts': '{blue-fg}TS{/blue-fg}',
    '.tsx': '{cyan-fg}TSX{/cyan-fg}',
    '.jsx': '{cyan-fg}JSX{/cyan-fg}',
    '.json': '{yellow-fg}{}{/yellow-fg}',
    '.html': '{orange-fg}HTML{/orange-fg}',
    '.css': '{purple-fg}CSS{/purple-fg}',
    '.py': '{green-fg}PY{/green-fg}',
    '.md': '{cyan-fg}MD{/cyan-fg}',
    '.txt': '{text-dim}TXT{/text-dim}',
    '.git': '{red-fg}GIT{/red-fg}',
    '.env': '{yellow-fg}ENV{/yellow-fg}'
  };
  return icons[ext] || '{text-dim}FILE{/text-dim}';
}

function openFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    state.currentFile = filePath;
    state.fileContent = content;
    editor.setValue(content);
    editorBox.setLabel(` Editor - ${basename(filePath)} `);
    screen.render();
  } catch (err) {
    terminalOutput.log(`{red-fg}Error opening file: ${err.message}{/red-fg}`);
  }
}

function saveFile() {
  if (!state.currentFile) return;
  try {
    const content = editor.getValue();
    writeFileSync(state.currentFile, content);
    state.fileContent = content;
    statusBar.setContent(`{left} {cyan-fg}Ctrl+?{/cyan-fg} Help  {cyan-fg}Ctrl+K{/cyan-fg} Commands  {cyan-fg}Ctrl+S{/cyan-fg} Save  {cyan-fg}Ctrl+R{/cyan-fg} Run  {cyan-fg}Ctrl+Q{/cyan-fg} Quit {/left}{right}{green-fg}Saved!{/green-fg} {/right}`);
    screen.render();
    setTimeout(() => {
      statusBar.setContent(`{left} {cyan-fg}Ctrl+?{/cyan-fg} Help  {cyan-fg}Ctrl+K{/cyan-fg} Commands  {cyan-fg}Ctrl+S{/cyan-fg} Save  {cyan-fg}Ctrl+R{/cyan-fg} Run  {cyan-fg}Ctrl+Q{/cyan-fg} Quit {/left}{right}{green-fg}Ready{/green-fg} {/right}`);
      screen.render();
    }, 2000);
  } catch (err) {
    terminalOutput.log(`{red-fg}Error saving file: ${err.message}{/red-fg}`);
  }
}

function showHelp() {
  helpModal.show();
  screen.render();
}

function hideHelp() {
  helpModal.hide();
  screen.render();
}

function toggleTerminal() {
  state.terminalVisible = !state.terminalVisible;
  if (state.terminalVisible) {
    terminalBox.show();
    terminalInput.focus();
  } else {
    terminalBox.hide();
  }
  screen.render();
}

function toggleAI() {
  state.aiEnabled = !state.aiEnabled;
  if (state.aiEnabled) {
    aiPanel.show();
  } else {
    aiPanel.hide();
  }
  screen.render();
}

function showExtensions() {
  extensionsPanel.show();
  screen.render();
}

function hideExtensions() {
  extensionsPanel.hide();
  screen.render();
}

function showFileMenu() {
  commandList.setItems([
    '{green-fg}N{/green-fg} New File',
    '{green-fg}O{/green-fg} Open File...',
    '{green-fg}S{/green-fg} Save',
    '{green-fg}W{/green-fg} Save As...',
    '{green-fg}X{/green-fg} Close File'
  ]);
  commandPalette.setLabel(' File ');
  commandPalette.show();
  commandList.focus();
  screen.render();
}

function showEditMenu() {
  commandList.setItems([
    '{green-fg}Z{/green-fg} Undo',
    '{green-fg}Y{/green-fg} Redo',
    '{green-fg}C{/green-fg} Copy',
    '{green-fg}X{/green-fg} Cut',
    '{green-fg}V{/green-fg} Paste',
    '{green-fg}F{/green-fg} Find',
    '{green-fg}R{/green-fg} Replace'
  ]);
  commandPalette.setLabel(' Edit ');
  commandPalette.show();
  commandList.focus();
  screen.render();
}

function showViewMenu() {
  commandList.setItems([
    '{green-fg}E{/green-fg} Toggle Explorer',
    '{green-fg}T{/green-fg} Toggle Terminal',
    '{green-fg}A{/green-fg} Toggle AI Panel',
    '{green-fg}X{/green-fg} Show Extensions',
    '{green-fg}F{/green-fg} Toggle Fullscreen'
  ]);
  commandPalette.setLabel(' View ');
  commandPalette.show();
  commandList.focus();
  screen.render();
}

function showCommandPalette() {
  commandList.setItems(commands.map(cmd => `{green-fg}${cmd.key}{/green-fg} ${cmd.name}`));
  commandPalette.setLabel(' Command Palette ');
  commandPalette.show();
  commandList.focus();
  screen.render();
}

function hideCommandPalette() {
  commandPalette.hide();
  screen.render();
}

function runCode() {
  if (!state.currentFile) {
    terminalOutput.log('{yellow-fg}No file open to run{/yellow-fg}');
    return;
  }

  const ext = extname(state.currentFile);
  let cmd = '';

  switch (ext) {
    case '.js':
      cmd = 'node';
      break;
    case '.ts':
      cmd = 'npx tsx';
      break;
    case '.py':
      cmd = 'python3';
      break;
    case '.sh':
      cmd = 'bash';
      break;
    default:
      terminalOutput.log(`{yellow-fg}Cannot run ${ext} files directly{/yellow-fg}`);
      return;
  }

  terminalOutput.log(`{cyan-fg}Running: ${cmd} ${state.currentFile}{/cyan-fg}`);
  
  exec(`${cmd} "${state.currentFile}"`, (error, stdout, stderr) => {
    if (error) {
      terminalOutput.log(`{red-fg}${error.message}{/red-fg}`);
      return;
    }
    if (stdout) terminalOutput.log(`{green-fg}${stdout}{/green-fg}`);
    if (stderr) terminalOutput.log(`{yellow-fg}${stderr}{/yellow-fg}`);
  });
}

function executeTerminalCommand(cmd) {
  exec(cmd, { cwd: state.currentDir }, (error, stdout, stderr) => {
    if (error) {
      terminalOutput.log(`{red-fg}${error.message}{/red-fg}`);
      return;
    }
    if (stdout) terminalOutput.log(stdout);
    if (stderr) terminalOutput.log(`{yellow-fg}${stderr}{/yellow-fg}`);
  });
}

function quit() {
  screen.destroy();
  process.exit(0);
}

// Event handlers
fileList.on('select', (item, index) => {
  if (index === 0) {
    // Go up
    state.currentDir = dirname(state.currentDir);
    loadDirectory(state.currentDir);
  } else {
    const file = state.files[index - 1];
    if (file.isDir) {
      state.currentDir = file.path;
      loadDirectory(state.currentDir);
    } else {
      openFile(file.path);
    }
  }
});

commandList.on('select', (item, index) => {
  hideCommandPalette();
  const action = commands[index]?.action;
  if (action) {
    switch (action) {
      case 'newFile':
        editor.setValue('');
        state.currentFile = null;
        editorBox.setLabel(' Editor - Untitled ');
        break;
      case 'saveFile':
        saveFile();
        break;
      case 'runCode':
        runCode();
        break;
      case 'toggleTerminal':
        toggleTerminal();
        break;
      case 'showExtensions':
        showExtensions();
        break;
      case 'toggleAI':
        toggleAI();
        break;
      case 'showHelp':
        showHelp();
        break;
      case 'quit':
        quit();
        break;
    }
  }
});

aiInput.on('submit', (value) => {
  if (!value.trim()) return;
  
  // Process AI command
  aiChat.setContent(aiChat.getContent() + `\n\n{cyan-fg}You:{/cyan-fg} ${value}`);
  
  // Simulate AI response (in production, this would call actual AI API)
  setTimeout(() => {
    let response = '';
    if (value.startsWith('/')) {
      const cmd = value.toLowerCase();
      if (cmd === '/help') {
        response = `{green-fg}Available commands:{/green-fg}
/help - Show this help
/provider - List AI providers
/model - List models
/clear - Clear chat
/code <prompt> - Generate code
/explain - Explain current file
/fix - Fix errors in current file`;
      } else if (cmd === '/provider') {
        response = `{green-fg}Available providers:{/green-fg}\n` + 
          aiProviders.map((p, i) => `${i === state.currentAIProvider ? '→ ' : '  '}${p.name}`).join('\n');
      } else if (cmd === '/clear') {
        aiChat.setContent(`{bold}{cyan-fg}AI Assistant Ready{/cyan-fg}{/bold}\n\nChat cleared.`);
        aiInput.clearValue();
        screen.render();
        return;
      } else {
        response = `{yellow-fg}Processing: ${value}{/yellow-fg}`;
      }
    } else {
      response = `{purple-fg}AI:{/purple-fg} I received your message: "${value}"\n\nIn production, I would process this with ${aiProviders[state.currentAIProvider].name} (${aiProviders[state.currentAIProvider].models[state.currentModel]}).`;
    }
    
    aiChat.setContent(aiChat.getContent() + `\n\n${response}`);
    aiInput.clearValue();
    screen.render();
  }, 500);
  
  aiInput.clearValue();
  screen.render();
});

terminalInput.on('submit', (value) => {
  if (!value.trim()) return;
  
  terminalOutput.log(`{cyan-fg}$ ${value}{/cyan-fg}`);
  executeTerminalCommand(value);
  terminalInput.clearValue();
  screen.render();
});

// Key bindings
screen.key(['escape', 'q'], () => {
  if (helpModal.visible) {
    hideHelp();
  } else if (commandPalette.visible) {
    hideCommandPalette();
  } else if (extensionsPanel.visible) {
    hideExtensions();
  } else if (state.terminalVisible) {
    toggleTerminal();
  } else {
    quit();
  }
});

screen.key(['C-k'], () => showCommandPalette());
screen.key(['C-s'], () => saveFile());
screen.key(['C-r'], () => runCode());
screen.key(['C-t'], () => toggleTerminal());
screen.key(['C-a'], () => toggleAI());
screen.key(['C-e'], () => showExtensions());
screen.key(['C-?'], () => showHelp());
screen.key(['C-q'], () => quit());

// Focus handling
screen.key(['tab'], () => {
  if (fileList.focused) {
    editor.focus();
  } else if (editor.focused) {
    aiInput.focus();
  } else {
    fileList.focus();
  }
});

// Append elements to screen
screen.append(header);
screen.append(menuBar);
screen.append(fileExplorer);
screen.append(editorBox);
screen.append(aiPanel);
screen.append(commandPalette);
screen.append(helpModal);
screen.append(extensionsPanel);
screen.append(terminalBox);
screen.append(statusBar);

// Initialize
loadDirectory(state.currentDir);
fileList.focus();

// Render
screen.render();

// Welcome message
terminalOutput.log(`{bold}{cyan-fg}Welcome to Nexus IDE TUI!{/cyan-fg}{/bold}`);
terminalOutput.log(`{text-dim}Type 'help' for available commands{/text-dim}`);

// Focus on file list
fileList.focus();
