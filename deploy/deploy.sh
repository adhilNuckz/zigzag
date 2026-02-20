#!/bin/bash
# ZigZag Deployment Script for Linux
# Run as root or with sudo

set -e

echo "=== ZigZag Deployment ==="
echo ""

# 1. Check dependencies
echo "[1/6] Checking dependencies..."
command -v docker >/dev/null 2>&1 || { echo "Docker required. Install: https://docs.docker.com/engine/install/"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || { echo "Docker Compose required."; exit 1; }

# 2. Generate secrets
echo "[2/6] Generating secrets..."
if [ ! -f .env ]; then
  SESSION_SECRET=$(openssl rand -hex 32)
  cat > .env <<EOF
SESSION_SECRET=${SESSION_SECRET}
EOF
  echo "  .env created with random session secret"
else
  echo "  .env already exists, skipping"
fi

# 3. Build containers
echo "[3/6] Building Docker containers..."
docker compose build --no-cache

# 4. Start services
echo "[4/6] Starting services..."
docker compose up -d

# 5. Wait for Tor to generate .onion address
echo "[5/6] Waiting for Tor hidden service..."
sleep 10

ONION=""
for i in $(seq 1 30); do
  if docker exec zigzag-tor cat /var/lib/tor/hidden_service/hostname 2>/dev/null; then
    ONION=$(docker exec zigzag-tor cat /var/lib/tor/hidden_service/hostname)
    break
  fi
  echo "  Waiting... ($i/30)"
  sleep 5
done

# 6. Report
echo ""
echo "=== Deployment Complete ==="
echo ""
if [ -n "$ONION" ]; then
  echo "Your .onion address: $ONION"
  echo "Access via Tor Browser: http://$ONION"
else
  echo "Tor is still initializing. Check later with:"
  echo "  docker exec zigzag-tor cat /var/lib/tor/hidden_service/hostname"
fi
echo ""
echo "Manage:"
echo "  docker compose logs -f     # View logs"
echo "  docker compose restart     # Restart all"
echo "  docker compose down        # Stop all"
echo ""
echo "=== ZigZag is live ==="
