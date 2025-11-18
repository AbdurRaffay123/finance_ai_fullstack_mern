# 🚀 Render Deployment - Step by Step Guide

## Quick Start Checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas connection string ready
- [ ] Gmail App Password ready
- [ ] Render account created

---

## Step-by-Step Instructions

### STEP 1: Go to Render Dashboard
1. Visit: **https://dashboard.render.com**
2. Sign in or create a free account
3. Click the **"New +"** button (top right corner)

---

### STEP 2: Create Web Service
1. Click **"Web Service"** from the dropdown menu

---

### STEP 3: Connect GitHub
1. If first time: Click **"Connect account"** → Authorize Render
2. Search for your repository: `finance_ai_fullstack_mern`
3. Click **"Connect"** next to your repository

---

### STEP 4: Configure Service

Fill in these fields:

| Field | Enter This Value |
|-------|------------------|
| **Name** | `finance-backend` |
| **Region** | `Oregon (US West)` (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | `Finance_backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

---

### STEP 5: Add Environment Variables

Click **"Advanced"** → Scroll to **"Environment Variables"**

Click **"Add Environment Variable"** for each one:

#### Variable 1: NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`

#### Variable 2: PORT
- **Key:** `PORT`
- **Value:** `10000`

#### Variable 3: MONGODB_URI
- **Key:** `MONGODB_URI`
- **Value:** `mongodb+srv://Abdur_Raffay:1donHEX%40GON@cluster0.hhyudfz.mongodb.net/finance_ai?retryWrites=true&w=majority`

#### Variable 4: JWT_SECRET
- **Key:** `JWT_SECRET`
- **Value:** Generate using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
  - Run this command locally, copy the output, paste here

#### Variable 5: EMAIL_HOST
- **Key:** `EMAIL_HOST`
- **Value:** `smtp.gmail.com`

#### Variable 6: EMAIL_PORT
- **Key:** `EMAIL_PORT`
- **Value:** `465`

#### Variable 7: EMAIL_USER
- **Key:** `EMAIL_USER`
- **Value:** `kraffay96@gmail.com`

#### Variable 8: EMAIL_PASS
- **Key:** `EMAIL_PASS`
- **Value:** `uvcivjlhhufwetgz` (your Gmail App Password)

#### Variable 9: EMAIL_FROM
- **Key:** `EMAIL_FROM`
- **Value:** `FinanceAI <kraffay96@gmail.com>`

#### Variable 10: APP_NAME
- **Key:** `APP_NAME`
- **Value:** `FinanceAI`

#### Variable 11: FRONTEND_URL
- **Key:** `FRONTEND_URL`
- **Value:** `https://finance-frontend.onrender.com` (update after deploying frontend)

#### Variable 12: FASTAPI_URL
- **Key:** `FASTAPI_URL`
- **Value:** `https://finance-fastapi.onrender.com` (update after deploying FastAPI)

---

### STEP 6: Create Service
1. Review all settings
2. Scroll down
3. Click **"Create Web Service"** button

---

### STEP 7: Wait for Deployment
1. Watch the build logs (appears automatically)
2. Wait 5-10 minutes for deployment
3. Look for: **"Your service is live"** message
4. Copy your service URL (e.g., `https://finance-backend.onrender.com`)

---

### STEP 8: Verify Deployment

#### Check Logs
1. Click **"Logs"** tab
2. Look for:
   ```
   ✅ MongoDB Atlas connected successfully
   Server running on port 10000
   ```

#### Test Endpoint
Open in browser or use curl:
```
https://finance-backend.onrender.com/api/auth/login
```

You should see an error (expected - no data sent), confirming service is running.

---

### STEP 9: Update URLs (After Deploying Other Services)

After deploying Frontend and FastAPI:

1. Go to **finance-backend** service
2. Click **"Environment"** tab
3. Update:
   - `FRONTEND_URL` → Your actual frontend URL
   - `FASTAPI_URL` → Your actual FastAPI URL
4. Click **"Save Changes"**
5. Service will auto-redeploy

---

## ✅ Success Checklist

- [ ] Service shows "Live" status
- [ ] Logs show MongoDB connection successful
- [ ] Test endpoint responds (even with error)
- [ ] All environment variables set
- [ ] Service URL copied and saved

---

## 🆘 Troubleshooting

### Build Failed?
- Check build logs for errors
- Verify `package.json` has all dependencies
- Ensure Root Directory is `Finance_backend`

### MongoDB Connection Error?
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0`)
- Verify database user credentials

### Service Not Starting?
- Check logs for errors
- Verify all environment variables are set
- Ensure `PORT` is set to `10000`

### CORS Errors?
- Update `FRONTEND_URL` with actual frontend URL
- Check for trailing slashes
- Verify CORS configuration in `server.js`

---

## 📞 Need Help?

1. Check Render logs (most helpful)
2. Review MongoDB Atlas connection
3. Verify all environment variables
4. Test endpoints with curl/Postman

---

**Your backend is now live on Render! 🎉**

