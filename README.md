# ZigZag — Anonymous Tor Hidden Service Community Platform

## Overview
ZigZag is a lightweight anonymous community platform running as a Tor (.onion) hidden service.
It features ephemeral global chat, resource sharing, anonymous blogging, security tools, and an idea hub.

## Tech Stack
- **Backend:** Node.js + Express + Socket.io + MongoDB
- **Frontend:** React + Vite + TailwindCSS
- **Infrastructure:** Tor Hidden Service + Nginx + PM2 + Docker

## Features
- 💬 Ephemeral Global Chat (auto-delete after 24h)
- 📦 Resource Sharing Platform
- 📝 Tor Talks (Anonymous Blog)
- 💡 Idea Bay
- 🛡 Security Tools Dashboard
- 🔐 Anonymous Auth (no email/password)

## Quick Start

### Development
```bash
# Backend
cd server
npm install
cp .env.example .env
npm run dev

# Frontend
cd client
npm install
npm run dev
```

### Production (Docker)
```bash
docker-compose up -d
```

## Security
- No IP logging
- No analytics trackers
- Input sanitization everywhere
- XSS/CSRF protection
- File type whitelisting
- Rate limiting
- Onion-only access enforcement
- Rotating session tokens

## License
MIT — Use at your own risk. For educational purposes.
