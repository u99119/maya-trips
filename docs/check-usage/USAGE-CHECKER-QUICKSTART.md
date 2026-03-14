# Usage Checker - Quick Start

## 🚀 Run the Script

```bash
npm run check-usage
```

or

```bash
node scripts/ms-check-usage.js
```

---

## 🔑 First Time Setup - Get Your Credentials

### Firebase Service Account Key

```bash
# 1. Visit this URL:
https://console.firebase.google.com/project/maya-family-trips/settings/serviceaccounts/adminsdk

# 2. Click "Generate new private key"
# 3. Save to: ~/.firebase/maya-family-trips-key.json
# 4. When prompted, enter: /Users/maysingh/.firebase/maya-family-trips-key.json
```

### Cloudflare API Token

```bash
# 1. Visit this URL:
https://dash.cloudflare.com/profile/api-tokens

# 2. Click "Create Token"
# 3. Use template "Read Cloudflare Pages" OR create custom with:
#    - Permission: Account.Cloudflare Pages:Read
# 4. Copy the token when shown
# 5. Get Account ID from: https://dash.cloudflare.com/ (right sidebar)
```

### Netlify Access Token

```bash
# 1. Visit this URL:
https://app.netlify.com/user/applications#personal-access-tokens

# 2. Click "New access token"
# 3. Description: "Usage Checker"
# 4. Copy the token when shown
```

---

## 📊 What You'll See

- **Firebase**: Project info + manual check links (API doesn't provide usage data)
- **Cloudflare**: Deployment count, success rate, latest deployment
- **Netlify**: Sites, bandwidth, deployment status

---

## 🔄 Reconfigure

```bash
rm ~/.ms-usage-config.json
npm run check-usage
```

---

## 💡 Pro Tips

1. **Skip services**: Just press Enter to skip any service during setup
2. **Secure storage**: Credentials saved in `~/.ms-usage-config.json` (outside project)
3. **Check weekly**: Monitor your usage to avoid hitting free tier limits
4. **Firebase manual**: Firebase requires manual checking at console.firebase.google.com

---

## 🎯 Free Tier Limits to Watch

| Service | Limit | What to Monitor |
|---------|-------|-----------------|
| Firebase Auth | 10K users/month | User count |
| Firestore Reads | 50K/day | Read operations |
| Firestore Writes | 20K/day | Write operations |
| Cloudflare Builds | 500/month | Deployment count |
| Netlify Bandwidth | 100GB/month | Traffic |
| Netlify Builds | 300 min/month | Build time |

---

## 🔗 Direct Links

- [Firebase Usage Dashboard](https://console.firebase.google.com/project/maya-family-trips/usage)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Netlify Dashboard](https://app.netlify.com/)

