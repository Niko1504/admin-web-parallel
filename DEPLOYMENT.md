# Admin Dashboard Parallel — Deployment Guide

## GitHub Setup

```bash
# Create new repo on GitHub: https://github.com/new
# Repository name: admin-web-parallel
# Description: Parallel development of Washio admin dashboard
# Public repository

# Then:
cd ~/projects/admin-web-parallel
git remote add origin https://github.com/YOUR_USERNAME/admin-web-parallel.git
git branch -M main
git push -u origin main
```

## Vercel Deployment

### Option 1: Via CLI
```bash
npm install -g vercel
cd ~/projects/admin-web-parallel
vercel --prod --name washio-admin-parallel
```

### Option 2: Via Vercel Web Dashboard
1. Go to https://vercel.com/new
2. Import from Git → select `admin-web-parallel` repo
3. Set Environment Variables:
   - `VITE_API_URL=https://api.washio.com`
4. Click Deploy

## Environment Variables on Vercel

Set in Project Settings → Environment Variables:

```
VITE_API_URL=https://api.washio.com
```

## Verify Both Admins Connect to Same Backend

### Admin v1 (WebMedia)
- URL: `https://washio-admin.vercel.app` (or current URL)
- Connects to: `https://api.washio.com`

### Admin v2 (JARVIS/Parallel)
- URL: `https://washio-admin-parallel.vercel.app`
- Connects to: `https://api.washio.com`

**Both see the same MongoDB database in real-time.**

## Testing Real-Time Sync

1. Login to both admin dashboards simultaneously
2. In mobile app: Create a new order
3. Check that order appears in BOTH admins
4. In Admin v1: Change order status
5. Verify Admin v2 shows the status change (may need refresh)

## Local Development

```bash
cd ~/projects/admin-web-parallel

# Install dependencies
npm install

# Start dev server (connects to http://localhost:8000 backend)
npm run dev

# Or change API in .env.local:
VITE_API_URL=https://api.washio.com
```
