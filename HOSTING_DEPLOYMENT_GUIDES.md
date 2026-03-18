<div align="center">

# ☁️ Hosting & Deployment Guides

<img src="https://lucide.dev/api/icons/cloud?size=96&color=6366f1" alt="Cloud Hosting" width="96" height="96" />

### *Deploy Nexus IDE Anywhere*

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&labelColor=1e293b&logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&labelColor=1e293b&logo=node.js)](https://nodejs.org/)

</div>

---

## 🚀 Quick Deploy Options

### 1️⃣ NPM (Fastest)
```bash
npx nexus-ide
# Opens at http://localhost:3000
```

### 2️⃣ Docker
```bash
docker-compose up -d
# Opens at http://localhost:3000
```

### 3️⃣ Git Clone
```bash
git clone https://github.com/TheStrongestOfTomorrow/Nexus-IDE.git
cd Nexus-IDE && npm install && npm run dev
```

---

## ☁️ Cloud Platforms

### Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# Done! 🎉
```

### Railway
```bash
# 1. Connect GitHub repo
# 2. Auto-deploys on push
# 3. Set PORT env var
```

### Render
```bash
# 1. New Web Service
# 2. Connect GitHub
# 3. Build: npm install
# 4. Start: npm start
```

### Fly.io
```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Launch
fly launch

# 3. Deploy
fly deploy
```

---

## 🐳 Docker Options

### Basic
```bash
docker build -t nexus-ide .
docker run -p 3000:3000 nexus-ide
```

### Docker Compose
```yaml
version: '3'
services:
  nexus-ide:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
```

---

## 🖥️ Self-Hosted

### PM2 (Production)
```bash
# Install PM2
npm i -g pm2

# Start
pm2 start server.ts --name nexus-ide

# Persist
pm2 startup
pm2 save
```

### Systemd
```ini
[Unit]
Description=Nexus IDE
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node /path/to/nexus-ide/server.ts
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

---

## 📱 Mobile/Desktop

### Android (Termux)
```bash
pkg install nodejs
npx nexus-ide
```

### Tauri Desktop
```bash
npm run tauri:build
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `GITHUB_CLIENT_ID` | GitHub OAuth ID | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | - |

---

## 🔒 Production Tips

1. ✅ Use HTTPS
2. ✅ Set up rate limiting
3. ✅ Enable gzip compression
4. ✅ Use environment variables for secrets
5. ✅ Set up monitoring

---

<div align="center">

### Happy Deploying! 🚀

</div>
