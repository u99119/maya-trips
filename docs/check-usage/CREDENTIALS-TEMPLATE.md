# Credentials Collection Template

Use this as a checklist to gather all required credentials before running the usage checker.

---

## ✅ Checklist

- [ ] Firebase Service Account Key
- [ ] Cloudflare API Token
- [ ] Cloudflare Account ID
- [ ] Netlify Personal Access Token

---

## 🔥 Firebase Service Account Key

**Project:** maya-family-trips

### Steps:

1. **Go to:** https://console.firebase.google.com/project/maya-family-trips/settings/serviceaccounts/adminsdk

2. **Click:** "Generate new private key" button

3. **Download:** Save the JSON file as:
   ```
   ~/.firebase/maya-family-trips-key.json
   ```

4. **Secure it:**
   ```bash
   chmod 600 ~/.firebase/maya-family-trips-key.json
   ```

5. **Path to enter in script:**
   ```
   /Users/maysingh/.firebase/maya-family-trips-key.json
   ```

### ⚠️ Security Note
- Never commit this file to git
- Keep it in your home directory (outside the project)
- This key has admin access to your Firebase project

---

## ☁️ Cloudflare API Token

**Project:** maya-trips

### Steps:

1. **Go to:** https://dash.cloudflare.com/profile/api-tokens

2. **Click:** "Create Token"

3. **Choose:** "Read Cloudflare Pages" template
   
   OR create custom token with:
   - **Permission:** Account.Cloudflare Pages:Read
   - **Account Resources:** Include → Your Account

4. **Click:** "Continue to summary" → "Create Token"

5. **Copy the token** (you won't see it again!)
   ```
   Token: ________________________________
   ```

### Get Account ID:

1. **Go to:** https://dash.cloudflare.com/

2. **Click:** "Workers & Pages" in sidebar

3. **Find:** Account ID in the right sidebar
   
   OR look in the URL:
   ```
   https://dash.cloudflare.com/<ACCOUNT_ID>/workers-and-pages
   ```

4. **Copy your Account ID:**
   ```
   Account ID: ________________________________
   ```

---

## 🌐 Netlify Personal Access Token

### Steps:

1. **Go to:** https://app.netlify.com/user/applications#personal-access-tokens

2. **Click:** "New access token"

3. **Description:** Enter "Usage Checker Script"

4. **Click:** "Generate token"

5. **Copy the token** (you won't see it again!)
   ```
   Token: ________________________________
   ```

---

## 🚀 Ready to Run!

Once you have all credentials:

```bash
npm run check-usage
```

The script will prompt you for each credential. Just paste them when asked!

---

## 🔄 If You Need to Update Later

```bash
# Delete the config
rm ~/.ms-usage-config.json

# Run again to reconfigure
npm run check-usage
```

Or use the reconfigure option:

```bash
node scripts/ms-check-usage.js --reconfigure
npm run check-usage
```

---

## 📝 Notes

- You can skip any service by pressing Enter when prompted
- Credentials are stored in: `~/.ms-usage-config.json`
- This file is outside your project directory (secure)
- The script will remember your credentials for future runs

---

## 🆘 Troubleshooting

### Firebase: "Permission denied"
- Make sure the service account key file exists
- Check file permissions: `ls -la ~/.firebase/maya-family-trips-key.json`
- Verify the path is correct

### Cloudflare: "API returned 403"
- Token might not have correct permissions
- Verify Account ID is correct
- Try creating a new token

### Netlify: "API returned 401"
- Token might be invalid or expired
- Generate a new token from Netlify dashboard

---

## 🔗 Quick Links

| Service | Link |
|---------|------|
| Firebase Console | https://console.firebase.google.com/project/maya-family-trips |
| Firebase Service Accounts | https://console.firebase.google.com/project/maya-family-trips/settings/serviceaccounts/adminsdk |
| Cloudflare Dashboard | https://dash.cloudflare.com/ |
| Cloudflare API Tokens | https://dash.cloudflare.com/profile/api-tokens |
| Netlify Dashboard | https://app.netlify.com/ |
| Netlify Access Tokens | https://app.netlify.com/user/applications#personal-access-tokens |

