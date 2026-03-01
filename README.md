# ZigZag — Dark Web Anonymous Community Platform

## Overview
ZigZag is an anonymous community platform designed to run as a **Tor Hidden Service (.onion)**. It features ephemeral global chat, resource sharing, anonymous blogging, security tools, and an idea hub — all accessible exclusively through the Tor network.

## Tech Stack
- **Backend:** Node.js + Express + Socket.io + Sequelize (MySQL)
- **Frontend:** React + Vite + TailwindCSS + shadcn/ui
- **Dark Web:** Tor Hidden Service (.onion)
- **Infrastructure:** Apache2 + PM2 + GitHub Actions CI/CD

## Features
- 🧅 Tor Hidden Service (.onion) — accessible only via Tor Browser
- 💬 Ephemeral Global Chat (auto-delete after 24h, real-time WebSocket, image sharing)
- 📦 Resource Sharing Platform (files, links, tags)
- 📝 Tor Talks (Anonymous Blog with Markdown, upvotes, comments)
- 💡 Idea Bay (share & save ideas, categories, build-in-public)
- 🛡 Security Tools Dashboard (virus scan, phishing check, leak detection)
- 🔐 Anonymous Auth (no email, no password, no identity)
- 🚫 Zero logging — no IPs, no analytics, no trackers

---

## Local Development

### Prerequisites
- Node.js 18+ (20 recommended)
- MySQL 8

### Backend
```bash
cd server
npm install
cp .env.example .env   # edit DB_PASS, SESSION_SECRET
npm run dev             # starts on :3001
```

### Frontend
```bash
cd client
npm install
npm run dev             # starts on :5173, proxies /api → :3001
```

---

## Production Deployment

Step-by-step guide to deploy ZigZag on an Ubuntu server with Tor already configured.

**Prerequisites:** A VPS (DigitalOcean, Vultr, etc.) with Ubuntu 22.04/24.04, Tor installed, and hidden service configured.

---

### Step 1 — SSH into the server

```bash
ssh root@178.128.107.85
```

---

### Step 2 — Install system packages

```bash
apt-get update
apt-get install -y git curl build-essential apache2 mysql-server
```

---

### Step 3 — Install Node.js 20

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm alias default 20
```

Verify:

```bash
node -v   # v20.x.x
npm -v
```

---

### Step 4 — Install PM2

```bash
npm install -g pm2
```

---

### Step 5 — Set up MySQL

```bash
systemctl enable mysql
systemctl start mysql
```

Create the database and user:

```bash
mysql -u root <<'SQL'
CREATE DATABASE zigzag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zigzag'@'localhost' IDENTIFIED BY 'PICK_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON zigzag.* TO 'zigzag'@'localhost';
FLUSH PRIVILEGES;
SQL
```

> Replace `PICK_A_STRONG_PASSWORD` with a real password. You'll use the same value in the `.env` file.

---

### Step 6 — Clone the repo

```bash
git clone https://github.com/adhilNuckz/zigzag.git ~/zigzag
cd ~/zigzag
```

---

### Step 7 — Install dependencies & build

```bash
# Server
cd ~/zigzag/server
npm ci --production

# Client
cd ~/zigzag/client
npm ci
npm run build
```

---

### Step 8 — Create the .env file

Generate a session secret:

```bash
openssl rand -hex 32
```

Get your .onion address:

```bash
cat /var/lib/tor/zigzag/hostname
```

Create the file:

```bash
nano ~/zigzag/server/.env
```

Paste this (replace the placeholder values):

```dotenv
NODE_ENV=production
PORT=3001
HOST=127.0.0.1

DB_HOST=localhost
DB_PORT=3306
DB_NAME=zigzag
DB_USER=zigzag
DB_PASS=PICK_A_STRONG_PASSWORD

SESSION_SECRET=PASTE_THE_HEX_FROM_ABOVE
CLIENT_URL=http://YOUR_ONION_ADDRESS.onion
ONION_ONLY=true
```

> **`ONION_ONLY=true`** blocks all non-`.onion` requests.

---

### Step 9 — Configure Apache2

Enable required modules:

```bash
a2enmod proxy proxy_http proxy_wstunnel rewrite headers
```

Copy and edit the config:

```bash
cp ~/zigzag/deploy/apache/zigzag.conf /etc/apache2/sites-available/zigzag.conf
```

Replace the placeholder values:

```bash
ONION_ADDR=$(cat /var/lib/tor/zigzag/hostname)
sed -i "s/YOUR_DOMAIN_OR_IP/$ONION_ADDR/g" /etc/apache2/sites-available/zigzag.conf
sed -i "s|/var/www/zigzag/client/dist|/root/zigzag/client/dist|g" /etc/apache2/sites-available/zigzag.conf
```

Enable the site:

```bash
a2dissite 000-default
a2ensite zigzag
systemctl restart apache2
```

---

### Step 10 — Start the backend

```bash
cd ~/zigzag
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup systemd
```

---

### Step 11 — Verify everything works

```bash
# Backend health check
curl http://127.0.0.1:3001/api/health
# → {"status":"ok","timestamp":...}

