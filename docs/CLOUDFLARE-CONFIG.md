# Cloudflare Pages Configuration

**Goal:** Only deploy from `main` branch to save credits and control releases.

---

## 🎯 Correct Configuration

### Production Deployments
- **Branch:** `main` ONLY
- **Trigger:** On push to `main`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

### Preview Deployments
- **Status:** DISABLED
- **Reason:** Save build credits, control releases

---

## 🔧 How to Configure

### Step 1: Access Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** (left sidebar)
3. Click **maya-trips** project
4. Click **Settings** tab

### Step 2: Configure Production Branch

1. Scroll to **"Builds & deployments"** section
2. Find **"Production branch"**
3. Click **Edit**
4. Set to: `main`
5. Click **Save**

### Step 3: Disable Preview Deployments

1. In same **"Builds & deployments"** section
2. Find **"Preview deployments"**
3. Click **Edit**
4. Select **"None"** or **"Disabled"**
5. Click **Save**

### Step 4: Verify Configuration

After saving, you should see:

```
✅ Production branch: main
✅ Preview deployments: None
```

---

## 🚀 Deployment Workflow

### What Triggers a Build

**✅ WILL trigger build:**
```bash
git checkout main
git merge dev-junction
git push origin main
```

**❌ WILL NOT trigger build:**
```bash
git checkout dev-junction
git commit -m "Work in progress"
git push origin dev-junction
```

---

## 💰 Credit Savings

### Before (Wrong Config)
- Every push to ANY branch triggers build
- 10 commits/day × 30 days = 300 builds/month
- Wastes credits on WIP code

### After (Correct Config)
- Only pushes to `main` trigger build
- 2-3 releases/week × 4 weeks = 8-12 builds/month
- **Saves ~290 builds/month!**

---

## 🐛 Troubleshooting

### Issue: Cloudflare still building on dev-junction pushes

**Solution:**
1. Check Cloudflare dashboard settings again
2. Make sure "Preview deployments" is DISABLED
3. Wait 5 minutes for settings to propagate
4. Try pushing to dev-junction again
5. Check Cloudflare deployments page - should show no new build

### Issue: Production not deploying when pushing to main

**Solution:**
1. Check "Production branch" is set to `main`
2. Check build command is `npm run build`
3. Check output directory is `dist`
4. Check GitHub integration is connected
5. Try manual deployment from Cloudflare dashboard

---

## 📊 Monitoring Deployments

### Check Recent Deployments

1. Go to Cloudflare dashboard
2. Click **maya-trips**
3. Click **Deployments** tab
4. You should see:
   - Only deployments from `main` branch
   - No deployments from `dev-junction`

### Check Build Logs

1. Click on any deployment
2. View build logs
3. Check for errors

---

## ✅ Verification Checklist

After configuration:

- [ ] Production branch set to `main`
- [ ] Preview deployments disabled
- [ ] Push to `dev-junction` does NOT trigger build
- [ ] Push to `main` DOES trigger build
- [ ] Only 1 build per `main` push (not multiple)
- [ ] Build completes successfully
- [ ] Site updates at https://maya-trips.pages.dev

---

## 🎯 Summary

**Correct setup:**
- `dev-junction` → Work freely, no builds
- `main` → Merge when ready, triggers build
- Cloudflare → Only watches `main` branch

**This saves credits and gives you control over releases!**

