# 🏦 OTC Platform - Backend API

**Production-Ready OTC Trading Platform**  
Built with NestJS + Prisma + PostgreSQL (Supabase)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

---

## 🚀 Current Status

**Phase:** Production Ready - Identity Module Complete ✅  
**Last Updated:** March 1, 2026  
**Deployment:** Railway + Supabase

### ✅ What's Ready

- ✅ Complete Identity Service (Auth, JWT, Email Verification)
- ✅ Production database schema (15 tables, all relations)
- ✅ Supabase PostgreSQL integration
- ✅ Email OTP verification system
- ✅ Health check endpoints for Railway
- ✅ Security hardening (JWT, CORS, validation)
- ✅ Swagger API documentation
- ✅ Graceful shutdown & error handling
- ✅ Railway deployment configuration

### 🎯 Quick Links

- 📚 **[Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md)** - Deploy in 5 minutes
- 🔧 **[API Reference](./API_REFERENCE.md)** - Complete endpoint documentation
- 📧 **[Email Setup Guide](./EMAIL_VERIFICATION_GUIDE.md)** - Configure Gmail SMTP

---

## 🎯 Project Overview

A professional OTC (Over-The-Counter) trading platform with:

- **User Authentication** - Email/password with JWT tokens
- **Email Verification** - OTP-based verification system
- **Multi-Role Support** - BUYER, SELLER, ADMIN, ENABLER
- **Secure Architecture** - Production-ready security practices
- **Escrow Protection** - Funds locked during trades (coming soon)
- **Multi-Currency** - MAAL, USDT, USD, MYR support (coming soon)

---

## 🏗️ Architecture

### Identity Service (Production Ready)

```
apps/identity/
├── auth/                    # Authentication & JWT
│   ├── register            # ✅ User registration with OTP
│   ├── login               # ✅ Email/password authentication
│   ├── verify-email        # ✅ OTP verification
│   ├── resend-otp          # ✅ Resend verification code
│   └── refresh             # ✅ Token refresh
├── users/                   # User management
│   ├── /me                 # ✅ Get current user profile
│   ├── /:id                # ✅ Get user by ID
│   └── /switch-role        # ✅ Switch BUYER ↔ SELLER
└── health/                  # Health checks for Railway
    ├── /health             # ✅ Service health status
    ├── /health/ready       # ✅ Readiness probe
    └── /health/live        # ✅ Liveness probe
```

### Database (Supabase PostgreSQL)

15 tables ready for full platform features:
- Users, Wallets, Ledger Entries
- OTC Ads, Orders, Disputes
- Audit Logs, KYC Records
- And more...

📖 **See [prisma/schema.prisma](./prisma/schema.prisma) for complete schema**

---

## 🚀 Quick Start

### Option 1: Deploy to Railway (Recommended)

**5-Minute Production Deployment:**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Railway"
   git push
   ```

2. **Deploy on Railway**
   - Go to https://railway.app/new
   - Connect GitHub repo
   - Add environment variables (see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md))
   - Deploy!

3. **Your API is live!**
   ```
   https://your-app.up.railway.app/api/v1/health
   ```

📚 **Full guide:** [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

### Option 2: Local Development

**Prerequisites:**
```bash
node >= 18.x
npm >= 9.x
```

**Setup:**

**Setup:**

```bash
# 1. Clone and install
git clone <your-repo>
cd otc-backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env - add Supabase DATABASE_URL and Gmail SMTP

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations (creates tables in Supabase)
npx prisma migrate deploy

# 5. Start development server
npm run start:dev

# 6. Open API documentation
# http://localhost:3001/api/docs
```

---

## 📚 API Endpoints

### Base URL
- **Development:** `http://localhost:3001/api/v1`
- **Production:** `https://your-app.up.railway.app/api/v1`

### Authentication Endpoints (Public)

```bash
# Register new user
POST   /auth/register
Body: { email, password, role }

# Login
POST   /auth/login
Body: { email, password }

# Verify email with OTP
POST   /auth/verify-email
Body: { email, otp }

# Resend OTP code
POST   /auth/resend-otp
Body: { email }

# Refresh access token
POST   /auth/refresh
Body: { refreshToken }
```

### User Endpoints (Protected - JWT Required)

```bash
# Get current user profile
GET    /users/me
Headers: { Authorization: Bearer <token> }

# Get user by ID
GET    /users/:id
Headers: { Authorization: Bearer <token> }

# Switch role (BUYER ↔ SELLER)
PATCH  /users/switch-role
Headers: { Authorization: Bearer <token> }
```

### Health Check (Public)

```bash
# Service health status
GET    /health

# Readiness probe (for Railway)
GET    /health/ready

# Liveness probe (for Railway)
GET    /health/live
```

### Example: Complete Registration Flow

