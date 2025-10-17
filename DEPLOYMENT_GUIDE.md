# 🚀 NurseScript Frontend Deployment Guide - Vercel

This guide will walk you through deploying your NurseScript frontend application to Vercel step by step.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ A GitHub account
- ✅ A Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ Git installed on your computer
- ✅ Your project code ready

## 🔧 Step 1: Prepare Your Code for Deployment

### 1.1 Verify Configuration Files
Your project now includes these deployment-ready files:
- ✅ `vercel.json` - Vercel configuration
- ✅ `.env.production` - Production environment variables
- ✅ `.env.example` - Environment variables template
- ✅ Updated `package.json` with Vercel build script
- ✅ Updated `vue.config.js` for production builds
- ✅ Updated Firebase config to use environment variables

### 1.2 Test Local Build
```bash
# Navigate to your project directory
cd d:\NurseScript\NurseScript

# Install dependencies (if not already done)
npm install

# Test the production build
npm run build

# Test the build locally (optional)
npm run preview
```

## 📤 Step 2: Push Code to GitHub

### 2.1 Initialize Git Repository (if not already done)
```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Ready for Vercel deployment"
```

### 2.2 Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New repository" (green button)
3. Name your repository: `nursescript-frontend`
4. Make it **Public** (recommended for free Vercel hosting)
5. **DO NOT** initialize with README (your project already has files)
6. Click "Create repository"

### 2.3 Connect Local Repository to GitHub
```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/nursescript-frontend.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

## 🌐 Step 3: Deploy to Vercel

### 3.1 Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign up" or "Log in"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### 3.2 Import Your Project
1. On Vercel dashboard, click "New Project"
2. Find your `nursescript-frontend` repository
3. Click "Import" next to it

### 3.3 Configure Project Settings
1. **Project Name**: `nursescript-frontend` (or your preferred name)
2. **Framework Preset**: Vercel should auto-detect "Vue.js"
3. **Root Directory**: Leave as `./` (default)
4. **Build Command**: Should auto-fill as `npm run vercel-build`
5. **Output Directory**: Should auto-fill as `dist`

### 3.4 Set Environment Variables
In the "Environment Variables" section, add these variables:

**Required Variables:**
```
VUE_APP_FIREBASE_API_KEY = AIzaSyC23l35ymdBbukwneaaSLkp5W_i81XZKcY
VUE_APP_FIREBASE_AUTH_DOMAIN = nursescriptfirebase.firebaseapp.com
VUE_APP_FIREBASE_PROJECT_ID = nursescriptfirebase
VUE_APP_FIREBASE_STORAGE_BUCKET = nursescriptfirebase.firebasestorage.app
VUE_APP_FIREBASE_MESSAGING_SENDER_ID = 78287123313
VUE_APP_FIREBASE_APP_ID = 1:78287123313:web:1e9ff1a53e86d84dc2fcd0
VUE_APP_FIREBASE_MEASUREMENT_ID = G-ED9T6V7L4D
NODE_ENV = production
VUE_APP_ENVIRONMENT = production
VUE_APP_APP_NAME = NurseScript
VUE_APP_VERSION = 1.0.0
```

**Optional (if you have a backend):**
```
VUE_APP_API_URL = https://your-backend-url.vercel.app
```

### 3.5 Deploy
1. Click "Deploy" button
2. Wait for deployment to complete (usually 2-3 minutes)
3. 🎉 Your app will be live at `https://your-project-name.vercel.app`

## 🔄 Step 4: Configure Automatic Deployments

### 4.1 Automatic Deployments
Vercel automatically deploys when you push to your main branch:
```bash
# Make changes to your code
# Then commit and push
git add .
git commit -m "Update: your changes description"
git push origin main
```

### 4.2 Preview Deployments
- Every pull request gets a preview URL
- Test changes before merging to main

## 🔧 Step 5: Configure Custom Domain (Optional)

### 5.1 Add Custom Domain
1. In Vercel dashboard, go to your project
2. Click "Settings" tab
3. Click "Domains" in sidebar
4. Add your custom domain
5. Follow DNS configuration instructions

## 🔒 Step 6: Security Considerations

### 6.1 Firebase Security Rules
Ensure your Firebase security rules are properly configured:
1. Go to Firebase Console
2. Navigate to Firestore Database > Rules
3. Update rules for production environment

### 6.2 Environment Variables Security
- ✅ Firebase config is safe to expose (public API keys)
- ❌ Never expose backend API keys or secrets
- ✅ Use Vercel environment variables for sensitive data

## 🐛 Step 7: Troubleshooting

### 7.1 Common Issues

**Build Fails:**
```bash
# Check build locally first
npm run build

# Check for missing dependencies
npm install
```

**Firebase Connection Issues:**
- Verify all environment variables are set correctly
- Check Firebase project settings
- Ensure Firebase rules allow your domain

**Routing Issues (404 on refresh):**
- The `vercel.json` file handles SPA routing
- Ensure the file is in your repository root

**Module Loading Issues:**
- Check that module files are properly copied in build
- Verify `vue.config.js` copy configuration

### 7.2 Debugging Steps
1. Check Vercel deployment logs
2. Use browser developer tools
3. Check Firebase console for errors
4. Verify environment variables in Vercel dashboard

## 📊 Step 8: Monitoring and Analytics

### 8.1 Vercel Analytics
1. Go to your project in Vercel dashboard
2. Click "Analytics" tab
3. Enable Web Analytics (free tier available)

### 8.2 Firebase Analytics
Your app already includes Firebase Analytics:
- Monitor user engagement
- Track page views
- Analyze user behavior

## 🎯 Step 9: Performance Optimization

### 9.1 Vercel Optimizations
- ✅ Automatic CDN distribution
- ✅ Image optimization
- ✅ Compression enabled

### 9.2 Vue.js Optimizations
- ✅ Production build minification
- ✅ Tree shaking enabled
- ✅ Asset optimization

## 📝 Step 10: Maintenance

### 10.1 Regular Updates
```bash
# Update dependencies
npm update

# Test locally
npm run build

# Deploy
git add .
git commit -m "Update dependencies"
git push origin main
```

### 10.2 Backup Strategy
- ✅ Code backed up on GitHub
- ✅ Database backed up on Firebase
- ✅ Deployment history on Vercel

## 🎉 Congratulations!

Your NurseScript frontend is now deployed to Vercel! 

**Your live URL:** `https://your-project-name.vercel.app`

### Next Steps:
1. Test all functionality on the live site
2. Share the URL with users
3. Monitor performance and usage
4. Set up custom domain if needed
5. Configure backend deployment (if applicable)

## 📞 Support

If you encounter issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Check Vue.js deployment guide: [cli.vuejs.org/guide/deployment](https://cli.vuejs.org/guide/deployment.html)
3. Firebase documentation: [firebase.google.com/docs](https://firebase.google.com/docs)

---

**Happy Deploying! 🚀**