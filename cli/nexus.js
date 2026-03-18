#!/usr/bin/env node

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                        NEXUS IDE CLI - TUI v2.0                           ║
 * ║                   Terminal User Interface Edition                         ║
 * ║                                                                           ║
 * ║   A complete terminal-based IDE with AI integration, file management,     ║
 * ║   code execution, and a beautiful TUI interface                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 * Installation:
 *   npx github:TheStrongestOfTomorrow/Nexus-IDE#cli
 * 
 * Usage:
 *   nexus              Launch TUI
 *   nexus ai "prompt"  Quick AI question
 *   nexus run file.js  Execute code
 *   nexus --help       Show all commands
 */

import { spawn, spawnSync, execSync } from 'child_process';
import { createServer } from 'http';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync, rmdirSync, renameSync, copyFileSync, watch } from 'fs';
import { join, dirname, basename, extname, resolve, relative, sep } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { homedir, tmpdir, platform, arch, release, cpus, freemem, totalmem, networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ═══════════════════════════════════════════════════════════════════════════
// TUI COMPONENTS & STYLING
// ═══════════════════════════════════════════════════════════════════════════

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', italic: '\x1b[3m', underline: '\x1b[4m',
  black: '\x1b[30m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m',
  bgBlack: '\x1b[40m', bgRed: '\x1b[41m', bgGreen: '\x1b[42m', bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m', bgMagenta: '\x1b[45m', bgCyan: '\x1b[46m', bgWhite: '\x1b[47m',
  // Extended colors
  orange: '\x1b[38;5;208m', pink: '\x1b[38;5;213m', purple: '\x1b[38;5;141m',
  lime: '\x1b[38;5;154m', teal: '\x1b[38;5;51m', gold: '\x1b[38;5;220m',
  // Bright colors
  brightBlack: '\x1b[90m', brightRed: '\x1b[91m', brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m', brightBlue: '\x1b[94m', brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m', brightWhite: '\x1b[97m',
};

// Box drawing characters
const box = {
  tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║',
  lt: '╠', rt: '╣', tt: '╦', bt: '╩', cr: '╬',
  // Rounded
  rtl: '╭', rtr: '╮', rbl: '╰', rbr: '╯',
  // Light
  ltl: '┌', ltr: '┐', lbl: '└', lbr: '┘', lh: '─', lv: '│',
  // Double
  dtl: '╔', dtr: '╗', dbl: '╚', dbr: '╝', dh: '═', dv: '║',
  // Progress
  full: '█', empty: '░', half: '▓', quarter: '▒',
  // Icons
  bullet: '●', circle: '○', square: '■', diamond: '◆',
  triRight: '▶', triDown: '▼', triLeft: '◀', triUp: '▲',
  check: '✓', cross: '✗', star: '★', heart: '♥',
  arrow: '→', arrowUp: '↑', arrowDown: '↓', arrowLeft: '←',
  ellipsis: '…', middot: '·', pipe: '│',
};

// Progress bar
function progressBar(percent, width = 30, label = '') {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar = c.cyan + box.full.repeat(filled) + c.dim + box.empty.repeat(empty) + c.reset;
  const pct = c.bold + percent.toString().padStart(3) + '%' + c.reset;
  return label ? `${label} ${bar} ${pct}` : `${bar} ${pct}`;
}

// Spinner
const spinners = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['─', '\\', '|', '/'],
  circle: ['◜', '◠', '◝', '◞', '◡', '◟'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
};
let spinnerFrame = 0;
let spinnerInterval = null;

function startSpinner(text = 'Loading') {
  stopSpinner();
  spinnerInterval = setInterval(() => {
    const frame = spinners.dots[spinnerFrame % spinners.dots.length];
    process.stdout.write(`\r${c.cyan}${frame}${c.reset} ${text}...`);
    spinnerFrame++;
  }, 80);
}

function stopSpinner() {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
  }
}

// Clear screen
const clear = () => process.stdout.write('\x1b[2J\x1b[H');

// Move cursor
const cursor = {
  up: (n = 1) => process.stdout.write(`\x1b[${n}A`),
  down: (n = 1) => process.stdout.write(`\x1b[${n}B`),
  left: (n = 1) => process.stdout.write(`\x1b[${n}D`),
  right: (n = 1) => process.stdout.write(`\x1b[${n}C`),
  to: (x, y) => process.stdout.write(`\x1b[${y};${x}H`),
  save: () => process.stdout.write('\x1b[s'),
  restore: () => process.stdout.write('\x1b[u'),
  hide: () => process.stdout.write('\x1b[?25l'),
  show: () => process.stdout.write('\x1b[?25h'),
};

// Get terminal size
function getTermSize() {
  return {
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  };
}

// Draw box
function drawBox(x, y, width, height, title = '', style = 'double') {
  const b = style === 'double' ? { tl: box.dtl, tr: box.dtr, bl: box.dbl, br: box.dbr, h: box.dh, v: box.dv } 
         : style === 'round' ? { tl: box.rtl, tr: box.rtr, bl: box.rbl, br: box.rbr, h: box.lh, v: box.lv }
         : { tl: box.ltl, tr: box.ltr, bl: box.lbl, br: box.lbr, h: box.lh, v: box.lv };
  
  cursor.to(x, y);
  const topLine = b.h.repeat(width - 2);
  const titlePad = title ? `${c.bold}${title}${c.reset}`.padStart(Math.floor((width + title.length) / 2)).padEnd(width - 2) : topLine;
  process.stdout.write(b.tl + (title ? titlePad : topLine) + b.tr);
  
  for (let i = 1; i < height - 1; i++) {
    cursor.to(x, y + i);
    process.stdout.write(b.v + ' '.repeat(width - 2) + b.v);
  }
  
  cursor.to(x, y + height - 1);
  process.stdout.write(b.bl + b.h.repeat(width - 2) + b.br);
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGO & BRANDING
// ═══════════════════════════════════════════════════════════════════════════

const logo = `
${c.cyan}${c.bold}███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗${c.reset}
${c.cyan}${c.bold}████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝${c.reset}
${c.cyan}${c.bold}██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗${c.reset}
${c.cyan}${c.bold}██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║${c.reset}
${c.cyan}${c.bold}██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║${c.reset}
${c.cyan}${c.bold}╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝${c.reset}
${c.magenta}     ★ Terminal User Interface ★ GitHub Only ★${c.reset}
`;

const logoSmall = `
${c.cyan}${c.bold}╔═╗╔═╗╔╦╗╦ ╦╔═╗╦ ╦${c.reset}
${c.cyan}${c.bold}║  ╠═╣ ║ ╠═╣║╣ ╚╦╝${c.reset}
${c.cyan}${c.bold}╚═╝╩ ╩ ╩ ╩ ╩╚═╝ ╩ ${c.reset}
`;

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const configPath = join(homedir(), '.nexus-ide', 'config.json');

let config = {
  apiKey: process.env.NEXUS_AI_KEY || '',
  provider: process.env.NEXUS_AI_PROVIDER || 'gemini',
  model: process.env.NEXUS_AI_MODEL || 'gemini-2.0-flash',
  workspace: process.cwd(),
  serverPort: 3000,
  theme: 'dark',
  autoSave: true,
  showHidden: false,
  editor: 'nano',
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
  const dir = dirname(configPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// ═══════════════════════════════════════════════════════════════════════════
// AI PROVIDERS (From Beta)
// ═══════════════════════════════════════════════════════════════════════════

const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    color: c.cyan,
    models: ['gemini-2.5-pro-preview-06-05', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  openai: {
    name: 'OpenAI',
    color: c.green,
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini', 'gpt-3.5-turbo'],
  },
  anthropic: {
    name: 'Anthropic Claude',
    color: c.orange,
    models: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022'],
  },
  xai: {
    name: 'xAI (Grok)',
    color: c.red,
    models: ['grok-3', 'grok-3-fast', 'grok-2-1212', 'grok-2-vision-1212'],
  },
  mistral: {
    name: 'Mistral AI',
    color: c.purple,
    models: ['mistral-large-latest', 'mistral-medium-latest', 'codestral-latest'],
  },
  deepseek: {
    name: 'DeepSeek',
    color: c.blue,
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-r1'],
  },
  groq: {
    name: 'Groq (Fast)',
    color: c.yellow,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  ollama: {
    name: 'Ollama (Local)',
    color: c.brightBlack,
    models: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'qwen2.5-coder'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// FILE SYSTEM UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

const FILE_ICONS = {
  '.ts': { icon: '🔷', color: c.blue },
  '.tsx': { icon: '⚛️', color: c.cyan },
  '.js': { icon: '🟨', color: c.yellow },
  '.jsx': { icon: '⚛️', color: c.cyan },
  '.py': { icon: '🐍', color: c.green },
  '.rs': { icon: '🦀', color: c.red },
  '.go': { icon: '🐹', color: c.cyan },
  '.java': { icon: '☕', color: c.red },
  '.kt': { icon: '🟣', color: c.purple },
  '.swift': { icon: '🍎', color: c.red },
  '.rb': { icon: '💎', color: c.red },
  '.php': { icon: '🐘', color: c.magenta },
  '.c': { icon: '🔵', color: c.blue },
  '.cpp': { icon: '🔵', color: c.blue },
  '.h': { icon: '📄', color: c.white },
  '.cs': { icon: '💜', color: c.purple },
  '.json': { icon: '📋', color: c.yellow },
  '.yaml': { icon: '⚙️', color: c.yellow },
  '.yml': { icon: '⚙️', color: c.yellow },
  '.toml': { icon: '⚙️', color: c.yellow },
  '.md': { icon: '📝', color: c.white },
  '.txt': { icon: '📄', color: c.white },
  '.html': { icon: '🌐', color: c.red },
  '.css': { icon: '🎨', color: c.blue },
  '.scss': { icon: '🎨', color: c.pink },
  '.less': { icon: '🎨', color: c.blue },
  '.svg': { icon: '🖼️', color: c.yellow },
  '.png': { icon: '🖼️', color: c.green },
  '.jpg': { icon: '🖼️', color: c.green },
  '.gif': { icon: '🎞️', color: c.green },
  '.mp4': { icon: '🎬', color: c.red },
  '.mp3': { icon: '🎵', color: c.green },
  '.zip': { icon: '📦', color: c.yellow },
  '.tar': { icon: '📦', color: c.yellow },
  '.gz': { icon: '📦', color: c.yellow },
  '.git': { icon: '📚', color: c.red },
  '.env': { icon: '🔐', color: c.yellow },
  '.sh': { icon: '💻', color: c.green },
  '.bash': { icon: '💻', color: c.green },
  '.zsh': { icon: '💻', color: c.green },
  '.sql': { icon: '🗃️', color: c.blue },
  '.dockerfile': { icon: '🐳', color: c.cyan },
  '.vue': { icon: '💚', color: c.green },
  '.svelte': { icon: '🔥', color: c.red },
};

function getFileIcon(filename) {
  const ext = extname(filename).toLowerCase();
  const name = basename(filename).toLowerCase();
  
  if (name === 'package.json') return { icon: '📦', color: c.red };
  if (name === 'readme.md') return { icon: '📖', color: c.cyan };
  if (name === 'license') return { icon: '📜', color: c.yellow };
  if (name === '.gitignore') return { icon: '🙈', color: c.red };
  if (name === 'dockerfile') return { icon: '🐳', color: c.cyan };
  if (name === '.env' || name.startsWith('.env.')) return { icon: '🔐', color: c.yellow };
  
  return FILE_ICONS[ext] || { icon: '📄', color: c.white };
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return d.toLocaleDateString();
}

function listFiles(dir = '.', showHidden = false) {
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
          const { icon, color } = getFileIcon(item);
          return {
            name: item,
            path: fullPath,
            isDir: stat.isDirectory(),
            size: stat.size,
            modified: stat.mtime,
            icon,
            color,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AI SERVICE
// ═══════════════════════════════════════════════════════════════════════════

async function callAI(messages, stream = false) {
  if (!config.apiKey) {
    return { error: 'No API key set. Run: nexus config' };
  }
  
  try {
    if (config.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'system', content: 'You are Nexus AI, a helpful coding assistant in a terminal IDE. Be concise and helpful.' }, ...messages],
          temperature: 0.7
        })
      });
      const data = await res.json();
      return { text: data.choices?.[0]?.message?.content || 'No response' };
    }
    
    if (config.provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 4096,
          system: 'You are Nexus AI, a helpful coding assistant in a terminal IDE. Be concise and helpful.',
          messages: messages
        })
      });
      const data = await res.json();
      return { text: data.content?.[0]?.text || 'No response' };
    }
    
    if (config.provider === 'deepseek') {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'system', content: 'You are Nexus AI, a helpful coding assistant.' }, ...messages],
          temperature: 0.7
        })
      });
      const data = await res.json();
      return { text: data.choices?.[0]?.message?.content || 'No response' };
    }
    
    return { error: `Provider '${config.provider}' not implemented yet` };
  } catch (err) {
    return { error: `API Error: ${err.message}` };
  }
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
    this.currentPath = process.cwd();
    this.messages = [];
    this.inputBuffer = '';
    this.statusMessage = '';
    this.statusColor = c.white;
    this.rl = null;
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
      const k = key.toString();
      
      // Exit on Ctrl+C
      if (k === '\u0003') {
        this.exit();
        return;
      }
      
      // Handle input based on current view
      this.handleInput(k);
    });
  }
  
  handleInput(key) {
    switch (this.currentView) {
      case 'main':
        this.handleMainMenu(key);
        break;
      case 'files':
        this.handleFilesView(key);
        break;
      case 'ai':
        this.handleAIView(key);
        break;
      case 'settings':
        this.handleSettingsView(key);
        break;
      case 'input':
        this.handleInputMode(key);
        break;
      case 'help':
        if (key === 'q' || key === '\u001b') this.goBack();
        break;
    }
  }
  
  handleMainMenu(key) {
    const options = [
      'start', 'files', 'ai', 'run', 'git', 'settings', 'help', 'exit'
    ];
    
    if (key === '\u001b[A') { // Up
      this.selectedOption = Math.max(0, this.selectedOption - 1);
      this.render();
    } else if (key === '\u001b[B') { // Down
      this.selectedOption = Math.min(options.length - 1, this.selectedOption + 1);
      this.render();
    } else if (key === '\r' || key === '\n') { // Enter
      this.selectOption(options[this.selectedOption]);
    } else if (key >= '1' && key <= '8') {
      this.selectOption(options[parseInt(key) - 1]);
    } else if (key === 'q') {
      this.exit();
    }
  }
  
  selectOption(option) {
    switch (option) {
      case 'start':
        this.startServer();
        break;
      case 'files':
        this.currentView = 'files';
        this.files = listFiles(this.currentPath, config.showHidden);
        this.selectedOption = 0;
        this.render();
        break;
      case 'ai':
        this.currentView = 'ai';
        this.selectedOption = 0;
        this.render();
        break;
      case 'run':
        this.showRunMenu();
        break;
      case 'git':
        this.showGitStatus();
        break;
      case 'settings':
        this.currentView = 'settings';
        this.selectedOption = 0;
        this.render();
        break;
      case 'help':
        this.currentView = 'help';
        this.render();
        break;
      case 'exit':
        this.exit();
        break;
    }
  }
  
  handleFilesView(key) {
    if (key === '\u001b[A') { // Up
      this.selectedOption = Math.max(0, this.selectedOption - 1);
      this.render();
    } else if (key === '\u001b[B') { // Down
      this.selectedOption = Math.min(this.files.length - 1, this.selectedOption + 1);
      this.render();
    } else if (key === '\r' || key === '\n') { // Enter
      if (this.files[this.selectedOption]) {
        const file = this.files[this.selectedOption];
        if (file.isDir) {
          this.currentPath = file.path;
          this.files = listFiles(this.currentPath, config.showHidden);
          this.selectedOption = 0;
        } else {
          this.viewFile(file.path);
        }
        this.render();
      }
    } else if (key === 'h') {
      this.currentPath = dirname(this.currentPath);
      this.files = listFiles(this.currentPath, config.showHidden);
      this.selectedOption = 0;
      this.render();
    } else if (key === 'e') {
      if (this.files[this.selectedOption]) {
        this.editFile(this.files[this.selectedOption].path);
      }
    } else if (key === 'd') {
      if (this.files[this.selectedOption]) {
        this.deleteFile(this.files[this.selectedOption].path);
      }
    } else if (key === 'n') {
      this.createNewFile();
    } else if (key === 'q' || key === '\u001b') {
      this.goBack();
    }
  }
  
  handleAIView(key) {
    if (key === 'c') {
      this.currentView = 'input';
      this.inputBuffer = '';
      this.inputMode = 'ai';
      this.render();
    } else if (key === 'h') {
      this.showAIHelp();
    } else if (key === 'q' || key === '\u001b') {
      this.goBack();
    }
  }
  
  handleSettingsView(key) {
    const options = ['provider', 'key', 'model', 'editor', 'theme', 'back'];
    
    if (key === '\u001b[A') {
      this.selectedOption = Math.max(0, this.selectedOption - 1);
      this.render();
    } else if (key === '\u001b[B') {
      this.selectedOption = Math.min(options.length - 1, this.selectedOption + 1);
      this.render();
    } else if (key === '\r' || key === '\n') {
      this.changeSetting(options[this.selectedOption]);
    } else if (key === 'q' || key === '\u001b') {
      this.goBack();
    }
  }
  
  handleInputMode(key) {
    if (key === '\u001b') { // Escape
      this.goBack();
    } else if (key === '\r' || key === '\n') { // Enter
      this.submitInput();
    } else if (key === '\u007f' || key === '\b') { // Backspace
      this.inputBuffer = this.inputBuffer.slice(0, -1);
      this.render();
    } else if (key.charCodeAt(0) >= 32) { // Printable
      this.inputBuffer += key;
      this.render();
    }
  }
  
  goBack() {
    this.currentView = 'main';
    this.selectedOption = 0;
    this.render();
  }
  
  async submitInput() {
    if (this.inputMode === 'ai') {
      this.currentView = 'ai';
      const prompt = this.inputBuffer;
      this.inputBuffer = '';
      
      this.statusMessage = 'Thinking...';
      this.statusColor = c.yellow;
      this.render();
      
      const response = await callAI([{ role: 'user', content: prompt }]);
      this.messages.push({ role: 'user', content: prompt });
      this.messages.push({ role: 'assistant', content: response.text || response.error });
      
      this.statusMessage = '';
      this.render();
    }
  }
  
  async startServer() {
    this.statusMessage = 'Starting server...';
    this.statusColor = c.yellow;
    this.render();
    
    const serverPath = join(rootDir, 'server.ts');
    const child = spawn('npx', ['tsx', serverPath], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PORT: String(config.serverPort) }
    });
    
    child.on('error', (err) => {
      this.statusMessage = `Error: ${err.message}`;
      this.statusColor = c.red;
      this.render();
    });
  }
  
  viewFile(filepath) {
    clear();
    console.log(logoSmall);
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
    cursor.show();
    process.stdin.setRawMode(false);
    
    spawnSync(config.editor, [filepath], { stdio: 'inherit' });
    
    process.stdin.setRawMode(true);
    cursor.hide();
    this.render();
  }
  
  deleteFile(filepath) {
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
  
  createNewFile() {
    this.currentView = 'input';
    this.inputMode = 'newfile';
    this.inputBuffer = '';
    this.render();
  }
  
  showRunMenu() {
    clear();
    console.log(logoSmall);
    console.log(`\n${c.bold}Run Code${c.reset}\n`);
    console.log(`  ${c.cyan}1.${c.reset} JavaScript/TypeScript file`);
    console.log(`  ${c.cyan}2.${c.reset} Python file`);
    console.log(`  ${c.cyan}3.${c.reset} Shell script`);
    console.log(`  ${c.cyan}4.${c.reset} Custom command`);
    console.log(`  ${c.cyan}q.${c.reset} Back\n`);
  }
  
  showGitStatus() {
    clear();
    console.log(logoSmall);
    console.log(`\n${c.bold}Git Status${c.reset}\n`);
    
    try {
      const status = execSync('git status --short', { encoding: 'utf-8' });
      const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      
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
  
  showAIHelp() {
    clear();
    console.log(logoSmall);
    console.log(`\n${c.bold}AI Commands${c.reset}\n`);
    console.log(`  ${c.cyan}c${c.reset} - Chat with AI`);
    console.log(`  ${c.cyan}e${c.reset} - Explain current file`);
    console.log(`  ${c.cyan}r${c.reset} - Refactor code`);
    console.log(`  ${c.cyan}t${c.reset} - Generate tests`);
    console.log(`  ${c.cyan}d${c.reset} - Generate documentation`);
    console.log(`  ${c.cyan}q${c.reset} - Back\n`);
  }
  
  changeSetting(option) {
    switch (option) {
      case 'provider':
        this.selectProvider();
        break;
      case 'key':
        this.setAPIKey();
        break;
      case 'model':
        this.selectModel();
        break;
      case 'editor':
        this.setEditor();
        break;
      case 'back':
        this.goBack();
        break;
    }
  }
  
  selectProvider() {
    const providers = Object.keys(AI_PROVIDERS);
    // Simplified: cycle through providers
    const currentIndex = providers.indexOf(config.provider);
    config.provider = providers[(currentIndex + 1) % providers.length];
    config.model = AI_PROVIDERS[config.provider].models[0];
    saveConfig();
    this.statusMessage = `Provider: ${AI_PROVIDERS[config.provider].name}`;
    this.statusColor = c.green;
    this.render();
  }
  
  setAPIKey() {
    this.currentView = 'input';
    this.inputMode = 'apikey';
    this.inputBuffer = '';
    this.render();
  }
  
  selectModel() {
    const models = AI_PROVIDERS[config.provider]?.models || [];
    const currentIndex = models.indexOf(config.model);
    config.model = models[(currentIndex + 1) % models.length];
    saveConfig();
    this.statusMessage = `Model: ${config.model}`;
    this.statusColor = c.green;
    this.render();
  }
  
  setEditor() {
    const editors = ['nano', 'vim', 'vi', 'code'];
    const currentIndex = editors.indexOf(config.editor);
    config.editor = editors[(currentIndex + 1) % editors.length];
    saveConfig();
    this.statusMessage = `Editor: ${config.editor}`;
    this.statusColor = c.green;
    this.render();
  }
  
  render() {
    cursor.hide();
    clear();
    
    console.log(logoSmall);
    
    switch (this.currentView) {
      case 'main':
        this.renderMainMenu();
        break;
      case 'files':
        this.renderFilesView();
        break;
      case 'ai':
        this.renderAIView();
        break;
      case 'settings':
        this.renderSettingsView();
        break;
      case 'input':
        this.renderInputView();
        break;
      case 'help':
        this.renderHelpView();
        break;
    }
    
    // Status bar
    if (this.statusMessage) {
      const { width, height } = getTermSize();
      cursor.to(1, height);
      console.log(`${this.statusColor}${' '.repeat(width)}${c.reset}`);
      cursor.to(1, height);
      console.log(`${this.statusColor} ${this.statusMessage} ${c.reset}`);
    }
  }
  
  renderMainMenu() {
    const { width, height } = getTermSize();
    
    console.log(`\n${c.bold}Welcome to Nexus IDE TUI${c.reset}\n`);
    console.log(`${c.dim}Version 2.0 • GitHub Only${c.reset}\n`);
    
    const options = [
      { key: '1', label: 'Start Web IDE Server', icon: '🚀', color: c.green },
      { key: '2', label: 'File Browser', icon: '📁', color: c.yellow },
      { key: '3', label: 'AI Assistant', icon: '🤖', color: c.magenta },
      { key: '4', label: 'Run Code', icon: '▶️', color: c.cyan },
      { key: '5', label: 'Git Status', icon: '📚', color: c.red },
      { key: '6', label: 'Settings', icon: '⚙️', color: c.white },
      { key: '7', label: 'Help', icon: '❓', color: c.blue },
      { key: '8', label: 'Exit', icon: '🚪', color: c.brightBlack },
    ];
    
    options.forEach((opt, i) => {
      const selected = i === this.selectedOption;
      const prefix = selected ? `${c.bgBlue} ${box.arrowRight} ` : '   ';
      const suffix = selected ? ` ${c.reset}` : '';
      console.log(`  ${prefix}${opt.icon} ${opt.key}. ${opt.label}${suffix}`);
    });
    
    console.log(`\n${c.dim}Use ↑↓ or 1-8 to select, Enter to confirm, Q to quit${c.reset}`);
    
    // Info box
    console.log(`\n${c.dim}${box.lh.repeat(40)}${c.reset}`);
    console.log(`${c.dim}Provider: ${c.reset}${AI_PROVIDERS[config.provider]?.name || config.provider}`);
    console.log(`${c.dim}Model: ${c.reset}${config.model}`);
    console.log(`${c.dim}Workspace: ${c.reset}${this.currentPath}`);
  }
  
  renderFilesView() {
    const { width, height } = getTermSize();
    
    console.log(`\n${c.bold}📁 File Browser${c.reset}\n`);
    console.log(`${c.dim}Path:${c.reset} ${this.currentPath}\n`);
    
    if (this.files.length === 0) {
      console.log(`  ${c.dim}Empty directory${c.reset}`);
    } else {
      const visibleFiles = this.files.slice(0, height - 10);
      
      visibleFiles.forEach((file, i) => {
        const selected = i === this.selectedOption;
        const prefix = selected ? `${c.bgBlue} ${box.arrowRight} ` : '   ';
        const suffix = selected ? ` ${c.reset}` : '';
        const size = file.isDir ? '' : formatSize(file.size);
        
        console.log(`${prefix}${file.icon} ${file.name} ${c.dim}${size}${suffix}`);
      });
      
      if (this.files.length > height - 10) {
        console.log(`\n${c.dim}... ${this.files.length - (height - 10)} more items${c.reset}`);
      }
    }
    
    console.log(`\n${c.dim}${box.lh.repeat(40)}${c.reset}`);
    console.log(`${c.dim}↑↓ Navigate • Enter Open • E Edit • D Delete • N New • H Back • Q Quit${c.reset}`);
  }
  
  renderAIView() {
    const { width, height } = getTermSize();
    
    console.log(`\n${c.bold}🤖 AI Assistant${c.reset}\n`);
    console.log(`${c.dim}Provider: ${config.provider} • Model: ${config.model}${c.reset}\n`);
    
    const visibleMessages = this.messages.slice(-(height - 12));
    
    visibleMessages.forEach(msg => {
      const isUser = msg.role === 'user';
      const icon = isUser ? '👤' : '🤖';
      const color = isUser ? c.cyan : c.magenta;
      
      console.log(`${icon} ${color}${isUser ? 'You' : 'AI'}:${c.reset}`);
      console.log(`  ${msg.content.slice(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`);
    });
    
    if (this.messages.length === 0) {
      console.log(`${c.dim}No messages yet. Press C to start chatting.${c.reset}`);
    }
    
    console.log(`\n${c.dim}${box.lh.repeat(40)}${c.reset}`);
    console.log(`${c.dim}C Chat • H Help • Q Back${c.reset}`);
  }
  
  renderSettingsView() {
    console.log(`\n${c.bold}⚙️ Settings${c.reset}\n`);
    
    const options = [
      { label: 'AI Provider', value: AI_PROVIDERS[config.provider]?.name || config.provider, key: '1' },
      { label: 'API Key', value: config.apiKey ? '****' + config.apiKey.slice(-4) : 'Not set', key: '2' },
      { label: 'AI Model', value: config.model, key: '3' },
      { label: 'Editor', value: config.editor, key: '4' },
      { label: 'Theme', value: config.theme, key: '5' },
      { label: 'Back', value: '', key: 'q' },
    ];
    
    options.forEach((opt, i) => {
      const selected = i === this.selectedOption;
      const prefix = selected ? `${c.bgBlue} ${box.arrowRight} ` : '   ';
      const suffix = selected ? ` ${c.reset}` : '';
      const value = opt.value ? `${c.dim}${opt.value}${c.reset}` : '';
      console.log(`${prefix}${opt.key}. ${opt.label}: ${value}${suffix}`);
    });
    
    console.log(`\n${c.dim}Press Enter to change, Q to go back${c.reset}`);
  }
  
  renderInputView() {
    const { width, height } = getTermSize();
    
    const prompts = {
      ai: 'Enter your message:',
      apikey: 'Enter your API key:',
      newfile: 'Enter new file name:',
      command: 'Enter command:',
    };
    
    const prompt = prompts[this.inputMode] || 'Input:';
    
    console.log(`\n${c.bold}${prompt}${c.reset}\n`);
    console.log(`${c.cyan}> ${c.reset}${this.inputBuffer}${c.brightBlack}█${c.reset}`);
    console.log(`\n${c.dim}Enter to submit • Esc to cancel${c.reset}`);
  }
  
  renderHelpView() {
    console.log(`\n${c.bold}❓ Help${c.reset}\n`);
    
    console.log(`${c.cyan}Navigation${c.reset}`);
    console.log(`  ↑↓     Navigate menus`);
    console.log(`  Enter  Select option`);
    console.log(`  Q/Esc  Go back / Quit`);
    
    console.log(`\n${c.cyan}File Browser${c.reset}`);
    console.log(`  Enter  Open file/folder`);
    console.log(`  E      Edit file`);
    console.log(`  D      Delete file`);
    console.log(`  N      Create new file`);
    console.log(`  H      Go to parent folder`);
    
    console.log(`\n${c.cyan}AI Chat${c.reset}`);
    console.log(`  C      Start chat`);
    console.log(`  H      AI help`);
    
    console.log(`\n${c.cyan}Quick Commands${c.reset}`);
    console.log(`  nexus start        Start web IDE`);
    console.log(`  nexus ai "prompt"  Ask AI`);
    console.log(`  nexus run file.js  Execute code`);
    console.log(`  nexus config       Open settings`);
    
    console.log(`\n${c.dim}Press Q to go back${c.reset}`);
  }
  
  exit() {
    cursor.show();
    clear();
    console.log(`\n${c.cyan}Thanks for using Nexus IDE! 👋${c.reset}\n`);
    process.exit(0);
  }
  
  async mainLoop() {
    // Keep the process alive
    while (this.running) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK COMMANDS (Non-TUI)
// ═══════════════════════════════════════════════════════════════════════════

function showHelp() {
  console.log(logo);
  console.log(`
${c.bold}USAGE${c.reset}
  nexus [command] [options]

${c.bold}COMMANDS${c.reset}
  ${c.cyan}IDE & Server${c.reset}
  start, server        Start web IDE server
  open                 Open IDE in browser
  
  ${c.cyan}AI Assistant${c.reset}
  ai <prompt>          Ask AI assistant
  chat                 Interactive AI chat
  explain <file>       AI explains code
  refactor <file>      AI refactors code
  
  ${c.cyan}Files${c.reset}
  ls [path]            List files
  cat <file>           View file
  edit <file>          Edit file
  create <file>        Create new file
  
  ${c.cyan}Execution${c.reset}
  run <file>           Execute code
  
  ${c.cyan}Config${c.reset}
  config               Open settings
  keys                 Manage API keys
  
  ${c.cyan}Other${c.reset}
  help, --help         Show this help
  version, --version   Show version
  tui                  Launch TUI (default)

${c.bold}OPTIONS${c.reset}
  -p, --port <n>       Server port
  -d, --dir <path>     Working directory

${c.bold}EXAMPLES${c.reset}
  nexus                        ${c.dim}# Launch TUI${c.reset}
  nexus start --port 8080      ${c.dim}# Start server${c.reset}
  nexus ai "Fix this bug"      ${c.dim}# Ask AI${c.reset}
  nexus run main.ts            ${c.dim}# Run TypeScript${c.reset}

${c.bold}INSTALLATION${c.reset}
  npx github:TheStrongestOfTomorrow/Nexus-IDE#cli
`);
}

function showVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
    console.log(`Nexus IDE CLI v${pkg.version} (TUI)`);
  } catch {
    console.log('Nexus IDE CLI v2.0.0 (TUI)');
  }
}

async function quickAI(prompt) {
  loadConfig();
  if (!config.apiKey) {
    console.log(`${c.red}Error: No API key set. Run: nexus config${c.reset}`);
    return;
  }
  if (!prompt) {
    console.log(`${c.red}Error: Please provide a prompt${c.reset}`);
    return;
  }
  
  console.log(`\n${c.cyan}Thinking...${c.reset}`);
  const response = await callAI([{ role: 'user', content: prompt }]);
  console.log(`\n${c.magenta}AI:${c.reset} ${response.text || response.error}\n`);
}

async function explainFile(filepath) {
  loadConfig();
  if (!existsSync(filepath)) {
    console.log(`${c.red}Error: File not found: ${filepath}${c.reset}`);
    return;
  }
  
  const code = readFileSync(filepath, 'utf-8');
  await quickAI(`Explain this code in detail:\n\`\`\`\n${code}\n\`\`\``);
}

function listFilesCLI(dir = '.') {
  const files = listFiles(dir, config.showHidden);
  console.log(`\n${c.cyan}${resolve(dir)}${c.reset}\n`);
  files.forEach(f => {
    const size = f.isDir ? '' : formatSize(f.size);
    console.log(`  ${f.icon} ${f.name} ${c.dim}${size}${c.reset}`);
  });
  console.log();
}

function viewFileCLI(filepath) {
  if (!existsSync(filepath)) {
    console.log(`${c.red}Error: File not found${c.reset}`);
    return;
  }
  console.log(`\n${c.cyan}${filepath}${c.reset}\n`);
  console.log(readFileSync(filepath, 'utf-8'));
}

function editFileCLI(filepath) {
  const editors = ['nano', 'vim', 'vi'];
  for (const ed of editors) {
    try {
      execSync(`which ${ed}`, { stdio: 'ignore' });
      spawnSync(ed, [filepath], { stdio: 'inherit' });
      return;
    } catch {}
  }
  console.log(`${c.red}No editor found. Install nano or vim.${c.reset}`);
}

function runFileCLI(filepath) {
  if (!existsSync(filepath)) {
    console.log(`${c.red}Error: File not found${c.reset}`);
    return;
  }
  
  const ext = extname(filepath);
  const runners = {
    '.js': 'node',
    '.ts': 'npx tsx',
    '.py': 'python3',
    '.sh': 'bash',
  };
  
  const runner = runners[ext];
  if (!runner) {
    console.log(`${c.red}Unsupported file type: ${ext}${c.reset}`);
    return;
  }
  
  console.log(`${c.cyan}Running: ${filepath}${c.reset}\n`);
  spawnSync(`${runner} ${filepath}`, { stdio: 'inherit', shell: true });
}

function configCLI() {
  loadConfig();
  console.log(`\n${c.bold}Current Configuration${c.reset}\n`);
  console.log(`  Provider: ${AI_PROVIDERS[config.provider]?.name || config.provider}`);
  console.log(`  Model: ${config.model}`);
  console.log(`  API Key: ${config.apiKey ? '****' + config.apiKey.slice(-4) : 'Not set'}`);
  console.log(`  Editor: ${config.editor}`);
  console.log(`  Workspace: ${config.workspace}`);
  console.log(`\nConfig file: ${configPath}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

loadConfig();

const args = process.argv.slice(2);

// No args = Launch TUI
if (args.length === 0) {
  const tui = new NexusTUI();
  tui.start();
} else {
  const cmd = args[0];
  
  switch (cmd) {
    case 'start':
    case 'server':
      loadConfig();
      const port = args.includes('-p') ? args[args.indexOf('-p') + 1] : 
                   args.includes('--port') ? args[args.indexOf('--port') + 1] : config.serverPort;
      console.log(logo);
      console.log(`${c.cyan}Starting Nexus IDE on port ${port}...${c.reset}\n`);
      spawn('npx', ['tsx', join(rootDir, 'server.ts')], {
        cwd: rootDir,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PORT: String(port) }
      });
      break;
      
    case 'ai':
      quickAI(args.slice(1).join(' '));
      break;
      
    case 'explain':
      explainFile(args[1]);
      break;
      
    case 'chat':
      const tui = new NexusTUI();
      tui.currentView = 'ai';
      tui.start();
      break;
      
    case 'ls':
    case 'dir':
      listFilesCLI(args[1]);
      break;
      
    case 'cat':
    case 'view':
      viewFileCLI(args[1]);
      break;
      
    case 'edit':
      editFileCLI(args[1]);
      break;
      
    case 'run':
      runFileCLI(args[1]);
      break;
      
    case 'config':
      configCLI();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    case 'version':
    case '--version':
    case '-v':
      showVersion();
      break;
      
    case 'tui':
      const tuiApp = new NexusTUI();
      tuiApp.start();
      break;
      
    default:
      console.log(`${c.red}Unknown command: ${cmd}${c.reset}`);
      console.log(`Run ${c.cyan}nexus help${c.reset} for usage.`);
  }
}
