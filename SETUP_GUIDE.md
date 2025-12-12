# 🚀 MockGen - Setup & Configuration Guide

**Status:** ⚠️ **ACTION REQUIRED** - You need to configure API keys before running

---

## ⚠️ **CRITICAL: What You Need to Set Up**

### **1. Google Gemini API Key** 🔑 (REQUIRED)

Your application uses **Google's Gemini AI** for two critical features:
- **AI Mentor** (ChatPanel) - Analyzes error logs and provides debugging help
- **Repository Scanner** - Analyzes frontend code to generate mock API endpoints

**How to get your API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API key in new project"**
4. Copy your API key

**Where to add it:**

Since you don't have a `.env` file yet, you have two options:

#### **Option A: Create .env file (Recommended for local development)**

Create a file at `/home/ronit/CODDING/MockGen/apps/server/.env`:

```bash
# Required - Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Database (Already configured in docker-compose.yml)
DB_HOST=db
DB_PORT=3306
DB_USERNAME=mockgen_user
DB_PASSWORD=mockgen_password
DB_DATABASE=mockgen_db

# Redis (Already configured in docker-compose.yml)
REDIS_HOST=redis
REDIS_PORT=6379
```

#### **Option B: Add to docker-compose.yml (For Docker deployment)**

Add to `docker-compose.yml` under the `server` service environment:

```yaml
server:
  environment:
    GEMINI_API_KEY: your_gemini_api_key_here  # <-- ADD THIS LINE
    NODE_ENV: development
    DB_HOST: db
    # ... rest of config
```

---

## ✅ **What's Already Configured**

### **Database (MySQL)**
- ✅ Username: `mockgen_user`
- ✅ Password: `mockgen_password`
- ✅ Database: `mockgen_db`
- ✅ Port: `3306`
- ✅ Auto-configured in Docker

### **Redis Cache**
- ✅ Host: `redis`
- ✅ Port: `6379`
- ✅ Auto-configured in Docker

### **Networking**
- ✅ Client: http://localhost:5173
- ✅ Server: http://localhost:3000
- ✅ Nginx Gateway: http://localhost:8080
- ✅ API via Gateway: http://localhost:8080/api

---

## 🐳 **Missing: Docker Configuration**

### **⚠️ Dockerfiles Not Found**

Your `docker-compose.yml` references Dockerfiles that don't exist:
- ❌ `./apps/server/Dockerfile`
- ❌ `./apps/client/Dockerfile`

**You have two options:**

### **Option 1: Run Without Docker (Quick Start)**

```bash
# Terminal 1 - Start Database
docker run -d \\
  --name mockgen_db \\
  -e MYSQL_ROOT_PASSWORD=rootpassword \\
  -e MYSQL_DATABASE=mockgen_db \\
  -e MYSQL_USER=mockgen_user \\
  -e MYSQL_PASSWORD=mockgen_password \\
  -p 3306:3306 \\
  mysql:8.0

# Terminal 2 - Start Redis
docker run -d \\
  --name mockgen_redis \\
  -p 6379:6379 \\
  redis:alpine

# Terminal 3 - Run Server
cd apps/server
npm install
GEMINI_API_KEY=your_key_here npm run start:dev

# Terminal 4 - Run Client
cd apps/client
npm install
npm run dev
```

### **Option 2: Create Dockerfiles (Full Docker Setup)**

I can create the missing Dockerfiles for you. Would you like me to do that?

---

## 📋 **Setup Checklist**

Before running the application:

- [ ] Get Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] Add `GEMINI_API_KEY` to environment (`.env` or `docker-compose.yml`)
- [ ] Decide: Docker or local development?
- [ ] If Docker: Create missing Dockerfiles (I can help!)
- [ ] If Local: Start MySQL and Redis containers manually

---

## 🎯 **What Will Happen Without API Key**

If you skip the API key setup:
- ✅ **Will Work:** Database, authentication, mock endpoints, basic features
- ❌ **Won't Work:** 
  - AI Mentor chat panel (will show "Service Unavailable")
  - Repository scanner feature (can't analyze code)
  - Error log analysis

---

## 🚀 **Quick Start Commands**

### **After Setting Up API Key:**

**With Docker (once Dockerfiles exist):**
```bash
npm run dev
# or
docker-compose up --build
```

**Without Docker:**
```bash
# See "Option 1: Run Without Docker" above
```

---

## ❓ **Need Help?**

Just ask! I can:
- ✅ Create the `.env` file for you
- ✅ Create the missing Dockerfiles
- ✅ Update the docker-compose.yml with your API key
- ✅ Help you get a Gemini API key
- ✅ Set up local development environment

**What would you like me to do next?**
