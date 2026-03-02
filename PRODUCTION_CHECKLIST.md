# OTC Platform Backend - Production Checklist

## ✅ Pre-Deployment Checklist

### Environment Configuration
- [ ] `DATABASE_URL` updated with Supabase connection string
- [ ] `JWT_ACCESS_SECRET` changed from default (use: `openssl rand -base64 32`)
- [ ] `JWT_REFRESH_SECRET` changed from default (use: `openssl rand -base64 32`)
- [ ] `SMTP_USER` and `SMTP_PASS` configured with Gmail App Password
- [ ] `FRONTEND_URL` set to Vercel deployment URL
- [ ] `NODE_ENV=production` set in Railway
- [ ] `PORT=3001` set (or use Railway's dynamic PORT)

### Database
- [ ] Supabase project created
- [ ] Database connection tested: `psql $DATABASE_URL`
- [ ] Prisma migrations applied: `npx prisma migrate deploy`
- [ ] Database tables created (15 tables)
- [ ] Prisma client generated: `npx prisma generate`

### Code Quality
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Linting passes: `npm run lint`
- [ ] All imports resolved

### Security
- [ ] JWT secrets are NOT default values
- [ ] Password validation enforced (8+ chars, uppercase, lowercase, number, special)
- [ ] CORS configured with frontend URL
- [ ] HTTPS enforced in production
- [ ] No sensitive data in logs

### Email System
- [ ] Gmail 2-Step Verification enabled
- [ ] Gmail App Password generated
- [ ] Test email sends successfully
- [ ] OTP emails received
- [ ] Welcome emails received

### Railway Configuration
- [ ] GitHub repository connected
- [ ] All environment variables added
- [ ] Build command correct: `npm install && npx prisma generate && npm run build`
- [ ] Start command correct: `npx prisma migrate deploy && npm run start:prod`
- [ ] Health check path set: `/api/v1/health`

## 🧪 Testing Checklist

### Health Checks
```bash
# Local
curl http://localhost:3001/api/v1/health

# Production
curl https://your-app.up.railway.app/api/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 123.45,
  "responseTime": "15.23ms"
}
```

### Registration Flow
```bash
# 1. Register user
curl -X POST https://your-app.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "role": "BUYER"
  }'

# Expected: 201 Created
# Expected: Email sent with OTP
```

### Email Verification
```bash
# 2. Verify email (use OTP from email)
curl -X POST https://your-app.up.railway.app/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'

# Expected: 200 OK
# Expected: isVerified = true
```

### Login Flow
```bash
# 3. Login
curl -X POST https://your-app.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Expected: 200 OK
# Expected: accessToken and refreshToken
```

### Protected Endpoints
```bash
# 4. Get user profile (use accessToken from login)
curl https://your-app.up.railway.app/api/v1/users/me \
  -H "Authorization: Bearer <accessToken>"

# Expected: 200 OK
# Expected: User profile data
```

### Token Refresh
```bash
# 5. Refresh access token (after 15 minutes)
curl -X POST https://your-app.up.railway.app/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'

# Expected: 200 OK
# Expected: New accessToken
```

## 🚨 Post-Deployment Verification

### Railway Dashboard
- [ ] Deployment status: "Deployed"
- [ ] Build logs show no errors
- [ ] Runtime logs show server started
- [ ] Health check passing
- [ ] No crash loops

### Database Verification
- [ ] Supabase shows connections
- [ ] Tables created correctly
- [ ] Test user registered successfully
- [ ] Email verification record created
- [ ] Wallets created for test user

### Email Verification
- [ ] OTP email received (check spam folder)
- [ ] OTP code works for verification
- [ ] Welcome email received after verification
- [ ] Resend OTP works

### API Documentation
- [ ] Swagger UI accessible: `https://your-app.up.railway.app/api/docs`
- [ ] All endpoints documented
- [ ] Try out endpoints work

### Frontend Integration
- [ ] Frontend can call backend API
- [ ] No CORS errors in browser console
- [ ] Registration flow works end-to-end
- [ ] Login flow works
- [ ] Token refresh works
- [ ] Protected routes require auth

## 🔍 Monitoring Checklist

### Logs
- [ ] Railway logs show requests
- [ ] No error stack traces
- [ ] Database queries logged (if debug enabled)
- [ ] Email sending logged

### Performance
- [ ] Health check responds < 100ms
- [ ] API endpoints respond < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks

### Error Handling
- [ ] Invalid credentials return 401
- [ ] Invalid email returns 400
- [ ] Duplicate email returns 409
- [ ] Expired OTP returns 400
- [ ] Missing JWT returns 401

## 🐛 Common Issues

### Issue: Build fails on Railway
**Symptoms:** Build logs show "Prisma not found"  
**Solution:** Ensure `npx prisma generate` in build command

### Issue: Database connection fails
**Symptoms:** Health check shows "database": "error"  
**Solution:** Verify `DATABASE_URL` in Railway variables

### Issue: Emails not sending
**Symptoms:** Registration succeeds but no email received  
**Solution:** Check SMTP credentials, check spam folder

### Issue: CORS errors
**Symptoms:** Browser console shows "blocked by CORS"  
**Solution:** Update `FRONTEND_URL` in Railway to match Vercel URL

### Issue: JWT errors
**Symptoms:** Login returns 401 immediately  
**Solution:** Verify JWT secrets are set correctly

## 📊 Production Metrics

### Expected Performance
- **Health Check:** < 100ms
- **Registration:** < 500ms
- **Login:** < 300ms
- **Database Queries:** < 50ms average

### Resource Usage
- **Memory:** ~150-300MB
- **CPU:** < 10% average
- **Database Connections:** 1-5 active

## 🎯 Success Criteria

All boxes checked = Production Ready ✅

- [ ] All environment variables configured
- [ ] Database connected and migrated
- [ ] Build succeeds without errors
- [ ] Health check returns 200 OK
- [ ] Registration flow works
- [ ] Email verification works
- [ ] Login flow works
- [ ] Protected endpoints require auth
- [ ] Token refresh works
- [ ] Frontend can communicate with backend
- [ ] No CORS errors
- [ ] Logs show no errors
- [ ] Railway deployment stable

## 🚀 Go Live!

Once all checks pass:

1. Update frontend with production API URL
2. Test complete user journey
3. Monitor Railway logs for 24 hours
4. Set up alerts (optional)
5. Document any issues
6. Celebrate! 🎉

---

**Last Updated:** March 1, 2026  
**Deployment Platform:** Railway  
**Database:** Supabase PostgreSQL  
**Status:** Production Ready ✅
