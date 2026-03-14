# Scripts Directory

Utility scripts for the PWA Family Travel Navigation project.

---

## 📊 Usage Checker (`ms-check-usage.js`)

**Monitor all your cloud service usage in one place!**

### Quick Start

```bash
npm run check-usage
```

### What It Does

Checks usage statistics for:
- ✅ **Firebase** (maya-family-trips) - Auth, Firestore, Storage
- ✅ **Cloudflare Pages** (maya-trips) - Deployments, builds
- ✅ **Netlify** - Sites, bandwidth, deployments

### Documentation

📚 **All documentation is in:** `docs/check-usage/`

- **[Quick Start](../docs/check-usage/USAGE-CHECKER-QUICKSTART.md)** - Get started in 5 minutes
- **[Setup Guide](../docs/check-usage/USAGE-CHECKER-SETUP.md)** - Detailed instructions
- **[Credentials Template](../docs/check-usage/CREDENTIALS-TEMPLATE.md)** - Credential checklist
- **[Summary](../docs/check-usage/USAGE-CHECKER-SUMMARY.md)** - Complete overview

### Command Options

```bash
# Show help
node scripts/ms-check-usage.js --help

# Check all services
npm run check-usage

# Check specific service
node scripts/ms-check-usage.js --firebase-only
node scripts/ms-check-usage.js --cloudflare-only
node scripts/ms-check-usage.js --netlify-only

# Reconfigure credentials
node scripts/ms-check-usage.js --reconfigure
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

```bash
open scripts/generate-icons.html
```

---

## 📝 Notes

- Run scripts from the project root directory
- Credentials are stored securely in `~/.ms-usage-config.json`
- Never commit API keys or tokens to version control

