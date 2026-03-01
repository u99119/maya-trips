# Cloudflare Pages Deployment Guide

## Why Cloudflare Pages?

- ✅ **Unlimited bandwidth** (no credit system!)
- ✅ **500 builds/month** (vs Netlify's 300 minutes)
- ✅ **No overage charges** on free tier
- ✅ **Faster global CDN**
- ✅ **Perfect for PWAs**

---

## Initial Setup (One-Time)

### Option 1: Web Dashboard (Recommended for First Deploy)

1. **Go to Cloudflare Pages**
   - Visit: https://pages.cloudflare.com/
   - Sign up or log in

2. **Create New Project**
   - Click **"Create a project"**
   - Click **"Connect to Git"**
   - Select **GitHub**
   - Authorize Cloudflare

3. **Select Repository**
   - Choose: `u99119/maya-trips`

4. **Configure Build Settings**
   ```
   Project name: maya-trips
   Production branch: main
   Build command: npm run build
   Build output directory: dist
   ```

5. **IMPORTANT: Disable Auto-Deployments**
   - After first deploy, go to **Settings** → **Builds & deployments**
   - Under **Build configuration**, toggle **OFF** "Automatic deployments"
   - This prevents deploying on every push!

6. **Deploy**
   - Click **"Save and Deploy"**
   - Wait 1-2 minutes
   - Your site will be live at: `https://maya-trips.pages.dev`

---

### Option 2: CLI (For Manual Deployments)

**Install Wrangler CLI:**
```bash
npm install -g wrangler
```

**Login to Cloudflare:**
```bash
wrangler login
```

**Deploy manually:**
```bash
# Build first
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=maya-trips
```

---

## Manual Deployment Workflow (Recommended)

### When You Want to Deploy:

**Option A: Via Web Dashboard**
1. Go to https://dash.cloudflare.com/
2. Navigate to **Pages** → **maya-trips**
3. Click **"Create deployment"**
4. Select branch: `main`
5. Click **"Deploy"**

**Option B: Via CLI (Faster)**
```bash
# Build and deploy in one go
npm run build && wrangler pages deploy dist --project-name=maya-trips
```

**Option C: Git Tags (Best Practice)**
Only deploy when you create a release tag:
```bash
# When ready to deploy
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# Then deploy via CLI or dashboard
npm run build && wrangler pages deploy dist --project-name=maya-trips
```

---

## Deployment Strategy to Avoid Credit Issues

### ❌ DON'T:
- Auto-deploy on every commit
- Push multiple commits in quick succession
- Deploy work-in-progress code

### ✅ DO:
- Work on a `dev` branch locally
- Test thoroughly with `npm run dev`
- Only deploy when you have a stable release
- Use manual deployments via CLI or dashboard
- Deploy once per feature/fix, not per commit

---

## Branch Strategy (Optional but Recommended)

```bash
# Create a dev branch for development
git checkout -b dev

# Make changes, commit freely
git add .
git commit -m "Work in progress"

# When ready to release
git checkout main
git merge dev
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin main --tags

# Then manually deploy
npm run build && wrangler pages deploy dist --project-name=maya-trips
```

---

## Custom Domain (Optional)

1. Go to **Pages** → **maya-trips** → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter your domain (e.g., `maya-trips.com`)
4. Follow DNS configuration instructions
5. SSL certificate auto-provisioned

---

## Environment Variables (If Needed Later)

1. Go to **Settings** → **Environment variables**
2. Add variables for production
3. Redeploy for changes to take effect

---

## Monitoring & Analytics

**Check Deployment Status:**
- Dashboard: https://dash.cloudflare.com/ → Pages → maya-trips
- See build logs, deployment history, analytics

**Check Bandwidth Usage:**
- Cloudflare Pages → Analytics
- **No limits on free tier!** 🎉

---

## Troubleshooting

### Build Fails
```bash
# Test build locally first
npm run build

# Check build logs in Cloudflare dashboard
```

### Site Not Updating
- Clear Cloudflare cache: Settings → Caching → Purge Everything
- Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### PWA Not Installing
- Ensure HTTPS (Cloudflare provides this automatically)
- Check service worker in DevTools → Application → Service Workers

---

## Cost Comparison

| Feature | Netlify Free | Cloudflare Pages Free |
|---------|--------------|----------------------|
| Bandwidth | 100 GB/month ⚠️ | **Unlimited** ✅ |
| Builds | 300 min/month ⚠️ | 500 builds/month ✅ |
| Credit System | Yes (can pause site) ⚠️ | **No credits** ✅ |
| Auto-pause | Yes ⚠️ | **Never** ✅ |
| Build time limit | 15 min | 20 min ✅ |

---

## Next Steps

1. ✅ Deploy to Cloudflare Pages (see above)
2. ✅ Disable auto-deployments in settings
3. ✅ Test the live site
4. ✅ Set up manual deployment workflow
5. ✅ (Optional) Configure custom domain

---

**Your site will be live at:** `https://maya-trips.pages.dev`

**No more credit limits! No more paused sites!** 🚀

