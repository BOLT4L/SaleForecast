# Render Deployment Guide

## Quick Reference

### Deployment Configuration Summary

| Setting | Value |
|---------|-------|
| **Language** | Node |
| **Build Command** | `cd frontend && npm install && npm run build && cd ../backend && npm install` |
| **Start Command** | `node start.js` |
| **Root Directory** | (leave empty) |
| **Environment** | Node 18+ |

### Required Environment Variables

```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
REDIS_URL=redis://red-xxxxx:6379
JWT_SECRET=your-secret-key-here
FRONTEND_URL=https://your-app.onrender.com
BASE_URL=https://your-app.onrender.com
VITE_API_URL=https://your-app.onrender.com/api
```

### Optional Environment Variables

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-password
ADMIN_EMAIL=admin@company.com
LOW_STOCK_THRESHOLD=10
```

---

## Project Overview

This is a full-stack Sales Forecasting application with:
- **Backend**: Node.js/Express API server
- **Frontend**: React/TypeScript with Vite
- **Databases**: MongoDB and Redis
- **Python Scripts**: ML forecasting scripts (Prophet, XGBoost)

**Deployment Strategy**: Both backend and frontend are deployed as a single service. The backend serves the frontend static files in production mode.

---

## 1. Database Setup on Render

### MongoDB Setup

1. Go to your Render Dashboard
2. Click **"New +"** → **"PostgreSQL"** (Render doesn't have MongoDB, use MongoDB Atlas instead)
3. **OR** Use MongoDB Atlas (Recommended):
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string (mongodb+srv://...)
   - Whitelist Render IPs (0.0.0.0/0 for development)

### Redis Setup

1. Go to Render Dashboard
2. Click **"New +"** → **"Redis"**
3. Choose a name (e.g., `sales-forecast-redis`)
4. Select **Free** plan
5. Click **"Create Redis"**
6. Copy the **Internal Redis URL** (for backend) and **External Redis URL** (if needed)

---

## 2. Web Service Deployment (Backend + Frontend Combined)

Since both backend and frontend need to run together, we'll deploy them as a single service:

### Step 1: Create Web Service

1. Go to Render Dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository and branch

### Step 2: Configure Service Settings

#### Basic Settings:
- **Name**: `sales-forecast-app` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (root of repo)

#### Build & Deploy:

**Language**: `Node`

**Build Command**:
```bash
cd frontend && npm install && npm run build && cd ../backend && npm install
```

**Start Command**:
```bash
node start.js
```

**Note**: The `start.js` file in the root directory starts the backend server, which automatically serves the frontend static files in production mode.

#### Environment Variables:

Add these environment variables in Render Dashboard:

**Backend Variables:**
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sales-forecast?retryWrites=true&w=majority
REDIS_URL=redis://red-xxxxx:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://your-app-name.onrender.com
BASE_URL=https://your-app-name.onrender.com
```

**Email Configuration (Optional):**
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
ADMIN_EMAIL=admin@yourcompany.com
```

**Product Configuration:**
```
LOW_STOCK_THRESHOLD=10
```

**Frontend Variables:**
```
VITE_API_URL=https://your-app-name.onrender.com/api
```

**Important Notes:**
- Replace `your-app-name.onrender.com` with your actual Render service URL
- Replace MongoDB connection string with your Atlas connection string
- Replace Redis URL with your Render Redis internal URL
- Generate a strong JWT_SECRET (use: `openssl rand -base64 32`)

---

## 3. File Structure for Deployment

The project structure should be:
```
SaleForecast/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── start.js          (NEW - will be created)
└── package.json      (NEW - root package.json for convenience)
```

---

## 4. Deployment Commands Summary

### Language
**Node**

### Build Command
```bash
cd frontend && npm install && npm run build && cd ../backend && npm install
```

### Start Command
```bash
node start.js
```

### Environment Variables (Complete List)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `REDIS_URL` | Redis connection URL | `redis://red-xxxxx:6379` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.onrender.com` |
| `BASE_URL` | Base API URL | `https://your-app.onrender.com` |
| `EMAIL_USER` | Email username (optional) | `your-email@gmail.com` |
| `EMAIL_PASS` | Email password (optional) | `app-password` |
| `ADMIN_EMAIL` | Admin email (optional) | `admin@company.com` |
| `LOW_STOCK_THRESHOLD` | Low stock threshold | `10` |
| `VITE_API_URL` | Frontend API URL | `https://your-app.onrender.com/api` |

---

## 5. Post-Deployment Steps

1. **Verify Backend**: Visit `https://your-app.onrender.com/api-docs` to see Swagger docs
2. **Verify Frontend**: Visit `https://your-app.onrender.com` to see the app
3. **Check Logs**: Monitor Render logs for any errors
4. **Test Database Connections**: Ensure MongoDB and Redis are connected

---

## 6. Python Scripts Setup (Optional)

If you need Python ML scripts to run:

1. Create a separate **Background Worker** service
2. Use **Python** runtime
3. Install dependencies: `pip install -r backend/scripts/requirements.txt`
4. Run your Python scripts as needed

**Note**: For ML forecasting, you may want to call Python scripts from Node.js using `python-shell` (already in dependencies).

---

## 7. Troubleshooting

### Common Issues:

1. **Build Fails**: Check Node version (Render uses Node 18+ by default)
2. **MongoDB Connection Error**: Verify connection string and IP whitelist
3. **Redis Connection Error**: Use internal Redis URL, not external
4. **Frontend Not Loading**: Check `VITE_API_URL` matches your backend URL
5. **CORS Errors**: Ensure `FRONTEND_URL` matches your deployed frontend URL
6. **Content Security Policy (CSP) Errors**: The Helmet configuration in `server.js` is already configured to allow API connections for both local development and Render deployment. If you see CSP violations, verify your `FRONTEND_URL` and `BASE_URL` environment variables are set correctly.

### Checking Logs:

- Go to Render Dashboard → Your Service → **Logs** tab
- Check both build logs and runtime logs

---

## 8. Alternative: Separate Services (Advanced)

If you prefer separate backend and frontend services:

### Backend Service:
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Port**: `5000`

### Frontend Service:
- **Build Command**: `cd frontend && npm install && npm run build`
- **Start Command**: `cd frontend && npm run preview` (or serve static files)
- **Port**: `3000`

**Note**: This requires configuring CORS properly and managing two services.

---

## 9. Security Recommendations

1. ✅ Use strong `JWT_SECRET` (32+ characters)
2. ✅ Use MongoDB Atlas with IP whitelisting
3. ✅ Use Redis internal URL (not exposed externally)
4. ✅ Enable HTTPS (automatic on Render)
5. ✅ Set `NODE_ENV=production`
6. ✅ Review and restrict CORS origins
7. ✅ Use environment variables for all secrets

---

## 10. Cost Estimation

- **Web Service**: Free tier available (spins down after inactivity)
- **Redis**: Free tier available (25MB)
- **MongoDB Atlas**: Free tier available (512MB)
- **Total**: $0/month (with limitations)

For production, consider:
- Render paid plans ($7+/month) for always-on service
- MongoDB Atlas paid plans for more storage
- Redis paid plans for more memory

---

## Quick Start Checklist

- [ ] MongoDB Atlas cluster created and connection string obtained
- [ ] Redis instance created on Render
- [ ] Web service created on Render
- [ ] All environment variables set
- [ ] Build command configured
- [ ] Start command configured
- [ ] Repository connected and deployed
- [ ] Service is running and accessible
- [ ] Database connections verified
- [ ] Frontend and backend working together

