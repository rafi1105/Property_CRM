# Vercel Server Deployment Guide

## Prerequisites
- Node.js and npm installed
- Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

## Step 2: Login to Vercel
```bash
vercel login
```
Choose your preferred login method (GitHub, GitLab, Bitbucket, or Email).

## Step 3: Navigate to Server Directory
```bash
cd server
```

## Step 4: Deploy to Vercel
```bash
vercel
```

### First-time Deployment Questions:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Choose your account
3. **Link to existing project?** → No
4. **What's your project's name?** → `property-crm-server` (or your preferred name)
5. **In which directory is your code located?** → `./`
6. **Want to modify settings?** → No

## Step 5: Configure Environment Variables
After initial deployment, add your environment variables:

```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add JWT_EXPIRE
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_SERVICE_ACCOUNT_BASE64
vercel env add CLIENT_URL
```

Or add them via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable from your .env file

### Required Environment Variables:
```
MONGODB_URI=mongodb+srv://rafikabir05rk_db_user:WNsFz3XkdbjgxMUC@rk.kroacv1.mongodb.net/real-estate?retryWrites=true&w=majority&appName=rk
JWT_SECRET=55bc2abf6f70cbacede7b5a90b853a070219d2ebaf1eb881378b195b9eaade9d271e7d8486436ab278463bb81584745cc7e9a56f007b83b3c36a39cdc526ad5a
JWT_EXPIRE=7d
FIREBASE_PROJECT_ID=property-crm-15bca
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@sintecproperty.iam.gserviceaccount.com
FIREBASE_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAic2ludGVjcHJvcGVydHkiLAogICJwcml2YXRlX2tleV9pZCI6ICIyZGIxZTJlMzFkZjExNmVmNjk5OTUwMTIwMjg5OGJhMGNiZDhiNGRlIiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdmdJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLZ3dnZ1NrQWdFQUFvSUJBUUM3Kzl6V1lrZVNyWjlqXG5CdDBlL1FQa3ZQakJETDcrNW13czZHR0hmQW9icmpMMXFyR2dYbEJ2OUY1Y2ZVRlVLOFgrY3ZTN3h0RFU0UUduXG43ZEU4dFp4aXlZRC82YUpRcUhWdlU0a2VPRExRK0c5NlNTbmRGTE4wdWlSRlRIWjdHSlhhRmtPWlduU2NlRzBoXG5BUUs5dVNTL29QbEpWc2xSMGw0RWE0NXRXbVVkOEpESzI4NExaSWw0SjJQZmxRTlp4K2ovQ05kNFo3RWpsMzYxXG42Q1FPMm4wR2pQSzZYLzBjbVN1TVpqSUFLWk8rUkRHTzllVWFjL0w4eXJuTzBFR0RVUGZiUGdxYmNRRG8yQ3pyXG41Vk1qTnI0SGpsdVhlNEE1emhnV1l4MkVhVHNOT0tPUnQ3ZHhBMThGSUgxMkF4Y1d5c2Fub05Gem8zelJ4ZStvXG5nR0hwcXd3bEFnTUJBQUVDZ2dFQUEvbTluK01RTkcvcmtRS1NKcGVmUDNVbnBaMkpaSWFtL3dRakcrUnBxbEF5XG56N00rY20vTUw3SHhWTzlwTkVpQXRYTGs3aHUwU3V3L1JyZm0xdXZZVk5hQ0hlZHBBVit1ckI0T0prOTE4Nmx0XG5ZaDZ0L2ZqMEdxSGRKb0lKZDJ6N3JsTU9OdTRNelVwV3RIMzYrdHd4aE1QNHdhNU9MNmJOU2pha0duZnc3NE1mXG5rcFlEQUhmVnpvRTUwVFpmSjFsWC94aW02cDBibHFKbmRTV2dyYnF1STllclZQRWpHSUpyM1c0d00rbzVUVmFPXG5EZ0t6c3JMVEVia0ZBbFlISFlURnBVUXlwYTMxUDBTNlVpQmNGaGU4NVFQMnFZUFRUOTUrMnFKdzA3UThnL0tEXG53MWNEdjRMUERYRUFWdW1aMmZVNjdHeWoyYUFjcUY2Tzl3SmEvMmNRdVFLQmdRRDR5Q2JNWjRFY3lyNGlQQVROXG5QUnU3enVDMS9sUUdObFozT25GWkRVNWxvN3lkREZmcFVOODVicTVyTGQvUXdQR0FMUS94TCttdFd4UG4rU1NaXG4xcHlIVk51RXpJU0oraVFpTkJ5aFJna3k3d1QwV3pKSnBBd1RndDJjQzVwdDJMSXBJcTQ1aU5ldjYxdlRuVDV2XG5SVEZ3c3I5RElJeXlZUzVpNXRISkdDbnFRd0tCZ1FEQmNDRHpKUWJXUS9CbWY3SWhHM2p6SEJiRUp2U1puTGx3XG5laWZGbFczUzh1c1ZxTVh5UHJPWXZ5TzJMZEtXWHo0ZVFPR1MzMXlDSFJTRG81dmZLMjdHbHdtQzRDeVNDc2h2XG5hSnJaVHA1bVlxRWEzVUlLcm9zMlBOYytsUTVNbmZ4ZmZtaVpKV082NENGczZRaDhUMTRSVDNkOExLMTFCSUFIXG4yWE1lOVZOTmR3S0JnUURQUjVSc0FtRWs2QmQ2MXA3NWtjeWxzanl2NWZPRUtZbnBWUnhUb2k2THFOemh6UU1DXG5Ob3VHZ3AxNFY0Ui9uZ0taVlBKUGRpZ3dkQTRsM1FPTjJhNFpZNjV5K3lRREFoTlJIREl1ZlBmMUpBand2M3NxXG51REFIb2FXYStsLzAzZk96S2w0WE9kamJqakc0SXU5K0xoeC9WYTdkOHlUSEN3bG5CZ0lNbHNGMW1RS0JnRWxXXG5pTGVHanp3SEVBcmNXUjJpTzgzNEZVMlM4Mk9WL3R4OUE3MHVkUy9vTjJiRDBTQ1IweWVUT0NmbTRaTnZVcTdIXG5ySDR4dnZINXNvQmlORU45UlFkMzFmeFBuN1pTN2tFRzZNYUF2eDlVUDM1ZTZwNEFKUG1RUVk4UmxoVklSSm16XG41RlpEemJiWktQTVF1czNlald5RXMybFp5djIxa2hEbnlYU3dVRC9yQW9HQkFJNnNTeDRNbVRUZjlQdERjSFprXG5udk40RWVSaVlsSlYzNVBzZ1lJaU1YMDdmMXdBYVJOT0FHMEtwcU9MUStwbmlrQW1PNWx6SzZ0MFNoemxjOGlaXG5Nd1RmcitWRjNFMDJ4NzdLa1kwTUZDbUVza3E2UmRMSUdIUmxKUVBJcHZuK015eFl2aUk3dWlBdzlVNDRyWlo2XG4wa3lJSFQzWlZTNjgyNGxBalhmRGdqUXlcbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0BzaW50ZWNwcm9wZXJ0eS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMDM2MzkyOTcwMDg0MjgzNTUxMDYiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwc2ludGVjcHJvcGVydHkuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K
CLIENT_URL=https://sintecproperty-crm.web.app
```

