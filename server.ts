import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { spawn } from "child_process";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // GitHub OAuth Routes
  app.get("/api/auth/github/url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl}/auth/github/callback`;
    
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user`;
    res.json({ url });
  });

  app.get("/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    try {
      const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const { access_token } = response.data;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${access_token}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("GitHub Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // GitHub API Proxies
  app.get("/api/github/user", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    try {
      const response = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${token}` },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed" });
    }
  });

  app.get("/api/github/repos", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    try {
      const response = await axios.get("https://api.github.com/user/repos?sort=updated", {
        headers: { Authorization: `token ${token}` },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed" });
    }
  });

  app.get("/api/github/repos/:owner/:repo/contents/:path(*)", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    const { owner, repo } = req.params;
    const filePath = req.params[0];
    
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        headers: { Authorization: `token ${token}` },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed" });
    }
  });

  app.post("/api/github/repos", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    try {
      const response = await axios.post("https://api.github.com/user/repos", req.body, {
        headers: { Authorization: `token ${token}` },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed" });
    }
  });

  app.post("/api/github/repos/:owner/:repo/push", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    const { owner, repo } = req.params;
    const { message, files } = req.body; // files: [{path: string, content: string}]

    try {
      // 1. Get default branch
      const repoInfo = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Authorization: `token ${token}` },
      });
      const branch = repoInfo.data.default_branch;

      // 2. Get latest commit SHA
      const refResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        headers: { Authorization: `token ${token}` },
      });
      const latestCommitSha = refResponse.data.object.sha;

      // 3. Create blobs
      const tree = await Promise.all(files.map(async (file: any) => {
        const blobResponse = await axios.post(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
          content: file.content,
          encoding: "utf-8"
        }, {
          headers: { Authorization: `token ${token}` },
        });
        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blobResponse.data.sha
        };
      }));

      // 4. Create tree
      const treeResponse = await axios.post(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        base_tree: latestCommitSha,
        tree
      }, {
        headers: { Authorization: `token ${token}` },
      });

      // 5. Create commit
      const commitResponse = await axios.post(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        message,
        tree: treeResponse.data.sha,
        parents: [latestCommitSha]
      }, {
        headers: { Authorization: `token ${token}` },
      });

      // 6. Update ref
      await axios.patch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        sha: commitResponse.data.sha
      }, {
        headers: { Authorization: `token ${token}` },
      });

      res.json({ success: true, sha: commitResponse.data.sha });
    } catch (error: any) {
      console.error("Push error:", error.response?.data || error.message);
      res.status(500).json(error.response?.data || { error: "Push failed" });
    }
  });

  // AI Provider Proxies
  app.post("/api/ai/:provider", async (req, res) => {
    const { provider } = req.params;
    const apiKey = req.headers.authorization?.split(" ")[1];
    
    if (!apiKey && provider !== 'ollama') {
      return res.status(401).json({ error: "Missing API Key" });
    }

    try {
      let response;
      if (provider === 'openai') {
        response = await axios.post("https://api.openai.com/v1/chat/completions", req.body, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
      } else if (provider === 'anthropic') {
        response = await axios.post("https://api.anthropic.com/v1/messages", req.body, {
          headers: { 
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          }
        });
      } else if (provider === 'groq') {
        response = await axios.post("https://api.groq.com/openai/v1/chat/completions", req.body, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
      } else if (provider === 'deepseek') {
        response = await axios.post("https://api.deepseek.com/v1/chat/completions", req.body, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
      } else if (provider === 'ollama') {
        const ollamaUrl = req.headers['x-ollama-url'] || 'http://localhost:11434';
        response = await axios.post(`${ollamaUrl}/api/chat`, req.body);
      }

      if (response) {
        res.json(response.data);
      } else {
        res.status(400).json({ error: "Unsupported provider" });
      }
    } catch (error: any) {
      console.error(`AI Proxy Error (${provider}):`, error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "AI Request failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  const clients = new Set<WebSocket>();
  const minecraftClients = new Map<string, WebSocket>(); // sessionId -> Minecraft WS
  const sessions = new Map<string, { clients: Set<WebSocket>, lastActivity: number }>();
  const hostedWorkspaces = new Map<string, { files: { name: string, content: string }[], lastUpdate: number }>();
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Self-hosting route
  app.get("/hosted/:sessionId/*", (req, res) => {
    const { sessionId } = req.params;
    const filePath = req.params[0] || "index.html";
    const workspace = hostedWorkspaces.get(sessionId);

    if (!workspace) {
      return res.status(404).send("Workspace not found or not hosted.");
    }

    const file = workspace.files.find(f => f.name === filePath);
    if (!file) {
      // Try index.html if it's a directory-like path
      const indexFile = workspace.files.find(f => f.name === (filePath ? `${filePath}/index.html` : "index.html"));
      if (indexFile) {
        res.setHeader("Content-Type", "text/html");
        return res.send(indexFile.content);
      }
      return res.status(404).send("File not found in hosted workspace.");
    }

    const ext = path.extname(file.name).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".txt": "text/plain",
    };

    res.setHeader("Content-Type", mimeTypes[ext] || "text/plain");
    res.send(file.content);
  });

  // Cleanup inactive sessions
  setInterval(() => {
    const now = Date.now();
    sessions.forEach((session, sessionId) => {
      if (now - session.lastActivity > SESSION_TIMEOUT) {
        console.log(`Session ${sessionId} timed out due to inactivity.`);
        session.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'session:timeout', sessionId }));
          }
        });
        sessions.delete(sessionId);
      }
    });
  }, 60000); // Check every minute

  wss.on("connection", (ws, req) => {
    clients.add(ws);
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const isMinecraft = url.pathname === '/minecraft';
    const minecraftSessionId = url.searchParams.get('sid');

    console.log(`${isMinecraft ? 'Minecraft' : 'IDE'} client connected. Total clients:`, clients.size);

    if (isMinecraft && minecraftSessionId) {
      minecraftClients.set(minecraftSessionId, ws);
      // Notify IDE clients in this session
      const session = sessions.get(minecraftSessionId);
      if (session) {
        session.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'minecraft:connected', sessionId: minecraftSessionId }));
          }
        });
      }
    }

    let shell: any = null;
    let currentSessionId: string | null = null;

    ws.on("message", (message: any) => {
      try {
        if (message instanceof Buffer) {
          // Handle binary message
          const type = message.readUInt8(0);
          if (type === 0x01) { // Minecraft Command
            const sessionLen = message.readUInt8(1);
            const sessionId = message.toString('utf8', 2, 2 + sessionLen);
            const command = message.toString('utf8', 2 + sessionLen);
            
            const mcWs = minecraftClients.get(sessionId);
            if (mcWs && mcWs.readyState === WebSocket.OPEN) {
              const requestId = Math.random().toString(36).substring(7);
              mcWs.send(JSON.stringify({
                header: {
                  version: 1,
                  requestId,
                  messagePurpose: "commandRequest",
                  messageType: "commandRequest"
                },
                body: {
                  version: 1,
                  commandLine: command,
                  origin: { type: "player" }
                }
              }));
            }
          }
          return;
        }

        const data = JSON.parse(message.toString());

        // Forward Minecraft events to IDE clients
        if (isMinecraft && minecraftSessionId) {
          const session = sessions.get(minecraftSessionId);
          if (session) {
            session.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'minecraft:event', data }));
              }
            });
          }
          return;
        }

        if (data.type === "session:create") {
          const { sessionId } = data;
          sessions.set(sessionId, { clients: new Set([ws]), lastActivity: Date.now() });
          currentSessionId = sessionId;
          ws.send(JSON.stringify({ type: 'session:created', sessionId }));
        } else if (data.type === "session:join") {
          const { sessionId } = data;
          const session = sessions.get(sessionId);
          if (session) {
            session.clients.add(ws);
            session.lastActivity = Date.now();
            currentSessionId = sessionId;
            ws.send(JSON.stringify({ type: 'session:joined', sessionId }));
            // Notify others in session
            session.clients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'session:user_joined', sessionId }));
              }
            });
          } else {
            ws.send(JSON.stringify({ type: 'session:error', message: 'Session not found' }));
          }
        } else if (data.type === "collab") {
          if (currentSessionId) {
            const session = sessions.get(currentSessionId);
            if (session) {
              session.lastActivity = Date.now();
              session.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(data));
                }
              });
            }
          } else {
            // Broadcast collaboration data to all other clients (legacy/global)
            clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
              }
            });
          }
        } else if (data.type === "terminal-init") {
          if (shell) shell.kill();
          
          let shellCmd = "bash";
          if (os.platform() === "win32") {
            shellCmd = "powershell.exe";
          } else {
            // Check for common shells in order of preference
            const shells = ["/data/data/com.termux/files/usr/bin/bash", "/data/data/com.termux/files/usr/bin/sh", "bash", "sh"];
            for (const s of shells) {
              try {
                if (os.platform() !== "win32") {
                  shellCmd = s;
                  break; 
                }
              } catch (e) {}
            }
          }

          shell = spawn(shellCmd, [], {
            env: { ...process.env, TERM: "xterm-256color" },
            cwd: process.cwd(),
          });

          shell.stdout.on("data", (data: any) => {
            ws.send(JSON.stringify({ type: "terminal-output", data: data.toString() }));
          });

          shell.stderr.on("data", (data: any) => {
            ws.send(JSON.stringify({ type: "terminal-output", data: data.toString() }));
          });

          shell.on("close", () => {
            ws.send(JSON.stringify({ type: "terminal-output", data: "\r\nProcess exited\r\n" }));
          });
        } else if (data.type === "run-file") {
          const { filename, content, language } = data;
          let command = "";
          let args: string[] = [];

          if (language === "javascript") {
            command = "node";
            args = ["-e", content];
          } else if (language === "python") {
            command = "python3";
            args = ["-c", content];
          } else if (language === "html") {
            // HTML files are usually previewed, but we can echo them
            ws.send(JSON.stringify({ type: "terminal-output", data: "\r\nHTML file - please use the Preview pane.\r\n" }));
            return;
          }

          if (command) {
            const runner = spawn(command, args);
            runner.stdout.on("data", (data) => ws.send(JSON.stringify({ type: "terminal-output", data: data.toString() })));
            runner.stderr.on("data", (data) => ws.send(JSON.stringify({ type: "terminal-output", data: data.toString() })));
            runner.on("close", (code) => ws.send(JSON.stringify({ type: "terminal-output", data: `\r\nProcess finished with exit code ${code}\r\n` })));
          }
        } else if (data.type === "terminal-input") {
          if (shell) {
            shell.stdin.write(data.data);
          }
        } else if (data.type === "workspace:host") {
          const { sessionId, files } = data;
          hostedWorkspaces.set(sessionId, { files, lastUpdate: Date.now() });
          ws.send(JSON.stringify({ 
            type: 'workspace:hosted', 
            url: `${process.env.APP_URL || ''}/hosted/${sessionId}/index.html` 
          }));
        } else if (data.type === "minecraft:command") {
          const { sessionId, command } = data;
          const mcWs = minecraftClients.get(sessionId);
          if (mcWs && mcWs.readyState === WebSocket.OPEN) {
            const requestId = Math.random().toString(36).substring(7);
            mcWs.send(JSON.stringify({
              header: {
                version: 1,
                requestId,
                messagePurpose: "commandRequest",
                messageType: "commandRequest"
              },
              body: {
                version: 1,
                commandLine: command,
                origin: { type: "player" }
              }
            }));
          }
        } else if (data.type === "minecraft:subscribe") {
          const { sessionId, eventName } = data;
          const mcWs = minecraftClients.get(sessionId);
          if (mcWs && mcWs.readyState === WebSocket.OPEN) {
            const requestId = Math.random().toString(36).substring(7);
            mcWs.send(JSON.stringify({
              header: {
                version: 1,
                requestId,
                messagePurpose: "subscribe",
                messageType: "commandRequest"
              },
              body: { eventName }
            }));
          }
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      if (isMinecraft && minecraftSessionId) {
        minecraftClients.delete(minecraftSessionId);
        const session = sessions.get(minecraftSessionId);
        if (session) {
          session.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'minecraft:disconnected', sessionId: minecraftSessionId }));
            }
          });
        }
      }
      if (currentSessionId) {
        const session = sessions.get(currentSessionId);
        if (session) {
          session.clients.delete(ws);
          if (session.clients.size === 0) {
            session.lastActivity = Date.now(); // Start timeout countdown
          }
        }
      }
      if (shell) shell.kill();
      console.log("Client disconnected. Total clients:", clients.size);
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
