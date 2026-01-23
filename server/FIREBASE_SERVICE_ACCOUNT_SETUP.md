# Firebase Service Account Setup for property-crm-15bca

## IMPORTANT: You need to generate a new service account for your new Firebase project

Your `.env` file has been updated to use the new Firebase project ID, but you still need to get the service account credentials.

## Steps to Get New Service Account:

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/project/property-crm-15bca/settings/serviceaccounts/adminsdk

### 2. Generate New Private Key
1. Click on "Service accounts" tab
2. Scroll down to "Firebase Admin SDK"
3. Click "Generate new private key"
4. Click "Generate key" in the confirmation dialog
5. A JSON file will be downloaded (e.g., `property-crm-15bca-firebase-adminsdk-xxxxx.json`)

### 3. Save the JSON File
Save the downloaded file as:
```
d:\VS Code\CRM\Property_CRM\server\property-crm-15bca-firebase.json
```

### 4. Encode to Base64 (For Vercel Deployment)

#### Option A: Using PowerShell (Recommended for Windows)
```powershell
# Run this in PowerShell from the server directory
$fileContent = Get-Content "property-crm-15bca-firebase.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($fileContent)
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Set-Content "firebase-base64.txt"
Write-Host $base64
```

#### Option B: Using Node.js
Create a file called `encode-firebase.js`:
```javascript
import { readFileSync } from 'fs';

const serviceAccount = readFileSync('./property-crm-15bca-firebase.json', 'utf8');
const base64 = Buffer.from(serviceAccount).toString('base64');
console.log(base64);
```

Run:
```bash
node encode-firebase.js
```

### 5. Update .env File
Copy the base64 string and update your `.env` file:
```env
FIREBASE_SERVICE_ACCOUNT_BASE64=<paste-your-base64-string-here>
```

### 6. For Vercel Deployment
Add the same environment variable to Vercel:
```bash
vercel env add FIREBASE_SERVICE_ACCOUNT_BASE64
```
Then paste the base64 string when prompted.

### 7. Update FIREBASE_CLIENT_EMAIL
After downloading the service account JSON, open it and copy the `client_email` field.
Update in `.env`:
```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@property-crm-15bca.iam.gserviceaccount.com
```

## Current Configuration Status

✅ **Updated:**
- Client Firebase config (new project: property-crm-15bca)
- Firebase hosting config (site: sintecproperty-crm)
- MongoDB URI (new database cluster)

❌ **Needs Update:**
- FIREBASE_SERVICE_ACCOUNT_BASE64 (generate from new project)
- FIREBASE_CLIENT_EMAIL (get from new service account JSON)
- Save new firebase JSON file: `property-crm-15bca-firebase.json`

## Testing Firebase Connection

After updating, test your Firebase connection:

```bash
cd server
node -e "import('./config/firebase.config.js').then(m => console.log('Firebase initialized:', m.default.name))"
```

## Quick Reference

**New Project Details:**
- Project ID: `property-crm-15bca`
- Auth Domain: `property-crm-15bca.firebaseapp.com`
- Storage Bucket: `property-crm-15bca.firebasestorage.app`
- API Key: `AIzaSyBuC1QerRui9WeFsOFFLJZGqterl0xzXdI`

**Firebase Console:** https://console.firebase.google.com/project/property-crm-15bca
**Service Accounts:** https://console.firebase.google.com/project/property-crm-15bca/settings/serviceaccounts
