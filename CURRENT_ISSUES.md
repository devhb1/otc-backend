# 🚨 Current Issues & Solutions

**Last Updated:** March 3, 2026

## Current Status

### ✅ What's Working
- ✅ Backend is deployed and running on Railway
- ✅ Health endpoint responding: `/api/v1/health`
- ✅ Database connected (Supabase PostgreSQL)
- ✅ Registration endpoint accepting requests (201 Created)
- ✅ Frontend deployed on Vercel
- ✅ Theme system (Light/Dark mode) working

### ❌ What's Broken
- ❌ **OTP emails not being sent** (SMTP not configured)
- ❌ **Users cannot verify their email** (no OTP received)
- ❌ **Possible CORS issues** from Vercel → Railway

---

## Issue #1: Registration - 405 Method Not Allowed

### Root Cause
CORS configuration was too restrictive. Only allowed hardcoded origins.

### ✅ Solution Applied
Updated `otc-backend/apps/identity/src/main.ts`:
- Now allows all `*.vercel.app` domains
- Now allows all `*.up.railway.app` domains  
- Better logging for CORS debugging

### Next Steps
1. Commit and push backend changes
2. Railway will auto-deploy
3. Test registration from Vercel frontend

---

## Issue #2: OTP Emails Not Being Sent

### Root Cause
**SMTP environment variables not configured on Railway.**

Current test shows:
```json
{
  "message": "Registration successful! ...",
  "emailSent": false  // ❌ Not sending emails!
}
```

### ✅ Solution

#### Option A: Automated Setup (Recommended)
```bash
cd /Users/harshit/Desktop/OTC/otc-platform

# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run setup script
./railway-setup.sh
```

The script will:
1. Generate secure JWT secrets
2. Prompt for database URL
3. Prompt for Gmail credentials
4. Prompt for frontend URL
5. Set all variables on Railway
6. Trigger automatic redeployment

#### Option B: Manual Setup
Go to [Railway Dashboard](https://railway.app) → otc-backend-production → Variables

Add these variables:

```env
# Required for email (OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password  # See below
SMTP_FROM=noreply@otcplatform.com

# Required for CORS
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app

# Required for JWT (if not set)
JWT_ACCESS_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
```

#### How to Get Gmail App Password

1. **Enable 2-Factor Authentication:**
   - Go to: https://myaccount.google.com/security
   - Turn on "2-Step Verification"

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "OTC Platform Backend"
   - Copy the 16-character password
   - **Remove all spaces:** `abcd efgh ijkl mnop` → `abcdefghijklmnop`

3. **Add to Railway:**
   - Variable: `SMTP_PASS`
   - Value: `abcdefghijklmnop` (16 chars, no spaces)

#### Generate JWT Secrets (if needed)
```bash
# Run these locally, copy output to Railway
openssl rand -base64 32  # For JWT_ACCESS_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

### Verify Email is Working

After setting variables, Railway will redeploy (2-3 minutes).

Then test:
```bash
curl -X POST https://otc-backend-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com","password":"Test123!@#","role":"BUYER"}'
```

**Expected Response:**
```json
{
  "message": "Registration successful! Please check your email for verification code.",
  "email": "your-test-email@gmail.com",
  "emailSent": true  // ✅ Should be true now!
}
```

Check your email inbox (and spam folder) for:
```
Subject: Verify Your Email - OTC Platform
Body: Your verification code is: 123456
```

---

## Issue #3: Frontend Cannot Verify Email

### Root Cause
No OTP received, so users cannot complete registration.

### ✅ Solution
Once Issue #2 (SMTP) is fixed, this will work automatically.

Current flow:
1. User registers → Backend creates account (unverified)
2. Backend generates 6-digit OTP
3. ❌ Email fails to send (SMTP not configured)
4. User redirected to verify-email page
5. User has no OTP to enter

After SMTP fix:
1. User registers → Backend creates account
2. Backend generates OTP
3. ✅ Email sent successfully
4. User receives email within 30 seconds
5. User enters OTP and verifies account

---

## Testing Checklist

### 1. Test Backend Health
```bash
curl https://otc-backend-production.up.railway.app/api/v1/health
```

**Expected:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

### 2. Test Registration (Before SMTP Fix)
```bash
curl -X POST https://otc-backend-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@#","role":"BUYER"}'
```

**Current Response:**
```json
{
  "message": "Registration successful! ...",
  "emailSent": false  // ❌ Need to fix SMTP
}
```

### 3. Test Registration (After SMTP Fix)
Same command, but expect:
```json
{
  "message": "Registration successful! ...",
  "emailSent": true  // ✅ Fixed!
}
```

### 4. Test Frontend Registration
1. Go to: `https://your-app.vercel.app/register`
2. Fill form:
   - Email: `your-email@gmail.com`
   - Password: `Test123!@#`
   - Role: Buyer
3. Submit
4. Check email for OTP
5. Enter OTP on verify-email page
6. Should see success and redirect to login

---

## Quick Fix Summary

**To fix all issues right now:**

1. **Update Backend (CORS Fix):**
   ```bash
   cd /Users/harshit/Desktop/OTC/otc-platform/otc-backend
   git add apps/identity/src/main.ts
   git commit -m "fix: Update CORS to allow Vercel and Railway domains"
   git push
   ```

2. **Configure SMTP on Railway:**
   - Get Gmail App Password (steps above)
   - Add to Railway environment variables
   - Wait 2-3 minutes for redeployment

3. **Test:**
   - Register new account from frontend
   - Check email for OTP
   - Verify email
   - Login successfully

---

## Files Changed

### Backend
- ✅ `apps/identity/src/main.ts` - Updated CORS configuration

### Documentation
- ✅ `DEPLOYMENT_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
- ✅ `railway-setup.sh` - Automated Railway setup script
- ✅ `CURRENT_ISSUES.md` - This file

---

## Next Steps (Priority Order)

1. **Immediate (5 minutes):**
   - [ ] Commit and push CORS fix
   - [ ] Add SMTP credentials to Railway
   - [ ] Wait for Railway redeployment

2. **Verification (10 minutes):**
   - [ ] Test health endpoint
   - [ ] Test registration (verify emailSent: true)
   - [ ] Test full flow (register → email → verify → login)

3. **Optional (Later):**
   - [ ] Add rate limiting to prevent spam
   - [ ] Add email templates with HTML/CSS
   - [ ] Add monitoring/alerts for email failures
   - [ ] Set up separate SMTP service (SendGrid/Mailgun)

---

## Support

If issues persist after following these steps:

1. Check [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) for detailed debugging
2. Check Railway logs: `railway logs`
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**Status:** 🔴 **Action Required**  
**Blockers:** SMTP configuration needed on Railway  
**ETA:** ~10 minutes to fix once SMTP is configured