## Step 6: Production Deployment
```bash
vercel --prod
```

## Step 7: Update Client to Use New Server URL
After deployment, Vercel will provide a URL like:
- `https://property-crm-server.vercel.app`
- `https://property-crm-server-username.vercel.app`

Update your client's API configuration to use this URL.

## Useful Vercel Commands

### View Deployments
```bash
vercel ls
```

### View Project Info
```bash
vercel inspect
```

### View Logs
```bash
vercel logs
```

### Remove Deployment
```bash
vercel remove [deployment-url]
```

### Link Project to Different Vercel Project
```bash
vercel link
```

### Set Environment Variable
```bash
vercel env add [variable-name]
```

### Pull Environment Variables
```bash
vercel env pull
```

## Deploy via GitHub (Recommended for Auto-Deploy)

1. **Push code to GitHub repository**
2. **Go to Vercel Dashboard** (https://vercel.com/dashboard)
3. **Click "Add New Project"**
4. **Import your GitHub repository**
5. **Configure project:**
   - Framework Preset: Other
   - Root Directory: `server`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `npm install`
6. **Add Environment Variables** in the dashboard
7. **Click Deploy**

### Benefits of GitHub Integration:
- ✅ Automatic deployments on push to main branch
- ✅ Preview deployments for pull requests
- ✅ Easy rollbacks
- ✅ Deployment history

## Update Client API URL

After deployment, update your client to use the new server URL:

In `client/src/utils/api.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://property-crm-server.vercel.app/api';
```

Create `.env` file in client:
```
VITE_API_URL=https://your-deployment-url.vercel.app/api
```

## MongoDB Atlas IP Whitelist
Make sure to whitelist Vercel's IP addresses in MongoDB Atlas:
1. Go to MongoDB Atlas Dashboard
2. Network Access → IP Whitelist
3. Add: `0.0.0.0/0` (Allow from anywhere) for Vercel deployments

## Troubleshooting

### Error: Module not found
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

### Error: Environment variables not found
- Add them via Vercel Dashboard or CLI
- Redeploy after adding variables

### Error: MongoDB connection failed
- Check MongoDB Atlas IP whitelist
- Verify MONGODB_URI is correct
- Ensure MongoDB user has correct permissions

### Error: Function timeout
- Vercel free tier has 10s timeout for serverless functions
- Optimize slow database queries
- Consider upgrading Vercel plan

## Quick Deploy Script

Add to `package.json`:
```json
"scripts": {
  "deploy": "vercel --prod",
  "deploy:preview": "vercel"
}
```

## Server URL After Deployment
Your API will be available at:
- Production: `https://property-crm-server.vercel.app/api`
- Preview: `https://property-crm-server-git-[branch].vercel.app/api`

Update this URL in your client application's environment variables.
