# Render Quick Start Guide - FinanceAI Deployment

## MongoDB Atlas Connection String

**IMPORTANT:** The connection string is already configured below. Just copy and paste it.

```
mongodb+srv://Abdur_Raffay:1donHEX%40GON@cluster0.hhyudfz.mongodb.net/finance_ai?retryWrites=true&w=majority
```

**Note:** The `@` symbol in the password is URL-encoded as `%40`.

---

## Step-by-Step: Deploy Backend (Node.js)

### 1. Create Web Service
- Go to https://dashboard.render.com
- Click **"New +"** → **"Web Service"**
- Connect your GitHub account (if not connected)
- Select repository: `finance_ai_fullstack_mern`

### 2. Configure Service
- **Name:** `finance-backend`
- **Environment:** `Node`
- **Region:** `Oregon (US West)` (or closest to you)
- **Branch:** `main`
- **Root Directory:** `Finance_backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### 3. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these one by one:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://Abdur_Raffay:1donHEX%40GON@cluster0.hhyudfz.mongodb.net/finance_ai?retryWrites=true&w=majority` |
| `JWT_SECRET` | *(Generate using command below)* |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | `kraffay96@gmail.com` |
| `EMAIL_PASS` | `uvcivjlhhufwetgz` |
| `EMAIL_FROM` | `FinanceAI <kraffay96@gmail.com>` |
| `APP_NAME` | `FinanceAI` |
| `FRONTEND_URL` | `https://finance-frontend.onrender.com` *(Update after frontend deploys)* |
| `FASTAPI_URL` | `https://finance-fastapi.onrender.com` *(Update after FastAPI deploys)* |

### 4. Generate JWT_SECRET

Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as `JWT_SECRET`.

### 5. Create Service
- Click **"Create Web Service"**
- Wait 5-10 minutes for deployment
- Copy the URL (e.g., `https://finance-backend.onrender.com`)

---

## Step-by-Step: Deploy FastAPI

### 1. Create Web Service
- Click **"New +"** → **"Web Service"**
- Select same repository

### 2. Configure Service
- **Name:** `finance-fastapi`
- **Environment:** `Python 3`
- **Region:** Same as backend
- **Branch:** `main`
- **Root Directory:** `Finance_FastAPI`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`

### 3. Add Environment Variables

| Key | Value |
|-----|-------|
| `PORT` | `10000` |
| `FRONTEND_URL` | `https://finance-frontend.onrender.com` *(Update after frontend deploys)* |

### 4. Create Service
- Click **"Create Web Service"**
- Wait for deployment
- Copy the URL (e.g., `https://finance-fastapi.onrender.com`)

---

## Step-by-Step: Deploy Frontend (React)

### 1. Create Static Site
- Click **"New +"** → **"Static Site"**
- Select same repository

### 2. Configure Service
- **Name:** `finance-frontend`
- **Branch:** `main`
- **Root Directory:** *(Leave empty)*
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

### 3. Add Environment Variables

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://finance-backend.onrender.com/api` |
| `VITE_FASTAPI_URL` | `https://finance-fastapi.onrender.com` |

**Important:** Replace `finance-backend` and `finance-fastapi` with your actual service URLs.

### 4. Create Service
- Click **"Create Static Site"**
- Wait for deployment
- Copy the URL (e.g., `https://finance-frontend.onrender.com`)

---

## Step 4: Update URLs (CRITICAL!)

After all 3 services are deployed:

### Update Backend
1. Go to **finance-backend** → **Environment**
2. Update:
   - `FRONTEND_URL` = Your frontend URL
   - `FASTAPI_URL` = Your FastAPI URL
3. Click **"Save Changes"** (auto-redeploys)

### Update FastAPI
1. Go to **finance-fastapi** → **Environment**
2. Update:
   - `FRONTEND_URL` = Your frontend URL
3. Click **"Save Changes"** (auto-redeploys)

---

## MongoDB Atlas Setup

### Whitelist IP Addresses

1. Go to https://cloud.mongodb.com
2. Click **"Network Access"** (left sidebar)
3. Click **"Add IP Address"**
4. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
5. Click **"Confirm"**

This allows Render to connect to your database.

---

## Verify Deployment

1. **Backend:** Visit `https://your-backend-url.onrender.com/api/auth/login` (should show error - that's OK)
2. **FastAPI:** Visit `https://your-fastapi-url.onrender.com/docs` (should show Swagger docs)
3. **Frontend:** Visit `https://your-frontend-url.onrender.com` (should show your app)

---

## Troubleshooting

### MongoDB Connection Issues
- Verify IP whitelist includes `0.0.0.0/0`
- Check connection string has `%40` instead of `@` in password
- Ensure database name is `finance_ai`

### CORS Errors
- Verify all URLs match exactly (no trailing slashes)
- Check environment variables are set correctly
- Wait for services to redeploy after URL updates

### Build Failures
- Check build logs in Render dashboard
- Verify all dependencies are in package.json/requirements.txt
- Ensure root directories are correct

---

## Cost: $0 (100% Free!)

All services run on Render's free tier:
- ✅ No credit card required
- ✅ Free forever
- ✅ Only limitation: Services spin down after 15 min inactivity

---

## Quick Reference

**Backend URL:** `https://finance-backend.onrender.com`  
**FastAPI URL:** `https://finance-fastapi.onrender.com`  
**Frontend URL:** `https://finance-frontend.onrender.com`

**MongoDB Connection:**
```
mongodb+srv://Abdur_Raffay:1donHEX%40GON@cluster0.hhyudfz.mongodb.net/finance_ai?retryWrites=true&w=majority
```

Good luck! 🚀

