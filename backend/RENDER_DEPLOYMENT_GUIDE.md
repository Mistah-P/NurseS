# 🚀 NurseScript Backend Deployment Guide - Render

This guide will walk you through deploying your NurseScript backend API to Render, a modern cloud platform for hosting web services.

## 📋 Prerequisites

- [x] GitHub account
- [x] Render account (free tier available)
- [x] Firebase project with Admin SDK credentials
- [x] Backend code ready for deployment

## 🔧 Step 1: Prepare Your Repository

### 1.1 Push Backend to GitHub
```bash
cd d:\NurseScript\NurseScript\backend
git init
git add .
git commit -m "Initial backend setup for Render deployment"
git remote add origin https://github.com/YOUR_USERNAME/nursescript-backend.git
git push -u origin main
```

## 🌐 Step 2: Create Render Service

### 2.1 Connect to Render
1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository: `nursescript-backend`

### 2.2 Configure Service Settings
- **Name**: `nursescript-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (or `backend` if in monorepo)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 2.3 Advanced Settings
- **Auto-Deploy**: `Yes`
- **Health Check Path**: `/api/health`

## 🔐 Step 3: Configure Environment Variables

### 3.1 Required Environment Variables
In Render dashboard, add these environment variables:

#### Firebase Configuration
```
FIREBASE_PROJECT_ID = nursescriptfirebase
FIREBASE_PRIVATE_KEY_ID = [Your Firebase Private Key ID]
FIREBASE_PRIVATE_KEY = [Your Firebase Private Key - include quotes and newlines]
FIREBASE_CLIENT_EMAIL = [Your Firebase Client Email]
FIREBASE_CLIENT_ID = [Your Firebase Client ID]
FIREBASE_AUTH_URI = https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI = https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL = https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL = [Your Firebase Client Cert URL]
```

#### Server Configuration
```
NODE_ENV = production
PORT = 10000
FRONTEND_URL = https://nurse-s.vercel.app
```

#### Optional Services
```
OPENROUTER_API_KEY = [Your OpenRouter API Key]
ELEVEN_LABS_API_KEY = [Your Eleven Labs API Key]
JWT_SECRET = [Generate a secure random string]
API_KEY = [Generate a secure API key]
```

### 3.2 Getting Firebase Admin SDK Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `nursescriptfirebase`
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Download the JSON file
6. Extract the values for environment variables:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep quotes and \\n)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `client_id` → `FIREBASE_CLIENT_ID`
   - `client_x509_cert_url` → `FIREBASE_CLIENT_X509_CERT_URL`

## 🚀 Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (usually 2-5 minutes)
3. Your API will be available at: `https://nursescript-backend.onrender.com`

## ✅ Step 5: Test Your Deployment

### 5.1 Health Check
Visit: `https://nursescript-backend.onrender.com/api/health`

Expected response:
```json
{
  "status": "OK",
  "message": "NurseScript Backend API is running",
  "timestamp": "2024-01-XX...",
  "environment": "production",
  "firebase": "Connected"
}
```

### 5.2 Test API Endpoints
```bash
# Test health endpoint
curl https://nursescript-backend.onrender.com/api/health

# Test CORS (replace with your frontend URL)
curl -H "Origin: https://nurse-s.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://nursescript-backend.onrender.com/api/health
```

## 🔗 Step 6: Connect Frontend to Backend

### 6.1 Update Frontend Environment Variables
In your Vercel frontend, add/update:
```
VUE_APP_API_BASE_URL = https://nursescript-backend.onrender.com/api
```

### 6.2 Update Frontend API Calls
Ensure your frontend services use the environment variable:eee
```javascript
// In your API service files
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api';
```

## 🔧 Step 7: Configure Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click **"Settings"** → **"Custom Domains"**
3. Add your domain: `api.nursescript.com`
4. Update DNS records as instructed
5. Update `FRONTEND_URL` in environment variables

## 📊 Monitoring & Maintenance

### Logs
- View logs in Render dashboard under **"Logs"** tab
- Monitor for errors and performance issues

### Scaling
- Free tier: Limited resources
- Upgrade to paid plan for:
  - Better performance
  - Custom domains
  - More concurrent connections

### Updates
- Push to GitHub main branch
- Render auto-deploys changes
- Monitor deployment status in dashboard

## 🚨 Troubleshooting

### Common Issues

#### 1. Firebase Connection Failed
- Check all Firebase environment variables
- Ensure private key includes proper newlines
- Verify service account has proper permissions

#### 2. CORS Errors
- Verify `FRONTEND_URL` environment variable
- Check allowed origins in server.js
- Ensure frontend URL is correct

#### 3. Build Failures
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Review build logs for specific errors

#### 4. Health Check Failures
- Ensure `/api/health` endpoint is accessible
- Check if server starts properly
- Verify PORT environment variable

### Getting Help
- Check Render documentation
- Review server logs
- Test locally first
- Contact support if needed

## 🎯 Production Checklist

- [ ] All environment variables configured
- [ ] Firebase Admin SDK working
- [ ] Health check passing
- [ ] CORS configured for frontend
- [ ] Frontend connected to backend
- [ ] API endpoints tested
- [ ] Monitoring set up
- [ ] Backup strategy in place

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Only allow trusted frontend domains
3. **API Keys**: Rotate regularly
4. **Monitoring**: Set up alerts for errors
5. **Updates**: Keep dependencies updated

---

🎉 **Congratulations!** Your NurseScript backend is now deployed on Render and ready to serve your frontend application!