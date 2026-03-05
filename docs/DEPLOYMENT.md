# 🚀 Deployment Guide - Smart Pest Doctor

Complete guide for deploying Smart Pest Doctor to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Railway)](#backend-deployment-railway)
4. [Database Setup (PlanetScale)](#database-setup-planetscale)
5. [Alternative Platforms](#alternative-platforms)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment](#post-deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ All API keys (Hugging Face, Groq, WeatherAPI, Cloudinary, etc.)
- ✅ Domain name (optional but recommended)
- ✅ SSL certificates (handled by platforms)

---

## Frontend Deployment (Vercel)

### Option A: Deploy via Vercel Dashboard

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Set root directory to `frontend`

3. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables**
   Go to Project Settings → Environment Variables and add:
   ```
   VITE_API_URL=https://your-backend.railway.app
   VITE_FIREBASE_API_KEY=your_firebase_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_ONESIGNAL_APP_ID=your_onesignal_id
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
   VITE_JITSI_DOMAIN=meet.jit.si
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Get your production URL: `https://your-app.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Custom Domain Setup

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `app.smartpestdoctor.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic, ~5 minutes)

---

## Backend Deployment (Railway)

### Step 1: Setup Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project

### Step 2: Add MySQL Database

1. Click "New" → "Database" → "Add MySQL"
2. Note the connection details:
   - Host, Port, Username, Password, Database name
3. Or use the `DATABASE_URL` provided

### Step 3: Deploy Backend

1. **Via GitHub (Recommended)**
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Set root directory: `backend`
   - Railway auto-detects Node.js

2. **Configure Build**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - No changes needed (reads from package.json)

3. **Add Environment Variables**
   Go to Variables tab and add all from `backend/.env.example`:
   
   ```env
   NODE_ENV=production
   PORT=4000
   
   # Database (use Railway's DATABASE_URL)
   DATABASE_URL=${{MySQL.DATABASE_URL}}
   
   # Or individual vars:
   MYSQL_HOST=${{MySQL.MYSQL_HOST}}
   MYSQL_PORT=${{MySQL.MYSQL_PORT}}
   MYSQL_USER=${{MySQL.MYSQL_USER}}
   MYSQL_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
   MYSQL_DATABASE=${{MySQL.MYSQL_DATABASE}}
   
   # Frontend URL (update after Vercel deploy)
   FRONTEND_URL=https://your-app.vercel.app
   CORS_ORIGIN=https://your-app.vercel.app
   
   # Cloud Services
   CLOUDINARY_URL=cloudinary://key:secret@cloudname
   HF_API_KEY=hf_xxxxx
   GROQ_API_KEY=gsk_xxxxx
   WEATHER_API_KEY=xxxxx
   
   # Auth
   JWT_SECRET=your-super-secret-production-key-min-32-chars
   FIREBASE_API_KEY=xxxxx
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   
   # Payments
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   
   # Notifications
   ONESIGNAL_APP_ID=xxxxx
   ONESIGNAL_API_KEY=xxxxx
   
   # Features
   WEATHER_CRON_ENABLED=true
   ```

4. **Deploy**
   - Railway auto-deploys on push to main branch
   - First deployment takes ~3-5 minutes
   - Get your backend URL: `https://your-app.up.railway.app`

### Step 4: Run Migrations

```bash
# Via Railway CLI
railway login
railway link  # Select your project
railway run npm run migrate
railway run npm run seed  # Optional: add sample data
```

Or via Railway dashboard:
- Go to project → Settings → Deploy
- Add custom start command: `npm run migrate && npm start`

---

## Database Setup (PlanetScale)

### Alternative: Use PlanetScale (Recommended for Scale)

1. **Create Database**
   - Go to https://planetscale.com
   - Create new database: `smart-pest-doctor`
   - Select region closest to your backend

2. **Get Connection String**
   - Click "Connect"
   - Select "Node.js"
   - Copy the connection string:
     ```
     mysql://user:pass@region.connect.psdb.cloud/smart_pest_doctor?ssl={"rejectUnauthorized":true}
     ```

3. **Update Railway Environment**
   ```env
   DATABASE_URL=mysql://user:pass@region.connect.psdb.cloud/smart_pest_doctor?ssl={"rejectUnauthorized":true}
   ```

4. **Run Migrations**
   ```bash
   # Local, pointing to PlanetScale
   DATABASE_URL="your_planetscale_url" npm run migrate
   ```

5. **Enable Production Branch**
   - PlanetScale uses branches (like Git)
   - Promote `main` branch to production
   - Use connection string for production branch in Railway

---

## Alternative Platforms

### Frontend Alternatives

#### Netlify
```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

Configuration:
- Build command: `npm run build`
- Publish directory: `dist`

#### Cloudflare Pages
- Connect GitHub repo
- Build command: `npm run build`
- Output directory: `dist`

### Backend Alternatives

#### Render
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo, select `backend` folder
4. Build: `npm install`
5. Start: `npm start`
6. Add environment variables
7. Deploy

#### DigitalOcean App Platform
1. Create new app
2. Connect GitHub
3. Select repository and `backend` directory
4. Configure build settings
5. Add environment variables
6. Deploy

#### Heroku (Free tier deprecated, use paid tier)
```bash
heroku login
heroku create smart-pest-doctor-api
heroku addons:create cleardb:ignite
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
# ... add all env vars
git subtree push --prefix backend heroku main
```

---

## Environment Variables

### Production Checklist

| Variable | Where | Value Type | Required |
|----------|-------|------------|----------|
| `NODE_ENV` | Backend | `production` | ✅ Yes |
| `DATABASE_URL` | Backend | Connection string | ✅ Yes |
| `JWT_SECRET` | Backend | 32+ char random | ✅ Yes |
| `FRONTEND_URL` | Backend | Vercel URL | ✅ Yes |
| `CLOUDINARY_URL` | Backend | API credentials | ✅ Yes |
| `HF_API_KEY` | Backend | Hugging Face key | ✅ Yes |
| `GROQ_API_KEY` | Backend | Groq API key | ✅ Yes |
| `WEATHER_API_KEY` | Backend | WeatherAPI key | ✅ Yes |
| `RAZORPAY_KEY_ID` | Both | Live key | ✅ Yes |
| `RAZORPAY_KEY_SECRET` | Backend | Live secret | ✅ Yes |
| `FIREBASE_API_KEY` | Both | Firebase config | ✅ Yes |
| `ONESIGNAL_APP_ID` | Both | OneSignal ID | ⚠️ Optional |
| `VITE_API_URL` | Frontend | Railway URL | ✅ Yes |

### Generate Secure JWT Secret

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32

# Or use online generator (not recommended for production)
```

---

## Post-Deployment

### 1. Test Deployment

```bash
# Test health endpoint
curl https://your-backend.railway.app/health

# Expected response:
{"status":"ok","timestamp":"2025-10-22T...","environment":"production"}
```

### 2. Test Frontend

- Visit `https://your-app.vercel.app`
- Try login with phone OTP
- Upload test image for disease detection
- Check browser console for errors

### 3. Database Check

```bash
# Connect to production DB
mysql -h your-db-host -u user -p database_name

# Check tables
SHOW TABLES;

# Check users
SELECT COUNT(*) FROM users;
```

### 4. Verify Integrations

- [ ] Cloudinary image upload works
- [ ] AI detection returns results
- [ ] Treatment recommendations generated
- [ ] Weather API responds
- [ ] Razorpay test payment flows
- [ ] Push notifications sent (if enabled)

### 5. Configure DNS (Custom Domain)

If using custom domain:

```
Type    Name    Value                           TTL
A       @       76.76.21.21 (Vercel IP)        3600
CNAME   www     cname.vercel-dns.com           3600
CNAME   api     your-app.up.railway.app        3600
```

---

## Monitoring & Maintenance

### Add Error Tracking (Sentry)

1. **Install Sentry**
   ```bash
   npm install @sentry/node @sentry/react
   ```

2. **Backend Integration**
   ```javascript
   // backend/src/app.js
   const Sentry = require('@sentry/node');
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV
   });
   ```

3. **Frontend Integration**
   ```javascript
   // frontend/src/main.jsx
   import * as Sentry from '@sentry/react';
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     integrations: [new Sentry.BrowserTracing()],
     tracesSampleRate: 1.0
   });
   ```

### Setup Uptime Monitoring

Use services like:
- **UptimeRobot** (free): https://uptimerobot.com
- **Pingdom**: https://www.pingdom.com
- **StatusCake**: https://www.statuscake.com

Monitor endpoints:
- `https://your-app.vercel.app` (frontend)
- `https://your-backend.railway.app/health` (backend)

### Database Backups

#### PlanetScale
- Auto-backups enabled on paid plans
- Can create manual backups anytime

#### Railway MySQL
```bash
# Export database
railway run mysqldump -u user -p database_name > backup.sql

# Schedule automated backups (use cron or GitHub Actions)
```

#### GitHub Actions Backup (Example)
```yaml
# .github/workflows/backup.yml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        run: |
          mysqldump -h ${{ secrets.DB_HOST }} -u ${{ secrets.DB_USER }} -p${{ secrets.DB_PASSWORD }} ${{ secrets.DB_NAME }} > backup.sql
          # Upload to S3 or similar
```

### Performance Monitoring

Add to backend:
```javascript
// Response time logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

### Regular Maintenance

- [ ] Update dependencies monthly: `npm update`
- [ ] Check security vulnerabilities: `npm audit`
- [ ] Review logs weekly
- [ ] Monitor API usage (especially paid APIs)
- [ ] Test backup restoration quarterly
- [ ] Review and rotate API keys every 6 months

---

## Scaling Considerations

### When to Scale

- Backend CPU usage > 70%
- Database connections > 80% of limit
- API response time > 1 second
- Daily active users > 10,000

### Scaling Options

1. **Vertical Scaling** (Upgrade plan)
   - Railway: Upgrade to Pro plan ($5-20/month)
   - PlanetScale: Scale to larger DB ($29+/month)

2. **Horizontal Scaling**
   - Add multiple backend instances (Railway auto-scales)
   - Use Redis for session storage
   - Implement caching layer

3. **CDN for Images**
   - Cloudinary already provides CDN
   - Consider additional CDN for static assets

4. **Database Optimization**
   - Add indexes to frequently queried columns
   - Implement query caching
   - Use connection pooling (already configured)

---

## Troubleshooting

### Common Issues

#### "Cannot connect to database"
```bash
# Check DATABASE_URL format
# Ensure database is running
railway logs  # Check backend logs
```

#### "CORS error"
```bash
# Update CORS_ORIGIN in backend .env
CORS_ORIGIN=https://your-actual-domain.vercel.app
```

#### "API rate limit exceeded"
```bash
# Monitor API usage
# Upgrade API plans if needed
# Implement caching
```

#### "Out of memory"
```bash
# Upgrade Railway plan
# Or optimize memory usage:
# - Reduce image sizes
# - Implement pagination
# - Clear unused connections
```

---

## Security Checklist

Before going live:

- [ ] Changed all default passwords
- [ ] JWT_SECRET is 32+ random characters
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] CORS configured with specific origins
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (Sequelize handles)
- [ ] File upload size limits set
- [ ] Error messages don't expose internals
- [ ] Database credentials not in code
- [ ] API keys not committed to Git
- [ ] Backups configured
- [ ] Monitoring enabled

---

## Cost Estimate (Monthly)

### Free Tier (Development/Small Scale)
- Frontend (Vercel): **$0**
- Backend (Railway): **$5** (500 hours free, then $0.01/hour)
- Database (PlanetScale): **$0** (10GB storage, 1B row reads)
- Cloudinary: **$0** (25GB storage, 25GB bandwidth)
- APIs: **$0-10** (depends on usage)
- **Total: ~$5-15/month**

### Production (1000-5000 users)
- Frontend (Vercel Pro): **$20/month**
- Backend (Railway Pro): **$20/month**
- Database (PlanetScale Scaler): **$39/month**
- APIs: **$20-50/month**
- Monitoring (Sentry): **$0** (free tier)
- **Total: ~$99-129/month**

---

## Next Steps

1. ✅ Deploy frontend to Vercel
2. ✅ Deploy backend to Railway
3. ✅ Setup database (PlanetScale/Railway)
4. ✅ Configure environment variables
5. ✅ Run migrations
6. ✅ Test all features
7. ✅ Setup monitoring
8. ✅ Configure backups
9. ✅ Add custom domain
10. ✅ Enable SSL
11. ✅ Launch! 🚀

---

**Need help? Check docs or raise an issue!**
