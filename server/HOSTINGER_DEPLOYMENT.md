# 🚀 Hostinger Node.js Deployment Guide

## Prerequisites
- Hostinger Web Hosting with Node.js support (Business or Cloud hosting plan)
- Domain connected to Hostinger
- MongoDB Atlas account (free tier works)

---

## Step 1: Prepare Your Server Files

### 1.1 Create Production Build
```bash
cd server
npm install --production
```

### 1.2 Files to Upload
Upload the entire `server` folder to Hostinger:
```
server/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── server.js
├── package.json
└── .env (create on server)
```

---

## Step 2: Hostinger Setup

### 2.1 Access hPanel
1. Log in to Hostinger hPanel
2. Go to **Websites** → Select your domain
3. Click **Advanced** → **Node.js**

### 2.2 Create Node.js Application
1. Click **Create Application**
2. Configure:
   - **Node.js Version**: 18.x or 20.x (LTS)
   - **Application Root**: `/domains/yourdomain.com/public_html/api` (or your preferred path)
   - **Application URL**: `yourdomain.com/api` or use subdomain `api.yourdomain.com`
   - **Startup File**: `server.js`

### 2.3 Upload Files via File Manager or FTP
1. Go to **Files** → **File Manager**
2. Navigate to your application root (e.g., `/domains/yourdomain.com/public_html/api`)
3. Upload all server files

---

## Step 3: Configure Environment Variables

### 3.1 Create .env File
In your application root, create `.env` file:

```env
# MongoDB Connection (use MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/realestate?retryWrites=true&w=majority

# JWT Secret (generate strong key: openssl rand -base64 32)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Server Config
PORT=3000
NODE_ENV=production

# Client URL (your frontend domain)
CLIENT_URL=https://yourdomain.com

# Hostinger Upload Configuration
# Find your home directory path in hPanel → Files → File Manager
UPLOADS_DIR=/home/u123456789/domains/yourdomain.com/public_html/uploads
UPLOADS_URL=https://yourdomain.com

# Firebase (Base64 encoded service account)
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_json
```

### 3.2 Find Your Home Directory Path
1. In hPanel, go to **Files** → **File Manager**
2. The path shown at the top is your home directory
3. Usually format: `/home/u[numbers]/domains/yourdomain.com/public_html`

---

## Step 4: Create Uploads Directory

### 4.1 Via File Manager
1. Navigate to `public_html`
2. Create folder: `uploads`
3. Inside `uploads`, create: `properties`
4. Set folder permissions to `755`

### 4.2 Final Structure
```
public_html/
├── api/           (Node.js app)
│   ├── server.js
│   ├── package.json
│   └── ...
└── uploads/       (Image storage)
    └── properties/
```

---

## Step 5: Install Dependencies

### 5.1 Via SSH (Recommended)
```bash
# Connect via SSH
ssh u123456789@yourdomain.com

# Navigate to app directory
cd domains/yourdomain.com/public_html/api

# Install dependencies
npm install --production
```

### 5.2 Via hPanel Node.js Manager
1. Go to **Node.js** section
2. Click on your application
3. Click **Run NPM Install**

---

## Step 6: Configure MongoDB Atlas

### 6.1 Whitelist Hostinger IP
1. Go to MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0` (allows all - for shared hosting)
   - Or find Hostinger's IP range and add specific IPs

### 6.2 Create Database User
1. Go to Database Access
2. Create user with read/write permissions
3. Use these credentials in your `MONGODB_URI`

---

## Step 7: Start Your Application

### 7.1 Via hPanel
1. Go to **Node.js** section
2. Click **Restart** on your application
3. Check status shows "Running"

### 7.2 Test Your API
Visit: `https://yourdomain.com/api/`

You should see:
```json
{
  "message": "Sintec Real Estate CRM API",
  "version": "1.0.0",
  "status": "running"
}
```

---

## Step 8: Update Frontend Configuration

### 8.1 Update Client .env
```env
VITE_API_URL=https://yourdomain.com/api
```

### 8.2 Build and Deploy Frontend
```bash
cd client
npm run build
```
Upload `dist` folder contents to `public_html` (main website root)

---

## Troubleshooting

### Common Issues

#### 1. Application Not Starting
- Check Node.js logs in hPanel
- Verify `.env` file exists and has correct values
- Ensure all dependencies are installed

#### 2. Image Upload Fails
- Verify `uploads/properties` folder exists
- Check folder permissions are `755`
- Confirm `UPLOADS_DIR` path is correct in `.env`

#### 3. MongoDB Connection Error
- Whitelist IP in MongoDB Atlas
- Verify connection string is correct
- Check username/password

#### 4. CORS Errors
- Ensure `CLIENT_URL` in `.env` matches your frontend domain
- Include both `http://` and `https://` if needed

### View Logs
1. SSH into server
2. Check PM2 logs: `pm2 logs` or check app logs in hPanel

---

## File Permissions Reference
```
server files:    644 (rw-r--r--)
server folders:  755 (rwxr-xr-x)
uploads folder:  755 (rwxr-xr-x)
.env file:       600 (rw-------)
```

---

## Quick Checklist
- [ ] Node.js app created in hPanel
- [ ] Server files uploaded
- [ ] `.env` file configured
- [ ] `uploads/properties` folder created
- [ ] MongoDB Atlas IP whitelisted
- [ ] Dependencies installed
- [ ] Application started
- [ ] API endpoint tested
- [ ] Frontend updated with new API URL
- [ ] Image upload tested

---

## Support
- Hostinger Support: support@hostinger.com
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
