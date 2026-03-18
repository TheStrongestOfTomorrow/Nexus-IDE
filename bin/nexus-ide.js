#!/usr/bin/env node

/**
 * Nexus IDE CLI
 * The AI-First, Browser-Based IDE
 * 
 * Quick Start:
 *   npx nexus-ide          Start development server
 *   npx nexus-ide build    Build for production
 *   npx nexus-ide serve    Build and serve production
 *   npx nexus-ide --help   Show help
 */

import { spawn, execSync } from 'child_process';
import { createServer } from 'http';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

const logo = `
${colors.cyan}${colors.bright}
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
${colors.reset}
${colors.magenta}★ The AI-First, Browser-Based IDE ★${colors.reset}
`;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showHelp() {
  console.log(logo);
  console.log(`
${colors.bright}USAGE${colors.reset}
  npx nexus-ide [command] [options]

${colors.bright}COMMANDS${colors.reset}
  dev, start     Start development server with hot reload
  build          Build for production
  serve          Build and serve production build
  preview        Preview production build (requires build first)
  init           Initialize Nexus IDE in current directory
  help, --help   Show this help message

${colors.bright}OPTIONS${colors.reset}
  -p, --port     Port to run server on (default: 3000)
  -h, --host     Host to bind to (default: localhost)
  --open         Open browser automatically
  --version      Show version

${colors.bright}EXAMPLES${colors.reset}
  ${colors.cyan}# Quick start (development)${colors.reset}
  npx nexus-ide

  ${colors.cyan}# Build for production${colors.reset}
  npx nexus-ide build

  ${colors.cyan}# Serve production build${colors.reset}
  npx nexus-ide serve

  ${colors.cyan}# Custom port${colors.reset}
  npx nexus-ide --port 8080

  ${colors.cyan}# Open browser automatically${colors.reset}
  npx nexus-ide --open

${colors.bright}ENVIRONMENT VARIABLES${colors.reset}
  PORT           Server port (default: 3000)
  GITHUB_CLIENT_ID       GitHub OAuth Client ID
  GITHUB_CLIENT_SECRET   GitHub OAuth Client Secret

${colors.bright}LINKS${colors.reset}
  GitHub:   https://github.com/TheStrongestOfTomorrow/Nexus-IDE
  NPM:      https://www.npmjs.com/package/nexus-ide
  Docs:     https://github.com/TheStrongestOfTomorrow/Nexus-IDE#readme
`);
}

function showVersion() {
  const pkgPath = join(rootDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  console.log(`Nexus IDE v${pkg.version}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`Command failed with code ${code}`));
    });

    child.on('error', reject);
  });
}

async function startDevServer(port = 3000, host = 'localhost', openBrowser = false) {
  console.log(logo);
  log('Starting Nexus IDE development server...', 'cyan');
  log(`Server will run at http://${host}:${port}`, 'green');
  
  process.env.PORT = port.toString();
  
  // Import and run the server
  const serverPath = join(rootDir, 'server.ts');
  
  const child = spawn('npx', ['tsx', serverPath], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: port.toString() }
  });

  if (openBrowser) {
    setTimeout(() => {
      const url = `http://${host}:${port}`;
      log(`Opening ${url} in browser...`, 'yellow');
      const opener = process.platform === 'darwin' ? 'open' : 
                     process.platform === 'win32' ? 'start' : 'xdg-open';
      spawn(opener, [url], { detached: true });
    }, 2000);
  }

  child.on('error', (err) => {
    log(`Error: ${err.message}`, 'red');
    process.exit(1);
  });
}

async function build() {
  console.log(logo);
  log('Building Nexus IDE for production...', 'cyan');
  
  await runCommand('npm', ['run', 'build']);
  
  log('\n✅ Build complete!', 'green');
  log('Run `npx nexus-ide serve` to serve the production build.', 'yellow');
}

async function serve(port = 3000, host = 'localhost') {
  console.log(logo);
  
  const distPath = join(rootDir, 'dist');
  if (!existsSync(distPath)) {
    log('No build found. Building first...', 'yellow');
    await build();
  }
  
  log(`Serving Nexus IDE at http://${host}:${port}`, 'green');
  
  await runCommand('npx', ['serve', distPath, '-p', port.toString()]);
}

async function preview(port = 3000, host = 'localhost') {
  console.log(logo);
  log(`Previewing Nexus IDE at http://${host}:${port}`, 'cyan');
  
  await runCommand('npm', ['run', 'preview', '--', '--port', port.toString()]);
}

async function init() {
  console.log(logo);
  log('Initializing Nexus IDE...', 'cyan');
  
  // Check if dependencies are installed
  if (!existsSync(join(rootDir, 'node_modules'))) {
    log('Installing dependencies...', 'yellow');
    await runCommand('npm', ['install']);
  }
  
  log('\n✅ Nexus IDE initialized!', 'green');
  log('Run `npx nexus-ide` to start the development server.', 'cyan');
}

// Parse arguments
const args = process.argv.slice(2);
let command = 'dev';
let port = parseInt(process.env.PORT || '3000');
let host = 'localhost';
let openBrowser = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help' || arg === '-h' || arg === 'help') {
    showHelp();
    process.exit(0);
  } else if (arg === '--version' || arg === '-v') {
    showVersion();
    process.exit(0);
  } else if (arg === '--port' || arg === '-p') {
    port = parseInt(args[++i]);
  } else if (arg === '--host' || arg === '-H') {
    host = args[++i];
  } else if (arg === '--open' || arg === '-o') {
    openBrowser = true;
  } else if (['dev', 'start', 'build', 'serve', 'preview', 'init'].includes(arg)) {
    command = arg;
  }
}

// Run command
switch (command) {
  case 'dev':
  case 'start':
    startDevServer(port, host, openBrowser);
    break;
  case 'build':
    build();
    break;
  case 'serve':
    serve(port, host);
    break;
  case 'preview':
    preview(port, host);
    break;
  case 'init':
    init();
    break;
  default:
    showHelp();
}
