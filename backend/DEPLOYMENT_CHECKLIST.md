# ✅ Backend Deployment Checklist - Render

## Pre-Deployment
- [ ] Code pushed to GitHub repository
- [ ] Firebase Admin SDK credentials ready
- [ ] Environment variables documented
- [ ] Frontend URL confirmed

## Render Setup
- [ ] Render account created/logged in
- [ ] GitHub repository connected
- [ ] Web service created with correct settings:
  - [ ] Name: `nursescript-backend`
  - [ ] Environment: `Node`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] Health Check Path: `/api/health`

## Environment Variables
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `FRONTEND_URL` = `https://nurse-s.vercel.app`
- [ ] `FIREBASE_PROJECT_ID` = `nursescriptfirebase`
- [ ] `FIREBASE_PRIVATE_KEY_ID` = [Your Key ID]
- [ ] `FIREBASE_PRIVATE_KEY` = [Your Private Key]
- [ ] `FIREBASE_CLIENT_EMAIL` = [Your Client Email]
- [ ] `FIREBASE_CLIENT_ID` = [Your Client ID]
- [ ] `FIREBASE_AUTH_URI` = `https://accounts.google.com/o/oauth2/auth`
- [ ] `FIREBASE_TOKEN_URI` = `https://oauth2.googleapis.com/token`
- [ ] `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` = `https://www.googleapis.com/oauth2/v1/certs`
- [ ] `FIREBASE_CLIENT_X509_CERT_URL` = [Your Cert URL]

## Optional Variables
- [ ] `OPENROUTER_API_KEY` = [Your API Key]
- [ ] `ELEVEN_LABS_API_KEY` = [Your API Key]
- [ ] `JWT_SECRET` = [Secure Random String]
- [ ] `API_KEY` = [Secure API Key]

## Deployment
- [ ] Service deployed successfully
- [ ] No build errors in logs
- [ ] Health check endpoint responding
- [ ] Backend URL noted: `https://nursescript-backend.onrender.com`

## Testing
- [ ] Health check: `https://nursescript-backend.onrender.com/api/health`
- [ ] CORS working with frontend
- [ ] Firebase connection established
- [ ] API endpoints responding correctly

## Frontend Integration
- [ ] Frontend environment variable updated:
  - [ ] `VUE_APP_API_BASE_URL` = `https://nursescript-backend.onrender.com/api`
- [ ] Frontend redeployed with new backend URL
- [ ] End-to-end testing completed

## Post-Deployment
- [ ] Monitoring set up
- [ ] Error alerts configured
- [ ] Documentation updated
- [ ] Team notified of new URLs

## Files Created/Modified
- [ ] `backend/.env.production` - Production environment variables
- [ ] `backend/.env.example` - Updated with all variables
- [ ] `backend/server.js` - CORS and production configurations
- [ ] `backend/package.json` - Production scripts and engines
- [ ] `backend/render.yaml` - Render configuration
- [ ] `backend/Dockerfile` - Container configuration
- [ ] `backend/healthcheck.js` - Health check script
- [ ] `backend/.dockerignore` - Docker ignore file
- [ ] `backend/RENDER_DEPLOYMENT_GUIDE.md` - Deployment guide
- [ ] `backend/DEPLOYMENT_CHECKLIST.md` - This checklist

---

## Quick Commands

### Test Health Check
```bash
curl https://nursescript-backend.onrender.com/api/health
```

### Test CORS
```bash
curl -H "Origin: https://nurse-s.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://nursescript-backend.onrender.com/api/health
```

### View Logs
- Go to Render dashboard → Your service → Logs tab

---

🎯 **Ready to Deploy!** Follow the detailed guide in `RENDER_DEPLOYMENT_GUIDE.md` for step-by-step instructions.