#!/usr/bin/env node

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    NEXUS IDE PROFESSIONAL v1.0.0                          ║
 * ║                   The Ultimate Office-Ready IDE                           ║
 * ║                                                                           ║
 * ║   CLI (TUI) + Web modes • AI Integration • Collaboration • Enterprise    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 * Installation:
 *   npx github:TheStrongestOfTomorrow/Nexus-IDE#professional
 * 
 * Usage:
 *   nexus-pro            Choose mode (CLI/Web)
 *   nexus-pro tui        Launch TUI mode
 *   nexus-pro web        Launch Web mode
 *   nexus-pro --help     Show all commands
 */

import { spawn, spawnSync, execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m',
  bgBlue: '\x1b[44m', bgMagenta: '\x1b[45m',
};

const logo = `
${c.cyan}${c.bold}███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝${c.reset}
${c.magenta}     ★ Professional Edition ★ CLI + Web ★${c.reset}
`;

function showHelp() {
  console.log(logo);
  console.log(`
${c.bold}USAGE${c.reset}
  nexus-pro [command] [options]

${c.bold}MODES${c.reset}
  ${c.cyan}Interactive Mode${c.reset}
  nexus-pro              Choose between CLI and Web mode

  ${c.cyan}CLI/TUI Mode${c.reset}
  nexus-pro tui          Launch Terminal User Interface
  nexus-pro cli          Same as tui
  nexus-pro chat         Open AI chat in TUI

  ${c.cyan}Web Mode${c.reset}
  nexus-pro web          Start web IDE server
  nexus-pro start        Same as web
  nexus-pro serve        Build and serve production

${c.bold}QUICK COMMANDS${c.reset}
  ${c.cyan}AI Assistant${c.reset}
  nexus-pro ai "prompt"    Ask AI a question
  nexus-pro explain file   AI explains code

  ${c.cyan}Files${c.reset}
  nexus-pro ls [path]      List files
  nexus-pro cat file       View file
  nexus-pro edit file      Edit file
  nexus-pro run file       Execute code

  ${c.cyan}Config${c.reset}
  nexus-pro config         Show configuration
  nexus-pro keys           Manage API keys

${c.bold}OPTIONS${c.reset}
  -p, --port <n>       Server port (default: 3000)
  -d, --dir <path>     Working directory
  --tui                Force TUI mode
  --web                Force Web mode

${c.bold}FEATURES${c.reset}
  ${c.green}✓${c.reset} Dual Mode (CLI + Web)
  ${c.green}✓${c.reset} 12+ AI Providers
  ${c.green}✓${c.reset} Real-time Collaboration
  ${c.green}✓${c.reset} Git Integration
  ${c.green}✓${c.reset} Extensions Support
  ${c.green}✓${c.reset} Office Tools Integration

${c.bold}EXAMPLES${c.reset}
  ${c.cyan}# Interactive mode selection${c.reset}
  nexus-pro

  ${c.cyan}# Force TUI mode${c.reset}
  nexus-pro tui

  ${c.cyan}# Start web server on custom port${c.reset}
  nexus-pro web --port 8080

  ${c.cyan}# Quick AI question${c.reset}
  nexus-pro ai "How do I center a div?"

${c.bold}INSTALLATION${c.reset}
  npx github:TheStrongestOfTomorrow/Nexus-IDE#professional
`);
}

function showVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
    console.log(`Nexus IDE Professional v${pkg.version}`);
  } catch {
    console.log('Nexus IDE Professional v1.0.0');
  }
}

function showModeSelector() {
  console.log(logo);
  console.log(`
${c.bold}Welcome to Nexus IDE Professional!${c.reset}

${c.dim}Choose your mode:${c.reset}

  ${c.bgMagenta} 1. Terminal Mode (TUI) ${c.reset}    ${c.dim}Full IDE in your terminal${c.reset}
  ${c.bgBlue} 2. Web Mode ${c.reset}               ${c.dim}Browser-based IDE${c.reset}

  ${c.cyan}3.${c.reset} Quick Commands      ${c.dim}AI, files, config${c.reset}
  ${c.cyan}4.${c.reset} Help               ${c.dim}Show all options${c.reset}
  ${c.cyan}5.${c.reset} Exit               ${c.dim}Quit${c.reset}

${c.dim}Type a number and press Enter, or use:${c.reset}
  ${c.cyan}nexus-pro tui${c.reset}  for Terminal mode
  ${c.cyan}nexus-pro web${c.reset}  for Web mode
`);
}

