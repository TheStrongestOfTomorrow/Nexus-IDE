#!/usr/bin/env node

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     NEXUS IDE CLI - TUI v5.0.0                           ║
 * ║                    Terminal User Interface Edition                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 * IMPORTANT: This TUI operates on the USER'S files, not the package source!
 */

import { spawn, spawnSync, execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname, basename, extname, resolve, homedir } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { homedir as getHome, platform, arch, cpus, freemem, totalmem, networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// COLORS & STYLING
// ═══════════════════════════════════════════════════════════════════════════

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m',
  orange: '\x1b[38;5;208m', purple: '\x1b[38;5;141m',
  bgBlue: '\x1b[44m', bgMagenta: '\x1b[45m',
};

const box = {
  tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║',
  lh: '─', lv: '│', 
  full: '█', empty: '░',
  arrow: '→', arrowUp: '↑', arrowDown: '↓',
  check: '✓', cross: '✗', star: '★',
};

const clear = () => process.stdout.write('\x1b[2J\x1b[H');
const cursor = {
  hide: () => process.stdout.write('\x1b[?25l'),
  show: () => process.stdout.write('\x1b[?25h'),
  to: (x, y) => process.stdout.write(`\x1b[${y};${x}H`),
};

function getTermSize() {
  return { width: process.stdout.columns || 80, height: process.stdout.rows || 24 };
}

const logo = `
${c.cyan}${c.bold}███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝${c.reset}
${c.magenta}     ★ Terminal User Interface ★ v5.0.0 ★${c.reset}
`;

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const configDir = join(getHome(), '.nexus-ide');
const configPath = join(configDir, 'config.json');

let config = {
  apiKey: process.env.NEXUS_AI_KEY || '',
  provider: process.env.NEXUS_AI_PROVIDER || 'gemini',
  model: process.env.NEXUS_AI_MODEL || 'gemini-2.0-flash',
  editor: 'nano',
  theme: 'dark',
  showHidden: false,
  serverPort: 3000,
};

function loadConfig() {
  try {
    if (existsSync(configPath)) {
      const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
      config = { ...config, ...saved };
    }
  } catch {}
}

