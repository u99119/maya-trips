# Firebase Initialization Guide

## 🎯 What You Need to Do

You need to **link your local project** to your Firebase project `maya-family-trips`.

---

## 🚀 Step-by-Step Instructions

### **Step 1: Run Firebase Init**

```bash
firebase init
```

---

### **Step 2: Select Firestore**

You'll see:

```
? Which Firebase features do you want to set up for this directory?
  Press Space to select features, then Enter to confirm your choices.

  ◯ Realtime Database
❯ ◯ Firestore
  ◯ Functions
  ◯ Hosting
  ◯ Hosting: Set up GitHub Action deploys
  ◯ Storage
  ◯ Emulators
  ◯ Remote Config
  ◯ Extensions
```

**Action:**
- Press **Space** to select `Firestore` (you'll see `◉ Firestore`)
- Press **Enter** to confirm

---

### **Step 3: Use Existing Project**

You'll see:

```
? Please select an option:
  > Use an existing project
    Create a new project
    Add Firebase to an existing Google Cloud Platform project
    Don't set up a default project
```

**Action:**
- Select `Use an existing project` (should be selected by default)
- Press **Enter**

---

### **Step 4: Select Your Project**

You'll see a list of your Firebase projects:

```
? Select a default Firebase project for this directory:
  > maya-family-trips (maya-family-trips)
    [other projects if you have any]
```

**Action:**
- Select `maya-family-trips`
- Press **Enter**

---

### **Step 5: Firestore Rules File**

You'll see:

```
? What file should be used for Firestore Rules? (firestore.rules)
```

**Action:**
- Press **Enter** (accept default, we already have this file!)

---

### **Step 6: Firestore Indexes File**

You'll see:

```
? What file should be used for Firestore indexes? (firestore.indexes.json)
```

**Action:**
- Press **Enter** (accept default)

---

### **Step 7: Overwrite Warning (if shown)**

If you see:

```
? File firestore.rules already exists. Do you want to overwrite it with the Firestore Rules from the Firebase Console? (y/N)
```

**Action:**
- Type `N` (No - keep our rules!)
- Press **Enter**

---

### **✅ Success!**

You should see:

```
✔  Firebase initialization complete!
```

---

## 📁 **What Gets Created**

After initialization, you'll have:

1. **`.firebaserc`** - Links your local project to `maya-family-trips`
2. **`firebase.json`** - Firebase configuration
3. **`firestore.indexes.json`** - Firestore indexes (empty for now)

---

## 🚀 **Next: Deploy Rules**

After initialization, run:

```bash
./scripts/deploy-firestore-rules.sh
```

Or manually:

```bash
firebase deploy --only firestore:rules
```

---

## 🆘 **Troubleshooting**

### **"No projects found"**

**Solution:**
```bash
# Make sure you're logged in
firebase login

# List your projects
firebase projects:list
```

You should see `maya-family-trips` in the list.

---

### **"Already initialized"**

If you see:

```
Error: Directory already has a firebase.json setup.
```

**Solution:**
You're already initialized! Just run:

```bash
firebase use maya-family-trips
./scripts/deploy-firestore-rules.sh
```

---

### **"Permission denied"**

**Solution:**
Make sure you're logged in with the correct Google account that owns the Firebase project.

```bash
# Logout
firebase logout

# Login again
firebase login
```

---

## 📋 **Quick Commands Reference**

```bash
# Initialize Firebase
firebase init

# Check current project
firebase use

# Switch project
firebase use maya-family-trips

# List all projects
firebase projects:list

# Deploy rules
firebase deploy --only firestore:rules

# Deploy everything
firebase deploy
```

---

## ✅ **After Initialization**

Once initialized, you can:

1. ✅ Deploy Firestore rules
2. ✅ Deploy Firestore indexes
3. ✅ Use Firebase Hosting (if needed)
4. ✅ Run Firebase Emulators (for local testing)

---

**Ready?** Run `firebase init` and follow the steps above! 🚀

