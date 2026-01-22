# VPS Deployment Guide - Real Estate CRM with Image Upload

This guide covers deploying your Real Estate CRM application on a VPS with local image storage.

## New Features Added

### Multiple Image Upload Options
1. **URL Method** - Enter image URLs (comma-separated) - existing functionality
2. **File Upload Method** - Upload multiple images directly to the server (NEW)
   - Supports JPEG, PNG, GIF, WebP formats
   - Maximum 10 images per upload
   - Maximum 10MB per file
   - Images stored in `server/uploads/properties/` folder

## Project Structure

```
RealEstate/
├── client/                  # React Frontend
│   └── src/
│       └── utils/
│           └── api.js       # Added uploadAPI
│       └── pages/
│           └── PropertyManagement.jsx  # Updated with file upload UI
│
├── server/                  # Express Backend
│   ├── config/
│   │   └── multer.config.js # NEW - Multer configuration
│   ├── controllers/
│   │   └── upload.controller.js  # NEW - Upload handlers
│   ├── routes/
│   │   └── upload.routes.js      # NEW - Upload routes
│   ├── uploads/
│   │   └── properties/           # NEW - Image storage folder
│   │       └── .gitkeep
│   └── server.js            # Updated with static file serving
```

## VPS Deployment Steps

### 1. Prerequisites
- Node.js 18+ installed
- MongoDB (local or MongoDB Atlas)
- PM2 for process management
- Nginx for reverse proxy

### 2. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### 3. Clone and Configure Project

```bash
# Clone your repository
git clone <your-repo-url> /var/www/realestate
cd /var/www/realestate

# Install backend dependencies
cd server
npm install

# Create .env file
nano .env
```

### 4. Backend Environment Variables (.env)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/realestate
# OR for Atlas: mongodb+srv://user:password@cluster.mongodb.net/realestate

JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

CLIENT_URL=https://yourdomain.com

# Firebase (if using)
FIREBASE_SERVICE_ACCOUNT_BASE64=your-base64-encoded-firebase-config
```

### 5. Build Frontend

```bash
cd /var/www/realestate/client

# Create .env file for frontend
nano .env

# Add:
VITE_API_URL=https://api.yourdomain.com/api
# OR if using same domain:
VITE_API_URL=https://yourdomain.com/api

# Install and build
npm install
npm run build
```

### 6. Configure Nginx

Create Nginx config file:

```bash
sudo nano /etc/nginx/sites-available/realestate
```

```nginx
# API Server (Backend)
server {
    listen 80;
    server_name api.yourdomain.com;

    # Increase max file upload size
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded images
    location /uploads {
        alias /var/www/realestate/server/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Frontend Server
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/realestate/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/realestate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Start Backend with PM2

```bash
cd /var/www/realestate/server

# Start the application
pm2 start server.js --name "realestate-api"

# Save PM2 process list
pm2 save

# Enable PM2 startup on boot
pm2 startup
```

### 8. SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal is set up automatically
```

### 9. Set Folder Permissions

```bash
# Ensure uploads folder has proper permissions
sudo chown -R www-data:www-data /var/www/realestate/server/uploads
sudo chmod -R 755 /var/www/realestate/server/uploads
```

## API Endpoints

### Upload Routes
- `POST /api/upload/images` - Upload multiple images (max 10)
- `GET /api/upload/images` - List all uploaded images
- `DELETE /api/upload/images/:filename` - Delete an image

### Example Upload Request

```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);

fetch('/api/upload/images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## Useful PM2 Commands

```bash
# View logs
pm2 logs realestate-api

# Monitor
pm2 monit

# Restart
pm2 restart realestate-api

# Stop
pm2 stop realestate-api

# View status
pm2 status
```

## Backup Strategy

### Database Backup
```bash
# MongoDB backup
mongodump --db realestate --out /backup/mongodb/$(date +%Y%m%d)

# Or for MongoDB Atlas, use mongodump with connection string
```

### Images Backup
```bash
# Backup uploads folder
tar -czvf /backup/uploads-$(date +%Y%m%d).tar.gz /var/www/realestate/server/uploads
```

## Troubleshooting

### Images not loading
1. Check Nginx configuration for `/uploads` location
2. Verify folder permissions
3. Check if images exist in the folder

### Upload failing
1. Check `client_max_body_size` in Nginx config
2. Verify multer configuration file size limits
3. Check server logs: `pm2 logs realestate-api`

### CORS Issues
1. Ensure `CLIENT_URL` in `.env` matches your frontend domain
2. Check if the domain includes proper protocol (https://)

## Security Considerations

1. Keep the uploads folder outside of git (already configured in .gitignore)
2. Use environment variables for sensitive data
3. Enable HTTPS with SSL certificates
4. Regularly update dependencies
5. Set up firewall rules (UFW):
   ```bash
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

## Support

For issues or questions, please check the server logs:
```bash
pm2 logs realestate-api --lines 100
```
