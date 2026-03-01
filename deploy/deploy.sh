#!/bin/bash
# ZigZag Bare-Metal Deployment Script for Ubuntu/Debian
# Assumes Tor is already installed and configured separately.
# Run as root or with sudo
#
# Usage:
#   bash deploy.sh                     # Tor-only (.onion)
#   bash deploy.sh --clearnet domain   # Clearnet + Tor
#   bash deploy.sh --clearnet          # Clearnet only (IP)

set -e

APP_DIR="$HOME/zigzag"
MODE="tor"
DOMAIN=""

# Parse args
if [ "$1" == "--clearnet" ]; then
  MODE="clearnet"
  DOMAIN="${2:-}"
fi

# Read existing .onion address if available
ONION_ADDR=""
if [ -f /var/lib/tor/zigzag/hostname ]; then
  ONION_ADDR=$(cat /var/lib/tor/zigzag/hostname)
fi

echo "=== ZigZag Deployment ==="
echo "  Mode: $MODE"
if [ -n "$ONION_ADDR" ]; then
  echo "  .onion: $ONION_ADDR"
fi
echo ""

# --------------------------------------------------
# 1. System packages
# --------------------------------------------------
echo "[1/7] Installing system packages..."
apt-get update -qq
apt-get install -y -qq git curl build-essential apache2

if [ "$MODE" == "clearnet" ] && [ -n "$DOMAIN" ]; then
  apt-get install -y -qq certbot python3-certbot-apache
fi

# --------------------------------------------------
# 2. Node.js 20 via nvm
# --------------------------------------------------
echo "[2/7] Installing Node.js 20..."
if ! command -v node &>/dev/null; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm alias default 20
fi
node -v
npm -v

# --------------------------------------------------
# 3. PM2
# --------------------------------------------------
echo "[3/7] Installing PM2..."
npm install -g pm2

# --------------------------------------------------
# 4. MySQL 8
# --------------------------------------------------
echo "[4/7] Setting up MySQL..."
if ! command -v mysql &>/dev/null; then
  apt-get install -y -qq mysql-server
  systemctl enable mysql
  systemctl start mysql
fi

DB_PASS=$(openssl rand -hex 16)
mysql -u root <<EOSQL
CREATE DATABASE IF NOT EXISTS zigzag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'zigzag'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON zigzag.* TO 'zigzag'@'localhost';
FLUSH PRIVILEGES;
EOSQL
echo "  MySQL user 'zigzag' ready (password saved to .env)"

# --------------------------------------------------
# 5. Clone / pull repo
# --------------------------------------------------
echo "[5/7] Setting up application code..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone https://github.com/adhilNuckz/zigzag.git "$APP_DIR"
  cd "$APP_DIR"
fi

# --------------------------------------------------
# 6. Install deps + build client
# --------------------------------------------------
echo "[6/7] Installing dependencies & building..."
cd "$APP_DIR/server"
npm ci --production

cd "$APP_DIR/client"
npm ci
npm run build

# --------------------------------------------------
# 7. Create .env
# --------------------------------------------------
echo "[7/7] Configuring environment..."
if [ ! -f "$APP_DIR/server/.env" ]; then
  SESSION_SECRET=$(openssl rand -hex 32)

  # Determine CLIENT_URL
  if [ "$MODE" == "tor" ] && [ -n "$ONION_ADDR" ]; then
    CLIENT_URL="http://$ONION_ADDR"
    ONION_ONLY_VAL="true"
  elif [ -n "$DOMAIN" ]; then
    CLIENT_URL="http://$DOMAIN"
    ONION_ONLY_VAL="false"
  else
    CLIENT_URL="http://localhost"
    ONION_ONLY_VAL="false"
  fi

  cat > "$APP_DIR/server/.env" <<EOF
NODE_ENV=production
PORT=3001
HOST=127.0.0.1

DB_HOST=localhost
DB_PORT=3306
DB_NAME=zigzag
DB_USER=zigzag
DB_PASS=${DB_PASS}

SESSION_SECRET=${SESSION_SECRET}
CLIENT_URL=${CLIENT_URL}
ONION_ONLY=${ONION_ONLY_VAL}
EOF
  echo "  .env created (ONION_ONLY=$ONION_ONLY_VAL)"
else
  echo "  .env already exists, skipping"
fi

# --------------------------------------------------
# 8. Apache2 config
# --------------------------------------------------
echo "Configuring Apache2..."
a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl
cp "$APP_DIR/deploy/apache/zigzag.conf" /etc/apache2/sites-available/zigzag.conf

# Set the ServerName to .onion or domain or IP
if [ "$MODE" == "tor" ] && [ -n "$ONION_ADDR" ]; then
  sed -i "s/YOUR_DOMAIN_OR_IP/$ONION_ADDR/g" /etc/apache2/sites-available/zigzag.conf
elif [ -n "$DOMAIN" ]; then
  sed -i "s/YOUR_DOMAIN_OR_IP/$DOMAIN/g" /etc/apache2/sites-available/zigzag.conf
else
  DROPLET_IP=$(curl -s http://checkip.amazonaws.com)
  sed -i "s/YOUR_DOMAIN_OR_IP/$DROPLET_IP/g" /etc/apache2/sites-available/zigzag.conf
fi

sed -i "s|/var/www/zigzag/client/dist|$APP_DIR/client/dist|g" /etc/apache2/sites-available/zigzag.conf

a2dissite 000-default 2>/dev/null || true
a2ensite zigzag
systemctl restart apache2

# --------------------------------------------------
# Start PM2
# --------------------------------------------------
cd "$APP_DIR"
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup systemd -u "$(whoami)" --hp "$HOME" | tail -1 | bash

# --------------------------------------------------
# SSL (clearnet mode with domain only)
# --------------------------------------------------
if [ "$MODE" == "clearnet" ] && [ -n "$DOMAIN" ]; then
  echo ""
  echo "Setting up SSL with Let's Encrypt..."
  certbot --apache -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
  echo "  SSL enabled for $DOMAIN"
fi

# --------------------------------------------------
# Done
# --------------------------------------------------
echo ""
echo "============================================"
echo "    ZigZag Deployment Complete"
echo "============================================"
echo ""
if [ -n "$ONION_ADDR" ]; then
  echo "  .onion URL:  http://$ONION_ADDR"
  echo "  (Access via Tor Browser)"
  echo ""
fi
if [ -n "$DOMAIN" ]; then
  echo "  Clearnet:  https://$DOMAIN"
elif [ "$MODE" == "clearnet" ]; then
  echo "  Clearnet:  http://$DROPLET_IP"
fi
echo ""
echo "  Commands:"
echo "    pm2 logs zigzag-server        # Live logs"
echo "    pm2 restart zigzag-server     # Restart"
echo "    cat /var/lib/tor/zigzag/hostname  # .onion address"
echo ""
echo "============================================"
