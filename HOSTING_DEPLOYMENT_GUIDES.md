<div align="center">

# Hosting & Deployment Guides

<img src="https://lucide.dev/api/icons/cloud-upload?size=96&color=3b82f6" alt="Cloud Hosting" width="96" height="96" />

### *Deploy Nexus IDE Anywhere in Minutes*

[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&labelColor=1e293b&logo=node.js)](https://nodejs.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&labelColor=1e293b&logo=docker)](https://www.docker.com/)

</div>

---

## One-Command Run

```bash
# Clone & run locally (full features including v86 + WebContainer)
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
npm install --legacy-peer-deps
npm run dev
```

Opens at `http://localhost:3000` with COEP/COOP headers enabled.

---

## GitHub Pages (Zero Config)

The repo includes a GitHub Actions workflow (`.github/workflows/gh-pages.yml`) that automatically deploys to GitHub Pages on every push to `main`.

1. Go to repo **Settings → Pages**
2. Set **Source** to `gh-pages` branch
3. Push to `main` — deployment happens automatically

Your site will be live at `https://<username>.github.io/Nexus-IDE/`

**Limitations:** GitHub Pages is static hosting — no custom headers. Features requiring `SharedArrayBuffer` (v86 Linux Terminal, WebContainer) are automatically hidden on GH Pages.

---

## Docker

### Quick Start
```bash
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
docker-compose up -d
```

### Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Cloud Platforms

### Vercel

```bash
npm i -g vercel
vercel
```

**Important:** Add these headers in `vercel.json` for v86/WebContainer support:
```json
{
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
      { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
    ]}
  ]
}
```

### Railway

1. Connect GitHub repo
2. Set build command: `npm install --legacy-peer-deps && npm run build`
3. Set start command: `npm start`
4. Auto-deploys on push

### Render

1. New Web Service
2. Connect GitHub
3. Build: `npm install --legacy-peer-deps && npm run build`
4. Start: `npm start`

### Fly.io

```bash
fly launch
fly deploy
```

### Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add COEP/COOP headers in `netlify.toml` for v86/WebContainer support

---

## Self-Hosted

### PM2 (Production)
```bash
npm i -g pm2
pm2 start server.ts --name nexus-ide
pm2 startup
pm2 save
```

### Systemd Service
```ini
[Unit]
Description=Nexus IDE Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node /path/to/server.ts
Restart=on-failure
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Mobile & Desktop

### Android

Download the APK from [Releases](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/releases) or build from source:

```bash
npm install --legacy-peer-deps
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

### Tauri Desktop App

```bash
npm run tauri:dev    # Development
npm run tauri:build  # Production (macOS, Windows, Linux)
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | - |

> **Note:** AI API keys are entered by users in the IDE settings UI, not via environment variables. The browser makes direct API calls to AI providers — no server-side proxy needed.

---

## Production Checklist

- [ ] HTTPS enabled (required for Service Worker and PWA)
- [ ] COEP/COOP headers set (required for v86 and WebContainer)
- [ ] Environment variables configured
- [ ] Auto-restart configured (PM2 or systemd)
- [ ] Rate limiting (if exposing to public)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Change `PORT` env var |
| Build fails | Clear cache: `rm -rf node_modules && npm install --legacy-peer-deps` |
| Memory error | Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096` |
| v86/WebContainer not working | Check COEP/COOP headers are set |
| GitHub Pages shows old version | Hard refresh (Ctrl+Shift+R) or clear browser cache |
