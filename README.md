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

## Production Deployment — Tor Hidden Service (.onion)

Full step-by-step guide to deploy ZigZag as a Tor hidden service on a fresh Ubuntu server.

### 1 — Create a Server

1. Get a **VPS** (DigitalOcean, Vultr, Hetzner, etc.)
2. Choose **Ubuntu 22.04 LTS** or **24.04 LTS**
3. Plan: **$6/mo** (1 vCPU, 1 GB RAM) is enough
4. Authentication: **SSH Key** (recommended)

### 2 — SSH Into the Server

```bash
ssh root@YOUR_SERVER_IP
```

### 3 — Quick Deploy (One Command)

The fastest path — installs everything including Tor:

```bash
apt-get update && apt-get install -y git
git clone https://github.com/adhilNuckz/zigzag.git ~/zigzag
cd ~/zigzag
chmod +x deploy/deploy.sh

# Deploy as Tor Hidden Service (.onion) — DEFAULT
bash deploy/deploy.sh

# OR deploy as clearnet + Tor:
# bash deploy/deploy.sh --clearnet yourdomain.com

# OR deploy as clearnet only (no domain):
# bash deploy/deploy.sh --clearnet
```

The script will:
1. Install Tor, Node.js 20, MySQL 8, Apache2, PM2
2. Configure the Tor hidden service → generates your `.onion` address
3. Create the MySQL database
4. Build the client
5. Configure Apache2 as reverse proxy
6. Start the backend via PM2
7. Set `ONION_ONLY=true` (blocks clearnet access)
8. Print your `.onion` URL

**Your .onion address** will be displayed at the end. Open it in **Tor Browser**.

Skip to **Step 12** if you use this.

---

### Manual Step-by-Step

### 4 — Install System Packages

```bash
apt-get update
apt-get install -y git curl build-essential apache2 mysql-server
```

### 5 — Install Tor

```bash
# Add official Tor Project repo
apt-get install -y apt-transport-https
DISTRO=$(lsb_release -cs)
echo "deb [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] https://deb.torproject.org/torproject.org ${DISTRO} main" \
  > /etc/apt/sources.list.d/tor.list
curl -fsSL https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc \
  | gpg --dearmor -o /usr/share/keyrings/tor-archive-keyring.gpg
apt-get update
apt-get install -y tor deb.torproject.org-keyring
```

### 6 — Configure Tor Hidden Service

```bash
# Create hidden service directory
mkdir -p /var/lib/tor/zigzag
chown debian-tor:debian-tor /var/lib/tor/zigzag
chmod 700 /var/lib/tor/zigzag

# Add hidden service config
cat >> /etc/tor/torrc <<'EOF'

# === ZigZag Hidden Service ===
HiddenServiceDir /var/lib/tor/zigzag/
HiddenServicePort 80 127.0.0.1:80
EOF

# Restart Tor to generate .onion address
systemctl restart tor
sleep 5

# Get your .onion address
cat /var/lib/tor/zigzag/hostname
```

> Save this `.onion` address — this is your site URL.

### 7 — Install Node.js 20

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm alias default 20
npm install -g pm2
```

### 8 — Set Up MySQL

```bash
systemctl enable mysql
systemctl start mysql

mysql -u root <<'SQL'
CREATE DATABASE zigzag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zigzag'@'localhost' IDENTIFIED BY 'PICK_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON zigzag.* TO 'zigzag'@'localhost';
FLUSH PRIVILEGES;
SQL
```

### 9 — Clone & Build

```bash
git clone https://github.com/adhilNuckz/zigzag.git ~/zigzag
cd ~/zigzag

cd server && npm ci --production
cd ../client && npm ci && npm run build
```

### 10 — Configure Environment

```bash
cd ~/zigzag/server
nano .env
```

```dotenv
NODE_ENV=production
PORT=3001
HOST=127.0.0.1

DB_HOST=localhost
DB_PORT=3306
DB_NAME=zigzag
DB_USER=zigzag
DB_PASS=PICK_A_STRONG_PASSWORD

SESSION_SECRET=PASTE_RANDOM_64_HEX
CLIENT_URL=http://YOUR_ONION_ADDRESS.onion
ONION_ONLY=true
```

Generate secrets:
```bash
openssl rand -hex 32   # → SESSION_SECRET
```

> **`ONION_ONLY=true`** — rejects any request not coming through a `.onion` address.

### 11 — Configure Apache2

```bash
a2enmod proxy proxy_http proxy_wstunnel rewrite headers
cp ~/zigzag/deploy/apache/zigzag.conf /etc/apache2/sites-available/zigzag.conf

# Edit: replace YOUR_DOMAIN_OR_IP with your .onion address
# Edit: replace /var/www/zigzag/client/dist with /root/zigzag/client/dist
nano /etc/apache2/sites-available/zigzag.conf

a2dissite 000-default
a2ensite zigzag
systemctl restart apache2
```

### 12 — Start the Backend

```bash
cd ~/zigzag
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup systemd
```

### 13 — Access Your Site

Open **Tor Browser** and navigate to:

```
http://YOUR_ONION_ADDRESS.onion
```

Health check from the server:
```bash
curl http://127.0.0.1:3001/api/health
# {"status":"ok","timestamp":...}
```

---

## Clearnet Deployment (Optional)

If you also want clearnet access (regular domain):

```bash
# Deploy script with clearnet mode
bash deploy/deploy.sh --clearnet yourdomain.com
```

This will:
- Set up Tor hidden service (you still get a `.onion` address)
- Configure Apache for your domain
- Enable SSL via Let's Encrypt
- Set `ONION_ONLY=false` to allow clearnet access

---

## CI/CD — Automatic Deploys with GitHub Actions

Every push to `main` auto-deploys to your server.

### Set Up GitHub Secrets

Go to your repo → **Settings → Secrets → Actions**:

| Secret Name       | Value                              |
|-------------------|------------------------------------|
| `DROPLET_IP`      | Your server's public IP            |
| `DROPLET_USER`    | `root`                             |
| `SSH_PRIVATE_KEY` | Contents of your SSH private key   |

### Generate an SSH Key

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions   # ← copy as SSH_PRIVATE_KEY secret
```

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