async function interactiveMode() {
  showModeSelector();
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(`${c.cyan}Your choice: ${c.reset}`, (answer) => {
    rl.close();
    
    switch (answer.trim()) {
      case '1':
        launchTUI();
        break;
      case '2':
        launchWeb();
        break;
      case '3':
        showQuickCommands();
        break;
      case '4':
        showHelp();
        break;
      case '5':
        console.log(`\n${c.cyan}Thanks for using Nexus IDE! 👋${c.reset}\n`);
        process.exit(0);
        break;
      default:
        console.log(`\n${c.red}Invalid option. Use 'nexus-pro --help' for usage.${c.reset}\n`);
    }
  });
}

function showQuickCommands() {
  console.log(logo);
  console.log(`
${c.bold}Quick Commands${c.reset}

${c.cyan}AI Commands:${c.reset}
  nexus-pro ai "your question"    Ask AI
  nexus-pro explain file.js       Explain code
  nexus-pro chat                  Open AI chat

${c.cyan}File Commands:${c.reset}
  nexus-pro ls                    List files
  nexus-pro cat file.js           View file
  nexus-pro edit file.js          Edit file
  nexus-pro run file.js           Execute code

${c.cyan}Server:${c.reset}
  nexus-pro web --port 8080       Start web server
  nexus-pro serve                 Production server

${c.cyan}Config:${c.reset}
  nexus-pro config                View settings
`);
}

function launchTUI() {
  console.log(`\n${c.cyan}Launching Terminal User Interface...${c.reset}\n`);
  
  try {
    // Check if blessed is installed
    require.resolve('blessed');
  } catch (e) {
    console.log(`${c.yellow}Installing TUI dependencies...${c.reset}`);
    execSync('npm install blessed', { cwd: rootDir, stdio: 'inherit' });
  }
  
  const tuiPath = join(rootDir, 'cli', 'tui', 'index.js');
  spawn('node', [tuiPath], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });
}

function launchWeb(port = 3000) {
  console.log(`\n${c.cyan}Starting Nexus IDE Web Server...${c.reset}`);
  console.log(`${c.green}Server will run at http://localhost:${port}${c.reset}\n`);
  
  const serverPath = join(rootDir, 'server.ts');
  spawn('npx', ['tsx', serverPath], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: String(port) }
  });
}

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  interactiveMode();
} else {
  const cmd = args[0];
  
  switch (cmd) {
    case 'tui':
    case 'cli':
      launchTUI();
      break;
      
    case 'web':
    case 'start':
    case 'dev':
      const port = args.includes('-p') ? args[args.indexOf('-p') + 1] :
                   args.includes('--port') ? args[args.indexOf('--port') + 1] : 3000;
      launchWeb(port);
      break;
      
    case 'serve':
      console.log(logo);
      console.log(`${c.cyan}Building and serving production...${c.reset}`);
      spawn('npm', ['run', 'serve'], {
        cwd: rootDir,
        stdio: 'inherit',
        shell: true
      });
      break;
      
    case 'chat':
      launchTUI();
      break;
      
    case 'ai':
      console.log(logo);
      console.log(`${c.cyan}AI Mode: ${args.slice(1).join(' ')}${c.reset}`);
      // Would integrate with AI here
      break;
      
    case 'ls':
    case 'cat':
    case 'edit':
    case 'run':
    case 'config':
      console.log(logo);
      console.log(`${c.yellow}Run 'nexus-pro tui' for file operations.${c.reset}`);
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
      
    default:
      console.log(`${c.red}Unknown command: ${cmd}${c.reset}`);
      console.log(`Run ${c.cyan}nexus-pro --help${c.reset} for usage.`);
  }
}
