# Git Workflow Guide

## Branch Strategy

This project uses a **two-branch workflow** to save build minutes on Cloudflare Pages:

- **`dev`** - Development branch (work here daily)
- **`main`** - Production branch (deploy only when ready)

---

## Daily Development Workflow

### 1. Make sure you're on dev branch

```bash
git checkout dev
```

### 2. Make your changes

Edit files, test locally with:

```bash
npm run dev
# or
npm run dev:host  # for mobile testing
```

### 3. Commit to dev branch

```bash
git add -A
git commit -m "Your descriptive commit message"
git push origin dev
```

**Note:** Pushing to `dev` does NOT trigger a Cloudflare build. You can commit as many times as you want!

---

## Deploying to Production

### When you're ready to deploy (1-3 times per day):

```bash
# Make sure all changes are committed on dev
git add -A
git commit -m "Final changes before deploy"
git push origin dev

# Switch to main branch
git checkout main

# Merge dev into main
git merge dev

# Push to main (this triggers Cloudflare build)
git push origin main

# Switch back to dev for continued work
git checkout dev
```

**This triggers automatic deployment to:**
- Cloudflare Pages: https://maya-trips.pages.dev/
- Netlify: https://maya-trips.netlify.app/

---

## Quick Commands Reference

```bash
# Check current branch
git branch

# Switch to dev
git checkout dev

# Switch to main
git checkout main

# See status
git status

# See recent commits
git log --oneline -5

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

---

## Build Minutes Savings

**Before (committing to main):**
- Every commit = 1 build = ~2 minutes
- 20 commits/day = 40 minutes/day = 1200 minutes/month ❌

**After (dev branch workflow):**
- Unlimited commits to dev = 0 builds
- 3 deploys/day = 6 minutes/day = 180 minutes/month ✅

**Savings:** ~1000 build minutes per month!

---

## Troubleshooting

### "I'm on the wrong branch!"

```bash
# Check which branch you're on
git branch

# Switch to dev
git checkout dev
```

### "I committed to main by accident!"

```bash
# Move the commit to dev
git checkout dev
git cherry-pick main
git checkout main
git reset --hard HEAD~1
git checkout dev
```

### "I want to see what changed between dev and main"

```bash
git diff main..dev
```

---

## Best Practices

1. ✅ **Always work on `dev` branch**
2. ✅ **Test locally before deploying**
3. ✅ **Deploy to `main` only when ready**
4. ✅ **Write descriptive commit messages**
5. ✅ **Commit often on `dev` (it's free!)**
6. ✅ **Deploy 1-3 times per day max**

---

## Current Branch Status

You are currently on: **`dev`** ✅

To deploy your changes:
1. Commit to dev
2. Switch to main: `git checkout main`
3. Merge dev: `git merge dev`
4. Push: `git push origin main`
5. Switch back: `git checkout dev`

