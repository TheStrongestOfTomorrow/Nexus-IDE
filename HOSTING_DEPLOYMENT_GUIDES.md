<div align="center">

# ☁️ Hosting & Deployment Guides

<img src="https://lucide.dev/api/icons/cloud-upload?size=96&color=3b82f6" alt="Cloud Hosting" width="96" height="96" />

### *Deploy Nexus IDE Anywhere in Minutes*

[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&labelColor=1e293b&logo=docker)](https://www.docker.com/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&labelColor=1e293b&logo=node.js)](https://nodejs.org/)
[![NPM](https://img.shields.io/badge/NPM-Available-cb3837?style=for-the-badge&labelColor=1e293b&logo=npm)](https://www.npmjs.com/package/nexus-ide)

</div>

---

## ⚡ One-Command Deploy

```bash
npx nexus-ide@beta
```

That's it! Opens at `http://localhost:3000`

---

## 🐳 Docker

### Quick Start
```bash
# Clone & Run
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE
docker-compose up -d
```

### Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## ☁️ Cloud Platforms

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TheStrongestOfTomorrow/Nexus-IDE)

```bash
# CLI
npm i -g vercel
vercel
```

### Railway
[![Deploy on Railway](https://railway.app/button)](https://railway.app/new/template/nexus-ide)

1. Connect GitHub repo
2. Auto-deploys on push

### Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. New Web Service
2. Connect GitHub
3. Build: `npm install && npm run build`
4. Start: `npm start`

### Fly.io
```bash
fly launch
fly deploy
```

### Heroku
```bash
heroku create
git push heroku main
```

---

## 🖥️ Self-Hosted

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

## 📱 Mobile & Desktop

### Android (Termux)
```bash
pkg install nodejs
npx nexus-ide@beta
```

### Tauri Desktop App
```bash
npm run tauri:dev    # Development
npm run tauri:build  # Production
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `GITHUB_CLIENT_ID` | GitHub OAuth ID | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | - |
| `OPENAI_API_KEY` | OpenAI key | - |
| `ANTHROPIC_API_KEY` | Claude key | - |
| `GOOGLE_API_KEY` | Gemini key | - |

---

## 🔒 Production Checklist

- [ ] ✅ HTTPS enabled
- [ ] ✅ Rate limiting
- [ ] ✅ Environment variables set
- [ ] ✅ Error monitoring
- [ ] ✅ Auto-restart (PM2)
- [ ] ✅ Backups configured

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Change `PORT` env var |
| Build fails | Clear cache: `rm -rf node_modules && npm install` |
| Memory error | Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096` |

---

<div align="center">

### Happy Deploying! 🚀

*Need help? [Open an issue](https://github.com/TheStrongestOfTomorrow/Nexus-IDE/issues)*

</div>
