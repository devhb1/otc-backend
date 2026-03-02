# OTC Platform Backend - Railway Deployment Guide

## 🚂 Deploying to Railway

### Prerequisites
- Railway account: https://railway.app/
- GitHub repository with backend code
- Supabase account with database created
- **Node.js 20+** (configured in nixpacks.toml)

### Quick Deployment (5 minutes)

#### Step 1: Push to GitHub
```bash
cd /Users/harshit/Desktop/OTC/otc-platform/otc-backend
git add .
git commit -m "Production ready for Railway"
git push origin main
```

#### Step 2: Deploy on Railway

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Click "Deploy Now"

2. **Configure Environment Variables**
   - Go to your project → Variables tab
   - Add the following variables:

```bash
# Database (from Supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# JWT Secrets (generate new ones!)
JWT_ACCESS_SECRET=<run: openssl rand -base64 32>
JWT_REFRESH_SECRET=<run: openssl rand -base64 32>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=noreply@otcplatform.com

# API Configuration
PORT=3001
NODE_ENV=production

# Frontend URL (Vercel deployment)
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app

# Supabase (optional)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

#### Step 3: Get Your Backend URL

After deployment completes:
- Railway will provide a URL like: `https://your-app.up.railway.app`
- Test health check: `https://your-app.up.railway.app/api/v1/health`

#### Step 4: Update Frontend

In your frontend `.env.production`:
```bash
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

### Deployment Verification

Test your deployed backend:

```bash
# Health check
curl https://your-app.up.railway.app/api/v1/health

# Should return:
# {
#   "status": "ok",
#   "database": "connected",
#   "uptime": 123.45,
#   ...
# }

# Test registration
curl -X POST https://your-app.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "role": "BUYER"
  }'
```

### Monitoring & Logs

**View Logs:**
- Railway Dashboard → Your Project → Deployments → View Logs

**Health Checks:**
- Railway automatically monitors `/api/v1/health`
- Service restarts on failure

**Database Metrics:**
- Supabase Dashboard → Your Project → Database → Usage

### Common Issues & Solutions

#### Issue: Node.js Version Incompatibility
```
npm error │ Prisma only supports Node.js versions 20.19+, 22.12+, 24.0+. │
npm error │ Please upgrade your Node.js version.                        │
```
**Problem:** Railway using Node.js 18, but Prisma 7 requires Node.js 20+

**Solution:** 
- Update `nixpacks.toml`:
  ```toml
  [phases.setup]
  nixPkgs = ["nodejs-20_x", "openssl"]  # Changed from nodejs-18_x
  ```
- Push to GitHub to trigger redeployment
- Railway will automatically use Node.js 20

**Already Fixed:** This is now configured correctly in the repository.

#### Issue: Build Fails
```
Error: Prisma schema not found
```
**Solution:** Ensure `nixpacks.toml` includes `npx prisma generate`

#### Issue: Database Connection Fails
```
Error: Can't reach database server
```
**Solution:** 
- Check `DATABASE_URL` in Railway variables
- Ensure Supabase allows Railway IP (should be automatic)
- Test connection from local: `psql <DATABASE_URL>`

#### Issue: CORS Errors
```
Access-Control-Allow-Origin error
```
**Solution:**
- Update `FRONTEND_URL` in Railway to match Vercel URL
- Ensure no trailing slash in URLs

### Production Checklist

- [ ] JWT secrets changed from defaults
- [ ] Gmail App Password configured
- [ ] `NODE_ENV=production` set
- [ ] `FRONTEND_URL` points to Vercel
- [ ] Database migrations applied
- [ ] Health check returns 200
- [ ] Test registration endpoint
- [ ] Test login endpoint
- [ ] Test email OTP delivery
- [ ] Check Railway logs for errors

### Auto-Deployment

Railway automatically deploys on:
- Every push to `main` branch
- Manual trigger from dashboard

To disable auto-deploy:
- Railway Dashboard → Settings → Deployments → Toggle off

### Scaling

**Free Tier Limits:**
- 500 hours/month
- $5 credit/month
- Sleeps after 30min inactivity

**To Prevent Sleep:**
- Upgrade to Hobby plan ($5/month)
- Or ping `/api/v1/health` every 10 minutes

**To Scale Up:**
- Railway Dashboard → Settings → Resources
- Increase CPU/Memory as needed

### Rollback

If deployment breaks:
1. Railway Dashboard → Deployments
2. Find last working deployment
3. Click "Redeploy"

### Environment-Specific Configs

**Development:**
```bash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Production (Railway):**
```bash
NODE_ENV=production
PORT=3001  # Railway sets PORT automatically
FRONTEND_URL=https://your-frontend.vercel.app
```

### Cost Estimation

**Free Tier:**
- Good for development/testing
- Sleeps after inactivity

**Hobby Plan ($5/month):**
- 500+ deployment hours
- No sleep
- Custom domain support

**Pro Plan ($20/month):**
- Priority support
- More resources
- Team features

### Support

- Railway Docs: https://docs.railway.app/
- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.gg/railway

### Next Steps

After Railway deployment:
1. Deploy frontend to Vercel
2. Test full auth flow (register → verify → login)
3. Set up monitoring (optional)
4. Configure custom domain (optional)
5. Enable CDN (optional)

---

**🎉 Your backend is now production-ready on Railway!**
