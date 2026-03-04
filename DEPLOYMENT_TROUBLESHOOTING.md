# Deployment Troubleshooting Guide

This guide helps resolve common deployment issues with the OTC Platform.

## Table of Contents
- [Quick Health Check](#quick-health-check)
- [Issue 1: 405 Method Not Allowed](#issue-1-405-method-not-allowed)
- [Issue 2: OTP Emails Not Sending](#issue-2-otp-emails-not-sending)
- [Issue 3: CORS Errors](#issue-3-cors-errors)
- [Railway Backend Setup](#railway-backend-setup)
- [Vercel Frontend Setup](#vercel-frontend-setup)

---

## Quick Health Check

### 1. Check Backend Health
```bash
curl https://otc-backend-production.up.railway.app/api/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-03T...",
  "service": "identity",
  "database": "connected",
  "uptime": 3600.5,
  "responseTime": "45.32ms",
  "environment": "production"
}
```

**If you get an error:**
- ❌ Connection refused → Backend is not deployed or crashed
- ❌ 502/503 → Backend is starting up (wait 30 seconds)
- ❌ Timeout → Railway service is down

### 2. Check Frontend
```bash
# Check if frontend can reach backend
curl -X POST https://otc-backend-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@#","role":"BUYER"}'
```

---

## Issue 1: 405 Method Not Allowed

### Symptoms
- Registration fails with "405 Method Not Allowed"
- Console error: `Failed to load resource: the server responded with a status of 405`

### Causes & Solutions

#### Cause 1: CORS Preflight Failure
The browser sends an OPTIONS request before POST, which might be blocked.

**Solution:** ✅ **Already Fixed** - Updated CORS configuration to allow:
- All Vercel deployments (`*.vercel.app`)
- All Railway deployments (`*.up.railway.app`)
- OPTIONS method for preflight requests

#### Cause 2: Wrong API URL
Frontend is calling wrong endpoint.

**Check:**
```bash
# In frontend .env.local
cat otc-frontend/.env.local
```

**Should contain:**
```env
NEXT_PUBLIC_API_URL=https://otc-backend-production.up.railway.app
```

**NOT:**
```env
NEXT_PUBLIC_API_URL=https://otc-backend-production.up.railway.app/api/v1  # ❌ WRONG
```

The `/api/v1` prefix is added automatically by the backend.

#### Cause 3: Backend Not Deployed
Backend might not be running on Railway.

**Verify:**
1. Go to [Railway Dashboard](https://railway.app)
2. Check if `otc-backend-production` service is running
3. Look for recent deployments and logs

#### Cause 4: Missing Environment Variables
Backend needs proper configuration to start.

**Required Variables on Railway:**
```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=<32-char-secret>
JWT_REFRESH_SECRET=<32-char-secret>
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

---

## Issue 2: OTP Emails Not Sending

### Symptoms
- Registration successful but no email received
- Backend logs show email sending failures

### Solution: Configure Gmail SMTP

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification"

#### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (Custom name)"
3. Name it "OTC Platform"
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

#### Step 3: Add to Railway Environment Variables
Go to Railway → otc-backend-production → Variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop  # 16-char app password (no spaces)
SMTP_FROM=noreply@otcplatform.com
```

#### Step 4: Redeploy Backend
After adding variables:
1. Railway will automatically redeploy
2. Wait 1-2 minutes for deployment
3. Check logs: `Settings → Logs`

#### Step 5: Test Email
Register a test account and check:
- ✅ Backend logs show: "✅ OTP email sent to..."
- ✅ Email appears in inbox (check spam folder)
- ❌ Backend logs show: "❌ Failed to send OTP..." → Check SMTP credentials

### Alternative: Use SendGrid (If Gmail Fails)
If Gmail blocks emails, use SendGrid:

1. Sign up at [SendGrid](https://sendgrid.com)
2. Create API key
3. Update Railway variables:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
```

---

## Issue 3: CORS Errors

### Symptoms
- Console error: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Requests fail before reaching backend

### Solution: Update CORS Configuration

#### Frontend Not in Allowed Origins
Backend now automatically allows:
- `*.vercel.app` (all Vercel deployments)
- `*.up.railway.app` (all Railway deployments)
- `localhost:3000` (local development)

If you still get CORS errors, add your specific domain:

**Railway Variables:**
```env
FRONTEND_URL=https://your-specific-app.vercel.app
CORS_ORIGIN=https://your-specific-app.vercel.app
```

#### Check Backend Logs
Railway logs will show CORS blocks:
```
❌ CORS blocked request from: https://unknown-app.vercel.app
   Allowed origins: http://localhost:3000, ...
   Tip: Add this origin to FRONTEND_URL environment variable
```

---

## Railway Backend Setup

### Complete Environment Variables
Required for production:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@host:5432/postgres

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-32-char-secret-here
JWT_REFRESH_SECRET=your-32-char-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=noreply@otcplatform.com

# Frontend CORS
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app

# Environment
NODE_ENV=production
PORT=3000  # Railway sets this automatically
```

### Generate JWT Secrets
```bash
# Run these commands locally:
openssl rand -base64 32  # For JWT_ACCESS_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

### Deployment Checklist
- [ ] All environment variables set
- [ ] Database URL valid (test connection)
- [ ] SMTP credentials working
- [ ] Health check returns 200 OK
- [ ] Swagger docs accessible at `/api/docs`

---

## Vercel Frontend Setup

### Environment Variables
Add in Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://otc-backend-production.up.railway.app
NODE_ENV=production
```

### Deployment Checklist
- [ ] Environment variables set
- [ ] Build successful
- [ ] Can access homepage
- [ ] Theme toggle works
- [ ] Registration form submits (check Network tab)

---

## Testing Registration Flow

### Step-by-Step Test

#### 1. Open Registration Page
```
https://your-app.vercel.app/register
```

#### 2. Fill Form
- Email: `test@example.com`
- Password: `Test123!@#`
- Confirm Password: `Test123!@#`
- Role: `Buyer`

#### 3. Submit & Monitor
Open browser DevTools → Network tab:
- ✅ POST request to `/api/v1/auth/register`
- ✅ Status: 201 Created
- ✅ Response: `{"message": "Registration successful! ..."}`

#### 4. Check Email
- ✅ Email received (check spam)
- ✅ Contains 6-digit OTP
- ✅ Valid for 10 minutes

#### 5. Verify Email
- ✅ Redirected to `/verify-email?email=...`
- ✅ Enter 6-digit OTP
- ✅ Success message appears
- ✅ Redirected to login

### Common Test Failures

#### Registration returns 405
→ See [Issue 1](#issue-1-405-method-not-allowed)

#### Registration succeeds but no email
→ See [Issue 2](#issue-2-otp-emails-not-sending)

#### CORS error in console
→ See [Issue 3](#issue-3-cors-errors)

#### Database error
→ Check DATABASE_URL in Railway variables

---

## Debugging Commands

### Check Backend Logs (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Test API Endpoints

#### Health Check
```bash
curl https://otc-backend-production.up.railway.app/api/v1/health
```

#### Registration (should get 405 if wrong method)
```bash
curl -X POST https://otc-backend-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test123!@#",
    "role": "BUYER"
  }'
```

Expected:
```json
{
  "message": "Registration successful! Please check your email for verification code.",
  "email": "test@test.com",
  "emailSent": true
}
```

#### Check CORS (from browser console)
```javascript
fetch('https://otc-backend-production.up.railway.app/api/v1/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## Still Having Issues?

### 1. Check Railway Service Status
- Visit [Railway Status](https://status.railway.app)
- Check if there's an ongoing incident

### 2. Verify Database Connection
- Test DATABASE_URL with a Postgres client
- Check Supabase dashboard for connection errors

### 3  Review Recent Changes
- Check Git commits since last working version
- Look for environment variable changes

### 4. Contact Support
Include in your message:
- Health check response
- Browser console errors
- Railway logs (last 50 lines)
- Steps to reproduce

---

## Quick Fixes Checklist

If registration is failing:

1. ✅ **Backend Health**: `curl .../api/v1/health` returns 200 OK
2. ✅ **CORS Fixed**: Updated main.ts allows `*.vercel.app` origins
3. ✅ **Environment Variables**: All required variables set on Railway
4. ✅ **SMTP Configured**: Gmail app password set correctly
5. ✅ **Frontend URL**: `.env.local` has correct `NEXT_PUBLIC_API_URL`
6. ✅ **Database Connected**: Health check shows `database: "connected"`
7. ✅ **Recent Deploy**: Railway shows successful deployment in last 5 minutes

If all above are ✅ and still failing:
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Test with curl commands directly
- Check Railway logs for specific error messages

---

## Success Indicators

When everything is working:

### Backend (Railway)
```
🚀 Identity Service running on: http://localhost:3000
📚 API Documentation: http://localhost:3000/api/docs
🌍 Environment: production
✅ Health Check: http://localhost:3000/api/v1/health
✅ Email service ready - SMTP connection verified
```

### Health Endpoint
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 3600
}
```

### Registration Flow
1. User submits form → 201 Created
2. Backend sends email → "✅ OTP email sent to..."
3. User receives email within 30 seconds
4. User enters OTP → Email verified
5. User can log in successfully

---

**Last Updated:** March 3, 2026  
**Version:** 1.0.0
