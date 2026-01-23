# 🎯 Firebase & Vercel Configuration Update Summary

## ✅ Completed Tasks

### 1. Firebase Client Configuration
- ✅ Updated [client/src/config/firebase.js](../client/src/config/firebase.js) with new project
- ✅ Updated [client/firebase.json](../client/firebase.json) with hosting site name
- ✅ Project: `property-crm-15bca`
- ✅ Site: `sintecproperty-crm`

### 2. Server Environment Configuration  
- ✅ Updated MongoDB URI to new cluster
- ✅ Updated Firebase Project ID to `property-crm-15bca`
- ✅ Prepared `.env` for new service account

### 3. Vercel Deployment Setup
- ✅ Created [vercel.json](./vercel.json) configuration
- ✅ Created [.vercelignore](./.vercelignore) file
- ✅ Created [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) guide
- ✅ Created `deploy-vercel.bat` batch script

## ⚠️ Action Required: Firebase Service Account

You need to generate a new service account for the new Firebase project:

### Quick Steps:
1. **Visit**: https://console.firebase.google.com/project/property-crm-15bca/settings/serviceaccounts/adminsdk
2. **Click**: "Generate new private key"
3. **Save** the JSON file as: `property-crm-15bca-firebase.json` in the `server` directory
4. **Run**: `node encode-firebase-service-account.js`
5. **Copy** the base64 output and update `.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_BASE64=<paste-your-base64-here>
   ```

📖 **Detailed instructions**: See [FIREBASE_SERVICE_ACCOUNT_SETUP.md](./FIREBASE_SERVICE_ACCOUNT_SETUP.md)

## 🚀 Deployment Commands

### Deploy Client to Firebase
```bash
cd client
npm run build
firebase deploy --only hosting:sintecproperty-crm
```

### Deploy Server to Vercel

#### Option 1: Using Batch Script (Windows)
```bash
cd server
.\deploy-vercel.bat
```

#### Option 2: Manual Deployment
```bash
cd server
vercel --prod
```

#### Option 3: GitHub Integration (Recommended)
1. Push code to GitHub
2. Go to https://vercel.com/dashboard
3. Import repository
4. Add environment variables
5. Deploy

## 📋 Environment Variables Checklist

### For Local Development (.env)
- [x] MONGODB_URI (updated to new cluster)
- [x] JWT_SECRET
- [x] FIREBASE_PROJECT_ID (updated)
- [x] FIREBASE_CLIENT_EMAIL (updated)
- [ ] FIREBASE_SERVICE_ACCOUNT_BASE64 (needs new project key)
- [x] CLIENT_URL

### For Vercel Deployment
After deployment, add these to Vercel:
```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add JWT_EXPIRE
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_SERVICE_ACCOUNT_BASE64
vercel env add CLIENT_URL
```

## 🔗 URLs After Deployment

### Client (Firebase Hosting)
- **URL**: https://sintecproperty-crm.web.app
- **Alt URL**: https://sintecproperty-crm.firebaseapp.com

### Server (Vercel)
- **URL**: https://property-crm-server.vercel.app
- **Or**: https://property-crm-server-<username>.vercel.app

## 🔄 Update Client API URL

After server deployment, update client to use Vercel URL:

**File**: `client/src/utils/api.js`
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://property-crm-server.vercel.app/api';
```

**File**: `client/.env`
```env
VITE_API_URL=https://your-vercel-url.vercel.app/api
```

## 📚 Documentation Files Created

1. [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Complete Vercel deployment guide
2. [FIREBASE_SERVICE_ACCOUNT_SETUP.md](./FIREBASE_SERVICE_ACCOUNT_SETUP.md) - Firebase service account setup
3. [deploy-vercel.bat](./deploy-vercel.bat) - Windows deployment script
4. [encode-firebase-service-account.js](./encode-firebase-service-account.js) - Helper to encode service account

## 🎯 Next Steps

1. ✅ Vercel login complete
2. ⏭️ Generate new Firebase service account
3. ⏭️ Encode service account to base64
4. ⏭️ Update FIREBASE_SERVICE_ACCOUNT_BASE64 in .env
5. ⏭️ Deploy server to Vercel
6. ⏭️ Update client API URL
7. ⏭️ Deploy client to Firebase
8. ⏭️ Test the full application

## 🆘 Need Help?

- **Vercel Guide**: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- **Firebase Setup**: [FIREBASE_SERVICE_ACCOUNT_SETUP.md](./FIREBASE_SERVICE_ACCOUNT_SETUP.md)
- **Firebase Deploy**: [../client/FIREBASE_DEPLOYMENT.md](../client/FIREBASE_DEPLOYMENT.md)
