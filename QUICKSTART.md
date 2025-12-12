# 🚀 MockGen - Quick Start Guide

**Status:** ✅ **READY TO RUN**

---

## 🎯 Quick Start (One Command)

```bash
docker compose up -d --build
```

Then open: **http://localhost:8080**

---

## 📋 What You Need

### Required: Google Gemini API Key (for AI features)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key" → "Create API key"
3. Add it to `.env` file in project root:

```bash
GEMINI_API_KEY=your_key_here
```

**Note:** The app works without the API key, but AI features (mentor chat, code analysis) will be disabled.

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Main App** | http://localhost:8080 | Full application with nginx gateway |
| **Client Direct** | http://localhost:5173 | React frontend only |
| **API Direct** | http://localhost:3000 | NestJS backend API |
| **GraphQL** | http://localhost:3000/graphql | GraphQL Playground |

---

## 📋 Common Commands

```bash
# Start services (in background)
docker compose up -d --build

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f server
docker compose logs -f client

# Stop all services
docker compose down

# Restart a service
docker compose restart server

# Clean rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 🔧 Troubleshooting

### "Access denied" for Docker
```bash
# Check if you're in docker group
groups

# If not, add yourself and restart
sudo usermod -aG docker $USER
newgrp docker
```

### Port already in use
Edit `docker-compose.yml` and change the port on the left side:
```yaml
ports:
  - "8081:80"  # Changed 8080 to 8081
```

### Server not starting
```bash
# Check logs
docker compose logs server

# Rebuild
docker compose build server --no-cache
docker compose restart server
```

---

## ✅ Features Working

- ✅ React frontend with Vite
- ✅ NestJS backend with GraphQL
- ✅ MySQL database (auto-configured)
- ✅ Redis cache
- ✅ Nginx gateway with CORS
- ✅ Hot reload for development

## ⚠️ AI Features Need API Key

- AI Mentor chat panel
- Repository code scanner
- Error log analysis