# Check PM2
pm2 status

# Check Apache
systemctl status apache2

# Check Tor
systemctl status tor
```

---

### Step 12 — Open in Tor Browser

Navigate to your `.onion` address:

```
http://YOUR_ONION_ADDRESS.onion
```

---

### Step 13 — Back up Tor identity (CRITICAL)

```bash
cp -r /var/lib/tor/zigzag/ ~/zigzag-onion-backup/
```

> If you lose `/var/lib/tor/zigzag/`, your `.onion` address changes permanently.

---

### Quick Deploy (Alternative)

If you prefer a single command instead of manual steps, the deploy script handles Steps 2–10 automatically. Tor must already be installed and configured.

```bash
apt-get update && apt-get install -y git
git clone https://github.com/adhilNuckz/zigzag.git ~/zigzag
cd ~/zigzag
chmod +x deploy/deploy.sh
bash deploy/deploy.sh
```

---

## Clearnet Deployment (Optional)

If you also want clearnet access (regular domain):

```bash
bash deploy/deploy.sh --clearnet yourdomain.com
```

This will:

- Configure Apache for your domain
- Enable SSL via Let's Encrypt
- Set `ONION_ONLY=false` to allow clearnet access

---

## CI/CD — Automatic Deploys with GitHub Actions

Every push to `main` auto-deploys to your server.

### Set up SSH key on the droplet

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Copy the private key (you'll paste this into GitHub):

```bash
cat ~/.ssh/github_actions
```

### Add GitHub Secrets

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name       | Value                                     |
|-------------------|-------------------------------------------|
| `DROPLET_IP`      | `178.128.107.85`                          |
| `DROPLET_USER`    | `root`                                    |
| `SSH_PRIVATE_KEY` | Full output of `cat ~/.ssh/github_actions`|

### Push to trigger deploy

From your local machine:

```bash
git add -A
git commit -m "deploy"
git push origin main
```

Every push to `main` will now auto-deploy: pull code → install deps → build client → reload PM2.

---

## Useful Commands

```bash
# App
pm2 status                              # overview
pm2 logs zigzag-server                  # live logs
pm2 restart zigzag-server               # restart
pm2 reload zigzag-server                # zero-downtime restart

# Tor
cat /var/lib/tor/zigzag/hostname        # .onion address
systemctl status tor                    # Tor status
systemctl restart tor                   # restart Tor
journalctl -u tor                       # Tor logs

# Backup .onion identity (KEEP SAFE!)
cp -r /var/lib/tor/zigzag/ ~/zigzag-onion-backup/
```

> **IMPORTANT:** Back up `/var/lib/tor/zigzag/` — it contains your private key.  
> If you lose it, your `.onion` address changes permanently.

## Environment Variables Reference

| Variable             | Default          | Description                                      |
|----------------------|------------------|--------------------------------------------------|
| `NODE_ENV`           | `development`    | `production` in prod                             |
| `PORT`               | `3001`           | Server port                                      |
| `HOST`               | `0.0.0.0`        | Bind to `127.0.0.1` for Tor-only                 |
| `DB_HOST`            | `localhost`       | MySQL host                                       |
| `DB_PORT`            | `3306`           | MySQL port                                       |
| `DB_NAME`            | `zigzag`         | MySQL database name                              |
| `DB_USER`            | `root`           | MySQL user                                       |
| `DB_PASS`            | (empty)          | MySQL password                                   |
| `SESSION_SECRET`     | —                | **Required.** Random hex for sessions            |
| `CLIENT_URL`         | `http://localhost:5173` | Your `.onion` URL for CORS               |
| `ONION_ONLY`         | `false`          | **Set `true`** to block non-.onion access        |
| `MAX_FILE_SIZE`      | `5242880`        | Upload limit in bytes (5 MB)                     |
| `MESSAGE_TTL`        | `24`             | Chat message auto-delete after N hours           |

## Security
- **Tor Hidden Service** — server IP never exposed to users
- **ONION_ONLY mode** — rejects clearnet requests
- **HOST=127.0.0.1** — Node.js only listens on localhost (Tor routes through Apache)
- No IP logging
- No analytics trackers
- Input sanitization on all endpoints
- XSS/CSRF protection via Helmet + CSP
- File type whitelisting
- Rate limiting on all routes
- Ephemeral data — messages auto-delete
