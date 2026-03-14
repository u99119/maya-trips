# Scripts Directory

This directory contains utility scripts for the PWA Family Travel Navigation project.

## 📊 Usage Checker (`ms-check-usage.js`)

**Monitor all your cloud service usage in one place!**

### Quick Start

```bash
npm run check-usage
```

### Features

✅ **Firebase** - Project info and manual check links  
✅ **Cloudflare Pages** - Deployment stats, build quota  
✅ **Netlify** - Sites, bandwidth, deployment status  
✅ **Secure** - Credentials stored outside project  
✅ **Interactive** - Guided first-time setup  
✅ **Colorful** - Beautiful terminal output with progress bars  

### Documentation

- **[Quick Start Guide](./USAGE-CHECKER-QUICKSTART.md)** - Get started in 5 minutes
- **[Setup Guide](./USAGE-CHECKER-SETUP.md)** - Detailed setup instructions

### Command Line Options

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

### First Time Setup

The script will prompt you for:

1. **Firebase Service Account Key** (JSON file path)
2. **Cloudflare API Token** + Account ID
3. **Netlify Personal Access Token**

You can skip any service by pressing Enter.

### Example Output

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                    MULTI-SERVICE USAGE CHECKER                                 ║
║                    Firebase • Cloudflare • Netlify                             ║
╚════════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ ☁️  CLOUDFLARE PAGES USAGE (maya-trips)                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

  Total Deployments                    42 / 500 ████░░░░░░░░░░░░░░░░ 8.4%
  Successful Deployments                         40
  Failed Deployments                              2
  
  Latest Deployment:
    Status                                   success
    Branch                                      main
    Deployed                      3/14/2026, 10:30 AM
```

---

## 🔥 Firestore Rules Deployment (`deploy-firestore-rules.sh`)

Deploy Firestore security rules to Firebase.

```bash
./scripts/deploy-firestore-rules.sh
```

---

## 🎨 Icon Generator (`generate-icons.html`)

HTML tool for generating PWA icons in various sizes.

Open in browser: `open scripts/generate-icons.html`

---

## 📝 Notes

- All scripts are designed to be run from the project root
- Credentials are stored securely in `~/.ms-usage-config.json`
- Never commit API keys or tokens to version control

