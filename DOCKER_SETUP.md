# 🚀 MockGen - Docker Setup Complete!

**Status:** ✅ **Almost Ready - Just Add Your API Key!**

---

## ✅ **What I've Created For You**

### **Dockerfiles**
- ✅ `/apps/server/Dockerfile` - Production-ready NestJS build
- ✅ `/apps/client/Dockerfile` - Production-ready React/Vite build with nginx
- ✅ `/apps/server/.dockerignore` - Optimized Docker builds
- ✅ `/apps/client/.dockerignore` - Optimized Docker builds

### **Environment Configuration**
- ✅ `/apps/server/.env` - Your environment config (with placeholder)
- ✅ `/apps/server/.env.example` - Template for team members
- ✅ Updated `docker-compose.yml` - Loads .env automatically
- ✅ Updated `.gitignore` - Protects your secrets

### **Already Configured**
- ✅ MySQL database with health checks
- ✅ Redis cache
- ✅ Nginx gateway with WebContainer security headers
- ✅ Full networking setup

---

## 🔑 **ONLY ONE STEP LEFT: Add Your API Key**

### **1. Get Your Gemini API Key (Free)**

Visit: **https://makersuite.google.com/app/apikey**

1. Sign in with Google
2. Click "Get API Key" → "Create API key in new project"
3. Copy your key (looks like: `AIzaSyC...`)

### **2. Add It to Your .env File**

Open: `/apps/server/.env`

Replace this line:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

With your actual key:
```bash
GEMINI_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
```

**That's it!** Everything else is already configured.

---

## 🚀 **How to Run**

### **First Time Setup**

```bash
# From the MockGen root directory
npm run dev
```

This will:
1. ✅ Build all Docker images
2. ✅ Start MySQL database
3. ✅ Start Redis cache
4. ✅ Start NestJS server
5. ✅ Start React client
6. ✅ Start Nginx gateway

### **Access Your Application**

Once running, open your browser to:

- 🌐 **Main App:** http://localhost:8080
- 🔧 **Client Direct:** http://localhost:5173
- 🔌 **API Direct:** http://localhost:3000
- 📊 **GraphQL Playground:** http://localhost:8080/graphql

---

## 📋 **Useful Commands**

### **Start the application**
```bash
npm run dev                 # Start with live logs
npm run dev:detached        # Start in background
```

### **View logs**
```bash
npm run logs                # View all logs
docker-compose logs server  # View server logs only
docker-compose logs client  # View client logs only
```

### **Stop the application**
```bash
npm run down                # Stop and remove containers
```

### **Restart services**
```bash
docker-compose restart server  # Restart backend
docker-compose restart client  # Restart frontend
```

### **Clean rebuild (if things break)**
```bash
npm run down
docker-compose build --no-cache
npm run dev
```

---

## 🐛 **Troubleshooting**

### **"GEMINI_API_KEY is not set" warning**
- ✅ Solution: Add your API key to `/apps/server/.env`

### **Port already in use**
Edit `docker-compose.yml` ports section:
```yaml
ports:
  - "8080:80"   # Change 8080 to another port
  - "3000:3000" # Change 3000 to another port
  - "5173:5173" # Change 5173 to another port
```

### **Database connection errors**
```bash
# Wait for database to be healthy
docker-compose logs db

# Check database health
docker-compose ps
```

### **Can't access localhost:8080**
```bash
# Make sure all services are running
docker-compose ps

# Check nginx logs
docker-compose logs nginx
```

---

## 🎯 **What Each Service Does**

| Service | Port | Description |
|---------|------|-------------|
| **nginx** | 8080 | Gateway - routes all requests |
| **client** | 5173 | React frontend with WebContainer |
| **server** | 3000 | NestJS backend with GraphQL |
| **db** | 3306 | MySQL database |
| **redis** | 6379 | Cache for job queue |

---

## 🔒 **Security Notes**

✅ **Your `.env` file is git-ignored** - Your API key won't be committed
✅ **Keep `.env.example` updated** - For team members (without real keys)
✅ **Never share your `.env` file** - It contains sensitive credentials

---

## ✨ **Features That Will Work**

Once you add your API key:

### **With API Key:**
- ✅ AI Mentor chat panel - Debug with Gemini AI
- ✅ Repository scanner - Auto-generate mocks from code
- ✅ Error log analysis - Get instant fixes
- ✅ Code suggestions - Smart debugging assistance

### **Without API Key:**
- ✅ Mock API endpoints
- ✅ Database storage
- ✅ GraphQL API
- ✅ Basic IDE features
- ❌ AI-powered features (will show "Service Unavailable")

---

## 🎉 **You're All Set!**

Just add your Gemini API key and run:

```bash
npm run dev
```

Then visit: **http://localhost:8080**

Enjoy your MockGen platform! 🚀
