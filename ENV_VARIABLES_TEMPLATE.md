# Environment Variables Template

Copy these variables to your Render dashboard for each service.

## Backend Service (`finance-backend`)

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://Abdur_Raffay:1donHEX%40GON@cluster0.hhyudfz.mongodb.net/finance_ai?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=FinanceAI <your-email@gmail.com>
APP_NAME=FinanceAI

FRONTEND_URL=https://finance-frontend.onrender.com
FASTAPI_URL=https://finance-fastapi.onrender.com
```

## FastAPI Service (`finance-fastapi`)

```
PORT=10000
FRONTEND_URL=https://finance-frontend.onrender.com
```

## Frontend Service (`finance-frontend`)

```
VITE_API_URL=https://finance-backend.onrender.com/api
VITE_FASTAPI_URL=https://finance-fastapi.onrender.com
```

## How to Generate JWT_SECRET

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET`.

