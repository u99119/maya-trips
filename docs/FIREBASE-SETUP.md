# Firebase Setup Guide

This guide will help you set up Firebase for your PWA Family Travel Navigation app.

**IMPORTANT:** All features are designed to stay within Firebase's **FREE tier** limits.

---

## 📋 Prerequisites

- Google account
- Firebase project (we'll create this)
- 10-15 minutes

---

## 🚀 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `family-travel-pwa` (or your preferred name)
4. Click **Continue**
5. **Google Analytics**: You can disable this for now (optional)
6. Click **Create project**
7. Wait for project creation (30-60 seconds)
8. Click **Continue** when ready

---

## 🔧 Step 2: Register Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`)
2. Enter app nickname: `Family Travel PWA`
3. **Firebase Hosting**: Check this box (we'll use it later)
4. Click **Register app**
5. You'll see a configuration object - **KEEP THIS PAGE OPEN**

---

## 🔑 Step 3: Get Firebase Configuration

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**Copy these values** - you'll need them in Step 5.

---

## 🔐 Step 4: Enable Authentication

1. In Firebase Console, go to **Build** > **Authentication**
2. Click **Get started**
3. Enable **Email/Password**:
   - Click on **Email/Password** provider
   - Toggle **Enable**
   - Click **Save**
4. Enable **Google Sign-In**:
   - Click on **Google** provider
   - Toggle **Enable**
   - Select your support email
   - Click **Save**

---

## 💾 Step 5: Enable Firestore Database

1. In Firebase Console, go to **Build** > **Firestore Database**
2. Click **Create database**
3. Select **Start in production mode** (we'll add security rules later)
4. Choose a location: Select closest to your users (e.g., `asia-south1` for India)
5. Click **Enable**
6. Wait for database creation (30-60 seconds)

---

## 📦 Step 6: Enable Cloud Storage

1. In Firebase Console, go to **Build** > **Storage**
2. Click **Get started**
3. Select **Start in production mode**
4. Choose same location as Firestore
5. Click **Done**

---

## ⚙️ Step 7: Update Your Code

1. Open `public/js/firebase-config.js` in your code editor
2. Replace the `firebaseConfig` object with your values from Step 3:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",           // From Step 3
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. Save the file
4. Commit and push to your repository

---

## ✅ Step 8: Test Authentication

1. Run your app locally: `npm run dev`
2. Open `http://localhost:5173`
3. Click **"Sign In"** button in the top-right
4. Try creating an account with email/password
5. Try signing in with Google
6. Check Firebase Console > Authentication > Users to see your account

---

## 💰 Free Tier Limits (as of 2026)

Firebase offers generous free tier limits:

| Service | Free Tier Limit | Typical Family Use |
|---------|----------------|-------------------|
| **Authentication** | 10,000 users/month | ✅ 5-10 users |
| **Firestore Reads** | 50,000/day | ✅ ~1,000/day |
| **Firestore Writes** | 20,000/day | ✅ ~200/day |
| **Firestore Storage** | 1 GB | ✅ ~50 MB |
| **Cloud Storage** | 5 GB | ✅ ~500 MB |
| **Storage Downloads** | 1 GB/day | ✅ ~100 MB/day |
| **Hosting** | 10 GB storage | ✅ ~100 MB |
| **Hosting Bandwidth** | 360 MB/day | ✅ ~50 MB/day |

**For personal/family use: $0/month** ✅

---

## 🔒 Security Rules (Next Steps)

After testing, we'll add security rules to:
- Protect user data
- Prevent unauthorized access
- Ensure users can only access their own trips

This will be covered in **Task 2.2: Cloud Data Model Design**.

---

## 🆘 Troubleshooting

### "Firebase not configured" warning
- Make sure you updated `firebase-config.js` with your actual credentials
- Check that all values are correct (no "YOUR_" placeholders)
- Refresh the page

### "Auth domain not authorized"
- Go to Firebase Console > Authentication > Settings > Authorized domains
- Add your domain (e.g., `localhost`, `your-app.pages.dev`)

### "Storage bucket not found"
- Make sure you enabled Cloud Storage in Step 6
- Check that `storageBucket` in config matches your project

---

## 📚 Next Steps

After completing this setup:
1. ✅ Test authentication (sign up, sign in, sign out)
2. ⏳ Task 2.2: Design Firestore schema
3. ⏳ Task 2.3: Implement trip sync
4. ⏳ Task 2.4: Add sharing features
5. ⏳ Task 2.5: Enable cloud photo storage

---

**Need help?** Check the [Firebase Documentation](https://firebase.google.com/docs) or create an issue in the repository.

