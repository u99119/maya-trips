#!/bin/bash

# Deploy Firestore Security Rules
# This script deploys the firestore.rules file to Firebase

set -e  # Exit on error

echo "🔒 Deploying Firestore Security Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo ""
    echo "Install it with:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

# Check if firestore.rules exists
if [ ! -f "firestore.rules" ]; then
    echo "❌ firestore.rules file not found!"
    echo "Make sure you're running this from the project root."
    exit 1
fi

# Check if user is logged in
echo "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase."
    echo ""
    echo "Please login with:"
    echo "  firebase login"
    echo ""
    exit 1
fi

echo "✅ Firebase CLI authenticated"
echo ""

# Check if Firebase is initialized
if [ ! -f ".firebaserc" ] && [ ! -f "firebase.json" ]; then
    echo "❌ Firebase not initialized in this directory."
    echo ""
    echo "Please run:"
    echo "  firebase init"
    echo ""
    echo "Then select:"
    echo "  - Firestore"
    echo "  - Use existing project: maya-family-trips"
    echo "  - Accept default firestore.rules location"
    echo ""
    echo "See FIREBASE-INIT-GUIDE.md for detailed instructions."
    echo ""
    exit 1
fi

# Show current project
echo "Current Firebase project:"
firebase use
echo ""

# Confirm deployment
read -p "Deploy security rules to this project? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

# Deploy rules
echo ""
echo "📤 Deploying rules..."
firebase deploy --only firestore:rules

echo ""
echo "✅ Firestore security rules deployed successfully!"
echo ""
echo "🔍 Verify the rules in Firebase Console:"
echo "   https://console.firebase.google.com/project/maya-family-trips/firestore/rules"
echo ""

