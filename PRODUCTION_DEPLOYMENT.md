# PFIP Production Deployment Guide

## Overview
This guide walks you through deploying PFIP to Vercel with GitHub OAuth authentication.

## Prerequisites
- GitHub account with `sns-aisafety` repository
- Vercel account (free)
- Your Vercel domain: `sns-aisafety.vercel.app`

---

## Step 1: Create GitHub OAuth Application

### 1.1 Go to GitHub Developer Settings
1. Visit: https://github.com/settings/developers
2. Click **OAuth Apps** in left sidebar
3. Click **New OAuth App**

### 1.2 Fill in OAuth App Details
- **Application name**: `PFIP`
- **Homepage URL**: `https://sns-aisafety.vercel.app`
- **Authorization callback URL**: `https://sns-aisafety.vercel.app/api/oauth/callback`
- Click **Register application**

### 1.3 Copy Credentials
- Copy **Client ID**
- Click **Generate a new client secret** and copy it
- Save both values (you'll need them soon)

---

## Step 2: Configure Vercel Environment Variables

### 2.1 Go to Vercel Project Settings
1. Open https://vercel.com
2. Select your `sns-aisafety` project
3. Go to **Settings** → **Environment Variables**

### 2.2 Add Production Variables
Add these variables for **Production** environment:

```
DATABASE_URL = file:./pfip.db
JWT_SECRET = (generate random string: openssl rand -base64 32)
VITE_DEMO_MODE = false
OAUTH_SERVER_URL = https://sns-aisafety.vercel.app
VITE_OAUTH_PORTAL_URL = https://sns-aisafety.vercel.app
GITHUB_CLIENT_ID = (paste your GitHub Client ID)
GITHUB_CLIENT_SECRET = (paste your GitHub Client Secret)
VITE_APP_ID = (same as GITHUB_CLIENT_ID)
```

### 2.3 Save Variables
Click **Save** for each variable.

---

## Step 3: Deploy to Vercel

### 3.1 Push Latest Code to GitHub
```bash
cd ~/pfip/pfip-complete
git add .
git commit -m "Production deployment with GitHub OAuth"
git push origin main
```

### 3.2 Trigger Vercel Deployment
1. Go to https://vercel.com/dashboard
2. Select `sns-aisafety` project
3. Click **Redeploy** button
4. Wait for build to complete (2-3 minutes)

### 3.3 Verify Deployment
- Visit: https://sns-aisafety.vercel.app
- Should show PFIP home page with "Sign In" button
- Click "Sign In" → Should redirect to GitHub OAuth

---

## Step 4: Test GitHub OAuth Flow

### 4.1 Test Login
1. Click **Sign In** button
2. You'll be redirected to GitHub
3. Approve the authorization
4. You should be logged in and redirected to Dashboard

### 4.2 Test Features
- **Dashboard**: View upload statistics
- **RegisterFaces**: Upload face images for profile
- **UploadImage**: Upload group photos
- **UserProfile**: View upload history and consent status

---

## Step 5: Production Checklist

- [ ] GitHub OAuth app created
- [ ] Vercel env variables configured
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Login flow works
- [ ] All pages accessible
- [ ] Face upload working
- [ ] Consent flow working

---

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all env variables are set
- Verify `package.json` build command is correct

### OAuth Redirect Loop
- Verify callback URL matches exactly: `https://sns-aisafety.vercel.app/api/oauth/callback`
- Check GitHub OAuth app settings
- Clear browser cookies and try again

### Pages Show Blank
- Check browser console for errors (F12)
- Verify env variables are set in Vercel
- Redeploy after changing env variables

### Database Errors
- SQLite works on Vercel (file-based)
- Database resets on each deployment
- For persistent data, upgrade to external DB (Supabase, PlanetScale)

---

## Next Steps

### For Production
1. Set up custom domain (optional)
2. Enable HTTPS (automatic on Vercel)
3. Set up monitoring/logging
4. Backup database regularly

### For Enhancement
1. Add email notifications
2. Implement consent reminder emails
3. Add analytics dashboard
4. Create admin panel

---

## Support

For issues:
1. Check Vercel build logs
2. Check browser console (F12)
3. Review GitHub OAuth app settings
4. Verify all env variables are set

---

## Quick Reference

| Item | Value |
|------|-------|
| Vercel Domain | https://sns-aisafety.vercel.app |
| GitHub Repo | https://github.com/Najmuleee/sns-aisafety |
| OAuth Callback | https://sns-aisafety.vercel.app/api/oauth/callback |
| Database | SQLite (file-based) |
| Framework | Vite + React + Express |
