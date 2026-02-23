import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