function saveConfig() {
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// ══════════════════════════════════════════════════════════════════════════
function saveConfig() {
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// ═══════════════════════════════════════════════════════════════════════════
// AI PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════

const AI_PROVIDERS = {
  gemini: { name: 'Google Gemini', color: c.cyan, models: ['gemini-2.5-pro-preview-06-05', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  openai: { name: 'OpenAI', color: c.green, models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini', 'gpt-3.5-turbo'] },
  anthropic: { name: 'Anthropic Claude', color: c.orange, models: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022'] },
  xai: { name: 'xAI (Grok)', color: c.red, models: ['grok-3', 'grok-3-fast', 'grok-2-1212'] },
  mistral: { name: 'Mistral AI', color: c.purple, models: ['mistral-large-latest', 'mistral-medium-latest', 'codestral-latest'] },
  deepseek: { name: 'DeepSeek', color: c.blue, models: ['deepseek-chat', 'deepseek-coder', 'deepseek-r1'] },
  groq: { name: 'Groq (Fast)', color: c.yellow, models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'] },
  ollama: { name: 'Ollama (Local)', color: c.white, models: ['llama3.2', 'llama3.1', 'mistral', 'codellama'] },
};

async function callAI(messages) {
  if (!config.apiKey) return { error: 'No API key set. Run: nexus config' };
  
  try {
    if (config.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
        })
      });
      const data = await res.json();
      return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response' };
    }
    if (config.provider === 'openai' || config.provider === 'groq') {
      const baseUrl = config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'system', content: 'You are Nexus AI, a helpful coding assistant in a terminal IDE.' }, ...messages],
          temperature: 0.7
        })
      });
      const data = await res.json();
      return { text: data.choices?.[0]?.message?.content || 'No response' };
    }
    if (config.provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 4096,
          system: 'You are Nexus AI, a helpful coding assistant.',
          messages: messages
        })
      });
      const data = await res.json();
      return { text: data.content?.[0]?.text || 'No response' };
    }
    return { error: `Provider '${config.provider}' not implemented` };
  } catch (err) {
    return { error: `API Error: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const FILE_ICONS = {
  '.ts': '🔷', '.tsx': '⚛️', '.js': '🟨', '.jsx': '⚛️', '.py': '🐍', '.rs': '🦀',
  '.go': '🐹', '.java': '☕', '.json': '📋', '.md': '📝', '.txt': '📄',
  '.html': '🌐', '.css': '🎨', '.scss': '🎨', '.yaml': '⚙️', '.yml': '⚙️',
  '.sh': '💻', '.env': '🔐', '.sql': '🗃️', '.dockerfile': '🐳',
};

function getFileIcon(filename) {
  const ext = extname(filename).toLowerCase();
  const name = basename(filename).toLowerCase();
  if (name === 'package.json') return '📦';
  if (name === 'readme.md') return '📖';
  if (name === '.gitignore') return '🙈';
  if (name.startsWith('.env')) return '🔐';
  return FILE_ICONS[ext] || '📄';
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function listFiles(dir, showHidden = false) {
  const path = resolve(dir);
  if (!existsSync(path)) return [];
  
  try {
    const items = readdirSync(path);
    return items
      .filter(item => showHidden || !item.startsWith('.'))
      .map(item => {
        const fullPath = join(path, item);
        try {
          const stat = statSync(fullPath);
          return {
            name: item,
            path: fullPath,
            isDir: stat.isDirectory(),
            size: stat.size,
            icon: getFileIcon(item),
          };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════════════════════
// TUI APPLICATION
// ═══════════════════════════════════════════════════════════════════════════

class NexusTUI {
  constructor() {
    this.running = true;
    this.currentView = 'main';
    this.selectedOption = 0;
    this.files = [];
    // USE USER'S CURRENT DIRECTORY, NOT PACKAGE DIRECTORY!
    this.currentPath = process.env.NEXUS_WORKDIR || process.cwd();
    this.messages = [];
    this.inputBuffer = '';
    this.statusMessage = '';
    this.statusColor = c.white;
  }
  
  async start() {
    loadConfig();
    this.setupInput();
    this.render();
    await this.mainLoop();
  }
  
  setupInput() {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (key) => {
      if (key === '\u0003') { this.exit(); return; }
      this.handleInput(key.toString());
    });
  }
  
  handleInput(key) {
    const views = {
      main: () => this.handleMainMenu(key),
      files: () => this.handleFilesView(key),
      ai: () => this.handleAIView(key),
      settings: () => this.handleSettingsView(key),
      input: () => this.handleInputMode(key),
      help: () => { if (key === 'q' || key === '\u001b') this.goBack(); },
      run: () => this.handleRunView(key),
      git: () => { if (key) this.goBack(); },
    };
    views[this.currentView]?.();
  }
  
  handleMainMenu(key) {
    const options = ['files', 'ai', 'run', 'git', 'settings', 'help', 'exit'];
    if (key === '\u001b[A') { this.selectedOption = Math.max(0, this.selectedOption - 1); this.render(); }
    else if (key === '\u001b[B') { this.selectedOption = Math.min(options.length, this.selectedOption + 1); this.render(); }
    else if (key === '\r' || key === '\n') this.selectOption(options[this.selectedOption]);
    else if (key >= '1' && key <= '7') this.selectOption(options[parseInt(key) - 1]);
    else if (key === 'q') this.exit();
  }
  
  selectOption(option) {
    switch (option) {
      case 'files':
        this.currentView = 'files';
        this.files = listFiles(this.currentPath, config.showHidden);
        this.selectedOption = 0;
        break;
      case 'ai':
        this.currentView = 'ai';
        break;
      case 'run':
        this.currentView = 'run';
        break;
      case 'git':
        this.showGitStatus();
        break;
      case 'settings':
        this.currentView = 'settings';
        this.selectedOption = 0;
        break;
      case 'help':
        this.currentView = 'help';
        break;
      case 'exit':
        this.exit();
        break;
    }
    this.render();
  }
  
  handleFilesView(key) {
    if (key === '\u001b[A') { this.selectedOption = Math.max(0, this.selectedOption - 1); this.render(); }
    else if (key === '\u001b[B') { this.selectedOption = Math.min(this.files.length, this.selectedOption + 1); this.render(); }
    else if (key === '\r' || key === '\n') {
      const file = this.files[this.selectedOption];
      if (file) {
        if (file.isDir) {
          this.currentPath = file.path;
          this.files = listFiles(this.currentPath, config.showHidden);
          this.selectedOption = 0;
        } else {
          this.viewFile(file.path);
        }
        this.render();
      }
    }
    else if (key === 'h') {
      this.currentPath = dirname(this.currentPath);
      this.files = listFiles(this.currentPath, config.showHidden);
      this.selectedOption = 0;
      this.render();
    }
    else if (key === 'e') this.editFile(this.files[this.selectedOption]?.path);
    else if (key === 'd') this.deleteFile(this.files[this.selectedOption]?.path);
    else if (key === 'n') { this.currentView = 'input'; this.inputMode = 'newfile'; this.inputBuffer = ''; this.render(); }
    else if (key === 'q' || key === '\u001b') this.goBack();
  }
  
  handleAIView(key) {
    if (key === 'c') {
      this.currentView = 'input';
      this.inputMode = 'ai';
      this.inputBuffer = '';
      this.render();
    } else if (key === 'q' || key === '\u001b') {
      this.goBack();
    }
  }
  
  handleSettingsView(key) {
    const options = ['provider', 'key', 'model', 'editor', 'hidden', 'back'];
    if (key === '\u001b[A') { this.selectedOption = Math.max(0, this.selectedOption - 1); this.render(); }
    else if (key === '\u001b[B') { this.selectedOption = Math.min(options.length - 1, this.selectedOption + 1); this.render(); }
    else if (key === '\r' || key === '\n') this.changeSetting(options[this.selectedOption]);
    else if (key === 'q' || key === '\u001b') this.goBack();
  }
  
  handleInputMode(key) {
    if (key === '\u001b') this.goBack();
    else if (key === '\r' || key === '\n') this.submitInput();
    else if (key === '\u007f' || key === '\b') { this.inputBuffer = this.inputBuffer.slice(0, -1); this.render(); }
    else if (key.charCodeAt(0) >= 32) { this.inputBuffer += key; this.render(); }
  }
  
  handleRunView(key) {
    if (key === 'q' || key === '\u001b') this.goBack();
    else if (key >= '1' && key <= '4') this.runCode(parseInt(key));
  }
  
  goBack() {
    this.currentView = 'main';
    this.selectedOption = 0;
    this.render();
  }
  
  async submitInput() {
    if (this.inputMode === 'ai') {
      const prompt = this.inputBuffer;
      this.inputBuffer = '';
      this.currentView = 'ai';
      this.statusMessage = 'Thinking...';
      this.statusColor = c.yellow;
      this.render();
      
      const response = await callAI([{ role: 'user', content: prompt }]);
      this.messages.push({ role: 'user', content: prompt });
      this.messages.push({ role: 'assistant', content: response.text || response.error });
      this.statusMessage = '';
      this.render();
    } else if (this.inputMode === 'newfile') {
      const filepath = join(this.currentPath, this.inputBuffer);
      writeFileSync(filepath, '');
      this.files = listFiles(this.currentPath, config.showHidden);
      this.goBack();
    } else if (this.inputMode === 'apikey') {
      config.apiKey = this.inputBuffer;
      saveConfig();
      this.statusMessage = 'API Key saved!';
      this.statusColor = c.green;
      this.goBack();
    }
  }
  
  viewFile(filepath) {
    clear();
    console.log(logo);
    console.log(`${c.cyan}${box.lh.repeat(50)}${c.reset}\n`);
    console.log(`${c.bold}File:${c.reset} ${filepath}\n`);
    
    try {
      const content = readFileSync(filepath, 'utf-8');
      const lines = content.split('\n');
      const maxLines = Math.min(lines.length, getTermSize().height - 8);
      
      lines.slice(0, maxLines).forEach((line, i) => {
        const num = c.dim + (i + 1).toString().padStart(4) + c.reset;
        console.log(`${num} ${line}`);
      });
      
      if (lines.length > maxLines) {
        console.log(`\n${c.dim}... ${lines.length - maxLines} more lines${c.reset}`);
      }
    } catch (err) {
      console.log(`${c.red}Error: ${err.message}${c.reset}`);
    }
    
    console.log(`\n${c.dim}Press any key to go back...${c.reset}`);
  }
  
  editFile(filepath) {
    if (!filepath) return;
    cursor.show();
    process.stdin.setRawMode(false);
    
    spawnSync(config.editor, [filepath], { stdio: 'inherit' });
    
    process.stdin.setRawMode(true);
    cursor.hide();
    this.render();
  }
  
  deleteFile(filepath) {
    if (!filepath) return;
    try {
      unlinkSync(filepath);
      this.files = listFiles(this.currentPath, config.showHidden);
      this.selectedOption = Math.min(this.selectedOption, this.files.length - 1);
      this.statusMessage = `Deleted: ${basename(filepath)}`;
      this.statusColor = c.green;
    } catch (err) {
      this.statusMessage = `Error: ${err.message}`;
      this.statusColor = c.red;
    }
    this.render();
  }
  
  runCode(option) {
    clear();
    console.log(logo);
    
    switch (option) {
      case 1:
        console.log(`\n${c.cyan}Run JavaScript/TypeScript:${c.reset}`);
        this.inputBuffer = '';
        this.inputMode = 'command';
        this.render();
        break;
      case 2:
        console.log(`\n${c.cyan}Run Python:${c.reset}`);
        this.inputBuffer = '';
        this.inputMode = 'command';
        this.render();
        break;
      case 3:
        console.log(`\n${c.cyan}Shell Command:${c.reset}`);
        this.inputBuffer = '';
        this.inputMode = 'command';
        this.render();
        break;
      case 4:
        this.goBack();
        break;
    }
  }
  
  showGitStatus() {
    clear();
    console.log(logo);
    console.log(`\n${c.bold}Git Status${c.reset}\n`);
    
    try {
      const status = execSync('git status --short', { encoding: 'utf-8', cwd: this.currentPath });
      const branch = execSync('git branch --show-current', { encoding: 'utf-8', cwd: this.currentPath }).trim();
      
      console.log(`${c.cyan}Branch:${c.reset} ${branch}\n`);
      
      if (status.trim()) {
        console.log(status);
      } else {
        console.log(`${c.green}Working tree clean${c.reset}`);
      }
    } catch {
      console.log(`${c.red}Not a git repository${c.reset}`);
    }
    
    console.log(`\n${c.dim}Press any key to go back...${c.reset}`);
  }
  
  changeSetting(option) {
    switch (option) {
      case 'provider':
        const providers = Object.keys(AI_PROVIDERS);
        const idx = providers.indexOf(config.provider);
        config.provider = providers[(idx + 1) % providers.length];
        config.model = AI_PROVIDERS[config.provider].models[0];
        saveConfig();
        this.statusMessage = `Provider: ${AI_PROVIDERS[config.provider].name}`;
        this.statusColor = c.green;
        break;
      case 'key':
        this.currentView = 'input';
        this.inputMode = 'apikey';
        this.inputBuffer = '';
        break;
      case 'model':
        const models = AI_PROVIDERS[config.provider]?.models || [];
        const midx = models.indexOf(config.model);
        config.model = models[(midx + 1) % models.length];
        saveConfig();
        this.statusMessage = `Model: ${config.model}`;
        this.statusColor = c.green;
        break;
      case 'editor':
        const editors = ['nano', 'vim', 'vi', 'code'];
        const eidx = editors.indexOf(config.editor);
        config.editor = editors[(eidx + 1) % editors.length];
        saveConfig();
        this.statusMessage = `Editor: ${config.editor}`;
        this.statusColor = c.green;
        break;
      case 'hidden':
        config.showHidden = !config.showHidden;
        saveConfig();
        this.statusMessage = `Show Hidden: ${config.showHidden}`;
        this.statusColor = c.green;
        break;
      case 'back':
        this.goBack();
        return;
    }
    this.render();
  }
  
  render() {
    cursor.hide();
    clear();
    
    console.log(logo);
    
    const renderers = {
      main: () => this.renderMainMenu(),
      files: () => this.renderFilesView(),
      ai: () => this.renderAIView(),
      settings: () => this.renderSettingsView(),
      input: () => this.renderInputView(),
      help: () => this.renderHelpView(),
      run: () => this.renderRunView(),
    };
    
    renderers[this.currentView]?.();
    
    // Status bar
    if (this.statusMessage) {
      const { height } = getTermSize();
      cursor.to(1, height);
      console.log(`${this.statusColor} ${this.statusMessage} ${c.reset}`);
    }
  }
  
  renderMainMenu() {
    console.log(`\n${c.bold}Welcome to Nexus IDE TUI${c.reset}\n`);
    console.log(`${c.dim}Version 5.0.0 • Terminal IDE${c.reset}\n`);
    
    const options = [
      { key: '1', label: 'File Browser', icon: '📁' },
      { key: '2', label: 'AI Assistant', icon: '🤖' },
      { key: '3', label: 'Run Code', icon: '▶️' },
      { key: '4', label: 'Git Status', icon: '📚' },
      { key: '5', label: 'Settings', icon: '⚙️' },
      { key: '6', label: 'Help', icon: '❓' },
      { key: '7', label: 'Exit', icon: '🚪' },
    ];
    
    options.forEach((opt, i) => {
      const selected = i === this.selectedOption;
      const prefix = selected ? `${c.bgBlue} ${box.arrow} ` : '   ';
      const suffix = selected ? ` ${c.reset}` : '';
      console.log(`  ${prefix}${opt.icon} ${opt.key}. ${opt.label}${suffix}`);
    });
    
    console.log(`\n${c.dim}↑↓ Navigate • Enter Select • Q Quit${c.reset}`);
    console.log(`\n${c.dim}${box.lh.repeat(40)}${c.reset}`);
    console.log(`${c.dim}Provider: ${c.reset}${AI_PROVIDERS[config.provider]?.name || config.provider}`);
    console.log(`${c.dim}Model: ${c.reset}${config.model}`);
    console.log(`${c.dim}Working Dir: ${c.reset}${this.currentPath}`);
  }
  
  renderFilesView() {
    console.log(`\n${c.bold}📁 File Browser${c.reset}\n`);
    console.log(`${c.dim}Path:${c.reset} ${this.currentPath}\n`);
    
    if (this.files.length === 0) {
      console.log(`  ${c.dim}Empty directory${c.reset}`);
    } else {
      const { height } = getTermSize();
      const visibleFiles = this.files.slice(0, height - 10);
      
      visibleFiles.forEach((file, i) => {
        const selected = i === this.selectedOption;
        const prefix = selected ? `${c.bgBlue} ${box.arrow} ` : '   ';
        const suffix = selected ? ` ${c.reset}` : '';
        const size = file.isDir ? '' : formatSize(file.size);
        
        console.log(`${prefix}${file.icon} ${file.name} ${c.dim}${size}${suffix}`);
      });
      
      if (this.files.length > height - 10) {
        console.log(`\n${c.dim}... ${this.files.length - (height - 10)} more items${c.reset}`);
      }
    }
    
    console.log(`\n${c.dim}${box.lh.repeat(40)}${c.reset}`);
    console.log(`${c.dim}↑↓ Nav • Enter Open • E Edit • D Delete • N New • H Up • Q Back${c.reset}`);
  }
  
  renderAIView() {
    console.log(`\n${c.bold}🤖 AI Assistant${c.reset}\n`);
    console.log(`${c.dim}Provider: ${config.provider} • Model: ${config.model}${c.reset}\n`);
    
    const { height } = getTermSize();
    const visibleMessages = this.messages.slice(-(height - 12));
    
    visibleMessages.forEach(msg => {
      const isUser = msg.role === 'user';
      const icon = isUser ? '👤' : '🤖';
      const color = isUser ? c.cyan : c.magenta;
      
      console.log(`${icon} ${color}${isUser ? 'You' : 'AI'}:${c.reset}`);
      console.log(`  ${msg.content.slice(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`);
    });
    
    if (this.messages.length === 0) {
      console.log(`${c.dim}No messages. Press C to chat with AI.${c.reset}`);
    }
    
    console.log(`\n${c.dim}${box.lh.repeat(40)}${c.reset}`);
    console.log(`${c.dim}C Chat • Q Back${c.reset}`);
  }
  
  renderSettingsView() {
    console.log(`\n${c.bold}⚙️ Settings${c.reset}\n`);
    
    const options = [
      { label: 'AI Provider', value: AI_PROVIDERS[config.provider]?.name || config.provider },
      { label: 'API Key', value: config.apiKey ? '****' + config.apiKey.slice(-4) : 'Not set' },
      { label: 'AI Model', value: config.model },
      { label: 'Editor', value: config.editor },
      { label: 'Show Hidden', value: config.showHidden ? 'Yes' : 'No' },
      { label: 'Back', value: '' },
    ];
    
    options.forEach((opt, i) => {
      const selected = i === this.selectedOption;
      const prefix = selected ? `${c.bgBlue} ${box.arrow} ` : '   ';
      const suffix = selected ? ` ${c.reset}` : '';
      const value = opt.value ? `${c.dim}${opt.value}${c.reset}` : '';
      console.log(`${prefix}${opt.label}: ${value}${suffix}`);
    });
    
    console.log(`\n${c.dim}Press Enter to change • Q Back${c.reset}`);
  }
  
  renderInputView() {
    const prompts = {
      ai: 'Message:',
      apikey: 'API Key:',
      newfile: 'File Name:',
      command: 'Command:',
    };
    
    console.log(`\n${c.bold}${prompts[this.inputMode] || 'Input:'}${c.reset}\n`);
    console.log(`${c.cyan}> ${c.reset}${this.inputBuffer}${c.brightBlack}█${c.reset}`);
    console.log(`\n${c.dim}Enter Submit • Esc Cancel${c.reset}`);
  }
  
  renderHelpView() {
    console.log(`\n${c.bold}❓ Help - Keyboard Shortcuts${c.reset}\n`);
    
    console.log(`${c.cyan}Main Menu${c.reset}`);
    console.log(`  ↑↓     Navigate options`);
    console.log(`  1-7    Quick select`);
    console.log(`  Enter  Confirm`);
    console.log(`  Q      Quit`);
    
    console.log(`\n${c.cyan}File Browser${c.reset}`);
    console.log(`  Enter  Open file/folder`);
    console.log(`  E      Edit file`);
    console.log(`  D      Delete file`);
    console.log(`  N      Create new file`);
    console.log(`  H      Go to parent folder`);
    
    console.log(`\n${c.cyan}AI Chat${c.reset}`);
    console.log(`  C      Start chat`);
    
    console.log(`\n${c.dim}Press Q to go back${c.reset}`);
  }
  
  renderRunView() {
    console.log(`\n${c.bold}▶️ Run Code${c.reset}\n`);
    console.log(`  ${c.cyan}1.${c.reset} JavaScript/TypeScript`);
    console.log(`  ${c.cyan}2.${c.reset} Python`);
    console.log(`  ${c.cyan}3.${c.reset} Shell Command`);
    console.log(`  ${c.cyan}4.${c.reset} Back\n`);
  }
  
  exit() {
    cursor.show();
    clear();
    console.log(`\n${c.cyan}Thanks for using Nexus IDE! 👋${c.reset}\n`);
    process.exit(0);
  }
  
  async mainLoop() {
    while (this.running) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.length === 0) {
  const tui = new NexusTUI();
  tui.start();
} else {
  const cmd = args[0];
  
  switch (cmd) {
    case 'ls':
      const dir = args[1] || process.cwd();
      const files = listFiles(dir);
      console.log(`\n${c.cyan}${resolve(dir)}${c.reset}\n`);
      files.forEach(f => console.log(`  ${f.icon} ${f.name} ${c.dim}${f.isDir ? '' : formatSize(f.size)}${c.reset}`));
      console.log();
      break;
      
    case 'cat':
      if (!args[1]) { console.log(`${c.red}Usage: nexus cat <file>${c.reset}`); break; }
      try {
        console.log(readFileSync(args[1], 'utf-8'));
      } catch (err) {
        console.log(`${c.red}Error: ${err.message}${c.reset}`);
      }
      break;
      
    case 'run':
      if (!args[1]) { console.log(`${c.red}Usage: nexus run <file>${c.reset}`); break; }
      const ext = extname(args[1]);
      const runners = { '.js': 'node', '.ts': 'npx tsx', '.py': 'python3', '.sh': 'bash' };
      if (!runners[ext]) { console.log(`${c.red}Unknown file type: ${ext}${c.reset}`); break; }
      spawnSync(`${runners[ext]} "${args[1]}"`, { stdio: 'inherit', shell: true });
      break;
      
    case 'ai':
      if (!args[1]) { console.log(`${c.red}Usage: nexus ai "your prompt"${c.reset}`); break; }
      loadConfig();
      console.log(`\n${c.cyan}Thinking...${c.reset}`);
      (async () => {
        const response = await callAI([{ role: 'user', content: args.slice(1).join(' ') }]);
        console.log(`\n${c.magenta}AI:${c.reset} ${response.text || response.error}\n`);
      })();
      break;
      
    case 'config':
      loadConfig();
      console.log(`\n${c.bold}Current Configuration${c.reset}\n`);
      console.log(`  Provider: ${AI_PROVIDERS[config.provider]?.name || config.provider}`);
      console.log(`  Model: ${config.model}`);
      console.log(`  API Key: ${config.apiKey ? '****' + config.apiKey.slice(-4) : 'Not set'}`);
      console.log(`  Editor: ${config.editor}`);
      console.log(`  Working Dir: ${process.cwd()}`);
      console.log(`\nConfig file: ${configPath}\n`);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log(logo);
      console.log(`
${c.bold}USAGE${c.reset}
  nexus [command]

${c.bold}COMMANDS${c.reset}
  nexus              Launch TUI
  nexus ls [dir]     List files
  nexus cat <file>   View file
  nexus run <file>   Execute code
  nexus ai "prompt"  Ask AI
  nexus config       View settings

${c.bold}OPTIONS${c.reset}
  --help, -h         Show this help
  --version, -v      Show version

${c.bold}EXAMPLES${c.reset}
  nexus                    ${c.dim}# Launch TUI${c.reset}
  nexus ls                 ${c.dim}# List current dir${c.reset}
  nexus run main.ts        ${c.dim}# Run TypeScript${c.reset}
  nexus ai "Fix this bug"  ${c.dim}# Ask AI${c.reset}

${c.bold}ENVIRONMENT${c.reset}
  NEXUS_WORKDIR      Working directory (default: current dir)
  NEXUS_AI_KEY       AI API key
  NEXUS_AI_PROVIDER  AI provider (gemini, openai, etc)
  NEXUS_AI_MODEL     AI model name
`);
      break;
      
    case '--version':
    case '-v':
      console.log('Nexus IDE CLI v5.0.0');
      break;
      
    default:
      console.log(`${c.red}Unknown command: ${cmd}${c.reset}`);
      console.log(`Run ${c.cyan}nexus --help${c.reset} for usage.`);
  }
}
