#!/usr/bin/env node

/**
 * Nexus IDE CLI - Full Terminal IDE Experience
 * 
 * A complete command-line interface for Nexus IDE
 * Access your IDE, AI assistant, files, and more - all from terminal!
 * 
 * Usage:
 *   npx github:TheStrongestOfTomorrow/Nexus-IDE#cli
 *   nexus                    Start interactive IDE
 *   nexus ai "your prompt"   Ask AI assistant
 *   nexus run file.js        Execute code
 *   nexus edit file.ts       Edit file in terminal
 */

import { spawn, execSync, spawnSync } from 'child_process';
import { createServer } from 'http';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync, rmdirSync, watch } from 'fs';
import { join, dirname, basename, extname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { homedir, tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  white: '\x1b[37m', bgBlue: '\x1b[44m', bgMagenta: '\x1b[45m',
};

// Logo
const logo = `
${c.cyan}${c.bold}
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
${c.reset}${c.magenta}★ Terminal IDE • AI-Powered • GitHub Only ★${c.reset}
`;

// State
let config = {
  apiKey: process.env.NEXUS_AI_KEY || '',
  provider: process.env.NEXUS_AI_PROVIDER || 'gemini',
  model: process.env.NEXUS_AI_MODEL || 'gemini-2.0-flash',
  workspace: process.cwd(),
  serverPort: 3000,
};

const configPath = join(homedir(), '.nexus-ide', 'config.json');

// Load config
function loadConfig() {
  try {
    if (existsSync(configPath)) {
      const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
      config = { ...config, ...saved };
    }
  } catch {}
}

// Save config
function saveConfig() {
  const dir = dirname(configPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Logging
const log = {
  info: (msg) => console.log(`${c.cyan}ℹ${c.reset} ${msg}`),
  success: (msg) => console.log(`${c.green}✓${c.reset} ${msg}`),
  warn: (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`),
  error: (msg) => console.log(`${c.red}✗${c.reset} ${msg}`),
  dim: (msg) => console.log(`${c.dim}${msg}${c.reset}`),
};

// Clear screen
const clear = () => process.stdout.write('\x1b[2J\x1b[H');

// Show help
function showHelp() {
  console.log(logo);
  console.log(`
${c.bold}USAGE${c.reset}
  nexus [command] [options]

${c.bold}COMMANDS${c.reset}
  ${c.cyan}IDE & Server${c.reset}
  start, server        Start web IDE server
  open                 Open IDE in browser
  tunnel               Create public tunnel (ngrok)
  
  ${c.cyan}AI Assistant${c.reset}
  ai <prompt>          Ask AI assistant
  chat                 Start interactive AI chat
  explain <file>       AI explains code
  refactor <file>      AI refactors code
  test <file>          AI generates tests
  docs <file>          AI generates documentation
  
  ${c.cyan}File Operations${c.reset}
  ls [path]            List files
  cat <file>           View file content
  edit <file>          Edit file in terminal
  create <file>        Create new file
  rm <file>            Delete file
  mv <src> <dest>      Move/rename file
  cp <src> <dest>      Copy file
  mkdir <path>         Create directory
  
  ${c.cyan}Code Execution${c.reset}
  run <file>           Execute code file
  repl [lang]          Start REPL (js/ts/py)
  test                 Run tests
  
  ${c.cyan}Project${c.reset}
  init [name]          Initialize new project
  info                 Show project info
  deps                 Manage dependencies
  build                Build project
  
  ${c.cyan}Git${c.reset}
  status               Git status
  commit <msg>         Commit changes
  push                 Push to remote
  pull                 Pull from remote
  
  ${c.cyan}Configuration${c.reset}
  config               Show/edit configuration
  keys                 Manage API keys
  
  ${c.cyan}Utils${c.reset}
  help, --help         Show this help
  version, --version   Show version
  update               Update Nexus CLI

${c.bold}OPTIONS${c.reset}
  -p, --port <n>       Server port (default: 3000)
  -d, --dir <path>     Working directory
  --provider <name>    AI provider (gemini/openai/anthropic)
  --model <name>       AI model to use
  --no-color           Disable colors

${c.bold}EXAMPLES${c.reset}
  nexus                          ${c.dim}# Start interactive mode${c.reset}
  nexus start --port 8080        ${c.dim}# Start server on port 8080${c.reset}
  nexus ai "Fix this bug"        ${c.dim}# Ask AI for help${c.reset}
  nexus run main.ts              ${c.dim}# Run TypeScript file${c.reset}
  nexus edit src/App.tsx         ${c.dim}# Edit file in terminal${c.reset}
  nexus explain complex.js       ${c.dim}# AI explains code${c.reset}

${c.bold}ENVIRONMENT${c.reset}
  NEXUS_AI_KEY         AI API key
  NEXUS_AI_PROVIDER    Default AI provider
  NEXUS_AI_MODEL       Default AI model

${c.bold}INSTALL${c.reset}
  npx github:TheStrongestOfTomorrow/Nexus-IDE#cli
`);
}

// Show version
function showVersion() {
  const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
  console.log(`Nexus IDE CLI v${pkg.version}`);
}

// Interactive menu
async function interactiveMenu() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const question = (q) => new Promise(r => rl.question(q, r));
  
  const menu = `
${logo}
${c.bold}What would you like to do?${c.reset}

  ${c.cyan}1.${c.reset} Start Web IDE Server
  ${c.cyan}2.${c.reset} Open AI Chat
  ${c.cyan}3.${c.reset} Browse Files
  ${c.cyan}4.${c.reset} Run Code
  ${c.cyan}5.${c.reset} Edit File
  ${c.cyan}6.${c.reset} Project Info
  ${c.cyan}7.${c.reset} Git Status
  ${c.cyan}8.${c.reset} Settings
  ${c.cyan}9.${c.reset} Exit

${c.dim}Or type a command directly (e.g., 'ai help me debug')${c.reset}
`;
  
  while (true) {
    console.log(menu);
    const choice = await question(`${c.green}❯${c.reset} `);
    
    switch (choice.trim()) {
      case '1': await startServer(); break;
      case '2': await chatAI(rl); break;
      case '3': await browseFiles(rl); break;
      case '4': await runCode(rl); break;
      case '5': await editFilePrompt(rl); break;
      case '6': projectInfo(); break;
      case '7': gitStatus(); break;
      case '8': await settings(rl); break;
      case '9': case 'exit': case 'quit':
        console.log(`\n${c.cyan}Goodbye! 👋${c.reset}\n`);
        rl.close();
        process.exit(0);
      default:
        if (choice.trim()) {
          await executeCommand(choice.trim());
        }
    }
  }
}

// Execute command
async function executeCommand(input) {
  const parts = input.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);
  
  switch (cmd) {
    case 'ai': return askAI(args.join(' '));
    case 'ls': case 'dir': return listFiles(args[0]);
    case 'cat': case 'view': return viewFile(args[0]);
    case 'run': return runFile(args[0]);
    case 'edit': return editFile(args[0]);
    case 'create': return createFile(args[0]);
    case 'rm': case 'del': return deleteFile(args[0]);
    case 'mkdir': return createDir(args[0]);
    case 'cd': if (args[0]) process.chdir(args[0]); break;
    case 'clear': clear(); break;
    case 'help': showHelp(); break;
    default: log.error(`Unknown command: ${cmd}`);
  }
}

// Start server
async function startServer(port = config.serverPort) {
  console.log(logo);
  log.info(`Starting Nexus IDE server on port ${port}...`);
  
  const serverPath = join(rootDir, 'server.ts');
  const child = spawn('npx', ['tsx', serverPath], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: String(port) }
  });
  
  child.on('error', (err) => log.error(err.message));
}

// AI Chat
async function chatAI(rl) {
  if (!config.apiKey) {
    log.error('No API key set. Run: nexus config');
    return;
  }
  
  console.log(`\n${c.cyan}${c.bold}Nexus AI Chat${c.reset} (type 'exit' to quit)\n`);
  
  const messages = [];
  
  while (true) {
    const input = await rl.question(`${c.green}You:${c.reset} `);
    if (input.toLowerCase() === 'exit') break;
    if (!input.trim()) continue;
    
    messages.push({ role: 'user', content: input });
    
    process.stdout.write(`${c.magenta}AI:${c.reset} `);
    const response = await callAI(messages);
    console.log(response);
    messages.push({ role: 'assistant', content: response });
  }
}

// Ask AI
async function askAI(prompt) {
  if (!config.apiKey) {
    log.error('No API key set. Run: nexus config');
    return;
  }
  
  if (!prompt) {
    log.error('Please provide a prompt: nexus ai "your question"');
    return;
  }
  
  console.log(`\n${c.cyan}Thinking...${c.reset}`);
  const response = await callAI([{ role: 'user', content: prompt }]);
  console.log(`\n${c.magenta}AI:${c.reset} ${response}\n`);
}

// Call AI API
async function callAI(messages) {
  try {
    const endpoints = {
      gemini: `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
    };
    
    if (config.provider === 'gemini') {
      const res = await fetch(endpoints.gemini, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        })
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    }
    
    if (config.provider === 'openai') {
      const res = await fetch(endpoints.openai, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'system', content: 'You are Nexus AI, a helpful coding assistant.' }, ...messages]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || 'No response';
    }
    
    return 'Provider not supported yet';
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

// Explain code
async function explainCode(filepath) {
  if (!existsSync(filepath)) return log.error(`File not found: ${filepath}`);
  const code = readFileSync(filepath, 'utf-8');
  await askAI(`Explain this code:\n\`\`\`\n${code}\n\`\`\``);
}

// List files
function listFiles(dir = '.') {
  const path = resolve(dir);
  if (!existsSync(path)) return log.error(`Directory not found: ${path}`);
  
  console.log(`\n${c.cyan}${c.bold}${path}${c.reset}\n`);
  
  const items = readdirSync(path);
  for (const item of items) {
    const stat = statSync(join(path, item));
    const icon = stat.isDirectory() ? '📁' : getFileIcon(item);
    const size = stat.isFile() ? formatSize(stat.size) : '';
    console.log(`  ${icon} ${item} ${c.dim}${size}${c.reset}`);
  }
  console.log();
}

// Get file icon
function getFileIcon(filename) {
  const ext = extname(filename);
  const icons = {
    '.ts': '🔷', '.tsx': '⚛️', '.js': '🟨', '.jsx': '⚛️',
    '.py': '🐍', '.rs': '🦀', '.go': '🐹', '.java': '☕',
    '.json': '📋', '.md': '📝', '.css': '🎨', '.html': '🌐',
    '.yaml': '⚙️', '.yml': '⚙️', '.toml': '⚙️',
    '.png': '🖼️', '.jpg': '🖼️', '.svg': '🎨',
    '.git': '📚', '.env': '🔐',
  };
  return icons[ext] || '📄';
}

// Format size
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// View file
function viewFile(filepath) {
  if (!existsSync(filepath)) return log.error(`File not found: ${filepath}`);
  const content = readFileSync(filepath, 'utf-8');
  console.log(`\n${c.cyan}${c.bold}${filepath}${c.reset}\n`);
  console.log(content);
}

// Edit file
async function editFile(filepath) {
  if (!filepath) return log.error('Please specify a file: nexus edit <file>');
  if (!existsSync(filepath)) {
    log.warn(`File doesn't exist. Creating: ${filepath}`);
    writeFileSync(filepath, '');
  }
  
  const editors = ['nano', 'vim', 'vi'];
  for (const ed of editors) {
    try {
      execSync(`which ${ed}`, { stdio: 'ignore' });
      spawnSync(ed, [filepath], { stdio: 'inherit' });
      return;
    } catch {}
  }
  
  // Fallback to simple editor
  await simpleEditor(filepath);
}

// Simple editor
async function simpleEditor(filepath) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const content = existsSync(filepath) ? readFileSync(filepath, 'utf-8') : '';
  
  console.log(`\n${c.cyan}Editing: ${filepath}${c.reset}`);
  console.log(`${c.dim}Type your content. Ctrl+D or '.' on empty line to save.${c.reset}\n`);
  
  const lines = content.split('\n');
  let current = [...lines];
  
  for (const line of current) {
    console.log(line);
  }
  
  const question = (q) => new Promise(r => rl.question(q, r));
  
  while (true) {
    const line = await question('');
    if (line === '.') break;
    current.push(line);
  }
  
  writeFileSync(filepath, current.join('\n'));
  log.success(`Saved: ${filepath}`);
  rl.close();
}

// Run file
function runFile(filepath) {
  if (!existsSync(filepath)) return log.error(`File not found: ${filepath}`);
  
  const ext = extname(filepath);
  const runners = {
    '.js': 'node',
    '.ts': 'npx tsx',
    '.py': 'python3',
    '.sh': 'bash',
    '.go': 'go run',
    '.rs': 'rustc && ./',
  };
  
  const runner = runners[ext];
  if (!runner) return log.error(`Unknown file type: ${ext}`);
  
  log.info(`Running: ${filepath}`);
  spawnSync(`${runner} ${filepath}`, { stdio: 'inherit', shell: true });
}

// Create file
function createFile(filepath) {
  if (existsSync(filepath)) return log.error(`File exists: ${filepath}`);
  writeFileSync(filepath, '');
  log.success(`Created: ${filepath}`);
}

// Delete file
function deleteFile(filepath) {
  if (!existsSync(filepath)) return log.error(`Not found: ${filepath}`);
  unlinkSync(filepath);
  log.success(`Deleted: ${filepath}`);
}

// Create directory
function createDir(dirpath) {
  if (existsSync(dirpath)) return log.error(`Exists: ${dirpath}`);
  mkdirSync(dirpath, { recursive: true });
  log.success(`Created: ${dirpath}`);
}

// Project info
function projectInfo() {
  const pkgPath = join(process.cwd(), 'package.json');
  if (!existsSync(pkgPath)) return log.error('No package.json found');
  
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  
  console.log(`\n${c.cyan}${c.bold}${pkg.name || 'Project'}${c.reset}`);
  console.log(`  Version: ${pkg.version || 'N/A'}`);
  console.log(`  Description: ${pkg.description || 'N/A'}`);
  if (pkg.dependencies) {
    console.log(`\n${c.bold}Dependencies:${c.reset}`);
    Object.entries(pkg.dependencies).forEach(([name, ver]) => {
      console.log(`  ${c.green}●${c.reset} ${name} ${c.dim}${ver}${c.reset}`);
    });
  }
  console.log();
}

// Git status
function gitStatus() {
  try {
    execSync('git status --short', { stdio: 'inherit' });
  } catch {
    log.error('Not a git repository');
  }
}

// Settings
async function settings(rl) {
  const question = (q) => new Promise(r => rl.question(q, r));
  
  console.log(`\n${c.cyan}${c.bold}Settings${c.reset}\n`);
  console.log(`Current AI Provider: ${config.provider}`);
  console.log(`Current Model: ${config.model}`);
  console.log(`API Key: ${config.apiKey ? '****' + config.apiKey.slice(-4) : 'Not set'}`);
  
  console.log(`\n${c.bold}Options:${c.reset}`);
  console.log(`  1. Set AI Provider`);
  console.log(`  2. Set API Key`);
  console.log(`  3. Set Model`);
  console.log(`  4. Back`);
  
  const choice = await question('\nChoice: ');
  
  switch (choice) {
    case '1':
      const provider = await question('Provider (gemini/openai/anthropic): ');
      config.provider = provider;
      saveConfig();
      log.success('Provider saved');
      break;
    case '2':
      const key = await question('API Key: ');
      config.apiKey = key;
      saveConfig();
      log.success('API Key saved');
      break;
    case '3':
      const model = await question('Model: ');
      config.model = model;
      saveConfig();
      log.success('Model saved');
      break;
  }
}

// Browse files
async function browseFiles(rl) {
  const question = (q) => new Promise(r => rl.question(q, r));
  
  let currentDir = process.cwd();
  
  while (true) {
    listFiles(currentDir);
    console.log(`${c.dim}Enter folder name, 'back', or 'exit'${c.reset}`);
    const input = await question(`${c.green}❯${c.reset} `);
    
    if (input === 'exit') break;
    if (input === 'back' || input === '..') {
      currentDir = dirname(currentDir);
    } else if (existsSync(join(currentDir, input)) && statSync(join(currentDir, input)).isDirectory()) {
      currentDir = join(currentDir, input);
    } else if (input) {
      // Try to view file
      if (existsSync(join(currentDir, input))) {
        viewFile(join(currentDir, input));
      }
    }
  }
}

// Run code prompt
async function runCodePrompt(rl) {
  const question = (q) => new Promise(r => rl.question(q, r));
  const file = await question('File to run: ');
  if (file) runFile(file);
}

// Edit file prompt
async function editFilePrompt(rl) {
  const question = (q) => new Promise(r => rl.question(q, r));
  const file = await question('File to edit: ');
  if (file) await editFile(file);
}

// Main
loadConfig();

const args = process.argv.slice(2);
const commands = {
  'start': startServer,
  'server': startServer,
  'ai': () => askAI(args.slice(1).join(' ')),
  'chat': () => chatAI(createInterface({ input: process.stdin, output: process.stdout })),
  'explain': () => explainCode(args[1]),
  'ls': () => listFiles(args[1]),
  'cat': () => viewFile(args[1]),
  'view': () => viewFile(args[1]),
  'edit': () => editFile(args[1]),
  'create': () => createFile(args[1]),
  'rm': () => deleteFile(args[1]),
  'mkdir': () => createDir(args[1]),
  'run': () => runFile(args[1]),
  'info': projectInfo,
  'status': gitStatus,
  'config': () => settings(createInterface({ input: process.stdin, output: process.stdout })),
  'help': showHelp,
  '--help': showHelp,
  'version': showVersion,
  '--version': showVersion,
};

if (args.length === 0) {
  interactiveMenu();
} else {
  const cmd = commands[args[0]];
  if (cmd) {
    cmd();
  } else if (args[0].startsWith('-')) {
    // Handle options
    let i = 0;
    while (i < args.length) {
      if (args[i] === '-p' || args[i] === '--port') {
        config.serverPort = parseInt(args[++i]);
      } else if (args[i] === '-d' || args[i] === '--dir') {
        process.chdir(args[++i]);
      }
      i++;
    }
    startServer();
  } else {
    log.error(`Unknown command: ${args[0]}`);
    console.log('Run `nexus help` for usage.');
  }
}
