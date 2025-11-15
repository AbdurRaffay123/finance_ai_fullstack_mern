# Render Deployment Checklist

Use this checklist to ensure all steps are completed correctly.

## Pre-Deployment

- [ ] All code is committed and pushed to GitHub
- [ ] MongoDB Atlas account created and database ready
- [ ] MongoDB connection string copied
- [ ] Email credentials ready (Gmail App Password)
- [ ] JWT secret generated

## Step 1: Deploy Backend

- [ ] Created new Web Service in Render
- [ ] Connected GitHub repository
- [ ] Set name: `finance-backend`
- [ ] Set environment: `Node`
- [ ] Set root directory: `Finance_backend`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Added all environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `MONGODB_URI` (your connection string)
  - [ ] `JWT_SECRET` (generated secret)
  - [ ] `EMAIL_HOST=smtp.gmail.com`
  - [ ] `EMAIL_PORT=587`
  - [ ] `EMAIL_USER` (your email)
  - [ ] `EMAIL_PASS` (your app password)
  - [ ] `EMAIL_FROM` (your email)
  - [ ] `APP_NAME=FinanceAI`
  - [ ] `FRONTEND_URL` (placeholder - update later)
  - [ ] `FASTAPI_URL` (placeholder - update later)
- [ ] Service deployed successfully
- [ ] Backend URL copied: `https://finance-backend.onrender.com`

## Step 2: Deploy FastAPI

- [ ] Created new Web Service in Render
- [ ] Connected GitHub repository
- [ ] Set name: `finance-fastapi`
- [ ] Set environment: `Python 3`
- [ ] Set root directory: `Finance_FastAPI`
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- [ ] Added environment variables:
  - [ ] `PORT=10000`
  - [ ] `FRONTEND_URL` (placeholder - update later)
- [ ] Service deployed successfully
- [ ] FastAPI URL copied: `https://finance-fastapi.onrender.com`

## Step 3: Deploy Frontend

- [ ] Created new Static Site in Render
- [ ] Connected GitHub repository
- [ ] Set name: `finance-frontend`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set publish directory: `dist`
- [ ] Added environment variables:
  - [ ] `VITE_API_URL=https://finance-backend.onrender.com/api`
  - [ ] `VITE_FASTAPI_URL=https://finance-fastapi.onrender.com`
- [ ] Service deployed successfully
- [ ] Frontend URL copied: `https://finance-frontend.onrender.com`

## Step 4: Update URLs

- [ ] Updated backend `FRONTEND_URL` with frontend URL
- [ ] Updated backend `FASTAPI_URL` with FastAPI URL
- [ ] Updated FastAPI `FRONTEND_URL` with frontend URL
- [ ] All services redeployed after URL updates

## Step 5: Verification

- [ ] Backend health check: Visit backend URL + `/api/auth/login`
- [ ] FastAPI docs: Visit FastAPI URL + `/docs`
- [ ] Frontend loads: Visit frontend URL
- [ ] Can register new user
- [ ] Can login
- [ ] Can access dashboard
- [ ] Can add transactions
- [ ] Can view predictions (if FastAPI is working)
- [ ] Can get AI recommendations

## Post-Deployment

- [ ] All services are running
- [ ] No errors in Render logs
- [ ] MongoDB connection working
- [ ] Email functionality tested (password reset)
- [ ] Custom domain configured (if applicable)
- [ ] Auto-deploy enabled for all services

## Troubleshooting Notes

- [ ] Checked MongoDB Atlas IP whitelist
- [ ] Verified all environment variables are set
- [ ] Checked CORS settings
- [ ] Reviewed build logs for errors
- [ ] Tested API endpoints manually

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Backend URL:** _______________
**Frontend URL:** _______________
**FastAPI URL:** _______________

