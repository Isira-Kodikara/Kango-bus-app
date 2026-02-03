# KANGO - Deployment Guide

Deployment instructions for production environments.

---

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- Git repository connected to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your Git repository
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variables:
   - `VITE_API_URL` = `https://your-backend.up.railway.app`
6. Click **Deploy**

### Option 2: Deploy via CLI

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel deploy --prod
```

### Environment Variables (Vercel)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway backend URL |

---

## Backend Deployment (Railway)

### Prerequisites
- Railway account
- GitHub repository

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository

### Step 2: Configure Backend Service

1. Click on the service
2. Go to **Settings**
3. Set **Root Directory:** `backend`
4. Railway auto-detects PHP via `nixpacks.toml`

### Step 3: Add MySQL Database

1. In your project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway creates these environment variables automatically:
   - `MYSQLHOST`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLPORT`

### Step 4: Add Custom Environment Variables

Go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | `your-secure-random-secret-key` |
| `PRODUCTION` | `true` |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` |

Generate a secure JWT secret:
```bash
openssl rand -hex 32
```

### Step 5: Initialize Database

1. In Railway, click on your MySQL service
2. Go to **Data** tab → **Connect** → **Query**
3. Copy and paste contents of `database/schema/tables.sql`
4. Run the query
5. Optionally run `database/seeds/sample-data.sql`

### Step 6: Deploy

Railway auto-deploys on every git push. You can also manually deploy from the dashboard.

### Step 7: Get Your Backend URL

After deployment, Railway provides a URL like:
```
https://kango-backend-production.up.railway.app
```

---

## Railway CLI Deployment (Alternative)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to backend
cd backend

# Initialize project
railway init

# Link to existing project or create new
railway link

# Deploy
railway up

# Add MySQL database
railway add --database mysql

# Open dashboard
railway open
```

---

## Post-Deployment Checklist

### Frontend (Vercel)
- [ ] Environment variables set
- [ ] API URL points to Railway backend
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled (automatic)

### Backend (Railway)
- [ ] MySQL database added
- [ ] Database schema initialized
- [ ] JWT_SECRET set (secure random value)
- [ ] CORS_ORIGINS set to frontend URL
- [ ] PRODUCTION=true

### Testing
- [ ] User registration works
- [ ] User login works
- [ ] Crew login works
- [ ] Admin login works
- [ ] API endpoints responding

---

## Custom Domain Setup

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your domain (e.g., `app.kango.com`)
3. Configure DNS:
   - Add CNAME record pointing to `cname.vercel-dns.com`

### Railway (Backend)
1. Go to Service Settings → Networking
2. Generate a Railway domain or add custom domain
3. Configure DNS:
   - Add CNAME record as instructed by Railway

---

## Monitoring & Logs

### Vercel
- Go to Project → Deployments → Click deployment → View Logs

### Railway
- Go to Service → View Logs
- Use Railway CLI: `railway logs`

---

## Rollback

### Vercel
1. Go to Deployments
2. Find the previous working deployment
3. Click **"..."** → **"Promote to Production"**

### Railway
1. Go to Deployments
2. Click on previous deployment
3. Click **"Redeploy"**
