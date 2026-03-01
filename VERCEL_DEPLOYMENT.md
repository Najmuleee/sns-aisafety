# Vercel Deployment Guide for PFIP

## Prerequisites
- Vercel account (free)
- GitHub account with your repo
- Project pushed to GitHub

## Step 1: Push to GitHub
```bash
cd ~/pfip/pfip-complete
git init
git add .
git commit -m "PFIP project with Vercel config"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sns-aisafety.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
npm install -g vercel
vercel
# Follow prompts, select your GitHub repo
```

### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your GitHub repo (sns-aisafety)
3. Select Framework: **Vite**
4. Environment Variables: Add these
   ```
   DATABASE_URL=file:./pfip.db
   JWT_SECRET=your-secret-key
   VITE_DEMO_MODE=true
   ```
5. Click Deploy

## Step 3: Configure Environment Variables
In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   - `DATABASE_URL`: `file:./pfip.db`
   - `JWT_SECRET`: Generate random string
   - `VITE_DEMO_MODE`: `true`
   - `OAUTH_SERVER_URL`: `https://your-vercel-domain.vercel.app`
   - `VITE_OAUTH_PORTAL_URL`: `https://your-vercel-domain.vercel.app`

## Step 4: Redeploy
After adding env vars, redeploy:
```bash
vercel --prod
```

## Troubleshooting

### Still showing TypeScript code?
- Check `vercel.json` exists
- Verify `outputDirectory` is `dist`
- Check build logs in Vercel dashboard

### Database errors?
- SQLite works on Vercel (file-based)
- Database persists in `/tmp` (ephemeral)
- For production, use external DB (Supabase, PlanetScale)

### Demo mode not working?
- Ensure `VITE_DEMO_MODE=true` in env vars
- Redeploy after adding env vars

## Next Steps
1. Test at https://your-domain.vercel.app
2. Try Dashboard, Profile, Upload pages
3. Test face upload and consent flow
4. Then setup GitHub OAuth for production

## GitHub OAuth Setup (Optional)
1. Go to https://github.com/settings/developers
2. Create New OAuth App
3. Set Callback to: `https://your-vercel-domain.vercel.app/api/oauth/callback`
4. Add Client ID and Secret to Vercel env vars
