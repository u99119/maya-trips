# Multi-Service Usage Checker Setup Guide

This script checks usage statistics for all your cloud services in one place.

## 🚀 Quick Start

```bash
node scripts/ms-check-usage.js
```

The script will guide you through first-time setup and save your credentials securely.

---

## 📋 Prerequisites

You'll need API credentials for each service you want to monitor:

### 1. Firebase (maya-family-trips)

**What you need:** Service Account JSON file

**How to get it:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/maya-family-trips/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Save the JSON file to a secure location (e.g., `~/.firebase/maya-family-trips-key.json`)
4. **IMPORTANT:** Never commit this file to git!

**Note:** Firebase doesn't provide programmatic access to usage quotas. The script will show you the link to check manually.

---

### 2. Cloudflare Pages (maya-trips)

**What you need:** 
- API Token
- Account ID

**How to get API Token:**
1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use template: **"Read Cloudflare Pages"** or create custom with:
   - Permissions: `Account.Cloudflare Pages:Read`
   - Account Resources: Include your account
4. Click **"Continue to summary"** → **"Create Token"**
5. **Copy the token** (you won't see it again!)

**How to get Account ID:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click on **"Workers & Pages"**
3. Your Account ID is shown in the right sidebar
4. Or find it in the URL: `dash.cloudflare.com/<ACCOUNT_ID>/...`

---

### 3. Netlify

**What you need:** Personal Access Token

**How to get it:**
1. Go to [Netlify User Settings](https://app.netlify.com/user/applications#personal-access-tokens)
2. Click **"New access token"**
3. Enter description: "Usage Checker Script"
4. Click **"Generate token"**
5. **Copy the token** (you won't see it again!)

---

## 🔐 Security

Your credentials are stored in: `~/.ms-usage-config.json`

**Important:**
- This file is stored in your home directory (outside the project)
- Never commit credentials to git
- Keep your API tokens secure
- You can delete this file anytime to reconfigure

---

## 📊 What You'll See

The script displays:

### Firebase
- Project information
- Free tier limits (manual check required)
- Links to Firebase Console for detailed usage

### Cloudflare Pages
- Project details
- Total deployments
- Success/failure rates
- Latest deployment info
- Build quota usage

### Netlify
- Account information
- Active sites
- Deployment status
- Bandwidth usage (if available)

---

## 🔄 Updating Credentials

To update or reconfigure credentials:

```bash
# Delete the config file
rm ~/.ms-usage-config.json

# Run the script again
node scripts/ms-check-usage.js
```

---

## 🐛 Troubleshooting

### "Firebase credentials not configured"
- Make sure you've downloaded the service account JSON
- Provide the correct path when prompted

### "Cloudflare API returned 403"
- Check your API token has correct permissions
- Verify Account ID is correct
- Token might have expired - generate a new one

### "Netlify API returned 401"
- Your access token might be invalid
- Generate a new token from Netlify dashboard

### "Module not found" errors
- Make sure you're running from the project root
- Node.js version 18+ required (for native fetch)

---

## 💡 Tips

1. **Run regularly:** Add to your weekly routine to monitor usage
2. **Watch quotas:** Keep an eye on usage percentages (red = >80%, yellow = >60%)
3. **Firebase limits:** Check Firebase Console manually for detailed usage
4. **Cloudflare builds:** Free tier = 500 builds/month (monitor deployment count)
5. **Netlify bandwidth:** Free tier = 100GB/month

---

## 🔗 Quick Links

- [Firebase Console - Usage](https://console.firebase.google.com/project/maya-family-trips/usage)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Netlify Dashboard](https://app.netlify.com/)

---

## 📝 Example Output

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                    MULTI-SERVICE USAGE CHECKER                                 ║
║                    Firebase • Cloudflare • Netlify                             ║
╚════════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ 🔥 FIREBASE USAGE (maya-family-trips)                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

  Project ID: maya-family-trips
  Region: asia-south1

  Authentication Users                              N/A (10K/month limit)
  Firestore Reads                                   N/A (50K/day limit)
  ...

╔══════════════════════════════════════════════════════════════════════════════╗
║ ☁️  CLOUDFLARE PAGES USAGE (maya-trips)                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

  Total Deployments                                      42 / 500 ████░░░░░░░░░░░░░░░░ 8.4%
  ...
```

