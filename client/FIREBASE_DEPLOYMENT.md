# Firebase Hosting Deployment Guide

## Prerequisites
Make sure you have Node.js and npm installed on your system.

## Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase
```bash
firebase login
```
This will open a browser window for authentication.

## Step 3: Initialize Firebase (Already Done)
The project has already been initialized with `firebase.json` configuration.
If you need to reinitialize:
```bash
firebase init
```
- Select "Hosting"
- Choose existing project: `property-crm-15bca`
- Public directory: `dist`
- Single-page app: Yes
- Overwrite index.html: No

## Step 4: Build the Project
Before deploying, build your React app:
```bash
npm run build
```

## Step 5: Deploy to Firebase Hosting
```bash
firebase deploy --only hosting:sintecproperty-crm
```

Or simply:
```bash
firebase deploy
```

## Firebase Configuration Details
- **Project ID**: property-crm-15bca
- **Site Name**: sintecproperty-crm
- **Auth Domain**: property-crm-15bca.firebaseapp.com
- **Storage Bucket**: property-crm-15bca.firebasestorage.app

## Quick Deploy Script
You can create a quick deploy script in package.json:
```json
"scripts": {
  "deploy": "npm run build && firebase deploy --only hosting:sintecproperty-crm"
}
```

Then run:
```bash
npm run deploy
```

## Useful Commands
- **Check Firebase projects**: `firebase projects:list`
- **View hosting sites**: `firebase hosting:sites:list`
- **Preview before deploy**: `firebase serve`
- **View deployment history**: `firebase hosting:releases:list`

## Troubleshooting
- If deployment fails, make sure you're logged in: `firebase login --reauth`
- Verify you have access to the project: `firebase projects:list`
- Make sure the dist folder exists after building: `npm run build`
