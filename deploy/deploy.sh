#!/bin/bash
# ZigZag Bare-Metal Deployment Script for Ubuntu/Debian
# Deploys as a Tor Hidden Service (.onion) by default
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

echo "=== ZigZag Deployment ==="
echo "  Mode: $MODE"
echo ""

# --------------------------------------------------
# 1. System packages
# --------------------------------------------------
echo "[1/9] Installing system packages..."
apt-get update -qq
apt-get install -y -qq git curl build-essential apache2

if [ "$MODE" == "clearnet" ] && [ -n "$DOMAIN" ]; then
  apt-get install -y -qq certbot python3-certbot-apache
fi

# --------------------------------------------------
# 2. Tor
# --------------------------------------------------
echo "[2/9] Installing Tor..."
if ! command -v tor &>/dev/null; then
  apt-get install -y -qq apt-transport-https
  # Add official Tor Project repo (latest stable)
  DISTRO=$(lsb_release -cs)
  echo "deb [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] https://deb.torproject.org/torproject.org ${DISTRO} main" \
    > /etc/apt/sources.list.d/tor.list
  curl -fsSL https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc \
    | gpg --dearmor -o /usr/share/keyrings/tor-archive-keyring.gpg 2>/dev/null || true
  apt-get update -qq
  apt-get install -y -qq tor deb.torproject.org-keyring || apt-get install -y -qq tor
fi
systemctl enable tor

# Configure hidden service
mkdir -p /var/lib/tor/zigzag
chown debian-tor:debian-tor /var/lib/tor/zigzag
chmod 700 /var/lib/tor/zigzag

# Append hidden service config if not present
if ! grep -q "HiddenServiceDir /var/lib/tor/zigzag" /etc/tor/torrc 2>/dev/null; then
  cat >> /etc/tor/torrc <<'TORCONF'

# === ZigZag Hidden Service ===
HiddenServiceDir /var/lib/tor/zigzag/
HiddenServicePort 80 127.0.0.1:80
TORCONF
fi

systemctl restart tor
echo "  Tor configured. Waiting for .onion address..."
sleep 5

ONION_ADDR=""
for i in $(seq 1 20); do
  if [ -f /var/lib/tor/zigzag/hostname ]; then
    ONION_ADDR=$(cat /var/lib/tor/zigzag/hostname)
    break
  fi
  echo "  Waiting... ($i/20)"
  sleep 3
done

if [ -n "$ONION_ADDR" ]; then
  echo "  .onion address: $ONION_ADDR"
else
  echo "  Tor still initializing — check later: cat /var/lib/tor/zigzag/hostname"
fi

# --------------------------------------------------
# 3. Node.js 20 via nvm
# --------------------------------------------------
echo "[3/9] Installing Node.js 20..."
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
# 4. PM2
# --------------------------------------------------
echo "[4/9] Installing PM2..."
npm install -g pm2

# --------------------------------------------------
# 5. MySQL 8
# --------------------------------------------------
echo "[5/9] Setting up MySQL..."
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
# 6. Clone / pull repo
# --------------------------------------------------
echo "[6/9] Setting up application code..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone https://github.com/adhilNuckz/zigzag.git "$APP_DIR"
  cd "$APP_DIR"
fi

# --------------------------------------------------
# 7. Install deps + build client
# --------------------------------------------------
echo "[7/9] Installing dependencies & building..."
cd "$APP_DIR/server"
npm ci --production

cd "$APP_DIR/client"
npm ci
npm run build

# --------------------------------------------------
# 8. Create .env
# --------------------------------------------------
echo "[8/9] Configuring environment..."
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
# 9. Apache2 config
# --------------------------------------------------
echo "[9/9] Configuring Apache2..."
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
