# Deployment Guide

## GitHub Repository Setup ✅

Repository: `https://github.com/u99119/maya-trips`

### Git Commands Used

```bash
git init
git add .
git commit -m "Initial commit: Mayank Family Trips PWA - Phase 1 complete with Vaishno Devi route"
git branch -M main
git remote add origin https://github.com/u99119/maya-trips.git
git push -u origin main
```

---

## Next Steps: Create GitHub Repository

### 1. Create Repository on GitHub

1. Go to [https://github.com/new](https://github.com/new)
2. **Repository name**: `maya-trips`
3. **Description**: "Family travel navigation PWA with offline support"
4. **Visibility**: Public (or Private if you prefer)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### 2. Push to GitHub

After creating the repository, run:

```bash
git push -u origin main
```

This will push all your code to GitHub.

---

## Netlify Deployment

### Option 1: Netlify Dashboard (Recommended)

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub account
5. Select the repository: **u99119/maya-trips**
6. Netlify will auto-detect settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click **"Deploy site"**

### Option 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

---

## Configure Custom Netlify URL

After deployment, your site will have a random URL like `random-name-123.netlify.app`.

To change it to `maya-trips.netlify.app`:

1. Go to your site in Netlify dashboard
2. Click **"Site settings"**
3. Under **"Site information"** → **"Site name"**
4. Change to: `maya-trips`
5. Click **"Save"**

Your site will now be available at: **https://maya-trips.netlify.app**

---

## Verify Deployment

After deployment, check:

- ✅ Site loads at https://maya-trips.netlify.app
- ✅ Map displays correctly
- ✅ Route layers toggle
- ✅ GPS tracking works (requires HTTPS ✓)
- ✅ PWA installable (check browser install prompt)
- ✅ Offline mode works (turn off WiFi and reload)

---

## Continuous Deployment

Once connected to GitHub, Netlify will automatically:

- Deploy on every push to `main` branch
- Show deploy previews for pull requests
- Provide deploy logs and status

---

## Environment Variables (If Needed Later)

If you need to add environment variables (e.g., MapTiler API key):

1. Go to **Site settings** → **Environment variables**
2. Add variables
3. Redeploy

---

## Custom Domain (Optional)

To use a custom domain like `maya-trips.com`:

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow DNS configuration instructions

---

## Troubleshooting

### Build Fails

- Check build logs in Netlify dashboard
- Ensure `package.json` has correct dependencies
- Verify Node.js version compatibility

### PWA Not Installing

- Ensure HTTPS (Netlify provides this automatically)
- Check icons are in `public/icons/` folder
- Verify manifest.webmanifest is generated

### Map Not Loading

- Check browser console for errors
- Verify internet connection for first load
- Check tile provider URLs

---

## Monitoring

Netlify provides:

- **Analytics**: Site traffic and performance
- **Deploy logs**: Build and deploy history
- **Forms**: If you add contact forms later
- **Functions**: For serverless backend (Phase 4)

---

**Your app is ready to deploy! 🚀**

