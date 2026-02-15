# ==============================================
# SAHADA APP - DEPLOYMENT GUIDE
# ==============================================

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] API endpoints tested
- [ ] SSL certificates obtained
- [ ] Domain DNS configured

### Production Build
- [ ] Create production build
- [ ] Test build locally
- [ ] Optimize assets
- [ ] Enable compression
- [ ] Configure CDN (optional)

### Deployment
- [ ] Deploy database
- [ ] Deploy backend API
- [ ] Deploy frontend
- [ ] Configure reverse proxy
- [ ] Setup monitoring
- [ ] Enable logging

### Post-Deployment
- [ ] Health checks passing
- [ ] SSL working
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Backup strategy implemented

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + MongoDB Atlas (Database)

#### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Build for production
npm run build

# Deploy
vercel --prod
```

Vercel Configuration (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_BASE_URL": "@api-url"
  }
}
```

#### Backend API (Vercel Serverless)
```bash
# Deploy API as serverless functions
vercel --prod server/
```

#### Database (MongoDB Atlas)
1. Create account at mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `.env.production`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sahada
```

### Option 2: Docker + VPS (DigitalOcean, AWS, etc.)

#### Dockerfile
```dockerfile
# Frontend
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Backend
FROM node:18-alpine AS backend
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Final image
FROM node:18-alpine
WORKDIR /app

# Copy built frontend
COPY --from=frontend /app/dist ./dist

# Copy backend
COPY --from=backend /app ./server

# Expose ports
EXPOSE 3001 3002

# Start services
CMD ["npm", "run", "start:production"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}

  api:
    build: .
    restart: always
    ports:
      - "3001:3001"
    environment:
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/sahada?authSource=admin
      NODE_ENV: production
    depends_on:
      - mongodb

  frontend:
    build: .
    restart: always
    ports:
      - "3002:3002"
    environment:
      VITE_API_BASE_URL: http://api:3001/api
    depends_on:
      - api

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api

volumes:
  mongodb_data:
```

### Option 3: Netlify (Frontend) + Railway (Backend + Database)

#### Frontend (Netlify)
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

#### Backend (Railway)
1. Go to railway.app
2. Create new project
3. Add MongoDB plugin
4. Deploy from GitHub
5. Set environment variables

### Option 4: AWS (Full Stack)

#### Services Used:
- **EC2**: Server instances
- **RDS or DocumentDB**: Database
- **S3**: Static assets
- **CloudFront**: CDN
- **Route53**: DNS
- **Certificate Manager**: SSL

#### AWS Deployment Steps:
```bash
# 1. Create EC2 instance
aws ec2 run-instances --image-id ami-xxx --instance-type t3.small

# 2. SSH into instance
ssh -i key.pem ubuntu@your-ip

# 3. Install dependencies
sudo apt update
sudo apt install nodejs npm mongodb nginx

# 4. Clone repository
git clone your-repo
cd sahada

# 5. Install and build
npm install
npm run build

# 6. Setup PM2
npm install -g pm2
pm2 start npm --name "sahada-api" -- run api
pm2 start npm --name "sahada-frontend" -- run dev

# 7. Configure Nginx
sudo nano /etc/nginx/sites-available/sahada
```

## 🔒 Security Configuration

### SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/sahada/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

## 📊 Monitoring & Logging

### Setup Monitoring
```bash
# Install monitoring tools
npm install @sentry/react @sentry/node
npm install winston
```

### Sentry Configuration
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

### PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 🔄 CI/CD Pipeline

### GitHub Actions (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          npm run build
          # Deploy commands here
```

## 🔥 Performance Optimization

### CDN Configuration
- Use Cloudflare or AWS CloudFront
- Cache static assets
- Enable HTTP/2
- Enable compression

### Database Optimization
- Create indexes (already done in mongodb.ts)
- Enable connection pooling
- Use read replicas for scaling
- Regular backups

### Application Optimization
- Code splitting (done in vite.config)
- Lazy loading
- Image optimization
- Asset compression

## 📞 Support & Maintenance

### Backup Strategy
```bash
# MongoDB backup
mongodump --uri="mongodb://..." --out=backup-$(date +%Y%m%d)

# Automated daily backups
crontab -e
0 2 * * * /usr/local/bin/backup-script.sh
```

### Health Checks
```bash
# API health
curl https://yourdomain.com/api/health

# Database health
mongosh --eval "db.adminCommand('ping')"
```

### Logging
- Application logs: `/var/log/sahada/`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `/var/log/mongodb/`

## 🎯 Production Checklist Summary

✅ Environment variables configured  
✅ Database deployed and secured  
✅ API server deployed  
✅ Frontend deployed  
✅ SSL certificates installed  
✅ Domain configured  
✅ Monitoring active  
✅ Backups scheduled  
✅ Performance optimized  
✅ Security headers configured  

---

**Need help?** Check the docs or open an issue on GitHub.