```bash
# 1. Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123!",
    "role": "BUYER"
  }'

# Response:
# {
#   "message": "Registration successful! Check your email for verification code.",
#   "email": "alice@example.com",
#   "emailSent": true
# }

# 2. Check email for 6-digit OTP code

# 3. Verify email
curl -X POST http://localhost:3001/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "otp": "123456"
  }'

# Response:
# {
#   "message": "Email verified successfully! You can now login.",
#   "isVerified": true
# }

# 4. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123!"
  }'

# Response:
# {
#   "user": {
#     "id": "uuid",
#     "email": "alice@example.com",
#     "role": "BUYER",
#     "kycStatus": "PENDING"
#   },
#   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "expiresIn": 900
# }

# 5. Access protected endpoints
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

📚 **Full API docs:** http://localhost:3001/api/docs (Swagger)

---

## 🗄️ Database

### Supabase PostgreSQL

Connected via `DATABASE_URL` environment variable:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### Schema (15 Tables)

**Core Tables:**
- `users` - User accounts with roles
- `wallets` - Multi-currency balances
- `ledger_entries` - Double-entry accounting
- `otc_ads` - Seller offers (coming soon)
- `orders` - Trade transactions (coming soon)
- `disputes` - Admin resolution (coming soon)

### Prisma Commands

```bash
# View database in browser
npx prisma studio

# Generate Prisma client
npx prisma generate

# Apply migrations to Supabase
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name description
```

---

## 🔐 Security

### JWT Configuration

**⚠️ CRITICAL:** Change default JWT secrets in production!

```bash
# Generate secure secrets
openssl rand -base64 32

# Add to .env or Railway variables
JWT_ACCESS_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
```

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&#)

### Security Features

✅ Password hashing (bcrypt, 12 rounds)  
✅ JWT token authentication  
✅ Email verification required  
✅ CORS protection  
✅ Request validation (class-validator)  
✅ SQL injection protection (Prisma)  
✅ XSS protection (sanitization)

---

## 📧 Email Configuration

Identity service sends OTP verification emails via SMTP.

**Gmail Setup (Recommended):**

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
   ```bash
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

📚 **Full guide:** [EMAIL_VERIFICATION_GUIDE.md](./EMAIL_VERIFICATION_GUIDE.md)

---

## 🛠️ Development

### Running Services

```bash
# Development mode (auto-reload)
npm run start:dev

# Production mode
npm run start:prod

# Build
npm run build

# Lint
npm run lint

# Format
npm run format
```

### Environment Variables

**Essential:**
```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# JWT Secrets (change in production!)
JWT_ACCESS_SECRET=generate-with-openssl-rand-base64-32
JWT_REFRESH_SECRET=generate-with-openssl-rand-base64-32

# Email (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# API Port
PORT=3001
```

See [.env.example](./.env.example) for all variables.

---

## 🐛 Troubleshooting

### Database Connection Failed
```
Error: Can't reach database server
```
**Solution:**
- Check `DATABASE_URL` in `.env`
- Verify Supabase credentials
- Test connection: `psql <DATABASE_URL>`

### Prisma Client Not Found
```
Error: Cannot find module '@prisma/client'
```
**Solution:**
```bash
npx prisma generate
```

### Email Not Sending
```
Error: SMTP connection failed
```
**Solution:**
- Verify Gmail App Password (not regular password)
- Check SMTP_USER and SMTP_PASS in `.env`
- See [EMAIL_VERIFICATION_GUIDE.md](./EMAIL_VERIFICATION_GUIDE.md)

### Port Already in Use
```
Error: Port 3001 is already in use
```
**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Railway Build Fails
```
Error: Build failed
```
**Solution:**
- Check Railway logs
- Ensure all environment variables set
- Verify `DATABASE_URL` is correct
- See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

---

## 📝 Documentation

- 📚 **[API Reference](./API_REFERENCE.md)** - Complete endpoint documentation
- 🚂 **[Railway Deployment](./RAILWAY_DEPLOYMENT.md)** - Production deployment guide
- 📧 **[Email Setup](./EMAIL_VERIFICATION_GUIDE.md)** - SMTP configuration
- 🏗️ **[Architecture](./docs/ARCHITECTURE_EXPLAINED.md)** - System design
- 📖 **[Contributing](./CONTRIBUTING.md)** - Development guidelines

---

## 🚧 Roadmap

### ✅ Phase 1: Identity Module (COMPLETE)
- [x] User registration with email verification
- [x] JWT authentication
- [x] Role management (BUYER, SELLER)
- [x] Password security (bcrypt)
- [x] Health checks for Railway
- [x] Production deployment config

### 🔄 Phase 2: Trading Module (Next)
- [ ] OTC Ad creation (Sellers)
- [ ] Order matching engine
- [ ] Escrow system
- [ ] Wallet management

### 🔮 Phase 3: Advanced Features
- [ ] KYC verification integration
- [ ] Dispute resolution system
- [ ] Admin dashboard
- [ ] Real-time notifications
- [ ] Analytics & reporting

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## 📄 License

This project is proprietary and confidential.

---

## 🆘 Support

- **Documentation:** Check docs in this repository
- **Issues:** Create a GitHub issue
- **Railway:** https://docs.railway.app/
- **Supabase:** https://supabase.com/docs

---

**Version:** 1.0.0 (Production Ready - Identity Module)  
**Status:** ✅ Deployed on Railway  
**Last Updated:** March 1, 2026
