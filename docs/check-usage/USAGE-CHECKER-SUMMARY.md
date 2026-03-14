# Multi-Service Usage Checker - Implementation Summary

## 📦 What Was Created

A comprehensive usage monitoring script that checks all your cloud services in one place!

### Files Created:

1. **`scripts/ms-check-usage.js`** - Main script (384 lines)
2. **`scripts/USAGE-CHECKER-SETUP.md`** - Detailed setup guide
3. **`scripts/USAGE-CHECKER-QUICKSTART.md`** - Quick start guide
4. **`scripts/CREDENTIALS-TEMPLATE.md`** - Credential collection checklist
5. **`scripts/README.md`** - Scripts directory documentation
6. **Updated `package.json`** - Added `check-usage` npm script

---

## 🎯 Features

### ✅ Multi-Service Support
- **Firebase** (maya-family-trips)
  - Authentication
  - Firestore
  - Storage
  - Shows free tier limits
  - Links to console for manual checking

- **Cloudflare Pages** (maya-trips)
  - Deployment statistics
  - Success/failure rates
  - Latest deployment info
  - Build quota tracking

- **Netlify**
  - Account information
  - Sites list
  - Bandwidth usage
  - Deployment status

### ✅ User-Friendly
- **Interactive Setup** - Guided first-time configuration
- **Secure Storage** - Credentials saved in `~/.ms-usage-config.json` (outside project)
- **Colorful Output** - Beautiful terminal UI with progress bars
- **Smart Defaults** - Skip any service you don't use
- **Help System** - Built-in `--help` flag

### ✅ Flexible
- Check all services or specific ones
- Reconfigure credentials anytime
- No dependencies beyond Node.js built-ins

---

## 🚀 Quick Start

```bash
# Run the script
npm run check-usage

# Or directly
node scripts/ms-check-usage.js
```

### First Time Setup

The script will prompt you for:

1. **Firebase Service Account Key** (JSON file path)
   - Get from: https://console.firebase.google.com/project/maya-family-trips/settings/serviceaccounts/adminsdk

2. **Cloudflare API Token + Account ID**
   - Get from: https://dash.cloudflare.com/profile/api-tokens

3. **Netlify Personal Access Token**
   - Get from: https://app.netlify.com/user/applications#personal-access-tokens

**You can skip any service by pressing Enter!**

---

## 📊 Example Output

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                    MULTI-SERVICE USAGE CHECKER                                 ║
║                    Firebase • Cloudflare • Netlify                             ║
╚════════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ ☁️  CLOUDFLARE PAGES USAGE (maya-trips)                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

  Project: maya-trips
  Production URL: maya-trips.pages.dev
  Created: 1/15/2026

  Deployment Statistics:
    Total Deployments                    42 / 500 ████░░░░░░░░░░░░░░░░ 8.4%
    Successful Deployments                         40
    Failed Deployments                              2

  Latest Deployment:
    Status                                   success
    Branch                                      main
    Deployed                      3/14/2026, 10:30 AM

  Note: Cloudflare Pages free tier includes:
  • 500 builds/month
  • Unlimited bandwidth
  • Unlimited requests
```

---

## 🎨 Visual Features

- **Color-coded output** - Green (good), Yellow (warning), Red (critical)
- **Progress bars** - Visual representation of quota usage
- **Formatted numbers** - Comma-separated for readability
- **Human-readable sizes** - Bytes → KB/MB/GB
- **Clean tables** - Organized, easy-to-scan layout

---

## 🔧 Command Line Options

```bash
# Show help
node scripts/ms-check-usage.js --help

# Check all services (default)
npm run check-usage

# Check specific service only
node scripts/ms-check-usage.js --firebase-only
node scripts/ms-check-usage.js --cloudflare-only
node scripts/ms-check-usage.js --netlify-only

# Reconfigure credentials
node scripts/ms-check-usage.js --reconfigure
```

---

## 🔐 Security

- **Credentials stored outside project** - `~/.ms-usage-config.json` in home directory
- **Not in git** - `.env` pattern already in `.gitignore`
- **Read-only access** - API tokens only need read permissions
- **Easy to reset** - Delete config file to start over

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `scripts/USAGE-CHECKER-QUICKSTART.md` | Get started in 5 minutes |
| `scripts/USAGE-CHECKER-SETUP.md` | Detailed setup instructions |
| `scripts/CREDENTIALS-TEMPLATE.md` | Credential collection checklist |
| `scripts/README.md` | Scripts directory overview |

---

## 💡 Pro Tips

1. **Run weekly** - Monitor usage to avoid hitting free tier limits
2. **Watch the bars** - Red (>80%) means you're close to limits
3. **Firebase manual** - Firebase requires checking console manually
4. **Skip services** - Press Enter during setup to skip unused services
5. **Reconfigure anytime** - Use `--reconfigure` flag

---

## 🎯 Free Tier Limits to Monitor

| Service | Metric | Free Tier Limit |
|---------|--------|-----------------|
| Firebase Auth | Users | 10,000/month |
| Firestore | Reads | 50,000/day |
| Firestore | Writes | 20,000/day |
| Firestore | Storage | 1 GB |
| Cloudflare | Builds | 500/month |
| Netlify | Bandwidth | 100 GB/month |
| Netlify | Build Minutes | 300/month |

---

## 🔗 Quick Links

- [Firebase Usage Dashboard](https://console.firebase.google.com/project/maya-family-trips/usage)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Netlify Dashboard](https://app.netlify.com/)

---

## ✅ Next Steps

1. **Gather credentials** - Use `scripts/CREDENTIALS-TEMPLATE.md` as a checklist
2. **Run the script** - `npm run check-usage`
3. **Set up a reminder** - Check usage weekly
4. **Monitor quotas** - Watch for yellow/red indicators

---

## 🆘 Need Help?

- **Setup issues?** → See `scripts/USAGE-CHECKER-SETUP.md`
- **Quick reference?** → See `scripts/USAGE-CHECKER-QUICKSTART.md`
- **Credential help?** → See `scripts/CREDENTIALS-TEMPLATE.md`
- **Command help?** → Run `node scripts/ms-check-usage.js --help`

